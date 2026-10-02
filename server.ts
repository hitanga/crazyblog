import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev server must run on port 3000. In Cloud Run, process.env.PORT is 8080 (used by Nginx).
const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure required directories exist
const DATA_DIR = path.resolve(__dirname, 'server/data/posts');
const UPLOAD_DIR = path.resolve(__dirname, 'server/public/uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads route
app.use('/uploads', express.static(UPLOAD_DIR));

// Helper functions for reading posts & comments
function getAllPostsData() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const posts: any[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const postFilePath = path.join(DATA_DIR, entry.name, 'post.json');
      const commentsFilePath = path.join(DATA_DIR, entry.name, 'comments.json');
      if (fs.existsSync(postFilePath)) {
        try {
          const raw = fs.readFileSync(postFilePath, 'utf-8');
          const post = JSON.parse(raw);

          let comments = [];
          if (fs.existsSync(commentsFilePath)) {
            try {
              comments = JSON.parse(fs.readFileSync(commentsFilePath, 'utf-8'));
            } catch (e) {
              comments = [];
            }
          }

          const approvedComments = comments.filter((c: any) => c.approved);
          posts.push({
            ...post,
            commentsCount: approvedComments.length,
            totalCommentsCount: comments.length,
            pendingCommentsCount: comments.filter((c: any) => !c.approved).length,
          });
        } catch (err) {
          console.error(`Error reading post at ${postFilePath}:`, err);
        }
      }
    }
  }

  // Sort descending by date
  return posts.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

function getCommentsForPost(slug: string) {
  const commentsFilePath = path.join(DATA_DIR, slug, 'comments.json');
  if (!fs.existsSync(commentsFilePath)) return [];
  try {
    const raw = fs.readFileSync(commentsFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCommentsForPost(slug: string, comments: any[]) {
  const dir = path.join(DATA_DIR, slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const commentsFilePath = path.join(dir, 'comments.json');
  fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2), 'utf-8');
}

// ========================
// REST API ROUTES
// ========================

// 1. GET /api/posts - All posts with filtering and search
app.get('/api/posts', (req: Request, res: Response) => {
  try {
    let posts = getAllPostsData();
    const { category, search, featured } = req.query;

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      const catNorm = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      posts = posts.filter(
        (p) =>
          p.category &&
          (p.category.toLowerCase() === category.toLowerCase() ||
            p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === catNorm)
      );
    }

    if (featured === 'true') {
      posts = posts.filter((p) => p.featured === true);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.content && p.content.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: posts.length, posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET /api/posts/:slug - Single post detail
app.get('/api/posts/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let postFilePath = path.join(DATA_DIR, slug, 'post.json');
    let actualSlug = slug;

    // If direct folder path not found, search posts for matching seoPermalink or slug
    if (!fs.existsSync(postFilePath)) {
      const allPosts = getAllPostsData();
      const matched = allPosts.find(
        (p) => p.slug === slug || p.seoPermalink === slug || p.id === slug
      );
      if (matched) {
        actualSlug = matched.slug;
        postFilePath = path.join(DATA_DIR, actualSlug, 'post.json');
      }
    }

    if (!fs.existsSync(postFilePath)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = JSON.parse(fs.readFileSync(postFilePath, 'utf-8'));
    const comments = getCommentsForPost(actualSlug);
    const approvedComments = comments.filter((c: any) => c.approved);

    res.json({
      success: true,
      post: {
        ...post,
        seoTitle: post.seoTitle || post.title,
        seoPermalink: post.seoPermalink || post.slug,
        seoDescription: post.seoDescription || post.excerpt || '',
        seoKeywords: post.seoKeywords || '',
        commentsCount: approvedComments.length,
        totalCommentsCount: comments.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST /api/posts - Create new post
app.post('/api/posts', (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      excerpt,
      image,
      category,
      author,
      date,
      content,
      featured,
      seoTitle,
      seoPermalink,
      seoDescription,
      seoKeywords,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Article title is required' });
    }

    const permalinkInput = seoPermalink || slug;
    let cleanSlug = (permalinkInput || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      cleanSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (!cleanSlug) {
      cleanSlug = `post-${Date.now()}`;
    }

    let postDir = path.join(DATA_DIR, cleanSlug);

    // If slug directory already exists, append unique suffix instead of failing
    if (fs.existsSync(postDir)) {
      let counter = 1;
      while (fs.existsSync(path.join(DATA_DIR, `${cleanSlug}-${counter}`))) {
        counter++;
      }
      cleanSlug = `${cleanSlug}-${counter}`;
      postDir = path.join(DATA_DIR, cleanSlug);
    }

    fs.mkdirSync(postDir, { recursive: true });

    const newPost = {
      id: cleanSlug,
      title: title.trim(),
      slug: cleanSlug,
      excerpt: (excerpt || '').trim(),
      image: image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg',
      category: category || 'General',
      author: author || 'Admin',
      date: date || new Date().toISOString().split('T')[0],
      content: content || '<p>Write your story here...</p>',
      featured: Boolean(featured),
      seoTitle: (seoTitle || '').trim() || title.trim(),
      seoPermalink: cleanSlug,
      seoDescription: (seoDescription !== undefined ? seoDescription : (excerpt || '')).trim(),
      seoKeywords: (seoKeywords || '').trim(),
    };

    fs.writeFileSync(path.join(postDir, 'post.json'), JSON.stringify(newPost, null, 2), 'utf-8');
    fs.writeFileSync(path.join(postDir, 'comments.json'), JSON.stringify([], null, 2), 'utf-8');

    res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. PUT /api/posts/:slug - Edit post
app.put('/api/posts/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let oldDir = path.join(DATA_DIR, slug);

    if (!fs.existsSync(oldDir)) {
      const allPosts = getAllPostsData();
      const matched = allPosts.find(
        (p) => p.slug === slug || p.id === slug || p.seoPermalink === slug
      );
      if (matched) {
        oldDir = path.join(DATA_DIR, matched.slug || matched.id);
      }
    }

    if (!fs.existsSync(oldDir)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const {
      title,
      slug: newSlugInput,
      excerpt,
      image,
      category,
      author,
      date,
      content,
      featured,
      seoTitle,
      seoPermalink,
      seoDescription,
      seoKeywords,
    } = req.body;

    const desiredSlug = seoPermalink || newSlugInput || slug;
    const newSlug = desiredSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let targetDir = oldDir;

    // Handle slug change if user updated it to a different valid slug
    const currentFolderName = path.basename(oldDir);
    if (newSlug && newSlug !== currentFolderName) {
      targetDir = path.join(DATA_DIR, newSlug);
      if (fs.existsSync(targetDir) && targetDir !== oldDir) {
        // If collision, keep current folder or append timestamp
        targetDir = oldDir;
      } else {
        fs.renameSync(oldDir, targetDir);
      }
    }

    const postFilePath = path.join(targetDir, 'post.json');
    let existingPost = {};
    if (fs.existsSync(postFilePath)) {
      try {
        existingPost = JSON.parse(fs.readFileSync(postFilePath, 'utf-8'));
      } catch (e) {
        existingPost = {};
      }
    }

    const finalSlug = path.basename(targetDir);
    const updatedPost = {
      ...existingPost,
      id: finalSlug,
      title: title ? title.trim() : (existingPost as any).title,
      slug: finalSlug,
      excerpt: excerpt !== undefined ? excerpt.trim() : (existingPost as any).excerpt,
      image: image || (existingPost as any).image,
      category: category || (existingPost as any).category || 'General',
      author: author || (existingPost as any).author || 'Admin',
      date: date || (existingPost as any).date || new Date().toISOString().split('T')[0],
      content: content !== undefined ? content : (existingPost as any).content,
      featured: featured !== undefined ? Boolean(featured) : (existingPost as any).featured,
      seoTitle: seoTitle !== undefined ? seoTitle.trim() : ((existingPost as any).seoTitle || (title ? title.trim() : (existingPost as any).title)),
      seoPermalink: finalSlug,
      seoDescription: seoDescription !== undefined ? seoDescription.trim() : ((existingPost as any).seoDescription || (excerpt !== undefined ? excerpt.trim() : (existingPost as any).excerpt || '')),
      seoKeywords: seoKeywords !== undefined ? seoKeywords.trim() : ((existingPost as any).seoKeywords || ''),
    };

    fs.writeFileSync(postFilePath, JSON.stringify(updatedPost, null, 2), 'utf-8');

    res.json({ success: true, message: 'Post updated successfully', post: updatedPost });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. DELETE /api/posts - Delete all posts (clear slate)
app.delete('/api/posts', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(DATA_DIR)) {
      const entries = fs.readdirSync(DATA_DIR);
      for (const entry of entries) {
        const fullPath = path.join(DATA_DIR, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
    res.json({ success: true, message: 'All posts deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE /api/posts/:slug - Delete single post & comments
app.delete('/api/posts/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    let postDir = path.join(DATA_DIR, slug);

    if (!fs.existsSync(postDir)) {
      const allPosts = getAllPostsData();
      const matched = allPosts.find(
        (p) => p.slug === slug || p.id === slug || p.seoPermalink === slug
      );
      if (matched) {
        postDir = path.join(DATA_DIR, matched.slug || matched.id);
      }
    }

    if (!fs.existsSync(postDir)) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    fs.rmSync(postDir, { recursive: true, force: true });
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. GET /api/posts/:slug/comments - Get comments for post
app.get('/api/posts/:slug/comments', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { all } = req.query;
    const comments = getCommentsForPost(slug);

    if (all === 'true') {
      return res.json({ success: true, count: comments.length, comments });
    }

    const approvedComments = comments.filter((c: any) => c.approved);
    res.json({ success: true, count: approvedComments.length, comments: approvedComments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. POST /api/posts/:slug/comments - Submit comment
app.post('/api/posts/:slug/comments', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { name, email, comment } = req.body;

    if (!name || !email || !comment) {
      return res.status(400).json({ success: false, message: 'Name, email, and comment are required' });
    }

    const comments = getCommentsForPost(slug);
    const newComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
      approved: true, // Auto-approve for seamless visitor feedback, admin can manage/delete in CMS
    };

    comments.push(newComment);
    saveCommentsForPost(slug, comments);

    res.status(201).json({ success: true, message: 'Comment submitted successfully', comment: newComment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. PUT /api/posts/:slug/comments/:commentId - Approve/update comment
app.put('/api/posts/:slug/comments/:commentId', (req: Request, res: Response) => {
  try {
    const { slug, commentId } = req.params;
    const { approved, comment } = req.body;

    const comments = getCommentsForPost(slug);
    const idx = comments.findIndex((c: any) => c.id === commentId);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (approved !== undefined) {
      comments[idx].approved = Boolean(approved);
    }
    if (comment !== undefined) {
      comments[idx].comment = comment.trim();
    }

    saveCommentsForPost(slug, comments);
    res.json({ success: true, message: 'Comment updated', comment: comments[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. DELETE /api/posts/:slug/comments/:commentId - Delete comment
app.delete('/api/posts/:slug/comments/:commentId', (req: Request, res: Response) => {
  try {
    const { slug, commentId } = req.params;
    let comments = getCommentsForPost(slug);
    const initialLen = comments.length;

    comments = comments.filter((c: any) => c.id !== commentId);

    if (comments.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    saveCommentsForPost(slug, comments);
    res.json({ success: true, message: 'Comment removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. GET /api/categories - Unique categories with post counts
app.get('/api/categories', (_req: Request, res: Response) => {
  try {
    const posts = getAllPostsData();
    const map: Record<string, number> = {};

    posts.forEach((p) => {
      const cat = p.category || 'General';
      map[cat] = (map[cat] || 0) + 1;
    });

    const categories = Object.entries(map).map(([name, count]) => ({ name, count }));
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. GET /api/stats - CMS Dashboard aggregate statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const posts = getAllPostsData();
    const totalPosts = posts.length;
    const featuredPosts = posts.filter((p) => p.featured).length;

    let totalComments = 0;
    let pendingComments = 0;

    posts.forEach((p) => {
      totalComments += p.totalCommentsCount || 0;
      pendingComments += p.pendingCommentsCount || 0;
    });

    const categories = Array.from(new Set(posts.map((p) => p.category || 'General')));

    res.json({
      success: true,
      stats: {
        totalPosts,
        featuredPosts,
        totalComments,
        pendingComments,
        categoriesCount: categories.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. GET /api/comments/all - All comments across all posts for CMS comments page
app.get('/api/comments/all', (_req: Request, res: Response) => {
  try {
    const posts = getAllPostsData();
    const allComments: any[] = [];

    posts.forEach((p) => {
      const comments = getCommentsForPost(p.slug);
      comments.forEach((c: any) => {
        allComments.push({
          ...c,
          postSlug: p.slug,
          postTitle: p.title,
        });
      });
    });

    allComments.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    res.json({ success: true, count: allComments.length, comments: allComments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. POST /api/upload - Optional local image file upload
app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback for unmatched /api/* routes to guarantee JSON response
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Helper to find a post by slug, id, or seoPermalink
function findPostBySlugOrPermalink(slug: string) {
  const allPosts = getAllPostsData();
  return (
    allPosts.find((p) => p.slug === slug || p.id === slug || p.seoPermalink === slug) || null
  );
}

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Static assets route for images
app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

// Helper to escape HTML attributes safely
function escapeHtmlAttr(str: string) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Generate social and Google SEO HTML with OpenGraph and Twitter cards for /blog/:slug
async function generatePostHtml(req: Request, post: any, viteInstance?: any) {
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const postSlug = post.seoPermalink || post.slug;
  const canonicalUrl = `${baseUrl}/blog/${postSlug}`;

  let fullImageUrl = post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg';
  if (!fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://')) {
    fullImageUrl = `${baseUrl}${fullImageUrl.startsWith('/') ? '' : '/'}${fullImageUrl}`;
  }

  const postTitle = (post.seoTitle || post.title || 'CrazyBlog Article').trim();
  const siteTitle = `${postTitle} — CrazyBlog`;
  const postDesc = (post.seoDescription || post.excerpt || 'Read the full story on CrazyBlog.').trim();
  const postAuthor = post.author || 'Admin';
  const postDate = post.date || new Date().toISOString().split('T')[0];
  const postCategory = post.category || 'General';
  const postKeywords = post.seoKeywords || `${postCategory}, CrazyBlog`;

  const templatePath = isProd
    ? path.resolve(__dirname, 'dist/index.html')
    : path.resolve(__dirname, 'index.html');

  let template = fs.readFileSync(templatePath, 'utf-8');

  if (viteInstance && !isProd) {
    template = await viteInstance.transformIndexHtml(req.originalUrl, template);
  }

  const escTitle = escapeHtmlAttr(postTitle);
  const escSiteTitle = escapeHtmlAttr(siteTitle);
  const escDesc = escapeHtmlAttr(postDesc);
  const escImg = escapeHtmlAttr(fullImageUrl);
  const escUrl = escapeHtmlAttr(canonicalUrl);
  const escKeywords = escapeHtmlAttr(postKeywords);
  const escAuthor = escapeHtmlAttr(postAuthor);
  const escCategory = escapeHtmlAttr(postCategory);

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: postTitle,
    description: postDesc,
    image: [fullImageUrl],
    url: canonicalUrl,
    datePublished: postDate,
    author: {
      '@type': 'Person',
      name: postAuthor,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CrazyBlog',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  });

  const injectedTags = `
    <!-- Dynamically Injected Social Sharing & Google SEO Tags -->
    <title>${escSiteTitle}</title>
    <meta name="description" content="${escDesc}" />
    <meta name="keywords" content="${escKeywords}" />
    <meta name="author" content="${escAuthor}" />
    <link rel="canonical" href="${escUrl}" />

    <!-- OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Discord, Telegram, Slack) -->
    <meta property="og:site_name" content="CrazyBlog" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escTitle}" />
    <meta property="og:description" content="${escDesc}" />
    <meta property="og:image" content="${escImg}" />
    <meta property="og:image:secure_url" content="${escImg}" />
    <meta property="og:image:alt" content="${escTitle}" />
    <meta property="og:url" content="${escUrl}" />
    <meta property="article:published_time" content="${postDate}" />
    <meta property="article:author" content="${escAuthor}" />
    <meta property="article:section" content="${escCategory}" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escTitle}" />
    <meta name="twitter:description" content="${escDesc}" />
    <meta name="twitter:image" content="${escImg}" />
    <meta name="twitter:image:alt" content="${escTitle}" />

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json" id="crazyblog-article-jsonld">
${jsonLd}
    </script>
`;

  let html = template
    .replace(/<title>.*?<\/title>/is, '')
    .replace(/<meta\s+name=["']description["'].*?>/is, '')
    .replace(/<meta\s+property=["']og:title["'].*?>/is, '')
    .replace(/<meta\s+property=["']og:description["'].*?>/is, '')
    .replace(/<meta\s+property=["']og:type["'].*?>/is, '')
    .replace(/<meta\s+name=["']twitter:card["'].*?>/is, '');

  return html.replace('</head>', `${injectedTags}\n  </head>`);
}

// ========================
// VITE MIDDLEWARE / STATIC
// ========================
async function startServer() {
  let vite: any = null;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }

  // Intercept /blog/:slug to inject real OpenGraph social sharing meta tags
  app.get('/blog/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const post = findPostBySlugOrPermalink(slug);
      if (post) {
        const html = await generatePostHtml(req, post, vite);
        return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html);
      }
      next();
    } catch (e) {
      next(e);
    }
  });

  if (!isProd && vite) {
    app.use(vite.middlewares);
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CrazyBlog & CMS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

// Unified API Client with full Express Backend & Vercel/Static Client Storage Fallback
import defaultPostsData from '../data/defaultPosts.json';

const API_BASE = '/api';
const STORAGE_KEY = 'gutenverse_cms_posts_v2';
const DELETED_KEY = 'gutenverse_cms_deleted_slugs_v2';
const INITIALIZED_KEY = 'gutenverse_cms_initialized_v2';

// Helper to track permanently deleted post slugs
function getDeletedSlugs() {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markSlugDeleted(slug) {
  try {
    const list = getDeletedSlugs();
    if (!list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(DELETED_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Failed to mark slug deleted:', e);
  }
}

// Seed initial localStorage with bundled default posts if empty, respecting deletion ledger
function getLocalPosts() {
  try {
    const deleted = getDeletedSlugs();
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);

    if (initialized === 'true' && raw !== null) {
      // User has already initialized their CMS — respect their state even if empty []
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p) => p && !deleted.includes(p.slug));
      }
      return [];
    }

    // First time setup: seed with bundled starter posts excluding any previously deleted
    const initial = (Array.isArray(defaultPostsData) ? defaultPostsData : []).filter(
      (p) => p && !deleted.includes(p.slug)
    );
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

function saveLocalPosts(posts) {
  try {
    const deleted = getDeletedSlugs();
    const clean = (posts || []).filter((p) => p && !deleted.includes(p.slug));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Safely parse JSON from fetch responses. If non-JSON (e.g. Vercel SPA index.html), returns null instead of throwing
async function parseJsonResponse(res) {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeCategory(str) {
  return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

export const api = {
  // 1. Get all posts with filtering and search
  async getPosts(params = {}) {
    const deleted = getDeletedSlugs();
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.featured) query.append('featured', 'true');

      const res = await fetch(`${API_BASE}/posts?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.posts)) {
          // Filter out any slugs the user has permanently deleted
          const cleanPosts = data.posts.filter((p) => p && !deleted.includes(p.slug));
          saveLocalPosts(cleanPosts);
          return { ...data, count: cleanPosts.length, posts: cleanPosts };
        }
      }
    } catch {
      // Backend unavailable (e.g. on Vercel static hosting)
    }

    // Client-side Fallback
    let posts = getLocalPosts().filter((p) => p && !deleted.includes(p.slug));
    if (params.category && params.category !== 'All') {
      const targetCat = normalizeCategory(params.category);
      posts = posts.filter((p) => p.category && normalizeCategory(p.category) === targetCat);
    }
    if (params.featured) {
      posts = posts.filter((p) => Boolean(p.featured));
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.content && p.content.toLowerCase().includes(q))
      );
    }

    return { success: true, count: posts.length, posts };
  },

  // 2. Get single post by slug
  async getPost(slug) {
    const deleted = getDeletedSlugs();
    if (deleted.includes(slug)) return null;

    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && data.post) {
          if (deleted.includes(data.post.slug)) return null;
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    const posts = getLocalPosts();
    const post = posts.find(
      (p) =>
        (p.slug === slug || p.seoPermalink === slug || p.id === slug) &&
        !deleted.includes(p.slug)
    );
    if (!post) return null;
    return { success: true, post };
  },

  // 3. Create new post
  async createPost(data) {
    const permalinkInput = data.seoPermalink || data.slug;
    let cleanSlug = (permalinkInput || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug && data.title) {
      cleanSlug = data.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const payload = {
      ...data,
      title: (data.title || '').trim(),
      slug: cleanSlug || `post-${Date.now()}`,
      seoTitle: (data.seoTitle || data.title || '').trim(),
      seoPermalink: (data.seoPermalink || cleanSlug || '').trim(),
      seoDescription: (data.seoDescription !== undefined ? data.seoDescription : data.excerpt || '').trim(),
      seoKeywords: (data.seoKeywords || '').trim(),
    };

    // If this slug was in deleted ledger, remove it because user is explicitly creating a new post with it
    try {
      const deleted = getDeletedSlugs().filter((s) => s !== payload.slug);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success && result.post) {
          const current = getLocalPosts();
          const filtered = current.filter((p) => p.slug !== result.post.slug);
          saveLocalPosts([result.post, ...filtered]);
          return result;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    let finalSlug = payload.slug;
    let counter = 1;
    while (posts.some((p) => p.slug === finalSlug)) {
      finalSlug = `${payload.slug}-${counter}`;
      counter++;
    }

    const newPost = {
      id: finalSlug,
      title: payload.title,
      slug: finalSlug,
      excerpt: (payload.excerpt || '').trim(),
      image: payload.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg',
      category: payload.category || 'General',
      author: payload.author || 'Admin',
      date: payload.date || new Date().toISOString().split('T')[0],
      content: payload.content || '<p>Write your story here...</p>',
      featured: Boolean(payload.featured),
      seoTitle: payload.seoTitle || payload.title,
      seoPermalink: finalSlug,
      seoDescription: payload.seoDescription || payload.excerpt || '',
      seoKeywords: payload.seoKeywords || '',
      comments: [],
    };

    saveLocalPosts([newPost, ...posts]);
    return { success: true, message: 'Post created successfully', post: newPost };
  },

  // 4. Update post
  async updatePost(slug, data) {
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success && result.post) {
          const posts = getLocalPosts().map((p) => (p.slug === slug ? result.post : p));
          saveLocalPosts(posts);
          return result;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const index = posts.findIndex((p) => p.slug === slug || p.id === slug);
    if (index === -1) {
      throw new Error('Post not found');
    }

    const updatedPost = {
      ...posts[index],
      ...data,
      title: data.title ? data.title.trim() : posts[index].title,
      slug: data.slug || posts[index].slug,
      seoTitle: data.seoTitle !== undefined ? data.seoTitle.trim() : posts[index].seoTitle || posts[index].title,
      seoPermalink: data.seoPermalink !== undefined ? data.seoPermalink.trim() : posts[index].seoPermalink || posts[index].slug,
      seoDescription: data.seoDescription !== undefined ? data.seoDescription.trim() : posts[index].seoDescription || posts[index].excerpt || '',
      seoKeywords: data.seoKeywords !== undefined ? data.seoKeywords.trim() : posts[index].seoKeywords || '',
    };

    posts[index] = updatedPost;
    saveLocalPosts(posts);
    return { success: true, message: 'Post updated successfully', post: updatedPost };
  },

  // 5. Delete post PERMANENTLY
  async deletePost(slug) {
    // 1. Permanently register in deleted ledger so it never resurfaces
    markSlugDeleted(slug);

    // 2. Remove from local storage
    const remaining = getLocalPosts().filter((p) => p.slug !== slug && p.id !== slug);
    saveLocalPosts(remaining);

    // 3. Send DELETE request to backend to delete from filesystem if server is reachable
    try {
      await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Backend unavailable
    }

    return { success: true, message: 'Post permanently deleted' };
  },

  // 6. Delete all demo posts permanently with one click
  async deleteAllDefaultPosts() {
    const demoSlugs = [
      'at-daybreak-of-the-fifteenth-day-of-my-search',
      'i-shouted-above-the-sudden-noise',
      'react-js-guide',
      'the-great-excavation-lay-far-from-the-plaza',
      'the-sunset-faded-to-twilight',
      'then-going-through-some-small-strange-motions',
      'two-long-weeks-i-wandered',
    ];

    for (const slug of demoSlugs) {
      markSlugDeleted(slug);
      try {
        await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
      } catch {}
    }

    const remaining = getLocalPosts().filter((p) => !demoSlugs.includes(p.slug));
    saveLocalPosts(remaining);
    return { success: true, message: 'All default demo posts deleted permanently' };
  },

  // 7. Get comments for a post
  async getComments(slug, all = false) {
    try {
      const query = all ? '?all=true' : '';
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments${query}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.comments)) {
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const post = posts.find((p) => p.slug === slug || p.id === slug);
    const comments = (post && post.comments) || [];
    const filtered = all ? comments : comments.filter((c) => c.approved);
    return { success: true, count: filtered.length, comments: filtered };
  },

  // 8. Add comment to a post
  async addComment(slug, commentData) {
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success && result.comment) {
          return result;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const post = posts.find((p) => p.slug === slug || p.id === slug);
    if (!post) {
      throw new Error('Post not found');
    }

    const newComment = {
      id: `c-${Date.now()}`,
      name: (commentData.name || 'Anonymous').trim(),
      email: (commentData.email || '').trim(),
      comment: (commentData.comment || '').trim(),
      date: new Date().toISOString().split('T')[0],
      approved: false, // Pending moderation
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    post.comments.push(newComment);
    saveLocalPosts(posts);

    return {
      success: true,
      message: 'Comment submitted successfully and awaiting approval',
      comment: newComment,
    };
  },

  // 9. Update comment status (approve/reject)
  async updateComment(slug, commentId, updates) {
    try {
      const res = await fetch(
        `${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success) return result;
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    for (const post of posts) {
      if (Array.isArray(post.comments)) {
        const target = post.comments.find((c) => c.id === commentId);
        if (target) {
          Object.assign(target, updates);
          saveLocalPosts(posts);
          return { success: true, message: 'Comment updated successfully', comment: target };
        }
      }
    }
    throw new Error('Comment not found');
  },

  // 10. Delete comment
  async deleteComment(slug, commentId) {
    try {
      const res = await fetch(
        `${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
        {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        }
      );

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success) return result;
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    for (const post of posts) {
      if (Array.isArray(post.comments)) {
        post.comments = post.comments.filter((c) => c.id !== commentId);
      }
    }
    saveLocalPosts(posts);
    return { success: true, message: 'Comment deleted successfully' };
  },

  // 11. Get all comments across all posts for Admin
  async getAllComments() {
    try {
      const res = await fetch(`${API_BASE}/comments/all`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.comments)) {
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const allComments = [];
    for (const post of posts) {
      if (Array.isArray(post.comments)) {
        for (const c of post.comments) {
          allComments.push({
            ...c,
            postSlug: post.slug,
            postTitle: post.title,
          });
        }
      }
    }
    allComments.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return { success: true, count: allComments.length, comments: allComments };
  },

  // 12. Get all categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.categories)) {
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const countMap = {};
    for (const p of posts) {
      const cat = p.category || 'General';
      countMap[cat] = (countMap[cat] || 0) + 1;
    }
    const categories = Object.keys(countMap).map((name) => ({
      name,
      count: countMap[name],
    }));
    return { success: true, count: categories.length, categories };
  },

  // 13. Get CMS stats
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && data.stats) {
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    let totalComments = 0;
    let pendingComments = 0;
    const catSet = new Set();

    for (const p of posts) {
      if (p.category) catSet.add(p.category);
      if (Array.isArray(p.comments)) {
        totalComments += p.comments.length;
        pendingComments += p.comments.filter((c) => !c.approved).length;
      }
    }

    return {
      success: true,
      stats: {
        totalPosts: posts.length,
        totalCategories: catSet.size,
        totalComments,
        pendingComments,
      },
    };
  },

  // 14. Image upload with base64 Data URL fallback
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      if (res.ok) {
        const result = await parseJsonResponse(res);
        if (result && result.success && result.url) {
          return result;
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback: Read file as Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          message: 'Image converted locally for client storage',
          url: reader.result,
          filename: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },
};

export default api;

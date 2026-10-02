// Unified API Client with Express Backend & Browser Storage
const API_BASE = '/api';
const STORAGE_KEY = 'crazyblog_posts_v4';
const DELETED_KEY = 'crazyblog_deleted_v4';
const INITIALIZED_KEY = 'crazyblog_initialized_v4';

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

// Local storage reader - starts with ZERO posts as requested
function getLocalPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    // Clean initial slate: 0 blogs
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

function saveLocalPosts(posts) {
  try {
    const clean = Array.isArray(posts) ? posts : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// Safely parse JSON from fetch responses
async function parseJsonResponse(res) {
  try {
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
          // Sync with local storage
          saveLocalPosts(data.posts);
          return { success: true, count: data.posts.length, posts: data.posts };
        }
      }
    } catch {
      // Backend unavailable
    }

    // Client-side Fallback
    let posts = getLocalPosts();
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
    try {
      const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && data.post) {
          return data;
        }
      }
    } catch {
      // Backend unavailable
    }

    const posts = getLocalPosts();
    const post = posts.find((p) => p.slug === slug || p.id === slug || p.seoPermalink === slug);
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

    // Remove from deleted list if recreating
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

      const result = await parseJsonResponse(res);
      if (res.ok && result && result.success && result.post) {
        const current = getLocalPosts();
        const filtered = current.filter((p) => p.slug !== result.post.slug);
        saveLocalPosts([result.post, ...filtered]);
        return result;
      }

      if (!res.ok && result && result.message) {
        throw new Error(result.message);
      }
    } catch (err) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      // Backend network unavailable, continue to local storage fallback
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

      const result = await parseJsonResponse(res);
      if (res.ok && result && result.success && result.post) {
        const posts = getLocalPosts().map((p) =>
          p.slug === slug || p.id === slug ? result.post : p
        );
        saveLocalPosts(posts);
        return result;
      }

      if (!res.ok && result && result.message) {
        throw new Error(result.message);
      }
    } catch (err) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      // Backend network unavailable, continue to local storage fallback
    }

    // Client-side Fallback
    const posts = getLocalPosts();
    const index = posts.findIndex((p) => p.slug === slug || p.id === slug || p.seoPermalink === slug);
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
    markSlugDeleted(slug);

    // Remove from local storage
    const remaining = getLocalPosts().filter((p) => p.slug !== slug && p.id !== slug && p.seoPermalink !== slug);
    saveLocalPosts(remaining);

    // Delete from server
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

  // 6. Delete all posts (start from zero)
  async deleteAllPosts() {
    try {
      await fetch(`${API_BASE}/posts`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
    } catch {}

    saveLocalPosts([]);
    localStorage.removeItem(DELETED_KEY);
    return { success: true, message: 'All posts deleted successfully' };
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
      approved: true,
    };

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }
    post.comments.push(newComment);
    saveLocalPosts(posts);

    return {
      success: true,
      message: 'Comment submitted successfully',
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

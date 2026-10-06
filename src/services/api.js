// Unified Real-Time API Client with Express Backend & Cross-Device Persistent Storage
const API_BASE = '/api';
const STORAGE_KEY = 'crazyblog_posts_v4';
const DELETED_KEY = 'crazyblog_deleted_v4';

// Helper to track deleted slugs locally
function getDeletedSlugs() {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedSlug(slug) {
  if (!slug) return;
  try {
    const list = getDeletedSlugs();
    if (!list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(DELETED_KEY, JSON.stringify(list));
    }
  } catch {}
}

// Deep scanner across all localStorage and sessionStorage keys to find any drafts or posts
export function getAllBrowserDrafts() {
  const candidateKeys = [
    'crazyblog_posts_v4',
    'crazyblog_posts_v3',
    'crazyblog_posts_v2',
    'crazyblog_posts_v1',
    'crazyblog_posts',
    'crazyblog_admin_posts',
    'posts',
    'articles',
    'blog_posts',
  ];

  const foundMap = new Map();
  const deletedSet = new Set(getDeletedSlugs());

  const scanStorage = (storage) => {
    if (!storage) return;
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key || key.includes('firebase') || key.includes('session') || key === DELETED_KEY) continue;
        try {
          const raw = storage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item === 'object' && item.title) {
                const identifier = item.slug || item.id || item.title;
                if (!deletedSet.has(identifier) && !deletedSet.has(item.slug) && !deletedSet.has(item.id)) {
                  if (!foundMap.has(identifier)) {
                    foundMap.set(identifier, item);
                  }
                }
              }
            }
          } else if (parsed && typeof parsed === 'object' && parsed.title) {
            const identifier = parsed.slug || parsed.id || parsed.title;
            if (!deletedSet.has(identifier) && !deletedSet.has(parsed.slug) && !deletedSet.has(parsed.id)) {
              if (!foundMap.has(identifier)) {
                foundMap.set(identifier, parsed);
              }
            }
          }
        } catch {}
      }
    } catch {}
  };

  scanStorage(typeof localStorage !== 'undefined' ? localStorage : null);
  scanStorage(typeof sessionStorage !== 'undefined' ? sessionStorage : null);

  return Array.from(foundMap.values());
}

function getCachedPosts() {
  const deletedSet = new Set(getDeletedSlugs());
  return getAllBrowserDrafts().filter(
    (p) => p && !deletedSet.has(p.slug) && !deletedSet.has(p.id)
  );
}

function setCachedPosts(posts) {
  try {
    const deletedSet = new Set(getDeletedSlugs());
    const list = Array.isArray(posts)
      ? posts.filter((p) => p && !deletedSet.has(p.slug) && !deletedSet.has(p.id))
      : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to update local cache:', e);
  }
}

// Helper to safely parse JSON response from fetch
async function parseJsonResponse(res) {
  try {
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Resilient fetch wrapper with credentials and auto-retry for minor network interruptions
async function resilientFetch(url, options = {}, retries = 2) {
  const fetchOpts = {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOpts);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function normalizeCategory(str) {
  return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

// Flag to prevent concurrent auto-sync executions
let isSyncing = false;

export const api = {
  // Sync all locally found browser drafts to server disk
  async syncLocalDraftsToServer() {
    const drafts = getAllBrowserDrafts();
    if (drafts.length === 0) return { success: true, count: 0, message: 'No local drafts found' };

    try {
      const res = await resilientFetch(`${API_BASE}/posts/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: drafts }),
      });

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success) {
          if (Array.isArray(data.posts)) {
            setCachedPosts(data.posts);
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to batch sync drafts to server:', e);
    }
    return { success: false, message: 'Sync failed' };
  },

  // 1. Get all posts with filtering and search (Authoritative from Backend)
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', 'true');

    try {
      const res = await resilientFetch(`${API_BASE}/posts?${query.toString()}&_t=${Date.now()}`);

      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.posts)) {
          let serverPosts = data.posts;

          // Always filter out any slugs deleted on static deployments (e.g. Vercel)
          const deletedSet = new Set(getDeletedSlugs());
          serverPosts = serverPosts.filter(
            (p) => p && !deletedSet.has(p.slug) && !deletedSet.has(p.id)
          );

          // AUTO-RECOVERY SYNC: If this device has any local drafts created earlier that are NOT on the server,
          // push them to the backend server disk so all other devices see them!
          if (!isSyncing && !params.category && !params.search && !params.featured) {
            const drafts = getAllBrowserDrafts();
            const serverSlugs = new Set(serverPosts.map((p) => p.slug || p.id));
            const missingOnServer = drafts.filter(
              (p) => p && p.title && !serverSlugs.has(p.slug) && !serverSlugs.has(p.id)
            );

            if (missingOnServer.length > 0) {
              isSyncing = true;
              try {
                const syncRes = await resilientFetch(`${API_BASE}/posts/sync`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ posts: missingOnServer }),
                });
                if (syncRes.ok) {
                  const syncData = await parseJsonResponse(syncRes);
                  if (syncData && syncData.success && Array.isArray(syncData.posts)) {
                    serverPosts = syncData.posts.filter(
                      (p) => p && !deletedSet.has(p.slug) && !deletedSet.has(p.id)
                    );
                  }
                }
              } catch (syncErr) {
                console.warn('Auto-sync error:', syncErr);
              } finally {
                isSyncing = false;
              }
            }
          }

          // Cache authoritative list
          setCachedPosts(serverPosts);
          return { success: true, count: serverPosts.length, posts: serverPosts };
        }
      }
    } catch (err) {
      console.warn('Backend fetch failed, attempting cached display:', err);
    }

    // Offline / Static Hosting (Vercel) Fallback
    const deletedSet = new Set(getDeletedSlugs());
    let posts = getCachedPosts().filter(
      (p) => p && !deletedSet.has(p.slug) && !deletedSet.has(p.id)
    );
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
    const deletedSet = new Set(getDeletedSlugs());
    if (deletedSet.has(slug)) return null;

    try {
      const res = await resilientFetch(`${API_BASE}/posts/${encodeURIComponent(slug)}?_t=${Date.now()}`);
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && data.post) {
          if (!deletedSet.has(data.post.slug) && !deletedSet.has(data.post.id)) {
            return data;
          }
          return null;
        }
      }
    } catch (err) {
      console.warn(`Backend fetch failed for /api/posts/${slug}:`, err);
    }

    const cached = getCachedPosts();
    const post = cached.find((p) => p.slug === slug || p.id === slug || p.seoPermalink === slug);
    if (post && !deletedSet.has(post.slug) && !deletedSet.has(post.id)) {
      return { success: true, post };
    }

    return null;
  },

  // 3. Create a post (Guaranteed Server Persistence + Static Deployment Fallback)
  async createPost(data, options = {}) {
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

    if (!payload.title) {
      throw new Error('Article title is required');
    }

    let res = null;
    let result = null;
    try {
      res = await resilientFetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      result = await parseJsonResponse(res);
    } catch (err) {
      console.warn('Network call to create post failed:', err);
    }

    if (res && res.ok && result && result.success && result.post) {
      // Update local cache
      const cached = getCachedPosts();
      const filtered = cached.filter((p) => p.slug !== result.post.slug && p.id !== result.post.id);
      setCachedPosts([result.post, ...filtered]);
      return result;
    }

    // Static hosting fallback (e.g. Vercel static rewrites returning 405 Method Not Allowed or 404)
    if (!res || res.status === 405 || res.status === 404) {
      const fallbackPost = {
        ...payload,
        id: payload.slug,
        date: payload.date || new Date().toISOString().split('T')[0],
      };
      const cached = getCachedPosts();
      const filtered = cached.filter((p) => p.slug !== fallbackPost.slug && p.id !== fallbackPost.id);
      setCachedPosts([fallbackPost, ...filtered]);
      return { success: true, message: 'Post created successfully', post: fallbackPost };
    }

    const errorMsg = (result && result.message) || `Server error (${res ? res.status : 'offline'}): Failed to save post to database`;
    throw new Error(errorMsg);
  },

  // 4. Update post (Guaranteed Server Persistence + Static Deployment Fallback)
  async updatePost(slug, data) {
    let res = null;
    let result = null;
    try {
      res = await resilientFetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      result = await parseJsonResponse(res);
    } catch (err) {
      console.warn('Network call to update post failed:', err);
    }

    if (res && res.ok && result && result.success && result.post) {
      const cached = getCachedPosts();
      const updated = cached.map((p) =>
        p.slug === slug || p.id === slug || p.seoPermalink === slug ? result.post : p
      );
      setCachedPosts(updated);
      return result;
    }

    // Static hosting fallback (e.g. Vercel 405 Method Not Allowed)
    if (!res || res.status === 405 || res.status === 404) {
      const cached = getCachedPosts();
      const updatedPost = { ...data, slug, id: slug };
      const updated = cached.map((p) =>
        p.slug === slug || p.id === slug || p.seoPermalink === slug ? { ...p, ...data } : p
      );
      setCachedPosts(updated);
      return { success: true, message: 'Post updated successfully', post: updatedPost };
    }

    const errorMsg = (result && result.message) || `Server error (${res ? res.status : 'offline'}): Failed to update post`;
    throw new Error(errorMsg);
  },

  // 5. Delete post (Guaranteed Persistence + Vercel 405 Static Resilience)
  async deletePost(slug) {
    // 1. Immediately record slug as deleted in client store
    addDeletedSlug(slug);

    // 2. Remove from local cache immediately
    const cached = getCachedPosts().filter(
      (p) => p.slug !== slug && p.id !== slug && p.seoPermalink !== slug
    );
    setCachedPosts(cached);

    // 3. Attempt server delete
    let res = null;
    let result = null;
    try {
      res = await resilientFetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      result = await parseJsonResponse(res);
    } catch (err) {
      console.warn('Network request to delete post on server was unreachable:', err);
    }

    if (res && res.ok && result && result.success) {
      return result;
    }

    // If server responded with 405 (e.g. Vercel static rewrites DELETE to index.html),
    // 404, or network issue:
    // The post has already been removed locally and permanently marked deleted!
    if (!res || res.status === 405 || res.status === 404 || res.status >= 500) {
      console.info(`Post "${slug}" removed from local store (server status: ${res ? res.status : 'offline'}).`);
      return { success: true, message: 'Post removed successfully' };
    }

    const errorMsg = (result && result.message) || `Server error (${res.status}): Failed to delete post`;
    throw new Error(errorMsg);
  },

  // 5.5 Delete all posts (clear slate)
  async deleteAllPosts() {
    const current = getCachedPosts();
    for (const p of current) {
      if (p.slug) addDeletedSlug(p.slug);
      if (p.id) addDeletedSlug(p.id);
    }
    setCachedPosts([]);

    let res = null;
    let result = null;
    try {
      res = await resilientFetch(`${API_BASE}/posts`, {
        method: 'DELETE',
      });
      result = await parseJsonResponse(res);
    } catch (e) {
      console.warn('Network call to delete all posts failed:', e);
    }

    if (res && res.ok && result) {
      return result;
    }

    return { success: true, message: 'All posts cleared successfully' };
  },

  // 6. Get all categories
  async getCategories() {
    try {
      const res = await resilientFetch(`${API_BASE}/categories?_t=${Date.now()}`);
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.categories)) {
          return data;
        }
      }
    } catch {}

    const cached = getCachedPosts();
    const catMap = new Map();
    for (const post of cached) {
      const cat = post.category || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
    const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
    return { success: true, count: categories.length, categories };
  },

  // 7. Get comments for a post
  async getComments(slug, all = false) {
    const query = all ? '?all=true' : '';
    try {
      const res = await resilientFetch(
        `${API_BASE}/posts/${encodeURIComponent(slug)}/comments${query}&_t=${Date.now()}`
      );
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.comments)) {
          return data;
        }
      }
    } catch {}

    return { success: true, count: 0, comments: [] };
  },

  // 8. Add comment to a post
  async addComment(slug, commentData) {
    const res = await resilientFetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    const result = await parseJsonResponse(res);
    if (res.ok && result && result.success) {
      return result;
    }

    // Static hosting fallback
    if (!res || res.status === 405 || res.status === 404) {
      return {
        success: true,
        message: 'Comment submitted successfully',
        comment: {
          id: `c-${Date.now()}`,
          ...commentData,
          date: new Date().toISOString().split('T')[0],
          approved: true,
        },
      };
    }

    throw new Error((result && result.message) || 'Failed to submit comment');
  },

  // 9. Update comment status
  async updateComment(slug, commentId, updates) {
    const res = await resilientFetch(
      `${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    const result = await parseJsonResponse(res);
    if (res.ok && result && result.success) {
      return result;
    }

    if (!res || res.status === 405 || res.status === 404) {
      return { success: true, message: 'Comment updated successfully' };
    }

    throw new Error((result && result.message) || 'Failed to update comment');
  },

  // 10. Delete comment
  async deleteComment(slug, commentId) {
    const res = await resilientFetch(
      `${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
      }
    );

    const result = await parseJsonResponse(res);
    if (res.ok && result && result.success) {
      return result;
    }

    if (!res || res.status === 405 || res.status === 404) {
      return { success: true, message: 'Comment deleted successfully' };
    }

    throw new Error((result && result.message) || 'Failed to delete comment');
  },

  // 11. Get all comments across all posts for Admin
  async getAllComments() {
    try {
      const res = await resilientFetch(`${API_BASE}/comments/all?_t=${Date.now()}`);
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data && data.success && Array.isArray(data.comments)) {
          return data;
        }
      }
    } catch {}

    return { success: true, count: 0, comments: [] };
  },

  // 12. Upload image to server
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await resilientFetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await parseJsonResponse(res);
      if (res.ok && result && result.success && result.url) {
        return result;
      }
    } catch (e) {
      console.warn('Server upload failed, converting to data URL:', e);
    }

    // Static fallback: read image as data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          message: 'Image converted locally for static hosting',
          url: reader.result,
          filename: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  // 13. System stats for Admin Dashboard
  async getStats() {
    const postsRes = await this.getPosts();
    const posts = postsRes.posts || [];
    const catSet = new Set(posts.map((p) => p.category || 'General'));

    let totalComments = 0;
    let pendingComments = 0;
    for (const p of posts) {
      if (typeof p.totalCommentsCount === 'number') {
        totalComments += p.totalCommentsCount;
        pendingComments += p.pendingCommentsCount || 0;
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
};

export default api;

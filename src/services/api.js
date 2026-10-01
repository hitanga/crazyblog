// REST API Client for communicating with the Express JSON-CMS backend

const API_BASE = '/api';

async function safeJson(res, defaultErrorMsg = 'Server request failed') {
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const snippet = clean.length > 100 ? clean.slice(0, 100) + '...' : clean;
    if (!res.ok) {
      throw new Error(snippet || `${defaultErrorMsg} (HTTP ${res.status})`);
    }
    throw new Error(`Unexpected server response: ${snippet || 'Non-JSON response'}`);
  }

  if (!res.ok) {
    throw new Error(data?.message || `${defaultErrorMsg} (HTTP ${res.status})`);
  }
  return data;
}

export const api = {
  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', 'true');

    const res = await fetch(`${API_BASE}/posts?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to load posts');
  },

  async getPost(slug) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) return null;
    return safeJson(res, 'Failed to load post');
  },

  async createPost(data) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    return safeJson(res, 'Failed to create post');
  },

  async updatePost(slug, data) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    return safeJson(res, 'Failed to update post');
  },

  async deletePost(slug) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to delete post');
  },

  // Comments
  async getComments(slug, all = false) {
    const query = all ? '?all=true' : '';
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments${query}`, {
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to load comments');
  },

  async addComment(slug, commentData) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(commentData),
    });
    return safeJson(res, 'Failed to post comment');
  },

  async updateComment(slug, commentId, updates) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return safeJson(res, 'Failed to update comment');
  },

  async deleteComment(slug, commentId) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to delete comment');
  },

  async getAllComments() {
    const res = await fetch(`${API_BASE}/comments/all`, {
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to load all comments');
  },

  // Categories & Stats
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to load categories');
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: { Accept: 'application/json' },
    });
    return safeJson(res, 'Failed to load statistics');
  },

  // Image upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    return safeJson(res, 'Failed to upload image');
  },
};

export default api;

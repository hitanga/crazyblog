// REST API Client for communicating with the Express JSON-CMS backend

const API_BASE = '/api';

export const api = {
  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', 'true');

    const res = await fetch(`${API_BASE}/posts?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load posts: ${res.statusText}`);
    return res.json();
  },

  async getPost(slug) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to load post: ${res.statusText}`);
    }
    return res.json();
  },

  async createPost(data) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create post');
    return result;
  },

  async updatePost(slug, data) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update post');
    return result;
  },

  async deletePost(slug) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete post');
    return result;
  },

  // Comments
  async getComments(slug, all = false) {
    const query = all ? '?all=true' : '';
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments${query}`);
    if (!res.ok) throw new Error(`Failed to load comments`);
    return res.json();
  },

  async addComment(slug, commentData) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to post comment');
    return result;
  },

  async updateComment(slug, commentId, updates) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to update comment');
    return result;
  },

  async deleteComment(slug, commentId) {
    const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete comment');
    return result;
  },

  async getAllComments() {
    const res = await fetch(`${API_BASE}/comments/all`);
    if (!res.ok) throw new Error('Failed to load all comments');
    return res.json();
  },

  // Categories & Stats
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to load statistics');
    return res.json();
  },

  // Image upload
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to upload image');
    return result;
  },
};

export default api;

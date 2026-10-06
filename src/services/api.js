// Complete Firebase Firestore API Client for CrazyBlog
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../config/firebase.js';

function normalizeCategory(str) {
  return (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

export const api = {
  // 1. Get all posts with live Firestore fetching and filtering
  async getPosts(params = {}) {
    const postsPath = 'posts';
    try {
      const postsCol = collection(db, postsPath);
      const snapshot = await getDocs(postsCol);
      let posts = [];

      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          posts.push({
            id: docSnap.id,
            slug: docSnap.id,
            ...data,
          });
        }
      });

      // Sort descending by publish date or createdAt
      posts.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Category filtering
      if (params.category && params.category !== 'All') {
        const targetCat = normalizeCategory(params.category);
        posts = posts.filter(
          (p) => p.category && normalizeCategory(p.category) === targetCat
        );
      }

      // Featured filtering
      if (params.featured) {
        posts = posts.filter((p) => Boolean(p.featured));
      }

      // Search filtering
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
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, postsPath);
    }
  },

  // 2. Get single post by slug from Firestore
  async getPost(slug) {
    if (!slug) return null;
    const postPath = `posts/${slug}`;
    try {
      const docRef = doc(db, 'posts', slug);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const post = { id: docSnap.id, slug: docSnap.id, ...docSnap.data() };
        return { success: true, post };
      }

      // Query by slug field fallback
      const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const first = qSnap.docs[0];
        const post = { id: first.id, slug: first.id, ...first.data() };
        return { success: true, post };
      }

      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, postPath);
    }
  },

  // 3. Create a post directly in Firebase Firestore
  async createPost(data) {
    const cleanTitle = (data.title || '').trim();
    if (!cleanTitle) {
      throw new Error('Article title is required');
    }

    const permalinkInput = data.seoPermalink || data.slug;
    let cleanSlug = (permalinkInput || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      cleanSlug = cleanTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (!cleanSlug) {
      cleanSlug = `post-${Date.now()}`;
    }

    const newPost = {
      id: cleanSlug,
      title: cleanTitle,
      slug: cleanSlug,
      excerpt: (data.excerpt || '').trim(),
      image: data.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg',
      category: data.category || 'General',
      author: data.author || 'Admin',
      date: data.date || new Date().toISOString().split('T')[0],
      content: data.content || '<p>Write your story here...</p>',
      featured: Boolean(data.featured),
      seoTitle: (data.seoTitle || cleanTitle).trim(),
      seoPermalink: cleanSlug,
      seoDescription: (data.seoDescription !== undefined ? data.seoDescription : data.excerpt || '').trim(),
      seoKeywords: (data.seoKeywords || '').trim(),
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const postPath = `posts/${cleanSlug}`;
    try {
      const docRef = doc(db, 'posts', cleanSlug);
      await setDoc(docRef, newPost);
      return { success: true, message: 'Post created and saved to Firebase Firestore', post: newPost };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, postPath);
    }
  },

  // 4. Update post directly in Firebase Firestore
  async updatePost(slug, data) {
    const postPath = `posts/${slug}`;
    try {
      const docRef = doc(db, 'posts', slug);
      const existingSnap = await getDoc(docRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : {};

      const updatedPost = {
        ...existingData,
        ...data,
        id: slug,
        slug,
        title: data.title !== undefined ? data.title.trim() : existingData.title,
        excerpt: data.excerpt !== undefined ? data.excerpt.trim() : existingData.excerpt,
        seoTitle: data.seoTitle !== undefined ? data.seoTitle.trim() : (existingData.seoTitle || data.title),
        seoPermalink: slug,
        seoDescription: data.seoDescription !== undefined ? data.seoDescription.trim() : existingData.seoDescription,
        seoKeywords: data.seoKeywords !== undefined ? data.seoKeywords.trim() : existingData.seoKeywords,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, updatedPost, { merge: true });
      return { success: true, message: 'Post updated in Firebase Firestore', post: updatedPost };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, postPath);
    }
  },

  // 5. Delete post directly from Firebase Firestore
  async deletePost(slug) {
    const postPath = `posts/${slug}`;
    try {
      const docRef = doc(db, 'posts', slug);
      await deleteDoc(docRef);
      return { success: true, message: 'Post deleted permanently from Firebase Firestore' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, postPath);
    }
  },

  // 5.5 Delete all posts from Firebase Firestore (clear slate)
  async deleteAllPosts() {
    const postsPath = 'posts';
    try {
      const snapshot = await getDocs(collection(db, postsPath));
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, 'posts', docSnap.id)));
      });
      await Promise.all(deletePromises);
      return { success: true, message: 'All posts deleted from Firebase Firestore' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, postsPath);
    }
  },

  // 6. Get all categories and counts directly from Firebase Firestore
  async getCategories() {
    const postsRes = await this.getPosts();
    const posts = postsRes.posts || [];
    const catMap = new Map();

    for (const post of posts) {
      const cat = post.category || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }

    const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
    return { success: true, count: categories.length, categories };
  },

  // 7. Get comments from Firestore subcollection posts/{slug}/comments
  async getComments(slug, all = false) {
    const commentsPath = `posts/${slug}/comments`;
    try {
      const colRef = collection(db, 'posts', slug, 'comments');
      const snapshot = await getDocs(colRef);
      let comments = [];

      snapshot.forEach((d) => {
        if (d.exists()) {
          comments.push({ id: d.id, ...d.data() });
        }
      });

      if (!all) {
        comments = comments.filter((c) => c.approved !== false);
      }

      return { success: true, count: comments.length, comments };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, commentsPath);
    }
  },

  // 8. Add comment to Firestore subcollection
  async addComment(slug, commentData) {
    const commentId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const commentPath = `posts/${slug}/comments/${commentId}`;
    try {
      const docRef = doc(db, 'posts', slug, 'comments', commentId);
      const newComment = {
        id: commentId,
        name: (commentData.name || 'Reader').trim(),
        email: (commentData.email || '').trim().toLowerCase(),
        comment: (commentData.comment || '').trim(),
        date: new Date().toISOString().split('T')[0],
        approved: true,
        createdAt: new Date().toISOString(),
      };

      await setDoc(docRef, newComment);
      return { success: true, message: 'Comment submitted successfully to Firebase', comment: newComment };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, commentPath);
    }
  },

  // 9. Update comment approval/text in Firestore
  async updateComment(slug, commentId, updates) {
    const commentPath = `posts/${slug}/comments/${commentId}`;
    try {
      const docRef = doc(db, 'posts', slug, 'comments', commentId);
      await setDoc(docRef, updates, { merge: true });
      return { success: true, message: 'Comment updated in Firebase' };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, commentPath);
    }
  },

  // 10. Delete comment from Firestore
  async deleteComment(slug, commentId) {
    const commentPath = `posts/${slug}/comments/${commentId}`;
    try {
      const docRef = doc(db, 'posts', slug, 'comments', commentId);
      await deleteDoc(docRef);
      return { success: true, message: 'Comment deleted from Firebase' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, commentPath);
    }
  },

  // 11. Get all comments across all posts for CMS moderation
  async getAllComments() {
    try {
      const postsRes = await this.getPosts();
      const posts = postsRes.posts || [];
      const allComments = [];

      for (const p of posts) {
        const postSlug = p.slug || p.id;
        try {
          const snap = await getDocs(collection(db, 'posts', postSlug, 'comments'));
          snap.forEach((d) => {
            if (d.exists()) {
              allComments.push({
                id: d.id,
                postSlug,
                postTitle: p.title,
                ...d.data(),
              });
            }
          });
        } catch {}
      }

      return { success: true, count: allComments.length, comments: allComments };
    } catch (err) {
      return { success: true, count: 0, comments: [] };
    }
  },

  // 12. Upload image - converts to data URL for serverless/Firebase storage portability
  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          message: 'Image converted for Firebase storage',
          url: reader.result,
          filename: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  // 13. System stats for Admin Dashboard directly from Firebase Firestore
  async getStats() {
    const postsRes = await this.getPosts();
    const posts = postsRes.posts || [];
    const catSet = new Set(posts.map((p) => p.category || 'General'));

    return {
      success: true,
      stats: {
        totalPosts: posts.length,
        totalCategories: catSet.size,
        totalComments: 0,
        pendingComments: 0,
      },
    };
  },

  // Sync / Migration helper if needed
  async syncLocalDraftsToServer() {
    return this.seedArticlesToFirebase();
  },

  // Seed / Sync articles into the active Firebase database
  async seedArticlesToFirebase() {
    let rawList = [];
    try {
      const res = await fetch('/src/data/defaultPosts.json');
      if (res.ok) {
        rawList = await res.json();
      }
    } catch {}

    if (!Array.isArray(rawList) || rawList.length === 0) {
      try {
        const res = await fetch('/defaultPosts.json');
        if (res.ok) rawList = await res.json();
      } catch {}
    }

    let count = 0;
    for (const post of rawList) {
      const slug = post.slug || post.id;
      if (slug) {
        try {
          const docRef = doc(db, 'posts', slug);
          await setDoc(docRef, { ...post, id: slug, slug }, { merge: true });
          count++;
        } catch (e) {
          console.warn('Failed to upload post:', slug, e);
          throw e;
        }
      }
    }

    return { success: true, count, message: `Uploaded ${count} articles to Firebase` };
  },
};

export default api;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Loader2,
  Filter,
  Check,
} from 'lucide-react';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, slug: '', title: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [postsRes, catRes] = await Promise.all([
        api.getPosts(),
        api.getCategories(),
      ]);
      if (postsRes.success) setPosts(postsRes.posts || []);
      if (catRes.success) setCategories(catRes.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.slug) return;
    try {
      await api.deletePost(deleteModal.slug);
      setPosts((prev) => prev.filter((p) => p.slug !== deleteModal.slug));
      setDeleteModal({ open: false, slug: '', title: '' });
    } catch (err) {
      alert(`Failed to delete post: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCat =
      selectedCategory === 'All' ||
      (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase());
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (post.title && post.title.toLowerCase().includes(q)) ||
      (post.slug && post.slug.toLowerCase().includes(q)) ||
      (post.author && post.author.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
            All Blog Dispatches
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Total {posts.length} stories stored physically on the filesystem.
          </p>
        </div>

        <Link
          to="/admin/posts/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, author or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-stone-500 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-stone-50 border border-stone-300 px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-rose-600 uppercase font-semibold"
          >
            <option value="All">All Categories ({posts.length})</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white border border-stone-200 shadow-xs">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No posts match the specified search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[10px] uppercase font-bold tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Comments</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPosts.map((post) => (
                  <tr key={post.slug} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 w-16">
                      <div className="w-12 h-9 bg-stone-100 overflow-hidden shrink-0">
                        <img
                          src={post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="font-bold text-stone-900 truncate">{post.title}</div>
                      <div className="text-[11px] text-stone-400 font-mono truncate">{post.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-semibold uppercase text-[10px]">
                        {post.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{post.author || 'Admin'}</td>
                    <td className="py-3 px-4 text-stone-500">{post.date}</td>
                    <td className="py-3 px-4">
                      {post.featured ? (
                        <span className="text-amber-600 font-bold uppercase text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="text-stone-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to="/admin/comments"
                        className="font-semibold text-stone-700 hover:text-rose-600"
                      >
                        {post.commentsCount ?? 0}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-stone-500 hover:text-stone-900"
                          title="Preview Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/posts/edit/${post.slug}`}
                          className="p-1.5 text-stone-500 hover:text-rose-600"
                          title="Edit Post"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, slug: post.slug, title: post.title })}
                          className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-stone-300 shadow-xl">
            <h3 className="font-sans font-bold text-lg text-stone-900 mb-2">
              Confirm Delete Dispatch
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong className="text-stone-900">"{deleteModal.title}"</strong>?
              This will remove the folder <code className="bg-stone-100 p-0.5 font-mono text-[11px]">server/data/posts/{deleteModal.slug}</code> and all associated comments.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, slug: '', title: '' })}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

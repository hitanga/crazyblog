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
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, slug: '', title: '' });
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(true);
    try {
      await api.deletePost(deleteModal.slug);
      const remaining = posts.filter((p) => p.slug !== deleteModal.slug);
      setPosts(remaining);
      setSuccessMessage(`"${deleteModal.title}" was permanently deleted and will never reappear.`);
      setDeleteModal({ open: false, slug: '', title: '' });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(`Failed to delete post: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearDemoPosts = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAllDefaultPosts();
      await loadData();
      setDemoModalOpen(false);
      setSuccessMessage('All old default demo posts have been permanently removed!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(`Failed to clear demo posts: ${err.message}`);
    } finally {
      setIsDeleting(false);
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
            Total {posts.length} articles active in your publication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDemoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors border border-stone-200 cursor-pointer"
            title="Permanently remove old placeholder demo articles"
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Clear Old Demo Posts</span>
          </button>

          <Link
            to="/admin/posts/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

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
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white p-12 text-center border border-stone-200 space-y-3">
          <p className="text-sm font-semibold text-stone-800">No blog posts found.</p>
          <p className="text-xs text-stone-500">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try changing your search query or category filter.'
              : 'Create your first article using the "New Article" button above.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredPosts.map((post) => (
                <tr key={post.slug} className="hover:bg-stone-50/75 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900 max-w-xs sm:max-w-sm truncate">
                    <div className="flex items-center gap-3">
                      {post.image && (
                        <img
                          src={post.image}
                          alt=""
                          className="w-10 h-10 object-cover border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="hover:text-rose-600 transition-colors block truncate"
                        >
                          {post.title}
                        </Link>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          /{post.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                      {post.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-600">{post.author || 'Admin'}</td>
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">{post.date}</td>
                  <td className="py-3 px-4 text-center">
                    {post.featured ? (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 inline-block" />
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-stone-400 hover:text-stone-800 transition-colors"
                        title="View Public Post"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/posts/edit/${post.slug}`}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Edit Post"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() =>
                          setDeleteModal({ open: true, slug: post.slug, title: post.title })
                        }
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
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

      {/* Single Post Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-stone-300 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-none shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-stone-900">
                  Delete Article Permanently?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  Are you sure you want to permanently delete <strong className="text-stone-900">"{deleteModal.title}"</strong>?
                  This action cannot be undone. The article and all its comments will be permanently erased and will never reappear.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModal({ open: false, slug: '', title: '' })}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Demo Posts Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-stone-300 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-none shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-stone-900">
                  Permanently Clear Old Demo Posts?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mt-1">
                  This will permanently delete all original placeholder demo articles from your website and database. Only your own custom articles and curated posts will remain.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDemoModalOpen(false)}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleClearDemoPosts}
                className="px-4 py-2 bg-stone-900 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Permanently Remove Demos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

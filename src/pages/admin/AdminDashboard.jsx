import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import {
  FileText,
  Star,
  MessageSquare,
  Clock,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    featuredPosts: 0,
    totalComments: 0,
    pendingComments: 0,
    categoriesCount: 0,
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, slug: '', title: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [statsRes, postsRes] = await Promise.all([
        api.getStats(),
        api.getPosts(),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (postsRes.success) setRecentPosts((postsRes.posts || []).slice(0, 5));
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
      setRecentPosts((prev) => prev.filter((p) => p.slug !== deleteModal.slug));
      setStats((prev) => ({
        ...prev,
        totalPosts: Math.max(0, prev.totalPosts - 1),
      }));
      setDeleteModal({ open: false, slug: '', title: '' });
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'TOTAL POSTS',
      value: stats.totalPosts,
      icon: <FileText className="w-5 h-5 text-stone-700" />,
      link: '/admin/posts',
      color: 'bg-white',
    },
    {
      label: 'FEATURED POSTS',
      value: stats.featuredPosts,
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
      link: '/admin/posts',
      color: 'bg-white',
    },
    {
      label: 'PENDING COMMENTS',
      value: stats.pendingComments,
      icon: <Clock className="w-5 h-5 text-rose-600" />,
      link: '/admin/comments',
      color: 'bg-white',
    },
    {
      label: 'TOTAL COMMENTS',
      value: stats.totalComments,
      icon: <MessageSquare className="w-5 h-5 text-stone-700" />,
      link: '/admin/comments',
      color: 'bg-white',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
            CrazyBlog Editorial Desk
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time management for articles, categories, and reader discussions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Article</span>
          </Link>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className={`${card.color} border border-stone-200 p-5 hover:border-stone-400 transition-colors flex items-center justify-between group`}
          >
            <div>
              <span className="block text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase">
                {card.label}
              </span>
              <span className="text-3xl font-black font-sans text-stone-900 mt-1 block">
                {card.value}
              </span>
            </div>
            <div className="p-2.5 bg-stone-50 border border-stone-100 group-hover:scale-105 transition-transform">
              {card.icon}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white border border-stone-200">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="font-sans font-bold text-base text-stone-900">
              Recent Dispatches
            </h2>
            <span className="text-xs text-stone-500">
              Latest stories stored in server/data/posts
            </span>
          </div>
          <Link
            to="/admin/posts"
            className="text-xs font-bold uppercase tracking-wider text-rose-600 hover:underline"
          >
            View All ({stats.totalPosts}) →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-800">No blog posts created yet (0 total)</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your platform is clean with zero default posts. Create your first article to get started!
            </p>
            <Link
              to="/admin/posts/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Post</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[10px] uppercase font-bold tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Comments</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentPosts.map((post) => (
                  <tr key={post.slug} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900 max-w-[280px]">
                      <div className="font-bold truncate">{post.title}</div>
                      <div className="text-[11px] text-stone-400 font-mono truncate">{post.slug}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-semibold uppercase text-[10px]">
                        {post.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">{post.date}</td>
                    <td className="py-3.5 px-4">
                      {post.featured ? (
                        <span className="text-amber-600 font-bold uppercase text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="text-stone-400">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-semibold">
                      {post.commentsCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-stone-500 hover:text-stone-900"
                          title="Preview Public Page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/posts/edit/${post.slug}`}
                          className="p-1 text-stone-500 hover:text-rose-600"
                          title="Edit Post"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, slug: post.slug, title: post.title })}
                          className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-stone-300 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-stone-900">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-stone-900">"{deleteModal.title}"</strong>? This will remove all files and comments associated with this article.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, slug: '', title: '' })}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

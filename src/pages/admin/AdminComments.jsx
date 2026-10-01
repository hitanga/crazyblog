import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  Loader2,
  Filter,
} from 'lucide-react';

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAllComments();
  }, []);

  async function loadAllComments() {
    try {
      setLoading(true);
      const res = await api.getAllComments();
      if (res.success) {
        setComments(res.comments || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (postSlug, commentId, currentApproved) => {
    try {
      await api.updateComment(postSlug, commentId, { approved: !currentApproved });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, approved: !currentApproved } : c
        )
      );
    } catch (err) {
      alert(`Failed to update comment: ${err.message}`);
    }
  };

  const handleDeleteComment = async (postSlug, commentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) {
      return;
    }
    try {
      await api.deleteComment(postSlug, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(`Failed to delete comment: ${err.message}`);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (statusFilter === 'approved') return c.approved;
    if (statusFilter === 'pending') return !c.approved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-sans font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
            Comment Moderation
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage and moderate reader responses across all stories.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 border border-stone-200">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Approved ({comments.filter((c) => c.approved).length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending ({comments.filter((c) => !c.approved).length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="bg-white border border-stone-200 shadow-xs">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No comments found matching this filter.
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="p-5 hover:bg-stone-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold text-stone-900 text-sm">
                      {comment.name}
                    </span>
                    <span className="text-stone-400 text-xs">
                      &lt;{comment.email}&gt;
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[11px] text-stone-400">
                      {comment.date || 'Recent'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 ml-2 ${
                        comment.approved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {comment.approved ? 'Approved' : 'Pending Moderation'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-line bg-stone-50 p-3 border border-stone-100 font-sans">
                    {comment.comment}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 pt-1">
                    <span className="font-semibold text-stone-600">On article:</span>
                    <Link
                      to={`/blog/${comment.postSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-900 hover:text-rose-600 font-medium inline-flex items-center gap-1"
                    >
                      <span>{comment.postTitle || comment.postSlug}</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </Link>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() =>
                      handleToggleStatus(comment.postSlug, comment.id, comment.approved)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                      comment.approved
                        ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    }`}
                  >
                    {comment.approved ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unapprove</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteComment(comment.postSlug, comment.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 border border-stone-200 hover:border-rose-300 cursor-pointer"
                    title="Delete Comment Permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

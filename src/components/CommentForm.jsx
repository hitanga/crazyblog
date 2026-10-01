import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.js';

export default function CommentForm({ postSlug, onCommentAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.name.trim() || !formData.email.trim() || !formData.comment.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.addComment(postSlug, formData);
      setSuccess(true);
      setFormData({ name: '', email: '', comment: '' });
      if (onCommentAdded && res.comment) {
        onCommentAdded(res.comment);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 border border-stone-200 p-6 sm:p-8 mt-10">
      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-900 mb-1">
        Leave a Response
      </h3>
      <p className="text-xs text-stone-500 mb-6">
        Your email address will not be published. Required fields are marked *
      </p>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your comment has been submitted and posted successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@example.com"
              className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
            Comment *
          </label>
          <textarea
            required
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Share your thoughts on this story..."
            className="w-full bg-white border border-stone-300 p-3.5 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 hover:bg-rose-600 disabled:bg-stone-400 text-white text-[11px] font-bold tracking-[0.18em] uppercase transition-colors rounded-none cursor-pointer"
        >
          {loading ? (
            'Submitting...'
          ) : (
            <>
              <span>Post Comment</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

import React from 'react';
import { MessageSquare, User } from 'lucide-react';

export default function CommentList({ comments = [] }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="py-8 text-center bg-stone-50 border border-stone-200">
        <MessageSquare className="w-6 h-6 mx-auto text-stone-400 mb-2 stroke-[1.5]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          No comments yet
        </p>
        <p className="text-xs text-stone-400 mt-1">
          Be the first to share your perspective on this essay.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <h3 className="text-base font-bold uppercase tracking-wider text-stone-900">
          Responses ({comments.length})
        </h3>
      </div>

      <div className="divide-y divide-stone-100">
        {comments.map((comment) => (
          <article key={comment.id} className="py-5 first:pt-2 last:pb-2">
            <div className="flex items-start gap-3.5">
              {/* Avatar Initial */}
              <div className="w-9 h-9 bg-stone-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {comment.name ? comment.name.charAt(0) : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-sans font-bold text-sm text-stone-900">
                    {comment.name}
                  </h4>
                  <time className="text-[11px] text-stone-400 font-medium">
                    {comment.date || 'Recent'}
                  </time>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {comment.comment}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

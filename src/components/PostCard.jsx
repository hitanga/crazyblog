import React from 'react';
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';

export default function PostCard({ post, hasBadge = false }) {
  if (!post) return null;

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase()
    : 'OCTOBER 1, 2026';

  const categoryLabel = (post.category || 'GENERAL').toUpperCase();

  return (
    <article className="group flex flex-col bg-white">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <Link to={`/blog/${post.slug}`} className="block w-full h-full">
          <img
            src={post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Optional editorial camera / media badge */}
        {hasBadge && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white p-1.5 shadow-sm">
            <Camera className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Content box */}
      <div className="pt-5 pb-6 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-sans font-bold text-lg sm:text-xl text-stone-900 leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Metadata */}
        <div className="mt-2.5 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] text-stone-500 uppercase flex items-center gap-1.5">
          <span>{formattedDate}</span>
          <span className="text-stone-300">•</span>
          <Link
            to={`/category/${post.category || 'General'}`}
            className="hover:text-rose-600 transition-colors"
          >
            {categoryLabel}
          </Link>
          {post.commentsCount !== undefined && post.commentsCount > 0 && (
            <>
              <span className="text-stone-300">•</span>
              <span>{post.commentsCount} {post.commentsCount === 1 ? 'COMMENT' : 'COMMENTS'}</span>
            </>
          )}
        </div>

        {/* Coral accent line */}
        <div className="w-6 h-[2px] bg-rose-600 mt-2.5 mb-3" />

        {/* Excerpt */}
        <p className="text-stone-600 text-xs sm:text-[13px] leading-relaxed line-clamp-3 font-normal flex-1">
          {post.excerpt}
        </p>

        {/* Read More Link */}
        <div className="mt-4 pt-1">
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center text-[10px] sm:text-[11px] tracking-[0.16em] font-bold uppercase text-stone-800 hover:text-rose-600 transition-colors group/link"
          >
            READ MORE
            <span className="ml-1 transition-transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

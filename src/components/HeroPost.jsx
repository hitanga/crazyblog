import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroPost({ post }) {
  if (!post) return null;

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase()
    : 'OCTOBER 1, 2026';

  const commentsTotal =
    typeof post.commentsCount === 'number'
      ? post.commentsCount
      : Array.isArray(post.comments)
      ? post.comments.length
      : 0;

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12">
      <div className="relative bg-[#1a1c1e] overflow-hidden min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] flex items-center shadow-sm">
        {/* Right background/hero image */}
        <div className="w-full lg:w-3/5 h-64 sm:h-80 lg:h-full lg:absolute lg:right-0 lg:top-0 order-1 lg:order-2 overflow-hidden">
          <img
            src={post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
            alt={post.title}
            className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlay on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1e] via-transparent to-transparent lg:hidden" />
        </div>

        {/* Left floating/overlapping editorial card */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 z-10 order-2 lg:order-1 lg:ml-12 my-6 sm:my-8 lg:my-10">
          <div className="bg-white p-6 sm:p-8 md:p-10 shadow-lg border border-stone-100 max-w-[500px]">
            {/* Small uppercase metadata */}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] text-stone-500 uppercase flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>{formattedDate}</span>
              <span className="text-stone-300">•</span>
              <span className="text-rose-600 font-extrabold">FEATURED</span>
              <span className="text-stone-300">•</span>
              <span>{commentsTotal} {commentsTotal === 1 ? 'COMMENT' : 'COMMENTS'}</span>
            </div>

            {/* Coral accent line */}
            <div className="w-7 h-[2px] bg-rose-600 mt-3 mb-4" />

            {/* Headline */}
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-[34px] leading-[1.18] text-stone-900 tracking-tight">
              <Link
                to={`/blog/${post.slug}`}
                className="hover:text-rose-600 transition-colors line-clamp-3"
              >
                {post.title}
              </Link>
            </h1>

            {/* Excerpt */}
            <p className="mt-3.5 text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
              {post.excerpt}
            </p>

            {/* Read more button / link */}
            <div className="mt-5 pt-2">
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center text-[11px] tracking-[0.18em] font-bold uppercase text-stone-900 hover:text-rose-600 transition-colors group"
              >
                READ MORE
                <span className="ml-1.5 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

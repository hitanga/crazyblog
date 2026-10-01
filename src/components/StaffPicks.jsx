import React from 'react';
import { Link } from 'react-router-dom';

export default function StaffPicks({ posts = [] }) {
  if (!posts || posts.length === 0) return null;

  // Primary pick (first post), secondary picks (next 2-3 posts)
  const primaryPost = posts[0];
  const secondaryPosts = posts.slice(1, 4);

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-12 border-t border-stone-200">
      {/* Header */}
      <div className="mb-8">
        <span className="block text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase">
          YOU HAVE TO READ THIS!
        </span>
        <h2 className="mt-1.5 font-sans font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">
          Staff's Picks
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left dominant feature */}
        {primaryPost && (
          <div className="lg:col-span-7 group">
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
              <Link to={`/blog/${primaryPost.slug}`} className="block w-full h-full">
                <img
                  src={primaryPost.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
                  alt={primaryPost.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </Link>
            </div>
            <div className="pt-5">
              <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] text-stone-500 uppercase flex items-center gap-1.5">
                <span>{primaryPost.date}</span>
                <span className="text-stone-300">•</span>
                <span className="text-rose-600 font-extrabold">EDITOR'S CHOICE</span>
                <span className="text-stone-300">•</span>
                <span>{(primaryPost.category || 'General').toUpperCase()}</span>
              </div>
              <div className="w-6 h-[2px] bg-rose-600 mt-2 mb-3" />
              <h3 className="font-sans font-extrabold text-xl sm:text-2xl text-stone-900 leading-snug group-hover:text-rose-600 transition-colors">
                <Link to={`/blog/${primaryPost.slug}`}>
                  {primaryPost.title}
                </Link>
              </h3>
              <p className="mt-2.5 text-stone-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                {primaryPost.excerpt}
              </p>
              <div className="mt-4">
                <Link
                  to={`/blog/${primaryPost.slug}`}
                  className="inline-flex items-center text-[11px] tracking-[0.16em] font-bold uppercase text-stone-900 hover:text-rose-600 transition-colors"
                >
                  READ STORY →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Right side supporting stories */}
        <div className="lg:col-span-5 flex flex-col divide-y divide-stone-200">
          {secondaryPosts.map((post) => (
            <article key={post.id || post.slug} className="py-5 first:pt-0 last:pb-0 group">
              <div className="flex gap-4 sm:gap-5 items-start">
                <div className="w-24 sm:w-28 aspect-[4/3] shrink-0 overflow-hidden bg-stone-100">
                  <Link to={`/blog/${post.slug}`} className="block w-full h-full">
                    <img
                      src={post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.16em] text-stone-400 uppercase">
                    {(post.category || 'GENERAL').toUpperCase()} • {post.date}
                  </div>
                  <h4 className="mt-1 font-sans font-bold text-sm sm:text-base text-stone-900 leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

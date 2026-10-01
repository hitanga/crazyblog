import React from 'react';
import { Link } from 'react-router-dom';
import PostCard from './PostCard.jsx';

export default function LatestStories({ posts = [] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
      {/* Editorial Section Header */}
      <div className="mb-8">
        <span className="block text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase">
          BROWSE AND READ THE LATEST STUFF
        </span>
        <h2 className="mt-1.5 font-sans font-black text-2xl sm:text-3xl md:text-4xl text-stone-900 tracking-tight">
          Latest Stories
        </h2>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {posts.map((post, idx) => (
          <PostCard
            key={post.id || post.slug}
            post={post}
            hasBadge={idx === 3} // Card 4 in the reference image has the camera badge
          />
        ))}
      </div>

      {/* MORE POSTS button */}
      <div className="mt-12 text-center">
        <Link
          to="/blog"
          className="inline-block px-7 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[11px] tracking-[0.2em] font-bold uppercase transition-colors shadow-sm"
        >
          MORE POSTS
        </Link>
      </div>
    </section>
  );
}

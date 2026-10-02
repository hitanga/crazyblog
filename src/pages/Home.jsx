import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroPost from '../components/HeroPost.jsx';
import LatestStories from '../components/LatestStories.jsx';
import StaffPicks from '../components/StaffPicks.jsx';
import api from '../services/api.js';
import { Loader2, PlusCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData(showSpinner = false) {
      try {
        if (showSpinner) setLoading(true);
        const res = await api.getPosts();
        if (isMounted && res.success) {
          setPosts(res.posts || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted && showSpinner) setLoading(false);
      }
    }

    loadData(true);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
          Loading editorial dispatches...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto my-16 p-8 bg-rose-50 border border-rose-200 text-center">
        <h2 className="text-lg font-bold text-rose-900 uppercase tracking-wider mb-2">
          Unable to Load Stories
        </h2>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-5 py-2 bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Clean-slate state when blog has zero posts
  if (posts.length === 0) {
    return (
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="max-w-lg mx-auto p-10 bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-[0.24em] text-rose-600 uppercase block mb-1">
              CLEAN SLATE PUBLICATION
            </span>
            <h2 className="font-sans font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
              Ready for Your Stories
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto mt-2">
              All demo posts have been removed. Your CrazyBlog platform is ready for your original horror tales, amazing facts, and knowledge base guides.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/admin/posts/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Article</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Find latest featured post for Hero
  const featuredPosts = posts.filter((p) => p.featured);
  const heroPost = featuredPosts.length > 0 ? featuredPosts[0] : posts[0];

  // Latest stories (take 6 posts)
  const latestPosts = posts.slice(0, 6);

  // Staff picks (take posts from 2 to 6, or remaining)
  const staffPicks = posts.length > 3 ? posts.slice(1, 5) : posts;

  return (
    <div className="w-full">
      {/* 1. Large Hero Featured Article */}
      <HeroPost post={heroPost} />

      {/* 2. Latest Stories 3-Column Grid */}
      <LatestStories posts={latestPosts} />

      {/* 3. Staff's Picks Section */}
      <StaffPicks posts={staffPicks} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import HeroPost from '../components/HeroPost.jsx';
import LatestStories from '../components/LatestStories.jsx';
import StaffPicks from '../components/StaffPicks.jsx';
import api from '../services/api.js';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getPosts();
        if (isMounted && res.success) {
          setPosts(res.posts || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
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

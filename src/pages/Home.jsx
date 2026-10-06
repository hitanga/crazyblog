import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroPost from '../components/HeroPost.jsx';
import LatestStories from '../components/LatestStories.jsx';
import StaffPicks from '../components/StaffPicks.jsx';
import FirebaseRulesAlert from '../components/FirebaseRulesAlert.jsx';
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
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = err.message || String(err);
          setError(errMsg);
          try {
            const fallback = await api.getFallbackPosts();
            if (isMounted && fallback.length > 0) {
              setPosts(fallback);
            }
          } catch {}
        }
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

  // Clean-slate state when blog has zero posts and no error
  if (posts.length === 0 && !error) {
    return (
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="max-w-lg mx-auto p-10 bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-black text-2xl text-stone-900 tracking-tight">
            Clean Slate Publication
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            All placeholder articles were removed. Start fresh by publishing your first real dispatch in the CMS!
          </p>
          <div className="pt-2">
            <Link
              to="/admin/posts/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Write First Article</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const heroPost = posts[0] || null;
  const latestPosts = posts.slice(1, 7);
  const staffPosts = posts.slice(7, 12);

  return (
    <div className="w-full">
      {/* Firebase security rules notification if locked */}
      {error && <FirebaseRulesAlert error={error} onRetry={() => window.location.reload()} />}

      {/* Hero Featured Article Section */}
      {heroPost && <HeroPost post={heroPost} />}

      {/* Main Content Area */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column: Latest Stories */}
          <div className="w-full lg:w-[68%]">
            <LatestStories posts={latestPosts} />
          </div>

          {/* Right Column: Staff Picks / Sidebar */}
          <div className="w-full lg:w-[32%]">
            <StaffPicks posts={staffPosts} />
          </div>
        </div>
      </div>
    </div>
  );
}

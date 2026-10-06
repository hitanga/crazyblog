import React, { useState, useEffect } from 'react';
import PostCard from '../components/PostCard.jsx';
import FirebaseRulesAlert from '../components/FirebaseRulesAlert.jsx';
import api from '../services/api.js';
import { Loader2, Search } from 'lucide-react';

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [postsRes, catRes] = await Promise.all([
          api.getPosts(),
          api.getCategories(),
        ]);
        if (postsRes && postsRes.success) setPosts(postsRes.posts || []);
        if (catRes && catRes.success) setCategories(catRes.categories || []);
        setError(null);
      } catch (err) {
        const errMsg = err.message || String(err);
        setError(errMsg);
        try {
          const fallback = await api.getFallbackPosts();
          if (fallback.length > 0) setPosts(fallback);
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      !searchFilter.trim() ||
      (post.title && post.title.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
      {/* Firebase security rules notification if locked */}
      {error && <FirebaseRulesAlert error={error} onRetry={() => window.location.reload()} />}

      {/* Header */}
      <div className="border-b border-stone-200 pb-8 mb-8 text-center sm:text-left">
        <span className="text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase block mb-1">
          THE ARCHIVES & EDITORIAL DISPATCHES
        </span>
        <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight">
          All Stories
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-xl">
          Browse through our full collection of long-form articles, architecture reviews, and engineering deep-dives.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-100">
        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All ({posts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-rose-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter current view..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-rose-600"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 border border-stone-200">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-700">
            No articles match your criteria
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Try adjusting your search terms or category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchFilter('');
            }}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredPosts.map((post, idx) => (
            <PostCard key={post.id || post.slug} post={post} hasBadge={idx % 4 === 1} />
          ))}
        </div>
      )}
    </div>
  );
}

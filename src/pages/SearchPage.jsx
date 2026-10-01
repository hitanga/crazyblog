import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import api from '../services/api.js';
import { Loader2, Search as SearchIcon, ArrowLeft } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputVal, setInputVal] = useState(query);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInputVal(query);
    if (!query.trim()) {
      setPosts([]);
      return;
    }

    async function executeSearch() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getPosts({ search: query });
        if (res.success) {
          setPosts(res.posts || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
      <div className="border-b border-stone-200 pb-8 mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-rose-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span className="text-[11px] font-bold tracking-[0.22em] text-stone-400 uppercase block">
          DISCOVERY & ARCHIVE SEARCH
        </span>
        <h1 className="font-sans font-black text-3xl sm:text-4xl text-stone-900 tracking-tight mt-1">
          Search Results
        </h1>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search by title, excerpt, keyword or category..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-stone-900 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Search
          </button>
        </form>

        {query && (
          <p className="mt-4 text-xs text-stone-500">
            Showing results for <span className="font-bold text-stone-900">"{query}"</span> ({posts.length} {posts.length === 1 ? 'match' : 'matches'})
          </p>
        )}
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 text-center text-rose-800 text-xs">
          {error}
        </div>
      ) : query && posts.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 border border-stone-200">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-700">
            No articles match "{query}"
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Try searching for "React", "urban", "coffee", "travel" or another keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {posts.map((post) => (
            <PostCard key={post.id || post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

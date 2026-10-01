import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import api from '../services/api.js';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function CategoryPage() {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCategoryData() {
      try {
        setLoading(true);
        const [postsRes, catRes] = await Promise.all([
          api.getPosts({ category }),
          api.getCategories(),
        ]);
        if (isMounted) {
          if (postsRes.success) setPosts(postsRes.posts || []);
          if (catRes.success) setCategories(catRes.categories || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCategoryData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
      {/* Category Header */}
      <div className="border-b border-stone-200 pb-8 mb-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-rose-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Dispatches</span>
        </Link>
        <span className="text-[11px] font-bold tracking-[0.22em] text-stone-400 uppercase block">
          CATEGORY ARCHIVES
        </span>
        <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight mt-1 capitalize">
          {category}
        </h1>
        <p className="mt-2 text-xs text-stone-500">
          Showing {posts.length} {posts.length === 1 ? 'article' : 'articles'} filed under {category}.
        </p>

        {/* Other categories pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/category/${c.name}`}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                c.name.toLowerCase() === category.toLowerCase()
                  ? 'bg-rose-600 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c.name} ({c.count})
            </Link>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-stone-50 border border-stone-200">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-700">
            No articles found in {category}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Check other categories or write a new post in the CMS dashboard.
          </p>
          <Link
            to="/blog"
            className="mt-4 inline-block px-4 py-2 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-600 transition-colors"
          >
            Browse All Stories
          </Link>
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

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import CommentList from '../components/CommentList.jsx';
import CommentForm from '../components/CommentForm.jsx';
import SocialShare from '../components/SocialShare.jsx';
import PostCard from '../components/PostCard.jsx';
import { Loader2, ArrowLeft, Calendar, User, MessageCircle, Tag } from 'lucide-react';
import siteConfig from '../config/siteConfig.js';

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);

        // Fetch post detail and comments
        const [postRes, commentsRes, allPostsRes] = await Promise.all([
          api.getPost(slug),
          api.getComments(slug),
          api.getPosts(),
        ]);

        if (!postRes || !postRes.success) {
          throw new Error('The requested article could not be found.');
        }

        if (isMounted) {
          const currentPost = postRes.post;
          setPost(currentPost);
          setComments(commentsRes.comments || []);

          // SEO dynamic head update
          document.title = `${currentPost.title} — ${siteConfig.name}`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', currentPost.excerpt || '');
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute('content', currentPost.title);
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.setAttribute('content', currentPost.excerpt || '');

          // Filter related posts (same category, excluding current post)
          if (allPostsRes.success && allPostsRes.posts) {
            const related = allPostsRes.posts
              .filter(
                (p) =>
                  p.slug !== slug &&
                  p.category &&
                  p.category.toLowerCase() === (currentPost.category || '').toLowerCase()
              )
              .slice(0, 3);

            // If not enough in same category, pad with other recent posts
            if (related.length < 3) {
              const others = allPostsRes.posts
                .filter((p) => p.slug !== slug && !related.find((r) => r.slug === p.slug))
                .slice(0, 3 - related.length);
              setRelatedPosts([...related, ...others]);
            } else {
              setRelatedPosts(related);
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticle();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleCommentAdded = (newComment) => {
    setComments((prev) => [...prev, newComment]);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
          Loading article...
        </span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-[700px] mx-auto my-20 p-8 bg-stone-50 border border-stone-200 text-center">
        <h2 className="text-2xl font-bold font-sans text-stone-900 uppercase tracking-tight mb-2">
          Article Not Found
        </h2>
        <p className="text-xs text-stone-600 mb-6">
          {error || "The article you are looking for doesn't exist or was removed."}
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Articles</span>
        </Link>
      </div>
    );
  }

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase()
    : 'OCTOBER 1, 2026';

  return (
    <article className="w-full">
      {/* Editorial Header */}
      <header className="max-w-[960px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 text-center">
        {/* Category & Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-rose-600 mb-3">
          <Link
            to={`/category/${post.category || 'General'}`}
            className="hover:underline"
          >
            {post.category || 'General'}
          </Link>
          {post.featured && (
            <>
              <span className="text-stone-300">•</span>
              <span className="text-stone-700">FEATURED ESSAY</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-stone-900 leading-[1.18] tracking-tight max-w-4xl mx-auto">
          {post.title}
        </h1>

        {/* Coral Accent Line */}
        <div className="w-10 h-[2.5px] bg-rose-600 mx-auto mt-4 mb-6" />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-900 font-bold">{post.author || 'Editorial Desk'}</span>
          </div>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mb-12">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-stone-100 shadow-sm">
          <img
            src={post.image || '/src/assets/images/hero_urban_avenue_1790847328166.jpg'}
            alt={post.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Prose Content Container */}
      <div className="max-w-[780px] mx-auto px-4 sm:px-6">
        {/* Excerpt Lead */}
        {post.excerpt && (
          <p className="text-lg sm:text-xl text-stone-700 leading-relaxed font-normal italic border-l-2 border-rose-600 pl-5 mb-8">
            {post.excerpt}
          </p>
        )}

        {/* Rich HTML Content */}
        <div
          className="prose prose-stone max-w-none text-stone-800 text-base sm:text-[17px] leading-relaxed
            [&>p]:mb-5 [&>p]:leading-[1.8]
            [&>h2]:font-sans [&>h2]:font-bold [&>h2]:text-2xl [&>h2]:sm:text-3xl [&>h2]:text-stone-900 [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:tracking-tight
            [&>h3]:font-sans [&>h3]:font-bold [&>h3]:text-xl [&>h3]:text-stone-900 [&>h3]:mt-8 [&>h3]:mb-3
            [&>blockquote]:border-l-4 [&>blockquote]:border-stone-900 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-stone-700 [&>blockquote]:my-8 [&>blockquote]:text-lg
            [&>code]:bg-stone-100 [&>code]:border [&>code]:border-stone-200 [&>code]:p-4 [&>code]:block [&>code]:text-xs [&>code]:font-mono [&>code]:my-6 [&>code]:overflow-x-auto
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ul>li]:mb-1.5
            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&>ol>li]:mb-1.5
            [&>img]:w-full [&>img]:my-8 [&>img]:aspect-video [&>img]:object-cover"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Social Sharing */}
        <SocialShare title={post.title} />

        {/* Comments Section */}
        <section className="mt-12 pt-8 border-t border-stone-200">
          <CommentList comments={comments} />
          <CommentForm postSlug={post.slug} onCommentAdded={handleCommentAdded} />
        </section>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-16 mt-16 border-t border-stone-200">
          <div className="mb-8">
            <span className="text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase block mb-1">
              KEEP READING
            </span>
            <h2 className="font-sans font-black text-2xl sm:text-3xl text-stone-900 tracking-tight">
              Related Stories
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.map((related) => (
              <PostCard key={related.id || related.slug} post={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

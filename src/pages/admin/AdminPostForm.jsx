import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FirebaseRulesAlert from '../../components/FirebaseRulesAlert.jsx';
import api from '../../services/api.js';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Search,
  Globe,
  Link2,
  Check,
  Tag,
  HelpCircle,
} from 'lucide-react';

export default function AdminPostForm() {
  const { id: editSlug } = useParams();
  const isEditing = Boolean(editSlug);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Horror Stories',
    author: 'Admin',
    date: new Date().toISOString().split('T')[0],
    image: '/src/assets/images/hero_urban_avenue_1790847328166.jpg',
    excerpt: '',
    content: '<p>Write your story here...</p>',
    featured: false,
    seoTitle: '',
    seoPermalink: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const [seoTitleTouched, setSeoTitleTouched] = useState(false);
  const [seoPermalinkTouched, setSeoPermalinkTouched] = useState(false);
  const [seoDescTouched, setSeoDescTouched] = useState(false);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If editing, load existing post from backend
  useEffect(() => {
    if (isEditing) {
      async function loadPost() {
        try {
          setInitialLoading(true);
          const res = await api.getPost(editSlug);
          if (res && res.success && res.post) {
            setFormData({
              title: res.post.title || '',
              slug: res.post.slug || '',
              category: res.post.category || 'Horror Stories',
              author: res.post.author || 'Admin',
              date: res.post.date || new Date().toISOString().split('T')[0],
              image: res.post.image || '',
              excerpt: res.post.excerpt || '',
              content: res.post.content || '',
              featured: Boolean(res.post.featured),
              seoTitle: res.post.seoTitle || res.post.title || '',
              seoPermalink: res.post.seoPermalink || res.post.slug || '',
              seoDescription: res.post.seoDescription || res.post.excerpt || '',
              seoKeywords: res.post.seoKeywords || '',
            });
            setSlugManuallyEdited(true);
            setSeoTitleTouched(true);
            setSeoPermalinkTouched(true);
            setSeoDescTouched(true);
          } else {
            setError('Post not found');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setInitialLoading(false);
        }
      }
      loadPost();
    }
  }, [editSlug, isEditing]);

  // Helper to slugify a string
  const slugify = (str) => {
    return (str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate SEO fields when title changes if user hasn't explicitly customized them
  const handleTitleChange = (e) => {
    const val = e.target.value;
    const generatedSlug = slugify(val);
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!slugManuallyEdited && !isEditing) {
        updated.slug = generatedSlug;
      }
      if (!seoTitleTouched && !isEditing) {
        updated.seoTitle = val;
      }
      if (!seoPermalinkTouched && !isEditing) {
        updated.seoPermalink = generatedSlug;
      }
      return updated;
    });
  };

  // Auto-generate SEO description when excerpt changes if user hasn't customized it
  const handleExcerptChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, excerpt: val };
      if (!seoDescTouched && !isEditing) {
        updated.seoDescription = val;
      }
      return updated;
    });
  };

  // Local Image Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    try {
      const res = await api.uploadImage(file);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
        setImagePreviewError(false);
      }
    } catch (err) {
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Rich content formatting quick-insert helper
  const insertContentSnippet = (tagOpen, tagClose = '') => {
    const snippet = `${tagOpen}New Section${tagClose}`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content + `\n${snippet}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanTitle = formData.title.trim();
    const finalPermalink = slugify(formData.seoPermalink || formData.slug || cleanTitle);
    const finalSeoTitle = (formData.seoTitle || cleanTitle).trim();
    const finalSeoDesc = (formData.seoDescription || formData.excerpt || '').trim();

    if (!cleanTitle) {
      setError('Article title is required.');
      return;
    }

    const payload = {
      ...formData,
      title: cleanTitle,
      slug: finalPermalink || `post-${Date.now()}`,
      seoTitle: finalSeoTitle,
      seoPermalink: finalPermalink || `post-${Date.now()}`,
      seoDescription: finalSeoDesc,
      seoKeywords: (formData.seoKeywords || '').trim(),
    };

    setLoading(true);
    try {
      if (isEditing) {
        await api.updatePost(editSlug, payload);
        setSuccess('Post and SEO metadata updated successfully in Firebase Firestore!');
      } else {
        const created = await api.createPost(payload);
        const savedSlug = created?.post?.slug || payload.slug;
        setSuccess(`Post published and saved to Firebase Firestore (${savedSlug})! Now live on all devices.`);
      }

      setTimeout(() => {
        navigate('/admin/posts');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  const previewPermalink = slugify(formData.seoPermalink || formData.slug || 'article-permalink');
  const previewSeoTitle = formData.seoTitle || formData.title || 'Your Article Title | CrazyBlog';
  const previewSeoDesc =
    formData.seoDescription ||
    formData.excerpt ||
    'Provide a compelling meta description here so readers on Google can discover your story...';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            className="p-1.5 text-stone-600 hover:text-stone-900 border border-stone-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-sans font-black text-2xl text-stone-900 tracking-tight">
              {isEditing ? `Edit: ${formData.title || 'Story'}` : 'Compose New Dispatch'}
            </h1>
            <span className="text-[11px] text-stone-400 font-medium">
              Physical isolated JSON filesystem + Dynamic Google SEO tags
            </span>
          </div>
        </div>

        {isEditing && formData.slug && (
          <Link
            to={`/blog/${formData.seoPermalink || formData.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Post</span>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {error && <FirebaseRulesAlert error={error} />}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 border border-stone-200 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. The Whispers of Blackwood Manor"
              className="w-full bg-stone-50 border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:border-rose-600 rounded-none focus:bg-white transition-colors"
            />
          </div>

          {/* Category & Slug Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Category
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Horror Stories, Amazing Facts, Knowledge Base"
                className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400">Quick pick:</span>
                {['Horror Stories', 'Amazing Facts', 'Knowledge Base'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`text-[10px] px-2 py-0.5 font-semibold border transition-colors cursor-pointer ${
                      formData.category === cat
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Author
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
              />
            </div>
          </div>

          {/* Date & Featured Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Publish Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-rose-600 border-stone-300 focus:ring-0 rounded-none cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Mark as Featured Essay
                </span>
              </label>
            </div>
          </div>

          {/* Image Management */}
          <div className="border-t border-stone-100 pt-5 space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
              Featured Hero Image (URL or Local Upload)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreviewError(false);
                      }}
                      placeholder="Enter public image URL or choose file..."
                      className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">Or upload local file:</span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-stone-600" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Live Image Preview */}
              <div className="border border-stone-200 p-2 bg-stone-50">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1.5">
                  Live Preview
                </span>
                <div className="aspect-[4/3] bg-stone-200 overflow-hidden relative flex items-center justify-center">
                  {formData.image && !imagePreviewError ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  ) : (
                    <div className="text-stone-400 text-center p-2 text-[10px]">
                      {imagePreviewError ? 'Failed to load image preview' : 'No image selected'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="border-t border-stone-100 pt-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Article Excerpt / Brief Summary *
            </label>
            <textarea
              rows={2}
              required
              value={formData.excerpt}
              onChange={handleExcerptChange}
              placeholder="A short, evocative description that appears on cards and feeds..."
              className="w-full bg-white border border-stone-300 p-3 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none resize-y"
            />
          </div>

          {/* ========================================================= */}
          {/* SEARCH ENGINE OPTIMIZATION (SEO) SECTION */}
          {/* ========================================================= */}
          <div className="border-t-2 border-stone-200 pt-6 mt-6 bg-stone-50/70 -mx-6 px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600 text-white rounded-none">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-sm text-stone-900 uppercase tracking-wider">
                    Search Engine Optimization (SEO & Google Search)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Configure your SEO Title, SEO Permalink, and SEO Meta Description for high Google rankings.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                SEO Ready
              </span>
            </div>

            {/* Google Search Result Live Preview Card */}
            <div className="bg-white p-4 border border-stone-300 mb-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-stone-400" />
                  Google Search Result Preview
                </span>
                <span className="text-[10px] font-mono text-stone-400">Desktop & Mobile snippet</span>
              </div>

              {/* Realistic Google Search Snippet */}
              <div className="space-y-1 font-sans">
                {/* Site name & Favicon breadcrumb */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center text-[9px] text-white font-bold">
                    C
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#202124] leading-tight">
                    <span className="font-medium text-stone-800">CrazyBlog</span>
                    <span className="text-stone-400">›</span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      blog › {previewPermalink}
                    </span>
                  </div>
                </div>

                {/* Google Blue Title */}
                <h4 className="text-[18px] text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug tracking-tight">
                  {previewSeoTitle}
                </h4>

                {/* Google Meta Description */}
                <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2 max-w-2xl">
                  {previewSeoDesc}
                </p>
              </div>
            </div>

            {/* SEO Inputs Grid */}
            <div className="space-y-4">
              {/* 1. SEO Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span>SEO Title</span>
                    <span className="text-[10px] font-normal text-stone-400">(Powers &lt;title&gt; and Google headline)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${
                        (formData.seoTitle || '').length > 60
                          ? 'text-amber-600 font-bold'
                          : 'text-stone-400'
                      }`}
                    >
                      {(formData.seoTitle || '').length} / 60 characters
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, seoTitle: prev.title }));
                        setSeoTitleTouched(true);
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Copy from Title
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => {
                    setSeoTitleTouched(true);
                    setFormData({ ...formData, seoTitle: e.target.value });
                  }}
                  placeholder="e.g. The Whispers of Blackwood Manor — A Chilling True Horror Tale"
                  className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  This custom title is injected into the HTML header for Google search robots and browser tabs.
                </p>
              </div>

              {/* 2. SEO Permalink / URL Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span>SEO Permalink / Slug</span>
                    <span className="text-[10px] font-normal text-stone-400">(Permanent canonical URL)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = slugify(formData.title);
                      setFormData((prev) => ({ ...prev, seoPermalink: gen, slug: gen }));
                      setSeoPermalinkTouched(true);
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Generate from Title
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="bg-stone-200 border border-r-0 border-stone-300 px-3 py-2 text-[11px] font-mono text-stone-600 select-none">
                    /blog/
                  </span>
                  <input
                    type="text"
                    value={formData.seoPermalink || formData.slug}
                    onChange={(e) => {
                      const clean = slugify(e.target.value);
                      setSeoPermalinkTouched(true);
                      setFormData({ ...formData, seoPermalink: clean, slug: clean });
                    }}
                    placeholder="e.g. the-whispers-of-blackwood-manor"
                    className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Full Canonical URL: <code className="bg-stone-100 px-1 py-0.5 font-mono text-[10px] text-stone-800">https://crazyblog.com/blog/{previewPermalink}</code>
                </p>
              </div>

              {/* 3. SEO Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span>SEO Meta Description</span>
                    <span className="text-[10px] font-normal text-stone-400">(Appears in Google search snippets)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono ${
                        (formData.seoDescription || '').length > 160
                          ? 'text-amber-600 font-bold'
                          : 'text-stone-400'
                      }`}
                    >
                      {(formData.seoDescription || '').length} / 160 characters
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, seoDescription: prev.excerpt }));
                        setSeoDescTouched(true);
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Copy from Excerpt
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={formData.seoDescription}
                  onChange={(e) => {
                    setSeoDescTouched(true);
                    setFormData({ ...formData, seoDescription: e.target.value });
                  }}
                  placeholder="Summarize the core premise with keywords so users click your article in Google search results..."
                  className="w-full bg-white border border-stone-300 p-3 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none resize-y"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Injected dynamically into <code className="bg-stone-100 px-1 font-mono text-[10px]">&lt;meta name="description"&gt;</code> and social share cards.
                </p>
              </div>

              {/* 4. SEO Keywords / Tags */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-800 mb-1">
                  SEO Keywords & Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.seoKeywords}
                  onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                  placeholder="e.g. horror story, paranormal, new england mansion, mystery, scary tales"
                  className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                />
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="border-t border-stone-100 pt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                Story Content (HTML Supported) *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<h2>', '</h2>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100 cursor-pointer"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<h3>', '</h3>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100 cursor-pointer"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<p>', '</p>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100 cursor-pointer"
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<blockquote>"', '"</blockquote>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100 cursor-pointer"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<code>', '</code>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100 cursor-pointer"
                >
                  Code
                </button>
              </div>
            </div>

            <textarea
              rows={12}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-white border border-stone-300 p-4 text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-600 rounded-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/admin/posts"
            className="px-5 py-2.5 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-stone-900 hover:bg-rose-600 disabled:bg-stone-400 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Save Post & SEO to Firebase' : 'Publish Story & SEO to Firebase'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

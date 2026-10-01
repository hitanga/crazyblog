import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';

export default function AdminPostForm() {
  const { id: editSlug } = useParams();
  const isEditing = Boolean(editSlug);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Technology',
    author: 'Admin',
    date: new Date().toISOString().split('T')[0],
    image: '/src/assets/images/hero_urban_avenue_1790847328166.jpg',
    excerpt: '',
    content: '<p>Write your story here...</p>',
    featured: false,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

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
              category: res.post.category || 'Technology',
              author: res.post.author || 'Admin',
              date: res.post.date || new Date().toISOString().split('T')[0],
              image: res.post.image || '',
              excerpt: res.post.excerpt || '',
              content: res.post.content || '',
              featured: Boolean(res.post.featured),
            });
            setSlugManuallyEdited(true);
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

  // Auto-generate slug from title if not manually edited
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!slugManuallyEdited && !isEditing) {
        updated.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
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
    let cleanSlug = formData.slug.trim();
    if (!cleanSlug && cleanTitle) {
      cleanSlug = cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (!cleanTitle) {
      setError('Article title is required.');
      return;
    }

    const payload = {
      ...formData,
      title: cleanTitle,
      slug: cleanSlug || `post-${Date.now()}`,
    };

    setLoading(true);
    try {
      if (isEditing) {
        await api.updatePost(editSlug, payload);
        setSuccess('Post updated successfully!');
      } else {
        await api.createPost(payload);
        setSuccess('Post created successfully in server/data/posts!');
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
              {isEditing ? `Edit Dispatch: ${formData.title}` : 'Compose New Dispatch'}
            </h1>
            <span className="text-xs text-stone-500">
              {isEditing ? `Modifying server/data/posts/${editSlug}/post.json` : 'Creates dedicated JSON folder under server/data/posts/'}
            </span>
          </div>
        </div>

        {isEditing && (
          <Link
            to={`/blog/${formData.slug}`}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-rose-600 font-semibold uppercase tracking-wider"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 border border-stone-200 space-y-5">
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
              placeholder="e.g. Modern Architecture and Urban Rhythms"
              className="w-full bg-white border border-stone-300 px-3.5 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Folder / URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setFormData({ ...formData, slug: e.target.value });
                }}
                placeholder="e.g. modern-architecture"
                className="w-full bg-white border border-stone-300 px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Saved as folder: server/data/posts/{formData.slug || 'slug'}
              </span>
            </div>

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
          </div>

          {/* Author & Date & Featured Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-stone-300 rounded"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Mark as Featured Story
                </span>
              </label>
            </div>
          </div>

          {/* Featured Image URL & Local Upload */}
          <div className="border-t border-stone-100 pt-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Featured Image
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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
                      placeholder="Enter public URL or choose an uploaded file..."
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
              Excerpt / Brief Summary *
            </label>
            <textarea
              rows={2}
              required
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="A short, evocative description that appears on the card and in search snippets..."
              className="w-full bg-white border border-stone-300 p-3 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none resize-y"
            />
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
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<h3>', '</h3>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<p>', '</p>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100"
                >
                  Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<blockquote>"', '"</blockquote>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertContentSnippet('<code>', '</code>')}
                  className="px-2 py-0.5 text-[10px] font-bold border border-stone-300 bg-stone-50 hover:bg-stone-100"
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
            className="px-5 py-2.5 border border-stone-300 text-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50"
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
            <span>{isEditing ? 'Save Changes' : 'Publish Story to JSON'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

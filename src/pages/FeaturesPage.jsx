import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, FileText, Image, MessageSquare, Smartphone, Zap, Check } from 'lucide-react';

export default function FeaturesPage() {
  const featuresList = [
    {
      icon: <Database className="w-5 h-5 text-rose-600" />,
      title: "JSON-File Storage Engine",
      description: "Zero SQL or MongoDB needed. Every single article lives in its own directory with dedicated post.json and comments.json files, making data 100% portable and human-readable."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-rose-600" />,
      title: "Firebase Authentication",
      description: "Secure email and password administrative authentication protecting CMS management routes and write operations."
    },
    {
      icon: <FileText className="w-5 h-5 text-rose-600" />,
      title: "Complete CMS Dashboard",
      description: "Create, edit, delete, preview, and categorize blog posts. Automatic slug generator with manual slug override capabilities."
    },
    {
      icon: <Image className="w-5 h-5 text-rose-600" />,
      title: "Dual Image Management",
      description: "Support for direct image URLs with live reactive preview plus local image file uploads directly to /server/public/uploads."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-rose-600" />,
      title: "Isolated Comments Architecture",
      description: "Public reader comment submission with admin moderation tools: approve, pending review, or delete comments per article."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-rose-600" />,
      title: "Responsive Editorial Design",
      description: "Precision-engineered light theme matching the GutenVerse magazine aesthetic: 3-column desktop grid, bold typography, and coral accents."
    }
  ];

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-[11px] font-bold tracking-[0.24em] text-stone-500 uppercase block mb-1">
          SYSTEM CAPABILITIES & ARCHITECTURE
        </span>
        <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight">
          Magazine & CMS Features
        </h1>
        <div className="w-8 h-[2px] bg-rose-600 mx-auto mt-4 mb-4" />
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Built for writers, editors, and engineers who appreciate clean typography, lightweight file-based data structures, and lightning-fast full-stack performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {featuresList.map((f, i) => (
          <div key={i} className="bg-stone-50 border border-stone-200 p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-white border border-stone-200 flex items-center justify-center mb-5 shadow-xs">
                {f.icon}
              </div>
              <h3 className="font-sans font-bold text-lg text-stone-900 mb-2">
                {f.title}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {f.description}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" />
              <span>Production Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture Overview Section */}
      <div className="bg-[#1a1c1e] text-white p-8 sm:p-12 mb-12">
        <div className="max-w-3xl">
          <span className="text-[11px] font-bold tracking-[0.2em] text-rose-500 uppercase block mb-2">
            HOW THE BACKEND WORKS
          </span>
          <h2 className="font-sans font-black text-2xl sm:text-3xl tracking-tight mb-4">
            Physical JSON Storage Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-6">
            Whenever a writer clicks "Publish Post" in the CMS Dashboard, Express triggers Node's filesystem APIs:
          </p>
          <pre className="bg-black/60 p-4 border border-stone-700 text-stone-300 text-xs font-mono overflow-x-auto">
{`server/
  data/
    posts/
      my-new-post/
        post.json       <-- Title, slug, excerpt, image, category, content
        comments.json   <-- Reader responses and approval statuses
  public/
    uploads/            <-- Physical images uploaded from CMS`}
          </pre>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/admin/dashboard"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Open CMS Dashboard →
            </Link>
            <Link
              to="/blog"
              className="px-6 py-2.5 border border-stone-600 hover:bg-white hover:text-stone-900 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Explore Dispatches
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

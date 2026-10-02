import React, { useState } from 'react';
import { Twitter, Facebook, Linkedin, Link2, Check, Share2, MessageCircle } from 'lucide-react';

export default function SocialShare({ title = '', url = '', description = '' }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const shareText = title ? `${title}` : 'Check out this story on CrazyBlog';
  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const shareLinkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} - ${currentUrl}`)}`;
  const shareReddit = `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-4 bg-stone-50 border border-stone-200 my-8">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-rose-600" />
        <span className="text-xs font-bold tracking-[0.16em] uppercase text-stone-700">
          Share this story:
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Twitter / X */}
        <a
          href={shareTwitter}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-white border border-stone-300 text-stone-700 hover:text-white hover:bg-black hover:border-black transition-colors"
          title="Share on Twitter / X"
        >
          <Twitter className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* Facebook */}
        <a
          href={shareFacebook}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-white border border-stone-300 text-stone-700 hover:text-white hover:bg-[#1877f2] hover:border-[#1877f2] transition-colors"
          title="Share on Facebook"
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* WhatsApp */}
        <a
          href={shareWhatsApp}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-white border border-stone-300 text-stone-700 hover:text-white hover:bg-[#25D366] hover:border-[#25D366] transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* LinkedIn */}
        <a
          href={shareLinkedin}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-white border border-stone-300 text-stone-700 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] transition-colors"
          title="Share on LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 hover:text-rose-600 hover:border-rose-600 transition-colors text-xs font-semibold cursor-pointer"
          title="Copy link to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Link Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

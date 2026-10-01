import React, { useState } from 'react';
import { Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';

export default function SocialShare({ title, url }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = url || window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const shareLinkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="flex items-center gap-3 py-4 border-t border-b border-stone-200 my-8">
      <span className="text-xs font-bold tracking-[0.16em] uppercase text-stone-500">
        Share this story:
      </span>
      <div className="flex items-center gap-2">
        <a
          href={shareTwitter}
          target="_blank"
          rel="noreferrer"
          className="p-2 border border-stone-200 text-stone-700 hover:text-white hover:bg-black hover:border-black transition-colors"
          title="Share on Twitter / X"
        >
          <Twitter className="w-3.5 h-3.5 fill-current" />
        </a>
        <a
          href={shareFacebook}
          target="_blank"
          rel="noreferrer"
          className="p-2 border border-stone-200 text-stone-700 hover:text-white hover:bg-[#1877f2] hover:border-[#1877f2] transition-colors"
          title="Share on Facebook"
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </a>
        <a
          href={shareLinkedin}
          target="_blank"
          rel="noreferrer"
          className="p-2 border border-stone-200 text-stone-700 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] transition-colors"
          title="Share on LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5 fill-current" />
        </a>
        <button
          onClick={handleCopy}
          className="p-2 border border-stone-200 text-stone-700 hover:text-rose-600 hover:border-rose-600 transition-colors flex items-center gap-1 text-xs"
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

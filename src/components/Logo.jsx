import React from 'react';
import { Link } from 'react-router-dom';
import siteConfig from '../config/siteConfig.js';
import { Flame } from 'lucide-react';

export default function Logo({ className = '', align = 'left' }) {
  const isLeft = align === 'left';

  return (
    <Link
      to="/"
      className={`inline-flex flex-col ${
        isLeft ? 'items-start text-left' : 'items-center text-center'
      } group text-stone-900 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-xs group-hover:bg-rose-600 transition-colors">
          <Flame className="w-5 h-5 text-rose-500 group-hover:text-white transition-colors" />
        </div>
        <span className="font-sans font-black tracking-tight text-2xl sm:text-3xl md:text-[32px] leading-none transition-opacity">
          <span>Crazy</span>
          <span className="text-rose-600">Blog</span>
        </span>
      </div>
      {siteConfig.tagline && (
        <span
          className={`mt-1.5 text-[8.5px] sm:text-[9.5px] tracking-[0.24em] font-bold text-stone-400 uppercase ${
            isLeft ? 'text-left pl-10' : 'text-center'
          }`}
        >
          {siteConfig.tagline}
        </span>
      )}
    </Link>
  );
}

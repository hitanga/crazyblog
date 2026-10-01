import React from 'react';
import { Link } from 'react-router-dom';
import siteConfig from '../config/siteConfig.js';

export default function Logo({ className = '', align = 'left' }) {
  const name = siteConfig.name || 'GUTENVERSE';
  const tagline = siteConfig.tagline || 'MULTIPURPOSE MAGAZINE AND BLOG THEME';
  const isLeft = align === 'left';

  return (
    <Link to="/" className={`inline-flex flex-col ${isLeft ? 'items-start text-left' : 'items-center text-center'} group text-stone-900 ${className}`}>
      <span className="font-sans font-black tracking-tight text-2xl sm:text-3xl md:text-[34px] uppercase leading-none transition-opacity group-hover:opacity-90">
        {name}
      </span>
      {tagline && (
        <span className={`mt-1.5 text-[9px] sm:text-[10px] tracking-[0.24em] font-medium text-stone-500 uppercase ${isLeft ? 'text-left' : 'text-center'}`}>
          {tagline}
        </span>
      )}
    </Link>
  );
}

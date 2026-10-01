import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <Compass className="w-12 h-12 text-rose-600 mx-auto mb-4 stroke-[1.5]" />
        <span className="text-[11px] font-bold tracking-[0.24em] text-stone-400 uppercase block mb-1">
          ERROR 404
        </span>
        <h1 className="font-sans font-black text-3xl sm:text-4xl text-stone-900 tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mb-8 leading-relaxed">
          The dispatch or magazine archive you are attempting to access does not exist or has been relocated to another section.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>
      </div>
    </div>
  );
}

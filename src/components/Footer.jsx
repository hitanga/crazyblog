import React from 'react';
import { Link } from 'react-router-dom';
import siteConfig from '../config/siteConfig.js';

export default function Footer() {
  return (
    <footer className="w-full bg-[#141517] text-stone-300 pt-14 pb-12 mt-16 border-t border-stone-800">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Brand info */}
          <div className="lg:col-span-6">
            <div className="text-left">
              <span className="font-sans font-black tracking-tight text-3xl uppercase text-white block">
                {siteConfig.name}
              </span>
              <span className="mt-1 text-[10px] tracking-[0.22em] font-medium text-stone-400 uppercase block">
                {siteConfig.tagline}
              </span>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md">
              An independent digital journal dedicated to architecture, technology, travel essays, and contemporary visual culture. Built with React and an isolated JSON-filesystem CMS backend.
            </p>
          </div>

          {/* Categories */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              {[
                { name: 'Horror Stories', path: '/category/Horror-Stories' },
                { name: 'Amazing Facts', path: '/category/Amazing-Facts' },
                { name: 'Knowledge Base', path: '/category/Knowledge-Base' },
                { name: 'All Stories', path: '/blog' },
              ].map((cat) => (
                <li key={cat.name}>
                  <Link to={cat.path} className="hover:text-rose-500 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-[0.2em] text-white uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link to="/" className="hover:text-rose-500 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-rose-500 transition-colors">All Stories</Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-rose-500 transition-colors">Features & CMS</Link>
              </li>
              <li>
                <Link to="/admin/dashboard" className="hover:text-rose-500 transition-colors">Admin Login</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} {siteConfig.name}. JSON-file powered editorial CMS.</p>
          <div className="flex items-center gap-6">
            <Link to="/admin/dashboard" className="text-stone-400 hover:text-white transition-colors">
              Admin Login
            </Link>
            <span className="text-stone-700">|</span>
            <a href="#root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-stone-400 hover:text-white transition-colors">
              Back to Top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Shield, Lock } from 'lucide-react';
import Logo from './Logo.jsx';
import navigation from '../config/navigation.js';
import siteConfig from '../config/siteConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="w-full bg-white border-b border-stone-200">
      {/* Top branding & utility bar */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        {/* Left: Mobile menu toggle + Logo placed on the left */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-stone-700 hover:text-rose-600 transition-colors lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2.2]" /> : <Menu className="w-5 h-5 stroke-[2.2]" />}
          </button>

          {/* Logo on the left side */}
          <Logo align="left" />
        </div>

        {/* Right: Search Icon placed with Admin Login Link */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Icon Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-1.5 p-2 text-stone-700 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-stone-200"
            aria-label="Open search dialog"
            title="Search articles"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-stone-600">
              Search
            </span>
          </button>

          {/* Admin Login Link */}
          <Link
            to={user ? "/admin/dashboard" : "/admin/login"}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase px-3.5 py-2 text-stone-900 hover:text-white bg-stone-100 hover:bg-stone-900 border border-stone-200 transition-all rounded-none"
            title="Admin Login Portal"
          >
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            <span>Admin Login</span>
          </Link>
        </div>
      </div>

      {/* Search dropdown overlay */}
      {searchOpen && (
        <div className="bg-stone-50 border-t border-b border-stone-200 py-4 px-4 transition-all">
          <form onSubmit={handleSearchSubmit} className="max-w-[700px] mx-auto flex items-center gap-3">
            <Search className="w-5 h-5 text-stone-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, keywords or categories..."
              className="w-full bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none py-1 border-b border-stone-300 focus:border-rose-600"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-stone-900 text-white text-xs font-semibold tracking-wider uppercase hover:bg-rose-600 transition-colors rounded-none cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-stone-400 hover:text-stone-700 text-sm px-1 cursor-pointer"
            >
              Close
            </button>
          </form>
        </div>
      )}

      {/* Desktop Horizontal Navigation Bar */}
      <nav className="hidden lg:block border-t border-stone-200">
        <div className="max-w-[1240px] mx-auto px-6">
          <ul className="flex items-center justify-start gap-8 py-3.5">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index} className="relative">
                  <Link
                    to={item.path}
                    className={`text-[12px] tracking-[0.14em] font-bold uppercase transition-colors flex items-center gap-1 ${
                      isActive ? 'text-rose-600 font-extrabold' : 'text-stone-800 hover:text-rose-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block ml-0.5" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-6 py-6 space-y-4">
          <ul className="space-y-3">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-1.5 text-sm font-bold tracking-wider uppercase ${
                      isActive ? 'text-rose-600' : 'text-stone-800 hover:text-rose-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>{siteConfig.name} © 2026</span>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-rose-600 font-semibold"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

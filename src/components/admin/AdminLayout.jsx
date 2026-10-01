import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  MessageSquare,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import siteConfig from '../../config/siteConfig.js';

export default function AdminLayout() {
  const { user, logout, isLiveFirebase } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'All Posts', path: '/admin/posts', icon: <FileText className="w-4 h-4" /> },
    { label: 'Create Post', path: '/admin/posts/create', icon: <PlusCircle className="w-4 h-4" /> },
    { label: 'Comments', path: '/admin/comments', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-stone-600 hover:text-stone-900 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="font-sans font-black tracking-tight text-lg text-stone-900">
                Crazy<span className="text-rose-600">Blog</span> <span className="text-rose-600 text-xs font-bold tracking-widest ml-1 px-1.5 py-0.5 bg-rose-50 border border-rose-200">CMS</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-rose-600 transition-colors font-medium"
            >
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="h-4 w-[1px] bg-stone-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-stone-900 truncate max-w-[160px]">
                  {user?.email || 'admin@crazyblog.com'}
                </span>
                <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  {isLiveFirebase ? 'Firebase Auth' : 'Admin Session'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 border border-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto flex">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 top-[53px] z-20 w-64 bg-white border-r border-stone-200 p-5 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase block mb-3 px-3">
                EDITORIAL MANAGEMENT
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin/dashboard'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'bg-rose-600 text-white'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-stone-200">
              <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase block mb-3 px-3">
                DATA STORAGE
              </span>
              <div className="bg-stone-50 border border-stone-200 p-3.5 text-xs text-stone-600 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-800">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  <span>JSON File Engine</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Posts and comments are physically saved as .json files in <code className="bg-stone-200 px-1 py-0.5 text-[10px]">server/data/posts</code>.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

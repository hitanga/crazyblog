import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import siteConfig from '../../config/siteConfig.js';

export default function AdminLogin() {
  const location = useLocation();
  const [mode, setMode] = useState(location.pathname === '/admin/signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, isLiveFirebase } = useAuth();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password.trim());
        setSuccess('Account created successfully! Redirecting to CMS dashboard...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 800);
      } else {
        await login(email.trim(), password.trim());
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@gutenverse.com');
    setPassword('admin123');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo align="center" />
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-stone-500">
          <ShieldCheck className="w-4 h-4 text-rose-600" />
          <span>CMS Administrative Portal</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-stone-200 shadow-sm">
          {/* Tabs: Sign In vs Sign Up */}
          <div className="flex border-b border-stone-200 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'border-rose-600 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider text-center transition-colors border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'border-rose-600 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up New Admin</span>
            </button>
          </div>

          {/* Status banner */}
          <div className="mb-6 p-3.5 bg-stone-50 border border-stone-200 text-xs text-stone-600">
            <span className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Authentication Engine:
            </span>
            <span>
              {isLiveFirebase ? (
                <span className="text-emerald-700 font-medium">
                  Connected to Live Firebase Authentication
                </span>
              ) : (
                <span>
                  Firebase Auth active. {mode === 'signup' ? 'Create your new administrator login.' : 'Demo credentials pre-configured below.'}
                </span>
              )}
            </span>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Admin Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-600 rounded-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-stone-900 hover:bg-rose-600 disabled:bg-stone-400 text-white text-xs font-bold tracking-[0.18em] uppercase transition-colors flex items-center justify-center gap-2 rounded-none cursor-pointer"
            >
              {loading ? (
                'Processing...'
              ) : mode === 'signup' ? (
                <>
                  <span>Create Admin Account</span>
                  <UserPlus className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill & Switch Link */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="text-stone-500 hover:text-rose-600 underline font-medium cursor-pointer"
                >
                  Autofill Demo Credentials
                </button>
              ) : (
                <span className="text-stone-400">All fields required</span>
              )}

              <Link to="/" className="text-stone-500 hover:text-stone-900">
                Back to Website →
              </Link>
            </div>

            <div className="text-center pt-2">
              {mode === 'login' ? (
                <p className="text-stone-500 text-[11px]">
                  Need a new administrator login?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign up new admin
                  </button>
                </p>
              ) : (
                <p className="text-stone-500 text-[11px]">
                  Already have an administrator account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

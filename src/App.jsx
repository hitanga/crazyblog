import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import BlogList from './pages/BlogList.jsx';
import BlogDetail from './pages/BlogDetail.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin / CMS
import ProtectedRoute from './components/admin/ProtectedRoute.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminPosts from './pages/admin/AdminPosts.jsx';
import AdminPostForm from './pages/admin/AdminPostForm.jsx';
import AdminComments from './pages/admin/AdminComments.jsx';

// Public Layout Wrapper with Header and Footer
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900 font-sans selection:bg-rose-600 selection:text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/knowledge-base" element={<CategoryPage categoryOverride="Knowledge-Base" />} />
            <Route path="/knowledgebase" element={<CategoryPage categoryOverride="Knowledge-Base" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminLogin />} />

          {/* Protected CMS Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="posts/create" element={<AdminPostForm />} />
            <Route path="posts/edit/:id" element={<AdminPostForm />} />
            <Route path="comments" element={<AdminComments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

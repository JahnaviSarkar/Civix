import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'crew' | 'admin'>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithEmail, loginDemo, isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated && role) {
      if (role === UserRole.ADMIN) navigate('/admin', { replace: true });
      else if (role === UserRole.CREW) navigate('/crew', { replace: true });
      else navigate('/citizen', { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (searchParams.get('error') === 'session_expired') {
      setErrorMessage('Your session has expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error("Authentication Error:", err);
      let msg = "Failed to sign in. Please check your credentials.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = "Invalid email address or password.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Please try again later.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'citizen' | 'crew' | 'admin') => {
    setSelectedRole(demoRole);
    setErrorMessage(null);
    setIsSubmitting(true);
    if (searchParams.has('error')) {
      navigate('/login', { replace: true });
    }
    try {
      await loginDemo(demoRole);
    } catch (err: any) {
      setErrorMessage("Demo login failed: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 flex items-center justify-center p-4">
        <div className="text-gray-900 text-sm font-bold animate-pulse">Initializing Civix Authentication...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/clovers-bg.jpg')" }}
    >
      {/* Subtle overlay to ensure the login card stands out against the detailed background */}
      <div className="absolute inset-0 bg-sky-900/20 backdrop-blur-[2px]"></div>

      {/* Top-left branding */}
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-gray-900/20">
          CX
        </div>
        <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">CIVIX</span>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 max-w-[440px] w-full bg-white/95 backdrop-blur-md rounded-[24px] shadow-2xl shadow-blue-900/20 p-8 sm:p-10 border border-white/40">
        
        {/* Header icon */}
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>

        {/* Heading + subtext */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Sign in to CIVIX</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Welcome back! Please enter your details.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex p-1 bg-gray-100/80 rounded-xl mb-6">
          {(['citizen', 'admin', 'crew'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 text-red-800 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'citizen'
                    ? 'citizen@smartwaste.local'
                    : selectedRole === 'crew'
                    ? 'crew@smartwaste.local'
                    : 'admin@smartwaste.local'
                }
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 font-medium">
                Remember for 30 days
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-semibold text-gray-900 hover:text-black">
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>



        {/* Demo Quick Logins Restyled */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={() => handleDemoLogin('admin')} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-colors cursor-pointer">
              Admin
            </button>
            <button type="button" onClick={() => handleDemoLogin('crew')} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-colors cursor-pointer">
              Crew
            </button>
            <button type="button" onClick={() => handleDemoLogin('citizen')} disabled={isSubmitting} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-colors cursor-pointer">
              Citizen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


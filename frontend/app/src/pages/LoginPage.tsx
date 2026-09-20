import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
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
      <div className="min-h-screen bg-[#D9F0FF] flex items-center justify-center p-4">
        <div className="text-[#111827] text-sm font-black animate-pulse">Initializing Civix Authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D9F0FF] flex flex-col items-center justify-center p-4">
      {/* Centered Minimalist Authentication Card */}
      <div className="max-w-md w-full bg-[#FFFDF7] rounded-3xl shadow-xl overflow-hidden p-8 border border-[#89B9E6] transition-all">
        
        {/* Logo & Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#C7DFA3] rounded-2xl flex items-center justify-center text-[#111827] font-black text-2xl mx-auto mb-3 shadow-xs border border-[#b5d68d]">
            CX
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Welcome back</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Choose your role and sign in to continue.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-[#D9F0FF] p-1.5 rounded-2xl mb-6 border border-[#89B9E6]">
          {(['citizen', 'admin', 'crew'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`py-2 text-xs font-black capitalize rounded-xl transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-[#C7DFA3] text-[#111827] shadow-xs'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-1">
              Email Address
            </label>
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
              className="w-full px-4 py-3 border border-[#89B9E6] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#89B9E6] bg-white text-[#111827]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[#89B9E6] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#89B9E6] bg-white text-[#111827] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-[#111827] cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Role Button Label */}
          <Button
            type="submit"
            isLoading={isSubmitting}
            variant="matcha"
            className="w-full py-3.5 mt-2 text-base shadow-sm capitalize"
          >
            {isSubmitting ? 'Signing in...' : `Sign in as ${selectedRole}`}
          </Button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-8 pt-6 border-t border-[#D9F0FF] text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Quick Demo Access (One-Click)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="button" size="sm" variant="secondary" onClick={() => handleDemoLogin('admin')} disabled={isSubmitting}>
              Demo as Admin
            </Button>
            <Button type="button" size="sm" variant="airy" onClick={() => handleDemoLogin('crew')} disabled={isSubmitting}>
              Demo as Crew
            </Button>
            <Button type="button" size="sm" variant="matcha" onClick={() => handleDemoLogin('citizen')} disabled={isSubmitting}>
              Demo as Citizen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

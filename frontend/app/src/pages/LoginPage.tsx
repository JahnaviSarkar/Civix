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
      className="min-h-screen w-full flex relative font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/city_park_skyline.jpg')" }}
    >
      {/* Subtle dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Left side content */}
      <div className="relative z-10 hidden lg:flex flex-col w-1/2 justify-center px-12 lg:px-20 xl:px-32">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-900 font-black text-2xl shadow-lg">
            CX
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md">CIVIX</span>
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight drop-shadow-sm">
          REPORT.<br/>RESOLVE.<br/>RENEW.
        </h1>
        <h2 className="text-xl lg:text-2xl font-semibold text-white/90 mb-4 drop-shadow-sm">
          Where Citizens, Crews, and Admins Work Together.
        </h2>
        <p className="text-lg text-white/80 max-w-md drop-shadow-sm">
          Report waste issues, track resolution progress, and help keep your city clean — one report at a time.
        </p>
      </div>

      {/* Right side - glass card */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-[440px] w-full bg-white/20 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-black/20 p-8 sm:p-10 border border-white/30">
          
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-900 font-black text-xl shadow-lg">
              CX
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">CIVIX</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-sm">Sign in to CIVIX</h2>
            <p className="text-sm text-white/80 mt-2 font-medium drop-shadow-sm">Welcome back! Please enter your details.</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex p-1 bg-black/20 rounded-xl mb-6 backdrop-blur-sm border border-white/10">
            {(['citizen', 'admin', 'crew'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold capitalize rounded-lg transition-all cursor-pointer ${
                  selectedRole === r
                    ? 'bg-white/95 text-gray-900 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-500/80 backdrop-blur-md text-white text-sm font-medium rounded-xl border border-red-400/50 flex items-center gap-3">
              <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 drop-shadow-sm">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
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
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-sm font-medium text-white placeholder-white/60 focus:outline-none focus:bg-white/20 focus:border-white focus:ring-2 focus:ring-white/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5 drop-shadow-sm">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
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
                  className="w-full pl-11 pr-11 py-3 bg-white/10 border border-white/30 rounded-xl text-sm font-medium text-white placeholder-white/60 focus:outline-none focus:bg-white/20 focus:border-white focus:ring-2 focus:ring-white/50 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-colors"
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
                <input id="remember-me" type="checkbox" className="h-4 w-4 bg-white/10 border-white/30 rounded text-green-600 focus:ring-green-500 focus:ring-offset-0 focus:ring-offset-transparent" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-white/90 font-medium drop-shadow-sm">
                  Remember for 30 days
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-white hover:text-white/80 drop-shadow-sm">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#256637] hover:bg-[#1E542C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#256637] focus:ring-offset-transparent transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Quick Logins Restyled */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div className="flex flex-wrap gap-2 justify-center">
              <button type="button" onClick={() => handleDemoLogin('admin')} disabled={isSubmitting} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm">
                Admin
              </button>
              <button type="button" onClick={() => handleDemoLogin('crew')} disabled={isSubmitting} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm">
                Crew
              </button>
              <button type="button" onClick={() => handleDemoLogin('citizen')} disabled={isSubmitting} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm">
                Citizen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


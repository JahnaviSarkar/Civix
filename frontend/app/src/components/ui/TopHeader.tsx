import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';
import { UserRole } from '../../types';

interface TopHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchChange?: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSearchChange }) => {
  const queryClient = useQueryClient();
  const { user, role, logout, loginDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = async (targetRole: 'citizen' | 'crew' | 'admin') => {
    try {
      setDropdownOpen(false);
      await loginDemo(targetRole);
      queryClient.resetQueries();
      if (targetRole === 'admin') navigate('/admin');
      else if (targetRole === 'crew') navigate('/crew');
      else navigate('/citizen');
    } catch (err) {
      alert("Role switch failed: " + err);
    }
  };

  const getNavLinks = () => {
    if (role === UserRole.ADMIN) {
      return [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Citizen Portal', path: '/citizen' },
        { label: 'Crew Tasks', path: '/crew' },
      ];
    } else if (role === UserRole.CREW) {
      return [
        { label: 'Dashboard', path: '/crew' },
        { label: 'Citizen View', path: '/citizen' },
      ];
    }
    return [
      { label: 'Dashboard', path: '/citizen' },
      { label: 'Portals', path: '/login' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-[#D9F0FF] sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Civix Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#C7DFA3] border border-[#b5d68d] flex items-center justify-center font-black text-xl text-[#111827] shadow-xs group-hover:scale-105 transition-transform">
              CX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-[#111827] tracking-tight">CIVIX</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#D9F0FF] text-[#111827] rounded-md border border-[#89B9E6]">
                  {role || 'Citizen'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold hidden sm:block">Smart Waste Management</p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links + Quick Demo One-Click Role Switcher */}
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-1.5 bg-[#FFFDF7] p-1.5 rounded-2xl border border-[#D9F0FF]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#89B9E6] text-[#111827] shadow-xs'
                      : 'text-slate-600 hover:text-[#111827] hover:bg-[#D9F0FF]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-1.5 bg-[#FFFDF7] p-1.5 rounded-2xl border border-[#89B9E6]">
            <span className="text-[10px] font-black uppercase text-slate-500 px-1.5">Quick Access:</span>
            <button
              type="button"
              onClick={() => handleSwitchRole('citizen')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === 'citizen' ? 'bg-[#C7DFA3] text-[#111827] shadow-xs font-black' : 'text-slate-600 hover:bg-[#D9F0FF]'
              }`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole('crew')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === 'crew' ? 'bg-[#89B9E6] text-[#111827] shadow-xs font-black' : 'text-slate-600 hover:bg-[#D9F0FF]'
              }`}
            >
              Crew
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole('admin')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === 'admin' ? 'bg-[#31465A] text-white shadow-xs font-black' : 'text-slate-600 hover:bg-[#D9F0FF]'
              }`}
            >
              Admin
            </button>
          </div>
        </div>


        {/* Right: Notifications + User Avatar + Profile Dropdown */}
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative hidden xl:block">
              <input
                type="text"
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search complaints..."
                className="pl-8 pr-3 py-1.5 bg-[#FFFDF7] border border-[#89B9E6] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#89B9E6] w-44"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-[#D9F0FF] bg-[#FFFDF7] hover:bg-[#D9F0FF] transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#89B9E6] text-[#111827] flex items-center justify-center font-black text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#111827] leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{user.email}</p>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#89B9E6] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-[#D9F0FF]">
                    <p className="text-xs font-bold text-[#111827]">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#C7DFA3] text-[#111827] text-[10px] font-black uppercase rounded-md">
                      Role: {role || 'Citizen'}
                    </span>
                  </div>

                  {/* Demo One-Click Role Switcher Options inside Profile Menu */}
                  <div className="py-2 border-b border-[#D9F0FF] px-2 space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-1">Switch Portal (1-Click):</p>
                    <button
                      onClick={() => handleSwitchRole('citizen')}
                      className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between cursor-pointer ${
                        role === 'citizen' ? 'bg-[#C7DFA3] text-[#111827]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>Citizen Portal</span>
                      {role === 'citizen' && <span className="text-[10px] font-black">Active</span>}
                    </button>
                    <button
                      onClick={() => handleSwitchRole('crew')}
                      className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between cursor-pointer ${
                        role === 'crew' ? 'bg-[#89B9E6] text-[#111827]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>Crew Dashboard</span>
                      {role === 'crew' && <span className="text-[10px] font-black">Active</span>}
                    </button>
                    <button
                      onClick={() => handleSwitchRole('admin')}
                      className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-between cursor-pointer ${
                        role === 'admin' ? 'bg-[#31465A] text-white' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>Admin Dashboard</span>
                      {role === 'admin' && <span className="text-[10px] font-black">Active</span>}
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button variant="matcha" size="sm" onClick={() => window.location.href = '/login'}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};


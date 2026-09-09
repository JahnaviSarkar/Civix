import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';
import { UserRole } from '../../types';

interface TopHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchChange?: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSearchChange }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
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

        {/* Center: Top Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#FFFDF7] p-1.5 rounded-2xl border border-[#D9F0FF]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
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

        {/* Right: Notifications + User Avatar + Profile Dropdown */}
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative hidden lg:block">
              <input
                type="text"
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search complaints..."
                className="pl-8 pr-3 py-1.5 bg-[#FFFDF7] border border-[#89B9E6] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#89B9E6] w-48"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}

          <button className="p-2.5 rounded-xl bg-[#FFFDF7] border border-[#D9F0FF] text-slate-600 hover:text-[#111827] hover:bg-[#D9F0FF] transition-all relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white"></span>
          </button>

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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#89B9E6] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-[#D9F0FF]">
                    <p className="text-xs font-bold text-[#111827]">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#C7DFA3] text-[#111827] text-[10px] font-black uppercase rounded-md">
                      Role: {role || 'Citizen'}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>🚪</span> Sign Out
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

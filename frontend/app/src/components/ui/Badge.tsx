import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'verified' | 'rejected' | 'cancelled' | 'high' | 'medium' | 'low' | 'matcha' | 'airy';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'matcha', className }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs';

  const variants = {
    pending: 'bg-amber-100 text-amber-900 border border-amber-300',
    assigned: 'bg-[#D9F0FF] text-[#1e4670] border border-[#89B9E6]',
    in_progress: 'bg-[#89B9E6] text-[#111827] border border-[#72aadb]',
    resolved: 'bg-[#C7DFA3] text-[#244203] border border-[#b5d68d]',
    verified: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    rejected: 'bg-rose-100 text-rose-900 border border-rose-300',
    cancelled: 'bg-slate-200 text-slate-700 border border-slate-300',
    high: 'bg-rose-500 text-white border border-rose-600',
    medium: 'bg-orange-500 text-white border border-orange-600',
    low: 'bg-[#C7DFA3] text-[#111827] border border-[#b5d68d]',
    matcha: 'bg-[#C7DFA3] text-[#111827] border border-[#b5d68d]',
    airy: 'bg-[#89B9E6] text-[#111827] border border-[#72aadb]'
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], className))}>
      {children}
    </span>
  );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';

interface SidebarProps {
  currentRole?: UserRole | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole }) => {
  const location = useLocation();

  const navItems: { label: string; path: string; roles: UserRole[] }[] = [
    { label: 'Citizen Portal', path: '/citizen', roles: [UserRole.CITIZEN, UserRole.ADMIN] },
    { label: 'Crew Tasks', path: '/crew', roles: [UserRole.CREW, UserRole.ADMIN] },
    { label: 'Admin Analytics', path: '/admin', roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className="w-64 bg-[#233342] text-[#FFFDF7] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between border-r border-[#31465A]">
      <div>
        <div className="px-3 py-2 text-xs font-bold text-[#89B9E6] uppercase tracking-wider">
          Portals & Workspaces
        </div>
        <nav className="mt-2 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isAllowed = !currentRole || item.roles.some((r) => r === currentRole);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3.5 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#C7DFA3] text-[#233342] shadow-sm'
                    : isAllowed
                    ? 'hover:bg-[#31465A] text-[#FFFDF7] hover:text-[#C7DFA3]'
                    : 'opacity-40 pointer-events-none'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 bg-[#31465A] rounded-xl border border-[#31465A] text-xs text-[#89B9E6]">
        <p className="font-bold text-[#C7DFA3]">Blue Matcha Theme</p>
        <p className="mt-0.5 text-white">Civix Platform v2.0</p>
      </div>
    </aside>
  );
};

import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'matcha' | 'airy' | 'amber' | 'emerald' | 'blue' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'matcha'
}) => {
  const iconColors = {
    matcha: 'bg-[#C7DFA3] text-[#111827] border border-[#b5d68d]',
    airy: 'bg-[#89B9E6] text-[#111827] border border-[#72aadb]',
    emerald: 'bg-[#C7DFA3] text-[#111827] border border-[#b5d68d]',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300',
    blue: 'bg-[#D9F0FF] text-[#1e4670] border border-[#89B9E6]',
    rose: 'bg-rose-100 text-rose-900 border border-rose-300'
  };

  return (
    <Card className="flex items-center justify-between border-[#D9F0FF] hover:border-[#89B9E6] bg-white p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-[#111827] tracking-tight">{value}</h3>
        {trend && <p className="text-xs text-slate-500 font-bold mt-1">{trend}</p>}
      </div>
      {icon && (
        <div className={`p-3.5 rounded-2xl font-bold shadow-2xs ${iconColors[color]}`}>
          {icon}
        </div>
      )}
    </Card>
  );
};

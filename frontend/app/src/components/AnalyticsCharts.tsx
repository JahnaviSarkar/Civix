import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { Complaint } from '../types';

interface AnalyticsChartsProps {
  complaints: Complaint[];
}

const COLORS = ['#89B9E6', '#C7DFA3', '#31465A', '#7aa33b', '#204a75'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ complaints }) => {
  const categoryCounts = complaints.reduce<Record<string, number>>((acc, c) => {
    const cat = c.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count
  }));

  const severityRanges = [
    { name: 'Low (1-3)', count: complaints.filter((c) => c.severity <= 3).length },
    { name: 'Medium (4-6)', count: complaints.filter((c) => c.severity > 3 && c.severity <= 6).length },
    { name: 'High (7-8)', count: complaints.filter((c) => c.severity > 6 && c.severity <= 8).length },
    { name: 'Critical (9-10)', count: complaints.filter((c) => c.severity > 8).length }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-[#D9F0FF] shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#31465A] mb-4">
          Complaints by Category
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData.length ? categoryData : [{ name: 'None', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9F0FF" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#31465A' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#31465A' }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#89B9E6', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#89B9E6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#D9F0FF] shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#31465A] mb-4">
          Severity Breakdown
        </h3>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityRanges}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label
              >
                {severityRanges.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#89B9E6', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

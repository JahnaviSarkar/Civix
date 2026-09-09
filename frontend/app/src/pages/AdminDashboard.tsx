import React, { useState } from 'react';
import { TopHeader } from '../components/ui/TopHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { LoadingState } from '../components/ui/LoadingState';
import { ComplaintMap } from '../components/ComplaintMap';
import { VerificationModal } from '../components/VerificationModal';
import { useComplaints, useCrewMembers, useAssignComplaint } from '../hooks/useComplaints';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { type Complaint } from '../types';
import { apiRequest } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
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

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { complaints, isLoading: complaintsLoading } = useComplaints();
  const { data: crews } = useCrewMembers();
  const assignMutation = useAssignComplaint();

  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [verifyComplaintId, setVerifyComplaintId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'VERIFICATION' | 'RESOLVED' | 'VERIFIED'>('ALL');

  const handleAssign = async () => {
    if (!selectedComplaintId || !selectedCrewId) return;

    try {
      await assignMutation.mutateAsync({
        complaintId: selectedComplaintId,
        crewId: selectedCrewId,
        notes: "Dispatched via Municipal Admin Console"
      });
      setSelectedComplaintId(null);
      setSelectedCrewId(null);
      alert("Crew dispatched successfully!");
    } catch (err) {
      alert("Failed to assign crew: " + err);
    }
  };

  const handleVerify = async (accepted: boolean, reason?: string) => {
    if (!verifyComplaintId) return;
    const finalReason = reason !== undefined ? reason : rejectionReason;
    if (!accepted && !finalReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setIsVerifying(true);
    try {
      await apiRequest(`/complaints/${verifyComplaintId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          accepted,
          rejection_reason: accepted ? undefined : finalReason
        })
      });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setVerifyComplaintId(null);
      setRejectionReason('');
      alert(accepted ? "Resolution approved and verified!" : "Resolution rejected and sent back to crew with instructions.");
    } catch (err) {
      alert("Verification failed: " + err);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusTab === 'ALL') return true;
    if (statusTab === 'PENDING') return String(c.status) === 'PENDING';
    if (statusTab === 'ASSIGNED') return String(c.status) === 'ASSIGNED' || String(c.status) === 'IN_PROGRESS';
    if (statusTab === 'VERIFICATION') return String(c.status) === 'RESOLVED' || String(c.status) === 'VERIFIED' || String(c.status) === 'REJECTED';
    if (statusTab === 'RESOLVED') return String(c.status) === 'RESOLVED';
    if (statusTab === 'VERIFIED') return String(c.status) === 'VERIFIED';
    return true;
  });

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
    { name: 'Low (0-3.9)', count: complaints.filter((c) => c.severity < 4.0).length, color: '#22C55E' },
    { name: 'Medium (4-6.9)', count: complaints.filter((c) => c.severity >= 4.0 && c.severity < 7.0).length, color: '#F97316' },
    { name: 'High / Critical (7-10)', count: complaints.filter((c) => c.severity >= 7.0).length, color: '#EF4444' }
  ];

  const columns = [
    { header: 'ID', accessor: (c: Complaint) => <span className="font-mono font-bold text-[#111827]">#CIV-{c.id}</span> },
    { header: 'Title', accessor: (c: Complaint) => <span className="font-bold text-[#111827]">{c.title}</span> },
    { header: 'Category', accessor: (c: Complaint) => c.category },
    { 
      header: 'Severity', 
      accessor: (c: Complaint) => (
        <Badge variant={c.severity >= 7.0 ? 'high' : c.severity >= 4.0 ? 'medium' : 'low'}>
          {c.severity >= 7.0 ? 'HIGH' : c.severity >= 4.0 ? 'MEDIUM' : 'LOW'} ({c.severity})
        </Badge>
      ) 
    },
    { 
      header: 'Status', 
      accessor: (c: Complaint) => {
        const s = String(c.status).toUpperCase();
        if (s === 'RESOLVED') return <Badge variant="medium">Awaiting Verification</Badge>;
        if (s === 'VERIFIED') return <Badge variant="low">Verified ✓</Badge>;
        if (s === 'REJECTED') return <Badge variant="high">Rejected ✕</Badge>;
        return <Badge variant={c.status.toLowerCase() as any}>{c.status}</Badge>;
      } 
    },
    {
      header: 'Actions',
      accessor: (c: Complaint) => (
        <div className="flex gap-2">
          {String(c.status) === 'PENDING' && (
            <Button size="sm" variant="matcha" onClick={() => setSelectedComplaintId(c.id)}>
              Assign Crew
            </Button>
          )}
          {String(c.status) === 'RESOLVED' && (
            <Button size="sm" variant="matcha" onClick={() => setVerifyComplaintId(c.id)}>
              🔍 Verify Resolution
            </Button>
          )}
          {(String(c.status) === 'VERIFIED' || String(c.status) === 'REJECTED') && (
            <Button size="sm" variant="airy" onClick={() => setVerifyComplaintId(c.id)}>
              👁️ View Both Proofs
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col font-sans">
      {/* Top Header Navigation (No Sidebar) */}
      <TopHeader onSearchChange={setSearchQuery} />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Page Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-[#111827]">Welcome back, Admin! 👋</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Here's what's happening across your city today.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3.5 py-2 bg-[#D9F0FF] border border-[#89B9E6] text-[#111827] rounded-xl">
              📅 Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <Button variant="matcha" size="sm" onClick={() => window.location.reload()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Crew Assignment Modal */}
        {selectedComplaintId && (
          <Card className="border-2 border-[#89B9E6] bg-[#D9F0FF]/50 shadow-md animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#111827] text-base">Assign Sanitation Crew Unit to #CIV-{selectedComplaintId}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedComplaintId(null)}>
                ✕ Close
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedCrewId || ''}
                onChange={(e) => setSelectedCrewId(Number(e.target.value))}
                className="flex-1 px-4 py-3 border border-[#89B9E6] rounded-xl text-sm bg-white text-[#111827] font-bold"
              >
                <option value="">Select Sanitation Crew Unit...</option>
                {(crews || [
                  { id: 2, name: "Crew Alpha Team (North Zone)", email: "crew@smartwaste.local" },
                  { id: 4, name: "Sanitation Unit 4 (Central Zone)", email: "unit4@smartwaste.local" }
                ]).map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name} ({cr.email})
                  </option>
                ))}
              </select>
              <Button onClick={handleAssign} variant="matcha" isLoading={assignMutation.isPending} disabled={!selectedCrewId}>
                Confirm Task Assignment
              </Button>
            </div>
          </Card>
        )}

        {/* Resolution Verification Pop-up Modal */}
        <VerificationModal
          complaint={complaints.find(c => c.id === verifyComplaintId) || null}
          isOpen={verifyComplaintId !== null}
          onClose={() => {
            setVerifyComplaintId(null);
            setRejectionReason('');
          }}
          onVerify={handleVerify}
          isVerifying={isVerifying}
        />

        {/* Admin KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Complaints"
            value={statsLoading ? '...' : (stats?.total_complaints ?? complaints.length)}
            color="matcha"
            trend="+12% from last month"
          />
          <StatCard
            title="Pending Review"
            value={statsLoading ? '...' : (stats?.pending_complaints ?? complaints.filter(c=>String(c.status)==='PENDING').length)}
            color="amber"
            trend="-8% from last week"
          />
          <StatCard
            title="In Progress"
            value={statsLoading ? '...' : (stats?.in_progress_complaints ?? complaints.filter(c=>String(c.status)==='IN_PROGRESS'||String(c.status)==='ASSIGNED').length)}
            color="airy"
            trend="+18% from last week"
          />
          <StatCard
            title="Resolution Rate"
            value={statsLoading ? '...' : `${stats?.resolution_rate_percentage ?? 78}%`}
            color="matcha"
            trend="City Target 85%"
          />
        </div>

        {/* Admin Analytics Section: Category Bar Chart & Semantic Severity Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Category Chart */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#111827]">Complaints by Category</h3>
                <p className="text-xs text-slate-500 font-semibold">Live database classification</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.length ? categoryData : [{ name: 'Garbage Collection', count: 4 }, { name: 'Pothole', count: 2 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D9F0FF" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#111827', fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#111827' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#89B9E6', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#89B9E6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Semantic Severity Donut Chart (Red / Orange / Green) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-[#111827]">Severity Breakdown</h3>
                <p className="text-xs text-slate-500 font-semibold">High (Red) / Medium (Orange) / Low (Green)</p>
              </div>
            </div>

            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityRanges}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {severityRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFDF7', borderColor: '#89B9E6', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#D9F0FF]">
              {severityRanges.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                  <span className="font-bold text-[#111827]">{item.name.split(' ')[0]}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: SIDE-BY-SIDE Sanitation Crew Status & Citywide Complaint Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (6 cols): Sanitation Crew Status */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-1">Sanitation Crew Status</h3>
              <p className="text-xs text-slate-500 font-semibold mb-4">Active municipal response units</p>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-1">
              {(crews || [
                { id: 2, name: "North Zone Sanitation Unit", email: "crew@smartwaste.local" },
                { id: 4, name: "Central Zone Sanitation Unit", email: "unit4@smartwaste.local" },
                { id: 5, name: "South Zone Sanitation Unit", email: "south@smartwaste.local" }
              ]).map((cr, idx) => (
                <div key={cr.id || idx} className="p-4 bg-[#FFFDF7] rounded-2xl border border-[#D9F0FF] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#111827]">{cr.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{cr.email}</p>
                    <p className="text-[10px] text-[#89B9E6] font-black mt-1">6 Unit Members</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#C7DFA3] text-[#111827] text-[10px] font-black rounded-lg uppercase border border-[#b5d68d]">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (6 cols): Citywide Complaint Map */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-3">Citywide Complaint Map</h3>
            <div className="flex-1 min-h-[320px]">
              <ComplaintMap complaints={complaints} height="320px" />
            </div>
          </div>
        </div>

        {/* Row 4 (Full-Width Bottom): Recent Complaints Tab & Table */}
        <div className="bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#D9F0FF]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827]">Recent Complaints</h3>
              <p className="text-xs text-slate-500 font-semibold">Select any record to dispatch crew teams or verify resolutions</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Interactive Status Filter Tabs */}
              <div className="flex items-center bg-[#FFFDF7] p-1 border border-[#D9F0FF] rounded-xl text-xs font-bold gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusTab === 'ALL' ? 'bg-[#89B9E6] text-[#111827] shadow-xs' : 'text-slate-600 hover:text-[#111827]'}`}
                >
                  All ({complaints.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusTab === 'PENDING' ? 'bg-[#F97316] text-white shadow-xs' : 'text-slate-600 hover:text-[#111827]'}`}
                >
                  Pending ({complaints.filter(c => String(c.status) === 'PENDING').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('ASSIGNED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusTab === 'ASSIGNED' ? 'bg-[#89B9E6] text-[#111827] shadow-xs' : 'text-slate-600 hover:text-[#111827]'}`}
                >
                  Assigned ({complaints.filter(c => String(c.status) === 'ASSIGNED' || String(c.status) === 'IN_PROGRESS').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('VERIFICATION')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${statusTab === 'VERIFICATION' ? 'bg-[#C7DFA3] text-[#111827] border border-[#b5d68d] shadow-xs font-black' : 'text-slate-700 hover:text-[#111827]'}`}
                >
                  <span>🔍 Verification</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-white rounded-md font-mono border border-slate-200">
                    {complaints.filter(c => String(c.status) === 'RESOLVED' || String(c.status) === 'VERIFIED' || String(c.status) === 'REJECTED').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTab('RESOLVED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusTab === 'RESOLVED' ? 'bg-[#22C55E] text-white shadow-xs' : 'text-slate-600 hover:text-[#111827]'}`}
                >
                  Resolved ({complaints.filter(c => String(c.status) === 'RESOLVED').length})
                </button>
              </div>

              {/* Search Field */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, address, category..."
                  className="pl-8 pr-3 py-1.5 bg-[#FFFDF7] border border-[#89B9E6] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#89B9E6] w-56"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {complaintsLoading ? (
            <LoadingState message="Loading database complaints..." />
          ) : (
            <Table
              columns={columns}
              data={filteredComplaints}
              keyExtractor={(c) => c.id}
              emptyMessage="No complaints match the selected tab or search query."
            />
          )}
        </div>

      </main>
    </div>
  );
};

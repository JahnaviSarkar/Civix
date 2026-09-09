import React, { useState } from 'react';
import { TopHeader } from '../components/ui/TopHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ComplaintMap } from '../components/ComplaintMap';
import { useComplaints, useResolveComplaint } from '../hooks/useComplaints';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const CrewDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { complaints, isLoading } = useComplaints();
  const resolveMutation = useResolveComplaint();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImage, setResolutionImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setResolutionImage(compressed);
            setImagePreview(compressed);
          }
        };
        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartTask = async (complaintId: number) => {
    setIsStarting(true);
    try {
      await apiRequest(`/crew/tasks/${complaintId}/start`, { method: 'PATCH' });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      alert("Task marked as IN_PROGRESS!");
    } catch (err) {
      alert("Failed to start task: " + err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    if (!resolutionImage) {
      alert("Please select an after work photo proof before completing the task.");
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        complaintId: selectedId,
        notes: resolutionNotes || "Cleaned up bin overflow and disinfected area.",
        afterImageUrl: resolutionImage
      });
      setSelectedId(null);
      setResolutionNotes('');
      setResolutionImage('');
      setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      alert("After work photo & task submitted for Admin Verification!");
    } catch (err) {
      alert("Failed to submit resolution: " + err);
    }
  };

  const assignedTasks = complaints.filter(
    (c) => String(c.status) === 'IN_PROGRESS' || String(c.status) === 'ASSIGNED' || String(c.status) === 'PENDING' || String(c.status) === 'REJECTED'
  );
  const completedCount = complaints.filter((c) => String(c.status) === 'RESOLVED' || String(c.status) === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col font-sans">
      {/* Top Header Navigation (No Sidebar) */}
      <TopHeader />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#111827]">Welcome back, {user?.name || 'Sanitation Team'}! 👋</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Here are your assigned sanitation tasks for today.</p>
          </div>
          <span className="text-xs font-bold px-3.5 py-2 bg-[#C7DFA3] text-[#111827] rounded-xl border border-[#b5d68d]">
            Unit Status: ACTIVE
          </span>
        </div>

        {/* Crew KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Assigned Tasks"
            value={assignedTasks.length}
            color="airy"
            trend="Active assignments"
          />
          <StatCard
            title="In Progress"
            value={complaints.filter(c=>String(c.status)==='IN_PROGRESS').length}
            color="blue"
            trend="Being worked on"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            color="matcha"
            trend="Submitted for review"
          />
          <StatCard
            title="Overdue"
            value={0}
            color="rose"
            trend="SLA Compliant"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Assigned Tasks List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-4">My Assigned Tasks</h3>
              {isLoading ? (
                <LoadingState message="Loading assigned tasks..." />
              ) : assignedTasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center font-semibold">No active tasks currently assigned.</p>
              ) : (
                <div className="space-y-4">
                  {assignedTasks.map((task) => {
                    const isRejected = String(task.status) === 'REJECTED';
                    return (
                      <div
                        key={task.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isRejected
                            ? 'border-2 border-rose-300 bg-rose-50/40 shadow-xs'
                            : selectedId === task.id
                              ? 'border-2 border-[#89B9E6] bg-[#D9F0FF]/40 shadow-xs'
                              : 'border-[#D9F0FF] bg-white hover:border-[#89B9E6]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-[#111827]">#CIV-{task.id}</span>
                              <span className="font-bold text-sm text-[#111827]">{task.title}</span>
                              {isRejected ? (
                                <Badge variant="high">REJECTED - FIXES REQUIRED ⚠️</Badge>
                              ) : (
                                <Badge variant={task.status.toLowerCase() as any}>{task.status}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-semibold mb-1">📍 {task.address}</p>
                            <p className="text-xs text-slate-500">{task.description}</p>

                            {/* Admin Rejection & Required Fixings Banner */}
                            {isRejected && (
                              <div className="mt-3 p-3 bg-white rounded-xl border border-rose-200 text-xs text-rose-900 shadow-xs">
                                <p className="font-black uppercase flex items-center gap-1 text-rose-700">
                                  <span>⚠️ Admin Rejection & Required Fixings:</span>
                                </p>
                                <p className="font-semibold text-rose-900 mt-1 italic bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                                  "{task.resolution?.rejection_reason || 'Resolution rejected by admin. Please review work and resubmit photos.'}"
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 items-end shrink-0">
                            {String(task.status) === 'ASSIGNED' && (
                              <Button
                                size="sm"
                                variant="airy"
                                isLoading={isStarting}
                                onClick={() => handleStartTask(task.id)}
                              >
                                Start Task
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={isRejected ? 'danger' : selectedId === task.id ? 'matcha' : 'outline'}
                              onClick={() => setSelectedId(task.id)}
                            >
                              {selectedId === task.id ? 'Resolving' : isRejected ? '🔧 Rework & Fix' : 'Complete Task'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Task Resolution Submission Modal/Panel (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-4">Submit Resolution Evidence</h3>
              {selectedId ? (() => {
                const targetTask = complaints.find(c => c.id === selectedId);
                const isTaskRejected = String(targetTask?.status) === 'REJECTED';

                return (
                  <form onSubmit={handleResolve} className="space-y-4">
                    <div className={`p-3 rounded-xl text-xs font-bold ${isTaskRejected ? 'bg-rose-100 border border-rose-300 text-rose-900' : 'bg-[#D9F0FF] text-[#111827]'}`}>
                      {isTaskRejected ? '⚠️ Re-submitting Reworked Evidence for Task' : 'Submitting Resolution for Task'} #CIV-{selectedId}
                    </div>

                    {isTaskRejected && targetTask?.resolution?.rejection_reason && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900">
                        <span className="font-black uppercase block text-[10px] text-amber-700">Admin Required Fixes:</span>
                        "{targetTask.resolution.rejection_reason}"
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black uppercase text-[#111827] mb-1">
                        Upload {isTaskRejected ? 'New / Fixed' : 'Photo'} Evidence
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full text-xs text-slate-500 border border-[#89B9E6] rounded-xl p-2 bg-white"
                      />
                      {imagePreview && (
                        <div className="mt-2 relative rounded-xl overflow-hidden border border-[#89B9E6] h-32">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-[#111827] mb-1">Rework / Resolution Notes</label>
                      <textarea
                        rows={3}
                        required
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder={isTaskRejected ? "Describe fixings made (e.g., Swept behind bin, removed all remaining debris)..." : "Describe actions taken (e.g. Bin cleared, area disinfected)..."}
                        className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-white text-[#111827]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => { setSelectedId(null); setImagePreview(null); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant={isTaskRejected ? 'danger' : 'matcha'}
                        isLoading={resolveMutation.isPending}
                        className="flex-1"
                      >
                        {isTaskRejected ? 'Re-submit Rework' : 'Submit for Admin Review'}
                      </Button>
                    </div>
                  </form>
                );
              })() : (
                <div className="p-8 text-center text-slate-500 text-xs font-semibold bg-[#D9F0FF]/30 rounded-2xl border border-dashed border-[#89B9E6]">
                  Select an assigned task to submit resolution evidence and photos.
                </div>
              )}
            </Card>

            {/* Crew Map Component */}
            <Card className="p-6 mt-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-3">Assigned Route Map</h3>
              <div className="h-64">
                <ComplaintMap complaints={assignedTasks} height="256px" />
              </div>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
};

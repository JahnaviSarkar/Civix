import React, { useState } from 'react';
import { TopHeader } from '../components/ui/TopHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { ComplaintMap } from '../components/ComplaintMap';
import { useComplaints, useRateComplaint } from '../hooks/useComplaints';
import { useAuth } from '../hooks/useAuth';
import { ComplaintCategory } from '../types';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const { complaints, isLoading, createComplaint, isCreating } = useComplaints();
  const rateMutation = useRateComplaint();
  const [ratingScore, setRatingScore] = useState<Record<number, number>>({});
  const [ratingFeedback, setRatingFeedback] = useState<Record<number, string>>({});
  const [ratedIds, setRatedIds] = useState<number[]>([]);


  const [showReportModal, setShowReportModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(ComplaintCategory.GARBAGE_COLLECTION);
  const [address, setAddress] = useState('');
  const [imageInput, setImageInput] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageInput(base64);
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)} (GPS Location)`);
        },
        () => {
          setAddress("Indiranagar 100ft Road, Sector 3, Bengaluru");
        }
      );
    } else {
      setAddress("Indiranagar 100ft Road, Sector 3, Bengaluru");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createComplaint({
        title,
        description,
        category,
        address: address || "Indiranagar 100ft Road, Sector 3, Bengaluru",
        latitude: 12.97159,
        longitude: 77.59456,
        image_url: imageInput || undefined
      });
      setTitle('');
      setDescription('');
      setAddress('');
      setImageInput('');
      setImagePreview(null);
      setFormSuccess(true);
      setShowReportModal(false);
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err) {
      alert("Failed to submit complaint: " + err);
    }
  };

  const myComplaints = complaints;
  const pendingCount = myComplaints.filter((c) => String(c.status) === 'PENDING').length;
  const inProgressCount = myComplaints.filter((c) => String(c.status) === 'IN_PROGRESS' || String(c.status) === 'ASSIGNED').length;
  const resolvedCount = myComplaints.filter((c) => String(c.status) === 'RESOLVED').length;
  const verifiedCount = myComplaints.filter((c) => String(c.status) === 'VERIFIED').length;

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col font-sans">
      <TopHeader />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        <div className="bg-white p-6 rounded-3xl border border-[#D9F0FF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#111827]">Welcome back, {user?.name || 'Citizen'}!</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Together for a cleaner, healthier city.</p>
          </div>
          <Button variant="matcha" size="lg" onClick={() => setShowReportModal(true)} className="shadow-sm">
            + Report Civic Issue
          </Button>
        </div>

        {formSuccess && (
          <div className="p-4 bg-[#C7DFA3] text-[#111827] text-xs font-bold rounded-2xl border border-[#b5d68d] flex items-center justify-between">
            <span>Complaint submitted successfully! MobileNetV2 AI analysis assigned preliminary severity.</span>
            <button onClick={() => setFormSuccess(false)} className="cursor-pointer font-black text-sm">Close</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="My Complaints" value={myComplaints.length} color="matcha" trend="Total Filed" />
          <StatCard title="Pending" value={pendingCount} color="amber" trend="Awaiting Crew" />
          <StatCard title="In Progress" value={inProgressCount} color="airy" trend="Crew Deployed" />
          <StatCard title="Resolved" value={resolvedCount} color="blue" trend="Review Ready" />
          <StatCard title="Verified" value={verifiedCount} color="emerald" trend="Completed" />
        </div>

        {showReportModal && (
          <Card className="border-2 border-[#89B9E6] bg-[#FFFDF7] shadow-xl p-6 space-y-4 animate-in fade-in max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#D9F0FF] pb-3">
              <h3 className="font-black text-[#111827] text-base">File New Civic Complaint</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowReportModal(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-[#111827] mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Overflowing bin at Indiranagar"
                    className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-white text-[#111827]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-[#111827] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-white text-[#111827]"
                  >
                    {Object.values(ComplaintCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase text-[#111827]">Location Address</label>
                  <button type="button" onClick={handleGetLocation} className="text-[10px] text-[#89B9E6] font-bold underline cursor-pointer">
                    Use My GPS Location
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Indiranagar 100ft Road, Sector 3"
                  className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-white text-[#111827]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-[#111827] mb-1">Upload Photo (AI Waste Detection)</label>
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
                <label className="block text-xs font-black uppercase text-[#111827] mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the condition, smell, or obstruction..."
                  className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-white text-[#111827]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowReportModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="matcha" isLoading={isCreating}>
                  Submit & Run AI Analysis
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-4">My Filed Complaints & Status Timeline</h3>
              {isLoading ? (
                <LoadingState message="Fetching your complaints..." />
              ) : myComplaints.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center font-semibold">You have not reported any civic issues yet.</p>
              ) : (
                <div className="divide-y divide-[#D9F0FF]">
                  {myComplaints.map((item) => (
                    <div key={item.id} className="py-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-[#111827]">#CIV-{item.id}</span>
                            <span className="font-bold text-sm text-[#111827]">{item.title}</span>
                            <Badge variant={item.status.toLowerCase() as any}>{item.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">{item.address}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-[#D9F0FF] text-[#111827] text-xs font-bold rounded-lg border border-[#89B9E6]">
                          Severity: {item.severity}/10
                        </span>
                      </div>

                      <div className="p-3 bg-[#D9F0FF]/30 rounded-2xl border border-[#D9F0FF] flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span className={String(item.status) === 'PENDING' ? 'text-amber-700 font-black' : 'text-slate-400'}>1. Reported</span>
                        <span>→</span>
                        <span className={item.ai_confidence ? 'text-emerald-700 font-black' : 'text-slate-400'}>2. AI Analysis</span>
                        <span>→</span>
                        <span className={String(item.status) === 'ASSIGNED' || String(item.status) === 'IN_PROGRESS' ? 'text-[#89B9E6] font-black' : 'text-slate-400'}>3. Assigned</span>
                        <span>→</span>
                        <span className={String(item.status) === 'RESOLVED' || String(item.status) === 'VERIFIED' ? 'text-emerald-700 font-black' : 'text-slate-400'}>4. Resolved</span>
                      </div>

                      {item.ai_category && (
                        <div className="p-2.5 bg-[#FFFDF7] rounded-xl border border-[#89B9E6] text-xs flex items-center justify-between text-[#111827]">
                          <span className="font-bold">AI Classification: {item.ai_category}</span>
                          <span className="font-semibold text-slate-500">Confidence: {(item.ai_confidence ? item.ai_confidence * 100 : 85).toFixed(1)}%</span>
                        </div>
                      )}

                      {(item.resolution?.resolution_image_url || item.resolution?.after_image_url || item.after_image_url) && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            Sanitation Crew Resolution Proof (After Work Photo)
                          </span>
                          <img
                            src={item.resolution?.resolution_image_url || item.resolution?.after_image_url || item.after_image_url}
                            alt="Resolution Proof"
                            className="w-full h-36 object-cover rounded-lg border border-emerald-300"
                          />
                          {item.resolution?.notes && (
                            <p className="text-emerald-700 italic">"{item.resolution.notes}"</p>
                          )}
                        </div>
                      )}

                      {String(item.status) === 'VERIFIED' && (
                        <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#89B9E6] text-xs space-y-2">
                          <p className="font-bold text-[#111827]">Rate Sanitation Service Quality</p>
                          {ratedIds.includes(item.id) || item.rating ? (
                            <p className="text-emerald-700 font-bold">Feedback submitted. Thank you for making your city cleaner!</p>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={ratingScore[item.id] || 5}
                                onChange={(e) => setRatingScore({ ...ratingScore, [item.id]: Number(e.target.value) })}
                                className="px-2 py-1 bg-white border border-[#89B9E6] rounded-lg font-bold text-[#111827]"
                              >
                                <option value={5}>5 Stars - Excellent</option>
                                <option value={4}>4 Stars - Good</option>
                                <option value={3}>3 Stars - Satisfactory</option>
                                <option value={2}>2 Stars - Needs Improvement</option>
                                <option value={1}>1 Star - Poor</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Optional feedback note..."
                                value={ratingFeedback[item.id] || ''}
                                onChange={(e) => setRatingFeedback({ ...ratingFeedback, [item.id]: e.target.value })}
                                className="px-2 py-1 bg-white border border-[#89B9E6] rounded-lg text-xs flex-1 text-[#111827]"
                              />
                              <Button
                                size="sm"
                                variant="matcha"
                                onClick={async () => {
                                  try {
                                    await rateMutation.mutateAsync({
                                      complaintId: item.id,
                                      score: ratingScore[item.id] || 5,
                                      feedback: ratingFeedback[item.id] || 'Verified resolution satisfactory.'
                                    });
                                    setRatedIds([...ratedIds, item.id]);
                                  } catch (err) {
                                    alert("Rating error: " + err);
                                  }
                                }}
                              >
                                Submit Feedback
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-3">City Complaint Map</h3>
              <div className="h-64">
                <ComplaintMap complaints={myComplaints} height="256px" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#111827] mb-3">Track Your City Impact</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#D9F0FF] flex justify-between">
                  <span className="font-bold text-[#111827]">Reports Submitted</span>
                  <span className="font-black text-[#89B9E6]">{myComplaints.length}</span>
                </div>
                <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#D9F0FF] flex justify-between">
                  <span className="font-bold text-[#111827]">Waste Issues Resolved</span>
                  <span className="font-black text-[#C7DFA3]">{verifiedCount + resolvedCount}</span>
                </div>
                <div className="p-3 bg-[#FFFDF7] rounded-xl border border-[#D9F0FF] flex justify-between">
                  <span className="font-bold text-[#111827]">Community Impact Score</span>
                  <span className="font-black text-emerald-600">{(myComplaints.length * 15 + 50)} pts</span>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </main>
    </div>
  );
};

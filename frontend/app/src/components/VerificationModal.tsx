import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Complaint } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface VerificationModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (accepted: boolean, rejectionReason?: string) => Promise<void>;
  isVerifying: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onVerify,
  isVerifying
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    setRejectionReason('');
    setExpandedImage(null);
  }, [complaint, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) {
          setExpandedImage(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expandedImage, onClose]);

  if (!isOpen || !complaint) return null;

  const citizenPhoto = complaint.image_url;
  const afterPhoto = complaint.resolution?.resolution_image_url || complaint.resolution?.after_image_url || complaint.after_image_url;
  const isAlreadyVerified = String(complaint.status) === 'VERIFIED';
  const isAlreadyRejected = String(complaint.status) === 'REJECTED';

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide specific rejection notes / required fixings for the crew.');
      return;
    }
    onVerify(false, rejectionReason);
  };

  const handleApprove = () => {
    onVerify(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Click outside backdrop container */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Main Dialog Modal */}
      <div className="relative w-full max-w-3xl bg-[#FFFDF7] rounded-3xl border border-[#D9F0FF] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#D9F0FF] flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9F0FF] flex items-center justify-center text-[#111827] border border-[#89B9E6]">
              <svg className="w-5 h-5 text-[#89B9E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-[#111827]">Needs Feedback & Proof Verification</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#D9F0FF] text-[#111827] border border-[#89B9E6] font-mono font-bold">
                  #CIV-{complaint.id}
                </span>
                <Badge variant={complaint.status.toLowerCase() as any}>
                  {complaint.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {complaint.title} — <span className="text-slate-600">{complaint.address}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            title="Close dialog (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Status Banners */}
          {isAlreadyVerified && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-3">
              <span className="bg-emerald-200 text-emerald-800 w-7 h-7 rounded-full flex items-center justify-center font-black shrink-0">
                <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="font-black">Resolution Verified & Citizen Notified</p>
                <p className="text-[11px] text-emerald-700 font-medium">This issue has been approved by Municipal Admin and unlocked for citizen rating.</p>
              </div>
            </div>
          )}

          {isAlreadyRejected && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs font-bold text-rose-900 flex items-start gap-3">
              <span className="bg-rose-200 text-rose-800 w-7 h-7 rounded-full flex items-center justify-center font-black shrink-0">
                <svg className="w-4 h-4 text-rose-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <p className="font-black">Resolution Rejected — Sent Back to Crew Task List</p>
                <p className="text-[11px] text-rose-700 font-semibold mt-0.5">
                  Required Fixings: "{complaint.resolution?.rejection_reason || 'Task sent back for further cleaning.'}"
                </p>
              </div>
            </div>
          )}

          {/* Side-by-side Photo Comparison */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>Side-by-Side Proof Inspection</span>
              <span className="text-[10px] text-slate-400 font-normal normal-case">(Click any photo to enlarge)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Citizen Before Photo */}
              <div className="bg-white p-4 rounded-2xl border border-[#D9F0FF] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                      1. Citizen Report (BEFORE)
                    </span>
                    {complaint.citizen?.name && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold border border-slate-200">
                        {complaint.citizen.name}
                      </span>
                    )}
                  </div>

                  {citizenPhoto ? (
                    <div 
                      onClick={() => setExpandedImage(citizenPhoto)} 
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-52 transition-transform duration-200 hover:scale-[1.01]"
                    >
                      <img 
                        src={citizenPhoto} 
                        alt="Citizen Report Initial Upload" 
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        Click to Expand
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-52 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-xs text-slate-400 font-semibold p-4 text-center">
                      <span>No initial photo uploaded by citizen</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">Description: </span>
                  {complaint.description || "No additional description provided."}
                </div>
              </div>

              {/* Crew After Work Photo */}
              <div className="bg-[#D9F0FF]/30 p-4 rounded-2xl border border-[#89B9E6] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-[#111827] flex items-center gap-1">
                      2. Crew Work Proof (AFTER)
                    </span>
                    <span className="text-[10px] text-emerald-800 font-black uppercase bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                      Work Proof
                    </span>
                  </div>

                  {afterPhoto ? (
                    <div 
                      onClick={() => setExpandedImage(afterPhoto)} 
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-[#89B9E6] bg-white h-52 transition-transform duration-200 hover:scale-[1.01]"
                    >
                      <img 
                        src={afterPhoto} 
                        alt="Crew Resolution Work Proof" 
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        Click to Expand
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-52 bg-amber-50 rounded-xl border border-dashed border-amber-300 flex flex-col items-center justify-center text-xs text-amber-700 font-semibold p-4 text-center">
                      <span>No work proof photo uploaded yet by crew</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#D9F0FF] text-[11px] text-slate-700 font-medium">
                  <span className="font-bold text-[#111827]">Crew Work Notes: </span>
                  {complaint.resolution?.notes || "Cleaned up bin overflow and disinfected area."}
                </div>
              </div>

            </div>
          </div>

          {/* Required Fixings Input Section (When Admin is inspecting non-verified or rejecting) */}
          {!isAlreadyVerified && (
            <div className="p-4 bg-white rounded-2xl border border-[#89B9E6] space-y-3 shadow-xs">
              <label className="block text-xs font-black uppercase tracking-wide text-[#111827]">
                Admin Review Feedback / Required Fixings Notes
              </label>
              <p className="text-[11px] text-slate-500 font-semibold -mt-2">
                If unsatisfying, enter required fixes. This will alert the crew on their dashboard to redo the task!
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Garbage debris still remains behind the bin enclosure. Please sweep and sanitize the entire perimeter..."
                className="w-full px-3.5 py-2.5 border border-[#89B9E6] rounded-xl text-xs font-semibold bg-[#FFFDF7] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#89B9E6]"
              />
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#D9F0FF] flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>

          {!isAlreadyVerified && (
            <div className="flex items-center gap-3">
              <Button
                variant="danger"
                size="md"
                isLoading={isVerifying}
                onClick={handleReject}
              >
                Reject & Send Back to Crew
              </Button>
              
              <Button
                variant="matcha"
                size="md"
                isLoading={isVerifying}
                onClick={handleApprove}
              >
                Approve & Send Citizen Notification
              </Button>
            </div>
          )}

          {isAlreadyVerified && (
            <Button variant="matcha" size="sm" onClick={onClose}>
              Done Viewing
            </Button>
          )}
        </div>

      </div>

      {/* Expanded Fullscreen Image Lightbox Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={expandedImage} alt="Expanded Full View" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button 
              onClick={() => setExpandedImage(null)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import { apiRequest } from "./client";
import type { Complaint, DashboardStats, User } from "../types";

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  image_url?: string;
}

export async function fetchComplaints(): Promise<Complaint[]> {
  return apiRequest<Complaint[]>("/complaints");
}

export async function fetchComplaintById(id: number): Promise<Complaint> {
  return apiRequest<Complaint>(`/complaints/${id}`);
}

export async function createComplaint(data: CreateComplaintInput): Promise<Complaint> {
  return apiRequest<Complaint>("/complaints", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/analytics/overview");
}

export async function fetchCurrentUser(): Promise<User> {
  return apiRequest<User>("/auth/me");
}

export async function assignComplaint(complaintId: number, crewId: number, notes?: string): Promise<Complaint> {
  return apiRequest<Complaint>(`/complaints/${complaintId}/assign`, {
    method: "POST",
    body: JSON.stringify({
      complaint_id: complaintId,
      crew_id: crewId,
      assigned_to_id: crewId,
      notes
    })
  });
}

export async function resolveComplaint(complaintId: number, notes: string, afterImageUrl?: string): Promise<Complaint> {
  return apiRequest<Complaint>(`/complaints/${complaintId}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      notes,
      after_image_url: afterImageUrl,
      resolution_image_url: afterImageUrl
    })
  });
}

export async function fetchCrewMembers(): Promise<User[]> {
  return apiRequest<User[]>("/admin/crews");
}

export async function rateComplaint(complaintId: number, score: number, feedback?: string): Promise<Complaint> {
  return apiRequest<Complaint>(`/complaints/${complaintId}/rate`, {
    method: "POST",
    body: JSON.stringify({ score, feedback })
  });
}


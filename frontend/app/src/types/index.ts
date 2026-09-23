export const UserRole = {
  CITIZEN: "citizen",
  CREW: "crew",
  ADMIN: "admin"
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: number;
  firebase_uid: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export const ComplaintStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED"
} as const;

export type ComplaintStatus = typeof ComplaintStatus[keyof typeof ComplaintStatus];

export const ComplaintCategory = {
  GARBAGE_COLLECTION: "Garbage Collection",
  DRAIN_BLOCKAGE: "Drain Blockage",
  HAZARDOUS_WASTE: "Hazardous Waste",
  POTHOLE: "Pothole",
  OTHER: "Other"
} as const;

export type ComplaintCategory = typeof ComplaintCategory[keyof typeof ComplaintCategory];

export interface Complaint {
  id: number;
  citizen_id: number;
  title: string;
  description: string;
  category: ComplaintCategory | string;
  severity: number;
  ai_confidence?: number;
  ai_category?: string;
  latitude: number;
  longitude: number;
  address: string;
  image_url?: string;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  citizen?: {
    name: string;
    email: string;
  };
  assigned_crew_id?: number;
  assigned_crew?: {
    id: number;
    name: string;
    email: string;
  };
  resolution?: Resolution;
  after_image_url?: string;
  rating?: Rating;
}


export interface Assignment {
  id: number;
  complaint_id: number;
  assigned_to_id: number;
  assigned_by_id: number;
  assigned_at: string;
  status: string;
  notes?: string;
  crew_member?: {
    name: string;
    email: string;
  };
}

export interface Resolution {
  id: number;
  complaint_id: number;
  crew_id?: number;
  resolved_by_id?: number;
  notes?: string;
  resolution_image_url: string;
  after_image_url?: string;
  rejection_reason?: string;
  resolved_at: string;
}

export interface Rating {
  id: number;
  complaint_id: number;
  citizen_id: number;
  score: number;
  feedback?: string;
  created_at: string;
}

export interface DashboardStats {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  verified_complaints?: number;
  active_crews: number;
  resolution_rate_percentage: number;
  average_resolution_hours: number;
}

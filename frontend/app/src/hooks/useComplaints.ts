import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchComplaints, fetchComplaintById, createComplaint, type CreateComplaintInput, assignComplaint, resolveComplaint, fetchCrewMembers, rateComplaint } from "../api/complaints";
import { useAuth } from "./useAuth";
import type { Complaint, User } from "../types";

export function useComplaints() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const complaintsQuery = useQuery<Complaint[]>({
    queryKey: ["complaints", role || "citizen"],
    queryFn: fetchComplaints,
    refetchInterval: 3000
  });

  const createComplaintMutation = useMutation({
    mutationFn: (data: CreateComplaintInput) => createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    }
  });

  return {
    complaints: complaintsQuery.data || [],
    isLoading: complaintsQuery.isLoading,
    isError: complaintsQuery.isError,
    error: complaintsQuery.error,
    refetch: complaintsQuery.refetch,
    createComplaint: createComplaintMutation.mutateAsync,
    isCreating: createComplaintMutation.isPending
  };
}

export function useComplaint(id: number) {
  return useQuery<Complaint>({
    queryKey: ["complaint", id],
    queryFn: () => fetchComplaintById(id),
    enabled: !!id
  });
}

export function useAssignComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, crewId, notes }: { complaintId: number; crewId: number; notes?: string }) =>
      assignComplaint(complaintId, crewId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    }
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, notes, afterImageUrl }: { complaintId: number; notes: string; afterImageUrl?: string }) =>
      resolveComplaint(complaintId, notes, afterImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    }
  });
}

export function useCrewMembers() {
  return useQuery<User[]>({
    queryKey: ["crewMembers"],
    queryFn: fetchCrewMembers
  });
}

export function useRateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, score, feedback }: { complaintId: number; score: number; feedback?: string }) =>
      rateComplaint(complaintId, score, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    }
  });
}


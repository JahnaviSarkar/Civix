import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from "../config/firebase";
import { fetchCurrentUser } from "../api/complaints";
import { setAuthToken, clearAuthToken } from "../api/client";
import type { User, UserRole } from "../types";

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [demoToken, setDemoToken] = useState<string | null>(localStorage.getItem("authToken"));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthInitializing(false);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const tokenKey = firebaseUser ? firebaseUser.uid : demoToken;

  const { data: user, isLoading: isUserLoading, error, refetch } = useQuery<User>({
    queryKey: ["currentUser", tokenKey],
    queryFn: fetchCurrentUser,
    enabled: !!(firebaseUser || demoToken),
    retry: false
  });

  const loginWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem("authToken");
    setDemoToken(null);
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    await refetch();
    return userCred.user;
  };

  const loginDemo = async (role: "citizen" | "crew" | "admin") => {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    const token = `demo-${role}`;
    setAuthToken(token);
    setDemoToken(token);
    localStorage.setItem("userRole", role);
    await refetch();
  };

  const logout = async () => {
    clearAuthToken();
    setDemoToken(null);
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
    queryClient.clear();
    window.location.href = "/login";
  };

  const isLoading = authInitializing || (!!(firebaseUser || demoToken) && isUserLoading);
  const isAuthenticated = !!user;

  return {
    user: user || null,
    role: (user?.role || null) as UserRole | null,
    isAuthenticated,
    isLoading,
    error,
    loginWithEmail,
    loginDemo,
    logout,
    refetch
  };
}

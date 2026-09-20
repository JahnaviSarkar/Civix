import { auth } from "../config/firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "/api"
    : "http://localhost:8000/api");

export async function getAuthToken(): Promise<string | null> {
  const localToken = localStorage.getItem("authToken");
  if (localToken && localToken.startsWith("demo-")) {
    return localToken;
  }
  // Check if Firebase user is logged in and fetch fresh ID token
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      return idToken;
    } catch (e) {
      console.warn("Failed to retrieve Firebase ID token:", e);
    }
  }
  // Fall back to local storage
  return localToken;
}

export function setAuthToken(token: string) {
  localStorage.setItem("authToken", token);
}

export function clearAuthToken() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let path = endpoint;
  if (API_BASE_URL && path.startsWith(API_BASE_URL)) {
    path = path.substring(API_BASE_URL.length);
  }
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearAuthToken();
    // Do not auto-redirect if checking auth endpoint
    if (!endpoint.includes("/auth/me")) {
      window.location.href = "/login?error=session_expired";
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

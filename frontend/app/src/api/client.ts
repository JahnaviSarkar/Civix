import { auth } from "../config/firebase";

const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE_URL = isLocalhost ? "http://localhost:8000/api" : "/api";

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

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (response.status === 401) {
    clearAuthToken();
    if (!endpoint.includes("/auth/me")) {
      window.location.href = "/login?error=session_expired";
    }
  }

  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    } else {
      const text = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${text.slice(0, 100)}...`);
    }
  }

  if (!isJson) {
    const text = await response.text();
    if (text.trim().toLowerCase().startsWith("<!doctype html>")) {
      throw new Error(`API returned an HTML page. Ensure the backend is running and the API proxy is configured correctly.`);
    }
    throw new Error(`API returned an unexpected non-JSON response.`);
  }

  return response.json() as Promise<T>;
}

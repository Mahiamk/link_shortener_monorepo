const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ------ Types ------
export interface Link {
  id: number;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
  owner_id: number;
  tag?: string | null;
  expires_at?: string | null;
  is_expired?: boolean;
  expires_in_days?: number;
  owner?: User; 
}
export interface LinkStats {
  short_code: string;
  total_clicks: number;
  tag?: string | null;
  created_at: string;
  last_clicked_at?: string | null;
  by_country: Record<string, number>;
  by_referrer: Record<string, number>;
  by_browser: Record<string, number>;
  by_device: Record<string, number>;
}
export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

// --- ADMIN STATS TYPE ---
export interface AdminStats {
  total_users: number;
  total_links: number;
  total_clicks: number;
}
// ---  Analysis Types ---
export interface ClickOverTimeStat {
  date: string;
  count: number;
}
// Type for breakdown data (e.g., {"Chrome": 100, "Safari": 50})
export type BreakdownStats = Record<string, number>;

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
) => {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API call failed: ${response.statusText} - ${text}`);
  }


  // Check for "No Content" *before* trying to parse JSON.
  if (response.status === 204) {
    return null; // Successfully deleted, return null
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  } else {
    return null;
  }
};

// ---- Auth ---
export const login = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = "Login failed due to an unknown error.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || `Login failed with status: ${response.status}`;
    } catch (err) {
      console.error("Failed to parse error response JSON:", err);
      // If response wasn't JSON, use the status text
      errorDetail = `Login failed: ${response.statusText || response.status}`;
    }
    console.error("Login failed:", errorDetail); // console log for debugging
    throw new Error(errorDetail);
  }

  return response.json();
};
export const register = async (email: string, password: string) => {
  const response = await fetch(
    `${API_URL}/auth/register/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.detail || err.message || `${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

// ---- Links API functions

// ---- Get all links for the user ----
export const getMyLinks = async (token: string): Promise<Link[]> => {
  const data = await apiFetch("/links/", {}, token);
  return data || []; 
};

// ---- Create a new link ----
export const createLink = (
  original_url: string,
  token: string,
  tag?: string
) =>
  apiFetch(
    "/links/", 
    {
      method: "POST",
      body: JSON.stringify({ original_url, tag }),
    },
    token
  );

// Delete a link by ID
export const deleteLink = (linkId: number, token: string) =>
  apiFetch(
    `/links/${linkId}`,
    {
      method: "DELETE",
    },
    token
  );

// Get expired links
export const getExpiredLinks = (token: string): Promise<Link[]> => {
  return apiFetch("/links/expired", {}, token);
};

export const getLinkStats = (
  linkId: number,
  token: string
): Promise<LinkStats> => {
  return apiFetch(`/links/${linkId}/stats`, {}, token);
};

// ---- User Profile ----
export const getUserProfile = (token: string): Promise<User> => {
  return apiFetch("/auth/me", {}, token);
};

// ---- Admin Functions ----
export const getAdminStats = (token: string): Promise<AdminStats> => {
  return apiFetch("/admin/stats", {}, token);
};

export const getAllUsers = (token: string): Promise<User[]> => {
  return apiFetch("/admin/users", {}, token);
};

export const getAllAdminLinks = (token: string): Promise<Link[]> => {
  return apiFetch("/admin/links", {}, token);
};

// ---- Admin User Registration Stats ----
export interface RegistrationStat {
  date: string; // YYYY-MM-DD or similar
  count: number;
}

export const getUserRegistrationStats = (
  token: string,
  interval: 'day' | 'month' | 'year' = 'day' // Default to daily
): Promise<RegistrationStat[]> => {
  return apiFetch(`/admin/user-registration-stats?interval=${interval}`, {}, token);
};


// --- User Analysis Functions ---

export const getAggregatedClicks = (
  token: string,
  interval: 'day' | 'month' | 'year' = 'day'
): Promise<ClickOverTimeStat[]> => {
  return apiFetch(`/analysis/clicks-over-time?interval=${interval}`, {}, token);
};

export const getAggregatedDevices = (token: string): Promise<BreakdownStats> => {
  return apiFetch(`/analysis/device-breakdown`, {}, token);
};

export const getAggregatedBrowsers = (token: string): Promise<BreakdownStats> => {
  return apiFetch(`/analysis/browser-breakdown`, {}, token);
};

export const getAggregatedReferrers = (token: string): Promise<BreakdownStats> => {
  return apiFetch(`/analysis/referrer-breakdown`, {}, token);
};

export const getAggregatedCountries = (token: string): Promise<BreakdownStats> => {
  return apiFetch(`/analysis/country-breakdown`, {}, token);
};

// --- Admin User Management Functions ---
export const updateUserStatus = (
  token: string,
  userId: number,
  isActive: boolean
): Promise<User> => {
  return apiFetch(
    `/admin/users/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    },
    token
  );
};

export const deleteUser = (
  token: string,
  userId: number
): Promise<null> => { 
  return apiFetch(
    `/admin/users/${userId}`,
    { method: 'DELETE' },
    token
  );
};

export const adminDeleteLink = (
  token: string,
  linkId: number
): Promise<null> => {
  return apiFetch(
    `/admin/links/${linkId}`, 
    { method: 'DELETE' },
    token
  );
};

export async function loginOrRegisterWithGoogle(firebaseToken: string) {
  const response = await fetch(`${API_URL}/api/auth/google/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: firebaseToken }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Google sign-in failed');
  }
  
  return response.json(); 
}
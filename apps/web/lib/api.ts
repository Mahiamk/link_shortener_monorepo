const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = RAW_API_URL.split(',')[0].trim().replace(/\/+$/, '');

// ------ Types ------
export interface Link {
  id: number;
  original_url: string;
  long_url?: string;
  short_code: string;
  clicks: number;
  click_count?: number;
  created_at: string;
  owner_id?: number | null;
  tag?: string | null;
  expires_at?: string | null;
  is_expired?: boolean;
  expires_in_days?: number;
  owner?: User | null; 
}

export interface LinkStats {
  short_code: string;
  total_clicks: number;
  original_url?: string;
  target_url?: string;
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

// --- Analysis Types ---
export interface ClickOverTimeStat {
  date: string;
  count: number;
}

export type BreakdownStats = Record<string, number>;

export interface ContactSubmission {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  created_at: string;
}

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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_URL}${cleanEndpoint}`, mergedOptions);

  if (!response.ok) {
    let errorDetail = `API call failed: ${response.statusText || response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Keep statusText fallback
    }
    throw new Error(errorDetail);
  }

  // Check for "No Content" *before* trying to parse JSON.
  if (response.status === 204) {
    return null;
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
    } catch {
      errorDetail = `Login failed: ${response.statusText || response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const register = async (email: string, password: string) => {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!response.ok) {
    let message = "Registration failed.";
    try {
      const err = await response.json();
      message = err.detail || err.message || message;
    } catch {
      message = `Registration failed with status ${response.status}`;
    }
    throw new Error(message);
  }

  return response.json();
};

// ---- Links API functions ----

export const getMyLinks = async (token: string): Promise<Link[]> => {
  const data = await apiFetch("/links/", {}, token);
  return data || []; 
};

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

export const deleteLink = (linkId: number, token: string) =>
  apiFetch(
    `/links/${linkId}`,
    {
      method: "DELETE",
    },
    token
  );

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
  date: string;
  count: number;
}

export const getUserRegistrationStats = (
  token: string,
  interval: 'day' | 'month' | 'year' = 'day'
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

// --- Contact Submissions ---

export const getContactSubmissions = (token: string): Promise<ContactSubmission[]> => {
  return apiFetch('/api/contact-submissions/', {}, token);
};

export const deleteContactSubmission = (token: string, id: number): Promise<ContactSubmission> => {
  return apiFetch(`/api/contact-submissions/${id}`, { method: 'DELETE' }, token);
};

export const submitContactForm = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}) => {
  return apiFetch('/api/contact-submissions/', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};

// --- Public Endpoints ---

export const getPublicStats = async (): Promise<{ total_links: number; total_clicks: number }> => {
  const response = await fetch(`${API_URL}/links/public/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
};

export const publicShortenUrl = async (url: string): Promise<{ short_code: string }> => {
  const response = await fetch(`${API_URL}/links/public/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    let errorDetail = 'Failed to shorten URL. Try again.';
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

export async function loginOrRegisterWithGoogle(firebaseToken: string) {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: firebaseToken }),
  });

  if (!response.ok) {
    let errorMsg = 'Google sign-in failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }
  
  return response.json(); 
}
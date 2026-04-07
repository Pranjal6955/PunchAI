const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const buildApiUrl = (path: string) => (apiBase ? `${apiBase}${path}` : path);

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const setStoredAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
};

export const clearStoredAccessToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
};

export const parseJsonSafely = async <T = Record<string, unknown>>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(buildApiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      clearStoredAccessToken();
      return null;
    }

    const data = await parseJsonSafely<{ token?: string }>(res);

    if (!data?.token) {
      clearStoredAccessToken();
      return null;
    }

    setStoredAccessToken(data.token);
    return data.token;
  } catch {
    clearStoredAccessToken();
    return null;
  }
};

export const authorizedFetch = async (
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true
): Promise<Response> => {
  const headers = new Headers(init.headers ?? undefined);
  const token = getStoredAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      const retryHeaders = new Headers(init.headers ?? undefined);
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

      return fetch(buildApiUrl(path), {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return response;
};

export interface Project {
  _id: string;
  name: string;
  description?: string;
  apiType: string;
  role: string;
  createdAt: string;
  createdBy: string;
  joinedAt?: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export const logoutSession = async (): Promise<void> => {
  try {
    await fetch(buildApiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearStoredAccessToken();
  }
};

export const getProjects = async (): Promise<Project[]> => {
  const res = await authorizedFetch("/api/projects");
  if (!res.ok) return [];
  const data = await parseJsonSafely<Project[]>(res);
  return data || [];
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const res = await authorizedFetch(`/api/projects/${projectId}`);
  if (!res.ok) return null;
  return await parseJsonSafely<Project>(res);
};

export const createProject = async (data: {
  name: string;
  description?: string;
  apiType: string;
}): Promise<Project | null> => {
  const res = await authorizedFetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Project>(res);
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    apiType?: string;
  }
): Promise<Project | null> => {
  const res = await authorizedFetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Project>(res);
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
  return res.ok;
};

export interface Member {
  _id: string;
  projectId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: "admin" | "editor" | "viewer";
  joinedAt: string;
}

export const listMembers = async (projectId: string): Promise<Member[]> => {
  const res = await authorizedFetch(`/api/projects/${projectId}/members`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<Member[]>(res);
  return data || [];
};

export const inviteMember = async (
  projectId: string,
  email: string,
  role: string
): Promise<Member | null> => {
  const res = await authorizedFetch(`/api/projects/${projectId}/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Member>(res);
};

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  role: string
): Promise<Member | null> => {
  const res = await authorizedFetch(
    `/api/projects/${projectId}/members/${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    }
  );
  if (!res.ok) return null;
  return await parseJsonSafely<Member>(res);
};

export const removeMember = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  const res = await authorizedFetch(
    `/api/projects/${projectId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );
  return res.ok;
};

export const getProfile = async (): Promise<User | null> => {
  const res = await authorizedFetch("/api/auth/me");
  if (!res.ok) return null;
  return await parseJsonSafely<User>(res);
};

export interface ProjectStats {
  memberCount: number;
  requestCount: number;
  avgResponseTime: number;
  successRate: number;
}

export interface UserStats {
  totalProjects: number;
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  totalMembers: number;
}

export const getProjectStats = async (
  projectId: string
): Promise<ProjectStats | null> => {
  const res = await authorizedFetch(`/api/projects/${projectId}/stats`);
  if (!res.ok) return null;
  return await parseJsonSafely<ProjectStats>(res);
};

export const getUserStats = async (): Promise<UserStats | null> => {
  const res = await authorizedFetch("/api/projects/all/stats");
  if (!res.ok) return null;
  return await parseJsonSafely<UserStats>(res);
};

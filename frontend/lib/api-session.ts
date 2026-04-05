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

    const data = await parseJsonSafely<{ accessToken?: string }>(res);

    if (!data?.accessToken) {
      clearStoredAccessToken();
      return null;
    }

    setStoredAccessToken(data.accessToken);
    return data.accessToken;
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

export interface Bot {
  id: string;
  name: string;
  description?: string;
  botPersona?: string;
  ownerId: string;
  dataSourceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
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

export const getBots = async (): Promise<Bot[]> => {
  const res = await authorizedFetch("/api/bots");
  if (!res.ok) return [];
  const data = await parseJsonSafely<{ data: Bot[]; total: number }>(res);
  return data?.data || [];
};

export const getBot = async (botId: string): Promise<Bot | null> => {
  const res = await authorizedFetch(`/api/bots/${botId}`);
  if (!res.ok) return null;
  return await parseJsonSafely<Bot>(res);
};

export const createBot = async (data: {
  name: string;
  description?: string;
  botPersona?: string;
}): Promise<Bot | null> => {
  const res = await authorizedFetch("/api/bots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Bot>(res);
};

export const updateBot = async (
  botId: string,
  data: {
    name?: string;
    description?: string;
    botPersona?: string;
  }
): Promise<Bot | null> => {
  const res = await authorizedFetch(`/api/bots/${botId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Bot>(res);
};

export const deleteBot = async (botId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/bots/${botId}`, {
    method: "DELETE",
  });
  return res.ok;
};

export interface Member {
  _id: string;
  botId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: "admin" | "editor" | "viewer";
  joinedAt: string;
}

export const listMembers = async (botId: string): Promise<Member[]> => {
  const res = await authorizedFetch(`/api/bots/${botId}/members`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<Member[]>(res);
  return data || [];
};

export const inviteMember = async (
  botId: string,
  email: string,
  role: string
): Promise<Member | null> => {
  const res = await authorizedFetch(`/api/bots/${botId}/invite`, {
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
  botId: string,
  userId: string,
  role: string
): Promise<Member | null> => {
  const res = await authorizedFetch(
    `/api/bots/${botId}/members/${userId}`,
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
  botId: string,
  userId: string
): Promise<boolean> => {
  const res = await authorizedFetch(
    `/api/bots/${botId}/members/${userId}`,
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

export interface BotStats {
  memberCount: number;
  requestCount: number;
  avgResponseTime: number;
  successRate: number;
}

export interface UserStats {
  totalBots: number;
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  totalMembers: number;
}

// Mocked stats since backend doesn't implement them
export const getBotStats = async (
  botId: string
): Promise<BotStats | null> => {
  return {
    memberCount: 1,
    requestCount: 120,
    avgResponseTime: 45,
    successRate: 99
  };
};

export const getUserStats = async (): Promise<UserStats | null> => {
  return {
    totalBots: 0,
    totalRequests: 350,
    avgResponseTime: 50,
    successRate: 98,
    totalMembers: 1
  };
};

export const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export const getAvatarUrl = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${apiBase}${path}`;
};

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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export const login = async (credentials: any): Promise<any> => {
  const res = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }

  if (data.accessToken) {
    setStoredAccessToken(data.accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }
  return data;
};

export const signup = async (userData: any): Promise<any> => {
  const res = await fetch(buildApiUrl("/api/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  if (data.accessToken) {
    setStoredAccessToken(data.accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }
  return data;
};

export const logoutSession = async (): Promise<void> => {
  try {
    await fetch(buildApiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  } finally {
    clearStoredAccessToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  }
};

export const getProfile = async (): Promise<User | null> => {
  const res = await authorizedFetch("/api/auth/me");
  if (!res.ok) return null;
  return await parseJsonSafely<User>(res);
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; password?: string; avatar?: string }
): Promise<User | null> => {
  const res = await authorizedFetch(`/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<User>(res);
};

export const uploadAvatar = async (file: File): Promise<User | null> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authorizedFetch("/api/users/me/avatar", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) return null;
  return await parseJsonSafely<User>(res);
};

// --- Bot Interfaces & API ---

export interface Bot {
  id: string;
  name: string;
  description?: string;
  botPersona: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  dataSourceCount?: number;
}

export interface BotListResponse {
  data: Bot[];
  total: number;
}

export const getBots = async (ownerId?: string): Promise<Bot[]> => {
  const url = ownerId ? `/api/bots/?ownerId=${ownerId}` : "/api/bots/";
  const res = await authorizedFetch(url);
  if (!res.ok) return [];
  const data = await parseJsonSafely<BotListResponse>(res);
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
  botPersona: string;
}): Promise<Bot | null> => {
  const res = await authorizedFetch("/api/bots/", {
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
  data: Partial<Omit<Bot, "id" | "ownerId" | "createdAt" | "updatedAt">>
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

// --- Chat Interfaces & API ---

export interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  metadata?: any;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  botId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface ChatListResponse {
  data: Chat[];
  total: number;
}

export const getChats = async (userId: string): Promise<Chat[]> => {
  const res = await authorizedFetch(`/api/chats/?userId=${userId}`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<ChatListResponse>(res);
  return data?.data || [];
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  const res = await authorizedFetch(`/api/chats/${chatId}`);
  if (!res.ok) return null;
  return await parseJsonSafely<Chat>(res);
};

export const createChat = async (data: {
  userId: string;
  botId: string;
  title?: string;
}): Promise<Chat | null> => {
  const res = await authorizedFetch("/api/chats/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Chat>(res);
};

export const addMessage = async (
  chatId: string,
  content: string
): Promise<Message | null> => {
  const res = await authorizedFetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<Message>(res);
};

export const deleteChat = async (chatId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/chats/${chatId}`, {
    method: "DELETE",
  });
  return res.ok;
};

// --- Data Source Interfaces & API ---

export interface DataSource {
  id: string;
  name: string;
  type: "FILE" | "URL" | "TEXT";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  botId: string;
  fileUrl?: string;
  createdAt: string;
}

export interface DataSourceListResponse {
  data: DataSource[];
  total: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  botId: string;
  sourceId: string;
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata?: any;
  sourceId: string;
  botId: string;
  createdAt: string;
}

export const getDataSources = async (botId: string): Promise<DataSource[]> => {
  const res = await authorizedFetch(`/api/datasources/?botId=${botId}`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<DataSourceListResponse>(res);
  return data?.data || [];
};

export const uploadDataSource = async (botId: string, file: File): Promise<DataSource | null> => {
  const formData = new FormData();
  formData.append("botId", botId);
  formData.append("file", file);

  const res = await authorizedFetch("/api/datasources/upload", {
    method: "POST",
    body: formData,
    // Note: Do not set Content-Type header when using FormData with fetch
  });
  if (!res.ok) return null;
  return await parseJsonSafely<DataSource>(res);
};

export const addUrlDataSource = async (botId: string, url: string): Promise<DataSource | null> => {
  const res = await authorizedFetch("/api/datasources/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botId, url }),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<DataSource>(res);
};

export const addFaqDataSource = async (botId: string, name: string, faqs: { question: string, answer: string }[]): Promise<DataSource | null> => {
  const res = await authorizedFetch("/api/datasources/faq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botId, name, faqs }),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<DataSource>(res);
};

export const deleteDataSource = async (dsId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/datasources/${dsId}`, {
    method: "DELETE",
  });
  return res.ok;
};

export const listFaqs = async (botId: string): Promise<FAQ[]> => {
  const res = await authorizedFetch(`/api/datasources/faqs?botId=${botId}`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<FAQ[]>(res);
  return data || [];
};

export const updateFaq = async (faqId: string, data: { question?: string, answer?: string }): Promise<FAQ | null> => {
  const res = await authorizedFetch(`/api/datasources/faqs/${faqId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<FAQ>(res);
};

export const deleteFaq = async (faqId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/datasources/faqs/${faqId}`, {
    method: "DELETE",
  });
  return res.ok;
};

export const getSourceChunks = async (dsId: string): Promise<DocumentChunk[]> => {
  const res = await authorizedFetch(`/api/datasources/chunks/${dsId}`);
  if (!res.ok) return [];
  const data = await parseJsonSafely<DocumentChunk[]>(res);
  return data || [];
};

export const updateChunk = async (chunkId: string, content: string): Promise<DocumentChunk | null> => {
  const res = await authorizedFetch(`/api/datasources/chunks/${chunkId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return null;
  return await parseJsonSafely<DocumentChunk>(res);
};

export const deleteChunk = async (chunkId: string): Promise<boolean> => {
  const res = await authorizedFetch(`/api/datasources/chunks/${chunkId}`, {
    method: "DELETE",
  });
  return res.ok;
};

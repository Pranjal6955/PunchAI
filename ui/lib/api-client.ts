const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "An error occurred");
    }

    return response.json();
}

export const authApi = {
    login: (credentials: any) => apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    signup: (userData: any) => apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
    }),
    getMe: () => apiRequest("/auth/me"),
};

export const botApi = {
    list: (ownerId?: string) => apiRequest(`/bots${ownerId ? `?ownerId=${ownerId}` : ""}`),
    create: (data: { name: string; description?: string; botPersona?: string; ownerId: string }) => apiRequest("/bots", {
        method: "POST",
        body: JSON.stringify(data),
    }),
    get: (id: string) => apiRequest(`/bots/${id}`),
    update: (id: string, data: { name?: string; description?: string; botPersona?: string }) => apiRequest(`/bots/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/bots/${id}`, {
        method: "DELETE",
    }),
};

export const dataSourceApi = {
    list: (botId: string) => apiRequest(`/datasources?botId=${botId}`),
    upload: (botId: string, file: File) => {
        const formData = new FormData();
        formData.append("botId", botId);
        formData.append("file", file);
        return apiRequest("/datasources/upload", {
            method: "POST",
            body: formData,
            // Header for Content-Type should not be set manually for FormData to let browser set boundary
            headers: {},
        });
    },
    addUrl: (botId: string, url: string) => apiRequest("/datasources/url", {
        method: "POST",
        body: JSON.stringify({ botId, url }),
    }),
    addFaq: (botId: string, name: string, faqs: { question: string; answer: string }[]) => apiRequest("/datasources/faq", {
        method: "POST",
        body: JSON.stringify({ botId, name, faqs }),
    }),
    delete: (id: string) => apiRequest(`/datasources/${id}`, {
        method: "DELETE",
    }),
    listChunks: (dsId: string) => apiRequest(`/datasources/chunks/${dsId}`),
    updateChunk: (chunkId: string, content: string) => apiRequest(`/datasources/chunks/${chunkId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
    }),
    deleteChunk: (chunkId: string) => apiRequest(`/datasources/chunks/${chunkId}`, {
        method: "DELETE",
    }),
};

export const chatApi = {
    create: (userId: string, botId: string, title?: string) => apiRequest("/chats", {
        method: "POST",
        body: JSON.stringify({ userId, botId, title }),
    }),
    sendMessage: (chatId: string, content: string) => apiRequest(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
    }),
    get: (chatId: string) => apiRequest(`/chats/${chatId}`),
    list: (userId: string) => apiRequest(`/chats?userId=${userId}`),
    delete: (chatId: string) => apiRequest(`/chats/${chatId}`, { method: "DELETE" }),
};

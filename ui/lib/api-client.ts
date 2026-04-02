const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...options.headers,
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

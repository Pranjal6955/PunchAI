const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserCreatePayload {
    email: string;
    password: string;
    name?: string;
    avatar?: string;
}

export interface UserLoginPayload {
    email: string;
    password: string;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (response.status === 204) {
        return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        }

        const errorMessage = typeof data.detail === "string"
            ? data.detail
            : data.detail
                ? JSON.stringify(data.detail)
                : data.message || "Something went wrong";

        throw new Error(errorMessage);
    }

    return data;
}

export const authApi = {
    signup: async (payload: UserCreatePayload) => {
        return apiRequest<any>("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    login: async (payload: UserLoginPayload) => {
        return apiRequest<any>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    getProfile: async () => {
        return apiRequest<any>("/api/auth/me", {
            method: "GET",
        });
    },
    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        }
    }
};

export const botApi = {
    list: async (params: { skip?: number; take?: number; ownerId?: string } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        return apiRequest<any>(`/api/bots/?${query}`);
    },
    get: async (id: string) => {
        return apiRequest<any>(`/api/bots/${id}`);
    },
    create: async (payload: any) => {
        return apiRequest<any>("/api/bots/", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    update: async (id: string, payload: any) => {
        return apiRequest<any>(`/api/bots/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },
    delete: async (id: string) => {
        return apiRequest<any>(`/api/bots/${id}`, {
            method: "DELETE",
        });
    },
};

export const chatApi = {
    list: async (userId: string) => {
        return apiRequest<any>(`/api/chats/?userId=${userId}`);
    },
    get: async (id: string) => {
        return apiRequest<any>(`/api/chats/${id}`);
    },
    sendMessage: async (botId: string, message: string, sessionId?: string) => {
        return apiRequest<any>("/api/bots/chat", {
            method: "POST",
            body: JSON.stringify({ botId, message, sessionId }),
        });
    },
};

export const datasourceApi = {
    list: async (botId: string) => {
        return apiRequest<any>(`/api/datasources/?botId=${botId}`);
    },
    uploadFile: async (botId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiRequest<any>(`/api/datasources/upload?botId=${botId}`, {
            method: "POST",
            headers: {
                // Fetch will set the correct boundary for FormData
                "Content-Type": "",
            },
            body: formData,
        });
    },
    addUrl: async (botId: string, url: string) => {
        return apiRequest<any>(`/api/datasources/url?botId=${botId}&url=${encodeURIComponent(url)}`, {
            method: "POST",
        });
    },
};

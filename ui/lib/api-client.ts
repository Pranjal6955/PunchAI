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
            "Content-Type": "application/json",
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
        throw new Error(data.detail || "Something went wrong");
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

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
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
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
};

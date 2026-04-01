const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    signup: async (payload: any) => {
        return apiRequest<any>("/auth/signup", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    login: async (payload: any) => {
        return apiRequest<any>("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

export const api = {
    get: async (endpoint: string) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("punch_token") : null;
        const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

        try {
            const response = await fetch(url, {
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
            });

            if (response.status === 401) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("punch_token");
                    localStorage.removeItem("punch_user");
                    window.location.href = "/login?error=Session expired. Please log in again.";
                }
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error("Network Fetch Error:", error);
            throw error;
        }
    },
    post: async (endpoint: string, data: any) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("punch_token") : null;
        const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            });

            if (response.status === 401) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("punch_token");
                    localStorage.removeItem("punch_user");
                    window.location.href = "/login?error=Session expired. Please log in again.";
                }
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error("Network Fetch Error:", error);
            throw error;
        }
    },
    patch: async (endpoint: string, data: any) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("punch_token") : null;
        const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

        try {
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            });

            if (response.status === 401) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("punch_token");
                    localStorage.removeItem("punch_user");
                    window.location.href = "/login?error=Session expired. Please log in again.";
                }
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error("Network Fetch Error:", error);
            throw error;
        }
    },
    delete: async (endpoint: string) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("punch_token") : null;
        const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
            });

            if (response.status === 401) {
                if (typeof window !== "undefined") {
                    localStorage.removeItem("punch_token");
                    localStorage.removeItem("punch_user");
                    window.location.href = "/login?error=Session expired. Please log in again.";
                }
                throw new Error("Unauthorized");
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }
            return response.status === 204 ? null : response.json();
        } catch (error) {
            console.error("Network Fetch Error:", error);
            throw error;
        }
    },
};

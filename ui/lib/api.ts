const BASE_URL = "http://localhost:8000/api"

type RequestOptions = {
    method?: string
    headers?: Record<string, string>
    body?: any
}

class ApiClient {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        }

        const config: RequestInit = {
            method: options.method || "GET",
            headers,
            ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        }

        const response = await fetch(url, config)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong")
        }

        return data as T
    }

    // Auth
    auth = {
        login: (credentials: any) =>
            this.request<any>("/auth/login", { method: "POST", body: credentials }),
        signup: (userData: any) =>
            this.request<any>("/auth/signup", { method: "POST", body: userData }),
    }

    // Bots
    bots = {
        list: () => this.request<any[]>("/bots"),
        get: (id: string) => this.request<any>(`/bots/${id}`),
        create: (botData: any) => this.request<any>("/bots", { method: "POST", body: botData }),
        update: (id: string, botData: any) => this.request<any>(`/bots/${id}`, { method: "PUT", body: botData }),
        delete: (id: string) => this.request<any>(`/bots/${id}`, { method: "DELETE" }),
    }

    // Data Sources
    datasources = {
        list: (botId?: string) => this.request<any[]>(`/datasources${botId ? `?bot_id=${botId}` : ""}`),
        create: (sourceData: any) => this.request<any>("/datasources", { method: "POST", body: sourceData }),
        delete: (id: string) => this.request<any>(`/datasources/${id}`, { method: "DELETE" }),
    }

    // Generic Request methods
    get = <T>(endpoint: string) => this.request<T>(endpoint, { method: "GET" })
    post = <T>(endpoint: string, body: any) => this.request<T>(endpoint, { method: "POST", body })
    put = <T>(endpoint: string, body: any) => this.request<T>(endpoint, { method: "PUT", body })
    delete = <T>(endpoint: string) => this.request<T>(endpoint, { method: "DELETE" })
}

export const api = new ApiClient()

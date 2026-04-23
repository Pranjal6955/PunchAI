import { authorizedFetch, parseJsonSafely } from "./api-session";

export const apiGet = async <T>(path: string): Promise<T> => {
    const res = await authorizedFetch(path);
    if (!res.ok) {
        const errorData = await parseJsonSafely<{ detail?: string }>(res);
        throw new Error(errorData?.detail || `API Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
};

export const apiPost = async <T>(path: string, body: any): Promise<T> => {
    const res = await authorizedFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorData = await parseJsonSafely<{ detail?: string }>(res);
        throw new Error(errorData?.detail || `API Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
};

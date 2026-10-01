// Thin fetch wrapper: JSON in/out, bearer token, readable errors.
const TOKEN_KEY = "travelnest_token";

export const tokenStore = {
    get: () => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    },
    set: token => {
        try {
            if (token) localStorage.setItem(TOKEN_KEY, token);
            else localStorage.removeItem(TOKEN_KEY);
        } catch {
            /* storage blocked: session lasts for this tab only */
        }
    }
};

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export async function api(path, { method = "GET", body, form } = {}) {
    const headers = {};
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res;
    try {
        res = await fetch(`/api${path}`, {
            method,
            headers,
            body: form ?? (body !== undefined ? JSON.stringify(body) : undefined)
        });
    } catch {
        throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
    }

    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`);
    }
    return data;
}

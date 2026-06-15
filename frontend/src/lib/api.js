import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API,
    withCredentials: true,
});

// Attach bearer token (fallback for environments where third-party cookies are blocked).
// Customer endpoints prefer the customer token; everything else prefers the admin token.
api.interceptors.request.use((config) => {
    if (config.headers.Authorization) return config;
    const customerToken = localStorage.getItem("zamn_customer_token");
    const adminToken = localStorage.getItem("zamn_token");
    const path = (config.url || "").toString();
    const isCustomerScoped = path.startsWith("/customer/") || (path.startsWith("/reviews") && config.method && config.method.toLowerCase() !== "get");
    const token = isCustomerScoped ? (customerToken || adminToken) : (adminToken || customerToken);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export function resolveImageUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/api/")) return `${BACKEND_URL}${url}`;
    return url;
}

export default api;

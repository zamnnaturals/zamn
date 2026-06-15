import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
    const [user, setUser] = useState(undefined);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem("zamn_customer_token");
        if (!token) { setUser(null); setLoading(false); return; }
        try {
            const { data } = await api.get("/customer/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(data);
        } catch {
            localStorage.removeItem("zamn_customer_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const signup = async ({ email, password, name, phone }) => {
        const { data } = await api.post("/customer/auth/signup", { email, password, name, phone });
        if (data.access_token) localStorage.setItem("zamn_customer_token", data.access_token);
        setUser(data.user);
        return data.user;
    };

    const login = async (email, password) => {
        const { data } = await api.post("/customer/auth/login", { email, password });
        if (data.access_token) localStorage.setItem("zamn_customer_token", data.access_token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post("/customer/auth/logout"); } catch {}
        localStorage.removeItem("zamn_customer_token");
        setUser(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ user, loading, signup, login, logout, refresh }}>
            {children}
        </CustomerAuthContext.Provider>
    );
}

export function useCustomerAuth() {
    const ctx = useContext(CustomerAuthContext);
    if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
    return ctx;
}

import { useEffect, useState, createContext, useContext } from "react";
import api from "@/lib/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);

    const refresh = async () => {
        try {
            const { data } = await api.get("/settings");
            setSettings(data);
        } catch (e) {
            // fallback minimal defaults
            setSettings({
                brand_name: "Zamn Naturals",
                tagline: "Natural & Herbal Beauty for Everyone",
                contact: { whatsapp: "", phone: "", email: "" },
                social: {},
                payment_methods: { cod: true, whatsapp_order: true },
                currency_symbol: "Rs.",
                shipping_fee: 200,
                free_shipping_above: 5000,
            });
        }
    };

    useEffect(() => { refresh(); }, []);

    return (
        <SettingsContext.Provider value={{ settings, refresh }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
    return ctx;
}

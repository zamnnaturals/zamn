import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const ContentContext = createContext(null);

const FALLBACK = {
    hero: {
        overline: "Zamn Naturals",
        title_top: "Natural &",
        title_main: "Herbal Beauty",
        title_italic: "for everyone.",
        subtitle: "Crafted in small batches with sun-kissed botanicals.",
        image_url: "",
        primary_cta_label: "Shop Now",
        primary_cta_url: "/shop/women",
        secondary_cta_label: "Discover the Story",
        secondary_cta_url: "/journal",
    },
};

export function ContentProvider({ children }) {
    const [blocks, setBlocks] = useState({});

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/content");
            setBlocks(data);
        } catch {
            setBlocks({});
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const get = (key) => blocks[key]?.data || FALLBACK[key] || null;

    return (
        <ContentContext.Provider value={{ blocks, refresh, get }}>
            {children}
        </ContentContext.Provider>
    );
}

export function useContent(key) {
    const ctx = useContext(ContentContext);
    if (!ctx) throw new Error("useContent must be used inside ContentProvider");
    return key ? ctx.get(key) : ctx;
}

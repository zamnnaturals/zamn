import { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "zamn_cart";

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = (product, quantity = 1) => {
        setItems((prev) => {
            const idx = prev.findIndex((p) => p.product_id === product.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
                return next;
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image: product.images?.[0] || "",
                    quantity,
                },
            ];
        });
    };

    const removeItem = (product_id) =>
        setItems((prev) => prev.filter((p) => p.product_id !== product_id));

    const updateQuantity = (product_id, quantity) => {
        if (quantity <= 0) return removeItem(product_id);
        setItems((prev) => prev.map((p) => (p.product_id === product_id ? { ...p, quantity } : p)));
    };

    const clear = () => setItems([]);

    const { subtotal, count } = useMemo(() => {
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const count = items.reduce((s, i) => s + i.quantity, 0);
        return { subtotal, count };
    }, [items]);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, subtotal, count }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}

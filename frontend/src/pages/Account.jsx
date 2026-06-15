import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Package } from "lucide-react";
import api from "@/lib/api";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useSettings } from "@/contexts/SettingsContext";

export default function Account() {
    const { user, loading, logout } = useCustomerAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const currency = settings?.currency_symbol || "Rs.";

    useEffect(() => {
        if (!loading && (!user || user.role !== "customer")) navigate("/login", { state: { from: "/account" } });
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) api.get("/customer/orders").then(({ data }) => setOrders(data)).catch(() => setOrders([]));
    }, [user]);

    if (loading || !user) {
        return <div className="bg-ink min-h-screen flex items-center justify-center text-white/40 text-sm uppercase tracking-luxe">Loading…</div>;
    }

    return (
        <div className="bg-ink text-white pt-28 pb-24 min-h-screen" data-testid="account-page">
            <div className="max-w-5xl mx-auto px-6 md:px-10">
                <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-luxe text-gold mb-3">— My atelier</div>
                        <h1 className="font-serif text-5xl md:text-6xl font-light">Hello, {user.name.split(" ")[0]}.</h1>
                        <p className="text-white/60 mt-2 font-light">{user.email}</p>
                    </div>
                    <button onClick={async () => { await logout(); navigate("/"); }} className="luxe-button bg-transparent text-white/70 border border-white/15 hover:border-gold hover:text-gold" data-testid="account-logout">
                        <LogOut size={14} className="mr-2" /> Sign out
                    </button>
                </div>

                <section className="bg-[#101010] border border-gold/15 p-6 md:p-8" data-testid="account-orders">
                    <div className="flex items-center gap-3 mb-6">
                        <Package size={18} className="text-gold" strokeWidth={1.2} />
                        <h2 className="font-serif text-2xl">Your orders</h2>
                    </div>
                    {orders.length === 0 ? (
                        <p className="text-white/50 text-sm font-light py-6">No orders yet. When you place your first order, it'll appear here.</p>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((o) => (
                                <div key={o.id} className="border-t border-gold/10 pt-4" data-testid={`account-order-${o.order_number}`}>
                                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                                        <div>
                                            <span className="text-gold font-serif text-lg">{o.order_number}</span>
                                            <span className="text-xs text-white/40 ml-3">{new Date(o.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase tracking-luxe text-white/60 px-2 py-1 border border-white/15">{o.payment_method}</span>
                                            <span className="text-xs uppercase tracking-luxe text-gold px-2 py-1 border border-gold/40">{o.status}</span>
                                            <span className="font-serif text-gold">{currency} {o.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <ul className="mt-3 text-sm text-white/70 space-y-1">
                                        {o.items.map((i, idx) => (
                                            <li key={idx}>{i.name} <span className="text-white/40">× {i.quantity}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

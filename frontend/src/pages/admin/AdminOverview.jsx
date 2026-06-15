import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Package, ShoppingCart, FolderTree, TrendingUp } from "lucide-react";

export default function AdminOverview() {
    const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0, revenue: 0 });
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        Promise.all([
            api.get("/products", { params: { limit: 500, is_active: undefined } }),
            api.get("/categories"),
            api.get("/orders"),
        ]).then(([p, c, o]) => {
            const revenue = o.data.reduce((s, x) => s + (x.total || 0), 0);
            setStats({ products: p.data.length, categories: c.data.length, orders: o.data.length, revenue });
            setRecent(o.data.slice(0, 5));
        }).catch(() => {});
    }, []);

    const cards = [
        { label: "Total Products", value: stats.products, icon: Package, accent: "text-gold" },
        { label: "Categories", value: stats.categories, icon: FolderTree, accent: "text-white" },
        { label: "Orders Received", value: stats.orders, icon: ShoppingCart, accent: "text-gold" },
        { label: "Revenue (PKR)", value: stats.revenue.toLocaleString(), icon: TrendingUp, accent: "text-white" },
    ];

    return (
        <div data-testid="admin-overview">
            <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Overview</div>
            <h1 className="font-serif text-5xl font-light mb-10">Welcome back.</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {cards.map((c) => (
                    <div key={c.label} className="bg-[#101010] border border-gold/15 p-6">
                        <c.icon size={20} className={c.accent} strokeWidth={1.2} />
                        <div className="text-[10px] uppercase tracking-luxe text-white/50 mt-4">{c.label}</div>
                        <div className={`font-serif text-3xl mt-1 ${c.accent}`}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-[#101010] border border-gold/15 p-6 md:p-8">
                <h2 className="font-serif text-2xl mb-6">Recent orders</h2>
                {recent.length === 0 ? (
                    <p className="text-white/50 text-sm">No orders yet. Once customers place their first order, it'll appear here.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-[10px] uppercase tracking-luxe text-white/40">
                            <tr><th className="text-left py-3">Order</th><th className="text-left">Customer</th><th className="text-left">Payment</th><th className="text-right">Total</th></tr>
                        </thead>
                        <tbody>
                            {recent.map((o) => (
                                <tr key={o.id} className="border-t border-gold/10">
                                    <td className="py-3 text-gold">{o.order_number}</td>
                                    <td>{o.customer.name}</td>
                                    <td className="uppercase text-xs tracking-luxe text-white/60">{o.payment_method}</td>
                                    <td className="text-right">Rs. {o.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

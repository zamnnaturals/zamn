import { useEffect, useState, Fragment } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("all");
    const [expanded, setExpanded] = useState(null);

    const refresh = async () => {
        const params = filter === "all" ? {} : { status: filter };
        const { data } = await api.get("/orders", { params });
        setOrders(data);
    };

    useEffect(() => { refresh(); }, [filter]);

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/orders/${id}`, { status });
            toast.success(`Marked as ${status}`);
            refresh();
        } catch { toast.error("Update failed"); }
    };

    return (
        <div data-testid="admin-orders">
            <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Fulfillment</div>
            <h1 className="font-serif text-5xl font-light mb-8">Orders</h1>

            <div className="flex gap-2 mb-6 flex-wrap">
                {["all", ...STATUSES].map((s) => (
                    <button key={s} onClick={() => setFilter(s)} data-testid={`order-filter-${s}`}
                        className={`text-xs uppercase tracking-luxe px-3 py-1.5 border transition-colors ${
                            filter === s ? "border-gold text-gold" : "border-white/15 text-white/60 hover:border-white/40"
                        }`}>{s}</button>
                ))}
            </div>

            <div className="bg-[#101010] border border-gold/15">
                <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-luxe text-white/40 bg-white/5">
                        <tr>
                            <th className="text-left p-4">Order</th><th className="text-left">Customer</th>
                            <th className="text-left">Items</th><th className="text-left">Total</th>
                            <th className="text-left">Status</th><th className="text-left p-4">Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <Fragment key={o.id}>
                                <tr className="border-t border-gold/10 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                                    <td className="p-4 text-gold">{o.order_number}</td>
                                    <td>
                                        <div>{o.customer.name}</div>
                                        <div className="text-xs text-white/40">{o.customer.phone}</div>
                                    </td>
                                    <td>{o.items.length}</td>
                                    <td>Rs. {o.total.toLocaleString()}</td>
                                    <td><StatusBadge status={o.status} /></td>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                                            className="bg-[#0d0d0d] border border-white/15 focus:border-gold outline-none px-2 py-1 text-xs uppercase">
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                </tr>
                                {expanded === o.id && (
                                    <tr className="bg-white/[0.02]">
                                        <td colSpan="6" className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-luxe text-gold mb-2">Delivery</div>
                                                    <div>{o.customer.name}</div>
                                                    <div className="text-white/60">{o.customer.phone}</div>
                                                    <div className="text-white/60">{o.customer.email}</div>
                                                    <div className="text-white/60 mt-2">{o.customer.address}, {o.customer.city}</div>
                                                    {o.customer.notes && <div className="text-white/40 mt-2 italic">"{o.customer.notes}"</div>}
                                                </div>
                                                <div className="md:col-span-2">
                                                    <div className="text-[10px] uppercase tracking-luxe text-gold mb-2">Items</div>
                                                    {o.items.map((i, idx) => (
                                                        <div key={idx} className="flex justify-between py-1.5 border-b border-white/5">
                                                            <span>{i.name} <span className="text-white/40">×{i.quantity}</span></span>
                                                            <span>Rs. {(i.price * i.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between mt-2 text-xs text-white/60">
                                                        <span>Subtotal · Shipping</span>
                                                        <span>Rs. {o.subtotal.toLocaleString()} · Rs. {o.shipping_fee.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-1 text-gold font-serif text-lg">
                                                        <span>Total ({o.payment_method.toUpperCase()})</span>
                                                        <span>Rs. {o.total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                        {orders.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-white/40">No orders.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const colors = {
        pending: "text-white/60 border-white/30",
        confirmed: "text-gold border-gold/40",
        shipped: "text-blue-300 border-blue-300/40",
        delivered: "text-herb border-herb",
        cancelled: "text-destructive border-destructive/50",
    };
    return <span className={`text-[10px] uppercase tracking-luxe px-2 py-1 border ${colors[status] || ""}`}>{status}</span>;
}

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [form, setForm] = useState({
        code: "",
        discount_type: "percent",
        discount_value: 10,
        min_subtotal: 0,
        max_discount: "",
        is_active: true,
        usage_limit: "",
    });

    const refresh = async () => {
        const { data } = await api.get("/coupons");
        setCoupons(data);
    };
    useEffect(() => { refresh(); }, []);

    const create = async (e) => {
        e.preventDefault();
        try {
            await api.post("/coupons", {
                ...form,
                code: form.code.toUpperCase().trim(),
                discount_value: parseFloat(form.discount_value),
                min_subtotal: parseFloat(form.min_subtotal) || 0,
                max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
                usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
            });
            toast.success("Coupon created");
            setForm({ ...form, code: "" });
            refresh();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete coupon?")) return;
        await api.delete(`/coupons/${id}`);
        refresh();
    };

    return (
        <div data-testid="admin-coupons">
            <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Promotions</div>
            <h1 className="font-serif text-5xl font-light mb-8">Coupons</h1>

            <form onSubmit={create} className="bg-[#101010] border border-gold/15 p-6 mb-10 grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
                <FormField label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} testid="coupon-code" />
                <div>
                    <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Type</label>
                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                        className="w-full bg-[#0d0d0d] border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm">
                        <option value="percent">Percent</option><option value="fixed">Fixed</option>
                    </select>
                </div>
                <FormField label="Value" type="number" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: v })} />
                <FormField label="Min subtotal" type="number" value={form.min_subtotal} onChange={(v) => setForm({ ...form, min_subtotal: v })} />
                <FormField label="Max discount" type="number" value={form.max_discount} onChange={(v) => setForm({ ...form, max_discount: v })} />
                <FormField label="Usage limit" type="number" value={form.usage_limit} onChange={(v) => setForm({ ...form, usage_limit: v })} />
                <button type="submit" className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold" data-testid="coupon-create-btn">
                    <Plus size={14} className="mr-1" /> Add
                </button>
            </form>

            <div className="bg-[#101010] border border-gold/15">
                <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-luxe text-white/40 bg-white/5">
                        <tr>
                            <th className="text-left p-4">Code</th><th className="text-left">Discount</th>
                            <th className="text-left">Min</th><th className="text-left">Used</th>
                            <th className="text-left">Active</th><th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((c) => (
                            <tr key={c.id} className="border-t border-gold/10">
                                <td className="p-4 font-mono text-gold">{c.code}</td>
                                <td>{c.discount_type === "percent" ? `${c.discount_value}%` : `Rs. ${c.discount_value}`}{c.max_discount ? ` (max ${c.max_discount})` : ""}</td>
                                <td>Rs. {c.min_subtotal}</td>
                                <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                                <td><span className={`text-xs uppercase tracking-luxe ${c.is_active ? "text-herb" : "text-white/30"}`}>{c.is_active ? "Live" : "Off"}</span></td>
                                <td className="text-right p-4">
                                    <button onClick={() => remove(c.id)} className="text-white/60 hover:text-destructive" data-testid={`delete-coupon-${c.id}`}><Trash2 size={15} /></button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-white/40">No coupons yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, type = "text", testid }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
                className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
        </div>
    );
}

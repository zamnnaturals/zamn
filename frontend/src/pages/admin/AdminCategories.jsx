import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: "", section: "women", sub_section: "skincare" });

    const refresh = async () => {
        const { data } = await api.get("/categories");
        setCategories(data);
    };
    useEffect(() => { refresh(); }, []);

    const create = async (e) => {
        e.preventDefault();
        try {
            await api.post("/categories", form);
            toast.success("Category added");
            setForm({ ...form, name: "" });
            refresh();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete category?")) return;
        await api.delete(`/categories/${id}`);
        refresh();
    };

    const grouped = categories.reduce((acc, c) => {
        const key = `${c.section}-${c.sub_section}`;
        acc[key] = acc[key] || [];
        acc[key].push(c);
        return acc;
    }, {});

    return (
        <div data-testid="admin-categories">
            <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Taxonomy</div>
            <h1 className="font-serif text-5xl font-light mb-10">Categories</h1>

            <form onSubmit={create} className="bg-[#101010] border border-gold/15 p-6 mb-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                        data-testid="admin-cat-name"
                        className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Section</label>
                    <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                        className="w-full bg-[#0d0d0d] border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm capitalize">
                        <option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Sub-section</label>
                    <div className="flex gap-2">
                        <select value={form.sub_section} onChange={(e) => setForm({ ...form, sub_section: e.target.value })}
                            className="flex-1 bg-[#0d0d0d] border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm capitalize">
                            <option value="skincare">Skincare</option><option value="cosmetics">Cosmetics</option>
                        </select>
                        <button type="submit" data-testid="admin-add-cat-btn"
                            className="bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold px-4 transition-all">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-8">
                {Object.entries(grouped).map(([key, list]) => {
                    const [section, sub] = key.split("-");
                    return (
                        <div key={key} className="bg-[#101010] border border-gold/15 p-6">
                            <div className="flex items-baseline justify-between mb-4">
                                <h3 className="font-serif text-xl capitalize">{section} <span className="text-gold">·</span> {sub}</h3>
                                <span className="text-[10px] uppercase tracking-luxe text-white/40">{list.length} items</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {list.map((c) => (
                                    <span key={c.id} className="inline-flex items-center gap-2 border border-gold/30 px-3 py-1.5 text-xs uppercase tracking-luxe">
                                        {c.name}
                                        <button onClick={() => remove(c.id)} className="text-white/40 hover:text-destructive" data-testid={`delete-cat-${c.id}`}>
                                            <Trash2 size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

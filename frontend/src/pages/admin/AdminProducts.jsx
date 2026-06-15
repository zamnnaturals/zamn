import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, X, Upload, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import api, { resolveImageUrl } from "@/lib/api";
import MediaPicker from "@/components/site/MediaPicker";

const SECTIONS = ["women", "men", "kids"];
const SUBS = ["skincare", "cosmetics"];

const empty = {
    name: "",
    description: "",
    price: 0,
    compare_at_price: null,
    section: "women",
    sub_section: "skincare",
    category_name: "",
    images: [],
    stock: 0,
    is_active: true,
    is_featured: false,
    badge: "",
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [uploading, setUploading] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const fileRef = useRef();
    const [search, setSearch] = useState("");

    const refresh = async () => {
        const { data } = await api.get("/products", { params: { limit: 500, is_active: undefined } });
        setProducts(data);
    };

    useEffect(() => { refresh(); }, []);

    const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); };
    const openEdit = (p) => {
        setEditing(p);
        setForm({
            name: p.name, description: p.description || "", price: p.price,
            compare_at_price: p.compare_at_price, section: p.section, sub_section: p.sub_section,
            category_name: p.category_name || "", images: p.images || [], stock: p.stock || 0,
            is_active: p.is_active, is_featured: !!p.is_featured, badge: p.badge || "",
        });
        setShowForm(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/products/${editing.id}`, form);
                toast.success("Product updated");
            } else {
                await api.post("/products", form);
                toast.success("Product created");
            }
            setShowForm(false); refresh();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Save failed");
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try { await api.delete(`/products/${id}`); toast.success("Deleted"); refresh(); }
        catch { toast.error("Delete failed"); }
    };

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        try {
            const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setForm((f) => ({ ...f, images: [...f.images, data.url] }));
            toast.success("Image uploaded");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div data-testid="admin-products">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                <div>
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Catalog</div>
                    <h1 className="font-serif text-5xl font-light">Products</h1>
                </div>
                <div className="flex gap-3 items-center">
                    <input
                        type="text" placeholder="Search…"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-b border-white/15 focus:border-gold outline-none px-2 py-2 text-sm"
                        data-testid="admin-product-search"
                    />
                    <button onClick={openCreate} data-testid="admin-add-product-btn"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold">
                        <Plus size={14} className="mr-2" /> New product
                    </button>
                </div>
            </div>

            <div className="bg-[#101010] border border-gold/15 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-luxe text-white/40 bg-white/5">
                        <tr>
                            <th className="text-left p-4">Product</th>
                            <th className="text-left">Section</th>
                            <th className="text-left">Price</th>
                            <th className="text-left">Stock</th>
                            <th className="text-left">Active</th>
                            <th className="text-right p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id} className="border-t border-gold/10 hover:bg-white/[0.02]">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-[#0a0a0a] overflow-hidden">
                                            <img src={resolveImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-serif text-base">{p.name}</div>
                                            <div className="text-xs text-white/40">{p.category_name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="uppercase text-xs tracking-luxe text-white/60">{p.section} · {p.sub_section}</td>
                                <td>Rs. {p.price.toLocaleString()}</td>
                                <td>{p.stock}</td>
                                <td>
                                    <span className={`text-xs uppercase tracking-luxe ${p.is_active ? "text-herb" : "text-white/30"}`}>
                                        {p.is_active ? "Live" : "Hidden"}
                                    </span>
                                </td>
                                <td className="text-right p-4">
                                    <button onClick={() => openEdit(p)} className="text-white/60 hover:text-gold mr-3" data-testid={`edit-product-${p.id}`}><Pencil size={15} /></button>
                                    <button onClick={() => remove(p.id)} className="text-white/60 hover:text-destructive" data-testid={`delete-product-${p.id}`}><Trash2 size={15} /></button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-white/40">No products.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" data-testid="admin-product-modal">
                    <div className="bg-[#0d0d0d] border border-gold/30 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-serif text-3xl">{editing ? "Edit product" : "New product"}</h2>
                            <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-gold"><X size={20} /></button>
                        </div>

                        <form onSubmit={save} className="space-y-5">
                            <AdminField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required testid="form-name" />
                            <AdminField label="Description" textarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} testid="form-description" />

                            <div className="grid grid-cols-2 gap-4">
                                <AdminField label="Price (PKR)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} required testid="form-price" />
                                <AdminField label="Compare-at price" type="number" value={form.compare_at_price || ""} onChange={(v) => setForm({ ...form, compare_at_price: v ? parseFloat(v) : null })} testid="form-compare-price" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <AdminSelect label="Section" value={form.section} onChange={(v) => setForm({ ...form, section: v })} options={SECTIONS} testid="form-section" />
                                <AdminSelect label="Sub-section" value={form.sub_section} onChange={(v) => setForm({ ...form, sub_section: v })} options={SUBS} testid="form-sub" />
                            </div>

                            <AdminField label="Category name (free text)" value={form.category_name} onChange={(v) => setForm({ ...form, category_name: v })} testid="form-category" />

                            <div className="grid grid-cols-2 gap-4">
                                <AdminField label="Stock" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: parseInt(v || 0, 10) })} testid="form-stock" />
                                <AdminField label="Badge (e.g., New, Sale)" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} testid="form-badge" />
                            </div>

                            {/* Images */}
                            <div>
                                <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-3">Images</label>
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                    {form.images.map((img, i) => (
                                        <div key={i} className="relative aspect-square bg-[#0a0a0a]">
                                            <img src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })}
                                                className="absolute top-1 right-1 bg-ink/80 p-1 text-white/70 hover:text-destructive">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setPickerOpen(true)}
                                        className="aspect-square border border-dashed border-gold/40 hover:border-gold flex flex-col items-center justify-center gap-1 text-white/50 hover:text-gold transition-colors"
                                        data-testid="form-pick-from-library">
                                        <ImagePlus size={18} />
                                        <span className="text-[10px] uppercase tracking-luxe">Library</span>
                                    </button>
                                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                                        className="aspect-square border border-dashed border-white/30 hover:border-gold flex flex-col items-center justify-center gap-1 text-white/50 hover:text-gold transition-colors"
                                        data-testid="form-upload-btn">
                                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                        <span className="text-[10px] uppercase tracking-luxe">Upload</span>
                                    </button>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
                                <p className="text-[10px] text-white/40">Pick from your media library or upload new (PNG, JPG, WEBP — max 10MB).</p>
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-gold" />
                                    <span className="text-sm text-white/70">Active (visible to customers)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-gold" />
                                    <span className="text-sm text-white/70">Featured</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="luxe-button text-white/60 hover:text-white">Cancel</button>
                                <button type="submit" className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold" data-testid="form-save-btn">
                                    {editing ? "Save changes" : "Create product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <MediaPicker
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                multiple
                onPick={(urls) => {
                    const list = Array.isArray(urls) ? urls : [urls];
                    setForm((f) => ({ ...f, images: [...f.images, ...list.filter((u) => !f.images.includes(u))] }));
                }}
            />
        </div>
    );
}

function AdminField({ label, value, onChange, type = "text", required, textarea, testid }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            {textarea ? (
                <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={3}
                    data-testid={testid}
                    className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm transition-colors" />
            ) : (
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
                    data-testid={testid}
                    className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm transition-colors" />
            )}
        </div>
    );
}

function AdminSelect({ label, value, onChange, options, testid }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
                className="w-full bg-[#0d0d0d] border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm capitalize">
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

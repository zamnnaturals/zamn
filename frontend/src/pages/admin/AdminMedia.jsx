import { useEffect, useState, useRef, useCallback } from "react";
import { UploadCloud, Trash2, Search, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import api, { resolveImageUrl } from "@/lib/api";

export default function AdminMedia() {
    const [media, setMedia] = useState([]);
    const [search, setSearch] = useState("");
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [copied, setCopied] = useState(null);
    const fileRef = useRef();

    const refresh = useCallback(async () => {
        const { data } = await api.get("/media", { params: { search: search || undefined } });
        setMedia(data);
    }, [search]);

    useEffect(() => { refresh(); }, [refresh]);

    const upload = async (files) => {
        if (!files || files.length === 0) return;
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("files", f));
        setUploading(true);
        try {
            const { data } = await api.post("/media/bulk", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const ok = data.items.filter((i) => !i.error).length;
            const err = data.items.length - ok;
            if (ok) toast.success(`${ok} uploaded`);
            if (err) toast.error(`${err} failed`);
            refresh();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this image permanently?")) return;
        await api.delete(`/media/${id}`);
        toast.success("Deleted");
        refresh();
    };

    const copyUrl = (url) => {
        navigator.clipboard?.writeText(url);
        setCopied(url);
        toast.success("URL copied");
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <div data-testid="admin-media">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
                <div>
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Library</div>
                    <h1 className="font-serif text-5xl font-light">Media</h1>
                    <p className="text-white/50 text-sm mt-2 font-light">{media.length} image{media.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                            className="bg-transparent border-b border-white/15 focus:border-gold outline-none pl-10 pr-2 py-2 text-sm"
                            data-testid="admin-media-search" />
                    </div>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="admin-media-upload-btn"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold disabled:opacity-50">
                        {uploading ? <Loader2 className="animate-spin mr-2" size={14} /> : <UploadCloud size={14} className="mr-2" />}
                        Upload
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
                </div>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
                className={`min-h-[400px] p-6 border-2 border-dashed transition-colors ${dragOver ? "border-gold bg-herb/5" : "border-white/10"}`}
                data-testid="admin-media-drop-zone"
            >
                {media.length === 0 ? (
                    <div className="text-center py-24">
                        <UploadCloud size={48} className="text-white/20 mx-auto" strokeWidth={1} />
                        <p className="font-serif text-2xl italic text-white/50 mt-4">Drag &amp; drop images here</p>
                        <p className="text-sm text-white/40 mt-2">…or click Upload above. Supports JPG, PNG, WEBP up to 10MB.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {media.map((m) => (
                            <div key={m.id} className="group relative bg-[#080808] aspect-square overflow-hidden" data-testid={`admin-media-${m.id}`}>
                                <img src={resolveImageUrl(m.url)} alt={m.alt_text || m.filename} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
                                    <div className="text-xs text-white/70 truncate w-full">{m.filename}</div>
                                    <div className="text-[10px] text-white/40">{(m.size / 1024).toFixed(0)} KB</div>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => copyUrl(m.url)} className="text-gold hover:text-white p-1.5 border border-gold/40" title="Copy URL">
                                            {copied === m.url ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                        <button onClick={() => remove(m.id)} className="text-destructive hover:text-white p-1.5 border border-destructive/40" title="Delete">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

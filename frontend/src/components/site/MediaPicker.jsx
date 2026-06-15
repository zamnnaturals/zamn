/**
 * Media Library Picker — opens a modal showing all uploaded media + drag&drop upload.
 * Usage:
 *   <MediaPicker open={open} onClose={...} onPick={(url) => setImage(url)} multiple={false} />
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { X, UploadCloud, Search, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { resolveImageUrl } from "@/lib/api";

export default function MediaPicker({ open, onClose, onPick, multiple = false }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef();

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/media", { params: { search: search || undefined } });
            setMedia(data);
        } catch (e) {
            toast.error("Failed to load media");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (open) {
            setSelected([]);
            refresh();
        }
    }, [open, refresh]);

    const handleUpload = async (files) => {
        if (!files || files.length === 0) return;
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append("files", f));
        setUploading(true);
        try {
            const { data } = await api.post("/media/bulk", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const okCount = data.items.filter((i) => !i.error).length;
            const errCount = data.items.length - okCount;
            if (okCount) toast.success(`${okCount} image${okCount > 1 ? "s" : ""} uploaded`);
            if (errCount) toast.error(`${errCount} file${errCount > 1 ? "s" : ""} skipped`);
            refresh();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Upload failed");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    const toggleSelect = (url) => {
        if (multiple) {
            setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));
        } else {
            onPick(url);
            onClose();
        }
    };

    const confirmMulti = () => {
        if (selected.length === 0) return toast.error("Select at least one image");
        onPick(selected);
        onClose();
    };

    const remove = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this image from the media library?")) return;
        try {
            await api.delete(`/media/${id}`);
            toast.success("Deleted");
            refresh();
        } catch { toast.error("Delete failed"); }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-sm flex items-center justify-center p-4" data-testid="media-picker-modal">
            <div className="bg-[#0d0d0d] border border-gold/30 max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between px-8 py-5 border-b border-gold/15">
                    <div>
                        <div className="text-xs uppercase tracking-luxe text-gold">— Media library</div>
                        <h2 className="font-serif text-2xl mt-1">Choose or upload</h2>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-gold" data-testid="media-picker-close">
                        <X size={22} />
                    </button>
                </header>

                {/* Toolbar */}
                <div className="px-8 py-4 border-b border-gold/10 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search filename, alt text, tags…"
                            className="w-full bg-transparent border border-white/15 focus:border-gold outline-none pl-10 pr-3 py-2 text-sm"
                            data-testid="media-picker-search"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        data-testid="media-picker-upload-btn"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="animate-spin mr-2" size={14} /> : <UploadCloud size={14} className="mr-2" />}
                        Upload
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e.target.files)} />
                </div>

                {/* Body with drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`flex-1 overflow-y-auto scrollbar-thin p-8 relative ${dragOver ? "bg-herb/10" : ""}`}
                >
                    {dragOver && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none border-2 border-dashed border-gold m-4">
                            <div className="text-center">
                                <UploadCloud size={48} className="text-gold mx-auto" strokeWidth={1.2} />
                                <div className="font-serif text-2xl mt-3 text-gold">Drop images to upload</div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square bg-white/5 animate-pulse" />)}
                        </div>
                    ) : media.length === 0 ? (
                        <div className="text-center py-24">
                            <ImageIcon size={48} className="text-white/20 mx-auto" strokeWidth={1} />
                            <p className="font-serif text-2xl italic text-white/50 mt-4">No images yet.</p>
                            <p className="text-sm text-white/40 mt-2">Drag &amp; drop, or click Upload to add your first image.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                            {media.map((m) => {
                                const isSelected = selected.includes(m.url);
                                return (
                                    <div
                                        key={m.id}
                                        onClick={() => toggleSelect(m.url)}
                                        data-testid={`media-tile-${m.id}`}
                                        className={`relative aspect-square bg-[#080808] cursor-pointer border-2 transition-all ${
                                            isSelected ? "border-gold" : "border-transparent hover:border-gold/40"
                                        }`}
                                    >
                                        <img src={resolveImageUrl(m.url)} alt={m.alt_text || m.filename} className="w-full h-full object-cover" />
                                        <button
                                            onClick={(e) => remove(m.id, e)}
                                            className="absolute top-1 right-1 bg-ink/80 p-1.5 text-white/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            data-testid={`media-delete-${m.id}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        {multiple && (
                                            <span className={`absolute top-2 left-2 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                                                isSelected ? "bg-gold border-gold text-ink" : "border-white/40 bg-ink/60"
                                            }`}>
                                                {isSelected ? "✓" : ""}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer for multi-select */}
                {multiple && (
                    <footer className="px-8 py-5 border-t border-gold/15 flex items-center justify-between">
                        <span className="text-xs text-white/60">{selected.length} selected</span>
                        <button onClick={confirmMulti} className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold" data-testid="media-picker-confirm">
                            Use selected
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
}

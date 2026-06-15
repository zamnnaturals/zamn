/**
 * MediaInput — single-image picker with preview + remove. Backed by MediaPicker.
 */
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/api";
import MediaPicker from "./MediaPicker";

export default function MediaInput({ value, onChange, label, testid }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            {label && <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>}
            <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-[#0a0a0a] border border-white/15 overflow-hidden shrink-0 relative">
                    {value ? (
                        <>
                            <img src={resolveImageUrl(value)} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => onChange("")} className="absolute top-0.5 right-0.5 bg-ink/80 p-1 text-white/70 hover:text-destructive">
                                <X size={10} />
                            </button>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                            <ImagePlus size={20} strokeWidth={1.2} />
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    data-testid={testid}
                    className="text-xs uppercase tracking-luxe text-gold border-b border-gold/40 hover:border-gold pb-0.5 transition-colors"
                >
                    {value ? "Change image" : "Pick image"}
                </button>
            </div>
            <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(url) => onChange(url)} />
        </div>
    );
}

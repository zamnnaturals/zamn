/**
 * AdminContent — CMS editor for hero, category cards, story, journal posts, etc.
 * Each block is editable inline; images use MediaInput.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import MediaInput from "@/components/site/MediaInput";
import { Save, Plus, Trash2 } from "lucide-react";

const TABS = [
    { key: "hero", label: "Hero" },
    { key: "categories_section", label: "Category Cards" },
    { key: "category_pages", label: "Category Pages" },
    { key: "values", label: "Value Strip" },
    { key: "story_quote", label: "Quote Block" },
    { key: "journal", label: "Journal" },
];

export default function AdminContent() {
    const [blocks, setBlocks] = useState({});
    const [active, setActive] = useState("hero");
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        const { data } = await api.get("/content");
        setBlocks(data);
    };
    useEffect(() => { refresh(); }, []);

    const updateData = (key, newData) => setBlocks((b) => ({ ...b, [key]: { ...(b[key] || {}), data: newData } }));

    const save = async (key) => {
        setSaving(true);
        try {
            await api.put(`/content/${key}`, { data: blocks[key]?.data || {} });
            toast.success("Saved");
            refresh();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Save failed");
        } finally { setSaving(false); }
    };

    const data = blocks[active]?.data || {};

    return (
        <div data-testid="admin-content">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <div>
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— CMS</div>
                    <h1 className="font-serif text-5xl font-light">Content blocks</h1>
                    <p className="text-white/50 text-sm mt-2 font-light">Edit every word and image on your storefront. No code required.</p>
                </div>
                <button onClick={() => save(active)} disabled={saving} data-testid="admin-content-save"
                    className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold disabled:opacity-50">
                    <Save size={14} className="mr-2" /> {saving ? "Saving…" : "Save section"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-thin border-b border-gold/10 pb-3">
                {TABS.map((t) => (
                    <button key={t.key} onClick={() => setActive(t.key)} data-testid={`content-tab-${t.key}`}
                        className={`whitespace-nowrap text-xs uppercase tracking-luxe px-4 py-2 border transition-colors ${
                            active === t.key ? "border-gold text-gold bg-gold/5" : "border-white/15 text-white/60 hover:border-white/40"
                        }`}>{t.label}</button>
                ))}
            </div>

            {/* Editor */}
            <div className="bg-[#101010] border border-gold/15 p-6 md:p-8">
                {active === "hero" && <HeroEditor data={data} onChange={(d) => updateData("hero", d)} />}
                {active === "categories_section" && <CategoriesEditor data={data} onChange={(d) => updateData("categories_section", d)} />}
                {active === "category_pages" && <CategoryPagesEditor data={data} onChange={(d) => updateData("category_pages", d)} />}
                {active === "values" && <ValuesEditor data={data} onChange={(d) => updateData("values", d)} />}
                {active === "story_quote" && <QuoteEditor data={data} onChange={(d) => updateData("story_quote", d)} />}
                {active === "journal" && <JournalEditor data={data} onChange={(d) => updateData("journal", d)} />}
            </div>
        </div>
    );
}

function Field({ label, value, onChange, textarea, testid }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            {textarea ? (
                <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} data-testid={testid}
                    className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
            ) : (
                <input value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testid}
                    className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
            )}
        </div>
    );
}

function HeroEditor({ data, onChange }) {
    const set = (k, v) => onChange({ ...data, [k]: v });
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Overline (small label)" value={data.overline} onChange={(v) => set("overline", v)} testid="hero-overline" />
            <div></div>
            <Field label="Title (top line)" value={data.title_top} onChange={(v) => set("title_top", v)} testid="hero-title-top" />
            <Field label="Title (main)" value={data.title_main} onChange={(v) => set("title_main", v)} testid="hero-title-main" />
            <Field label="Title (italic)" value={data.title_italic} onChange={(v) => set("title_italic", v)} />
            <div></div>
            <Field label="Subtitle" textarea value={data.subtitle} onChange={(v) => set("subtitle", v)} testid="hero-subtitle" />
            <MediaInput label="Background image" value={data.image_url} onChange={(v) => set("image_url", v)} testid="hero-image-picker" />
            <Field label="Primary CTA — Label" value={data.primary_cta_label} onChange={(v) => set("primary_cta_label", v)} />
            <Field label="Primary CTA — URL" value={data.primary_cta_url} onChange={(v) => set("primary_cta_url", v)} />
            <Field label="Secondary CTA — Label" value={data.secondary_cta_label} onChange={(v) => set("secondary_cta_label", v)} />
            <Field label="Secondary CTA — URL" value={data.secondary_cta_url} onChange={(v) => set("secondary_cta_url", v)} />
        </div>
    );
}

function CategoriesEditor({ data, onChange }) {
    const set = (k, v) => onChange({ ...data, [k]: v });
    const cards = data.cards || [];
    const setCard = (idx, partial) => {
        const next = [...cards];
        next[idx] = { ...next[idx], ...partial };
        set("cards", next);
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Overline" value={data.overline} onChange={(v) => set("overline", v)} />
                <Field label="Title" value={data.title} onChange={(v) => set("title", v)} />
                <Field label="Subtitle" textarea value={data.subtitle} onChange={(v) => set("subtitle", v)} />
            </div>
            <div className="hairline" />
            {cards.map((c, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-white/10 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Label" value={c.label} onChange={(v) => setCard(i, { label: v })} />
                    <Field label="Caption" value={c.caption} onChange={(v) => setCard(i, { caption: v })} />
                    <Field label="Key (women/men/kids)" value={c.key} onChange={(v) => setCard(i, { key: v })} />
                    <div className="md:col-span-3">
                        <MediaInput label="Card image" value={c.image_url} onChange={(v) => setCard(i, { image_url: v })} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CategoryPagesEditor({ data, onChange }) {
    const sections = ["women", "men", "kids"];
    const setSection = (s, partial) => onChange({ ...data, [s]: { ...(data[s] || {}), ...partial } });
    return (
        <div className="space-y-6">
            {sections.map((s) => (
                <div key={s} className="bg-[#0a0a0a] border border-white/10 p-5">
                    <div className="text-xs uppercase tracking-luxe text-gold mb-4 capitalize">{s} page</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Title" value={data[s]?.title} onChange={(v) => setSection(s, { title: v })} />
                        <Field label="Tagline" value={data[s]?.tagline} onChange={(v) => setSection(s, { tagline: v })} />
                        <div className="md:col-span-2">
                            <MediaInput label="Hero image" value={data[s]?.image_url} onChange={(v) => setSection(s, { image_url: v })} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ValuesEditor({ data, onChange }) {
    const items = data.items || [];
    const setItem = (i, partial) => {
        const next = [...items];
        next[i] = { ...next[i], ...partial };
        onChange({ ...data, items: next });
    };
    const add = () => onChange({ ...data, items: [...items, { icon: "Leaf", title: "", text: "" }] });
    const remove = (i) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });
    return (
        <div className="space-y-4">
            <p className="text-xs text-white/50">Icons: Leaf, ShieldCheck, Sparkles, Truck, Heart, Award, Sun, Droplet.</p>
            {items.map((it, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-white/10 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <Field label="Icon" value={it.icon} onChange={(v) => setItem(i, { icon: v })} />
                    <Field label="Title" value={it.title} onChange={(v) => setItem(i, { title: v })} />
                    <Field label="Text" value={it.text} onChange={(v) => setItem(i, { text: v })} />
                    <button onClick={() => remove(i)} className="text-destructive hover:text-white text-xs uppercase tracking-luxe self-center"><Trash2 size={14} /></button>
                </div>
            ))}
            <button onClick={add} className="luxe-button bg-transparent text-gold border border-gold/40 hover:bg-gold hover:text-ink">
                <Plus size={14} className="mr-2" /> Add value
            </button>
        </div>
    );
}

function QuoteEditor({ data, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-5">
            <Field label="Quote" textarea value={data.quote} onChange={(v) => onChange({ ...data, quote: v })} />
            <Field label="Attribution" value={data.attribution} onChange={(v) => onChange({ ...data, attribution: v })} />
        </div>
    );
}

function JournalEditor({ data, onChange }) {
    const posts = data.posts || [];
    const setPost = (i, partial) => {
        const next = [...posts];
        next[i] = { ...next[i], ...partial };
        onChange({ ...data, posts: next });
    };
    const add = () => onChange({ ...data, posts: [...posts, { title: "", excerpt: "", image_url: "" }] });
    const remove = (i) => onChange({ ...data, posts: posts.filter((_, idx) => idx !== i) });
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Intro overline" value={data.intro_overline} onChange={(v) => onChange({ ...data, intro_overline: v })} />
                <Field label="Intro title" value={data.intro_title} onChange={(v) => onChange({ ...data, intro_title: v })} />
                <div className="md:col-span-2">
                    <Field label="Intro subtitle" textarea value={data.intro_subtitle} onChange={(v) => onChange({ ...data, intro_subtitle: v })} />
                </div>
            </div>
            <div className="hairline" />
            {posts.map((p, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="text-xs uppercase tracking-luxe text-gold">Post {i + 1}</div>
                        <button onClick={() => remove(i)} className="text-destructive hover:text-white"><Trash2 size={14} /></button>
                    </div>
                    <Field label="Title" value={p.title} onChange={(v) => setPost(i, { title: v })} />
                    <Field label="Excerpt" textarea value={p.excerpt} onChange={(v) => setPost(i, { excerpt: v })} />
                    <MediaInput label="Cover image" value={p.image_url} onChange={(v) => setPost(i, { image_url: v })} />
                </div>
            ))}
            <button onClick={add} className="luxe-button bg-transparent text-gold border border-gold/40 hover:bg-gold hover:text-ink">
                <Plus size={14} className="mr-2" /> Add post
            </button>
        </div>
    );
}

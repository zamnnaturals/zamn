import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import ProductCard from "@/components/site/ProductCard";

const SECTION_META = {
    women: {
        title: "Women",
        tagline: "Botanical rituals for every chapter.",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2000&auto=format&fit=crop",
    },
    men: {
        title: "Men",
        tagline: "Quiet strength, herbal precision.",
        image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=2000&auto=format&fit=crop",
    },
    kids: {
        title: "Kids",
        tagline: "Gentle as petals. Safe as a hug.",
        image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2000&auto=format&fit=crop",
    },
};

const SUBSECTIONS = [
    { key: "skincare", label: "Skin Care" },
    { key: "cosmetics", label: "Cosmetics" },
];

export default function Category() {
    const { section, subsection } = useParams();
    const meta = SECTION_META[section] || SECTION_META.women;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeSub, setActiveSub] = useState(subsection || "all");
    const [activeCat, setActiveCat] = useState("all");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setActiveSub(subsection || "all");
        setActiveCat("all");
    }, [section, subsection]);

    useEffect(() => {
        setLoading(true);
        const params = { section, limit: 200 };
        if (activeSub !== "all") params.sub_section = activeSub;
        Promise.all([
            api.get("/products", { params }),
            api.get("/categories", { params: { section } }),
        ])
            .then(([pr, cr]) => {
                setProducts(pr.data);
                setCategories(cr.data);
            })
            .catch(() => { setProducts([]); setCategories([]); })
            .finally(() => setLoading(false));
    }, [section, activeSub]);

    const visible = useMemo(() => {
        if (activeCat === "all") return products;
        return products.filter((p) => (p.category_name || "").toLowerCase() === activeCat.toLowerCase());
    }, [products, activeCat]);

    const subCats = categories.filter((c) => activeSub === "all" || c.sub_section === activeSub);
    const uniqueCatNames = Array.from(new Set(subCats.map((c) => c.name)));

    return (
        <div className="bg-ink text-white pt-20" data-testid="category-page">
            {/* Hero */}
            <section className="relative min-h-[44vh] flex items-end overflow-hidden grain">
                <img src={meta.image} alt={meta.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/40" />
                <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full pb-16 md:pb-20">
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Collection</div>
                    <h1 className="font-serif text-6xl md:text-8xl font-light leading-none" data-testid="category-title">
                        {meta.title}
                    </h1>
                    <p className="text-white/70 mt-4 max-w-lg font-light">{meta.tagline}</p>
                </div>
            </section>

            {/* Filter bar */}
            <section className="border-y border-gold/15 sticky top-20 z-30 bg-ink/95 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div className="flex items-center gap-6 text-sm uppercase tracking-luxe">
                        <button
                            onClick={() => { setActiveSub("all"); navigate(`/shop/${section}`); }}
                            className={`transition-colors ${activeSub === "all" ? "text-gold" : "text-white/60 hover:text-white"}`}
                            data-testid="filter-sub-all"
                        >All</button>
                        {SUBSECTIONS.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => { setActiveSub(s.key); navigate(`/shop/${section}/${s.key}`); }}
                                className={`transition-colors ${activeSub === s.key ? "text-gold" : "text-white/60 hover:text-white"}`}
                                data-testid={`filter-sub-${s.key}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {uniqueCatNames.length > 0 && (
                        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin pl-0 md:pl-6 md:border-l md:border-gold/15">
                            <button
                                onClick={() => setActiveCat("all")}
                                className={`text-xs uppercase tracking-luxe px-3 py-1.5 border transition-colors ${
                                    activeCat === "all" ? "border-gold text-gold" : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                                }`}
                                data-testid="filter-cat-all"
                            >All</button>
                            {uniqueCatNames.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => setActiveCat(name)}
                                    className={`whitespace-nowrap text-xs uppercase tracking-luxe px-3 py-1.5 border transition-colors ${
                                        activeCat === name ? "border-gold text-gold" : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Products grid */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="font-serif text-3xl text-white/70 italic">No products yet.</div>
                            <p className="text-sm text-white/40 mt-2">New botanicals arriving soon.</p>
                            <Link to="/" className="inline-block mt-8 text-xs uppercase tracking-luxe text-gold border-b border-gold/40 hover:border-gold">
                                Back to home
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10" data-testid="products-grid">
                            {visible.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

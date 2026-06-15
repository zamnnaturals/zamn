import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Sparkles, ShieldCheck, Truck, Heart, Award, Sun, Droplet } from "lucide-react";
import api, { resolveImageUrl } from "@/lib/api";
import ProductCard from "@/components/site/ProductCard";
import { useContent } from "@/contexts/ContentContext";

const ICONS = { Leaf, Sparkles, ShieldCheck, Truck, Heart, Award, Sun, Droplet };

export default function Home() {
    const hero = useContent("hero") || {};
    const values = useContent("values") || { items: [] };
    const cats = useContent("categories_section") || { cards: [] };
    const quote = useContent("story_quote") || {};
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        api.get("/products", { params: { featured: true, limit: 8 } })
            .then(({ data }) => setFeatured(data))
            .catch(() => setFeatured([]));
    }, []);

    return (
        <div className="bg-ink text-white" data-testid="home-page">
            {/* HERO */}
            <section className="relative min-h-[88vh] flex items-center overflow-hidden grain" data-testid="hero-section">
                {hero.image_url && (
                    <img
                        src={resolveImageUrl(hero.image_url)}
                        alt="Hero"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />

                <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full">
                    <div className="max-w-2xl space-y-8 pt-24">
                        <div className="flex items-center gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                            <span className="h-px w-12 bg-gold" />
                            <span className="text-xs uppercase tracking-luxe text-gold">{hero.overline}</span>
                        </div>

                        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[0.95] opacity-0 animate-fade-up" style={{ animationDelay: "0.25s" }} data-testid="hero-title">
                            {hero.title_top && <><span className="text-shimmer">{hero.title_top}</span><br /></>}
                            {hero.title_main && <><span className="text-white">{hero.title_main}</span><br /></>}
                            {hero.title_italic && <span className="italic text-white/60 text-4xl sm:text-5xl md:text-6xl">{hero.title_italic}</span>}
                        </h1>

                        {hero.subtitle && (
                            <p className="text-pearl/80 text-base md:text-lg font-light max-w-lg leading-relaxed opacity-0 animate-fade-up" style={{ animationDelay: "0.5s" }}>
                                {hero.subtitle}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.7s" }}>
                            {hero.primary_cta_label && (
                                <Link to={hero.primary_cta_url || "/shop/women"} className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:text-white hover:border-gold" data-testid="hero-shop-now-btn">
                                    {hero.primary_cta_label} <ArrowRight size={16} className="ml-3" strokeWidth={1.5} />
                                </Link>
                            )}
                            {hero.secondary_cta_label && (
                                <Link to={hero.secondary_cta_url || "/journal"} className="luxe-button bg-transparent text-gold border border-gold hover:bg-gold hover:text-ink" data-testid="hero-discover-btn">
                                    {hero.secondary_cta_label}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 hidden md:flex flex-col items-center gap-3 text-gold/60">
                    <span className="text-[10px] uppercase tracking-luxe rotate-90 origin-center">Scroll</span>
                    <span className="h-12 w-px bg-gold/40" />
                </div>
            </section>

            {/* VALUES STRIP */}
            {values.items?.length > 0 && (
                <section className="border-y border-gold/15 bg-ink">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-2 lg:grid-cols-4">
                        {values.items.map((v, i) => {
                            const Icon = ICONS[v.icon] || Leaf;
                            return (
                                <div key={i} className={`flex items-center gap-4 py-8 ${i !== 0 ? "lg:border-l border-gold/10" : ""} ${i % 2 !== 0 ? "border-l border-gold/10 lg:border-l" : ""} px-4`}>
                                    <Icon size={22} className="text-gold shrink-0" strokeWidth={1.2} />
                                    <div>
                                        <div className="font-serif text-base text-white">{v.title}</div>
                                        <div className="text-xs text-white/50 font-light">{v.text}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* CATEGORY CARDS */}
            <section className="py-24 md:py-32" data-testid="categories-section">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <div className="text-xs uppercase tracking-luxe text-gold mb-4">— {cats.overline || "Curated collections"}</div>
                            <h2 className="font-serif text-4xl md:text-6xl font-light leading-none">
                                {cats.title || "Shop by ritual."}
                            </h2>
                        </div>
                        {cats.subtitle && (
                            <p className="text-white/60 max-w-md text-sm font-light leading-relaxed">{cats.subtitle}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {(cats.cards || []).map((cat) => (
                            <Link
                                key={cat.key}
                                to={`/shop/${cat.key}`}
                                data-testid={`category-card-${cat.key}`}
                                className="group relative block bg-ink border border-gold/30 hover:border-gold transition-all duration-700 overflow-hidden aspect-[3/4] hover:shadow-[0_0_40px_rgba(31,77,58,0.5)] hover:-translate-y-2"
                            >
                                {cat.image_url && (
                                    <img src={resolveImageUrl(cat.image_url)} alt={cat.label} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-1000" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                                <div className="relative h-full flex flex-col justify-end p-8 md:p-10">
                                    <div className="text-[10px] uppercase tracking-luxe text-gold mb-3">{cat.caption}</div>
                                    <div className="font-serif text-5xl md:text-6xl font-light text-white group-hover:text-gold transition-colors duration-500">
                                        {cat.label}
                                    </div>
                                    <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-luxe text-white/70 group-hover:text-gold">
                                        <span>Explore</span>
                                        <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-2" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED */}
            {featured.length > 0 && (
                <section className="py-20 md:py-28" data-testid="featured-section">
                    <div className="max-w-7xl mx-auto px-6 md:px-10">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <div className="text-xs uppercase tracking-luxe text-gold mb-4">— Bestsellers</div>
                                <h2 className="font-serif text-4xl md:text-5xl font-light">Loved by everyone.</h2>
                            </div>
                            <Link to="/shop/women" className="hidden sm:flex items-center gap-3 text-sm uppercase tracking-luxe text-white/60 hover:text-gold">
                                Shop all <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* STORY */}
            {quote.quote && (
                <section className="py-24 md:py-32 border-t border-gold/15">
                    <div className="max-w-5xl mx-auto px-6 text-center space-y-10">
                        <div className="hairline mx-auto w-40" />
                        <h2 className="font-serif text-3xl md:text-5xl font-light italic text-white/90 leading-tight">
                            “{quote.quote}”
                        </h2>
                        {quote.attribution && <div className="text-xs uppercase tracking-luxe text-gold">— {quote.attribution}</div>}
                        <div className="hairline mx-auto w-40" />
                    </div>
                </section>
            )}
        </div>
    );
}

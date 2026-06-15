import { Link } from "react-router-dom";
import { resolveImageUrl } from "@/lib/api";
import { useContent } from "@/contexts/ContentContext";

export default function Journal() {
    const data = useContent("journal") || {};
    const posts = data.posts || [];

    return (
        <div className="bg-ink text-white pt-28 pb-24 min-h-screen" data-testid="journal-page">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="text-xs uppercase tracking-luxe text-gold mb-3">— {data.intro_overline || "The Zamn journal"}</div>
                <h1 className="font-serif text-5xl md:text-7xl font-light mb-4">{data.intro_title || "Stories from the garden."}</h1>
                <p className="text-white/60 max-w-lg font-light">{data.intro_subtitle}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                    {posts.map((p, i) => (
                        <article key={i} className="group cursor-default">
                            <div className="aspect-[4/5] overflow-hidden mb-5 bg-[#111]">
                                {p.image_url && <img src={resolveImageUrl(p.image_url)} alt={p.title} className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />}
                            </div>
                            <h2 className="font-serif text-2xl group-hover:text-gold transition-colors">{p.title}</h2>
                            <p className="text-sm text-white/60 mt-2 font-light leading-relaxed">{p.excerpt}</p>
                            <div className="mt-4 text-[10px] uppercase tracking-luxe text-gold/70">Coming soon — Read</div>
                        </article>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <Link to="/shop/women" className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold">
                        Shop the collection
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { Link } from "react-router-dom";
import { resolveImageUrl } from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";

export default function ProductCard({ product }) {
    const { settings } = useSettings();
    const currency = settings?.currency_symbol || "Rs.";
    const image = resolveImageUrl(product.images?.[0]) || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600";

    return (
        <Link
            to={`/product/${product.slug}`}
            className="group block"
            data-testid={`product-card-${product.slug}`}
        >
            <div className="relative overflow-hidden bg-[#111] aspect-[3/4]">
                <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                {product.badge && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-ink/80 border border-gold/40 text-gold text-[10px] uppercase tracking-luxe">
                        {product.badge}
                    </span>
                )}
                {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="absolute top-4 right-4 px-2.5 py-1 bg-herb text-white text-[10px] uppercase tracking-luxe">
                        Sale
                    </span>
                )}
            </div>
            <div className="mt-5 space-y-1">
                {product.category_name && (
                    <div className="text-[10px] uppercase tracking-luxe text-gold/70">{product.category_name}</div>
                )}
                <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-white text-sm">{currency} {product.price.toLocaleString()}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-white/40 text-xs line-through">
                            {currency} {product.compare_at_price.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

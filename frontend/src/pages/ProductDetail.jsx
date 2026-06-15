import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingBag, MessageCircle, Truck, ShieldCheck, Leaf } from "lucide-react";
import api, { resolveImageUrl } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import ProductCard from "@/components/site/ProductCard";

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const { settings } = useSettings();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [related, setRelated] = useState([]);

    const currency = settings?.currency_symbol || "Rs.";

    useEffect(() => {
        api.get(`/products/${slug}`)
            .then(({ data }) => {
                setProduct(data);
                setActiveImg(0);
                return api.get("/products", { params: { section: data.section, sub_section: data.sub_section, limit: 6 } });
            })
            .then(({ data }) => setRelated(data.filter((p) => p.slug !== slug).slice(0, 4)))
            .catch(() => navigate("/"));
    }, [slug, navigate]);

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center text-white/40 uppercase tracking-luxe text-sm">Loading…</div>;
    }

    const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=1200"];

    const handleAdd = () => {
        addItem(product, qty);
        toast.success("Added to cart", { description: product.name });
    };

    const handleWhatsApp = () => {
        const phone = (settings?.contact?.whatsapp || "").replace(/\D/g, "");
        const msg = encodeURIComponent(`Hi Zamn Naturals! I'd like to order: ${product.name} (Qty: ${qty}) — ${currency} ${(product.price * qty).toLocaleString()}.`);
        const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
        window.open(url, "_blank");
    };

    return (
        <div className="bg-ink text-white pt-24 pb-24" data-testid="product-detail-page">
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                {/* Breadcrumb */}
                <nav className="text-xs uppercase tracking-luxe text-white/40 mb-10 flex items-center gap-2">
                    <Link to="/" className="hover:text-gold">Home</Link>
                    <span>/</span>
                    <Link to={`/shop/${product.section}`} className="hover:text-gold">{product.section}</Link>
                    <span>/</span>
                    <Link to={`/shop/${product.section}/${product.sub_section}`} className="hover:text-gold">{product.sub_section}</Link>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Gallery */}
                    <div className="space-y-4" data-testid="product-gallery">
                        <div className="relative bg-[#111] aspect-square overflow-hidden">
                            <img src={resolveImageUrl(images[activeImg])} alt={product.name} className="w-full h-full object-cover" />
                            {product.badge && (
                                <span className="absolute top-5 left-5 px-3 py-1.5 bg-ink/80 border border-gold/40 text-gold text-[10px] uppercase tracking-luxe">
                                    {product.badge}
                                </span>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`aspect-square bg-[#111] overflow-hidden border ${activeImg === i ? "border-gold" : "border-transparent hover:border-gold/40"} transition-colors`}
                                    >
                                        <img src={resolveImageUrl(img)} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="space-y-8">
                        {product.category_name && (
                            <div className="text-xs uppercase tracking-luxe text-gold">{product.category_name}</div>
                        )}

                        <div className="space-y-3">
                            <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight" data-testid="product-name">
                                {product.name}
                            </h1>
                            <div className="hairline w-32" />
                            <div className="flex items-baseline gap-4">
                                <span className="font-serif text-3xl text-gold" data-testid="product-price">
                                    {currency} {product.price.toLocaleString()}
                                </span>
                                {product.compare_at_price && product.compare_at_price > product.price && (
                                    <span className="text-white/40 line-through text-lg">
                                        {currency} {product.compare_at_price.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-white/70 text-base font-light leading-relaxed" data-testid="product-description">
                            {product.description}
                        </p>

                        {/* Quantity */}
                        <div className="flex items-center gap-6">
                            <div className="inline-flex items-center border border-gold/40">
                                <button
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    className="p-3 hover:text-gold transition-colors"
                                    data-testid="qty-decrement"
                                ><Minus size={14} /></button>
                                <span className="w-12 text-center text-sm" data-testid="qty-value">{qty}</span>
                                <button
                                    onClick={() => setQty((q) => q + 1)}
                                    className="p-3 hover:text-gold transition-colors"
                                    data-testid="qty-increment"
                                ><Plus size={14} /></button>
                            </div>
                            {product.stock > 0 ? (
                                <span className="text-xs uppercase tracking-luxe text-herb">In Stock</span>
                            ) : (
                                <span className="text-xs uppercase tracking-luxe text-white/40">Made to Order</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAdd}
                                className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold flex-1"
                                data-testid="add-to-cart-btn"
                            >
                                <ShoppingBag size={16} className="mr-3" strokeWidth={1.5} />
                                Add to Cart
                            </button>
                            {settings?.payment_methods?.whatsapp_order && (
                                <button
                                    onClick={handleWhatsApp}
                                    className="luxe-button bg-transparent text-gold border border-gold hover:bg-gold hover:text-ink flex-1"
                                    data-testid="whatsapp-order-btn"
                                >
                                    <MessageCircle size={16} className="mr-3" strokeWidth={1.5} />
                                    Order on WhatsApp
                                </button>
                            )}
                        </div>

                        {/* Perks */}
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gold/15">
                            <li className="flex items-start gap-3"><Truck size={18} className="text-gold" strokeWidth={1.2} /><span className="text-xs text-white/70">Cash on Delivery</span></li>
                            <li className="flex items-start gap-3"><ShieldCheck size={18} className="text-gold" strokeWidth={1.2} /><span className="text-xs text-white/70">100% Authentic</span></li>
                            <li className="flex items-start gap-3"><Leaf size={18} className="text-gold" strokeWidth={1.2} /><span className="text-xs text-white/70">Chemical-Free</span></li>
                        </ul>
                    </div>
                </div>

                {/* Related */}
                {related.length > 0 && (
                    <section className="mt-32" data-testid="related-section">
                        <h2 className="font-serif text-3xl md:text-4xl mb-10">You may also love</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

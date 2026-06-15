import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveImageUrl } from "@/lib/api";

export default function Cart() {
    const { items, removeItem, updateQuantity, subtotal } = useCart();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const currency = settings?.currency_symbol || "Rs.";
    const shippingFee = subtotal >= (settings?.free_shipping_above || 5000) ? 0 : (settings?.shipping_fee || 200);
    const total = subtotal + (items.length > 0 ? shippingFee : 0);

    return (
        <div className="bg-ink text-white pt-28 pb-24 min-h-screen" data-testid="cart-page">
            <div className="max-w-6xl mx-auto px-6 md:px-10">
                <div className="text-xs uppercase tracking-luxe text-gold mb-4">— Your bag</div>
                <h1 className="font-serif text-5xl md:text-6xl font-light mb-12">Cart</h1>

                {items.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="font-serif text-2xl italic text-white/70">Your cart is empty.</p>
                        <Link
                            to="/shop/women"
                            className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold mt-8"
                            data-testid="cart-empty-shop-btn"
                        >
                            Discover the collection <ArrowRight size={14} className="ml-3" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 divide-y divide-gold/10 border-t border-gold/10">
                            {items.map((item) => (
                                <div key={item.product_id} className="py-6 flex gap-5" data-testid={`cart-item-${item.product_id}`}>
                                    <div className="w-24 h-32 bg-[#111] overflow-hidden shrink-0">
                                        <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <Link to={`/product/${item.slug}`} className="font-serif text-xl hover:text-gold">{item.name}</Link>
                                        <div className="text-sm text-white/60 mt-1">{currency} {item.price.toLocaleString()}</div>
                                        <div className="mt-auto flex items-center justify-between pt-3">
                                            <div className="inline-flex items-center border border-gold/30">
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="p-2 hover:text-gold"><Minus size={12} /></button>
                                                <span className="w-8 text-center text-xs">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="p-2 hover:text-gold"><Plus size={12} /></button>
                                            </div>
                                            <button onClick={() => removeItem(item.product_id)} className="text-white/40 hover:text-destructive transition-colors" data-testid={`cart-remove-${item.product_id}`}>
                                                <Trash2 size={16} strokeWidth={1.2} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-serif text-xl text-gold">{currency} {(item.price * item.quantity).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <aside className="bg-[#101010] border border-gold/15 p-8 h-fit lg:sticky lg:top-28" data-testid="cart-summary">
                            <div className="text-xs uppercase tracking-luxe text-gold mb-6">Order summary</div>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between"><dt className="text-white/60">Subtotal</dt><dd>{currency} {subtotal.toLocaleString()}</dd></div>
                                <div className="flex justify-between">
                                    <dt className="text-white/60">Shipping</dt>
                                    <dd>{shippingFee === 0 ? <span className="text-herb">Free</span> : `${currency} ${shippingFee.toLocaleString()}`}</dd>
                                </div>
                                <div className="hairline my-3" />
                                <div className="flex justify-between text-lg pt-2"><dt className="font-serif">Total</dt><dd className="font-serif text-gold">{currency} {total.toLocaleString()}</dd></div>
                            </dl>
                            <button
                                onClick={() => navigate("/checkout")}
                                className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold w-full mt-8"
                                data-testid="cart-checkout-btn"
                            >
                                Checkout <ArrowRight size={14} className="ml-3" />
                            </button>
                            <p className="text-xs text-white/40 mt-4 text-center font-light">Cash on Delivery & WhatsApp checkout available</p>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}

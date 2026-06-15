import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Banknote, MessageCircle, Smartphone, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";

const METHOD_META = {
    cod: { label: "Cash on Delivery", icon: Banknote, desc: "Pay at your doorstep — no card needed." },
    whatsapp_order: { label: "Order via WhatsApp", icon: MessageCircle, desc: "We'll confirm your order on chat." },
    easypaisa: { label: "EasyPaisa", icon: Smartphone, desc: "Mobile wallet — coming soon." },
    jazzcash: { label: "JazzCash", icon: Smartphone, desc: "Mobile wallet — coming soon." },
    stripe: { label: "Card Payment", icon: CreditCard, desc: "Pay securely with credit/debit card." },
};

export default function Checkout() {
    const { items, subtotal, clear } = useCart();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const currency = settings?.currency_symbol || "Rs.";

    const enabledMethods = Object.entries(settings?.payment_methods || { cod: true })
        .filter(([k, v]) => v && METHOD_META[k])
        .map(([k]) => k);

    const [method, setMethod] = useState(enabledMethods[0] || "cod");
    const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [confirmation, setConfirmation] = useState(null);

    const shippingFee = subtotal >= (settings?.free_shipping_above || 5000) ? 0 : (settings?.shipping_fee || 200);
    const total = subtotal + (items.length > 0 ? shippingFee : 0);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        if (items.length === 0) return toast.error("Your cart is empty");
        if (!form.name || !form.phone || !form.address || !form.city) return toast.error("Please fill in all required fields");

        setSubmitting(true);
        try {
            const apiMethod = method === "whatsapp_order" ? "whatsapp" : method;
            const { data } = await api.post("/orders", {
                items: items.map((i) => ({
                    product_id: i.product_id, name: i.name, price: i.price, quantity: i.quantity, image: i.image,
                })),
                customer: form,
                payment_method: apiMethod,
            });
            setConfirmation(data);
            clear();
            if (method === "whatsapp_order") {
                const phone = (settings?.contact?.whatsapp || "").replace(/\D/g, "");
                const lines = [
                    `Hi Zamn Naturals! New order #${data.order_number}`,
                    `Name: ${form.name}`,
                    `Phone: ${form.phone}`,
                    `Address: ${form.address}, ${form.city}`,
                    `Items:`,
                    ...items.map((i) => `- ${i.name} x${i.quantity} (${currency} ${(i.price * i.quantity).toLocaleString()})`),
                    `Total: ${currency} ${data.total.toLocaleString()}`,
                ].join("\n");
                const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(lines)}` : `https://wa.me/?text=${encodeURIComponent(lines)}`;
                window.open(url, "_blank");
            }
        } catch (e) {
            toast.error(e.response?.data?.detail || "Order failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (confirmation) {
        return (
            <div className="bg-ink text-white pt-28 pb-24 min-h-screen flex items-center" data-testid="order-confirmation">
                <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
                    <CheckCircle2 size={56} className="text-gold mx-auto" strokeWidth={1} />
                    <h1 className="font-serif text-5xl font-light">Thank you.</h1>
                    <p className="text-white/70">Your order <span className="text-gold">{confirmation.order_number}</span> has been placed.</p>
                    <p className="text-sm text-white/50 max-w-md mx-auto font-light">We'll reach out shortly to confirm delivery. A copy of your order is saved with us.</p>
                    <div className="hairline mx-auto w-32" />
                    <div className="text-sm">Total paid on delivery: <span className="text-gold">{currency} {confirmation.total.toLocaleString()}</span></div>
                    <Link to="/" className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold inline-flex">
                        Back to home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-ink text-white pt-28 pb-24 min-h-screen" data-testid="checkout-page">
            <div className="max-w-6xl mx-auto px-6 md:px-10">
                <div className="text-xs uppercase tracking-luxe text-gold mb-4">— Checkout</div>
                <h1 className="font-serif text-5xl md:text-6xl font-light mb-12">Almost there.</h1>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Customer */}
                        <section>
                            <h2 className="font-serif text-2xl mb-6">Delivery details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full name *" value={form.name} onChange={(v) => update("name", v)} testid="checkout-name" />
                                <Field label="Phone *" value={form.phone} onChange={(v) => update("phone", v)} testid="checkout-phone" />
                                <Field label="Email" value={form.email} onChange={(v) => update("email", v)} testid="checkout-email" />
                                <Field label="City *" value={form.city} onChange={(v) => update("city", v)} testid="checkout-city" />
                                <Field full label="Address *" value={form.address} onChange={(v) => update("address", v)} testid="checkout-address" />
                                <Field full label="Notes" value={form.notes} onChange={(v) => update("notes", v)} testid="checkout-notes" />
                            </div>
                        </section>

                        {/* Payment */}
                        <section>
                            <h2 className="font-serif text-2xl mb-6">Payment method</h2>
                            <div className="space-y-3">
                                {enabledMethods.map((m) => {
                                    const meta = METHOD_META[m];
                                    const Icon = meta.icon;
                                    const active = method === m;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMethod(m)}
                                            data-testid={`payment-${m}`}
                                            className={`w-full text-left p-5 border transition-all flex items-center gap-4 ${
                                                active ? "border-gold bg-gold/5" : "border-white/10 hover:border-gold/40"
                                            }`}
                                        >
                                            <Icon size={22} className={active ? "text-gold" : "text-white/60"} strokeWidth={1.2} />
                                            <div className="flex-1">
                                                <div className={`text-sm uppercase tracking-luxe ${active ? "text-gold" : "text-white"}`}>{meta.label}</div>
                                                <div className="text-xs text-white/50 mt-1">{meta.desc}</div>
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border ${active ? "border-gold bg-gold" : "border-white/30"}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Summary */}
                    <aside className="bg-[#101010] border border-gold/15 p-8 h-fit lg:sticky lg:top-28" data-testid="checkout-summary">
                        <div className="text-xs uppercase tracking-luxe text-gold mb-6">Your order</div>
                        <ul className="space-y-3 text-sm max-h-64 overflow-y-auto scrollbar-thin pr-1">
                            {items.map((i) => (
                                <li key={i.product_id} className="flex justify-between">
                                    <span className="text-white/80 line-clamp-1">{i.name} <span className="text-white/40">× {i.quantity}</span></span>
                                    <span>{currency} {(i.price * i.quantity).toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="hairline my-5" />
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between"><dt className="text-white/60">Subtotal</dt><dd>{currency} {subtotal.toLocaleString()}</dd></div>
                            <div className="flex justify-between"><dt className="text-white/60">Shipping</dt><dd>{shippingFee === 0 ? <span className="text-herb">Free</span> : `${currency} ${shippingFee.toLocaleString()}`}</dd></div>
                            <div className="flex justify-between text-lg pt-2"><dt className="font-serif">Total</dt><dd className="font-serif text-gold">{currency} {total.toLocaleString()}</dd></div>
                        </dl>
                        <button
                            type="submit"
                            disabled={submitting || items.length === 0}
                            className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold w-full mt-8 disabled:opacity-50"
                            data-testid="checkout-place-order-btn"
                        >
                            {submitting ? "Placing order…" : "Place order"} <ArrowRight size={14} className="ml-3" />
                        </button>
                    </aside>
                </form>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, full, testid }) {
    return (
        <div className={full ? "sm:col-span-2" : ""}>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
                className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-2 text-sm text-white placeholder-white/30 transition-colors"
            />
        </div>
    );
}

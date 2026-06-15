import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSettings } from "@/contexts/SettingsContext";
import { Save } from "lucide-react";

export default function AdminSettings() {
    const { settings, refresh } = useSettings();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings && !form) setForm(JSON.parse(JSON.stringify(settings)));
    }, [settings]); // eslint-disable-line

    if (!form) return <div className="text-white/40 text-sm">Loading…</div>;

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                brand_name: form.brand_name,
                tagline: form.tagline,
                contact: form.contact,
                social: form.social,
                payment_methods: form.payment_methods,
                payment_instructions: form.payment_instructions,
                currency: form.currency,
                currency_symbol: form.currency_symbol,
                shipping_fee: parseFloat(form.shipping_fee) || 0,
                free_shipping_above: parseFloat(form.free_shipping_above) || 0,
            };
            await api.put("/settings", payload);
            await refresh();
            toast.success("Settings saved");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const setField = (path, value) => {
        setForm((f) => {
            const next = JSON.parse(JSON.stringify(f));
            const keys = path.split(".");
            let obj = next;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = value;
            return next;
        });
    };

    return (
        <div data-testid="admin-settings">
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Boutique</div>
                    <h1 className="font-serif text-5xl font-light">Settings</h1>
                </div>
                <button onClick={save} disabled={saving} data-testid="settings-save-btn"
                    className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold disabled:opacity-50">
                    <Save size={14} className="mr-2" /> {saving ? "Saving…" : "Save"}
                </button>
            </div>

            <div className="space-y-10">
                <Section title="Brand">
                    <Field label="Brand name" value={form.brand_name} onChange={(v) => setField("brand_name", v)} testid="settings-brand-name" />
                    <Field label="Tagline" value={form.tagline} onChange={(v) => setField("tagline", v)} testid="settings-tagline" />
                </Section>

                <Section title="Contact (Footer)">
                    <Field label="WhatsApp number" value={form.contact.whatsapp} onChange={(v) => setField("contact.whatsapp", v)} testid="settings-whatsapp" />
                    <Field label="Phone" value={form.contact.phone} onChange={(v) => setField("contact.phone", v)} testid="settings-phone" />
                    <Field label="Email" value={form.contact.email} onChange={(v) => setField("contact.email", v)} testid="settings-email" />
                    <Field label="Address" value={form.contact.address} onChange={(v) => setField("contact.address", v)} testid="settings-address" />
                </Section>

                <Section title="Social media (URLs)">
                    <Field label="Instagram" value={form.social.instagram} onChange={(v) => setField("social.instagram", v)} testid="settings-instagram" />
                    <Field label="Facebook" value={form.social.facebook} onChange={(v) => setField("social.facebook", v)} testid="settings-facebook" />
                    <Field label="TikTok" value={form.social.tiktok} onChange={(v) => setField("social.tiktok", v)} />
                    <Field label="YouTube" value={form.social.youtube} onChange={(v) => setField("social.youtube", v)} />
                </Section>

                <Section title="Payment methods">
                    <p className="text-xs text-white/50 mb-4 col-span-full font-light">Enable or disable payment options. For EasyPaisa/JazzCash, customers get the account details after checkout and confirm via WhatsApp.</p>
                    <Toggle label="Cash on Delivery" value={form.payment_methods.cod} onChange={(v) => setField("payment_methods.cod", v)} testid="pm-cod" />
                    <Toggle label="WhatsApp Order" value={form.payment_methods.whatsapp_order} onChange={(v) => setField("payment_methods.whatsapp_order", v)} testid="pm-wa" />
                    <Toggle label="EasyPaisa (manual)" value={form.payment_methods.easypaisa} onChange={(v) => setField("payment_methods.easypaisa", v)} testid="pm-ep" />
                    <Toggle label="JazzCash (manual)" value={form.payment_methods.jazzcash} onChange={(v) => setField("payment_methods.jazzcash", v)} testid="pm-jc" />
                    <Toggle label="Stripe (placeholder)" value={form.payment_methods.stripe} onChange={(v) => setField("payment_methods.stripe", v)} testid="pm-stripe" />
                </Section>

                <Section title="EasyPaisa details (shown to customer)">
                    <Field label="Account name" value={form.payment_instructions?.easypaisa_account_name} onChange={(v) => setField("payment_instructions.easypaisa_account_name", v)} testid="ep-name" />
                    <Field label="Account / mobile number" value={form.payment_instructions?.easypaisa_account_number} onChange={(v) => setField("payment_instructions.easypaisa_account_number", v)} testid="ep-num" />
                    <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Note / instructions</label>
                        <textarea value={form.payment_instructions?.easypaisa_note || ""} onChange={(e) => setField("payment_instructions.easypaisa_note", e.target.value)} rows={2}
                            className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
                    </div>
                </Section>

                <Section title="JazzCash details (shown to customer)">
                    <Field label="Account name" value={form.payment_instructions?.jazzcash_account_name} onChange={(v) => setField("payment_instructions.jazzcash_account_name", v)} testid="jc-name" />
                    <Field label="Account / mobile number" value={form.payment_instructions?.jazzcash_account_number} onChange={(v) => setField("payment_instructions.jazzcash_account_number", v)} testid="jc-num" />
                    <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Note / instructions</label>
                        <textarea value={form.payment_instructions?.jazzcash_note || ""} onChange={(e) => setField("payment_instructions.jazzcash_note", e.target.value)} rows={2}
                            className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
                    </div>
                </Section>

                <Section title="Shipping & Currency">
                    <Field label="Currency code" value={form.currency} onChange={(v) => setField("currency", v)} />
                    <Field label="Currency symbol" value={form.currency_symbol} onChange={(v) => setField("currency_symbol", v)} />
                    <Field label="Shipping fee" type="number" value={form.shipping_fee} onChange={(v) => setField("shipping_fee", v)} />
                    <Field label="Free shipping above" type="number" value={form.free_shipping_above} onChange={(v) => setField("free_shipping_above", v)} />
                </Section>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-[#101010] border border-gold/15 p-6 md:p-8">
            <h2 className="font-serif text-2xl mb-6">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", testid }) {
    return (
        <div>
            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">{label}</label>
            <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} data-testid={testid}
                className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" />
        </div>
    );
}

function Toggle({ label, value, onChange, testid }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => onChange(!value)} data-testid={testid}
                className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-herb" : "bg-white/20"}`}>
                <span className={`absolute top-0.5 transition-all w-4 h-4 rounded-full bg-white ${value ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-white/80">{label}</span>
        </label>
    );
}

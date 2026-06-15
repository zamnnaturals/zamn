import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function Reviews({ productId, productSlug }) {
    const { user } = useCustomerAuth();
    const [reviews, setReviews] = useState([]);
    const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
    const [submitting, setSubmitting] = useState(false);

    const refresh = async () => {
        const { data } = await api.get("/reviews", { params: { product_id: productId } });
        setReviews(data);
    };

    useEffect(() => { if (productId) refresh(); }, [productId]);  // eslint-disable-line

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/reviews", { product_id: productId, ...form });
            toast.success("Thank you for your review");
            setForm({ rating: 5, title: "", comment: "" });
            refresh();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Could not submit review");
        } finally { setSubmitting(false); }
    };

    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
    const isCustomer = user && user.role === "customer";

    return (
        <section className="mt-24" data-testid="reviews-section">
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
                <h2 className="font-serif text-3xl md:text-4xl">Reviews</h2>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-3">
                        <StarRow rating={Math.round(avg)} />
                        <span className="text-white/70 text-sm">{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}</span>
                    </div>
                )}
            </div>

            {/* Submit form */}
            {isCustomer ? (
                <form onSubmit={submit} className="bg-[#101010] border border-gold/15 p-6 mb-8 space-y-4" data-testid="review-form">
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Your rating</label>
                        <RatingPicker value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Title</label>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" data-testid="review-title" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Comment</label>
                        <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3}
                            className="w-full bg-transparent border border-white/15 focus:border-gold outline-none px-3 py-2 text-sm" data-testid="review-comment" />
                    </div>
                    <button type="submit" disabled={submitting} className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold disabled:opacity-50" data-testid="review-submit">
                        {submitting ? "Submitting…" : "Submit review"}
                    </button>
                </form>
            ) : (
                <div className="bg-[#101010] border border-gold/15 p-6 mb-8 text-sm text-white/60 font-light">
                    <Link to="/login" state={{ from: productSlug ? `/product/${productSlug}` : "/" }} className="text-gold border-b border-gold/40 hover:border-gold">Sign in</Link>
                    {" "}to leave a review.
                </div>
            )}

            {/* List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-white/40 italic font-serif text-lg">No reviews yet. Be the first to share your story.</p>
                ) : reviews.map((r) => (
                    <div key={r.id} className="border-t border-gold/10 pt-6" data-testid={`review-${r.id}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <StarRow rating={r.rating} />
                                <div className="font-serif text-lg mt-1">{r.title || r.customer_name}</div>
                            </div>
                            <div className="text-xs text-white/40">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <p className="text-white/70 text-sm font-light">{r.comment}</p>
                        <div className="text-xs text-white/40 mt-2">— {r.customer_name}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function StarRow({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} className={i <= rating ? "text-gold fill-gold" : "text-white/20"} strokeWidth={1} />
            ))}
        </div>
    );
}

function RatingPicker({ value, onChange }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => onChange(i)} data-testid={`rating-${i}`}>
                    <Star size={22} className={i <= value ? "text-gold fill-gold" : "text-white/20 hover:text-white/40"} strokeWidth={1} />
                </button>
            ))}
        </div>
    );
}

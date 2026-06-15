import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { formatApiErrorDetail } from "@/lib/api";

export default function CustomerSignup() {
    const { signup, user } = useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [loading, setLoading] = useState(false);
    const redirectTo = location.state?.from || "/account";

    useEffect(() => {
        if (user && user.role === "customer") navigate(redirectTo, { replace: true });
    }, [user, navigate, redirectTo]);

    const submit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
        setLoading(true);
        try {
            await signup(form);
            toast.success("Welcome to Zamn Naturals");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-ink text-white min-h-screen flex items-center justify-center pt-20 pb-20" data-testid="customer-signup-page">
            <div className="w-full max-w-md px-6">
                <div className="text-center mb-10">
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Begin your ritual</div>
                    <h1 className="font-serif text-5xl font-light">Create account</h1>
                </div>
                <form onSubmit={submit} className="space-y-5">
                    {["name", "email", "phone", "password"].map((field) => (
                        <div key={field}>
                            <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">
                                {field === "password" ? "Password (min 6)" : field}{field !== "phone" ? " *" : ""}
                            </label>
                            <input
                                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                                value={form[field]}
                                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                required={field !== "phone"}
                                data-testid={`customer-signup-${field}`}
                                className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-3 text-sm"
                            />
                        </div>
                    ))}
                    <button type="submit" disabled={loading} data-testid="customer-signup-submit"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold w-full disabled:opacity-50 mt-4">
                        {loading ? "Creating…" : "Create account"}
                    </button>
                </form>
                <p className="text-center text-sm text-white/60 mt-10">
                    Already have one?{" "}
                    <Link to="/login" state={{ from: redirectTo }} className="text-gold border-b border-gold/40 hover:border-gold">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

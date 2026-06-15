import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatApiErrorDetail } from "@/lib/api";

export default function AdminLogin() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.role === "admin") navigate("/admin", { replace: true });
    }, [user, navigate]);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back");
            navigate("/admin", { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-ink text-white min-h-screen flex items-center justify-center pt-20" data-testid="admin-login-page">
            <div className="w-full max-w-md px-6">
                <div className="text-center mb-12">
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Admin atelier</div>
                    <h1 className="font-serif text-5xl font-light">Sign in</h1>
                    <p className="text-white/50 text-sm mt-3 font-light">Manage your collections, products, and orders.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            data-testid="admin-login-email"
                            className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-3 text-sm transition-colors"
                            placeholder="admin@zamnnaturals.com"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            data-testid="admin-login-password"
                            className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-3 text-sm transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="admin-login-submit"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold w-full disabled:opacity-50"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <div className="hairline my-12" />
                <p className="text-xs text-center text-white/40 font-light">
                    Restricted area. For boutique staff only.
                </p>
            </div>
        </div>
    );
}

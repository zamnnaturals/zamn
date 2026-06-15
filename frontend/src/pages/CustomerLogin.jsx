import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { formatApiErrorDetail } from "@/lib/api";

export default function CustomerLogin() {
    const { login, user } = useCustomerAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const redirectTo = location.state?.from || "/account";

    useEffect(() => {
        if (user && user.role === "customer") navigate(redirectTo, { replace: true });
    }, [user, navigate, redirectTo]);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Welcome back");
            navigate(redirectTo, { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-ink text-white min-h-screen flex items-center justify-center pt-20 pb-20" data-testid="customer-login-page">
            <div className="w-full max-w-md px-6">
                <div className="text-center mb-10">
                    <div className="text-xs uppercase tracking-luxe text-gold mb-3">— Welcome back</div>
                    <h1 className="font-serif text-5xl font-light">Sign in</h1>
                </div>
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="customer-login-email"
                            className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-3 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-luxe text-white/50 mb-2">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="customer-login-password"
                            className="w-full bg-transparent border-b border-white/15 focus:border-gold outline-none py-3 text-sm" />
                    </div>
                    <button type="submit" disabled={loading} data-testid="customer-login-submit"
                        className="luxe-button bg-herb text-white border border-herb hover:bg-transparent hover:border-gold hover:text-gold w-full disabled:opacity-50">
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
                <p className="text-center text-sm text-white/60 mt-10">
                    No account?{" "}
                    <Link to="/signup" state={{ from: redirectTo }} className="text-gold border-b border-gold/40 hover:border-gold">Create one</Link>
                </p>
            </div>
        </div>
    );
}

import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white/50 text-sm tracking-luxe uppercase">
                Loading...
            </div>
        );
    }
    if (!user || user.role !== "admin") {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}

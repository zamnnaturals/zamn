import { useEffect, useState } from "react";
import { Link, useNavigate, NavLink, Routes, Route, Navigate } from "react-router-dom";
import { LogOut, Package, FolderTree, Settings as SettingsIcon, ShoppingCart, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminOverview from "@/pages/admin/AdminOverview";

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const sidebar = [
        { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
        { to: "/admin/products", icon: Package, label: "Products" },
        { to: "/admin/categories", icon: FolderTree, label: "Categories" },
        { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
        { to: "/admin/settings", icon: SettingsIcon, label: "Settings" },
    ];

    const handleLogout = async () => {
        await logout();
        navigate("/admin/login");
    };

    return (
        <div className="bg-ink text-white min-h-screen flex" data-testid="admin-dashboard">
            {/* Sidebar */}
            <aside className="hidden lg:flex w-72 border-r border-gold/15 flex-col fixed inset-y-0 left-0 bg-ink z-40">
                <div className="px-8 py-8">
                    <Link to="/" className="font-serif text-2xl text-gold tracking-wider">Zamn Naturals</Link>
                    <div className="text-[10px] uppercase tracking-luxe text-white/40 mt-1">Atelier · Admin</div>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {sidebar.map((s) => (
                        <NavLink
                            key={s.to}
                            to={s.to}
                            end={s.end}
                            data-testid={`admin-nav-${s.label.toLowerCase()}`}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                                    isActive
                                        ? "bg-herb/20 text-gold border-l-2 border-gold"
                                        : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                }`
                            }
                        >
                            <s.icon size={16} strokeWidth={1.3} />
                            {s.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-gold/10">
                    <div className="text-xs text-white/40 px-4 mb-2">{user?.email}</div>
                    <button
                        onClick={handleLogout}
                        data-testid="admin-logout-btn"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-white/60 hover:text-gold w-full"
                    >
                        <LogOut size={14} /> Sign out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 lg:ml-72 px-6 md:px-12 py-10">
                {/* Mobile top bar */}
                <div className="lg:hidden mb-6 flex items-center justify-between">
                    <Link to="/" className="font-serif text-xl text-gold">Zamn · Admin</Link>
                    <button onClick={handleLogout} className="text-sm text-white/60 hover:text-gold">Logout</button>
                </div>
                <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto scrollbar-thin">
                    {sidebar.map((s) => (
                        <NavLink
                            key={s.to}
                            to={s.to}
                            end={s.end}
                            className={({ isActive }) =>
                                `whitespace-nowrap text-xs uppercase tracking-luxe px-3 py-1.5 border ${
                                    isActive ? "border-gold text-gold" : "border-white/15 text-white/60"
                                }`
                            }
                        >
                            {s.label}
                        </NavLink>
                    ))}
                </div>

                <Routes>
                    <Route index element={<AdminOverview />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}

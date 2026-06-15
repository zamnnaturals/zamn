import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";

const NAV = [
    { label: "Women", to: "/shop/women" },
    { label: "Men", to: "/shop/men" },
    { label: "Kids", to: "/shop/kids" },
    { label: "Journal", to: "/journal" },
];

export default function Header() {
    const { count } = useCart();
    const { settings } = useSettings();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <header
            className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-ink/80 border-b border-gold/10"
            data-testid="site-header"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                        data-testid="brand-logo"
                    >
                        <span className="font-serif text-2xl md:text-[28px] tracking-wider text-gold">
                            {settings?.brand_name || "Zamn Naturals"}
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-10">
                        {NAV.map((n) => (
                            <NavLink
                                key={n.to}
                                to={n.to}
                                data-testid={`nav-${n.label.toLowerCase()}`}
                                className={({ isActive }) =>
                                    `text-[13px] uppercase tracking-luxe font-light transition-colors ${
                                        isActive ? "text-gold" : "text-white/70 hover:text-gold"
                                    }`
                                }
                            >
                                {n.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/admin/login")}
                            data-testid="admin-icon-btn"
                            className="text-white/70 hover:text-gold transition-colors hidden sm:inline-flex"
                            aria-label="Admin"
                        >
                            <User size={20} strokeWidth={1.2} />
                        </button>
                        <Link
                            to="/cart"
                            data-testid="cart-icon-btn"
                            className="relative text-white/80 hover:text-gold transition-colors"
                            aria-label="Cart"
                        >
                            <ShoppingBag size={20} strokeWidth={1.2} />
                            {count > 0 && (
                                <span
                                    className="absolute -top-2 -right-3 text-[10px] bg-gold text-ink font-medium rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1"
                                    data-testid="cart-count"
                                >
                                    {count}
                                </span>
                            )}
                        </Link>
                        <button
                            className="md:hidden text-white/80 hover:text-gold"
                            onClick={() => setOpen((v) => !v)}
                            aria-label="Menu"
                            data-testid="mobile-menu-toggle"
                        >
                            {open ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-ink border-t border-gold/10 px-6 py-6 space-y-5" data-testid="mobile-menu">
                    {NAV.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            onClick={() => setOpen(false)}
                            className="block text-sm uppercase tracking-luxe text-white/80 hover:text-gold"
                        >
                            {n.label}
                        </NavLink>
                    ))}
                    <NavLink
                        to="/admin/login"
                        onClick={() => setOpen(false)}
                        className="block text-sm uppercase tracking-luxe text-white/80 hover:text-gold"
                    >
                        Admin
                    </NavLink>
                </div>
            )}
        </header>
    );
}

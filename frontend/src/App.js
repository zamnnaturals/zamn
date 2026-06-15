import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Outlet } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";

import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProtectedRoute from "@/components/site/ProtectedRoute";

import Home from "@/pages/Home";
import Category from "@/pages/Category";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Journal from "@/pages/Journal";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerSignup from "@/pages/CustomerSignup";
import Account from "@/pages/Account";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

function PublicLayout() {
    return (
        <>
            <Header />
            <Outlet />
            <Footer />
        </>
    );
}

export default function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <SettingsProvider>
                    <ContentProvider>
                        <AuthProvider>
                            <CustomerAuthProvider>
                                <CartProvider>
                                    <ScrollToTop />
                                    <Routes>
                                        <Route element={<PublicLayout />}>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/shop/:section" element={<Category />} />
                                            <Route path="/shop/:section/:subsection" element={<Category />} />
                                            <Route path="/product/:slug" element={<ProductDetail />} />
                                            <Route path="/cart" element={<Cart />} />
                                            <Route path="/checkout" element={<Checkout />} />
                                            <Route path="/journal" element={<Journal />} />
                                            <Route path="/login" element={<CustomerLogin />} />
                                            <Route path="/signup" element={<CustomerSignup />} />
                                            <Route path="/account" element={<Account />} />
                                        </Route>
                                        <Route path="/admin/login" element={<AdminLogin />} />
                                        <Route path="/admin/*" element={
                                            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                                        } />
                                    </Routes>
                                    <Toaster theme="dark" position="bottom-right"
                                        toastOptions={{
                                            style: {
                                                background: "#0d0d0d",
                                                border: "1px solid rgba(212, 175, 55, 0.3)",
                                                color: "#fff",
                                            },
                                        }}
                                    />
                                </CartProvider>
                            </CustomerAuthProvider>
                        </AuthProvider>
                    </ContentProvider>
                </SettingsProvider>
            </BrowserRouter>
        </div>
    );
}

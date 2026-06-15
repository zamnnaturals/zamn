import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function Footer() {
    const { settings } = useSettings();
    const s = settings || {};
    const contact = s.contact || {};
    const social = s.social || {};

    const whatsappHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : "#";

    return (
        <footer className="relative bg-ink border-t border-gold/20 mt-32" data-testid="site-footer">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-2">
                    <div className="font-serif text-3xl text-gold tracking-wider mb-4">
                        {s.brand_name || "Zamn Naturals"}
                    </div>
                    <p className="text-white/60 text-sm font-light max-w-md leading-relaxed">
                        Crafted with sun-kissed botanicals and ancient herbal wisdom. Pure, chemical-free
                        beauty for every age, every skin, every story.
                    </p>
                    <div className="mt-8 flex items-center gap-5">
                        {social.instagram && (
                            <a href={social.instagram} target="_blank" rel="noreferrer" className="text-white/60 hover:text-gold" data-testid="social-instagram">
                                <Instagram size={18} strokeWidth={1.2} />
                            </a>
                        )}
                        {social.facebook && (
                            <a href={social.facebook} target="_blank" rel="noreferrer" className="text-white/60 hover:text-gold" data-testid="social-facebook">
                                <Facebook size={18} strokeWidth={1.2} />
                            </a>
                        )}
                        {social.youtube && (
                            <a href={social.youtube} target="_blank" rel="noreferrer" className="text-white/60 hover:text-gold" data-testid="social-youtube">
                                <Youtube size={18} strokeWidth={1.2} />
                            </a>
                        )}
                    </div>
                </div>

                <div>
                    <div className="text-gold font-serif text-xl mb-6">Shop</div>
                    <ul className="space-y-3 text-sm text-white/60 font-light">
                        <li><Link to="/shop/women" className="hover:text-gold">Women</Link></li>
                        <li><Link to="/shop/men" className="hover:text-gold">Men</Link></li>
                        <li><Link to="/shop/kids" className="hover:text-gold">Kids</Link></li>
                        <li><Link to="/shop/women/skincare" className="hover:text-gold">All Skincare</Link></li>
                        <li><Link to="/shop/women/cosmetics" className="hover:text-gold">All Cosmetics</Link></li>
                    </ul>
                </div>

                <div>
                    <div className="text-gold font-serif text-xl mb-6">Get in Touch</div>
                    <ul className="space-y-4 text-sm text-white/60 font-light">
                        {contact.whatsapp && (
                            <li className="flex items-start gap-3">
                                <MessageCircle size={16} className="text-gold mt-0.5" strokeWidth={1.2} />
                                <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-gold" data-testid="footer-whatsapp">
                                    {contact.whatsapp}
                                </a>
                            </li>
                        )}
                        {contact.phone && (
                            <li className="flex items-start gap-3">
                                <Phone size={16} className="text-gold mt-0.5" strokeWidth={1.2} />
                                <a href={`tel:${contact.phone}`} className="hover:text-gold" data-testid="footer-phone">{contact.phone}</a>
                            </li>
                        )}
                        {contact.email && (
                            <li className="flex items-start gap-3">
                                <Mail size={16} className="text-gold mt-0.5" strokeWidth={1.2} />
                                <a href={`mailto:${contact.email}`} className="hover:text-gold" data-testid="footer-email">{contact.email}</a>
                            </li>
                        )}
                        {contact.address && (
                            <li className="flex items-start gap-3">
                                <MapPin size={16} className="text-gold mt-0.5" strokeWidth={1.2} />
                                <span>{contact.address}</span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="border-t border-gold/10">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40 font-light">
                    <p>© {new Date().getFullYear()} {s.brand_name || "Zamn Naturals"}. All rights reserved.</p>
                    <p className="uppercase tracking-luxe">Crafted with botanicals · Made for everyone</p>
                </div>
            </div>
        </footer>
    );
}

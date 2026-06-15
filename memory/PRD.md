# Zamn Naturals — Product Requirements Document

## Original Problem Statement
Create a modern, luxury, responsive eCommerce website for a herbal skincare and cosmetics brand. The design must look premium, international, and high-end like top skincare brands (Sephora / The Ordinary style). Black 70% / Green 20% / Gold 10% color rule. Three main category cards (Women, Men, Kids) with sub-sections Skin Care and Cosmetics. Admin-editable products, categories, contact info. Image uploads. Fully responsive. Footer with WhatsApp/Phone/Email/Social.

## User Choices (locked in)
- **Brand name**: Zamn Naturals
- **Color palette**: Primary Green #1F4D3A · Background Black #0B0B0B · Accent Gold #D4AF37 · White #FFFFFF · Light Gray #EDEDED
- **Admin auth**: JWT email/password (admin@zamnnaturals.com / ZamnAdmin@2026)
- **Payments**: Modular — COD + WhatsApp enabled by default; EasyPaisa, JazzCash, Stripe present as togglable placeholders to enable when integrated
- **Image upload**: Local-disk uploads under `/app/backend/uploads/` served via `/api/uploads/{file}`
- **Contact details**: Placeholders (editable from Admin → Settings)

## Architecture
- **Backend**: FastAPI + Motor (Mongo) at port 8001. Routes under `/api`.
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn UI + sonner toasts. Cormorant Garamond (serif) + Outfit (sans).
- **DB**: MongoDB. Collections: `users`, `products`, `categories`, `settings`, `orders`.
- **Auth**: bcrypt + PyJWT. httpOnly cookies (samesite=none, secure) + localStorage Bearer fallback.
- **CORS**: `allow_origin_regex=".*"` with credentials, reflects requesting origin.

## Implemented (June 2026)
### Backend
- Auth (login/logout/me/refresh) with JWT and admin seed
- Products CRUD (admin-gated mutations) with slug uniqueness, search, section/sub_section filters, featured flag
- Categories CRUD (admin-gated)
- Settings (brand, contact, social, payment_methods, currency, shipping)
- Orders (public POST with payment-method enforcement, admin GET/PATCH)
- Image upload (multipart, jpg/jpeg/png/webp/gif, 5MB cap)
- Idempotent startup seeding: admin user, 33 categories, 8 demo products, default settings, indexes

### Frontend
- Home: hero with brand name + tagline + Shop Now (green) + Discover (gold), 3 category cards (Women/Men/Kids) with gold border + green hover glow, value strip, featured products, story strip
- Category pages (`/shop/:section[/:subsection]`) with section/sub filters + category chips
- Product detail with image gallery, qty stepper, Add to Cart + WhatsApp Order
- Cart + Checkout (COD + WhatsApp checkout; auto-builds WA message)
- Admin Login + Dashboard (Overview / Products / Categories / Orders / Settings)
- Image upload UI in product form
- Footer with editable contact + social
- Toasts via sonner

## User Personas
- **Customer** (shopper): Browses by Women/Men/Kids → Skin Care or Cosmetics, adds to cart, checks out with COD or WhatsApp.
- **Admin** (boutique owner): Logs in, manages products (CRUD + image upload), categories, orders, and brand/contact/payment settings.

## Backlog / Next Action Items (Prioritized)
### P0 (Next iteration)
- Wire EasyPaisa / JazzCash live payment gateways (currently placeholders, toggleable)
- Verify mobile UX polish on /admin pages
### P1
- Customer accounts (signup, order history)
- Wishlist / Save for later
- Coupon codes
- Email order confirmations (Resend / SendGrid)
- Inventory decrement on order placement
### P2
- Reviews & ratings
- Product variants (size/shade)
- Multi-currency
- Analytics dashboard
- SEO meta tags + sitemap
- PWA install

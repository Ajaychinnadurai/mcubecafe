# Website Prompt — Mcubes Cafe

Copy everything below into your AI coding tool of choice (Claude, v0, Lovable, Cursor, etc.). Fill in the `[bracketed]` placeholders with real details before sending.

---

Design and build a modern, responsive web app for a café called **Mcubes Cafe**, located near Bharathiyar University in Coimbatore, Tamil Nadu, India. This is a full ordering platform, not just a brochure site — customers can browse the menu, add items to a cart, pay online or offline, and receive their bill on WhatsApp. It has two roles: **Admin** and **Customer**.

## Brand & Vibe
- Tone: warm, cozy, welcoming — a neighborhood hangout near a university campus, popular with students and young professionals.
- Color palette: **black and yellow** — black as the dominant background/base (deep charcoal-black for large surfaces, true black for nav/footer), yellow as the high-energy accent (buttons, highlights, prices, icons, hover states). Use a warm mustard-yellow rather than neon for readability, and off-white/cream for body text on dark backgrounds.
- Typography: a bold, friendly sans-serif or rounded display font for headings, clean sans-serif for body text.
- Overall feel: casual, high-contrast, energetic, Instagram-friendly, easy to read on mobile (most visitors will be on their phones).

## Roles & Authentication
- Two **strictly separate** roles: **Admin** (cafe owner/staff) and **Customer**. These must never share a login screen, a UI, or a session in a way that could confuse who's accessing what.
  - **Separate login entry points**: a customer-facing `/login` and a distinct `/admin/login` (clearly labeled, visually distinct — e.g. different heading/branding — so no one accidentally lands on the wrong one).
  - **Separate signup**: only customers can self-register via `/signup`. Admin accounts are never created through the public signup form — they're created via Django admin/management command or by an existing admin inviting a new staff account. This prevents anyone from signing up and granting themselves admin access.
  - **Separate layouts**: Admin has its own dashboard shell/nav (different from the customer-facing site) — an admin should never see the "Add to Cart" storefront as their landing experience, and a customer should never see order-management controls.
  - **Backend enforcement, not just frontend hiding**: every admin API endpoint checks `request.user.role == 'admin'` (or `is_staff`) server-side and returns `403 Forbidden` if not — never rely on hiding a button in the UI as the only protection.
  - After login, redirect based on role: customers → storefront/menu, admins → `/admin-dashboard`. A customer manually typing an admin URL gets redirected out with a clear "not authorized" message, not a blank/broken page.
- **Sign up** (customer only): name, email or phone number, WhatsApp number (required — used later for billing), password. Validate email/phone format, enforce password strength, show inline errors like a professional app (not just browser default validation).
- **Login**: email/phone + password, with "show password" toggle, "Remember me", and a clear error state for wrong credentials (don't reveal whether the email or password was wrong, for security). Show a loading spinner on submit and disable the button to prevent double-submits.
- **Logout**: a clearly visible logout button/menu item (in the navbar for customers, in the dashboard sidebar for admins) that clears the session/token immediately, redirects to the appropriate home (storefront or admin login), and cannot be undone by hitting "back" (protected pages re-check auth on load).
- Use **JWT-based auth** (`djangorestframework-simplejwt`) — access + refresh token pattern, tokens stored in HTTP-only cookies (not localStorage, to avoid XSS risk) or a secure in-memory store on the React side. Include the user's `role` in the token payload/response so the frontend can route correctly immediately after login.
- Route protection: customer-only pages (cart, checkout, order history) require login; admin pages require the role check described above. Unauthenticated users hitting a protected route get redirected to the correct login (customer or admin) with a "please log in to continue" message.
- Password reset flow (email-based "forgot password" link) — at minimum, design the screen and API stub even if actual email sending is a `[TODO: configure SMTP]`.

## Pages / Sections
1. **Hero section**
   - Café name "Mcubes Cafe", a short tagline (e.g. "[Your tagline — e.g. 'Coffee, snacks & good vibes near campus']"), a hero photo of the interior/signature drink, and a primary CTA button ("View Menu" or "Get Directions").
2. **About**
   - Tell the founding story: Mcubes Cafe was started by **three friends** who turned their shared love of coffee (and the "M" in each of their names/nicknames — hence "Mcubes"/M³) into a cafe near Bharathiyar University. [Insert real names/backstory if available]
   - 2–3 sentences on what makes the cafe different (e.g. student-friendly pricing, cozy seating, quick bites) and its location context near the university.
   - Optional: 3 small founder photo cards/avatars with first names and a one-line role each.
3. **Menu — main focus of the app**
   - This is the most important page — give it the most visual real estate, a prominent nav link, and a hero CTA pointing straight to it.
   - Categorized menu (e.g. Coffee & Beverages, Snacks, Desserts, Shakes) with item name, short description, price, and an **"Add to Cart"** button on every item card (with a small quantity stepper once added). [Insert actual menu items and prices]
   - Highlight 2–3 "bestsellers" with a yellow "Bestseller" badge.
   - Category filter tabs (e.g. All / Coffee / Snacks / Desserts) for fast mobile browsing.
   - A persistent floating **cart icon** (yellow badge with item count) visible while scrolling the menu.
4. **Cart & Checkout**
   - Cart page/drawer: list of items with quantity +/- controls, remove button, per-item subtotal, and order total.
   - Checkout: confirm delivery/pickup preference (e.g. dine-in / takeaway), confirm WhatsApp number (pre-filled from profile, editable), then choose a payment method.
5. **Payment**
   - **Online**: 
     - **Stripe** — card payment via Stripe Checkout or Stripe Elements (test mode with `[Stripe publishable/secret keys — TODO: insert your own]`).
     - **UPI** — generate a UPI deep link / QR code (`upi://pay?pa=[cafe-upi-id]&pn=McubesCafe&am={amount}&cu=INR`) that opens the customer's UPI app (GPay/PhonePe/Paytm) directly; show a QR fallback for desktop users.
   - **Offline**: **Cash** — order is placed as "Pending — Pay at Counter"; staff marks it "Paid" from the admin dashboard once cash is received.
   - Order status flow: `Pending Payment → Paid → Preparing → Ready → Completed` (offline cash orders start at `Pending — Pay at Counter` instead of `Pending Payment`).
6. **Bill Generation & WhatsApp Delivery**
   - On successful payment (or on order placement for cash), auto-generate a **PDF/image bill** with: order ID, itemized list, quantities, prices, total, payment method, cafe name/logo, date/time.
   - Automatically send the bill directly to the **customer's WhatsApp number** using the **WhatsApp Business Cloud API (Meta)** or **Twilio's WhatsApp API** — both require a verified business account and API credentials; note this clearly as `[TODO: WhatsApp Business API credentials required — cannot be faked, must be configured by the cafe owner]`.
   - Also show the bill on-screen with a "Download PDF" and "Resend to WhatsApp" button as a fallback in case the automated message fails.
7. **Order History** (Customer)
   - Logged-in customers can view past orders with status and re-download bills.
8. **Admin Dashboard**
   - Manage menu items (add/edit/delete, mark bestseller, toggle availability).
   - View all orders, filter by status/payment method, mark cash orders as "Paid", update order status (Preparing/Ready/Completed).
   - Basic sales overview (today's orders, revenue) — nice-to-have, not required for v1.
9. **Notifications**
   - A **bell icon** in the navbar (customer) and dashboard header (admin), each with its own unread-count badge in yellow.
   - **Customer notifications**: order confirmed, payment received, order status changes (Preparing → Ready → Completed), bill sent to WhatsApp. Clicking a notification jumps to that order in Order History.
   - **Admin notifications**: new order placed, cash payment awaiting confirmation, low-stock/unavailable item flagged (if stock tracking is added later). Clicking jumps to that order in the Admin Dashboard.
   - Notification dropdown: list of recent notifications (read/unread state, timestamp, mark-all-as-read), scrollable, closes when clicking outside.
   - Implementation: store notifications in a `Notification` model (`user`, `message`, `type`, `is_read`, `related_order`, `created_at`) and poll `/api/notifications/` every ~15–30 seconds, or use **Django Channels (WebSockets)** for real-time push if the tool supports it — polling is the simpler, safer default to specify if unsure.
   - Notifications are strictly scoped per role: a customer only ever sees their own order notifications; an admin only sees store-wide/operational notifications — never mixed in the same feed.
10. **Gallery**
   - Grid of 6–8 photos: interior, exterior/signage, drinks, food, customers enjoying the space. [Insert real photos]
11. **Reviews / Testimonials**
    - 3–4 short customer quotes with star ratings. [Insert real reviews]
12. **Location & Hours**
    - Embedded Google Map centered on Mcubes Cafe (near Bharathiyar University, Coimbatore, Tamil Nadu 641046).
    - Opening hours table. [Insert actual hours]
    - Address and a "Get Directions" button linking to: https://maps.app.goo.gl/KVJAQkKtorgApioi9
13. **Contact / Footer**
    - Phone number, WhatsApp/Instagram/Facebook links. [Insert actual contact details]
    - Copyright line and social icons.

## Tech stack
- **Frontend:** React (JSX) with plain CSS — component-based structure: `Navbar`, `Hero`, `About`, `Menu`, `Cart`, `Checkout`, `Payment`, `OrderHistory`, `NotificationBell`, `AdminDashboard`, `AdminLogin`, `Gallery`, `Testimonials`, `Location`, `Footer`, `Login`, `Signup`, each with its own `.jsx` and `.css` file.
  - `AdminDashboard` and its sub-components live in their own folder/route tree, separate from the customer-facing components, so the two experiences can never accidentally render inside one another.
  - Global cart state via React Context (or Redux if the tool prefers) so cart persists across page navigation within a session. Auth context also exposes `role` so components can branch UI safely.
- **Backend:** Django + Django REST Framework.
  - **Models:** `User` (custom user model with `role` = admin/customer and `whatsapp_number`), `MenuCategory`, `MenuItem` (name, description, price, category, is_bestseller, is_available, image), `Order` (user, items, total, status, payment_method, created_at), `OrderItem` (order, menu_item, quantity, price_at_order), `Payment` (order, method, status, stripe_payment_id/upi_ref, paid_at), `Notification` (user, message, type, is_read, related_order, created_at), `Testimonial`, `GalleryImage`.
  - **Auth:** `djangorestframework-simplejwt` for JWT login/signup/logout/refresh. A custom permission class (e.g. `IsAdminRole`) applied to every admin-only view/viewset — role checks live in the backend, not just the React routing.
  - **Payments:** `stripe` Python SDK for Stripe integration; custom UPI deep-link generator (no SDK needed for basic UPI links).
  - **Billing/WhatsApp:** `reportlab` or `weasyprint` to generate PDF bills; `requests` to call the WhatsApp Business Cloud API (or `twilio` SDK if using Twilio) to send the bill.
  - **Endpoints (example):** `/api/auth/signup/` (customer only), `/api/auth/login/`, `/api/auth/admin-login/`, `/api/auth/logout/`, `/api/menu/`, `/api/cart/`, `/api/orders/`, `/api/orders/{id}/pay/stripe/`, `/api/orders/{id}/pay/upi/`, `/api/orders/{id}/pay/cash/`, `/api/orders/{id}/bill/`, `/api/notifications/`, `/api/admin/orders/` (admin-only), `/api/admin/menu/` (admin-only).
  - Django admin (`/admin/`) enabled as a secondary/backup management tool alongside the custom Admin Dashboard.
- CORS configured (`django-cors-headers`) to allow the React dev server to call the API locally.
- Environment variables for all secrets (Stripe keys, UPI ID, WhatsApp API tokens, Django secret key) — never hardcoded; provide a `.env.example` file.

## General requirements
- Fully responsive (mobile-first — most visitors and orders will come from phones).
- Sticky top nav bar (black background, yellow logo/text) with menu links, cart icon, and login/logout/profile state shown clearly depending on auth status.
- Subtle scroll-in animations for marketing sections (Hero, About, Gallery); keep cart/checkout/payment flows fast and animation-light for usability.
- Accessible: proper alt text on images, sufficient contrast (test yellow-on-black and black-on-yellow combinations), semantic HTML, keyboard-navigable forms.
- Loading and error states on every async action (login, add to cart, payment, bill send) — professional apps always show spinners/toasts, never a silent freeze.
- **Login/logout must be fully functional, not placeholder UI**: real session/token creation on login, real token invalidation on logout, and a persisted session (e.g. via refresh token) so a page refresh doesn't silently log the user out.
- **Notification bell must be functional, not decorative**: real unread-count badge driven by actual data from `/api/notifications/`, updates when new events happen (new order, status change), and marks items read on open/click — not a static icon.
- Test both roles end-to-end before calling it done: sign up as a customer → place an order → confirm the right notifications and dashboard views appear only where they should; separately log in as admin → confirm the customer storefront is not what they land on and customer-only data isn't exposed.
- Use placeholder images and sample menu/order data (clearly labeled) wherever real content isn't provided yet, so the app can be previewed immediately, then swapped for real data via the Django admin or Admin Dashboard.

## Deliverable
A React (JSX + CSS) frontend connected to a Django + Django REST Framework backend, structured as two folders (`frontend/` and `backend/`), implementing auth (signup/login/logout, admin vs customer roles), the full menu-to-cart-to-payment-to-WhatsApp-bill flow, and the marketing sections above — seeded with placeholder data, and ready to run locally (`npm start` for frontend, `python manage.py runserver` for backend). Clearly flag every piece that needs real credentials (Stripe keys, UPI ID, WhatsApp Business API token) as a `[TODO]` rather than faking it.

# UGWAD — Buri Weavers Association of Anini-y, Antique

A cultural heritage and e-commerce web application built to preserve, showcase, and support the handwoven **buri palm crafts** of the **Buri Weavers Association** in **San Francisco, Anini-y, Antique**.

## Live Website
- **Production URL:** [https://vercel.app](https://vercel.app)

## Features & Pages
1. **Home (`index.html`):** Hero showcase of Anini-y buri weaving heritage, featured crafts, and association highlights.
2. **About (`about.html`):** History of buri palm weaving in Barangay San Francisco, Anini-y, Antique, and artisan community background.
3. **Learn to Weave (`learn.html`):** Step-by-step traditional buri leaf harvesting, stripping, dyeing, and hand-plaiting guide.
4. **Shop (`shop.html`):** Interactive product catalog connected to Supabase with category filtering, search, and passcode-protected artisan product management (`Create`, `Update`, `Delete`).
5. **Checkout & Reviews (`checkout.html`):** Order placement with pickup/shipping calculation, Messenger confirmation handoff, and verified buyer product reviews.
6. **My Orders (`my-orders.html`):** Real-time customer order tracking and status management (`Pending`, `Confirmed`, `Completed`, `Cancelled`).

## Tech Stack
- **Frontend:** HTML5, CSS3 (Custom Responsive Design), Vanilla JavaScript (ES6+)
- **Backend & Database:** Supabase (PostgreSQL REST API with `products`, `orders`, and `reviews` tables)
- **Hosting:** Vercel (Continuous Deployment via GitHub)

## Local Setup Instructions
1. Clone this repository:
   ```bash
   git clone https://github.com<your-username>/ugwad-website.git
   ```
2. Open `js/config.js` and ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `ORG_PASSCODE` are configured.
3. Serve the folder using VS Code **Live Server** (or any local HTTP server) and open `index.html`.




## Cultural & Historical Credits
- **Buri Weavers Association** — Barangay San Francisco, Anini-y, Antique
- **National Commission for Culture and the Arts (NCCA)** — Philippine Intangible Cultural Heritage Documentation
- **Department of Trade and Industry (DTI) Antique** — Handloom & Buri Craft Livelihood Profiles

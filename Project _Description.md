Here is the candid truth about the architecture: **I strongly recommend against a full Microservices Architecture for this stage of your product.** For a $7,500 MVP, orchestrating 10+ microservices introduces massive operational overhead, complex debugging, and unnecessary cloud costs. The industry standard for an early-stage product in 2026 is a **Modular Monolith**. This means you build a single, highly organized FastAPI backend where domains (Users, AI Try-On, E-commerce, Booking) are separated into strict modules. It gives you the speed and cost-efficiency of a monolith now, but allows you to easily break it apart into microservices later when your user base actually demands independent scaling.

As for the **E-commerce feature**: Yes, the foundation is absolutely there. The UI designs feature "Smart Shopping" and "Beauty Products For You." To make it fully functional for your coder, I have explicitly added `products`, `orders`, and `cart` schemas to the database structure below.

Here is the complete, tailored prompt document. You can copy and paste this directly into Cursor, GitHub Copilot, or whichever AI coding assistant you are using.

---

# System Architecture & Development Prompt: Face Blueprint Pro (GlowMap)

## 1. Project Context & Goals

**Project Name:** Face Blueprint Pro (Client-facing app branded as "GlowUp")
**Objective:** Build a dual-sided platform (B2B/B2C) for the beauty industry. The system allows clients to generate AI-powered makeup previews (Selfie Try-On) and allows makeup artists to track appointments, manage kit inventory, and calculate per-client Cost of Goods Sold (COGS).
**Constraints:** The system must be highly optimized (targeting < 12ms latency for core database CRUD operations) and the architectural scope must strictly align with a $7,500 total project budget.

## 2. Tech Stack Definition

* **Mobile Frontend:** React Native (Expo) - For both Client and Artist portals.
* **Web Admin:** React.js - For administrative dashboards.
* **Backend API:** FastAPI (Python) - Utilizing a Modular Monolith architecture.
* **Database:** PostgreSQL.
* **AI Orchestration:** n8n (Serverless/Cloud-GPU integration for Stable Diffusion + ControlNet).
* **Payments/E-commerce:** Stripe or Paystack API integration.

## 3. UI/UX Design System (The "Lumen" Aesthetic)

The frontend must completely avoid standard templates and WebGL 3D meshes. Implement a high-end, clinical, and data-driven 2D aesthetic:

* **Color Palette:** Sterile off-whites and cool grays for the background. Vibrant Orange is reserved strictly for active states, CTAs, and primary data visualization.
* **Components:** Extensive use of "Glassmorphism" (semi-transparent, frosted cards with subtle background blur and soft drop shadows).
* **Data Visualization:** Use modular pill widgets, radial gauges, and circular progress bars to display health metrics (e.g., "Skin Health Score", "Acne 37%").
* **Interactive Onboarding (Smart Reticle):** Do not use standard survey lists for dermatological profiling. Implement a 2D interactive system where users tap a 2D portrait to drop a "Smart Reticle" (a glowing targeting ring), which expands into a frosted glass card to select specific concerns (Dryness, Breakouts) in that zone.

## 4. Database Schema (PostgreSQL)

Implement the following relational structure using SQLAlchemy or SQLModel:

**Core Entities:**

* `users`: `id` (UUID), `role` (ENUM: client, artist, admin), `full_name`, `email`, `skin_profile_json` (Stores 6-tier tone, type, sensitivity).
* `appointments`: `id`, `artist_id`, `client_id`, `scheduled_time`, `blueprint_image_url`, `status`, `calculated_cogs`.
* `artist_kits`: `id`, `artist_id`, `product_id`, `current_volume_ml`, `purchase_price`.
* `appointment_products_used`: `id`, `appointment_id`, `kit_id`, `volume_used_ml`.

**E-Commerce Entities:**

* `products`: `id`, `brand`, `name`, `health_score`, `price`, `ingredients_json`, `is_toxin_free` (Boolean).
* `orders`: `id`, `client_id`, `total_amount`, `status`, `created_at`.
* `order_items`: `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase`.

## 5. Core Workflows to Implement

### A. The AI Try-On Pipeline (Asynchronous)

1. **Trigger:** React Native client finalizes a makeup look selection and takes a selfie.
2. **API Handler:** FastAPI receives the image payload and pushes a webhook to n8n. FastAPI immediately returns a `202 Accepted` status to the client to prevent blocking.
3. **Client UX:** The app transitions to a "Scanning" animation (highlighting facial alpha masks), followed by a 5-minute wait screen that redirects the user to the "Score My Products" e-commerce view.
4. **n8n Execution:** n8n handles FaceParsing, Prompt Assembly, and Stable Diffusion inference, storing the result in AWS S3.
5. **Webhook Return:** n8n sends the S3 URL back to a FastAPI endpoint.
6. **Notification:** FastAPI updates the `appointments` table and triggers a push notification to the client and the artist.

### B. The Artist COGS Workflow

1. After an appointment, the artist opens the Kit Tracker view.
2. The UI displays the specific products linked to the client's `blueprint_image_url`.
3. The artist inputs the volume used (e.g., "2 pumps of MAC Foundation").
4. FastAPI deducts the `current_volume_ml` in `artist_kits` and dynamically updates the `calculated_cogs` for that specific appointment.

## 6. Initial Execution Steps for the AI

1. Initialize the React Native Expo project and configure the global styling variables (Colors, Glassmorphism utilities).
2. Initialize the FastAPI project, set up the Modular Monolith folder structure (routers grouped by domain), and configure the PostgreSQL connection.
3. Generate the SQLAlchemy models for the Core and E-commerce entities defined above.
4. Build the interactive "Smart Reticle" 2D onboarding flow in React Native.
# 🏗️ Architecture & Project Structure

This document provides a technical overview of the **SUI Shopping Cart** codebase, explaining the directory structure, key components, and data flow.

---

## 📂 Directory Structure

The project is organized into two primary separate workspaces: `contracts` (Blockchain) and `web` (Frontend/Backend).

```
SUI_Shopping_Cart/
├── contracts/                  # Sui Move Smart Contracts
│   ├── sources/                # Source code (.move files)
│   │   ├── marketplace.move    # Main marketplace logic (Listings, Sales)
│   │   ├── product.move        # Product NFT definition & Logic
│   │   └── shop.move           # Shop object definition
│   └── Move.toml               # Package manifest and dependencies
│
├── web/                        # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/                # App Router (Pages & API)
│   │   │   ├── api/            # Server-side API Routes (Secure DB access)
│   │   │   ├── shop/           # Public Shop Pages
│   │   │   └── dashboard/      # Seller/Admin Dashboard Pages
│   │   ├── components/         # Reusable React Components
│   │   │   ├── ui/             # Shadcn/Radix UI Primitives (Button, refined inputs)
│   │   │   └── ...             # Feature components (CartDrawer, ShopCard)
│   │   ├── hooks/              # Custom React Hooks (Logic Layer)
│   │   ├── services/           # Supabase & External Service Integrations
│   │   └── lib/                # Utilities (Classes, Formatters)
│   └── supabase/               # Database Migrations & Snapshots
│
├── LICENSE
└── README.md
```

---

## 🔧 Core Components

### 1. Smart Contracts (`contracts/`)
The **Source of Truth** for assets.
*   **Marketplace**: A Shared Object acting as the central registry.
*   **Shops**: Owned Objects (or Shared) representing a seller's store.
*   **Products**: Can be **Retail Mode** (Shared Objects with stock counters) or **Unique Mode** (Kiosk-wrapped NFTs).

### 2. Frontend Services (`web/src/services/`)
These modules handle data fetching and mutation, bridging the gap between the UI and Supabase.
*   `shop.service.ts`: Fetches shop profiles, manages shop creation.
*   `order.service.ts`: Handles order creation, status updates, and history fetching.
*   `search.service.ts`: Powers the search functionality using Supabase text search.
*   `addresses.service.ts`: Manages user shipping addresses.

### 3. Custom Hooks (`web/src/hooks/`)
Encapsulates complex logic, especially for Blockchain interactions.
*   `useCheckout.tsx`: Orchestrates the complex checkout flow (Product locking -> Payment -> Receipt minting).
*   `useKiosk.tsx`: Manages interactions with Sui Kiosk (Listing, Delisting, Buying).
*   `useRetail.tsx`: Handles high-concurrency buying logic for Shared Objects.
*   `useProducts.tsx`: CRUD operations for products (Syncs Chain <-> DB).
*   `useCart.tsx`: Local shopping cart state management (Zustand/Context).

---

## 🔄 Data Architecture

### Hybrid Data Model
We use a **Hybrid Approach** to balance security and speed.

1.  **On-Chain Data (Sui)**:
    *   Asset Ownership (Who owns what NFT).
    *   Product Stock (For Shared Objects).
    *   Payment Rules (Prices, Fees).
    *   *Why?* To ensure trustless transactions and prevent double-spending.

2.  **Off-Chain Data (Supabase)**:
    *   Product Metadata (Images, Long Descriptions, Tags).
    *   User Profiles (Addresses, Settings).
    *   Order History (Indexing past events for UI display).
    *   *Why?* For instant query speed and complex filtering (Search by price range, category, etc.) which is expensive on-chain.

### Synchronization
*   **Write Flow**: User -> Smart Contract -> Indexer/API -> Supabase.
*   **Read Flow**: User -> Supabase (Primary) -> Smart Contract (Verify Stock/Price before buy).

---

## 🔐 Security

*   **Row Level Security (RLS)**: Enabled on Supabase to prevent unauthorized data access.
*   **Service Role Key**: Only used in server-side API routes (`src/app/api/`), never exposed to the client.
*   **Move Capabilities**: Contract logic uses strict Capability patterns to ensure only shop owners can edit their stock.

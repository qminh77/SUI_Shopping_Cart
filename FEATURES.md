# 🌟 Features & Technology Stack

This document provides a comprehensive overview of the functional capabilities and the engineering stack behind the **SUI Shopping Cart Platform**.

---

## 🛠️ Technology Stack

We utilize a cutting-edge stack designed for high performance, scalability, and security.

### 🌐 Frontend (Web Application)
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router) - The latest standard for React applications.
*   **Library**: [React 19](https://react.dev/) - Utilizing the newest hooks and concurrent features.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS for rapid UI development.
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) (Primitives) & [Shadcn/UI](https://ui.shadcn.com/) - Accessible, professional component library.
*   **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, consistent icons.
*   **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query) - Robust server state management.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) - Professional grade animations.
*   **Sui Integration**: [@mysten/dapp-kit](https://sdk.mysten.io/dapp-kit) & [@mysten/sui](https://sdk.mysten.io/typescript) - Official TS SDKs.

### ⛓️ Blockchain (Smart Contracts)
*   **Language**: [Sui Move](https://docs.sui.io/concepts/sui-move-concepts) - Safe and expressive smart contract language.
*   **Architecture**:
    *   **Shared Objects**: Used for "Retail Mode" products to allow high-concurrency global access (millions of buyers at once).
    *   **Kiosk**: Used for unique NFT assets and strict transfer policies.
    *   **Dynamic Fields**: For extensible storage and metadata management.

### 🗄️ Backend & Database
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL) - Relational database for indexing on-chain data and managing off-chain user metadata (Orders, Reviews, Shipping).
*   **API**: Next.js API Routes - Secure server-side logic hiding sensitive keys (`service_role`).

---

## 🧩 Functional Modules

### 👤 Customer Experience
*   **Shop & Browse**: Advanced search and filtering by category, price, and shop.
*   **Cart System**:
    *   **Hybrid Cart**: Add items from multiple sellers into a single cart.
    *   **Atomic Checkout**: Purchase multiple items from different sellers in one single blockchain transaction.
*   **Order Tracking**: Real-time status updates (`Pending` → `Confirmed` → `Shipping` → `Delivered`).
*   **Address Management**: Save and manage multiple shipping addresses with Vietnam Province/City API integration.

### 🏪 Seller Dashboard
*   **Shop Creation**: Register a brand new shop on the Sui Blockchain (minting a Shop Object).
*   **Product Management**:
    *   **Create Products**: List items with name, description, price, and stock.
    *   **Sync to Chain**: Ensure local database products are minted as on-chain assets.
*   **Order Fulfillment**: View incoming orders, update shipping status, and manage inventory.
*   **Earnings**: Track sales and revenue (SUI tokens).

### ⚙️ System Features
*   **Inventory Synchronization**: Smart contracts maintain the "Source of Truth" for stock. If the contract says 0 stock, no purchase can happen, preventing overselling.
*   **Receipt NFTs**: Every successful purchase mints a permanent "Receipt" NFT sent to the buyer's wallet as proof of purchase and ownership.
*   **Audit Trail**: Full transparency of all transactions on the Sui Explorer.

---

## 🔬 Core Concepts

### Retail Mode (High Concurrency)
Traditional blockchains struggle with "hotspots" where everyone tries to buy the same item at once. We solve this using **Sui Shared Objects**. A Product object is shared, allowing multiple users to interact with it simultaneously to decrement stock. This enables the platform to scale to Amazon-level traffic.

### Kiosk Standard
For unique items or those requiring strict royalty enforcement, we utilize the **Sui Kiosk** standard. This locks items in a secure "storefront" that enforces transfer rules (e.g., royalties must be paid on secondary sales).


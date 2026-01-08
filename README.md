# 🛍️ SUI E-Commerce - Shopee-like Decentralized Marketplace

> **The Future of Retail on Blockchain**
>
> A hybrid marketplace combining the **Security of Sui Move** with the **Speed of Web2**.
> Features "Retail Mode" for high-volume sales (Shared Objects) and distinct NFT ownership (Kiosk).

![Project Status](https://img.shields.io/badge/Status-Active_Development-green?style=for-the-badge&logo=statuspage)
![Network](https://img.shields.io/badge/Network-Sui_Testnet-blue?style=for-the-badge&logo=sui)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

## 🌟 Key Features

### 🛒 Shopee-like Retail Mode (New!)
- **Shared Object Products**: Enables high-concurrency buying (millions of users can buy simultaneously).
- **Hybrid Cart**: Buy 10 items from 10 different sellers in **ONE transaction**.
- **Instant Checkout**: Sign once, system splits payments and orders automatically.

### 📦 Order Management
- **Buyer History**: Track orders (`Pending` -> `Shipping` -> `Delivered`) just like Shopee.
- **Seller Dashboard**: Manage incoming orders and update shipping status.
- **Receipt NFTs**: Every purchase mints a permanent on-chain Receipt for warranty/proof.

### 🛡️ Decentralized & Trustless
- **On-chain Inventory**: Stock is managed by Move contracts, impossible to oversell.
- **Atomic Swap**: Payment and Stock deduction happen simultaneously. No "pay but didn't get item".

---

## 🚀 Installation Guide (Sequential)

Follow these steps strictly to set up the complete environment.

### Prerequisites
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Sui CLI** installed and configured for Testnet ([Guide](https://docs.sui.io/guides/developer/getting-started/sui-install))
- **Supabase Account** for database ([Sign up](https://supabase.com/))

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/qminh77/SUI_Shopping_Cart.git
cd SUI_Shopping_Cart

# Install Database/Backend deps (if any) or just Frontend
cd web
npm install
```

### Step 2: Smart Contracts Deployment (Sui Move)

1. Navigate to contracts folder:
   ```bash
   cd ../contracts
   ```
2. Switch to Testnet (if not already):
   ```bash
   sui client switch --env testnet
   ```
3. Build and Publish:
   ```bash
   sui move build
   sui client publish --gas-budget 100000000
   ```
4. **IMPORTANT**: Note down the following IDs from the output:
   - **Package ID** (The first Immutable object created)
   - **Marketplace Object ID** (Shared Object `Marketplace`)
   - **TransferPolicy Object ID** (Shared Object `TransferPolicy`)

### Step 3: Database Setup (Supabase)

1. Create a new Supabase Project.
2. Go to **SQL Editor** in Supabase Dashboard.
3. Run the following SQL scripts in order (Found in `web/supabase/migrations/`):

   **a. Create Shop Tables (`001_shops_schema.sql`)**
   ```sql
   -- (Copy content from file or run this)
   create table shops ( ... );
   ```

   **b. Create Order Tables (`20260109000000_create_orders.sql`)**
   ```sql
   -- Creates orders, order_items and enums
   CREATE TYPE order_status AS ENUM ...
   CREATE TABLE orders ( ... );
   CREATE TABLE order_items ( ... );
   ```

4. Go to **Project Settings -> API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 4: Environment Configuration

1. In `web` directory, rename `.env.local.example` to `.env.local`.
2. Fill in the keys:

   ```bash
   # SUI CONFIG
   NEXT_PUBLIC_PACKAGE_ID=0x... (From Step 2)
   NEXT_PUBLIC_MARKETPLACE_ID=0x... (From Step 2)
   NEXT_PUBLIC_TRANSFER_POLICY_ID=0x... (From Step 2)

   # SUPABASE CONFIG (From Step 3)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (Secret key, keep safe!)
   ```

### Step 5: Start the App

```bash
npm run dev
```

Open `http://localhost:3000` and start shopping! 🛍️

---

## 🏗️ Architecture Overview

| Component | Tech Stack | Role |
|-----------|------------|------|
| **Smart Contracts** | Sui Move | Manages Assets (NFTs), Payment Splitting, Stock Logic, Receipts. |
| **Frontend** | Next.js 14, React Query | User Interface, Wallet Connection (dApp Kit). |
| **Backend** | Next.js API Routes | Handles secure Database interactions, hiding Service Role key. |
| **Database** | Supabase (PostgreSQL) | Stores "Web2 Data": Order History, Shipping Info, Shop Profiles. |

## 📂 Project Structure

```
.
├── contracts/          # Sui Move Smart Contracts
│   ├── sources/        # Move Source Code (product.move, purchase.move...)
│   └── Move.toml       # Manifest
├── web/                # Next.js Frontend
│   ├── src/
│   │   ├── app/        # Pages & API Routes
│   │   ├── components/ # React Components (CartDrawer, ProductCard...)
│   │   ├── hooks/      # Custom Hooks (useCheckout, useRetail...)
│   │   └── services/   # Supabase Logic
│   └── supabase/       # SQL Migrations
└── README.md           # You are here
```

## 🤝 Contributing

Pull Requests are welcome! Please create a new branch for your feature.

## 📄 License

MIT

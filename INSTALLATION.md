# 💻 Installation & Setup Guide

This guide details the process to set up the **SUI Shopping Cart** development environment from scratch.

---

## ✅ Prerequisites

Ensure you have the following installed on your machine:

1.  **Node.js**: v18.0.0 or higher.
    *   *Verify*: `node -v`
2.  **Sui Binaries**: Installed and configured.
    *   *Docs*: [Install Sui](https://docs.sui.io/guides/developer/getting-started/sui-install)
    *   *Verify*: `sui --version`
3.  **Git**: For version control.
    *   *Verify*: `git --version`
4.  **Supabase Account**: A free account at [supabase.com](https://supabase.com).

---

## 🛠️ Step 1: Clone the Repository

```bash
git clone https://github.com/qminh77/SUI_Shopping_Cart.git
cd SUI_Shopping_Cart
```

---

## 🧠 Step 2: Deploy Smart Contracts

The frontend requires the Smart Contract Package ID and Shared Object IDs to function.

1.  **Navigate to the contracts directory:**
    ```bash
    cd contracts
    ```

2.  **Switch to Sui Testnet:**
    ```bash
    sui client switch --env testnet
    # If testnet is not added:
    # sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
    ```

3.  **Get Testnet SUI Coins:**
    *   Join the [Sui Discord](https://discord.gg/sui) and request tokens in `#testnet-faucet`.
    *   Or run: `sui client faucet` (may not always work).

4.  **Build and Publish:**
    ```bash
    sui move build
    sui client publish --gas-budget 100000000 --skip-dependency-verification
    ```

5.  **📝 CRITICAL: Save the Output IDs**
    Look for the `Transaction Effects` -> `Created Objects` or `Published` section in the terminal output. You need to find and save:

    *   **Package ID**: The ID of the published package (Type: `Immutable`).
    *   **Marketplace ID**: Look for the object with type `...::marketplace::Marketplace` (Type: `Shared`).
    *   **TransferPolicy ID**: Look for the object with type `0x2::transfer_policy::TransferPolicy` (Type: `Shared`).

---

## 🗄️ Step 3: Database Setup (Supabase)

1.  **Create a Project**: Go to Supabase and create a new project.
2.  **SQL Migrations**:
    *   Navigate to the `SQL Editor` in Supabase.
    *   Open the `/web/supabase/migrations/` folder in this repo.
    *   Copy and run the contents of the SQL files in the following order:
        1.  `001_shops_schema.sql` (or similar initial schema)
        2.  `..._create_orders.sql` (Order tables)
        3.  Any other `.sql` migration files present.
3.  **Get API Keys**:
    *   Go to **Project Settings** -> **API**.
    *   Copy **Project URL**, **anon public key**, and **service_role secret key**.

---

## ⚙️ Step 4: Frontend Configuration

1.  **Navigate to the web directory:**
    ```bash
    cd ../web
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    *   Rename `.env.local.example` to `.env.local`.
    *   Open `.env.local` and fill in the values you collected:

    ```env
    # --- SUI Blockchain Configuration ---
    # From Step 2 (Smart Contract Deployment)
    NEXT_PUBLIC_PACKAGE_ID=0x...
    NEXT_PUBLIC_MARKETPLACE_ID=0x...
    NEXT_PUBLIC_TRANSFER_POLICY_ID=0x...
    NEXT_PUBLIC_SUI_NETWORK=testnet

    # --- Supabase Configuration ---
    # From Step 3 (Supabase Settings)
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    SUPABASE_SERVICE_ROLE_KEY=eyJ...
    ```

---

## 🚀 Step 5: Run the Application

```bash
npm run dev
```

Open your browser and visit **http://localhost:3000**.

> **Note**: If you encounter errors, check the browser console and terminal for logs. Ensure your specific wallet is connected to the **Sui Testnet**.


# 🛍️ Sui Shopping Cart - Decentralized E-E-commerce Platform

A modern, decentralized e-commerce platform built on the **Sui Network**, combining the power of blockchain ownership with a Web2-like user experience.

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Sui Network](https://img.shields.io/badge/Network-Sui_Testnet-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

## 🌟 Overview

Sui Shopping Cart allows users to create decentralized shops, list products as NFTs, and trade directly using Sui Kiosks. It bridges the gap between traditional e-commerce and Web3 by offering a seamless experience for both buyers and sellers.

### ✨ Key Features

- **Store Management**: Create and manage your own on-chain shop.
- **Product as NFT**: Every product is a unique NFT on the Sui blockchain.
- **Sui Kiosk Integration**: Secure, decentralized trading with royalty enforcement.
- **Dual-Layer Data**: Combines **Sui Move** (On-chain trust) with **Supabase** (Off-chain rich metadata).
- **Web3 Payments**: Instant settlements using SUI tokens.
- **Responsive UI**: Modern interface with specific views for Admin, Sellers, and Buyers.

---

## 🛠️ Technology Stack

### 🔗 Blockchain (Contracts)
- **Language**: [Move](https://github.com/move-language/move)
- **Network**: Sui Testnet
- **Key Modules**:
  - `shop.move`: Shop creation and management.
  - `product.move`: Product NFT minting and logic.
  - `purchase.move`: Transaction handling via Kiosk.
  - `receipt.move`: Proof of purchase generation.

### 💻 Frontend (Web)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Blockchain Interaction**: `@mysten/dapp-kit`, `@mysten/kiosk`
- **State Management**: `TanStack Query`
- **3D Graphics**: `Three.js` / `@react-three/fiber`

### 🗄️ Backend / Database
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth (Wallet-based login)
- **Storage**: Supabase Storage (Product images)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/)
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install) installed
- [Supabase Account](https://supabase.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/qminh77/SUI_Shopping_Cart.git
cd SUI_Shopping_Cart
```

### 2️⃣ Smart Contract Setup

Navigate to the contracts folder and publish the package.

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```
> **Note:** Copy the **Package ID** from the output. You will need this for the frontend configuration.

### 3️⃣ Frontend Setup

Navigate to the web folder and install dependencies.

```bash
cd ../web
npm install
# or
pnpm install
```

### 4️⃣ Environment Configuration

Create a `.env.local` file in the `web` directory and add your keys:

```bash
# SUI Network Values (Obtained after publishing contracts)
NEXT_PUBLIC_PACKAGE_ID=0x...          # Your Contract Package ID
NEXT_PUBLIC_MARKETPLACE_ID=0x...      # Marketplace Shared Object ID
NEXT_PUBLIC_TRANSFER_POLICY_ID=0x...  # Kiosk Transfer Policy ID

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5️⃣ Run the Application

Start the development server:

```bash
npm run dev
# or
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
.
├── contracts/               # Sui Move Smart Contracts
│   ├── sources/             # Move Source Code
│   │   ├── shop.move        # Shop Logic
│   │   ├── product.move     # Product NFT Logic
│   │   ├── purchase.move    # Buying Logic
│   │   └── receipt.move     # Receipt Logic
│   └── Move.toml            # Manifest
│
├── web/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/             # App Router Pages
│   │   ├── components/      # React Components
│   │   ├── hooks/           # Custom Hooks (useShop, useKiosk)
│   │   ├── lib/             # Utilities (Supabase, Sui Client)
│   │   └── services/        # API Services
│   ├── public/              # Static Assets
│   └── package.json
│
└── README.md                # Documentation
```

---

## 🔗 Resources

- [Sui Documentation](https://docs.sui.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Move Language Book](https://move-book.com/)

---

## 🤝 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">Made with ❤️ for the Sui Community</p>

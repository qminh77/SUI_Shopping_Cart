# 🛍️ SUI Shopping Cart (Sui E-commerce Platform)

[![Sui](https://img.shields.io/badge/Sui-Network-blue?style=for-the-badge&logo=sui)](https://sui.io)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **🇺🇸 English** | [🇻🇳 Tiếng Việt](#-giới-thiệu-tiếng-việt)

---

## 🇺🇸 English Introduction

**SUI Shopping Cart** is a decentralized e-commerce marketplace built on the **Sui blockchain**. It leverages the speed and security of Sui Move smart contracts combined with a modern Next.js frontend to provide a seamless Web3 shopping experience.

### ✨ Key Features

- **🛍️ Product as NFT**: Every product listed is a unique NFT on the Sui blockchain, ensuring true ownership and traceability.
- **⚡ Instant Settlement**: Powered by Sui's sub-second finality for lightning-fast transactions.
- **🔐 Secure Payments**: Trustless on-chain payments directly between buyers and sellers.
- **🎨 Modern UI/UX**: Built with **Next.js 15**, **Tailwind CSS**, and **Shadcn UI** for a premium look and feel.
- **👛 Multi-Wallet Support**: Seamless integration with Sui Wallet, Suiet, and Ethos.

### 🛠️ Tech Stack

- **Blockchain**: Sui Move (Smart Contracts)
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucid React
- **Integration**: `@mysten/dapp-kit`, `@mysten/sui`

---

## 🇻🇳 Giới Thiệu (Tiếng Việt)

**SUI Shopping Cart** là một nền tảng thương mại điện tử phi tập trung hiện đại được xây dựng trên **Sui blockchain**. Dự án kết hợp sức mạnh bảo mật của smart contract Sui Move với giao diện người dùng Next.js mượt mà để mang lại trải nghiệm mua sắm Web3 đỉnh cao.

### ✨ Tính Năng Nổi Bật

- **🛍️ Sản phẩm là NFT**: Mỗi sản phẩm được đăng bán là một NFT độc nhất trên Sui blockchain, đảm bảo quyền sở hữu minh bạch.
- **⚡ Xử lý tức thì**: Tận dụng tốc độ xử lý dưới 1 giây của mạng lưới Sui.
- **🔐 Thanh toán an toàn**: Giao dịch trực tiếp on-chain giữa người mua và người bán, không qua trung gian.
- **🎨 Giao diện hiện đại**: Thiết kế đẹp mắt với **Next.js 15**, **Tailwind CSS** và **Shadcn UI**.
- **👛 Hỗ trợ đa ví**: Tích hợp sẵn với Sui Wallet, Suiet, và Ethos.

### 🛠️ Công Nghệ Sử Dụng

- **Blockchain**: Sui Move (Smart Contracts)
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Giao diện**: Tailwind CSS, Shadcn UI, Lucid React
- **Tương tác**: `@mysten/dapp-kit`, `@mysten/sui`

---

## 🚀 Getting Started / Hướng Dẫn Cài Đặt

### Prerequisites / Yêu cầu
- Node.js 18+
- pnpm / npm / yarn
- Sui CLI (for contract deployment)
- Sui Wallet extension

### 1. Clone Repo
```bash
git clone git@github.com:qminh77/SUI_Shopping_Cart.git
cd SUI_Shopping_Cart
```

### 2. Frontend Setup
Navigate to the `web` directory and install dependencies.
*Di chuyển vào thư mục `web` và cài đặt thư viện.*

```bash
cd web
npm install
# or
yarn install
```

Configure environment variables:
*Cấu hình biến môi trường:*

Create `.env.local` in `web/` folder:
```env
NEXT_PUBLIC_PACKAGE_ID=YOUR_DEPLOYED_PACKAGE_ID
```
*(Check `DEPLOYMENT.md` for specific instructions on deploying contracts if needed / Xem `DEPLOYMENT.md` để biết cách deploy contracts)*

### 3. Run Application
Start the development server:
*Chạy ứng dụng:*

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 📂 Project Structure / Cấu Trúc Dự Án

```
SUI_Shopping_Cart/
├── contracts/              # 📦 Sui Move Smart Contracts
│   ├── Move.toml           #    Package Config
│   └── sources/            #    Source Code
│       ├── product.move    #    NFT Logic
│       └── shop.move       #    Marketplace Logic
│
└── web/                    # 🖥️ Next.js Frontend
    ├── src/
    │   ├── app/            #    App Router Pages
    │   ├── components/     #    React Components
    │   └── providers/      #    Sui Providers
    └── package.json
```

---

## 📸 Screenshots

*(Add screenshots of your application here / Thêm ảnh chụp màn hình ứng dụng tại đây)*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
*Hoan nghênh mọi đóng góp! Hãy gửi Pull Request của bạn.*

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

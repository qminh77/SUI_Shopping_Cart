# 🛍️ SUI Shopping Cart - Web3 E-Commerce Platform

[![Sui](https://img.shields.io/badge/Sui-Network-blue?style=for-the-badge&logo=sui)](https://sui.io)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> **Nền tảng thương mại điện tử phi tập trung trên Sui Blockchain**

---

## 📋 MỤC LỤC

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Công Nghệ](#-công-nghệ)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình](#️-cấu-hình)
- [Sử Dụng](#-sử-dụng)
- [Kiến Trúc](#-kiến-trúc)
- [API Documentation](#-api-documentation)
- [Smart Contracts](#-smart-contracts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 GIỚI THIỆU

**SUI Shopping Cart** là một marketplace phi tập trung (decentralized e-commerce) được xây dựng trên **Sui blockchain**, nơi mỗi sản phẩm là một NFT độc nhất với quyền sở hữu minh bạch và giao dịch an toàn.

### Điểm Nổi Bật

- 🛍️ **Product = NFT**: Mỗi sản phẩm là NFT unique on-chain
- ⚡ **Tốc Độ Cao**: Sub-second finality, phí gas cực thấp
- 🔐 **Bảo Mật**: Smart contracts + wallet-based authentication
- 🎨 **UI Hiện Đại**: Cyberpunk Tech design với glassmorphism
- 👨‍💼 **Admin Panel**: Quản lý shops, sellers, audit logs
- 📱 **Responsive**: Hoạt động mượt mà trên mọi thiết bị

---

## ✨ TÍNH NĂNG

### Cho Người Mua (Buyers)
- ✅ Duyệt marketplace với sản phẩm NFT
- ✅ Thêm vào giỏ hàng, thanh toán SUI
- ✅ Nhận NFT ngay lập tức
- ✅ Xem lịch sử giao dịch & receipts

### Cho Người Bán (Sellers)
- ✅ Đăng ký shop với thông tin chi tiết
- ✅ Mint Product NFT
- ✅ List sản phẩm qua Kiosk system
- ✅ Quản lý inventory
- ✅ Nhận thanh toán tự động

### Cho Admin
- ✅ Duyệt/từ chối shop registration
- ✅ Suspend/unsuspend shops
- ✅ Xem audit logs chi tiết
- ✅ Authenticated bằng wallet signature

---

## 🛠️ CÔNG NGHỆ

### Blockchain
- **Sui Move** - Smart contract language
- **Sui Testnet** - Testing network
- **@mysten/dapp-kit** - Wallet integration
- **Kiosk Standard** - NFT marketplace

### Frontend
- **Next.js 15** - React framework (App Router)
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Query** - Server state management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - RESTful API
- **Supabase** - PostgreSQL database
- **JWT** - Authentication tokens

---

## 🚀 CÀI ĐẶT

### Yêu Cầu
- Node.js >= 18.0.0
- npm / yarn / pnpm
- Sui CLI (for contracts)
- Sui Wallet extension

### 1. Clone Repository
```bash
git clone https://github.com/qminh77/SUI_Shopping_Cart.git
cd SUI_Shopping_Cart
```

### 2. Frontend Setup
```bash
cd web
npm install
```

### 3. Environment Variables
Tạo file `.env.local` trong thư mục `web/`:

```env
# Sui Blockchain
NEXT_PUBLIC_PACKAGE_ID=0x9421f0d56936c7957c16fbffa424f1e7e65d09f7cdb6eb4d5fcb72e152515460
NEXT_PUBLIC_MARKETPLACE_ID=<marketplace_object_id>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
ADMIN_WALLETS=0xYourAdminWallet1,0xYourAdminWallet2
JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Database Setup
1. Tạo project tại [supabase.com](https://supabase.com)
2. Chạy migration trong `web/supabase/migrations/001_shops_schema.sql`
3. Copy credentials vào `.env.local`

### 5. Run Development Server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## ⚙️ CẤU HÌNH

### Smart Contracts Deployment

#### Build Contracts
```bash
cd contracts
sui move build
```

#### Deploy to Testnet
```bash
# Switch to testnet
sui client switch --env testnet

# Get testnet SUI
sui client faucet

# Publish contracts
sui client publish --gas-budget 100000000

# Copy Package ID và cập nhật vào .env.local
```

Xem chi tiết trong [Deployment Guide](#-deployment).

---

## 📖 SỬ DỤNG

### User Flow: Seller

```
1. Connect wallet
2. Vào /seller
3. Create Shop (điền form đầy đủ)
   → Shop status: PENDING
4. Chờ admin approve
   → Shop status: ACTIVE
5. Create Kiosk (1 lần)
6. Mint Product NFT
7. List product vào Kiosk
8. Product xuất hiện trên marketplace
```

### User Flow: Buyer

```
1. Browse /shop
2. View product details
3. Connect wallet (nếu chưa)
4. Add to cart / Buy now
5. Confirm transaction
6. NFT transfer to wallet
```

### Admin Flow

```
1. Connect wallet
2. Sign authentication message
3. Access /admin
4. Manage shops:
   - Approve pending shops
   - Suspend violations
   - View audit logs
```

---

## 🏗️ KIẾN TRÚC

### System Architecture

```
┌─────────────────────────────────────┐
│      Next.js Frontend (UI)          │
│  - Pages (Home, Shop, Seller)       │
│  - Components (Shadcn UI)           │
│  - Providers (Sui, Wallet)          │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌──────────────┐
│ Next.js │      │ Sui Blockchain│
│   API   │      │  - product   │
│ Routes  │      │  - shop      │
│         │      │  - kiosk     │
└────┬────┘      └──────────────┘
     │
     ▼
┌──────────┐
│ Supabase │
│PostgreSQL│
│ - shops  │
│ - logs   │
└──────────┘
```

### Cấu Trúc Thư Mục

```
SUI_Shopping_Cart/
├── contracts/              # Sui Move Smart Contracts
│   ├── sources/
│   │   ├── product.move   # Product NFT
│   │   └── shop.move      # Shop & Marketplace
│   └── Move.toml
│
└── web/                    # Next.js Application
    ├── src/
    │   ├── app/           # Pages & API Routes
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── shop/
    │   │   ├── seller/
    │   │   ├── profile/
    │   │   ├── admin/
    │   │   └── api/
    │   │
    │   ├── components/    # React Components
    │   │   ├── ui/       # Shadcn UI (29 components)
    │   │   └── shops/
    │   │
    │   ├── hooks/        # Custom hooks
    │   ├── lib/          # Utilities
    │   ├── services/     # Business logic
    │   └── providers/    # Context providers
    │
    └── supabase/
        └── migrations/   # Database schema
```

---

## 🔌 API DOCUMENTATION

### Shop APIs

#### POST /api/shops
Tạo shop mới.

**Request:**
```json
{
  "owner_wallet": "0x...",
  "shop_name": "My Shop",
  "shop_description": "...",
  "business_type": "PERSONAL",
  "established_year": 2024,
  "contact_email": "contact@shop.com",
  "contact_phone": "0901234567",
  "address_city": "Ho Chi Minh City",
  "address_detail": "123 Street"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  ...
}
```

#### GET /api/shops/me?wallet=0x...
Lấy shop của user.

### Admin APIs

**Authentication Required:** Bearer JWT token

#### GET /api/admin/shops
List all shops (paginated).

**Query:** `?page=1&limit=20&status=PENDING&search=...`

#### POST /api/admin/shops/[id]/approve
Approve shop.

#### POST /api/admin/shops/[id]/suspend
Suspend shop với lý do.

---

## 📜 SMART CONTRACTS

### Module: product.move

#### Struct Product
```move
public struct Product has key, store {
    id: UID,
    shop_id: address,
    name: String,
    description: String,
    image_url: String,
    price: u64,
    creator: address,
    listed: bool,
    created_at: u64,
}
```

#### Function: mint()
```move
public fun mint(
    shop_id: address,
    name: String,
    description: String,
    image_url: String,
    price: u64,
    ctx: &mut TxContext
): Product
```

### Module: shop.move

#### Create Shop
```move
public fun create_shop(
    marketplace: &mut Marketplace,
    name: String,
    description: String,
    ctx: &mut TxContext
)
```

**Package ID (Testnet):**
```
0x9421f0d56936c7957c16fbffa424f1e7e65d09f7cdb6eb4d5fcb72e152515460
```

---

## 📦 DATABASE SCHEMA

### Table: shops

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY |
| owner_wallet | text | NOT NULL, UNIQUE |
| shop_name | text | NOT NULL (3-80 chars) |
| shop_description | text | NOT NULL (20-500 chars) |
| business_type | text | 'PERSONAL' \| 'BUSINESS' |
| tax_code | text | Required if BUSINESS |
| established_year | int | NOT NULL |
| contact_email | text | NOT NULL |
| contact_phone | text | NOT NULL (9-11 chars) |
| address_city | text | NOT NULL |
| address_detail | text | NOT NULL |
| status | text | 'PENDING' \| 'ACTIVE' \| 'SUSPENDED' |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### Table: shop_audit_logs

Ghi lại mọi hành động: `SELLER_CREATE`, `APPROVE`, `SUSPEND`, `UNSUSPEND`, `UPDATE_NOTE`

---

## 🚢 DEPLOYMENT

### Frontend (Vercel)

```bash
# Via CLI
npm i -g vercel
vercel --prod
```

**Hoặc via GitHub:**
1. Push code lên GitHub
2. Import repo vào Vercel
3. Set environment variables
4. Deploy

### Smart Contracts (Mainnet)

⚠️ **Chỉ deploy sau khi test kỹ trên testnet!**

```bash
sui client switch --env mainnet
sui client gas
sui client publish --gas-budget 200000000
```

---

## 🔒 BẢO MẬT

- ✅ Smart contracts audited practices
- ✅ Wallet-based authentication
- ✅ Private keys never touch frontend
- ✅ Input validation với Zod
- ✅ Row Level Security (RLS) on Supabase
- ✅ JWT for admin sessions
- ✅ HTTPS only in production

---

## 🤝 CONTRIBUTING

Contributions are welcome! 

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 LICENSE

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 LIÊN HỆ

- **GitHub**: [@qminh77](https://github.com/qminh77)
- **Project Link**: [https://github.com/qminh77/SUI_Shopping_Cart](https://github.com/qminh77/SUI_Shopping_Cart)

---

## 🙏 ACKNOWLEDGMENTS

- [Sui Network](https://sui.io) - Blockchain platform
- [Next.js](https://nextjs.org/) - React framework
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Supabase](https://supabase.com/) - Backend as a Service

---

**Built with ❤️ on Sui Blockchain**

*Cập nhật lần cuối: 02/01/2026*

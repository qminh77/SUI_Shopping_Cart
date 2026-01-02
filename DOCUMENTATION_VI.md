# 📚 Tài Liệu Kỹ Thuật - Sui E-commerce Platform

> Nền tảng thương mại điện tử phi tập trung trên Sui blockchain

---

## 📋 Mục Lục

1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [Smart Contracts (Move)](#smart-contracts-move)
4. [Frontend (Next.js)](#frontend-nextjs)
5. [Các Chức Năng Hiện Có](#các-chức-năng-hiện-có)
6. [Luồng Hoạt Động](#luồng-hoạt-động)
7. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
8. [Cấu Hình & Môi Trường](#cấu-hình--môi-trường)

---

## 🎯 Tổng Quan Dự Án

### Mô Tả
Sui E-commerce là một nền tảng marketplace phi tập trung được xây dựng trên Sui blockchain, nơi:
- **Sản phẩm = NFT**: Mỗi sản phẩm là một NFT unique
- **Quyền sở hữu minh bạch**: Mọi giao dịch được ghi lại on-chain
- **Thanh toán bảo mật**: Smart contracts đảm bảo giao dịch an toàn

### Công Nghệ Sử Dụng

**Blockchain:**
- Sui Move - Ngôn ngữ smart contract
- Sui Testnet - Mạng blockchain để test

**Frontend:**
- Next.js 15 (App Router) - Framework React
- TypeScript - Type safety
- Tailwind CSS - Styling
- Shadcn UI - Component library
- @mysten/dapp-kit - Sui blockchain integration
- @suiet/wallet-kit - Multi-wallet support
- React Query - State management

---

## 📁 Cấu Trúc Thư Mục

```
SUI Project/
├── contracts/                    # Smart Contracts (Sui Move)
│   ├── Move.toml                # Cấu hình Move package
│   └── sources/
│       ├── product.move         # Module quản lý Product NFT
│       └── shop.move            # Module quản lý Shop & mua bán
│
├── web/                         # Frontend Application
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── layout.tsx       # Root layout (providers)
│   │   │   ├── page.tsx         # Trang chủ
│   │   │   ├── shop/
│   │   │   │   └── page.tsx     # Marketplace
│   │   │   └── seller/
│   │   │       └── page.tsx     # Seller dashboard
│   │   │
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn UI components (16 components)
│   │   │   └── WalletConnection.tsx
│   │   │
│   │   └── providers/
│   │       └── SuiProviders.tsx # Blockchain providers
│   │
│   ├── .env.local               # Environment variables
│   ├── next.config.ts           # Next.js config
│   ├── tailwind.config.ts       # Tailwind config
│   └── package.json             # Dependencies
│
├── DEPLOYMENT.md                # Hướng dẫn deploy contracts
└── DOCUMENTATION_VI.md          # File này
```

---

## 🔗 Smart Contracts (Move)

### 1. Module `product.move`

**Đường dẫn:** `contracts/sources/product.move`

**Chức năng:** Quản lý Product NFT

#### Struct `Product`
```move
public struct Product has key, store {
    id: UID,              // ID unique của NFT
    name: String,         // Tên sản phẩm
    description: String,  // Mô tả
    image_url: String,    // URL hình ảnh
    price: u64,          // Giá (đơn vị MIST)
    creator: address,    // Người tạo NFT
}
```

#### Function `mint()`
**Mục đích:** Tạo (mint) một Product NFT mới

**Input:**
- `name: String` - Tên sản phẩm
- `description: String` - Mô tả chi tiết
- `image_url: String` - URL hình ảnh sản phẩm
- `price: u64` - Giá bán (MIST)
- `ctx: &mut TxContext` - Transaction context

**Output:** 
- Chuyển NFT mới tạo cho người gọi hàm

**Cách hoạt động:**
1. Tạo object `Product` mới với thông tin được truyền vào
2. Gán `creator` = địa chỉ người gọi
3. Transfer NFT cho người tạo qua `transfer::public_transfer()`

#### Các Function Accessor
```move
public fun name(product: &Product): &String
public fun description(product: &Product): &String
public fun image_url(product: &Product): &String
public fun price(product: &Product): u64
public fun creator(product: &Product): address
```
**Mục đích:** Đọc thông tin của Product NFT

---

### 2. Module `shop.move`

**Đường dẫn:** `contracts/sources/shop.move`

**Chức năng:** Quản lý Shop và logic mua bán

#### Struct `ShopOwnerCap`
```move
public struct ShopOwnerCap has key, store {
    id: UID,
    shop_id: address,  // ID của shop
}
```
**Ý nghĩa:** Capability token chứng minh quyền sở hữu shop

#### Function `create_shop()`
**Mục đích:** Tạo shop mới

**Output:** 
- Tạo và chuyển `ShopOwnerCap` cho người tạo
- Như một "chìa khóa" để quản lý shop

#### Function `purchase_product()`
**Mục đích:** Mua một Product NFT

**Input:**
- `product_item: Product` - NFT product cần mua
- `payment: Coin<SUI>` - Số SUI để thanh toán
- `seller: address` - Địa chỉ người bán
- `ctx: &mut TxContext` - Transaction context

**Cách hoạt động:**
1. Kiểm tra số tiền thanh toán >= giá sản phẩm
2. Chuyển tiền cho seller
3. Chuyển NFT product cho buyer

**Lưu ý:** Đây là phiên bản đơn giản, trong production sẽ tích hợp Sui Kiosk

---

### 3. Package đã Deploy

**Package ID:** 
```
0x9421f0d56936c7957c16fbffa424f1e7e65d09f7cdb6eb4d5fcb72e152515460
```

**Network:** Sui Testnet

**Transaction:** [Xem trên Sui Explorer](https://suiscan.xyz/testnet/tx/8C6ZUXeB6jsp28n9r7wyGiv2ZTQM7AapkjXqyZ7PRZSD)

**Modules:**
- ✅ `product` - Minting và quản lý Product NFT
- ✅ `shop` - Logic marketplace

---

## 🖥️ Frontend (Next.js)

### 1. Root Layout (`src/app/layout.tsx`)

**Chức năng:** Layout gốc của toàn bộ ứng dụng

**Components chính:**
```tsx
<html suppressHydrationWarning>
  <body suppressHydrationWarning>
    <SuiProviders>        // Blockchain providers
      {children}          // Nội dung pages
      <Toaster />         // Toast notifications
    </SuiProviders>
  </body>
</html>
```

**Metadata:**
- Title: "Sui E-commerce - Web3 Marketplace"
- Description: Mô tả platform

**Fonts:**
- Geist Sans (variable font)
- Geist Mono (monospace)

---

### 2. Sui Providers (`src/providers/SuiProviders.tsx`)

**Chức năng:** Cung cấp blockchain context cho toàn bộ app

**Cấu trúc:**
```tsx
<QueryClientProvider client={queryClient}>
  <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
    <WalletProvider autoConnect>
      {children}
    </WalletProvider>
  </SuiClientProvider>
</QueryClientProvider>
```

**Networks được config:**
- **testnet** - Sui Testnet (mặc định)
- **devnet** - Sui Devnet
- **mainnet** - Sui Mainnet

**Wallet support:**
- Sui Wallet
- Suiet Wallet
- Ethos Wallet
- Auto-connect khi user đã từng kết nối

---

### 3. Wallet Connection (`src/components/WalletConnection.tsx`)

**Chức năng:** Component để kết nối ví

**Features:**
- Hiển thị nút "Connect Wallet"
- Hiển thị địa chỉ đã kết nối (rút gọn)
- Tự động ẩn địa chỉ trên mobile (hidden sm:inline)

**Hooks sử dụng:**
- `useCurrentAccount()` - Lấy account hiện tại
- `ConnectButton` - UI button từ @mysten/dapp-kit

---

### 4. Trang Chủ (`src/app/page.tsx`)

**URL:** `http://localhost:3000/`

**Chức năng:** Landing page của platform

**Sections:**

#### Header
- Logo "Sui Commerce"
- Nút Connect Wallet

#### Hero Section
- Badge: "Powered by Sui Blockchain"
- Tiêu đề: "Web3 E-commerce Redefined"
- Mô tả: Giới thiệu platform
- Connection status card

#### CTAs (khi đã connect wallet)
- "Browse Marketplace" → `/shop`
- "Sell Products" → `/seller`

#### Features Grid (3 cards)
1. **Verifiable Ownership**
   - Icon: Lock
   - Mô tả: NFT ownership on-chain

2. **Instant Settlement**
   - Icon: Lightning
   - Mô tả: Sub-second finality

3. **NFT Receipts**
   - Icon: Document
   - Mô tả: Proof of purchase NFT

#### Footer
- Credits: "Built with Sui Move • Next.js • Shadcn UI"

---

### 5. Shop Page (`src/app/shop/page.tsx`)

**URL:** `http://localhost:3000/shop`

**Chức năng:** Marketplace để xem và mua sản phẩm

**State Management:**
```tsx
const [products, setProducts] = useState<Product[]>([]);
const [isLoading, setIsLoading] = useState(true);
```

**Product Interface:**
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;        // Giá tính bằng SUI
  creator: string;      // Địa chỉ creator
}
```

#### Mock Data
Hiện tại shop hiển thị 3 sản phẩm mẫu:
1. **Digital Art Collection** - 1.5 SUI
2. **NFT Collectible Series** - 2.0 SUI
3. **Virtual Asset Token** - 10.0 SUI

**Lý do dùng mock data:**
- Chưa tích hợp Sui Indexer để fetch NFT thật
- Giúp test UI/UX trước
- Trong tương lai sẽ fetch từ blockchain

#### Product Card Components
```tsx
<Card>
  <Image />              // Ảnh sản phẩm (Next.js Image)
  <Badge>NFT</Badge>
  <CardTitle />          // Tên
  <CardDescription />    // Mô tả
  <Separator />
  <Price />             // Hiển thị giá SUI
  <Creator />           // Địa chỉ rút gọn
  <Button />            // Purchase NFT
</Card>
```

#### Purchase Button
- Disabled nếu chưa connect wallet
- Text: "Purchase NFT" hoặc "Connect Wallet"
- Chưa có logic mua (sẽ implement sau)

---

### 6. Seller Dashboard (`src/app/seller/page.tsx`)

**URL:** `http://localhost:3000/seller`

**Chức năng:** Trang để seller tạo Product NFT

#### Protected Route
```tsx
if (!account) {
  return <WalletRequiredMessage />
}
```
- Chỉ user đã connect wallet mới vào được
- Hiển thị thông báo nếu chưa connect

#### Create Product Form

**Form Fields:**
```tsx
const [formData, setFormData] = useState({
  name: '',
  description: '',
  imageUrl: '',
  price: '',        // Input dạng string, convert sang number
});
```

**Input Fields:**

1. **Product Name** (`Input`)
   - Placeholder: "e.g., Digital Artwork #1"
   - Required: ✅

2. **Description** (`Textarea`)
   - Rows: 4
   - Placeholder: "Describe your product in detail..."
   - Required: ✅

3. **Image URL** (`Input type="url"`)
   - Placeholder: "https://example.com/image.jpg"
   - Helper text: "Provide a publicly accessible URL"
   - Required: ✅

4. **Price (SUI)** (`Input type="number"`)
   - Step: 0.001
   - Min: 0
   - Helper text: "1 SUI = 1,000,000,000 MIST"
   - Required: ✅

#### Submit Logic

```tsx
const handleCreateProduct = async (e: React.FormEvent) => {
  // 1. Convert SUI to MIST
  const priceInMist = Math.floor(parseFloat(formData.price) * 1_000_000_000);
  
  // 2. Build transaction
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::product::mint`,
    arguments: [
      tx.pure.string(formData.name),
      tx.pure.string(formData.description),
      tx.pure.string(formData.imageUrl),
      tx.pure.u64(priceInMist),
    ],
  });
  
  // 3. Sign & execute
  signAndExecute({ transaction: tx }, {
    onSuccess: () => {
      toast.success('Product created successfully!');
      // Reset form
    },
    onError: (error) => {
      toast.error('Failed to create product');
    }
  });
}
```

**Transaction Flow:**
1. User điền form và submit
2. Frontend convert giá từ SUI → MIST
3. Gọi `product::mint()` trên blockchain
4. User approve transaction trong ví
5. NFT được mint và transfer cho user
6. Hiển thị toast notification

#### Setup Instructions Section

**Step 1: Deploy Smart Contracts**
- Build và deploy Move contracts lên testnet
- Sử dụng Sui CLI

**Step 2: Configure Package ID**
- Set `NEXT_PUBLIC_PACKAGE_ID` trong `.env.local`
- Giá trị: Package ID sau khi deploy

**Step 3: Fund Your Wallet**
- Đảm bảo có đủ SUI tokens cho gas fees
- Dùng faucet để lấy test tokens

**What happens when you create?**
- Product được mint thành NFT on-chain
- Bạn trở thành owner
- Metadata lưu vĩnh viễn on-chain
- Product có thể list trên marketplaces

---

## ✨ Các Chức Năng Hiện Có

### ✅ Hoàn Thành

#### 1. Wallet Integration
- [x] Kết nối đa ví (Sui Wallet, Suiet, etc.)
- [x] Auto-connect cho user cũ
- [x] Hiển thị địa chỉ wallet
- [x] Protected routes (yêu cầu connect wallet)

#### 2. Smart Contracts
- [x] Product NFT module
- [x] Shop module
- [x] Deploy lên Sui Testnet
- [x] Package ID configuration

#### 3. UI/UX
- [x] Responsive design (mobile → desktop)
- [x] Dark/Light mode support (Shadcn theming)
- [x] Professional, clean Web3 aesthetic
- [x] Toast notifications (Sonner)
- [x] Loading states
- [x] Empty states

#### 4. Pages
- [x] Landing page với hero section
- [x] Shop/Marketplace page
- [x] Seller dashboard
- [x] Form tạo Product NFT

#### 5. Product NFT Creation
- [x] Form validation
- [x] Price conversion (SUI → MIST)
- [x] Transaction signing
- [x] Success/Error handling
- [x] Form reset after success

---

### 🚧 Đang Thiếu / Chưa Implement

#### 1. Fetch Sản Phẩm Thật Từ Blockchain
**Hiện tại:** Shop hiển thị mock data (3 sản phẩm mẫu)

**Cần làm:**
- Integrate Sui RPC để query owned objects
- Filter objects theo type `Product`
- Parse metadata từ blockchain
- Hiển thị products thật trên shop page

**Code cần thêm:**
```typescript
const { data: products } = useSuiClientQuery('getOwnedObjects', {
  owner: account.address,
  filter: {
    StructType: `${PACKAGE_ID}::product::Product`
  }
});
```

#### 2. Purchase Flow
**Hiện tại:** Nút "Purchase NFT" chưa có logic

**Cần làm:**
- Build transaction gọi `shop::purchase_product()`
- Handle payment coin
- Transfer product từ seller → buyer
- Hiển thị transaction confirmation

#### 3. Kiosk Integration
**Hiện tại:** Direct transfer giữa users

**Cần làm:**
- Tích hợp Sui Kiosk standard
- List products trong Kiosk
- Marketplace fees
- Royalties cho creators

#### 4. NFT Receipt Generation
**Hiện tại:** Không có receipt

**Cần làm:**
- Mint receipt NFT khi mua hàng
- Lưu thông tin giao dịch trong receipt
- Hiển thị receipts của user

#### 5. User Profile Page
**Chưa có:** Trang xem profile và NFTs owned

**Cần làm:**
- `/profile` page
- Hiển thị products đã tạo
- Hiển thị products đã mua
- Hiển thị receipts

#### 6. Search & Filter
**Chưa có:** Tìm kiếm và lọc sản phẩm

**Cần làm:**
- Search bar
- Filter theo price range
- Filter theo creator
- Sort (price, date, etc.)

#### 7. Image Storage
**Hiện tại:** Dùng public URLs (Unsplash)

**Nên làm:**
- Upload lên IPFS/Walrus
- Decentralized storage
- Pin images permanently

---

## 🔄 Luồng Hoạt Động

### Flow 1: Tạo Product NFT

```
1. User → Vào /seller
2. Kiểm tra → Đã connect wallet chưa?
   ├─ Chưa → Hiển thị "Connect Wallet Required"
   └─ Rồi → Hiển thị form
3. User điền form:
   - Name: "My Digital Art"
   - Description: "Unique artwork..."
   - Image URL: "https://..."
   - Price: 1.5 SUI
4. Click "Create Product NFT"
5. Frontend:
   - Convert 1.5 SUI → 1,500,000,000 MIST
   - Build transaction:
     tx.moveCall({
       target: "${PACKAGE_ID}::product::mint",
       arguments: [name, desc, url, price_mist]
     })
6. Wallet popup → User approve
7. Blockchain:
   - Execute product::mint()
   - Tạo Product NFT mới
   - id = new UID
   - creator = tx.sender
   - Transfer NFT cho creator
8. Transaction success
9. Frontend:
   - Toast: "Product created successfully!"
   - Reset form
10. User có thể xem NFT trong ví
```

---

### Flow 2: Xem Shop (Hiện Tại)

```
1. User → Vào /shop
2. Frontend:
   - Load mock data (3 products)
   - setIsLoading(false)
3. Render product grid:
   - 3 cards với hình ảnh
   - Tên, mô tả, giá
   - Badge "NFT"
4. Nút Purchase:
   - Enabled nếu wallet connected
   - Disabled nếu chưa connect
5. Click Purchase → (chưa có logic)
```

---

### Flow 3: Xem Shop (Tương Lai - Sau Khi Implement)

```
1. User → Vào /shop
2. Frontend query blockchain:
   - Get all Product NFTs
   - Filter available products
3. Parse blockchain data:
   - Extract: name, desc, image, price, creator
4. Render product cards với data thật
5. User click "Purchase NFT"
6. Frontend build transaction:
   tx.moveCall({
     target: "${PACKAGE_ID}::shop::purchase_product",
     arguments: [product_object, payment_coin, seller]
   })
7. User approve trong ví
8. Blockchain:
   - Verify payment >= price
   - Transfer coin → seller
   - Transfer NFT → buyer
9. Success:
   - Toast notification
   - Refresh product list
   - NFT xuất hiện trong ví buyer
```

---

## 🏗️ Kiến Trúc Hệ Thống

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│              USER BROWSER                       │
│  ┌───────────────────────────────────────────┐ │
│  │         Next.js Frontend                  │ │
│  │  ┌─────────────┐  ┌──────────────┐       │ │
│  │  │   Pages     │  │  Components  │       │ │
│  │  │ - Home      │  │ - WalletConn │       │ │
│  │  │ - Shop      │  │ - ProductCard│       │ │
│  │  │ - Seller    │  │ - UI (Shadcn)│       │ │
│  │  └─────────────┘  └──────────────┘       │ │
│  │         ↓                 ↓               │ │
│  │  ┌──────────────────────────────────┐    │ │
│  │  │      Sui Providers               │    │ │
│  │  │  - SuiClientProvider             │    │ │
│  │  │  - WalletProvider                │    │ │
│  │  │  - QueryClient                   │    │ │
│  │  └──────────────────────────────────┘    │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                    ↓ RPC Calls
┌─────────────────────────────────────────────────┐
│           SUI BLOCKCHAIN (Testnet)              │
│  ┌───────────────────────────────────────────┐ │
│  │       Smart Contracts (Move)              │ │
│  │  ┌─────────────┐  ┌──────────────┐       │ │
│  │  │   product   │  │     shop     │       │ │
│  │  │   module    │  │    module    │       │ │
│  │  │             │  │              │       │ │
│  │  │ - mint()    │  │ - create()   │       │ │
│  │  │ - accessors │  │ - purchase() │       │ │
│  │  └─────────────┘  └──────────────┘       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         NFT Objects Storage               │ │
│  │  - Product NFTs                           │ │
│  │  - ShopOwnerCap                           │ │
│  │  - SUI Coins                              │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────────────┐
│           WALLET (Browser Extension)            │
│  - Sui Wallet / Suiet / Ethos                  │
│  - Store private keys                          │
│  - Sign transactions                           │
│  - Manage accounts                             │
└─────────────────────────────────────────────────┘
```

---

### Data Flow: Create Product NFT

```
Frontend (Seller Dashboard)
    │
    │ 1. User fills form
    │ 2. Validate input
    │
    ▼
Build Transaction
    │
    │ tx.moveCall({
    │   target: "PACKAGE_ID::product::mint",
    │   arguments: [name, desc, url, price_mist]
    │ })
    │
    ▼
Request Wallet Signature
    │
    │ signAndExecute(tx)
    │
    ▼
Wallet (Browser Extension)
    │
    │ 1. Show transaction details
    │ 2. User approves
    │ 3. Sign with private key
    │
    ▼
Send to Blockchain
    │
    │ Signed transaction → Sui RPC
    │
    ▼
Sui Blockchain Execution
    │
    │ 1. Validate transaction
    │ 2. Deduct gas fees
    │ 3. Execute product::mint()
    │    - Create new Product object
    │    - Set fields (name, desc, price...)
    │    - creator = tx.sender
    │ 4. Transfer NFT to creator
    │
    ▼
Transaction Result
    │
    │ Success:
    │ - Transaction digest
    │ - Created objects (NFT)
    │ - Gas used
    │
    ▼
Frontend Handles Response
    │
    │ onSuccess:
    │   - toast.success("Product created!")
    │   - Reset form
    │   - User can view NFT in wallet
    │
    │ onError:
    │   - toast.error("Failed to create")
    │   - Show error details
```

---

## ⚙️ Cấu Hình & Môi Trường

### Environment Variables

**File:** `web/.env.local`

```bash
# Package ID của smart contracts đã deploy
NEXT_PUBLIC_PACKAGE_ID=0x9421f0d56936c7957c16fbffa424f1e7e65d09f7cdb6eb4d5fcb72e152515460
```

**Cách dùng:**
```tsx
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
```

**Lưu ý:**
- Prefix `NEXT_PUBLIC_` để expose ra browser
- Không commit `.env.local` vào git (đã có trong .gitignore)
- Có `.env.example` làm template

---

### Next.js Configuration

**File:** `web/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

**Giải thích:**
- Cho phép load images từ Unsplash
- Dùng cho mock product images
- Trong production nên thay bằng IPFS/Walrus

---

### Tailwind Configuration

**File:** `web/tailwind.config.ts`

**Features:**
- Shadcn UI color variables (từ `globals.css`)
- Dark mode support
- Geist font variables
- Custom animations

---

### Move Package Configuration

**File:** `contracts/Move.toml`

```toml
[package]
name = "sui_ecommerce"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
sui_ecommerce = "0x0"
```

**Giải thích:**
- `name`: Tên package
- `edition`: Phiên bản Move language
- `dependencies`: Sui Framework từ testnet
- `addresses`: Address placeholder (sẽ được set khi deploy)

---

## 🚀 Triển Khai & Chạy Thử

### Yêu Cầu Hệ Thống
- Node.js 18+
- npm hoặc yarn
- Sui CLI (để deploy contracts)
- Browser với wallet extension

### Cài Đặt

**1. Clone repo:**
```bash
cd "SUI Project"
```

**2. Install frontend dependencies:**
```bash
cd web
npm install
```

**3. Install Sui CLI:**
```bash
curl -sSfL https://raw.githubusercontent.com/Mystenlabs/suiup/main/install.sh | sh
suiup install sui@testnet
```

**4. Setup Sui wallet:**
```bash
sui client
# Tạo keypair mới hoặc import existing
```

**5. Get test SUI:**
```bash
sui client faucet
# Hoặc vào: https://faucet.sui.io
```

**6. Build contracts:**
```bash
cd ../contracts
sui move build
```

**7. Deploy contracts:**
```bash
sui client publish --gas-budget 100000000
# Copy Package ID từ output
```

**8. Configure frontend:**
```bash
cd ../web
echo "NEXT_PUBLIC_PACKAGE_ID=<your_package_id>" > .env.local
```

**9. Run dev server:**
```bash
npm run dev
```

**10. Mở browser:**
```
http://localhost:3000
```

---

## 📊 Thống Kê Dự Án

### Code Statistics

**Smart Contracts:**
- 2 modules (product, shop)
- ~100 lines Move code
- 0 external dependencies (chỉ Sui Framework)

**Frontend:**
- 683 npm packages
- 16 Shadcn UI components
- 4 pages
- 2 custom components
- TypeScript strict mode

**Gas Costs (Testnet):**
- Deploy package: ~13 MIST
- Mint Product NFT: ~0.5-1 MIST (ước tính)

---

## 🎓 Kiến Thức Cần Thiết

### Để Hiểu Code

**Blockchain Basics:**
- NFT là gì
- Smart contracts
- Gas fees
- Wallets & private keys

**Sui Specific:**
- Object model (key, store abilities)
- Move language syntax
- Transaction building
- PTB (Programmable Transaction Blocks)

**Frontend:**
- React hooks (useState, useEffect)
- Next.js App Router
- TypeScript basics
- Async/await

---

## 🐛 Troubleshooting

### Lỗi Thường Gặp

**1. Hydration Error**
```
Error: Hydration failed because the server rendered HTML...
```
**Fix:** Đã fix bằng `suppressHydrationWarning` trong layout.tsx

**2. Image Error**
```
Error: Invalid src prop, hostname not configured
```
**Fix:** Thêm domain vào `next.config.ts` → `images.remotePatterns`

**3. Transaction Error**
```
Error: Insufficient gas
```
**Fix:** Lấy thêm SUI từ faucet

**4. Module Error**
```
Error: Could not resolve module
```
**Fix:** 
- Check `NEXT_PUBLIC_PACKAGE_ID` đã set chưa
- Package ID có đúng không
- Restart dev server

---

## 📚 Tài Liệu Tham Khảo

**Sui Docs:**
- https://docs.sui.io
- https://docs.sui.io/guides/developer/sui-101

**Move Book:**
- https://move-book.com

**Tools:**
- Sui Explorer: https://suiscan.xyz
- Sui Faucet: https://faucet.sui.io

**Frontend:**
- Next.js: https://nextjs.org/docs
- Shadcn UI: https://ui.shadcn.com
- dApp Kit: https://sdk.mystenlabs.com/dapp-kit

---

## 📝 Ghi Chú Cho Developer

### Best Practices Đã Áp Dụng

✅ **TypeScript strict mode** - Type safety
✅ **Component composition** - Reusable Shadcn components
✅ **Error handling** - Try-catch + toast notifications
✅ **Loading states** - Skeleton loaders
✅ **Form validation** - Required fields
✅ **Responsive design** - Mobile-first
✅ **Clean code** - Meaningful variable names
✅ **Comments** - JSDoc cho functions quan trọng

### Coding Conventions

**Naming:**
- Components: PascalCase (`ProductCard`)
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`PACKAGE_ID`)
- Files: kebab-case (`wallet-connection.tsx`)

**Move:**
- Modules: snake_case (`product`, `shop`)
- Functions: snake_case (`mint`, `purchase_product`)
- Structs: PascalCase (`Product`, `ShopOwnerCap`)

---

## 🔮 Kế Hoạch Tương Lai

### Phase 1: Core Functionality ✅
- [x] Smart contracts
- [x] Basic UI
- [x] Wallet integration
- [x] Product NFT minting

### Phase 2: Marketplace (Đang Làm) 🚧
- [ ] Fetch products từ blockchain
- [ ] Purchase flow
- [ ] Product listing
- [ ] Search & filter

### Phase 3: Advanced Features 📋
- [ ] Kiosk integration
- [ ] NFT receipts
- [ ] User profiles
- [ ] IPFS/Walrus storage
- [ ] Royalties system

### Phase 4: Production Ready 🎯
- [ ] Mainnet deployment
- [ ] Security audit
- [ ] Performance optimization
- [ ] E2E testing
- [ ] CI/CD pipeline

---

## 👥 Team & Support

**Developer:** AI Assistant (Antigravity)
**User:** qminh77

**Contact:**
- GitHub Issues (nếu có repo)
- Discord community (nếu có)

---

**Last Updated:** 2026-01-02  
**Version:** 1.0.0  
**Status:** Development (Testnet)

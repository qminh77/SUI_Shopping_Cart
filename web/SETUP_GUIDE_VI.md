# Hướng Dẫn Cài Đặt & Kết Nối Database (Supabase)

Tài liệu này hướng dẫn bạn cách thiết lập Supabase và kết nối với dự án SUI Project để tính năng Shop & Admin hoạt động.

## 1. Tạo Project Supabase
1.  Truy cập [Supabase Dashboard](https://supabase.com/dashboard) và đăng nhập.
2.  Nhấn **"New Project"**.
3.  Điền thông tin:
    *   **Name**: SUI Shop (hoặc tên tùy ý)
    *   **Database Password**: Lưu lại mật khẩu này (quan trọng).
    *   **Region**: Chọn Singapore (hoặc vùng gần nhất).
4.  Nhấn **"Create new project"** và chờ vài phút để khởi tạo.

## 2. Thiết lập Database (Chạy Migration)
Sau khi project tạo xong:
1.  Vào mục **SQL Editor** (icon dấm `[<>]` ở thanh bên trái).
2.  Nhấn **"New Query"**.
3.  Copy toàn bộ nội dung trong file code của dự án tại:
    `supabase/migrations/001_shops_schema.sql`
4.  Paste vào khung SQL Editor trên Supabase.
5.  Nhấn nút **"Run"** (màu xanh lá) ở góc dưới bên phải.
    *   *Thông báo "Success" hiện ra nghĩa là bảng `shops` và `shop_audit_logs` đã được tạo.*

## 3. Lấy API Keys
1.  Vào mục **Project Settings** (icon bánh răng ⚙️ ở dưới cùng bên trái).
2.  Chọn **"API"**.
3.  Tại phần **Project URL**, copy `URL`.
4.  Tại phần **Project API keys**:
    *   Copy `anon` `public` key.
    *   Copy `service_role` `secret` key (Nhấn "Reveal" để xem). **Tuyệt đối không lộ key này ra ngoài frontend.**

## 4. Cấu hình biến môi trường
Mở file `.env.local` trong thư mục code `web/` và cập nhật các dòng sau:

```env
# URL của Supabase Project (bước 3)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Key 'anon' public (bước 3)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Key 'service_role' secret (bước 3) - Quan trọng để Admin hoạt động
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ví Admin (danh sách các ví được quyền truy cập AdminCP, phân cách bằng dấu phẩy)
ADMIN_WALLETS=0x123...,0x456...

# Chuỗi bí mật bất kỳ dùng để mã hóa session cookie (tự nghĩ ra một chuỗi dài)
SESSION_SECRET=minh-so-secret-key-change-this-to-something-long-and-random
```

## 5. Kiểm tra hoạt động
1.  Chạy lại dự án: `npm run dev`
2.  Truy cập `/seller/shop`: Đăng ký thử một shop mới.
3.  Kiểm tra trong Supabase -> **Table Editor**: Xem thông tin shop vừa tạo có xuất hiện trong bảng `shops` không.
4.  Truy cập `/admin/login`: Đăng nhập bằng ví có trong `ADMIN_WALLETS`.

---
**Lưu ý:**
*   `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở phía Server (trong các file `route.ts` API). Không bao giờ dùng nó ở React Component (client side).

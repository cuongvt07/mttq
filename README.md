# Phường Xanh — Next.js 15 + Tailwind v4 + Supabase

Bản Next.js của trang "Phong trào Toàn dân chung tay bảo vệ môi trường, vì Thủ đô xanh – sạch – đẹp".
Toàn bộ nội dung (banner, số liệu, các cụm, đơn vị, ảnh) lấy từ Supabase và sửa được ở route `/admin`.

Giao diện viết bằng **Tailwind CSS v4** (không còn CSS thuần). Ảnh nền, con dấu Mặt trận Tổ quốc
và hình minh hoạ được cào từ trang Canva gốc — xem [Ảnh từ site gốc](#ảnh-từ-site-gốc).

Bản HTML tĩnh gốc được giữ lại ở [reference/index.html](reference/index.html) để đối chiếu giao diện.

---

## 1. Cài đặt

```bash
cd phuong-xanh
npm install
npm run dev        # http://localhost:3000
```

Biến môi trường nằm trong `.env.local` (đã điền sẵn project `tbdpwdgvoxexbsdtjkzd`):

```
NEXT_PUBLIC_SUPABASE_URL=https://tbdpwdgvoxexbsdtjkzd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 2. Tạo cơ sở dữ liệu

Mở **Supabase Dashboard → SQL Editor**, chạy lần lượt:

1. [supabase/schema.sql](supabase/schema.sql) — tạo bảng, bật RLS, tạo bucket ảnh `media`.
2. [supabase/seed.sql](supabase/seed.sql) — nạp dữ liệu mẫu (11 cụm, 82 đơn vị, 3 ô số liệu, 4 ảnh nổi bật).

Hoặc chạy tự động bằng [scripts/apply-sql.mjs](scripts/apply-sql.mjs) với personal access token:

```bash
$env:SUPABASE_ACCESS_TOKEN="sbp_..."   # PowerShell
node scripts/apply-sql.mjs
```

Trước khi chạy 2 file này trang vẫn hoạt động bình thường nhưng dùng **dữ liệu mẫu cứng**
([lib/fallback-data.ts](lib/fallback-data.ts)) và hiện một dải cảnh báo màu vàng ở đầu trang.

## 3. Tạo tài khoản quản trị

**Supabase Dashboard → Authentication → Users → Add user** (email + password, bật *Auto Confirm*).
Đăng nhập tại `/admin/login`.

> Quyền ghi được cấp cho mọi tài khoản đã đăng nhập (`authenticated`). Nếu muốn siết lại,
> sửa các policy `authenticated write ...` trong `schema.sql`, ví dụ:
> `using (auth.jwt() ->> 'email' = 'admin@domain.vn')`.
> Nên tắt luôn **Authentication → Providers → Email → Allow new users to sign up**
> để không ai tự đăng ký tài khoản.

---

## Route quản trị

| Route | Quản lý |
|---|---|
| `/admin` | Tổng quan |
| `/admin/settings` | Tiêu đề site, logo, banner (ảnh hoặc hình minh hoạ mặc định), màu khối nổi bật, chân trang |
| `/admin/stats` | Các ô số liệu trên banner (126 / 1.075.590 / 5.370…) |
| `/admin/media` | Khối ảnh "Mặt trận Tổ quốc" — ảnh ngang/dọc, chú thích, link |
| `/admin/clusters` | Danh sách cụm: tên, nhãn menu, 2 màu gradient, thứ tự, ẩn/hiện |
| `/admin/clusters/[id]` | Đơn vị trong cụm: ảnh, tên, link, thứ tự |

Mọi form đều dùng **Server Action** + `revalidatePath("/")` nên bấm Lưu là trang chủ cập nhật ngay.
Ô ảnh cho phép **tải file lên Supabase Storage** (bucket `media`, công khai) hoặc dán URL có sẵn.

`/admin/*` được middleware chặn nếu chưa đăng nhập ([middleware.ts](middleware.ts)).

---

## Ảnh từ site gốc

`node scripts/scrape-canva.mjs` đọc https://mttqvn.my.canva.site/, tải toàn bộ ảnh về
`public/canva/` và ghi manifest `lib/canva-assets.json`. `node scripts/optimize-images.mjs`
nén chúng sang WebP ≤1600px (209 MB → 19 MB). Script **không đụng gì tới dữ liệu Supabase**.

Từ bộ ảnh đó, phần dùng cho giao diện được tách sẵn:

| Đường dẫn | Dùng ở đâu |
|---|---|
| `public/brand/emblem.webp` | con dấu Mặt trận Tổ quốc — logo menu, viên tiêu đề, ảnh mặc định của đơn vị chưa có hình |
| `public/brand/hero-city.webp` | dải minh hoạ thành phố xanh dưới banner (đã cắt bỏ phần chữ) |
| `public/brand/hero-banner.webp` | banner gốc đầy đủ chữ — dán vào ô "Ảnh banner" trong `/admin/settings` nếu muốn dùng |
| `public/bg/01…12` | 12 ảnh nền gradient cho các khối |

Nền của mỗi cụm gán **theo vị trí** trong [lib/theme.ts](lib/theme.ts) (`CLUSTER_BACKGROUNDS`),
nên đổi thứ tự cụm trong admin là nền đổi theo — không cần sửa dữ liệu. Màu `color_from` /
`color_to` của cụm giờ là lớp phủ mỏng (25%) lên ảnh nền để chữ luôn đọc được.

Trong admin, nút **Thư viện ảnh** ở mỗi ô ảnh cho chọn nhanh trong 146 ảnh đã cào.

## Tin + flip-book

Mỗi thẻ tin (mục "Hoạt động chung" và từng hoạt động của mỗi Ban) gồm **ảnh chính + tên tin**,
bấm vào sẽ **mở flip-book ngay trong trang** — modal toàn màn hình nhúng iframe, đóng bằng nút
✕ hoặc phím Esc, kèm nút "Mở tab mới".

- Link đặt ở cột `flipbook_url` (bảng `units` và `media_items`), nhập trong `/admin`.
- Chưa có `flipbook_url` thì thẻ dùng `link_url` như liên kết thường; không có cả hai thì thẻ tĩnh.
- Thẻ có flip-book hiện nhãn 📖 ở góc ảnh.
- Vẫn render `<a href>` thật nên Ctrl/⌘ + click mở tab mới, và tắt JS vẫn bấm được.
- Modal đưa ra `document.body` bằng `createPortal` để không bị thanh menu sticky đè lên.

Migration: [supabase/migration-flipbook.sql](supabase/migration-flipbook.sql).
Dữ liệu demo: [supabase/demo-flipbook.sql](supabase/demo-flipbook.sql).

## Module sách lật tự thiết kế (`/admin/books`)

Tự dựng từng trang rồi xem dưới dạng sách lật — không cần Heyzine.

**Trình soạn thảo** ([BookEditor.tsx](components/book/BookEditor.tsx)):
khung cố định theo tỉ lệ chọn khi tạo sách (3:4, 4:3, A4, 1:1, 16:9);
thêm khối chữ / ảnh, kéo thả, đổi kích thước bằng handle góc, xoay bằng handle tròn;
sửa phông, cỡ chữ, màu, căn lề, giãn dòng, đậm/nghiêng; ảnh có bo góc, độ mờ, viền, cách lấp khung;
trang có màu nền / ảnh nền; bám lưới 10px; hoàn tác/làm lại (Ctrl+Z, Ctrl+Shift+Z);
phím mũi tên dịch chuyển, Delete xoá; lên/xuống lớp; nhân bản; **autosave** sau 1,2 giây.
Nhiều trang: thêm / nhân bản / xoá / đổi thứ tự, có dải thumbnail.

**Trình xem** (`/sach/<slug>`, [FlipViewer.tsx](components/book/FlipViewer.tsx)):
PC mở 2 trang có hiệu ứng cong khi lật (StPageFlip qua `react-pageflip`);
mobile 1 trang toàn màn hình, vuốt trái/phải (`usePortrait`); phím ←/→ và nút Trước/Sau.

**Một render engine duy nhất** ([PageRenderer.tsx](components/book/PageRenderer.tsx)) dùng cho cả
editor, thumbnail lẫn viewer nên WYSIWYG — trang hiển thị đúng như lúc thiết kế. Toạ độ lưu theo
khung 800px rồi scale, nên đổi kích thước màn hình không lệch bố cục.

Dữ liệu: bảng `books` + `book_pages` (`elements` là JSONB) —
[migration-books.sql](supabase/migration-books.sql), sách demo trong
[demo-book.sql](supabase/demo-book.sql). Ảnh upload vào bucket `media`, thư mục `books/<id>/`.

Trong form tin/hoạt động, ô flip-book có sẵn dropdown chọn sách đã thiết kế
(điền `/sach/<slug>`) hoặc dán link ngoài.

Khác đặc tả: dùng DOM tuyệt đối thay vì Fabric/Konva — để editor và viewer dùng CHUNG một
component render (yêu cầu WYSIWYG ở mục 4 của đặc tả), chữ vẫn là text thật (nét, chọn được,
SEO) thay vì bitmap canvas. Chưa làm: crop ảnh trong editor, align/distribute nhiều khối,
sinh ảnh bìa tự động.

## Hiệu ứng

[components/Reveal.tsx](components/Reveal.tsx) mount một lần ở trang chủ, dùng `IntersectionObserver`
theo dõi mọi phần tử có `data-reveal` và thêm class `is-visible` khi cuộn tới. Kiểu hiệu ứng:

- `data-reveal` — mờ dần + trôi lên (thẻ đơn vị, ảnh nổi bật, banner)
- `data-reveal="slide"` — viên tiêu đề trượt từ trái vào
- `data-reveal="pop"` — ô số liệu bật lên

Độ trễ so le đặt qua biến CSS `--reveal-delay` (thẻ trong cùng một cụm lệch nhau 45ms).
Trạng thái ẩn chỉ áp dụng sau khi JS chạy (class `reveal-ready` trên `<html>`) nên tắt JS
vẫn thấy đủ nội dung, và tự tắt hoàn toàn khi máy bật `prefers-reduced-motion`.

## Cấu trúc

```
app/
  page.tsx                 trang chủ (server component, đọc Supabase)
  globals.css              @import tailwindcss + @theme token + primitive cho admin
  admin/                   khu vực quản trị
    actions.ts             toàn bộ server action (CRUD + đăng nhập/đăng xuất)
components/                TopNav, SectionShell, ClusterSection, UnitCard, FeaturedSection, Emblem
components/admin/          ImageField, AssetPicker (thư viện ảnh), ConfirmSubmit
lib/
  queries.ts               truy vấn dữ liệu (site + admin)
  theme.ts                 ảnh nền / icon gán theo vị trí cụm
  canva-assets.json        manifest ảnh đã cào
  fallback-data.ts         dữ liệu dự phòng khi chưa có bảng
  types.ts, slug.ts
utils/supabase/            client / server / middleware helper
supabase/                  schema.sql, seed.sql
scripts/                   scrape-canva, optimize-images, apply-sql, screenshot
```

## Mô hình dữ liệu

- `site_settings` — 1 dòng duy nhất (id = 1): tiêu đề, banner, màu, chân trang.
- `stats` — ô số liệu: `value`, `label`, `variant` (`default` | `big`), `sort_order`.
- `clusters` — cụm: `name`, `slug` (anchor `#cum-1`), `nav_label`, `color_from/to`, `sort_order`, `is_published`.
- `units` — đơn vị thuộc cụm: `label`, `image_url`, `link_url`, `sort_order` (xoá cụm sẽ xoá theo).
- `media_items` — ảnh khối nổi bật: `caption`, `image_url`, `orientation`, `sort_order`.

RLS: ai cũng **đọc** được, chỉ tài khoản đăng nhập mới **ghi**.

## Triển khai

Deploy lên Vercel: import thư mục `phuong-xanh`, thêm 2 biến môi trường ở trên là xong.
Trang chủ render động (đọc cookie phiên) nên nội dung luôn mới sau khi sửa trong `/admin`.

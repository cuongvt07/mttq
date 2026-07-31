# Đặc tả module: Flip-book Builder (Tự thiết kế & xem sách lật)

## 1. Tổng quan

Module cho phép người dùng **tự thiết kế** từng trang sách (kéo thả text, ảnh vào một khung cố định, tùy chỉnh vị trí/font/màu), sau đó **xem lại dưới dạng sách lật trang**:

- **PC**: hiển thị sách mở 2 trang, khi lật trang cong lên và lật sang trái như sách thật.
- **Mobile**: mỗi trang chiếm toàn màn hình, điều hướng bằng vuốt trước/sau.

Module gồm 2 phần tách biệt, nối qua một lớp dữ liệu chung:

```
Trình soạn thảo → Dữ liệu trang (JSON) → Render engine → Viewer (PC / Mobile)
```

---

## 2. Trình soạn thảo (Canvas Editor)

### 2.1 Khung cố định
- Định trước tỉ lệ/kích thước trang (VD: 3:4, A4...) — chọn 1 lần khi tạo sách, áp dụng cho toàn bộ các trang.

### 2.2 Khối nội dung kéo thả
- **Text box**: kéo thả tự do, resize bằng handle góc, xoay.
- **Image block**: upload, kéo thả, resize, crop.
- Quản lý layer: đưa lên trước / đẩy xuống sau (z-index).

### 2.3 Thuộc tính chỉnh sửa
| Đối tượng | Thuộc tính |
|---|---|
| Text | font family, font size, màu chữ, độ đậm, căn lề, line-height |
| Ảnh | crop, bo góc, opacity, border |
| Trang | màu nền / ảnh nền |

### 2.4 Công cụ hỗ trợ
- Căn giữa / căn đều (align & distribute)
- Lưới snap khi kéo thả
- Undo / redo
- Autosave

### 2.5 Quản lý nhiều trang
- Thêm / xóa / duplicate / sắp xếp lại thứ tự trang

### 2.6 Công nghệ đề xuất
- **Fabric.js** hoặc **Konva.js** — canvas-based, có sẵn resize/rotate/drag, tránh phải tự viết hit-testing và transform từ đầu.

---

## 3. Cấu trúc dữ liệu (Data model)

Mỗi trang là một object JSON:

```json
{
  "pageId": "p1",
  "background": "#ffffff",
  "elements": [
    {
      "id": "e1",
      "type": "text",
      "x": 40, "y": 60, "w": 200,
      "fontSize": 18, "color": "#333333",
      "content": "..."
    },
    {
      "id": "e2",
      "type": "image",
      "x": 20, "y": 150, "w": 300, "h": 200,
      "src": "https://cdn.../image.jpg"
    }
  ]
}
```

Sách = mảng các trang này + metadata:

```json
{
  "bookId": "book_123",
  "title": "...",
  "pageRatio": "3:4",
  "pages": ["p1", "p2", "..."]
}
```

---

## 4. Render Engine

- **Dùng chung một logic render** cho cả lúc soạn thảo (editor) và lúc xem (viewer), để đảm bảo WYSIWYG — trang hiển thị đúng như lúc thiết kế.
- Input: dữ liệu trang (JSON) → Output: DOM/Canvas/SVG hiển thị.

---

## 5. Viewer

### 5.1 PC — spread view
- Hiển thị 2 trang mở song song như sách thật.
- Khi lật: trang bên phải cong lên, lật sang trái, lộ ra 2 trang kế tiếp (hiệu ứng 3D curl).
- Thư viện gợi ý: **react-pageflip** (dựa trên StPageFlip) hoặc **Turn.js**.

### 5.2 Mobile — single-page fullscreen
- Mỗi trang chiếm toàn màn hình (full-bleed, không viền).
- Điều hướng: vuốt trái → trang sau, vuốt phải → trang trước.
- Có thể dùng transition đơn giản (slide/fade) hoặc flip 1 lá nếu muốn giữ cảm giác "sách".
- `react-pageflip` có sẵn thuộc tính `usePortrait` để tự chuyển 2 trang → 1 trang khi màn hình hẹp.

### 5.3 Logic responsive
- Detect viewport width (breakpoint, VD < 768px = mobile).
- Tự động chuyển component giữa 2 chế độ, tính lại tỉ lệ trang để full-bleed trên mobile.

---

## 6. Backend & lưu trữ

- Lưu JSON của từng sách + ảnh upload lên storage/CDN (S3, Cloudflare...).
- API load/save khi người dùng chỉnh sửa (autosave định kỳ hoặc on-blur).
- Sinh slug/URL riêng cho mỗi sách để chia sẻ/embed.

---

## 7. Tổng hợp tech stack đề xuất

| Phần | Công nghệ |
|---|---|
| Canvas editor | React + Fabric.js hoặc Konva.js |
| Viewer (lật trang) | react-pageflip (StPageFlip), có `usePortrait` cho mobile |
| Lưu dữ liệu trang | JSON, lưu trong DB (PostgreSQL/MongoDB) |
| Lưu ảnh | S3 / Cloudflare R2 + CDN |
| Backend | Node.js + Express (hoặc tương đương) |

---

## 8. Đề xuất lộ trình triển khai

1. **Phase 1 — Editor cơ bản**: khung cố định, thêm/kéo thả text & ảnh, lưu JSON.
2. **Phase 2 — Viewer PC**: render JSON thành trang tĩnh, tích hợp hiệu ứng lật 2 trang.
3. **Phase 3 — Responsive mobile**: chế độ 1 trang toàn màn hình, vuốt trước/sau.
4. **Phase 4 — Hoàn thiện**: chia sẻ/embed, autosave, undo/redo, tối ưu hiệu năng ảnh.

---

## 9. Rủi ro kỹ thuật cần lưu ý

- Hiệu ứng CSS 3D transform (page curl) dễ có bug riêng trên Safari iOS — cần test kỹ.
- Đảm bảo render engine nhất quán giữa editor và viewer (tránh lệch font/vị trí khi xuất bản).
- Ảnh dung lượng lớn cần tối ưu (resize, lazy load) để tránh chậm khi có nhiều trang.

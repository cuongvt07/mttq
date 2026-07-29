import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phong trào Toàn dân chung tay bảo vệ môi trường - Vì Thủ đô xanh - sạch - đẹp",
  description: "Phong trào Toàn dân chung tay bảo vệ môi trường, vì Thủ đô xanh - sạch - đẹp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: một số extension trình duyệt chèn thêm attribute
    // vào <html>/<body> trước khi React hydrate.
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

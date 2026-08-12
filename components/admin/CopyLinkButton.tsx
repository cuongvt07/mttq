"use client";

import { useState } from "react";
import { toast } from "./Toast";

/**
 * Nút chép link công khai của một cuốn sách vào bộ nhớ tạm.
 *
 * Link được ghép từ origin thật lúc bấm, nên chạy đúng ở cả localhost, bản
 * preview của Vercel lẫn tên miền chính — không cần cấu hình biến môi trường.
 */
export default function CopyLinkButton({
  path,
  label = "Chép link",
}: {
  /** đường dẫn tương đối, ví dụ /sach/ban-tin-thang-7 */
  path: string;
  label?: string;
}) {
  const [justCopied, setJustCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Clipboard API cần ngữ cảnh bảo mật (https hoặc localhost). Khi mở
        // trang qua http trong mạng nội bộ thì phải lùi về cách cũ.
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("execCommand copy thất bại");
      }
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1800);
      toast(`Đã chép: ${url}`);
    } catch {
      // Không chép được thì ít nhất cho người dùng thấy link để tự bôi đen.
      toast(`Không chép được. Link: ${url}`, "error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Chép link đầy đủ của trang ${path}`}
      className="adm-btn adm-btn-sm adm-btn-ghost"
    >
      {justCopied ? "✓ Đã chép" : label}
    </button>
  );
}

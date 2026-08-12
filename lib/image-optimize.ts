/**
 * Nén ảnh ngay trên trình duyệt trước khi tải lên Supabase Storage.
 *
 * Ảnh chụp từ điện thoại hay máy scan thường 3-8 MB, trong khi trang sách rộng
 * 800px nên không bao giờ cần quá ~1600px. Nén trước giúp: tải lên nhanh hơn
 * nhiều, đỡ dung lượng lưu trữ, và người đọc tải trang nhẹ hơn hẳn.
 *
 * WebP nhỏ hơn JPEG khoảng 25-35% ở cùng chất lượng nhìn thấy và được mọi
 * trình duyệt hiện hành hỗ trợ. Nếu trình duyệt không mã hoá được WebP thì
 * lùi về JPEG, và nếu cả hai đều hỏng thì trả lại file gốc — không bao giờ
 * chặn người dùng tải ảnh lên.
 */

export type KetQuaNen = {
  file: File;
  /** kích thước pixel sau khi nén */
  width: number;
  height: number;
  bytesGoc: number;
  bytesMoi: number;
  /** true nếu đã thực sự nén, false nếu giữ nguyên file gốc */
  daNen: boolean;
};

const MAX_CANH = 1600; // đủ nét cho trang 800px kể cả màn hình 2x
const CHAT_LUONG = 0.82;

/** Đọc kích thước thật của ảnh, dùng cả cho việc giữ đúng tỉ lệ khi chèn. */
export async function kichThuocAnh(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await taoBitmap(file);
  const kt = { width: bitmap.width, height: bitmap.height };
  if ("close" in bitmap) bitmap.close();
  return kt;
}

async function taoBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // SVG và vài định dạng lạ không tạo được bitmap — rơi xuống <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Không đọc được ảnh"));
      img.src = url;
    });
    return img;
  } finally {
    // Giải phóng sau một nhịp để <img> kịp dùng xong
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function doiDuoi(ten: string, duoi: string) {
  return ten.replace(/\.[^.]+$/, "") + duoi;
}

export async function nenAnh(file: File): Promise<KetQuaNen> {
  const bytesGoc = file.size;
  const giuNguyen = (w = 0, h = 0): KetQuaNen => ({
    file,
    width: w,
    height: h,
    bytesGoc,
    bytesMoi: bytesGoc,
    daNen: false,
  });

  // SVG là ảnh vector, nén lại thành pixel là làm hỏng nó.
  if (file.type === "image/svg+xml") return giuNguyen();
  // GIF có thể là ảnh động; vẽ ra canvas sẽ mất phần động.
  if (file.type === "image/gif") return giuNguyen();

  let nguon: ImageBitmap | HTMLImageElement;
  try {
    nguon = await taoBitmap(file);
  } catch {
    return giuNguyen();
  }

  const wGoc = nguon.width;
  const hGoc = nguon.height;
  const tyLe = Math.min(1, MAX_CANH / Math.max(wGoc, hGoc));
  const w = Math.max(1, Math.round(wGoc * tyLe));
  const h = Math.max(1, Math.round(hGoc * tyLe));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return giuNguyen(wGoc, hGoc);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(nguon, 0, 0, w, h);
  if ("close" in nguon) nguon.close();

  const blob = await new Promise<Blob | null>((res) => {
    canvas.toBlob((b) => res(b), "image/webp", CHAT_LUONG);
  });
  const dung =
    blob && blob.type === "image/webp"
      ? { blob, duoi: ".webp" }
      : await new Promise<{ blob: Blob; duoi: string } | null>((res) => {
          canvas.toBlob((b) => res(b ? { blob: b, duoi: ".jpg" } : null), "image/jpeg", CHAT_LUONG);
        });

  // Ảnh nhỏ sẵn (icon, logo PNG trong suốt) đôi khi nén xong lại to hơn.
  if (!dung || dung.blob.size >= bytesGoc) return giuNguyen(wGoc, hGoc);

  return {
    file: new File([dung.blob], doiDuoi(file.name, dung.duoi), { type: dung.blob.type }),
    width: w,
    height: h,
    bytesGoc,
    bytesMoi: dung.blob.size,
    daNen: true,
  };
}

/** "2,4 MB → 310 KB (giảm 87%)" để báo cho người dùng thấy việc nén có tác dụng. */
export function moTaNen(k: KetQuaNen): string {
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
  if (!k.daNen) return kb(k.bytesGoc);
  const giam = Math.round((1 - k.bytesMoi / k.bytesGoc) * 100);
  return `${kb(k.bytesGoc)} → ${kb(k.bytesMoi)} (giảm ${giam}%)`;
}

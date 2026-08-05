"use client";

import { useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import AssetPicker from "./AssetPicker";

/**
 * Ô nhập ảnh: chọn từ thư viện ảnh đã cào, tải file lên Supabase Storage,
 * hoặc dán URL. Giá trị cuối nằm trong input[name] để server action đọc.
 */
export default function ImageField({
  name,
  defaultValue,
  label = "Ảnh",
  aspect = "4 / 3",
  previewMax,
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
  aspect?: string;
  /** giới hạn bề rộng khung xem trước, vd "140px" */
  previewMax?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      setValue(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tải ảnh thất bại");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="adm-field">
      <span>{label}</span>

      <div
        className="mb-2 grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 bg-cover bg-center text-xs text-slate-400"
        style={{
          aspectRatio: aspect,
          maxWidth: previewMax,
          backgroundImage: value ? `url('${value}')` : undefined,
        }}
      >
        {value ? null : "Chưa có ảnh"}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
          className="max-w-52 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs file:font-semibold"
        />
        <AssetPicker onPick={setValue} />
        {busy ? <span>Đang tải…</span> : null}
        {value ? (
          <button type="button" onClick={() => setValue("")} className="adm-btn adm-btn-sm adm-btn-ghost">
            Xoá ảnh
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <input
        type="text"
        name={name}
        value={value}
        placeholder="https://… hoặc /canva/….webp"
        onChange={(e) => setValue(e.target.value)}
        className="adm-input mt-2"
      />
    </div>
  );
}

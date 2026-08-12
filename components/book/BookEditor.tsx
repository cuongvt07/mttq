"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FONT_FAMILIES,
  PAGE_WIDTH,
  emptyPage,
  newImageElement,
  newTextElement,
  pageHeight,
  type BookElement,
  type BookPage,
  type BookWithPages,
  type ImageElement,
  type PageChrome,
  type TextElement,
} from "@/lib/book-types";
import { hitGiong, type Giong } from "@/lib/align-guides";
import { moTaNen, nenAnh } from "@/lib/image-optimize";
import { createClient } from "@/utils/supabase/client";
import { saveBookChrome, saveBookPages } from "@/app/admin/books/actions";
import { toast } from "@/components/admin/Toast";
import BackgroundPicker from "./BackgroundPicker";
import ChromePanel from "./ChromePanel";
import ElementToolbar from "./ElementToolbar";
import PageRenderer, { mapLegacyFont } from "./PageRenderer";

const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;

/** 8 điểm neo quanh khối, đặt tên theo hướng la bàn. */
type Neo = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const NEO_ALL: Neo[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
/** Khối chữ cao theo nội dung nên chỉ cho kéo ngang. */
const NEO_CHU: Neo[] = ["w", "e"];

const CON_TRO: Record<Neo, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

type Drag =
  | { mode: "move"; id: string; startX: number; startY: number; elX: number; elY: number }
  | {
      mode: "resize";
      id: string;
      neo: Neo;
      startX: number;
      startY: number;
      x: number;
      y: number;
      w: number;
      h: number;
      /** w/h lúc bắt đầu — ảnh giữ nguyên tỉ lệ này để không bị méo hay cắt */
      tyLe: number;
      giuTyLe: boolean;
    }
  | { mode: "rotate"; id: string; cx: number; cy: number; start: number; rotation: number };

/** Độ sáng tương đối theo WCAG; null nếu không đọc được mã màu. */
function doSang(mau: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(mau.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Đen hay trắng — cái nào ngược sáng với màu chữ thì chọn cái đó. */
function mauNguocSang(mauChu: string): string {
  const L = doSang(mauChu);
  return L !== null && L > 0.5 ? "#18202c" : "#ffffff";
}

/**
 * Nền cho ô đang gõ: chữ trắng trên nền trắng là lỗi hay gặp nhất khi soạn trên
 * ảnh nền tối. Nếu khối đã có nền riêng thì dùng luôn nền đó cho đúng WYSIWYG.
 */
function nenTuongPhan(mauChu: string, nenKhoi?: string): string {
  if (nenKhoi) return nenKhoi;
  const L = doSang(mauChu);
  if (L === null) return "rgba(255,255,255,.94)";
  return L > 0.5 ? "rgba(24,32,44,.92)" : "rgba(255,255,255,.94)";
}

const O_NHO = "flex flex-col gap-1 text-[0.72rem] font-bold tracking-wide text-slate-500 uppercase";
const O_INPUT =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none " +
  "focus:border-sky-400 focus:ring-2 focus:ring-sky-200";

const NUT = "adm-btn adm-btn-ghost";

export default function BookEditor({ book }: { book: BookWithPages }) {
  const [pages, setPages] = useState<BookPage[]>(book.pages.length ? book.pages : [emptyPage()]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** khối chữ đang được gõ trực tiếp trên trang */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [canvasWidth, setCanvasWidth] = useState(560);
  const [snapOn, setSnapOn] = useState(true);
  const [textHeights, setTextHeights] = useState<Record<string, number>>({});
  const [chrome, setChrome] = useState<PageChrome>(book.chrome);
  const [showChrome, setShowChrome] = useState(false);
  /** đường gióng đang hiện khi kéo khối */
  const [giong, setGiong] = useState<Giong | null>(null);

  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const past = useRef<BookPage[][]>([]);
  const future = useRef<BookPage[][]>([]);
  const dragRef = useRef<Drag | null>(null);
  const dragSnapshot = useRef<BookPage[] | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdRef = useRef<string | null | "bg">(null);
  /** vị trí bấm chuột xuống, để phân biệt "bấm chọn" với "kéo đi" */
  const pressRef = useRef<{ id: string; x: number; y: number; daChon: boolean } | null>(null);
  /** startEditing được khai báo bên dưới; giữ qua ref để listener pointerup gọi được */
  const startEditingRef = useRef<((id: string) => void) | null>(null);
  /** bắt hai lần bấm liên tiếp lên cùng một khối (dblclick không đáng tin khi React dựng lại node) */
  const lastClick = useRef<{ id: string; t: number }>({ id: "", t: 0 });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const H = pageHeight(book.page_ratio);
  const scale = canvasWidth / PAGE_WIDTH;
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const selected = page?.elements.find((e) => e.id === selectedId) ?? null;

  /* ------------------------------------------------------------ kích thước khung -- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const do_ = () => {
      // Vừa cả bề ngang lẫn chiều cao chỗ trống: trang thiết kế cao hết mức có
      // thể mà vẫn không đẩy nội dung tràn xuống dưới màn hình.
      const availW = el.clientWidth - 24;
      const availH = el.clientHeight - 24;
      if (availW <= 0 || availH <= 0) return;
      const theoCao = (availH * PAGE_WIDTH) / H;
      setCanvasWidth(Math.max(240, Math.floor(Math.min(availW, theoCao))));
    };
    do_();
    const ro = new ResizeObserver(do_);
    ro.observe(el);
    return () => ro.disconnect();
  }, [H]);

  /* --------------------------------------------------------------- lưu / autosave -- */
  /** quiet = tự lưu ngầm, không bắn toast (trạng thái góc phải đã báo rồi) */
  const persist = useCallback(
    async (next: BookPage[], quiet = false) => {
      setStatus("saving");
      const res = await saveBookPages(book.id, next);
      if (res.ok) {
        dirty.current = false;
        setStatus("saved");
        setMessage("");
        if (!quiet) toast("Đã lưu");
      } else {
        setStatus("error");
        setMessage(res.error);
        toast("Lưu thất bại: " + res.error, "error");
      }
    },
    [book.id],
  );

  const scheduleSave = useCallback(
    (next: BookPage[]) => {
      dirty.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(next, true), 1200);
    },
    [persist],
  );

  const commit = useCallback(
    (updater: (prev: BookPage[]) => BookPage[], { history = true } = {}) => {
      setPages((prev) => {
        const next = updater(prev);
        if (history) {
          past.current = [...past.current.slice(-49), prev];
          future.current = [];
        }
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const patchChrome = useCallback(
    (patch: Partial<PageChrome>) => {
      setChrome((prev) => {
        const next = { ...prev, ...patch };
        if (chromeTimer.current) clearTimeout(chromeTimer.current);
        chromeTimer.current = setTimeout(async () => {
          setStatus("saving");
          const res = await saveBookChrome(book.id, next);
          setStatus(res.ok ? "saved" : "error");
          if (!res.ok) setMessage(res.error);
        }, 900);
        return next;
      });
    },
    [book.id],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return toast("Không còn gì để hoàn tác", "info");
    toast("Đã hoàn tác", "info");
    setPages((cur) => {
      future.current = [...future.current, cur];
      scheduleSave(prev);
      return prev;
    });
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return toast("Không còn gì để làm lại", "info");
    toast("Đã làm lại", "info");
    setPages((cur) => {
      past.current = [...past.current, cur];
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  /* ------------------------------------------------------- đo chiều cao khối chữ -- */
  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;

    const measure = () => {
      const next: Record<string, number> = {};
      root.querySelectorAll<HTMLElement>("[data-el-id]").forEach((n) => {
        next[n.dataset.elId!] = n.offsetHeight;
      });
      setTextHeights((prev) => {
        const keys = Object.keys(next);
        const same =
          keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === next[k]);
        return same ? prev : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    root.querySelectorAll<HTMLElement>("[data-el-id]").forEach((n) => ro.observe(n));
    return () => ro.disconnect();
  }, [pages, pageIndex, canvasWidth]);

  /* ------------------------------------------------------------- thao tác element -- */
  const patchElement = useCallback(
    (id: string, patch: Partial<BookElement>, history = true) => {
      commit(
        (prev) =>
          prev.map((p, i) =>
            i !== pageIndex
              ? p
              : {
                  ...p,
                  elements: p.elements.map((e) =>
                    e.id === id ? ({ ...e, ...patch } as BookElement) : e,
                  ),
                },
          ),
        { history },
      );
    },
    [commit, pageIndex],
  );

  /**
   * Khối chữ mới trải hết bề ngang dùng được của trang.
   *
   * Lề lấy từ chrome.margin — chính là "lề trong tính từ mép trang" mà sách đã
   * tự khai báo và người soạn đã chỉnh cho khớp hoạ tiết viền, nên không phải
   * đoán một con số cứng. Sách hiện tại đang để 60 (một cuốn 52).
   */
  const themKhoiChu = () => {
    const le = Math.max(0, Math.round(chrome.margin ?? 0));
    const rong = Math.max(80, PAGE_WIDTH - le * 2);
    // Nếu đầu trang đang bật thì hạ xuống dưới dải đó, khỏi đè lên nhau.
    const dinh = chrome.header?.enabled
      ? le + (chrome.header.offset ?? 0) + Math.round(chrome.header.fontSize * 1.2) + 16
      : le;
    addElement(newTextElement({ x: le, w: rong, y: dinh }));
  };

  const addElement = (el: BookElement) => {
    toast(el.type === "text" ? "Đã thêm khối chữ" : "Đã thêm ảnh");
    commit((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, el] } : p)),
    );
    setSelectedId(el.id);
  };

  const removeElement = (id: string) => {
    toast("Đã xoá khối", "info");
    commit((prev) =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, elements: p.elements.filter((e) => e.id !== id) } : p,
      ),
    );
    setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = page.elements.find((e) => e.id === id);
    if (!el) return;
    addElement({ ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 } as BookElement);
    toast("Đã nhân bản khối");
  };

  const moveLayer = (id: string, dir: -1 | 1) => {
    commit((prev) =>
      prev.map((p, i) => {
        if (i !== pageIndex) return p;
        const list = [...p.elements];
        const idx = list.findIndex((e) => e.id === id);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= list.length) return p;
        [list[idx], list[target]] = [list[target], list[idx]];
        return { ...p, elements: list };
      }),
    );
  };

  /* ------------------------------------------------------------------ tải ảnh -- */
  /**
   * Nén ngay trên máy rồi mới tải lên. Ảnh gốc từ điện thoại thường 3-8 MB mà
   * trang sách chỉ rộng 800px, nên nén xuống WebP ~1600px vừa tải nhanh hơn hẳn
   * vừa nhẹ cho người đọc. onDone nhận thêm kích thước thật để chèn ảnh đúng
   * tỉ lệ gốc, không bị cắt.
   */
  const uploadImage = async (
    file: File,
    onDone: (url: string, kt: { width: number; height: number }) => void,
  ) => {
    setStatus("saving");
    try {
      const nen = await nenAnh(file);
      const supabase = createClient();
      const ext = nen.file.name.split(".").pop()?.toLowerCase() || "webp";
      const path = `books/${book.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, nen.file, { contentType: nen.file.type, cacheControl: "31536000" });
      if (error) throw error;
      onDone(supabase.storage.from("media").getPublicUrl(path).data.publicUrl, {
        width: nen.width,
        height: nen.height,
      });
      setStatus("idle");
      toast(`Đã tải ảnh lên · ${moTaNen(nen)}`);
    } catch (err) {
      setStatus("error");
      const loi = err instanceof Error ? err.message : "Tải ảnh thất bại";
      setMessage(loi);
      toast(loi, "error");
    }
  };

  /**
   * mở hộp chọn ảnh.
   *   null      → thêm ảnh mới vào trang
   *   "bg"      → dùng làm nền cho trang hiện tại
   *   <id khối> → thay ảnh của khối đó
   */
  const pickImage = (replaceId: string | null | "bg") => {
    replaceIdRef.current = replaceId;
    fileRef.current?.click();
  };

  /** Chèn ảnh mới đúng tỉ lệ gốc, co vừa bề ngang trang nếu quá to. */
  const chenAnhTheoTyLe = (url: string, kt: { width: number; height: number }) => {
    const rong = Math.min(kt.width || 400, PAGE_WIDTH - 160);
    const cao = kt.width ? Math.round((rong * kt.height) / kt.width) : 300;
    addElement(
      newImageElement(url, {
        w: Math.round(rong),
        h: cao,
        x: Math.round((PAGE_WIDTH - rong) / 2),
        y: 120,
        // contain: thà chừa viền còn hơn cắt mất nội dung ảnh
        fit: "contain",
      }),
    );
  };

  /* ------------------------------------------------------------------ kéo thả -- */
  const toPageCoords = (e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  useEffect(() => {
    // Chuột bắn ra tới hơn 100 sự kiện/giây, mà mỗi lần xử lý là dựng lại cả
    // trang. Gộp về đúng một lần mỗi khung hình cho thao tác kéo mượt hẳn.
    let rafId = 0;
    let choXuLy: PointerEvent | null = null;

    const onMoveRaw = (e: PointerEvent) => {
      if (!dragRef.current) return;
      choXuLy = e;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const ev = choXuLy;
        choXuLy = null;
        if (ev) onMove(ev);
      });
    };

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !canvasRef.current) return;
      const p = toPageCoords(e);

      if (d.mode === "move") {
        const nx = d.elX + (p.x - d.startX);
        const ny = d.elY + (p.y - d.startY);

        const els = pages[pageIndex]?.elements ?? [];
        const dangKeo = els.find((x) => x.id === d.id);
        const caoCua = (e: BookElement) =>
          e.type !== "text" ? e.h : (textHeights[e.id] ?? 40);
        const w = dangKeo?.w ?? 0;
        const h = dangKeo ? caoCua(dangKeo) : 0;

        const kq = hitGiong(
          nx,
          ny,
          w,
          h,
          els.filter((e) => e.id !== d.id).map((e) => ({ x: e.x, y: e.y, w: e.w, h: caoCua(e) })),
          PAGE_WIDTH,
          H,
        );

        // Đường gióng thắng bám lưới: đã thẳng hàng với khối khác rồi thì đừng
        // để lưới 10px kéo lệch đi mất.
        const coDoc = kq.giong.doc.length > 0;
        const coNgang = kq.giong.ngang.length > 0;
        setGiong(coDoc || coNgang ? kq.giong : null);

        patchElement(
          d.id,
          {
            x: coDoc ? Math.round(kq.x) : snapOn ? snap(nx) : Math.round(nx),
            y: coNgang ? Math.round(kq.y) : snapOn ? snap(ny) : Math.round(ny),
          },
          false,
        );
      } else if (d.mode === "resize") {
        const dx = p.x - d.startX;
        const dy = p.y - d.startY;
        const el = pages[pageIndex].elements.find((x) => x.id === d.id);
        const laChu = el?.type === "text";

        // Kéo cạnh nào thì cạnh đối diện đứng yên.
        let x = d.x;
        let y = d.y;
        let w = d.w;
        let h = d.h;
        if (d.neo.includes("e")) w = d.w + dx;
        if (d.neo.includes("w")) {
          w = d.w - dx;
          x = d.x + dx;
        }
        if (d.neo.includes("s")) h = d.h + dy;
        if (d.neo.includes("n")) {
          h = d.h - dy;
          y = d.y + dy;
        }

        w = Math.max(24, w);
        h = Math.max(20, h);

        if (d.giuTyLe) {
          // Ảnh luôn giữ đúng tỉ lệ gốc. Cạnh nào người dùng kéo thì cạnh đó
          // dẫn, cạnh kia suy ra — nhờ vậy ảnh không bao giờ bị bóp méo.
          const ngang = d.neo === "e" || d.neo === "w";
          const doc = d.neo === "n" || d.neo === "s";
          if (ngang) h = w / d.tyLe;
          else if (doc) w = h * d.tyLe;
          else if (Math.abs(dx) > Math.abs(dy)) h = w / d.tyLe;
          else w = h * d.tyLe;

          // giữ nguyên mép đối diện sau khi đã ép tỉ lệ
          if (d.neo.includes("w")) x = d.x + (d.w - w);
          if (d.neo.includes("n")) y = d.y + (d.h - h);
        }

        const lam = (v: number) => (snapOn ? snap(v) : Math.round(v));
        patchElement(
          d.id,
          laChu
            ? { x: lam(x), w: lam(w) } // khối chữ cao theo nội dung
            : { x: lam(x), y: lam(y), w: lam(w), h: lam(h) },
          false,
        );
      } else if (d.mode === "rotate") {
        const angle = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI;
        let deg = Math.round(d.rotation + (angle - d.start));
        if (snapOn) deg = Math.round(deg / 5) * 5;
        patchElement(d.id, { rotation: deg }, false);
      }
    };

    const onUp = (e: PointerEvent) => {
      setGiong(null);
      // Bấm rồi thả gần như tại chỗ lên một khối chữ ĐANG được chọn = muốn sửa
      // nội dung. Nhờ xét ở pointerup và đo quãng di chuyển nên vẫn kéo khối
      // bình thường được, không phải bấm hai lần thật nhanh như trước.
      const press = pressRef.current;
      pressRef.current = null;
      if (press && press.daChon) {
        const xa = Math.hypot(e.clientX - press.x, e.clientY - press.y);
        if (xa < 5) {
          const el = pages[pageIndex]?.elements.find((x) => x.id === press.id);
          if (el?.type === "text") {
            dragRef.current = null;
            dragSnapshot.current = null;
            startEditingRef.current?.(press.id);
            return;
          }
        }
      }

      if (!dragRef.current) return;
      dragRef.current = null;
      if (dragSnapshot.current) {
        past.current = [...past.current.slice(-49), dragSnapshot.current];
        future.current = [];
        dragSnapshot.current = null;
      }
      scheduleSave(pages);
    };

    window.addEventListener("pointermove", onMoveRaw);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMoveRaw);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [patchElement, pages, pageIndex, scale, snapOn, scheduleSave]);

  const startDrag = (e: React.PointerEvent, d: Omit<Drag, "startX" | "startY">) => {
    e.stopPropagation();
    if (editingId) return;
    dragSnapshot.current = pages;
    const p = toPageCoords(e);
    dragRef.current = { ...d, startX: p.x, startY: p.y } as Drag;
  };

  /* ------------------------------------------------------------- sửa chữ tại chỗ -- */
  const startEditing = (id: string) => {
    setSelectedId(id);
    setEditingId(id);
  };
  startEditingRef.current = startEditing;

  useEffect(() => {
    if (!editingId) return;
    const node = editorRef.current;
    const el = page.elements.find((e) => e.id === editingId);
    if (!node || !el || el.type !== "text") return;

    node.innerText = el.content;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopEditing = () => {
    const node = editorRef.current;
    if (node && editingId) patchElement(editingId, { content: node.innerText });
    setEditingId(null);
  };

  /* ----------------------------------------------------------------- phím tắt -- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (!selectedId || !selected) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeElement(selectedId);
        return;
      }
      if (e.key === "Enter" && selected.type === "text") {
        e.preventDefault();
        startEditing(selectedId);
        return;
      }

      const step = e.shiftKey ? GRID : 1;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const delta = nudge[e.key];
      if (delta) {
        e.preventDefault();
        patchElement(selectedId, { x: selected.x + delta[0], y: selected.y + delta[1] });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selected, patchElement, undo, redo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* --------------------------------------------------------------------- trang -- */
  const addPage = () => {
    commit((prev) => [...prev.slice(0, pageIndex + 1), emptyPage(), ...prev.slice(pageIndex + 1)]);
    setPageIndex((i) => i + 1);
    setSelectedId(null);
    toast("Đã thêm trang mới");
  };

  const duplicatePage = () => {
    const copy: BookPage = {
      ...page,
      id: crypto.randomUUID(),
      elements: page.elements.map((e) => ({ ...e, id: crypto.randomUUID() })),
    };
    commit((prev) => [...prev.slice(0, pageIndex + 1), copy, ...prev.slice(pageIndex + 1)]);
    setPageIndex((i) => i + 1);
    toast("Đã nhân bản trang");
  };

  const deletePage = () => {
    if (pages.length === 1) return;
    if (!window.confirm(`Xoá trang ${pageIndex + 1}?`)) return;
    commit((prev) => prev.filter((_, i) => i !== pageIndex));
    setPageIndex((i) => Math.max(0, i - 1));
    setSelectedId(null);
    toast("Đã xoá trang", "info");
  };

  const movePage = (dir: -1 | 1) => {
    const target = pageIndex + dir;
    if (target < 0 || target >= pages.length) return;
    commit((prev) => {
      const list = [...prev];
      [list[pageIndex], list[target]] = [list[target], list[pageIndex]];
      return list;
    });
    setPageIndex(target);
  };

  const statusText = useMemo(() => {
    if (status === "saving") return "Đang lưu…";
    if (status === "saved") return "Đã lưu ✓";
    if (status === "error") return `Lỗi: ${message}`;
    return "Sẵn sàng";
  }, [status, message]);

  if (!page) return null;

  const selBox = selected
    ? {
        left: selected.x * scale,
        top: selected.y * scale,
        width: selected.w * scale,
        height:
          (selected.type !== "text" ? selected.h : (textHeights[selected.id] ?? 40)) * scale,
      }
    : null;

  /** Các lớp phủ lên trang: vùng bắt sự kiện, 8 điểm neo, nút xoay, ô gõ chữ. */
  const canvasLayers = (
    <>
      <div className="absolute inset-0">
        {page.elements.map((el) => {
          const isSel = el.id === selectedId;
          const h = el.type !== "text" ? el.h : textHeights[el.id];
          return (
            <div
              key={el.id}
              onPointerDown={(e) => {
                const daChon = selectedId === el.id;
                setSelectedId(el.id);
                if (editingId && editingId !== el.id) stopEditing();

                // Ghi lại điểm bấm; pointerup mới quyết định đây là bấm để sửa
                // hay chỉ là bắt đầu kéo.
                pressRef.current = { id: el.id, x: e.clientX, y: e.clientY, daChon };

                // Ảnh: bấm lần nữa vào ảnh đang chọn thì mở hộp đổi ảnh.
                if (daChon && el.type === "image") {
                  const now = Date.now();
                  const nhanh = lastClick.current.id === el.id && now - lastClick.current.t < 800;
                  lastClick.current = { id: el.id, t: now };
                  if (nhanh) {
                    e.preventDefault();
                    e.stopPropagation();
                    pressRef.current = null;
                    pickImage(el.id);
                    return;
                  }
                }
                lastClick.current = { id: el.id, t: Date.now() };

                startDrag(e, { mode: "move", id: el.id, elX: el.x, elY: el.y } as Drag);
              }}
              style={{
                position: "absolute",
                left: el.x * scale,
                top: el.y * scale,
                width: el.w * scale,
                height: h ? h * scale : 24 * scale,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                transformOrigin: "center center",
                cursor: editingId === el.id ? "text" : "move",
                touchAction: "none",
                outline: isSel ? "2px solid #1667b8" : "1px dashed rgba(22,103,184,.30)",
              }}
            />
          );
        })}
      </div>

      {/* đường gióng — chỉ hiện trong lúc kéo */}
      {giong
        ? [
            ...giong.doc.map((v) => (
              <span
                key={`d${v}`}
                className="pointer-events-none absolute z-30 bg-fuchsia-500"
                style={{ left: v * scale, top: 0, width: 1, bottom: 0 }}
              />
            )),
            ...giong.ngang.map((v) => (
              <span
                key={`n${v}`}
                className="pointer-events-none absolute z-30 bg-fuchsia-500"
                style={{ top: v * scale, left: 0, height: 1, right: 0 }}
              />
            )),
          ]
        : null}

      {/* nút xoay + 8 điểm neo của khối đang chọn */}
      {selected && selBox && !editingId ? (
        <>
          <span
            onPointerDown={(e) => {
              const rect = canvasRef.current!.getBoundingClientRect();
              const cx = selected.x + selected.w / 2;
              const cy =
                selected.y +
                (selected.type !== "text" ? selected.h : (textHeights[selected.id] ?? 40)) / 2;
              startDrag(e, {
                mode: "rotate",
                id: selected.id,
                cx,
                cy,
                rotation: selected.rotation,
                start:
                  (Math.atan2(
                    (e.clientY - rect.top) / scale - cy,
                    (e.clientX - rect.left) / scale - cx,
                  ) *
                    180) /
                  Math.PI,
              } as unknown as Drag);
            }}
            title="Kéo để xoay"
            className="absolute z-20 size-5 cursor-grab rounded-full border-2 border-white bg-brand shadow-md transition-transform hover:scale-110"
            style={{
              left: selBox.left + selBox.width / 2 - 10,
              top: selBox.top - 30,
              touchAction: "none",
            }}
          />
          {(selected.type === "text" ? NEO_CHU : NEO_ALL).map((neo) => {
            const cao = selected.type !== "text" ? selected.h : (textHeights[selected.id] ?? 40);
            // vị trí điểm neo theo hướng la bàn, quy về 0 / 0.5 / 1
            const fx = neo.includes("w") ? 0 : neo.includes("e") ? 1 : 0.5;
            const fy = neo.includes("n") ? 0 : neo.includes("s") ? 1 : 0.5;
            return (
              <span
                key={neo}
                onPointerDown={(e) =>
                  startDrag(e, {
                    mode: "resize",
                    id: selected.id,
                    neo,
                    x: selected.x,
                    y: selected.y,
                    w: selected.w,
                    h: cao,
                    tyLe: cao > 0 ? selected.w / cao : 1,
                    // ảnh giữ tỉ lệ gốc để không bị méo hay cắt
                    giuTyLe: selected.type === "image",
                  } as Drag)
                }
                title="Kéo để đổi kích thước"
                className="absolute z-20 size-3.5 rounded-[3px] border-2 border-white bg-brand shadow-md transition-transform hover:scale-125"
                style={{
                  left: selBox.left + selBox.width * fx - 7,
                  top: selBox.top + selBox.height * fy - 7,
                  cursor: CON_TRO[neo],
                  touchAction: "none",
                }}
              />
            );
          })}
        </>
      ) : null}

      {/* gõ chữ ngay trên trang */}
      {editingId && selected?.type === "text" ? (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPointerDown={(e) => e.stopPropagation()}
          onBlur={stopEditing}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLElement).blur();
          }}
          style={{
            position: "absolute",
            zIndex: 25,
            left: selected.x * scale,
            top: selected.y * scale,
            width: selected.w * scale,
            fontSize: selected.fontSize * scale,
            // phải trùng font lúc render, nếu không ô đang gõ ngắt dòng một kiểu
            // mà kết quả lại ra kiểu khác
            fontFamily: mapLegacyFont(selected.fontFamily),
            color: selected.color,
            fontWeight: selected.bold ? 700 : 400,
            fontStyle: selected.italic ? "italic" : "normal",
            textAlign: selected.align,
            lineHeight: selected.lineHeight,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            // nền chọn theo độ sáng của màu chữ — chữ trắng trên nền ảnh tối
            // trước đây gõ vào là mất hút vì nền ô luôn màu trắng
            background: nenTuongPhan(selected.color, selected.bg),
            outline: "2px solid #1667b8",
            // khớp đệm với lúc hiển thị, nếu không chữ nhảy vị trí khi bắt đầu gõ
            ...(selected.bg
              ? { padding: "0.14em 0.36em", borderRadius: "0.16em", boxSizing: "border-box" as const }
              : { padding: 0, borderRadius: 2 }),
          }}
        />
      ) : null}
    </>
  );

  return (
    // [danh sách trang][khung thiết kế][bảng thuộc tính]
    // Khoá chiều cao theo màn hình rồi cho mỗi cột tự cuộn bên trong, nhờ vậy
    // khung thiết kế luôn cao hết mức và cả trang không phải cuộn dọc.
    <div
      data-wide
      className="grid gap-3 xl:h-[calc(100svh-200px)] xl:min-h-[520px] xl:grid-cols-[176px_minmax(0,1fr)_340px]"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const dich = replaceIdRef.current;
          if (f) {
            void uploadImage(f, (url, kt) => {
              if (dich === "bg") {
                // Nền phủ kín khung trang: PageRenderer đã đặt background-size:
                // cover + position: center nên ảnh luôn căn khít, không lộ mép.
                commit((prev) =>
                  prev.map((p, i) => (i === pageIndex ? { ...p, background_image: url } : p)),
                );
                toast("Đã dùng ảnh làm nền trang");
              } else if (dich) {
                // Đổi ảnh của khối sẵn có: cập nhật luôn chiều cao theo tỉ lệ
                // ảnh mới để khỏi bị bóp méo so với ảnh cũ.
                const cu = page.elements.find((x) => x.id === dich);
                const w = cu && cu.type === "image" ? cu.w : 400;
                patchElement(dich, {
                  src: url,
                  ...(kt.width ? { h: Math.round((w * kt.height) / kt.width) } : {}),
                });
              } else {
                chenAnhTheoTyLe(url, kt);
              }
            });
          }
          e.target.value = "";
        }}
      />

      {/* ------------------------------------------------------------ danh sách trang */}
      <aside className="order-2 flex min-h-0 flex-col xl:order-1">
        <div className="mb-2 flex shrink-0 items-center gap-2">
          <b className="text-sm">Trang ({pages.length})</b>
          <button type="button" onClick={addPage} className="adm-btn adm-btn-sm ml-auto">
            + Thêm
          </button>
        </div>

        <div className="flex flex-1 gap-2 overflow-x-auto xl:min-h-0 xl:flex-col xl:overflow-x-visible xl:overflow-y-auto">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPageIndex(i);
                setSelectedId(null);
                setEditingId(null);
              }}
              className={`relative shrink-0 cursor-pointer rounded-lg border-2 bg-white p-1 transition ${
                i === pageIndex ? "border-brand" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <PageRenderer
                page={p}
                ratio={book.page_ratio}
                width={126}
                chrome={chrome}
                pageNumber={i + 1}
                totalPages={pages.length}
              />
              <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 text-[0.65rem] font-bold text-white">
                {i + 1}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 grid shrink-0 grid-cols-2 gap-1.5">
          <button type="button" onClick={() => movePage(-1)} className="adm-btn adm-btn-sm adm-btn-ghost">
            ↑ Lên
          </button>
          <button type="button" onClick={() => movePage(1)} className="adm-btn adm-btn-sm adm-btn-ghost">
            ↓ Xuống
          </button>
          <button type="button" onClick={duplicatePage} className="adm-btn adm-btn-sm adm-btn-ghost">
            Nhân bản
          </button>
          <button type="button" onClick={deletePage} className="adm-btn adm-btn-sm adm-btn-danger">
            Xoá trang
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- canvas */}
      <div className="order-1 flex min-w-0 min-h-0 flex-col xl:order-2">
        {/* hàng nút chính */}
        <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={themKhoiChu} className={NUT}>
            ➕ Thêm chữ
          </button>
          <button type="button" onClick={() => pickImage(null)} className={NUT}>
            🖼️ Thêm ảnh
          </button>
          <button type="button" onClick={undo} className={NUT} title="Ctrl+Z">
            ↶ Hoàn tác
          </button>
          <button type="button" onClick={redo} className={NUT} title="Ctrl+Shift+Z">
            ↷ Làm lại
          </button>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={snapOn}
              onChange={(e) => setSnapOn(e.target.checked)}
              className="size-4"
            />
            Bám lưới
          </label>
          <span
            className={`ml-auto text-sm font-semibold ${
              status === "error" ? "text-red-600" : "text-slate-500"
            }`}
          >
            {statusText}
          </span>
          <button type="button" onClick={() => void persist(pages)} className={NUT}>
            💾 Lưu ngay
          </button>
        </div>

        {/* thanh công cụ của khối đang chọn */}
        {selected ? (
          <div className="mb-2 h-[60px] shrink-0">
            <ElementToolbar
              el={selected}
              onChange={(patch) => patchElement(selected.id, patch)}
              onEditText={() => startEditing(selected.id)}
              onReplaceImage={() => pickImage(selected.id)}
              onDuplicate={() => duplicateElement(selected.id)}
              onDelete={() => removeElement(selected.id)}
              onLayer={(dir) => moveLayer(selected.id, dir)}
            />
          </div>
        ) : (
          <div className="mb-2 h-[60px] shrink-0" aria-hidden />
        )}

        <div
          ref={wrapRef}
          className="flex min-h-[320px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-slate-200 p-3"
        >
          <div
            ref={canvasRef}
            className="relative shadow-lg"
            onPointerDown={() => {
              if (editingId) stopEditing();
              setSelectedId(null);
            }}
          >
            <PageRenderer
              page={page}
              ratio={book.page_ratio}
              width={canvasWidth}
              chrome={chrome}
              pageNumber={pageIndex + 1}
              totalPages={pages.length}
            />
            {canvasLayers}
          </div>
        </div>

        <p className="mt-1.5 shrink-0 text-center text-xs text-slate-500">
          Trang {pageIndex + 1}/{pages.length} · khung {PAGE_WIDTH}×{H} · bấm chọn rồi bấm lần nữa
          vào khối chữ để sửa · kéo 8 ô vuông để đổi cỡ · Delete để xoá
        </p>
      </div>

      {/* --------------------------------------------------------- bảng thuộc tính */}
      <aside className="order-3 flex min-h-0 flex-col gap-2 overflow-y-auto xl:pr-0.5">
        {/* ------------------------------------------------ chọn nền trang bằng mẫu */}
        <details className="group shrink-0 rounded-xl border border-slate-200 bg-white" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700">
            <span className="transition group-open:rotate-90">▸</span>
            Nền trang {pageIndex + 1}
          </summary>
          <div className="border-t border-slate-200 px-3 py-2.5">
            <button
              type="button"
              onClick={() => pickImage("bg")}
              className="adm-btn adm-btn-sm adm-btn-ghost mb-2 w-full justify-center"
            >
              ⬆️ Tải ảnh làm nền trang này
            </button>
            {page.background_image ? (
              <button
                type="button"
                onClick={() =>
                  commit((prev) =>
                    prev.map((p, i) => (i === pageIndex ? { ...p, background_image: null } : p)),
                  )
                }
                className="adm-btn adm-btn-sm adm-btn-ghost mb-2 w-full justify-center"
              >
                ✕ Bỏ ảnh nền
              </button>
            ) : null}
            <BackgroundPicker
              current={page.background_image}
              onPick={(t) => {
                commit((prev) =>
                  prev.map((p, i) =>
                    i === pageIndex ? { ...p, background: t.background, background_image: t.image } : p,
                  ),
                );
                toast(`Nền trang: ${t.ten}`);
              }}
              onPickAll={(t) => {
                commit((prev) =>
                  prev.map((p) => ({ ...p, background: t.background, background_image: t.image })),
                );
                toast(`Đã dùng nền "${t.ten}" cho ${pages.length} trang`);
              }}
            />
          </div>
        </details>

        {/* --------------------------------------------- thuộc tính khối đang chọn */}
        <details className="group shrink-0 rounded-xl border border-slate-200 bg-white" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700">
            <span className="transition group-open:rotate-90">▸</span>
            Thuộc tính khối
          </summary>

          {/* Cột hẹp nên xếp dọc, không còn phải nhồi thành một hàng ngang */}
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5 border-t border-slate-200 px-3 py-2.5">
            {selected?.type === "text" ? (
              <>
                <label className={`${O_NHO} min-w-44`}>
                  <span>Phông chữ</span>
                  <select
                    value={(selected as TextElement).fontFamily}
                    onChange={(e) => patchElement(selected.id, { fontFamily: e.target.value })}
                    className={O_INPUT}
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={O_NHO}>
                  <span>Giãn dòng</span>
                  <input
                    type="number"
                    step={0.05}
                    value={(selected as TextElement).lineHeight}
                    onChange={(e) => patchElement(selected.id, { lineHeight: Number(e.target.value) })}
                    className={`${O_INPUT} w-20`}
                  />
                </label>
                <div className={O_NHO}>
                  <span>Nền sau chữ</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selected as TextElement).bg ?? "#ffffff"}
                      onChange={(e) => patchElement(selected.id, { bg: e.target.value })}
                      title="Chọn màu nền tô sau chữ"
                      className="h-9 w-12 rounded border border-slate-200 bg-white p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patchElement(selected.id, {
                          bg: mauNguocSang((selected as TextElement).color),
                        })
                      }
                      title="Tự chọn nền đen hoặc trắng ngược với màu chữ"
                      className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold hover:bg-slate-100"
                    >
                      Tự tương phản
                    </button>
                    {(selected as TextElement).bg ? (
                      <button
                        type="button"
                        onClick={() => patchElement(selected.id, { bg: undefined })}
                        title="Bỏ nền, để trong suốt"
                        className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>
                <label className={`${O_NHO} min-w-48`}>
                  <span>Link khi bấm vào</span>
                  <input
                    type="text"
                    value={(selected as TextElement).href ?? ""}
                    placeholder="https://…"
                    onChange={(e) => patchElement(selected.id, { href: e.target.value || undefined })}
                    className={O_INPUT}
                  />
                </label>
              </>
            ) : null}

            {selected?.type === "image" ? (
              <>
                <label className={O_NHO}>
                  <span>Rộng</span>
                  <input
                    type="number"
                    value={(selected as ImageElement).w}
                    onChange={(e) => patchElement(selected.id, { w: Number(e.target.value) })}
                    className={`${O_INPUT} w-20`}
                  />
                </label>
                <label className={O_NHO}>
                  <span>Cao</span>
                  <input
                    type="number"
                    value={(selected as ImageElement).h}
                    onChange={(e) => patchElement(selected.id, { h: Number(e.target.value) })}
                    className={`${O_INPUT} w-20`}
                  />
                </label>
                <label className={O_NHO}>
                  <span>Viền</span>
                  <input
                    type="number"
                    min={0}
                    value={(selected as ImageElement).borderWidth}
                    onChange={(e) => patchElement(selected.id, { borderWidth: Number(e.target.value) })}
                    className={`${O_INPUT} w-16`}
                  />
                </label>
                <label className={O_NHO}>
                  <span>Màu viền</span>
                  <input
                    type="color"
                    value={(selected as ImageElement).borderColor}
                    onChange={(e) => patchElement(selected.id, { borderColor: e.target.value })}
                    className="h-9 w-14 rounded border border-slate-200 bg-white p-0.5"
                  />
                </label>
              </>
            ) : null}

            {selected ? (
              <>
                <label className={O_NHO}>
                  <span>Ngang (X)</span>
                  <input
                    type="number"
                    value={selected.x}
                    onChange={(e) => patchElement(selected.id, { x: Number(e.target.value) })}
                    className={`${O_INPUT} w-20`}
                  />
                </label>
                <label className={O_NHO}>
                  <span>Dọc (Y)</span>
                  <input
                    type="number"
                    value={selected.y}
                    onChange={(e) => patchElement(selected.id, { y: Number(e.target.value) })}
                    className={`${O_INPUT} w-20`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    patchElement(selected.id, { x: Math.round((PAGE_WIDTH - selected.w) / 2) })
                  }
                  className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-100"
                >
                  Căn giữa khối
                </button>
              </>
            ) : (
              <span className="self-center text-sm text-slate-400">
                Chọn một khối để chỉnh phông chữ, kích thước, vị trí…
              </span>
            )}

            <button
              type="button"
              onClick={() => setShowChrome((v) => !v)}
              className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold hover:bg-slate-100"
            >
              {showChrome ? "Ẩn đầu/chân trang" : "Đầu / chân trang…"}
            </button>
          </div>

          {showChrome ? (
            <div className="border-t border-slate-200 p-3">
              <ChromePanel chrome={chrome} onChange={patchChrome} />
            </div>
          ) : null}
        </details>

      </aside>
    </div>
  );
}

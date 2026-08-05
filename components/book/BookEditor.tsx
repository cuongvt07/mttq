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
import { createClient } from "@/utils/supabase/client";
import { saveBookChrome, saveBookPages } from "@/app/admin/books/actions";
import { toast } from "@/components/admin/Toast";
import BackgroundPicker from "./BackgroundPicker";
import ChromePanel from "./ChromePanel";
import ElementToolbar from "./ElementToolbar";
import PageRenderer from "./PageRenderer";

const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;

type Drag =
  | { mode: "move"; id: string; startX: number; startY: number; elX: number; elY: number }
  | { mode: "resize"; id: string; startX: number; startY: number; w: number; h: number }
  | { mode: "rotate"; id: string; cx: number; cy: number; start: number; rotation: number };

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

  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const past = useRef<BookPage[][]>([]);
  const future = useRef<BookPage[][]>([]);
  const dragRef = useRef<Drag | null>(null);
  const dragSnapshot = useRef<BookPage[] | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdRef = useRef<string | null>(null);
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
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - 24;
      setCanvasWidth(Math.max(280, Math.min(avail, 660)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  const uploadImage = async (file: File, onDone: (url: string) => void) => {
    setStatus("saving");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `books/${book.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      onDone(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
      setStatus("idle");
      toast("Đã tải ảnh lên");
    } catch (err) {
      setStatus("error");
      const loi = err instanceof Error ? err.message : "Tải ảnh thất bại";
      setMessage(loi);
      toast(loi, "error");
    }
  };

  /** mở hộp chọn ảnh — dùng cho cả "thêm ảnh" và "đổi ảnh" */
  const pickImage = (replaceId: string | null) => {
    replaceIdRef.current = replaceId;
    fileRef.current?.click();
  };

  /* ------------------------------------------------------------------ kéo thả -- */
  const toPageCoords = (e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !canvasRef.current) return;
      const p = toPageCoords(e);

      if (d.mode === "move") {
        const nx = d.elX + (p.x - d.startX);
        const ny = d.elY + (p.y - d.startY);
        patchElement(
          d.id,
          {
            x: snapOn ? snap(nx) : Math.round(nx),
            y: snapOn ? snap(ny) : Math.round(ny),
          },
          false,
        );
      } else if (d.mode === "resize") {
        const nw = Math.max(40, d.w + (p.x - d.startX));
        const nh = Math.max(30, d.h + (p.y - d.startY));
        const el = pages[pageIndex].elements.find((x) => x.id === d.id);
        patchElement(
          d.id,
          el?.type === "image" ? { w: Math.round(nw), h: Math.round(nh) } : { w: Math.round(nw) },
          false,
        );
      } else if (d.mode === "rotate") {
        const angle = (Math.atan2(p.y - d.cy, p.x - d.cx) * 180) / Math.PI;
        let deg = Math.round(d.rotation + (angle - d.start));
        if (snapOn) deg = Math.round(deg / 5) * 5;
        patchElement(d.id, { rotation: deg }, false);
      }
    };

    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      if (dragSnapshot.current) {
        past.current = [...past.current.slice(-49), dragSnapshot.current];
        future.current = [];
        dragSnapshot.current = null;
      }
      scheduleSave(pages);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
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
          (selected.type === "image" ? selected.h : (textHeights[selected.id] ?? 40)) * scale,
      }
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[168px_minmax(0,1fr)]">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const id = replaceIdRef.current;
          if (f) {
            void uploadImage(f, (url) =>
              id ? patchElement(id, { src: url }) : addElement(newImageElement(url)),
            );
          }
          e.target.value = "";
        }}
      />

      {/* ------------------------------------------------------------ danh sách trang */}
      <aside className="order-2 lg:order-1">
        <div className="mb-2 flex items-center gap-2">
          <b className="text-sm">Trang ({pages.length})</b>
          <button type="button" onClick={addPage} className="adm-btn adm-btn-sm ml-auto">
            + Thêm
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto lg:max-h-[62vh] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
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

        <div className="mt-2 grid grid-cols-2 gap-1.5">
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
      <div ref={wrapRef} className="order-1 lg:order-2">
        {/* hàng nút chính */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => addElement(newTextElement())} className={NUT}>
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
          <div className="mb-2 h-[60px]">
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
          <div className="mb-2 h-[60px]" aria-hidden />
        )}

        {/* ------------------------------------------------ chọn nền trang bằng mẫu */}
        <details className="group mb-2 rounded-xl border border-slate-200 bg-white" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700">
            <span className="transition group-open:rotate-90">▸</span>
            Nền trang {pageIndex + 1}
            <span className="font-normal text-slate-400">— bấm chọn mẫu</span>
          </summary>
          <div className="border-t border-slate-200 px-3 py-2.5">
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

        {/* ---------------------------------------- tuỳ chọn chi tiết, thu gọn ở trên */}
        <details className="group mb-2 rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-slate-700">
            <span className="transition group-open:rotate-90">▸</span>
            Tuỳ chọn chi tiết
            <span className="font-normal text-slate-400">
              (phông chữ, kích thước, vị trí, đầu/chân trang)
            </span>
          </summary>

          {/* một hàng ngang, cuộn khi hẹp — không chiếm nhiều chiều cao */}
          <div className="flex max-h-44 flex-wrap items-end gap-x-4 gap-y-2 overflow-y-auto border-t border-slate-200 px-3 py-2.5">
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

        <div className="flex justify-center rounded-xl bg-slate-200 p-3">
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

            {/* lớp bắt sự kiện: chọn, kéo, đổi cỡ, xoay */}
            <div className="absolute inset-0">
              {page.elements.map((el) => {
                const isSel = el.id === selectedId;
                const h = el.type === "image" ? el.h : textHeights[el.id];
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => {
                      setSelectedId(el.id);
                      if (editingId && editingId !== el.id) stopEditing();

                      const now = Date.now();
                      const nhanh = lastClick.current.id === el.id && now - lastClick.current.t < 800;
                      lastClick.current = { id: el.id, t: now };

                      if (nhanh) {
                        // chặn focus mặc định của trình duyệt, nếu không ô soạn
                        // thảo vừa hiện ra đã bị blur ngay
                        e.preventDefault();
                        e.stopPropagation();
                        if (el.type === "text") startEditing(el.id);
                        else pickImage(el.id);
                        return;
                      }

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
                      outline: isSel
                        ? "2px solid #1667b8"
                        : "1px dashed rgba(22,103,184,.30)",
                    }}
                  />
                );
              })}
            </div>

            {/* tay cầm đổi cỡ / xoay của khối đang chọn */}
            {selected && selBox && !editingId ? (
              <>
                <span
                  onPointerDown={(e) => {
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const cx = selected.x + selected.w / 2;
                    const cy =
                      selected.y +
                      (selected.type === "image" ? selected.h : (textHeights[selected.id] ?? 40)) / 2;
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
                  className="absolute z-20 size-6 cursor-grab rounded-full border-2 border-white bg-brand shadow"
                  style={{
                    left: selBox.left + selBox.width / 2 - 12,
                    top: selBox.top - 34,
                  }}
                />
                <span
                  onPointerDown={(e) =>
                    startDrag(e, {
                      mode: "resize",
                      id: selected.id,
                      w: selected.w,
                      h: selected.type === "image" ? selected.h : 0,
                    } as Drag)
                  }
                  title="Kéo để đổi kích thước"
                  className="absolute z-20 size-6 cursor-se-resize rounded-md border-2 border-white bg-brand shadow"
                  style={{
                    left: selBox.left + selBox.width - 12,
                    top: selBox.top + selBox.height - 12,
                  }}
                />
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
                  fontFamily: selected.fontFamily,
                  color: selected.color,
                  fontWeight: selected.bold ? 700 : 400,
                  fontStyle: selected.italic ? "italic" : "normal",
                  textAlign: selected.align,
                  lineHeight: selected.lineHeight,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "rgba(255,255,255,.92)",
                  outline: "2px solid #1667b8",
                  padding: 0,
                }}
              />
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-500">
          Trang {pageIndex + 1}/{pages.length} · khung {PAGE_WIDTH}×{H} · kéo để di chuyển, kéo ô
          vuông xanh để đổi cỡ, kéo chấm tròn để xoay · phím mũi tên dịch từng chút · Delete để xoá
        </p>

      </div>
    </div>
  );
}

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
  type TextElement,
} from "@/lib/book-types";
import { createClient } from "@/utils/supabase/client";
import { saveBookPages } from "@/app/admin/books/actions";
import PageRenderer from "./PageRenderer";

const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;

type Drag =
  | { mode: "move"; id: string; startX: number; startY: number; elX: number; elY: number }
  | { mode: "resize"; id: string; startX: number; startY: number; w: number; h: number }
  | { mode: "rotate"; id: string; cx: number; cy: number; start: number; rotation: number };

export default function BookEditor({ book }: { book: BookWithPages }) {
  const [pages, setPages] = useState<BookPage[]>(
    book.pages.length ? book.pages : [emptyPage()],
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [canvasWidth, setCanvasWidth] = useState(560);
  const [snapOn, setSnapOn] = useState(true);

  const past = useRef<BookPage[][]>([]);
  const future = useRef<BookPage[][]>([]);
  const dragRef = useRef<Drag | null>(null);
  /** ảnh chụp trạng thái ngay trước khi kéo, để hoàn tác quay về đúng vị trí cũ */
  const dragSnapshot = useRef<BookPage[] | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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
      setCanvasWidth(Math.max(260, Math.min(avail, 620)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------------------------------------------------------------- lưu / autosave -- */
  const persist = useCallback(
    async (next: BookPage[]) => {
      setStatus("saving");
      const res = await saveBookPages(book.id, next);
      if (res.ok) {
        dirty.current = false;
        setStatus("saved");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(res.error);
      }
    },
    [book.id],
  );

  const scheduleSave = useCallback(
    (next: BookPage[]) => {
      dirty.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(next), 1200);
    },
    [persist],
  );

  /** Mọi thay đổi đi qua đây: ghi history + hẹn autosave. */
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

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setPages((cur) => {
      future.current = [...future.current, cur];
      scheduleSave(prev);
      return prev;
    });
  }, [scheduleSave]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setPages((cur) => {
      past.current = [...past.current, cur];
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

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
    commit((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, el] } : p)),
    );
    setSelectedId(el.id);
  };

  const removeElement = (id: string) => {
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
    const copy = { ...el, id: crypto.randomUUID(), x: el.x + 20, y: el.y + 20 } as BookElement;
    addElement(copy);
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

  /* ------------------------------------------------------------------ kéo / resize -- */
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
        patchElement(d.id, { x: snapOn ? snap(nx) : Math.round(nx), y: snapOn ? snap(ny) : Math.round(ny) }, false);
      } else if (d.mode === "resize") {
        const nw = Math.max(40, d.w + (p.x - d.startX));
        const nh = Math.max(30, d.h + (p.y - d.startY));
        const el = pages[pageIndex].elements.find((x) => x.id === d.id);
        patchElement(
          d.id,
          el?.type === "image"
            ? { w: Math.round(nw), h: Math.round(nh) }
            : { w: Math.round(nw) },
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
      // chốt mốc undo = trạng thái TRƯỚC khi kéo
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
    dragSnapshot.current = pages;
    const p = toPageCoords(e);
    dragRef.current = { ...d, startX: p.x, startY: p.y } as Drag;
  };

  /* ----------------------------------------------------------------- phím tắt -- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeElement(selectedId);
      }
      const step = e.shiftKey ? GRID : 1;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const delta = nudge[e.key];
      if (delta && selected) {
        e.preventDefault();
        patchElement(selectedId, { x: selected.x + delta[0], y: selected.y + delta[1] });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selected, patchElement, undo, redo]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------- cảnh báo khi thoát -- */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ------------------------------------------------------------------ upload ảnh -- */
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
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Tải ảnh thất bại");
    }
  };

  /* --------------------------------------------------------------------- trang -- */
  const addPage = () => {
    commit((prev) => [...prev.slice(0, pageIndex + 1), emptyPage(), ...prev.slice(pageIndex + 1)]);
    setPageIndex((i) => i + 1);
    setSelectedId(null);
  };

  const duplicatePage = () => {
    const copy: BookPage = {
      ...page,
      id: crypto.randomUUID(),
      elements: page.elements.map((e) => ({ ...e, id: crypto.randomUUID() })),
    };
    commit((prev) => [...prev.slice(0, pageIndex + 1), copy, ...prev.slice(pageIndex + 1)]);
    setPageIndex((i) => i + 1);
  };

  const deletePage = () => {
    if (pages.length === 1) return;
    if (!window.confirm(`Xoá trang ${pageIndex + 1}?`)) return;
    commit((prev) => prev.filter((_, i) => i !== pageIndex));
    setPageIndex((i) => Math.max(0, i - 1));
    setSelectedId(null);
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
    return dirty.current ? "Có thay đổi chưa lưu" : "Sẵn sàng";
  }, [status, message]);

  if (!page) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)_290px]">
      {/* ------------------------------------------------------------ danh sách trang */}
      <aside className="order-2 lg:order-1">
        <div className="mb-2 flex items-center gap-2">
          <b className="text-sm">Trang ({pages.length})</b>
          <button type="button" onClick={addPage} className="adm-btn adm-btn-sm ml-auto">
            + Thêm
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto lg:max-h-[70vh] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
          {pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPageIndex(i);
                setSelectedId(null);
              }}
              className={`relative shrink-0 cursor-pointer rounded-lg border-2 bg-white p-1 transition ${
                i === pageIndex ? "border-brand" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <PageRenderer page={p} ratio={book.page_ratio} width={140} />
              <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 text-[0.65rem] font-bold text-white">
                {i + 1}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => movePage(-1)} className="adm-btn adm-btn-sm adm-btn-ghost">
            ↑
          </button>
          <button type="button" onClick={() => movePage(1)} className="adm-btn adm-btn-sm adm-btn-ghost">
            ↓
          </button>
          <button type="button" onClick={duplicatePage} className="adm-btn adm-btn-sm adm-btn-ghost">
            Nhân bản
          </button>
          <button type="button" onClick={deletePage} className="adm-btn adm-btn-sm adm-btn-danger">
            Xoá
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- canvas */}
      <div ref={wrapRef} className="order-1 lg:order-2">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => addElement(newTextElement())} className="adm-btn adm-btn-sm">
            + Chữ
          </button>
          <label className="adm-btn adm-btn-sm adm-btn-ghost cursor-pointer">
            + Ảnh
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f, (url) => addElement(newImageElement(url)));
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" onClick={undo} className="adm-btn adm-btn-sm adm-btn-ghost" title="Ctrl+Z">
            ↶ Hoàn tác
          </button>
          <button type="button" onClick={redo} className="adm-btn adm-btn-sm adm-btn-ghost" title="Ctrl+Shift+Z">
            ↷ Làm lại
          </button>
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input type="checkbox" checked={snapOn} onChange={(e) => setSnapOn(e.target.checked)} className="size-3.5" />
            Bám lưới
          </label>
          <span
            className={`ml-auto text-xs font-semibold ${
              status === "error" ? "text-red-600" : "text-slate-500"
            }`}
          >
            {statusText}
          </span>
        </div>

        <div className="flex justify-center rounded-xl bg-slate-200 p-3">
          <div ref={canvasRef} className="relative shadow-lg" onPointerDown={() => setSelectedId(null)}>
            <PageRenderer page={page} ratio={book.page_ratio} width={canvasWidth} />

            {/* lớp tương tác đặt chồng, dùng toạ độ màn hình đã scale */}
            <div className="absolute inset-0">
              {page.elements.map((el) => {
                const isSel = el.id === selectedId;
                const h = el.type === "image" ? el.h : undefined;
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => {
                      setSelectedId(el.id);
                      startDrag(e, { mode: "move", id: el.id, elX: el.x, elY: el.y } as Drag);
                    }}
                    style={{
                      position: "absolute",
                      left: el.x * scale,
                      top: el.y * scale,
                      width: el.w * scale,
                      height: h ? h * scale : undefined,
                      minHeight: h ? undefined : 24 * scale,
                      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                      transformOrigin: "center center",
                      cursor: "move",
                      outline: isSel ? "2px solid #1667b8" : "1px dashed rgba(22,103,184,.35)",
                    }}
                  >
                    {isSel ? (
                      <>
                        <span
                          onPointerDown={(e) => {
                            const rect = canvasRef.current!.getBoundingClientRect();
                            startDrag(e, {
                              mode: "rotate",
                              id: el.id,
                              cx: el.x + el.w / 2,
                              cy: el.y + (h ?? 40) / 2,
                              rotation: el.rotation,
                              start:
                                (Math.atan2(
                                  (e.clientY - rect.top) / scale - (el.y + (h ?? 40) / 2),
                                  (e.clientX - rect.left) / scale - (el.x + el.w / 2),
                                ) *
                                  180) /
                                Math.PI,
                            } as unknown as Drag);
                          }}
                          className="absolute -top-6 left-1/2 size-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-white bg-brand"
                          title="Xoay"
                        />
                        <span
                          onPointerDown={(e) =>
                            startDrag(e, {
                              mode: "resize",
                              id: el.id,
                              w: el.w,
                              h: h ?? 0,
                            } as Drag)
                          }
                          className="absolute -right-1.5 -bottom-1.5 size-3.5 cursor-se-resize rounded-sm border-2 border-white bg-brand"
                          title="Đổi kích thước"
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-500">
          Khung {PAGE_WIDTH}×{H} · tỉ lệ {book.page_ratio} · phím mũi tên để dịch chuyển, Delete để xoá
        </p>
      </div>

      {/* --------------------------------------------------------------- thuộc tính */}
      <aside className="order-3 space-y-3">
        {selected ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <b className="text-sm">{selected.type === "text" ? "Khối chữ" : "Khối ảnh"}</b>
              <div className="ml-auto flex gap-1">
                <button type="button" onClick={() => moveLayer(selected.id, 1)} className="adm-btn adm-btn-sm adm-btn-ghost" title="Lên trước">
                  ⬆
                </button>
                <button type="button" onClick={() => moveLayer(selected.id, -1)} className="adm-btn adm-btn-sm adm-btn-ghost" title="Xuống sau">
                  ⬇
                </button>
              </div>
            </div>

            {selected.type === "text" ? (
              <TextProps el={selected} onChange={(patch) => patchElement(selected.id, patch)} />
            ) : (
              <ImageProps
                el={selected}
                onChange={(patch) => patchElement(selected.id, patch)}
                onUpload={(file) => uploadImage(file, (url) => patchElement(selected.id, { src: url }))}
              />
            )}

            <div className="mt-3 grid grid-cols-2 gap-x-3">
              <label className="adm-field">
                <span>X</span>
                <input
                  type="number"
                  value={selected.x}
                  onChange={(e) => patchElement(selected.id, { x: Number(e.target.value) })}
                  className="adm-input"
                />
              </label>
              <label className="adm-field">
                <span>Y</span>
                <input
                  type="number"
                  value={selected.y}
                  onChange={(e) => patchElement(selected.id, { y: Number(e.target.value) })}
                  className="adm-input"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  patchElement(selected.id, { x: Math.round((PAGE_WIDTH - selected.w) / 2) })
                }
                className="adm-btn adm-btn-sm adm-btn-ghost"
              >
                Căn giữa ngang
              </button>
              <button type="button" onClick={() => duplicateElement(selected.id)} className="adm-btn adm-btn-sm adm-btn-ghost">
                Nhân bản
              </button>
              <button type="button" onClick={() => removeElement(selected.id)} className="adm-btn adm-btn-sm adm-btn-danger">
                Xoá
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <b className="mb-2 block text-sm">Trang {pageIndex + 1}</b>
            <label className="adm-field">
              <span>Màu nền</span>
              <input
                type="color"
                value={page.background}
                onChange={(e) =>
                  commit((prev) =>
                    prev.map((p, i) => (i === pageIndex ? { ...p, background: e.target.value } : p)),
                  )
                }
                className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1"
              />
            </label>
            <label className="adm-field">
              <span>Ảnh nền (URL)</span>
              <input
                type="text"
                value={page.background_image ?? ""}
                placeholder="/canva/….webp"
                onChange={(e) =>
                  commit((prev) =>
                    prev.map((p, i) =>
                      i === pageIndex ? { ...p, background_image: e.target.value || null } : p,
                    ),
                  )
                }
                className="adm-input"
              />
            </label>
            <label className="adm-btn adm-btn-sm adm-btn-ghost cursor-pointer">
              Tải ảnh nền
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    void uploadImage(f, (url) =>
                      commit((prev) =>
                        prev.map((p, i) => (i === pageIndex ? { ...p, background_image: url } : p)),
                      ),
                    );
                  e.target.value = "";
                }}
              />
            </label>
            <p className="mt-3 text-xs text-slate-500">
              Bấm vào một khối trên trang để sửa thuộc tính của khối đó.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void persist(pages)}
          className="adm-btn w-full justify-center"
        >
          Lưu ngay
        </button>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ panel chữ -- */

function TextProps({
  el,
  onChange,
}: {
  el: TextElement;
  onChange: (patch: Partial<TextElement>) => void;
}) {
  return (
    <>
      <label className="adm-field">
        <span>Nội dung</span>
        <textarea
          value={el.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="adm-input min-h-24"
        />
      </label>

      <label className="adm-field">
        <span>Phông chữ</span>
        <select
          value={el.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="adm-input"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Cỡ chữ</span>
          <input
            type="number"
            min={8}
            value={el.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
        <label className="adm-field">
          <span>Giãn dòng</span>
          <input
            type="number"
            step={0.05}
            value={el.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Màu chữ</span>
          <input
            type="color"
            value={el.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1"
          />
        </label>
        <label className="adm-field">
          <span>Căn lề</span>
          <select
            value={el.align}
            onChange={(e) => onChange({ align: e.target.value as TextElement["align"] })}
            className="adm-input"
          >
            <option value="left">Trái</option>
            <option value="center">Giữa</option>
            <option value="right">Phải</option>
          </select>
        </label>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ bold: !el.bold })}
          className={`adm-btn adm-btn-sm ${el.bold ? "" : "adm-btn-ghost"}`}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => onChange({ italic: !el.italic })}
          className={`adm-btn adm-btn-sm ${el.italic ? "" : "adm-btn-ghost"}`}
        >
          <i>I</i>
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ panel ảnh -- */

function ImageProps({
  el,
  onChange,
  onUpload,
}: {
  el: ImageElement;
  onChange: (patch: Partial<ImageElement>) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <>
      <label className="adm-btn adm-btn-sm adm-btn-ghost mb-2 cursor-pointer">
        Đổi ảnh
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Rộng</span>
          <input
            type="number"
            value={el.w}
            onChange={(e) => onChange({ w: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
        <label className="adm-field">
          <span>Cao</span>
          <input
            type="number"
            value={el.h}
            onChange={(e) => onChange({ h: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Bo góc</span>
          <input
            type="number"
            min={0}
            value={el.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
        <label className="adm-field">
          <span>Độ mờ</span>
          <input
            type="number"
            min={0.1}
            max={1}
            step={0.05}
            value={el.opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Cách lấp khung</span>
          <select
            value={el.fit}
            onChange={(e) => onChange({ fit: e.target.value as ImageElement["fit"] })}
            className="adm-input"
          >
            <option value="cover">Cắt vừa khung</option>
            <option value="contain">Hiện trọn ảnh</option>
          </select>
        </label>
        <label className="adm-field">
          <span>Viền (px)</span>
          <input
            type="number"
            min={0}
            value={el.borderWidth}
            onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
      </div>
    </>
  );
}

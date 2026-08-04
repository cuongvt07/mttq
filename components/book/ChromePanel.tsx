"use client";

import type { ChromeBand, PageChrome } from "@/lib/book-types";

const COLOR = "h-9 w-14 rounded-lg border border-slate-200 bg-white p-1";

function BandFields({
  band,
  where,
  onChange,
}: {
  band: ChromeBand;
  where: "header" | "footer";
  onChange: (patch: Partial<ChromeBand>) => void;
}) {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 p-2.5">
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={band.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="size-4"
        />
        {where === "header" ? "Đầu trang" : "Chân trang"}
      </label>

      {band.enabled ? (
        <>
          <label className="adm-field">
            <span>Chữ (dùng {"{trang}"} / {"{tong}"})</span>
            <input
              type="text"
              value={band.text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder={where === "header" ? "UỶ BAN MTTQ PHƯỜNG YÊN NGHĨA" : "Bản tin số 01"}
              className="adm-input"
            />
          </label>

          <div className="grid grid-cols-2 gap-x-3">
            <label className="adm-field">
              <span>Căn lề</span>
              <select
                value={band.align}
                onChange={(e) => onChange({ align: e.target.value as ChromeBand["align"] })}
                className="adm-input"
              >
                <option value="left">Trái</option>
                <option value="center">Giữa</option>
                <option value="right">Phải</option>
              </select>
            </label>
            <label className="adm-field">
              <span>Cỡ chữ</span>
              <input
                type="number"
                min={8}
                value={band.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className="adm-input"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-x-3">
            <label className="adm-field">
              <span>Màu chữ</span>
              <input
                type="color"
                value={band.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className={COLOR}
              />
            </label>
            <label className="adm-field">
              <span>Số trang</span>
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={!!band.pageNumber}
                  onChange={(e) => onChange({ pageNumber: e.target.checked })}
                  className="size-4"
                />
                Hiện
              </span>
            </label>
          </div>

          {band.pageNumber ? (
            <label className="adm-field">
              <span>Vị trí số trang</span>
              <select
                value={band.pageNumberAlign ?? "right"}
                onChange={(e) =>
                  onChange({ pageNumberAlign: e.target.value as ChromeBand["align"] })
                }
                className="adm-input"
              >
                <option value="left">Trái</option>
                <option value="center">Giữa</option>
                <option value="right">Phải</option>
              </select>
            </label>
          ) : null}

          <label className="mb-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={band.rule}
              onChange={(e) => onChange({ rule: e.target.checked })}
              className="size-4"
            />
            Đường kẻ dải
          </label>

          {band.rule ? (
            <div className="grid grid-cols-2 gap-x-3">
              <label className="adm-field">
                <span>Màu kẻ</span>
                <input
                  type="color"
                  value={band.ruleColor}
                  onChange={(e) => onChange({ ruleColor: e.target.value })}
                  className={COLOR}
                />
              </label>
              <label className="adm-field">
                <span>Độ dày (px)</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={band.ruleWidth}
                  onChange={(e) => onChange({ ruleWidth: Number(e.target.value) })}
                  className="adm-input"
                />
              </label>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Cấu hình đầu/chân trang — áp dụng cho mọi trang của sách. */
export default function ChromePanel({
  chrome,
  onChange,
}: {
  chrome: PageChrome;
  onChange: (patch: Partial<PageChrome>) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <b className="mb-2 block text-sm">Đầu / chân trang</b>
      <p className="mb-2 text-xs text-slate-500">Áp dụng cho tất cả các trang của sách.</p>

      <BandFields
        band={chrome.header}
        where="header"
        onChange={(patch) => onChange({ header: { ...chrome.header, ...patch } })}
      />
      <BandFields
        band={chrome.footer}
        where="footer"
        onChange={(patch) => onChange({ footer: { ...chrome.footer, ...patch } })}
      />

      <div className="grid grid-cols-2 gap-x-3">
        <label className="adm-field">
          <span>Lề trong (px)</span>
          <input
            type="number"
            min={0}
            value={chrome.margin}
            onChange={(e) => onChange({ margin: Number(e.target.value) })}
            className="adm-input"
          />
        </label>
        <label className="adm-field">
          <span>Bỏ qua</span>
          <span className="flex flex-col gap-1 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chrome.skipFirstPage}
                onChange={(e) => onChange({ skipFirstPage: e.target.checked })}
                className="size-4"
              />
              Bìa trước
            </span>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chrome.skipLastPage ?? false}
                onChange={(e) => onChange({ skipLastPage: e.target.checked })}
                className="size-4"
              />
              Bìa sau
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

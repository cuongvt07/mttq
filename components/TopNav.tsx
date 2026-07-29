"use client";

import { useState } from "react";
import { EMBLEM } from "@/lib/theme";

type NavItem = { href: string; label: string };

export default function TopNav({
  brandName,
  brandLogoUrl,
  items,
}: {
  brandName: string;
  brandLogoUrl: string | null;
  items: NavItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-brand-deep text-sky-50 shadow-[0_2px_10px_rgb(0_0_0/0.25)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2.5 px-5 py-1.5">
        <div className="flex items-center gap-2.5 pr-3.5 text-[0.9rem] font-extrabold tracking-wide">
          <img
            src={brandLogoUrl || EMBLEM}
            alt=""
            className="size-9 shrink-0 object-contain"
          />
          <span className="uppercase">{brandName}</span>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-label="Mở menu"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-bold sm:hidden"
        >
          ☰ Menu
        </button>

        <nav
          onClick={() => setOpen(false)}
          className={`${
            open ? "flex" : "hidden"
          } w-full flex-wrap gap-0.5 pb-2 sm:ml-auto sm:flex sm:w-auto sm:pb-0`}
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-[0.72rem] font-bold tracking-wide text-sky-100
                         uppercase whitespace-nowrap transition-colors hover:bg-brand hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

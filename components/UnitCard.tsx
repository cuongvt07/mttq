import type { Unit } from "@/lib/types";
import { EMBLEM } from "@/lib/theme";

export default function UnitCard({ unit, index = 0 }: { unit: Unit; index?: number }) {
  const inner = (
    <>
      {unit.image_url ? (
        <div
          className="aspect-4/3 bg-slate-200 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url('${unit.image_url}')` }}
        />
      ) : (
        <div className="grid aspect-4/3 place-items-center bg-linear-to-br from-amber-50 to-amber-200">
          <img
            src={EMBLEM}
            alt=""
            className="size-14 object-contain opacity-90 transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}
      <div className="flex min-h-11 items-center justify-center bg-brand px-1.5 py-2 text-center text-[0.8rem] leading-tight font-bold text-white transition-colors group-hover:bg-brand-dark">
        {unit.label}
      </div>
    </>
  );

  const className =
    "group block overflow-hidden rounded-lg bg-white shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transform-none";

  const revealProps = {
    "data-reveal": "",
    style: { "--reveal-delay": `${Math.min(index, 12) * 45}ms` } as React.CSSProperties,
  };

  return unit.link_url ? (
    <a
      className={className}
      href={unit.link_url}
      target="_blank"
      rel="noopener noreferrer"
      {...revealProps}
    >
      {inner}
    </a>
  ) : (
    <div className={className} {...revealProps}>
      {inner}
    </div>
  );
}

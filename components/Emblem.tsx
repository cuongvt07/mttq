import { EMBLEM } from "@/lib/theme";

/** Con dấu Mặt trận Tổ quốc Việt Nam. */
export default function Emblem({ className = "size-8" }: { className?: string }) {
  return <img src={EMBLEM} alt="" aria-hidden="true" className={`${className} shrink-0 object-contain`} />;
}

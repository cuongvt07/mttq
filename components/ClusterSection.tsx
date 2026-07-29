import type { ClusterWithUnits } from "@/lib/types";
import { clusterBackground } from "@/lib/theme";
import SectionShell from "./SectionShell";
import UnitCard from "./UnitCard";

/**
 * Chọn số cột sao cho hàng cuối không bị lẻ:
 * ưu tiên chia hết, nếu không thì lấy phương án lấp đầy hàng cuối nhiều nhất.
 * 6 thẻ → 3 cột, 8 → 4, 10 → 5, 7 → 4…
 */
function balancedColumns(count: number): number {
  if (count <= 3) return Math.max(count, 1);
  let best = 5;
  let bestScore = -1;
  for (const cols of [5, 4, 3]) {
    const remainder = count % cols;
    const score = remainder === 0 ? 100 + cols : remainder;
    if (score > bestScore) {
      bestScore = score;
      best = cols;
    }
  }
  return best;
}

export default function ClusterSection({
  cluster,
  index,
}: {
  cluster: ClusterWithUnits;
  index: number;
}) {
  const units = [...(cluster.units ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const cols = balancedColumns(units.length);

  return (
    <SectionShell
      id={cluster.slug}
      title={cluster.name}
      background={clusterBackground(index)}
      gradientFrom={cluster.color_from}
      gradientTo={cluster.color_to}
    >
      <div
        style={{ "--cols": cols } as React.CSSProperties}
        className="grid grid-cols-2 gap-3.5 sm:grid-cols-3
                   lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      >
        {units.map((unit, i) => (
          <UnitCard key={unit.id} unit={unit} index={i} />
        ))}
      </div>
    </SectionShell>
  );
}

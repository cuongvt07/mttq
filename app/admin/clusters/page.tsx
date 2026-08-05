import Link from "next/link";
import { clusterBackground } from "@/lib/theme";
import { getClustersForAdmin, getUnitCounts } from "@/lib/queries";
import { createCluster } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClustersPage() {
  const [clusters, counts] = await Promise.all([getClustersForAdmin(), getUnitCounts()]);
  const nextOrder = (clusters.at(-1)?.sort_order ?? 0) + 1;

  return (
    <>
      <h1 className="text-xl font-bold">Các cụm</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Mỗi cụm là một khối trên trang chủ. Ảnh nền lấy theo thứ tự cụm từ bộ ảnh của site gốc.
      </p>

      <div className="grid gap-3">
        {clusters.map((c, i) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <img
              src={clusterBackground(i)}
              alt=""
              className="h-11 w-16 shrink-0 rounded-md object-cover"
            />
            <div>
              <b className="block">{c.name}</b>
              <span className="text-xs text-slate-500">
                #{c.slug} · {counts[c.id] ?? 0} đơn vị{c.is_published ? "" : " · đang ẩn"}
              </span>
            </div>
            <Link href={`/admin/clusters/${c.id}`} className="adm-btn adm-btn-sm adm-btn-ghost ml-auto">
              Sửa
            </Link>
          </div>
        ))}
      </div>

      <div className="adm-panel mt-5">
        <h2 className="mb-3 font-bold">Thêm cụm mới</h2>
        <form action={createCluster}>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tên cụm</span>
              <input type="text" name="name" required placeholder="Các đơn vị Cụm 12" className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Nhãn trên menu</span>
              <input type="text" name="nav_label" placeholder="Cụm 12" className="adm-input" />
            </label>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-3">
            <label className="adm-field">
              <span>Màu phủ (trên)</span>
              <input type="color" name="color_from" defaultValue="#4aa6e6" className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1" />
            </label>
            <label className="adm-field">
              <span>Màu phủ (dưới)</span>
              <input type="color" name="color_to" defaultValue="#1f7fca" className="h-10 w-16 rounded-lg border border-slate-200 bg-white p-1" />
            </label>
            <label className="adm-field">
              <span>Thứ tự</span>
              <input type="number" name="sort_order" defaultValue={nextOrder} className="adm-input" />
            </label>
          </div>
          <button type="submit" className="adm-btn">
            Tạo cụm
          </button>
        </form>
      </div>
    </>
  );
}

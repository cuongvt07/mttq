import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import ImageField from "@/components/admin/ImageField";
import { getClusterWithUnits } from "@/lib/queries";
import { createUnit, deleteCluster, deleteUnit, updateCluster, updateUnit } from "../../actions";

export const dynamic = "force-dynamic";

const COLOR_INPUT = "h-10 w-16 rounded-lg border border-slate-200 bg-white p-1";

export default async function ClusterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cluster = await getClusterWithUnits(id);
  if (!cluster) notFound();

  const units = [...(cluster.units ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const nextOrder = (units.at(-1)?.sort_order ?? 0) + 1;

  return (
    <>
      <h1 className="text-xl font-bold">{cluster.name}</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        <Link href="/admin/clusters" className="text-brand hover:underline">
          ← Danh sách cụm
        </Link>{" "}
        · {units.length} đơn vị
      </p>

      <div className="adm-panel">
        <h2 className="mb-3 font-bold">Thông tin cụm</h2>
        <form action={updateCluster}>
          <input type="hidden" name="id" value={cluster.id} />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tên cụm</span>
              <input type="text" name="name" defaultValue={cluster.name} required className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Nhãn trên menu</span>
              <input type="text" name="nav_label" defaultValue={cluster.nav_label ?? ""} className="adm-input" />
            </label>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-3">
            <label className="adm-field">
              <span>Màu phủ (trên)</span>
              <input type="color" name="color_from" defaultValue={cluster.color_from} className={COLOR_INPUT} />
            </label>
            <label className="adm-field">
              <span>Màu phủ (dưới)</span>
              <input type="color" name="color_to" defaultValue={cluster.color_to} className={COLOR_INPUT} />
            </label>
            <label className="adm-field">
              <span>Thứ tự</span>
              <input type="number" name="sort_order" defaultValue={cluster.sort_order} className="adm-input" />
            </label>
          </div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Slug (anchor)</span>
              <input type="text" name="slug" defaultValue={cluster.slug} className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Trạng thái</span>
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="is_published" defaultChecked={cluster.is_published} className="size-4" />
                Hiển thị trên trang chủ
              </span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="submit" className="adm-btn">
              Lưu cụm
            </button>
            <ConfirmSubmit
              message={`Xoá cụm "${cluster.name}" và toàn bộ đơn vị bên trong?`}
              formAction={deleteCluster}
              className="adm-btn adm-btn-danger"
            >
              Xoá cụm
            </ConfirmSubmit>
          </div>
        </form>
      </div>

      <h2 className="mt-6 mb-3 font-bold">Đơn vị trong cụm</h2>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => (
          <form key={u.id} action={updateUnit} className="rounded-xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="id" value={u.id} />
            <input type="hidden" name="cluster_id" value={cluster.id} />
            <ImageField name="image_url" defaultValue={u.image_url} label="Ảnh đơn vị" />
            <label className="adm-field">
              <span>Tên đơn vị</span>
              <input type="text" name="label" defaultValue={u.label} required className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Liên kết (tuỳ chọn)</span>
              <input type="text" name="link_url" defaultValue={u.link_url ?? ""} placeholder="https://…" className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Thứ tự</span>
              <input type="number" name="sort_order" defaultValue={u.sort_order} className="adm-input" />
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="submit" className="adm-btn adm-btn-sm">
                Lưu
              </button>
              <ConfirmSubmit message={`Xoá đơn vị "${u.label}"?`} formAction={deleteUnit}>
                Xoá
              </ConfirmSubmit>
            </div>
          </form>
        ))}
      </div>

      <div className="adm-panel mt-5">
        <h2 className="mb-3 font-bold">Thêm đơn vị</h2>
        <form action={createUnit}>
          <input type="hidden" name="cluster_id" value={cluster.id} />
          <ImageField name="image_url" label="Ảnh đơn vị" />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <label className="adm-field">
              <span>Tên đơn vị</span>
              <input type="text" name="label" required placeholder="Phường Cửa Nam" className="adm-input" />
            </label>
            <label className="adm-field">
              <span>Thứ tự</span>
              <input type="number" name="sort_order" defaultValue={nextOrder} className="adm-input" />
            </label>
          </div>
          <label className="adm-field">
            <span>Liên kết (tuỳ chọn)</span>
            <input type="text" name="link_url" placeholder="https://…" className="adm-input" />
          </label>
          <button type="submit" className="adm-btn">
            Thêm đơn vị
          </button>
        </form>
      </div>
    </>
  );
}

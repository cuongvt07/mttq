import Emblem from "@/components/Emblem";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center bg-linear-to-b from-sky-top to-sky-bottom p-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <Emblem className="mx-auto mb-3 size-14" />
        <h1 className="text-center text-lg font-bold">Đăng nhập quản trị</h1>
        <p className="mt-1 mb-5 text-center text-sm text-slate-500">
          Chỉ email đã được cấp quyền mới vào được khu vực quản trị.
        </p>
        <LoginForm next={next ?? "/admin"} error={error} />
      </div>
    </div>
  );
}

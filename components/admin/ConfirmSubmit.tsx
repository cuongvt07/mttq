"use client";

/** Nút submit có hộp thoại xác nhận (dùng cho các thao tác xoá). */
export default function ConfirmSubmit({
  children,
  message,
  formAction,
  className = "adm-btn adm-btn-sm adm-btn-danger",
}: {
  children: React.ReactNode;
  message: string;
  /** Server action thay thế action của form khi bấm nút này. */
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

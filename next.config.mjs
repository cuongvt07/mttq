/** @type {import('next').NextConfig} */
const nextConfig = {
  // Thư mục này là gốc dự án (bên ngoài D:\GGsheet còn một lockfile khác).
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;

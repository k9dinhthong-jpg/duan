import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Địa chỉ backend VPS – chỉ dùng trong `npm run dev`, không ảnh hưởng production build.
const VPS_ORIGIN = "https://maycongtrinhnhapkhau.com.vn";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      // Mọi request /api/... từ dev server sẽ được chuyển tiếp tới VPS backend,
      // tránh CORS khi phát triển local.
      "/api": {
        target: VPS_ORIGIN,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
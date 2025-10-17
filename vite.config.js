import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".csb.app"], // ✅ CodeSandbox 도메인 허용
  },
});

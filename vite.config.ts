import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["robinadminserver.xyz"],
      hmr: {
        overlay: false,
      },
      proxy: supabaseUrl && supabaseKey
        ? {
          "/api/transfer-tokens": {
            target: supabaseUrl,
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api\/transfer-tokens/, "/functions/v1/transfer-tokens"),
            configure: (proxy) => {
              proxy.on("proxyReq", (proxyReq, req) => {
                proxyReq.setHeader("Authorization", `Bearer ${supabaseKey}`);
              });
              proxy.on("error", (err, req, res) => {
                console.error("[Vite proxy] transfer-tokens error:", err.message);
              });
            },
          },
        }
        : undefined,
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

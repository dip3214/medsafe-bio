// Standalone replacement for @lovable.dev/vite-tanstack-config.
// Replicates that package's production-build behavior exactly (verified against
// its published source), with no Lovable dependency.
import { defineConfig, loadEnv, type UserConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const isDevBuild = command === "build" && mode === "development";

  // Injects VITE_* env vars as import.meta.env.* — same behavior as envDefine: true (the default).
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(loadedEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ])
  );

  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // Matches your existing vite.config.ts: server entry at src/server.ts
      server: { entry: "server" },
    }),
  ];

  if (command === "build") {
    // IMPORTANT: pick the preset for whichever host you deploy to.
    // "cloudflare-module" only makes sense if you stay on Cloudflare Workers/Pages.
    // Common alternatives: "vercel", "netlify", "node-server" (for a self-run Node process),
    // "aws-lambda" (for API Gateway + Lambda). See https://nitro.build/deploy for the full list.
    plugins.push(nitro({ preset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  const config: UserConfig = {
    define: envDefine,
    ...(isDevBuild
      ? {
          environments: {
            client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
          },
          esbuild: { keepNames: true },
        }
      : {}),
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
      ignoreOutdatedRequests: true,
    },
    plugins,
    server: { host: "::", port: 8080 },
  };

  return config;
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
export default defineConfig({
  root:"static",
  base:"./",
  publicDir:"../public",
  plugins:[react()],
  css:{postcss:{plugins:[tailwindcss()]}},
  build:{outDir:"../../docs",emptyOutDir:true},
});

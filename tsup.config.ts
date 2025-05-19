import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["./src/index.ts"],
    target: "es5",
    format: ["iife"],
    outDir: "./dist",
    clean: false,
    minify: false,
});

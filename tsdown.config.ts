import { defineConfig } from "tsdown";

// Modern build configuration (ESM)
// Usage: Install as a dependency taken from the npm registry.
export default defineConfig({
	entry: ["./src/index.ts"],
	format: ["esm"],
	fixedExtension: false,
	dts: true, // Generates .d.ts files
	sourcemap: true,
	minify: false,
});

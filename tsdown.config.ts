import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	format: ["esm"],
	fixedExtension: false,
	dts: true, // Generates .d.ts files
	clean: true, // Wipes dist/ before building
	publint: true, // Lints package.json strictly on every build
	attw: true, // Checks for TypeScript resolution errors on every build
	sourcemap: true,
	minify: false,
});

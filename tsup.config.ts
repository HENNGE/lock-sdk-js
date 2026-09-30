import { defineConfig } from "tsup";

// Legacy build configuration (IIFE)
// Usage: Include the generated IIFE script in your HTML file using a `<script>` tag.
export default defineConfig({
	entry: ["./src/index.ts"],
	target: "es5",
	format: ["iife"],
	outDir: "./dist",
	clean: false,
	minify: false,
	treeshake: true,
	globalName: "HENNGE.Lock",
});

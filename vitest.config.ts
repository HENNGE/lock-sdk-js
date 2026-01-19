import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			provider: "v8",
			reporter: ["text"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.test.ts",
				"**/*.config.ts",
				".cache/",
			],
		},
	},
});

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["test/**/*.spec.ts"],
		reporters: ["default", "junit"],
		outputFile: { junit: "reports/junit.xml" },
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			reporter: ["text", "html", "lcov", "json-summary"],
			reportsDirectory: "coverage",
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
	},
});

import { defineConfig } from 'oxlint';

export default defineConfig({
	$schema: './node_modules/oxlint/configuration_schema.json',
	plugins: ['typescript', 'unicorn', 'oxc'],
	categories: {
		correctness: 'error'
	},
	rules: {
		'only-used-in-recursion': 'off'
	},
	env: {
		builtin: true
	},
	ignorePatterns: [
		'**/tests/nodes.test.ts',
		'**/.sittir/**',
		'specs/**',
		'node_modules/',
		'dist/',
		'target/',
		'.agents/**',
		'.claude/**',
		'**/overrides.ts',
		'tests/format-roundtrip/fixtures/**'
	]
});

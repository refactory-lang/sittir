import { defineConfig } from 'oxlint';

export default defineConfig({
	$schema: './node_modules/oxlint/configuration_schema.json',
	plugins: ['typescript', 'unicorn', 'oxc'],
	categories: {
		correctness: 'error'
	},
	rules: {},
	env: {
		builtin: true
	},
	ignorePatterns: [
		'**/tests/nodes.test.ts',
		'**/.sittir/**',
		'specs/**',
		'node_modules/',
		'dist/',
		'target/'
	]
});

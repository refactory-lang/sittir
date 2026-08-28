import { defineConfig } from 'oxlint';

export default defineConfig({
	$schema: './node_modules/oxlint/configuration_schema.json',
	plugins: ['typescript', 'unicorn', 'oxc', 'import'],
	categories: {
		correctness: 'error'
	},
	rules: {
		'only-used-in-recursion': 'off',
		// Enforced per-directory below, not repo-wide: the generated grammar
		// packages are acyclic, the codegen compiler is not yet.
		'import/no-cycle': 'off'
	},
	overrides: [
		{
			// The generated grammar packages are acyclic and must stay that
			// way. Node construction reaches the render engine through
			// utils -> boundary, so a back-edge into wrap or factories would
			// leave module init reading half-built exports as `undefined` —
			// which surfaces as an opaque "cannot read properties of
			// undefined", not as an import error.
			files: ['packages/rust/src/**', 'packages/typescript/src/**', 'packages/python/src/**'],
			rules: {
				'import/no-cycle': 'error'
			}
		}
	],
	env: {
		builtin: true
	},
	ignorePatterns: [
		'scratch/**',
		'**/tests/nodes.test.ts',
		'**/.sittir/**',
		'specs/**',
		'node_modules/',
		'dist/',
		'target/',
		'.agents/**',
		'.claude/**',
		'**/grammar.sittir.ts',
		'tests/format-roundtrip/fixtures/**',
		'archive/**'
	]
});

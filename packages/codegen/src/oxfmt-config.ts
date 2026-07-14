/**
 * Canonical oxfmt formatting settings — single source of truth for both the
 * repo-root `oxfmt.config.ts` (consumed by `pnpm run format` / oxfmt's CLI)
 * and `writeFile()`'s in-pipeline formatting of generated `.ts` output
 * (`run-codegen.ts`).
 *
 * Lives inside `packages/codegen/src` — not the repo root — so it ships
 * with the package's own `dist` output and resolves correctly for real
 * installed/published consumers. A repo-root-relative import from a
 * package's `src/` reaches outside that package's `tsconfig.build.json`
 * `rootDir`, and Node can't resolve it once only `dist` is packaged.
 */
import type { FormatConfig } from 'oxfmt';

export const OXFMT_CONFIG: FormatConfig = {
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	arrowParens: 'always',
	printWidth: 120,
	sortPackageJson: false,
	ignorePatterns: [
		'**/*.md',
		'**/*.mdx',
		'.github/**',
		'.agents/**',
		'.claude/**',
		'.specify/**',
		'.changeset/**',
		'specs/**',
		'examples/**'
	]
};

/**
 * The effective config for formatting a single `.ts` file's content via
 * oxfmt's programmatic `format()` API. That API does not auto-discover
 * `.editorconfig` the way oxfmt's CLI does, so `.editorconfig`'s
 * `indent_style = tab` rule for `.ts` files (repo-wide, `root = true`,
 * unambiguous) is merged in by hand here.
 */
export const OXFMT_EFFECTIVE_CONFIG: FormatConfig = { ...OXFMT_CONFIG, useTabs: true };

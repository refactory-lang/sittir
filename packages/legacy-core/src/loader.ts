// @generated-header: false (hand-written core — preserved across regeneration)
//
// Loader: ergonomic `createRenderer(templatesDir)` entry point.
//
// Post-feature-011: the legacy YAML template file format has been
// retired in favor of per-rule `.jinja` files. A directory path
// points at the `.jinja` root; a RulesConfig skips filesystem I/O
// entirely (unit-test convenience on the legacy regex-substitutor
// path, retained for in-memory test fixtures).

import type { RulesConfig } from './types.ts';
import { createRendererFromConfig } from './render.ts';
import type { BoundRenderer } from './render.ts';

/**
 * Options accepted by the `createRenderer(templatesDir, options)` overload.
 */
export interface CreateRendererOptions {
	/**
	 * Static lookup table: numeric KindId → kind name string. Pre-computed
	 * at codegen time. Used by the Nunjucks render path to resolve template
	 * filenames from numeric `$type`. Pure `Map.get()` at runtime.
	 */
	kindNames?: ReadonlyMap<number, string>;
}

/**
 * Create a renderer bound to a specific templates source.
 *
 * - `templatesDir: string` — directory containing per-rule `.jinja`
 *   files. Uses Nunjucks-backed rendering (feature 011).
 * - `config: RulesConfig` — pre-built rules map. Uses the legacy
 *   regex-substitutor render path. Intended for in-memory unit
 *   tests; production grammars ship `.jinja` files on disk.
 *
 * The optional `options` argument (directory-path overload only) allows
 * injecting a `kindNameFromId` resolver for Phase A/B coexistence where
 * factory/wrap output carries numeric TSKindId values in `$type`.
 */
export function createRenderer(templatesDir: string, options?: CreateRendererOptions): BoundRenderer;
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig, options?: CreateRendererOptions): BoundRenderer {
	if (typeof pathOrConfig !== 'string') {
		return createRendererFromConfig(pathOrConfig);
	}
	// String argument is a `.jinja` templates directory. Separators,
	// flank markers, and all per-rule render metadata live inline in
	// the `.jinja` bodies (via `| joinby("<sep>")` and
	// `has_flank_sep(...)` — registered on the Nunjucks env). The
	// render path needs no runtime config; an empty RulesConfig
	// suffices.
	const emptyConfig: RulesConfig = {
		language: '',
		extensions: [],
		expandoChar: null,
		metadata: { grammarSha: '' },
		rules: {},
		kindNames: options?.kindNames
	};
	return createRendererFromConfig(emptyConfig, { templatesDir: pathOrConfig });
}

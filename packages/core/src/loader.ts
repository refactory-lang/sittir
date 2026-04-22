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
import { createRendererFromConfig, type BoundRenderer } from './render.ts';

/**
 * Create a renderer bound to a specific templates source.
 *
 * - `templatesDir: string` — directory containing per-rule `.jinja`
 *   files. Uses Nunjucks-backed rendering (feature 011).
 * - `config: RulesConfig` — pre-built rules map. Uses the legacy
 *   regex-substitutor render path. Intended for in-memory unit
 *   tests; production grammars ship `.jinja` files on disk.
 */
export function createRenderer(templatesDir: string): BoundRenderer;
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	if (typeof pathOrConfig !== 'string') {
		return createRendererFromConfig(pathOrConfig);
	}
	// String argument is a `.jinja` templates directory. Empty
	// RulesConfig is sufficient — the Nunjucks path reads templates
	// from disk, not the config.
	const emptyConfig: RulesConfig = {
		language: '',
		extensions: [],
		expandoChar: null,
		metadata: { grammarSha: '' },
		rules: {},
	};
	return createRendererFromConfig(emptyConfig, { templatesDir: pathOrConfig });
}

// @generated-header: false (hand-written core — preserved across regeneration)
//
// Loader: ergonomic `createRenderer(templatesDir)` entry point.
//
// Post-feature-011: the legacy YAML template file format has been
// retired in favor of per-rule `.jinja` files. A directory path
// points at the `.jinja` root; a RulesConfig skips filesystem I/O
// entirely (unit-test convenience on the legacy regex-substitutor
// path, retained for in-memory test fixtures).

import { existsSync, readFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import type { RulesConfig, TemplateRule } from './types.ts';
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
	// String argument is a `.jinja` templates directory. The Nunjucks
	// path reads templates from disk, but the per-rule `joinBy` /
	// `joinByField` / `joinByLeading` / `joinByTrailing` metadata lives
	// in a sibling `_meta.json` written by the codegen emitter —
	// parse it into the RulesConfig so buildNunjucksTemplateContext
	// produces correct separator output (tuple `(a, b, c)` vs legacy-
	// empty `(a b c)`).
	const config: RulesConfig = {
		language: '',
		extensions: [],
		expandoChar: null,
		metadata: { grammarSha: '' },
		rules: loadJinjaMeta(pathOrConfig),
	};
	return createRendererFromConfig(config, { templatesDir: pathOrConfig });
}

/**
 * Load `_meta.json` from a `.jinja` templates directory and return the
 * per-rule metadata as a RulesConfig rules map. Missing / empty /
 * malformed meta is not fatal — the Nunjucks path's separator defaults
 * (space join, no flank) take over and rendering degrades but still
 * succeeds. Upstream callers that regenerate the templates re-emit
 * `_meta.json` alongside the `.jinja` files.
 */
function loadJinjaMeta(templatesDir: string): Record<string, TemplateRule> {
	const metaPath = pathJoin(templatesDir, '_meta.json');
	if (!existsSync(metaPath)) return {};
	let raw: unknown;
	try {
		raw = JSON.parse(readFileSync(metaPath, 'utf-8'));
	} catch {
		return {};
	}
	if (!raw || typeof raw !== 'object') return {};
	const out: Record<string, TemplateRule> = {};
	for (const [kind, value] of Object.entries(raw as Record<string, unknown>)) {
		if (!value || typeof value !== 'object') continue;
		// Only surface the separator-metadata fields the Nunjucks path
		// actually reads. Anything else in `_meta.json` (future codegen
		// additions) is preserved so downstream readers can see it too,
		// but the documented contract is these four keys.
		out[kind] = value as TemplateRule;
	}
	return out;
}

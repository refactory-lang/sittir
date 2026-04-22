// @generated-header: false (hand-written core — preserved across regeneration)
//
// Loader: YAML template I/O + ergonomic `createRenderer(yamlPath)` overload.
// Lives in its own module so `render.ts` can be imported in browsers without
// pulling in `node:fs` / `yaml`. Consumers that need the file-loading path
// import from `@sittir/core` (root) which re-exports from here.

import * as fs from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { RulesConfig } from './types.ts';
import { createRendererFromConfig, type BoundRenderer } from './render.ts';

/** Load and parse a templates.yaml file into a RulesConfig. */
export function loadTemplates(yamlPath: string): RulesConfig {
	const content = fs.readFileSync(yamlPath, 'utf-8');
	return parseYaml(content) as RulesConfig;
}

/**
 * Create a renderer bound to a specific templates source.
 *
 * When `pathOrConfig` is a string, the loader detects its kind:
 * - Path ending in `.yaml` (or any file path): legacy YAML templates
 *   file. Loaded via `loadTemplates()`; renderer uses the regex
 *   substitutor path in `render.ts`.
 * - Path to a directory containing `.jinja` files: per-rule Nunjucks
 *   templates (feature 011). Renderer dispatches through
 *   `createRendererFromConfig(_, { templatesDir })`.
 *
 * A pre-parsed RulesConfig skips the filesystem step entirely.
 *
 * Both paths produce byte-identical output on the corpus; the
 * detection is a migration lever, not a functional difference.
 */
export function createRenderer(pathOrConfig: string): BoundRenderer;
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	if (typeof pathOrConfig !== 'string') {
		return createRendererFromConfig(pathOrConfig);
	}
	// Stat the path to distinguish directory (new .jinja layout) from
	// file (legacy YAML). Non-existent paths fall through to the YAML
	// loader which raises a clearer error.
	let isDir = false;
	try {
		isDir = fs.statSync(pathOrConfig).isDirectory();
	} catch {
		isDir = false;
	}
	if (isDir) {
		// Per-rule `.jinja` layout. Nunjucks path — no YAML to load;
		// pass an empty RulesConfig so legacy code that inspects
		// config doesn't choke.
		const emptyConfig: RulesConfig = {
			language: '',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: {},
		};
		return createRendererFromConfig(emptyConfig, { templatesDir: pathOrConfig });
	}
	return createRendererFromConfig(loadTemplates(pathOrConfig));
}

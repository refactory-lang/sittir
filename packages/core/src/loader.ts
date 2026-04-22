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
 * Create a renderer bound to a specific YAML templates file.
 * Loads and parses the YAML once — no need to pass config on every render() call.
 */
export function createRenderer(yamlPath: string): BoundRenderer;
/**
 * Create a renderer from a pre-parsed RulesConfig.
 */
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	const config = typeof pathOrConfig === 'string' ? loadTemplates(pathOrConfig) : pathOrConfig;
	return createRendererFromConfig(config);
}

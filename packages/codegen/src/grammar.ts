/**
 * Layer 1: Grammar — faithful representation of grammar.json
 *
 * No heuristics. No cross-referencing. Just structured access.
 */

import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// Grammar Rule — discriminated union of all grammar constructs
// ---------------------------------------------------------------------------

export type GrammarRule =
	| { type: 'SEQ'; members: GrammarRule[] }
	| { type: 'CHOICE'; members: GrammarRule[] }
	| { type: 'STRING'; value: string }
	| { type: 'FIELD'; name: string; content: GrammarRule }
	| { type: 'SYMBOL'; name: string }
	| { type: 'BLANK' }
	| { type: 'REPEAT'; content: GrammarRule }
	| { type: 'REPEAT1'; content: GrammarRule }
	| { type: 'PREC'; value: number; content: GrammarRule }
	| { type: 'PREC_LEFT'; value: number; content: GrammarRule }
	| { type: 'PREC_RIGHT'; value: number; content: GrammarRule }
	| { type: 'PREC_DYNAMIC'; value: number; content: GrammarRule }
	| { type: 'ALIAS'; content: GrammarRule; named: boolean; value: string }
	| { type: 'TOKEN'; content: GrammarRule }
	| { type: 'IMMEDIATE_TOKEN'; content: GrammarRule }
	| { type: 'PATTERN'; value: string };

// ---------------------------------------------------------------------------
// Grammar — parsed grammar.json
// ---------------------------------------------------------------------------

export interface PrecedenceEntry {
	type: string;
	value: string | { type: string; name: string };
}

export interface Grammar {
	name: string;
	rules: Record<string, GrammarRule>;
	extras: GrammarRule[];
	conflicts: string[][];
	precedences: PrecedenceEntry[][];
	externals: GrammarRule[];
	inline: string[];
	supertypes: string[];
	word: string | null;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const require = createRequire(import.meta.url);
const grammarJsonCache = new Map<string, Grammar>();

/**
 * Well-known grammar paths for non-standard layouts.
 * Most grammars use `tree-sitter-{grammar}/src/grammar.json`.
 */
const GRAMMAR_PATHS: Record<string, string> = {
	typescript: 'tree-sitter-typescript/typescript/src/node-types.json',
	tsx: 'tree-sitter-typescript/tsx/src/node-types.json',
};

/** Registry of explicit paths (set via registerGrammarPath). */
const explicitPaths = new Map<string, string>();

/** Register an explicit file path for a grammar's node-types.json. */
export function registerGrammarPath(grammar: string, nodeTypesPath: string): void {
	explicitPaths.set(grammar, nodeTypesPath);
	grammarJsonCache.delete(grammar);
}

/** Resolve the src/ directory for a grammar. */
function resolveGrammarSrcDir(grammar: string): string {
	const explicitPath = explicitPaths.get(grammar);
	if (explicitPath) {
		const { dirname } = require('node:path') as typeof import('node:path');
		return dirname(explicitPath);
	}
	const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
	const nodeTypesPath = require.resolve(modulePath);
	const { dirname } = require('node:path') as typeof import('node:path');
	return dirname(nodeTypesPath);
}

/**
 * Load and parse grammar.json for the given grammar.
 * Caches on first load.
 */
export function loadGrammar(grammarName: string): Grammar {
	const cached = grammarJsonCache.get(grammarName);
	if (cached) return cached;

	const { join } = require('node:path') as typeof import('node:path');
	const srcDir = resolveGrammarSrcDir(grammarName);
	const grammarJson: Grammar = require(join(srcDir, 'grammar.json'));

	grammarJsonCache.set(grammarName, grammarJson);
	return grammarJson;
}

/**
 * Get the raw rule for a given kind, or null if no rule exists.
 */
export function getRule(grammar: Grammar, kind: string): GrammarRule | null {
	return grammar.rules[kind] ?? null;
}

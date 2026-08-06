import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `injectTransformHiddenRulePlaceholders` (dsl/wire/wire.ts) conservatively
 * pre-registers a `_kw_<name>`/`_<name>` rule for every one-arg
 * field()/variant()/alias() placeholder before it's known whether the
 * override actually needs a synthesized rule at that name — tree-sitter's
 * grammar() requires every eventually-SYMBOL-referenced name to already
 * exist as a rule key before any rule body evaluates. evaluate.ts's own
 * `prunePlaceholderOrphans` cleans up sittir's internal rule map for the
 * compiler pipeline, but `tree-sitter generate` (a separate process
 * compiling the same bundled `grammar.js`) writes `grammar.json` directly
 * with no equivalent pass, leaving orphaned `{type: 'BLANK'}` entries for
 * every placeholder whose override never actually produced a keyword
 * literal. These never reach parser.c/node-types.json (tree-sitter's own
 * compiler silently drops unreferenced named rules from real output) —
 * this is dump hygiene only, not a parser behavior change.
 *
 * Called after every `tree-sitter generate` invocation (both call sites:
 * `run-codegen.ts::runTreeSitterGenerate` and
 * `compile-parser.ts::compileParser`, which independently re-runs generate
 * before building the WASM binary).
 */
export function pruneOrphanedPlaceholderRules(sittirDir: string): void {
	const grammarJsonPath = join(sittirDir, 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return;
	const doc = JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as {
		rules?: Record<string, unknown>;
		extras?: unknown[];
		externals?: unknown[];
		conflicts?: string[][];
		inline?: string[];
		supertypes?: string[];
		word?: string;
	};
	const rules = doc.rules ?? {};
	const referenced = new Set<string>();
	const collectSymbolRefs = (node: unknown): void => {
		if (Array.isArray(node)) {
			for (const item of node) collectSymbolRefs(item);
			return;
		}
		if (!node || typeof node !== 'object') return;
		const obj = node as Record<string, unknown>;
		if (obj.type === 'SYMBOL' && typeof obj.name === 'string') referenced.add(obj.name);
		for (const value of Object.values(obj)) collectSymbolRefs(value);
	};
	collectSymbolRefs(rules);
	collectSymbolRefs(doc.extras);
	collectSymbolRefs(doc.externals);
	for (const pair of doc.conflicts ?? []) for (const name of pair) referenced.add(name);
	for (const name of doc.inline ?? []) referenced.add(name);
	for (const name of doc.supertypes ?? []) referenced.add(name);
	if (doc.word) referenced.add(doc.word);

	let pruned = 0;
	for (const [name, rule] of Object.entries(rules)) {
		if (!name.startsWith('_') || referenced.has(name)) continue;
		if (!rule || typeof rule !== 'object' || (rule as { type?: string }).type !== 'BLANK') continue;
		delete rules[name];
		pruned += 1;
	}
	if (pruned === 0) return;
	writeFileSync(grammarJsonPath, JSON.stringify(doc, null, 2), 'utf8');
	console.log(`  → pruned ${pruned} orphaned placeholder rule(s) from grammar.json`);
}

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectSymbolRefs, collectUnreachableHiddenRules } from '../util/reachable-rules.ts';

/**
 * Prune hidden rules that nothing reaches from `grammar.json`.
 *
 * Two populations land here:
 *  - `injectTransformHiddenRulePlaceholders` (dsl/wire/wire.ts) conservatively
 *    pre-registers a `_kw_<name>`/`_<name>` rule for every one-arg
 *    field()/variant()/alias() placeholder before it's known whether the
 *    override actually needs a synthesized rule at that name, leaving
 *    `{type: 'BLANK'}` entries when it doesn't.
 *  - Enrich mints whose owner rule an override fully redeclares (and any
 *    hidden helper such a redeclaration strands) — the override body carries
 *    its own copy of the hoisted content, orphaning the raw mint.
 *
 * Neither population reaches parser.c/node-types.json (tree-sitter's own
 * compiler silently drops unreferenced named rules from real output) — this
 * keeps grammar.json, sittir's ground-truth view of the parser, in agreement.
 * `compiler/evaluate.ts`'s `pruneUnreachableHiddenRules` is the sittir-
 * pipeline twin over the same shared reachability traversal — the two MUST
 * stay in lockstep or the model diverges from the parser.
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
		precedences?: unknown[];
		conflicts?: string[][];
		inline?: string[];
		supertypes?: string[];
		word?: string;
	};
	const rules = doc.rules ?? {};
	// Names the grammar machinery references outside rule bodies — roots the
	// reachability walk must honor even when no surviving rule mentions them.
	// `conflicts:`/`inline:` deliberately do NOT root: wire registers every
	// visible-group mint there, so an orphaned mint would keep itself alive
	// through its own bookkeeping entries — those entries are dead alongside
	// the rule and are filtered below instead.
	const protectedNames = new Set<string>();
	collectSymbolRefs(doc.extras, protectedNames);
	collectSymbolRefs(doc.externals, protectedNames);
	collectSymbolRefs(doc.precedences, protectedNames);
	for (const name of doc.supertypes ?? []) protectedNames.add(name);
	if (doc.word) protectedNames.add(doc.word);

	const unreachable = collectUnreachableHiddenRules(rules, protectedNames);
	if (unreachable.length === 0) return;
	const dead = new Set(unreachable);
	for (const name of dead) delete rules[name];
	if (doc.conflicts) doc.conflicts = doc.conflicts.filter((pair) => !pair.some((name) => dead.has(name)));
	if (doc.inline) doc.inline = doc.inline.filter((name) => !dead.has(name));
	writeFileSync(grammarJsonPath, JSON.stringify(doc, null, 2), 'utf8');
	console.log(`  → pruned ${unreachable.length} unreachable hidden rule(s) from grammar.json`);
}

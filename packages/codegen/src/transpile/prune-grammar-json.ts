import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectSymbolRefs, pruneOrphanedRules } from '../util/reachable-rules.ts';

export interface TreeSitterGrammarDoc {
	readonly rules?: Readonly<Record<string, unknown>>;
	readonly extras?: unknown;
	readonly externals?: unknown;
	readonly precedences?: unknown;
	readonly conflicts?: readonly (readonly string[])[];
	readonly inline?: readonly string[];
	readonly supertypes?: readonly unknown[];
	readonly word?: string | null;
	readonly reserved?: unknown;
}

export interface TreeSitterPrune<G> {
	readonly grammar: G;
	readonly pruned: readonly string[];
}

export function treeSitterPruned<G extends TreeSitterGrammarDoc>(doc: G): TreeSitterPrune<G> {
	const protectedNames = new Set<string>();
	collectSymbolRefs(doc.extras, protectedNames);
	collectSymbolRefs(doc.externals, protectedNames);
	collectSymbolRefs(doc.precedences, protectedNames);
	collectSymbolRefs(doc.supertypes, protectedNames);
	for (const name of doc.supertypes ?? []) if (typeof name === 'string') protectedNames.add(name);
	if (doc.word) protectedNames.add(doc.word);

	const prune = pruneOrphanedRules({ rules: doc.rules ?? {}, inline: doc.inline, conflicts: doc.conflicts }, protectedNames);
	if (prune.pruned.length === 0) return { grammar: doc, pruned: [] };
	return {
		grammar: { ...doc, rules: prune.rules, ...(doc.conflicts ? { conflicts: prune.conflicts } : {}), ...(doc.inline ? { inline: prune.inline } : {}) },
		pruned: prune.pruned
	};
}

export function pruneOrphanedPlaceholderRules(sittirDir: string): void {
	const grammarJsonPath = join(sittirDir, 'src', 'grammar.json');
	if (!existsSync(grammarJsonPath)) return;
	const { grammar, pruned } = treeSitterPruned(JSON.parse(readFileSync(grammarJsonPath, 'utf8')) as TreeSitterGrammarDoc);
	if (pruned.length === 0) return;
	writeFileSync(grammarJsonPath, JSON.stringify(grammar, null, 2), 'utf8');
	console.log(`  → pruned ${pruned.length} orphaned rule(s) from grammar.json`);
}

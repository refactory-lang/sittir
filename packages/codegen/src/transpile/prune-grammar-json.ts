import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectSymbolRefs, pruneOrphanedRules } from '../util/reachable-rules.ts';

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
	const protectedNames = new Set<string>();
	collectSymbolRefs(doc.extras, protectedNames);
	collectSymbolRefs(doc.externals, protectedNames);
	collectSymbolRefs(doc.precedences, protectedNames);
	for (const name of doc.supertypes ?? []) protectedNames.add(name);
	if (doc.word) protectedNames.add(doc.word);

	const prune = pruneOrphanedRules({ rules, inline: doc.inline, conflicts: doc.conflicts }, protectedNames);
	if (prune.pruned.length === 0) return;
	doc.rules = prune.rules;
	if (doc.conflicts) doc.conflicts = prune.conflicts;
	if (doc.inline) doc.inline = prune.inline;
	writeFileSync(grammarJsonPath, JSON.stringify(doc, null, 2), 'utf8');
	console.log(`  → pruned ${prune.pruned.length} orphaned rule(s) from grammar.json`);
}

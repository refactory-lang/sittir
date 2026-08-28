import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { collectSymbolRefs, collectUnreachableHiddenRules } from '../util/reachable-rules.ts';

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

	const unreachable = collectUnreachableHiddenRules(rules, protectedNames);
	if (unreachable.length === 0) return;
	const dead = new Set(unreachable);
	for (const name of dead) delete rules[name];
	if (doc.conflicts) doc.conflicts = doc.conflicts.filter((pair) => !pair.some((name) => dead.has(name)));
	if (doc.inline) doc.inline = doc.inline.filter((name) => !dead.has(name));
	writeFileSync(grammarJsonPath, JSON.stringify(doc, null, 2), 'utf8');
	console.log(`  → pruned ${unreachable.length} unreachable hidden rule(s) from grammar.json`);
}

// Checks that base RuleIds survive binding: evaluates a grammar unbound and bound, runs both through link and
// normalize, and compares every rule id in the normalized rules. A renamed kind must keep its base root id, and
// the id sets must be equal apart from ids a split adds.
import { evaluatePackage } from '../../../../packages/codegen/src/compiler/evaluate-package.ts';
import { load } from '../../../../packages/tools/src/codegen-surface.ts';
import { readFileSync, writeFileSync } from 'node:fs';
import { grammarPackage } from '../../../../packages/codegen/src/grammars.ts';
import { RuleWalker } from '../../../../packages/codegen/src/dsl/rule-walker.ts';

const grammar = process.argv[2] ?? 'rust';
const pkg = grammarPackage(grammar);
const ids = (rules: Record<string, { id?: string }>) => {
	const all = new Set<string>();
	const walker = new RuleWalker<any>();
	for (const rule of Object.values(rules)) {
		const visit = (r: any): void => {
			if (r.id) all.add(r.id);
			for (const id of r.absorbedIds ?? []) all.add(id);
			for (const c of walker.childrenOf(r)) visit(c);
		};
		visit(rule);
	}
	return all;
};
const { link } = await load('link');
const { normalizeGrammar } = await load('normalize');
const run = async (unbound: boolean) => {
	const raw = await evaluatePackage(pkg, { unbound });
	const linked = await link(raw);
	const normalized = await normalizeGrammar(linked);
	return { raw, linkedIds: ids(linked.rules as any), normIds: ids(normalized.normalizedRules as any), roots: normalized.normalizedRules as any };
};
// Each side must run against its own generated id tables, so the base is snapshotted before the package is
// regenerated from the bound grammar: `snapshot` writes the base ids, `compare` reads them beside the bound run.
const [mode = 'compare', file = 'base-rust/rule-ids.json'] = process.argv.slice(3);
if (mode === 'snapshot') {
	const b = await run(true);
	writeFileSync(file, JSON.stringify({ linkedIds: [...b.linkedIds], normIds: [...b.normIds], roots: Object.fromEntries(Object.entries(b.roots).map(([k, r]: [string, any]) => [k, r.id])) }));
	console.log(`wrote ${file}`);
	process.exit(0);
}
const snap = JSON.parse(readFileSync(file, 'utf8'));
const base = { linkedIds: new Set<string>(snap.linkedIds), normIds: new Set<string>(snap.normIds), roots: Object.fromEntries(Object.entries(snap.roots).map(([k, id]) => [k, { id }])) as any };
const bound = await run(false);
const renamedFrom = bound.raw.renamedFrom ?? {};
let rootsKept = 0;
const rootsLost: string[] = [];
for (const [to, from] of Object.entries(renamedFrom)) {
	const b = bound.roots[to]?.id, a = base.roots[from]?.id;
	if (a === undefined && b === undefined) continue;
	if (a === b) rootsKept++;
	else rootsLost.push(`${from} → ${to}: base ${a} bound ${b}`);
}
const diff = (x: Set<string>, y: Set<string>) => [...x].filter((i) => !y.has(i));
// A split's arm and placement clones mint ids of their own and point back at the base kind they split:
// every id the bound run adds must be owned by a split rule, and every split rule's base must have a base root id.
const splitFrom: Record<string, string> = bound.raw.splitFrom ?? {};
const baseKindOf = (kind: string) => renamedFrom[kind] ?? kind;
const ownerOf = (id: string) => id.slice('rule:'.length, id.indexOf(':', 'rule:'.length));
const unowned = diff(bound.linkedIds, base.linkedIds).filter((id) => !(ownerOf(id) in splitFrom));
const unresolved = Object.entries(splitFrom).filter(([, from]) => base.roots[baseKindOf(from)]?.id === undefined && !base.linkedIds.has(`rule:${baseKindOf(from)}:root`));
console.log(`splits: ${Object.keys(splitFrom).length} split rules; added ids not owned by a split rule ${unowned.length}; split rules whose base has no base root id ${unresolved.length}`);
for (const [to, from] of Object.entries(splitFrom)) console.log(`  ${to} splitFrom ${from} → base rule:${baseKindOf(from)}:root`);
for (const [phase, a, b] of [['link', base.linkedIds, bound.linkedIds], ['normalize', base.normIds, bound.normIds]] as const) {
	const lost = diff(a, b), added = diff(b, a);
	console.log(`${phase}: base ${a.size} ids, bound ${b.size}; base ids missing from bound ${lost.length}, bound ids not in base ${added.length}`);
	for (const i of lost.slice(0, 8)) console.log(`  missing ${i}`);
	for (const i of added.slice(0, 8)) console.log(`  added   ${i}`);
}
console.log(`renamed kinds keeping their base root id: ${rootsKept}; not: ${rootsLost.length}`);
for (const l of rootsLost.slice(0, 10)) console.log(`  ${l}`);

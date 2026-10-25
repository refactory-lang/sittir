// The runtime bindings generator's census: what each bound grammar's generated rows and routes hold today, read as the
// build, `is` and `kinds` entries and the flags each guard would test.
//   pnpm exec tsx docs/superpowers/probes/2026-10-25-runtime-bindings-census/census.mts <checkout root> <results dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [root, out] = process.argv.slice(2);
if (root === undefined || out === undefined) throw new Error('usage: census.mts <checkout root> <results dir>');
const GRAMMARS = ['rust', 'python', 'typescript'] as const;

type Plan = { readonly op: string; readonly of?: Plan | readonly Plan[] };
interface Condition {
	readonly up: number;
	readonly via: readonly unknown[];
	readonly plan: Plan;
}
interface Read {
	readonly vocab: string;
	readonly within: readonly string[];
	readonly pins: readonly { readonly member: string; readonly text: string }[];
	readonly test: readonly Condition[];
	readonly template?: unknown;
}
interface MemberRecord {
	readonly name: string;
	readonly route: string;
	readonly path: unknown;
	readonly flag?: true;
	readonly spelled?: true;
}
interface KindRecord {
	readonly read?: readonly Read[];
	readonly members?: readonly MemberRecord[];
}
interface Rows {
	readonly table: {
		readonly paths: Readonly<Record<string, { readonly ids: readonly number[]; readonly exact: boolean }>>;
		readonly entries: Readonly<Record<string, readonly { readonly path: string; readonly within: readonly unknown[]; readonly test: readonly Condition[] }[]>>;
		readonly fixedText: Readonly<Record<string, string>>;
	};
}
type FlagPlans = Readonly<Record<string, Readonly<Record<string, Plan | null>>>>;
type SlotFlags = Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, unknown>>>>>>;

interface Declared {
	readonly qname: string;
	readonly path: string | undefined;
	readonly members: readonly { readonly name: string; readonly flag: boolean }[];
}
interface Feature {
	readonly name: string;
	readonly parents: readonly string[];
	readonly stubs: readonly Declared[];
}
const { readVocabulary, readVocabularySource, lineageOf } = await import(join(root, 'packages/codegen/src/bindings/vocabulary.ts'));
const { VOCABULARY_DIR } = await import(join(root, 'packages/codegen/src/bindings/facts.ts'));
const { vocabularyPaths } = (await import(join(root, 'packages/common/src/portable/vocabulary-paths.ts'))) as { vocabularyPaths: readonly string[] };
const vocabulary = await readVocabulary(VOCABULARY_DIR);
const source = (await readVocabularySource(VOCABULARY_DIR)) as { kinds: readonly Declared[]; features: readonly Feature[] };
const pathByName = new Map([...source.kinds, ...source.features.flatMap((f) => f.stubs)].flatMap((d) => (d.path === undefined ? [] : [[d.qname, d.path] as const])));
const flagNames = (d: Declared): string[] => d.members.filter((m) => m.flag).map((m) => m.name);
const baseFlags = new Map(source.kinds.map((d) => [d.path!, flagNames(d)]));
const featureFlags = new Map(
	source.features.map((f) => [f.name, f.stubs.flatMap((s) => flagNames(s).map((flag) => ({ path: s.path ?? pathByName.get(s.qname)!, flag })))])
);
const COMPOSITION = { rust: 'RustFeatures', python: 'PythonFeatures', typescript: 'TypeScriptFeatures' } as const;
const compositions = new Map(
	[...readFileSync(join(VOCABULARY_DIR, 'compositions.ts'), 'utf8').matchAll(/export interface (\w+)\s+extends([^{]+)\{/g)].map(
		([, name, list]) => [name!, list!.split(',').map((s) => s.trim())] as const
	)
);
const parentsOf = new Map(source.features.map((f) => [f.name, f.parents]));
const featuresOf = (composition: string): Set<string> => {
	const closed = new Set<string>();
	const visit = (name: string): void => {
		if (closed.has(name)) return;
		const composed = compositions.get(name);
		if (composed !== undefined) return composed.forEach(visit);
		closed.add(name);
		(parentsOf.get(name) ?? []).forEach(visit);
	};
	visit(composition);
	return closed;
};
const flagsFor = (features: ReadonlySet<string>) => (path: string): string[] => {
	const lineage: readonly string[] = lineageOf(path, (line: string) => vocabulary.kinds.get(line));
	const flags = new Set(lineage.flatMap((line) => baseFlags.get(line) ?? []));
	for (const feature of features) for (const { path: at, flag } of featureFlags.get(feature) ?? []) if (lineage.includes(at)) flags.add(flag);
	return [...flags].sort();
};

const opsOf = (plan: Plan): string[] => [plan.op, ...(plan.of === undefined ? [] : (Array.isArray(plan.of) ? plan.of : [plan.of]).flatMap(opsOf))];
const refinementOf = (entry: Read): string => {
	if (entry.within.length > 0) return 'placed';
	if (entry.template !== undefined) return 'template';
	if (entry.pins.length > 0) return 'literal';
	const ops = new Set(entry.test.flatMap((c) => opsOf(c.plan)));
	if (ops.size === 0) return 'plain';
	if (ops.has('is')) return 'child kind';
	if (ops.has('eq') || ops.has('match')) return 'text';
	return 'presence';
};
const count = <K,>(items: Iterable<K>): Map<K, number> => {
	const counts = new Map<K, number>();
	for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
	return counts;
};
const tally = (counts: ReadonlyMap<string, number>): string =>
	[...counts].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, n]) => `${k} ${n}`).join(', ');

const summary: string[] = [`${vocabularyPaths.length} vocabulary paths; ${vocabulary.flags.size} flags declared (${[...vocabulary.flags].sort().join(', ')})`];
const detail: string[] = [];
for (const grammar of GRAMMARS) {
	const model = JSON.parse(readFileSync(join(root, 'packages', grammar, 'src', 'node-model-portable.json5'), 'utf8')) as { kinds: Readonly<Record<string, KindRecord>> };
	const generated = (await import(join(root, 'packages', grammar, 'src', 'portable.ts'))) as { rows: Rows; queryFlags: FlagPlans; querySlotFlags: SlotFlags };
	const { table } = generated.rows;
	const paths = Object.entries(table.paths);
	const entries = Object.values(table.entries).flat();

	const reads = Object.entries(model.kinds).flatMap(([kind, record]) => (record.read ?? []).map((entry) => ({ kind, entry, refinement: refinementOf(entry) })));
	const own = new Map<string, Set<string>>();
	for (const { kind, entry } of reads) (own.get(entry.vocab) ?? own.set(entry.vocab, new Set()).get(entry.vocab)!).add(kind);
	const lowLevel = JSON.parse(readFileSync(join(root, 'packages', grammar, 'src', 'node-model.json5'), 'utf8')) as {
		nodes: readonly { readonly kind: string; readonly modelType: string; readonly variantOf?: string; readonly text?: string }[];
	};
	const modelTypeOf = new Map(lowLevel.nodes.map((n) => [n.kind, n.modelType]));
	const formOf = new Map(
		lowLevel.nodes.flatMap((n) => (n.variantOf === undefined || modelTypeOf.get(n.variantOf) === 'supertype' ? [] : [[n.kind, n.variantOf] as const]))
	);
	const baseOf = (kind: string): string => formOf.get(kind) ?? kind;
	const abstract = paths.filter(([path]) => !own.has(path)).map(([path]) => path);
	const builds = (kind: string): boolean => !kind.startsWith('_') && modelTypeOf.get(kind) !== 'supertype';
	const builtAt = new Map([...own].map(([path, kinds]) => [path, new Set([...kinds].filter(builds).map(baseOf))]));
	const unbuilt = [...builtAt].filter(([, bases]) => bases.size === 0).map(([path]) => path);
	const multi = [...builtAt].filter(([, bases]) => bases.size > 1);
	const plainAt = (path: string, base: string): boolean =>
		reads.some((r) => baseOf(r.kind) === base && r.entry.vocab === path && r.refinement === 'plain');
	const membersOf = (path: string, base: string): string =>
		[...new Set([...own.get(path)!].filter((k) => baseOf(k) === base).flatMap((k) => (model.kinds[k]?.members ?? []).map((m) => m.name)))].sort().join(',');
	const alike = multi.flatMap(([path, bases]) => {
		const bySignature = new Map<string, string[]>();
		for (const base of [...bases].filter((b) => plainAt(path, b)).sort())
			(bySignature.get(membersOf(path, base)) ?? bySignature.set(membersOf(path, base), []).get(membersOf(path, base))!).push(base);
		return [...bySignature].filter(([, group]) => group.length > 1).map(([signature, group]) => ({ path, group, signature }));
	});
	const fixedText = new Set(lowLevel.nodes.flatMap((n) => (n.text === undefined ? [] : [n.kind])));
	const leafAlike = alike.filter((a) => a.signature === '');
	const enumAlike = leafAlike.filter((a) => a.group.every((kind) => fixedText.has(kind)));
	const members = Object.entries(model.kinds).flatMap(([kind, record]) => (record.members ?? []).map((member) => ({ kind, member })));

	const flagPairs = Object.entries(generated.queryFlags).flatMap(([id, plans]) => Object.entries(plans).map(([flag, plan]) => ({ id, flag, routed: plan !== null })));
	const flagsOfId = new Map<number, Set<string>>();
	for (const { id, flag, routed } of flagPairs) if (routed) (flagsOfId.get(Number(id)) ?? flagsOfId.set(Number(id), new Set()).get(Number(id))!).add(flag);
	const features = featuresOf(COMPOSITION[grammar]);
	const declaredFlags = flagsFor(features);
	const guards = paths.flatMap(([path, { ids }]) =>
		declaredFlags(path).map((flag) => ({ path, flag, routed: ids.some((id) => flagsOfId.get(id)?.has(flag) === true) }))
	);
	const readFlags = new Set(flagPairs.filter((p) => p.routed).map((p) => p.flag));
	const slotTriples = Object.values(generated.querySlotFlags).flatMap((slots) => Object.values(slots).flatMap((held) => Object.keys(held)));
	const scalar = paths.filter(([path]) => /^literal\.(number|boolean)(\.|$)/.test(path));
	const scalarKinds = new Set(scalar.flatMap(([path]) => [...(own.get(path) ?? [])]));

	summary.push(
		'',
		`## ${grammar}`,
		`kinds/is: ${paths.length} paths read (${paths.filter(([, p]) => p.exact).length} exact, ${paths.filter(([, p]) => !p.exact).length} decided by the read entries); ${Object.keys(table.entries).length} kind ids with ${entries.length} read entries (${entries.filter((e) => e.test.length > 0).length} conditional, ${entries.filter((e) => e.within.length > 0).length} placed, ${entries.filter((e) => e.test.some((c) => c.up > 0)).length} on an enclosing node); ${Object.keys(table.fixedText).length} fixed-text kind ids`,
		`flags: ${Object.keys(generated.queryFlags).length} kind ids with a flag table, ${flagPairs.length} (kind, flag) pairs, ${flagPairs.filter((p) => !p.routed).length} with no plan; ${readFlags.size} flags read (${[...readFlags].sort().join(', ')}); not read: ${[...vocabulary.flags].filter((f) => !readFlags.has(f as string)).sort().join(', ') || 'none'}`,
		`slot flags: ${Object.keys(generated.querySlotFlags).length} kind ids, ${slotTriples.length} (kind, slot, flag) rows`,
		`flag guards the grammar's composition (${features.size} features) declares on the paths it reads: ${guards.length} (path, flag) pairs on ${new Set(guards.map((g) => g.path)).size} paths; ${guards.filter((g) => g.routed).length} read by a kind at or under the path, ${guards.filter((g) => !g.routed).length} by none`,
		`build: ${own.size} paths with an own read entry (${own.size - multi.length - unbuilt.length} build one kind, ${multi.length} pick among several kinds or forms, ${unbuilt.length} claim only hidden or supertype kinds), ${abstract.length} paths read only beneath (no build of their own); ${reads.length} (kind, path) entries by refinement: ${tally(count(reads.map((r) => r.refinement)))}`,
		`build, several kinds at one path with the same member names and no refinement test: ${alike.length} groups; ${enumAlike.length} of fixed-text leaves (one const string per kind), ${leafAlike.length - enumAlike.length} of varying leaves, ${alike.length - leafAlike.length} with members`,
		`members: ${members.length} routes by route: ${tally(count(members.map((m) => m.member.route)))}; ${members.filter((m) => m.member.flag === true).length} flag members; ${members.filter((m) => m.member.path === null && m.member.spelled !== true).length} with no build path`,
		`scalar contracts: ${scalar.length} literal.number / literal.boolean paths read, ${scalarKinds.size} grammar kinds claimed at them`
	);
	detail.push(
		'',
		`## ${grammar}`,
		'',
		'### paths that pick among several kinds or forms, hidden and supertype kinds left out; a form counts as its base unless the base is a supertype (path: kinds)',
		...multi.map(([path, bases]) => `${path}: ${[...bases].sort().join(', ')}`),
		'',
		'### paths that claim only hidden or supertype kinds',
		...unbuilt,
		'',
		'### same member names, no refinement test (path: kinds [members])',
		...alike.map(({ path, group, signature }) => `${path}: ${group.join(', ')} [${signature}]`),
		'',
		'### flag guards no kind at or under the path reads (path.flag)',
		...guards.filter((g) => !g.routed).map((g) => `${g.path}.${g.flag}`),
		'',
		'### (kind, flag) pairs with no plan',
		...flagPairs.filter((p) => !p.routed).map((p) => `${p.id}.${p.flag}`),
		'',
		'### scalar-contract paths (path: kinds)',
		...scalar.map(([path]) => `${path}: ${[...(own.get(path) ?? [])].sort().join(', ') || '(beneath only)'}`)
	);
}
writeFileSync(join(out, 'summary.txt'), `${summary.join('\n')}\n`);
writeFileSync(join(out, 'detail.txt'), `${detail.join('\n').trimStart()}\n`);
console.log(summary.join('\n'));

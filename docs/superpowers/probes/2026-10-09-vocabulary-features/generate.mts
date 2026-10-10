/**
 * Builds what this probe checks and measures. See README.md.
 *
 * It materializes the snapshot vocabulary and writes under out/:
 * - today/: the snapshot as it is, each grammar's context over the kinds it claims;
 * - fold/: the snapshot with its `BaseContext` folded into the namespace map (lib.mts, fold), no features;
 * - gate/: the demonstration, folded, with the equality, property-facts and visibility proposals applied (lib.mts).
 *   The features in features/ own their kinds and members; the base keeps the rest and loads the generated augmentation
 *   that adds them back, each gated on its feature. The grammar contexts extend the compositions in compositions.ts.
 *   With them: a JavaScript context, each language's names, and demo.ts. It prints the plan's notes and each
 *   composition's diagnostics against the snapshot's claims and routes.
 * - scale-gate/: the cost model, folded. Every member the snapshot tags as particular to some grammars, and every kind
 *   only some grammars claim, belongs to a feature named by those grammars, gated the same way.
 * - scale-registry/: the cost model with each level read off an augmentable kind registry instead of a generated union.
 * - flags-enum/, flags-const/, flags-names/, flags-registry/: gate with its flags written as flags, not members, in each
 *   flag encoding (lib.mts, FlagEncoding), and each consumer checking a kind's builder steps.
 *
 * One rule writes every variant's consumers, so the variants compare like for like (lib.mts, writeConsumers).
 *
 * Usage: `tsx generate.mts`; then `tsc -p out/<variant>/tsconfig.json`, `tsc -p out/gate/tsconfig.demo.json`, and
 * `tsc -p out/gate/tsconfig.errors.json` for the messages of the demo's negatives, and `tsc -p out/<flags variant>/tsconfig.check.json`
 * for the flag checks. `tsx cost.mts` measures.
 */
import { appendFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { languages } from './compositions.ts';
import {
	baseSlots,
	closure,
	composedMembers,
	contextLines,
	EQUALITY_CLAIMS,
	equalityProposal,
	flagDecls,
	flagRegistryAugmentation,
	flagRoutes,
	fold,
	GRAMMARS,
	HERE,
	lineage,
	materialize,
	membersOf,
	NAMESPACES,
	namesLines,
	OUT,
	OUTSIDE_PARENT,
	plan,
	propertyFactsProposal,
	readCompositions,
	readFeatures,
	readVocab,
	realization,
	restatingImports,
	under,
	visibilityProposal,
	writeConsumers,
	writeFeatureTree,
	writeFlags,
	writeGatedVocabulary,
	writeTsconfig,
	type Feature,
	type FeatureSpec,
	type FlagEncoding,
	type Grammar,
	type Language,
	type Levels,
	type Plan,
	type Vocab,
} from './lib.mts';

type LanguageKey = keyof typeof languages;
const NAME: Record<LanguageKey, string> = { python: 'Python', rust: 'Rust', typescript: 'TypeScript', javascript: 'JavaScript' };
const LETTER: Record<Grammar, string> = { python: 'p', rust: 'r', typescript: 't' };

function freshVariant(snapshot: string, name: string): string {
	const dir = join(OUT, name);
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(join(dir, 'vocabulary'), { recursive: true });
	cpSync(snapshot, join(dir, 'vocabulary'), { recursive: true });
	writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
	return dir;
}

/** Members a proposal routes beyond the snapshot's routes, by grammar and claimed path. */
type ExtraRoutes = (grammar: Grammar, path: string) => readonly string[];

/** A grammar's claims as a variant reads them: each path the vocabulary declares, with the members its routes reach. */
function claimsOf(grammar: Grammar, vocab: Vocab, remap: Readonly<Record<string, string>> = {}, extra: ExtraRoutes = () => []): Map<string, readonly string[]> {
	return new Map(
		Object.entries(realization[grammar].routes)
			.map(([path, routes]) => [remap[path] ?? path, routes] as const)
			.filter(([path]) => vocab.byPath.has(path))
			.map(([path, routes]) => [path, [...routes, ...extra(grammar, path)]] as const)
	);
}

const contextsHeader = (extra: readonly string[]): string[] => [
	"import type { GrammarContext } from './vocabulary/context.ts';",
	"import type * as V from './vocabulary/index.ts';",
	...extra,
	'',
];

function report(variant: string, langs: readonly Language[], members: (lang: Language, path: string) => readonly string[]): void {
	const kinds = langs.map((l) => `${l.key} ${l.claims.size}`).join(', ');
	const count = langs.map((l) => `${l.key} ${[...l.claims.keys()].reduce((n, p) => n + members(l, p).length, 0)}`).join(', ');
	console.log(`${variant}: kinds per grammar ${kinds}; members ${count}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// today and fold

function buildUngated(snapshot: string, variant: 'today' | 'fold'): void {
	const dir = freshVariant(snapshot, variant);
	const vocab = readVocab(join(dir, 'vocabulary'));
	const langs: Language[] = GRAMMARS.map((g) => ({
		key: g,
		name: NAME[g],
		ctx: `${NAME[g]}Context`,
		composition: null,
		has: () => true,
		claims: claimsOf(g, vocab),
		terms: {},
	}));
	const slots = baseSlots(readFileSync(join(dir, 'vocabulary/context.ts'), 'utf8'));
	writeFileSync(join(dir, 'languages.ts'), [...contextsHeader([]), ...langs.flatMap((l) => contextLines(vocab, null, new Map(), l, slots))].join('\n'));
	const members = (_: Language, path: string): string[] => [...membersOf(vocab, vocab.byPath.get(path)!).keys()].filter((m) => m !== '$kind');
	const consumers = writeConsumers(dir, vocab, null, new Map(), langs, members);
	writeTsconfig(join(dir, 'tsconfig.json'), ['languages.ts', ...consumers]);
	if (variant === 'fold') fold(dir, vocab, OUTSIDE_PARENT);
	report(variant, langs, members);
}

// ---------------------------------------------------------------------------------------------------------------------
// gate

interface Composed {
	readonly lang: Language;
	/** Every claim of the grammar the language reads, in the composition or not. */
	readonly claims: ReadonlyMap<string, readonly string[]>;
}

/** Each language over a gated vocabulary: its composition's closure and the claims in it. */
function composeLanguages(
	vocab: Vocab,
	p: Plan,
	features: ReadonlyMap<string, Feature>,
	compositions: ReadonlyMap<string, readonly string[]>,
	entries: readonly (readonly [string, Grammar, Readonly<Record<string, string>>, Readonly<Record<string, string>>])[],
	extra?: ExtraRoutes
): Composed[] {
	return entries.map(([key, grammar, terms, remap]) => {
		const composition = `${NAME[key as LanguageKey]}Features`;
		const set = closure(composition, features, compositions);
		const has = (f: string): boolean => set.has(f);
		const claims = claimsOf(grammar, vocab, remap, extra);
		const inComposition = (path: string): boolean => {
			const added = p.kinds.get(path);
			return added === undefined || has(added.feature);
		};
		const lang: Language = {
			key,
			name: NAME[key as LanguageKey],
			ctx: `${NAME[key as LanguageKey]}Context`,
			composition: `C.${composition}`,
			has,
			claims: new Map([...claims].filter(([path]) => inComposition(path))),
			terms,
		};
		return { lang, claims };
	});
}

/** What a composition and the snapshot's bindings say of each other. */
function diagnose(vocab: Vocab, p: Plan, features: ReadonlyMap<string, Feature>, composed: readonly Composed[]): void {
	console.log('gate: what the plan found');
	for (const n of p.notes) console.log(`  ${n}`);
	const reserved = new Set<string>([...NAMESPACES, 'slots']);
	const collide = [...features.values()].filter((f) => reserved.has(f.key));
	console.log(`  marker keys that collide with a context's keys (${collide.length}): ${collide.map((f) => f.key).join(', ') || '-'}`);
	console.log('gate: each composition against the snapshot claims and routes');
	for (const { lang, claims } of composed) {
		const outside = [...claims.keys()].filter((path) => !lang.claims.has(path));
		const unclaimed = [...p.kinds]
			.filter(([path, { feature }]) => lang.has(feature) && vocab.registered.has(path) && !claims.has(path))
			.map(([path]) => path);
		const gaps: string[] = [];
		const reached = new Set<string>();
		for (const [path, routes] of lang.claims) {
			const added = p.kinds.get(path);
			if (added) reached.add(added.feature);
			for (const at of lineage(vocab, path)) {
				for (const d of vocab.byPath.get(at)!.members) {
					const o = p.owned.get(`${at}#${d.name}`);
					if (!o || !lang.has(o.feature)) continue;
					if (routes.includes(d.name)) reached.add(o.feature);
					else gaps.push(`${path}.${d.name}`);
				}
				for (const r of p.restated.get(at) ?? []) if (lang.has(r.feature) && routes.includes(r.member.name)) reached.add(r.feature);
			}
		}
		const silent = [...features.keys()].filter((f) => lang.has(f) && !reached.has(f)).sort();
		console.log(`  ${lang.key} (${lang.composition!.slice(2)})`);
		console.log(`    claims outside the composition (${outside.length}): ${outside.join(', ') || '-'}`);
		console.log(`    composed kinds no claim reaches (${unclaimed.length}): ${unclaimed.join(', ') || '-'}`);
		console.log(`    composed members no route reaches (${gaps.length}): ${[...new Set(gaps)].join(', ') || '-'}`);
		console.log(`    composed features nothing claims or routes (${silent.length}): ${silent.join(', ') || '-'}`);
	}
}

function buildGate(snapshot: string, variant = 'gate', flags: FlagEncoding | null = null): void {
	const dir = freshVariant(snapshot, variant);
	const vdir = join(dir, 'vocabulary');
	equalityProposal(vdir);
	propertyFactsProposal(vdir);
	visibilityProposal(vdir);
	cpSync(join(HERE, 'features'), join(vdir, 'features'), { recursive: true });
	const vocab = readVocab(vdir);
	const features = readFeatures(join(vdir, 'features'));
	const p = plan(vocab, features);
	writeGatedVocabulary(vdir, vocab, features, p, 'unions', flags);
	const decls = flags === null ? [] : flagDecls(vocab, p);
	if (flags !== null) {
		const count = writeFlags(vdir, vocab, decls, flags);
		if (flags === 'enum-registry') appendFileSync(join(vdir, 'augment.ts'), flagRegistryAugmentation(decls).join('\n'));
		const prefixOnly = [...vocab.byPath.keys()].filter((path) => decls.some((d) => under(path, d.path) && !lineage(vocab, path).includes(d.path)));
		console.log(`${variant}: ${count} flags, ${decls.length} declarations; kinds a prefix flag reaches off their line: ${prefixOnly.join(', ') || '-'}`);
	}
	cpSync(join(HERE, 'compositions.ts'), join(dir, 'compositions.ts'));
	const compositions = readCompositions(readFileSync(join(HERE, 'compositions.ts'), 'utf8'));
	const composed = composeLanguages(
		vocab,
		p,
		features,
		compositions,
		Object.entries(languages).map(([key, l]) => [key, l.claims, l.terms, EQUALITY_CLAIMS[l.claims]] as const),
		(grammar, path) => flagRoutes(vocab, grammar, path)
	);
	if (flags === null) diagnose(vocab, p, features, composed);

	const grammars = composed.filter((c) => c.lang.key !== 'javascript').map((c) => c.lang);
	const javascript = composed.find((c) => c.lang.key === 'javascript')!.lang;
	const slots = baseSlots(readFileSync(join(vdir, 'context.ts'), 'utf8'));
	const contexts = (langs: readonly Language[]): string[] => [
		...contextsHeader([
			"import type * as C from './compositions.ts';",
			...restatingImports(p, features, langs, './vocabulary/features/'),
		]),
		...langs.flatMap((l) => contextLines(vocab, p, features, l, slots)),
	];
	writeFileSync(join(dir, 'languages.ts'), contexts(grammars).join('\n'));
	writeFileSync(join(dir, 'javascript.ts'), [...contexts([javascript]), ...namesLines(vocab, p, features, javascript)].join('\n'));
	writeFileSync(
		join(dir, 'names.ts'),
		[
			`import type { ${grammars.map((l) => l.ctx).join(', ')} } from './languages.ts';`,
			"import type * as V from './vocabulary/index.ts';",
			...restatingImports(p, features, grammars, './vocabulary/features/'),
			'',
			...grammars.flatMap((l) => namesLines(vocab, p, features, l)),
		].join('\n')
	);
	const flagsAt = (path: string): Set<string> => new Set(decls.filter((d) => lineage(vocab, path).includes(d.path)).map((d) => d.name));
	const members = (lang: Language, path: string): string[] => {
		const all = composedMembers(vocab, p, path, lang.has);
		if (flags === null) return all;
		const own = flagsAt(path);
		return all.filter((m) => !own.has(m));
	};
	const consumers = writeConsumers(dir, vocab, p, features, grammars, members, flags !== null);
	writeTsconfig(join(dir, 'tsconfig.json'), ['languages.ts', ...consumers]);
	if (flags !== null) {
		cpSync(join(HERE, 'flags/check.ts'), join(dir, 'check.ts'));
		writeTsconfig(join(dir, 'tsconfig.check.json'), ['languages.ts', 'check.ts'], './tsconfig.json');
		fold(dir, vocab, {});
		report(variant, grammars, members);
		return;
	}
	const demo = readFileSync(join(HERE, 'demo.ts'), 'utf8');
	writeFileSync(join(dir, 'demo.ts'), demo);
	writeFileSync(join(dir, 'demo-errors.ts'), demo.replace(/^\s*\/\/ @ts-expect-error.*\n/gm, ''));
	writeTsconfig(join(dir, 'tsconfig.demo.json'), ['languages.ts', 'javascript.ts', 'names.ts', 'demo.ts'], './tsconfig.json');
	writeTsconfig(join(dir, 'tsconfig.errors.json'), ['demo-errors.ts'], './tsconfig.json');
	fold(dir, vocab, {});
	report('gate', grammars, members);
}

// ---------------------------------------------------------------------------------------------------------------------
// scale-gate

/** The grammars that claim a path, as letters. */
const claimers = (path: string): string => GRAMMARS.filter((g) => path in realization[g].routes).map((g) => LETTER[g]).join('');
/** A set of grammars as a feature's letters when it is a strict, non-empty subset of the three. */
const strict = (letters: string | null): string | null => {
	const sorted = [...(letters ?? '')].sort().join('');
	return sorted.length > 0 && sorted.length < GRAMMARS.length ? sorted : null;
};

/**
 * The cost model's features. A kind belongs to the feature of the grammars that claim it or any kind inheriting from
 * it, when those are only some of the grammars; a kind nothing claims, itself or below, belongs to its parent's; a
 * namespace's root kind stays in the base. A member belongs to the feature of the grammars its first declaration is
 * tagged with, at every declaration below; where that feature also adds a kind on the member's line, the member
 * stays ungated (a feature's own kind cannot override a member it gates above).
 */
function tagSpecs(vocab: Vocab): { readonly specs: FeatureSpec[]; readonly summary: string } {
	const below = new Map<string, Set<string>>();
	for (const it of vocab.ifaces) {
		for (const at of lineage(vocab, it.path!)) below.set(at, new Set([...(below.get(at) ?? []), ...claimers(it.path!)]));
	}
	const kindOwner = new Map<string, string>();
	for (const it of vocab.ifaces) {
		if (it.parent === null) continue;
		const letters = [...below.get(it.path!)!].join('');
		const inherited = lineage(vocab, it.path!).slice(1).map((at) => kindOwner.get(at)).find((o) => o !== undefined) ?? null;
		const own = letters.length > 0 ? strict(letters) : inherited;
		if (own) kindOwner.set(it.path!, own);
	}
	const firstOf = (path: string, name: string): string =>
		[...lineage(vocab, path)].reverse().find((at) => vocab.byPath.get(at)!.members.some((d) => d.name === name))!;
	const chainOf = (path: string, name: string): string | null => {
		const top = firstOf(path, name);
		const tag = strict(vocab.byPath.get(top)!.members.find((d) => d.name === name)!.tags);
		return tag !== null && tag !== kindOwner.get(top) ? tag : null;
	};
	const dropped = new Set<string>();
	for (const it of vocab.ifaces) {
		for (const m of it.members) {
			const chain = m.name === '$kind' ? null : chainOf(it.path!, m.name);
			if (chain !== null && kindOwner.get(it.path!) === chain) dropped.add(`${firstOf(it.path!, m.name)}#${m.name}`);
		}
	}
	const members = new Map<string, Map<string, string[]>>();
	let gated = 0;
	for (const it of vocab.ifaces) {
		for (const m of it.members) {
			const chain = m.name === '$kind' ? null : chainOf(it.path!, m.name);
			if (chain === null || dropped.has(`${firstOf(it.path!, m.name)}#${m.name}`)) continue;
			const byPath = members.get(chain) ?? new Map<string, string[]>();
			byPath.set(it.path!, [...(byPath.get(it.path!) ?? []), m.name]);
			members.set(chain, byPath);
			gated++;
		}
	}
	const letters = new Set([...kindOwner.values(), ...members.keys()]);
	const specs = [...letters].sort().map(
		(l): FeatureSpec => ({
			dir: `only-${l}`,
			name: `Only${l[0]!.toUpperCase()}${l.slice(1)}`,
			key: `only-${l}`,
			parents: [],
			doc: `What only ${[...l].map((c) => GRAMMARS.find((g) => LETTER[g] === c)).join(' and ')} ${l.length === 1 ? 'has' : 'have'}.`,
			kinds: [...kindOwner].filter(([, o]) => o === l).map(([path]) => path),
			members: members.get(l) ?? new Map(),
			restates: new Map(),
		})
	);
	const summary = `${specs.length} features; ${kindOwner.size} kinds added; ${gated} member declarations gated; ${dropped.size} member lines left ungated under their feature's own kind`;
	return { specs, summary };
}

function buildScale(snapshot: string, variant: string, levels: Levels): void {
	const dir = freshVariant(snapshot, variant);
	const vdir = join(dir, 'vocabulary');
	const vocab = readVocab(vdir);
	const { specs, summary } = tagSpecs(vocab);
	writeFeatureTree(join(vdir, 'features'), specs, vocab);
	const features = readFeatures(join(vdir, 'features'));
	const p = plan(vocab, features);
	writeGatedVocabulary(vdir, vocab, features, p, levels);
	const compositions = [
		`import type { ${specs.map((s) => s.name).join(', ')} } from './vocabulary/features/index.ts';`,
		'',
		...GRAMMARS.map((g) => {
			const own = specs.filter((s) => s.key.slice('only-'.length).includes(LETTER[g])).map((s) => s.name);
			return `export interface ${NAME[g]}Features extends ${own.join(', ')} {}`;
		}),
		'',
	].join('\n');
	writeFileSync(join(dir, 'compositions.ts'), compositions);
	const composed = composeLanguages(
		vocab,
		p,
		features,
		readCompositions(compositions),
		GRAMMARS.map((g) => [g, g, {}, {}] as const)
	);
	const langs = composed.map((c) => c.lang);
	for (const { lang, claims } of composed) {
		if (lang.claims.size !== claims.size) throw new Error(`${variant}: ${lang.key} composes ${lang.claims.size} of its ${claims.size} claims`);
	}
	const slots = baseSlots(readFileSync(join(vdir, 'context.ts'), 'utf8'));
	writeFileSync(
		join(dir, 'languages.ts'),
		[...contextsHeader(["import type * as C from './compositions.ts';"]), ...langs.flatMap((l) => contextLines(vocab, p, features, l, slots))].join('\n')
	);
	const members = (lang: Language, path: string): string[] => composedMembers(vocab, p, path, lang.has);
	const consumers = writeConsumers(dir, vocab, p, features, langs, members);
	writeTsconfig(join(dir, 'tsconfig.json'), ['languages.ts', ...consumers]);
	fold(dir, vocab, OUTSIDE_PARENT);
	console.log(`${variant}: ${summary}`);
	if (levels === 'unions') for (const n of p.notes) console.log(`  ${n}`);
	report(variant, langs, members);
}

mkdirSync(OUT, { recursive: true });
const snapshot = materialize();
buildUngated(snapshot, 'today');
buildUngated(snapshot, 'fold');
buildGate(snapshot);
buildGate(snapshot, 'flags-enum', 'enum');
buildGate(snapshot, 'flags-const', 'const');
buildGate(snapshot, 'flags-names', 'names');
buildGate(snapshot, 'flags-registry', 'enum-registry');
buildScale(snapshot, 'scale-gate', 'unions');
buildScale(snapshot, 'scale-registry', 'registry');

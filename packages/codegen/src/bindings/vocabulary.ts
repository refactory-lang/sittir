import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { type BindingFacts, isNamedMember, type SlotModel, VOCABULARY_DIR } from './facts.ts';
import { formsOf } from './routes.ts';
import { camel } from './names.ts';
import { runPinned } from './read.ts';

export const AUGMENTATION = 'augment.ts';
export const FEATURES = 'features';
export const FLAG = 'Flag';
export const REFINED_BY = 'RefinedBy';

export interface Member {
	readonly name: string;
	readonly optional: boolean;
	readonly type: string;
	readonly flag: boolean;
	readonly references: readonly string[];
}

export interface Declared {
	readonly qname: string;
	readonly path: string | undefined;
	readonly parent: string | undefined;
	readonly refines: string | undefined;
	readonly members: readonly Member[];
}

export interface DeclaredKind extends Declared {
	readonly path: string;
}

export const isKind = (d: Declared): d is DeclaredKind => d.path !== undefined;

export const byCodepoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export interface Feature {
	readonly name: string;
	readonly key: string;
	readonly parents: readonly string[];
	readonly dir: string;
	readonly stubs: readonly Declared[];
	readonly unexported: readonly string[];
}

export interface VocabularySource {
	readonly kinds: readonly DeclaredKind[];
	readonly modules: ReadonlyMap<string, string>;
	readonly features: readonly Feature[];
}

export interface FeatureIndex {
	readonly marker: { readonly name: string; readonly key: string; readonly parents: readonly string[] } | null;
	readonly exports: readonly string[];
}

export interface VocabularyMember {
	readonly optional: boolean;
	readonly flag: boolean;
}

export interface VocabularyKind {
	readonly name: string;
	readonly own: ReadonlyMap<string, VocabularyMember>;
	readonly parent: string | undefined;
	readonly refines: string | undefined;
}

export interface Vocabulary {
	readonly kinds: ReadonlyMap<string, VocabularyKind>;
	readonly flags: ReadonlySet<string>;
	members(path: string): ReadonlyMap<string, VocabularyMember>;
}

const FEATURE_INDEX = 'index.ts';

export function isVocabularySource(name: string): boolean {
	const segments = name.split('/');
	if (!name.endsWith('.ts')) return false;
	if (segments.length === 1) return name !== AUGMENTATION;
	return segments[0] === FEATURES && segments.length > 2;
}

export const vocabularySources = (dir: string = VOCABULARY_DIR): readonly string[] =>
	readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.map((name) => name.split(sep).join(posix.sep))
		.filter(isVocabularySource)
		.sort(byCodepoint);

const readFailure = (name: string) => (error: unknown): never => {
	throw new Error(`reading the vocabulary file ${name}: ${error instanceof Error ? error.message : String(error)}`);
};

const declaredIn = (dir: string, name: string): Promise<Declared[]> => runPinned('vocabularyDeclared', readFileSync(join(dir, name), 'utf8')).catch(readFailure(name));

export async function readVocabularySource(dir: string): Promise<VocabularySource> {
	const sources = vocabularySources(dir);
	const files = sources.filter((name) => !name.includes(posix.sep));
	const kinds: DeclaredKind[] = [];
	const modules = new Map<string, string>();
	const declared = await Promise.all(files.map((file) => declaredIn(dir, file)));
	for (const [i, file] of files.entries()) {
		for (const d of (declared[i] ?? []).filter(isKind)) {
			kinds.push(d);
			modules.set(d.qname.replace(/\..*$/, ''), file);
		}
	}
	const root = join(dir, FEATURES);
	return { kinds, modules, features: existsSync(root) ? await readFeatures(dir, sources) : [] };
}

async function readFeatures(dir: string, sources: readonly string[]): Promise<Feature[]> {
	const root = join(dir, FEATURES);
	const dirs: string[] = [];
	const visit = (at: string): void => {
		for (const entry of readdirSync(join(root, at), { withFileTypes: true }).sort((a, b) => byCodepoint(a.name, b.name))) {
			if (!entry.isDirectory()) continue;
			const sub = at === '' ? entry.name : posix.join(at, entry.name);
			dirs.push(sub);
			visit(sub);
		}
	};
	visit('');
	return Promise.all(dirs.map((at) => readFeature(dir, at, sources)));
}

async function readFeature(dir: string, at: string, sources: readonly string[]): Promise<Feature> {
	const folder = posix.join(FEATURES, at);
	const index = posix.join(folder, FEATURE_INDEX);
	const { marker, exports } = await runPinned('vocabularyFeatureIndex', readFileSync(join(dir, index), 'utf8')).catch(readFailure(index));
	if (marker === null) throw new Error(`${index} declares no marker interface`);
	const files = sources.filter((name) => posix.dirname(name) === folder && posix.basename(name) !== FEATURE_INDEX).map((name) => posix.basename(name));
	const exported = new Set(exports);
	return {
		name: marker.name,
		key: marker.key,
		parents: marker.parents,
		dir: at,
		stubs: (await Promise.all(files.map((file) => declaredIn(dir, posix.join(folder, file))))).flat(),
		unexported: files.filter((file) => !exported.has(`./${file}`))
	};
}

export async function readVocabulary(dir: string): Promise<Vocabulary> {
	const source = await readVocabularySource(dir);
	const stubs = source.features.flatMap((feature) => feature.stubs);
	const declared = [...source.kinds, ...stubs.filter(isKind)];
	const pathByName = new Map(declared.map((d) => [d.qname, d.path]));
	const own = new Map(declared.map((d) => [d.qname, new Map(d.members.map((m) => [m.name, { optional: m.optional, flag: m.flag }]))]));
	for (const stub of stubs) {
		const members = own.get(stub.qname);
		if (isKind(stub) || members === undefined) continue;
		for (const m of stub.members) members.set(m.name, { optional: m.optional || members.get(m.name)?.optional === true, flag: m.flag });
	}
	const kinds = new Map<string, VocabularyKind>();
	const pathOf = (qname: string | undefined): string | undefined => (qname === undefined ? undefined : pathByName.get(qname));
	for (const d of declared) {
		kinds.set(d.path, { name: d.qname, own: own.get(d.qname) ?? new Map(), parent: pathOf(d.parent), refines: pathOf(d.refines) });
	}
	const members = (path: string): ReadonlyMap<string, VocabularyMember> => {
		const all = new Map<string, VocabularyMember>();
		const line = (from: string | undefined): void => {
			for (let kind = from === undefined ? undefined : kinds.get(from); kind !== undefined; kind = kind.parent === undefined ? undefined : kinds.get(kind.parent)) {
				for (const [name, member] of kind.own) if (!all.has(name)) all.set(name, member);
				line(kind.refines);
			}
		};
		line(path);
		return all;
	};
	const flags = new Set([...kinds.values()].flatMap((kind) => [...kind.own].flatMap(([name, member]) => (member.flag ? [name] : []))));
	return { kinds, flags, members };
}

export function flagSegment(vocabulary: Vocabulary, path: string): { readonly parent: string; readonly flag: string } | undefined {
	const cut = path.lastIndexOf('.');
	if (cut < 0) return undefined;
	const parent = path.slice(0, cut);
	const flag = camel(path.slice(cut + 1));
	if (!vocabulary.kinds.has(parent) || vocabulary.members(parent).get(flag)?.flag !== true) return undefined;
	if (vocabulary.kinds.has(path)) throw new Error(`bindings: ${path} is a vocabulary kind and also ${parent}'s flag ${flag}; one name names one thing`);
	return { parent, flag };
}

export function resolveFlags(facts: BindingFacts, vocabulary: Vocabulary, model: SlotModel): BindingFacts {
	const claims = facts.claims.map((claim) => {
		const segment = flagSegment(vocabulary, claim.vocab);
		return segment === undefined ? claim : { ...claim, vocab: segment.parent, flag: segment.flag };
	});
	const flagsOf = (path: string): ReadonlySet<string> => new Set([...vocabulary.members(path)].flatMap(([name, member]) => (member.flag ? [name] : [])));
	return {
		...facts,
		claims,
		flagsByPath: new Map([...new Set(claims.map((claim) => claim.vocab))].map((path) => [path, flagsOf(path)])),
		members: facts.members.map((member) => {
			if (!isNamedMember(member)) return member;
			const owns = (kind: string | null): boolean => kind !== null && (kind === member.owner || formsOf(model, kind).includes(member.owner));
			const paths = [...new Set(claims.filter((claim, index) => owns(claim.kind) && (member.claims === undefined || member.claims.includes(index))).map((claim) => claim.vocab))];
			const declared = paths.flatMap((path) => {
				const found = vocabulary.members(path).get(camel(member.name));
				return found === undefined ? [] : [[path, found.flag] as const];
			});
			const flagAt = declared.find(([, flag]) => flag);
			const dataAt = declared.find(([, flag]) => !flag);
			if (flagAt !== undefined && dataAt !== undefined)
				throw new Error(`bindings: ${member.owner}'s capture @${member.name} is a flag at ${flagAt[0]} and data at ${dataAt[0]}; one name names one thing`);
			return flagAt === undefined ? member : { ...member, flag: true };
		})
	};
}

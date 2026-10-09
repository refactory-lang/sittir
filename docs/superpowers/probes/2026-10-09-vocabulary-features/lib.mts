/**
 * The probe's model of the vocabulary and its features, which generate.mts runs. See README.md.
 *
 * - Reading: the snapshot vocabulary's namespace files, and a feature tree (a folder per feature, nested by
 *   inheritance, its `index.ts` holding the marker and one stub file per vocabulary namespace it touches).
 * - Planning: what each feature owns (the kinds it adds, the members it gates, the members it restates as required),
 *   checked against the snapshot so a feature transcribes the base exactly.
 * - Writing: the gated vocabulary (the base less what features own and less its level unions, and the generated
 *   augmentation that adds back the members, the kinds and the levels), grammar contexts over their claims,
 *   per-language names, and the consumers the cost run checks.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = execFileSync('git', ['-C', HERE, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
export const OUT = join(HERE, 'out');
/** The commit whose vocabulary the snapshot patch applies to. The binding prototype's base commit has the same vocabulary. */
export const BASE = 'cd724143da57869fbb4bb7b8834daad8e3109d7b';
export const VOCAB = 'packages/types/src/vocabulary';
export const GRAMMARS = ['python', 'rust', 'typescript'] as const;
export type Grammar = (typeof GRAMMARS)[number];
export const NAMESPACES = [
	'argument',
	'attribute',
	'clause',
	'comment',
	'declaration',
	'element',
	'expression',
	'identifier',
	'literal',
	'modifier',
	'module',
	'pattern',
	'statement',
	'type',
] as const;

const git = (...args: string[]): string => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

/** Writes the snapshot vocabulary (the vocabulary at BASE plus snapshot/vocabulary.patch) under out/snapshot. */
export function materialize(): string {
	const dir = join(OUT, 'snapshot');
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(join(dir, VOCAB), { recursive: true });
	for (const file of git('ls-tree', '--name-only', `${BASE}:${VOCAB}`).trim().split('\n')) {
		writeFileSync(join(dir, VOCAB, file), git('show', `${BASE}:${VOCAB}/${file}`));
	}
	execFileSync('patch', ['-s', '-p1', '-d', dir, '-i', join(HERE, 'snapshot/vocabulary.patch')]);
	return join(dir, VOCAB);
}

/** Per grammar, the vocabulary paths its bindings claim, each with the members its routes reach. */
export const realization = JSON.parse(readFileSync(join(HERE, 'snapshot/realization.json'), 'utf8')) as Record<
	Grammar,
	{ readonly routes: Readonly<Record<string, readonly string[]>> }
>;

// ---------------------------------------------------------------------------------------------------------------------
// Reading namespace files: the base's, and the stub files of a feature

export interface Member {
	readonly name: string;
	readonly optional: boolean;
	/** The member's type on one line. */
	readonly type: string;
	readonly start: number;
	/** The member's last line, its tag comment included. */
	readonly end: number;
	/** The grammars the snapshot marks the member as particular to (`// rt only`), as letters. */
	readonly tags: string | null;
}

export interface Iface {
	readonly file: string;
	readonly qname: string;
	readonly parent: string | null;
	/** The kind's path, from its `$kind`; null for a stub that adds members to a kind it does not declare. */
	path: string | null;
	readonly members: Member[];
	readonly start: number;
	/** The interface's closing line. */
	end: number;
}

/** A level's `Any` union. */
export interface Alias {
	readonly file: string;
	/** The namespace it sits in, which names the level. */
	readonly ns: string;
	readonly start: number;
	readonly end: number;
	readonly refs: readonly string[];
}

export interface NamespaceFile {
	readonly file: string;
	readonly lines: readonly string[];
	readonly ifaces: readonly Iface[];
	readonly aliases: readonly Alias[];
}

const balanced = (text: string): boolean => {
	let depth = 0;
	for (const c of text) {
		if (c === '(' || c === '{' || c === '[') depth++;
		else if (c === ')' || c === '}' || c === ']') depth--;
	}
	return depth === 0;
};

/** A type on one line, however the formatter wrapped it. */
const oneLine = (type: string): string =>
	type
		.replace(/\s+/g, ' ')
		.replace(/^ ?\| /, '')
		.replace(/\( ?\| /g, '(')
		.replace(/ \)/g, ')')
		.replace(/< /g, '<')
		.replace(/ >/g, '>')
		.trim();

/** Reads a namespace file: every interface (a wrapped header included), its parent, members and tags, and the `Any` unions. */
export function parseNamespaceFile(file: string, text: string): NamespaceFile {
	const lines = text.split('\n');
	const ifaces: Iface[] = [];
	const aliases: Alias[] = [];
	const scope: string[] = [];
	const blocks: ('ns' | 'iface')[] = [];
	let iface: Iface | null = null;
	for (let i = 0; i < lines.length; i++) {
		const t = lines[i]!.trim();
		const where = `${file}:${i + 1}`;
		let m = /^export namespace (\w+) \{$/.exec(t);
		if (m) {
			scope.push(m[1]!);
			blocks.push('ns');
			continue;
		}
		if (t.startsWith('export interface ')) {
			const start = i;
			let header = t;
			while (!header.endsWith('{') && !header.endsWith('{}')) header += ` ${lines[++i]!.trim()}`;
			m = /^export interface (\w+)<G extends GrammarContext>(?: extends SubKindOf<V\.([\w.]+)<G>>)? \{(\})?$/.exec(oneLine(header));
			if (!m) throw new Error(`${where}: an interface header this probe does not read: ${header}`);
			const it: Iface = { file, qname: [...scope, m[1]!].join('.'), parent: m[2] ?? null, path: null, members: [], start, end: i };
			ifaces.push(it);
			if (m[3] === undefined) {
				iface = it;
				blocks.push('iface');
			}
			continue;
		}
		m = /^export type (\w+)<G extends GrammarContext> =(.*)$/.exec(t);
		if (m) {
			if (m[1] !== 'Any') throw new Error(`${where}: a type alias other than a level's Any: ${t}`);
			const start = i;
			let body = m[2]!;
			while (!body.trimEnd().endsWith(';')) body += ` ${lines[++i]!.trim()}`;
			aliases.push({ file, ns: scope.join('.'), start, end: i, refs: [...body.matchAll(/\bV\.([\w.]+)<G>/g)].map((r) => r[1]!) });
			continue;
		}
		if (t === '}') {
			const block = blocks.pop();
			if (block === 'ns') scope.pop();
			else if (block === 'iface') {
				iface!.end = i;
				iface = null;
			} else throw new Error(`${where}: a close with nothing open`);
			continue;
		}
		if (t === '' || t.startsWith('import ') || t.startsWith('//') || t.startsWith('/**')) continue;
		if (iface === null) throw new Error(`${where}: a line outside any interface: ${t}`);
		m = /^readonly ([\w$]+)(\??): ?(.*)$/.exec(t);
		if (!m) throw new Error(`${where}: an interface line this probe does not read: ${t}`);
		let type = m[3]!;
		let end = i;
		while (!(type.trimEnd().endsWith(';') && balanced(type))) type += ` ${lines[++end]!.trim()}`;
		const tag = /^\/\/ ([prt]+) only$/.exec(lines[end + 1]?.trim() ?? '');
		const member: Member = {
			name: m[1]!,
			optional: m[2] === '?',
			type: oneLine(type.trimEnd().slice(0, -1)),
			start: i,
			end: tag ? end + 1 : end,
			tags: tag?.[1] ?? null,
		};
		iface.members.push(member);
		if (member.name === '$kind') iface.path = /^'([\w.]+)'$/.exec(member.type)?.[1] ?? null;
		i = member.end;
	}
	if (blocks.length > 0) throw new Error(`${file}: ${blocks.length} blocks left open`);
	return { file, lines, ifaces, aliases };
}

/** Whether `path` is at the level `at` or under it. Levels nest by path; a level need not be a kind. */
export const under = (path: string, at: string): boolean => path === at || path.startsWith(`${at}.`);
export const key = (path: string, member: string): string => `${path}#${member}`;
const snake = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

export interface Vocab {
	readonly dir: string;
	readonly files: ReadonlyMap<string, NamespaceFile>;
	readonly ifaces: readonly Iface[];
	readonly byQname: ReadonlyMap<string, Iface>;
	readonly byPath: ReadonlyMap<string, Iface>;
	readonly aliases: readonly Alias[];
	/** The kinds the `Any` unions list, by path: what the kind registry holds. */
	readonly registered: ReadonlySet<string>;
}

/** Reads the vocabulary's namespace files, and checks the facts the gated vocabulary relies on. */
export function readVocab(dir: string): Vocab {
	const files = new Map(NAMESPACES.map((ns) => [`${ns}.ts`, parseNamespaceFile(`${ns}.ts`, readFileSync(join(dir, `${ns}.ts`), 'utf8'))]));
	const ifaces = [...files.values()].flatMap((f) => f.ifaces);
	const byQname = new Map(ifaces.map((it) => [it.qname, it]));
	const byPath = new Map<string, Iface>();
	for (const it of ifaces) {
		if (it.path === null) throw new Error(`${it.qname}: no $kind`);
		if (byPath.has(it.path)) throw new Error(`${it.path}: declared by ${byPath.get(it.path)!.qname} and ${it.qname}`);
		byPath.set(it.path, it);
	}
	// A kind's parent sits at a level above it, so its level holds the kind; the levels between need not be kinds
	// (`expression.binary.arithmetic.add` extends `expression.binary`).
	for (const it of ifaces) {
		const up = it.parent === null ? null : byQname.get(it.parent)?.path;
		if (it.parent !== null && (up === undefined || !under(it.path!, up!))) throw new Error(`${it.qname}: parent ${it.parent} is not a kind above ${it.path}`);
	}
	const aliases = [...files.values()].flatMap((f) => f.aliases);
	const pathOf = (qname: string): string => {
		const it = byQname.get(qname);
		if (!it) throw new Error(`an Any union lists ${qname}, which is not a kind`);
		return it.path!;
	};
	const registered = new Set(aliases.flatMap((a) => a.refs.map(pathOf)));
	// Each level's Any lists exactly the registered kinds at the level and under it, so the registry can stand for it.
	for (const a of aliases) {
		const at = levelPath(byQname, a.ns);
		const want = [...registered].filter((p) => under(p, at)).sort();
		const got = a.refs.map(pathOf).sort();
		if (want.join() !== got.join()) throw new Error(`${a.ns}.Any lists ${got.length} kinds, the registry has ${want.length} at ${at}`);
	}
	return { dir, files, ifaces, byQname, byPath, aliases, registered };
}

/** The path of the level a namespace names: its kind's, or for a grouping namespace its parent level's and its own name. */
export function levelPath(byQname: ReadonlyMap<string, Iface>, ns: string): string {
	const it = byQname.get(ns);
	if (it) return it.path!;
	const dot = ns.lastIndexOf('.');
	return dot < 0 ? snake(ns) : `${levelPath(byQname, ns.slice(0, dot))}.${snake(ns.slice(dot + 1))}`;
}

/** A kind and the kinds it inherits from, nearest first, by path. */
export function lineage(vocab: Vocab, path: string): string[] {
	const out: string[] = [];
	for (let it = vocab.byPath.get(path); it !== undefined; it = it.parent === null ? undefined : vocab.byQname.get(it.parent)) out.push(it.path!);
	return out;
}

/** A kind's members, inherited ones included, by name. */
export function membersOf(vocab: Vocab, it: Iface): Map<string, Member> {
	const parent = it.parent === null ? undefined : vocab.byQname.get(it.parent);
	const members = parent ? membersOf(vocab, parent) : new Map<string, Member>();
	for (const m of it.members) members.set(m.name, m);
	return members;
}

// ---------------------------------------------------------------------------------------------------------------------
// Features: the tree of feature folders, and the compositions

export interface Feature {
	/** The marker interface's name. */
	readonly name: string;
	/** The marker's key, the feature's name in the type theory's words. */
	readonly key: string;
	/** The features it extends, by marker name. */
	readonly parents: readonly string[];
	/** Its folder, relative to the features root. */
	readonly dir: string;
	readonly doc: string;
	readonly files: ReadonlyMap<string, NamespaceFile>;
	readonly stubs: readonly Iface[];
}

const MARKER = /(?:\/\*\* (.*) \*\/\n)?export interface (\w+)(?: extends ([\w, ]+))? \{\n\treadonly '?([\w-]+)'?: true;\n\}/;

/** Reads a feature tree: each folder with an index.ts is a feature, its namespace files the stubs. */
export function readFeatures(root: string): Map<string, Feature> {
	const features = new Map<string, Feature>();
	const byDir = new Map<string, string>();
	const visit = (dir: string): void => {
		const abs = join(root, dir);
		const index = readFileSync(join(abs, 'index.ts'), 'utf8');
		const m = MARKER.exec(index);
		if (!m) throw new Error(`features/${dir}/index.ts: no marker interface`);
		const files = new Map<string, NamespaceFile>();
		for (const entry of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			if (entry.isDirectory()) visit(posix.join(dir, entry.name));
			else if (entry.name !== 'index.ts' && entry.name.endsWith('.ts')) {
				if (!index.includes(`export type * from './${entry.name}';`)) throw new Error(`features/${dir}/index.ts does not export ${entry.name}`);
				files.set(entry.name, parseNamespaceFile(posix.join(dir, entry.name), readFileSync(join(abs, entry.name), 'utf8')));
			}
		}
		const feature: Feature = {
			name: m[2]!,
			key: m[4]!,
			parents: m[3]?.split(', ') ?? [],
			dir,
			doc: m[1] ?? '',
			files,
			stubs: [...files.values()].flatMap((f) => f.ifaces),
		};
		if (features.has(feature.name)) throw new Error(`${feature.name}: two folders declare it`);
		features.set(feature.name, feature);
		byDir.set(dir, feature.name);
	};
	for (const entry of readdirSync(root, { withFileTypes: true })) if (entry.isDirectory()) visit(entry.name);
	// The folders follow inheritance: a feature extends the feature of the folder it sits in.
	for (const f of features.values()) {
		for (const p of f.parents) if (!features.has(p)) throw new Error(`${f.name} extends ${p}, which is not a feature`);
		const up = posix.dirname(f.dir);
		if (up !== '.' && !f.parents.includes(byDir.get(up)!)) throw new Error(`${f.name} sits in ${up}/ but does not extend ${byDir.get(up)}`);
	}
	const keys = new Set<string>();
	for (const f of features.values()) {
		if (keys.has(f.key)) throw new Error(`two features have the marker key ${f.key}`);
		keys.add(f.key);
	}
	return features;
}

/** Reads the marker-less interfaces of a compositions file: each name with the features and compositions it extends. */
export function readCompositions(text: string): Map<string, readonly string[]> {
	return new Map([...text.matchAll(/^export interface (\w+)\s+extends ([\w,\s]+?)\s*\{\}$/gm)].map((m) => [m[1]!, m[2]!.split(/,\s*/)]));
}

/** A feature's or composition's closure: every feature it extends, itself included when it is a feature. */
export function closure(
	name: string,
	features: ReadonlyMap<string, Feature>,
	compositions: ReadonlyMap<string, readonly string[]> = new Map()
): Set<string> {
	const out = new Set<string>();
	const visit = (n: string): void => {
		const f = features.get(n);
		const parents = f?.parents ?? compositions.get(n);
		if (parents === undefined) throw new Error(`${n} is neither a feature nor a composition`);
		if (f) {
			if (out.has(n)) return;
			out.add(n);
		}
		for (const p of parents) visit(p);
	};
	visit(name);
	return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Planning: what each feature owns, checked against the snapshot

export interface Owned {
	readonly feature: string;
	readonly member: Member;
	/** The stub interface that declares it, whose type the glue indexes. */
	readonly stub: Iface;
}

export interface Plan {
	/** The kinds features add, by path. */
	readonly kinds: ReadonlyMap<string, { readonly feature: string; readonly stub: Iface }>;
	/** The members features gate, by `path#member`. */
	readonly owned: ReadonlyMap<string, Owned>;
	/** The members features restate as required, by path. */
	readonly restated: ReadonlyMap<string, readonly Owned[]>;
	/** Findings that are not errors: members a feature adds that the base lacks, members owned at some kinds only. */
	readonly notes: readonly string[];
}

const describe = (m: Member): string => `${m.name}${m.optional ? '?' : ''}: ${m.type}`;

/**
 * Decides what each feature owns and checks it against the snapshot. A stub interface with a `$kind` is a kind the
 * feature adds; a stub without one adds members to the kind it names. A stub member the snapshot has as optional,
 * written as required, is a restatement; any other is a member the feature owns, which must match the snapshot.
 */
export function plan(vocab: Vocab, features: ReadonlyMap<string, Feature>): Plan {
	const errors: string[] = [];
	const notes: string[] = [];
	const kinds = new Map<string, { feature: string; stub: Iface }>();
	const owned = new Map<string, Owned>();
	const restated = new Map<string, Owned[]>();
	for (const f of features.values()) {
		for (const stub of f.stubs) {
			const base = vocab.byQname.get(stub.qname);
			if (stub.path !== null) {
				if (base?.path !== stub.path) errors.push(`${f.name}: ${stub.qname} declares ${stub.path}, the snapshot has ${base?.path ?? 'no such kind'}`);
				else if (base.parent !== stub.parent) errors.push(`${f.name}: ${stub.qname} extends ${stub.parent}, the snapshot's extends ${base.parent}`);
				else if (kinds.has(stub.path)) errors.push(`${stub.path}: added by ${kinds.get(stub.path)!.feature} and ${f.name}`);
				else kinds.set(stub.path, { feature: f.name, stub });
				continue;
			}
			if (!base) {
				errors.push(`${f.name}: ${stub.qname} adds members to a kind the vocabulary does not have`);
				continue;
			}
			for (const m of stub.members) {
				const d = base.members.find((x) => x.name === m.name);
				const k = key(base.path!, m.name);
				if (d && !m.optional && d.optional && d.type === m.type) {
					restated.set(base.path!, [...(restated.get(base.path!) ?? []), { feature: f.name, member: m, stub }]);
					continue;
				}
				if (d && (d.optional !== m.optional || d.type !== m.type)) {
					errors.push(`${f.name}: ${base.path}.${describe(m)}, the snapshot has ${describe(d)}`);
					continue;
				}
				if (!d) notes.push(`${f.name} adds ${base.path}.${m.name}, which the snapshot does not have`);
				if (owned.has(k)) errors.push(`${base.path}.${m.name}: owned by ${owned.get(k)!.feature} and ${f.name}`);
				else owned.set(k, { feature: f.name, member: m, stub });
			}
		}
	}
	// A kind a feature adds keeps the snapshot's members, less those other features own there.
	for (const [path, { feature, stub }] of kinds) {
		const base = vocab.byPath.get(path)!;
		for (const d of base.members) {
			const m = stub.members.find((x) => x.name === d.name);
			if (m && (m.optional !== d.optional || m.type !== d.type)) errors.push(`${feature}: ${path}.${describe(m)}, the snapshot has ${describe(d)}`);
			if (!m && !owned.has(key(path, d.name))) errors.push(`${feature}: ${path} lacks ${d.name}, which no feature owns there`);
			if (m && owned.has(key(path, d.name))) errors.push(`${feature}: ${path}.${d.name} is in the kind, and ${owned.get(key(path, d.name))!.feature} owns it there`);
		}
		for (const m of stub.members) if (!base.members.some((d) => d.name === m.name)) errors.push(`${feature}: ${path}.${m.name} is not in the snapshot's kind`);
	}
	// A gated member is gated wherever the snapshot declares it along an inheritance line, from its first declaration
	// down: an ungated declaration cannot override a gated one, nor a gated one an ungated one.
	const lines = new Map(vocab.ifaces.map((it) => [it.path!, lineage(vocab, it.path!)]));
	for (const [k, o] of owned) {
		const [path, name] = k.split('#') as [string, string];
		for (const it of vocab.ifaces) {
			if (it.path === path || !it.members.some((d) => d.name === name)) continue;
			const by = owned.get(key(it.path!, name))?.feature;
			if (by === o.feature) continue;
			if (lines.get(it.path!)!.includes(path)) errors.push(`${o.feature} owns ${name} at ${path}, and ${by ?? 'the kind'} declares it at ${it.path}, which inherits it`);
			if (lines.get(path)!.includes(it.path!)) errors.push(`${o.feature} owns ${name} at ${path}, and ${by ?? 'the kind'} declares it at ${it.path}, which it inherits from`);
		}
	}
	// A restatement makes required what the base or a feature it extends declares.
	for (const [path, list] of restated) {
		for (const r of list) {
			const by = owned.get(key(path, r.member.name))?.feature ?? kinds.get(path)?.feature;
			if (by !== undefined && !closure(r.feature, features).has(by)) errors.push(`${r.feature} restates ${path}.${r.member.name}, owned by ${by}, which it does not extend`);
		}
	}
	// A registered kind that inherits from a kind a feature adds belongs to a feature too; a feature's kind that
	// inherits from another feature's kind should extend that feature.
	for (const it of vocab.ifaces) {
		const up = lines.get(it.path!)![1];
		const parentKind = up === undefined ? undefined : kinds.get(up);
		if (parentKind === undefined) continue;
		const own = kinds.get(it.path!);
		if (own === undefined && vocab.registered.has(it.path!)) errors.push(`${it.path} is a base kind under ${up}, which ${parentKind.feature} adds`);
		if (own !== undefined && !closure(own.feature, features).has(parentKind.feature)) {
			notes.push(`${own.feature} adds ${it.path} under ${up}, which ${parentKind.feature} adds, and does not extend it`);
		}
	}
	// Members owned at some kinds and left in the base at others.
	const ownedNames = new Set([...owned.values()].map((o) => o.member.name));
	for (const name of [...ownedNames].sort()) {
		const left = vocab.ifaces
			.filter((it) => !kinds.has(it.path!) && it.members.some((d) => d.name === name) && !owned.has(key(it.path!, name)))
			.map((it) => it.path!);
		if (left.length > 0) notes.push(`${name} is gated at some kinds and stays in the base at ${left.length}: ${left.join(', ')}`);
	}
	if (errors.length > 0) throw new Error(`the features do not transcribe the snapshot:\n  ${errors.join('\n  ')}`);
	return { kinds, owned, restated, notes };
}

/** The members a kind has where `has` holds of the features: the base's, the kind stubs', and the gated ones composed. */
export function composedMembers(vocab: Vocab, p: Plan, path: string, has: (feature: string) => boolean): string[] {
	const names = new Set<string>();
	for (const at of lineage(vocab, path)) {
		const added = p.kinds.get(at);
		const declared = added ? added.stub.members : vocab.byPath.get(at)!.members.filter((d) => !p.owned.has(key(at, d.name)));
		for (const d of declared) names.add(d.name);
		for (const d of vocab.byPath.get(at)!.members) {
			const o = p.owned.get(key(at, d.name));
			if (o && has(o.feature)) names.add(d.name);
		}
	}
	names.delete('$kind');
	return [...names];
}

// ---------------------------------------------------------------------------------------------------------------------
// Writing a feature tree from a spec (the cost model's features, and the authoring aid)

export interface FeatureSpec {
	/** The folder, relative to the features root, nested by inheritance. */
	readonly dir: string;
	readonly name: string;
	readonly key: string;
	readonly parents: readonly string[];
	readonly doc: string;
	/** The paths of the kinds it adds. */
	readonly kinds: readonly string[];
	/** Per kind path, the members it owns there. */
	readonly members: ReadonlyMap<string, readonly string[]>;
	/** Per kind path, the members it restates as required. */
	readonly restates: ReadonlyMap<string, readonly string[]>;
}

const memberLine = (m: Member, optional = m.optional): string => `readonly ${m.name}${optional ? '?' : ''}: ${m.type};`;
export const quoteKey = (k: string): string => (/^[a-z]\w*$/.test(k) ? k : `'${k}'`);
export const camel = (s: string): string => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

interface Entry {
	readonly qname: string;
	readonly order: number;
	readonly lines: readonly string[];
}

/** Lines that declare entries nested as their qnames nest: an interface per entry, a namespace per level with children. */
function nest(entries: readonly Entry[], indent: string, exported: boolean): string[] {
	interface Node {
		entry?: Entry;
		order: number;
		readonly children: Map<string, Node>;
	}
	const root: Node = { order: 0, children: new Map() };
	for (const e of entries) {
		let node = root;
		for (const seg of e.qname.split('.')) {
			const next = node.children.get(seg) ?? { order: e.order, children: new Map() };
			next.order = Math.min(next.order, e.order);
			node.children.set(seg, next);
			node = next;
		}
		if (node.entry) throw new Error(`${e.qname}: two entries`);
		node.entry = e;
	}
	const ex = exported ? 'export ' : '';
	const emit = (node: Node, name: string, ind: string): string[] => {
		const out = node.entry ? node.entry.lines.map((l, i) => `${ind}${i === 0 ? ex : i === node.entry!.lines.length - 1 ? '' : '\t'}${l}`) : [];
		if (node.children.size > 0) {
			out.push(`${ind}${ex}namespace ${name} {`);
			for (const [seg, child] of [...node.children].sort((a, b) => a[1].order - b[1].order)) out.push(...emit(child, seg, `${ind}\t`));
			out.push(`${ind}}`);
		}
		return out;
	};
	return [...root.children].sort((a, b) => a[1].order - b[1].order).flatMap(([seg, child]) => emit(child, seg, indent));
}

/** Writes a feature folder per spec: the stub namespace files, transcribed from the vocabulary, and the index with the marker. */
export function writeFeatureTree(root: string, specs: readonly FeatureSpec[], vocab: Vocab): void {
	const byName = new Map(specs.map((s) => [s.name, s]));
	const order = new Map([...vocab.files.keys()].map((f, i) => [f, i * 1e5]));
	const ownedElsewhere = (path: string, name: string, self: FeatureSpec): boolean =>
		specs.some((s) => s !== self && s.members.get(path)?.includes(name));
	for (const spec of specs) {
		const byFile = new Map<string, Entry[]>();
		const add = (it: Iface, lines: string[]): void => {
			byFile.set(it.file, [...(byFile.get(it.file) ?? []), { qname: it.qname, order: order.get(it.file)! + it.start, lines }]);
		};
		for (const path of spec.kinds) {
			const it = vocab.byPath.get(path)!;
			if (spec.members.has(path)) throw new Error(`${spec.name} adds ${path} and gates members on it`);
			const members = it.members.filter((m) => !ownedElsewhere(path, m.name, spec));
			const heritage = it.parent === null ? '' : ` extends SubKindOf<V.${it.parent}<G>>`;
			add(it, [`interface ${it.qname.split('.').pop()}<G extends GrammarContext>${heritage} {`, ...members.map((m) => memberLine(m)), '}']);
		}
		const paths = new Set([...spec.members.keys(), ...spec.restates.keys()]);
		for (const path of paths) {
			const it = vocab.byPath.get(path)!;
			const lines = [
				...(spec.members.get(path) ?? []).map((n) => memberLine(it.members.find((m) => m.name === n)!)),
				...(spec.restates.get(path) ?? []).map((n) => memberLine(it.members.find((m) => m.name === n)!, false)),
			];
			add(it, [`interface ${it.qname.split('.').pop()}<G extends GrammarContext> {`, ...lines, '}']);
		}
		const dir = join(root, spec.dir);
		mkdirSync(dir, { recursive: true });
		const up = '../'.repeat(spec.dir.split('/').length + 1);
		const written: string[] = [];
		for (const [file, entries] of [...byFile].sort((a, b) => order.get(a[0])! - order.get(b[0])!)) {
			const body = nest(entries, '', true);
			const text = body.join('\n');
			const imports = [
				`import type { GrammarContext } from '${up}context.ts';`,
				...(/SubKindOf</.test(text) ? [`import type { SubKindOf } from '${up}utils.ts';`] : []),
				...(/\bV\./.test(text) ? [`import type * as V from '${up}index.ts';`] : []),
			];
			writeFileSync(join(dir, file), `${[...imports, ...body].join('\n')}\n`);
			written.push(file);
		}
		const parents = spec.parents.map((p) => {
			const at = byName.get(p);
			if (!at) throw new Error(`${spec.name} extends ${p}, which no spec declares`);
			return `import type { ${p} } from '${posix.relative(spec.dir, at.dir) || '.'}/index.ts';`;
		});
		const index = [
			...parents,
			...written.map((f) => `export type * from './${f}';`),
			'',
			...(spec.doc ? [`/** ${spec.doc} */`] : []),
			`export interface ${spec.name}${spec.parents.length > 0 ? ` extends ${spec.parents.join(', ')}` : ''} {`,
			`\treadonly ${quoteKey(spec.key)}: true;`,
			'}',
			'',
		];
		writeFileSync(join(dir, 'index.ts'), index.join('\n'));
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Writing the gated vocabulary

interface Edit {
	readonly start: number;
	readonly end: number;
	readonly lines: readonly string[];
}

const replaceOnce = (text: string, from: string | RegExp, to: string): string => {
	const next = text.replace(from, to);
	if (next === text) throw new Error(`no ${String(from)} to replace`);
	return next;
};

/** The module alias the glue and contexts import a feature's stubs under. */
export const stubAlias = (f: Feature): string => camel(posix.basename(f.dir));

/**
 * How a level's `Any` holds the kinds features add:
 * - `unions`: the generated augmentation declares every level's union, a feature's kind as an arm gated on it;
 * - `registry`: the base reads every level off the kind registry `Kinds<G>`, which features augment.
 */
export type Levels = 'unions' | 'registry';

/**
 * Writes the gated vocabulary into `vdir`, which holds the vocabulary `vocab` was read from and the feature tree under
 * features/: the base less what features own and less its `Any` unions, the gate, the features registry, the
 * permissive context extending every feature, and the generated augmentation, which adds back the members and kinds
 * features own and declares the levels.
 */
export function writeGatedVocabulary(vdir: string, vocab: Vocab, features: ReadonlyMap<string, Feature>, p: Plan, levels: Levels): void {
	// The base: owned members, added kinds and the level unions out.
	for (const [file, nf] of vocab.files) {
		const edits: Edit[] = [];
		for (const it of nf.ifaces) {
			if (p.kinds.has(it.path!)) {
				edits.push({ start: it.start, end: it.end, lines: [] });
				continue;
			}
			for (const m of it.members) if (p.owned.has(key(it.path!, m.name))) edits.push({ start: m.start, end: m.end, lines: [] });
		}
		for (const a of nf.aliases) {
			const indent = /^\s*/.exec(nf.lines[a.start]!)![0];
			const registry = `${indent}export type Any<G extends GrammarContext> = KindsUnder<G, '${levelPath(vocab.byQname, a.ns)}'>;`;
			edits.push({ start: a.start, end: a.end, lines: levels === 'registry' ? [registry] : [] });
		}
		const byStart = new Map(edits.map((e) => [e.start, e]));
		const out: string[] = [];
		for (let i = 0; i < nf.lines.length; i++) {
			const e = byStart.get(i);
			if (e) {
				out.push(...e.lines);
				i = e.end;
			} else out.push(nf.lines[i]!);
		}
		if (levels === 'registry') out.splice(out.findLastIndex((l) => l.startsWith('import ')) + 1, 0, "import type { KindsUnder } from './kinds.ts';");
		writeFileSync(join(vdir, file), out.join('\n'));
	}

	const all = [...features.values()];
	if (levels === 'registry') {
		writeFileSync(
			join(vdir, 'kinds.ts'),
			[
				"import type { GrammarContext } from './context.ts';",
				"import type * as V from './index.ts';",
				'',
				'/** The registered kinds by path. A feature registers the kinds it adds by augmentation, gated on the feature. */',
				'export interface Kinds<G extends GrammarContext> {',
				...[...vocab.registered]
					.filter((path) => !p.kinds.has(path))
					.sort()
					.map((path) => `\treadonly ${quoteKey(path)}: V.${vocab.byPath.get(path)!.qname}<G>;`),
				'}',
				'',
				'/** The registered paths at the path `P` and under it, the same in every context. */',
				'type PathsUnder<P extends string> = Extract<keyof Kinds<GrammarContext>, P | `${P}.${string}`>;',
				'',
				'/** The registered kinds at the path `P` and under it: a level of the vocabulary. */',
				'export type KindsUnder<G extends GrammarContext, P extends string> = Kinds<G>[PathsUnder<P>];',
				'',
			].join('\n')
		);
	}
	writeFileSync(
		join(vdir, 'utils.ts'),
		[
			"import type { GrammarContext } from './context.ts';",
			'',
			readFileSync(join(vdir, 'utils.ts'), 'utf8').trimEnd(),
			'',
			'/** A gated member where the context lacks the feature `F` that owns it. */',
			'export interface Absent<F> {',
			'\treadonly absent: F;',
			'}',
			'',
			"/** The permissive context's brand: a context that has it has every feature. No language context has it. */",
			'export interface Permissive {',
			'\treadonly permissive?: true;',
			'}',
			'',
			'/**',
			' * `T` where the context `G` has the feature `F` or is permissive, else `Otherwise`. `G` stays on the checked side, so',
			" * a kind stays covariant in its context and a language's kind is assignable to the permissive context's.",
			' */',
			'export type In<G extends GrammarContext, F, T, Otherwise = Absent<F>> = G extends F ? T : G extends Permissive ? T : Otherwise;',
			'',
		].join('\n')
	);
	writeFileSync(
		join(vdir, 'features/index.ts'),
		`${all
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((f) => `export type { ${f.name} } from './${f.dir}/index.ts';`)
			.join('\n')}\n`
	);
	writeFileSync(
		join(vdir, 'context.ts'),
		replaceOnce(
			readFileSync(join(vdir, 'context.ts'), 'utf8'),
			'export interface BaseContext extends GrammarContext {',
			'/** The permissive context: it has every feature, by its brand (`Permissive`), not by extending them. */\nexport interface BaseContext extends GrammarContext {\n\treadonly permissive?: true;'
		)
	);
	writeFileSync(join(vdir, 'augment.ts'), augmentation(vocab, features, p, levels).join('\n'));
	writeFileSync(join(vdir, 'index.ts'), `${readFileSync(join(vdir, 'index.ts'), 'utf8').trimEnd()}\nexport type * from './augment.ts';\n`);
}

/**
 * The generated augmentation: per vocabulary module, the kinds features add, the members they gate and (for `unions`)
 * every level's `Any`; for `registry`, the registry entries of the kinds features add.
 */
function augmentation(vocab: Vocab, features: ReadonlyMap<string, Feature>, p: Plan, levels: Levels): string[] {
	const alias = (name: string): string => stubAlias(features.get(name)!);
	const used = new Set<string>();
	const byFile = new Map<string, Entry[]>();
	if (levels === 'unions') {
		for (const a of vocab.aliases) {
			const arms = a.refs.map((qname) => {
				const added = p.kinds.get(vocab.byQname.get(qname)!.path!);
				if (added) used.add(added.feature);
				return added ? `gate.In<G, features.${added.feature}, V.${qname}<G>, never>` : `V.${qname}<G>`;
			});
			byFile.set(a.file, [...(byFile.get(a.file) ?? []), { qname: `${a.ns}.Any`, order: a.start, lines: [`type Any<G extends GrammarContext> = ${arms.join(' | ')};`] }]);
		}
	}
	const paths = new Set([...p.kinds.keys(), ...[...p.owned.keys()].map((k) => k.split('#')[0]!)]);
	for (const path of [...paths].sort()) {
		const it = vocab.byPath.get(path)!;
		const last = it.qname.split('.').pop();
		const added = p.kinds.get(path);
		const gated = it.members
			.map((m) => p.owned.get(key(path, m.name)))
			.filter((o): o is Owned => o !== undefined)
			.map((o) => {
				used.add(o.feature);
				return `readonly ${o.member.name}${o.member.optional ? '?' : ''}: gate.In<G, features.${o.feature}, ${alias(o.feature)}.${o.stub.qname}<G>['${o.member.name}']>;`;
			});
		if (added) used.add(added.feature);
		const head = `interface ${last}<G extends GrammarContext>${added ? ` extends ${alias(added.feature)}.${it.qname}<G>` : ''}`;
		const lines = gated.length > 0 ? [`${head} {`, ...gated, '}'] : [`${head} {}`];
		byFile.set(it.file, [...(byFile.get(it.file) ?? []), { qname: it.qname, order: it.start, lines }]);
	}
	const registry = [...p.kinds]
		.filter(([path]) => vocab.registered.has(path))
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([path, { feature }]) => `\t\treadonly ${quoteKey(path)}: gate.In<G, features.${feature}, V.${vocab.byPath.get(path)!.qname}<G>, never>;`);
	const names = [...used].sort();
	const stubs = names.filter((n) => [...p.kinds.values()].some((k) => k.feature === n) || [...p.owned.values()].some((o) => o.feature === n));
	// The vocabulary's names are open inside each module block, so the glue reaches its own through lowercase
	// namespaces, which no kind name can shadow (`Expression.Binary.Membership.In`, `Literal.String.F`).
	return [
		"import type { GrammarContext } from './context.ts';",
		"import type * as gate from './utils.ts';",
		"import type * as V from './index.ts';",
		...(names.length > 0 ? ["import type * as features from './features/index.ts';"] : []),
		...stubs.map((n) => `import type * as ${alias(n)} from './features/${features.get(n)!.dir}/index.ts';`),
		'',
		...[...byFile]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.flatMap(([file, entries]) => [`declare module './${file}' {`, ...nest(entries, '\t', false), '}', '']),
		...(levels === 'registry'
			? ["declare module './kinds.ts' {", '\tinterface Kinds<G extends GrammarContext> {', ...registry, '\t}', '}', '']
			: []),
	];
}

// ---------------------------------------------------------------------------------------------------------------------
// Grammar contexts, names and consumers

export interface Language {
	readonly key: string;
	/** The language's name, which names its names module. */
	readonly name: string;
	readonly ctx: string;
	/** The composition the context extends, or null for the snapshot's own contexts. */
	readonly composition: string | null;
	/** Whether the language composes a feature. */
	readonly has: (feature: string) => boolean;
	/** The kinds the context covers, by path, each with the members its routes reach. */
	readonly claims: ReadonlyMap<string, readonly string[]>;
	readonly terms: Readonly<Record<string, string>>;
}

/** How a language names a kind: the vocabulary's interface over its context, with each composed restatement. */
export function kindRef(vocab: Vocab, p: Plan | null, features: ReadonlyMap<string, Feature>, lang: Language, path: string): string {
	const qname = vocab.byPath.get(path)!.qname;
	const restating = [...new Set((p?.restated.get(path) ?? []).filter((r) => lang.has(r.feature)).map((r) => r.feature))];
	const base = `V.${qname}<${lang.ctx}>`;
	return restating.length === 0 ? base : `(${[base, ...restating.map((f) => `${stubAlias(features.get(f)!)}.${qname}<${lang.ctx}>`)].join(' & ')})`;
}

/** The imports of the feature stubs a language's restatements name. */
export function restatingImports(p: Plan | null, features: ReadonlyMap<string, Feature>, langs: readonly Language[], from: string): string[] {
	const names = new Set<string>();
	for (const list of p?.restated.values() ?? []) for (const r of list) if (langs.some((l) => l.has(r.feature))) names.add(r.feature);
	return [...names].sort().map((n) => `import type * as ${stubAlias(features.get(n)!)} from '${from}${features.get(n)!.dir}/index.ts';`);
}

/** BaseContext's slot table, the lines between its `readonly slots: {` and the matching close. */
export function baseSlots(context: string): string[] {
	const lines = context.split('\n');
	const base = lines.findIndex((l) => l.startsWith('export interface BaseContext'));
	const open = lines.findIndex((l, i) => i > base && l === '\treadonly slots: {');
	let depth = 0;
	for (let i = open; i < lines.length; i++) {
		for (const c of lines[i]!) depth += c === '{' ? 1 : c === '}' ? -1 : 0;
		if (depth === 0) return lines.slice(open + 1, i);
	}
	throw new Error('BaseContext has no closed slot table');
}

/** A grammar context: its namespaces over the kinds it covers, and the slot table re-instantiated over it. */
export function contextLines(vocab: Vocab, p: Plan | null, features: ReadonlyMap<string, Feature>, lang: Language, slots: readonly string[]): string[] {
	const ref = (path: string): string => kindRef(vocab, p, features, lang, path);
	const lines = [`export interface ${lang.ctx} extends GrammarContext${lang.composition ? `, ${lang.composition}` : ''} {`];
	for (const ns of NAMESPACES) {
		const arms = [...lang.claims.keys()].filter((path) => path.split('.')[0] === ns).map(ref);
		lines.push(`\treadonly ${ns}: ${arms.length > 0 ? arms.join(' | ') : 'never'};`);
	}
	const restated = [...(p?.restated.keys() ?? [])].filter((path) => ref(path).startsWith('('));
	const fill = (l: string): string => {
		let out = l.replace(/\bBaseContext\b/g, lang.ctx);
		for (const path of restated) out = out.replaceAll(`V.${vocab.byPath.get(path)!.qname}<${lang.ctx}>`, ref(path));
		return out;
	};
	lines.push('\treadonly slots: {', ...slots.map(fill), '\t};', '}', '');
	return lines;
}

/** A language's names: one per kind its context covers, nested as the vocabulary nests them, a term beside its kind. */
export function namesLines(vocab: Vocab, p: Plan | null, features: ReadonlyMap<string, Feature>, lang: Language): string[] {
	const entries: Entry[] = [];
	for (const path of lang.claims.keys()) {
		const it = vocab.byPath.get(path)!;
		const ref = kindRef(vocab, p, features, lang, path);
		entries.push({ qname: it.qname, order: entries.length, lines: [`type ${it.qname.split('.').pop()} = ${ref};`] });
		const term = lang.terms[path];
		if (term !== undefined) {
			const segs = it.qname.split('.');
			const spelled = term.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase());
			entries.push({ qname: [...segs.slice(0, -1), spelled].join('.'), order: entries.length, lines: [`type ${spelled} = ${ref};`] });
		}
	}
	return [`/** ${lang.name}'s names: one per kind its context covers, and its terms beside them. */`, `export namespace ${lang.name} {`, ...nest(entries, '\t', true), '}', ''];
}

const viewForm = [
	'type IsAbsent<T> = [T] extends [never] ? false : [T] extends [{ readonly absent: unknown }] ? true : false;',
	'',
	'/** A portable node\'s form of a vocabulary interface: each member a closure, `$kind` type-only, a member the language lacks dropped. */',
	'export type ViewForm<I> = {',
	"\treadonly [K in keyof I as K extends '$kind' ? never : IsAbsent<Required<I>[K]> extends true ? never : K]-?: () => I[K];",
	'};',
	'',
];

/**
 * The consumers the cost run checks, one file per language. For each kind the language covers: a portable node literal
 * with a closure per member the language's kind has, and the kind as a member of its namespace in the language's context.
 */
export function writeConsumers(
	dir: string,
	vocab: Vocab,
	p: Plan | null,
	features: ReadonlyMap<string, Feature>,
	langs: readonly Language[],
	members: (lang: Language, path: string) => readonly string[]
): string[] {
	writeFileSync(join(dir, 'view-form.ts'), viewForm.join('\n'));
	const files: string[] = [];
	for (const lang of langs) {
		const lines = [
			`import type { ${lang.ctx} } from './languages.ts';`,
			"import type * as V from './vocabulary/index.ts';",
			...restatingImports(p, features, [lang], './vocabulary/features/'),
			"import type { ViewForm } from './view-form.ts';",
			'',
		];
		let n = 0;
		for (const path of lang.claims.keys()) {
			const ref = kindRef(vocab, p, features, lang, path);
			const closures = members(lang, path).map((m) => `${/^[\w$]+$/.test(m) ? m : `'${m}'`}: () => null!`);
			lines.push(`export const v${n}: ViewForm<${ref}> = { ${closures.join(', ')} };`);
			lines.push(`export const b${n}: ${lang.ctx}['${path.split('.')[0]}'] = null! as ${ref};`);
			n++;
		}
		const file = `consumer-${lang.key}.ts`;
		writeFileSync(join(dir, file), `${lines.join('\n')}\n`);
		files.push(file);
	}
	return files;
}

export const COMPILER_OPTIONS = {
	target: 'esnext',
	module: 'nodenext',
	moduleResolution: 'nodenext',
	strict: true,
	noUncheckedIndexedAccess: true,
	noEmit: true,
	verbatimModuleSyntax: true,
	isolatedModules: true,
	allowImportingTsExtensions: true,
	skipLibCheck: true,
	types: [],
};

export function writeTsconfig(file: string, files: readonly string[], extend?: string): void {
	const config = extend ? { extends: extend, files } : { compilerOptions: COMPILER_OPTIONS, files };
	writeFileSync(file, `${JSON.stringify(config, null, '\t')}\n`);
}

// ---------------------------------------------------------------------------------------------------------------------
// The equality proposal

/** Rewrites expression.ts: `equal` and `not_equal` become levels over a base `strict` leaf and a feature's `loose` one. */
export function equalityProposal(vdir: string): void {
	const file = join(vdir, 'expression.ts');
	let text = readFileSync(file, 'utf8');
	const t = '\t\t\t';
	const level = (name: string, path: string, both: string, loose: string): string[] => {
		const parent = `V.Expression.Binary.Comparison.${name}<G>`;
		return [
			`${t}export interface ${name}<G extends GrammarContext> extends SubKindOf<V.Expression.Binary<G>> {`,
			`${t}\treadonly $kind: 'expression.binary.comparison.${path}';`,
			`${t}\treadonly operator: ${both};`,
			`${t}}`,
			`${t}export namespace ${name} {`,
			`${t}\texport interface Loose<G extends GrammarContext> extends SubKindOf<${parent}> {`,
			`${t}\t\treadonly $kind: 'expression.binary.comparison.${path}.loose';`,
			`${t}\t\treadonly operator: ${loose};`,
			`${t}\t}`,
			`${t}\texport interface Strict<G extends GrammarContext> extends SubKindOf<${parent}> {`,
			`${t}\t\treadonly $kind: 'expression.binary.comparison.${path}.strict';`,
			`${t}\t\treadonly operator: ${both};`,
			`${t}\t}`,
			`${t}\texport type Any<G extends GrammarContext> =`,
			`${t}\t\t| V.Expression.Binary.Comparison.${name}<G>`,
			`${t}\t\t| V.Expression.Binary.Comparison.${name}.Loose<G>`,
			`${t}\t\t| V.Expression.Binary.Comparison.${name}.Strict<G>;`,
			`${t}}`,
		];
	};
	const block = (name: string, path: string, op: string): string =>
		[
			`${t}export interface ${name}<G extends GrammarContext> extends SubKindOf<V.Expression.Binary<G>> {`,
			`${t}\treadonly $kind: 'expression.binary.comparison.${path}';`,
			`${t}\treadonly operator: '${op}';`,
			`${t}}`,
			'',
		].join('\n');
	// Every union that listed the old leaves lists the new levels and leaves.
	text = text.replace(
		/^(\t+)\| V\.Expression\.Binary\.Comparison\.(Equal|NotEqual)<G>(;?)$/gm,
		(_, ind: string, name: string, end: string) =>
			[`${ind}| V.Expression.Binary.Comparison.${name}<G>`, `${ind}| V.Expression.Binary.Comparison.${name}.Loose<G>`, `${ind}| V.Expression.Binary.Comparison.${name}.Strict<G>${end}`].join('\n')
	);
	text = text.replace(/^\t+\| V\.Expression\.Binary\.Comparison\.Strict(?:Not)?Equal<G>;?\n/gm, (l) => (l.trimEnd().endsWith(';') ? '\u0000' : ''));
	text = text.replace(/<G>\n\u0000/g, '<G>;\n');
	if (text.includes('\u0000')) throw new Error('equality proposal: a union ends in a removed leaf after a non-member line');
	text = replaceOnce(text, block('Equal', 'equal', '=='), `${level('Equal', 'equal', "'==' | '==='", "'=='").join('\n')}\n`);
	text = replaceOnce(text, block('NotEqual', 'not_equal', '!='), `${level('NotEqual', 'not_equal', "'!=' | '!=='", "'!='").join('\n')}\n`);
	text = replaceOnce(text, block('StrictEqual', 'strict_equal', '==='), '');
	text = replaceOnce(text, block('StrictNotEqual', 'strict_not_equal', '!=='), '');
	writeFileSync(file, text);
}

/** The snapshot's claims as the equality proposal reads them. */
export const EQUALITY_CLAIMS: Record<Grammar, Readonly<Record<string, string>>> = {
	python: {
		'expression.binary.comparison.equal': 'expression.binary.comparison.equal.strict',
		'expression.binary.comparison.not_equal': 'expression.binary.comparison.not_equal.strict',
	},
	rust: {
		'expression.binary.comparison.equal': 'expression.binary.comparison.equal.strict',
		'expression.binary.comparison.not_equal': 'expression.binary.comparison.not_equal.strict',
	},
	typescript: {
		'expression.binary.comparison.equal': 'expression.binary.comparison.equal.loose',
		'expression.binary.comparison.not_equal': 'expression.binary.comparison.not_equal.loose',
		'expression.binary.comparison.strict_equal': 'expression.binary.comparison.equal.strict',
		'expression.binary.comparison.strict_not_equal': 'expression.binary.comparison.not_equal.strict',
	},
};

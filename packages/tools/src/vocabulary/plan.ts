import { posix } from 'node:path';
import { type DeclaredKind, type Feature, type Member, type VocabularySource, byCodepoint, isKind } from './read.ts';

export interface Kind {
	readonly qname: string;
	readonly path: string;
	readonly parent: string | undefined;
	readonly feature: Feature | undefined;
}

export interface Owned {
	readonly feature: Feature;
	readonly member: Member;
}

export interface Enumeration {
	readonly name: string;
	readonly root: string;
	readonly values: readonly string[];
}

export interface Enumerated {
	readonly member: string;
	readonly enumeration: Enumeration;
	readonly feature: Feature | undefined;
}

export interface Flag {
	readonly member: string;
	readonly feature: Feature | undefined;
}

export interface ValueSet {
	readonly enumerated: readonly Enumerated[];
	readonly flags: readonly Flag[];
}

export interface ValueRefinement {
	readonly qname: string;
	readonly path: string;
	readonly parent: string;
	readonly value: string;
	readonly enumerated: Enumerated;
}

export interface Plan {
	readonly features: ReadonlyMap<string, Feature>;
	readonly kinds: ReadonlyMap<string, Kind>;
	readonly owned: ReadonlyMap<string, ReadonlyMap<string, Owned>>;
	readonly enumerations: ReadonlyMap<string, Enumeration>;
	readonly valueSets: ReadonlyMap<string, ValueSet>;
	readonly values: ReadonlyMap<string, ValueRefinement>;
	readonly levels: ReadonlyMap<string, readonly string[]>;
	readonly issues: readonly string[];
	readonly notes: readonly string[];
}

type Declaration =
	| { readonly gated: false; readonly by: Feature | undefined; readonly member: Member }
	| { readonly gated: true; readonly by: Feature; readonly member: Member };

export const RESERVED_ALIASES: ReadonlySet<string> = new Set(['features', 'gate', 'V']);

export const under = (path: string, at: string): boolean => path === at || path.startsWith(`${at}.`);
export const stubAlias = (feature: Feature): string => posix.basename(feature.dir).replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const snake = (s: string): string => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const owner = (feature: Feature | undefined): string => feature?.name ?? 'the base';

export function closure(name: string, features: ReadonlyMap<string, Feature>): Set<string> {
	const out = new Set<string>();
	const visit = (n: string): void => {
		const feature = features.get(n);
		if (feature === undefined || out.has(n)) return;
		out.add(n);
		for (const parent of feature.parents) visit(parent);
	};
	visit(name);
	return out;
}

export function plan(source: VocabularySource): Plan {
	const issues: string[] = [];
	const notes: string[] = [];
	const features = checkedFeatures(source, issues);

	const declaredKinds: { readonly d: DeclaredKind; readonly feature: Feature | undefined }[] = [
		...source.kinds.map((d) => ({ d, feature: undefined })),
		...[...features.values()].flatMap((feature) => feature.stubs.filter(isKind).map((d) => ({ d, feature })))
	];
	const pathOf = new Map<string, { readonly path: string; readonly feature: Feature | undefined }>();
	for (const { d, feature } of declaredKinds) {
		const prior = pathOf.get(d.qname);
		if (prior === undefined) pathOf.set(d.qname, { path: d.path, feature });
		else if (prior.path !== d.path) issues.push(`${d.qname}: ${owner(prior.feature)} gives it the path ${prior.path}, and ${owner(feature)} gives it ${d.path}`);
	}
	const kinds = new Map<string, Kind>();
	const byQname = new Map<string, Kind>();
	const declarations = new Map<string, Map<string, Declaration[]>>();
	const declare = (path: string, d: Declaration): void => {
		const byName = declarations.get(path) ?? new Map<string, Declaration[]>();
		byName.set(d.member.name, [...(byName.get(d.member.name) ?? []), d]);
		declarations.set(path, byName);
	};
	for (const { d, feature } of declaredKinds) {
		if (pathOf.get(d.qname)?.path !== d.path) continue;
		const prior = kinds.get(d.path);
		if (prior !== undefined) {
			issues.push(`${d.path}: declared by ${owner(prior.feature)} and ${owner(feature)}`);
			continue;
		}
		if (!source.modules.has(topSegment(d.qname))) {
			issues.push(`${d.path}: ${owner(feature)} declares it in ${topSegment(d.qname)}, a namespace no base file declares`);
			continue;
		}
		const parent = d.parent === undefined ? undefined : pathOf.get(d.parent)?.path;
		if (d.parent !== undefined && parent === undefined) issues.push(`${d.path} extends ${d.parent}, which is not a kind`);
		if (parent !== undefined && (parent === d.path || !under(d.path, parent))) issues.push(`${d.path} extends ${parent}, which is not a level above it`);
		const kind: Kind = { qname: d.qname, path: d.path, parent, feature };
		kinds.set(d.path, kind);
		byQname.set(d.qname, kind);
		for (const member of d.members) declare(d.path, { gated: false, by: feature, member });
	}
	for (const kind of kinds.values()) {
		const parent = kind.parent === undefined ? undefined : kinds.get(kind.parent);
		if (parent?.feature === undefined) continue;
		if (kind.feature === undefined) issues.push(`${kind.path} is a base kind under ${parent.path}, which ${parent.feature.name} adds`);
		else if (!closure(kind.feature.name, features).has(parent.feature.name)) {
			notes.push(`${kind.feature.name} adds ${kind.path} under ${parent.path}, which ${parent.feature.name} adds, and does not extend it`);
		}
	}
	for (const feature of features.values()) {
		for (const stub of feature.stubs) {
			if (isKind(stub)) continue;
			const kind = byQname.get(stub.qname);
			if (kind === undefined) issues.push(`${feature.name}: ${stub.qname} adds members to a kind the vocabulary does not declare`);
			else for (const member of stub.members) declare(kind.path, { gated: true, by: feature, member });
		}
	}

	const owned = ownership(declarations, features, issues);
	const lineage = (path: string): string[] => {
		const out: string[] = [];
		for (let k = kinds.get(path); k !== undefined; k = k.parent === undefined ? undefined : kinds.get(k.parent)) out.push(k.path);
		return out;
	};
	const lines = new Map([...kinds.keys()].map((path) => [path, lineage(path)]));
	for (const [path, members] of owned) {
		for (const [name, o] of members) {
			for (const [other, byName] of declarations) {
				const list = byName.get(name);
				if (other === path || list === undefined) continue;
				const by = owned.get(other)?.get(name)?.feature;
				if (by === o.feature || (by === undefined && list.every((d) => d.gated))) continue;
				const declarer = by?.name ?? 'the kind';
				if (lines.get(other)?.includes(path)) issues.push(`${o.feature.name} owns ${name} at ${path}, and ${declarer} declares it at ${other}, which inherits it`);
				if (lines.get(path)?.includes(other)) issues.push(`${o.feature.name} owns ${name} at ${path}, and ${declarer} declares it at ${other}, which it inherits from`);
			}
		}
	}
	const ownedNames = new Set([...owned.values()].flatMap((members) => [...members.keys()]));
	for (const name of [...ownedNames].sort(byCodepoint)) {
		const left = [...declarations]
			.filter(([path, byName]) => kinds.get(path)?.feature === undefined && !owned.get(path)?.has(name) && byName.get(name)?.some((d) => !d.gated) === true)
			.map(([path]) => path)
			.sort(byCodepoint);
		if (left.length > 0) notes.push(`${name} is gated at some kinds and stays in the base at ${left.length}: ${left.join(', ')}`);
	}

	const enumerations = new Map(
		[...source.enumerations].map(([name, root]): [string, Enumeration] => [
			name,
			{ name, root, values: [...kinds.keys()].filter((path) => path.startsWith(`${root}.`)).sort(byCodepoint) }
		])
	);
	for (const e of enumerations.values()) if (e.values.length === 0) issues.push(`${e.name}: no kind lies beneath its root ${e.root}`);
	const valueSets = memberValues(kinds, lines, declarations, owned, enumerations);
	const values = valueRefinements(kinds, byQname, valueSets, issues);
	return { features, kinds, owned, enumerations, valueSets, values, levels: levels([...kinds.values(), ...values.values()]), issues, notes };
}

const topSegment = (path: string): string => path.replace(/\..*$/, '');
const pascal = (segment: string): string =>
	segment
		.split('_')
		.map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`)
		.join('');

function memberValues(
	kinds: ReadonlyMap<string, Kind>,
	lines: ReadonlyMap<string, readonly string[]>,
	declarations: ReadonlyMap<string, ReadonlyMap<string, readonly Declaration[]>>,
	owned: ReadonlyMap<string, ReadonlyMap<string, Owned>>,
	enumerations: ReadonlyMap<string, Enumeration>
): Map<string, ValueSet> {
	const byType = new Map([...enumerations.values()].map((e) => [`V.${e.name}`, e]));
	const out = new Map<string, ValueSet>();
	for (const path of [...kinds.keys()].sort(byCodepoint)) {
		const enumerated: Enumerated[] = [];
		const flags: Flag[] = [];
		const seen = new Set<string>();
		for (const at of lines.get(path) ?? []) {
			for (const [name, list] of declarations.get(at) ?? []) {
				if (seen.has(name)) continue;
				seen.add(name);
				const o = owned.get(at)?.get(name);
				const member = o?.member ?? list.find((d) => !d.gated)?.member;
				const enumeration = member === undefined ? undefined : byType.get(member.type);
				if (enumeration !== undefined) enumerated.push({ member: name, enumeration, feature: o?.feature });
				else if (member?.type === 'boolean') flags.push({ member: name, feature: o?.feature });
			}
		}
		const byMember = (a: { readonly member: string }, b: { readonly member: string }): number => byCodepoint(a.member, b.member);
		if (enumerated.length > 0 || flags.length > 0) out.set(path, { enumerated: enumerated.sort(byMember), flags: flags.sort(byMember) });
	}
	return out;
}

function valueRefinements(
	kinds: ReadonlyMap<string, Kind>,
	byQname: ReadonlyMap<string, Kind>,
	valueSets: ReadonlyMap<string, ValueSet>,
	issues: string[]
): Map<string, ValueRefinement> {
	const out = new Map<string, ValueRefinement>();
	const qnames = new Set<string>();
	for (const kind of kinds.values()) {
		for (const enumerated of valueSets.get(kind.path)?.enumerated ?? []) {
			const { name, root, values } = enumerated.enumeration;
			const nested = (leaf: string): string => `${kind.qname}.${leaf.split('.').map(pascal).join('.')}`;
			for (const value of values) {
				const leaf = value.slice(root.length + 1);
				const path = `${kind.path}.${leaf}`;
				const qname = nested(leaf);
				const dot = leaf.lastIndexOf('.');
				const above = dot < 0 ? undefined : leaf.slice(0, dot);
				if (above !== undefined && !values.includes(`${root}.${above}`)) {
					issues.push(`${name}: ${value} lies beneath ${root}.${above}, which is not one of its values`);
					continue;
				}
				if (kinds.has(path) || out.has(path) || byQname.has(qname) || qnames.has(qname)) {
					issues.push(`${path}: ${kind.path}'s ${enumerated.member} ${value} refines it there, and another kind already has that path or name`);
					continue;
				}
				qnames.add(qname);
				out.set(path, { qname, path, parent: above === undefined ? kind.qname : nested(above), value, enumerated });
			}
		}
	}
	return out;
}

function checkedFeatures(source: VocabularySource, issues: string[]): Map<string, Feature> {
	const features = new Map<string, Feature>();
	for (const feature of source.features) {
		const prior = features.get(feature.name);
		if (prior === undefined) features.set(feature.name, feature);
		else issues.push(`${feature.name}: declared by features/${prior.dir} and features/${feature.dir}`);
	}
	const contextKeys = new Set([...source.kinds.map((d) => topSegment(d.path)), 'slots']);
	const byDir = new Map([...features.values()].map((f) => [f.dir, f]));
	const byKey = new Map<string, Feature>();
	const byAlias = new Map<string, Feature>();
	for (const feature of features.values()) {
		for (const parent of feature.parents) if (!features.has(parent)) issues.push(`${feature.name} extends ${parent}, which is not a feature`);
		const outer = byDir.get(posix.dirname(feature.dir));
		if (outer !== undefined && !feature.parents.includes(outer.name)) issues.push(`${feature.name} sits in features/${outer.dir} but does not extend ${outer.name}`);
		const sameKey = byKey.get(feature.key);
		if (sameKey !== undefined) issues.push(`${sameKey.name} and ${feature.name} have the marker key ${feature.key}`);
		byKey.set(feature.key, feature);
		if (contextKeys.has(feature.key)) issues.push(`${feature.name}'s marker key ${feature.key} is a key of every context`);
		const alias = stubAlias(feature);
		const sameAlias = byAlias.get(alias);
		if (sameAlias !== undefined || RESERVED_ALIASES.has(alias)) issues.push(`${feature.name}'s folder name gives the alias ${alias}, which ${sameAlias?.name ?? 'the augmentation'} already uses`);
		byAlias.set(alias, feature);
		for (const file of feature.unexported) issues.push(`features/${feature.dir}/index.ts does not export ${file}`);
	}
	return features;
}

function ownership(
	declarations: ReadonlyMap<string, ReadonlyMap<string, readonly Declaration[]>>,
	features: ReadonlyMap<string, Feature>,
	issues: string[]
): Map<string, Map<string, Owned>> {
	const owned = new Map<string, Map<string, Owned>>();
	for (const [path, byName] of declarations) {
		for (const [name, list] of byName) {
			const kindOwn = list.find((d) => !d.gated);
			const optional = list.filter((d) => d.gated && d.member.optional);
			if (kindOwn === undefined && optional.length > 1) {
				issues.push(`${path}.${name}: owned by ${optional.map((d) => owner(d.by)).join(' and ')}`);
				continue;
			}
			const first = kindOwn ?? optional[0] ?? (list.length === 1 ? list[0] : undefined);
			if (first === undefined) {
				issues.push(`${path}.${name}: required by ${list.map((d) => owner(d.by)).join(' and ')}, and declared optional by none`);
				continue;
			}
			if (first.gated) {
				const members = owned.get(path) ?? new Map<string, Owned>();
				members.set(name, { feature: first.by, member: first.member });
				owned.set(path, members);
			}
			for (const d of list) {
				if (d === first) continue;
				const restates = d.gated && !d.member.optional && first.member.optional && d.member.type === first.member.type;
				if (!restates) issues.push(`${path}.${name}: declared by ${owner(first.by)} and by ${owner(d.by)}`);
				else if (first.by !== undefined && !closure(d.by.name, features).has(first.by.name)) {
					issues.push(`${d.by.name} restates ${path}.${name}, which ${first.by.name} owns, and does not extend ${first.by.name}`);
				}
			}
		}
	}
	return owned;
}

function levels(kinds: readonly { readonly qname: string; readonly path: string }[]): Map<string, readonly string[]> {
	const byQname = new Map(kinds.map((k) => [k.qname, k.path]));
	const paths = new Map<string, string>();
	const levelPath = (ns: string): string => {
		const known = byQname.get(ns) ?? paths.get(ns);
		if (known !== undefined) return known;
		const dot = ns.lastIndexOf('.');
		const path = dot < 0 ? snake(ns) : `${levelPath(ns.slice(0, dot))}.${snake(ns.slice(dot + 1))}`;
		paths.set(ns, path);
		return path;
	};
	const namespaces = new Set<string>();
	for (const kind of kinds) {
		const segments = kind.qname.split('.');
		namespaces.add(topSegment(kind.qname));
		for (let i = 1; i < segments.length; i++) namespaces.add(segments.slice(0, i).join('.'));
	}
	const sorted = [...kinds].sort((a, b) => byCodepoint(a.qname, b.qname));
	return new Map(
		[...namespaces].sort(byCodepoint).map((ns) => {
			const at = levelPath(ns);
			return [ns, sorted.filter((k) => under(k.path, at)).map((k) => k.qname)] as const;
		})
	);
}

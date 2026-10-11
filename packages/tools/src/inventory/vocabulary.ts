import { FLAG, isKind, readVocabularySource } from '../vocabulary/read.ts';

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

export function readVocabulary(dir: string): Vocabulary {
	const source = readVocabularySource(dir);
	const stubs = source.features.flatMap((feature) => feature.stubs);
	const declared = [...source.kinds, ...stubs.filter(isKind)];
	const pathByName = new Map(declared.map((d) => [d.qname, d.path]));
	const own = new Map(declared.map((d) => [d.qname, new Map(d.members.map((m) => [m.name, { optional: m.optional, flag: m.type === FLAG }]))]));
	for (const stub of stubs) {
		const members = own.get(stub.qname);
		if (isKind(stub) || members === undefined) continue;
		for (const m of stub.members) members.set(m.name, { optional: m.optional || members.get(m.name)?.optional === true, flag: m.type === FLAG });
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

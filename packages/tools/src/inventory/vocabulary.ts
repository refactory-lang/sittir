import { isKind, readVocabularySource } from '../vocabulary/read.ts';

export interface VocabularyMember {
	readonly optional: boolean;
}

export interface VocabularyKind {
	readonly name: string;
	readonly own: ReadonlyMap<string, VocabularyMember>;
	readonly parent: string | undefined;
}

export interface Vocabulary {
	readonly kinds: ReadonlyMap<string, VocabularyKind>;
	members(path: string): ReadonlyMap<string, VocabularyMember>;
}

export function readVocabulary(dir: string): Vocabulary {
	const source = readVocabularySource(dir);
	const stubs = source.features.flatMap((feature) => feature.stubs);
	const declared = [...source.kinds, ...stubs.filter(isKind)];
	const pathByName = new Map(declared.map((d) => [d.qname, d.path]));
	const own = new Map(declared.map((d) => [d.qname, new Map(d.members.map((m) => [m.name, { optional: m.optional }]))]));
	for (const stub of stubs) {
		const members = own.get(stub.qname);
		if (isKind(stub) || members === undefined) continue;
		for (const m of stub.members) members.set(m.name, { optional: m.optional || members.get(m.name)?.optional === true });
	}
	const kinds = new Map<string, VocabularyKind>();
	for (const d of declared) {
		kinds.set(d.path, { name: d.qname, own: own.get(d.qname) ?? new Map(), parent: d.parent === undefined ? undefined : pathByName.get(d.parent) });
	}
	const members = (path: string): ReadonlyMap<string, VocabularyMember> => {
		const all = new Map<string, VocabularyMember>();
		for (let kind = kinds.get(path); kind !== undefined; kind = kind.parent === undefined ? undefined : kinds.get(kind.parent)) {
			for (const [name, member] of kind.own) if (!all.has(name)) all.set(name, member);
		}
		return all;
	};
	return { kinds, members };
}

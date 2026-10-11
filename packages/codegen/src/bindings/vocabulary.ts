import { readFileSync } from 'node:fs';
import { vocabularySources } from './hash.ts';
import { runPinned } from './read.ts';

export interface VocabularyMember {
	readonly optional: boolean;
	readonly flag: boolean;
}

export interface VocabularyKind {
	readonly name: string;
	readonly own: ReadonlyMap<string, VocabularyMember>;
	readonly parent: string | undefined;
}

export interface Vocabulary {
	readonly kinds: ReadonlyMap<string, VocabularyKind>;
	readonly flags: ReadonlySet<string>;
	members(path: string): ReadonlyMap<string, VocabularyMember>;
}

export interface VocabularyDeclaration {
	readonly name: string;
	readonly path: string;
	readonly own: readonly (readonly [string, VocabularyMember])[];
	readonly parentName?: string;
}

export async function readVocabulary(dir: string): Promise<Vocabulary> {
	const declared = (await Promise.all(vocabularySources(dir).map((path) => runPinned('vocabulary', readFileSync(path, 'utf8'))))).flat();
	const pathByName = new Map(declared.map((d) => [d.name, d.path]));
	const kinds = new Map<string, VocabularyKind>(
		declared.map((d) => [d.path, { name: d.name, own: new Map(d.own), parent: d.parentName === undefined ? undefined : pathByName.get(d.parentName) }])
	);
	const members = (path: string): ReadonlyMap<string, VocabularyMember> => {
		const all = new Map<string, VocabularyMember>();
		for (let kind = kinds.get(path); kind !== undefined; kind = kind.parent === undefined ? undefined : kinds.get(kind.parent)) {
			for (const [name, member] of kind.own) if (!all.has(name)) all.set(name, member);
		}
		return all;
	};
	const flags = new Set(declared.flatMap((d) => d.own.flatMap(([name, member]) => (member.flag ? [name] : []))));
	return { kinds, flags, members };
}

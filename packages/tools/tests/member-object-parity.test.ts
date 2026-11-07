// Every kind's `$with` and `$trivia`, read and built, on object and arena
// storage: the same own keys (string and symbol alike), only members under
// `Object.keys`, and a spread copy that behaves as the member object does.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { scopeBuilders } from '@sittir/common/engine';
import { FULL_PIPELINE_TIMEOUT } from '../../codegen/src/__tests__/helpers/timeouts.ts';
import {
	buildFactoryNodeFromReference,
	loadCorpusEntries,
	loadNodeModel,
	loadSlotAccessorOf,
	loadStorageKindNameFromId,
	type FactoryDispatchArtifacts,
	type ReadNodeLike
} from '../src/validate/common.ts';
import { requireGrammarModule } from '../src/grammar-internals.ts';
import { languageByName } from '../src/languages.ts';

const STORAGES = ['object', 'arena'] as const;
const MEMBER_OBJECTS = ['$with', '$trivia'] as const;

// Entries neither storage can read whole: regex mints its escapes' text pieces
// as visible nodes under a leaf kind, and the typed read refuses them.
const UNREAD: Readonly<Record<string, readonly string[]>> = {
	regex: [
		'Hexadecimal digits escape sequence',
		'Unicode escape',
		'Unicode escaped characters as atoms in character classes',
		'\\u without hex codes treated as identity escape',
		'atom escapes - control escapes'
	]
};

type Members = Record<PropertyKey, unknown>;
type Node = { readonly $type: number } & Members;

interface Surface {
	readonly ownKeys: readonly string[];
	readonly onlyMembers: boolean;
	readonly copy: string;
}

const outcome = (call: () => unknown): string => {
	try {
		const result = call();
		return result !== null && typeof result === 'object' && '$type' in result ? `node ${String((result as Node).$type)}` : `value ${Array.isArray(result) ? `list ${result.length}` : typeof result}`;
	} catch (error) {
		return `throws ${(error as Error).message.slice(0, 80)}`;
	}
};

function surfaceOf(node: Node, member: (typeof MEMBER_OBJECTS)[number]): Surface | undefined {
	const members = node[member] as Members | undefined;
	if (members === undefined || members === null || typeof members !== 'object') return undefined;
	const names = Object.keys(members);
	const copied = { ...members };
	const first = names.find((name) => typeof members[name] === 'function');
	let copy = 'no member';
	if (first !== undefined) {
		const argument = member === '$trivia' ? [] : [(node[first] as (() => unknown) | undefined)?.call(node)];
		const original = outcome(() => (members[first] as (...args: unknown[]) => unknown).apply(members, argument));
		const copiedCall = outcome(() => (copied[first] as (...args: unknown[]) => unknown).apply(copied, argument));
		copy = copiedCall === original ? 'same as the member object' : `differs: ${copiedCall} vs ${original}`;
	}
	return { ownKeys: Reflect.ownKeys(members).map(String), onlyMembers: names.every((name) => typeof members[name] === 'function'), copy };
}

interface Census {
	readonly surfaces: Map<string, Surface>;
	readonly built: Set<string>;
	readonly engine: { parse(source: string): Node };
	readonly artifacts: FactoryDispatchArtifacts;
}

async function censusOf(grammar: string, storage: (typeof STORAGES)[number]): Promise<Census> {
	const engine = await createEngine(await languageByName(grammar), { nodeStorage: storage });
	const model = await loadNodeModel(grammar);
	const artifacts: FactoryDispatchArtifacts = {
		factoryMap: scopeBuilders(engine, (await requireGrammarModule(grammar, 'factories/raw.ts'))._factoryMap),
		factoryShapes: model.factoryShapes,
		fieldAliasMap: model.fieldAliasMap,
		factoryFields: model.factoryFields,
		factorySlots: model.factorySlots
	};
	return { surfaces: new Map(), built: new Set(), engine: engine as unknown as Census['engine'], artifacts };
}

const readAll = (census: Census, source: string): Node[] => {
	const tree = census.engine.parse(source);
	return [tree, ...(tree.$query as () => { readonly $descendants: Iterable<unknown> })().$descendants].filter((n): n is Node => n !== null && typeof n === 'object');
};

async function censuses(grammar: string): Promise<{ readonly object: Map<string, Surface>; readonly arena: Map<string, Surface>; readonly unread: readonly string[] }> {
	const [object, arena] = await Promise.all([censusOf(grammar, 'object'), censusOf(grammar, 'arena')]);
	const kindNameFromId = await loadStorageKindNameFromId(grammar);
	const accessorOf = await loadSlotAccessorOf(grammar);
	const record = (census: Census, origin: string, node: Node): void => {
		const kind = kindNameFromId(node.$type) ?? `#${node.$type}`;
		for (const member of MEMBER_OBJECTS) {
			const key = `${origin} ${kind} ${member}`;
			if (census.surfaces.has(key)) continue;
			const surface = surfaceOf(node, member);
			if (surface !== undefined) census.surfaces.set(key, surface);
		}
	};
	const build = (census: Census, node: Node): void => {
		const kind = kindNameFromId(node.$type);
		if (kind === undefined || census.built.has(kind) || census.artifacts.factoryMap[kind] === undefined || census.artifacts.factoryShapes[kind] === 'constant') return;
		census.built.add(kind);
		try {
			const copy = buildFactoryNodeFromReference(node as unknown as ReadNodeLike, kind, census.artifacts, { kindNameFromId, accessorOf }) as Node | null;
			if (copy !== null && typeof copy === 'object') record(census, 'built', copy);
		} catch {
			census.surfaces.set(`built ${kind} refused`, { ownKeys: [], onlyMembers: true, copy: 'no member' });
		}
	};
	const unread: string[] = [];
	for (const entry of loadCorpusEntries(grammar)) {
		let read: [Node[], Node[]];
		try {
			read = [readAll(object, entry.source), readAll(arena, entry.source)];
		} catch {
			unread.push(entry.name);
			continue;
		}
		for (const [census, nodes] of [[object, read[0]], [arena, read[1]]] as const) {
			for (const node of nodes) {
				record(census, 'read', node);
				build(census, node);
			}
		}
	}
	return { object: object.surfaces, arena: arena.surfaces, unread };
}

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('%s: $with and $trivia have one surface on both storages', (grammar) => {
	it(
		'have the same own keys, only members under Object.keys, and copies that behave as the member object',
		async () => {
			const { object, arena, unread } = await censuses(grammar);
			expect([...unread].sort(), 'corpus entries that either storage cannot read whole').toEqual([...(UNREAD[grammar] ?? [])].sort());
			expect([...arena.keys()].sort()).toEqual([...object.keys()].sort());
			expect([...object.keys()].some((key) => key.startsWith('built '))).toBe(true);
			const differences: Record<string, unknown> = {};
			for (const [key, surface] of object) {
				const other = arena.get(key);
				if (other === undefined) continue;
				if (JSON.stringify(other.ownKeys) !== JSON.stringify(surface.ownKeys)) differences[`${key} own keys`] = { object: surface.ownKeys, arena: other.ownKeys };
				for (const [storage, s] of [['object', surface], ['arena', other]] as const) {
					if (!s.onlyMembers) differences[`${key} ${storage} Object.keys`] = s.ownKeys;
					if (s.copy.startsWith('differs')) differences[`${key} ${storage} copy`] = s.copy;
				}
			}
			expect(differences).toEqual({});
		},
		FULL_PIPELINE_TIMEOUT
	);
});

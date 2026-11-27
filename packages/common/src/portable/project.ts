import type { ErrorRegion, NodeTrivia, PortableContainer, PortableDecimalParts, PortablePreset, PortableSlotStep, PortableTemplate, QuerySlotEntry, UnitSidesWire } from '@sittir/types';
import { spelledMember } from '../spelled.ts';
import { nodeText, parseErrorsOf, sidesOf, spanOf, unitSidesOf } from '../node-data.ts';
import { isErrorNode } from '../utils.ts';
import { TRIVIA_SIDES } from '../trivia.ts';
import { meaningfulText, rebuilds, setsOn, spelledText, tokenText, type SeatText } from './facts.ts';
import { slotReader } from '../record-view.ts';
import { storedSlotRead } from '../stored-slot.ts';
import { hasKind, Keyword, rowItems, sameText, textOf, type Node } from './classify.ts';

export interface Found {
	readonly found: unknown;
	readonly many: boolean;
	readonly fitted?: false;
}

export interface Placed {
	readonly name: string;
	readonly slot: string;
	readonly index: number;
	readonly spelling?: string;
	readonly path?: string;
	readonly flag?: string;
}

export type Seats = readonly SeatText[];

export interface Routed {
	readonly value: unknown;
	readonly fitted: boolean;
	readonly extra?: string;
}

export interface Candidate {
	readonly name: string;
	readonly found: Routed | undefined;
	readonly seats: Seats;
	readonly depth: number;
	readonly requires?: readonly (readonly string[])[];
}

const holders = new WeakMap<object, Node>();

const containerFlags = new WeakMap<object, readonly string[]>();

let touched = false;

const missingHolders = new WeakMap<readonly ErrorRegion[], ReadonlySet<string>>();

const holderKey = (kind: number, span: { readonly start: number; readonly end: number }): string => `${kind}:${span.start}:${span.end}`;

const missingHoldersOf = (errors: readonly ErrorRegion[]): ReadonlySet<string> => {
	const known = missingHolders.get(errors);
	if (known !== undefined) return known;
	const found = new Set(errors.flatMap((region) => (region.kind === 'missing' ? [holderKey(region.holder.kind, region.holder.span)] : [])));
	missingHolders.set(errors, found);
	return found;
};

const holdsMissing = (node: Node, errors: readonly ErrorRegion[]): boolean => {
	const span = spanOf(node);
	return span !== undefined && missingHoldersOf(errors).has(holderKey(node.$type, span));
};

export const erred = (node: Node): boolean => {
	if (isErrorNode(node)) return true;
	const errors = parseErrorsOf(node);
	if (errors?.length === 0) return false;
	const holdsError = (sides: NodeTrivia | UnitSidesWire): boolean => TRIVIA_SIDES.some((side) => sides[side]?.some(isErrorNode) === true);
	return holdsError(sidesOf(node) ?? {}) || (unitSidesOf(node) ?? []).some(holdsError) || (errors !== undefined && holdsMissing(node, errors));
};

export const kindOf = (value: unknown): number | undefined => (typeof value === 'number' ? value : value instanceof Keyword ? value.kind : hasKind(value) ? value.$type : undefined);

export const kindIn = (kinds: ReadonlySet<number>, value: unknown): boolean => {
	const kind = kindOf(value);
	return kind !== undefined && kinds.has(kind);
};

export const itemsAt = (value: unknown, kind: number, row: QuerySlotEntry): readonly unknown[] => (hasKind(value) && value.$type === kind ? rowItems(value, row) : []);

export const present = (value: unknown): boolean => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

export const slotOf = (node: unknown, key: string): unknown => {
	if (!hasKind(node)) return undefined;
	const read = slotReader(node, key);
	return typeof read === 'function' ? (read as () => unknown).call(node) : read;
};

export { nodeText, rowItems, sameText, spelledText, storedSlotRead, textOf, tokenText };

export const texts = (items: readonly unknown[], fixed: Readonly<Record<number, string>>): readonly string[] => items.flatMap((item) => textOf(item, fixed) ?? []);

export const one = (items: readonly string[]): string | undefined => (items.length === 1 ? items[0] : undefined);

export const only = <T>(items: readonly T[]): readonly T[] => (items.length === 1 ? items : []);

export const step = (at: unknown, read: (node: Node) => unknown, kinds: ReadonlySet<number> | undefined): unknown => {
	if (Array.isArray(at)) return at.flatMap((item) => [step(item, read, kinds) ?? []].flat());
	if (!hasKind(at)) return undefined;
	touch(at);
	const reached = read(at);
	if (reached === undefined || reached === null || kinds === undefined) return reached ?? undefined;
	return Array.isArray(reached) ? reached.filter((item) => kinds.has(kindOf(item) ?? -1)) : kinds.has(kindOf(reached) ?? -1) ? reached : undefined;
};

export const joined = (parts: readonly Found[]): Found => ({ found: parts.flatMap((part) => [part.found].flat()), many: parts.some((part) => part.many) });

export const place = (
	placed: Placed[],
	taken: Set<number>,
	items: readonly unknown[],
	name: string,
	slot: string,
	test: (item: unknown, index: number) => boolean,
	spelling: ((index: number) => string | undefined) | undefined,
	path: string | undefined,
	flag: string | undefined
): void => {
	if (placed.some((held) => held.name === name)) return;
	const index = items.findIndex(test);
	if (index < 0) return;
	taken.add(index);
	const spelled = spelling?.(index);
	placed.push({ name, slot, index, ...(spelled === undefined ? {} : { spelling: spelled }), ...(path === undefined ? {} : { path }), ...(flag === undefined ? {} : { flag }) });
};

export const placedPath = (placed: readonly Placed[]): string | undefined => placed.find((held) => held.path !== undefined)?.path;

export const atOf = (placed: readonly Placed[]): Readonly<Record<string, { readonly index: number; readonly spelling?: string }>> =>
	Object.fromEntries(placed.map(({ name, index, spelling }) => [name, spelling === undefined ? { index } : { index, spelling }]));

export const untaken = (items: unknown, placed: readonly Placed[], slot: string): unknown => {
	const indices = new Set(placed.flatMap((held) => (held.slot === slot ? [held.index] : [])));
	return indices.size === 0 || !Array.isArray(items) ? items : items.filter((_, i) => !indices.has(i));
};

export const integerOf = (value: bigint | undefined, bigint: boolean): number | bigint | undefined =>
	value === undefined || bigint || value > BigInt(Number.MAX_SAFE_INTEGER) ? value : Number(value);

export const floatOf = (text: string): number | undefined => {
	const digits = text.replace(/(?<=\d)_(?=\d)/g, '');
	if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(digits)) return undefined;
	const value = Number(digits);
	return Number.isFinite(value) ? value : undefined;
};

export const holderOf = (node: Node): Node | undefined => holders.get(node);

export const flagsSetOn = (node: Node): readonly string[] => containerFlags.get(node) ?? [];

export const holdsKey = (value: object, key: string): boolean => key in value;

export const enclose = (result: Found, container: Node, sets: readonly Pick<PortableContainer, 'sets'>[]): Found => {
	const held = result.found;
	if (!hasKind(held)) return result;
	holders.set(held, container);
	const flags = sets.flatMap((at) => (at.sets?.kind === container.$type ? setsOn(at, held.$type) : []));
	if (flags.length > 0) containerFlags.set(held, [...new Set(flags)]);
	return result;
};

export const fits = (kinds: ReadonlySet<number>, value: unknown): boolean => (typeof value === 'number' ? kinds.size > 0 : kindIn(kinds, value));

export const leafFits = (value: unknown): boolean => hasKind(value) && nodeText(value) !== undefined;

export const unclaimedText = (node: Node, seats: Seats | undefined, fixed: Readonly<Record<number, string>>): string | undefined => {
	const kind = node.$type;
	const content = seats?.find((seat) => seat.contents?.[kind] !== undefined)?.contents?.[kind];
	const spelled = content === undefined ? undefined : textOf(slotOf(node, content), fixed);
	const own = seats === undefined ? undefined : nodeText(node);
	const rebuilt = own !== undefined && rebuilds(kind, own, seats) ? own : undefined;
	return tokenText(kind, seats) ?? spelled ?? rebuilt;
};

export const choose = (candidates: readonly Candidate[]): ReadonlyMap<string, Candidate & { readonly found: Routed }> => {
	const byName = new Map<string, (Candidate & { readonly found: Routed })[]>();
	for (const candidate of candidates) {
		const { found } = candidate;
		if (found === undefined || found.value === null) continue;
		(byName.get(candidate.name) ?? byName.set(candidate.name, []).get(candidate.name)!).push({ ...candidate, found });
	}
	for (const list of byName.values()) list.sort((a, b) => Number(b.found.fitted) - Number(a.found.fitted) || (a.found.fitted ? b.depth - a.depth : 0));
	const met = (candidate: Candidate, names: ReadonlySet<string>): boolean => (candidate.requires ?? []).every((group) => group.some((name) => names.has(name)));
	let chosen = new Map<string, Candidate & { readonly found: Routed }>();
	for (let names: ReadonlySet<string> = new Set(byName.keys()); ; ) {
		chosen = new Map(
			[...byName].flatMap(([name, list]) => {
				const pick = list.find((candidate) => met(candidate, names));
				return pick === undefined ? [] : [[name, pick] as const];
			})
		);
		if (chosen.size === names.size) break;
		names = new Set(chosen.keys());
	}
	return chosen;
};

export const fill = (structure: Record<string, unknown>, candidates: readonly Candidate[], read: (value: unknown, seats: Seats) => unknown): string | undefined => {
	const chosen = choose(candidates);
	let extra: string | undefined;
	for (const name of new Set(candidates.map((candidate) => candidate.name))) {
		const pick = chosen.get(name);
		if (pick === undefined) continue;
		extra ??= pick.found.extra;
		structure[name] = read(pick.found.value, pick.seats);
	}
	return extra;
};

export const templated = (structure: Record<string, unknown>, path: string, flags: readonly string[], templates: Readonly<Record<string, PortableTemplate>>): void => {
	for (const flag of flags) {
		const template = templates[flag];
		const text = template === undefined ? undefined : structure[template.slot];
		if (template === undefined || typeof text !== 'string') continue;
		const groups = new RegExp(template.match, 'u').exec(text)?.groups;
		if (groups === undefined) throw new Error(`portable read: ${path}'s ${template.slot} ${JSON.stringify(text)} spells no ${flag}`);
		for (const hole of template.holes) structure[hole] = groups[hole];
	}
};

export type Spellings = Readonly<Record<number, Readonly<Record<string, Readonly<Record<string, string>>>>>>;

export const walkSteps = (value: unknown, steps: readonly Pick<PortableSlotStep, 'key' | 'stored' | 'builder' | 'kinds'>[]): unknown => {
	if (Array.isArray(value)) return value.flatMap((item) => [walkSteps(item, steps) ?? []].flat());
	let reached = value;
	for (let i = 0; i < steps.length; i++) {
		if (Array.isArray(reached)) return walkSteps(reached, steps.slice(i));
		if (!hasKind(reached)) return undefined;
		touch(reached);
		const { key, stored, builder, kinds } = steps[i]!;
		const read = stored === undefined ? slotOf(reached, key) : storedSlotRead(reached, key, stored);
		const next = kinds === undefined ? read : Array.isArray(read) ? read.filter((item) => kinds.includes(kindOf(item) ?? -1)) : kinds.includes(kindOf(read) ?? -1) ? read : undefined;
		if (next === undefined || next === null) return undefined;
		if (Array.isArray(next) && builder !== undefined) i++;
		reached = next;
	}
	return reached;
};

export const contradicted = (node: Node, presets: readonly PortablePreset[], spellings: Spellings, fixed: Readonly<Record<number, string>>): boolean =>
	presets.some((preset) => {
		if ((preset.text === undefined && preset.kind === undefined) || preset.steps.at(-1)?.mounted !== undefined) return false;
		const held = walkSteps(node, preset.steps);
		if (held === undefined || Array.isArray(held)) return false;
		if (preset.text !== undefined) {
			const text = textOf(held, fixed);
			if (text === undefined) return false;
			const token = walkSteps(node, preset.steps.slice(0, -1));
			const facet = preset.steps.at(-1)!.key;
			const slot = hasKind(token) ? spelledMember(text, spellings[token.$type]?.[facet]) : text;
			return !(preset.among ?? [preset.text]).includes(slot);
		}
		const kind = kindOf(held);
		return kind !== undefined && kind !== preset.kind;
	});

const facetText = (item: unknown, facet: string, fixed: Readonly<Record<number, string>>): string | undefined => {
	touch(item);
	const held = slotOf(item, facet);
	return typeof held === 'string' ? held : textOf(held, fixed);
};

const closerText = (item: unknown, facet: string | undefined, fixed: Readonly<Record<number, string>>): string | undefined => {
	const text = facet === undefined ? undefined : facetText(item, facet, fixed);
	return text === '' ? undefined : text;
};

export interface Closer {
	readonly facet: string;
	readonly name: string;
	readonly reads: number;
	readonly seats: Seats;
	readonly built?: string;
}

export const closerTexts = (items: readonly unknown[], facets: Readonly<Record<number, string>>, fixed: Readonly<Record<number, string>>): readonly string[] =>
	items.flatMap((item) => closerText(item, hasKind(item) ? facets[item.$type] : undefined, fixed) ?? []);

export const closersInto = (structure: Record<string, unknown>, items: readonly unknown[], closers: Readonly<Record<number, Closer>>, fixed: Readonly<Record<number, string>>): void => {
	for (const item of items) {
		const closer = hasKind(item) ? closers[item.$type] : undefined;
		const text = closer === undefined ? undefined : closerText(item, closer.facet, fixed);
		if (closer === undefined || text === undefined) continue;
		const read = spelledText(closer.reads, text, closer.seats, closer.built);
		if (read === undefined) continue;
		const held = structure[closer.name];
		structure[closer.name] = Array.isArray(held) ? [...held, read] : held === undefined ? [read] : [held, read];
	}
};

export const slotsText = (node: Node, keys: readonly string[], fixed: Readonly<Record<number, string>>): string | undefined => {
	const texts = keys.map((key) => textOf(slotOf(node, key), fixed));
	return texts.every((text) => text !== undefined) ? texts.join('') : undefined;
};

export const decimalOf = (node: Node, parts: PortableDecimalParts, fixed: Readonly<Record<number, string>>): number | undefined => {
	const part = (key: string | undefined): string | undefined => (key === undefined ? undefined : textOf(slotOf(node, key), fixed));
	const [integer, fraction, exponent, sign] = [part(parts.integer), part(parts.fraction), part(parts.exponent), part(parts.exponentSign)];
	return floatOf(`${integer ?? '0'}.${fraction ?? '0'}${exponent === undefined ? '' : `e${sign ?? ''}${exponent}`}`);
};

export const delimited = (items: readonly unknown[], delimiter: number): boolean =>
	items.some((item) => {
		const stamped = hasKind(item) ? (item as { readonly delimiter?: unknown }).delimiter : undefined;
		return typeof stamped === 'number' && (stamped & delimiter) !== 0;
	});

export const readOnlySpelled = (items: readonly unknown[], readOnly: Readonly<Record<number, Readonly<Record<string, readonly string[]>>>>, spellings: Spellings, fixed: Readonly<Record<number, string>>): boolean =>
	items.some((item) => {
		const facets = hasKind(item) ? readOnly[item.$type] : undefined;
		if (facets === undefined || !hasKind(item)) return false;
		return Object.entries(facets).some(([facet, slots]) => {
			const text = facetText(item, facet, fixed);
			return text !== undefined && slots.includes(spelledMember(text, spellings[item.$type]?.[facet]));
		});
	});

export const unread = (items: readonly unknown[], otherTested: boolean, meaning: Readonly<Record<number, readonly string[]>>, fixed: Readonly<Record<number, string>>): boolean =>
	items.some((item) => (hasKind(item) ? meaningfulText(item, meaning[item.$type], (value) => textOf(value, fixed)) !== '' : typeof item === 'number' && otherTested));

export const opaque = (item: unknown): boolean => hasKind(item) && typeof (item as { readonly $verbatim?: unknown }).$verbatim === 'string';

export const checksFrame = (result: unknown): boolean => typeof result === 'object' && result !== null && '$path' in result && !('$value' in result);

export const touch = (node: unknown): void => {
	if (!touched && hasKind(node) && erred(node)) touched = true;
};

export const framed = <S>(node: Node, seats: S, read: (node: Node, seats: S) => unknown, keep: (node: Node) => unknown = (held) => held): unknown => {
	const outer = touched;
	touched = false;
	try {
		const result = read(node, seats);
		return touched && checksFrame(result) ? keep(node) : result;
	} finally {
		touched = outer;
	}
};

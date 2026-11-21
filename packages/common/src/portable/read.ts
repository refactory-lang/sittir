import type { ErrorRegion, PortableBuildArm, PortableBuildTable, PortableContainer, PortableDecimalParts, PortableSlotRoute, PortablePreset, PortableSeat, PortableSlotStep } from '@sittir/types';
import { nodeText, sidesOf, spanOf } from '../node-data.ts';
import { integerValue } from '../number.ts';
import { isErrorNode } from '../utils.ts';
import { treeOf } from '../tree-token.ts';
import { spelledMember } from '../spelled.ts';
import { hasKind, type HoldingFact, type PortableClassifier } from './classify.ts';
import { builtFlags, containerSlots, isNumberSlots, leafSeatOf, setsOn, textBuilt, tokenText } from './facts.ts';
import { slotItems } from '../query-holds.ts';
import { slotReader } from '../record-view.ts';
import { storedSlotRead } from '../stored-slot.ts';

type Node = { readonly $type: number };

export type PortableCarry =
	| { readonly reason: 'unclaimed' | 'scalar' | 'text' | 'preset' | 'opaque' | 'readOnly' }
	/** A node a parse error sits on, or one whose read passes through such a node: carried whole, so the build keeps the source text the parse could not place. A fault of the input, not of the bindings. */
	| { readonly reason: 'error' }
	| { readonly reason: 'flags'; readonly flags: readonly string[] }
	| { readonly reason: 'unread'; readonly slot: string };

export type PortableCarried = (node: Node, carry: PortableCarry) => void;

const kept = (node: Node, carry: PortableCarry, carried: PortableCarried | undefined): Node => {
	carried?.(node, carry);
	return node;
};

export interface PortableReadContext {
	readonly table: PortableBuildTable;
	readonly classify: PortableClassifier;
	readonly factsOf: (node: Node, container: Node) => readonly HoldingFact[];
	readonly flagHolds: (value: Node | number, flag: string) => boolean;
	readonly flagsOf: (kind: number) => readonly string[];
	readonly textOf: (value: unknown) => string | undefined;
	readonly slotsOf: (node: Node) => readonly (readonly [accessor: string, items: readonly unknown[]])[];
	readonly readSlots: (node: Node, path: string, flags: readonly string[]) => ReadonlySet<string>;
	readonly otherTested: (node: Node, path: string) => ReadonlySet<string>;
}

const holders = new WeakMap<readonly ErrorRegion[], ReadonlySet<string>>();

const holderKey = (kind: number, span: { readonly start: number; readonly end: number }): string => `${kind}:${span.start}:${span.end}`;

const holdersOf = (errors: readonly ErrorRegion[]): ReadonlySet<string> => {
	const known = holders.get(errors);
	if (known !== undefined) return known;
	const found = new Set(errors.flatMap((region) => (region.kind === 'missing' ? [holderKey(region.holder.kind, region.holder.span)] : [])));
	holders.set(errors, found);
	return found;
};

const holdsMissing = (node: Node, errors: readonly ErrorRegion[]): boolean => {
	const span = spanOf(node);
	return span !== undefined && holdersOf(errors).has(holderKey(node.$type, span));
};

const erred = (node: Node): boolean => {
	if (isErrorNode(node)) return true;
	const errors = treeOf(node)?.errors;
	if (errors?.length === 0) return false;
	return Object.values(sidesOf(node) ?? {}).some((entries) => entries.some(isErrorNode)) || (errors !== undefined && holdsMissing(node, errors));
};

const opaque = (item: unknown): boolean => hasKind(item) && typeof (item as { readonly $verbatim?: unknown }).$verbatim === 'string';

const present = (value: unknown): boolean => value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);

interface Hop {
	readonly key: string;
	readonly stored: string | undefined;
	readonly builds: string | undefined;
}

const readRoutesOf = (arm: PortableBuildArm): readonly PortableSlotRoute[] => (arm.readOnly === undefined ? arm.slots : [...arm.slots, ...arm.readOnly]);

const stepHops = (steps: readonly PortableSlotStep[]): readonly Hop[] => steps.map((step) => ({ key: step.key, stored: step.stored, builds: step.builder }));


const kindOfValue = (value: unknown): number | undefined => (typeof value === 'number' ? value : hasKind(value) ? value.$type : undefined);

const fits = (seat: PortableSeat, value: unknown): boolean => {
	if (typeof value === 'number') return seat.kinds.length > 0;
	const kind = kindOfValue(value);
	return kind !== undefined && (seat.kinds.includes(kind) || (seat.kinds.length === 0 && seat.leaf !== undefined && nodeText(value) !== undefined));
};

const integerOf = (arm: PortableBuildArm, text: string): number | bigint | undefined => {
	const value = arm.digits === undefined ? undefined : integerValue(arm.digits.base, arm.digits.affix, text);
	return value === undefined || arm.scalar === 'bigint' || value > BigInt(Number.MAX_SAFE_INTEGER) ? value : Number(value);
};

const floatOf = (text: string): number | undefined => {
	const digits = text.replace(/(?<=\d)_(?=\d)/g, '');
	if (!/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(digits)) return undefined;
	const value = Number(digits);
	return Number.isFinite(value) ? value : undefined;
};

export function portableReader({ table, classify, factsOf, flagHolds, flagsOf, textOf, slotsOf, readSlots, otherTested }: PortableReadContext): (value: unknown, carried?: PortableCarried) => unknown {
	interface Read {
		readonly keys: Set<string>;
		path?: string;
		flags?: readonly string[];
		extra?: string;
	}
	const frames: Map<object, Read>[] = [];
	const touched = new Map<object, Set<string>>();
	const touch = (node: object): Read => {
		const frame = frames.at(-1)!;
		return frame.get(node) ?? frame.set(node, { keys: new Set() }).get(node)!;
	};
	const accessed = (node: object, key: string, stored?: string): unknown => {
		if (frames.length > 0) touch(node).keys.add(key);
		(touched.get(node) ?? touched.set(node, new Set()).get(node)!).add(key);
		if (stored !== undefined) return storedSlotRead(node, key, stored);
		const read = slotReader(node, key);
		return typeof read === 'function' ? (read as () => unknown).call(node) : read;
	};
	const walk = (value: unknown, hops: readonly Hop[]): unknown => {
		if (Array.isArray(value)) return value.flatMap((item) => [walk(item, hops) ?? []].flat());
		let at = value;
		for (let i = 0; i < hops.length; i++) {
			if (Array.isArray(at)) return walk(at, hops.slice(i));
			if (!hasKind(at)) return undefined;
			const next = accessed(at, hops[i]!.key, hops[i]!.stored);
			if (next === undefined || next === null) return undefined;
			if (Array.isArray(next) && hops[i]!.builds !== undefined) i++;
			at = next;
		}
		return at;
	};
	interface Pending {
		readonly seat: PortableSeat;
		readonly containers: readonly PortableContainer[];
	}
	const held = new WeakMap<object, readonly { readonly slot: PortableSlotRoute; readonly value: unknown }[]>();
	const enclosing = new WeakMap<object, Node>();
	const containing = containerSlots(table);
	const containerSet = new WeakMap<object, readonly string[]>();
	const heldBy = (container: Node, element: unknown, slots: readonly PortableSlotRoute[]): void => {
		if (slots.length === 0 || element === null || typeof element !== 'object' || Array.isArray(element)) return;
		const values = [...new Map(slots.map((slot) => [slot.name, slot])).values()].flatMap((slot) => {
			const found = routeValue(container, slot);
			return found === undefined || found.value === null ? [] : [{ slot: slot, value: found.value }];
		});
		if (values.length > 0) held.set(element, [...(held.get(element) ?? []), ...values]);
	};
	const holds = (seat: PortableSeat, value: unknown): boolean =>
		fits(seat, value) && !(hasKind(value) && seat.refined?.includes(value.$type) === true && classify(value) === undefined);
	const resolve = (value: unknown, pending: readonly Pending[]): { readonly found: unknown; readonly many: boolean } | undefined => {
		if (Array.isArray(value)) {
			const parts = value.map((item) => resolve(item, pending) ?? { found: item, many: false });
			return { found: parts.flatMap((part) => [part.found].flat()), many: parts.some((part) => part.many) };
		}
		for (const { seat, containers } of pending) if (containers.length === 0 && holds(seat, value)) return { found: value, many: seat.many === true };
		if (!hasKind(value)) return undefined;
		const keys = [...new Set(pending.flatMap(({ containers }) => (containers.length === 0 ? [] : [containers[0]!.key])))];
		let empty = false;
		let vacant = false;
		for (const key of keys) {
			const next = accessed(value, key);
			if (next === undefined || next === null) {
				empty ||= pending.some(({ seat, containers }) => seat.many === true && containers[0]?.key === key);
				vacant ||= key in value;
				continue;
			}
			const advanced = pending.flatMap(({ seat, containers }) => {
				if (containers[0]?.key !== key) return [];
				const rest = containers.slice(1);
				return Array.isArray(next) && rest[0]?.builder !== undefined ? [{ seat, containers: rest }, { seat, containers: rest.slice(1) }] : [{ seat, containers: rest }];
			});
			const result = resolve(next, advanced);
			if (result === undefined) continue;
			if (!Array.isArray(next)) heldBy(value as Node, result.found, pending.flatMap(({ containers }) => (containers[0]?.key === key ? (containers[0].slots ?? []) : [])));
			if (!Array.isArray(next) && hasKind(result.found)) {
				enclosing.set(result.found, value as Node);
				const found = result.found;
				const sets = pending.flatMap(({ containers }) => (containers[0]?.key === key && containers[0].sets?.kind === value.$type ? setsOn(containers[0], found.$type) : []));
				if (sets.length > 0) containerSet.set(result.found, [...new Set(sets)]);
			}
			return Array.isArray(next) ? { ...result, many: true } : result;
		}
		return empty ? { found: [], many: true } : vacant ? { found: undefined, many: false } : undefined;
	};
	const chainOf = (seat: PortableSeat): readonly PortableContainer[] => (seat.within ?? []).flatMap((container): PortableContainer[] => [...(container.through ?? []).map((key) => ({ key })), container]);
	const seatedIn = (slotted: unknown, slot: PortableSlotRoute): { readonly found: unknown; readonly many: boolean; readonly fitted?: false } =>
		resolve(
			slotted,
			slot.seats.flatMap((seat) => {
				const within = chainOf(seat);
				return within[0]?.builder === undefined ? [{ seat, containers: within }] : [{ seat, containers: within }, { seat, containers: within.slice(1) }];
			})
		) ?? { found: slotted, many: false, fitted: false };
	const unwrapping = new Map<number, readonly Pending[]>();
	const unwrapOf = (kind: number): readonly Pending[] => {
		const known = unwrapping.get(kind);
		if (known !== undefined) return known;
		const seats = [...new Set((containing.get(kind) ?? []).flatMap((slot) => slot.seats))];
		const pending = seats.flatMap((seat) => chainOf(seat).map((_, i, chain) => ({ seat, containers: chain.slice(i) })));
		unwrapping.set(kind, pending);
		return pending;
	};
	const routeValue = (node: Node, slot: PortableSlotRoute): { readonly value: unknown; readonly fitted: boolean; readonly extra?: string } | undefined => {
		const kept = (item: unknown): boolean => slot.reads === undefined || slot.reads.includes(kindOfValue(item) ?? -1);
		const walked = walk(node, stepHops(slot.steps));
		const slotted = Array.isArray(walked) ? walked.filter(kept) : kept(walked) ? walked : undefined;
		if (slot.emptyContainer === true && Array.isArray(slotted) && slotted.length === 0) return { value: [], fitted: true };
		if (!present(slotted)) return undefined;
		const { found, many, fitted } = seatedIn(slotted, slot);
		if (found === undefined) return undefined;
		if (slot.list === false && Array.isArray(found)) {
			if (found.length === 0) return undefined;
			const extra = found.length > 1 ? slot.steps.at(-1)?.key : undefined;
			return { value: found[0], fitted: fitted !== false, ...(extra === undefined ? {} : { extra }) };
		}
		const listed = slot.list ?? slot.multiple;
		const value = !Array.isArray(found) ? (listed ? [found] : found) : found.length === 0 || listed || many ? found : found[0];
		return { value, fitted: fitted !== false };
	};
	const slotValue = (node: Node, slot: PortableSlotRoute): unknown => routeValue(node, slot)?.value;
	const slotText = (node: Node, key: string): string | undefined => textOf(accessed(node, key));
	const decimalOf = (node: Node, parts: PortableDecimalParts): number | undefined => {
		const part = (key: string | undefined): string | undefined => (key === undefined ? undefined : slotText(node, key));
		const [integer, fraction, exponent, sign] = [part(parts.integer), part(parts.fraction), part(parts.exponent), part(parts.exponentSign)];
		return floatOf(`${integer ?? '0'}.${fraction ?? '0'}${exponent === undefined ? '' : `e${sign ?? ''}${exponent}`}`);
	};
	const slotsText = (node: Node, keys: readonly string[]): string | undefined => {
		const texts = keys.map((key) => slotText(node, key));
		return texts.every((text) => text !== undefined) ? texts.join('') : undefined;
	};
	const scalarOf = (node: Node, arm: PortableBuildArm): number | bigint | undefined => {
		const { numeric } = arm;
		if (numeric !== undefined && !isNumberSlots(numeric)) return decimalOf(node, numeric);
		const text = numeric === undefined ? textOf(node) : slotsText(node, numeric);
		if (text === undefined) return undefined;
		return arm.scalar === 'float' ? floatOf(text) : integerOf(arm, text);
	};
	const armsAt = (path: string, kind: number): readonly PortableBuildArm[] => (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === kind);
	const canonicalOf = (token: unknown, facet: string, text: string): string => (hasKind(token) ? spelledMember(text, table.delimiters?.[token.$type]?.spellings?.[facet]) : text);
	const contradicts = (node: Node, preset: PortablePreset): boolean => {
		if ((preset.text === undefined && preset.kind === undefined) || preset.steps.at(-1)?.mounted !== undefined) return false;
		const held = walk(node, stepHops(preset.steps));
		if (held === undefined || Array.isArray(held)) return false;
		if (preset.text !== undefined) {
			const text = textOf(held);
			if (text === undefined) return false;
			const slot = canonicalOf(walk(node, stepHops(preset.steps.slice(0, -1))), preset.steps.at(-1)!.key, text);
			return !(preset.among ?? [preset.text]).includes(slot);
		}
		const kind = kindOfValue(held);
		return kind !== undefined && kind !== preset.kind;
	};
	const rebuilds = (kind: number, text: string, seats: readonly PortableSeat[] | undefined): boolean => {
		if (seats === undefined || tokenText(kind, seats) !== undefined) return true;
		const leaf = leafSeatOf(text, seats);
		return leaf === undefined ? seats.some((seat) => seat.text === true) : (leaf.texts ?? []).includes(kind);
	};
	const spelledAs = (kind: number, path: string | undefined, arms: readonly PortableBuildArm[], text: string, seats: readonly PortableSeat[] | undefined): unknown =>
		rebuilds(kind, text, seats) ? text : path !== undefined && arms.length > 0 && arms.every((arm) => textBuilt(table, arm)) ? { $path: path, $value: text } : undefined;
	const facetText = (token: object, facet: string): string | undefined => {
		const held = accessed(token, facet);
		return typeof held === 'string' ? held : textOf(held);
	};
	const readOnlyHolders = new Map<number, boolean>();
	const readOnlySpelled = (node: Node): boolean => {
		if (table.delimiters === undefined || readOnlyHolders.get(node.$type) === false) return false;
		const tokens = slotsOf(node).flatMap(([, items]) => items.flatMap((item) => (hasKind(item) && table.delimiters?.[item.$type]?.readOnly !== undefined ? [item] : [])));
		readOnlyHolders.set(node.$type, tokens.length > 0);
		return tokens.some((token) =>
			Object.entries(table.delimiters?.[token.$type]?.readOnly ?? {}).some(([facet, slots]) => {
				const text = facetText(token, facet);
				return text !== undefined && slots.includes(canonicalOf(token, facet, text));
			})
		);
	};
	const closerTexts = (node: Node, slots: readonly PortableSlotRoute[]): readonly { readonly slot: string; readonly route: PortableSlotRoute; readonly reads: number; readonly text: string }[] =>
		slotsOf(node).flatMap(([slot, items]) =>
			items.flatMap((item) => {
				const content = hasKind(item) ? table.delimiters?.[item.$type]?.content : undefined;
				if (content === undefined) return [];
				const text = facetText(item as object, content.facet);
				const route = slots.find((candidate) => candidate.seats.some((seat) => seat.kinds.includes(content.reads)));
				return text === undefined || text === '' || route === undefined ? [] : [{ slot, route, reads: content.reads, text }];
			})
		);
	const closerContent = (node: Node, arms: readonly PortableBuildArm[], structure: Record<string, unknown>): void => {
		for (const { slot, route, reads, text } of closerTexts(node, arms.flatMap(readRoutesOf))) {
			const path = classify(reads);
			const read = spelledAs(reads, path, path === undefined ? [] : armsAt(path, reads), text, route.seats);
			if (read === undefined) continue;
			accessed(node, slot);
			const held = structure[route.name];
			structure[route.name] = Array.isArray(held) ? [...held, read] : held === undefined ? [read] : [held, read];
		}
	};
	const read = (value: unknown, carried: PortableCarried | undefined, seats?: readonly PortableSeat[]): unknown => {
		if (Array.isArray(value)) return value.map((item) => read(item, carried, seats));
		if (!hasKind(value)) return readValue(value, carried, seats);
		if (erred(value)) return kept(value, { reason: 'error' }, carried);
		frames.push(new Map());
		try {
			const result = readValue(value, carried, seats);
			if (typeof result !== 'object' || result === null || !('$path' in result) || '$value' in result) return result;
			const carry = unreadIn(frames.at(-1)!);
			return carry === undefined ? result : kept(value, carry, carried);
		} finally {
			frames.pop();
		}
	};
	const readValue = (value: unknown, carried: PortableCarried | undefined, seats?: readonly PortableSeat[]): unknown => {
		const kind = kindOfValue(value);
		if (kind === undefined) return value;
		if (typeof value !== 'number' && (opaque(value) || (table.tokens?.[kind] ?? []).some((accessor) => slotItems(value as object, accessor).some(opaque))))
			return kept(value as Node, { reason: 'opaque' }, carried);
		if (typeof value !== 'number' && readOnlySpelled(value as Node)) return kept(value as Node, { reason: 'readOnly' }, carried);
		const container = typeof value === 'number' ? undefined : enclosing.get(value as Node);
		const placed = container === undefined ? [] : factsOf(value as Node, container);
		const path = placed.find(({ fact }) => fact.path !== undefined)?.fact.path ?? classify(typeof value === 'number' ? value : (value as Node));
		const claimed = path === undefined ? [] : armsAt(path, kind);
		if (path === undefined || claimed.length === 0) {
			const unwrap = typeof value === 'number' || seats !== undefined ? [] : unwrapOf(kind);
			const element = unwrap.length === 0 ? undefined : resolve(value, unwrap);
			if (element !== undefined && !element.many && kindOfValue(element.found) !== undefined) return read(element.found, carried, [...new Set(unwrap.map(({ seat }) => seat))]);
			const content = typeof value === 'number' ? undefined : seats?.find((seat) => seat.contents?.[kind] !== undefined)?.contents?.[kind];
			const spelled = content === undefined ? undefined : textOf(accessed(value as object, content));
			const own = typeof value === 'number' || seats === undefined ? undefined : nodeText(value);
			const rebuilt = own !== undefined && rebuilds(kind, own, seats) ? own : undefined;
			return tokenText(kind, seats) ?? spelled ?? rebuilt ?? (typeof value === 'number' ? value : kept(value as Node, { reason: 'unclaimed' }, carried));
		}
		const arms = typeof value === 'number' ? claimed : claimed.filter((arm) => !arm.presets.some((preset) => contradicts(value as Node, preset)));
		if (arms.length === 0) return kept(value as Node, { reason: 'preset' }, carried);
		const literal = arms.find((arm) => arm.literal !== undefined)?.literal;
		if (literal !== undefined) return literal.value === undefined ? { $path: path } : { $path: path, $value: literal.value };
		if (typeof value === 'number') return tokenText(value, seats) ?? value;
		const node = value as Node;
		const scalar = arms.flatMap((arm) => {
			if (arm.scalar === undefined) return [];
			const read = scalarOf(node, arm);
			return read === undefined ? [] : [{ arm, value: read }];
		})[0];
		if (scalar === undefined && arms.some((arm) => arm.scalar !== undefined)) return kept(node, { reason: 'scalar' }, carried);
		const beside = scalar === undefined ? [] : scalar.arm.slots;
		if (scalar !== undefined && !beside.some((slot) => present(slotValue(node, slot)))) return { $path: path, $value: scalar.value };
		if (scalar === undefined) {
			const content = arms.find((arm) => arm.content !== undefined)?.content;
			if (content !== undefined) {
				const found = routeValue(node, content)?.value;
				const closers = closerTexts(node, [content]);
				for (const { slot } of closers) accessed(node, slot);
				const texts = [...(found === undefined ? [] : Array.isArray(found) ? found.map(textOf) : [textOf(found)]), ...closers.map(({ text }) => text)];
				const spelled = texts.every((text) => text !== undefined) ? texts.join('') : undefined;
				return spelled === undefined ? kept(node, { reason: 'text' }, carried) : { $path: path, $value: spelled };
			}
			const textAt = (text: string | undefined): unknown => (text === undefined ? undefined : spelledAs(kind, path, arms, text, seats)) ?? kept(node, { reason: 'text' }, carried);
			const text = nodeText(node);
			if (text !== undefined) return textAt(text);
			if (arms.every((arm) => (readRoutesOf(arm).length === 0 && arm.seated !== undefined) || textBuilt(table, arm))) return textAt(textOf(node));
		}
		const readArms = scalar === undefined ? arms : [scalar.arm];
		const buildable = new Set(readArms.flatMap(builtFlags));
		const spelled = placed.flatMap(({ fact }) => fact.flag ?? []);
		const unbuilt = [...new Set([...flagsOf(kind).filter((flag) => flagHolds(node, flag)), ...spelled])].filter((flag) => !buildable.has(flag));
		if (unbuilt.length > 0) return kept(node, { reason: 'flags', flags: unbuilt }, carried);
		const flags = [...new Set([...[...buildable].filter((flag) => flagHolds(node, flag) || spelled.includes(flag)), ...(containerSet.get(node) ?? [])])];
		Object.assign(touch(node), { path, flags });
		const at = Object.fromEntries(placed.map(({ fact, index, spelling }) => [fact.name, spelling === undefined ? { index } : { index, spelling }]));
		const structure: Record<string, unknown> = { $path: path, ...(flags.length === 0 ? {} : { $flags: flags }), ...(placed.length === 0 ? {} : { $at: at }), ...(scalar === undefined ? {} : { $value: scalar.value }) };
		type Chosen = { readonly value: unknown; readonly route: PortableSlotRoute; readonly fitted: boolean; readonly extra?: string };
		const candidates = new Map<string, Chosen[]>();
		for (const arm of readArms)
			for (const route of readRoutesOf(arm)) {
				const found = routeValue(node, route);
				if (found === undefined || found.value === null) continue;
				const list = candidates.get(route.name) ?? candidates.set(route.name, []).get(route.name)!;
				list.push({ value: found.value, route, fitted: found.fitted, ...(found.extra === undefined ? {} : { extra: found.extra }) });
			}
		for (const list of candidates.values()) list.sort((a, b) => Number(b.fitted) - Number(a.fitted) || (a.fitted ? b.route.steps.length - a.route.steps.length : 0));
		const met = (slot: PortableSlotRoute, names: ReadonlySet<string>): boolean => (slot.requires ?? []).every((group) => group.some((name) => names.has(name)));
		let chosen = new Map<string, Chosen>();
		for (let names: ReadonlySet<string> = new Set(candidates.keys()); ; ) {
			chosen = new Map([...candidates].flatMap(([name, list]) => {
				const pick = list.find((candidate) => met(candidate.route, names));
				return pick === undefined ? [] : [[name, pick] as const];
			}));
			if (chosen.size === names.size) break;
			names = new Set(chosen.keys());
		}
		for (const name of new Set(readArms.flatMap((arm) => readRoutesOf(arm).map((slot) => slot.name)))) {
			const pick = chosen.get(name);
			if (pick === undefined) continue;
			if (pick.extra !== undefined) touch(node).extra ??= pick.extra;
			structure[name] = read(pick.value, carried, pick.route.seats);
		}
		const taken = (slot: PortableSlotRoute, items: unknown): unknown => {
			const indices = new Set(placed.flatMap(({ fact, index }) => (fact.slot === slot.name ? [index] : [])));
			return indices.size === 0 || !Array.isArray(items) ? items : items.filter((_, i) => !indices.has(i));
		};
		for (const { slot: route, value } of held.get(node) ?? []) if (!(route.name in structure)) structure[route.name] = read(taken(route, value), carried, route.seats);
		for (const route of readArms.flatMap(readRoutesOf)) if ((route.list ?? route.multiple) && route.emptyContainer !== true && !(route.name in structure)) structure[route.name] = [];
		for (const test of readArms.flatMap((arm) => arm.when)) if ('empty' in test) for (const name of test.empty) if (!(name in structure)) structure[name] = [];
		closerContent(node, readArms, structure);
		for (const flag of flags) {
			const template = readArms.map((arm) => arm.flags[flag]?.template).find((found) => found !== undefined);
			const text = template === undefined ? undefined : structure[template.slot];
			if (template === undefined || typeof text !== 'string') continue;
			const groups = new RegExp(template.match, 'u').exec(text)?.groups;
			if (groups === undefined) throw new Error(`portable read: ${path}'s ${template.slot} ${JSON.stringify(text)} spells no ${flag}`);
			for (const hole of template.holes) structure[hole] = groups[hole];
		}
		return structure;
	};
	const meaningfulText = (item: Node): string => {
		const facets = table.delimiters?.[item.$type]?.meaning;
		if (facets === undefined) return textOf(item) ?? '';
		return facets.map((facet) => {
			const held = (item as unknown as Record<string, unknown>)[facet];
			const value = typeof held === 'function' ? (held as () => unknown).call(item) : held;
			return typeof value === 'string' ? value : (textOf(value) ?? '');
		}).join('');
	};
	const unreadIn = (frame: ReadonlyMap<object, Read>): PortableCarry | undefined => {
		for (const [node, { path, flags, extra }] of frame) {
			if (erred(node as Node)) return { reason: 'error' };
			if (extra !== undefined) return { reason: 'unread', slot: extra };
			const keys = touched.get(node) ?? new Set<string>();
			const tested = path === undefined ? new Set<string>() : readSlots(node as Node, path, flags ?? []);
			const meaning = path === undefined ? new Set<string>() : otherTested(node as Node, path);
			for (const [slot, items] of slotsOf(node as Node)) {
				if (keys.has(slot) || tested.has(slot)) continue;
				const lost = items.some((item) => (hasKind(item) ? meaningfulText(item) !== '' : typeof item === 'number' && meaning.has(slot)));
				if (lost) return { reason: 'unread', slot };
			}
		}
		return undefined;
	};
	return (value, carried) => {
		touched.clear();
		try {
			return read(value, carried);
		} finally {
			touched.clear();
		}
	};
}

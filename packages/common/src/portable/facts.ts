import type { PortableBuildArm, PortableBuildTable, PortableCondition, PortableContainer, PortableSlotRoute, PortableReadEntry, PortableSeat } from '@sittir/types';

export function portablePathHasFacts(path: string, read: string | undefined): boolean {
	if (read === undefined) return false;
	const facts = path.split('.');
	const segments = read.split('.');
	const kind = Math.min(2, facts.length);
	for (let i = 0; i < kind; i++) if (facts[i] !== segments[i]) return false;
	let at = kind;
	for (let i = kind; i < segments.length && at < facts.length; i++) if (segments[i] === facts[at]) at++;
	return at === facts.length;
}

type Placement = Pick<PortableReadEntry, 'path'> & { readonly within: readonly unknown[]; readonly test: readonly Pick<PortableCondition, 'up'>[] };

export const unplaced = (entry: Placement): boolean => entry.within.length === 0 && entry.test.every((condition) => condition.up === 0);

export function readableEntries<E extends Placement>(entries: readonly E[]): readonly E[] {
	const candidates = entries.filter(unplaced);
	const always = (entry: E): boolean => entry.test.length === 0;
	const refines = (by: E, entry: E): boolean => by.path !== entry.path && portablePathHasFacts(entry.path, by.path);
	const readable: E[] = [];
	for (const entry of candidates) {
		if (candidates.some((other) => always(other) && refines(other, entry))) continue;
		readable.push(entry);
		if (always(entry) && !candidates.some((other) => refines(other, entry))) break;
	}
	return readable;
}

export const textBuilt = (table: Pick<PortableBuildTable, 'builders'>, arm: Pick<PortableBuildArm, 'slots' | 'builder'>): boolean =>
	arm.slots.length === 0 && arm.builder !== undefined && table.builders[arm.builder] === 'text';

export const builtSlots = (arm: Pick<PortableBuildArm, 'slots' | 'content'>): readonly PortableSlotRoute[] => (arm.content === undefined ? arm.slots : [...arm.slots, arm.content]);

export const takesTextValue = (table: PortableBuildTable, arm: PortableBuildArm): boolean => arm.content !== undefined || textBuilt(table, arm);

export const nullaryBuilt = (table: PortableBuildTable, arm: PortableBuildArm): boolean =>
	arm.slots.length === 0 && arm.builder !== undefined && table.builders[arm.builder] === 'nullary';

export const builtFlags = (arm: PortableBuildArm): readonly string[] => [
	...Object.keys(arm.flags),
	...arm.when.flatMap((test) => ('flag' in test ? [test.flag] : [])),
	...(arm.facts ?? []).flatMap((fact) => fact.flag ?? [])
];

export const setsOn = (container: PortableContainer, kind: number): readonly string[] =>
	container.sets === undefined || (container.sets.elements !== undefined && !container.sets.elements.includes(kind)) ? [] : container.sets.flags;

export const seatSets = (seat: PortableSeat, kind: number): readonly string[] => (seat.within ?? []).flatMap((container) => setsOn(container, kind));

export const tableSlots = (table: PortableBuildTable): readonly PortableSlotRoute[] => {
	const out: PortableSlotRoute[] = [];
	const visit = (slot: PortableSlotRoute): void => {
		out.push(slot);
		for (const seat of slot.seats) for (const container of seat.within ?? []) (container.slots ?? []).forEach(visit);
	};
	for (const { arms } of Object.values(table.paths)) for (const arm of arms) builtSlots(arm).forEach(visit);
	return out;
};

export const tableSeats = (table: PortableBuildTable): readonly PortableSeat[] => tableSlots(table).flatMap((slot) => slot.seats);

export const containerSetFlags = (table: PortableBuildTable): ReadonlyMap<number, ReadonlySet<string>> => {
	const out = new Map<number, Set<string>>();
	for (const seat of tableSeats(table)) for (const kind of seat.kinds) for (const flag of seatSets(seat, kind)) (out.get(kind) ?? out.set(kind, new Set()).get(kind)!).add(flag);
	return out;
};

export const containerSlots = (table: PortableBuildTable): ReadonlyMap<number, readonly PortableSlotRoute[]> => {
	const out = new Map<number, Set<PortableSlotRoute>>();
	for (const slot of tableSlots(table))
		for (const seat of slot.seats) if (seat.many !== true && (seat.within ?? []).length > 0) (out.get(seat.at[0]) ?? out.set(seat.at[0], new Set()).get(seat.at[0])!).add(slot);
	return new Map([...out].map(([kind, slots]) => [kind, [...slots]]));
};

export const isNumberSlots = (numeric: PortableBuildArm['numeric']): numeric is readonly string[] => Array.isArray(numeric);

const tokenTexts = new WeakMap<PortableSeat, ReadonlyMap<number, string>>();

export function tokenText(kind: number, seats: readonly PortableSeat[] | undefined): string | undefined {
	for (const seat of seats ?? []) {
		if (seat.tokens === undefined) continue;
		let texts = tokenTexts.get(seat);
		if (texts === undefined) tokenTexts.set(seat, (texts = new Map(Object.entries(seat.tokens).map(([text, id]) => [id, text]))));
		const text = texts.get(kind);
		if (text !== undefined) return text;
	}
	return undefined;
}

export function tokenKind(text: string, seats: readonly PortableSeat[]): number | undefined {
	for (const seat of seats) {
		if (seat.tokens !== undefined && Object.hasOwn(seat.tokens, text)) return seat.tokens[text];
	}
	return undefined;
}

const patterns = new WeakMap<NonNullable<PortableSeat['pattern']>, RegExp>();

export const spells = (seat: PortableSeat, text: string): boolean => {
	if (seat.pattern === undefined) return true;
	const regex = patterns.get(seat.pattern) ?? patterns.set(seat.pattern, new RegExp(seat.pattern.source, seat.pattern.flags)).get(seat.pattern)!;
	return regex.test(text);
};

export const leafSeatOf = (text: string, seats: readonly PortableSeat[]): PortableSeat | undefined =>
	seats.find((seat) => seat.leaf !== undefined && spells(seat, text)) ?? seats.find((seat) => seat.leaf !== undefined);

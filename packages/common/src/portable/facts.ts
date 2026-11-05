import type { PortableBuildArm, PortableBuildTable, PortableCondition, PortableReadEntry, PortableSeat } from '@sittir/types';

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

export const textBuilt = (table: PortableBuildTable, arm: PortableBuildArm): boolean =>
	arm.members.length === 0 && arm.builder !== undefined && table.builders[arm.builder] === 'text';

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
		const kind = seat.tokens?.[text];
		if (kind !== undefined) return kind;
	}
	return undefined;
}

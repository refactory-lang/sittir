import type { PortableSpelledFact, PortableSpelling } from '@sittir/types';
import { emitShapeFailure } from '../../../compiler/diagnostics/emit-diagnostics.ts';
import type { SlotModel } from '../../../bindings/facts.ts';
import { camel } from '../../../bindings/names.ts';
import { shownSlots, slotFor, type GrammarRoutes, type ReadEntry } from '../../../bindings/routes.ts';
import type { Body } from '../../render-body.ts';
import type { PortableFactRecord } from './read-tests.ts';

interface Spelled {
	readonly kind: string;
	readonly slots: Map<string, string | Spelled>;
	value?: string;
}

const WORD = /[\p{L}\p{N}_]/u;

function spelledText(spelled: Spelled, bodies: ReadonlyMap<string, Body>, refuse: (why: string) => never): string {
	if (spelled.slots.size === 0) return spelled.value ?? refuse(`its item ${spelled.kind} states neither a text nor a slot`);
	const body = bodies.get(spelled.kind) ?? refuse(`${spelled.kind}, a kind its item holds, has no render body`);
	const parts: string[] = [];
	const placed = new Set<string>();
	for (const part of body) {
		if (part.kind === 'seam') continue;
		if (part.kind === 'text') parts.push(part.text);
		else if (part.kind === 'slot') {
			const value = spelled.slots.get(part.name);
			if (value === undefined) continue;
			placed.add(part.name);
			parts.push(typeof value === 'string' ? value : spelledText(value, bodies, refuse));
		} else refuse(`${spelled.kind}'s render body has a ${part.kind} part, which spells no one text`);
	}
	const unplaced = [...spelled.slots.keys()].filter((name) => !placed.has(name));
	if (unplaced.length > 0) refuse(`${spelled.kind}'s render body places no ${unplaced.join(', ')}`);
	const written = parts.filter((part) => part !== '');
	for (let i = 1; i < written.length; i++)
		if (WORD.test(written[i - 1]!.at(-1)!) && WORD.test(written[i]![0]!)) refuse(`${spelled.kind} spells ${JSON.stringify(written[i - 1])} and ${JSON.stringify(written[i])} with no gap between them`);
	return written.join('');
}

export function portableSpellingOf(entry: ReadEntry, model: SlotModel, routes: GrammarRoutes, bodies: ReadonlyMap<string, Body>): PortableSpelling {
	const refuse = (why: string): never => {
		throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', ownerKind: entry.kind, message: `${entry.kind} as ${entry.vocab} is a fact its container spells, but ${why}`, details: { vocab: entry.vocab } });
	};
	const vocabOf = (kind: string): string => routes.vocabOf.get(kind) ?? refuse(`${kind}, a kind its item holds, reads as no path`);
	const slotNameOf = (holder: string, slot: string): string => {
		const plain = routes.readEntries.get(holder)?.find((other) => other.vocab === routes.vocabOf.get(holder));
		const route = plain?.slots.find((candidate) => candidate.route === 'slot' && candidate.path.at(-1)?.owner === holder && candidate.path.at(-1)?.slot === slot);
		return route?.name ?? refuse(`${holder}'s ${slot}, a slot its item spells, is no slot of ${holder}'s path`);
	};
	const placed = entry.claim.predicates.filter((predicate) => predicate.subject?.up === 1);
	const [held, element] = placed[0]?.subject?.down ?? [];
	const wrapper = held?.kind ?? refuse('its tests name no kind of item');
	const through = !routes.vocabOf.has(wrapper) && element?.kind != null;
	const itemKind = through ? element!.kind! : wrapper;
	const reached = through ? 2 : 1;
	const item: Record<string, unknown> = { $path: vocabOf(itemKind) };
	const spelled: Spelled = { kind: itemKind, slots: new Map() };
	const holes: Record<string, string[]> = {};
	for (const predicate of placed) {
		const steps = predicate.subject!.down;
		if (steps[0]?.kind !== wrapper || (through && steps[1]?.kind !== itemKind)) refuse('its tests reach more than one kind of item');
		const down = steps.slice(reached);
		const [argument] = predicate.arguments;
		if (predicate.operator !== 'eq' || argument === undefined || predicate.arguments.length > 1) refuse(`#${predicate.operator}? spells no text`);
		if (down.length === 0) {
			const text = 'text' in argument! ? argument.text : refuse("its item's own text is a capture");
			item.$value = text;
			spelled.value = text;
			continue;
		}
		let into = item;
		let at = spelled;
		let holder = itemKind;
		const keys: string[] = [];
		down.forEach((selector, i) => {
			const slot = slotFor(model, shownSlots(model, holder), selector) ?? refuse(`no slot of ${holder} holds what it tests`);
			const key = slotNameOf(holder, slot.name);
			keys.push(key);
			if (i < down.length - 1) {
				const next = selector.kind ?? (slot.kinds.length === 1 ? slot.kinds[0]! : refuse(`${holder}'s ${slot.name} holds more than one kind`));
				into = (into[key] ??= { $path: vocabOf(next) }) as Record<string, unknown>;
				const held = at.slots.get(slot.name);
				const nested: Spelled = typeof held === 'object' ? held : { kind: next, slots: new Map() };
				at.slots.set(slot.name, nested);
				at = nested;
				holder = next;
			} else if ('text' in argument!) {
				into[key] = argument.text;
				at.slots.set(slot.name, argument.text);
			} else holes[camel(argument!.capture)] = keys;
		});
	}
	return Object.keys(holes).length === 0 ? { item: item as PortableSpelling['item'], text: spelledText(spelled, bodies, refuse) } : { item: item as PortableSpelling['item'], holes };
}

export function portableSpelledFactOf(fact: PortableFactRecord, entries: readonly ReadEntry[], model: SlotModel, routes: GrammarRoutes, bodies: ReadonlyMap<string, Body>): PortableSpelledFact {
	return { name: fact.name, ...(fact.flag === undefined ? {} : { flag: fact.flag }), slot: fact.slot, spellings: entries.map((entry) => portableSpellingOf(entry, model, routes, bodies)) };
}

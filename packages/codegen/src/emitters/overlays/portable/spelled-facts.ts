import type { PortableSpelledFact, PortableSpelling } from '@sittir/types';
import { emitShapeFailure } from '../../../compiler/diagnostics/emit-diagnostics.ts';
import type { SlotModel } from '../../../bindings/facts.ts';
import { camel } from '../../../bindings/names.ts';
import { shownSlots, slotFor, type GrammarRoutes, type ReadEntry } from '../../../bindings/routes.ts';
import type { PortableFactRecord } from './read-tests.ts';

export function portableSpellingOf(entry: ReadEntry, model: SlotModel, routes: GrammarRoutes): PortableSpelling {
	const refuse = (why: string): never => {
		throw emitShapeFailure({ code: 'portable-vocabulary-mismatch', ownerKind: entry.kind, message: `${entry.kind} as ${entry.vocab} is a fact its container spells, but ${why}`, details: { vocab: entry.vocab } });
	};
	const vocabOf = (kind: string): string => routes.vocabOf.get(kind) ?? refuse(`${kind}, a kind its item holds, reads as no path`);
	const memberOf = (holder: string, slot: string): string => {
		const plain = routes.readEntries.get(holder)?.find((other) => other.vocab === routes.vocabOf.get(holder));
		const route = plain?.members.find((member) => member.route === 'slot' && member.path.at(-1)?.owner === holder && member.path.at(-1)?.slot === slot);
		return route?.name ?? refuse(`${holder}'s ${slot}, a slot its item spells, is no member of ${holder}'s path`);
	};
	const placed = entry.claim.predicates.filter((predicate) => predicate.subject?.up === 1);
	const itemKind = placed[0]?.subject?.down[0]?.kind ?? refuse('its tests name no kind of item');
	const item: Record<string, unknown> = { $path: vocabOf(itemKind) };
	const holes: Record<string, string[]> = {};
	for (const predicate of placed) {
		const [first, ...down] = predicate.subject!.down;
		if (first?.kind !== itemKind) refuse('its tests reach more than one kind of item');
		const [argument] = predicate.arguments;
		if (predicate.operator !== 'eq' || argument === undefined || predicate.arguments.length > 1) refuse(`#${predicate.operator}? spells no text`);
		let into = item;
		let holder = itemKind;
		const keys: string[] = [];
		down.forEach((selector, i) => {
			const slot = slotFor(model, shownSlots(model, holder), selector) ?? refuse(`no slot of ${holder} holds what it tests`);
			const member = memberOf(holder, slot.name);
			keys.push(member);
			if (i < down.length - 1) {
				const next = selector.kind ?? (slot.kinds.length === 1 ? slot.kinds[0]! : refuse(`${holder}'s ${slot.name} holds more than one kind`));
				into = (into[member] ??= { $path: vocabOf(next) }) as Record<string, unknown>;
				holder = next;
			} else if ('text' in argument!) into[member] = argument.text;
			else holes[camel(argument!.capture)] = keys;
		});
	}
	return Object.keys(holes).length === 0 ? { item: item as PortableSpelling['item'] } : { item: item as PortableSpelling['item'], holes };
}

export function portableSpelledFactOf(fact: PortableFactRecord, entries: readonly ReadEntry[], model: SlotModel, routes: GrammarRoutes): PortableSpelledFact {
	return { name: fact.name, ...(fact.flag === undefined ? {} : { flag: fact.flag }), member: fact.member, spellings: entries.map((entry) => portableSpellingOf(entry, model, routes)) };
}

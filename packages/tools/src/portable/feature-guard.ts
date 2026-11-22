import { byCodepoint, camel, compositionOf, declaredFlags, derive, envelopeTargets, lineageOf, readVocabulary, readVocabularySource, resolveRoutes, VOCABULARY_DIR } from '@sittir/codegen/bindings';
import type { GrammarName } from '@sittir/codegen/grammars';
import { loadInputs } from '../inventory/index.ts';
import { plan, under, type Plan } from '../vocabulary/plan.ts';

export interface GuardRow {
	readonly feature: string;
	readonly path: string;
	readonly slot?: string;
	readonly side: 'claimed-not-composed' | 'composed-not-claimed';
}

export interface Held {
	readonly paths: ReadonlySet<string>;
	readonly slots: ReadonlySet<string>;
}

const slotKey = (path: string, slot: string): string => `${path}.${slot}`;

export const UNHELD_SLOTS: readonly string[] = [
	'declaration.member.property.definite',
	'declaration.member.property.optionality',
	'declaration.type_parameter.parameters.bounds',
	'declaration.type_parameter.value.bounds',
	'declaration.type_parameter.variadic.bounds'
];

export const holdsPath = (held: Held, path: string): boolean => [...held.paths].some((claimed) => under(claimed, path));

export const holdsSlot = (held: Held, path: string, slot: string): boolean =>
	[...held.slots].some((key) => {
		const at = key.slice(0, key.lastIndexOf('.'));
		return key.slice(at.length + 1) === slot && under(at, path);
	});

export function guardRows(p: Plan, composed: ReadonlySet<string>, held: Held): GuardRow[] {
	const rows: GuardRow[] = [];
	const ownerOf = (path: string, slot: string): string | undefined => {
		const at = lineageOf(path, (line) => p.kinds.get(line)).find((line) => p.owned.get(line)?.has(slot));
		return at === undefined ? undefined : p.owned.get(at)!.get(slot)!.feature.name;
	};
	for (const path of [...held.paths].sort(byCodepoint)) {
		const feature = p.kinds.get(path)?.feature?.name;
		if (feature !== undefined && !composed.has(feature)) rows.push({ feature, path, side: 'claimed-not-composed' });
	}
	for (const key of [...held.slots].sort(byCodepoint)) {
		const path = key.slice(0, key.lastIndexOf('.'));
		const slot = key.slice(path.length + 1);
		const feature = ownerOf(path, slot);
		if (feature !== undefined && !composed.has(feature)) rows.push({ feature, path, slot, side: 'claimed-not-composed' });
	}
	for (const feature of [...composed].sort(byCodepoint)) {
		for (const kind of p.kinds.values())
			if (kind.feature?.name === feature && !holdsPath(held, kind.path)) rows.push({ feature, path: kind.path, side: 'composed-not-claimed' });
		for (const alias of p.aliases) if (alias.feature === feature && !holdsPath(held, alias.target)) rows.push({ feature, path: alias.path, side: 'composed-not-claimed' });
		for (const [path, slots] of p.owned)
			for (const [slot, o] of slots)
				if (o.feature.name === feature && !UNHELD_SLOTS.includes(slotKey(path, slot)) && !holdsSlot(held, path, slot))
					rows.push({ feature, path, slot, side: 'composed-not-claimed' });
	}
	return rows;
}

export async function heldBy(grammar: GrammarName): Promise<Held> {
	const [input] = await loadInputs([grammar]);
	const d = derive([input!]);
	const { readEntries } = resolveRoutes(input!);
	const entries = [...readEntries.values()].flat();
	const forms = new Map([...readEntries.keys()].map((kind) => [kind, kind]));
	const paths = new Set<string>([...d.allvocab, ...d.contentDerived.keys(), ...d.refinements.keys()]);
	const slots = new Set<string>([
		...[...d.slots].flatMap(([path, at]) => [...at.keys()].map((slot) => slotKey(path, slot))),
		...entries.flatMap((entry) => entry.slots.map((route) => slotKey(entry.vocab, route.name))),
		...[...readEntries.values()].flatMap((onKind) =>
			onKind.flatMap(({ claim: { flag } }) =>
				flag === undefined ? [] : onKind.filter((other) => other.claim.flag === flag || declaredFlags(input!.vocabulary, other.vocab).includes(flag)).map((other) => slotKey(other.vocab, flag))
			)
		),
		...input!.bindings.containers.flatMap((container) =>
			envelopeTargets(input!.model, container, forms).flatMap((kind) =>
				(readEntries.get(kind) ?? []).flatMap((entry) => container.captures.map((capture) => slotKey(entry.vocab, camel(capture.name))))
			)
		),
		...[...d.holes].flatMap(([path, at]) => [...at.keys()].map((slot) => slotKey(path, slot)))
	]);
	return { paths, slots };
}

export async function featureGuard(grammar: GrammarName): Promise<GuardRow[]> {
	const [source, vocabulary, held] = await Promise.all([readVocabularySource(VOCABULARY_DIR), readVocabulary(VOCABULARY_DIR), heldBy(grammar)]);
	return guardRows(plan(source), vocabulary.featuresOf(compositionOf(grammar)), held);
}

import { byCodepoint, camel, compositionOf, derive, envelopeTargets, lineageOf, readVocabulary, readVocabularySource, resolveRoutes, VOCABULARY_DIR } from '@sittir/codegen/bindings';
import type { GrammarName } from '@sittir/codegen/grammars';
import { loadInputs } from '../inventory/index.ts';
import { plan, under, type Plan } from '../vocabulary/plan.ts';

export interface GuardRow {
	readonly feature: string;
	readonly path: string;
	readonly member?: string;
	readonly side: 'claimed-not-composed' | 'composed-not-claimed';
}

export interface Held {
	readonly paths: ReadonlySet<string>;
	readonly members: ReadonlySet<string>;
}

const memberKey = (path: string, member: string): string => `${path}.${member}`;

export const UNHELD_MEMBERS: readonly string[] = [
	'declaration.property.definite',
	'declaration.property.optionality',
	'declaration.type_parameter.parameters.bounds',
	'declaration.type_parameter.value.bounds',
	'declaration.type_parameter.variadic.bounds'
];

export const holdsPath = (held: Held, path: string): boolean => [...held.paths].some((claimed) => under(claimed, path));

export const holdsMember = (held: Held, path: string, member: string): boolean =>
	[...held.members].some((key) => {
		const at = key.slice(0, key.lastIndexOf('.'));
		return key.slice(at.length + 1) === member && under(at, path);
	});

export function guardRows(p: Plan, composed: ReadonlySet<string>, held: Held): GuardRow[] {
	const rows: GuardRow[] = [];
	const ownerOf = (path: string, member: string): string | undefined => {
		const at = lineageOf(path, (line) => p.kinds.get(line)).find((line) => p.owned.get(line)?.has(member));
		return at === undefined ? undefined : p.owned.get(at)!.get(member)!.feature.name;
	};
	for (const path of [...held.paths].sort(byCodepoint)) {
		const feature = p.kinds.get(path)?.feature?.name;
		if (feature !== undefined && !composed.has(feature)) rows.push({ feature, path, side: 'claimed-not-composed' });
	}
	for (const key of [...held.members].sort(byCodepoint)) {
		const path = key.slice(0, key.lastIndexOf('.'));
		const member = key.slice(path.length + 1);
		const feature = ownerOf(path, member);
		if (feature !== undefined && !composed.has(feature)) rows.push({ feature, path, member, side: 'claimed-not-composed' });
	}
	for (const feature of [...composed].sort(byCodepoint)) {
		for (const kind of p.kinds.values())
			if (kind.feature?.name === feature && !holdsPath(held, kind.path)) rows.push({ feature, path: kind.path, side: 'composed-not-claimed' });
		for (const [path, members] of p.owned)
			for (const [member, o] of members)
				if (o.feature.name === feature && !UNHELD_MEMBERS.includes(memberKey(path, member)) && !holdsMember(held, path, member))
					rows.push({ feature, path, member, side: 'composed-not-claimed' });
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
	const members = new Set<string>([
		...[...d.members].flatMap(([path, at]) => [...at.keys()].map((member) => memberKey(path, member))),
		...entries.flatMap((entry) => [...entry.members.map((route) => route.name), ...(entry.claim.flag === undefined ? [] : [entry.claim.flag])].map((member) => memberKey(entry.vocab, member))),
		...input!.bindings.containers.flatMap((container) =>
			envelopeTargets(input!.model, container, forms).flatMap((kind) =>
				(readEntries.get(kind) ?? []).flatMap((entry) => container.captures.map((capture) => memberKey(entry.vocab, camel(capture.name))))
			)
		),
		...[...d.holes].flatMap(([path, at]) => [...at.keys()].map((member) => memberKey(path, member)))
	]);
	return { paths, members };
}

export async function featureGuard(grammar: GrammarName): Promise<GuardRow[]> {
	const [source, vocabulary, held] = await Promise.all([readVocabularySource(VOCABULARY_DIR), readVocabulary(VOCABULARY_DIR), heldBy(grammar)]);
	return guardRows(plan(source), vocabulary.featuresOf(compositionOf(grammar)), held);
}

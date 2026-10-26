import { detachCoordinates, sliceSpan } from '@sittir/common';
import { isNode, isStorageKey, placeOf } from '@sittir/common/utils';
import type { AnyUntypedNode } from '@sittir/types';
import { holdingTreeOf, type LoadedNodeModel } from '../validate/common.ts';
import { displayStorageKinds } from '../validate/display-families.ts';

export interface OutputSpelling {
	readonly kind: string;
	readonly slot: string;
}

export const OUTPUT_SPELLINGS: Readonly<Record<string, readonly OutputSpelling[]>> = {
	python: [{ kind: 'interpolation', slot: 'debug' }]
};

export interface OutputSpellingSite extends OutputSpelling {
	readonly storageKey: string;
}

export type OutputSpellingSites = (kind: string) => OutputSpellingSite | undefined;

export function outputSpellingSites(
	grammar: string,
	model: Pick<LoadedNodeModel, 'modelTypes' | 'slotAccessors' | 'displayUnions'>
): OutputSpellingSites {
	const byStorage = new Map<string, OutputSpellingSite>();
	for (const entry of OUTPUT_SPELLINGS[grammar] ?? []) {
		const named = `the output-spelling table names ${grammar} ${entry.kind}.${entry.slot}`;
		if (!(entry.kind in model.modelTypes)) throw new Error(`emit-factory-source: ${named}, and ${grammar}'s node model has no kind '${entry.kind}'`);
		const storageKey = Object.entries(model.slotAccessors[entry.kind] ?? {}).find(([, accessor]) => accessor === entry.slot)?.[0];
		if (storageKey === undefined) throw new Error(`emit-factory-source: ${named}, and ${grammar}'s ${entry.kind} has no slot '${entry.slot}'`);
		byStorage.set(entry.kind, { ...entry, storageKey });
	}
	return (kind) => displayStorageKinds(kind, model.displayUnions).map((storage) => byStorage.get(storage)).find((site) => site !== undefined);
}

export interface OutputSpellingCheck {
	readonly grammar: string;
	readonly source: string;
	readonly sites: OutputSpellingSites;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly render: (node: AnyUntypedNode) => string;
}

export function refuseRespelledOutput(value: unknown, check: OutputSpellingCheck): void {
	if (Array.isArray(value)) {
		for (const entry of value) refuseRespelledOutput(entry, check);
		return;
	}
	if (value === null || typeof value !== 'object') return;
	for (const [key, child] of Object.entries(value)) if (isStorageKey(key)) refuseRespelledOutput(child, check);
	if (isNode(value)) refuseRespelledNode(value, check);
}

function refuseRespelledNode(node: AnyUntypedNode, check: OutputSpellingCheck): void {
	const kind = check.kindNameFromId(node.$type);
	const site = kind === undefined ? undefined : check.sites(kind);
	const span = placeOf(node)?.span;
	if (kind === undefined || site === undefined || span === undefined || !holdsValue(Reflect.get(node, site.storageKey))) return;
	const written = sliceSpan(check.source, span);
	const spelled = check.render(holdingTreeOf(node, detachCoordinates(structuredClone(node))));
	if (written !== spelled)
		throw new Error(`emit-factory-source: the ${check.grammar} ${kind} \`${written}\` prints its ${site.slot} spelling as written, and its builders spell it \`${spelled}\``);
}

function holdsValue(value: unknown): boolean {
	return value !== undefined && value !== false && !(Array.isArray(value) && value.length === 0);
}

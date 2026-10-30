import type { PortableMountCall } from '@sittir/types';
import { existsSync, readFileSync } from 'node:fs';
import { slotPropertyName } from '../compiler/model/node-map.ts';
import { slotKindsOf } from '../emitters/node-model-read.ts';
import { boundNameAt, boundNameOf } from '../dsl/bind.ts';
import { boundFieldNameOf, leadEffectsOf, type BindingEffect } from '../dsl/verbs/effects.ts';
import { parsePreferencePath } from '../dsl/primitives/preference-path.ts';
import { type OptionsConfig, readOptionsBlock } from '../dsl/wire/options-block.ts';
import { bindFacts, bindingsPath, type EnumMember, type ModelMount, type ModelNode, type SlotModel, VOCABULARY_DIR } from './facts.ts';
import { readBindings } from './read.ts';
import { projectLeadFacts } from './lead-facts.ts';
import type { GrammarInput, LayoutSlot } from './routes.ts';
import { canonicalFacts, type Vocabulary, readVocabulary, resolveFlags } from './vocabulary.ts';

export interface NodeModelValue {
	readonly kind?: string;
	readonly multiplicity?: string;
	readonly value?: string;
	readonly name?: string;
	readonly parseKind?: string;
	readonly seat?: {
		readonly kind: string;
		readonly shape: string;
		readonly mount?: string;
		readonly call?: PortableMountCall;
		readonly nested?: Readonly<Record<string, PortableMountCall>>;
	};
}

export interface NodeModelSlot {
	readonly name: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly storage?: string;
	readonly values?: readonly NodeModelValue[];
}

export interface NodeModelNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly unit?: true;
	readonly renamedFrom?: string;
	readonly slots?: readonly NodeModelSlot[];
	readonly subtypes?: readonly string[];
	readonly elementKinds?: readonly string[];
	readonly members?: readonly EnumMember[];
	readonly text?: string;
	readonly pattern?: string;
	readonly variantOf?: string;
	readonly splitFrom?: string;
	readonly aliasStorage?: string;
	readonly shownAs?: readonly string[];
}

export interface NodeModelRecord {
	readonly nodes: readonly NodeModelNode[] | Readonly<Record<string, NodeModelNode>>;
}

const nodesOf = (record: NodeModelRecord): readonly NodeModelNode[] =>
	Array.isArray(record.nodes) ? record.nodes : Object.values(record.nodes);

const mountsOf = (slot: NodeModelSlot): { readonly mounts?: Readonly<Record<string, ModelMount>> } => {
	const mounts = (slot.values ?? []).flatMap(({ seat }) =>
		seat?.shape === 'arm' && seat.mount !== undefined && seat.call !== undefined
			? [[seat.kind, { mount: seat.mount, call: seat.call, ...(seat.nested === undefined ? {} : { nested: seat.nested }) }] as const]
			: []
	);
	return mounts.length === 0 ? {} : { mounts: Object.fromEntries(mounts) };
};

const seatedOf = (slot: NodeModelSlot, shape: 'flatten' | 'tuple'): readonly string[] => (slot.values ?? []).flatMap(({ seat }) => (seat?.shape === shape ? [seat.kind] : []));

const seatShapesOf = (slot: NodeModelSlot): { readonly flattens?: readonly string[]; readonly tuples?: readonly string[] } => {
	const flattens = seatedOf(slot, 'flatten');
	const tuples = seatedOf(slot, 'tuple');
	return { ...(flattens.length === 0 ? {} : { flattens }), ...(tuples.length === 0 ? {} : { tuples }) };
};

export function slotModelOf(record: NodeModelRecord): SlotModel {
	const out = new Map<string, ModelNode>();
	for (const n of nodesOf(record)) {
		out.set(n.kind, {
			kind: n.kind,
			modelType: n.modelType ?? 'branch',
			unit: n.unit === true,
			slots: (n.slots ?? []).map((s) => ({
				name: s.name,
				propertyName: slotPropertyName(s),
				required: s.required ?? false,
				multiple: s.multiple ?? false,
				storage: s.storage ?? 'verbatim',
				kinds: slotKindsOf(s),
				terminals: (s.values ?? []).flatMap((v) => (v.kind === 'terminal' && v.value !== undefined ? [v.value] : [])),
				...mountsOf(s),
				...seatShapesOf(s)
			})),
			subtypes: n.subtypes ?? [],
			elementKinds: n.elementKinds ?? [],
			enumMembers: n.members ?? [],
			text: n.text ?? null,
			pattern: n.pattern ?? null,
			variantOf: n.variantOf ?? null,
			splitFrom: n.splitFrom ?? null,
			aliasStorage: n.aliasStorage ?? null,
			shownAs: n.shownAs ?? []
		});
	}
	return out;
}

export function renamedFromOf(record: NodeModelRecord): Record<string, string> {
	return Object.fromEntries(nodesOf(record).flatMap((n) => (n.renamedFrom === undefined ? [] : [[n.kind, n.renamedFrom]])));
}

export function layoutSlots(options: OptionsConfig, kinds: ReadonlySet<string>): LayoutSlot[] {
	return readOptionsBlock(options, kinds).labels.flatMap(({ address }): LayoutSlot[] => {
		const [owner, slot, ...rest] = parsePreferencePath(address);
		if (rest.length > 0 || slot?.kind !== 'fieldName') return [];
		if (owner?.kind === 'wildcard') return [{ kind: null, slot: slot.name }];
		return owner?.kind === 'name' ? [{ kind: owner.name, slot: slot.name }] : [];
	});
}

export interface EvaluatedGrammarFacts {
	readonly rules?: Readonly<Record<string, unknown>>;
	readonly supertypes?: readonly string[];
	readonly bindingEffects?: readonly BindingEffect[];
	readonly textTokens?: readonly string[];
	readonly options?: OptionsConfig;
}

export async function grammarInput(
	grammar: string,
	raw: EvaluatedGrammarFacts,
	record: NodeModelRecord,
	scmPath: string = bindingsPath(grammar),
	vocabulary?: Vocabulary
): Promise<GrammarInput | undefined> {
	if (!existsSync(scmPath)) return undefined;
	const model = slotModelOf(record);
	const effects = raw.bindingEffects ?? [];
	const aliases = effects.filter((effect) => effect.kind === 'alias');
	const nameOf = boundNameOf(renamedFromOf(record), aliases);
	const facts = bindFacts(
		await readBindings(readFileSync(scmPath, 'utf8')),
		nameOf,
		boundFieldNameOf(
			effects.filter((effect) => effect.kind === 'segment'),
			{ rules: raw.rules ?? {}, supertypes: raw.supertypes ?? [] }
		),
		boundNameAt(nameOf, aliases)
	);
	const known = vocabulary ?? (await readVocabulary(VOCABULARY_DIR));
	return {
		grammar,
		bindings: resolveFlags(
			canonicalFacts(
				projectLeadFacts(facts, leadEffectsOf(effects)),
				known,
				model
			),
			known,
			model
		),
		model,
		textTokens: new Set(raw.textTokens ?? []),
		layoutSlots: layoutSlots(raw.options ?? {}, new Set(model.keys()))
	};
}

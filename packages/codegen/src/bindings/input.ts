import { existsSync, readFileSync } from 'node:fs';
import { slotKindsOf } from '../emitters/node-model-read.ts';
import { boundNameOf } from '../dsl/bind.ts';
import { boundFieldNameOf, type BindingEffect } from '../dsl/verbs/effects.ts';
import { parsePreferencePath } from '../dsl/primitives/preference-path.ts';
import { type OptionsConfig, readOptionsBlock } from '../dsl/wire/options-block.ts';
import { bindFacts, bindingsPath, type EnumMember, type ModelNode, type SlotModel, VOCABULARY_DIR } from './facts.ts';
import { readBindings } from './read.ts';
import { projectLeadFacts } from './lead-facts.ts';
import type { GrammarInput, LayoutSlot } from './routes.ts';
import { type Vocabulary, readVocabulary, resolveFlags } from './vocabulary.ts';

export interface NodeModelValue {
	readonly kind?: string;
	readonly multiplicity?: string;
	readonly value?: string;
	readonly name?: string;
	readonly parseKind?: string;
}

export interface NodeModelSlot {
	readonly name: string;
	readonly accessor: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly storage?: string;
	readonly values?: readonly NodeModelValue[];
}

export interface NodeModelNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly renamedFrom?: string;
	readonly slots?: readonly NodeModelSlot[];
	readonly subtypes?: readonly string[];
	readonly elementKinds?: readonly string[];
	readonly members?: readonly EnumMember[];
	readonly text?: string;
	readonly pattern?: string;
	readonly variantOf?: string;
}

export interface NodeModelRecord {
	readonly nodes: readonly NodeModelNode[] | Readonly<Record<string, NodeModelNode>>;
}

const nodesOf = (record: NodeModelRecord): readonly NodeModelNode[] =>
	Array.isArray(record.nodes) ? record.nodes : Object.values(record.nodes);

function shownNames(record: NodeModelRecord): ReadonlyMap<string, readonly string[]> {
	const shown = new Map<string, Set<string>>();
	for (const n of nodesOf(record))
		for (const s of n.slots ?? [])
			for (const v of s.values ?? [])
				if (v.name !== undefined && v.parseKind !== undefined && v.parseKind !== v.name)
					(shown.get(v.name) ?? shown.set(v.name, new Set()).get(v.name)!).add(v.parseKind);
	return new Map([...shown].map(([kind, names]) => [kind, [...names].sort()]));
}

export function slotModelOf(record: NodeModelRecord): SlotModel {
	const out = new Map<string, ModelNode>();
	const shown = shownNames(record);
	for (const n of nodesOf(record)) {
		out.set(n.kind, {
			kind: n.kind,
			modelType: n.modelType ?? 'branch',
			slots: (n.slots ?? []).map((s) => ({
				name: s.name,
				propertyName: s.accessor,
				required: s.required ?? false,
				multiple: s.multiple ?? false,
				storage: s.storage ?? 'verbatim',
				kinds: slotKindsOf(s),
				terminals: (s.values ?? []).flatMap((v) => (v.kind === 'terminal' && v.value !== undefined ? [v.value] : []))
			})),
			subtypes: n.subtypes ?? [],
			elementKinds: n.elementKinds ?? [],
			enumMembers: n.members ?? [],
			text: n.text ?? null,
			pattern: n.pattern ?? null,
			variantOf: n.variantOf ?? null,
			shownAs: shown.get(n.kind) ?? []
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
	const facts = bindFacts(
		await readBindings(readFileSync(scmPath, 'utf8')),
		boundNameOf(renamedFromOf(record), effects.filter((effect) => effect.kind === 'alias')),
		boundFieldNameOf(
			effects.filter((effect) => effect.kind === 'segment'),
			{ rules: raw.rules ?? {}, supertypes: raw.supertypes ?? [] }
		)
	);
	return {
		grammar,
		bindings: resolveFlags(
			projectLeadFacts(
				facts,
				effects.filter((effect) => effect.kind === 'lead')
			),
			vocabulary ?? (await readVocabulary(VOCABULARY_DIR)),
			model
		),
		model,
		textTokens: new Set(raw.textTokens ?? []),
		layoutSlots: layoutSlots(raw.options ?? {}, new Set(model.keys()))
	};
}

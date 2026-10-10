import { existsSync, readFileSync } from 'node:fs';
import { boundNameOf } from '../dsl/bind.ts';
import { SEPARATOR_LABEL } from '../dsl/primitives/spacing.ts';
import { parsePreferencePath } from '../dsl/primitives/preference-path.ts';
import { type OptionsConfig, readOptionsBlock } from '../dsl/wire/options-block.ts';
import { bindFacts, bindingsPath, type EnumMember, type ModelNode, type SlotModel } from './facts.ts';
import { readBindings } from './read.ts';
import type { GrammarInput, LayoutSlot } from './routes.ts';

export interface NodeModelValue {
	readonly kind?: string;
	readonly value?: string;
}

export interface NodeModelSlot {
	readonly name: string;
	readonly propertyName: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly storage?: string;
	readonly kinds?: readonly string[];
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
}

export interface NodeModelRecord {
	readonly nodes: readonly NodeModelNode[] | Readonly<Record<string, NodeModelNode>>;
}

const nodesOf = (record: NodeModelRecord): readonly NodeModelNode[] =>
	Array.isArray(record.nodes) ? record.nodes : Object.values(record.nodes);

export function slotModelOf(record: NodeModelRecord): SlotModel {
	const out = new Map<string, ModelNode>();
	for (const n of nodesOf(record)) {
		out.set(n.kind, {
			kind: n.kind,
			modelType: n.modelType ?? 'branch',
			slots: (n.slots ?? []).map((s) => ({
				name: s.name,
				propertyName: s.propertyName,
				required: s.required ?? false,
				multiple: s.multiple ?? false,
				storage: s.storage ?? 'verbatim',
				kinds: s.kinds ?? [],
				terminals: (s.values ?? []).flatMap((v) => (v.kind === 'terminal' && v.value !== undefined ? [v.value] : []))
			})),
			subtypes: n.subtypes ?? [],
			elementKinds: n.elementKinds ?? [],
			enumMembers: n.members ?? [],
			text: n.text ?? null,
			pattern: n.pattern ?? null
		});
	}
	return out;
}

export function renamedFromOf(record: NodeModelRecord): Record<string, string> {
	return Object.fromEntries(nodesOf(record).flatMap((n) => (n.renamedFrom === undefined ? [] : [[n.kind, n.renamedFrom]])));
}

export function layoutSlots(options: OptionsConfig, kinds: ReadonlySet<string>): LayoutSlot[] {
	const optionSites = readOptionsBlock(options, kinds).labels.flatMap(({ address }): LayoutSlot[] => {
		const [owner, slot, ...rest] = parsePreferencePath(address);
		if (rest.length > 0 || slot?.kind !== 'fieldName') return [];
		if (owner?.kind === 'wildcard') return [{ kind: null, slot: slot.name }];
		return owner?.kind === 'name' ? [{ kind: owner.name, slot: slot.name }] : [];
	});
	return [...optionSites, { kind: null, slot: SEPARATOR_LABEL }];
}

export interface EvaluatedGrammarFacts {
	readonly textTokens?: readonly string[];
	readonly options?: OptionsConfig;
}

export async function grammarInput(
	grammar: string,
	raw: EvaluatedGrammarFacts,
	record: NodeModelRecord,
	scmPath: string = bindingsPath(grammar)
): Promise<GrammarInput | undefined> {
	if (!existsSync(scmPath)) return undefined;
	const model = slotModelOf(record);
	return {
		grammar,
		bindings: bindFacts(await readBindings(readFileSync(scmPath, 'utf8')), boundNameOf(renamedFromOf(record))),
		model,
		textTokens: new Set(raw.textTokens ?? []),
		layoutSlots: layoutSlots(raw.options ?? {}, new Set(model.keys()))
	};
}

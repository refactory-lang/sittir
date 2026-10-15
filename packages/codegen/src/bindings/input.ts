import { existsSync, readFileSync } from 'node:fs';
import { boundNameOf } from '../dsl/bind.ts';
import { parsePreferencePath } from '../dsl/primitives/preference-path.ts';
import { type OptionsConfig, readOptionsBlock } from '../dsl/wire/options-block.ts';
import { bindFacts, bindingsPath, type EnumMember, type ModelNode, type SlotModel, VOCABULARY_DIR } from './facts.ts';
import { readBindings } from './read.ts';
import type { GrammarInput, LayoutSlot } from './routes.ts';
import { type Vocabulary, readVocabulary, resolveFlags } from './vocabulary.ts';

export interface NodeModelValue {
	readonly kind?: string;
	readonly value?: string;
	readonly name?: string;
	readonly parseKind?: string;
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
	return {
		grammar,
		bindings: resolveFlags(bindFacts(await readBindings(readFileSync(scmPath, 'utf8')), boundNameOf(renamedFromOf(record))), vocabulary ?? (await readVocabulary(VOCABULARY_DIR))),
		model,
		textTokens: new Set(raw.textTokens ?? []),
		layoutSlots: layoutSlots(raw.options ?? {}, new Set(model.keys()))
	};
}

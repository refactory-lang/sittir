import type { PortableMountCall } from '@sittir/types';
import { existsSync, readFileSync } from 'node:fs';
import { slotKindsOf } from '../emitters/node-model-read.ts';
import { boundNameAt, boundNameOf } from '../dsl/bind.ts';
import { groupLiftNames } from '../dsl/rule-metadata.ts';
import { isParserHiddenName } from '../dsl/rule-patterns.ts';
import type { Rule } from '../types/rule.ts';
import { CHOICE, REPEAT1, SEQ, STRING, SYMBOL, TOKEN } from '../types/rule-types.ts';
import { boundFieldNameOf, leadEffectsOf, type BindingEffect } from '../dsl/verbs/effects.ts';
import { parsePreferencePath } from '../dsl/primitives/preference-path.ts';
import { type OptionsConfig, readOptionsBlock } from '../dsl/wire/options-block.ts';
import { bindFacts, bindingsPath, type EnumMember, type ListDelimiter, type ModelMount, type ModelNode, type ModelSlot, type SlotModel, VOCABULARY_DIR } from './facts.ts';
import { readBindings } from './read.ts';
import { expandHeldSlots, projectLeadFacts } from './lead-facts.ts';
import type { GrammarInput, LayoutSlot } from './routes.ts';
import { canonicalFacts, compositionOf, type Vocabulary, readVocabulary, resolveFlags } from './vocabulary.ts';

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
	readonly accessor: string;
	readonly required?: boolean;
	readonly multiple?: boolean;
	readonly storage?: string;
	readonly registered?: true;
	readonly valueSource?: true;
	readonly values?: readonly NodeModelValue[];
	readonly chain?: ModelSlot['chain'];
}

export interface NodeModelNode {
	readonly kind: string;
	readonly modelType?: string;
	readonly unit?: true;
	readonly layout?: true;
	readonly seated?: true;
	readonly defaultSubtype?: string;
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
	readonly textLeavesThrough?: readonly string[];
	readonly interiorPart?: string;
	readonly shownAs?: readonly string[];
	readonly trailingDelimiter?: ListDelimiter;
	readonly singleElementNeedsTrailing?: true;
	readonly separator?: string;
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

function unprecedented(rule: Rule<'evaluate'>): Rule<'evaluate'> {
	switch (rule.type) {
		case 'PREC':
		case 'PREC_LEFT':
		case 'PREC_RIGHT':
		case 'PREC_DYNAMIC':
			return unprecedented(rule.content);
		default:
			return rule;
	}
}

function spelledTokens(rules: Readonly<Record<string, Rule<'evaluate'>>>, supertypes: ReadonlySet<string>): (kind: string) => readonly string[] {
	const entered = new Set<string>();
	const of = (given: Rule<'evaluate'>): readonly string[] => {
		const rule = unprecedented(given);
		switch (rule.type) {
			case STRING:
				return [rule.value];
			case SEQ:
				return rule.members.flatMap(of);
			case CHOICE: {
				const [first = [], ...rest] = rule.members.map(of);
				return first.filter((token) => rest.every((arm) => arm.includes(token)));
			}
			case TOKEN:
			case 'IMMEDIATE_TOKEN': {
				const lexed = unprecedented(rule.content);
				return lexed.type === STRING ? [lexed.value] : [];
			}
			case REPEAT1:
			case 'RESERVED':
				return of(rule.content);
			case SYMBOL:
				return isParserHiddenName(rule.name) && !supertypes.has(rule.name) ? within(rule.name) : [];
			default:
				return [];
		}
	};
	const within = (name: string): readonly string[] => {
		const rule = rules[name];
		if (rule === undefined || entered.has(name)) return [];
		entered.add(name);
		const tokens = of(rule);
		entered.delete(name);
		return tokens;
	};
	return (kind) => [...new Set(within(kind))];
}

export function slotModelOf(record: NodeModelRecord, grammar: Pick<EvaluatedGrammarFacts, 'rules' | 'supertypes'>): SlotModel {
	const spells = spelledTokens(grammar.rules ?? {}, new Set(grammar.supertypes ?? []));
	const out = new Map<string, ModelNode>();
	for (const n of nodesOf(record)) {
		out.set(n.kind, {
			kind: n.kind,
			modelType: n.modelType ?? 'branch',
			unit: n.unit === true,
			layout: n.layout === true,
			seated: n.seated === true,
			defaultSubtype: n.defaultSubtype ?? null,
			slots: (n.slots ?? []).map((s) => ({
				name: s.name,
				propertyName: s.accessor,
				required: s.required ?? false,
				multiple: s.multiple ?? false,
				storage: s.storage ?? 'verbatim',
				kinds: slotKindsOf(s),
				terminals: (s.values ?? []).flatMap((v) => (v.kind === 'terminal' && v.value !== undefined ? [v.value] : [])),
				...((s.values ?? []).length > 0 && s.values!.every((v) => v.kind === 'terminal' && v.value !== undefined) ? { fixedTokens: true as const } : {}),
				...(s.registered === true ? { registered: true as const } : {}),
				...(s.valueSource === true ? { valueSource: true as const } : {}),
				...mountsOf(s),
				...seatShapesOf(s),
				...(s.chain === undefined ? {} : { chain: s.chain })
			})),
			subtypes: n.subtypes ?? [],
			elementKinds: n.modelType === 'list' ? (n.slots ?? []).filter((s) => s.multiple === true).flatMap(slotKindsOf) : [],
			enumMembers: n.members ?? [],
			text: n.text ?? null,
			pattern: n.pattern ?? null,
			variantOf: n.variantOf ?? null,
			splitFrom: n.splitFrom ?? null,
			aliasStorage: n.aliasStorage ?? null,
			interiorPart: n.interiorPart ?? null,
			textLeavesThrough: n.textLeavesThrough ?? [],
			shownAs: n.shownAs ?? [],
			spells: spells(n.kind),
			...(n.modelType === 'list' && n.trailingDelimiter !== undefined
				? { list: { trailing: n.trailingDelimiter, ...(n.separator === undefined ? {} : { separator: n.separator }), ...(n.singleElementNeedsTrailing === true ? { singleElementNeedsTrailing: true as const } : {}) } }
				: {})
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
	readonly rules?: Readonly<Record<string, Rule<'evaluate'>>>;
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
	const model = slotModelOf(record, raw);
	const effects = raw.bindingEffects ?? [];
	const aliases = effects.filter((effect) => effect.kind === 'alias');
	const nameOf = boundNameOf(renamedFromOf(record), aliases);
	const known = (vocabulary ?? (await readVocabulary(VOCABULARY_DIR))).composedAs(compositionOf(grammar));
	const facts = bindFacts(
		await readBindings(readFileSync(scmPath, 'utf8')),
		nameOf,
		known.namespaces,
		boundFieldNameOf(
			effects.filter((effect) => effect.kind === 'segment'),
			{ rules: raw.rules ?? {}, supertypes: raw.supertypes ?? [] }
		),
		boundNameAt(nameOf, aliases, groupLiftNames(raw.rules ?? {}))
	);
	return {
		grammar,
		bindings: resolveFlags(
			canonicalFacts(
				projectLeadFacts(expandHeldSlots(facts, model), leadEffectsOf(effects), model, known.namespaces),
				known,
				model
			),
			known,
			model
		),
		model,
		textTokens: new Set(raw.textTokens ?? []),
		layoutSlots: layoutSlots(raw.options ?? {}, new Set(model.keys())),
		vocabulary: known
	};
}

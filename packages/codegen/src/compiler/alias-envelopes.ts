import { STRING, SUPERTYPE } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, SimplifiedRule } from '../types/rule.ts';
import type { GeneratedKindEntry } from '../dsl/symbol-table.ts';
import type { LinkedRefineForm } from './types.ts';
import { makeRuleMetadata } from '../dsl/rule-metadata.ts';
import { reownRuleIds, withKindFacts } from '../dsl/rule-attrs.ts';
import { aliasContentRefs, isAliasEnvelopeKind, isUnresolvedRef, type AssembledNode, type AssembledNonterminal } from './model/node-map.ts';

export interface AliasStorage {
	readonly name: string;
	readonly literal?: string;
	readonly kindId?: number;
}

export function aliasEnvelopeStorages(
	rules: Readonly<Record<string, SimplifiedRule>>,
	kindEntries: readonly GeneratedKindEntry[],
	word: string | null
): ReadonlyMap<string, AliasStorage> {
	const storages = new Map<string, AliasStorage>();
	for (const display of Object.keys(rules)) {
		if (!isAliasEnvelopeKind(display, { simplifiedRules: rules, kindEntries })) continue;
		const refs = aliasContentRefs(rules[display]) as readonly AliasStorage[];
		if (refs.some((ref) => ref.name === word)) continue;
		if (refs.length !== 1)
			throw new Error(`alias envelope '${display}' has ${refs.length} storages (${refs.map((ref) => ref.name).join(', ')}); an alias envelope has one storage`);
		const storage = refs[0]!;
		if (rules[storage.name]?.type === SUPERTYPE) continue;
		storages.set(display, storage);
	}
	return storages;
}

export function copyAliasEnvelopeBodies<R extends AnyRule>(rules: Record<string, R>, storages: ReadonlyMap<string, AliasStorage>): void {
	for (const [display, storage] of storages) {
		const { annotations: _annotations, inlinedFrom: _inlinedFrom, metadata: _metadata, ...body } = rules[storage.name] ?? literalBody(display, storage);
		const copy = withKindFacts(reownRuleIds(body as R, display), rules[display]!);
		rules[display] = { ...copy, metadata: makeRuleMetadata({ aliasStorage: storage.name }) };
	}
}

function literalBody(display: string, storage: AliasStorage): AnyRule {
	if (storage.literal === undefined) throw new Error(`alias envelope '${display}': its storage '${storage.name}' has no rule and no literal text`);
	return { type: STRING, value: storage.literal, hidden: false, ...(storage.kindId === undefined ? {} : { resolvedKindId: storage.kindId }) } as AnyRule;
}

export function withAliasEnvelopeEntries<V>(table: ReadonlyMap<string, V> | undefined, storages: ReadonlyMap<string, AliasStorage>): ReadonlyMap<string, V> | undefined {
	if (table === undefined) return undefined;
	const entries = [...storages].flatMap(([display, storage]) => (table.has(storage.name) ? [[display, table.get(storage.name)!] as const] : []));
	return entries.length === 0 ? table : new Map([...table, ...entries]);
}

export function linkAliasStorages(
	nodes: ReadonlyMap<string, AssembledNode>,
	refineForms: ReadonlyMap<string, readonly LinkedRefineForm[]> | undefined
): void {
	for (const node of nodes.values()) {
		const storageKind = node.aliasStorage;
		if (storageKind === undefined) continue;
		const storage = nodes.get(storageKind);
		const own = slotsShape(node.slots);
		const held = storage === undefined ? undefined : slotsShape(storage.slots);
		if (storage === undefined || own !== held)
			throw new Error(`alias envelope '${node.kind}': its slots ${own} are not its storage '${storageKind}' slots ${held ?? '(no such node)'}`);
		const ownForms = formsShape(refineForms?.get(node.kind));
		const heldForms = formsShape(refineForms?.get(storageKind));
		if (ownForms !== heldForms)
			throw new Error(`alias envelope '${node.kind}': its forms ${ownForms} are not its storage '${storageKind}' forms ${heldForms}`);
		node.aliasStorageNode = storage;
		storage.aliasDisplays = [...storage.aliasDisplays, node];
	}
}

function formsShape(forms: readonly LinkedRefineForm[] | undefined): string {
	return JSON.stringify(
		(forms ?? []).map((form) => [
			form.name,
			Object.entries(form.selections),
			form.narrowedFields.map((field) => [field.fieldName, field.literal])
		])
	);
}

function slotsShape(slots: readonly AssembledNonterminal[]): string {
	return JSON.stringify(
		slots.map((slot) => [
			slot.name,
			slot.fieldName,
			slot.values.map((value) => [value.node === undefined ? undefined : isUnresolvedRef(value.node) ? value.node.name : value.node.kind, value.value, value.pattern, value.multiplicity])
		])
	);
}

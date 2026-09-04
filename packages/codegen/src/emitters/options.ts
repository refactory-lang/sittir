import type { NodeMap } from '../compiler/types.ts';
import {
	AbstractAssembledCompound,
	AssembledList,
	isTerminalValue,
	type NodeOrTerminal
} from '../compiler/model/node-map.ts';
import { STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { Multiplicity } from '../types/rule.ts';

export type OptionFamily = 'choice' | 'list' | 'join';

export interface OptionEntry {
	readonly key: string;
	readonly family: OptionFamily;
	readonly kind: string;
	readonly slot?: string;
	readonly index: number;
	readonly values: readonly string[];
	readonly defaultValue: string;
	readonly valueKinds?: Readonly<Record<string, string>>;
	readonly trailing?: boolean;
}

export interface CatalogValue {
	readonly multiplicity: Multiplicity;
	readonly kind?: string;
	readonly literal?: string;
	readonly separator?: string;
	readonly default?: true;
	readonly variant?: string;
	readonly variantOf?: string;
}

export interface CatalogSlot {
	readonly fieldName?: string;
	readonly values: readonly CatalogValue[];
}

export interface CatalogNode {
	readonly kind: string;
	readonly list?: { readonly separatorText?: string; readonly trailing: 'mandatory' | 'optional' | 'none' };
	readonly slots: readonly CatalogSlot[];
}

export const WHITESPACE_CLASSES = ['tight', 'space', 'newline'] as const;
export const TRAILING_POLICIES = ['never', 'always', 'preserve'] as const;

const SPACED_SEPARATORS: Readonly<Record<string, string>> = {
	',': 'comma',
	';': 'semicolon'
};

type Draft = Omit<OptionEntry, 'index'>;

export function publicKindName(kind: string): string {
	return kind.replace(/^_+/, '');
}

export function projectCatalogNodes(nodeMap: NodeMap): CatalogNode[] {
	const out: CatalogNode[] = [];
	for (const [rawKind, node] of nodeMap.nodes) {
		const kind = publicKindName(rawKind);
		if (node instanceof AssembledList) {
			out.push({ kind, list: { separatorText: separatorTextOf(node), trailing: node.trailingDelimiter }, slots: [] });
			continue;
		}
		if (!(node instanceof AbstractAssembledCompound)) continue;
		out.push({
			kind,
			slots: node.slots.map((slot) => ({
				fieldName: slot.name,
				values: slot.values.map(projectValue)
			}))
		});
	}
	return out;
}

function separatorTextOf(node: AssembledList): string | undefined {
	const rule = node.diagnosticRule as { separator?: { value?: { type?: unknown; value?: unknown } } };
	const sep = rule.separator?.value;
	return sep?.type === STRING && typeof sep.value === 'string' ? sep.value : undefined;
}

function projectValue(v: NodeOrTerminal): CatalogValue {
	const node = v.node as { kind?: string; name?: string } | undefined;
	const rawKind = v.parseKind?.name ?? v.resolvedKind ?? node?.kind ?? node?.name;
	return {
		multiplicity: v.multiplicity,
		kind: rawKind === undefined ? undefined : publicKindName(rawKind),
		...(isTerminalValue(v) ? { literal: v.value } : {}),
		...(v.separator === undefined ? {} : { separator: v.separator }),
		...(v.default === true ? { default: true as const } : {}),
		...(v.variant === undefined
			? {}
			: { variant: v.variant, variantOf: v.variantOf === undefined ? undefined : publicKindName(v.variantOf) })
	};
}

export function deriveOptionCatalog(nodeMap: NodeMap): OptionEntry[] {
	return deriveOptionCatalogFrom(projectCatalogNodes(nodeMap));
}

export function deriveOptionCatalogFrom(nodes: readonly CatalogNode[]): OptionEntry[] {
	const drafts: Draft[] = [];
	for (const node of nodes) {
		if (node.list !== undefined) {
			const list = listEntry(node);
			if (list) drafts.push(list);
			continue;
		}
		for (const slot of node.slots) {
			const join = joinEntry(node.kind, slot);
			if (join) drafts.push(join);
			const choice = choiceEntry(node.kind, slot);
			if (choice) drafts.push(choice);
		}
	}
	drafts.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
	for (let i = 1; i < drafts.length; i++) {
		if (drafts[i]!.key === drafts[i - 1]!.key) {
			throw new Error(
				`options: two catalog entries share the key '${drafts[i]!.key}' (${drafts[i - 1]!.kind}, ${drafts[i]!.kind})`
			);
		}
	}
	return drafts.map((d, index) => ({ ...d, index }));
}

function listEntry(node: CatalogNode): Draft | null {
	const token = node.list!.separatorText;
	const base = token === undefined ? undefined : SPACED_SEPARATORS[token];
	const trailing = node.list!.trailing === 'optional';
	if (base === undefined && !trailing) return null;
	if (base === undefined) {
		return { key: node.kind, family: 'list', kind: node.kind, values: [], defaultValue: 'tight', trailing };
	}
	return {
		key: node.kind,
		family: 'list',
		kind: node.kind,
		values: [...WHITESPACE_CLASSES],
		defaultValue: 'tight',
		valueKinds: { tight: token!, space: `_${base}_space`, newline: `_${base}_newline` },
		trailing
	};
}

function isRepeated(v: CatalogValue): boolean {
	return v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray';
}

function joinEntry(kind: string, slot: CatalogSlot): Draft | null {
	if (slot.fieldName === undefined || slot.values.length === 0) return null;
	if (!slot.values.every((v) => isRepeated(v) && v.separator === undefined)) return null;
	return {
		key: `${kind}_${slot.fieldName}`,
		family: 'join',
		kind,
		slot: slot.fieldName,
		values: [...WHITESPACE_CLASSES],
		defaultValue: 'tight',
		valueKinds: { space: '_space', newline: '_newline' }
	};
}

function valueName(v: CatalogValue): string | undefined {
	return v.variant ?? v.literal ?? v.kind;
}

function choiceEntry(kind: string, slot: CatalogSlot): Draft | null {
	const declared = slot.values.find((v) => v.default === true);
	if (declared === undefined) return null;
	if (slot.values.every((v) => v.variantOf === kind)) return rootSplitEntry(kind, slot, declared);
	if (slot.fieldName === undefined) return null;
	const values = slot.values.map(valueName).filter((n): n is string => n !== undefined);
	const defaultValue = valueName(declared);
	if (defaultValue === undefined) return null;
	return { key: `${kind}_${slot.fieldName}`, family: 'choice', kind, slot: slot.fieldName, values, defaultValue };
}

function rootSplitEntry(kind: string, slot: CatalogSlot, declared: CatalogValue): Draft | null {
	if (slot.fieldName === undefined) return null;
	const valueKinds: Record<string, string> = {};
	for (const v of slot.values) if (v.kind !== undefined) valueKinds[v.variant!] = v.kind;
	return {
		key: `${kind}_${slot.fieldName}`,
		family: 'choice',
		kind,
		slot: slot.fieldName,
		values: slot.values.map((v) => v.variant!),
		defaultValue: declared.variant!,
		valueKinds
	};
}

function literal(s: string): string {
	return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function unionOf(values: readonly string[]): string {
	return values.map(literal).join(' | ');
}

export function emitOptions(config: { grammar: string; nodeMap: NodeMap }): string {
	return renderOptionsModule(deriveOptionCatalog(config.nodeMap));
}

export function renderOptionsModule(catalog: readonly OptionEntry[]): string {
	const lines: string[] = ['// Auto-generated by @sittir/codegen — do not edit', ''];
	lines.push('export interface Options {');
	for (const e of catalog) {
		if (e.family === 'list') {
			const parts: string[] = [];
			if (e.values.length > 0) parts.push(`readonly separator?: ${unionOf(e.values)};`);
			if (e.trailing) parts.push(`readonly trailing?: ${unionOf(TRAILING_POLICIES)};`);
			lines.push(`\treadonly ${e.key}?: { ${parts.join(' ')} };`);
		} else if (e.family === 'join') {
			lines.push(`\treadonly ${e.key}?: { readonly separator?: ${unionOf(e.values)} };`);
		} else {
			lines.push(`\treadonly ${e.key}?: ${unionOf(e.values)};`);
		}
	}
	lines.push('\treadonly indent?: string;');
	lines.push('}', '');
	lines.push("export type OptionFamily = 'choice' | 'list' | 'join';", '');
	lines.push('export interface OptionEntry {');
	lines.push('\treadonly key: string;');
	lines.push('\treadonly family: OptionFamily;');
	lines.push('\treadonly kind: string;');
	lines.push('\treadonly slot?: string;');
	lines.push('\treadonly index: number;');
	lines.push('\treadonly values: readonly string[];');
	lines.push('\treadonly defaultValue: string;');
	lines.push('\treadonly valueKinds?: Readonly<Record<string, string>>;');
	lines.push('\treadonly trailing?: boolean;');
	lines.push('}', '');
	lines.push('export const OPTION_CATALOG = [');
	for (const e of catalog) {
		const fields = [
			`key: ${literal(e.key)}`,
			`family: ${literal(e.family)}`,
			`kind: ${literal(e.kind)}`,
			...(e.slot === undefined ? [] : [`slot: ${literal(e.slot)}`]),
			`index: ${e.index}`,
			`values: [${e.values.map(literal).join(', ')}]`,
			`defaultValue: ${literal(e.defaultValue)}`,
			...(e.valueKinds === undefined
				? []
				: [
						`valueKinds: { ${Object.entries(e.valueKinds)
							.map(([k, v]) => `${literal(k)}: ${literal(v)}`)
							.join(', ')} }`
					]),
			...(e.trailing === undefined ? [] : [`trailing: ${e.trailing}`])
		];
		lines.push(`\t{ ${fields.join(', ')} },`);
	}
	lines.push('] as const satisfies readonly OptionEntry[];', '');
	lines.push('export const OPTION_INDEX: Readonly<Record<string, number>> = Object.fromEntries(');
	lines.push('\tOPTION_CATALOG.map((entry) => [entry.key, entry.index])');
	lines.push(');', '');
	return lines.join('\n');
}

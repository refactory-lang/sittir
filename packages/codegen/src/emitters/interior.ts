import { CHOICE, PATTERN, SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../types/rule.ts';
import { AbstractAssembledCompound, isRequired, type AssembledNode } from '../compiler/model/node-map.ts';
import { slotLiteralValues } from './shared.ts';

export type InteriorEntry =
	| { readonly lit: string }
	| { readonly flag: string; readonly text: string }
	| { readonly enum: string; readonly values: readonly string[]; readonly optional: boolean }
	| { readonly slot: string; readonly pattern: string };

export interface NodeInterior {
	readonly entries: readonly InteriorEntry[];
	readonly regex: string;
	readonly slots: readonly { readonly name: string; readonly configKey: string; readonly flag?: true }[];
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function interiorEnumArms(values: readonly string[]): string {
	return [...values].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
}

export function interiorEntryPattern(entry: InteriorEntry): string {
	if ('lit' in entry) return escapeRegex(entry.lit);
	if ('flag' in entry) return `(?<${entry.flag}>${escapeRegex(entry.text)})?`;
	if ('enum' in entry) {
		return `(?<${entry.enum}>${interiorEnumArms(entry.values)})${entry.optional ? '?' : ''}`;
	}
	return `(?<${entry.slot}>${entry.pattern})`;
}

function attrsOf(rule: RenderRule): { readonly fieldName?: string; readonly value?: string } {
	return rule as never;
}

function literalTexts(entry: InteriorEntry): readonly string[] {
	if ('lit' in entry) return [entry.lit];
	if ('flag' in entry) return [entry.text];
	if ('enum' in entry) return entry.values;
	return [];
}

function isOptionalLiteral(entry: InteriorEntry): boolean {
	return 'flag' in entry || ('enum' in entry && entry.optional);
}

function memberName(entry: InteriorEntry): string {
	if ('lit' in entry) return JSON.stringify(entry.lit);
	if ('flag' in entry) return entry.flag;
	return 'enum' in entry ? entry.enum : entry.slot;
}

export function assertUnambiguous(kind: string, entries: readonly InteriorEntry[]): void {
	entries.forEach((entry, i) => {
		const next = entries[i + 1];
		if (next === undefined || !isOptionalLiteral(entry)) return;
		for (const present of literalTexts(entry)) {
			for (const following of literalTexts(next)) {
				if (following.startsWith(present) || present.startsWith(following)) {
					throw new Error(
						`token interior: '${kind}' is ambiguous — ${memberName(entry)} (${JSON.stringify(present)}) and ${memberName(next)} (${JSON.stringify(following)}) are not distinguishable at their first differing character`
					);
				}
			}
		}
	});
}

function unsupported(kind: string, why: string): never {
	throw new Error(`token interior: '${kind}' is a lexed kind but ${why}`);
}

export function interiorOf(node: AssembledNode): NodeInterior | undefined {
	if (!(node instanceof AbstractAssembledCompound) || !node.lexedInterior) return undefined;
	const rule = node.renderRule;
	if (rule.type !== SEQ) unsupported(node.kind, `its render rule is a ${rule.type}, not a sequence of literals and slots`);
	const entries: InteriorEntry[] = [];
	for (const member of rule.members) {
		const { fieldName, value } = attrsOf(member);
		if (fieldName === undefined) {
			if (member.type !== STRING || value === undefined) unsupported(node.kind, `member of type ${member.type} is neither template text nor a slot`);
			entries.push({ lit: value });
			continue;
		}
		const slot = node.slots.find((s) => s.name === fieldName);
		if (slot === undefined) unsupported(node.kind, `member '${fieldName}' names no slot of the kind`);
		if (member.type === PATTERN && value !== undefined) entries.push({ slot: slot.name, pattern: value });
		else if (member.type === STRING && value !== undefined) entries.push({ flag: slot.name, text: value });
		else if (member.type === CHOICE) {
			entries.push({ enum: slot.name, values: [...new Set(slotLiteralValues(slot))], optional: !isRequired(slot) });
		} else unsupported(node.kind, `member '${fieldName}' of type ${member.type} is not a pattern, a literal or an enum of literals`);
	}
	assertUnambiguous(node.kind, entries);
	const configKeyOf = (name: string): string => node.slots.find((s) => s.name === name)!.configKey;
	const slots = entries.flatMap((entry) =>
		'lit' in entry
			? []
			: 'flag' in entry
				? [{ name: entry.flag, configKey: configKeyOf(entry.flag), flag: true as const }]
				: 'enum' in entry
					? [{ name: entry.enum, configKey: configKeyOf(entry.enum) }]
					: [{ name: entry.slot, configKey: configKeyOf(entry.slot) }]
	);
	return { entries, regex: `^${entries.map(interiorEntryPattern).join('')}$`, slots };
}

export function collectInteriors(nodeMap: { readonly nodes: ReadonlyMap<string, AssembledNode> }): Map<string, NodeInterior> {
	const out = new Map<string, NodeInterior>();
	for (const [kind, node] of nodeMap.nodes) {
		const interior = interiorOf(node);
		if (interior !== undefined) out.set(kind, interior);
	}
	return out;
}

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

export function interiorEntryPattern(entry: InteriorEntry): string {
	if ('lit' in entry) return escapeRegex(entry.lit);
	if ('flag' in entry) return `(?<${entry.flag}>${escapeRegex(entry.text)})?`;
	if ('enum' in entry) {
		const arms = [...entry.values].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
		return `(?<${entry.enum}>${arms})${entry.optional ? '?' : ''}`;
	}
	return `(?<${entry.slot}>${entry.pattern})`;
}

function attrsOf(rule: RenderRule): { readonly fieldName?: string; readonly value?: string } {
	return rule as never;
}

function optionalTexts(entry: InteriorEntry): readonly string[] {
	if ('flag' in entry) return [entry.text];
	if ('enum' in entry && entry.optional) return entry.values;
	return [];
}

function memberName(entry: InteriorEntry): string {
	if ('lit' in entry) return JSON.stringify(entry.lit);
	if ('flag' in entry) return entry.flag;
	return 'enum' in entry ? entry.enum : entry.slot;
}

export function assertUnambiguous(kind: string, entries: readonly InteriorEntry[]): void {
	entries.forEach((entry, i) => {
		const next = entries[i + 1];
		const prev = entries[i - 1];
		for (const text of optionalTexts(entry)) {
			if (next !== undefined && 'slot' in next && new RegExp('^(?:' + next.pattern + ')', 'su').test(text)) {
				throw new Error(
					`token interior: '${kind}' is ambiguous — ${memberName(entry)} (${JSON.stringify(text)}) is also a prefix of what ${memberName(next)} accepts`
				);
			}
			if (prev !== undefined && 'slot' in prev && new RegExp('^(?:' + prev.pattern + ')$', 'su').test(text)) {
				throw new Error(
					`token interior: '${kind}' is ambiguous — ${memberName(entry)} (${JSON.stringify(text)}) is also all that ${memberName(prev)} accepts`
				);
			}
		}
	});
}

export function interiorOf(node: AssembledNode): NodeInterior | undefined {
	if (!(node instanceof AbstractAssembledCompound) || !node.lexedInterior) return undefined;
	const rule = node.renderRule;
	if (rule.type !== SEQ) return undefined;
	const entries: InteriorEntry[] = [];
	for (const member of rule.members) {
		const { fieldName, value } = attrsOf(member);
		if (fieldName === undefined) {
			if (member.type !== STRING || value === undefined) return undefined;
			entries.push({ lit: value });
			continue;
		}
		const slot = node.slots.find((s) => s.name === fieldName);
		if (slot === undefined) return undefined;
		if (member.type === PATTERN && value !== undefined) entries.push({ slot: slot.name, pattern: value });
		else if (member.type === STRING && value !== undefined) entries.push({ flag: slot.name, text: value });
		else if (member.type === CHOICE) {
			entries.push({ enum: slot.name, values: [...new Set(slotLiteralValues(slot))], optional: !isRequired(slot) });
		} else return undefined;
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

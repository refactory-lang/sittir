import { CHOICE, PATTERN, SEQ, STRING } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule } from '../types/rule.ts';
import {
	AbstractAssembledCompound,
	AssembledNonterminal,
	AssembledPattern,
	isPatternValue,
	AssembledSupertype,
	isRequired,
	storageKindOfRef,
	type AssembledNode
} from '../compiler/model/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import { anchoredLeafRegex, lexedContentSlot, slotLiteralValues } from './shared.ts';

export type InteriorEntry =
	| { readonly lit: string }
	| { readonly flag: string; readonly text: string }
	| { readonly enum: string; readonly values: readonly string[]; readonly optional: boolean }
	| { readonly slot: string; readonly pattern: string; readonly optional?: true };

type InteriorNode = InteriorEntry | { readonly group: readonly InteriorNode[] };

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
	return `(?<${entry.slot}>${entry.pattern})${entry.optional === true ? '?' : ''}`;
}

function interiorNodePattern(node: InteriorNode): string {
	return 'group' in node ? `(?:${node.group.map(interiorNodePattern).join('')})?` : interiorEntryPattern(node);
}

function entryName(entry: InteriorEntry): string | undefined {
	if ('lit' in entry) return undefined;
	if ('flag' in entry) return entry.flag;
	return 'enum' in entry ? entry.enum : entry.slot;
}

function groupsOf(nodes: readonly InteriorNode[]): string[][] {
	return nodes.flatMap((node) =>
		'group' in node
			? [flattenNodes(node.group).flatMap((entry) => entryName(entry) ?? []), ...groupsOf(node.group)]
			: []
	);
}

function flattenNodes(nodes: readonly InteriorNode[]): InteriorEntry[] {
	return nodes.flatMap((node) => ('group' in node ? flattenNodes(node.group) : [node]));
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

type RenderMember = RenderRule & { readonly content?: RenderRule; readonly members?: readonly RenderRule[] };

function groupMembers(member: RenderMember): readonly RenderRule[] | undefined {
	return member.type === SEQ ? member.members : undefined;
}

function walkInterior(node: AbstractAssembledCompound, members: readonly RenderRule[]): InteriorNode[] {
	const out: InteriorNode[] = [];
	for (const member of members) {
		const { fieldName, value } = attrsOf(member);
		if (fieldName === undefined) {
			if (member.type === STRING && value !== undefined) {
				out.push({ lit: value });
				continue;
			}
			const inner = groupMembers(member as RenderMember);
			if (inner === undefined) unsupported(node.kind, `member of type ${member.type} is neither template text nor a slot`);
			out.push({ group: walkInterior(node, inner) });
			continue;
		}
		const slot = node.slots.find((s) => s.name === fieldName);
		if (slot === undefined) unsupported(node.kind, `member '${fieldName}' names no slot of the kind`);
		if (member.type === PATTERN && value !== undefined) out.push({ slot: slot.name, pattern: value, ...(isRequired(slot) ? {} : { optional: true as const }) });
		else if (member.type === STRING && value !== undefined) out.push({ flag: slot.name, text: value });
		else if (member.type === CHOICE && slot.values.length > 0 && slot.values.every(isPatternValue)) {
			out.push({ slot: slot.name, pattern: slot.values[0]!.pattern, optional: true });
		} else if (member.type === CHOICE) {
			out.push({ enum: slot.name, values: [...new Set(slotLiteralValues(slot))], optional: !isRequired(slot) });
		} else unsupported(node.kind, `member '${fieldName}' of type ${member.type} is not a pattern, a literal or an enum of literals`);
	}
	return out;
}

function interiorTreeOf(node: AssembledNode): InteriorNode[] | undefined {
	if (!(node instanceof AbstractAssembledCompound) || !node.lexedInterior) return undefined;
	const rule = node.renderRule;
	if (rule.type !== SEQ) unsupported(node.kind, `its render rule is a ${rule.type}, not a sequence of literals and slots`);
	return walkInterior(node, rule.members);
}

export function interiorOf(node: AssembledNode): NodeInterior | undefined {
	const tree = interiorTreeOf(node);
	if (tree === undefined || !(node instanceof AbstractAssembledCompound)) return undefined;
	const entries = flattenNodes(tree);
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
	return { entries, regex: `^${tree.map(interiorNodePattern).join('')}$`, slots };
}

export function optionalGroupPeers(node: AssembledNode, slotName: string): readonly string[] | undefined {
	const tree = interiorTreeOf(node);
	const group = tree === undefined ? undefined : groupsOf(tree).find((members) => members.includes(slotName));
	return group?.filter((name) => name !== slotName);
}

export function collectInteriors(nodeMap: { readonly nodes: ReadonlyMap<string, AssembledNode> }): Map<string, NodeInterior> {
	const out = new Map<string, NodeInterior>();
	for (const [kind, node] of nodeMap.nodes) {
		const interior = interiorOf(node);
		if (interior !== undefined) out.set(kind, interior);
	}
	return out;
}

export type NumberShape = { readonly base: 2 | 8 | 10 | 16; readonly prefix: string } | { readonly base: 'float'; readonly prefix: '' };
export type NumberSignature = 'decimal' | 'hex' | 'octal' | 'binary' | 'float';

const FLOAT_PROBES = ['1.5', '.5', '1e5', '1.5e5'] as const;

const INTEGER_BASES: readonly { readonly base: 2 | 8 | 10 | 16; readonly accepts: string; readonly rejects: string; readonly prefixes: readonly string[] }[] = [
	{ base: 16, accepts: 'ff', rejects: 'g', prefixes: ['0x', '0X', ''] },
	{ base: 10, accepts: '89', rejects: 'a', prefixes: [''] },
	{ base: 8, accepts: '77', rejects: '8', prefixes: ['0o', '0O', ''] },
	{ base: 2, accepts: '11', rejects: '2', prefixes: ['0b', '0B', ''] }
];

export function numberShape(pattern: RegExp): NumberShape | undefined {
	if (pattern.test('')) return undefined;
	for (const { base, accepts, rejects, prefixes } of INTEGER_BASES) {
		for (const prefix of prefixes) {
			if (pattern.test(`${prefix}${accepts}`) && !pattern.test(`${prefix}${rejects}`)) {
				return { base, prefix: prefix.toLowerCase() };
			}
		}
	}
	if (!pattern.test('a') && FLOAT_PROBES.some((text) => pattern.test(text))) return { base: 'float', prefix: '' };
	return undefined;
}

const SIGNATURE_OF_BASE = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hex', float: 'float' } as const;

export function numberSignature(pattern: RegExp): NumberSignature | undefined {
	const shape = numberShape(pattern);
	return shape === undefined ? undefined : SIGNATURE_OF_BASE[shape.base];
}

function interiorGuard(interior: NodeInterior): RegExp {
	return new RegExp(interior.regex, 'su');
}

function leafGuard(kind: string, node: AssembledNode): RegExp | undefined {
	if (!node.rawFactoryName || kind.startsWith('_')) return undefined;
	const interior = interiorOf(node);
	if (interior !== undefined) return interiorGuard(interior);
	return node instanceof AssembledPattern ? anchoredLeafRegex(kind, node.textPattern) : undefined;
}

export function numberSignatures(nodeMap: NodeMap): ReadonlyMap<string, NumberSignature> {
	const out = new Map<string, NumberSignature>();
	for (const [kind, node] of nodeMap.nodes) {
		const guard = leafGuard(kind, node);
		const signature = guard === undefined ? undefined : numberSignature(guard);
		if (signature !== undefined) out.set(kind, signature);
	}
	return out;
}

export function numericLeafKinds(nodeMap: NodeMap): readonly string[] {
	const defaults = new Set<string>();
	for (const node of nodeMap.nodes.values()) {
		if (!(node instanceof AssembledSupertype)) continue;
		const chosen = (node.variantSubtypes ?? []).find((ref) => ref.default === true);
		if (chosen !== undefined) defaults.add(storageKindOfRef(chosen.node));
	}
	const found = [...numberSignatures(nodeMap)].filter(([, signature]) => signature === 'decimal' || signature === 'float').map(([kind]) => kind);
	return [...found.filter((kind) => defaults.has(kind)), ...found.filter((kind) => !defaults.has(kind))];
}

export function numberShapeOfPattern(label: string, pattern: string): NumberShape | undefined {
	const guard = anchoredLeafRegex(label, pattern);
	return guard === undefined ? undefined : numberShape(guard);
}

export function numericSlotShape(slot: AssembledNonterminal): NumberShape | undefined {
	if (slot.values.length === 0 || !slot.values.every(isPatternValue)) return undefined;
	const patterns = new Set(slot.values.map((value) => value.pattern));
	if (patterns.size !== 1) return undefined;
	return numberShapeOfPattern(slot.name, [...patterns][0]!);
}

export function numericSlotKeys(node: AssembledNode): readonly string[] {
	return node.slots.filter((slot) => numericSlotShape(slot) !== undefined).map((slot) => slot.configKey);
}

export function numericLeafShape(kind: string, node: AssembledNode): NumberShape | undefined {
	if (!(node instanceof AssembledPattern) || node.textPattern === undefined) return undefined;
	return numberShapeOfPattern(kind, node.textPattern);
}

export interface BareInteriorText {
	readonly number: NumberShape | undefined;
}

export function bareInteriorText(kind: string, node: AssembledNode): BareInteriorText | undefined {
	if (lexedContentSlot(node) !== undefined) return undefined;
	const interior = interiorOf(node);
	if (interior === undefined) return undefined;
	return { number: numberShape(interiorGuard(interior)) };
}

export function numberTextArgs(shape: NumberShape): string {
	return `${JSON.stringify(shape.base)}, ${JSON.stringify(shape.prefix)}`;
}

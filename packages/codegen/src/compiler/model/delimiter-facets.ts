import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { emitShapeFailure } from '../diagnostics/emit-diagnostics.ts';
import type { RenderRule } from '../../types/rule.ts';
import { contentLeavesOf, freeTextOf } from './delimited.ts';
import {
	AbstractAssembledCompound,
	AssembledLeaf,
	AssembledLexedPattern,
	isNodeRef,
	isPatternValue,
	isTerminalValue,
	memberOf,
	storageKindOfRef,
	type AssembledNode,
	type AssembledNonterminal,
	type DelimiterArm,
	type DelimiterFacetRole,
	type DelimiterFacets,
	type DelimiterPreference,
	type FreeTextGate
} from './node-map.ts';
import type { NodeMap } from '../types.ts';

type Nodes = ReadonlyMap<string, AssembledNode>;

function delimiterTokenOf(member: RenderRule | undefined, nodes: Nodes): AssembledLexedPattern | undefined {
	if (member?.type !== SYMBOL || member.multiplicity !== undefined) return undefined;
	const node = nodes.get(member.name);
	return node instanceof AssembledLexedPattern && node.slots.length > 0 ? node : undefined;
}

function isEnumFacet(slot: AssembledNonterminal): boolean {
	return slot.values.length > 0 && slot.values.every(isTerminalValue);
}

function openRole(slot: AssembledNonterminal, close: AssembledLexedPattern): DelimiterFacetRole | undefined {
	if (slot.registeredOption !== undefined) return 'preferred';
	if (isEnumFacet(slot)) return 'input';
	const mirror = close.slots.find((other) => other.name === slot.name);
	return mirror !== undefined && !isEnumFacet(mirror) ? 'run' : undefined;
}

function closeRole(slot: AssembledNonterminal, open: AssembledLexedPattern): DelimiterFacetRole | undefined {
	const source = open.slots.find((other) => other.name === slot.name);
	if (source === undefined) return isEnumFacet(slot) ? undefined : 'content';
	return source.delimiterRole === 'preferred' || source.delimiterRole === 'run' ? 'mirror' : undefined;
}

function claim(owner: string, token: AssembledLexedPattern): void {
	if (token.delimiterOf !== undefined && token.delimiterOf !== owner) {
		throw emitShapeFailure({ code: 'delimiter-token-shared', message: `delimiters: '${token.kind}' delimits both '${token.delimiterOf}' and '${owner}'` });
	}
	token.delimiterOf = owner;
}

function stampRoles(owner: string, token: AssembledLexedPattern, roleOf: (slot: AssembledNonterminal) => DelimiterFacetRole | undefined): void {
	for (const slot of token.slots) {
		const role = roleOf(slot);
		if (role === undefined) {
			throw emitShapeFailure({ code: 'delimiter-facet-underivable', message: `delimiters: '${owner}' is delimited by '${token.kind}', whose facet '${slot.name}' is neither an input nor derivable` });
		}
		slot.delimiterRole = role;
	}
}

function derivedFacetOf(owner: string, token: AssembledLexedPattern): AssembledNonterminal {
	const derived = token.slots.filter((slot) => slot.delimiterRole === 'preferred' || slot.delimiterRole === 'run' || slot.delimiterRole === 'mirror');
	if (derived.length !== 1) throw emitShapeFailure({ code: 'delimiter-facet-count', message: `delimiters: '${owner}' derives ${derived.length} facets of '${token.kind}', where one is derivable` });
	return derived[0]!;
}

function armsOf(owner: string, facet: AssembledNonterminal): readonly DelimiterArm[] {
	if (facet.delimiterRole !== 'preferred') return [];
	const arms = facet.values
		.filter((value) => isTerminalValue(value) && memberOf(value) === value.value && value.readOnly !== true)
		.map((value) => ({ text: value.value!, singleLine: value.singleLine === true }));
	const preferred = arms.filter((arm) => arm.text === facet.optionDefaultArm);
	if (preferred.length !== 1) throw emitShapeFailure({ code: 'delimiter-preference-unbuildable', message: `delimiters: '${owner}' prefers '${facet.optionDefaultArm}' for '${facet.name}', which is not one of its buildable arms` });
	return [...preferred, ...arms.filter((arm) => arm.text !== facet.optionDefaultArm)];
}

interface Run {
	readonly char: string;
	readonly max?: number;
}

function runOf(owner: string, facet: AssembledNonterminal): Run | undefined {
	if (facet.delimiterRole !== 'run') return undefined;
	const pattern = facet.values.find(isPatternValue)?.pattern;
	const body = pattern === undefined ? undefined : (/^\(\?:(.*)\)$/u.exec(pattern)?.[1] ?? pattern);
	const match = body === undefined ? undefined : /^(\\?[^\\])(?:\*|\{0,(\d+)\})$/u.exec(body);
	const run = match?.[1];
	if (run === undefined) throw emitShapeFailure({ code: 'delimiter-run-not-repeated', message: `delimiters: '${owner}''s run '${facet.name}' is not one character repeated (${pattern})` });
	return { char: run.length === 2 ? run[1]! : run, ...(match?.[2] === undefined ? {} : { max: Number(match[2]) }) };
}

function membersOf(rule: RenderRule): readonly RenderRule[] {
	if (rule.type === SEQ) return rule.members;
	return 'content' in rule && rule.content !== undefined ? membersOf(rule.content as RenderRule) : [rule];
}

function leadOf(token: AssembledLexedPattern, facet: AssembledNonterminal): string {
	const members = membersOf(token.renderRule);
	const at = members.findIndex((member) => member.fieldName === facet.fieldName);
	return members
		.slice(0, at)
		.map((member) => (member.type === STRING && member.fieldName === undefined ? member.value : ''))
		.join('');
}

function escapeOf(facet: AssembledNonterminal): string | undefined {
	return facet.values.find((value) => value.escape !== undefined)?.escape;
}

function slotsOf(node: AbstractAssembledCompound, open: AssembledLexedPattern, close: AssembledLexedPattern): readonly [AssembledNonterminal, AssembledNonterminal] {
	const slotOf = (token: AssembledLexedPattern) => node.slots.find((slot) => slot.values.some((value) => isNodeRef(value) && storageKindOfRef(value.node) === token.kind));
	const openSlot = slotOf(open);
	const closeSlot = slotOf(close);
	if (openSlot === undefined || closeSlot === undefined) throw emitShapeFailure({ code: 'delimiter-tokens-unseated', message: `delimiters: '${node.kind}' holds its delimiter tokens in no slot` });
	return [openSlot, closeSlot];
}

function preferenceOf(openSlot: AssembledNonterminal, open: AssembledLexedPattern): DelimiterPreference | undefined {
	const facet = open.slots.find((slot) => slot.delimiterRole === 'preferred');
	return facet === undefined ? undefined : { open: openSlot, token: open, facet };
}

function gateOf(open: AssembledLexedPattern): FreeTextGate | undefined {
	const gates = open.slots.filter((slot) => slot.delimiterRole === 'input' && slot.values.some((value) => value.interpolating === true));
	if (gates.length > 1) throw emitShapeFailure({ code: 'delimiter-gate-ambiguous', message: `delimiters: '${open.kind}' gates its free text on ${gates.length} facets, where one may` });
	const facet = gates[0];
	const opening = facet?.values.filter((value) => value.interpolating === true) ?? [];
	return facet === undefined
		? undefined
		: {
				token: open.kind,
				facet: facet.name,
				spellings: opening.map((value) => value.value!),
				members: [...new Set(opening.map((value) => value.canonical ?? value.value!))]
			};
}

function stampContentLeaves(node: AbstractAssembledCompound, close: AssembledLexedPattern, nodes: Nodes): void {
	for (const facet of close.slots.filter((slot) => slot.delimiterRole === 'content')) {
		const pattern = facet.values.find(isPatternValue)?.pattern;
		const leaves = pattern === undefined ? [] : contentLeavesOf(node, nodes, pattern);
		if (leaves.length !== 1)
			throw emitShapeFailure({ code: 'delimiter-content-unreadable', message: `delimiters: '${node.kind}''s closer '${close.kind}' holds content in '${facet.name}', which ${leaves.length === 0 ? 'no content leaf' : `${leaves.length} content leaves (${leaves.join(', ')})`} reads, where one reads it` });
		facet.contentLeaf = leaves[0]!;
	}
}

function factsOf(node: AbstractAssembledCompound, open: AssembledLexedPattern, close: AssembledLexedPattern): DelimiterFacets {
	const [openSlot, closeSlot] = slotsOf(node, open, close);
	const facet = derivedFacetOf(node.kind, open);
	const mirror = derivedFacetOf(node.kind, close);
	const run = runOf(node.kind, facet);
	const escape = escapeOf(facet);
	return {
		open: openSlot.name,
		close: closeSlot.name,
		arms: armsOf(node.kind, facet),
		...(run === undefined ? {} : { run: run.char }),
		...(run?.max === undefined ? {} : { maxRun: run.max }),
		closeLead: leadOf(close, mirror),
		...(escape === undefined ? {} : { escape })
	};
}

function* delimitedPairs(nodes: Nodes): Generator<readonly [AbstractAssembledCompound, AssembledLexedPattern, AssembledLexedPattern]> {
	for (const node of nodes.values()) {
		if (!(node instanceof AbstractAssembledCompound) || node.renderRule.type !== SEQ) continue;
		const members = node.renderRule.members;
		const open = delimiterTokenOf(members[0], nodes);
		const close = delimiterTokenOf(members.at(-1), nodes);
		if (open !== undefined && close !== undefined && open !== close) yield [node, open, close];
	}
}

export function delimiterOwners(nodes: Nodes): ReadonlySet<string> {
	return new Set([...nodes.values()].flatMap((node) => (node instanceof AssembledLexedPattern && node.delimiterOf !== undefined ? [node.delimiterOf] : [])));
}

export function stampDelimiterTokens(nodes: Nodes): void {
	for (const [node, open, close] of delimitedPairs(nodes)) {
		claim(node.kind, open);
		claim(node.kind, close);
	}
}

export function stampDelimiterFacets(nodeMap: NodeMap): void {
	for (const [node, open, close] of delimitedPairs(nodeMap.nodes)) {
		claim(node.kind, open);
		claim(node.kind, close);
		stampRoles(node.kind, open, (slot) => openRole(slot, close));
		stampRoles(node.kind, close, (slot) => closeRole(slot, open));
		node.delimiterFacets = factsOf(node, open, close);
		node.delimiterPreference = preferenceOf(slotsOf(node, open, close)[0], open);
		stampContentLeaves(node, close, nodeMap.nodes);
		const freeText = freeTextOf(node, nodeMap.nodes, node.delimiterFacets.escape);
		const gate = gateOf(open);
		node.freeText = freeText === undefined || gate === undefined ? freeText : { ...freeText, gate };
		for (const leaf of node.freeText?.leaves ?? []) {
			const text = nodeMap.nodes.get(leaf);
			if (text instanceof AssembledLeaf) text.freeText = true;
		}
	}
}

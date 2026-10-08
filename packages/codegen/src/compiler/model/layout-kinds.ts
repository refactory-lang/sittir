import type { NodeMap } from '../types.ts';
import { AssembledLeaf, AssembledPattern, AssembledSupertype, isFixedTextLeaf } from './node-map.ts';
import { displayNameOf } from './display-name.ts';
import { DEPTH_KINDS, LAYOUT_SUPERTYPE, type Layout } from '../../dsl/primitives/spacing.ts';
import { CharSet, leadingChars, patternDfa, trailingChars } from './pattern-automaton.ts';
import { INDENT_MEMBERS, NEWLINE_MEMBER, SPACE_MEMBER, TIGHT_MEMBER } from '../../dsl/whitespace.ts';

export function declaresWhitespace(nodeMap: Pick<NodeMap, 'nodes'>): boolean {
	return nodeMap.nodes.get(LAYOUT_SUPERTYPE) instanceof AssembledSupertype;
}

export function layoutSymbolsOf(nodeMap: Pick<NodeMap, 'nodes'>): ReadonlyMap<string, string> {
	const node = nodeMap.nodes.get(LAYOUT_SUPERTYPE);
	if (!(node instanceof AssembledSupertype)) {
		throw new Error(`grammar: no '${LAYOUT_SUPERTYPE}' supertype lists the layout kinds`);
	}
	const parseNames = node.subtypeParseNames ?? {};
	return new Map(node.subtypeNames.map((name) => [parseNames[name] ?? displayNameOf(name, nodeMap), name]));
}

export function layoutKindsOf(nodeMap: NodeMap): readonly string[] {
	return [...layoutSymbolsOf(nodeMap).keys()];
}

export function whitespaceKindsOf(nodeMap: NodeMap): readonly string[] {
	return layoutKindsOf(nodeMap).filter((arm) => !(DEPTH_KINDS as readonly string[]).includes(arm));
}

export interface LineBreakingKinds {
	readonly arms: readonly string[];
	readonly defaultArm: Layout;
}

export function lineBreakingKinds(nodeMap: NodeMap): LineBreakingKinds {
	const symbols = layoutSymbolsOf(nodeMap);
	const textOf = (arm: string): string | undefined => {
		const node = nodeMap.nodes.get(symbols.get(arm)!);
		return node !== undefined && isFixedTextLeaf(node) ? node.text : undefined;
	};
	const arms = whitespaceKindsOf(nodeMap).filter((arm) => textOf(arm)?.includes('\n') === true);
	const defaultArm = arms.find((arm) => symbols.get(arm) === NEWLINE_MEMBER);
	if (defaultArm === undefined) {
		throw new Error(`grammar: a line-terminated trivia kind's after edge admits only line breaks, but '${LAYOUT_SUPERTYPE}' lists no '${NEWLINE_MEMBER}' to default to`);
	}
	return { arms, defaultArm };
}

export interface RootEdgeKinds {
	readonly before: Layout;
	readonly after: Layout;
}

export function rootEdgeKinds(nodeMap: NodeMap): RootEdgeKinds {
	const armOf = new Map([...layoutSymbolsOf(nodeMap)].map(([arm, symbol]) => [symbol, arm]));
	const tight = armOf.get(TIGHT_MEMBER);
	if (tight === undefined) throw new Error(`grammar: the root's edges default to '${TIGHT_MEMBER}', which '${LAYOUT_SUPERTYPE}' does not list`);
	if (nodeMap.fileTypes.length === 0) return { before: tight, after: tight };
	const newline = armOf.get(NEWLINE_MEMBER);
	if (newline === undefined) {
		throw new Error(`grammar: it declares file types, so its root ends in '${NEWLINE_MEMBER}', which '${LAYOUT_SUPERTYPE}' does not list`);
	}
	return { before: tight, after: newline };
}

export function defaultWhitespaceKindOf(nodeMap: NodeMap): Layout {
	const armOf = new Map([...layoutSymbolsOf(nodeMap)].map(([arm, symbol]) => [symbol, arm]));
	const arm = armOf.get(SPACE_MEMBER) ?? armOf.get(TIGHT_MEMBER);
	if (arm === undefined) throw new Error(`grammar: '${LAYOUT_SUPERTYPE}' lists neither '${SPACE_MEMBER}' nor '${TIGHT_MEMBER}'`);
	return arm;
}

export function indentChars(nodeMap: NodeMap): readonly string[] {
	if (!declaresWhitespace(nodeMap)) return [];
	const admitted = new Set(layoutSymbolsOf(nodeMap).values());
	return INDENT_MEMBERS.flatMap((member) => {
		const node = admitted.has(member) ? nodeMap.nodes.get(member) : undefined;
		return node !== undefined && isFixedTextLeaf(node) ? [node.text] : [];
	});
}

export function indentUnitOf(nodeMap: NodeMap, declared: string | undefined, grammar: string): string {
	const chars = indentChars(nodeMap);
	if (chars.length === 0) {
		if (declared !== undefined) throw new Error(`options: ${grammar} declares indent ${JSON.stringify(declared)} but its whitespace admits no indent characters`);
		return '';
	}
	if (declared === undefined) {
		throw new Error(`options: ${grammar} admits indent characters ${JSON.stringify(chars)} but declares no indent; add indent: preference(unit) to its options`);
	}
	if (declared === '' || ![...declared].every((c) => chars.includes(c))) {
		throw new Error(`options: ${grammar} indent ${JSON.stringify(declared)} is not one or more of ${JSON.stringify(chars)}`);
	}
	return declared;
}

export const LAYOUT_KIND_BITS: Readonly<Record<string, number>> = {
	_tight: 1 << 0,
	_space: 1 << 1,
	_tab: 1 << 2,
	_newline: 1 << 3,
	_blankline: 1 << 4,
	_double_blankline: 1 << 5
};

export interface LeafEdges {
	readonly leading: number;
	readonly trailing: number;
}

export function leafEdgesOf(node: AssembledLeaf, nodeMap: NodeMap): LeafEdges | undefined {
	if (!declaresWhitespace(nodeMap)) return undefined;
	const gaps = [...layoutSymbolsOf(nodeMap).values()].flatMap((symbol) => {
		const bit = LAYOUT_KIND_BITS[symbol];
		const member = nodeMap.nodes.get(symbol);
		return bit !== undefined && member !== undefined && isFixedTextLeaf(member) ? [{ bit, text: member.text }] : [];
	});
	const all = gaps.reduce((set, { bit }) => set | bit, 0);
	const pattern = node instanceof AssembledPattern ? node.textPattern : undefined;
	const dfa = pattern === undefined ? undefined : patternDfa(pattern);
	const accepts = (edge: CharSet | undefined): number =>
		edge === undefined
			? all
			: gaps.reduce((set, { bit, text }) => (text !== '' && [...text].every((c) => edge.has(c.codePointAt(0)!)) ? set : set | bit), 0);
	const leading = node.immediate ? (gaps.find(({ text }) => text === '')?.bit ?? 0) : accepts(dfa && leadingChars(dfa));
	const trailing = accepts(dfa && trailingChars(dfa));
	return leading === all && trailing === all ? undefined : { leading, trailing };
}

const LAYOUT_KINDS_PATH = '::sittir_core::layout_kinds::LayoutKinds';

export const TIGHT_KINDS = `${LAYOUT_KINDS_PATH}::TIGHT`;
export const NEWLINE_KINDS = `${LAYOUT_KINDS_PATH}::NEWLINE`;
export const SEPARATING_KINDS = `${LAYOUT_KINDS_PATH}::SEPARATING`;
export const CONTINUATION_KINDS = `${LAYOUT_KINDS_PATH}::LINE_CONTINUATION`;
export const NO_KINDS = `${LAYOUT_KINDS_PATH}::NONE`;

export function layoutKindsOfText(text: string): string {
	const breaks = [...text].filter((c) => c === '\n').length;
	if (breaks === 0) return `${LAYOUT_KINDS_PATH}::${text === '' ? 'TIGHT' : text.includes('\t') ? 'TAB' : 'SPACE'}`;
	return `${LAYOUT_KINDS_PATH}::${breaks === 1 ? 'NEWLINE' : breaks === 2 ? 'BLANKLINE' : 'DOUBLE_BLANKLINE'}`;
}

export function breakingKindsOfText(text: string): string {
	const breaks = Math.min(3, Math.max(1, [...text].filter((c) => c === '\n').length));
	return `${LAYOUT_KINDS_PATH}::from_bits(${0x78 & ~((8 << (breaks - 1)) - 1)})`;
}

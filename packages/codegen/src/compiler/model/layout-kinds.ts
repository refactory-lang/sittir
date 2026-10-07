import type { NodeMap } from '../types.ts';
import { AssembledSupertype, isFixedTextLeaf } from './node-map.ts';
import { displayNameOf } from './display-name.ts';
import { DEPTH_KINDS, LAYOUT_SUPERTYPE, type Layout } from '../../dsl/primitives/spacing.ts';
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

import type { NodeMap } from '../types.ts';
import { AssembledSupertype, isFixedTextLeaf } from './node-map.ts';
import { displayNameOf } from './display-name.ts';
import { DEPTH_ARMS, WHITESPACE_SUPERTYPE, type WhitespaceArm } from '../../dsl/primitives/spacing.ts';
import { INDENT_MEMBERS, NEWLINE_MEMBER, SPACE_MEMBER, TIGHT_MEMBER } from '../../dsl/whitespace.ts';

export function declaresWhitespace(nodeMap: Pick<NodeMap, 'nodes'>): boolean {
	return nodeMap.nodes.get(WHITESPACE_SUPERTYPE) instanceof AssembledSupertype;
}

export function whitespaceSymbolsOf(nodeMap: Pick<NodeMap, 'nodes'>): ReadonlyMap<string, string> {
	const node = nodeMap.nodes.get(WHITESPACE_SUPERTYPE);
	if (!(node instanceof AssembledSupertype)) {
		throw new Error(`grammar: no '${WHITESPACE_SUPERTYPE}' supertype lists the whitespace kinds`);
	}
	const parseNames = node.subtypeParseNames ?? {};
	return new Map(node.subtypeNames.map((name) => [parseNames[name] ?? displayNameOf(name, nodeMap), name]));
}

export function whitespaceArmsOf(nodeMap: NodeMap): readonly string[] {
	return [...whitespaceSymbolsOf(nodeMap).keys()];
}

export function spacingArmsOf(nodeMap: NodeMap): readonly string[] {
	return whitespaceArmsOf(nodeMap).filter((arm) => !(DEPTH_ARMS as readonly string[]).includes(arm));
}

export interface LineBreakingArms {
	readonly arms: readonly string[];
	readonly defaultArm: WhitespaceArm;
}

export function lineBreakingArms(nodeMap: NodeMap): LineBreakingArms {
	const symbols = whitespaceSymbolsOf(nodeMap);
	const textOf = (arm: string): string | undefined => {
		const node = nodeMap.nodes.get(symbols.get(arm)!);
		return node !== undefined && isFixedTextLeaf(node) ? node.text : undefined;
	};
	const arms = spacingArmsOf(nodeMap).filter((arm) => textOf(arm)?.includes('\n') === true);
	const defaultArm = arms.find((arm) => symbols.get(arm) === NEWLINE_MEMBER);
	if (defaultArm === undefined) {
		throw new Error(`grammar: a line-terminated trivia kind's after edge admits only line breaks, but '${WHITESPACE_SUPERTYPE}' lists no '${NEWLINE_MEMBER}' to default to`);
	}
	return { arms, defaultArm };
}

export interface RootEdgeArms {
	readonly before: WhitespaceArm;
	readonly after: WhitespaceArm;
}

export function rootEdgeArms(nodeMap: NodeMap): RootEdgeArms {
	const armOf = new Map([...whitespaceSymbolsOf(nodeMap)].map(([arm, symbol]) => [symbol, arm]));
	const tight = armOf.get(TIGHT_MEMBER);
	if (tight === undefined) throw new Error(`grammar: the root's edges default to '${TIGHT_MEMBER}', which '${WHITESPACE_SUPERTYPE}' does not list`);
	if (nodeMap.fileTypes.length === 0) return { before: tight, after: tight };
	const newline = armOf.get(NEWLINE_MEMBER);
	if (newline === undefined) {
		throw new Error(`grammar: it declares file types, so its root ends in '${NEWLINE_MEMBER}', which '${WHITESPACE_SUPERTYPE}' does not list`);
	}
	return { before: tight, after: newline };
}

export function defaultWhitespaceArmOf(nodeMap: NodeMap): WhitespaceArm {
	const armOf = new Map([...whitespaceSymbolsOf(nodeMap)].map(([arm, symbol]) => [symbol, arm]));
	const arm = armOf.get(SPACE_MEMBER) ?? armOf.get(TIGHT_MEMBER);
	if (arm === undefined) throw new Error(`grammar: '${WHITESPACE_SUPERTYPE}' lists neither '${SPACE_MEMBER}' nor '${TIGHT_MEMBER}'`);
	return arm;
}

export function indentChars(nodeMap: NodeMap): readonly string[] {
	if (!declaresWhitespace(nodeMap)) return [];
	const admitted = new Set(whitespaceSymbolsOf(nodeMap).values());
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

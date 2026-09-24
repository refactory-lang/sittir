import type { NodeMap } from '../types.ts';
import { AssembledSupertype } from './node-map.ts';
import { displayNameOf } from './display-name.ts';
import { DEPTH_ARMS, WHITESPACE_SUPERTYPE } from '../../dsl/primitives/spacing.ts';

export function whitespaceSymbolsOf(nodeMap: NodeMap): ReadonlyMap<string, string> {
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

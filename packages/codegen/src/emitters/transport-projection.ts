import type { NodeMap } from '../compiler/types.ts';
import { assertNever } from '../polymorph-variant.ts';
import type {
	AssembledNonterminal,
	
	AssembledNode,
	NodeOrTerminal
} from '../compiler/node-map.ts';
import {
	isTerminalValue,
	allFormFieldsOf,
	allFormChildrenOf
} from '../compiler/node-map.ts';
import {
	fieldTypeComponents,
	resolveHiddenKeywordLiteral
} from './shared.ts';

export interface TransportLiteral {
	readonly kind: string;
	readonly text: string;
}

export interface TransportProjection {
	readonly nodes: readonly AssembledNode[];
	readonly literals: readonly TransportLiteral[];
	readonly nodeKinds: ReadonlySet<string>;
}

export function collectTransportProjection(
	nodeMap: NodeMap
): TransportProjection {
	const nodes = collectTransportNodes(nodeMap);
	const nodeKinds = new Set(nodes.map((node) => node.kind));
	const literals = collectTransportLiterals(nodes, nodeMap, nodeKinds);
	return { nodes, literals, nodeKinds };
}

export function resolveTransportReferenceKind(
	kind: string,
	nodeMap: NodeMap
): string {
	const node = nodeMap.nodes.get(kind);
	if (node && isConcreteTransportNode(node, nodeMap)) return kind;
	if (!kind.startsWith('_')) return kind;

	const visibleKind = kind.replace(/^_+/, '');
	const visibleNode = nodeMap.nodes.get(visibleKind);
	if (visibleNode && isConcreteTransportNode(visibleNode, nodeMap)) {
		return visibleKind;
	}
	return kind;
}

function collectTransportNodes(nodeMap: NodeMap): AssembledNode[] {
	const nodes: AssembledNode[] = [];
	const seenTypeNames = supertypeTransportTypeNames(nodeMap);
	for (const [, node] of nodeMap.nodes) {
		if (!isConcreteTransportNode(node, nodeMap)) continue;
		if (seenTypeNames.has(node.typeName)) continue;
		seenTypeNames.add(node.typeName);
		nodes.push(node);
	}
	return nodes;
}

function isConcreteTransportNode(
	node: AssembledNode,
	nodeMap: NodeMap
): boolean {
	switch (node.modelType) {
		case 'branch':
		case 'polymorph':
		case 'leaf':
		case 'keyword':
		case 'token':
		case 'enum':
			return true;
		case 'group':
			return !nodeMap.polymorphFormKinds.has(node.kind);
		case 'supertype':
		case 'multi':
			return false;
		default:
			return assertNever(node);
	}
}

function collectTransportLiterals(
	nodes: readonly AssembledNode[],
	nodeMap: NodeMap,
	nodeKinds: ReadonlySet<string>
): TransportLiteral[] {
	const literals: TransportLiteral[] = [];
	const seen = new Set<string>();
	const add = (literal: TransportLiteral): void => {
		if (nodeKinds.has(literal.kind)) return;
		const key = `${literal.kind}\0${literal.text}`;
		if (seen.has(key)) return;
		seen.add(key);
		literals.push(literal);
	};

	for (const node of nodes) {
		for (const field of allFormFieldsOf(node)) {
			for (const literal of fieldTransportLiterals(field, nodeMap))
				add(literal);
		}
		for (const child of allFormChildrenOf(node)) {
			for (const literal of childTransportLiterals(child)) add(literal);
		}
	}
	return literals;
}

function fieldTransportLiterals(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): TransportLiteral[] {
	return fieldTypeComponents(field, nodeMap).flatMap((component) => {
		if (component.kind === 'literal') {
			return [{ kind: component.value, text: component.value }];
		}
		const literal = terminalTransportLiteralForKind(
			component.rawKind,
			nodeMap
		);
		return literal === undefined ? [] : [literal];
	});
}

function childTransportLiterals(child: AssembledNonterminal): TransportLiteral[] {
	return child.values.flatMap((value) => {
		const literal = literalForSlotValue(value);
		return literal === undefined ? [] : [literal];
	});
}

function literalForSlotValue(
	value: NodeOrTerminal
): TransportLiteral | undefined {
	if (isTerminalValue(value)) {
		return { kind: value.value, text: value.value };
	}
	return undefined;
}

function supertypeTransportTypeNames(nodeMap: NodeMap): Set<string> {
	const names = new Set<string>();
	for (const [, node] of nodeMap.nodes) {
		if (node.modelType === 'supertype') names.add(node.typeName);
	}
	return names;
}

function terminalTransportLiteralForKind(
	kind: string,
	nodeMap: NodeMap
): TransportLiteral | undefined {
	const hiddenLiteral = resolveHiddenKeywordLiteral(kind, nodeMap);
	if (hiddenLiteral !== undefined) return { kind, text: hiddenLiteral };
	const node = nodeMap.nodes.get(kind);
	switch (node?.modelType) {
		case 'keyword':
			return { kind, text: node.text };
		case 'token':
			return node.text === undefined ? undefined : { kind, text: node.text };
		default:
			return undefined;
	}
}

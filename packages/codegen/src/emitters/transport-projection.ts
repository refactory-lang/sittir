import type { NodeMap } from '../compiler/types.ts';
import { assertNever } from '../polymorph-variant.ts';
import type { AssembledNonterminal, AssembledNode } from '../compiler/model/node-map.ts';
import { AssembledSupertype, isKindIdStored, storageTargetOf } from '../compiler/model/node-map.ts';
import { fieldTypeComponents } from './shared.ts';

export interface TransportLiteral {
	readonly kind: string;
	readonly text: string;
	readonly resolvedKindId?: number;
	readonly immediate?: boolean;
}

export interface TransportProjection {
	readonly nodes: readonly AssembledNode[];
	readonly literals: readonly TransportLiteral[];
	readonly nodeKinds: ReadonlySet<string>;
}

export function collectTransportProjection(nodeMap: NodeMap): TransportProjection {
	const nodes = collectTransportNodes(nodeMap);
	const nodeKinds = new Set(nodes.map((node) => node.kind));
	const literals = collectTransportLiterals(nodes, nodeMap, nodeKinds);
	return { nodes, literals, nodeKinds };
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

function isConcreteTransportNode(node: AssembledNode, nodeMap: NodeMap): boolean {
	switch (node.modelType) {
		case 'pattern':
		case 'token':
		case 'enum':
		case 'list':
			return true;
		case 'branch':
		case 'envelope':
			return node.hoisted ? !nodeMap.polymorphFormKinds.has(node.kind) : true;
		case 'polymorph':
			return node.hoisted ? !nodeMap.polymorphFormKinds.has(node.kind) : true;
		case 'supertype':
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
	const add = (literal: TransportLiteral, skipIfNodeKind: boolean): void => {
		if (skipIfNodeKind && nodeKinds.has(literal.kind)) return;
		const key = `${literal.kind}\0${literal.text}`;
		if (seen.has(key)) return;
		seen.add(key);
		literals.push(literal);
	};

	for (const node of nodes) {
		for (const field of node.slots) {
			for (const { literal, fromKind } of fieldTransportLiterals(field, nodeMap)) add(literal, fromKind);
		}
	}
	return literals;
}

function fieldTransportLiterals(
	field: AssembledNonterminal,
	nodeMap: NodeMap
): Array<{ literal: TransportLiteral; fromKind: boolean }> {
	return fieldTypeComponents(field, nodeMap).flatMap(
		(component): Array<{ literal: TransportLiteral; fromKind: boolean }> => {
			if (component.kind === 'literal') {
				return [
					{
						literal: {
							kind: component.rawKind ?? component.value,
							text: component.value,
							resolvedKindId: component.resolvedKindId,
							immediate: component.immediate
						},
						fromKind: false
					}
				];
			}
			const literal = terminalTransportLiteralForKind(component.rawKind, nodeMap);
			return literal === undefined ? [] : [{ literal, fromKind: true }];
		}
	);
}

function supertypeTransportTypeNames(nodeMap: NodeMap): Set<string> {
	const names = new Set<string>();
	for (const [, node] of nodeMap.nodes) {
		if (node instanceof AssembledSupertype) names.add(node.typeName);
	}
	return names;
}

function terminalTransportLiteralForKind(kind: string, nodeMap: NodeMap): TransportLiteral | undefined {
	const node = nodeMap.nodes.get(kind);
	if (node === undefined) return undefined;
	const target = storageTargetOf(node, nodeMap);
	if (!isKindIdStored(target)) return undefined;
	return { kind, text: target.text, resolvedKindId: target.resolvedKindId };
}

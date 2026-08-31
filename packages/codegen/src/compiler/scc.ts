import type { NodeMap } from './types.ts';
import {
	kindsOf,
	isMultiple,
	AssembledSupertype,
	type AssembledNode,
	type AssembledNonterminal
} from './model/node-map.ts';
import { classifySlot, buildSupertypeTransportSet } from '../emitters/transport-common.ts';

export interface SCCAnalysis {
	readonly sccId: ReadonlyMap<string, number>;
	readonly recursive: ReadonlySet<string>;
	sameSCC(kindA: string, kindB: string): boolean;
}

export function computeTransportSCC(nodeMap: NodeMap): SCCAnalysis {
	const adjacency = buildSingularAdjacency(nodeMap);
	const { sccId, sccs } = tarjanSCC(adjacency);

	const recursive = new Set<string>();
	for (const scc of sccs) {
		if (scc.length > 1) {
			for (const k of scc) recursive.add(k);
			continue;
		}
		const only = scc[0]!;
		const outs = adjacency.get(only);
		if (outs && outs.has(only)) recursive.add(only);
	}

	const result: SCCAnalysis = {
		sccId,
		recursive,
		sameSCC(kindA: string, kindB: string): boolean {
			const a = sccId.get(kindA);
			if (a === undefined) return false;
			const b = sccId.get(kindB);
			if (b === undefined) return false;
			return a === b;
		}
	};
	return result;
}

function buildSingularAdjacency(nodeMap: NodeMap): Map<string, Set<string>> {
	const adjacency = new Map<string, Set<string>>();
	const addEdge = (from: string, to: string): void => {
		let outs = adjacency.get(from);
		if (outs === undefined) {
			outs = new Set();
			adjacency.set(from, outs);
		}
		outs.add(to);
	};

	const supertypeMap = buildSupertypeTransportSet(nodeMap);

	const kindOfTypeName = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node instanceof AssembledSupertype) {
			kindOfTypeName.set(node.typeName, kind);
		}
	}

	for (const [kind, node] of nodeMap.nodes) {
		if (!adjacency.has(kind)) adjacency.set(kind, new Set());

		if (node instanceof AssembledSupertype) {
			const supertype = node as AssembledSupertype;
			for (const subKind of supertype.subtypeNames) {
				addEdge(kind, subKind);
			}
			continue;
		}

		for (const slot of structuralSingularSlots(node)) {
			const slotKinds = kindsOf(slot);
			if (slotKinds.length === 0) continue;
			const cls = classifySlot(slotKinds, supertypeMap);
			if (cls.tag === 'concrete') {
				addEdge(kind, cls.kind);
				continue;
			}
			if (cls.tag === 'supertype') {
				const supertypeKind = kindOfTypeName.get(cls.supertypeName);
				if (supertypeKind !== undefined) {
					addEdge(kind, supertypeKind);
				} else {
					for (const k of slotKinds) addEdge(kind, k);
				}
				continue;
			}
			for (const k of slotKinds) addEdge(kind, k);
		}
	}

	return adjacency;
}

function structuralSingularSlots(node: AssembledNode): readonly AssembledNonterminal[] {
	return node.slots.filter((slot) => !isMultiple(slot));
}

function tarjanSCC(adjacency: ReadonlyMap<string, ReadonlySet<string>>): {
	sccId: Map<string, number>;
	sccs: string[][];
} {
	const sccId = new Map<string, number>();
	const sccs: string[][] = [];

	const index = new Map<string, number>();
	const lowlink = new Map<string, number>();
	const onStack = new Set<string>();
	const stack: string[] = [];
	let counter = 0;

	type Frame = {
		readonly node: string;
		readonly neighbors: string[];
		i: number;
	};

	const strongConnect = (start: string): void => {
		const callStack: Frame[] = [];
		const enter = (n: string): void => {
			index.set(n, counter);
			lowlink.set(n, counter);
			counter += 1;
			stack.push(n);
			onStack.add(n);
			callStack.push({
				node: n,
				neighbors: [...(adjacency.get(n) ?? [])],
				i: 0
			});
		};
		enter(start);

		while (callStack.length > 0) {
			const frame = callStack[callStack.length - 1]!;
			if (frame.i < frame.neighbors.length) {
				const w = frame.neighbors[frame.i]!;
				frame.i += 1;
				if (!index.has(w)) {
					enter(w);
				} else if (onStack.has(w)) {
					const cur = lowlink.get(frame.node)!;
					const wi = index.get(w)!;
					if (wi < cur) lowlink.set(frame.node, wi);
				}
			} else {
				const v = frame.node;
				if (lowlink.get(v) === index.get(v)) {
					const component: string[] = [];
					const componentId = sccs.length;
					// eslint-disable-next-line no-constant-condition
					while (true) {
						const w = stack.pop()!;
						onStack.delete(w);
						component.push(w);
						sccId.set(w, componentId);
						if (w === v) break;
					}
					sccs.push(component);
				}
				callStack.pop();
				if (callStack.length > 0) {
					const parent = callStack[callStack.length - 1]!;
					const childLow = lowlink.get(v)!;
					const parentLow = lowlink.get(parent.node)!;
					if (childLow < parentLow) lowlink.set(parent.node, childLow);
				}
			}
		}
	};

	for (const node of adjacency.keys()) {
		if (!index.has(node)) strongConnect(node);
	}

	return { sccId, sccs };
}

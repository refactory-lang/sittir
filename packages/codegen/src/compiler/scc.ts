/**
 * compiler/scc.ts — Strongly Connected Components over the
 * "singular transport reference" graph.
 *
 * Purpose: replace the conservative Box-everything-non-leaf rule used by
 * render-module.ts for per-slot and supertype transport enum variants
 * with a precise rule:
 *
 *     Box variant V in enum E iff V and E's owner kind are in the same
 *     SCC of the singular-reference graph.
 *
 * Background
 * ----------
 * Rust enum variants need `Box<T>` only to break size cycles. A field
 * typed `Vec<T>` is sized regardless of `T` (Vec = three pointers), so
 * Vec slots never propagate size dependencies and are excluded from the
 * graph. Per-slot enums are unique per (parent_kind, slot_name) — so
 * `TuplePatternPatternTransportSlot` (used by `tuple_pattern`'s patterns
 * slot) and `ParameterPatternTransportSlot` (used by `parameter`'s
 * pattern slot) are DISTINCT types, and a non-leaf variant in one need
 * not be boxed merely because its struct could indirectly contain "some
 * pattern enum" — it only matters if it can reach back to the
 * particular enum's owner via singular references.
 *
 * Graph construction
 * ------------------
 * Nodes: every kind in `nodeMap.nodes`. The graph models *singular*
 * (non-Vec) transport references; Vec-shaped slots are excluded
 * because `Vec<T>` has fixed size regardless of `T`.
 *
 * Slot classification follows `transport-common.ts::classifySlot`, the
 * authoritative renderer-side decision:
 *   1. Single-kind slot → concrete; add edge A → k.
 *   2. Multi-kind subset of supertype S → supertype enum; add edge A → S
 *      (supertype acts as a relay; the supertype's own subtype edges
 *      below carry it to the concrete subkinds).
 *   3. Multi-kind, no covering supertype → per-slot enum owned by A;
 *      add edge A → each variant kind directly. Per-slot enums are
 *      unique per (A, slot), so the cycle question is "does V reach A?"
 *      and the SCC predicate `sameSCC(V, A)` resolves it.
 *
 * Supertype relay edges:
 *   - For each supertype S in the NodeMap, add S → sub for every
 *     resolved subtype `sub`. A field typed `<S>Transport` is
 *     effectively a singular reference to any subkind of S — the
 *     supertype kind acts as a relay node so per-variant SCC analysis
 *     correctly captures size cycles passing through supertype enums.
 *
 * SCC: Tarjan's classic algorithm (iterative). A kind is "recursive"
 * iff its SCC has size > 1, OR it forms a singleton SCC with a
 * self-edge (A → A).
 */

import type { NodeMap } from './types.ts';
import {
	isMultiple,
	kindsOf,
	type AssembledNode,
	type AssembledNonterminal,
	type AssembledSupertype
} from './node-map.ts';
import { classifySlot, buildSupertypeTransportSet } from '../emitters/transport-common.ts';

export interface SCCAnalysis {
	readonly sccId: ReadonlyMap<string, number>;
	readonly recursive: ReadonlySet<string>;
	sameSCC(kindA: string, kindB: string): boolean;
}

/**
 * Compute SCCs over the singular-reference transport graph (see file
 * docstring). Returns a frozen analysis object that emitters consult
 * for their Box / inline decisions.
 */
export function computeTransportSCC(nodeMap: NodeMap): SCCAnalysis {
	const adjacency = buildSingularAdjacency(nodeMap);
	const { sccId, sccs } = tarjanSCC(adjacency);

	const recursive = new Set<string>();
	for (const scc of sccs) {
		if (scc.length > 1) {
			for (const k of scc) recursive.add(k);
			continue;
		}
		// Singleton SCC — recursive only when it has a self-edge.
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

/**
 * Build the adjacency map: kind → set of kinds reachable via a single
 * singular-reference hop. Slot classification mirrors the renderer's
 * `classifySlot` so the graph reflects the actual emitted field type
 * (concrete struct / supertype enum / per-slot enum).
 */
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

	// supertype map: typeName → resolved subtype set. Authoritative
	// renderer-side mapping; we re-use it so the graph matches what
	// `classifySlot` actually emits at the field-type site.
	const supertypeMap = buildSupertypeTransportSet(nodeMap);

	// Index typeName → kind so we can resolve `classifySlot` results
	// (which return supertype `typeName`) back to a kind for edge
	// emission.
	const kindOfTypeName = new Map<string, string>();
	for (const [kind, node] of nodeMap.nodes) {
		if (node.modelType === 'supertype') {
			kindOfTypeName.set(node.typeName, kind);
		}
	}

	for (const [kind, node] of nodeMap.nodes) {
		// Ensure node appears in adjacency even if it has no edges.
		if (!adjacency.has(kind)) adjacency.set(kind, new Set());

		if (node.modelType === 'supertype') {
			// Supertype kind relays to each of its resolved subtype kinds.
			// A field typed `<Supertype>Transport` is effectively a singular
			// reference to any subkind.
			const supertype = node as AssembledSupertype;
			for (const subKind of supertype.subtypes) {
				addEdge(kind, subKind);
			}
			continue;
		}

		// Structural shapes: branch / group / polymorph carry slots.
		// Multi / leaf / pattern / keyword / token / enum carry no
		// singular structural slots that own transport struct fields.
		for (const slot of structuralSingularSlots(node)) {
			const slotKinds = kindsOf(slot);
			if (slotKinds.length === 0) continue;
			const cls = classifySlot(slotKinds, supertypeMap);
			if (cls.tag === 'concrete') {
				addEdge(kind, cls.kind);
				continue;
			}
			if (cls.tag === 'supertype') {
				// Field type is the supertype enum — graph edge points at the
				// supertype kind, which carries onward relay edges to subkinds.
				const supertypeKind = kindOfTypeName.get(cls.supertypeName);
				if (supertypeKind !== undefined) {
					addEdge(kind, supertypeKind);
				} else {
					// Fall back to direct edges if the supertype kind isn't
					// resolvable (shouldn't happen in practice).
					for (const k of slotKinds) addEdge(kind, k);
				}
				continue;
			}
			// Heterogeneous: per-slot enum owned by this kind. Variants are
			// the slot's concrete kinds — edge from the owner to each.
			for (const k of slotKinds) addEdge(kind, k);
		}
	}

	return adjacency;
}

/**
 * The structural singular slots on a node, i.e. slots that map to a
 * non-Vec transport struct field. Multiple-arity slots are excluded —
 * `Vec<T>` is sized regardless of `T` and therefore never propagates
 * size dependencies.
 */
function structuralSingularSlots(node: AssembledNode): readonly AssembledNonterminal[] {
	let slots: readonly AssembledNonterminal[];
	if (node.modelType === 'branch' || node.modelType === 'group') {
		slots = Object.values(node.slots);
	} else {
		return [];
	}
	return slots.filter((slot) => !isMultiple(slot));
}

/**
 * Tarjan's classic SCC algorithm. Iterative formulation to avoid stack
 * overflow on large grammars.
 *
 * Returns:
 *   - sccId: map from each node to its SCC index
 *   - sccs:  list of SCCs, each as an array of node names
 */
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
				// All neighbors visited — possibly emit SCC.
				const v = frame.node;
				if (lowlink.get(v) === index.get(v)) {
					const component: string[] = [];
					const componentId = sccs.length;
					// Pop until we get v.
					// Guarded loop — must terminate since v is on stack.
					// Bounded by stack size (the count of nodes pushed
					// since v was pushed).
					// (cleanup-rules: no defensive infinite loops; stack
					// invariant guarantees v's presence.)
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

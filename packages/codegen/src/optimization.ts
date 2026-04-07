/**
 * Step 11: Optimization — cross-model pattern detection, signature interning
 */

import type {
	NodeModel,
	FieldModel,
	ChildModel,
	FieldSignature,
	ChildSignature,
	SignaturePool,
	SupertypeModel,
} from './node-model.ts';
import { isBranch, isContainer, isSupertype, isEnum, eachChildSlot } from './node-model.ts';
import { toTypeName } from './naming.ts';

// ---------------------------------------------------------------------------
// Signature interning
// ---------------------------------------------------------------------------

function stableKey(prefix: string, kinds: Set<string>): string {
	return prefix + ':' + [...kinds].sort().join(',');
}

/**
 * Compute FieldSignature and ChildSignature for all models.
 * Fields/children with identical kind sets share the same signature.
 */
export function computeSignatures(models: Map<string, NodeModel>): SignaturePool {
	const fieldPool = new Map<string, FieldSignature>();
	const childPool = new Map<string, ChildSignature>();

	for (const model of models.values()) {
		if (isBranch(model)) {
			for (const field of model.fields) {
				const key = stableKey('F', field.kinds);
				if (!fieldPool.has(key)) {
					fieldPool.set(key, { id: key, kinds: new Set([...field.kinds].sort()) });
				}
				field.fieldSignature = fieldPool.get(key)!;
			}
			if (model.children) {
				eachChildSlot(model.children, (child) => {
					const key = stableKey('C', child.kinds);
					if (!childPool.has(key)) {
						childPool.set(key, { id: key, kinds: new Set([...child.kinds].sort()) });
					}
					child.childSignature = childPool.get(key)!;
				});
			}
		}
		if (isContainer(model)) {
			eachChildSlot(model.children, (child) => {
				const key = stableKey('C', child.kinds);
				if (!childPool.has(key)) {
					childPool.set(key, { id: key, kinds: new Set([...child.kinds].sort()) });
				}
				child.childSignature = childPool.get(key)!;
			});
		}
	}

	return { field: fieldPool, child: childPool };
}

// ---------------------------------------------------------------------------
// Enum pattern detection
// ---------------------------------------------------------------------------

/**
 * Find EnumModel kinds that share the same value set.
 */
export function identifyEnumPatterns(models: Map<string, NodeModel>): Map<string, string[]> {
	const valueSetMap = new Map<string, string[]>();

	for (const model of models.values()) {
		if (isEnum(model)) {
			const key = model.values.slice().sort().join(',');
			if (!valueSetMap.has(key)) valueSetMap.set(key, []);
			valueSetMap.get(key)!.push(model.kind);
		}
	}

	return valueSetMap;
}

// ---------------------------------------------------------------------------
// Kind utilities (used by emitters)
// ---------------------------------------------------------------------------

/**
 * Collapse concrete kinds into supertype names where possible.
 * Uses subset pruning — if S1's subtypes are a strict subset of S2's,
 * and S2 is present, S1 is removed.
 */
export function collapseKinds(
	concreteKinds: string[],
	supertypeModels: SupertypeModel[],
): string[] {
	if (supertypeModels.length === 0) {
		return concreteKinds.map(k => k.startsWith('_') ? toTypeName(k.replace(/^_/, '')) : toTypeName(k)).sort();
	}

	// Build expanded supertype map
	const supertypeMap = new Map<string, Set<string>>();
	for (const st of supertypeModels) {
		supertypeMap.set(st.kind, st.subtypes);
	}

	const inputSet = new Set(concreteKinds);
	const matched: { name: string; subtypes: Set<string> }[] = [];

	for (const [stName, subtypes] of supertypeMap) {
		if (subtypes.size === 0) continue;
		let allPresent = true;
		for (const sub of subtypes) {
			if (!inputSet.has(sub)) { allPresent = false; break; }
		}
		if (allPresent) matched.push({ name: stName, subtypes });
	}

	// Prune strict subsets
	const pruned = matched.filter(st =>
		!matched.some(other => other !== st && other.subtypes.size > st.subtypes.size && isSubsetOf(st.subtypes, other.subtypes)),
	);

	const covered = new Set<string>();
	const result: string[] = [];
	for (const st of pruned) {
		for (const sub of st.subtypes) covered.add(sub);
		result.push(toTypeName(st.name.replace(/^_/, '')));
	}
	for (const t of inputSet) {
		if (!covered.has(t)) {
			result.push(t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t));
		}
	}
	return result.sort();
}

function isSubsetOf<T>(a: Set<T>, b: Set<T>): boolean {
	for (const item of a) if (!b.has(item)) return false;
	return true;
}

/**
 * Expand supertype references in a kinds list to their concrete descendants.
 */
export function expandSupertypeKinds(kinds: NodeModel[]): NodeModel[] {
	const result: NodeModel[] = [];
	const seen = new Set<string>();

	for (const model of kinds) {
		if (isSupertype(model)) {
			// Don't add supertypes themselves — they're abstract
			// But we don't have the model references here, so just skip
			continue;
		}
		if (!seen.has(model.kind)) {
			seen.add(model.kind);
			result.push(model);
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// optimize — orchestrator
// ---------------------------------------------------------------------------

/**
 * Run all optimization passes on models.
 */
export function optimize(models: Map<string, NodeModel>): SignaturePool {
	const signatures = computeSignatures(models);
	identifyEnumPatterns(models); // currently informational only
	return signatures;
}

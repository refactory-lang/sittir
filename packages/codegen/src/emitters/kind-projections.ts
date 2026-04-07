/**
 * Kind Projections — derive FieldTypeClass-equivalent projections from hydrated model kinds.
 *
 * Emitters need classified type lists (leaf types, branch types, anonymous tokens,
 * expanded supertypes, collapsed PascalCase names). This module computes them from
 * HydratedNodeModel references on field/child kinds.
 */

import type { HydratedNodeModel, HydratedHiddenModel } from '../node-model.ts';
import { toTypeName } from '../naming.ts';

// ---------------------------------------------------------------------------
// ProjectionContext — built once per grammar, reused for all projections
// ---------------------------------------------------------------------------

export interface ProjectionContext {
	readonly leafKinds: Set<string>;
	readonly expandedSupertypes: Map<string, Set<string>>;
}

/** Build projection context from a models map (call once per grammar). */
export function buildProjectionContext(models: ReadonlyMap<string, HydratedNodeModel>): ProjectionContext {
	const leafKinds = new Set<string>();
	for (const m of models.values()) {
		if (m.modelType === 'leaf' || m.modelType === 'keyword' || m.modelType === 'enum') {
			leafKinds.add(m.kind);
		}
	}

	// Build recursively expanded supertypes (including hidden models)
	const raw = new Map<string, string[]>();
	for (const m of models.values()) {
		if (m.modelType === 'supertype') raw.set(m.kind, [...m.subtypes]);
		if (m.modelType === 'hidden') {
			const hidden = m as HydratedHiddenModel;
			raw.set(m.kind, hidden.subtypes.map(s => s.kind));
		}
	}

	const expanded = new Map<string, Set<string>>();
	function expand(name: string, visited: Set<string>): Set<string> {
		if (expanded.has(name)) return expanded.get(name)!;
		if (visited.has(name)) return new Set();
		visited.add(name);
		const subtypes = raw.get(name);
		if (!subtypes) return new Set();
		const result = new Set<string>();
		for (const sub of subtypes) {
			if (raw.has(sub)) {
				for (const c of expand(sub, visited)) result.add(c);
			} else {
				result.add(sub);
			}
		}
		expanded.set(name, result);
		return result;
	}
	for (const name of raw.keys()) expand(name, new Set());

	return { leafKinds, expandedSupertypes: expanded };
}

// ---------------------------------------------------------------------------
// KindProjection — the 6 FieldTypeClass-equivalent fields
// ---------------------------------------------------------------------------

export interface KindProjection {
	leafTypes: string[];
	branchTypes: string[];
	supertypeKinds: string[];
	anonTokens: string[];
	expandedAll: string[];
	expandedBranch: string[];
	collapsedTypes: string[];
}

/** Project hydrated field/child kinds into classified type lists. */
export function projectKinds(
	kinds: readonly HydratedNodeModel[],
	ctx: ProjectionContext,
): KindProjection {
	const namedKinds: string[] = [];
	const anonTokens: string[] = [];

	for (const k of kinds) {
		if (k.modelType === 'token') {
			anonTokens.push(k.kind);
		} else if (k.modelType === 'hidden') {
			// Hidden models are treated as named union types (like supertypes)
			namedKinds.push(k.kind);
		} else {
			namedKinds.push(k.kind);
		}
	}

	// Detect supertypes and hidden models — both produce named union types
	const supertypeKinds = new Set<string>();
	for (const k of kinds) {
		if (k.modelType === 'supertype' || k.modelType === 'hidden') supertypeKinds.add(k.kind);
	}

	const leafTypes = namedKinds.filter(t => ctx.leafKinds.has(t)).sort();
	// Supertypes are named union types — include them as branch types, not expanded
	const branchTypes = namedKinds.filter(t => !ctx.leafKinds.has(t) && !supertypeKinds.has(t)).sort();

	// Supertypes kept as named types — no expansion into concrete subtypes
	const expandedAll = new Set<string>();
	const expandedBranch = new Set<string>();
	for (const t of branchTypes) { expandedBranch.add(t); expandedAll.add(t); }
	for (const t of leafTypes) expandedAll.add(t);
	for (const t of supertypeKinds) { expandedBranch.add(t); expandedAll.add(t); }

	const collapsedTypes = typesToCollapsed([...expandedAll], ctx.expandedSupertypes);

	return {
		leafTypes,
		branchTypes,
		supertypeKinds: [...supertypeKinds].sort(),
		anonTokens: [...anonTokens],
		expandedAll: [...expandedAll].sort(),
		expandedBranch: [...expandedBranch].sort(),
		collapsedTypes,
	};
}

// ---------------------------------------------------------------------------
// Convenience accessors (match old namedTypes / allTypes API)
// ---------------------------------------------------------------------------

/** All concrete named types after supertype expansion (same as old namedTypes()). */
export function projNamedTypes(proj: KindProjection): string[] {
	return proj.expandedAll;
}

/** All types including anonymous tokens, sorted (same as old allTypes()). */
export function projAllTypes(proj: KindProjection): string[] {
	return [...proj.expandedAll, ...proj.anonTokens].sort();
}

// ---------------------------------------------------------------------------
// Collapsed types (PascalCase, supertypes folded where all subtypes present)
// ---------------------------------------------------------------------------

function typesToCollapsed(
	namedTypes: string[],
	supertypeMap: Map<string, Set<string>>,
): string[] {
	if (supertypeMap.size === 0) {
		return namedTypes.map(t => t.startsWith('_') ? toTypeName(t.replace(/^_/, '')) : toTypeName(t)).sort();
	}

	const inputSet = new Set(namedTypes);
	const matched: { name: string; subtypes: Set<string> }[] = [];

	for (const [stName, subtypes] of supertypeMap) {
		if (subtypes.size <= 1) continue; // Skip single-subtype entries — renaming one type to an alias is not a useful collapse
		let allPresent = true;
		for (const sub of subtypes) {
			if (!inputSet.has(sub)) { allPresent = false; break; }
		}
		if (allPresent) matched.push({ name: stName, subtypes });
	}

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

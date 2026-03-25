// @sittir/core — .from() resolution engine
// Resolves plain objects + scalars into NodeData based on grammar field types.

import type { NodeData } from './types.ts';

// ---------------------------------------------------------------------------
// Public types — .from() input typing
// ---------------------------------------------------------------------------

/** Base type for any value accepted by .from() resolution. */
export type FromValue = string | number | boolean | NodeData | FromValue[] | FromObject;

/** Plain object with optional kind discriminant for .from() resolution. */
export interface FromObject {
	kind?: string;
	[key: string]: FromValue | undefined;
}

// ---------------------------------------------------------------------------
// Public types — implemented by generated packages
// ---------------------------------------------------------------------------

/** Field type info for .from() resolution. */
export interface FromFieldInfo {
	name: string;
	/** Named types this field accepts (concrete node kinds). */
	namedTypes: string[];
	/** Anonymous tokens this field accepts (operators, keywords). */
	anonymousTokens?: string[];
	multiple: boolean;
}

/** Context for .from() resolution — provided by each generated package. */
export interface FromContext {
	/** Get field metadata for a branch kind. */
	getFields(kind: string): FromFieldInfo[] | undefined;
	/** Get accepted child types for a branch kind. */
	getChildrenTypes(kind: string): string[] | undefined;
	/** True if kind is a leaf (terminal) node. */
	isLeaf(kind: string): boolean;
	/** True if kind is a branch (non-terminal) node. */
	isBranch(kind: string): boolean;
	/** Get enum values for a leaf kind (e.g., primitive_type → ['bool', ...]). */
	getLeafValues(kind: string): readonly string[] | undefined;
	/** Create a leaf node via the factory (with validation). */
	createLeaf(kind: string, text: string): NodeData;
	/** Create a branch node from an already-resolved config. */
	createBranch(kind: string, config: Record<string, unknown>): NodeData;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function isNodeData(v: unknown): v is NodeData {
	return v !== null && typeof v === 'object' && typeof (v as any).type === 'string' && typeof (v as any).fields === 'object';
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Resolve a plain object into NodeData using .from() resolution rules.
 * Called by generated .from() methods.
 */
export function resolveFromInput(
	kind: string,
	input: Record<string, unknown>,
	ctx: FromContext,
): NodeData {
	const fieldInfos = ctx.getFields(kind);
	if (!fieldInfos) throw new Error(`Unknown kind for .from(): '${kind}'`);

	// Detect unknown fields (likely typos)
	const knownFields = new Set(fieldInfos.map(f => f.name));
	knownFields.add('children');
	knownFields.add('kind');
	const unknownKeys = Object.keys(input).filter(k => !knownFields.has(k));
	if (unknownKeys.length > 0) {
		throw new Error(
			`Unknown fields for kind '${kind}': ${unknownKeys.join(', ')}. ` +
			`Known fields: ${[...knownFields].filter(k => k !== 'kind').join(', ')}`,
		);
	}

	const resolved: Record<string, unknown> = {};

	for (const field of fieldInfos) {
		const value = input[field.name];
		if (value === undefined) continue;

		if (field.multiple) {
			const arr = Array.isArray(value) ? value : [value];
			resolved[field.name] = arr.map(v => resolveValue(v, field.namedTypes, field.anonymousTokens, ctx));
		} else {
			resolved[field.name] = resolveValue(value, field.namedTypes, field.anonymousTokens, ctx);
		}
	}

	// Handle children
	if ('children' in input && input['children'] !== undefined) {
		const childrenTypes = ctx.getChildrenTypes(kind) ?? [];
		const childrenInput = input['children'];
		const arr = Array.isArray(childrenInput) ? childrenInput : [childrenInput];
		resolved['children'] = arr.map(v => resolveValue(v, childrenTypes, undefined, ctx));
	}

	return ctx.createBranch(kind, resolved);
}

// ---------------------------------------------------------------------------
// Single-field resolution — used by ergonomic fluent setters on .from() nodes
// ---------------------------------------------------------------------------

/**
 * Resolve a single field value using .from() resolution rules.
 * Used by ergonomic fluent setters on nodes returned by .from().
 */
export function resolveFieldValue(
	value: unknown,
	field: FromFieldInfo,
	ctx: FromContext,
): NodeData | NodeData[] {
	if (field.multiple) {
		const arr = Array.isArray(value) ? value : [value];
		return arr.map(v => resolveValue(v, field.namedTypes, field.anonymousTokens, ctx));
	}
	return resolveValue(value, field.namedTypes, field.anonymousTokens, ctx);
}

// ---------------------------------------------------------------------------
// Value resolution
// ---------------------------------------------------------------------------

function resolveValue(
	value: unknown,
	acceptedNamedTypes: string[],
	anonymousTokens: string[] | undefined,
	ctx: FromContext,
): NodeData {
	// Already NodeData → pass through
	if (isNodeData(value)) return value;

	// Boolean → boolean_literal (only if accepted or no leaf types specified)
	if (typeof value === 'boolean') {
		if (!acceptedNamedTypes.length || acceptedNamedTypes.includes('boolean_literal') || ctx.isLeaf('boolean_literal')) {
			return ctx.createLeaf('boolean_literal', String(value));
		}
		throw new Error(`Boolean value not accepted for this field. Accepted types: ${acceptedNamedTypes.join(', ')}`);
	}

	// Number → integer_literal or float_literal
	if (typeof value === 'number') {
		const hasInt = acceptedNamedTypes.includes('integer_literal') || (!acceptedNamedTypes.length && ctx.isLeaf('integer_literal'));
		const hasFloat = acceptedNamedTypes.includes('float_literal') || (!acceptedNamedTypes.length && ctx.isLeaf('float_literal'));
		if (hasInt && hasFloat) {
			return Number.isInteger(value)
				? ctx.createLeaf('integer_literal', String(value))
				: ctx.createLeaf('float_literal', String(value));
		}
		if (hasInt) return ctx.createLeaf('integer_literal', String(value));
		if (hasFloat) return ctx.createLeaf('float_literal', String(value));
		throw new Error(`Number value not accepted for this field. Accepted types: ${acceptedNamedTypes.join(', ')}`);
	}

	// String → resolve based on accepted types
	if (typeof value === 'string') {
		return resolveString(value, acceptedNamedTypes, anonymousTokens, ctx);
	}

	// Array → wrap in single accepted branch type as children
	if (Array.isArray(value)) {
		return resolveArray(value, acceptedNamedTypes, ctx);
	}

	// Plain object → resolve by kind or field inference
	if (typeof value === 'object' && value !== null) {
		return resolveObject(value as Record<string, unknown>, acceptedNamedTypes, ctx);
	}

	throw new Error(`Cannot resolve .from() value of type ${typeof value}`);
}

// ---------------------------------------------------------------------------
// String resolution
// ---------------------------------------------------------------------------

function resolveString(
	value: string,
	acceptedNamedTypes: string[],
	anonymousTokens: string[] | undefined,
	ctx: FromContext,
): NodeData {
	const leafTypes = acceptedNamedTypes.filter(t => ctx.isLeaf(t));

	// Exactly one leaf type → use it directly
	if (leafTypes.length === 1) {
		return ctx.createLeaf(leafTypes[0]!, value);
	}

	// Multiple leaf types → check enum values first (e.g., primitive_type matches 'i32')
	if (leafTypes.length > 1) {
		for (const lt of leafTypes) {
			const vals = ctx.getLeafValues(lt);
			if (vals && vals.includes(value)) {
				return ctx.createLeaf(lt, value);
			}
		}
	}

	// Check anonymous tokens (operators like '+', '==', etc.)
	if (anonymousTokens && anonymousTokens.includes(value)) {
		return { type: value, fields: {}, text: value } as NodeData;
	}

	// Prefer identifier-like leaf types.
	// When both identifier and type_identifier are accepted, prefer type_identifier
	// because fields that accept both typically appear in type positions (e.g.,
	// return_type, generic arguments), making type_identifier the safer default.
	const hasTypeIdent = leafTypes.includes('type_identifier');
	const hasIdent = leafTypes.includes('identifier');
	if (hasTypeIdent && hasIdent) {
		// Both accepted — prefer type_identifier for type contexts
		return ctx.createLeaf('type_identifier', value);
	}
	const identPriority = ['identifier', 'type_identifier', 'field_identifier', 'shorthand_field_identifier'];
	for (const ik of identPriority) {
		if (leafTypes.includes(ik)) {
			return ctx.createLeaf(ik, value);
		}
	}

	// Fallback to first available leaf type
	if (leafTypes.length > 0) {
		return ctx.createLeaf(leafTypes[0]!, value);
	}

	// No leaf types — cannot resolve string
	throw new Error(
		`Cannot resolve string '${value}': no leaf types accepted. ` +
		`Accepted types: ${acceptedNamedTypes.join(', ') || 'none'}`,
	);
}

// ---------------------------------------------------------------------------
// Array resolution
// ---------------------------------------------------------------------------

function resolveArray(
	value: unknown[],
	acceptedNamedTypes: string[],
	ctx: FromContext,
): NodeData {
	// Array in a non-multiple field → wrap as the single accepted branch type's children
	const branchTypes = acceptedNamedTypes.filter(t => ctx.isBranch(t));

	if (branchTypes.length === 1) {
		const wrapKind = branchTypes[0]!;
		const childrenTypes = ctx.getChildrenTypes(wrapKind) ?? [];
		const resolvedChildren = value.map(v => resolveValue(v, childrenTypes, undefined, ctx));
		return ctx.createBranch(wrapKind, { children: resolvedChildren });
	}

	if (branchTypes.length === 0) {
		throw new Error(
			`Array value but no branch types accepted among: ${acceptedNamedTypes.join(', ')}`,
		);
	}

	throw new Error(
		`Array value with ambiguous branch types: ${branchTypes.join(', ')}. ` +
		`Use { kind: '...' } to disambiguate.`,
	);
}

// ---------------------------------------------------------------------------
// Object resolution
// ---------------------------------------------------------------------------

function resolveObject(
	obj: Record<string, unknown>,
	acceptedNamedTypes: string[],
	ctx: FromContext,
): NodeData {
	// Explicit kind → recursive .from()
	if ('kind' in obj && typeof obj['kind'] === 'string') {
		const kind = obj['kind'] as string;
		const rest: Record<string, unknown> = {};
		for (const key of Object.keys(obj)) {
			if (key !== 'kind') rest[key] = obj[key];
		}
		return resolveFromInput(kind, rest, ctx);
	}

	const branchTypes = acceptedNamedTypes.filter(t => ctx.isBranch(t));

	// Single branch type → use it directly
	if (branchTypes.length === 1) {
		return resolveFromInput(branchTypes[0]!, obj, ctx);
	}

	// Multiple candidates → score by field name matching.
	// Scoring: matches count double, misses subtract once. Requires at least one
	// match to prevent empty/wrong-shaped objects from resolving to arbitrary types.
	const objKeys = Object.keys(obj).filter(k => k !== 'children');

	let best: string | null = null;
	let bestScore = 0;
	let bestMatches = 0;

	for (const candidate of branchTypes) {
		const fieldInfo = ctx.getFields(candidate);
		if (!fieldInfo) continue;
		const fieldNames = new Set(fieldInfo.map(f => f.name));

		let matches = 0;
		let misses = 0;
		for (const key of objKeys) {
			if (fieldNames.has(key)) matches++;
			else misses++;
		}

		if (matches === 0) continue;
		const score = matches * 2 - misses;
		if (score > bestScore || (score === bestScore && matches > bestMatches)) {
			bestScore = score;
			bestMatches = matches;
			best = candidate;
		}
	}

	if (best) {
		return resolveFromInput(best, obj, ctx);
	}

	throw new Error(
		`Cannot infer kind for object with keys: ${objKeys.join(', ')}. ` +
		`Accepted types: ${acceptedNamedTypes.join(', ')}. ` +
		`Use { kind: '...' } to specify the node kind explicitly.`,
	);
}

/**
 * Types for .from() resolution — defined in @sittir/types (zero runtime).
 * Used by @sittir/core runtime resolver and generated packages.
 */

import type { NodeData } from '@sittir/core';

// ---------------------------------------------------------------------------
// .from() input types
// ---------------------------------------------------------------------------

/** Base type for any value accepted by .from() resolution. */
export type FromValue = string | number | boolean | NodeData | FromValue[] | FromObject;

/** Plain object with optional kind discriminant for .from() resolution. */
export interface FromObject {
	kind?: string;
	[key: string]: FromValue | undefined;
}

// ---------------------------------------------------------------------------
// .from() context types — implemented by generated packages
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

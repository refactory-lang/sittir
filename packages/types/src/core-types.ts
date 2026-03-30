/**
 * Core type definitions for sittir — canonical source of truth.
 *
 * All type definitions live in @sittir/types (zero runtime).
 * @sittir/core re-exports these for backward compatibility.
 */

// ---------------------------------------------------------------------------
// Node data — what factories produce, what the render engine consumes
// ---------------------------------------------------------------------------

/**
 * Runtime node shape — grammar-agnostic. Used by @sittir/core functions
 * that accept any node regardless of grammar.
 *
 * Consumers should use NodeData<G, K> from @sittir/types for grammar-derived typing.
 * AnyNodeData is the structural supertype that all NodeData<G, K> satisfy.
 */
export interface AnyNodeData {
	readonly type: string;
	readonly fields?: Readonly<Record<string, AnyNodeData>>;
	readonly children?: readonly AnyNodeData[];
	readonly text?: string;
}

// ---------------------------------------------------------------------------
// YAML render templates — ast-grep-style $VARIABLE syntax
// ---------------------------------------------------------------------------

/**
 * A render template for a single node kind.
 *
 * String form (simple template):
 *   "$LEFT $OPERATOR $RIGHT"
 *
 * Object form (template + optional clauses + optional joinBy):
 *   { template: "fn $NAME(...) $RET_CLAUSE{...}", return_type_clause: "-> $RET ", joinBy: ", " }
 *
 * Variable syntax (ast-grep conventions):
 *   $NAME     — single named field
 *   $$NAME    — single unnamed (anonymous) node
 *   $$$NAME   — zero or more nodes (multi)
 *   $_NAME    — non-capturing wildcard
 *
 * Clauses: keys ending in `_clause` are sub-templates that bundle
 * anonymous tokens with non-required fields. If any variable in the
 * clause is absent, the entire clause is omitted.
 */
export type TemplateRule =
	| string
	| TemplateRuleObject;

export interface TemplateRuleObject {
	template: string;
	joinBy?: string | Record<string, string>;
	[clauseKey: `${string}_clause`]: string;
}

/**
 * Full YAML template file shape — one per grammar package.
 *
 * Top-level keys follow ast-grep conventions (camelCase for config,
 * snake_case for rule names from tree-sitter).
 */
export interface RulesConfig {
	language: string;
	extensions: string[];
	expandoChar: string | null;
	metadata: {
		grammarSha: string;
		treeSitterVersion?: string;
	};
	rules: Record<string, TemplateRule>;
}

// ---------------------------------------------------------------------------
// Edit — ast-grep compatible byte-range replacement
// ---------------------------------------------------------------------------

/** A text-level edit: replace bytes [startPos, endPos) with insertedText. */
export interface Edit {
	readonly startPos: number;
	readonly endPos: number;
	readonly insertedText: string;
}

/**
 * A range with byte offsets — compatible with ast-grep's Range.
 * Accepts any object with start.index and end.index (SgNode.range() shape).
 */
export interface ByteRange {
	start: { index: number };
	end: { index: number };
}

// ---------------------------------------------------------------------------
// CST node types
// ---------------------------------------------------------------------------

/** Position in source text. */
export interface Position {
	row: number;
	column: number;
}

/** A lightweight CST node — no parsing required. */
export interface CSTNode {
	type: string;
	text: string;
	children: CSTNode[];
	isNamed: boolean;
	startIndex: number;
	endIndex: number;
	startPosition: Position;
	endPosition: Position;
	fieldName?: string;
}

// ---------------------------------------------------------------------------
// Render context
// ---------------------------------------------------------------------------

/** Context threaded through render calls. */
export interface RenderContext {
	/** Tree-sitter parser instance for full validation. Optional. */
	parser?: unknown;
	/** Indentation unit. Default: two spaces. */
	indent?: string;
	/** External formatting hook — called after render if present. */
	format?: (source: string) => string | Promise<string>;
}

// ---------------------------------------------------------------------------
// Render registries
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Edit helpers — structural types for ast-grep SgNode compatibility
// ---------------------------------------------------------------------------

export interface ReplaceTarget<T extends string = string> {
	readonly type: T;
	range(): ByteRange;
}

/**
 * A parsed tree node that can be assigned from.
 * Structurally compatible with ast-grep SgNode.
 */
export interface AnyTreeNode extends ReplaceTarget {
	id(): number;
	field(name: string): AnyTreeNode | null;
	fieldChildren(name: string): AnyTreeNode[];
	text(): string;
	children(): AnyTreeNode[];
	isNamed(): boolean;
}

/** Factory output that can render itself. */
export interface Renderable {
	render(): string;
}

/** Extract type string(s) from a navigation node type. */
export type KindOf<T> = T extends { readonly type: infer K extends string } ? K : never;

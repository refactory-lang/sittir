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
	readonly fields: Readonly<Record<string, AnyNodeData | AnyNodeData[] | string | number | undefined>>;
	readonly text?: string;
}

// ---------------------------------------------------------------------------
// Render templates — S-expression format (tree-sitter query syntax)
// ---------------------------------------------------------------------------

/**
 * S-expression render template.
 *
 * Uses tree-sitter query syntax:
 *   (function_item "fn" name: (_) "(" parameters: (_)* "," ")" body: (_))
 *
 * Extension: a quoted string after * or + is the separator (handled by render engine).
 */
export type RenderTemplate = string;

/** Render rule for a node kind — just the S-expression template. */
export type RenderRule = RenderTemplate;

// ---------------------------------------------------------------------------
// Parsed template — cached from S-expression parse
// ---------------------------------------------------------------------------

/** A parsed element from an S-expression render template. */
export type TemplateElement =
	| { type: 'token'; value: string }
	| { type: 'field'; name: string; quantifier?: '?' | '*' | '+' }
	| { type: 'children'; quantifier?: '?' | '*' | '+' };

/** Parsed render template — cached after first use. */
export interface ParsedTemplate {
	kind: string;
	elements: TemplateElement[];
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

/** A rules registry mapping node type → S-expression render template. */
export type RulesRegistry = Record<string, RenderRule>;

/** A joinBy map: node type → separator string for joining list children. */
export type JoinByMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Edit helpers — structural types for ast-grep SgNode compatibility
// ---------------------------------------------------------------------------

export interface ReplaceTarget<T extends string = string> {
	readonly type: T;
	range(): ByteRange;
}

/**
 * A parsed tree node that can be assigned to a factory.
 * Structurally compatible with ast-grep SgNode and tree-sitter Node.
 */
/**
 * @deprecated Use TreeNode<G, K> from @sittir/types for grammar-derived tree navigation.
 * This loose version is kept for @sittir/core internal use only.
 */
export interface AnyTreeNode extends ReplaceTarget {
	field(name: string): AnyTreeNode | null;
	text(): string;
	children(): AnyTreeNode[];
}

/** Factory output that can render itself. */
export interface Renderable {
	render(): string;
}

/** Extract type string(s) from a navigation node type. */
export type KindOf<T> = T extends { readonly type: infer K extends string } ? K : never;

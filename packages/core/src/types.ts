// @sittir/core — types
// Planned migration to Rust/WASM via @refactory/typescript-to-rust

// ---------------------------------------------------------------------------
// Node data — what factories produce, what the render engine consumes
// ---------------------------------------------------------------------------

/** A plain object representing an AST node, parameterized by kind. */
export interface NodeData<T extends string = string> {
	readonly type: T;
	readonly fields: Readonly<Record<string, NodeData | NodeData[] | string | number | undefined>>;
	/** For terminal nodes — the source text (identifiers, literals, keywords). */
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

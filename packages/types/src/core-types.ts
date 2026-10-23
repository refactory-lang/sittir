/**
 * Core type definitions for sittir — canonical source of truth.
 *
 * All type definitions live in @sittir/types (zero runtime).
 */

// ---------------------------------------------------------------------------
// Trivia — leading / trailing comments or whitespace attached to a node
// ---------------------------------------------------------------------------

/**
 * Trivia metadata attached to a node through its `$trivia` positions.
 *
 * Leading trivia renders before the node's own text, trailing trivia after
 * it, and inner trivia inside an empty node, at the gap it is keyed by. An
 * entry is the UntypedNode of one of the grammar's trivia kinds (e.g. a
 * `line_comment`), rendered through its own kind, or the kind id of a
 * whitespace kind the grammar's extras match (e.g. `blankline`), which
 * replaces the spacing of the gap it sits in. A loose string given to
 * `$trivia` is the whitespace kind spelled exactly so, or else is built into
 * a comment through the grammar's `ir.comment`.
 */
export type TriviaEntry = AnyUntypedNode | number;

export interface NodeTrivia {
	leading?: readonly TriviaEntry[];
	trailing?: readonly TriviaEntry[];
	inner?: readonly TriviaEntry[];
}

// ---------------------------------------------------------------------------
// Node data — what factories produce, what the render engine consumes
// ---------------------------------------------------------------------------

/**
 * Unified named-member value type.
 *
 * A named slot's `_<name>` storage and its accessor return type both
 * resolve to `NodeMemberValue`.
 *
 * Does NOT include `undefined` or arrays — the per-slot type annotations
 * on generated interfaces carry those modifiers directly (optional `?`
 * for absent, `readonly T[]` for repeated).
 */
export type NodeMemberValue = AnyUntypedNode | string | number | boolean;

/** A byte range into a source string, as the reader stamps it. */
export interface ByteSpan {
	readonly start: number;
	readonly end: number;
}

/**
 * Runtime node shape — grammar-agnostic. Used by @sittir/common functions
 * that accept any node regardless of grammar.
 *
 * Metadata keys are `$`-prefixed so they never collide with a field name
 * (Python's `type_alias_statement` has a field literally named `type`).
 * Holding this shape does not make an object a node: a node holds a source
 * stamp or a tree token, which no literal can carry.
 */
export interface AnyUntypedNode {
	/** Kind discriminant: the language's kind id (`TSKindId`). */
	$type: number;
	/** Variant subtype name — set by factory, absent on readUntypedNode output. */
	$variant?: string;
	/**
	 * The text of a text leaf: a read leaf carries the bytes it spans, a built
	 * one the text it was built from. A node with slots has none; it renders
	 * from its slots, or, untouched, from the bytes its `$_layout.at` names.
	 * A node's is the method `$text()`; native node data carries the string.
	 * `nodeText` reads either.
	 */
	$text?: string | (() => string);
	/**
	 * A node's layout as the native node carries it: where a read node came
	 * from (`at`), and the trivia it owns, whether read or written.
	 */
	$_layout?: NodeLayout;
	/** Whether this is a named (vs anonymous) node in the grammar.
	 * Optional at the type level because generated kind interfaces
	 * omit it by convention (factory output always sets it at runtime). */
	$named?: boolean;

	// -------------------------------------------------------------------------
	// $-prefixed methods — present on factory/wrap output only.
	// Members of the literal the factory or wrap writes for the node.
	// Absent on readUntypedNode / native JSON node.
	// -------------------------------------------------------------------------

	/** Render this node to source text. */
	$render?: () => string;
	/** The node's trivia positions (`leading`, `trailing`); see {@link TriviaSetter}.
	 *
	 * `any[]` in the base type so per-grammar narrowed signatures
	 * (`(LineComment | BlockComment | ...)[]`) remain assignable —
	 * function parameters are contravariant, and `unknown` would
	 * reject narrower argument types. */
	$trivia?: TriviaSetter;
}

/**
 * A node a read left past its depth, or the node a read node came from: its
 * tree and descendant index packed in `$treeHandle`, its span, and its type:
 * the grammar id, except at an alias envelope, where it is the display id.
 * `$span` is a half-open range of UTF-8 byte offsets, not string indices: get
 * the text of a span through `sourceSpans` (or `sliceSpan`) from
 * `@sittir/common`, never `String.prototype.slice`.
 */
export interface NodeCoordinate {
	readonly $treeHandle: number;
	/** The index past the node's last descendant: its subtree is the indexes from its own up to this one, exclusive. */
	readonly $end: number;
	readonly $span: ByteSpan;
	readonly $type: number;
}

/** A node's layout (`$_layout`): its own coordinate when a read gave it (`at`), and its trivia. */
export interface NodeLayout {
	readonly at?: NodeCoordinate;
	readonly trivia?: NodeTrivia;
}

/** tree-sitter's builtin ERROR symbol id, the kind of an {@link ErrorNode}. */
export type ErrorKindId = 65535;

/**
 * The in-line whitespace a trivia item the source fixes in place carries on
 * either side of it, as a read finds it: an ERROR node's, and a line
 * continuation's. An item with either renders verbatim with them, and no
 * other spacing is written there; one with neither (a built line
 * continuation) takes the spacing the options give its gap.
 */
export interface TriviaFlanks {
	/**
	 * The source's whitespace on the item's line between the token before it
	 * and the item, rendered verbatim before `$text`. Absent when the item
	 * touches that token, or when a line break lies between them.
	 */
	readonly $before?: string;
	/**
	 * The source's whitespace on the item's line between the item and the
	 * token after it, rendered verbatim after `$text`. Absent when the item
	 * touches that token, or when a line break lies between them.
	 */
	readonly $after?: string;
}

/**
 * A parsed ERROR node: the source error recovery wrapped, as text. Only a
 * read produces one; there is no factory for it. It surfaces in a slot or as
 * a trivia item, with its flanks (`TriviaFlanks`). Where it sits in the
 * source is reported by the parsed root's `$errors`.
 */
export interface ErrorNode extends AnyUntypedNode, TriviaFlanks {
	readonly $type: ErrorKindId;
	/** The region's own source text: one string, made by this call. */
	$text(): string;
}

/** An item a trivia position holds: one of the grammar's trivia nodes, or an ERROR node read there. */
export type TriviaItem<Trivia> = Trivia | ErrorNode;

export type GrammarTriviaEntry<Trivia> = TriviaItem<Trivia> | string;

/**
 * The trivia positions of a node: `leading` and `trailing`. Called with items, a position
 * sets its entries, keeps the other position, and returns the node, so calls chain; called
 * with none, it returns the entries the position holds. An item is a trivia node or the
 * text of a comment. A parsed alias envelope and its content are one source node whose
 * comments belong to the envelope: the content's positions read none, and a write through
 * the content lands on the envelope.
 */
export interface TriviaSetter<Self = AnyUntypedNode, Trivia = any> {
	leading(): readonly TriviaItem<Trivia>[];
	leading(...items: GrammarTriviaEntry<Trivia>[]): Self;
	trailing(): readonly TriviaItem<Trivia>[];
	trailing(...items: GrammarTriviaEntry<Trivia>[]): Self;
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
export type TemplateRule = string | TemplateRuleObject;

export interface TemplateRuleObject {
	/** Standard template — mutually exclusive with `variants`. */
	template?: string;
	/** Named subtype templates — mutually exclusive with `template`.
	 *  Legacy YAML path only; post-011 walker inlines variant branching
	 *  directly into `template` via `{% if variant == "X" %}…{% endif %}`
	 *  and no longer emits this field. */
	variants?: Record<string, string>;
	/** Discriminator tokens for detecting variant from anonymous children.
	 *  Legacy YAML path only; see note on `variants`. */
	detect?: Record<string, string>;
	/** Rule-level default separator for multi-valued slots. */
	joinBy?: string;
	/** Per-field separator override — wins over `joinBy` for that field. */
	joinByField?: Record<string, string>;
	/** Emit leading separator token when the grammar permitted one. */
	joinByLeading?: boolean;
	/** Emit trailing separator token when the grammar permitted one. */
	joinByTrailing?: boolean;
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
	/**
	 * Static lookup table: numeric KindId → kind name string. Pre-computed
	 * at codegen time from the parser symbol catalog. Used by the JS
	 * Nunjucks render path to resolve template filenames from numeric
	 * `$type`. Pure `Map.get()` at runtime — no function call, no throw.
	 */
	kindNames?: ReadonlyMap<number, string>;
}

/**
 * A range whose positions are string indices (UTF-16 code units), the shape
 * ast-grep's `SgNode.range()` returns: any object with `start.index` and
 * `end.index`. These are not the byte offsets a `$span` counts.
 */
export interface StringIndexRange {
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
// Render registries
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Parsed tree node
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Native (NAPI) parse result
// ---------------------------------------------------------------------------

/**
 * Return value of the native (NAPI) `parse` call: the tree it keeps, the
 * render options its source infers and its error regions. It reads nothing;
 * the root is read from the tree at index 0.
 */
export interface NativeParseResult {
	/** The tree's layer of the render options: the ones its source infers where they differ from the engine's (the indent unit, the root's edges), shaped like the grammar's `Options`. */
	readonly options: Readonly<Record<string, unknown>>;
	/** The tree this parse produced, released once nothing reads from it. */
	readonly treeId: number;
	/** The parse's ERROR and MISSING regions; empty for a clean parse. */
	readonly errors: readonly ErrorRegion[];
}

/**
 * One region of a source that did not parse: source error recovery wrapped in
 * an ERROR node (`'error'`), or a token the parser inserted (`'missing'`, an
 * empty span where the token belongs). Spans are UTF-8 byte offsets.
 */
export interface ErrorRegion {
	readonly kind: 'error' | 'missing';
	readonly span: { readonly start: number; readonly end: number };
}

// ---------------------------------------------------------------------------
// Engine API surfaces
// ---------------------------------------------------------------------------

/**
 * The data projection of a generated kind interface: `$type` plus its
 * `_<slot>` storage, without the accessor methods that only the wrap
 * surface installs. This is the shape the reader returns and the render
 * node accepts.
 */
export type UntypedNodeOf<T> = Pick<T, Extract<keyof T, '$type' | `_${string}`>> & AnyUntypedNode;

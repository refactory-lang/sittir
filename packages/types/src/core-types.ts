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
 * A value that can appear as a field entry on `AnyNodeData.fields` or as a
 * child slot on `AnyNodeData.children`. Runtime observed shapes:
 *
 *   - a nested `AnyNodeData` (the most common case: sub-node drilling)
 *   - a `string` (factory input for a leaf like `identifier('foo')`)
 *   - a `number` (numeric leaf input, occasionally used in templates)
 *   - an array of any of the above (multi-valued fields / children slots)
 *   - `undefined` (absent optional field)
 *
 * Union-typed so downstream consumers don't have to cast through `unknown`
 * to reach a NodeData shape. `AnyNodeData` is recursive via this alias.
 */
export type NodeFieldValue =
	| AnyNodeData
	| string
	| number
	| readonly (AnyNodeData | string | number)[]
	| undefined;

/**
 * A child slot entry — same shape as a field value but without the
 * optional/array wrappers (children are already listed in a readonly array
 * on the parent).
 */
export type NodeChildValue = AnyNodeData | string | number;

/**
 * @deprecated NodeId branded type removed in ADR-0017. Use plain `number` instead.
 * Kept as a simple alias during migration so downstream imports resolve without error.
 */
export type NodeId = number;

/**
 * Runtime node shape — grammar-agnostic. Used by @sittir/core functions
 * that accept any node regardless of grammar.
 *
 * Spec 008 US7: metadata keys are `$`-prefixed to eliminate the entire
 * class of field-name-vs-discriminant collisions (e.g. Python's
 * `type_alias_statement` has a field literally named `type`). The `$source`
 * provenance tag lets `.from()` dispatch with a clean equality check
 * instead of structural `isNodeData` probing.
 */
export interface AnyNodeData {
	/**
	 * Kind discriminant. Numeric (TSKindId) for parser.c-derived kinds.
	 * String for synthesized kinds pending numeric ID assignment.
	 */
	$type: number | string;
	/** Which producer emitted this node. */
	$source?: 'ts' | 'sg' | 'factory';
	/** Variant subtype name — set by factory, absent on readNode output. */
	$variant?: string;
	$fields?: { readonly [key: string]: NodeFieldValue };
	$children?: readonly NodeChildValue[];
	/**
	 * Source text for this node.
	 *
	 * **Leaf nodes** (`$fields` and `$children` both absent): always
	 * populated — the render fast-path short-circuits to `$text` without
	 * walking children.
	 *
	 * **Branch nodes** (`$fields` and/or `$children` present): omitted by
	 * default. Branches reconstruct their text via the render template,
	 * so carrying `$text` is redundant and confusing. Set the environment
	 * variable `SITTIR_DEBUG_TEXT=1` before loading `@sittir/core` to
	 * include `$text` on branch nodes (read once at module load time in
	 * `readNode.ts`).
	 *
	 * Factory-built nodes never set `$text`; the `$TEXT` template
	 * variable falls back to a best-effort field+children concatenation.
	 */
	$text?: string;
	/** Byte offset span in source. */
	$span?: { start: number; end: number };
	/** Index into engine's node-handle table for O(1) drill-in. */
	$nodeHandle?: number;
	/** Position in parent's child array for child(i) access. */
	$childIndex?: number;
	/** Whether this is a named (vs anonymous) node in the grammar.
	 * Optional at the type level because generated kind interfaces
	 * omit it by convention (factory output always sets it at runtime). */
	$named?: boolean;
	/** Per-node format override. Set by callers to override the tree-level format
	 *  (ctx.format) for this specific node. Never set by inference — inferred format
	 *  lives on TreeHandle.format. Absent on all factory and readNode output. */
	$format?: FormatRecord;
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
// Format record — residual source-text metadata
// ---------------------------------------------------------------------------

/** Leading/trailing bytes around the canonical body of a node's span. */
export interface FormatBoundary {
	/** Bytes before the canonical body — indent, preceding blank lines. */
	leading?: string;
	/** Bytes after the canonical body — trailing newline, blank lines. */
	trailing?: string;
}

/**
 * Per-position separator/optional-token override.
 * Key: field name (raw snake_case) or child-array index as string.
 *
 * Discriminated union: `absent: true` marks the slot as omitted in source
 * (e.g. a trailing semicolon that was absent). When absent, `sep` and
 * `trailingPresent` are meaningless and excluded by the type. JSON-wire
 * compatible with the Rust `FormatSlot` struct (all fields skip-serialize-if-none).
 */
export type FormatSlot =
	| { readonly absent: true }
	| { readonly absent?: false; sep?: string; trailingPresent?: boolean };

/**
 * Literal-spelling override for a leaf node.
 * Key: field name or "$text" for the node's own text.
 */
export interface FormatLiteral {
	/** Exact source spelling — overrides `$text` at render time. */
	raw: string;
}

/** A single trivia item (comment or blank line) with position in the span. */
export interface FormatTrivia {
	/**
	 * Byte offset within the enclosing node's span (relative to span start).
	 *
	 * @remarks
	 * Must be non-negative. Mirrors Rust's `u32` offset field — the TS
	 * `number` type does not enforce this at the type level. `rebaseTrivia`
	 * clamps shifted offsets to `Math.max(0, n)` to guard against negative
	 * values produced by large deletions.
	 */
	offset: number;
	/** Verbatim text of the comment or blank-line sequence. */
	text: string;
}

/**
 * Per-kind format record: a {@link FormatRecord} without recursive `kinds`.
 * Used for entries inside `FormatRecord.kinds` — nesting `kinds` inside
 * `kinds` is not supported by the render path (resolves only one level deep).
 */
export type KindFormatRecord = Omit<FormatRecord, 'kinds'>;

/** Residual format metadata for a tree or a specific node kind. */
export interface FormatRecord {
	boundary?: FormatBoundary;
	slots?: Record<string, FormatSlot>;
	literals?: Record<string, FormatLiteral>;
	trivia?: FormatTrivia[];
	/**
	 * Per-kind format overrides. Key is the raw node kind (e.g. "function_item").
	 * Render lookup: node.$format ?? kinds[node.$type] ?? parent FormatRecord.
	 * Entries here use {@link KindFormatRecord} — nesting is not supported
	 * and the render path resolves only one level deep.
	 */
	kinds?: Record<string, KindFormatRecord>;
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
	/** Tree-level format record. The render path resolves format for each node as:
	 *    node.$format                      // per-node inline override (highest priority)
	 *    ?? ctx.format?.kinds?.[node.$type] // per-kind entry on the tree-level record
	 *    ?? ctx.format                      // tree-level default
	 *    ?? undefined                       // template-canonical fallback
	 *  When absent (and node.$format absent), template-canonical output is used. */
	format?: FormatRecord;
	/** When true, ignore all format records and render template-canonical.
	 *  Default: false (apply format when present). */
	ignoreFormat?: boolean;
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
	fieldNameForChild?(index: number): string | null;
	text(): string;
	children(): AnyTreeNode[];
	isNamed(): boolean;
}

/** Factory output that can render itself. */
export interface Renderable {
	render(): string;
}

/** Extract type string(s) from a navigation node type. */
export type KindOf<T> = T extends { readonly type: infer K extends string }
	? K
	: never;

// ---------------------------------------------------------------------------
// Native (NAPI) parse result
// ---------------------------------------------------------------------------

/**
 * Return value of the native (NAPI) `parseAndRead` call.
 * Carries both the hydrated node data and the inferred format (if any)
 * so callers can attach format to the {@link TreeHandle} without a
 * second round-trip.
 */
export interface NativeParseResult {
	/** Hydrated root node data produced by the native parser. */
	nodeData: AnyNodeData;
	/** Format inferred from source layout, if inference succeeded. */
	format?: FormatRecord;
}

// ---------------------------------------------------------------------------
// Engine API surfaces
// ---------------------------------------------------------------------------

/** Options for creating an engine instance. */
export interface EngineOptions {
	readonly format?: FormatRecord;
}

/** A handle to a parsed tree returned by the engine. */
export interface EngineTreeHandle {
	readonly format?: FormatRecord;
	readonly render: (options?: { ignoreFormat?: boolean }) => string;
}

/** Return value of engine parseAndRead — carries both NodeData and inferred format. */
export interface ParseAndReadResult {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}

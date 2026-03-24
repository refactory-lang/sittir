/**
 * Language-agnostic type projection from tree-sitter grammars to typed IR builders.
 *
 * This module extracts the generic type machinery that was originally developed
 * in rust-ir and parameterizes it over an arbitrary Grammar type `G`.  Any
 * object that structurally matches the tree-sitter node-types.json shape
 * can be plugged in as `G` to derive fully typed IR node shapes, builder
 * inputs, and builder configs — zero hand-rolled field definitions.
 *
 * Structurally compatible with @codemod.com/jssg-types grammar types.
 *
 * @example
 * ```ts
 * import type { RustGrammar } from '@sittir/rust';
 * import type { NodeType } from '@sittir/types';
 *
 * type StructItem = NodeType<RustGrammar, 'struct_item'>;
 * ```
 */

import type {
	CamelCase,
	Simplify,
	SimplifyDeep,
} from 'type-fest';

// ---------------------------------------------------------------------------
// Grammar primitives
// ---------------------------------------------------------------------------

/** Node type info as found in tree-sitter's node-types.json. */
interface NodeBasicInfo {
	readonly type: string;
	readonly named: boolean;
}

/** Recursively resolve subtype aliases to concrete named kinds. */
type ResolveType<G, K> = K extends keyof G
	? G[K] extends { subtypes: infer S extends readonly NodeBasicInfo[] }
		? ResolveType<G, S[number]['type']>
		: K
	: K;

/** All node kind string literals for grammar `G`. */
export type NodeKind<G> = keyof G & string;

/** Named (non-anonymous, subtype-resolved) node kinds for grammar `G`. */
export type NamedKind<G> = ResolveType<G, keyof G> | (string & {});

/** Branded string carrying its originating node kind(s). */
export type TextBrand<K extends string> = string & {
	readonly __grammarKinds: K;
};

/** A reference to a grammar type by name. */
export type GrammarTypeRef = {
	readonly type: string;
};

/** Slot metadata from the grammar definition. */
export type GrammarSlotInfo = {
	readonly multiple: boolean;
	readonly required: boolean;
	readonly types: readonly GrammarTypeRef[];
};

/** Extract the kind strings from a slot's type references. */
export type SlotKinds<Info> = Info extends { types: infer Types extends readonly GrammarTypeRef[] }
	? Extract<Types[number]['type'], string>
	: never;

// ---------------------------------------------------------------------------
// Cycle-detected recursion (visited-set pattern)
// ---------------------------------------------------------------------------

/** Check if string literal T is already in the Visited tuple. */
export type Contains<Visited extends string[], T extends string> = Visited extends [
	infer Head extends string,
	...infer Rest extends string[],
]
	? Head extends T
		? true
		: Contains<Rest, T>
	: false;

/** Branded-string leaf for a single kind. */
type LeafBrand<K extends string> = TextBrand<K>;

/**
 * Expand a single child kind into a structured node.
 * Uses the visited set for cycle detection.
 * Supertypes (with `subtypes`) are expanded into unions of their concrete kinds.
 * Leaf kinds (no fields, no subtypes) produce `{ readonly kind: K }`.
 */
export type ExpandOneKind<G, K extends string, Visited extends string[]> = K extends NodeKind<G>
	? G[K] extends { fields: object }
		? Contains<Visited, K> extends true
			? Readonly<{ kind: K }>
			: ExpandNode<G, K, Visited>
		: G[K] extends { subtypes: readonly NodeBasicInfo[] }
			? ExpandOneKind<G, ResolveType<G, K>, Visited>
			: Readonly<{ kind: K }>
	: Readonly<{ kind: K }>;

/**
 * Expand a grammar slot into structured nodes, stopping at cycles.
 */
export type ExpandSlot<G, Info, Visited extends string[]> = Info extends { multiple: true }
	? ExpandOneKind<G, SlotKinds<Info>, Visited>[]
	: ExpandOneKind<G, SlotKinds<Info>, Visited>;

// ---------------------------------------------------------------------------
// Grammar field extraction
// ---------------------------------------------------------------------------

/** Extract the fields map for a node kind. */
export type FieldMap<G, K extends NodeKind<G>> = G[K] extends { fields: infer Fields }
	? Fields
	: never;

/** Field names for a node kind. */
export type FieldName<G, K extends NodeKind<G>> = keyof FieldMap<G, K> & string;

/** Slot info for a specific field of a node kind. */
export type FieldInfo<G, K extends NodeKind<G>, F extends FieldName<G, K>> = Extract<
	FieldMap<G, K>[F],
	GrammarSlotInfo
>;

/** Required field names for a node kind. */
export type RequiredFieldName<G, K extends NodeKind<G>> = {
	[F in FieldName<G, K>]: FieldInfo<G, K, F>['required'] extends true ? F : never;
}[FieldName<G, K>];

/** Optional field names for a node kind. */
export type OptionalFieldName<G, K extends NodeKind<G>> = Exclude<
	FieldName<G, K>,
	RequiredFieldName<G, K>
>;

/** Extract the kind strings from a field's slot types. */
export type FieldKinds<G, K extends NodeKind<G>, F extends FieldName<G, K>> = SlotKinds<
	FieldInfo<G, K, F>
>;

/** Extract the children slot info for a node kind. */
type ChildrenInfo<G, K extends NodeKind<G>> = G[K] extends { children: infer Children }
	? Extract<Children, GrammarSlotInfo>
	: never;

// ---------------------------------------------------------------------------
// Ergonomic alias map
// ---------------------------------------------------------------------------

/** Type constraint for a valid alias map over grammar G. */
export type AliasMap<G> = {
	[K in NodeKind<G>]?: Partial<Record<FieldName<G, K>, string>>;
};

/**
 * Resolve the output key for a given (kind, field_name) pair.
 * If the alias map has an entry, use the alias; otherwise CamelCase.
 */
type ResolveFieldKey<
	K extends string,
	F extends string,
	Aliases = {},
> = K extends keyof Aliases
	? F extends keyof Aliases[K]
		? Aliases[K][F] & string
		: CamelCase<F>
	: CamelCase<F>;

// ---------------------------------------------------------------------------
// Grammar-derived node shapes (CamelCase keys + alias map)
// ---------------------------------------------------------------------------

/** Derived fields for a node kind, with cycle-aware recursive expansion. */
export type DerivedNodeFields<
	G,
	K extends NodeKind<G>,
	Visited extends string[],
	Aliases = {},
> = {
	[F in Exclude<RequiredFieldName<G, K>, 'kind'> as ResolveFieldKey<K, F, Aliases>]: ExpandSlot<
		G,
		FieldInfo<G, K, F>,
		Visited
	>;
} & {
	[F in Exclude<OptionalFieldName<G, K>, 'kind'> as ResolveFieldKey<K, F, Aliases>]?: ExpandSlot<
		G,
		FieldInfo<G, K, F>,
		Visited
	>;
};

/** Derived children slot for a node kind. */
export type DerivedNodeChildren<G, K extends NodeKind<G>, Visited extends string[]> = [
	ChildrenInfo<G, K>,
] extends [never]
	? {}
	: ChildrenInfo<G, K>['required'] extends true
		? { children: ExpandSlot<G, ChildrenInfo<G, K>, Visited> }
		: { children?: ExpandSlot<G, ChildrenInfo<G, K>, Visited> };

/** Full derived shape: fields + children. */
export type DerivedNodeShape<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
	Aliases = {},
> = DerivedNodeFields<G, K, [...Visited, K], Aliases> &
	DerivedNodeChildren<G, K, [...Visited, K]>;

/**
 * Recursively expanded grammar node. Used by ExpandSlot to build
 * child structures — carries `kind` + all grammar-derived fields.
 */
type ExpandNode<G, K extends NodeKind<G>, Visited extends string[]> = Readonly<{ kind: K }> &
	DerivedNodeShape<G, K, Visited>;

// ---------------------------------------------------------------------------
// Main export: NodeType
// ---------------------------------------------------------------------------

/**
 * The primary type projection. Given a grammar `G` and a node kind `K`,
 * produces the fully expanded, deeply simplified IR node type.
 *
 * @example
 * ```ts
 * type StructItem = NodeType<RustGrammar, 'struct_item'>;
 * type GoStructType = NodeType<GoGrammar, 'struct_type'>;
 * ```
 */
export type NodeType<
	G,
	K extends NodeKind<G>,
	Visited extends string[] = [],
	Aliases = {},
> = SimplifyDeep<Readonly<{ kind: K }> & DerivedNodeShape<G, K, Visited, Aliases>>;


// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult =
	| { ok: true }
	| { ok: false; errors: Array<{ offset: number; kind: 'ERROR' }> };

// ---------------------------------------------------------------------------
// Render context
// ---------------------------------------------------------------------------

/** Context threaded through render/build calls. */
export interface RenderContext {
	/** Tree-sitter parser instance for full validation. Optional. */
	parser?: unknown;
	/** Indentation unit. Default: two spaces. */
	indent?: string;
}

// ---------------------------------------------------------------------------
// CST node types
// ---------------------------------------------------------------------------

/** Position in source text. */
export interface Position {
	row: number;
	column: number;
}

/** A lightweight CST node produced by toCST() — no parsing required. */
export interface CSTNode {
	/** Node kind (e.g., 'function_item', 'identifier', '{') */
	type: string;
	/** The rendered text for this node and all its children. */
	text: string;
	/** Child CST nodes (named + anonymous). */
	children: CSTNode[];
	/** Whether this is a named node (vs anonymous keyword/punctuation). */
	isNamed: boolean;
	/** Byte offset of start in the rendered source. */
	startIndex: number;
	/** Byte offset of end in the rendered source. */
	endIndex: number;
	/** Start position (row/column). */
	startPosition: Position;
	/** End position (row/column). */
	endPosition: Position;
	/** Field name in parent node, if any. */
	fieldName?: string;
}

/**
 * A child entry returned by toCSTChildren(). Either a builder reference
 * (named node) or an anonymous token (keyword/punctuation/separator).
 */
export type CSTChild =
	| { kind: 'builder'; builder: Builder; fieldName?: string }
	| { kind: 'token'; text: string; type?: string }
	| { kind: 'sep'; text: string };

// ---------------------------------------------------------------------------
// Base builder
// ---------------------------------------------------------------------------

/** Convert a byte offset to a row/column position given full source text. */
function offsetToPosition(offset: number, fullText: string, baseOffset: number): Position {
	const textUpTo = fullText.slice(0, offset - baseOffset);
	const lines = textUpTo.split('\n');
	return {
		row: lines.length - 1,
		column: lines[lines.length - 1]?.length ?? 0,
	};
}

/**
 * Abstract base for all IR builders. Provides render, validation, and
 * child-rendering infrastructure. Generated per-node builders extend this
 * with their own `renderImpl()` and `build()` implementations.
 *
 * @typeParam N - The IR node type produced by this builder.
 */
export abstract class Builder<N extends { kind: string } = { kind: string }> {
	/** Render this node to source text (no validation). Override in subclasses. */
	abstract renderImpl(ctx?: RenderContext): string;

	/** Build the plain-object IR node (recursive). */
	abstract build(ctx?: RenderContext): N;

	/** Render with optional validation. */
	render(
		validate: 'full' | 'fast' | 'skip' = 'fast',
		ctx?: RenderContext,
	): string | Promise<string> {
		const source = this.renderImpl(ctx);
		if (validate === 'skip') return source;
		if (validate === 'fast') return this.validateFast(source);
		return this.validateFull(source, ctx);
	}

	/**
	 * Build a child's IR node for inclusion in this node's build() output.
	 * Returns `any` because unparameterized Builder erases child type info;
	 * correctness is guaranteed by the grammar — each child builder produces
	 * the right kind literal at runtime.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected buildChild(child: Builder, ctx?: RenderContext): any {
		return child.build(ctx);
	}

	/** Render a single child builder. */
	protected renderChild(child: Builder, ctx?: RenderContext): string {
		return child.renderImpl(ctx);
	}

	/** Render an array of child builders, joined by separator. */
	protected renderChildren(
		children: Builder[],
		sep: string,
		ctx?: RenderContext,
	): string {
		return children.map((c) => c.renderImpl(ctx)).join(sep);
	}

	/**
	 * Return the structured children for CST construction.
	 * Override in generated builders to provide keyword/punctuation tokens
	 * interleaved with child builders. Default: single text node from renderImpl.
	 */
	toCSTChildren(ctx?: RenderContext): CSTChild[] {
		return [{ kind: 'token', text: this.renderImpl(ctx) }];
	}

	/** Type guard: narrows an unknown value to Builder<{ kind: K }>. */
	static is<K extends string>(value: unknown, kind: K): value is Builder<{ kind: K }> {
		return value instanceof Builder && value.nodeKind === kind;
	}

	/** The node kind string. Override in generated builders. */
	get nodeKind(): N['kind'] {
		return 'unknown' as N['kind'];
	}

	/**
	 * Build a lightweight CST node tree with positions — no parsing required.
	 * Walks toCSTChildren() recursively, tracking byte offsets and row/col.
	 */
	toCST(offset = 0, ctx?: RenderContext): CSTNode {
		const children: CSTNode[] = [];
		let cursor = offset;

		const parts = this.toCSTChildren(ctx);

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]!;

			// Add separator space between parts (except first)
			if (i > 0 && part.kind !== 'sep') {
				cursor++; // space
			}

			if (part.kind === 'sep') {
				cursor += part.text.length;
			} else if (part.kind === 'token') {
				const text = part.text;
				const start = cursor;
				const end = start + text.length;
				children.push({
					type: part.type ?? text,
					text,
					children: [],
					isNamed: false,
					startIndex: start,
					endIndex: end,
					startPosition: offsetToPosition(start, this.renderImpl(ctx), offset),
					endPosition: offsetToPosition(end, this.renderImpl(ctx), offset),
				});
				cursor = end;
			} else {
				// builder child
				const childCST = part.builder.toCST(cursor, ctx);
				if (part.fieldName) childCST.fieldName = part.fieldName;
				children.push(childCST);
				cursor = childCST.endIndex;
			}
		}

		const text = this.renderImpl(ctx);
		return {
			type: this.nodeKind,
			text,
			children,
			isNamed: true,
			startIndex: offset,
			endIndex: offset + text.length,
			startPosition: offsetToPosition(offset, text, offset),
			endPosition: offsetToPosition(offset + text.length, text, offset),
		};
	}

	/** Fast sync validation (brace/paren/bracket matching). Override per grammar. */
	protected validateFast(source: string): string {
		const opens = (source.match(/\{/g) ?? []).length;
		const closes = (source.match(/\}/g) ?? []).length;
		if (opens !== closes) {
			throw new Error(`Mismatched braces in rendered source:\n${source}`);
		}
		const parenOpens = (source.match(/\(/g) ?? []).length;
		const parenCloses = (source.match(/\)/g) ?? []).length;
		if (parenOpens !== parenCloses) {
			throw new Error(`Mismatched parentheses in rendered source:\n${source}`);
		}
		const bracketOpens = (source.match(/\[/g) ?? []).length;
		const bracketCloses = (source.match(/\]/g) ?? []).length;
		if (bracketOpens !== bracketCloses) {
			throw new Error(`Mismatched brackets in rendered source:\n${source}`);
		}
		return source;
	}

	/** Full async validation via tree-sitter. Requires ctx.parser. */
	protected async validateFull(
		source: string,
		ctx?: RenderContext,
	): Promise<string> {
		const parser = ctx?.parser as
			| { parse(source: string): { rootNode: { hasError: boolean } } | null }
			| undefined;
		if (!parser) {
			throw new Error(
				'Full validation requires ctx.parser — pass a tree-sitter Parser instance',
			);
		}
		const tree = parser.parse(source);
		if (!tree) throw new Error('tree-sitter parse returned null');
		if (tree.rootNode.hasError) {
			throw new Error(`Invalid source (tree-sitter):\n${source}`);
		}
		return source;
	}
}

// ---------------------------------------------------------------------------
// Leaf builder — the only way to introduce text
// ---------------------------------------------------------------------------

/**
 * Builder for terminal/leaf nodes (identifiers, literals, keywords).
 * Wraps a raw text string in a typed builder.
 */
export class LeafBuilder<K extends string = string> extends Builder<{
	kind: K;
}> {
	constructor(
		readonly kind: K,
		private readonly text: string,
	) {
		super();
	}

	/** Static factory — avoids `new` at call sites. */
	static of<K extends string>(kind: K, text: string): LeafBuilder<K> {
		return new LeafBuilder(kind, text);
	}

	override get nodeKind(): K {
		return this.kind;
	}

	renderImpl(): string {
		return this.text;
	}

	build(): { kind: K } {
		return { kind: this.kind };
	}

	override toCST(offset = 0): CSTNode {
		const text = this.text;
		return {
			type: this.kind,
			text,
			children: [],
			isNamed: true,
			startIndex: offset,
			endIndex: offset + text.length,
			startPosition: { row: 0, column: offset },
			endPosition: { row: 0, column: offset + text.length },
		};
	}
}

// ---------------------------------------------------------------------------
// Leaf options (for discriminated unions with branch Options)
// ---------------------------------------------------------------------------

/**
 * Options type for leaf nodes, enabling disambiguation in multi-kind unions.
 * When a field accepts multiple leaf kinds, callers use `{ nodeKind: 'escape_sequence', text: '\\n' }`
 * instead of a bare string to specify which leaf kind the text represents.
 *
 * `text` is optional for constant leaves (e.g., `self`, `null`) where the text is always the same.
 */
export interface LeafOptions<K extends string = string> {
	nodeKind: K;
	text?: string;
}

// ---------------------------------------------------------------------------
// Edit interface (ast-grep/codemod compatible)
// ---------------------------------------------------------------------------

/** A text-level edit: replace bytes [startPos, endPos) with insertedText. */
export interface Edit {
	startPos: number;
	endPos: number;
	insertedText: string;
}

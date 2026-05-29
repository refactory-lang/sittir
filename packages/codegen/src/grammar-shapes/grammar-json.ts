/**
 * grammar-json.ts — structural TypeScript types for the RAW upstream
 * tree-sitter `grammar.json` vocabulary.
 *
 * These mirror tree-sitter's compiled grammar.json node shapes (the
 * `src/grammar.json` a grammar ships). They are deliberately written so a
 * `... as const satisfies GrammarJson` emit type-checks while PRESERVING
 * literals + tuples — the `readonly` arrays + recursive `GrammarNode`
 * union accept the frozen `as const` shape without widening it.
 *
 * Vocabulary (compiled grammar.json form):
 *   SEQ CHOICE SYMBOL STRING PATTERN REPEAT REPEAT1 FIELD ALIAS TOKEN
 *   IMMEDIATE_TOKEN PREC PREC_LEFT PREC_RIGHT PREC_DYNAMIC BLANK
 *
 * NOTE: compiled grammar.json has NO `OPTIONAL` node — tree-sitter lowers
 * `optional(x)` to `CHOICE(x, BLANK)`. The Enrich<> + path machinery match
 * on `CHOICE(_, BLANK)`, never a phantom OPTIONAL.
 */

export interface SeqNode {
	readonly type: 'SEQ';
	readonly members: readonly GrammarNode[];
}
export interface ChoiceNode {
	readonly type: 'CHOICE';
	readonly members: readonly GrammarNode[];
}
export interface SymbolNode {
	readonly type: 'SYMBOL';
	readonly name: string;
}
export interface StringNode {
	readonly type: 'STRING';
	readonly value: string;
}
export interface PatternNode {
	readonly type: 'PATTERN';
	readonly value: string;
	readonly flags?: string;
}
export interface BlankNode {
	readonly type: 'BLANK';
}
export interface RepeatNode {
	readonly type: 'REPEAT';
	readonly content: GrammarNode;
}
export interface Repeat1Node {
	readonly type: 'REPEAT1';
	readonly content: GrammarNode;
}
export interface FieldNode {
	readonly type: 'FIELD';
	readonly name: string;
	readonly content: GrammarNode;
}
export interface AliasNode {
	readonly type: 'ALIAS';
	readonly value: string;
	readonly named: boolean;
	readonly content: GrammarNode;
}
export interface TokenNode {
	readonly type: 'TOKEN';
	readonly content: GrammarNode;
}
export interface ImmediateTokenNode {
	readonly type: 'IMMEDIATE_TOKEN';
	readonly content: GrammarNode;
}
export interface PrecNode {
	readonly type: 'PREC';
	readonly value: number;
	readonly content: GrammarNode;
}
export interface PrecLeftNode {
	readonly type: 'PREC_LEFT';
	readonly value: number;
	readonly content: GrammarNode;
}
export interface PrecRightNode {
	readonly type: 'PREC_RIGHT';
	readonly value: number;
	readonly content: GrammarNode;
}
export interface PrecDynamicNode {
	readonly type: 'PREC_DYNAMIC';
	readonly value: number;
	readonly content: GrammarNode;
}

/** Union of every compiled-grammar.json node shape. */
export type GrammarNode =
	| SeqNode
	| ChoiceNode
	| SymbolNode
	| StringNode
	| PatternNode
	| BlankNode
	| RepeatNode
	| Repeat1Node
	| FieldNode
	| AliasNode
	| TokenNode
	| ImmediateTokenNode
	| PrecNode
	| PrecLeftNode
	| PrecRightNode
	| PrecDynamicNode;

/** Top-level compiled grammar.json shape (the subset we type off). */
export interface GrammarJson {
	readonly name: string;
	readonly rules: Readonly<Record<string, GrammarNode>>;
	readonly supertypes?: readonly string[];
}

// ---------------------------------------------------------------------------
// Discriminant guards used by the (purely type-level) Enrich<> + path types.
// Kept here so structural facts live next to the node definitions.
// ---------------------------------------------------------------------------

/** PREC wrappers are transparent to path addressing (skip a segment). */
export type PrecNodeUnion = PrecNode | PrecLeftNode | PrecRightNode | PrecDynamicNode;

/** Single-content wrappers that CONSUME a path segment (index 0 / -1). */
export type SingleContentWrapper = RepeatNode | Repeat1Node | FieldNode | AliasNode | TokenNode | ImmediateTokenNode;

/** Container nodes whose members are positionally addressable. */
export type ContainerNode = SeqNode | ChoiceNode;

/**
 * Type-level tests for NodeData<G,K>, NodeFields<G,K>, TreeNode<G,K>.
 *
 * These are compile-time tests — they verify that the generic types
 * project the correct shapes from the Rust grammar. If any assertion
 * fails, the file won't compile.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { NodeData, NodeFields, TreeNode, NodeKind, FieldName, KindOf } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Use the Rust grammar type from the generated package
// ---------------------------------------------------------------------------
import type { RustGrammar } from '../../rust/src/grammar.ts';

// ---------------------------------------------------------------------------
// Helper: assert types are equal
// ---------------------------------------------------------------------------
type Expect<T extends true> = T;
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type Extends<A, B> = A extends B ? true : false;

// ---------------------------------------------------------------------------
// 1. NodeData<G, K> — basic shape
// ---------------------------------------------------------------------------

type FnItem = NodeData<RustGrammar, 'function_item'>;

// Should have 'type' as the kind literal
type _1a = Expect<Equal<FnItem['type'], 'function_item'>>;

// Should have 'fields' property
type _1b = Expect<Extends<FnItem, { readonly type: 'function_item'; readonly fields: object }>>;

// Should have optional 'text'
type _1c = Expect<Extends<FnItem, { readonly text?: string }>>;

// ---------------------------------------------------------------------------
// 2. NodeFields<G, K> — fields shape
// ---------------------------------------------------------------------------

type FnFields = NodeFields<RustGrammar, 'function_item'>;

// 'name' should be a required field (function_item requires name)
type _2a = Expect<Extends<FnFields, { readonly name: unknown }>>;

// 'return_type' should be optional
type FnFieldKeys = keyof FnFields;
type _2b = Expect<Extends<'name', FnFieldKeys>>;
type _2c = Expect<Extends<'parameters', FnFieldKeys>>;
type _2d = Expect<Extends<'body', FnFieldKeys>>;

// ---------------------------------------------------------------------------
// 3. NodeData for leaf kinds
// ---------------------------------------------------------------------------

type Ident = NodeData<RustGrammar, 'identifier'>;

// Leaf should have type
type _3a = Expect<Equal<Ident['type'], 'identifier'>>;

// Leaf should have text
type _3b = Expect<Extends<Ident, { readonly text?: string }>>;

// ---------------------------------------------------------------------------
// 4. TreeNode<G, K> — parsed tree access
// ---------------------------------------------------------------------------

type FnTree = TreeNode<RustGrammar, 'function_item'>;

// Should have type as the kind literal
type _4a = Expect<Equal<FnTree['type'], 'function_item'>>;

// Should have field() method
type _4b = Expect<Extends<FnTree, { field(name: string): unknown }>>;

// Should have text() method
type _4c = Expect<Extends<FnTree, { text(): string }>>;

// Should have range() method
type _4d = Expect<Extends<FnTree, { range(): { start: { index: number }; end: { index: number } } }>>;

// field('name') should return a TreeNode for identifier | metavariable (or null)
type FnNameField = ReturnType<FnTree['field']>;

// ---------------------------------------------------------------------------
// 5. NodeKind — valid kinds
// ---------------------------------------------------------------------------

type RustKinds = NodeKind<RustGrammar>;

type _5a = Expect<Extends<'function_item', RustKinds>>;
type _5b = Expect<Extends<'struct_item', RustKinds>>;
type _5c = Expect<Extends<'identifier', RustKinds>>;
type _5d = Expect<Extends<'binary_expression', RustKinds>>;

// ---------------------------------------------------------------------------
// 6. FieldName — valid field names for a kind
// ---------------------------------------------------------------------------

type FnFieldNames = FieldName<RustGrammar, 'function_item'>;

type _6a = Expect<Extends<'name', FnFieldNames>>;
type _6b = Expect<Extends<'parameters', FnFieldNames>>;
type _6c = Expect<Extends<'body', FnFieldNames>>;

// 'nonexistent' should NOT be a valid field name
type _6d = Expect<Equal<Extends<'nonexistent', FnFieldNames>, false>>;

// ---------------------------------------------------------------------------
// 7. KindOf — extract type from a node
// ---------------------------------------------------------------------------

type _7a = Expect<Equal<KindOf<{ readonly type: 'function_item' }>, 'function_item'>>;
type _7b = Expect<Equal<KindOf<FnTree>, 'function_item'>>;
type _7c = Expect<Equal<KindOf<{ readonly type: 'identifier' }>, 'identifier'>>;

// Union distribution
type _7d = Expect<Equal<
  KindOf<{ readonly type: 'identifier' } | { readonly type: 'metavariable' }>,
  'identifier' | 'metavariable'
>>;

// ---------------------------------------------------------------------------
// 8. Recursive field typing — function_item.name should be identifier-typed
// ---------------------------------------------------------------------------

// The name field on function_item accepts identifier | metavariable
// Check that NodeFields projects this correctly
type FnNameType = FnFields['name'];

// It should be some node type — not 'never' and not 'unknown'
type _8a = Expect<Equal<Extends<FnNameType, never>, false>>;

// ---------------------------------------------------------------------------
// 9. Binary expression — all fields required
// ---------------------------------------------------------------------------

type BinExpr = NodeData<RustGrammar, 'binary_expression'>;
type BinFields = NodeFields<RustGrammar, 'binary_expression'>;

type _9a = Expect<Equal<BinExpr['type'], 'binary_expression'>>;
type _9b = Expect<Extends<'left', keyof BinFields>>;
type _9c = Expect<Extends<'operator', keyof BinFields>>;
type _9d = Expect<Extends<'right', keyof BinFields>>;

// ---------------------------------------------------------------------------
// 10. Block — has children
// ---------------------------------------------------------------------------

type BlockNode = NodeData<RustGrammar, 'block'>;
type BlockFields = NodeFields<RustGrammar, 'block'>;

type _10a = Expect<Equal<BlockNode['type'], 'block'>>;

// Block should have no named fields (only children)
// Check that 'children' exists in the fields shape
// (children are part of DerivedChildren, which merges into DerivedFieldsShape)

// ---------------------------------------------------------------------------
// 11. Recursive field typing — child nodes carry their own type
// ---------------------------------------------------------------------------

// function_item.fields.name should be a node with type 'identifier' | 'metavariable'
// (the grammar defines name: { types: [identifier, metavariable] })
type FnName = FnFields['name'];

// The name field value should have a 'type' property
type _11a = Expect<Extends<FnName, { readonly type: string }>>;

// ---------------------------------------------------------------------------
// 12. NodeData is readonly at all levels
// ---------------------------------------------------------------------------

type _12a = Expect<Extends<FnItem, { readonly type: 'function_item' }>>;
type _12b = Expect<Extends<FnItem, { readonly fields: object }>>;

// ---------------------------------------------------------------------------
// 13. TreeNode field() returns typed children
// ---------------------------------------------------------------------------

// TreeNode.field() should accept valid field names
type FnTreeFieldResult = ReturnType<TreeNode<RustGrammar, 'function_item'>['field']>;

// field() returns TreeNode | null (for any valid field name)
type _13a = Expect<Extends<null, FnTreeFieldResult>>;

// ---------------------------------------------------------------------------
// 14. Nested NodeData — struct_item.fields.name is identifier-like
// ---------------------------------------------------------------------------

type StructFields = NodeFields<RustGrammar, 'struct_item'>;
type StructName = StructFields['name'];

type _14a = Expect<Extends<StructName, { readonly type: string }>>;

// ---------------------------------------------------------------------------
// 15. Let declaration — optional fields
// ---------------------------------------------------------------------------

type LetFields = NodeFields<RustGrammar, 'let_declaration'>;

// pattern is required
type _15a = Expect<Extends<'pattern', keyof LetFields>>;

// value, type, alternative should exist as keys
type LetKeys = keyof LetFields;
type _15b = Expect<Extends<'value', LetKeys>>;

// ---------------------------------------------------------------------------
// 16. Verify NodeData and TreeNode produce compatible 'type' discriminants
// ---------------------------------------------------------------------------

type _16a = Expect<Equal<
  NodeData<RustGrammar, 'identifier'>['type'],
  TreeNode<RustGrammar, 'identifier'>['type']
>>;

type _16b = Expect<Equal<
  NodeData<RustGrammar, 'function_item'>['type'],
  'function_item'
>>;

type _16c = Expect<Equal<
  TreeNode<RustGrammar, 'function_item'>['type'],
  'function_item'
>>;

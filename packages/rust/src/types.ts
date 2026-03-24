import type { RustGrammar } from './grammar.js';
import type { NodeType, ValidationResult } from '@sittir/types';

export type { RustGrammar };

export type AbstractType = NodeType<RustGrammar, 'abstract_type'>;

export type Arguments = NodeType<RustGrammar, 'arguments'>;

export type ArrayExpression = NodeType<RustGrammar, 'array_expression'>;

export type ArrayType = NodeType<RustGrammar, 'array_type'>;

export type AssignmentExpression = NodeType<RustGrammar, 'assignment_expression'>;

export type AssociatedType = NodeType<RustGrammar, 'associated_type'>;

export type AsyncBlock = NodeType<RustGrammar, 'async_block'>;

export type Attribute = NodeType<RustGrammar, 'attribute'>;

export type AttributeItem = NodeType<RustGrammar, 'attribute_item'>;

export type AwaitExpression = NodeType<RustGrammar, 'await_expression'>;

export type BaseFieldInitializer = NodeType<RustGrammar, 'base_field_initializer'>;

export type BinaryExpression = NodeType<RustGrammar, 'binary_expression'>;

export type Block = NodeType<RustGrammar, 'block'>;

export type BlockComment = NodeType<RustGrammar, 'block_comment'>;

export type BoundedType = NodeType<RustGrammar, 'bounded_type'>;

export type BracketedType = NodeType<RustGrammar, 'bracketed_type'>;

export type BreakExpression = NodeType<RustGrammar, 'break_expression'>;

export type CallExpression = NodeType<RustGrammar, 'call_expression'>;

export type CapturedPattern = NodeType<RustGrammar, 'captured_pattern'>;

export type ClosureExpression = NodeType<RustGrammar, 'closure_expression'>;

export type ClosureParameters = NodeType<RustGrammar, 'closure_parameters'>;

export type CompoundAssignmentExpr = NodeType<RustGrammar, 'compound_assignment_expr'>;

export type ConstBlock = NodeType<RustGrammar, 'const_block'>;

export type ConstItem = NodeType<RustGrammar, 'const_item'>;

export type ConstParameter = NodeType<RustGrammar, 'const_parameter'>;

export type ContinueExpression = NodeType<RustGrammar, 'continue_expression'>;

export type DeclarationList = NodeType<RustGrammar, 'declaration_list'>;

export type DynamicType = NodeType<RustGrammar, 'dynamic_type'>;

export type ElseClause = NodeType<RustGrammar, 'else_clause'>;

export type EnumItem = NodeType<RustGrammar, 'enum_item'>;

export type EnumVariant = NodeType<RustGrammar, 'enum_variant'>;

export type EnumVariantList = NodeType<RustGrammar, 'enum_variant_list'>;

export type ExpressionStatement = NodeType<RustGrammar, 'expression_statement'>;

export type ExternCrateDeclaration = NodeType<RustGrammar, 'extern_crate_declaration'>;

export type ExternModifier = NodeType<RustGrammar, 'extern_modifier'>;

export type FieldDeclaration = NodeType<RustGrammar, 'field_declaration'>;

export type FieldDeclarationList = NodeType<RustGrammar, 'field_declaration_list'>;

export type FieldExpression = NodeType<RustGrammar, 'field_expression'>;

export type FieldInitializer = NodeType<RustGrammar, 'field_initializer'>;

export type FieldInitializerList = NodeType<RustGrammar, 'field_initializer_list'>;

export type FieldPattern = NodeType<RustGrammar, 'field_pattern'>;

export type ForExpression = NodeType<RustGrammar, 'for_expression'>;

export type ForLifetimes = NodeType<RustGrammar, 'for_lifetimes'>;

export type ForeignModItem = NodeType<RustGrammar, 'foreign_mod_item'>;

export type FunctionItem = NodeType<RustGrammar, 'function_item'>;

export type FunctionModifiers = NodeType<RustGrammar, 'function_modifiers'>;

export type FunctionSignatureItem = NodeType<RustGrammar, 'function_signature_item'>;

export type FunctionType = NodeType<RustGrammar, 'function_type'>;

export type GenBlock = NodeType<RustGrammar, 'gen_block'>;

export type GenericFunction = NodeType<RustGrammar, 'generic_function'>;

export type GenericPattern = NodeType<RustGrammar, 'generic_pattern'>;

export type GenericType = NodeType<RustGrammar, 'generic_type'>;

export type GenericTypeWithTurbofish = NodeType<RustGrammar, 'generic_type_with_turbofish'>;

export type HigherRankedTraitBound = NodeType<RustGrammar, 'higher_ranked_trait_bound'>;

export type IfExpression = NodeType<RustGrammar, 'if_expression'>;

export type ImplItem = NodeType<RustGrammar, 'impl_item'>;

export type IndexExpression = NodeType<RustGrammar, 'index_expression'>;

export type InnerAttributeItem = NodeType<RustGrammar, 'inner_attribute_item'>;

export type Label = NodeType<RustGrammar, 'label'>;

export type LetChain = NodeType<RustGrammar, 'let_chain'>;

export type LetCondition = NodeType<RustGrammar, 'let_condition'>;

export type LetDeclaration = NodeType<RustGrammar, 'let_declaration'>;

export type Lifetime = NodeType<RustGrammar, 'lifetime'>;

export type LifetimeParameter = NodeType<RustGrammar, 'lifetime_parameter'>;

export type LineComment = NodeType<RustGrammar, 'line_comment'>;

export type LoopExpression = NodeType<RustGrammar, 'loop_expression'>;

export type MacroDefinition = NodeType<RustGrammar, 'macro_definition'>;

export type MacroInvocation = NodeType<RustGrammar, 'macro_invocation'>;

export type MacroRule = NodeType<RustGrammar, 'macro_rule'>;

export type MatchArm = NodeType<RustGrammar, 'match_arm'>;

export type MatchBlock = NodeType<RustGrammar, 'match_block'>;

export type MatchExpression = NodeType<RustGrammar, 'match_expression'>;

export type MatchPattern = NodeType<RustGrammar, 'match_pattern'>;

export type ModItem = NodeType<RustGrammar, 'mod_item'>;

export type MutPattern = NodeType<RustGrammar, 'mut_pattern'>;

export type NegativeLiteral = NodeType<RustGrammar, 'negative_literal'>;

export type OrPattern = NodeType<RustGrammar, 'or_pattern'>;

export type OrderedFieldDeclarationList = NodeType<RustGrammar, 'ordered_field_declaration_list'>;

export type Parameter = NodeType<RustGrammar, 'parameter'>;

export type Parameters = NodeType<RustGrammar, 'parameters'>;

export type ParenthesizedExpression = NodeType<RustGrammar, 'parenthesized_expression'>;

export type PointerType = NodeType<RustGrammar, 'pointer_type'>;

export type QualifiedType = NodeType<RustGrammar, 'qualified_type'>;

export type RangeExpression = NodeType<RustGrammar, 'range_expression'>;

export type RangePattern = NodeType<RustGrammar, 'range_pattern'>;

export type RawStringLiteral = NodeType<RustGrammar, 'raw_string_literal'>;

export type RefPattern = NodeType<RustGrammar, 'ref_pattern'>;

export type ReferenceExpression = NodeType<RustGrammar, 'reference_expression'>;

export type ReferencePattern = NodeType<RustGrammar, 'reference_pattern'>;

export type ReferenceType = NodeType<RustGrammar, 'reference_type'>;

export type RemovedTraitBound = NodeType<RustGrammar, 'removed_trait_bound'>;

export type ReturnExpression = NodeType<RustGrammar, 'return_expression'>;

export type ScopedIdentifier = NodeType<RustGrammar, 'scoped_identifier'>;

export type ScopedTypeIdentifier = NodeType<RustGrammar, 'scoped_type_identifier'>;

export type ScopedUseList = NodeType<RustGrammar, 'scoped_use_list'>;

export type SelfParameter = NodeType<RustGrammar, 'self_parameter'>;

export type ShorthandFieldInitializer = NodeType<RustGrammar, 'shorthand_field_initializer'>;

export type SlicePattern = NodeType<RustGrammar, 'slice_pattern'>;

export type SourceFile = NodeType<RustGrammar, 'source_file'>;

export type StaticItem = NodeType<RustGrammar, 'static_item'>;

export type StringLiteral = NodeType<RustGrammar, 'string_literal'>;

export type StructExpression = NodeType<RustGrammar, 'struct_expression'>;

export type StructItem = NodeType<RustGrammar, 'struct_item'>;

export type StructPattern = NodeType<RustGrammar, 'struct_pattern'>;

export type TokenBindingPattern = NodeType<RustGrammar, 'token_binding_pattern'>;

export type TokenRepetition = NodeType<RustGrammar, 'token_repetition'>;

export type TokenRepetitionPattern = NodeType<RustGrammar, 'token_repetition_pattern'>;

export type TokenTree = NodeType<RustGrammar, 'token_tree'>;

export type TokenTreePattern = NodeType<RustGrammar, 'token_tree_pattern'>;

export type TraitBounds = NodeType<RustGrammar, 'trait_bounds'>;

export type TraitItem = NodeType<RustGrammar, 'trait_item'>;

export type TryBlock = NodeType<RustGrammar, 'try_block'>;

export type TryExpression = NodeType<RustGrammar, 'try_expression'>;

export type TupleExpression = NodeType<RustGrammar, 'tuple_expression'>;

export type TuplePattern = NodeType<RustGrammar, 'tuple_pattern'>;

export type TupleStructPattern = NodeType<RustGrammar, 'tuple_struct_pattern'>;

export type TupleType = NodeType<RustGrammar, 'tuple_type'>;

export type TypeArguments = NodeType<RustGrammar, 'type_arguments'>;

export type TypeBinding = NodeType<RustGrammar, 'type_binding'>;

export type TypeCastExpression = NodeType<RustGrammar, 'type_cast_expression'>;

export type TypeItem = NodeType<RustGrammar, 'type_item'>;

export type TypeParameter = NodeType<RustGrammar, 'type_parameter'>;

export type TypeParameters = NodeType<RustGrammar, 'type_parameters'>;

export type UnaryExpression = NodeType<RustGrammar, 'unary_expression'>;

export type UnionItem = NodeType<RustGrammar, 'union_item'>;

export type UnsafeBlock = NodeType<RustGrammar, 'unsafe_block'>;

export type UseAsClause = NodeType<RustGrammar, 'use_as_clause'>;

export type UseBounds = NodeType<RustGrammar, 'use_bounds'>;

export type UseDeclaration = NodeType<RustGrammar, 'use_declaration'>;

export type UseList = NodeType<RustGrammar, 'use_list'>;

export type UseWildcard = NodeType<RustGrammar, 'use_wildcard'>;

export type VariadicParameter = NodeType<RustGrammar, 'variadic_parameter'>;

export type VisibilityModifier = NodeType<RustGrammar, 'visibility_modifier'>;

export type WhereClause = NodeType<RustGrammar, 'where_clause'>;

export type WherePredicate = NodeType<RustGrammar, 'where_predicate'>;

export type WhileExpression = NodeType<RustGrammar, 'while_expression'>;

export type YieldExpression = NodeType<RustGrammar, 'yield_expression'>;

// Leaf node types
export type BooleanLiteral = { kind: 'boolean_literal' };
export type EmptyStatement = { kind: 'empty_statement' };
export type FragmentSpecifier = { kind: 'fragment_specifier' };
export type InnerDocCommentMarker = { kind: 'inner_doc_comment_marker' };
export type NeverType = { kind: 'never_type' };
export type OuterDocCommentMarker = { kind: 'outer_doc_comment_marker' };
export type RemainingFieldPattern = { kind: 'remaining_field_pattern' };
export type UnitExpression = { kind: 'unit_expression' };
export type UnitType = { kind: 'unit_type' };
export type CharLiteral = { kind: 'char_literal' };
export type Crate = { kind: 'crate' };
export type DocComment = { kind: 'doc_comment' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type FieldIdentifier = { kind: 'field_identifier' };
export type FloatLiteral = { kind: 'float_literal' };
export type Identifier = { kind: 'identifier' };
export type IntegerLiteral = { kind: 'integer_literal' };
export type Metavariable = { kind: 'metavariable' };
export type MutableSpecifier = { kind: 'mutable_specifier' };
export type PrimitiveType = { kind: 'primitive_type' };
export type Self = { kind: 'self' };
export type Shebang = { kind: 'shebang' };
export type ShorthandFieldIdentifier = { kind: 'shorthand_field_identifier' };
export type StringContent = { kind: 'string_content' };
export type Super = { kind: 'super' };
export type TypeIdentifier = { kind: 'type_identifier' };

// Supertype unions
export type DeclarationStatement =
  | AssociatedType
  | AttributeItem
  | ConstItem
  | EmptyStatement
  | EnumItem
  | ExternCrateDeclaration
  | ForeignModItem
  | FunctionItem
  | FunctionSignatureItem
  | ImplItem
  | InnerAttributeItem
  | LetDeclaration
  | MacroDefinition
  | MacroInvocation
  | ModItem
  | StaticItem
  | StructItem
  | TraitItem
  | TypeItem
  | UnionItem
  | UseDeclaration
;

export type Expression =
  | Literal
  | ArrayExpression
  | AssignmentExpression
  | AsyncBlock
  | AwaitExpression
  | BinaryExpression
  | Block
  | BreakExpression
  | CallExpression
  | ClosureExpression
  | CompoundAssignmentExpr
  | ConstBlock
  | ContinueExpression
  | FieldExpression
  | ForExpression
  | GenBlock
  | GenericFunction
  | Identifier
  | IfExpression
  | IndexExpression
  | LoopExpression
  | MacroInvocation
  | MatchExpression
  | Metavariable
  | ParenthesizedExpression
  | RangeExpression
  | ReferenceExpression
  | ReturnExpression
  | ScopedIdentifier
  | Self
  | StructExpression
  | TryBlock
  | TryExpression
  | TupleExpression
  | TypeCastExpression
  | UnaryExpression
  | UnitExpression
  | UnsafeBlock
  | WhileExpression
  | YieldExpression
;

export type Literal =
  | BooleanLiteral
  | CharLiteral
  | FloatLiteral
  | IntegerLiteral
  | RawStringLiteral
  | StringLiteral
;

export type LiteralPattern =
  | BooleanLiteral
  | CharLiteral
  | FloatLiteral
  | IntegerLiteral
  | NegativeLiteral
  | RawStringLiteral
  | StringLiteral
;

export type Pattern =
  | LiteralPattern
  | CapturedPattern
  | ConstBlock
  | GenericPattern
  | Identifier
  | MacroInvocation
  | MutPattern
  | OrPattern
  | RangePattern
  | RefPattern
  | ReferencePattern
  | RemainingFieldPattern
  | ScopedIdentifier
  | SlicePattern
  | StructPattern
  | TuplePattern
  | TupleStructPattern
;

export type Type =
  | AbstractType
  | ArrayType
  | BoundedType
  | DynamicType
  | FunctionType
  | GenericType
  | MacroInvocation
  | Metavariable
  | NeverType
  | PointerType
  | PrimitiveType
  | ReferenceType
  | RemovedTraitBound
  | ScopedTypeIdentifier
  | TupleType
  | TypeIdentifier
  | UnitType
;

export type RustIrNode =
  | AbstractType
  | Arguments
  | ArrayExpression
  | ArrayType
  | AssignmentExpression
  | AssociatedType
  | AsyncBlock
  | Attribute
  | AttributeItem
  | AwaitExpression
  | BaseFieldInitializer
  | BinaryExpression
  | Block
  | BlockComment
  | BoundedType
  | BracketedType
  | BreakExpression
  | CallExpression
  | CapturedPattern
  | ClosureExpression
  | ClosureParameters
  | CompoundAssignmentExpr
  | ConstBlock
  | ConstItem
  | ConstParameter
  | ContinueExpression
  | DeclarationList
  | DynamicType
  | ElseClause
  | EnumItem
  | EnumVariant
  | EnumVariantList
  | ExpressionStatement
  | ExternCrateDeclaration
  | ExternModifier
  | FieldDeclaration
  | FieldDeclarationList
  | FieldExpression
  | FieldInitializer
  | FieldInitializerList
  | FieldPattern
  | ForExpression
  | ForLifetimes
  | ForeignModItem
  | FunctionItem
  | FunctionModifiers
  | FunctionSignatureItem
  | FunctionType
  | GenBlock
  | GenericFunction
  | GenericPattern
  | GenericType
  | GenericTypeWithTurbofish
  | HigherRankedTraitBound
  | IfExpression
  | ImplItem
  | IndexExpression
  | InnerAttributeItem
  | Label
  | LetChain
  | LetCondition
  | LetDeclaration
  | Lifetime
  | LifetimeParameter
  | LineComment
  | LoopExpression
  | MacroDefinition
  | MacroInvocation
  | MacroRule
  | MatchArm
  | MatchBlock
  | MatchExpression
  | MatchPattern
  | ModItem
  | MutPattern
  | NegativeLiteral
  | OrPattern
  | OrderedFieldDeclarationList
  | Parameter
  | Parameters
  | ParenthesizedExpression
  | PointerType
  | QualifiedType
  | RangeExpression
  | RangePattern
  | RawStringLiteral
  | RefPattern
  | ReferenceExpression
  | ReferencePattern
  | ReferenceType
  | RemovedTraitBound
  | ReturnExpression
  | ScopedIdentifier
  | ScopedTypeIdentifier
  | ScopedUseList
  | SelfParameter
  | ShorthandFieldInitializer
  | SlicePattern
  | SourceFile
  | StaticItem
  | StringLiteral
  | StructExpression
  | StructItem
  | StructPattern
  | TokenBindingPattern
  | TokenRepetition
  | TokenRepetitionPattern
  | TokenTree
  | TokenTreePattern
  | TraitBounds
  | TraitItem
  | TryBlock
  | TryExpression
  | TupleExpression
  | TuplePattern
  | TupleStructPattern
  | TupleType
  | TypeArguments
  | TypeBinding
  | TypeCastExpression
  | TypeItem
  | TypeParameter
  | TypeParameters
  | UnaryExpression
  | UnionItem
  | UnsafeBlock
  | UseAsClause
  | UseBounds
  | UseDeclaration
  | UseList
  | UseWildcard
  | VariadicParameter
  | VisibilityModifier
  | WhereClause
  | WherePredicate
  | WhileExpression
  | YieldExpression
;

export type { ValidationResult };

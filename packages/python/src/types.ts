import type { PythonGrammar } from './grammar.js';
import type { NodeType, ValidationResult } from '@sittir/types';

export type { PythonGrammar };

export type AliasedImport = NodeType<PythonGrammar, 'aliased_import'>;

export type ArgumentList = NodeType<PythonGrammar, 'argument_list'>;

export type AsPattern = NodeType<PythonGrammar, 'as_pattern'>;

export type AssertStatement = NodeType<PythonGrammar, 'assert_statement'>;

export type Assignment = NodeType<PythonGrammar, 'assignment'>;

export type Attribute = NodeType<PythonGrammar, 'attribute'>;

export type AugmentedAssignment = NodeType<PythonGrammar, 'augmented_assignment'>;

export type Await = NodeType<PythonGrammar, 'await'>;

export type BinaryOperator = NodeType<PythonGrammar, 'binary_operator'>;

export type Block = NodeType<PythonGrammar, 'block'>;

export type BooleanOperator = NodeType<PythonGrammar, 'boolean_operator'>;

export type Call = NodeType<PythonGrammar, 'call'>;

export type CaseClause = NodeType<PythonGrammar, 'case_clause'>;

export type CasePattern = NodeType<PythonGrammar, 'case_pattern'>;

export type Chevron = NodeType<PythonGrammar, 'chevron'>;

export type ClassDefinition = NodeType<PythonGrammar, 'class_definition'>;

export type ClassPattern = NodeType<PythonGrammar, 'class_pattern'>;

export type ComparisonOperator = NodeType<PythonGrammar, 'comparison_operator'>;

export type ComplexPattern = NodeType<PythonGrammar, 'complex_pattern'>;

export type ConcatenatedString = NodeType<PythonGrammar, 'concatenated_string'>;

export type ConditionalExpression = NodeType<PythonGrammar, 'conditional_expression'>;

export type ConstrainedType = NodeType<PythonGrammar, 'constrained_type'>;

export type DecoratedDefinition = NodeType<PythonGrammar, 'decorated_definition'>;

export type Decorator = NodeType<PythonGrammar, 'decorator'>;

export type DefaultParameter = NodeType<PythonGrammar, 'default_parameter'>;

export type DeleteStatement = NodeType<PythonGrammar, 'delete_statement'>;

export type DictPattern = NodeType<PythonGrammar, 'dict_pattern'>;

export type Dictionary = NodeType<PythonGrammar, 'dictionary'>;

export type DictionaryComprehension = NodeType<PythonGrammar, 'dictionary_comprehension'>;

export type DictionarySplat = NodeType<PythonGrammar, 'dictionary_splat'>;

export type DictionarySplatPattern = NodeType<PythonGrammar, 'dictionary_splat_pattern'>;

export type DottedName = NodeType<PythonGrammar, 'dotted_name'>;

export type ElifClause = NodeType<PythonGrammar, 'elif_clause'>;

export type ElseClause = NodeType<PythonGrammar, 'else_clause'>;

export type ExceptClause = NodeType<PythonGrammar, 'except_clause'>;

export type ExecStatement = NodeType<PythonGrammar, 'exec_statement'>;

export type ExpressionList = NodeType<PythonGrammar, 'expression_list'>;

export type ExpressionStatement = NodeType<PythonGrammar, 'expression_statement'>;

export type FinallyClause = NodeType<PythonGrammar, 'finally_clause'>;

export type ForInClause = NodeType<PythonGrammar, 'for_in_clause'>;

export type ForStatement = NodeType<PythonGrammar, 'for_statement'>;

export type FormatExpression = NodeType<PythonGrammar, 'format_expression'>;

export type FormatSpecifier = NodeType<PythonGrammar, 'format_specifier'>;

export type FunctionDefinition = NodeType<PythonGrammar, 'function_definition'>;

export type FutureImportStatement = NodeType<PythonGrammar, 'future_import_statement'>;

export type GeneratorExpression = NodeType<PythonGrammar, 'generator_expression'>;

export type GenericType = NodeType<PythonGrammar, 'generic_type'>;

export type GlobalStatement = NodeType<PythonGrammar, 'global_statement'>;

export type IfClause = NodeType<PythonGrammar, 'if_clause'>;

export type IfStatement = NodeType<PythonGrammar, 'if_statement'>;

export type ImportFromStatement = NodeType<PythonGrammar, 'import_from_statement'>;

export type ImportStatement = NodeType<PythonGrammar, 'import_statement'>;

export type Interpolation = NodeType<PythonGrammar, 'interpolation'>;

export type KeywordArgument = NodeType<PythonGrammar, 'keyword_argument'>;

export type KeywordPattern = NodeType<PythonGrammar, 'keyword_pattern'>;

export type Lambda = NodeType<PythonGrammar, 'lambda'>;

export type LambdaParameters = NodeType<PythonGrammar, 'lambda_parameters'>;

export type List = NodeType<PythonGrammar, 'list'>;

export type ListComprehension = NodeType<PythonGrammar, 'list_comprehension'>;

export type ListPattern = NodeType<PythonGrammar, 'list_pattern'>;

export type ListSplat = NodeType<PythonGrammar, 'list_splat'>;

export type ListSplatPattern = NodeType<PythonGrammar, 'list_splat_pattern'>;

export type MatchStatement = NodeType<PythonGrammar, 'match_statement'>;

export type MemberType = NodeType<PythonGrammar, 'member_type'>;

export type Module = NodeType<PythonGrammar, 'module'>;

export type NamedExpression = NodeType<PythonGrammar, 'named_expression'>;

export type NonlocalStatement = NodeType<PythonGrammar, 'nonlocal_statement'>;

export type NotOperator = NodeType<PythonGrammar, 'not_operator'>;

export type Pair = NodeType<PythonGrammar, 'pair'>;

export type Parameters = NodeType<PythonGrammar, 'parameters'>;

export type ParenthesizedExpression = NodeType<PythonGrammar, 'parenthesized_expression'>;

export type ParenthesizedListSplat = NodeType<PythonGrammar, 'parenthesized_list_splat'>;

export type PatternList = NodeType<PythonGrammar, 'pattern_list'>;

export type PrintStatement = NodeType<PythonGrammar, 'print_statement'>;

export type RaiseStatement = NodeType<PythonGrammar, 'raise_statement'>;

export type RelativeImport = NodeType<PythonGrammar, 'relative_import'>;

export type ReturnStatement = NodeType<PythonGrammar, 'return_statement'>;

export type Set = NodeType<PythonGrammar, 'set'>;

export type SetComprehension = NodeType<PythonGrammar, 'set_comprehension'>;

export type Slice = NodeType<PythonGrammar, 'slice'>;

export type SplatPattern = NodeType<PythonGrammar, 'splat_pattern'>;

export type SplatType = NodeType<PythonGrammar, 'splat_type'>;

export type String = NodeType<PythonGrammar, 'string'>;

export type StringContent = NodeType<PythonGrammar, 'string_content'>;

export type Subscript = NodeType<PythonGrammar, 'subscript'>;

export type TryStatement = NodeType<PythonGrammar, 'try_statement'>;

export type Tuple = NodeType<PythonGrammar, 'tuple'>;

export type TuplePattern = NodeType<PythonGrammar, 'tuple_pattern'>;

export type Type = NodeType<PythonGrammar, 'type'>;

export type TypeAliasStatement = NodeType<PythonGrammar, 'type_alias_statement'>;

export type TypeParameter = NodeType<PythonGrammar, 'type_parameter'>;

export type TypedDefaultParameter = NodeType<PythonGrammar, 'typed_default_parameter'>;

export type TypedParameter = NodeType<PythonGrammar, 'typed_parameter'>;

export type UnaryOperator = NodeType<PythonGrammar, 'unary_operator'>;

export type UnionPattern = NodeType<PythonGrammar, 'union_pattern'>;

export type UnionType = NodeType<PythonGrammar, 'union_type'>;

export type WhileStatement = NodeType<PythonGrammar, 'while_statement'>;

export type WithClause = NodeType<PythonGrammar, 'with_clause'>;

export type WithItem = NodeType<PythonGrammar, 'with_item'>;

export type WithStatement = NodeType<PythonGrammar, 'with_statement'>;

export type Yield = NodeType<PythonGrammar, 'yield'>;

// Leaf node types
export type BreakStatement = { kind: 'break_statement' };
export type ContinueStatement = { kind: 'continue_statement' };
export type ImportPrefix = { kind: 'import_prefix' };
export type KeywordSeparator = { kind: 'keyword_separator' };
export type PassStatement = { kind: 'pass_statement' };
export type PositionalSeparator = { kind: 'positional_separator' };
export type WildcardImport = { kind: 'wildcard_import' };
export type Comment = { kind: 'comment' };
export type Ellipsis = { kind: 'ellipsis' };
export type EscapeInterpolation = { kind: 'escape_interpolation' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type False = { kind: 'false' };
export type Float = { kind: 'float' };
export type Identifier = { kind: 'identifier' };
export type Integer = { kind: 'integer' };
export type LineContinuation = { kind: 'line_continuation' };
export type None = { kind: 'none' };
export type StringEnd = { kind: 'string_end' };
export type StringStart = { kind: 'string_start' };
export type True = { kind: 'true' };
export type TypeConversion = { kind: 'type_conversion' };

// Supertype unions
export type CompoundStatement =
  | ClassDefinition
  | DecoratedDefinition
  | ForStatement
  | FunctionDefinition
  | IfStatement
  | MatchStatement
  | TryStatement
  | WhileStatement
  | WithStatement
;

export type SimpleStatement =
  | AssertStatement
  | BreakStatement
  | ContinueStatement
  | DeleteStatement
  | ExecStatement
  | ExpressionStatement
  | FutureImportStatement
  | GlobalStatement
  | ImportFromStatement
  | ImportStatement
  | NonlocalStatement
  | PassStatement
  | PrintStatement
  | RaiseStatement
  | ReturnStatement
  | TypeAliasStatement
;

export type Expression =
  | AsPattern
  | BooleanOperator
  | ComparisonOperator
  | ConditionalExpression
  | Lambda
  | NamedExpression
  | NotOperator
  | PrimaryExpression
;

export type Parameter =
  | DefaultParameter
  | DictionarySplatPattern
  | Identifier
  | KeywordSeparator
  | ListSplatPattern
  | PositionalSeparator
  | TuplePattern
  | TypedDefaultParameter
  | TypedParameter
;

export type Pattern =
  | Attribute
  | Identifier
  | ListPattern
  | ListSplatPattern
  | Subscript
  | TuplePattern
;

export type PrimaryExpression =
  | Attribute
  | Await
  | BinaryOperator
  | Call
  | ConcatenatedString
  | Dictionary
  | DictionaryComprehension
  | Ellipsis
  | False
  | Float
  | GeneratorExpression
  | Identifier
  | Integer
  | List
  | ListComprehension
  | ListSplat
  | None
  | ParenthesizedExpression
  | Set
  | SetComprehension
  | String
  | Subscript
  | True
  | Tuple
  | UnaryOperator
;

export type PythonIrNode =
  | AliasedImport
  | ArgumentList
  | AsPattern
  | AssertStatement
  | Assignment
  | Attribute
  | AugmentedAssignment
  | Await
  | BinaryOperator
  | Block
  | BooleanOperator
  | Call
  | CaseClause
  | CasePattern
  | Chevron
  | ClassDefinition
  | ClassPattern
  | ComparisonOperator
  | ComplexPattern
  | ConcatenatedString
  | ConditionalExpression
  | ConstrainedType
  | DecoratedDefinition
  | Decorator
  | DefaultParameter
  | DeleteStatement
  | DictPattern
  | Dictionary
  | DictionaryComprehension
  | DictionarySplat
  | DictionarySplatPattern
  | DottedName
  | ElifClause
  | ElseClause
  | ExceptClause
  | ExecStatement
  | ExpressionList
  | ExpressionStatement
  | FinallyClause
  | ForInClause
  | ForStatement
  | FormatExpression
  | FormatSpecifier
  | FunctionDefinition
  | FutureImportStatement
  | GeneratorExpression
  | GenericType
  | GlobalStatement
  | IfClause
  | IfStatement
  | ImportFromStatement
  | ImportStatement
  | Interpolation
  | KeywordArgument
  | KeywordPattern
  | Lambda
  | LambdaParameters
  | List
  | ListComprehension
  | ListPattern
  | ListSplat
  | ListSplatPattern
  | MatchStatement
  | MemberType
  | Module
  | NamedExpression
  | NonlocalStatement
  | NotOperator
  | Pair
  | Parameters
  | ParenthesizedExpression
  | ParenthesizedListSplat
  | PatternList
  | PrintStatement
  | RaiseStatement
  | RelativeImport
  | ReturnStatement
  | Set
  | SetComprehension
  | Slice
  | SplatPattern
  | SplatType
  | String
  | StringContent
  | Subscript
  | TryStatement
  | Tuple
  | TuplePattern
  | Type
  | TypeAliasStatement
  | TypeParameter
  | TypedDefaultParameter
  | TypedParameter
  | UnaryOperator
  | UnionPattern
  | UnionType
  | WhileStatement
  | WithClause
  | WithItem
  | WithStatement
  | Yield
;

export type { ValidationResult };

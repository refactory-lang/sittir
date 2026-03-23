import type { PythonGrammar } from './grammar.js';
import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';

export type { PythonGrammar };

export type AliasedImport = NodeType<PythonGrammar, 'aliased_import'>;
export type AliasedImportConfig = BuilderConfig<PythonGrammar, AliasedImport>;

export type ArgumentList = NodeType<PythonGrammar, 'argument_list'>;
export type ArgumentListConfig = BuilderConfig<PythonGrammar, ArgumentList>;

export type AsPattern = NodeType<PythonGrammar, 'as_pattern'>;
export type AsPatternConfig = BuilderConfig<PythonGrammar, AsPattern>;

export type AssertStatement = NodeType<PythonGrammar, 'assert_statement'>;
export type AssertStatementConfig = BuilderConfig<PythonGrammar, AssertStatement>;

export type Assignment = NodeType<PythonGrammar, 'assignment'>;
export type AssignmentConfig = BuilderConfig<PythonGrammar, Assignment>;

export type Attribute = NodeType<PythonGrammar, 'attribute'>;
export type AttributeConfig = BuilderConfig<PythonGrammar, Attribute>;

export type AugmentedAssignment = NodeType<PythonGrammar, 'augmented_assignment'>;
export type AugmentedAssignmentConfig = BuilderConfig<PythonGrammar, AugmentedAssignment>;

export type BinaryOperator = NodeType<PythonGrammar, 'binary_operator'>;
export type BinaryOperatorConfig = BuilderConfig<PythonGrammar, BinaryOperator>;

export type Block = NodeType<PythonGrammar, 'block'>;
export type BlockConfig = BuilderConfig<PythonGrammar, Block>;

export type BooleanOperator = NodeType<PythonGrammar, 'boolean_operator'>;
export type BooleanOperatorConfig = BuilderConfig<PythonGrammar, BooleanOperator>;

export type Call = NodeType<PythonGrammar, 'call'>;
export type CallConfig = BuilderConfig<PythonGrammar, Call>;

export type CaseClause = NodeType<PythonGrammar, 'case_clause'>;
export type CaseClauseConfig = BuilderConfig<PythonGrammar, CaseClause>;

export type CasePattern = NodeType<PythonGrammar, 'case_pattern'>;
export type CasePatternConfig = BuilderConfig<PythonGrammar, CasePattern>;

export type Chevron = NodeType<PythonGrammar, 'chevron'>;
export type ChevronConfig = BuilderConfig<PythonGrammar, Chevron>;

export type ClassDefinition = NodeType<PythonGrammar, 'class_definition'>;
export type ClassDefinitionConfig = BuilderConfig<PythonGrammar, ClassDefinition>;

export type ClassPattern = NodeType<PythonGrammar, 'class_pattern'>;
export type ClassPatternConfig = BuilderConfig<PythonGrammar, ClassPattern>;

export type ComparisonOperator = NodeType<PythonGrammar, 'comparison_operator'>;
export type ComparisonOperatorConfig = BuilderConfig<PythonGrammar, ComparisonOperator>;

export type ComplexPattern = NodeType<PythonGrammar, 'complex_pattern'>;
export type ComplexPatternConfig = BuilderConfig<PythonGrammar, ComplexPattern>;

export type ConcatenatedString = NodeType<PythonGrammar, 'concatenated_string'>;
export type ConcatenatedStringConfig = BuilderConfig<PythonGrammar, ConcatenatedString>;

export type ConditionalExpression = NodeType<PythonGrammar, 'conditional_expression'>;
export type ConditionalExpressionConfig = BuilderConfig<PythonGrammar, ConditionalExpression>;

export type ConstrainedType = NodeType<PythonGrammar, 'constrained_type'>;
export type ConstrainedTypeConfig = BuilderConfig<PythonGrammar, ConstrainedType>;

export type DecoratedDefinition = NodeType<PythonGrammar, 'decorated_definition'>;
export type DecoratedDefinitionConfig = BuilderConfig<PythonGrammar, DecoratedDefinition>;

export type Decorator = NodeType<PythonGrammar, 'decorator'>;
export type DecoratorConfig = BuilderConfig<PythonGrammar, Decorator>;

export type DefaultParameter = NodeType<PythonGrammar, 'default_parameter'>;
export type DefaultParameterConfig = BuilderConfig<PythonGrammar, DefaultParameter>;

export type DeleteStatement = NodeType<PythonGrammar, 'delete_statement'>;
export type DeleteStatementConfig = BuilderConfig<PythonGrammar, DeleteStatement>;

export type DictPattern = NodeType<PythonGrammar, 'dict_pattern'>;
export type DictPatternConfig = BuilderConfig<PythonGrammar, DictPattern>;

export type Dictionary = NodeType<PythonGrammar, 'dictionary'>;
export type DictionaryConfig = BuilderConfig<PythonGrammar, Dictionary>;

export type DictionaryComprehension = NodeType<PythonGrammar, 'dictionary_comprehension'>;
export type DictionaryComprehensionConfig = BuilderConfig<PythonGrammar, DictionaryComprehension>;

export type DictionarySplat = NodeType<PythonGrammar, 'dictionary_splat'>;
export type DictionarySplatConfig = BuilderConfig<PythonGrammar, DictionarySplat>;

export type DictionarySplatPattern = NodeType<PythonGrammar, 'dictionary_splat_pattern'>;
export type DictionarySplatPatternConfig = BuilderConfig<PythonGrammar, DictionarySplatPattern>;

export type DottedName = NodeType<PythonGrammar, 'dotted_name'>;
export type DottedNameConfig = BuilderConfig<PythonGrammar, DottedName>;

export type ElifClause = NodeType<PythonGrammar, 'elif_clause'>;
export type ElifClauseConfig = BuilderConfig<PythonGrammar, ElifClause>;

export type ElseClause = NodeType<PythonGrammar, 'else_clause'>;
export type ElseClauseConfig = BuilderConfig<PythonGrammar, ElseClause>;

export type ExceptClause = NodeType<PythonGrammar, 'except_clause'>;
export type ExceptClauseConfig = BuilderConfig<PythonGrammar, ExceptClause>;

export type ExecStatement = NodeType<PythonGrammar, 'exec_statement'>;
export type ExecStatementConfig = BuilderConfig<PythonGrammar, ExecStatement>;

export type ExpressionList = NodeType<PythonGrammar, 'expression_list'>;
export type ExpressionListConfig = BuilderConfig<PythonGrammar, ExpressionList>;

export type ExpressionStatement = NodeType<PythonGrammar, 'expression_statement'>;
export type ExpressionStatementConfig = BuilderConfig<PythonGrammar, ExpressionStatement>;

export type FinallyClause = NodeType<PythonGrammar, 'finally_clause'>;
export type FinallyClauseConfig = BuilderConfig<PythonGrammar, FinallyClause>;

export type ForInClause = NodeType<PythonGrammar, 'for_in_clause'>;
export type ForInClauseConfig = BuilderConfig<PythonGrammar, ForInClause>;

export type ForStatement = NodeType<PythonGrammar, 'for_statement'>;
export type ForStatementConfig = BuilderConfig<PythonGrammar, ForStatement>;

export type FormatExpression = NodeType<PythonGrammar, 'format_expression'>;
export type FormatExpressionConfig = BuilderConfig<PythonGrammar, FormatExpression>;

export type FormatSpecifier = NodeType<PythonGrammar, 'format_specifier'>;
export type FormatSpecifierConfig = BuilderConfig<PythonGrammar, FormatSpecifier>;

export type FunctionDefinition = NodeType<PythonGrammar, 'function_definition'>;
export type FunctionDefinitionConfig = BuilderConfig<PythonGrammar, FunctionDefinition>;

export type FutureImportStatement = NodeType<PythonGrammar, 'future_import_statement'>;
export type FutureImportStatementConfig = BuilderConfig<PythonGrammar, FutureImportStatement>;

export type GeneratorExpression = NodeType<PythonGrammar, 'generator_expression'>;
export type GeneratorExpressionConfig = BuilderConfig<PythonGrammar, GeneratorExpression>;

export type GenericType = NodeType<PythonGrammar, 'generic_type'>;
export type GenericTypeConfig = BuilderConfig<PythonGrammar, GenericType>;

export type GlobalStatement = NodeType<PythonGrammar, 'global_statement'>;
export type GlobalStatementConfig = BuilderConfig<PythonGrammar, GlobalStatement>;

export type IfClause = NodeType<PythonGrammar, 'if_clause'>;
export type IfClauseConfig = BuilderConfig<PythonGrammar, IfClause>;

export type IfStatement = NodeType<PythonGrammar, 'if_statement'>;
export type IfStatementConfig = BuilderConfig<PythonGrammar, IfStatement>;

export type ImportFromStatement = NodeType<PythonGrammar, 'import_from_statement'>;
export type ImportFromStatementConfig = BuilderConfig<PythonGrammar, ImportFromStatement>;

export type ImportStatement = NodeType<PythonGrammar, 'import_statement'>;
export type ImportStatementConfig = BuilderConfig<PythonGrammar, ImportStatement>;

export type Interpolation = NodeType<PythonGrammar, 'interpolation'>;
export type InterpolationConfig = BuilderConfig<PythonGrammar, Interpolation>;

export type KeywordArgument = NodeType<PythonGrammar, 'keyword_argument'>;
export type KeywordArgumentConfig = BuilderConfig<PythonGrammar, KeywordArgument>;

export type KeywordPattern = NodeType<PythonGrammar, 'keyword_pattern'>;
export type KeywordPatternConfig = BuilderConfig<PythonGrammar, KeywordPattern>;

export type LambdaParameters = NodeType<PythonGrammar, 'lambda_parameters'>;
export type LambdaParametersConfig = BuilderConfig<PythonGrammar, LambdaParameters>;

export type List = NodeType<PythonGrammar, 'list'>;
export type ListConfig = BuilderConfig<PythonGrammar, List>;

export type ListComprehension = NodeType<PythonGrammar, 'list_comprehension'>;
export type ListComprehensionConfig = BuilderConfig<PythonGrammar, ListComprehension>;

export type ListPattern = NodeType<PythonGrammar, 'list_pattern'>;
export type ListPatternConfig = BuilderConfig<PythonGrammar, ListPattern>;

export type ListSplat = NodeType<PythonGrammar, 'list_splat'>;
export type ListSplatConfig = BuilderConfig<PythonGrammar, ListSplat>;

export type ListSplatPattern = NodeType<PythonGrammar, 'list_splat_pattern'>;
export type ListSplatPatternConfig = BuilderConfig<PythonGrammar, ListSplatPattern>;

export type MatchStatement = NodeType<PythonGrammar, 'match_statement'>;
export type MatchStatementConfig = BuilderConfig<PythonGrammar, MatchStatement>;

export type MemberType = NodeType<PythonGrammar, 'member_type'>;
export type MemberTypeConfig = BuilderConfig<PythonGrammar, MemberType>;

export type Module = NodeType<PythonGrammar, 'module'>;
export type ModuleConfig = BuilderConfig<PythonGrammar, Module>;

export type NamedExpression = NodeType<PythonGrammar, 'named_expression'>;
export type NamedExpressionConfig = BuilderConfig<PythonGrammar, NamedExpression>;

export type NonlocalStatement = NodeType<PythonGrammar, 'nonlocal_statement'>;
export type NonlocalStatementConfig = BuilderConfig<PythonGrammar, NonlocalStatement>;

export type NotOperator = NodeType<PythonGrammar, 'not_operator'>;
export type NotOperatorConfig = BuilderConfig<PythonGrammar, NotOperator>;

export type Pair = NodeType<PythonGrammar, 'pair'>;
export type PairConfig = BuilderConfig<PythonGrammar, Pair>;

export type Parameters = NodeType<PythonGrammar, 'parameters'>;
export type ParametersConfig = BuilderConfig<PythonGrammar, Parameters>;

export type ParenthesizedExpression = NodeType<PythonGrammar, 'parenthesized_expression'>;
export type ParenthesizedExpressionConfig = BuilderConfig<PythonGrammar, ParenthesizedExpression>;

export type ParenthesizedListSplat = NodeType<PythonGrammar, 'parenthesized_list_splat'>;
export type ParenthesizedListSplatConfig = BuilderConfig<PythonGrammar, ParenthesizedListSplat>;

export type PatternList = NodeType<PythonGrammar, 'pattern_list'>;
export type PatternListConfig = BuilderConfig<PythonGrammar, PatternList>;

export type PrintStatement = NodeType<PythonGrammar, 'print_statement'>;
export type PrintStatementConfig = BuilderConfig<PythonGrammar, PrintStatement>;

export type RaiseStatement = NodeType<PythonGrammar, 'raise_statement'>;
export type RaiseStatementConfig = BuilderConfig<PythonGrammar, RaiseStatement>;

export type RelativeImport = NodeType<PythonGrammar, 'relative_import'>;
export type RelativeImportConfig = BuilderConfig<PythonGrammar, RelativeImport>;

export type ReturnStatement = NodeType<PythonGrammar, 'return_statement'>;
export type ReturnStatementConfig = BuilderConfig<PythonGrammar, ReturnStatement>;

export type Set = NodeType<PythonGrammar, 'set'>;
export type SetConfig = BuilderConfig<PythonGrammar, Set>;

export type SetComprehension = NodeType<PythonGrammar, 'set_comprehension'>;
export type SetComprehensionConfig = BuilderConfig<PythonGrammar, SetComprehension>;

export type Slice = NodeType<PythonGrammar, 'slice'>;
export type SliceConfig = BuilderConfig<PythonGrammar, Slice>;

export type SplatPattern = NodeType<PythonGrammar, 'splat_pattern'>;
export type SplatPatternConfig = BuilderConfig<PythonGrammar, SplatPattern>;

export type SplatType = NodeType<PythonGrammar, 'splat_type'>;
export type SplatTypeConfig = BuilderConfig<PythonGrammar, SplatType>;

export type String = NodeType<PythonGrammar, 'string'>;
export type StringConfig = BuilderConfig<PythonGrammar, String>;

export type StringContent = NodeType<PythonGrammar, 'string_content'>;
export type StringContentConfig = BuilderConfig<PythonGrammar, StringContent>;

export type Subscript = NodeType<PythonGrammar, 'subscript'>;
export type SubscriptConfig = BuilderConfig<PythonGrammar, Subscript>;

export type TryStatement = NodeType<PythonGrammar, 'try_statement'>;
export type TryStatementConfig = BuilderConfig<PythonGrammar, TryStatement>;

export type Tuple = NodeType<PythonGrammar, 'tuple'>;
export type TupleConfig = BuilderConfig<PythonGrammar, Tuple>;

export type TuplePattern = NodeType<PythonGrammar, 'tuple_pattern'>;
export type TuplePatternConfig = BuilderConfig<PythonGrammar, TuplePattern>;

export type TypeAliasStatement = NodeType<PythonGrammar, 'type_alias_statement'>;
export type TypeAliasStatementConfig = BuilderConfig<PythonGrammar, TypeAliasStatement>;

export type TypeParameter = NodeType<PythonGrammar, 'type_parameter'>;
export type TypeParameterConfig = BuilderConfig<PythonGrammar, TypeParameter>;

export type TypedDefaultParameter = NodeType<PythonGrammar, 'typed_default_parameter'>;
export type TypedDefaultParameterConfig = BuilderConfig<PythonGrammar, TypedDefaultParameter>;

export type TypedParameter = NodeType<PythonGrammar, 'typed_parameter'>;
export type TypedParameterConfig = BuilderConfig<PythonGrammar, TypedParameter>;

export type UnaryOperator = NodeType<PythonGrammar, 'unary_operator'>;
export type UnaryOperatorConfig = BuilderConfig<PythonGrammar, UnaryOperator>;

export type UnionPattern = NodeType<PythonGrammar, 'union_pattern'>;
export type UnionPatternConfig = BuilderConfig<PythonGrammar, UnionPattern>;

export type UnionType = NodeType<PythonGrammar, 'union_type'>;
export type UnionTypeConfig = BuilderConfig<PythonGrammar, UnionType>;

export type WhileStatement = NodeType<PythonGrammar, 'while_statement'>;
export type WhileStatementConfig = BuilderConfig<PythonGrammar, WhileStatement>;

export type WithClause = NodeType<PythonGrammar, 'with_clause'>;
export type WithClauseConfig = BuilderConfig<PythonGrammar, WithClause>;

export type WithItem = NodeType<PythonGrammar, 'with_item'>;
export type WithItemConfig = BuilderConfig<PythonGrammar, WithItem>;

export type WithStatement = NodeType<PythonGrammar, 'with_statement'>;
export type WithStatementConfig = BuilderConfig<PythonGrammar, WithStatement>;

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
  | NamedExpression
  | NotOperator
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
;

export type { ValidationResult };

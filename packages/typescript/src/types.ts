import type { TypescriptGrammar } from './grammar.js';
import type { NodeType, ValidationResult } from '@sittir/types';

export type { TypescriptGrammar };

export type AbstractClassDeclaration = NodeType<TypescriptGrammar, 'abstract_class_declaration'>;

export type AbstractMethodSignature = NodeType<TypescriptGrammar, 'abstract_method_signature'>;

export type AddingTypeAnnotation = NodeType<TypescriptGrammar, 'adding_type_annotation'>;

export type AmbientDeclaration = NodeType<TypescriptGrammar, 'ambient_declaration'>;

export type Arguments = NodeType<TypescriptGrammar, 'arguments'>;

export type Array = NodeType<TypescriptGrammar, 'array'>;

export type ArrayPattern = NodeType<TypescriptGrammar, 'array_pattern'>;

export type ArrayType = NodeType<TypescriptGrammar, 'array_type'>;

export type ArrowFunction = NodeType<TypescriptGrammar, 'arrow_function'>;

export type AsExpression = NodeType<TypescriptGrammar, 'as_expression'>;

export type Asserts = NodeType<TypescriptGrammar, 'asserts'>;

export type AssertsAnnotation = NodeType<TypescriptGrammar, 'asserts_annotation'>;

export type AssignmentExpression = NodeType<TypescriptGrammar, 'assignment_expression'>;

export type AssignmentPattern = NodeType<TypescriptGrammar, 'assignment_pattern'>;

export type AugmentedAssignmentExpression = NodeType<TypescriptGrammar, 'augmented_assignment_expression'>;

export type AwaitExpression = NodeType<TypescriptGrammar, 'await_expression'>;

export type BinaryExpression = NodeType<TypescriptGrammar, 'binary_expression'>;

export type BreakStatement = NodeType<TypescriptGrammar, 'break_statement'>;

export type CallExpression = NodeType<TypescriptGrammar, 'call_expression'>;

export type CallSignature = NodeType<TypescriptGrammar, 'call_signature'>;

export type CatchClause = NodeType<TypescriptGrammar, 'catch_clause'>;

export type Class = NodeType<TypescriptGrammar, 'class'>;

export type ClassBody = NodeType<TypescriptGrammar, 'class_body'>;

export type ClassDeclaration = NodeType<TypescriptGrammar, 'class_declaration'>;

export type ClassHeritage = NodeType<TypescriptGrammar, 'class_heritage'>;

export type ClassStaticBlock = NodeType<TypescriptGrammar, 'class_static_block'>;

export type ComputedPropertyName = NodeType<TypescriptGrammar, 'computed_property_name'>;

export type ConditionalType = NodeType<TypescriptGrammar, 'conditional_type'>;

export type Constraint = NodeType<TypescriptGrammar, 'constraint'>;

export type ConstructSignature = NodeType<TypescriptGrammar, 'construct_signature'>;

export type ConstructorType = NodeType<TypescriptGrammar, 'constructor_type'>;

export type ContinueStatement = NodeType<TypescriptGrammar, 'continue_statement'>;

export type Decorator = NodeType<TypescriptGrammar, 'decorator'>;

export type DefaultType = NodeType<TypescriptGrammar, 'default_type'>;

export type DoStatement = NodeType<TypescriptGrammar, 'do_statement'>;

export type ElseClause = NodeType<TypescriptGrammar, 'else_clause'>;

export type EnumAssignment = NodeType<TypescriptGrammar, 'enum_assignment'>;

export type EnumBody = NodeType<TypescriptGrammar, 'enum_body'>;

export type EnumDeclaration = NodeType<TypescriptGrammar, 'enum_declaration'>;

export type ExportClause = NodeType<TypescriptGrammar, 'export_clause'>;

export type ExportSpecifier = NodeType<TypescriptGrammar, 'export_specifier'>;

export type ExportStatement = NodeType<TypescriptGrammar, 'export_statement'>;

export type ExpressionStatement = NodeType<TypescriptGrammar, 'expression_statement'>;

export type ExtendsClause = NodeType<TypescriptGrammar, 'extends_clause'>;

export type ExtendsTypeClause = NodeType<TypescriptGrammar, 'extends_type_clause'>;

export type FinallyClause = NodeType<TypescriptGrammar, 'finally_clause'>;

export type FlowMaybeType = NodeType<TypescriptGrammar, 'flow_maybe_type'>;

export type ForInStatement = NodeType<TypescriptGrammar, 'for_in_statement'>;

export type ForStatement = NodeType<TypescriptGrammar, 'for_statement'>;

export type FormalParameters = NodeType<TypescriptGrammar, 'formal_parameters'>;

export type FunctionDeclaration = NodeType<TypescriptGrammar, 'function_declaration'>;

export type FunctionExpression = NodeType<TypescriptGrammar, 'function_expression'>;

export type FunctionSignature = NodeType<TypescriptGrammar, 'function_signature'>;

export type FunctionType = NodeType<TypescriptGrammar, 'function_type'>;

export type GeneratorFunction = NodeType<TypescriptGrammar, 'generator_function'>;

export type GeneratorFunctionDeclaration = NodeType<TypescriptGrammar, 'generator_function_declaration'>;

export type GenericType = NodeType<TypescriptGrammar, 'generic_type'>;

export type IfStatement = NodeType<TypescriptGrammar, 'if_statement'>;

export type ImplementsClause = NodeType<TypescriptGrammar, 'implements_clause'>;

export type ImportAlias = NodeType<TypescriptGrammar, 'import_alias'>;

export type ImportAttribute = NodeType<TypescriptGrammar, 'import_attribute'>;

export type ImportClause = NodeType<TypescriptGrammar, 'import_clause'>;

export type ImportRequireClause = NodeType<TypescriptGrammar, 'import_require_clause'>;

export type ImportSpecifier = NodeType<TypescriptGrammar, 'import_specifier'>;

export type ImportStatement = NodeType<TypescriptGrammar, 'import_statement'>;

export type IndexSignature = NodeType<TypescriptGrammar, 'index_signature'>;

export type IndexTypeQuery = NodeType<TypescriptGrammar, 'index_type_query'>;

export type InferType = NodeType<TypescriptGrammar, 'infer_type'>;

export type InstantiationExpression = NodeType<TypescriptGrammar, 'instantiation_expression'>;

export type InterfaceBody = NodeType<TypescriptGrammar, 'interface_body'>;

export type InterfaceDeclaration = NodeType<TypescriptGrammar, 'interface_declaration'>;

export type InternalModule = NodeType<TypescriptGrammar, 'internal_module'>;

export type IntersectionType = NodeType<TypescriptGrammar, 'intersection_type'>;

export type LabeledStatement = NodeType<TypescriptGrammar, 'labeled_statement'>;

export type LexicalDeclaration = NodeType<TypescriptGrammar, 'lexical_declaration'>;

export type LiteralType = NodeType<TypescriptGrammar, 'literal_type'>;

export type LookupType = NodeType<TypescriptGrammar, 'lookup_type'>;

export type MappedTypeClause = NodeType<TypescriptGrammar, 'mapped_type_clause'>;

export type MemberExpression = NodeType<TypescriptGrammar, 'member_expression'>;

export type MethodDefinition = NodeType<TypescriptGrammar, 'method_definition'>;

export type MethodSignature = NodeType<TypescriptGrammar, 'method_signature'>;

export type Module = NodeType<TypescriptGrammar, 'module'>;

export type NamedImports = NodeType<TypescriptGrammar, 'named_imports'>;

export type NamespaceExport = NodeType<TypescriptGrammar, 'namespace_export'>;

export type NamespaceImport = NodeType<TypescriptGrammar, 'namespace_import'>;

export type NestedIdentifier = NodeType<TypescriptGrammar, 'nested_identifier'>;

export type NestedTypeIdentifier = NodeType<TypescriptGrammar, 'nested_type_identifier'>;

export type NewExpression = NodeType<TypescriptGrammar, 'new_expression'>;

export type NonNullExpression = NodeType<TypescriptGrammar, 'non_null_expression'>;

export type Object = NodeType<TypescriptGrammar, 'object'>;

export type ObjectAssignmentPattern = NodeType<TypescriptGrammar, 'object_assignment_pattern'>;

export type ObjectPattern = NodeType<TypescriptGrammar, 'object_pattern'>;

export type ObjectType = NodeType<TypescriptGrammar, 'object_type'>;

export type OmittingTypeAnnotation = NodeType<TypescriptGrammar, 'omitting_type_annotation'>;

export type OptingTypeAnnotation = NodeType<TypescriptGrammar, 'opting_type_annotation'>;

export type OptionalParameter = NodeType<TypescriptGrammar, 'optional_parameter'>;

export type OptionalType = NodeType<TypescriptGrammar, 'optional_type'>;

export type Pair = NodeType<TypescriptGrammar, 'pair'>;

export type PairPattern = NodeType<TypescriptGrammar, 'pair_pattern'>;

export type ParenthesizedExpression = NodeType<TypescriptGrammar, 'parenthesized_expression'>;

export type ParenthesizedType = NodeType<TypescriptGrammar, 'parenthesized_type'>;

export type Program = NodeType<TypescriptGrammar, 'program'>;

export type PropertySignature = NodeType<TypescriptGrammar, 'property_signature'>;

export type PublicFieldDefinition = NodeType<TypescriptGrammar, 'public_field_definition'>;

export type ReadonlyType = NodeType<TypescriptGrammar, 'readonly_type'>;

export type Regex = NodeType<TypescriptGrammar, 'regex'>;

export type RequiredParameter = NodeType<TypescriptGrammar, 'required_parameter'>;

export type RestPattern = NodeType<TypescriptGrammar, 'rest_pattern'>;

export type RestType = NodeType<TypescriptGrammar, 'rest_type'>;

export type ReturnStatement = NodeType<TypescriptGrammar, 'return_statement'>;

export type SatisfiesExpression = NodeType<TypescriptGrammar, 'satisfies_expression'>;

export type SequenceExpression = NodeType<TypescriptGrammar, 'sequence_expression'>;

export type SpreadElement = NodeType<TypescriptGrammar, 'spread_element'>;

export type StatementBlock = NodeType<TypescriptGrammar, 'statement_block'>;

export type String = NodeType<TypescriptGrammar, 'string'>;

export type SubscriptExpression = NodeType<TypescriptGrammar, 'subscript_expression'>;

export type SwitchBody = NodeType<TypescriptGrammar, 'switch_body'>;

export type SwitchCase = NodeType<TypescriptGrammar, 'switch_case'>;

export type SwitchDefault = NodeType<TypescriptGrammar, 'switch_default'>;

export type SwitchStatement = NodeType<TypescriptGrammar, 'switch_statement'>;

export type TemplateLiteralType = NodeType<TypescriptGrammar, 'template_literal_type'>;

export type TemplateString = NodeType<TypescriptGrammar, 'template_string'>;

export type TemplateSubstitution = NodeType<TypescriptGrammar, 'template_substitution'>;

export type TemplateType = NodeType<TypescriptGrammar, 'template_type'>;

export type TernaryExpression = NodeType<TypescriptGrammar, 'ternary_expression'>;

export type ThrowStatement = NodeType<TypescriptGrammar, 'throw_statement'>;

export type TryStatement = NodeType<TypescriptGrammar, 'try_statement'>;

export type TupleType = NodeType<TypescriptGrammar, 'tuple_type'>;

export type TypeAliasDeclaration = NodeType<TypescriptGrammar, 'type_alias_declaration'>;

export type TypeAnnotation = NodeType<TypescriptGrammar, 'type_annotation'>;

export type TypeArguments = NodeType<TypescriptGrammar, 'type_arguments'>;

export type TypeAssertion = NodeType<TypescriptGrammar, 'type_assertion'>;

export type TypeParameter = NodeType<TypescriptGrammar, 'type_parameter'>;

export type TypeParameters = NodeType<TypescriptGrammar, 'type_parameters'>;

export type TypePredicate = NodeType<TypescriptGrammar, 'type_predicate'>;

export type TypePredicateAnnotation = NodeType<TypescriptGrammar, 'type_predicate_annotation'>;

export type TypeQuery = NodeType<TypescriptGrammar, 'type_query'>;

export type UnaryExpression = NodeType<TypescriptGrammar, 'unary_expression'>;

export type UnionType = NodeType<TypescriptGrammar, 'union_type'>;

export type UpdateExpression = NodeType<TypescriptGrammar, 'update_expression'>;

export type VariableDeclaration = NodeType<TypescriptGrammar, 'variable_declaration'>;

export type VariableDeclarator = NodeType<TypescriptGrammar, 'variable_declarator'>;

export type WhileStatement = NodeType<TypescriptGrammar, 'while_statement'>;

export type WithStatement = NodeType<TypescriptGrammar, 'with_statement'>;

export type YieldExpression = NodeType<TypescriptGrammar, 'yield_expression'>;

// Leaf node types
export type AccessibilityModifier = { kind: 'accessibility_modifier' };
export type DebuggerStatement = { kind: 'debugger_statement' };
export type EmptyStatement = { kind: 'empty_statement' };
export type ExistentialType = { kind: 'existential_type' };
export type Identifier = { kind: 'identifier' };
export type Import = { kind: 'import' };
export type MetaProperty = { kind: 'meta_property' };
export type OptionalChain = { kind: 'optional_chain' };
export type OverrideModifier = { kind: 'override_modifier' };
export type PredefinedType = { kind: 'predefined_type' };
export type Comment = { kind: 'comment' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type False = { kind: 'false' };
export type HashBangLine = { kind: 'hash_bang_line' };
export type HtmlComment = { kind: 'html_comment' };
export type Null = { kind: 'null' };
export type Number = { kind: 'number' };
export type PrivatePropertyIdentifier = { kind: 'private_property_identifier' };
export type PropertyIdentifier = { kind: 'property_identifier' };
export type RegexFlags = { kind: 'regex_flags' };
export type RegexPattern = { kind: 'regex_pattern' };
export type ShorthandPropertyIdentifier = { kind: 'shorthand_property_identifier' };
export type ShorthandPropertyIdentifierPattern = { kind: 'shorthand_property_identifier_pattern' };
export type StatementIdentifier = { kind: 'statement_identifier' };
export type StringFragment = { kind: 'string_fragment' };
export type Super = { kind: 'super' };
export type This = { kind: 'this' };
export type ThisType = { kind: 'this_type' };
export type True = { kind: 'true' };
export type TypeIdentifier = { kind: 'type_identifier' };
export type Undefined = { kind: 'undefined' };

// Supertype unions
export type Declaration =
  | AbstractClassDeclaration
  | AmbientDeclaration
  | ClassDeclaration
  | EnumDeclaration
  | FunctionDeclaration
  | FunctionSignature
  | GeneratorFunctionDeclaration
  | ImportAlias
  | InterfaceDeclaration
  | InternalModule
  | LexicalDeclaration
  | Module
  | TypeAliasDeclaration
  | VariableDeclaration
;

export type Expression =
  | AsExpression
  | AssignmentExpression
  | AugmentedAssignmentExpression
  | AwaitExpression
  | BinaryExpression
  | InstantiationExpression
  | InternalModule
  | NewExpression
  | PrimaryExpression
  | SatisfiesExpression
  | TernaryExpression
  | TypeAssertion
  | UnaryExpression
  | UpdateExpression
  | YieldExpression
;

export type Pattern =
  | ArrayPattern
  | Identifier
  | MemberExpression
  | NonNullExpression
  | ObjectPattern
  | RestPattern
  | SubscriptExpression
  | Undefined
;

export type PrimaryExpression =
  | Array
  | ArrowFunction
  | CallExpression
  | Class
  | False
  | FunctionExpression
  | GeneratorFunction
  | Identifier
  | MemberExpression
  | MetaProperty
  | NonNullExpression
  | Null
  | Number
  | Object
  | ParenthesizedExpression
  | Regex
  | String
  | SubscriptExpression
  | Super
  | TemplateString
  | This
  | True
  | Undefined
;

export type PrimaryType =
  | ArrayType
  | ConditionalType
  | ExistentialType
  | FlowMaybeType
  | GenericType
  | IndexTypeQuery
  | IntersectionType
  | LiteralType
  | LookupType
  | NestedTypeIdentifier
  | ObjectType
  | ParenthesizedType
  | PredefinedType
  | TemplateLiteralType
  | ThisType
  | TupleType
  | TypeIdentifier
  | TypeQuery
  | UnionType
;

export type Statement =
  | BreakStatement
  | ContinueStatement
  | DebuggerStatement
  | Declaration
  | DoStatement
  | EmptyStatement
  | ExportStatement
  | ExpressionStatement
  | ForInStatement
  | ForStatement
  | IfStatement
  | ImportStatement
  | LabeledStatement
  | ReturnStatement
  | StatementBlock
  | SwitchStatement
  | ThrowStatement
  | TryStatement
  | WhileStatement
  | WithStatement
;

export type Type =
  | CallExpression
  | ConstructorType
  | FunctionType
  | InferType
  | MemberExpression
  | PrimaryType
  | ReadonlyType
;

export type TypescriptIrNode =
  | AbstractClassDeclaration
  | AbstractMethodSignature
  | AddingTypeAnnotation
  | AmbientDeclaration
  | Arguments
  | Array
  | ArrayPattern
  | ArrayType
  | ArrowFunction
  | AsExpression
  | Asserts
  | AssertsAnnotation
  | AssignmentExpression
  | AssignmentPattern
  | AugmentedAssignmentExpression
  | AwaitExpression
  | BinaryExpression
  | BreakStatement
  | CallExpression
  | CallSignature
  | CatchClause
  | Class
  | ClassBody
  | ClassDeclaration
  | ClassHeritage
  | ClassStaticBlock
  | ComputedPropertyName
  | ConditionalType
  | Constraint
  | ConstructSignature
  | ConstructorType
  | ContinueStatement
  | Decorator
  | DefaultType
  | DoStatement
  | ElseClause
  | EnumAssignment
  | EnumBody
  | EnumDeclaration
  | ExportClause
  | ExportSpecifier
  | ExportStatement
  | ExpressionStatement
  | ExtendsClause
  | ExtendsTypeClause
  | FinallyClause
  | FlowMaybeType
  | ForInStatement
  | ForStatement
  | FormalParameters
  | FunctionDeclaration
  | FunctionExpression
  | FunctionSignature
  | FunctionType
  | GeneratorFunction
  | GeneratorFunctionDeclaration
  | GenericType
  | IfStatement
  | ImplementsClause
  | ImportAlias
  | ImportAttribute
  | ImportClause
  | ImportRequireClause
  | ImportSpecifier
  | ImportStatement
  | IndexSignature
  | IndexTypeQuery
  | InferType
  | InstantiationExpression
  | InterfaceBody
  | InterfaceDeclaration
  | InternalModule
  | IntersectionType
  | LabeledStatement
  | LexicalDeclaration
  | LiteralType
  | LookupType
  | MappedTypeClause
  | MemberExpression
  | MethodDefinition
  | MethodSignature
  | Module
  | NamedImports
  | NamespaceExport
  | NamespaceImport
  | NestedIdentifier
  | NestedTypeIdentifier
  | NewExpression
  | NonNullExpression
  | Object
  | ObjectAssignmentPattern
  | ObjectPattern
  | ObjectType
  | OmittingTypeAnnotation
  | OptingTypeAnnotation
  | OptionalParameter
  | OptionalType
  | Pair
  | PairPattern
  | ParenthesizedExpression
  | ParenthesizedType
  | Program
  | PropertySignature
  | PublicFieldDefinition
  | ReadonlyType
  | Regex
  | RequiredParameter
  | RestPattern
  | RestType
  | ReturnStatement
  | SatisfiesExpression
  | SequenceExpression
  | SpreadElement
  | StatementBlock
  | String
  | SubscriptExpression
  | SwitchBody
  | SwitchCase
  | SwitchDefault
  | SwitchStatement
  | TemplateLiteralType
  | TemplateString
  | TemplateSubstitution
  | TemplateType
  | TernaryExpression
  | ThrowStatement
  | TryStatement
  | TupleType
  | TypeAliasDeclaration
  | TypeAnnotation
  | TypeArguments
  | TypeAssertion
  | TypeParameter
  | TypeParameters
  | TypePredicate
  | TypePredicateAnnotation
  | TypeQuery
  | UnaryExpression
  | UnionType
  | UpdateExpression
  | VariableDeclaration
  | VariableDeclarator
  | WhileStatement
  | WithStatement
  | YieldExpression
;

export type { ValidationResult };

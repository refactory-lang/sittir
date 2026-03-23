import type { TsxGrammar } from './grammar.js';
import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';

export type { TsxGrammar };

export type AbstractClassDeclaration = NodeType<TsxGrammar, 'abstract_class_declaration'>;
export type AbstractClassDeclarationConfig = BuilderConfig<TsxGrammar, AbstractClassDeclaration>;

export type AbstractMethodSignature = NodeType<TsxGrammar, 'abstract_method_signature'>;
export type AbstractMethodSignatureConfig = BuilderConfig<TsxGrammar, AbstractMethodSignature>;

export type AddingTypeAnnotation = NodeType<TsxGrammar, 'adding_type_annotation'>;
export type AddingTypeAnnotationConfig = BuilderConfig<TsxGrammar, AddingTypeAnnotation>;

export type AmbientDeclaration = NodeType<TsxGrammar, 'ambient_declaration'>;
export type AmbientDeclarationConfig = BuilderConfig<TsxGrammar, AmbientDeclaration>;

export type Arguments = NodeType<TsxGrammar, 'arguments'>;
export type ArgumentsConfig = BuilderConfig<TsxGrammar, Arguments>;

export type Array = NodeType<TsxGrammar, 'array'>;
export type ArrayConfig = BuilderConfig<TsxGrammar, Array>;

export type ArrayPattern = NodeType<TsxGrammar, 'array_pattern'>;
export type ArrayPatternConfig = BuilderConfig<TsxGrammar, ArrayPattern>;

export type ArrayType = NodeType<TsxGrammar, 'array_type'>;
export type ArrayTypeConfig = BuilderConfig<TsxGrammar, ArrayType>;

export type ArrowFunction = NodeType<TsxGrammar, 'arrow_function'>;
export type ArrowFunctionConfig = BuilderConfig<TsxGrammar, ArrowFunction>;

export type AsExpression = NodeType<TsxGrammar, 'as_expression'>;
export type AsExpressionConfig = BuilderConfig<TsxGrammar, AsExpression>;

export type AssertsAnnotation = NodeType<TsxGrammar, 'asserts_annotation'>;
export type AssertsAnnotationConfig = BuilderConfig<TsxGrammar, AssertsAnnotation>;

export type AssignmentExpression = NodeType<TsxGrammar, 'assignment_expression'>;
export type AssignmentExpressionConfig = BuilderConfig<TsxGrammar, AssignmentExpression>;

export type AssignmentPattern = NodeType<TsxGrammar, 'assignment_pattern'>;
export type AssignmentPatternConfig = BuilderConfig<TsxGrammar, AssignmentPattern>;

export type AugmentedAssignmentExpression = NodeType<TsxGrammar, 'augmented_assignment_expression'>;
export type AugmentedAssignmentExpressionConfig = BuilderConfig<TsxGrammar, AugmentedAssignmentExpression>;

export type AwaitExpression = NodeType<TsxGrammar, 'await_expression'>;
export type AwaitExpressionConfig = BuilderConfig<TsxGrammar, AwaitExpression>;

export type BinaryExpression = NodeType<TsxGrammar, 'binary_expression'>;
export type BinaryExpressionConfig = BuilderConfig<TsxGrammar, BinaryExpression>;

export type BreakStatement = NodeType<TsxGrammar, 'break_statement'>;
export type BreakStatementConfig = BuilderConfig<TsxGrammar, BreakStatement>;

export type CallExpression = NodeType<TsxGrammar, 'call_expression'>;
export type CallExpressionConfig = BuilderConfig<TsxGrammar, CallExpression>;

export type CallSignature = NodeType<TsxGrammar, 'call_signature'>;
export type CallSignatureConfig = BuilderConfig<TsxGrammar, CallSignature>;

export type CatchClause = NodeType<TsxGrammar, 'catch_clause'>;
export type CatchClauseConfig = BuilderConfig<TsxGrammar, CatchClause>;

export type ClassBody = NodeType<TsxGrammar, 'class_body'>;
export type ClassBodyConfig = BuilderConfig<TsxGrammar, ClassBody>;

export type ClassDeclaration = NodeType<TsxGrammar, 'class_declaration'>;
export type ClassDeclarationConfig = BuilderConfig<TsxGrammar, ClassDeclaration>;

export type ClassHeritage = NodeType<TsxGrammar, 'class_heritage'>;
export type ClassHeritageConfig = BuilderConfig<TsxGrammar, ClassHeritage>;

export type ClassStaticBlock = NodeType<TsxGrammar, 'class_static_block'>;
export type ClassStaticBlockConfig = BuilderConfig<TsxGrammar, ClassStaticBlock>;

export type ComputedPropertyName = NodeType<TsxGrammar, 'computed_property_name'>;
export type ComputedPropertyNameConfig = BuilderConfig<TsxGrammar, ComputedPropertyName>;

export type ConditionalType = NodeType<TsxGrammar, 'conditional_type'>;
export type ConditionalTypeConfig = BuilderConfig<TsxGrammar, ConditionalType>;

export type Constraint = NodeType<TsxGrammar, 'constraint'>;
export type ConstraintConfig = BuilderConfig<TsxGrammar, Constraint>;

export type ConstructSignature = NodeType<TsxGrammar, 'construct_signature'>;
export type ConstructSignatureConfig = BuilderConfig<TsxGrammar, ConstructSignature>;

export type ConstructorType = NodeType<TsxGrammar, 'constructor_type'>;
export type ConstructorTypeConfig = BuilderConfig<TsxGrammar, ConstructorType>;

export type ContinueStatement = NodeType<TsxGrammar, 'continue_statement'>;
export type ContinueStatementConfig = BuilderConfig<TsxGrammar, ContinueStatement>;

export type Decorator = NodeType<TsxGrammar, 'decorator'>;
export type DecoratorConfig = BuilderConfig<TsxGrammar, Decorator>;

export type DefaultType = NodeType<TsxGrammar, 'default_type'>;
export type DefaultTypeConfig = BuilderConfig<TsxGrammar, DefaultType>;

export type DoStatement = NodeType<TsxGrammar, 'do_statement'>;
export type DoStatementConfig = BuilderConfig<TsxGrammar, DoStatement>;

export type ElseClause = NodeType<TsxGrammar, 'else_clause'>;
export type ElseClauseConfig = BuilderConfig<TsxGrammar, ElseClause>;

export type EnumAssignment = NodeType<TsxGrammar, 'enum_assignment'>;
export type EnumAssignmentConfig = BuilderConfig<TsxGrammar, EnumAssignment>;

export type EnumBody = NodeType<TsxGrammar, 'enum_body'>;
export type EnumBodyConfig = BuilderConfig<TsxGrammar, EnumBody>;

export type EnumDeclaration = NodeType<TsxGrammar, 'enum_declaration'>;
export type EnumDeclarationConfig = BuilderConfig<TsxGrammar, EnumDeclaration>;

export type ExportClause = NodeType<TsxGrammar, 'export_clause'>;
export type ExportClauseConfig = BuilderConfig<TsxGrammar, ExportClause>;

export type ExportSpecifier = NodeType<TsxGrammar, 'export_specifier'>;
export type ExportSpecifierConfig = BuilderConfig<TsxGrammar, ExportSpecifier>;

export type ExportStatement = NodeType<TsxGrammar, 'export_statement'>;
export type ExportStatementConfig = BuilderConfig<TsxGrammar, ExportStatement>;

export type ExpressionStatement = NodeType<TsxGrammar, 'expression_statement'>;
export type ExpressionStatementConfig = BuilderConfig<TsxGrammar, ExpressionStatement>;

export type ExtendsClause = NodeType<TsxGrammar, 'extends_clause'>;
export type ExtendsClauseConfig = BuilderConfig<TsxGrammar, ExtendsClause>;

export type ExtendsTypeClause = NodeType<TsxGrammar, 'extends_type_clause'>;
export type ExtendsTypeClauseConfig = BuilderConfig<TsxGrammar, ExtendsTypeClause>;

export type FinallyClause = NodeType<TsxGrammar, 'finally_clause'>;
export type FinallyClauseConfig = BuilderConfig<TsxGrammar, FinallyClause>;

export type FlowMaybeType = NodeType<TsxGrammar, 'flow_maybe_type'>;
export type FlowMaybeTypeConfig = BuilderConfig<TsxGrammar, FlowMaybeType>;

export type ForInStatement = NodeType<TsxGrammar, 'for_in_statement'>;
export type ForInStatementConfig = BuilderConfig<TsxGrammar, ForInStatement>;

export type ForStatement = NodeType<TsxGrammar, 'for_statement'>;
export type ForStatementConfig = BuilderConfig<TsxGrammar, ForStatement>;

export type FormalParameters = NodeType<TsxGrammar, 'formal_parameters'>;
export type FormalParametersConfig = BuilderConfig<TsxGrammar, FormalParameters>;

export type FunctionDeclaration = NodeType<TsxGrammar, 'function_declaration'>;
export type FunctionDeclarationConfig = BuilderConfig<TsxGrammar, FunctionDeclaration>;

export type FunctionExpression = NodeType<TsxGrammar, 'function_expression'>;
export type FunctionExpressionConfig = BuilderConfig<TsxGrammar, FunctionExpression>;

export type FunctionSignature = NodeType<TsxGrammar, 'function_signature'>;
export type FunctionSignatureConfig = BuilderConfig<TsxGrammar, FunctionSignature>;

export type FunctionType = NodeType<TsxGrammar, 'function_type'>;
export type FunctionTypeConfig = BuilderConfig<TsxGrammar, FunctionType>;

export type GeneratorFunction = NodeType<TsxGrammar, 'generator_function'>;
export type GeneratorFunctionConfig = BuilderConfig<TsxGrammar, GeneratorFunction>;

export type GeneratorFunctionDeclaration = NodeType<TsxGrammar, 'generator_function_declaration'>;
export type GeneratorFunctionDeclarationConfig = BuilderConfig<TsxGrammar, GeneratorFunctionDeclaration>;

export type GenericType = NodeType<TsxGrammar, 'generic_type'>;
export type GenericTypeConfig = BuilderConfig<TsxGrammar, GenericType>;

export type IfStatement = NodeType<TsxGrammar, 'if_statement'>;
export type IfStatementConfig = BuilderConfig<TsxGrammar, IfStatement>;

export type ImplementsClause = NodeType<TsxGrammar, 'implements_clause'>;
export type ImplementsClauseConfig = BuilderConfig<TsxGrammar, ImplementsClause>;

export type ImportAlias = NodeType<TsxGrammar, 'import_alias'>;
export type ImportAliasConfig = BuilderConfig<TsxGrammar, ImportAlias>;

export type ImportAttribute = NodeType<TsxGrammar, 'import_attribute'>;
export type ImportAttributeConfig = BuilderConfig<TsxGrammar, ImportAttribute>;

export type ImportClause = NodeType<TsxGrammar, 'import_clause'>;
export type ImportClauseConfig = BuilderConfig<TsxGrammar, ImportClause>;

export type ImportRequireClause = NodeType<TsxGrammar, 'import_require_clause'>;
export type ImportRequireClauseConfig = BuilderConfig<TsxGrammar, ImportRequireClause>;

export type ImportSpecifier = NodeType<TsxGrammar, 'import_specifier'>;
export type ImportSpecifierConfig = BuilderConfig<TsxGrammar, ImportSpecifier>;

export type ImportStatement = NodeType<TsxGrammar, 'import_statement'>;
export type ImportStatementConfig = BuilderConfig<TsxGrammar, ImportStatement>;

export type IndexSignature = NodeType<TsxGrammar, 'index_signature'>;
export type IndexSignatureConfig = BuilderConfig<TsxGrammar, IndexSignature>;

export type IndexTypeQuery = NodeType<TsxGrammar, 'index_type_query'>;
export type IndexTypeQueryConfig = BuilderConfig<TsxGrammar, IndexTypeQuery>;

export type InferType = NodeType<TsxGrammar, 'infer_type'>;
export type InferTypeConfig = BuilderConfig<TsxGrammar, InferType>;

export type InstantiationExpression = NodeType<TsxGrammar, 'instantiation_expression'>;
export type InstantiationExpressionConfig = BuilderConfig<TsxGrammar, InstantiationExpression>;

export type InterfaceBody = NodeType<TsxGrammar, 'interface_body'>;
export type InterfaceBodyConfig = BuilderConfig<TsxGrammar, InterfaceBody>;

export type InterfaceDeclaration = NodeType<TsxGrammar, 'interface_declaration'>;
export type InterfaceDeclarationConfig = BuilderConfig<TsxGrammar, InterfaceDeclaration>;

export type InternalModule = NodeType<TsxGrammar, 'internal_module'>;
export type InternalModuleConfig = BuilderConfig<TsxGrammar, InternalModule>;

export type IntersectionType = NodeType<TsxGrammar, 'intersection_type'>;
export type IntersectionTypeConfig = BuilderConfig<TsxGrammar, IntersectionType>;

export type JsxAttribute = NodeType<TsxGrammar, 'jsx_attribute'>;
export type JsxAttributeConfig = BuilderConfig<TsxGrammar, JsxAttribute>;

export type JsxClosingElement = NodeType<TsxGrammar, 'jsx_closing_element'>;
export type JsxClosingElementConfig = BuilderConfig<TsxGrammar, JsxClosingElement>;

export type JsxElement = NodeType<TsxGrammar, 'jsx_element'>;
export type JsxElementConfig = BuilderConfig<TsxGrammar, JsxElement>;

export type JsxExpression = NodeType<TsxGrammar, 'jsx_expression'>;
export type JsxExpressionConfig = BuilderConfig<TsxGrammar, JsxExpression>;

export type JsxNamespaceName = NodeType<TsxGrammar, 'jsx_namespace_name'>;
export type JsxNamespaceNameConfig = BuilderConfig<TsxGrammar, JsxNamespaceName>;

export type JsxOpeningElement = NodeType<TsxGrammar, 'jsx_opening_element'>;
export type JsxOpeningElementConfig = BuilderConfig<TsxGrammar, JsxOpeningElement>;

export type JsxSelfClosingElement = NodeType<TsxGrammar, 'jsx_self_closing_element'>;
export type JsxSelfClosingElementConfig = BuilderConfig<TsxGrammar, JsxSelfClosingElement>;

export type LabeledStatement = NodeType<TsxGrammar, 'labeled_statement'>;
export type LabeledStatementConfig = BuilderConfig<TsxGrammar, LabeledStatement>;

export type LexicalDeclaration = NodeType<TsxGrammar, 'lexical_declaration'>;
export type LexicalDeclarationConfig = BuilderConfig<TsxGrammar, LexicalDeclaration>;

export type LiteralType = NodeType<TsxGrammar, 'literal_type'>;
export type LiteralTypeConfig = BuilderConfig<TsxGrammar, LiteralType>;

export type LookupType = NodeType<TsxGrammar, 'lookup_type'>;
export type LookupTypeConfig = BuilderConfig<TsxGrammar, LookupType>;

export type MappedTypeClause = NodeType<TsxGrammar, 'mapped_type_clause'>;
export type MappedTypeClauseConfig = BuilderConfig<TsxGrammar, MappedTypeClause>;

export type MemberExpression = NodeType<TsxGrammar, 'member_expression'>;
export type MemberExpressionConfig = BuilderConfig<TsxGrammar, MemberExpression>;

export type MethodDefinition = NodeType<TsxGrammar, 'method_definition'>;
export type MethodDefinitionConfig = BuilderConfig<TsxGrammar, MethodDefinition>;

export type MethodSignature = NodeType<TsxGrammar, 'method_signature'>;
export type MethodSignatureConfig = BuilderConfig<TsxGrammar, MethodSignature>;

export type NamedImports = NodeType<TsxGrammar, 'named_imports'>;
export type NamedImportsConfig = BuilderConfig<TsxGrammar, NamedImports>;

export type NamespaceExport = NodeType<TsxGrammar, 'namespace_export'>;
export type NamespaceExportConfig = BuilderConfig<TsxGrammar, NamespaceExport>;

export type NamespaceImport = NodeType<TsxGrammar, 'namespace_import'>;
export type NamespaceImportConfig = BuilderConfig<TsxGrammar, NamespaceImport>;

export type NestedIdentifier = NodeType<TsxGrammar, 'nested_identifier'>;
export type NestedIdentifierConfig = BuilderConfig<TsxGrammar, NestedIdentifier>;

export type NestedTypeIdentifier = NodeType<TsxGrammar, 'nested_type_identifier'>;
export type NestedTypeIdentifierConfig = BuilderConfig<TsxGrammar, NestedTypeIdentifier>;

export type NewExpression = NodeType<TsxGrammar, 'new_expression'>;
export type NewExpressionConfig = BuilderConfig<TsxGrammar, NewExpression>;

export type NonNullExpression = NodeType<TsxGrammar, 'non_null_expression'>;
export type NonNullExpressionConfig = BuilderConfig<TsxGrammar, NonNullExpression>;

export type ObjectAssignmentPattern = NodeType<TsxGrammar, 'object_assignment_pattern'>;
export type ObjectAssignmentPatternConfig = BuilderConfig<TsxGrammar, ObjectAssignmentPattern>;

export type ObjectPattern = NodeType<TsxGrammar, 'object_pattern'>;
export type ObjectPatternConfig = BuilderConfig<TsxGrammar, ObjectPattern>;

export type ObjectType = NodeType<TsxGrammar, 'object_type'>;
export type ObjectTypeConfig = BuilderConfig<TsxGrammar, ObjectType>;

export type OmittingTypeAnnotation = NodeType<TsxGrammar, 'omitting_type_annotation'>;
export type OmittingTypeAnnotationConfig = BuilderConfig<TsxGrammar, OmittingTypeAnnotation>;

export type OptingTypeAnnotation = NodeType<TsxGrammar, 'opting_type_annotation'>;
export type OptingTypeAnnotationConfig = BuilderConfig<TsxGrammar, OptingTypeAnnotation>;

export type OptionalParameter = NodeType<TsxGrammar, 'optional_parameter'>;
export type OptionalParameterConfig = BuilderConfig<TsxGrammar, OptionalParameter>;

export type OptionalType = NodeType<TsxGrammar, 'optional_type'>;
export type OptionalTypeConfig = BuilderConfig<TsxGrammar, OptionalType>;

export type Pair = NodeType<TsxGrammar, 'pair'>;
export type PairConfig = BuilderConfig<TsxGrammar, Pair>;

export type PairPattern = NodeType<TsxGrammar, 'pair_pattern'>;
export type PairPatternConfig = BuilderConfig<TsxGrammar, PairPattern>;

export type ParenthesizedExpression = NodeType<TsxGrammar, 'parenthesized_expression'>;
export type ParenthesizedExpressionConfig = BuilderConfig<TsxGrammar, ParenthesizedExpression>;

export type ParenthesizedType = NodeType<TsxGrammar, 'parenthesized_type'>;
export type ParenthesizedTypeConfig = BuilderConfig<TsxGrammar, ParenthesizedType>;

export type Program = NodeType<TsxGrammar, 'program'>;
export type ProgramConfig = BuilderConfig<TsxGrammar, Program>;

export type PropertySignature = NodeType<TsxGrammar, 'property_signature'>;
export type PropertySignatureConfig = BuilderConfig<TsxGrammar, PropertySignature>;

export type PublicFieldDefinition = NodeType<TsxGrammar, 'public_field_definition'>;
export type PublicFieldDefinitionConfig = BuilderConfig<TsxGrammar, PublicFieldDefinition>;

export type ReadonlyType = NodeType<TsxGrammar, 'readonly_type'>;
export type ReadonlyTypeConfig = BuilderConfig<TsxGrammar, ReadonlyType>;

export type Regex = NodeType<TsxGrammar, 'regex'>;
export type RegexConfig = BuilderConfig<TsxGrammar, Regex>;

export type RequiredParameter = NodeType<TsxGrammar, 'required_parameter'>;
export type RequiredParameterConfig = BuilderConfig<TsxGrammar, RequiredParameter>;

export type RestPattern = NodeType<TsxGrammar, 'rest_pattern'>;
export type RestPatternConfig = BuilderConfig<TsxGrammar, RestPattern>;

export type RestType = NodeType<TsxGrammar, 'rest_type'>;
export type RestTypeConfig = BuilderConfig<TsxGrammar, RestType>;

export type ReturnStatement = NodeType<TsxGrammar, 'return_statement'>;
export type ReturnStatementConfig = BuilderConfig<TsxGrammar, ReturnStatement>;

export type SatisfiesExpression = NodeType<TsxGrammar, 'satisfies_expression'>;
export type SatisfiesExpressionConfig = BuilderConfig<TsxGrammar, SatisfiesExpression>;

export type SequenceExpression = NodeType<TsxGrammar, 'sequence_expression'>;
export type SequenceExpressionConfig = BuilderConfig<TsxGrammar, SequenceExpression>;

export type SpreadElement = NodeType<TsxGrammar, 'spread_element'>;
export type SpreadElementConfig = BuilderConfig<TsxGrammar, SpreadElement>;

export type StatementBlock = NodeType<TsxGrammar, 'statement_block'>;
export type StatementBlockConfig = BuilderConfig<TsxGrammar, StatementBlock>;

export type SubscriptExpression = NodeType<TsxGrammar, 'subscript_expression'>;
export type SubscriptExpressionConfig = BuilderConfig<TsxGrammar, SubscriptExpression>;

export type SwitchBody = NodeType<TsxGrammar, 'switch_body'>;
export type SwitchBodyConfig = BuilderConfig<TsxGrammar, SwitchBody>;

export type SwitchCase = NodeType<TsxGrammar, 'switch_case'>;
export type SwitchCaseConfig = BuilderConfig<TsxGrammar, SwitchCase>;

export type SwitchDefault = NodeType<TsxGrammar, 'switch_default'>;
export type SwitchDefaultConfig = BuilderConfig<TsxGrammar, SwitchDefault>;

export type SwitchStatement = NodeType<TsxGrammar, 'switch_statement'>;
export type SwitchStatementConfig = BuilderConfig<TsxGrammar, SwitchStatement>;

export type TemplateLiteralType = NodeType<TsxGrammar, 'template_literal_type'>;
export type TemplateLiteralTypeConfig = BuilderConfig<TsxGrammar, TemplateLiteralType>;

export type TemplateString = NodeType<TsxGrammar, 'template_string'>;
export type TemplateStringConfig = BuilderConfig<TsxGrammar, TemplateString>;

export type TemplateSubstitution = NodeType<TsxGrammar, 'template_substitution'>;
export type TemplateSubstitutionConfig = BuilderConfig<TsxGrammar, TemplateSubstitution>;

export type TemplateType = NodeType<TsxGrammar, 'template_type'>;
export type TemplateTypeConfig = BuilderConfig<TsxGrammar, TemplateType>;

export type TernaryExpression = NodeType<TsxGrammar, 'ternary_expression'>;
export type TernaryExpressionConfig = BuilderConfig<TsxGrammar, TernaryExpression>;

export type ThrowStatement = NodeType<TsxGrammar, 'throw_statement'>;
export type ThrowStatementConfig = BuilderConfig<TsxGrammar, ThrowStatement>;

export type TryStatement = NodeType<TsxGrammar, 'try_statement'>;
export type TryStatementConfig = BuilderConfig<TsxGrammar, TryStatement>;

export type TupleType = NodeType<TsxGrammar, 'tuple_type'>;
export type TupleTypeConfig = BuilderConfig<TsxGrammar, TupleType>;

export type TypeAliasDeclaration = NodeType<TsxGrammar, 'type_alias_declaration'>;
export type TypeAliasDeclarationConfig = BuilderConfig<TsxGrammar, TypeAliasDeclaration>;

export type TypeAnnotation = NodeType<TsxGrammar, 'type_annotation'>;
export type TypeAnnotationConfig = BuilderConfig<TsxGrammar, TypeAnnotation>;

export type TypeArguments = NodeType<TsxGrammar, 'type_arguments'>;
export type TypeArgumentsConfig = BuilderConfig<TsxGrammar, TypeArguments>;

export type TypeParameter = NodeType<TsxGrammar, 'type_parameter'>;
export type TypeParameterConfig = BuilderConfig<TsxGrammar, TypeParameter>;

export type TypeParameters = NodeType<TsxGrammar, 'type_parameters'>;
export type TypeParametersConfig = BuilderConfig<TsxGrammar, TypeParameters>;

export type TypePredicate = NodeType<TsxGrammar, 'type_predicate'>;
export type TypePredicateConfig = BuilderConfig<TsxGrammar, TypePredicate>;

export type TypePredicateAnnotation = NodeType<TsxGrammar, 'type_predicate_annotation'>;
export type TypePredicateAnnotationConfig = BuilderConfig<TsxGrammar, TypePredicateAnnotation>;

export type TypeQuery = NodeType<TsxGrammar, 'type_query'>;
export type TypeQueryConfig = BuilderConfig<TsxGrammar, TypeQuery>;

export type UnaryExpression = NodeType<TsxGrammar, 'unary_expression'>;
export type UnaryExpressionConfig = BuilderConfig<TsxGrammar, UnaryExpression>;

export type UnionType = NodeType<TsxGrammar, 'union_type'>;
export type UnionTypeConfig = BuilderConfig<TsxGrammar, UnionType>;

export type UpdateExpression = NodeType<TsxGrammar, 'update_expression'>;
export type UpdateExpressionConfig = BuilderConfig<TsxGrammar, UpdateExpression>;

export type VariableDeclaration = NodeType<TsxGrammar, 'variable_declaration'>;
export type VariableDeclarationConfig = BuilderConfig<TsxGrammar, VariableDeclaration>;

export type VariableDeclarator = NodeType<TsxGrammar, 'variable_declarator'>;
export type VariableDeclaratorConfig = BuilderConfig<TsxGrammar, VariableDeclarator>;

export type WhileStatement = NodeType<TsxGrammar, 'while_statement'>;
export type WhileStatementConfig = BuilderConfig<TsxGrammar, WhileStatement>;

export type WithStatement = NodeType<TsxGrammar, 'with_statement'>;
export type WithStatementConfig = BuilderConfig<TsxGrammar, WithStatement>;

export type YieldExpression = NodeType<TsxGrammar, 'yield_expression'>;
export type YieldExpressionConfig = BuilderConfig<TsxGrammar, YieldExpression>;

// Leaf node types
export type AccessibilityModifier = { kind: 'accessibility_modifier' };
export type DebuggerStatement = { kind: 'debugger_statement' };
export type EmptyStatement = { kind: 'empty_statement' };
export type ExistentialType = { kind: 'existential_type' };
export type Identifier = { kind: 'identifier' };
export type MetaProperty = { kind: 'meta_property' };
export type OptionalChain = { kind: 'optional_chain' };
export type OverrideModifier = { kind: 'override_modifier' };
export type PredefinedType = { kind: 'predefined_type' };
export type Comment = { kind: 'comment' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type False = { kind: 'false' };
export type HashBangLine = { kind: 'hash_bang_line' };
export type HtmlCharacterReference = { kind: 'html_character_reference' };
export type HtmlComment = { kind: 'html_comment' };
export type JsxText = { kind: 'jsx_text' };
export type Null = { kind: 'null' };
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
  | JsxElement
  | JsxSelfClosingElement
  | NewExpression
  | SatisfiesExpression
  | TernaryExpression
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
  | False
  | FunctionExpression
  | GeneratorFunction
  | Identifier
  | MemberExpression
  | MetaProperty
  | NonNullExpression
  | Null
  | ParenthesizedExpression
  | Regex
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

export type TsxIrNode =
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
  | JsxAttribute
  | JsxClosingElement
  | JsxElement
  | JsxExpression
  | JsxNamespaceName
  | JsxOpeningElement
  | JsxSelfClosingElement
  | LabeledStatement
  | LexicalDeclaration
  | LiteralType
  | LookupType
  | MappedTypeClause
  | MemberExpression
  | MethodDefinition
  | MethodSignature
  | NamedImports
  | NamespaceExport
  | NamespaceImport
  | NestedIdentifier
  | NestedTypeIdentifier
  | NewExpression
  | NonNullExpression
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

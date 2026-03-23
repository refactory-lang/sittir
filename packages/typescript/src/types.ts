import type { TypescriptGrammar } from './grammar.js';
import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';

export type { TypescriptGrammar };

export type Program = NodeType<TypescriptGrammar, 'program'>;
export type ProgramConfig = BuilderConfig<TypescriptGrammar, Program>;

export type ExportStatement = NodeType<TypescriptGrammar, 'export_statement'>;
export type ExportStatementConfig = BuilderConfig<TypescriptGrammar, ExportStatement>;

export type NamespaceExport = NodeType<TypescriptGrammar, 'namespace_export'>;
export type NamespaceExportConfig = BuilderConfig<TypescriptGrammar, NamespaceExport>;

export type ExportClause = NodeType<TypescriptGrammar, 'export_clause'>;
export type ExportClauseConfig = BuilderConfig<TypescriptGrammar, ExportClause>;

export type ExportSpecifier = NodeType<TypescriptGrammar, 'export_specifier'>;
export type ExportSpecifierConfig = BuilderConfig<TypescriptGrammar, ExportSpecifier>;

export type ImportStatement = NodeType<TypescriptGrammar, 'import_statement'>;
export type ImportStatementConfig = BuilderConfig<TypescriptGrammar, ImportStatement>;

export type ImportClause = NodeType<TypescriptGrammar, 'import_clause'>;
export type ImportClauseConfig = BuilderConfig<TypescriptGrammar, ImportClause>;

export type NamespaceImport = NodeType<TypescriptGrammar, 'namespace_import'>;
export type NamespaceImportConfig = BuilderConfig<TypescriptGrammar, NamespaceImport>;

export type NamedImports = NodeType<TypescriptGrammar, 'named_imports'>;
export type NamedImportsConfig = BuilderConfig<TypescriptGrammar, NamedImports>;

export type ImportSpecifier = NodeType<TypescriptGrammar, 'import_specifier'>;
export type ImportSpecifierConfig = BuilderConfig<TypescriptGrammar, ImportSpecifier>;

export type ImportAttribute = NodeType<TypescriptGrammar, 'import_attribute'>;
export type ImportAttributeConfig = BuilderConfig<TypescriptGrammar, ImportAttribute>;

export type ExpressionStatement = NodeType<TypescriptGrammar, 'expression_statement'>;
export type ExpressionStatementConfig = BuilderConfig<TypescriptGrammar, ExpressionStatement>;

export type VariableDeclaration = NodeType<TypescriptGrammar, 'variable_declaration'>;
export type VariableDeclarationConfig = BuilderConfig<TypescriptGrammar, VariableDeclaration>;

export type LexicalDeclaration = NodeType<TypescriptGrammar, 'lexical_declaration'>;
export type LexicalDeclarationConfig = BuilderConfig<TypescriptGrammar, LexicalDeclaration>;

export type VariableDeclarator = NodeType<TypescriptGrammar, 'variable_declarator'>;
export type VariableDeclaratorConfig = BuilderConfig<TypescriptGrammar, VariableDeclarator>;

export type StatementBlock = NodeType<TypescriptGrammar, 'statement_block'>;
export type StatementBlockConfig = BuilderConfig<TypescriptGrammar, StatementBlock>;

export type ElseClause = NodeType<TypescriptGrammar, 'else_clause'>;
export type ElseClauseConfig = BuilderConfig<TypescriptGrammar, ElseClause>;

export type IfStatement = NodeType<TypescriptGrammar, 'if_statement'>;
export type IfStatementConfig = BuilderConfig<TypescriptGrammar, IfStatement>;

export type SwitchStatement = NodeType<TypescriptGrammar, 'switch_statement'>;
export type SwitchStatementConfig = BuilderConfig<TypescriptGrammar, SwitchStatement>;

export type ForStatement = NodeType<TypescriptGrammar, 'for_statement'>;
export type ForStatementConfig = BuilderConfig<TypescriptGrammar, ForStatement>;

export type ForInStatement = NodeType<TypescriptGrammar, 'for_in_statement'>;
export type ForInStatementConfig = BuilderConfig<TypescriptGrammar, ForInStatement>;

export type WhileStatement = NodeType<TypescriptGrammar, 'while_statement'>;
export type WhileStatementConfig = BuilderConfig<TypescriptGrammar, WhileStatement>;

export type DoStatement = NodeType<TypescriptGrammar, 'do_statement'>;
export type DoStatementConfig = BuilderConfig<TypescriptGrammar, DoStatement>;

export type TryStatement = NodeType<TypescriptGrammar, 'try_statement'>;
export type TryStatementConfig = BuilderConfig<TypescriptGrammar, TryStatement>;

export type WithStatement = NodeType<TypescriptGrammar, 'with_statement'>;
export type WithStatementConfig = BuilderConfig<TypescriptGrammar, WithStatement>;

export type BreakStatement = NodeType<TypescriptGrammar, 'break_statement'>;
export type BreakStatementConfig = BuilderConfig<TypescriptGrammar, BreakStatement>;

export type ContinueStatement = NodeType<TypescriptGrammar, 'continue_statement'>;
export type ContinueStatementConfig = BuilderConfig<TypescriptGrammar, ContinueStatement>;

export type ReturnStatement = NodeType<TypescriptGrammar, 'return_statement'>;
export type ReturnStatementConfig = BuilderConfig<TypescriptGrammar, ReturnStatement>;

export type ThrowStatement = NodeType<TypescriptGrammar, 'throw_statement'>;
export type ThrowStatementConfig = BuilderConfig<TypescriptGrammar, ThrowStatement>;

export type SwitchBody = NodeType<TypescriptGrammar, 'switch_body'>;
export type SwitchBodyConfig = BuilderConfig<TypescriptGrammar, SwitchBody>;

export type SwitchCase = NodeType<TypescriptGrammar, 'switch_case'>;
export type SwitchCaseConfig = BuilderConfig<TypescriptGrammar, SwitchCase>;

export type SwitchDefault = NodeType<TypescriptGrammar, 'switch_default'>;
export type SwitchDefaultConfig = BuilderConfig<TypescriptGrammar, SwitchDefault>;

export type CatchClause = NodeType<TypescriptGrammar, 'catch_clause'>;
export type CatchClauseConfig = BuilderConfig<TypescriptGrammar, CatchClause>;

export type FinallyClause = NodeType<TypescriptGrammar, 'finally_clause'>;
export type FinallyClauseConfig = BuilderConfig<TypescriptGrammar, FinallyClause>;

export type ParenthesizedExpression = NodeType<TypescriptGrammar, 'parenthesized_expression'>;
export type ParenthesizedExpressionConfig = BuilderConfig<TypescriptGrammar, ParenthesizedExpression>;

export type YieldExpression = NodeType<TypescriptGrammar, 'yield_expression'>;
export type YieldExpressionConfig = BuilderConfig<TypescriptGrammar, YieldExpression>;

export type Object = NodeType<TypescriptGrammar, 'object'>;
export type ObjectConfig = BuilderConfig<TypescriptGrammar, Object>;

export type ObjectPattern = NodeType<TypescriptGrammar, 'object_pattern'>;
export type ObjectPatternConfig = BuilderConfig<TypescriptGrammar, ObjectPattern>;

export type AssignmentPattern = NodeType<TypescriptGrammar, 'assignment_pattern'>;
export type AssignmentPatternConfig = BuilderConfig<TypescriptGrammar, AssignmentPattern>;

export type ObjectAssignmentPattern = NodeType<TypescriptGrammar, 'object_assignment_pattern'>;
export type ObjectAssignmentPatternConfig = BuilderConfig<TypescriptGrammar, ObjectAssignmentPattern>;

export type Array = NodeType<TypescriptGrammar, 'array'>;
export type ArrayConfig = BuilderConfig<TypescriptGrammar, Array>;

export type ArrayPattern = NodeType<TypescriptGrammar, 'array_pattern'>;
export type ArrayPatternConfig = BuilderConfig<TypescriptGrammar, ArrayPattern>;

export type JsxElement = NodeType<TypescriptGrammar, 'jsx_element'>;
export type JsxElementConfig = BuilderConfig<TypescriptGrammar, JsxElement>;

export type JsxExpression = NodeType<TypescriptGrammar, 'jsx_expression'>;
export type JsxExpressionConfig = BuilderConfig<TypescriptGrammar, JsxExpression>;

export type NestedIdentifier = NodeType<TypescriptGrammar, 'nested_identifier'>;
export type NestedIdentifierConfig = BuilderConfig<TypescriptGrammar, NestedIdentifier>;

export type JsxNamespaceName = NodeType<TypescriptGrammar, 'jsx_namespace_name'>;
export type JsxNamespaceNameConfig = BuilderConfig<TypescriptGrammar, JsxNamespaceName>;

export type JsxClosingElement = NodeType<TypescriptGrammar, 'jsx_closing_element'>;
export type JsxClosingElementConfig = BuilderConfig<TypescriptGrammar, JsxClosingElement>;

export type JsxAttribute = NodeType<TypescriptGrammar, 'jsx_attribute'>;
export type JsxAttributeConfig = BuilderConfig<TypescriptGrammar, JsxAttribute>;

export type Class = NodeType<TypescriptGrammar, 'class'>;
export type ClassConfig = BuilderConfig<TypescriptGrammar, Class>;

export type ClassDeclaration = NodeType<TypescriptGrammar, 'class_declaration'>;
export type ClassDeclarationConfig = BuilderConfig<TypescriptGrammar, ClassDeclaration>;

export type ClassHeritage = NodeType<TypescriptGrammar, 'class_heritage'>;
export type ClassHeritageConfig = BuilderConfig<TypescriptGrammar, ClassHeritage>;

export type FunctionExpression = NodeType<TypescriptGrammar, 'function_expression'>;
export type FunctionExpressionConfig = BuilderConfig<TypescriptGrammar, FunctionExpression>;

export type FunctionDeclaration = NodeType<TypescriptGrammar, 'function_declaration'>;
export type FunctionDeclarationConfig = BuilderConfig<TypescriptGrammar, FunctionDeclaration>;

export type GeneratorFunction = NodeType<TypescriptGrammar, 'generator_function'>;
export type GeneratorFunctionConfig = BuilderConfig<TypescriptGrammar, GeneratorFunction>;

export type GeneratorFunctionDeclaration = NodeType<TypescriptGrammar, 'generator_function_declaration'>;
export type GeneratorFunctionDeclarationConfig = BuilderConfig<TypescriptGrammar, GeneratorFunctionDeclaration>;

export type ArrowFunction = NodeType<TypescriptGrammar, 'arrow_function'>;
export type ArrowFunctionConfig = BuilderConfig<TypescriptGrammar, ArrowFunction>;

export type CallExpression = NodeType<TypescriptGrammar, 'call_expression'>;
export type CallExpressionConfig = BuilderConfig<TypescriptGrammar, CallExpression>;

export type NewExpression = NodeType<TypescriptGrammar, 'new_expression'>;
export type NewExpressionConfig = BuilderConfig<TypescriptGrammar, NewExpression>;

export type AwaitExpression = NodeType<TypescriptGrammar, 'await_expression'>;
export type AwaitExpressionConfig = BuilderConfig<TypescriptGrammar, AwaitExpression>;

export type MemberExpression = NodeType<TypescriptGrammar, 'member_expression'>;
export type MemberExpressionConfig = BuilderConfig<TypescriptGrammar, MemberExpression>;

export type SubscriptExpression = NodeType<TypescriptGrammar, 'subscript_expression'>;
export type SubscriptExpressionConfig = BuilderConfig<TypescriptGrammar, SubscriptExpression>;

export type AssignmentExpression = NodeType<TypescriptGrammar, 'assignment_expression'>;
export type AssignmentExpressionConfig = BuilderConfig<TypescriptGrammar, AssignmentExpression>;

export type AugmentedAssignmentExpression = NodeType<TypescriptGrammar, 'augmented_assignment_expression'>;
export type AugmentedAssignmentExpressionConfig = BuilderConfig<TypescriptGrammar, AugmentedAssignmentExpression>;

export type SpreadElement = NodeType<TypescriptGrammar, 'spread_element'>;
export type SpreadElementConfig = BuilderConfig<TypescriptGrammar, SpreadElement>;

export type TernaryExpression = NodeType<TypescriptGrammar, 'ternary_expression'>;
export type TernaryExpressionConfig = BuilderConfig<TypescriptGrammar, TernaryExpression>;

export type BinaryExpression = NodeType<TypescriptGrammar, 'binary_expression'>;
export type BinaryExpressionConfig = BuilderConfig<TypescriptGrammar, BinaryExpression>;

export type UnaryExpression = NodeType<TypescriptGrammar, 'unary_expression'>;
export type UnaryExpressionConfig = BuilderConfig<TypescriptGrammar, UnaryExpression>;

export type UpdateExpression = NodeType<TypescriptGrammar, 'update_expression'>;
export type UpdateExpressionConfig = BuilderConfig<TypescriptGrammar, UpdateExpression>;

export type SequenceExpression = NodeType<TypescriptGrammar, 'sequence_expression'>;
export type SequenceExpressionConfig = BuilderConfig<TypescriptGrammar, SequenceExpression>;

export type String = NodeType<TypescriptGrammar, 'string'>;
export type StringConfig = BuilderConfig<TypescriptGrammar, String>;

export type TemplateString = NodeType<TypescriptGrammar, 'template_string'>;
export type TemplateStringConfig = BuilderConfig<TypescriptGrammar, TemplateString>;

export type TemplateSubstitution = NodeType<TypescriptGrammar, 'template_substitution'>;
export type TemplateSubstitutionConfig = BuilderConfig<TypescriptGrammar, TemplateSubstitution>;

export type Regex = NodeType<TypescriptGrammar, 'regex'>;
export type RegexConfig = BuilderConfig<TypescriptGrammar, Regex>;

export type Arguments = NodeType<TypescriptGrammar, 'arguments'>;
export type ArgumentsConfig = BuilderConfig<TypescriptGrammar, Arguments>;

export type Decorator = NodeType<TypescriptGrammar, 'decorator'>;
export type DecoratorConfig = BuilderConfig<TypescriptGrammar, Decorator>;

export type DecoratorMemberExpression = NodeType<TypescriptGrammar, 'decorator_member_expression'>;
export type DecoratorMemberExpressionConfig = BuilderConfig<TypescriptGrammar, DecoratorMemberExpression>;

export type DecoratorCallExpression = NodeType<TypescriptGrammar, 'decorator_call_expression'>;
export type DecoratorCallExpressionConfig = BuilderConfig<TypescriptGrammar, DecoratorCallExpression>;

export type ClassBody = NodeType<TypescriptGrammar, 'class_body'>;
export type ClassBodyConfig = BuilderConfig<TypescriptGrammar, ClassBody>;

export type FieldDefinition = NodeType<TypescriptGrammar, 'field_definition'>;
export type FieldDefinitionConfig = BuilderConfig<TypescriptGrammar, FieldDefinition>;

export type FormalParameters = NodeType<TypescriptGrammar, 'formal_parameters'>;
export type FormalParametersConfig = BuilderConfig<TypescriptGrammar, FormalParameters>;

export type ClassStaticBlock = NodeType<TypescriptGrammar, 'class_static_block'>;
export type ClassStaticBlockConfig = BuilderConfig<TypescriptGrammar, ClassStaticBlock>;

export type RestPattern = NodeType<TypescriptGrammar, 'rest_pattern'>;
export type RestPatternConfig = BuilderConfig<TypescriptGrammar, RestPattern>;

export type MethodDefinition = NodeType<TypescriptGrammar, 'method_definition'>;
export type MethodDefinitionConfig = BuilderConfig<TypescriptGrammar, MethodDefinition>;

export type Pair = NodeType<TypescriptGrammar, 'pair'>;
export type PairConfig = BuilderConfig<TypescriptGrammar, Pair>;

export type PairPattern = NodeType<TypescriptGrammar, 'pair_pattern'>;
export type PairPatternConfig = BuilderConfig<TypescriptGrammar, PairPattern>;

export type ComputedPropertyName = NodeType<TypescriptGrammar, 'computed_property_name'>;
export type ComputedPropertyNameConfig = BuilderConfig<TypescriptGrammar, ComputedPropertyName>;

export type PublicFieldDefinition = NodeType<TypescriptGrammar, 'public_field_definition'>;
export type PublicFieldDefinitionConfig = BuilderConfig<TypescriptGrammar, PublicFieldDefinition>;

export type NonNullExpression = NodeType<TypescriptGrammar, 'non_null_expression'>;
export type NonNullExpressionConfig = BuilderConfig<TypescriptGrammar, NonNullExpression>;

export type MethodSignature = NodeType<TypescriptGrammar, 'method_signature'>;
export type MethodSignatureConfig = BuilderConfig<TypescriptGrammar, MethodSignature>;

export type AbstractMethodSignature = NodeType<TypescriptGrammar, 'abstract_method_signature'>;
export type AbstractMethodSignatureConfig = BuilderConfig<TypescriptGrammar, AbstractMethodSignature>;

export type FunctionSignature = NodeType<TypescriptGrammar, 'function_signature'>;
export type FunctionSignatureConfig = BuilderConfig<TypescriptGrammar, FunctionSignature>;

export type DecoratorParenthesizedExpression = NodeType<TypescriptGrammar, 'decorator_parenthesized_expression'>;
export type DecoratorParenthesizedExpressionConfig = BuilderConfig<TypescriptGrammar, DecoratorParenthesizedExpression>;

export type TypeAssertion = NodeType<TypescriptGrammar, 'type_assertion'>;
export type TypeAssertionConfig = BuilderConfig<TypescriptGrammar, TypeAssertion>;

export type AsExpression = NodeType<TypescriptGrammar, 'as_expression'>;
export type AsExpressionConfig = BuilderConfig<TypescriptGrammar, AsExpression>;

export type SatisfiesExpression = NodeType<TypescriptGrammar, 'satisfies_expression'>;
export type SatisfiesExpressionConfig = BuilderConfig<TypescriptGrammar, SatisfiesExpression>;

export type InstantiationExpression = NodeType<TypescriptGrammar, 'instantiation_expression'>;
export type InstantiationExpressionConfig = BuilderConfig<TypescriptGrammar, InstantiationExpression>;

export type ImportRequireClause = NodeType<TypescriptGrammar, 'import_require_clause'>;
export type ImportRequireClauseConfig = BuilderConfig<TypescriptGrammar, ImportRequireClause>;

export type ExtendsClause = NodeType<TypescriptGrammar, 'extends_clause'>;
export type ExtendsClauseConfig = BuilderConfig<TypescriptGrammar, ExtendsClause>;

export type ImplementsClause = NodeType<TypescriptGrammar, 'implements_clause'>;
export type ImplementsClauseConfig = BuilderConfig<TypescriptGrammar, ImplementsClause>;

export type AmbientDeclaration = NodeType<TypescriptGrammar, 'ambient_declaration'>;
export type AmbientDeclarationConfig = BuilderConfig<TypescriptGrammar, AmbientDeclaration>;

export type AbstractClassDeclaration = NodeType<TypescriptGrammar, 'abstract_class_declaration'>;
export type AbstractClassDeclarationConfig = BuilderConfig<TypescriptGrammar, AbstractClassDeclaration>;

export type Module = NodeType<TypescriptGrammar, 'module'>;
export type ModuleConfig = BuilderConfig<TypescriptGrammar, Module>;

export type InternalModule = NodeType<TypescriptGrammar, 'internal_module'>;
export type InternalModuleConfig = BuilderConfig<TypescriptGrammar, InternalModule>;

export type ImportAlias = NodeType<TypescriptGrammar, 'import_alias'>;
export type ImportAliasConfig = BuilderConfig<TypescriptGrammar, ImportAlias>;

export type NestedTypeIdentifier = NodeType<TypescriptGrammar, 'nested_type_identifier'>;
export type NestedTypeIdentifierConfig = BuilderConfig<TypescriptGrammar, NestedTypeIdentifier>;

export type InterfaceDeclaration = NodeType<TypescriptGrammar, 'interface_declaration'>;
export type InterfaceDeclarationConfig = BuilderConfig<TypescriptGrammar, InterfaceDeclaration>;

export type ExtendsTypeClause = NodeType<TypescriptGrammar, 'extends_type_clause'>;
export type ExtendsTypeClauseConfig = BuilderConfig<TypescriptGrammar, ExtendsTypeClause>;

export type EnumDeclaration = NodeType<TypescriptGrammar, 'enum_declaration'>;
export type EnumDeclarationConfig = BuilderConfig<TypescriptGrammar, EnumDeclaration>;

export type EnumBody = NodeType<TypescriptGrammar, 'enum_body'>;
export type EnumBodyConfig = BuilderConfig<TypescriptGrammar, EnumBody>;

export type EnumAssignment = NodeType<TypescriptGrammar, 'enum_assignment'>;
export type EnumAssignmentConfig = BuilderConfig<TypescriptGrammar, EnumAssignment>;

export type TypeAliasDeclaration = NodeType<TypescriptGrammar, 'type_alias_declaration'>;
export type TypeAliasDeclarationConfig = BuilderConfig<TypescriptGrammar, TypeAliasDeclaration>;

export type RequiredParameter = NodeType<TypescriptGrammar, 'required_parameter'>;
export type RequiredParameterConfig = BuilderConfig<TypescriptGrammar, RequiredParameter>;

export type OptionalParameter = NodeType<TypescriptGrammar, 'optional_parameter'>;
export type OptionalParameterConfig = BuilderConfig<TypescriptGrammar, OptionalParameter>;

export type OmittingTypeAnnotation = NodeType<TypescriptGrammar, 'omitting_type_annotation'>;
export type OmittingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, OmittingTypeAnnotation>;

export type AddingTypeAnnotation = NodeType<TypescriptGrammar, 'adding_type_annotation'>;
export type AddingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, AddingTypeAnnotation>;

export type OptingTypeAnnotation = NodeType<TypescriptGrammar, 'opting_type_annotation'>;
export type OptingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, OptingTypeAnnotation>;

export type TypeAnnotation = NodeType<TypescriptGrammar, 'type_annotation'>;
export type TypeAnnotationConfig = BuilderConfig<TypescriptGrammar, TypeAnnotation>;

export type Asserts = NodeType<TypescriptGrammar, 'asserts'>;
export type AssertsConfig = BuilderConfig<TypescriptGrammar, Asserts>;

export type AssertsAnnotation = NodeType<TypescriptGrammar, 'asserts_annotation'>;
export type AssertsAnnotationConfig = BuilderConfig<TypescriptGrammar, AssertsAnnotation>;

export type TupleParameter = NodeType<TypescriptGrammar, 'tuple_parameter'>;
export type TupleParameterConfig = BuilderConfig<TypescriptGrammar, TupleParameter>;

export type OptionalTupleParameter = NodeType<TypescriptGrammar, 'optional_tuple_parameter'>;
export type OptionalTupleParameterConfig = BuilderConfig<TypescriptGrammar, OptionalTupleParameter>;

export type OptionalType = NodeType<TypescriptGrammar, 'optional_type'>;
export type OptionalTypeConfig = BuilderConfig<TypescriptGrammar, OptionalType>;

export type RestType = NodeType<TypescriptGrammar, 'rest_type'>;
export type RestTypeConfig = BuilderConfig<TypescriptGrammar, RestType>;

export type ConstructorType = NodeType<TypescriptGrammar, 'constructor_type'>;
export type ConstructorTypeConfig = BuilderConfig<TypescriptGrammar, ConstructorType>;

export type TemplateType = NodeType<TypescriptGrammar, 'template_type'>;
export type TemplateTypeConfig = BuilderConfig<TypescriptGrammar, TemplateType>;

export type TemplateLiteralType = NodeType<TypescriptGrammar, 'template_literal_type'>;
export type TemplateLiteralTypeConfig = BuilderConfig<TypescriptGrammar, TemplateLiteralType>;

export type InferType = NodeType<TypescriptGrammar, 'infer_type'>;
export type InferTypeConfig = BuilderConfig<TypescriptGrammar, InferType>;

export type ConditionalType = NodeType<TypescriptGrammar, 'conditional_type'>;
export type ConditionalTypeConfig = BuilderConfig<TypescriptGrammar, ConditionalType>;

export type GenericType = NodeType<TypescriptGrammar, 'generic_type'>;
export type GenericTypeConfig = BuilderConfig<TypescriptGrammar, GenericType>;

export type TypePredicate = NodeType<TypescriptGrammar, 'type_predicate'>;
export type TypePredicateConfig = BuilderConfig<TypescriptGrammar, TypePredicate>;

export type TypePredicateAnnotation = NodeType<TypescriptGrammar, 'type_predicate_annotation'>;
export type TypePredicateAnnotationConfig = BuilderConfig<TypescriptGrammar, TypePredicateAnnotation>;

export type TypeQuery = NodeType<TypescriptGrammar, 'type_query'>;
export type TypeQueryConfig = BuilderConfig<TypescriptGrammar, TypeQuery>;

export type IndexTypeQuery = NodeType<TypescriptGrammar, 'index_type_query'>;
export type IndexTypeQueryConfig = BuilderConfig<TypescriptGrammar, IndexTypeQuery>;

export type LookupType = NodeType<TypescriptGrammar, 'lookup_type'>;
export type LookupTypeConfig = BuilderConfig<TypescriptGrammar, LookupType>;

export type MappedTypeClause = NodeType<TypescriptGrammar, 'mapped_type_clause'>;
export type MappedTypeClauseConfig = BuilderConfig<TypescriptGrammar, MappedTypeClause>;

export type LiteralType = NodeType<TypescriptGrammar, 'literal_type'>;
export type LiteralTypeConfig = BuilderConfig<TypescriptGrammar, LiteralType>;

export type FlowMaybeType = NodeType<TypescriptGrammar, 'flow_maybe_type'>;
export type FlowMaybeTypeConfig = BuilderConfig<TypescriptGrammar, FlowMaybeType>;

export type ParenthesizedType = NodeType<TypescriptGrammar, 'parenthesized_type'>;
export type ParenthesizedTypeConfig = BuilderConfig<TypescriptGrammar, ParenthesizedType>;

export type TypeArguments = NodeType<TypescriptGrammar, 'type_arguments'>;
export type TypeArgumentsConfig = BuilderConfig<TypescriptGrammar, TypeArguments>;

export type ObjectType = NodeType<TypescriptGrammar, 'object_type'>;
export type ObjectTypeConfig = BuilderConfig<TypescriptGrammar, ObjectType>;

export type CallSignature = NodeType<TypescriptGrammar, 'call_signature'>;
export type CallSignatureConfig = BuilderConfig<TypescriptGrammar, CallSignature>;

export type PropertySignature = NodeType<TypescriptGrammar, 'property_signature'>;
export type PropertySignatureConfig = BuilderConfig<TypescriptGrammar, PropertySignature>;

export type TypeParameters = NodeType<TypescriptGrammar, 'type_parameters'>;
export type TypeParametersConfig = BuilderConfig<TypescriptGrammar, TypeParameters>;

export type TypeParameter = NodeType<TypescriptGrammar, 'type_parameter'>;
export type TypeParameterConfig = BuilderConfig<TypescriptGrammar, TypeParameter>;

export type DefaultType = NodeType<TypescriptGrammar, 'default_type'>;
export type DefaultTypeConfig = BuilderConfig<TypescriptGrammar, DefaultType>;

export type Constraint = NodeType<TypescriptGrammar, 'constraint'>;
export type ConstraintConfig = BuilderConfig<TypescriptGrammar, Constraint>;

export type ConstructSignature = NodeType<TypescriptGrammar, 'construct_signature'>;
export type ConstructSignatureConfig = BuilderConfig<TypescriptGrammar, ConstructSignature>;

export type IndexSignature = NodeType<TypescriptGrammar, 'index_signature'>;
export type IndexSignatureConfig = BuilderConfig<TypescriptGrammar, IndexSignature>;

export type ArrayType = NodeType<TypescriptGrammar, 'array_type'>;
export type ArrayTypeConfig = BuilderConfig<TypescriptGrammar, ArrayType>;

export type TupleType = NodeType<TypescriptGrammar, 'tuple_type'>;
export type TupleTypeConfig = BuilderConfig<TypescriptGrammar, TupleType>;

export type ReadonlyType = NodeType<TypescriptGrammar, 'readonly_type'>;
export type ReadonlyTypeConfig = BuilderConfig<TypescriptGrammar, ReadonlyType>;

export type UnionType = NodeType<TypescriptGrammar, 'union_type'>;
export type UnionTypeConfig = BuilderConfig<TypescriptGrammar, UnionType>;

export type IntersectionType = NodeType<TypescriptGrammar, 'intersection_type'>;
export type IntersectionTypeConfig = BuilderConfig<TypescriptGrammar, IntersectionType>;

export type FunctionType = NodeType<TypescriptGrammar, 'function_type'>;
export type FunctionTypeConfig = BuilderConfig<TypescriptGrammar, FunctionType>;

export type InterfaceBody = NodeType<TypescriptGrammar, 'interface_body'>;
export type InterfaceBodyConfig = BuilderConfig<TypescriptGrammar, InterfaceBody>;

export type LabeledStatement = NodeType<TypescriptGrammar, 'labeled_statement'>;
export type LabeledStatementConfig = BuilderConfig<TypescriptGrammar, LabeledStatement>;

// Leaf node types
export type HashBangLine = { kind: 'hash_bang_line' };
export type Import = { kind: 'import' };
export type EmptyStatement = { kind: 'empty_statement' };
export type HtmlCharacterReference = { kind: 'html_character_reference' };
export type JsxIdentifier = { kind: 'jsx_identifier' };
export type UnescapedDoubleJsxStringFragment = { kind: 'unescaped_double_jsx_string_fragment' };
export type UnescapedSingleJsxStringFragment = { kind: 'unescaped_single_jsx_string_fragment' };
export type OptionalChain = { kind: 'optional_chain' };
export type UnescapedDoubleStringFragment = { kind: 'unescaped_double_string_fragment' };
export type UnescapedSingleStringFragment = { kind: 'unescaped_single_string_fragment' };
export type EscapeSequence = { kind: 'escape_sequence' };
export type Comment = { kind: 'comment' };
export type RegexPattern = { kind: 'regex_pattern' };
export type RegexFlags = { kind: 'regex_flags' };
export type Number = { kind: 'number' };
export type Identifier = { kind: 'identifier' };
export type PrivatePropertyIdentifier = { kind: 'private_property_identifier' };
export type MetaProperty = { kind: 'meta_property' };
export type This = { kind: 'this' };
export type Super = { kind: 'super' };
export type True = { kind: 'true' };
export type False = { kind: 'false' };
export type Null = { kind: 'null' };
export type Undefined = { kind: 'undefined' };
export type AccessibilityModifier = { kind: 'accessibility_modifier' };
export type OverrideModifier = { kind: 'override_modifier' };
export type ExistentialType = { kind: 'existential_type' };
export type DebuggerStatement = { kind: 'debugger_statement' };
export type PredefinedType = { kind: 'predefined_type' };
export type HtmlComment = { kind: 'html_comment' };
export type PropertyIdentifier = { kind: 'property_identifier' };
export type ShorthandPropertyIdentifier = { kind: 'shorthand_property_identifier' };
export type ShorthandPropertyIdentifierPattern = { kind: 'shorthand_property_identifier_pattern' };
export type StatementIdentifier = { kind: 'statement_identifier' };
export type StringFragment = { kind: 'string_fragment' };
export type ThisType = { kind: 'this_type' };
export type TypeIdentifier = { kind: 'type_identifier' };

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
  | Program
  | ExportStatement
  | NamespaceExport
  | ExportClause
  | ExportSpecifier
  | ImportStatement
  | ImportClause
  | NamespaceImport
  | NamedImports
  | ImportSpecifier
  | ImportAttribute
  | ExpressionStatement
  | VariableDeclaration
  | LexicalDeclaration
  | VariableDeclarator
  | StatementBlock
  | ElseClause
  | IfStatement
  | SwitchStatement
  | ForStatement
  | ForInStatement
  | WhileStatement
  | DoStatement
  | TryStatement
  | WithStatement
  | BreakStatement
  | ContinueStatement
  | ReturnStatement
  | ThrowStatement
  | SwitchBody
  | SwitchCase
  | SwitchDefault
  | CatchClause
  | FinallyClause
  | ParenthesizedExpression
  | YieldExpression
  | Object
  | ObjectPattern
  | AssignmentPattern
  | ObjectAssignmentPattern
  | Array
  | ArrayPattern
  | JsxElement
  | JsxExpression
  | NestedIdentifier
  | JsxNamespaceName
  | JsxClosingElement
  | JsxAttribute
  | Class
  | ClassDeclaration
  | ClassHeritage
  | FunctionExpression
  | FunctionDeclaration
  | GeneratorFunction
  | GeneratorFunctionDeclaration
  | ArrowFunction
  | CallExpression
  | NewExpression
  | AwaitExpression
  | MemberExpression
  | SubscriptExpression
  | AssignmentExpression
  | AugmentedAssignmentExpression
  | SpreadElement
  | TernaryExpression
  | BinaryExpression
  | UnaryExpression
  | UpdateExpression
  | SequenceExpression
  | String
  | TemplateString
  | TemplateSubstitution
  | Regex
  | Arguments
  | Decorator
  | DecoratorMemberExpression
  | DecoratorCallExpression
  | ClassBody
  | FieldDefinition
  | FormalParameters
  | ClassStaticBlock
  | RestPattern
  | MethodDefinition
  | Pair
  | PairPattern
  | ComputedPropertyName
  | PublicFieldDefinition
  | NonNullExpression
  | MethodSignature
  | AbstractMethodSignature
  | FunctionSignature
  | DecoratorParenthesizedExpression
  | TypeAssertion
  | AsExpression
  | SatisfiesExpression
  | InstantiationExpression
  | ImportRequireClause
  | ExtendsClause
  | ImplementsClause
  | AmbientDeclaration
  | AbstractClassDeclaration
  | Module
  | InternalModule
  | ImportAlias
  | NestedTypeIdentifier
  | InterfaceDeclaration
  | ExtendsTypeClause
  | EnumDeclaration
  | EnumBody
  | EnumAssignment
  | TypeAliasDeclaration
  | RequiredParameter
  | OptionalParameter
  | OmittingTypeAnnotation
  | AddingTypeAnnotation
  | OptingTypeAnnotation
  | TypeAnnotation
  | Asserts
  | AssertsAnnotation
  | TupleParameter
  | OptionalTupleParameter
  | OptionalType
  | RestType
  | ConstructorType
  | TemplateType
  | TemplateLiteralType
  | InferType
  | ConditionalType
  | GenericType
  | TypePredicate
  | TypePredicateAnnotation
  | TypeQuery
  | IndexTypeQuery
  | LookupType
  | MappedTypeClause
  | LiteralType
  | FlowMaybeType
  | ParenthesizedType
  | TypeArguments
  | ObjectType
  | CallSignature
  | PropertySignature
  | TypeParameters
  | TypeParameter
  | DefaultType
  | Constraint
  | ConstructSignature
  | IndexSignature
  | ArrayType
  | TupleType
  | ReadonlyType
  | UnionType
  | IntersectionType
  | FunctionType
  | InterfaceBody
  | LabeledStatement
;

export type { ValidationResult };

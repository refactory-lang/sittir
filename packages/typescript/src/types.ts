import type { TypescriptGrammar } from './grammar.js';
import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';

export type { TypescriptGrammar };

export type AbstractClassDeclaration = NodeType<TypescriptGrammar, 'abstract_class_declaration'>;
export type AbstractClassDeclarationConfig = BuilderConfig<TypescriptGrammar, AbstractClassDeclaration>;

export type AbstractMethodSignature = NodeType<TypescriptGrammar, 'abstract_method_signature'>;
export type AbstractMethodSignatureConfig = BuilderConfig<TypescriptGrammar, AbstractMethodSignature>;

export type AddingTypeAnnotation = NodeType<TypescriptGrammar, 'adding_type_annotation'>;
export type AddingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, AddingTypeAnnotation>;

export type AmbientDeclaration = NodeType<TypescriptGrammar, 'ambient_declaration'>;
export type AmbientDeclarationConfig = BuilderConfig<TypescriptGrammar, AmbientDeclaration>;

export type Arguments = NodeType<TypescriptGrammar, 'arguments'>;
export type ArgumentsConfig = BuilderConfig<TypescriptGrammar, Arguments>;

export type Array = NodeType<TypescriptGrammar, 'array'>;
export type ArrayConfig = BuilderConfig<TypescriptGrammar, Array>;

export type ArrayPattern = NodeType<TypescriptGrammar, 'array_pattern'>;
export type ArrayPatternConfig = BuilderConfig<TypescriptGrammar, ArrayPattern>;

export type ArrayType = NodeType<TypescriptGrammar, 'array_type'>;
export type ArrayTypeConfig = BuilderConfig<TypescriptGrammar, ArrayType>;

export type ArrowFunction = NodeType<TypescriptGrammar, 'arrow_function'>;
export type ArrowFunctionConfig = BuilderConfig<TypescriptGrammar, ArrowFunction>;

export type AsExpression = NodeType<TypescriptGrammar, 'as_expression'>;
export type AsExpressionConfig = BuilderConfig<TypescriptGrammar, AsExpression>;

export type AssertsAnnotation = NodeType<TypescriptGrammar, 'asserts_annotation'>;
export type AssertsAnnotationConfig = BuilderConfig<TypescriptGrammar, AssertsAnnotation>;

export type AssignmentExpression = NodeType<TypescriptGrammar, 'assignment_expression'>;
export type AssignmentExpressionConfig = BuilderConfig<TypescriptGrammar, AssignmentExpression>;

export type AssignmentPattern = NodeType<TypescriptGrammar, 'assignment_pattern'>;
export type AssignmentPatternConfig = BuilderConfig<TypescriptGrammar, AssignmentPattern>;

export type AugmentedAssignmentExpression = NodeType<TypescriptGrammar, 'augmented_assignment_expression'>;
export type AugmentedAssignmentExpressionConfig = BuilderConfig<TypescriptGrammar, AugmentedAssignmentExpression>;

export type AwaitExpression = NodeType<TypescriptGrammar, 'await_expression'>;
export type AwaitExpressionConfig = BuilderConfig<TypescriptGrammar, AwaitExpression>;

export type BinaryExpression = NodeType<TypescriptGrammar, 'binary_expression'>;
export type BinaryExpressionConfig = BuilderConfig<TypescriptGrammar, BinaryExpression>;

export type BreakStatement = NodeType<TypescriptGrammar, 'break_statement'>;
export type BreakStatementConfig = BuilderConfig<TypescriptGrammar, BreakStatement>;

export type CallExpression = NodeType<TypescriptGrammar, 'call_expression'>;
export type CallExpressionConfig = BuilderConfig<TypescriptGrammar, CallExpression>;

export type CallSignature = NodeType<TypescriptGrammar, 'call_signature'>;
export type CallSignatureConfig = BuilderConfig<TypescriptGrammar, CallSignature>;

export type CatchClause = NodeType<TypescriptGrammar, 'catch_clause'>;
export type CatchClauseConfig = BuilderConfig<TypescriptGrammar, CatchClause>;

export type ClassBody = NodeType<TypescriptGrammar, 'class_body'>;
export type ClassBodyConfig = BuilderConfig<TypescriptGrammar, ClassBody>;

export type ClassDeclaration = NodeType<TypescriptGrammar, 'class_declaration'>;
export type ClassDeclarationConfig = BuilderConfig<TypescriptGrammar, ClassDeclaration>;

export type ClassHeritage = NodeType<TypescriptGrammar, 'class_heritage'>;
export type ClassHeritageConfig = BuilderConfig<TypescriptGrammar, ClassHeritage>;

export type ClassStaticBlock = NodeType<TypescriptGrammar, 'class_static_block'>;
export type ClassStaticBlockConfig = BuilderConfig<TypescriptGrammar, ClassStaticBlock>;

export type ComputedPropertyName = NodeType<TypescriptGrammar, 'computed_property_name'>;
export type ComputedPropertyNameConfig = BuilderConfig<TypescriptGrammar, ComputedPropertyName>;

export type ConditionalType = NodeType<TypescriptGrammar, 'conditional_type'>;
export type ConditionalTypeConfig = BuilderConfig<TypescriptGrammar, ConditionalType>;

export type Constraint = NodeType<TypescriptGrammar, 'constraint'>;
export type ConstraintConfig = BuilderConfig<TypescriptGrammar, Constraint>;

export type ConstructSignature = NodeType<TypescriptGrammar, 'construct_signature'>;
export type ConstructSignatureConfig = BuilderConfig<TypescriptGrammar, ConstructSignature>;

export type ConstructorType = NodeType<TypescriptGrammar, 'constructor_type'>;
export type ConstructorTypeConfig = BuilderConfig<TypescriptGrammar, ConstructorType>;

export type ContinueStatement = NodeType<TypescriptGrammar, 'continue_statement'>;
export type ContinueStatementConfig = BuilderConfig<TypescriptGrammar, ContinueStatement>;

export type Decorator = NodeType<TypescriptGrammar, 'decorator'>;
export type DecoratorConfig = BuilderConfig<TypescriptGrammar, Decorator>;

export type DefaultType = NodeType<TypescriptGrammar, 'default_type'>;
export type DefaultTypeConfig = BuilderConfig<TypescriptGrammar, DefaultType>;

export type DoStatement = NodeType<TypescriptGrammar, 'do_statement'>;
export type DoStatementConfig = BuilderConfig<TypescriptGrammar, DoStatement>;

export type ElseClause = NodeType<TypescriptGrammar, 'else_clause'>;
export type ElseClauseConfig = BuilderConfig<TypescriptGrammar, ElseClause>;

export type EnumAssignment = NodeType<TypescriptGrammar, 'enum_assignment'>;
export type EnumAssignmentConfig = BuilderConfig<TypescriptGrammar, EnumAssignment>;

export type EnumBody = NodeType<TypescriptGrammar, 'enum_body'>;
export type EnumBodyConfig = BuilderConfig<TypescriptGrammar, EnumBody>;

export type EnumDeclaration = NodeType<TypescriptGrammar, 'enum_declaration'>;
export type EnumDeclarationConfig = BuilderConfig<TypescriptGrammar, EnumDeclaration>;

export type ExportClause = NodeType<TypescriptGrammar, 'export_clause'>;
export type ExportClauseConfig = BuilderConfig<TypescriptGrammar, ExportClause>;

export type ExportSpecifier = NodeType<TypescriptGrammar, 'export_specifier'>;
export type ExportSpecifierConfig = BuilderConfig<TypescriptGrammar, ExportSpecifier>;

export type ExportStatement = NodeType<TypescriptGrammar, 'export_statement'>;
export type ExportStatementConfig = BuilderConfig<TypescriptGrammar, ExportStatement>;

export type ExpressionStatement = NodeType<TypescriptGrammar, 'expression_statement'>;
export type ExpressionStatementConfig = BuilderConfig<TypescriptGrammar, ExpressionStatement>;

export type ExtendsClause = NodeType<TypescriptGrammar, 'extends_clause'>;
export type ExtendsClauseConfig = BuilderConfig<TypescriptGrammar, ExtendsClause>;

export type ExtendsTypeClause = NodeType<TypescriptGrammar, 'extends_type_clause'>;
export type ExtendsTypeClauseConfig = BuilderConfig<TypescriptGrammar, ExtendsTypeClause>;

export type FinallyClause = NodeType<TypescriptGrammar, 'finally_clause'>;
export type FinallyClauseConfig = BuilderConfig<TypescriptGrammar, FinallyClause>;

export type FlowMaybeType = NodeType<TypescriptGrammar, 'flow_maybe_type'>;
export type FlowMaybeTypeConfig = BuilderConfig<TypescriptGrammar, FlowMaybeType>;

export type ForInStatement = NodeType<TypescriptGrammar, 'for_in_statement'>;
export type ForInStatementConfig = BuilderConfig<TypescriptGrammar, ForInStatement>;

export type ForStatement = NodeType<TypescriptGrammar, 'for_statement'>;
export type ForStatementConfig = BuilderConfig<TypescriptGrammar, ForStatement>;

export type FormalParameters = NodeType<TypescriptGrammar, 'formal_parameters'>;
export type FormalParametersConfig = BuilderConfig<TypescriptGrammar, FormalParameters>;

export type FunctionDeclaration = NodeType<TypescriptGrammar, 'function_declaration'>;
export type FunctionDeclarationConfig = BuilderConfig<TypescriptGrammar, FunctionDeclaration>;

export type FunctionExpression = NodeType<TypescriptGrammar, 'function_expression'>;
export type FunctionExpressionConfig = BuilderConfig<TypescriptGrammar, FunctionExpression>;

export type FunctionSignature = NodeType<TypescriptGrammar, 'function_signature'>;
export type FunctionSignatureConfig = BuilderConfig<TypescriptGrammar, FunctionSignature>;

export type FunctionType = NodeType<TypescriptGrammar, 'function_type'>;
export type FunctionTypeConfig = BuilderConfig<TypescriptGrammar, FunctionType>;

export type GeneratorFunction = NodeType<TypescriptGrammar, 'generator_function'>;
export type GeneratorFunctionConfig = BuilderConfig<TypescriptGrammar, GeneratorFunction>;

export type GeneratorFunctionDeclaration = NodeType<TypescriptGrammar, 'generator_function_declaration'>;
export type GeneratorFunctionDeclarationConfig = BuilderConfig<TypescriptGrammar, GeneratorFunctionDeclaration>;

export type GenericType = NodeType<TypescriptGrammar, 'generic_type'>;
export type GenericTypeConfig = BuilderConfig<TypescriptGrammar, GenericType>;

export type IfStatement = NodeType<TypescriptGrammar, 'if_statement'>;
export type IfStatementConfig = BuilderConfig<TypescriptGrammar, IfStatement>;

export type ImplementsClause = NodeType<TypescriptGrammar, 'implements_clause'>;
export type ImplementsClauseConfig = BuilderConfig<TypescriptGrammar, ImplementsClause>;

export type ImportAlias = NodeType<TypescriptGrammar, 'import_alias'>;
export type ImportAliasConfig = BuilderConfig<TypescriptGrammar, ImportAlias>;

export type ImportAttribute = NodeType<TypescriptGrammar, 'import_attribute'>;
export type ImportAttributeConfig = BuilderConfig<TypescriptGrammar, ImportAttribute>;

export type ImportClause = NodeType<TypescriptGrammar, 'import_clause'>;
export type ImportClauseConfig = BuilderConfig<TypescriptGrammar, ImportClause>;

export type ImportRequireClause = NodeType<TypescriptGrammar, 'import_require_clause'>;
export type ImportRequireClauseConfig = BuilderConfig<TypescriptGrammar, ImportRequireClause>;

export type ImportSpecifier = NodeType<TypescriptGrammar, 'import_specifier'>;
export type ImportSpecifierConfig = BuilderConfig<TypescriptGrammar, ImportSpecifier>;

export type ImportStatement = NodeType<TypescriptGrammar, 'import_statement'>;
export type ImportStatementConfig = BuilderConfig<TypescriptGrammar, ImportStatement>;

export type IndexSignature = NodeType<TypescriptGrammar, 'index_signature'>;
export type IndexSignatureConfig = BuilderConfig<TypescriptGrammar, IndexSignature>;

export type IndexTypeQuery = NodeType<TypescriptGrammar, 'index_type_query'>;
export type IndexTypeQueryConfig = BuilderConfig<TypescriptGrammar, IndexTypeQuery>;

export type InferType = NodeType<TypescriptGrammar, 'infer_type'>;
export type InferTypeConfig = BuilderConfig<TypescriptGrammar, InferType>;

export type InstantiationExpression = NodeType<TypescriptGrammar, 'instantiation_expression'>;
export type InstantiationExpressionConfig = BuilderConfig<TypescriptGrammar, InstantiationExpression>;

export type InterfaceBody = NodeType<TypescriptGrammar, 'interface_body'>;
export type InterfaceBodyConfig = BuilderConfig<TypescriptGrammar, InterfaceBody>;

export type InterfaceDeclaration = NodeType<TypescriptGrammar, 'interface_declaration'>;
export type InterfaceDeclarationConfig = BuilderConfig<TypescriptGrammar, InterfaceDeclaration>;

export type InternalModule = NodeType<TypescriptGrammar, 'internal_module'>;
export type InternalModuleConfig = BuilderConfig<TypescriptGrammar, InternalModule>;

export type IntersectionType = NodeType<TypescriptGrammar, 'intersection_type'>;
export type IntersectionTypeConfig = BuilderConfig<TypescriptGrammar, IntersectionType>;

export type LabeledStatement = NodeType<TypescriptGrammar, 'labeled_statement'>;
export type LabeledStatementConfig = BuilderConfig<TypescriptGrammar, LabeledStatement>;

export type LexicalDeclaration = NodeType<TypescriptGrammar, 'lexical_declaration'>;
export type LexicalDeclarationConfig = BuilderConfig<TypescriptGrammar, LexicalDeclaration>;

export type LiteralType = NodeType<TypescriptGrammar, 'literal_type'>;
export type LiteralTypeConfig = BuilderConfig<TypescriptGrammar, LiteralType>;

export type LookupType = NodeType<TypescriptGrammar, 'lookup_type'>;
export type LookupTypeConfig = BuilderConfig<TypescriptGrammar, LookupType>;

export type MappedTypeClause = NodeType<TypescriptGrammar, 'mapped_type_clause'>;
export type MappedTypeClauseConfig = BuilderConfig<TypescriptGrammar, MappedTypeClause>;

export type MemberExpression = NodeType<TypescriptGrammar, 'member_expression'>;
export type MemberExpressionConfig = BuilderConfig<TypescriptGrammar, MemberExpression>;

export type MethodDefinition = NodeType<TypescriptGrammar, 'method_definition'>;
export type MethodDefinitionConfig = BuilderConfig<TypescriptGrammar, MethodDefinition>;

export type MethodSignature = NodeType<TypescriptGrammar, 'method_signature'>;
export type MethodSignatureConfig = BuilderConfig<TypescriptGrammar, MethodSignature>;

export type NamedImports = NodeType<TypescriptGrammar, 'named_imports'>;
export type NamedImportsConfig = BuilderConfig<TypescriptGrammar, NamedImports>;

export type NamespaceExport = NodeType<TypescriptGrammar, 'namespace_export'>;
export type NamespaceExportConfig = BuilderConfig<TypescriptGrammar, NamespaceExport>;

export type NamespaceImport = NodeType<TypescriptGrammar, 'namespace_import'>;
export type NamespaceImportConfig = BuilderConfig<TypescriptGrammar, NamespaceImport>;

export type NestedIdentifier = NodeType<TypescriptGrammar, 'nested_identifier'>;
export type NestedIdentifierConfig = BuilderConfig<TypescriptGrammar, NestedIdentifier>;

export type NestedTypeIdentifier = NodeType<TypescriptGrammar, 'nested_type_identifier'>;
export type NestedTypeIdentifierConfig = BuilderConfig<TypescriptGrammar, NestedTypeIdentifier>;

export type NewExpression = NodeType<TypescriptGrammar, 'new_expression'>;
export type NewExpressionConfig = BuilderConfig<TypescriptGrammar, NewExpression>;

export type NonNullExpression = NodeType<TypescriptGrammar, 'non_null_expression'>;
export type NonNullExpressionConfig = BuilderConfig<TypescriptGrammar, NonNullExpression>;

export type ObjectAssignmentPattern = NodeType<TypescriptGrammar, 'object_assignment_pattern'>;
export type ObjectAssignmentPatternConfig = BuilderConfig<TypescriptGrammar, ObjectAssignmentPattern>;

export type ObjectPattern = NodeType<TypescriptGrammar, 'object_pattern'>;
export type ObjectPatternConfig = BuilderConfig<TypescriptGrammar, ObjectPattern>;

export type ObjectType = NodeType<TypescriptGrammar, 'object_type'>;
export type ObjectTypeConfig = BuilderConfig<TypescriptGrammar, ObjectType>;

export type OmittingTypeAnnotation = NodeType<TypescriptGrammar, 'omitting_type_annotation'>;
export type OmittingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, OmittingTypeAnnotation>;

export type OptingTypeAnnotation = NodeType<TypescriptGrammar, 'opting_type_annotation'>;
export type OptingTypeAnnotationConfig = BuilderConfig<TypescriptGrammar, OptingTypeAnnotation>;

export type OptionalParameter = NodeType<TypescriptGrammar, 'optional_parameter'>;
export type OptionalParameterConfig = BuilderConfig<TypescriptGrammar, OptionalParameter>;

export type OptionalType = NodeType<TypescriptGrammar, 'optional_type'>;
export type OptionalTypeConfig = BuilderConfig<TypescriptGrammar, OptionalType>;

export type Pair = NodeType<TypescriptGrammar, 'pair'>;
export type PairConfig = BuilderConfig<TypescriptGrammar, Pair>;

export type PairPattern = NodeType<TypescriptGrammar, 'pair_pattern'>;
export type PairPatternConfig = BuilderConfig<TypescriptGrammar, PairPattern>;

export type ParenthesizedExpression = NodeType<TypescriptGrammar, 'parenthesized_expression'>;
export type ParenthesizedExpressionConfig = BuilderConfig<TypescriptGrammar, ParenthesizedExpression>;

export type ParenthesizedType = NodeType<TypescriptGrammar, 'parenthesized_type'>;
export type ParenthesizedTypeConfig = BuilderConfig<TypescriptGrammar, ParenthesizedType>;

export type Program = NodeType<TypescriptGrammar, 'program'>;
export type ProgramConfig = BuilderConfig<TypescriptGrammar, Program>;

export type PropertySignature = NodeType<TypescriptGrammar, 'property_signature'>;
export type PropertySignatureConfig = BuilderConfig<TypescriptGrammar, PropertySignature>;

export type PublicFieldDefinition = NodeType<TypescriptGrammar, 'public_field_definition'>;
export type PublicFieldDefinitionConfig = BuilderConfig<TypescriptGrammar, PublicFieldDefinition>;

export type ReadonlyType = NodeType<TypescriptGrammar, 'readonly_type'>;
export type ReadonlyTypeConfig = BuilderConfig<TypescriptGrammar, ReadonlyType>;

export type Regex = NodeType<TypescriptGrammar, 'regex'>;
export type RegexConfig = BuilderConfig<TypescriptGrammar, Regex>;

export type RequiredParameter = NodeType<TypescriptGrammar, 'required_parameter'>;
export type RequiredParameterConfig = BuilderConfig<TypescriptGrammar, RequiredParameter>;

export type RestPattern = NodeType<TypescriptGrammar, 'rest_pattern'>;
export type RestPatternConfig = BuilderConfig<TypescriptGrammar, RestPattern>;

export type RestType = NodeType<TypescriptGrammar, 'rest_type'>;
export type RestTypeConfig = BuilderConfig<TypescriptGrammar, RestType>;

export type ReturnStatement = NodeType<TypescriptGrammar, 'return_statement'>;
export type ReturnStatementConfig = BuilderConfig<TypescriptGrammar, ReturnStatement>;

export type SatisfiesExpression = NodeType<TypescriptGrammar, 'satisfies_expression'>;
export type SatisfiesExpressionConfig = BuilderConfig<TypescriptGrammar, SatisfiesExpression>;

export type SequenceExpression = NodeType<TypescriptGrammar, 'sequence_expression'>;
export type SequenceExpressionConfig = BuilderConfig<TypescriptGrammar, SequenceExpression>;

export type SpreadElement = NodeType<TypescriptGrammar, 'spread_element'>;
export type SpreadElementConfig = BuilderConfig<TypescriptGrammar, SpreadElement>;

export type StatementBlock = NodeType<TypescriptGrammar, 'statement_block'>;
export type StatementBlockConfig = BuilderConfig<TypescriptGrammar, StatementBlock>;

export type SubscriptExpression = NodeType<TypescriptGrammar, 'subscript_expression'>;
export type SubscriptExpressionConfig = BuilderConfig<TypescriptGrammar, SubscriptExpression>;

export type SwitchBody = NodeType<TypescriptGrammar, 'switch_body'>;
export type SwitchBodyConfig = BuilderConfig<TypescriptGrammar, SwitchBody>;

export type SwitchCase = NodeType<TypescriptGrammar, 'switch_case'>;
export type SwitchCaseConfig = BuilderConfig<TypescriptGrammar, SwitchCase>;

export type SwitchDefault = NodeType<TypescriptGrammar, 'switch_default'>;
export type SwitchDefaultConfig = BuilderConfig<TypescriptGrammar, SwitchDefault>;

export type SwitchStatement = NodeType<TypescriptGrammar, 'switch_statement'>;
export type SwitchStatementConfig = BuilderConfig<TypescriptGrammar, SwitchStatement>;

export type TemplateLiteralType = NodeType<TypescriptGrammar, 'template_literal_type'>;
export type TemplateLiteralTypeConfig = BuilderConfig<TypescriptGrammar, TemplateLiteralType>;

export type TemplateString = NodeType<TypescriptGrammar, 'template_string'>;
export type TemplateStringConfig = BuilderConfig<TypescriptGrammar, TemplateString>;

export type TemplateSubstitution = NodeType<TypescriptGrammar, 'template_substitution'>;
export type TemplateSubstitutionConfig = BuilderConfig<TypescriptGrammar, TemplateSubstitution>;

export type TemplateType = NodeType<TypescriptGrammar, 'template_type'>;
export type TemplateTypeConfig = BuilderConfig<TypescriptGrammar, TemplateType>;

export type TernaryExpression = NodeType<TypescriptGrammar, 'ternary_expression'>;
export type TernaryExpressionConfig = BuilderConfig<TypescriptGrammar, TernaryExpression>;

export type ThrowStatement = NodeType<TypescriptGrammar, 'throw_statement'>;
export type ThrowStatementConfig = BuilderConfig<TypescriptGrammar, ThrowStatement>;

export type TryStatement = NodeType<TypescriptGrammar, 'try_statement'>;
export type TryStatementConfig = BuilderConfig<TypescriptGrammar, TryStatement>;

export type TupleType = NodeType<TypescriptGrammar, 'tuple_type'>;
export type TupleTypeConfig = BuilderConfig<TypescriptGrammar, TupleType>;

export type TypeAliasDeclaration = NodeType<TypescriptGrammar, 'type_alias_declaration'>;
export type TypeAliasDeclarationConfig = BuilderConfig<TypescriptGrammar, TypeAliasDeclaration>;

export type TypeAnnotation = NodeType<TypescriptGrammar, 'type_annotation'>;
export type TypeAnnotationConfig = BuilderConfig<TypescriptGrammar, TypeAnnotation>;

export type TypeArguments = NodeType<TypescriptGrammar, 'type_arguments'>;
export type TypeArgumentsConfig = BuilderConfig<TypescriptGrammar, TypeArguments>;

export type TypeAssertion = NodeType<TypescriptGrammar, 'type_assertion'>;
export type TypeAssertionConfig = BuilderConfig<TypescriptGrammar, TypeAssertion>;

export type TypeParameter = NodeType<TypescriptGrammar, 'type_parameter'>;
export type TypeParameterConfig = BuilderConfig<TypescriptGrammar, TypeParameter>;

export type TypeParameters = NodeType<TypescriptGrammar, 'type_parameters'>;
export type TypeParametersConfig = BuilderConfig<TypescriptGrammar, TypeParameters>;

export type TypePredicate = NodeType<TypescriptGrammar, 'type_predicate'>;
export type TypePredicateConfig = BuilderConfig<TypescriptGrammar, TypePredicate>;

export type TypePredicateAnnotation = NodeType<TypescriptGrammar, 'type_predicate_annotation'>;
export type TypePredicateAnnotationConfig = BuilderConfig<TypescriptGrammar, TypePredicateAnnotation>;

export type TypeQuery = NodeType<TypescriptGrammar, 'type_query'>;
export type TypeQueryConfig = BuilderConfig<TypescriptGrammar, TypeQuery>;

export type UnaryExpression = NodeType<TypescriptGrammar, 'unary_expression'>;
export type UnaryExpressionConfig = BuilderConfig<TypescriptGrammar, UnaryExpression>;

export type UnionType = NodeType<TypescriptGrammar, 'union_type'>;
export type UnionTypeConfig = BuilderConfig<TypescriptGrammar, UnionType>;

export type UpdateExpression = NodeType<TypescriptGrammar, 'update_expression'>;
export type UpdateExpressionConfig = BuilderConfig<TypescriptGrammar, UpdateExpression>;

export type VariableDeclaration = NodeType<TypescriptGrammar, 'variable_declaration'>;
export type VariableDeclarationConfig = BuilderConfig<TypescriptGrammar, VariableDeclaration>;

export type VariableDeclarator = NodeType<TypescriptGrammar, 'variable_declarator'>;
export type VariableDeclaratorConfig = BuilderConfig<TypescriptGrammar, VariableDeclarator>;

export type WhileStatement = NodeType<TypescriptGrammar, 'while_statement'>;
export type WhileStatementConfig = BuilderConfig<TypescriptGrammar, WhileStatement>;

export type WithStatement = NodeType<TypescriptGrammar, 'with_statement'>;
export type WithStatementConfig = BuilderConfig<TypescriptGrammar, WithStatement>;

export type YieldExpression = NodeType<TypescriptGrammar, 'yield_expression'>;
export type YieldExpressionConfig = BuilderConfig<TypescriptGrammar, YieldExpression>;

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

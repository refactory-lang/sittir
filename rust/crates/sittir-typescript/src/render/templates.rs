// @generated from packages/typescript/node-model.json5 and packages/typescript/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
// for the typescript grammar. Every struct in this file is backed by a
// sibling `.jinja` template under `templates/`, copied from
// `packages/typescript/templates/` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/typescript/templates/*.jinja
//   - node-model metadata assembled by the codegen pipeline
//
// Askama parses each `.jinja` at `cargo build` time — any mismatch
// between a template's referenced variables and its backing struct's
// fields is caught at compile time (FR-008). If you see a build error
// here, the codegen is out of sync: regenerate via the command above.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]

pub mod filters {
    //! Askama resolves custom-filter names by searching for a
    //! sibling `filters` module at the derive-macro site. This
    //! module just re-exports the canonical implementations
    //! from `sittir_core::filters`.
    #[::askama::filter_fn]
    pub fn joinby<T: ::sittir_core::filters::JoinSource + ?Sized>(
        xs: &T,
        _values: &dyn ::askama::Values,
        sep: &str,
        leading: bool,
        trailing: bool,
    ) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, leading, trailing)
    }

    #[::askama::filter_fn]
    pub fn join<T: ::sittir_core::filters::JoinSource + ?Sized>(
        xs: &T,
        sep: &str,
    ) -> Result<String, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, false)
    }

    pub use ::sittir_core::filters::{
        upper, lower,
        isBlank, isPresent,
        joinWithTrailing, joinWithLeading, joinWithFlanks,
    };
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$type")]
pub enum AnyTransport {
    #[serde(rename = "_arrow_function__call_signature")]
    _ArrowFunctionUCallSignature(_ArrowFunctionUCallSignatureTransport),
    #[serde(rename = "_arrow_function_parameter")]
    _ArrowFunctionParameter(_ArrowFunctionParameterTransport),
    #[serde(rename = "_call_expression_call")]
    CallExpressionCall(CallExpressionCallTransport),
    #[serde(rename = "_call_expression_member")]
    CallExpressionMember(CallExpressionMemberTransport),
    #[serde(rename = "_call_expression_template_call")]
    CallExpressionTemplateCall(CallExpressionTemplateCallTransport),
    #[serde(rename = "_call_signature")]
    _CallSignature(_CallSignatureTransport),
    #[serde(rename = "_class_body_member")]
    ClassBodyMember(ClassBodyMemberTransport),
    #[serde(rename = "_class_body_method")]
    ClassBodyMethod(ClassBodyMethodTransport),
    #[serde(rename = "_class_body_method_sig")]
    ClassBodyMethodSig(ClassBodyMethodSigTransport),
    #[serde(rename = "_class_heritage_extends_clause")]
    _ClassHeritageExtendsClause(_ClassHeritageExtendsClauseTransport),
    #[serde(rename = "_class_heritage_implements_clause")]
    _ClassHeritageImplementsClause(_ClassHeritageImplementsClauseTransport),
    #[serde(rename = "_export_statement_default_decl_arm")]
    ExportStatementDefaultDeclArm(ExportStatementDefaultDeclArmTransport),
    #[serde(rename = "_export_statement_default_decl_arm_default_kw")]
    ExportStatementDefaultDeclArmDefaultKw(ExportStatementDefaultDeclArmDefaultKwTransport),
    #[serde(rename = "_export_statement_default_decl_arm_default_kw_value")]
    ExportStatementDefaultDeclArmDefaultKwValue(ExportStatementDefaultDeclArmDefaultKwValueTransport),
    #[serde(rename = "_export_statement_default_from_arm")]
    ExportStatementDefaultFromArm(ExportStatementDefaultFromArmTransport),
    #[serde(rename = "_export_statement_default_from_arm_clause_from")]
    ExportStatementDefaultFromArmClauseFrom(ExportStatementDefaultFromArmClauseFromTransport),
    #[serde(rename = "_export_statement_default_from_arm_ns_from")]
    ExportStatementDefaultFromArmNsFrom(ExportStatementDefaultFromArmNsFromTransport),
    #[serde(rename = "_export_statement_default_from_arm_star_from")]
    ExportStatementDefaultFromArmStarFrom(ExportStatementDefaultFromArmStarFromTransport),
    #[serde(rename = "_export_statement_equals_export")]
    _ExportStatementEqualsExport(_ExportStatementEqualsExportTransport),
    #[serde(rename = "_export_statement_namespace_export")]
    _ExportStatementNamespaceExport(_ExportStatementNamespaceExportTransport),
    #[serde(rename = "_export_statement_type_export")]
    _ExportStatementTypeExport(_ExportStatementTypeExportTransport),
    #[serde(rename = "_extends_clause_single")]
    ExtendsClauseSingle(ExtendsClauseSingleTransport),
    #[serde(rename = "_for_header")]
    ForHeader(ForHeaderTransport),
    #[serde(rename = "_for_header_let_const_kind")]
    ForHeaderLetConstKind(ForHeaderLetConstKindTransport),
    #[serde(rename = "_for_header_lhs")]
    ForHeaderLhs(ForHeaderLhsTransport),
    #[serde(rename = "_for_header_var_kind")]
    ForHeaderVarKind(ForHeaderVarKindTransport),
    #[serde(rename = "_from_clause")]
    FromClause(FromClauseTransport),
    #[serde(rename = "_import_clause_default_import")]
    _ImportClauseDefaultImport(_ImportClauseDefaultImportTransport),
    #[serde(rename = "_import_clause_named_imports")]
    _ImportClauseNamedImports(_ImportClauseNamedImportsTransport),
    #[serde(rename = "_import_clause_namespace_import")]
    _ImportClauseNamespaceImport(_ImportClauseNamespaceImportTransport),
    #[serde(rename = "_import_specifier_as")]
    ImportSpecifierAs(ImportSpecifierAsTransport),
    #[serde(rename = "_import_specifier_name")]
    _ImportSpecifierName(_ImportSpecifierNameTransport),
    #[serde(rename = "_index_signature_colon")]
    IndexSignatureColon(IndexSignatureColonTransport),
    #[serde(rename = "_index_signature_mapped_type_clause")]
    _IndexSignatureMappedTypeClause(_IndexSignatureMappedTypeClauseTransport),
    #[serde(rename = "_initializer")]
    Initializer(InitializerTransport),
    #[serde(rename = "_interface_body")]
    InterfaceBody(InterfaceBodyTransport),
    #[serde(rename = "_jsx_start_opening_element")]
    JsxStartOpeningElement(JsxStartOpeningElementTransport),
    #[serde(rename = "_jsx_string")]
    JsxString(JsxStringTransport),
    #[serde(rename = "_kw_abstract_marker")]
    KwAbstractMarker(KwAbstractMarkerTransport),
    #[serde(rename = "_kw_async_marker")]
    KwAsyncMarker(KwAsyncMarkerTransport),
    #[serde(rename = "_kw_const_marker")]
    KwConstMarker(KwConstMarkerTransport),
    #[serde(rename = "_kw_optional_marker")]
    KwOptionalMarker(KwOptionalMarkerTransport),
    #[serde(rename = "_kw_readonly_marker")]
    KwReadonlyMarker(KwReadonlyMarkerTransport),
    #[serde(rename = "_kw_static_marker")]
    KwStaticMarker(KwStaticMarkerTransport),
    #[serde(rename = "_lhs_expression")]
    LhsExpression(LhsExpressionTransport),
    #[serde(rename = "_module")]
    _Module(_ModuleTransport),
    #[serde(rename = "_number")]
    _Number(_NumberTransport),
    #[serde(rename = "_parameter_name")]
    ParameterName(ParameterNameTransport),
    #[serde(rename = "_parenthesized_expression_sequence")]
    _ParenthesizedExpressionSequence(_ParenthesizedExpressionSequenceTransport),
    #[serde(rename = "_parenthesized_expression_typed")]
    ParenthesizedExpressionTyped(ParenthesizedExpressionTypedTransport),
    #[serde(rename = "_property_identifier")]
    PropertyIdentifier(PropertyIdentifierTransport),
    #[serde(rename = "_public_field_definition_abstract_first")]
    PublicFieldDefinitionAbstractFirst(PublicFieldDefinitionAbstractFirstTransport),
    #[serde(rename = "_public_field_definition_access_first")]
    PublicFieldDefinitionAccessFirst(PublicFieldDefinitionAccessFirstTransport),
    #[serde(rename = "_public_field_definition_accessor_opt")]
    PublicFieldDefinitionAccessorOpt(PublicFieldDefinitionAccessorOptTransport),
    #[serde(rename = "_public_field_definition_declare_first")]
    PublicFieldDefinitionDeclareFirst(PublicFieldDefinitionDeclareFirstTransport),
    #[serde(rename = "_public_field_definition_readonly_first")]
    PublicFieldDefinitionReadonlyFirst(PublicFieldDefinitionReadonlyFirstTransport),
    #[serde(rename = "_public_field_definition_static_mods")]
    PublicFieldDefinitionStaticMods(PublicFieldDefinitionStaticModsTransport),
    #[serde(rename = "_reserved_identifier")]
    ReservedIdentifier(ReservedIdentifierTransport),
    #[serde(rename = "_statement_identifier")]
    StatementIdentifier(StatementIdentifierTransport),
    #[serde(rename = "_string_double")]
    _StringDouble(_StringDoubleTransport),
    #[serde(rename = "_string_fragment")]
    StringFragment(StringFragmentTransport),
    #[serde(rename = "_string_single")]
    _StringSingle(_StringSingleTransport),
    #[serde(rename = "_this_type")]
    ThisType(ThisTypeTransport),
    #[serde(rename = "_type_identifier")]
    TypeIdentifier(TypeIdentifierTransport),
    #[serde(rename = "_type_query_call_expression")]
    TypeQueryCallExpression(TypeQueryCallExpressionTransport),
    #[serde(rename = "_type_query_call_expression_in_type_annotation")]
    TypeQueryCallExpressionInTypeAnnotation(TypeQueryCallExpressionInTypeAnnotationTransport),
    #[serde(rename = "_type_query_instantiation_expression")]
    TypeQueryInstantiationExpression(TypeQueryInstantiationExpressionTransport),
    #[serde(rename = "_type_query_member_expression")]
    TypeQueryMemberExpression(TypeQueryMemberExpressionTransport),
    #[serde(rename = "_type_query_member_expression_in_type_annotation")]
    TypeQueryMemberExpressionInTypeAnnotation(TypeQueryMemberExpressionInTypeAnnotationTransport),
    #[serde(rename = "_type_query_subscript_expression")]
    TypeQuerySubscriptExpression(TypeQuerySubscriptExpressionTransport),
    #[serde(rename = "_update_expression_postfix")]
    UpdateExpressionPostfix(UpdateExpressionPostfixTransport),
    #[serde(rename = "_update_expression_prefix")]
    UpdateExpressionPrefix(UpdateExpressionPrefixTransport),
    #[serde(rename = "abstract_class_declaration")]
    AbstractClassDeclaration(AbstractClassDeclarationTransport),
    #[serde(rename = "abstract_method_signature")]
    AbstractMethodSignature(AbstractMethodSignatureTransport),
    #[serde(rename = "accessibility_modifier")]
    AccessibilityModifier(AccessibilityModifierTransport),
    #[serde(rename = "adding_type_annotation")]
    AddingTypeAnnotation(AddingTypeAnnotationTransport),
    #[serde(rename = "ambient_declaration")]
    AmbientDeclaration(AmbientDeclarationTransport),
    #[serde(rename = "arguments")]
    Arguments(ArgumentsTransport),
    #[serde(rename = "array")]
    Array(ArrayTransport),
    #[serde(rename = "array_pattern")]
    ArrayPattern(ArrayPatternTransport),
    #[serde(rename = "array_type")]
    ArrayType(ArrayTypeTransport),
    #[serde(rename = "arrow_function_parameter")]
    ArrowFunctionParameter(ArrowFunctionParameterTransport),
    #[serde(rename = "arrow_function__call_signature")]
    ArrowFunctionUCallSignature(ArrowFunctionUCallSignatureTransport),
    #[serde(rename = "arrow_function")]
    ArrowFunction(ArrowFunctionTransport),
    #[serde(rename = "as_expression")]
    AsExpression(AsExpressionTransport),
    #[serde(rename = "asserts")]
    Asserts(AssertsTransport),
    #[serde(rename = "asserts_annotation")]
    AssertsAnnotation(AssertsAnnotationTransport),
    #[serde(rename = "assignment_expression")]
    AssignmentExpression(AssignmentExpressionTransport),
    #[serde(rename = "assignment_pattern")]
    AssignmentPattern(AssignmentPatternTransport),
    #[serde(rename = "augmented_assignment_expression")]
    AugmentedAssignmentExpression(AugmentedAssignmentExpressionTransport),
    #[serde(rename = "await_expression")]
    AwaitExpression(AwaitExpressionTransport),
    #[serde(rename = "binary_expression")]
    BinaryExpression(BinaryExpressionTransport),
    #[serde(rename = "break_statement")]
    BreakStatement(BreakStatementTransport),
    #[serde(rename = "call_expression")]
    CallExpression(CallExpressionTransport),
    #[serde(rename = "call_signature")]
    CallSignature(CallSignatureTransport),
    #[serde(rename = "catch_clause")]
    CatchClause(CatchClauseTransport),
    #[serde(rename = "class")]
    Class(ClassTransport),
    #[serde(rename = "class_body")]
    ClassBody(ClassBodyTransport),
    #[serde(rename = "class_declaration")]
    ClassDeclaration(ClassDeclarationTransport),
    #[serde(rename = "class_heritage_extends_clause")]
    ClassHeritageExtendsClause(ClassHeritageExtendsClauseTransport),
    #[serde(rename = "class_heritage_implements_clause")]
    ClassHeritageImplementsClause(ClassHeritageImplementsClauseTransport),
    #[serde(rename = "class_heritage")]
    ClassHeritage(ClassHeritageTransport),
    #[serde(rename = "class_static_block")]
    ClassStaticBlock(ClassStaticBlockTransport),
    #[serde(rename = "comment")]
    Comment(CommentTransport),
    #[serde(rename = "computed_property_name")]
    ComputedPropertyName(ComputedPropertyNameTransport),
    #[serde(rename = "conditional_type")]
    ConditionalType(ConditionalTypeTransport),
    #[serde(rename = "constraint")]
    Constraint(ConstraintTransport),
    #[serde(rename = "construct_signature")]
    ConstructSignature(ConstructSignatureTransport),
    #[serde(rename = "constructor_type")]
    ConstructorType(ConstructorTypeTransport),
    #[serde(rename = "continue_statement")]
    ContinueStatement(ContinueStatementTransport),
    #[serde(rename = "debugger_statement")]
    DebuggerStatement(DebuggerStatementTransport),
    #[serde(rename = "decorator")]
    Decorator(DecoratorTransport),
    #[serde(rename = "decorator_call_expression")]
    DecoratorCallExpression(DecoratorCallExpressionTransport),
    #[serde(rename = "decorator_member_expression")]
    DecoratorMemberExpression(DecoratorMemberExpressionTransport),
    #[serde(rename = "decorator_parenthesized_expression")]
    DecoratorParenthesizedExpression(DecoratorParenthesizedExpressionTransport),
    #[serde(rename = "default_type")]
    DefaultType(DefaultTypeTransport),
    #[serde(rename = "do_statement")]
    DoStatement(DoStatementTransport),
    #[serde(rename = "else_clause")]
    ElseClause(ElseClauseTransport),
    #[serde(rename = "empty_statement")]
    EmptyStatement(EmptyStatementTransport),
    #[serde(rename = "enum_assignment")]
    EnumAssignment(EnumAssignmentTransport),
    #[serde(rename = "enum_body")]
    EnumBody(EnumBodyTransport),
    #[serde(rename = "enum_declaration")]
    EnumDeclaration(EnumDeclarationTransport),
    #[serde(rename = "escape_sequence")]
    EscapeSequence(EscapeSequenceTransport),
    #[serde(rename = "existential_type")]
    ExistentialType(ExistentialTypeTransport),
    #[serde(rename = "export_clause")]
    ExportClause(ExportClauseTransport),
    #[serde(rename = "export_specifier")]
    ExportSpecifier(ExportSpecifierTransport),
    #[serde(rename = "export_statement_type_export")]
    ExportStatementTypeExport(ExportStatementTypeExportTransport),
    #[serde(rename = "export_statement_equals_export")]
    ExportStatementEqualsExport(ExportStatementEqualsExportTransport),
    #[serde(rename = "export_statement_namespace_export")]
    ExportStatementNamespaceExport(ExportStatementNamespaceExportTransport),
    #[serde(rename = "export_statement")]
    ExportStatement(ExportStatementTransport),
    #[serde(rename = "expression_statement")]
    ExpressionStatement(ExpressionStatementTransport),
    #[serde(rename = "extends_clause")]
    ExtendsClause(ExtendsClauseTransport),
    #[serde(rename = "extends_type_clause")]
    ExtendsTypeClause(ExtendsTypeClauseTransport),
    #[serde(rename = "false")]
    False(FalseTransport),
    #[serde(rename = "field_definition")]
    FieldDefinition(FieldDefinitionTransport),
    #[serde(rename = "finally_clause")]
    FinallyClause(FinallyClauseTransport),
    #[serde(rename = "flow_maybe_type")]
    FlowMaybeType(FlowMaybeTypeTransport),
    #[serde(rename = "for_in_statement")]
    ForInStatement(ForInStatementTransport),
    #[serde(rename = "for_statement")]
    ForStatement(ForStatementTransport),
    #[serde(rename = "formal_parameters")]
    FormalParameters(FormalParametersTransport),
    #[serde(rename = "function_declaration")]
    FunctionDeclaration(FunctionDeclarationTransport),
    #[serde(rename = "function_expression")]
    FunctionExpression(FunctionExpressionTransport),
    #[serde(rename = "function_signature")]
    FunctionSignature(FunctionSignatureTransport),
    #[serde(rename = "function_type")]
    FunctionType(FunctionTypeTransport),
    #[serde(rename = "generator_function")]
    GeneratorFunction(GeneratorFunctionTransport),
    #[serde(rename = "generator_function_declaration")]
    GeneratorFunctionDeclaration(GeneratorFunctionDeclarationTransport),
    #[serde(rename = "generic_type")]
    GenericType(GenericTypeTransport),
    #[serde(rename = "hash_bang_line")]
    HashBangLine(HashBangLineTransport),
    #[serde(rename = "html_character_reference")]
    HtmlCharacterReference(HtmlCharacterReferenceTransport),
    #[serde(rename = "identifier")]
    Identifier(IdentifierTransport),
    #[serde(rename = "if_statement")]
    IfStatement(IfStatementTransport),
    #[serde(rename = "implements_clause")]
    ImplementsClause(ImplementsClauseTransport),
    #[serde(rename = "import")]
    Import(ImportTransport),
    #[serde(rename = "import_alias")]
    ImportAlias(ImportAliasTransport),
    #[serde(rename = "import_attribute")]
    ImportAttribute(ImportAttributeTransport),
    #[serde(rename = "import_clause_namespace_import")]
    ImportClauseNamespaceImport(ImportClauseNamespaceImportTransport),
    #[serde(rename = "import_clause_named_imports")]
    ImportClauseNamedImports(ImportClauseNamedImportsTransport),
    #[serde(rename = "import_clause_default_import")]
    ImportClauseDefaultImport(ImportClauseDefaultImportTransport),
    #[serde(rename = "import_clause")]
    ImportClause(ImportClauseTransport),
    #[serde(rename = "import_require_clause")]
    ImportRequireClause(ImportRequireClauseTransport),
    #[serde(rename = "import_specifier_name")]
    ImportSpecifierName(ImportSpecifierNameTransport),
    #[serde(rename = "import_specifier")]
    ImportSpecifier(ImportSpecifierTransport),
    #[serde(rename = "import_statement")]
    ImportStatement(ImportStatementTransport),
    #[serde(rename = "index_signature_mapped_type_clause")]
    IndexSignatureMappedTypeClause(IndexSignatureMappedTypeClauseTransport),
    #[serde(rename = "index_signature")]
    IndexSignature(IndexSignatureTransport),
    #[serde(rename = "index_type_query")]
    IndexTypeQuery(IndexTypeQueryTransport),
    #[serde(rename = "infer_type")]
    InferType(InferTypeTransport),
    #[serde(rename = "instantiation_expression")]
    InstantiationExpression(InstantiationExpressionTransport),
    #[serde(rename = "interface_declaration")]
    InterfaceDeclaration(InterfaceDeclarationTransport),
    #[serde(rename = "internal_module")]
    InternalModule(InternalModuleTransport),
    #[serde(rename = "intersection_type")]
    IntersectionType(IntersectionTypeTransport),
    #[serde(rename = "jsx_attribute")]
    JsxAttribute(JsxAttributeTransport),
    #[serde(rename = "jsx_closing_element")]
    JsxClosingElement(JsxClosingElementTransport),
    #[serde(rename = "jsx_element")]
    JsxElement(JsxElementTransport),
    #[serde(rename = "jsx_expression")]
    JsxExpression(JsxExpressionTransport),
    #[serde(rename = "jsx_identifier")]
    JsxIdentifier(JsxIdentifierTransport),
    #[serde(rename = "jsx_namespace_name")]
    JsxNamespaceName(JsxNamespaceNameTransport),
    #[serde(rename = "jsx_opening_element")]
    JsxOpeningElement(JsxOpeningElementTransport),
    #[serde(rename = "jsx_self_closing_element")]
    JsxSelfClosingElement(JsxSelfClosingElementTransport),
    #[serde(rename = "labeled_statement")]
    LabeledStatement(LabeledStatementTransport),
    #[serde(rename = "lexical_declaration")]
    LexicalDeclaration(LexicalDeclarationTransport),
    #[serde(rename = "literal_type")]
    LiteralType(LiteralTypeTransport),
    #[serde(rename = "lookup_type")]
    LookupType(LookupTypeTransport),
    #[serde(rename = "mapped_type_clause")]
    MappedTypeClause(MappedTypeClauseTransport),
    #[serde(rename = "member_expression")]
    MemberExpression(MemberExpressionTransport),
    #[serde(rename = "meta_property")]
    MetaProperty(MetaPropertyTransport),
    #[serde(rename = "method_definition")]
    MethodDefinition(MethodDefinitionTransport),
    #[serde(rename = "method_signature")]
    MethodSignature(MethodSignatureTransport),
    #[serde(rename = "module")]
    Module(ModuleTransport),
    #[serde(rename = "named_imports")]
    NamedImports(NamedImportsTransport),
    #[serde(rename = "namespace_export")]
    NamespaceExport(NamespaceExportTransport),
    #[serde(rename = "namespace_import")]
    NamespaceImport(NamespaceImportTransport),
    #[serde(rename = "nested_identifier")]
    NestedIdentifier(NestedIdentifierTransport),
    #[serde(rename = "nested_type_identifier")]
    NestedTypeIdentifier(NestedTypeIdentifierTransport),
    #[serde(rename = "new_expression")]
    NewExpression(NewExpressionTransport),
    #[serde(rename = "non_null_expression")]
    NonNullExpression(NonNullExpressionTransport),
    #[serde(rename = "null")]
    Null(NullTransport),
    #[serde(rename = "number")]
    Number(NumberTransport),
    #[serde(rename = "object")]
    Object(ObjectTransport),
    #[serde(rename = "object_assignment_pattern")]
    ObjectAssignmentPattern(ObjectAssignmentPatternTransport),
    #[serde(rename = "object_pattern")]
    ObjectPattern(ObjectPatternTransport),
    #[serde(rename = "object_type")]
    ObjectType(ObjectTypeTransport),
    #[serde(rename = "omitting_type_annotation")]
    OmittingTypeAnnotation(OmittingTypeAnnotationTransport),
    #[serde(rename = "opting_type_annotation")]
    OptingTypeAnnotation(OptingTypeAnnotationTransport),
    #[serde(rename = "optional_chain")]
    OptionalChain(OptionalChainTransport),
    #[serde(rename = "optional_parameter")]
    OptionalParameter(OptionalParameterTransport),
    #[serde(rename = "optional_tuple_parameter")]
    OptionalTupleParameter(OptionalTupleParameterTransport),
    #[serde(rename = "optional_type")]
    OptionalType(OptionalTypeTransport),
    #[serde(rename = "override_modifier")]
    OverrideModifier(OverrideModifierTransport),
    #[serde(rename = "pair")]
    Pair(PairTransport),
    #[serde(rename = "pair_pattern")]
    PairPattern(PairPatternTransport),
    #[serde(rename = "parenthesized_expression_sequence")]
    ParenthesizedExpressionSequence(ParenthesizedExpressionSequenceTransport),
    #[serde(rename = "parenthesized_expression")]
    ParenthesizedExpression(ParenthesizedExpressionTransport),
    #[serde(rename = "parenthesized_type")]
    ParenthesizedType(ParenthesizedTypeTransport),
    #[serde(rename = "predefined_type")]
    PredefinedType(PredefinedTypeTransport),
    #[serde(rename = "private_property_identifier")]
    PrivatePropertyIdentifier(PrivatePropertyIdentifierTransport),
    #[serde(rename = "program")]
    Program(ProgramTransport),
    #[serde(rename = "property_signature")]
    PropertySignature(PropertySignatureTransport),
    #[serde(rename = "public_field_definition")]
    PublicFieldDefinition(PublicFieldDefinitionTransport),
    #[serde(rename = "readonly_type")]
    ReadonlyType(ReadonlyTypeTransport),
    #[serde(rename = "regex")]
    Regex(RegexTransport),
    #[serde(rename = "regex_flags")]
    RegexFlags(RegexFlagsTransport),
    #[serde(rename = "regex_pattern")]
    RegexPattern(RegexPatternTransport),
    #[serde(rename = "required_parameter")]
    RequiredParameter(RequiredParameterTransport),
    #[serde(rename = "rest_pattern")]
    RestPattern(RestPatternTransport),
    #[serde(rename = "rest_type")]
    RestType(RestTypeTransport),
    #[serde(rename = "return_statement")]
    ReturnStatement(ReturnStatementTransport),
    #[serde(rename = "satisfies_expression")]
    SatisfiesExpression(SatisfiesExpressionTransport),
    #[serde(rename = "sequence_expression")]
    SequenceExpression(SequenceExpressionTransport),
    #[serde(rename = "spread_element")]
    SpreadElement(SpreadElementTransport),
    #[serde(rename = "statement_block")]
    StatementBlock(StatementBlockTransport),
    #[serde(rename = "string_double")]
    StringDouble(StringDoubleTransport),
    #[serde(rename = "string_single")]
    StringSingle(StringSingleTransport),
    #[serde(rename = "string")]
    String(StringTransport),
    #[serde(rename = "subscript_expression")]
    SubscriptExpression(SubscriptExpressionTransport),
    #[serde(rename = "super")]
    Super(SuperTransport),
    #[serde(rename = "switch_body")]
    SwitchBody(SwitchBodyTransport),
    #[serde(rename = "switch_case")]
    SwitchCase(SwitchCaseTransport),
    #[serde(rename = "switch_default")]
    SwitchDefault(SwitchDefaultTransport),
    #[serde(rename = "switch_statement")]
    SwitchStatement(SwitchStatementTransport),
    #[serde(rename = "template_literal_type")]
    TemplateLiteralType(TemplateLiteralTypeTransport),
    #[serde(rename = "template_string")]
    TemplateString(TemplateStringTransport),
    #[serde(rename = "template_substitution")]
    TemplateSubstitution(TemplateSubstitutionTransport),
    #[serde(rename = "template_type")]
    TemplateType(TemplateTypeTransport),
    #[serde(rename = "ternary_expression")]
    TernaryExpression(TernaryExpressionTransport),
    #[serde(rename = "this")]
    This(ThisTransport),
    #[serde(rename = "throw_statement")]
    ThrowStatement(ThrowStatementTransport),
    #[serde(rename = "true")]
    True(TrueTransport),
    #[serde(rename = "try_statement")]
    TryStatement(TryStatementTransport),
    #[serde(rename = "tuple_parameter")]
    TupleParameter(TupleParameterTransport),
    #[serde(rename = "tuple_type")]
    TupleType(TupleTypeTransport),
    #[serde(rename = "type_alias_declaration")]
    TypeAliasDeclaration(TypeAliasDeclarationTransport),
    #[serde(rename = "type_annotation")]
    TypeAnnotation(TypeAnnotationTransport),
    #[serde(rename = "type_arguments")]
    TypeArguments(TypeArgumentsTransport),
    #[serde(rename = "type_assertion")]
    TypeAssertion(TypeAssertionTransport),
    #[serde(rename = "type_parameter")]
    TypeParameter(TypeParameterTransport),
    #[serde(rename = "type_parameters")]
    TypeParameters(TypeParametersTransport),
    #[serde(rename = "type_predicate")]
    TypePredicate(TypePredicateTransport),
    #[serde(rename = "type_predicate_annotation")]
    TypePredicateAnnotation(TypePredicateAnnotationTransport),
    #[serde(rename = "type_query")]
    TypeQuery(TypeQueryTransport),
    #[serde(rename = "unary_expression")]
    UnaryExpression(UnaryExpressionTransport),
    #[serde(rename = "undefined")]
    Undefined(UndefinedTransport),
    #[serde(rename = "unescaped_double_jsx_string_fragment")]
    UnescapedDoubleJsxStringFragment(UnescapedDoubleJsxStringFragmentTransport),
    #[serde(rename = "unescaped_double_string_fragment")]
    UnescapedDoubleStringFragment(UnescapedDoubleStringFragmentTransport),
    #[serde(rename = "unescaped_single_jsx_string_fragment")]
    UnescapedSingleJsxStringFragment(UnescapedSingleJsxStringFragmentTransport),
    #[serde(rename = "unescaped_single_string_fragment")]
    UnescapedSingleStringFragment(UnescapedSingleStringFragmentTransport),
    #[serde(rename = "union_type")]
    UnionType(UnionTypeTransport),
    #[serde(rename = "update_expression")]
    UpdateExpression(UpdateExpressionTransport),
    #[serde(rename = "variable_declaration")]
    VariableDeclaration(VariableDeclarationTransport),
    #[serde(rename = "variable_declarator")]
    VariableDeclarator(VariableDeclaratorTransport),
    #[serde(rename = "while_statement")]
    WhileStatement(WhileStatementTransport),
    #[serde(rename = "with_statement")]
    WithStatement(WithStatementTransport),
    #[serde(rename = "yield_expression")]
    YieldExpression(YieldExpressionTransport),
    #[serde(rename = "_automatic_semicolon")]
    AutomaticSemicolon(AutomaticSemicolonTransport),
    #[serde(rename = "_template_chars")]
    TemplateChars(TemplateCharsTransport),
    #[serde(rename = "_ternary_qmark")]
    TernaryQmark(TernaryQmarkTransport),
    #[serde(rename = "html_comment")]
    HtmlComment(HtmlCommentTransport),
    #[serde(rename = "||")]
    Oror(OrorTransport),
    #[serde(rename = "jsx_text")]
    JsxText(JsxTextTransport),
    #[serde(rename = "_function_signature_automatic_semicolon")]
    FunctionSignatureAutomaticSemicolon(FunctionSignatureAutomaticSemicolonTransport),
    #[serde(rename = "__error_recovery")]
    ErrorRecovery(ErrorRecoveryTransport),
    #[serde(rename = "?.")]
    TokQDot(TokQDotTransport),
    #[serde(rename = ",")]
    Comma(CommaTransport),
    #[serde(rename = "export")]
    Export(ExportTransport),
    #[serde(rename = "default")]
    Default(DefaultTransport),
    #[serde(rename = "*")]
    Star(StarTransport),
    #[serde(rename = "=")]
    Eq(EqTransport),
    #[serde(rename = "as")]
    As(AsTransport),
    #[serde(rename = "namespace")]
    Namespace(NamespaceTransport),
    #[serde(rename = "(")]
    Paren(ParenTransport),
    #[serde(rename = ")")]
    CloseParen(CloseParenTransport),
    #[serde(rename = "var")]
    Var(VarTransport),
    #[serde(rename = "from")]
    From(FromTransport),
    #[serde(rename = ":")]
    Colon(ColonTransport),
    #[serde(rename = "<")]
    Lt(LtTransport),
    #[serde(rename = "\"")]
    TokDq(TokDqTransport),
    #[serde(rename = "'")]
    TokSq(TokSqTransport),
    #[serde(rename = "abstract")]
    Abstract(AbstractTransport),
    #[serde(rename = "async")]
    Async(AsyncTransport),
    #[serde(rename = "const")]
    Const(ConstTransport),
    #[serde(rename = "?")]
    Question(QuestionTransport),
    #[serde(rename = "readonly")]
    Readonly(ReadonlyTransport),
    #[serde(rename = "static")]
    Static(StaticTransport),
    #[serde(rename = "declare")]
    Declare(DeclareTransport),
    #[serde(rename = "accessor")]
    Accessor(AccessorTransport),
    #[serde(rename = ".")]
    Dot(DotTransport),
    #[serde(rename = "[")]
    Bracket(BracketTransport),
    #[serde(rename = "]")]
    CloseBracket(CloseBracketTransport),
    #[serde(rename = "+?:")]
    TokPlusQColon(TokPlusQColonTransport),
    #[serde(rename = "global")]
    Global(GlobalTransport),
    #[serde(rename = "using")]
    Using(UsingTransport),
    #[serde(rename = "await")]
    Await(AwaitTransport),
    #[serde(rename = "&&")]
    Andand(AndandTransport),
    #[serde(rename = ">>")]
    Shr(ShrTransport),
    #[serde(rename = ">>>")]
    TokGtGtGt(TokGtGtGtTransport),
    #[serde(rename = "<<")]
    Shl(ShlTransport),
    #[serde(rename = "&")]
    Amp(AmpTransport),
    #[serde(rename = "^")]
    Caret(CaretTransport),
    #[serde(rename = "|")]
    Pipe(PipeTransport),
    #[serde(rename = "+")]
    Plus(PlusTransport),
    #[serde(rename = "-")]
    Minus(MinusTransport),
    #[serde(rename = "/")]
    Slash(SlashTransport),
    #[serde(rename = "%")]
    Percent(PercentTransport),
    #[serde(rename = "**")]
    Starstar(StarstarTransport),
    #[serde(rename = "<=")]
    Le(LeTransport),
    #[serde(rename = "==")]
    Eqeq(EqeqTransport),
    #[serde(rename = "===")]
    TokEqEqEq(TokEqEqEqTransport),
    #[serde(rename = "!=")]
    Neq(NeqTransport),
    #[serde(rename = "!==")]
    TokBangEqEq(TokBangEqEqTransport),
    #[serde(rename = ">=")]
    Ge(GeTransport),
    #[serde(rename = ">")]
    Gt(GtTransport),
    #[serde(rename = "??")]
    TokQQ(TokQQTransport),
    #[serde(rename = "instanceof")]
    Instanceof(InstanceofTransport),
    #[serde(rename = "in")]
    In(InTransport),
    #[serde(rename = "break")]
    Break(BreakTransport),
    #[serde(rename = "catch")]
    Catch(CatchTransport),
    #[serde(rename = "{")]
    Brace(BraceTransport),
    #[serde(rename = ";")]
    Semi(SemiTransport),
    #[serde(rename = "}")]
    CloseBrace(CloseBraceTransport),
    #[serde(rename = "extends")]
    Extends(ExtendsTransport),
    #[serde(rename = "new")]
    New(NewTransport),
    #[serde(rename = "=>")]
    FatArrow(FatArrowTransport),
    #[serde(rename = "continue")]
    Continue(ContinueTransport),
    #[serde(rename = "debugger")]
    Debugger(DebuggerTransport),
    #[serde(rename = "@")]
    At(AtTransport),
    #[serde(rename = "do")]
    Do(DoTransport),
    #[serde(rename = "while")]
    While(WhileTransport),
    #[serde(rename = "else")]
    Else(ElseTransport),
    #[serde(rename = "enum")]
    Enum(EnumTransport),
    #[serde(rename = "finally")]
    Finally(FinallyTransport),
    #[serde(rename = "for")]
    For(ForTransport),
    #[serde(rename = "function")]
    Function(FunctionTransport),
    #[serde(rename = "if")]
    If(IfTransport),
    #[serde(rename = "implements")]
    Implements(ImplementsTransport),
    #[serde(rename = "require")]
    Require(RequireTransport),
    #[serde(rename = "keyof")]
    Keyof(KeyofTransport),
    #[serde(rename = "infer")]
    Infer(InferTransport),
    #[serde(rename = "interface")]
    Interface(InterfaceTransport),
    #[serde(rename = "</")]
    TokLtSlash(TokLtSlashTransport),
    #[serde(rename = "/>")]
    TokSlashGt(TokSlashGtTransport),
    #[serde(rename = "!")]
    Bang(BangTransport),
    #[serde(rename = "-?:")]
    TokMinusQColon(TokMinusQColonTransport),
    #[serde(rename = "?:")]
    TokQColon(TokQColonTransport),
    #[serde(rename = "override")]
    Override(OverrideTransport),
    #[serde(rename = "...")]
    Ellipsis(EllipsisTransport),
    #[serde(rename = "return")]
    Return(ReturnTransport),
    #[serde(rename = "satisfies")]
    Satisfies(SatisfiesTransport),
    #[serde(rename = "case")]
    Case(CaseTransport),
    #[serde(rename = "switch")]
    Switch(SwitchTransport),
    #[serde(rename = "`")]
    TokBt(TokBtTransport),
    #[serde(rename = "${")]
    TokDollarLbr(TokDollarLbrTransport),
    #[serde(rename = "throw")]
    Throw(ThrowTransport),
    #[serde(rename = "try")]
    Try(TryTransport),
    #[serde(rename = "is")]
    Is(IsTransport),
    #[serde(rename = "typeof")]
    Typeof(TypeofTransport),
    #[serde(rename = "with")]
    With(WithTransport),
    #[serde(rename = "yield")]
    Yield(YieldTransport),
    #[serde(rename = "of")]
    Literal0_6f_66(LiteralTransport),
    #[serde(rename = "let")]
    Literal1_6c_65_74(LiteralTransport),
    #[serde(rename = "++")]
    Literal2_2b_2b(LiteralTransport),
    #[serde(rename = "--")]
    Literal3_2d_2d(LiteralTransport),
    #[serde(rename = "get")]
    Literal4_67_65_74(LiteralTransport),
    #[serde(rename = "set")]
    Literal5_73_65_74(LiteralTransport),
    #[serde(rename = "+=")]
    Literal6_2b_3d(LiteralTransport),
    #[serde(rename = "-=")]
    Literal7_2d_3d(LiteralTransport),
    #[serde(rename = "*=")]
    Literal8_2a_3d(LiteralTransport),
    #[serde(rename = "/=")]
    Literal9_2f_3d(LiteralTransport),
    #[serde(rename = "%=")]
    Literal10_25_3d(LiteralTransport),
    #[serde(rename = "^=")]
    Literal11_5e_3d(LiteralTransport),
    #[serde(rename = "&=")]
    Literal12_26_3d(LiteralTransport),
    #[serde(rename = "|=")]
    Literal13_7c_3d(LiteralTransport),
    #[serde(rename = ">>=")]
    Literal14_3e_3e_3d(LiteralTransport),
    #[serde(rename = ">>>=")]
    Literal15_3e_3e_3e_3d(LiteralTransport),
    #[serde(rename = "<<=")]
    Literal16_3c_3c_3d(LiteralTransport),
    #[serde(rename = "**=")]
    Literal17_2a_2a_3d(LiteralTransport),
    #[serde(rename = "&&=")]
    Literal18_26_26_3d(LiteralTransport),
    #[serde(rename = "||=")]
    Literal19_7c_7c_3d(LiteralTransport),
    #[serde(rename = "??=")]
    Literal20_3f_3f_3d(LiteralTransport),
    #[serde(rename = "type")]
    Literal21_74_79_70_65(LiteralTransport),
    #[serde(rename = "assert")]
    Literal22_61_73_73_65_72_74(LiteralTransport),
    #[serde(rename = "{|")]
    Literal23_7b_7c(LiteralTransport),
    #[serde(rename = "|}")]
    Literal24_7c_7d(LiteralTransport),
    #[serde(rename = "~")]
    Literal25_7e(LiteralTransport),
    #[serde(rename = "void")]
    Literal26_76_6f_69_64(LiteralTransport),
    #[serde(rename = "delete")]
    Literal27_64_65_6c_65_74_65(LiteralTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LiteralTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ArrowFunctionUCallSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ArrowFunctionParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub parameter: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionCallTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionMemberTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionTemplateCallTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _CallSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassBodyMemberTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassBodyMethodTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassBodyMethodSigTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ClassHeritageExtendsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ClassHeritageImplementsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultDeclArmTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultDeclArmDefaultKwTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultFromArmTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultFromArmClauseFromTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub source: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultFromArmNsFromTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub source: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementDefaultFromArmStarFromTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub source: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ExportStatementEqualsExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ExportStatementNamespaceExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ExportStatementTypeExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub source: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExtendsClauseSingleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Box<AnyTransport>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForHeaderTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForHeaderLetConstKindTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub kind: Box<AnyTransport>,
    pub left: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForHeaderLhsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForHeaderVarKindTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub kind: Box<AnyTransport>,
    pub left: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FromClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub source: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ImportClauseDefaultImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ImportClauseNamedImportsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ImportClauseNamespaceImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportSpecifierAsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    pub alias: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ImportSpecifierNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IndexSignatureColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    pub index_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _IndexSignatureMappedTypeClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InitializerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InterfaceBodyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxStartOpeningElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub attribute: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxStringTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwAbstractMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwAsyncMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwConstMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwOptionalMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwReadonlyMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KwStaticMarkerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LhsExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ModuleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub body: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _NumberTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub operator: Box<AnyTransport>,
    pub argument: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParameterNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    pub pattern: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _ParenthesizedExpressionSequenceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenthesizedExpressionTypedTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PropertyIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionAbstractFirstTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub abstract_marker: Box<AnyTransport>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionAccessFirstTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub declare_marker: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionAccessorOptTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub accessor_marker: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionDeclareFirstTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionReadonlyFirstTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub readonly_marker: Box<AnyTransport>,
    #[serde(default)]
    pub abstract_marker: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionStaticModsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub static_marker: Box<AnyTransport>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ReservedIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StatementIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _StringDoubleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringFragmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct _StringSingleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ThisTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryCallExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryCallExpressionInTypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryInstantiationExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    pub type_arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryMemberExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub property: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryMemberExpressionInTypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub property: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQuerySubscriptExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub index: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UpdateExpressionPostfixTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub argument: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UpdateExpressionPrefixTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub operator: Box<AnyTransport>,
    pub argument: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AbstractClassDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub class_heritage: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AbstractMethodSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub accessibility_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub override_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub accessor_kind: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub optional_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AccessibilityModifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AddingTypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AmbientDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub declaration: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArgumentsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrayTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrayPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrayTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub primary_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrowFunctionParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub parameter: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrowFunctionUCallSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ArrowFunctionTransport {
    #[serde(rename = "parameter")]
    ArrowFunctionUFormParameter(ArrowFunctionUFormParameterTransport),
    #[serde(rename = "_call_signature")]
    ArrowFunctionUFormUCallSignature(ArrowFunctionUFormUCallSignatureTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrowFunctionUFormParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ArrowFunctionUFormUCallSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AsExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
    pub type_annotation: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssertsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssertsAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub asserts: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub using_marker: Option<Box<AnyTransport>>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AugmentedAssignmentExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AwaitExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BinaryExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BreakStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub label: Option<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum CallExpressionTransport {
    #[serde(rename = "call")]
    CallExpressionUFormCall(CallExpressionUFormCallTransport),
    #[serde(rename = "template_call")]
    CallExpressionUFormTemplateCall(CallExpressionUFormTemplateCallTransport),
    #[serde(rename = "member")]
    CallExpressionUFormMember(CallExpressionUFormMemberTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionUFormCallTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionUFormTemplateCallTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallExpressionUFormMemberTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CatchClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub parameter: Option<Box<AnyTransport>>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub class_heritage: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassBodyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub class_heritage: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
    #[serde(default)]
    pub automatic_semicolon: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassHeritageExtendsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassHeritageImplementsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ClassHeritageTransport {
    #[serde(rename = "extends_clause")]
    ClassHeritageUFormExtendsClause(ClassHeritageUFormExtendsClauseTransport),
    #[serde(rename = "implements_clause")]
    ClassHeritageUFormImplementsClause(ClassHeritageUFormImplementsClauseTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassHeritageUFormExtendsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassHeritageUFormImplementsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassStaticBlockTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CommentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ComputedPropertyNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConditionalTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
    pub consequence: Box<AnyTransport>,
    pub alternative: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConstraintTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConstructSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub abstract_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConstructorTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub abstract_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ContinueStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub label: Option<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DebuggerStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DecoratorTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DecoratorCallExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub function: Box<AnyTransport>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DecoratorMemberExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub property: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DecoratorParenthesizedExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DefaultTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DoStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub body: Box<AnyTransport>,
    pub condition: Box<AnyTransport>,
    #[serde(default)]
    pub semicolon: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ElseClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub statement: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EmptyStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EnumAssignmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EnumBodyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EnumDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub const_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EscapeSequenceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExistentialTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportSpecifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub export_kind: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub alias: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementTypeExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub source: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementEqualsExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementNamespaceExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ExportStatementTransport {
    #[serde(rename = "default")]
    ExportStatementUFormDefault(ExportStatementUFormDefaultTransport),
    #[serde(rename = "type_export")]
    ExportStatementUFormTypeExport(ExportStatementUFormTypeExportTransport),
    #[serde(rename = "equals_export")]
    ExportStatementUFormEqualsExport(ExportStatementUFormEqualsExportTransport),
    #[serde(rename = "namespace_export")]
    ExportStatementUFormNamespaceExport(ExportStatementUFormNamespaceExportTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementUFormDefaultTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementUFormTypeExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementUFormEqualsExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportStatementUFormNamespaceExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExpressionStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub semicolon: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExtendsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExtendsTypeClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FalseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FieldDefinitionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub static_marker: Option<Box<AnyTransport>>,
    pub property: Box<AnyTransport>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FinallyClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FlowMaybeTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub primary_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForInStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub await_marker: Option<Box<AnyTransport>>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub initializer: Box<AnyTransport>,
    pub condition: Box<AnyTransport>,
    #[serde(default)]
    pub increment: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FormalParametersTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    pub return_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GeneratorFunctionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GeneratorFunctionDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GenericTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    pub type_arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct HashBangLineTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct HtmlCharacterReferenceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IfStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub condition: Box<AnyTransport>,
    pub consequence: Box<AnyTransport>,
    #[serde(default)]
    pub alternative: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImplementsClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportAliasTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportAttributeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseNamespaceImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseNamedImportsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseDefaultImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ImportClauseTransport {
    #[serde(rename = "namespace_import")]
    ImportClauseUFormNamespaceImport(ImportClauseUFormNamespaceImportTransport),
    #[serde(rename = "named_imports")]
    ImportClauseUFormNamedImports(ImportClauseUFormNamedImportsTransport),
    #[serde(rename = "default_import")]
    ImportClauseUFormDefaultImport(ImportClauseUFormDefaultImportTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseUFormNamespaceImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseUFormNamedImportsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportClauseUFormDefaultImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportRequireClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub identifier: Box<AnyTransport>,
    pub source: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportSpecifierNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ImportSpecifierTransport {
    #[serde(rename = "name")]
    ImportSpecifierUFormName(ImportSpecifierUFormNameTransport),
    #[serde(rename = "as")]
    ImportSpecifierUFormAs(ImportSpecifierUFormAsTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportSpecifierUFormNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub import_kind: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportSpecifierUFormAsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub import_kind: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub import_clause: Option<Box<AnyTransport>>,
    pub from_clause: Box<AnyTransport>,
    #[serde(default)]
    pub import_attribute: Option<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IndexSignatureMappedTypeClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum IndexSignatureTransport {
    #[serde(rename = "colon")]
    IndexSignatureUFormColon(IndexSignatureUFormColonTransport),
    #[serde(rename = "mapped_type_clause")]
    IndexSignatureUFormMappedTypeClause(IndexSignatureUFormMappedTypeClauseTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IndexSignatureUFormColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub sign: Option<Box<AnyTransport>>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IndexSignatureUFormMappedTypeClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub sign: Option<Box<AnyTransport>>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IndexTypeQueryTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub primary_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InferTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub type_identifier: Box<AnyTransport>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InstantiationExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
    pub type_arguments: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InterfaceDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub extends_type_clause: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InternalModuleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub body: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IntersectionTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub left: Option<Box<AnyTransport>>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxAttributeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxClosingElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub open_tag: Box<AnyTransport>,
    pub close_tag: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxNamespaceNameTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxOpeningElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub attribute: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxSelfClosingElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub name: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    pub attribute: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LabeledStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub label: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LexicalDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub kind: Box<AnyTransport>,
    pub declarators: Vec<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LiteralTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LookupTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub primary_type: Box<AnyTransport>,
    pub index_type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MappedTypeClauseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
    #[serde(default)]
    pub alias: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MemberExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub property: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MetaPropertyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MethodDefinitionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub accessibility_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub static_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub override_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub accessor_kind: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub optional_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MethodSignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub accessibility_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub static_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub override_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub accessor_kind: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub optional_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    #[serde(default)]
    pub return_type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ModuleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub body: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NamedImportsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NamespaceExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NamespaceImportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub identifier: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NestedIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub property: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NestedTypeIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub module: Box<AnyTransport>,
    pub name: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NewExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub constructor: Box<AnyTransport>,
    #[serde(default)]
    pub type_arguments: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub arguments: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NonNullExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NullTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NumberTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ObjectTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ObjectAssignmentPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ObjectPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ObjectTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub opening: Box<AnyTransport>,
    #[serde(default)]
    pub members: Option<Vec<Box<AnyTransport>>>,
    pub closing: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OmittingTypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OptingTypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OptionalChainTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OptionalParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    pub pattern: Box<AnyTransport>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OptionalTupleParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OptionalTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OverrideModifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PairTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub key: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PairPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub key: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenthesizedExpressionSequenceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum ParenthesizedExpressionTransport {
    #[serde(rename = "typed")]
    ParenthesizedExpressionUFormTyped(ParenthesizedExpressionUFormTypedTransport),
    #[serde(rename = "sequence")]
    ParenthesizedExpressionUFormSequence(ParenthesizedExpressionUFormSequenceTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenthesizedExpressionUFormTypedTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenthesizedExpressionUFormSequenceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenthesizedTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PredefinedTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PrivatePropertyIdentifierTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ProgramTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub hash_bang_line: Option<Box<AnyTransport>>,
    pub statements: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PropertySignatureTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub accessibility_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub static_marker: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub override_modifier: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub optional_marker: Option<Box<AnyTransport>>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PublicFieldDefinitionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub optionality_marker: Option<Box<AnyTransport>>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ReadonlyTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RegexTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub pattern: Box<AnyTransport>,
    #[serde(default)]
    pub flags: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RegexFlagsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RegexPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RequiredParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub decorator: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub readonly_marker: Option<Box<AnyTransport>>,
    pub pattern: Box<AnyTransport>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RestPatternTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RestTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ReturnStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub semicolon: Box<AnyTransport>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SatisfiesExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
    pub type_annotation: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SequenceExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SpreadElementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StatementBlockTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub statements: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub automatic_semicolon: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringDoubleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringSingleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum StringTransport {
    #[serde(rename = "double")]
    StringUFormDouble(StringUFormDoubleTransport),
    #[serde(rename = "single")]
    StringUFormSingle(StringUFormSingleTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringUFormDoubleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringUFormSingleTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SubscriptExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    #[serde(default)]
    pub optional_chain: Option<Box<AnyTransport>>,
    pub index: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SuperTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SwitchBodyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SwitchCaseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Box<AnyTransport>,
    pub body: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SwitchDefaultTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub body: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SwitchStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub value: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TemplateLiteralTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TemplateStringTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TemplateSubstitutionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TemplateTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TernaryExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub condition: Box<AnyTransport>,
    pub consequence: Box<AnyTransport>,
    pub alternative: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ThisTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ThrowStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub semicolon: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TrueTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TryStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub body: Box<AnyTransport>,
    #[serde(default)]
    pub handler: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub finalizer: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TupleParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TupleTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeAliasDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub type_parameters: Option<Box<AnyTransport>>,
    pub value: Box<AnyTransport>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeArgumentsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeAssertionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub type_arguments: Box<AnyTransport>,
    pub expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeParameterTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub const_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    #[serde(default)]
    pub constraint: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeParametersTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypePredicateTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(rename = "type")]
    pub r#type: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypePredicateAnnotationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub type_predicate: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeQueryTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnaryExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub operator: Box<AnyTransport>,
    pub argument: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UndefinedTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnescapedDoubleJsxStringFragmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnescapedDoubleStringFragmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnescapedSingleJsxStringFragmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnescapedSingleStringFragmentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnionTypeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub left: Option<Box<AnyTransport>>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
#[serde(tag = "$variant")]
pub enum UpdateExpressionTransport {
    #[serde(rename = "postfix")]
    UpdateExpressionUFormPostfix(UpdateExpressionUFormPostfixTransport),
    #[serde(rename = "prefix")]
    UpdateExpressionUFormPrefix(UpdateExpressionUFormPrefixTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UpdateExpressionUFormPostfixTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UpdateExpressionUFormPrefixTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct VariableDeclarationTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub declarators: Vec<Box<AnyTransport>>,
    pub semicolon: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct VariableDeclaratorTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub name: Box<AnyTransport>,
    #[serde(rename = "type")]
    #[serde(default)]
    pub r#type: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub value: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WhileStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub condition: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WithStatementTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    pub object: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct YieldExpressionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$text", default)]
    pub transport_text: Option<String>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(default)]
    pub expression: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AutomaticSemicolonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TemplateCharsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TernaryQmarkTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct HtmlCommentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OrorTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct JsxTextTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionSignatureAutomaticSemicolonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ErrorRecoveryTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokQDotTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CommaTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExportTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DefaultTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StarTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NamespaceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ParenTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CloseParenTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct VarTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FromTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokDqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokSqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AbstractTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AsyncTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConstTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct QuestionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ReadonlyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StaticTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DeclareTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AccessorTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DotTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BracketTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CloseBracketTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokPlusQColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GlobalTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UsingTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AwaitTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AndandTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ShrTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokGtGtGtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ShlTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AmpTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CaretTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PipeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PlusTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MinusTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SlashTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct PercentTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StarstarTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EqeqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokEqEqEqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NeqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokBangEqEqTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GeTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokQQTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InstanceofTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BreakTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CatchTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BraceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SemiTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CloseBraceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExtendsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NewTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FatArrowTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ContinueTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DebuggerTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DoTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WhileTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ElseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EnumTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FinallyTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ForTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FunctionTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IfTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImplementsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RequireTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KeyofTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InferTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct InterfaceTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokLtSlashTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokSlashGtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BangTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokMinusQColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokQColonTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct OverrideTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct EllipsisTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ReturnTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SatisfiesTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CaseTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SwitchTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokBtTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TokDollarLbrTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ThrowTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TryTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IsTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeofTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WithTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct YieldTransport {
    #[serde(rename = "$source", default)]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[serde(rename = "$named", default)]
    pub transport_named: Option<bool>,
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}


use ::sittir_core::types::{FieldValue as TransportFieldValue, NodeData as TransportNodeData, Source as TransportSource};
use ::std::collections::HashMap as TransportHashMap;

fn transport_node_data(
    kind: &str,
    source: Option<TransportSource>,
    named: Option<bool>,
    default_named: bool,
    text: Option<String>,
    span: Option<::sittir_core::types::Span>,
    node_id: Option<u64>,
    fields: Option<TransportHashMap<String, TransportFieldValue>>,
    children: Option<Vec<TransportNodeData>>,
) -> TransportNodeData {
    TransportNodeData {
        type_: kind.to_string(),
        source: source.unwrap_or(TransportSource::Factory),
        named: named.unwrap_or(default_named),
        fields,
        children,
        text,
        span,
        node_id,
    }
}

fn transport_field_value(value: Box<AnyTransport>) -> Result<TransportFieldValue, ::askama::Error> {
    let node = transport_to_node(*value)?;
    if !node.named {
        if let Some(text) = node.text.clone() {
            return Ok(TransportFieldValue::Text(text));
        }
    }
    Ok(TransportFieldValue::Single(Box::new(node)))
}

fn transport_field_values(values: Vec<Box<AnyTransport>>) -> Result<TransportFieldValue, ::askama::Error> {
    let mut nodes = Vec::with_capacity(values.len());
    for value in values {
        nodes.push(transport_to_node(*value)?);
    }
    Ok(TransportFieldValue::Multiple(nodes))
}

fn transport_children(values: Vec<Box<AnyTransport>>) -> Result<Vec<TransportNodeData>, ::askama::Error> {
    let mut nodes = Vec::with_capacity(values.len());
    for value in values {
        nodes.push(transport_to_node(*value)?);
    }
    Ok(nodes)
}

fn literal_transport_to_node(kind: &str, transport: LiteralTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        kind,
        transport.transport_source,
        transport.transport_named,
        false,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        AnyTransport::_ArrowFunctionUCallSignature(data) => transport_to_node__arrow_function_ucall_signature(data),
        AnyTransport::_ArrowFunctionParameter(data) => transport_to_node__arrow_function_parameter(data),
        AnyTransport::CallExpressionCall(data) => transport_to_node_call_expression_call(data),
        AnyTransport::CallExpressionMember(data) => transport_to_node_call_expression_member(data),
        AnyTransport::CallExpressionTemplateCall(data) => transport_to_node_call_expression_template_call(data),
        AnyTransport::_CallSignature(data) => transport_to_node__call_signature(data),
        AnyTransport::ClassBodyMember(data) => transport_to_node_class_body_member(data),
        AnyTransport::ClassBodyMethod(data) => transport_to_node_class_body_method(data),
        AnyTransport::ClassBodyMethodSig(data) => transport_to_node_class_body_method_sig(data),
        AnyTransport::_ClassHeritageExtendsClause(data) => transport_to_node__class_heritage_extends_clause(data),
        AnyTransport::_ClassHeritageImplementsClause(data) => transport_to_node__class_heritage_implements_clause(data),
        AnyTransport::ExportStatementDefaultDeclArm(data) => transport_to_node_export_statement_default_decl_arm(data),
        AnyTransport::ExportStatementDefaultDeclArmDefaultKw(data) => transport_to_node_export_statement_default_decl_arm_default_kw(data),
        AnyTransport::ExportStatementDefaultDeclArmDefaultKwValue(data) => transport_to_node_export_statement_default_decl_arm_default_kw_value(data),
        AnyTransport::ExportStatementDefaultFromArm(data) => transport_to_node_export_statement_default_from_arm(data),
        AnyTransport::ExportStatementDefaultFromArmClauseFrom(data) => transport_to_node_export_statement_default_from_arm_clause_from(data),
        AnyTransport::ExportStatementDefaultFromArmNsFrom(data) => transport_to_node_export_statement_default_from_arm_ns_from(data),
        AnyTransport::ExportStatementDefaultFromArmStarFrom(data) => transport_to_node_export_statement_default_from_arm_star_from(data),
        AnyTransport::_ExportStatementEqualsExport(data) => transport_to_node__export_statement_equals_export(data),
        AnyTransport::_ExportStatementNamespaceExport(data) => transport_to_node__export_statement_namespace_export(data),
        AnyTransport::_ExportStatementTypeExport(data) => transport_to_node__export_statement_type_export(data),
        AnyTransport::ExtendsClauseSingle(data) => transport_to_node_extends_clause_single(data),
        AnyTransport::ForHeader(data) => transport_to_node_for_header(data),
        AnyTransport::ForHeaderLetConstKind(data) => transport_to_node_for_header_let_const_kind(data),
        AnyTransport::ForHeaderLhs(data) => transport_to_node_for_header_lhs(data),
        AnyTransport::ForHeaderVarKind(data) => transport_to_node_for_header_var_kind(data),
        AnyTransport::FromClause(data) => transport_to_node_from_clause(data),
        AnyTransport::_ImportClauseDefaultImport(data) => transport_to_node__import_clause_default_import(data),
        AnyTransport::_ImportClauseNamedImports(data) => transport_to_node__import_clause_named_imports(data),
        AnyTransport::_ImportClauseNamespaceImport(data) => transport_to_node__import_clause_namespace_import(data),
        AnyTransport::ImportSpecifierAs(data) => transport_to_node_import_specifier_as(data),
        AnyTransport::_ImportSpecifierName(data) => transport_to_node__import_specifier_name(data),
        AnyTransport::IndexSignatureColon(data) => transport_to_node_index_signature_colon(data),
        AnyTransport::_IndexSignatureMappedTypeClause(data) => transport_to_node__index_signature_mapped_type_clause(data),
        AnyTransport::Initializer(data) => transport_to_node_initializer(data),
        AnyTransport::InterfaceBody(data) => transport_to_node_interface_body(data),
        AnyTransport::JsxStartOpeningElement(data) => transport_to_node_jsx_start_opening_element(data),
        AnyTransport::JsxString(data) => transport_to_node_jsx_string(data),
        AnyTransport::KwAbstractMarker(data) => transport_to_node_kw_abstract_marker(data),
        AnyTransport::KwAsyncMarker(data) => transport_to_node_kw_async_marker(data),
        AnyTransport::KwConstMarker(data) => transport_to_node_kw_const_marker(data),
        AnyTransport::KwOptionalMarker(data) => transport_to_node_kw_optional_marker(data),
        AnyTransport::KwReadonlyMarker(data) => transport_to_node_kw_readonly_marker(data),
        AnyTransport::KwStaticMarker(data) => transport_to_node_kw_static_marker(data),
        AnyTransport::LhsExpression(data) => transport_to_node_lhs_expression(data),
        AnyTransport::_Module(data) => transport_to_node__module(data),
        AnyTransport::_Number(data) => transport_to_node__number(data),
        AnyTransport::ParameterName(data) => transport_to_node_parameter_name(data),
        AnyTransport::_ParenthesizedExpressionSequence(data) => transport_to_node__parenthesized_expression_sequence(data),
        AnyTransport::ParenthesizedExpressionTyped(data) => transport_to_node_parenthesized_expression_typed(data),
        AnyTransport::PropertyIdentifier(data) => transport_to_node_property_identifier(data),
        AnyTransport::PublicFieldDefinitionAbstractFirst(data) => transport_to_node_public_field_definition_abstract_first(data),
        AnyTransport::PublicFieldDefinitionAccessFirst(data) => transport_to_node_public_field_definition_access_first(data),
        AnyTransport::PublicFieldDefinitionAccessorOpt(data) => transport_to_node_public_field_definition_accessor_opt(data),
        AnyTransport::PublicFieldDefinitionDeclareFirst(data) => transport_to_node_public_field_definition_declare_first(data),
        AnyTransport::PublicFieldDefinitionReadonlyFirst(data) => transport_to_node_public_field_definition_readonly_first(data),
        AnyTransport::PublicFieldDefinitionStaticMods(data) => transport_to_node_public_field_definition_static_mods(data),
        AnyTransport::ReservedIdentifier(data) => transport_to_node_reserved_identifier(data),
        AnyTransport::StatementIdentifier(data) => transport_to_node_statement_identifier(data),
        AnyTransport::_StringDouble(data) => transport_to_node__string_double(data),
        AnyTransport::StringFragment(data) => transport_to_node_string_fragment(data),
        AnyTransport::_StringSingle(data) => transport_to_node__string_single(data),
        AnyTransport::ThisType(data) => transport_to_node_this_type(data),
        AnyTransport::TypeIdentifier(data) => transport_to_node_type_identifier(data),
        AnyTransport::TypeQueryCallExpression(data) => transport_to_node_type_query_call_expression(data),
        AnyTransport::TypeQueryCallExpressionInTypeAnnotation(data) => transport_to_node_type_query_call_expression_in_type_annotation(data),
        AnyTransport::TypeQueryInstantiationExpression(data) => transport_to_node_type_query_instantiation_expression(data),
        AnyTransport::TypeQueryMemberExpression(data) => transport_to_node_type_query_member_expression(data),
        AnyTransport::TypeQueryMemberExpressionInTypeAnnotation(data) => transport_to_node_type_query_member_expression_in_type_annotation(data),
        AnyTransport::TypeQuerySubscriptExpression(data) => transport_to_node_type_query_subscript_expression(data),
        AnyTransport::UpdateExpressionPostfix(data) => transport_to_node_update_expression_postfix(data),
        AnyTransport::UpdateExpressionPrefix(data) => transport_to_node_update_expression_prefix(data),
        AnyTransport::AbstractClassDeclaration(data) => transport_to_node_abstract_class_declaration(data),
        AnyTransport::AbstractMethodSignature(data) => transport_to_node_abstract_method_signature(data),
        AnyTransport::AccessibilityModifier(data) => transport_to_node_accessibility_modifier(data),
        AnyTransport::AddingTypeAnnotation(data) => transport_to_node_adding_type_annotation(data),
        AnyTransport::AmbientDeclaration(data) => transport_to_node_ambient_declaration(data),
        AnyTransport::Arguments(data) => transport_to_node_arguments(data),
        AnyTransport::Array(data) => transport_to_node_array(data),
        AnyTransport::ArrayPattern(data) => transport_to_node_array_pattern(data),
        AnyTransport::ArrayType(data) => transport_to_node_array_type(data),
        AnyTransport::ArrowFunctionParameter(data) => transport_to_node_arrow_function_parameter(data),
        AnyTransport::ArrowFunctionUCallSignature(data) => transport_to_node_arrow_function_ucall_signature(data),
        AnyTransport::ArrowFunction(data) => transport_to_node_arrow_function(data),
        AnyTransport::AsExpression(data) => transport_to_node_as_expression(data),
        AnyTransport::Asserts(data) => transport_to_node_asserts(data),
        AnyTransport::AssertsAnnotation(data) => transport_to_node_asserts_annotation(data),
        AnyTransport::AssignmentExpression(data) => transport_to_node_assignment_expression(data),
        AnyTransport::AssignmentPattern(data) => transport_to_node_assignment_pattern(data),
        AnyTransport::AugmentedAssignmentExpression(data) => transport_to_node_augmented_assignment_expression(data),
        AnyTransport::AwaitExpression(data) => transport_to_node_await_expression(data),
        AnyTransport::BinaryExpression(data) => transport_to_node_binary_expression(data),
        AnyTransport::BreakStatement(data) => transport_to_node_break_statement(data),
        AnyTransport::CallExpression(data) => transport_to_node_call_expression(data),
        AnyTransport::CallSignature(data) => transport_to_node_call_signature(data),
        AnyTransport::CatchClause(data) => transport_to_node_catch_clause(data),
        AnyTransport::Class(data) => transport_to_node_class(data),
        AnyTransport::ClassBody(data) => transport_to_node_class_body(data),
        AnyTransport::ClassDeclaration(data) => transport_to_node_class_declaration(data),
        AnyTransport::ClassHeritageExtendsClause(data) => transport_to_node_class_heritage_extends_clause(data),
        AnyTransport::ClassHeritageImplementsClause(data) => transport_to_node_class_heritage_implements_clause(data),
        AnyTransport::ClassHeritage(data) => transport_to_node_class_heritage(data),
        AnyTransport::ClassStaticBlock(data) => transport_to_node_class_static_block(data),
        AnyTransport::Comment(data) => transport_to_node_comment(data),
        AnyTransport::ComputedPropertyName(data) => transport_to_node_computed_property_name(data),
        AnyTransport::ConditionalType(data) => transport_to_node_conditional_type(data),
        AnyTransport::Constraint(data) => transport_to_node_constraint(data),
        AnyTransport::ConstructSignature(data) => transport_to_node_construct_signature(data),
        AnyTransport::ConstructorType(data) => transport_to_node_constructor_type(data),
        AnyTransport::ContinueStatement(data) => transport_to_node_continue_statement(data),
        AnyTransport::DebuggerStatement(data) => transport_to_node_debugger_statement(data),
        AnyTransport::Decorator(data) => transport_to_node_decorator(data),
        AnyTransport::DecoratorCallExpression(data) => transport_to_node_decorator_call_expression(data),
        AnyTransport::DecoratorMemberExpression(data) => transport_to_node_decorator_member_expression(data),
        AnyTransport::DecoratorParenthesizedExpression(data) => transport_to_node_decorator_parenthesized_expression(data),
        AnyTransport::DefaultType(data) => transport_to_node_default_type(data),
        AnyTransport::DoStatement(data) => transport_to_node_do_statement(data),
        AnyTransport::ElseClause(data) => transport_to_node_else_clause(data),
        AnyTransport::EmptyStatement(data) => transport_to_node_empty_statement(data),
        AnyTransport::EnumAssignment(data) => transport_to_node_enum_assignment(data),
        AnyTransport::EnumBody(data) => transport_to_node_enum_body(data),
        AnyTransport::EnumDeclaration(data) => transport_to_node_enum_declaration(data),
        AnyTransport::EscapeSequence(data) => transport_to_node_escape_sequence(data),
        AnyTransport::ExistentialType(data) => transport_to_node_existential_type(data),
        AnyTransport::ExportClause(data) => transport_to_node_export_clause(data),
        AnyTransport::ExportSpecifier(data) => transport_to_node_export_specifier(data),
        AnyTransport::ExportStatementTypeExport(data) => transport_to_node_export_statement_type_export(data),
        AnyTransport::ExportStatementEqualsExport(data) => transport_to_node_export_statement_equals_export(data),
        AnyTransport::ExportStatementNamespaceExport(data) => transport_to_node_export_statement_namespace_export(data),
        AnyTransport::ExportStatement(data) => transport_to_node_export_statement(data),
        AnyTransport::ExpressionStatement(data) => transport_to_node_expression_statement(data),
        AnyTransport::ExtendsClause(data) => transport_to_node_extends_clause(data),
        AnyTransport::ExtendsTypeClause(data) => transport_to_node_extends_type_clause(data),
        AnyTransport::False(data) => transport_to_node_false(data),
        AnyTransport::FieldDefinition(data) => transport_to_node_field_definition(data),
        AnyTransport::FinallyClause(data) => transport_to_node_finally_clause(data),
        AnyTransport::FlowMaybeType(data) => transport_to_node_flow_maybe_type(data),
        AnyTransport::ForInStatement(data) => transport_to_node_for_in_statement(data),
        AnyTransport::ForStatement(data) => transport_to_node_for_statement(data),
        AnyTransport::FormalParameters(data) => transport_to_node_formal_parameters(data),
        AnyTransport::FunctionDeclaration(data) => transport_to_node_function_declaration(data),
        AnyTransport::FunctionExpression(data) => transport_to_node_function_expression(data),
        AnyTransport::FunctionSignature(data) => transport_to_node_function_signature(data),
        AnyTransport::FunctionType(data) => transport_to_node_function_type(data),
        AnyTransport::GeneratorFunction(data) => transport_to_node_generator_function(data),
        AnyTransport::GeneratorFunctionDeclaration(data) => transport_to_node_generator_function_declaration(data),
        AnyTransport::GenericType(data) => transport_to_node_generic_type(data),
        AnyTransport::HashBangLine(data) => transport_to_node_hash_bang_line(data),
        AnyTransport::HtmlCharacterReference(data) => transport_to_node_html_character_reference(data),
        AnyTransport::Identifier(data) => transport_to_node_identifier(data),
        AnyTransport::IfStatement(data) => transport_to_node_if_statement(data),
        AnyTransport::ImplementsClause(data) => transport_to_node_implements_clause(data),
        AnyTransport::Import(data) => transport_to_node_import(data),
        AnyTransport::ImportAlias(data) => transport_to_node_import_alias(data),
        AnyTransport::ImportAttribute(data) => transport_to_node_import_attribute(data),
        AnyTransport::ImportClauseNamespaceImport(data) => transport_to_node_import_clause_namespace_import(data),
        AnyTransport::ImportClauseNamedImports(data) => transport_to_node_import_clause_named_imports(data),
        AnyTransport::ImportClauseDefaultImport(data) => transport_to_node_import_clause_default_import(data),
        AnyTransport::ImportClause(data) => transport_to_node_import_clause(data),
        AnyTransport::ImportRequireClause(data) => transport_to_node_import_require_clause(data),
        AnyTransport::ImportSpecifierName(data) => transport_to_node_import_specifier_name(data),
        AnyTransport::ImportSpecifier(data) => transport_to_node_import_specifier(data),
        AnyTransport::ImportStatement(data) => transport_to_node_import_statement(data),
        AnyTransport::IndexSignatureMappedTypeClause(data) => transport_to_node_index_signature_mapped_type_clause(data),
        AnyTransport::IndexSignature(data) => transport_to_node_index_signature(data),
        AnyTransport::IndexTypeQuery(data) => transport_to_node_index_type_query(data),
        AnyTransport::InferType(data) => transport_to_node_infer_type(data),
        AnyTransport::InstantiationExpression(data) => transport_to_node_instantiation_expression(data),
        AnyTransport::InterfaceDeclaration(data) => transport_to_node_interface_declaration(data),
        AnyTransport::InternalModule(data) => transport_to_node_internal_module(data),
        AnyTransport::IntersectionType(data) => transport_to_node_intersection_type(data),
        AnyTransport::JsxAttribute(data) => transport_to_node_jsx_attribute(data),
        AnyTransport::JsxClosingElement(data) => transport_to_node_jsx_closing_element(data),
        AnyTransport::JsxElement(data) => transport_to_node_jsx_element(data),
        AnyTransport::JsxExpression(data) => transport_to_node_jsx_expression(data),
        AnyTransport::JsxIdentifier(data) => transport_to_node_jsx_identifier(data),
        AnyTransport::JsxNamespaceName(data) => transport_to_node_jsx_namespace_name(data),
        AnyTransport::JsxOpeningElement(data) => transport_to_node_jsx_opening_element(data),
        AnyTransport::JsxSelfClosingElement(data) => transport_to_node_jsx_self_closing_element(data),
        AnyTransport::LabeledStatement(data) => transport_to_node_labeled_statement(data),
        AnyTransport::LexicalDeclaration(data) => transport_to_node_lexical_declaration(data),
        AnyTransport::LiteralType(data) => transport_to_node_literal_type(data),
        AnyTransport::LookupType(data) => transport_to_node_lookup_type(data),
        AnyTransport::MappedTypeClause(data) => transport_to_node_mapped_type_clause(data),
        AnyTransport::MemberExpression(data) => transport_to_node_member_expression(data),
        AnyTransport::MetaProperty(data) => transport_to_node_meta_property(data),
        AnyTransport::MethodDefinition(data) => transport_to_node_method_definition(data),
        AnyTransport::MethodSignature(data) => transport_to_node_method_signature(data),
        AnyTransport::Module(data) => transport_to_node_module(data),
        AnyTransport::NamedImports(data) => transport_to_node_named_imports(data),
        AnyTransport::NamespaceExport(data) => transport_to_node_namespace_export(data),
        AnyTransport::NamespaceImport(data) => transport_to_node_namespace_import(data),
        AnyTransport::NestedIdentifier(data) => transport_to_node_nested_identifier(data),
        AnyTransport::NestedTypeIdentifier(data) => transport_to_node_nested_type_identifier(data),
        AnyTransport::NewExpression(data) => transport_to_node_new_expression(data),
        AnyTransport::NonNullExpression(data) => transport_to_node_non_null_expression(data),
        AnyTransport::Null(data) => transport_to_node_null(data),
        AnyTransport::Number(data) => transport_to_node_number(data),
        AnyTransport::Object(data) => transport_to_node_object(data),
        AnyTransport::ObjectAssignmentPattern(data) => transport_to_node_object_assignment_pattern(data),
        AnyTransport::ObjectPattern(data) => transport_to_node_object_pattern(data),
        AnyTransport::ObjectType(data) => transport_to_node_object_type(data),
        AnyTransport::OmittingTypeAnnotation(data) => transport_to_node_omitting_type_annotation(data),
        AnyTransport::OptingTypeAnnotation(data) => transport_to_node_opting_type_annotation(data),
        AnyTransport::OptionalChain(data) => transport_to_node_optional_chain(data),
        AnyTransport::OptionalParameter(data) => transport_to_node_optional_parameter(data),
        AnyTransport::OptionalTupleParameter(data) => transport_to_node_optional_tuple_parameter(data),
        AnyTransport::OptionalType(data) => transport_to_node_optional_type(data),
        AnyTransport::OverrideModifier(data) => transport_to_node_override_modifier(data),
        AnyTransport::Pair(data) => transport_to_node_pair(data),
        AnyTransport::PairPattern(data) => transport_to_node_pair_pattern(data),
        AnyTransport::ParenthesizedExpressionSequence(data) => transport_to_node_parenthesized_expression_sequence(data),
        AnyTransport::ParenthesizedExpression(data) => transport_to_node_parenthesized_expression(data),
        AnyTransport::ParenthesizedType(data) => transport_to_node_parenthesized_type(data),
        AnyTransport::PredefinedType(data) => transport_to_node_predefined_type(data),
        AnyTransport::PrivatePropertyIdentifier(data) => transport_to_node_private_property_identifier(data),
        AnyTransport::Program(data) => transport_to_node_program(data),
        AnyTransport::PropertySignature(data) => transport_to_node_property_signature(data),
        AnyTransport::PublicFieldDefinition(data) => transport_to_node_public_field_definition(data),
        AnyTransport::ReadonlyType(data) => transport_to_node_readonly_type(data),
        AnyTransport::Regex(data) => transport_to_node_regex(data),
        AnyTransport::RegexFlags(data) => transport_to_node_regex_flags(data),
        AnyTransport::RegexPattern(data) => transport_to_node_regex_pattern(data),
        AnyTransport::RequiredParameter(data) => transport_to_node_required_parameter(data),
        AnyTransport::RestPattern(data) => transport_to_node_rest_pattern(data),
        AnyTransport::RestType(data) => transport_to_node_rest_type(data),
        AnyTransport::ReturnStatement(data) => transport_to_node_return_statement(data),
        AnyTransport::SatisfiesExpression(data) => transport_to_node_satisfies_expression(data),
        AnyTransport::SequenceExpression(data) => transport_to_node_sequence_expression(data),
        AnyTransport::SpreadElement(data) => transport_to_node_spread_element(data),
        AnyTransport::StatementBlock(data) => transport_to_node_statement_block(data),
        AnyTransport::StringDouble(data) => transport_to_node_string_double(data),
        AnyTransport::StringSingle(data) => transport_to_node_string_single(data),
        AnyTransport::String(data) => transport_to_node_string(data),
        AnyTransport::SubscriptExpression(data) => transport_to_node_subscript_expression(data),
        AnyTransport::Super(data) => transport_to_node_super(data),
        AnyTransport::SwitchBody(data) => transport_to_node_switch_body(data),
        AnyTransport::SwitchCase(data) => transport_to_node_switch_case(data),
        AnyTransport::SwitchDefault(data) => transport_to_node_switch_default(data),
        AnyTransport::SwitchStatement(data) => transport_to_node_switch_statement(data),
        AnyTransport::TemplateLiteralType(data) => transport_to_node_template_literal_type(data),
        AnyTransport::TemplateString(data) => transport_to_node_template_string(data),
        AnyTransport::TemplateSubstitution(data) => transport_to_node_template_substitution(data),
        AnyTransport::TemplateType(data) => transport_to_node_template_type(data),
        AnyTransport::TernaryExpression(data) => transport_to_node_ternary_expression(data),
        AnyTransport::This(data) => transport_to_node_this(data),
        AnyTransport::ThrowStatement(data) => transport_to_node_throw_statement(data),
        AnyTransport::True(data) => transport_to_node_true(data),
        AnyTransport::TryStatement(data) => transport_to_node_try_statement(data),
        AnyTransport::TupleParameter(data) => transport_to_node_tuple_parameter(data),
        AnyTransport::TupleType(data) => transport_to_node_tuple_type(data),
        AnyTransport::TypeAliasDeclaration(data) => transport_to_node_type_alias_declaration(data),
        AnyTransport::TypeAnnotation(data) => transport_to_node_type_annotation(data),
        AnyTransport::TypeArguments(data) => transport_to_node_type_arguments(data),
        AnyTransport::TypeAssertion(data) => transport_to_node_type_assertion(data),
        AnyTransport::TypeParameter(data) => transport_to_node_type_parameter(data),
        AnyTransport::TypeParameters(data) => transport_to_node_type_parameters(data),
        AnyTransport::TypePredicate(data) => transport_to_node_type_predicate(data),
        AnyTransport::TypePredicateAnnotation(data) => transport_to_node_type_predicate_annotation(data),
        AnyTransport::TypeQuery(data) => transport_to_node_type_query(data),
        AnyTransport::UnaryExpression(data) => transport_to_node_unary_expression(data),
        AnyTransport::Undefined(data) => transport_to_node_undefined(data),
        AnyTransport::UnescapedDoubleJsxStringFragment(data) => transport_to_node_unescaped_double_jsx_string_fragment(data),
        AnyTransport::UnescapedDoubleStringFragment(data) => transport_to_node_unescaped_double_string_fragment(data),
        AnyTransport::UnescapedSingleJsxStringFragment(data) => transport_to_node_unescaped_single_jsx_string_fragment(data),
        AnyTransport::UnescapedSingleStringFragment(data) => transport_to_node_unescaped_single_string_fragment(data),
        AnyTransport::UnionType(data) => transport_to_node_union_type(data),
        AnyTransport::UpdateExpression(data) => transport_to_node_update_expression(data),
        AnyTransport::VariableDeclaration(data) => transport_to_node_variable_declaration(data),
        AnyTransport::VariableDeclarator(data) => transport_to_node_variable_declarator(data),
        AnyTransport::WhileStatement(data) => transport_to_node_while_statement(data),
        AnyTransport::WithStatement(data) => transport_to_node_with_statement(data),
        AnyTransport::YieldExpression(data) => transport_to_node_yield_expression(data),
        AnyTransport::AutomaticSemicolon(data) => transport_to_node_automatic_semicolon(data),
        AnyTransport::TemplateChars(data) => transport_to_node_template_chars(data),
        AnyTransport::TernaryQmark(data) => transport_to_node_ternary_qmark(data),
        AnyTransport::HtmlComment(data) => transport_to_node_html_comment(data),
        AnyTransport::Oror(data) => transport_to_node_oror(data),
        AnyTransport::JsxText(data) => transport_to_node_jsx_text(data),
        AnyTransport::FunctionSignatureAutomaticSemicolon(data) => transport_to_node_function_signature_automatic_semicolon(data),
        AnyTransport::ErrorRecovery(data) => transport_to_node_error_recovery(data),
        AnyTransport::TokQDot(data) => transport_to_node_tok_qdot(data),
        AnyTransport::Comma(data) => transport_to_node_comma(data),
        AnyTransport::Export(data) => transport_to_node_export(data),
        AnyTransport::Default(data) => transport_to_node_default(data),
        AnyTransport::Star(data) => transport_to_node_star(data),
        AnyTransport::Eq(data) => transport_to_node_eq(data),
        AnyTransport::As(data) => transport_to_node_as(data),
        AnyTransport::Namespace(data) => transport_to_node_namespace(data),
        AnyTransport::Paren(data) => transport_to_node_paren(data),
        AnyTransport::CloseParen(data) => transport_to_node_close_paren(data),
        AnyTransport::Var(data) => transport_to_node_var(data),
        AnyTransport::From(data) => transport_to_node_from(data),
        AnyTransport::Colon(data) => transport_to_node_colon(data),
        AnyTransport::Lt(data) => transport_to_node_lt(data),
        AnyTransport::TokDq(data) => transport_to_node_tok_dq(data),
        AnyTransport::TokSq(data) => transport_to_node_tok_sq(data),
        AnyTransport::Abstract(data) => transport_to_node_abstract(data),
        AnyTransport::Async(data) => transport_to_node_async(data),
        AnyTransport::Const(data) => transport_to_node_const(data),
        AnyTransport::Question(data) => transport_to_node_question(data),
        AnyTransport::Readonly(data) => transport_to_node_readonly(data),
        AnyTransport::Static(data) => transport_to_node_static(data),
        AnyTransport::Declare(data) => transport_to_node_declare(data),
        AnyTransport::Accessor(data) => transport_to_node_accessor(data),
        AnyTransport::Dot(data) => transport_to_node_dot(data),
        AnyTransport::Bracket(data) => transport_to_node_bracket(data),
        AnyTransport::CloseBracket(data) => transport_to_node_close_bracket(data),
        AnyTransport::TokPlusQColon(data) => transport_to_node_tok_plus_qcolon(data),
        AnyTransport::Global(data) => transport_to_node_global(data),
        AnyTransport::Using(data) => transport_to_node_using(data),
        AnyTransport::Await(data) => transport_to_node_await(data),
        AnyTransport::Andand(data) => transport_to_node_andand(data),
        AnyTransport::Shr(data) => transport_to_node_shr(data),
        AnyTransport::TokGtGtGt(data) => transport_to_node_tok_gt_gt_gt(data),
        AnyTransport::Shl(data) => transport_to_node_shl(data),
        AnyTransport::Amp(data) => transport_to_node_amp(data),
        AnyTransport::Caret(data) => transport_to_node_caret(data),
        AnyTransport::Pipe(data) => transport_to_node_pipe(data),
        AnyTransport::Plus(data) => transport_to_node_plus(data),
        AnyTransport::Minus(data) => transport_to_node_minus(data),
        AnyTransport::Slash(data) => transport_to_node_slash(data),
        AnyTransport::Percent(data) => transport_to_node_percent(data),
        AnyTransport::Starstar(data) => transport_to_node_starstar(data),
        AnyTransport::Le(data) => transport_to_node_le(data),
        AnyTransport::Eqeq(data) => transport_to_node_eqeq(data),
        AnyTransport::TokEqEqEq(data) => transport_to_node_tok_eq_eq_eq(data),
        AnyTransport::Neq(data) => transport_to_node_neq(data),
        AnyTransport::TokBangEqEq(data) => transport_to_node_tok_bang_eq_eq(data),
        AnyTransport::Ge(data) => transport_to_node_ge(data),
        AnyTransport::Gt(data) => transport_to_node_gt(data),
        AnyTransport::TokQQ(data) => transport_to_node_tok_qq(data),
        AnyTransport::Instanceof(data) => transport_to_node_instanceof(data),
        AnyTransport::In(data) => transport_to_node_in(data),
        AnyTransport::Break(data) => transport_to_node_break(data),
        AnyTransport::Catch(data) => transport_to_node_catch(data),
        AnyTransport::Brace(data) => transport_to_node_brace(data),
        AnyTransport::Semi(data) => transport_to_node_semi(data),
        AnyTransport::CloseBrace(data) => transport_to_node_close_brace(data),
        AnyTransport::Extends(data) => transport_to_node_extends(data),
        AnyTransport::New(data) => transport_to_node_new(data),
        AnyTransport::FatArrow(data) => transport_to_node_fat_arrow(data),
        AnyTransport::Continue(data) => transport_to_node_continue(data),
        AnyTransport::Debugger(data) => transport_to_node_debugger(data),
        AnyTransport::At(data) => transport_to_node_at(data),
        AnyTransport::Do(data) => transport_to_node_do(data),
        AnyTransport::While(data) => transport_to_node_while(data),
        AnyTransport::Else(data) => transport_to_node_else(data),
        AnyTransport::Enum(data) => transport_to_node_enum(data),
        AnyTransport::Finally(data) => transport_to_node_finally(data),
        AnyTransport::For(data) => transport_to_node_for(data),
        AnyTransport::Function(data) => transport_to_node_function(data),
        AnyTransport::If(data) => transport_to_node_if(data),
        AnyTransport::Implements(data) => transport_to_node_implements(data),
        AnyTransport::Require(data) => transport_to_node_require(data),
        AnyTransport::Keyof(data) => transport_to_node_keyof(data),
        AnyTransport::Infer(data) => transport_to_node_infer(data),
        AnyTransport::Interface(data) => transport_to_node_interface(data),
        AnyTransport::TokLtSlash(data) => transport_to_node_tok_lt_slash(data),
        AnyTransport::TokSlashGt(data) => transport_to_node_tok_slash_gt(data),
        AnyTransport::Bang(data) => transport_to_node_bang(data),
        AnyTransport::TokMinusQColon(data) => transport_to_node_tok_minus_qcolon(data),
        AnyTransport::TokQColon(data) => transport_to_node_tok_qcolon(data),
        AnyTransport::Override(data) => transport_to_node_override(data),
        AnyTransport::Ellipsis(data) => transport_to_node_ellipsis(data),
        AnyTransport::Return(data) => transport_to_node_return(data),
        AnyTransport::Satisfies(data) => transport_to_node_satisfies(data),
        AnyTransport::Case(data) => transport_to_node_case(data),
        AnyTransport::Switch(data) => transport_to_node_switch(data),
        AnyTransport::TokBt(data) => transport_to_node_tok_bt(data),
        AnyTransport::TokDollarLbr(data) => transport_to_node_tok_dollar_lbr(data),
        AnyTransport::Throw(data) => transport_to_node_throw(data),
        AnyTransport::Try(data) => transport_to_node_try(data),
        AnyTransport::Is(data) => transport_to_node_is(data),
        AnyTransport::Typeof(data) => transport_to_node_typeof(data),
        AnyTransport::With(data) => transport_to_node_with(data),
        AnyTransport::Yield(data) => transport_to_node_yield(data),
        AnyTransport::Literal0_6f_66(data) => literal_transport_to_node("of", data),
        AnyTransport::Literal1_6c_65_74(data) => literal_transport_to_node("let", data),
        AnyTransport::Literal2_2b_2b(data) => literal_transport_to_node("++", data),
        AnyTransport::Literal3_2d_2d(data) => literal_transport_to_node("--", data),
        AnyTransport::Literal4_67_65_74(data) => literal_transport_to_node("get", data),
        AnyTransport::Literal5_73_65_74(data) => literal_transport_to_node("set", data),
        AnyTransport::Literal6_2b_3d(data) => literal_transport_to_node("+=", data),
        AnyTransport::Literal7_2d_3d(data) => literal_transport_to_node("-=", data),
        AnyTransport::Literal8_2a_3d(data) => literal_transport_to_node("*=", data),
        AnyTransport::Literal9_2f_3d(data) => literal_transport_to_node("/=", data),
        AnyTransport::Literal10_25_3d(data) => literal_transport_to_node("%=", data),
        AnyTransport::Literal11_5e_3d(data) => literal_transport_to_node("^=", data),
        AnyTransport::Literal12_26_3d(data) => literal_transport_to_node("&=", data),
        AnyTransport::Literal13_7c_3d(data) => literal_transport_to_node("|=", data),
        AnyTransport::Literal14_3e_3e_3d(data) => literal_transport_to_node(">>=", data),
        AnyTransport::Literal15_3e_3e_3e_3d(data) => literal_transport_to_node(">>>=", data),
        AnyTransport::Literal16_3c_3c_3d(data) => literal_transport_to_node("<<=", data),
        AnyTransport::Literal17_2a_2a_3d(data) => literal_transport_to_node("**=", data),
        AnyTransport::Literal18_26_26_3d(data) => literal_transport_to_node("&&=", data),
        AnyTransport::Literal19_7c_7c_3d(data) => literal_transport_to_node("||=", data),
        AnyTransport::Literal20_3f_3f_3d(data) => literal_transport_to_node("??=", data),
        AnyTransport::Literal21_74_79_70_65(data) => literal_transport_to_node("type", data),
        AnyTransport::Literal22_61_73_73_65_72_74(data) => literal_transport_to_node("assert", data),
        AnyTransport::Literal23_7b_7c(data) => literal_transport_to_node("{|", data),
        AnyTransport::Literal24_7c_7d(data) => literal_transport_to_node("|}", data),
        AnyTransport::Literal25_7e(data) => literal_transport_to_node("~", data),
        AnyTransport::Literal26_76_6f_69_64(data) => literal_transport_to_node("void", data),
        AnyTransport::Literal27_64_65_6c_65_74_65(data) => literal_transport_to_node("delete", data),
    }
}

fn transport_to_node__arrow_function_ucall_signature(transport: _ArrowFunctionUCallSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_arrow_function__call_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__arrow_function_parameter(transport: _ArrowFunctionParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("parameter".to_string(), transport_field_value(transport.parameter)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_arrow_function_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression_call(transport: CallExpressionCallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_call_expression_call",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression_member(transport: CallExpressionMemberTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_call_expression_member",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression_template_call(transport: CallExpressionTemplateCallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_call_expression_template_call",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__call_signature(transport: _CallSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_call_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_body_member(transport: ClassBodyMemberTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_class_body_member",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_body_method(transport: ClassBodyMethodTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_class_body_method",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_body_method_sig(transport: ClassBodyMethodSigTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_class_body_method_sig",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__class_heritage_extends_clause(transport: _ClassHeritageExtendsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_class_heritage_extends_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__class_heritage_implements_clause(transport: _ClassHeritageImplementsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_class_heritage_implements_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_decl_arm(transport: ExportStatementDefaultDeclArmTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_decl_arm",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_decl_arm_default_kw(transport: ExportStatementDefaultDeclArmDefaultKwTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_decl_arm_default_kw",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_decl_arm_default_kw_value(transport: ExportStatementDefaultDeclArmDefaultKwValueTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_decl_arm_default_kw_value",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_from_arm(transport: ExportStatementDefaultFromArmTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_from_arm",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_from_arm_clause_from(transport: ExportStatementDefaultFromArmClauseFromTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("source".to_string(), transport_field_value(transport.source)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_from_arm_clause_from",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_from_arm_ns_from(transport: ExportStatementDefaultFromArmNsFromTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("source".to_string(), transport_field_value(transport.source)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_default_from_arm_ns_from",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_default_from_arm_star_from(transport: ExportStatementDefaultFromArmStarFromTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("source".to_string(), transport_field_value(transport.source)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_export_statement_default_from_arm_star_from",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__export_statement_equals_export(transport: _ExportStatementEqualsExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_equals_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__export_statement_namespace_export(transport: _ExportStatementNamespaceExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_namespace_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__export_statement_type_export(transport: _ExportStatementTypeExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.source {
        fields.insert("source".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_export_statement_type_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_extends_clause_single(transport: ExtendsClauseSingleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_extends_clause_single",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_header(transport: ForHeaderTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_for_header",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_header_let_const_kind(transport: ForHeaderLetConstKindTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("kind".to_string(), transport_field_value(transport.kind)?);
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "_for_header_let_const_kind",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_header_lhs(transport: ForHeaderLhsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_for_header_lhs",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_header_var_kind(transport: ForHeaderVarKindTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("kind".to_string(), transport_field_value(transport.kind)?);
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "_for_header_var_kind",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_from_clause(transport: FromClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("source".to_string(), transport_field_value(transport.source)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_from_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__import_clause_default_import(transport: _ImportClauseDefaultImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_import_clause_default_import",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__import_clause_named_imports(transport: _ImportClauseNamedImportsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_import_clause_named_imports",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__import_clause_namespace_import(transport: _ImportClauseNamespaceImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_import_clause_namespace_import",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_specifier_as(transport: ImportSpecifierAsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("alias".to_string(), transport_field_value(transport.alias)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_import_specifier_as",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__import_specifier_name(transport: _ImportSpecifierNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_import_specifier_name",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_index_signature_colon(transport: IndexSignatureColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("index_type".to_string(), transport_field_value(transport.index_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_index_signature_colon",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__index_signature_mapped_type_clause(transport: _IndexSignatureMappedTypeClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_index_signature_mapped_type_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_initializer(transport: InitializerTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_initializer",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_interface_body(transport: InterfaceBodyTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_interface_body",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_start_opening_element(transport: JsxStartOpeningElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("attribute".to_string(), transport_field_values(transport.attribute)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_jsx_start_opening_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_string(transport: JsxStringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_jsx_string",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_kw_abstract_marker(transport: KwAbstractMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_abstract_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_kw_async_marker(transport: KwAsyncMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_async_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_kw_const_marker(transport: KwConstMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_const_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_kw_optional_marker(transport: KwOptionalMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_optional_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_kw_readonly_marker(transport: KwReadonlyMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_readonly_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_kw_static_marker(transport: KwStaticMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_kw_static_marker",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_lhs_expression(transport: LhsExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_lhs_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__module(transport: _ModuleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.body {
        fields.insert("body".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_module",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__number(transport: _NumberTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_number",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parameter_name(transport: ParameterNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("pattern".to_string(), transport_field_value(transport.pattern)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "_parameter_name",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__parenthesized_expression_sequence(transport: _ParenthesizedExpressionSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_parenthesized_expression_sequence",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_expression_typed(transport: ParenthesizedExpressionTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_parenthesized_expression_typed",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_property_identifier(transport: PropertyIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_property_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_abstract_first(transport: PublicFieldDefinitionAbstractFirstTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("abstract_marker".to_string(), transport_field_value(transport.abstract_marker)?);
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_public_field_definition_abstract_first",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_access_first(transport: PublicFieldDefinitionAccessFirstTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.declare_marker {
        fields.insert("declare_marker".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_public_field_definition_access_first",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_accessor_opt(transport: PublicFieldDefinitionAccessorOptTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("accessor_marker".to_string(), transport_field_value(transport.accessor_marker)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_public_field_definition_accessor_opt",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_declare_first(transport: PublicFieldDefinitionDeclareFirstTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "_public_field_definition_declare_first",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_readonly_first(transport: PublicFieldDefinitionReadonlyFirstTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("readonly_marker".to_string(), transport_field_value(transport.readonly_marker)?);
    if let Some(value) = transport.abstract_marker {
        fields.insert("abstract_marker".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_public_field_definition_readonly_first",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition_static_mods(transport: PublicFieldDefinitionStaticModsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("static_marker".to_string(), transport_field_value(transport.static_marker)?);
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "_public_field_definition_static_mods",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_reserved_identifier(transport: ReservedIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_reserved_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_statement_identifier(transport: StatementIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_statement_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__string_double(transport: _StringDoubleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_string_double",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_string_fragment(transport: StringFragmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_string_fragment",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node__string_single(transport: _StringSingleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_string_single",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_this_type(transport: ThisTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_this_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_identifier(transport: TypeIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_type_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_call_expression(transport: TypeQueryCallExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_call_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_call_expression_in_type_annotation(transport: TypeQueryCallExpressionInTypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_call_expression_in_type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_instantiation_expression(transport: TypeQueryInstantiationExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    fields.insert("type_arguments".to_string(), transport_field_value(transport.type_arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_instantiation_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_member_expression(transport: TypeQueryMemberExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_member_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_member_expression_in_type_annotation(transport: TypeQueryMemberExpressionInTypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_member_expression_in_type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query_subscript_expression(transport: TypeQuerySubscriptExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("index".to_string(), transport_field_value(transport.index)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_type_query_subscript_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_update_expression_postfix(transport: UpdateExpressionPostfixTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_update_expression_postfix",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_update_expression_prefix(transport: UpdateExpressionPrefixTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_update_expression_prefix",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_abstract_class_declaration(transport: AbstractClassDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.class_heritage {
        fields.insert("class_heritage".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "abstract_class_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_abstract_method_signature(transport: AbstractMethodSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.accessibility_modifier {
        fields.insert("accessibility_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.override_modifier {
        fields.insert("override_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.accessor_kind {
        fields.insert("accessor_kind".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.optional_marker {
        fields.insert("optional_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "abstract_method_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_accessibility_modifier(transport: AccessibilityModifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "accessibility_modifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_adding_type_annotation(transport: AddingTypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "adding_type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_ambient_declaration(transport: AmbientDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("declaration".to_string(), transport_field_value(transport.declaration)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "ambient_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_arguments(transport: ArgumentsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "arguments",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_array(transport: ArrayTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "array",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_array_pattern(transport: ArrayPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "array_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_array_type(transport: ArrayTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_type".to_string(), transport_field_value(transport.primary_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "array_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_arrow_function_parameter(transport: ArrowFunctionParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("parameter".to_string(), transport_field_value(transport.parameter)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "arrow_function_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_arrow_function_ucall_signature(transport: ArrowFunctionUCallSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "arrow_function__call_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_arrow_function(transport: ArrowFunctionTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ArrowFunctionTransport::ArrowFunctionUFormParameter(data) => transport_to_node_arrow_function_uform_parameter(data),
        ArrowFunctionTransport::ArrowFunctionUFormUCallSignature(data) => transport_to_node_arrow_function_uform_ucall_signature(data),
    }
}

fn transport_to_node_arrow_function_uform_parameter(transport: ArrowFunctionUFormParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "arrow_function",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_arrow_function_uform_ucall_signature(transport: ArrowFunctionUFormUCallSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "arrow_function",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_as_expression(transport: AsExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    fields.insert("type_annotation".to_string(), transport_field_value(transport.type_annotation)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "as_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_asserts(transport: AssertsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "asserts",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_asserts_annotation(transport: AssertsAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("asserts".to_string(), transport_field_value(transport.asserts)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "asserts_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_assignment_expression(transport: AssignmentExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.using_marker {
        fields.insert("using_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "assignment_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_assignment_pattern(transport: AssignmentPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "assignment_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_augmented_assignment_expression(transport: AugmentedAssignmentExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "augmented_assignment_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_await_expression(transport: AwaitExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "await_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_binary_expression(transport: BinaryExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "binary_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_break_statement(transport: BreakStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.label {
        fields.insert("label".to_string(), transport_field_value(value)?);
    }
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "break_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression(transport: CallExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        CallExpressionTransport::CallExpressionUFormCall(data) => transport_to_node_call_expression_uform_call(data),
        CallExpressionTransport::CallExpressionUFormTemplateCall(data) => transport_to_node_call_expression_uform_template_call(data),
        CallExpressionTransport::CallExpressionUFormMember(data) => transport_to_node_call_expression_uform_member(data),
    }
}

fn transport_to_node_call_expression_uform_call(transport: CallExpressionUFormCallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "call_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression_uform_template_call(transport: CallExpressionUFormTemplateCallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "call_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_expression_uform_member(transport: CallExpressionUFormMemberTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "call_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_call_signature(transport: CallSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "call_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_catch_clause(transport: CatchClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.parameter {
        fields.insert("parameter".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "catch_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class(transport: ClassTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.class_heritage {
        fields.insert("class_heritage".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "class",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_body(transport: ClassBodyTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "class_body",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_declaration(transport: ClassDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.class_heritage {
        fields.insert("class_heritage".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    if let Some(value) = transport.automatic_semicolon {
        fields.insert("automatic_semicolon".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "class_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_heritage_extends_clause(transport: ClassHeritageExtendsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "class_heritage_extends_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_heritage_implements_clause(transport: ClassHeritageImplementsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "class_heritage_implements_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_heritage(transport: ClassHeritageTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ClassHeritageTransport::ClassHeritageUFormExtendsClause(data) => transport_to_node_class_heritage_uform_extends_clause(data),
        ClassHeritageTransport::ClassHeritageUFormImplementsClause(data) => transport_to_node_class_heritage_uform_implements_clause(data),
    }
}

fn transport_to_node_class_heritage_uform_extends_clause(transport: ClassHeritageUFormExtendsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "class_heritage",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_heritage_uform_implements_clause(transport: ClassHeritageUFormImplementsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "class_heritage",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_class_static_block(transport: ClassStaticBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "class_static_block",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_comment(transport: CommentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "comment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_computed_property_name(transport: ComputedPropertyNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "computed_property_name",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_conditional_type(transport: ConditionalTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    fields.insert("alternative".to_string(), transport_field_value(transport.alternative)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "conditional_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_constraint(transport: ConstraintTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "constraint",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_construct_signature(transport: ConstructSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.abstract_marker {
        fields.insert("abstract_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "construct_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_constructor_type(transport: ConstructorTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.abstract_marker {
        fields.insert("abstract_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "constructor_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_continue_statement(transport: ContinueStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.label {
        fields.insert("label".to_string(), transport_field_value(value)?);
    }
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "continue_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_debugger_statement(transport: DebuggerStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "debugger_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_decorator(transport: DecoratorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "decorator",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_decorator_call_expression(transport: DecoratorCallExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "decorator_call_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_decorator_member_expression(transport: DecoratorMemberExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "decorator_member_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_decorator_parenthesized_expression(transport: DecoratorParenthesizedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "decorator_parenthesized_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_default_type(transport: DefaultTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "default_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_do_statement(transport: DoStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    if let Some(value) = transport.semicolon {
        fields.insert("semicolon".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "do_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_else_clause(transport: ElseClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("statement".to_string(), transport_field_value(transport.statement)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "else_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_empty_statement(transport: EmptyStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "empty_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_enum_assignment(transport: EnumAssignmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "enum_assignment",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_enum_body(transport: EnumBodyTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "enum_body",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_enum_declaration(transport: EnumDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.const_marker {
        fields.insert("const_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "enum_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_escape_sequence(transport: EscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "escape_sequence",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_existential_type(transport: ExistentialTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "existential_type",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_export_clause(transport: ExportClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_specifier(transport: ExportSpecifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.export_kind {
        fields.insert("export_kind".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.alias {
        fields.insert("alias".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "export_specifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_type_export(transport: ExportStatementTypeExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.source {
        fields.insert("source".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement_type_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_equals_export(transport: ExportStatementEqualsExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement_equals_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_namespace_export(transport: ExportStatementNamespaceExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement_namespace_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement(transport: ExportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ExportStatementTransport::ExportStatementUFormDefault(data) => transport_to_node_export_statement_uform_default(data),
        ExportStatementTransport::ExportStatementUFormTypeExport(data) => transport_to_node_export_statement_uform_type_export(data),
        ExportStatementTransport::ExportStatementUFormEqualsExport(data) => transport_to_node_export_statement_uform_equals_export(data),
        ExportStatementTransport::ExportStatementUFormNamespaceExport(data) => transport_to_node_export_statement_uform_namespace_export(data),
    }
}

fn transport_to_node_export_statement_uform_default(transport: ExportStatementUFormDefaultTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_uform_type_export(transport: ExportStatementUFormTypeExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_uform_equals_export(transport: ExportStatementUFormEqualsExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_export_statement_uform_namespace_export(transport: ExportStatementUFormNamespaceExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "export_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_expression_statement(transport: ExpressionStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "expression_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_extends_clause(transport: ExtendsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_values(transport.value)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "extends_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_extends_type_clause(transport: ExtendsTypeClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_values(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "extends_type_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_false(transport: FalseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "false",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_field_definition(transport: FieldDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    if let Some(value) = transport.static_marker {
        fields.insert("static_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "field_definition",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_finally_clause(transport: FinallyClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "finally_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_flow_maybe_type(transport: FlowMaybeTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_type".to_string(), transport_field_value(transport.primary_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "flow_maybe_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_in_statement(transport: ForInStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.await_marker {
        fields.insert("await_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "for_in_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_for_statement(transport: ForStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("initializer".to_string(), transport_field_value(transport.initializer)?);
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    if let Some(value) = transport.increment {
        fields.insert("increment".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "for_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_formal_parameters(transport: FormalParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "formal_parameters",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_function_declaration(transport: FunctionDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "function_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_function_expression(transport: FunctionExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "function_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_function_signature(transport: FunctionSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "function_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_function_type(transport: FunctionTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    fields.insert("return_type".to_string(), transport_field_value(transport.return_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "function_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_generator_function(transport: GeneratorFunctionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "generator_function",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_generator_function_declaration(transport: GeneratorFunctionDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "generator_function_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_generic_type(transport: GenericTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type_arguments".to_string(), transport_field_value(transport.type_arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "generic_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_hash_bang_line(transport: HashBangLineTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "hash_bang_line",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_html_character_reference(transport: HtmlCharacterReferenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "html_character_reference",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_identifier(transport: IdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_if_statement(transport: IfStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "if_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_implements_clause(transport: ImplementsClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "implements_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import(transport: ImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "import",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_import_alias(transport: ImportAliasTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "import_alias",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_attribute(transport: ImportAttributeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "import_attribute",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause_namespace_import(transport: ImportClauseNamespaceImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause_namespace_import",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause_named_imports(transport: ImportClauseNamedImportsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause_named_imports",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause_default_import(transport: ImportClauseDefaultImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause_default_import",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause(transport: ImportClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ImportClauseTransport::ImportClauseUFormNamespaceImport(data) => transport_to_node_import_clause_uform_namespace_import(data),
        ImportClauseTransport::ImportClauseUFormNamedImports(data) => transport_to_node_import_clause_uform_named_imports(data),
        ImportClauseTransport::ImportClauseUFormDefaultImport(data) => transport_to_node_import_clause_uform_default_import(data),
    }
}

fn transport_to_node_import_clause_uform_namespace_import(transport: ImportClauseUFormNamespaceImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause_uform_named_imports(transport: ImportClauseUFormNamedImportsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_clause_uform_default_import(transport: ImportClauseUFormDefaultImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_require_clause(transport: ImportRequireClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    fields.insert("source".to_string(), transport_field_value(transport.source)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "import_require_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_specifier_name(transport: ImportSpecifierNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "import_specifier_name",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_specifier(transport: ImportSpecifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ImportSpecifierTransport::ImportSpecifierUFormName(data) => transport_to_node_import_specifier_uform_name(data),
        ImportSpecifierTransport::ImportSpecifierUFormAs(data) => transport_to_node_import_specifier_uform_as(data),
    }
}

fn transport_to_node_import_specifier_uform_name(transport: ImportSpecifierUFormNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.import_kind {
        fields.insert("import_kind".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_specifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_specifier_uform_as(transport: ImportSpecifierUFormAsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.import_kind {
        fields.insert("import_kind".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_specifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_import_statement(transport: ImportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.import_clause {
        fields.insert("import_clause".to_string(), transport_field_value(value)?);
    }
    fields.insert("from_clause".to_string(), transport_field_value(transport.from_clause)?);
    if let Some(value) = transport.import_attribute {
        fields.insert("import_attribute".to_string(), transport_field_value(value)?);
    }
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "import_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_index_signature_mapped_type_clause(transport: IndexSignatureMappedTypeClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "index_signature_mapped_type_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_index_signature(transport: IndexSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        IndexSignatureTransport::IndexSignatureUFormColon(data) => transport_to_node_index_signature_uform_colon(data),
        IndexSignatureTransport::IndexSignatureUFormMappedTypeClause(data) => transport_to_node_index_signature_uform_mapped_type_clause(data),
    }
}

fn transport_to_node_index_signature_uform_colon(transport: IndexSignatureUFormColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.sign {
        fields.insert("sign".to_string(), transport_field_value(value)?);
    }
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "index_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_index_signature_uform_mapped_type_clause(transport: IndexSignatureUFormMappedTypeClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.sign {
        fields.insert("sign".to_string(), transport_field_value(value)?);
    }
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "index_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_index_type_query(transport: IndexTypeQueryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_type".to_string(), transport_field_value(transport.primary_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "index_type_query",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_infer_type(transport: InferTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type_identifier".to_string(), transport_field_value(transport.type_identifier)?);
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "infer_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_instantiation_expression(transport: InstantiationExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    fields.insert("type_arguments".to_string(), transport_field_value(transport.type_arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "instantiation_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_interface_declaration(transport: InterfaceDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.extends_type_clause {
        fields.insert("extends_type_clause".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "interface_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_internal_module(transport: InternalModuleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.body {
        fields.insert("body".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "internal_module",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_intersection_type(transport: IntersectionTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.left {
        fields.insert("left".to_string(), transport_field_value(value)?);
    }
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "intersection_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_attribute(transport: JsxAttributeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "jsx_attribute",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_closing_element(transport: JsxClosingElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "jsx_closing_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_element(transport: JsxElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("open_tag".to_string(), transport_field_value(transport.open_tag)?);
    fields.insert("close_tag".to_string(), transport_field_value(transport.close_tag)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "jsx_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_expression(transport: JsxExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "jsx_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_identifier(transport: JsxIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "jsx_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_jsx_namespace_name(transport: JsxNamespaceNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "jsx_namespace_name",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_opening_element(transport: JsxOpeningElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("attribute".to_string(), transport_field_values(transport.attribute)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "jsx_opening_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_jsx_self_closing_element(transport: JsxSelfClosingElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.name {
        fields.insert("name".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    fields.insert("attribute".to_string(), transport_field_values(transport.attribute)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "jsx_self_closing_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_labeled_statement(transport: LabeledStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("label".to_string(), transport_field_value(transport.label)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "labeled_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_lexical_declaration(transport: LexicalDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("kind".to_string(), transport_field_value(transport.kind)?);
    fields.insert("declarators".to_string(), transport_field_values(transport.declarators)?);
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "lexical_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_literal_type(transport: LiteralTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "literal_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_lookup_type(transport: LookupTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_type".to_string(), transport_field_value(transport.primary_type)?);
    fields.insert("index_type".to_string(), transport_field_value(transport.index_type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "lookup_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_mapped_type_clause(transport: MappedTypeClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    if let Some(value) = transport.alias {
        fields.insert("alias".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "mapped_type_clause",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_member_expression(transport: MemberExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "member_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_meta_property(transport: MetaPropertyTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "meta_property",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_method_definition(transport: MethodDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.accessibility_modifier {
        fields.insert("accessibility_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.static_marker {
        fields.insert("static_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.override_modifier {
        fields.insert("override_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.accessor_kind {
        fields.insert("accessor_kind".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.optional_marker {
        fields.insert("optional_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "method_definition",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_method_signature(transport: MethodSignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.accessibility_modifier {
        fields.insert("accessibility_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.static_marker {
        fields.insert("static_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.override_modifier {
        fields.insert("override_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.accessor_kind {
        fields.insert("accessor_kind".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.optional_marker {
        fields.insert("optional_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("parameters".to_string(), transport_field_value(transport.parameters)?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "method_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_module(transport: ModuleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.body {
        fields.insert("body".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "module",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_named_imports(transport: NamedImportsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "named_imports",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_namespace_export(transport: NamespaceExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "namespace_export",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_namespace_import(transport: NamespaceImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "namespace_import",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_nested_identifier(transport: NestedIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("property".to_string(), transport_field_value(transport.property)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "nested_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_nested_type_identifier(transport: NestedTypeIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("module".to_string(), transport_field_value(transport.module)?);
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "nested_type_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_new_expression(transport: NewExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("constructor".to_string(), transport_field_value(transport.constructor)?);
    if let Some(value) = transport.type_arguments {
        fields.insert("type_arguments".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.arguments {
        fields.insert("arguments".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "new_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_non_null_expression(transport: NonNullExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "non_null_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_null(transport: NullTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "null",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_number(transport: NumberTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "number",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_object(transport: ObjectTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "object",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_object_assignment_pattern(transport: ObjectAssignmentPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "object_assignment_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_object_pattern(transport: ObjectPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "object_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_object_type(transport: ObjectTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("opening".to_string(), transport_field_value(transport.opening)?);
    if let Some(value) = transport.members {
        fields.insert("members".to_string(), transport_field_values(value)?);
    }
    fields.insert("closing".to_string(), transport_field_value(transport.closing)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "object_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_omitting_type_annotation(transport: OmittingTypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "omitting_type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_opting_type_annotation(transport: OptingTypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "opting_type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_optional_chain(transport: OptionalChainTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "optional_chain",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_optional_parameter(transport: OptionalParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("pattern".to_string(), transport_field_value(transport.pattern)?);
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "optional_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_optional_tuple_parameter(transport: OptionalTupleParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "optional_tuple_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_optional_type(transport: OptionalTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "optional_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_override_modifier(transport: OverrideModifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "override_modifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_pair(transport: PairTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("key".to_string(), transport_field_value(transport.key)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "pair",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_pair_pattern(transport: PairPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("key".to_string(), transport_field_value(transport.key)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "pair_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_expression_sequence(transport: ParenthesizedExpressionSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "parenthesized_expression_sequence",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_expression(transport: ParenthesizedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        ParenthesizedExpressionTransport::ParenthesizedExpressionUFormTyped(data) => transport_to_node_parenthesized_expression_uform_typed(data),
        ParenthesizedExpressionTransport::ParenthesizedExpressionUFormSequence(data) => transport_to_node_parenthesized_expression_uform_sequence(data),
    }
}

fn transport_to_node_parenthesized_expression_uform_typed(transport: ParenthesizedExpressionUFormTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "parenthesized_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_expression_uform_sequence(transport: ParenthesizedExpressionUFormSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "parenthesized_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_type(transport: ParenthesizedTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "parenthesized_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_predefined_type(transport: PredefinedTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "predefined_type",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_private_property_identifier(transport: PrivatePropertyIdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "private_property_identifier",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_program(transport: ProgramTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.hash_bang_line {
        fields.insert("hash_bang_line".to_string(), transport_field_value(value)?);
    }
    fields.insert("statements".to_string(), transport_field_values(transport.statements)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "program",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_property_signature(transport: PropertySignatureTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.accessibility_modifier {
        fields.insert("accessibility_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.static_marker {
        fields.insert("static_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.override_modifier {
        fields.insert("override_modifier".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.optional_marker {
        fields.insert("optional_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "property_signature",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_public_field_definition(transport: PublicFieldDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.optionality_marker {
        fields.insert("optionality_marker".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "public_field_definition",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_readonly_type(transport: ReadonlyTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "readonly_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_regex(transport: RegexTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("pattern".to_string(), transport_field_value(transport.pattern)?);
    if let Some(value) = transport.flags {
        fields.insert("flags".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "regex",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_regex_flags(transport: RegexFlagsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "regex_flags",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_regex_pattern(transport: RegexPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "regex_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_required_parameter(transport: RequiredParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("decorator".to_string(), transport_field_values(transport.decorator)?);
    if let Some(value) = transport.readonly_marker {
        fields.insert("readonly_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("pattern".to_string(), transport_field_value(transport.pattern)?);
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "required_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_rest_pattern(transport: RestPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "rest_pattern",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_rest_type(transport: RestTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "rest_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_return_statement(transport: ReturnStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "return_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_satisfies_expression(transport: SatisfiesExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    fields.insert("type_annotation".to_string(), transport_field_value(transport.type_annotation)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "satisfies_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_sequence_expression(transport: SequenceExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "sequence_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_spread_element(transport: SpreadElementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "spread_element",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_statement_block(transport: StatementBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("statements".to_string(), transport_field_values(transport.statements)?);
    if let Some(value) = transport.automatic_semicolon {
        fields.insert("automatic_semicolon".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "statement_block",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_string_double(transport: StringDoubleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "string_double",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_string_single(transport: StringSingleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "string_single",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_string(transport: StringTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        StringTransport::StringUFormDouble(data) => transport_to_node_string_uform_double(data),
        StringTransport::StringUFormSingle(data) => transport_to_node_string_uform_single(data),
    }
}

fn transport_to_node_string_uform_double(transport: StringUFormDoubleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "string",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_string_uform_single(transport: StringUFormSingleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "string",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_subscript_expression(transport: SubscriptExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    if let Some(value) = transport.optional_chain {
        fields.insert("optional_chain".to_string(), transport_field_value(value)?);
    }
    fields.insert("index".to_string(), transport_field_value(transport.index)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "subscript_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_super(transport: SuperTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "super",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_switch_body(transport: SwitchBodyTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "switch_body",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_switch_case(transport: SwitchCaseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    fields.insert("body".to_string(), transport_field_values(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "switch_case",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_switch_default(transport: SwitchDefaultTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_values(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "switch_default",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_switch_statement(transport: SwitchStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "switch_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_template_literal_type(transport: TemplateLiteralTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "template_literal_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_template_string(transport: TemplateStringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "template_string",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_template_substitution(transport: TemplateSubstitutionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "template_substitution",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_template_type(transport: TemplateTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "template_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_ternary_expression(transport: TernaryExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    fields.insert("alternative".to_string(), transport_field_value(transport.alternative)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "ternary_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_this(transport: ThisTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "this",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_throw_statement(transport: ThrowStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "throw_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_true(transport: TrueTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "true",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_try_statement(transport: TryStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    if let Some(value) = transport.handler {
        fields.insert("handler".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.finalizer {
        fields.insert("finalizer".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "try_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_tuple_parameter(transport: TupleParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "tuple_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_tuple_type(transport: TupleTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "tuple_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_alias_declaration(transport: TypeAliasDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_alias_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_annotation(transport: TypeAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_arguments(transport: TypeArgumentsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "type_arguments",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_assertion(transport: TypeAssertionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type_arguments".to_string(), transport_field_value(transport.type_arguments)?);
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_assertion",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_parameter(transport: TypeParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.const_marker {
        fields.insert("const_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.constraint {
        fields.insert("constraint".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_parameter",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_parameters(transport: TypeParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "type_parameters",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_predicate(transport: TypePredicateTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_predicate",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_predicate_annotation(transport: TypePredicateAnnotationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type_predicate".to_string(), transport_field_value(transport.type_predicate)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_predicate_annotation",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_type_query(transport: TypeQueryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "type_query",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_unary_expression(transport: UnaryExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "unary_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_undefined(transport: UndefinedTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "undefined",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_unescaped_double_jsx_string_fragment(transport: UnescapedDoubleJsxStringFragmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "unescaped_double_jsx_string_fragment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_unescaped_double_string_fragment(transport: UnescapedDoubleStringFragmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "unescaped_double_string_fragment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_unescaped_single_jsx_string_fragment(transport: UnescapedSingleJsxStringFragmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "unescaped_single_jsx_string_fragment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_unescaped_single_string_fragment(transport: UnescapedSingleStringFragmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "unescaped_single_string_fragment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_union_type(transport: UnionTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.left {
        fields.insert("left".to_string(), transport_field_value(value)?);
    }
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "union_type",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_update_expression(transport: UpdateExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        UpdateExpressionTransport::UpdateExpressionUFormPostfix(data) => transport_to_node_update_expression_uform_postfix(data),
        UpdateExpressionTransport::UpdateExpressionUFormPrefix(data) => transport_to_node_update_expression_uform_prefix(data),
    }
}

fn transport_to_node_update_expression_uform_postfix(transport: UpdateExpressionUFormPostfixTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "update_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_update_expression_uform_prefix(transport: UpdateExpressionUFormPrefixTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "update_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_variable_declaration(transport: VariableDeclarationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("declarators".to_string(), transport_field_values(transport.declarators)?);
    fields.insert("semicolon".to_string(), transport_field_value(transport.semicolon)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "variable_declaration",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_variable_declarator(transport: VariableDeclaratorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.r#type {
        fields.insert("type".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "variable_declarator",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_while_statement(transport: WhileStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "while_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_with_statement(transport: WithStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "with_statement",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_yield_expression(transport: YieldExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.expression {
        fields.insert("expression".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "yield_expression",
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id,
        fields,
        children,
    ))
}

fn transport_to_node_automatic_semicolon(transport: AutomaticSemicolonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_automatic_semicolon",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_template_chars(transport: TemplateCharsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_template_chars",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_ternary_qmark(transport: TernaryQmarkTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_ternary_qmark",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_html_comment(transport: HtmlCommentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "html_comment",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_oror(transport: OrorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "||",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_jsx_text(transport: JsxTextTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "jsx_text",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_function_signature_automatic_semicolon(transport: FunctionSignatureAutomaticSemicolonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_function_signature_automatic_semicolon",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_error_recovery(transport: ErrorRecoveryTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "__error_recovery",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_qdot(transport: TokQDotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "?.",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_comma(transport: CommaTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ",",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_export(transport: ExportTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "export",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_default(transport: DefaultTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "default",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_star(transport: StarTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "*",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_eq(transport: EqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "=",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_as(transport: AsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "as",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_namespace(transport: NamespaceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "namespace",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_paren(transport: ParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "(",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_close_paren(transport: CloseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ")",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_var(transport: VarTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "var",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_from(transport: FromTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "from",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_colon(transport: ColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ":",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_lt(transport: LtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "<",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_dq(transport: TokDqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "\"",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_sq(transport: TokSqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "'",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_abstract(transport: AbstractTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "abstract",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_async(transport: AsyncTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "async",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_const(transport: ConstTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "const",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_question(transport: QuestionTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "?",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_readonly(transport: ReadonlyTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "readonly",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_static(transport: StaticTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "static",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_declare(transport: DeclareTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "declare",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_accessor(transport: AccessorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "accessor",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_dot(transport: DotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ".",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_bracket(transport: BracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "[",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_close_bracket(transport: CloseBracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "]",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_plus_qcolon(transport: TokPlusQColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "+?:",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_global(transport: GlobalTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "global",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_using(transport: UsingTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "using",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_await(transport: AwaitTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "await",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_andand(transport: AndandTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "&&",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_shr(transport: ShrTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ">>",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_gt_gt_gt(transport: TokGtGtGtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ">>>",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_shl(transport: ShlTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "<<",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_amp(transport: AmpTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "&",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_caret(transport: CaretTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "^",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_pipe(transport: PipeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "|",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_plus(transport: PlusTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "+",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_minus(transport: MinusTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "-",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_slash(transport: SlashTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "/",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_percent(transport: PercentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "%",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_starstar(transport: StarstarTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "**",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_le(transport: LeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "<=",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_eqeq(transport: EqeqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "==",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_eq_eq_eq(transport: TokEqEqEqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "===",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_neq(transport: NeqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "!=",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_bang_eq_eq(transport: TokBangEqEqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "!==",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_ge(transport: GeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ">=",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_gt(transport: GtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ">",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_qq(transport: TokQQTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "??",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_instanceof(transport: InstanceofTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "instanceof",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_in(transport: InTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "in",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_break(transport: BreakTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "break",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_catch(transport: CatchTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "catch",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_brace(transport: BraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "{",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_semi(transport: SemiTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ";",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_close_brace(transport: CloseBraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "}",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_extends(transport: ExtendsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "extends",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_new(transport: NewTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "new",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_fat_arrow(transport: FatArrowTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "=>",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_continue(transport: ContinueTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "continue",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_debugger(transport: DebuggerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "debugger",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_at(transport: AtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "@",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_do(transport: DoTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "do",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_while(transport: WhileTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "while",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_else(transport: ElseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "else",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_enum(transport: EnumTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "enum",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_finally(transport: FinallyTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "finally",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_for(transport: ForTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "for",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_function(transport: FunctionTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "function",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_if(transport: IfTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "if",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_implements(transport: ImplementsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "implements",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_require(transport: RequireTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "require",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_keyof(transport: KeyofTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "keyof",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_infer(transport: InferTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "infer",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_interface(transport: InterfaceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "interface",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_lt_slash(transport: TokLtSlashTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "</",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_slash_gt(transport: TokSlashGtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "/>",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_bang(transport: BangTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "!",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_minus_qcolon(transport: TokMinusQColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "-?:",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_qcolon(transport: TokQColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "?:",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_override(transport: OverrideTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "override",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_ellipsis(transport: EllipsisTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "...",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_return(transport: ReturnTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "return",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_satisfies(transport: SatisfiesTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "satisfies",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_case(transport: CaseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "case",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_switch(transport: SwitchTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "switch",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_bt(transport: TokBtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "`",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_tok_dollar_lbr(transport: TokDollarLbrTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "${",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_throw(transport: ThrowTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "throw",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_try(transport: TryTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "try",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_is(transport: IsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "is",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_typeof(transport: TypeofTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "typeof",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_with(transport: WithTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "with",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

fn transport_to_node_yield(transport: YieldTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "yield",
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id,
        None,
        None,
    ))
}

pub fn node_data_from_transport(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {
    transport_to_node(transport)
}

pub fn render_transport_parts(transport: AnyTransport) -> Result<(TransportNodeData, String), ::askama::Error> {
    let node = node_data_from_transport(transport)?;
    let rendered = render_dispatch(&node)?;
    Ok((node, rendered))
}

pub fn from_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {
    let (_node, rendered) = render_transport_parts(transport)?;
    Ok(rendered)
}

pub fn render_transport(transport: AnyTransport) -> Result<String, ::askama::Error> {
    from_transport(transport)
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function__call_signature.jinja", escape = "none")]
pub struct _ArrowFunctionUCallSignatureTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_arrow_function_parameter.jinja", escape = "none")]
pub struct _ArrowFunctionParameterTemplate<'a> {
    pub parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_call.jinja", escape = "none")]
pub struct CallExpressionCallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_member.jinja", escape = "none")]
pub struct CallExpressionMemberTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_call_expression_template_call.jinja", escape = "none")]
pub struct CallExpressionTemplateCallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_member.jinja", escape = "none")]
pub struct ClassBodyMemberTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method_sig.jinja", escape = "none")]
pub struct ClassBodyMethodSigTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_body_method.jinja", escape = "none")]
pub struct ClassBodyMethodTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_extends_clause.jinja", escape = "none")]
pub struct _ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_class_heritage_implements_clause.jinja", escape = "none")]
pub struct _ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw_value.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwValueTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm_default_kw.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmDefaultKwTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_decl_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultDeclArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_clause_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmClauseFromTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_ns_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmNsFromTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm_star_from.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmStarFromTemplate<'a> {
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_default_from_arm.jinja", escape = "none")]
pub struct ExportStatementDefaultFromArmTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_equals_export.jinja", escape = "none")]
pub struct _ExportStatementEqualsExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_namespace_export.jinja", escape = "none")]
pub struct _ExportStatementNamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_export_statement_type_export.jinja", escape = "none")]
pub struct _ExportStatementTypeExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_let_const_kind.jinja", escape = "none")]
pub struct ForHeaderLetConstKindTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub kind: &'a str,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_lhs.jinja", escape = "none")]
pub struct ForHeaderLhsTemplate<'a> {
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_for_header_var_kind.jinja", escape = "none")]
pub struct ForHeaderVarKindTemplate<'a> {
    pub kind: &'a str,
    pub left: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_default_import.jinja", escape = "none")]
pub struct _ImportClauseDefaultImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_named_imports.jinja", escape = "none")]
pub struct _ImportClauseNamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_clause_namespace_import.jinja", escape = "none")]
pub struct _ImportClauseNamespaceImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_as.jinja", escape = "none")]
pub struct ImportSpecifierAsTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_import_specifier_name.jinja", escape = "none")]
pub struct _ImportSpecifierNameTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_colon.jinja", escape = "none")]
pub struct IndexSignatureColonTemplate<'a> {
    pub index_type: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct _IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_initializer.jinja", escape = "none")]
pub struct InitializerTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_interface_body.jinja", escape = "none")]
pub struct InterfaceBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_lhs_expression.jinja", escape = "none")]
pub struct LhsExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_number.jinja", escape = "none")]
pub struct _NumberTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_sequence.jinja", escape = "none")]
pub struct _ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_parenthesized_expression_typed.jinja", escape = "none")]
pub struct ParenthesizedExpressionTypedTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_property_identifier.jinja", escape = "none")]
pub struct PropertyIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_abstract_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAbstractFirstTemplate<'a> {
    pub abstract_marker: &'a str,
    pub readonly_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_access_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessFirstTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declare_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_accessor_opt.jinja", escape = "none")]
pub struct PublicFieldDefinitionAccessorOptTemplate<'a> {
    pub accessor_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_declare_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionDeclareFirstTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_readonly_first.jinja", escape = "none")]
pub struct PublicFieldDefinitionReadonlyFirstTemplate<'a> {
    pub abstract_marker: &'a str,
    pub readonly_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_public_field_definition_static_mods.jinja", escape = "none")]
pub struct PublicFieldDefinitionStaticModsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub readonly_marker: &'a str,
    pub static_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_statement_identifier.jinja", escape = "none")]
pub struct StatementIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_double.jinja", escape = "none")]
pub struct _StringDoubleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_fragment.jinja", escape = "none")]
pub struct StringFragmentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_string_single.jinja", escape = "none")]
pub struct _StringSingleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_identifier.jinja", escape = "none")]
pub struct TypeIdentifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryCallExpressionInTypeAnnotationTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_call_expression.jinja", escape = "none")]
pub struct TypeQueryCallExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_instantiation_expression.jinja", escape = "none")]
pub struct TypeQueryInstantiationExpressionTemplate<'a> {
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression_in_type_annotation.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionInTypeAnnotationTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_member_expression.jinja", escape = "none")]
pub struct TypeQueryMemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_type_query_subscript_expression.jinja", escape = "none")]
pub struct TypeQuerySubscriptExpressionTemplate<'a> {
    pub index: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_postfix.jinja", escape = "none")]
pub struct UpdateExpressionPostfixTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_update_expression_prefix.jinja", escape = "none")]
pub struct UpdateExpressionPrefixTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "abstract_class_declaration.jinja", escape = "none")]
pub struct AbstractClassDeclarationTemplate<'a> {
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "abstract_method_signature.jinja", escape = "none")]
pub struct AbstractMethodSignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "adding_type_annotation.jinja", escape = "none")]
pub struct AddingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "ambient_declaration.jinja", escape = "none")]
pub struct AmbientDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub declaration: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arguments.jinja", escape = "none")]
pub struct ArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_pattern.jinja", escape = "none")]
pub struct ArrayPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "array_type.jinja", escape = "none")]
pub struct ArrayTypeTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "array.jinja", escape = "none")]
pub struct ArrayTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function__call_signature.jinja", escape = "none")]
pub struct ArrowFunctionUCallSignatureTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function_parameter.jinja", escape = "none")]
pub struct ArrowFunctionParameterTemplate<'a> {
    pub parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "arrow_function.jinja", escape = "none")]
pub struct ArrowFunctionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "as_expression.jinja", escape = "none")]
pub struct AsExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub expression: &'a str,
    pub type_annotation: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "asserts_annotation.jinja", escape = "none")]
pub struct AssertsAnnotationTemplate<'a> {
    pub asserts: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "asserts.jinja", escape = "none")]
pub struct AssertsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment_expression.jinja", escape = "none")]
pub struct AssignmentExpressionTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
    pub using_marker: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "assignment_pattern.jinja", escape = "none")]
pub struct AssignmentPatternTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment_expression.jinja", escape = "none")]
pub struct AugmentedAssignmentExpressionTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "await_expression.jinja", escape = "none")]
pub struct AwaitExpressionTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "binary_expression.jinja", escape = "none")]
pub struct BinaryExpressionTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "break_statement.jinja", escape = "none")]
pub struct BreakStatementTemplate<'a> {
    pub label: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "call_expression.jinja", escape = "none")]
pub struct CallExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call_signature.jinja", escape = "none")]
pub struct CallSignatureTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "catch_clause.jinja", escape = "none")]
pub struct CatchClauseTemplate<'a> {
    pub body: &'a str,
    pub parameter: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_body.jinja", escape = "none")]
pub struct ClassBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_declaration.jinja", escape = "none")]
pub struct ClassDeclarationTemplate<'a> {
    pub automatic_semicolon: &'a str,
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_extends_clause.jinja", escape = "none")]
pub struct ClassHeritageExtendsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage_implements_clause.jinja", escape = "none")]
pub struct ClassHeritageImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_heritage.jinja", escape = "none")]
pub struct ClassHeritageTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_static_block.jinja", escape = "none")]
pub struct ClassStaticBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class.jinja", escape = "none")]
pub struct ClassTemplate<'a> {
    pub body: &'a str,
    pub class_heritage: &'a str,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "computed_property_name.jinja", escape = "none")]
pub struct ComputedPropertyNameTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "conditional_type.jinja", escape = "none")]
pub struct ConditionalTypeTemplate<'a> {
    pub alternative: &'a str,
    pub consequence: &'a str,
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constraint.jinja", escape = "none")]
pub struct ConstraintTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "construct_signature.jinja", escape = "none")]
pub struct ConstructSignatureTemplate<'a> {
    pub abstract_marker: &'a str,
    pub parameters: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constructor_type.jinja", escape = "none")]
pub struct ConstructorTypeTemplate<'a> {
    pub abstract_marker: &'a str,
    pub parameters: &'a str,
    pub r#type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "continue_statement.jinja", escape = "none")]
pub struct ContinueStatementTemplate<'a> {
    pub label: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "debugger_statement.jinja", escape = "none")]
pub struct DebuggerStatementTemplate<'a> {
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_call_expression.jinja", escape = "none")]
pub struct DecoratorCallExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_member_expression.jinja", escape = "none")]
pub struct DecoratorMemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator_parenthesized_expression.jinja", escape = "none")]
pub struct DecoratorParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_type.jinja", escape = "none")]
pub struct DefaultTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "do_statement.jinja", escape = "none")]
pub struct DoStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub statement: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "enum_assignment.jinja", escape = "none")]
pub struct EnumAssignmentTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "enum_body.jinja", escape = "none")]
pub struct EnumBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "enum_declaration.jinja", escape = "none")]
pub struct EnumDeclarationTemplate<'a> {
    pub body: &'a str,
    pub const_marker: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_clause.jinja", escape = "none")]
pub struct ExportClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_specifier.jinja", escape = "none")]
pub struct ExportSpecifierTemplate<'a> {
    pub alias: &'a str,
    pub export_kind: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_equals_export.jinja", escape = "none")]
pub struct ExportStatementEqualsExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_namespace_export.jinja", escape = "none")]
pub struct ExportStatementNamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "export_statement_type_export.jinja", escape = "none")]
pub struct ExportStatementTypeExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "export_statement.jinja", escape = "none")]
pub struct ExportStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "extends_clause.jinja", escape = "none")]
pub struct ExtendsClauseTemplate<'a> {
    pub type_arguments: ::sittir_core::filters::FieldView<'a>,
    pub value: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "extends_type_clause.jinja", escape = "none")]
pub struct ExtendsTypeClauseTemplate<'a> {
    pub r#type: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "field_definition.jinja", escape = "none")]
pub struct FieldDefinitionTemplate<'a> {
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub property: &'a str,
    pub static_marker: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "flow_maybe_type.jinja", escape = "none")]
pub struct FlowMaybeTypeTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_in_statement.jinja", escape = "none")]
pub struct ForInStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub await_marker: &'a str,
    pub body: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
    pub increment: &'a str,
    pub initializer: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "formal_parameters.jinja", escape = "none")]
pub struct FormalParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_declaration.jinja", escape = "none")]
pub struct FunctionDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_expression.jinja", escape = "none")]
pub struct FunctionExpressionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_signature.jinja", escape = "none")]
pub struct FunctionSignatureTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub semicolon: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "function_type.jinja", escape = "none")]
pub struct FunctionTypeTemplate<'a> {
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generator_function_declaration.jinja", escape = "none")]
pub struct GeneratorFunctionDeclarationTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generator_function.jinja", escape = "none")]
pub struct GeneratorFunctionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: &'a str,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "implements_clause.jinja", escape = "none")]
pub struct ImplementsClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_alias.jinja", escape = "none")]
pub struct ImportAliasTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub name: &'a str,
    pub semicolon: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_attribute.jinja", escape = "none")]
pub struct ImportAttributeTemplate<'a> {
    pub object: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_default_import.jinja", escape = "none")]
pub struct ImportClauseDefaultImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_named_imports.jinja", escape = "none")]
pub struct ImportClauseNamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause_namespace_import.jinja", escape = "none")]
pub struct ImportClauseNamespaceImportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_clause.jinja", escape = "none")]
pub struct ImportClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_require_clause.jinja", escape = "none")]
pub struct ImportRequireClauseTemplate<'a> {
    pub identifier: &'a str,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier_name.jinja", escape = "none")]
pub struct ImportSpecifierNameTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_specifier.jinja", escape = "none")]
pub struct ImportSpecifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub import_kind: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub import_attribute: &'a str,
    pub import_clause: &'a str,
    pub semicolon: &'a str,
    pub source: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "index_signature_mapped_type_clause.jinja", escape = "none")]
pub struct IndexSignatureMappedTypeClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "index_signature.jinja", escape = "none")]
pub struct IndexSignatureTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub sign: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "index_type_query.jinja", escape = "none")]
pub struct IndexTypeQueryTemplate<'a> {
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "infer_type.jinja", escape = "none")]
pub struct InferTypeTemplate<'a> {
    pub r#type: &'a str,
    pub type_identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "instantiation_expression.jinja", escape = "none")]
pub struct InstantiationExpressionTemplate<'a> {
    pub expression: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "interface_declaration.jinja", escape = "none")]
pub struct InterfaceDeclarationTemplate<'a> {
    pub body: &'a str,
    pub extends_type_clause: &'a str,
    pub name: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "internal_module.jinja", escape = "none")]
pub struct InternalModuleTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "intersection_type.jinja", escape = "none")]
pub struct IntersectionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_attribute.jinja", escape = "none")]
pub struct JsxAttributeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_closing_element.jinja", escape = "none")]
pub struct JsxClosingElementTemplate<'a> {
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_element.jinja", escape = "none")]
pub struct JsxElementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub close_tag: &'a str,
    pub open_tag: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_expression.jinja", escape = "none")]
pub struct JsxExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_namespace_name.jinja", escape = "none")]
pub struct JsxNamespaceNameTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "jsx_opening_element.jinja", escape = "none")]
pub struct JsxOpeningElementTemplate<'a> {
    pub attribute: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "jsx_self_closing_element.jinja", escape = "none")]
pub struct JsxSelfClosingElementTemplate<'a> {
    pub attribute: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "labeled_statement.jinja", escape = "none")]
pub struct LabeledStatementTemplate<'a> {
    pub body: &'a str,
    pub label: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lexical_declaration.jinja", escape = "none")]
pub struct LexicalDeclarationTemplate<'a> {
    pub declarators: ::sittir_core::filters::FieldView<'a>,
    pub kind: &'a str,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "literal_type.jinja", escape = "none")]
pub struct LiteralTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lookup_type.jinja", escape = "none")]
pub struct LookupTypeTemplate<'a> {
    pub index_type: &'a str,
    pub primary_type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "mapped_type_clause.jinja", escape = "none")]
pub struct MappedTypeClauseTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "member_expression.jinja", escape = "none")]
pub struct MemberExpressionTemplate<'a> {
    pub object: &'a str,
    pub optional_chain: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "method_definition.jinja", escape = "none")]
pub struct MethodDefinitionTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub readonly_marker: &'a str,
    pub return_type: &'a str,
    pub static_marker: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "method_signature.jinja", escape = "none")]
pub struct MethodSignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub accessor_kind: &'a str,
    pub async_marker: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub parameters: &'a str,
    pub readonly_marker: &'a str,
    pub return_type: &'a str,
    pub static_marker: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "named_imports.jinja", escape = "none")]
pub struct NamedImportsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_export.jinja", escape = "none")]
pub struct NamespaceExportTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "namespace_import.jinja", escape = "none")]
pub struct NamespaceImportTemplate<'a> {
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nested_identifier.jinja", escape = "none")]
pub struct NestedIdentifierTemplate<'a> {
    pub object: &'a str,
    pub property: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nested_type_identifier.jinja", escape = "none")]
pub struct NestedTypeIdentifierTemplate<'a> {
    pub module: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "new_expression.jinja", escape = "none")]
pub struct NewExpressionTemplate<'a> {
    pub arguments: &'a str,
    pub constructor: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "non_null_expression.jinja", escape = "none")]
pub struct NonNullExpressionTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object_assignment_pattern.jinja", escape = "none")]
pub struct ObjectAssignmentPatternTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object_pattern.jinja", escape = "none")]
pub struct ObjectPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "object_type.jinja", escape = "none")]
pub struct ObjectTypeTemplate<'a> {
    pub closing: &'a str,
    pub members: ::sittir_core::filters::FieldView<'a>,
    pub opening: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "object.jinja", escape = "none")]
pub struct ObjectTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "omitting_type_annotation.jinja", escape = "none")]
pub struct OmittingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "opting_type_annotation.jinja", escape = "none")]
pub struct OptingTypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_parameter.jinja", escape = "none")]
pub struct OptionalParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub pattern: &'a str,
    pub readonly_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_tuple_parameter.jinja", escape = "none")]
pub struct OptionalTupleParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "optional_type.jinja", escape = "none")]
pub struct OptionalTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair_pattern.jinja", escape = "none")]
pub struct PairPatternTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression_sequence.jinja", escape = "none")]
pub struct ParenthesizedExpressionSequenceTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_type.jinja", escape = "none")]
pub struct ParenthesizedTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "program.jinja", escape = "none")]
pub struct ProgramTemplate<'a> {
    pub hash_bang_line: &'a str,
    pub statements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "property_signature.jinja", escape = "none")]
pub struct PropertySignatureTemplate<'a> {
    pub accessibility_modifier: &'a str,
    pub name: &'a str,
    pub optional_marker: &'a str,
    pub override_modifier: &'a str,
    pub readonly_marker: &'a str,
    pub static_marker: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "public_field_definition.jinja", escape = "none")]
pub struct PublicFieldDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub name: &'a str,
    pub optionality_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "readonly_type.jinja", escape = "none")]
pub struct ReadonlyTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "regex.jinja", escape = "none")]
pub struct RegexTemplate<'a> {
    pub flags: &'a str,
    pub pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "required_parameter.jinja", escape = "none")]
pub struct RequiredParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub decorator: ::sittir_core::filters::FieldView<'a>,
    pub pattern: &'a str,
    pub readonly_marker: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "rest_pattern.jinja", escape = "none")]
pub struct RestPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "rest_type.jinja", escape = "none")]
pub struct RestTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "satisfies_expression.jinja", escape = "none")]
pub struct SatisfiesExpressionTemplate<'a> {
    pub expression: &'a str,
    pub type_annotation: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "sequence_expression.jinja", escape = "none")]
pub struct SequenceExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "spread_element.jinja", escape = "none")]
pub struct SpreadElementTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "statement_block.jinja", escape = "none")]
pub struct StatementBlockTemplate<'a> {
    pub automatic_semicolon: &'a str,
    pub statements: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_double.jinja", escape = "none")]
pub struct StringDoubleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_single.jinja", escape = "none")]
pub struct StringSingleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "subscript_expression.jinja", escape = "none")]
pub struct SubscriptExpressionTemplate<'a> {
    pub index: &'a str,
    pub object: &'a str,
    pub optional_chain: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "switch_body.jinja", escape = "none")]
pub struct SwitchBodyTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_case.jinja", escape = "none")]
pub struct SwitchCaseTemplate<'a> {
    pub body: ::sittir_core::filters::FieldView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "switch_default.jinja", escape = "none")]
pub struct SwitchDefaultTemplate<'a> {
    pub body: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "switch_statement.jinja", escape = "none")]
pub struct SwitchStatementTemplate<'a> {
    pub body: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "template_literal_type.jinja", escape = "none")]
pub struct TemplateLiteralTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_string.jinja", escape = "none")]
pub struct TemplateStringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_substitution.jinja", escape = "none")]
pub struct TemplateSubstitutionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "template_type.jinja", escape = "none")]
pub struct TemplateTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "ternary_expression.jinja", escape = "none")]
pub struct TernaryExpressionTemplate<'a> {
    pub alternative: &'a str,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "throw_statement.jinja", escape = "none")]
pub struct ThrowStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: &'a str,
    pub finalizer: &'a str,
    pub handler: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_parameter.jinja", escape = "none")]
pub struct TupleParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_type.jinja", escape = "none")]
pub struct TupleTypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_declaration.jinja", escape = "none")]
pub struct TypeAliasDeclarationTemplate<'a> {
    pub name: &'a str,
    pub semicolon: &'a str,
    pub type_parameters: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_annotation.jinja", escape = "none")]
pub struct TypeAnnotationTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_arguments.jinja", escape = "none")]
pub struct TypeArgumentsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_assertion.jinja", escape = "none")]
pub struct TypeAssertionTemplate<'a> {
    pub expression: &'a str,
    pub type_arguments: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub const_marker: &'a str,
    pub constraint: &'a str,
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameters.jinja", escape = "none")]
pub struct TypeParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate_annotation.jinja", escape = "none")]
pub struct TypePredicateAnnotationTemplate<'a> {
    pub type_predicate: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_predicate.jinja", escape = "none")]
pub struct TypePredicateTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_query.jinja", escape = "none")]
pub struct TypeQueryTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_expression.jinja", escape = "none")]
pub struct UnaryExpressionTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "update_expression.jinja", escape = "none")]
pub struct UpdateExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "variable_declaration.jinja", escape = "none")]
pub struct VariableDeclarationTemplate<'a> {
    pub declarators: ::sittir_core::filters::FieldView<'a>,
    pub semicolon: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "variable_declarator.jinja", escape = "none")]
pub struct VariableDeclaratorTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub body: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "yield_expression.jinja", escape = "none")]
pub struct YieldExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub expression: &'a str,
}

use ::askama::Template as _AskamaTemplate;
use ::sittir_core::types::{FieldValue, NodeData};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
enum ResolvedFieldKind {
    #[default]
    Missing,
    Scalar,
    List,
}

#[derive(Debug, Default)]
struct ResolvedField {
    kind: ResolvedFieldKind,
    scalar: String,
    items: Vec<String>,
    separator: &'static str,
    leading_sep: bool,
    trailing_sep: bool,
}

impl ResolvedField {
    fn from_scalar(value: String) -> Self {
        Self {
            kind: ResolvedFieldKind::Scalar,
            scalar: value,
            items: Vec::new(),
            separator: "",
            leading_sep: false,
            trailing_sep: false,
        }
    }

    fn from_items(items: Vec<String>, separator: &'static str, leading_sep: bool, trailing_sep: bool) -> Self {
        Self {
            kind: ResolvedFieldKind::List,
            scalar: ::sittir_core::filters::joinby(&items, separator, leading_sep, trailing_sep).unwrap_or_default(),
            items,
            separator,
            leading_sep,
            trailing_sep,
        }
    }

    fn as_scalar(&self) -> &str {
        self.scalar.as_str()
    }

    fn as_list_view(&self) -> ::sittir_core::filters::ListView<'_> {
        ::sittir_core::filters::ListView {
            items: self.items.as_slice(),
            separator: self.separator,
            leading: self.leading_sep,
            trailing: self.trailing_sep,
        }
    }

    fn as_field_view(&self) -> ::sittir_core::filters::FieldView<'_> {
        match self.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::FieldView::Missing,
            ResolvedFieldKind::Scalar => ::sittir_core::filters::FieldView::Scalar(self.scalar.as_str()),
            ResolvedFieldKind::List => ::sittir_core::filters::FieldView::List(self.as_list_view()),
        }
    }
}

fn separator_for(kind: &str) -> &'static str {
    match kind {
        "arguments" => ",",
        "array" => ",",
        "array_pattern" => ",",
        "export_clause" => ",",
        "named_imports" => ",",
        "sequence_expression" => ",",
        "tuple_type" => ",",
        "type_arguments" => ",",
        "type_parameters" => ",",
        _ => "",
    }
}

fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {
    match (parent_kind, child_kind) {
        ("arrow_function", "arrow_function__call_signature") => Some("parameter"),
        ("arrow_function", "arrow_function__form__call_signature") => Some("_call_signature"),
        ("arrow_function", "arrow_function__form_parameter") => Some("parameter"),
        ("arrow_function", "arrow_function_parameter") => Some("parameter"),
        ("call_expression", "call_expression__form_call") => Some("call"),
        ("call_expression", "call_expression__form_member") => Some("member"),
        ("call_expression", "call_expression__form_template_call") => Some("template_call"),
        ("call_expression", "call_expression_call") => Some("call"),
        ("call_expression", "call_expression_member") => Some("call"),
        ("call_expression", "call_expression_template_call") => Some("call"),
        ("class_heritage", "class_heritage__form_extends_clause") => Some("extends_clause"),
        ("class_heritage", "class_heritage__form_implements_clause") => Some("implements_clause"),
        ("class_heritage", "class_heritage_extends_clause") => Some("extends_clause"),
        ("class_heritage", "class_heritage_implements_clause") => Some("extends_clause"),
        ("export_statement", "export_statement__form_default") => Some("default"),
        ("export_statement", "export_statement__form_equals_export") => Some("equals_export"),
        ("export_statement", "export_statement__form_namespace_export") => Some("namespace_export"),
        ("export_statement", "export_statement__form_type_export") => Some("type_export"),
        ("export_statement", "export_statement_default") => Some("default"),
        ("export_statement", "export_statement_equals_export") => Some("default"),
        ("export_statement", "export_statement_namespace_export") => Some("default"),
        ("export_statement", "export_statement_type_export") => Some("default"),
        ("import_clause", "import_clause__form_default_import") => Some("default_import"),
        ("import_clause", "import_clause__form_named_imports") => Some("named_imports"),
        ("import_clause", "import_clause__form_namespace_import") => Some("namespace_import"),
        ("import_clause", "import_clause_default_import") => Some("namespace_import"),
        ("import_clause", "import_clause_named_imports") => Some("namespace_import"),
        ("import_clause", "import_clause_namespace_import") => Some("namespace_import"),
        ("import_specifier", "import_specifier__form_as") => Some("as"),
        ("import_specifier", "import_specifier__form_name") => Some("name"),
        ("import_specifier", "import_specifier_as") => Some("name"),
        ("import_specifier", "import_specifier_name") => Some("name"),
        ("index_signature", "index_signature__form_colon") => Some("colon"),
        ("index_signature", "index_signature__form_mapped_type_clause") => Some("mapped_type_clause"),
        ("index_signature", "index_signature_colon") => Some("colon"),
        ("index_signature", "index_signature_mapped_type_clause") => Some("colon"),
        ("parenthesized_expression", "parenthesized_expression__form_sequence") => Some("sequence"),
        ("parenthesized_expression", "parenthesized_expression__form_typed") => Some("typed"),
        ("parenthesized_expression", "parenthesized_expression_sequence") => Some("typed"),
        ("parenthesized_expression", "parenthesized_expression_typed") => Some("typed"),
        ("string", "string__form_double") => Some("double"),
        ("string", "string__form_single") => Some("single"),
        ("string", "string_double") => Some("double"),
        ("string", "string_single") => Some("double"),
        ("update_expression", "update_expression__form_postfix") => Some("postfix"),
        ("update_expression", "update_expression__form_prefix") => Some("prefix"),
        ("update_expression", "update_expression_postfix") => Some("postfix"),
        ("update_expression", "update_expression_prefix") => Some("postfix"),
        _ => None,
    }
}

fn first_named_child_kind(node: &NodeData) -> Option<&str> {
    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.as_str())
}

fn resolve_variant(node: &NodeData) -> &'static str {
    first_named_child_kind(node)
        .and_then(|child_kind| variant_for(node.type_.as_str(), child_kind))
        .unwrap_or("")
}

fn render_node_value(node: &NodeData) -> Result<String, ::askama::Error> {
    render_dispatch(node)
}

fn missing_required_field(node: &NodeData, name: &str) -> ::askama::Error {
    ::askama::Error::Custom(
        format!("render_dispatch: missing required field '{}' on '{}'", name, node.type_).into(),
    )
}

fn resolve_text(node: &NodeData) -> Result<String, ::askama::Error> {
    if let Some(text) = &node.text {
        return Ok(text.clone());
    }
    let mut parts = Vec::new();
    if let Some(fields) = &node.fields {
        for value in fields.values() {
            match value {
                FieldValue::Single(child) => parts.push(render_node_value(child)?),
                FieldValue::Multiple(items) => {
                    for child in items {
                        parts.push(render_node_value(child)?);
                    }
                }
                FieldValue::Text(text) => parts.push(text.clone()),
            }
        }
    }
    if let Some(children) = &node.children {
        for child in children {
            parts.push(render_node_value(child)?);
        }
    }
    Ok(parts.join(""))
}

fn resolve_leaf<'a>(node: &'a NodeData, name: &str) -> Option<&'a str> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        Some(FieldValue::Single(child)) => child.text.as_deref(),
        Some(FieldValue::Text(text)) => Some(text.as_str()),
        _ => None,
    }
}

fn resolve_optional(node: &NodeData, name: &str) -> Result<Option<String>, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Ok(None),
        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.clone())),
        Some(FieldValue::Single(child)) => {
            let rendered = render_node_value(child)?;
            Ok((!rendered.is_empty()).then_some(rendered))
        }
        Some(FieldValue::Multiple(_)) => {
            let resolved = resolve_field(node, name, false)?;
            Ok((!resolved.scalar.is_empty()).then_some(resolved.scalar))
        }
    }
}

fn resolve_required(node: &NodeData, name: &str) -> Result<String, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => Err(missing_required_field(node, name)),
        Some(_) => Ok(resolve_optional(node, name)?.unwrap_or_default()),
    }
}

fn is_join_flank_token(text: &str) -> bool {
    matches!(text, "," | ";")
}

fn detect_field_trailing_sep(node: &NodeData, field_name: &str) -> bool {
    let fields = match &node.fields {
        Some(fields) => fields,
        None => return false,
    };
    let value = match fields.get(field_name) {
        Some(value) => value,
        None => return false,
    };
    let boundary = match value {
        FieldValue::Multiple(items) => items
            .iter()
            .filter(|item| item.named)
            .filter_map(|item| item.span.map(|span| span.end))
            .max(),
        _ => None,
    };
    let boundary = match boundary {
        Some(boundary) => boundary,
        None => return false,
    };
    for (name, raw) in fields {
        if name == field_name {
            continue;
        }
        let values: Vec<&NodeData> = match raw {
            FieldValue::Single(item) => vec![item.as_ref()],
            FieldValue::Multiple(items) => items.iter().collect(),
            FieldValue::Text(_) => Vec::new(),
        };
        for candidate in values {
            if candidate.named {
                continue;
            }
            if let Some(span) = candidate.span {
                if span.start >= boundary && candidate.text.as_deref().map_or(false, is_join_flank_token) {
                    return true;
                }
            }
        }
    }
    if let Some(children) = &node.children {
        for child in children {
            if child.named {
                continue;
            }
            if let Some(span) = child.span {
                if span.start >= boundary && child.text.as_deref().map_or(false, is_join_flank_token) {
                    return true;
                }
            }
        }
    }
    false
}

fn resolve_field(node: &NodeData, name: &str, required: bool) -> Result<ResolvedField, ::askama::Error> {
    match node.fields.as_ref().and_then(|fields| fields.get(name)) {
        None => {
            if required {
                Err(missing_required_field(node, name))
            } else {
                Ok(ResolvedField::default())
            }
        }
        Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.clone())),
        Some(FieldValue::Single(child)) => {
            let rendered = render_node_value(child)?;
            Ok(ResolvedField::from_scalar(rendered))
        }
        Some(FieldValue::Multiple(items)) => {
            let mut rendered = Vec::new();
            for item in items {
                if !item.named {
                    continue;
                }
                rendered.push(render_node_value(item)?);
            }
            Ok(ResolvedField::from_items(
                rendered,
                separator_for(node.type_.as_str()),
                false,
                detect_field_trailing_sep(node, name),
            ))
        }
    }
}

fn resolve_children(node: &NodeData, consumed_fields: &[&str]) -> Result<ResolvedField, ::askama::Error> {
    let mut child_nodes: Vec<(u32, usize, &NodeData)> = Vec::new();
    let mut child_ordinal = 0usize;
    let mut first_named_idx: Option<usize> = None;
    let mut last_named_idx: Option<usize> = None;
    if let Some(items) = &node.children {
        for (index, child) in items.iter().enumerate() {
            if !child.named {
                continue;
            }
            if first_named_idx.is_none() {
                first_named_idx = Some(index);
            }
            last_named_idx = Some(index);
            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));
            child_ordinal += 1;
        }
    }
    if let Some(fields) = &node.fields {
        for (name, value) in fields {
            if consumed_fields.iter().any(|consumed| consumed == &name.as_str()) {
                continue;
            }
            match value {
                FieldValue::Single(child) => {
                    if child.named {
                        child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child.as_ref()));
                        child_ordinal += 1;
                    }
                }
                FieldValue::Multiple(items) => {
                    for child in items {
                        if child.named {
                            child_nodes.push((child.span.map_or(u32::MAX, |span| span.start), child_ordinal, child));
                            child_ordinal += 1;
                        }
                    }
                }
                FieldValue::Text(_) => {}
            }
        }
    }
    child_nodes.sort_by(|left, right| left.0.cmp(&right.0).then(left.1.cmp(&right.1)));
    let mut children = Vec::new();
    for (_, _, child) in child_nodes {
        children.push(render_node_value(child)?);
    }
    let mut leading_sep = false;
    let mut trailing_sep = false;
    if let Some(items) = &node.children {
        if let Some(first) = first_named_idx {
            if first > 0 {
                if let Some(before) = items.get(first - 1) {
                    leading_sep = !before.named && before.text.as_deref().map_or(false, is_join_flank_token);
                }
            }
        }
        if let Some(last) = last_named_idx {
            if let Some(after) = items.get(last + 1) {
                trailing_sep = !after.named && after.text.as_deref().map_or(false, is_join_flank_token);
            }
        }
    }
    Ok(ResolvedField::from_items(
        children,
        separator_for(node.type_.as_str()),
        leading_sep,
        trailing_sep,
    ))
}

fn token_shaped_fallback(node: &NodeData) -> Result<String, ::askama::Error> {
    let fields_all_anon = node.fields.as_ref().map_or(true, |fields| {
        fields.values().all(|value| match value {
            FieldValue::Single(item) => !item.named,
            FieldValue::Multiple(items) => items.iter().all(|item| !item.named),
            FieldValue::Text(_) => true,
        })
    });
    let children_all_anon = node.children.as_ref().map_or(true, |children| children.iter().all(|child| !child.named));
    if fields_all_anon && children_all_anon {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
        let mut parts = Vec::new();
        if let Some(fields) = &node.fields {
            for value in fields.values() {
                match value {
                    FieldValue::Single(item) => {
                        if let Some(text) = &item.text {
                            parts.push(text.clone());
                        }
                    }
                    FieldValue::Multiple(items) => {
                        for item in items {
                            if let Some(text) = &item.text {
                                parts.push(text.clone());
                            }
                        }
                    }
                    FieldValue::Text(text) => parts.push(text.clone()),
                }
            }
        }
        if let Some(children) = &node.children {
            for child in children {
                if let Some(text) = &child.text {
                    parts.push(text.clone());
                }
            }
        }
        if !parts.is_empty() {
            return Ok(parts.join(""));
        }
    }
    Err(::askama::Error::Custom(
        format!("render_dispatch: no template for kind '{}'", node.type_).into(),
    ))
}

fn render_hidden_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = _ArrowFunctionUCallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = _ArrowFunctionParameterTemplate {
        parameter: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionCallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = CallExpressionMemberTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_call_expression_template_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallExpressionTemplateCallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_class_body_member(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyMemberTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_body_method_sig(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyMethodSigTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_body_method(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let template = ClassBodyMethodTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
    };
    template.render()
}

fn render_hidden_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ClassHeritageExtendsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ClassHeritageImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw_value(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = ExportStatementDefaultDeclArmDefaultKwValueTemplate {
        children: children.as_list_view(),
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm_default_kw(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let template = ExportStatementDefaultDeclArmDefaultKwTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_decl_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration", "decorator"])?;
    let field_0 = resolve_field(node, "declaration", false)?;
    let field_1 = resolve_field(node, "decorator", false)?;
    let template = ExportStatementDefaultDeclArmTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_scalar(),
        decorator: field_1.as_field_view(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_clause_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmClauseFromTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_ns_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmNsFromTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm_star_from(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", true)?;
    let template = ExportStatementDefaultFromArmStarFromTemplate {
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_export_statement_default_from_arm(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementDefaultFromArmTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExportStatementEqualsExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ExportStatementNamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let template = _ExportStatementTypeExportTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_let_const_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let template = ForHeaderLetConstKindTemplate {
        children: children.as_list_view(),
        kind: field_0.as_scalar(),
        left: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_lhs(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let template = ForHeaderLhsTemplate {
        left: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_for_header_var_kind(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["kind", "left", "value"])?;
    let field_0 = resolve_field(node, "kind", true)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = ForHeaderVarKindTemplate {
        kind: field_0.as_scalar(),
        left: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_hidden_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseDefaultImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseNamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ImportClauseNamespaceImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_import_specifier_as(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierAsTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = _ImportSpecifierNameTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_index_signature_colon(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "name"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = IndexSignatureColonTemplate {
        index_type: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _IndexSignatureMappedTypeClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_initializer(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = InitializerTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_interface_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = InterfaceBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_lhs_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LhsExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_number(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = _NumberTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _ParenthesizedExpressionSequenceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_parenthesized_expression_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let template = ParenthesizedExpressionTypedTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_property_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PropertyIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_public_field_definition_abstract_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", true)?;
    let field_1 = resolve_field(node, "readonly_marker", false)?;
    let template = PublicFieldDefinitionAbstractFirstTemplate {
        abstract_marker: field_0.as_scalar(),
        readonly_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_access_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declare_marker"])?;
    let field_0 = resolve_field(node, "declare_marker", false)?;
    let template = PublicFieldDefinitionAccessFirstTemplate {
        children: children.as_list_view(),
        declare_marker: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_accessor_opt(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessor_marker"])?;
    let field_0 = resolve_field(node, "accessor_marker", true)?;
    let template = PublicFieldDefinitionAccessorOptTemplate {
        accessor_marker: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_declare_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PublicFieldDefinitionDeclareFirstTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_public_field_definition_readonly_first(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "readonly_marker"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "readonly_marker", true)?;
    let template = PublicFieldDefinitionReadonlyFirstTemplate {
        abstract_marker: field_0.as_scalar(),
        readonly_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_public_field_definition_static_mods(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["readonly_marker", "static_marker"])?;
    let field_0 = resolve_field(node, "readonly_marker", false)?;
    let field_1 = resolve_field(node, "static_marker", true)?;
    let template = PublicFieldDefinitionStaticModsTemplate {
        children: children.as_list_view(),
        readonly_marker: field_0.as_scalar(),
        static_marker: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_statement_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StatementIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _StringDoubleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_fragment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringFragmentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _StringSingleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeIdentifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_type_query_call_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionInTypeAnnotationTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = TypeQueryCallExpressionTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["function", "type_arguments"])?;
    let field_0 = resolve_field(node, "function", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeQueryInstantiationExpressionTemplate {
        function: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_member_expression_in_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionInTypeAnnotationTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = TypeQueryMemberExpressionTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_type_query_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = TypeQuerySubscriptExpressionTemplate {
        index: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_update_expression_postfix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPostfixTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_update_expression_prefix(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UpdateExpressionPrefixTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_abstract_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", false)?;
    let field_3 = resolve_field(node, "name", true)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractClassDeclarationTemplate {
        body: field_0.as_scalar(),
        class_heritage: field_1.as_scalar(),
        decorator: field_2.as_field_view(),
        name: field_3.as_scalar(),
        type_parameters: field_4.as_scalar(),
    };
    template.render()
}

fn render_abstract_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "name", "optional_marker", "override_modifier", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "optional_marker", false)?;
    let field_4 = resolve_field(node, "override_modifier", false)?;
    let field_5 = resolve_field(node, "parameters", true)?;
    let field_6 = resolve_field(node, "return_type", false)?;
    let field_7 = resolve_field(node, "type_parameters", false)?;
    let template = AbstractMethodSignatureTemplate {
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        name: field_2.as_scalar(),
        optional_marker: field_3.as_scalar(),
        override_modifier: field_4.as_scalar(),
        parameters: field_5.as_scalar(),
        return_type: field_6.as_scalar(),
        type_parameters: field_7.as_scalar(),
    };
    template.render()
}

fn render_adding_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AddingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_ambient_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declaration"])?;
    let field_0 = resolve_field(node, "declaration", true)?;
    let template = AmbientDeclarationTemplate {
        children: children.as_list_view(),
        declaration: field_0.as_field_view(),
    };
    template.render()
}

fn render_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArgumentsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_array_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArrayPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_array_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = ArrayTypeTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_array(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArrayTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_arrow_function_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = ArrowFunctionUCallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_arrow_function_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameter"])?;
    let field_0 = resolve_field(node, "parameter", true)?;
    let template = ArrowFunctionParameterTemplate {
        parameter: field_0.as_scalar(),
    };
    template.render()
}

fn render_arrow_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let template = ArrowFunctionTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
    };
    template.render()
}

fn render_as_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let template = AsExpressionTemplate {
        children: children.as_list_view(),
        expression: field_0.as_scalar(),
        type_annotation: field_1.as_scalar(),
    };
    template.render()
}

fn render_asserts_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["asserts"])?;
    let field_0 = resolve_field(node, "asserts", true)?;
    let template = AssertsAnnotationTemplate {
        asserts: field_0.as_field_view(),
    };
    template.render()
}

fn render_asserts(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AssertsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "using_marker"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "using_marker", false)?;
    let template = AssignmentExpressionTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
        using_marker: field_2.as_scalar(),
    };
    template.render()
}

fn render_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = AssignmentPatternTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_augmented_assignment_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentExpressionTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_await_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = AwaitExpressionTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_binary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryExpressionTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_break_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = BreakStatementTemplate {
        label: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = CallExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_call_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", false)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = CallSignatureTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_catch_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameter", "type"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameter", false)?;
    let field_2 = resolve_field(node, "type", false)?;
    let template = CatchClauseTemplate {
        body: field_0.as_scalar(),
        parameter: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_class_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "class_heritage", false)?;
    let field_3 = resolve_field(node, "decorator", false)?;
    let field_4 = resolve_field(node, "name", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = ClassDeclarationTemplate {
        automatic_semicolon: field_0.as_scalar(),
        body: field_1.as_scalar(),
        class_heritage: field_2.as_scalar(),
        decorator: field_3.as_field_view(),
        name: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_class_heritage_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageExtendsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_heritage_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_heritage(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ClassHeritageTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_class_static_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ClassStaticBlockTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_class(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "class_heritage", "decorator", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "class_heritage", false)?;
    let field_2 = resolve_field(node, "decorator", false)?;
    let field_3 = resolve_field(node, "name", false)?;
    let field_4 = resolve_field(node, "type_parameters", false)?;
    let template = ClassTemplate {
        body: field_0.as_scalar(),
        class_heritage: field_1.as_scalar(),
        decorator: field_2.as_field_view(),
        name: field_3.as_scalar(),
        type_parameters: field_4.as_scalar(),
    };
    template.render()
}

fn render_computed_property_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ComputedPropertyNameTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_conditional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "consequence", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let field_2 = resolve_field(node, "left", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let template = ConditionalTypeTemplate {
        alternative: field_0.as_scalar(),
        consequence: field_1.as_scalar(),
        left: field_2.as_scalar(),
        right: field_3.as_scalar(),
    };
    template.render()
}

fn render_constraint(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ConstraintTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_construct_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructSignatureTemplate {
        abstract_marker: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_constructor_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["abstract_marker", "parameters", "type", "type_parameters"])?;
    let field_0 = resolve_field(node, "abstract_marker", false)?;
    let field_1 = resolve_field(node, "parameters", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ConstructorTypeTemplate {
        abstract_marker: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_continue_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["label", "semicolon"])?;
    let field_0 = resolve_field(node, "label", false)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = ContinueStatementTemplate {
        label: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_debugger_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = DebuggerStatementTemplate {
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_decorator_call_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = DecoratorCallExpressionTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_decorator_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = DecoratorMemberExpressionTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_decorator_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DecoratorParenthesizedExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DecoratorTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_default_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = DefaultTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_do_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "semicolon"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "semicolon", false)?;
    let template = DoStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["statement"])?;
    let field_0 = resolve_field(node, "statement", true)?;
    let template = ElseClauseTemplate {
        statement: field_0.as_scalar(),
    };
    template.render()
}

fn render_enum_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = EnumAssignmentTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_enum_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let template = EnumBodyTemplate {
        children: children.as_list_view(),
        name: field_0.as_list_view(),
    };
    template.render()
}

fn render_enum_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "const_marker", "name"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "const_marker", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = EnumDeclarationTemplate {
        body: field_0.as_scalar(),
        const_marker: field_1.as_scalar(),
        name: field_2.as_scalar(),
    };
    template.render()
}

fn render_export_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "export_kind", "name"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "export_kind", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let template = ExportSpecifierTemplate {
        alias: field_0.as_scalar(),
        export_kind: field_1.as_scalar(),
        name: field_2.as_scalar(),
    };
    template.render()
}

fn render_export_statement_equals_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementEqualsExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_statement_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementNamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_export_statement_type_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["source"])?;
    let field_0 = resolve_field(node, "source", false)?;
    let template = ExportStatementTypeExportTemplate {
        children: children.as_list_view(),
        source: field_0.as_scalar(),
    };
    template.render()
}

fn render_export_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExportStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ExpressionStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_extends_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_arguments", "value"])?;
    let field_0 = resolve_field(node, "type_arguments", false)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = ExtendsClauseTemplate {
        type_arguments: field_0.as_field_view(),
        value: field_1.as_field_view(),
    };
    template.render()
}

fn render_extends_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ExtendsTypeClauseTemplate {
        r#type: field_0.as_field_view(),
    };
    template.render()
}

fn render_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "property", "static_marker", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "property", true)?;
    let field_2 = resolve_field(node, "static_marker", false)?;
    let field_3 = resolve_field(node, "value", false)?;
    let template = FieldDefinitionTemplate {
        decorator: field_0.as_field_view(),
        property: field_1.as_scalar(),
        static_marker: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = FinallyClauseTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_flow_maybe_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = FlowMaybeTypeTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_for_in_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["await_marker", "body", "operator", "right"])?;
    let field_0 = resolve_field(node, "await_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "operator", true)?;
    let field_3 = resolve_field(node, "right", true)?;
    let template = ForInStatementTemplate {
        children: children.as_list_view(),
        await_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        operator: field_2.as_scalar(),
        right: field_3.as_scalar(),
    };
    template.render()
}

fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition", "increment", "initializer"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "increment", false)?;
    let field_3 = resolve_field(node, "initializer", true)?;
    let template = ForStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        increment: field_2.as_scalar(),
        initializer: field_3.as_scalar(),
    };
    template.render()
}

fn render_formal_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormalParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionDeclarationTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionExpressionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "name", "parameters", "return_type", "semicolon", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "parameters", true)?;
    let field_3 = resolve_field(node, "return_type", false)?;
    let field_4 = resolve_field(node, "semicolon", true)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionSignatureTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        name: field_1.as_scalar(),
        parameters: field_2.as_scalar(),
        return_type: field_3.as_scalar(),
        semicolon: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_function_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "parameters", true)?;
    let field_1 = resolve_field(node, "return_type", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionTypeTemplate {
        parameters: field_0.as_scalar(),
        return_type: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
    };
    template.render()
}

fn render_generator_function_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = GeneratorFunctionDeclarationTemplate {
        children: children.as_list_view(),
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_generator_function(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", false)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = GeneratorFunctionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type_arguments"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = GenericTypeTemplate {
        name: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfStatementTemplate {
        alternative: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_implements_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImplementsClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_alias(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = ImportAliasTemplate {
        children: children.as_list_view(),
        name: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_import_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let template = ImportAttributeTemplate {
        object: field_0.as_field_view(),
    };
    template.render()
}

fn render_import_clause_default_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseDefaultImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseNamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseNamespaceImportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ImportClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_import_require_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "source"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "source", true)?;
    let template = ImportRequireClauseTemplate {
        identifier: field_0.as_scalar(),
        source: field_1.as_scalar(),
    };
    template.render()
}

fn render_import_specifier_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = ImportSpecifierNameTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_import_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_kind"])?;
    let field_0 = resolve_field(node, "import_kind", false)?;
    let template = ImportSpecifierTemplate {
        children: children.as_list_view(),
        import_kind: field_0.as_scalar(),
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["import_attribute", "import_clause", "semicolon", "source"])?;
    let field_0 = resolve_field(node, "import_attribute", false)?;
    let field_1 = resolve_field(node, "import_clause", false)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let field_3 = resolve_field(node, "source", false)?;
    let template = ImportStatementTemplate {
        children: children.as_list_view(),
        import_attribute: field_0.as_scalar(),
        import_clause: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
        source: field_3.as_scalar(),
    };
    template.render()
}

fn render_index_signature_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = IndexSignatureMappedTypeClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_index_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["sign", "type"])?;
    let field_0 = resolve_field(node, "sign", false)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = IndexSignatureTemplate {
        children: children.as_list_view(),
        sign: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_index_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_type"])?;
    let field_0 = resolve_field(node, "primary_type", true)?;
    let template = IndexTypeQueryTemplate {
        primary_type: field_0.as_scalar(),
    };
    template.render()
}

fn render_infer_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type", "type_identifier"])?;
    let field_0 = resolve_field(node, "type", false)?;
    let field_1 = resolve_field(node, "type_identifier", true)?;
    let template = InferTypeTemplate {
        r#type: field_0.as_scalar(),
        type_identifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_instantiation_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = InstantiationExpressionTemplate {
        expression: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_interface_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "extends_type_clause", "name", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "extends_type_clause", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = InterfaceDeclarationTemplate {
        body: field_0.as_scalar(),
        extends_type_clause: field_1.as_scalar(),
        name: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_internal_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = InternalModuleTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_intersection_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = IntersectionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_jsx_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxAttributeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", false)?;
    let template = JsxClosingElementTemplate {
        name: field_0.as_scalar(),
    };
    template.render()
}

fn render_jsx_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["close_tag", "open_tag"])?;
    let field_0 = resolve_field(node, "close_tag", true)?;
    let field_1 = resolve_field(node, "open_tag", true)?;
    let template = JsxElementTemplate {
        children: children.as_list_view(),
        close_tag: field_0.as_scalar(),
        open_tag: field_1.as_scalar(),
    };
    template.render()
}

fn render_jsx_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_namespace_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = JsxNamespaceNameTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_jsx_opening_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", false)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = JsxOpeningElementTemplate {
        attribute: field_0.as_field_view(),
        name: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_jsx_self_closing_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "name", "type_arguments"])?;
    let field_0 = resolve_field(node, "attribute", false)?;
    let field_1 = resolve_field(node, "name", false)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = JsxSelfClosingElementTemplate {
        attribute: field_0.as_field_view(),
        name: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_labeled_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "label"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "label", true)?;
    let template = LabeledStatementTemplate {
        body: field_0.as_scalar(),
        label: field_1.as_scalar(),
    };
    template.render()
}

fn render_lexical_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "kind", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "kind", true)?;
    let field_2 = resolve_field(node, "semicolon", true)?;
    let template = LexicalDeclarationTemplate {
        declarators: field_0.as_field_view(),
        kind: field_1.as_scalar(),
        semicolon: field_2.as_scalar(),
    };
    template.render()
}

fn render_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LiteralTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_lookup_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index_type", "primary_type"])?;
    let field_0 = resolve_field(node, "index_type", true)?;
    let field_1 = resolve_field(node, "primary_type", true)?;
    let template = LookupTypeTemplate {
        index_type: field_0.as_scalar(),
        primary_type: field_1.as_scalar(),
    };
    template.render()
}

fn render_mapped_type_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name", "type"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = MappedTypeClauseTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_member_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "optional_chain", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "optional_chain", false)?;
    let field_2 = resolve_field(node, "property", true)?;
    let template = MemberExpressionTemplate {
        object: field_0.as_scalar(),
        optional_chain: field_1.as_scalar(),
        property: field_2.as_scalar(),
    };
    template.render()
}

fn render_method_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "body", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "async_marker", false)?;
    let field_3 = resolve_field(node, "body", true)?;
    let field_4 = resolve_field(node, "name", true)?;
    let field_5 = resolve_field(node, "optional_marker", false)?;
    let field_6 = resolve_field(node, "override_modifier", false)?;
    let field_7 = resolve_field(node, "parameters", true)?;
    let field_8 = resolve_field(node, "readonly_marker", false)?;
    let field_9 = resolve_field(node, "return_type", false)?;
    let field_10 = resolve_field(node, "static_marker", false)?;
    let field_11 = resolve_field(node, "type_parameters", false)?;
    let template = MethodDefinitionTemplate {
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        async_marker: field_2.as_scalar(),
        body: field_3.as_scalar(),
        name: field_4.as_scalar(),
        optional_marker: field_5.as_scalar(),
        override_modifier: field_6.as_scalar(),
        parameters: field_7.as_scalar(),
        readonly_marker: field_8.as_scalar(),
        return_type: field_9.as_scalar(),
        static_marker: field_10.as_scalar(),
        type_parameters: field_11.as_scalar(),
    };
    template.render()
}

fn render_method_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "accessor_kind", "async_marker", "name", "optional_marker", "override_modifier", "parameters", "readonly_marker", "return_type", "static_marker", "type_parameters"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "accessor_kind", false)?;
    let field_2 = resolve_field(node, "async_marker", false)?;
    let field_3 = resolve_field(node, "name", true)?;
    let field_4 = resolve_field(node, "optional_marker", false)?;
    let field_5 = resolve_field(node, "override_modifier", false)?;
    let field_6 = resolve_field(node, "parameters", true)?;
    let field_7 = resolve_field(node, "readonly_marker", false)?;
    let field_8 = resolve_field(node, "return_type", false)?;
    let field_9 = resolve_field(node, "static_marker", false)?;
    let field_10 = resolve_field(node, "type_parameters", false)?;
    let template = MethodSignatureTemplate {
        accessibility_modifier: field_0.as_scalar(),
        accessor_kind: field_1.as_scalar(),
        async_marker: field_2.as_scalar(),
        name: field_3.as_scalar(),
        optional_marker: field_4.as_scalar(),
        override_modifier: field_5.as_scalar(),
        parameters: field_6.as_scalar(),
        readonly_marker: field_7.as_scalar(),
        return_type: field_8.as_scalar(),
        static_marker: field_9.as_scalar(),
        type_parameters: field_10.as_scalar(),
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = ModuleTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_named_imports(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NamedImportsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_namespace_export(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NamespaceExportTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_namespace_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = NamespaceImportTemplate {
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_nested_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["object", "property"])?;
    let field_0 = resolve_field(node, "object", true)?;
    let field_1 = resolve_field(node, "property", true)?;
    let template = NestedIdentifierTemplate {
        object: field_0.as_scalar(),
        property: field_1.as_scalar(),
    };
    template.render()
}

fn render_nested_type_identifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module", "name"])?;
    let field_0 = resolve_field(node, "module", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = NestedTypeIdentifierTemplate {
        module: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_new_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "constructor", "type_arguments"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "constructor", true)?;
    let field_2 = resolve_field(node, "type_arguments", false)?;
    let template = NewExpressionTemplate {
        arguments: field_0.as_scalar(),
        constructor: field_1.as_scalar(),
        type_arguments: field_2.as_scalar(),
    };
    template.render()
}

fn render_non_null_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = NonNullExpressionTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_object_assignment_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = ObjectAssignmentPatternTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_object_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ObjectPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_object_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["closing", "members", "opening"])?;
    let field_0 = resolve_field(node, "closing", true)?;
    let field_1 = resolve_field(node, "members", false)?;
    let field_2 = resolve_field(node, "opening", true)?;
    let template = ObjectTypeTemplate {
        closing: field_0.as_scalar(),
        members: field_1.as_field_view(),
        opening: field_2.as_scalar(),
    };
    template.render()
}

fn render_object(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ObjectTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_omitting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OmittingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_opting_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptingTypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_optional_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = OptionalParameterTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        pattern: field_1.as_scalar(),
        readonly_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_optional_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = OptionalTupleParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_optional_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = OptionalTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_pair_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairPatternTemplate {
        key: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairTemplate {
        key: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_parenthesized_expression_sequence(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedExpressionSequenceTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_parenthesized_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ParenthesizedTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_program(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["hash_bang_line", "statements"])?;
    let field_0 = resolve_field(node, "hash_bang_line", false)?;
    let field_1 = resolve_field(node, "statements", false)?;
    let template = ProgramTemplate {
        hash_bang_line: field_0.as_scalar(),
        statements: field_1.as_field_view(),
    };
    template.render()
}

fn render_property_signature(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["accessibility_modifier", "name", "optional_marker", "override_modifier", "readonly_marker", "static_marker", "type"])?;
    let field_0 = resolve_field(node, "accessibility_modifier", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optional_marker", false)?;
    let field_3 = resolve_field(node, "override_modifier", false)?;
    let field_4 = resolve_field(node, "readonly_marker", false)?;
    let field_5 = resolve_field(node, "static_marker", false)?;
    let field_6 = resolve_field(node, "type", false)?;
    let template = PropertySignatureTemplate {
        accessibility_modifier: field_0.as_scalar(),
        name: field_1.as_scalar(),
        optional_marker: field_2.as_scalar(),
        override_modifier: field_3.as_scalar(),
        readonly_marker: field_4.as_scalar(),
        static_marker: field_5.as_scalar(),
        r#type: field_6.as_scalar(),
    };
    template.render()
}

fn render_public_field_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "name", "optionality_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "optionality_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = PublicFieldDefinitionTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        name: field_1.as_scalar(),
        optionality_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_readonly_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = ReadonlyTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_regex(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["flags", "pattern"])?;
    let field_0 = resolve_field(node, "flags", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let template = RegexTemplate {
        flags: field_0.as_scalar(),
        pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_required_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["decorator", "pattern", "readonly_marker", "type", "value"])?;
    let field_0 = resolve_field(node, "decorator", false)?;
    let field_1 = resolve_field(node, "pattern", true)?;
    let field_2 = resolve_field(node, "readonly_marker", false)?;
    let field_3 = resolve_field(node, "type", false)?;
    let field_4 = resolve_field(node, "value", false)?;
    let template = RequiredParameterTemplate {
        children: children.as_list_view(),
        decorator: field_0.as_field_view(),
        pattern: field_1.as_scalar(),
        readonly_marker: field_2.as_scalar(),
        r#type: field_3.as_scalar(),
        value: field_4.as_scalar(),
    };
    template.render()
}

fn render_rest_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = RestPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_rest_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = RestTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ReturnStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_satisfies_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_annotation"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_annotation", true)?;
    let template = SatisfiesExpressionTemplate {
        expression: field_0.as_scalar(),
        type_annotation: field_1.as_scalar(),
    };
    template.render()
}

fn render_sequence_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SequenceExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_spread_element(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = SpreadElementTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_statement_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["automatic_semicolon", "statements"])?;
    let field_0 = resolve_field(node, "automatic_semicolon", false)?;
    let field_1 = resolve_field(node, "statements", false)?;
    let template = StatementBlockTemplate {
        automatic_semicolon: field_0.as_scalar(),
        statements: field_1.as_field_view(),
    };
    template.render()
}

fn render_string_double(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringDoubleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string_single(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringSingleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_subscript_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["index", "object", "optional_chain"])?;
    let field_0 = resolve_field(node, "index", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let field_2 = resolve_field(node, "optional_chain", false)?;
    let template = SubscriptExpressionTemplate {
        index: field_0.as_scalar(),
        object: field_1.as_scalar(),
        optional_chain: field_2.as_scalar(),
    };
    template.render()
}

fn render_switch_body(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SwitchBodyTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_switch_case(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SwitchCaseTemplate {
        body: field_0.as_field_view(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_switch_default(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", false)?;
    let template = SwitchDefaultTemplate {
        body: field_0.as_field_view(),
    };
    template.render()
}

fn render_switch_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "value"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SwitchStatementTemplate {
        body: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_template_literal_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateLiteralTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateStringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_substitution(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateSubstitutionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_template_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TemplateTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_ternary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = TernaryExpressionTemplate {
        alternative: field_0.as_scalar(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_throw_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["semicolon"])?;
    let field_0 = resolve_field(node, "semicolon", true)?;
    let template = ThrowStatementTemplate {
        children: children.as_list_view(),
        semicolon: field_0.as_scalar(),
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "finalizer", "handler"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "finalizer", false)?;
    let field_2 = resolve_field(node, "handler", false)?;
    let template = TryStatementTemplate {
        body: field_0.as_scalar(),
        finalizer: field_1.as_scalar(),
        handler: field_2.as_scalar(),
    };
    template.render()
}

fn render_tuple_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TupleParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_tuple_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TupleTypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_alias_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "semicolon", "type_parameters", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let field_2 = resolve_field(node, "type_parameters", false)?;
    let field_3 = resolve_field(node, "value", true)?;
    let template = TypeAliasDeclarationTemplate {
        name: field_0.as_scalar(),
        semicolon: field_1.as_scalar(),
        type_parameters: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_type_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TypeAnnotationTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_type_arguments(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeArgumentsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_assertion(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "type_arguments"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "type_arguments", true)?;
    let template = TypeAssertionTemplate {
        expression: field_0.as_scalar(),
        type_arguments: field_1.as_scalar(),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["const_marker", "constraint", "name", "value"])?;
    let field_0 = resolve_field(node, "const_marker", false)?;
    let field_1 = resolve_field(node, "constraint", false)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "value", false)?;
    let template = TypeParameterTemplate {
        const_marker: field_0.as_scalar(),
        constraint: field_1.as_scalar(),
        name: field_2.as_scalar(),
        value: field_3.as_scalar(),
    };
    template.render()
}

fn render_type_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_predicate_annotation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type_predicate"])?;
    let field_0 = resolve_field(node, "type_predicate", true)?;
    let template = TypePredicateAnnotationTemplate {
        type_predicate: field_0.as_field_view(),
    };
    template.render()
}

fn render_type_predicate(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = TypePredicateTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_type_query(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeQueryTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_unary_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryExpressionTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", false)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_update_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UpdateExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_variable_declaration(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["declarators", "semicolon"])?;
    let field_0 = resolve_field(node, "declarators", true)?;
    let field_1 = resolve_field(node, "semicolon", true)?;
    let template = VariableDeclarationTemplate {
        declarators: field_0.as_field_view(),
        semicolon: field_1.as_scalar(),
    };
    template.render()
}

fn render_variable_declarator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", false)?;
    let field_2 = resolve_field(node, "value", false)?;
    let template = VariableDeclaratorTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "condition"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        body: field_0.as_scalar(),
        condition: field_1.as_scalar(),
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "object"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = WithStatementTemplate {
        body: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_yield_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", false)?;
    let template = YieldExpressionTemplate {
        children: children.as_list_view(),
        expression: field_0.as_scalar(),
    };
    template.render()
}


pub fn render_dispatch(node: &::sittir_core::types::NodeData) -> Result<String, ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
    }
    match node.type_.as_str() {
        "_arrow_function__call_signature" => render_hidden_arrow_function_call_signature(node),
        "_arrow_function_parameter" => render_hidden_arrow_function_parameter(node),
        "_call_expression_call" | "call_expression_call" => render_hidden_call_expression_call(node),
        "_call_expression_member" | "call_expression_member" => render_hidden_call_expression_member(node),
        "_call_expression_template_call" | "call_expression_template_call" => render_hidden_call_expression_template_call(node),
        "_class_body_member" | "class_body_member" => render_hidden_class_body_member(node),
        "_class_body_method_sig" | "class_body_method_sig" => render_hidden_class_body_method_sig(node),
        "_class_body_method" | "class_body_method" => render_hidden_class_body_method(node),
        "_class_heritage_extends_clause" => render_hidden_class_heritage_extends_clause(node),
        "_class_heritage_implements_clause" => render_hidden_class_heritage_implements_clause(node),
        "_export_statement_default_decl_arm_default_kw_value" | "export_statement_default_decl_arm_default_kw_value" => render_hidden_export_statement_default_decl_arm_default_kw_value(node),
        "_export_statement_default_decl_arm_default_kw" | "export_statement_default_decl_arm_default_kw" => render_hidden_export_statement_default_decl_arm_default_kw(node),
        "_export_statement_default_decl_arm" | "export_statement_default_decl_arm" => render_hidden_export_statement_default_decl_arm(node),
        "_export_statement_default_from_arm_clause_from" | "export_statement_default_from_arm_clause_from" => render_hidden_export_statement_default_from_arm_clause_from(node),
        "_export_statement_default_from_arm_ns_from" | "export_statement_default_from_arm_ns_from" => render_hidden_export_statement_default_from_arm_ns_from(node),
        "_export_statement_default_from_arm_star_from" | "export_statement_default_from_arm_star_from" => render_hidden_export_statement_default_from_arm_star_from(node),
        "_export_statement_default_from_arm" | "export_statement_default_from_arm" => render_hidden_export_statement_default_from_arm(node),
        "_export_statement_equals_export" => render_hidden_export_statement_equals_export(node),
        "_export_statement_namespace_export" => render_hidden_export_statement_namespace_export(node),
        "_export_statement_type_export" => render_hidden_export_statement_type_export(node),
        "_for_header_let_const_kind" | "for_header_let_const_kind" => render_hidden_for_header_let_const_kind(node),
        "_for_header_lhs" | "for_header_lhs" => render_hidden_for_header_lhs(node),
        "_for_header_var_kind" | "for_header_var_kind" => render_hidden_for_header_var_kind(node),
        "_import_clause_default_import" => render_hidden_import_clause_default_import(node),
        "_import_clause_named_imports" => render_hidden_import_clause_named_imports(node),
        "_import_clause_namespace_import" => render_hidden_import_clause_namespace_import(node),
        "_import_specifier_as" | "import_specifier_as" => render_hidden_import_specifier_as(node),
        "_import_specifier_name" => render_hidden_import_specifier_name(node),
        "_index_signature_colon" | "index_signature_colon" => render_hidden_index_signature_colon(node),
        "_index_signature_mapped_type_clause" => render_hidden_index_signature_mapped_type_clause(node),
        "_initializer" | "initializer" => render_hidden_initializer(node),
        "_interface_body" | "interface_body" => render_hidden_interface_body(node),
        "_lhs_expression" | "lhs_expression" => render_hidden_lhs_expression(node),
        "_number" | "number" => render_hidden_number(node),
        "_parenthesized_expression_sequence" => render_hidden_parenthesized_expression_sequence(node),
        "_parenthesized_expression_typed" | "parenthesized_expression_typed" => render_hidden_parenthesized_expression_typed(node),
        "_property_identifier" | "property_identifier" => render_hidden_property_identifier(node),
        "_public_field_definition_abstract_first" | "public_field_definition_abstract_first" => render_hidden_public_field_definition_abstract_first(node),
        "_public_field_definition_access_first" | "public_field_definition_access_first" => render_hidden_public_field_definition_access_first(node),
        "_public_field_definition_accessor_opt" | "public_field_definition_accessor_opt" => render_hidden_public_field_definition_accessor_opt(node),
        "_public_field_definition_declare_first" | "public_field_definition_declare_first" => render_hidden_public_field_definition_declare_first(node),
        "_public_field_definition_readonly_first" | "public_field_definition_readonly_first" => render_hidden_public_field_definition_readonly_first(node),
        "_public_field_definition_static_mods" | "public_field_definition_static_mods" => render_hidden_public_field_definition_static_mods(node),
        "_statement_identifier" | "statement_identifier" => render_hidden_statement_identifier(node),
        "_string_double" => render_hidden_string_double(node),
        "_string_fragment" | "string_fragment" => render_hidden_string_fragment(node),
        "_string_single" => render_hidden_string_single(node),
        "_type_identifier" | "type_identifier" => render_hidden_type_identifier(node),
        "_type_query_call_expression_in_type_annotation" | "type_query_call_expression_in_type_annotation" => render_hidden_type_query_call_expression_in_type_annotation(node),
        "_type_query_call_expression" | "type_query_call_expression" => render_hidden_type_query_call_expression(node),
        "_type_query_instantiation_expression" | "type_query_instantiation_expression" => render_hidden_type_query_instantiation_expression(node),
        "_type_query_member_expression_in_type_annotation" | "type_query_member_expression_in_type_annotation" => render_hidden_type_query_member_expression_in_type_annotation(node),
        "_type_query_member_expression" | "type_query_member_expression" => render_hidden_type_query_member_expression(node),
        "_type_query_subscript_expression" | "type_query_subscript_expression" => render_hidden_type_query_subscript_expression(node),
        "_update_expression_postfix" | "update_expression_postfix" => render_hidden_update_expression_postfix(node),
        "_update_expression_prefix" | "update_expression_prefix" => render_hidden_update_expression_prefix(node),
        "abstract_class_declaration" => render_abstract_class_declaration(node),
        "abstract_method_signature" => render_abstract_method_signature(node),
        "adding_type_annotation" => render_adding_type_annotation(node),
        "ambient_declaration" => render_ambient_declaration(node),
        "arguments" => render_arguments(node),
        "array_pattern" => render_array_pattern(node),
        "array_type" => render_array_type(node),
        "array" => render_array(node),
        "arrow_function__call_signature" => render_arrow_function_call_signature(node),
        "arrow_function_parameter" => render_arrow_function_parameter(node),
        "arrow_function" => render_arrow_function(node),
        "as_expression" => render_as_expression(node),
        "asserts_annotation" => render_asserts_annotation(node),
        "asserts" => render_asserts(node),
        "assignment_expression" => render_assignment_expression(node),
        "assignment_pattern" => render_assignment_pattern(node),
        "augmented_assignment_expression" => render_augmented_assignment_expression(node),
        "await_expression" => render_await_expression(node),
        "binary_expression" => render_binary_expression(node),
        "break_statement" => render_break_statement(node),
        "call_expression" => render_call_expression(node),
        "call_signature" => render_call_signature(node),
        "catch_clause" => render_catch_clause(node),
        "class_body" => render_class_body(node),
        "class_declaration" => render_class_declaration(node),
        "class_heritage_extends_clause" => render_class_heritage_extends_clause(node),
        "class_heritage_implements_clause" => render_class_heritage_implements_clause(node),
        "class_heritage" => render_class_heritage(node),
        "class_static_block" => render_class_static_block(node),
        "class" => render_class(node),
        "computed_property_name" => render_computed_property_name(node),
        "conditional_type" => render_conditional_type(node),
        "constraint" => render_constraint(node),
        "construct_signature" => render_construct_signature(node),
        "constructor_type" => render_constructor_type(node),
        "continue_statement" => render_continue_statement(node),
        "debugger_statement" => render_debugger_statement(node),
        "decorator_call_expression" => render_decorator_call_expression(node),
        "decorator_member_expression" => render_decorator_member_expression(node),
        "decorator_parenthesized_expression" => render_decorator_parenthesized_expression(node),
        "decorator" => render_decorator(node),
        "default_type" => render_default_type(node),
        "do_statement" => render_do_statement(node),
        "else_clause" => render_else_clause(node),
        "enum_assignment" => render_enum_assignment(node),
        "enum_body" => render_enum_body(node),
        "enum_declaration" => render_enum_declaration(node),
        "export_clause" => render_export_clause(node),
        "export_specifier" => render_export_specifier(node),
        "export_statement_equals_export" => render_export_statement_equals_export(node),
        "export_statement_namespace_export" => render_export_statement_namespace_export(node),
        "export_statement_type_export" => render_export_statement_type_export(node),
        "export_statement" => render_export_statement(node),
        "expression_statement" => render_expression_statement(node),
        "extends_clause" => render_extends_clause(node),
        "extends_type_clause" => render_extends_type_clause(node),
        "field_definition" => render_field_definition(node),
        "finally_clause" => render_finally_clause(node),
        "flow_maybe_type" => render_flow_maybe_type(node),
        "for_in_statement" => render_for_in_statement(node),
        "for_statement" => render_for_statement(node),
        "formal_parameters" => render_formal_parameters(node),
        "function_declaration" => render_function_declaration(node),
        "function_expression" => render_function_expression(node),
        "function_signature" => render_function_signature(node),
        "function_type" => render_function_type(node),
        "generator_function_declaration" => render_generator_function_declaration(node),
        "generator_function" => render_generator_function(node),
        "generic_type" => render_generic_type(node),
        "if_statement" => render_if_statement(node),
        "implements_clause" => render_implements_clause(node),
        "import_alias" => render_import_alias(node),
        "import_attribute" => render_import_attribute(node),
        "import_clause_default_import" => render_import_clause_default_import(node),
        "import_clause_named_imports" => render_import_clause_named_imports(node),
        "import_clause_namespace_import" => render_import_clause_namespace_import(node),
        "import_clause" => render_import_clause(node),
        "import_require_clause" => render_import_require_clause(node),
        "import_specifier_name" => render_import_specifier_name(node),
        "import_specifier" => render_import_specifier(node),
        "import_statement" => render_import_statement(node),
        "index_signature_mapped_type_clause" => render_index_signature_mapped_type_clause(node),
        "index_signature" => render_index_signature(node),
        "index_type_query" => render_index_type_query(node),
        "infer_type" => render_infer_type(node),
        "instantiation_expression" => render_instantiation_expression(node),
        "interface_declaration" => render_interface_declaration(node),
        "internal_module" => render_internal_module(node),
        "intersection_type" => render_intersection_type(node),
        "jsx_attribute" => render_jsx_attribute(node),
        "jsx_closing_element" => render_jsx_closing_element(node),
        "jsx_element" => render_jsx_element(node),
        "jsx_expression" => render_jsx_expression(node),
        "jsx_namespace_name" => render_jsx_namespace_name(node),
        "jsx_opening_element" => render_jsx_opening_element(node),
        "jsx_self_closing_element" => render_jsx_self_closing_element(node),
        "labeled_statement" => render_labeled_statement(node),
        "lexical_declaration" => render_lexical_declaration(node),
        "literal_type" => render_literal_type(node),
        "lookup_type" => render_lookup_type(node),
        "mapped_type_clause" => render_mapped_type_clause(node),
        "member_expression" => render_member_expression(node),
        "method_definition" => render_method_definition(node),
        "method_signature" => render_method_signature(node),
        "module" => render_module(node),
        "named_imports" => render_named_imports(node),
        "namespace_export" => render_namespace_export(node),
        "namespace_import" => render_namespace_import(node),
        "nested_identifier" => render_nested_identifier(node),
        "nested_type_identifier" => render_nested_type_identifier(node),
        "new_expression" => render_new_expression(node),
        "non_null_expression" => render_non_null_expression(node),
        "object_assignment_pattern" => render_object_assignment_pattern(node),
        "object_pattern" => render_object_pattern(node),
        "object_type" => render_object_type(node),
        "object" => render_object(node),
        "omitting_type_annotation" => render_omitting_type_annotation(node),
        "opting_type_annotation" => render_opting_type_annotation(node),
        "optional_parameter" => render_optional_parameter(node),
        "optional_tuple_parameter" => render_optional_tuple_parameter(node),
        "optional_type" => render_optional_type(node),
        "pair_pattern" => render_pair_pattern(node),
        "pair" => render_pair(node),
        "parenthesized_expression_sequence" => render_parenthesized_expression_sequence(node),
        "parenthesized_expression" => render_parenthesized_expression(node),
        "parenthesized_type" => render_parenthesized_type(node),
        "program" => render_program(node),
        "property_signature" => render_property_signature(node),
        "public_field_definition" => render_public_field_definition(node),
        "readonly_type" => render_readonly_type(node),
        "regex" => render_regex(node),
        "required_parameter" => render_required_parameter(node),
        "rest_pattern" => render_rest_pattern(node),
        "rest_type" => render_rest_type(node),
        "return_statement" => render_return_statement(node),
        "satisfies_expression" => render_satisfies_expression(node),
        "sequence_expression" => render_sequence_expression(node),
        "spread_element" => render_spread_element(node),
        "statement_block" => render_statement_block(node),
        "string_double" => render_string_double(node),
        "string_single" => render_string_single(node),
        "string" => render_string(node),
        "subscript_expression" => render_subscript_expression(node),
        "switch_body" => render_switch_body(node),
        "switch_case" => render_switch_case(node),
        "switch_default" => render_switch_default(node),
        "switch_statement" => render_switch_statement(node),
        "template_literal_type" => render_template_literal_type(node),
        "template_string" => render_template_string(node),
        "template_substitution" => render_template_substitution(node),
        "template_type" => render_template_type(node),
        "ternary_expression" => render_ternary_expression(node),
        "throw_statement" => render_throw_statement(node),
        "try_statement" => render_try_statement(node),
        "tuple_parameter" => render_tuple_parameter(node),
        "tuple_type" => render_tuple_type(node),
        "type_alias_declaration" => render_type_alias_declaration(node),
        "type_annotation" => render_type_annotation(node),
        "type_arguments" => render_type_arguments(node),
        "type_assertion" => render_type_assertion(node),
        "type_parameter" => render_type_parameter(node),
        "type_parameters" => render_type_parameters(node),
        "type_predicate_annotation" => render_type_predicate_annotation(node),
        "type_predicate" => render_type_predicate(node),
        "type_query" => render_type_query(node),
        "unary_expression" => render_unary_expression(node),
        "union_type" => render_union_type(node),
        "update_expression" => render_update_expression(node),
        "variable_declaration" => render_variable_declaration(node),
        "variable_declarator" => render_variable_declarator(node),
        "while_statement" => render_while_statement(node),
        "with_statement" => render_with_statement(node),
        "yield_expression" => render_yield_expression(node),
        _ => token_shaped_fallback(node),
    }
}

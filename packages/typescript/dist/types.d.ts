import type { TypescriptGrammar } from './grammar.js';
import type { NodeData as BaseNodeData, NodeConfig as BaseNodeConfig, TreeNode as BaseTreeNode, NodeKind, NodeNs, AnyTreeNodeOf as AnyTreeNode, Terminal, NonEmptyArray, BooleanKeyword, KindEnum } from '@sittir/types';
export type { TypescriptGrammar };
export type NodeData<K extends NodeKind<TypescriptGrammar>> = BaseNodeData<TypescriptGrammar, K>;
export type NodeConfig<K extends NodeKind<TypescriptGrammar>> = BaseNodeConfig<TypescriptGrammar, K>;
export type TreeNode<K extends NodeKind<TypescriptGrammar>> = BaseTreeNode<TypescriptGrammar, K>;
export type LeafScalarMap = {};
export type LeafStringMap = {
    __for_header_operator: "in" | "of";
    __number_operator: "-" | "+";
    _abstract_marker: "abstract";
    _accessibility_modifier: "public" | "private" | "protected";
    _accessor_kind: "get" | "set" | "*";
    _async_marker: "async";
    _augmented_assignment_expression_operator: "+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | ">>=" | ">>>=" | "<<=" | "**=" | "&&=" | "||=" | "??=";
    _const_marker: "const";
    _export_specifier_export_kind: "type" | "typeof";
    _import_attribute_object: "with" | "assert";
    _kind: "let" | "const";
    _kw_abstract_marker: "abstract";
    _kw_accessor_marker: "accessor";
    _kw_async_marker: "async";
    _kw_await_marker: "await";
    _kw_const_marker: "const";
    _kw_declare_marker: "declare";
    _kw_readonly_marker: "readonly";
    _kw_static_marker: "static";
    _kw_using_marker: "using";
    _object_type_closing: "}" | "|}";
    _object_type_opening: "{" | "{|";
    _operator: "++" | "--";
    _override_modifier: "override";
    _public_field_definition_optionality_marker: "?" | "!";
    _readonly_marker: "readonly";
    _static_marker: "static";
    _string_opening: "\"" | "'";
    _unary_expression_operator: "!" | "~" | "-" | "+" | "typeof" | "void" | "delete";
    accessibility_modifier: "public" | "private" | "protected";
    false: "false";
    import: "import";
    null: "null";
    override_modifier: "override";
    super: "super";
    this: "this";
    true: "true";
    undefined: "undefined";
    abstract: "abstract";
    global: "global";
    async: "async";
    const: "const";
    export: "export";
    default: "default";
    as: "as";
    namespace: "namespace";
    var: "var";
    from: "from";
    accessor: "accessor";
    await: "await";
    declare: "declare";
    readonly: "readonly";
    static: "static";
    using: "using";
    override: "override";
    instanceof: "instanceof";
    in: "in";
    break: "break";
    catch: "catch";
    extends: "extends";
    new: "new";
    continue: "continue";
    debugger: "debugger";
    do: "do";
    while: "while";
    else: "else";
    enum: "enum";
    finally: "finally";
    for: "for";
    function: "function";
    if: "if";
    implements: "implements";
    require: "require";
    keyof: "keyof";
    infer: "infer";
    interface: "interface";
    return: "return";
    satisfies: "satisfies";
    case: "case";
    switch: "switch";
    throw: "throw";
    try: "try";
    is: "is";
    typeof: "typeof";
    with: "with";
    yield: "yield";
};
export declare const enum SyntaxKind {
    _AmbientDeclarationDeclaration = "_ambient_declaration_declaration",
    AmbientDeclarationGlobal = "_ambient_declaration_global",
    AmbientDeclarationModule = "_ambient_declaration_module",
    _ArrowFunctionUCallSignature = "_arrow_function__call_signature",
    _ArrowFunctionParameter = "_arrow_function_parameter",
    CallExpressionCall = "_call_expression_call",
    CallExpressionMember = "_call_expression_member",
    CallExpressionTemplateCall = "_call_expression_template_call",
    _CallSignature = "_call_signature",
    ClassBodyMember = "_class_body_member",
    ClassBodyMethod = "_class_body_method",
    ClassBodyMethodSig = "_class_body_method_sig",
    _ClassHeritageExtendsClause = "_class_heritage_extends_clause",
    _ClassHeritageImplementsClause = "_class_heritage_implements_clause",
    ExportStatementDefaultDeclArm = "_export_statement_default_decl_arm",
    ExportStatementDefaultDeclArmDefaultKw = "_export_statement_default_decl_arm_default_kw",
    ExportStatementDefaultDeclArmDefaultKwValue = "_export_statement_default_decl_arm_default_kw_value",
    ExportStatementDefaultFromArm = "_export_statement_default_from_arm",
    ExportStatementDefaultFromArmClauseFrom = "_export_statement_default_from_arm_clause_from",
    ExportStatementDefaultFromArmNsFrom = "_export_statement_default_from_arm_ns_from",
    ExportStatementDefaultFromArmStarFrom = "_export_statement_default_from_arm_star_from",
    _ExportStatementEqualsExport = "_export_statement_equals_export",
    _ExportStatementNamespaceExport = "_export_statement_namespace_export",
    _ExportStatementTypeExport = "_export_statement_type_export",
    ExtendsClauseSingle = "_extends_clause_single",
    ForHeader = "_for_header",
    ForHeaderLetConstKind = "_for_header_let_const_kind",
    ForHeaderLhs = "_for_header_lhs",
    ForHeaderVarKind = "_for_header_var_kind",
    FromClause = "_from_clause",
    _ImportClauseDefaultImport = "_import_clause_default_import",
    _ImportClauseNamedImports = "_import_clause_named_imports",
    _ImportClauseNamespaceImport = "_import_clause_namespace_import",
    ImportSpecifierAs = "_import_specifier_as",
    _ImportSpecifierName = "_import_specifier_name",
    IndexSignatureColon = "_index_signature_colon",
    _IndexSignatureMappedTypeClause = "_index_signature_mapped_type_clause",
    Initializer = "_initializer",
    JsxStartOpeningElement = "_jsx_start_opening_element",
    JsxString = "_jsx_string",
    LhsExpression = "_lhs_expression",
    _Module = "_module",
    _Number = "_number",
    ParameterName = "_parameter_name",
    _ParenthesizedExpressionSequence = "_parenthesized_expression_sequence",
    ParenthesizedExpressionTyped = "_parenthesized_expression_typed",
    PublicFieldDefinitionAbstractFirst = "_public_field_definition_abstract_first",
    PublicFieldDefinitionAccessFirst = "_public_field_definition_access_first",
    PublicFieldDefinitionAccessorOpt = "_public_field_definition_accessor_opt",
    PublicFieldDefinitionDeclareFirst = "_public_field_definition_declare_first",
    PublicFieldDefinitionReadonlyFirst = "_public_field_definition_readonly_first",
    PublicFieldDefinitionStaticMods = "_public_field_definition_static_mods",
    TypeQueryCallExpression = "_type_query_call_expression",
    TypeQueryCallExpressionInTypeAnnotation = "_type_query_call_expression_in_type_annotation",
    TypeQueryInstantiationExpression = "_type_query_instantiation_expression",
    TypeQueryMemberExpression = "_type_query_member_expression",
    TypeQueryMemberExpressionInTypeAnnotation = "_type_query_member_expression_in_type_annotation",
    TypeQuerySubscriptExpression = "_type_query_subscript_expression",
    UpdateExpressionPostfix = "_update_expression_postfix",
    UpdateExpressionPrefix = "_update_expression_prefix",
    AbstractClassDeclaration = "abstract_class_declaration",
    AbstractMethodSignature = "abstract_method_signature",
    AddingTypeAnnotation = "adding_type_annotation",
    AmbientDeclarationDeclaration = "ambient_declaration_declaration",
    AmbientDeclaration = "ambient_declaration",
    Arguments = "arguments",
    Array = "array",
    ArrayPattern = "array_pattern",
    ArrayType = "array_type",
    ArrowFunctionParameter = "arrow_function_parameter",
    ArrowFunctionUCallSignature = "arrow_function__call_signature",
    ArrowFunction = "arrow_function",
    AsExpression = "as_expression",
    Asserts = "asserts",
    AssertsAnnotation = "asserts_annotation",
    AssignmentExpression = "assignment_expression",
    AssignmentPattern = "assignment_pattern",
    AugmentedAssignmentExpression = "augmented_assignment_expression",
    AwaitExpression = "await_expression",
    BinaryExpression = "binary_expression",
    BreakStatement = "break_statement",
    CallExpression = "call_expression",
    CallSignature = "call_signature",
    CatchClause = "catch_clause",
    Class = "class",
    ClassBody = "class_body",
    ClassDeclaration = "class_declaration",
    ClassHeritageExtendsClause = "class_heritage_extends_clause",
    ClassHeritageImplementsClause = "class_heritage_implements_clause",
    ClassHeritage = "class_heritage",
    ClassStaticBlock = "class_static_block",
    ComputedPropertyName = "computed_property_name",
    ConditionalType = "conditional_type",
    Constraint = "constraint",
    ConstructSignature = "construct_signature",
    ConstructorType = "constructor_type",
    ContinueStatement = "continue_statement",
    DebuggerStatement = "debugger_statement",
    Decorator = "decorator",
    DecoratorCallExpression = "decorator_call_expression",
    DecoratorMemberExpression = "decorator_member_expression",
    DecoratorParenthesizedExpression = "decorator_parenthesized_expression",
    DefaultType = "default_type",
    DoStatement = "do_statement",
    ElseClause = "else_clause",
    EnumAssignment = "enum_assignment",
    EnumBody = "enum_body",
    EnumDeclaration = "enum_declaration",
    ExportClause = "export_clause",
    ExportSpecifier = "export_specifier",
    ExportStatementTypeExport = "export_statement_type_export",
    ExportStatementEqualsExport = "export_statement_equals_export",
    ExportStatementNamespaceExport = "export_statement_namespace_export",
    ExportStatement = "export_statement",
    ExpressionStatement = "expression_statement",
    ExtendsClause = "extends_clause",
    ExtendsTypeClause = "extends_type_clause",
    FieldDefinition = "field_definition",
    FinallyClause = "finally_clause",
    FlowMaybeType = "flow_maybe_type",
    ForInStatement = "for_in_statement",
    ForStatement = "for_statement",
    FormalParameters = "formal_parameters",
    FunctionDeclaration = "function_declaration",
    FunctionExpression = "function_expression",
    FunctionSignature = "function_signature",
    FunctionType = "function_type",
    GeneratorFunction = "generator_function",
    GeneratorFunctionDeclaration = "generator_function_declaration",
    GenericType = "generic_type",
    IfStatement = "if_statement",
    ImplementsClause = "implements_clause",
    ImportAlias = "import_alias",
    ImportAttribute = "import_attribute",
    ImportClauseNamespaceImport = "import_clause_namespace_import",
    ImportClauseNamedImports = "import_clause_named_imports",
    ImportClauseDefaultImport = "import_clause_default_import",
    ImportClause = "import_clause",
    ImportRequireClause = "import_require_clause",
    ImportSpecifierName = "import_specifier_name",
    ImportSpecifier = "import_specifier",
    ImportStatement = "import_statement",
    IndexSignatureMappedTypeClause = "index_signature_mapped_type_clause",
    IndexSignature = "index_signature",
    IndexTypeQuery = "index_type_query",
    InferType = "infer_type",
    InstantiationExpression = "instantiation_expression",
    InterfaceDeclaration = "interface_declaration",
    InternalModule = "internal_module",
    IntersectionType = "intersection_type",
    JsxAttribute = "jsx_attribute",
    JsxClosingElement = "jsx_closing_element",
    JsxElement = "jsx_element",
    JsxExpression = "jsx_expression",
    JsxNamespaceName = "jsx_namespace_name",
    JsxOpeningElement = "jsx_opening_element",
    JsxSelfClosingElement = "jsx_self_closing_element",
    LabeledStatement = "labeled_statement",
    LexicalDeclaration = "lexical_declaration",
    LiteralType = "literal_type",
    LookupType = "lookup_type",
    MappedTypeClause = "mapped_type_clause",
    MemberExpression = "member_expression",
    MethodDefinition = "method_definition",
    MethodSignature = "method_signature",
    Module = "module",
    NamedImports = "named_imports",
    NamespaceExport = "namespace_export",
    NamespaceImport = "namespace_import",
    NestedIdentifier = "nested_identifier",
    NestedTypeIdentifier = "nested_type_identifier",
    NewExpression = "new_expression",
    NonNullExpression = "non_null_expression",
    Object = "object",
    ObjectAssignmentPattern = "object_assignment_pattern",
    ObjectPattern = "object_pattern",
    ObjectType = "object_type",
    OmittingTypeAnnotation = "omitting_type_annotation",
    OptingTypeAnnotation = "opting_type_annotation",
    OptionalParameter = "optional_parameter",
    OptionalTupleParameter = "optional_tuple_parameter",
    OptionalType = "optional_type",
    Pair = "pair",
    PairPattern = "pair_pattern",
    ParenthesizedExpressionSequence = "parenthesized_expression_sequence",
    ParenthesizedExpression = "parenthesized_expression",
    ParenthesizedType = "parenthesized_type",
    Program = "program",
    PropertySignature = "property_signature",
    PublicFieldDefinition = "public_field_definition",
    ReadonlyType = "readonly_type",
    Regex = "regex",
    RequiredParameter = "required_parameter",
    RestPattern = "rest_pattern",
    RestType = "rest_type",
    ReturnStatement = "return_statement",
    SatisfiesExpression = "satisfies_expression",
    SequenceExpression = "sequence_expression",
    SpreadElement = "spread_element",
    StatementBlock = "statement_block",
    String = "string",
    SubscriptExpression = "subscript_expression",
    SwitchBody = "switch_body",
    SwitchCase = "switch_case",
    SwitchDefault = "switch_default",
    SwitchStatement = "switch_statement",
    TemplateLiteralType = "template_literal_type",
    TemplateString = "template_string",
    TemplateSubstitution = "template_substitution",
    TemplateType = "template_type",
    TernaryExpression = "ternary_expression",
    ThrowStatement = "throw_statement",
    TryStatement = "try_statement",
    TupleParameter = "tuple_parameter",
    TupleType = "tuple_type",
    TypeAliasDeclaration = "type_alias_declaration",
    TypeAnnotation = "type_annotation",
    TypeArguments = "type_arguments",
    TypeAssertion = "type_assertion",
    TypeParameter = "type_parameter",
    TypeParameters = "type_parameters",
    TypePredicate = "type_predicate",
    TypePredicateAnnotation = "type_predicate_annotation",
    TypeQuery = "type_query",
    UnaryExpression = "unary_expression",
    UnionType = "union_type",
    UpdateExpression = "update_expression",
    VariableDeclaration = "variable_declaration",
    VariableDeclarator = "variable_declarator",
    WhileStatement = "while_statement",
    WithStatement = "with_statement",
    YieldExpression = "yield_expression",
    ForHeaderOperator = "__for_header_operator",
    NumberOperator = "__number_operator",
    AbstractMarker = "_abstract_marker",
    _AccessibilityModifier = "_accessibility_modifier",
    AccessorKind = "_accessor_kind",
    AsyncMarker = "_async_marker",
    AugmentedAssignmentExpressionOperator = "_augmented_assignment_expression_operator",
    ConstMarker = "_const_marker",
    ExportSpecifierExportKind = "_export_specifier_export_kind",
    ImportAttributeObject = "_import_attribute_object",
    Kind = "_kind",
    KwAbstractMarker = "_kw_abstract_marker",
    KwAccessorMarker = "_kw_accessor_marker",
    KwAsyncMarker = "_kw_async_marker",
    KwAwaitMarker = "_kw_await_marker",
    KwConstMarker = "_kw_const_marker",
    KwDeclareMarker = "_kw_declare_marker",
    KwReadonlyMarker = "_kw_readonly_marker",
    KwStaticMarker = "_kw_static_marker",
    KwUsingMarker = "_kw_using_marker",
    ObjectTypeClosing = "_object_type_closing",
    ObjectTypeOpening = "_object_type_opening",
    Operator = "_operator",
    _OverrideModifier = "_override_modifier",
    PublicFieldDefinitionOptionalityMarker = "_public_field_definition_optionality_marker",
    ReadonlyMarker = "_readonly_marker",
    ReservedIdentifier = "_reserved_identifier",
    StaticMarker = "_static_marker",
    StringOpening = "_string_opening",
    TypeIdentifier = "_type_identifier",
    UnaryExpressionOperator = "_unary_expression_operator",
    AccessibilityModifier = "accessibility_modifier",
    Comment = "comment",
    EscapeSequence = "escape_sequence",
    False = "false",
    HashBangLine = "hash_bang_line",
    HtmlCharacterReference = "html_character_reference",
    Identifier = "identifier",
    Import = "import",
    JsxIdentifier = "jsx_identifier",
    MetaProperty = "meta_property",
    Null = "null",
    Number = "number",
    OverrideModifier = "override_modifier",
    PredefinedType = "predefined_type",
    PrivatePropertyIdentifier = "private_property_identifier",
    RegexFlags = "regex_flags",
    RegexPattern = "regex_pattern",
    Super = "super",
    This = "this",
    True = "true",
    Undefined = "undefined",
    UnescapedDoubleJsxStringFragment = "unescaped_double_jsx_string_fragment",
    UnescapedDoubleStringFragment = "unescaped_double_string_fragment",
    UnescapedSingleJsxStringFragment = "unescaped_single_jsx_string_fragment",
    UnescapedSingleStringFragment = "unescaped_single_string_fragment",
    AutomaticSemicolon = "_automatic_semicolon",
    TemplateChars = "_template_chars",
    TernaryQmark = "_ternary_qmark",
    HtmlComment = "html_comment",
    Oror = "||",
    JsxText = "jsx_text",
    FunctionSignatureAutomaticSemicolon = "_function_signature_automatic_semicolon",
    ErrorRecovery = "__error_recovery",
    Abstract = "abstract",
    Global = "global",
    Async = "async",
    Const = "const",
    Export = "export",
    Default = "default",
    As = "as",
    Namespace = "namespace",
    Var = "var",
    From = "from",
    Accessor = "accessor",
    Await = "await",
    Declare = "declare",
    Readonly = "readonly",
    Static = "static",
    Using = "using",
    Override = "override",
    Instanceof = "instanceof",
    In = "in",
    Break = "break",
    Catch = "catch",
    Extends = "extends",
    New = "new",
    Continue = "continue",
    Debugger = "debugger",
    Do = "do",
    While = "while",
    Else = "else",
    Enum = "enum",
    Finally = "finally",
    For = "for",
    Function = "function",
    If = "if",
    Implements = "implements",
    Require = "require",
    Keyof = "keyof",
    Infer = "infer",
    Interface = "interface",
    Return = "return",
    Satisfies = "satisfies",
    Case = "case",
    Switch = "switch",
    Throw = "throw",
    Try = "try",
    Is = "is",
    Typeof = "typeof",
    With = "with",
    Yield = "yield"
}
export declare const enum TSKindId {
    Identifier = 1,
    HashBangLine = 2,
    Star2 = 3,
    As = 4,
    Lbrace = 5,
    Comma = 6,
    Rbrace = 7,
    AnonType = 8,
    Typeof = 9,
    AnonImport = 10,
    From = 11,
    With = 12,
    Assert = 13,
    Var = 14,
    Let = 15,
    Const = 16,
    Bang = 17,
    Else = 18,
    If = 19,
    Switch = 20,
    For = 21,
    Lparen = 22,
    Semi = 23,
    Rparen = 24,
    Await = 25,
    In = 26,
    Of = 27,
    While = 28,
    Do = 29,
    Try = 30,
    Break = 31,
    Continue = 32,
    Debugger = 33,
    Return = 34,
    Throw = 35,
    Colon = 36,
    Case = 37,
    Default = 38,
    Catch = 39,
    Finally = 40,
    Yield = 41,
    Eq = 42,
    Lbrack = 43,
    Rbrack = 44,
    Dot = 45,
    AnonClass = 46,
    Function = 47,
    Async = 48,
    EqGt = 49,
    QmarkDot = 50,
    New = 51,
    PlusEq = 52,
    DashEq = 53,
    StarEq = 54,
    SlashEq = 55,
    PercentEq = 56,
    CaretEq = 57,
    AmpEq = 58,
    PipeEq = 59,
    GtGtEq = 60,
    GtGtGtEq = 61,
    LtLtEq = 62,
    StarStarEq = 63,
    AmpAmpEq = 64,
    PipePipeEq = 65,
    QmarkQmarkEq = 66,
    DotDotDot = 67,
    AmpAmp = 68,
    PipePipe = 69,
    GtGt = 70,
    GtGtGt = 71,
    LtLt = 72,
    Amp2 = 73,
    Caret = 74,
    Pipe2 = 75,
    Plus = 76,
    Dash = 77,
    Slash2 = 78,
    Percent = 79,
    StarStar = 80,
    Lt2 = 81,
    LtEq = 82,
    EqEq = 83,
    EqEqEq = 84,
    BangEq = 85,
    BangEqEq = 86,
    GtEq = 87,
    Gt2 = 88,
    QmarkQmark = 89,
    Instanceof = 90,
    Tilde = 91,
    Void = 92,
    Delete = 93,
    Dquote = 94,
    Squote = 95,
    UnescapedDoubleStringFragment = 96,
    UnescapedSingleStringFragment = 97,
    EscapeSequence = 98,
    Comment = 99,
    Bquote = 100,
    DollarLbrace = 101,
    Slash2_102 = 102,
    RegexPattern = 103,
    RegexFlags = 104,
    Number = 105,
    PrivatePropertyIdentifier = 106,
    Target = 107,
    Meta = 108,
    This = 109,
    Super = 110,
    True = 111,
    False = 112,
    Null = 113,
    Undefined = 114,
    At = 115,
    Static = 116,
    Get = 117,
    Set = 118,
    Declare = 119,
    Namespace = 120,
    Public = 121,
    Private = 122,
    Protected = 123,
    Override = 124,
    Readonly = 125,
    AnonModule = 126,
    Any = 127,
    AnonNumber = 128,
    Boolean = 129,
    AnonString = 130,
    Symbol = 131,
    Export = 132,
    AnonObject = 133,
    Qmark = 134,
    Abstract = 135,
    Satisfies = 136,
    Require = 137,
    Extends = 138,
    Implements = 139,
    Interface = 140,
    Enum = 141,
    DashQmarkColon = 142,
    PlusQmarkColon = 143,
    QmarkColon = 144,
    AnonAsserts = 145,
    Infer = 146,
    Is = 147,
    Keyof = 148,
    Unique = 149,
    Unknown = 150,
    Never = 151,
    LbracePipe = 152,
    PipeRbrace = 153,
    Global = 154,
    Accessor = 155,
    Using = 156,
    PlusPlus = 157,
    DashDash = 158,
    AutomaticSemicolon = 159,
    TemplateChars = 160,
    TernaryQmark = 161,
    HtmlComment = 162,
    JsxText = 163,
    FunctionSignatureAutomaticSemicolon = 164,
    ErrorRecovery = 165,
    Program = 166,
    ExportStatement = 167,
    NamespaceExport = 168,
    ExportClause = 169,
    ExportSpecifier = 170,
    ModuleExportName = 171,
    Declaration = 172,
    Import = 173,
    ImportStatement = 174,
    ImportClause = 175,
    FromClause = 176,
    NamespaceImport = 177,
    NamedImports = 178,
    ImportSpecifier = 179,
    ImportAttribute = 180,
    Statement = 181,
    ExpressionStatement = 182,
    VariableDeclaration = 183,
    LexicalDeclaration = 184,
    VariableDeclarator = 185,
    StatementBlock = 186,
    ElseClause = 187,
    IfStatement = 188,
    SwitchStatement = 189,
    ForStatement = 190,
    ForInStatement = 191,
    ForHeader = 192,
    WhileStatement = 193,
    DoStatement = 194,
    TryStatement = 195,
    WithStatement = 196,
    BreakStatement = 197,
    ContinueStatement = 198,
    DebuggerStatement = 199,
    ReturnStatement = 200,
    ThrowStatement = 201,
    EmptyStatement = 202,
    LabeledStatement = 203,
    SwitchBody = 204,
    SwitchCase = 205,
    SwitchDefault = 206,
    CatchClause = 207,
    FinallyClause = 208,
    ParenthesizedExpression = 209,
    Expression = 210,
    PrimaryExpression = 211,
    YieldExpression = 212,
    Object = 213,
    ObjectPattern = 214,
    AssignmentPattern = 215,
    ObjectAssignmentPattern = 216,
    Array = 217,
    ArrayPattern = 218,
    NestedIdentifier = 219,
    Class = 220,
    ClassDeclaration = 221,
    ClassHeritage = 222,
    FunctionExpression = 223,
    FunctionDeclaration = 224,
    GeneratorFunction = 225,
    GeneratorFunctionDeclaration = 226,
    ArrowFunction = 227,
    _CallSignature = 228,
    FormalParameter = 229,
    OptionalChain = 230,
    CallExpression = 231,
    NewExpression = 232,
    AwaitExpression = 233,
    MemberExpression = 234,
    SubscriptExpression = 235,
    AssignmentExpression = 236,
    _AugmentedAssignmentLhs = 237,
    AugmentedAssignmentExpression = 238,
    Initializer = 239,
    DestructuringPattern = 240,
    SpreadElement = 241,
    TernaryExpression = 242,
    BinaryExpression = 243,
    UnaryExpression = 244,
    UpdateExpression = 245,
    SequenceExpression = 246,
    String = 247,
    TemplateString = 248,
    TemplateSubstitution = 249,
    Regex = 250,
    MetaProperty = 251,
    Arguments = 252,
    Decorator = 253,
    DecoratorMemberExpression = 254,
    DecoratorCallExpression = 255,
    ClassBody = 256,
    FormalParameters = 257,
    ClassStaticBlock = 258,
    Pattern = 259,
    RestPattern = 260,
    MethodDefinition = 261,
    Pair = 262,
    PairPattern = 263,
    PropertyName = 264,
    ComputedPropertyName = 265,
    PublicFieldDefinition = 266,
    ImportIdentifier = 267,
    NonNullExpression = 268,
    MethodSignature = 269,
    AbstractMethodSignature = 270,
    FunctionSignature = 271,
    DecoratorParenthesizedExpression = 272,
    TypeAssertion = 273,
    AsExpression = 274,
    SatisfiesExpression = 275,
    InstantiationExpression = 276,
    ImportRequireClause = 277,
    ExtendsClause = 278,
    ExtendsClauseSingle = 279,
    ImplementsClause = 280,
    AmbientDeclaration = 281,
    AbstractClassDeclaration = 282,
    Module = 283,
    InternalModule = 284,
    _Module = 285,
    ImportAlias = 286,
    NestedTypeIdentifier = 287,
    InterfaceDeclaration = 288,
    ExtendsTypeClause = 289,
    EnumDeclaration = 290,
    EnumBody = 291,
    EnumAssignment = 292,
    TypeAliasDeclaration = 293,
    AccessibilityModifier = 294,
    OverrideModifier = 295,
    RequiredParameter = 296,
    OptionalParameter = 297,
    ParameterName = 298,
    OmittingTypeAnnotation = 299,
    AddingTypeAnnotation = 300,
    OptingTypeAnnotation = 301,
    TypeAnnotation = 302,
    TypeQueryMemberExpressionInTypeAnnotation = 303,
    TypeQueryCallExpressionInTypeAnnotation = 304,
    Asserts = 305,
    AssertsAnnotation = 306,
    Type = 307,
    TupleParameter = 308,
    OptionalTupleParameter = 309,
    OptionalType = 310,
    RestType = 311,
    TupleTypeMember = 312,
    ConstructorType = 313,
    PrimaryType = 314,
    TemplateType = 315,
    TemplateLiteralType = 316,
    InferType = 317,
    ConditionalType = 318,
    GenericType = 319,
    TypePredicate = 320,
    TypePredicateAnnotation = 321,
    TypeQueryMemberExpression = 322,
    TypeQuerySubscriptExpression = 323,
    TypeQueryCallExpression = 324,
    TypeQueryInstantiationExpression = 325,
    TypeQuery = 326,
    IndexTypeQuery = 327,
    LookupType = 328,
    MappedTypeClause = 329,
    LiteralType = 330,
    _Number = 331,
    ExistentialType = 332,
    FlowMaybeType = 333,
    ParenthesizedType = 334,
    PredefinedType = 335,
    TypeArguments = 336,
    ObjectType = 337,
    CallSignature = 338,
    PropertySignature = 339,
    TypeParameters = 340,
    TypeParameter = 341,
    DefaultType = 342,
    Constraint = 343,
    ConstructSignature = 344,
    IndexSignature = 345,
    ArrayType = 346,
    TupleType = 347,
    ReadonlyType = 348,
    UnionType = 349,
    IntersectionType = 350,
    FunctionType = 351,
    AmbientDeclarationGlobal = 352,
    AmbientDeclarationModule = 353,
    ExportStatementDefault = 354,
    ExportStatementDefaultFromArm = 355,
    ExportStatementDefaultDeclArm = 356,
    ExportStatementDefaultDeclArmDefaultKw = 357,
    _ArrowFunctionParameter = 358,
    _ArrowFunctionUCallSignature = 359,
    _ClassHeritageExtendsClause = 360,
    _ClassHeritageImplementsClause = 361,
    _ImportClauseNamespaceImport = 362,
    _ImportClauseNamedImports = 363,
    _ImportClauseDefaultImport = 364,
    _ImportSpecifierName = 365,
    ImportSpecifierAs = 366,
    IndexSignatureColon = 367,
    _IndexSignatureMappedTypeClause = 368,
    _AmbientDeclarationDeclaration = 369,
    ExportStatementDefaultFromArmStarFrom = 370,
    ExportStatementDefaultFromArmNsFrom = 371,
    ExportStatementDefaultFromArmClauseFrom = 372,
    ExportStatementDefaultDeclArmDefaultKwValue = 373,
    ClassBodyMethod = 374,
    ClassBodyMethodSig = 375,
    ClassBodyMember = 376,
    ForHeaderLhs = 377,
    ForHeaderVarKind = 378,
    ForHeaderLetConstKind = 379,
    ParenthesizedExpressionTyped = 380,
    _ParenthesizedExpressionSequence = 381,
    _ExportStatementTypeExport = 382,
    _ExportStatementEqualsExport = 383,
    _ExportStatementNamespaceExport = 384,
    CallExpressionCall = 385,
    CallExpressionTemplateCall = 386,
    CallExpressionMember = 387,
    UpdateExpressionPostfix = 388,
    UpdateExpressionPrefix = 389,
    ProgramRepeat1 = 390,
    ExportClauseRepeat1 = 391,
    NamedImportsRepeat1 = 392,
    VariableDeclarationRepeat1 = 393,
    SwitchBodyRepeat1 = 394,
    ObjectRepeat1 = 395,
    ObjectPatternRepeat1 = 396,
    ArrayRepeat1 = 397,
    ArrayPatternRepeat1 = 398,
    ClassRepeat1 = 399,
    SequenceExpressionRepeat1 = 400,
    StringRepeat1 = 401,
    StringRepeat2 = 402,
    TemplateStringRepeat1 = 403,
    ClassBodyRepeat1 = 404,
    FormalParametersRepeat1 = 405,
    ExtendsClauseRepeat1 = 406,
    ImplementsClauseRepeat1 = 407,
    ExtendsTypeClauseRepeat1 = 408,
    EnumBodyRepeat1 = 409,
    TemplateLiteralTypeRepeat1 = 410,
    ObjectTypeRepeat1 = 411,
    TypeParametersRepeat1 = 412,
    TupleTypeRepeat1 = 413,
    _InterfaceBody = 414,
    PropertyIdentifier = 415,
    PublicFieldDefinitionAbstractFirst = 416,
    PublicFieldDefinitionAccessFirst = 417,
    PublicFieldDefinitionAccessorOpt = 418,
    PublicFieldDefinitionDeclareFirst = 419,
    PublicFieldDefinitionReadonlyFirst = 420,
    PublicFieldDefinitionStaticMods = 421,
    ShorthandPropertyIdentifier = 422,
    ShorthandPropertyIdentifierPattern = 423,
    StatementIdentifier = 424,
    _ThisType = 425,
    TypeIdentifier = 426
}
export declare const KIND_NAMES: ReadonlyMap<number, string>;
export declare function kindIdFromName(kindName: string): TSKindId;
export declare const enum DestructuringPatternKind {
    ObjectPattern = "object_pattern",
    ArrayPattern = "array_pattern"
}
export declare const enum ExportStatementDefaultKind {
    ExportStatementDefaultFromArm = "_export_statement_default_from_arm",
    ExportStatementDefaultDeclArm = "_export_statement_default_decl_arm"
}
export declare const enum ExpressionsKind {
    Expression = "expression",
    SequenceExpression = "sequence_expression"
}
export declare const enum FormalParameterKind {
    RequiredParameter = "required_parameter",
    OptionalParameter = "optional_parameter"
}
export declare const enum IdentifierKind {
    Undefined = "undefined",
    Identifier = "identifier"
}
export declare const enum ImportIdentifierKind {
    Identifier = "identifier"
}
export declare const enum JsxAttributeKind {
    JsxAttribute = "jsx_attribute",
    JsxExpression = "jsx_expression"
}
export declare const enum JsxAttributeNameKind {
    _JsxIdentifier = "_jsx_identifier",
    JsxIdentifier = "jsx_identifier",
    Identifier = "identifier",
    JsxNamespaceName = "jsx_namespace_name"
}
export declare const enum JsxAttributeValueKind {
    JsxString = "_jsx_string",
    JsxExpression = "jsx_expression",
    _JsxElement = "_jsx_element",
    JsxElement = "jsx_element",
    JsxSelfClosingElement = "jsx_self_closing_element"
}
export declare const enum JsxChildKind {
    JsxText = "jsx_text",
    HtmlCharacterReference = "html_character_reference",
    _JsxElement = "_jsx_element",
    JsxElement = "jsx_element",
    JsxSelfClosingElement = "jsx_self_closing_element",
    JsxExpression = "jsx_expression"
}
export declare const enum JsxElementKind {
    JsxElement = "jsx_element",
    JsxSelfClosingElement = "jsx_self_closing_element"
}
export declare const enum JsxElementNameKind {
    _JsxIdentifier = "_jsx_identifier",
    JsxIdentifier = "jsx_identifier",
    Identifier = "identifier",
    NestedIdentifier = "nested_identifier",
    JsxNamespaceName = "jsx_namespace_name"
}
export declare const enum JsxIdentifierKind {
    JsxIdentifier = "jsx_identifier",
    Identifier = "identifier"
}
export declare const enum ModuleExportNameKind {
    Identifier = "identifier",
    String = "string"
}
export declare const enum PropertyIdentifierKind {
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier"
}
export declare const enum PropertyNameKind {
    PropertyIdentifier = "_property_identifier",
    Identifier = "identifier",
    PrivatePropertyIdentifier = "private_property_identifier",
    String = "string",
    Number = "number",
    ComputedPropertyName = "computed_property_name"
}
export declare const enum SemicolonKind {
    AutomaticSemicolon = "_automatic_semicolon",
    Semi = ";"
}
export declare const enum ShorthandPropertyIdentifierKind {
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier"
}
export declare const enum ShorthandPropertyIdentifierPatternKind {
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier"
}
export declare const enum StatementIdentifierKind {
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier"
}
export declare const enum TupleTypeMemberKind {
    TupleParameter = "tuple_parameter",
    OptionalTupleParameter = "optional_tuple_parameter",
    OptionalType = "optional_type",
    RestType = "rest_type",
    Type = "type"
}
export declare const enum DeclarationKind {
    FunctionDeclaration = "function_declaration",
    GeneratorFunctionDeclaration = "generator_function_declaration",
    ClassDeclaration = "class_declaration",
    LexicalDeclaration = "lexical_declaration",
    VariableDeclaration = "variable_declaration",
    FunctionSignature = "function_signature",
    AbstractClassDeclaration = "abstract_class_declaration",
    Module = "module",
    InternalModule = "internal_module",
    TypeAliasDeclaration = "type_alias_declaration",
    EnumDeclaration = "enum_declaration",
    InterfaceDeclaration = "interface_declaration",
    ImportAlias = "import_alias",
    AmbientDeclaration = "ambient_declaration"
}
export declare const enum ExpressionKind {
    AsExpression = "as_expression",
    SatisfiesExpression = "satisfies_expression",
    InstantiationExpression = "instantiation_expression",
    InternalModule = "internal_module",
    TypeAssertion = "type_assertion",
    PrimaryExpression = "primary_expression",
    AssignmentExpression = "assignment_expression",
    AugmentedAssignmentExpression = "augmented_assignment_expression",
    AwaitExpression = "await_expression",
    UnaryExpression = "unary_expression",
    BinaryExpression = "binary_expression",
    TernaryExpression = "ternary_expression",
    UpdateExpression = "update_expression",
    NewExpression = "new_expression",
    YieldExpression = "yield_expression"
}
export declare const enum PatternKind {
    MemberExpression = "member_expression",
    SubscriptExpression = "subscript_expression",
    Undefined = "undefined",
    Identifier = "identifier",
    ObjectPattern = "object_pattern",
    ArrayPattern = "array_pattern",
    NonNullExpression = "non_null_expression",
    RestPattern = "rest_pattern"
}
export declare const enum PrimaryExpressionKind {
    SubscriptExpression = "subscript_expression",
    MemberExpression = "member_expression",
    ParenthesizedExpression = "parenthesized_expression",
    _Identifier = "_identifier",
    Undefined = "undefined",
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier",
    This = "this",
    Super = "super",
    Number = "number",
    String = "string",
    TemplateString = "template_string",
    Regex = "regex",
    True = "true",
    False = "false",
    Null = "null",
    Object = "object",
    Array = "array",
    FunctionExpression = "function_expression",
    ArrowFunction = "arrow_function",
    GeneratorFunction = "generator_function",
    Class = "class",
    MetaProperty = "meta_property",
    CallExpression = "call_expression",
    NonNullExpression = "non_null_expression"
}
export declare const enum PrimaryTypeKind {
    ParenthesizedType = "parenthesized_type",
    PredefinedType = "predefined_type",
    TypeIdentifier = "_type_identifier",
    NestedTypeIdentifier = "nested_type_identifier",
    GenericType = "generic_type",
    ObjectType = "object_type",
    ArrayType = "array_type",
    TupleType = "tuple_type",
    FlowMaybeType = "flow_maybe_type",
    TypeQuery = "type_query",
    IndexTypeQuery = "index_type_query",
    This = "this",
    ExistentialType = "existential_type",
    LiteralType = "literal_type",
    LookupType = "lookup_type",
    ConditionalType = "conditional_type",
    TemplateLiteralType = "template_literal_type",
    IntersectionType = "intersection_type",
    UnionType = "union_type"
}
export declare const enum StatementKind {
    ExportStatement = "export_statement",
    ImportStatement = "import_statement",
    DebuggerStatement = "debugger_statement",
    ExpressionStatement = "expression_statement",
    Declaration = "declaration",
    StatementBlock = "statement_block",
    IfStatement = "if_statement",
    SwitchStatement = "switch_statement",
    ForStatement = "for_statement",
    ForInStatement = "for_in_statement",
    WhileStatement = "while_statement",
    DoStatement = "do_statement",
    TryStatement = "try_statement",
    WithStatement = "with_statement",
    BreakStatement = "break_statement",
    ContinueStatement = "continue_statement",
    ReturnStatement = "return_statement",
    ThrowStatement = "throw_statement",
    EmptyStatement = "empty_statement",
    LabeledStatement = "labeled_statement"
}
export declare const enum TypeKind {
    PrimaryType = "primary_type",
    FunctionType = "function_type",
    ReadonlyType = "readonly_type",
    ConstructorType = "constructor_type",
    InferType = "infer_type",
    TypeQueryMemberExpressionInTypeAnnotation = "_type_query_member_expression_in_type_annotation",
    TypeQueryCallExpressionInTypeAnnotation = "_type_query_call_expression_in_type_annotation"
}
export interface _AmbientDeclarationDeclaration {
    readonly $type: TSKindId._AmbientDeclarationDeclaration;
    readonly _declaration: Declaration;
    declaration(): Declaration;
}
export interface AmbientDeclarationGlobal {
    readonly $type: TSKindId.AmbientDeclarationGlobal;
    readonly _body: StatementBlock;
    body(): StatementBlock;
}
export interface AmbientDeclarationModule {
    readonly $type: TSKindId.AmbientDeclarationModule;
    readonly _name: Identifier;
    readonly _type: Type;
    readonly _semicolon?: Semicolon;
    name(): Identifier;
    type(): Type;
    semicolon(): Semicolon | undefined;
}
export interface _ArrowFunctionUCallSignature {
    readonly $type: TSKindId._ArrowFunctionUCallSignature;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface _ArrowFunctionParameter {
    readonly $type: TSKindId._ArrowFunctionParameter;
    readonly _parameter: ReservedIdentifier;
    parameter(): ReservedIdentifier;
}
export interface CallExpressionCall {
    readonly $type: TSKindId.CallExpressionCall;
    readonly _function: Expression | Import;
    readonly _type_arguments?: TypeArguments;
    readonly _arguments: Arguments;
    function(): Expression | Import;
    typeArguments(): TypeArguments | undefined;
    arguments(): Arguments;
}
export interface CallExpressionMember {
    readonly $type: TSKindId.CallExpressionMember;
    readonly _function: PrimaryExpression;
    readonly _type_arguments?: TypeArguments;
    readonly _arguments: Arguments;
    function(): PrimaryExpression;
    typeArguments(): TypeArguments | undefined;
    arguments(): Arguments;
}
export interface CallExpressionTemplateCall {
    readonly $type: TSKindId.CallExpressionTemplateCall;
    readonly _function: PrimaryExpression | NewExpression;
    readonly _arguments: TemplateString;
    function(): PrimaryExpression | NewExpression;
    arguments(): TemplateString;
}
export interface _CallSignature {
    readonly $type: TSKindId._CallSignature;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface ClassBodyMember {
    readonly $type: TSKindId.ClassBodyMember;
    readonly _abstract_method_signature: AbstractMethodSignature | IndexSignature | MethodSignature | PublicFieldDefinition;
    readonly _semicolon: Semicolon | ",";
    abstractMethodSignature(): AbstractMethodSignature | IndexSignature | MethodSignature | PublicFieldDefinition;
    semicolon(): Semicolon | ",";
}
export interface ClassBodyMethod {
    readonly $type: TSKindId.ClassBodyMethod;
    readonly _decorator?: readonly (Decorator)[];
    readonly _method_definition: MethodDefinition;
    readonly _semicolon?: Semicolon;
    decorators(): readonly (Decorator)[];
    methodDefinition(): MethodDefinition;
    semicolon(): Semicolon | undefined;
}
export interface ClassBodyMethodSig {
    readonly $type: TSKindId.ClassBodyMethodSig;
    readonly _method_signature: MethodSignature;
    readonly _function_signature_automatic_semicolon: FunctionSignatureAutomaticSemicolon | ",";
    methodSignature(): MethodSignature;
    functionSignatureAutomaticSemicolon(): FunctionSignatureAutomaticSemicolon | ",";
}
export interface _ClassHeritageExtendsClause {
    readonly $type: TSKindId._ClassHeritageExtendsClause;
    readonly _extends_clause: ExtendsClause;
    readonly _implements_clause?: ImplementsClause;
    extendsClause(): ExtendsClause;
    implementsClause(): ImplementsClause | undefined;
}
export interface _ClassHeritageImplementsClause {
    readonly $type: TSKindId._ClassHeritageImplementsClause;
    readonly _implements_clause: ImplementsClause;
    implementsClause(): ImplementsClause;
}
export interface ExportStatementDefaultDeclArm {
    readonly $type: TSKindId.ExportStatementDefaultDeclArm;
    readonly _decorator?: readonly (Decorator)[];
    readonly _declaration?: Declaration;
    readonly _export_statement_default_decl_arm_default_kw?: ExportStatementDefaultDeclArmDefaultKw;
    decorators(): readonly (Decorator)[];
    declaration(): Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKw(): ExportStatementDefaultDeclArmDefaultKw | undefined;
}
export interface ExportStatementDefaultDeclArmDefaultKw {
    readonly $type: TSKindId.ExportStatementDefaultDeclArmDefaultKw;
    readonly _declaration?: Declaration;
    readonly _export_statement_default_decl_arm_default_kw_value?: ExportStatementDefaultDeclArmDefaultKwValue;
    declaration(): Declaration | undefined;
    exportStatementDefaultDeclArmDefaultKwValue(): ExportStatementDefaultDeclArmDefaultKwValue | undefined;
}
export interface ExportStatementDefaultDeclArmDefaultKwValue {
    readonly $type: TSKindId.ExportStatementDefaultDeclArmDefaultKwValue;
    readonly _value: Expression;
    readonly _semicolon: Semicolon;
    value(): Expression;
    semicolon(): Semicolon;
}
export interface ExportStatementDefaultFromArm {
    readonly $type: TSKindId.ExportStatementDefaultFromArm;
    readonly _export_statement_default_from_arm_star_from: ExportStatementDefaultFromArmStarFrom | ExportStatementDefaultFromArmNsFrom | ExportStatementDefaultFromArmClauseFrom | ExportClause;
    readonly _semicolon: Semicolon;
    exportStatementDefaultFromArmStarFrom(): ExportStatementDefaultFromArmStarFrom | ExportStatementDefaultFromArmNsFrom | ExportStatementDefaultFromArmClauseFrom | ExportClause;
    semicolon(): Semicolon;
}
export interface ExportStatementDefaultFromArmClauseFrom {
    readonly $type: TSKindId.ExportStatementDefaultFromArmClauseFrom;
    readonly _export_clause: ExportClause;
    readonly _source: String;
    exportClause(): ExportClause;
    source(): String;
}
export interface ExportStatementDefaultFromArmNsFrom {
    readonly $type: TSKindId.ExportStatementDefaultFromArmNsFrom;
    readonly _namespace_export: NamespaceExport;
    readonly _source: String;
    namespaceExport(): NamespaceExport;
    source(): String;
}
export interface ExportStatementDefaultFromArmStarFrom {
    readonly $type: TSKindId.ExportStatementDefaultFromArmStarFrom;
    readonly _source: String;
    source(): String;
}
export interface _ExportStatementEqualsExport {
    readonly $type: TSKindId._ExportStatementEqualsExport;
    readonly _expression: Expression;
    readonly _semicolon: Semicolon;
    expression(): Expression;
    semicolon(): Semicolon;
}
export interface _ExportStatementNamespaceExport {
    readonly $type: TSKindId._ExportStatementNamespaceExport;
    readonly _identifier: Identifier;
    readonly _semicolon: Semicolon;
    identifier(): Identifier;
    semicolon(): Semicolon;
}
export interface _ExportStatementTypeExport {
    readonly $type: TSKindId._ExportStatementTypeExport;
    readonly _export_clause: ExportClause;
    readonly _source?: String;
    readonly _semicolon: Semicolon;
    exportClause(): ExportClause;
    source(): String | undefined;
    semicolon(): Semicolon;
}
export interface ExtendsClauseSingle {
    readonly $type: TSKindId.ExtendsClauseSingle;
    readonly _value: Expression;
    readonly _type_arguments?: TypeArguments;
    value(): Expression;
    typeArguments(): TypeArguments | undefined;
}
export interface ForHeader {
    readonly $type: TSKindId.ForHeader;
    readonly _for_header_lhs: ForHeaderLhs | ForHeaderVarKind | ForHeaderLetConstKind;
    readonly _operator: number;
    readonly _right: Expressions;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"in" | "of", TSKindId.In | TSKindId.Of>;
    };
    forHeaderLhs(): ForHeaderLhs | ForHeaderVarKind | ForHeaderLetConstKind;
    operator(): number;
    right(): Expressions;
}
export interface ForHeaderLetConstKind {
    readonly $type: TSKindId.ForHeaderLetConstKind;
    readonly _kind: number;
    readonly _left: Identifier | DestructuringPattern;
    readonly _automatic_semicolon?: AutomaticSemicolon;
    readonly __inputHints__?: {
        readonly kind: KindEnum<"let" | "const", TSKindId.Let | TSKindId.Const>;
    };
    kind(): number;
    left(): Identifier | DestructuringPattern;
    automaticSemicolon(): AutomaticSemicolon | undefined;
}
export interface ForHeaderLhs {
    readonly $type: TSKindId.ForHeaderLhs;
    readonly _left: LhsExpression | ParenthesizedExpression;
    left(): LhsExpression | ParenthesizedExpression;
}
export interface ForHeaderVarKind {
    readonly $type: TSKindId.ForHeaderVarKind;
    readonly _kind: number;
    readonly _left: Identifier | DestructuringPattern;
    readonly _initializer?: Initializer;
    readonly __inputHints__?: {
        readonly kind: KindEnum<"var", TSKindId.Var>;
    };
    kind(): number;
    left(): Identifier | DestructuringPattern;
    initializer(): Initializer | undefined;
}
export interface FromClause {
    readonly $type: TSKindId.FromClause;
    readonly _source: String;
    source(): String;
}
export interface _ImportClauseDefaultImport {
    readonly $type: TSKindId._ImportClauseDefaultImport;
    readonly _import_identifier: ImportIdentifier;
    readonly _namespace_import?: NamespaceImport | NamedImports;
    importIdentifier(): ImportIdentifier;
    namespaceImport(): NamespaceImport | NamedImports | undefined;
}
export interface _ImportClauseNamedImports {
    readonly $type: TSKindId._ImportClauseNamedImports;
    readonly _named_imports: NamedImports;
    namedImports(): NamedImports;
}
export interface _ImportClauseNamespaceImport {
    readonly $type: TSKindId._ImportClauseNamespaceImport;
    readonly _namespace_import: NamespaceImport;
    namespaceImport(): NamespaceImport;
}
export interface ImportSpecifierAs {
    readonly $type: TSKindId.ImportSpecifierAs;
    readonly _name: ModuleExportName | Identifier;
    readonly _alias: ImportIdentifier;
    name(): ModuleExportName | Identifier;
    alias(): ImportIdentifier;
}
export interface _ImportSpecifierName {
    readonly $type: TSKindId._ImportSpecifierName;
    readonly _name: ImportIdentifier;
    name(): ImportIdentifier;
}
export interface IndexSignatureColon {
    readonly $type: TSKindId.IndexSignatureColon;
    readonly _name: ReservedIdentifier;
    readonly _index_type: Type;
    name(): ReservedIdentifier;
    indexType(): Type;
}
export interface _IndexSignatureMappedTypeClause {
    readonly $type: TSKindId._IndexSignatureMappedTypeClause;
    readonly _mapped_type_clause: MappedTypeClause;
    mappedTypeClause(): MappedTypeClause;
}
export interface Initializer {
    readonly $type: TSKindId.Initializer;
    readonly _value: Expression;
    value(): Expression;
}
export interface JsxStartOpeningElement {
    readonly $type: "_jsx_start_opening_element";
    readonly _name?: _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier;
    readonly _type_arguments?: TypeArguments;
    readonly _attribute?: readonly (_JsxAttribute)[];
    name(): _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier | undefined;
    typeArguments(): TypeArguments | undefined;
    attributes(): readonly (_JsxAttribute)[];
}
export interface JsxString {
    readonly $type: "_jsx_string";
    readonly _unescaped_double_jsx_string_fragment?: readonly (UnescapedDoubleJsxStringFragment | HtmlCharacterReference | UnescapedSingleJsxStringFragment)[];
    unescapedDoubleJsxStringFragments(): readonly (UnescapedDoubleJsxStringFragment | HtmlCharacterReference | UnescapedSingleJsxStringFragment)[];
}
export interface LhsExpression {
    readonly $type: "_lhs_expression";
    readonly _member_expression: MemberExpression | SubscriptExpression | _Identifier | ReservedIdentifier | DestructuringPattern | NonNullExpression;
    memberExpression(): MemberExpression | SubscriptExpression | _Identifier | ReservedIdentifier | DestructuringPattern | NonNullExpression;
}
export interface _Module {
    readonly $type: TSKindId._Module;
    readonly _name: String | Identifier | NestedIdentifier;
    readonly _body?: StatementBlock;
    name(): String | Identifier | NestedIdentifier;
    body(): StatementBlock | undefined;
}
export interface _Number {
    readonly $type: TSKindId._Number;
    readonly _operator: number;
    readonly _argument: Number;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
    };
    operator(): number;
    argument(): Number;
}
export interface ParameterName {
    readonly $type: TSKindId.ParameterName;
    readonly _decorator?: readonly (Decorator)[];
    readonly _accessibility_modifier?: number;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _pattern: Pattern | This;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
    };
    decorators(): readonly (Decorator)[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    pattern(): Pattern | This;
}
export interface _ParenthesizedExpressionSequence {
    readonly $type: TSKindId._ParenthesizedExpressionSequence;
    readonly _sequence_expression: SequenceExpression;
    sequenceExpression(): SequenceExpression;
}
export interface ParenthesizedExpressionTyped {
    readonly $type: TSKindId.ParenthesizedExpressionTyped;
    readonly _expression: Expression;
    readonly _type?: TypeAnnotation;
    expression(): Expression;
    type(): TypeAnnotation | undefined;
}
export interface PublicFieldDefinitionAbstractFirst {
    readonly $type: TSKindId.PublicFieldDefinitionAbstractFirst;
    readonly _abstract_marker: number;
    readonly _readonly_marker?: boolean;
    readonly __inputHints__?: {
        readonly abstract_marker: KindEnum<"abstract", TSKindId.Abstract>;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
    };
    abstractMarker(): number;
    readonlyMarker(): boolean | undefined;
}
export interface PublicFieldDefinitionAccessFirst {
    readonly $type: TSKindId.PublicFieldDefinitionAccessFirst;
    readonly _accessibility_modifier: number;
    readonly _declare_marker?: boolean;
    readonly __inputHints__?: {
        readonly accessibility_modifier: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly declare_marker?: BooleanKeyword<"declare">;
    };
    accessibilityModifier(): number;
    declareMarker(): boolean | undefined;
}
export interface PublicFieldDefinitionAccessorOpt {
    readonly $type: TSKindId.PublicFieldDefinitionAccessorOpt;
    readonly _accessor_marker: number;
    readonly __inputHints__?: {
        readonly accessor_marker: KindEnum<"accessor", TSKindId.Accessor>;
    };
    accessorMarker(): number;
}
export interface PublicFieldDefinitionDeclareFirst {
    readonly $type: TSKindId.PublicFieldDefinitionDeclareFirst;
    readonly _accessibility_modifier?: number;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
    };
    accessibilityModifier(): number | undefined;
}
export interface PublicFieldDefinitionReadonlyFirst {
    readonly $type: TSKindId.PublicFieldDefinitionReadonlyFirst;
    readonly _readonly_marker: number;
    readonly _abstract_marker?: boolean;
    readonly __inputHints__?: {
        readonly readonly_marker: KindEnum<"readonly", TSKindId.Readonly>;
        readonly abstract_marker?: BooleanKeyword<"abstract">;
    };
    readonlyMarker(): number;
    abstractMarker(): boolean | undefined;
}
export interface PublicFieldDefinitionStaticMods {
    readonly $type: TSKindId.PublicFieldDefinitionStaticMods;
    readonly _static_marker: number;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly __inputHints__?: {
        readonly static_marker: KindEnum<"static", TSKindId.Static>;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
    };
    staticMarker(): number;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
}
export interface TypeQueryCallExpression {
    readonly $type: TSKindId.TypeQueryCallExpression;
    readonly _function: Import | Identifier | TypeQueryMemberExpression | TypeQuerySubscriptExpression;
    readonly _arguments: Arguments;
    function(): Import | Identifier | TypeQueryMemberExpression | TypeQuerySubscriptExpression;
    arguments(): Arguments;
}
export interface TypeQueryCallExpressionInTypeAnnotation {
    readonly $type: TSKindId.TypeQueryCallExpressionInTypeAnnotation;
    readonly _function: Import | TypeQueryMemberExpressionInTypeAnnotation;
    readonly _arguments: Arguments;
    function(): Import | TypeQueryMemberExpressionInTypeAnnotation;
    arguments(): Arguments;
}
export interface TypeQueryInstantiationExpression {
    readonly $type: TSKindId.TypeQueryInstantiationExpression;
    readonly _function: Import | Identifier | TypeQueryMemberExpression | TypeQuerySubscriptExpression;
    readonly _type_arguments: TypeArguments;
    function(): Import | Identifier | TypeQueryMemberExpression | TypeQuerySubscriptExpression;
    typeArguments(): TypeArguments;
}
export interface TypeQueryMemberExpression {
    readonly $type: TSKindId.TypeQueryMemberExpression;
    readonly _object: Identifier | This | TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression;
    readonly _property: PrivatePropertyIdentifier | Identifier;
    object(): Identifier | This | TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression;
    property(): PrivatePropertyIdentifier | Identifier;
}
export interface TypeQueryMemberExpressionInTypeAnnotation {
    readonly $type: TSKindId.TypeQueryMemberExpressionInTypeAnnotation;
    readonly _object: Import | TypeQueryMemberExpressionInTypeAnnotation | TypeQueryCallExpressionInTypeAnnotation;
    readonly _property: PrivatePropertyIdentifier | Identifier;
    object(): Import | TypeQueryMemberExpressionInTypeAnnotation | TypeQueryCallExpressionInTypeAnnotation;
    property(): PrivatePropertyIdentifier | Identifier;
}
export interface TypeQuerySubscriptExpression {
    readonly $type: TSKindId.TypeQuerySubscriptExpression;
    readonly _object: Identifier | This | TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression;
    readonly _index: PredefinedType | String | Number;
    object(): Identifier | This | TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression;
    index(): PredefinedType | String | Number;
}
export interface UpdateExpressionPostfix {
    readonly $type: TSKindId.UpdateExpressionPostfix;
    readonly _argument: Expression;
    readonly _operator: number;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"++" | "--", TSKindId.PlusPlus | TSKindId.DashDash>;
    };
    argument(): Expression;
    operator(): number;
}
export interface UpdateExpressionPrefix {
    readonly $type: TSKindId.UpdateExpressionPrefix;
    readonly _operator: number;
    readonly _argument: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"++" | "--", TSKindId.PlusPlus | TSKindId.DashDash>;
    };
    operator(): number;
    argument(): Expression;
}
export interface AbstractClassDeclaration {
    readonly $type: TSKindId.AbstractClassDeclaration;
    readonly _decorator?: readonly (Decorator)[];
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _class_heritage?: ClassHeritage;
    readonly _body: ClassBody;
    decorators(): readonly (Decorator)[];
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    classHeritage(): ClassHeritage | undefined;
    body(): ClassBody;
}
export interface AbstractMethodSignature {
    readonly $type: TSKindId.AbstractMethodSignature;
    readonly _accessibility_modifier?: number;
    readonly _override_modifier?: boolean;
    readonly _accessor_kind?: number;
    readonly _name: PropertyName;
    readonly _optional_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly accessor_kind?: KindEnum<"get" | "set" | "*", TSKindId.Get | TSKindId.Set | TSKindId.Star2>;
        readonly optional_marker?: BooleanKeyword<"?">;
    };
    accessibilityModifier(): number | undefined;
    overrideModifier(): boolean | undefined;
    accessorKind(): number | undefined;
    name(): PropertyName;
    optionalMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface AddingTypeAnnotation {
    readonly $type: TSKindId.AddingTypeAnnotation;
    readonly _type: Type;
    type(): Type;
}
export interface AmbientDeclarationDeclaration {
    readonly $type: "ambient_declaration_declaration";
    readonly _declaration: Declaration;
    declaration(): Declaration;
}
export interface AmbientDeclarationUFormDeclaration {
    readonly $type: TSKindId.AmbientDeclaration;
    readonly $variant: 'declaration';
    readonly _ambient_declaration_declaration: _AmbientDeclarationDeclaration;
    ambientDeclarationDeclaration(): _AmbientDeclarationDeclaration;
}
export interface AmbientDeclarationUFormGlobal {
    readonly $type: TSKindId.AmbientDeclaration;
    readonly $variant: 'global';
    readonly _ambient_declaration_global: AmbientDeclarationGlobal;
    ambientDeclarationGlobal(): AmbientDeclarationGlobal;
}
export interface AmbientDeclarationUFormModule {
    readonly $type: TSKindId.AmbientDeclaration;
    readonly $variant: 'module';
    readonly _ambient_declaration_module: AmbientDeclarationModule;
    ambientDeclarationModule(): AmbientDeclarationModule;
}
export type AmbientDeclaration = AmbientDeclarationUFormDeclaration | AmbientDeclarationUFormGlobal | AmbientDeclarationUFormModule;
export interface Arguments {
    readonly $type: TSKindId.Arguments;
    readonly _expression?: readonly (Expression | SpreadElement)[];
    expressions(): readonly (Expression | SpreadElement)[];
}
export interface Array {
    readonly $type: TSKindId.Array;
    readonly _expression?: readonly (Expression | SpreadElement)[];
    expressions(): readonly (Expression | SpreadElement)[];
}
export interface ArrayPattern {
    readonly $type: TSKindId.ArrayPattern;
    readonly _pattern?: readonly (Pattern | AssignmentPattern)[];
    patterns(): readonly (Pattern | AssignmentPattern)[];
}
export interface ArrayType {
    readonly $type: TSKindId.ArrayType;
    readonly _primary_type: PrimaryType;
    primaryType(): PrimaryType;
}
export interface ArrowFunctionParameter {
    readonly $type: "arrow_function_parameter";
    readonly _parameter: ReservedIdentifier;
    parameter(): ReservedIdentifier;
}
export interface ArrowFunctionUCallSignature {
    readonly $type: "arrow_function__call_signature";
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface ArrowFunctionUFormParameter {
    readonly $type: TSKindId.ArrowFunction;
    readonly $variant: 'parameter';
    readonly _async_marker?: boolean;
    readonly _arrow_function_parameter: _ArrowFunctionParameter;
    readonly _body: Expression | StatementBlock;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    arrowFunctionParameter(): _ArrowFunctionParameter;
    body(): Expression | StatementBlock;
}
export interface ArrowFunctionUFormUCallSignature {
    readonly $type: TSKindId.ArrowFunction;
    readonly $variant: '_call_signature';
    readonly _async_marker?: boolean;
    readonly _arrow_function__call_signature: _ArrowFunctionUCallSignature;
    readonly _body: Expression | StatementBlock;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    arrowFunction_CallSignature(): _ArrowFunctionUCallSignature;
    body(): Expression | StatementBlock;
}
export type ArrowFunction = ArrowFunctionUFormParameter | ArrowFunctionUFormUCallSignature;
export interface AsExpression {
    readonly $type: TSKindId.AsExpression;
    readonly _expression: Expression;
    readonly _type_annotation: Const | Type;
    expression(): Expression;
    typeAnnotation(): Const | Type;
}
export interface Asserts {
    readonly $type: TSKindId.Asserts;
    readonly _type_predicate: TypePredicate | Identifier | This;
    typePredicate(): TypePredicate | Identifier | This;
}
export interface AssertsAnnotation {
    readonly $type: TSKindId.AssertsAnnotation;
    readonly _asserts: ":" | Asserts;
    asserts(): ":" | Asserts;
}
export interface AssignmentExpression {
    readonly $type: TSKindId.AssignmentExpression;
    readonly _using_marker?: boolean;
    readonly _left: ParenthesizedExpression | LhsExpression;
    readonly _right: Expression;
    readonly __inputHints__?: {
        readonly using_marker?: BooleanKeyword<"using">;
    };
    usingMarker(): boolean | undefined;
    left(): ParenthesizedExpression | LhsExpression;
    right(): Expression;
}
export interface AssignmentPattern {
    readonly $type: TSKindId.AssignmentPattern;
    readonly _left: Pattern;
    readonly _right: Expression;
    left(): Pattern;
    right(): Expression;
}
export interface AugmentedAssignmentExpression {
    readonly $type: TSKindId.AugmentedAssignmentExpression;
    readonly _left: MemberExpression | SubscriptExpression | ReservedIdentifier | ParenthesizedExpression | NonNullExpression;
    readonly _operator: number;
    readonly _right: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | ">>=" | ">>>=" | "<<=" | "**=" | "&&=" | "||=" | "??=", TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.CaretEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.GtGtEq | TSKindId.GtGtGtEq | TSKindId.LtLtEq | TSKindId.StarStarEq | TSKindId.AmpAmpEq | TSKindId.PipePipeEq | TSKindId.QmarkQmarkEq>;
    };
    left(): MemberExpression | SubscriptExpression | ReservedIdentifier | ParenthesizedExpression | NonNullExpression;
    operator(): number;
    right(): Expression;
}
export interface AwaitExpression {
    readonly $type: TSKindId.AwaitExpression;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface BinaryExpression {
    readonly $type: TSKindId.BinaryExpression;
    readonly _left: Expression | PrivatePropertyIdentifier;
    readonly _operator: number;
    readonly _right: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"&&" | "||" | ">>" | ">>>" | "<<" | "&" | "^" | "|" | "+" | "-" | "*" | "/" | "%" | "**" | "<" | "<=" | "==" | "===" | "!=" | "!==" | ">=" | ">" | "??" | "instanceof" | "in", TSKindId.AmpAmp | TSKindId.PipePipe | TSKindId.GtGt | TSKindId.GtGtGt | TSKindId.LtLt | TSKindId.Amp2 | TSKindId.Caret | TSKindId.Pipe2 | TSKindId.Plus | TSKindId.Dash | TSKindId.Star2 | TSKindId.Slash2 | TSKindId.Percent | TSKindId.StarStar | TSKindId.Lt2 | TSKindId.LtEq | TSKindId.EqEq | TSKindId.EqEqEq | TSKindId.BangEq | TSKindId.BangEqEq | TSKindId.GtEq | TSKindId.Gt2 | TSKindId.QmarkQmark | TSKindId.Instanceof | TSKindId.In>;
    };
    left(): Expression | PrivatePropertyIdentifier;
    operator(): number;
    right(): Expression;
}
export interface BreakStatement {
    readonly $type: TSKindId.BreakStatement;
    readonly _label?: Identifier;
    readonly _semicolon: Semicolon;
    label(): Identifier | undefined;
    semicolon(): Semicolon;
}
export interface CallExpressionUFormCall {
    readonly $type: TSKindId.CallExpression;
    readonly $variant: 'call';
    readonly _call_expression_call: CallExpressionCall;
    callExpressionCall(): CallExpressionCall;
}
export interface CallExpressionUFormTemplateCall {
    readonly $type: TSKindId.CallExpression;
    readonly $variant: 'template_call';
    readonly _call_expression_template_call: CallExpressionTemplateCall;
    callExpressionTemplateCall(): CallExpressionTemplateCall;
}
export interface CallExpressionUFormMember {
    readonly $type: TSKindId.CallExpression;
    readonly $variant: 'member';
    readonly _call_expression_member: CallExpressionMember;
    callExpressionMember(): CallExpressionMember;
}
export type CallExpression = CallExpressionUFormCall | CallExpressionUFormTemplateCall | CallExpressionUFormMember;
export interface CallSignature {
    readonly $type: TSKindId.CallSignature;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface CatchClause {
    readonly $type: TSKindId.CatchClause;
    readonly _parameter?: Identifier | DestructuringPattern;
    readonly _type?: TypeAnnotation;
    readonly _body: StatementBlock;
    parameter(): Identifier | DestructuringPattern | undefined;
    type(): TypeAnnotation | undefined;
    body(): StatementBlock;
}
export interface Class {
    readonly $type: TSKindId.Class;
    readonly _decorator?: readonly (Decorator)[];
    readonly _name?: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _class_heritage?: ClassHeritage;
    readonly _body: ClassBody;
    decorators(): readonly (Decorator)[];
    name(): TypeIdentifier | undefined;
    typeParameters(): TypeParameters | undefined;
    classHeritage(): ClassHeritage | undefined;
    body(): ClassBody;
}
export interface ClassBody {
    readonly $type: TSKindId.ClassBody;
    readonly _class_body_method?: readonly (ClassBodyMethod | ClassBodyMethodSig | ClassStaticBlock | ClassBodyMember | ";")[];
    classBodyMethods(): readonly (ClassBodyMethod | ClassBodyMethodSig | ClassStaticBlock | ClassBodyMember | ";")[];
}
export interface ClassDeclaration {
    readonly $type: TSKindId.ClassDeclaration;
    readonly _decorator?: readonly (Decorator)[];
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _class_heritage?: ClassHeritage;
    readonly _body: ClassBody;
    readonly _automatic_semicolon?: AutomaticSemicolon;
    decorators(): readonly (Decorator)[];
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    classHeritage(): ClassHeritage | undefined;
    body(): ClassBody;
    automaticSemicolon(): AutomaticSemicolon | undefined;
}
export interface ClassHeritageExtendsClause {
    readonly $type: "class_heritage_extends_clause";
    readonly _extends_clause: ExtendsClause;
    readonly _implements_clause?: ImplementsClause;
    extendsClause(): ExtendsClause;
    implementsClause(): ImplementsClause | undefined;
}
export interface ClassHeritageImplementsClause {
    readonly $type: "class_heritage_implements_clause";
    readonly _implements_clause: ImplementsClause;
    implementsClause(): ImplementsClause;
}
export interface ClassHeritageUFormExtendsClause {
    readonly $type: TSKindId.ClassHeritage;
    readonly $variant: 'extends_clause';
    readonly _class_heritage_extends_clause: _ClassHeritageExtendsClause;
    classHeritageExtendsClause(): _ClassHeritageExtendsClause;
}
export interface ClassHeritageUFormImplementsClause {
    readonly $type: TSKindId.ClassHeritage;
    readonly $variant: 'implements_clause';
    readonly _class_heritage_implements_clause: _ClassHeritageImplementsClause;
    classHeritageImplementsClause(): _ClassHeritageImplementsClause;
}
export type ClassHeritage = ClassHeritageUFormExtendsClause | ClassHeritageUFormImplementsClause;
export interface ClassStaticBlock {
    readonly $type: TSKindId.ClassStaticBlock;
    readonly _automatic_semicolon?: AutomaticSemicolon;
    readonly _body: StatementBlock;
    automaticSemicolon(): AutomaticSemicolon | undefined;
    body(): StatementBlock;
}
export interface ComputedPropertyName {
    readonly $type: TSKindId.ComputedPropertyName;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface ConditionalType {
    readonly $type: TSKindId.ConditionalType;
    readonly _left: Type;
    readonly _right: Type;
    readonly _consequence: Type;
    readonly _alternative: Type;
    left(): Type;
    right(): Type;
    consequence(): Type;
    alternative(): Type;
}
export interface Constraint {
    readonly $type: TSKindId.Constraint;
    readonly _type: Type;
    type(): Type;
}
export interface ConstructSignature {
    readonly $type: TSKindId.ConstructSignature;
    readonly _abstract_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _type?: TypeAnnotation;
    readonly __inputHints__?: {
        readonly abstract_marker?: BooleanKeyword<"abstract">;
    };
    abstractMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    type(): TypeAnnotation | undefined;
}
export interface ConstructorType {
    readonly $type: TSKindId.ConstructorType;
    readonly _abstract_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _type: Type;
    readonly __inputHints__?: {
        readonly abstract_marker?: BooleanKeyword<"abstract">;
    };
    abstractMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    type(): Type;
}
export interface ContinueStatement {
    readonly $type: TSKindId.ContinueStatement;
    readonly _label?: Identifier;
    readonly _semicolon: Semicolon;
    label(): Identifier | undefined;
    semicolon(): Semicolon;
}
export interface DebuggerStatement {
    readonly $type: TSKindId.DebuggerStatement;
    readonly _semicolon: Semicolon;
    semicolon(): Semicolon;
}
export interface Decorator {
    readonly $type: TSKindId.Decorator;
    readonly _identifier: Identifier | DecoratorMemberExpression | DecoratorCallExpression | DecoratorParenthesizedExpression;
    identifier(): Identifier | DecoratorMemberExpression | DecoratorCallExpression | DecoratorParenthesizedExpression;
}
export interface DecoratorCallExpression {
    readonly $type: TSKindId.DecoratorCallExpression;
    readonly _function: Identifier | DecoratorMemberExpression;
    readonly _type_arguments?: TypeArguments;
    readonly _arguments: Arguments;
    function(): Identifier | DecoratorMemberExpression;
    typeArguments(): TypeArguments | undefined;
    arguments(): Arguments;
}
export interface DecoratorMemberExpression {
    readonly $type: TSKindId.DecoratorMemberExpression;
    readonly _object: Identifier | DecoratorMemberExpression;
    readonly _property: Identifier;
    object(): Identifier | DecoratorMemberExpression;
    property(): Identifier;
}
export interface DecoratorParenthesizedExpression {
    readonly $type: TSKindId.DecoratorParenthesizedExpression;
    readonly _identifier: Identifier | DecoratorMemberExpression | DecoratorCallExpression;
    identifier(): Identifier | DecoratorMemberExpression | DecoratorCallExpression;
}
export interface DefaultType {
    readonly $type: TSKindId.DefaultType;
    readonly _type: Type;
    type(): Type;
}
export interface DoStatement {
    readonly $type: TSKindId.DoStatement;
    readonly _body: Statement;
    readonly _condition: ParenthesizedExpression;
    readonly _semicolon?: Semicolon;
    body(): Statement;
    condition(): ParenthesizedExpression;
    semicolon(): Semicolon | undefined;
}
export interface ElseClause {
    readonly $type: TSKindId.ElseClause;
    readonly _statement: Statement;
    statement(): Statement;
}
export interface EnumAssignment {
    readonly $type: TSKindId.EnumAssignment;
    readonly _name: PropertyName;
    readonly _value: Expression;
    name(): PropertyName;
    value(): Expression;
}
export interface EnumBody {
    readonly $type: TSKindId.EnumBody;
    readonly _name?: readonly (PropertyName)[];
    readonly _enum_assignment?: readonly (EnumAssignment)[];
    names(): readonly (PropertyName)[];
    enumAssignments(): readonly (EnumAssignment)[];
}
export interface EnumDeclaration {
    readonly $type: TSKindId.EnumDeclaration;
    readonly _const_marker?: boolean;
    readonly _name: Identifier;
    readonly _body: EnumBody;
    readonly __inputHints__?: {
        readonly const_marker?: BooleanKeyword<"const">;
    };
    constMarker(): boolean | undefined;
    name(): Identifier;
    body(): EnumBody;
}
export interface ExportClause {
    readonly $type: TSKindId.ExportClause;
    readonly _export_specifier?: readonly (ExportSpecifier)[];
    exportSpecifiers(): readonly (ExportSpecifier)[];
}
export interface ExportSpecifier {
    readonly $type: TSKindId.ExportSpecifier;
    readonly _export_kind?: number;
    readonly _name: ModuleExportName;
    readonly _alias?: ModuleExportName;
    readonly __inputHints__?: {
        readonly export_kind?: KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
    };
    exportKind(): number | undefined;
    name(): ModuleExportName;
    alias(): ModuleExportName | undefined;
}
export interface ExportStatementTypeExport {
    readonly $type: "export_statement_type_export";
    readonly _export_clause: ExportClause;
    readonly _source?: String;
    readonly _semicolon: Semicolon;
    exportClause(): ExportClause;
    source(): String | undefined;
    semicolon(): Semicolon;
}
export interface ExportStatementEqualsExport {
    readonly $type: "export_statement_equals_export";
    readonly _expression: Expression;
    readonly _semicolon: Semicolon;
    expression(): Expression;
    semicolon(): Semicolon;
}
export interface ExportStatementNamespaceExport {
    readonly $type: "export_statement_namespace_export";
    readonly _identifier: Identifier;
    readonly _semicolon: Semicolon;
    identifier(): Identifier;
    semicolon(): Semicolon;
}
export interface ExportStatementUFormDefault {
    readonly $type: TSKindId.ExportStatement;
    readonly $variant: 'default';
    readonly _export_statement_default: ExportStatementDefault;
    exportStatementDefault(): ExportStatementDefault;
}
export interface ExportStatementUFormTypeExport {
    readonly $type: TSKindId.ExportStatement;
    readonly $variant: 'type_export';
    readonly _export_statement_type_export: _ExportStatementTypeExport;
    exportStatementTypeExport(): _ExportStatementTypeExport;
}
export interface ExportStatementUFormEqualsExport {
    readonly $type: TSKindId.ExportStatement;
    readonly $variant: 'equals_export';
    readonly _export_statement_equals_export: _ExportStatementEqualsExport;
    exportStatementEqualsExport(): _ExportStatementEqualsExport;
}
export interface ExportStatementUFormNamespaceExport {
    readonly $type: TSKindId.ExportStatement;
    readonly $variant: 'namespace_export';
    readonly _export_statement_namespace_export: _ExportStatementNamespaceExport;
    exportStatementNamespaceExport(): _ExportStatementNamespaceExport;
}
export type ExportStatement = ExportStatementUFormDefault | ExportStatementUFormTypeExport | ExportStatementUFormEqualsExport | ExportStatementUFormNamespaceExport;
export interface ExpressionStatement {
    readonly $type: TSKindId.ExpressionStatement;
    readonly _expressions: Expressions;
    readonly _semicolon: Semicolon;
    expressions(): Expressions;
    semicolon(): Semicolon;
}
export interface ExtendsClause {
    readonly $type: TSKindId.ExtendsClause;
    readonly _value: NonEmptyArray<Expression>;
    readonly _type_arguments?: TypeArguments;
    values(): NonEmptyArray<Expression>;
    typeArguments(): TypeArguments | undefined;
}
export interface ExtendsTypeClause {
    readonly $type: TSKindId.ExtendsTypeClause;
    readonly _type: NonEmptyArray<TypeIdentifier | NestedTypeIdentifier | GenericType>;
    types(): NonEmptyArray<TypeIdentifier | NestedTypeIdentifier | GenericType>;
}
export interface FieldDefinition {
    readonly $type: "field_definition";
    readonly _decorator?: readonly (Decorator)[];
    readonly _static_marker?: boolean;
    readonly _property: PropertyName;
    readonly _value?: Expression;
    readonly __inputHints__?: {
        readonly static_marker?: BooleanKeyword<"static">;
    };
    decorators(): readonly (Decorator)[];
    staticMarker(): boolean | undefined;
    property(): PropertyName;
    value(): Expression | undefined;
}
export interface FinallyClause {
    readonly $type: TSKindId.FinallyClause;
    readonly _body: StatementBlock;
    body(): StatementBlock;
}
export interface FlowMaybeType {
    readonly $type: TSKindId.FlowMaybeType;
    readonly _primary_type: PrimaryType;
    primaryType(): PrimaryType;
}
export interface ForInStatement {
    readonly $type: TSKindId.ForInStatement;
    readonly _await_marker?: boolean;
    readonly _for_header_lhs: ForHeaderLhs | ForHeaderVarKind | ForHeaderLetConstKind;
    readonly _operator: number;
    readonly _right: Expressions;
    readonly _body: Statement;
    readonly __inputHints__?: {
        readonly await_marker?: BooleanKeyword<"await">;
        readonly operator: KindEnum<"in" | "of", TSKindId.In | TSKindId.Of>;
    };
    awaitMarker(): boolean | undefined;
    forHeaderLhs(): ForHeaderLhs | ForHeaderVarKind | ForHeaderLetConstKind;
    operator(): number;
    right(): Expressions;
    body(): Statement;
}
export interface ForStatement {
    readonly $type: TSKindId.ForStatement;
    readonly _initializer: LexicalDeclaration | VariableDeclaration | Expressions | ";";
    readonly _condition: Expressions | EmptyStatement;
    readonly _increment?: Expressions;
    readonly _body: Statement;
    initializer(): LexicalDeclaration | VariableDeclaration | Expressions | ";";
    condition(): Expressions | EmptyStatement;
    increment(): Expressions | undefined;
    body(): Statement;
}
export interface FormalParameters {
    readonly $type: TSKindId.FormalParameters;
    readonly _formal_parameter?: readonly (FormalParameter)[];
    formalParameters(): readonly (FormalParameter)[];
}
export interface FunctionDeclaration {
    readonly $type: TSKindId.FunctionDeclaration;
    readonly _async_marker?: boolean;
    readonly _name: Identifier;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _body: StatementBlock;
    readonly _automatic_semicolon?: AutomaticSemicolon;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    name(): Identifier;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    body(): StatementBlock;
    automaticSemicolon(): AutomaticSemicolon | undefined;
}
export interface FunctionExpression {
    readonly $type: TSKindId.FunctionExpression;
    readonly _async_marker?: boolean;
    readonly _name?: Identifier;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _body: StatementBlock;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    name(): Identifier | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    body(): StatementBlock;
}
export interface FunctionSignature {
    readonly $type: TSKindId.FunctionSignature;
    readonly _async_marker?: boolean;
    readonly _name: Identifier;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _semicolon: Semicolon | FunctionSignatureAutomaticSemicolon;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    name(): Identifier;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    semicolon(): Semicolon | FunctionSignatureAutomaticSemicolon;
}
export interface FunctionType {
    readonly $type: TSKindId.FunctionType;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type: Type | Asserts | TypePredicate;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): Type | Asserts | TypePredicate;
}
export interface GeneratorFunction {
    readonly $type: TSKindId.GeneratorFunction;
    readonly _async_marker?: boolean;
    readonly _name?: Identifier;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _body: StatementBlock;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    name(): Identifier | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    body(): StatementBlock;
}
export interface GeneratorFunctionDeclaration {
    readonly $type: TSKindId.GeneratorFunctionDeclaration;
    readonly _async_marker?: boolean;
    readonly _name: Identifier;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _body: StatementBlock;
    readonly _automatic_semicolon?: AutomaticSemicolon;
    readonly __inputHints__?: {
        readonly async_marker?: BooleanKeyword<"async">;
    };
    asyncMarker(): boolean | undefined;
    name(): Identifier;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    body(): StatementBlock;
    automaticSemicolon(): AutomaticSemicolon | undefined;
}
export interface GenericType {
    readonly $type: TSKindId.GenericType;
    readonly _name: TypeIdentifier | NestedTypeIdentifier;
    readonly _type_arguments: TypeArguments;
    name(): TypeIdentifier | NestedTypeIdentifier;
    typeArguments(): TypeArguments;
}
export interface IfStatement {
    readonly $type: TSKindId.IfStatement;
    readonly _condition: ParenthesizedExpression;
    readonly _consequence: Statement;
    readonly _alternative?: ElseClause;
    condition(): ParenthesizedExpression;
    consequence(): Statement;
    alternative(): ElseClause | undefined;
}
export interface ImplementsClause {
    readonly $type: TSKindId.ImplementsClause;
    readonly _type: NonEmptyArray<Type>;
    types(): NonEmptyArray<Type>;
}
export interface ImportAlias {
    readonly $type: TSKindId.ImportAlias;
    readonly _name: Identifier;
    readonly _value: Identifier | NestedIdentifier;
    readonly _semicolon: Semicolon;
    name(): Identifier;
    value(): Identifier | NestedIdentifier;
    semicolon(): Semicolon;
}
export interface ImportAttribute {
    readonly $type: TSKindId.ImportAttribute;
    readonly _object: ImportAttributeObject | Object;
    object(): ImportAttributeObject | Object;
}
export interface ImportClauseNamespaceImport {
    readonly $type: "import_clause_namespace_import";
    readonly _namespace_import: NamespaceImport;
    namespaceImport(): NamespaceImport;
}
export interface ImportClauseNamedImports {
    readonly $type: "import_clause_named_imports";
    readonly _named_imports: NamedImports;
    namedImports(): NamedImports;
}
export interface ImportClauseDefaultImport {
    readonly $type: "import_clause_default_import";
    readonly _import_identifier: ImportIdentifier;
    readonly _namespace_import?: NamespaceImport | NamedImports;
    importIdentifier(): ImportIdentifier;
    namespaceImport(): NamespaceImport | NamedImports | undefined;
}
export interface ImportClauseUFormNamespaceImport {
    readonly $type: TSKindId.ImportClause;
    readonly $variant: 'namespace_import';
    readonly _import_clause_namespace_import: _ImportClauseNamespaceImport;
    importClauseNamespaceImport(): _ImportClauseNamespaceImport;
}
export interface ImportClauseUFormNamedImports {
    readonly $type: TSKindId.ImportClause;
    readonly $variant: 'named_imports';
    readonly _import_clause_named_imports: _ImportClauseNamedImports;
    importClauseNamedImports(): _ImportClauseNamedImports;
}
export interface ImportClauseUFormDefaultImport {
    readonly $type: TSKindId.ImportClause;
    readonly $variant: 'default_import';
    readonly _import_clause_default_import: _ImportClauseDefaultImport;
    importClauseDefaultImport(): _ImportClauseDefaultImport;
}
export type ImportClause = ImportClauseUFormNamespaceImport | ImportClauseUFormNamedImports | ImportClauseUFormDefaultImport;
export interface ImportRequireClause {
    readonly $type: TSKindId.ImportRequireClause;
    readonly _identifier: Identifier;
    readonly _source: String;
    identifier(): Identifier;
    source(): String;
}
export interface ImportSpecifierName {
    readonly $type: "import_specifier_name";
    readonly _name: ImportIdentifier;
    name(): ImportIdentifier;
}
export interface ImportSpecifierUFormName {
    readonly $type: TSKindId.ImportSpecifier;
    readonly $variant: 'name';
    readonly _import_kind?: number;
    readonly _import_specifier_name: _ImportSpecifierName;
    readonly __inputHints__?: {
        readonly import_kind?: KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
    };
    importKind(): number | undefined;
    importSpecifierName(): _ImportSpecifierName;
}
export interface ImportSpecifierUFormAs {
    readonly $type: TSKindId.ImportSpecifier;
    readonly $variant: 'as';
    readonly _import_kind?: number;
    readonly _import_specifier_as: ImportSpecifierAs;
    readonly __inputHints__?: {
        readonly import_kind?: KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
    };
    importKind(): number | undefined;
    importSpecifierAs(): ImportSpecifierAs;
}
export type ImportSpecifier = ImportSpecifierUFormName | ImportSpecifierUFormAs;
export interface ImportStatement {
    readonly $type: TSKindId.ImportStatement;
    readonly _import_clause?: number;
    readonly _from_clause: NonEmptyArray<ImportClause | "from" | String | ImportRequireClause>;
    readonly _import_attribute?: ImportAttribute;
    readonly _semicolon: Semicolon;
    readonly __inputHints__?: {
        readonly import_clause?: KindEnum<"type" | "typeof", TSKindId.Type | TSKindId.Typeof>;
    };
    importClause(): number | undefined;
    fromClauses(): NonEmptyArray<ImportClause | "from" | String | ImportRequireClause>;
    importAttribute(): ImportAttribute | undefined;
    semicolon(): Semicolon;
}
export interface IndexSignatureMappedTypeClause {
    readonly $type: "index_signature_mapped_type_clause";
    readonly _mapped_type_clause: MappedTypeClause;
    mappedTypeClause(): MappedTypeClause;
}
export interface IndexSignatureUFormColon {
    readonly $type: TSKindId.IndexSignature;
    readonly $variant: 'colon';
    readonly _sign?: number;
    readonly _index_signature_colon: IndexSignatureColon;
    readonly _type: TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation;
    readonly __inputHints__?: {
        readonly sign?: KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
    };
    sign(): number | undefined;
    indexSignatureColon(): IndexSignatureColon;
    type(): TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation;
}
export interface IndexSignatureUFormMappedTypeClause {
    readonly $type: TSKindId.IndexSignature;
    readonly $variant: 'mapped_type_clause';
    readonly _sign?: number;
    readonly _index_signature_mapped_type_clause: _IndexSignatureMappedTypeClause;
    readonly _type: TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation;
    readonly __inputHints__?: {
        readonly sign?: KindEnum<"-" | "+", TSKindId.Dash | TSKindId.Plus>;
    };
    sign(): number | undefined;
    indexSignatureMappedTypeClause(): _IndexSignatureMappedTypeClause;
    type(): TypeAnnotation | OmittingTypeAnnotation | AddingTypeAnnotation | OptingTypeAnnotation;
}
export type IndexSignature = IndexSignatureUFormColon | IndexSignatureUFormMappedTypeClause;
export interface IndexTypeQuery {
    readonly $type: TSKindId.IndexTypeQuery;
    readonly _primary_type: PrimaryType;
    primaryType(): PrimaryType;
}
export interface InferType {
    readonly $type: TSKindId.InferType;
    readonly _type_identifier: TypeIdentifier;
    readonly _type?: Type;
    typeIdentifier(): TypeIdentifier;
    type(): Type | undefined;
}
export interface InstantiationExpression {
    readonly $type: TSKindId.InstantiationExpression;
    readonly _expression: Expression;
    readonly _type_arguments: TypeArguments;
    expression(): Expression;
    typeArguments(): TypeArguments;
}
export interface InterfaceDeclaration {
    readonly $type: TSKindId.InterfaceDeclaration;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _extends_type_clause?: ExtendsTypeClause;
    readonly _body: ObjectType;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    extendsTypeClause(): ExtendsTypeClause | undefined;
    body(): ObjectType;
}
export interface InternalModule {
    readonly $type: TSKindId.InternalModule;
    readonly _name: String | Identifier | NestedIdentifier;
    readonly _body?: StatementBlock;
    name(): String | Identifier | NestedIdentifier;
    body(): StatementBlock | undefined;
}
export interface IntersectionType {
    readonly $type: TSKindId.IntersectionType;
    readonly _left?: Type;
    readonly _right: Type;
    left(): Type | undefined;
    right(): Type;
}
export interface JsxAttribute {
    readonly $type: "jsx_attribute";
    readonly _jsx_attribute_name: JsxAttributeName;
    readonly _jsx_attribute_value?: JsxAttributeValue;
    jsxAttributeName(): JsxAttributeName;
    jsxAttributeValue(): JsxAttributeValue | undefined;
}
export interface JsxClosingElement {
    readonly $type: "jsx_closing_element";
    readonly _name?: JsxElementName;
    name(): JsxElementName | undefined;
}
export interface JsxElement {
    readonly $type: "jsx_element";
    readonly _open_tag: JsxOpeningElement;
    readonly _jsx_child?: readonly (JsxChild)[];
    readonly _close_tag: JsxClosingElement;
    openTag(): JsxOpeningElement;
    jsxChildren(): readonly (JsxChild)[];
    closeTag(): JsxClosingElement;
}
export interface JsxExpression {
    readonly $type: "jsx_expression";
    readonly _expression?: Expression | SequenceExpression | SpreadElement;
    expression(): Expression | SequenceExpression | SpreadElement | undefined;
}
export interface JsxNamespaceName {
    readonly $type: "jsx_namespace_name";
    readonly _jsx_identifier: _JsxIdentifier;
    jsxIdentifier(): _JsxIdentifier;
}
export interface JsxOpeningElement {
    readonly $type: "jsx_opening_element";
    readonly _name?: _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier;
    readonly _type_arguments?: TypeArguments;
    readonly _attribute?: readonly (_JsxAttribute)[];
    name(): _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier | undefined;
    typeArguments(): TypeArguments | undefined;
    attributes(): readonly (_JsxAttribute)[];
}
export interface JsxSelfClosingElement {
    readonly $type: "jsx_self_closing_element";
    readonly _name?: _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier;
    readonly _type_arguments?: TypeArguments;
    readonly _attribute?: readonly (_JsxAttribute)[];
    name(): _JsxIdentifier | JsxNamespaceName | Identifier | NestedIdentifier | undefined;
    typeArguments(): TypeArguments | undefined;
    attributes(): readonly (_JsxAttribute)[];
}
export interface LabeledStatement {
    readonly $type: TSKindId.LabeledStatement;
    readonly _label: StatementIdentifier;
    readonly _body: Statement;
    label(): StatementIdentifier;
    body(): Statement;
}
export interface LexicalDeclaration {
    readonly $type: TSKindId.LexicalDeclaration;
    readonly _kind: number;
    readonly _declarators: NonEmptyArray<VariableDeclarator>;
    readonly _semicolon: Semicolon;
    readonly __inputHints__?: {
        readonly kind: KindEnum<"let" | "const", TSKindId.Let | TSKindId.Const>;
    };
    kind(): number;
    declarators(): NonEmptyArray<VariableDeclarator>;
    semicolon(): Semicolon;
}
export interface LiteralType {
    readonly $type: TSKindId.LiteralType;
    readonly _number: _Number | Number | String | True | False | Null | Undefined;
    number(): _Number | Number | String | True | False | Null | Undefined;
}
export interface LookupType {
    readonly $type: TSKindId.LookupType;
    readonly _primary_type: PrimaryType;
    readonly _index_type: Type;
    primaryType(): PrimaryType;
    indexType(): Type;
}
export interface MappedTypeClause {
    readonly $type: TSKindId.MappedTypeClause;
    readonly _name: TypeIdentifier;
    readonly _type: Type;
    readonly _alias?: Type;
    name(): TypeIdentifier;
    type(): Type;
    alias(): Type | undefined;
}
export interface MemberExpression {
    readonly $type: TSKindId.MemberExpression;
    readonly _object: Expression | PrimaryExpression | Import;
    readonly _optional_chain?: boolean;
    readonly _property: PrivatePropertyIdentifier | Identifier;
    readonly __inputHints__?: {
        readonly optional_chain?: BooleanKeyword<"?.">;
    };
    object(): Expression | PrimaryExpression | Import;
    optionalChain(): boolean | undefined;
    property(): PrivatePropertyIdentifier | Identifier;
}
export interface MethodDefinition {
    readonly $type: TSKindId.MethodDefinition;
    readonly _accessibility_modifier?: number;
    readonly _static_marker?: boolean;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _async_marker?: boolean;
    readonly _accessor_kind?: number;
    readonly _name: PropertyName;
    readonly _optional_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly _body: StatementBlock;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: BooleanKeyword<"static">;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
        readonly async_marker?: BooleanKeyword<"async">;
        readonly accessor_kind?: KindEnum<"get" | "set" | "*", TSKindId.Get | TSKindId.Set | TSKindId.Star2>;
        readonly optional_marker?: BooleanKeyword<"?">;
    };
    accessibilityModifier(): number | undefined;
    staticMarker(): boolean | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    asyncMarker(): boolean | undefined;
    accessorKind(): number | undefined;
    name(): PropertyName;
    optionalMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
    body(): StatementBlock;
}
export interface MethodSignature {
    readonly $type: TSKindId.MethodSignature;
    readonly _accessibility_modifier?: number;
    readonly _static_marker?: boolean;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _async_marker?: boolean;
    readonly _accessor_kind?: number;
    readonly _name: PropertyName;
    readonly _optional_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: FormalParameters;
    readonly _return_type?: TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: BooleanKeyword<"static">;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
        readonly async_marker?: BooleanKeyword<"async">;
        readonly accessor_kind?: KindEnum<"get" | "set" | "*", TSKindId.Get | TSKindId.Set | TSKindId.Star2>;
        readonly optional_marker?: BooleanKeyword<"?">;
    };
    accessibilityModifier(): number | undefined;
    staticMarker(): boolean | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    asyncMarker(): boolean | undefined;
    accessorKind(): number | undefined;
    name(): PropertyName;
    optionalMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    parameters(): FormalParameters;
    returnType(): TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation | undefined;
}
export interface Module {
    readonly $type: TSKindId.Module;
    readonly _name: String | Identifier | NestedIdentifier;
    readonly _body?: StatementBlock;
    name(): String | Identifier | NestedIdentifier;
    body(): StatementBlock | undefined;
}
export interface NamedImports {
    readonly $type: TSKindId.NamedImports;
    readonly _import_specifier?: readonly (ImportSpecifier)[];
    importSpecifiers(): readonly (ImportSpecifier)[];
}
export interface NamespaceExport {
    readonly $type: TSKindId.NamespaceExport;
    readonly _module_export_name: ModuleExportName;
    moduleExportName(): ModuleExportName;
}
export interface NamespaceImport {
    readonly $type: TSKindId.NamespaceImport;
    readonly _identifier: Identifier;
    identifier(): Identifier;
}
export interface NestedIdentifier {
    readonly $type: TSKindId.NestedIdentifier;
    readonly _object: Identifier | NestedIdentifier;
    readonly _property: Identifier;
    object(): Identifier | NestedIdentifier;
    property(): Identifier;
}
export interface NestedTypeIdentifier {
    readonly $type: TSKindId.NestedTypeIdentifier;
    readonly _module: Identifier | NestedIdentifier;
    readonly _name: TypeIdentifier;
    module(): Identifier | NestedIdentifier;
    name(): TypeIdentifier;
}
export interface NewExpression {
    readonly $type: TSKindId.NewExpression;
    readonly _constructor: PrimaryExpression;
    readonly _type_arguments?: TypeArguments;
    readonly _arguments?: Arguments;
    constructor(): PrimaryExpression;
    typeArguments(): TypeArguments | undefined;
    arguments(): Arguments | undefined;
}
export interface NonNullExpression {
    readonly $type: TSKindId.NonNullExpression;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface Object {
    readonly $type: TSKindId.Object;
    readonly _pair?: readonly (Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier)[];
    pair(): readonly (Pair | SpreadElement | MethodDefinition | ShorthandPropertyIdentifier)[];
}
export interface ObjectAssignmentPattern {
    readonly $type: TSKindId.ObjectAssignmentPattern;
    readonly _left: ShorthandPropertyIdentifierPattern | DestructuringPattern;
    readonly _right: Expression;
    left(): ShorthandPropertyIdentifierPattern | DestructuringPattern;
    right(): Expression;
}
export interface ObjectPattern {
    readonly $type: TSKindId.ObjectPattern;
    readonly _pair_pattern?: readonly (PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern)[];
    pairPattern(): readonly (PairPattern | RestPattern | ObjectAssignmentPattern | ShorthandPropertyIdentifierPattern)[];
}
export interface ObjectType {
    readonly $type: TSKindId.ObjectType;
    readonly _opening: number;
    readonly _members?: NonEmptyArray<"," | ";" | ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature | Semicolon>;
    readonly _closing: number;
    readonly __inputHints__?: {
        readonly opening: KindEnum<"{" | "{|", TSKindId.Lbrace | TSKindId.LbracePipe>;
        readonly closing: KindEnum<"}" | "|}", TSKindId.Rbrace | TSKindId.PipeRbrace>;
    };
    opening(): number;
    members(): NonEmptyArray<"," | ";" | ExportStatement | PropertySignature | CallSignature | ConstructSignature | IndexSignature | MethodSignature | Semicolon>;
    closing(): number;
}
export interface OmittingTypeAnnotation {
    readonly $type: TSKindId.OmittingTypeAnnotation;
    readonly _type: Type;
    type(): Type;
}
export interface OptingTypeAnnotation {
    readonly $type: TSKindId.OptingTypeAnnotation;
    readonly _type: Type;
    type(): Type;
}
export interface OptionalParameter {
    readonly $type: TSKindId.OptionalParameter;
    readonly _decorator?: readonly (Decorator)[];
    readonly _accessibility_modifier?: number;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _pattern: Pattern | This;
    readonly _type?: TypeAnnotation;
    readonly _value?: Expression;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
    };
    decorators(): readonly (Decorator)[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    pattern(): Pattern | This;
    type(): TypeAnnotation | undefined;
    value(): Expression | undefined;
}
export interface OptionalTupleParameter {
    readonly $type: TSKindId.OptionalTupleParameter;
    readonly _name: Identifier;
    readonly _type: TypeAnnotation;
    name(): Identifier;
    type(): TypeAnnotation;
}
export interface OptionalType {
    readonly $type: TSKindId.OptionalType;
    readonly _type: Type;
    type(): Type;
}
export interface Pair {
    readonly $type: TSKindId.Pair;
    readonly _key: PropertyName;
    readonly _value: Expression;
    key(): PropertyName;
    value(): Expression;
}
export interface PairPattern {
    readonly $type: TSKindId.PairPattern;
    readonly _key: PropertyName;
    readonly _value: Pattern | AssignmentPattern;
    key(): PropertyName;
    value(): Pattern | AssignmentPattern;
}
export interface ParenthesizedExpressionSequence {
    readonly $type: "parenthesized_expression_sequence";
    readonly _sequence_expression: SequenceExpression;
    sequenceExpression(): SequenceExpression;
}
export interface ParenthesizedExpressionUFormTyped {
    readonly $type: TSKindId.ParenthesizedExpression;
    readonly $variant: 'typed';
    readonly _parenthesized_expression_typed: ParenthesizedExpressionTyped;
    parenthesizedExpressionTyped(): ParenthesizedExpressionTyped;
}
export interface ParenthesizedExpressionUFormSequence {
    readonly $type: TSKindId.ParenthesizedExpression;
    readonly $variant: 'sequence';
    readonly _parenthesized_expression_sequence: _ParenthesizedExpressionSequence;
    parenthesizedExpressionSequence(): _ParenthesizedExpressionSequence;
}
export type ParenthesizedExpression = ParenthesizedExpressionUFormTyped | ParenthesizedExpressionUFormSequence;
export interface ParenthesizedType {
    readonly $type: TSKindId.ParenthesizedType;
    readonly _type: Type;
    type(): Type;
}
export interface Program {
    readonly $type: TSKindId.Program;
    readonly _hash_bang_line?: HashBangLine;
    readonly _statements?: readonly (Statement)[];
    hashBangLine(): HashBangLine | undefined;
    statements(): readonly (Statement)[];
}
export interface PropertySignature {
    readonly $type: TSKindId.PropertySignature;
    readonly _accessibility_modifier?: number;
    readonly _static_marker?: boolean;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _name: PropertyName;
    readonly _optional_marker?: boolean;
    readonly _type?: TypeAnnotation;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly static_marker?: BooleanKeyword<"static">;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
        readonly optional_marker?: BooleanKeyword<"?">;
    };
    accessibilityModifier(): number | undefined;
    staticMarker(): boolean | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    name(): PropertyName;
    optionalMarker(): boolean | undefined;
    type(): TypeAnnotation | undefined;
}
export interface PublicFieldDefinition {
    readonly $type: TSKindId.PublicFieldDefinition;
    readonly _decorator?: readonly (Decorator)[];
    readonly _public_field_definition_declare_first?: PublicFieldDefinitionDeclareFirst | PublicFieldDefinitionAccessFirst;
    readonly _public_field_definition_static_mods?: PublicFieldDefinitionStaticMods | PublicFieldDefinitionAbstractFirst | PublicFieldDefinitionReadonlyFirst | PublicFieldDefinitionAccessorOpt;
    readonly _name: PropertyName;
    readonly _optionality_marker?: number;
    readonly _type?: TypeAnnotation;
    readonly _value?: Expression;
    readonly __inputHints__?: {
        readonly optionality_marker?: KindEnum<"?" | "!", TSKindId.Qmark | TSKindId.Bang>;
    };
    decorators(): readonly (Decorator)[];
    publicFieldDefinitionDeclareFirst(): PublicFieldDefinitionDeclareFirst | PublicFieldDefinitionAccessFirst | undefined;
    publicFieldDefinitionStaticMods(): PublicFieldDefinitionStaticMods | PublicFieldDefinitionAbstractFirst | PublicFieldDefinitionReadonlyFirst | PublicFieldDefinitionAccessorOpt | undefined;
    name(): PropertyName;
    optionalityMarker(): number | undefined;
    type(): TypeAnnotation | undefined;
    value(): Expression | undefined;
}
export interface ReadonlyType {
    readonly $type: TSKindId.ReadonlyType;
    readonly _type: Type;
    type(): Type;
}
export interface Regex {
    readonly $type: TSKindId.Regex;
    readonly _pattern: RegexPattern;
    readonly _flags?: RegexFlags;
    pattern(): RegexPattern;
    flags(): RegexFlags | undefined;
}
export interface RequiredParameter {
    readonly $type: TSKindId.RequiredParameter;
    readonly _decorator?: readonly (Decorator)[];
    readonly _accessibility_modifier?: number;
    readonly _override_modifier?: boolean;
    readonly _readonly_marker?: boolean;
    readonly _pattern: Pattern | This;
    readonly _type?: TypeAnnotation;
    readonly _value?: Expression;
    readonly __inputHints__?: {
        readonly accessibility_modifier?: KindEnum<"public" | "private" | "protected", TSKindId.Public | TSKindId.Private | TSKindId.Protected>;
        readonly override_modifier?: BooleanKeyword<"override">;
        readonly readonly_marker?: BooleanKeyword<"readonly">;
    };
    decorators(): readonly (Decorator)[];
    accessibilityModifier(): number | undefined;
    overrideModifier(): boolean | undefined;
    readonlyMarker(): boolean | undefined;
    pattern(): Pattern | This;
    type(): TypeAnnotation | undefined;
    value(): Expression | undefined;
}
export interface RestPattern {
    readonly $type: TSKindId.RestPattern;
    readonly _lhs_expression: LhsExpression;
    lhsExpression(): LhsExpression;
}
export interface RestType {
    readonly $type: TSKindId.RestType;
    readonly _type: Type;
    type(): Type;
}
export interface ReturnStatement {
    readonly $type: TSKindId.ReturnStatement;
    readonly _expressions?: Expressions;
    readonly _semicolon: Semicolon;
    expressions(): Expressions | undefined;
    semicolon(): Semicolon;
}
export interface SatisfiesExpression {
    readonly $type: TSKindId.SatisfiesExpression;
    readonly _expression: Expression;
    readonly _type_annotation: Type;
    expression(): Expression;
    typeAnnotation(): Type;
}
export interface SequenceExpression {
    readonly $type: TSKindId.SequenceExpression;
    readonly _expression: NonEmptyArray<Expression>;
    expressions(): NonEmptyArray<Expression>;
}
export interface SpreadElement {
    readonly $type: TSKindId.SpreadElement;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface StatementBlock {
    readonly $type: TSKindId.StatementBlock;
    readonly _statements?: readonly (Statement)[];
    readonly _automatic_semicolon?: AutomaticSemicolon;
    statements(): readonly (Statement)[];
    automaticSemicolon(): AutomaticSemicolon | undefined;
}
export interface String {
    readonly $type: TSKindId.String;
    readonly _opening: number;
    readonly _contents?: readonly (UnescapedDoubleStringFragment | EscapeSequence | UnescapedSingleStringFragment)[];
    readonly _closing: number;
    readonly __inputHints__?: {
        readonly opening: KindEnum<"\"" | "'", TSKindId.Dquote | TSKindId.Squote>;
        readonly closing: KindEnum<"\"" | "'", TSKindId.Dquote | TSKindId.Squote>;
    };
    opening(): number;
    contents(): readonly (UnescapedDoubleStringFragment | EscapeSequence | UnescapedSingleStringFragment)[];
    closing(): number;
}
export interface SubscriptExpression {
    readonly $type: TSKindId.SubscriptExpression;
    readonly _object: Expression | PrimaryExpression;
    readonly _optional_chain?: boolean;
    readonly _index: Expressions;
    readonly __inputHints__?: {
        readonly optional_chain?: BooleanKeyword<"?.">;
    };
    object(): Expression | PrimaryExpression;
    optionalChain(): boolean | undefined;
    index(): Expressions;
}
export interface SwitchBody {
    readonly $type: TSKindId.SwitchBody;
    readonly _switch_case?: readonly (SwitchCase | SwitchDefault)[];
    switchCases(): readonly (SwitchCase | SwitchDefault)[];
}
export interface SwitchCase {
    readonly $type: TSKindId.SwitchCase;
    readonly _value: Expressions;
    readonly _body?: readonly (Statement)[];
    value(): Expressions;
    bodies(): readonly (Statement)[];
}
export interface SwitchDefault {
    readonly $type: TSKindId.SwitchDefault;
    readonly _body?: readonly (Statement)[];
    bodies(): readonly (Statement)[];
}
export interface SwitchStatement {
    readonly $type: TSKindId.SwitchStatement;
    readonly _value: ParenthesizedExpression;
    readonly _body: SwitchBody;
    value(): ParenthesizedExpression;
    body(): SwitchBody;
}
export interface TemplateLiteralType {
    readonly $type: TSKindId.TemplateLiteralType;
    readonly _template_chars?: readonly (TemplateChars | TemplateType)[];
    templateChars(): readonly (TemplateChars | TemplateType)[];
}
export interface TemplateString {
    readonly $type: TSKindId.TemplateString;
    readonly _template_chars?: readonly (TemplateChars | EscapeSequence | TemplateSubstitution)[];
    templateChars(): readonly (TemplateChars | EscapeSequence | TemplateSubstitution)[];
}
export interface TemplateSubstitution {
    readonly $type: TSKindId.TemplateSubstitution;
    readonly _expressions: Expressions;
    expressions(): Expressions;
}
export interface TemplateType {
    readonly $type: TSKindId.TemplateType;
    readonly _primary_type: PrimaryType | InferType;
    primaryType(): PrimaryType | InferType;
}
export interface TernaryExpression {
    readonly $type: TSKindId.TernaryExpression;
    readonly _condition: Expression;
    readonly _consequence: Expression;
    readonly _alternative: Expression;
    condition(): Expression;
    consequence(): Expression;
    alternative(): Expression;
}
export interface ThrowStatement {
    readonly $type: TSKindId.ThrowStatement;
    readonly _expressions: Expressions;
    readonly _semicolon: Semicolon;
    expressions(): Expressions;
    semicolon(): Semicolon;
}
export interface TryStatement {
    readonly $type: TSKindId.TryStatement;
    readonly _body: StatementBlock;
    readonly _handler?: CatchClause;
    readonly _finalizer?: FinallyClause;
    body(): StatementBlock;
    handler(): CatchClause | undefined;
    finalizer(): FinallyClause | undefined;
}
export interface TupleParameter {
    readonly $type: TSKindId.TupleParameter;
    readonly _name: Identifier | RestPattern;
    readonly _type: TypeAnnotation;
    name(): Identifier | RestPattern;
    type(): TypeAnnotation;
}
export interface TupleType {
    readonly $type: TSKindId.TupleType;
    readonly _tuple_type_member?: readonly (TupleTypeMember)[];
    tupleTypeMembers(): readonly (TupleTypeMember)[];
}
export interface TypeAliasDeclaration {
    readonly $type: TSKindId.TypeAliasDeclaration;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _value: Type;
    readonly _semicolon: Semicolon;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    value(): Type;
    semicolon(): Semicolon;
}
export interface TypeAnnotation {
    readonly $type: TSKindId.TypeAnnotation;
    readonly _type: Type;
    type(): Type;
}
export interface TypeArguments {
    readonly $type: TSKindId.TypeArguments;
    readonly _type: NonEmptyArray<Type>;
    types(): NonEmptyArray<Type>;
}
export interface TypeAssertion {
    readonly $type: TSKindId.TypeAssertion;
    readonly _type_arguments: TypeArguments;
    readonly _expression: Expression;
    typeArguments(): TypeArguments;
    expression(): Expression;
}
export interface TypeParameter {
    readonly $type: TSKindId.TypeParameter;
    readonly _const_marker?: boolean;
    readonly _name: TypeIdentifier;
    readonly _constraint?: Constraint;
    readonly _value?: DefaultType;
    readonly __inputHints__?: {
        readonly const_marker?: BooleanKeyword<"const">;
    };
    constMarker(): boolean | undefined;
    name(): TypeIdentifier;
    constraint(): Constraint | undefined;
    value(): DefaultType | undefined;
}
export interface TypeParameters {
    readonly $type: TSKindId.TypeParameters;
    readonly _type_parameter: NonEmptyArray<TypeParameter>;
    typeParameters(): NonEmptyArray<TypeParameter>;
}
export interface TypePredicate {
    readonly $type: TSKindId.TypePredicate;
    readonly _name: PredefinedType | This;
    readonly _type: Type;
    name(): PredefinedType | This;
    type(): Type;
}
export interface TypePredicateAnnotation {
    readonly $type: TSKindId.TypePredicateAnnotation;
    readonly _type_predicate: ":" | TypePredicate;
    typePredicate(): ":" | TypePredicate;
}
export interface TypeQuery {
    readonly $type: TSKindId.TypeQuery;
    readonly _type_query_subscript_expression: TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression | TypeQueryInstantiationExpression | Identifier | This;
    typeQuerySubscriptExpression(): TypeQuerySubscriptExpression | TypeQueryMemberExpression | TypeQueryCallExpression | TypeQueryInstantiationExpression | Identifier | This;
}
export interface UnaryExpression {
    readonly $type: TSKindId.UnaryExpression;
    readonly _operator: number;
    readonly _argument: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"!" | "~" | "-" | "+" | "typeof" | "void" | "delete", TSKindId.Bang | TSKindId.Tilde | TSKindId.Dash | TSKindId.Plus | TSKindId.Typeof | TSKindId.Void | TSKindId.Delete>;
    };
    operator(): number;
    argument(): Expression;
}
export interface UnionType {
    readonly $type: TSKindId.UnionType;
    readonly _left?: Type;
    readonly _right: Type;
    left(): Type | undefined;
    right(): Type;
}
export interface UpdateExpressionUFormPostfix {
    readonly $type: TSKindId.UpdateExpression;
    readonly $variant: 'postfix';
    readonly _update_expression_postfix: UpdateExpressionPostfix;
    updateExpressionPostfix(): UpdateExpressionPostfix;
}
export interface UpdateExpressionUFormPrefix {
    readonly $type: TSKindId.UpdateExpression;
    readonly $variant: 'prefix';
    readonly _update_expression_prefix: UpdateExpressionPrefix;
    updateExpressionPrefix(): UpdateExpressionPrefix;
}
export type UpdateExpression = UpdateExpressionUFormPostfix | UpdateExpressionUFormPrefix;
export interface VariableDeclaration {
    readonly $type: TSKindId.VariableDeclaration;
    readonly _declarators: NonEmptyArray<VariableDeclarator>;
    readonly _semicolon: Semicolon;
    declarators(): NonEmptyArray<VariableDeclarator>;
    semicolon(): Semicolon;
}
export interface VariableDeclarator {
    readonly $type: TSKindId.VariableDeclarator;
    readonly _name: Identifier | DestructuringPattern;
    readonly _type?: TypeAnnotation;
    readonly _value?: Expression;
    name(): Identifier | DestructuringPattern;
    type(): TypeAnnotation | undefined;
    value(): Expression | undefined;
}
export interface WhileStatement {
    readonly $type: TSKindId.WhileStatement;
    readonly _condition: ParenthesizedExpression;
    readonly _body: Statement;
    condition(): ParenthesizedExpression;
    body(): Statement;
}
export interface WithStatement {
    readonly $type: TSKindId.WithStatement;
    readonly _object: ParenthesizedExpression;
    readonly _body: Statement;
    object(): ParenthesizedExpression;
    body(): Statement;
}
export interface YieldExpression {
    readonly $type: TSKindId.YieldExpression;
    readonly _expression?: Expression;
    expression(): Expression | undefined;
}
export type ForHeaderOperator = Terminal<TSKindId.In | TSKindId.Of, "in" | "of">;
export type NumberOperator = Terminal<TSKindId.Dash | TSKindId.Plus, "-" | "+">;
export type _AccessibilityModifier = Terminal<TSKindId.Public | TSKindId.Private | TSKindId.Protected, "public" | "private" | "protected">;
export type AccessorKind = Terminal<TSKindId.Get | TSKindId.Set | TSKindId.Star2, "get" | "set" | "*">;
export type AugmentedAssignmentExpressionOperator = Terminal<TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.CaretEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.GtGtEq | TSKindId.GtGtGtEq | TSKindId.LtLtEq | TSKindId.StarStarEq | TSKindId.AmpAmpEq | TSKindId.PipePipeEq | TSKindId.QmarkQmarkEq, "+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | ">>=" | ">>>=" | "<<=" | "**=" | "&&=" | "||=" | "??=">;
export type ExportSpecifierExportKind = Terminal<TSKindId.Type | TSKindId.Typeof, "type" | "typeof">;
export type ImportAttributeObject = Terminal<TSKindId.With | TSKindId.Assert, "with" | "assert">;
export type Kind = Terminal<TSKindId.Let | TSKindId.Const, "let" | "const">;
export type ObjectTypeClosing = Terminal<TSKindId.Rbrace | TSKindId.PipeRbrace, "}" | "|}">;
export type ObjectTypeOpening = Terminal<TSKindId.Lbrace | TSKindId.LbracePipe, "{" | "{|">;
export type Operator = Terminal<TSKindId.PlusPlus | TSKindId.DashDash, "++" | "--">;
export type PublicFieldDefinitionOptionalityMarker = Terminal<TSKindId.Qmark | TSKindId.Bang, "?" | "!">;
export type ReservedIdentifier = Terminal<"_reserved_identifier", string>;
export type StringOpening = Terminal<TSKindId.Dquote | TSKindId.Squote, "\"" | "'">;
export type TypeIdentifier = Terminal<TSKindId.TypeIdentifier, string>;
export type UnaryExpressionOperator = Terminal<TSKindId.Bang | TSKindId.Tilde | TSKindId.Dash | TSKindId.Plus | TSKindId.Typeof | TSKindId.Void | TSKindId.Delete, "!" | "~" | "-" | "+" | "typeof" | "void" | "delete">;
export type AccessibilityModifier = Terminal<TSKindId.Public | TSKindId.Private | TSKindId.Protected, "public" | "private" | "protected">;
export type Comment = Terminal<TSKindId.Comment, string>;
export type EscapeSequence = Terminal<TSKindId.EscapeSequence, string>;
export type False = Terminal<TSKindId.False, "false">;
export type HashBangLine = Terminal<TSKindId.HashBangLine, string>;
export type HtmlCharacterReference = Terminal<"html_character_reference", string>;
export type Identifier = Terminal<TSKindId.Identifier, string>;
export type Import = Terminal<TSKindId.Import, "import">;
export type JsxIdentifier = Terminal<"jsx_identifier", string>;
export type MetaProperty = Terminal<TSKindId.MetaProperty, string>;
export type Null = Terminal<TSKindId.Null, "null">;
export type Number = Terminal<TSKindId.Number, string>;
export type OverrideModifier = Terminal<TSKindId.OverrideModifier, "override">;
export type PredefinedType = Terminal<TSKindId.PredefinedType, string>;
export type PrivatePropertyIdentifier = Terminal<TSKindId.PrivatePropertyIdentifier, string>;
export type RegexFlags = Terminal<TSKindId.RegexFlags, string>;
export type RegexPattern = Terminal<TSKindId.RegexPattern, string>;
export type Super = Terminal<TSKindId.Super, "super">;
export type This = Terminal<TSKindId.This, "this">;
export type True = Terminal<TSKindId.True, "true">;
export type Undefined = Terminal<TSKindId.Undefined, "undefined">;
export type UnescapedDoubleJsxStringFragment = Terminal<"unescaped_double_jsx_string_fragment", string>;
export type UnescapedDoubleStringFragment = Terminal<TSKindId.UnescapedDoubleStringFragment, string>;
export type UnescapedSingleJsxStringFragment = Terminal<"unescaped_single_jsx_string_fragment", string>;
export type UnescapedSingleStringFragment = Terminal<TSKindId.UnescapedSingleStringFragment, string>;
export type AutomaticSemicolon = Terminal<TSKindId.AutomaticSemicolon, string>;
export type TemplateChars = Terminal<TSKindId.TemplateChars, string>;
export type TernaryQmark = Terminal<TSKindId.TernaryQmark, string>;
export type HtmlComment = Terminal<TSKindId.HtmlComment, string>;
export type Oror = Terminal<"||", string>;
export type JsxText = Terminal<TSKindId.JsxText, string>;
export type FunctionSignatureAutomaticSemicolon = Terminal<TSKindId.FunctionSignatureAutomaticSemicolon, string>;
export type ErrorRecovery = Terminal<TSKindId.ErrorRecovery, string>;
export type Const = Terminal<TSKindId.Const, "const">;
export type Instanceof = Terminal<TSKindId.Instanceof, "instanceof">;
export type In = Terminal<TSKindId.In, "in">;
export interface _AmbientDeclarationDeclarationTree extends AnyTreeNode {
    readonly type: "_ambient_declaration_declaration";
}
export interface AmbientDeclarationGlobalTree extends AnyTreeNode {
    readonly type: "_ambient_declaration_global";
}
export interface AmbientDeclarationModuleTree extends AnyTreeNode {
    readonly type: "_ambient_declaration_module";
}
export interface _ArrowFunctionUCallSignatureTree extends AnyTreeNode {
    readonly type: "_arrow_function__call_signature";
}
export interface _ArrowFunctionParameterTree extends AnyTreeNode {
    readonly type: "_arrow_function_parameter";
}
export interface CallExpressionCallTree extends AnyTreeNode {
    readonly type: "_call_expression_call";
}
export interface CallExpressionMemberTree extends AnyTreeNode {
    readonly type: "_call_expression_member";
}
export interface CallExpressionTemplateCallTree extends AnyTreeNode {
    readonly type: "_call_expression_template_call";
}
export interface _CallSignatureTree extends AnyTreeNode {
    readonly type: "_call_signature";
}
export interface ClassBodyMemberTree extends AnyTreeNode {
    readonly type: "_class_body_member";
}
export interface ClassBodyMethodTree extends AnyTreeNode {
    readonly type: "_class_body_method";
}
export interface ClassBodyMethodSigTree extends AnyTreeNode {
    readonly type: "_class_body_method_sig";
}
export interface _ClassHeritageExtendsClauseTree extends AnyTreeNode {
    readonly type: "_class_heritage_extends_clause";
}
export interface _ClassHeritageImplementsClauseTree extends AnyTreeNode {
    readonly type: "_class_heritage_implements_clause";
}
export interface ExportStatementDefaultDeclArmTree extends AnyTreeNode {
    readonly type: "_export_statement_default_decl_arm";
}
export interface ExportStatementDefaultDeclArmDefaultKwTree extends AnyTreeNode {
    readonly type: "_export_statement_default_decl_arm_default_kw";
}
export interface ExportStatementDefaultDeclArmDefaultKwValueTree extends AnyTreeNode {
    readonly type: "_export_statement_default_decl_arm_default_kw_value";
}
export interface ExportStatementDefaultFromArmTree extends AnyTreeNode {
    readonly type: "_export_statement_default_from_arm";
}
export interface ExportStatementDefaultFromArmClauseFromTree extends AnyTreeNode {
    readonly type: "_export_statement_default_from_arm_clause_from";
}
export interface ExportStatementDefaultFromArmNsFromTree extends AnyTreeNode {
    readonly type: "_export_statement_default_from_arm_ns_from";
}
export interface ExportStatementDefaultFromArmStarFromTree extends AnyTreeNode {
    readonly type: "_export_statement_default_from_arm_star_from";
}
export interface _ExportStatementEqualsExportTree extends AnyTreeNode {
    readonly type: "_export_statement_equals_export";
}
export interface _ExportStatementNamespaceExportTree extends AnyTreeNode {
    readonly type: "_export_statement_namespace_export";
}
export interface _ExportStatementTypeExportTree extends AnyTreeNode {
    readonly type: "_export_statement_type_export";
}
export interface ExtendsClauseSingleTree extends AnyTreeNode {
    readonly type: "_extends_clause_single";
}
export interface ForHeaderTree extends AnyTreeNode {
    readonly type: "_for_header";
}
export interface ForHeaderLetConstKindTree extends AnyTreeNode {
    readonly type: "_for_header_let_const_kind";
}
export interface ForHeaderLhsTree extends AnyTreeNode {
    readonly type: "_for_header_lhs";
}
export interface ForHeaderVarKindTree extends AnyTreeNode {
    readonly type: "_for_header_var_kind";
}
export interface FromClauseTree extends AnyTreeNode {
    readonly type: "_from_clause";
}
export interface _ImportClauseDefaultImportTree extends AnyTreeNode {
    readonly type: "_import_clause_default_import";
}
export interface _ImportClauseNamedImportsTree extends AnyTreeNode {
    readonly type: "_import_clause_named_imports";
}
export interface _ImportClauseNamespaceImportTree extends AnyTreeNode {
    readonly type: "_import_clause_namespace_import";
}
export interface ImportSpecifierAsTree extends AnyTreeNode {
    readonly type: "_import_specifier_as";
}
export interface _ImportSpecifierNameTree extends AnyTreeNode {
    readonly type: "_import_specifier_name";
}
export interface IndexSignatureColonTree extends AnyTreeNode {
    readonly type: "_index_signature_colon";
}
export interface _IndexSignatureMappedTypeClauseTree extends AnyTreeNode {
    readonly type: "_index_signature_mapped_type_clause";
}
export interface InitializerTree extends AnyTreeNode {
    readonly type: "_initializer";
}
export interface JsxStartOpeningElementTree extends AnyTreeNode {
    readonly type: "_jsx_start_opening_element";
}
export interface JsxStringTree extends AnyTreeNode {
    readonly type: "_jsx_string";
}
export interface LhsExpressionTree extends AnyTreeNode {
    readonly type: "_lhs_expression";
}
export interface _ModuleTree extends AnyTreeNode {
    readonly type: "_module";
}
export interface _NumberTree extends AnyTreeNode {
    readonly type: "_number";
}
export interface ParameterNameTree extends AnyTreeNode {
    readonly type: "_parameter_name";
}
export interface _ParenthesizedExpressionSequenceTree extends AnyTreeNode {
    readonly type: "_parenthesized_expression_sequence";
}
export interface ParenthesizedExpressionTypedTree extends AnyTreeNode {
    readonly type: "_parenthesized_expression_typed";
}
export interface PublicFieldDefinitionAbstractFirstTree extends AnyTreeNode {
    readonly type: "_public_field_definition_abstract_first";
}
export interface PublicFieldDefinitionAccessFirstTree extends AnyTreeNode {
    readonly type: "_public_field_definition_access_first";
}
export interface PublicFieldDefinitionAccessorOptTree extends AnyTreeNode {
    readonly type: "_public_field_definition_accessor_opt";
}
export interface PublicFieldDefinitionDeclareFirstTree extends AnyTreeNode {
    readonly type: "_public_field_definition_declare_first";
}
export interface PublicFieldDefinitionReadonlyFirstTree extends AnyTreeNode {
    readonly type: "_public_field_definition_readonly_first";
}
export interface PublicFieldDefinitionStaticModsTree extends AnyTreeNode {
    readonly type: "_public_field_definition_static_mods";
}
export interface TypeQueryCallExpressionTree extends AnyTreeNode {
    readonly type: "_type_query_call_expression";
}
export interface TypeQueryCallExpressionInTypeAnnotationTree extends AnyTreeNode {
    readonly type: "_type_query_call_expression_in_type_annotation";
}
export interface TypeQueryInstantiationExpressionTree extends AnyTreeNode {
    readonly type: "_type_query_instantiation_expression";
}
export interface TypeQueryMemberExpressionTree extends AnyTreeNode {
    readonly type: "_type_query_member_expression";
}
export interface TypeQueryMemberExpressionInTypeAnnotationTree extends AnyTreeNode {
    readonly type: "_type_query_member_expression_in_type_annotation";
}
export interface TypeQuerySubscriptExpressionTree extends AnyTreeNode {
    readonly type: "_type_query_subscript_expression";
}
export interface UpdateExpressionPostfixTree extends AnyTreeNode {
    readonly type: "_update_expression_postfix";
}
export interface UpdateExpressionPrefixTree extends AnyTreeNode {
    readonly type: "_update_expression_prefix";
}
export interface AbstractClassDeclarationTree extends TreeNode<'abstract_class_declaration'> {
}
export interface AbstractMethodSignatureTree extends TreeNode<'abstract_method_signature'> {
}
export interface AddingTypeAnnotationTree extends TreeNode<'adding_type_annotation'> {
}
export interface AmbientDeclarationDeclarationTree extends TreeNode<'ambient_declaration_declaration'> {
}
export interface AmbientDeclarationTree extends TreeNode<'ambient_declaration'> {
}
export interface AmbientDeclarationUFormDeclarationTree extends TreeNode<'ambient_declaration'> {
}
export interface AmbientDeclarationUFormGlobalTree extends TreeNode<'ambient_declaration'> {
}
export interface AmbientDeclarationUFormModuleTree extends TreeNode<'ambient_declaration'> {
}
export interface ArgumentsTree extends TreeNode<'arguments'> {
}
export interface ArrayTree extends TreeNode<'array'> {
}
export interface ArrayPatternTree extends TreeNode<'array_pattern'> {
}
export interface ArrayTypeTree extends TreeNode<'array_type'> {
}
export interface ArrowFunctionParameterTree extends TreeNode<'arrow_function_parameter'> {
}
export interface ArrowFunctionUCallSignatureTree extends TreeNode<'arrow_function__call_signature'> {
}
export interface ArrowFunctionTree extends TreeNode<'arrow_function'> {
}
export interface ArrowFunctionUFormParameterTree extends TreeNode<'arrow_function'> {
}
export interface ArrowFunctionUFormUCallSignatureTree extends TreeNode<'arrow_function'> {
}
export interface AsExpressionTree extends TreeNode<'as_expression'> {
}
export interface AssertsTree extends TreeNode<'asserts'> {
}
export interface AssertsAnnotationTree extends TreeNode<'asserts_annotation'> {
}
export interface AssignmentExpressionTree extends TreeNode<'assignment_expression'> {
}
export interface AssignmentPatternTree extends TreeNode<'assignment_pattern'> {
}
export interface AugmentedAssignmentExpressionTree extends TreeNode<'augmented_assignment_expression'> {
}
export interface AwaitExpressionTree extends TreeNode<'await_expression'> {
}
export interface BinaryExpressionTree extends TreeNode<'binary_expression'> {
}
export interface BreakStatementTree extends TreeNode<'break_statement'> {
}
export interface CallExpressionTree extends TreeNode<'call_expression'> {
}
export interface CallExpressionUFormCallTree extends TreeNode<'call_expression'> {
}
export interface CallExpressionUFormTemplateCallTree extends TreeNode<'call_expression'> {
}
export interface CallExpressionUFormMemberTree extends TreeNode<'call_expression'> {
}
export interface CallSignatureTree extends TreeNode<'call_signature'> {
}
export interface CatchClauseTree extends TreeNode<'catch_clause'> {
}
export interface ClassTree extends TreeNode<'class'> {
}
export interface ClassBodyTree extends TreeNode<'class_body'> {
}
export interface ClassDeclarationTree extends TreeNode<'class_declaration'> {
}
export interface ClassHeritageExtendsClauseTree extends TreeNode<'class_heritage_extends_clause'> {
}
export interface ClassHeritageImplementsClauseTree extends TreeNode<'class_heritage_implements_clause'> {
}
export interface ClassHeritageTree extends TreeNode<'class_heritage'> {
}
export interface ClassHeritageUFormExtendsClauseTree extends TreeNode<'class_heritage'> {
}
export interface ClassHeritageUFormImplementsClauseTree extends TreeNode<'class_heritage'> {
}
export interface ClassStaticBlockTree extends TreeNode<'class_static_block'> {
}
export interface ComputedPropertyNameTree extends TreeNode<'computed_property_name'> {
}
export interface ConditionalTypeTree extends TreeNode<'conditional_type'> {
}
export interface ConstraintTree extends TreeNode<'constraint'> {
}
export interface ConstructSignatureTree extends TreeNode<'construct_signature'> {
}
export interface ConstructorTypeTree extends TreeNode<'constructor_type'> {
}
export interface ContinueStatementTree extends TreeNode<'continue_statement'> {
}
export interface DebuggerStatementTree extends TreeNode<'debugger_statement'> {
}
export interface DecoratorTree extends TreeNode<'decorator'> {
}
export interface DecoratorCallExpressionTree extends AnyTreeNode {
    readonly type: "decorator_call_expression";
}
export interface DecoratorMemberExpressionTree extends AnyTreeNode {
    readonly type: "decorator_member_expression";
}
export interface DecoratorParenthesizedExpressionTree extends AnyTreeNode {
    readonly type: "decorator_parenthesized_expression";
}
export interface DefaultTypeTree extends TreeNode<'default_type'> {
}
export interface DoStatementTree extends TreeNode<'do_statement'> {
}
export interface ElseClauseTree extends TreeNode<'else_clause'> {
}
export interface EnumAssignmentTree extends TreeNode<'enum_assignment'> {
}
export interface EnumBodyTree extends TreeNode<'enum_body'> {
}
export interface EnumDeclarationTree extends TreeNode<'enum_declaration'> {
}
export interface ExportClauseTree extends TreeNode<'export_clause'> {
}
export interface ExportSpecifierTree extends TreeNode<'export_specifier'> {
}
export interface ExportStatementTypeExportTree extends TreeNode<'export_statement_type_export'> {
}
export interface ExportStatementEqualsExportTree extends TreeNode<'export_statement_equals_export'> {
}
export interface ExportStatementNamespaceExportTree extends TreeNode<'export_statement_namespace_export'> {
}
export interface ExportStatementTree extends TreeNode<'export_statement'> {
}
export interface ExportStatementUFormDefaultTree extends TreeNode<'export_statement'> {
}
export interface ExportStatementUFormTypeExportTree extends TreeNode<'export_statement'> {
}
export interface ExportStatementUFormEqualsExportTree extends TreeNode<'export_statement'> {
}
export interface ExportStatementUFormNamespaceExportTree extends TreeNode<'export_statement'> {
}
export interface ExpressionStatementTree extends TreeNode<'expression_statement'> {
}
export interface ExtendsClauseTree extends TreeNode<'extends_clause'> {
}
export interface ExtendsTypeClauseTree extends TreeNode<'extends_type_clause'> {
}
export interface FieldDefinitionTree extends AnyTreeNode {
    readonly type: "field_definition";
}
export interface FinallyClauseTree extends TreeNode<'finally_clause'> {
}
export interface FlowMaybeTypeTree extends TreeNode<'flow_maybe_type'> {
}
export interface ForInStatementTree extends TreeNode<'for_in_statement'> {
}
export interface ForStatementTree extends TreeNode<'for_statement'> {
}
export interface FormalParametersTree extends TreeNode<'formal_parameters'> {
}
export interface FunctionDeclarationTree extends TreeNode<'function_declaration'> {
}
export interface FunctionExpressionTree extends TreeNode<'function_expression'> {
}
export interface FunctionSignatureTree extends TreeNode<'function_signature'> {
}
export interface FunctionTypeTree extends TreeNode<'function_type'> {
}
export interface GeneratorFunctionTree extends TreeNode<'generator_function'> {
}
export interface GeneratorFunctionDeclarationTree extends TreeNode<'generator_function_declaration'> {
}
export interface GenericTypeTree extends TreeNode<'generic_type'> {
}
export interface IfStatementTree extends TreeNode<'if_statement'> {
}
export interface ImplementsClauseTree extends TreeNode<'implements_clause'> {
}
export interface ImportAliasTree extends TreeNode<'import_alias'> {
}
export interface ImportAttributeTree extends TreeNode<'import_attribute'> {
}
export interface ImportClauseNamespaceImportTree extends TreeNode<'import_clause_namespace_import'> {
}
export interface ImportClauseNamedImportsTree extends TreeNode<'import_clause_named_imports'> {
}
export interface ImportClauseDefaultImportTree extends TreeNode<'import_clause_default_import'> {
}
export interface ImportClauseTree extends TreeNode<'import_clause'> {
}
export interface ImportClauseUFormNamespaceImportTree extends TreeNode<'import_clause'> {
}
export interface ImportClauseUFormNamedImportsTree extends TreeNode<'import_clause'> {
}
export interface ImportClauseUFormDefaultImportTree extends TreeNode<'import_clause'> {
}
export interface ImportRequireClauseTree extends TreeNode<'import_require_clause'> {
}
export interface ImportSpecifierNameTree extends TreeNode<'import_specifier_name'> {
}
export interface ImportSpecifierTree extends TreeNode<'import_specifier'> {
}
export interface ImportSpecifierUFormNameTree extends TreeNode<'import_specifier'> {
}
export interface ImportSpecifierUFormAsTree extends TreeNode<'import_specifier'> {
}
export interface ImportStatementTree extends TreeNode<'import_statement'> {
}
export interface IndexSignatureMappedTypeClauseTree extends TreeNode<'index_signature_mapped_type_clause'> {
}
export interface IndexSignatureTree extends TreeNode<'index_signature'> {
}
export interface IndexSignatureUFormColonTree extends TreeNode<'index_signature'> {
}
export interface IndexSignatureUFormMappedTypeClauseTree extends TreeNode<'index_signature'> {
}
export interface IndexTypeQueryTree extends TreeNode<'index_type_query'> {
}
export interface InferTypeTree extends TreeNode<'infer_type'> {
}
export interface InstantiationExpressionTree extends TreeNode<'instantiation_expression'> {
}
export interface InterfaceDeclarationTree extends TreeNode<'interface_declaration'> {
}
export interface InternalModuleTree extends TreeNode<'internal_module'> {
}
export interface IntersectionTypeTree extends TreeNode<'intersection_type'> {
}
export interface JsxAttributeTree extends AnyTreeNode {
    readonly type: "jsx_attribute";
}
export interface JsxClosingElementTree extends AnyTreeNode {
    readonly type: "jsx_closing_element";
}
export interface JsxElementTree extends AnyTreeNode {
    readonly type: "jsx_element";
}
export interface JsxExpressionTree extends AnyTreeNode {
    readonly type: "jsx_expression";
}
export interface JsxNamespaceNameTree extends AnyTreeNode {
    readonly type: "jsx_namespace_name";
}
export interface JsxOpeningElementTree extends AnyTreeNode {
    readonly type: "jsx_opening_element";
}
export interface JsxSelfClosingElementTree extends AnyTreeNode {
    readonly type: "jsx_self_closing_element";
}
export interface LabeledStatementTree extends TreeNode<'labeled_statement'> {
}
export interface LexicalDeclarationTree extends TreeNode<'lexical_declaration'> {
}
export interface LiteralTypeTree extends TreeNode<'literal_type'> {
}
export interface LookupTypeTree extends TreeNode<'lookup_type'> {
}
export interface MappedTypeClauseTree extends TreeNode<'mapped_type_clause'> {
}
export interface MemberExpressionTree extends TreeNode<'member_expression'> {
}
export interface MethodDefinitionTree extends TreeNode<'method_definition'> {
}
export interface MethodSignatureTree extends TreeNode<'method_signature'> {
}
export interface ModuleTree extends TreeNode<'module'> {
}
export interface NamedImportsTree extends TreeNode<'named_imports'> {
}
export interface NamespaceExportTree extends TreeNode<'namespace_export'> {
}
export interface NamespaceImportTree extends TreeNode<'namespace_import'> {
}
export interface NestedIdentifierTree extends TreeNode<'nested_identifier'> {
}
export interface NestedTypeIdentifierTree extends TreeNode<'nested_type_identifier'> {
}
export interface NewExpressionTree extends TreeNode<'new_expression'> {
}
export interface NonNullExpressionTree extends TreeNode<'non_null_expression'> {
}
export interface ObjectTree extends TreeNode<'object'> {
}
export interface ObjectAssignmentPatternTree extends TreeNode<'object_assignment_pattern'> {
}
export interface ObjectPatternTree extends TreeNode<'object_pattern'> {
}
export interface ObjectTypeTree extends TreeNode<'object_type'> {
}
export interface OmittingTypeAnnotationTree extends TreeNode<'omitting_type_annotation'> {
}
export interface OptingTypeAnnotationTree extends TreeNode<'opting_type_annotation'> {
}
export interface OptionalParameterTree extends TreeNode<'optional_parameter'> {
}
export interface OptionalTupleParameterTree extends AnyTreeNode {
    readonly type: "optional_tuple_parameter";
}
export interface OptionalTypeTree extends TreeNode<'optional_type'> {
}
export interface PairTree extends TreeNode<'pair'> {
}
export interface PairPatternTree extends TreeNode<'pair_pattern'> {
}
export interface ParenthesizedExpressionSequenceTree extends TreeNode<'parenthesized_expression_sequence'> {
}
export interface ParenthesizedExpressionTree extends TreeNode<'parenthesized_expression'> {
}
export interface ParenthesizedExpressionUFormTypedTree extends TreeNode<'parenthesized_expression'> {
}
export interface ParenthesizedExpressionUFormSequenceTree extends TreeNode<'parenthesized_expression'> {
}
export interface ParenthesizedTypeTree extends TreeNode<'parenthesized_type'> {
}
export interface ProgramTree extends TreeNode<'program'> {
}
export interface PropertySignatureTree extends TreeNode<'property_signature'> {
}
export interface PublicFieldDefinitionTree extends TreeNode<'public_field_definition'> {
}
export interface ReadonlyTypeTree extends TreeNode<'readonly_type'> {
}
export interface RegexTree extends TreeNode<'regex'> {
}
export interface RequiredParameterTree extends TreeNode<'required_parameter'> {
}
export interface RestPatternTree extends TreeNode<'rest_pattern'> {
}
export interface RestTypeTree extends TreeNode<'rest_type'> {
}
export interface ReturnStatementTree extends TreeNode<'return_statement'> {
}
export interface SatisfiesExpressionTree extends TreeNode<'satisfies_expression'> {
}
export interface SequenceExpressionTree extends TreeNode<'sequence_expression'> {
}
export interface SpreadElementTree extends TreeNode<'spread_element'> {
}
export interface StatementBlockTree extends TreeNode<'statement_block'> {
}
export interface StringTree extends TreeNode<'string'> {
}
export interface SubscriptExpressionTree extends TreeNode<'subscript_expression'> {
}
export interface SwitchBodyTree extends TreeNode<'switch_body'> {
}
export interface SwitchCaseTree extends TreeNode<'switch_case'> {
}
export interface SwitchDefaultTree extends TreeNode<'switch_default'> {
}
export interface SwitchStatementTree extends TreeNode<'switch_statement'> {
}
export interface TemplateLiteralTypeTree extends TreeNode<'template_literal_type'> {
}
export interface TemplateStringTree extends TreeNode<'template_string'> {
}
export interface TemplateSubstitutionTree extends TreeNode<'template_substitution'> {
}
export interface TemplateTypeTree extends TreeNode<'template_type'> {
}
export interface TernaryExpressionTree extends TreeNode<'ternary_expression'> {
}
export interface ThrowStatementTree extends TreeNode<'throw_statement'> {
}
export interface TryStatementTree extends TreeNode<'try_statement'> {
}
export interface TupleParameterTree extends AnyTreeNode {
    readonly type: "tuple_parameter";
}
export interface TupleTypeTree extends TreeNode<'tuple_type'> {
}
export interface TypeAliasDeclarationTree extends TreeNode<'type_alias_declaration'> {
}
export interface TypeAnnotationTree extends TreeNode<'type_annotation'> {
}
export interface TypeArgumentsTree extends TreeNode<'type_arguments'> {
}
export interface TypeAssertionTree extends TreeNode<'type_assertion'> {
}
export interface TypeParameterTree extends TreeNode<'type_parameter'> {
}
export interface TypeParametersTree extends TreeNode<'type_parameters'> {
}
export interface TypePredicateTree extends TreeNode<'type_predicate'> {
}
export interface TypePredicateAnnotationTree extends TreeNode<'type_predicate_annotation'> {
}
export interface TypeQueryTree extends TreeNode<'type_query'> {
}
export interface UnaryExpressionTree extends TreeNode<'unary_expression'> {
}
export interface UnionTypeTree extends TreeNode<'union_type'> {
}
export interface UpdateExpressionTree extends TreeNode<'update_expression'> {
}
export interface UpdateExpressionUFormPostfixTree extends TreeNode<'update_expression'> {
}
export interface UpdateExpressionUFormPrefixTree extends TreeNode<'update_expression'> {
}
export interface VariableDeclarationTree extends TreeNode<'variable_declaration'> {
}
export interface VariableDeclaratorTree extends TreeNode<'variable_declarator'> {
}
export interface WhileStatementTree extends TreeNode<'while_statement'> {
}
export interface WithStatementTree extends TreeNode<'with_statement'> {
}
export interface YieldExpressionTree extends TreeNode<'yield_expression'> {
}
export interface ForHeaderOperatorTree extends AnyTreeNode {
    readonly type: "__for_header_operator";
}
export interface NumberOperatorTree extends AnyTreeNode {
    readonly type: "__number_operator";
}
export interface _AccessibilityModifierTree extends AnyTreeNode {
    readonly type: "_accessibility_modifier";
}
export interface AccessorKindTree extends AnyTreeNode {
    readonly type: "_accessor_kind";
}
export interface AugmentedAssignmentExpressionOperatorTree extends AnyTreeNode {
    readonly type: "_augmented_assignment_expression_operator";
}
export interface ExportSpecifierExportKindTree extends AnyTreeNode {
    readonly type: "_export_specifier_export_kind";
}
export interface ImportAttributeObjectTree extends AnyTreeNode {
    readonly type: "_import_attribute_object";
}
export interface KindTree extends AnyTreeNode {
    readonly type: "_kind";
}
export interface ObjectTypeClosingTree extends AnyTreeNode {
    readonly type: "_object_type_closing";
}
export interface ObjectTypeOpeningTree extends AnyTreeNode {
    readonly type: "_object_type_opening";
}
export interface OperatorTree extends AnyTreeNode {
    readonly type: "_operator";
}
export interface PublicFieldDefinitionOptionalityMarkerTree extends AnyTreeNode {
    readonly type: "_public_field_definition_optionality_marker";
}
export interface ReservedIdentifierTree extends AnyTreeNode {
    readonly type: "_reserved_identifier";
}
export interface StringOpeningTree extends AnyTreeNode {
    readonly type: "_string_opening";
}
export interface TypeIdentifierTree extends AnyTreeNode {
    readonly type: "_type_identifier";
}
export interface UnaryExpressionOperatorTree extends AnyTreeNode {
    readonly type: "_unary_expression_operator";
}
export interface AccessibilityModifierTree extends TreeNode<'accessibility_modifier'> {
}
export interface CommentTree extends TreeNode<'comment'> {
}
export interface EscapeSequenceTree extends TreeNode<'escape_sequence'> {
}
export interface FalseTree extends AnyTreeNode {
    readonly type: "false";
}
export interface HashBangLineTree extends TreeNode<'hash_bang_line'> {
}
export interface HtmlCharacterReferenceTree extends AnyTreeNode {
    readonly type: "html_character_reference";
}
export interface IdentifierTree extends TreeNode<'identifier'> {
}
export interface ImportTree extends AnyTreeNode {
    readonly type: "import";
}
export interface JsxIdentifierTree extends AnyTreeNode {
    readonly type: "jsx_identifier";
}
export interface MetaPropertyTree extends TreeNode<'meta_property'> {
}
export interface NullTree extends AnyTreeNode {
    readonly type: "null";
}
export interface NumberTree extends TreeNode<'number'> {
}
export interface OverrideModifierTree extends AnyTreeNode {
    readonly type: "override_modifier";
}
export interface PredefinedTypeTree extends TreeNode<'predefined_type'> {
}
export interface PrivatePropertyIdentifierTree extends TreeNode<'private_property_identifier'> {
}
export interface RegexFlagsTree extends TreeNode<'regex_flags'> {
}
export interface RegexPatternTree extends TreeNode<'regex_pattern'> {
}
export interface SuperTree extends AnyTreeNode {
    readonly type: "super";
}
export interface ThisTree extends AnyTreeNode {
    readonly type: "this";
}
export interface TrueTree extends AnyTreeNode {
    readonly type: "true";
}
export interface UndefinedTree extends AnyTreeNode {
    readonly type: "undefined";
}
export interface UnescapedDoubleJsxStringFragmentTree extends AnyTreeNode {
    readonly type: "unescaped_double_jsx_string_fragment";
}
export interface UnescapedDoubleStringFragmentTree extends AnyTreeNode {
    readonly type: "unescaped_double_string_fragment";
}
export interface UnescapedSingleJsxStringFragmentTree extends AnyTreeNode {
    readonly type: "unescaped_single_jsx_string_fragment";
}
export interface UnescapedSingleStringFragmentTree extends AnyTreeNode {
    readonly type: "unescaped_single_string_fragment";
}
export interface AutomaticSemicolonTree extends AnyTreeNode {
    readonly type: "_automatic_semicolon";
}
export interface TemplateCharsTree extends AnyTreeNode {
    readonly type: "_template_chars";
}
export interface TernaryQmarkTree extends AnyTreeNode {
    readonly type: "_ternary_qmark";
}
export interface HtmlCommentTree extends TreeNode<'html_comment'> {
}
export interface OrorTree extends AnyTreeNode {
    readonly type: "||";
}
export interface JsxTextTree extends AnyTreeNode {
    readonly type: "jsx_text";
}
export interface FunctionSignatureAutomaticSemicolonTree extends AnyTreeNode {
    readonly type: "_function_signature_automatic_semicolon";
}
export interface ErrorRecoveryTree extends AnyTreeNode {
    readonly type: "__error_recovery";
}
export interface AbstractTree extends AnyTreeNode {
    readonly type: "abstract";
}
export interface GlobalTree extends AnyTreeNode {
    readonly type: "global";
}
export interface AsyncTree extends AnyTreeNode {
    readonly type: "async";
}
export interface ConstTree extends AnyTreeNode {
    readonly type: "const";
}
export interface ExportTree extends AnyTreeNode {
    readonly type: "export";
}
export interface DefaultTree extends AnyTreeNode {
    readonly type: "default";
}
export interface AsTree extends AnyTreeNode {
    readonly type: "as";
}
export interface NamespaceTree extends AnyTreeNode {
    readonly type: "namespace";
}
export interface VarTree extends AnyTreeNode {
    readonly type: "var";
}
export interface FromTree extends AnyTreeNode {
    readonly type: "from";
}
export interface AccessorTree extends AnyTreeNode {
    readonly type: "accessor";
}
export interface AwaitTree extends AnyTreeNode {
    readonly type: "await";
}
export interface DeclareTree extends AnyTreeNode {
    readonly type: "declare";
}
export interface ReadonlyTree extends AnyTreeNode {
    readonly type: "readonly";
}
export interface StaticTree extends AnyTreeNode {
    readonly type: "static";
}
export interface UsingTree extends AnyTreeNode {
    readonly type: "using";
}
export interface OverrideTree extends AnyTreeNode {
    readonly type: "override";
}
export interface InstanceofTree extends AnyTreeNode {
    readonly type: "instanceof";
}
export interface InTree extends AnyTreeNode {
    readonly type: "in";
}
export interface BreakTree extends AnyTreeNode {
    readonly type: "break";
}
export interface CatchTree extends AnyTreeNode {
    readonly type: "catch";
}
export interface ExtendsTree extends AnyTreeNode {
    readonly type: "extends";
}
export interface NewTree extends AnyTreeNode {
    readonly type: "new";
}
export interface ContinueTree extends AnyTreeNode {
    readonly type: "continue";
}
export interface DebuggerTree extends AnyTreeNode {
    readonly type: "debugger";
}
export interface DoTree extends AnyTreeNode {
    readonly type: "do";
}
export interface WhileTree extends AnyTreeNode {
    readonly type: "while";
}
export interface ElseTree extends AnyTreeNode {
    readonly type: "else";
}
export interface EnumTree extends AnyTreeNode {
    readonly type: "enum";
}
export interface FinallyTree extends AnyTreeNode {
    readonly type: "finally";
}
export interface ForTree extends AnyTreeNode {
    readonly type: "for";
}
export interface FunctionTree extends AnyTreeNode {
    readonly type: "function";
}
export interface IfTree extends AnyTreeNode {
    readonly type: "if";
}
export interface ImplementsTree extends AnyTreeNode {
    readonly type: "implements";
}
export interface RequireTree extends AnyTreeNode {
    readonly type: "require";
}
export interface KeyofTree extends AnyTreeNode {
    readonly type: "keyof";
}
export interface InferTree extends AnyTreeNode {
    readonly type: "infer";
}
export interface InterfaceTree extends AnyTreeNode {
    readonly type: "interface";
}
export interface ReturnTree extends AnyTreeNode {
    readonly type: "return";
}
export interface SatisfiesTree extends AnyTreeNode {
    readonly type: "satisfies";
}
export interface CaseTree extends AnyTreeNode {
    readonly type: "case";
}
export interface SwitchTree extends AnyTreeNode {
    readonly type: "switch";
}
export interface ThrowTree extends AnyTreeNode {
    readonly type: "throw";
}
export interface TryTree extends AnyTreeNode {
    readonly type: "try";
}
export interface IsTree extends AnyTreeNode {
    readonly type: "is";
}
export interface TypeofTree extends AnyTreeNode {
    readonly type: "typeof";
}
export interface WithTree extends AnyTreeNode {
    readonly type: "with";
}
export interface YieldTree extends AnyTreeNode {
    readonly type: "yield";
}
export type StringDoubleTree = StringTree;
export type StringSingleTree = StringTree;
export type ObjectTypeCurlyTree = ObjectTypeTree;
export type ObjectTypeFlowTree = ObjectTypeTree;
export type DestructuringPattern = ObjectPattern | ArrayPattern;
export type DestructuringPatternTree = ObjectPatternTree | ArrayPatternTree;
export type ExportStatementDefault = ExportStatementDefaultFromArm | ExportStatementDefaultDeclArm;
export type ExportStatementDefaultTree = ExportStatementDefaultFromArmTree | ExportStatementDefaultDeclArmTree;
export type Expressions = SequenceExpression;
export type ExpressionsTree = SequenceExpressionTree;
export type FormalParameter = RequiredParameter | OptionalParameter;
export type FormalParameterTree = RequiredParameterTree | OptionalParameterTree;
export type _Identifier = Undefined | Identifier;
export type _IdentifierTree = UndefinedTree | IdentifierTree;
export type ImportIdentifier = Identifier;
export type ImportIdentifierTree = IdentifierTree;
export type _JsxAttribute = JsxAttribute | JsxExpression;
export type _JsxAttributeTree = JsxAttributeTree | JsxExpressionTree;
export type JsxAttributeName = JsxIdentifier | Identifier | JsxNamespaceName;
export type JsxAttributeNameTree = JsxIdentifierTree | IdentifierTree | JsxNamespaceNameTree;
export type JsxAttributeValue = JsxString | JsxExpression | JsxElement | JsxSelfClosingElement;
export type JsxAttributeValueTree = JsxStringTree | JsxExpressionTree | JsxElementTree | JsxSelfClosingElementTree;
export type JsxChild = JsxText | HtmlCharacterReference | JsxElement | JsxSelfClosingElement | JsxExpression;
export type JsxChildTree = JsxTextTree | HtmlCharacterReferenceTree | JsxElementTree | JsxSelfClosingElementTree | JsxExpressionTree;
export type _JsxElement = JsxElement | JsxSelfClosingElement;
export type _JsxElementTree = JsxElementTree | JsxSelfClosingElementTree;
export type JsxElementName = JsxIdentifier | Identifier | NestedIdentifier | JsxNamespaceName;
export type JsxElementNameTree = JsxIdentifierTree | IdentifierTree | NestedIdentifierTree | JsxNamespaceNameTree;
export type _JsxIdentifier = JsxIdentifier | Identifier;
export type _JsxIdentifierTree = JsxIdentifierTree | IdentifierTree;
export type ModuleExportName = Identifier | String;
export type ModuleExportNameTree = IdentifierTree | StringTree;
export type PropertyIdentifier = Identifier | ReservedIdentifier;
export type PropertyIdentifierTree = IdentifierTree | ReservedIdentifierTree;
export type PropertyName = PropertyIdentifier | Identifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName;
export type PropertyNameTree = PropertyIdentifierTree | IdentifierTree | PrivatePropertyIdentifierTree | StringTree | NumberTree | ComputedPropertyNameTree;
export type Semicolon = AutomaticSemicolon;
export type SemicolonTree = AutomaticSemicolonTree;
export type ShorthandPropertyIdentifier = Identifier | ReservedIdentifier;
export type ShorthandPropertyIdentifierTree = IdentifierTree | ReservedIdentifierTree;
export type ShorthandPropertyIdentifierPattern = Identifier | ReservedIdentifier;
export type ShorthandPropertyIdentifierPatternTree = IdentifierTree | ReservedIdentifierTree;
export type StatementIdentifier = Identifier | ReservedIdentifier;
export type StatementIdentifierTree = IdentifierTree | ReservedIdentifierTree;
export type TupleTypeMember = TupleParameter | OptionalTupleParameter | OptionalType | RestType;
export type TupleTypeMemberTree = TupleParameterTree | OptionalTupleParameterTree | OptionalTypeTree | RestTypeTree;
export type Declaration = FunctionDeclaration | GeneratorFunctionDeclaration | ClassDeclaration | LexicalDeclaration | VariableDeclaration | FunctionSignature | AbstractClassDeclaration | Module | InternalModule | TypeAliasDeclaration | EnumDeclaration | InterfaceDeclaration | ImportAlias | AmbientDeclaration;
export type DeclarationTree = FunctionDeclarationTree | GeneratorFunctionDeclarationTree | ClassDeclarationTree | LexicalDeclarationTree | VariableDeclarationTree | FunctionSignatureTree | AbstractClassDeclarationTree | ModuleTree | InternalModuleTree | TypeAliasDeclarationTree | EnumDeclarationTree | InterfaceDeclarationTree | ImportAliasTree | AmbientDeclarationTree;
export type Expression = AsExpression | SatisfiesExpression | InstantiationExpression | InternalModule | TypeAssertion | AssignmentExpression | AugmentedAssignmentExpression | AwaitExpression | UnaryExpression | BinaryExpression | TernaryExpression | UpdateExpression | NewExpression | YieldExpression;
export type ExpressionTree = AsExpressionTree | SatisfiesExpressionTree | InstantiationExpressionTree | InternalModuleTree | TypeAssertionTree | AssignmentExpressionTree | AugmentedAssignmentExpressionTree | AwaitExpressionTree | UnaryExpressionTree | BinaryExpressionTree | TernaryExpressionTree | UpdateExpressionTree | NewExpressionTree | YieldExpressionTree;
export type Pattern = MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | RestPattern;
export type PatternTree = MemberExpressionTree | SubscriptExpressionTree | UndefinedTree | IdentifierTree | ObjectPatternTree | ArrayPatternTree | NonNullExpressionTree | RestPatternTree;
export type PrimaryExpression = SubscriptExpression | MemberExpression | ParenthesizedExpression | _Identifier | Undefined | Identifier | ReservedIdentifier | This | Super | Number | String | TemplateString | Regex | True | False | Null | Object | Array | FunctionExpression | ArrowFunction | GeneratorFunction | Class | MetaProperty | CallExpression | NonNullExpression;
export type PrimaryExpressionTree = SubscriptExpressionTree | MemberExpressionTree | ParenthesizedExpressionTree | _IdentifierTree | UndefinedTree | IdentifierTree | ReservedIdentifierTree | ThisTree | SuperTree | NumberTree | StringTree | TemplateStringTree | RegexTree | TrueTree | FalseTree | NullTree | ObjectTree | ArrayTree | FunctionExpressionTree | ArrowFunctionTree | GeneratorFunctionTree | ClassTree | MetaPropertyTree | CallExpressionTree | NonNullExpressionTree;
export type PrimaryType = ParenthesizedType | PredefinedType | TypeIdentifier | NestedTypeIdentifier | GenericType | ObjectType | ArrayType | TupleType | FlowMaybeType | TypeQuery | IndexTypeQuery | This | LiteralType | LookupType | ConditionalType | TemplateLiteralType | IntersectionType | UnionType;
export type PrimaryTypeTree = ParenthesizedTypeTree | PredefinedTypeTree | TypeIdentifierTree | NestedTypeIdentifierTree | GenericTypeTree | ObjectTypeTree | ArrayTypeTree | TupleTypeTree | FlowMaybeTypeTree | TypeQueryTree | IndexTypeQueryTree | ThisTree | LiteralTypeTree | LookupTypeTree | ConditionalTypeTree | TemplateLiteralTypeTree | IntersectionTypeTree | UnionTypeTree;
export type Statement = ExportStatement | ImportStatement | DebuggerStatement | ExpressionStatement | Declaration | StatementBlock | IfStatement | SwitchStatement | ForStatement | ForInStatement | WhileStatement | DoStatement | TryStatement | WithStatement | BreakStatement | ContinueStatement | ReturnStatement | ThrowStatement | LabeledStatement;
export type StatementTree = ExportStatementTree | ImportStatementTree | DebuggerStatementTree | ExpressionStatementTree | DeclarationTree | StatementBlockTree | IfStatementTree | SwitchStatementTree | ForStatementTree | ForInStatementTree | WhileStatementTree | DoStatementTree | TryStatementTree | WithStatementTree | BreakStatementTree | ContinueStatementTree | ReturnStatementTree | ThrowStatementTree | LabeledStatementTree;
export type Type = PrimaryType | FunctionType | ReadonlyType | ConstructorType | InferType | TypeQueryMemberExpressionInTypeAnnotation | TypeQueryCallExpressionInTypeAnnotation;
export type TypeTree = PrimaryTypeTree | FunctionTypeTree | ReadonlyTypeTree | ConstructorTypeTree | InferTypeTree | TypeQueryMemberExpressionInTypeAnnotationTree | TypeQueryCallExpressionInTypeAnnotationTree;
export type EmptyStatement = Terminal<TSKindId.EmptyStatement>;
export interface EmptyStatementTree extends AnyTreeNode {
    readonly type: "empty_statement";
}
export type ExistentialType = Terminal<TSKindId.ExistentialType>;
export interface ExistentialTypeTree extends AnyTreeNode {
    readonly type: "existential_type";
}
export type OptionalChain = Terminal<TSKindId.OptionalChain>;
export interface OptionalChainTree extends AnyTreeNode {
    readonly type: "optional_chain";
}
export type AmpAmp = Terminal<TSKindId.AmpAmp>;
export interface AmpAmpTree extends AnyTreeNode {
    readonly type: "amp_amp";
}
export type PipePipe = Terminal<TSKindId.PipePipe>;
export interface PipePipeTree extends AnyTreeNode {
    readonly type: "pipe_pipe";
}
export type GtGt = Terminal<TSKindId.GtGt>;
export interface GtGtTree extends AnyTreeNode {
    readonly type: "gt_gt";
}
export type GtGtGt = Terminal<TSKindId.GtGtGt>;
export interface GtGtGtTree extends AnyTreeNode {
    readonly type: "gt_gt_gt";
}
export type LtLt = Terminal<TSKindId.LtLt>;
export interface LtLtTree extends AnyTreeNode {
    readonly type: "lt_lt";
}
export type Amp2 = Terminal<TSKindId.Amp2>;
export interface Amp2Tree extends AnyTreeNode {
    readonly type: "amp";
}
export type Caret = Terminal<TSKindId.Caret>;
export interface CaretTree extends AnyTreeNode {
    readonly type: "caret";
}
export type Pipe2 = Terminal<TSKindId.Pipe2>;
export interface Pipe2Tree extends AnyTreeNode {
    readonly type: "pipe";
}
export type Plus = Terminal<TSKindId.Plus>;
export interface PlusTree extends AnyTreeNode {
    readonly type: "plus";
}
export type Dash = Terminal<TSKindId.Dash>;
export interface DashTree extends AnyTreeNode {
    readonly type: "dash";
}
export type Star2 = Terminal<TSKindId.Star2>;
export interface Star2Tree extends AnyTreeNode {
    readonly type: "star";
}
export type Slash2 = Terminal<TSKindId.Slash2>;
export interface Slash2Tree extends AnyTreeNode {
    readonly type: "slash";
}
export type Percent = Terminal<TSKindId.Percent>;
export interface PercentTree extends AnyTreeNode {
    readonly type: "percent";
}
export type StarStar = Terminal<TSKindId.StarStar>;
export interface StarStarTree extends AnyTreeNode {
    readonly type: "star_star";
}
export type Lt2 = Terminal<TSKindId.Lt2>;
export interface Lt2Tree extends AnyTreeNode {
    readonly type: "lt";
}
export type LtEq = Terminal<TSKindId.LtEq>;
export interface LtEqTree extends AnyTreeNode {
    readonly type: "lt_eq";
}
export type EqEq = Terminal<TSKindId.EqEq>;
export interface EqEqTree extends AnyTreeNode {
    readonly type: "eq_eq";
}
export type EqEqEq = Terminal<TSKindId.EqEqEq>;
export interface EqEqEqTree extends AnyTreeNode {
    readonly type: "eq_eq_eq";
}
export type BangEq = Terminal<TSKindId.BangEq>;
export interface BangEqTree extends AnyTreeNode {
    readonly type: "bang_eq";
}
export type BangEqEq = Terminal<TSKindId.BangEqEq>;
export interface BangEqEqTree extends AnyTreeNode {
    readonly type: "bang_eq_eq";
}
export type GtEq = Terminal<TSKindId.GtEq>;
export interface GtEqTree extends AnyTreeNode {
    readonly type: "gt_eq";
}
export type Gt2 = Terminal<TSKindId.Gt2>;
export interface Gt2Tree extends AnyTreeNode {
    readonly type: "gt";
}
export type QmarkQmark = Terminal<TSKindId.QmarkQmark>;
export interface QmarkQmarkTree extends AnyTreeNode {
    readonly type: "qmark_qmark";
}
export type Semi = Terminal<";">;
export interface SemiTree extends AnyTreeNode {
    readonly type: ";";
}
export type TypescriptNode = _AmbientDeclarationDeclaration | AmbientDeclarationGlobal | AmbientDeclarationModule | _ArrowFunctionUCallSignature | _ArrowFunctionParameter | CallExpressionCall | CallExpressionMember | CallExpressionTemplateCall | _CallSignature | ClassBodyMember | ClassBodyMethod | ClassBodyMethodSig | _ClassHeritageExtendsClause | _ClassHeritageImplementsClause | ExportStatementDefaultDeclArm | ExportStatementDefaultDeclArmDefaultKw | ExportStatementDefaultDeclArmDefaultKwValue | ExportStatementDefaultFromArm | ExportStatementDefaultFromArmClauseFrom | ExportStatementDefaultFromArmNsFrom | ExportStatementDefaultFromArmStarFrom | _ExportStatementEqualsExport | _ExportStatementNamespaceExport | _ExportStatementTypeExport | ExtendsClauseSingle | ForHeader | ForHeaderLetConstKind | ForHeaderLhs | ForHeaderVarKind | FromClause | _ImportClauseDefaultImport | _ImportClauseNamedImports | _ImportClauseNamespaceImport | ImportSpecifierAs | _ImportSpecifierName | IndexSignatureColon | _IndexSignatureMappedTypeClause | Initializer | JsxStartOpeningElement | JsxString | LhsExpression | _Module | _Number | ParameterName | _ParenthesizedExpressionSequence | ParenthesizedExpressionTyped | PublicFieldDefinitionAbstractFirst | PublicFieldDefinitionAccessFirst | PublicFieldDefinitionAccessorOpt | PublicFieldDefinitionDeclareFirst | PublicFieldDefinitionReadonlyFirst | PublicFieldDefinitionStaticMods | TypeQueryCallExpression | TypeQueryCallExpressionInTypeAnnotation | TypeQueryInstantiationExpression | TypeQueryMemberExpression | TypeQueryMemberExpressionInTypeAnnotation | TypeQuerySubscriptExpression | UpdateExpressionPostfix | UpdateExpressionPrefix | AbstractClassDeclaration | AbstractMethodSignature | AddingTypeAnnotation | AmbientDeclarationDeclaration | AmbientDeclaration | Arguments | Array | ArrayPattern | ArrayType | ArrowFunctionParameter | ArrowFunctionUCallSignature | ArrowFunction | AsExpression | Asserts | AssertsAnnotation | AssignmentExpression | AssignmentPattern | AugmentedAssignmentExpression | AwaitExpression | BinaryExpression | BreakStatement | CallExpression | CallSignature | CatchClause | Class | ClassBody | ClassDeclaration | ClassHeritageExtendsClause | ClassHeritageImplementsClause | ClassHeritage | ClassStaticBlock | ComputedPropertyName | ConditionalType | Constraint | ConstructSignature | ConstructorType | ContinueStatement | DebuggerStatement | Decorator | DecoratorCallExpression | DecoratorMemberExpression | DecoratorParenthesizedExpression | DefaultType | DoStatement | ElseClause | EnumAssignment | EnumBody | EnumDeclaration | ExportClause | ExportSpecifier | ExportStatementTypeExport | ExportStatementEqualsExport | ExportStatementNamespaceExport | ExportStatement | ExpressionStatement | ExtendsClause | ExtendsTypeClause | FieldDefinition | FinallyClause | FlowMaybeType | ForInStatement | ForStatement | FormalParameters | FunctionDeclaration | FunctionExpression | FunctionSignature | FunctionType | GeneratorFunction | GeneratorFunctionDeclaration | GenericType | IfStatement | ImplementsClause | ImportAlias | ImportAttribute | ImportClauseNamespaceImport | ImportClauseNamedImports | ImportClauseDefaultImport | ImportClause | ImportRequireClause | ImportSpecifierName | ImportSpecifier | ImportStatement | IndexSignatureMappedTypeClause | IndexSignature | IndexTypeQuery | InferType | InstantiationExpression | InterfaceDeclaration | InternalModule | IntersectionType | JsxAttribute | JsxClosingElement | JsxElement | JsxExpression | JsxNamespaceName | JsxOpeningElement | JsxSelfClosingElement | LabeledStatement | LexicalDeclaration | LiteralType | LookupType | MappedTypeClause | MemberExpression | MethodDefinition | MethodSignature | Module | NamedImports | NamespaceExport | NamespaceImport | NestedIdentifier | NestedTypeIdentifier | NewExpression | NonNullExpression | Object | ObjectAssignmentPattern | ObjectPattern | ObjectType | OmittingTypeAnnotation | OptingTypeAnnotation | OptionalParameter | OptionalTupleParameter | OptionalType | Pair | PairPattern | ParenthesizedExpressionSequence | ParenthesizedExpression | ParenthesizedType | Program | PropertySignature | PublicFieldDefinition | ReadonlyType | Regex | RequiredParameter | RestPattern | RestType | ReturnStatement | SatisfiesExpression | SequenceExpression | SpreadElement | StatementBlock | String | SubscriptExpression | SwitchBody | SwitchCase | SwitchDefault | SwitchStatement | TemplateLiteralType | TemplateString | TemplateSubstitution | TemplateType | TernaryExpression | ThrowStatement | TryStatement | TupleParameter | TupleType | TypeAliasDeclaration | TypeAnnotation | TypeArguments | TypeAssertion | TypeParameter | TypeParameters | TypePredicate | TypePredicateAnnotation | TypeQuery | UnaryExpression | UnionType | UpdateExpression | VariableDeclaration | VariableDeclarator | WhileStatement | WithStatement | YieldExpression;
export interface KindMap {
    '_ambient_declaration_declaration': _AmbientDeclarationDeclaration;
    '_ambient_declaration_global': AmbientDeclarationGlobal;
    '_ambient_declaration_module': AmbientDeclarationModule;
    '_arrow_function__call_signature': _ArrowFunctionUCallSignature;
    '_arrow_function_parameter': _ArrowFunctionParameter;
    '_call_expression_call': CallExpressionCall;
    '_call_expression_member': CallExpressionMember;
    '_call_expression_template_call': CallExpressionTemplateCall;
    '_call_signature': _CallSignature;
    '_class_body_member': ClassBodyMember;
    '_class_body_method': ClassBodyMethod;
    '_class_body_method_sig': ClassBodyMethodSig;
    '_class_heritage_extends_clause': _ClassHeritageExtendsClause;
    '_class_heritage_implements_clause': _ClassHeritageImplementsClause;
    '_export_statement_default_decl_arm': ExportStatementDefaultDeclArm;
    '_export_statement_default_decl_arm_default_kw': ExportStatementDefaultDeclArmDefaultKw;
    '_export_statement_default_decl_arm_default_kw_value': ExportStatementDefaultDeclArmDefaultKwValue;
    '_export_statement_default_from_arm': ExportStatementDefaultFromArm;
    '_export_statement_default_from_arm_clause_from': ExportStatementDefaultFromArmClauseFrom;
    '_export_statement_default_from_arm_ns_from': ExportStatementDefaultFromArmNsFrom;
    '_export_statement_default_from_arm_star_from': ExportStatementDefaultFromArmStarFrom;
    '_export_statement_equals_export': _ExportStatementEqualsExport;
    '_export_statement_namespace_export': _ExportStatementNamespaceExport;
    '_export_statement_type_export': _ExportStatementTypeExport;
    '_extends_clause_single': ExtendsClauseSingle;
    '_for_header': ForHeader;
    '_for_header_let_const_kind': ForHeaderLetConstKind;
    '_for_header_lhs': ForHeaderLhs;
    '_for_header_var_kind': ForHeaderVarKind;
    '_from_clause': FromClause;
    '_import_clause_default_import': _ImportClauseDefaultImport;
    '_import_clause_named_imports': _ImportClauseNamedImports;
    '_import_clause_namespace_import': _ImportClauseNamespaceImport;
    '_import_specifier_as': ImportSpecifierAs;
    '_import_specifier_name': _ImportSpecifierName;
    '_index_signature_colon': IndexSignatureColon;
    '_index_signature_mapped_type_clause': _IndexSignatureMappedTypeClause;
    '_initializer': Initializer;
    '_jsx_start_opening_element': JsxStartOpeningElement;
    '_jsx_string': JsxString;
    '_lhs_expression': LhsExpression;
    '_module': _Module;
    '_number': _Number;
    '_parameter_name': ParameterName;
    '_parenthesized_expression_sequence': _ParenthesizedExpressionSequence;
    '_parenthesized_expression_typed': ParenthesizedExpressionTyped;
    '_public_field_definition_abstract_first': PublicFieldDefinitionAbstractFirst;
    '_public_field_definition_access_first': PublicFieldDefinitionAccessFirst;
    '_public_field_definition_accessor_opt': PublicFieldDefinitionAccessorOpt;
    '_public_field_definition_declare_first': PublicFieldDefinitionDeclareFirst;
    '_public_field_definition_readonly_first': PublicFieldDefinitionReadonlyFirst;
    '_public_field_definition_static_mods': PublicFieldDefinitionStaticMods;
    '_type_query_call_expression': TypeQueryCallExpression;
    '_type_query_call_expression_in_type_annotation': TypeQueryCallExpressionInTypeAnnotation;
    '_type_query_instantiation_expression': TypeQueryInstantiationExpression;
    '_type_query_member_expression': TypeQueryMemberExpression;
    '_type_query_member_expression_in_type_annotation': TypeQueryMemberExpressionInTypeAnnotation;
    '_type_query_subscript_expression': TypeQuerySubscriptExpression;
    '_update_expression_postfix': UpdateExpressionPostfix;
    '_update_expression_prefix': UpdateExpressionPrefix;
    'abstract_class_declaration': AbstractClassDeclaration;
    'abstract_method_signature': AbstractMethodSignature;
    'adding_type_annotation': AddingTypeAnnotation;
    'ambient_declaration_declaration': AmbientDeclarationDeclaration;
    'ambient_declaration': AmbientDeclaration;
    'arguments': Arguments;
    'array': Array;
    'array_pattern': ArrayPattern;
    'array_type': ArrayType;
    'arrow_function_parameter': ArrowFunctionParameter;
    'arrow_function__call_signature': ArrowFunctionUCallSignature;
    'arrow_function': ArrowFunction;
    'as_expression': AsExpression;
    'asserts': Asserts;
    'asserts_annotation': AssertsAnnotation;
    'assignment_expression': AssignmentExpression;
    'assignment_pattern': AssignmentPattern;
    'augmented_assignment_expression': AugmentedAssignmentExpression;
    'await_expression': AwaitExpression;
    'binary_expression': BinaryExpression;
    'break_statement': BreakStatement;
    'call_expression': CallExpression;
    'call_signature': CallSignature;
    'catch_clause': CatchClause;
    'class': Class;
    'class_body': ClassBody;
    'class_declaration': ClassDeclaration;
    'class_heritage_extends_clause': ClassHeritageExtendsClause;
    'class_heritage_implements_clause': ClassHeritageImplementsClause;
    'class_heritage': ClassHeritage;
    'class_static_block': ClassStaticBlock;
    'computed_property_name': ComputedPropertyName;
    'conditional_type': ConditionalType;
    'constraint': Constraint;
    'construct_signature': ConstructSignature;
    'constructor_type': ConstructorType;
    'continue_statement': ContinueStatement;
    'debugger_statement': DebuggerStatement;
    'decorator': Decorator;
    'decorator_call_expression': DecoratorCallExpression;
    'decorator_member_expression': DecoratorMemberExpression;
    'decorator_parenthesized_expression': DecoratorParenthesizedExpression;
    'default_type': DefaultType;
    'do_statement': DoStatement;
    'else_clause': ElseClause;
    'enum_assignment': EnumAssignment;
    'enum_body': EnumBody;
    'enum_declaration': EnumDeclaration;
    'export_clause': ExportClause;
    'export_specifier': ExportSpecifier;
    'export_statement_type_export': ExportStatementTypeExport;
    'export_statement_equals_export': ExportStatementEqualsExport;
    'export_statement_namespace_export': ExportStatementNamespaceExport;
    'export_statement': ExportStatement;
    'expression_statement': ExpressionStatement;
    'extends_clause': ExtendsClause;
    'extends_type_clause': ExtendsTypeClause;
    'field_definition': FieldDefinition;
    'finally_clause': FinallyClause;
    'flow_maybe_type': FlowMaybeType;
    'for_in_statement': ForInStatement;
    'for_statement': ForStatement;
    'formal_parameters': FormalParameters;
    'function_declaration': FunctionDeclaration;
    'function_expression': FunctionExpression;
    'function_signature': FunctionSignature;
    'function_type': FunctionType;
    'generator_function': GeneratorFunction;
    'generator_function_declaration': GeneratorFunctionDeclaration;
    'generic_type': GenericType;
    'if_statement': IfStatement;
    'implements_clause': ImplementsClause;
    'import_alias': ImportAlias;
    'import_attribute': ImportAttribute;
    'import_clause_namespace_import': ImportClauseNamespaceImport;
    'import_clause_named_imports': ImportClauseNamedImports;
    'import_clause_default_import': ImportClauseDefaultImport;
    'import_clause': ImportClause;
    'import_require_clause': ImportRequireClause;
    'import_specifier_name': ImportSpecifierName;
    'import_specifier': ImportSpecifier;
    'import_statement': ImportStatement;
    'index_signature_mapped_type_clause': IndexSignatureMappedTypeClause;
    'index_signature': IndexSignature;
    'index_type_query': IndexTypeQuery;
    'infer_type': InferType;
    'instantiation_expression': InstantiationExpression;
    'interface_declaration': InterfaceDeclaration;
    'internal_module': InternalModule;
    'intersection_type': IntersectionType;
    'jsx_attribute': JsxAttribute;
    'jsx_closing_element': JsxClosingElement;
    'jsx_element': JsxElement;
    'jsx_expression': JsxExpression;
    'jsx_namespace_name': JsxNamespaceName;
    'jsx_opening_element': JsxOpeningElement;
    'jsx_self_closing_element': JsxSelfClosingElement;
    'labeled_statement': LabeledStatement;
    'lexical_declaration': LexicalDeclaration;
    'literal_type': LiteralType;
    'lookup_type': LookupType;
    'mapped_type_clause': MappedTypeClause;
    'member_expression': MemberExpression;
    'method_definition': MethodDefinition;
    'method_signature': MethodSignature;
    'module': Module;
    'named_imports': NamedImports;
    'namespace_export': NamespaceExport;
    'namespace_import': NamespaceImport;
    'nested_identifier': NestedIdentifier;
    'nested_type_identifier': NestedTypeIdentifier;
    'new_expression': NewExpression;
    'non_null_expression': NonNullExpression;
    'object': Object;
    'object_assignment_pattern': ObjectAssignmentPattern;
    'object_pattern': ObjectPattern;
    'object_type': ObjectType;
    'omitting_type_annotation': OmittingTypeAnnotation;
    'opting_type_annotation': OptingTypeAnnotation;
    'optional_parameter': OptionalParameter;
    'optional_tuple_parameter': OptionalTupleParameter;
    'optional_type': OptionalType;
    'pair': Pair;
    'pair_pattern': PairPattern;
    'parenthesized_expression_sequence': ParenthesizedExpressionSequence;
    'parenthesized_expression': ParenthesizedExpression;
    'parenthesized_type': ParenthesizedType;
    'program': Program;
    'property_signature': PropertySignature;
    'public_field_definition': PublicFieldDefinition;
    'readonly_type': ReadonlyType;
    'regex': Regex;
    'required_parameter': RequiredParameter;
    'rest_pattern': RestPattern;
    'rest_type': RestType;
    'return_statement': ReturnStatement;
    'satisfies_expression': SatisfiesExpression;
    'sequence_expression': SequenceExpression;
    'spread_element': SpreadElement;
    'statement_block': StatementBlock;
    'string': String;
    'subscript_expression': SubscriptExpression;
    'switch_body': SwitchBody;
    'switch_case': SwitchCase;
    'switch_default': SwitchDefault;
    'switch_statement': SwitchStatement;
    'template_literal_type': TemplateLiteralType;
    'template_string': TemplateString;
    'template_substitution': TemplateSubstitution;
    'template_type': TemplateType;
    'ternary_expression': TernaryExpression;
    'throw_statement': ThrowStatement;
    'try_statement': TryStatement;
    'tuple_parameter': TupleParameter;
    'tuple_type': TupleType;
    'type_alias_declaration': TypeAliasDeclaration;
    'type_annotation': TypeAnnotation;
    'type_arguments': TypeArguments;
    'type_assertion': TypeAssertion;
    'type_parameter': TypeParameter;
    'type_parameters': TypeParameters;
    'type_predicate': TypePredicate;
    'type_predicate_annotation': TypePredicateAnnotation;
    'type_query': TypeQuery;
    'unary_expression': UnaryExpression;
    'union_type': UnionType;
    'update_expression': UpdateExpression;
    'variable_declaration': VariableDeclaration;
    'variable_declarator': VariableDeclarator;
    'while_statement': WhileStatement;
    'with_statement': WithStatement;
    'yield_expression': YieldExpression;
    '__for_header_operator': ForHeaderOperator;
    '__number_operator': NumberOperator;
    '_accessibility_modifier': _AccessibilityModifier;
    '_accessor_kind': AccessorKind;
    '_augmented_assignment_expression_operator': AugmentedAssignmentExpressionOperator;
    '_export_specifier_export_kind': ExportSpecifierExportKind;
    '_import_attribute_object': ImportAttributeObject;
    '_kind': Kind;
    '_object_type_closing': ObjectTypeClosing;
    '_object_type_opening': ObjectTypeOpening;
    '_operator': Operator;
    '_public_field_definition_optionality_marker': PublicFieldDefinitionOptionalityMarker;
    '_reserved_identifier': ReservedIdentifier;
    '_string_opening': StringOpening;
    '_type_identifier': TypeIdentifier;
    '_unary_expression_operator': UnaryExpressionOperator;
    'accessibility_modifier': AccessibilityModifier;
    'comment': Comment;
    'escape_sequence': EscapeSequence;
    'false': False;
    'hash_bang_line': HashBangLine;
    'html_character_reference': HtmlCharacterReference;
    'identifier': Identifier;
    'import': Import;
    'jsx_identifier': JsxIdentifier;
    'meta_property': MetaProperty;
    'null': Null;
    'number': Number;
    'override_modifier': OverrideModifier;
    'predefined_type': PredefinedType;
    'private_property_identifier': PrivatePropertyIdentifier;
    'regex_flags': RegexFlags;
    'regex_pattern': RegexPattern;
    'super': Super;
    'this': This;
    'true': True;
    'undefined': Undefined;
    'unescaped_double_jsx_string_fragment': UnescapedDoubleJsxStringFragment;
    'unescaped_double_string_fragment': UnescapedDoubleStringFragment;
    'unescaped_single_jsx_string_fragment': UnescapedSingleJsxStringFragment;
    'unescaped_single_string_fragment': UnescapedSingleStringFragment;
    '_automatic_semicolon': AutomaticSemicolon;
    '_template_chars': TemplateChars;
    '_ternary_qmark': TernaryQmark;
    'html_comment': HtmlComment;
    '||': Oror;
    'jsx_text': JsxText;
    '_function_signature_automatic_semicolon': FunctionSignatureAutomaticSemicolon;
    '__error_recovery': ErrorRecovery;
    'const': Const;
    'instanceof': Instanceof;
    'in': In;
}
export interface VariantMap {
    'ambient_declaration': {
        declaration: AmbientDeclarationUFormDeclaration;
        global: AmbientDeclarationUFormGlobal;
        module: AmbientDeclarationUFormModule;
    };
    'arrow_function': {
        parameter: ArrowFunctionUFormParameter;
        _call_signature: ArrowFunctionUFormUCallSignature;
    };
    'call_expression': {
        call: CallExpressionUFormCall;
        template_call: CallExpressionUFormTemplateCall;
        member: CallExpressionUFormMember;
    };
    'class_heritage': {
        extends_clause: ClassHeritageUFormExtendsClause;
        implements_clause: ClassHeritageUFormImplementsClause;
    };
    'export_statement': {
        default: ExportStatementUFormDefault;
        type_export: ExportStatementUFormTypeExport;
        equals_export: ExportStatementUFormEqualsExport;
        namespace_export: ExportStatementUFormNamespaceExport;
    };
    'import_clause': {
        namespace_import: ImportClauseUFormNamespaceImport;
        named_imports: ImportClauseUFormNamedImports;
        default_import: ImportClauseUFormDefaultImport;
    };
    'import_specifier': {
        name: ImportSpecifierUFormName;
        as: ImportSpecifierUFormAs;
    };
    'index_signature': {
        colon: IndexSignatureUFormColon;
        mapped_type_clause: IndexSignatureUFormMappedTypeClause;
    };
    'parenthesized_expression': {
        typed: ParenthesizedExpressionUFormTyped;
        sequence: ParenthesizedExpressionUFormSequence;
    };
    'update_expression': {
        postfix: UpdateExpressionUFormPostfix;
        prefix: UpdateExpressionUFormPrefix;
    };
}
export interface _AmbientDeclarationDeclarationNs extends NodeNs<_AmbientDeclarationDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AmbientDeclarationGlobalNs extends NodeNs<AmbientDeclarationGlobal, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AmbientDeclarationModuleNs extends NodeNs<AmbientDeclarationModule, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ArrowFunctionUCallSignatureNs extends NodeNs<_ArrowFunctionUCallSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ArrowFunctionParameterNs extends NodeNs<_ArrowFunctionParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallExpressionCallNs extends NodeNs<CallExpressionCall, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallExpressionMemberNs extends NodeNs<CallExpressionMember, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallExpressionTemplateCallNs extends NodeNs<CallExpressionTemplateCall, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _CallSignatureNs extends NodeNs<_CallSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassBodyMemberNs extends NodeNs<ClassBodyMember, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassBodyMethodNs extends NodeNs<ClassBodyMethod, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassBodyMethodSigNs extends NodeNs<ClassBodyMethodSig, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ClassHeritageExtendsClauseNs extends NodeNs<_ClassHeritageExtendsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ClassHeritageImplementsClauseNs extends NodeNs<_ClassHeritageImplementsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultDeclArmNs extends NodeNs<ExportStatementDefaultDeclArm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultDeclArmDefaultKwNs extends NodeNs<ExportStatementDefaultDeclArmDefaultKw, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultDeclArmDefaultKwValueNs extends NodeNs<ExportStatementDefaultDeclArmDefaultKwValue, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultFromArmNs extends NodeNs<ExportStatementDefaultFromArm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultFromArmClauseFromNs extends NodeNs<ExportStatementDefaultFromArmClauseFrom, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultFromArmNsFromNs extends NodeNs<ExportStatementDefaultFromArmNsFrom, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementDefaultFromArmStarFromNs extends NodeNs<ExportStatementDefaultFromArmStarFrom, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ExportStatementEqualsExportNs extends NodeNs<_ExportStatementEqualsExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ExportStatementNamespaceExportNs extends NodeNs<_ExportStatementNamespaceExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ExportStatementTypeExportNs extends NodeNs<_ExportStatementTypeExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExtendsClauseSingleNs extends NodeNs<ExtendsClauseSingle, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForHeaderNs extends NodeNs<ForHeader, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForHeaderLetConstKindNs extends NodeNs<ForHeaderLetConstKind, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForHeaderLhsNs extends NodeNs<ForHeaderLhs, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForHeaderVarKindNs extends NodeNs<ForHeaderVarKind, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FromClauseNs extends NodeNs<FromClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ImportClauseDefaultImportNs extends NodeNs<_ImportClauseDefaultImport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ImportClauseNamedImportsNs extends NodeNs<_ImportClauseNamedImports, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ImportClauseNamespaceImportNs extends NodeNs<_ImportClauseNamespaceImport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportSpecifierAsNs extends NodeNs<ImportSpecifierAs, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ImportSpecifierNameNs extends NodeNs<_ImportSpecifierName, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IndexSignatureColonNs extends NodeNs<IndexSignatureColon, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _IndexSignatureMappedTypeClauseNs extends NodeNs<_IndexSignatureMappedTypeClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InitializerNs extends NodeNs<Initializer, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxStartOpeningElementNs extends NodeNs<JsxStartOpeningElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxStringNs extends NodeNs<JsxString, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LhsExpressionNs extends NodeNs<LhsExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ModuleNs extends NodeNs<_Module, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _NumberNs extends NodeNs<_Number, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParameterNameNs extends NodeNs<ParameterName, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ParenthesizedExpressionSequenceNs extends NodeNs<_ParenthesizedExpressionSequence, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParenthesizedExpressionTypedNs extends NodeNs<ParenthesizedExpressionTyped, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionAbstractFirstNs extends NodeNs<PublicFieldDefinitionAbstractFirst, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionAccessFirstNs extends NodeNs<PublicFieldDefinitionAccessFirst, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionAccessorOptNs extends NodeNs<PublicFieldDefinitionAccessorOpt, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionDeclareFirstNs extends NodeNs<PublicFieldDefinitionDeclareFirst, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionReadonlyFirstNs extends NodeNs<PublicFieldDefinitionReadonlyFirst, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionStaticModsNs extends NodeNs<PublicFieldDefinitionStaticMods, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryCallExpressionNs extends NodeNs<TypeQueryCallExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryCallExpressionInTypeAnnotationNs extends NodeNs<TypeQueryCallExpressionInTypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryInstantiationExpressionNs extends NodeNs<TypeQueryInstantiationExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryMemberExpressionNs extends NodeNs<TypeQueryMemberExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryMemberExpressionInTypeAnnotationNs extends NodeNs<TypeQueryMemberExpressionInTypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQuerySubscriptExpressionNs extends NodeNs<TypeQuerySubscriptExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UpdateExpressionPostfixNs extends NodeNs<UpdateExpressionPostfix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UpdateExpressionPrefixNs extends NodeNs<UpdateExpressionPrefix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AbstractClassDeclarationNs extends NodeNs<AbstractClassDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AbstractMethodSignatureNs extends NodeNs<AbstractMethodSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AddingTypeAnnotationNs extends NodeNs<AddingTypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AmbientDeclarationDeclarationNs extends NodeNs<AmbientDeclarationDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AmbientDeclarationNs extends NodeNs<AmbientDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArgumentsNs extends NodeNs<Arguments, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayNs extends NodeNs<Array, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayPatternNs extends NodeNs<ArrayPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayTypeNs extends NodeNs<ArrayType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrowFunctionParameterNs extends NodeNs<ArrowFunctionParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrowFunctionUCallSignatureNs extends NodeNs<ArrowFunctionUCallSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrowFunctionNs extends NodeNs<ArrowFunction, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AsExpressionNs extends NodeNs<AsExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssertsNs extends NodeNs<Asserts, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssertsAnnotationNs extends NodeNs<AssertsAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssignmentExpressionNs extends NodeNs<AssignmentExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssignmentPatternNs extends NodeNs<AssignmentPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AugmentedAssignmentExpressionNs extends NodeNs<AugmentedAssignmentExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AwaitExpressionNs extends NodeNs<AwaitExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BinaryExpressionNs extends NodeNs<BinaryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BreakStatementNs extends NodeNs<BreakStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallExpressionNs extends NodeNs<CallExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallSignatureNs extends NodeNs<CallSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CatchClauseNs extends NodeNs<CatchClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassNs extends NodeNs<Class, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassBodyNs extends NodeNs<ClassBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassDeclarationNs extends NodeNs<ClassDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassHeritageExtendsClauseNs extends NodeNs<ClassHeritageExtendsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassHeritageImplementsClauseNs extends NodeNs<ClassHeritageImplementsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassHeritageNs extends NodeNs<ClassHeritage, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClassStaticBlockNs extends NodeNs<ClassStaticBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ComputedPropertyNameNs extends NodeNs<ComputedPropertyName, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConditionalTypeNs extends NodeNs<ConditionalType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstraintNs extends NodeNs<Constraint, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstructSignatureNs extends NodeNs<ConstructSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstructorTypeNs extends NodeNs<ConstructorType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ContinueStatementNs extends NodeNs<ContinueStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DebuggerStatementNs extends NodeNs<DebuggerStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DecoratorNs extends NodeNs<Decorator, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DecoratorCallExpressionNs extends NodeNs<DecoratorCallExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DecoratorMemberExpressionNs extends NodeNs<DecoratorMemberExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DecoratorParenthesizedExpressionNs extends NodeNs<DecoratorParenthesizedExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DefaultTypeNs extends NodeNs<DefaultType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DoStatementNs extends NodeNs<DoStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ElseClauseNs extends NodeNs<ElseClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumAssignmentNs extends NodeNs<EnumAssignment, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumBodyNs extends NodeNs<EnumBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumDeclarationNs extends NodeNs<EnumDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportClauseNs extends NodeNs<ExportClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportSpecifierNs extends NodeNs<ExportSpecifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementTypeExportNs extends NodeNs<ExportStatementTypeExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementEqualsExportNs extends NodeNs<ExportStatementEqualsExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementNamespaceExportNs extends NodeNs<ExportStatementNamespaceExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExportStatementNs extends NodeNs<ExportStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExpressionStatementNs extends NodeNs<ExpressionStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExtendsClauseNs extends NodeNs<ExtendsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExtendsTypeClauseNs extends NodeNs<ExtendsTypeClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldDefinitionNs extends NodeNs<FieldDefinition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FinallyClauseNs extends NodeNs<FinallyClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FlowMaybeTypeNs extends NodeNs<FlowMaybeType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForInStatementNs extends NodeNs<ForInStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForStatementNs extends NodeNs<ForStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FormalParametersNs extends NodeNs<FormalParameters, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionDeclarationNs extends NodeNs<FunctionDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionExpressionNs extends NodeNs<FunctionExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionSignatureNs extends NodeNs<FunctionSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionTypeNs extends NodeNs<FunctionType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GeneratorFunctionNs extends NodeNs<GeneratorFunction, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GeneratorFunctionDeclarationNs extends NodeNs<GeneratorFunctionDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenericTypeNs extends NodeNs<GenericType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IfStatementNs extends NodeNs<IfStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImplementsClauseNs extends NodeNs<ImplementsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportAliasNs extends NodeNs<ImportAlias, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportAttributeNs extends NodeNs<ImportAttribute, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportClauseNamespaceImportNs extends NodeNs<ImportClauseNamespaceImport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportClauseNamedImportsNs extends NodeNs<ImportClauseNamedImports, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportClauseDefaultImportNs extends NodeNs<ImportClauseDefaultImport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportClauseNs extends NodeNs<ImportClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportRequireClauseNs extends NodeNs<ImportRequireClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportSpecifierNameNs extends NodeNs<ImportSpecifierName, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportSpecifierNs extends NodeNs<ImportSpecifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImportStatementNs extends NodeNs<ImportStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IndexSignatureMappedTypeClauseNs extends NodeNs<IndexSignatureMappedTypeClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IndexSignatureNs extends NodeNs<IndexSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IndexTypeQueryNs extends NodeNs<IndexTypeQuery, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InferTypeNs extends NodeNs<InferType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InstantiationExpressionNs extends NodeNs<InstantiationExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InterfaceDeclarationNs extends NodeNs<InterfaceDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InternalModuleNs extends NodeNs<InternalModule, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IntersectionTypeNs extends NodeNs<IntersectionType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxAttributeNs extends NodeNs<JsxAttribute, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxClosingElementNs extends NodeNs<JsxClosingElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxElementNs extends NodeNs<JsxElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxExpressionNs extends NodeNs<JsxExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxNamespaceNameNs extends NodeNs<JsxNamespaceName, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxOpeningElementNs extends NodeNs<JsxOpeningElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface JsxSelfClosingElementNs extends NodeNs<JsxSelfClosingElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LabeledStatementNs extends NodeNs<LabeledStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LexicalDeclarationNs extends NodeNs<LexicalDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LiteralTypeNs extends NodeNs<LiteralType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LookupTypeNs extends NodeNs<LookupType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MappedTypeClauseNs extends NodeNs<MappedTypeClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MemberExpressionNs extends NodeNs<MemberExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MethodDefinitionNs extends NodeNs<MethodDefinition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MethodSignatureNs extends NodeNs<MethodSignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ModuleNs extends NodeNs<Module, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamedImportsNs extends NodeNs<NamedImports, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamespaceExportNs extends NodeNs<NamespaceExport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamespaceImportNs extends NodeNs<NamespaceImport, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NestedIdentifierNs extends NodeNs<NestedIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NestedTypeIdentifierNs extends NodeNs<NestedTypeIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NewExpressionNs extends NodeNs<NewExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NonNullExpressionNs extends NodeNs<NonNullExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ObjectNs extends NodeNs<Object, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ObjectAssignmentPatternNs extends NodeNs<ObjectAssignmentPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ObjectPatternNs extends NodeNs<ObjectPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ObjectTypeNs extends NodeNs<ObjectType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OmittingTypeAnnotationNs extends NodeNs<OmittingTypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OptingTypeAnnotationNs extends NodeNs<OptingTypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OptionalParameterNs extends NodeNs<OptionalParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OptionalTupleParameterNs extends NodeNs<OptionalTupleParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OptionalTypeNs extends NodeNs<OptionalType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PairNs extends NodeNs<Pair, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PairPatternNs extends NodeNs<PairPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParenthesizedExpressionSequenceNs extends NodeNs<ParenthesizedExpressionSequence, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParenthesizedExpressionNs extends NodeNs<ParenthesizedExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParenthesizedTypeNs extends NodeNs<ParenthesizedType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ProgramNs extends NodeNs<Program, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PropertySignatureNs extends NodeNs<PropertySignature, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PublicFieldDefinitionNs extends NodeNs<PublicFieldDefinition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReadonlyTypeNs extends NodeNs<ReadonlyType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RegexNs extends NodeNs<Regex, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RequiredParameterNs extends NodeNs<RequiredParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RestPatternNs extends NodeNs<RestPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RestTypeNs extends NodeNs<RestType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReturnStatementNs extends NodeNs<ReturnStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SatisfiesExpressionNs extends NodeNs<SatisfiesExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SequenceExpressionNs extends NodeNs<SequenceExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SpreadElementNs extends NodeNs<SpreadElement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StatementBlockNs extends NodeNs<StatementBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StringNs extends NodeNs<String, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SubscriptExpressionNs extends NodeNs<SubscriptExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SwitchBodyNs extends NodeNs<SwitchBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SwitchCaseNs extends NodeNs<SwitchCase, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SwitchDefaultNs extends NodeNs<SwitchDefault, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SwitchStatementNs extends NodeNs<SwitchStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TemplateLiteralTypeNs extends NodeNs<TemplateLiteralType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TemplateStringNs extends NodeNs<TemplateString, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TemplateSubstitutionNs extends NodeNs<TemplateSubstitution, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TemplateTypeNs extends NodeNs<TemplateType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TernaryExpressionNs extends NodeNs<TernaryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ThrowStatementNs extends NodeNs<ThrowStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TryStatementNs extends NodeNs<TryStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TupleParameterNs extends NodeNs<TupleParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TupleTypeNs extends NodeNs<TupleType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeAliasDeclarationNs extends NodeNs<TypeAliasDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeAnnotationNs extends NodeNs<TypeAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeArgumentsNs extends NodeNs<TypeArguments, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeAssertionNs extends NodeNs<TypeAssertion, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeParameterNs extends NodeNs<TypeParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeParametersNs extends NodeNs<TypeParameters, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypePredicateNs extends NodeNs<TypePredicate, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypePredicateAnnotationNs extends NodeNs<TypePredicateAnnotation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeQueryNs extends NodeNs<TypeQuery, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UnaryExpressionNs extends NodeNs<UnaryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UnionTypeNs extends NodeNs<UnionType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UpdateExpressionNs extends NodeNs<UpdateExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VariableDeclarationNs extends NodeNs<VariableDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VariableDeclaratorNs extends NodeNs<VariableDeclarator, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface WhileStatementNs extends NodeNs<WhileStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface WithStatementNs extends NodeNs<WithStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface YieldExpressionNs extends NodeNs<YieldExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamespaceMap {
    '_ambient_declaration_declaration': _AmbientDeclarationDeclarationNs;
    '_ambient_declaration_global': AmbientDeclarationGlobalNs;
    '_ambient_declaration_module': AmbientDeclarationModuleNs;
    '_arrow_function__call_signature': _ArrowFunctionUCallSignatureNs;
    '_arrow_function_parameter': _ArrowFunctionParameterNs;
    '_call_expression_call': CallExpressionCallNs;
    '_call_expression_member': CallExpressionMemberNs;
    '_call_expression_template_call': CallExpressionTemplateCallNs;
    '_call_signature': _CallSignatureNs;
    '_class_body_member': ClassBodyMemberNs;
    '_class_body_method': ClassBodyMethodNs;
    '_class_body_method_sig': ClassBodyMethodSigNs;
    '_class_heritage_extends_clause': _ClassHeritageExtendsClauseNs;
    '_class_heritage_implements_clause': _ClassHeritageImplementsClauseNs;
    '_export_statement_default_decl_arm': ExportStatementDefaultDeclArmNs;
    '_export_statement_default_decl_arm_default_kw': ExportStatementDefaultDeclArmDefaultKwNs;
    '_export_statement_default_decl_arm_default_kw_value': ExportStatementDefaultDeclArmDefaultKwValueNs;
    '_export_statement_default_from_arm': ExportStatementDefaultFromArmNs;
    '_export_statement_default_from_arm_clause_from': ExportStatementDefaultFromArmClauseFromNs;
    '_export_statement_default_from_arm_ns_from': ExportStatementDefaultFromArmNsFromNs;
    '_export_statement_default_from_arm_star_from': ExportStatementDefaultFromArmStarFromNs;
    '_export_statement_equals_export': _ExportStatementEqualsExportNs;
    '_export_statement_namespace_export': _ExportStatementNamespaceExportNs;
    '_export_statement_type_export': _ExportStatementTypeExportNs;
    '_extends_clause_single': ExtendsClauseSingleNs;
    '_for_header': ForHeaderNs;
    '_for_header_let_const_kind': ForHeaderLetConstKindNs;
    '_for_header_lhs': ForHeaderLhsNs;
    '_for_header_var_kind': ForHeaderVarKindNs;
    '_from_clause': FromClauseNs;
    '_import_clause_default_import': _ImportClauseDefaultImportNs;
    '_import_clause_named_imports': _ImportClauseNamedImportsNs;
    '_import_clause_namespace_import': _ImportClauseNamespaceImportNs;
    '_import_specifier_as': ImportSpecifierAsNs;
    '_import_specifier_name': _ImportSpecifierNameNs;
    '_index_signature_colon': IndexSignatureColonNs;
    '_index_signature_mapped_type_clause': _IndexSignatureMappedTypeClauseNs;
    '_initializer': InitializerNs;
    '_jsx_start_opening_element': JsxStartOpeningElementNs;
    '_jsx_string': JsxStringNs;
    '_lhs_expression': LhsExpressionNs;
    '_module': _ModuleNs;
    '_number': _NumberNs;
    '_parameter_name': ParameterNameNs;
    '_parenthesized_expression_sequence': _ParenthesizedExpressionSequenceNs;
    '_parenthesized_expression_typed': ParenthesizedExpressionTypedNs;
    '_public_field_definition_abstract_first': PublicFieldDefinitionAbstractFirstNs;
    '_public_field_definition_access_first': PublicFieldDefinitionAccessFirstNs;
    '_public_field_definition_accessor_opt': PublicFieldDefinitionAccessorOptNs;
    '_public_field_definition_declare_first': PublicFieldDefinitionDeclareFirstNs;
    '_public_field_definition_readonly_first': PublicFieldDefinitionReadonlyFirstNs;
    '_public_field_definition_static_mods': PublicFieldDefinitionStaticModsNs;
    '_type_query_call_expression': TypeQueryCallExpressionNs;
    '_type_query_call_expression_in_type_annotation': TypeQueryCallExpressionInTypeAnnotationNs;
    '_type_query_instantiation_expression': TypeQueryInstantiationExpressionNs;
    '_type_query_member_expression': TypeQueryMemberExpressionNs;
    '_type_query_member_expression_in_type_annotation': TypeQueryMemberExpressionInTypeAnnotationNs;
    '_type_query_subscript_expression': TypeQuerySubscriptExpressionNs;
    '_update_expression_postfix': UpdateExpressionPostfixNs;
    '_update_expression_prefix': UpdateExpressionPrefixNs;
    'abstract_class_declaration': AbstractClassDeclarationNs;
    'abstract_method_signature': AbstractMethodSignatureNs;
    'adding_type_annotation': AddingTypeAnnotationNs;
    'ambient_declaration_declaration': AmbientDeclarationDeclarationNs;
    'ambient_declaration': AmbientDeclarationNs;
    'arguments': ArgumentsNs;
    'array': ArrayNs;
    'array_pattern': ArrayPatternNs;
    'array_type': ArrayTypeNs;
    'arrow_function_parameter': ArrowFunctionParameterNs;
    'arrow_function__call_signature': ArrowFunctionUCallSignatureNs;
    'arrow_function': ArrowFunctionNs;
    'as_expression': AsExpressionNs;
    'asserts': AssertsNs;
    'asserts_annotation': AssertsAnnotationNs;
    'assignment_expression': AssignmentExpressionNs;
    'assignment_pattern': AssignmentPatternNs;
    'augmented_assignment_expression': AugmentedAssignmentExpressionNs;
    'await_expression': AwaitExpressionNs;
    'binary_expression': BinaryExpressionNs;
    'break_statement': BreakStatementNs;
    'call_expression': CallExpressionNs;
    'call_signature': CallSignatureNs;
    'catch_clause': CatchClauseNs;
    'class': ClassNs;
    'class_body': ClassBodyNs;
    'class_declaration': ClassDeclarationNs;
    'class_heritage_extends_clause': ClassHeritageExtendsClauseNs;
    'class_heritage_implements_clause': ClassHeritageImplementsClauseNs;
    'class_heritage': ClassHeritageNs;
    'class_static_block': ClassStaticBlockNs;
    'computed_property_name': ComputedPropertyNameNs;
    'conditional_type': ConditionalTypeNs;
    'constraint': ConstraintNs;
    'construct_signature': ConstructSignatureNs;
    'constructor_type': ConstructorTypeNs;
    'continue_statement': ContinueStatementNs;
    'debugger_statement': DebuggerStatementNs;
    'decorator': DecoratorNs;
    'decorator_call_expression': DecoratorCallExpressionNs;
    'decorator_member_expression': DecoratorMemberExpressionNs;
    'decorator_parenthesized_expression': DecoratorParenthesizedExpressionNs;
    'default_type': DefaultTypeNs;
    'do_statement': DoStatementNs;
    'else_clause': ElseClauseNs;
    'enum_assignment': EnumAssignmentNs;
    'enum_body': EnumBodyNs;
    'enum_declaration': EnumDeclarationNs;
    'export_clause': ExportClauseNs;
    'export_specifier': ExportSpecifierNs;
    'export_statement_type_export': ExportStatementTypeExportNs;
    'export_statement_equals_export': ExportStatementEqualsExportNs;
    'export_statement_namespace_export': ExportStatementNamespaceExportNs;
    'export_statement': ExportStatementNs;
    'expression_statement': ExpressionStatementNs;
    'extends_clause': ExtendsClauseNs;
    'extends_type_clause': ExtendsTypeClauseNs;
    'field_definition': FieldDefinitionNs;
    'finally_clause': FinallyClauseNs;
    'flow_maybe_type': FlowMaybeTypeNs;
    'for_in_statement': ForInStatementNs;
    'for_statement': ForStatementNs;
    'formal_parameters': FormalParametersNs;
    'function_declaration': FunctionDeclarationNs;
    'function_expression': FunctionExpressionNs;
    'function_signature': FunctionSignatureNs;
    'function_type': FunctionTypeNs;
    'generator_function': GeneratorFunctionNs;
    'generator_function_declaration': GeneratorFunctionDeclarationNs;
    'generic_type': GenericTypeNs;
    'if_statement': IfStatementNs;
    'implements_clause': ImplementsClauseNs;
    'import_alias': ImportAliasNs;
    'import_attribute': ImportAttributeNs;
    'import_clause_namespace_import': ImportClauseNamespaceImportNs;
    'import_clause_named_imports': ImportClauseNamedImportsNs;
    'import_clause_default_import': ImportClauseDefaultImportNs;
    'import_clause': ImportClauseNs;
    'import_require_clause': ImportRequireClauseNs;
    'import_specifier_name': ImportSpecifierNameNs;
    'import_specifier': ImportSpecifierNs;
    'import_statement': ImportStatementNs;
    'index_signature_mapped_type_clause': IndexSignatureMappedTypeClauseNs;
    'index_signature': IndexSignatureNs;
    'index_type_query': IndexTypeQueryNs;
    'infer_type': InferTypeNs;
    'instantiation_expression': InstantiationExpressionNs;
    'interface_declaration': InterfaceDeclarationNs;
    'internal_module': InternalModuleNs;
    'intersection_type': IntersectionTypeNs;
    'jsx_attribute': JsxAttributeNs;
    'jsx_closing_element': JsxClosingElementNs;
    'jsx_element': JsxElementNs;
    'jsx_expression': JsxExpressionNs;
    'jsx_namespace_name': JsxNamespaceNameNs;
    'jsx_opening_element': JsxOpeningElementNs;
    'jsx_self_closing_element': JsxSelfClosingElementNs;
    'labeled_statement': LabeledStatementNs;
    'lexical_declaration': LexicalDeclarationNs;
    'literal_type': LiteralTypeNs;
    'lookup_type': LookupTypeNs;
    'mapped_type_clause': MappedTypeClauseNs;
    'member_expression': MemberExpressionNs;
    'method_definition': MethodDefinitionNs;
    'method_signature': MethodSignatureNs;
    'module': ModuleNs;
    'named_imports': NamedImportsNs;
    'namespace_export': NamespaceExportNs;
    'namespace_import': NamespaceImportNs;
    'nested_identifier': NestedIdentifierNs;
    'nested_type_identifier': NestedTypeIdentifierNs;
    'new_expression': NewExpressionNs;
    'non_null_expression': NonNullExpressionNs;
    'object': ObjectNs;
    'object_assignment_pattern': ObjectAssignmentPatternNs;
    'object_pattern': ObjectPatternNs;
    'object_type': ObjectTypeNs;
    'omitting_type_annotation': OmittingTypeAnnotationNs;
    'opting_type_annotation': OptingTypeAnnotationNs;
    'optional_parameter': OptionalParameterNs;
    'optional_tuple_parameter': OptionalTupleParameterNs;
    'optional_type': OptionalTypeNs;
    'pair': PairNs;
    'pair_pattern': PairPatternNs;
    'parenthesized_expression_sequence': ParenthesizedExpressionSequenceNs;
    'parenthesized_expression': ParenthesizedExpressionNs;
    'parenthesized_type': ParenthesizedTypeNs;
    'program': ProgramNs;
    'property_signature': PropertySignatureNs;
    'public_field_definition': PublicFieldDefinitionNs;
    'readonly_type': ReadonlyTypeNs;
    'regex': RegexNs;
    'required_parameter': RequiredParameterNs;
    'rest_pattern': RestPatternNs;
    'rest_type': RestTypeNs;
    'return_statement': ReturnStatementNs;
    'satisfies_expression': SatisfiesExpressionNs;
    'sequence_expression': SequenceExpressionNs;
    'spread_element': SpreadElementNs;
    'statement_block': StatementBlockNs;
    'string': StringNs;
    'subscript_expression': SubscriptExpressionNs;
    'switch_body': SwitchBodyNs;
    'switch_case': SwitchCaseNs;
    'switch_default': SwitchDefaultNs;
    'switch_statement': SwitchStatementNs;
    'template_literal_type': TemplateLiteralTypeNs;
    'template_string': TemplateStringNs;
    'template_substitution': TemplateSubstitutionNs;
    'template_type': TemplateTypeNs;
    'ternary_expression': TernaryExpressionNs;
    'throw_statement': ThrowStatementNs;
    'try_statement': TryStatementNs;
    'tuple_parameter': TupleParameterNs;
    'tuple_type': TupleTypeNs;
    'type_alias_declaration': TypeAliasDeclarationNs;
    'type_annotation': TypeAnnotationNs;
    'type_arguments': TypeArgumentsNs;
    'type_assertion': TypeAssertionNs;
    'type_parameter': TypeParameterNs;
    'type_parameters': TypeParametersNs;
    'type_predicate': TypePredicateNs;
    'type_predicate_annotation': TypePredicateAnnotationNs;
    'type_query': TypeQueryNs;
    'unary_expression': UnaryExpressionNs;
    'union_type': UnionTypeNs;
    'update_expression': UpdateExpressionNs;
    'variable_declaration': VariableDeclarationNs;
    'variable_declarator': VariableDeclaratorNs;
    'while_statement': WhileStatementNs;
    'with_statement': WithStatementNs;
    'yield_expression': YieldExpressionNs;
}
export type ConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Config'];
export type FluentFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Fluent'];
export type LooseFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Loose'];
export type TreeFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Tree'];
export declare namespace _AmbientDeclarationDeclaration {
    type Config = ConfigFor<'_ambient_declaration_declaration'>;
    type Fluent = FluentFor<'_ambient_declaration_declaration'>;
    type Loose = LooseFor<'_ambient_declaration_declaration'>;
    type Tree = TreeFor<'_ambient_declaration_declaration'>;
    type Kind = '_ambient_declaration_declaration';
}
export declare namespace AmbientDeclarationGlobal {
    type Config = ConfigFor<'_ambient_declaration_global'>;
    type Fluent = FluentFor<'_ambient_declaration_global'>;
    type Loose = LooseFor<'_ambient_declaration_global'>;
    type Tree = TreeFor<'_ambient_declaration_global'>;
    type Kind = '_ambient_declaration_global';
}
export declare namespace AmbientDeclarationModule {
    type Config = ConfigFor<'_ambient_declaration_module'>;
    type Fluent = FluentFor<'_ambient_declaration_module'>;
    type Loose = LooseFor<'_ambient_declaration_module'>;
    type Tree = TreeFor<'_ambient_declaration_module'>;
    type Kind = '_ambient_declaration_module';
}
export declare namespace _ArrowFunctionUCallSignature {
    type Config = ConfigFor<'_arrow_function__call_signature'>;
    type Fluent = FluentFor<'_arrow_function__call_signature'>;
    type Loose = LooseFor<'_arrow_function__call_signature'>;
    type Tree = TreeFor<'_arrow_function__call_signature'>;
    type Kind = '_arrow_function__call_signature';
}
export declare namespace _ArrowFunctionParameter {
    type Config = ConfigFor<'_arrow_function_parameter'>;
    type Fluent = FluentFor<'_arrow_function_parameter'>;
    type Loose = LooseFor<'_arrow_function_parameter'>;
    type Tree = TreeFor<'_arrow_function_parameter'>;
    type Kind = '_arrow_function_parameter';
}
export declare namespace CallExpressionCall {
    type Config = ConfigFor<'_call_expression_call'>;
    type Fluent = FluentFor<'_call_expression_call'>;
    type Loose = LooseFor<'_call_expression_call'>;
    type Tree = TreeFor<'_call_expression_call'>;
    type Kind = '_call_expression_call';
}
export declare namespace CallExpressionMember {
    type Config = ConfigFor<'_call_expression_member'>;
    type Fluent = FluentFor<'_call_expression_member'>;
    type Loose = LooseFor<'_call_expression_member'>;
    type Tree = TreeFor<'_call_expression_member'>;
    type Kind = '_call_expression_member';
}
export declare namespace CallExpressionTemplateCall {
    type Config = ConfigFor<'_call_expression_template_call'>;
    type Fluent = FluentFor<'_call_expression_template_call'>;
    type Loose = LooseFor<'_call_expression_template_call'>;
    type Tree = TreeFor<'_call_expression_template_call'>;
    type Kind = '_call_expression_template_call';
}
export declare namespace _CallSignature {
    type Config = ConfigFor<'_call_signature'>;
    type Fluent = FluentFor<'_call_signature'>;
    type Loose = LooseFor<'_call_signature'>;
    type Tree = TreeFor<'_call_signature'>;
    type Kind = '_call_signature';
}
export declare namespace ClassBodyMember {
    type Config = ConfigFor<'_class_body_member'>;
    type Fluent = FluentFor<'_class_body_member'>;
    type Loose = LooseFor<'_class_body_member'>;
    type Tree = TreeFor<'_class_body_member'>;
    type Kind = '_class_body_member';
}
export declare namespace ClassBodyMethod {
    type Config = ConfigFor<'_class_body_method'>;
    type Fluent = FluentFor<'_class_body_method'>;
    type Loose = LooseFor<'_class_body_method'>;
    type Tree = TreeFor<'_class_body_method'>;
    type Kind = '_class_body_method';
}
export declare namespace ClassBodyMethodSig {
    type Config = ConfigFor<'_class_body_method_sig'>;
    type Fluent = FluentFor<'_class_body_method_sig'>;
    type Loose = LooseFor<'_class_body_method_sig'>;
    type Tree = TreeFor<'_class_body_method_sig'>;
    type Kind = '_class_body_method_sig';
}
export declare namespace _ClassHeritageExtendsClause {
    type Config = ConfigFor<'_class_heritage_extends_clause'>;
    type Fluent = FluentFor<'_class_heritage_extends_clause'>;
    type Loose = LooseFor<'_class_heritage_extends_clause'>;
    type Tree = TreeFor<'_class_heritage_extends_clause'>;
    type Kind = '_class_heritage_extends_clause';
}
export declare namespace _ClassHeritageImplementsClause {
    type Config = ConfigFor<'_class_heritage_implements_clause'>;
    type Fluent = FluentFor<'_class_heritage_implements_clause'>;
    type Loose = LooseFor<'_class_heritage_implements_clause'>;
    type Tree = TreeFor<'_class_heritage_implements_clause'>;
    type Kind = '_class_heritage_implements_clause';
}
export declare namespace ExportStatementDefaultDeclArm {
    type Config = ConfigFor<'_export_statement_default_decl_arm'>;
    type Fluent = FluentFor<'_export_statement_default_decl_arm'>;
    type Loose = LooseFor<'_export_statement_default_decl_arm'>;
    type Tree = TreeFor<'_export_statement_default_decl_arm'>;
    type Kind = '_export_statement_default_decl_arm';
}
export declare namespace ExportStatementDefaultDeclArmDefaultKw {
    type Config = ConfigFor<'_export_statement_default_decl_arm_default_kw'>;
    type Fluent = FluentFor<'_export_statement_default_decl_arm_default_kw'>;
    type Loose = LooseFor<'_export_statement_default_decl_arm_default_kw'>;
    type Tree = TreeFor<'_export_statement_default_decl_arm_default_kw'>;
    type Kind = '_export_statement_default_decl_arm_default_kw';
}
export declare namespace ExportStatementDefaultDeclArmDefaultKwValue {
    type Config = ConfigFor<'_export_statement_default_decl_arm_default_kw_value'>;
    type Fluent = FluentFor<'_export_statement_default_decl_arm_default_kw_value'>;
    type Loose = LooseFor<'_export_statement_default_decl_arm_default_kw_value'>;
    type Tree = TreeFor<'_export_statement_default_decl_arm_default_kw_value'>;
    type Kind = '_export_statement_default_decl_arm_default_kw_value';
}
export declare namespace ExportStatementDefaultFromArm {
    type Config = ConfigFor<'_export_statement_default_from_arm'>;
    type Fluent = FluentFor<'_export_statement_default_from_arm'>;
    type Loose = LooseFor<'_export_statement_default_from_arm'>;
    type Tree = TreeFor<'_export_statement_default_from_arm'>;
    type Kind = '_export_statement_default_from_arm';
}
export declare namespace ExportStatementDefaultFromArmClauseFrom {
    type Config = ConfigFor<'_export_statement_default_from_arm_clause_from'>;
    type Fluent = FluentFor<'_export_statement_default_from_arm_clause_from'>;
    type Loose = LooseFor<'_export_statement_default_from_arm_clause_from'>;
    type Tree = TreeFor<'_export_statement_default_from_arm_clause_from'>;
    type Kind = '_export_statement_default_from_arm_clause_from';
}
export declare namespace ExportStatementDefaultFromArmNsFrom {
    type Config = ConfigFor<'_export_statement_default_from_arm_ns_from'>;
    type Fluent = FluentFor<'_export_statement_default_from_arm_ns_from'>;
    type Loose = LooseFor<'_export_statement_default_from_arm_ns_from'>;
    type Tree = TreeFor<'_export_statement_default_from_arm_ns_from'>;
    type Kind = '_export_statement_default_from_arm_ns_from';
}
export declare namespace ExportStatementDefaultFromArmStarFrom {
    type Config = ConfigFor<'_export_statement_default_from_arm_star_from'>;
    type Fluent = FluentFor<'_export_statement_default_from_arm_star_from'>;
    type Loose = LooseFor<'_export_statement_default_from_arm_star_from'>;
    type Tree = TreeFor<'_export_statement_default_from_arm_star_from'>;
    type Kind = '_export_statement_default_from_arm_star_from';
}
export declare namespace _ExportStatementEqualsExport {
    type Config = ConfigFor<'_export_statement_equals_export'>;
    type Fluent = FluentFor<'_export_statement_equals_export'>;
    type Loose = LooseFor<'_export_statement_equals_export'>;
    type Tree = TreeFor<'_export_statement_equals_export'>;
    type Kind = '_export_statement_equals_export';
}
export declare namespace _ExportStatementNamespaceExport {
    type Config = ConfigFor<'_export_statement_namespace_export'>;
    type Fluent = FluentFor<'_export_statement_namespace_export'>;
    type Loose = LooseFor<'_export_statement_namespace_export'>;
    type Tree = TreeFor<'_export_statement_namespace_export'>;
    type Kind = '_export_statement_namespace_export';
}
export declare namespace _ExportStatementTypeExport {
    type Config = ConfigFor<'_export_statement_type_export'>;
    type Fluent = FluentFor<'_export_statement_type_export'>;
    type Loose = LooseFor<'_export_statement_type_export'>;
    type Tree = TreeFor<'_export_statement_type_export'>;
    type Kind = '_export_statement_type_export';
}
export declare namespace ExtendsClauseSingle {
    type Config = ConfigFor<'_extends_clause_single'>;
    type Fluent = FluentFor<'_extends_clause_single'>;
    type Loose = LooseFor<'_extends_clause_single'>;
    type Tree = TreeFor<'_extends_clause_single'>;
    type Kind = '_extends_clause_single';
}
export declare namespace ForHeader {
    type Config = ConfigFor<'_for_header'>;
    type Fluent = FluentFor<'_for_header'>;
    type Loose = LooseFor<'_for_header'>;
    type Tree = TreeFor<'_for_header'>;
    type Kind = '_for_header';
}
export declare namespace ForHeaderLetConstKind {
    type Config = ConfigFor<'_for_header_let_const_kind'>;
    type Fluent = FluentFor<'_for_header_let_const_kind'>;
    type Loose = LooseFor<'_for_header_let_const_kind'>;
    type Tree = TreeFor<'_for_header_let_const_kind'>;
    type Kind = '_for_header_let_const_kind';
}
export declare namespace ForHeaderLhs {
    type Config = ConfigFor<'_for_header_lhs'>;
    type Fluent = FluentFor<'_for_header_lhs'>;
    type Loose = LooseFor<'_for_header_lhs'>;
    type Tree = TreeFor<'_for_header_lhs'>;
    type Kind = '_for_header_lhs';
}
export declare namespace ForHeaderVarKind {
    type Config = ConfigFor<'_for_header_var_kind'>;
    type Fluent = FluentFor<'_for_header_var_kind'>;
    type Loose = LooseFor<'_for_header_var_kind'>;
    type Tree = TreeFor<'_for_header_var_kind'>;
    type Kind = '_for_header_var_kind';
}
export declare namespace FromClause {
    type Config = ConfigFor<'_from_clause'>;
    type Fluent = FluentFor<'_from_clause'>;
    type Loose = LooseFor<'_from_clause'>;
    type Tree = TreeFor<'_from_clause'>;
    type Kind = '_from_clause';
}
export declare namespace _ImportClauseDefaultImport {
    type Config = ConfigFor<'_import_clause_default_import'>;
    type Fluent = FluentFor<'_import_clause_default_import'>;
    type Loose = LooseFor<'_import_clause_default_import'>;
    type Tree = TreeFor<'_import_clause_default_import'>;
    type Kind = '_import_clause_default_import';
}
export declare namespace _ImportClauseNamedImports {
    type Config = ConfigFor<'_import_clause_named_imports'>;
    type Fluent = FluentFor<'_import_clause_named_imports'>;
    type Loose = LooseFor<'_import_clause_named_imports'>;
    type Tree = TreeFor<'_import_clause_named_imports'>;
    type Kind = '_import_clause_named_imports';
}
export declare namespace _ImportClauseNamespaceImport {
    type Config = ConfigFor<'_import_clause_namespace_import'>;
    type Fluent = FluentFor<'_import_clause_namespace_import'>;
    type Loose = LooseFor<'_import_clause_namespace_import'>;
    type Tree = TreeFor<'_import_clause_namespace_import'>;
    type Kind = '_import_clause_namespace_import';
}
export declare namespace ImportSpecifierAs {
    type Config = ConfigFor<'_import_specifier_as'>;
    type Fluent = FluentFor<'_import_specifier_as'>;
    type Loose = LooseFor<'_import_specifier_as'>;
    type Tree = TreeFor<'_import_specifier_as'>;
    type Kind = '_import_specifier_as';
}
export declare namespace _ImportSpecifierName {
    type Config = ConfigFor<'_import_specifier_name'>;
    type Fluent = FluentFor<'_import_specifier_name'>;
    type Loose = LooseFor<'_import_specifier_name'>;
    type Tree = TreeFor<'_import_specifier_name'>;
    type Kind = '_import_specifier_name';
}
export declare namespace IndexSignatureColon {
    type Config = ConfigFor<'_index_signature_colon'>;
    type Fluent = FluentFor<'_index_signature_colon'>;
    type Loose = LooseFor<'_index_signature_colon'>;
    type Tree = TreeFor<'_index_signature_colon'>;
    type Kind = '_index_signature_colon';
}
export declare namespace _IndexSignatureMappedTypeClause {
    type Config = ConfigFor<'_index_signature_mapped_type_clause'>;
    type Fluent = FluentFor<'_index_signature_mapped_type_clause'>;
    type Loose = LooseFor<'_index_signature_mapped_type_clause'>;
    type Tree = TreeFor<'_index_signature_mapped_type_clause'>;
    type Kind = '_index_signature_mapped_type_clause';
}
export declare namespace Initializer {
    type Config = ConfigFor<'_initializer'>;
    type Fluent = FluentFor<'_initializer'>;
    type Loose = LooseFor<'_initializer'>;
    type Tree = TreeFor<'_initializer'>;
    type Kind = '_initializer';
}
export declare namespace JsxStartOpeningElement {
    type Config = ConfigFor<'_jsx_start_opening_element'>;
    type Fluent = FluentFor<'_jsx_start_opening_element'>;
    type Loose = LooseFor<'_jsx_start_opening_element'>;
    type Tree = TreeFor<'_jsx_start_opening_element'>;
    type Kind = '_jsx_start_opening_element';
}
export declare namespace JsxString {
    type Config = ConfigFor<'_jsx_string'>;
    type Fluent = FluentFor<'_jsx_string'>;
    type Loose = LooseFor<'_jsx_string'>;
    type Tree = TreeFor<'_jsx_string'>;
    type Kind = '_jsx_string';
}
export declare namespace LhsExpression {
    type Config = ConfigFor<'_lhs_expression'>;
    type Fluent = FluentFor<'_lhs_expression'>;
    type Loose = LooseFor<'_lhs_expression'>;
    type Tree = TreeFor<'_lhs_expression'>;
    type Kind = '_lhs_expression';
}
export declare namespace _Module {
    type Config = ConfigFor<'_module'>;
    type Fluent = FluentFor<'_module'>;
    type Loose = LooseFor<'_module'>;
    type Tree = TreeFor<'_module'>;
    type Kind = '_module';
}
export declare namespace _Number {
    type Config = ConfigFor<'_number'>;
    type Fluent = FluentFor<'_number'>;
    type Loose = LooseFor<'_number'>;
    type Tree = TreeFor<'_number'>;
    type Kind = '_number';
}
export declare namespace ParameterName {
    type Config = ConfigFor<'_parameter_name'>;
    type Fluent = FluentFor<'_parameter_name'>;
    type Loose = LooseFor<'_parameter_name'>;
    type Tree = TreeFor<'_parameter_name'>;
    type Kind = '_parameter_name';
}
export declare namespace _ParenthesizedExpressionSequence {
    type Config = ConfigFor<'_parenthesized_expression_sequence'>;
    type Fluent = FluentFor<'_parenthesized_expression_sequence'>;
    type Loose = LooseFor<'_parenthesized_expression_sequence'>;
    type Tree = TreeFor<'_parenthesized_expression_sequence'>;
    type Kind = '_parenthesized_expression_sequence';
}
export declare namespace ParenthesizedExpressionTyped {
    type Config = ConfigFor<'_parenthesized_expression_typed'>;
    type Fluent = FluentFor<'_parenthesized_expression_typed'>;
    type Loose = LooseFor<'_parenthesized_expression_typed'>;
    type Tree = TreeFor<'_parenthesized_expression_typed'>;
    type Kind = '_parenthesized_expression_typed';
}
export declare namespace PublicFieldDefinitionAbstractFirst {
    type Config = ConfigFor<'_public_field_definition_abstract_first'>;
    type Fluent = FluentFor<'_public_field_definition_abstract_first'>;
    type Loose = LooseFor<'_public_field_definition_abstract_first'>;
    type Tree = TreeFor<'_public_field_definition_abstract_first'>;
    type Kind = '_public_field_definition_abstract_first';
}
export declare namespace PublicFieldDefinitionAccessFirst {
    type Config = ConfigFor<'_public_field_definition_access_first'>;
    type Fluent = FluentFor<'_public_field_definition_access_first'>;
    type Loose = LooseFor<'_public_field_definition_access_first'>;
    type Tree = TreeFor<'_public_field_definition_access_first'>;
    type Kind = '_public_field_definition_access_first';
}
export declare namespace PublicFieldDefinitionAccessorOpt {
    type Config = ConfigFor<'_public_field_definition_accessor_opt'>;
    type Fluent = FluentFor<'_public_field_definition_accessor_opt'>;
    type Loose = LooseFor<'_public_field_definition_accessor_opt'>;
    type Tree = TreeFor<'_public_field_definition_accessor_opt'>;
    type Kind = '_public_field_definition_accessor_opt';
}
export declare namespace PublicFieldDefinitionDeclareFirst {
    type Config = ConfigFor<'_public_field_definition_declare_first'>;
    type Fluent = FluentFor<'_public_field_definition_declare_first'>;
    type Loose = LooseFor<'_public_field_definition_declare_first'>;
    type Tree = TreeFor<'_public_field_definition_declare_first'>;
    type Kind = '_public_field_definition_declare_first';
}
export declare namespace PublicFieldDefinitionReadonlyFirst {
    type Config = ConfigFor<'_public_field_definition_readonly_first'>;
    type Fluent = FluentFor<'_public_field_definition_readonly_first'>;
    type Loose = LooseFor<'_public_field_definition_readonly_first'>;
    type Tree = TreeFor<'_public_field_definition_readonly_first'>;
    type Kind = '_public_field_definition_readonly_first';
}
export declare namespace PublicFieldDefinitionStaticMods {
    type Config = ConfigFor<'_public_field_definition_static_mods'>;
    type Fluent = FluentFor<'_public_field_definition_static_mods'>;
    type Loose = LooseFor<'_public_field_definition_static_mods'>;
    type Tree = TreeFor<'_public_field_definition_static_mods'>;
    type Kind = '_public_field_definition_static_mods';
}
export declare namespace TypeQueryCallExpression {
    type Config = ConfigFor<'_type_query_call_expression'>;
    type Fluent = FluentFor<'_type_query_call_expression'>;
    type Loose = LooseFor<'_type_query_call_expression'>;
    type Tree = TreeFor<'_type_query_call_expression'>;
    type Kind = '_type_query_call_expression';
}
export declare namespace TypeQueryCallExpressionInTypeAnnotation {
    type Config = ConfigFor<'_type_query_call_expression_in_type_annotation'>;
    type Fluent = FluentFor<'_type_query_call_expression_in_type_annotation'>;
    type Loose = LooseFor<'_type_query_call_expression_in_type_annotation'>;
    type Tree = TreeFor<'_type_query_call_expression_in_type_annotation'>;
    type Kind = '_type_query_call_expression_in_type_annotation';
}
export declare namespace TypeQueryInstantiationExpression {
    type Config = ConfigFor<'_type_query_instantiation_expression'>;
    type Fluent = FluentFor<'_type_query_instantiation_expression'>;
    type Loose = LooseFor<'_type_query_instantiation_expression'>;
    type Tree = TreeFor<'_type_query_instantiation_expression'>;
    type Kind = '_type_query_instantiation_expression';
}
export declare namespace TypeQueryMemberExpression {
    type Config = ConfigFor<'_type_query_member_expression'>;
    type Fluent = FluentFor<'_type_query_member_expression'>;
    type Loose = LooseFor<'_type_query_member_expression'>;
    type Tree = TreeFor<'_type_query_member_expression'>;
    type Kind = '_type_query_member_expression';
}
export declare namespace TypeQueryMemberExpressionInTypeAnnotation {
    type Config = ConfigFor<'_type_query_member_expression_in_type_annotation'>;
    type Fluent = FluentFor<'_type_query_member_expression_in_type_annotation'>;
    type Loose = LooseFor<'_type_query_member_expression_in_type_annotation'>;
    type Tree = TreeFor<'_type_query_member_expression_in_type_annotation'>;
    type Kind = '_type_query_member_expression_in_type_annotation';
}
export declare namespace TypeQuerySubscriptExpression {
    type Config = ConfigFor<'_type_query_subscript_expression'>;
    type Fluent = FluentFor<'_type_query_subscript_expression'>;
    type Loose = LooseFor<'_type_query_subscript_expression'>;
    type Tree = TreeFor<'_type_query_subscript_expression'>;
    type Kind = '_type_query_subscript_expression';
}
export declare namespace UpdateExpressionPostfix {
    type Config = ConfigFor<'_update_expression_postfix'>;
    type Fluent = FluentFor<'_update_expression_postfix'>;
    type Loose = LooseFor<'_update_expression_postfix'>;
    type Tree = TreeFor<'_update_expression_postfix'>;
    type Kind = '_update_expression_postfix';
}
export declare namespace UpdateExpressionPrefix {
    type Config = ConfigFor<'_update_expression_prefix'>;
    type Fluent = FluentFor<'_update_expression_prefix'>;
    type Loose = LooseFor<'_update_expression_prefix'>;
    type Tree = TreeFor<'_update_expression_prefix'>;
    type Kind = '_update_expression_prefix';
}
export declare namespace AbstractClassDeclaration {
    type Config = ConfigFor<'abstract_class_declaration'>;
    type Fluent = FluentFor<'abstract_class_declaration'>;
    type Loose = LooseFor<'abstract_class_declaration'>;
    type Tree = TreeFor<'abstract_class_declaration'>;
    type Kind = 'abstract_class_declaration';
}
export declare namespace AbstractMethodSignature {
    type Config = ConfigFor<'abstract_method_signature'>;
    type Fluent = FluentFor<'abstract_method_signature'>;
    type Loose = LooseFor<'abstract_method_signature'>;
    type Tree = TreeFor<'abstract_method_signature'>;
    type Kind = 'abstract_method_signature';
}
export declare namespace AddingTypeAnnotation {
    type Config = ConfigFor<'adding_type_annotation'>;
    type Fluent = FluentFor<'adding_type_annotation'>;
    type Loose = LooseFor<'adding_type_annotation'>;
    type Tree = TreeFor<'adding_type_annotation'>;
    type Kind = 'adding_type_annotation';
}
export declare namespace AmbientDeclarationDeclaration {
    type Config = ConfigFor<'ambient_declaration_declaration'>;
    type Fluent = FluentFor<'ambient_declaration_declaration'>;
    type Loose = LooseFor<'ambient_declaration_declaration'>;
    type Tree = TreeFor<'ambient_declaration_declaration'>;
    type Kind = 'ambient_declaration_declaration';
}
export declare namespace AmbientDeclaration {
    type Config = ConfigFor<'ambient_declaration'>;
    type Fluent = FluentFor<'ambient_declaration'>;
    type Loose = LooseFor<'ambient_declaration'>;
    type Tree = TreeFor<'ambient_declaration'>;
    type Kind = 'ambient_declaration';
}
export declare namespace Arguments {
    type Config = ConfigFor<'arguments'>;
    type Fluent = FluentFor<'arguments'>;
    type Loose = LooseFor<'arguments'>;
    type Tree = TreeFor<'arguments'>;
    type Kind = 'arguments';
}
export declare namespace Array {
    type Config = ConfigFor<'array'>;
    type Fluent = FluentFor<'array'>;
    type Loose = LooseFor<'array'>;
    type Tree = TreeFor<'array'>;
    type Kind = 'array';
}
export declare namespace ArrayPattern {
    type Config = ConfigFor<'array_pattern'>;
    type Fluent = FluentFor<'array_pattern'>;
    type Loose = LooseFor<'array_pattern'>;
    type Tree = TreeFor<'array_pattern'>;
    type Kind = 'array_pattern';
}
export declare namespace ArrayType {
    type Config = ConfigFor<'array_type'>;
    type Fluent = FluentFor<'array_type'>;
    type Loose = LooseFor<'array_type'>;
    type Tree = TreeFor<'array_type'>;
    type Kind = 'array_type';
}
export declare namespace ArrowFunctionParameter {
    type Config = ConfigFor<'arrow_function_parameter'>;
    type Fluent = FluentFor<'arrow_function_parameter'>;
    type Loose = LooseFor<'arrow_function_parameter'>;
    type Tree = TreeFor<'arrow_function_parameter'>;
    type Kind = 'arrow_function_parameter';
}
export declare namespace ArrowFunctionUCallSignature {
    type Config = ConfigFor<'arrow_function__call_signature'>;
    type Fluent = FluentFor<'arrow_function__call_signature'>;
    type Loose = LooseFor<'arrow_function__call_signature'>;
    type Tree = TreeFor<'arrow_function__call_signature'>;
    type Kind = 'arrow_function__call_signature';
}
export declare namespace ArrowFunction {
    type Config = ConfigFor<'arrow_function'>;
    type Fluent = FluentFor<'arrow_function'>;
    type Loose = LooseFor<'arrow_function'>;
    type Tree = TreeFor<'arrow_function'>;
    type Kind = 'arrow_function';
}
export declare namespace AsExpression {
    type Config = ConfigFor<'as_expression'>;
    type Fluent = FluentFor<'as_expression'>;
    type Loose = LooseFor<'as_expression'>;
    type Tree = TreeFor<'as_expression'>;
    type Kind = 'as_expression';
}
export declare namespace Asserts {
    type Config = ConfigFor<'asserts'>;
    type Fluent = FluentFor<'asserts'>;
    type Loose = LooseFor<'asserts'>;
    type Tree = TreeFor<'asserts'>;
    type Kind = 'asserts';
}
export declare namespace AssertsAnnotation {
    type Config = ConfigFor<'asserts_annotation'>;
    type Fluent = FluentFor<'asserts_annotation'>;
    type Loose = LooseFor<'asserts_annotation'>;
    type Tree = TreeFor<'asserts_annotation'>;
    type Kind = 'asserts_annotation';
}
export declare namespace AssignmentExpression {
    type Config = ConfigFor<'assignment_expression'>;
    type Fluent = FluentFor<'assignment_expression'>;
    type Loose = LooseFor<'assignment_expression'>;
    type Tree = TreeFor<'assignment_expression'>;
    type Kind = 'assignment_expression';
}
export declare namespace AssignmentPattern {
    type Config = ConfigFor<'assignment_pattern'>;
    type Fluent = FluentFor<'assignment_pattern'>;
    type Loose = LooseFor<'assignment_pattern'>;
    type Tree = TreeFor<'assignment_pattern'>;
    type Kind = 'assignment_pattern';
}
export declare namespace AugmentedAssignmentExpression {
    type Config = ConfigFor<'augmented_assignment_expression'>;
    type Fluent = FluentFor<'augmented_assignment_expression'>;
    type Loose = LooseFor<'augmented_assignment_expression'>;
    type Tree = TreeFor<'augmented_assignment_expression'>;
    type Kind = 'augmented_assignment_expression';
}
export declare namespace AwaitExpression {
    type Config = ConfigFor<'await_expression'>;
    type Fluent = FluentFor<'await_expression'>;
    type Loose = LooseFor<'await_expression'>;
    type Tree = TreeFor<'await_expression'>;
    type Kind = 'await_expression';
}
export declare namespace BinaryExpression {
    type Config = ConfigFor<'binary_expression'>;
    type Fluent = FluentFor<'binary_expression'>;
    type Loose = LooseFor<'binary_expression'>;
    type Tree = TreeFor<'binary_expression'>;
    type Kind = 'binary_expression';
}
export declare namespace BreakStatement {
    type Config = ConfigFor<'break_statement'>;
    type Fluent = FluentFor<'break_statement'>;
    type Loose = LooseFor<'break_statement'>;
    type Tree = TreeFor<'break_statement'>;
    type Kind = 'break_statement';
}
export declare namespace CallExpression {
    type Config = ConfigFor<'call_expression'>;
    type Fluent = FluentFor<'call_expression'>;
    type Loose = LooseFor<'call_expression'>;
    type Tree = TreeFor<'call_expression'>;
    type Kind = 'call_expression';
}
export declare namespace CallSignature {
    type Config = ConfigFor<'call_signature'>;
    type Fluent = FluentFor<'call_signature'>;
    type Loose = LooseFor<'call_signature'>;
    type Tree = TreeFor<'call_signature'>;
    type Kind = 'call_signature';
}
export declare namespace CatchClause {
    type Config = ConfigFor<'catch_clause'>;
    type Fluent = FluentFor<'catch_clause'>;
    type Loose = LooseFor<'catch_clause'>;
    type Tree = TreeFor<'catch_clause'>;
    type Kind = 'catch_clause';
}
export declare namespace Class {
    type Config = ConfigFor<'class'>;
    type Fluent = FluentFor<'class'>;
    type Loose = LooseFor<'class'>;
    type Tree = TreeFor<'class'>;
    type Kind = 'class';
}
export declare namespace ClassBody {
    type Config = ConfigFor<'class_body'>;
    type Fluent = FluentFor<'class_body'>;
    type Loose = LooseFor<'class_body'>;
    type Tree = TreeFor<'class_body'>;
    type Kind = 'class_body';
}
export declare namespace ClassDeclaration {
    type Config = ConfigFor<'class_declaration'>;
    type Fluent = FluentFor<'class_declaration'>;
    type Loose = LooseFor<'class_declaration'>;
    type Tree = TreeFor<'class_declaration'>;
    type Kind = 'class_declaration';
}
export declare namespace ClassHeritageExtendsClause {
    type Config = ConfigFor<'class_heritage_extends_clause'>;
    type Fluent = FluentFor<'class_heritage_extends_clause'>;
    type Loose = LooseFor<'class_heritage_extends_clause'>;
    type Tree = TreeFor<'class_heritage_extends_clause'>;
    type Kind = 'class_heritage_extends_clause';
}
export declare namespace ClassHeritageImplementsClause {
    type Config = ConfigFor<'class_heritage_implements_clause'>;
    type Fluent = FluentFor<'class_heritage_implements_clause'>;
    type Loose = LooseFor<'class_heritage_implements_clause'>;
    type Tree = TreeFor<'class_heritage_implements_clause'>;
    type Kind = 'class_heritage_implements_clause';
}
export declare namespace ClassHeritage {
    type Config = ConfigFor<'class_heritage'>;
    type Fluent = FluentFor<'class_heritage'>;
    type Loose = LooseFor<'class_heritage'>;
    type Tree = TreeFor<'class_heritage'>;
    type Kind = 'class_heritage';
}
export declare namespace ClassStaticBlock {
    type Config = ConfigFor<'class_static_block'>;
    type Fluent = FluentFor<'class_static_block'>;
    type Loose = LooseFor<'class_static_block'>;
    type Tree = TreeFor<'class_static_block'>;
    type Kind = 'class_static_block';
}
export declare namespace ComputedPropertyName {
    type Config = ConfigFor<'computed_property_name'>;
    type Fluent = FluentFor<'computed_property_name'>;
    type Loose = LooseFor<'computed_property_name'>;
    type Tree = TreeFor<'computed_property_name'>;
    type Kind = 'computed_property_name';
}
export declare namespace ConditionalType {
    type Config = ConfigFor<'conditional_type'>;
    type Fluent = FluentFor<'conditional_type'>;
    type Loose = LooseFor<'conditional_type'>;
    type Tree = TreeFor<'conditional_type'>;
    type Kind = 'conditional_type';
}
export declare namespace Constraint {
    type Config = ConfigFor<'constraint'>;
    type Fluent = FluentFor<'constraint'>;
    type Loose = LooseFor<'constraint'>;
    type Tree = TreeFor<'constraint'>;
    type Kind = 'constraint';
}
export declare namespace ConstructSignature {
    type Config = ConfigFor<'construct_signature'>;
    type Fluent = FluentFor<'construct_signature'>;
    type Loose = LooseFor<'construct_signature'>;
    type Tree = TreeFor<'construct_signature'>;
    type Kind = 'construct_signature';
}
export declare namespace ConstructorType {
    type Config = ConfigFor<'constructor_type'>;
    type Fluent = FluentFor<'constructor_type'>;
    type Loose = LooseFor<'constructor_type'>;
    type Tree = TreeFor<'constructor_type'>;
    type Kind = 'constructor_type';
}
export declare namespace ContinueStatement {
    type Config = ConfigFor<'continue_statement'>;
    type Fluent = FluentFor<'continue_statement'>;
    type Loose = LooseFor<'continue_statement'>;
    type Tree = TreeFor<'continue_statement'>;
    type Kind = 'continue_statement';
}
export declare namespace DebuggerStatement {
    type Config = ConfigFor<'debugger_statement'>;
    type Fluent = FluentFor<'debugger_statement'>;
    type Loose = LooseFor<'debugger_statement'>;
    type Tree = TreeFor<'debugger_statement'>;
    type Kind = 'debugger_statement';
}
export declare namespace Decorator {
    type Config = ConfigFor<'decorator'>;
    type Fluent = FluentFor<'decorator'>;
    type Loose = LooseFor<'decorator'>;
    type Tree = TreeFor<'decorator'>;
    type Kind = 'decorator';
}
export declare namespace DecoratorCallExpression {
    type Config = ConfigFor<'decorator_call_expression'>;
    type Fluent = FluentFor<'decorator_call_expression'>;
    type Loose = LooseFor<'decorator_call_expression'>;
    type Tree = TreeFor<'decorator_call_expression'>;
    type Kind = 'decorator_call_expression';
}
export declare namespace DecoratorMemberExpression {
    type Config = ConfigFor<'decorator_member_expression'>;
    type Fluent = FluentFor<'decorator_member_expression'>;
    type Loose = LooseFor<'decorator_member_expression'>;
    type Tree = TreeFor<'decorator_member_expression'>;
    type Kind = 'decorator_member_expression';
}
export declare namespace DecoratorParenthesizedExpression {
    type Config = ConfigFor<'decorator_parenthesized_expression'>;
    type Fluent = FluentFor<'decorator_parenthesized_expression'>;
    type Loose = LooseFor<'decorator_parenthesized_expression'>;
    type Tree = TreeFor<'decorator_parenthesized_expression'>;
    type Kind = 'decorator_parenthesized_expression';
}
export declare namespace DefaultType {
    type Config = ConfigFor<'default_type'>;
    type Fluent = FluentFor<'default_type'>;
    type Loose = LooseFor<'default_type'>;
    type Tree = TreeFor<'default_type'>;
    type Kind = 'default_type';
}
export declare namespace DoStatement {
    type Config = ConfigFor<'do_statement'>;
    type Fluent = FluentFor<'do_statement'>;
    type Loose = LooseFor<'do_statement'>;
    type Tree = TreeFor<'do_statement'>;
    type Kind = 'do_statement';
}
export declare namespace ElseClause {
    type Config = ConfigFor<'else_clause'>;
    type Fluent = FluentFor<'else_clause'>;
    type Loose = LooseFor<'else_clause'>;
    type Tree = TreeFor<'else_clause'>;
    type Kind = 'else_clause';
}
export declare namespace EnumAssignment {
    type Config = ConfigFor<'enum_assignment'>;
    type Fluent = FluentFor<'enum_assignment'>;
    type Loose = LooseFor<'enum_assignment'>;
    type Tree = TreeFor<'enum_assignment'>;
    type Kind = 'enum_assignment';
}
export declare namespace EnumBody {
    type Config = ConfigFor<'enum_body'>;
    type Fluent = FluentFor<'enum_body'>;
    type Loose = LooseFor<'enum_body'>;
    type Tree = TreeFor<'enum_body'>;
    type Kind = 'enum_body';
}
export declare namespace EnumDeclaration {
    type Config = ConfigFor<'enum_declaration'>;
    type Fluent = FluentFor<'enum_declaration'>;
    type Loose = LooseFor<'enum_declaration'>;
    type Tree = TreeFor<'enum_declaration'>;
    type Kind = 'enum_declaration';
}
export declare namespace ExportClause {
    type Config = ConfigFor<'export_clause'>;
    type Fluent = FluentFor<'export_clause'>;
    type Loose = LooseFor<'export_clause'>;
    type Tree = TreeFor<'export_clause'>;
    type Kind = 'export_clause';
}
export declare namespace ExportSpecifier {
    type Config = ConfigFor<'export_specifier'>;
    type Fluent = FluentFor<'export_specifier'>;
    type Loose = LooseFor<'export_specifier'>;
    type Tree = TreeFor<'export_specifier'>;
    type Kind = 'export_specifier';
}
export declare namespace ExportStatementTypeExport {
    type Config = ConfigFor<'export_statement_type_export'>;
    type Fluent = FluentFor<'export_statement_type_export'>;
    type Loose = LooseFor<'export_statement_type_export'>;
    type Tree = TreeFor<'export_statement_type_export'>;
    type Kind = 'export_statement_type_export';
}
export declare namespace ExportStatementEqualsExport {
    type Config = ConfigFor<'export_statement_equals_export'>;
    type Fluent = FluentFor<'export_statement_equals_export'>;
    type Loose = LooseFor<'export_statement_equals_export'>;
    type Tree = TreeFor<'export_statement_equals_export'>;
    type Kind = 'export_statement_equals_export';
}
export declare namespace ExportStatementNamespaceExport {
    type Config = ConfigFor<'export_statement_namespace_export'>;
    type Fluent = FluentFor<'export_statement_namespace_export'>;
    type Loose = LooseFor<'export_statement_namespace_export'>;
    type Tree = TreeFor<'export_statement_namespace_export'>;
    type Kind = 'export_statement_namespace_export';
}
export declare namespace ExportStatement {
    type Config = ConfigFor<'export_statement'>;
    type Fluent = FluentFor<'export_statement'>;
    type Loose = LooseFor<'export_statement'>;
    type Tree = TreeFor<'export_statement'>;
    type Kind = 'export_statement';
}
export declare namespace ExpressionStatement {
    type Config = ConfigFor<'expression_statement'>;
    type Fluent = FluentFor<'expression_statement'>;
    type Loose = LooseFor<'expression_statement'>;
    type Tree = TreeFor<'expression_statement'>;
    type Kind = 'expression_statement';
}
export declare namespace ExtendsClause {
    type Config = ConfigFor<'extends_clause'>;
    type Fluent = FluentFor<'extends_clause'>;
    type Loose = LooseFor<'extends_clause'>;
    type Tree = TreeFor<'extends_clause'>;
    type Kind = 'extends_clause';
}
export declare namespace ExtendsTypeClause {
    type Config = ConfigFor<'extends_type_clause'>;
    type Fluent = FluentFor<'extends_type_clause'>;
    type Loose = LooseFor<'extends_type_clause'>;
    type Tree = TreeFor<'extends_type_clause'>;
    type Kind = 'extends_type_clause';
}
export declare namespace FieldDefinition {
    type Config = ConfigFor<'field_definition'>;
    type Fluent = FluentFor<'field_definition'>;
    type Loose = LooseFor<'field_definition'>;
    type Tree = TreeFor<'field_definition'>;
    type Kind = 'field_definition';
}
export declare namespace FinallyClause {
    type Config = ConfigFor<'finally_clause'>;
    type Fluent = FluentFor<'finally_clause'>;
    type Loose = LooseFor<'finally_clause'>;
    type Tree = TreeFor<'finally_clause'>;
    type Kind = 'finally_clause';
}
export declare namespace FlowMaybeType {
    type Config = ConfigFor<'flow_maybe_type'>;
    type Fluent = FluentFor<'flow_maybe_type'>;
    type Loose = LooseFor<'flow_maybe_type'>;
    type Tree = TreeFor<'flow_maybe_type'>;
    type Kind = 'flow_maybe_type';
}
export declare namespace ForInStatement {
    type Config = ConfigFor<'for_in_statement'>;
    type Fluent = FluentFor<'for_in_statement'>;
    type Loose = LooseFor<'for_in_statement'>;
    type Tree = TreeFor<'for_in_statement'>;
    type Kind = 'for_in_statement';
}
export declare namespace ForStatement {
    type Config = ConfigFor<'for_statement'>;
    type Fluent = FluentFor<'for_statement'>;
    type Loose = LooseFor<'for_statement'>;
    type Tree = TreeFor<'for_statement'>;
    type Kind = 'for_statement';
}
export declare namespace FormalParameters {
    type Config = ConfigFor<'formal_parameters'>;
    type Fluent = FluentFor<'formal_parameters'>;
    type Loose = LooseFor<'formal_parameters'>;
    type Tree = TreeFor<'formal_parameters'>;
    type Kind = 'formal_parameters';
}
export declare namespace FunctionDeclaration {
    type Config = ConfigFor<'function_declaration'>;
    type Fluent = FluentFor<'function_declaration'>;
    type Loose = LooseFor<'function_declaration'>;
    type Tree = TreeFor<'function_declaration'>;
    type Kind = 'function_declaration';
}
export declare namespace FunctionExpression {
    type Config = ConfigFor<'function_expression'>;
    type Fluent = FluentFor<'function_expression'>;
    type Loose = LooseFor<'function_expression'>;
    type Tree = TreeFor<'function_expression'>;
    type Kind = 'function_expression';
}
export declare namespace FunctionSignature {
    type Config = ConfigFor<'function_signature'>;
    type Fluent = FluentFor<'function_signature'>;
    type Loose = LooseFor<'function_signature'>;
    type Tree = TreeFor<'function_signature'>;
    type Kind = 'function_signature';
}
export declare namespace FunctionType {
    type Config = ConfigFor<'function_type'>;
    type Fluent = FluentFor<'function_type'>;
    type Loose = LooseFor<'function_type'>;
    type Tree = TreeFor<'function_type'>;
    type Kind = 'function_type';
}
export declare namespace GeneratorFunction {
    type Config = ConfigFor<'generator_function'>;
    type Fluent = FluentFor<'generator_function'>;
    type Loose = LooseFor<'generator_function'>;
    type Tree = TreeFor<'generator_function'>;
    type Kind = 'generator_function';
}
export declare namespace GeneratorFunctionDeclaration {
    type Config = ConfigFor<'generator_function_declaration'>;
    type Fluent = FluentFor<'generator_function_declaration'>;
    type Loose = LooseFor<'generator_function_declaration'>;
    type Tree = TreeFor<'generator_function_declaration'>;
    type Kind = 'generator_function_declaration';
}
export declare namespace GenericType {
    type Config = ConfigFor<'generic_type'>;
    type Fluent = FluentFor<'generic_type'>;
    type Loose = LooseFor<'generic_type'>;
    type Tree = TreeFor<'generic_type'>;
    type Kind = 'generic_type';
}
export declare namespace IfStatement {
    type Config = ConfigFor<'if_statement'>;
    type Fluent = FluentFor<'if_statement'>;
    type Loose = LooseFor<'if_statement'>;
    type Tree = TreeFor<'if_statement'>;
    type Kind = 'if_statement';
}
export declare namespace ImplementsClause {
    type Config = ConfigFor<'implements_clause'>;
    type Fluent = FluentFor<'implements_clause'>;
    type Loose = LooseFor<'implements_clause'>;
    type Tree = TreeFor<'implements_clause'>;
    type Kind = 'implements_clause';
}
export declare namespace ImportAlias {
    type Config = ConfigFor<'import_alias'>;
    type Fluent = FluentFor<'import_alias'>;
    type Loose = LooseFor<'import_alias'>;
    type Tree = TreeFor<'import_alias'>;
    type Kind = 'import_alias';
}
export declare namespace ImportAttribute {
    type Config = ConfigFor<'import_attribute'>;
    type Fluent = FluentFor<'import_attribute'>;
    type Loose = LooseFor<'import_attribute'>;
    type Tree = TreeFor<'import_attribute'>;
    type Kind = 'import_attribute';
}
export declare namespace ImportClauseNamespaceImport {
    type Config = ConfigFor<'import_clause_namespace_import'>;
    type Fluent = FluentFor<'import_clause_namespace_import'>;
    type Loose = LooseFor<'import_clause_namespace_import'>;
    type Tree = TreeFor<'import_clause_namespace_import'>;
    type Kind = 'import_clause_namespace_import';
}
export declare namespace ImportClauseNamedImports {
    type Config = ConfigFor<'import_clause_named_imports'>;
    type Fluent = FluentFor<'import_clause_named_imports'>;
    type Loose = LooseFor<'import_clause_named_imports'>;
    type Tree = TreeFor<'import_clause_named_imports'>;
    type Kind = 'import_clause_named_imports';
}
export declare namespace ImportClauseDefaultImport {
    type Config = ConfigFor<'import_clause_default_import'>;
    type Fluent = FluentFor<'import_clause_default_import'>;
    type Loose = LooseFor<'import_clause_default_import'>;
    type Tree = TreeFor<'import_clause_default_import'>;
    type Kind = 'import_clause_default_import';
}
export declare namespace ImportClause {
    type Config = ConfigFor<'import_clause'>;
    type Fluent = FluentFor<'import_clause'>;
    type Loose = LooseFor<'import_clause'>;
    type Tree = TreeFor<'import_clause'>;
    type Kind = 'import_clause';
}
export declare namespace ImportRequireClause {
    type Config = ConfigFor<'import_require_clause'>;
    type Fluent = FluentFor<'import_require_clause'>;
    type Loose = LooseFor<'import_require_clause'>;
    type Tree = TreeFor<'import_require_clause'>;
    type Kind = 'import_require_clause';
}
export declare namespace ImportSpecifierName {
    type Config = ConfigFor<'import_specifier_name'>;
    type Fluent = FluentFor<'import_specifier_name'>;
    type Loose = LooseFor<'import_specifier_name'>;
    type Tree = TreeFor<'import_specifier_name'>;
    type Kind = 'import_specifier_name';
}
export declare namespace ImportSpecifier {
    type Config = ConfigFor<'import_specifier'>;
    type Fluent = FluentFor<'import_specifier'>;
    type Loose = LooseFor<'import_specifier'>;
    type Tree = TreeFor<'import_specifier'>;
    type Kind = 'import_specifier';
}
export declare namespace ImportStatement {
    type Config = ConfigFor<'import_statement'>;
    type Fluent = FluentFor<'import_statement'>;
    type Loose = LooseFor<'import_statement'>;
    type Tree = TreeFor<'import_statement'>;
    type Kind = 'import_statement';
}
export declare namespace IndexSignatureMappedTypeClause {
    type Config = ConfigFor<'index_signature_mapped_type_clause'>;
    type Fluent = FluentFor<'index_signature_mapped_type_clause'>;
    type Loose = LooseFor<'index_signature_mapped_type_clause'>;
    type Tree = TreeFor<'index_signature_mapped_type_clause'>;
    type Kind = 'index_signature_mapped_type_clause';
}
export declare namespace IndexSignature {
    type Config = ConfigFor<'index_signature'>;
    type Fluent = FluentFor<'index_signature'>;
    type Loose = LooseFor<'index_signature'>;
    type Tree = TreeFor<'index_signature'>;
    type Kind = 'index_signature';
}
export declare namespace IndexTypeQuery {
    type Config = ConfigFor<'index_type_query'>;
    type Fluent = FluentFor<'index_type_query'>;
    type Loose = LooseFor<'index_type_query'>;
    type Tree = TreeFor<'index_type_query'>;
    type Kind = 'index_type_query';
}
export declare namespace InferType {
    type Config = ConfigFor<'infer_type'>;
    type Fluent = FluentFor<'infer_type'>;
    type Loose = LooseFor<'infer_type'>;
    type Tree = TreeFor<'infer_type'>;
    type Kind = 'infer_type';
}
export declare namespace InstantiationExpression {
    type Config = ConfigFor<'instantiation_expression'>;
    type Fluent = FluentFor<'instantiation_expression'>;
    type Loose = LooseFor<'instantiation_expression'>;
    type Tree = TreeFor<'instantiation_expression'>;
    type Kind = 'instantiation_expression';
}
export declare namespace InterfaceDeclaration {
    type Config = ConfigFor<'interface_declaration'>;
    type Fluent = FluentFor<'interface_declaration'>;
    type Loose = LooseFor<'interface_declaration'>;
    type Tree = TreeFor<'interface_declaration'>;
    type Kind = 'interface_declaration';
}
export declare namespace InternalModule {
    type Config = ConfigFor<'internal_module'>;
    type Fluent = FluentFor<'internal_module'>;
    type Loose = LooseFor<'internal_module'>;
    type Tree = TreeFor<'internal_module'>;
    type Kind = 'internal_module';
}
export declare namespace IntersectionType {
    type Config = ConfigFor<'intersection_type'>;
    type Fluent = FluentFor<'intersection_type'>;
    type Loose = LooseFor<'intersection_type'>;
    type Tree = TreeFor<'intersection_type'>;
    type Kind = 'intersection_type';
}
export declare namespace JsxAttribute {
    type Config = ConfigFor<'jsx_attribute'>;
    type Fluent = FluentFor<'jsx_attribute'>;
    type Loose = LooseFor<'jsx_attribute'>;
    type Tree = TreeFor<'jsx_attribute'>;
    type Kind = 'jsx_attribute';
}
export declare namespace JsxClosingElement {
    type Config = ConfigFor<'jsx_closing_element'>;
    type Fluent = FluentFor<'jsx_closing_element'>;
    type Loose = LooseFor<'jsx_closing_element'>;
    type Tree = TreeFor<'jsx_closing_element'>;
    type Kind = 'jsx_closing_element';
}
export declare namespace JsxElement {
    type Config = ConfigFor<'jsx_element'>;
    type Fluent = FluentFor<'jsx_element'>;
    type Loose = LooseFor<'jsx_element'>;
    type Tree = TreeFor<'jsx_element'>;
    type Kind = 'jsx_element';
}
export declare namespace JsxExpression {
    type Config = ConfigFor<'jsx_expression'>;
    type Fluent = FluentFor<'jsx_expression'>;
    type Loose = LooseFor<'jsx_expression'>;
    type Tree = TreeFor<'jsx_expression'>;
    type Kind = 'jsx_expression';
}
export declare namespace JsxNamespaceName {
    type Config = ConfigFor<'jsx_namespace_name'>;
    type Fluent = FluentFor<'jsx_namespace_name'>;
    type Loose = LooseFor<'jsx_namespace_name'>;
    type Tree = TreeFor<'jsx_namespace_name'>;
    type Kind = 'jsx_namespace_name';
}
export declare namespace JsxOpeningElement {
    type Config = ConfigFor<'jsx_opening_element'>;
    type Fluent = FluentFor<'jsx_opening_element'>;
    type Loose = LooseFor<'jsx_opening_element'>;
    type Tree = TreeFor<'jsx_opening_element'>;
    type Kind = 'jsx_opening_element';
}
export declare namespace JsxSelfClosingElement {
    type Config = ConfigFor<'jsx_self_closing_element'>;
    type Fluent = FluentFor<'jsx_self_closing_element'>;
    type Loose = LooseFor<'jsx_self_closing_element'>;
    type Tree = TreeFor<'jsx_self_closing_element'>;
    type Kind = 'jsx_self_closing_element';
}
export declare namespace LabeledStatement {
    type Config = ConfigFor<'labeled_statement'>;
    type Fluent = FluentFor<'labeled_statement'>;
    type Loose = LooseFor<'labeled_statement'>;
    type Tree = TreeFor<'labeled_statement'>;
    type Kind = 'labeled_statement';
}
export declare namespace LexicalDeclaration {
    type Config = ConfigFor<'lexical_declaration'>;
    type Fluent = FluentFor<'lexical_declaration'>;
    type Loose = LooseFor<'lexical_declaration'>;
    type Tree = TreeFor<'lexical_declaration'>;
    type Kind = 'lexical_declaration';
}
export declare namespace LiteralType {
    type Config = ConfigFor<'literal_type'>;
    type Fluent = FluentFor<'literal_type'>;
    type Loose = LooseFor<'literal_type'>;
    type Tree = TreeFor<'literal_type'>;
    type Kind = 'literal_type';
}
export declare namespace LookupType {
    type Config = ConfigFor<'lookup_type'>;
    type Fluent = FluentFor<'lookup_type'>;
    type Loose = LooseFor<'lookup_type'>;
    type Tree = TreeFor<'lookup_type'>;
    type Kind = 'lookup_type';
}
export declare namespace MappedTypeClause {
    type Config = ConfigFor<'mapped_type_clause'>;
    type Fluent = FluentFor<'mapped_type_clause'>;
    type Loose = LooseFor<'mapped_type_clause'>;
    type Tree = TreeFor<'mapped_type_clause'>;
    type Kind = 'mapped_type_clause';
}
export declare namespace MemberExpression {
    type Config = ConfigFor<'member_expression'>;
    type Fluent = FluentFor<'member_expression'>;
    type Loose = LooseFor<'member_expression'>;
    type Tree = TreeFor<'member_expression'>;
    type Kind = 'member_expression';
}
export declare namespace MethodDefinition {
    type Config = ConfigFor<'method_definition'>;
    type Fluent = FluentFor<'method_definition'>;
    type Loose = LooseFor<'method_definition'>;
    type Tree = TreeFor<'method_definition'>;
    type Kind = 'method_definition';
}
export declare namespace MethodSignature {
    type Config = ConfigFor<'method_signature'>;
    type Fluent = FluentFor<'method_signature'>;
    type Loose = LooseFor<'method_signature'>;
    type Tree = TreeFor<'method_signature'>;
    type Kind = 'method_signature';
}
export declare namespace Module {
    type Config = ConfigFor<'module'>;
    type Fluent = FluentFor<'module'>;
    type Loose = LooseFor<'module'>;
    type Tree = TreeFor<'module'>;
    type Kind = 'module';
}
export declare namespace NamedImports {
    type Config = ConfigFor<'named_imports'>;
    type Fluent = FluentFor<'named_imports'>;
    type Loose = LooseFor<'named_imports'>;
    type Tree = TreeFor<'named_imports'>;
    type Kind = 'named_imports';
}
export declare namespace NamespaceExport {
    type Config = ConfigFor<'namespace_export'>;
    type Fluent = FluentFor<'namespace_export'>;
    type Loose = LooseFor<'namespace_export'>;
    type Tree = TreeFor<'namespace_export'>;
    type Kind = 'namespace_export';
}
export declare namespace NamespaceImport {
    type Config = ConfigFor<'namespace_import'>;
    type Fluent = FluentFor<'namespace_import'>;
    type Loose = LooseFor<'namespace_import'>;
    type Tree = TreeFor<'namespace_import'>;
    type Kind = 'namespace_import';
}
export declare namespace NestedIdentifier {
    type Config = ConfigFor<'nested_identifier'>;
    type Fluent = FluentFor<'nested_identifier'>;
    type Loose = LooseFor<'nested_identifier'>;
    type Tree = TreeFor<'nested_identifier'>;
    type Kind = 'nested_identifier';
}
export declare namespace NestedTypeIdentifier {
    type Config = ConfigFor<'nested_type_identifier'>;
    type Fluent = FluentFor<'nested_type_identifier'>;
    type Loose = LooseFor<'nested_type_identifier'>;
    type Tree = TreeFor<'nested_type_identifier'>;
    type Kind = 'nested_type_identifier';
}
export declare namespace NewExpression {
    type Config = ConfigFor<'new_expression'>;
    type Fluent = FluentFor<'new_expression'>;
    type Loose = LooseFor<'new_expression'>;
    type Tree = TreeFor<'new_expression'>;
    type Kind = 'new_expression';
}
export declare namespace NonNullExpression {
    type Config = ConfigFor<'non_null_expression'>;
    type Fluent = FluentFor<'non_null_expression'>;
    type Loose = LooseFor<'non_null_expression'>;
    type Tree = TreeFor<'non_null_expression'>;
    type Kind = 'non_null_expression';
}
export declare namespace Object {
    type Config = ConfigFor<'object'>;
    type Fluent = FluentFor<'object'>;
    type Loose = LooseFor<'object'>;
    type Tree = TreeFor<'object'>;
    type Kind = 'object';
}
export declare namespace ObjectAssignmentPattern {
    type Config = ConfigFor<'object_assignment_pattern'>;
    type Fluent = FluentFor<'object_assignment_pattern'>;
    type Loose = LooseFor<'object_assignment_pattern'>;
    type Tree = TreeFor<'object_assignment_pattern'>;
    type Kind = 'object_assignment_pattern';
}
export declare namespace ObjectPattern {
    type Config = ConfigFor<'object_pattern'>;
    type Fluent = FluentFor<'object_pattern'>;
    type Loose = LooseFor<'object_pattern'>;
    type Tree = TreeFor<'object_pattern'>;
    type Kind = 'object_pattern';
}
export declare namespace ObjectType {
    namespace Curly {
        type Config = Omit<ConfigFor<'object_type'>, "opening" | "closing">;
        type Tree = ObjectTypeCurlyTree;
    }
    namespace Flow {
        type Config = Omit<ConfigFor<'object_type'>, "opening" | "closing">;
        type Tree = ObjectTypeFlowTree;
    }
    /** Default form: 'curly' (first-declared). */
    type Config = Curly.Config;
    type Fluent = FluentFor<'object_type'>;
    type Loose = LooseFor<'object_type'>;
    type Tree = TreeFor<'object_type'>;
    type Kind = 'object_type';
}
export declare namespace OmittingTypeAnnotation {
    type Config = ConfigFor<'omitting_type_annotation'>;
    type Fluent = FluentFor<'omitting_type_annotation'>;
    type Loose = LooseFor<'omitting_type_annotation'>;
    type Tree = TreeFor<'omitting_type_annotation'>;
    type Kind = 'omitting_type_annotation';
}
export declare namespace OptingTypeAnnotation {
    type Config = ConfigFor<'opting_type_annotation'>;
    type Fluent = FluentFor<'opting_type_annotation'>;
    type Loose = LooseFor<'opting_type_annotation'>;
    type Tree = TreeFor<'opting_type_annotation'>;
    type Kind = 'opting_type_annotation';
}
export declare namespace OptionalParameter {
    type Config = ConfigFor<'optional_parameter'>;
    type Fluent = FluentFor<'optional_parameter'>;
    type Loose = LooseFor<'optional_parameter'>;
    type Tree = TreeFor<'optional_parameter'>;
    type Kind = 'optional_parameter';
}
export declare namespace OptionalTupleParameter {
    type Config = ConfigFor<'optional_tuple_parameter'>;
    type Fluent = FluentFor<'optional_tuple_parameter'>;
    type Loose = LooseFor<'optional_tuple_parameter'>;
    type Tree = TreeFor<'optional_tuple_parameter'>;
    type Kind = 'optional_tuple_parameter';
}
export declare namespace OptionalType {
    type Config = ConfigFor<'optional_type'>;
    type Fluent = FluentFor<'optional_type'>;
    type Loose = LooseFor<'optional_type'>;
    type Tree = TreeFor<'optional_type'>;
    type Kind = 'optional_type';
}
export declare namespace Pair {
    type Config = ConfigFor<'pair'>;
    type Fluent = FluentFor<'pair'>;
    type Loose = LooseFor<'pair'>;
    type Tree = TreeFor<'pair'>;
    type Kind = 'pair';
}
export declare namespace PairPattern {
    type Config = ConfigFor<'pair_pattern'>;
    type Fluent = FluentFor<'pair_pattern'>;
    type Loose = LooseFor<'pair_pattern'>;
    type Tree = TreeFor<'pair_pattern'>;
    type Kind = 'pair_pattern';
}
export declare namespace ParenthesizedExpressionSequence {
    type Config = ConfigFor<'parenthesized_expression_sequence'>;
    type Fluent = FluentFor<'parenthesized_expression_sequence'>;
    type Loose = LooseFor<'parenthesized_expression_sequence'>;
    type Tree = TreeFor<'parenthesized_expression_sequence'>;
    type Kind = 'parenthesized_expression_sequence';
}
export declare namespace ParenthesizedExpression {
    type Config = ConfigFor<'parenthesized_expression'>;
    type Fluent = FluentFor<'parenthesized_expression'>;
    type Loose = LooseFor<'parenthesized_expression'>;
    type Tree = TreeFor<'parenthesized_expression'>;
    type Kind = 'parenthesized_expression';
}
export declare namespace ParenthesizedType {
    type Config = ConfigFor<'parenthesized_type'>;
    type Fluent = FluentFor<'parenthesized_type'>;
    type Loose = LooseFor<'parenthesized_type'>;
    type Tree = TreeFor<'parenthesized_type'>;
    type Kind = 'parenthesized_type';
}
export declare namespace Program {
    type Config = ConfigFor<'program'>;
    type Fluent = FluentFor<'program'>;
    type Loose = LooseFor<'program'>;
    type Tree = TreeFor<'program'>;
    type Kind = 'program';
}
export declare namespace PropertySignature {
    type Config = ConfigFor<'property_signature'>;
    type Fluent = FluentFor<'property_signature'>;
    type Loose = LooseFor<'property_signature'>;
    type Tree = TreeFor<'property_signature'>;
    type Kind = 'property_signature';
}
export declare namespace PublicFieldDefinition {
    type Config = ConfigFor<'public_field_definition'>;
    type Fluent = FluentFor<'public_field_definition'>;
    type Loose = LooseFor<'public_field_definition'>;
    type Tree = TreeFor<'public_field_definition'>;
    type Kind = 'public_field_definition';
}
export declare namespace ReadonlyType {
    type Config = ConfigFor<'readonly_type'>;
    type Fluent = FluentFor<'readonly_type'>;
    type Loose = LooseFor<'readonly_type'>;
    type Tree = TreeFor<'readonly_type'>;
    type Kind = 'readonly_type';
}
export declare namespace Regex {
    type Config = ConfigFor<'regex'>;
    type Fluent = FluentFor<'regex'>;
    type Loose = LooseFor<'regex'>;
    type Tree = TreeFor<'regex'>;
    type Kind = 'regex';
}
export declare namespace RequiredParameter {
    type Config = ConfigFor<'required_parameter'>;
    type Fluent = FluentFor<'required_parameter'>;
    type Loose = LooseFor<'required_parameter'>;
    type Tree = TreeFor<'required_parameter'>;
    type Kind = 'required_parameter';
}
export declare namespace RestPattern {
    type Config = ConfigFor<'rest_pattern'>;
    type Fluent = FluentFor<'rest_pattern'>;
    type Loose = LooseFor<'rest_pattern'>;
    type Tree = TreeFor<'rest_pattern'>;
    type Kind = 'rest_pattern';
}
export declare namespace RestType {
    type Config = ConfigFor<'rest_type'>;
    type Fluent = FluentFor<'rest_type'>;
    type Loose = LooseFor<'rest_type'>;
    type Tree = TreeFor<'rest_type'>;
    type Kind = 'rest_type';
}
export declare namespace ReturnStatement {
    type Config = ConfigFor<'return_statement'>;
    type Fluent = FluentFor<'return_statement'>;
    type Loose = LooseFor<'return_statement'>;
    type Tree = TreeFor<'return_statement'>;
    type Kind = 'return_statement';
}
export declare namespace SatisfiesExpression {
    type Config = ConfigFor<'satisfies_expression'>;
    type Fluent = FluentFor<'satisfies_expression'>;
    type Loose = LooseFor<'satisfies_expression'>;
    type Tree = TreeFor<'satisfies_expression'>;
    type Kind = 'satisfies_expression';
}
export declare namespace SequenceExpression {
    type Config = ConfigFor<'sequence_expression'>;
    type Fluent = FluentFor<'sequence_expression'>;
    type Loose = LooseFor<'sequence_expression'>;
    type Tree = TreeFor<'sequence_expression'>;
    type Kind = 'sequence_expression';
}
export declare namespace SpreadElement {
    type Config = ConfigFor<'spread_element'>;
    type Fluent = FluentFor<'spread_element'>;
    type Loose = LooseFor<'spread_element'>;
    type Tree = TreeFor<'spread_element'>;
    type Kind = 'spread_element';
}
export declare namespace StatementBlock {
    type Config = ConfigFor<'statement_block'>;
    type Fluent = FluentFor<'statement_block'>;
    type Loose = LooseFor<'statement_block'>;
    type Tree = TreeFor<'statement_block'>;
    type Kind = 'statement_block';
}
export declare namespace String {
    namespace Double {
        type Config = Omit<ConfigFor<'string'>, "opening" | "closing">;
        type Tree = StringDoubleTree;
    }
    namespace Single {
        type Config = Omit<ConfigFor<'string'>, "opening" | "closing">;
        type Tree = StringSingleTree;
    }
    /** Default form: 'double' (first-declared). */
    type Config = Double.Config;
    type Fluent = FluentFor<'string'>;
    type Loose = LooseFor<'string'>;
    type Tree = TreeFor<'string'>;
    type Kind = 'string';
}
export declare namespace SubscriptExpression {
    type Config = ConfigFor<'subscript_expression'>;
    type Fluent = FluentFor<'subscript_expression'>;
    type Loose = LooseFor<'subscript_expression'>;
    type Tree = TreeFor<'subscript_expression'>;
    type Kind = 'subscript_expression';
}
export declare namespace SwitchBody {
    type Config = ConfigFor<'switch_body'>;
    type Fluent = FluentFor<'switch_body'>;
    type Loose = LooseFor<'switch_body'>;
    type Tree = TreeFor<'switch_body'>;
    type Kind = 'switch_body';
}
export declare namespace SwitchCase {
    type Config = ConfigFor<'switch_case'>;
    type Fluent = FluentFor<'switch_case'>;
    type Loose = LooseFor<'switch_case'>;
    type Tree = TreeFor<'switch_case'>;
    type Kind = 'switch_case';
}
export declare namespace SwitchDefault {
    type Config = ConfigFor<'switch_default'>;
    type Fluent = FluentFor<'switch_default'>;
    type Loose = LooseFor<'switch_default'>;
    type Tree = TreeFor<'switch_default'>;
    type Kind = 'switch_default';
}
export declare namespace SwitchStatement {
    type Config = ConfigFor<'switch_statement'>;
    type Fluent = FluentFor<'switch_statement'>;
    type Loose = LooseFor<'switch_statement'>;
    type Tree = TreeFor<'switch_statement'>;
    type Kind = 'switch_statement';
}
export declare namespace TemplateLiteralType {
    type Config = ConfigFor<'template_literal_type'>;
    type Fluent = FluentFor<'template_literal_type'>;
    type Loose = LooseFor<'template_literal_type'>;
    type Tree = TreeFor<'template_literal_type'>;
    type Kind = 'template_literal_type';
}
export declare namespace TemplateString {
    type Config = ConfigFor<'template_string'>;
    type Fluent = FluentFor<'template_string'>;
    type Loose = LooseFor<'template_string'>;
    type Tree = TreeFor<'template_string'>;
    type Kind = 'template_string';
}
export declare namespace TemplateSubstitution {
    type Config = ConfigFor<'template_substitution'>;
    type Fluent = FluentFor<'template_substitution'>;
    type Loose = LooseFor<'template_substitution'>;
    type Tree = TreeFor<'template_substitution'>;
    type Kind = 'template_substitution';
}
export declare namespace TemplateType {
    type Config = ConfigFor<'template_type'>;
    type Fluent = FluentFor<'template_type'>;
    type Loose = LooseFor<'template_type'>;
    type Tree = TreeFor<'template_type'>;
    type Kind = 'template_type';
}
export declare namespace TernaryExpression {
    type Config = ConfigFor<'ternary_expression'>;
    type Fluent = FluentFor<'ternary_expression'>;
    type Loose = LooseFor<'ternary_expression'>;
    type Tree = TreeFor<'ternary_expression'>;
    type Kind = 'ternary_expression';
}
export declare namespace ThrowStatement {
    type Config = ConfigFor<'throw_statement'>;
    type Fluent = FluentFor<'throw_statement'>;
    type Loose = LooseFor<'throw_statement'>;
    type Tree = TreeFor<'throw_statement'>;
    type Kind = 'throw_statement';
}
export declare namespace TryStatement {
    type Config = ConfigFor<'try_statement'>;
    type Fluent = FluentFor<'try_statement'>;
    type Loose = LooseFor<'try_statement'>;
    type Tree = TreeFor<'try_statement'>;
    type Kind = 'try_statement';
}
export declare namespace TupleParameter {
    type Config = ConfigFor<'tuple_parameter'>;
    type Fluent = FluentFor<'tuple_parameter'>;
    type Loose = LooseFor<'tuple_parameter'>;
    type Tree = TreeFor<'tuple_parameter'>;
    type Kind = 'tuple_parameter';
}
export declare namespace TupleType {
    type Config = ConfigFor<'tuple_type'>;
    type Fluent = FluentFor<'tuple_type'>;
    type Loose = LooseFor<'tuple_type'>;
    type Tree = TreeFor<'tuple_type'>;
    type Kind = 'tuple_type';
}
export declare namespace TypeAliasDeclaration {
    type Config = ConfigFor<'type_alias_declaration'>;
    type Fluent = FluentFor<'type_alias_declaration'>;
    type Loose = LooseFor<'type_alias_declaration'>;
    type Tree = TreeFor<'type_alias_declaration'>;
    type Kind = 'type_alias_declaration';
}
export declare namespace TypeAnnotation {
    type Config = ConfigFor<'type_annotation'>;
    type Fluent = FluentFor<'type_annotation'>;
    type Loose = LooseFor<'type_annotation'>;
    type Tree = TreeFor<'type_annotation'>;
    type Kind = 'type_annotation';
}
export declare namespace TypeArguments {
    type Config = ConfigFor<'type_arguments'>;
    type Fluent = FluentFor<'type_arguments'>;
    type Loose = LooseFor<'type_arguments'>;
    type Tree = TreeFor<'type_arguments'>;
    type Kind = 'type_arguments';
}
export declare namespace TypeAssertion {
    type Config = ConfigFor<'type_assertion'>;
    type Fluent = FluentFor<'type_assertion'>;
    type Loose = LooseFor<'type_assertion'>;
    type Tree = TreeFor<'type_assertion'>;
    type Kind = 'type_assertion';
}
export declare namespace TypeParameter {
    type Config = ConfigFor<'type_parameter'>;
    type Fluent = FluentFor<'type_parameter'>;
    type Loose = LooseFor<'type_parameter'>;
    type Tree = TreeFor<'type_parameter'>;
    type Kind = 'type_parameter';
}
export declare namespace TypeParameters {
    type Config = ConfigFor<'type_parameters'>;
    type Fluent = FluentFor<'type_parameters'>;
    type Loose = LooseFor<'type_parameters'>;
    type Tree = TreeFor<'type_parameters'>;
    type Kind = 'type_parameters';
}
export declare namespace TypePredicate {
    type Config = ConfigFor<'type_predicate'>;
    type Fluent = FluentFor<'type_predicate'>;
    type Loose = LooseFor<'type_predicate'>;
    type Tree = TreeFor<'type_predicate'>;
    type Kind = 'type_predicate';
}
export declare namespace TypePredicateAnnotation {
    type Config = ConfigFor<'type_predicate_annotation'>;
    type Fluent = FluentFor<'type_predicate_annotation'>;
    type Loose = LooseFor<'type_predicate_annotation'>;
    type Tree = TreeFor<'type_predicate_annotation'>;
    type Kind = 'type_predicate_annotation';
}
export declare namespace TypeQuery {
    type Config = ConfigFor<'type_query'>;
    type Fluent = FluentFor<'type_query'>;
    type Loose = LooseFor<'type_query'>;
    type Tree = TreeFor<'type_query'>;
    type Kind = 'type_query';
}
export declare namespace UnaryExpression {
    type Config = ConfigFor<'unary_expression'>;
    type Fluent = FluentFor<'unary_expression'>;
    type Loose = LooseFor<'unary_expression'>;
    type Tree = TreeFor<'unary_expression'>;
    type Kind = 'unary_expression';
}
export declare namespace UnionType {
    type Config = ConfigFor<'union_type'>;
    type Fluent = FluentFor<'union_type'>;
    type Loose = LooseFor<'union_type'>;
    type Tree = TreeFor<'union_type'>;
    type Kind = 'union_type';
}
export declare namespace UpdateExpression {
    type Config = ConfigFor<'update_expression'>;
    type Fluent = FluentFor<'update_expression'>;
    type Loose = LooseFor<'update_expression'>;
    type Tree = TreeFor<'update_expression'>;
    type Kind = 'update_expression';
}
export declare namespace VariableDeclaration {
    type Config = ConfigFor<'variable_declaration'>;
    type Fluent = FluentFor<'variable_declaration'>;
    type Loose = LooseFor<'variable_declaration'>;
    type Tree = TreeFor<'variable_declaration'>;
    type Kind = 'variable_declaration';
}
export declare namespace VariableDeclarator {
    type Config = ConfigFor<'variable_declarator'>;
    type Fluent = FluentFor<'variable_declarator'>;
    type Loose = LooseFor<'variable_declarator'>;
    type Tree = TreeFor<'variable_declarator'>;
    type Kind = 'variable_declarator';
}
export declare namespace WhileStatement {
    type Config = ConfigFor<'while_statement'>;
    type Fluent = FluentFor<'while_statement'>;
    type Loose = LooseFor<'while_statement'>;
    type Tree = TreeFor<'while_statement'>;
    type Kind = 'while_statement';
}
export declare namespace WithStatement {
    type Config = ConfigFor<'with_statement'>;
    type Fluent = FluentFor<'with_statement'>;
    type Loose = LooseFor<'with_statement'>;
    type Tree = TreeFor<'with_statement'>;
    type Kind = 'with_statement';
}
export declare namespace YieldExpression {
    type Config = ConfigFor<'yield_expression'>;
    type Fluent = FluentFor<'yield_expression'>;
    type Loose = LooseFor<'yield_expression'>;
    type Tree = TreeFor<'yield_expression'>;
    type Kind = 'yield_expression';
}
//# sourceMappingURL=types.d.ts.map
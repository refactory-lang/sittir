import type { RustGrammar } from './grammar.js';
import type { NodeData as BaseNodeData, NodeConfig as BaseNodeConfig, TreeNode as BaseTreeNode, NodeKind, NodeNs, AnyTreeNodeOf as AnyTreeNode, Terminal, NonEmptyArray, AutoStamp, BooleanKeyword } from '@sittir/types';
export type { RustGrammar };
export type NodeData<K extends NodeKind<RustGrammar>> = BaseNodeData<RustGrammar, K>;
export type NodeConfig<K extends NodeKind<RustGrammar>> = BaseNodeConfig<RustGrammar, K>;
export type TreeNode<K extends NodeKind<RustGrammar>> = BaseTreeNode<RustGrammar, K>;
export type LeafScalarMap = {};
export type LeafStringMap = {
    __range_expression_binary_operator: ".." | "..." | "..=";
    __visibility_modifier_in_path_in: "in";
    __visibility_modifier_pub_pub: "pub";
    _binary_expression_operator: "&&";
    _closure_expression_async_marker: "async";
    _closure_expression_static_marker: "static";
    _compound_assignment_expr_operator: "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=";
    _crate: "crate";
    _generic_type_with_turbofish_turbofish: "::";
    _impl_item_negative: "!";
    _kw_async_marker: "async";
    _kw_in: "in";
    _kw_move_marker: "move";
    _kw_pub: "pub";
    _kw_ref_marker: "ref";
    _kw_static_marker: "static";
    _kw_unsafe_marker: "unsafe";
    _move_marker: "move";
    _mutable_specifier: "mut";
    _operator: "..";
    _pointer_type_const: "const";
    _primitive_type: "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "u128" | "i128" | "isize" | "usize" | "f32" | "f64" | "bool" | "str" | "char";
    _ref_marker: "ref";
    _self: "self";
    _token_binding_pattern_type: "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis";
    _unary_expression_operator: "-" | "*" | "!";
    _unsafe_marker: "unsafe";
    _wildcard_pattern: "_";
    boolean_literal: "true" | "false";
    crate: "crate";
    fragment_specifier: "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis";
    mutable_specifier: "mut";
    self: "self";
    super: "super";
    _: "_";
    fn: "fn";
    async: "async";
    in: "in";
    move: "move";
    pub: "pub";
    ref: "ref";
    static: "static";
    unsafe: "unsafe";
    as: "as";
    await: "await";
    break: "break";
    const: "const";
    continue: "continue";
    default: "default";
    enum: "enum";
    for: "for";
    gen: "gen";
    if: "if";
    impl: "impl";
    let: "let";
    loop: "loop";
    match: "match";
    mod: "mod";
    return: "return";
    struct: "struct";
    trait: "trait";
    type: "type";
    union: "union";
    use: "use";
    where: "where";
    while: "while";
    raw: "raw";
    dyn: "dyn";
    else: "else";
    extern: "extern";
    mut: "mut";
    try: "try";
    yield: "yield";
};
export declare const enum SyntaxKind {
    ArrayExpressionList = "_array_expression_list",
    ArrayExpressionSemi = "_array_expression_semi",
    ClosureExpressionBlock = "_closure_expression_block",
    _ClosureExpressionExpr = "_closure_expression_expr",
    _DelimTokenTreeBrace = "_delim_token_tree_brace",
    _DelimTokenTreeBracket = "_delim_token_tree_bracket",
    _DelimTokenTreeParen = "_delim_token_tree_paren",
    _ExpressionStatementBlockEnding = "_expression_statement_block_ending",
    _ExpressionStatementWithSemi = "_expression_statement_with_semi",
    FieldIdentifier = "_field_identifier",
    FieldPatternNamed = "_field_pattern_named",
    _FieldPatternShorthand = "_field_pattern_shorthand",
    _ForeignModItemBody = "_foreign_mod_item_body",
    FunctionTypeFnForm = "_function_type_fn_form",
    FunctionTypeTraitForm = "_function_type_trait_form",
    _ImplItemBody = "_impl_item_body",
    LetChain = "_let_chain",
    LineCommentDoc = "_line_comment_doc",
    _MacroDefinitionBrace = "_macro_definition_brace",
    _MacroDefinitionBracket = "_macro_definition_bracket",
    _MacroDefinitionParen = "_macro_definition_paren",
    _MatchArmBlockEnding = "_match_arm_block_ending",
    MatchArmWithComma = "_match_arm_with_comma",
    _ModItemInline = "_mod_item_inline",
    NonSpecialToken = "_non_special_token",
    OrPatternBinary = "_or_pattern_binary",
    OrPatternPrefix = "_or_pattern_prefix",
    _PointerTypeMut = "_pointer_type_mut",
    _RangeExpressionBare = "_range_expression_bare",
    RangeExpressionBinary = "_range_expression_binary",
    RangeExpressionPostfix = "_range_expression_postfix",
    RangeExpressionPrefix = "_range_expression_prefix",
    RangePatternLeftWithRight = "_range_pattern_left_with_right",
    RangePatternPrefix = "_range_pattern_prefix",
    ReferenceExpressionRawMut = "_reference_expression_raw_mut",
    ReservedIdentifier = "_reserved_identifier",
    StructItemBrace = "_struct_item_brace",
    StructItemTuple = "_struct_item_tuple",
    _TokenTreeBrace = "_token_tree_brace",
    _TokenTreeBracket = "_token_tree_bracket",
    _TokenTreeParen = "_token_tree_paren",
    _TokenTreePatternBrace = "_token_tree_pattern_brace",
    _TokenTreePatternBracket = "_token_tree_pattern_bracket",
    _TokenTreePatternParen = "_token_tree_pattern_paren",
    TypeIdentifier = "_type_identifier",
    _VisibilityModifierCrate = "_visibility_modifier_crate",
    VisibilityModifierInPath = "_visibility_modifier_in_path",
    VisibilityModifierPub = "_visibility_modifier_pub",
    AbstractType = "abstract_type",
    Arguments = "arguments",
    ArrayExpression = "array_expression",
    ArrayType = "array_type",
    AssignmentExpression = "assignment_expression",
    AssociatedType = "associated_type",
    AsyncBlock = "async_block",
    Attribute = "attribute",
    AttributeItem = "attribute_item",
    AwaitExpression = "await_expression",
    BaseFieldInitializer = "base_field_initializer",
    BinaryExpression = "binary_expression",
    Block = "block",
    BlockComment = "block_comment",
    BoundedType = "bounded_type",
    BracketedType = "bracketed_type",
    BreakExpression = "break_expression",
    CallExpression = "call_expression",
    CapturedPattern = "captured_pattern",
    ClosureExpressionExpr = "closure_expression_expr",
    ClosureExpression = "closure_expression",
    ClosureParameters = "closure_parameters",
    Comment = "comment",
    CompoundAssignmentExpr = "compound_assignment_expr",
    ConstBlock = "const_block",
    ConstItem = "const_item",
    ConstParameter = "const_parameter",
    ContinueExpression = "continue_expression",
    DeclarationList = "declaration_list",
    DelimTokenTreeParen = "delim_token_tree_paren",
    DelimTokenTreeBracket = "delim_token_tree_bracket",
    DelimTokenTreeBrace = "delim_token_tree_brace",
    DelimTokenTree = "delim_token_tree",
    DynamicType = "dynamic_type",
    ElseClause = "else_clause",
    EnumItem = "enum_item",
    EnumVariant = "enum_variant",
    EnumVariantList = "enum_variant_list",
    ExpressionStatementWithSemi = "expression_statement_with_semi",
    ExpressionStatementBlockEnding = "expression_statement_block_ending",
    ExpressionStatement = "expression_statement",
    ExternCrateDeclaration = "extern_crate_declaration",
    ExternModifier = "extern_modifier",
    FieldDeclaration = "field_declaration",
    FieldDeclarationList = "field_declaration_list",
    FieldExpression = "field_expression",
    FieldInitializer = "field_initializer",
    FieldInitializerList = "field_initializer_list",
    FieldPatternShorthand = "field_pattern_shorthand",
    FieldPattern = "field_pattern",
    ForExpression = "for_expression",
    ForLifetimes = "for_lifetimes",
    ForeignModItemBody = "foreign_mod_item_body",
    ForeignModItem = "foreign_mod_item",
    FunctionItem = "function_item",
    FunctionModifiers = "function_modifiers",
    FunctionSignatureItem = "function_signature_item",
    FunctionType = "function_type",
    GenBlock = "gen_block",
    GenericFunction = "generic_function",
    GenericPattern = "generic_pattern",
    GenericType = "generic_type",
    GenericTypeWithTurbofish = "generic_type_with_turbofish",
    HigherRankedTraitBound = "higher_ranked_trait_bound",
    IfExpression = "if_expression",
    ImplItemBody = "impl_item_body",
    ImplItem = "impl_item",
    IndexExpression = "index_expression",
    InnerAttributeItem = "inner_attribute_item",
    Label = "label",
    LastMatchArm = "last_match_arm",
    LetCondition = "let_condition",
    LetDeclaration = "let_declaration",
    Lifetime = "lifetime",
    LifetimeParameter = "lifetime_parameter",
    LineComment = "line_comment",
    LoopExpression = "loop_expression",
    MacroDefinitionParen = "macro_definition_paren",
    MacroDefinitionBracket = "macro_definition_bracket",
    MacroDefinitionBrace = "macro_definition_brace",
    MacroDefinition = "macro_definition",
    MacroInvocation = "macro_invocation",
    MacroRule = "macro_rule",
    MatchArmBlockEnding = "match_arm_block_ending",
    MatchArm = "match_arm",
    MatchBlock = "match_block",
    MatchExpression = "match_expression",
    MatchPattern = "match_pattern",
    ModItemInline = "mod_item_inline",
    ModItem = "mod_item",
    MutPattern = "mut_pattern",
    NegativeLiteral = "negative_literal",
    OrPattern = "or_pattern",
    OrderedFieldDeclarationList = "ordered_field_declaration_list",
    Parameter = "parameter",
    Parameters = "parameters",
    ParenthesizedExpression = "parenthesized_expression",
    PointerTypeMut = "pointer_type_mut",
    PointerType = "pointer_type",
    QualifiedType = "qualified_type",
    RangeExpressionBare = "range_expression_bare",
    RangeExpression = "range_expression",
    RangePattern = "range_pattern",
    RawStringLiteral = "raw_string_literal",
    RefPattern = "ref_pattern",
    ReferenceExpression = "reference_expression",
    ReferencePattern = "reference_pattern",
    ReferenceType = "reference_type",
    RemovedTraitBound = "removed_trait_bound",
    ReturnExpression = "return_expression",
    ScopedIdentifier = "scoped_identifier",
    ScopedTypeIdentifier = "scoped_type_identifier",
    ScopedTypeIdentifierInExpressionPosition = "scoped_type_identifier_in_expression_position",
    ScopedUseList = "scoped_use_list",
    SelfParameter = "self_parameter",
    ShorthandFieldInitializer = "shorthand_field_initializer",
    SlicePattern = "slice_pattern",
    SourceFile = "source_file",
    StaticItem = "static_item",
    StringLiteral = "string_literal",
    StructExpression = "struct_expression",
    StructItem = "struct_item",
    StructPattern = "struct_pattern",
    TokenBindingPattern = "token_binding_pattern",
    TokenRepetition = "token_repetition",
    TokenRepetitionPattern = "token_repetition_pattern",
    TokenTreeParen = "token_tree_paren",
    TokenTreeBracket = "token_tree_bracket",
    TokenTreeBrace = "token_tree_brace",
    TokenTree = "token_tree",
    TokenTreePatternParen = "token_tree_pattern_paren",
    TokenTreePatternBracket = "token_tree_pattern_bracket",
    TokenTreePatternBrace = "token_tree_pattern_brace",
    TokenTreePattern = "token_tree_pattern",
    TraitBounds = "trait_bounds",
    TraitItem = "trait_item",
    TryBlock = "try_block",
    TryExpression = "try_expression",
    TupleExpression = "tuple_expression",
    TuplePattern = "tuple_pattern",
    TupleStructPattern = "tuple_struct_pattern",
    TupleType = "tuple_type",
    TypeArguments = "type_arguments",
    TypeBinding = "type_binding",
    TypeCastExpression = "type_cast_expression",
    TypeItem = "type_item",
    TypeParameter = "type_parameter",
    TypeParameters = "type_parameters",
    UnaryExpression = "unary_expression",
    UnionItem = "union_item",
    UnsafeBlock = "unsafe_block",
    UseAsClause = "use_as_clause",
    UseBounds = "use_bounds",
    UseDeclaration = "use_declaration",
    UseList = "use_list",
    UseWildcard = "use_wildcard",
    VariadicParameter = "variadic_parameter",
    VisibilityModifierCrate = "visibility_modifier_crate",
    VisibilityModifier = "visibility_modifier",
    WhereClause = "where_clause",
    WherePredicate = "where_predicate",
    WhileExpression = "while_expression",
    YieldExpression = "yield_expression",
    RangeExpressionBinaryOperator = "__range_expression_binary_operator",
    VisibilityModifierInPathIn = "__visibility_modifier_in_path_in",
    VisibilityModifierPubPub = "__visibility_modifier_pub_pub",
    BinaryExpressionOperator = "_binary_expression_operator",
    ClosureExpressionAsyncMarker = "_closure_expression_async_marker",
    ClosureExpressionStaticMarker = "_closure_expression_static_marker",
    CompoundAssignmentExprOperator = "_compound_assignment_expr_operator",
    _Crate = "_crate",
    GenericTypeWithTurbofishTurbofish = "_generic_type_with_turbofish_turbofish",
    ImplItemNegative = "_impl_item_negative",
    KwAsyncMarker = "_kw_async_marker",
    KwIn = "_kw_in",
    KwMoveMarker = "_kw_move_marker",
    KwPub = "_kw_pub",
    KwRefMarker = "_kw_ref_marker",
    KwStaticMarker = "_kw_static_marker",
    KwUnsafeMarker = "_kw_unsafe_marker",
    LineCommentContent = "_line_comment_content",
    LineCommentRegularDslash = "_line_comment_regular_dslash",
    MoveMarker = "_move_marker",
    _MutableSpecifier = "_mutable_specifier",
    Operator = "_operator",
    PointerTypeConst = "_pointer_type_const",
    PrimitiveType = "_primitive_type",
    RefMarker = "_ref_marker",
    ReferenceExpressionRawConst = "_reference_expression_raw_const",
    _Self = "_self",
    TokenBindingPatternType = "_token_binding_pattern_type",
    UnaryExpressionOperator = "_unary_expression_operator",
    UnsafeMarker = "_unsafe_marker",
    WildcardPattern = "_wildcard_pattern",
    BooleanLiteral = "boolean_literal",
    CharLiteral = "char_literal",
    Crate = "crate",
    EscapeSequence = "escape_sequence",
    FragmentSpecifier = "fragment_specifier",
    Identifier = "identifier",
    IntegerLiteral = "integer_literal",
    Metavariable = "metavariable",
    MutableSpecifier = "mutable_specifier",
    Self = "self",
    Shebang = "shebang",
    Super = "super",
    UnitExpression = "unit_expression",
    UnitType = "unit_type",
    StringContent = "string_content",
    RawStringLiteralContent = "raw_string_literal_content",
    FloatLiteral = "float_literal",
    OuterBlockDocCommentMarker = "_outer_block_doc_comment_marker",
    InnerBlockDocCommentMarker = "_inner_block_doc_comment_marker",
    LineDocContent = "_line_doc_content",
    ErrorSentinel = "_error_sentinel",
    Anonymous = "_",
    Fn = "fn",
    Async = "async",
    In = "in",
    Move = "move",
    Pub = "pub",
    Ref = "ref",
    Static = "static",
    Unsafe = "unsafe",
    As = "as",
    Await = "await",
    Break = "break",
    Const = "const",
    Continue = "continue",
    Default = "default",
    Enum = "enum",
    For = "for",
    Gen = "gen",
    If = "if",
    Impl = "impl",
    Let = "let",
    Loop = "loop",
    Match = "match",
    Mod = "mod",
    Return = "return",
    Struct = "struct",
    Trait = "trait",
    Type = "type",
    Union = "union",
    Use = "use",
    Where = "where",
    While = "while",
    Raw = "raw",
    Dyn = "dyn",
    Else = "else",
    Extern = "extern",
    Mut = "mut",
    Try = "try",
    Yield = "yield"
}
export declare const enum TSKindId {
    Identifier = 1,
    Semi = 2,
    MacroRulesBang = 3,
    EqGt = 4,
    Colon = 5,
    Dollar = 6,
    Lparen = 7,
    Rparen = 8,
    TokenRepetitionPatternToken1 = 9,
    Plus = 10,
    Star = 11,
    Qmark = 12,
    Expr = 14,
    Expr2021 = 15,
    Ident = 16,
    Item = 17,
    Literal = 19,
    Meta = 20,
    Pat = 21,
    PatParam = 22,
    Path = 23,
    Stmt = 24,
    Tt = 25,
    Ty = 26,
    Vis = 27,
    U8 = 28,
    I8 = 29,
    U16 = 30,
    I16 = 31,
    U32 = 32,
    I32 = 33,
    U64 = 34,
    I64 = 35,
    U128 = 36,
    I128 = 37,
    Isize = 38,
    Usize = 39,
    F32 = 40,
    F64 = 41,
    Bool = 42,
    Str = 43,
    Char = 44,
    Dash = 45,
    Slash = 46,
    Percent = 47,
    Caret = 48,
    Bang = 49,
    Amp = 50,
    Pipe = 51,
    AmpAmp = 52,
    PipePipe = 53,
    LtLt = 54,
    GtGt = 55,
    PlusEq = 56,
    DashEq = 57,
    StarEq = 58,
    SlashEq = 59,
    PercentEq = 60,
    CaretEq = 61,
    AmpEq = 62,
    PipeEq = 63,
    LtLtEq = 64,
    GtGtEq = 65,
    Eq = 66,
    EqEq = 67,
    BangEq = 68,
    Gt = 69,
    Lt = 70,
    GtEq = 71,
    LtEq = 72,
    At = 73,
    Anonymous = 74,
    Dot = 75,
    DotDot = 76,
    DotDotDot = 77,
    DotDotEq = 78,
    Comma = 79,
    ColonColon = 80,
    DashGt = 81,
    Pound = 82,
    Squote = 83,
    As = 84,
    Async = 85,
    Await = 86,
    Break = 87,
    Const = 88,
    Continue = 89,
    Default = 90,
    Enum = 91,
    Fn = 92,
    For = 93,
    Gen = 94,
    If = 95,
    Impl = 96,
    Let = 97,
    Loop = 98,
    Match = 99,
    Mod = 100,
    Pub = 101,
    Return = 102,
    Static = 103,
    Struct = 104,
    Trait = 105,
    Type = 106,
    Union = 107,
    Unsafe = 108,
    Use = 109,
    Where = 110,
    While = 111,
    Lbrack = 112,
    Rbrack = 113,
    Lbrace = 114,
    Rbrace = 115,
    Extern = 116,
    Else = 117,
    Lt2 = 118,
    Dyn = 119,
    MutableSpecifier = 120,
    Raw = 121,
    Yield = 122,
    In = 123,
    Try = 124,
    Ref = 125,
    IntegerLiteral = 126,
    StringLiteralToken1 = 127,
    Dquote = 128,
    CharLiteral = 129,
    EscapeSequence = 130,
    True = 131,
    False = 132,
    SlashSlash = 133,
    Bang2 = 134,
    Slash2 = 135,
    SlashStar = 136,
    StarSlash = 137,
    Shebang = 138,
    Self = 139,
    Super = 140,
    Crate = 141,
    Metavariable = 142,
    Move = 143,
    _LineCommentRegularDslashToken1 = 144,
    _LineCommentRegularDslashToken2 = 145,
    LineCommentContent = 146,
    StringContent = 147,
    _RawStringLiteralStart = 148,
    RawStringLiteralContent = 149,
    _RawStringLiteralEnd = 150,
    FloatLiteral = 151,
    OuterBlockDocCommentMarker = 152,
    InnerBlockDocCommentMarker = 153,
    _BlockCommentContent = 154,
    LineDocContent = 155,
    ErrorSentinel = 156,
    SourceFile = 157,
    Statement = 158,
    EmptyStatement = 159,
    ExpressionStatement = 160,
    MacroDefinition = 161,
    MacroRule = 162,
    TokenPattern = 163,
    TokenTreePattern = 164,
    TokenBindingPattern = 165,
    TokenRepetitionPattern = 166,
    FragmentSpecifier = 167,
    TokenTree = 168,
    TokenRepetition = 169,
    AttributeItem = 170,
    InnerAttributeItem = 171,
    Attribute = 172,
    ModItem = 173,
    ForeignModItem = 174,
    DeclarationList = 175,
    StructItem = 176,
    UnionItem = 177,
    EnumItem = 178,
    EnumVariantList = 179,
    EnumVariant = 180,
    FieldDeclarationList = 181,
    FieldDeclaration = 182,
    OrderedFieldDeclarationList = 183,
    ExternCrateDeclaration = 184,
    ConstItem = 185,
    StaticItem = 186,
    TypeItem = 187,
    FunctionItem = 188,
    FunctionSignatureItem = 189,
    FunctionModifiers = 190,
    WhereClause = 191,
    WherePredicate = 192,
    ImplItem = 193,
    TraitItem = 194,
    AssociatedType = 195,
    TraitBounds = 196,
    HigherRankedTraitBound = 197,
    RemovedTraitBound = 198,
    TypeParameters = 199,
    ConstParameter = 200,
    TypeParameter = 201,
    LifetimeParameter = 202,
    LetDeclaration = 203,
    UseDeclaration = 204,
    UseClause = 205,
    ScopedUseList = 206,
    UseList = 207,
    UseAsClause = 208,
    UseWildcard = 209,
    Parameters = 210,
    SelfParameter = 211,
    VariadicParameter = 212,
    Parameter = 213,
    ExternModifier = 214,
    VisibilityModifier = 215,
    _Type = 216,
    BracketedType = 217,
    QualifiedType = 218,
    Lifetime = 219,
    ArrayType = 220,
    ForLifetimes = 221,
    FunctionType = 222,
    TupleType = 223,
    UnitType = 224,
    GenericFunction = 225,
    GenericType = 226,
    GenericTypeWithTurbofish = 227,
    BoundedType = 228,
    UseBounds = 229,
    TypeArguments = 230,
    TypeBinding = 231,
    ReferenceType = 232,
    PointerType = 233,
    NeverType = 234,
    AbstractType = 235,
    DynamicType = 236,
    ExpressionExceptRange = 237,
    Expression = 238,
    MacroInvocation = 239,
    DelimTokenTree = 240,
    DelimTokens = 241,
    NonDelimToken = 242,
    ScopedIdentifier = 243,
    ScopedTypeIdentifierInExpressionPosition = 244,
    ScopedTypeIdentifier = 245,
    RangeExpression = 246,
    UnaryExpression = 247,
    TryExpression = 248,
    ReferenceExpression = 249,
    BinaryExpression = 250,
    AssignmentExpression = 251,
    CompoundAssignmentExpr = 252,
    TypeCastExpression = 253,
    ReturnExpression = 254,
    YieldExpression = 255,
    CallExpression = 256,
    Arguments = 257,
    ArrayExpression = 258,
    ParenthesizedExpression = 259,
    TupleExpression = 260,
    UnitExpression = 261,
    StructExpression = 262,
    FieldInitializerList = 263,
    ShorthandFieldInitializer = 264,
    FieldInitializer = 265,
    BaseFieldInitializer = 266,
    IfExpression = 267,
    LetCondition = 268,
    LetChain = 269,
    Condition = 270,
    ElseClause = 271,
    MatchExpression = 272,
    MatchBlock = 273,
    MatchArm = 274,
    LastMatchArm = 275,
    MatchPattern = 276,
    WhileExpression = 277,
    LoopExpression = 278,
    ForExpression = 279,
    ConstBlock = 280,
    ClosureExpression = 281,
    ClosureParameters = 282,
    Label = 283,
    BreakExpression = 284,
    ContinueExpression = 285,
    IndexExpression = 286,
    AwaitExpression = 287,
    FieldExpression = 288,
    UnsafeBlock = 289,
    AsyncBlock = 290,
    GenBlock = 291,
    TryBlock = 292,
    Block = 293,
    Pattern = 294,
    GenericPattern = 295,
    TuplePattern = 296,
    SlicePattern = 297,
    TupleStructPattern = 298,
    StructPattern = 299,
    FieldPattern = 300,
    RemainingFieldPattern = 301,
    MutPattern = 302,
    RangePattern = 303,
    RefPattern = 304,
    CapturedPattern = 305,
    ReferencePattern = 306,
    OrPattern = 307,
    Literal_308 = 308,
    LiteralPattern = 309,
    NegativeLiteral = 310,
    StringLiteral = 311,
    RawStringLiteral = 312,
    BooleanLiteral = 313,
    LineComment = 314,
    _LineDocCommentMarker = 315,
    InnerLineDocCommentMarker = 316,
    OuterLineDocCommentMarker = 317,
    BlockComment = 318,
    _BlockDocCommentMarker = 319,
    WildcardPattern = 320,
    ArrayExpressionSemi = 321,
    ArrayExpressionList = 322,
    ClosureExpressionBlock = 323,
    _ClosureExpressionExpr = 324,
    _FieldPatternShorthand = 325,
    FieldPatternNamed = 326,
    FunctionTypeTraitForm = 327,
    FunctionTypeFnForm = 328,
    _ImplItemBody = 329,
    ImplItemSemi = 330,
    _MacroDefinitionParen = 331,
    _MacroDefinitionBracket = 332,
    _MacroDefinitionBrace = 333,
    ModItemExternal = 334,
    _ModItemInline = 335,
    OrPatternBinary = 336,
    OrPatternPrefix = 337,
    RangeExpressionBinary = 338,
    RangeExpressionPostfix = 339,
    RangeExpressionPrefix = 340,
    _RangeExpressionBare = 341,
    RangePatternPrefix = 342,
    RangePatternLeftWithRight = 343,
    RangePatternLeftBare = 344,
    StructItemBrace = 345,
    StructItemTuple = 346,
    StructItemUnit = 347,
    _VisibilityModifierCrate = 348,
    VisibilityModifierPub = 349,
    VisibilityModifierInPath = 350,
    KwMoveMarker = 351,
    KwStaticMarker = 352,
    KwPub = 353,
    KwIn = 354,
    KwTurbofish = 355,
    KwUnsafeMarker = 356,
    KwNegative = 357,
    PointerTypeConst = 358,
    _PointerTypeMut = 359,
    KwOperator = 360,
    ReferenceExpressionRawConst = 361,
    ReferenceExpressionRawMut = 362,
    _KwReference = 363,
    _KwMutableSpecifier = 364,
    _ExpressionStatementWithSemi = 365,
    _ExpressionStatementBlockEnding = 366,
    ForeignModItemSemi = 367,
    _ForeignModItemBody = 368,
    MatchArmWithComma = 369,
    _MatchArmBlockEnding = 370,
    LineCommentRegularDslash = 371,
    LineCommentDoc = 372,
    _TokenTreePatternParen = 373,
    _TokenTreePatternBracket = 374,
    _TokenTreePatternBrace = 375,
    _TokenTreeParen = 376,
    _TokenTreeBracket = 377,
    _TokenTreeBrace = 378,
    _DelimTokenTreeParen = 379,
    _DelimTokenTreeBracket = 380,
    _DelimTokenTreeBrace = 381,
    SourceFileRepeat1 = 382,
    TokenRepetitionPatternRepeat1 = 383,
    TokenRepetitionRepeat1 = 384,
    _NonSpecialTokenRepeat1 = 385,
    DeclarationListRepeat1 = 386,
    EnumVariantListRepeat1 = 387,
    EnumVariantListRepeat2 = 388,
    FieldDeclarationListRepeat1 = 389,
    OrderedFieldDeclarationListRepeat1 = 390,
    FunctionModifiersRepeat1 = 391,
    WhereClauseRepeat1 = 392,
    TraitBoundsRepeat1 = 393,
    TypeParametersRepeat1 = 394,
    UseListRepeat1 = 395,
    ParametersRepeat1 = 396,
    ForLifetimesRepeat1 = 397,
    TupleTypeRepeat1 = 398,
    UseBoundsRepeat1 = 399,
    TypeArgumentsRepeat1 = 400,
    ArgumentsRepeat1 = 401,
    TupleExpressionRepeat1 = 402,
    FieldInitializerListRepeat1 = 403,
    MatchBlockRepeat1 = 404,
    MatchArmRepeat1 = 405,
    ClosureParametersRepeat1 = 406,
    TuplePatternRepeat1 = 407,
    SlicePatternRepeat1 = 408,
    StructPatternRepeat1 = 409,
    StringLiteralRepeat1 = 410,
    _ArrayExpressionListRepeat1 = 411,
    _MacroDefinitionParenRepeat1 = 412,
    _DelimTokenTreeParenRepeat1 = 413,
    FieldIdentifier = 414,
    _ShorthandFieldIdentifier = 416,
    TypeIdentifier = 417
}
export declare const KIND_NAMES: ReadonlyMap<number, string>;
export declare function kindIdFromName(kindName: string): TSKindId;
export declare const enum ConditionKind {
    UnaryExpression = "unary_expression",
    ReferenceExpression = "reference_expression",
    TryExpression = "try_expression",
    BinaryExpression = "binary_expression",
    AssignmentExpression = "assignment_expression",
    CompoundAssignmentExpr = "compound_assignment_expr",
    TypeCastExpression = "type_cast_expression",
    CallExpression = "call_expression",
    ReturnExpression = "return_expression",
    YieldExpression = "yield_expression",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    Self = "self",
    ScopedIdentifier = "scoped_identifier",
    GenericFunction = "generic_function",
    AwaitExpression = "await_expression",
    FieldExpression = "field_expression",
    ArrayExpression = "array_expression",
    TupleExpression = "tuple_expression",
    MacroInvocation = "macro_invocation",
    UnitExpression = "unit_expression",
    BreakExpression = "break_expression",
    ContinueExpression = "continue_expression",
    IndexExpression = "index_expression",
    Metavariable = "metavariable",
    ClosureExpression = "closure_expression",
    ParenthesizedExpression = "parenthesized_expression",
    StructExpression = "struct_expression",
    UnsafeBlock = "unsafe_block",
    AsyncBlock = "async_block",
    GenBlock = "gen_block",
    TryBlock = "try_block",
    Block = "block",
    IfExpression = "if_expression",
    MatchExpression = "match_expression",
    WhileExpression = "while_expression",
    LoopExpression = "loop_expression",
    ForExpression = "for_expression",
    ConstBlock = "const_block",
    RangeExpression = "range_expression",
    LetCondition = "let_condition",
    LetChain = "_let_chain"
}
export declare const enum DeclarationStatementKind {
    ConstItem = "const_item",
    MacroInvocation = "macro_invocation",
    MacroDefinition = "macro_definition",
    EmptyStatement = "empty_statement",
    AttributeItem = "attribute_item",
    InnerAttributeItem = "inner_attribute_item",
    ModItem = "mod_item",
    ForeignModItem = "foreign_mod_item",
    StructItem = "struct_item",
    UnionItem = "union_item",
    EnumItem = "enum_item",
    TypeItem = "type_item",
    FunctionItem = "function_item",
    FunctionSignatureItem = "function_signature_item",
    ImplItem = "impl_item",
    TraitItem = "trait_item",
    AssociatedType = "associated_type",
    LetDeclaration = "let_declaration",
    UseDeclaration = "use_declaration",
    ExternCrateDeclaration = "extern_crate_declaration",
    StaticItem = "static_item"
}
export declare const enum DelimTokensKind {
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    MutableSpecifier = "mutable_specifier",
    Self = "self",
    Super = "super",
    Crate = "crate",
    DelimTokenTree = "delim_token_tree"
}
export declare const enum ExpressionKind {
    UnaryExpression = "unary_expression",
    ReferenceExpression = "reference_expression",
    TryExpression = "try_expression",
    BinaryExpression = "binary_expression",
    AssignmentExpression = "assignment_expression",
    CompoundAssignmentExpr = "compound_assignment_expr",
    TypeCastExpression = "type_cast_expression",
    CallExpression = "call_expression",
    ReturnExpression = "return_expression",
    YieldExpression = "yield_expression",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    Self = "self",
    ScopedIdentifier = "scoped_identifier",
    GenericFunction = "generic_function",
    AwaitExpression = "await_expression",
    FieldExpression = "field_expression",
    ArrayExpression = "array_expression",
    TupleExpression = "tuple_expression",
    MacroInvocation = "macro_invocation",
    UnitExpression = "unit_expression",
    BreakExpression = "break_expression",
    ContinueExpression = "continue_expression",
    IndexExpression = "index_expression",
    Metavariable = "metavariable",
    ClosureExpression = "closure_expression",
    ParenthesizedExpression = "parenthesized_expression",
    StructExpression = "struct_expression",
    UnsafeBlock = "unsafe_block",
    AsyncBlock = "async_block",
    GenBlock = "gen_block",
    TryBlock = "try_block",
    Block = "block",
    IfExpression = "if_expression",
    MatchExpression = "match_expression",
    WhileExpression = "while_expression",
    LoopExpression = "loop_expression",
    ForExpression = "for_expression",
    ConstBlock = "const_block",
    RangeExpression = "range_expression"
}
export declare const enum ExpressionEndingWithBlockKind {
    UnsafeBlock = "unsafe_block",
    AsyncBlock = "async_block",
    GenBlock = "gen_block",
    TryBlock = "try_block",
    Block = "block",
    IfExpression = "if_expression",
    MatchExpression = "match_expression",
    WhileExpression = "while_expression",
    LoopExpression = "loop_expression",
    ForExpression = "for_expression",
    ConstBlock = "const_block"
}
export declare const enum ExpressionExceptRangeKind {
    UnaryExpression = "unary_expression",
    ReferenceExpression = "reference_expression",
    TryExpression = "try_expression",
    BinaryExpression = "binary_expression",
    AssignmentExpression = "assignment_expression",
    CompoundAssignmentExpr = "compound_assignment_expr",
    TypeCastExpression = "type_cast_expression",
    CallExpression = "call_expression",
    ReturnExpression = "return_expression",
    YieldExpression = "yield_expression",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    Self = "self",
    ScopedIdentifier = "scoped_identifier",
    GenericFunction = "generic_function",
    AwaitExpression = "await_expression",
    FieldExpression = "field_expression",
    ArrayExpression = "array_expression",
    TupleExpression = "tuple_expression",
    MacroInvocation = "macro_invocation",
    UnitExpression = "unit_expression",
    BreakExpression = "break_expression",
    ContinueExpression = "continue_expression",
    IndexExpression = "index_expression",
    Metavariable = "metavariable",
    ClosureExpression = "closure_expression",
    ParenthesizedExpression = "parenthesized_expression",
    StructExpression = "struct_expression",
    UnsafeBlock = "unsafe_block",
    AsyncBlock = "async_block",
    GenBlock = "gen_block",
    TryBlock = "try_block",
    Block = "block",
    IfExpression = "if_expression",
    MatchExpression = "match_expression",
    WhileExpression = "while_expression",
    LoopExpression = "loop_expression",
    ForExpression = "for_expression",
    ConstBlock = "const_block"
}
export declare const enum LiteralKind {
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal"
}
export declare const enum LiteralPatternKind {
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    NegativeLiteral = "negative_literal"
}
export declare const enum NonDelimTokenKind {
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    MutableSpecifier = "mutable_specifier",
    Self = "self",
    Super = "super",
    Crate = "crate"
}
export declare const enum PathKind {
    Self = "self",
    Identifier = "identifier",
    Metavariable = "metavariable",
    Super = "super",
    Crate = "crate",
    ScopedIdentifier = "scoped_identifier"
}
export declare const enum PatternKind {
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    NegativeLiteral = "negative_literal",
    Identifier = "identifier",
    ScopedIdentifier = "scoped_identifier",
    GenericPattern = "generic_pattern",
    TuplePattern = "tuple_pattern",
    TupleStructPattern = "tuple_struct_pattern",
    StructPattern = "struct_pattern",
    RefPattern = "ref_pattern",
    SlicePattern = "slice_pattern",
    CapturedPattern = "captured_pattern",
    ReferencePattern = "reference_pattern",
    RemainingFieldPattern = "remaining_field_pattern",
    MutPattern = "mut_pattern",
    RangePattern = "range_pattern",
    OrPattern = "or_pattern",
    ConstBlock = "const_block",
    MacroInvocation = "macro_invocation",
    WildcardPattern = "_wildcard_pattern"
}
export declare const enum StatementKind {
    ExpressionStatement = "expression_statement",
    ConstItem = "const_item",
    MacroInvocation = "macro_invocation",
    MacroDefinition = "macro_definition",
    EmptyStatement = "empty_statement",
    AttributeItem = "attribute_item",
    InnerAttributeItem = "inner_attribute_item",
    ModItem = "mod_item",
    ForeignModItem = "foreign_mod_item",
    StructItem = "struct_item",
    UnionItem = "union_item",
    EnumItem = "enum_item",
    TypeItem = "type_item",
    FunctionItem = "function_item",
    FunctionSignatureItem = "function_signature_item",
    ImplItem = "impl_item",
    TraitItem = "trait_item",
    AssociatedType = "associated_type",
    LetDeclaration = "let_declaration",
    UseDeclaration = "use_declaration",
    ExternCrateDeclaration = "extern_crate_declaration",
    StaticItem = "static_item"
}
export declare const enum TokenPatternKind {
    TokenTreePattern = "token_tree_pattern",
    TokenRepetitionPattern = "token_repetition_pattern",
    TokenBindingPattern = "token_binding_pattern",
    Metavariable = "metavariable",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    MutableSpecifier = "mutable_specifier",
    Self = "self",
    Super = "super",
    Crate = "crate"
}
export declare const enum TokensKind {
    TokenTree = "token_tree",
    TokenRepetition = "token_repetition",
    Metavariable = "metavariable",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    MutableSpecifier = "mutable_specifier",
    Self = "self",
    Super = "super",
    Crate = "crate"
}
export declare const enum TypeKind {
    AbstractType = "abstract_type",
    ReferenceType = "reference_type",
    Metavariable = "metavariable",
    PointerType = "pointer_type",
    GenericType = "generic_type",
    ScopedTypeIdentifier = "scoped_type_identifier",
    TupleType = "tuple_type",
    UnitType = "unit_type",
    ArrayType = "array_type",
    FunctionType = "function_type",
    Identifier = "identifier",
    MacroInvocation = "macro_invocation",
    NeverType = "never_type",
    DynamicType = "dynamic_type",
    BoundedType = "bounded_type",
    RemovedTraitBound = "removed_trait_bound",
    PrimitiveType = "_primitive_type"
}
export declare const enum UseClauseKind {
    Self = "self",
    Identifier = "identifier",
    Metavariable = "metavariable",
    Super = "super",
    Crate = "crate",
    ScopedIdentifier = "scoped_identifier",
    UseAsClause = "use_as_clause",
    UseList = "use_list",
    ScopedUseList = "scoped_use_list",
    UseWildcard = "use_wildcard"
}
export interface ArrayExpressionList {
    readonly $type: TSKindId.ArrayExpressionList;
    readonly _attributes: readonly (AttributeItem)[];
    readonly _elements: readonly (Expression)[];
    attributes(): readonly (AttributeItem)[];
    elements(): readonly (Expression)[];
    readonly $children: readonly (AttributeItem)[];
}
export interface ArrayExpressionSemi {
    readonly $type: TSKindId.ArrayExpressionSemi;
    readonly _attributes: readonly (AttributeItem)[];
    readonly _elements: Expression;
    readonly _length: Expression;
    attributes(): readonly (AttributeItem)[];
    elements(): Expression;
    length(): Expression;
}
export interface ClosureExpressionBlock {
    readonly $type: TSKindId.ClosureExpressionBlock;
    readonly _return_type?: _Type;
    readonly _body: Block;
    returnType(): _Type | undefined;
    body(): Block;
}
export interface _ClosureExpressionExpr {
    readonly $type: TSKindId._ClosureExpressionExpr;
    readonly _body: Expression | "_";
    body(): Expression | "_";
}
export interface _DelimTokenTreeBrace {
    readonly $type: TSKindId._DelimTokenTreeBrace;
    readonly $children: readonly (DelimTokens)[];
}
export interface _DelimTokenTreeBracket {
    readonly $type: TSKindId._DelimTokenTreeBracket;
    readonly $children: readonly (DelimTokens)[];
}
export interface _DelimTokenTreeParen {
    readonly $type: TSKindId._DelimTokenTreeParen;
    readonly $children: readonly (DelimTokens)[];
}
export interface _ExpressionStatementBlockEnding {
    readonly $type: TSKindId._ExpressionStatementBlockEnding;
    readonly $children: readonly [ExpressionEndingWithBlock];
}
export interface _ExpressionStatementWithSemi {
    readonly $type: TSKindId._ExpressionStatementWithSemi;
    readonly $children: readonly [Expression];
}
export interface FieldIdentifier {
    readonly $type: TSKindId.FieldIdentifier;
    readonly $children: readonly [Identifier];
}
export interface FieldPatternNamed {
    readonly $type: TSKindId.FieldPatternNamed;
    readonly _name: FieldIdentifier;
    readonly _pattern: Pattern;
    name(): FieldIdentifier;
    pattern(): Pattern;
}
export interface _FieldPatternShorthand {
    readonly $type: TSKindId._FieldPatternShorthand;
    readonly _name: Identifier;
    name(): Identifier;
}
export interface _ForeignModItemBody {
    readonly $type: TSKindId._ForeignModItemBody;
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface FunctionTypeFnForm {
    readonly $type: TSKindId.FunctionTypeFnForm;
    readonly $children: readonly [FunctionModifiers];
}
export interface FunctionTypeTraitForm {
    readonly $type: TSKindId.FunctionTypeTraitForm;
    readonly _trait: TypeIdentifier | ScopedTypeIdentifier;
    trait(): TypeIdentifier | ScopedTypeIdentifier;
}
export interface _ImplItemBody {
    readonly $type: TSKindId._ImplItemBody;
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface LetChain {
    readonly $type: TSKindId.LetChain;
    readonly $children: readonly [LetChain | LetCondition | Expression];
}
export interface LineCommentDoc {
    readonly $type: TSKindId.LineCommentDoc;
    readonly _doc: LineDocContent;
    doc(): LineDocContent;
    readonly $children: readonly ["/" | "!"];
}
export interface _MacroDefinitionBrace {
    readonly $type: TSKindId._MacroDefinitionBrace;
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface _MacroDefinitionBracket {
    readonly $type: TSKindId._MacroDefinitionBracket;
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface _MacroDefinitionParen {
    readonly $type: TSKindId._MacroDefinitionParen;
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface _MatchArmBlockEnding {
    readonly $type: TSKindId._MatchArmBlockEnding;
    readonly _value: ExpressionEndingWithBlock;
    value(): ExpressionEndingWithBlock;
}
export interface MatchArmWithComma {
    readonly $type: TSKindId.MatchArmWithComma;
    readonly _value: Expression;
    value(): Expression;
}
export interface _ModItemInline {
    readonly $type: TSKindId._ModItemInline;
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface NonSpecialToken {
    readonly $type: "_non_special_token";
    readonly $children: NonEmptyArray<Literal | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType | "+" | "-" | "*" | "/" | "%" | "^" | "!" | "&" | "|" | "&&" | "||" | "<<" | ">>" | "+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | "<<=" | ">>=" | "=" | "==" | "!=" | ">" | "<" | ">=" | "<=" | "@" | "_" | "." | ".." | "..." | "..=" | "," | ";" | ":" | "::" | "->" | "=>" | "#" | "?" | "'" | "as" | "async" | "await" | "break" | "const" | "continue" | "default" | "enum" | "fn" | "for" | "gen" | "if" | "impl" | "let" | "loop" | "match" | "mod" | "pub" | "return" | "static" | "struct" | "trait" | "type" | "union" | "unsafe" | "use" | "where" | "while">;
}
export interface OrPatternBinary {
    readonly $type: TSKindId.OrPatternBinary;
    readonly _left: Pattern;
    readonly _right: Pattern;
    left(): Pattern;
    right(): Pattern;
}
export interface OrPatternPrefix {
    readonly $type: TSKindId.OrPatternPrefix;
    readonly _right: Pattern;
    right(): Pattern;
}
export interface _PointerTypeMut {
    readonly $type: TSKindId._PointerTypeMut;
    readonly $children: readonly [MutableSpecifier];
}
export interface _RangeExpressionBare {
    readonly $type: TSKindId._RangeExpressionBare;
    readonly _operator: AutoStamp<Operator>;
    operator(): AutoStamp<Operator>;
}
export interface RangeExpressionBinary {
    readonly $type: TSKindId.RangeExpressionBinary;
    readonly _start: Expression;
    readonly _operator: RangeExpressionBinaryOperator;
    readonly _end: Expression;
    start(): Expression;
    operator(): RangeExpressionBinaryOperator;
    end(): Expression;
}
export interface RangeExpressionPostfix {
    readonly $type: TSKindId.RangeExpressionPostfix;
    readonly _start: Expression;
    readonly _operator: AutoStamp<Operator>;
    start(): Expression;
    operator(): AutoStamp<Operator>;
}
export interface RangeExpressionPrefix {
    readonly $type: TSKindId.RangeExpressionPrefix;
    readonly _operator: AutoStamp<Operator>;
    readonly _end: Expression;
    operator(): AutoStamp<Operator>;
    end(): Expression;
}
export interface RangePatternLeftWithRight {
    readonly $type: TSKindId.RangePatternLeftWithRight;
    readonly _right: LiteralPattern | Path;
    right(): LiteralPattern | Path;
}
export interface RangePatternPrefix {
    readonly $type: TSKindId.RangePatternPrefix;
    readonly _right: LiteralPattern | Path;
    right(): LiteralPattern | Path;
}
export interface ReferenceExpressionRawMut {
    readonly $type: TSKindId.ReferenceExpressionRawMut;
    readonly $children: readonly [MutableSpecifier];
}
export interface ReservedIdentifier {
    readonly $type: "_reserved_identifier";
    readonly $children: readonly [Identifier];
}
export interface StructItemBrace {
    readonly $type: TSKindId.StructItemBrace;
    readonly _body: FieldDeclarationList;
    body(): FieldDeclarationList;
    readonly $children: readonly [WhereClause];
}
export interface StructItemTuple {
    readonly $type: TSKindId.StructItemTuple;
    readonly _body: OrderedFieldDeclarationList;
    body(): OrderedFieldDeclarationList;
    readonly $children: readonly [WhereClause];
}
export interface _TokenTreeBrace {
    readonly $type: TSKindId._TokenTreeBrace;
    readonly $children: readonly (Tokens)[];
}
export interface _TokenTreeBracket {
    readonly $type: TSKindId._TokenTreeBracket;
    readonly $children: readonly (Tokens)[];
}
export interface _TokenTreeParen {
    readonly $type: TSKindId._TokenTreeParen;
    readonly $children: readonly (Tokens)[];
}
export interface _TokenTreePatternBrace {
    readonly $type: TSKindId._TokenTreePatternBrace;
    readonly $children: readonly (TokenPattern)[];
}
export interface _TokenTreePatternBracket {
    readonly $type: TSKindId._TokenTreePatternBracket;
    readonly $children: readonly (TokenPattern)[];
}
export interface _TokenTreePatternParen {
    readonly $type: TSKindId._TokenTreePatternParen;
    readonly $children: readonly (TokenPattern)[];
}
export interface TypeIdentifier {
    readonly $type: TSKindId.TypeIdentifier;
    readonly $children: readonly [Identifier];
}
export interface _VisibilityModifierCrate {
    readonly $type: TSKindId._VisibilityModifierCrate;
    readonly $children: readonly [Crate];
}
export interface VisibilityModifierInPath {
    readonly $type: TSKindId.VisibilityModifierInPath;
    readonly _in: AutoStamp<VisibilityModifierInPathIn>;
    in(): AutoStamp<VisibilityModifierInPathIn>;
    readonly $children: readonly [Path];
}
export interface VisibilityModifierPub {
    readonly $type: TSKindId.VisibilityModifierPub;
    readonly _pub: AutoStamp<VisibilityModifierPubPub>;
    pub(): AutoStamp<VisibilityModifierPubPub>;
    readonly $children: readonly [Self | Super | Crate | VisibilityModifierInPath];
}
export interface AbstractType {
    readonly $type: TSKindId.AbstractType;
    readonly _type_parameters?: TypeParameters;
    readonly _trait: TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType;
    typeParameters(): TypeParameters | undefined;
    trait(): TypeIdentifier | ScopedTypeIdentifier | RemovedTraitBound | GenericType | FunctionType | TupleType | BoundedType;
}
export interface Arguments {
    readonly $type: TSKindId.Arguments;
    readonly _attributes: readonly (AttributeItem | Expression)[];
    attributes(): readonly (AttributeItem | Expression)[];
}
export interface ArrayExpressionUFormSemi {
    readonly $type: TSKindId.ArrayExpression;
    readonly $variant: 'semi';
    readonly $children: readonly [ArrayExpressionSemi];
}
export interface ArrayExpressionUFormList {
    readonly $type: TSKindId.ArrayExpression;
    readonly $variant: 'list';
    readonly $children: readonly [ArrayExpressionList];
}
export type ArrayExpression = ArrayExpressionUFormSemi | ArrayExpressionUFormList;
export interface ArrayType {
    readonly $type: TSKindId.ArrayType;
    readonly _element: _Type;
    readonly _length?: Expression;
    element(): _Type;
    length(): Expression | undefined;
}
export interface AssignmentExpression {
    readonly $type: TSKindId.AssignmentExpression;
    readonly _left: Expression;
    readonly _right: Expression;
    left(): Expression;
    right(): Expression;
}
export interface AssociatedType {
    readonly $type: TSKindId.AssociatedType;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _bounds?: TraitBounds;
    readonly _where_clause?: WhereClause;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    bounds(): TraitBounds | undefined;
    whereClause(): WhereClause | undefined;
}
export interface AsyncBlock {
    readonly $type: TSKindId.AsyncBlock;
    readonly _move_marker?: BooleanKeyword<MoveMarker>;
    readonly _block: Block;
    moveMarker(): BooleanKeyword<MoveMarker> | undefined;
    block(): Block;
}
export interface Attribute {
    readonly $type: TSKindId.Attribute;
    readonly _path: Path;
    path(): Path;
    readonly $children: readonly [Expression | DelimTokenTree];
}
export interface AttributeItem {
    readonly $type: TSKindId.AttributeItem;
    readonly _attribute: Attribute;
    attribute(): Attribute;
}
export interface AwaitExpression {
    readonly $type: TSKindId.AwaitExpression;
    readonly $children: readonly [Expression];
}
export interface BaseFieldInitializer {
    readonly $type: TSKindId.BaseFieldInitializer;
    readonly $children: readonly [Expression];
}
export interface BinaryExpression {
    readonly $type: TSKindId.BinaryExpression;
    readonly _left: Expression;
    readonly _operator: AutoStamp<BinaryExpressionOperator>;
    readonly _right: Expression;
    left(): Expression;
    operator(): AutoStamp<BinaryExpressionOperator>;
    right(): Expression;
}
export interface Block {
    readonly $type: TSKindId.Block;
    readonly _label?: Label;
    readonly _trailing_expression?: Expression;
    label(): Label | undefined;
    trailingExpression(): Expression | undefined;
    readonly $children: readonly (Statement)[];
}
export interface BlockComment {
    readonly $type: TSKindId.BlockComment;
    readonly _doc?: BlockCommentContent;
    doc(): BlockCommentContent | undefined;
    readonly $children: readonly [OuterBlockDocCommentMarker | InnerBlockDocCommentMarker];
}
export interface BoundedType {
    readonly $type: TSKindId.BoundedType;
    readonly _left: Lifetime | _Type | UseBounds;
    readonly _right: Lifetime | _Type | UseBounds;
    left(): Lifetime | _Type | UseBounds;
    right(): Lifetime | _Type | UseBounds;
}
export interface BracketedType {
    readonly $type: TSKindId.BracketedType;
    readonly $children: readonly [_Type | QualifiedType];
}
export interface BreakExpression {
    readonly $type: TSKindId.BreakExpression;
    readonly _label?: Label;
    label(): Label | undefined;
    readonly $children: readonly [Expression];
}
export interface CallExpression {
    readonly $type: TSKindId.CallExpression;
    readonly _function: ExpressionExceptRange;
    readonly _arguments: Arguments;
    function(): ExpressionExceptRange;
    arguments(): Arguments;
}
export interface CapturedPattern {
    readonly $type: TSKindId.CapturedPattern;
    readonly _identifier: Identifier;
    identifier(): Identifier;
    readonly $children: readonly [Pattern];
}
export interface ClosureExpressionExpr {
    readonly $type: "closure_expression_expr";
    readonly _body: Expression | "_";
    body(): Expression | "_";
}
export interface ClosureExpressionUFormBlock {
    readonly $type: TSKindId.ClosureExpression;
    readonly $variant: 'block';
    readonly _static_marker?: BooleanKeyword<ClosureExpressionStaticMarker>;
    readonly _async_marker?: BooleanKeyword<ClosureExpressionAsyncMarker>;
    readonly _move_marker?: BooleanKeyword<MoveMarker>;
    readonly _parameters: ClosureParameters;
    staticMarker(): BooleanKeyword<ClosureExpressionStaticMarker> | undefined;
    asyncMarker(): BooleanKeyword<ClosureExpressionAsyncMarker> | undefined;
    moveMarker(): BooleanKeyword<MoveMarker> | undefined;
    parameters(): ClosureParameters;
    readonly $children: readonly [ClosureExpressionBlock];
}
export interface ClosureExpressionUFormExpr {
    readonly $type: TSKindId.ClosureExpression;
    readonly $variant: 'expr';
    readonly _static_marker?: BooleanKeyword<ClosureExpressionStaticMarker>;
    readonly _async_marker?: BooleanKeyword<ClosureExpressionAsyncMarker>;
    readonly _move_marker?: BooleanKeyword<MoveMarker>;
    readonly _parameters: ClosureParameters;
    staticMarker(): BooleanKeyword<ClosureExpressionStaticMarker> | undefined;
    asyncMarker(): BooleanKeyword<ClosureExpressionAsyncMarker> | undefined;
    moveMarker(): BooleanKeyword<MoveMarker> | undefined;
    parameters(): ClosureParameters;
    readonly $children: readonly [_ClosureExpressionExpr];
}
export type ClosureExpression = ClosureExpressionUFormBlock | ClosureExpressionUFormExpr;
export interface ClosureParameters {
    readonly $type: TSKindId.ClosureParameters;
    readonly $children: readonly (Pattern | Parameter)[];
}
export interface Comment {
    readonly $type: "comment";
    readonly $children: readonly [LineComment | BlockComment];
}
export interface CompoundAssignmentExpr {
    readonly $type: TSKindId.CompoundAssignmentExpr;
    readonly _left: Expression;
    readonly _operator: CompoundAssignmentExprOperator;
    readonly _right: Expression;
    left(): Expression;
    operator(): CompoundAssignmentExprOperator;
    right(): Expression;
}
export interface ConstBlock {
    readonly $type: TSKindId.ConstBlock;
    readonly _body: Block;
    body(): Block;
}
export interface ConstItem {
    readonly $type: TSKindId.ConstItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: Identifier;
    readonly _type: _Type;
    readonly _value?: Expression;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
    typeField(): _Type;
    value(): Expression | undefined;
}
export interface ConstParameter {
    readonly $type: TSKindId.ConstParameter;
    readonly _name: Identifier;
    readonly _type: _Type;
    readonly _value?: Block | Identifier | Literal | NegativeLiteral;
    name(): Identifier;
    typeField(): _Type;
    value(): Block | Identifier | Literal | NegativeLiteral | undefined;
}
export interface ContinueExpression {
    readonly $type: TSKindId.ContinueExpression;
    readonly _label?: Label;
    label(): Label | undefined;
}
export interface DeclarationList {
    readonly $type: TSKindId.DeclarationList;
    readonly $children: readonly (DeclarationStatement)[];
}
export interface DelimTokenTreeParen {
    readonly $type: "delim_token_tree_paren";
    readonly $children: readonly (DelimTokens)[];
}
export interface DelimTokenTreeBracket {
    readonly $type: "delim_token_tree_bracket";
    readonly $children: readonly (DelimTokens)[];
}
export interface DelimTokenTreeBrace {
    readonly $type: "delim_token_tree_brace";
    readonly $children: readonly (DelimTokens)[];
}
export interface DelimTokenTreeUFormParen {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'paren';
    readonly $children: readonly [_DelimTokenTreeParen];
}
export interface DelimTokenTreeUFormBracket {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'bracket';
    readonly $children: readonly [_DelimTokenTreeBracket];
}
export interface DelimTokenTreeUFormBrace {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'brace';
    readonly $children: readonly [_DelimTokenTreeBrace];
}
export type DelimTokenTree = DelimTokenTreeUFormParen | DelimTokenTreeUFormBracket | DelimTokenTreeUFormBrace;
export interface DynamicType {
    readonly $type: TSKindId.DynamicType;
    readonly _trait: HigherRankedTraitBound | TypeIdentifier | ScopedTypeIdentifier | GenericType | FunctionType | TupleType;
    trait(): HigherRankedTraitBound | TypeIdentifier | ScopedTypeIdentifier | GenericType | FunctionType | TupleType;
}
export interface ElseClause {
    readonly $type: TSKindId.ElseClause;
    readonly $children: readonly [Block | IfExpression];
}
export interface EnumItem {
    readonly $type: TSKindId.EnumItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _where_clause?: WhereClause;
    readonly _body: EnumVariantList;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    whereClause(): WhereClause | undefined;
    body(): EnumVariantList;
}
export interface EnumVariant {
    readonly $type: TSKindId.EnumVariant;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: Identifier;
    readonly _body?: FieldDeclarationList | OrderedFieldDeclarationList;
    readonly _value?: Expression;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
    body(): FieldDeclarationList | OrderedFieldDeclarationList | undefined;
    value(): Expression | undefined;
}
export interface EnumVariantList {
    readonly $type: TSKindId.EnumVariantList;
    readonly $children: readonly (AttributeItem | EnumVariant)[];
}
export interface ExpressionStatementWithSemi {
    readonly $type: "expression_statement_with_semi";
    readonly $children: readonly [Expression];
}
export interface ExpressionStatementBlockEnding {
    readonly $type: "expression_statement_block_ending";
    readonly $children: readonly [ExpressionEndingWithBlock];
}
export interface ExpressionStatementUFormWithSemi {
    readonly $type: TSKindId.ExpressionStatement;
    readonly $variant: 'with_semi';
    readonly $children: readonly [_ExpressionStatementWithSemi];
}
export interface ExpressionStatementUFormBlockEnding {
    readonly $type: TSKindId.ExpressionStatement;
    readonly $variant: 'block_ending';
    readonly $children: readonly [_ExpressionStatementBlockEnding];
}
export type ExpressionStatement = ExpressionStatementUFormWithSemi | ExpressionStatementUFormBlockEnding;
export interface ExternCrateDeclaration {
    readonly $type: TSKindId.ExternCrateDeclaration;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _crate: AutoStamp<_Crate>;
    readonly _name: Identifier;
    readonly _alias?: Identifier;
    visibilityModifier(): VisibilityModifier | undefined;
    crate(): AutoStamp<_Crate>;
    name(): Identifier;
    alias(): Identifier | undefined;
}
export interface ExternModifier {
    readonly $type: TSKindId.ExternModifier;
    readonly _string_literal?: StringLiteral;
    stringLiteral(): StringLiteral | undefined;
}
export interface FieldDeclaration {
    readonly $type: TSKindId.FieldDeclaration;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: FieldIdentifier;
    readonly _type: _Type;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): FieldIdentifier;
    typeField(): _Type;
}
export interface FieldDeclarationList {
    readonly $type: TSKindId.FieldDeclarationList;
    readonly $children: readonly (AttributeItem | FieldDeclaration)[];
}
export interface FieldExpression {
    readonly $type: TSKindId.FieldExpression;
    readonly _value: Expression;
    readonly _field: FieldIdentifier | IntegerLiteral;
    value(): Expression;
    field(): FieldIdentifier | IntegerLiteral;
}
export interface FieldInitializer {
    readonly $type: TSKindId.FieldInitializer;
    readonly _field: FieldIdentifier | IntegerLiteral;
    readonly _value: Expression;
    field(): FieldIdentifier | IntegerLiteral;
    value(): Expression;
    readonly $children: readonly (AttributeItem)[];
}
export interface FieldInitializerList {
    readonly $type: TSKindId.FieldInitializerList;
    readonly $children: readonly (ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer)[];
}
export interface FieldPatternShorthand {
    readonly $type: "field_pattern_shorthand";
    readonly _name: Identifier;
    name(): Identifier;
}
export interface FieldPatternUFormShorthand {
    readonly $type: TSKindId.FieldPattern;
    readonly $variant: 'shorthand';
    readonly _ref_marker?: BooleanKeyword<RefMarker>;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    refMarker(): BooleanKeyword<RefMarker> | undefined;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    readonly $children: readonly [_FieldPatternShorthand];
}
export interface FieldPatternUFormNamed {
    readonly $type: TSKindId.FieldPattern;
    readonly $variant: 'named';
    readonly _ref_marker?: BooleanKeyword<RefMarker>;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    refMarker(): BooleanKeyword<RefMarker> | undefined;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    readonly $children: readonly [FieldPatternNamed];
}
export type FieldPattern = FieldPatternUFormShorthand | FieldPatternUFormNamed;
export interface ForExpression {
    readonly $type: TSKindId.ForExpression;
    readonly _label?: Label;
    readonly _pattern: Pattern;
    readonly _value: Expression;
    readonly _body: Block;
    label(): Label | undefined;
    pattern(): Pattern;
    value(): Expression;
    body(): Block;
}
export interface ForLifetimes {
    readonly $type: TSKindId.ForLifetimes;
    readonly $children: NonEmptyArray<Lifetime>;
}
export interface ForeignModItemBody {
    readonly $type: "foreign_mod_item_body";
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface ForeignModItemUFormSemi {
    readonly $type: TSKindId.ForeignModItem;
    readonly $variant: 'semi';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _extern_modifier: ExternModifier;
    visibilityModifier(): VisibilityModifier | undefined;
    externModifier(): ExternModifier;
}
export interface ForeignModItemUFormBody {
    readonly $type: TSKindId.ForeignModItem;
    readonly $variant: 'body';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _extern_modifier: ExternModifier;
    visibilityModifier(): VisibilityModifier | undefined;
    externModifier(): ExternModifier;
    readonly $children: readonly [_ForeignModItemBody];
}
export type ForeignModItem = ForeignModItemUFormSemi | ForeignModItemUFormBody;
export interface FunctionItem {
    readonly $type: TSKindId.FunctionItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _function_modifiers?: FunctionModifiers;
    readonly _name: Identifier | Metavariable;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: Parameters;
    readonly _return_type?: _Type;
    readonly _where_clause?: WhereClause;
    readonly _body: Block;
    visibilityModifier(): VisibilityModifier | undefined;
    functionModifiers(): FunctionModifiers | undefined;
    name(): Identifier | Metavariable;
    typeParameters(): TypeParameters | undefined;
    parameters(): Parameters;
    returnType(): _Type | undefined;
    whereClause(): WhereClause | undefined;
    body(): Block;
}
export interface FunctionModifiers {
    readonly $type: TSKindId.FunctionModifiers;
    readonly _modifier: NonEmptyArray<"async" | "default" | "const" | "unsafe" | ExternModifier>;
    modifier(): NonEmptyArray<"async" | "default" | "const" | "unsafe" | ExternModifier>;
}
export interface FunctionSignatureItem {
    readonly $type: TSKindId.FunctionSignatureItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _function_modifiers?: FunctionModifiers;
    readonly _name: Identifier | Metavariable;
    readonly _type_parameters?: TypeParameters;
    readonly _parameters: Parameters;
    readonly _return_type?: _Type;
    readonly _where_clause?: WhereClause;
    visibilityModifier(): VisibilityModifier | undefined;
    functionModifiers(): FunctionModifiers | undefined;
    name(): Identifier | Metavariable;
    typeParameters(): TypeParameters | undefined;
    parameters(): Parameters;
    returnType(): _Type | undefined;
    whereClause(): WhereClause | undefined;
}
export interface FunctionType {
    readonly $type: TSKindId.FunctionType;
    readonly _for_lifetimes?: ForLifetimes;
    readonly _parameters: Parameters;
    readonly _return_type?: _Type;
    forLifetimes(): ForLifetimes | undefined;
    parameters(): Parameters;
    returnType(): _Type | undefined;
    readonly $children: readonly [FunctionTypeTraitForm | FunctionTypeFnForm];
}
export interface GenBlock {
    readonly $type: TSKindId.GenBlock;
    readonly _move_marker?: BooleanKeyword<MoveMarker>;
    readonly _block: Block;
    moveMarker(): BooleanKeyword<MoveMarker> | undefined;
    block(): Block;
}
export interface GenericFunction {
    readonly $type: TSKindId.GenericFunction;
    readonly _function: Identifier | ScopedIdentifier | FieldExpression;
    readonly _type_arguments: TypeArguments;
    function(): Identifier | ScopedIdentifier | FieldExpression;
    typeArguments(): TypeArguments;
}
export interface GenericPattern {
    readonly $type: TSKindId.GenericPattern;
    readonly _type_arguments: TypeArguments;
    typeArguments(): TypeArguments;
    readonly $children: readonly [Identifier | ScopedIdentifier];
}
export interface GenericType {
    readonly $type: TSKindId.GenericType;
    readonly _type: TypeIdentifier | ReservedIdentifier | ScopedTypeIdentifier;
    readonly _type_arguments: TypeArguments;
    typeField(): TypeIdentifier | ReservedIdentifier | ScopedTypeIdentifier;
    typeArguments(): TypeArguments;
}
export interface GenericTypeWithTurbofish {
    readonly $type: TSKindId.GenericTypeWithTurbofish;
    readonly _type: TypeIdentifier | ScopedIdentifier;
    readonly _turbofish: AutoStamp<GenericTypeWithTurbofishTurbofish>;
    readonly _type_arguments: TypeArguments;
    typeField(): TypeIdentifier | ScopedIdentifier;
    turbofish(): AutoStamp<GenericTypeWithTurbofishTurbofish>;
    typeArguments(): TypeArguments;
}
export interface HigherRankedTraitBound {
    readonly $type: TSKindId.HigherRankedTraitBound;
    readonly _type_parameters: TypeParameters;
    readonly _type: _Type;
    typeParameters(): TypeParameters;
    typeField(): _Type;
}
export interface IfExpression {
    readonly $type: TSKindId.IfExpression;
    readonly _condition: Condition;
    readonly _consequence: Block;
    readonly _alternative?: ElseClause;
    condition(): Condition;
    consequence(): Block;
    alternative(): ElseClause | undefined;
}
export interface ImplItemBody {
    readonly $type: "impl_item_body";
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface ImplItemUFormBody {
    readonly $type: TSKindId.ImplItem;
    readonly $variant: 'body';
    readonly _unsafe_marker?: BooleanKeyword<UnsafeMarker>;
    readonly _type_parameters?: TypeParameters;
    readonly _negative?: BooleanKeyword<ImplItemNegative>;
    readonly _trait?: TypeIdentifier | ScopedTypeIdentifier | GenericType;
    readonly _type: _Type;
    readonly _where_clause?: WhereClause;
    unsafeMarker(): BooleanKeyword<UnsafeMarker> | undefined;
    typeParameters(): TypeParameters | undefined;
    negative(): BooleanKeyword<ImplItemNegative> | undefined;
    trait(): TypeIdentifier | ScopedTypeIdentifier | GenericType | undefined;
    typeField(): _Type;
    whereClause(): WhereClause | undefined;
    readonly $children: readonly [_ImplItemBody];
}
export interface ImplItemUFormSemi {
    readonly $type: TSKindId.ImplItem;
    readonly $variant: 'semi';
    readonly _unsafe_marker?: BooleanKeyword<UnsafeMarker>;
    readonly _type_parameters?: TypeParameters;
    readonly _negative?: BooleanKeyword<ImplItemNegative>;
    readonly _trait?: TypeIdentifier | ScopedTypeIdentifier | GenericType;
    readonly _type: _Type;
    readonly _where_clause?: WhereClause;
    unsafeMarker(): BooleanKeyword<UnsafeMarker> | undefined;
    typeParameters(): TypeParameters | undefined;
    negative(): BooleanKeyword<ImplItemNegative> | undefined;
    trait(): TypeIdentifier | ScopedTypeIdentifier | GenericType | undefined;
    typeField(): _Type;
    whereClause(): WhereClause | undefined;
}
export type ImplItem = ImplItemUFormBody | ImplItemUFormSemi;
export interface IndexExpression {
    readonly $type: TSKindId.IndexExpression;
    readonly _object: Expression;
    readonly _index: Expression;
    object(): Expression;
    index(): Expression;
}
export interface InnerAttributeItem {
    readonly $type: TSKindId.InnerAttributeItem;
    readonly _attribute: Attribute;
    attribute(): Attribute;
}
export interface Label {
    readonly $type: TSKindId.Label;
    readonly _identifier: Identifier;
    identifier(): Identifier;
}
export interface LastMatchArm {
    readonly $type: TSKindId.LastMatchArm;
    readonly _pattern: MatchPattern;
    readonly _value: Expression;
    pattern(): MatchPattern;
    value(): Expression;
    readonly $children: readonly (AttributeItem | InnerAttributeItem)[];
}
export interface LetCondition {
    readonly $type: TSKindId.LetCondition;
    readonly _pattern: Pattern;
    readonly _value: Expression;
    pattern(): Pattern;
    value(): Expression;
}
export interface LetDeclaration {
    readonly $type: TSKindId.LetDeclaration;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _pattern: Pattern;
    readonly _type?: _Type;
    readonly _value?: Expression;
    readonly _alternative?: Block;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    pattern(): Pattern;
    typeField(): _Type | undefined;
    value(): Expression | undefined;
    alternative(): Block | undefined;
}
export interface Lifetime {
    readonly $type: TSKindId.Lifetime;
    readonly _identifier: Identifier;
    identifier(): Identifier;
}
export interface LifetimeParameter {
    readonly $type: TSKindId.LifetimeParameter;
    readonly _name: Lifetime;
    readonly _bounds?: TraitBounds;
    name(): Lifetime;
    bounds(): TraitBounds | undefined;
}
export interface LineCommentUFormRegularDslash {
    readonly $type: TSKindId.LineComment;
    readonly $variant: 'regular_dslash';
    readonly $children: readonly [LineCommentRegularDslash];
}
export interface LineCommentUFormDoc {
    readonly $type: TSKindId.LineComment;
    readonly $variant: 'doc';
    readonly $children: readonly [LineCommentDoc];
}
export interface LineCommentUFormContent {
    readonly $type: TSKindId.LineComment;
    readonly $variant: 'content';
    readonly $children: readonly [LineCommentContent];
}
export type LineComment = LineCommentUFormRegularDslash | LineCommentUFormDoc | LineCommentUFormContent;
export interface LoopExpression {
    readonly $type: TSKindId.LoopExpression;
    readonly _label?: Label;
    readonly _body: Block;
    label(): Label | undefined;
    body(): Block;
}
export interface MacroDefinitionParen {
    readonly $type: "macro_definition_paren";
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface MacroDefinitionBracket {
    readonly $type: "macro_definition_bracket";
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface MacroDefinitionBrace {
    readonly $type: "macro_definition_brace";
    readonly $children: readonly (MacroRule | MacroRule)[];
}
export interface MacroDefinitionUFormParen {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'paren';
    readonly _name: Identifier | ReservedIdentifier;
    name(): Identifier | ReservedIdentifier;
    readonly $children: readonly [_MacroDefinitionParen];
}
export interface MacroDefinitionUFormBracket {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'bracket';
    readonly _name: Identifier | ReservedIdentifier;
    name(): Identifier | ReservedIdentifier;
    readonly $children: readonly [_MacroDefinitionBracket];
}
export interface MacroDefinitionUFormBrace {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'brace';
    readonly _name: Identifier | ReservedIdentifier;
    name(): Identifier | ReservedIdentifier;
    readonly $children: readonly [_MacroDefinitionBrace];
}
export type MacroDefinition = MacroDefinitionUFormParen | MacroDefinitionUFormBracket | MacroDefinitionUFormBrace;
export interface MacroInvocation {
    readonly $type: TSKindId.MacroInvocation;
    readonly _macro: ScopedIdentifier | Identifier | ReservedIdentifier;
    readonly _token_tree: DelimTokenTree;
    macro(): ScopedIdentifier | Identifier | ReservedIdentifier;
    tokenTree(): DelimTokenTree;
}
export interface MacroRule {
    readonly $type: TSKindId.MacroRule;
    readonly _left: TokenTreePattern;
    readonly _right: TokenTree;
    left(): TokenTreePattern;
    right(): TokenTree;
}
export interface MatchArmBlockEnding {
    readonly $type: "match_arm_block_ending";
    readonly _value: ExpressionEndingWithBlock;
    value(): ExpressionEndingWithBlock;
}
export interface MatchArmUFormWithComma {
    readonly $type: TSKindId.MatchArm;
    readonly $variant: 'with_comma';
    readonly _attributes: readonly (AttributeItem | InnerAttributeItem)[];
    readonly _pattern: MatchPattern;
    attributes(): readonly (AttributeItem | InnerAttributeItem)[];
    pattern(): MatchPattern;
    readonly $children: readonly [MatchArmWithComma];
}
export interface MatchArmUFormBlockEnding {
    readonly $type: TSKindId.MatchArm;
    readonly $variant: 'block_ending';
    readonly _attributes: readonly (AttributeItem | InnerAttributeItem)[];
    readonly _pattern: MatchPattern;
    attributes(): readonly (AttributeItem | InnerAttributeItem)[];
    pattern(): MatchPattern;
    readonly $children: readonly [_MatchArmBlockEnding];
}
export type MatchArm = MatchArmUFormWithComma | MatchArmUFormBlockEnding;
export interface MatchBlock {
    readonly $type: TSKindId.MatchBlock;
    readonly $children: readonly (MatchArm | LastMatchArm)[];
}
export interface MatchExpression {
    readonly $type: TSKindId.MatchExpression;
    readonly _value: Expression;
    readonly _body: MatchBlock;
    value(): Expression;
    body(): MatchBlock;
}
export interface MatchPattern {
    readonly $type: TSKindId.MatchPattern;
    readonly _condition?: Condition;
    condition(): Condition | undefined;
    readonly $children: readonly [Pattern];
}
export interface ModItemInline {
    readonly $type: "mod_item_inline";
    readonly _body: DeclarationList;
    body(): DeclarationList;
}
export interface ModItemUFormExternal {
    readonly $type: TSKindId.ModItem;
    readonly $variant: 'external';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: Identifier;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
}
export interface ModItemUFormInline {
    readonly $type: TSKindId.ModItem;
    readonly $variant: 'inline';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: Identifier;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
    readonly $children: readonly [_ModItemInline];
}
export type ModItem = ModItemUFormExternal | ModItemUFormInline;
export interface MutPattern {
    readonly $type: TSKindId.MutPattern;
    readonly _mutable_specifier: AutoStamp<_MutableSpecifier>;
    mutableSpecifier(): AutoStamp<_MutableSpecifier>;
    readonly $children: readonly [Pattern];
}
export interface NegativeLiteral {
    readonly $type: TSKindId.NegativeLiteral;
    readonly _value: IntegerLiteral | FloatLiteral;
    value(): IntegerLiteral | FloatLiteral;
}
export interface OrPatternUFormBinary {
    readonly $type: TSKindId.OrPattern;
    readonly $variant: 'binary';
    readonly $children: readonly [OrPatternBinary];
}
export interface OrPatternUFormPrefix {
    readonly $type: TSKindId.OrPattern;
    readonly $variant: 'prefix';
    readonly $children: readonly [OrPatternPrefix];
}
export type OrPattern = OrPatternUFormBinary | OrPatternUFormPrefix;
export interface OrderedFieldDeclarationList {
    readonly $type: TSKindId.OrderedFieldDeclarationList;
    readonly _type: readonly (_Type)[];
    typeField(): readonly (_Type)[];
    readonly $children: readonly (AttributeItem | VisibilityModifier)[];
}
export interface Parameter {
    readonly $type: TSKindId.Parameter;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _pattern: Pattern | Self;
    readonly _type: _Type;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    pattern(): Pattern | Self;
    typeField(): _Type;
}
export interface Parameters {
    readonly $type: TSKindId.Parameters;
    readonly $children: readonly (AttributeItem | Parameter | SelfParameter | VariadicParameter | "_" | _Type)[];
}
export interface ParenthesizedExpression {
    readonly $type: TSKindId.ParenthesizedExpression;
    readonly $children: readonly [Expression];
}
export interface PointerTypeMut {
    readonly $type: "pointer_type_mut";
    readonly $children: readonly [MutableSpecifier];
}
export interface PointerTypeUFormConst {
    readonly $type: TSKindId.PointerType;
    readonly $variant: 'const';
    readonly _type: _Type;
    typeField(): _Type;
}
export interface PointerTypeUFormMut {
    readonly $type: TSKindId.PointerType;
    readonly $variant: 'mut';
    readonly _type: _Type;
    typeField(): _Type;
    readonly $children: readonly [_PointerTypeMut];
}
export type PointerType = PointerTypeUFormConst | PointerTypeUFormMut;
export interface QualifiedType {
    readonly $type: TSKindId.QualifiedType;
    readonly _type: _Type;
    readonly _alias: _Type;
    typeField(): _Type;
    alias(): _Type;
}
export interface RangeExpressionBare {
    readonly $type: "range_expression_bare";
    readonly _operator: AutoStamp<Operator>;
    operator(): AutoStamp<Operator>;
}
export interface RangeExpressionUFormBinary {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'binary';
    readonly $children: readonly [RangeExpressionBinary];
}
export interface RangeExpressionUFormPostfix {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'postfix';
    readonly $children: readonly [RangeExpressionPostfix];
}
export interface RangeExpressionUFormPrefix {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'prefix';
    readonly $children: readonly [RangeExpressionPrefix];
}
export interface RangeExpressionUFormBare {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'bare';
    readonly $children: readonly [_RangeExpressionBare];
}
export type RangeExpression = RangeExpressionUFormBinary | RangeExpressionUFormPostfix | RangeExpressionUFormPrefix | RangeExpressionUFormBare;
export interface RangePatternUFormLeftWithRight {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'left_with_right';
    readonly _left: LiteralPattern | Path;
    left(): LiteralPattern | Path;
    readonly $children: readonly [RangePatternLeftWithRight];
}
export interface RangePatternUFormLeftBare {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'left_bare';
    readonly _left: LiteralPattern | Path;
    left(): LiteralPattern | Path;
}
export interface RangePatternUFormPrefix {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'prefix';
    readonly $children: readonly [RangePatternPrefix];
}
export type RangePattern = RangePatternUFormLeftWithRight | RangePatternUFormLeftBare | RangePatternUFormPrefix;
export interface RawStringLiteral {
    readonly $type: TSKindId.RawStringLiteral;
    readonly _raw_string_literal_start?: string;
    readonly _string_content: RawStringLiteralContent;
    readonly _raw_string_literal_end?: string;
    rawStringLiteralStart(): string | undefined;
    stringContent(): RawStringLiteralContent;
    rawStringLiteralEnd(): string | undefined;
}
export interface RefPattern {
    readonly $type: TSKindId.RefPattern;
    readonly $children: readonly [Pattern];
}
export interface ReferenceExpression {
    readonly $type: TSKindId.ReferenceExpression;
    readonly _value: Expression;
    value(): Expression;
    readonly $children: readonly [ReferenceExpressionRawConst | ReferenceExpressionRawMut | MutableSpecifier];
}
export interface ReferencePattern {
    readonly $type: TSKindId.ReferencePattern;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _pattern: Pattern;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    pattern(): Pattern;
}
export interface ReferenceType {
    readonly $type: TSKindId.ReferenceType;
    readonly _lifetime?: Lifetime;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _type: _Type;
    lifetime(): Lifetime | undefined;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    typeField(): _Type;
}
export interface RemovedTraitBound {
    readonly $type: TSKindId.RemovedTraitBound;
    readonly $children: readonly [_Type];
}
export interface ReturnExpression {
    readonly $type: TSKindId.ReturnExpression;
    readonly $children: readonly [Expression];
}
export interface ScopedIdentifier {
    readonly $type: TSKindId.ScopedIdentifier;
    readonly _path?: Path | BracketedType | GenericTypeWithTurbofish;
    readonly _name: Identifier | Super;
    path(): Path | BracketedType | GenericTypeWithTurbofish | undefined;
    name(): Identifier | Super;
}
export interface ScopedTypeIdentifier {
    readonly $type: TSKindId.ScopedTypeIdentifier;
    readonly _path?: Path | GenericTypeWithTurbofish | BracketedType;
    readonly _name: TypeIdentifier;
    path(): Path | GenericTypeWithTurbofish | BracketedType | undefined;
    name(): TypeIdentifier;
}
export interface ScopedTypeIdentifierInExpressionPosition {
    readonly $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
    readonly _path?: Path | GenericTypeWithTurbofish;
    readonly _name: TypeIdentifier;
    path(): Path | GenericTypeWithTurbofish | undefined;
    name(): TypeIdentifier;
}
export interface ScopedUseList {
    readonly $type: TSKindId.ScopedUseList;
    readonly _path?: Path;
    readonly _list: UseList;
    path(): Path | undefined;
    list(): UseList;
}
export interface SelfParameter {
    readonly $type: TSKindId.SelfParameter;
    readonly _reference?: BooleanKeyword<"&">;
    readonly _lifetime?: Lifetime;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _self: AutoStamp<_Self>;
    reference(): BooleanKeyword<"&"> | undefined;
    lifetime(): Lifetime | undefined;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    self(): AutoStamp<_Self>;
}
export interface ShorthandFieldInitializer {
    readonly $type: TSKindId.ShorthandFieldInitializer;
    readonly _attributes: readonly (AttributeItem)[];
    readonly _identifier: Identifier;
    attributes(): readonly (AttributeItem)[];
    identifier(): Identifier;
}
export interface SlicePattern {
    readonly $type: TSKindId.SlicePattern;
    readonly $children: readonly (Pattern)[];
}
export interface SourceFile {
    readonly $type: TSKindId.SourceFile;
    readonly _shebang?: Shebang;
    readonly _statements: readonly (Statement)[];
    shebang(): Shebang | undefined;
    statements(): readonly (Statement)[];
}
export interface StaticItem {
    readonly $type: TSKindId.StaticItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _mutable_specifier?: RefMarker | _MutableSpecifier;
    readonly _name: Identifier;
    readonly _type: _Type;
    readonly _value?: Expression;
    visibilityModifier(): VisibilityModifier | undefined;
    mutableSpecifier(): RefMarker | _MutableSpecifier | undefined;
    name(): Identifier;
    typeField(): _Type;
    value(): Expression | undefined;
}
export interface StringLiteral {
    readonly $type: TSKindId.StringLiteral;
    readonly $children: readonly (EscapeSequence | StringContent)[];
}
export interface StructExpression {
    readonly $type: TSKindId.StructExpression;
    readonly _name: TypeIdentifier | ScopedTypeIdentifierInExpressionPosition | GenericTypeWithTurbofish;
    readonly _body: FieldInitializerList;
    name(): TypeIdentifier | ScopedTypeIdentifierInExpressionPosition | GenericTypeWithTurbofish;
    body(): FieldInitializerList;
}
export interface StructItemUFormBrace {
    readonly $type: TSKindId.StructItem;
    readonly $variant: 'brace';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    readonly $children: readonly [StructItemBrace];
}
export interface StructItemUFormTuple {
    readonly $type: TSKindId.StructItem;
    readonly $variant: 'tuple';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    readonly $children: readonly [StructItemTuple];
}
export interface StructItemUFormUnit {
    readonly $type: TSKindId.StructItem;
    readonly $variant: 'unit';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
}
export type StructItem = StructItemUFormBrace | StructItemUFormTuple | StructItemUFormUnit;
export interface StructPattern {
    readonly $type: TSKindId.StructPattern;
    readonly _type: TypeIdentifier | ScopedTypeIdentifier;
    typeField(): TypeIdentifier | ScopedTypeIdentifier;
    readonly $children: readonly (FieldPattern | RemainingFieldPattern)[];
}
export interface TokenBindingPattern {
    readonly $type: TSKindId.TokenBindingPattern;
    readonly _name: Metavariable;
    readonly _type: TokenBindingPatternType;
    name(): Metavariable;
    typeField(): TokenBindingPatternType;
}
export interface TokenRepetition {
    readonly $type: TSKindId.TokenRepetition;
    readonly $children: readonly (Tokens)[];
}
export interface TokenRepetitionPattern {
    readonly $type: TSKindId.TokenRepetitionPattern;
    readonly $children: readonly (TokenPattern)[];
}
export interface TokenTreeParen {
    readonly $type: "token_tree_paren";
    readonly $children: readonly (Tokens)[];
}
export interface TokenTreeBracket {
    readonly $type: "token_tree_bracket";
    readonly $children: readonly (Tokens)[];
}
export interface TokenTreeBrace {
    readonly $type: "token_tree_brace";
    readonly $children: readonly (Tokens)[];
}
export interface TokenTreeUFormParen {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'paren';
    readonly $children: readonly [_TokenTreeParen];
}
export interface TokenTreeUFormBracket {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'bracket';
    readonly $children: readonly [_TokenTreeBracket];
}
export interface TokenTreeUFormBrace {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'brace';
    readonly $children: readonly [_TokenTreeBrace];
}
export type TokenTree = TokenTreeUFormParen | TokenTreeUFormBracket | TokenTreeUFormBrace;
export interface TokenTreePatternParen {
    readonly $type: "token_tree_pattern_paren";
    readonly $children: readonly (TokenPattern)[];
}
export interface TokenTreePatternBracket {
    readonly $type: "token_tree_pattern_bracket";
    readonly $children: readonly (TokenPattern)[];
}
export interface TokenTreePatternBrace {
    readonly $type: "token_tree_pattern_brace";
    readonly $children: readonly (TokenPattern)[];
}
export interface TokenTreePatternUFormParen {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'paren';
    readonly $children: readonly [_TokenTreePatternParen];
}
export interface TokenTreePatternUFormBracket {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'bracket';
    readonly $children: readonly [_TokenTreePatternBracket];
}
export interface TokenTreePatternUFormBrace {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'brace';
    readonly $children: readonly [_TokenTreePatternBrace];
}
export type TokenTreePattern = TokenTreePatternUFormParen | TokenTreePatternUFormBracket | TokenTreePatternUFormBrace;
export interface TraitBounds {
    readonly $type: TSKindId.TraitBounds;
    readonly $children: NonEmptyArray<_Type | Lifetime | HigherRankedTraitBound>;
}
export interface TraitItem {
    readonly $type: TSKindId.TraitItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _unsafe_marker?: BooleanKeyword<UnsafeMarker>;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _bounds?: TraitBounds;
    readonly _where_clause?: WhereClause;
    readonly _body: DeclarationList;
    visibilityModifier(): VisibilityModifier | undefined;
    unsafeMarker(): BooleanKeyword<UnsafeMarker> | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    bounds(): TraitBounds | undefined;
    whereClause(): WhereClause | undefined;
    body(): DeclarationList;
}
export interface TryBlock {
    readonly $type: TSKindId.TryBlock;
    readonly _block: Block;
    block(): Block;
}
export interface TryExpression {
    readonly $type: TSKindId.TryExpression;
    readonly _value: Expression;
    value(): Expression;
}
export interface TupleExpression {
    readonly $type: TSKindId.TupleExpression;
    readonly _attributes: readonly (AttributeItem)[];
    readonly _elements?: readonly (Expression)[];
    attributes(): readonly (AttributeItem)[];
    elements(): readonly (Expression)[];
}
export interface TuplePattern {
    readonly $type: TSKindId.TuplePattern;
    readonly $children: readonly (Pattern | ClosureExpression)[];
}
export interface TupleStructPattern {
    readonly $type: TSKindId.TupleStructPattern;
    readonly _type: Identifier | ScopedIdentifier | GenericTypeWithTurbofish;
    typeField(): Identifier | ScopedIdentifier | GenericTypeWithTurbofish;
    readonly $children: readonly (Pattern)[];
}
export interface TupleType {
    readonly $type: TSKindId.TupleType;
    readonly $children: NonEmptyArray<_Type>;
}
export interface TypeArguments {
    readonly $type: TSKindId.TypeArguments;
    readonly $children: NonEmptyArray<_Type | TypeBinding | Lifetime | Literal | Block | TraitBounds>;
}
export interface TypeBinding {
    readonly $type: TSKindId.TypeBinding;
    readonly _name: TypeIdentifier;
    readonly _type_arguments?: TypeArguments;
    readonly _type: _Type;
    name(): TypeIdentifier;
    typeArguments(): TypeArguments | undefined;
    typeField(): _Type;
}
export interface TypeCastExpression {
    readonly $type: TSKindId.TypeCastExpression;
    readonly _value: Expression;
    readonly _type: _Type;
    value(): Expression;
    typeField(): _Type;
}
export interface TypeItem {
    readonly $type: TSKindId.TypeItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _where_clause?: WhereClause;
    readonly _type: _Type;
    readonly _trailing_where_clause?: WhereClause;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    whereClause(): WhereClause | undefined;
    typeField(): _Type;
    trailingWhereClause(): WhereClause | undefined;
}
export interface TypeParameter {
    readonly $type: TSKindId.TypeParameter;
    readonly _name: TypeIdentifier;
    readonly _bounds?: TraitBounds;
    readonly _default_type?: _Type;
    name(): TypeIdentifier;
    bounds(): TraitBounds | undefined;
    defaultType(): _Type | undefined;
}
export interface TypeParameters {
    readonly $type: TSKindId.TypeParameters;
    readonly _attributes: readonly (AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter)[];
    attributes(): readonly (AttributeItem | Metavariable | TypeParameter | LifetimeParameter | ConstParameter)[];
}
export interface UnaryExpression {
    readonly $type: TSKindId.UnaryExpression;
    readonly _operator: UnaryExpressionOperator;
    readonly _operand: Expression;
    operator(): UnaryExpressionOperator;
    operand(): Expression;
}
export interface UnionItem {
    readonly $type: TSKindId.UnionItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _where_clause?: WhereClause;
    readonly _body: FieldDeclarationList;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    whereClause(): WhereClause | undefined;
    body(): FieldDeclarationList;
}
export interface UnsafeBlock {
    readonly $type: TSKindId.UnsafeBlock;
    readonly _block: Block;
    block(): Block;
}
export interface UseAsClause {
    readonly $type: TSKindId.UseAsClause;
    readonly _path: Path;
    readonly _alias: Identifier;
    path(): Path;
    alias(): Identifier;
}
export interface UseBounds {
    readonly $type: TSKindId.UseBounds;
    readonly $children: readonly (Lifetime | TypeIdentifier)[];
}
export interface UseDeclaration {
    readonly $type: TSKindId.UseDeclaration;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _argument: UseClause;
    visibilityModifier(): VisibilityModifier | undefined;
    argument(): UseClause;
}
export interface UseList {
    readonly $type: TSKindId.UseList;
    readonly $children: readonly (UseClause)[];
}
export interface UseWildcard {
    readonly $type: TSKindId.UseWildcard;
    readonly _path?: Path;
    path(): Path | undefined;
}
export interface VariadicParameter {
    readonly $type: TSKindId.VariadicParameter;
    readonly _mutable_specifier?: BooleanKeyword<_MutableSpecifier>;
    readonly _pattern?: Pattern;
    mutableSpecifier(): BooleanKeyword<_MutableSpecifier> | undefined;
    pattern(): Pattern | undefined;
}
export interface VisibilityModifierCrate {
    readonly $type: "visibility_modifier_crate";
    readonly $children: readonly [Crate];
}
export interface VisibilityModifierUFormInPath {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'in_path';
    readonly $children: readonly [VisibilityModifierInPath];
}
export interface VisibilityModifierUFormCrate {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'crate';
    readonly $children: readonly [_VisibilityModifierCrate];
}
export interface VisibilityModifierUFormPub {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'pub';
    readonly $children: readonly [VisibilityModifierPub];
}
export type VisibilityModifier = VisibilityModifierUFormInPath | VisibilityModifierUFormCrate | VisibilityModifierUFormPub;
export interface WhereClause {
    readonly $type: TSKindId.WhereClause;
    readonly $children: readonly (WherePredicate)[];
}
export interface WherePredicate {
    readonly $type: TSKindId.WherePredicate;
    readonly _left: Lifetime | TypeIdentifier | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType;
    readonly _bounds: TraitBounds;
    left(): Lifetime | TypeIdentifier | ScopedTypeIdentifier | GenericType | ReferenceType | PointerType | TupleType | ArrayType | HigherRankedTraitBound | PrimitiveType;
    bounds(): TraitBounds;
}
export interface WhileExpression {
    readonly $type: TSKindId.WhileExpression;
    readonly _label?: Label;
    readonly _condition: Condition;
    readonly _body: Block;
    label(): Label | undefined;
    condition(): Condition;
    body(): Block;
}
export interface YieldExpression {
    readonly $type: TSKindId.YieldExpression;
    readonly $children: readonly [Expression];
}
export type RangeExpressionBinaryOperator = Terminal<TSKindId.DotDot | TSKindId.DotDotDot | TSKindId.DotDotEq, ".." | "..." | "..=">;
export type VisibilityModifierInPathIn = Terminal<TSKindId.In, "in">;
export type VisibilityModifierPubPub = Terminal<TSKindId.Pub, "pub">;
export type BinaryExpressionOperator = Terminal<TSKindId.AmpAmp, "&&">;
export type ClosureExpressionAsyncMarker = Terminal<TSKindId.Async, "async">;
export type ClosureExpressionStaticMarker = Terminal<TSKindId.Static, "static">;
export type CompoundAssignmentExprOperator = Terminal<TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.CaretEq | TSKindId.LtLtEq | TSKindId.GtGtEq, "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=">;
export type _Crate = Terminal<TSKindId.Crate, "crate">;
export type GenericTypeWithTurbofishTurbofish = Terminal<TSKindId.ColonColon, "::">;
export type ImplItemNegative = Terminal<TSKindId.Bang, "!">;
export type LineCommentContent = Terminal<TSKindId.LineCommentContent, string>;
export type LineCommentRegularDslash = Terminal<TSKindId.LineCommentRegularDslash, string>;
export type MoveMarker = Terminal<TSKindId.Move, "move">;
export type _MutableSpecifier = Terminal<number, "mut">;
export type Operator = Terminal<TSKindId.DotDot, "..">;
export type PrimitiveType = Terminal<TSKindId.U8 | TSKindId.I8 | TSKindId.U16 | TSKindId.I16 | TSKindId.U32 | TSKindId.I32 | TSKindId.U64 | TSKindId.I64 | TSKindId.U128 | TSKindId.I128 | TSKindId.Isize | TSKindId.Usize | TSKindId.F32 | TSKindId.F64 | TSKindId.Bool | TSKindId.Str | TSKindId.Char, "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "u128" | "i128" | "isize" | "usize" | "f32" | "f64" | "bool" | "str" | "char">;
export type RefMarker = Terminal<TSKindId.Ref, "ref">;
export type ReferenceExpressionRawConst = Terminal<TSKindId.ReferenceExpressionRawConst, string>;
export type _Self = Terminal<TSKindId.Self, "self">;
export type TokenBindingPatternType = Terminal<TSKindId.Block | TSKindId.Expr | TSKindId.Expr2021 | TSKindId.Ident | TSKindId.Item | TSKindId.Lifetime | TSKindId.Literal | TSKindId.Meta | TSKindId.Pat | TSKindId.PatParam | TSKindId.Path | TSKindId.Stmt | TSKindId.Tt | TSKindId.Ty | TSKindId.Vis, "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis">;
export type UnaryExpressionOperator = Terminal<TSKindId.Dash | TSKindId.Star | TSKindId.Bang, "-" | "*" | "!">;
export type UnsafeMarker = Terminal<TSKindId.Unsafe, "unsafe">;
export type BooleanLiteral = Terminal<TSKindId.True | TSKindId.False, "true" | "false">;
export type CharLiteral = Terminal<TSKindId.CharLiteral, string>;
export type Crate = Terminal<TSKindId.Crate, "crate">;
export type EscapeSequence = Terminal<TSKindId.EscapeSequence, string>;
export type FragmentSpecifier = Terminal<TSKindId.Block | TSKindId.Expr | TSKindId.Expr2021 | TSKindId.Ident | TSKindId.Item | TSKindId.Lifetime | TSKindId.Literal | TSKindId.Meta | TSKindId.Pat | TSKindId.PatParam | TSKindId.Path | TSKindId.Stmt | TSKindId.Tt | TSKindId.Ty | TSKindId.Vis, "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis">;
export type Identifier = Terminal<TSKindId.Identifier, string>;
export type IntegerLiteral = Terminal<TSKindId.IntegerLiteral, string>;
export type Metavariable = Terminal<TSKindId.Metavariable, string>;
export type MutableSpecifier = Terminal<TSKindId.MutableSpecifier, "mut">;
export type Self = Terminal<TSKindId.Self, "self">;
export type Shebang = Terminal<TSKindId.Shebang, string>;
export type Super = Terminal<TSKindId.Super, "super">;
export type UnitExpression = Terminal<TSKindId.UnitExpression, string>;
export type UnitType = Terminal<TSKindId.UnitType, string>;
export type StringContent = Terminal<TSKindId.StringContent, string>;
export type RawStringLiteralContent = Terminal<TSKindId.RawStringLiteralContent, string>;
export type FloatLiteral = Terminal<TSKindId.FloatLiteral, string>;
export type OuterBlockDocCommentMarker = Terminal<TSKindId.OuterBlockDocCommentMarker, string>;
export type InnerBlockDocCommentMarker = Terminal<TSKindId.InnerBlockDocCommentMarker, string>;
export type LineDocContent = Terminal<TSKindId.LineDocContent, string>;
export type ErrorSentinel = Terminal<TSKindId.ErrorSentinel, string>;
export type BlockCommentContent = Terminal<TSKindId._BlockCommentContent, string>;
export interface ArrayExpressionListTree extends AnyTreeNode {
    readonly type: "_array_expression_list";
}
export interface ArrayExpressionSemiTree extends AnyTreeNode {
    readonly type: "_array_expression_semi";
}
export interface ClosureExpressionBlockTree extends AnyTreeNode {
    readonly type: "_closure_expression_block";
}
export interface _ClosureExpressionExprTree extends AnyTreeNode {
    readonly type: "_closure_expression_expr";
}
export interface _DelimTokenTreeBraceTree extends AnyTreeNode {
    readonly type: "_delim_token_tree_brace";
}
export interface _DelimTokenTreeBracketTree extends AnyTreeNode {
    readonly type: "_delim_token_tree_bracket";
}
export interface _DelimTokenTreeParenTree extends AnyTreeNode {
    readonly type: "_delim_token_tree_paren";
}
export interface _ExpressionStatementBlockEndingTree extends AnyTreeNode {
    readonly type: "_expression_statement_block_ending";
}
export interface _ExpressionStatementWithSemiTree extends AnyTreeNode {
    readonly type: "_expression_statement_with_semi";
}
export interface FieldIdentifierTree extends AnyTreeNode {
    readonly type: "_field_identifier";
}
export interface FieldPatternNamedTree extends AnyTreeNode {
    readonly type: "_field_pattern_named";
}
export interface _FieldPatternShorthandTree extends AnyTreeNode {
    readonly type: "_field_pattern_shorthand";
}
export interface _ForeignModItemBodyTree extends AnyTreeNode {
    readonly type: "_foreign_mod_item_body";
}
export interface FunctionTypeFnFormTree extends AnyTreeNode {
    readonly type: "_function_type_fn_form";
}
export interface FunctionTypeTraitFormTree extends AnyTreeNode {
    readonly type: "_function_type_trait_form";
}
export interface _ImplItemBodyTree extends AnyTreeNode {
    readonly type: "_impl_item_body";
}
export interface LetChainTree extends AnyTreeNode {
    readonly type: "_let_chain";
}
export interface LineCommentDocTree extends AnyTreeNode {
    readonly type: "_line_comment_doc";
}
export interface _MacroDefinitionBraceTree extends AnyTreeNode {
    readonly type: "_macro_definition_brace";
}
export interface _MacroDefinitionBracketTree extends AnyTreeNode {
    readonly type: "_macro_definition_bracket";
}
export interface _MacroDefinitionParenTree extends AnyTreeNode {
    readonly type: "_macro_definition_paren";
}
export interface _MatchArmBlockEndingTree extends AnyTreeNode {
    readonly type: "_match_arm_block_ending";
}
export interface MatchArmWithCommaTree extends AnyTreeNode {
    readonly type: "_match_arm_with_comma";
}
export interface _ModItemInlineTree extends AnyTreeNode {
    readonly type: "_mod_item_inline";
}
export interface NonSpecialTokenTree extends AnyTreeNode {
    readonly type: "_non_special_token";
}
export interface OrPatternBinaryTree extends AnyTreeNode {
    readonly type: "_or_pattern_binary";
}
export interface OrPatternPrefixTree extends AnyTreeNode {
    readonly type: "_or_pattern_prefix";
}
export interface _PointerTypeMutTree extends AnyTreeNode {
    readonly type: "_pointer_type_mut";
}
export interface _RangeExpressionBareTree extends AnyTreeNode {
    readonly type: "_range_expression_bare";
}
export interface RangeExpressionBinaryTree extends AnyTreeNode {
    readonly type: "_range_expression_binary";
}
export interface RangeExpressionPostfixTree extends AnyTreeNode {
    readonly type: "_range_expression_postfix";
}
export interface RangeExpressionPrefixTree extends AnyTreeNode {
    readonly type: "_range_expression_prefix";
}
export interface RangePatternLeftWithRightTree extends AnyTreeNode {
    readonly type: "_range_pattern_left_with_right";
}
export interface RangePatternPrefixTree extends AnyTreeNode {
    readonly type: "_range_pattern_prefix";
}
export interface ReferenceExpressionRawMutTree extends AnyTreeNode {
    readonly type: "_reference_expression_raw_mut";
}
export interface ReservedIdentifierTree extends AnyTreeNode {
    readonly type: "_reserved_identifier";
}
export interface StructItemBraceTree extends AnyTreeNode {
    readonly type: "_struct_item_brace";
}
export interface StructItemTupleTree extends AnyTreeNode {
    readonly type: "_struct_item_tuple";
}
export interface _TokenTreeBraceTree extends AnyTreeNode {
    readonly type: "_token_tree_brace";
}
export interface _TokenTreeBracketTree extends AnyTreeNode {
    readonly type: "_token_tree_bracket";
}
export interface _TokenTreeParenTree extends AnyTreeNode {
    readonly type: "_token_tree_paren";
}
export interface _TokenTreePatternBraceTree extends AnyTreeNode {
    readonly type: "_token_tree_pattern_brace";
}
export interface _TokenTreePatternBracketTree extends AnyTreeNode {
    readonly type: "_token_tree_pattern_bracket";
}
export interface _TokenTreePatternParenTree extends AnyTreeNode {
    readonly type: "_token_tree_pattern_paren";
}
export interface TypeIdentifierTree extends AnyTreeNode {
    readonly type: "_type_identifier";
}
export interface _VisibilityModifierCrateTree extends AnyTreeNode {
    readonly type: "_visibility_modifier_crate";
}
export interface VisibilityModifierInPathTree extends AnyTreeNode {
    readonly type: "_visibility_modifier_in_path";
}
export interface VisibilityModifierPubTree extends AnyTreeNode {
    readonly type: "_visibility_modifier_pub";
}
export interface AbstractTypeTree extends TreeNode<'abstract_type'> {
}
export interface ArgumentsTree extends TreeNode<'arguments'> {
}
export interface ArrayExpressionTree extends TreeNode<'array_expression'> {
}
export interface ArrayExpressionUFormSemiTree extends TreeNode<'array_expression'> {
}
export interface ArrayExpressionUFormListTree extends TreeNode<'array_expression'> {
}
export interface ArrayTypeTree extends TreeNode<'array_type'> {
}
export interface AssignmentExpressionTree extends TreeNode<'assignment_expression'> {
}
export interface AssociatedTypeTree extends TreeNode<'associated_type'> {
}
export interface AsyncBlockTree extends TreeNode<'async_block'> {
}
export interface AttributeTree extends TreeNode<'attribute'> {
}
export interface AttributeItemTree extends TreeNode<'attribute_item'> {
}
export interface AwaitExpressionTree extends TreeNode<'await_expression'> {
}
export interface BaseFieldInitializerTree extends TreeNode<'base_field_initializer'> {
}
export interface BinaryExpressionTree extends TreeNode<'binary_expression'> {
}
export interface BlockTree extends TreeNode<'block'> {
}
export interface BlockCommentTree extends TreeNode<'block_comment'> {
}
export interface BoundedTypeTree extends TreeNode<'bounded_type'> {
}
export interface BracketedTypeTree extends TreeNode<'bracketed_type'> {
}
export interface BreakExpressionTree extends TreeNode<'break_expression'> {
}
export interface CallExpressionTree extends TreeNode<'call_expression'> {
}
export interface CapturedPatternTree extends TreeNode<'captured_pattern'> {
}
export interface ClosureExpressionExprTree extends TreeNode<'closure_expression_expr'> {
}
export interface ClosureExpressionTree extends TreeNode<'closure_expression'> {
}
export interface ClosureExpressionUFormBlockTree extends TreeNode<'closure_expression'> {
}
export interface ClosureExpressionUFormExprTree extends TreeNode<'closure_expression'> {
}
export interface ClosureParametersTree extends TreeNode<'closure_parameters'> {
}
export interface CommentTree extends AnyTreeNode {
    readonly type: "comment";
}
export interface CompoundAssignmentExprTree extends TreeNode<'compound_assignment_expr'> {
}
export interface ConstBlockTree extends TreeNode<'const_block'> {
}
export interface ConstItemTree extends TreeNode<'const_item'> {
}
export interface ConstParameterTree extends TreeNode<'const_parameter'> {
}
export interface ContinueExpressionTree extends TreeNode<'continue_expression'> {
}
export interface DeclarationListTree extends TreeNode<'declaration_list'> {
}
export interface DelimTokenTreeParenTree extends TreeNode<'delim_token_tree_paren'> {
}
export interface DelimTokenTreeBracketTree extends TreeNode<'delim_token_tree_bracket'> {
}
export interface DelimTokenTreeBraceTree extends TreeNode<'delim_token_tree_brace'> {
}
export interface DelimTokenTreeTree extends AnyTreeNode {
    readonly type: "delim_token_tree";
}
export interface DelimTokenTreeUFormParenTree extends AnyTreeNode {
}
export interface DelimTokenTreeUFormBracketTree extends AnyTreeNode {
}
export interface DelimTokenTreeUFormBraceTree extends AnyTreeNode {
}
export interface DynamicTypeTree extends TreeNode<'dynamic_type'> {
}
export interface ElseClauseTree extends TreeNode<'else_clause'> {
}
export interface EnumItemTree extends TreeNode<'enum_item'> {
}
export interface EnumVariantTree extends TreeNode<'enum_variant'> {
}
export interface EnumVariantListTree extends TreeNode<'enum_variant_list'> {
}
export interface ExpressionStatementWithSemiTree extends TreeNode<'expression_statement_with_semi'> {
}
export interface ExpressionStatementBlockEndingTree extends TreeNode<'expression_statement_block_ending'> {
}
export interface ExpressionStatementTree extends TreeNode<'expression_statement'> {
}
export interface ExpressionStatementUFormWithSemiTree extends TreeNode<'expression_statement'> {
}
export interface ExpressionStatementUFormBlockEndingTree extends TreeNode<'expression_statement'> {
}
export interface ExternCrateDeclarationTree extends TreeNode<'extern_crate_declaration'> {
}
export interface ExternModifierTree extends TreeNode<'extern_modifier'> {
}
export interface FieldDeclarationTree extends TreeNode<'field_declaration'> {
}
export interface FieldDeclarationListTree extends TreeNode<'field_declaration_list'> {
}
export interface FieldExpressionTree extends TreeNode<'field_expression'> {
}
export interface FieldInitializerTree extends TreeNode<'field_initializer'> {
}
export interface FieldInitializerListTree extends TreeNode<'field_initializer_list'> {
}
export interface FieldPatternShorthandTree extends TreeNode<'field_pattern_shorthand'> {
}
export interface FieldPatternTree extends TreeNode<'field_pattern'> {
}
export interface FieldPatternUFormShorthandTree extends TreeNode<'field_pattern'> {
}
export interface FieldPatternUFormNamedTree extends TreeNode<'field_pattern'> {
}
export interface ForExpressionTree extends TreeNode<'for_expression'> {
}
export interface ForLifetimesTree extends TreeNode<'for_lifetimes'> {
}
export interface ForeignModItemBodyTree extends TreeNode<'foreign_mod_item_body'> {
}
export interface ForeignModItemTree extends TreeNode<'foreign_mod_item'> {
}
export interface ForeignModItemUFormSemiTree extends TreeNode<'foreign_mod_item'> {
}
export interface ForeignModItemUFormBodyTree extends TreeNode<'foreign_mod_item'> {
}
export interface FunctionItemTree extends TreeNode<'function_item'> {
}
export interface FunctionModifiersTree extends TreeNode<'function_modifiers'> {
}
export interface FunctionSignatureItemTree extends TreeNode<'function_signature_item'> {
}
export interface FunctionTypeTree extends TreeNode<'function_type'> {
}
export interface GenBlockTree extends TreeNode<'gen_block'> {
}
export interface GenericFunctionTree extends TreeNode<'generic_function'> {
}
export interface GenericPatternTree extends TreeNode<'generic_pattern'> {
}
export interface GenericTypeTree extends TreeNode<'generic_type'> {
}
export interface GenericTypeWithTurbofishTree extends TreeNode<'generic_type_with_turbofish'> {
}
export interface HigherRankedTraitBoundTree extends TreeNode<'higher_ranked_trait_bound'> {
}
export interface IfExpressionTree extends TreeNode<'if_expression'> {
}
export interface ImplItemBodyTree extends TreeNode<'impl_item_body'> {
}
export interface ImplItemTree extends TreeNode<'impl_item'> {
}
export interface ImplItemUFormBodyTree extends TreeNode<'impl_item'> {
}
export interface ImplItemUFormSemiTree extends TreeNode<'impl_item'> {
}
export interface IndexExpressionTree extends TreeNode<'index_expression'> {
}
export interface InnerAttributeItemTree extends TreeNode<'inner_attribute_item'> {
}
export interface LabelTree extends TreeNode<'label'> {
}
export interface LastMatchArmTree extends AnyTreeNode {
    readonly type: "last_match_arm";
}
export interface LetConditionTree extends TreeNode<'let_condition'> {
}
export interface LetDeclarationTree extends TreeNode<'let_declaration'> {
}
export interface LifetimeTree extends TreeNode<'lifetime'> {
}
export interface LifetimeParameterTree extends TreeNode<'lifetime_parameter'> {
}
export interface LineCommentTree extends TreeNode<'line_comment'> {
}
export interface LineCommentUFormRegularDslashTree extends TreeNode<'line_comment'> {
}
export interface LineCommentUFormDocTree extends TreeNode<'line_comment'> {
}
export interface LineCommentUFormContentTree extends TreeNode<'line_comment'> {
}
export interface LoopExpressionTree extends TreeNode<'loop_expression'> {
}
export interface MacroDefinitionParenTree extends TreeNode<'macro_definition_paren'> {
}
export interface MacroDefinitionBracketTree extends TreeNode<'macro_definition_bracket'> {
}
export interface MacroDefinitionBraceTree extends TreeNode<'macro_definition_brace'> {
}
export interface MacroDefinitionTree extends TreeNode<'macro_definition'> {
}
export interface MacroDefinitionUFormParenTree extends TreeNode<'macro_definition'> {
}
export interface MacroDefinitionUFormBracketTree extends TreeNode<'macro_definition'> {
}
export interface MacroDefinitionUFormBraceTree extends TreeNode<'macro_definition'> {
}
export interface MacroInvocationTree extends TreeNode<'macro_invocation'> {
}
export interface MacroRuleTree extends TreeNode<'macro_rule'> {
}
export interface MatchArmBlockEndingTree extends TreeNode<'match_arm_block_ending'> {
}
export interface MatchArmTree extends TreeNode<'match_arm'> {
}
export interface MatchArmUFormWithCommaTree extends TreeNode<'match_arm'> {
}
export interface MatchArmUFormBlockEndingTree extends TreeNode<'match_arm'> {
}
export interface MatchBlockTree extends TreeNode<'match_block'> {
}
export interface MatchExpressionTree extends TreeNode<'match_expression'> {
}
export interface MatchPatternTree extends TreeNode<'match_pattern'> {
}
export interface ModItemInlineTree extends TreeNode<'mod_item_inline'> {
}
export interface ModItemTree extends TreeNode<'mod_item'> {
}
export interface ModItemUFormExternalTree extends TreeNode<'mod_item'> {
}
export interface ModItemUFormInlineTree extends TreeNode<'mod_item'> {
}
export interface MutPatternTree extends TreeNode<'mut_pattern'> {
}
export interface NegativeLiteralTree extends TreeNode<'negative_literal'> {
}
export interface OrPatternTree extends TreeNode<'or_pattern'> {
}
export interface OrPatternUFormBinaryTree extends TreeNode<'or_pattern'> {
}
export interface OrPatternUFormPrefixTree extends TreeNode<'or_pattern'> {
}
export interface OrderedFieldDeclarationListTree extends TreeNode<'ordered_field_declaration_list'> {
}
export interface ParameterTree extends TreeNode<'parameter'> {
}
export interface ParametersTree extends TreeNode<'parameters'> {
}
export interface ParenthesizedExpressionTree extends TreeNode<'parenthesized_expression'> {
}
export interface PointerTypeMutTree extends TreeNode<'pointer_type_mut'> {
}
export interface PointerTypeTree extends TreeNode<'pointer_type'> {
}
export interface PointerTypeUFormConstTree extends TreeNode<'pointer_type'> {
}
export interface PointerTypeUFormMutTree extends TreeNode<'pointer_type'> {
}
export interface QualifiedTypeTree extends TreeNode<'qualified_type'> {
}
export interface RangeExpressionBareTree extends TreeNode<'range_expression_bare'> {
}
export interface RangeExpressionTree extends TreeNode<'range_expression'> {
}
export interface RangeExpressionUFormBinaryTree extends TreeNode<'range_expression'> {
}
export interface RangeExpressionUFormPostfixTree extends TreeNode<'range_expression'> {
}
export interface RangeExpressionUFormPrefixTree extends TreeNode<'range_expression'> {
}
export interface RangeExpressionUFormBareTree extends TreeNode<'range_expression'> {
}
export interface RangePatternTree extends TreeNode<'range_pattern'> {
}
export interface RangePatternUFormLeftWithRightTree extends TreeNode<'range_pattern'> {
}
export interface RangePatternUFormLeftBareTree extends TreeNode<'range_pattern'> {
}
export interface RangePatternUFormPrefixTree extends TreeNode<'range_pattern'> {
}
export interface RawStringLiteralTree extends TreeNode<'raw_string_literal'> {
}
export interface RefPatternTree extends TreeNode<'ref_pattern'> {
}
export interface ReferenceExpressionTree extends TreeNode<'reference_expression'> {
}
export interface ReferencePatternTree extends TreeNode<'reference_pattern'> {
}
export interface ReferenceTypeTree extends TreeNode<'reference_type'> {
}
export interface RemovedTraitBoundTree extends TreeNode<'removed_trait_bound'> {
}
export interface ReturnExpressionTree extends TreeNode<'return_expression'> {
}
export interface ScopedIdentifierTree extends TreeNode<'scoped_identifier'> {
}
export interface ScopedTypeIdentifierTree extends TreeNode<'scoped_type_identifier'> {
}
export interface ScopedTypeIdentifierInExpressionPositionTree extends AnyTreeNode {
    readonly type: "scoped_type_identifier_in_expression_position";
}
export interface ScopedUseListTree extends TreeNode<'scoped_use_list'> {
}
export interface SelfParameterTree extends TreeNode<'self_parameter'> {
}
export interface ShorthandFieldInitializerTree extends TreeNode<'shorthand_field_initializer'> {
}
export interface SlicePatternTree extends TreeNode<'slice_pattern'> {
}
export interface SourceFileTree extends TreeNode<'source_file'> {
}
export interface StaticItemTree extends TreeNode<'static_item'> {
}
export interface StringLiteralTree extends TreeNode<'string_literal'> {
}
export interface StructExpressionTree extends TreeNode<'struct_expression'> {
}
export interface StructItemTree extends TreeNode<'struct_item'> {
}
export interface StructItemUFormBraceTree extends TreeNode<'struct_item'> {
}
export interface StructItemUFormTupleTree extends TreeNode<'struct_item'> {
}
export interface StructItemUFormUnitTree extends TreeNode<'struct_item'> {
}
export interface StructPatternTree extends TreeNode<'struct_pattern'> {
}
export interface TokenBindingPatternTree extends TreeNode<'token_binding_pattern'> {
}
export interface TokenRepetitionTree extends TreeNode<'token_repetition'> {
}
export interface TokenRepetitionPatternTree extends TreeNode<'token_repetition_pattern'> {
}
export interface TokenTreeParenTree extends TreeNode<'token_tree_paren'> {
}
export interface TokenTreeBracketTree extends TreeNode<'token_tree_bracket'> {
}
export interface TokenTreeBraceTree extends TreeNode<'token_tree_brace'> {
}
export interface TokenTreeTree extends TreeNode<'token_tree'> {
}
export interface TokenTreeUFormParenTree extends TreeNode<'token_tree'> {
}
export interface TokenTreeUFormBracketTree extends TreeNode<'token_tree'> {
}
export interface TokenTreeUFormBraceTree extends TreeNode<'token_tree'> {
}
export interface TokenTreePatternParenTree extends TreeNode<'token_tree_pattern_paren'> {
}
export interface TokenTreePatternBracketTree extends TreeNode<'token_tree_pattern_bracket'> {
}
export interface TokenTreePatternBraceTree extends TreeNode<'token_tree_pattern_brace'> {
}
export interface TokenTreePatternTree extends TreeNode<'token_tree_pattern'> {
}
export interface TokenTreePatternUFormParenTree extends TreeNode<'token_tree_pattern'> {
}
export interface TokenTreePatternUFormBracketTree extends TreeNode<'token_tree_pattern'> {
}
export interface TokenTreePatternUFormBraceTree extends TreeNode<'token_tree_pattern'> {
}
export interface TraitBoundsTree extends TreeNode<'trait_bounds'> {
}
export interface TraitItemTree extends TreeNode<'trait_item'> {
}
export interface TryBlockTree extends TreeNode<'try_block'> {
}
export interface TryExpressionTree extends TreeNode<'try_expression'> {
}
export interface TupleExpressionTree extends TreeNode<'tuple_expression'> {
}
export interface TuplePatternTree extends TreeNode<'tuple_pattern'> {
}
export interface TupleStructPatternTree extends TreeNode<'tuple_struct_pattern'> {
}
export interface TupleTypeTree extends TreeNode<'tuple_type'> {
}
export interface TypeArgumentsTree extends TreeNode<'type_arguments'> {
}
export interface TypeBindingTree extends TreeNode<'type_binding'> {
}
export interface TypeCastExpressionTree extends TreeNode<'type_cast_expression'> {
}
export interface TypeItemTree extends TreeNode<'type_item'> {
}
export interface TypeParameterTree extends TreeNode<'type_parameter'> {
}
export interface TypeParametersTree extends TreeNode<'type_parameters'> {
}
export interface UnaryExpressionTree extends TreeNode<'unary_expression'> {
}
export interface UnionItemTree extends TreeNode<'union_item'> {
}
export interface UnsafeBlockTree extends TreeNode<'unsafe_block'> {
}
export interface UseAsClauseTree extends TreeNode<'use_as_clause'> {
}
export interface UseBoundsTree extends TreeNode<'use_bounds'> {
}
export interface UseDeclarationTree extends TreeNode<'use_declaration'> {
}
export interface UseListTree extends TreeNode<'use_list'> {
}
export interface UseWildcardTree extends TreeNode<'use_wildcard'> {
}
export interface VariadicParameterTree extends TreeNode<'variadic_parameter'> {
}
export interface VisibilityModifierCrateTree extends TreeNode<'visibility_modifier_crate'> {
}
export interface VisibilityModifierTree extends TreeNode<'visibility_modifier'> {
}
export interface VisibilityModifierUFormInPathTree extends TreeNode<'visibility_modifier'> {
}
export interface VisibilityModifierUFormCrateTree extends TreeNode<'visibility_modifier'> {
}
export interface VisibilityModifierUFormPubTree extends TreeNode<'visibility_modifier'> {
}
export interface WhereClauseTree extends TreeNode<'where_clause'> {
}
export interface WherePredicateTree extends TreeNode<'where_predicate'> {
}
export interface WhileExpressionTree extends TreeNode<'while_expression'> {
}
export interface YieldExpressionTree extends TreeNode<'yield_expression'> {
}
export interface RangeExpressionBinaryOperatorTree extends AnyTreeNode {
    readonly type: "__range_expression_binary_operator";
}
export interface VisibilityModifierInPathInTree extends AnyTreeNode {
    readonly type: "__visibility_modifier_in_path_in";
}
export interface VisibilityModifierPubPubTree extends AnyTreeNode {
    readonly type: "__visibility_modifier_pub_pub";
}
export interface BinaryExpressionOperatorTree extends AnyTreeNode {
    readonly type: "_binary_expression_operator";
}
export interface ClosureExpressionAsyncMarkerTree extends AnyTreeNode {
    readonly type: "_closure_expression_async_marker";
}
export interface ClosureExpressionStaticMarkerTree extends AnyTreeNode {
    readonly type: "_closure_expression_static_marker";
}
export interface CompoundAssignmentExprOperatorTree extends AnyTreeNode {
    readonly type: "_compound_assignment_expr_operator";
}
export interface _CrateTree extends AnyTreeNode {
    readonly type: "_crate";
}
export interface GenericTypeWithTurbofishTurbofishTree extends AnyTreeNode {
    readonly type: "_generic_type_with_turbofish_turbofish";
}
export interface ImplItemNegativeTree extends AnyTreeNode {
    readonly type: "_impl_item_negative";
}
export interface LineCommentContentTree extends AnyTreeNode {
    readonly type: "_line_comment_content";
}
export interface LineCommentRegularDslashTree extends AnyTreeNode {
    readonly type: "_line_comment_regular_dslash";
}
export interface MoveMarkerTree extends AnyTreeNode {
    readonly type: "_move_marker";
}
export interface _MutableSpecifierTree extends AnyTreeNode {
    readonly type: "_mutable_specifier";
}
export interface OperatorTree extends AnyTreeNode {
    readonly type: "_operator";
}
export interface PrimitiveTypeTree extends AnyTreeNode {
    readonly type: "_primitive_type";
}
export interface RefMarkerTree extends AnyTreeNode {
    readonly type: "_ref_marker";
}
export interface ReferenceExpressionRawConstTree extends AnyTreeNode {
    readonly type: "_reference_expression_raw_const";
}
export interface _SelfTree extends AnyTreeNode {
    readonly type: "_self";
}
export interface TokenBindingPatternTypeTree extends AnyTreeNode {
    readonly type: "_token_binding_pattern_type";
}
export interface UnaryExpressionOperatorTree extends AnyTreeNode {
    readonly type: "_unary_expression_operator";
}
export interface UnsafeMarkerTree extends AnyTreeNode {
    readonly type: "_unsafe_marker";
}
export interface BooleanLiteralTree extends TreeNode<'boolean_literal'> {
}
export interface CharLiteralTree extends TreeNode<'char_literal'> {
}
export interface CrateTree extends AnyTreeNode {
    readonly type: "crate";
}
export interface EscapeSequenceTree extends TreeNode<'escape_sequence'> {
}
export interface FragmentSpecifierTree extends TreeNode<'fragment_specifier'> {
}
export interface IdentifierTree extends TreeNode<'identifier'> {
}
export interface IntegerLiteralTree extends TreeNode<'integer_literal'> {
}
export interface MetavariableTree extends TreeNode<'metavariable'> {
}
export interface MutableSpecifierTree extends AnyTreeNode {
    readonly type: "mutable_specifier";
}
export interface SelfTree extends AnyTreeNode {
    readonly type: "self";
}
export interface ShebangTree extends TreeNode<'shebang'> {
}
export interface SuperTree extends AnyTreeNode {
    readonly type: "super";
}
export interface UnitExpressionTree extends TreeNode<'unit_expression'> {
}
export interface UnitTypeTree extends TreeNode<'unit_type'> {
}
export interface StringContentTree extends TreeNode<'string_content'> {
}
export interface RawStringLiteralContentTree extends AnyTreeNode {
    readonly type: "raw_string_literal_content";
}
export interface FloatLiteralTree extends TreeNode<'float_literal'> {
}
export interface OuterBlockDocCommentMarkerTree extends AnyTreeNode {
    readonly type: "_outer_block_doc_comment_marker";
}
export interface InnerBlockDocCommentMarkerTree extends AnyTreeNode {
    readonly type: "_inner_block_doc_comment_marker";
}
export interface LineDocContentTree extends AnyTreeNode {
    readonly type: "_line_doc_content";
}
export interface ErrorSentinelTree extends AnyTreeNode {
    readonly type: "_error_sentinel";
}
export interface FnTree extends AnyTreeNode {
    readonly type: "fn";
}
export interface AsyncTree extends AnyTreeNode {
    readonly type: "async";
}
export interface InTree extends AnyTreeNode {
    readonly type: "in";
}
export interface MoveTree extends AnyTreeNode {
    readonly type: "move";
}
export interface PubTree extends AnyTreeNode {
    readonly type: "pub";
}
export interface RefTree extends AnyTreeNode {
    readonly type: "ref";
}
export interface StaticTree extends AnyTreeNode {
    readonly type: "static";
}
export interface UnsafeTree extends AnyTreeNode {
    readonly type: "unsafe";
}
export interface AsTree extends AnyTreeNode {
    readonly type: "as";
}
export interface AwaitTree extends AnyTreeNode {
    readonly type: "await";
}
export interface BreakTree extends AnyTreeNode {
    readonly type: "break";
}
export interface ConstTree extends AnyTreeNode {
    readonly type: "const";
}
export interface ContinueTree extends AnyTreeNode {
    readonly type: "continue";
}
export interface DefaultTree extends AnyTreeNode {
    readonly type: "default";
}
export interface EnumTree extends AnyTreeNode {
    readonly type: "enum";
}
export interface ForTree extends AnyTreeNode {
    readonly type: "for";
}
export interface GenTree extends AnyTreeNode {
    readonly type: "gen";
}
export interface IfTree extends AnyTreeNode {
    readonly type: "if";
}
export interface ImplTree extends AnyTreeNode {
    readonly type: "impl";
}
export interface LetTree extends AnyTreeNode {
    readonly type: "let";
}
export interface LoopTree extends AnyTreeNode {
    readonly type: "loop";
}
export interface MatchTree extends AnyTreeNode {
    readonly type: "match";
}
export interface ModTree extends AnyTreeNode {
    readonly type: "mod";
}
export interface ReturnTree extends AnyTreeNode {
    readonly type: "return";
}
export interface StructTree extends AnyTreeNode {
    readonly type: "struct";
}
export interface TraitTree extends AnyTreeNode {
    readonly type: "trait";
}
export interface TypeTree extends AnyTreeNode {
    readonly type: "type";
}
export interface UnionTree extends AnyTreeNode {
    readonly type: "union";
}
export interface UseTree extends AnyTreeNode {
    readonly type: "use";
}
export interface WhereTree extends AnyTreeNode {
    readonly type: "where";
}
export interface WhileTree extends AnyTreeNode {
    readonly type: "while";
}
export interface RawTree extends AnyTreeNode {
    readonly type: "raw";
}
export interface DynTree extends AnyTreeNode {
    readonly type: "dyn";
}
export interface ElseTree extends AnyTreeNode {
    readonly type: "else";
}
export interface ExternTree extends AnyTreeNode {
    readonly type: "extern";
}
export interface MutTree extends AnyTreeNode {
    readonly type: "mut";
}
export interface TryTree extends AnyTreeNode {
    readonly type: "try";
}
export interface YieldTree extends AnyTreeNode {
    readonly type: "yield";
}
export type Condition = UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression | LetCondition | LetChain;
export type ConditionTree = UnaryExpressionTree | ReferenceExpressionTree | TryExpressionTree | BinaryExpressionTree | AssignmentExpressionTree | CompoundAssignmentExprTree | TypeCastExpressionTree | CallExpressionTree | ReturnExpressionTree | YieldExpressionTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | SelfTree | ScopedIdentifierTree | GenericFunctionTree | AwaitExpressionTree | FieldExpressionTree | ArrayExpressionTree | TupleExpressionTree | MacroInvocationTree | UnitExpressionTree | BreakExpressionTree | ContinueExpressionTree | IndexExpressionTree | MetavariableTree | ClosureExpressionTree | ParenthesizedExpressionTree | StructExpressionTree | UnsafeBlockTree | AsyncBlockTree | GenBlockTree | TryBlockTree | BlockTree | IfExpressionTree | MatchExpressionTree | WhileExpressionTree | LoopExpressionTree | ForExpressionTree | ConstBlockTree | RangeExpressionTree | LetConditionTree | LetChainTree;
export type DeclarationStatement = ConstItem | MacroInvocation | MacroDefinition | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem;
export type DeclarationStatementTree = ConstItemTree | MacroInvocationTree | MacroDefinitionTree | AttributeItemTree | InnerAttributeItemTree | ModItemTree | ForeignModItemTree | StructItemTree | UnionItemTree | EnumItemTree | TypeItemTree | FunctionItemTree | FunctionSignatureItemTree | ImplItemTree | TraitItemTree | AssociatedTypeTree | LetDeclarationTree | UseDeclarationTree | ExternCrateDeclarationTree | StaticItemTree;
export type DelimTokens = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | DelimTokenTree;
export type DelimTokensTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree | DelimTokenTreeTree;
export type Expression = UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock | RangeExpression;
export type ExpressionTree = UnaryExpressionTree | ReferenceExpressionTree | TryExpressionTree | BinaryExpressionTree | AssignmentExpressionTree | CompoundAssignmentExprTree | TypeCastExpressionTree | CallExpressionTree | ReturnExpressionTree | YieldExpressionTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | SelfTree | ScopedIdentifierTree | GenericFunctionTree | AwaitExpressionTree | FieldExpressionTree | ArrayExpressionTree | TupleExpressionTree | MacroInvocationTree | UnitExpressionTree | BreakExpressionTree | ContinueExpressionTree | IndexExpressionTree | MetavariableTree | ClosureExpressionTree | ParenthesizedExpressionTree | StructExpressionTree | UnsafeBlockTree | AsyncBlockTree | GenBlockTree | TryBlockTree | BlockTree | IfExpressionTree | MatchExpressionTree | WhileExpressionTree | LoopExpressionTree | ForExpressionTree | ConstBlockTree | RangeExpressionTree;
export type ExpressionEndingWithBlock = UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock;
export type ExpressionEndingWithBlockTree = UnsafeBlockTree | AsyncBlockTree | GenBlockTree | TryBlockTree | BlockTree | IfExpressionTree | MatchExpressionTree | WhileExpressionTree | LoopExpressionTree | ForExpressionTree | ConstBlockTree;
export type ExpressionExceptRange = UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock;
export type ExpressionExceptRangeTree = UnaryExpressionTree | ReferenceExpressionTree | TryExpressionTree | BinaryExpressionTree | AssignmentExpressionTree | CompoundAssignmentExprTree | TypeCastExpressionTree | CallExpressionTree | ReturnExpressionTree | YieldExpressionTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | SelfTree | ScopedIdentifierTree | GenericFunctionTree | AwaitExpressionTree | FieldExpressionTree | ArrayExpressionTree | TupleExpressionTree | MacroInvocationTree | UnitExpressionTree | BreakExpressionTree | ContinueExpressionTree | IndexExpressionTree | MetavariableTree | ClosureExpressionTree | ParenthesizedExpressionTree | StructExpressionTree | UnsafeBlockTree | AsyncBlockTree | GenBlockTree | TryBlockTree | BlockTree | IfExpressionTree | MatchExpressionTree | WhileExpressionTree | LoopExpressionTree | ForExpressionTree | ConstBlockTree;
export type Literal = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral;
export type LiteralTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree;
export type LiteralPattern = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral;
export type LiteralPatternTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | NegativeLiteralTree;
export type NonDelimToken = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type NonDelimTokenTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type Path = Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier;
export type PathTree = SelfTree | IdentifierTree | MetavariableTree | SuperTree | CrateTree | ScopedIdentifierTree;
export type Pattern = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation;
export type PatternTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | NegativeLiteralTree | IdentifierTree | ScopedIdentifierTree | GenericPatternTree | TuplePatternTree | TupleStructPatternTree | StructPatternTree | RefPatternTree | SlicePatternTree | CapturedPatternTree | ReferencePatternTree | MutPatternTree | RangePatternTree | OrPatternTree | ConstBlockTree | MacroInvocationTree;
export type Statement = ExpressionStatement | ConstItem | MacroInvocation | MacroDefinition | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem;
export type StatementTree = ExpressionStatementTree | ConstItemTree | MacroInvocationTree | MacroDefinitionTree | AttributeItemTree | InnerAttributeItemTree | ModItemTree | ForeignModItemTree | StructItemTree | UnionItemTree | EnumItemTree | TypeItemTree | FunctionItemTree | FunctionSignatureItemTree | ImplItemTree | TraitItemTree | AssociatedTypeTree | LetDeclarationTree | UseDeclarationTree | ExternCrateDeclarationTree | StaticItemTree;
export type TokenPattern = TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type TokenPatternTree = TokenTreePatternTree | TokenRepetitionPatternTree | TokenBindingPatternTree | MetavariableTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type Tokens = TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type TokensTree = TokenTreeTree | TokenRepetitionTree | MetavariableTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type _Type = AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | Identifier | MacroInvocation | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType;
export type _TypeTree = AbstractTypeTree | ReferenceTypeTree | MetavariableTree | PointerTypeTree | GenericTypeTree | ScopedTypeIdentifierTree | TupleTypeTree | UnitTypeTree | ArrayTypeTree | FunctionTypeTree | IdentifierTree | MacroInvocationTree | DynamicTypeTree | BoundedTypeTree | RemovedTraitBoundTree | PrimitiveTypeTree;
export type UseClause = Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard;
export type UseClauseTree = SelfTree | IdentifierTree | MetavariableTree | SuperTree | CrateTree | ScopedIdentifierTree | UseAsClauseTree | UseListTree | ScopedUseListTree | UseWildcardTree;
export type EmptyStatement = Terminal<TSKindId.EmptyStatement>;
export interface EmptyStatementTree extends AnyTreeNode {
    readonly type: "empty_statement";
}
export type NeverType = Terminal<TSKindId.NeverType>;
export interface NeverTypeTree extends AnyTreeNode {
    readonly type: "never_type";
}
export type RemainingFieldPattern = Terminal<TSKindId.RemainingFieldPattern>;
export interface RemainingFieldPatternTree extends AnyTreeNode {
    readonly type: "remaining_field_pattern";
}
export type RustNode = ArrayExpressionList | ArrayExpressionSemi | ClosureExpressionBlock | _ClosureExpressionExpr | _DelimTokenTreeBrace | _DelimTokenTreeBracket | _DelimTokenTreeParen | _ExpressionStatementBlockEnding | _ExpressionStatementWithSemi | FieldIdentifier | FieldPatternNamed | _FieldPatternShorthand | _ForeignModItemBody | FunctionTypeFnForm | FunctionTypeTraitForm | _ImplItemBody | LetChain | LineCommentDoc | _MacroDefinitionBrace | _MacroDefinitionBracket | _MacroDefinitionParen | _MatchArmBlockEnding | MatchArmWithComma | _ModItemInline | NonSpecialToken | OrPatternBinary | OrPatternPrefix | _PointerTypeMut | _RangeExpressionBare | RangeExpressionBinary | RangeExpressionPostfix | RangeExpressionPrefix | RangePatternLeftWithRight | RangePatternPrefix | ReferenceExpressionRawMut | ReservedIdentifier | StructItemBrace | StructItemTuple | _TokenTreeBrace | _TokenTreeBracket | _TokenTreeParen | _TokenTreePatternBrace | _TokenTreePatternBracket | _TokenTreePatternParen | TypeIdentifier | _VisibilityModifierCrate | VisibilityModifierInPath | VisibilityModifierPub | AbstractType | Arguments | ArrayExpression | ArrayType | AssignmentExpression | AssociatedType | AsyncBlock | Attribute | AttributeItem | AwaitExpression | BaseFieldInitializer | BinaryExpression | Block | BlockComment | BoundedType | BracketedType | BreakExpression | CallExpression | CapturedPattern | ClosureExpressionExpr | ClosureExpression | ClosureParameters | Comment | CompoundAssignmentExpr | ConstBlock | ConstItem | ConstParameter | ContinueExpression | DeclarationList | DelimTokenTreeParen | DelimTokenTreeBracket | DelimTokenTreeBrace | DelimTokenTree | DynamicType | ElseClause | EnumItem | EnumVariant | EnumVariantList | ExpressionStatementWithSemi | ExpressionStatementBlockEnding | ExpressionStatement | ExternCrateDeclaration | ExternModifier | FieldDeclaration | FieldDeclarationList | FieldExpression | FieldInitializer | FieldInitializerList | FieldPatternShorthand | FieldPattern | ForExpression | ForLifetimes | ForeignModItemBody | ForeignModItem | FunctionItem | FunctionModifiers | FunctionSignatureItem | FunctionType | GenBlock | GenericFunction | GenericPattern | GenericType | GenericTypeWithTurbofish | HigherRankedTraitBound | IfExpression | ImplItemBody | ImplItem | IndexExpression | InnerAttributeItem | Label | LastMatchArm | LetCondition | LetDeclaration | Lifetime | LifetimeParameter | LineComment | LoopExpression | MacroDefinitionParen | MacroDefinitionBracket | MacroDefinitionBrace | MacroDefinition | MacroInvocation | MacroRule | MatchArmBlockEnding | MatchArm | MatchBlock | MatchExpression | MatchPattern | ModItemInline | ModItem | MutPattern | NegativeLiteral | OrPattern | OrderedFieldDeclarationList | Parameter | Parameters | ParenthesizedExpression | PointerTypeMut | PointerType | QualifiedType | RangeExpressionBare | RangeExpression | RangePattern | RawStringLiteral | RefPattern | ReferenceExpression | ReferencePattern | ReferenceType | RemovedTraitBound | ReturnExpression | ScopedIdentifier | ScopedTypeIdentifier | ScopedTypeIdentifierInExpressionPosition | ScopedUseList | SelfParameter | ShorthandFieldInitializer | SlicePattern | SourceFile | StaticItem | StringLiteral | StructExpression | StructItem | StructPattern | TokenBindingPattern | TokenRepetition | TokenRepetitionPattern | TokenTreeParen | TokenTreeBracket | TokenTreeBrace | TokenTree | TokenTreePatternParen | TokenTreePatternBracket | TokenTreePatternBrace | TokenTreePattern | TraitBounds | TraitItem | TryBlock | TryExpression | TupleExpression | TuplePattern | TupleStructPattern | TupleType | TypeArguments | TypeBinding | TypeCastExpression | TypeItem | TypeParameter | TypeParameters | UnaryExpression | UnionItem | UnsafeBlock | UseAsClause | UseBounds | UseDeclaration | UseList | UseWildcard | VariadicParameter | VisibilityModifierCrate | VisibilityModifier | WhereClause | WherePredicate | WhileExpression | YieldExpression;
export interface KindMap {
    '_array_expression_list': ArrayExpressionList;
    '_array_expression_semi': ArrayExpressionSemi;
    '_closure_expression_block': ClosureExpressionBlock;
    '_closure_expression_expr': _ClosureExpressionExpr;
    '_delim_token_tree_brace': _DelimTokenTreeBrace;
    '_delim_token_tree_bracket': _DelimTokenTreeBracket;
    '_delim_token_tree_paren': _DelimTokenTreeParen;
    '_expression_statement_block_ending': _ExpressionStatementBlockEnding;
    '_expression_statement_with_semi': _ExpressionStatementWithSemi;
    '_field_identifier': FieldIdentifier;
    '_field_pattern_named': FieldPatternNamed;
    '_field_pattern_shorthand': _FieldPatternShorthand;
    '_foreign_mod_item_body': _ForeignModItemBody;
    '_function_type_fn_form': FunctionTypeFnForm;
    '_function_type_trait_form': FunctionTypeTraitForm;
    '_impl_item_body': _ImplItemBody;
    '_let_chain': LetChain;
    '_line_comment_doc': LineCommentDoc;
    '_macro_definition_brace': _MacroDefinitionBrace;
    '_macro_definition_bracket': _MacroDefinitionBracket;
    '_macro_definition_paren': _MacroDefinitionParen;
    '_match_arm_block_ending': _MatchArmBlockEnding;
    '_match_arm_with_comma': MatchArmWithComma;
    '_mod_item_inline': _ModItemInline;
    '_non_special_token': NonSpecialToken;
    '_or_pattern_binary': OrPatternBinary;
    '_or_pattern_prefix': OrPatternPrefix;
    '_pointer_type_mut': _PointerTypeMut;
    '_range_expression_bare': _RangeExpressionBare;
    '_range_expression_binary': RangeExpressionBinary;
    '_range_expression_postfix': RangeExpressionPostfix;
    '_range_expression_prefix': RangeExpressionPrefix;
    '_range_pattern_left_with_right': RangePatternLeftWithRight;
    '_range_pattern_prefix': RangePatternPrefix;
    '_reference_expression_raw_mut': ReferenceExpressionRawMut;
    '_reserved_identifier': ReservedIdentifier;
    '_struct_item_brace': StructItemBrace;
    '_struct_item_tuple': StructItemTuple;
    '_token_tree_brace': _TokenTreeBrace;
    '_token_tree_bracket': _TokenTreeBracket;
    '_token_tree_paren': _TokenTreeParen;
    '_token_tree_pattern_brace': _TokenTreePatternBrace;
    '_token_tree_pattern_bracket': _TokenTreePatternBracket;
    '_token_tree_pattern_paren': _TokenTreePatternParen;
    '_type_identifier': TypeIdentifier;
    '_visibility_modifier_crate': _VisibilityModifierCrate;
    '_visibility_modifier_in_path': VisibilityModifierInPath;
    '_visibility_modifier_pub': VisibilityModifierPub;
    'abstract_type': AbstractType;
    'arguments': Arguments;
    'array_expression': ArrayExpression;
    'array_type': ArrayType;
    'assignment_expression': AssignmentExpression;
    'associated_type': AssociatedType;
    'async_block': AsyncBlock;
    'attribute': Attribute;
    'attribute_item': AttributeItem;
    'await_expression': AwaitExpression;
    'base_field_initializer': BaseFieldInitializer;
    'binary_expression': BinaryExpression;
    'block': Block;
    'block_comment': BlockComment;
    'bounded_type': BoundedType;
    'bracketed_type': BracketedType;
    'break_expression': BreakExpression;
    'call_expression': CallExpression;
    'captured_pattern': CapturedPattern;
    'closure_expression_expr': ClosureExpressionExpr;
    'closure_expression': ClosureExpression;
    'closure_parameters': ClosureParameters;
    'comment': Comment;
    'compound_assignment_expr': CompoundAssignmentExpr;
    'const_block': ConstBlock;
    'const_item': ConstItem;
    'const_parameter': ConstParameter;
    'continue_expression': ContinueExpression;
    'declaration_list': DeclarationList;
    'delim_token_tree_paren': DelimTokenTreeParen;
    'delim_token_tree_bracket': DelimTokenTreeBracket;
    'delim_token_tree_brace': DelimTokenTreeBrace;
    'delim_token_tree': DelimTokenTree;
    'dynamic_type': DynamicType;
    'else_clause': ElseClause;
    'enum_item': EnumItem;
    'enum_variant': EnumVariant;
    'enum_variant_list': EnumVariantList;
    'expression_statement_with_semi': ExpressionStatementWithSemi;
    'expression_statement_block_ending': ExpressionStatementBlockEnding;
    'expression_statement': ExpressionStatement;
    'extern_crate_declaration': ExternCrateDeclaration;
    'extern_modifier': ExternModifier;
    'field_declaration': FieldDeclaration;
    'field_declaration_list': FieldDeclarationList;
    'field_expression': FieldExpression;
    'field_initializer': FieldInitializer;
    'field_initializer_list': FieldInitializerList;
    'field_pattern_shorthand': FieldPatternShorthand;
    'field_pattern': FieldPattern;
    'for_expression': ForExpression;
    'for_lifetimes': ForLifetimes;
    'foreign_mod_item_body': ForeignModItemBody;
    'foreign_mod_item': ForeignModItem;
    'function_item': FunctionItem;
    'function_modifiers': FunctionModifiers;
    'function_signature_item': FunctionSignatureItem;
    'function_type': FunctionType;
    'gen_block': GenBlock;
    'generic_function': GenericFunction;
    'generic_pattern': GenericPattern;
    'generic_type': GenericType;
    'generic_type_with_turbofish': GenericTypeWithTurbofish;
    'higher_ranked_trait_bound': HigherRankedTraitBound;
    'if_expression': IfExpression;
    'impl_item_body': ImplItemBody;
    'impl_item': ImplItem;
    'index_expression': IndexExpression;
    'inner_attribute_item': InnerAttributeItem;
    'label': Label;
    'last_match_arm': LastMatchArm;
    'let_condition': LetCondition;
    'let_declaration': LetDeclaration;
    'lifetime': Lifetime;
    'lifetime_parameter': LifetimeParameter;
    'line_comment': LineComment;
    'loop_expression': LoopExpression;
    'macro_definition_paren': MacroDefinitionParen;
    'macro_definition_bracket': MacroDefinitionBracket;
    'macro_definition_brace': MacroDefinitionBrace;
    'macro_definition': MacroDefinition;
    'macro_invocation': MacroInvocation;
    'macro_rule': MacroRule;
    'match_arm_block_ending': MatchArmBlockEnding;
    'match_arm': MatchArm;
    'match_block': MatchBlock;
    'match_expression': MatchExpression;
    'match_pattern': MatchPattern;
    'mod_item_inline': ModItemInline;
    'mod_item': ModItem;
    'mut_pattern': MutPattern;
    'negative_literal': NegativeLiteral;
    'or_pattern': OrPattern;
    'ordered_field_declaration_list': OrderedFieldDeclarationList;
    'parameter': Parameter;
    'parameters': Parameters;
    'parenthesized_expression': ParenthesizedExpression;
    'pointer_type_mut': PointerTypeMut;
    'pointer_type': PointerType;
    'qualified_type': QualifiedType;
    'range_expression_bare': RangeExpressionBare;
    'range_expression': RangeExpression;
    'range_pattern': RangePattern;
    'raw_string_literal': RawStringLiteral;
    'ref_pattern': RefPattern;
    'reference_expression': ReferenceExpression;
    'reference_pattern': ReferencePattern;
    'reference_type': ReferenceType;
    'removed_trait_bound': RemovedTraitBound;
    'return_expression': ReturnExpression;
    'scoped_identifier': ScopedIdentifier;
    'scoped_type_identifier': ScopedTypeIdentifier;
    'scoped_type_identifier_in_expression_position': ScopedTypeIdentifierInExpressionPosition;
    'scoped_use_list': ScopedUseList;
    'self_parameter': SelfParameter;
    'shorthand_field_initializer': ShorthandFieldInitializer;
    'slice_pattern': SlicePattern;
    'source_file': SourceFile;
    'static_item': StaticItem;
    'string_literal': StringLiteral;
    'struct_expression': StructExpression;
    'struct_item': StructItem;
    'struct_pattern': StructPattern;
    'token_binding_pattern': TokenBindingPattern;
    'token_repetition': TokenRepetition;
    'token_repetition_pattern': TokenRepetitionPattern;
    'token_tree_paren': TokenTreeParen;
    'token_tree_bracket': TokenTreeBracket;
    'token_tree_brace': TokenTreeBrace;
    'token_tree': TokenTree;
    'token_tree_pattern_paren': TokenTreePatternParen;
    'token_tree_pattern_bracket': TokenTreePatternBracket;
    'token_tree_pattern_brace': TokenTreePatternBrace;
    'token_tree_pattern': TokenTreePattern;
    'trait_bounds': TraitBounds;
    'trait_item': TraitItem;
    'try_block': TryBlock;
    'try_expression': TryExpression;
    'tuple_expression': TupleExpression;
    'tuple_pattern': TuplePattern;
    'tuple_struct_pattern': TupleStructPattern;
    'tuple_type': TupleType;
    'type_arguments': TypeArguments;
    'type_binding': TypeBinding;
    'type_cast_expression': TypeCastExpression;
    'type_item': TypeItem;
    'type_parameter': TypeParameter;
    'type_parameters': TypeParameters;
    'unary_expression': UnaryExpression;
    'union_item': UnionItem;
    'unsafe_block': UnsafeBlock;
    'use_as_clause': UseAsClause;
    'use_bounds': UseBounds;
    'use_declaration': UseDeclaration;
    'use_list': UseList;
    'use_wildcard': UseWildcard;
    'variadic_parameter': VariadicParameter;
    'visibility_modifier_crate': VisibilityModifierCrate;
    'visibility_modifier': VisibilityModifier;
    'where_clause': WhereClause;
    'where_predicate': WherePredicate;
    'while_expression': WhileExpression;
    'yield_expression': YieldExpression;
    '__range_expression_binary_operator': RangeExpressionBinaryOperator;
    '__visibility_modifier_in_path_in': VisibilityModifierInPathIn;
    '__visibility_modifier_pub_pub': VisibilityModifierPubPub;
    '_binary_expression_operator': BinaryExpressionOperator;
    '_closure_expression_async_marker': ClosureExpressionAsyncMarker;
    '_closure_expression_static_marker': ClosureExpressionStaticMarker;
    '_compound_assignment_expr_operator': CompoundAssignmentExprOperator;
    '_crate': _Crate;
    '_generic_type_with_turbofish_turbofish': GenericTypeWithTurbofishTurbofish;
    '_impl_item_negative': ImplItemNegative;
    '_line_comment_content': LineCommentContent;
    '_line_comment_regular_dslash': LineCommentRegularDslash;
    '_move_marker': MoveMarker;
    '_mutable_specifier': _MutableSpecifier;
    '_operator': Operator;
    '_primitive_type': PrimitiveType;
    '_ref_marker': RefMarker;
    '_reference_expression_raw_const': ReferenceExpressionRawConst;
    '_self': _Self;
    '_token_binding_pattern_type': TokenBindingPatternType;
    '_unary_expression_operator': UnaryExpressionOperator;
    '_unsafe_marker': UnsafeMarker;
    'boolean_literal': BooleanLiteral;
    'char_literal': CharLiteral;
    'crate': Crate;
    'escape_sequence': EscapeSequence;
    'fragment_specifier': FragmentSpecifier;
    'identifier': Identifier;
    'integer_literal': IntegerLiteral;
    'metavariable': Metavariable;
    'mutable_specifier': MutableSpecifier;
    'self': Self;
    'shebang': Shebang;
    'super': Super;
    'unit_expression': UnitExpression;
    'unit_type': UnitType;
    'string_content': StringContent;
    'raw_string_literal_content': RawStringLiteralContent;
    'float_literal': FloatLiteral;
    '_outer_block_doc_comment_marker': OuterBlockDocCommentMarker;
    '_inner_block_doc_comment_marker': InnerBlockDocCommentMarker;
    '_line_doc_content': LineDocContent;
    '_error_sentinel': ErrorSentinel;
}
export interface VariantMap {
    'array_expression': {
        semi: ArrayExpressionUFormSemi;
        list: ArrayExpressionUFormList;
    };
    'closure_expression': {
        block: ClosureExpressionUFormBlock;
        expr: ClosureExpressionUFormExpr;
    };
    'delim_token_tree': {
        paren: DelimTokenTreeUFormParen;
        bracket: DelimTokenTreeUFormBracket;
        brace: DelimTokenTreeUFormBrace;
    };
    'expression_statement': {
        with_semi: ExpressionStatementUFormWithSemi;
        block_ending: ExpressionStatementUFormBlockEnding;
    };
    'field_pattern': {
        shorthand: FieldPatternUFormShorthand;
        named: FieldPatternUFormNamed;
    };
    'foreign_mod_item': {
        semi: ForeignModItemUFormSemi;
        body: ForeignModItemUFormBody;
    };
    'impl_item': {
        body: ImplItemUFormBody;
        semi: ImplItemUFormSemi;
    };
    'line_comment': {
        regular_dslash: LineCommentUFormRegularDslash;
        doc: LineCommentUFormDoc;
        content: LineCommentUFormContent;
    };
    'macro_definition': {
        paren: MacroDefinitionUFormParen;
        bracket: MacroDefinitionUFormBracket;
        brace: MacroDefinitionUFormBrace;
    };
    'match_arm': {
        with_comma: MatchArmUFormWithComma;
        block_ending: MatchArmUFormBlockEnding;
    };
    'mod_item': {
        external: ModItemUFormExternal;
        inline: ModItemUFormInline;
    };
    'or_pattern': {
        binary: OrPatternUFormBinary;
        prefix: OrPatternUFormPrefix;
    };
    'pointer_type': {
        const: PointerTypeUFormConst;
        mut: PointerTypeUFormMut;
    };
    'range_expression': {
        binary: RangeExpressionUFormBinary;
        postfix: RangeExpressionUFormPostfix;
        prefix: RangeExpressionUFormPrefix;
        bare: RangeExpressionUFormBare;
    };
    'range_pattern': {
        left_with_right: RangePatternUFormLeftWithRight;
        left_bare: RangePatternUFormLeftBare;
        prefix: RangePatternUFormPrefix;
    };
    'struct_item': {
        brace: StructItemUFormBrace;
        tuple: StructItemUFormTuple;
        unit: StructItemUFormUnit;
    };
    'token_tree': {
        paren: TokenTreeUFormParen;
        bracket: TokenTreeUFormBracket;
        brace: TokenTreeUFormBrace;
    };
    'token_tree_pattern': {
        paren: TokenTreePatternUFormParen;
        bracket: TokenTreePatternUFormBracket;
        brace: TokenTreePatternUFormBrace;
    };
    'visibility_modifier': {
        in_path: VisibilityModifierUFormInPath;
        crate: VisibilityModifierUFormCrate;
        pub: VisibilityModifierUFormPub;
    };
}
export interface ArrayExpressionListNs extends NodeNs<ArrayExpressionList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayExpressionSemiNs extends NodeNs<ArrayExpressionSemi, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClosureExpressionBlockNs extends NodeNs<ClosureExpressionBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ClosureExpressionExprNs extends NodeNs<_ClosureExpressionExpr, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _DelimTokenTreeBraceNs extends NodeNs<_DelimTokenTreeBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _DelimTokenTreeBracketNs extends NodeNs<_DelimTokenTreeBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _DelimTokenTreeParenNs extends NodeNs<_DelimTokenTreeParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ExpressionStatementBlockEndingNs extends NodeNs<_ExpressionStatementBlockEnding, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ExpressionStatementWithSemiNs extends NodeNs<_ExpressionStatementWithSemi, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldIdentifierNs extends NodeNs<FieldIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldPatternNamedNs extends NodeNs<FieldPatternNamed, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _FieldPatternShorthandNs extends NodeNs<_FieldPatternShorthand, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ForeignModItemBodyNs extends NodeNs<_ForeignModItemBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionTypeFnFormNs extends NodeNs<FunctionTypeFnForm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionTypeTraitFormNs extends NodeNs<FunctionTypeTraitForm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ImplItemBodyNs extends NodeNs<_ImplItemBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LetChainNs extends NodeNs<LetChain, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LineCommentDocNs extends NodeNs<LineCommentDoc, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _MacroDefinitionBraceNs extends NodeNs<_MacroDefinitionBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _MacroDefinitionBracketNs extends NodeNs<_MacroDefinitionBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _MacroDefinitionParenNs extends NodeNs<_MacroDefinitionParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _MatchArmBlockEndingNs extends NodeNs<_MatchArmBlockEnding, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchArmWithCommaNs extends NodeNs<MatchArmWithComma, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _ModItemInlineNs extends NodeNs<_ModItemInline, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NonSpecialTokenNs extends NodeNs<NonSpecialToken, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OrPatternBinaryNs extends NodeNs<OrPatternBinary, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OrPatternPrefixNs extends NodeNs<OrPatternPrefix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _PointerTypeMutNs extends NodeNs<_PointerTypeMut, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _RangeExpressionBareNs extends NodeNs<_RangeExpressionBare, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangeExpressionBinaryNs extends NodeNs<RangeExpressionBinary, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangeExpressionPostfixNs extends NodeNs<RangeExpressionPostfix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangeExpressionPrefixNs extends NodeNs<RangeExpressionPrefix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangePatternLeftWithRightNs extends NodeNs<RangePatternLeftWithRight, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangePatternPrefixNs extends NodeNs<RangePatternPrefix, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReferenceExpressionRawMutNs extends NodeNs<ReferenceExpressionRawMut, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReservedIdentifierNs extends NodeNs<ReservedIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StructItemBraceNs extends NodeNs<StructItemBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StructItemTupleNs extends NodeNs<StructItemTuple, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreeBraceNs extends NodeNs<_TokenTreeBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreeBracketNs extends NodeNs<_TokenTreeBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreeParenNs extends NodeNs<_TokenTreeParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreePatternBraceNs extends NodeNs<_TokenTreePatternBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreePatternBracketNs extends NodeNs<_TokenTreePatternBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _TokenTreePatternParenNs extends NodeNs<_TokenTreePatternParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeIdentifierNs extends NodeNs<TypeIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface _VisibilityModifierCrateNs extends NodeNs<_VisibilityModifierCrate, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VisibilityModifierInPathNs extends NodeNs<VisibilityModifierInPath, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VisibilityModifierPubNs extends NodeNs<VisibilityModifierPub, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AbstractTypeNs extends NodeNs<AbstractType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArgumentsNs extends NodeNs<Arguments, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayExpressionNs extends NodeNs<ArrayExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayTypeNs extends NodeNs<ArrayType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssignmentExpressionNs extends NodeNs<AssignmentExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AssociatedTypeNs extends NodeNs<AssociatedType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AsyncBlockNs extends NodeNs<AsyncBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributeNs extends NodeNs<Attribute, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributeItemNs extends NodeNs<AttributeItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AwaitExpressionNs extends NodeNs<AwaitExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BaseFieldInitializerNs extends NodeNs<BaseFieldInitializer, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BinaryExpressionNs extends NodeNs<BinaryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BlockNs extends NodeNs<Block, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BlockCommentNs extends NodeNs<BlockComment, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BoundedTypeNs extends NodeNs<BoundedType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BracketedTypeNs extends NodeNs<BracketedType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface BreakExpressionNs extends NodeNs<BreakExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CallExpressionNs extends NodeNs<CallExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CapturedPatternNs extends NodeNs<CapturedPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClosureExpressionExprNs extends NodeNs<ClosureExpressionExpr, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClosureExpressionNs extends NodeNs<ClosureExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ClosureParametersNs extends NodeNs<ClosureParameters, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CommentNs extends NodeNs<Comment, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface CompoundAssignmentExprNs extends NodeNs<CompoundAssignmentExpr, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstBlockNs extends NodeNs<ConstBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstItemNs extends NodeNs<ConstItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ConstParameterNs extends NodeNs<ConstParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ContinueExpressionNs extends NodeNs<ContinueExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DeclarationListNs extends NodeNs<DeclarationList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DelimTokenTreeParenNs extends NodeNs<DelimTokenTreeParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DelimTokenTreeBracketNs extends NodeNs<DelimTokenTreeBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DelimTokenTreeBraceNs extends NodeNs<DelimTokenTreeBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DelimTokenTreeNs extends NodeNs<DelimTokenTree, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface DynamicTypeNs extends NodeNs<DynamicType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ElseClauseNs extends NodeNs<ElseClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumItemNs extends NodeNs<EnumItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumVariantNs extends NodeNs<EnumVariant, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface EnumVariantListNs extends NodeNs<EnumVariantList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExpressionStatementWithSemiNs extends NodeNs<ExpressionStatementWithSemi, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExpressionStatementBlockEndingNs extends NodeNs<ExpressionStatementBlockEnding, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExpressionStatementNs extends NodeNs<ExpressionStatement, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExternCrateDeclarationNs extends NodeNs<ExternCrateDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ExternModifierNs extends NodeNs<ExternModifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldDeclarationNs extends NodeNs<FieldDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldDeclarationListNs extends NodeNs<FieldDeclarationList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldExpressionNs extends NodeNs<FieldExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldInitializerNs extends NodeNs<FieldInitializer, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldInitializerListNs extends NodeNs<FieldInitializerList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldPatternShorthandNs extends NodeNs<FieldPatternShorthand, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FieldPatternNs extends NodeNs<FieldPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForExpressionNs extends NodeNs<ForExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForLifetimesNs extends NodeNs<ForLifetimes, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForeignModItemBodyNs extends NodeNs<ForeignModItemBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ForeignModItemNs extends NodeNs<ForeignModItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionItemNs extends NodeNs<FunctionItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionModifiersNs extends NodeNs<FunctionModifiers, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionSignatureItemNs extends NodeNs<FunctionSignatureItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface FunctionTypeNs extends NodeNs<FunctionType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenBlockNs extends NodeNs<GenBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenericFunctionNs extends NodeNs<GenericFunction, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenericPatternNs extends NodeNs<GenericPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenericTypeNs extends NodeNs<GenericType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface GenericTypeWithTurbofishNs extends NodeNs<GenericTypeWithTurbofish, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface HigherRankedTraitBoundNs extends NodeNs<HigherRankedTraitBound, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IfExpressionNs extends NodeNs<IfExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImplItemBodyNs extends NodeNs<ImplItemBody, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ImplItemNs extends NodeNs<ImplItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface IndexExpressionNs extends NodeNs<IndexExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface InnerAttributeItemNs extends NodeNs<InnerAttributeItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LabelNs extends NodeNs<Label, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LastMatchArmNs extends NodeNs<LastMatchArm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LetConditionNs extends NodeNs<LetCondition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LetDeclarationNs extends NodeNs<LetDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LifetimeNs extends NodeNs<Lifetime, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LifetimeParameterNs extends NodeNs<LifetimeParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LineCommentNs extends NodeNs<LineComment, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface LoopExpressionNs extends NodeNs<LoopExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroDefinitionParenNs extends NodeNs<MacroDefinitionParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroDefinitionBracketNs extends NodeNs<MacroDefinitionBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroDefinitionBraceNs extends NodeNs<MacroDefinitionBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroDefinitionNs extends NodeNs<MacroDefinition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroInvocationNs extends NodeNs<MacroInvocation, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MacroRuleNs extends NodeNs<MacroRule, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchArmBlockEndingNs extends NodeNs<MatchArmBlockEnding, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchArmNs extends NodeNs<MatchArm, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchBlockNs extends NodeNs<MatchBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchExpressionNs extends NodeNs<MatchExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MatchPatternNs extends NodeNs<MatchPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ModItemInlineNs extends NodeNs<ModItemInline, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ModItemNs extends NodeNs<ModItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface MutPatternNs extends NodeNs<MutPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NegativeLiteralNs extends NodeNs<NegativeLiteral, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OrPatternNs extends NodeNs<OrPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface OrderedFieldDeclarationListNs extends NodeNs<OrderedFieldDeclarationList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParameterNs extends NodeNs<Parameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParametersNs extends NodeNs<Parameters, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ParenthesizedExpressionNs extends NodeNs<ParenthesizedExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PointerTypeMutNs extends NodeNs<PointerTypeMut, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface PointerTypeNs extends NodeNs<PointerType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface QualifiedTypeNs extends NodeNs<QualifiedType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangeExpressionBareNs extends NodeNs<RangeExpressionBare, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangeExpressionNs extends NodeNs<RangeExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RangePatternNs extends NodeNs<RangePattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RawStringLiteralNs extends NodeNs<RawStringLiteral, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RefPatternNs extends NodeNs<RefPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReferenceExpressionNs extends NodeNs<ReferenceExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReferencePatternNs extends NodeNs<ReferencePattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReferenceTypeNs extends NodeNs<ReferenceType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface RemovedTraitBoundNs extends NodeNs<RemovedTraitBound, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ReturnExpressionNs extends NodeNs<ReturnExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ScopedIdentifierNs extends NodeNs<ScopedIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ScopedTypeIdentifierNs extends NodeNs<ScopedTypeIdentifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ScopedTypeIdentifierInExpressionPositionNs extends NodeNs<ScopedTypeIdentifierInExpressionPosition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ScopedUseListNs extends NodeNs<ScopedUseList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SelfParameterNs extends NodeNs<SelfParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ShorthandFieldInitializerNs extends NodeNs<ShorthandFieldInitializer, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SlicePatternNs extends NodeNs<SlicePattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface SourceFileNs extends NodeNs<SourceFile, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StaticItemNs extends NodeNs<StaticItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StringLiteralNs extends NodeNs<StringLiteral, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StructExpressionNs extends NodeNs<StructExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StructItemNs extends NodeNs<StructItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface StructPatternNs extends NodeNs<StructPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenBindingPatternNs extends NodeNs<TokenBindingPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenRepetitionNs extends NodeNs<TokenRepetition, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenRepetitionPatternNs extends NodeNs<TokenRepetitionPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreeParenNs extends NodeNs<TokenTreeParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreeBracketNs extends NodeNs<TokenTreeBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreeBraceNs extends NodeNs<TokenTreeBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreeNs extends NodeNs<TokenTree, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreePatternParenNs extends NodeNs<TokenTreePatternParen, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreePatternBracketNs extends NodeNs<TokenTreePatternBracket, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreePatternBraceNs extends NodeNs<TokenTreePatternBrace, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TokenTreePatternNs extends NodeNs<TokenTreePattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TraitBoundsNs extends NodeNs<TraitBounds, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TraitItemNs extends NodeNs<TraitItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TryBlockNs extends NodeNs<TryBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TryExpressionNs extends NodeNs<TryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TupleExpressionNs extends NodeNs<TupleExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TuplePatternNs extends NodeNs<TuplePattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TupleStructPatternNs extends NodeNs<TupleStructPattern, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TupleTypeNs extends NodeNs<TupleType, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeArgumentsNs extends NodeNs<TypeArguments, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeBindingNs extends NodeNs<TypeBinding, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeCastExpressionNs extends NodeNs<TypeCastExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeItemNs extends NodeNs<TypeItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeParameterNs extends NodeNs<TypeParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface TypeParametersNs extends NodeNs<TypeParameters, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UnaryExpressionNs extends NodeNs<UnaryExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UnionItemNs extends NodeNs<UnionItem, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UnsafeBlockNs extends NodeNs<UnsafeBlock, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UseAsClauseNs extends NodeNs<UseAsClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UseBoundsNs extends NodeNs<UseBounds, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UseDeclarationNs extends NodeNs<UseDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UseListNs extends NodeNs<UseList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface UseWildcardNs extends NodeNs<UseWildcard, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VariadicParameterNs extends NodeNs<VariadicParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VisibilityModifierCrateNs extends NodeNs<VisibilityModifierCrate, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface VisibilityModifierNs extends NodeNs<VisibilityModifier, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface WhereClauseNs extends NodeNs<WhereClause, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface WherePredicateNs extends NodeNs<WherePredicate, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface WhileExpressionNs extends NodeNs<WhileExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface YieldExpressionNs extends NodeNs<YieldExpression, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamespaceMap {
    '_array_expression_list': ArrayExpressionListNs;
    '_array_expression_semi': ArrayExpressionSemiNs;
    '_closure_expression_block': ClosureExpressionBlockNs;
    '_closure_expression_expr': _ClosureExpressionExprNs;
    '_delim_token_tree_brace': _DelimTokenTreeBraceNs;
    '_delim_token_tree_bracket': _DelimTokenTreeBracketNs;
    '_delim_token_tree_paren': _DelimTokenTreeParenNs;
    '_expression_statement_block_ending': _ExpressionStatementBlockEndingNs;
    '_expression_statement_with_semi': _ExpressionStatementWithSemiNs;
    '_field_identifier': FieldIdentifierNs;
    '_field_pattern_named': FieldPatternNamedNs;
    '_field_pattern_shorthand': _FieldPatternShorthandNs;
    '_foreign_mod_item_body': _ForeignModItemBodyNs;
    '_function_type_fn_form': FunctionTypeFnFormNs;
    '_function_type_trait_form': FunctionTypeTraitFormNs;
    '_impl_item_body': _ImplItemBodyNs;
    '_let_chain': LetChainNs;
    '_line_comment_doc': LineCommentDocNs;
    '_macro_definition_brace': _MacroDefinitionBraceNs;
    '_macro_definition_bracket': _MacroDefinitionBracketNs;
    '_macro_definition_paren': _MacroDefinitionParenNs;
    '_match_arm_block_ending': _MatchArmBlockEndingNs;
    '_match_arm_with_comma': MatchArmWithCommaNs;
    '_mod_item_inline': _ModItemInlineNs;
    '_non_special_token': NonSpecialTokenNs;
    '_or_pattern_binary': OrPatternBinaryNs;
    '_or_pattern_prefix': OrPatternPrefixNs;
    '_pointer_type_mut': _PointerTypeMutNs;
    '_range_expression_bare': _RangeExpressionBareNs;
    '_range_expression_binary': RangeExpressionBinaryNs;
    '_range_expression_postfix': RangeExpressionPostfixNs;
    '_range_expression_prefix': RangeExpressionPrefixNs;
    '_range_pattern_left_with_right': RangePatternLeftWithRightNs;
    '_range_pattern_prefix': RangePatternPrefixNs;
    '_reference_expression_raw_mut': ReferenceExpressionRawMutNs;
    '_reserved_identifier': ReservedIdentifierNs;
    '_struct_item_brace': StructItemBraceNs;
    '_struct_item_tuple': StructItemTupleNs;
    '_token_tree_brace': _TokenTreeBraceNs;
    '_token_tree_bracket': _TokenTreeBracketNs;
    '_token_tree_paren': _TokenTreeParenNs;
    '_token_tree_pattern_brace': _TokenTreePatternBraceNs;
    '_token_tree_pattern_bracket': _TokenTreePatternBracketNs;
    '_token_tree_pattern_paren': _TokenTreePatternParenNs;
    '_type_identifier': TypeIdentifierNs;
    '_visibility_modifier_crate': _VisibilityModifierCrateNs;
    '_visibility_modifier_in_path': VisibilityModifierInPathNs;
    '_visibility_modifier_pub': VisibilityModifierPubNs;
    'abstract_type': AbstractTypeNs;
    'arguments': ArgumentsNs;
    'array_expression': ArrayExpressionNs;
    'array_type': ArrayTypeNs;
    'assignment_expression': AssignmentExpressionNs;
    'associated_type': AssociatedTypeNs;
    'async_block': AsyncBlockNs;
    'attribute': AttributeNs;
    'attribute_item': AttributeItemNs;
    'await_expression': AwaitExpressionNs;
    'base_field_initializer': BaseFieldInitializerNs;
    'binary_expression': BinaryExpressionNs;
    'block': BlockNs;
    'block_comment': BlockCommentNs;
    'bounded_type': BoundedTypeNs;
    'bracketed_type': BracketedTypeNs;
    'break_expression': BreakExpressionNs;
    'call_expression': CallExpressionNs;
    'captured_pattern': CapturedPatternNs;
    'closure_expression_expr': ClosureExpressionExprNs;
    'closure_expression': ClosureExpressionNs;
    'closure_parameters': ClosureParametersNs;
    'comment': CommentNs;
    'compound_assignment_expr': CompoundAssignmentExprNs;
    'const_block': ConstBlockNs;
    'const_item': ConstItemNs;
    'const_parameter': ConstParameterNs;
    'continue_expression': ContinueExpressionNs;
    'declaration_list': DeclarationListNs;
    'delim_token_tree_paren': DelimTokenTreeParenNs;
    'delim_token_tree_bracket': DelimTokenTreeBracketNs;
    'delim_token_tree_brace': DelimTokenTreeBraceNs;
    'delim_token_tree': DelimTokenTreeNs;
    'dynamic_type': DynamicTypeNs;
    'else_clause': ElseClauseNs;
    'enum_item': EnumItemNs;
    'enum_variant': EnumVariantNs;
    'enum_variant_list': EnumVariantListNs;
    'expression_statement_with_semi': ExpressionStatementWithSemiNs;
    'expression_statement_block_ending': ExpressionStatementBlockEndingNs;
    'expression_statement': ExpressionStatementNs;
    'extern_crate_declaration': ExternCrateDeclarationNs;
    'extern_modifier': ExternModifierNs;
    'field_declaration': FieldDeclarationNs;
    'field_declaration_list': FieldDeclarationListNs;
    'field_expression': FieldExpressionNs;
    'field_initializer': FieldInitializerNs;
    'field_initializer_list': FieldInitializerListNs;
    'field_pattern_shorthand': FieldPatternShorthandNs;
    'field_pattern': FieldPatternNs;
    'for_expression': ForExpressionNs;
    'for_lifetimes': ForLifetimesNs;
    'foreign_mod_item_body': ForeignModItemBodyNs;
    'foreign_mod_item': ForeignModItemNs;
    'function_item': FunctionItemNs;
    'function_modifiers': FunctionModifiersNs;
    'function_signature_item': FunctionSignatureItemNs;
    'function_type': FunctionTypeNs;
    'gen_block': GenBlockNs;
    'generic_function': GenericFunctionNs;
    'generic_pattern': GenericPatternNs;
    'generic_type': GenericTypeNs;
    'generic_type_with_turbofish': GenericTypeWithTurbofishNs;
    'higher_ranked_trait_bound': HigherRankedTraitBoundNs;
    'if_expression': IfExpressionNs;
    'impl_item_body': ImplItemBodyNs;
    'impl_item': ImplItemNs;
    'index_expression': IndexExpressionNs;
    'inner_attribute_item': InnerAttributeItemNs;
    'label': LabelNs;
    'last_match_arm': LastMatchArmNs;
    'let_condition': LetConditionNs;
    'let_declaration': LetDeclarationNs;
    'lifetime': LifetimeNs;
    'lifetime_parameter': LifetimeParameterNs;
    'line_comment': LineCommentNs;
    'loop_expression': LoopExpressionNs;
    'macro_definition_paren': MacroDefinitionParenNs;
    'macro_definition_bracket': MacroDefinitionBracketNs;
    'macro_definition_brace': MacroDefinitionBraceNs;
    'macro_definition': MacroDefinitionNs;
    'macro_invocation': MacroInvocationNs;
    'macro_rule': MacroRuleNs;
    'match_arm_block_ending': MatchArmBlockEndingNs;
    'match_arm': MatchArmNs;
    'match_block': MatchBlockNs;
    'match_expression': MatchExpressionNs;
    'match_pattern': MatchPatternNs;
    'mod_item_inline': ModItemInlineNs;
    'mod_item': ModItemNs;
    'mut_pattern': MutPatternNs;
    'negative_literal': NegativeLiteralNs;
    'or_pattern': OrPatternNs;
    'ordered_field_declaration_list': OrderedFieldDeclarationListNs;
    'parameter': ParameterNs;
    'parameters': ParametersNs;
    'parenthesized_expression': ParenthesizedExpressionNs;
    'pointer_type_mut': PointerTypeMutNs;
    'pointer_type': PointerTypeNs;
    'qualified_type': QualifiedTypeNs;
    'range_expression_bare': RangeExpressionBareNs;
    'range_expression': RangeExpressionNs;
    'range_pattern': RangePatternNs;
    'raw_string_literal': RawStringLiteralNs;
    'ref_pattern': RefPatternNs;
    'reference_expression': ReferenceExpressionNs;
    'reference_pattern': ReferencePatternNs;
    'reference_type': ReferenceTypeNs;
    'removed_trait_bound': RemovedTraitBoundNs;
    'return_expression': ReturnExpressionNs;
    'scoped_identifier': ScopedIdentifierNs;
    'scoped_type_identifier': ScopedTypeIdentifierNs;
    'scoped_type_identifier_in_expression_position': ScopedTypeIdentifierInExpressionPositionNs;
    'scoped_use_list': ScopedUseListNs;
    'self_parameter': SelfParameterNs;
    'shorthand_field_initializer': ShorthandFieldInitializerNs;
    'slice_pattern': SlicePatternNs;
    'source_file': SourceFileNs;
    'static_item': StaticItemNs;
    'string_literal': StringLiteralNs;
    'struct_expression': StructExpressionNs;
    'struct_item': StructItemNs;
    'struct_pattern': StructPatternNs;
    'token_binding_pattern': TokenBindingPatternNs;
    'token_repetition': TokenRepetitionNs;
    'token_repetition_pattern': TokenRepetitionPatternNs;
    'token_tree_paren': TokenTreeParenNs;
    'token_tree_bracket': TokenTreeBracketNs;
    'token_tree_brace': TokenTreeBraceNs;
    'token_tree': TokenTreeNs;
    'token_tree_pattern_paren': TokenTreePatternParenNs;
    'token_tree_pattern_bracket': TokenTreePatternBracketNs;
    'token_tree_pattern_brace': TokenTreePatternBraceNs;
    'token_tree_pattern': TokenTreePatternNs;
    'trait_bounds': TraitBoundsNs;
    'trait_item': TraitItemNs;
    'try_block': TryBlockNs;
    'try_expression': TryExpressionNs;
    'tuple_expression': TupleExpressionNs;
    'tuple_pattern': TuplePatternNs;
    'tuple_struct_pattern': TupleStructPatternNs;
    'tuple_type': TupleTypeNs;
    'type_arguments': TypeArgumentsNs;
    'type_binding': TypeBindingNs;
    'type_cast_expression': TypeCastExpressionNs;
    'type_item': TypeItemNs;
    'type_parameter': TypeParameterNs;
    'type_parameters': TypeParametersNs;
    'unary_expression': UnaryExpressionNs;
    'union_item': UnionItemNs;
    'unsafe_block': UnsafeBlockNs;
    'use_as_clause': UseAsClauseNs;
    'use_bounds': UseBoundsNs;
    'use_declaration': UseDeclarationNs;
    'use_list': UseListNs;
    'use_wildcard': UseWildcardNs;
    'variadic_parameter': VariadicParameterNs;
    'visibility_modifier_crate': VisibilityModifierCrateNs;
    'visibility_modifier': VisibilityModifierNs;
    'where_clause': WhereClauseNs;
    'where_predicate': WherePredicateNs;
    'while_expression': WhileExpressionNs;
    'yield_expression': YieldExpressionNs;
}
export type ConfigFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Config'];
export type FluentFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Fluent'];
export type LooseFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Loose'];
export type TreeFor<K extends keyof NamespaceMap> = NamespaceMap[K]['Tree'];
export declare namespace ArrayExpressionList {
    type Config = ConfigFor<'_array_expression_list'>;
    type Fluent = FluentFor<'_array_expression_list'>;
    type Loose = LooseFor<'_array_expression_list'>;
    type Tree = TreeFor<'_array_expression_list'>;
    type Kind = '_array_expression_list';
}
export declare namespace ArrayExpressionSemi {
    type Config = ConfigFor<'_array_expression_semi'>;
    type Fluent = FluentFor<'_array_expression_semi'>;
    type Loose = LooseFor<'_array_expression_semi'>;
    type Tree = TreeFor<'_array_expression_semi'>;
    type Kind = '_array_expression_semi';
}
export declare namespace ClosureExpressionBlock {
    type Config = ConfigFor<'_closure_expression_block'>;
    type Fluent = FluentFor<'_closure_expression_block'>;
    type Loose = LooseFor<'_closure_expression_block'>;
    type Tree = TreeFor<'_closure_expression_block'>;
    type Kind = '_closure_expression_block';
}
export declare namespace _ClosureExpressionExpr {
    type Config = ConfigFor<'_closure_expression_expr'>;
    type Fluent = FluentFor<'_closure_expression_expr'>;
    type Loose = LooseFor<'_closure_expression_expr'>;
    type Tree = TreeFor<'_closure_expression_expr'>;
    type Kind = '_closure_expression_expr';
}
export declare namespace _DelimTokenTreeBrace {
    type Config = ConfigFor<'_delim_token_tree_brace'>;
    type Fluent = FluentFor<'_delim_token_tree_brace'>;
    type Loose = LooseFor<'_delim_token_tree_brace'>;
    type Tree = TreeFor<'_delim_token_tree_brace'>;
    type Kind = '_delim_token_tree_brace';
}
export declare namespace _DelimTokenTreeBracket {
    type Config = ConfigFor<'_delim_token_tree_bracket'>;
    type Fluent = FluentFor<'_delim_token_tree_bracket'>;
    type Loose = LooseFor<'_delim_token_tree_bracket'>;
    type Tree = TreeFor<'_delim_token_tree_bracket'>;
    type Kind = '_delim_token_tree_bracket';
}
export declare namespace _DelimTokenTreeParen {
    type Config = ConfigFor<'_delim_token_tree_paren'>;
    type Fluent = FluentFor<'_delim_token_tree_paren'>;
    type Loose = LooseFor<'_delim_token_tree_paren'>;
    type Tree = TreeFor<'_delim_token_tree_paren'>;
    type Kind = '_delim_token_tree_paren';
}
export declare namespace _ExpressionStatementBlockEnding {
    type Config = ConfigFor<'_expression_statement_block_ending'>;
    type Fluent = FluentFor<'_expression_statement_block_ending'>;
    type Loose = LooseFor<'_expression_statement_block_ending'>;
    type Tree = TreeFor<'_expression_statement_block_ending'>;
    type Kind = '_expression_statement_block_ending';
}
export declare namespace _ExpressionStatementWithSemi {
    type Config = ConfigFor<'_expression_statement_with_semi'>;
    type Fluent = FluentFor<'_expression_statement_with_semi'>;
    type Loose = LooseFor<'_expression_statement_with_semi'>;
    type Tree = TreeFor<'_expression_statement_with_semi'>;
    type Kind = '_expression_statement_with_semi';
}
export declare namespace FieldIdentifier {
    type Config = ConfigFor<'_field_identifier'>;
    type Fluent = FluentFor<'_field_identifier'>;
    type Loose = LooseFor<'_field_identifier'>;
    type Tree = TreeFor<'_field_identifier'>;
    type Kind = '_field_identifier';
}
export declare namespace FieldPatternNamed {
    type Config = ConfigFor<'_field_pattern_named'>;
    type Fluent = FluentFor<'_field_pattern_named'>;
    type Loose = LooseFor<'_field_pattern_named'>;
    type Tree = TreeFor<'_field_pattern_named'>;
    type Kind = '_field_pattern_named';
}
export declare namespace _FieldPatternShorthand {
    type Config = ConfigFor<'_field_pattern_shorthand'>;
    type Fluent = FluentFor<'_field_pattern_shorthand'>;
    type Loose = LooseFor<'_field_pattern_shorthand'>;
    type Tree = TreeFor<'_field_pattern_shorthand'>;
    type Kind = '_field_pattern_shorthand';
}
export declare namespace _ForeignModItemBody {
    type Config = ConfigFor<'_foreign_mod_item_body'>;
    type Fluent = FluentFor<'_foreign_mod_item_body'>;
    type Loose = LooseFor<'_foreign_mod_item_body'>;
    type Tree = TreeFor<'_foreign_mod_item_body'>;
    type Kind = '_foreign_mod_item_body';
}
export declare namespace FunctionTypeFnForm {
    type Config = ConfigFor<'_function_type_fn_form'>;
    type Fluent = FluentFor<'_function_type_fn_form'>;
    type Loose = LooseFor<'_function_type_fn_form'>;
    type Tree = TreeFor<'_function_type_fn_form'>;
    type Kind = '_function_type_fn_form';
}
export declare namespace FunctionTypeTraitForm {
    type Config = ConfigFor<'_function_type_trait_form'>;
    type Fluent = FluentFor<'_function_type_trait_form'>;
    type Loose = LooseFor<'_function_type_trait_form'>;
    type Tree = TreeFor<'_function_type_trait_form'>;
    type Kind = '_function_type_trait_form';
}
export declare namespace _ImplItemBody {
    type Config = ConfigFor<'_impl_item_body'>;
    type Fluent = FluentFor<'_impl_item_body'>;
    type Loose = LooseFor<'_impl_item_body'>;
    type Tree = TreeFor<'_impl_item_body'>;
    type Kind = '_impl_item_body';
}
export declare namespace LetChain {
    type Config = ConfigFor<'_let_chain'>;
    type Fluent = FluentFor<'_let_chain'>;
    type Loose = LooseFor<'_let_chain'>;
    type Tree = TreeFor<'_let_chain'>;
    type Kind = '_let_chain';
}
export declare namespace LineCommentDoc {
    type Config = ConfigFor<'_line_comment_doc'>;
    type Fluent = FluentFor<'_line_comment_doc'>;
    type Loose = LooseFor<'_line_comment_doc'>;
    type Tree = TreeFor<'_line_comment_doc'>;
    type Kind = '_line_comment_doc';
}
export declare namespace _MacroDefinitionBrace {
    type Config = ConfigFor<'_macro_definition_brace'>;
    type Fluent = FluentFor<'_macro_definition_brace'>;
    type Loose = LooseFor<'_macro_definition_brace'>;
    type Tree = TreeFor<'_macro_definition_brace'>;
    type Kind = '_macro_definition_brace';
}
export declare namespace _MacroDefinitionBracket {
    type Config = ConfigFor<'_macro_definition_bracket'>;
    type Fluent = FluentFor<'_macro_definition_bracket'>;
    type Loose = LooseFor<'_macro_definition_bracket'>;
    type Tree = TreeFor<'_macro_definition_bracket'>;
    type Kind = '_macro_definition_bracket';
}
export declare namespace _MacroDefinitionParen {
    type Config = ConfigFor<'_macro_definition_paren'>;
    type Fluent = FluentFor<'_macro_definition_paren'>;
    type Loose = LooseFor<'_macro_definition_paren'>;
    type Tree = TreeFor<'_macro_definition_paren'>;
    type Kind = '_macro_definition_paren';
}
export declare namespace _MatchArmBlockEnding {
    type Config = ConfigFor<'_match_arm_block_ending'>;
    type Fluent = FluentFor<'_match_arm_block_ending'>;
    type Loose = LooseFor<'_match_arm_block_ending'>;
    type Tree = TreeFor<'_match_arm_block_ending'>;
    type Kind = '_match_arm_block_ending';
}
export declare namespace MatchArmWithComma {
    type Config = ConfigFor<'_match_arm_with_comma'>;
    type Fluent = FluentFor<'_match_arm_with_comma'>;
    type Loose = LooseFor<'_match_arm_with_comma'>;
    type Tree = TreeFor<'_match_arm_with_comma'>;
    type Kind = '_match_arm_with_comma';
}
export declare namespace _ModItemInline {
    type Config = ConfigFor<'_mod_item_inline'>;
    type Fluent = FluentFor<'_mod_item_inline'>;
    type Loose = LooseFor<'_mod_item_inline'>;
    type Tree = TreeFor<'_mod_item_inline'>;
    type Kind = '_mod_item_inline';
}
export declare namespace NonSpecialToken {
    type Config = ConfigFor<'_non_special_token'>;
    type Fluent = FluentFor<'_non_special_token'>;
    type Loose = LooseFor<'_non_special_token'>;
    type Tree = TreeFor<'_non_special_token'>;
    type Kind = '_non_special_token';
}
export declare namespace OrPatternBinary {
    type Config = ConfigFor<'_or_pattern_binary'>;
    type Fluent = FluentFor<'_or_pattern_binary'>;
    type Loose = LooseFor<'_or_pattern_binary'>;
    type Tree = TreeFor<'_or_pattern_binary'>;
    type Kind = '_or_pattern_binary';
}
export declare namespace OrPatternPrefix {
    type Config = ConfigFor<'_or_pattern_prefix'>;
    type Fluent = FluentFor<'_or_pattern_prefix'>;
    type Loose = LooseFor<'_or_pattern_prefix'>;
    type Tree = TreeFor<'_or_pattern_prefix'>;
    type Kind = '_or_pattern_prefix';
}
export declare namespace _PointerTypeMut {
    type Config = ConfigFor<'_pointer_type_mut'>;
    type Fluent = FluentFor<'_pointer_type_mut'>;
    type Loose = LooseFor<'_pointer_type_mut'>;
    type Tree = TreeFor<'_pointer_type_mut'>;
    type Kind = '_pointer_type_mut';
}
export declare namespace _RangeExpressionBare {
    type Config = ConfigFor<'_range_expression_bare'>;
    type Fluent = FluentFor<'_range_expression_bare'>;
    type Loose = LooseFor<'_range_expression_bare'>;
    type Tree = TreeFor<'_range_expression_bare'>;
    type Kind = '_range_expression_bare';
}
export declare namespace RangeExpressionBinary {
    type Config = ConfigFor<'_range_expression_binary'>;
    type Fluent = FluentFor<'_range_expression_binary'>;
    type Loose = LooseFor<'_range_expression_binary'>;
    type Tree = TreeFor<'_range_expression_binary'>;
    type Kind = '_range_expression_binary';
}
export declare namespace RangeExpressionPostfix {
    type Config = ConfigFor<'_range_expression_postfix'>;
    type Fluent = FluentFor<'_range_expression_postfix'>;
    type Loose = LooseFor<'_range_expression_postfix'>;
    type Tree = TreeFor<'_range_expression_postfix'>;
    type Kind = '_range_expression_postfix';
}
export declare namespace RangeExpressionPrefix {
    type Config = ConfigFor<'_range_expression_prefix'>;
    type Fluent = FluentFor<'_range_expression_prefix'>;
    type Loose = LooseFor<'_range_expression_prefix'>;
    type Tree = TreeFor<'_range_expression_prefix'>;
    type Kind = '_range_expression_prefix';
}
export declare namespace RangePatternLeftWithRight {
    type Config = ConfigFor<'_range_pattern_left_with_right'>;
    type Fluent = FluentFor<'_range_pattern_left_with_right'>;
    type Loose = LooseFor<'_range_pattern_left_with_right'>;
    type Tree = TreeFor<'_range_pattern_left_with_right'>;
    type Kind = '_range_pattern_left_with_right';
}
export declare namespace RangePatternPrefix {
    type Config = ConfigFor<'_range_pattern_prefix'>;
    type Fluent = FluentFor<'_range_pattern_prefix'>;
    type Loose = LooseFor<'_range_pattern_prefix'>;
    type Tree = TreeFor<'_range_pattern_prefix'>;
    type Kind = '_range_pattern_prefix';
}
export declare namespace ReferenceExpressionRawMut {
    type Config = ConfigFor<'_reference_expression_raw_mut'>;
    type Fluent = FluentFor<'_reference_expression_raw_mut'>;
    type Loose = LooseFor<'_reference_expression_raw_mut'>;
    type Tree = TreeFor<'_reference_expression_raw_mut'>;
    type Kind = '_reference_expression_raw_mut';
}
export declare namespace ReservedIdentifier {
    type Config = ConfigFor<'_reserved_identifier'>;
    type Fluent = FluentFor<'_reserved_identifier'>;
    type Loose = LooseFor<'_reserved_identifier'>;
    type Tree = TreeFor<'_reserved_identifier'>;
    type Kind = '_reserved_identifier';
}
export declare namespace StructItemBrace {
    type Config = ConfigFor<'_struct_item_brace'>;
    type Fluent = FluentFor<'_struct_item_brace'>;
    type Loose = LooseFor<'_struct_item_brace'>;
    type Tree = TreeFor<'_struct_item_brace'>;
    type Kind = '_struct_item_brace';
}
export declare namespace StructItemTuple {
    type Config = ConfigFor<'_struct_item_tuple'>;
    type Fluent = FluentFor<'_struct_item_tuple'>;
    type Loose = LooseFor<'_struct_item_tuple'>;
    type Tree = TreeFor<'_struct_item_tuple'>;
    type Kind = '_struct_item_tuple';
}
export declare namespace _TokenTreeBrace {
    type Config = ConfigFor<'_token_tree_brace'>;
    type Fluent = FluentFor<'_token_tree_brace'>;
    type Loose = LooseFor<'_token_tree_brace'>;
    type Tree = TreeFor<'_token_tree_brace'>;
    type Kind = '_token_tree_brace';
}
export declare namespace _TokenTreeBracket {
    type Config = ConfigFor<'_token_tree_bracket'>;
    type Fluent = FluentFor<'_token_tree_bracket'>;
    type Loose = LooseFor<'_token_tree_bracket'>;
    type Tree = TreeFor<'_token_tree_bracket'>;
    type Kind = '_token_tree_bracket';
}
export declare namespace _TokenTreeParen {
    type Config = ConfigFor<'_token_tree_paren'>;
    type Fluent = FluentFor<'_token_tree_paren'>;
    type Loose = LooseFor<'_token_tree_paren'>;
    type Tree = TreeFor<'_token_tree_paren'>;
    type Kind = '_token_tree_paren';
}
export declare namespace _TokenTreePatternBrace {
    type Config = ConfigFor<'_token_tree_pattern_brace'>;
    type Fluent = FluentFor<'_token_tree_pattern_brace'>;
    type Loose = LooseFor<'_token_tree_pattern_brace'>;
    type Tree = TreeFor<'_token_tree_pattern_brace'>;
    type Kind = '_token_tree_pattern_brace';
}
export declare namespace _TokenTreePatternBracket {
    type Config = ConfigFor<'_token_tree_pattern_bracket'>;
    type Fluent = FluentFor<'_token_tree_pattern_bracket'>;
    type Loose = LooseFor<'_token_tree_pattern_bracket'>;
    type Tree = TreeFor<'_token_tree_pattern_bracket'>;
    type Kind = '_token_tree_pattern_bracket';
}
export declare namespace _TokenTreePatternParen {
    type Config = ConfigFor<'_token_tree_pattern_paren'>;
    type Fluent = FluentFor<'_token_tree_pattern_paren'>;
    type Loose = LooseFor<'_token_tree_pattern_paren'>;
    type Tree = TreeFor<'_token_tree_pattern_paren'>;
    type Kind = '_token_tree_pattern_paren';
}
export declare namespace TypeIdentifier {
    type Config = ConfigFor<'_type_identifier'>;
    type Fluent = FluentFor<'_type_identifier'>;
    type Loose = LooseFor<'_type_identifier'>;
    type Tree = TreeFor<'_type_identifier'>;
    type Kind = '_type_identifier';
}
export declare namespace _VisibilityModifierCrate {
    type Config = ConfigFor<'_visibility_modifier_crate'>;
    type Fluent = FluentFor<'_visibility_modifier_crate'>;
    type Loose = LooseFor<'_visibility_modifier_crate'>;
    type Tree = TreeFor<'_visibility_modifier_crate'>;
    type Kind = '_visibility_modifier_crate';
}
export declare namespace VisibilityModifierInPath {
    type Config = ConfigFor<'_visibility_modifier_in_path'>;
    type Fluent = FluentFor<'_visibility_modifier_in_path'>;
    type Loose = LooseFor<'_visibility_modifier_in_path'>;
    type Tree = TreeFor<'_visibility_modifier_in_path'>;
    type Kind = '_visibility_modifier_in_path';
}
export declare namespace VisibilityModifierPub {
    type Config = ConfigFor<'_visibility_modifier_pub'>;
    type Fluent = FluentFor<'_visibility_modifier_pub'>;
    type Loose = LooseFor<'_visibility_modifier_pub'>;
    type Tree = TreeFor<'_visibility_modifier_pub'>;
    type Kind = '_visibility_modifier_pub';
}
export declare namespace AbstractType {
    type Config = ConfigFor<'abstract_type'>;
    type Fluent = FluentFor<'abstract_type'>;
    type Loose = LooseFor<'abstract_type'>;
    type Tree = TreeFor<'abstract_type'>;
    type Kind = 'abstract_type';
}
export declare namespace Arguments {
    type Config = ConfigFor<'arguments'>;
    type Fluent = FluentFor<'arguments'>;
    type Loose = LooseFor<'arguments'>;
    type Tree = TreeFor<'arguments'>;
    type Kind = 'arguments';
}
export declare namespace ArrayExpression {
    type Config = ConfigFor<'array_expression'>;
    type Fluent = FluentFor<'array_expression'>;
    type Loose = LooseFor<'array_expression'>;
    type Tree = TreeFor<'array_expression'>;
    type Kind = 'array_expression';
}
export declare namespace ArrayType {
    type Config = ConfigFor<'array_type'>;
    type Fluent = FluentFor<'array_type'>;
    type Loose = LooseFor<'array_type'>;
    type Tree = TreeFor<'array_type'>;
    type Kind = 'array_type';
}
export declare namespace AssignmentExpression {
    type Config = ConfigFor<'assignment_expression'>;
    type Fluent = FluentFor<'assignment_expression'>;
    type Loose = LooseFor<'assignment_expression'>;
    type Tree = TreeFor<'assignment_expression'>;
    type Kind = 'assignment_expression';
}
export declare namespace AssociatedType {
    type Config = ConfigFor<'associated_type'>;
    type Fluent = FluentFor<'associated_type'>;
    type Loose = LooseFor<'associated_type'>;
    type Tree = TreeFor<'associated_type'>;
    type Kind = 'associated_type';
}
export declare namespace AsyncBlock {
    type Config = ConfigFor<'async_block'>;
    type Fluent = FluentFor<'async_block'>;
    type Loose = LooseFor<'async_block'>;
    type Tree = TreeFor<'async_block'>;
    type Kind = 'async_block';
}
export declare namespace Attribute {
    type Config = ConfigFor<'attribute'>;
    type Fluent = FluentFor<'attribute'>;
    type Loose = LooseFor<'attribute'>;
    type Tree = TreeFor<'attribute'>;
    type Kind = 'attribute';
}
export declare namespace AttributeItem {
    type Config = ConfigFor<'attribute_item'>;
    type Fluent = FluentFor<'attribute_item'>;
    type Loose = LooseFor<'attribute_item'>;
    type Tree = TreeFor<'attribute_item'>;
    type Kind = 'attribute_item';
}
export declare namespace AwaitExpression {
    type Config = ConfigFor<'await_expression'>;
    type Fluent = FluentFor<'await_expression'>;
    type Loose = LooseFor<'await_expression'>;
    type Tree = TreeFor<'await_expression'>;
    type Kind = 'await_expression';
}
export declare namespace BaseFieldInitializer {
    type Config = ConfigFor<'base_field_initializer'>;
    type Fluent = FluentFor<'base_field_initializer'>;
    type Loose = LooseFor<'base_field_initializer'>;
    type Tree = TreeFor<'base_field_initializer'>;
    type Kind = 'base_field_initializer';
}
export declare namespace BinaryExpression {
    type Config = ConfigFor<'binary_expression'>;
    type Fluent = FluentFor<'binary_expression'>;
    type Loose = LooseFor<'binary_expression'>;
    type Tree = TreeFor<'binary_expression'>;
    type Kind = 'binary_expression';
}
export declare namespace Block {
    type Config = ConfigFor<'block'>;
    type Fluent = FluentFor<'block'>;
    type Loose = LooseFor<'block'>;
    type Tree = TreeFor<'block'>;
    type Kind = 'block';
}
export declare namespace BlockComment {
    type Config = ConfigFor<'block_comment'>;
    type Fluent = FluentFor<'block_comment'>;
    type Loose = LooseFor<'block_comment'>;
    type Tree = TreeFor<'block_comment'>;
    type Kind = 'block_comment';
}
export declare namespace BoundedType {
    type Config = ConfigFor<'bounded_type'>;
    type Fluent = FluentFor<'bounded_type'>;
    type Loose = LooseFor<'bounded_type'>;
    type Tree = TreeFor<'bounded_type'>;
    type Kind = 'bounded_type';
}
export declare namespace BracketedType {
    type Config = ConfigFor<'bracketed_type'>;
    type Fluent = FluentFor<'bracketed_type'>;
    type Loose = LooseFor<'bracketed_type'>;
    type Tree = TreeFor<'bracketed_type'>;
    type Kind = 'bracketed_type';
}
export declare namespace BreakExpression {
    type Config = ConfigFor<'break_expression'>;
    type Fluent = FluentFor<'break_expression'>;
    type Loose = LooseFor<'break_expression'>;
    type Tree = TreeFor<'break_expression'>;
    type Kind = 'break_expression';
}
export declare namespace CallExpression {
    type Config = ConfigFor<'call_expression'>;
    type Fluent = FluentFor<'call_expression'>;
    type Loose = LooseFor<'call_expression'>;
    type Tree = TreeFor<'call_expression'>;
    type Kind = 'call_expression';
}
export declare namespace CapturedPattern {
    type Config = ConfigFor<'captured_pattern'>;
    type Fluent = FluentFor<'captured_pattern'>;
    type Loose = LooseFor<'captured_pattern'>;
    type Tree = TreeFor<'captured_pattern'>;
    type Kind = 'captured_pattern';
}
export declare namespace ClosureExpressionExpr {
    type Config = ConfigFor<'closure_expression_expr'>;
    type Fluent = FluentFor<'closure_expression_expr'>;
    type Loose = LooseFor<'closure_expression_expr'>;
    type Tree = TreeFor<'closure_expression_expr'>;
    type Kind = 'closure_expression_expr';
}
export declare namespace ClosureExpression {
    type Config = ConfigFor<'closure_expression'>;
    type Fluent = FluentFor<'closure_expression'>;
    type Loose = LooseFor<'closure_expression'>;
    type Tree = TreeFor<'closure_expression'>;
    type Kind = 'closure_expression';
}
export declare namespace ClosureParameters {
    type Config = ConfigFor<'closure_parameters'>;
    type Fluent = FluentFor<'closure_parameters'>;
    type Loose = LooseFor<'closure_parameters'>;
    type Tree = TreeFor<'closure_parameters'>;
    type Kind = 'closure_parameters';
}
export declare namespace Comment {
    type Config = ConfigFor<'comment'>;
    type Fluent = FluentFor<'comment'>;
    type Loose = LooseFor<'comment'>;
    type Tree = TreeFor<'comment'>;
    type Kind = 'comment';
}
export declare namespace CompoundAssignmentExpr {
    type Config = ConfigFor<'compound_assignment_expr'>;
    type Fluent = FluentFor<'compound_assignment_expr'>;
    type Loose = LooseFor<'compound_assignment_expr'>;
    type Tree = TreeFor<'compound_assignment_expr'>;
    type Kind = 'compound_assignment_expr';
}
export declare namespace ConstBlock {
    type Config = ConfigFor<'const_block'>;
    type Fluent = FluentFor<'const_block'>;
    type Loose = LooseFor<'const_block'>;
    type Tree = TreeFor<'const_block'>;
    type Kind = 'const_block';
}
export declare namespace ConstItem {
    type Config = ConfigFor<'const_item'>;
    type Fluent = FluentFor<'const_item'>;
    type Loose = LooseFor<'const_item'>;
    type Tree = TreeFor<'const_item'>;
    type Kind = 'const_item';
}
export declare namespace ConstParameter {
    type Config = ConfigFor<'const_parameter'>;
    type Fluent = FluentFor<'const_parameter'>;
    type Loose = LooseFor<'const_parameter'>;
    type Tree = TreeFor<'const_parameter'>;
    type Kind = 'const_parameter';
}
export declare namespace ContinueExpression {
    type Config = ConfigFor<'continue_expression'>;
    type Fluent = FluentFor<'continue_expression'>;
    type Loose = LooseFor<'continue_expression'>;
    type Tree = TreeFor<'continue_expression'>;
    type Kind = 'continue_expression';
}
export declare namespace DeclarationList {
    type Config = ConfigFor<'declaration_list'>;
    type Fluent = FluentFor<'declaration_list'>;
    type Loose = LooseFor<'declaration_list'>;
    type Tree = TreeFor<'declaration_list'>;
    type Kind = 'declaration_list';
}
export declare namespace DelimTokenTreeParen {
    type Config = ConfigFor<'delim_token_tree_paren'>;
    type Fluent = FluentFor<'delim_token_tree_paren'>;
    type Loose = LooseFor<'delim_token_tree_paren'>;
    type Tree = TreeFor<'delim_token_tree_paren'>;
    type Kind = 'delim_token_tree_paren';
}
export declare namespace DelimTokenTreeBracket {
    type Config = ConfigFor<'delim_token_tree_bracket'>;
    type Fluent = FluentFor<'delim_token_tree_bracket'>;
    type Loose = LooseFor<'delim_token_tree_bracket'>;
    type Tree = TreeFor<'delim_token_tree_bracket'>;
    type Kind = 'delim_token_tree_bracket';
}
export declare namespace DelimTokenTreeBrace {
    type Config = ConfigFor<'delim_token_tree_brace'>;
    type Fluent = FluentFor<'delim_token_tree_brace'>;
    type Loose = LooseFor<'delim_token_tree_brace'>;
    type Tree = TreeFor<'delim_token_tree_brace'>;
    type Kind = 'delim_token_tree_brace';
}
export declare namespace DelimTokenTree {
    type Config = ConfigFor<'delim_token_tree'>;
    type Fluent = FluentFor<'delim_token_tree'>;
    type Loose = LooseFor<'delim_token_tree'>;
    type Tree = TreeFor<'delim_token_tree'>;
    type Kind = 'delim_token_tree';
}
export declare namespace DynamicType {
    type Config = ConfigFor<'dynamic_type'>;
    type Fluent = FluentFor<'dynamic_type'>;
    type Loose = LooseFor<'dynamic_type'>;
    type Tree = TreeFor<'dynamic_type'>;
    type Kind = 'dynamic_type';
}
export declare namespace ElseClause {
    type Config = ConfigFor<'else_clause'>;
    type Fluent = FluentFor<'else_clause'>;
    type Loose = LooseFor<'else_clause'>;
    type Tree = TreeFor<'else_clause'>;
    type Kind = 'else_clause';
}
export declare namespace EnumItem {
    type Config = ConfigFor<'enum_item'>;
    type Fluent = FluentFor<'enum_item'>;
    type Loose = LooseFor<'enum_item'>;
    type Tree = TreeFor<'enum_item'>;
    type Kind = 'enum_item';
}
export declare namespace EnumVariant {
    type Config = ConfigFor<'enum_variant'>;
    type Fluent = FluentFor<'enum_variant'>;
    type Loose = LooseFor<'enum_variant'>;
    type Tree = TreeFor<'enum_variant'>;
    type Kind = 'enum_variant';
}
export declare namespace EnumVariantList {
    type Config = ConfigFor<'enum_variant_list'>;
    type Fluent = FluentFor<'enum_variant_list'>;
    type Loose = LooseFor<'enum_variant_list'>;
    type Tree = TreeFor<'enum_variant_list'>;
    type Kind = 'enum_variant_list';
}
export declare namespace ExpressionStatementWithSemi {
    type Config = ConfigFor<'expression_statement_with_semi'>;
    type Fluent = FluentFor<'expression_statement_with_semi'>;
    type Loose = LooseFor<'expression_statement_with_semi'>;
    type Tree = TreeFor<'expression_statement_with_semi'>;
    type Kind = 'expression_statement_with_semi';
}
export declare namespace ExpressionStatementBlockEnding {
    type Config = ConfigFor<'expression_statement_block_ending'>;
    type Fluent = FluentFor<'expression_statement_block_ending'>;
    type Loose = LooseFor<'expression_statement_block_ending'>;
    type Tree = TreeFor<'expression_statement_block_ending'>;
    type Kind = 'expression_statement_block_ending';
}
export declare namespace ExpressionStatement {
    type Config = ConfigFor<'expression_statement'>;
    type Fluent = FluentFor<'expression_statement'>;
    type Loose = LooseFor<'expression_statement'>;
    type Tree = TreeFor<'expression_statement'>;
    type Kind = 'expression_statement';
}
export declare namespace ExternCrateDeclaration {
    type Config = ConfigFor<'extern_crate_declaration'>;
    type Fluent = FluentFor<'extern_crate_declaration'>;
    type Loose = LooseFor<'extern_crate_declaration'>;
    type Tree = TreeFor<'extern_crate_declaration'>;
    type Kind = 'extern_crate_declaration';
}
export declare namespace ExternModifier {
    type Config = ConfigFor<'extern_modifier'>;
    type Fluent = FluentFor<'extern_modifier'>;
    type Loose = LooseFor<'extern_modifier'>;
    type Tree = TreeFor<'extern_modifier'>;
    type Kind = 'extern_modifier';
}
export declare namespace FieldDeclaration {
    type Config = ConfigFor<'field_declaration'>;
    type Fluent = FluentFor<'field_declaration'>;
    type Loose = LooseFor<'field_declaration'>;
    type Tree = TreeFor<'field_declaration'>;
    type Kind = 'field_declaration';
}
export declare namespace FieldDeclarationList {
    type Config = ConfigFor<'field_declaration_list'>;
    type Fluent = FluentFor<'field_declaration_list'>;
    type Loose = LooseFor<'field_declaration_list'>;
    type Tree = TreeFor<'field_declaration_list'>;
    type Kind = 'field_declaration_list';
}
export declare namespace FieldExpression {
    type Config = ConfigFor<'field_expression'>;
    type Fluent = FluentFor<'field_expression'>;
    type Loose = LooseFor<'field_expression'>;
    type Tree = TreeFor<'field_expression'>;
    type Kind = 'field_expression';
}
export declare namespace FieldInitializer {
    type Config = ConfigFor<'field_initializer'>;
    type Fluent = FluentFor<'field_initializer'>;
    type Loose = LooseFor<'field_initializer'>;
    type Tree = TreeFor<'field_initializer'>;
    type Kind = 'field_initializer';
}
export declare namespace FieldInitializerList {
    type Config = ConfigFor<'field_initializer_list'>;
    type Fluent = FluentFor<'field_initializer_list'>;
    type Loose = LooseFor<'field_initializer_list'>;
    type Tree = TreeFor<'field_initializer_list'>;
    type Kind = 'field_initializer_list';
}
export declare namespace FieldPatternShorthand {
    type Config = ConfigFor<'field_pattern_shorthand'>;
    type Fluent = FluentFor<'field_pattern_shorthand'>;
    type Loose = LooseFor<'field_pattern_shorthand'>;
    type Tree = TreeFor<'field_pattern_shorthand'>;
    type Kind = 'field_pattern_shorthand';
}
export declare namespace FieldPattern {
    type Config = ConfigFor<'field_pattern'>;
    type Fluent = FluentFor<'field_pattern'>;
    type Loose = LooseFor<'field_pattern'>;
    type Tree = TreeFor<'field_pattern'>;
    type Kind = 'field_pattern';
}
export declare namespace ForExpression {
    type Config = ConfigFor<'for_expression'>;
    type Fluent = FluentFor<'for_expression'>;
    type Loose = LooseFor<'for_expression'>;
    type Tree = TreeFor<'for_expression'>;
    type Kind = 'for_expression';
}
export declare namespace ForLifetimes {
    type Config = ConfigFor<'for_lifetimes'>;
    type Fluent = FluentFor<'for_lifetimes'>;
    type Loose = LooseFor<'for_lifetimes'>;
    type Tree = TreeFor<'for_lifetimes'>;
    type Kind = 'for_lifetimes';
}
export declare namespace ForeignModItemBody {
    type Config = ConfigFor<'foreign_mod_item_body'>;
    type Fluent = FluentFor<'foreign_mod_item_body'>;
    type Loose = LooseFor<'foreign_mod_item_body'>;
    type Tree = TreeFor<'foreign_mod_item_body'>;
    type Kind = 'foreign_mod_item_body';
}
export declare namespace ForeignModItem {
    type Config = ConfigFor<'foreign_mod_item'>;
    type Fluent = FluentFor<'foreign_mod_item'>;
    type Loose = LooseFor<'foreign_mod_item'>;
    type Tree = TreeFor<'foreign_mod_item'>;
    type Kind = 'foreign_mod_item';
}
export declare namespace FunctionItem {
    type Config = ConfigFor<'function_item'>;
    type Fluent = FluentFor<'function_item'>;
    type Loose = LooseFor<'function_item'>;
    type Tree = TreeFor<'function_item'>;
    type Kind = 'function_item';
}
export declare namespace FunctionModifiers {
    type Config = ConfigFor<'function_modifiers'>;
    type Fluent = FluentFor<'function_modifiers'>;
    type Loose = LooseFor<'function_modifiers'>;
    type Tree = TreeFor<'function_modifiers'>;
    type Kind = 'function_modifiers';
}
export declare namespace FunctionSignatureItem {
    type Config = ConfigFor<'function_signature_item'>;
    type Fluent = FluentFor<'function_signature_item'>;
    type Loose = LooseFor<'function_signature_item'>;
    type Tree = TreeFor<'function_signature_item'>;
    type Kind = 'function_signature_item';
}
export declare namespace FunctionType {
    type Config = ConfigFor<'function_type'>;
    type Fluent = FluentFor<'function_type'>;
    type Loose = LooseFor<'function_type'>;
    type Tree = TreeFor<'function_type'>;
    type Kind = 'function_type';
}
export declare namespace GenBlock {
    type Config = ConfigFor<'gen_block'>;
    type Fluent = FluentFor<'gen_block'>;
    type Loose = LooseFor<'gen_block'>;
    type Tree = TreeFor<'gen_block'>;
    type Kind = 'gen_block';
}
export declare namespace GenericFunction {
    type Config = ConfigFor<'generic_function'>;
    type Fluent = FluentFor<'generic_function'>;
    type Loose = LooseFor<'generic_function'>;
    type Tree = TreeFor<'generic_function'>;
    type Kind = 'generic_function';
}
export declare namespace GenericPattern {
    type Config = ConfigFor<'generic_pattern'>;
    type Fluent = FluentFor<'generic_pattern'>;
    type Loose = LooseFor<'generic_pattern'>;
    type Tree = TreeFor<'generic_pattern'>;
    type Kind = 'generic_pattern';
}
export declare namespace GenericType {
    type Config = ConfigFor<'generic_type'>;
    type Fluent = FluentFor<'generic_type'>;
    type Loose = LooseFor<'generic_type'>;
    type Tree = TreeFor<'generic_type'>;
    type Kind = 'generic_type';
}
export declare namespace GenericTypeWithTurbofish {
    type Config = ConfigFor<'generic_type_with_turbofish'>;
    type Fluent = FluentFor<'generic_type_with_turbofish'>;
    type Loose = LooseFor<'generic_type_with_turbofish'>;
    type Tree = TreeFor<'generic_type_with_turbofish'>;
    type Kind = 'generic_type_with_turbofish';
}
export declare namespace HigherRankedTraitBound {
    type Config = ConfigFor<'higher_ranked_trait_bound'>;
    type Fluent = FluentFor<'higher_ranked_trait_bound'>;
    type Loose = LooseFor<'higher_ranked_trait_bound'>;
    type Tree = TreeFor<'higher_ranked_trait_bound'>;
    type Kind = 'higher_ranked_trait_bound';
}
export declare namespace IfExpression {
    type Config = ConfigFor<'if_expression'>;
    type Fluent = FluentFor<'if_expression'>;
    type Loose = LooseFor<'if_expression'>;
    type Tree = TreeFor<'if_expression'>;
    type Kind = 'if_expression';
}
export declare namespace ImplItemBody {
    type Config = ConfigFor<'impl_item_body'>;
    type Fluent = FluentFor<'impl_item_body'>;
    type Loose = LooseFor<'impl_item_body'>;
    type Tree = TreeFor<'impl_item_body'>;
    type Kind = 'impl_item_body';
}
export declare namespace ImplItem {
    type Config = ConfigFor<'impl_item'>;
    type Fluent = FluentFor<'impl_item'>;
    type Loose = LooseFor<'impl_item'>;
    type Tree = TreeFor<'impl_item'>;
    type Kind = 'impl_item';
}
export declare namespace IndexExpression {
    type Config = ConfigFor<'index_expression'>;
    type Fluent = FluentFor<'index_expression'>;
    type Loose = LooseFor<'index_expression'>;
    type Tree = TreeFor<'index_expression'>;
    type Kind = 'index_expression';
}
export declare namespace InnerAttributeItem {
    type Config = ConfigFor<'inner_attribute_item'>;
    type Fluent = FluentFor<'inner_attribute_item'>;
    type Loose = LooseFor<'inner_attribute_item'>;
    type Tree = TreeFor<'inner_attribute_item'>;
    type Kind = 'inner_attribute_item';
}
export declare namespace Label {
    type Config = ConfigFor<'label'>;
    type Fluent = FluentFor<'label'>;
    type Loose = LooseFor<'label'>;
    type Tree = TreeFor<'label'>;
    type Kind = 'label';
}
export declare namespace LastMatchArm {
    type Config = ConfigFor<'last_match_arm'>;
    type Fluent = FluentFor<'last_match_arm'>;
    type Loose = LooseFor<'last_match_arm'>;
    type Tree = TreeFor<'last_match_arm'>;
    type Kind = 'last_match_arm';
}
export declare namespace LetCondition {
    type Config = ConfigFor<'let_condition'>;
    type Fluent = FluentFor<'let_condition'>;
    type Loose = LooseFor<'let_condition'>;
    type Tree = TreeFor<'let_condition'>;
    type Kind = 'let_condition';
}
export declare namespace LetDeclaration {
    type Config = ConfigFor<'let_declaration'>;
    type Fluent = FluentFor<'let_declaration'>;
    type Loose = LooseFor<'let_declaration'>;
    type Tree = TreeFor<'let_declaration'>;
    type Kind = 'let_declaration';
}
export declare namespace Lifetime {
    type Config = ConfigFor<'lifetime'>;
    type Fluent = FluentFor<'lifetime'>;
    type Loose = LooseFor<'lifetime'>;
    type Tree = TreeFor<'lifetime'>;
    type Kind = 'lifetime';
}
export declare namespace LifetimeParameter {
    type Config = ConfigFor<'lifetime_parameter'>;
    type Fluent = FluentFor<'lifetime_parameter'>;
    type Loose = LooseFor<'lifetime_parameter'>;
    type Tree = TreeFor<'lifetime_parameter'>;
    type Kind = 'lifetime_parameter';
}
export declare namespace LineComment {
    type Config = ConfigFor<'line_comment'>;
    type Fluent = FluentFor<'line_comment'>;
    type Loose = LooseFor<'line_comment'>;
    type Tree = TreeFor<'line_comment'>;
    type Kind = 'line_comment';
}
export declare namespace LoopExpression {
    type Config = ConfigFor<'loop_expression'>;
    type Fluent = FluentFor<'loop_expression'>;
    type Loose = LooseFor<'loop_expression'>;
    type Tree = TreeFor<'loop_expression'>;
    type Kind = 'loop_expression';
}
export declare namespace MacroDefinitionParen {
    type Config = ConfigFor<'macro_definition_paren'>;
    type Fluent = FluentFor<'macro_definition_paren'>;
    type Loose = LooseFor<'macro_definition_paren'>;
    type Tree = TreeFor<'macro_definition_paren'>;
    type Kind = 'macro_definition_paren';
}
export declare namespace MacroDefinitionBracket {
    type Config = ConfigFor<'macro_definition_bracket'>;
    type Fluent = FluentFor<'macro_definition_bracket'>;
    type Loose = LooseFor<'macro_definition_bracket'>;
    type Tree = TreeFor<'macro_definition_bracket'>;
    type Kind = 'macro_definition_bracket';
}
export declare namespace MacroDefinitionBrace {
    type Config = ConfigFor<'macro_definition_brace'>;
    type Fluent = FluentFor<'macro_definition_brace'>;
    type Loose = LooseFor<'macro_definition_brace'>;
    type Tree = TreeFor<'macro_definition_brace'>;
    type Kind = 'macro_definition_brace';
}
export declare namespace MacroDefinition {
    type Config = ConfigFor<'macro_definition'>;
    type Fluent = FluentFor<'macro_definition'>;
    type Loose = LooseFor<'macro_definition'>;
    type Tree = TreeFor<'macro_definition'>;
    type Kind = 'macro_definition';
}
export declare namespace MacroInvocation {
    type Config = ConfigFor<'macro_invocation'>;
    type Fluent = FluentFor<'macro_invocation'>;
    type Loose = LooseFor<'macro_invocation'>;
    type Tree = TreeFor<'macro_invocation'>;
    type Kind = 'macro_invocation';
}
export declare namespace MacroRule {
    type Config = ConfigFor<'macro_rule'>;
    type Fluent = FluentFor<'macro_rule'>;
    type Loose = LooseFor<'macro_rule'>;
    type Tree = TreeFor<'macro_rule'>;
    type Kind = 'macro_rule';
}
export declare namespace MatchArmBlockEnding {
    type Config = ConfigFor<'match_arm_block_ending'>;
    type Fluent = FluentFor<'match_arm_block_ending'>;
    type Loose = LooseFor<'match_arm_block_ending'>;
    type Tree = TreeFor<'match_arm_block_ending'>;
    type Kind = 'match_arm_block_ending';
}
export declare namespace MatchArm {
    type Config = ConfigFor<'match_arm'>;
    type Fluent = FluentFor<'match_arm'>;
    type Loose = LooseFor<'match_arm'>;
    type Tree = TreeFor<'match_arm'>;
    type Kind = 'match_arm';
}
export declare namespace MatchBlock {
    type Config = ConfigFor<'match_block'>;
    type Fluent = FluentFor<'match_block'>;
    type Loose = LooseFor<'match_block'>;
    type Tree = TreeFor<'match_block'>;
    type Kind = 'match_block';
}
export declare namespace MatchExpression {
    type Config = ConfigFor<'match_expression'>;
    type Fluent = FluentFor<'match_expression'>;
    type Loose = LooseFor<'match_expression'>;
    type Tree = TreeFor<'match_expression'>;
    type Kind = 'match_expression';
}
export declare namespace MatchPattern {
    type Config = ConfigFor<'match_pattern'>;
    type Fluent = FluentFor<'match_pattern'>;
    type Loose = LooseFor<'match_pattern'>;
    type Tree = TreeFor<'match_pattern'>;
    type Kind = 'match_pattern';
}
export declare namespace ModItemInline {
    type Config = ConfigFor<'mod_item_inline'>;
    type Fluent = FluentFor<'mod_item_inline'>;
    type Loose = LooseFor<'mod_item_inline'>;
    type Tree = TreeFor<'mod_item_inline'>;
    type Kind = 'mod_item_inline';
}
export declare namespace ModItem {
    type Config = ConfigFor<'mod_item'>;
    type Fluent = FluentFor<'mod_item'>;
    type Loose = LooseFor<'mod_item'>;
    type Tree = TreeFor<'mod_item'>;
    type Kind = 'mod_item';
}
export declare namespace MutPattern {
    type Config = ConfigFor<'mut_pattern'>;
    type Fluent = FluentFor<'mut_pattern'>;
    type Loose = LooseFor<'mut_pattern'>;
    type Tree = TreeFor<'mut_pattern'>;
    type Kind = 'mut_pattern';
}
export declare namespace NegativeLiteral {
    type Config = ConfigFor<'negative_literal'>;
    type Fluent = FluentFor<'negative_literal'>;
    type Loose = LooseFor<'negative_literal'>;
    type Tree = TreeFor<'negative_literal'>;
    type Kind = 'negative_literal';
}
export declare namespace OrPattern {
    type Config = ConfigFor<'or_pattern'>;
    type Fluent = FluentFor<'or_pattern'>;
    type Loose = LooseFor<'or_pattern'>;
    type Tree = TreeFor<'or_pattern'>;
    type Kind = 'or_pattern';
}
export declare namespace OrderedFieldDeclarationList {
    type Config = ConfigFor<'ordered_field_declaration_list'>;
    type Fluent = FluentFor<'ordered_field_declaration_list'>;
    type Loose = LooseFor<'ordered_field_declaration_list'>;
    type Tree = TreeFor<'ordered_field_declaration_list'>;
    type Kind = 'ordered_field_declaration_list';
}
export declare namespace Parameter {
    type Config = ConfigFor<'parameter'>;
    type Fluent = FluentFor<'parameter'>;
    type Loose = LooseFor<'parameter'>;
    type Tree = TreeFor<'parameter'>;
    type Kind = 'parameter';
}
export declare namespace Parameters {
    type Config = ConfigFor<'parameters'>;
    type Fluent = FluentFor<'parameters'>;
    type Loose = LooseFor<'parameters'>;
    type Tree = TreeFor<'parameters'>;
    type Kind = 'parameters';
}
export declare namespace ParenthesizedExpression {
    type Config = ConfigFor<'parenthesized_expression'>;
    type Fluent = FluentFor<'parenthesized_expression'>;
    type Loose = LooseFor<'parenthesized_expression'>;
    type Tree = TreeFor<'parenthesized_expression'>;
    type Kind = 'parenthesized_expression';
}
export declare namespace PointerTypeMut {
    type Config = ConfigFor<'pointer_type_mut'>;
    type Fluent = FluentFor<'pointer_type_mut'>;
    type Loose = LooseFor<'pointer_type_mut'>;
    type Tree = TreeFor<'pointer_type_mut'>;
    type Kind = 'pointer_type_mut';
}
export declare namespace PointerType {
    type Config = ConfigFor<'pointer_type'>;
    type Fluent = FluentFor<'pointer_type'>;
    type Loose = LooseFor<'pointer_type'>;
    type Tree = TreeFor<'pointer_type'>;
    type Kind = 'pointer_type';
}
export declare namespace QualifiedType {
    type Config = ConfigFor<'qualified_type'>;
    type Fluent = FluentFor<'qualified_type'>;
    type Loose = LooseFor<'qualified_type'>;
    type Tree = TreeFor<'qualified_type'>;
    type Kind = 'qualified_type';
}
export declare namespace RangeExpressionBare {
    type Config = ConfigFor<'range_expression_bare'>;
    type Fluent = FluentFor<'range_expression_bare'>;
    type Loose = LooseFor<'range_expression_bare'>;
    type Tree = TreeFor<'range_expression_bare'>;
    type Kind = 'range_expression_bare';
}
export declare namespace RangeExpression {
    type Config = ConfigFor<'range_expression'>;
    type Fluent = FluentFor<'range_expression'>;
    type Loose = LooseFor<'range_expression'>;
    type Tree = TreeFor<'range_expression'>;
    type Kind = 'range_expression';
}
export declare namespace RangePattern {
    type Config = ConfigFor<'range_pattern'>;
    type Fluent = FluentFor<'range_pattern'>;
    type Loose = LooseFor<'range_pattern'>;
    type Tree = TreeFor<'range_pattern'>;
    type Kind = 'range_pattern';
}
export declare namespace RawStringLiteral {
    type Config = ConfigFor<'raw_string_literal'>;
    type Fluent = FluentFor<'raw_string_literal'>;
    type Loose = LooseFor<'raw_string_literal'>;
    type Tree = TreeFor<'raw_string_literal'>;
    type Kind = 'raw_string_literal';
}
export declare namespace RefPattern {
    type Config = ConfigFor<'ref_pattern'>;
    type Fluent = FluentFor<'ref_pattern'>;
    type Loose = LooseFor<'ref_pattern'>;
    type Tree = TreeFor<'ref_pattern'>;
    type Kind = 'ref_pattern';
}
export declare namespace ReferenceExpression {
    type Config = ConfigFor<'reference_expression'>;
    type Fluent = FluentFor<'reference_expression'>;
    type Loose = LooseFor<'reference_expression'>;
    type Tree = TreeFor<'reference_expression'>;
    type Kind = 'reference_expression';
}
export declare namespace ReferencePattern {
    type Config = ConfigFor<'reference_pattern'>;
    type Fluent = FluentFor<'reference_pattern'>;
    type Loose = LooseFor<'reference_pattern'>;
    type Tree = TreeFor<'reference_pattern'>;
    type Kind = 'reference_pattern';
}
export declare namespace ReferenceType {
    type Config = ConfigFor<'reference_type'>;
    type Fluent = FluentFor<'reference_type'>;
    type Loose = LooseFor<'reference_type'>;
    type Tree = TreeFor<'reference_type'>;
    type Kind = 'reference_type';
}
export declare namespace RemovedTraitBound {
    type Config = ConfigFor<'removed_trait_bound'>;
    type Fluent = FluentFor<'removed_trait_bound'>;
    type Loose = LooseFor<'removed_trait_bound'>;
    type Tree = TreeFor<'removed_trait_bound'>;
    type Kind = 'removed_trait_bound';
}
export declare namespace ReturnExpression {
    type Config = ConfigFor<'return_expression'>;
    type Fluent = FluentFor<'return_expression'>;
    type Loose = LooseFor<'return_expression'>;
    type Tree = TreeFor<'return_expression'>;
    type Kind = 'return_expression';
}
export declare namespace ScopedIdentifier {
    type Config = ConfigFor<'scoped_identifier'>;
    type Fluent = FluentFor<'scoped_identifier'>;
    type Loose = LooseFor<'scoped_identifier'>;
    type Tree = TreeFor<'scoped_identifier'>;
    type Kind = 'scoped_identifier';
}
export declare namespace ScopedTypeIdentifier {
    type Config = ConfigFor<'scoped_type_identifier'>;
    type Fluent = FluentFor<'scoped_type_identifier'>;
    type Loose = LooseFor<'scoped_type_identifier'>;
    type Tree = TreeFor<'scoped_type_identifier'>;
    type Kind = 'scoped_type_identifier';
}
export declare namespace ScopedTypeIdentifierInExpressionPosition {
    type Config = ConfigFor<'scoped_type_identifier_in_expression_position'>;
    type Fluent = FluentFor<'scoped_type_identifier_in_expression_position'>;
    type Loose = LooseFor<'scoped_type_identifier_in_expression_position'>;
    type Tree = TreeFor<'scoped_type_identifier_in_expression_position'>;
    type Kind = 'scoped_type_identifier_in_expression_position';
}
export declare namespace ScopedUseList {
    type Config = ConfigFor<'scoped_use_list'>;
    type Fluent = FluentFor<'scoped_use_list'>;
    type Loose = LooseFor<'scoped_use_list'>;
    type Tree = TreeFor<'scoped_use_list'>;
    type Kind = 'scoped_use_list';
}
export declare namespace SelfParameter {
    type Config = ConfigFor<'self_parameter'>;
    type Fluent = FluentFor<'self_parameter'>;
    type Loose = LooseFor<'self_parameter'>;
    type Tree = TreeFor<'self_parameter'>;
    type Kind = 'self_parameter';
}
export declare namespace ShorthandFieldInitializer {
    type Config = ConfigFor<'shorthand_field_initializer'>;
    type Fluent = FluentFor<'shorthand_field_initializer'>;
    type Loose = LooseFor<'shorthand_field_initializer'>;
    type Tree = TreeFor<'shorthand_field_initializer'>;
    type Kind = 'shorthand_field_initializer';
}
export declare namespace SlicePattern {
    type Config = ConfigFor<'slice_pattern'>;
    type Fluent = FluentFor<'slice_pattern'>;
    type Loose = LooseFor<'slice_pattern'>;
    type Tree = TreeFor<'slice_pattern'>;
    type Kind = 'slice_pattern';
}
export declare namespace SourceFile {
    type Config = ConfigFor<'source_file'>;
    type Fluent = FluentFor<'source_file'>;
    type Loose = LooseFor<'source_file'>;
    type Tree = TreeFor<'source_file'>;
    type Kind = 'source_file';
}
export declare namespace StaticItem {
    type Config = ConfigFor<'static_item'>;
    type Fluent = FluentFor<'static_item'>;
    type Loose = LooseFor<'static_item'>;
    type Tree = TreeFor<'static_item'>;
    type Kind = 'static_item';
}
export declare namespace StringLiteral {
    type Config = ConfigFor<'string_literal'>;
    type Fluent = FluentFor<'string_literal'>;
    type Loose = LooseFor<'string_literal'>;
    type Tree = TreeFor<'string_literal'>;
    type Kind = 'string_literal';
}
export declare namespace StructExpression {
    type Config = ConfigFor<'struct_expression'>;
    type Fluent = FluentFor<'struct_expression'>;
    type Loose = LooseFor<'struct_expression'>;
    type Tree = TreeFor<'struct_expression'>;
    type Kind = 'struct_expression';
}
export declare namespace StructItem {
    type Config = ConfigFor<'struct_item'>;
    type Fluent = FluentFor<'struct_item'>;
    type Loose = LooseFor<'struct_item'>;
    type Tree = TreeFor<'struct_item'>;
    type Kind = 'struct_item';
}
export declare namespace StructPattern {
    type Config = ConfigFor<'struct_pattern'>;
    type Fluent = FluentFor<'struct_pattern'>;
    type Loose = LooseFor<'struct_pattern'>;
    type Tree = TreeFor<'struct_pattern'>;
    type Kind = 'struct_pattern';
}
export declare namespace TokenBindingPattern {
    type Config = ConfigFor<'token_binding_pattern'>;
    type Fluent = FluentFor<'token_binding_pattern'>;
    type Loose = LooseFor<'token_binding_pattern'>;
    type Tree = TreeFor<'token_binding_pattern'>;
    type Kind = 'token_binding_pattern';
}
export declare namespace TokenRepetition {
    type Config = ConfigFor<'token_repetition'>;
    type Fluent = FluentFor<'token_repetition'>;
    type Loose = LooseFor<'token_repetition'>;
    type Tree = TreeFor<'token_repetition'>;
    type Kind = 'token_repetition';
}
export declare namespace TokenRepetitionPattern {
    type Config = ConfigFor<'token_repetition_pattern'>;
    type Fluent = FluentFor<'token_repetition_pattern'>;
    type Loose = LooseFor<'token_repetition_pattern'>;
    type Tree = TreeFor<'token_repetition_pattern'>;
    type Kind = 'token_repetition_pattern';
}
export declare namespace TokenTreeParen {
    type Config = ConfigFor<'token_tree_paren'>;
    type Fluent = FluentFor<'token_tree_paren'>;
    type Loose = LooseFor<'token_tree_paren'>;
    type Tree = TreeFor<'token_tree_paren'>;
    type Kind = 'token_tree_paren';
}
export declare namespace TokenTreeBracket {
    type Config = ConfigFor<'token_tree_bracket'>;
    type Fluent = FluentFor<'token_tree_bracket'>;
    type Loose = LooseFor<'token_tree_bracket'>;
    type Tree = TreeFor<'token_tree_bracket'>;
    type Kind = 'token_tree_bracket';
}
export declare namespace TokenTreeBrace {
    type Config = ConfigFor<'token_tree_brace'>;
    type Fluent = FluentFor<'token_tree_brace'>;
    type Loose = LooseFor<'token_tree_brace'>;
    type Tree = TreeFor<'token_tree_brace'>;
    type Kind = 'token_tree_brace';
}
export declare namespace TokenTree {
    type Config = ConfigFor<'token_tree'>;
    type Fluent = FluentFor<'token_tree'>;
    type Loose = LooseFor<'token_tree'>;
    type Tree = TreeFor<'token_tree'>;
    type Kind = 'token_tree';
}
export declare namespace TokenTreePatternParen {
    type Config = ConfigFor<'token_tree_pattern_paren'>;
    type Fluent = FluentFor<'token_tree_pattern_paren'>;
    type Loose = LooseFor<'token_tree_pattern_paren'>;
    type Tree = TreeFor<'token_tree_pattern_paren'>;
    type Kind = 'token_tree_pattern_paren';
}
export declare namespace TokenTreePatternBracket {
    type Config = ConfigFor<'token_tree_pattern_bracket'>;
    type Fluent = FluentFor<'token_tree_pattern_bracket'>;
    type Loose = LooseFor<'token_tree_pattern_bracket'>;
    type Tree = TreeFor<'token_tree_pattern_bracket'>;
    type Kind = 'token_tree_pattern_bracket';
}
export declare namespace TokenTreePatternBrace {
    type Config = ConfigFor<'token_tree_pattern_brace'>;
    type Fluent = FluentFor<'token_tree_pattern_brace'>;
    type Loose = LooseFor<'token_tree_pattern_brace'>;
    type Tree = TreeFor<'token_tree_pattern_brace'>;
    type Kind = 'token_tree_pattern_brace';
}
export declare namespace TokenTreePattern {
    type Config = ConfigFor<'token_tree_pattern'>;
    type Fluent = FluentFor<'token_tree_pattern'>;
    type Loose = LooseFor<'token_tree_pattern'>;
    type Tree = TreeFor<'token_tree_pattern'>;
    type Kind = 'token_tree_pattern';
}
export declare namespace TraitBounds {
    type Config = ConfigFor<'trait_bounds'>;
    type Fluent = FluentFor<'trait_bounds'>;
    type Loose = LooseFor<'trait_bounds'>;
    type Tree = TreeFor<'trait_bounds'>;
    type Kind = 'trait_bounds';
}
export declare namespace TraitItem {
    type Config = ConfigFor<'trait_item'>;
    type Fluent = FluentFor<'trait_item'>;
    type Loose = LooseFor<'trait_item'>;
    type Tree = TreeFor<'trait_item'>;
    type Kind = 'trait_item';
}
export declare namespace TryBlock {
    type Config = ConfigFor<'try_block'>;
    type Fluent = FluentFor<'try_block'>;
    type Loose = LooseFor<'try_block'>;
    type Tree = TreeFor<'try_block'>;
    type Kind = 'try_block';
}
export declare namespace TryExpression {
    type Config = ConfigFor<'try_expression'>;
    type Fluent = FluentFor<'try_expression'>;
    type Loose = LooseFor<'try_expression'>;
    type Tree = TreeFor<'try_expression'>;
    type Kind = 'try_expression';
}
export declare namespace TupleExpression {
    type Config = ConfigFor<'tuple_expression'>;
    type Fluent = FluentFor<'tuple_expression'>;
    type Loose = LooseFor<'tuple_expression'>;
    type Tree = TreeFor<'tuple_expression'>;
    type Kind = 'tuple_expression';
}
export declare namespace TuplePattern {
    type Config = ConfigFor<'tuple_pattern'>;
    type Fluent = FluentFor<'tuple_pattern'>;
    type Loose = LooseFor<'tuple_pattern'>;
    type Tree = TreeFor<'tuple_pattern'>;
    type Kind = 'tuple_pattern';
}
export declare namespace TupleStructPattern {
    type Config = ConfigFor<'tuple_struct_pattern'>;
    type Fluent = FluentFor<'tuple_struct_pattern'>;
    type Loose = LooseFor<'tuple_struct_pattern'>;
    type Tree = TreeFor<'tuple_struct_pattern'>;
    type Kind = 'tuple_struct_pattern';
}
export declare namespace TupleType {
    type Config = ConfigFor<'tuple_type'>;
    type Fluent = FluentFor<'tuple_type'>;
    type Loose = LooseFor<'tuple_type'>;
    type Tree = TreeFor<'tuple_type'>;
    type Kind = 'tuple_type';
}
export declare namespace TypeArguments {
    type Config = ConfigFor<'type_arguments'>;
    type Fluent = FluentFor<'type_arguments'>;
    type Loose = LooseFor<'type_arguments'>;
    type Tree = TreeFor<'type_arguments'>;
    type Kind = 'type_arguments';
}
export declare namespace TypeBinding {
    type Config = ConfigFor<'type_binding'>;
    type Fluent = FluentFor<'type_binding'>;
    type Loose = LooseFor<'type_binding'>;
    type Tree = TreeFor<'type_binding'>;
    type Kind = 'type_binding';
}
export declare namespace TypeCastExpression {
    type Config = ConfigFor<'type_cast_expression'>;
    type Fluent = FluentFor<'type_cast_expression'>;
    type Loose = LooseFor<'type_cast_expression'>;
    type Tree = TreeFor<'type_cast_expression'>;
    type Kind = 'type_cast_expression';
}
export declare namespace TypeItem {
    type Config = ConfigFor<'type_item'>;
    type Fluent = FluentFor<'type_item'>;
    type Loose = LooseFor<'type_item'>;
    type Tree = TreeFor<'type_item'>;
    type Kind = 'type_item';
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
export declare namespace UnaryExpression {
    type Config = ConfigFor<'unary_expression'>;
    type Fluent = FluentFor<'unary_expression'>;
    type Loose = LooseFor<'unary_expression'>;
    type Tree = TreeFor<'unary_expression'>;
    type Kind = 'unary_expression';
}
export declare namespace UnionItem {
    type Config = ConfigFor<'union_item'>;
    type Fluent = FluentFor<'union_item'>;
    type Loose = LooseFor<'union_item'>;
    type Tree = TreeFor<'union_item'>;
    type Kind = 'union_item';
}
export declare namespace UnsafeBlock {
    type Config = ConfigFor<'unsafe_block'>;
    type Fluent = FluentFor<'unsafe_block'>;
    type Loose = LooseFor<'unsafe_block'>;
    type Tree = TreeFor<'unsafe_block'>;
    type Kind = 'unsafe_block';
}
export declare namespace UseAsClause {
    type Config = ConfigFor<'use_as_clause'>;
    type Fluent = FluentFor<'use_as_clause'>;
    type Loose = LooseFor<'use_as_clause'>;
    type Tree = TreeFor<'use_as_clause'>;
    type Kind = 'use_as_clause';
}
export declare namespace UseBounds {
    type Config = ConfigFor<'use_bounds'>;
    type Fluent = FluentFor<'use_bounds'>;
    type Loose = LooseFor<'use_bounds'>;
    type Tree = TreeFor<'use_bounds'>;
    type Kind = 'use_bounds';
}
export declare namespace UseDeclaration {
    type Config = ConfigFor<'use_declaration'>;
    type Fluent = FluentFor<'use_declaration'>;
    type Loose = LooseFor<'use_declaration'>;
    type Tree = TreeFor<'use_declaration'>;
    type Kind = 'use_declaration';
}
export declare namespace UseList {
    type Config = ConfigFor<'use_list'>;
    type Fluent = FluentFor<'use_list'>;
    type Loose = LooseFor<'use_list'>;
    type Tree = TreeFor<'use_list'>;
    type Kind = 'use_list';
}
export declare namespace UseWildcard {
    type Config = ConfigFor<'use_wildcard'>;
    type Fluent = FluentFor<'use_wildcard'>;
    type Loose = LooseFor<'use_wildcard'>;
    type Tree = TreeFor<'use_wildcard'>;
    type Kind = 'use_wildcard';
}
export declare namespace VariadicParameter {
    type Config = ConfigFor<'variadic_parameter'>;
    type Fluent = FluentFor<'variadic_parameter'>;
    type Loose = LooseFor<'variadic_parameter'>;
    type Tree = TreeFor<'variadic_parameter'>;
    type Kind = 'variadic_parameter';
}
export declare namespace VisibilityModifierCrate {
    type Config = ConfigFor<'visibility_modifier_crate'>;
    type Fluent = FluentFor<'visibility_modifier_crate'>;
    type Loose = LooseFor<'visibility_modifier_crate'>;
    type Tree = TreeFor<'visibility_modifier_crate'>;
    type Kind = 'visibility_modifier_crate';
}
export declare namespace VisibilityModifier {
    type Config = ConfigFor<'visibility_modifier'>;
    type Fluent = FluentFor<'visibility_modifier'>;
    type Loose = LooseFor<'visibility_modifier'>;
    type Tree = TreeFor<'visibility_modifier'>;
    type Kind = 'visibility_modifier';
}
export declare namespace WhereClause {
    type Config = ConfigFor<'where_clause'>;
    type Fluent = FluentFor<'where_clause'>;
    type Loose = LooseFor<'where_clause'>;
    type Tree = TreeFor<'where_clause'>;
    type Kind = 'where_clause';
}
export declare namespace WherePredicate {
    type Config = ConfigFor<'where_predicate'>;
    type Fluent = FluentFor<'where_predicate'>;
    type Loose = LooseFor<'where_predicate'>;
    type Tree = TreeFor<'where_predicate'>;
    type Kind = 'where_predicate';
}
export declare namespace WhileExpression {
    type Config = ConfigFor<'while_expression'>;
    type Fluent = FluentFor<'while_expression'>;
    type Loose = LooseFor<'while_expression'>;
    type Tree = TreeFor<'while_expression'>;
    type Kind = 'while_expression';
}
export declare namespace YieldExpression {
    type Config = ConfigFor<'yield_expression'>;
    type Fluent = FluentFor<'yield_expression'>;
    type Loose = LooseFor<'yield_expression'>;
    type Tree = TreeFor<'yield_expression'>;
    type Kind = 'yield_expression';
}
export interface TerminalTransport<ID extends number = number, V extends string = string> {
    readonly $type: ID;
    readonly $source?: 0 | 1 | 2;
    readonly $named?: boolean;
    readonly $text: V;
    readonly $span?: {
        readonly start: number;
        readonly end: number;
    };
    readonly $nodeHandle?: number;
    readonly $childIndex?: number;
}
export interface LiteralTransport<ID extends number = number, V extends string = string> extends TerminalTransport<ID, V> {
}
export declare namespace RangeExpressionBinaryOperator {
    const enum Values {
        DotDot = 76,
        DotDotDot = 77,
        DotDotEq = 78
    }
    type Transport = Values;
}
export declare namespace VisibilityModifierInPathIn {
    type Transport = boolean;
}
export declare namespace VisibilityModifierPubPub {
    type Transport = boolean;
}
export declare namespace ArrayExpressionList {
    interface Transport {
        readonly $type: TSKindId.ArrayExpressionList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport)[];
        readonly elements: readonly (Expression.Transport)[];
        readonly $children: readonly (AttributeItem.Transport)[];
    }
}
export declare namespace ArrayExpressionSemi {
    interface Transport {
        readonly $type: TSKindId.ArrayExpressionSemi;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport)[];
        readonly elements: Expression.Transport;
        readonly length: Expression.Transport;
    }
}
export declare namespace BinaryExpressionOperator {
    type Transport = boolean;
}
export declare namespace ClosureExpressionAsyncMarker {
    type Transport = boolean;
}
export declare namespace ClosureExpressionBlock {
    interface Transport {
        readonly $type: TSKindId.ClosureExpressionBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly return_type?: Type.Transport;
        readonly body: Block.Transport;
    }
}
export declare namespace _ClosureExpressionExpr {
    interface Transport {
        readonly $type: TSKindId._ClosureExpressionExpr;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: Expression.Transport | LiteralTransport<TSKindId.Anonymous, "_">;
    }
}
export declare namespace ClosureExpressionStaticMarker {
    type Transport = boolean;
}
export declare namespace CompoundAssignmentExprOperator {
    const enum Values {
        PlusEq = 56,
        DashEq = 57,
        StarEq = 58,
        SlashEq = 59,
        PercentEq = 60,
        AmpEq = 62,
        PipeEq = 63,
        CaretEq = 61,
        LtLtEq = 64,
        GtGtEq = 65
    }
    type Transport = Values;
}
export declare namespace _Crate {
    type Transport = boolean;
}
export declare namespace _DelimTokenTreeBrace {
    interface Transport {
        readonly $type: TSKindId._DelimTokenTreeBrace;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace _DelimTokenTreeBracket {
    interface Transport {
        readonly $type: TSKindId._DelimTokenTreeBracket;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace _DelimTokenTreeParen {
    interface Transport {
        readonly $type: TSKindId._DelimTokenTreeParen;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace _ExpressionStatementBlockEnding {
    interface Transport {
        readonly $type: TSKindId._ExpressionStatementBlockEnding;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [ExpressionEndingWithBlock.Transport];
    }
}
export declare namespace _ExpressionStatementWithSemi {
    interface Transport {
        readonly $type: TSKindId._ExpressionStatementWithSemi;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Expression.Transport];
    }
}
export declare namespace FieldIdentifier {
    interface Transport {
        readonly $type: TSKindId.FieldIdentifier;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Identifier.Transport];
    }
}
export declare namespace FieldPatternNamed {
    interface Transport {
        readonly $type: TSKindId.FieldPatternNamed;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: FieldIdentifier.Transport;
        readonly pattern: Pattern.Transport;
    }
}
export declare namespace _FieldPatternShorthand {
    interface Transport {
        readonly $type: TSKindId._FieldPatternShorthand;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport;
    }
}
export declare namespace _ForeignModItemBody {
    interface Transport {
        readonly $type: TSKindId._ForeignModItemBody;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace ForeignModItemSemi {
    type Transport = TerminalTransport<TSKindId.ForeignModItemSemi, ";">;
}
export declare namespace FunctionTypeFnForm {
    interface Transport {
        readonly $type: TSKindId.FunctionTypeFnForm;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly [FunctionModifiers.Transport];
    }
}
export declare namespace FunctionTypeTraitForm {
    interface Transport {
        readonly $type: TSKindId.FunctionTypeTraitForm;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly trait: TypeIdentifier.Transport | ScopedTypeIdentifier.Transport;
    }
}
export declare namespace GenericTypeWithTurbofishTurbofish {
    type Transport = boolean;
}
export declare namespace _ImplItemBody {
    interface Transport {
        readonly $type: TSKindId._ImplItemBody;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace ImplItemNegative {
    type Transport = boolean;
}
export declare namespace ImplItemSemi {
    type Transport = TerminalTransport<TSKindId.ImplItemSemi, ";">;
}
export declare namespace InnerLineDocCommentMarker {
    type Transport = TerminalTransport<TSKindId.InnerLineDocCommentMarker, "!">;
}
export declare namespace KwAsyncMarker {
    type Transport = TerminalTransport<TSKindId.Async, "async">;
}
export declare namespace KwIn {
    type Transport = TerminalTransport<TSKindId.In, "in">;
}
export declare namespace KwMoveMarker {
    type Transport = TerminalTransport<TSKindId.Move, "move">;
}
export declare namespace KwNegative {
    type Transport = TerminalTransport<TSKindId.Bang, "!">;
}
export declare namespace KwOperator {
    type Transport = TerminalTransport<TSKindId.DotDot, "..">;
}
export declare namespace KwPub {
    type Transport = TerminalTransport<TSKindId.Pub, "pub">;
}
export declare namespace KwRefMarker {
    type Transport = TerminalTransport<TSKindId.Ref, "ref">;
}
export declare namespace KwStaticMarker {
    type Transport = TerminalTransport<TSKindId.Static, "static">;
}
export declare namespace KwTurbofish {
    type Transport = TerminalTransport<TSKindId.ColonColon, "::">;
}
export declare namespace KwUnsafeMarker {
    type Transport = TerminalTransport<TSKindId.Unsafe, "unsafe">;
}
export declare namespace LetChain {
    interface Transport {
        readonly $type: TSKindId.LetChain;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [LetChain.Transport | LetCondition.Transport | Expression.Transport];
    }
}
export declare namespace LineCommentContent {
    type Transport = TerminalTransport<TSKindId.LineCommentContent, string>;
}
export declare namespace LineCommentDoc {
    interface Transport {
        readonly $type: TSKindId.LineCommentDoc;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly doc: LineDocContent.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Slash, "/"> | TerminalTransport<TSKindId.Bang, "!">];
    }
}
export declare namespace LineCommentRegularDslash {
    type Transport = TerminalTransport<TSKindId.LineCommentRegularDslash, string>;
}
export declare namespace _MacroDefinitionBrace {
    interface Transport {
        readonly $type: TSKindId._MacroDefinitionBrace;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace _MacroDefinitionBracket {
    interface Transport {
        readonly $type: TSKindId._MacroDefinitionBracket;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace _MacroDefinitionParen {
    interface Transport {
        readonly $type: TSKindId._MacroDefinitionParen;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace _MatchArmBlockEnding {
    interface Transport {
        readonly $type: TSKindId._MatchArmBlockEnding;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: ExpressionEndingWithBlock.Transport;
    }
}
export declare namespace MatchArmWithComma {
    interface Transport {
        readonly $type: TSKindId.MatchArmWithComma;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
    }
}
export declare namespace ModItemExternal {
    type Transport = TerminalTransport<TSKindId.ModItemExternal, ";">;
}
export declare namespace _ModItemInline {
    interface Transport {
        readonly $type: TSKindId._ModItemInline;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace MoveMarker {
    type Transport = boolean;
}
export declare namespace _MutableSpecifier {
    type Transport = boolean;
}
export declare namespace NonSpecialToken {
    interface Transport {
        readonly $type: "_non_special_token";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Literal.Transport | Identifier.Transport | MutableSpecifier.Transport | Self.Transport | Super.Transport | Crate.Transport | PrimitiveType.Transport | LiteralTransport<TSKindId.Plus, "+"> | LiteralTransport<TSKindId.Dash, "-"> | LiteralTransport<TSKindId.Star, "*"> | LiteralTransport<TSKindId.Slash, "/"> | LiteralTransport<TSKindId.Percent, "%"> | LiteralTransport<TSKindId.Caret, "^"> | LiteralTransport<TSKindId.Bang, "!"> | LiteralTransport<TSKindId.Amp, "&"> | LiteralTransport<TSKindId.Pipe, "|"> | LiteralTransport<TSKindId.AmpAmp, "&&"> | LiteralTransport<TSKindId.PipePipe, "||"> | LiteralTransport<TSKindId.LtLt, "<<"> | LiteralTransport<TSKindId.GtGt, ">>"> | LiteralTransport<TSKindId.PlusEq, "+="> | LiteralTransport<TSKindId.DashEq, "-="> | LiteralTransport<TSKindId.StarEq, "*="> | LiteralTransport<TSKindId.SlashEq, "/="> | LiteralTransport<TSKindId.PercentEq, "%="> | LiteralTransport<TSKindId.CaretEq, "^="> | LiteralTransport<TSKindId.AmpEq, "&="> | LiteralTransport<TSKindId.PipeEq, "|="> | LiteralTransport<TSKindId.LtLtEq, "<<="> | LiteralTransport<TSKindId.GtGtEq, ">>="> | LiteralTransport<TSKindId.Eq, "="> | LiteralTransport<TSKindId.EqEq, "=="> | LiteralTransport<TSKindId.BangEq, "!="> | LiteralTransport<TSKindId.Gt, ">"> | LiteralTransport<TSKindId.Lt, "<"> | LiteralTransport<TSKindId.GtEq, ">="> | LiteralTransport<TSKindId.LtEq, "<="> | LiteralTransport<TSKindId.At, "@"> | LiteralTransport<TSKindId.Anonymous, "_"> | LiteralTransport<TSKindId.Dot, "."> | LiteralTransport<TSKindId.DotDot, ".."> | LiteralTransport<TSKindId.DotDotDot, "..."> | LiteralTransport<TSKindId.DotDotEq, "..="> | LiteralTransport<TSKindId.Comma, ","> | LiteralTransport<TSKindId.Semi, ";"> | LiteralTransport<TSKindId.Colon, ":"> | LiteralTransport<TSKindId.ColonColon, "::"> | LiteralTransport<TSKindId.DashGt, "->"> | LiteralTransport<TSKindId.EqGt, "=>"> | LiteralTransport<TSKindId.Pound, "#"> | LiteralTransport<TSKindId.Qmark, "?"> | LiteralTransport<TSKindId.Squote, "'"> | LiteralTransport<TSKindId.As, "as"> | LiteralTransport<TSKindId.Async, "async"> | LiteralTransport<TSKindId.Await, "await"> | LiteralTransport<TSKindId.Break, "break"> | LiteralTransport<TSKindId.Const, "const"> | LiteralTransport<TSKindId.Continue, "continue"> | LiteralTransport<TSKindId.Default, "default"> | LiteralTransport<TSKindId.Enum, "enum"> | LiteralTransport<TSKindId.Fn, "fn"> | LiteralTransport<TSKindId.For, "for"> | LiteralTransport<TSKindId.Gen, "gen"> | LiteralTransport<TSKindId.If, "if"> | LiteralTransport<TSKindId.Impl, "impl"> | LiteralTransport<TSKindId.Let, "let"> | LiteralTransport<TSKindId.Loop, "loop"> | LiteralTransport<TSKindId.Match, "match"> | LiteralTransport<TSKindId.Mod, "mod"> | LiteralTransport<TSKindId.Pub, "pub"> | LiteralTransport<TSKindId.Return, "return"> | LiteralTransport<TSKindId.Static, "static"> | LiteralTransport<TSKindId.Struct, "struct"> | LiteralTransport<TSKindId.Trait, "trait"> | LiteralTransport<TSKindId.Type, "type"> | LiteralTransport<TSKindId.Union, "union"> | LiteralTransport<TSKindId.Unsafe, "unsafe"> | LiteralTransport<TSKindId.Use, "use"> | LiteralTransport<TSKindId.Where, "where"> | LiteralTransport<TSKindId.While, "while">)[];
    }
}
export declare namespace Operator {
    type Transport = boolean;
}
export declare namespace OrPatternBinary {
    interface Transport {
        readonly $type: TSKindId.OrPatternBinary;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Pattern.Transport;
        readonly right: Pattern.Transport;
    }
}
export declare namespace OrPatternPrefix {
    interface Transport {
        readonly $type: TSKindId.OrPatternPrefix;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly right: Pattern.Transport;
    }
}
export declare namespace OuterLineDocCommentMarker {
    type Transport = TerminalTransport<TSKindId.OuterLineDocCommentMarker, "/">;
}
export declare namespace PointerTypeConst {
    type Transport = TerminalTransport<TSKindId.PointerTypeConst, "const">;
}
export declare namespace _PointerTypeMut {
    interface Transport {
        readonly $type: TSKindId._PointerTypeMut;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [MutableSpecifier.Transport];
    }
}
export declare namespace PrimitiveType {
    const enum Values {
        U8 = 28,
        I8 = 29,
        U16 = 30,
        I16 = 31,
        U32 = 32,
        I32 = 33,
        U64 = 34,
        I64 = 35,
        U128 = 36,
        I128 = 37,
        Isize = 38,
        Usize = 39,
        F32 = 40,
        F64 = 41,
        Bool = 42,
        Str = 43,
        Char = 44
    }
    type Transport = Values;
}
export declare namespace _RangeExpressionBare {
    interface Transport {
        readonly $type: TSKindId._RangeExpressionBare;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly operator: Operator.Transport;
    }
}
export declare namespace RangeExpressionBinary {
    interface Transport {
        readonly $type: TSKindId.RangeExpressionBinary;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly start: Expression.Transport;
        readonly operator: RangeExpressionBinaryOperator.Transport;
        readonly end: Expression.Transport;
    }
}
export declare namespace RangeExpressionPostfix {
    interface Transport {
        readonly $type: TSKindId.RangeExpressionPostfix;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly start: Expression.Transport;
        readonly operator: Operator.Transport;
    }
}
export declare namespace RangeExpressionPrefix {
    interface Transport {
        readonly $type: TSKindId.RangeExpressionPrefix;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly operator: Operator.Transport;
        readonly end: Expression.Transport;
    }
}
export declare namespace RangePatternLeftBare {
    type Transport = TerminalTransport<TSKindId.RangePatternLeftBare, "..">;
}
export declare namespace RangePatternLeftWithRight {
    interface Transport {
        readonly $type: TSKindId.RangePatternLeftWithRight;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly right: LiteralPattern.Transport | Path.Transport;
    }
}
export declare namespace RangePatternPrefix {
    interface Transport {
        readonly $type: TSKindId.RangePatternPrefix;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly right: LiteralPattern.Transport | Path.Transport;
    }
}
export declare namespace RefMarker {
    type Transport = boolean;
}
export declare namespace ReferenceExpressionRawConst {
    type Transport = TerminalTransport<TSKindId.ReferenceExpressionRawConst, string>;
}
export declare namespace ReferenceExpressionRawMut {
    interface Transport {
        readonly $type: TSKindId.ReferenceExpressionRawMut;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [MutableSpecifier.Transport];
    }
}
export declare namespace ReservedIdentifier {
    interface Transport {
        readonly $type: "_reserved_identifier";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Identifier.Transport];
    }
}
export declare namespace _Self {
    type Transport = boolean;
}
export declare namespace StructItemBrace {
    interface Transport {
        readonly $type: TSKindId.StructItemBrace;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: FieldDeclarationList.Transport;
        readonly $children?: readonly [WhereClause.Transport];
    }
}
export declare namespace StructItemTuple {
    interface Transport {
        readonly $type: TSKindId.StructItemTuple;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: OrderedFieldDeclarationList.Transport;
        readonly $children?: readonly [WhereClause.Transport];
    }
}
export declare namespace StructItemUnit {
    type Transport = TerminalTransport<TSKindId.StructItemUnit, ";">;
}
export declare namespace TokenBindingPatternType {
    const enum Values {
        Block = 293,
        Expr = 14,
        Expr2021 = 15,
        Ident = 16,
        Item = 17,
        Lifetime = 219,
        Literal = 19,
        Meta = 20,
        Pat = 21,
        PatParam = 22,
        Path = 23,
        Stmt = 24,
        Tt = 25,
        Ty = 26,
        Vis = 27
    }
    type Transport = Values;
}
export declare namespace _TokenTreeBrace {
    interface Transport {
        readonly $type: TSKindId._TokenTreeBrace;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace _TokenTreeBracket {
    interface Transport {
        readonly $type: TSKindId._TokenTreeBracket;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace _TokenTreeParen {
    interface Transport {
        readonly $type: TSKindId._TokenTreeParen;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace _TokenTreePatternBrace {
    interface Transport {
        readonly $type: TSKindId._TokenTreePatternBrace;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace _TokenTreePatternBracket {
    interface Transport {
        readonly $type: TSKindId._TokenTreePatternBracket;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace _TokenTreePatternParen {
    interface Transport {
        readonly $type: TSKindId._TokenTreePatternParen;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace TypeIdentifier {
    interface Transport {
        readonly $type: TSKindId.TypeIdentifier;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Identifier.Transport];
    }
}
export declare namespace UnaryExpressionOperator {
    const enum Values {
        Dash = 45,
        Star = 11,
        Bang = 49
    }
    type Transport = Values;
}
export declare namespace UnsafeMarker {
    type Transport = boolean;
}
export declare namespace _VisibilityModifierCrate {
    interface Transport {
        readonly $type: TSKindId._VisibilityModifierCrate;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Crate.Transport];
    }
}
export declare namespace VisibilityModifierInPath {
    interface Transport {
        readonly $type: TSKindId.VisibilityModifierInPath;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly in: VisibilityModifierInPathIn.Transport;
        readonly $children: readonly [Path.Transport];
    }
}
export declare namespace VisibilityModifierPub {
    interface Transport {
        readonly $type: TSKindId.VisibilityModifierPub;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly pub: VisibilityModifierPubPub.Transport;
        readonly $children?: readonly [Self.Transport | Super.Transport | Crate.Transport | VisibilityModifierInPath.Transport];
    }
}
export declare namespace WildcardPattern {
    type Transport = TerminalTransport<TSKindId.WildcardPattern, "_">;
}
export declare namespace AbstractType {
    interface Transport {
        readonly $type: TSKindId.AbstractType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type_parameters?: TypeParameters.Transport;
        readonly trait: TypeIdentifier.Transport | ScopedTypeIdentifier.Transport | RemovedTraitBound.Transport | GenericType.Transport | FunctionType.Transport | TupleType.Transport | BoundedType.Transport;
    }
}
export declare namespace Arguments {
    interface Transport {
        readonly $type: TSKindId.Arguments;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport | Expression.Transport)[];
    }
}
export declare namespace ArrayExpressionUFormSemi {
    interface Transport {
        readonly $type: TSKindId.ArrayExpression;
        readonly $variant: 'semi';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [ArrayExpressionSemi.Transport];
    }
}
export declare namespace ArrayExpressionUFormList {
    interface Transport {
        readonly $type: TSKindId.ArrayExpression;
        readonly $variant: 'list';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [ArrayExpressionList.Transport];
    }
}
export declare namespace ArrayExpression {
    type Transport = ArrayExpressionUFormSemi.Transport | ArrayExpressionUFormList.Transport;
}
export declare namespace ArrayType {
    interface Transport {
        readonly $type: TSKindId.ArrayType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly element: Type.Transport;
        readonly length?: Expression.Transport;
    }
}
export declare namespace AssignmentExpression {
    interface Transport {
        readonly $type: TSKindId.AssignmentExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Expression.Transport;
        readonly right: Expression.Transport;
    }
}
export declare namespace AssociatedType {
    interface Transport {
        readonly $type: TSKindId.AssociatedType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly bounds?: TraitBounds.Transport;
        readonly where_clause?: WhereClause.Transport;
    }
}
export declare namespace AsyncBlock {
    interface Transport {
        readonly $type: TSKindId.AsyncBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly move_marker?: MoveMarker.Transport;
        readonly block: Block.Transport;
    }
}
export declare namespace Attribute {
    interface Transport {
        readonly $type: TSKindId.Attribute;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path: Path.Transport;
        readonly $children?: readonly [Expression.Transport | DelimTokenTree.Transport];
    }
}
export declare namespace AttributeItem {
    interface Transport {
        readonly $type: TSKindId.AttributeItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attribute: Attribute.Transport;
    }
}
export declare namespace AwaitExpression {
    interface Transport {
        readonly $type: TSKindId.AwaitExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Expression.Transport];
    }
}
export declare namespace BaseFieldInitializer {
    interface Transport {
        readonly $type: TSKindId.BaseFieldInitializer;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Expression.Transport];
    }
}
export declare namespace BinaryExpression {
    interface Transport {
        readonly $type: TSKindId.BinaryExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Expression.Transport;
        readonly operator: BinaryExpressionOperator.Transport;
        readonly right: Expression.Transport;
    }
}
export declare namespace Block {
    interface Transport {
        readonly $type: TSKindId.Block;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
        readonly trailing_expression?: Expression.Transport;
        readonly $children: readonly (Statement.Transport)[];
    }
}
export declare namespace BlockComment {
    interface Transport {
        readonly $type: TSKindId.BlockComment;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly doc?: TerminalTransport;
        readonly $children?: readonly [OuterBlockDocCommentMarker.Transport | InnerBlockDocCommentMarker.Transport];
    }
}
export declare namespace BooleanLiteral {
    const enum Values {
        True = 131,
        False = 132
    }
    type Transport = Values;
}
export declare namespace BoundedType {
    interface Transport {
        readonly $type: TSKindId.BoundedType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Lifetime.Transport | Type.Transport | UseBounds.Transport;
        readonly right: Lifetime.Transport | Type.Transport | UseBounds.Transport;
    }
}
export declare namespace BracketedType {
    interface Transport {
        readonly $type: TSKindId.BracketedType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Type.Transport | QualifiedType.Transport];
    }
}
export declare namespace BreakExpression {
    interface Transport {
        readonly $type: TSKindId.BreakExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
        readonly $children?: readonly [Expression.Transport];
    }
}
export declare namespace CallExpression {
    interface Transport {
        readonly $type: TSKindId.CallExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly function: ExpressionExceptRange.Transport;
        readonly arguments: Arguments.Transport;
    }
}
export declare namespace CapturedPattern {
    interface Transport {
        readonly $type: TSKindId.CapturedPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly identifier: Identifier.Transport;
        readonly $children: readonly [Pattern.Transport];
    }
}
export declare namespace CharLiteral {
    type Transport = TerminalTransport<TSKindId.CharLiteral, string>;
}
export declare namespace ClosureExpressionExpr {
    interface Transport {
        readonly $type: "closure_expression_expr";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: Expression.Transport | LiteralTransport<TSKindId.Anonymous, "_">;
    }
}
export declare namespace ClosureExpressionUFormBlock {
    interface Transport {
        readonly $type: TSKindId.ClosureExpression;
        readonly $variant: 'block';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly static_marker?: ClosureExpressionStaticMarker.Transport;
        readonly async_marker?: ClosureExpressionAsyncMarker.Transport;
        readonly move_marker?: MoveMarker.Transport;
        readonly parameters: ClosureParameters.Transport;
        readonly $children: readonly [ClosureExpressionBlock.Transport];
    }
}
export declare namespace ClosureExpressionUFormExpr {
    interface Transport {
        readonly $type: TSKindId.ClosureExpression;
        readonly $variant: 'expr';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly static_marker?: ClosureExpressionStaticMarker.Transport;
        readonly async_marker?: ClosureExpressionAsyncMarker.Transport;
        readonly move_marker?: MoveMarker.Transport;
        readonly parameters: ClosureParameters.Transport;
        readonly $children: readonly [_ClosureExpressionExpr.Transport];
    }
}
export declare namespace ClosureExpression {
    type Transport = ClosureExpressionUFormBlock.Transport | ClosureExpressionUFormExpr.Transport;
}
export declare namespace ClosureParameters {
    interface Transport {
        readonly $type: TSKindId.ClosureParameters;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Pattern.Transport | Parameter.Transport)[];
    }
}
export declare namespace Comment {
    interface Transport {
        readonly $type: "comment";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [LineComment.Transport | BlockComment.Transport];
    }
}
export declare namespace CompoundAssignmentExpr {
    interface Transport {
        readonly $type: TSKindId.CompoundAssignmentExpr;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Expression.Transport;
        readonly operator: CompoundAssignmentExprOperator.Transport;
        readonly right: Expression.Transport;
    }
}
export declare namespace ConstBlock {
    interface Transport {
        readonly $type: TSKindId.ConstBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: Block.Transport;
    }
}
export declare namespace ConstItem {
    interface Transport {
        readonly $type: TSKindId.ConstItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: Identifier.Transport;
        readonly type: Type.Transport;
        readonly value?: Expression.Transport;
    }
}
export declare namespace ConstParameter {
    interface Transport {
        readonly $type: TSKindId.ConstParameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport;
        readonly type: Type.Transport;
        readonly value?: Block.Transport | Identifier.Transport | Literal.Transport | NegativeLiteral.Transport;
    }
}
export declare namespace ContinueExpression {
    interface Transport {
        readonly $type: TSKindId.ContinueExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
    }
}
export declare namespace Crate {
    type Transport = TerminalTransport<TSKindId.Crate, "crate">;
}
export declare namespace DeclarationList {
    interface Transport {
        readonly $type: TSKindId.DeclarationList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DeclarationStatement.Transport)[];
    }
}
export declare namespace DelimTokenTreeParen {
    interface Transport {
        readonly $type: "delim_token_tree_paren";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace DelimTokenTreeBracket {
    interface Transport {
        readonly $type: "delim_token_tree_bracket";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace DelimTokenTreeBrace {
    interface Transport {
        readonly $type: "delim_token_tree_brace";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (DelimTokens.Transport)[];
    }
}
export declare namespace DelimTokenTreeUFormParen {
    interface Transport {
        readonly $type: TSKindId.DelimTokenTree;
        readonly $variant: 'paren';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_DelimTokenTreeParen.Transport];
    }
}
export declare namespace DelimTokenTreeUFormBracket {
    interface Transport {
        readonly $type: TSKindId.DelimTokenTree;
        readonly $variant: 'bracket';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_DelimTokenTreeBracket.Transport];
    }
}
export declare namespace DelimTokenTreeUFormBrace {
    interface Transport {
        readonly $type: TSKindId.DelimTokenTree;
        readonly $variant: 'brace';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_DelimTokenTreeBrace.Transport];
    }
}
export declare namespace DelimTokenTree {
    type Transport = DelimTokenTreeUFormParen.Transport | DelimTokenTreeUFormBracket.Transport | DelimTokenTreeUFormBrace.Transport;
}
export declare namespace DynamicType {
    interface Transport {
        readonly $type: TSKindId.DynamicType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly trait: HigherRankedTraitBound.Transport | TypeIdentifier.Transport | ScopedTypeIdentifier.Transport | GenericType.Transport | FunctionType.Transport | TupleType.Transport;
    }
}
export declare namespace ElseClause {
    interface Transport {
        readonly $type: TSKindId.ElseClause;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Block.Transport | IfExpression.Transport];
    }
}
export declare namespace EmptyStatement {
    type Transport = TerminalTransport<TSKindId.EmptyStatement, ";">;
}
export declare namespace EnumItem {
    interface Transport {
        readonly $type: TSKindId.EnumItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly body: EnumVariantList.Transport;
    }
}
export declare namespace EnumVariant {
    interface Transport {
        readonly $type: TSKindId.EnumVariant;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: Identifier.Transport;
        readonly body?: FieldDeclarationList.Transport | OrderedFieldDeclarationList.Transport;
        readonly value?: Expression.Transport;
    }
}
export declare namespace EnumVariantList {
    interface Transport {
        readonly $type: TSKindId.EnumVariantList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (AttributeItem.Transport | EnumVariant.Transport)[];
    }
}
export declare namespace EscapeSequence {
    type Transport = TerminalTransport<TSKindId.EscapeSequence, string>;
}
export declare namespace ExpressionStatementWithSemi {
    interface Transport {
        readonly $type: "expression_statement_with_semi";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Expression.Transport];
    }
}
export declare namespace ExpressionStatementBlockEnding {
    interface Transport {
        readonly $type: "expression_statement_block_ending";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [ExpressionEndingWithBlock.Transport];
    }
}
export declare namespace ExpressionStatementUFormWithSemi {
    interface Transport {
        readonly $type: TSKindId.ExpressionStatement;
        readonly $variant: 'with_semi';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_ExpressionStatementWithSemi.Transport];
    }
}
export declare namespace ExpressionStatementUFormBlockEnding {
    interface Transport {
        readonly $type: TSKindId.ExpressionStatement;
        readonly $variant: 'block_ending';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_ExpressionStatementBlockEnding.Transport];
    }
}
export declare namespace ExpressionStatement {
    type Transport = ExpressionStatementUFormWithSemi.Transport | ExpressionStatementUFormBlockEnding.Transport;
}
export declare namespace ExternCrateDeclaration {
    interface Transport {
        readonly $type: TSKindId.ExternCrateDeclaration;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly crate: _Crate.Transport;
        readonly name: Identifier.Transport;
        readonly alias?: Identifier.Transport;
    }
}
export declare namespace ExternModifier {
    interface Transport {
        readonly $type: TSKindId.ExternModifier;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly string_literal?: StringLiteral.Transport;
    }
}
export declare namespace FieldDeclaration {
    interface Transport {
        readonly $type: TSKindId.FieldDeclaration;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: FieldIdentifier.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace FieldDeclarationList {
    interface Transport {
        readonly $type: TSKindId.FieldDeclarationList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (AttributeItem.Transport | FieldDeclaration.Transport)[];
    }
}
export declare namespace FieldExpression {
    interface Transport {
        readonly $type: TSKindId.FieldExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
        readonly field: FieldIdentifier.Transport | IntegerLiteral.Transport;
    }
}
export declare namespace FieldInitializer {
    interface Transport {
        readonly $type: TSKindId.FieldInitializer;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly field: FieldIdentifier.Transport | IntegerLiteral.Transport;
        readonly value: Expression.Transport;
        readonly $children: readonly (AttributeItem.Transport)[];
    }
}
export declare namespace FieldInitializerList {
    interface Transport {
        readonly $type: TSKindId.FieldInitializerList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (ShorthandFieldInitializer.Transport | FieldInitializer.Transport | BaseFieldInitializer.Transport)[];
    }
}
export declare namespace FieldPatternShorthand {
    interface Transport {
        readonly $type: "field_pattern_shorthand";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport;
    }
}
export declare namespace FieldPatternUFormShorthand {
    interface Transport {
        readonly $type: TSKindId.FieldPattern;
        readonly $variant: 'shorthand';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly ref_marker?: RefMarker.Transport;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly $children: readonly [_FieldPatternShorthand.Transport];
    }
}
export declare namespace FieldPatternUFormNamed {
    interface Transport {
        readonly $type: TSKindId.FieldPattern;
        readonly $variant: 'named';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly ref_marker?: RefMarker.Transport;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly $children: readonly [FieldPatternNamed.Transport];
    }
}
export declare namespace FieldPattern {
    type Transport = FieldPatternUFormShorthand.Transport | FieldPatternUFormNamed.Transport;
}
export declare namespace ForExpression {
    interface Transport {
        readonly $type: TSKindId.ForExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
        readonly pattern: Pattern.Transport;
        readonly value: Expression.Transport;
        readonly body: Block.Transport;
    }
}
export declare namespace ForLifetimes {
    interface Transport {
        readonly $type: TSKindId.ForLifetimes;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Lifetime.Transport)[];
    }
}
export declare namespace ForeignModItemBody {
    interface Transport {
        readonly $type: "foreign_mod_item_body";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace ForeignModItemUFormSemi {
    interface Transport {
        readonly $type: TSKindId.ForeignModItem;
        readonly $variant: 'semi';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly extern_modifier: ExternModifier.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Semi, ";">];
    }
}
export declare namespace ForeignModItemUFormBody {
    interface Transport {
        readonly $type: TSKindId.ForeignModItem;
        readonly $variant: 'body';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly extern_modifier: ExternModifier.Transport;
        readonly $children: readonly [_ForeignModItemBody.Transport];
    }
}
export declare namespace ForeignModItem {
    type Transport = ForeignModItemUFormSemi.Transport | ForeignModItemUFormBody.Transport;
}
export declare namespace FragmentSpecifier {
    const enum Values {
        Block = 293,
        Expr = 14,
        Expr2021 = 15,
        Ident = 16,
        Item = 17,
        Lifetime = 219,
        Literal = 19,
        Meta = 20,
        Pat = 21,
        PatParam = 22,
        Path = 23,
        Stmt = 24,
        Tt = 25,
        Ty = 26,
        Vis = 27
    }
    type Transport = Values;
}
export declare namespace FunctionItem {
    interface Transport {
        readonly $type: TSKindId.FunctionItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly function_modifiers?: FunctionModifiers.Transport;
        readonly name: Identifier.Transport | Metavariable.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly parameters: Parameters.Transport;
        readonly return_type?: Type.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly body: Block.Transport;
    }
}
export declare namespace FunctionModifiers {
    interface Transport {
        readonly $type: TSKindId.FunctionModifiers;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly modifier: readonly (LiteralTransport<TSKindId.Async, "async"> | LiteralTransport<TSKindId.Default, "default"> | LiteralTransport<TSKindId.Const, "const"> | LiteralTransport<TSKindId.Unsafe, "unsafe"> | ExternModifier.Transport)[];
    }
}
export declare namespace FunctionSignatureItem {
    interface Transport {
        readonly $type: TSKindId.FunctionSignatureItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly function_modifiers?: FunctionModifiers.Transport;
        readonly name: Identifier.Transport | Metavariable.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly parameters: Parameters.Transport;
        readonly return_type?: Type.Transport;
        readonly where_clause?: WhereClause.Transport;
    }
}
export declare namespace FunctionType {
    interface Transport {
        readonly $type: TSKindId.FunctionType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly for_lifetimes?: ForLifetimes.Transport;
        readonly parameters: Parameters.Transport;
        readonly return_type?: Type.Transport;
        readonly $children: readonly [FunctionTypeTraitForm.Transport | FunctionTypeFnForm.Transport];
    }
}
export declare namespace GenBlock {
    interface Transport {
        readonly $type: TSKindId.GenBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly move_marker?: MoveMarker.Transport;
        readonly block: Block.Transport;
    }
}
export declare namespace GenericFunction {
    interface Transport {
        readonly $type: TSKindId.GenericFunction;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly function: Identifier.Transport | ScopedIdentifier.Transport | FieldExpression.Transport;
        readonly type_arguments: TypeArguments.Transport;
    }
}
export declare namespace GenericPattern {
    interface Transport {
        readonly $type: TSKindId.GenericPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type_arguments: TypeArguments.Transport;
        readonly $children: readonly [Identifier.Transport | ScopedIdentifier.Transport];
    }
}
export declare namespace GenericType {
    interface Transport {
        readonly $type: TSKindId.GenericType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: TypeIdentifier.Transport | ReservedIdentifier.Transport | ScopedTypeIdentifier.Transport;
        readonly type_arguments: TypeArguments.Transport;
    }
}
export declare namespace GenericTypeWithTurbofish {
    interface Transport {
        readonly $type: TSKindId.GenericTypeWithTurbofish;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: TypeIdentifier.Transport | ScopedIdentifier.Transport;
        readonly turbofish: GenericTypeWithTurbofishTurbofish.Transport;
        readonly type_arguments: TypeArguments.Transport;
    }
}
export declare namespace HigherRankedTraitBound {
    interface Transport {
        readonly $type: TSKindId.HigherRankedTraitBound;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type_parameters: TypeParameters.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace Identifier {
    type Transport = TerminalTransport<TSKindId.Identifier, string>;
}
export declare namespace IfExpression {
    interface Transport {
        readonly $type: TSKindId.IfExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly condition: Condition.Transport;
        readonly consequence: Block.Transport;
        readonly alternative?: ElseClause.Transport;
    }
}
export declare namespace ImplItemBody {
    interface Transport {
        readonly $type: "impl_item_body";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace ImplItemUFormBody {
    interface Transport {
        readonly $type: TSKindId.ImplItem;
        readonly $variant: 'body';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly unsafe_marker?: UnsafeMarker.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly negative?: ImplItemNegative.Transport;
        readonly trait?: TypeIdentifier.Transport | ScopedTypeIdentifier.Transport | GenericType.Transport;
        readonly type: Type.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly $children: readonly [_ImplItemBody.Transport];
    }
}
export declare namespace ImplItemUFormSemi {
    interface Transport {
        readonly $type: TSKindId.ImplItem;
        readonly $variant: 'semi';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly unsafe_marker?: UnsafeMarker.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly negative?: ImplItemNegative.Transport;
        readonly trait?: TypeIdentifier.Transport | ScopedTypeIdentifier.Transport | GenericType.Transport;
        readonly type: Type.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Semi, ";">];
    }
}
export declare namespace ImplItem {
    type Transport = ImplItemUFormBody.Transport | ImplItemUFormSemi.Transport;
}
export declare namespace IndexExpression {
    interface Transport {
        readonly $type: TSKindId.IndexExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly object: Expression.Transport;
        readonly index: Expression.Transport;
    }
}
export declare namespace InnerAttributeItem {
    interface Transport {
        readonly $type: TSKindId.InnerAttributeItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attribute: Attribute.Transport;
    }
}
export declare namespace IntegerLiteral {
    type Transport = TerminalTransport<TSKindId.IntegerLiteral, string>;
}
export declare namespace Label {
    interface Transport {
        readonly $type: TSKindId.Label;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly identifier: Identifier.Transport;
    }
}
export declare namespace LastMatchArm {
    interface Transport {
        readonly $type: TSKindId.LastMatchArm;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly pattern: MatchPattern.Transport;
        readonly value: Expression.Transport;
        readonly $children: readonly (AttributeItem.Transport | InnerAttributeItem.Transport)[];
    }
}
export declare namespace LetCondition {
    interface Transport {
        readonly $type: TSKindId.LetCondition;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly pattern: Pattern.Transport;
        readonly value: Expression.Transport;
    }
}
export declare namespace LetDeclaration {
    interface Transport {
        readonly $type: TSKindId.LetDeclaration;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly pattern: Pattern.Transport;
        readonly type?: Type.Transport;
        readonly value?: Expression.Transport;
        readonly alternative?: Block.Transport;
    }
}
export declare namespace Lifetime {
    interface Transport {
        readonly $type: TSKindId.Lifetime;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly identifier: Identifier.Transport;
    }
}
export declare namespace LifetimeParameter {
    interface Transport {
        readonly $type: TSKindId.LifetimeParameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Lifetime.Transport;
        readonly bounds?: TraitBounds.Transport;
    }
}
export declare namespace LineCommentUFormRegularDslash {
    interface Transport {
        readonly $type: TSKindId.LineComment;
        readonly $variant: 'regular_dslash';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [LineCommentRegularDslash.Transport];
    }
}
export declare namespace LineCommentUFormDoc {
    interface Transport {
        readonly $type: TSKindId.LineComment;
        readonly $variant: 'doc';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [LineCommentDoc.Transport];
    }
}
export declare namespace LineCommentUFormContent {
    interface Transport {
        readonly $type: TSKindId.LineComment;
        readonly $variant: 'content';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [LineCommentContent.Transport];
    }
}
export declare namespace LineComment {
    type Transport = LineCommentUFormRegularDslash.Transport | LineCommentUFormDoc.Transport | LineCommentUFormContent.Transport;
}
export declare namespace LoopExpression {
    interface Transport {
        readonly $type: TSKindId.LoopExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
        readonly body: Block.Transport;
    }
}
export declare namespace MacroDefinitionParen {
    interface Transport {
        readonly $type: "macro_definition_paren";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace MacroDefinitionBracket {
    interface Transport {
        readonly $type: "macro_definition_bracket";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace MacroDefinitionBrace {
    interface Transport {
        readonly $type: "macro_definition_brace";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MacroRule.Transport)[];
    }
}
export declare namespace MacroDefinitionUFormParen {
    interface Transport {
        readonly $type: TSKindId.MacroDefinition;
        readonly $variant: 'paren';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport | ReservedIdentifier.Transport;
        readonly $children: readonly [_MacroDefinitionParen.Transport];
    }
}
export declare namespace MacroDefinitionUFormBracket {
    interface Transport {
        readonly $type: TSKindId.MacroDefinition;
        readonly $variant: 'bracket';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport | ReservedIdentifier.Transport;
        readonly $children: readonly [_MacroDefinitionBracket.Transport];
    }
}
export declare namespace MacroDefinitionUFormBrace {
    interface Transport {
        readonly $type: TSKindId.MacroDefinition;
        readonly $variant: 'brace';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Identifier.Transport | ReservedIdentifier.Transport;
        readonly $children: readonly [_MacroDefinitionBrace.Transport];
    }
}
export declare namespace MacroDefinition {
    type Transport = MacroDefinitionUFormParen.Transport | MacroDefinitionUFormBracket.Transport | MacroDefinitionUFormBrace.Transport;
}
export declare namespace MacroInvocation {
    interface Transport {
        readonly $type: TSKindId.MacroInvocation;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly macro: ScopedIdentifier.Transport | Identifier.Transport | ReservedIdentifier.Transport;
        readonly token_tree: DelimTokenTree.Transport;
    }
}
export declare namespace MacroRule {
    interface Transport {
        readonly $type: TSKindId.MacroRule;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: TokenTreePattern.Transport;
        readonly right: TokenTree.Transport;
    }
}
export declare namespace MatchArmBlockEnding {
    interface Transport {
        readonly $type: "match_arm_block_ending";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: ExpressionEndingWithBlock.Transport;
    }
}
export declare namespace MatchArmUFormWithComma {
    interface Transport {
        readonly $type: TSKindId.MatchArm;
        readonly $variant: 'with_comma';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport | InnerAttributeItem.Transport)[];
        readonly pattern: MatchPattern.Transport;
        readonly $children: readonly [MatchArmWithComma.Transport];
    }
}
export declare namespace MatchArmUFormBlockEnding {
    interface Transport {
        readonly $type: TSKindId.MatchArm;
        readonly $variant: 'block_ending';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport | InnerAttributeItem.Transport)[];
        readonly pattern: MatchPattern.Transport;
        readonly $children: readonly [_MatchArmBlockEnding.Transport];
    }
}
export declare namespace MatchArm {
    type Transport = MatchArmUFormWithComma.Transport | MatchArmUFormBlockEnding.Transport;
}
export declare namespace MatchBlock {
    interface Transport {
        readonly $type: TSKindId.MatchBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly (MatchArm.Transport | LastMatchArm.Transport)[];
    }
}
export declare namespace MatchExpression {
    interface Transport {
        readonly $type: TSKindId.MatchExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
        readonly body: MatchBlock.Transport;
    }
}
export declare namespace MatchPattern {
    interface Transport {
        readonly $type: TSKindId.MatchPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly condition?: Condition.Transport;
        readonly $children: readonly [Pattern.Transport];
    }
}
export declare namespace Metavariable {
    type Transport = TerminalTransport<TSKindId.Metavariable, string>;
}
export declare namespace ModItemInline {
    interface Transport {
        readonly $type: "mod_item_inline";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace ModItemUFormExternal {
    interface Transport {
        readonly $type: TSKindId.ModItem;
        readonly $variant: 'external';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: Identifier.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Semi, ";">];
    }
}
export declare namespace ModItemUFormInline {
    interface Transport {
        readonly $type: TSKindId.ModItem;
        readonly $variant: 'inline';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: Identifier.Transport;
        readonly $children: readonly [_ModItemInline.Transport];
    }
}
export declare namespace ModItem {
    type Transport = ModItemUFormExternal.Transport | ModItemUFormInline.Transport;
}
export declare namespace MutPattern {
    interface Transport {
        readonly $type: TSKindId.MutPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly mutable_specifier: _MutableSpecifier.Transport;
        readonly $children: readonly [Pattern.Transport];
    }
}
export declare namespace MutableSpecifier {
    type Transport = TerminalTransport<TSKindId.MutableSpecifier, "mut">;
}
export declare namespace NegativeLiteral {
    interface Transport {
        readonly $type: TSKindId.NegativeLiteral;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: IntegerLiteral.Transport | FloatLiteral.Transport;
    }
}
export declare namespace NeverType {
    type Transport = TerminalTransport<TSKindId.NeverType, "!">;
}
export declare namespace OrPatternUFormBinary {
    interface Transport {
        readonly $type: TSKindId.OrPattern;
        readonly $variant: 'binary';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [OrPatternBinary.Transport];
    }
}
export declare namespace OrPatternUFormPrefix {
    interface Transport {
        readonly $type: TSKindId.OrPattern;
        readonly $variant: 'prefix';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [OrPatternPrefix.Transport];
    }
}
export declare namespace OrPattern {
    type Transport = OrPatternUFormBinary.Transport | OrPatternUFormPrefix.Transport;
}
export declare namespace OrderedFieldDeclarationList {
    interface Transport {
        readonly $type: TSKindId.OrderedFieldDeclarationList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: readonly (Type.Transport)[];
        readonly $children: readonly (AttributeItem.Transport | VisibilityModifier.Transport)[];
    }
}
export declare namespace Parameter {
    interface Transport {
        readonly $type: TSKindId.Parameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly pattern: Pattern.Transport | Self.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace Parameters {
    interface Transport {
        readonly $type: TSKindId.Parameters;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (AttributeItem.Transport | Parameter.Transport | SelfParameter.Transport | VariadicParameter.Transport | LiteralTransport<TSKindId.Anonymous, "_"> | Type.Transport)[];
    }
}
export declare namespace ParenthesizedExpression {
    interface Transport {
        readonly $type: TSKindId.ParenthesizedExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Expression.Transport];
    }
}
export declare namespace PointerTypeMut {
    interface Transport {
        readonly $type: "pointer_type_mut";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [MutableSpecifier.Transport];
    }
}
export declare namespace PointerTypeUFormConst {
    interface Transport {
        readonly $type: TSKindId.PointerType;
        readonly $variant: 'const';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: Type.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Const, "const">];
    }
}
export declare namespace PointerTypeUFormMut {
    interface Transport {
        readonly $type: TSKindId.PointerType;
        readonly $variant: 'mut';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: Type.Transport;
        readonly $children: readonly [_PointerTypeMut.Transport];
    }
}
export declare namespace PointerType {
    type Transport = PointerTypeUFormConst.Transport | PointerTypeUFormMut.Transport;
}
export declare namespace QualifiedType {
    interface Transport {
        readonly $type: TSKindId.QualifiedType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: Type.Transport;
        readonly alias: Type.Transport;
    }
}
export declare namespace RangeExpressionBare {
    interface Transport {
        readonly $type: "range_expression_bare";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly operator: Operator.Transport;
    }
}
export declare namespace RangeExpressionUFormBinary {
    interface Transport {
        readonly $type: TSKindId.RangeExpression;
        readonly $variant: 'binary';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [RangeExpressionBinary.Transport];
    }
}
export declare namespace RangeExpressionUFormPostfix {
    interface Transport {
        readonly $type: TSKindId.RangeExpression;
        readonly $variant: 'postfix';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [RangeExpressionPostfix.Transport];
    }
}
export declare namespace RangeExpressionUFormPrefix {
    interface Transport {
        readonly $type: TSKindId.RangeExpression;
        readonly $variant: 'prefix';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [RangeExpressionPrefix.Transport];
    }
}
export declare namespace RangeExpressionUFormBare {
    interface Transport {
        readonly $type: TSKindId.RangeExpression;
        readonly $variant: 'bare';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_RangeExpressionBare.Transport];
    }
}
export declare namespace RangeExpression {
    type Transport = RangeExpressionUFormBinary.Transport | RangeExpressionUFormPostfix.Transport | RangeExpressionUFormPrefix.Transport | RangeExpressionUFormBare.Transport;
}
export declare namespace RangePatternUFormLeftWithRight {
    interface Transport {
        readonly $type: TSKindId.RangePattern;
        readonly $variant: 'left_with_right';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: LiteralPattern.Transport | Path.Transport;
        readonly $children: readonly [RangePatternLeftWithRight.Transport];
    }
}
export declare namespace RangePatternUFormLeftBare {
    interface Transport {
        readonly $type: TSKindId.RangePattern;
        readonly $variant: 'left_bare';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: LiteralPattern.Transport | Path.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.DotDot, "..">];
    }
}
export declare namespace RangePatternUFormPrefix {
    interface Transport {
        readonly $type: TSKindId.RangePattern;
        readonly $variant: 'prefix';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [RangePatternPrefix.Transport];
    }
}
export declare namespace RangePattern {
    type Transport = RangePatternUFormLeftWithRight.Transport | RangePatternUFormLeftBare.Transport | RangePatternUFormPrefix.Transport;
}
export declare namespace RawStringLiteral {
    interface Transport {
        readonly $type: TSKindId.RawStringLiteral;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly raw_string_literal_start?: TerminalTransport;
        readonly string_content: RawStringLiteralContent.Transport;
        readonly raw_string_literal_end?: TerminalTransport;
    }
}
export declare namespace RefPattern {
    interface Transport {
        readonly $type: TSKindId.RefPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Pattern.Transport];
    }
}
export declare namespace ReferenceExpression {
    interface Transport {
        readonly $type: TSKindId.ReferenceExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
        readonly $children?: readonly [ReferenceExpressionRawConst.Transport | ReferenceExpressionRawMut.Transport | MutableSpecifier.Transport];
    }
}
export declare namespace ReferencePattern {
    interface Transport {
        readonly $type: TSKindId.ReferencePattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly pattern: Pattern.Transport;
    }
}
export declare namespace ReferenceType {
    interface Transport {
        readonly $type: TSKindId.ReferenceType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly lifetime?: Lifetime.Transport;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace RemainingFieldPattern {
    type Transport = TerminalTransport<TSKindId.RemainingFieldPattern, "..">;
}
export declare namespace RemovedTraitBound {
    interface Transport {
        readonly $type: TSKindId.RemovedTraitBound;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Type.Transport];
    }
}
export declare namespace ReturnExpression {
    interface Transport {
        readonly $type: TSKindId.ReturnExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly [Expression.Transport];
    }
}
export declare namespace ScopedIdentifier {
    interface Transport {
        readonly $type: TSKindId.ScopedIdentifier;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path?: Path.Transport | BracketedType.Transport | GenericTypeWithTurbofish.Transport;
        readonly name: Identifier.Transport | Super.Transport;
    }
}
export declare namespace ScopedTypeIdentifier {
    interface Transport {
        readonly $type: TSKindId.ScopedTypeIdentifier;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path?: Path.Transport | GenericTypeWithTurbofish.Transport | BracketedType.Transport;
        readonly name: TypeIdentifier.Transport;
    }
}
export declare namespace ScopedTypeIdentifierInExpressionPosition {
    interface Transport {
        readonly $type: TSKindId.ScopedTypeIdentifierInExpressionPosition;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path?: Path.Transport | GenericTypeWithTurbofish.Transport;
        readonly name: TypeIdentifier.Transport;
    }
}
export declare namespace ScopedUseList {
    interface Transport {
        readonly $type: TSKindId.ScopedUseList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path?: Path.Transport;
        readonly list: UseList.Transport;
    }
}
export declare namespace Self {
    type Transport = TerminalTransport<TSKindId.Self, "self">;
}
export declare namespace SelfParameter {
    interface Transport {
        readonly $type: TSKindId.SelfParameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly reference?: LiteralTransport<TSKindId.Amp, "&">;
        readonly lifetime?: Lifetime.Transport;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly self: _Self.Transport;
    }
}
export declare namespace Shebang {
    type Transport = TerminalTransport<TSKindId.Shebang, string>;
}
export declare namespace ShorthandFieldInitializer {
    interface Transport {
        readonly $type: TSKindId.ShorthandFieldInitializer;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport)[];
        readonly identifier: Identifier.Transport;
    }
}
export declare namespace SlicePattern {
    interface Transport {
        readonly $type: TSKindId.SlicePattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Pattern.Transport)[];
    }
}
export declare namespace SourceFile {
    interface Transport {
        readonly $type: TSKindId.SourceFile;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly shebang?: Shebang.Transport;
        readonly statements: readonly (Statement.Transport)[];
    }
}
export declare namespace StaticItem {
    interface Transport {
        readonly $type: TSKindId.StaticItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly mutable_specifier?: RefMarker.Transport | _MutableSpecifier.Transport;
        readonly name: Identifier.Transport;
        readonly type: Type.Transport;
        readonly value?: Expression.Transport;
    }
}
export declare namespace StringLiteral {
    interface Transport {
        readonly $type: TSKindId.StringLiteral;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (EscapeSequence.Transport | StringContent.Transport)[];
    }
}
export declare namespace StructExpression {
    interface Transport {
        readonly $type: TSKindId.StructExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: TypeIdentifier.Transport | ScopedTypeIdentifierInExpressionPosition.Transport | GenericTypeWithTurbofish.Transport;
        readonly body: FieldInitializerList.Transport;
    }
}
export declare namespace StructItemUFormBrace {
    interface Transport {
        readonly $type: TSKindId.StructItem;
        readonly $variant: 'brace';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly $children: readonly [StructItemBrace.Transport];
    }
}
export declare namespace StructItemUFormTuple {
    interface Transport {
        readonly $type: TSKindId.StructItem;
        readonly $variant: 'tuple';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly $children: readonly [StructItemTuple.Transport];
    }
}
export declare namespace StructItemUFormUnit {
    interface Transport {
        readonly $type: TSKindId.StructItem;
        readonly $variant: 'unit';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly $children: readonly [TerminalTransport<TSKindId.Semi, ";">];
    }
}
export declare namespace StructItem {
    type Transport = StructItemUFormBrace.Transport | StructItemUFormTuple.Transport | StructItemUFormUnit.Transport;
}
export declare namespace StructPattern {
    interface Transport {
        readonly $type: TSKindId.StructPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: TypeIdentifier.Transport | ScopedTypeIdentifier.Transport;
        readonly $children: readonly (FieldPattern.Transport | RemainingFieldPattern.Transport)[];
    }
}
export declare namespace Super {
    type Transport = TerminalTransport<TSKindId.Super, "super">;
}
export declare namespace TokenBindingPattern {
    interface Transport {
        readonly $type: TSKindId.TokenBindingPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: Metavariable.Transport;
        readonly type: TokenBindingPatternType.Transport;
    }
}
export declare namespace TokenRepetition {
    interface Transport {
        readonly $type: TSKindId.TokenRepetition;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace TokenRepetitionPattern {
    interface Transport {
        readonly $type: TSKindId.TokenRepetitionPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace TokenTreeParen {
    interface Transport {
        readonly $type: "token_tree_paren";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace TokenTreeBracket {
    interface Transport {
        readonly $type: "token_tree_bracket";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace TokenTreeBrace {
    interface Transport {
        readonly $type: "token_tree_brace";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Tokens.Transport)[];
    }
}
export declare namespace TokenTreeUFormParen {
    interface Transport {
        readonly $type: TSKindId.TokenTree;
        readonly $variant: 'paren';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreeParen.Transport];
    }
}
export declare namespace TokenTreeUFormBracket {
    interface Transport {
        readonly $type: TSKindId.TokenTree;
        readonly $variant: 'bracket';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreeBracket.Transport];
    }
}
export declare namespace TokenTreeUFormBrace {
    interface Transport {
        readonly $type: TSKindId.TokenTree;
        readonly $variant: 'brace';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreeBrace.Transport];
    }
}
export declare namespace TokenTree {
    type Transport = TokenTreeUFormParen.Transport | TokenTreeUFormBracket.Transport | TokenTreeUFormBrace.Transport;
}
export declare namespace TokenTreePatternParen {
    interface Transport {
        readonly $type: "token_tree_pattern_paren";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace TokenTreePatternBracket {
    interface Transport {
        readonly $type: "token_tree_pattern_bracket";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace TokenTreePatternBrace {
    interface Transport {
        readonly $type: "token_tree_pattern_brace";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (TokenPattern.Transport)[];
    }
}
export declare namespace TokenTreePatternUFormParen {
    interface Transport {
        readonly $type: TSKindId.TokenTreePattern;
        readonly $variant: 'paren';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreePatternParen.Transport];
    }
}
export declare namespace TokenTreePatternUFormBracket {
    interface Transport {
        readonly $type: TSKindId.TokenTreePattern;
        readonly $variant: 'bracket';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreePatternBracket.Transport];
    }
}
export declare namespace TokenTreePatternUFormBrace {
    interface Transport {
        readonly $type: TSKindId.TokenTreePattern;
        readonly $variant: 'brace';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_TokenTreePatternBrace.Transport];
    }
}
export declare namespace TokenTreePattern {
    type Transport = TokenTreePatternUFormParen.Transport | TokenTreePatternUFormBracket.Transport | TokenTreePatternUFormBrace.Transport;
}
export declare namespace TraitBounds {
    interface Transport {
        readonly $type: TSKindId.TraitBounds;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Type.Transport | Lifetime.Transport | HigherRankedTraitBound.Transport)[];
    }
}
export declare namespace TraitItem {
    interface Transport {
        readonly $type: TSKindId.TraitItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly unsafe_marker?: UnsafeMarker.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly bounds?: TraitBounds.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly body: DeclarationList.Transport;
    }
}
export declare namespace TryBlock {
    interface Transport {
        readonly $type: TSKindId.TryBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly block: Block.Transport;
    }
}
export declare namespace TryExpression {
    interface Transport {
        readonly $type: TSKindId.TryExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
    }
}
export declare namespace TupleExpression {
    interface Transport {
        readonly $type: TSKindId.TupleExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport)[];
        readonly elements?: readonly (Expression.Transport)[];
    }
}
export declare namespace TuplePattern {
    interface Transport {
        readonly $type: TSKindId.TuplePattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Pattern.Transport | ClosureExpression.Transport)[];
    }
}
export declare namespace TupleStructPattern {
    interface Transport {
        readonly $type: TSKindId.TupleStructPattern;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly type: Identifier.Transport | ScopedIdentifier.Transport | GenericTypeWithTurbofish.Transport;
        readonly $children: readonly (Pattern.Transport)[];
    }
}
export declare namespace TupleType {
    interface Transport {
        readonly $type: TSKindId.TupleType;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Type.Transport)[];
    }
}
export declare namespace TypeArguments {
    interface Transport {
        readonly $type: TSKindId.TypeArguments;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Type.Transport | TypeBinding.Transport | Lifetime.Transport | Literal.Transport | Block.Transport | TraitBounds.Transport)[];
    }
}
export declare namespace TypeBinding {
    interface Transport {
        readonly $type: TSKindId.TypeBinding;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: TypeIdentifier.Transport;
        readonly type_arguments?: TypeArguments.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace TypeCastExpression {
    interface Transport {
        readonly $type: TSKindId.TypeCastExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly value: Expression.Transport;
        readonly type: Type.Transport;
    }
}
export declare namespace TypeItem {
    interface Transport {
        readonly $type: TSKindId.TypeItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly type: Type.Transport;
        readonly trailing_where_clause?: WhereClause.Transport;
    }
}
export declare namespace TypeParameter {
    interface Transport {
        readonly $type: TSKindId.TypeParameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly name: TypeIdentifier.Transport;
        readonly bounds?: TraitBounds.Transport;
        readonly default_type?: Type.Transport;
    }
}
export declare namespace TypeParameters {
    interface Transport {
        readonly $type: TSKindId.TypeParameters;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly attributes: readonly (AttributeItem.Transport | Metavariable.Transport | TypeParameter.Transport | LifetimeParameter.Transport | ConstParameter.Transport)[];
    }
}
export declare namespace UnaryExpression {
    interface Transport {
        readonly $type: TSKindId.UnaryExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly operator: UnaryExpressionOperator.Transport;
        readonly operand: Expression.Transport;
    }
}
export declare namespace UnionItem {
    interface Transport {
        readonly $type: TSKindId.UnionItem;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly name: TypeIdentifier.Transport;
        readonly type_parameters?: TypeParameters.Transport;
        readonly where_clause?: WhereClause.Transport;
        readonly body: FieldDeclarationList.Transport;
    }
}
export declare namespace UnitExpression {
    type Transport = TerminalTransport<TSKindId.UnitExpression, string>;
}
export declare namespace UnitType {
    type Transport = TerminalTransport<TSKindId.UnitType, string>;
}
export declare namespace UnsafeBlock {
    interface Transport {
        readonly $type: TSKindId.UnsafeBlock;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly block: Block.Transport;
    }
}
export declare namespace UseAsClause {
    interface Transport {
        readonly $type: TSKindId.UseAsClause;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path: Path.Transport;
        readonly alias: Identifier.Transport;
    }
}
export declare namespace UseBounds {
    interface Transport {
        readonly $type: TSKindId.UseBounds;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (Lifetime.Transport | TypeIdentifier.Transport)[];
    }
}
export declare namespace UseDeclaration {
    interface Transport {
        readonly $type: TSKindId.UseDeclaration;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly visibility_modifier?: VisibilityModifier.Transport;
        readonly argument: UseClause.Transport;
    }
}
export declare namespace UseList {
    interface Transport {
        readonly $type: TSKindId.UseList;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (UseClause.Transport)[];
    }
}
export declare namespace UseWildcard {
    interface Transport {
        readonly $type: TSKindId.UseWildcard;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly path?: Path.Transport;
    }
}
export declare namespace VariadicParameter {
    interface Transport {
        readonly $type: TSKindId.VariadicParameter;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly mutable_specifier?: _MutableSpecifier.Transport;
        readonly pattern?: Pattern.Transport;
    }
}
export declare namespace VisibilityModifierCrate {
    interface Transport {
        readonly $type: "visibility_modifier_crate";
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [Crate.Transport];
    }
}
export declare namespace VisibilityModifierUFormInPath {
    interface Transport {
        readonly $type: TSKindId.VisibilityModifier;
        readonly $variant: 'in_path';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [VisibilityModifierInPath.Transport];
    }
}
export declare namespace VisibilityModifierUFormCrate {
    interface Transport {
        readonly $type: TSKindId.VisibilityModifier;
        readonly $variant: 'crate';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [_VisibilityModifierCrate.Transport];
    }
}
export declare namespace VisibilityModifierUFormPub {
    interface Transport {
        readonly $type: TSKindId.VisibilityModifier;
        readonly $variant: 'pub';
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly [VisibilityModifierPub.Transport];
    }
}
export declare namespace VisibilityModifier {
    type Transport = VisibilityModifierUFormInPath.Transport | VisibilityModifierUFormCrate.Transport | VisibilityModifierUFormPub.Transport;
}
export declare namespace WhereClause {
    interface Transport {
        readonly $type: TSKindId.WhereClause;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children: readonly (WherePredicate.Transport)[];
    }
}
export declare namespace WherePredicate {
    interface Transport {
        readonly $type: TSKindId.WherePredicate;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly left: Lifetime.Transport | TypeIdentifier.Transport | ScopedTypeIdentifier.Transport | GenericType.Transport | ReferenceType.Transport | PointerType.Transport | TupleType.Transport | ArrayType.Transport | HigherRankedTraitBound.Transport | PrimitiveType.Transport;
        readonly bounds: TraitBounds.Transport;
    }
}
export declare namespace WhileExpression {
    interface Transport {
        readonly $type: TSKindId.WhileExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly label?: Label.Transport;
        readonly condition: Condition.Transport;
        readonly body: Block.Transport;
    }
}
export declare namespace YieldExpression {
    interface Transport {
        readonly $type: TSKindId.YieldExpression;
        readonly $source?: 0 | 1 | 2;
        readonly $named?: boolean;
        readonly $text?: string;
        readonly $span?: {
            readonly start: number;
            readonly end: number;
        };
        readonly $nodeHandle?: number;
        readonly $childIndex?: number;
        readonly $children?: readonly [Expression.Transport];
    }
}
export declare namespace StringContent {
    type Transport = TerminalTransport<TSKindId.StringContent, string>;
}
export declare namespace RawStringLiteralContent {
    type Transport = TerminalTransport<TSKindId.RawStringLiteralContent, string>;
}
export declare namespace FloatLiteral {
    type Transport = TerminalTransport<TSKindId.FloatLiteral, string>;
}
export declare namespace OuterBlockDocCommentMarker {
    type Transport = TerminalTransport<TSKindId.OuterBlockDocCommentMarker, string>;
}
export declare namespace InnerBlockDocCommentMarker {
    type Transport = TerminalTransport<TSKindId.InnerBlockDocCommentMarker, string>;
}
export declare namespace LineDocContent {
    type Transport = TerminalTransport<TSKindId.LineDocContent, string>;
}
export declare namespace ErrorSentinel {
    type Transport = TerminalTransport<TSKindId.ErrorSentinel, string>;
}
export declare namespace Bracket {
    type Transport = TerminalTransport<TSKindId.Lbrack, "[">;
}
export declare namespace CloseBracket {
    type Transport = TerminalTransport<TSKindId.Rbrack, "]">;
}
export declare namespace Semi {
    type Transport = TerminalTransport<TSKindId.Semi, ";">;
}
export declare namespace Arrow {
    type Transport = TerminalTransport<TSKindId.DashGt, "->">;
}
export declare namespace Anonymous {
    type Transport = TerminalTransport<TSKindId.Anonymous, "_">;
}
export declare namespace Brace {
    type Transport = TerminalTransport<TSKindId.Lbrace, "{">;
}
export declare namespace CloseBrace {
    type Transport = TerminalTransport<TSKindId.Rbrace, "}">;
}
export declare namespace Paren {
    type Transport = TerminalTransport<TSKindId.Lparen, "(">;
}
export declare namespace CloseParen {
    type Transport = TerminalTransport<TSKindId.Rparen, ")">;
}
export declare namespace Colon {
    type Transport = TerminalTransport<TSKindId.Colon, ":">;
}
export declare namespace Fn {
    type Transport = TerminalTransport<TSKindId.Fn, "fn">;
}
export declare namespace Bang {
    type Transport = TerminalTransport<TSKindId.Bang, "!">;
}
export declare namespace Async {
    type Transport = TerminalTransport<TSKindId.Async, "async">;
}
export declare namespace In {
    type Transport = TerminalTransport<TSKindId.In, "in">;
}
export declare namespace Move {
    type Transport = TerminalTransport<TSKindId.Move, "move">;
}
export declare namespace Dotdot {
    type Transport = TerminalTransport<TSKindId.DotDot, "..">;
}
export declare namespace Pub {
    type Transport = TerminalTransport<TSKindId.Pub, "pub">;
}
export declare namespace Ref {
    type Transport = TerminalTransport<TSKindId.Ref, "ref">;
}
export declare namespace Static {
    type Transport = TerminalTransport<TSKindId.Static, "static">;
}
export declare namespace Unsafe {
    type Transport = TerminalTransport<TSKindId.Unsafe, "unsafe">;
}
export declare namespace Andand {
    type Transport = TerminalTransport<TSKindId.AmpAmp, "&&">;
}
export declare namespace Comma {
    type Transport = TerminalTransport<TSKindId.Comma, ",">;
}
export declare namespace TokSq {
    type Transport = TerminalTransport<TSKindId.Squote, "'">;
}
export declare namespace As {
    type Transport = TerminalTransport<TSKindId.As, "as">;
}
export declare namespace Await {
    type Transport = TerminalTransport<TSKindId.Await, "await">;
}
export declare namespace Break {
    type Transport = TerminalTransport<TSKindId.Break, "break">;
}
export declare namespace Const {
    type Transport = TerminalTransport<TSKindId.Const, "const">;
}
export declare namespace Continue {
    type Transport = TerminalTransport<TSKindId.Continue, "continue">;
}
export declare namespace Default {
    type Transport = TerminalTransport<TSKindId.Default, "default">;
}
export declare namespace Enum {
    type Transport = TerminalTransport<TSKindId.Enum, "enum">;
}
export declare namespace For {
    type Transport = TerminalTransport<TSKindId.For, "for">;
}
export declare namespace Gen {
    type Transport = TerminalTransport<TSKindId.Gen, "gen">;
}
export declare namespace If {
    type Transport = TerminalTransport<TSKindId.If, "if">;
}
export declare namespace Impl {
    type Transport = TerminalTransport<TSKindId.Impl, "impl">;
}
export declare namespace Let {
    type Transport = TerminalTransport<TSKindId.Let, "let">;
}
export declare namespace Loop {
    type Transport = TerminalTransport<TSKindId.Loop, "loop">;
}
export declare namespace Match {
    type Transport = TerminalTransport<TSKindId.Match, "match">;
}
export declare namespace Mod {
    type Transport = TerminalTransport<TSKindId.Mod, "mod">;
}
export declare namespace Return {
    type Transport = TerminalTransport<TSKindId.Return, "return">;
}
export declare namespace Struct {
    type Transport = TerminalTransport<TSKindId.Struct, "struct">;
}
export declare namespace Trait {
    type Transport = TerminalTransport<TSKindId.Trait, "trait">;
}
export declare namespace Type {
    type Transport = TerminalTransport<TSKindId.Type, "type">;
}
export declare namespace Union {
    type Transport = TerminalTransport<TSKindId.Union, "union">;
}
export declare namespace Use {
    type Transport = TerminalTransport<TSKindId.Use, "use">;
}
export declare namespace Where {
    type Transport = TerminalTransport<TSKindId.Where, "where">;
}
export declare namespace While {
    type Transport = TerminalTransport<TSKindId.While, "while">;
}
export declare namespace Pipe {
    type Transport = TerminalTransport<TSKindId.Pipe, "|">;
}
export declare namespace Slash {
    type Transport = TerminalTransport<TSKindId.Slash, "/">;
}
export declare namespace Raw {
    type Transport = TerminalTransport<TSKindId.Raw, "raw">;
}
export declare namespace Eq {
    type Transport = TerminalTransport<TSKindId.Eq, "=">;
}
export declare namespace Hash {
    type Transport = TerminalTransport<TSKindId.Pound, "#">;
}
export declare namespace Dot {
    type Transport = TerminalTransport<TSKindId.Dot, ".">;
}
export declare namespace TokSlashStar {
    type Transport = TerminalTransport<TSKindId.SlashStar, "/*">;
}
export declare namespace TokStarSlash {
    type Transport = TerminalTransport<TSKindId.StarSlash, "*/">;
}
export declare namespace Plus {
    type Transport = TerminalTransport<TSKindId.Plus, "+">;
}
export declare namespace Lt {
    type Transport = TerminalTransport<TSKindId.Lt, "<">;
}
export declare namespace Gt {
    type Transport = TerminalTransport<TSKindId.Gt, ">">;
}
export declare namespace At {
    type Transport = TerminalTransport<TSKindId.At, "@">;
}
export declare namespace Dyn {
    type Transport = TerminalTransport<TSKindId.Dyn, "dyn">;
}
export declare namespace Else {
    type Transport = TerminalTransport<TSKindId.Else, "else">;
}
export declare namespace Extern {
    type Transport = TerminalTransport<TSKindId.Extern, "extern">;
}
export declare namespace FatArrow {
    type Transport = TerminalTransport<TSKindId.EqGt, "=>">;
}
export declare namespace Mut {
    type Transport = TerminalTransport<number, "mut">;
}
export declare namespace Minus {
    type Transport = TerminalTransport<TSKindId.Dash, "-">;
}
export declare namespace Amp {
    type Transport = TerminalTransport<TSKindId.Amp, "&">;
}
export declare namespace Question {
    type Transport = TerminalTransport<TSKindId.Qmark, "?">;
}
export declare namespace TokDq {
    type Transport = TerminalTransport<TSKindId.Dquote, "\"">;
}
export declare namespace TokDollar {
    type Transport = TerminalTransport<TSKindId.Dollar, "$">;
}
export declare namespace Try {
    type Transport = TerminalTransport<TSKindId.Try, "try">;
}
export declare namespace Star {
    type Transport = TerminalTransport<TSKindId.Star, "*">;
}
export declare namespace Ellipsis {
    type Transport = TerminalTransport<TSKindId.DotDotDot, "...">;
}
export declare namespace Yield {
    type Transport = TerminalTransport<TSKindId.Yield, "yield">;
}
export declare namespace Condition {
    type Transport = UnaryExpression.Transport | ReferenceExpression.Transport | TryExpression.Transport | BinaryExpression.Transport | AssignmentExpression.Transport | CompoundAssignmentExpr.Transport | TypeCastExpression.Transport | CallExpression.Transport | ReturnExpression.Transport | YieldExpression.Transport | StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | Self.Transport | ScopedIdentifier.Transport | GenericFunction.Transport | AwaitExpression.Transport | FieldExpression.Transport | ArrayExpression.Transport | TupleExpression.Transport | MacroInvocation.Transport | UnitExpression.Transport | BreakExpression.Transport | ContinueExpression.Transport | IndexExpression.Transport | Metavariable.Transport | ClosureExpression.Transport | ParenthesizedExpression.Transport | StructExpression.Transport | UnsafeBlock.Transport | AsyncBlock.Transport | GenBlock.Transport | TryBlock.Transport | Block.Transport | IfExpression.Transport | MatchExpression.Transport | WhileExpression.Transport | LoopExpression.Transport | ForExpression.Transport | ConstBlock.Transport | RangeExpression.Transport | LetCondition.Transport | LetChain.Transport;
}
export declare namespace DeclarationStatement {
    type Transport = ConstItem.Transport | MacroInvocation.Transport | MacroDefinition.Transport | EmptyStatement.Transport | AttributeItem.Transport | InnerAttributeItem.Transport | ModItem.Transport | ForeignModItem.Transport | StructItem.Transport | UnionItem.Transport | EnumItem.Transport | TypeItem.Transport | FunctionItem.Transport | FunctionSignatureItem.Transport | ImplItem.Transport | TraitItem.Transport | AssociatedType.Transport | LetDeclaration.Transport | UseDeclaration.Transport | ExternCrateDeclaration.Transport | StaticItem.Transport;
}
export declare namespace DelimTokens {
    type Transport = StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | MutableSpecifier.Transport | Self.Transport | Super.Transport | Crate.Transport | DelimTokenTree.Transport;
}
export declare namespace Expression {
    type Transport = UnaryExpression.Transport | ReferenceExpression.Transport | TryExpression.Transport | BinaryExpression.Transport | AssignmentExpression.Transport | CompoundAssignmentExpr.Transport | TypeCastExpression.Transport | CallExpression.Transport | ReturnExpression.Transport | YieldExpression.Transport | StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | Self.Transport | ScopedIdentifier.Transport | GenericFunction.Transport | AwaitExpression.Transport | FieldExpression.Transport | ArrayExpression.Transport | TupleExpression.Transport | MacroInvocation.Transport | UnitExpression.Transport | BreakExpression.Transport | ContinueExpression.Transport | IndexExpression.Transport | Metavariable.Transport | ClosureExpression.Transport | ParenthesizedExpression.Transport | StructExpression.Transport | UnsafeBlock.Transport | AsyncBlock.Transport | GenBlock.Transport | TryBlock.Transport | Block.Transport | IfExpression.Transport | MatchExpression.Transport | WhileExpression.Transport | LoopExpression.Transport | ForExpression.Transport | ConstBlock.Transport | RangeExpression.Transport;
}
export declare namespace ExpressionEndingWithBlock {
    type Transport = UnsafeBlock.Transport | AsyncBlock.Transport | GenBlock.Transport | TryBlock.Transport | Block.Transport | IfExpression.Transport | MatchExpression.Transport | WhileExpression.Transport | LoopExpression.Transport | ForExpression.Transport | ConstBlock.Transport;
}
export declare namespace ExpressionExceptRange {
    type Transport = UnaryExpression.Transport | ReferenceExpression.Transport | TryExpression.Transport | BinaryExpression.Transport | AssignmentExpression.Transport | CompoundAssignmentExpr.Transport | TypeCastExpression.Transport | CallExpression.Transport | ReturnExpression.Transport | YieldExpression.Transport | StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | Self.Transport | ScopedIdentifier.Transport | GenericFunction.Transport | AwaitExpression.Transport | FieldExpression.Transport | ArrayExpression.Transport | TupleExpression.Transport | MacroInvocation.Transport | UnitExpression.Transport | BreakExpression.Transport | ContinueExpression.Transport | IndexExpression.Transport | Metavariable.Transport | ClosureExpression.Transport | ParenthesizedExpression.Transport | StructExpression.Transport | UnsafeBlock.Transport | AsyncBlock.Transport | GenBlock.Transport | TryBlock.Transport | Block.Transport | IfExpression.Transport | MatchExpression.Transport | WhileExpression.Transport | LoopExpression.Transport | ForExpression.Transport | ConstBlock.Transport;
}
export declare namespace Literal {
    type Transport = StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport;
}
export declare namespace LiteralPattern {
    type Transport = StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | NegativeLiteral.Transport;
}
export declare namespace NonDelimToken {
    type Transport = StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | MutableSpecifier.Transport | Self.Transport | Super.Transport | Crate.Transport;
}
export declare namespace Path {
    type Transport = Self.Transport | Identifier.Transport | Metavariable.Transport | Super.Transport | Crate.Transport | ScopedIdentifier.Transport;
}
export declare namespace Pattern {
    type Transport = StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | NegativeLiteral.Transport | Identifier.Transport | ScopedIdentifier.Transport | GenericPattern.Transport | TuplePattern.Transport | TupleStructPattern.Transport | StructPattern.Transport | RefPattern.Transport | SlicePattern.Transport | CapturedPattern.Transport | ReferencePattern.Transport | RemainingFieldPattern.Transport | MutPattern.Transport | RangePattern.Transport | OrPattern.Transport | ConstBlock.Transport | MacroInvocation.Transport;
}
export declare namespace Statement {
    type Transport = ExpressionStatement.Transport | ConstItem.Transport | MacroInvocation.Transport | MacroDefinition.Transport | EmptyStatement.Transport | AttributeItem.Transport | InnerAttributeItem.Transport | ModItem.Transport | ForeignModItem.Transport | StructItem.Transport | UnionItem.Transport | EnumItem.Transport | TypeItem.Transport | FunctionItem.Transport | FunctionSignatureItem.Transport | ImplItem.Transport | TraitItem.Transport | AssociatedType.Transport | LetDeclaration.Transport | UseDeclaration.Transport | ExternCrateDeclaration.Transport | StaticItem.Transport;
}
export declare namespace TokenPattern {
    type Transport = TokenTreePattern.Transport | TokenRepetitionPattern.Transport | TokenBindingPattern.Transport | Metavariable.Transport | StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | MutableSpecifier.Transport | Self.Transport | Super.Transport | Crate.Transport;
}
export declare namespace Tokens {
    type Transport = TokenTree.Transport | TokenRepetition.Transport | Metavariable.Transport | StringLiteral.Transport | RawStringLiteral.Transport | CharLiteral.Transport | BooleanLiteral.Transport | IntegerLiteral.Transport | FloatLiteral.Transport | Identifier.Transport | MutableSpecifier.Transport | Self.Transport | Super.Transport | Crate.Transport;
}
export declare namespace _Type {
    type Transport = AbstractType.Transport | ReferenceType.Transport | Metavariable.Transport | PointerType.Transport | GenericType.Transport | ScopedTypeIdentifier.Transport | TupleType.Transport | UnitType.Transport | ArrayType.Transport | FunctionType.Transport | Identifier.Transport | MacroInvocation.Transport | NeverType.Transport | DynamicType.Transport | BoundedType.Transport | RemovedTraitBound.Transport | PrimitiveType.Transport;
}
export declare namespace UseClause {
    type Transport = Self.Transport | Identifier.Transport | Metavariable.Transport | Super.Transport | Crate.Transport | ScopedIdentifier.Transport | UseAsClause.Transport | UseList.Transport | ScopedUseList.Transport | UseWildcard.Transport;
}
export type TransportFor<K extends SyntaxKind | keyof KindMap> = K extends "__range_expression_binary_operator" ? RangeExpressionBinaryOperator.Transport : K extends "__visibility_modifier_in_path_in" ? VisibilityModifierInPathIn.Transport : K extends "__visibility_modifier_pub_pub" ? VisibilityModifierPubPub.Transport : K extends "_array_expression_list" ? ArrayExpressionList.Transport : K extends "_array_expression_semi" ? ArrayExpressionSemi.Transport : K extends "_binary_expression_operator" ? BinaryExpressionOperator.Transport : K extends "_closure_expression_async_marker" ? ClosureExpressionAsyncMarker.Transport : K extends "_closure_expression_block" ? ClosureExpressionBlock.Transport : K extends "_closure_expression_expr" ? _ClosureExpressionExpr.Transport : K extends "_closure_expression_static_marker" ? ClosureExpressionStaticMarker.Transport : K extends "_compound_assignment_expr_operator" ? CompoundAssignmentExprOperator.Transport : K extends "_crate" ? _Crate.Transport : K extends "_delim_token_tree_brace" ? _DelimTokenTreeBrace.Transport : K extends "_delim_token_tree_bracket" ? _DelimTokenTreeBracket.Transport : K extends "_delim_token_tree_paren" ? _DelimTokenTreeParen.Transport : K extends "_expression_statement_block_ending" ? _ExpressionStatementBlockEnding.Transport : K extends "_expression_statement_with_semi" ? _ExpressionStatementWithSemi.Transport : K extends "_field_identifier" ? FieldIdentifier.Transport : K extends "_field_pattern_named" ? FieldPatternNamed.Transport : K extends "_field_pattern_shorthand" ? _FieldPatternShorthand.Transport : K extends "_foreign_mod_item_body" ? _ForeignModItemBody.Transport : K extends "_foreign_mod_item_semi" ? ForeignModItemSemi.Transport : K extends "_function_type_fn_form" ? FunctionTypeFnForm.Transport : K extends "_function_type_trait_form" ? FunctionTypeTraitForm.Transport : K extends "_generic_type_with_turbofish_turbofish" ? GenericTypeWithTurbofishTurbofish.Transport : K extends "_impl_item_body" ? _ImplItemBody.Transport : K extends "_impl_item_negative" ? ImplItemNegative.Transport : K extends "_impl_item_semi" ? ImplItemSemi.Transport : K extends "_inner_line_doc_comment_marker" ? InnerLineDocCommentMarker.Transport : K extends "_kw_async_marker" ? KwAsyncMarker.Transport : K extends "_kw_in" ? KwIn.Transport : K extends "_kw_move_marker" ? KwMoveMarker.Transport : K extends "_kw_negative" ? KwNegative.Transport : K extends "_kw_operator" ? KwOperator.Transport : K extends "_kw_pub" ? KwPub.Transport : K extends "_kw_ref_marker" ? KwRefMarker.Transport : K extends "_kw_static_marker" ? KwStaticMarker.Transport : K extends "_kw_turbofish" ? KwTurbofish.Transport : K extends "_kw_unsafe_marker" ? KwUnsafeMarker.Transport : K extends "_let_chain" ? LetChain.Transport : K extends "_line_comment_content" ? LineCommentContent.Transport : K extends "_line_comment_doc" ? LineCommentDoc.Transport : K extends "_line_comment_regular_dslash" ? LineCommentRegularDslash.Transport : K extends "_macro_definition_brace" ? _MacroDefinitionBrace.Transport : K extends "_macro_definition_bracket" ? _MacroDefinitionBracket.Transport : K extends "_macro_definition_paren" ? _MacroDefinitionParen.Transport : K extends "_match_arm_block_ending" ? _MatchArmBlockEnding.Transport : K extends "_match_arm_with_comma" ? MatchArmWithComma.Transport : K extends "_mod_item_external" ? ModItemExternal.Transport : K extends "_mod_item_inline" ? _ModItemInline.Transport : K extends "_move_marker" ? MoveMarker.Transport : K extends "_mutable_specifier" ? _MutableSpecifier.Transport : K extends "_non_special_token" ? NonSpecialToken.Transport : K extends "_operator" ? Operator.Transport : K extends "_or_pattern_binary" ? OrPatternBinary.Transport : K extends "_or_pattern_prefix" ? OrPatternPrefix.Transport : K extends "_outer_line_doc_comment_marker" ? OuterLineDocCommentMarker.Transport : K extends "_pointer_type_const" ? PointerTypeConst.Transport : K extends "_pointer_type_mut" ? _PointerTypeMut.Transport : K extends "_primitive_type" ? PrimitiveType.Transport : K extends "_range_expression_bare" ? _RangeExpressionBare.Transport : K extends "_range_expression_binary" ? RangeExpressionBinary.Transport : K extends "_range_expression_postfix" ? RangeExpressionPostfix.Transport : K extends "_range_expression_prefix" ? RangeExpressionPrefix.Transport : K extends "_range_pattern_left_bare" ? RangePatternLeftBare.Transport : K extends "_range_pattern_left_with_right" ? RangePatternLeftWithRight.Transport : K extends "_range_pattern_prefix" ? RangePatternPrefix.Transport : K extends "_ref_marker" ? RefMarker.Transport : K extends "_reference_expression_raw_const" ? ReferenceExpressionRawConst.Transport : K extends "_reference_expression_raw_mut" ? ReferenceExpressionRawMut.Transport : K extends "_reserved_identifier" ? ReservedIdentifier.Transport : K extends "_self" ? _Self.Transport : K extends "_struct_item_brace" ? StructItemBrace.Transport : K extends "_struct_item_tuple" ? StructItemTuple.Transport : K extends "_struct_item_unit" ? StructItemUnit.Transport : K extends "_token_binding_pattern_type" ? TokenBindingPatternType.Transport : K extends "_token_tree_brace" ? _TokenTreeBrace.Transport : K extends "_token_tree_bracket" ? _TokenTreeBracket.Transport : K extends "_token_tree_paren" ? _TokenTreeParen.Transport : K extends "_token_tree_pattern_brace" ? _TokenTreePatternBrace.Transport : K extends "_token_tree_pattern_bracket" ? _TokenTreePatternBracket.Transport : K extends "_token_tree_pattern_paren" ? _TokenTreePatternParen.Transport : K extends "_type_identifier" ? TypeIdentifier.Transport : K extends "_unary_expression_operator" ? UnaryExpressionOperator.Transport : K extends "_unsafe_marker" ? UnsafeMarker.Transport : K extends "_visibility_modifier_crate" ? _VisibilityModifierCrate.Transport : K extends "_visibility_modifier_in_path" ? VisibilityModifierInPath.Transport : K extends "_visibility_modifier_pub" ? VisibilityModifierPub.Transport : K extends "_wildcard_pattern" ? WildcardPattern.Transport : K extends "abstract_type" ? AbstractType.Transport : K extends "arguments" ? Arguments.Transport : K extends "array_expression" ? ArrayExpression.Transport : K extends "array_type" ? ArrayType.Transport : K extends "assignment_expression" ? AssignmentExpression.Transport : K extends "associated_type" ? AssociatedType.Transport : K extends "async_block" ? AsyncBlock.Transport : K extends "attribute" ? Attribute.Transport : K extends "attribute_item" ? AttributeItem.Transport : K extends "await_expression" ? AwaitExpression.Transport : K extends "base_field_initializer" ? BaseFieldInitializer.Transport : K extends "binary_expression" ? BinaryExpression.Transport : K extends "block" ? Block.Transport : K extends "block_comment" ? BlockComment.Transport : K extends "boolean_literal" ? BooleanLiteral.Transport : K extends "bounded_type" ? BoundedType.Transport : K extends "bracketed_type" ? BracketedType.Transport : K extends "break_expression" ? BreakExpression.Transport : K extends "call_expression" ? CallExpression.Transport : K extends "captured_pattern" ? CapturedPattern.Transport : K extends "char_literal" ? CharLiteral.Transport : K extends "closure_expression_expr" ? ClosureExpressionExpr.Transport : K extends "closure_expression" ? ClosureExpression.Transport : K extends "closure_parameters" ? ClosureParameters.Transport : K extends "comment" ? Comment.Transport : K extends "compound_assignment_expr" ? CompoundAssignmentExpr.Transport : K extends "const_block" ? ConstBlock.Transport : K extends "const_item" ? ConstItem.Transport : K extends "const_parameter" ? ConstParameter.Transport : K extends "continue_expression" ? ContinueExpression.Transport : K extends "crate" ? Crate.Transport : K extends "declaration_list" ? DeclarationList.Transport : K extends "delim_token_tree_paren" ? DelimTokenTreeParen.Transport : K extends "delim_token_tree_bracket" ? DelimTokenTreeBracket.Transport : K extends "delim_token_tree_brace" ? DelimTokenTreeBrace.Transport : K extends "delim_token_tree" ? DelimTokenTree.Transport : K extends "dynamic_type" ? DynamicType.Transport : K extends "else_clause" ? ElseClause.Transport : K extends "empty_statement" ? EmptyStatement.Transport : K extends "enum_item" ? EnumItem.Transport : K extends "enum_variant" ? EnumVariant.Transport : K extends "enum_variant_list" ? EnumVariantList.Transport : K extends "escape_sequence" ? EscapeSequence.Transport : K extends "expression_statement_with_semi" ? ExpressionStatementWithSemi.Transport : K extends "expression_statement_block_ending" ? ExpressionStatementBlockEnding.Transport : K extends "expression_statement" ? ExpressionStatement.Transport : K extends "extern_crate_declaration" ? ExternCrateDeclaration.Transport : K extends "extern_modifier" ? ExternModifier.Transport : K extends "field_declaration" ? FieldDeclaration.Transport : K extends "field_declaration_list" ? FieldDeclarationList.Transport : K extends "field_expression" ? FieldExpression.Transport : K extends "field_initializer" ? FieldInitializer.Transport : K extends "field_initializer_list" ? FieldInitializerList.Transport : K extends "field_pattern_shorthand" ? FieldPatternShorthand.Transport : K extends "field_pattern" ? FieldPattern.Transport : K extends "for_expression" ? ForExpression.Transport : K extends "for_lifetimes" ? ForLifetimes.Transport : K extends "foreign_mod_item_body" ? ForeignModItemBody.Transport : K extends "foreign_mod_item" ? ForeignModItem.Transport : K extends "fragment_specifier" ? FragmentSpecifier.Transport : K extends "function_item" ? FunctionItem.Transport : K extends "function_modifiers" ? FunctionModifiers.Transport : K extends "function_signature_item" ? FunctionSignatureItem.Transport : K extends "function_type" ? FunctionType.Transport : K extends "gen_block" ? GenBlock.Transport : K extends "generic_function" ? GenericFunction.Transport : K extends "generic_pattern" ? GenericPattern.Transport : K extends "generic_type" ? GenericType.Transport : K extends "generic_type_with_turbofish" ? GenericTypeWithTurbofish.Transport : K extends "higher_ranked_trait_bound" ? HigherRankedTraitBound.Transport : K extends "identifier" ? Identifier.Transport : K extends "if_expression" ? IfExpression.Transport : K extends "impl_item_body" ? ImplItemBody.Transport : K extends "impl_item" ? ImplItem.Transport : K extends "index_expression" ? IndexExpression.Transport : K extends "inner_attribute_item" ? InnerAttributeItem.Transport : K extends "integer_literal" ? IntegerLiteral.Transport : K extends "label" ? Label.Transport : K extends "last_match_arm" ? LastMatchArm.Transport : K extends "let_condition" ? LetCondition.Transport : K extends "let_declaration" ? LetDeclaration.Transport : K extends "lifetime" ? Lifetime.Transport : K extends "lifetime_parameter" ? LifetimeParameter.Transport : K extends "line_comment" ? LineComment.Transport : K extends "loop_expression" ? LoopExpression.Transport : K extends "macro_definition_paren" ? MacroDefinitionParen.Transport : K extends "macro_definition_bracket" ? MacroDefinitionBracket.Transport : K extends "macro_definition_brace" ? MacroDefinitionBrace.Transport : K extends "macro_definition" ? MacroDefinition.Transport : K extends "macro_invocation" ? MacroInvocation.Transport : K extends "macro_rule" ? MacroRule.Transport : K extends "match_arm_block_ending" ? MatchArmBlockEnding.Transport : K extends "match_arm" ? MatchArm.Transport : K extends "match_block" ? MatchBlock.Transport : K extends "match_expression" ? MatchExpression.Transport : K extends "match_pattern" ? MatchPattern.Transport : K extends "metavariable" ? Metavariable.Transport : K extends "mod_item_inline" ? ModItemInline.Transport : K extends "mod_item" ? ModItem.Transport : K extends "mut_pattern" ? MutPattern.Transport : K extends "mutable_specifier" ? MutableSpecifier.Transport : K extends "negative_literal" ? NegativeLiteral.Transport : K extends "never_type" ? NeverType.Transport : K extends "or_pattern" ? OrPattern.Transport : K extends "ordered_field_declaration_list" ? OrderedFieldDeclarationList.Transport : K extends "parameter" ? Parameter.Transport : K extends "parameters" ? Parameters.Transport : K extends "parenthesized_expression" ? ParenthesizedExpression.Transport : K extends "pointer_type_mut" ? PointerTypeMut.Transport : K extends "pointer_type" ? PointerType.Transport : K extends "qualified_type" ? QualifiedType.Transport : K extends "range_expression_bare" ? RangeExpressionBare.Transport : K extends "range_expression" ? RangeExpression.Transport : K extends "range_pattern" ? RangePattern.Transport : K extends "raw_string_literal" ? RawStringLiteral.Transport : K extends "ref_pattern" ? RefPattern.Transport : K extends "reference_expression" ? ReferenceExpression.Transport : K extends "reference_pattern" ? ReferencePattern.Transport : K extends "reference_type" ? ReferenceType.Transport : K extends "remaining_field_pattern" ? RemainingFieldPattern.Transport : K extends "removed_trait_bound" ? RemovedTraitBound.Transport : K extends "return_expression" ? ReturnExpression.Transport : K extends "scoped_identifier" ? ScopedIdentifier.Transport : K extends "scoped_type_identifier" ? ScopedTypeIdentifier.Transport : K extends "scoped_type_identifier_in_expression_position" ? ScopedTypeIdentifierInExpressionPosition.Transport : K extends "scoped_use_list" ? ScopedUseList.Transport : K extends "self" ? Self.Transport : K extends "self_parameter" ? SelfParameter.Transport : K extends "shebang" ? Shebang.Transport : K extends "shorthand_field_initializer" ? ShorthandFieldInitializer.Transport : K extends "slice_pattern" ? SlicePattern.Transport : K extends "source_file" ? SourceFile.Transport : K extends "static_item" ? StaticItem.Transport : K extends "string_literal" ? StringLiteral.Transport : K extends "struct_expression" ? StructExpression.Transport : K extends "struct_item" ? StructItem.Transport : K extends "struct_pattern" ? StructPattern.Transport : K extends "super" ? Super.Transport : K extends "token_binding_pattern" ? TokenBindingPattern.Transport : K extends "token_repetition" ? TokenRepetition.Transport : K extends "token_repetition_pattern" ? TokenRepetitionPattern.Transport : K extends "token_tree_paren" ? TokenTreeParen.Transport : K extends "token_tree_bracket" ? TokenTreeBracket.Transport : K extends "token_tree_brace" ? TokenTreeBrace.Transport : K extends "token_tree" ? TokenTree.Transport : K extends "token_tree_pattern_paren" ? TokenTreePatternParen.Transport : K extends "token_tree_pattern_bracket" ? TokenTreePatternBracket.Transport : K extends "token_tree_pattern_brace" ? TokenTreePatternBrace.Transport : K extends "token_tree_pattern" ? TokenTreePattern.Transport : K extends "trait_bounds" ? TraitBounds.Transport : K extends "trait_item" ? TraitItem.Transport : K extends "try_block" ? TryBlock.Transport : K extends "try_expression" ? TryExpression.Transport : K extends "tuple_expression" ? TupleExpression.Transport : K extends "tuple_pattern" ? TuplePattern.Transport : K extends "tuple_struct_pattern" ? TupleStructPattern.Transport : K extends "tuple_type" ? TupleType.Transport : K extends "type_arguments" ? TypeArguments.Transport : K extends "type_binding" ? TypeBinding.Transport : K extends "type_cast_expression" ? TypeCastExpression.Transport : K extends "type_item" ? TypeItem.Transport : K extends "type_parameter" ? TypeParameter.Transport : K extends "type_parameters" ? TypeParameters.Transport : K extends "unary_expression" ? UnaryExpression.Transport : K extends "union_item" ? UnionItem.Transport : K extends "unit_expression" ? UnitExpression.Transport : K extends "unit_type" ? UnitType.Transport : K extends "unsafe_block" ? UnsafeBlock.Transport : K extends "use_as_clause" ? UseAsClause.Transport : K extends "use_bounds" ? UseBounds.Transport : K extends "use_declaration" ? UseDeclaration.Transport : K extends "use_list" ? UseList.Transport : K extends "use_wildcard" ? UseWildcard.Transport : K extends "variadic_parameter" ? VariadicParameter.Transport : K extends "visibility_modifier_crate" ? VisibilityModifierCrate.Transport : K extends "visibility_modifier" ? VisibilityModifier.Transport : K extends "where_clause" ? WhereClause.Transport : K extends "where_predicate" ? WherePredicate.Transport : K extends "while_expression" ? WhileExpression.Transport : K extends "yield_expression" ? YieldExpression.Transport : K extends "string_content" ? StringContent.Transport : K extends "raw_string_literal_content" ? RawStringLiteralContent.Transport : K extends "float_literal" ? FloatLiteral.Transport : K extends "_outer_block_doc_comment_marker" ? OuterBlockDocCommentMarker.Transport : K extends "_inner_block_doc_comment_marker" ? InnerBlockDocCommentMarker.Transport : K extends "_line_doc_content" ? LineDocContent.Transport : K extends "_error_sentinel" ? ErrorSentinel.Transport : K extends "[" ? Bracket.Transport : K extends "]" ? CloseBracket.Transport : K extends ";" ? Semi.Transport : K extends "->" ? Arrow.Transport : K extends "_" ? Anonymous.Transport : K extends "{" ? Brace.Transport : K extends "}" ? CloseBrace.Transport : K extends "(" ? Paren.Transport : K extends ")" ? CloseParen.Transport : K extends ":" ? Colon.Transport : K extends "fn" ? Fn.Transport : K extends "!" ? Bang.Transport : K extends "async" ? Async.Transport : K extends "in" ? In.Transport : K extends "move" ? Move.Transport : K extends ".." ? Dotdot.Transport : K extends "pub" ? Pub.Transport : K extends "ref" ? Ref.Transport : K extends "static" ? Static.Transport : K extends "unsafe" ? Unsafe.Transport : K extends "&&" ? Andand.Transport : K extends "," ? Comma.Transport : K extends "'" ? TokSq.Transport : K extends "as" ? As.Transport : K extends "await" ? Await.Transport : K extends "break" ? Break.Transport : K extends "const" ? Const.Transport : K extends "continue" ? Continue.Transport : K extends "default" ? Default.Transport : K extends "enum" ? Enum.Transport : K extends "for" ? For.Transport : K extends "gen" ? Gen.Transport : K extends "if" ? If.Transport : K extends "impl" ? Impl.Transport : K extends "let" ? Let.Transport : K extends "loop" ? Loop.Transport : K extends "match" ? Match.Transport : K extends "mod" ? Mod.Transport : K extends "return" ? Return.Transport : K extends "struct" ? Struct.Transport : K extends "trait" ? Trait.Transport : K extends "type" ? Type.Transport : K extends "union" ? Union.Transport : K extends "use" ? Use.Transport : K extends "where" ? Where.Transport : K extends "while" ? While.Transport : K extends "|" ? Pipe.Transport : K extends "/" ? Slash.Transport : K extends "raw" ? Raw.Transport : K extends "=" ? Eq.Transport : K extends "#" ? Hash.Transport : K extends "." ? Dot.Transport : K extends "/*" ? TokSlashStar.Transport : K extends "*/" ? TokStarSlash.Transport : K extends "+" ? Plus.Transport : K extends "<" ? Lt.Transport : K extends ">" ? Gt.Transport : K extends "@" ? At.Transport : K extends "dyn" ? Dyn.Transport : K extends "else" ? Else.Transport : K extends "extern" ? Extern.Transport : K extends "=>" ? FatArrow.Transport : K extends "mut" ? Mut.Transport : K extends "-" ? Minus.Transport : K extends "&" ? Amp.Transport : K extends "?" ? Question.Transport : K extends "\"" ? TokDq.Transport : K extends "$" ? TokDollar.Transport : K extends "try" ? Try.Transport : K extends "*" ? Star.Transport : K extends "..." ? Ellipsis.Transport : K extends "yield" ? Yield.Transport : never;
export type AnyTransport = RangeExpressionBinaryOperator.Transport | VisibilityModifierInPathIn.Transport | VisibilityModifierPubPub.Transport | ArrayExpressionList.Transport | ArrayExpressionSemi.Transport | BinaryExpressionOperator.Transport | ClosureExpressionAsyncMarker.Transport | ClosureExpressionBlock.Transport | _ClosureExpressionExpr.Transport | ClosureExpressionStaticMarker.Transport | CompoundAssignmentExprOperator.Transport | _Crate.Transport | _DelimTokenTreeBrace.Transport | _DelimTokenTreeBracket.Transport | _DelimTokenTreeParen.Transport | _ExpressionStatementBlockEnding.Transport | _ExpressionStatementWithSemi.Transport | FieldIdentifier.Transport | FieldPatternNamed.Transport | _FieldPatternShorthand.Transport | _ForeignModItemBody.Transport | ForeignModItemSemi.Transport | FunctionTypeFnForm.Transport | FunctionTypeTraitForm.Transport | GenericTypeWithTurbofishTurbofish.Transport | _ImplItemBody.Transport | ImplItemNegative.Transport | ImplItemSemi.Transport | InnerLineDocCommentMarker.Transport | KwAsyncMarker.Transport | KwIn.Transport | KwMoveMarker.Transport | KwNegative.Transport | KwOperator.Transport | KwPub.Transport | KwRefMarker.Transport | KwStaticMarker.Transport | KwTurbofish.Transport | KwUnsafeMarker.Transport | LetChain.Transport | LineCommentContent.Transport | LineCommentDoc.Transport | LineCommentRegularDslash.Transport | _MacroDefinitionBrace.Transport | _MacroDefinitionBracket.Transport | _MacroDefinitionParen.Transport | _MatchArmBlockEnding.Transport | MatchArmWithComma.Transport | ModItemExternal.Transport | _ModItemInline.Transport | MoveMarker.Transport | _MutableSpecifier.Transport | NonSpecialToken.Transport | Operator.Transport | OrPatternBinary.Transport | OrPatternPrefix.Transport | OuterLineDocCommentMarker.Transport | PointerTypeConst.Transport | _PointerTypeMut.Transport | PrimitiveType.Transport | _RangeExpressionBare.Transport | RangeExpressionBinary.Transport | RangeExpressionPostfix.Transport | RangeExpressionPrefix.Transport | RangePatternLeftBare.Transport | RangePatternLeftWithRight.Transport | RangePatternPrefix.Transport | RefMarker.Transport | ReferenceExpressionRawConst.Transport | ReferenceExpressionRawMut.Transport | ReservedIdentifier.Transport | _Self.Transport | StructItemBrace.Transport | StructItemTuple.Transport | StructItemUnit.Transport | TokenBindingPatternType.Transport | _TokenTreeBrace.Transport | _TokenTreeBracket.Transport | _TokenTreeParen.Transport | _TokenTreePatternBrace.Transport | _TokenTreePatternBracket.Transport | _TokenTreePatternParen.Transport | TypeIdentifier.Transport | UnaryExpressionOperator.Transport | UnsafeMarker.Transport | _VisibilityModifierCrate.Transport | VisibilityModifierInPath.Transport | VisibilityModifierPub.Transport | WildcardPattern.Transport | AbstractType.Transport | Arguments.Transport | ArrayExpression.Transport | ArrayType.Transport | AssignmentExpression.Transport | AssociatedType.Transport | AsyncBlock.Transport | Attribute.Transport | AttributeItem.Transport | AwaitExpression.Transport | BaseFieldInitializer.Transport | BinaryExpression.Transport | Block.Transport | BlockComment.Transport | BooleanLiteral.Transport | BoundedType.Transport | BracketedType.Transport | BreakExpression.Transport | CallExpression.Transport | CapturedPattern.Transport | CharLiteral.Transport | ClosureExpressionExpr.Transport | ClosureExpression.Transport | ClosureParameters.Transport | Comment.Transport | CompoundAssignmentExpr.Transport | ConstBlock.Transport | ConstItem.Transport | ConstParameter.Transport | ContinueExpression.Transport | Crate.Transport | DeclarationList.Transport | DelimTokenTreeParen.Transport | DelimTokenTreeBracket.Transport | DelimTokenTreeBrace.Transport | DelimTokenTree.Transport | DynamicType.Transport | ElseClause.Transport | EmptyStatement.Transport | EnumItem.Transport | EnumVariant.Transport | EnumVariantList.Transport | EscapeSequence.Transport | ExpressionStatementWithSemi.Transport | ExpressionStatementBlockEnding.Transport | ExpressionStatement.Transport | ExternCrateDeclaration.Transport | ExternModifier.Transport | FieldDeclaration.Transport | FieldDeclarationList.Transport | FieldExpression.Transport | FieldInitializer.Transport | FieldInitializerList.Transport | FieldPatternShorthand.Transport | FieldPattern.Transport | ForExpression.Transport | ForLifetimes.Transport | ForeignModItemBody.Transport | ForeignModItem.Transport | FragmentSpecifier.Transport | FunctionItem.Transport | FunctionModifiers.Transport | FunctionSignatureItem.Transport | FunctionType.Transport | GenBlock.Transport | GenericFunction.Transport | GenericPattern.Transport | GenericType.Transport | GenericTypeWithTurbofish.Transport | HigherRankedTraitBound.Transport | Identifier.Transport | IfExpression.Transport | ImplItemBody.Transport | ImplItem.Transport | IndexExpression.Transport | InnerAttributeItem.Transport | IntegerLiteral.Transport | Label.Transport | LastMatchArm.Transport | LetCondition.Transport | LetDeclaration.Transport | Lifetime.Transport | LifetimeParameter.Transport | LineComment.Transport | LoopExpression.Transport | MacroDefinitionParen.Transport | MacroDefinitionBracket.Transport | MacroDefinitionBrace.Transport | MacroDefinition.Transport | MacroInvocation.Transport | MacroRule.Transport | MatchArmBlockEnding.Transport | MatchArm.Transport | MatchBlock.Transport | MatchExpression.Transport | MatchPattern.Transport | Metavariable.Transport | ModItemInline.Transport | ModItem.Transport | MutPattern.Transport | MutableSpecifier.Transport | NegativeLiteral.Transport | NeverType.Transport | OrPattern.Transport | OrderedFieldDeclarationList.Transport | Parameter.Transport | Parameters.Transport | ParenthesizedExpression.Transport | PointerTypeMut.Transport | PointerType.Transport | QualifiedType.Transport | RangeExpressionBare.Transport | RangeExpression.Transport | RangePattern.Transport | RawStringLiteral.Transport | RefPattern.Transport | ReferenceExpression.Transport | ReferencePattern.Transport | ReferenceType.Transport | RemainingFieldPattern.Transport | RemovedTraitBound.Transport | ReturnExpression.Transport | ScopedIdentifier.Transport | ScopedTypeIdentifier.Transport | ScopedTypeIdentifierInExpressionPosition.Transport | ScopedUseList.Transport | Self.Transport | SelfParameter.Transport | Shebang.Transport | ShorthandFieldInitializer.Transport | SlicePattern.Transport | SourceFile.Transport | StaticItem.Transport | StringLiteral.Transport | StructExpression.Transport | StructItem.Transport | StructPattern.Transport | Super.Transport | TokenBindingPattern.Transport | TokenRepetition.Transport | TokenRepetitionPattern.Transport | TokenTreeParen.Transport | TokenTreeBracket.Transport | TokenTreeBrace.Transport | TokenTree.Transport | TokenTreePatternParen.Transport | TokenTreePatternBracket.Transport | TokenTreePatternBrace.Transport | TokenTreePattern.Transport | TraitBounds.Transport | TraitItem.Transport | TryBlock.Transport | TryExpression.Transport | TupleExpression.Transport | TuplePattern.Transport | TupleStructPattern.Transport | TupleType.Transport | TypeArguments.Transport | TypeBinding.Transport | TypeCastExpression.Transport | TypeItem.Transport | TypeParameter.Transport | TypeParameters.Transport | UnaryExpression.Transport | UnionItem.Transport | UnitExpression.Transport | UnitType.Transport | UnsafeBlock.Transport | UseAsClause.Transport | UseBounds.Transport | UseDeclaration.Transport | UseList.Transport | UseWildcard.Transport | VariadicParameter.Transport | VisibilityModifierCrate.Transport | VisibilityModifier.Transport | WhereClause.Transport | WherePredicate.Transport | WhileExpression.Transport | YieldExpression.Transport | StringContent.Transport | RawStringLiteralContent.Transport | FloatLiteral.Transport | OuterBlockDocCommentMarker.Transport | InnerBlockDocCommentMarker.Transport | LineDocContent.Transport | ErrorSentinel.Transport | Bracket.Transport | CloseBracket.Transport | Semi.Transport | Arrow.Transport | Anonymous.Transport | Brace.Transport | CloseBrace.Transport | Paren.Transport | CloseParen.Transport | Colon.Transport | Fn.Transport | Bang.Transport | Async.Transport | In.Transport | Move.Transport | Dotdot.Transport | Pub.Transport | Ref.Transport | Static.Transport | Unsafe.Transport | Andand.Transport | Comma.Transport | TokSq.Transport | As.Transport | Await.Transport | Break.Transport | Const.Transport | Continue.Transport | Default.Transport | Enum.Transport | For.Transport | Gen.Transport | If.Transport | Impl.Transport | Let.Transport | Loop.Transport | Match.Transport | Mod.Transport | Return.Transport | Struct.Transport | Trait.Transport | Type.Transport | Union.Transport | Use.Transport | Where.Transport | While.Transport | Pipe.Transport | Slash.Transport | Raw.Transport | Eq.Transport | Hash.Transport | Dot.Transport | TokSlashStar.Transport | TokStarSlash.Transport | Plus.Transport | Lt.Transport | Gt.Transport | At.Transport | Dyn.Transport | Else.Transport | Extern.Transport | FatArrow.Transport | Mut.Transport | Minus.Transport | Amp.Transport | Question.Transport | TokDq.Transport | TokDollar.Transport | Try.Transport | Star.Transport | Ellipsis.Transport | Yield.Transport | LiteralTransport<TSKindId.Percent, "%"> | LiteralTransport<TSKindId.Caret, "^"> | LiteralTransport<TSKindId.PipePipe, "||"> | LiteralTransport<TSKindId.LtLt, "<<"> | LiteralTransport<TSKindId.GtGt, ">>"> | LiteralTransport<TSKindId.PlusEq, "+="> | LiteralTransport<TSKindId.DashEq, "-="> | LiteralTransport<TSKindId.StarEq, "*="> | LiteralTransport<TSKindId.SlashEq, "/="> | LiteralTransport<TSKindId.PercentEq, "%="> | LiteralTransport<TSKindId.CaretEq, "^="> | LiteralTransport<TSKindId.AmpEq, "&="> | LiteralTransport<TSKindId.PipeEq, "|="> | LiteralTransport<TSKindId.LtLtEq, "<<="> | LiteralTransport<TSKindId.GtGtEq, ">>="> | LiteralTransport<TSKindId.EqEq, "=="> | LiteralTransport<TSKindId.BangEq, "!="> | LiteralTransport<TSKindId.GtEq, ">="> | LiteralTransport<TSKindId.LtEq, "<="> | LiteralTransport<TSKindId.DotDotEq, "..="> | LiteralTransport<TSKindId.ColonColon, "::">;
//# sourceMappingURL=types.d.ts.map
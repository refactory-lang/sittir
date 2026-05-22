import type { RustGrammar } from './grammar.js';
import type { NodeData as BaseNodeData, NodeConfig as BaseNodeConfig, TreeNode as BaseTreeNode, NodeKind, NodeNs, AnyTreeNodeOf as AnyTreeNode, Terminal, NonEmptyArray, AutoStamp, BooleanKeyword, KindEnum } from '@sittir/types';
export type { RustGrammar };
export type NodeData<K extends NodeKind<RustGrammar>> = BaseNodeData<RustGrammar, K>;
export type NodeConfig<K extends NodeKind<RustGrammar>> = BaseNodeConfig<RustGrammar, K>;
export type TreeNode<K extends NodeKind<RustGrammar>> = BaseTreeNode<RustGrammar, K>;
export type LeafScalarMap = {};
export type LeafStringMap = {
    __range_expression_binary_operator: ".." | "..." | "..=";
    _closure_expression_async_marker: "async";
    _closure_expression_static_marker: "static";
    _compound_assignment_expr_operator: "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=";
    _kw_async_marker: "async";
    _kw_in: "in";
    _kw_move_marker: "move";
    _kw_pub: "pub";
    _kw_ref_marker: "ref";
    _kw_static_marker: "static";
    _kw_unsafe_marker: "unsafe";
    _move_marker: "move";
    _mutable_specifier: "mut";
    _pointer_type_const: "const";
    _primitive_type: "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "u128" | "i128" | "isize" | "usize" | "f32" | "f64" | "bool" | "str" | "char";
    _ref_marker: "ref";
    _reserved_identifier: "default" | "union" | "gen";
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
    async: "async";
    static: "static";
    fn: "fn";
    in: "in";
    move: "move";
    pub: "pub";
    ref: "ref";
    unsafe: "unsafe";
    mut: "mut";
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
    try: "try";
    yield: "yield";
};
export declare const enum SyntaxKind {
    ArrayExpressionList = "_array_expression_list",
    ArrayExpressionSemi = "_array_expression_semi",
    AttributedEnumVariant = "_attributed_enum_variant",
    AttributedFieldDeclaration = "_attributed_field_declaration",
    AttributedParameter = "_attributed_parameter",
    AttributedTypeParameter = "_attributed_type_parameter",
    ClosureExpressionBlock = "_closure_expression_block",
    _ClosureExpressionExpr = "_closure_expression_expr",
    _DelimTokenTreeBrace = "_delim_token_tree_brace",
    _DelimTokenTreeBracket = "_delim_token_tree_bracket",
    _DelimTokenTreeParen = "_delim_token_tree_paren",
    _ExpressionStatementBlockEnding = "_expression_statement_block_ending",
    _ExpressionStatementWithSemi = "_expression_statement_with_semi",
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
    StructItemBrace = "_struct_item_brace",
    StructItemTuple = "_struct_item_tuple",
    _TokenTreeBrace = "_token_tree_brace",
    _TokenTreeBracket = "_token_tree_bracket",
    _TokenTreeParen = "_token_tree_paren",
    _TokenTreePatternBrace = "_token_tree_pattern_brace",
    _TokenTreePatternBracket = "_token_tree_pattern_bracket",
    _TokenTreePatternParen = "_token_tree_pattern_paren",
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
    VisibilityModifierPubParens = "_visibility_modifier_pub_parens",
    RangeExpressionBinaryOperator = "__range_expression_binary_operator",
    ClosureExpressionAsyncMarker = "_closure_expression_async_marker",
    ClosureExpressionStaticMarker = "_closure_expression_static_marker",
    CompoundAssignmentExprOperator = "_compound_assignment_expr_operator",
    FieldIdentifier = "_field_identifier",
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
    PointerTypeConst = "_pointer_type_const",
    PrimitiveType = "_primitive_type",
    RefMarker = "_ref_marker",
    ReferenceExpressionRawConst = "_reference_expression_raw_const",
    ReservedIdentifier = "_reserved_identifier",
    TokenBindingPatternType = "_token_binding_pattern_type",
    TypeIdentifier = "_type_identifier",
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
    LineDocContent = "_line_doc_content",
    ErrorSentinel = "_error_sentinel",
    Anonymous = "_",
    Async = "async",
    Static = "static",
    Fn = "fn",
    In = "in",
    Move = "move",
    Pub = "pub",
    Ref = "ref",
    Unsafe = "unsafe",
    Mut = "mut",
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
    AnonBlock = 13,
    Expr = 14,
    Expr2021 = 15,
    Ident = 16,
    Item = 17,
    AnonLifetime = 18,
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
    Amp2 = 50,
    Pipe2 = 51,
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
    RawStringLiteralStart = 148,
    RawStringLiteralContent = 149,
    RawStringLiteralEnd = 150,
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
    PointerTypeConst = 351,
    _PointerTypeMut = 352,
    ReferenceExpressionRawConst = 353,
    ReferenceExpressionRawMut = 354,
    _ExpressionStatementWithSemi = 355,
    _ExpressionStatementBlockEnding = 356,
    ForeignModItemSemi = 357,
    _ForeignModItemBody = 358,
    MatchArmWithComma = 359,
    _MatchArmBlockEnding = 360,
    LineCommentRegularDslash = 361,
    LineCommentDoc = 362,
    _TokenTreePatternParen = 363,
    _TokenTreePatternBracket = 364,
    _TokenTreePatternBrace = 365,
    _TokenTreeParen = 366,
    _TokenTreeBracket = 367,
    _TokenTreeBrace = 368,
    _DelimTokenTreeParen = 369,
    _DelimTokenTreeBracket = 370,
    _DelimTokenTreeBrace = 371,
    SourceFileRepeat1 = 372,
    TokenRepetitionPatternRepeat1 = 373,
    TokenRepetitionRepeat1 = 374,
    _NonSpecialTokenRepeat1 = 375,
    DeclarationListRepeat1 = 376,
    EnumVariantListRepeat1 = 377,
    EnumVariantListRepeat2 = 378,
    FieldDeclarationListRepeat1 = 379,
    OrderedFieldDeclarationListRepeat1 = 380,
    FunctionModifiersRepeat1 = 381,
    WhereClauseRepeat1 = 382,
    TraitBoundsRepeat1 = 383,
    TypeParametersRepeat1 = 384,
    UseListRepeat1 = 385,
    ParametersRepeat1 = 386,
    ForLifetimesRepeat1 = 387,
    TupleTypeRepeat1 = 388,
    UseBoundsRepeat1 = 389,
    TypeArgumentsRepeat1 = 390,
    ArgumentsRepeat1 = 391,
    TupleExpressionRepeat1 = 392,
    FieldInitializerListRepeat1 = 393,
    MatchBlockRepeat1 = 394,
    MatchArmRepeat1 = 395,
    ClosureParametersRepeat1 = 396,
    TuplePatternRepeat1 = 397,
    SlicePatternRepeat1 = 398,
    StructPatternRepeat1 = 399,
    StringLiteralRepeat1 = 400,
    _ArrayExpressionListRepeat1 = 401,
    _MacroDefinitionParenRepeat1 = 402,
    _DelimTokenTreeParenRepeat1 = 403,
    FieldIdentifier = 404,
    _ShorthandFieldIdentifier = 406,
    TypeIdentifier = 407
}
export declare const KIND_NAMES: ReadonlyMap<number, string>;
export declare function kindIdFromName(kindName: string): TSKindId;
export declare const enum ConditionKind {
    Expression = "_expression",
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
    NonDelimToken = "_non_delim_token",
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
    TokSq = "'",
    TokDollar = "$",
    DelimTokenTree = "delim_token_tree"
}
export declare const enum ExpressionKind {
    ExpressionExceptRange = "_expression_except_range",
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
    Literal = "_literal",
    StringLiteral = "string_literal",
    RawStringLiteral = "raw_string_literal",
    CharLiteral = "char_literal",
    BooleanLiteral = "boolean_literal",
    IntegerLiteral = "integer_literal",
    FloatLiteral = "float_literal",
    Identifier = "identifier",
    ReservedIdentifier = "_reserved_identifier",
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
    ExpressionEndingWithBlock = "_expression_ending_with_block",
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
    Crate = "crate",
    TokSq = "'",
    TokDollar = "$"
}
export declare const enum PathKind {
    Self = "self",
    Identifier = "identifier",
    Metavariable = "metavariable",
    Super = "super",
    Crate = "crate",
    ScopedIdentifier = "scoped_identifier",
    ReservedIdentifier = "_reserved_identifier"
}
export declare const enum PatternKind {
    LiteralPattern = "_literal_pattern",
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
    ReservedIdentifier = "_reserved_identifier",
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
    DeclarationStatement = "_declaration_statement",
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
    Crate = "crate",
    TokSq = "'"
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
    Crate = "crate",
    TokSq = "'"
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
    TypeIdentifier = "_type_identifier",
    MacroInvocation = "macro_invocation",
    NeverType = "never_type",
    DynamicType = "dynamic_type",
    BoundedType = "bounded_type",
    RemovedTraitBound = "removed_trait_bound",
    PrimitiveType = "_primitive_type"
}
export declare const enum UseClauseKind {
    Path = "_path",
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
    readonly _attributes?: readonly (AttributeItem)[];
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _elements?: readonly (Expression)[];
    attributes(): readonly (AttributeItem)[];
    attributeItems(): readonly (AttributeItem)[];
    elements(): readonly (Expression)[];
}
export interface ArrayExpressionSemi {
    readonly $type: TSKindId.ArrayExpressionSemi;
    readonly _attributes?: readonly (AttributeItem)[];
    readonly _elements: Expression;
    readonly _length: Expression;
    attributes(): readonly (AttributeItem)[];
    elements(): Expression;
    length(): Expression;
}
export interface AttributedEnumVariant {
    readonly $type: "_attributed_enum_variant";
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _enum_variant: EnumVariant;
    attributeItems(): readonly (AttributeItem)[];
    enumVariant(): EnumVariant;
}
export interface AttributedFieldDeclaration {
    readonly $type: "_attributed_field_declaration";
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _field_declaration: FieldDeclaration;
    attributeItems(): readonly (AttributeItem)[];
    fieldDeclaration(): FieldDeclaration;
}
export interface AttributedParameter {
    readonly $type: "_attributed_parameter";
    readonly _attribute_item?: AttributeItem;
    readonly _parameter: Parameter | SelfParameter | VariadicParameter | "_" | _Type;
    attributeItem(): AttributeItem | undefined;
    parameter(): Parameter | SelfParameter | VariadicParameter | "_" | _Type;
}
export interface AttributedTypeParameter {
    readonly $type: "_attributed_type_parameter";
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _metavariable: Metavariable | TypeParameter | LifetimeParameter | ConstParameter;
    attributeItems(): readonly (AttributeItem)[];
    metavariable(): Metavariable | TypeParameter | LifetimeParameter | ConstParameter;
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
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface _DelimTokenTreeBracket {
    readonly $type: TSKindId._DelimTokenTreeBracket;
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface _DelimTokenTreeParen {
    readonly $type: TSKindId._DelimTokenTreeParen;
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface _ExpressionStatementBlockEnding {
    readonly $type: TSKindId._ExpressionStatementBlockEnding;
    readonly _expression_ending_with_block: ExpressionEndingWithBlock;
    expressionEndingWithBlock(): ExpressionEndingWithBlock;
}
export interface _ExpressionStatementWithSemi {
    readonly $type: TSKindId._ExpressionStatementWithSemi;
    readonly _expression: Expression;
    expression(): Expression;
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
    readonly _function_modifiers?: FunctionModifiers;
    functionModifiers(): FunctionModifiers | undefined;
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
    readonly _let_chain: LetChain | LetCondition | Expression;
    letChain(): LetChain | LetCondition | Expression;
}
export interface LineCommentDoc {
    readonly $type: TSKindId.LineCommentDoc;
    readonly _outer?: boolean;
    readonly _inner?: boolean;
    readonly _doc: LineDocContent;
    readonly __inputHints__?: {
        readonly outer?: BooleanKeyword<"/">;
        readonly inner?: BooleanKeyword<"!">;
    };
    outer(): boolean | undefined;
    inner(): boolean | undefined;
    doc(): LineDocContent;
}
export interface _MacroDefinitionBrace {
    readonly $type: TSKindId._MacroDefinitionBrace;
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
}
export interface _MacroDefinitionBracket {
    readonly $type: TSKindId._MacroDefinitionBracket;
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
}
export interface _MacroDefinitionParen {
    readonly $type: TSKindId._MacroDefinitionParen;
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
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
    readonly _literal: NonEmptyArray<Literal | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType | "+" | "-" | "*" | "/" | "%" | "^" | "!" | "&" | "|" | "&&" | "||" | "<<" | ">>" | "+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | "<<=" | ">>=" | "=" | "==" | "!=" | ">" | "<" | ">=" | "<=" | "@" | "_" | "." | ".." | "..." | "..=" | "," | ";" | ":" | "::" | "->" | "=>" | "#" | "?" | "'" | "as" | "async" | "await" | "break" | "const" | "continue" | "default" | "enum" | "fn" | "for" | "gen" | "if" | "impl" | "let" | "loop" | "match" | "mod" | "pub" | "return" | "static" | "struct" | "trait" | "type" | "union" | "unsafe" | "use" | "where" | "while">;
    literals(): NonEmptyArray<Literal | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType | "+" | "-" | "*" | "/" | "%" | "^" | "!" | "&" | "|" | "&&" | "||" | "<<" | ">>" | "+=" | "-=" | "*=" | "/=" | "%=" | "^=" | "&=" | "|=" | "<<=" | ">>=" | "=" | "==" | "!=" | ">" | "<" | ">=" | "<=" | "@" | "_" | "." | ".." | "..." | "..=" | "," | ";" | ":" | "::" | "->" | "=>" | "#" | "?" | "'" | "as" | "async" | "await" | "break" | "const" | "continue" | "default" | "enum" | "fn" | "for" | "gen" | "if" | "impl" | "let" | "loop" | "match" | "mod" | "pub" | "return" | "static" | "struct" | "trait" | "type" | "union" | "unsafe" | "use" | "where" | "while">;
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
    readonly _mutable_specifier: MutableSpecifier;
    mutableSpecifier(): MutableSpecifier;
}
export interface _RangeExpressionBare {
    readonly $type: TSKindId._RangeExpressionBare;
    readonly _operator: number;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"..", TSKindId.DotDot>;
    };
    operator(): number;
}
export interface RangeExpressionBinary {
    readonly $type: TSKindId.RangeExpressionBinary;
    readonly _start: Expression;
    readonly _operator: number;
    readonly _end: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<".." | "..." | "..=", TSKindId.DotDot | TSKindId.DotDotDot | TSKindId.DotDotEq>;
    };
    start(): Expression;
    operator(): number;
    end(): Expression;
}
export interface RangeExpressionPostfix {
    readonly $type: TSKindId.RangeExpressionPostfix;
    readonly _start: Expression;
    readonly _operator: number;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"..", TSKindId.DotDot>;
    };
    start(): Expression;
    operator(): number;
}
export interface RangeExpressionPrefix {
    readonly $type: TSKindId.RangeExpressionPrefix;
    readonly _operator: number;
    readonly _end: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"..", TSKindId.DotDot>;
    };
    operator(): number;
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
    readonly _mutable_specifier: MutableSpecifier;
    mutableSpecifier(): MutableSpecifier;
}
export interface StructItemBrace {
    readonly $type: TSKindId.StructItemBrace;
    readonly _where_clause?: WhereClause;
    readonly _body: FieldDeclarationList;
    whereClause(): WhereClause | undefined;
    body(): FieldDeclarationList;
}
export interface StructItemTuple {
    readonly $type: TSKindId.StructItemTuple;
    readonly _body: OrderedFieldDeclarationList;
    readonly _where_clause?: WhereClause;
    body(): OrderedFieldDeclarationList;
    whereClause(): WhereClause | undefined;
}
export interface _TokenTreeBrace {
    readonly $type: TSKindId._TokenTreeBrace;
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface _TokenTreeBracket {
    readonly $type: TSKindId._TokenTreeBracket;
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface _TokenTreeParen {
    readonly $type: TSKindId._TokenTreeParen;
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface _TokenTreePatternBrace {
    readonly $type: TSKindId._TokenTreePatternBrace;
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface _TokenTreePatternBracket {
    readonly $type: TSKindId._TokenTreePatternBracket;
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface _TokenTreePatternParen {
    readonly $type: TSKindId._TokenTreePatternParen;
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface _VisibilityModifierCrate {
    readonly $type: TSKindId._VisibilityModifierCrate;
    readonly _crate: number;
    readonly __inputHints__?: {
        readonly crate: KindEnum<"crate", TSKindId.Crate>;
    };
    crate(): number;
}
export interface VisibilityModifierInPath {
    readonly $type: TSKindId.VisibilityModifierInPath;
    readonly _in: number;
    readonly _path: Path;
    readonly __inputHints__?: {
        readonly in: KindEnum<"in", TSKindId.In>;
    };
    in(): number;
    path(): Path;
}
export interface VisibilityModifierPub {
    readonly $type: TSKindId.VisibilityModifierPub;
    readonly _pub: number;
    readonly _visibility_modifier_pub_parens?: VisibilityModifierPubParens;
    readonly __inputHints__?: {
        readonly pub: KindEnum<"pub", TSKindId.Pub>;
    };
    pub(): number;
    visibilityModifierPubParens(): VisibilityModifierPubParens | undefined;
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
    readonly _attributes?: readonly (AttributeItem | Expression)[];
    attributes(): readonly (AttributeItem | Expression)[];
}
export interface ArrayExpressionUFormSemi {
    readonly $type: TSKindId.ArrayExpression;
    readonly $variant: 'semi';
    readonly _array_expression_semi: ArrayExpressionSemi;
    arrayExpressionSemi(): ArrayExpressionSemi;
}
export interface ArrayExpressionUFormList {
    readonly $type: TSKindId.ArrayExpression;
    readonly $variant: 'list';
    readonly _array_expression_list: ArrayExpressionList;
    arrayExpressionList(): ArrayExpressionList;
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
    readonly _move_marker?: boolean;
    readonly _block: Block;
    readonly __inputHints__?: {
        readonly move_marker?: BooleanKeyword<"move">;
    };
    moveMarker(): boolean | undefined;
    block(): Block;
}
export interface Attribute {
    readonly $type: TSKindId.Attribute;
    readonly _path: Path;
    readonly _value?: Expression;
    readonly _arguments?: DelimTokenTree;
    path(): Path;
    value(): Expression | undefined;
    arguments(): DelimTokenTree | undefined;
}
export interface AttributeItem {
    readonly $type: TSKindId.AttributeItem;
    readonly _attribute: Attribute;
    attribute(): Attribute;
}
export interface AwaitExpression {
    readonly $type: TSKindId.AwaitExpression;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface BaseFieldInitializer {
    readonly $type: TSKindId.BaseFieldInitializer;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface BinaryExpression {
    readonly $type: TSKindId.BinaryExpression;
    readonly _left: Expression;
    readonly _operator: number;
    readonly _right: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"&&" | "||" | "&" | "|" | "^" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | "+" | "-" | "*" | "/" | "%", TSKindId.AmpAmp | TSKindId.PipePipe | TSKindId.Amp2 | TSKindId.Pipe2 | TSKindId.Caret | TSKindId.EqEq | TSKindId.BangEq | TSKindId.Lt | TSKindId.LtEq | TSKindId.Gt | TSKindId.GtEq | TSKindId.LtLt | TSKindId.GtGt | TSKindId.Plus | TSKindId.Dash | TSKindId.Star | TSKindId.Slash | TSKindId.Percent>;
    };
    left(): Expression;
    operator(): number;
    right(): Expression;
}
export interface Block {
    readonly $type: TSKindId.Block;
    readonly _label?: Label;
    readonly _statement?: readonly (Statement)[];
    readonly _trailing_expression?: Expression;
    label(): Label | undefined;
    statements(): readonly (Statement)[];
    trailingExpression(): Expression | undefined;
}
export interface BlockComment {
    readonly $type: TSKindId.BlockComment;
    readonly _outer?: boolean;
    readonly _inner?: boolean;
    readonly _doc?: BlockCommentContent;
    readonly __inputHints__?: {
        readonly outer?: BooleanKeyword<"*">;
        readonly inner?: BooleanKeyword<"!">;
    };
    outer(): boolean | undefined;
    inner(): boolean | undefined;
    doc(): BlockCommentContent | undefined;
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
    readonly _type: _Type | QualifiedType;
    type(): _Type | QualifiedType;
}
export interface BreakExpression {
    readonly $type: TSKindId.BreakExpression;
    readonly _label?: Label;
    readonly _expression?: Expression;
    label(): Label | undefined;
    expression(): Expression | undefined;
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
    readonly _pattern: Pattern;
    identifier(): Identifier;
    pattern(): Pattern;
}
export interface ClosureExpressionExpr {
    readonly $type: "closure_expression_expr";
    readonly _body: Expression | "_";
    body(): Expression | "_";
}
export interface ClosureExpressionUFormBlock {
    readonly $type: TSKindId.ClosureExpression;
    readonly $variant: 'block';
    readonly _static_marker?: boolean;
    readonly _async_marker?: boolean;
    readonly _move_marker?: boolean;
    readonly _parameters: ClosureParameters;
    readonly _closure_expression_block: ClosureExpressionBlock;
    readonly __inputHints__?: {
        readonly static_marker?: BooleanKeyword<"static">;
        readonly async_marker?: BooleanKeyword<"async">;
        readonly move_marker?: BooleanKeyword<"move">;
    };
    staticMarker(): boolean | undefined;
    asyncMarker(): boolean | undefined;
    moveMarker(): boolean | undefined;
    parameters(): ClosureParameters;
    closureExpressionBlock(): ClosureExpressionBlock;
}
export interface ClosureExpressionUFormExpr {
    readonly $type: TSKindId.ClosureExpression;
    readonly $variant: 'expr';
    readonly _static_marker?: boolean;
    readonly _async_marker?: boolean;
    readonly _move_marker?: boolean;
    readonly _parameters: ClosureParameters;
    readonly _closure_expression_expr: _ClosureExpressionExpr;
    readonly __inputHints__?: {
        readonly static_marker?: BooleanKeyword<"static">;
        readonly async_marker?: BooleanKeyword<"async">;
        readonly move_marker?: BooleanKeyword<"move">;
    };
    staticMarker(): boolean | undefined;
    asyncMarker(): boolean | undefined;
    moveMarker(): boolean | undefined;
    parameters(): ClosureParameters;
    closureExpressionExpr(): _ClosureExpressionExpr;
}
export type ClosureExpression = ClosureExpressionUFormBlock | ClosureExpressionUFormExpr;
export interface ClosureParameters {
    readonly $type: TSKindId.ClosureParameters;
    readonly _pattern?: readonly (Pattern | Parameter)[];
    patterns(): readonly (Pattern | Parameter)[];
}
export interface Comment {
    readonly $type: "comment";
    readonly _line_comment: LineComment | BlockComment;
    lineComment(): LineComment | BlockComment;
}
export interface CompoundAssignmentExpr {
    readonly $type: TSKindId.CompoundAssignmentExpr;
    readonly _left: Expression;
    readonly _operator: number;
    readonly _right: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=", TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.CaretEq | TSKindId.LtLtEq | TSKindId.GtGtEq>;
    };
    left(): Expression;
    operator(): number;
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
    type(): _Type;
    value(): Expression | undefined;
}
export interface ConstParameter {
    readonly $type: TSKindId.ConstParameter;
    readonly _name: Identifier;
    readonly _type: _Type;
    readonly _value?: Block | Identifier | Literal | NegativeLiteral;
    name(): Identifier;
    type(): _Type;
    value(): Block | Identifier | Literal | NegativeLiteral | undefined;
}
export interface ContinueExpression {
    readonly $type: TSKindId.ContinueExpression;
    readonly _label?: Label;
    label(): Label | undefined;
}
export interface DeclarationList {
    readonly $type: TSKindId.DeclarationList;
    readonly _declaration_statement?: readonly (DeclarationStatement)[];
    declarationStatements(): readonly (DeclarationStatement)[];
}
export interface DelimTokenTreeParen {
    readonly $type: "delim_token_tree_paren";
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface DelimTokenTreeBracket {
    readonly $type: "delim_token_tree_bracket";
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface DelimTokenTreeBrace {
    readonly $type: "delim_token_tree_brace";
    readonly _delim_tokens?: readonly (DelimTokens)[];
    delimTokens(): readonly (DelimTokens)[];
}
export interface DelimTokenTreeUFormParen {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'paren';
    readonly _delim_token_tree_paren: _DelimTokenTreeParen;
    delimTokenTreeParen(): _DelimTokenTreeParen;
}
export interface DelimTokenTreeUFormBracket {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'bracket';
    readonly _delim_token_tree_bracket: _DelimTokenTreeBracket;
    delimTokenTreeBracket(): _DelimTokenTreeBracket;
}
export interface DelimTokenTreeUFormBrace {
    readonly $type: TSKindId.DelimTokenTree;
    readonly $variant: 'brace';
    readonly _delim_token_tree_brace: _DelimTokenTreeBrace;
    delimTokenTreeBrace(): _DelimTokenTreeBrace;
}
export type DelimTokenTree = DelimTokenTreeUFormParen | DelimTokenTreeUFormBracket | DelimTokenTreeUFormBrace;
export interface DynamicType {
    readonly $type: TSKindId.DynamicType;
    readonly _trait: HigherRankedTraitBound | TypeIdentifier | ScopedTypeIdentifier | GenericType | FunctionType | TupleType;
    trait(): HigherRankedTraitBound | TypeIdentifier | ScopedTypeIdentifier | GenericType | FunctionType | TupleType;
}
export interface ElseClause {
    readonly $type: TSKindId.ElseClause;
    readonly _block: Block | IfExpression;
    block(): Block | IfExpression;
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
    readonly _attributed_enum_variant?: readonly (AttributedEnumVariant)[];
    attributedEnumVariants(): readonly (AttributedEnumVariant)[];
}
export interface ExpressionStatementWithSemi {
    readonly $type: "expression_statement_with_semi";
    readonly _expression: Expression;
    expression(): Expression;
}
export interface ExpressionStatementBlockEnding {
    readonly $type: "expression_statement_block_ending";
    readonly _expression_ending_with_block: ExpressionEndingWithBlock;
    expressionEndingWithBlock(): ExpressionEndingWithBlock;
}
export interface ExpressionStatementUFormWithSemi {
    readonly $type: TSKindId.ExpressionStatement;
    readonly $variant: 'with_semi';
    readonly _expression_statement_with_semi: _ExpressionStatementWithSemi;
    expressionStatementWithSemi(): _ExpressionStatementWithSemi;
}
export interface ExpressionStatementUFormBlockEnding {
    readonly $type: TSKindId.ExpressionStatement;
    readonly $variant: 'block_ending';
    readonly _expression_statement_block_ending: _ExpressionStatementBlockEnding;
    expressionStatementBlockEnding(): _ExpressionStatementBlockEnding;
}
export type ExpressionStatement = ExpressionStatementUFormWithSemi | ExpressionStatementUFormBlockEnding;
export interface ExternCrateDeclaration {
    readonly $type: TSKindId.ExternCrateDeclaration;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _crate: number;
    readonly _name: Identifier;
    readonly _alias?: Identifier;
    readonly __inputHints__?: {
        readonly crate: KindEnum<"crate", TSKindId.Crate>;
    };
    visibilityModifier(): VisibilityModifier | undefined;
    crate(): number;
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
    type(): _Type;
}
export interface FieldDeclarationList {
    readonly $type: TSKindId.FieldDeclarationList;
    readonly _attributed_field_declaration?: readonly (AttributedFieldDeclaration)[];
    attributedFieldDeclarations(): readonly (AttributedFieldDeclaration)[];
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
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _field: FieldIdentifier | IntegerLiteral;
    readonly _value: Expression;
    attributeItems(): readonly (AttributeItem)[];
    field(): FieldIdentifier | IntegerLiteral;
    value(): Expression;
}
export interface FieldInitializerList {
    readonly $type: TSKindId.FieldInitializerList;
    readonly _shorthand_field_initializer?: readonly (ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer)[];
    shorthandFieldInitializers(): readonly (ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer)[];
}
export interface FieldPatternShorthand {
    readonly $type: "field_pattern_shorthand";
    readonly _name: Identifier;
    name(): Identifier;
}
export interface FieldPatternUFormShorthand {
    readonly $type: TSKindId.FieldPattern;
    readonly $variant: 'shorthand';
    readonly _ref_marker?: boolean;
    readonly _mutable_specifier?: boolean;
    readonly _field_pattern_shorthand: _FieldPatternShorthand;
    readonly __inputHints__?: {
        readonly ref_marker?: BooleanKeyword<"ref">;
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    refMarker(): boolean | undefined;
    mutableSpecifier(): boolean | undefined;
    fieldPatternShorthand(): _FieldPatternShorthand;
}
export interface FieldPatternUFormNamed {
    readonly $type: TSKindId.FieldPattern;
    readonly $variant: 'named';
    readonly _ref_marker?: boolean;
    readonly _mutable_specifier?: boolean;
    readonly _field_pattern_named: FieldPatternNamed;
    readonly __inputHints__?: {
        readonly ref_marker?: BooleanKeyword<"ref">;
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    refMarker(): boolean | undefined;
    mutableSpecifier(): boolean | undefined;
    fieldPatternNamed(): FieldPatternNamed;
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
    readonly _lifetime: NonEmptyArray<Lifetime>;
    lifetimes(): NonEmptyArray<Lifetime>;
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
    readonly _foreign_mod_item_semi: number;
    readonly __inputHints__?: {
        readonly foreign_mod_item_semi: KindEnum<";", TSKindId.Semi>;
    };
    visibilityModifier(): VisibilityModifier | undefined;
    externModifier(): ExternModifier;
    foreignModItemSemi(): number;
}
export interface ForeignModItemUFormBody {
    readonly $type: TSKindId.ForeignModItem;
    readonly $variant: 'body';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _extern_modifier: ExternModifier;
    readonly _foreign_mod_item_body: _ForeignModItemBody;
    visibilityModifier(): VisibilityModifier | undefined;
    externModifier(): ExternModifier;
    foreignModItemBody(): _ForeignModItemBody;
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
    readonly _modifier: NonEmptyArray<Async | Default | Const | Unsafe | ExternModifier>;
    modifiers(): NonEmptyArray<Async | Default | Const | Unsafe | ExternModifier>;
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
    readonly _function_type_trait_form: FunctionTypeTraitForm | FunctionTypeFnForm;
    readonly _return_type?: _Type;
    forLifetimes(): ForLifetimes | undefined;
    parameters(): Parameters;
    functionTypeTraitForm(): FunctionTypeTraitForm | FunctionTypeFnForm;
    returnType(): _Type | undefined;
}
export interface GenBlock {
    readonly $type: TSKindId.GenBlock;
    readonly _move_marker?: boolean;
    readonly _block: Block;
    readonly __inputHints__?: {
        readonly move_marker?: BooleanKeyword<"move">;
    };
    moveMarker(): boolean | undefined;
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
    readonly _identifier: Identifier | ScopedIdentifier;
    readonly _type_arguments: TypeArguments;
    identifier(): Identifier | ScopedIdentifier;
    typeArguments(): TypeArguments;
}
export interface GenericType {
    readonly $type: TSKindId.GenericType;
    readonly _type: TypeIdentifier | ReservedIdentifier | ScopedTypeIdentifier;
    readonly _type_arguments: TypeArguments;
    type(): TypeIdentifier | ReservedIdentifier | ScopedTypeIdentifier;
    typeArguments(): TypeArguments;
}
export interface GenericTypeWithTurbofish {
    readonly $type: TSKindId.GenericTypeWithTurbofish;
    readonly _type: TypeIdentifier | ScopedIdentifier;
    readonly _turbofish: number;
    readonly _type_arguments: TypeArguments;
    readonly __inputHints__?: {
        readonly turbofish: KindEnum<"::", TSKindId.ColonColon>;
    };
    type(): TypeIdentifier | ScopedIdentifier;
    turbofish(): number;
    typeArguments(): TypeArguments;
}
export interface HigherRankedTraitBound {
    readonly $type: TSKindId.HigherRankedTraitBound;
    readonly _type_parameters: TypeParameters;
    readonly _type: _Type;
    typeParameters(): TypeParameters;
    type(): _Type;
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
    readonly _unsafe_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _negative?: boolean;
    readonly _trait?: TypeIdentifier | ScopedTypeIdentifier | GenericType;
    readonly _type: _Type;
    readonly _where_clause?: WhereClause;
    readonly _impl_item_body: _ImplItemBody;
    readonly __inputHints__?: {
        readonly unsafe_marker?: BooleanKeyword<"unsafe">;
        readonly negative?: BooleanKeyword<"!">;
    };
    unsafeMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    negative(): boolean | undefined;
    trait(): TypeIdentifier | ScopedTypeIdentifier | GenericType | undefined;
    type(): _Type;
    whereClause(): WhereClause | undefined;
    implItemBody(): _ImplItemBody;
}
export interface ImplItemUFormSemi {
    readonly $type: TSKindId.ImplItem;
    readonly $variant: 'semi';
    readonly _unsafe_marker?: boolean;
    readonly _type_parameters?: TypeParameters;
    readonly _negative?: boolean;
    readonly _trait?: TypeIdentifier | ScopedTypeIdentifier | GenericType;
    readonly _type: _Type;
    readonly _where_clause?: WhereClause;
    readonly _impl_item_semi: number;
    readonly __inputHints__?: {
        readonly unsafe_marker?: BooleanKeyword<"unsafe">;
        readonly negative?: BooleanKeyword<"!">;
        readonly impl_item_semi: KindEnum<";", TSKindId.Semi>;
    };
    unsafeMarker(): boolean | undefined;
    typeParameters(): TypeParameters | undefined;
    negative(): boolean | undefined;
    trait(): TypeIdentifier | ScopedTypeIdentifier | GenericType | undefined;
    type(): _Type;
    whereClause(): WhereClause | undefined;
    implItemSemi(): number;
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
    readonly _attribute_item?: readonly (AttributeItem | InnerAttributeItem)[];
    readonly _pattern: MatchPattern;
    readonly _value: Expression;
    attributeItems(): readonly (AttributeItem | InnerAttributeItem)[];
    pattern(): MatchPattern;
    value(): Expression;
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
    readonly _mutable_specifier?: boolean;
    readonly _pattern: Pattern;
    readonly _type?: _Type;
    readonly _value?: Expression;
    readonly _alternative?: Block;
    readonly __inputHints__?: {
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    mutableSpecifier(): boolean | undefined;
    pattern(): Pattern;
    type(): _Type | undefined;
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
    readonly _line_comment_regular_dslash: LineCommentRegularDslash;
    lineCommentRegularDslash(): LineCommentRegularDslash;
}
export interface LineCommentUFormDoc {
    readonly $type: TSKindId.LineComment;
    readonly $variant: 'doc';
    readonly _line_comment_doc: LineCommentDoc;
    lineCommentDoc(): LineCommentDoc;
}
export interface LineCommentUFormContent {
    readonly $type: TSKindId.LineComment;
    readonly $variant: 'content';
    readonly _line_comment_content: LineCommentContent;
    lineCommentContent(): LineCommentContent;
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
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
}
export interface MacroDefinitionBracket {
    readonly $type: "macro_definition_bracket";
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
}
export interface MacroDefinitionBrace {
    readonly $type: "macro_definition_brace";
    readonly _macro_rule?: readonly (MacroRule)[];
    macroRules(): readonly (MacroRule)[];
}
export interface MacroDefinitionUFormParen {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'paren';
    readonly _name: Identifier | ReservedIdentifier;
    readonly _macro_definition_paren: _MacroDefinitionParen;
    name(): Identifier | ReservedIdentifier;
    macroDefinitionParen(): _MacroDefinitionParen;
}
export interface MacroDefinitionUFormBracket {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'bracket';
    readonly _name: Identifier | ReservedIdentifier;
    readonly _macro_definition_bracket: _MacroDefinitionBracket;
    name(): Identifier | ReservedIdentifier;
    macroDefinitionBracket(): _MacroDefinitionBracket;
}
export interface MacroDefinitionUFormBrace {
    readonly $type: TSKindId.MacroDefinition;
    readonly $variant: 'brace';
    readonly _name: Identifier | ReservedIdentifier;
    readonly _macro_definition_brace: _MacroDefinitionBrace;
    name(): Identifier | ReservedIdentifier;
    macroDefinitionBrace(): _MacroDefinitionBrace;
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
    readonly _attributes?: readonly (AttributeItem | InnerAttributeItem)[];
    readonly _pattern: MatchPattern;
    readonly _match_arm_with_comma: MatchArmWithComma;
    attributes(): readonly (AttributeItem | InnerAttributeItem)[];
    pattern(): MatchPattern;
    matchArmWithComma(): MatchArmWithComma;
}
export interface MatchArmUFormBlockEnding {
    readonly $type: TSKindId.MatchArm;
    readonly $variant: 'block_ending';
    readonly _attributes?: readonly (AttributeItem | InnerAttributeItem)[];
    readonly _pattern: MatchPattern;
    readonly _match_arm_block_ending: _MatchArmBlockEnding;
    attributes(): readonly (AttributeItem | InnerAttributeItem)[];
    pattern(): MatchPattern;
    matchArmBlockEnding(): _MatchArmBlockEnding;
}
export type MatchArm = MatchArmUFormWithComma | MatchArmUFormBlockEnding;
export interface MatchBlock {
    readonly $type: TSKindId.MatchBlock;
    readonly _match_arm?: readonly (MatchArm | LastMatchArm)[];
    matchArms(): readonly (MatchArm | LastMatchArm)[];
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
    readonly _pattern: Pattern;
    readonly _condition?: Condition;
    pattern(): Pattern;
    condition(): Condition | undefined;
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
    readonly _mod_item_external: number;
    readonly __inputHints__?: {
        readonly mod_item_external: KindEnum<";", TSKindId.Semi>;
    };
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
    modItemExternal(): number;
}
export interface ModItemUFormInline {
    readonly $type: TSKindId.ModItem;
    readonly $variant: 'inline';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: Identifier;
    readonly _mod_item_inline: _ModItemInline;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): Identifier;
    modItemInline(): _ModItemInline;
}
export type ModItem = ModItemUFormExternal | ModItemUFormInline;
export interface MutPattern {
    readonly $type: TSKindId.MutPattern;
    readonly _mutable_specifier: AutoStamp<"mut">;
    readonly _pattern: Pattern;
    mutableSpecifier(): AutoStamp<"mut">;
    pattern(): Pattern;
}
export interface NegativeLiteral {
    readonly $type: TSKindId.NegativeLiteral;
    readonly _value: IntegerLiteral | FloatLiteral;
    value(): IntegerLiteral | FloatLiteral;
}
export interface OrPatternUFormBinary {
    readonly $type: TSKindId.OrPattern;
    readonly $variant: 'binary';
    readonly _or_pattern_binary: OrPatternBinary;
    orPatternBinary(): OrPatternBinary;
}
export interface OrPatternUFormPrefix {
    readonly $type: TSKindId.OrPattern;
    readonly $variant: 'prefix';
    readonly _or_pattern_prefix: OrPatternPrefix;
    orPatternPrefix(): OrPatternPrefix;
}
export type OrPattern = OrPatternUFormBinary | OrPatternUFormPrefix;
export interface OrderedFieldDeclarationList {
    readonly $type: TSKindId.OrderedFieldDeclarationList;
    readonly _attribute_item?: readonly (AttributeItem)[];
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _type?: readonly (_Type)[];
    attributeItems(): readonly (AttributeItem)[];
    visibilityModifier(): VisibilityModifier | undefined;
    types(): readonly (_Type)[];
}
export interface Parameter {
    readonly $type: TSKindId.Parameter;
    readonly _mutable_specifier?: boolean;
    readonly _pattern: Pattern | Self;
    readonly _type: _Type;
    readonly __inputHints__?: {
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    mutableSpecifier(): boolean | undefined;
    pattern(): Pattern | Self;
    type(): _Type;
}
export interface Parameters {
    readonly $type: TSKindId.Parameters;
    readonly _attributed_parameter?: readonly (AttributedParameter)[];
    attributedParameters(): readonly (AttributedParameter)[];
}
export interface ParenthesizedExpression {
    readonly $type: TSKindId.ParenthesizedExpression;
    readonly _expression: Expression;
    expression(): Expression;
}
export interface PointerTypeMut {
    readonly $type: "pointer_type_mut";
    readonly _mutable_specifier: MutableSpecifier;
    mutableSpecifier(): MutableSpecifier;
}
export interface PointerTypeUFormConst {
    readonly $type: TSKindId.PointerType;
    readonly $variant: 'const';
    readonly _pointer_type_const: number;
    readonly _type: _Type;
    readonly __inputHints__?: {
        readonly pointer_type_const: KindEnum<"const", TSKindId.Const>;
    };
    pointerTypeConst(): number;
    type(): _Type;
}
export interface PointerTypeUFormMut {
    readonly $type: TSKindId.PointerType;
    readonly $variant: 'mut';
    readonly _pointer_type_mut: _PointerTypeMut;
    readonly _type: _Type;
    pointerTypeMut(): _PointerTypeMut;
    type(): _Type;
}
export type PointerType = PointerTypeUFormConst | PointerTypeUFormMut;
export interface QualifiedType {
    readonly $type: TSKindId.QualifiedType;
    readonly _type: _Type;
    readonly _alias: _Type;
    type(): _Type;
    alias(): _Type;
}
export interface RangeExpressionBare {
    readonly $type: "range_expression_bare";
    readonly _operator: number;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"..", TSKindId.DotDot>;
    };
    operator(): number;
}
export interface RangeExpressionUFormBinary {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'binary';
    readonly _range_expression_binary: RangeExpressionBinary;
    rangeExpressionBinary(): RangeExpressionBinary;
}
export interface RangeExpressionUFormPostfix {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'postfix';
    readonly _range_expression_postfix: RangeExpressionPostfix;
    rangeExpressionPostfix(): RangeExpressionPostfix;
}
export interface RangeExpressionUFormPrefix {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'prefix';
    readonly _range_expression_prefix: RangeExpressionPrefix;
    rangeExpressionPrefix(): RangeExpressionPrefix;
}
export interface RangeExpressionUFormBare {
    readonly $type: TSKindId.RangeExpression;
    readonly $variant: 'bare';
    readonly _range_expression_bare: _RangeExpressionBare;
    rangeExpressionBare(): _RangeExpressionBare;
}
export type RangeExpression = RangeExpressionUFormBinary | RangeExpressionUFormPostfix | RangeExpressionUFormPrefix | RangeExpressionUFormBare;
export interface RangePatternUFormPrefix {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'prefix';
    readonly _range_pattern_prefix: RangePatternPrefix;
    rangePatternPrefix(): RangePatternPrefix;
}
export interface RangePatternUFormLeftWithRight {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'left_with_right';
    readonly _left: LiteralPattern | Path;
    readonly _range_pattern_left_with_right: RangePatternLeftWithRight;
    left(): LiteralPattern | Path;
    rangePatternLeftWithRight(): RangePatternLeftWithRight;
}
export interface RangePatternUFormLeftBare {
    readonly $type: TSKindId.RangePattern;
    readonly $variant: 'left_bare';
    readonly _left: LiteralPattern | Path;
    readonly _range_pattern_left_bare: number;
    readonly __inputHints__?: {
        readonly range_pattern_left_bare: KindEnum<"..", TSKindId.DotDot>;
    };
    left(): LiteralPattern | Path;
    rangePatternLeftBare(): number;
}
export type RangePattern = RangePatternUFormPrefix | RangePatternUFormLeftWithRight | RangePatternUFormLeftBare;
export interface RawStringLiteral {
    readonly $type: TSKindId.RawStringLiteral;
    readonly _string_content: RawStringLiteralContent;
    stringContent(): RawStringLiteralContent;
}
export interface RefPattern {
    readonly $type: TSKindId.RefPattern;
    readonly _pattern: Pattern;
    pattern(): Pattern;
}
export interface ReferenceExpression {
    readonly $type: TSKindId.ReferenceExpression;
    readonly _reference_expression_raw_const?: ReferenceExpressionRawConst | ReferenceExpressionRawMut | MutableSpecifier;
    readonly _value: Expression;
    referenceExpressionRawConst(): ReferenceExpressionRawConst | ReferenceExpressionRawMut | MutableSpecifier | undefined;
    value(): Expression;
}
export interface ReferencePattern {
    readonly $type: TSKindId.ReferencePattern;
    readonly _mutable_specifier?: boolean;
    readonly _pattern: Pattern;
    readonly __inputHints__?: {
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    mutableSpecifier(): boolean | undefined;
    pattern(): Pattern;
}
export interface ReferenceType {
    readonly $type: TSKindId.ReferenceType;
    readonly _lifetime?: Lifetime;
    readonly _mutable_specifier?: boolean;
    readonly _type: _Type;
    readonly __inputHints__?: {
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    lifetime(): Lifetime | undefined;
    mutableSpecifier(): boolean | undefined;
    type(): _Type;
}
export interface RemovedTraitBound {
    readonly $type: TSKindId.RemovedTraitBound;
    readonly _type: _Type;
    type(): _Type;
}
export interface ReturnExpression {
    readonly $type: TSKindId.ReturnExpression;
    readonly _expression?: Expression;
    expression(): Expression | undefined;
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
    readonly _reference?: boolean;
    readonly _lifetime?: Lifetime;
    readonly _mutable_specifier?: boolean;
    readonly _self: number;
    readonly __inputHints__?: {
        readonly reference?: BooleanKeyword<"&">;
        readonly mutable_specifier?: BooleanKeyword<"mut">;
        readonly self: KindEnum<"self", TSKindId.Self>;
    };
    reference(): boolean | undefined;
    lifetime(): Lifetime | undefined;
    mutableSpecifier(): boolean | undefined;
    self(): number;
}
export interface ShorthandFieldInitializer {
    readonly $type: TSKindId.ShorthandFieldInitializer;
    readonly _attributes?: readonly (AttributeItem)[];
    readonly _identifier: Identifier;
    attributes(): readonly (AttributeItem)[];
    identifier(): Identifier;
}
export interface SlicePattern {
    readonly $type: TSKindId.SlicePattern;
    readonly _pattern?: readonly (Pattern)[];
    patterns(): readonly (Pattern)[];
}
export interface SourceFile {
    readonly $type: TSKindId.SourceFile;
    readonly _shebang?: Shebang;
    readonly _statements?: readonly (Statement)[];
    shebang(): Shebang | undefined;
    statements(): readonly (Statement)[];
}
export interface StaticItem {
    readonly $type: TSKindId.StaticItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _mutable_specifier?: "ref" | "mut";
    readonly _name: Identifier;
    readonly _type: _Type;
    readonly _value?: Expression;
    visibilityModifier(): VisibilityModifier | undefined;
    mutableSpecifier(): "ref" | "mut" | undefined;
    name(): Identifier;
    type(): _Type;
    value(): Expression | undefined;
}
export interface StringLiteral {
    readonly $type: TSKindId.StringLiteral;
    readonly _escape_sequence?: readonly (EscapeSequence | StringContent)[];
    escapeSequences(): readonly (EscapeSequence | StringContent)[];
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
    readonly _struct_item_brace: StructItemBrace;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    structItemBrace(): StructItemBrace;
}
export interface StructItemUFormTuple {
    readonly $type: TSKindId.StructItem;
    readonly $variant: 'tuple';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _struct_item_tuple: StructItemTuple;
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    structItemTuple(): StructItemTuple;
}
export interface StructItemUFormUnit {
    readonly $type: TSKindId.StructItem;
    readonly $variant: 'unit';
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _struct_item_unit: number;
    readonly __inputHints__?: {
        readonly struct_item_unit: KindEnum<";", TSKindId.Semi>;
    };
    visibilityModifier(): VisibilityModifier | undefined;
    name(): TypeIdentifier;
    typeParameters(): TypeParameters | undefined;
    structItemUnit(): number;
}
export type StructItem = StructItemUFormBrace | StructItemUFormTuple | StructItemUFormUnit;
export interface StructPattern {
    readonly $type: TSKindId.StructPattern;
    readonly _type: TypeIdentifier | ScopedTypeIdentifier;
    readonly _field_pattern?: readonly (FieldPattern | RemainingFieldPattern)[];
    type(): TypeIdentifier | ScopedTypeIdentifier;
    fieldPatterns(): readonly (FieldPattern | RemainingFieldPattern)[];
}
export interface TokenBindingPattern {
    readonly $type: TSKindId.TokenBindingPattern;
    readonly _name: Metavariable;
    readonly _type: number;
    readonly __inputHints__?: {
        readonly type: KindEnum<"block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis", TSKindId.Block | TSKindId.Expr | TSKindId.Expr2021 | TSKindId.Ident | TSKindId.Item | TSKindId.Lifetime | TSKindId.Literal | TSKindId.Meta | TSKindId.Pat | TSKindId.PatParam | TSKindId.Path | TSKindId.Stmt | TSKindId.Tt | TSKindId.Ty | TSKindId.Vis>;
    };
    name(): Metavariable;
    type(): number;
}
export interface TokenRepetition {
    readonly $type: TSKindId.TokenRepetition;
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface TokenRepetitionPattern {
    readonly $type: TSKindId.TokenRepetitionPattern;
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface TokenTreeParen {
    readonly $type: "token_tree_paren";
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface TokenTreeBracket {
    readonly $type: "token_tree_bracket";
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface TokenTreeBrace {
    readonly $type: "token_tree_brace";
    readonly _tokens?: readonly (Tokens)[];
    tokens(): readonly (Tokens)[];
}
export interface TokenTreeUFormParen {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'paren';
    readonly _token_tree_paren: _TokenTreeParen;
    tokenTreeParen(): _TokenTreeParen;
}
export interface TokenTreeUFormBracket {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'bracket';
    readonly _token_tree_bracket: _TokenTreeBracket;
    tokenTreeBracket(): _TokenTreeBracket;
}
export interface TokenTreeUFormBrace {
    readonly $type: TSKindId.TokenTree;
    readonly $variant: 'brace';
    readonly _token_tree_brace: _TokenTreeBrace;
    tokenTreeBrace(): _TokenTreeBrace;
}
export type TokenTree = TokenTreeUFormParen | TokenTreeUFormBracket | TokenTreeUFormBrace;
export interface TokenTreePatternParen {
    readonly $type: "token_tree_pattern_paren";
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface TokenTreePatternBracket {
    readonly $type: "token_tree_pattern_bracket";
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface TokenTreePatternBrace {
    readonly $type: "token_tree_pattern_brace";
    readonly _token_pattern?: readonly (TokenPattern)[];
    tokenPatterns(): readonly (TokenPattern)[];
}
export interface TokenTreePatternUFormParen {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'paren';
    readonly _token_tree_pattern_paren: _TokenTreePatternParen;
    tokenTreePatternParen(): _TokenTreePatternParen;
}
export interface TokenTreePatternUFormBracket {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'bracket';
    readonly _token_tree_pattern_bracket: _TokenTreePatternBracket;
    tokenTreePatternBracket(): _TokenTreePatternBracket;
}
export interface TokenTreePatternUFormBrace {
    readonly $type: TSKindId.TokenTreePattern;
    readonly $variant: 'brace';
    readonly _token_tree_pattern_brace: _TokenTreePatternBrace;
    tokenTreePatternBrace(): _TokenTreePatternBrace;
}
export type TokenTreePattern = TokenTreePatternUFormParen | TokenTreePatternUFormBracket | TokenTreePatternUFormBrace;
export interface TraitBounds {
    readonly $type: TSKindId.TraitBounds;
    readonly _type: NonEmptyArray<_Type | Lifetime | HigherRankedTraitBound>;
    types(): NonEmptyArray<_Type | Lifetime | HigherRankedTraitBound>;
}
export interface TraitItem {
    readonly $type: TSKindId.TraitItem;
    readonly _visibility_modifier?: VisibilityModifier;
    readonly _unsafe_marker?: boolean;
    readonly _name: TypeIdentifier;
    readonly _type_parameters?: TypeParameters;
    readonly _bounds?: TraitBounds;
    readonly _where_clause?: WhereClause;
    readonly _body: DeclarationList;
    readonly __inputHints__?: {
        readonly unsafe_marker?: BooleanKeyword<"unsafe">;
    };
    visibilityModifier(): VisibilityModifier | undefined;
    unsafeMarker(): boolean | undefined;
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
    readonly _attributes?: readonly (AttributeItem)[];
    readonly _elements?: readonly (Expression)[];
    attributes(): readonly (AttributeItem)[];
    elements(): readonly (Expression)[];
}
export interface TuplePattern {
    readonly $type: TSKindId.TuplePattern;
    readonly _pattern?: readonly (Pattern | ClosureExpression)[];
    patterns(): readonly (Pattern | ClosureExpression)[];
}
export interface TupleStructPattern {
    readonly $type: TSKindId.TupleStructPattern;
    readonly _type: Identifier | ScopedIdentifier | GenericTypeWithTurbofish;
    readonly _pattern?: readonly (Pattern)[];
    type(): Identifier | ScopedIdentifier | GenericTypeWithTurbofish;
    patterns(): readonly (Pattern)[];
}
export interface TupleType {
    readonly $type: TSKindId.TupleType;
    readonly _type: NonEmptyArray<_Type>;
    types(): NonEmptyArray<_Type>;
}
export interface TypeArguments {
    readonly $type: TSKindId.TypeArguments;
    readonly _type: NonEmptyArray<_Type | TypeBinding | Lifetime | Literal | Block>;
    readonly _trait_bounds?: TraitBounds;
    types(): NonEmptyArray<_Type | TypeBinding | Lifetime | Literal | Block>;
    traitBounds(): TraitBounds | undefined;
}
export interface TypeBinding {
    readonly $type: TSKindId.TypeBinding;
    readonly _name: TypeIdentifier;
    readonly _type_arguments?: TypeArguments;
    readonly _type: _Type;
    name(): TypeIdentifier;
    typeArguments(): TypeArguments | undefined;
    type(): _Type;
}
export interface TypeCastExpression {
    readonly $type: TSKindId.TypeCastExpression;
    readonly _value: Expression;
    readonly _type: _Type;
    value(): Expression;
    type(): _Type;
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
    type(): _Type;
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
    readonly _attributes: NonEmptyArray<AttributedTypeParameter>;
    attributes(): NonEmptyArray<AttributedTypeParameter>;
}
export interface UnaryExpression {
    readonly $type: TSKindId.UnaryExpression;
    readonly _operator: number;
    readonly _operand: Expression;
    readonly __inputHints__?: {
        readonly operator: KindEnum<"-" | "*" | "!", TSKindId.Dash | TSKindId.Star | TSKindId.Bang>;
    };
    operator(): number;
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
    readonly _lifetime?: readonly (Lifetime | TypeIdentifier)[];
    lifetimes(): readonly (Lifetime | TypeIdentifier)[];
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
    readonly _use_clause?: readonly (UseClause)[];
    useClauses(): readonly (UseClause)[];
}
export interface UseWildcard {
    readonly $type: TSKindId.UseWildcard;
    readonly _path?: Path;
    path(): Path | undefined;
}
export interface VariadicParameter {
    readonly $type: TSKindId.VariadicParameter;
    readonly _mutable_specifier?: boolean;
    readonly _pattern?: Pattern;
    readonly __inputHints__?: {
        readonly mutable_specifier?: BooleanKeyword<"mut">;
    };
    mutableSpecifier(): boolean | undefined;
    pattern(): Pattern | undefined;
}
export interface VisibilityModifierCrate {
    readonly $type: "visibility_modifier_crate";
    readonly _crate: number;
    readonly __inputHints__?: {
        readonly crate: KindEnum<"crate", TSKindId.Crate>;
    };
    crate(): number;
}
export interface VisibilityModifierUFormCrate {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'crate';
    readonly _visibility_modifier_crate: _VisibilityModifierCrate;
    visibilityModifierCrate(): _VisibilityModifierCrate;
}
export interface VisibilityModifierUFormPub {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'pub';
    readonly _visibility_modifier_pub: VisibilityModifierPub;
    visibilityModifierPub(): VisibilityModifierPub;
}
export interface VisibilityModifierUFormInPath {
    readonly $type: TSKindId.VisibilityModifier;
    readonly $variant: 'in_path';
    readonly _visibility_modifier_in_path: VisibilityModifierInPath;
    visibilityModifierInPath(): VisibilityModifierInPath;
}
export type VisibilityModifier = VisibilityModifierUFormCrate | VisibilityModifierUFormPub | VisibilityModifierUFormInPath;
export interface WhereClause {
    readonly $type: TSKindId.WhereClause;
    readonly _where_predicate?: readonly (WherePredicate)[];
    wherePredicates(): readonly (WherePredicate)[];
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
    readonly _expression?: Expression;
    expression(): Expression | undefined;
}
export interface VisibilityModifierPubParens {
    readonly $type: "_visibility_modifier_pub_parens";
    readonly _self: Self | Super | Crate | VisibilityModifierInPath;
    self(): Self | Super | Crate | VisibilityModifierInPath;
}
export type RangeExpressionBinaryOperator = Terminal<TSKindId.DotDot | TSKindId.DotDotDot | TSKindId.DotDotEq, ".." | "..." | "..=">;
export type CompoundAssignmentExprOperator = Terminal<TSKindId.PlusEq | TSKindId.DashEq | TSKindId.StarEq | TSKindId.SlashEq | TSKindId.PercentEq | TSKindId.AmpEq | TSKindId.PipeEq | TSKindId.CaretEq | TSKindId.LtLtEq | TSKindId.GtGtEq, "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=">;
export type FieldIdentifier = Terminal<TSKindId.FieldIdentifier, string>;
export type LineCommentContent = Terminal<TSKindId.LineCommentContent, string>;
export type LineCommentRegularDslash = Terminal<TSKindId.LineCommentRegularDslash, string>;
export type PrimitiveType = Terminal<TSKindId.U8 | TSKindId.I8 | TSKindId.U16 | TSKindId.I16 | TSKindId.U32 | TSKindId.I32 | TSKindId.U64 | TSKindId.I64 | TSKindId.U128 | TSKindId.I128 | TSKindId.Isize | TSKindId.Usize | TSKindId.F32 | TSKindId.F64 | TSKindId.Bool | TSKindId.Str | TSKindId.Char, "u8" | "i8" | "u16" | "i16" | "u32" | "i32" | "u64" | "i64" | "u128" | "i128" | "isize" | "usize" | "f32" | "f64" | "bool" | "str" | "char">;
export type ReferenceExpressionRawConst = Terminal<TSKindId.ReferenceExpressionRawConst, string>;
export type ReservedIdentifier = Terminal<TSKindId.Default | TSKindId.Union | TSKindId.Gen, "default" | "union" | "gen">;
export type TokenBindingPatternType = Terminal<TSKindId.Block | TSKindId.Expr | TSKindId.Expr2021 | TSKindId.Ident | TSKindId.Item | TSKindId.Lifetime | TSKindId.Literal | TSKindId.Meta | TSKindId.Pat | TSKindId.PatParam | TSKindId.Path | TSKindId.Stmt | TSKindId.Tt | TSKindId.Ty | TSKindId.Vis, "block" | "expr" | "expr_2021" | "ident" | "item" | "lifetime" | "literal" | "meta" | "pat" | "pat_param" | "path" | "stmt" | "tt" | "ty" | "vis">;
export type TypeIdentifier = Terminal<TSKindId.TypeIdentifier, string>;
export type UnaryExpressionOperator = Terminal<TSKindId.Dash | TSKindId.Star | TSKindId.Bang, "-" | "*" | "!">;
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
export type LineDocContent = Terminal<TSKindId.LineDocContent, string>;
export type ErrorSentinel = Terminal<TSKindId.ErrorSentinel, string>;
export type Async = Terminal<TSKindId.Async, "async">;
export type Unsafe = Terminal<TSKindId.Unsafe, "unsafe">;
export type Const = Terminal<TSKindId.Const, "const">;
export type Default = Terminal<TSKindId.Default, "default">;
export type BlockCommentContent = Terminal<TSKindId._BlockCommentContent, string>;
export interface ArrayExpressionListTree extends AnyTreeNode {
    readonly type: "_array_expression_list";
}
export interface ArrayExpressionSemiTree extends AnyTreeNode {
    readonly type: "_array_expression_semi";
}
export interface AttributedEnumVariantTree extends AnyTreeNode {
    readonly type: "_attributed_enum_variant";
}
export interface AttributedFieldDeclarationTree extends AnyTreeNode {
    readonly type: "_attributed_field_declaration";
}
export interface AttributedParameterTree extends AnyTreeNode {
    readonly type: "_attributed_parameter";
}
export interface AttributedTypeParameterTree extends AnyTreeNode {
    readonly type: "_attributed_type_parameter";
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
export interface RangePatternUFormPrefixTree extends TreeNode<'range_pattern'> {
}
export interface RangePatternUFormLeftWithRightTree extends TreeNode<'range_pattern'> {
}
export interface RangePatternUFormLeftBareTree extends TreeNode<'range_pattern'> {
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
export interface VisibilityModifierUFormCrateTree extends TreeNode<'visibility_modifier'> {
}
export interface VisibilityModifierUFormPubTree extends TreeNode<'visibility_modifier'> {
}
export interface VisibilityModifierUFormInPathTree extends TreeNode<'visibility_modifier'> {
}
export interface WhereClauseTree extends TreeNode<'where_clause'> {
}
export interface WherePredicateTree extends TreeNode<'where_predicate'> {
}
export interface WhileExpressionTree extends TreeNode<'while_expression'> {
}
export interface YieldExpressionTree extends TreeNode<'yield_expression'> {
}
export interface VisibilityModifierPubParensTree extends AnyTreeNode {
    readonly type: "_visibility_modifier_pub_parens";
}
export interface RangeExpressionBinaryOperatorTree extends AnyTreeNode {
    readonly type: "__range_expression_binary_operator";
}
export interface CompoundAssignmentExprOperatorTree extends AnyTreeNode {
    readonly type: "_compound_assignment_expr_operator";
}
export interface FieldIdentifierTree extends AnyTreeNode {
    readonly type: "_field_identifier";
}
export interface LineCommentContentTree extends AnyTreeNode {
    readonly type: "_line_comment_content";
}
export interface LineCommentRegularDslashTree extends AnyTreeNode {
    readonly type: "_line_comment_regular_dslash";
}
export interface PrimitiveTypeTree extends AnyTreeNode {
    readonly type: "_primitive_type";
}
export interface ReferenceExpressionRawConstTree extends AnyTreeNode {
    readonly type: "_reference_expression_raw_const";
}
export interface ReservedIdentifierTree extends AnyTreeNode {
    readonly type: "_reserved_identifier";
}
export interface TokenBindingPatternTypeTree extends AnyTreeNode {
    readonly type: "_token_binding_pattern_type";
}
export interface TypeIdentifierTree extends AnyTreeNode {
    readonly type: "_type_identifier";
}
export interface UnaryExpressionOperatorTree extends AnyTreeNode {
    readonly type: "_unary_expression_operator";
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
export interface LineDocContentTree extends AnyTreeNode {
    readonly type: "_line_doc_content";
}
export interface ErrorSentinelTree extends AnyTreeNode {
    readonly type: "_error_sentinel";
}
export interface AsyncTree extends AnyTreeNode {
    readonly type: "async";
}
export interface StaticTree extends AnyTreeNode {
    readonly type: "static";
}
export interface FnTree extends AnyTreeNode {
    readonly type: "fn";
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
export interface UnsafeTree extends AnyTreeNode {
    readonly type: "unsafe";
}
export interface MutTree extends AnyTreeNode {
    readonly type: "mut";
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
export type ExpressionExceptRange = UnaryExpression | ReferenceExpression | TryExpression | BinaryExpression | AssignmentExpression | CompoundAssignmentExpr | TypeCastExpression | CallExpression | ReturnExpression | YieldExpression | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | ReservedIdentifier | Self | ScopedIdentifier | GenericFunction | AwaitExpression | FieldExpression | ArrayExpression | TupleExpression | MacroInvocation | UnitExpression | BreakExpression | ContinueExpression | IndexExpression | Metavariable | ClosureExpression | ParenthesizedExpression | StructExpression | ExpressionEndingWithBlock | UnsafeBlock | AsyncBlock | GenBlock | TryBlock | Block | IfExpression | MatchExpression | WhileExpression | LoopExpression | ForExpression | ConstBlock;
export type ExpressionExceptRangeTree = UnaryExpressionTree | ReferenceExpressionTree | TryExpressionTree | BinaryExpressionTree | AssignmentExpressionTree | CompoundAssignmentExprTree | TypeCastExpressionTree | CallExpressionTree | ReturnExpressionTree | YieldExpressionTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | ReservedIdentifierTree | SelfTree | ScopedIdentifierTree | GenericFunctionTree | AwaitExpressionTree | FieldExpressionTree | ArrayExpressionTree | TupleExpressionTree | MacroInvocationTree | UnitExpressionTree | BreakExpressionTree | ContinueExpressionTree | IndexExpressionTree | MetavariableTree | ClosureExpressionTree | ParenthesizedExpressionTree | StructExpressionTree | ExpressionEndingWithBlockTree | UnsafeBlockTree | AsyncBlockTree | GenBlockTree | TryBlockTree | BlockTree | IfExpressionTree | MatchExpressionTree | WhileExpressionTree | LoopExpressionTree | ForExpressionTree | ConstBlockTree;
export type Literal = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral;
export type LiteralTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree;
export type LiteralPattern = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral;
export type LiteralPatternTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | NegativeLiteralTree;
export type NonDelimToken = StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type NonDelimTokenTree = StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type Path = Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | ReservedIdentifier;
export type PathTree = SelfTree | IdentifierTree | MetavariableTree | SuperTree | CrateTree | ScopedIdentifierTree | ReservedIdentifierTree;
export type Pattern = LiteralPattern | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | ReservedIdentifier | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation;
export type PatternTree = LiteralPatternTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | NegativeLiteralTree | IdentifierTree | ScopedIdentifierTree | GenericPatternTree | TuplePatternTree | TupleStructPatternTree | StructPatternTree | ReservedIdentifierTree | RefPatternTree | SlicePatternTree | CapturedPatternTree | ReferencePatternTree | MutPatternTree | RangePatternTree | OrPatternTree | ConstBlockTree | MacroInvocationTree;
export type Statement = ExpressionStatement | DeclarationStatement | ConstItem | MacroInvocation | MacroDefinition | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem;
export type StatementTree = ExpressionStatementTree | DeclarationStatementTree | ConstItemTree | MacroInvocationTree | MacroDefinitionTree | AttributeItemTree | InnerAttributeItemTree | ModItemTree | ForeignModItemTree | StructItemTree | UnionItemTree | EnumItemTree | TypeItemTree | FunctionItemTree | FunctionSignatureItemTree | ImplItemTree | TraitItemTree | AssociatedTypeTree | LetDeclarationTree | UseDeclarationTree | ExternCrateDeclarationTree | StaticItemTree;
export type TokenPattern = TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type TokenPatternTree = TokenTreePatternTree | TokenRepetitionPatternTree | TokenBindingPatternTree | MetavariableTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type Tokens = TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate;
export type TokensTree = TokenTreeTree | TokenRepetitionTree | MetavariableTree | StringLiteralTree | RawStringLiteralTree | CharLiteralTree | BooleanLiteralTree | IntegerLiteralTree | FloatLiteralTree | IdentifierTree | MutableSpecifierTree | SelfTree | SuperTree | CrateTree;
export type _Type = AbstractType | ReferenceType | Metavariable | PointerType | GenericType | ScopedTypeIdentifier | TupleType | UnitType | ArrayType | FunctionType | TypeIdentifier | MacroInvocation | DynamicType | BoundedType | RemovedTraitBound | PrimitiveType;
export type _TypeTree = AbstractTypeTree | ReferenceTypeTree | MetavariableTree | PointerTypeTree | GenericTypeTree | ScopedTypeIdentifierTree | TupleTypeTree | UnitTypeTree | ArrayTypeTree | FunctionTypeTree | TypeIdentifierTree | MacroInvocationTree | DynamicTypeTree | BoundedTypeTree | RemovedTraitBoundTree | PrimitiveTypeTree;
export type UseClause = Path | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier | UseAsClause | UseList | ScopedUseList | UseWildcard;
export type UseClauseTree = PathTree | SelfTree | IdentifierTree | MetavariableTree | SuperTree | CrateTree | ScopedIdentifierTree | UseAsClauseTree | UseListTree | ScopedUseListTree | UseWildcardTree;
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
export type TokSq = Terminal<"'">;
export interface TokSqTree extends AnyTreeNode {
    readonly type: "'";
}
export type AmpAmp = Terminal<TSKindId.AmpAmp>;
export interface AmpAmpTree extends AnyTreeNode {
    readonly type: "amp_amp";
}
export type PipePipe = Terminal<TSKindId.PipePipe>;
export interface PipePipeTree extends AnyTreeNode {
    readonly type: "pipe_pipe";
}
export type Amp2 = Terminal<TSKindId.Amp2>;
export interface Amp2Tree extends AnyTreeNode {
    readonly type: "amp";
}
export type Pipe2 = Terminal<TSKindId.Pipe2>;
export interface Pipe2Tree extends AnyTreeNode {
    readonly type: "pipe";
}
export type Caret = Terminal<TSKindId.Caret>;
export interface CaretTree extends AnyTreeNode {
    readonly type: "caret";
}
export type TokDollar = Terminal<"$">;
export interface TokDollarTree extends AnyTreeNode {
    readonly type: "$";
}
export type RustNode = ArrayExpressionList | ArrayExpressionSemi | AttributedEnumVariant | AttributedFieldDeclaration | AttributedParameter | AttributedTypeParameter | ClosureExpressionBlock | _ClosureExpressionExpr | _DelimTokenTreeBrace | _DelimTokenTreeBracket | _DelimTokenTreeParen | _ExpressionStatementBlockEnding | _ExpressionStatementWithSemi | FieldPatternNamed | _FieldPatternShorthand | _ForeignModItemBody | FunctionTypeFnForm | FunctionTypeTraitForm | _ImplItemBody | LetChain | LineCommentDoc | _MacroDefinitionBrace | _MacroDefinitionBracket | _MacroDefinitionParen | _MatchArmBlockEnding | MatchArmWithComma | _ModItemInline | NonSpecialToken | OrPatternBinary | OrPatternPrefix | _PointerTypeMut | _RangeExpressionBare | RangeExpressionBinary | RangeExpressionPostfix | RangeExpressionPrefix | RangePatternLeftWithRight | RangePatternPrefix | ReferenceExpressionRawMut | StructItemBrace | StructItemTuple | _TokenTreeBrace | _TokenTreeBracket | _TokenTreeParen | _TokenTreePatternBrace | _TokenTreePatternBracket | _TokenTreePatternParen | _VisibilityModifierCrate | VisibilityModifierInPath | VisibilityModifierPub | AbstractType | Arguments | ArrayExpression | ArrayType | AssignmentExpression | AssociatedType | AsyncBlock | Attribute | AttributeItem | AwaitExpression | BaseFieldInitializer | BinaryExpression | Block | BlockComment | BoundedType | BracketedType | BreakExpression | CallExpression | CapturedPattern | ClosureExpressionExpr | ClosureExpression | ClosureParameters | Comment | CompoundAssignmentExpr | ConstBlock | ConstItem | ConstParameter | ContinueExpression | DeclarationList | DelimTokenTreeParen | DelimTokenTreeBracket | DelimTokenTreeBrace | DelimTokenTree | DynamicType | ElseClause | EnumItem | EnumVariant | EnumVariantList | ExpressionStatementWithSemi | ExpressionStatementBlockEnding | ExpressionStatement | ExternCrateDeclaration | ExternModifier | FieldDeclaration | FieldDeclarationList | FieldExpression | FieldInitializer | FieldInitializerList | FieldPatternShorthand | FieldPattern | ForExpression | ForLifetimes | ForeignModItemBody | ForeignModItem | FunctionItem | FunctionModifiers | FunctionSignatureItem | FunctionType | GenBlock | GenericFunction | GenericPattern | GenericType | GenericTypeWithTurbofish | HigherRankedTraitBound | IfExpression | ImplItemBody | ImplItem | IndexExpression | InnerAttributeItem | Label | LastMatchArm | LetCondition | LetDeclaration | Lifetime | LifetimeParameter | LineComment | LoopExpression | MacroDefinitionParen | MacroDefinitionBracket | MacroDefinitionBrace | MacroDefinition | MacroInvocation | MacroRule | MatchArmBlockEnding | MatchArm | MatchBlock | MatchExpression | MatchPattern | ModItemInline | ModItem | MutPattern | NegativeLiteral | OrPattern | OrderedFieldDeclarationList | Parameter | Parameters | ParenthesizedExpression | PointerTypeMut | PointerType | QualifiedType | RangeExpressionBare | RangeExpression | RangePattern | RawStringLiteral | RefPattern | ReferenceExpression | ReferencePattern | ReferenceType | RemovedTraitBound | ReturnExpression | ScopedIdentifier | ScopedTypeIdentifier | ScopedTypeIdentifierInExpressionPosition | ScopedUseList | SelfParameter | ShorthandFieldInitializer | SlicePattern | SourceFile | StaticItem | StringLiteral | StructExpression | StructItem | StructPattern | TokenBindingPattern | TokenRepetition | TokenRepetitionPattern | TokenTreeParen | TokenTreeBracket | TokenTreeBrace | TokenTree | TokenTreePatternParen | TokenTreePatternBracket | TokenTreePatternBrace | TokenTreePattern | TraitBounds | TraitItem | TryBlock | TryExpression | TupleExpression | TuplePattern | TupleStructPattern | TupleType | TypeArguments | TypeBinding | TypeCastExpression | TypeItem | TypeParameter | TypeParameters | UnaryExpression | UnionItem | UnsafeBlock | UseAsClause | UseBounds | UseDeclaration | UseList | UseWildcard | VariadicParameter | VisibilityModifierCrate | VisibilityModifier | WhereClause | WherePredicate | WhileExpression | YieldExpression | VisibilityModifierPubParens;
export interface KindMap {
    '_array_expression_list': ArrayExpressionList;
    '_array_expression_semi': ArrayExpressionSemi;
    '_attributed_enum_variant': AttributedEnumVariant;
    '_attributed_field_declaration': AttributedFieldDeclaration;
    '_attributed_parameter': AttributedParameter;
    '_attributed_type_parameter': AttributedTypeParameter;
    '_closure_expression_block': ClosureExpressionBlock;
    '_closure_expression_expr': _ClosureExpressionExpr;
    '_delim_token_tree_brace': _DelimTokenTreeBrace;
    '_delim_token_tree_bracket': _DelimTokenTreeBracket;
    '_delim_token_tree_paren': _DelimTokenTreeParen;
    '_expression_statement_block_ending': _ExpressionStatementBlockEnding;
    '_expression_statement_with_semi': _ExpressionStatementWithSemi;
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
    '_struct_item_brace': StructItemBrace;
    '_struct_item_tuple': StructItemTuple;
    '_token_tree_brace': _TokenTreeBrace;
    '_token_tree_bracket': _TokenTreeBracket;
    '_token_tree_paren': _TokenTreeParen;
    '_token_tree_pattern_brace': _TokenTreePatternBrace;
    '_token_tree_pattern_bracket': _TokenTreePatternBracket;
    '_token_tree_pattern_paren': _TokenTreePatternParen;
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
    '_visibility_modifier_pub_parens': VisibilityModifierPubParens;
    '__range_expression_binary_operator': RangeExpressionBinaryOperator;
    '_compound_assignment_expr_operator': CompoundAssignmentExprOperator;
    '_field_identifier': FieldIdentifier;
    '_line_comment_content': LineCommentContent;
    '_line_comment_regular_dslash': LineCommentRegularDslash;
    '_primitive_type': PrimitiveType;
    '_reference_expression_raw_const': ReferenceExpressionRawConst;
    '_reserved_identifier': ReservedIdentifier;
    '_token_binding_pattern_type': TokenBindingPatternType;
    '_type_identifier': TypeIdentifier;
    '_unary_expression_operator': UnaryExpressionOperator;
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
    '_line_doc_content': LineDocContent;
    '_error_sentinel': ErrorSentinel;
    'async': Async;
    'unsafe': Unsafe;
    'const': Const;
    'default': Default;
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
        prefix: RangePatternUFormPrefix;
        left_with_right: RangePatternUFormLeftWithRight;
        left_bare: RangePatternUFormLeftBare;
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
        crate: VisibilityModifierUFormCrate;
        pub: VisibilityModifierUFormPub;
        in_path: VisibilityModifierUFormInPath;
    };
}
export interface ArrayExpressionListNs extends NodeNs<ArrayExpressionList, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface ArrayExpressionSemiNs extends NodeNs<ArrayExpressionSemi, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributedEnumVariantNs extends NodeNs<AttributedEnumVariant, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributedFieldDeclarationNs extends NodeNs<AttributedFieldDeclaration, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributedParameterNs extends NodeNs<AttributedParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface AttributedTypeParameterNs extends NodeNs<AttributedTypeParameter, LeafScalarMap, LeafStringMap, NamespaceMap> {
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
export interface VisibilityModifierPubParensNs extends NodeNs<VisibilityModifierPubParens, LeafScalarMap, LeafStringMap, NamespaceMap> {
}
export interface NamespaceMap {
    '_array_expression_list': ArrayExpressionListNs;
    '_array_expression_semi': ArrayExpressionSemiNs;
    '_attributed_enum_variant': AttributedEnumVariantNs;
    '_attributed_field_declaration': AttributedFieldDeclarationNs;
    '_attributed_parameter': AttributedParameterNs;
    '_attributed_type_parameter': AttributedTypeParameterNs;
    '_closure_expression_block': ClosureExpressionBlockNs;
    '_closure_expression_expr': _ClosureExpressionExprNs;
    '_delim_token_tree_brace': _DelimTokenTreeBraceNs;
    '_delim_token_tree_bracket': _DelimTokenTreeBracketNs;
    '_delim_token_tree_paren': _DelimTokenTreeParenNs;
    '_expression_statement_block_ending': _ExpressionStatementBlockEndingNs;
    '_expression_statement_with_semi': _ExpressionStatementWithSemiNs;
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
    '_struct_item_brace': StructItemBraceNs;
    '_struct_item_tuple': StructItemTupleNs;
    '_token_tree_brace': _TokenTreeBraceNs;
    '_token_tree_bracket': _TokenTreeBracketNs;
    '_token_tree_paren': _TokenTreeParenNs;
    '_token_tree_pattern_brace': _TokenTreePatternBraceNs;
    '_token_tree_pattern_bracket': _TokenTreePatternBracketNs;
    '_token_tree_pattern_paren': _TokenTreePatternParenNs;
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
    '_visibility_modifier_pub_parens': VisibilityModifierPubParensNs;
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
export declare namespace AttributedEnumVariant {
    type Config = ConfigFor<'_attributed_enum_variant'>;
    type Fluent = FluentFor<'_attributed_enum_variant'>;
    type Loose = LooseFor<'_attributed_enum_variant'>;
    type Tree = TreeFor<'_attributed_enum_variant'>;
    type Kind = '_attributed_enum_variant';
}
export declare namespace AttributedFieldDeclaration {
    type Config = ConfigFor<'_attributed_field_declaration'>;
    type Fluent = FluentFor<'_attributed_field_declaration'>;
    type Loose = LooseFor<'_attributed_field_declaration'>;
    type Tree = TreeFor<'_attributed_field_declaration'>;
    type Kind = '_attributed_field_declaration';
}
export declare namespace AttributedParameter {
    type Config = ConfigFor<'_attributed_parameter'>;
    type Fluent = FluentFor<'_attributed_parameter'>;
    type Loose = LooseFor<'_attributed_parameter'>;
    type Tree = TreeFor<'_attributed_parameter'>;
    type Kind = '_attributed_parameter';
}
export declare namespace AttributedTypeParameter {
    type Config = ConfigFor<'_attributed_type_parameter'>;
    type Fluent = FluentFor<'_attributed_type_parameter'>;
    type Loose = LooseFor<'_attributed_type_parameter'>;
    type Tree = TreeFor<'_attributed_type_parameter'>;
    type Kind = '_attributed_type_parameter';
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
export declare namespace VisibilityModifierPubParens {
    type Config = ConfigFor<'_visibility_modifier_pub_parens'>;
    type Fluent = FluentFor<'_visibility_modifier_pub_parens'>;
    type Loose = LooseFor<'_visibility_modifier_pub_parens'>;
    type Tree = TreeFor<'_visibility_modifier_pub_parens'>;
    type Kind = '_visibility_modifier_pub_parens';
}
//# sourceMappingURL=types.d.ts.map
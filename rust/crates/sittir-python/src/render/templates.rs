// @generated from packages/python/node-model.json5 and packages/python/templates/*.jinja — do not hand-edit.
// Regenerate via: npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
//
// Per-kind askama template structs + direct render helpers + render_dispatch
// for the python grammar. Every struct in this file is backed by a
// sibling `.jinja` template under `templates/`, copied from
// `packages/python/templates/` at codegen time (spec 012 T030).
//
// Templates and fields are derived from:
//   - template bodies in packages/python/templates/*.jinja
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
    #[serde(rename = "_as_pattern")]
    _AsPattern(_AsPatternTransport),
    #[serde(rename = "_as_pattern_target")]
    AsPatternTarget(AsPatternTargetTransport),
    #[serde(rename = "_assignment_eq")]
    AssignmentEq(AssignmentEqTransport),
    #[serde(rename = "_assignment_type")]
    AssignmentType(AssignmentTypeTransport),
    #[serde(rename = "_assignment_typed")]
    AssignmentTyped(AssignmentTypedTransport),
    #[serde(rename = "_comprehension_clauses")]
    ComprehensionClauses(ComprehensionClausesTransport),
    #[serde(rename = "_format_expression")]
    FormatExpression(FormatExpressionTransport),
    #[serde(rename = "_import_list")]
    ImportList(ImportListTransport),
    #[serde(rename = "_is_not")]
    IsNot(IsNotTransport),
    #[serde(rename = "_key_value_pattern")]
    KeyValuePattern(KeyValuePatternTransport),
    #[serde(rename = "_kw_async_marker")]
    KwAsyncMarker(KwAsyncMarkerTransport),
    #[serde(rename = "_list_pattern")]
    _ListPattern(_ListPatternTransport),
    #[serde(rename = "_match_block")]
    MatchBlock(MatchBlockTransport),
    #[serde(rename = "_match_block_block")]
    MatchBlockBlock(MatchBlockBlockTransport),
    #[serde(rename = "_not_escape_sequence")]
    NotEscapeSequence(NotEscapeSequenceTransport),
    #[serde(rename = "_not_in")]
    NotIn(NotInTransport),
    #[serde(rename = "_simple_pattern_negative")]
    SimplePatternNegative(SimplePatternNegativeTransport),
    #[serde(rename = "_simple_statements")]
    SimpleStatements(SimpleStatementsTransport),
    #[serde(rename = "_suite")]
    Suite(SuiteTransport),
    #[serde(rename = "_tuple_pattern")]
    _TuplePattern(_TuplePatternTransport),
    #[serde(rename = "_with_clause_paren")]
    _WithClauseParen(_WithClauseParenTransport),
    #[serde(rename = "aliased_import")]
    AliasedImport(AliasedImportTransport),
    #[serde(rename = "argument_list")]
    ArgumentList(ArgumentListTransport),
    #[serde(rename = "as_pattern")]
    AsPattern(AsPatternTransport),
    #[serde(rename = "assert_statement")]
    AssertStatement(AssertStatementTransport),
    #[serde(rename = "assignment")]
    Assignment(AssignmentTransport),
    #[serde(rename = "attribute")]
    Attribute(AttributeTransport),
    #[serde(rename = "augmented_assignment")]
    AugmentedAssignment(AugmentedAssignmentTransport),
    #[serde(rename = "await")]
    Await(AwaitTransport),
    #[serde(rename = "binary_operator")]
    BinaryOperator(BinaryOperatorTransport),
    #[serde(rename = "block")]
    Block(BlockTransport),
    #[serde(rename = "boolean_operator")]
    BooleanOperator(BooleanOperatorTransport),
    #[serde(rename = "break_statement")]
    BreakStatement(BreakStatementTransport),
    #[serde(rename = "call")]
    Call(CallTransport),
    #[serde(rename = "case_clause")]
    CaseClause(CaseClauseTransport),
    #[serde(rename = "case_pattern")]
    CasePattern(CasePatternTransport),
    #[serde(rename = "chevron")]
    Chevron(ChevronTransport),
    #[serde(rename = "class_definition")]
    ClassDefinition(ClassDefinitionTransport),
    #[serde(rename = "class_pattern")]
    ClassPattern(ClassPatternTransport),
    #[serde(rename = "comment")]
    Comment(CommentTransport),
    #[serde(rename = "comparison_operator")]
    ComparisonOperator(ComparisonOperatorTransport),
    #[serde(rename = "complex_pattern")]
    ComplexPattern(ComplexPatternTransport),
    #[serde(rename = "concatenated_string")]
    ConcatenatedString(ConcatenatedStringTransport),
    #[serde(rename = "conditional_expression")]
    ConditionalExpression(ConditionalExpressionTransport),
    #[serde(rename = "constrained_type")]
    ConstrainedType(ConstrainedTypeTransport),
    #[serde(rename = "continue_statement")]
    ContinueStatement(ContinueStatementTransport),
    #[serde(rename = "decorated_definition")]
    DecoratedDefinition(DecoratedDefinitionTransport),
    #[serde(rename = "decorator")]
    Decorator(DecoratorTransport),
    #[serde(rename = "default_parameter")]
    DefaultParameter(DefaultParameterTransport),
    #[serde(rename = "delete_statement")]
    DeleteStatement(DeleteStatementTransport),
    #[serde(rename = "dict_pattern")]
    DictPattern(DictPatternTransport),
    #[serde(rename = "dictionary")]
    Dictionary(DictionaryTransport),
    #[serde(rename = "dictionary_comprehension")]
    DictionaryComprehension(DictionaryComprehensionTransport),
    #[serde(rename = "dictionary_splat")]
    DictionarySplat(DictionarySplatTransport),
    #[serde(rename = "dictionary_splat_pattern")]
    DictionarySplatPattern(DictionarySplatPatternTransport),
    #[serde(rename = "dotted_name")]
    DottedName(DottedNameTransport),
    #[serde(rename = "elif_clause")]
    ElifClause(ElifClauseTransport),
    #[serde(rename = "ellipsis")]
    Ellipsis2(Ellipsis2Transport),
    #[serde(rename = "else_clause")]
    ElseClause(ElseClauseTransport),
    #[serde(rename = "escape_sequence")]
    EscapeSequence(EscapeSequenceTransport),
    #[serde(rename = "except_clause")]
    ExceptClause(ExceptClauseTransport),
    #[serde(rename = "exec_statement")]
    ExecStatement(ExecStatementTransport),
    #[serde(rename = "expression_list")]
    ExpressionList(ExpressionListTransport),
    #[serde(rename = "expression_statement_tuple")]
    ExpressionStatementTuple(ExpressionStatementTupleTransport),
    #[serde(rename = "expression_statement")]
    ExpressionStatement(ExpressionStatementTransport),
    #[serde(rename = "false")]
    False(FalseTransport),
    #[serde(rename = "finally_clause")]
    FinallyClause(FinallyClauseTransport),
    #[serde(rename = "float")]
    Float(FloatTransport),
    #[serde(rename = "for_in_clause")]
    ForInClause(ForInClauseTransport),
    #[serde(rename = "for_statement")]
    ForStatement(ForStatementTransport),
    #[serde(rename = "format_specifier")]
    FormatSpecifier(FormatSpecifierTransport),
    #[serde(rename = "function_definition")]
    FunctionDefinition(FunctionDefinitionTransport),
    #[serde(rename = "future_import_statement")]
    FutureImportStatement(FutureImportStatementTransport),
    #[serde(rename = "generator_expression")]
    GeneratorExpression(GeneratorExpressionTransport),
    #[serde(rename = "generic_type")]
    GenericType(GenericTypeTransport),
    #[serde(rename = "global_statement")]
    GlobalStatement(GlobalStatementTransport),
    #[serde(rename = "identifier")]
    Identifier(IdentifierTransport),
    #[serde(rename = "if_clause")]
    IfClause(IfClauseTransport),
    #[serde(rename = "if_statement")]
    IfStatement(IfStatementTransport),
    #[serde(rename = "import_from_statement")]
    ImportFromStatement(ImportFromStatementTransport),
    #[serde(rename = "import_prefix")]
    ImportPrefix(ImportPrefixTransport),
    #[serde(rename = "import_statement")]
    ImportStatement(ImportStatementTransport),
    #[serde(rename = "integer")]
    Integer(IntegerTransport),
    #[serde(rename = "interpolation")]
    Interpolation(InterpolationTransport),
    #[serde(rename = "keyword_argument")]
    KeywordArgument(KeywordArgumentTransport),
    #[serde(rename = "keyword_pattern")]
    KeywordPattern(KeywordPatternTransport),
    #[serde(rename = "keyword_separator")]
    KeywordSeparator(KeywordSeparatorTransport),
    #[serde(rename = "lambda")]
    Lambda(LambdaTransport),
    #[serde(rename = "lambda_parameters")]
    LambdaParameters(LambdaParametersTransport),
    #[serde(rename = "lambda_within_for_in_clause")]
    LambdaWithinForInClause(LambdaWithinForInClauseTransport),
    #[serde(rename = "line_continuation")]
    LineContinuation(LineContinuationTransport),
    #[serde(rename = "list")]
    List(ListTransport),
    #[serde(rename = "list_comprehension")]
    ListComprehension(ListComprehensionTransport),
    #[serde(rename = "list_pattern")]
    ListPattern(ListPatternTransport),
    #[serde(rename = "list_splat")]
    ListSplat(ListSplatTransport),
    #[serde(rename = "list_splat_pattern")]
    ListSplatPattern(ListSplatPatternTransport),
    #[serde(rename = "match_statement")]
    MatchStatement(MatchStatementTransport),
    #[serde(rename = "member_type")]
    MemberType(MemberTypeTransport),
    #[serde(rename = "module")]
    Module(ModuleTransport),
    #[serde(rename = "named_expression")]
    NamedExpression(NamedExpressionTransport),
    #[serde(rename = "none")]
    None(NoneTransport),
    #[serde(rename = "nonlocal_statement")]
    NonlocalStatement(NonlocalStatementTransport),
    #[serde(rename = "not_operator")]
    NotOperator(NotOperatorTransport),
    #[serde(rename = "pair")]
    Pair(PairTransport),
    #[serde(rename = "parameters")]
    Parameters(ParametersTransport),
    #[serde(rename = "parenthesized_expression")]
    ParenthesizedExpression(ParenthesizedExpressionTransport),
    #[serde(rename = "parenthesized_list_splat")]
    ParenthesizedListSplat(ParenthesizedListSplatTransport),
    #[serde(rename = "pass_statement")]
    PassStatement(PassStatementTransport),
    #[serde(rename = "pattern_list")]
    PatternList(PatternListTransport),
    #[serde(rename = "positional_separator")]
    PositionalSeparator(PositionalSeparatorTransport),
    #[serde(rename = "print_statement")]
    PrintStatement(PrintStatementTransport),
    #[serde(rename = "raise_statement")]
    RaiseStatement(RaiseStatementTransport),
    #[serde(rename = "relative_import")]
    RelativeImport(RelativeImportTransport),
    #[serde(rename = "return_statement")]
    ReturnStatement(ReturnStatementTransport),
    #[serde(rename = "set")]
    Set(SetTransport),
    #[serde(rename = "set_comprehension")]
    SetComprehension(SetComprehensionTransport),
    #[serde(rename = "slice")]
    Slice(SliceTransport),
    #[serde(rename = "splat_pattern")]
    SplatPattern(SplatPatternTransport),
    #[serde(rename = "splat_type")]
    SplatType(SplatTypeTransport),
    #[serde(rename = "string")]
    String(StringTransport),
    #[serde(rename = "string_content")]
    StringContent(StringContentTransport),
    #[serde(rename = "subscript")]
    Subscript(SubscriptTransport),
    #[serde(rename = "true")]
    True(TrueTransport),
    #[serde(rename = "try_statement")]
    TryStatement(TryStatementTransport),
    #[serde(rename = "tuple")]
    Tuple(TupleTransport),
    #[serde(rename = "tuple_pattern")]
    TuplePattern(TuplePatternTransport),
    #[serde(rename = "type")]
    Type(TypeTransport),
    #[serde(rename = "type_alias_statement")]
    TypeAliasStatement(TypeAliasStatementTransport),
    #[serde(rename = "type_conversion")]
    TypeConversion(TypeConversionTransport),
    #[serde(rename = "type_parameter")]
    TypeParameter(TypeParameterTransport),
    #[serde(rename = "typed_default_parameter")]
    TypedDefaultParameter(TypedDefaultParameterTransport),
    #[serde(rename = "typed_parameter")]
    TypedParameter(TypedParameterTransport),
    #[serde(rename = "unary_operator")]
    UnaryOperator(UnaryOperatorTransport),
    #[serde(rename = "union_pattern")]
    UnionPattern(UnionPatternTransport),
    #[serde(rename = "union_type")]
    UnionType(UnionTypeTransport),
    #[serde(rename = "while_statement")]
    WhileStatement(WhileStatementTransport),
    #[serde(rename = "wildcard_import")]
    WildcardImport(WildcardImportTransport),
    #[serde(rename = "with_clause_bare")]
    WithClauseBare(WithClauseBareTransport),
    #[serde(rename = "with_clause_paren")]
    WithClauseParen(WithClauseParenTransport),
    #[serde(rename = "with_clause")]
    WithClause(WithClauseTransport),
    #[serde(rename = "with_item")]
    WithItem(WithItemTransport),
    #[serde(rename = "with_statement")]
    WithStatement(WithStatementTransport),
    #[serde(rename = "yield")]
    Yield(YieldTransport),
    #[serde(rename = "_newline")]
    Newline(NewlineTransport),
    #[serde(rename = "_indent")]
    Indent(IndentTransport),
    #[serde(rename = "_dedent")]
    Dedent(DedentTransport),
    #[serde(rename = "string_start")]
    StringStart(StringStartTransport),
    #[serde(rename = "_string_content")]
    _StringContent(_StringContentTransport),
    #[serde(rename = "escape_interpolation")]
    EscapeInterpolation(EscapeInterpolationTransport),
    #[serde(rename = "string_end")]
    StringEnd(StringEndTransport),
    #[serde(rename = "]")]
    CloseBracket(CloseBracketTransport),
    #[serde(rename = ")")]
    CloseParen(CloseParenTransport),
    #[serde(rename = "}")]
    CloseBrace(CloseBraceTransport),
    #[serde(rename = "except")]
    Except(ExceptTransport),
    #[serde(rename = "as")]
    As(AsTransport),
    #[serde(rename = "=")]
    Eq(EqTransport),
    #[serde(rename = ":")]
    Colon(ColonTransport),
    #[serde(rename = "async")]
    Async(AsyncTransport),
    #[serde(rename = "[")]
    Bracket(BracketTransport),
    #[serde(rename = "\\")]
    TokBs(TokBsTransport),
    #[serde(rename = "-")]
    Minus(MinusTransport),
    #[serde(rename = "(")]
    Paren(ParenTransport),
    #[serde(rename = ",")]
    Comma(CommaTransport),
    #[serde(rename = "assert")]
    Assert(AssertTransport),
    #[serde(rename = ".")]
    Dot(DotTransport),
    #[serde(rename = "+")]
    Plus(PlusTransport),
    #[serde(rename = "*")]
    Star(StarTransport),
    #[serde(rename = "@")]
    At(AtTransport),
    #[serde(rename = "/")]
    Slash(SlashTransport),
    #[serde(rename = "%")]
    Percent(PercentTransport),
    #[serde(rename = "//")]
    Slashslash(SlashslashTransport),
    #[serde(rename = "**")]
    Starstar(StarstarTransport),
    #[serde(rename = "|")]
    Pipe(PipeTransport),
    #[serde(rename = "&")]
    Amp(AmpTransport),
    #[serde(rename = "^")]
    Caret(CaretTransport),
    #[serde(rename = "<<")]
    Shl(ShlTransport),
    #[serde(rename = ">>")]
    Shr(ShrTransport),
    #[serde(rename = "and")]
    And(AndTransport),
    #[serde(rename = "or")]
    Or(OrTransport),
    #[serde(rename = "break")]
    Break(BreakTransport),
    #[serde(rename = "case")]
    Case(CaseTransport),
    #[serde(rename = "class")]
    Class(ClassTransport),
    #[serde(rename = "if")]
    If(IfTransport),
    #[serde(rename = "else")]
    Else(ElseTransport),
    #[serde(rename = "continue")]
    Continue(ContinueTransport),
    #[serde(rename = "del")]
    Del(DelTransport),
    #[serde(rename = "{")]
    Brace(BraceTransport),
    #[serde(rename = "elif")]
    Elif(ElifTransport),
    #[serde(rename = "...")]
    Ellipsis(EllipsisTransport),
    #[serde(rename = "exec")]
    Exec(ExecTransport),
    #[serde(rename = "in")]
    In(InTransport),
    #[serde(rename = "False")]
    False2(False2Transport),
    #[serde(rename = "finally")]
    Finally(FinallyTransport),
    #[serde(rename = "for")]
    For(ForTransport),
    #[serde(rename = "def")]
    Def(DefTransport),
    #[serde(rename = "->")]
    Arrow(ArrowTransport),
    #[serde(rename = "from")]
    From(FromTransport),
    #[serde(rename = "__future__")]
    FutureU(FutureUTransport),
    #[serde(rename = "import")]
    Import(ImportTransport),
    #[serde(rename = "global")]
    Global(GlobalTransport),
    #[serde(rename = "match")]
    Match(MatchTransport),
    #[serde(rename = ":=")]
    Coloneq(ColoneqTransport),
    #[serde(rename = "None")]
    None2(None2Transport),
    #[serde(rename = "nonlocal")]
    Nonlocal(NonlocalTransport),
    #[serde(rename = "not")]
    Not(NotTransport),
    #[serde(rename = "pass")]
    Pass(PassTransport),
    #[serde(rename = "print")]
    Print(PrintTransport),
    #[serde(rename = "raise")]
    Raise(RaiseTransport),
    #[serde(rename = "return")]
    Return(ReturnTransport),
    #[serde(rename = "_")]
    Anonymous(AnonymousTransport),
    #[serde(rename = "True")]
    True2(True2Transport),
    #[serde(rename = "try")]
    Try(TryTransport),
    #[serde(rename = "while")]
    While(WhileTransport),
    #[serde(rename = "with")]
    With(WithTransport),
    #[serde(rename = "+=")]
    Literal0_2b_3d(LiteralTransport),
    #[serde(rename = "-=")]
    Literal1_2d_3d(LiteralTransport),
    #[serde(rename = "*=")]
    Literal2_2a_3d(LiteralTransport),
    #[serde(rename = "/=")]
    Literal3_2f_3d(LiteralTransport),
    #[serde(rename = "@=")]
    Literal4_40_3d(LiteralTransport),
    #[serde(rename = "//=")]
    Literal5_2f_2f_3d(LiteralTransport),
    #[serde(rename = "%=")]
    Literal6_25_3d(LiteralTransport),
    #[serde(rename = "**=")]
    Literal7_2a_2a_3d(LiteralTransport),
    #[serde(rename = ">>=")]
    Literal8_3e_3e_3d(LiteralTransport),
    #[serde(rename = "<<=")]
    Literal9_3c_3c_3d(LiteralTransport),
    #[serde(rename = "&=")]
    Literal10_26_3d(LiteralTransport),
    #[serde(rename = "^=")]
    Literal11_5e_3d(LiteralTransport),
    #[serde(rename = "|=")]
    Literal12_7c_3d(LiteralTransport),
    #[serde(rename = "<")]
    Literal13_3c(LiteralTransport),
    #[serde(rename = "<=")]
    Literal14_3c_3d(LiteralTransport),
    #[serde(rename = "==")]
    Literal15_3d_3d(LiteralTransport),
    #[serde(rename = "!=")]
    Literal16_21_3d(LiteralTransport),
    #[serde(rename = ">=")]
    Literal17_3e_3d(LiteralTransport),
    #[serde(rename = ">")]
    Literal18_3e(LiteralTransport),
    #[serde(rename = "<>")]
    Literal19_3c_3e(LiteralTransport),
    #[serde(rename = "not in")]
    Literal20_6e_6f_74_20_69_6e(LiteralTransport),
    #[serde(rename = "is")]
    Literal21_69_73(LiteralTransport),
    #[serde(rename = "is not")]
    Literal22_69_73_20_6e_6f_74(LiteralTransport),
    #[serde(rename = "~")]
    Literal23_7e(LiteralTransport),
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
pub struct _AsPatternTransport {
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
pub struct AsPatternTargetTransport {
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
pub struct AssignmentEqTransport {
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
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentTypeTransport {
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
pub struct AssignmentTypedTransport {
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
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ComprehensionClausesTransport {
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
pub struct FormatExpressionTransport {
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
pub struct ImportListTransport {
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
    pub name: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IsNotTransport {
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
pub struct KeyValuePatternTransport {
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
pub struct _ListPatternTransport {
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
pub struct MatchBlockTransport {
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
pub struct MatchBlockBlockTransport {
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
    pub alternative: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NotEscapeSequenceTransport {
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
pub struct NotInTransport {
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
pub struct SimplePatternNegativeTransport {
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
pub struct SimpleStatementsTransport {
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
pub struct SuiteTransport {
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
pub struct _TuplePatternTransport {
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
pub struct _WithClauseParenTransport {
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
pub struct AliasedImportTransport {
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
pub struct ArgumentListTransport {
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
pub struct AsPatternTransport {
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
    pub alias: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssertStatementTransport {
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
pub enum AssignmentTransport {
    #[serde(rename = "eq")]
    AssignmentUFormEq(AssignmentUFormEqTransport),
    #[serde(rename = "type")]
    AssignmentUFormType(AssignmentUFormTypeTransport),
    #[serde(rename = "typed")]
    AssignmentUFormTyped(AssignmentUFormTypedTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentUFormEqTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentUFormTypeTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AssignmentUFormTypedTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AttributeTransport {
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
    pub attribute: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct AugmentedAssignmentTransport {
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
pub struct AwaitTransport {
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
    pub primary_expression: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct BinaryOperatorTransport {
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
pub struct BlockTransport {
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
pub struct BooleanOperatorTransport {
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
    #[serde(rename = "$span", default)]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[serde(rename = "$nodeId", default)]
    pub transport_node_id: Option<u64>,
    #[serde(rename = "$text")]
    pub text: String,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CallTransport {
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
pub struct CaseClauseTransport {
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
    pub guard: Option<Box<AnyTransport>>,
    pub consequence: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct CasePatternTransport {
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
pub struct ChevronTransport {
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
pub struct ClassDefinitionTransport {
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
    pub superclasses: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ClassPatternTransport {
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
    pub dotted_name: Box<AnyTransport>,
    pub arguments: Vec<Box<AnyTransport>>,
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
pub struct ComparisonOperatorTransport {
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
    pub operators: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ComplexPatternTransport {
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
    pub real: Option<Box<AnyTransport>>,
    pub imaginary: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConcatenatedStringTransport {
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
pub struct ConditionalExpressionTransport {
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
    pub alternative: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ConstrainedTypeTransport {
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
    pub base_type: Box<AnyTransport>,
    pub constraint: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ContinueStatementTransport {
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
pub struct DecoratedDefinitionTransport {
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
    pub definition: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
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
    pub expression: Box<AnyTransport>,
    #[serde(default)]
    pub newline: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DefaultParameterTransport {
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
pub struct DeleteStatementTransport {
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
pub struct DictPatternTransport {
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
pub struct DictionaryTransport {
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
pub struct DictionaryComprehensionTransport {
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
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct DictionarySplatTransport {
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
pub struct DictionarySplatPatternTransport {
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
pub struct DottedNameTransport {
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
pub struct ElifClauseTransport {
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
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct Ellipsis2Transport {
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
pub struct ExceptClauseTransport {
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
    pub value: Option<Vec<Box<AnyTransport>>>,
    #[serde(default)]
    pub alias: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExecStatementTransport {
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
    pub code: Box<AnyTransport>,
    #[serde(default)]
    pub in_clause: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExpressionListTransport {
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
pub struct ExpressionStatementTupleTransport {
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
pub enum ExpressionStatementTransport {
    #[serde(rename = "tuple")]
    ExpressionStatementUFormTuple(ExpressionStatementUFormTupleTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ExpressionStatementUFormTupleTransport {
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
    pub block: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FloatTransport {
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
pub struct ForInClauseTransport {
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
    pub left: Box<AnyTransport>,
    pub right: Vec<Box<AnyTransport>>,
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
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
    #[serde(default)]
    pub alternative: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FormatSpecifierTransport {
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
pub struct FunctionDefinitionTransport {
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
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct FutureImportStatementTransport {
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
    pub name: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GeneratorExpressionTransport {
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
    pub children: Vec<Box<AnyTransport>>,
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
    pub identifier: Box<AnyTransport>,
    pub type_parameter: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct GlobalStatementTransport {
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
pub struct IfClauseTransport {
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
    pub alternative: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportFromStatementTransport {
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
    pub module_name: Box<AnyTransport>,
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ImportPrefixTransport {
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
    pub name: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct IntegerTransport {
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
pub struct InterpolationTransport {
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
    #[serde(default)]
    pub type_conversion: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub format_specifier: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KeywordArgumentTransport {
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
pub struct KeywordPatternTransport {
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
    pub simple_pattern: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct KeywordSeparatorTransport {
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
pub struct LambdaTransport {
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
    pub parameters: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LambdaParametersTransport {
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
pub struct LambdaWithinForInClauseTransport {
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
    pub parameters: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct LineContinuationTransport {
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
pub struct ListTransport {
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
pub struct ListComprehensionTransport {
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
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct ListPatternTransport {
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
pub struct ListSplatTransport {
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
pub struct ListSplatPatternTransport {
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
pub struct MatchStatementTransport {
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
    pub subject: Vec<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct MemberTypeTransport {
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
    pub base_type: Box<AnyTransport>,
    pub identifier: Box<AnyTransport>,
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct NamedExpressionTransport {
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
pub struct NoneTransport {
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
pub struct NonlocalStatementTransport {
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
pub struct NotOperatorTransport {
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
pub struct ParametersTransport {
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
pub struct ParenthesizedExpressionTransport {
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
pub struct ParenthesizedListSplatTransport {
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
pub struct PassStatementTransport {
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
pub struct PatternListTransport {
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
pub struct PositionalSeparatorTransport {
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
pub struct PrintStatementTransport {
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
    pub argument: Vec<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RaiseStatementTransport {
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
    pub cause: Option<Box<AnyTransport>>,
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct RelativeImportTransport {
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
    pub import_prefix: Box<AnyTransport>,
    #[serde(default)]
    pub dotted_name: Option<Box<AnyTransport>>,
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
    #[serde(rename = "$children")]
    #[serde(default)]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SetTransport {
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
pub struct SetComprehensionTransport {
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
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SliceTransport {
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
    pub start: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub stop: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub step: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SplatPatternTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct SplatTypeTransport {
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
pub struct StringTransport {
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
    pub string_start: Box<AnyTransport>,
    pub content: Vec<Box<AnyTransport>>,
    pub string_end: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct StringContentTransport {
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
pub struct SubscriptTransport {
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
    pub subscript: Vec<Box<AnyTransport>>,
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
    pub except_clauses: Vec<Box<AnyTransport>>,
    #[serde(default)]
    pub else_clause: Option<Box<AnyTransport>>,
    #[serde(default)]
    pub finally_clause: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TupleTransport {
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
pub struct TuplePatternTransport {
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
pub struct TypeTransport {
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
pub struct TypeAliasStatementTransport {
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
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypeConversionTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypedDefaultParameterTransport {
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
    pub value: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct TypedParameterTransport {
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
    #[serde(rename = "$children")]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct UnaryOperatorTransport {
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
pub struct UnionPatternTransport {
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
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
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
    #[serde(default)]
    pub alternative: Option<Box<AnyTransport>>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WildcardImportTransport {
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
pub struct WithClauseBareTransport {
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
pub struct WithClauseParenTransport {
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
pub enum WithClauseTransport {
    #[serde(rename = "bare")]
    WithClauseUFormBare(WithClauseUFormBareTransport),
    #[serde(rename = "paren")]
    WithClauseUFormParen(WithClauseUFormParenTransport),
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct WithClauseUFormBareTransport {
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
pub struct WithClauseUFormParenTransport {
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
pub struct WithItemTransport {
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
    #[serde(default)]
    pub async_marker: Option<Box<AnyTransport>>,
    pub with_clause: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[derive(Debug, Clone, ::serde::Deserialize)]
pub struct YieldTransport {
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
pub struct NewlineTransport {
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
pub struct IndentTransport {
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
pub struct DedentTransport {
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
pub struct StringStartTransport {
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
pub struct _StringContentTransport {
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
pub struct EscapeInterpolationTransport {
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
pub struct StringEndTransport {
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
pub struct ExceptTransport {
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
pub struct TokBsTransport {
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
pub struct AssertTransport {
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
pub struct SlashslashTransport {
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
pub struct AndTransport {
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
pub struct OrTransport {
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
pub struct ClassTransport {
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
pub struct DelTransport {
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
pub struct ElifTransport {
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
pub struct ExecTransport {
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
pub struct False2Transport {
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
pub struct DefTransport {
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
pub struct ArrowTransport {
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
pub struct FutureUTransport {
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
pub struct MatchTransport {
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
pub struct ColoneqTransport {
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
pub struct None2Transport {
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
pub struct NonlocalTransport {
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
pub struct NotTransport {
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
pub struct PassTransport {
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
pub struct PrintTransport {
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
pub struct RaiseTransport {
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
pub struct AnonymousTransport {
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
pub struct True2Transport {
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
        AnyTransport::_AsPattern(data) => transport_to_node__as_pattern(data),
        AnyTransport::AsPatternTarget(data) => transport_to_node_as_pattern_target(data),
        AnyTransport::AssignmentEq(data) => transport_to_node_assignment_eq(data),
        AnyTransport::AssignmentType(data) => transport_to_node_assignment_type(data),
        AnyTransport::AssignmentTyped(data) => transport_to_node_assignment_typed(data),
        AnyTransport::ComprehensionClauses(data) => transport_to_node_comprehension_clauses(data),
        AnyTransport::FormatExpression(data) => transport_to_node_format_expression(data),
        AnyTransport::ImportList(data) => transport_to_node_import_list(data),
        AnyTransport::IsNot(data) => transport_to_node_is_not(data),
        AnyTransport::KeyValuePattern(data) => transport_to_node_key_value_pattern(data),
        AnyTransport::KwAsyncMarker(data) => transport_to_node_kw_async_marker(data),
        AnyTransport::_ListPattern(data) => transport_to_node__list_pattern(data),
        AnyTransport::MatchBlock(data) => transport_to_node_match_block(data),
        AnyTransport::MatchBlockBlock(data) => transport_to_node_match_block_block(data),
        AnyTransport::NotEscapeSequence(data) => transport_to_node_not_escape_sequence(data),
        AnyTransport::NotIn(data) => transport_to_node_not_in(data),
        AnyTransport::SimplePatternNegative(data) => transport_to_node_simple_pattern_negative(data),
        AnyTransport::SimpleStatements(data) => transport_to_node_simple_statements(data),
        AnyTransport::Suite(data) => transport_to_node_suite(data),
        AnyTransport::_TuplePattern(data) => transport_to_node__tuple_pattern(data),
        AnyTransport::_WithClauseParen(data) => transport_to_node__with_clause_paren(data),
        AnyTransport::AliasedImport(data) => transport_to_node_aliased_import(data),
        AnyTransport::ArgumentList(data) => transport_to_node_argument_list(data),
        AnyTransport::AsPattern(data) => transport_to_node_as_pattern(data),
        AnyTransport::AssertStatement(data) => transport_to_node_assert_statement(data),
        AnyTransport::Assignment(data) => transport_to_node_assignment(data),
        AnyTransport::Attribute(data) => transport_to_node_attribute(data),
        AnyTransport::AugmentedAssignment(data) => transport_to_node_augmented_assignment(data),
        AnyTransport::Await(data) => transport_to_node_await(data),
        AnyTransport::BinaryOperator(data) => transport_to_node_binary_operator(data),
        AnyTransport::Block(data) => transport_to_node_block(data),
        AnyTransport::BooleanOperator(data) => transport_to_node_boolean_operator(data),
        AnyTransport::BreakStatement(data) => transport_to_node_break_statement(data),
        AnyTransport::Call(data) => transport_to_node_call(data),
        AnyTransport::CaseClause(data) => transport_to_node_case_clause(data),
        AnyTransport::CasePattern(data) => transport_to_node_case_pattern(data),
        AnyTransport::Chevron(data) => transport_to_node_chevron(data),
        AnyTransport::ClassDefinition(data) => transport_to_node_class_definition(data),
        AnyTransport::ClassPattern(data) => transport_to_node_class_pattern(data),
        AnyTransport::Comment(data) => transport_to_node_comment(data),
        AnyTransport::ComparisonOperator(data) => transport_to_node_comparison_operator(data),
        AnyTransport::ComplexPattern(data) => transport_to_node_complex_pattern(data),
        AnyTransport::ConcatenatedString(data) => transport_to_node_concatenated_string(data),
        AnyTransport::ConditionalExpression(data) => transport_to_node_conditional_expression(data),
        AnyTransport::ConstrainedType(data) => transport_to_node_constrained_type(data),
        AnyTransport::ContinueStatement(data) => transport_to_node_continue_statement(data),
        AnyTransport::DecoratedDefinition(data) => transport_to_node_decorated_definition(data),
        AnyTransport::Decorator(data) => transport_to_node_decorator(data),
        AnyTransport::DefaultParameter(data) => transport_to_node_default_parameter(data),
        AnyTransport::DeleteStatement(data) => transport_to_node_delete_statement(data),
        AnyTransport::DictPattern(data) => transport_to_node_dict_pattern(data),
        AnyTransport::Dictionary(data) => transport_to_node_dictionary(data),
        AnyTransport::DictionaryComprehension(data) => transport_to_node_dictionary_comprehension(data),
        AnyTransport::DictionarySplat(data) => transport_to_node_dictionary_splat(data),
        AnyTransport::DictionarySplatPattern(data) => transport_to_node_dictionary_splat_pattern(data),
        AnyTransport::DottedName(data) => transport_to_node_dotted_name(data),
        AnyTransport::ElifClause(data) => transport_to_node_elif_clause(data),
        AnyTransport::Ellipsis2(data) => transport_to_node_ellipsis2(data),
        AnyTransport::ElseClause(data) => transport_to_node_else_clause(data),
        AnyTransport::EscapeSequence(data) => transport_to_node_escape_sequence(data),
        AnyTransport::ExceptClause(data) => transport_to_node_except_clause(data),
        AnyTransport::ExecStatement(data) => transport_to_node_exec_statement(data),
        AnyTransport::ExpressionList(data) => transport_to_node_expression_list(data),
        AnyTransport::ExpressionStatementTuple(data) => transport_to_node_expression_statement_tuple(data),
        AnyTransport::ExpressionStatement(data) => transport_to_node_expression_statement(data),
        AnyTransport::False(data) => transport_to_node_false(data),
        AnyTransport::FinallyClause(data) => transport_to_node_finally_clause(data),
        AnyTransport::Float(data) => transport_to_node_float(data),
        AnyTransport::ForInClause(data) => transport_to_node_for_in_clause(data),
        AnyTransport::ForStatement(data) => transport_to_node_for_statement(data),
        AnyTransport::FormatSpecifier(data) => transport_to_node_format_specifier(data),
        AnyTransport::FunctionDefinition(data) => transport_to_node_function_definition(data),
        AnyTransport::FutureImportStatement(data) => transport_to_node_future_import_statement(data),
        AnyTransport::GeneratorExpression(data) => transport_to_node_generator_expression(data),
        AnyTransport::GenericType(data) => transport_to_node_generic_type(data),
        AnyTransport::GlobalStatement(data) => transport_to_node_global_statement(data),
        AnyTransport::Identifier(data) => transport_to_node_identifier(data),
        AnyTransport::IfClause(data) => transport_to_node_if_clause(data),
        AnyTransport::IfStatement(data) => transport_to_node_if_statement(data),
        AnyTransport::ImportFromStatement(data) => transport_to_node_import_from_statement(data),
        AnyTransport::ImportPrefix(data) => transport_to_node_import_prefix(data),
        AnyTransport::ImportStatement(data) => transport_to_node_import_statement(data),
        AnyTransport::Integer(data) => transport_to_node_integer(data),
        AnyTransport::Interpolation(data) => transport_to_node_interpolation(data),
        AnyTransport::KeywordArgument(data) => transport_to_node_keyword_argument(data),
        AnyTransport::KeywordPattern(data) => transport_to_node_keyword_pattern(data),
        AnyTransport::KeywordSeparator(data) => transport_to_node_keyword_separator(data),
        AnyTransport::Lambda(data) => transport_to_node_lambda(data),
        AnyTransport::LambdaParameters(data) => transport_to_node_lambda_parameters(data),
        AnyTransport::LambdaWithinForInClause(data) => transport_to_node_lambda_within_for_in_clause(data),
        AnyTransport::LineContinuation(data) => transport_to_node_line_continuation(data),
        AnyTransport::List(data) => transport_to_node_list(data),
        AnyTransport::ListComprehension(data) => transport_to_node_list_comprehension(data),
        AnyTransport::ListPattern(data) => transport_to_node_list_pattern(data),
        AnyTransport::ListSplat(data) => transport_to_node_list_splat(data),
        AnyTransport::ListSplatPattern(data) => transport_to_node_list_splat_pattern(data),
        AnyTransport::MatchStatement(data) => transport_to_node_match_statement(data),
        AnyTransport::MemberType(data) => transport_to_node_member_type(data),
        AnyTransport::Module(data) => transport_to_node_module(data),
        AnyTransport::NamedExpression(data) => transport_to_node_named_expression(data),
        AnyTransport::None(data) => transport_to_node_none(data),
        AnyTransport::NonlocalStatement(data) => transport_to_node_nonlocal_statement(data),
        AnyTransport::NotOperator(data) => transport_to_node_not_operator(data),
        AnyTransport::Pair(data) => transport_to_node_pair(data),
        AnyTransport::Parameters(data) => transport_to_node_parameters(data),
        AnyTransport::ParenthesizedExpression(data) => transport_to_node_parenthesized_expression(data),
        AnyTransport::ParenthesizedListSplat(data) => transport_to_node_parenthesized_list_splat(data),
        AnyTransport::PassStatement(data) => transport_to_node_pass_statement(data),
        AnyTransport::PatternList(data) => transport_to_node_pattern_list(data),
        AnyTransport::PositionalSeparator(data) => transport_to_node_positional_separator(data),
        AnyTransport::PrintStatement(data) => transport_to_node_print_statement(data),
        AnyTransport::RaiseStatement(data) => transport_to_node_raise_statement(data),
        AnyTransport::RelativeImport(data) => transport_to_node_relative_import(data),
        AnyTransport::ReturnStatement(data) => transport_to_node_return_statement(data),
        AnyTransport::Set(data) => transport_to_node_set(data),
        AnyTransport::SetComprehension(data) => transport_to_node_set_comprehension(data),
        AnyTransport::Slice(data) => transport_to_node_slice(data),
        AnyTransport::SplatPattern(data) => transport_to_node_splat_pattern(data),
        AnyTransport::SplatType(data) => transport_to_node_splat_type(data),
        AnyTransport::String(data) => transport_to_node_string(data),
        AnyTransport::StringContent(data) => transport_to_node_string_content(data),
        AnyTransport::Subscript(data) => transport_to_node_subscript(data),
        AnyTransport::True(data) => transport_to_node_true(data),
        AnyTransport::TryStatement(data) => transport_to_node_try_statement(data),
        AnyTransport::Tuple(data) => transport_to_node_tuple(data),
        AnyTransport::TuplePattern(data) => transport_to_node_tuple_pattern(data),
        AnyTransport::Type(data) => transport_to_node_type(data),
        AnyTransport::TypeAliasStatement(data) => transport_to_node_type_alias_statement(data),
        AnyTransport::TypeConversion(data) => transport_to_node_type_conversion(data),
        AnyTransport::TypeParameter(data) => transport_to_node_type_parameter(data),
        AnyTransport::TypedDefaultParameter(data) => transport_to_node_typed_default_parameter(data),
        AnyTransport::TypedParameter(data) => transport_to_node_typed_parameter(data),
        AnyTransport::UnaryOperator(data) => transport_to_node_unary_operator(data),
        AnyTransport::UnionPattern(data) => transport_to_node_union_pattern(data),
        AnyTransport::UnionType(data) => transport_to_node_union_type(data),
        AnyTransport::WhileStatement(data) => transport_to_node_while_statement(data),
        AnyTransport::WildcardImport(data) => transport_to_node_wildcard_import(data),
        AnyTransport::WithClauseBare(data) => transport_to_node_with_clause_bare(data),
        AnyTransport::WithClauseParen(data) => transport_to_node_with_clause_paren(data),
        AnyTransport::WithClause(data) => transport_to_node_with_clause(data),
        AnyTransport::WithItem(data) => transport_to_node_with_item(data),
        AnyTransport::WithStatement(data) => transport_to_node_with_statement(data),
        AnyTransport::Yield(data) => transport_to_node_yield(data),
        AnyTransport::Newline(data) => transport_to_node_newline(data),
        AnyTransport::Indent(data) => transport_to_node_indent(data),
        AnyTransport::Dedent(data) => transport_to_node_dedent(data),
        AnyTransport::StringStart(data) => transport_to_node_string_start(data),
        AnyTransport::_StringContent(data) => transport_to_node__string_content(data),
        AnyTransport::EscapeInterpolation(data) => transport_to_node_escape_interpolation(data),
        AnyTransport::StringEnd(data) => transport_to_node_string_end(data),
        AnyTransport::CloseBracket(data) => transport_to_node_close_bracket(data),
        AnyTransport::CloseParen(data) => transport_to_node_close_paren(data),
        AnyTransport::CloseBrace(data) => transport_to_node_close_brace(data),
        AnyTransport::Except(data) => transport_to_node_except(data),
        AnyTransport::As(data) => transport_to_node_as(data),
        AnyTransport::Eq(data) => transport_to_node_eq(data),
        AnyTransport::Colon(data) => transport_to_node_colon(data),
        AnyTransport::Async(data) => transport_to_node_async(data),
        AnyTransport::Bracket(data) => transport_to_node_bracket(data),
        AnyTransport::TokBs(data) => transport_to_node_tok_bs(data),
        AnyTransport::Minus(data) => transport_to_node_minus(data),
        AnyTransport::Paren(data) => transport_to_node_paren(data),
        AnyTransport::Comma(data) => transport_to_node_comma(data),
        AnyTransport::Assert(data) => transport_to_node_assert(data),
        AnyTransport::Dot(data) => transport_to_node_dot(data),
        AnyTransport::Plus(data) => transport_to_node_plus(data),
        AnyTransport::Star(data) => transport_to_node_star(data),
        AnyTransport::At(data) => transport_to_node_at(data),
        AnyTransport::Slash(data) => transport_to_node_slash(data),
        AnyTransport::Percent(data) => transport_to_node_percent(data),
        AnyTransport::Slashslash(data) => transport_to_node_slashslash(data),
        AnyTransport::Starstar(data) => transport_to_node_starstar(data),
        AnyTransport::Pipe(data) => transport_to_node_pipe(data),
        AnyTransport::Amp(data) => transport_to_node_amp(data),
        AnyTransport::Caret(data) => transport_to_node_caret(data),
        AnyTransport::Shl(data) => transport_to_node_shl(data),
        AnyTransport::Shr(data) => transport_to_node_shr(data),
        AnyTransport::And(data) => transport_to_node_and(data),
        AnyTransport::Or(data) => transport_to_node_or(data),
        AnyTransport::Break(data) => transport_to_node_break(data),
        AnyTransport::Case(data) => transport_to_node_case(data),
        AnyTransport::Class(data) => transport_to_node_class(data),
        AnyTransport::If(data) => transport_to_node_if(data),
        AnyTransport::Else(data) => transport_to_node_else(data),
        AnyTransport::Continue(data) => transport_to_node_continue(data),
        AnyTransport::Del(data) => transport_to_node_del(data),
        AnyTransport::Brace(data) => transport_to_node_brace(data),
        AnyTransport::Elif(data) => transport_to_node_elif(data),
        AnyTransport::Ellipsis(data) => transport_to_node_ellipsis(data),
        AnyTransport::Exec(data) => transport_to_node_exec(data),
        AnyTransport::In(data) => transport_to_node_in(data),
        AnyTransport::False2(data) => transport_to_node_false2(data),
        AnyTransport::Finally(data) => transport_to_node_finally(data),
        AnyTransport::For(data) => transport_to_node_for(data),
        AnyTransport::Def(data) => transport_to_node_def(data),
        AnyTransport::Arrow(data) => transport_to_node_arrow(data),
        AnyTransport::From(data) => transport_to_node_from(data),
        AnyTransport::FutureU(data) => transport_to_node_future_u(data),
        AnyTransport::Import(data) => transport_to_node_import(data),
        AnyTransport::Global(data) => transport_to_node_global(data),
        AnyTransport::Match(data) => transport_to_node_match(data),
        AnyTransport::Coloneq(data) => transport_to_node_coloneq(data),
        AnyTransport::None2(data) => transport_to_node_none2(data),
        AnyTransport::Nonlocal(data) => transport_to_node_nonlocal(data),
        AnyTransport::Not(data) => transport_to_node_not(data),
        AnyTransport::Pass(data) => transport_to_node_pass(data),
        AnyTransport::Print(data) => transport_to_node_print(data),
        AnyTransport::Raise(data) => transport_to_node_raise(data),
        AnyTransport::Return(data) => transport_to_node_return(data),
        AnyTransport::Anonymous(data) => transport_to_node_anonymous(data),
        AnyTransport::True2(data) => transport_to_node_true2(data),
        AnyTransport::Try(data) => transport_to_node_try(data),
        AnyTransport::While(data) => transport_to_node_while(data),
        AnyTransport::With(data) => transport_to_node_with(data),
        AnyTransport::Literal0_2b_3d(data) => literal_transport_to_node("+=", data),
        AnyTransport::Literal1_2d_3d(data) => literal_transport_to_node("-=", data),
        AnyTransport::Literal2_2a_3d(data) => literal_transport_to_node("*=", data),
        AnyTransport::Literal3_2f_3d(data) => literal_transport_to_node("/=", data),
        AnyTransport::Literal4_40_3d(data) => literal_transport_to_node("@=", data),
        AnyTransport::Literal5_2f_2f_3d(data) => literal_transport_to_node("//=", data),
        AnyTransport::Literal6_25_3d(data) => literal_transport_to_node("%=", data),
        AnyTransport::Literal7_2a_2a_3d(data) => literal_transport_to_node("**=", data),
        AnyTransport::Literal8_3e_3e_3d(data) => literal_transport_to_node(">>=", data),
        AnyTransport::Literal9_3c_3c_3d(data) => literal_transport_to_node("<<=", data),
        AnyTransport::Literal10_26_3d(data) => literal_transport_to_node("&=", data),
        AnyTransport::Literal11_5e_3d(data) => literal_transport_to_node("^=", data),
        AnyTransport::Literal12_7c_3d(data) => literal_transport_to_node("|=", data),
        AnyTransport::Literal13_3c(data) => literal_transport_to_node("<", data),
        AnyTransport::Literal14_3c_3d(data) => literal_transport_to_node("<=", data),
        AnyTransport::Literal15_3d_3d(data) => literal_transport_to_node("==", data),
        AnyTransport::Literal16_21_3d(data) => literal_transport_to_node("!=", data),
        AnyTransport::Literal17_3e_3d(data) => literal_transport_to_node(">=", data),
        AnyTransport::Literal18_3e(data) => literal_transport_to_node(">", data),
        AnyTransport::Literal19_3c_3e(data) => literal_transport_to_node("<>", data),
        AnyTransport::Literal20_6e_6f_74_20_69_6e(data) => literal_transport_to_node("not in", data),
        AnyTransport::Literal21_69_73(data) => literal_transport_to_node("is", data),
        AnyTransport::Literal22_69_73_20_6e_6f_74(data) => literal_transport_to_node("is not", data),
        AnyTransport::Literal23_7e(data) => literal_transport_to_node("~", data),
    }
}

fn transport_to_node__as_pattern(transport: _AsPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_as_pattern",
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

fn transport_to_node_as_pattern_target(transport: AsPatternTargetTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_as_pattern_target",
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

fn transport_to_node_assignment_eq(transport: AssignmentEqTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_assignment_eq",
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

fn transport_to_node_assignment_type(transport: AssignmentTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_assignment_type",
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

fn transport_to_node_assignment_typed(transport: AssignmentTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_assignment_typed",
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

fn transport_to_node_comprehension_clauses(transport: ComprehensionClausesTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_comprehension_clauses",
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

fn transport_to_node_format_expression(transport: FormatExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_format_expression",
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

fn transport_to_node_import_list(transport: ImportListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_import_list",
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

fn transport_to_node_is_not(transport: IsNotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_is_not",
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

fn transport_to_node_key_value_pattern(transport: KeyValuePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("key".to_string(), transport_field_value(transport.key)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_key_value_pattern",
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

fn transport_to_node__list_pattern(transport: _ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_list_pattern",
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

fn transport_to_node_match_block(transport: MatchBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_match_block",
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

fn transport_to_node_match_block_block(transport: MatchBlockBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("alternative".to_string(), transport_field_values(transport.alternative)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "_match_block_block",
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

fn transport_to_node_not_escape_sequence(transport: NotEscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_not_escape_sequence",
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

fn transport_to_node_not_in(transport: NotInTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_not_in",
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

fn transport_to_node_simple_pattern_negative(transport: SimplePatternNegativeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_simple_pattern_negative",
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

fn transport_to_node_simple_statements(transport: SimpleStatementsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_simple_statements",
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

fn transport_to_node_suite(transport: SuiteTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_suite",
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

fn transport_to_node__tuple_pattern(transport: _TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_tuple_pattern",
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

fn transport_to_node__with_clause_paren(transport: _WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "_with_clause_paren",
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

fn transport_to_node_aliased_import(transport: AliasedImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("alias".to_string(), transport_field_value(transport.alias)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "aliased_import",
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

fn transport_to_node_argument_list(transport: ArgumentListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "argument_list",
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

fn transport_to_node_as_pattern(transport: AsPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    fields.insert("alias".to_string(), transport_field_value(transport.alias)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "as_pattern",
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

fn transport_to_node_assert_statement(transport: AssertStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "assert_statement",
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

fn transport_to_node_assignment(transport: AssignmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        AssignmentTransport::AssignmentUFormEq(data) => transport_to_node_assignment_uform_eq(data),
        AssignmentTransport::AssignmentUFormType(data) => transport_to_node_assignment_uform_type(data),
        AssignmentTransport::AssignmentUFormTyped(data) => transport_to_node_assignment_uform_typed(data),
    }
}

fn transport_to_node_assignment_uform_eq(transport: AssignmentUFormEqTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "assignment",
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

fn transport_to_node_assignment_uform_type(transport: AssignmentUFormTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "assignment",
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

fn transport_to_node_assignment_uform_typed(transport: AssignmentUFormTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "assignment",
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

fn transport_to_node_attribute(transport: AttributeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(transport.object)?);
    fields.insert("attribute".to_string(), transport_field_value(transport.attribute)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "attribute",
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

fn transport_to_node_augmented_assignment(transport: AugmentedAssignmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "augmented_assignment",
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

fn transport_to_node_await(transport: AwaitTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_expression".to_string(), transport_field_value(transport.primary_expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "await",
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

fn transport_to_node_binary_operator(transport: BinaryOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "binary_operator",
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

fn transport_to_node_block(transport: BlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "block",
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

fn transport_to_node_boolean_operator(transport: BooleanOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "boolean_operator",
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
    Ok(transport_node_data(
        "break_statement",
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

fn transport_to_node_call(transport: CallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(transport.function)?);
    fields.insert("arguments".to_string(), transport_field_value(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "call",
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

fn transport_to_node_case_clause(transport: CaseClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.guard {
        fields.insert("guard".to_string(), transport_field_value(value)?);
    }
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "case_clause",
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

fn transport_to_node_case_pattern(transport: CasePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "case_pattern",
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

fn transport_to_node_chevron(transport: ChevronTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "chevron",
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

fn transport_to_node_class_definition(transport: ClassDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.superclasses {
        fields.insert("superclasses".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "class_definition",
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

fn transport_to_node_class_pattern(transport: ClassPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("dotted_name".to_string(), transport_field_value(transport.dotted_name)?);
    fields.insert("arguments".to_string(), transport_field_values(transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "class_pattern",
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

fn transport_to_node_comparison_operator(transport: ComparisonOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("operators".to_string(), transport_field_values(transport.operators)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "comparison_operator",
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

fn transport_to_node_complex_pattern(transport: ComplexPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.real {
        fields.insert("real".to_string(), transport_field_value(value)?);
    }
    fields.insert("imaginary".to_string(), transport_field_value(transport.imaginary)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "complex_pattern",
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

fn transport_to_node_concatenated_string(transport: ConcatenatedStringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "concatenated_string",
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

fn transport_to_node_conditional_expression(transport: ConditionalExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("alternative".to_string(), transport_field_value(transport.alternative)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "conditional_expression",
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

fn transport_to_node_constrained_type(transport: ConstrainedTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("base_type".to_string(), transport_field_value(transport.base_type)?);
    fields.insert("constraint".to_string(), transport_field_value(transport.constraint)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "constrained_type",
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
    Ok(transport_node_data(
        "continue_statement",
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

fn transport_to_node_decorated_definition(transport: DecoratedDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("definition".to_string(), transport_field_value(transport.definition)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "decorated_definition",
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
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    if let Some(value) = transport.newline {
        fields.insert("newline".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
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

fn transport_to_node_default_parameter(transport: DefaultParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "default_parameter",
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

fn transport_to_node_delete_statement(transport: DeleteStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "delete_statement",
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

fn transport_to_node_dict_pattern(transport: DictPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "dict_pattern",
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

fn transport_to_node_dictionary(transport: DictionaryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "dictionary",
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

fn transport_to_node_dictionary_comprehension(transport: DictionaryComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "dictionary_comprehension",
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

fn transport_to_node_dictionary_splat(transport: DictionarySplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "dictionary_splat",
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

fn transport_to_node_dictionary_splat_pattern(transport: DictionarySplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "dictionary_splat_pattern",
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

fn transport_to_node_dotted_name(transport: DottedNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "dotted_name",
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

fn transport_to_node_elif_clause(transport: ElifClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "elif_clause",
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

fn transport_to_node_ellipsis2(transport: Ellipsis2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "ellipsis",
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

fn transport_to_node_else_clause(transport: ElseClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
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

fn transport_to_node_except_clause(transport: ExceptClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_values(value)?);
    }
    if let Some(value) = transport.alias {
        fields.insert("alias".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "except_clause",
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

fn transport_to_node_exec_statement(transport: ExecStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("code".to_string(), transport_field_value(transport.code)?);
    if let Some(value) = transport.in_clause {
        fields.insert("in_clause".to_string(), transport_field_values(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "exec_statement",
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

fn transport_to_node_expression_list(transport: ExpressionListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "expression_list",
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

fn transport_to_node_expression_statement_tuple(transport: ExpressionStatementTupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "expression_statement_tuple",
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
    match transport {
        ExpressionStatementTransport::ExpressionStatementUFormTuple(data) => transport_to_node_expression_statement_uform_tuple(data),
    }
}

fn transport_to_node_expression_statement_uform_tuple(transport: ExpressionStatementUFormTupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
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

fn transport_to_node_finally_clause(transport: FinallyClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("block".to_string(), transport_field_value(transport.block)?);
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

fn transport_to_node_float(transport: FloatTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "float",
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

fn transport_to_node_for_in_clause(transport: ForInClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_values(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "for_in_clause",
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
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_value(value)?);
    }
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

fn transport_to_node_format_specifier(transport: FormatSpecifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "format_specifier",
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

fn transport_to_node_function_definition(transport: FunctionDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
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
    let children = None;
    Ok(transport_node_data(
        "function_definition",
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

fn transport_to_node_future_import_statement(transport: FutureImportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "future_import_statement",
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

fn transport_to_node_generator_expression(transport: GeneratorExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "generator_expression",
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
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    fields.insert("type_parameter".to_string(), transport_field_value(transport.type_parameter)?);
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

fn transport_to_node_global_statement(transport: GlobalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "global_statement",
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

fn transport_to_node_if_clause(transport: IfClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "if_clause",
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

fn transport_to_node_if_statement(transport: IfStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("consequence".to_string(), transport_field_value(transport.consequence)?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_values(value)?);
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

fn transport_to_node_import_from_statement(transport: ImportFromStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("module_name".to_string(), transport_field_value(transport.module_name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "import_from_statement",
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

fn transport_to_node_import_prefix(transport: ImportPrefixTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "import_prefix",
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

fn transport_to_node_import_statement(transport: ImportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
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

fn transport_to_node_integer(transport: IntegerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "integer",
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

fn transport_to_node_interpolation(transport: InterpolationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    if let Some(value) = transport.type_conversion {
        fields.insert("type_conversion".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.format_specifier {
        fields.insert("format_specifier".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "interpolation",
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

fn transport_to_node_keyword_argument(transport: KeywordArgumentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "keyword_argument",
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

fn transport_to_node_keyword_pattern(transport: KeywordPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    fields.insert("simple_pattern".to_string(), transport_field_value(transport.simple_pattern)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "keyword_pattern",
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

fn transport_to_node_keyword_separator(transport: KeywordSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "keyword_separator",
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

fn transport_to_node_lambda(transport: LambdaTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.parameters {
        fields.insert("parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "lambda",
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

fn transport_to_node_lambda_parameters(transport: LambdaParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "lambda_parameters",
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

fn transport_to_node_lambda_within_for_in_clause(transport: LambdaWithinForInClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.parameters {
        fields.insert("parameters".to_string(), transport_field_value(value)?);
    }
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "lambda_within_for_in_clause",
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

fn transport_to_node_line_continuation(transport: LineContinuationTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "line_continuation",
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

fn transport_to_node_list(transport: ListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "list",
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

fn transport_to_node_list_comprehension(transport: ListComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "list_comprehension",
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

fn transport_to_node_list_pattern(transport: ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "list_pattern",
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

fn transport_to_node_list_splat(transport: ListSplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(transport.expression)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "list_splat",
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

fn transport_to_node_list_splat_pattern(transport: ListSplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "list_splat_pattern",
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

fn transport_to_node_match_statement(transport: MatchStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("subject".to_string(), transport_field_values(transport.subject)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "match_statement",
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

fn transport_to_node_member_type(transport: MemberTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("base_type".to_string(), transport_field_value(transport.base_type)?);
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "member_type",
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
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
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

fn transport_to_node_named_expression(transport: NamedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "named_expression",
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

fn transport_to_node_none(transport: NoneTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "none",
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

fn transport_to_node_nonlocal_statement(transport: NonlocalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "nonlocal_statement",
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

fn transport_to_node_not_operator(transport: NotOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "not_operator",
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

fn transport_to_node_parameters(transport: ParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "parameters",
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

fn transport_to_node_parenthesized_list_splat(transport: ParenthesizedListSplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "parenthesized_list_splat",
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

fn transport_to_node_pass_statement(transport: PassStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "pass_statement",
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

fn transport_to_node_pattern_list(transport: PatternListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "pattern_list",
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

fn transport_to_node_positional_separator(transport: PositionalSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "positional_separator",
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

fn transport_to_node_print_statement(transport: PrintStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("argument".to_string(), transport_field_values(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "print_statement",
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

fn transport_to_node_raise_statement(transport: RaiseStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.cause {
        fields.insert("cause".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(children) => Some(transport_children(children)?),
        None => None,
    };
    Ok(transport_node_data(
        "raise_statement",
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

fn transport_to_node_relative_import(transport: RelativeImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("import_prefix".to_string(), transport_field_value(transport.import_prefix)?);
    if let Some(value) = transport.dotted_name {
        fields.insert("dotted_name".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "relative_import",
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

fn transport_to_node_set(transport: SetTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "set",
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

fn transport_to_node_set_comprehension(transport: SetComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "set_comprehension",
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

fn transport_to_node_slice(transport: SliceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.start {
        fields.insert("start".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.stop {
        fields.insert("stop".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.step {
        fields.insert("step".to_string(), transport_field_value(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "slice",
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

fn transport_to_node_splat_pattern(transport: SplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "splat_pattern",
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

fn transport_to_node_splat_type(transport: SplatTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "splat_type",
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
    let mut fields = TransportHashMap::new();
    fields.insert("string_start".to_string(), transport_field_value(transport.string_start)?);
    fields.insert("content".to_string(), transport_field_values(transport.content)?);
    fields.insert("string_end".to_string(), transport_field_value(transport.string_end)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
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

fn transport_to_node_string_content(transport: StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "string_content",
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

fn transport_to_node_subscript(transport: SubscriptTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    fields.insert("subscript".to_string(), transport_field_values(transport.subscript)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "subscript",
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
    fields.insert("except_clauses".to_string(), transport_field_values(transport.except_clauses)?);
    if let Some(value) = transport.else_clause {
        fields.insert("else_clause".to_string(), transport_field_value(value)?);
    }
    if let Some(value) = transport.finally_clause {
        fields.insert("finally_clause".to_string(), transport_field_value(value)?);
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

fn transport_to_node_tuple(transport: TupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "tuple",
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

fn transport_to_node_tuple_pattern(transport: TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "tuple_pattern",
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

fn transport_to_node_type(transport: TypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "type",
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

fn transport_to_node_type_alias_statement(transport: TypeAliasStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
    fields.insert("right".to_string(), transport_field_value(transport.right)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "type_alias_statement",
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

fn transport_to_node_type_conversion(transport: TypeConversionTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "type_conversion",
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

fn transport_to_node_type_parameter(transport: TypeParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
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

fn transport_to_node_typed_default_parameter(transport: TypedDefaultParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(transport.name)?);
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "typed_default_parameter",
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

fn transport_to_node_typed_parameter(transport: TypedParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(transport.r#type)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "typed_parameter",
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

fn transport_to_node_unary_operator(transport: UnaryOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(transport.operator)?);
    fields.insert("argument".to_string(), transport_field_value(transport.argument)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "unary_operator",
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

fn transport_to_node_union_pattern(transport: UnionPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "union_pattern",
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

fn transport_to_node_union_type(transport: UnionTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(transport.left)?);
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

fn transport_to_node_while_statement(transport: WhileStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(transport.condition)?);
    fields.insert("body".to_string(), transport_field_value(transport.body)?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_value(value)?);
    }
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

fn transport_to_node_wildcard_import(transport: WildcardImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "wildcard_import",
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

fn transport_to_node_with_clause_bare(transport: WithClauseBareTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "with_clause_bare",
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

fn transport_to_node_with_clause_paren(transport: WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "with_clause_paren",
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

fn transport_to_node_with_clause(transport: WithClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        WithClauseTransport::WithClauseUFormBare(data) => transport_to_node_with_clause_uform_bare(data),
        WithClauseTransport::WithClauseUFormParen(data) => transport_to_node_with_clause_uform_paren(data),
    }
}

fn transport_to_node_with_clause_uform_bare(transport: WithClauseUFormBareTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "with_clause",
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

fn transport_to_node_with_clause_uform_paren(transport: WithClauseUFormParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "with_clause",
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

fn transport_to_node_with_item(transport: WithItemTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(transport.value)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    Ok(transport_node_data(
        "with_item",
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
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(value)?);
    }
    fields.insert("with_clause".to_string(), transport_field_value(transport.with_clause)?);
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

fn transport_to_node_yield(transport: YieldTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        "yield",
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

fn transport_to_node_newline(transport: NewlineTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_newline",
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

fn transport_to_node_indent(transport: IndentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_indent",
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

fn transport_to_node_dedent(transport: DedentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_dedent",
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

fn transport_to_node_string_start(transport: StringStartTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "string_start",
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

fn transport_to_node__string_content(transport: _StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_string_content",
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

fn transport_to_node_escape_interpolation(transport: EscapeInterpolationTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "escape_interpolation",
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

fn transport_to_node_string_end(transport: StringEndTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "string_end",
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

fn transport_to_node_except(transport: ExceptTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "except",
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

fn transport_to_node_tok_bs(transport: TokBsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "\\",
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

fn transport_to_node_assert(transport: AssertTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "assert",
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

fn transport_to_node_slashslash(transport: SlashslashTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "//",
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

fn transport_to_node_and(transport: AndTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "and",
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

fn transport_to_node_or(transport: OrTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "or",
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

fn transport_to_node_class(transport: ClassTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "class",
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

fn transport_to_node_del(transport: DelTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "del",
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

fn transport_to_node_elif(transport: ElifTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "elif",
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

fn transport_to_node_exec(transport: ExecTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "exec",
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

fn transport_to_node_false2(transport: False2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "False",
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

fn transport_to_node_def(transport: DefTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "def",
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

fn transport_to_node_arrow(transport: ArrowTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "->",
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

fn transport_to_node_future_u(transport: FutureUTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "__future__",
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

fn transport_to_node_match(transport: MatchTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "match",
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

fn transport_to_node_coloneq(transport: ColoneqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        ":=",
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

fn transport_to_node_none2(transport: None2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "None",
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

fn transport_to_node_nonlocal(transport: NonlocalTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "nonlocal",
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

fn transport_to_node_not(transport: NotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "not",
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

fn transport_to_node_pass(transport: PassTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "pass",
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

fn transport_to_node_print(transport: PrintTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "print",
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

fn transport_to_node_raise(transport: RaiseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "raise",
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

fn transport_to_node_anonymous(transport: AnonymousTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "_",
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

fn transport_to_node_true2(transport: True2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        "True",
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
#[template(path = "_as_pattern_target.jinja", escape = "none")]
pub struct AsPatternTargetTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate<'a> {
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate<'a> {
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate<'a> {
    pub right: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_format_expression.jinja", escape = "none")]
pub struct FormatExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate<'a> {
    pub alternative: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate<'a> {
    pub alias: &'a str,
    pub name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate<'a> {
    pub alias: &'a str,
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub attribute: &'a str,
    pub object: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate<'a> {
    pub primary_expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate<'a> {
    pub left: &'a str,
    pub operator: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate<'a> {
    pub arguments: &'a str,
    pub function: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub consequence: &'a str,
    pub guard: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate<'a> {
    pub body: &'a str,
    pub name: &'a str,
    pub superclasses: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate<'a> {
    pub arguments: ::sittir_core::filters::FieldView<'a>,
    pub dotted_name: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub left: &'a str,
    pub operators: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub imaginary: &'a str,
    pub real: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate<'a> {
    pub alternative: &'a str,
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate<'a> {
    pub base_type: &'a str,
    pub constraint: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub definition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub expression: &'a str,
    pub newline: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate<'a> {
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub alias: &'a str,
    pub value: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate<'a> {
    pub code: &'a str,
    pub in_clause: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub variant: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub block: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate<'a> {
    pub async_marker: &'a str,
    pub left: &'a str,
    pub right: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub alternative: &'a str,
    pub async_marker: &'a str,
    pub body: &'a str,
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub name: &'a str,
    pub parameters: &'a str,
    pub return_type: &'a str,
    pub type_parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub identifier: &'a str,
    pub type_parameter: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: ::sittir_core::filters::FieldView<'a>,
    pub condition: &'a str,
    pub consequence: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub module_name: &'a str,
    pub name: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate<'a> {
    pub expression: &'a str,
    pub format_specifier: &'a str,
    pub type_conversion: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate<'a> {
    pub identifier: &'a str,
    pub simple_pattern: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate<'a> {
    pub body: &'a str,
    pub parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate<'a> {
    pub body: &'a str,
    pub parameters: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate<'a> {
    pub expression: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate<'a> {
    pub body: &'a str,
    pub subject: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate<'a> {
    pub base_type: &'a str,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate<'a> {
    pub name: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate<'a> {
    pub argument: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub argument: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub cause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate<'a> {
    pub dotted_name: &'a str,
    pub import_prefix: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub body: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate<'a> {
    pub start: &'a str,
    pub step: &'a str,
    pub stop: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub identifier: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate<'a> {
    pub identifier: ::sittir_core::filters::FieldView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate<'a> {
    pub subscript: ::sittir_core::filters::FieldView<'a>,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: &'a str,
    pub else_clause: &'a str,
    pub except_clauses: ::sittir_core::filters::FieldView<'a>,
    pub finally_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate<'a> {
    pub name: &'a str,
    pub r#type: &'a str,
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
    pub r#type: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate<'a> {
    pub argument: &'a str,
    pub operator: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: &'a str,
    pub right: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub alternative: &'a str,
    pub body: &'a str,
    pub condition: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate<'a> {
    pub value: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub async_marker: &'a str,
    pub body: &'a str,
    pub with_clause: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate<'a> {
    pub children: ::sittir_core::filters::ListView<'a>,
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
        "_with_clause_paren" => ",",
        "dict_pattern" => ",",
        "dictionary" => ",",
        "dotted_name" => ".",
        "expression_statement_tuple" => ",",
        "lambda_parameters" => ",",
        "set" => ",",
        "type_parameter" => ",",
        "with_clause_bare" => ",",
        "with_clause_paren" => ",",
        _ => "",
    }
}

fn variant_for(parent_kind: &str, child_kind: &str) -> Option<&'static str> {
    match (parent_kind, child_kind) {
        ("assignment", "assignment__form_eq") => Some("eq"),
        ("assignment", "assignment__form_type") => Some("type"),
        ("assignment", "assignment__form_typed") => Some("typed"),
        ("assignment", "assignment_eq") => Some("eq"),
        ("assignment", "assignment_type") => Some("eq"),
        ("assignment", "assignment_typed") => Some("eq"),
        ("expression_statement", "expression_statement__form_tuple") => Some("tuple"),
        ("expression_statement", "expression_statement_tuple") => Some("tuple"),
        ("with_clause", "with_clause__form_bare") => Some("bare"),
        ("with_clause", "with_clause__form_paren") => Some("paren"),
        ("with_clause", "with_clause_bare") => Some("bare"),
        ("with_clause", "with_clause_paren") => Some("bare"),
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

fn render_hidden_as_pattern_target(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AsPatternTargetTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _AsPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_assignment_eq(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = AssignmentEqTemplate {
        right: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_assignment_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AssignmentTypeTemplate {
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_hidden_assignment_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right", "type"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = AssignmentTypedTemplate {
        right: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
    };
    template.render()
}

fn render_hidden_comprehension_clauses(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ComprehensionClausesTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_format_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormatExpressionTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_match_block_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let template = MatchBlockBlockTemplate {
        alternative: field_0.as_field_view(),
    };
    template.render()
}

fn render_hidden_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = MatchBlockTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_simple_pattern_negative(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = SimplePatternNegativeTemplate {
        text: text.as_str(),
    };
    template.render()
}

fn render_hidden_simple_statements(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SimpleStatementsTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_suite(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SuiteTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_hidden_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = _WithClauseParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_aliased_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = AliasedImportTemplate {
        alias: field_0.as_scalar(),
        name: field_1.as_scalar(),
    };
    template.render()
}

fn render_argument_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ArgumentListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "expression"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "expression", true)?;
    let template = AsPatternTemplate {
        alias: field_0.as_scalar(),
        expression: field_1.as_scalar(),
    };
    template.render()
}

fn render_assert_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = AssertStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let template = AssignmentTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
    };
    template.render()
}

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "object"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = AttributeTemplate {
        attribute: field_0.as_scalar(),
        object: field_1.as_scalar(),
    };
    template.render()
}

fn render_augmented_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_await(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_expression"])?;
    let field_0 = resolve_field(node, "primary_expression", true)?;
    let template = AwaitTemplate {
        primary_expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_binary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryOperatorTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = BlockTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_boolean_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BooleanOperatorTemplate {
        left: field_0.as_scalar(),
        operator: field_1.as_scalar(),
        right: field_2.as_scalar(),
    };
    template.render()
}

fn render_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallTemplate {
        arguments: field_0.as_scalar(),
        function: field_1.as_scalar(),
    };
    template.render()
}

fn render_case_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["consequence", "guard"])?;
    let field_0 = resolve_field(node, "consequence", true)?;
    let field_1 = resolve_field(node, "guard", false)?;
    let template = CaseClauseTemplate {
        children: children.as_list_view(),
        consequence: field_0.as_scalar(),
        guard: field_1.as_scalar(),
    };
    template.render()
}

fn render_case_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = CasePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_chevron(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ChevronTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_class_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "name", "superclasses", "type_parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let field_2 = resolve_field(node, "superclasses", false)?;
    let field_3 = resolve_field(node, "type_parameters", false)?;
    let template = ClassDefinitionTemplate {
        body: field_0.as_scalar(),
        name: field_1.as_scalar(),
        superclasses: field_2.as_scalar(),
        type_parameters: field_3.as_scalar(),
    };
    template.render()
}

fn render_class_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "dotted_name"])?;
    let field_0 = resolve_field(node, "arguments", false)?;
    let field_1 = resolve_field(node, "dotted_name", true)?;
    let template = ClassPatternTemplate {
        arguments: field_0.as_field_view(),
        dotted_name: field_1.as_scalar(),
    };
    template.render()
}

fn render_comparison_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operators"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operators", true)?;
    let template = ComparisonOperatorTemplate {
        children: children.as_list_view(),
        left: field_0.as_scalar(),
        operators: field_1.as_field_view(),
    };
    template.render()
}

fn render_complex_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["imaginary", "real"])?;
    let field_0 = resolve_field(node, "imaginary", true)?;
    let field_1 = resolve_field(node, "real", false)?;
    let template = ComplexPatternTemplate {
        children: children.as_list_view(),
        imaginary: field_0.as_scalar(),
        real: field_1.as_scalar(),
    };
    template.render()
}

fn render_concatenated_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ConcatenatedStringTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_conditional_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = ConditionalExpressionTemplate {
        alternative: field_0.as_scalar(),
        body: field_1.as_scalar(),
        condition: field_2.as_scalar(),
    };
    template.render()
}

fn render_constrained_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "constraint"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "constraint", true)?;
    let template = ConstrainedTypeTemplate {
        base_type: field_0.as_scalar(),
        constraint: field_1.as_scalar(),
    };
    template.render()
}

fn render_decorated_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["definition"])?;
    let field_0 = resolve_field(node, "definition", true)?;
    let template = DecoratedDefinitionTemplate {
        children: children.as_list_view(),
        definition: field_0.as_scalar(),
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "newline"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "newline", false)?;
    let template = DecoratorTemplate {
        expression: field_0.as_scalar(),
        newline: field_1.as_scalar(),
    };
    template.render()
}

fn render_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = DefaultParameterTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_delete_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DeleteStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dict_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dictionary_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = DictionaryComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_dictionary_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictionarySplatPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dictionary_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = DictionarySplatTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_dictionary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DictionaryTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_dotted_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = DottedNameTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_elif_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition", "consequence"])?;
    let field_0 = resolve_field(node, "condition", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let template = ElifClauseTemplate {
        condition: field_0.as_scalar(),
        consequence: field_1.as_scalar(),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ElseClauseTemplate {
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_except_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "value"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let template = ExceptClauseTemplate {
        children: children.as_list_view(),
        alias: field_0.as_scalar(),
        value: field_1.as_field_view(),
    };
    template.render()
}

fn render_exec_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["code", "in_clause"])?;
    let field_0 = resolve_field(node, "code", true)?;
    let field_1 = resolve_field(node, "in_clause", false)?;
    let template = ExecStatementTemplate {
        code: field_0.as_scalar(),
        in_clause: field_1.as_field_view(),
    };
    template.render()
}

fn render_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ExpressionStatementTupleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let template = ExpressionStatementTemplate {
        children: children.as_list_view(),
        variant,
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = FinallyClauseTemplate {
        block: field_0.as_scalar(),
    };
    template.render()
}

fn render_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "left", "right"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = ForInClauseTemplate {
        async_marker: field_0.as_scalar(),
        left: field_1.as_scalar(),
        right: field_2.as_field_view(),
    };
    template.render()
}

fn render_for_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "async_marker", "body", "left", "right"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "async_marker", false)?;
    let field_2 = resolve_field(node, "body", true)?;
    let field_3 = resolve_field(node, "left", true)?;
    let field_4 = resolve_field(node, "right", true)?;
    let template = ForStatementTemplate {
        alternative: field_0.as_scalar(),
        async_marker: field_1.as_scalar(),
        body: field_2.as_scalar(),
        left: field_3.as_scalar(),
        right: field_4.as_scalar(),
    };
    template.render()
}

fn render_format_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = FormatSpecifierTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_function_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "name", "parameters", "return_type", "type_parameters"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "name", true)?;
    let field_3 = resolve_field(node, "parameters", true)?;
    let field_4 = resolve_field(node, "return_type", false)?;
    let field_5 = resolve_field(node, "type_parameters", false)?;
    let template = FunctionDefinitionTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        name: field_2.as_scalar(),
        parameters: field_3.as_scalar(),
        return_type: field_4.as_scalar(),
        type_parameters: field_5.as_scalar(),
    };
    template.render()
}

fn render_future_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = FutureImportStatementTemplate {
        name: field_0.as_field_view(),
    };
    template.render()
}

fn render_generator_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = GeneratorExpressionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "type_parameter"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "type_parameter", true)?;
    let template = GenericTypeTemplate {
        identifier: field_0.as_scalar(),
        type_parameter: field_1.as_scalar(),
    };
    template.render()
}

fn render_global_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = GlobalStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_if_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = IfClauseTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let template = IfStatementTemplate {
        alternative: field_0.as_field_view(),
        condition: field_1.as_scalar(),
        consequence: field_2.as_scalar(),
    };
    template.render()
}

fn render_import_from_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module_name", "name"])?;
    let field_0 = resolve_field(node, "module_name", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let template = ImportFromStatementTemplate {
        children: children.as_list_view(),
        module_name: field_0.as_scalar(),
        name: field_1.as_list_view(),
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let template = ImportStatementTemplate {
        name: field_0.as_field_view(),
    };
    template.render()
}

fn render_interpolation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "format_specifier", false)?;
    let field_2 = resolve_field(node, "type_conversion", false)?;
    let template = InterpolationTemplate {
        expression: field_0.as_scalar(),
        format_specifier: field_1.as_scalar(),
        type_conversion: field_2.as_scalar(),
    };
    template.render()
}

fn render_keyword_argument(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = KeywordArgumentTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_keyword_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "simple_pattern"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "simple_pattern", true)?;
    let template = KeywordPatternTemplate {
        identifier: field_0.as_scalar(),
        simple_pattern: field_1.as_scalar(),
    };
    template.render()
}

fn render_lambda_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = LambdaParametersTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_lambda_within_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaWithinForInClauseTemplate {
        body: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
    };
    template.render()
}

fn render_lambda(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaTemplate {
        body: field_0.as_scalar(),
        parameters: field_1.as_scalar(),
    };
    template.render()
}

fn render_list_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ListComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_list_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_list_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListSplatPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ListSplatTemplate {
        expression: field_0.as_scalar(),
    };
    template.render()
}

fn render_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_match_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "subject"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "subject", true)?;
    let template = MatchStatementTemplate {
        body: field_0.as_scalar(),
        subject: field_1.as_field_view(),
    };
    template.render()
}

fn render_member_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "identifier"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let template = MemberTypeTemplate {
        base_type: field_0.as_scalar(),
        identifier: field_1.as_scalar(),
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ModuleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_named_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = NamedExpressionTemplate {
        name: field_0.as_scalar(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_nonlocal_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = NonlocalStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_not_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let template = NotOperatorTemplate {
        argument: field_0.as_scalar(),
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

fn render_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParametersTemplate {
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

fn render_parenthesized_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ParenthesizedListSplatTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_pattern_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = PatternListTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_print_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", false)?;
    let template = PrintStatementTemplate {
        children: children.as_list_view(),
        argument: field_0.as_field_view(),
    };
    template.render()
}

fn render_raise_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["cause"])?;
    let field_0 = resolve_field(node, "cause", false)?;
    let template = RaiseStatementTemplate {
        children: children.as_list_view(),
        cause: field_0.as_scalar(),
    };
    template.render()
}

fn render_relative_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
    let field_0 = resolve_field(node, "dotted_name", false)?;
    let field_1 = resolve_field(node, "import_prefix", true)?;
    let template = RelativeImportTemplate {
        dotted_name: field_0.as_scalar(),
        import_prefix: field_1.as_scalar(),
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = ReturnStatementTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_set_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = SetComprehensionTemplate {
        children: children.as_list_view(),
        body: field_0.as_scalar(),
    };
    template.render()
}

fn render_set(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = SetTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_slice(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["start", "step", "stop"])?;
    let field_0 = resolve_field(node, "start", false)?;
    let field_1 = resolve_field(node, "step", false)?;
    let field_2 = resolve_field(node, "stop", false)?;
    let template = SliceTemplate {
        start: field_0.as_scalar(),
        step: field_1.as_scalar(),
        stop: field_2.as_scalar(),
    };
    template.render()
}

fn render_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = SplatPatternTemplate {
        children: children.as_list_view(),
        identifier: field_0.as_scalar(),
    };
    template.render()
}

fn render_splat_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let template = SplatTypeTemplate {
        identifier: field_0.as_field_view(),
    };
    template.render()
}

fn render_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = StringContentTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let text = resolve_text(node)?;
    let template = StringTemplate {
        text: text.as_str(),
    };
    template.render()
}

fn render_subscript(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["subscript", "value"])?;
    let field_0 = resolve_field(node, "subscript", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = SubscriptTemplate {
        subscript: field_0.as_field_view(),
        value: field_1.as_scalar(),
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "else_clause", false)?;
    let field_2 = resolve_field(node, "except_clauses", false)?;
    let field_3 = resolve_field(node, "finally_clause", false)?;
    let template = TryStatementTemplate {
        body: field_0.as_scalar(),
        else_clause: field_1.as_scalar(),
        except_clauses: field_2.as_field_view(),
        finally_clause: field_3.as_scalar(),
    };
    template.render()
}

fn render_tuple_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TuplePatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TupleTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type_alias_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "type"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = TypeAliasStatementTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
        r#type: field_2.as_scalar(),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeParameterTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = TypeTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_typed_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = TypedDefaultParameterTemplate {
        name: field_0.as_scalar(),
        r#type: field_1.as_scalar(),
        value: field_2.as_scalar(),
    };
    template.render()
}

fn render_typed_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = TypedParameterTemplate {
        children: children.as_list_view(),
        r#type: field_0.as_scalar(),
    };
    template.render()
}

fn render_unary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryOperatorTemplate {
        argument: field_0.as_scalar(),
        operator: field_1.as_scalar(),
    };
    template.render()
}

fn render_union_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = UnionPatternTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: field_0.as_scalar(),
        right: field_1.as_scalar(),
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        alternative: field_0.as_scalar(),
        body: field_1.as_scalar(),
        condition: field_2.as_scalar(),
    };
    template.render()
}

fn render_with_clause_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseBareTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseParenTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = WithClauseTemplate {
        children: children.as_list_view(),
    };
    template.render()
}

fn render_with_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = WithItemTemplate {
        value: field_0.as_scalar(),
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "with_clause", true)?;
    let template = WithStatementTemplate {
        async_marker: field_0.as_scalar(),
        body: field_1.as_scalar(),
        with_clause: field_2.as_scalar(),
    };
    template.render()
}

fn render_yield(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let template = YieldTemplate {
        children: children.as_list_view(),
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
        "_as_pattern_target" | "as_pattern_target" => render_hidden_as_pattern_target(node),
        "_as_pattern" => render_hidden_as_pattern(node),
        "_assignment_eq" | "assignment_eq" => render_hidden_assignment_eq(node),
        "_assignment_type" | "assignment_type" => render_hidden_assignment_type(node),
        "_assignment_typed" | "assignment_typed" => render_hidden_assignment_typed(node),
        "_comprehension_clauses" | "comprehension_clauses" => render_hidden_comprehension_clauses(node),
        "_format_expression" | "format_expression" => render_hidden_format_expression(node),
        "_match_block_block" | "match_block_block" => render_hidden_match_block_block(node),
        "_match_block" | "match_block" => render_hidden_match_block(node),
        "_simple_pattern_negative" | "simple_pattern_negative" => render_hidden_simple_pattern_negative(node),
        "_simple_statements" | "simple_statements" => render_hidden_simple_statements(node),
        "_suite" | "suite" => render_hidden_suite(node),
        "_with_clause_paren" => render_hidden_with_clause_paren(node),
        "aliased_import" => render_aliased_import(node),
        "argument_list" => render_argument_list(node),
        "as_pattern" => render_as_pattern(node),
        "assert_statement" => render_assert_statement(node),
        "assignment" => render_assignment(node),
        "attribute" => render_attribute(node),
        "augmented_assignment" => render_augmented_assignment(node),
        "await" => render_await(node),
        "binary_operator" => render_binary_operator(node),
        "block" => render_block(node),
        "boolean_operator" => render_boolean_operator(node),
        "call" => render_call(node),
        "case_clause" => render_case_clause(node),
        "case_pattern" => render_case_pattern(node),
        "chevron" => render_chevron(node),
        "class_definition" => render_class_definition(node),
        "class_pattern" => render_class_pattern(node),
        "comparison_operator" => render_comparison_operator(node),
        "complex_pattern" => render_complex_pattern(node),
        "concatenated_string" => render_concatenated_string(node),
        "conditional_expression" => render_conditional_expression(node),
        "constrained_type" => render_constrained_type(node),
        "decorated_definition" => render_decorated_definition(node),
        "decorator" => render_decorator(node),
        "default_parameter" => render_default_parameter(node),
        "delete_statement" => render_delete_statement(node),
        "dict_pattern" => render_dict_pattern(node),
        "dictionary_comprehension" => render_dictionary_comprehension(node),
        "dictionary_splat_pattern" => render_dictionary_splat_pattern(node),
        "dictionary_splat" => render_dictionary_splat(node),
        "dictionary" => render_dictionary(node),
        "dotted_name" => render_dotted_name(node),
        "elif_clause" => render_elif_clause(node),
        "else_clause" => render_else_clause(node),
        "except_clause" => render_except_clause(node),
        "exec_statement" => render_exec_statement(node),
        "expression_list" => render_expression_list(node),
        "expression_statement_tuple" => render_expression_statement_tuple(node),
        "expression_statement" => render_expression_statement(node),
        "finally_clause" => render_finally_clause(node),
        "for_in_clause" => render_for_in_clause(node),
        "for_statement" => render_for_statement(node),
        "format_specifier" => render_format_specifier(node),
        "function_definition" => render_function_definition(node),
        "future_import_statement" => render_future_import_statement(node),
        "generator_expression" => render_generator_expression(node),
        "generic_type" => render_generic_type(node),
        "global_statement" => render_global_statement(node),
        "if_clause" => render_if_clause(node),
        "if_statement" => render_if_statement(node),
        "import_from_statement" => render_import_from_statement(node),
        "import_statement" => render_import_statement(node),
        "interpolation" => render_interpolation(node),
        "keyword_argument" => render_keyword_argument(node),
        "keyword_pattern" => render_keyword_pattern(node),
        "lambda_parameters" => render_lambda_parameters(node),
        "lambda_within_for_in_clause" => render_lambda_within_for_in_clause(node),
        "lambda" => render_lambda(node),
        "list_comprehension" => render_list_comprehension(node),
        "list_pattern" => render_list_pattern(node),
        "list_splat_pattern" => render_list_splat_pattern(node),
        "list_splat" => render_list_splat(node),
        "list" => render_list(node),
        "match_statement" => render_match_statement(node),
        "member_type" => render_member_type(node),
        "module" => render_module(node),
        "named_expression" => render_named_expression(node),
        "nonlocal_statement" => render_nonlocal_statement(node),
        "not_operator" => render_not_operator(node),
        "pair" => render_pair(node),
        "parameters" => render_parameters(node),
        "parenthesized_expression" => render_parenthesized_expression(node),
        "parenthesized_list_splat" => render_parenthesized_list_splat(node),
        "pattern_list" => render_pattern_list(node),
        "print_statement" => render_print_statement(node),
        "raise_statement" => render_raise_statement(node),
        "relative_import" => render_relative_import(node),
        "return_statement" => render_return_statement(node),
        "set_comprehension" => render_set_comprehension(node),
        "set" => render_set(node),
        "slice" => render_slice(node),
        "splat_pattern" => render_splat_pattern(node),
        "splat_type" => render_splat_type(node),
        "string_content" => render_string_content(node),
        "string" => render_string(node),
        "subscript" => render_subscript(node),
        "try_statement" => render_try_statement(node),
        "tuple_pattern" => render_tuple_pattern(node),
        "tuple" => render_tuple(node),
        "type_alias_statement" => render_type_alias_statement(node),
        "type_parameter" => render_type_parameter(node),
        "type" => render_type(node),
        "typed_default_parameter" => render_typed_default_parameter(node),
        "typed_parameter" => render_typed_parameter(node),
        "unary_operator" => render_unary_operator(node),
        "union_pattern" => render_union_pattern(node),
        "union_type" => render_union_type(node),
        "while_statement" => render_while_statement(node),
        "with_clause_bare" => render_with_clause_bare(node),
        "with_clause_paren" => render_with_clause_paren(node),
        "with_clause" => render_with_clause(node),
        "with_item" => render_with_item(node),
        "with_statement" => render_with_statement(node),
        "yield" => render_yield(node),
        _ => token_shaped_fallback(node),
    }
}

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

#[cfg(feature = "napi-bindings")]
use ::napi_derive::napi;

pub mod filters {
    //! Askama resolves custom-filter names by searching for a
    //! sibling `filters` module at the derive-macro site. This
    //! module wraps the canonical sittir_core implementations with
    //! the `#[askama::filter_fn]` attribute so Askama can call them
    //! from templates.
    use ::sittir_core::filters::{Joined, JoinSource};

    #[::askama::filter_fn]
    pub fn joinby<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        _values: &dyn ::askama::Values,
        sep: &'a str,
        leading: bool,
        trailing: bool,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, leading, trailing)
    }

    #[::askama::filter_fn]
    pub fn join<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        _values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinby(xs, sep, false, false)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithTrailing<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithTrailing(xs, values, sep)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithLeading<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithLeading(xs, values, sep)
    }

    #[::askama::filter_fn]
    #[allow(non_snake_case)]
    pub fn joinWithFlanks<'a, T: JoinSource<'a> + ?Sized>(
        xs: &'a T,
        values: &dyn ::askama::Values,
        sep: &'a str,
    ) -> Result<::askama::filters::Safe<Joined<'a>>, ::askama::Error> {
        ::sittir_core::filters::joinWithFlanks(xs, values, sep)
    }

    pub use ::sittir_core::filters::{
        upper, lower,
        isBlank, isPresent,
    };
}

#[derive(Debug, Clone)]
pub enum AnyTransport {
    _AsPattern(_AsPatternTransport),
    AsPatternTarget(AsPatternTargetTransport),
    AssignmentEq(AssignmentEqTransport),
    AssignmentType(AssignmentTypeTransport),
    AssignmentTyped(AssignmentTypedTransport),
    ComprehensionClauses(ComprehensionClausesTransport),
    FormatExpression(FormatExpressionTransport),
    ImportList(ImportListTransport),
    IsNot(IsNotTransport),
    KeyValuePattern(KeyValuePatternTransport),
    KwAsyncMarker(KwAsyncMarkerTransport),
    _ListPattern(_ListPatternTransport),
    MatchBlock(MatchBlockTransport),
    MatchBlockBlock(MatchBlockBlockTransport),
    NotEscapeSequence(NotEscapeSequenceTransport),
    NotIn(NotInTransport),
    SimplePatternNegative(SimplePatternNegativeTransport),
    SimpleStatements(SimpleStatementsTransport),
    Suite(SuiteTransport),
    _TuplePattern(_TuplePatternTransport),
    _WithClauseParen(_WithClauseParenTransport),
    AliasedImport(AliasedImportTransport),
    ArgumentList(ArgumentListTransport),
    AsPattern(AsPatternTransport),
    AssertStatement(AssertStatementTransport),
    Assignment(AssignmentTransport),
    Attribute(AttributeTransport),
    AugmentedAssignment(AugmentedAssignmentTransport),
    Await(AwaitTransport),
    BinaryOperator(BinaryOperatorTransport),
    Block(BlockTransport),
    BooleanOperator(BooleanOperatorTransport),
    BreakStatement(BreakStatementTransport),
    Call(CallTransport),
    CaseClause(CaseClauseTransport),
    CasePattern(CasePatternTransport),
    Chevron(ChevronTransport),
    ClassDefinition(ClassDefinitionTransport),
    ClassPattern(ClassPatternTransport),
    Comment(CommentTransport),
    ComparisonOperator(ComparisonOperatorTransport),
    ComplexPattern(ComplexPatternTransport),
    ConcatenatedString(ConcatenatedStringTransport),
    ConditionalExpression(ConditionalExpressionTransport),
    ConstrainedType(ConstrainedTypeTransport),
    ContinueStatement(ContinueStatementTransport),
    DecoratedDefinition(DecoratedDefinitionTransport),
    Decorator(DecoratorTransport),
    DefaultParameter(DefaultParameterTransport),
    DeleteStatement(DeleteStatementTransport),
    DictPattern(DictPatternTransport),
    Dictionary(DictionaryTransport),
    DictionaryComprehension(DictionaryComprehensionTransport),
    DictionarySplat(DictionarySplatTransport),
    DictionarySplatPattern(DictionarySplatPatternTransport),
    DottedName(DottedNameTransport),
    ElifClause(ElifClauseTransport),
    Ellipsis2(Ellipsis2Transport),
    ElseClause(ElseClauseTransport),
    EscapeSequence(EscapeSequenceTransport),
    ExceptClause(ExceptClauseTransport),
    ExecStatement(ExecStatementTransport),
    ExpressionList(ExpressionListTransport),
    ExpressionStatementTuple(ExpressionStatementTupleTransport),
    ExpressionStatement(ExpressionStatementTransport),
    False(FalseTransport),
    FinallyClause(FinallyClauseTransport),
    Float(FloatTransport),
    ForInClause(ForInClauseTransport),
    ForStatement(ForStatementTransport),
    FormatSpecifier(FormatSpecifierTransport),
    FunctionDefinition(FunctionDefinitionTransport),
    FutureImportStatement(FutureImportStatementTransport),
    GeneratorExpression(GeneratorExpressionTransport),
    GenericType(GenericTypeTransport),
    GlobalStatement(GlobalStatementTransport),
    Identifier(IdentifierTransport),
    IfClause(IfClauseTransport),
    IfStatement(IfStatementTransport),
    ImportFromStatement(ImportFromStatementTransport),
    ImportPrefix(ImportPrefixTransport),
    ImportStatement(ImportStatementTransport),
    Integer(IntegerTransport),
    Interpolation(InterpolationTransport),
    KeywordArgument(KeywordArgumentTransport),
    KeywordPattern(KeywordPatternTransport),
    KeywordSeparator(KeywordSeparatorTransport),
    Lambda(LambdaTransport),
    LambdaParameters(LambdaParametersTransport),
    LambdaWithinForInClause(LambdaWithinForInClauseTransport),
    LineContinuation(LineContinuationTransport),
    List(ListTransport),
    ListComprehension(ListComprehensionTransport),
    ListPattern(ListPatternTransport),
    ListSplat(ListSplatTransport),
    ListSplatPattern(ListSplatPatternTransport),
    MatchStatement(MatchStatementTransport),
    MemberType(MemberTypeTransport),
    Module(ModuleTransport),
    NamedExpression(NamedExpressionTransport),
    None(NoneTransport),
    NonlocalStatement(NonlocalStatementTransport),
    NotOperator(NotOperatorTransport),
    Pair(PairTransport),
    Parameters(ParametersTransport),
    ParenthesizedExpression(ParenthesizedExpressionTransport),
    ParenthesizedListSplat(ParenthesizedListSplatTransport),
    PassStatement(PassStatementTransport),
    PatternList(PatternListTransport),
    PositionalSeparator(PositionalSeparatorTransport),
    PrintStatement(PrintStatementTransport),
    RaiseStatement(RaiseStatementTransport),
    RelativeImport(RelativeImportTransport),
    ReturnStatement(ReturnStatementTransport),
    Set(SetTransport),
    SetComprehension(SetComprehensionTransport),
    Slice(SliceTransport),
    SplatPattern(SplatPatternTransport),
    SplatType(SplatTypeTransport),
    String(StringTransport),
    StringContent(StringContentTransport),
    Subscript(SubscriptTransport),
    True(TrueTransport),
    TryStatement(TryStatementTransport),
    Tuple(TupleTransport),
    TuplePattern(TuplePatternTransport),
    Type(TypeTransport),
    TypeAliasStatement(TypeAliasStatementTransport),
    TypeConversion(TypeConversionTransport),
    TypeParameter(TypeParameterTransport),
    TypedDefaultParameter(TypedDefaultParameterTransport),
    TypedParameter(TypedParameterTransport),
    UnaryOperator(UnaryOperatorTransport),
    UnionPattern(UnionPatternTransport),
    UnionType(UnionTypeTransport),
    WhileStatement(WhileStatementTransport),
    WildcardImport(WildcardImportTransport),
    WithClauseBare(WithClauseBareTransport),
    WithClauseParen(WithClauseParenTransport),
    WithClause(WithClauseTransport),
    WithItem(WithItemTransport),
    WithStatement(WithStatementTransport),
    Yield(YieldTransport),
    Newline(NewlineTransport),
    Indent(IndentTransport),
    Dedent(DedentTransport),
    StringStart(StringStartTransport),
    _StringContent(_StringContentTransport),
    EscapeInterpolation(EscapeInterpolationTransport),
    StringEnd(StringEndTransport),
    CloseBracket(CloseBracketTransport),
    CloseParen(CloseParenTransport),
    CloseBrace(CloseBraceTransport),
    Except(ExceptTransport),
    As(AsTransport),
    Eq(EqTransport),
    Colon(ColonTransport),
    Async(AsyncTransport),
    Bracket(BracketTransport),
    TokBs(TokBsTransport),
    Minus(MinusTransport),
    Paren(ParenTransport),
    Comma(CommaTransport),
    Assert(AssertTransport),
    Dot(DotTransport),
    Plus(PlusTransport),
    Star(StarTransport),
    At(AtTransport),
    Slash(SlashTransport),
    Percent(PercentTransport),
    Slashslash(SlashslashTransport),
    Starstar(StarstarTransport),
    Pipe(PipeTransport),
    Amp(AmpTransport),
    Caret(CaretTransport),
    Shl(ShlTransport),
    Shr(ShrTransport),
    And(AndTransport),
    Or(OrTransport),
    Break(BreakTransport),
    Case(CaseTransport),
    Class(ClassTransport),
    If(IfTransport),
    Else(ElseTransport),
    Continue(ContinueTransport),
    Del(DelTransport),
    Brace(BraceTransport),
    Elif(ElifTransport),
    Ellipsis(EllipsisTransport),
    Exec(ExecTransport),
    In(InTransport),
    False2(False2Transport),
    Finally(FinallyTransport),
    For(ForTransport),
    Def(DefTransport),
    Arrow(ArrowTransport),
    From(FromTransport),
    FutureU(FutureUTransport),
    Import(ImportTransport),
    Global(GlobalTransport),
    Match(MatchTransport),
    Coloneq(ColoneqTransport),
    None2(None2Transport),
    Nonlocal(NonlocalTransport),
    Not(NotTransport),
    Pass(PassTransport),
    Print(PrintTransport),
    Raise(RaiseTransport),
    Return(ReturnTransport),
    Anonymous(AnonymousTransport),
    True2(True2Transport),
    Try(TryTransport),
    While(WhileTransport),
    With(WithTransport),
    Literal0_2b_3d(LiteralTransport),
    Literal1_2d_3d(LiteralTransport),
    Literal2_2a_3d(LiteralTransport),
    Literal3_2f_3d(LiteralTransport),
    Literal4_40_3d(LiteralTransport),
    Literal5_2f_2f_3d(LiteralTransport),
    Literal6_25_3d(LiteralTransport),
    Literal7_2a_2a_3d(LiteralTransport),
    Literal8_3e_3e_3d(LiteralTransport),
    Literal9_3c_3c_3d(LiteralTransport),
    Literal10_26_3d(LiteralTransport),
    Literal11_5e_3d(LiteralTransport),
    Literal12_7c_3d(LiteralTransport),
    Literal13_3c(LiteralTransport),
    Literal14_3c_3d(LiteralTransport),
    Literal15_3d_3d(LiteralTransport),
    Literal16_21_3d(LiteralTransport),
    Literal17_3e_3d(LiteralTransport),
    Literal18_3e(LiteralTransport),
    Literal19_3c_3e(LiteralTransport),
    Literal20_6e_6f_74_20_69_6e(LiteralTransport),
    Literal21_69_73(LiteralTransport),
    Literal22_69_73_20_6e_6f_74(LiteralTransport),
    Literal23_7e(LiteralTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AnyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        // Read the JS object using napi-rs 3 Object API — all per-kind
        // struct decoders reuse the same napi_val, each reading their
        // own properties directly from the same JS object.
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in AnyTransport"))?;
        match kind_id {
            // kind: _as_pattern (__AS_PATTERN)
            165 => Ok(AnyTransport::_AsPattern(
                _AsPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _as_pattern_target (_AS_PATTERN_TARGET)
            284 => Ok(AnyTransport::AsPatternTarget(
                AsPatternTargetTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _assignment_eq (_ASSIGNMENT_EQ)
            240 => Ok(AnyTransport::AssignmentEq(
                AssignmentEqTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _assignment_type (_ASSIGNMENT_TYPE)
            241 => Ok(AnyTransport::AssignmentType(
                AssignmentTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _assignment_typed (_ASSIGNMENT_TYPED)
            242 => Ok(AnyTransport::AssignmentTyped(
                AssignmentTypedTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _comprehension_clauses (_COMPREHENSION_CLAUSES)
            224 => Ok(AnyTransport::ComprehensionClauses(
                ComprehensionClausesTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _format_expression (_FORMAT_EXPRESSION)
            285 => Ok(AnyTransport::FormatExpression(
                FormatExpressionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _import_list (_IMPORT_LIST)
            116 => Ok(AnyTransport::ImportList(
                ImportListTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _is_not (_IS_NOT)
            194 => Ok(AnyTransport::IsNot(
                IsNotTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _key_value_pattern (_KEY_VALUE_PATTERN)
            170 => Ok(AnyTransport::KeyValuePattern(
                KeyValuePatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _kw_async_marker (_KW_ASYNC_MARKER)
            250 => Ok(AnyTransport::KwAsyncMarker(
                KwAsyncMarkerTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _list_pattern (__LIST_PATTERN)
            167 => Ok(AnyTransport::_ListPattern(
                _ListPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _match_block (_MATCH_BLOCK)
            135 => Ok(AnyTransport::MatchBlock(
                MatchBlockTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _match_block_block (_MATCH_BLOCK_BLOCK)
            246 => Ok(AnyTransport::MatchBlockBlock(
                MatchBlockBlockTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _not_escape_sequence (_NOT_ESCAPE_SEQUENCE)
            235 => Ok(AnyTransport::NotEscapeSequence(
                NotEscapeSequenceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _not_in (_NOT_IN)
            193 => Ok(AnyTransport::NotIn(
                NotInTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _simple_pattern_negative (_SIMPLE_PATTERN_NEGATIVE)
            248 => Ok(AnyTransport::SimplePatternNegative(
                SimplePatternNegativeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _simple_statements (_SIMPLE_STATEMENTS)
            110 => Ok(AnyTransport::SimpleStatements(
                SimpleStatementsTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _tuple_pattern (__TUPLE_PATTERN)
            168 => Ok(AnyTransport::_TuplePattern(
                _TuplePatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _with_clause_paren (__WITH_CLAUSE_PAREN)
            245 => Ok(AnyTransport::_WithClauseParen(
                _WithClauseParenTransport::from_napi_value(env, napi_val)?
            )),
            // kind: aliased_import (ALIASED_IMPORT)
            117 => Ok(AnyTransport::AliasedImport(
                AliasedImportTransport::from_napi_value(env, napi_val)?
            )),
            // kind: argument_list (ARGUMENT_LIST)
            157 => Ok(AnyTransport::ArgumentList(
                ArgumentListTransport::from_napi_value(env, napi_val)?
            )),
            // kind: as_pattern (AS_PATTERN)
            185 => Ok(AnyTransport::AsPattern(
                AsPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: assert_statement (ASSERT_STATEMENT)
            121 => Ok(AnyTransport::AssertStatement(
                AssertStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: assignment (ASSIGNMENT)
            198 => Ok(AnyTransport::Assignment(
                AssignmentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: attribute (ATTRIBUTE)
            203 => Ok(AnyTransport::Attribute(
                AttributeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: augmented_assignment (AUGMENTED_ASSIGNMENT)
            199 => Ok(AnyTransport::AugmentedAssignment(
                AugmentedAssignmentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: await (AWAIT)
            237 => Ok(AnyTransport::Await(
                AwaitTransport::from_napi_value(env, napi_val)?
            )),
            // kind: binary_operator (BINARY_OPERATOR)
            191 => Ok(AnyTransport::BinaryOperator(
                BinaryOperatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: block (BLOCK)
            160 => Ok(AnyTransport::Block(
                BlockTransport::from_napi_value(env, napi_val)?
            )),
            // kind: boolean_operator (BOOLEAN_OPERATOR)
            190 => Ok(AnyTransport::BooleanOperator(
                BooleanOperatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: break_statement (BREAK_STATEMENT)
            129 => Ok(AnyTransport::BreakStatement(
                BreakStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: call (CALL)
            206 => Ok(AnyTransport::Call(
                CallTransport::from_napi_value(env, napi_val)?
            )),
            // kind: case_clause (CASE_CLAUSE)
            136 => Ok(AnyTransport::CaseClause(
                CaseClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: case_pattern (CASE_PATTERN)
            163 => Ok(AnyTransport::CasePattern(
                CasePatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: chevron (CHEVRON)
            120 => Ok(AnyTransport::Chevron(
                ChevronTransport::from_napi_value(env, napi_val)?
            )),
            // kind: class_definition (CLASS_DEFINITION)
            154 => Ok(AnyTransport::ClassDefinition(
                ClassDefinitionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: class_pattern (CLASS_PATTERN)
            173 => Ok(AnyTransport::ClassPattern(
                ClassPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: comment (COMMENT)
            99 => Ok(AnyTransport::Comment(
                CommentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: comparison_operator (COMPARISON_OPERATOR)
            195 => Ok(AnyTransport::ComparisonOperator(
                ComparisonOperatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: complex_pattern (COMPLEX_PATTERN)
            174 => Ok(AnyTransport::ComplexPattern(
                ComplexPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: concatenated_string (CONCATENATED_STRING)
            230 => Ok(AnyTransport::ConcatenatedString(
                ConcatenatedStringTransport::from_napi_value(env, napi_val)?
            )),
            // kind: conditional_expression (CONDITIONAL_EXPRESSION)
            229 => Ok(AnyTransport::ConditionalExpression(
                ConditionalExpressionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: constrained_type (CONSTRAINED_TYPE)
            212 => Ok(AnyTransport::ConstrainedType(
                ConstrainedTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: continue_statement (CONTINUE_STATEMENT)
            130 => Ok(AnyTransport::ContinueStatement(
                ContinueStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: decorated_definition (DECORATED_DEFINITION)
            158 => Ok(AnyTransport::DecoratedDefinition(
                DecoratedDefinitionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: decorator (DECORATOR)
            159 => Ok(AnyTransport::Decorator(
                DecoratorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: default_parameter (DEFAULT_PARAMETER)
            181 => Ok(AnyTransport::DefaultParameter(
                DefaultParameterTransport::from_napi_value(env, napi_val)?
            )),
            // kind: delete_statement (DELETE_STATEMENT)
            126 => Ok(AnyTransport::DeleteStatement(
                DeleteStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dict_pattern (DICT_PATTERN)
            169 => Ok(AnyTransport::DictPattern(
                DictPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dictionary (DICTIONARY)
            218 => Ok(AnyTransport::Dictionary(
                DictionaryTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dictionary_comprehension (DICTIONARY_COMPREHENSION)
            221 => Ok(AnyTransport::DictionaryComprehension(
                DictionaryComprehensionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dictionary_splat (DICTIONARY_SPLAT)
            149 => Ok(AnyTransport::DictionarySplat(
                DictionarySplatTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dictionary_splat_pattern (DICTIONARY_SPLAT_PATTERN)
            184 => Ok(AnyTransport::DictionarySplatPattern(
                DictionarySplatPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: dotted_name (DOTTED_NAME)
            162 => Ok(AnyTransport::DottedName(
                DottedNameTransport::from_napi_value(env, napi_val)?
            )),
            // kind: elif_clause (ELIF_CLAUSE)
            132 => Ok(AnyTransport::ElifClause(
                ElifClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ellipsis (ELLIPSIS2)
            87 => Ok(AnyTransport::Ellipsis2(
                Ellipsis2Transport::from_napi_value(env, napi_val)?
            )),
            // kind: else_clause (ELSE_CLAUSE)
            133 => Ok(AnyTransport::ElseClause(
                ElseClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: escape_sequence (ESCAPE_SEQUENCE)
            89 => Ok(AnyTransport::EscapeSequence(
                EscapeSequenceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: except_clause (EXCEPT_CLAUSE)
            140 => Ok(AnyTransport::ExceptClause(
                ExceptClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: exec_statement (EXEC_STATEMENT)
            152 => Ok(AnyTransport::ExecStatement(
                ExecStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: expression_list (EXPRESSION_LIST)
            161 => Ok(AnyTransport::ExpressionList(
                ExpressionListTransport::from_napi_value(env, napi_val)?
            )),
            // kind: expression_statement_tuple (EXPRESSION_STATEMENT_TUPLE)
            243 => Ok(AnyTransport::ExpressionStatementTuple(
                ExpressionStatementTupleTransport::from_napi_value(env, napi_val)?
            )),
            // kind: expression_statement (EXPRESSION_STATEMENT)
            122 => Ok(AnyTransport::ExpressionStatement(
                ExpressionStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: false (FALSE)
            97 => Ok(AnyTransport::False(
                FalseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: finally_clause (FINALLY_CLAUSE)
            141 => Ok(AnyTransport::FinallyClause(
                FinallyClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: float (FLOAT)
            94 => Ok(AnyTransport::Float(
                FloatTransport::from_napi_value(env, napi_val)?
            )),
            // kind: for_in_clause (FOR_IN_CLAUSE)
            227 => Ok(AnyTransport::ForInClause(
                ForInClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: for_statement (FOR_STATEMENT)
            137 => Ok(AnyTransport::ForStatement(
                ForStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: format_specifier (FORMAT_SPECIFIER)
            236 => Ok(AnyTransport::FormatSpecifier(
                FormatSpecifierTransport::from_napi_value(env, napi_val)?
            )),
            // kind: function_definition (FUNCTION_DEFINITION)
            145 => Ok(AnyTransport::FunctionDefinition(
                FunctionDefinitionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: future_import_statement (FUTURE_IMPORT_STATEMENT)
            114 => Ok(AnyTransport::FutureImportStatement(
                FutureImportStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: generator_expression (GENERATOR_EXPRESSION)
            223 => Ok(AnyTransport::GeneratorExpression(
                GeneratorExpressionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: generic_type (GENERIC_TYPE)
            210 => Ok(AnyTransport::GenericType(
                GenericTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: global_statement (GLOBAL_STATEMENT)
            150 => Ok(AnyTransport::GlobalStatement(
                GlobalStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: identifier (IDENTIFIER)
            1 => Ok(AnyTransport::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            // kind: if_clause (IF_CLAUSE)
            228 => Ok(AnyTransport::IfClause(
                IfClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: if_statement (IF_STATEMENT)
            131 => Ok(AnyTransport::IfStatement(
                IfStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: import_from_statement (IMPORT_FROM_STATEMENT)
            115 => Ok(AnyTransport::ImportFromStatement(
                ImportFromStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: import_prefix (IMPORT_PREFIX)
            112 => Ok(AnyTransport::ImportPrefix(
                ImportPrefixTransport::from_napi_value(env, napi_val)?
            )),
            // kind: import_statement (IMPORT_STATEMENT)
            111 => Ok(AnyTransport::ImportStatement(
                ImportStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: integer (INTEGER)
            93 => Ok(AnyTransport::Integer(
                IntegerTransport::from_napi_value(env, napi_val)?
            )),
            // kind: interpolation (INTERPOLATION)
            233 => Ok(AnyTransport::Interpolation(
                InterpolationTransport::from_napi_value(env, napi_val)?
            )),
            // kind: keyword_argument (KEYWORD_ARGUMENT)
            214 => Ok(AnyTransport::KeywordArgument(
                KeywordArgumentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: keyword_pattern (KEYWORD_PATTERN)
            171 => Ok(AnyTransport::KeywordPattern(
                KeywordPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: keyword_separator (KEYWORD_SEPARATOR)
            239 => Ok(AnyTransport::KeywordSeparator(
                KeywordSeparatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: lambda (LAMBDA)
            196 => Ok(AnyTransport::Lambda(
                LambdaTransport::from_napi_value(env, napi_val)?
            )),
            // kind: lambda_parameters (LAMBDA_PARAMETERS)
            147 => Ok(AnyTransport::LambdaParameters(
                LambdaParametersTransport::from_napi_value(env, napi_val)?
            )),
            // kind: lambda_within_for_in_clause (LAMBDA_WITHIN_FOR_IN_CLAUSE)
            197 => Ok(AnyTransport::LambdaWithinForInClause(
                LambdaWithinForInClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: line_continuation (LINE_CONTINUATION)
            100 => Ok(AnyTransport::LineContinuation(
                LineContinuationTransport::from_napi_value(env, napi_val)?
            )),
            // kind: list (LIST)
            215 => Ok(AnyTransport::List(
                ListTransport::from_napi_value(env, napi_val)?
            )),
            // kind: list_comprehension (LIST_COMPREHENSION)
            220 => Ok(AnyTransport::ListComprehension(
                ListComprehensionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: list_pattern (LIST_PATTERN)
            180 => Ok(AnyTransport::ListPattern(
                ListPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: list_splat (LIST_SPLAT)
            148 => Ok(AnyTransport::ListSplat(
                ListSplatTransport::from_napi_value(env, napi_val)?
            )),
            // kind: list_splat_pattern (LIST_SPLAT_PATTERN)
            183 => Ok(AnyTransport::ListSplatPattern(
                ListSplatPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: match_statement (MATCH_STATEMENT)
            134 => Ok(AnyTransport::MatchStatement(
                MatchStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: member_type (MEMBER_TYPE)
            213 => Ok(AnyTransport::MemberType(
                MemberTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: module (MODULE)
            108 => Ok(AnyTransport::Module(
                ModuleTransport::from_napi_value(env, napi_val)?
            )),
            // kind: named_expression (NAMED_EXPRESSION)
            123 => Ok(AnyTransport::NamedExpression(
                NamedExpressionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: none (NONE)
            98 => Ok(AnyTransport::None(
                NoneTransport::from_napi_value(env, napi_val)?
            )),
            // kind: nonlocal_statement (NONLOCAL_STATEMENT)
            151 => Ok(AnyTransport::NonlocalStatement(
                NonlocalStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: not_operator (NOT_OPERATOR)
            189 => Ok(AnyTransport::NotOperator(
                NotOperatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: pair (PAIR)
            219 => Ok(AnyTransport::Pair(
                PairTransport::from_napi_value(env, napi_val)?
            )),
            // kind: parameters (PARAMETERS)
            146 => Ok(AnyTransport::Parameters(
                ParametersTransport::from_napi_value(env, napi_val)?
            )),
            // kind: parenthesized_expression (PARENTHESIZED_EXPRESSION)
            225 => Ok(AnyTransport::ParenthesizedExpression(
                ParenthesizedExpressionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: parenthesized_list_splat (PARENTHESIZED_LIST_SPLAT)
            156 => Ok(AnyTransport::ParenthesizedListSplat(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            )),
            // kind: pass_statement (PASS_STATEMENT)
            128 => Ok(AnyTransport::PassStatement(
                PassStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: pattern_list (PATTERN_LIST)
            200 => Ok(AnyTransport::PatternList(
                PatternListTransport::from_napi_value(env, napi_val)?
            )),
            // kind: positional_separator (POSITIONAL_SEPARATOR)
            238 => Ok(AnyTransport::PositionalSeparator(
                PositionalSeparatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: print_statement (PRINT_STATEMENT)
            119 => Ok(AnyTransport::PrintStatement(
                PrintStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: raise_statement (RAISE_STATEMENT)
            127 => Ok(AnyTransport::RaiseStatement(
                RaiseStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: relative_import (RELATIVE_IMPORT)
            113 => Ok(AnyTransport::RelativeImport(
                RelativeImportTransport::from_napi_value(env, napi_val)?
            )),
            // kind: return_statement (RETURN_STATEMENT)
            125 => Ok(AnyTransport::ReturnStatement(
                ReturnStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: set (SET)
            216 => Ok(AnyTransport::Set(
                SetTransport::from_napi_value(env, napi_val)?
            )),
            // kind: set_comprehension (SET_COMPREHENSION)
            222 => Ok(AnyTransport::SetComprehension(
                SetComprehensionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: slice (SLICE)
            205 => Ok(AnyTransport::Slice(
                SliceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: splat_pattern (SPLAT_PATTERN)
            172 => Ok(AnyTransport::SplatPattern(
                SplatPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: splat_type (SPLAT_TYPE)
            209 => Ok(AnyTransport::SplatType(
                SplatTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: string (STRING)
            231 => Ok(AnyTransport::String(
                StringTransport::from_napi_value(env, napi_val)?
            )),
            // kind: string_content (STRING_CONTENT)
            232 => Ok(AnyTransport::StringContent(
                StringContentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: subscript (SUBSCRIPT)
            204 => Ok(AnyTransport::Subscript(
                SubscriptTransport::from_napi_value(env, napi_val)?
            )),
            // kind: true (TRUE)
            96 => Ok(AnyTransport::True(
                TrueTransport::from_napi_value(env, napi_val)?
            )),
            // kind: try_statement (TRY_STATEMENT)
            139 => Ok(AnyTransport::TryStatement(
                TryStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: tuple (TUPLE)
            217 => Ok(AnyTransport::Tuple(
                TupleTransport::from_napi_value(env, napi_val)?
            )),
            // kind: tuple_pattern (TUPLE_PATTERN)
            179 => Ok(AnyTransport::TuplePattern(
                TuplePatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: type (TYPE)
            208 => Ok(AnyTransport::Type(
                TypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: type_alias_statement (TYPE_ALIAS_STATEMENT)
            153 => Ok(AnyTransport::TypeAliasStatement(
                TypeAliasStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: type_conversion (TYPE_CONVERSION)
            92 => Ok(AnyTransport::TypeConversion(
                TypeConversionTransport::from_napi_value(env, napi_val)?
            )),
            // kind: type_parameter (TYPE_PARAMETER)
            155 => Ok(AnyTransport::TypeParameter(
                TypeParameterTransport::from_napi_value(env, napi_val)?
            )),
            // kind: typed_default_parameter (TYPED_DEFAULT_PARAMETER)
            182 => Ok(AnyTransport::TypedDefaultParameter(
                TypedDefaultParameterTransport::from_napi_value(env, napi_val)?
            )),
            // kind: typed_parameter (TYPED_PARAMETER)
            207 => Ok(AnyTransport::TypedParameter(
                TypedParameterTransport::from_napi_value(env, napi_val)?
            )),
            // kind: unary_operator (UNARY_OPERATOR)
            192 => Ok(AnyTransport::UnaryOperator(
                UnaryOperatorTransport::from_napi_value(env, napi_val)?
            )),
            // kind: union_pattern (UNION_PATTERN)
            166 => Ok(AnyTransport::UnionPattern(
                UnionPatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: union_type (UNION_TYPE)
            211 => Ok(AnyTransport::UnionType(
                UnionTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: while_statement (WHILE_STATEMENT)
            138 => Ok(AnyTransport::WhileStatement(
                WhileStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: wildcard_import (WILDCARD_IMPORT)
            118 => Ok(AnyTransport::WildcardImport(
                WildcardImportTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with_clause_bare (WITH_CLAUSE_BARE)
            244 => Ok(AnyTransport::WithClauseBare(
                WithClauseBareTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with_clause_paren (WITH_CLAUSE_PAREN)
            245 => Ok(AnyTransport::WithClauseParen(
                WithClauseParenTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with_clause (WITH_CLAUSE)
            143 => Ok(AnyTransport::WithClause(
                WithClauseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with_item (WITH_ITEM)
            144 => Ok(AnyTransport::WithItem(
                WithItemTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with_statement (WITH_STATEMENT)
            142 => Ok(AnyTransport::WithStatement(
                WithStatementTransport::from_napi_value(env, napi_val)?
            )),
            // kind: yield (YIELD)
            202 => Ok(AnyTransport::Yield(
                YieldTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _newline (_NEWLINE)
            101 => Ok(AnyTransport::Newline(
                NewlineTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _indent (_INDENT)
            102 => Ok(AnyTransport::Indent(
                IndentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _dedent (_DEDENT)
            103 => Ok(AnyTransport::Dedent(
                DedentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: string_start (STRING_START)
            104 => Ok(AnyTransport::StringStart(
                StringStartTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _string_content (__STRING_CONTENT)
            105 => Ok(AnyTransport::_StringContent(
                _StringContentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: escape_interpolation (ESCAPE_INTERPOLATION)
            106 => Ok(AnyTransport::EscapeInterpolation(
                EscapeInterpolationTransport::from_napi_value(env, napi_val)?
            )),
            // kind: string_end (STRING_END)
            107 => Ok(AnyTransport::StringEnd(
                StringEndTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ] (CLOSE_BRACKET)
            46 => Ok(AnyTransport::CloseBracket(
                CloseBracketTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ) (CLOSE_PAREN)
            8 => Ok(AnyTransport::CloseParen(
                CloseParenTransport::from_napi_value(env, napi_val)?
            )),
            // kind: } (CLOSE_BRACE)
            51 => Ok(AnyTransport::CloseBrace(
                CloseBraceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: except (EXCEPT)
            33 => Ok(AnyTransport::Except(
                ExceptTransport::from_napi_value(env, napi_val)?
            )),
            // kind: as (AS)
            10 => Ok(AnyTransport::As(
                AsTransport::from_napi_value(env, napi_val)?
            )),
            // kind: = (EQ)
            43 => Ok(AnyTransport::Eq(
                EqTransport::from_napi_value(env, napi_val)?
            )),
            // kind: : (COLON)
            23 => Ok(AnyTransport::Colon(
                ColonTransport::from_napi_value(env, napi_val)?
            )),
            // kind: async (ASYNC)
            28 => Ok(AnyTransport::Async(
                AsyncTransport::from_napi_value(env, napi_val)?
            )),
            // kind: [ (BRACKET)
            45 => Ok(AnyTransport::Bracket(
                BracketTransport::from_napi_value(env, napi_val)?
            )),
            // kind: \ (TOK_BS)
            90 => Ok(AnyTransport::TokBs(
                TokBsTransport::from_napi_value(env, napi_val)?
            )),
            // kind: - (MINUS)
            53 => Ok(AnyTransport::Minus(
                MinusTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ( (PAREN)
            7 => Ok(AnyTransport::Paren(
                ParenTransport::from_napi_value(env, napi_val)?
            )),
            // kind: , (COMMA)
            9 => Ok(AnyTransport::Comma(
                CommaTransport::from_napi_value(env, napi_val)?
            )),
            // kind: assert (ASSERT)
            14 => Ok(AnyTransport::Assert(
                AssertTransport::from_napi_value(env, napi_val)?
            )),
            // kind: . (DOT)
            4 => Ok(AnyTransport::Dot(
                DotTransport::from_napi_value(env, napi_val)?
            )),
            // kind: + (PLUS)
            52 => Ok(AnyTransport::Plus(
                PlusTransport::from_napi_value(env, napi_val)?
            )),
            // kind: * (STAR)
            11 => Ok(AnyTransport::Star(
                StarTransport::from_napi_value(env, napi_val)?
            )),
            // kind: @ (AT)
            47 => Ok(AnyTransport::At(
                AtTransport::from_napi_value(env, napi_val)?
            )),
            // kind: / (SLASH)
            57 => Ok(AnyTransport::Slash(
                SlashTransport::from_napi_value(env, napi_val)?
            )),
            // kind: % (PERCENT)
            58 => Ok(AnyTransport::Percent(
                PercentTransport::from_napi_value(env, napi_val)?
            )),
            // kind: // (SLASHSLASH)
            59 => Ok(AnyTransport::Slashslash(
                SlashslashTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ** (STARSTAR)
            39 => Ok(AnyTransport::Starstar(
                StarstarTransport::from_napi_value(env, napi_val)?
            )),
            // kind: | (PIPE)
            49 => Ok(AnyTransport::Pipe(
                PipeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: & (AMP)
            60 => Ok(AnyTransport::Amp(
                AmpTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ^ (CARET)
            61 => Ok(AnyTransport::Caret(
                CaretTransport::from_napi_value(env, napi_val)?
            )),
            // kind: << (SHL)
            62 => Ok(AnyTransport::Shl(
                ShlTransport::from_napi_value(env, napi_val)?
            )),
            // kind: >> (SHR)
            13 => Ok(AnyTransport::Shr(
                ShrTransport::from_napi_value(env, napi_val)?
            )),
            // kind: and (AND)
            55 => Ok(AnyTransport::And(
                AndTransport::from_napi_value(env, napi_val)?
            )),
            // kind: or (OR)
            56 => Ok(AnyTransport::Or(
                OrTransport::from_napi_value(env, napi_val)?
            )),
            // kind: break (BREAK)
            20 => Ok(AnyTransport::Break(
                BreakTransport::from_napi_value(env, napi_val)?
            )),
            // kind: case (CASE)
            27 => Ok(AnyTransport::Case(
                CaseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: class (CLASS)
            44 => Ok(AnyTransport::Class(
                ClassTransport::from_napi_value(env, napi_val)?
            )),
            // kind: if (IF)
            22 => Ok(AnyTransport::If(
                IfTransport::from_napi_value(env, napi_val)?
            )),
            // kind: else (ELSE)
            25 => Ok(AnyTransport::Else(
                ElseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: continue (CONTINUE)
            21 => Ok(AnyTransport::Continue(
                ContinueTransport::from_napi_value(env, napi_val)?
            )),
            // kind: del (DEL)
            17 => Ok(AnyTransport::Del(
                DelTransport::from_napi_value(env, napi_val)?
            )),
            // kind: { (BRACE)
            50 => Ok(AnyTransport::Brace(
                BraceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: elif (ELIF)
            24 => Ok(AnyTransport::Elif(
                ElifTransport::from_napi_value(env, napi_val)?
            )),
            // kind: exec (EXEC)
            42 => Ok(AnyTransport::Exec(
                ExecTransport::from_napi_value(env, napi_val)?
            )),
            // kind: in (IN)
            30 => Ok(AnyTransport::In(
                InTransport::from_napi_value(env, napi_val)?
            )),
            // kind: finally (FINALLY)
            35 => Ok(AnyTransport::Finally(
                FinallyTransport::from_napi_value(env, napi_val)?
            )),
            // kind: for (FOR)
            29 => Ok(AnyTransport::For(
                ForTransport::from_napi_value(env, napi_val)?
            )),
            // kind: def (DEF)
            37 => Ok(AnyTransport::Def(
                DefTransport::from_napi_value(env, napi_val)?
            )),
            // kind: -> (ARROW)
            38 => Ok(AnyTransport::Arrow(
                ArrowTransport::from_napi_value(env, napi_val)?
            )),
            // kind: from (FROM)
            5 => Ok(AnyTransport::From(
                FromTransport::from_napi_value(env, napi_val)?
            )),
            // kind: __future__ (_FUTURE_U)
            6 => Ok(AnyTransport::FutureU(
                FutureUTransport::from_napi_value(env, napi_val)?
            )),
            // kind: import (IMPORT)
            3 => Ok(AnyTransport::Import(
                ImportTransport::from_napi_value(env, napi_val)?
            )),
            // kind: global (GLOBAL)
            40 => Ok(AnyTransport::Global(
                GlobalTransport::from_napi_value(env, napi_val)?
            )),
            // kind: match (MATCH)
            26 => Ok(AnyTransport::Match(
                MatchTransport::from_napi_value(env, napi_val)?
            )),
            // kind: := (COLONEQ)
            15 => Ok(AnyTransport::Coloneq(
                ColoneqTransport::from_napi_value(env, napi_val)?
            )),
            // kind: nonlocal (NONLOCAL)
            41 => Ok(AnyTransport::Nonlocal(
                NonlocalTransport::from_napi_value(env, napi_val)?
            )),
            // kind: not (NOT)
            54 => Ok(AnyTransport::Not(
                NotTransport::from_napi_value(env, napi_val)?
            )),
            // kind: pass (PASS)
            19 => Ok(AnyTransport::Pass(
                PassTransport::from_napi_value(env, napi_val)?
            )),
            // kind: print (PRINT)
            12 => Ok(AnyTransport::Print(
                PrintTransport::from_napi_value(env, napi_val)?
            )),
            // kind: raise (RAISE)
            18 => Ok(AnyTransport::Raise(
                RaiseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: return (RETURN)
            16 => Ok(AnyTransport::Return(
                ReturnTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _ (_ANONYMOUS)
            48 => Ok(AnyTransport::Anonymous(
                AnonymousTransport::from_napi_value(env, napi_val)?
            )),
            // kind: try (TRY)
            32 => Ok(AnyTransport::Try(
                TryTransport::from_napi_value(env, napi_val)?
            )),
            // kind: while (WHILE)
            31 => Ok(AnyTransport::While(
                WhileTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with (WITH)
            36 => Ok(AnyTransport::With(
                WithTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: += → "+="
            73 => Ok(AnyTransport::Literal0_2b_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: -= → "-="
            74 => Ok(AnyTransport::Literal1_2d_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: *= → "*="
            75 => Ok(AnyTransport::Literal2_2a_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: /= → "/="
            76 => Ok(AnyTransport::Literal3_2f_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: @= → "@="
            77 => Ok(AnyTransport::Literal4_40_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: //= → "//="
            78 => Ok(AnyTransport::Literal5_2f_2f_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: %= → "%="
            79 => Ok(AnyTransport::Literal6_25_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: **= → "**="
            80 => Ok(AnyTransport::Literal7_2a_2a_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: >>= → ">>="
            81 => Ok(AnyTransport::Literal8_3e_3e_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: <<= → "<<="
            82 => Ok(AnyTransport::Literal9_3c_3c_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: &= → "&="
            83 => Ok(AnyTransport::Literal10_26_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: ^= → "^="
            84 => Ok(AnyTransport::Literal11_5e_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: |= → "|="
            85 => Ok(AnyTransport::Literal12_7c_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: < → "<"
            65 => Ok(AnyTransport::Literal13_3c(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: <= → "<="
            66 => Ok(AnyTransport::Literal14_3c_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: == → "=="
            67 => Ok(AnyTransport::Literal15_3d_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: != → "!="
            68 => Ok(AnyTransport::Literal16_21_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: >= → ">="
            69 => Ok(AnyTransport::Literal17_3e_3d(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: > → ">"
            70 => Ok(AnyTransport::Literal18_3e(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: <> → "<>"
            71 => Ok(AnyTransport::Literal19_3c_3e(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: not in → "not in"
            193 => Ok(AnyTransport::Literal20_6e_6f_74_20_69_6e(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: is → "is"
            64 => Ok(AnyTransport::Literal21_69_73(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: is not → "is not"
            194 => Ok(AnyTransport::Literal22_69_73_20_6e_6f_74(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: ~ → "~"
            63 => Ok(AnyTransport::Literal23_7e(
                LiteralTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {other} in AnyTransport"
            ))),
        }
    }
}
#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnyTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnyTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnyTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnyTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, *val)
    }
}


#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LiteralTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct _AsPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AsPatternTargetTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentEqTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentTypedTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ComprehensionClausesTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FormatExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImportListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IsNotTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct KeyValuePatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub key: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct KwAsyncMarkerTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct _ListPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MatchBlockTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MatchBlockBlockTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub alternative: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NotEscapeSequenceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NotInTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SimplePatternNegativeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SimpleStatementsTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SuiteTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct _TuplePatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct _WithClauseParenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AliasedImportTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    pub alias: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ArgumentListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AsPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
    pub alias: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssertStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone)]
pub enum AssignmentTransport {
    AssignmentUFormEq(AssignmentUFormEqTransport),
    AssignmentUFormType(AssignmentUFormTypeTransport),
    AssignmentUFormTyped(AssignmentUFormTypedTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AssignmentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let variant: String = obj.get("$variant")?
            .ok_or_else(|| ::napi::Error::from_reason("$variant property missing"))?;
        match variant.as_str() {
            "eq" => Ok(Self::AssignmentUFormEq(
                AssignmentUFormEqTransport::from_napi_value(env, napi_val)?
            )),
            "type" => Ok(Self::AssignmentUFormType(
                AssignmentUFormTypeTransport::from_napi_value(env, napi_val)?
            )),
            "typed" => Ok(Self::AssignmentUFormTyped(
                AssignmentUFormTypedTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown $variant {:?} for AssignmentTransport",
                other
            ))),
        }
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentUFormEqTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentUFormTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssignmentUFormTypedTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AttributeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub object: Box<AnyTransport>,
    pub attribute: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AugmentedAssignmentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AwaitTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub primary_expression: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BinaryOperatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BlockTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BooleanOperatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    pub operator: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BreakStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CallTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub function: Box<AnyTransport>,
    pub arguments: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CaseClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub guard: Option<Box<AnyTransport>>,
    pub consequence: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CasePatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ChevronTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ClassDefinitionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    pub type_parameters: Option<Box<AnyTransport>>,
    pub superclasses: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ClassPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub dotted_name: Box<AnyTransport>,
    pub arguments: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CommentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ComparisonOperatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    pub operators: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ComplexPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub real: Option<Box<AnyTransport>>,
    pub imaginary: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ConcatenatedStringTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ConditionalExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    pub condition: Box<AnyTransport>,
    pub alternative: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ConstrainedTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub base_type: Box<AnyTransport>,
    pub constraint: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ContinueStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DecoratedDefinitionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub definition: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DecoratorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
    pub newline: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DefaultParameterTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DeleteStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DictPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DictionaryTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DictionaryComprehensionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DictionarySplatTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DictionarySplatPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DottedNameTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ElifClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub condition: Box<AnyTransport>,
    pub consequence: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct Ellipsis2Transport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ElseClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct EscapeSequenceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExceptClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub value: Option<Vec<Box<AnyTransport>>>,
    pub alias: Option<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExecStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub code: Box<AnyTransport>,
    pub in_clause: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExpressionListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExpressionStatementTupleTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone)]
pub enum ExpressionStatementTransport {
    ExpressionStatementUFormTuple(ExpressionStatementUFormTupleTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ExpressionStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let variant: String = obj.get("$variant")?
            .ok_or_else(|| ::napi::Error::from_reason("$variant property missing"))?;
        match variant.as_str() {
            "tuple" => Ok(Self::ExpressionStatementUFormTuple(
                ExpressionStatementUFormTupleTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown $variant {:?} for ExpressionStatementTransport",
                other
            ))),
        }
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExpressionStatementUFormTupleTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FalseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FinallyClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub block: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FloatTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ForInClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub async_marker: Option<Box<AnyTransport>>,
    pub left: Box<AnyTransport>,
    pub right: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ForStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub async_marker: Option<Box<AnyTransport>>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
    pub alternative: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FormatSpecifierTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FunctionDefinitionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub async_marker: Option<Box<AnyTransport>>,
    pub name: Box<AnyTransport>,
    pub type_parameters: Option<Box<AnyTransport>>,
    pub parameters: Box<AnyTransport>,
    pub return_type: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FutureImportStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GeneratorExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GenericTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub identifier: Box<AnyTransport>,
    pub type_parameter: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GlobalStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IdentifierTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IfClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IfStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub condition: Box<AnyTransport>,
    pub consequence: Box<AnyTransport>,
    pub alternative: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImportFromStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub module_name: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImportPrefixTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImportStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IntegerTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InterpolationTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
    pub type_conversion: Option<Box<AnyTransport>>,
    pub format_specifier: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct KeywordArgumentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct KeywordPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub identifier: Box<AnyTransport>,
    pub simple_pattern: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct KeywordSeparatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LambdaTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub parameters: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LambdaParametersTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LambdaWithinForInClauseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub parameters: Option<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LineContinuationTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListComprehensionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListSplatTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub expression: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListSplatPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MatchStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub subject: Vec<Box<AnyTransport>>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MemberTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub base_type: Box<AnyTransport>,
    pub identifier: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ModuleTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NoneTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NonlocalStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NotOperatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub argument: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PairTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub key: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ParametersTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ParenthesizedExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ParenthesizedListSplatTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PassStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PatternListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PositionalSeparatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PrintStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub argument: Vec<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct RaiseStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub cause: Option<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct RelativeImportTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub import_prefix: Box<AnyTransport>,
    pub dotted_name: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ReturnStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Vec<Box<AnyTransport>>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SetTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SetComprehensionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SliceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub start: Option<Box<AnyTransport>>,
    pub stop: Option<Box<AnyTransport>>,
    pub step: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SplatPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub identifier: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SplatTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub identifier: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub string_start: Box<AnyTransport>,
    pub content: Vec<Box<AnyTransport>>,
    pub string_end: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringContentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SubscriptTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub value: Box<AnyTransport>,
    pub subscript: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TrueTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TryStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub body: Box<AnyTransport>,
    pub except_clauses: Vec<Box<AnyTransport>>,
    pub else_clause: Option<Box<AnyTransport>>,
    pub finally_clause: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TupleTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TuplePatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypeAliasStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: Box<AnyTransport>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypeConversionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypeParameterTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypedDefaultParameterTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub name: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: Box<AnyTransport>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TypedParameterTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnaryOperatorTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub operator: Box<AnyTransport>,
    pub argument: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnionPatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnionTypeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub left: Box<AnyTransport>,
    pub right: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WhileStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub condition: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
    pub alternative: Option<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WildcardImportTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithClauseBareTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithClauseParenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[derive(Debug, Clone)]
pub enum WithClauseTransport {
    WithClauseUFormBare(WithClauseUFormBareTransport),
    WithClauseUFormParen(WithClauseUFormParenTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for WithClauseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let variant: String = obj.get("$variant")?
            .ok_or_else(|| ::napi::Error::from_reason("$variant property missing"))?;
        match variant.as_str() {
            "bare" => Ok(Self::WithClauseUFormBare(
                WithClauseUFormBareTransport::from_napi_value(env, napi_val)?
            )),
            "paren" => Ok(Self::WithClauseUFormParen(
                WithClauseUFormParenTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown $variant {:?} for WithClauseTransport",
                other
            ))),
        }
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithClauseUFormBareTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithClauseUFormParenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithItemTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub value: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithStatementTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    pub async_marker: Option<Box<AnyTransport>>,
    pub with_clause: Box<AnyTransport>,
    pub body: Box<AnyTransport>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct YieldTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub transport_text: Option<String>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<Box<AnyTransport>>,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NewlineTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IndentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DedentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringStartTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct _StringContentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct EscapeInterpolationTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringEndTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CloseBracketTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CloseParenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CloseBraceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExceptTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AsTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct EqTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ColonTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AsyncTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BracketTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TokBsTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MinusTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ParenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CommaTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AssertTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DotTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PlusTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StarTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AtTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SlashTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PercentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct SlashslashTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StarstarTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PipeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AmpTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CaretTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ShlTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ShrTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AndTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct OrTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BreakTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CaseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ClassTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IfTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ElseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ContinueTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DelTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BraceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ElifTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct EllipsisTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ExecTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct False2Transport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FinallyTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ForTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct DefTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ArrowTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FromTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FutureUTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImportTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GlobalTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MatchTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ColoneqTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct None2Transport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NonlocalTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NotTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PassTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PrintTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct RaiseTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ReturnTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AnonymousTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct True2Transport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TryTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WhileTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct WithTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$source"))]
    pub transport_source: Option<::sittir_core::types::Source>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$named"))]
    pub transport_named: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$span"))]
    pub transport_span: Option<::sittir_core::types::Span>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeId"))]
    pub transport_node_id: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$text"))]
    pub text: String,
}


#[derive(Debug, Clone, Copy)]
pub enum Renderable<'a> {
    Text(&'a str),
    Joined(::sittir_core::filters::Joined<'a>),
    Node(&'a AnyTransport),
}

impl ::std::fmt::Display for Renderable<'_> {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        match self {
            Self::Text(s) => f.write_str(s),
            Self::Joined(j) => ::std::fmt::Display::fmt(j, f),
            Self::Node(t) => {
                let s = render_transport_dispatch(t).map_err(|_| ::std::fmt::Error)?;
                f.write_str(&s)
            }
        }
    }
}

impl ::askama::FastWritable for Renderable<'_> {
    fn write_into<W: ::std::fmt::Write + ?Sized>(
        &self,
        dest: &mut W,
        values: &dyn ::askama::Values,
    ) -> Result<(), ::askama::Error> {
        match self {
            Self::Text(s) => dest.write_str(s).map_err(::askama::Error::from),
            Self::Joined(j) => j.write_into(dest, values),
            Self::Node(t) => {
                let s = render_transport_dispatch(t)?;
                dest.write_str(&s).map_err(::askama::Error::from)
            }
        }
    }
}

fn render__as_pattern_transport(node: &_AsPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = _AsPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_as_pattern_target_transport(node: &AsPatternTargetTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = AsPatternTargetTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_assignment_eq_transport(node: &AssignmentEqTransport) -> Result<String, ::askama::Error> {
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = AssignmentEqTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_assignment_type_transport(node: &AssignmentTypeTransport) -> Result<String, ::askama::Error> {
    let r#type_text = render_transport_dispatch(node.r#type.as_ref())?;
    let template = AssignmentTypeTemplate {
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(r#type_text.as_str())),
    };
    template.render()
}

fn render_assignment_typed_transport(node: &AssignmentTypedTransport) -> Result<String, ::askama::Error> {
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let r#type_text = render_transport_dispatch(node.r#type.as_ref())?;
    let template = AssignmentTypedTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(r#type_text.as_str())),
    };
    template.render()
}

fn render_comprehension_clauses_transport(node: &ComprehensionClausesTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ComprehensionClausesTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_format_expression_transport(node: &FormatExpressionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = FormatExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_import_list_transport(node: &ImportListTransport) -> Result<String, ::askama::Error> {
    Ok(node.transport_text.clone().unwrap_or_default())
}

fn render_is_not_transport(t: &IsNotTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_key_value_pattern_transport(node: &KeyValuePatternTransport) -> Result<String, ::askama::Error> {
    Ok(node.transport_text.clone().unwrap_or_default())
}

fn render_kw_async_marker_transport(t: &KwAsyncMarkerTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render__list_pattern_transport(node: &_ListPatternTransport) -> Result<String, ::askama::Error> {
    let mut out = String::new();
    for child in node.children.iter() {
        out.push_str(&render_transport_dispatch(child.as_ref())?);
    }
    Ok(out)
}

fn render_match_block_transport(node: &MatchBlockTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = MatchBlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_match_block_block_transport(node: &MatchBlockBlockTransport) -> Result<String, ::askama::Error> {
    let alternative_strings: Vec<String> = node.alternative.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let alternative_buf: Vec<::sittir_core::filters::Renderable<'_>> = alternative_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = MatchBlockBlockTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: alternative_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_not_escape_sequence_transport(t: &NotEscapeSequenceTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_not_in_transport(t: &NotInTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_simple_pattern_negative_transport(node: &SimplePatternNegativeTransport) -> Result<String, ::askama::Error> {
    let template = SimplePatternNegativeTemplate {
        text: node.transport_text.as_deref().unwrap_or(""),
    };
    template.render()
}

fn render_simple_statements_transport(node: &SimpleStatementsTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = SimpleStatementsTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_suite_transport(node: &SuiteTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = SuiteTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render__tuple_pattern_transport(node: &_TuplePatternTransport) -> Result<String, ::askama::Error> {
    let mut out = String::new();
    for child in node.children.iter() {
        out.push_str(&render_transport_dispatch(child.as_ref())?);
    }
    Ok(out)
}

fn render__with_clause_paren_transport(node: &_WithClauseParenTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = _WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_aliased_import_transport(node: &AliasedImportTransport) -> Result<String, ::askama::Error> {
    let alias_text = render_transport_dispatch(node.alias.as_ref())?;
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let template = AliasedImportTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(alias_text.as_str())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
    };
    template.render()
}

fn render_argument_list_transport(node: &ArgumentListTransport) -> Result<String, ::askama::Error> {
    let children_owned: &[Box<AnyTransport>] = node.children.as_deref().unwrap_or(&[]);
    let children_strings: Vec<String> = children_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ArgumentListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_as_pattern_transport(node: &AsPatternTransport) -> Result<String, ::askama::Error> {
    let alias_text = render_transport_dispatch(node.alias.as_ref())?;
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let template = AsPatternTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(alias_text.as_str())),
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
    };
    template.render()
}

fn render_assert_statement_transport(node: &AssertStatementTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = AssertStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_assignment_transport(t: &AssignmentTransport) -> Result<String, ::askama::Error> {
    match t {
        AssignmentTransport::AssignmentUFormEq(data) => render_assignment_uform_eq_transport(data),
        AssignmentTransport::AssignmentUFormType(data) => render_assignment_uform_type_transport(data),
        AssignmentTransport::AssignmentUFormTyped(data) => render_assignment_uform_typed_transport(data),
    }
}

fn render_assignment_uform_eq_transport(node: &AssignmentUFormEqTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
    };
    template.render()
}

fn render_assignment_uform_type_transport(node: &AssignmentUFormTypeTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
    };
    template.render()
}

fn render_assignment_uform_typed_transport(node: &AssignmentUFormTypedTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
    };
    template.render()
}

fn render_attribute_transport(node: &AttributeTransport) -> Result<String, ::askama::Error> {
    let attribute_text = render_transport_dispatch(node.attribute.as_ref())?;
    let object_text = render_transport_dispatch(node.object.as_ref())?;
    let template = AttributeTemplate {
        attribute: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(attribute_text.as_str())),
        object: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(object_text.as_str())),
    };
    template.render()
}

fn render_augmented_assignment_transport(node: &AugmentedAssignmentTransport) -> Result<String, ::askama::Error> {
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let operator_text = render_transport_dispatch(node.operator.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = AugmentedAssignmentTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(operator_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_await_transport(node: &AwaitTransport) -> Result<String, ::askama::Error> {
    let primary_expression_text = render_transport_dispatch(node.primary_expression.as_ref())?;
    let template = AwaitTemplate {
        primary_expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(primary_expression_text.as_str())),
    };
    template.render()
}

fn render_binary_operator_transport(node: &BinaryOperatorTransport) -> Result<String, ::askama::Error> {
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let operator_text = render_transport_dispatch(node.operator.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = BinaryOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(operator_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_block_transport(node: &BlockTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = BlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_boolean_operator_transport(node: &BooleanOperatorTransport) -> Result<String, ::askama::Error> {
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let operator_text = render_transport_dispatch(node.operator.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = BooleanOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(operator_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_break_statement_transport(t: &BreakStatementTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_call_transport(node: &CallTransport) -> Result<String, ::askama::Error> {
    let arguments_text = render_transport_dispatch(node.arguments.as_ref())?;
    let function_text = render_transport_dispatch(node.function.as_ref())?;
    let template = CallTemplate {
        arguments: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(arguments_text.as_str())),
        function: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(function_text.as_str())),
    };
    template.render()
}

fn render_case_clause_transport(node: &CaseClauseTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let consequence_text = render_transport_dispatch(node.consequence.as_ref())?;
    let guard_text = if let Some(v) = &node.guard {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = CaseClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(consequence_text.as_str())),
        guard: if node.guard.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(guard_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_case_pattern_transport(node: &CasePatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = CasePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_chevron_transport(node: &ChevronTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let template = ChevronTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
    };
    template.render()
}

fn render_class_definition_transport(node: &ClassDefinitionTransport) -> Result<String, ::askama::Error> {
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let superclasses_text = if let Some(v) = &node.superclasses {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let type_parameters_text = if let Some(v) = &node.type_parameters {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = ClassDefinitionTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        superclasses: if node.superclasses.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(superclasses_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        type_parameters: if node.type_parameters.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(type_parameters_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_class_pattern_transport(node: &ClassPatternTransport) -> Result<String, ::askama::Error> {
    let arguments_strings: Vec<String> = node.arguments.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let arguments_buf: Vec<::sittir_core::filters::Renderable<'_>> = arguments_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let dotted_name_text = render_transport_dispatch(node.dotted_name.as_ref())?;
    let template = ClassPatternTemplate {
        arguments: ::sittir_core::filters::ListNonterminalView {
            items: arguments_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        dotted_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(dotted_name_text.as_str())),
    };
    template.render()
}

fn render_comment_transport(t: &CommentTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_comparison_operator_transport(node: &ComparisonOperatorTransport) -> Result<String, ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = Vec::new();
    let operators_strings: Vec<String> = node.operators.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let operators_buf: Vec<::sittir_core::filters::Renderable<'_>> = operators_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let template = ComparisonOperatorTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        operators: ::sittir_core::filters::ListNonterminalView {
            items: operators_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_complex_pattern_transport(node: &ComplexPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let imaginary_text = render_transport_dispatch(node.imaginary.as_ref())?;
    let real_text = if let Some(v) = &node.real {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = ComplexPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        imaginary: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(imaginary_text.as_str())),
        real: if node.real.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(real_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_concatenated_string_transport(node: &ConcatenatedStringTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ConcatenatedStringTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_conditional_expression_transport(node: &ConditionalExpressionTransport) -> Result<String, ::askama::Error> {
    let alternative_text = render_transport_dispatch(node.alternative.as_ref())?;
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let condition_text = render_transport_dispatch(node.condition.as_ref())?;
    let template = ConditionalExpressionTemplate {
        alternative: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(alternative_text.as_str())),
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(condition_text.as_str())),
    };
    template.render()
}

fn render_constrained_type_transport(node: &ConstrainedTypeTransport) -> Result<String, ::askama::Error> {
    let base_type_text = render_transport_dispatch(node.base_type.as_ref())?;
    let constraint_text = render_transport_dispatch(node.constraint.as_ref())?;
    let template = ConstrainedTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(base_type_text.as_str())),
        constraint: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(constraint_text.as_str())),
    };
    template.render()
}

fn render_continue_statement_transport(t: &ContinueStatementTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_decorated_definition_transport(node: &DecoratedDefinitionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let definition_text = render_transport_dispatch(node.definition.as_ref())?;
    let template = DecoratedDefinitionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        definition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(definition_text.as_str())),
    };
    template.render()
}

fn render_decorator_transport(node: &DecoratorTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let newline_text = if let Some(v) = &node.newline {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = DecoratorTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
        newline: if node.newline.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(newline_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_default_parameter_transport(node: &DefaultParameterTransport) -> Result<String, ::askama::Error> {
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = DefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_delete_statement_transport(node: &DeleteStatementTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = DeleteStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_dict_pattern_transport(node: &DictPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = DictPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_dictionary_transport(node: &DictionaryTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = DictionaryTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_dictionary_comprehension_transport(node: &DictionaryComprehensionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = DictionaryComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
    };
    template.render()
}

fn render_dictionary_splat_transport(node: &DictionarySplatTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let template = DictionarySplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
    };
    template.render()
}

fn render_dictionary_splat_pattern_transport(node: &DictionarySplatPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = DictionarySplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_dotted_name_transport(node: &DottedNameTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = DottedNameTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ".",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_elif_clause_transport(node: &ElifClauseTransport) -> Result<String, ::askama::Error> {
    let condition_text = render_transport_dispatch(node.condition.as_ref())?;
    let consequence_text = render_transport_dispatch(node.consequence.as_ref())?;
    let template = ElifClauseTemplate {
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(condition_text.as_str())),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(consequence_text.as_str())),
    };
    template.render()
}

fn render_ellipsis2_transport(t: &Ellipsis2Transport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_else_clause_transport(node: &ElseClauseTransport) -> Result<String, ::askama::Error> {
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = ElseClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
    };
    template.render()
}

fn render_escape_sequence_transport(t: &EscapeSequenceTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_except_clause_transport(node: &ExceptClauseTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let value_owned: &[Box<AnyTransport>] = node.value.as_deref().unwrap_or(&[]);
    let value_strings: Vec<String> = value_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let value_buf: Vec<::sittir_core::filters::Renderable<'_>> = value_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let alias_text = if let Some(v) = &node.alias {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = ExceptClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        alias: if node.alias.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(alias_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        value: ::sittir_core::filters::ListNonterminalView {
            items: value_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_exec_statement_transport(node: &ExecStatementTransport) -> Result<String, ::askama::Error> {
    let in_clause_owned: &[Box<AnyTransport>] = node.in_clause.as_deref().unwrap_or(&[]);
    let in_clause_strings: Vec<String> = in_clause_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let in_clause_buf: Vec<::sittir_core::filters::Renderable<'_>> = in_clause_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let code_text = render_transport_dispatch(node.code.as_ref())?;
    let template = ExecStatementTemplate {
        code: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(code_text.as_str())),
        in_clause: ::sittir_core::filters::ListNonterminalView {
            items: in_clause_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_expression_list_transport(node: &ExpressionListTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ExpressionListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_expression_statement_tuple_transport(node: &ExpressionStatementTupleTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ExpressionStatementTupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_expression_statement_transport(t: &ExpressionStatementTransport) -> Result<String, ::askama::Error> {
    match t {
        ExpressionStatementTransport::ExpressionStatementUFormTuple(data) => render_expression_statement_uform_tuple_transport(data),
    }
}

fn render_expression_statement_uform_tuple_transport(node: &ExpressionStatementUFormTupleTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ExpressionStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        variant: "",
    };
    template.render()
}

fn render_false_transport(t: &FalseTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_finally_clause_transport(node: &FinallyClauseTransport) -> Result<String, ::askama::Error> {
    let block_text = render_transport_dispatch(node.block.as_ref())?;
    let template = FinallyClauseTemplate {
        block: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(block_text.as_str())),
    };
    template.render()
}

fn render_float_transport(t: &FloatTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_for_in_clause_transport(node: &ForInClauseTransport) -> Result<String, ::askama::Error> {
    let right_strings: Vec<String> = node.right.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let right_buf: Vec<::sittir_core::filters::Renderable<'_>> = right_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let async_marker_text = if let Some(v) = &node.async_marker {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let template = ForInClauseTemplate {
        async_marker: if node.async_marker.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(async_marker_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        right: ::sittir_core::filters::ListNonterminalView {
            items: right_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_for_statement_transport(node: &ForStatementTransport) -> Result<String, ::askama::Error> {
    let alternative_text = if let Some(v) = &node.alternative {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let async_marker_text = if let Some(v) = &node.async_marker {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = ForStatementTemplate {
        alternative: if node.alternative.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(alternative_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        async_marker: if node.async_marker.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(async_marker_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_format_specifier_transport(node: &FormatSpecifierTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = FormatSpecifierTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_function_definition_transport(node: &FunctionDefinitionTransport) -> Result<String, ::askama::Error> {
    let async_marker_text = if let Some(v) = &node.async_marker {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let parameters_text = render_transport_dispatch(node.parameters.as_ref())?;
    let return_type_text = if let Some(v) = &node.return_type {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let type_parameters_text = if let Some(v) = &node.type_parameters {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = FunctionDefinitionTemplate {
        async_marker: if node.async_marker.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(async_marker_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        parameters: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(parameters_text.as_str())),
        return_type: if node.return_type.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(return_type_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        type_parameters: if node.type_parameters.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(type_parameters_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_future_import_statement_transport(node: &FutureImportStatementTransport) -> Result<String, ::askama::Error> {
    let name_strings: Vec<String> = node.name.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let name_buf: Vec<::sittir_core::filters::Renderable<'_>> = name_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = FutureImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: name_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_generator_expression_transport(node: &GeneratorExpressionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = GeneratorExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
    };
    template.render()
}

fn render_generic_type_transport(node: &GenericTypeTransport) -> Result<String, ::askama::Error> {
    let identifier_text = render_transport_dispatch(node.identifier.as_ref())?;
    let type_parameter_text = render_transport_dispatch(node.type_parameter.as_ref())?;
    let template = GenericTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(identifier_text.as_str())),
        type_parameter: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(type_parameter_text.as_str())),
    };
    template.render()
}

fn render_global_statement_transport(node: &GlobalStatementTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = GlobalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_identifier_transport(t: &IdentifierTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_if_clause_transport(node: &IfClauseTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let template = IfClauseTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
    };
    template.render()
}

fn render_if_statement_transport(node: &IfStatementTransport) -> Result<String, ::askama::Error> {
    let alternative_owned: &[Box<AnyTransport>] = node.alternative.as_deref().unwrap_or(&[]);
    let alternative_strings: Vec<String> = alternative_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let alternative_buf: Vec<::sittir_core::filters::Renderable<'_>> = alternative_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let condition_text = render_transport_dispatch(node.condition.as_ref())?;
    let consequence_text = render_transport_dispatch(node.consequence.as_ref())?;
    let template = IfStatementTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: alternative_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(condition_text.as_str())),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(consequence_text.as_str())),
    };
    template.render()
}

fn render_import_from_statement_transport(node: &ImportFromStatementTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let module_name_text = render_transport_dispatch(node.module_name.as_ref())?;
    let template = ImportFromStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        module_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(module_name_text.as_str())),
        name: ::sittir_core::filters::ListNonterminalView {
            items: &[],
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_import_prefix_transport(t: &ImportPrefixTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_import_statement_transport(node: &ImportStatementTransport) -> Result<String, ::askama::Error> {
    let name_strings: Vec<String> = node.name.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let name_buf: Vec<::sittir_core::filters::Renderable<'_>> = name_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: name_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_integer_transport(t: &IntegerTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_interpolation_transport(node: &InterpolationTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let format_specifier_text = if let Some(v) = &node.format_specifier {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let type_conversion_text = if let Some(v) = &node.type_conversion {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = InterpolationTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
        format_specifier: if node.format_specifier.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(format_specifier_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        type_conversion: if node.type_conversion.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(type_conversion_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_keyword_argument_transport(node: &KeywordArgumentTransport) -> Result<String, ::askama::Error> {
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = KeywordArgumentTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_keyword_pattern_transport(node: &KeywordPatternTransport) -> Result<String, ::askama::Error> {
    let identifier_text = render_transport_dispatch(node.identifier.as_ref())?;
    let simple_pattern_text = render_transport_dispatch(node.simple_pattern.as_ref())?;
    let template = KeywordPatternTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(identifier_text.as_str())),
        simple_pattern: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(simple_pattern_text.as_str())),
    };
    template.render()
}

fn render_keyword_separator_transport(t: &KeywordSeparatorTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_lambda_transport(node: &LambdaTransport) -> Result<String, ::askama::Error> {
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let parameters_text = if let Some(v) = &node.parameters {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = LambdaTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        parameters: if node.parameters.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(parameters_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_lambda_parameters_transport(node: &LambdaParametersTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = LambdaParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_lambda_within_for_in_clause_transport(node: &LambdaWithinForInClauseTransport) -> Result<String, ::askama::Error> {
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let parameters_text = if let Some(v) = &node.parameters {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = LambdaWithinForInClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        parameters: if node.parameters.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(parameters_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_line_continuation_transport(t: &LineContinuationTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_list_transport(node: &ListTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_list_comprehension_transport(node: &ListComprehensionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = ListComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
    };
    template.render()
}

fn render_list_pattern_transport(node: &ListPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ListPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_list_splat_transport(node: &ListSplatTransport) -> Result<String, ::askama::Error> {
    let expression_text = render_transport_dispatch(node.expression.as_ref())?;
    let template = ListSplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(expression_text.as_str())),
    };
    template.render()
}

fn render_list_splat_pattern_transport(node: &ListSplatPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ListSplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_match_statement_transport(node: &MatchStatementTransport) -> Result<String, ::askama::Error> {
    let subject_strings: Vec<String> = node.subject.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let subject_buf: Vec<::sittir_core::filters::Renderable<'_>> = subject_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = MatchStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        subject: ::sittir_core::filters::ListNonterminalView {
            items: subject_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_member_type_transport(node: &MemberTypeTransport) -> Result<String, ::askama::Error> {
    let base_type_text = render_transport_dispatch(node.base_type.as_ref())?;
    let identifier_text = render_transport_dispatch(node.identifier.as_ref())?;
    let template = MemberTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(base_type_text.as_str())),
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(identifier_text.as_str())),
    };
    template.render()
}

fn render_module_transport(node: &ModuleTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ModuleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_named_expression_transport(node: &NamedExpressionTransport) -> Result<String, ::askama::Error> {
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = NamedExpressionTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_none_transport(t: &NoneTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_nonlocal_statement_transport(node: &NonlocalStatementTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = NonlocalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_not_operator_transport(node: &NotOperatorTransport) -> Result<String, ::askama::Error> {
    let argument_text = render_transport_dispatch(node.argument.as_ref())?;
    let template = NotOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(argument_text.as_str())),
    };
    template.render()
}

fn render_pair_transport(node: &PairTransport) -> Result<String, ::askama::Error> {
    let key_text = render_transport_dispatch(node.key.as_ref())?;
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = PairTemplate {
        key: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(key_text.as_str())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_parameters_transport(node: &ParametersTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_parenthesized_expression_transport(node: &ParenthesizedExpressionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ParenthesizedExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_parenthesized_list_splat_transport(node: &ParenthesizedListSplatTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ParenthesizedListSplatTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_pass_statement_transport(t: &PassStatementTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_pattern_list_transport(node: &PatternListTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = PatternListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_positional_separator_transport(t: &PositionalSeparatorTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_print_statement_transport(node: &PrintStatementTransport) -> Result<String, ::askama::Error> {
    let children_owned: &[Box<AnyTransport>] = node.children.as_deref().unwrap_or(&[]);
    let children_strings: Vec<String> = children_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let argument_strings: Vec<String> = node.argument.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let argument_buf: Vec<::sittir_core::filters::Renderable<'_>> = argument_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = PrintStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        argument: ::sittir_core::filters::ListNonterminalView {
            items: argument_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_raise_statement_transport(node: &RaiseStatementTransport) -> Result<String, ::askama::Error> {
    let children_owned: &[Box<AnyTransport>] = node.children.as_deref().unwrap_or(&[]);
    let children_strings: Vec<String> = children_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let cause_text = if let Some(v) = &node.cause {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = RaiseStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        cause: if node.cause.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(cause_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_relative_import_transport(node: &RelativeImportTransport) -> Result<String, ::askama::Error> {
    let dotted_name_text = if let Some(v) = &node.dotted_name {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let import_prefix_text = render_transport_dispatch(node.import_prefix.as_ref())?;
    let template = RelativeImportTemplate {
        dotted_name: if node.dotted_name.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(dotted_name_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        import_prefix: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(import_prefix_text.as_str())),
    };
    template.render()
}

fn render_return_statement_transport(node: &ReturnStatementTransport) -> Result<String, ::askama::Error> {
    let children_owned: &[Box<AnyTransport>] = node.children.as_deref().unwrap_or(&[]);
    let children_strings: Vec<String> = children_owned.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = ReturnStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_set_transport(node: &SetTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = SetTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_set_comprehension_transport(node: &SetComprehensionTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let template = SetComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
    };
    template.render()
}

fn render_slice_transport(node: &SliceTransport) -> Result<String, ::askama::Error> {
    let start_text = if let Some(v) = &node.start {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let step_text = if let Some(v) = &node.step {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let stop_text = if let Some(v) = &node.stop {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = SliceTemplate {
        start: if node.start.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(start_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        step: if node.step.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(step_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        stop: if node.stop.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(stop_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_splat_pattern_transport(node: &SplatPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let identifier_text = render_transport_dispatch(node.identifier.as_ref())?;
    let template = SplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(identifier_text.as_str())),
    };
    template.render()
}

fn render_splat_type_transport(node: &SplatTypeTransport) -> Result<String, ::askama::Error> {
    let identifier_rendered = render_transport_dispatch(node.identifier.as_ref())?;
    let template = SplatTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(identifier_rendered.as_str())),
    };
    template.render()
}

fn render_string_transport(node: &StringTransport) -> Result<String, ::askama::Error> {
    let template = StringTemplate {
        text: node.transport_text.as_deref().unwrap_or(""),
    };
    template.render()
}

fn render_string_content_transport(node: &StringContentTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = StringContentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_subscript_transport(node: &SubscriptTransport) -> Result<String, ::askama::Error> {
    let subscript_strings: Vec<String> = node.subscript.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let subscript_buf: Vec<::sittir_core::filters::Renderable<'_>> = subscript_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = SubscriptTemplate {
        subscript: ::sittir_core::filters::ListNonterminalView {
            items: subscript_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_true_transport(t: &TrueTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_try_statement_transport(node: &TryStatementTransport) -> Result<String, ::askama::Error> {
    let except_clauses_strings: Vec<String> = node.except_clauses.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let except_clauses_buf: Vec<::sittir_core::filters::Renderable<'_>> = except_clauses_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let else_clause_text = if let Some(v) = &node.else_clause {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let finally_clause_text = if let Some(v) = &node.finally_clause {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let template = TryStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        else_clause: if node.else_clause.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(else_clause_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        except_clauses: ::sittir_core::filters::ListNonterminalView {
            items: except_clauses_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        finally_clause: if node.finally_clause.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(finally_clause_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
    };
    template.render()
}

fn render_tuple_transport(node: &TupleTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = TupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_tuple_pattern_transport(node: &TuplePatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = TuplePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_type_transport(node: &TypeTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = TypeTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_type_alias_statement_transport(node: &TypeAliasStatementTransport) -> Result<String, ::askama::Error> {
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let r#type_text = render_transport_dispatch(node.r#type.as_ref())?;
    let template = TypeAliasStatementTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(r#type_text.as_str())),
    };
    template.render()
}

fn render_type_conversion_transport(t: &TypeConversionTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_type_parameter_transport(node: &TypeParameterTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = TypeParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_typed_default_parameter_transport(node: &TypedDefaultParameterTransport) -> Result<String, ::askama::Error> {
    let name_text = render_transport_dispatch(node.name.as_ref())?;
    let r#type_text = render_transport_dispatch(node.r#type.as_ref())?;
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = TypedDefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(name_text.as_str())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(r#type_text.as_str())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_typed_parameter_transport(node: &TypedParameterTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let r#type_text = render_transport_dispatch(node.r#type.as_ref())?;
    let template = TypedParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(r#type_text.as_str())),
    };
    template.render()
}

fn render_unary_operator_transport(node: &UnaryOperatorTransport) -> Result<String, ::askama::Error> {
    let argument_text = render_transport_dispatch(node.argument.as_ref())?;
    let operator_text = render_transport_dispatch(node.operator.as_ref())?;
    let template = UnaryOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(argument_text.as_str())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(operator_text.as_str())),
    };
    template.render()
}

fn render_union_pattern_transport(node: &UnionPatternTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = UnionPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_union_type_transport(node: &UnionTypeTransport) -> Result<String, ::askama::Error> {
    let left_text = render_transport_dispatch(node.left.as_ref())?;
    let right_text = render_transport_dispatch(node.right.as_ref())?;
    let template = UnionTypeTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(left_text.as_str())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(right_text.as_str())),
    };
    template.render()
}

fn render_while_statement_transport(node: &WhileStatementTransport) -> Result<String, ::askama::Error> {
    let alternative_text = if let Some(v) = &node.alternative {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let condition_text = render_transport_dispatch(node.condition.as_ref())?;
    let template = WhileStatementTemplate {
        alternative: if node.alternative.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(alternative_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(condition_text.as_str())),
    };
    template.render()
}

fn render_wildcard_import_transport(t: &WildcardImportTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_with_clause_bare_transport(node: &WithClauseBareTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = WithClauseBareTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_with_clause_paren_transport(node: &WithClauseParenTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_with_clause_transport(t: &WithClauseTransport) -> Result<String, ::askama::Error> {
    match t {
        WithClauseTransport::WithClauseUFormBare(data) => render_with_clause_uform_bare_transport(data),
        WithClauseTransport::WithClauseUFormParen(data) => render_with_clause_uform_paren_transport(data),
    }
}

fn render_with_clause_uform_bare_transport(node: &WithClauseUFormBareTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = WithClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_with_clause_uform_paren_transport(node: &WithClauseUFormParenTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = WithClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_with_item_transport(node: &WithItemTransport) -> Result<String, ::askama::Error> {
    let value_text = render_transport_dispatch(node.value.as_ref())?;
    let template = WithItemTemplate {
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(value_text.as_str())),
    };
    template.render()
}

fn render_with_statement_transport(node: &WithStatementTransport) -> Result<String, ::askama::Error> {
    let async_marker_text = if let Some(v) = &node.async_marker {
        render_transport_dispatch(v.as_ref())?
    } else {
        String::new()
    };
    let body_text = render_transport_dispatch(node.body.as_ref())?;
    let with_clause_text = render_transport_dispatch(node.with_clause.as_ref())?;
    let template = WithStatementTemplate {
        async_marker: if node.async_marker.is_some() { ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(async_marker_text.as_str())) } else { ::sittir_core::filters::OptionalNonterminalView::Missing },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(body_text.as_str())),
        with_clause: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(with_clause_text.as_str())),
    };
    template.render()
}

fn render_yield_transport(node: &YieldTransport) -> Result<String, ::askama::Error> {
    let children_strings: Vec<String> = node.children.iter()
        .map(|t| render_transport_dispatch(t.as_ref()))
        .collect::<Result<Vec<_>, _>>()?;
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_strings.iter()
        .map(|s| ::sittir_core::filters::Renderable::Text(s.as_str()))
        .collect();
    let template = YieldTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render()
}

fn render_newline_transport(t: &NewlineTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_indent_transport(t: &IndentTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_dedent_transport(t: &DedentTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_string_start_transport(t: &StringStartTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render__string_content_transport(t: &_StringContentTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_escape_interpolation_transport(t: &EscapeInterpolationTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_string_end_transport(t: &StringEndTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_close_bracket_transport(t: &CloseBracketTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_close_paren_transport(t: &CloseParenTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_close_brace_transport(t: &CloseBraceTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_except_transport(t: &ExceptTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_as_transport(t: &AsTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_eq_transport(t: &EqTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_colon_transport(t: &ColonTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_async_transport(t: &AsyncTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_bracket_transport(t: &BracketTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_tok_bs_transport(t: &TokBsTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_minus_transport(t: &MinusTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_paren_transport(t: &ParenTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_comma_transport(t: &CommaTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_assert_transport(t: &AssertTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_dot_transport(t: &DotTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_plus_transport(t: &PlusTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_star_transport(t: &StarTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_at_transport(t: &AtTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_slash_transport(t: &SlashTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_percent_transport(t: &PercentTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_slashslash_transport(t: &SlashslashTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_starstar_transport(t: &StarstarTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_pipe_transport(t: &PipeTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_amp_transport(t: &AmpTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_caret_transport(t: &CaretTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_shl_transport(t: &ShlTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_shr_transport(t: &ShrTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_and_transport(t: &AndTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_or_transport(t: &OrTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_break_transport(t: &BreakTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_case_transport(t: &CaseTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_class_transport(t: &ClassTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_if_transport(t: &IfTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_else_transport(t: &ElseTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_continue_transport(t: &ContinueTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_del_transport(t: &DelTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_brace_transport(t: &BraceTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_elif_transport(t: &ElifTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_ellipsis_transport(t: &EllipsisTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_exec_transport(t: &ExecTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_in_transport(t: &InTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_false2_transport(t: &False2Transport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_finally_transport(t: &FinallyTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_for_transport(t: &ForTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_def_transport(t: &DefTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_arrow_transport(t: &ArrowTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_from_transport(t: &FromTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_future_u_transport(t: &FutureUTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_import_transport(t: &ImportTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_global_transport(t: &GlobalTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_match_transport(t: &MatchTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_coloneq_transport(t: &ColoneqTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_none2_transport(t: &None2Transport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_nonlocal_transport(t: &NonlocalTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_not_transport(t: &NotTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_pass_transport(t: &PassTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_print_transport(t: &PrintTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_raise_transport(t: &RaiseTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_return_transport(t: &ReturnTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_anonymous_transport(t: &AnonymousTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_true2_transport(t: &True2Transport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_try_transport(t: &TryTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_while_transport(t: &WhileTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_with_transport(t: &WithTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

fn render_literal_transport(_kind: &str, t: &LiteralTransport) -> Result<String, ::askama::Error> {
    Ok(t.text.clone())
}

pub fn render_transport_dispatch(transport: &AnyTransport) -> Result<String, ::askama::Error> {
    match transport {
        AnyTransport::_AsPattern(t) => render__as_pattern_transport(t),
        AnyTransport::AsPatternTarget(t) => render_as_pattern_target_transport(t),
        AnyTransport::AssignmentEq(t) => render_assignment_eq_transport(t),
        AnyTransport::AssignmentType(t) => render_assignment_type_transport(t),
        AnyTransport::AssignmentTyped(t) => render_assignment_typed_transport(t),
        AnyTransport::ComprehensionClauses(t) => render_comprehension_clauses_transport(t),
        AnyTransport::FormatExpression(t) => render_format_expression_transport(t),
        AnyTransport::ImportList(t) => render_import_list_transport(t),
        AnyTransport::IsNot(t) => render_is_not_transport(t),
        AnyTransport::KeyValuePattern(t) => render_key_value_pattern_transport(t),
        AnyTransport::KwAsyncMarker(t) => render_kw_async_marker_transport(t),
        AnyTransport::_ListPattern(t) => render__list_pattern_transport(t),
        AnyTransport::MatchBlock(t) => render_match_block_transport(t),
        AnyTransport::MatchBlockBlock(t) => render_match_block_block_transport(t),
        AnyTransport::NotEscapeSequence(t) => render_not_escape_sequence_transport(t),
        AnyTransport::NotIn(t) => render_not_in_transport(t),
        AnyTransport::SimplePatternNegative(t) => render_simple_pattern_negative_transport(t),
        AnyTransport::SimpleStatements(t) => render_simple_statements_transport(t),
        AnyTransport::Suite(t) => render_suite_transport(t),
        AnyTransport::_TuplePattern(t) => render__tuple_pattern_transport(t),
        AnyTransport::_WithClauseParen(t) => render__with_clause_paren_transport(t),
        AnyTransport::AliasedImport(t) => render_aliased_import_transport(t),
        AnyTransport::ArgumentList(t) => render_argument_list_transport(t),
        AnyTransport::AsPattern(t) => render_as_pattern_transport(t),
        AnyTransport::AssertStatement(t) => render_assert_statement_transport(t),
        AnyTransport::Assignment(t) => render_assignment_transport(t),
        AnyTransport::Attribute(t) => render_attribute_transport(t),
        AnyTransport::AugmentedAssignment(t) => render_augmented_assignment_transport(t),
        AnyTransport::Await(t) => render_await_transport(t),
        AnyTransport::BinaryOperator(t) => render_binary_operator_transport(t),
        AnyTransport::Block(t) => render_block_transport(t),
        AnyTransport::BooleanOperator(t) => render_boolean_operator_transport(t),
        AnyTransport::BreakStatement(t) => render_break_statement_transport(t),
        AnyTransport::Call(t) => render_call_transport(t),
        AnyTransport::CaseClause(t) => render_case_clause_transport(t),
        AnyTransport::CasePattern(t) => render_case_pattern_transport(t),
        AnyTransport::Chevron(t) => render_chevron_transport(t),
        AnyTransport::ClassDefinition(t) => render_class_definition_transport(t),
        AnyTransport::ClassPattern(t) => render_class_pattern_transport(t),
        AnyTransport::Comment(t) => render_comment_transport(t),
        AnyTransport::ComparisonOperator(t) => render_comparison_operator_transport(t),
        AnyTransport::ComplexPattern(t) => render_complex_pattern_transport(t),
        AnyTransport::ConcatenatedString(t) => render_concatenated_string_transport(t),
        AnyTransport::ConditionalExpression(t) => render_conditional_expression_transport(t),
        AnyTransport::ConstrainedType(t) => render_constrained_type_transport(t),
        AnyTransport::ContinueStatement(t) => render_continue_statement_transport(t),
        AnyTransport::DecoratedDefinition(t) => render_decorated_definition_transport(t),
        AnyTransport::Decorator(t) => render_decorator_transport(t),
        AnyTransport::DefaultParameter(t) => render_default_parameter_transport(t),
        AnyTransport::DeleteStatement(t) => render_delete_statement_transport(t),
        AnyTransport::DictPattern(t) => render_dict_pattern_transport(t),
        AnyTransport::Dictionary(t) => render_dictionary_transport(t),
        AnyTransport::DictionaryComprehension(t) => render_dictionary_comprehension_transport(t),
        AnyTransport::DictionarySplat(t) => render_dictionary_splat_transport(t),
        AnyTransport::DictionarySplatPattern(t) => render_dictionary_splat_pattern_transport(t),
        AnyTransport::DottedName(t) => render_dotted_name_transport(t),
        AnyTransport::ElifClause(t) => render_elif_clause_transport(t),
        AnyTransport::Ellipsis2(t) => render_ellipsis2_transport(t),
        AnyTransport::ElseClause(t) => render_else_clause_transport(t),
        AnyTransport::EscapeSequence(t) => render_escape_sequence_transport(t),
        AnyTransport::ExceptClause(t) => render_except_clause_transport(t),
        AnyTransport::ExecStatement(t) => render_exec_statement_transport(t),
        AnyTransport::ExpressionList(t) => render_expression_list_transport(t),
        AnyTransport::ExpressionStatementTuple(t) => render_expression_statement_tuple_transport(t),
        AnyTransport::ExpressionStatement(t) => render_expression_statement_transport(t),
        AnyTransport::False(t) => render_false_transport(t),
        AnyTransport::FinallyClause(t) => render_finally_clause_transport(t),
        AnyTransport::Float(t) => render_float_transport(t),
        AnyTransport::ForInClause(t) => render_for_in_clause_transport(t),
        AnyTransport::ForStatement(t) => render_for_statement_transport(t),
        AnyTransport::FormatSpecifier(t) => render_format_specifier_transport(t),
        AnyTransport::FunctionDefinition(t) => render_function_definition_transport(t),
        AnyTransport::FutureImportStatement(t) => render_future_import_statement_transport(t),
        AnyTransport::GeneratorExpression(t) => render_generator_expression_transport(t),
        AnyTransport::GenericType(t) => render_generic_type_transport(t),
        AnyTransport::GlobalStatement(t) => render_global_statement_transport(t),
        AnyTransport::Identifier(t) => render_identifier_transport(t),
        AnyTransport::IfClause(t) => render_if_clause_transport(t),
        AnyTransport::IfStatement(t) => render_if_statement_transport(t),
        AnyTransport::ImportFromStatement(t) => render_import_from_statement_transport(t),
        AnyTransport::ImportPrefix(t) => render_import_prefix_transport(t),
        AnyTransport::ImportStatement(t) => render_import_statement_transport(t),
        AnyTransport::Integer(t) => render_integer_transport(t),
        AnyTransport::Interpolation(t) => render_interpolation_transport(t),
        AnyTransport::KeywordArgument(t) => render_keyword_argument_transport(t),
        AnyTransport::KeywordPattern(t) => render_keyword_pattern_transport(t),
        AnyTransport::KeywordSeparator(t) => render_keyword_separator_transport(t),
        AnyTransport::Lambda(t) => render_lambda_transport(t),
        AnyTransport::LambdaParameters(t) => render_lambda_parameters_transport(t),
        AnyTransport::LambdaWithinForInClause(t) => render_lambda_within_for_in_clause_transport(t),
        AnyTransport::LineContinuation(t) => render_line_continuation_transport(t),
        AnyTransport::List(t) => render_list_transport(t),
        AnyTransport::ListComprehension(t) => render_list_comprehension_transport(t),
        AnyTransport::ListPattern(t) => render_list_pattern_transport(t),
        AnyTransport::ListSplat(t) => render_list_splat_transport(t),
        AnyTransport::ListSplatPattern(t) => render_list_splat_pattern_transport(t),
        AnyTransport::MatchStatement(t) => render_match_statement_transport(t),
        AnyTransport::MemberType(t) => render_member_type_transport(t),
        AnyTransport::Module(t) => render_module_transport(t),
        AnyTransport::NamedExpression(t) => render_named_expression_transport(t),
        AnyTransport::None(t) => render_none_transport(t),
        AnyTransport::NonlocalStatement(t) => render_nonlocal_statement_transport(t),
        AnyTransport::NotOperator(t) => render_not_operator_transport(t),
        AnyTransport::Pair(t) => render_pair_transport(t),
        AnyTransport::Parameters(t) => render_parameters_transport(t),
        AnyTransport::ParenthesizedExpression(t) => render_parenthesized_expression_transport(t),
        AnyTransport::ParenthesizedListSplat(t) => render_parenthesized_list_splat_transport(t),
        AnyTransport::PassStatement(t) => render_pass_statement_transport(t),
        AnyTransport::PatternList(t) => render_pattern_list_transport(t),
        AnyTransport::PositionalSeparator(t) => render_positional_separator_transport(t),
        AnyTransport::PrintStatement(t) => render_print_statement_transport(t),
        AnyTransport::RaiseStatement(t) => render_raise_statement_transport(t),
        AnyTransport::RelativeImport(t) => render_relative_import_transport(t),
        AnyTransport::ReturnStatement(t) => render_return_statement_transport(t),
        AnyTransport::Set(t) => render_set_transport(t),
        AnyTransport::SetComprehension(t) => render_set_comprehension_transport(t),
        AnyTransport::Slice(t) => render_slice_transport(t),
        AnyTransport::SplatPattern(t) => render_splat_pattern_transport(t),
        AnyTransport::SplatType(t) => render_splat_type_transport(t),
        AnyTransport::String(t) => render_string_transport(t),
        AnyTransport::StringContent(t) => render_string_content_transport(t),
        AnyTransport::Subscript(t) => render_subscript_transport(t),
        AnyTransport::True(t) => render_true_transport(t),
        AnyTransport::TryStatement(t) => render_try_statement_transport(t),
        AnyTransport::Tuple(t) => render_tuple_transport(t),
        AnyTransport::TuplePattern(t) => render_tuple_pattern_transport(t),
        AnyTransport::Type(t) => render_type_transport(t),
        AnyTransport::TypeAliasStatement(t) => render_type_alias_statement_transport(t),
        AnyTransport::TypeConversion(t) => render_type_conversion_transport(t),
        AnyTransport::TypeParameter(t) => render_type_parameter_transport(t),
        AnyTransport::TypedDefaultParameter(t) => render_typed_default_parameter_transport(t),
        AnyTransport::TypedParameter(t) => render_typed_parameter_transport(t),
        AnyTransport::UnaryOperator(t) => render_unary_operator_transport(t),
        AnyTransport::UnionPattern(t) => render_union_pattern_transport(t),
        AnyTransport::UnionType(t) => render_union_type_transport(t),
        AnyTransport::WhileStatement(t) => render_while_statement_transport(t),
        AnyTransport::WildcardImport(t) => render_wildcard_import_transport(t),
        AnyTransport::WithClauseBare(t) => render_with_clause_bare_transport(t),
        AnyTransport::WithClauseParen(t) => render_with_clause_paren_transport(t),
        AnyTransport::WithClause(t) => render_with_clause_transport(t),
        AnyTransport::WithItem(t) => render_with_item_transport(t),
        AnyTransport::WithStatement(t) => render_with_statement_transport(t),
        AnyTransport::Yield(t) => render_yield_transport(t),
        AnyTransport::Newline(t) => render_newline_transport(t),
        AnyTransport::Indent(t) => render_indent_transport(t),
        AnyTransport::Dedent(t) => render_dedent_transport(t),
        AnyTransport::StringStart(t) => render_string_start_transport(t),
        AnyTransport::_StringContent(t) => render__string_content_transport(t),
        AnyTransport::EscapeInterpolation(t) => render_escape_interpolation_transport(t),
        AnyTransport::StringEnd(t) => render_string_end_transport(t),
        AnyTransport::CloseBracket(t) => render_close_bracket_transport(t),
        AnyTransport::CloseParen(t) => render_close_paren_transport(t),
        AnyTransport::CloseBrace(t) => render_close_brace_transport(t),
        AnyTransport::Except(t) => render_except_transport(t),
        AnyTransport::As(t) => render_as_transport(t),
        AnyTransport::Eq(t) => render_eq_transport(t),
        AnyTransport::Colon(t) => render_colon_transport(t),
        AnyTransport::Async(t) => render_async_transport(t),
        AnyTransport::Bracket(t) => render_bracket_transport(t),
        AnyTransport::TokBs(t) => render_tok_bs_transport(t),
        AnyTransport::Minus(t) => render_minus_transport(t),
        AnyTransport::Paren(t) => render_paren_transport(t),
        AnyTransport::Comma(t) => render_comma_transport(t),
        AnyTransport::Assert(t) => render_assert_transport(t),
        AnyTransport::Dot(t) => render_dot_transport(t),
        AnyTransport::Plus(t) => render_plus_transport(t),
        AnyTransport::Star(t) => render_star_transport(t),
        AnyTransport::At(t) => render_at_transport(t),
        AnyTransport::Slash(t) => render_slash_transport(t),
        AnyTransport::Percent(t) => render_percent_transport(t),
        AnyTransport::Slashslash(t) => render_slashslash_transport(t),
        AnyTransport::Starstar(t) => render_starstar_transport(t),
        AnyTransport::Pipe(t) => render_pipe_transport(t),
        AnyTransport::Amp(t) => render_amp_transport(t),
        AnyTransport::Caret(t) => render_caret_transport(t),
        AnyTransport::Shl(t) => render_shl_transport(t),
        AnyTransport::Shr(t) => render_shr_transport(t),
        AnyTransport::And(t) => render_and_transport(t),
        AnyTransport::Or(t) => render_or_transport(t),
        AnyTransport::Break(t) => render_break_transport(t),
        AnyTransport::Case(t) => render_case_transport(t),
        AnyTransport::Class(t) => render_class_transport(t),
        AnyTransport::If(t) => render_if_transport(t),
        AnyTransport::Else(t) => render_else_transport(t),
        AnyTransport::Continue(t) => render_continue_transport(t),
        AnyTransport::Del(t) => render_del_transport(t),
        AnyTransport::Brace(t) => render_brace_transport(t),
        AnyTransport::Elif(t) => render_elif_transport(t),
        AnyTransport::Ellipsis(t) => render_ellipsis_transport(t),
        AnyTransport::Exec(t) => render_exec_transport(t),
        AnyTransport::In(t) => render_in_transport(t),
        AnyTransport::False2(t) => render_false2_transport(t),
        AnyTransport::Finally(t) => render_finally_transport(t),
        AnyTransport::For(t) => render_for_transport(t),
        AnyTransport::Def(t) => render_def_transport(t),
        AnyTransport::Arrow(t) => render_arrow_transport(t),
        AnyTransport::From(t) => render_from_transport(t),
        AnyTransport::FutureU(t) => render_future_u_transport(t),
        AnyTransport::Import(t) => render_import_transport(t),
        AnyTransport::Global(t) => render_global_transport(t),
        AnyTransport::Match(t) => render_match_transport(t),
        AnyTransport::Coloneq(t) => render_coloneq_transport(t),
        AnyTransport::None2(t) => render_none2_transport(t),
        AnyTransport::Nonlocal(t) => render_nonlocal_transport(t),
        AnyTransport::Not(t) => render_not_transport(t),
        AnyTransport::Pass(t) => render_pass_transport(t),
        AnyTransport::Print(t) => render_print_transport(t),
        AnyTransport::Raise(t) => render_raise_transport(t),
        AnyTransport::Return(t) => render_return_transport(t),
        AnyTransport::Anonymous(t) => render_anonymous_transport(t),
        AnyTransport::True2(t) => render_true2_transport(t),
        AnyTransport::Try(t) => render_try_transport(t),
        AnyTransport::While(t) => render_while_transport(t),
        AnyTransport::With(t) => render_with_transport(t),
        AnyTransport::Literal0_2b_3d(t) => render_literal_transport("+=", t),
        AnyTransport::Literal1_2d_3d(t) => render_literal_transport("-=", t),
        AnyTransport::Literal2_2a_3d(t) => render_literal_transport("*=", t),
        AnyTransport::Literal3_2f_3d(t) => render_literal_transport("/=", t),
        AnyTransport::Literal4_40_3d(t) => render_literal_transport("@=", t),
        AnyTransport::Literal5_2f_2f_3d(t) => render_literal_transport("//=", t),
        AnyTransport::Literal6_25_3d(t) => render_literal_transport("%=", t),
        AnyTransport::Literal7_2a_2a_3d(t) => render_literal_transport("**=", t),
        AnyTransport::Literal8_3e_3e_3d(t) => render_literal_transport(">>=", t),
        AnyTransport::Literal9_3c_3c_3d(t) => render_literal_transport("<<=", t),
        AnyTransport::Literal10_26_3d(t) => render_literal_transport("&=", t),
        AnyTransport::Literal11_5e_3d(t) => render_literal_transport("^=", t),
        AnyTransport::Literal12_7c_3d(t) => render_literal_transport("|=", t),
        AnyTransport::Literal13_3c(t) => render_literal_transport("<", t),
        AnyTransport::Literal14_3c_3d(t) => render_literal_transport("<=", t),
        AnyTransport::Literal15_3d_3d(t) => render_literal_transport("==", t),
        AnyTransport::Literal16_21_3d(t) => render_literal_transport("!=", t),
        AnyTransport::Literal17_3e_3d(t) => render_literal_transport(">=", t),
        AnyTransport::Literal18_3e(t) => render_literal_transport(">", t),
        AnyTransport::Literal19_3c_3e(t) => render_literal_transport("<>", t),
        AnyTransport::Literal20_6e_6f_74_20_69_6e(t) => render_literal_transport("not in", t),
        AnyTransport::Literal21_69_73(t) => render_literal_transport("is", t),
        AnyTransport::Literal22_69_73_20_6e_6f_74(t) => render_literal_transport("is not", t),
        AnyTransport::Literal23_7e(t) => render_literal_transport("~", t),
    }
}

use ::sittir_core::types::{FieldValue as TransportFieldValue, KindId as TransportKindId, NodeData as TransportNodeData, Source as TransportSource};
use ::std::collections::HashMap as TransportHashMap;

fn transport_node_data(
    kind: TransportKindId,
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
        type_: kind,
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

fn literal_transport_to_node(kind: TransportKindId, transport: LiteralTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        kind,
        transport.transport_source,
        transport.transport_named,
        false,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        AnyTransport::Literal0_2b_3d(data) => literal_transport_to_node(TransportKindId(73) /* "+=" */, data),
        AnyTransport::Literal1_2d_3d(data) => literal_transport_to_node(TransportKindId(74) /* "-=" */, data),
        AnyTransport::Literal2_2a_3d(data) => literal_transport_to_node(TransportKindId(75) /* "*=" */, data),
        AnyTransport::Literal3_2f_3d(data) => literal_transport_to_node(TransportKindId(76) /* "/=" */, data),
        AnyTransport::Literal4_40_3d(data) => literal_transport_to_node(TransportKindId(77) /* "@=" */, data),
        AnyTransport::Literal5_2f_2f_3d(data) => literal_transport_to_node(TransportKindId(78) /* "//=" */, data),
        AnyTransport::Literal6_25_3d(data) => literal_transport_to_node(TransportKindId(79) /* "%=" */, data),
        AnyTransport::Literal7_2a_2a_3d(data) => literal_transport_to_node(TransportKindId(80) /* "**=" */, data),
        AnyTransport::Literal8_3e_3e_3d(data) => literal_transport_to_node(TransportKindId(81) /* ">>=" */, data),
        AnyTransport::Literal9_3c_3c_3d(data) => literal_transport_to_node(TransportKindId(82) /* "<<=" */, data),
        AnyTransport::Literal10_26_3d(data) => literal_transport_to_node(TransportKindId(83) /* "&=" */, data),
        AnyTransport::Literal11_5e_3d(data) => literal_transport_to_node(TransportKindId(84) /* "^=" */, data),
        AnyTransport::Literal12_7c_3d(data) => literal_transport_to_node(TransportKindId(85) /* "|=" */, data),
        AnyTransport::Literal13_3c(data) => literal_transport_to_node(TransportKindId(65) /* "<" */, data),
        AnyTransport::Literal14_3c_3d(data) => literal_transport_to_node(TransportKindId(66) /* "<=" */, data),
        AnyTransport::Literal15_3d_3d(data) => literal_transport_to_node(TransportKindId(67) /* "==" */, data),
        AnyTransport::Literal16_21_3d(data) => literal_transport_to_node(TransportKindId(68) /* "!=" */, data),
        AnyTransport::Literal17_3e_3d(data) => literal_transport_to_node(TransportKindId(69) /* ">=" */, data),
        AnyTransport::Literal18_3e(data) => literal_transport_to_node(TransportKindId(70) /* ">" */, data),
        AnyTransport::Literal19_3c_3e(data) => literal_transport_to_node(TransportKindId(71) /* "<>" */, data),
        AnyTransport::Literal20_6e_6f_74_20_69_6e(data) => literal_transport_to_node(TransportKindId(193) /* "not in" */, data),
        AnyTransport::Literal21_69_73(data) => literal_transport_to_node(TransportKindId(64) /* "is" */, data),
        AnyTransport::Literal22_69_73_20_6e_6f_74(data) => literal_transport_to_node(TransportKindId(194) /* "is not" */, data),
        AnyTransport::Literal23_7e(data) => literal_transport_to_node(TransportKindId(63) /* "~" */, data),
    }
}

fn transport_to_node__as_pattern(transport: _AsPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(165) /* "_as_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_as_pattern_target(transport: AsPatternTargetTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(284) /* "_as_pattern_target" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(240) /* "_assignment_eq" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(241) /* "_assignment_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(242) /* "_assignment_typed" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_comprehension_clauses(transport: ComprehensionClausesTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(224) /* "_comprehension_clauses" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_format_expression(transport: FormatExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(285) /* "_format_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(116) /* "_import_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_is_not(transport: IsNotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(194) /* "_is_not" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(170) /* "_key_value_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_kw_async_marker(transport: KwAsyncMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(250) /* "_kw_async_marker" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node__list_pattern(transport: _ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(167) /* "_list_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_match_block(transport: MatchBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(135) /* "_match_block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(246) /* "_match_block_block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_not_escape_sequence(transport: NotEscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(235) /* "_not_escape_sequence" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_not_in(transport: NotInTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(193) /* "_not_in" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_simple_pattern_negative(transport: SimplePatternNegativeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(248) /* "_simple_pattern_negative" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_simple_statements(transport: SimpleStatementsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(110) /* "_simple_statements" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_suite(transport: SuiteTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(0) /* "_suite" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node__tuple_pattern(transport: _TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(168) /* "_tuple_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node__with_clause_paren(transport: _WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(245) /* "_with_clause_paren" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(117) /* "aliased_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(157) /* "argument_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(185) /* "as_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_assert_statement(transport: AssertStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(121) /* "assert_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(203) /* "attribute" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(199) /* "augmented_assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(237) /* "await" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(191) /* "binary_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_block(transport: BlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(160) /* "block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(190) /* "boolean_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_break_statement(transport: BreakStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(129) /* "break_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(206) /* "call" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(136) /* "case_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_case_pattern(transport: CasePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(163) /* "case_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(120) /* "chevron" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(154) /* "class_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(173) /* "class_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_comment(transport: CommentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(99) /* "comment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(195) /* "comparison_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(174) /* "complex_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_concatenated_string(transport: ConcatenatedStringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(230) /* "concatenated_string" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(229) /* "conditional_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(212) /* "constrained_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_continue_statement(transport: ContinueStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(130) /* "continue_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(158) /* "decorated_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(159) /* "decorator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(181) /* "default_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_delete_statement(transport: DeleteStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(126) /* "delete_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_dict_pattern(transport: DictPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(169) /* "dict_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_dictionary(transport: DictionaryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(218) /* "dictionary" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(221) /* "dictionary_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(149) /* "dictionary_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_dictionary_splat_pattern(transport: DictionarySplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(184) /* "dictionary_splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_dotted_name(transport: DottedNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(162) /* "dotted_name" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(132) /* "elif_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_ellipsis2(transport: Ellipsis2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(87) /* "ellipsis" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(133) /* "else_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_escape_sequence(transport: EscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(89) /* "escape_sequence" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(140) /* "except_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(152) /* "exec_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_expression_list(transport: ExpressionListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(161) /* "expression_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_expression_statement_tuple(transport: ExpressionStatementTupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(243) /* "expression_statement_tuple" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(122) /* "expression_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_false(transport: FalseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(97) /* "false" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(141) /* "finally_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_float(transport: FloatTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(94) /* "float" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(227) /* "for_in_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(137) /* "for_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_format_specifier(transport: FormatSpecifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(236) /* "format_specifier" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(145) /* "function_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(114) /* "future_import_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(223) /* "generator_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(210) /* "generic_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_global_statement(transport: GlobalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(150) /* "global_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_identifier(transport: IdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(1) /* "identifier" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(228) /* "if_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(131) /* "if_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(115) /* "import_from_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_import_prefix(transport: ImportPrefixTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(112) /* "import_prefix" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(111) /* "import_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_integer(transport: IntegerTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(93) /* "integer" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(233) /* "interpolation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(214) /* "keyword_argument" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(171) /* "keyword_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_keyword_separator(transport: KeywordSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(239) /* "keyword_separator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(196) /* "lambda" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_lambda_parameters(transport: LambdaParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(147) /* "lambda_parameters" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(197) /* "lambda_within_for_in_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_line_continuation(transport: LineContinuationTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(100) /* "line_continuation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_list(transport: ListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(215) /* "list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(220) /* "list_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_list_pattern(transport: ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(180) /* "list_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(148) /* "list_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_list_splat_pattern(transport: ListSplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(183) /* "list_splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(134) /* "match_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(213) /* "member_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_module(transport: ModuleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(108) /* "module" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(123) /* "named_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_none(transport: NoneTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(98) /* "none" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_nonlocal_statement(transport: NonlocalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(151) /* "nonlocal_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(189) /* "not_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(219) /* "pair" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_parameters(transport: ParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(146) /* "parameters" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_expression(transport: ParenthesizedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(225) /* "parenthesized_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_parenthesized_list_splat(transport: ParenthesizedListSplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(156) /* "parenthesized_list_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_pass_statement(transport: PassStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(128) /* "pass_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_pattern_list(transport: PatternListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(200) /* "pattern_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_positional_separator(transport: PositionalSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(238) /* "positional_separator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(119) /* "print_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(127) /* "raise_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(113) /* "relative_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(125) /* "return_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_set(transport: SetTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(216) /* "set" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(222) /* "set_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(205) /* "slice" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(172) /* "splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(209) /* "splat_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(231) /* "string" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_string_content(transport: StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(232) /* "string_content" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(204) /* "subscript" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_true(transport: TrueTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(96) /* "true" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(139) /* "try_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_tuple(transport: TupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(217) /* "tuple" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_tuple_pattern(transport: TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(179) /* "tuple_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_type(transport: TypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(208) /* "type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(153) /* "type_alias_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_type_conversion(transport: TypeConversionTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(92) /* "type_conversion" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_type_parameter(transport: TypeParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(155) /* "type_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(182) /* "typed_default_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(207) /* "typed_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(192) /* "unary_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_union_pattern(transport: UnionPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(166) /* "union_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(211) /* "union_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(138) /* "while_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_wildcard_import(transport: WildcardImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(118) /* "wildcard_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_with_clause_bare(transport: WithClauseBareTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(244) /* "with_clause_bare" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_with_clause_paren(transport: WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(245) /* "with_clause_paren" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(143) /* "with_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_with_clause_uform_paren(transport: WithClauseUFormParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(143) /* "with_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(144) /* "with_item" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
        TransportKindId(142) /* "with_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_yield(transport: YieldTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children)?);
    Ok(transport_node_data(
        TransportKindId(202) /* "yield" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        fields,
        children,
    ))
}

fn transport_to_node_newline(transport: NewlineTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(101) /* "_newline" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_indent(transport: IndentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(102) /* "_indent" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_dedent(transport: DedentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(103) /* "_dedent" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_string_start(transport: StringStartTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(104) /* "string_start" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node__string_content(transport: _StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(105) /* "_string_content" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_escape_interpolation(transport: EscapeInterpolationTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(106) /* "escape_interpolation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_string_end(transport: StringEndTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(107) /* "string_end" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_close_bracket(transport: CloseBracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(46) /* "]" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_close_paren(transport: CloseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(8) /* ")" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_close_brace(transport: CloseBraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(51) /* "}" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_except(transport: ExceptTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(33) /* "except" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_as(transport: AsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(10) /* "as" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_eq(transport: EqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(43) /* "=" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_colon(transport: ColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(23) /* ":" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_async(transport: AsyncTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(28) /* "async" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_bracket(transport: BracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(45) /* "[" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_tok_bs(transport: TokBsTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(90) /* "\\" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_minus(transport: MinusTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(53) /* "-" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_paren(transport: ParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(7) /* "(" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_comma(transport: CommaTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(9) /* "," */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_assert(transport: AssertTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(14) /* "assert" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_dot(transport: DotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(4) /* "." */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_plus(transport: PlusTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(52) /* "+" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_star(transport: StarTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(11) /* "*" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_at(transport: AtTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(47) /* "@" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_slash(transport: SlashTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(57) /* "/" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_percent(transport: PercentTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(58) /* "%" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_slashslash(transport: SlashslashTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(59) /* "//" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_starstar(transport: StarstarTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(39) /* "**" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_pipe(transport: PipeTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(49) /* "|" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_amp(transport: AmpTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(60) /* "&" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_caret(transport: CaretTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(61) /* "^" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_shl(transport: ShlTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(62) /* "<<" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_shr(transport: ShrTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(13) /* ">>" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_and(transport: AndTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(55) /* "and" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_or(transport: OrTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(56) /* "or" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_break(transport: BreakTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(20) /* "break" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_case(transport: CaseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(27) /* "case" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_class(transport: ClassTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(44) /* "class" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_if(transport: IfTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(22) /* "if" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_else(transport: ElseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(25) /* "else" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_continue(transport: ContinueTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(21) /* "continue" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_del(transport: DelTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(17) /* "del" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_brace(transport: BraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(50) /* "{" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_elif(transport: ElifTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(24) /* "elif" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_ellipsis(transport: EllipsisTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "..." — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_exec(transport: ExecTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(42) /* "exec" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_in(transport: InTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(30) /* "in" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_false2(transport: False2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "False" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_finally(transport: FinallyTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(35) /* "finally" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_for(transport: ForTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(29) /* "for" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_def(transport: DefTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(37) /* "def" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_arrow(transport: ArrowTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(38) /* "->" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_from(transport: FromTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(5) /* "from" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_future_u(transport: FutureUTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(6) /* "__future__" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_import(transport: ImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(3) /* "import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_global(transport: GlobalTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(40) /* "global" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_match(transport: MatchTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(26) /* "match" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_coloneq(transport: ColoneqTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(15) /* ":=" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_none2(transport: None2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "None" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_nonlocal(transport: NonlocalTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(41) /* "nonlocal" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_not(transport: NotTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(54) /* "not" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_pass(transport: PassTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(19) /* "pass" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_print(transport: PrintTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(12) /* "print" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_raise(transport: RaiseTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(18) /* "raise" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_return(transport: ReturnTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(16) /* "return" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_anonymous(transport: AnonymousTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(48) /* "_" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_true2(transport: True2Transport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "True" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_try(transport: TryTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(32) /* "try" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_while(transport: WhileTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(31) /* "while" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
        None,
        None,
    ))
}

fn transport_to_node_with(transport: WithTransport) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(36) /* "with" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_id.map(|v| v as u64),
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
    render_transport_dispatch(&transport)
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern_target.jinja", escape = "none")]
pub struct AsPatternTargetTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_as_pattern.jinja", escape = "none")]
pub struct _AsPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_eq.jinja", escape = "none")]
pub struct AssignmentEqTemplate<'a> {
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_type.jinja", escape = "none")]
pub struct AssignmentTypeTemplate<'a> {
    pub r#type: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_assignment_typed.jinja", escape = "none")]
pub struct AssignmentTypedTemplate<'a> {
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub r#type: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_comprehension_clauses.jinja", escape = "none")]
pub struct ComprehensionClausesTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_format_expression.jinja", escape = "none")]
pub struct FormatExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block_block.jinja", escape = "none")]
pub struct MatchBlockBlockTemplate<'a> {
    pub alternative: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_match_block.jinja", escape = "none")]
pub struct MatchBlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_simple_pattern_negative.jinja", escape = "none")]
pub struct SimplePatternNegativeTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "_simple_statements.jinja", escape = "none")]
pub struct SimpleStatementsTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_suite.jinja", escape = "none")]
pub struct SuiteTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "_with_clause_paren.jinja", escape = "none")]
pub struct _WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "aliased_import.jinja", escape = "none")]
pub struct AliasedImportTemplate<'a> {
    pub alias: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "argument_list.jinja", escape = "none")]
pub struct ArgumentListTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "as_pattern.jinja", escape = "none")]
pub struct AsPatternTemplate<'a> {
    pub alias: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assert_statement.jinja", escape = "none")]
pub struct AssertStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "assignment.jinja", escape = "none")]
pub struct AssignmentTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "attribute.jinja", escape = "none")]
pub struct AttributeTemplate<'a> {
    pub attribute: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub object: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "augmented_assignment.jinja", escape = "none")]
pub struct AugmentedAssignmentTemplate<'a> {
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub operator: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "await.jinja", escape = "none")]
pub struct AwaitTemplate<'a> {
    pub primary_expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "binary_operator.jinja", escape = "none")]
pub struct BinaryOperatorTemplate<'a> {
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub operator: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "block.jinja", escape = "none")]
pub struct BlockTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "boolean_operator.jinja", escape = "none")]
pub struct BooleanOperatorTemplate<'a> {
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub operator: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "call.jinja", escape = "none")]
pub struct CallTemplate<'a> {
    pub arguments: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub function: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "case_clause.jinja", escape = "none")]
pub struct CaseClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub consequence: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub guard: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "case_pattern.jinja", escape = "none")]
pub struct CasePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "chevron.jinja", escape = "none")]
pub struct ChevronTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_definition.jinja", escape = "none")]
pub struct ClassDefinitionTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub superclasses: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub type_parameters: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "class_pattern.jinja", escape = "none")]
pub struct ClassPatternTemplate<'a> {
    pub arguments: ::sittir_core::filters::ListNonterminalView<'a>,
    pub dotted_name: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "comparison_operator.jinja", escape = "none")]
pub struct ComparisonOperatorTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub operators: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "complex_pattern.jinja", escape = "none")]
pub struct ComplexPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub imaginary: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub real: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "concatenated_string.jinja", escape = "none")]
pub struct ConcatenatedStringTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "conditional_expression.jinja", escape = "none")]
pub struct ConditionalExpressionTemplate<'a> {
    pub alternative: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub condition: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "constrained_type.jinja", escape = "none")]
pub struct ConstrainedTypeTemplate<'a> {
    pub base_type: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub constraint: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorated_definition.jinja", escape = "none")]
pub struct DecoratedDefinitionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub definition: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "decorator.jinja", escape = "none")]
pub struct DecoratorTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub newline: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "default_parameter.jinja", escape = "none")]
pub struct DefaultParameterTemplate<'a> {
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "delete_statement.jinja", escape = "none")]
pub struct DeleteStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dict_pattern.jinja", escape = "none")]
pub struct DictPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_comprehension.jinja", escape = "none")]
pub struct DictionaryComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat_pattern.jinja", escape = "none")]
pub struct DictionarySplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary_splat.jinja", escape = "none")]
pub struct DictionarySplatTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dictionary.jinja", escape = "none")]
pub struct DictionaryTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "dotted_name.jinja", escape = "none")]
pub struct DottedNameTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "elif_clause.jinja", escape = "none")]
pub struct ElifClauseTemplate<'a> {
    pub condition: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub consequence: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "else_clause.jinja", escape = "none")]
pub struct ElseClauseTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "except_clause.jinja", escape = "none")]
pub struct ExceptClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub alias: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub value: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "exec_statement.jinja", escape = "none")]
pub struct ExecStatementTemplate<'a> {
    pub code: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub in_clause: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_list.jinja", escape = "none")]
pub struct ExpressionListTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement_tuple.jinja", escape = "none")]
pub struct ExpressionStatementTupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "expression_statement.jinja", escape = "none")]
pub struct ExpressionStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub variant: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "finally_clause.jinja", escape = "none")]
pub struct FinallyClauseTemplate<'a> {
    pub block: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_in_clause.jinja", escape = "none")]
pub struct ForInClauseTemplate<'a> {
    pub async_marker: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "for_statement.jinja", escape = "none")]
pub struct ForStatementTemplate<'a> {
    pub alternative: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub async_marker: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "format_specifier.jinja", escape = "none")]
pub struct FormatSpecifierTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "function_definition.jinja", escape = "none")]
pub struct FunctionDefinitionTemplate<'a> {
    pub async_marker: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub parameters: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub return_type: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub type_parameters: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "future_import_statement.jinja", escape = "none")]
pub struct FutureImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generator_expression.jinja", escape = "none")]
pub struct GeneratorExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "generic_type.jinja", escape = "none")]
pub struct GenericTypeTemplate<'a> {
    pub identifier: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub type_parameter: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "global_statement.jinja", escape = "none")]
pub struct GlobalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_clause.jinja", escape = "none")]
pub struct IfClauseTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "if_statement.jinja", escape = "none")]
pub struct IfStatementTemplate<'a> {
    pub alternative: ::sittir_core::filters::ListNonterminalView<'a>,
    pub condition: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub consequence: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_from_statement.jinja", escape = "none")]
pub struct ImportFromStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub module_name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub name: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "import_statement.jinja", escape = "none")]
pub struct ImportStatementTemplate<'a> {
    pub name: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "interpolation.jinja", escape = "none")]
pub struct InterpolationTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub format_specifier: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub type_conversion: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "keyword_argument.jinja", escape = "none")]
pub struct KeywordArgumentTemplate<'a> {
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "keyword_pattern.jinja", escape = "none")]
pub struct KeywordPatternTemplate<'a> {
    pub identifier: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub simple_pattern: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_parameters.jinja", escape = "none")]
pub struct LambdaParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda_within_for_in_clause.jinja", escape = "none")]
pub struct LambdaWithinForInClauseTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub parameters: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "lambda.jinja", escape = "none")]
pub struct LambdaTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub parameters: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_comprehension.jinja", escape = "none")]
pub struct ListComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_pattern.jinja", escape = "none")]
pub struct ListPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat_pattern.jinja", escape = "none")]
pub struct ListSplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list_splat.jinja", escape = "none")]
pub struct ListSplatTemplate<'a> {
    pub expression: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "list.jinja", escape = "none")]
pub struct ListTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "match_statement.jinja", escape = "none")]
pub struct MatchStatementTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub subject: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "member_type.jinja", escape = "none")]
pub struct MemberTypeTemplate<'a> {
    pub base_type: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub identifier: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "module.jinja", escape = "none")]
pub struct ModuleTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "named_expression.jinja", escape = "none")]
pub struct NamedExpressionTemplate<'a> {
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "nonlocal_statement.jinja", escape = "none")]
pub struct NonlocalStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "not_operator.jinja", escape = "none")]
pub struct NotOperatorTemplate<'a> {
    pub argument: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pair.jinja", escape = "none")]
pub struct PairTemplate<'a> {
    pub key: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parameters.jinja", escape = "none")]
pub struct ParametersTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_expression.jinja", escape = "none")]
pub struct ParenthesizedExpressionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "parenthesized_list_splat.jinja", escape = "none")]
pub struct ParenthesizedListSplatTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "pattern_list.jinja", escape = "none")]
pub struct PatternListTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "print_statement.jinja", escape = "none")]
pub struct PrintStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub argument: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "raise_statement.jinja", escape = "none")]
pub struct RaiseStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub cause: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "relative_import.jinja", escape = "none")]
pub struct RelativeImportTemplate<'a> {
    pub dotted_name: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub import_prefix: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "return_statement.jinja", escape = "none")]
pub struct ReturnStatementTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set_comprehension.jinja", escape = "none")]
pub struct SetComprehensionTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "set.jinja", escape = "none")]
pub struct SetTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "slice.jinja", escape = "none")]
pub struct SliceTemplate<'a> {
    pub start: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub step: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub stop: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "splat_pattern.jinja", escape = "none")]
pub struct SplatPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub identifier: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "splat_type.jinja", escape = "none")]
pub struct SplatTypeTemplate<'a> {
    pub identifier: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string_content.jinja", escape = "none")]
pub struct StringContentTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "string.jinja", escape = "none")]
pub struct StringTemplate<'a> {
    pub text: &'a str,
}

#[derive(::askama::Template)]
#[template(path = "subscript.jinja", escape = "none")]
pub struct SubscriptTemplate<'a> {
    pub subscript: ::sittir_core::filters::ListNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "try_statement.jinja", escape = "none")]
pub struct TryStatementTemplate<'a> {
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub else_clause: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub except_clauses: ::sittir_core::filters::ListNonterminalView<'a>,
    pub finally_clause: ::sittir_core::filters::OptionalNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple_pattern.jinja", escape = "none")]
pub struct TuplePatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "tuple.jinja", escape = "none")]
pub struct TupleTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_alias_statement.jinja", escape = "none")]
pub struct TypeAliasStatementTemplate<'a> {
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub r#type: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type_parameter.jinja", escape = "none")]
pub struct TypeParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "type.jinja", escape = "none")]
pub struct TypeTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_default_parameter.jinja", escape = "none")]
pub struct TypedDefaultParameterTemplate<'a> {
    pub name: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub r#type: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "typed_parameter.jinja", escape = "none")]
pub struct TypedParameterTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
    pub r#type: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "unary_operator.jinja", escape = "none")]
pub struct UnaryOperatorTemplate<'a> {
    pub argument: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub operator: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_pattern.jinja", escape = "none")]
pub struct UnionPatternTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "union_type.jinja", escape = "none")]
pub struct UnionTypeTemplate<'a> {
    pub left: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub right: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "while_statement.jinja", escape = "none")]
pub struct WhileStatementTemplate<'a> {
    pub alternative: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub condition: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_bare.jinja", escape = "none")]
pub struct WithClauseBareTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause_paren.jinja", escape = "none")]
pub struct WithClauseParenTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_clause.jinja", escape = "none")]
pub struct WithClauseTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_item.jinja", escape = "none")]
pub struct WithItemTemplate<'a> {
    pub value: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "with_statement.jinja", escape = "none")]
pub struct WithStatementTemplate<'a> {
    pub async_marker: ::sittir_core::filters::OptionalNonterminalView<'a>,
    pub body: ::sittir_core::filters::SingleNonterminalView<'a>,
    pub with_clause: ::sittir_core::filters::SingleNonterminalView<'a>,
}

#[derive(::askama::Template)]
#[template(path = "yield.jinja", escape = "none")]
pub struct YieldTemplate<'a> {
    pub children: ::sittir_core::filters::ListNonterminalView<'a>,
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
        let mut scalar = String::new();
        if leading_sep && !items.is_empty() {
            scalar.push_str(separator);
        }
        let mut first = true;
        for item in &items {
            if !first {
                scalar.push_str(separator);
            }
            scalar.push_str(item);
            first = false;
        }
        if trailing_sep && !items.is_empty() {
            scalar.push_str(separator);
        }
        Self {
            kind: ResolvedFieldKind::List,
            scalar,
            items,
            separator,
            leading_sep,
            trailing_sep,
        }
    }

    fn as_scalar(&self) -> &str {
        self.scalar.as_str()
    }

    fn renderable_items(&self) -> Vec<::sittir_core::filters::Renderable<'_>> {
        self.items.iter().map(|s| ::sittir_core::filters::Renderable::Text(s.as_str())).collect()
    }
}

fn separator_for(kind_id: u16) -> &'static str {
    match kind_id {
        245 => ",", // "_with_clause_paren"
        169 => ",", // "dict_pattern"
        218 => ",", // "dictionary"
        162 => ".", // "dotted_name"
        243 => ",", // "expression_statement_tuple"
        147 => ",", // "lambda_parameters"
        216 => ",", // "set"
        155 => ",", // "type_parameter"
        244 => ",", // "with_clause_bare"
        245 => ",", // "with_clause_paren"
        _ => "",
    }
}

fn variant_for(parent_id: u16, child_id: u16) -> Option<&'static str> {
    match (parent_id, child_id) {
        (198, 240) => Some("eq"), // ("assignment", "assignment_eq")
        (198, 241) => Some("eq"), // ("assignment", "assignment_type")
        (198, 242) => Some("eq"), // ("assignment", "assignment_typed")
        (122, 243) => Some("tuple"), // ("expression_statement", "expression_statement_tuple")
        (143, 244) => Some("bare"), // ("with_clause", "with_clause_bare")
        (143, 245) => Some("bare"), // ("with_clause", "with_clause_paren")
        _ => None,
    }
}

fn first_named_child_kind_id(node: &NodeData) -> Option<u16> {
    node.children.as_ref()?.iter().find(|child| child.named).map(|child| child.type_.0)
}

fn resolve_variant(node: &NodeData) -> &'static str {
    first_named_child_kind_id(node)
        .and_then(|child_id| variant_for(node.type_.0, child_id))
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
                separator_for(node.type_.0),
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
        separator_for(node.type_.0),
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
    let children_renderables = children.renderable_items();
    let template = AsPatternTargetTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _AsPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_assignment_eq(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let template = AssignmentEqTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_hidden_assignment_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let template = AssignmentTypeTemplate {
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_hidden_assignment_typed(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["right", "type"])?;
    let field_0 = resolve_field(node, "right", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let template = AssignmentTypedTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_hidden_comprehension_clauses(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ComprehensionClausesTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_format_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FormatExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_match_block_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = MatchBlockBlockTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_match_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = MatchBlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
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
    let children_renderables = children.renderable_items();
    let template = SimpleStatementsTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_suite(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SuiteTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_hidden_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = _WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_aliased_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "name"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "name", true)?;
    let template = AliasedImportTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_argument_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ArgumentListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_as_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "expression"])?;
    let field_0 = resolve_field(node, "alias", true)?;
    let field_1 = resolve_field(node, "expression", true)?;
    let template = AsPatternTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_assert_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = AssertStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let children_renderables = children.renderable_items();
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_attribute(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["attribute", "object"])?;
    let field_0 = resolve_field(node, "attribute", true)?;
    let field_1 = resolve_field(node, "object", true)?;
    let template = AttributeTemplate {
        attribute: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        object: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_augmented_assignment(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = AugmentedAssignmentTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_await(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["primary_expression"])?;
    let field_0 = resolve_field(node, "primary_expression", true)?;
    let template = AwaitTemplate {
        primary_expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_binary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BinaryOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_block(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = BlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_boolean_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operator", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let template = BooleanOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_call(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "function"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "function", true)?;
    let template = CallTemplate {
        arguments: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        function: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_case_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["consequence", "guard"])?;
    let field_0 = resolve_field(node, "consequence", true)?;
    let field_1 = resolve_field(node, "guard", false)?;
    let children_renderables = children.renderable_items();
    let template = CaseClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        guard: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

fn render_case_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = CasePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_chevron(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ChevronTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
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
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        superclasses: match field_2.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
        type_parameters: match field_3.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

fn render_class_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["arguments", "dotted_name"])?;
    let field_0 = resolve_field(node, "arguments", true)?;
    let field_1 = resolve_field(node, "dotted_name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ClassPatternTemplate {
        arguments: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        dotted_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_comparison_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "operators"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "operators", true)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ComparisonOperatorTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operators: ::sittir_core::filters::ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

fn render_complex_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["imaginary", "real"])?;
    let field_0 = resolve_field(node, "imaginary", true)?;
    let field_1 = resolve_field(node, "real", false)?;
    let children_renderables = children.renderable_items();
    let template = ComplexPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        imaginary: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        real: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

fn render_concatenated_string(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ConcatenatedStringTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_conditional_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", true)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = ConditionalExpressionTemplate {
        alternative: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_constrained_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "constraint"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "constraint", true)?;
    let template = ConstrainedTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        constraint: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_decorated_definition(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["definition"])?;
    let field_0 = resolve_field(node, "definition", true)?;
    let children_renderables = children.renderable_items();
    let template = DecoratedDefinitionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        definition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_decorator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "newline"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "newline", false)?;
    let template = DecoratorTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        newline: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

fn render_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = DefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_delete_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DeleteStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_dict_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_dictionary_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = DictionaryComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_dictionary_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictionarySplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_dictionary_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = DictionarySplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_dictionary(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DictionaryTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_dotted_name(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = DottedNameTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_elif_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["condition", "consequence"])?;
    let field_0 = resolve_field(node, "condition", true)?;
    let field_1 = resolve_field(node, "consequence", true)?;
    let template = ElifClauseTemplate {
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_else_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let template = ElseClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_except_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alias", "value"])?;
    let field_0 = resolve_field(node, "alias", false)?;
    let field_1 = resolve_field(node, "value", false)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ExceptClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        alias: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        value: ::sittir_core::filters::ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

fn render_exec_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["code", "in_clause"])?;
    let field_0 = resolve_field(node, "code", true)?;
    let field_1 = resolve_field(node, "in_clause", false)?;
    let field_1_renderables = field_1.renderable_items();
    let template = ExecStatementTemplate {
        code: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        in_clause: ::sittir_core::filters::ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

fn render_expression_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_expression_statement_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_expression_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let variant = resolve_variant(node);
    let children_renderables = children.renderable_items();
    let template = ExpressionStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        variant,
    };
    template.render()
}

fn render_finally_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["block"])?;
    let field_0 = resolve_field(node, "block", true)?;
    let template = FinallyClauseTemplate {
        block: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "left", "right"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "left", true)?;
    let field_2 = resolve_field(node, "right", true)?;
    let field_2_renderables = field_2.renderable_items();
    let template = ForInClauseTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        right: ::sittir_core::filters::ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
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
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        async_marker: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
    };
    template.render()
}

fn render_format_specifier(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = FormatSpecifierTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
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
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        parameters: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        return_type: match field_4.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_4.as_scalar())),
        },
        type_parameters: match field_5.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_5.as_scalar())),
        },
    };
    template.render()
}

fn render_future_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = FutureImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

fn render_generator_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = GeneratorExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_generic_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "type_parameter"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "type_parameter", true)?;
    let template = GenericTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        type_parameter: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_global_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = GlobalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_if_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = IfClauseTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_if_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "condition", "consequence"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "condition", true)?;
    let field_2 = resolve_field(node, "consequence", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = IfStatementTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_import_from_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["module_name", "name"])?;
    let field_0 = resolve_field(node, "module_name", true)?;
    let field_1 = resolve_field(node, "name", false)?;
    let children_renderables = children.renderable_items();
    let field_1_renderables = field_1.renderable_items();
    let template = ImportFromStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        module_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        name: ::sittir_core::filters::ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

fn render_import_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = ImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

fn render_interpolation(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression", "format_specifier", "type_conversion"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let field_1 = resolve_field(node, "format_specifier", false)?;
    let field_2 = resolve_field(node, "type_conversion", false)?;
    let template = InterpolationTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        format_specifier: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        type_conversion: match field_2.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

fn render_keyword_argument(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = KeywordArgumentTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_keyword_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier", "simple_pattern"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_1 = resolve_field(node, "simple_pattern", true)?;
    let template = KeywordPatternTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        simple_pattern: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_lambda_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = LambdaParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_lambda_within_for_in_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaWithinForInClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        parameters: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

fn render_lambda(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "parameters"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "parameters", false)?;
    let template = LambdaTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        parameters: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
    };
    template.render()
}

fn render_list_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = ListComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_list_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_list_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListSplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["expression"])?;
    let field_0 = resolve_field(node, "expression", true)?;
    let template = ListSplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_match_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "subject"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "subject", true)?;
    let field_1_renderables = field_1.renderable_items();
    let template = MatchStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        subject: ::sittir_core::filters::ListNonterminalView {
            items: field_1_renderables.as_slice(),
            separator: field_1.separator,
            leading: field_1.leading_sep,
            trailing: field_1.trailing_sep,
        },
    };
    template.render()
}

fn render_member_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["base_type", "identifier"])?;
    let field_0 = resolve_field(node, "base_type", true)?;
    let field_1 = resolve_field(node, "identifier", true)?;
    let template = MemberTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_module(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ModuleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_named_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = NamedExpressionTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_nonlocal_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = NonlocalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_not_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let template = NotOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_pair(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["key", "value"])?;
    let field_0 = resolve_field(node, "key", true)?;
    let field_1 = resolve_field(node, "value", true)?;
    let template = PairTemplate {
        key: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_parameters(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_parenthesized_expression(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_parenthesized_list_splat(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ParenthesizedListSplatTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_pattern_list(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = PatternListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_print_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let children_renderables = children.renderable_items();
    let field_0_renderables = field_0.renderable_items();
    let template = PrintStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        argument: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
    };
    template.render()
}

fn render_raise_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["cause"])?;
    let field_0 = resolve_field(node, "cause", false)?;
    let children_renderables = children.renderable_items();
    let template = RaiseStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        cause: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
    };
    template.render()
}

fn render_relative_import(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["dotted_name", "import_prefix"])?;
    let field_0 = resolve_field(node, "dotted_name", false)?;
    let field_1 = resolve_field(node, "import_prefix", true)?;
    let template = RelativeImportTemplate {
        dotted_name: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        import_prefix: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_return_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = ReturnStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_set_comprehension(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let children_renderables = children.renderable_items();
    let template = SetComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_set(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = SetTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_slice(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["start", "step", "stop"])?;
    let field_0 = resolve_field(node, "start", false)?;
    let field_1 = resolve_field(node, "step", false)?;
    let field_2 = resolve_field(node, "stop", false)?;
    let template = SliceTemplate {
        start: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        step: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        stop: match field_2.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
        },
    };
    template.render()
}

fn render_splat_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let children_renderables = children.renderable_items();
    let template = SplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_splat_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["identifier"])?;
    let field_0 = resolve_field(node, "identifier", true)?;
    let field_0_renderables = field_0.renderable_items();
    let template = SplatTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_string_content(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = StringContentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
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
    let field_0_renderables = field_0.renderable_items();
    let template = SubscriptTemplate {
        subscript: ::sittir_core::filters::ListNonterminalView {
            items: field_0_renderables.as_slice(),
            separator: field_0.separator,
            leading: field_0.leading_sep,
            trailing: field_0.trailing_sep,
        },
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_try_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["body", "else_clause", "except_clauses", "finally_clause"])?;
    let field_0 = resolve_field(node, "body", true)?;
    let field_1 = resolve_field(node, "else_clause", false)?;
    let field_2 = resolve_field(node, "except_clauses", true)?;
    let field_3 = resolve_field(node, "finally_clause", false)?;
    let field_2_renderables = field_2.renderable_items();
    let template = TryStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        else_clause: match field_1.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        },
        except_clauses: ::sittir_core::filters::ListNonterminalView {
            items: field_2_renderables.as_slice(),
            separator: field_2.separator,
            leading: field_2.leading_sep,
            trailing: field_2.trailing_sep,
        },
        finally_clause: match field_3.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_3.as_scalar())),
        },
    };
    template.render()
}

fn render_tuple_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TuplePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_tuple(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_type_alias_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right", "type"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let field_2 = resolve_field(node, "type", true)?;
    let template = TypeAliasStatementTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_type_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = TypeTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_typed_default_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["name", "type", "value"])?;
    let field_0 = resolve_field(node, "name", true)?;
    let field_1 = resolve_field(node, "type", true)?;
    let field_2 = resolve_field(node, "value", true)?;
    let template = TypedDefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_typed_parameter(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["type"])?;
    let field_0 = resolve_field(node, "type", true)?;
    let children_renderables = children.renderable_items();
    let template = TypedParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_unary_operator(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["argument", "operator"])?;
    let field_0 = resolve_field(node, "argument", true)?;
    let field_1 = resolve_field(node, "operator", true)?;
    let template = UnaryOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_union_pattern(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = UnionPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_union_type(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["left", "right"])?;
    let field_0 = resolve_field(node, "left", true)?;
    let field_1 = resolve_field(node, "right", true)?;
    let template = UnionTypeTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
    };
    template.render()
}

fn render_while_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["alternative", "body", "condition"])?;
    let field_0 = resolve_field(node, "alternative", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "condition", true)?;
    let template = WhileStatementTemplate {
        alternative: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_with_clause_bare(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseBareTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_with_clause_paren(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_with_clause(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = WithClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}

fn render_with_item(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["value"])?;
    let field_0 = resolve_field(node, "value", true)?;
    let template = WithItemTemplate {
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
    };
    template.render()
}

fn render_with_statement(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &["async_marker", "body", "with_clause"])?;
    let field_0 = resolve_field(node, "async_marker", false)?;
    let field_1 = resolve_field(node, "body", true)?;
    let field_2 = resolve_field(node, "with_clause", true)?;
    let template = WithStatementTemplate {
        async_marker: match field_0.kind {
            ResolvedFieldKind::Missing => ::sittir_core::filters::OptionalNonterminalView::Missing,
            ResolvedFieldKind::Scalar | ResolvedFieldKind::List => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text(field_0.as_scalar())),
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_1.as_scalar())),
        with_clause: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Text(field_2.as_scalar())),
    };
    template.render()
}

fn render_yield(node: &NodeData) -> Result<String, ::askama::Error> {
    let children = resolve_children(node, &[])?;
    let children_renderables = children.renderable_items();
    let template = YieldTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_renderables.as_slice(),
            separator: children.separator,
            leading: children.leading_sep,
            trailing: children.trailing_sep,
        },
    };
    template.render()
}


pub fn render_dispatch(node: &::sittir_core::types::NodeData) -> Result<String, ::askama::Error> {
    if node.fields.is_none() && node.children.is_none() {
        if let Some(text) = &node.text {
            return Ok(text.clone());
        }
    }
    match node.type_.0 {
        284 => render_hidden_as_pattern_target(node), // "_as_pattern_target" | "as_pattern_target"
        165 | 185 => render_hidden_as_pattern(node), // "_as_pattern" | "as_pattern"
        240 => render_hidden_assignment_eq(node), // "_assignment_eq" | "assignment_eq"
        241 => render_hidden_assignment_type(node), // "_assignment_type" | "assignment_type"
        242 => render_hidden_assignment_typed(node), // "_assignment_typed" | "assignment_typed"
        224 => render_hidden_comprehension_clauses(node), // "_comprehension_clauses"
        285 => render_hidden_format_expression(node), // "_format_expression" | "format_expression"
        246 => render_hidden_match_block_block(node), // "_match_block_block" | "match_block_block"
        135 => render_hidden_match_block(node), // "_match_block"
        248 => render_hidden_simple_pattern_negative(node), // "_simple_pattern_negative" | "simple_pattern_negative"
        110 => render_hidden_simple_statements(node), // "_simple_statements"
        245 => render_hidden_with_clause_paren(node), // "_with_clause_paren" | "with_clause_paren"
        117 => render_aliased_import(node), // "aliased_import"
        157 => render_argument_list(node), // "argument_list"
        185 => render_as_pattern(node), // "as_pattern"
        121 => render_assert_statement(node), // "assert_statement"
        198 => render_assignment(node), // "assignment"
        203 => render_attribute(node), // "attribute"
        199 => render_augmented_assignment(node), // "augmented_assignment"
        237 => render_await(node), // "await"
        191 => render_binary_operator(node), // "binary_operator"
        160 => render_block(node), // "block"
        190 => render_boolean_operator(node), // "boolean_operator"
        206 => render_call(node), // "call"
        136 => render_case_clause(node), // "case_clause"
        163 => render_case_pattern(node), // "case_pattern"
        120 => render_chevron(node), // "chevron"
        154 => render_class_definition(node), // "class_definition"
        173 => render_class_pattern(node), // "class_pattern"
        195 => render_comparison_operator(node), // "comparison_operator"
        174 => render_complex_pattern(node), // "complex_pattern"
        230 => render_concatenated_string(node), // "concatenated_string"
        229 => render_conditional_expression(node), // "conditional_expression"
        212 => render_constrained_type(node), // "constrained_type"
        158 => render_decorated_definition(node), // "decorated_definition"
        159 => render_decorator(node), // "decorator"
        181 => render_default_parameter(node), // "default_parameter"
        126 => render_delete_statement(node), // "delete_statement"
        169 => render_dict_pattern(node), // "dict_pattern"
        221 => render_dictionary_comprehension(node), // "dictionary_comprehension"
        184 => render_dictionary_splat_pattern(node), // "dictionary_splat_pattern"
        149 => render_dictionary_splat(node), // "dictionary_splat"
        218 => render_dictionary(node), // "dictionary"
        162 => render_dotted_name(node), // "dotted_name"
        132 => render_elif_clause(node), // "elif_clause"
        133 => render_else_clause(node), // "else_clause"
        140 => render_except_clause(node), // "except_clause"
        152 => render_exec_statement(node), // "exec_statement"
        161 => render_expression_list(node), // "expression_list"
        243 => render_expression_statement_tuple(node), // "expression_statement_tuple"
        122 => render_expression_statement(node), // "expression_statement"
        141 => render_finally_clause(node), // "finally_clause"
        227 => render_for_in_clause(node), // "for_in_clause"
        137 => render_for_statement(node), // "for_statement"
        236 => render_format_specifier(node), // "format_specifier"
        145 => render_function_definition(node), // "function_definition"
        114 => render_future_import_statement(node), // "future_import_statement"
        223 => render_generator_expression(node), // "generator_expression"
        210 => render_generic_type(node), // "generic_type"
        150 => render_global_statement(node), // "global_statement"
        228 => render_if_clause(node), // "if_clause"
        131 => render_if_statement(node), // "if_statement"
        115 => render_import_from_statement(node), // "import_from_statement"
        111 => render_import_statement(node), // "import_statement"
        233 => render_interpolation(node), // "interpolation"
        214 => render_keyword_argument(node), // "keyword_argument"
        171 => render_keyword_pattern(node), // "keyword_pattern"
        147 => render_lambda_parameters(node), // "lambda_parameters"
        197 => render_lambda_within_for_in_clause(node), // "lambda_within_for_in_clause"
        196 => render_lambda(node), // "lambda"
        220 => render_list_comprehension(node), // "list_comprehension"
        180 => render_list_pattern(node), // "list_pattern"
        183 => render_list_splat_pattern(node), // "list_splat_pattern"
        148 => render_list_splat(node), // "list_splat"
        215 => render_list(node), // "list"
        134 => render_match_statement(node), // "match_statement"
        213 => render_member_type(node), // "member_type"
        108 => render_module(node), // "module"
        123 => render_named_expression(node), // "named_expression"
        151 => render_nonlocal_statement(node), // "nonlocal_statement"
        189 => render_not_operator(node), // "not_operator"
        219 => render_pair(node), // "pair"
        146 => render_parameters(node), // "parameters"
        225 => render_parenthesized_expression(node), // "parenthesized_expression"
        156 => render_parenthesized_list_splat(node), // "parenthesized_list_splat"
        200 => render_pattern_list(node), // "pattern_list"
        119 => render_print_statement(node), // "print_statement"
        127 => render_raise_statement(node), // "raise_statement"
        113 => render_relative_import(node), // "relative_import"
        125 => render_return_statement(node), // "return_statement"
        222 => render_set_comprehension(node), // "set_comprehension"
        216 => render_set(node), // "set"
        205 => render_slice(node), // "slice"
        172 => render_splat_pattern(node), // "splat_pattern"
        209 => render_splat_type(node), // "splat_type"
        232 => render_string_content(node), // "string_content"
        231 => render_string(node), // "string"
        204 => render_subscript(node), // "subscript"
        139 => render_try_statement(node), // "try_statement"
        179 => render_tuple_pattern(node), // "tuple_pattern"
        217 => render_tuple(node), // "tuple"
        153 => render_type_alias_statement(node), // "type_alias_statement"
        155 => render_type_parameter(node), // "type_parameter"
        208 => render_type(node), // "type"
        182 => render_typed_default_parameter(node), // "typed_default_parameter"
        207 => render_typed_parameter(node), // "typed_parameter"
        192 => render_unary_operator(node), // "unary_operator"
        166 => render_union_pattern(node), // "union_pattern"
        211 => render_union_type(node), // "union_type"
        138 => render_while_statement(node), // "while_statement"
        244 => render_with_clause_bare(node), // "with_clause_bare"
        245 => render_with_clause_paren(node), // "with_clause_paren"
        143 => render_with_clause(node), // "with_clause"
        144 => render_with_item(node), // "with_item"
        142 => render_with_statement(node), // "with_statement"
        202 => render_yield(node), // "yield"
        _ => token_shaped_fallback(node),
    }
}

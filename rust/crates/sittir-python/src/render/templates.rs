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

use ::sittir_core::types::RenderableTransport as _;

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
    AssignmentEq(AssignmentEqTransport),
    AssignmentType(AssignmentTypeTransport),
    AssignmentTyped(AssignmentTypedTransport),
    AsyncMarker(bool),
    AugmentedAssignmentOperator(AugmentedAssignmentOperatorEnum),
    BinaryOperatorOperator(bool),
    BooleanOperatorOperator(bool),
    ComprehensionClauses(ComprehensionClausesTransport),
    _Identifier(_IdentifierEnum),
    ImportList(ImportListTransport),
    IsNot(IsNotTransport),
    KeyValuePattern(KeyValuePatternTransport),
    KwAsyncMarker(KwAsyncMarkerTransport),
    KwType(KwTypeTransport),
    _ListPattern(_ListPatternTransport),
    MatchBlock(MatchBlockTransport),
    MatchBlockBlock(MatchBlockBlockTransport),
    NotEscapeSequence(NotEscapeSequenceTransport),
    NotIn(NotInTransport),
    SimplePatternNegative(SimplePatternNegativeTransport),
    SimpleStatements(SimpleStatementsTransport),
    Suite(SuiteTransport),
    _TuplePattern(_TuplePatternTransport),
    TypeAliasStatementType(bool),
    UnaryOperatorOperator(UnaryOperatorOperatorEnum),
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
    Break(BreakTransport),
    Case(CaseTransport),
    Shr(ShrTransport),
    Class(ClassTransport),
    If(IfTransport),
    Else(ElseTransport),
    Continue(ContinueTransport),
    At(AtTransport),
    Del(DelTransport),
    Brace(BraceTransport),
    Starstar(StarstarTransport),
    Elif(ElifTransport),
    Ellipsis(EllipsisTransport),
    Star(StarTransport),
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
    Slash(SlashTransport),
    Print(PrintTransport),
    Raise(RaiseTransport),
    Return(ReturnTransport),
    Anonymous(AnonymousTransport),
    True2(True2Transport),
    Try(TryTransport),
    Pipe(PipeTransport),
    While(WhileTransport),
    With(WithTransport),
    Literal0_3c,
    Literal1_3c_3d,
    Literal2_3d_3d,
    Literal3_21_3d,
    Literal4_3e_3d,
    Literal5_3e,
    Literal6_3c_3e,
    Literal7_6e_6f_74_20_69_6e,
    Literal8_69_73,
    Literal9_69_73_20_6e_6f_74,
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
            // kind: _as_pattern (_AS_PATTERN)
            165 => Ok(AnyTransport::_AsPattern(
                _AsPatternTransport::from_napi_value(env, napi_val)?
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
            // kind: _kw_type (_KW_TYPE)
            251 => Ok(AnyTransport::KwType(
                KwTypeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _list_pattern (_LIST_PATTERN)
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
            // kind: _tuple_pattern (_TUPLE_PATTERN)
            168 => Ok(AnyTransport::_TuplePattern(
                _TuplePatternTransport::from_napi_value(env, napi_val)?
            )),
            // kind: _with_clause_paren (_WITH_CLAUSE_PAREN)
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
            // kind: _string_content (_STRING_CONTENT)
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
            // kind: break (BREAK)
            20 => Ok(AnyTransport::Break(
                BreakTransport::from_napi_value(env, napi_val)?
            )),
            // kind: case (CASE)
            27 => Ok(AnyTransport::Case(
                CaseTransport::from_napi_value(env, napi_val)?
            )),
            // kind: >> (SHR)
            13 => Ok(AnyTransport::Shr(
                ShrTransport::from_napi_value(env, napi_val)?
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
            // kind: @ (AT)
            47 => Ok(AnyTransport::At(
                AtTransport::from_napi_value(env, napi_val)?
            )),
            // kind: del (DEL)
            17 => Ok(AnyTransport::Del(
                DelTransport::from_napi_value(env, napi_val)?
            )),
            // kind: { (BRACE)
            50 => Ok(AnyTransport::Brace(
                BraceTransport::from_napi_value(env, napi_val)?
            )),
            // kind: ** (STARSTAR)
            39 => Ok(AnyTransport::Starstar(
                StarstarTransport::from_napi_value(env, napi_val)?
            )),
            // kind: elif (ELIF)
            24 => Ok(AnyTransport::Elif(
                ElifTransport::from_napi_value(env, napi_val)?
            )),
            // kind: * (STAR)
            11 => Ok(AnyTransport::Star(
                StarTransport::from_napi_value(env, napi_val)?
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
            // kind: __future__ (__FUTURE_U)
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
            // kind: / (SLASH)
            57 => Ok(AnyTransport::Slash(
                SlashTransport::from_napi_value(env, napi_val)?
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
            // kind: | (PIPE)
            49 => Ok(AnyTransport::Pipe(
                PipeTransport::from_napi_value(env, napi_val)?
            )),
            // kind: while (WHILE)
            31 => Ok(AnyTransport::While(
                WhileTransport::from_napi_value(env, napi_val)?
            )),
            // kind: with (WITH)
            36 => Ok(AnyTransport::With(
                WithTransport::from_napi_value(env, napi_val)?
            )),
            // literal kind: < → "<"
            65 => Ok(AnyTransport::Literal0_3c),
            // literal kind: <= → "<="
            66 => Ok(AnyTransport::Literal1_3c_3d),
            // literal kind: == → "=="
            67 => Ok(AnyTransport::Literal2_3d_3d),
            // literal kind: != → "!="
            68 => Ok(AnyTransport::Literal3_21_3d),
            // literal kind: >= → ">="
            69 => Ok(AnyTransport::Literal4_3e_3d),
            // literal kind: > → ">"
            70 => Ok(AnyTransport::Literal5_3e),
            // literal kind: <> → "<>"
            71 => Ok(AnyTransport::Literal6_3c_3e),
            // literal kind: not in → "not in"
            193 => Ok(AnyTransport::Literal7_6e_6f_74_20_69_6e),
            // literal kind: is → "is"
            64 => Ok(AnyTransport::Literal8_69_73),
            // literal kind: is not → "is not"
            194 => Ok(AnyTransport::Literal9_69_73_20_6e_6f_74),
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



#[derive(Debug, Clone)]
pub enum CompoundStatementTransport {
    IfStatement(Box<IfStatementTransport>),
    ForStatement(Box<ForStatementTransport>),
    WhileStatement(Box<WhileStatementTransport>),
    TryStatement(Box<TryStatementTransport>),
    WithStatement(Box<WithStatementTransport>),
    FunctionDefinition(Box<FunctionDefinitionTransport>),
    ClassDefinition(Box<ClassDefinitionTransport>),
    DecoratedDefinition(Box<DecoratedDefinitionTransport>),
    MatchStatement(Box<MatchStatementTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CompoundStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in CompoundStatementTransport"))?;
        match kind_id {
            131 => Ok(Self::IfStatement(Box::new(
                IfStatementTransport::from_napi_value(env, napi_val)?
            ))),
            137 => Ok(Self::ForStatement(Box::new(
                ForStatementTransport::from_napi_value(env, napi_val)?
            ))),
            138 => Ok(Self::WhileStatement(Box::new(
                WhileStatementTransport::from_napi_value(env, napi_val)?
            ))),
            139 => Ok(Self::TryStatement(Box::new(
                TryStatementTransport::from_napi_value(env, napi_val)?
            ))),
            142 => Ok(Self::WithStatement(Box::new(
                WithStatementTransport::from_napi_value(env, napi_val)?
            ))),
            145 => Ok(Self::FunctionDefinition(Box::new(
                FunctionDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            154 => Ok(Self::ClassDefinition(Box::new(
                ClassDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            158 => Ok(Self::DecoratedDefinition(Box::new(
                DecoratedDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            134 => Ok(Self::MatchStatement(Box::new(
                MatchStatementTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in CompoundStatementTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CompoundStatementTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CompoundStatementTransport is receive-only"))
    }
}

fn compound_statement_transport_to_any(t: CompoundStatementTransport) -> AnyTransport {
    match t {
        CompoundStatementTransport::IfStatement(inner) => AnyTransport::IfStatement(*inner),
        CompoundStatementTransport::ForStatement(inner) => AnyTransport::ForStatement(*inner),
        CompoundStatementTransport::WhileStatement(inner) => AnyTransport::WhileStatement(*inner),
        CompoundStatementTransport::TryStatement(inner) => AnyTransport::TryStatement(*inner),
        CompoundStatementTransport::WithStatement(inner) => AnyTransport::WithStatement(*inner),
        CompoundStatementTransport::FunctionDefinition(inner) => AnyTransport::FunctionDefinition(*inner),
        CompoundStatementTransport::ClassDefinition(inner) => AnyTransport::ClassDefinition(*inner),
        CompoundStatementTransport::DecoratedDefinition(inner) => AnyTransport::DecoratedDefinition(*inner),
        CompoundStatementTransport::MatchStatement(inner) => AnyTransport::MatchStatement(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for CompoundStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_compound_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum DictPatternKvTransport {
    KeyValuePattern(Box<KeyValuePatternTransport>),
    SplatPattern(Box<SplatPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for DictPatternKvTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in DictPatternKvTransport"))?;
        match kind_id {
            170 => Ok(Self::KeyValuePattern(Box::new(
                KeyValuePatternTransport::from_napi_value(env, napi_val)?
            ))),
            172 => Ok(Self::SplatPattern(Box::new(
                SplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in DictPatternKvTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DictPatternKvTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("DictPatternKvTransport is receive-only"))
    }
}

fn dict_pattern_kv_transport_to_any(t: DictPatternKvTransport) -> AnyTransport {
    match t {
        DictPatternKvTransport::KeyValuePattern(inner) => AnyTransport::KeyValuePattern(*inner),
        DictPatternKvTransport::SplatPattern(inner) => AnyTransport::SplatPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for DictPatternKvTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dict_pattern_kv_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum ExpressionWithinForInClauseTransport {
    Expression(Box<ExpressionTransport>),
    LambdaWithinForInClause(Box<LambdaWithinForInClauseTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ExpressionWithinForInClauseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ExpressionWithinForInClauseTransport"))?;
        match kind_id {
            187 => Ok(Self::Expression(Box::new(
                ExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            197 => Ok(Self::LambdaWithinForInClause(Box::new(
                LambdaWithinForInClauseTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ExpressionWithinForInClauseTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ExpressionWithinForInClauseTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ExpressionWithinForInClauseTransport is receive-only"))
    }
}

fn expression_within_for_in_clause_transport_to_any(t: ExpressionWithinForInClauseTransport) -> AnyTransport {
    match t {
        ExpressionWithinForInClauseTransport::Expression(inner) => expression_transport_to_any(*inner),
        ExpressionWithinForInClauseTransport::LambdaWithinForInClause(inner) => AnyTransport::LambdaWithinForInClause(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ExpressionWithinForInClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_within_for_in_clause_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum ExpressionsTransport {
    Expression(Box<ExpressionTransport>),
    ExpressionList(Box<ExpressionListTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ExpressionsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ExpressionsTransport"))?;
        match kind_id {
            187 => Ok(Self::Expression(Box::new(
                ExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            161 => Ok(Self::ExpressionList(Box::new(
                ExpressionListTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ExpressionsTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ExpressionsTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ExpressionsTransport is receive-only"))
    }
}

fn expressions_transport_to_any(t: ExpressionsTransport) -> AnyTransport {
    match t {
        ExpressionsTransport::Expression(inner) => expression_transport_to_any(*inner),
        ExpressionsTransport::ExpressionList(inner) => AnyTransport::ExpressionList(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ExpressionsTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expressions_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum FExpressionTransport {
    Expression(Box<ExpressionTransport>),
    ExpressionList(Box<ExpressionListTransport>),
    PatternList(Box<PatternListTransport>),
    Yield(Box<YieldTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for FExpressionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in FExpressionTransport"))?;
        match kind_id {
            187 => Ok(Self::Expression(Box::new(
                ExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            161 => Ok(Self::ExpressionList(Box::new(
                ExpressionListTransport::from_napi_value(env, napi_val)?
            ))),
            200 => Ok(Self::PatternList(Box::new(
                PatternListTransport::from_napi_value(env, napi_val)?
            ))),
            202 => Ok(Self::Yield(Box::new(
                YieldTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in FExpressionTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FExpressionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("FExpressionTransport is receive-only"))
    }
}

fn fexpression_transport_to_any(t: FExpressionTransport) -> AnyTransport {
    match t {
        FExpressionTransport::Expression(inner) => expression_transport_to_any(*inner),
        FExpressionTransport::ExpressionList(inner) => AnyTransport::ExpressionList(*inner),
        FExpressionTransport::PatternList(inner) => AnyTransport::PatternList(*inner),
        FExpressionTransport::Yield(inner) => AnyTransport::Yield(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for FExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_fexpression_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum LeftHandSideTransport {
    Pattern(Box<PatternTransport>),
    PatternList(Box<PatternListTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LeftHandSideTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in LeftHandSideTransport"))?;
        match kind_id {
            178 => Ok(Self::Pattern(Box::new(
                PatternTransport::from_napi_value(env, napi_val)?
            ))),
            200 => Ok(Self::PatternList(Box::new(
                PatternListTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in LeftHandSideTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LeftHandSideTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LeftHandSideTransport is receive-only"))
    }
}

fn left_hand_side_transport_to_any(t: LeftHandSideTransport) -> AnyTransport {
    match t {
        LeftHandSideTransport::Pattern(inner) => pattern_transport_to_any(*inner),
        LeftHandSideTransport::PatternList(inner) => AnyTransport::PatternList(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for LeftHandSideTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_left_hand_side_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum NamedExpressionLhsTransport {
    Identifier(IdentifierTransport),
    KeywordIdentifier(Box<KeywordIdentifierTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedExpressionLhsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in NamedExpressionLhsTransport"))?;
        match kind_id {
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in NamedExpressionLhsTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedExpressionLhsTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedExpressionLhsTransport is receive-only"))
    }
}

fn named_expression_lhs_transport_to_any(t: NamedExpressionLhsTransport) -> AnyTransport {
    match t {
        NamedExpressionLhsTransport::Identifier(inner) => AnyTransport::Identifier(inner),
        NamedExpressionLhsTransport::KeywordIdentifier(inner) => keyword_identifier_transport_to_any(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for NamedExpressionLhsTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_named_expression_lhs_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum RightHandSideTransport {
    Expression(Box<ExpressionTransport>),
    ExpressionList(Box<ExpressionListTransport>),
    Assignment(Box<AssignmentTransport>),
    AugmentedAssignment(Box<AugmentedAssignmentTransport>),
    PatternList(Box<PatternListTransport>),
    Yield(Box<YieldTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for RightHandSideTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in RightHandSideTransport"))?;
        match kind_id {
            187 => Ok(Self::Expression(Box::new(
                ExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            161 => Ok(Self::ExpressionList(Box::new(
                ExpressionListTransport::from_napi_value(env, napi_val)?
            ))),
            198 => Ok(Self::Assignment(Box::new(
                AssignmentTransport::from_napi_value(env, napi_val)?
            ))),
            199 => Ok(Self::AugmentedAssignment(Box::new(
                AugmentedAssignmentTransport::from_napi_value(env, napi_val)?
            ))),
            200 => Ok(Self::PatternList(Box::new(
                PatternListTransport::from_napi_value(env, napi_val)?
            ))),
            202 => Ok(Self::Yield(Box::new(
                YieldTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in RightHandSideTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RightHandSideTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("RightHandSideTransport is receive-only"))
    }
}

fn right_hand_side_transport_to_any(t: RightHandSideTransport) -> AnyTransport {
    match t {
        RightHandSideTransport::Expression(inner) => expression_transport_to_any(*inner),
        RightHandSideTransport::ExpressionList(inner) => AnyTransport::ExpressionList(*inner),
        RightHandSideTransport::Assignment(inner) => AnyTransport::Assignment(*inner),
        RightHandSideTransport::AugmentedAssignment(inner) => AnyTransport::AugmentedAssignment(*inner),
        RightHandSideTransport::PatternList(inner) => AnyTransport::PatternList(*inner),
        RightHandSideTransport::Yield(inner) => AnyTransport::Yield(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for RightHandSideTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_right_hand_side_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum SimplePatternTransport {
    ClassPattern(Box<ClassPatternTransport>),
    SplatPattern(Box<SplatPatternTransport>),
    UnionPattern(Box<UnionPatternTransport>),
    _ListPattern(Box<_ListPatternTransport>),
    _TuplePattern(Box<_TuplePatternTransport>),
    DictPattern(Box<DictPatternTransport>),
    String(Box<StringTransport>),
    ConcatenatedString(Box<ConcatenatedStringTransport>),
    True(TrueTransport),
    False(FalseTransport),
    None(NoneTransport),
    SimplePatternNegative(Box<SimplePatternNegativeTransport>),
    ComplexPattern(Box<ComplexPatternTransport>),
    DottedName(Box<DottedNameTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for SimplePatternTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in SimplePatternTransport"))?;
        match kind_id {
            173 => Ok(Self::ClassPattern(Box::new(
                ClassPatternTransport::from_napi_value(env, napi_val)?
            ))),
            172 => Ok(Self::SplatPattern(Box::new(
                SplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            166 => Ok(Self::UnionPattern(Box::new(
                UnionPatternTransport::from_napi_value(env, napi_val)?
            ))),
            167 => Ok(Self::_ListPattern(Box::new(
                _ListPatternTransport::from_napi_value(env, napi_val)?
            ))),
            168 => Ok(Self::_TuplePattern(Box::new(
                _TuplePatternTransport::from_napi_value(env, napi_val)?
            ))),
            169 => Ok(Self::DictPattern(Box::new(
                DictPatternTransport::from_napi_value(env, napi_val)?
            ))),
            231 => Ok(Self::String(Box::new(
                StringTransport::from_napi_value(env, napi_val)?
            ))),
            230 => Ok(Self::ConcatenatedString(Box::new(
                ConcatenatedStringTransport::from_napi_value(env, napi_val)?
            ))),
            96 => Ok(Self::True(
                TrueTransport::from_napi_value(env, napi_val)?
            )),
            97 => Ok(Self::False(
                FalseTransport::from_napi_value(env, napi_val)?
            )),
            98 => Ok(Self::None(
                NoneTransport::from_napi_value(env, napi_val)?
            )),
            248 => Ok(Self::SimplePatternNegative(Box::new(
                SimplePatternNegativeTransport::from_napi_value(env, napi_val)?
            ))),
            174 => Ok(Self::ComplexPattern(Box::new(
                ComplexPatternTransport::from_napi_value(env, napi_val)?
            ))),
            162 => Ok(Self::DottedName(Box::new(
                DottedNameTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in SimplePatternTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SimplePatternTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("SimplePatternTransport is receive-only"))
    }
}

fn simple_pattern_transport_to_any(t: SimplePatternTransport) -> AnyTransport {
    match t {
        SimplePatternTransport::ClassPattern(inner) => AnyTransport::ClassPattern(*inner),
        SimplePatternTransport::SplatPattern(inner) => AnyTransport::SplatPattern(*inner),
        SimplePatternTransport::UnionPattern(inner) => AnyTransport::UnionPattern(*inner),
        SimplePatternTransport::_ListPattern(inner) => AnyTransport::_ListPattern(*inner),
        SimplePatternTransport::_TuplePattern(inner) => AnyTransport::_TuplePattern(*inner),
        SimplePatternTransport::DictPattern(inner) => AnyTransport::DictPattern(*inner),
        SimplePatternTransport::String(inner) => AnyTransport::String(*inner),
        SimplePatternTransport::ConcatenatedString(inner) => AnyTransport::ConcatenatedString(*inner),
        SimplePatternTransport::True(inner) => AnyTransport::True(inner),
        SimplePatternTransport::False(inner) => AnyTransport::False(inner),
        SimplePatternTransport::None(inner) => AnyTransport::None(inner),
        SimplePatternTransport::SimplePatternNegative(inner) => AnyTransport::SimplePatternNegative(*inner),
        SimplePatternTransport::ComplexPattern(inner) => AnyTransport::ComplexPattern(*inner),
        SimplePatternTransport::DottedName(inner) => AnyTransport::DottedName(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for SimplePatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_simple_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum SimpleStatementTransport {
    FutureImportStatement(Box<FutureImportStatementTransport>),
    ImportStatement(Box<ImportStatementTransport>),
    ImportFromStatement(Box<ImportFromStatementTransport>),
    PrintStatement(Box<PrintStatementTransport>),
    AssertStatement(Box<AssertStatementTransport>),
    ExpressionStatement(Box<ExpressionStatementTransport>),
    ReturnStatement(Box<ReturnStatementTransport>),
    DeleteStatement(Box<DeleteStatementTransport>),
    RaiseStatement(Box<RaiseStatementTransport>),
    PassStatement(PassStatementTransport),
    BreakStatement(BreakStatementTransport),
    ContinueStatement(ContinueStatementTransport),
    GlobalStatement(Box<GlobalStatementTransport>),
    NonlocalStatement(Box<NonlocalStatementTransport>),
    ExecStatement(Box<ExecStatementTransport>),
    TypeAliasStatement(Box<TypeAliasStatementTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for SimpleStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in SimpleStatementTransport"))?;
        match kind_id {
            114 => Ok(Self::FutureImportStatement(Box::new(
                FutureImportStatementTransport::from_napi_value(env, napi_val)?
            ))),
            111 => Ok(Self::ImportStatement(Box::new(
                ImportStatementTransport::from_napi_value(env, napi_val)?
            ))),
            115 => Ok(Self::ImportFromStatement(Box::new(
                ImportFromStatementTransport::from_napi_value(env, napi_val)?
            ))),
            119 => Ok(Self::PrintStatement(Box::new(
                PrintStatementTransport::from_napi_value(env, napi_val)?
            ))),
            121 => Ok(Self::AssertStatement(Box::new(
                AssertStatementTransport::from_napi_value(env, napi_val)?
            ))),
            122 => Ok(Self::ExpressionStatement(Box::new(
                ExpressionStatementTransport::from_napi_value(env, napi_val)?
            ))),
            125 => Ok(Self::ReturnStatement(Box::new(
                ReturnStatementTransport::from_napi_value(env, napi_val)?
            ))),
            126 => Ok(Self::DeleteStatement(Box::new(
                DeleteStatementTransport::from_napi_value(env, napi_val)?
            ))),
            127 => Ok(Self::RaiseStatement(Box::new(
                RaiseStatementTransport::from_napi_value(env, napi_val)?
            ))),
            128 => Ok(Self::PassStatement(
                PassStatementTransport::from_napi_value(env, napi_val)?
            )),
            129 => Ok(Self::BreakStatement(
                BreakStatementTransport::from_napi_value(env, napi_val)?
            )),
            130 => Ok(Self::ContinueStatement(
                ContinueStatementTransport::from_napi_value(env, napi_val)?
            )),
            150 => Ok(Self::GlobalStatement(Box::new(
                GlobalStatementTransport::from_napi_value(env, napi_val)?
            ))),
            151 => Ok(Self::NonlocalStatement(Box::new(
                NonlocalStatementTransport::from_napi_value(env, napi_val)?
            ))),
            152 => Ok(Self::ExecStatement(Box::new(
                ExecStatementTransport::from_napi_value(env, napi_val)?
            ))),
            153 => Ok(Self::TypeAliasStatement(Box::new(
                TypeAliasStatementTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in SimpleStatementTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SimpleStatementTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("SimpleStatementTransport is receive-only"))
    }
}

fn simple_statement_transport_to_any(t: SimpleStatementTransport) -> AnyTransport {
    match t {
        SimpleStatementTransport::FutureImportStatement(inner) => AnyTransport::FutureImportStatement(*inner),
        SimpleStatementTransport::ImportStatement(inner) => AnyTransport::ImportStatement(*inner),
        SimpleStatementTransport::ImportFromStatement(inner) => AnyTransport::ImportFromStatement(*inner),
        SimpleStatementTransport::PrintStatement(inner) => AnyTransport::PrintStatement(*inner),
        SimpleStatementTransport::AssertStatement(inner) => AnyTransport::AssertStatement(*inner),
        SimpleStatementTransport::ExpressionStatement(inner) => AnyTransport::ExpressionStatement(*inner),
        SimpleStatementTransport::ReturnStatement(inner) => AnyTransport::ReturnStatement(*inner),
        SimpleStatementTransport::DeleteStatement(inner) => AnyTransport::DeleteStatement(*inner),
        SimpleStatementTransport::RaiseStatement(inner) => AnyTransport::RaiseStatement(*inner),
        SimpleStatementTransport::PassStatement(inner) => AnyTransport::PassStatement(inner),
        SimpleStatementTransport::BreakStatement(inner) => AnyTransport::BreakStatement(inner),
        SimpleStatementTransport::ContinueStatement(inner) => AnyTransport::ContinueStatement(inner),
        SimpleStatementTransport::GlobalStatement(inner) => AnyTransport::GlobalStatement(*inner),
        SimpleStatementTransport::NonlocalStatement(inner) => AnyTransport::NonlocalStatement(*inner),
        SimpleStatementTransport::ExecStatement(inner) => AnyTransport::ExecStatement(*inner),
        SimpleStatementTransport::TypeAliasStatement(inner) => AnyTransport::TypeAliasStatement(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for SimpleStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_simple_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum StatementTransport {
    SimpleStatements(Box<SimpleStatementsTransport>),
    IfStatement(Box<IfStatementTransport>),
    ForStatement(Box<ForStatementTransport>),
    WhileStatement(Box<WhileStatementTransport>),
    TryStatement(Box<TryStatementTransport>),
    WithStatement(Box<WithStatementTransport>),
    FunctionDefinition(Box<FunctionDefinitionTransport>),
    ClassDefinition(Box<ClassDefinitionTransport>),
    DecoratedDefinition(Box<DecoratedDefinitionTransport>),
    MatchStatement(Box<MatchStatementTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for StatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in StatementTransport"))?;
        match kind_id {
            110 => Ok(Self::SimpleStatements(Box::new(
                SimpleStatementsTransport::from_napi_value(env, napi_val)?
            ))),
            131 => Ok(Self::IfStatement(Box::new(
                IfStatementTransport::from_napi_value(env, napi_val)?
            ))),
            137 => Ok(Self::ForStatement(Box::new(
                ForStatementTransport::from_napi_value(env, napi_val)?
            ))),
            138 => Ok(Self::WhileStatement(Box::new(
                WhileStatementTransport::from_napi_value(env, napi_val)?
            ))),
            139 => Ok(Self::TryStatement(Box::new(
                TryStatementTransport::from_napi_value(env, napi_val)?
            ))),
            142 => Ok(Self::WithStatement(Box::new(
                WithStatementTransport::from_napi_value(env, napi_val)?
            ))),
            145 => Ok(Self::FunctionDefinition(Box::new(
                FunctionDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            154 => Ok(Self::ClassDefinition(Box::new(
                ClassDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            158 => Ok(Self::DecoratedDefinition(Box::new(
                DecoratedDefinitionTransport::from_napi_value(env, napi_val)?
            ))),
            134 => Ok(Self::MatchStatement(Box::new(
                MatchStatementTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in StatementTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StatementTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("StatementTransport is receive-only"))
    }
}

fn statement_transport_to_any(t: StatementTransport) -> AnyTransport {
    match t {
        StatementTransport::SimpleStatements(inner) => AnyTransport::SimpleStatements(*inner),
        StatementTransport::IfStatement(inner) => AnyTransport::IfStatement(*inner),
        StatementTransport::ForStatement(inner) => AnyTransport::ForStatement(*inner),
        StatementTransport::WhileStatement(inner) => AnyTransport::WhileStatement(*inner),
        StatementTransport::TryStatement(inner) => AnyTransport::TryStatement(*inner),
        StatementTransport::WithStatement(inner) => AnyTransport::WithStatement(*inner),
        StatementTransport::FunctionDefinition(inner) => AnyTransport::FunctionDefinition(*inner),
        StatementTransport::ClassDefinition(inner) => AnyTransport::ClassDefinition(*inner),
        StatementTransport::DecoratedDefinition(inner) => AnyTransport::DecoratedDefinition(*inner),
        StatementTransport::MatchStatement(inner) => AnyTransport::MatchStatement(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for StatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum ExpressionTransport {
    ComparisonOperator(Box<ComparisonOperatorTransport>),
    NotOperator(Box<NotOperatorTransport>),
    BooleanOperator(Box<BooleanOperatorTransport>),
    Lambda(Box<LambdaTransport>),
    PrimaryExpression(Box<PrimaryExpressionTransport>),
    ConditionalExpression(Box<ConditionalExpressionTransport>),
    NamedExpression(Box<NamedExpressionTransport>),
    AsPattern(Box<AsPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ExpressionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ExpressionTransport"))?;
        match kind_id {
            195 => Ok(Self::ComparisonOperator(Box::new(
                ComparisonOperatorTransport::from_napi_value(env, napi_val)?
            ))),
            189 => Ok(Self::NotOperator(Box::new(
                NotOperatorTransport::from_napi_value(env, napi_val)?
            ))),
            190 => Ok(Self::BooleanOperator(Box::new(
                BooleanOperatorTransport::from_napi_value(env, napi_val)?
            ))),
            196 => Ok(Self::Lambda(Box::new(
                LambdaTransport::from_napi_value(env, napi_val)?
            ))),
            188 => Ok(Self::PrimaryExpression(Box::new(
                PrimaryExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            229 => Ok(Self::ConditionalExpression(Box::new(
                ConditionalExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            123 => Ok(Self::NamedExpression(Box::new(
                NamedExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            185 => Ok(Self::AsPattern(Box::new(
                AsPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ExpressionTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ExpressionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ExpressionTransport is receive-only"))
    }
}

fn expression_transport_to_any(t: ExpressionTransport) -> AnyTransport {
    match t {
        ExpressionTransport::ComparisonOperator(inner) => AnyTransport::ComparisonOperator(*inner),
        ExpressionTransport::NotOperator(inner) => AnyTransport::NotOperator(*inner),
        ExpressionTransport::BooleanOperator(inner) => AnyTransport::BooleanOperator(*inner),
        ExpressionTransport::Lambda(inner) => AnyTransport::Lambda(*inner),
        ExpressionTransport::PrimaryExpression(inner) => primary_expression_transport_to_any(*inner),
        ExpressionTransport::ConditionalExpression(inner) => AnyTransport::ConditionalExpression(*inner),
        ExpressionTransport::NamedExpression(inner) => AnyTransport::NamedExpression(*inner),
        ExpressionTransport::AsPattern(inner) => AnyTransport::AsPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum KeywordIdentifierTransport {
    Identifier(IdentifierTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for KeywordIdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in KeywordIdentifierTransport"))?;
        match kind_id {
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in KeywordIdentifierTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for KeywordIdentifierTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("KeywordIdentifierTransport is receive-only"))
    }
}

fn keyword_identifier_transport_to_any(t: KeywordIdentifierTransport) -> AnyTransport {
    match t {
        KeywordIdentifierTransport::Identifier(inner) => AnyTransport::Identifier(inner),
    }
}

impl ::sittir_core::types::RenderableTransport for KeywordIdentifierTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_keyword_identifier_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum ParameterTransport {
    Identifier(IdentifierTransport),
    TypedParameter(Box<TypedParameterTransport>),
    DefaultParameter(Box<DefaultParameterTransport>),
    TypedDefaultParameter(Box<TypedDefaultParameterTransport>),
    ListSplatPattern(Box<ListSplatPatternTransport>),
    TuplePattern(Box<TuplePatternTransport>),
    KeywordSeparator(KeywordSeparatorTransport),
    PositionalSeparator(PositionalSeparatorTransport),
    DictionarySplatPattern(Box<DictionarySplatPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ParameterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ParameterTransport"))?;
        match kind_id {
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            207 => Ok(Self::TypedParameter(Box::new(
                TypedParameterTransport::from_napi_value(env, napi_val)?
            ))),
            181 => Ok(Self::DefaultParameter(Box::new(
                DefaultParameterTransport::from_napi_value(env, napi_val)?
            ))),
            182 => Ok(Self::TypedDefaultParameter(Box::new(
                TypedDefaultParameterTransport::from_napi_value(env, napi_val)?
            ))),
            183 => Ok(Self::ListSplatPattern(Box::new(
                ListSplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            179 => Ok(Self::TuplePattern(Box::new(
                TuplePatternTransport::from_napi_value(env, napi_val)?
            ))),
            239 => Ok(Self::KeywordSeparator(
                KeywordSeparatorTransport::from_napi_value(env, napi_val)?
            )),
            238 => Ok(Self::PositionalSeparator(
                PositionalSeparatorTransport::from_napi_value(env, napi_val)?
            )),
            184 => Ok(Self::DictionarySplatPattern(Box::new(
                DictionarySplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ParameterTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ParameterTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ParameterTransport is receive-only"))
    }
}

fn parameter_transport_to_any(t: ParameterTransport) -> AnyTransport {
    match t {
        ParameterTransport::Identifier(inner) => AnyTransport::Identifier(inner),
        ParameterTransport::TypedParameter(inner) => AnyTransport::TypedParameter(*inner),
        ParameterTransport::DefaultParameter(inner) => AnyTransport::DefaultParameter(*inner),
        ParameterTransport::TypedDefaultParameter(inner) => AnyTransport::TypedDefaultParameter(*inner),
        ParameterTransport::ListSplatPattern(inner) => AnyTransport::ListSplatPattern(*inner),
        ParameterTransport::TuplePattern(inner) => AnyTransport::TuplePattern(*inner),
        ParameterTransport::KeywordSeparator(inner) => AnyTransport::KeywordSeparator(inner),
        ParameterTransport::PositionalSeparator(inner) => AnyTransport::PositionalSeparator(inner),
        ParameterTransport::DictionarySplatPattern(inner) => AnyTransport::DictionarySplatPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ParameterTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_parameter_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum PatternTransport {
    Identifier(IdentifierTransport),
    KeywordIdentifier(Box<KeywordIdentifierTransport>),
    Subscript(Box<SubscriptTransport>),
    Attribute(Box<AttributeTransport>),
    ListSplatPattern(Box<ListSplatPatternTransport>),
    TuplePattern(Box<TuplePatternTransport>),
    ListPattern(Box<ListPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PatternTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in PatternTransport"))?;
        match kind_id {
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            204 => Ok(Self::Subscript(Box::new(
                SubscriptTransport::from_napi_value(env, napi_val)?
            ))),
            203 => Ok(Self::Attribute(Box::new(
                AttributeTransport::from_napi_value(env, napi_val)?
            ))),
            183 => Ok(Self::ListSplatPattern(Box::new(
                ListSplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            179 => Ok(Self::TuplePattern(Box::new(
                TuplePatternTransport::from_napi_value(env, napi_val)?
            ))),
            180 => Ok(Self::ListPattern(Box::new(
                ListPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in PatternTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PatternTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PatternTransport is receive-only"))
    }
}

fn pattern_transport_to_any(t: PatternTransport) -> AnyTransport {
    match t {
        PatternTransport::Identifier(inner) => AnyTransport::Identifier(inner),
        PatternTransport::KeywordIdentifier(inner) => keyword_identifier_transport_to_any(*inner),
        PatternTransport::Subscript(inner) => AnyTransport::Subscript(*inner),
        PatternTransport::Attribute(inner) => AnyTransport::Attribute(*inner),
        PatternTransport::ListSplatPattern(inner) => AnyTransport::ListSplatPattern(*inner),
        PatternTransport::TuplePattern(inner) => AnyTransport::TuplePattern(*inner),
        PatternTransport::ListPattern(inner) => AnyTransport::ListPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for PatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub enum PrimaryExpressionTransport {
    Await(Box<AwaitTransport>),
    BinaryOperator(Box<BinaryOperatorTransport>),
    Identifier(IdentifierTransport),
    KeywordIdentifier(Box<KeywordIdentifierTransport>),
    String(Box<StringTransport>),
    ConcatenatedString(Box<ConcatenatedStringTransport>),
    Integer(IntegerTransport),
    Float(FloatTransport),
    True(TrueTransport),
    False(FalseTransport),
    None(NoneTransport),
    UnaryOperator(Box<UnaryOperatorTransport>),
    Attribute(Box<AttributeTransport>),
    Subscript(Box<SubscriptTransport>),
    Call(Box<CallTransport>),
    List(Box<ListTransport>),
    ListComprehension(Box<ListComprehensionTransport>),
    Dictionary(Box<DictionaryTransport>),
    DictionaryComprehension(Box<DictionaryComprehensionTransport>),
    Set(Box<SetTransport>),
    SetComprehension(Box<SetComprehensionTransport>),
    Tuple(Box<TupleTransport>),
    ParenthesizedExpression(Box<ParenthesizedExpressionTransport>),
    GeneratorExpression(Box<GeneratorExpressionTransport>),
    Ellipsis2(Ellipsis2Transport),
    ListSplatPattern(Box<ListSplatPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PrimaryExpressionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in PrimaryExpressionTransport"))?;
        match kind_id {
            237 => Ok(Self::Await(Box::new(
                AwaitTransport::from_napi_value(env, napi_val)?
            ))),
            191 => Ok(Self::BinaryOperator(Box::new(
                BinaryOperatorTransport::from_napi_value(env, napi_val)?
            ))),
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            231 => Ok(Self::String(Box::new(
                StringTransport::from_napi_value(env, napi_val)?
            ))),
            230 => Ok(Self::ConcatenatedString(Box::new(
                ConcatenatedStringTransport::from_napi_value(env, napi_val)?
            ))),
            93 => Ok(Self::Integer(
                IntegerTransport::from_napi_value(env, napi_val)?
            )),
            94 => Ok(Self::Float(
                FloatTransport::from_napi_value(env, napi_val)?
            )),
            96 => Ok(Self::True(
                TrueTransport::from_napi_value(env, napi_val)?
            )),
            97 => Ok(Self::False(
                FalseTransport::from_napi_value(env, napi_val)?
            )),
            98 => Ok(Self::None(
                NoneTransport::from_napi_value(env, napi_val)?
            )),
            192 => Ok(Self::UnaryOperator(Box::new(
                UnaryOperatorTransport::from_napi_value(env, napi_val)?
            ))),
            203 => Ok(Self::Attribute(Box::new(
                AttributeTransport::from_napi_value(env, napi_val)?
            ))),
            204 => Ok(Self::Subscript(Box::new(
                SubscriptTransport::from_napi_value(env, napi_val)?
            ))),
            206 => Ok(Self::Call(Box::new(
                CallTransport::from_napi_value(env, napi_val)?
            ))),
            215 => Ok(Self::List(Box::new(
                ListTransport::from_napi_value(env, napi_val)?
            ))),
            220 => Ok(Self::ListComprehension(Box::new(
                ListComprehensionTransport::from_napi_value(env, napi_val)?
            ))),
            218 => Ok(Self::Dictionary(Box::new(
                DictionaryTransport::from_napi_value(env, napi_val)?
            ))),
            221 => Ok(Self::DictionaryComprehension(Box::new(
                DictionaryComprehensionTransport::from_napi_value(env, napi_val)?
            ))),
            216 => Ok(Self::Set(Box::new(
                SetTransport::from_napi_value(env, napi_val)?
            ))),
            222 => Ok(Self::SetComprehension(Box::new(
                SetComprehensionTransport::from_napi_value(env, napi_val)?
            ))),
            217 => Ok(Self::Tuple(Box::new(
                TupleTransport::from_napi_value(env, napi_val)?
            ))),
            225 => Ok(Self::ParenthesizedExpression(Box::new(
                ParenthesizedExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            223 => Ok(Self::GeneratorExpression(Box::new(
                GeneratorExpressionTransport::from_napi_value(env, napi_val)?
            ))),
            87 => Ok(Self::Ellipsis2(
                Ellipsis2Transport::from_napi_value(env, napi_val)?
            )),
            183 => Ok(Self::ListSplatPattern(Box::new(
                ListSplatPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in PrimaryExpressionTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PrimaryExpressionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PrimaryExpressionTransport is receive-only"))
    }
}

fn primary_expression_transport_to_any(t: PrimaryExpressionTransport) -> AnyTransport {
    match t {
        PrimaryExpressionTransport::Await(inner) => AnyTransport::Await(*inner),
        PrimaryExpressionTransport::BinaryOperator(inner) => AnyTransport::BinaryOperator(*inner),
        PrimaryExpressionTransport::Identifier(inner) => AnyTransport::Identifier(inner),
        PrimaryExpressionTransport::KeywordIdentifier(inner) => keyword_identifier_transport_to_any(*inner),
        PrimaryExpressionTransport::String(inner) => AnyTransport::String(*inner),
        PrimaryExpressionTransport::ConcatenatedString(inner) => AnyTransport::ConcatenatedString(*inner),
        PrimaryExpressionTransport::Integer(inner) => AnyTransport::Integer(inner),
        PrimaryExpressionTransport::Float(inner) => AnyTransport::Float(inner),
        PrimaryExpressionTransport::True(inner) => AnyTransport::True(inner),
        PrimaryExpressionTransport::False(inner) => AnyTransport::False(inner),
        PrimaryExpressionTransport::None(inner) => AnyTransport::None(inner),
        PrimaryExpressionTransport::UnaryOperator(inner) => AnyTransport::UnaryOperator(*inner),
        PrimaryExpressionTransport::Attribute(inner) => AnyTransport::Attribute(*inner),
        PrimaryExpressionTransport::Subscript(inner) => AnyTransport::Subscript(*inner),
        PrimaryExpressionTransport::Call(inner) => AnyTransport::Call(*inner),
        PrimaryExpressionTransport::List(inner) => AnyTransport::List(*inner),
        PrimaryExpressionTransport::ListComprehension(inner) => AnyTransport::ListComprehension(*inner),
        PrimaryExpressionTransport::Dictionary(inner) => AnyTransport::Dictionary(*inner),
        PrimaryExpressionTransport::DictionaryComprehension(inner) => AnyTransport::DictionaryComprehension(*inner),
        PrimaryExpressionTransport::Set(inner) => AnyTransport::Set(*inner),
        PrimaryExpressionTransport::SetComprehension(inner) => AnyTransport::SetComprehension(*inner),
        PrimaryExpressionTransport::Tuple(inner) => AnyTransport::Tuple(*inner),
        PrimaryExpressionTransport::ParenthesizedExpression(inner) => AnyTransport::ParenthesizedExpression(*inner),
        PrimaryExpressionTransport::GeneratorExpression(inner) => AnyTransport::GeneratorExpression(*inner),
        PrimaryExpressionTransport::Ellipsis2(inner) => AnyTransport::Ellipsis2(inner),
        PrimaryExpressionTransport::ListSplatPattern(inner) => AnyTransport::ListSplatPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for PrimaryExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_primary_expression_transport(self, dest)
    }
}


#[derive(Debug, Clone)]
pub enum _AsPatternChildTransport {
    CasePattern(Box<CasePatternTransport>),
    Identifier(IdentifierTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for _AsPatternChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in _AsPatternChildTransport"))?;
        match kind_id {
            163 => Ok(Self::CasePattern(Box::new(
                CasePatternTransport::from_napi_value(env, napi_val)?
            ))),
            1 => Ok(Self::Identifier(
                IdentifierTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in _AsPatternChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for _AsPatternChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("_AsPatternChildTransport is receive-only"))
    }
}

fn _as_pattern_child_transport_to_any(t: _AsPatternChildTransport) -> AnyTransport {
    match t {
        _AsPatternChildTransport::CasePattern(inner) => AnyTransport::CasePattern(*inner),
        _AsPatternChildTransport::Identifier(inner) => AnyTransport::Identifier(inner),
    }
}

impl ::sittir_core::types::RenderableTransport for _AsPatternChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            _AsPatternChildTransport::CasePattern(inner) => render_case_pattern_transport(inner.as_ref(), dest),
            _AsPatternChildTransport::Identifier(inner) => render_identifier_transport(inner, dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ComprehensionClausesChildTransport {
    ForInClause(Box<ForInClauseTransport>),
    IfClause(Box<IfClauseTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ComprehensionClausesChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ComprehensionClausesChildTransport"))?;
        match kind_id {
            227 => Ok(Self::ForInClause(Box::new(
                ForInClauseTransport::from_napi_value(env, napi_val)?
            ))),
            228 => Ok(Self::IfClause(Box::new(
                IfClauseTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ComprehensionClausesChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ComprehensionClausesChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ComprehensionClausesChildTransport is receive-only"))
    }
}

fn comprehension_clauses_child_transport_to_any(t: ComprehensionClausesChildTransport) -> AnyTransport {
    match t {
        ComprehensionClausesChildTransport::ForInClause(inner) => AnyTransport::ForInClause(*inner),
        ComprehensionClausesChildTransport::IfClause(inner) => AnyTransport::IfClause(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ComprehensionClausesChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            ComprehensionClausesChildTransport::ForInClause(inner) => render_for_in_clause_transport(inner.as_ref(), dest),
            ComprehensionClausesChildTransport::IfClause(inner) => render_if_clause_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum SuiteChildTransport {
    SimpleStatements(Box<SimpleStatementsTransport>),
    Block(Box<BlockTransport>),
    Newline(NewlineTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for SuiteChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in SuiteChildTransport"))?;
        match kind_id {
            110 => Ok(Self::SimpleStatements(Box::new(
                SimpleStatementsTransport::from_napi_value(env, napi_val)?
            ))),
            160 => Ok(Self::Block(Box::new(
                BlockTransport::from_napi_value(env, napi_val)?
            ))),
            101 => Ok(Self::Newline(
                NewlineTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in SuiteChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SuiteChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("SuiteChildTransport is receive-only"))
    }
}

fn suite_child_transport_to_any(t: SuiteChildTransport) -> AnyTransport {
    match t {
        SuiteChildTransport::SimpleStatements(inner) => AnyTransport::SimpleStatements(*inner),
        SuiteChildTransport::Block(inner) => AnyTransport::Block(*inner),
        SuiteChildTransport::Newline(inner) => AnyTransport::Newline(inner),
    }
}

impl ::sittir_core::types::RenderableTransport for SuiteChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            SuiteChildTransport::SimpleStatements(inner) => render_simple_statements_transport(inner.as_ref(), dest),
            SuiteChildTransport::Block(inner) => render_block_transport(inner.as_ref(), dest),
            SuiteChildTransport::Newline(inner) => render_newline_transport(inner, dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ArgumentListChildTransport {
    ListSplat(Box<ListSplatTransport>),
    DictionarySplat(Box<DictionarySplatTransport>),
    ParenthesizedListSplat(Box<ParenthesizedListSplatTransport>),
    KeywordArgument(Box<KeywordArgumentTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ArgumentListChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ArgumentListChildTransport"))?;
        match kind_id {
            148 => Ok(Self::ListSplat(Box::new(
                ListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            149 => Ok(Self::DictionarySplat(Box::new(
                DictionarySplatTransport::from_napi_value(env, napi_val)?
            ))),
            156 => Ok(Self::ParenthesizedListSplat(Box::new(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            214 => Ok(Self::KeywordArgument(Box::new(
                KeywordArgumentTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ArgumentListChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ArgumentListChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ArgumentListChildTransport is receive-only"))
    }
}

fn argument_list_child_transport_to_any(t: ArgumentListChildTransport) -> AnyTransport {
    match t {
        ArgumentListChildTransport::ListSplat(inner) => AnyTransport::ListSplat(*inner),
        ArgumentListChildTransport::DictionarySplat(inner) => AnyTransport::DictionarySplat(*inner),
        ArgumentListChildTransport::ParenthesizedListSplat(inner) => AnyTransport::ParenthesizedListSplat(*inner),
        ArgumentListChildTransport::KeywordArgument(inner) => AnyTransport::KeywordArgument(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ArgumentListChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            ArgumentListChildTransport::ListSplat(inner) => render_list_splat_transport(inner.as_ref(), dest),
            ArgumentListChildTransport::DictionarySplat(inner) => render_dictionary_splat_transport(inner.as_ref(), dest),
            ArgumentListChildTransport::ParenthesizedListSplat(inner) => render_parenthesized_list_splat_transport(inner.as_ref(), dest),
            ArgumentListChildTransport::KeywordArgument(inner) => render_keyword_argument_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum CasePatternChildTransport {
    _AsPattern(Box<_AsPatternTransport>),
    KeywordPattern(Box<KeywordPatternTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CasePatternChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in CasePatternChildTransport"))?;
        match kind_id {
            165 => Ok(Self::_AsPattern(Box::new(
                _AsPatternTransport::from_napi_value(env, napi_val)?
            ))),
            171 => Ok(Self::KeywordPattern(Box::new(
                KeywordPatternTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in CasePatternChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CasePatternChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CasePatternChildTransport is receive-only"))
    }
}

fn case_pattern_child_transport_to_any(t: CasePatternChildTransport) -> AnyTransport {
    match t {
        CasePatternChildTransport::_AsPattern(inner) => AnyTransport::_AsPattern(*inner),
        CasePatternChildTransport::KeywordPattern(inner) => AnyTransport::KeywordPattern(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for CasePatternChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            CasePatternChildTransport::_AsPattern(inner) => render__as_pattern_transport(inner.as_ref(), dest),
            CasePatternChildTransport::KeywordPattern(inner) => render_keyword_pattern_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum DictionaryChildTransport {
    Pair(Box<PairTransport>),
    DictionarySplat(Box<DictionarySplatTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for DictionaryChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in DictionaryChildTransport"))?;
        match kind_id {
            219 => Ok(Self::Pair(Box::new(
                PairTransport::from_napi_value(env, napi_val)?
            ))),
            149 => Ok(Self::DictionarySplat(Box::new(
                DictionarySplatTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in DictionaryChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DictionaryChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("DictionaryChildTransport is receive-only"))
    }
}

fn dictionary_child_transport_to_any(t: DictionaryChildTransport) -> AnyTransport {
    match t {
        DictionaryChildTransport::Pair(inner) => AnyTransport::Pair(*inner),
        DictionaryChildTransport::DictionarySplat(inner) => AnyTransport::DictionarySplat(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for DictionaryChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            DictionaryChildTransport::Pair(inner) => render_pair_transport(inner.as_ref(), dest),
            DictionaryChildTransport::DictionarySplat(inner) => render_dictionary_splat_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ImportFromStatementChildTransport {
    WildcardImport(WildcardImportTransport),
    DottedName(Box<DottedNameTransport>),
    AliasedImport(Box<AliasedImportTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ImportFromStatementChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ImportFromStatementChildTransport"))?;
        match kind_id {
            118 => Ok(Self::WildcardImport(
                WildcardImportTransport::from_napi_value(env, napi_val)?
            )),
            162 => Ok(Self::DottedName(Box::new(
                DottedNameTransport::from_napi_value(env, napi_val)?
            ))),
            117 => Ok(Self::AliasedImport(Box::new(
                AliasedImportTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ImportFromStatementChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ImportFromStatementChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ImportFromStatementChildTransport is receive-only"))
    }
}

fn import_from_statement_child_transport_to_any(t: ImportFromStatementChildTransport) -> AnyTransport {
    match t {
        ImportFromStatementChildTransport::WildcardImport(inner) => AnyTransport::WildcardImport(inner),
        ImportFromStatementChildTransport::DottedName(inner) => AnyTransport::DottedName(*inner),
        ImportFromStatementChildTransport::AliasedImport(inner) => AnyTransport::AliasedImport(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ImportFromStatementChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            ImportFromStatementChildTransport::WildcardImport(inner) => render_wildcard_import_transport(inner, dest),
            ImportFromStatementChildTransport::DottedName(inner) => render_dotted_name_transport(inner.as_ref(), dest),
            ImportFromStatementChildTransport::AliasedImport(inner) => render_aliased_import_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ListChildTransport {
    Yield(Box<YieldTransport>),
    ListSplat(Box<ListSplatTransport>),
    ParenthesizedListSplat(Box<ParenthesizedListSplatTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ListChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ListChildTransport"))?;
        match kind_id {
            202 => Ok(Self::Yield(Box::new(
                YieldTransport::from_napi_value(env, napi_val)?
            ))),
            148 => Ok(Self::ListSplat(Box::new(
                ListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            156 => Ok(Self::ParenthesizedListSplat(Box::new(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ListChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ListChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ListChildTransport is receive-only"))
    }
}

fn list_child_transport_to_any(t: ListChildTransport) -> AnyTransport {
    match t {
        ListChildTransport::Yield(inner) => AnyTransport::Yield(*inner),
        ListChildTransport::ListSplat(inner) => AnyTransport::ListSplat(*inner),
        ListChildTransport::ParenthesizedListSplat(inner) => AnyTransport::ParenthesizedListSplat(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ListChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            ListChildTransport::Yield(inner) => render_yield_transport(inner.as_ref(), dest),
            ListChildTransport::ListSplat(inner) => render_list_splat_transport(inner.as_ref(), dest),
            ListChildTransport::ParenthesizedListSplat(inner) => render_parenthesized_list_splat_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ParenthesizedListSplatChildTransport {
    ParenthesizedListSplat(Box<ParenthesizedListSplatTransport>),
    ListSplat(Box<ListSplatTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ParenthesizedListSplatChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in ParenthesizedListSplatChildTransport"))?;
        match kind_id {
            156 => Ok(Self::ParenthesizedListSplat(Box::new(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            148 => Ok(Self::ListSplat(Box::new(
                ListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in ParenthesizedListSplatChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ParenthesizedListSplatChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ParenthesizedListSplatChildTransport is receive-only"))
    }
}

fn parenthesized_list_splat_child_transport_to_any(t: ParenthesizedListSplatChildTransport) -> AnyTransport {
    match t {
        ParenthesizedListSplatChildTransport::ParenthesizedListSplat(inner) => AnyTransport::ParenthesizedListSplat(*inner),
        ParenthesizedListSplatChildTransport::ListSplat(inner) => AnyTransport::ListSplat(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for ParenthesizedListSplatChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            ParenthesizedListSplatChildTransport::ParenthesizedListSplat(inner) => render_parenthesized_list_splat_transport(inner.as_ref(), dest),
            ParenthesizedListSplatChildTransport::ListSplat(inner) => render_list_splat_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum SetChildTransport {
    Yield(Box<YieldTransport>),
    ListSplat(Box<ListSplatTransport>),
    ParenthesizedListSplat(Box<ParenthesizedListSplatTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for SetChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in SetChildTransport"))?;
        match kind_id {
            202 => Ok(Self::Yield(Box::new(
                YieldTransport::from_napi_value(env, napi_val)?
            ))),
            148 => Ok(Self::ListSplat(Box::new(
                ListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            156 => Ok(Self::ParenthesizedListSplat(Box::new(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in SetChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SetChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("SetChildTransport is receive-only"))
    }
}

fn set_child_transport_to_any(t: SetChildTransport) -> AnyTransport {
    match t {
        SetChildTransport::Yield(inner) => AnyTransport::Yield(*inner),
        SetChildTransport::ListSplat(inner) => AnyTransport::ListSplat(*inner),
        SetChildTransport::ParenthesizedListSplat(inner) => AnyTransport::ParenthesizedListSplat(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for SetChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            SetChildTransport::Yield(inner) => render_yield_transport(inner.as_ref(), dest),
            SetChildTransport::ListSplat(inner) => render_list_splat_transport(inner.as_ref(), dest),
            SetChildTransport::ParenthesizedListSplat(inner) => render_parenthesized_list_splat_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum StringContentChildTransport {
    EscapeInterpolation(EscapeInterpolationTransport),
    EscapeSequence(EscapeSequenceTransport),
    NotEscapeSequence(NotEscapeSequenceTransport),
    _StringContent(_StringContentTransport),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for StringContentChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in StringContentChildTransport"))?;
        match kind_id {
            106 => Ok(Self::EscapeInterpolation(
                EscapeInterpolationTransport::from_napi_value(env, napi_val)?
            )),
            89 => Ok(Self::EscapeSequence(
                EscapeSequenceTransport::from_napi_value(env, napi_val)?
            )),
            235 => Ok(Self::NotEscapeSequence(
                NotEscapeSequenceTransport::from_napi_value(env, napi_val)?
            )),
            105 => Ok(Self::_StringContent(
                _StringContentTransport::from_napi_value(env, napi_val)?
            )),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in StringContentChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StringContentChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("StringContentChildTransport is receive-only"))
    }
}

fn string_content_child_transport_to_any(t: StringContentChildTransport) -> AnyTransport {
    match t {
        StringContentChildTransport::EscapeInterpolation(inner) => AnyTransport::EscapeInterpolation(inner),
        StringContentChildTransport::EscapeSequence(inner) => AnyTransport::EscapeSequence(inner),
        StringContentChildTransport::NotEscapeSequence(inner) => AnyTransport::NotEscapeSequence(inner),
        StringContentChildTransport::_StringContent(inner) => AnyTransport::_StringContent(inner),
    }
}

impl ::sittir_core::types::RenderableTransport for StringContentChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            StringContentChildTransport::EscapeInterpolation(inner) => render_escape_interpolation_transport(inner, dest),
            StringContentChildTransport::EscapeSequence(inner) => render_escape_sequence_transport(inner, dest),
            StringContentChildTransport::NotEscapeSequence(inner) => render_not_escape_sequence_transport(inner, dest),
            StringContentChildTransport::_StringContent(inner) => render__string_content_transport(inner, dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum TupleChildTransport {
    Yield(Box<YieldTransport>),
    ListSplat(Box<ListSplatTransport>),
    ParenthesizedListSplat(Box<ParenthesizedListSplatTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TupleChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in TupleChildTransport"))?;
        match kind_id {
            202 => Ok(Self::Yield(Box::new(
                YieldTransport::from_napi_value(env, napi_val)?
            ))),
            148 => Ok(Self::ListSplat(Box::new(
                ListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            156 => Ok(Self::ParenthesizedListSplat(Box::new(
                ParenthesizedListSplatTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in TupleChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TupleChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("TupleChildTransport is receive-only"))
    }
}

fn tuple_child_transport_to_any(t: TupleChildTransport) -> AnyTransport {
    match t {
        TupleChildTransport::Yield(inner) => AnyTransport::Yield(*inner),
        TupleChildTransport::ListSplat(inner) => AnyTransport::ListSplat(*inner),
        TupleChildTransport::ParenthesizedListSplat(inner) => AnyTransport::ParenthesizedListSplat(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for TupleChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            TupleChildTransport::Yield(inner) => render_yield_transport(inner.as_ref(), dest),
            TupleChildTransport::ListSplat(inner) => render_list_splat_transport(inner.as_ref(), dest),
            TupleChildTransport::ParenthesizedListSplat(inner) => render_parenthesized_list_splat_transport(inner.as_ref(), dest),
        }
    }
}

#[derive(Debug, Clone)]
pub enum TypeChildTransport {
    SplatType(Box<SplatTypeTransport>),
    GenericType(Box<GenericTypeTransport>),
    UnionType(Box<UnionTypeTransport>),
    ConstrainedType(Box<ConstrainedTypeTransport>),
    MemberType(Box<MemberTypeTransport>),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TypeChildTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let kind_id: u16 = obj.get("$type")?
            .ok_or_else(|| ::napi::Error::from_reason("$type property missing in TypeChildTransport"))?;
        match kind_id {
            209 => Ok(Self::SplatType(Box::new(
                SplatTypeTransport::from_napi_value(env, napi_val)?
            ))),
            210 => Ok(Self::GenericType(Box::new(
                GenericTypeTransport::from_napi_value(env, napi_val)?
            ))),
            211 => Ok(Self::UnionType(Box::new(
                UnionTypeTransport::from_napi_value(env, napi_val)?
            ))),
            212 => Ok(Self::ConstrainedType(Box::new(
                ConstrainedTypeTransport::from_napi_value(env, napi_val)?
            ))),
            213 => Ok(Self::MemberType(Box::new(
                MemberTypeTransport::from_napi_value(env, napi_val)?
            ))),
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} in TypeChildTransport",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TypeChildTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("TypeChildTransport is receive-only"))
    }
}

fn type_child_transport_to_any(t: TypeChildTransport) -> AnyTransport {
    match t {
        TypeChildTransport::SplatType(inner) => AnyTransport::SplatType(*inner),
        TypeChildTransport::GenericType(inner) => AnyTransport::GenericType(*inner),
        TypeChildTransport::UnionType(inner) => AnyTransport::UnionType(*inner),
        TypeChildTransport::ConstrainedType(inner) => AnyTransport::ConstrainedType(*inner),
        TypeChildTransport::MemberType(inner) => AnyTransport::MemberType(*inner),
    }
}

impl ::sittir_core::types::RenderableTransport for TypeChildTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            TypeChildTransport::SplatType(inner) => render_splat_type_transport(inner.as_ref(), dest),
            TypeChildTransport::GenericType(inner) => render_generic_type_transport(inner.as_ref(), dest),
            TypeChildTransport::UnionType(inner) => render_union_type_transport(inner.as_ref(), dest),
            TypeChildTransport::ConstrainedType(inner) => render_constrained_type_transport(inner.as_ref(), dest),
            TypeChildTransport::MemberType(inner) => render_member_type_transport(inner.as_ref(), dest),
        }
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: _AsPatternChildTransport,
}

impl ::sittir_core::types::RenderableTransport for _AsPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render__as_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub right: RightHandSideTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentEqTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_eq_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: TypeTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: TypeTransport,
    pub right: RightHandSideTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentTypedTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_typed_transport(self, dest)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AugmentedAssignmentOperatorEnum {
    PlusEq,
    MinusEq,
    StarEq,
    SlashEq,
    V40_3d,
    V2f_2f_3d,
    PercentEq,
    V2a_2a_3d,
    GtGtEq,
    LtLtEq,
    AmpEq,
    CaretEq,
    PipeEq,
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AugmentedAssignmentOperatorEnum {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let kind_id: u16 = u16::from_napi_value(env, napi_val)?;
        match kind_id {
            73 => Ok(Self::PlusEq), // "+="
            74 => Ok(Self::MinusEq), // "-="
            75 => Ok(Self::StarEq), // "*="
            76 => Ok(Self::SlashEq), // "/="
            77 => Ok(Self::V40_3d), // "@="
            78 => Ok(Self::V2f_2f_3d), // "//="
            79 => Ok(Self::PercentEq), // "%="
            80 => Ok(Self::V2a_2a_3d), // "**="
            81 => Ok(Self::GtGtEq), // ">>="
            82 => Ok(Self::LtLtEq), // "<<="
            83 => Ok(Self::AmpEq), // "&="
            84 => Ok(Self::CaretEq), // "^="
            85 => Ok(Self::PipeEq), // "|="
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} for AugmentedAssignmentOperatorEnum",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AugmentedAssignmentOperatorEnum {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("AugmentedAssignmentOperatorEnum is receive-only"))
    }
}

impl ::std::fmt::Display for AugmentedAssignmentOperatorEnum {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        f.write_str(match self {
            Self::PlusEq => "+=",
            Self::MinusEq => "-=",
            Self::StarEq => "*=",
            Self::SlashEq => "/=",
            Self::V40_3d => "@=",
            Self::V2f_2f_3d => "//=",
            Self::PercentEq => "%=",
            Self::V2a_2a_3d => "**=",
            Self::GtGtEq => ">>=",
            Self::LtLtEq => "<<=",
            Self::AmpEq => "&=",
            Self::CaretEq => "^=",
            Self::PipeEq => "|=",
        })
    }
}

impl ::sittir_core::types::RenderableTransport for AugmentedAssignmentOperatorEnum {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(match self {
            Self::PlusEq => "+=",
            Self::MinusEq => "-=",
            Self::StarEq => "*=",
            Self::SlashEq => "/=",
            Self::V40_3d => "@=",
            Self::V2f_2f_3d => "//=",
            Self::PercentEq => "%=",
            Self::V2a_2a_3d => "**=",
            Self::GtGtEq => ">>=",
            Self::LtLtEq => "<<=",
            Self::AmpEq => "&=",
            Self::CaretEq => "^=",
            Self::PipeEq => "|=",
        }).map_err(::askama::Error::from)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ComprehensionClausesChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for ComprehensionClausesTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_comprehension_clauses_transport(self, dest)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum _IdentifierEnum {
    Star,
    V2a_2a,
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for _IdentifierEnum {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let kind_id: u16 = u16::from_napi_value(env, napi_val)?;
        match kind_id {
            11 => Ok(Self::Star), // "*"
            39 => Ok(Self::V2a_2a), // "**"
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} for _IdentifierEnum",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for _IdentifierEnum {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("_IdentifierEnum is receive-only"))
    }
}

impl ::std::fmt::Display for _IdentifierEnum {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        f.write_str(match self {
            Self::Star => "*",
            Self::V2a_2a => "**",
        })
    }
}

impl ::sittir_core::types::RenderableTransport for _IdentifierEnum {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(match self {
            Self::Star => "*",
            Self::V2a_2a => "**",
        }).map_err(::askama::Error::from)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: Vec<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for ImportListTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_import_list_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct IsNotTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for IsNotTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IsNotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for IsNotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for IsNotTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub key: SimplePatternTransport,
    pub value: CasePatternTransport,
}

impl ::sittir_core::types::RenderableTransport for KeyValuePatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_key_value_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct KwAsyncMarkerTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for KwAsyncMarkerTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for KwAsyncMarkerTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for KwAsyncMarkerTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for KwAsyncMarkerTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct KwTypeTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for KwTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for KwTypeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for KwTypeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for KwTypeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<CasePatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for _ListPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render__list_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: MatchBlockBlockTransport,
}

impl ::sittir_core::types::RenderableTransport for MatchBlockTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_match_block_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub alternative: Vec<CaseClauseTransport>,
}

impl ::sittir_core::types::RenderableTransport for MatchBlockBlockTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_match_block_block_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct NotEscapeSequenceTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NotEscapeSequenceTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NotEscapeSequenceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NotEscapeSequenceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NotEscapeSequenceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct NotInTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NotInTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NotInTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NotInTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NotInTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: PrimaryExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for SimplePatternNegativeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_simple_pattern_negative_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<SimpleStatementTransport>,
}

impl ::sittir_core::types::RenderableTransport for SimpleStatementsTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_simple_statements_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: SuiteChildTransport,
}

impl ::sittir_core::types::RenderableTransport for SuiteTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_suite_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<CasePatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for _TuplePatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render__tuple_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryOperatorOperatorEnum {
    Plus,
    Minus,
    Tilde,
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for UnaryOperatorOperatorEnum {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let kind_id: u16 = u16::from_napi_value(env, napi_val)?;
        match kind_id {
            52 => Ok(Self::Plus), // "+"
            53 => Ok(Self::Minus), // "-"
            63 => Ok(Self::Tilde), // "~"
            other => Err(::napi::Error::from_reason(format!(
                "unknown kind id {{other}} for UnaryOperatorOperatorEnum",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for UnaryOperatorOperatorEnum {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("UnaryOperatorOperatorEnum is receive-only"))
    }
}

impl ::std::fmt::Display for UnaryOperatorOperatorEnum {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        f.write_str(match self {
            Self::Plus => "+",
            Self::Minus => "-",
            Self::Tilde => "~",
        })
    }
}

impl ::sittir_core::types::RenderableTransport for UnaryOperatorOperatorEnum {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(match self {
            Self::Plus => "+",
            Self::Minus => "-",
            Self::Tilde => "~",
        }).map_err(::askama::Error::from)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<WithItemTransport>,
}

impl ::sittir_core::types::RenderableTransport for _WithClauseParenTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render__with_clause_paren_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: DottedNameTransport,
    pub alias: IdentifierTransport,
}

impl ::sittir_core::types::RenderableTransport for AliasedImportTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_aliased_import_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Vec<ArgumentListChildTransport>>,
}

impl ::sittir_core::types::RenderableTransport for ArgumentListTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_argument_list_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
    pub alias: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for AsPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_as_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ExpressionTransport>,
}

impl ::sittir_core::types::RenderableTransport for AssertStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assert_statement_transport(self, dest)
    }
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

impl ::sittir_core::types::RenderableTransport for AssignmentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_transport(self, dest)
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: LeftHandSideTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: AssignmentEqTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentUFormEqTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_uform_eq_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: LeftHandSideTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: AssignmentTypeTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentUFormTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_uform_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: LeftHandSideTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: AssignmentTypedTransport,
}

impl ::sittir_core::types::RenderableTransport for AssignmentUFormTypedTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_assignment_uform_typed_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub object: PrimaryExpressionTransport,
    pub attribute: IdentifierTransport,
}

impl ::sittir_core::types::RenderableTransport for AttributeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_attribute_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: LeftHandSideTransport,
    pub operator: AugmentedAssignmentOperatorEnum,
    pub right: RightHandSideTransport,
}

impl ::sittir_core::types::RenderableTransport for AugmentedAssignmentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_augmented_assignment_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub primary_expression: PrimaryExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for AwaitTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_await_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: PrimaryExpressionTransport,
    pub operator: bool,
    pub right: PrimaryExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for BinaryOperatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_binary_operator_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<StatementTransport>,
}

impl ::sittir_core::types::RenderableTransport for BlockTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_block_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: ExpressionTransport,
    pub operator: bool,
    pub right: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for BooleanOperatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_boolean_operator_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct BreakStatementTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for BreakStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BreakStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BreakStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BreakStatementTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub function: PrimaryExpressionTransport,
    pub arguments: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for CallTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_call_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub guard: Option<IfClauseTransport>,
    pub consequence: SuiteTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<CasePatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for CaseClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_case_clause_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: CasePatternChildTransport,
}

impl ::sittir_core::types::RenderableTransport for CasePatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_case_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for ChevronTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_chevron_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: IdentifierTransport,
    pub type_parameters: Option<TypeParameterTransport>,
    pub superclasses: Option<ArgumentListTransport>,
    pub body: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for ClassDefinitionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_class_definition_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub dotted_name: DottedNameTransport,
    pub arguments: Vec<CasePatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for ClassPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_class_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct CommentTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CommentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CommentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CommentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CommentTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: PrimaryExpressionTransport,
    pub operators: Vec<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<PrimaryExpressionTransport>,
}

impl ::sittir_core::types::RenderableTransport for ComparisonOperatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_comparison_operator_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub real: Option<Box<AnyTransport>>,
    pub imaginary: PrimaryExpressionTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: PrimaryExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for ComplexPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_complex_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<StringTransport>,
}

impl ::sittir_core::types::RenderableTransport for ConcatenatedStringTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_concatenated_string_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: ExpressionTransport,
    pub condition: ExpressionTransport,
    pub alternative: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for ConditionalExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_conditional_expression_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub base_type: TypeTransport,
    pub constraint: TypeTransport,
}

impl ::sittir_core::types::RenderableTransport for ConstrainedTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_constrained_type_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct ContinueStatementTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ContinueStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ContinueStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ContinueStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ContinueStatementTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub definition: CompoundStatementTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<DecoratorTransport>,
}

impl ::sittir_core::types::RenderableTransport for DecoratedDefinitionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_decorated_definition_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
    pub newline: Option<Box<AnyTransport>>,
}

impl ::sittir_core::types::RenderableTransport for DecoratorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_decorator_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: PatternTransport,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for DefaultParameterTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_default_parameter_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ExpressionsTransport,
}

impl ::sittir_core::types::RenderableTransport for DeleteStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_delete_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<DictPatternKvTransport>,
}

impl ::sittir_core::types::RenderableTransport for DictPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dict_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<DictionaryChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for DictionaryTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dictionary_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: PairTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ComprehensionClausesTransport,
}

impl ::sittir_core::types::RenderableTransport for DictionaryComprehensionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dictionary_comprehension_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for DictionarySplatTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dictionary_splat_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: PatternTransport,
}

impl ::sittir_core::types::RenderableTransport for DictionarySplatPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dictionary_splat_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<IdentifierTransport>,
}

impl ::sittir_core::types::RenderableTransport for DottedNameTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_dotted_name_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub condition: ExpressionTransport,
    pub consequence: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for ElifClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_elif_clause_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct Ellipsis2Transport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for Ellipsis2Transport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for Ellipsis2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for Ellipsis2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Ellipsis2Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for ElseClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_else_clause_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct EscapeSequenceTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for EscapeSequenceTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EscapeSequenceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for EscapeSequenceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EscapeSequenceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub value: Option<Vec<ExpressionTransport>>,
    pub alias: Option<ExpressionTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for ExceptClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_except_clause_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub code: PrimaryExpressionTransport,
    pub in_clause: Option<Vec<ExpressionTransport>>,
}

impl ::sittir_core::types::RenderableTransport for ExecStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_exec_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ExpressionTransport>,
}

impl ::sittir_core::types::RenderableTransport for ExpressionListTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_list_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ExpressionTransport>,
}

impl ::sittir_core::types::RenderableTransport for ExpressionStatementTupleTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_statement_tuple_transport(self, dest)
    }
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

impl ::sittir_core::types::RenderableTransport for ExpressionStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_statement_transport(self, dest)
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for ExpressionStatementUFormTupleTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_expression_statement_uform_tuple_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct FalseTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for FalseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FalseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FalseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FalseTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub block: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for FinallyClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_finally_clause_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct FloatTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for FloatTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FloatTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FloatTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FloatTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub async_marker: Option<bool>,
    pub left: LeftHandSideTransport,
    pub right: Vec<ExpressionWithinForInClauseTransport>,
}

impl ::sittir_core::types::RenderableTransport for ForInClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_for_in_clause_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub async_marker: Option<bool>,
    pub left: LeftHandSideTransport,
    pub right: ExpressionsTransport,
    pub body: SuiteTransport,
    pub alternative: Option<ElseClauseTransport>,
}

impl ::sittir_core::types::RenderableTransport for ForStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_for_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<InterpolationTransport>,
}

impl ::sittir_core::types::RenderableTransport for FormatSpecifierTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_format_specifier_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub async_marker: Option<bool>,
    pub name: IdentifierTransport,
    pub type_parameters: Option<TypeParameterTransport>,
    pub parameters: ParametersTransport,
    pub return_type: Option<TypeTransport>,
    pub body: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for FunctionDefinitionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_function_definition_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: Vec<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for FutureImportStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_future_import_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: ExpressionTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ComprehensionClausesTransport,
}

impl ::sittir_core::types::RenderableTransport for GeneratorExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_generator_expression_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub identifier: IdentifierTransport,
    pub type_parameter: TypeParameterTransport,
}

impl ::sittir_core::types::RenderableTransport for GenericTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_generic_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<IdentifierTransport>,
}

impl ::sittir_core::types::RenderableTransport for GlobalStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_global_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct IdentifierTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for IdentifierTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for IdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for IdentifierTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for IfClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_if_clause_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub condition: ExpressionTransport,
    pub consequence: SuiteTransport,
    pub alternative: Option<Vec<AnyTransport>>,
}

impl ::sittir_core::types::RenderableTransport for IfStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_if_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub module_name: Box<AnyTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ImportFromStatementChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for ImportFromStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_import_from_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct ImportPrefixTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ImportPrefixTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ImportPrefixTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ImportPrefixTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ImportPrefixTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: Vec<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for ImportStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_import_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct IntegerTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for IntegerTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IntegerTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for IntegerTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for IntegerTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: FExpressionTransport,
    pub type_conversion: Option<TypeConversionTransport>,
    pub format_specifier: Option<FormatSpecifierTransport>,
}

impl ::sittir_core::types::RenderableTransport for InterpolationTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_interpolation_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: NamedExpressionLhsTransport,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for KeywordArgumentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_keyword_argument_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub identifier: IdentifierTransport,
    pub simple_pattern: SimplePatternTransport,
}

impl ::sittir_core::types::RenderableTransport for KeywordPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_keyword_pattern_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct KeywordSeparatorTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for KeywordSeparatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for KeywordSeparatorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for KeywordSeparatorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for KeywordSeparatorTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub parameters: Option<LambdaParametersTransport>,
    pub body: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for LambdaTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_lambda_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ParameterTransport>,
}

impl ::sittir_core::types::RenderableTransport for LambdaParametersTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_lambda_parameters_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub parameters: Option<LambdaParametersTransport>,
    pub body: ExpressionWithinForInClauseTransport,
}

impl ::sittir_core::types::RenderableTransport for LambdaWithinForInClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_lambda_within_for_in_clause_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct LineContinuationTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for LineContinuationTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LineContinuationTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LineContinuationTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LineContinuationTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ListChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for ListTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_list_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: ExpressionTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ComprehensionClausesTransport,
}

impl ::sittir_core::types::RenderableTransport for ListComprehensionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_list_comprehension_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<PatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for ListPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_list_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub expression: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for ListSplatTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_list_splat_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: PatternTransport,
}

impl ::sittir_core::types::RenderableTransport for ListSplatPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_list_splat_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub subject: Vec<ExpressionTransport>,
    pub body: MatchBlockTransport,
}

impl ::sittir_core::types::RenderableTransport for MatchStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_match_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub base_type: TypeTransport,
    pub identifier: IdentifierTransport,
}

impl ::sittir_core::types::RenderableTransport for MemberTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_member_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<StatementTransport>,
}

impl ::sittir_core::types::RenderableTransport for ModuleTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_module_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: NamedExpressionLhsTransport,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for NamedExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_named_expression_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct NoneTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NoneTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NoneTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NoneTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NoneTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<IdentifierTransport>,
}

impl ::sittir_core::types::RenderableTransport for NonlocalStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_nonlocal_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub argument: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for NotOperatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_not_operator_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub key: ExpressionTransport,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for PairTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_pair_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<ParameterTransport>,
}

impl ::sittir_core::types::RenderableTransport for ParametersTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_parameters_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: FExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for ParenthesizedExpressionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_parenthesized_expression_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ParenthesizedListSplatChildTransport,
}

impl ::sittir_core::types::RenderableTransport for ParenthesizedListSplatTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_parenthesized_list_splat_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct PassStatementTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for PassStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PassStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PassStatementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PassStatementTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<PatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for PatternListTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_pattern_list_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct PositionalSeparatorTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for PositionalSeparatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PositionalSeparatorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PositionalSeparatorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PositionalSeparatorTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub argument: Vec<ExpressionTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<ChevronTransport>,
}

impl ::sittir_core::types::RenderableTransport for PrintStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_print_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub cause: Option<ExpressionTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<ExpressionsTransport>,
}

impl ::sittir_core::types::RenderableTransport for RaiseStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_raise_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub import_prefix: ImportPrefixTransport,
    pub dotted_name: Option<DottedNameTransport>,
}

impl ::sittir_core::types::RenderableTransport for RelativeImportTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_relative_import_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<ExpressionsTransport>,
}

impl ::sittir_core::types::RenderableTransport for ReturnStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_return_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<SetChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for SetTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_set_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: ExpressionTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ComprehensionClausesTransport,
}

impl ::sittir_core::types::RenderableTransport for SetComprehensionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_set_comprehension_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub start: Option<ExpressionTransport>,
    pub stop: Option<ExpressionTransport>,
    pub step: Option<ExpressionTransport>,
}

impl ::sittir_core::types::RenderableTransport for SliceTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_slice_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub identifier: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for SplatPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_splat_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub identifier: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for SplatTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_splat_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub string_start: StringStartTransport,
    pub content: Vec<AnyTransport>,
    pub string_end: StringEndTransport,
}

impl ::sittir_core::types::RenderableTransport for StringTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_string_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<StringContentChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for StringContentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_string_content_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub value: PrimaryExpressionTransport,
    pub subscript: Vec<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for SubscriptTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_subscript_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct TrueTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for TrueTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TrueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TrueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TrueTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub body: SuiteTransport,
    pub except_clauses: Vec<ExceptClauseTransport>,
    pub else_clause: Option<ElseClauseTransport>,
    pub finally_clause: Option<FinallyClauseTransport>,
}

impl ::sittir_core::types::RenderableTransport for TryStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_try_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<TupleChildTransport>,
}

impl ::sittir_core::types::RenderableTransport for TupleTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_tuple_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<PatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for TuplePatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_tuple_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: TypeChildTransport,
}

impl ::sittir_core::types::RenderableTransport for TypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: bool,
    pub left: TypeTransport,
    pub right: TypeTransport,
}

impl ::sittir_core::types::RenderableTransport for TypeAliasStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_type_alias_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct TypeConversionTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for TypeConversionTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TypeConversionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TypeConversionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TypeConversionTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<TypeTransport>,
}

impl ::sittir_core::types::RenderableTransport for TypeParameterTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_type_parameter_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub name: IdentifierTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: TypeTransport,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for TypedDefaultParameterTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_typed_default_parameter_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "type"))]
    pub r#type: TypeTransport,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: ParameterTransport,
}

impl ::sittir_core::types::RenderableTransport for TypedParameterTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_typed_parameter_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub operator: UnaryOperatorOperatorEnum,
    pub argument: PrimaryExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for UnaryOperatorTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_unary_operator_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<SimplePatternTransport>,
}

impl ::sittir_core::types::RenderableTransport for UnionPatternTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_union_pattern_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub left: TypeTransport,
    pub right: TypeTransport,
}

impl ::sittir_core::types::RenderableTransport for UnionTypeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_union_type_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub condition: ExpressionTransport,
    pub body: SuiteTransport,
    pub alternative: Option<ElseClauseTransport>,
}

impl ::sittir_core::types::RenderableTransport for WhileStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_while_statement_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct WildcardImportTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for WildcardImportTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for WildcardImportTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for WildcardImportTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for WildcardImportTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<WithItemTransport>,
}

impl ::sittir_core::types::RenderableTransport for WithClauseBareTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_clause_bare_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Vec<WithItemTransport>,
}

impl ::sittir_core::types::RenderableTransport for WithClauseParenTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_clause_paren_transport(self, dest)
    }
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

impl ::sittir_core::types::RenderableTransport for WithClauseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_clause_transport(self, dest)
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Box<AnyTransport>,
}

impl ::sittir_core::types::RenderableTransport for WithClauseUFormBareTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_clause_uform_bare_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: _WithClauseParenTransport,
}

impl ::sittir_core::types::RenderableTransport for WithClauseUFormParenTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_clause_uform_paren_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub value: ExpressionTransport,
}

impl ::sittir_core::types::RenderableTransport for WithItemTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_item_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub async_marker: Option<bool>,
    pub with_clause: Box<AnyTransport>,
    pub body: SuiteTransport,
}

impl ::sittir_core::types::RenderableTransport for WithStatementTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_with_statement_transport(self, dest)
    }
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$nodeHandle"))]
    pub transport_node_handle: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$childIndex"))]
    pub transport_child_index: Option<f64>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$triviaData"))]
    pub transport_trivia_data: Option<::serde_json::Value>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$children"))]
    pub children: Option<Box<AnyTransport>>,
}

impl ::sittir_core::types::RenderableTransport for YieldTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        render_yield_transport(self, dest)
    }
}

#[derive(Debug, Clone)]
pub struct NewlineTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NewlineTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NewlineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NewlineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NewlineTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct IndentTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for IndentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IndentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for IndentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for IndentTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct DedentTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for DedentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DedentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DedentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DedentTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct StringStartTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for StringStartTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StringStartTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StringStartTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StringStartTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct _StringContentTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for _StringContentTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for _StringContentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for _StringContentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for _StringContentTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct EscapeInterpolationTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for EscapeInterpolationTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EscapeInterpolationTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for EscapeInterpolationTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EscapeInterpolationTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct StringEndTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for StringEndTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StringEndTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StringEndTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StringEndTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct CloseBracketTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CloseBracketTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseBracketTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseBracketTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CloseBracketTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct CloseParenTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CloseParenTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseParenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseParenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CloseParenTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct CloseBraceTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CloseBraceTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseBraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CloseBraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CloseBraceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ExceptTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ExceptTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ExceptTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ExceptTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ExceptTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct AsTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for AsTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AsTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct EqTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for EqTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for EqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EqTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ColonTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ColonTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ColonTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct AsyncTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for AsyncTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AsyncTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AsyncTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AsyncTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct BracketTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for BracketTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BracketTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BracketTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BracketTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct TokBsTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for TokBsTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TokBsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TokBsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TokBsTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct MinusTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for MinusTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for MinusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for MinusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for MinusTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ParenTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ParenTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ParenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ParenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ParenTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct CommaTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CommaTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CommaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CommaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CommaTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct AssertTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for AssertTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AssertTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AssertTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AssertTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct DotTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for DotTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DotTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct BreakTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for BreakTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BreakTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BreakTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BreakTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct CaseTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for CaseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CaseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CaseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CaseTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ShrTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ShrTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ShrTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ShrTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ShrTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ClassTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ClassTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ClassTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ClassTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ClassTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct IfTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for IfTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IfTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for IfTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for IfTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ElseTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ElseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ElseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ElseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ElseTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ContinueTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ContinueTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ContinueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ContinueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ContinueTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct AtTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for AtTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AtTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct DelTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for DelTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DelTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DelTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DelTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct BraceTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for BraceTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BraceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct StarstarTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for StarstarTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StarstarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StarstarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StarstarTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ElifTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ElifTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ElifTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ElifTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ElifTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct EllipsisTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for EllipsisTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EllipsisTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for EllipsisTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EllipsisTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct StarTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for StarTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StarTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ExecTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ExecTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ExecTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ExecTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ExecTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct InTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for InTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for InTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for InTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for InTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct False2Transport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for False2Transport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for False2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for False2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for False2Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct FinallyTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for FinallyTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FinallyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FinallyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FinallyTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ForTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ForTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ForTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ForTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ForTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct DefTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for DefTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DefTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DefTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DefTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ArrowTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ArrowTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ArrowTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ArrowTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ArrowTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct FromTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for FromTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FromTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FromTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FromTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct FutureUTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for FutureUTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FutureUTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FutureUTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FutureUTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ImportTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ImportTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ImportTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ImportTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ImportTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct GlobalTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for GlobalTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for GlobalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for GlobalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GlobalTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct MatchTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for MatchTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for MatchTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for MatchTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for MatchTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ColoneqTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ColoneqTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ColoneqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ColoneqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ColoneqTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct None2Transport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for None2Transport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for None2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for None2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for None2Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct NonlocalTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NonlocalTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NonlocalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NonlocalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NonlocalTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct NotTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for NotTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NotTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct PassTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for PassTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PassTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PassTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PassTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct SlashTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for SlashTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for SlashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for SlashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SlashTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct PrintTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for PrintTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PrintTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PrintTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PrintTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct RaiseTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for RaiseTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RaiseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for RaiseTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RaiseTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct ReturnTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for ReturnTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ReturnTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ReturnTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ReturnTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct AnonymousTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for AnonymousTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AnonymousTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AnonymousTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnonymousTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct True2Transport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for True2Transport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for True2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for True2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for True2Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct TryTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for TryTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TryTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TryTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TryTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct PipeTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for PipeTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PipeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PipeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PipeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct WhileTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for WhileTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for WhileTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for WhileTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for WhileTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[derive(Debug, Clone)]
pub struct WithTransport {
    pub transport_source: Option<::sittir_core::types::Source>,
    pub transport_named: Option<bool>,
    pub transport_span: Option<::sittir_core::types::Span>,
    pub transport_node_handle: Option<f64>,
    pub transport_child_index: Option<f64>,
    pub transport_trivia_data: Option<::serde_json::Value>,
    pub text: String,
}

impl ::sittir_core::types::RenderableTransport for WithTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        dest.write_str(&self.text).map_err(::askama::Error::from)
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for WithTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let text = String::from_napi_value(env, napi_val)?;
        Ok(Self {
            transport_source: None,
            transport_named: None,
            transport_span: None,
            transport_node_handle: None,
            transport_child_index: None,
            transport_trivia_data: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for WithTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_source = obj.get("$source")?;
        let transport_named = obj.get("$named")?;
        let transport_span = obj.get("$span")?;
        let transport_node_handle = obj.get("$nodeHandle")?;
        let transport_child_index = obj.get("$childIndex")?;
        let transport_trivia_data: Option<::serde_json::Value> = obj.get("$triviaData")?;
        Ok(Self {
            transport_source,
            transport_named,
            transport_span,
            transport_node_handle,
            transport_child_index,
            transport_trivia_data,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for WithTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}


#[derive(Debug, Clone, Copy)]
pub enum Renderable<'a> {
    Text(&'a str),
    Joined(::sittir_core::filters::Joined<'a>),
}

impl ::std::fmt::Display for Renderable<'_> {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        match self {
            Self::Text(s) => f.write_str(s),
            Self::Joined(j) => ::std::fmt::Display::fmt(j, f),
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
        }
    }
}

fn render__as_pattern_transport(node: &_AsPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = _AsPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_assignment_eq_transport(node: &AssignmentEqTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AssignmentEqTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_assignment_type_transport(node: &AssignmentTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AssignmentTypeTemplate {
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.r#type)),
    };
    template.render_into(dest)
}

fn render_assignment_typed_transport(node: &AssignmentTypedTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AssignmentTypedTemplate {
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.r#type)),
    };
    template.render_into(dest)
}

fn render_async_marker_transport(t: &bool, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if *t { dest.write_str("async").map_err(::askama::Error::from) } else { Ok(()) }
}

fn render_augmented_assignment_operator_transport(t: &AugmentedAssignmentOperatorEnum, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.to_string()).map_err(::askama::Error::from)
}

fn render_binary_operator_operator_transport(t: &bool, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if *t { dest.write_str("+").map_err(::askama::Error::from) } else { Ok(()) }
}

fn render_boolean_operator_operator_transport(t: &bool, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if *t { dest.write_str("and").map_err(::askama::Error::from) } else { Ok(()) }
}

fn render_comprehension_clauses_transport(node: &ComprehensionClausesTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ComprehensionClausesTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render__identifier_transport(t: &_IdentifierEnum, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.to_string()).map_err(::askama::Error::from)
}

fn render_import_list_transport(node: &ImportListTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(node.transport_text.as_deref().unwrap_or_default()).map_err(::askama::Error::from)
}

fn render_is_not_transport(t: &IsNotTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_key_value_pattern_transport(node: &KeyValuePatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(node.transport_text.as_deref().unwrap_or_default()).map_err(::askama::Error::from)
}

fn render_kw_async_marker_transport(t: &KwAsyncMarkerTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_kw_type_transport(t: &KwTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render__list_pattern_transport(node: &_ListPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    for child in node.children.iter() {
        render_case_pattern_transport(child, dest)?;
    }
    Ok(())
}

fn render_match_block_transport(node: &MatchBlockTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = MatchBlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_match_block_block_transport(node: &MatchBlockBlockTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let alternative_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.alternative.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = MatchBlockBlockTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: alternative_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_not_escape_sequence_transport(t: &NotEscapeSequenceTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_not_in_transport(t: &NotInTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_simple_pattern_negative_transport(node: &SimplePatternNegativeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = SimplePatternNegativeTemplate {
        text: node.transport_text.as_deref().unwrap_or(""),
    };
    template.render_into(dest)
}

fn render_simple_statements_transport(node: &SimpleStatementsTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = SimpleStatementsTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_suite_transport(node: &SuiteTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = SuiteTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render__tuple_pattern_transport(node: &_TuplePatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    for child in node.children.iter() {
        render_case_pattern_transport(child, dest)?;
    }
    Ok(())
}

fn render_type_alias_statement_type_transport(t: &bool, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    if *t { dest.write_str("type").map_err(::askama::Error::from) } else { Ok(()) }
}

fn render_unary_operator_operator_transport(t: &UnaryOperatorOperatorEnum, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.to_string()).map_err(::askama::Error::from)
}

fn render__with_clause_paren_transport(node: &_WithClauseParenTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = _WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_aliased_import_transport(node: &AliasedImportTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AliasedImportTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.alias)),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
    };
    template.render_into(dest)
}

fn render_argument_list_transport(node: &ArgumentListTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_owned = node.children.as_deref().unwrap_or(&[]);
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = children_owned.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ArgumentListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_as_pattern_transport(node: &AsPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AsPatternTemplate {
        alias: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.alias.as_ref())),
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
    };
    template.render_into(dest)
}

fn render_assert_statement_transport(node: &AssertStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = AssertStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_assignment_transport(t: &AssignmentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        AssignmentTransport::AssignmentUFormEq(data) => render_assignment_uform_eq_transport(data, dest),
        AssignmentTransport::AssignmentUFormType(data) => render_assignment_uform_type_transport(data, dest),
        AssignmentTransport::AssignmentUFormTyped(data) => render_assignment_uform_typed_transport(data, dest),
    }
}

fn render_assignment_uform_eq_transport(node: &AssignmentUFormEqTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
    };
    template.render_into(dest)
}

fn render_assignment_uform_type_transport(node: &AssignmentUFormTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
    };
    template.render_into(dest)
}

fn render_assignment_uform_typed_transport(node: &AssignmentUFormTypedTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = AssignmentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
    };
    template.render_into(dest)
}

fn render_attribute_transport(node: &AttributeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AttributeTemplate {
        attribute: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.attribute)),
        object: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.object)),
    };
    template.render_into(dest)
}

fn render_augmented_assignment_transport(node: &AugmentedAssignmentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AugmentedAssignmentTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.operator)),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_await_transport(node: &AwaitTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = AwaitTemplate {
        primary_expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.primary_expression)),
    };
    template.render_into(dest)
}

fn render_binary_operator_transport(node: &BinaryOperatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = BinaryOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        operator: ::sittir_core::filters::SingleNonterminalView(
            if node.operator { ::sittir_core::filters::Renderable::Text("+") } else { ::sittir_core::filters::Renderable::Text("") }
        ),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_block_transport(node: &BlockTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = BlockTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_boolean_operator_transport(node: &BooleanOperatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = BooleanOperatorTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        operator: ::sittir_core::filters::SingleNonterminalView(
            if node.operator { ::sittir_core::filters::Renderable::Text("and") } else { ::sittir_core::filters::Renderable::Text("") }
        ),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_break_statement_transport(t: &BreakStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_call_transport(node: &CallTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = CallTemplate {
        arguments: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.arguments.as_ref())),
        function: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.function)),
    };
    template.render_into(dest)
}

fn render_case_clause_transport(node: &CaseClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = CaseClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.consequence)),
        guard: match &node.guard {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_case_pattern_transport(node: &CasePatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = CasePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_chevron_transport(node: &ChevronTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ChevronTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
    };
    template.render_into(dest)
}

fn render_class_definition_transport(node: &ClassDefinitionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ClassDefinitionTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        superclasses: match &node.superclasses {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        type_parameters: match &node.type_parameters {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_class_pattern_transport(node: &ClassPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let arguments_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.arguments.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ClassPatternTemplate {
        arguments: ::sittir_core::filters::ListNonterminalView {
            items: arguments_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        dotted_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.dotted_name)),
    };
    template.render_into(dest)
}

fn render_comment_transport(t: &CommentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_comparison_operator_transport(node: &ComparisonOperatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let operators_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.operators.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ComparisonOperatorTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        operators: ::sittir_core::filters::ListNonterminalView {
            items: operators_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_complex_pattern_transport(node: &ComplexPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = ComplexPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        imaginary: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.imaginary)),
        real: match &node.real {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v.as_ref())),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_concatenated_string_transport(node: &ConcatenatedStringTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ConcatenatedStringTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_conditional_expression_transport(node: &ConditionalExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ConditionalExpressionTemplate {
        alternative: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.alternative)),
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.condition)),
    };
    template.render_into(dest)
}

fn render_constrained_type_transport(node: &ConstrainedTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ConstrainedTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.base_type)),
        constraint: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.constraint)),
    };
    template.render_into(dest)
}

fn render_continue_statement_transport(t: &ContinueStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_decorated_definition_transport(node: &DecoratedDefinitionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = DecoratedDefinitionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        definition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.definition)),
    };
    template.render_into(dest)
}

fn render_decorator_transport(node: &DecoratorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = DecoratorTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
        newline: match &node.newline {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v.as_ref())),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_default_parameter_transport(node: &DefaultParameterTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = DefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_delete_statement_transport(node: &DeleteStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = DeleteStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_dict_pattern_transport(node: &DictPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = DictPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_dictionary_transport(node: &DictionaryTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = DictionaryTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_dictionary_comprehension_transport(node: &DictionaryComprehensionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = DictionaryComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
    };
    template.render_into(dest)
}

fn render_dictionary_splat_transport(node: &DictionarySplatTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = DictionarySplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
    };
    template.render_into(dest)
}

fn render_dictionary_splat_pattern_transport(node: &DictionarySplatPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = DictionarySplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_dotted_name_transport(node: &DottedNameTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = DottedNameTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ".",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_elif_clause_transport(node: &ElifClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ElifClauseTemplate {
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.condition)),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.consequence)),
    };
    template.render_into(dest)
}

fn render_ellipsis2_transport(t: &Ellipsis2Transport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_else_clause_transport(node: &ElseClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ElseClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
    };
    template.render_into(dest)
}

fn render_escape_sequence_transport(t: &EscapeSequenceTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_except_clause_transport(node: &ExceptClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let value_owned = node.value.as_deref().unwrap_or(&[]);
    let value_buf: Vec<::sittir_core::filters::Renderable<'_>> = value_owned.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ExceptClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        alias: match &node.alias {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        value: ::sittir_core::filters::ListNonterminalView {
            items: value_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_exec_statement_transport(node: &ExecStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let in_clause_owned = node.in_clause.as_deref().unwrap_or(&[]);
    let in_clause_buf: Vec<::sittir_core::filters::Renderable<'_>> = in_clause_owned.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ExecStatementTemplate {
        code: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.code)),
        in_clause: ::sittir_core::filters::ListNonterminalView {
            items: in_clause_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_expression_list_transport(node: &ExpressionListTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ExpressionListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_expression_statement_tuple_transport(node: &ExpressionStatementTupleTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ExpressionStatementTupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_expression_statement_transport(t: &ExpressionStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        ExpressionStatementTransport::ExpressionStatementUFormTuple(data) => render_expression_statement_uform_tuple_transport(data, dest),
    }
}

fn render_expression_statement_uform_tuple_transport(node: &ExpressionStatementUFormTupleTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(node.children.as_ref())];
    let template = ExpressionStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        variant: "",
    };
    template.render_into(dest)
}

fn render_false_transport(t: &FalseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_finally_clause_transport(node: &FinallyClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = FinallyClauseTemplate {
        block: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.block)),
    };
    template.render_into(dest)
}

fn render_float_transport(t: &FloatTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_for_in_clause_transport(node: &ForInClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let right_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.right.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ForInClauseTemplate {
        async_marker: match node.async_marker {
            Some(true) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text("async")),
            _ => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        right: ::sittir_core::filters::ListNonterminalView {
            items: right_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_for_statement_transport(node: &ForStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ForStatementTemplate {
        alternative: match &node.alternative {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        async_marker: match node.async_marker {
            Some(true) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text("async")),
            _ => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_format_specifier_transport(node: &FormatSpecifierTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = FormatSpecifierTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_function_definition_transport(node: &FunctionDefinitionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = FunctionDefinitionTemplate {
        async_marker: match node.async_marker {
            Some(true) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text("async")),
            _ => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        parameters: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.parameters)),
        return_type: match &node.return_type {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        type_parameters: match &node.type_parameters {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_future_import_statement_transport(node: &FutureImportStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let name_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.name.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = FutureImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: name_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_generator_expression_transport(node: &GeneratorExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = GeneratorExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
    };
    template.render_into(dest)
}

fn render_generic_type_transport(node: &GenericTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = GenericTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.identifier)),
        type_parameter: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.type_parameter)),
    };
    template.render_into(dest)
}

fn render_global_statement_transport(node: &GlobalStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = GlobalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_identifier_transport(t: &IdentifierTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_if_clause_transport(node: &IfClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = IfClauseTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
    };
    template.render_into(dest)
}

fn render_if_statement_transport(node: &IfStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let alternative_owned = node.alternative.as_deref().unwrap_or(&[]);
    let alternative_buf: Vec<::sittir_core::filters::Renderable<'_>> = alternative_owned.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = IfStatementTemplate {
        alternative: ::sittir_core::filters::ListNonterminalView {
            items: alternative_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.condition)),
        consequence: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.consequence)),
    };
    template.render_into(dest)
}

fn render_import_from_statement_transport(node: &ImportFromStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ImportFromStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        module_name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.module_name.as_ref())),
        name: ::sittir_core::filters::ListNonterminalView {
            items: &[],
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_import_prefix_transport(t: &ImportPrefixTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_import_statement_transport(node: &ImportStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let name_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.name.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ImportStatementTemplate {
        name: ::sittir_core::filters::ListNonterminalView {
            items: name_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_integer_transport(t: &IntegerTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_interpolation_transport(node: &InterpolationTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = InterpolationTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
        format_specifier: match &node.format_specifier {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        type_conversion: match &node.type_conversion {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_keyword_argument_transport(node: &KeywordArgumentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = KeywordArgumentTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_keyword_pattern_transport(node: &KeywordPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = KeywordPatternTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.identifier)),
        simple_pattern: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.simple_pattern)),
    };
    template.render_into(dest)
}

fn render_keyword_separator_transport(t: &KeywordSeparatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_lambda_transport(node: &LambdaTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = LambdaTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        parameters: match &node.parameters {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_lambda_parameters_transport(node: &LambdaParametersTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = LambdaParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_lambda_within_for_in_clause_transport(node: &LambdaWithinForInClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = LambdaWithinForInClauseTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        parameters: match &node.parameters {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_line_continuation_transport(t: &LineContinuationTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_list_transport(node: &ListTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_list_comprehension_transport(node: &ListComprehensionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = ListComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
    };
    template.render_into(dest)
}

fn render_list_pattern_transport(node: &ListPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ListPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_list_splat_transport(node: &ListSplatTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = ListSplatTemplate {
        expression: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.expression)),
    };
    template.render_into(dest)
}

fn render_list_splat_pattern_transport(node: &ListSplatPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = ListSplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_match_statement_transport(node: &MatchStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let subject_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.subject.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = MatchStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        subject: ::sittir_core::filters::ListNonterminalView {
            items: subject_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_member_type_transport(node: &MemberTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = MemberTypeTemplate {
        base_type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.base_type)),
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.identifier)),
    };
    template.render_into(dest)
}

fn render_module_transport(node: &ModuleTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ModuleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_named_expression_transport(node: &NamedExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = NamedExpressionTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_none_transport(t: &NoneTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_nonlocal_statement_transport(node: &NonlocalStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = NonlocalStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_not_operator_transport(node: &NotOperatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = NotOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.argument)),
    };
    template.render_into(dest)
}

fn render_pair_transport(node: &PairTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = PairTemplate {
        key: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.key)),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_parameters_transport(node: &ParametersTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = ParametersTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_parenthesized_expression_transport(node: &ParenthesizedExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = ParenthesizedExpressionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_parenthesized_list_splat_transport(node: &ParenthesizedListSplatTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = ParenthesizedListSplatTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_pass_statement_transport(t: &PassStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_pattern_list_transport(node: &PatternListTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = PatternListTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_positional_separator_transport(t: &PositionalSeparatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_print_statement_transport(node: &PrintStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter().map(|c| ::sittir_core::filters::Renderable::Transport(c)).collect();
    let argument_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.argument.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
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
    template.render_into(dest)
}

fn render_raise_statement_transport(node: &RaiseStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter().map(|c| ::sittir_core::filters::Renderable::Transport(c)).collect();
    let template = RaiseStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        cause: match &node.cause {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_relative_import_transport(node: &RelativeImportTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = RelativeImportTemplate {
        dotted_name: match &node.dotted_name {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        import_prefix: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.import_prefix)),
    };
    template.render_into(dest)
}

fn render_return_statement_transport(node: &ReturnStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter().map(|c| ::sittir_core::filters::Renderable::Transport(c)).collect();
    let template = ReturnStatementTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_set_transport(node: &SetTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = SetTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_set_comprehension_transport(node: &SetComprehensionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = SetComprehensionTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
    };
    template.render_into(dest)
}

fn render_slice_transport(node: &SliceTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = SliceTemplate {
        start: match &node.start {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        step: match &node.step {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        stop: match &node.stop {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_splat_pattern_transport(node: &SplatPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = Vec::new();
    let template = SplatPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.identifier.as_ref())),
    };
    template.render_into(dest)
}

fn render_splat_type_transport(node: &SplatTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = SplatTypeTemplate {
        identifier: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.identifier.as_ref())),
    };
    template.render_into(dest)
}

fn render_string_transport(node: &StringTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = StringTemplate {
        text: node.transport_text.as_deref().unwrap_or(""),
    };
    template.render_into(dest)
}

fn render_string_content_transport(node: &StringContentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = StringContentTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_subscript_transport(node: &SubscriptTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let subscript_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.subscript.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = SubscriptTemplate {
        subscript: ::sittir_core::filters::ListNonterminalView {
            items: subscript_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_true_transport(t: &TrueTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_try_statement_transport(node: &TryStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let except_clauses_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.except_clauses.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = TryStatementTemplate {
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        else_clause: match &node.else_clause {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        except_clauses: ::sittir_core::filters::ListNonterminalView {
            items: except_clauses_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        finally_clause: match &node.finally_clause {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
    };
    template.render_into(dest)
}

fn render_tuple_transport(node: &TupleTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = TupleTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_tuple_pattern_transport(node: &TuplePatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = TuplePatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_type_transport(node: &TypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = TypeTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_type_alias_statement_transport(node: &TypeAliasStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = TypeAliasStatementTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
        r#type: ::sittir_core::filters::SingleNonterminalView(
            if node.r#type { ::sittir_core::filters::Renderable::Text("type") } else { ::sittir_core::filters::Renderable::Text("") }
        ),
    };
    template.render_into(dest)
}

fn render_type_conversion_transport(t: &TypeConversionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_type_parameter_transport(node: &TypeParameterTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = TypeParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_typed_default_parameter_transport(node: &TypedDefaultParameterTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = TypedDefaultParameterTemplate {
        name: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.name)),
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.r#type)),
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_typed_parameter_transport(node: &TypedParameterTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = TypedParameterTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
        r#type: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.r#type)),
    };
    template.render_into(dest)
}

fn render_unary_operator_transport(node: &UnaryOperatorTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = UnaryOperatorTemplate {
        argument: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.argument)),
        operator: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.operator)),
    };
    template.render_into(dest)
}

fn render_union_pattern_transport(node: &UnionPatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = UnionPatternTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_union_type_transport(node: &UnionTypeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = UnionTypeTemplate {
        left: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.left)),
        right: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.right)),
    };
    template.render_into(dest)
}

fn render_while_statement_transport(node: &WhileStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = WhileStatementTemplate {
        alternative: match &node.alternative {
            Some(v) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Transport(v)),
            None => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        condition: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.condition)),
    };
    template.render_into(dest)
}

fn render_wildcard_import_transport(t: &WildcardImportTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_with_clause_bare_transport(node: &WithClauseBareTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = WithClauseBareTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_with_clause_paren_transport(node: &WithClauseParenTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter()
        .map(|t| ::sittir_core::filters::Renderable::Transport(t))
        .collect();
    let template = WithClauseParenTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: ",",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_with_clause_transport(t: &WithClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        WithClauseTransport::WithClauseUFormBare(data) => render_with_clause_uform_bare_transport(data, dest),
        WithClauseTransport::WithClauseUFormParen(data) => render_with_clause_uform_paren_transport(data, dest),
    }
}

fn render_with_clause_uform_bare_transport(node: &WithClauseUFormBareTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(node.children.as_ref())];
    let template = WithClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_with_clause_uform_paren_transport(node: &WithClauseUFormParenTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = vec![::sittir_core::filters::Renderable::Transport(&node.children)];
    let template = WithClauseTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_with_item_transport(node: &WithItemTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = WithItemTemplate {
        value: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.value)),
    };
    template.render_into(dest)
}

fn render_with_statement_transport(node: &WithStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let template = WithStatementTemplate {
        async_marker: match node.async_marker {
            Some(true) => ::sittir_core::filters::OptionalNonterminalView::Present(::sittir_core::filters::Renderable::Text("async")),
            _ => ::sittir_core::filters::OptionalNonterminalView::Missing,
        },
        body: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.body)),
        with_clause: ::sittir_core::filters::SingleNonterminalView(::sittir_core::filters::Renderable::Transport(node.with_clause.as_ref())),
    };
    template.render_into(dest)
}

fn render_yield_transport(node: &YieldTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    let children_buf: Vec<::sittir_core::filters::Renderable<'_>> = node.children.iter().map(|c| ::sittir_core::filters::Renderable::Transport(c.as_ref())).collect();
    let template = YieldTemplate {
        children: ::sittir_core::filters::ListNonterminalView {
            items: children_buf.as_slice(),
            separator: "",
            leading: false,
            trailing: false,
        },
    };
    template.render_into(dest)
}

fn render_newline_transport(t: &NewlineTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_indent_transport(t: &IndentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_dedent_transport(t: &DedentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_string_start_transport(t: &StringStartTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render__string_content_transport(t: &_StringContentTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_escape_interpolation_transport(t: &EscapeInterpolationTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_string_end_transport(t: &StringEndTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_close_bracket_transport(t: &CloseBracketTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_close_paren_transport(t: &CloseParenTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_close_brace_transport(t: &CloseBraceTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_except_transport(t: &ExceptTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_as_transport(t: &AsTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_eq_transport(t: &EqTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_colon_transport(t: &ColonTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_async_transport(t: &AsyncTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_bracket_transport(t: &BracketTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_tok_bs_transport(t: &TokBsTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_minus_transport(t: &MinusTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_paren_transport(t: &ParenTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_comma_transport(t: &CommaTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_assert_transport(t: &AssertTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_dot_transport(t: &DotTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_break_transport(t: &BreakTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_case_transport(t: &CaseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_shr_transport(t: &ShrTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_class_transport(t: &ClassTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_if_transport(t: &IfTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_else_transport(t: &ElseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_continue_transport(t: &ContinueTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_at_transport(t: &AtTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_del_transport(t: &DelTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_brace_transport(t: &BraceTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_starstar_transport(t: &StarstarTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_elif_transport(t: &ElifTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_ellipsis_transport(t: &EllipsisTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_star_transport(t: &StarTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_exec_transport(t: &ExecTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_in_transport(t: &InTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_false2_transport(t: &False2Transport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_finally_transport(t: &FinallyTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_for_transport(t: &ForTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_def_transport(t: &DefTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_arrow_transport(t: &ArrowTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_from_transport(t: &FromTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_future_u_transport(t: &FutureUTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_import_transport(t: &ImportTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_global_transport(t: &GlobalTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_match_transport(t: &MatchTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_coloneq_transport(t: &ColoneqTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_none2_transport(t: &None2Transport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_nonlocal_transport(t: &NonlocalTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_not_transport(t: &NotTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_pass_transport(t: &PassTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_slash_transport(t: &SlashTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_print_transport(t: &PrintTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_raise_transport(t: &RaiseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_return_transport(t: &ReturnTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_anonymous_transport(t: &AnonymousTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_true2_transport(t: &True2Transport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_try_transport(t: &TryTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_pipe_transport(t: &PipeTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_while_transport(t: &WhileTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_with_transport(t: &WithTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    dest.write_str(&t.text).map_err(::askama::Error::from)
}

fn render_compound_statement_transport(t: &CompoundStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        CompoundStatementTransport::IfStatement(inner) => render_if_statement_transport(inner.as_ref(), dest),
        CompoundStatementTransport::ForStatement(inner) => render_for_statement_transport(inner.as_ref(), dest),
        CompoundStatementTransport::WhileStatement(inner) => render_while_statement_transport(inner.as_ref(), dest),
        CompoundStatementTransport::TryStatement(inner) => render_try_statement_transport(inner.as_ref(), dest),
        CompoundStatementTransport::WithStatement(inner) => render_with_statement_transport(inner.as_ref(), dest),
        CompoundStatementTransport::FunctionDefinition(inner) => render_function_definition_transport(inner.as_ref(), dest),
        CompoundStatementTransport::ClassDefinition(inner) => render_class_definition_transport(inner.as_ref(), dest),
        CompoundStatementTransport::DecoratedDefinition(inner) => render_decorated_definition_transport(inner.as_ref(), dest),
        CompoundStatementTransport::MatchStatement(inner) => render_match_statement_transport(inner.as_ref(), dest),
    }
}

fn render_dict_pattern_kv_transport(t: &DictPatternKvTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        DictPatternKvTransport::KeyValuePattern(inner) => render_key_value_pattern_transport(inner.as_ref(), dest),
        DictPatternKvTransport::SplatPattern(inner) => render_splat_pattern_transport(inner.as_ref(), dest),
    }
}

fn render_expression_within_for_in_clause_transport(t: &ExpressionWithinForInClauseTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        ExpressionWithinForInClauseTransport::Expression(inner) => render_expression_transport(inner.as_ref(), dest),
        ExpressionWithinForInClauseTransport::LambdaWithinForInClause(inner) => render_lambda_within_for_in_clause_transport(inner.as_ref(), dest),
    }
}

fn render_expressions_transport(t: &ExpressionsTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        ExpressionsTransport::Expression(inner) => render_expression_transport(inner.as_ref(), dest),
        ExpressionsTransport::ExpressionList(inner) => render_expression_list_transport(inner.as_ref(), dest),
    }
}

fn render_fexpression_transport(t: &FExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        FExpressionTransport::Expression(inner) => render_expression_transport(inner.as_ref(), dest),
        FExpressionTransport::ExpressionList(inner) => render_expression_list_transport(inner.as_ref(), dest),
        FExpressionTransport::PatternList(inner) => render_pattern_list_transport(inner.as_ref(), dest),
        FExpressionTransport::Yield(inner) => render_yield_transport(inner.as_ref(), dest),
    }
}

fn render_left_hand_side_transport(t: &LeftHandSideTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        LeftHandSideTransport::Pattern(inner) => render_pattern_transport(inner.as_ref(), dest),
        LeftHandSideTransport::PatternList(inner) => render_pattern_list_transport(inner.as_ref(), dest),
    }
}

fn render_named_expression_lhs_transport(t: &NamedExpressionLhsTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        NamedExpressionLhsTransport::Identifier(inner) => render_identifier_transport(inner, dest),
        NamedExpressionLhsTransport::KeywordIdentifier(inner) => render_keyword_identifier_transport(inner.as_ref(), dest),
    }
}

fn render_right_hand_side_transport(t: &RightHandSideTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        RightHandSideTransport::Expression(inner) => render_expression_transport(inner.as_ref(), dest),
        RightHandSideTransport::ExpressionList(inner) => render_expression_list_transport(inner.as_ref(), dest),
        RightHandSideTransport::Assignment(inner) => render_assignment_transport(inner.as_ref(), dest),
        RightHandSideTransport::AugmentedAssignment(inner) => render_augmented_assignment_transport(inner.as_ref(), dest),
        RightHandSideTransport::PatternList(inner) => render_pattern_list_transport(inner.as_ref(), dest),
        RightHandSideTransport::Yield(inner) => render_yield_transport(inner.as_ref(), dest),
    }
}

fn render_simple_pattern_transport(t: &SimplePatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        SimplePatternTransport::ClassPattern(inner) => render_class_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::SplatPattern(inner) => render_splat_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::UnionPattern(inner) => render_union_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::_ListPattern(inner) => render__list_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::_TuplePattern(inner) => render__tuple_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::DictPattern(inner) => render_dict_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::String(inner) => render_string_transport(inner.as_ref(), dest),
        SimplePatternTransport::ConcatenatedString(inner) => render_concatenated_string_transport(inner.as_ref(), dest),
        SimplePatternTransport::True(inner) => render_true_transport(inner, dest),
        SimplePatternTransport::False(inner) => render_false_transport(inner, dest),
        SimplePatternTransport::None(inner) => render_none_transport(inner, dest),
        SimplePatternTransport::SimplePatternNegative(inner) => render_simple_pattern_negative_transport(inner.as_ref(), dest),
        SimplePatternTransport::ComplexPattern(inner) => render_complex_pattern_transport(inner.as_ref(), dest),
        SimplePatternTransport::DottedName(inner) => render_dotted_name_transport(inner.as_ref(), dest),
    }
}

fn render_simple_statement_transport(t: &SimpleStatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        SimpleStatementTransport::FutureImportStatement(inner) => render_future_import_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::ImportStatement(inner) => render_import_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::ImportFromStatement(inner) => render_import_from_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::PrintStatement(inner) => render_print_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::AssertStatement(inner) => render_assert_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::ExpressionStatement(inner) => render_expression_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::ReturnStatement(inner) => render_return_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::DeleteStatement(inner) => render_delete_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::RaiseStatement(inner) => render_raise_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::PassStatement(inner) => render_pass_statement_transport(inner, dest),
        SimpleStatementTransport::BreakStatement(inner) => render_break_statement_transport(inner, dest),
        SimpleStatementTransport::ContinueStatement(inner) => render_continue_statement_transport(inner, dest),
        SimpleStatementTransport::GlobalStatement(inner) => render_global_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::NonlocalStatement(inner) => render_nonlocal_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::ExecStatement(inner) => render_exec_statement_transport(inner.as_ref(), dest),
        SimpleStatementTransport::TypeAliasStatement(inner) => render_type_alias_statement_transport(inner.as_ref(), dest),
    }
}

fn render_statement_transport(t: &StatementTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        StatementTransport::SimpleStatements(inner) => render_simple_statements_transport(inner.as_ref(), dest),
        StatementTransport::IfStatement(inner) => render_if_statement_transport(inner.as_ref(), dest),
        StatementTransport::ForStatement(inner) => render_for_statement_transport(inner.as_ref(), dest),
        StatementTransport::WhileStatement(inner) => render_while_statement_transport(inner.as_ref(), dest),
        StatementTransport::TryStatement(inner) => render_try_statement_transport(inner.as_ref(), dest),
        StatementTransport::WithStatement(inner) => render_with_statement_transport(inner.as_ref(), dest),
        StatementTransport::FunctionDefinition(inner) => render_function_definition_transport(inner.as_ref(), dest),
        StatementTransport::ClassDefinition(inner) => render_class_definition_transport(inner.as_ref(), dest),
        StatementTransport::DecoratedDefinition(inner) => render_decorated_definition_transport(inner.as_ref(), dest),
        StatementTransport::MatchStatement(inner) => render_match_statement_transport(inner.as_ref(), dest),
    }
}

fn render_expression_transport(t: &ExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        ExpressionTransport::ComparisonOperator(inner) => render_comparison_operator_transport(inner.as_ref(), dest),
        ExpressionTransport::NotOperator(inner) => render_not_operator_transport(inner.as_ref(), dest),
        ExpressionTransport::BooleanOperator(inner) => render_boolean_operator_transport(inner.as_ref(), dest),
        ExpressionTransport::Lambda(inner) => render_lambda_transport(inner.as_ref(), dest),
        ExpressionTransport::PrimaryExpression(inner) => render_primary_expression_transport(inner.as_ref(), dest),
        ExpressionTransport::ConditionalExpression(inner) => render_conditional_expression_transport(inner.as_ref(), dest),
        ExpressionTransport::NamedExpression(inner) => render_named_expression_transport(inner.as_ref(), dest),
        ExpressionTransport::AsPattern(inner) => render_as_pattern_transport(inner.as_ref(), dest),
    }
}

fn render_keyword_identifier_transport(t: &KeywordIdentifierTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        KeywordIdentifierTransport::Identifier(inner) => render_identifier_transport(inner, dest),
    }
}

fn render_parameter_transport(t: &ParameterTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        ParameterTransport::Identifier(inner) => render_identifier_transport(inner, dest),
        ParameterTransport::TypedParameter(inner) => render_typed_parameter_transport(inner.as_ref(), dest),
        ParameterTransport::DefaultParameter(inner) => render_default_parameter_transport(inner.as_ref(), dest),
        ParameterTransport::TypedDefaultParameter(inner) => render_typed_default_parameter_transport(inner.as_ref(), dest),
        ParameterTransport::ListSplatPattern(inner) => render_list_splat_pattern_transport(inner.as_ref(), dest),
        ParameterTransport::TuplePattern(inner) => render_tuple_pattern_transport(inner.as_ref(), dest),
        ParameterTransport::KeywordSeparator(inner) => render_keyword_separator_transport(inner, dest),
        ParameterTransport::PositionalSeparator(inner) => render_positional_separator_transport(inner, dest),
        ParameterTransport::DictionarySplatPattern(inner) => render_dictionary_splat_pattern_transport(inner.as_ref(), dest),
    }
}

fn render_pattern_transport(t: &PatternTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        PatternTransport::Identifier(inner) => render_identifier_transport(inner, dest),
        PatternTransport::KeywordIdentifier(inner) => render_keyword_identifier_transport(inner.as_ref(), dest),
        PatternTransport::Subscript(inner) => render_subscript_transport(inner.as_ref(), dest),
        PatternTransport::Attribute(inner) => render_attribute_transport(inner.as_ref(), dest),
        PatternTransport::ListSplatPattern(inner) => render_list_splat_pattern_transport(inner.as_ref(), dest),
        PatternTransport::TuplePattern(inner) => render_tuple_pattern_transport(inner.as_ref(), dest),
        PatternTransport::ListPattern(inner) => render_list_pattern_transport(inner.as_ref(), dest),
    }
}

fn render_primary_expression_transport(t: &PrimaryExpressionTransport, dest: &mut dyn ::std::fmt::Write) -> Result<(), ::askama::Error> {
    match t {
        PrimaryExpressionTransport::Await(inner) => render_await_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::BinaryOperator(inner) => render_binary_operator_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Identifier(inner) => render_identifier_transport(inner, dest),
        PrimaryExpressionTransport::KeywordIdentifier(inner) => render_keyword_identifier_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::String(inner) => render_string_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::ConcatenatedString(inner) => render_concatenated_string_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Integer(inner) => render_integer_transport(inner, dest),
        PrimaryExpressionTransport::Float(inner) => render_float_transport(inner, dest),
        PrimaryExpressionTransport::True(inner) => render_true_transport(inner, dest),
        PrimaryExpressionTransport::False(inner) => render_false_transport(inner, dest),
        PrimaryExpressionTransport::None(inner) => render_none_transport(inner, dest),
        PrimaryExpressionTransport::UnaryOperator(inner) => render_unary_operator_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Attribute(inner) => render_attribute_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Subscript(inner) => render_subscript_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Call(inner) => render_call_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::List(inner) => render_list_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::ListComprehension(inner) => render_list_comprehension_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Dictionary(inner) => render_dictionary_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::DictionaryComprehension(inner) => render_dictionary_comprehension_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Set(inner) => render_set_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::SetComprehension(inner) => render_set_comprehension_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Tuple(inner) => render_tuple_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::ParenthesizedExpression(inner) => render_parenthesized_expression_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::GeneratorExpression(inner) => render_generator_expression_transport(inner.as_ref(), dest),
        PrimaryExpressionTransport::Ellipsis2(inner) => render_ellipsis2_transport(inner, dest),
        PrimaryExpressionTransport::ListSplatPattern(inner) => render_list_splat_pattern_transport(inner.as_ref(), dest),
    }
}

pub fn render_transport_dispatch(transport: &AnyTransport) -> Result<String, ::askama::Error> {
    let mut s = String::new();
    transport.render_into(&mut s)?;
    Ok(s)
}

impl ::sittir_core::types::RenderableTransport for AnyTransport {
    fn render_into(
        &self,
        dest: &mut dyn ::std::fmt::Write,
    ) -> Result<(), ::askama::Error> {
        match self {
            AnyTransport::_AsPattern(t) => render__as_pattern_transport(t, dest),
            AnyTransport::AssignmentEq(t) => render_assignment_eq_transport(t, dest),
            AnyTransport::AssignmentType(t) => render_assignment_type_transport(t, dest),
            AnyTransport::AssignmentTyped(t) => render_assignment_typed_transport(t, dest),
            AnyTransport::AsyncMarker(t) => if *t { dest.write_str("async").map_err(::askama::Error::from) } else { Ok(()) },
            AnyTransport::AugmentedAssignmentOperator(t) => t.render_into(dest),
            AnyTransport::BinaryOperatorOperator(t) => if *t { dest.write_str("+").map_err(::askama::Error::from) } else { Ok(()) },
            AnyTransport::BooleanOperatorOperator(t) => if *t { dest.write_str("and").map_err(::askama::Error::from) } else { Ok(()) },
            AnyTransport::ComprehensionClauses(t) => render_comprehension_clauses_transport(t, dest),
            AnyTransport::_Identifier(t) => t.render_into(dest),
            AnyTransport::ImportList(t) => render_import_list_transport(t, dest),
            AnyTransport::IsNot(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::KeyValuePattern(t) => render_key_value_pattern_transport(t, dest),
            AnyTransport::KwAsyncMarker(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::KwType(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::_ListPattern(t) => render__list_pattern_transport(t, dest),
            AnyTransport::MatchBlock(t) => render_match_block_transport(t, dest),
            AnyTransport::MatchBlockBlock(t) => render_match_block_block_transport(t, dest),
            AnyTransport::NotEscapeSequence(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::NotIn(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::SimplePatternNegative(t) => render_simple_pattern_negative_transport(t, dest),
            AnyTransport::SimpleStatements(t) => render_simple_statements_transport(t, dest),
            AnyTransport::Suite(t) => render_suite_transport(t, dest),
            AnyTransport::_TuplePattern(t) => render__tuple_pattern_transport(t, dest),
            AnyTransport::TypeAliasStatementType(t) => if *t { dest.write_str("type").map_err(::askama::Error::from) } else { Ok(()) },
            AnyTransport::UnaryOperatorOperator(t) => t.render_into(dest),
            AnyTransport::_WithClauseParen(t) => render__with_clause_paren_transport(t, dest),
            AnyTransport::AliasedImport(t) => render_aliased_import_transport(t, dest),
            AnyTransport::ArgumentList(t) => render_argument_list_transport(t, dest),
            AnyTransport::AsPattern(t) => render_as_pattern_transport(t, dest),
            AnyTransport::AssertStatement(t) => render_assert_statement_transport(t, dest),
            AnyTransport::Assignment(t) => render_assignment_transport(t, dest),
            AnyTransport::Attribute(t) => render_attribute_transport(t, dest),
            AnyTransport::AugmentedAssignment(t) => render_augmented_assignment_transport(t, dest),
            AnyTransport::Await(t) => render_await_transport(t, dest),
            AnyTransport::BinaryOperator(t) => render_binary_operator_transport(t, dest),
            AnyTransport::Block(t) => render_block_transport(t, dest),
            AnyTransport::BooleanOperator(t) => render_boolean_operator_transport(t, dest),
            AnyTransport::BreakStatement(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Call(t) => render_call_transport(t, dest),
            AnyTransport::CaseClause(t) => render_case_clause_transport(t, dest),
            AnyTransport::CasePattern(t) => render_case_pattern_transport(t, dest),
            AnyTransport::Chevron(t) => render_chevron_transport(t, dest),
            AnyTransport::ClassDefinition(t) => render_class_definition_transport(t, dest),
            AnyTransport::ClassPattern(t) => render_class_pattern_transport(t, dest),
            AnyTransport::Comment(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::ComparisonOperator(t) => render_comparison_operator_transport(t, dest),
            AnyTransport::ComplexPattern(t) => render_complex_pattern_transport(t, dest),
            AnyTransport::ConcatenatedString(t) => render_concatenated_string_transport(t, dest),
            AnyTransport::ConditionalExpression(t) => render_conditional_expression_transport(t, dest),
            AnyTransport::ConstrainedType(t) => render_constrained_type_transport(t, dest),
            AnyTransport::ContinueStatement(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::DecoratedDefinition(t) => render_decorated_definition_transport(t, dest),
            AnyTransport::Decorator(t) => render_decorator_transport(t, dest),
            AnyTransport::DefaultParameter(t) => render_default_parameter_transport(t, dest),
            AnyTransport::DeleteStatement(t) => render_delete_statement_transport(t, dest),
            AnyTransport::DictPattern(t) => render_dict_pattern_transport(t, dest),
            AnyTransport::Dictionary(t) => render_dictionary_transport(t, dest),
            AnyTransport::DictionaryComprehension(t) => render_dictionary_comprehension_transport(t, dest),
            AnyTransport::DictionarySplat(t) => render_dictionary_splat_transport(t, dest),
            AnyTransport::DictionarySplatPattern(t) => render_dictionary_splat_pattern_transport(t, dest),
            AnyTransport::DottedName(t) => render_dotted_name_transport(t, dest),
            AnyTransport::ElifClause(t) => render_elif_clause_transport(t, dest),
            AnyTransport::Ellipsis2(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::ElseClause(t) => render_else_clause_transport(t, dest),
            AnyTransport::EscapeSequence(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::ExceptClause(t) => render_except_clause_transport(t, dest),
            AnyTransport::ExecStatement(t) => render_exec_statement_transport(t, dest),
            AnyTransport::ExpressionList(t) => render_expression_list_transport(t, dest),
            AnyTransport::ExpressionStatementTuple(t) => render_expression_statement_tuple_transport(t, dest),
            AnyTransport::ExpressionStatement(t) => render_expression_statement_transport(t, dest),
            AnyTransport::False(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::FinallyClause(t) => render_finally_clause_transport(t, dest),
            AnyTransport::Float(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::ForInClause(t) => render_for_in_clause_transport(t, dest),
            AnyTransport::ForStatement(t) => render_for_statement_transport(t, dest),
            AnyTransport::FormatSpecifier(t) => render_format_specifier_transport(t, dest),
            AnyTransport::FunctionDefinition(t) => render_function_definition_transport(t, dest),
            AnyTransport::FutureImportStatement(t) => render_future_import_statement_transport(t, dest),
            AnyTransport::GeneratorExpression(t) => render_generator_expression_transport(t, dest),
            AnyTransport::GenericType(t) => render_generic_type_transport(t, dest),
            AnyTransport::GlobalStatement(t) => render_global_statement_transport(t, dest),
            AnyTransport::Identifier(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::IfClause(t) => render_if_clause_transport(t, dest),
            AnyTransport::IfStatement(t) => render_if_statement_transport(t, dest),
            AnyTransport::ImportFromStatement(t) => render_import_from_statement_transport(t, dest),
            AnyTransport::ImportPrefix(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::ImportStatement(t) => render_import_statement_transport(t, dest),
            AnyTransport::Integer(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Interpolation(t) => render_interpolation_transport(t, dest),
            AnyTransport::KeywordArgument(t) => render_keyword_argument_transport(t, dest),
            AnyTransport::KeywordPattern(t) => render_keyword_pattern_transport(t, dest),
            AnyTransport::KeywordSeparator(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Lambda(t) => render_lambda_transport(t, dest),
            AnyTransport::LambdaParameters(t) => render_lambda_parameters_transport(t, dest),
            AnyTransport::LambdaWithinForInClause(t) => render_lambda_within_for_in_clause_transport(t, dest),
            AnyTransport::LineContinuation(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::List(t) => render_list_transport(t, dest),
            AnyTransport::ListComprehension(t) => render_list_comprehension_transport(t, dest),
            AnyTransport::ListPattern(t) => render_list_pattern_transport(t, dest),
            AnyTransport::ListSplat(t) => render_list_splat_transport(t, dest),
            AnyTransport::ListSplatPattern(t) => render_list_splat_pattern_transport(t, dest),
            AnyTransport::MatchStatement(t) => render_match_statement_transport(t, dest),
            AnyTransport::MemberType(t) => render_member_type_transport(t, dest),
            AnyTransport::Module(t) => render_module_transport(t, dest),
            AnyTransport::NamedExpression(t) => render_named_expression_transport(t, dest),
            AnyTransport::None(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::NonlocalStatement(t) => render_nonlocal_statement_transport(t, dest),
            AnyTransport::NotOperator(t) => render_not_operator_transport(t, dest),
            AnyTransport::Pair(t) => render_pair_transport(t, dest),
            AnyTransport::Parameters(t) => render_parameters_transport(t, dest),
            AnyTransport::ParenthesizedExpression(t) => render_parenthesized_expression_transport(t, dest),
            AnyTransport::ParenthesizedListSplat(t) => render_parenthesized_list_splat_transport(t, dest),
            AnyTransport::PassStatement(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::PatternList(t) => render_pattern_list_transport(t, dest),
            AnyTransport::PositionalSeparator(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::PrintStatement(t) => render_print_statement_transport(t, dest),
            AnyTransport::RaiseStatement(t) => render_raise_statement_transport(t, dest),
            AnyTransport::RelativeImport(t) => render_relative_import_transport(t, dest),
            AnyTransport::ReturnStatement(t) => render_return_statement_transport(t, dest),
            AnyTransport::Set(t) => render_set_transport(t, dest),
            AnyTransport::SetComprehension(t) => render_set_comprehension_transport(t, dest),
            AnyTransport::Slice(t) => render_slice_transport(t, dest),
            AnyTransport::SplatPattern(t) => render_splat_pattern_transport(t, dest),
            AnyTransport::SplatType(t) => render_splat_type_transport(t, dest),
            AnyTransport::String(t) => render_string_transport(t, dest),
            AnyTransport::StringContent(t) => render_string_content_transport(t, dest),
            AnyTransport::Subscript(t) => render_subscript_transport(t, dest),
            AnyTransport::True(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::TryStatement(t) => render_try_statement_transport(t, dest),
            AnyTransport::Tuple(t) => render_tuple_transport(t, dest),
            AnyTransport::TuplePattern(t) => render_tuple_pattern_transport(t, dest),
            AnyTransport::Type(t) => render_type_transport(t, dest),
            AnyTransport::TypeAliasStatement(t) => render_type_alias_statement_transport(t, dest),
            AnyTransport::TypeConversion(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::TypeParameter(t) => render_type_parameter_transport(t, dest),
            AnyTransport::TypedDefaultParameter(t) => render_typed_default_parameter_transport(t, dest),
            AnyTransport::TypedParameter(t) => render_typed_parameter_transport(t, dest),
            AnyTransport::UnaryOperator(t) => render_unary_operator_transport(t, dest),
            AnyTransport::UnionPattern(t) => render_union_pattern_transport(t, dest),
            AnyTransport::UnionType(t) => render_union_type_transport(t, dest),
            AnyTransport::WhileStatement(t) => render_while_statement_transport(t, dest),
            AnyTransport::WildcardImport(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::WithClauseBare(t) => render_with_clause_bare_transport(t, dest),
            AnyTransport::WithClauseParen(t) => render_with_clause_paren_transport(t, dest),
            AnyTransport::WithClause(t) => render_with_clause_transport(t, dest),
            AnyTransport::WithItem(t) => render_with_item_transport(t, dest),
            AnyTransport::WithStatement(t) => render_with_statement_transport(t, dest),
            AnyTransport::Yield(t) => render_yield_transport(t, dest),
            AnyTransport::Newline(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Indent(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Dedent(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::StringStart(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::_StringContent(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::EscapeInterpolation(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::StringEnd(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::CloseBracket(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::CloseParen(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::CloseBrace(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Except(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::As(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Eq(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Colon(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Async(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Bracket(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::TokBs(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Minus(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Paren(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Comma(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Assert(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Dot(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Break(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Case(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Shr(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Class(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::If(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Else(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Continue(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::At(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Del(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Brace(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Starstar(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Elif(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Ellipsis(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Star(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Exec(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::In(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::False2(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Finally(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::For(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Def(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Arrow(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::From(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::FutureU(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Import(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Global(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Match(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Coloneq(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::None2(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Nonlocal(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Not(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Pass(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Slash(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Print(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Raise(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Return(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Anonymous(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::True2(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Try(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Pipe(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::While(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::With(t) => dest.write_str(&t.text).map_err(::askama::Error::from),
            AnyTransport::Literal0_3c => dest.write_str("<").map_err(::askama::Error::from),
            AnyTransport::Literal1_3c_3d => dest.write_str("<=").map_err(::askama::Error::from),
            AnyTransport::Literal2_3d_3d => dest.write_str("==").map_err(::askama::Error::from),
            AnyTransport::Literal3_21_3d => dest.write_str("!=").map_err(::askama::Error::from),
            AnyTransport::Literal4_3e_3d => dest.write_str(">=").map_err(::askama::Error::from),
            AnyTransport::Literal5_3e => dest.write_str(">").map_err(::askama::Error::from),
            AnyTransport::Literal6_3c_3e => dest.write_str("<>").map_err(::askama::Error::from),
            AnyTransport::Literal7_6e_6f_74_20_69_6e => dest.write_str("not in").map_err(::askama::Error::from),
            AnyTransport::Literal8_69_73 => dest.write_str("is").map_err(::askama::Error::from),
            AnyTransport::Literal9_69_73_20_6e_6f_74 => dest.write_str("is not").map_err(::askama::Error::from),
        }
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
    node_handle: Option<u32>,
    child_index: Option<u16>,
    fields: Option<TransportHashMap<String, TransportFieldValue>>,
    children: Option<Vec<TransportNodeData>>,
    trivia_data: Option<::sittir_core::types::NodeTrivia>,
) -> TransportNodeData {
    TransportNodeData {
        type_: kind,
        source: source.unwrap_or(TransportSource::Factory),
        named: named.unwrap_or(default_named),
        fields,
        children,
        text,
        span,
        node_handle,
        child_index,
        trivia_data,
    }
}

fn transport_field_value(value: AnyTransport) -> Result<TransportFieldValue, ::askama::Error> {
    let node = transport_to_node(value)?;
    if !node.named {
        if let Some(text) = node.text {
            return Ok(TransportFieldValue::Text(text));
        }
    }
    Ok(TransportFieldValue::Single(Box::new(node)))
}

fn transport_field_values(values: Vec<AnyTransport>) -> Result<TransportFieldValue, ::askama::Error> {
    let mut nodes = Vec::with_capacity(values.len());
    for value in values {
        nodes.push(transport_to_node(value)?);
    }
    Ok(TransportFieldValue::Multiple(nodes))
}

fn transport_children(values: Vec<AnyTransport>) -> Result<Vec<TransportNodeData>, ::askama::Error> {
    let mut nodes = Vec::with_capacity(values.len());
    for value in values {
        nodes.push(transport_to_node(value)?);
    }
    Ok(nodes)
}

fn transport_to_node(transport: AnyTransport) -> Result<TransportNodeData, ::askama::Error> {
    match transport {
        AnyTransport::_AsPattern(data) => transport_to_node__as_pattern(data),
        AnyTransport::AssignmentEq(data) => transport_to_node_assignment_eq(data),
        AnyTransport::AssignmentType(data) => transport_to_node_assignment_type(data),
        AnyTransport::AssignmentTyped(data) => transport_to_node_assignment_typed(data),
        AnyTransport::AsyncMarker(data) => transport_to_node_async_marker(data),
        AnyTransport::AugmentedAssignmentOperator(data) => transport_to_node_augmented_assignment_operator(data),
        AnyTransport::BinaryOperatorOperator(data) => transport_to_node_binary_operator_operator(data),
        AnyTransport::BooleanOperatorOperator(data) => transport_to_node_boolean_operator_operator(data),
        AnyTransport::ComprehensionClauses(data) => transport_to_node_comprehension_clauses(data),
        AnyTransport::_Identifier(data) => transport_to_node__identifier(data),
        AnyTransport::ImportList(data) => transport_to_node_import_list(data),
        AnyTransport::IsNot(data) => transport_to_node_is_not(data),
        AnyTransport::KeyValuePattern(data) => transport_to_node_key_value_pattern(data),
        AnyTransport::KwAsyncMarker(data) => transport_to_node_kw_async_marker(data),
        AnyTransport::KwType(data) => transport_to_node_kw_type(data),
        AnyTransport::_ListPattern(data) => transport_to_node__list_pattern(data),
        AnyTransport::MatchBlock(data) => transport_to_node_match_block(data),
        AnyTransport::MatchBlockBlock(data) => transport_to_node_match_block_block(data),
        AnyTransport::NotEscapeSequence(data) => transport_to_node_not_escape_sequence(data),
        AnyTransport::NotIn(data) => transport_to_node_not_in(data),
        AnyTransport::SimplePatternNegative(data) => transport_to_node_simple_pattern_negative(data),
        AnyTransport::SimpleStatements(data) => transport_to_node_simple_statements(data),
        AnyTransport::Suite(data) => transport_to_node_suite(data),
        AnyTransport::_TuplePattern(data) => transport_to_node__tuple_pattern(data),
        AnyTransport::TypeAliasStatementType(data) => transport_to_node_type_alias_statement_type(data),
        AnyTransport::UnaryOperatorOperator(data) => transport_to_node_unary_operator_operator(data),
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
        AnyTransport::Break(data) => transport_to_node_break(data),
        AnyTransport::Case(data) => transport_to_node_case(data),
        AnyTransport::Shr(data) => transport_to_node_shr(data),
        AnyTransport::Class(data) => transport_to_node_class(data),
        AnyTransport::If(data) => transport_to_node_if(data),
        AnyTransport::Else(data) => transport_to_node_else(data),
        AnyTransport::Continue(data) => transport_to_node_continue(data),
        AnyTransport::At(data) => transport_to_node_at(data),
        AnyTransport::Del(data) => transport_to_node_del(data),
        AnyTransport::Brace(data) => transport_to_node_brace(data),
        AnyTransport::Starstar(data) => transport_to_node_starstar(data),
        AnyTransport::Elif(data) => transport_to_node_elif(data),
        AnyTransport::Ellipsis(data) => transport_to_node_ellipsis(data),
        AnyTransport::Star(data) => transport_to_node_star(data),
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
        AnyTransport::Slash(data) => transport_to_node_slash(data),
        AnyTransport::Print(data) => transport_to_node_print(data),
        AnyTransport::Raise(data) => transport_to_node_raise(data),
        AnyTransport::Return(data) => transport_to_node_return(data),
        AnyTransport::Anonymous(data) => transport_to_node_anonymous(data),
        AnyTransport::True2(data) => transport_to_node_true2(data),
        AnyTransport::Try(data) => transport_to_node_try(data),
        AnyTransport::Pipe(data) => transport_to_node_pipe(data),
        AnyTransport::While(data) => transport_to_node_while(data),
        AnyTransport::With(data) => transport_to_node_with(data),
        AnyTransport::Literal0_3c => Ok(transport_node_data(TransportKindId(65) /* "<" */, None, None, false, Some("<".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal1_3c_3d => Ok(transport_node_data(TransportKindId(66) /* "<=" */, None, None, false, Some("<=".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal2_3d_3d => Ok(transport_node_data(TransportKindId(67) /* "==" */, None, None, false, Some("==".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal3_21_3d => Ok(transport_node_data(TransportKindId(68) /* "!=" */, None, None, false, Some("!=".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal4_3e_3d => Ok(transport_node_data(TransportKindId(69) /* ">=" */, None, None, false, Some(">=".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal5_3e => Ok(transport_node_data(TransportKindId(70) /* ">" */, None, None, false, Some(">".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal6_3c_3e => Ok(transport_node_data(TransportKindId(71) /* "<>" */, None, None, false, Some("<>".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal7_6e_6f_74_20_69_6e => Ok(transport_node_data(TransportKindId(193) /* "not in" */, None, None, false, Some("not in".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal8_69_73 => Ok(transport_node_data(TransportKindId(64) /* "is" */, None, None, false, Some("is".to_string()), None, None, None, None, None, None)),
        AnyTransport::Literal9_69_73_20_6e_6f_74 => Ok(transport_node_data(TransportKindId(194) /* "is not" */, None, None, false, Some("is not".to_string()), None, None, None, None, None, None)),
    }
}

fn transport_to_node__as_pattern(transport: _AsPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![_as_pattern_child_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(165) /* "_as_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assignment_eq(transport: AssignmentEqTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("right".to_string(), transport_field_value(right_hand_side_transport_to_any(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(240) /* "_assignment_eq" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assignment_type(transport: AssignmentTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(AnyTransport::Type(transport.r#type))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(241) /* "_assignment_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assignment_typed(transport: AssignmentTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(AnyTransport::Type(transport.r#type))?);
    fields.insert("right".to_string(), transport_field_value(right_hand_side_transport_to_any(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(242) /* "_assignment_typed" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_async_marker(transport: bool) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_async_marker" — no parser symbol */,
        None,
        None,
        true,
        Some(if transport { "async".to_string() } else { String::new() }),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_augmented_assignment_operator(transport: AugmentedAssignmentOperatorEnum) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_augmented_assignment_operator" — no parser symbol */,
        None,
        None,
        true,
        Some(transport.to_string()),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_binary_operator_operator(transport: bool) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_binary_operator_operator" — no parser symbol */,
        None,
        None,
        true,
        Some(if transport { "+".to_string() } else { String::new() }),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_boolean_operator_operator(transport: bool) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_boolean_operator_operator" — no parser symbol */,
        None,
        None,
        true,
        Some(if transport { "and".to_string() } else { String::new() }),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_comprehension_clauses(transport: ComprehensionClausesTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| comprehension_clauses_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(224) /* "_comprehension_clauses" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node__identifier(transport: _IdentifierEnum) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_identifier" — no parser symbol */,
        None,
        None,
        true,
        Some(transport.to_string()),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_import_list(transport: ImportListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(116) /* "_import_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_is_not(transport: IsNotTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(194) /* "_is_not" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_key_value_pattern(transport: KeyValuePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("key".to_string(), transport_field_value(simple_pattern_transport_to_any(transport.key))?);
    fields.insert("value".to_string(), transport_field_value(AnyTransport::CasePattern(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(170) /* "_key_value_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_kw_async_marker(transport: KwAsyncMarkerTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(250) /* "_kw_async_marker" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_kw_type(transport: KwTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(251) /* "_kw_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node__list_pattern(transport: _ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::CasePattern(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(167) /* "_list_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_match_block(transport: MatchBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::MatchBlockBlock(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(135) /* "_match_block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_match_block_block(transport: MatchBlockBlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("alternative".to_string(), transport_field_values(transport.alternative.into_iter().map(|v| AnyTransport::CaseClause(v)).collect::<Vec<_>>())?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(246) /* "_match_block_block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_not_escape_sequence(transport: NotEscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(235) /* "_not_escape_sequence" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_not_in(transport: NotInTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(193) /* "_not_in" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_simple_pattern_negative(transport: SimplePatternNegativeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![primary_expression_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(248) /* "_simple_pattern_negative" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_simple_statements(transport: SimpleStatementsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| simple_statement_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(110) /* "_simple_statements" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_suite(transport: SuiteTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![suite_child_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(0) /* "_suite" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node__tuple_pattern(transport: _TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::CasePattern(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(168) /* "_tuple_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_type_alias_statement_type(transport: bool) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_type_alias_statement_type" — no parser symbol */,
        None,
        None,
        true,
        Some(if transport { "type".to_string() } else { String::new() }),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node_unary_operator_operator(transport: UnaryOperatorOperatorEnum) -> Result<TransportNodeData, ::askama::Error> {
    Ok(transport_node_data(
        TransportKindId(0) /* "_unary_operator_operator" — no parser symbol */,
        None,
        None,
        true,
        Some(transport.to_string()),
        None,
        None,
        None,
        None,
        None,
        None,
    ))
}

fn transport_to_node__with_clause_paren(transport: _WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::WithItem(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(245) /* "_with_clause_paren" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_aliased_import(transport: AliasedImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(AnyTransport::DottedName(transport.name))?);
    fields.insert("alias".to_string(), transport_field_value(AnyTransport::Identifier(transport.alias))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(117) /* "aliased_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_argument_list(transport: ArgumentListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(c) => Some(transport_children(c.into_iter().map(|v| argument_list_child_transport_to_any(v)).collect::<Vec<_>>())?),
        None => None,
    };
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(157) /* "argument_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_as_pattern(transport: AsPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    fields.insert("alias".to_string(), transport_field_value(*transport.alias)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(185) /* "as_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assert_statement(transport: AssertStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(121) /* "assert_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
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
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::AssignmentEq(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assignment_uform_type(transport: AssignmentUFormTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::AssignmentType(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_assignment_uform_typed(transport: AssignmentUFormTypedTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::AssignmentTyped(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(198) /* "assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_attribute(transport: AttributeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("object".to_string(), transport_field_value(primary_expression_transport_to_any(transport.object))?);
    fields.insert("attribute".to_string(), transport_field_value(AnyTransport::Identifier(transport.attribute))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(203) /* "attribute" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_augmented_assignment(transport: AugmentedAssignmentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    fields.insert("operator".to_string(), transport_field_value(AnyTransport::AugmentedAssignmentOperator(transport.operator))?);
    fields.insert("right".to_string(), transport_field_value(right_hand_side_transport_to_any(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(199) /* "augmented_assignment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_await(transport: AwaitTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("primary_expression".to_string(), transport_field_value(primary_expression_transport_to_any(transport.primary_expression))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(237) /* "await" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_binary_operator(transport: BinaryOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(primary_expression_transport_to_any(transport.left))?);
    fields.insert("operator".to_string(), transport_field_value(AnyTransport::BinaryOperatorOperator(transport.operator))?);
    fields.insert("right".to_string(), transport_field_value(primary_expression_transport_to_any(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(191) /* "binary_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_block(transport: BlockTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| statement_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(160) /* "block" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_boolean_operator(transport: BooleanOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(expression_transport_to_any(transport.left))?);
    fields.insert("operator".to_string(), transport_field_value(AnyTransport::BooleanOperatorOperator(transport.operator))?);
    fields.insert("right".to_string(), transport_field_value(expression_transport_to_any(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(190) /* "boolean_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_break_statement(transport: BreakStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(129) /* "break_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_call(transport: CallTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("function".to_string(), transport_field_value(primary_expression_transport_to_any(transport.function))?);
    fields.insert("arguments".to_string(), transport_field_value(*transport.arguments)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(206) /* "call" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_case_clause(transport: CaseClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.guard {
        fields.insert("guard".to_string(), transport_field_value(AnyTransport::IfClause(value))?);
    }
    fields.insert("consequence".to_string(), transport_field_value(AnyTransport::Suite(transport.consequence))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::CasePattern(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(136) /* "case_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_case_pattern(transport: CasePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![case_pattern_child_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(163) /* "case_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_chevron(transport: ChevronTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(120) /* "chevron" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_class_definition(transport: ClassDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(AnyTransport::Identifier(transport.name))?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(AnyTransport::TypeParameter(value))?);
    }
    if let Some(value) = transport.superclasses {
        fields.insert("superclasses".to_string(), transport_field_value(AnyTransport::ArgumentList(value))?);
    }
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(154) /* "class_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_class_pattern(transport: ClassPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("dotted_name".to_string(), transport_field_value(AnyTransport::DottedName(transport.dotted_name))?);
    fields.insert("arguments".to_string(), transport_field_values(transport.arguments.into_iter().map(|v| AnyTransport::CasePattern(v)).collect::<Vec<_>>())?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(173) /* "class_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_comment(transport: CommentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(99) /* "comment" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_comparison_operator(transport: ComparisonOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(primary_expression_transport_to_any(transport.left))?);
    fields.insert("operators".to_string(), transport_field_values(transport.operators)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| primary_expression_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(195) /* "comparison_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_complex_pattern(transport: ComplexPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.real {
        fields.insert("real".to_string(), transport_field_value(*value)?);
    }
    fields.insert("imaginary".to_string(), transport_field_value(primary_expression_transport_to_any(transport.imaginary))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![primary_expression_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(174) /* "complex_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_concatenated_string(transport: ConcatenatedStringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::String(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(230) /* "concatenated_string" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_conditional_expression(transport: ConditionalExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(expression_transport_to_any(transport.body))?);
    fields.insert("condition".to_string(), transport_field_value(expression_transport_to_any(transport.condition))?);
    fields.insert("alternative".to_string(), transport_field_value(expression_transport_to_any(transport.alternative))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(229) /* "conditional_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_constrained_type(transport: ConstrainedTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("base_type".to_string(), transport_field_value(AnyTransport::Type(transport.base_type))?);
    fields.insert("constraint".to_string(), transport_field_value(AnyTransport::Type(transport.constraint))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(212) /* "constrained_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_continue_statement(transport: ContinueStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(130) /* "continue_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_decorated_definition(transport: DecoratedDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("definition".to_string(), transport_field_value(compound_statement_transport_to_any(transport.definition))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Decorator(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(158) /* "decorated_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_decorator(transport: DecoratorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    if let Some(value) = transport.newline {
        fields.insert("newline".to_string(), transport_field_value(*value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(159) /* "decorator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_default_parameter(transport: DefaultParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(pattern_transport_to_any(transport.name))?);
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(181) /* "default_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_delete_statement(transport: DeleteStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![expressions_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(126) /* "delete_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dict_pattern(transport: DictPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| dict_pattern_kv_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(169) /* "dict_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dictionary(transport: DictionaryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| dictionary_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(218) /* "dictionary" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dictionary_comprehension(transport: DictionaryComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Pair(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::ComprehensionClauses(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(221) /* "dictionary_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dictionary_splat(transport: DictionarySplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(149) /* "dictionary_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dictionary_splat_pattern(transport: DictionarySplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![pattern_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(184) /* "dictionary_splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_dotted_name(transport: DottedNameTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Identifier(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(162) /* "dotted_name" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_elif_clause(transport: ElifClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(expression_transport_to_any(transport.condition))?);
    fields.insert("consequence".to_string(), transport_field_value(AnyTransport::Suite(transport.consequence))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(132) /* "elif_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_ellipsis2(transport: Ellipsis2Transport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(87) /* "ellipsis" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_else_clause(transport: ElseClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(133) /* "else_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_escape_sequence(transport: EscapeSequenceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(89) /* "escape_sequence" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_except_clause(transport: ExceptClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.value {
        fields.insert("value".to_string(), transport_field_values(value.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    }
    if let Some(value) = transport.alias {
        fields.insert("alias".to_string(), transport_field_value(expression_transport_to_any(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::Suite(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(140) /* "except_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_exec_statement(transport: ExecStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("code".to_string(), transport_field_value(primary_expression_transport_to_any(transport.code))?);
    if let Some(value) = transport.in_clause {
        fields.insert("in_clause".to_string(), transport_field_values(value.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(152) /* "exec_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_expression_list(transport: ExpressionListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(161) /* "expression_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_expression_statement_tuple(transport: ExpressionStatementTupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(243) /* "expression_statement_tuple" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
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
    let children = Some(transport_children(vec![*transport.children])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(122) /* "expression_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_false(transport: FalseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(97) /* "false" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_finally_clause(transport: FinallyClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("block".to_string(), transport_field_value(AnyTransport::Suite(transport.block))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(141) /* "finally_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_float(transport: FloatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(94) /* "float" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_for_in_clause(transport: ForInClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(AnyTransport::AsyncMarker(value))?);
    }
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    fields.insert("right".to_string(), transport_field_values(transport.right.into_iter().map(|v| expression_within_for_in_clause_transport_to_any(v)).collect::<Vec<_>>())?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(227) /* "for_in_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_for_statement(transport: ForStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(AnyTransport::AsyncMarker(value))?);
    }
    fields.insert("left".to_string(), transport_field_value(left_hand_side_transport_to_any(transport.left))?);
    fields.insert("right".to_string(), transport_field_value(expressions_transport_to_any(transport.right))?);
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_value(AnyTransport::ElseClause(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(137) /* "for_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_format_specifier(transport: FormatSpecifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Interpolation(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(236) /* "format_specifier" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_function_definition(transport: FunctionDefinitionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(AnyTransport::AsyncMarker(value))?);
    }
    fields.insert("name".to_string(), transport_field_value(AnyTransport::Identifier(transport.name))?);
    if let Some(value) = transport.type_parameters {
        fields.insert("type_parameters".to_string(), transport_field_value(AnyTransport::TypeParameter(value))?);
    }
    fields.insert("parameters".to_string(), transport_field_value(AnyTransport::Parameters(transport.parameters))?);
    if let Some(value) = transport.return_type {
        fields.insert("return_type".to_string(), transport_field_value(AnyTransport::Type(value))?);
    }
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(145) /* "function_definition" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_future_import_statement(transport: FutureImportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(114) /* "future_import_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_generator_expression(transport: GeneratorExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(expression_transport_to_any(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::ComprehensionClauses(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(223) /* "generator_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_generic_type(transport: GenericTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(AnyTransport::Identifier(transport.identifier))?);
    fields.insert("type_parameter".to_string(), transport_field_value(AnyTransport::TypeParameter(transport.type_parameter))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(210) /* "generic_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_global_statement(transport: GlobalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Identifier(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(150) /* "global_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_identifier(transport: IdentifierTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(1) /* "identifier" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_if_clause(transport: IfClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(228) /* "if_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_if_statement(transport: IfStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(expression_transport_to_any(transport.condition))?);
    fields.insert("consequence".to_string(), transport_field_value(AnyTransport::Suite(transport.consequence))?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_values(value)?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(131) /* "if_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_import_from_statement(transport: ImportFromStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("module_name".to_string(), transport_field_value(*transport.module_name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| import_from_statement_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(115) /* "import_from_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_import_prefix(transport: ImportPrefixTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(112) /* "import_prefix" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_import_statement(transport: ImportStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_values(transport.name)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(111) /* "import_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_integer(transport: IntegerTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(93) /* "integer" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_interpolation(transport: InterpolationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(fexpression_transport_to_any(transport.expression))?);
    if let Some(value) = transport.type_conversion {
        fields.insert("type_conversion".to_string(), transport_field_value(AnyTransport::TypeConversion(value))?);
    }
    if let Some(value) = transport.format_specifier {
        fields.insert("format_specifier".to_string(), transport_field_value(AnyTransport::FormatSpecifier(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(233) /* "interpolation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_keyword_argument(transport: KeywordArgumentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(named_expression_lhs_transport_to_any(transport.name))?);
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(214) /* "keyword_argument" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_keyword_pattern(transport: KeywordPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(AnyTransport::Identifier(transport.identifier))?);
    fields.insert("simple_pattern".to_string(), transport_field_value(simple_pattern_transport_to_any(transport.simple_pattern))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(171) /* "keyword_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_keyword_separator(transport: KeywordSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(239) /* "keyword_separator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_lambda(transport: LambdaTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.parameters {
        fields.insert("parameters".to_string(), transport_field_value(AnyTransport::LambdaParameters(value))?);
    }
    fields.insert("body".to_string(), transport_field_value(expression_transport_to_any(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(196) /* "lambda" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_lambda_parameters(transport: LambdaParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| parameter_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(147) /* "lambda_parameters" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_lambda_within_for_in_clause(transport: LambdaWithinForInClauseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.parameters {
        fields.insert("parameters".to_string(), transport_field_value(AnyTransport::LambdaParameters(value))?);
    }
    fields.insert("body".to_string(), transport_field_value(expression_within_for_in_clause_transport_to_any(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(197) /* "lambda_within_for_in_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_line_continuation(transport: LineContinuationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(100) /* "line_continuation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_list(transport: ListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| list_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(215) /* "list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_list_comprehension(transport: ListComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(expression_transport_to_any(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::ComprehensionClauses(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(220) /* "list_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_list_pattern(transport: ListPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| pattern_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(180) /* "list_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_list_splat(transport: ListSplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("expression".to_string(), transport_field_value(expression_transport_to_any(transport.expression))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(148) /* "list_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_list_splat_pattern(transport: ListSplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![pattern_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(183) /* "list_splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_match_statement(transport: MatchStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("subject".to_string(), transport_field_values(transport.subject.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    fields.insert("body".to_string(), transport_field_value(AnyTransport::MatchBlock(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(134) /* "match_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_member_type(transport: MemberTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("base_type".to_string(), transport_field_value(AnyTransport::Type(transport.base_type))?);
    fields.insert("identifier".to_string(), transport_field_value(AnyTransport::Identifier(transport.identifier))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(213) /* "member_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_module(transport: ModuleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| statement_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(108) /* "module" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_named_expression(transport: NamedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(named_expression_lhs_transport_to_any(transport.name))?);
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(123) /* "named_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_none(transport: NoneTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(98) /* "none" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_nonlocal_statement(transport: NonlocalStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Identifier(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(151) /* "nonlocal_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_not_operator(transport: NotOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("argument".to_string(), transport_field_value(expression_transport_to_any(transport.argument))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(189) /* "not_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_pair(transport: PairTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("key".to_string(), transport_field_value(expression_transport_to_any(transport.key))?);
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(219) /* "pair" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_parameters(transport: ParametersTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| parameter_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(146) /* "parameters" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_parenthesized_expression(transport: ParenthesizedExpressionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![fexpression_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(225) /* "parenthesized_expression" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_parenthesized_list_splat(transport: ParenthesizedListSplatTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![parenthesized_list_splat_child_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(156) /* "parenthesized_list_splat" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_pass_statement(transport: PassStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(128) /* "pass_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_pattern_list(transport: PatternListTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| pattern_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(200) /* "pattern_list" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_positional_separator(transport: PositionalSeparatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(238) /* "positional_separator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_print_statement(transport: PrintStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("argument".to_string(), transport_field_values(transport.argument.into_iter().map(|v| expression_transport_to_any(v)).collect::<Vec<_>>())?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(c) => Some(transport_children(vec![AnyTransport::Chevron(c)])?),
        None => None,
    };
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(119) /* "print_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_raise_statement(transport: RaiseStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.cause {
        fields.insert("cause".to_string(), transport_field_value(expression_transport_to_any(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(c) => Some(transport_children(vec![expressions_transport_to_any(c)])?),
        None => None,
    };
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(127) /* "raise_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_relative_import(transport: RelativeImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("import_prefix".to_string(), transport_field_value(AnyTransport::ImportPrefix(transport.import_prefix))?);
    if let Some(value) = transport.dotted_name {
        fields.insert("dotted_name".to_string(), transport_field_value(AnyTransport::DottedName(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(113) /* "relative_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_return_statement(transport: ReturnStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(c) => Some(transport_children(vec![expressions_transport_to_any(c)])?),
        None => None,
    };
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(125) /* "return_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_set(transport: SetTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| set_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(216) /* "set" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_set_comprehension(transport: SetComprehensionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(expression_transport_to_any(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::ComprehensionClauses(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(222) /* "set_comprehension" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_slice(transport: SliceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.start {
        fields.insert("start".to_string(), transport_field_value(expression_transport_to_any(value))?);
    }
    if let Some(value) = transport.stop {
        fields.insert("stop".to_string(), transport_field_value(expression_transport_to_any(value))?);
    }
    if let Some(value) = transport.step {
        fields.insert("step".to_string(), transport_field_value(expression_transport_to_any(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(205) /* "slice" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_splat_pattern(transport: SplatPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(*transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(172) /* "splat_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_splat_type(transport: SplatTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("identifier".to_string(), transport_field_value(*transport.identifier)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(209) /* "splat_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_string(transport: StringTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("string_start".to_string(), transport_field_value(AnyTransport::StringStart(transport.string_start))?);
    fields.insert("content".to_string(), transport_field_values(transport.content)?);
    fields.insert("string_end".to_string(), transport_field_value(AnyTransport::StringEnd(transport.string_end))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(231) /* "string" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_string_content(transport: StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| string_content_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(232) /* "string_content" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_subscript(transport: SubscriptTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(primary_expression_transport_to_any(transport.value))?);
    fields.insert("subscript".to_string(), transport_field_values(transport.subscript)?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(204) /* "subscript" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_true(transport: TrueTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(96) /* "true" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_try_statement(transport: TryStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    fields.insert("except_clauses".to_string(), transport_field_values(transport.except_clauses.into_iter().map(|v| AnyTransport::ExceptClause(v)).collect::<Vec<_>>())?);
    if let Some(value) = transport.else_clause {
        fields.insert("else_clause".to_string(), transport_field_value(AnyTransport::ElseClause(value))?);
    }
    if let Some(value) = transport.finally_clause {
        fields.insert("finally_clause".to_string(), transport_field_value(AnyTransport::FinallyClause(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(139) /* "try_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_tuple(transport: TupleTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| tuple_child_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(217) /* "tuple" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_tuple_pattern(transport: TuplePatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| pattern_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(179) /* "tuple_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_type(transport: TypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![type_child_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(208) /* "type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_type_alias_statement(transport: TypeAliasStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(AnyTransport::TypeAliasStatementType(transport.r#type))?);
    fields.insert("left".to_string(), transport_field_value(AnyTransport::Type(transport.left))?);
    fields.insert("right".to_string(), transport_field_value(AnyTransport::Type(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(153) /* "type_alias_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_type_conversion(transport: TypeConversionTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(92) /* "type_conversion" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_type_parameter(transport: TypeParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::Type(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(155) /* "type_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_typed_default_parameter(transport: TypedDefaultParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("name".to_string(), transport_field_value(AnyTransport::Identifier(transport.name))?);
    fields.insert("type".to_string(), transport_field_value(AnyTransport::Type(transport.r#type))?);
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(182) /* "typed_default_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_typed_parameter(transport: TypedParameterTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("type".to_string(), transport_field_value(AnyTransport::Type(transport.r#type))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![parameter_transport_to_any(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(207) /* "typed_parameter" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_unary_operator(transport: UnaryOperatorTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("operator".to_string(), transport_field_value(AnyTransport::UnaryOperatorOperator(transport.operator))?);
    fields.insert("argument".to_string(), transport_field_value(primary_expression_transport_to_any(transport.argument))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(192) /* "unary_operator" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_union_pattern(transport: UnionPatternTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| simple_pattern_transport_to_any(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(166) /* "union_pattern" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_union_type(transport: UnionTypeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("left".to_string(), transport_field_value(AnyTransport::Type(transport.left))?);
    fields.insert("right".to_string(), transport_field_value(AnyTransport::Type(transport.right))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(211) /* "union_type" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_while_statement(transport: WhileStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("condition".to_string(), transport_field_value(expression_transport_to_any(transport.condition))?);
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    if let Some(value) = transport.alternative {
        fields.insert("alternative".to_string(), transport_field_value(AnyTransport::ElseClause(value))?);
    }
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(138) /* "while_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_wildcard_import(transport: WildcardImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(118) /* "wildcard_import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_with_clause_bare(transport: WithClauseBareTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::WithItem(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(244) /* "with_clause_bare" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_with_clause_paren(transport: WithClauseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(transport.children.into_iter().map(|v| AnyTransport::WithItem(v)).collect::<Vec<_>>())?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(245) /* "with_clause_paren" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
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
    let children = Some(transport_children(vec![*transport.children])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(143) /* "with_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_with_clause_uform_paren(transport: WithClauseUFormParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = Some(transport_children(vec![AnyTransport::_WithClauseParen(transport.children)])?);
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(143) /* "with_clause" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_with_item(transport: WithItemTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    fields.insert("value".to_string(), transport_field_value(expression_transport_to_any(transport.value))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(144) /* "with_item" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_with_statement(transport: WithStatementTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    if let Some(value) = transport.async_marker {
        fields.insert("async_marker".to_string(), transport_field_value(AnyTransport::AsyncMarker(value))?);
    }
    fields.insert("with_clause".to_string(), transport_field_value(*transport.with_clause)?);
    fields.insert("body".to_string(), transport_field_value(AnyTransport::Suite(transport.body))?);
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = None;
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(142) /* "with_statement" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_yield(transport: YieldTransport) -> Result<TransportNodeData, ::askama::Error> {
    let mut fields = TransportHashMap::new();
    let fields = if fields.is_empty() { None } else { Some(fields) };
    let children = match transport.children {
        Some(c) => Some(transport_children(vec![*c])?),
        None => None,
    };
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(202) /* "yield" */,
        transport.transport_source,
        transport.transport_named,
        true,
        transport.transport_text,
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        fields,
        children,
        trivia_data,
    ))
}

fn transport_to_node_newline(transport: NewlineTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(101) /* "_newline" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_indent(transport: IndentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(102) /* "_indent" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_dedent(transport: DedentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(103) /* "_dedent" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_string_start(transport: StringStartTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(104) /* "string_start" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node__string_content(transport: _StringContentTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(105) /* "_string_content" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_escape_interpolation(transport: EscapeInterpolationTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(106) /* "escape_interpolation" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_string_end(transport: StringEndTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(107) /* "string_end" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_close_bracket(transport: CloseBracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(46) /* "]" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_close_paren(transport: CloseParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(8) /* ")" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_close_brace(transport: CloseBraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(51) /* "}" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_except(transport: ExceptTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(33) /* "except" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_as(transport: AsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(10) /* "as" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_eq(transport: EqTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(43) /* "=" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_colon(transport: ColonTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(23) /* ":" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_async(transport: AsyncTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(28) /* "async" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_bracket(transport: BracketTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(45) /* "[" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_tok_bs(transport: TokBsTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(90) /* "\\" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_minus(transport: MinusTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(53) /* "-" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_paren(transport: ParenTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(7) /* "(" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_comma(transport: CommaTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(9) /* "," */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_assert(transport: AssertTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(14) /* "assert" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_dot(transport: DotTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(4) /* "." */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_break(transport: BreakTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(20) /* "break" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_case(transport: CaseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(27) /* "case" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_shr(transport: ShrTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(13) /* ">>" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_class(transport: ClassTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(44) /* "class" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_if(transport: IfTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(22) /* "if" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_else(transport: ElseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(25) /* "else" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_continue(transport: ContinueTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(21) /* "continue" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_at(transport: AtTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(47) /* "@" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_del(transport: DelTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(17) /* "del" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_brace(transport: BraceTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(50) /* "{" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_starstar(transport: StarstarTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(39) /* "**" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_elif(transport: ElifTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(24) /* "elif" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_ellipsis(transport: EllipsisTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(0) /* "..." — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_star(transport: StarTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(11) /* "*" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_exec(transport: ExecTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(42) /* "exec" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_in(transport: InTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(30) /* "in" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_false2(transport: False2Transport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(0) /* "False" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_finally(transport: FinallyTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(35) /* "finally" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_for(transport: ForTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(29) /* "for" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_def(transport: DefTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(37) /* "def" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_arrow(transport: ArrowTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(38) /* "->" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_from(transport: FromTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(5) /* "from" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_future_u(transport: FutureUTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(6) /* "__future__" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_import(transport: ImportTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(3) /* "import" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_global(transport: GlobalTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(40) /* "global" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_match(transport: MatchTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(26) /* "match" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_coloneq(transport: ColoneqTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(15) /* ":=" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_none2(transport: None2Transport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(0) /* "None" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_nonlocal(transport: NonlocalTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(41) /* "nonlocal" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_not(transport: NotTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(54) /* "not" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_pass(transport: PassTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(19) /* "pass" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_slash(transport: SlashTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(57) /* "/" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_print(transport: PrintTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(12) /* "print" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_raise(transport: RaiseTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(18) /* "raise" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_return(transport: ReturnTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(16) /* "return" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_anonymous(transport: AnonymousTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(48) /* "_" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_true2(transport: True2Transport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(0) /* "True" — no parser symbol */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_try(transport: TryTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(32) /* "try" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_pipe(transport: PipeTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(49) /* "|" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_while(transport: WhileTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(31) /* "while" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
    ))
}

fn transport_to_node_with(transport: WithTransport) -> Result<TransportNodeData, ::askama::Error> {
    let trivia_data = transport.transport_trivia_data.and_then(|v| ::serde_json::from_value::<::sittir_core::types::NodeTrivia>(v).ok());
    Ok(transport_node_data(
        TransportKindId(36) /* "with" */,
        transport.transport_source,
        transport.transport_named,
        true,
        Some(transport.text),
        transport.transport_span,
        transport.transport_node_handle.map(|v| v as u32),
        transport.transport_child_index.map(|v| v as u16),
        None,
        None,
        trivia_data,
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
        return Ok(text.to_owned());
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
                FieldValue::Text(text) => parts.push(text.to_owned()),
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
        Some(FieldValue::Text(text)) => Ok((!text.is_empty()).then(|| text.to_owned())),
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
        Some(FieldValue::Text(text)) => Ok(ResolvedField::from_scalar(text.to_owned())),
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
            return Ok(text.to_owned());
        }
        let mut parts = Vec::new();
        if let Some(fields) = &node.fields {
            for value in fields.values() {
                match value {
                    FieldValue::Single(item) => {
                        if let Some(text) = &item.text {
                            parts.push(text.to_owned());
                        }
                    }
                    FieldValue::Multiple(items) => {
                        for item in items {
                            if let Some(text) = &item.text {
                                parts.push(text.to_owned());
                            }
                        }
                    }
                    FieldValue::Text(text) => parts.push(text.to_owned()),
                }
            }
        }
        if let Some(children) = &node.children {
            for child in children {
                if let Some(text) = &child.text {
                    parts.push(text.to_owned());
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
            return Ok(text.to_owned());
        }
    }
    match node.type_.0 {
        165 | 185 => render_hidden_as_pattern(node), // "_as_pattern" | "as_pattern"
        240 => render_hidden_assignment_eq(node), // "_assignment_eq" | "assignment_eq"
        241 => render_hidden_assignment_type(node), // "_assignment_type" | "assignment_type"
        242 => render_hidden_assignment_typed(node), // "_assignment_typed" | "assignment_typed"
        224 => render_hidden_comprehension_clauses(node), // "_comprehension_clauses"
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

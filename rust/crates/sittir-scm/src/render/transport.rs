// @generated from packages/scm/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
//
// Per-kind view structs and render bodies, AnyTransport enum + FromNapiValue
// impls + per-kind transport structs + typed dispatch
// (render_transport_dispatch) + transport bridge helpers.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]

use ::sittir_core::view::{KindOf, KindTest, View, ListView, NO_ITEMS};
use ::sittir_core::render::Render;
use ::sittir_core::types::{
    FieldValue, OneOrMany, Source, Span, NodeTrivia,
};

#[cfg(feature = "napi-bindings")]
use ::napi_derive::napi;

use ::sittir_core::render_with_trivia;
use ::sittir_core::options::Edged as _;
use super::options;

#[derive(Debug, Clone)]
pub enum AnyTransport {
    Program(ProgramTransport),
    EscapeSequence(EscapeSequenceTransport),
    Quantifier(QuantifierEnum),
    Identifier(IdentifierTransport),
    ImmediateIdentifier(ImmediateIdentifierTransport),
    Capture(CaptureTransport),
    String(StringTransport),
    ImmediateString(ImmediateStringTransport),
    StringContent(StringContentTransport),
    Parameters(ParametersTransport),
    Comment(CommentTransport),
    List(ListTransport),
    Grouping(GroupingTransport),
    MissingNode(MissingNodeTransport),
    AnonymousNode(AnonymousNodeTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    Predicate(PredicateTransport),
    PredicateType(PredicateTypeEnum),
    ListElementQuantifier(ListElementQuantifierTransport),
    GroupExpressionArm(GroupExpressionArmTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
    GroupingGroup(GroupingGroupTransport),
    StringContentText(StringContentTextTransport),
    Anchor(AnchorTransport),
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    NamedNodeGroupChildren(NamedNodeGroupChildrenTransport),
    NamedNodeGroupAnchoredLast(NamedNodeGroupAnchoredLastTransport),
    Tight(TightTransport),
    Space(SpaceTransport),
    Tab(TabTransport),
    Newline(NewlineTransport),
    Blankline(BlanklineTransport),
    DoubleBlankline(DoubleBlanklineTransport),
    Indent(IndentTransport),
    Dedent(DedentTransport),
    Star(StarTransport),
    Plus(PlusTransport),
    Qmark(QmarkTransport),
    At(AtTransport),
    Dquote(DquoteTransport),
    Lbrack(LbrackTransport),
    Rbrack(RbrackTransport),
    Lparen(LparenTransport),
    Rparen(RparenTransport),
    MissingKeyword(MissingKeywordTransport),
    Underscore(UnderscoreTransport),
    Colon(ColonTransport),
    Bang(BangTransport),
    Pound(PoundTransport),
    Dot(DotTransport),
    Slash(SlashTransport),
    Literal0_75_6e_64_65_72_73_63_6f_72_65,
    Literal1_70_6f_75_6e_64,
    Literal2_64_6f_74,
    Literal3_71_6d_61_72_6b,
    Literal4_62_61_6e_67,
    Literal5_73_74_61_72,
    Literal6_70_6c_75_73,
    Literal7_61_6e_63_68_6f_72,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for AnyTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnyTransport::Program(t) => t.prepare(ctx),
            AnyTransport::EscapeSequence(t) => t.prepare(ctx),
            AnyTransport::Quantifier(t) => t.prepare(ctx),
            AnyTransport::Identifier(t) => t.prepare(ctx),
            AnyTransport::ImmediateIdentifier(t) => t.prepare(ctx),
            AnyTransport::Capture(t) => t.prepare(ctx),
            AnyTransport::String(t) => t.prepare(ctx),
            AnyTransport::ImmediateString(t) => t.prepare(ctx),
            AnyTransport::StringContent(t) => t.prepare(ctx),
            AnyTransport::Parameters(t) => t.prepare(ctx),
            AnyTransport::Comment(t) => t.prepare(ctx),
            AnyTransport::List(t) => t.prepare(ctx),
            AnyTransport::Grouping(t) => t.prepare(ctx),
            AnyTransport::MissingNode(t) => t.prepare(ctx),
            AnyTransport::AnonymousNode(t) => t.prepare(ctx),
            AnyTransport::FieldDefinition(t) => t.prepare(ctx),
            AnyTransport::NegatedField(t) => t.prepare(ctx),
            AnyTransport::Predicate(t) => t.prepare(ctx),
            AnyTransport::PredicateType(t) => t.prepare(ctx),
            AnyTransport::ListElementQuantifier(t) => t.prepare(ctx),
            AnyTransport::GroupExpressionArm(t) => t.prepare(ctx),
            AnyTransport::NamedNodeExpressionArm(t) => t.prepare(ctx),
            AnyTransport::GroupingGroup(t) => t.prepare(ctx),
            AnyTransport::StringContentText(t) => t.prepare(ctx),
            AnyTransport::Anchor(t) => t.prepare(ctx),
            AnyTransport::NamedNodePlain(t) => t.prepare(ctx),
            AnyTransport::NamedNodeSupertyped(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupChildren(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.prepare(ctx),
            AnyTransport::Tight(t) => t.prepare(ctx),
            AnyTransport::Space(t) => t.prepare(ctx),
            AnyTransport::Tab(t) => t.prepare(ctx),
            AnyTransport::Newline(t) => t.prepare(ctx),
            AnyTransport::Blankline(t) => t.prepare(ctx),
            AnyTransport::DoubleBlankline(t) => t.prepare(ctx),
            AnyTransport::Indent(t) => t.prepare(ctx),
            AnyTransport::Dedent(t) => t.prepare(ctx),
            AnyTransport::Star(t) => t.prepare(ctx),
            AnyTransport::Plus(t) => t.prepare(ctx),
            AnyTransport::Qmark(t) => t.prepare(ctx),
            AnyTransport::At(t) => t.prepare(ctx),
            AnyTransport::Dquote(t) => t.prepare(ctx),
            AnyTransport::Lbrack(t) => t.prepare(ctx),
            AnyTransport::Rbrack(t) => t.prepare(ctx),
            AnyTransport::Lparen(t) => t.prepare(ctx),
            AnyTransport::Rparen(t) => t.prepare(ctx),
            AnyTransport::MissingKeyword(t) => t.prepare(ctx),
            AnyTransport::Underscore(t) => t.prepare(ctx),
            AnyTransport::Colon(t) => t.prepare(ctx),
            AnyTransport::Bang(t) => t.prepare(ctx),
            AnyTransport::Pound(t) => t.prepare(ctx),
            AnyTransport::Dot(t) => t.prepare(ctx),
            AnyTransport::Slash(t) => t.prepare(ctx),
            AnyTransport::Literal0_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
            AnyTransport::Literal1_70_6f_75_6e_64 => Ok(()),
            AnyTransport::Literal2_64_6f_74 => Ok(()),
            AnyTransport::Literal3_71_6d_61_72_6b => Ok(()),
            AnyTransport::Literal4_62_61_6e_67 => Ok(()),
            AnyTransport::Literal5_73_74_61_72 => Ok(()),
            AnyTransport::Literal6_70_6c_75_73 => Ok(()),
            AnyTransport::Literal7_61_6e_63_68_6f_72 => Ok(()),
            AnyTransport::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            AnyTransport::Program(t) => t.source_gap(),
            AnyTransport::EscapeSequence(t) => t.source_gap(),
            AnyTransport::Quantifier(t) => t.source_gap(),
            AnyTransport::Identifier(t) => t.source_gap(),
            AnyTransport::ImmediateIdentifier(t) => t.source_gap(),
            AnyTransport::Capture(t) => t.source_gap(),
            AnyTransport::String(t) => t.source_gap(),
            AnyTransport::ImmediateString(t) => t.source_gap(),
            AnyTransport::StringContent(t) => t.source_gap(),
            AnyTransport::Parameters(t) => t.source_gap(),
            AnyTransport::Comment(t) => t.source_gap(),
            AnyTransport::List(t) => t.source_gap(),
            AnyTransport::Grouping(t) => t.source_gap(),
            AnyTransport::MissingNode(t) => t.source_gap(),
            AnyTransport::AnonymousNode(t) => t.source_gap(),
            AnyTransport::FieldDefinition(t) => t.source_gap(),
            AnyTransport::NegatedField(t) => t.source_gap(),
            AnyTransport::Predicate(t) => t.source_gap(),
            AnyTransport::PredicateType(t) => t.source_gap(),
            AnyTransport::ListElementQuantifier(t) => t.source_gap(),
            AnyTransport::GroupExpressionArm(t) => t.source_gap(),
            AnyTransport::NamedNodeExpressionArm(t) => t.source_gap(),
            AnyTransport::GroupingGroup(t) => t.source_gap(),
            AnyTransport::StringContentText(t) => t.source_gap(),
            AnyTransport::Anchor(t) => t.source_gap(),
            AnyTransport::NamedNodePlain(t) => t.source_gap(),
            AnyTransport::NamedNodeSupertyped(t) => t.source_gap(),
            AnyTransport::NamedNodeGroupChildren(t) => t.source_gap(),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.source_gap(),
            AnyTransport::Tight(t) => t.source_gap(),
            AnyTransport::Space(t) => t.source_gap(),
            AnyTransport::Tab(t) => t.source_gap(),
            AnyTransport::Newline(t) => t.source_gap(),
            AnyTransport::Blankline(t) => t.source_gap(),
            AnyTransport::DoubleBlankline(t) => t.source_gap(),
            AnyTransport::Indent(t) => t.source_gap(),
            AnyTransport::Dedent(t) => t.source_gap(),
            AnyTransport::Star(t) => t.source_gap(),
            AnyTransport::Plus(t) => t.source_gap(),
            AnyTransport::Qmark(t) => t.source_gap(),
            AnyTransport::At(t) => t.source_gap(),
            AnyTransport::Dquote(t) => t.source_gap(),
            AnyTransport::Lbrack(t) => t.source_gap(),
            AnyTransport::Rbrack(t) => t.source_gap(),
            AnyTransport::Lparen(t) => t.source_gap(),
            AnyTransport::Rparen(t) => t.source_gap(),
            AnyTransport::MissingKeyword(t) => t.source_gap(),
            AnyTransport::Underscore(t) => t.source_gap(),
            AnyTransport::Colon(t) => t.source_gap(),
            AnyTransport::Bang(t) => t.source_gap(),
            AnyTransport::Pound(t) => t.source_gap(),
            AnyTransport::Dot(t) => t.source_gap(),
            AnyTransport::Slash(t) => t.source_gap(),
            AnyTransport::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
            AnyTransport::Literal1_70_6f_75_6e_64 => None,
            AnyTransport::Literal2_64_6f_74 => None,
            AnyTransport::Literal3_71_6d_61_72_6b => None,
            AnyTransport::Literal4_62_61_6e_67 => None,
            AnyTransport::Literal5_73_74_61_72 => None,
            AnyTransport::Literal6_70_6c_75_73 => None,
            AnyTransport::Literal7_61_6e_63_68_6f_72 => None,
            AnyTransport::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            AnyTransport::Program(t) => t.gap_edges(),
            AnyTransport::EscapeSequence(t) => t.gap_edges(),
            AnyTransport::Quantifier(t) => t.gap_edges(),
            AnyTransport::Identifier(t) => t.gap_edges(),
            AnyTransport::ImmediateIdentifier(t) => t.gap_edges(),
            AnyTransport::Capture(t) => t.gap_edges(),
            AnyTransport::String(t) => t.gap_edges(),
            AnyTransport::ImmediateString(t) => t.gap_edges(),
            AnyTransport::StringContent(t) => t.gap_edges(),
            AnyTransport::Parameters(t) => t.gap_edges(),
            AnyTransport::Comment(t) => t.gap_edges(),
            AnyTransport::List(t) => t.gap_edges(),
            AnyTransport::Grouping(t) => t.gap_edges(),
            AnyTransport::MissingNode(t) => t.gap_edges(),
            AnyTransport::AnonymousNode(t) => t.gap_edges(),
            AnyTransport::FieldDefinition(t) => t.gap_edges(),
            AnyTransport::NegatedField(t) => t.gap_edges(),
            AnyTransport::Predicate(t) => t.gap_edges(),
            AnyTransport::PredicateType(t) => t.gap_edges(),
            AnyTransport::ListElementQuantifier(t) => t.gap_edges(),
            AnyTransport::GroupExpressionArm(t) => t.gap_edges(),
            AnyTransport::NamedNodeExpressionArm(t) => t.gap_edges(),
            AnyTransport::GroupingGroup(t) => t.gap_edges(),
            AnyTransport::StringContentText(t) => t.gap_edges(),
            AnyTransport::Anchor(t) => t.gap_edges(),
            AnyTransport::NamedNodePlain(t) => t.gap_edges(),
            AnyTransport::NamedNodeSupertyped(t) => t.gap_edges(),
            AnyTransport::NamedNodeGroupChildren(t) => t.gap_edges(),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.gap_edges(),
            AnyTransport::Tight(t) => t.gap_edges(),
            AnyTransport::Space(t) => t.gap_edges(),
            AnyTransport::Tab(t) => t.gap_edges(),
            AnyTransport::Newline(t) => t.gap_edges(),
            AnyTransport::Blankline(t) => t.gap_edges(),
            AnyTransport::DoubleBlankline(t) => t.gap_edges(),
            AnyTransport::Indent(t) => t.gap_edges(),
            AnyTransport::Dedent(t) => t.gap_edges(),
            AnyTransport::Star(t) => t.gap_edges(),
            AnyTransport::Plus(t) => t.gap_edges(),
            AnyTransport::Qmark(t) => t.gap_edges(),
            AnyTransport::At(t) => t.gap_edges(),
            AnyTransport::Dquote(t) => t.gap_edges(),
            AnyTransport::Lbrack(t) => t.gap_edges(),
            AnyTransport::Rbrack(t) => t.gap_edges(),
            AnyTransport::Lparen(t) => t.gap_edges(),
            AnyTransport::Rparen(t) => t.gap_edges(),
            AnyTransport::MissingKeyword(t) => t.gap_edges(),
            AnyTransport::Underscore(t) => t.gap_edges(),
            AnyTransport::Colon(t) => t.gap_edges(),
            AnyTransport::Bang(t) => t.gap_edges(),
            AnyTransport::Pound(t) => t.gap_edges(),
            AnyTransport::Dot(t) => t.gap_edges(),
            AnyTransport::Slash(t) => t.gap_edges(),
            AnyTransport::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
            AnyTransport::Literal1_70_6f_75_6e_64 => None,
            AnyTransport::Literal2_64_6f_74 => None,
            AnyTransport::Literal3_71_6d_61_72_6b => None,
            AnyTransport::Literal4_62_61_6e_67 => None,
            AnyTransport::Literal5_73_74_61_72 => None,
            AnyTransport::Literal6_70_6c_75_73 => None,
            AnyTransport::Literal7_61_6e_63_68_6f_72 => None,
            AnyTransport::Verbatim(t) => t.gap_edges(),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AnyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let kind_id = if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {
            Some(kind_id)
        } else if let Ok(obj) = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val) {
            obj.get::<u16>("$type")?
        } else {
            None
        };
        if let Some(kind_id) = kind_id {
            return match kind_id {
                // kind: program (PROGRAM)
                32 => Ok(AnyTransport::Program(
                    ProgramTransport::from_napi_value(env, napi_val)?
                )),
                // kind: escape_sequence (ESCAPE_SEQUENCE)
                1 => Ok(AnyTransport::EscapeSequence(
                    EscapeSequenceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: quantifier (QUANTIFIER)
                36 => Ok(AnyTransport::Quantifier(
                    QuantifierEnum::from_napi_value(env, napi_val)?
                )),
                // kind: identifier (IDENTIFIER)
                5 => Ok(AnyTransport::Identifier(
                    IdentifierTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _immediate_identifier (_IMMEDIATE_IDENTIFIER)
                6 => Ok(AnyTransport::ImmediateIdentifier(
                    ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                )),
                // kind: capture (CAPTURE)
                38 => Ok(AnyTransport::Capture(
                    CaptureTransport::from_napi_value(env, napi_val)?
                )),
                // kind: string (STRING)
                39 => Ok(AnyTransport::String(
                    StringTransport::from_napi_value(env, napi_val)?
                )),
                // kind: immediate_string (IMMEDIATE_STRING)
                40 => Ok(AnyTransport::ImmediateString(
                    ImmediateStringTransport::from_napi_value(env, napi_val)?
                )),
                // kind: string_content (STRING_CONTENT)
                41 => Ok(AnyTransport::StringContent(
                    StringContentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: parameters (PARAMETERS)
                42 => Ok(AnyTransport::Parameters(
                    ParametersTransport::from_napi_value(env, napi_val)?
                )),
                // kind: comment (COMMENT)
                11 => Ok(AnyTransport::Comment(
                    CommentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: list (LIST)
                43 => Ok(AnyTransport::List(
                    ListTransport::from_napi_value(env, napi_val)?
                )),
                // kind: grouping (GROUPING)
                44 => Ok(AnyTransport::Grouping(
                    GroupingTransport::from_napi_value(env, napi_val)?
                )),
                // kind: missing_node (MISSING_NODE)
                45 => Ok(AnyTransport::MissingNode(
                    MissingNodeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: anonymous_node (ANONYMOUS_NODE)
                46 => Ok(AnyTransport::AnonymousNode(
                    AnonymousNodeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: field_definition (FIELD_DEFINITION)
                49 => Ok(AnyTransport::FieldDefinition(
                    FieldDefinitionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: negated_field (NEGATED_FIELD)
                50 => Ok(AnyTransport::NegatedField(
                    NegatedFieldTransport::from_napi_value(env, napi_val)?
                )),
                // kind: predicate (PREDICATE)
                51 => Ok(AnyTransport::Predicate(
                    PredicateTransport::from_napi_value(env, napi_val)?
                )),
                // kind: predicate_type (PREDICATE_TYPE)
                21 => Ok(AnyTransport::PredicateType(
                    PredicateTypeEnum::from_napi_value(env, napi_val)?
                )),
                // kind: list_element_quantifier (LIST_ELEMENT_QUANTIFIER)
                52 => Ok(AnyTransport::ListElementQuantifier(
                    ListElementQuantifierTransport::from_napi_value(env, napi_val)?
                )),
                // kind: group_expression_arm (GROUP_EXPRESSION_ARM)
                54 => Ok(AnyTransport::GroupExpressionArm(
                    GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_expression_arm (NAMED_NODE_EXPRESSION_ARM)
                55 => Ok(AnyTransport::NamedNodeExpressionArm(
                    NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: grouping_group (GROUPING_GROUP)
                56 => Ok(AnyTransport::GroupingGroup(
                    GroupingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: string_content_text (STRING_CONTENT_TEXT)
                22 => Ok(AnyTransport::StringContentText(
                    StringContentTextTransport::from_napi_value(env, napi_val)?
                )),
                // kind: anchor (ANCHOR)
                58 => Ok(AnyTransport::Anchor(
                    AnchorTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_plain (NAMED_NODE_PLAIN)
                59 => Ok(AnyTransport::NamedNodePlain(
                    NamedNodePlainTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_supertyped (NAMED_NODE_SUPERTYPED)
                60 => Ok(AnyTransport::NamedNodeSupertyped(
                    NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_group_children (NAMED_NODE_GROUP_CHILDREN)
                61 => Ok(AnyTransport::NamedNodeGroupChildren(
                    NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_group_anchored_last (NAMED_NODE_GROUP_ANCHORED_LAST)
                62 => Ok(AnyTransport::NamedNodeGroupAnchoredLast(
                    NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _tight (_TIGHT)
                24 => Ok(AnyTransport::Tight(
                    TightTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _space (_SPACE)
                25 => Ok(AnyTransport::Space(
                    SpaceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _tab (_TAB)
                26 => Ok(AnyTransport::Tab(
                    TabTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _newline (_NEWLINE)
                27 => Ok(AnyTransport::Newline(
                    NewlineTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _blankline (_BLANKLINE)
                28 => Ok(AnyTransport::Blankline(
                    BlanklineTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _double_blankline (_DOUBLE_BLANKLINE)
                29 => Ok(AnyTransport::DoubleBlankline(
                    DoubleBlanklineTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _indent (_INDENT)
                30 => Ok(AnyTransport::Indent(
                    IndentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _dedent (_DEDENT)
                31 => Ok(AnyTransport::Dedent(
                    DedentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: star (STAR)
                2 => Ok(AnyTransport::Star(
                    StarTransport::from_napi_value(env, napi_val)?
                )),
                // kind: plus (PLUS)
                3 => Ok(AnyTransport::Plus(
                    PlusTransport::from_napi_value(env, napi_val)?
                )),
                // kind: qmark (QMARK)
                4 => Ok(AnyTransport::Qmark(
                    QmarkTransport::from_napi_value(env, napi_val)?
                )),
                // kind: at (AT)
                8 => Ok(AnyTransport::At(
                    AtTransport::from_napi_value(env, napi_val)?
                )),
                // kind: dquote (DQUOTE)
                9 => Ok(AnyTransport::Dquote(
                    DquoteTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lbrack (LBRACK)
                12 => Ok(AnyTransport::Lbrack(
                    LbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rbrack (RBRACK)
                13 => Ok(AnyTransport::Rbrack(
                    RbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen (LPAREN)
                14 => Ok(AnyTransport::Lparen(
                    LparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rparen (RPAREN)
                15 => Ok(AnyTransport::Rparen(
                    RparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: MISSING_keyword (MISSING_KEYWORD)
                16 => Ok(AnyTransport::MissingKeyword(
                    MissingKeywordTransport::from_napi_value(env, napi_val)?
                )),
                // kind: underscore (UNDERSCORE)
                7 => Ok(AnyTransport::Underscore(
                    UnderscoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: colon (COLON)
                17 => Ok(AnyTransport::Colon(
                    ColonTransport::from_napi_value(env, napi_val)?
                )),
                // kind: bang (BANG)
                18 => Ok(AnyTransport::Bang(
                    BangTransport::from_napi_value(env, napi_val)?
                )),
                // kind: pound (POUND)
                19 => Ok(AnyTransport::Pound(
                    PoundTransport::from_napi_value(env, napi_val)?
                )),
                // kind: dot (DOT)
                20 => Ok(AnyTransport::Dot(
                    DotTransport::from_napi_value(env, napi_val)?
                )),
                // kind: slash (SLASH)
                23 => Ok(AnyTransport::Slash(
                    SlashTransport::from_napi_value(env, napi_val)?
                )),
                other => Err(::napi::Error::from_reason(format!(
                    "unknown kind id {other} in AnyTransport"
                ))),
            };
        }
        Err(::napi::Error::from_reason(
            "AnyTransport: expected u16 kind_id or object with $type",
        ))
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
pub enum TriviaTransport {
    Comment(CommentTransport),
    Space(SpaceTransport),
    Tab(TabTransport),
    Newline(NewlineTransport),
    Blankline(BlanklineTransport),
    DoubleBlankline(DoubleBlanklineTransport),
    Verbatim(VerbatimTransport),
    Text(::sittir_core::trivia::TriviaText),
}

impl ::sittir_core::prepare::Prepare for TriviaTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TriviaTransport::Comment(t) => t.prepare(ctx),
            TriviaTransport::Space(t) => t.prepare(ctx),
            TriviaTransport::Tab(t) => t.prepare(ctx),
            TriviaTransport::Newline(t) => t.prepare(ctx),
            TriviaTransport::Blankline(t) => t.prepare(ctx),
            TriviaTransport::DoubleBlankline(t) => t.prepare(ctx),
            TriviaTransport::Verbatim(t) => t.prepare(ctx),
            TriviaTransport::Text(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            TriviaTransport::Comment(t) => t.source_gap(),
            TriviaTransport::Space(t) => t.source_gap(),
            TriviaTransport::Tab(t) => t.source_gap(),
            TriviaTransport::Newline(t) => t.source_gap(),
            TriviaTransport::Blankline(t) => t.source_gap(),
            TriviaTransport::DoubleBlankline(t) => t.source_gap(),
            TriviaTransport::Verbatim(t) => t.source_gap(),
            TriviaTransport::Text(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            TriviaTransport::Comment(t) => t.gap_edges(),
            TriviaTransport::Space(t) => t.gap_edges(),
            TriviaTransport::Tab(t) => t.gap_edges(),
            TriviaTransport::Newline(t) => t.gap_edges(),
            TriviaTransport::Blankline(t) => t.gap_edges(),
            TriviaTransport::DoubleBlankline(t) => t.gap_edges(),
            TriviaTransport::Verbatim(t) => t.gap_edges(),
            TriviaTransport::Text(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::render::Render for TriviaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TriviaTransport::Comment(t) => t.render(w),
            TriviaTransport::Space(t) => t.render(w),
            TriviaTransport::Tab(t) => t.render(w),
            TriviaTransport::Newline(t) => t.render(w),
            TriviaTransport::Blankline(t) => t.render(w),
            TriviaTransport::DoubleBlankline(t) => t.render(w),
            TriviaTransport::Verbatim(t) => t.render(w),
            TriviaTransport::Text(t) => t.render(w),
        }
    }
}

impl ::sittir_core::trivia::TriviaSeam for TriviaTransport {
    fn seam_text(&self) -> Option<&str> {
        match self {
            TriviaTransport::Space(t) => Some(&t.text),
            TriviaTransport::Tab(t) => Some(&t.text),
            TriviaTransport::Newline(t) => Some(&t.text),
            TriviaTransport::Blankline(t) => Some(&t.text),
            TriviaTransport::DoubleBlankline(t) => Some(&t.text),
            _ => None,
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    11 => Ok(Self::Comment(CommentTransport::from_napi_value(env, napi_val)?)),
                    25 => Ok(Self::Space(SpaceTransport::from_napi_value(env, napi_val)?)),
                    26 => Ok(Self::Tab(TabTransport::from_napi_value(env, napi_val)?)),
                    27 => Ok(Self::Newline(NewlineTransport::from_napi_value(env, napi_val)?)),
                    28 => Ok(Self::Blankline(BlanklineTransport::from_napi_value(env, napi_val)?)),
                    29 => Ok(Self::DoubleBlankline(DoubleBlanklineTransport::from_napi_value(env, napi_val)?)),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TriviaTransport",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in TriviaTransport")
                )?;
                let text: Option<String> = obj.get("$text")?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in TriviaTransport"))?,
                    })),
                    11 if text.is_some() => Ok(Self::Text(::sittir_core::trivia::TriviaText { kind: ::sittir_core::types::KindId(11), text: text.unwrap_or_default() })),
                    11 => Ok(Self::Comment(CommentTransport::from_napi_value(env, napi_val)?)),
                    25 => Ok(Self::Space(SpaceTransport::from_napi_value(env, napi_val)?)),
                    26 => Ok(Self::Tab(TabTransport::from_napi_value(env, napi_val)?)),
                    27 => Ok(Self::Newline(NewlineTransport::from_napi_value(env, napi_val)?)),
                    28 => Ok(Self::Blankline(BlanklineTransport::from_napi_value(env, napi_val)?)),
                    29 => Ok(Self::DoubleBlankline(DoubleBlanklineTransport::from_napi_value(env, napi_val)?)),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TriviaTransport",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("TriviaTransport: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TriviaTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

pub type TransportTrivia = ::sittir_core::trivia::TransportTrivia<TriviaTransport>;


/// Text that is a slot's content with no kind of its own: a bare string in
/// a slot whose members all render from their own text, where the variant
/// tag is render-invisible and picking one would be a guess.
#[derive(Debug, Clone)]
pub struct VerbatimTransport {
    pub text: String,
}

impl ::sittir_core::render::Render for VerbatimTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        w.text(&self.text)
    }
}

impl ::sittir_core::prepare::Prepare for VerbatimTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub enum DefinitionTransport {
    NamedNode(NamedNodeTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
}

impl ::sittir_core::prepare::Prepare for DefinitionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            DefinitionTransport::NamedNode(t) => t.prepare(ctx),
            DefinitionTransport::AnonymousNode(t) => t.prepare(ctx),
            DefinitionTransport::MissingNode(t) => t.prepare(ctx),
            DefinitionTransport::Grouping(t) => t.prepare(ctx),
            DefinitionTransport::Predicate(t) => t.prepare(ctx),
            DefinitionTransport::List(t) => t.prepare(ctx),
            DefinitionTransport::FieldDefinition(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            DefinitionTransport::NamedNode(t) => t.source_gap(),
            DefinitionTransport::AnonymousNode(t) => t.source_gap(),
            DefinitionTransport::MissingNode(t) => t.source_gap(),
            DefinitionTransport::Grouping(t) => t.source_gap(),
            DefinitionTransport::Predicate(t) => t.source_gap(),
            DefinitionTransport::List(t) => t.source_gap(),
            DefinitionTransport::FieldDefinition(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            DefinitionTransport::NamedNode(t) => t.gap_edges(),
            DefinitionTransport::AnonymousNode(t) => t.gap_edges(),
            DefinitionTransport::MissingNode(t) => t.gap_edges(),
            DefinitionTransport::Grouping(t) => t.gap_edges(),
            DefinitionTransport::Predicate(t) => t.gap_edges(),
            DefinitionTransport::List(t) => t.gap_edges(),
            DefinitionTransport::FieldDefinition(t) => t.gap_edges(),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for DefinitionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    33 => {
                        if let Ok(value) = AnonymousNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::AnonymousNode(value));
                        }
                        if let Ok(value) = GroupingTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Grouping(value));
                        }
                        if let Ok(value) = PredicateTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Predicate(value));
                        }
                        if let Ok(value) = ListTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::List(value));
                        }
                        if let Ok(value) = FieldDefinitionTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::FieldDefinition(value));
                        }
                        if let Ok(value) = NamedNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNode(value));
                        }
                        if let Ok(value) = MissingNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::MissingNode(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 33 in DefinitionTransport decodes as none of its members"))
                    },
                    59 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in DefinitionTransport",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in DefinitionTransport")
                )?;
                match kind_id {
                    33 => {
                        if let Ok(value) = AnonymousNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::AnonymousNode(value));
                        }
                        if let Ok(value) = GroupingTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Grouping(value));
                        }
                        if let Ok(value) = PredicateTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Predicate(value));
                        }
                        if let Ok(value) = ListTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::List(value));
                        }
                        if let Ok(value) = FieldDefinitionTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::FieldDefinition(value));
                        }
                        if let Ok(value) = NamedNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNode(value));
                        }
                        if let Ok(value) = MissingNodeTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::MissingNode(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 33 in DefinitionTransport decodes as none of its members"))
                    },
                    59 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in DefinitionTransport",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("DefinitionTransport: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DefinitionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("DefinitionTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DefinitionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DefinitionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DefinitionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DefinitionTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::view::KindOf for DefinitionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
        }
    }
}

impl ::sittir_core::render::Render for DefinitionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_definition(self, w)
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeTransport {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeTransport::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeTransport::NamedNodeSupertyped(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeTransport::NamedNodePlain(t) => t.source_gap(),
            NamedNodeTransport::NamedNodeSupertyped(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeTransport::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeTransport::NamedNodeSupertyped(t) => t.gap_edges(),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    47 => {
                        if let Ok(value) = NamedNodePlainTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodePlain(value));
                        }
                        if let Ok(value) = NamedNodeSupertypedTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeSupertyped(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 47 in NamedNodeTransport decodes as none of its members"))
                    },
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeTransport",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeTransport")
                )?;
                match kind_id {
                    47 => {
                        if let Ok(value) = NamedNodePlainTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodePlain(value));
                        }
                        if let Ok(value) = NamedNodeSupertypedTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeSupertyped(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 47 in NamedNodeTransport decodes as none of its members"))
                    },
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeTransport",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeTransport: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::view::KindOf for NamedNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
        }
    }
}

fn named_node_transport_to_any(t: NamedNodeTransport) -> AnyTransport {
    match t {
        NamedNodeTransport::NamedNodePlain(inner) => AnyTransport::NamedNodePlain(inner),
        NamedNodeTransport::NamedNodeSupertyped(inner) => AnyTransport::NamedNodeSupertyped(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_named_node(self, w)
    }
}

#[derive(Debug, Clone)]
pub enum ListElementTransport {
    Capture(CaptureTransport),
    ListElementQuantifier(ListElementQuantifierTransport),
}

impl ::sittir_core::prepare::Prepare for ListElementTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ListElementTransport::Capture(t) => t.prepare(ctx),
            ListElementTransport::ListElementQuantifier(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            ListElementTransport::Capture(t) => t.source_gap(),
            ListElementTransport::ListElementQuantifier(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            ListElementTransport::Capture(t) => t.gap_edges(),
            ListElementTransport::ListElementQuantifier(t) => t.gap_edges(),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ListElementTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    53 => {
                        if let Ok(value) = CaptureTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Capture(value));
                        }
                        if let Ok(value) = ListElementQuantifierTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::ListElementQuantifier(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 53 in ListElementTransport decodes as none of its members"))
                    },
                    38 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    52 => Ok(Self::ListElementQuantifier(
                        ListElementQuantifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ListElementTransport",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in ListElementTransport")
                )?;
                match kind_id {
                    53 => {
                        if let Ok(value) = CaptureTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::Capture(value));
                        }
                        if let Ok(value) = ListElementQuantifierTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::ListElementQuantifier(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 53 in ListElementTransport decodes as none of its members"))
                    },
                    38 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    52 => Ok(Self::ListElementQuantifier(
                        ListElementQuantifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ListElementTransport",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("ListElementTransport: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ListElementTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ListElementTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ListElementTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ListElementTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ListElementTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ListElementTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::view::KindOf for ListElementTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::ListElementQuantifier(inner) => inner.kind_in(kinds),
        }
    }
}

impl ::sittir_core::render::Render for ListElementTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_list_element(self, w)
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeGroupTransport {
    NamedNodeGroupChildren(NamedNodeGroupChildrenTransport),
    NamedNodeGroupAnchoredLast(NamedNodeGroupAnchoredLastTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeGroupTransport::NamedNodeGroupChildren(t) => t.prepare(ctx),
            NamedNodeGroupTransport::NamedNodeGroupAnchoredLast(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeGroupTransport::NamedNodeGroupChildren(t) => t.source_gap(),
            NamedNodeGroupTransport::NamedNodeGroupAnchoredLast(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeGroupTransport::NamedNodeGroupChildren(t) => t.gap_edges(),
            NamedNodeGroupTransport::NamedNodeGroupAnchoredLast(t) => t.gap_edges(),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeGroupTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    57 => {
                        if let Ok(value) = NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupChildren(value));
                        }
                        if let Ok(value) = NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupAnchoredLast(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 57 in NamedNodeGroupTransport decodes as none of its members"))
                    },
                    61 => Ok(Self::NamedNodeGroupChildren(
                        NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::NamedNodeGroupAnchoredLast(
                        NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupTransport",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeGroupTransport")
                )?;
                match kind_id {
                    57 => {
                        if let Ok(value) = NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupChildren(value));
                        }
                        if let Ok(value) = NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupAnchoredLast(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 57 in NamedNodeGroupTransport decodes as none of its members"))
                    },
                    61 => Ok(Self::NamedNodeGroupChildren(
                        NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::NamedNodeGroupAnchoredLast(
                        NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupTransport",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeGroupTransport: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeGroupTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeGroupTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::view::KindOf for NamedNodeGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodeGroupChildren(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupAnchoredLast(inner) => inner.kind_in(kinds),
        }
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_named_node_group(self, w)
    }
}


#[derive(Debug, Clone)]
pub enum StringContentContentTransportSlot {
    StringContentText(StringContentTextTransport),
    EscapeSequence(EscapeSequenceTransport),
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for StringContentContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            StringContentContentTransportSlot::StringContentText(t) => t.prepare(ctx),
            StringContentContentTransportSlot::EscapeSequence(t) => t.prepare(ctx),
            StringContentContentTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            StringContentContentTransportSlot::StringContentText(t) => t.source_gap(),
            StringContentContentTransportSlot::EscapeSequence(t) => t.source_gap(),
            StringContentContentTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            StringContentContentTransportSlot::StringContentText(t) => t.gap_edges(),
            StringContentContentTransportSlot::EscapeSequence(t) => t.gap_edges(),
            StringContentContentTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for StringContentContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::StringContentText(inner) => inner.kind_in(kinds),
            Self::EscapeSequence(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for StringContentContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    22 => Ok(Self::StringContentText(
                        StringContentTextTransport::from_napi_value(env, napi_val)?
                    )),
                    1 => Ok(Self::EscapeSequence(
                        EscapeSequenceTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in StringContentContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in StringContentContentTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in StringContentContentTransportSlot"))?,
                    })),
                    22 => Ok(Self::StringContentText(
                        StringContentTextTransport::from_napi_value(env, napi_val)?
                    )),
                    1 => Ok(Self::EscapeSequence(
                        EscapeSequenceTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in StringContentContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("StringContentContentTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StringContentContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("StringContentContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StringContentContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StringContentContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StringContentContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StringContentContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for StringContentContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            StringContentContentTransportSlot::StringContentText(inner) => inner.render(w),
            StringContentContentTransportSlot::EscapeSequence(inner) => { w.adjacent(); inner.render(w) },
            StringContentContentTransportSlot::Verbatim(inner) => { w.adjacent(); inner.render(w) },
        }
    }
}

#[derive(Debug, Clone)]
pub enum ParametersElementsTransportSlot {
    Capture(CaptureTransport),
    String(StringTransport),
    Identifier(IdentifierTransport),
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for ParametersElementsTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ParametersElementsTransportSlot::Capture(t) => t.prepare(ctx),
            ParametersElementsTransportSlot::String(t) => t.prepare(ctx),
            ParametersElementsTransportSlot::Identifier(t) => t.prepare(ctx),
            ParametersElementsTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            ParametersElementsTransportSlot::Capture(t) => t.source_gap(),
            ParametersElementsTransportSlot::String(t) => t.source_gap(),
            ParametersElementsTransportSlot::Identifier(t) => t.source_gap(),
            ParametersElementsTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            ParametersElementsTransportSlot::Capture(t) => t.gap_edges(),
            ParametersElementsTransportSlot::String(t) => t.gap_edges(),
            ParametersElementsTransportSlot::Identifier(t) => t.gap_edges(),
            ParametersElementsTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for ParametersElementsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::String(inner) => inner.kind_in(kinds),
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ParametersElementsTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    38 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ParametersElementsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in ParametersElementsTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in ParametersElementsTransportSlot"))?,
                    })),
                    38 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ParametersElementsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("ParametersElementsTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ParametersElementsTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ParametersElementsTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ParametersElementsTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ParametersElementsTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ParametersElementsTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ParametersElementsTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for ParametersElementsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ParametersElementsTransportSlot::Capture(inner) => inner.render(w),
            ParametersElementsTransportSlot::String(inner) => inner.render(w),
            ParametersElementsTransportSlot::Identifier(inner) => inner.render(w),
            ParametersElementsTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum MissingNodeNameTransportSlot {
    Identifier(IdentifierTransport),
    String(StringTransport),
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for MissingNodeNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            MissingNodeNameTransportSlot::Identifier(t) => t.prepare(ctx),
            MissingNodeNameTransportSlot::String(t) => t.prepare(ctx),
            MissingNodeNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            MissingNodeNameTransportSlot::Identifier(t) => t.source_gap(),
            MissingNodeNameTransportSlot::String(t) => t.source_gap(),
            MissingNodeNameTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            MissingNodeNameTransportSlot::Identifier(t) => t.gap_edges(),
            MissingNodeNameTransportSlot::String(t) => t.gap_edges(),
            MissingNodeNameTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for MissingNodeNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::String(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for MissingNodeNameTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in MissingNodeNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in MissingNodeNameTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in MissingNodeNameTransportSlot"))?,
                    })),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in MissingNodeNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("MissingNodeNameTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for MissingNodeNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("MissingNodeNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<MissingNodeNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        MissingNodeNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<MissingNodeNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        MissingNodeNameTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for MissingNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            MissingNodeNameTransportSlot::Identifier(inner) => inner.render(w),
            MissingNodeNameTransportSlot::String(inner) => inner.render(w),
            MissingNodeNameTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum AnonymousNodeNameTransportSlot {
    String(StringTransport),
    Literal0_75_6e_64_65_72_73_63_6f_72_65,
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.prepare(ctx),
            AnonymousNodeNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.source_gap(),
            AnonymousNodeNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.gap_edges(),
            AnonymousNodeNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
        }
    }
}

impl ::sittir_core::view::KindOf for AnonymousNodeNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::String(inner) => inner.kind_in(kinds),
            Self::Literal0_75_6e_64_65_72_73_63_6f_72_65 => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AnonymousNodeNameTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    7 => Ok(Self::Literal0_75_6e_64_65_72_73_63_6f_72_65),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in AnonymousNodeNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in AnonymousNodeNameTransportSlot")
                )?;
                match kind_id {
                    7 => Ok(Self::Literal0_75_6e_64_65_72_73_63_6f_72_65),
                    39 => Ok(Self::String(
                        StringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in AnonymousNodeNameTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("AnonymousNodeNameTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnonymousNodeNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("AnonymousNodeNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnonymousNodeNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnonymousNodeNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnonymousNodeNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnonymousNodeNameTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for AnonymousNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnonymousNodeNameTransportSlot::String(inner) => inner.render(w),
            AnonymousNodeNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => {
                let written = w.text("_");
                written?;
                w.site_at(options::SITE_ANONYMOUS_NODE_UNDERSCORE_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum PredicatePrefixTransportSlot {
    Literal1_70_6f_75_6e_64,
    Literal2_64_6f_74,
}

impl ::sittir_core::prepare::Prepare for PredicatePrefixTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            PredicatePrefixTransportSlot::Literal1_70_6f_75_6e_64 => Ok(()),
            PredicatePrefixTransportSlot::Literal2_64_6f_74 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for PredicatePrefixTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal1_70_6f_75_6e_64 => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_64_6f_74 => [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PredicatePrefixTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    19 => Ok(Self::Literal1_70_6f_75_6e_64),
                    20 => Ok(Self::Literal2_64_6f_74),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicatePrefixTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in PredicatePrefixTransportSlot")
                )?;
                match kind_id {
                    19 => Ok(Self::Literal1_70_6f_75_6e_64),
                    20 => Ok(Self::Literal2_64_6f_74),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicatePrefixTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("PredicatePrefixTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PredicatePrefixTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PredicatePrefixTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PredicatePrefixTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PredicatePrefixTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PredicatePrefixTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PredicatePrefixTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for PredicatePrefixTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            PredicatePrefixTransportSlot::Literal1_70_6f_75_6e_64 => w.text("#"),
            PredicatePrefixTransportSlot::Literal2_64_6f_74 => w.text("."),
        }
    }
}

#[derive(Debug, Clone)]
pub enum GroupExpressionArmLeftTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    GroupExpressionArm(GroupExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for GroupExpressionArmLeftTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::List(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::MissingNode(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::Grouping(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::Predicate(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::List(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(t) => t.source_gap(),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::MissingNode(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::Grouping(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::Predicate(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::List(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(t) => t.gap_edges(),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupExpressionArmLeftTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::GroupExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for GroupExpressionArmLeftTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupExpressionArmLeftTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in GroupExpressionArmLeftTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupExpressionArmLeftTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("GroupExpressionArmLeftTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GroupExpressionArmLeftTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("GroupExpressionArmLeftTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupExpressionArmLeftTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupExpressionArmLeftTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupExpressionArmLeftTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupExpressionArmLeftTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for GroupExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNodePlain(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::MissingNode(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::Grouping(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::Predicate(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::List(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum GroupExpressionArmRightTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    GroupExpressionArm(GroupExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for GroupExpressionArmRightTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            GroupExpressionArmRightTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::List(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            GroupExpressionArmRightTransportSlot::NamedNodePlain(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::AnonymousNode(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::MissingNode(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::Grouping(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::Predicate(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::List(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::FieldDefinition(t) => t.source_gap(),
            GroupExpressionArmRightTransportSlot::GroupExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            GroupExpressionArmRightTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::AnonymousNode(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::MissingNode(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::Grouping(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::Predicate(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::List(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::FieldDefinition(t) => t.gap_edges(),
            GroupExpressionArmRightTransportSlot::GroupExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupExpressionArmRightTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::GroupExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for GroupExpressionArmRightTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupExpressionArmRightTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in GroupExpressionArmRightTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupExpressionArmRightTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("GroupExpressionArmRightTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GroupExpressionArmRightTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("GroupExpressionArmRightTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupExpressionArmRightTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupExpressionArmRightTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupExpressionArmRightTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupExpressionArmRightTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for GroupExpressionArmRightTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupExpressionArmRightTransportSlot::NamedNodePlain(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::AnonymousNode(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::MissingNode(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::Grouping(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::Predicate(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::List(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::FieldDefinition(inner) => inner.render(w),
            GroupExpressionArmRightTransportSlot::GroupExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeExpressionArmLeftTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeExpressionArmLeftTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::MissingNode(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::Grouping(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::Predicate(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::List(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::NegatedField(t) => t.prepare(ctx),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::MissingNode(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::Grouping(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::Predicate(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::List(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::NegatedField(t) => t.source_gap(),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::MissingNode(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::Grouping(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::Predicate(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::List(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::NegatedField(t) => t.gap_edges(),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmLeftTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeExpressionArmLeftTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeExpressionArmLeftTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeExpressionArmLeftTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeExpressionArmLeftTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeExpressionArmLeftTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeExpressionArmLeftTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeExpressionArmLeftTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeExpressionArmLeftTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeExpressionArmLeftTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeExpressionArmLeftTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeExpressionArmLeftTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNodePlain(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::MissingNode(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::Predicate(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::List(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::NegatedField(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeExpressionArmRightTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeExpressionArmRightTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeExpressionArmRightTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::MissingNode(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::Grouping(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::Predicate(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::List(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::NegatedField(t) => t.prepare(ctx),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeExpressionArmRightTransportSlot::NamedNodePlain(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::AnonymousNode(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::MissingNode(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::Grouping(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::Predicate(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::List(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::FieldDefinition(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::NegatedField(t) => t.source_gap(),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeExpressionArmRightTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::AnonymousNode(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::MissingNode(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::Grouping(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::Predicate(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::List(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::FieldDefinition(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::NegatedField(t) => t.gap_edges(),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmRightTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeExpressionArmRightTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeExpressionArmRightTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeExpressionArmRightTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeExpressionArmRightTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeExpressionArmRightTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeExpressionArmRightTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeExpressionArmRightTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeExpressionArmRightTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeExpressionArmRightTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeExpressionArmRightTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeExpressionArmRightTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmRightTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeExpressionArmRightTransportSlot::NamedNodePlain(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::MissingNode(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::Predicate(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::List(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::FieldDefinition(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::NegatedField(inner) => inner.render(w),
            NamedNodeExpressionArmRightTransportSlot::NamedNodeExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum GroupingGroupGroupExpressionTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    GroupExpressionArm(GroupExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for GroupingGroupGroupExpressionTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            GroupingGroupGroupExpressionTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::List(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            GroupingGroupGroupExpressionTransportSlot::NamedNodePlain(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::AnonymousNode(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::MissingNode(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::Grouping(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::Predicate(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::List(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::FieldDefinition(t) => t.source_gap(),
            GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            GroupingGroupGroupExpressionTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::AnonymousNode(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::MissingNode(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::Grouping(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::Predicate(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::List(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::FieldDefinition(t) => t.gap_edges(),
            GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupingGroupGroupExpressionTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::GroupExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for GroupingGroupGroupExpressionTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupingGroupGroupExpressionTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in GroupingGroupGroupExpressionTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    54 => Ok(Self::GroupExpressionArm(
                        GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupingGroupGroupExpressionTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("GroupingGroupGroupExpressionTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GroupingGroupGroupExpressionTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("GroupingGroupGroupExpressionTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupingGroupGroupExpressionTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupingGroupGroupExpressionTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupingGroupGroupExpressionTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupingGroupGroupExpressionTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for GroupingGroupGroupExpressionTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupingGroupGroupExpressionTransportSlot::NamedNodePlain(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::AnonymousNode(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::MissingNode(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::Grouping(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::Predicate(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::List(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::FieldDefinition(inner) => inner.render(w),
            GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodePlainNameTransportSlot {
    Identifier(IdentifierTransport),
    Literal0_75_6e_64_65_72_73_63_6f_72_65,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodePlainNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.prepare(ctx),
            NamedNodePlainNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.source_gap(),
            NamedNodePlainNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.gap_edges(),
            NamedNodePlainNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => None,
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodePlainNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::Literal0_75_6e_64_65_72_73_63_6f_72_65 => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodePlainNameTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    7 => Ok(Self::Literal0_75_6e_64_65_72_73_63_6f_72_65),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodePlainNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodePlainNameTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in NamedNodePlainNameTransportSlot"))?,
                    })),
                    7 => Ok(Self::Literal0_75_6e_64_65_72_73_63_6f_72_65),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodePlainNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("NamedNodePlainNameTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodePlainNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodePlainNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodePlainNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodePlainNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodePlainNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodePlainNameTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodePlainNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(inner) => inner.render(w),
            NamedNodePlainNameTransportSlot::Literal0_75_6e_64_65_72_73_63_6f_72_65 => {
                w.site_at(options::SITE_NAMED_NODE_PLAIN_UNDERSCORE_BEFORE);
                let written = w.text("_");
                written?;
                w.site_at(options::SITE_NAMED_NODE_PLAIN_UNDERSCORE_AFTER);
                Ok(())
            }
            NamedNodePlainNameTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeSupertypedNameTransportSlot {
    ImmediateIdentifier(ImmediateIdentifierTransport),
    ImmediateString(ImmediateStringTransport),
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeSupertypedNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeSupertypedNameTransportSlot::ImmediateIdentifier(t) => t.prepare(ctx),
            NamedNodeSupertypedNameTransportSlot::ImmediateString(t) => t.prepare(ctx),
            NamedNodeSupertypedNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeSupertypedNameTransportSlot::ImmediateIdentifier(t) => t.source_gap(),
            NamedNodeSupertypedNameTransportSlot::ImmediateString(t) => t.source_gap(),
            NamedNodeSupertypedNameTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeSupertypedNameTransportSlot::ImmediateIdentifier(t) => t.gap_edges(),
            NamedNodeSupertypedNameTransportSlot::ImmediateString(t) => t.gap_edges(),
            NamedNodeSupertypedNameTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeSupertypedNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ImmediateIdentifier(inner) => inner.kind_in(kinds),
            Self::ImmediateString(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeSupertypedNameTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    6 => Ok(Self::ImmediateIdentifier(
                        ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    5 => Ok(Self::ImmediateIdentifier(
                        ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::ImmediateString(
                        ImmediateStringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeSupertypedNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeSupertypedNameTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in NamedNodeSupertypedNameTransportSlot"))?,
                    })),
                    6 => Ok(Self::ImmediateIdentifier(
                        ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    5 => Ok(Self::ImmediateIdentifier(
                        ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::ImmediateString(
                        ImmediateStringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeSupertypedNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("NamedNodeSupertypedNameTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeSupertypedNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeSupertypedNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeSupertypedNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeSupertypedNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeSupertypedNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeSupertypedNameTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeSupertypedNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeSupertypedNameTransportSlot::ImmediateIdentifier(inner) => inner.render(w),
            NamedNodeSupertypedNameTransportSlot::ImmediateString(inner) => { w.adjacent(); inner.render(w) },
            NamedNodeSupertypedNameTransportSlot::Verbatim(inner) => { w.adjacent(); inner.render(w) },
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::MissingNode(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Grouping(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Predicate(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::List(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NegatedField(t) => t.prepare(ctx),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::MissingNode(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Grouping(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Predicate(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::List(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NegatedField(t) => t.source_gap(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::MissingNode(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Grouping(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Predicate(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::List(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NegatedField(t) => t.gap_edges(),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodePlain(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::MissingNode(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Predicate(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::List(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::FieldDefinition(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NegatedField(inner) => inner.render(w),
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::MissingNode(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Grouping(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Predicate(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::List(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NegatedField(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::MissingNode(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Grouping(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Predicate(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::List(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NegatedField(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::AnonymousNode(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::MissingNode(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Grouping(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Predicate(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::List(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::FieldDefinition(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NegatedField(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodePlain(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::MissingNode(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Predicate(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::List(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::FieldDefinition(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NegatedField(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeGroupAnchoredLastLastTransportSlot {
    NamedNodePlain(NamedNodePlainTransport),
    NamedNodeSupertyped(NamedNodeSupertypedTransport),
    AnonymousNode(AnonymousNodeTransport),
    MissingNode(MissingNodeTransport),
    Grouping(GroupingTransport),
    Predicate(PredicateTransport),
    List(ListTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodePlain(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeSupertyped(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::MissingNode(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::Grouping(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::Predicate(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::List(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::NegatedField(t) => t.prepare(ctx),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeExpressionArm(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodePlain(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeSupertyped(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::AnonymousNode(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::MissingNode(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::Grouping(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::Predicate(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::List(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::FieldDefinition(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NegatedField(t) => t.source_gap(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeExpressionArm(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodePlain(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeSupertyped(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::AnonymousNode(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::MissingNode(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::Grouping(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::Predicate(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::List(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::FieldDefinition(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NegatedField(t) => t.gap_edges(),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeExpressionArm(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeGroupAnchoredLastLastTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupAnchoredLastLastTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeGroupAnchoredLastLastTransportSlot")
                )?;
                match kind_id {
                    59 => Ok(Self::NamedNodePlain(
                        NamedNodePlainTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::NamedNodeSupertyped(
                        NamedNodeSupertypedTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    51 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    43 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    49 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    50 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    55 => Ok(Self::NamedNodeExpressionArm(
                        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeGroupAnchoredLastLastTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeGroupAnchoredLastLastTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeGroupAnchoredLastLastTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeGroupAnchoredLastLastTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupAnchoredLastLastTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupAnchoredLastLastTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupAnchoredLastLastTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupAnchoredLastLastTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodePlain(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeSupertyped(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::MissingNode(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::Predicate(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::List(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::FieldDefinition(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::NegatedField(inner) => inner.render(w),
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeExpressionArm(inner) => inner.render(w),
        }
    }
}


#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ProgramTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions"))]
    pub definitions: Option<Vec<::sittir_core::SlotValue<DefinitionTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions_separator_space"))]
    pub definitions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ProgramTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ProgramTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(32) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ProgramTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(32)), render_program(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ProgramTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let first = [::sittir_core::prepare::EdgeItems::first_item(&self.definitions)].into_iter().flatten().next();
        let last = [::sittir_core::prepare::EdgeItems::last_item(&self.definitions)].into_iter().flatten().next();
        let flanks = ::sittir_core::prepare::root_flanks(first, last, options::allowed(options::SITE_PROGRAM_PROGRAM_BEFORE), options::allowed(options::SITE_PROGRAM_PROGRAM_AFTER), &options::WHITESPACE, ctx);
        ::sittir_core::prepare::fill_edges(self, flanks);
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.definitions.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.definitions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.definitions.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_PROGRAM_DEFINITIONS, ctx); }
        self.definitions.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ProgramTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ProgramTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ProgramTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ProgramTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct EscapeSequenceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: String,
}

impl ::sittir_core::view::KindOf for EscapeSequenceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(1)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for EscapeSequenceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(1) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for EscapeSequenceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(1)), render_escape_sequence(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for EscapeSequenceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<EscapeSequenceTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        EscapeSequenceTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<EscapeSequenceTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        EscapeSequenceTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QuantifierEnum {
    Star,
    Plus,
    Question,
}

impl ::sittir_core::prepare::Prepare for QuantifierEnum {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for QuantifierEnum {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {
                    match kind_id {
                        2 => return Ok(Self::Star), // "*"
                        3 => return Ok(Self::Plus), // "+"
                        4 => return Ok(Self::Question), // "?"
                        _ => {}
                    }
                }
            }
            ::napi::ValueType::String => {
                match String::from_napi_value(env, napi_val)?.as_str() {
                    "*" => return Ok(Self::Star),
                    "+" => return Ok(Self::Plus),
                    "?" => return Ok(Self::Question),
                    _ => {}
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                if let Some(kind_id) = obj.get::<u16>("$type")? {
                    match kind_id {
                        2 => return Ok(Self::Star), // "*"
                        3 => return Ok(Self::Plus), // "+"
                        4 => return Ok(Self::Question), // "?"
                        _ => {}
                    }
                }
                if let Some(text) = obj.get::<String>("$text")? {
                    match text.as_str() {
                        "*" => return Ok(Self::Star),
                        "+" => return Ok(Self::Plus),
                        "?" => return Ok(Self::Question),
                        _ => {}
                    }
                }
                if obj.get::<::napi::bindgen_prelude::Object>("_*")?.is_some() { return Ok(Self::Star); }
                if obj.get::<::napi::bindgen_prelude::Object>("_+")?.is_some() { return Ok(Self::Plus); }
                if obj.get::<::napi::bindgen_prelude::Object>("_?")?.is_some() { return Ok(Self::Question); }
            }
            _ => {}
        }
        Err(::napi::Error::from_reason("unknown enum payload for QuantifierEnum"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for QuantifierEnum {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("QuantifierEnum is receive-only"))
    }
}

impl ::sittir_core::view::KindOf for QuantifierEnum {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Star => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Plus => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Question => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for QuantifierEnum {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            Self::Star => { w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE); w.text("*")?; w.site_at(options::SITE_QUANTIFIER_STAR_AFTER); Ok(()) }
            Self::Plus => { w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE); w.text("+")?; w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER); Ok(()) }
            Self::Question => { w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE); w.text("?")?; w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER); Ok(()) }
        }
    }
}

#[derive(Debug, Clone)]
pub struct IdentifierTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for IdentifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for IdentifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(5) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for IdentifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(5)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for IdentifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: IdentifierTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<IdentifierTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        IdentifierTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<IdentifierTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        IdentifierTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ImmediateIdentifierTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ImmediateIdentifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ImmediateIdentifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(5) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ImmediateIdentifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(6)), { w.adjacent(); w.text(&self.text) })
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateIdentifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ImmediateIdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: ImmediateIdentifierTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ImmediateIdentifierTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ImmediateIdentifierTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ImmediateIdentifierTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ImmediateIdentifierTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ImmediateIdentifierTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ImmediateIdentifierTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CaptureTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
}

impl ::sittir_core::view::KindOf for CaptureTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(38)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CaptureTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(38) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CaptureTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(38)), render_capture(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CaptureTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CaptureTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CaptureTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CaptureTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CaptureTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_string_content"))]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for StringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(39)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(39) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(39)), render_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StringTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StringTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StringTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StringTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ImmediateStringTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_string_content"))]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for ImmediateStringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(40)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ImmediateStringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(40) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ImmediateStringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(40)), render_immediate_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateStringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ImmediateStringTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ImmediateStringTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ImmediateStringTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ImmediateStringTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct StringContentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<StringContentContentTransportSlot, true>>>,
}

impl ::sittir_core::view::KindOf for StringContentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(41)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringContentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(41) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StringContentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(41)), render_string_content(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringContentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StringContentTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StringContentTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StringContentTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StringContentTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ParametersTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Vec<::sittir_core::SlotValue<ParametersElementsTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ParametersTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(42)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ParametersTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(42) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ParametersTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(42)), render_parameters(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ParametersTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        ::sittir_core::prepare::fill_list_gaps(self.elements.iter_mut().map(Some), "", options::allowed(options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.elements.iter_mut().map(Some), options::SEATS_PARAMETERS_ELEMENTS, ctx);
        self.elements.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ParametersTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ParametersTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ParametersTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ParametersTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CommentTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: String,
}

impl ::sittir_core::view::KindOf for CommentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CommentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(11) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CommentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(11)), render_comment(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CommentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CommentTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CommentTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CommentTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CommentTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions"))]
    pub definitions: Vec<::sittir_core::SlotValue<DefinitionTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions_separator_space"))]
    pub definitions_separator_space: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ListTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(43)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ListTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(43) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ListTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(43)), render_list(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ListTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        ::sittir_core::prepare::fill_list_gaps(self.definitions.iter_mut().map(Some), "", options::allowed(options::SITE_LIST_DEFINITIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_LIST_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.definitions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_LIST_DEFINITIONS_SEPARATOR_SPACE].arm);
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_LIST_ELEMENTS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.definitions.iter_mut().map(Some), options::SEATS_LIST_DEFINITIONS, ctx);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_LIST_ELEMENTS, ctx); }
        self.definitions.prepare(ctx)?;
        self.elements.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ListTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ListTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ListTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ListTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GroupingTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_grouping_group"))]
    pub grouping_group: Vec<::sittir_core::SlotValue<GroupingGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_grouping_group_separator_space"))]
    pub grouping_group_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for GroupingTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(44)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(44) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupingTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(44)), render_grouping(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_GROUPING_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        ::sittir_core::prepare::fill_list_gaps(self.grouping_group.iter_mut().map(Some), "", options::allowed(options::SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_GROUPING_ELEMENTS_SEPARATOR_SPACE].arm);
        self.grouping_group_separator_space.get_or_insert(ctx.options.spacing[options::SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_GROUPING_ELEMENTS, ctx); }
        ::sittir_core::prepare::fill_seated_gaps(self.grouping_group.iter_mut().map(Some), options::SEATS_GROUPING_GROUPING_GROUP, ctx);
        self.elements.prepare(ctx)?;
        self.grouping_group.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupingTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupingTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupingTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupingTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct MissingNodeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: Option<::sittir_core::SlotValue<MissingNodeNameTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for MissingNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(45)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for MissingNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(45) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for MissingNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(45)), render_missing_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for MissingNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_MISSING_NODE_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_MISSING_NODE_ELEMENTS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_MISSING_NODE_ELEMENTS, ctx); }
        self.name.prepare(ctx)?;
        self.elements.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<MissingNodeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        MissingNodeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<MissingNodeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        MissingNodeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AnonymousNodeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<AnonymousNodeNameTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for AnonymousNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(46)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnonymousNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(46) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AnonymousNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(46)), render_anonymous_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_ANONYMOUS_NODE_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_ANONYMOUS_NODE_ELEMENTS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_ANONYMOUS_NODE_ELEMENTS, ctx); }
        self.name.prepare(ctx)?;
        self.elements.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnonymousNodeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnonymousNodeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnonymousNodeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnonymousNodeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FieldDefinitionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<IdentifierTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definition"))]
    pub definition: ::sittir_core::SlotValue<Box<DefinitionTransport>>,
}

impl ::sittir_core::view::KindOf for FieldDefinitionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(49)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for FieldDefinitionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(49) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for FieldDefinitionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(49)), render_field_definition(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for FieldDefinitionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        self.definition.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<FieldDefinitionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        FieldDefinitionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<FieldDefinitionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        FieldDefinitionTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NegatedFieldTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_identifier"))]
    pub identifier: ::sittir_core::SlotValue<IdentifierTransport>,
}

impl ::sittir_core::view::KindOf for NegatedFieldTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NegatedFieldTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(50) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NegatedFieldTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(50)), render_negated_field(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NegatedFieldTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.identifier.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NegatedFieldTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NegatedFieldTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NegatedFieldTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NegatedFieldTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PredicateTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_prefix"))]
    pub prefix: ::sittir_core::SlotValue<PredicatePrefixTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_type"))]
    pub type_: ::sittir_core::SlotValue<PredicateTypeEnum, true>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_parameters"))]
    pub parameters: Option<::sittir_core::SlotValue<ParametersTransport>>,
}

impl ::sittir_core::view::KindOf for PredicateTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(51)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PredicateTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(51) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PredicateTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(51)), render_predicate(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PredicateTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.prefix.prepare(ctx)?;
        self.name.prepare(ctx)?;
        self.type_.prepare(ctx)?;
        self.parameters.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PredicateTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PredicateTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PredicateTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PredicateTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PredicateTypeEnum {
    Question,
    Bang,
}

impl ::sittir_core::prepare::Prepare for PredicateTypeEnum {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PredicateTypeEnum {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                if let Ok(kind_id) = u16::from_napi_value(env, napi_val) {
                    match kind_id {
                        4 => return Ok(Self::Question), // "?"
                        18 => return Ok(Self::Bang), // "!"
                        _ => {}
                    }
                }
            }
            ::napi::ValueType::String => {
                match String::from_napi_value(env, napi_val)?.as_str() {
                    "?" => return Ok(Self::Question),
                    "!" => return Ok(Self::Bang),
                    _ => {}
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                if let Some(kind_id) = obj.get::<u16>("$type")? {
                    match kind_id {
                        4 => return Ok(Self::Question), // "?"
                        18 => return Ok(Self::Bang), // "!"
                        _ => {}
                    }
                }
                if let Some(text) = obj.get::<String>("$text")? {
                    match text.as_str() {
                        "?" => return Ok(Self::Question),
                        "!" => return Ok(Self::Bang),
                        _ => {}
                    }
                }
                if obj.get::<::napi::bindgen_prelude::Object>("_?")?.is_some() { return Ok(Self::Question); }
                if obj.get::<::napi::bindgen_prelude::Object>("_!")?.is_some() { return Ok(Self::Bang); }
            }
            _ => {}
        }
        Err(::napi::Error::from_reason("unknown enum payload for PredicateTypeEnum"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PredicateTypeEnum {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PredicateTypeEnum is receive-only"))
    }
}

impl ::sittir_core::view::KindOf for PredicateTypeEnum {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Question => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::Bang => [::sittir_core::types::KindId(18)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for PredicateTypeEnum {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        w.text(match self {
            Self::Question => "?",
            Self::Bang => "!",
        })
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ListElementQuantifierTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_quantifier"))]
    pub quantifier: ::sittir_core::SlotValue<QuantifierEnum>,
}

impl ::sittir_core::view::KindOf for ListElementQuantifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(52)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ListElementQuantifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(52) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ListElementQuantifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(52)), render_list_element_quantifier(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ListElementQuantifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        self.quantifier.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ListElementQuantifierTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ListElementQuantifierTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ListElementQuantifierTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ListElementQuantifierTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GroupExpressionArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_left"))]
    pub left: ::sittir_core::SlotValue<Box<GroupExpressionArmLeftTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_right"))]
    pub right: ::sittir_core::SlotValue<Box<GroupExpressionArmRightTransportSlot>>,
}

impl ::sittir_core::view::KindOf for GroupExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(54) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(54)), render_group_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupExpressionArmTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupExpressionArmTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupExpressionArmTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupExpressionArmTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeExpressionArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_left"))]
    pub left: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmLeftTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_right"))]
    pub right: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmRightTransportSlot>>,
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(55)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(55) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(55)), render_named_node_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeExpressionArmTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeExpressionArmTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeExpressionArmTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeExpressionArmTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GroupingGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_expression"))]
    pub group_expression: ::sittir_core::SlotValue<GroupingGroupGroupExpressionTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_anchor"))]
    pub anchor: Option<::sittir_core::SlotValue<AnchorTransport>>,
}

impl ::sittir_core::view::KindOf for GroupingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(56)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(56) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(56)), render_grouping_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_expression.prepare(ctx)?;
        self.anchor.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupingGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupingGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupingGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupingGroupTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct StringContentTextTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for StringContentTextTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringContentTextTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(22) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StringContentTextTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(22)), { w.adjacent(); w.text(&self.text) })
    }
}

impl ::sittir_core::prepare::Prepare for StringContentTextTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StringContentTextTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: StringContentTextTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StringContentTextTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StringContentTextTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StringContentTextTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StringContentTextTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StringContentTextTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StringContentTextTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct AnchorTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for AnchorTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(58)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnchorTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(58) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AnchorTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(58)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for AnchorTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AnchorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => ".".to_string(),
            ::napi::ValueType::Boolean => {
                if !bool::from_napi_value(env, napi_val)? {
                    return Err(::napi::Error::from_reason("AnchorTransport received false; omit the field instead of sending false"));
                }
                ".".to_string()
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| ".".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AnchorTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => {
                let text = String::from_napi_value(env, napi_val)?;
                return Ok(Self {
                    transport_trivia_data: None,
                    edges: None,
                    source_gap: None,
                    source_flank: None,
                    text,
                });
            }
            ::napi::ValueType::Boolean => {
                if !bool::from_napi_value(env, napi_val)? {
                    return Err(::napi::Error::from_reason("AnchorTransport received false; omit the field instead of sending false"));
                }
                return Ok(Self {
                    transport_trivia_data: None,
                    edges: None,
                    source_gap: None,
                    source_flank: None,
                    text: ".".to_string(),
                });
            }
            _ => {}
        }
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| ".".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnchorTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnchorTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnchorTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnchorTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnchorTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodePlainTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<NamedNodePlainNameTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_group"))]
    pub named_node_group: Option<::sittir_core::SlotValue<Box<NamedNodeGroupTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodePlainTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(59)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodePlainTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(59) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodePlainTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(59)), render_named_node_plain(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodePlainTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_NAMED_NODE_PLAIN_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_PLAIN_ELEMENTS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_NAMED_NODE_PLAIN_ELEMENTS, ctx); }
        self.name.prepare(ctx)?;
        self.elements.prepare(ctx)?;
        self.named_node_group.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodePlainTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodePlainTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodePlainTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodePlainTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeSupertypedTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_supertype"))]
    pub supertype: ::sittir_core::SlotValue<IdentifierTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<NamedNodeSupertypedNameTransportSlot, true>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_group"))]
    pub named_node_group: Option<::sittir_core::SlotValue<Box<NamedNodeGroupTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeSupertypedTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(60)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeSupertypedTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(60) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeSupertypedTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(60)), render_named_node_supertyped(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeSupertypedTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.elements.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_NAMED_NODE_SUPERTYPED_ELEMENTS, ctx); }
        self.supertype.prepare(ctx)?;
        self.name.prepare(ctx)?;
        self.elements.prepare(ctx)?;
        self.named_node_group.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeSupertypedTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeSupertypedTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeSupertypedTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeSupertypedTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeGroupChildrenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions"))]
    pub named_node_expressions: Vec<::sittir_core::SlotValue<NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_anchor"))]
    pub anchor: Option<::sittir_core::SlotValue<AnchorTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions_separator_space"))]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupChildrenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(61)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupChildrenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(61) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeGroupChildrenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(61)), render_named_node_group_children(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupChildrenTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        ::sittir_core::prepare::fill_list_gaps(self.named_node_expressions.iter_mut().map(Some), "", options::allowed(options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        self.named_node_expressions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.named_node_expressions.iter_mut().map(Some), options::SEATS_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS, ctx);
        self.named_node_expressions.prepare(ctx)?;
        self.anchor.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupChildrenTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupChildrenTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupChildrenTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeGroupAnchoredLastTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_gap"))]
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_flank"))]
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions"))]
    pub named_node_expressions: Option<Vec<::sittir_core::SlotValue<NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_last"))]
    pub last: ::sittir_core::SlotValue<Box<NamedNodeGroupAnchoredLastLastTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_anchor"))]
    pub anchor: Option<::sittir_core::SlotValue<AnchorTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions_separator_space"))]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(62)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupAnchoredLastTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(62) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(62)), render_named_node_group_anchored_last(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupAnchoredLastTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        let flank = self.source_flank.take();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.named_node_expressions.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.named_node_expressions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.named_node_expressions.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS, ctx); }
        self.named_node_expressions.prepare(ctx)?;
        self.last.prepare(ctx)?;
        self.anchor.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeGroupAnchoredLastTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeGroupAnchoredLastTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeGroupAnchoredLastTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct TightTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for TightTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TightTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(24) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for TightTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(24)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for TightTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TightTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: TightTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TightTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TightTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TightTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TightTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TightTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TightTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct SpaceTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for SpaceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for SpaceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(25) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for SpaceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(25)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for SpaceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for SpaceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => " ".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| " ".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for SpaceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| " ".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SpaceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<SpaceTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        SpaceTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<SpaceTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        SpaceTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct TabTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for TabTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TabTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(26) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for TabTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(26)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for TabTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TabTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "\t".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "\t".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for TabTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\t".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TabTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TabTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TabTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TabTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TabTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct NewlineTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for NewlineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NewlineTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(27) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NewlineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(27)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for NewlineTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NewlineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "\n".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "\n".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\n".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NewlineTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NewlineTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NewlineTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NewlineTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct BlanklineTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BlanklineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BlanklineTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(28) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(28)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for BlanklineTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "\n\n".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "\n\n".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\n\n".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BlanklineTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BlanklineTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BlanklineTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BlanklineTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BlanklineTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DoubleBlanklineTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DoubleBlanklineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DoubleBlanklineTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(29) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DoubleBlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(29)), { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for DoubleBlanklineTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DoubleBlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "\n\n\n".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "\n\n\n".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DoubleBlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\n\n\n".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DoubleBlanklineTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DoubleBlanklineTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DoubleBlanklineTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DoubleBlanklineTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DoubleBlanklineTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct IndentTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for IndentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for IndentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(30) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for IndentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(30)), { w.indent(); w.seam("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for IndentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IndentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: IndentTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<IndentTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        IndentTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<IndentTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        IndentTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DedentTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DedentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DedentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(31) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DedentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, Some(::sittir_core::types::KindId(31)), { w.dedent("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for DedentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DedentTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: DedentTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DedentTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DedentTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DedentTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DedentTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct StarTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for StarTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StarTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(2) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StarTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(2)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for StarTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "*".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "*".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| "*".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StarTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StarTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StarTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StarTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct PlusTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PlusTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PlusTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(3) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PlusTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(3)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PlusTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PlusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "+".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "+".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PlusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "+".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PlusTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PlusTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PlusTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PlusTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PlusTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct QmarkTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for QmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for QmarkTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(4) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for QmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(4)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for QmarkTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for QmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "?".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "?".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for QmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "?".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for QmarkTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<QmarkTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        QmarkTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<QmarkTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        QmarkTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct AtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for AtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AtTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(8) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(8)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for AtTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "@".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "@".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| "@".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AtTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DquoteTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DquoteTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DquoteTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(9) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DquoteTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(9)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DquoteTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DquoteTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "\"".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "\"".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DquoteTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\"".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DquoteTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DquoteTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DquoteTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DquoteTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DquoteTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct LbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(12) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(12)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LbrackTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "[".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "[".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "[".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbrackTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LbrackTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LbrackTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LbrackTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LbrackTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct RbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(13) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for RbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(13)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for RbrackTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "]".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "]".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for RbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "]".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RbrackTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<RbrackTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        RbrackTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<RbrackTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        RbrackTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct LparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(14) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(14)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "(".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "(".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct RparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(15) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for RparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(15)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for RparenTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => ")".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| ")".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for RparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| ")".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RparenTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<RparenTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        RparenTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<RparenTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        RparenTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct MissingKeywordTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for MissingKeywordTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for MissingKeywordTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(16) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for MissingKeywordTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(16)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for MissingKeywordTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for MissingKeywordTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "MISSING".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "MISSING".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for MissingKeywordTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "MISSING".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for MissingKeywordTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<MissingKeywordTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        MissingKeywordTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<MissingKeywordTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        MissingKeywordTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct UnderscoreTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for UnderscoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnderscoreTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(7) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnderscoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(7)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnderscoreTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnderscoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "_".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "_".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for UnderscoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "_".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for UnderscoreTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnderscoreTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnderscoreTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnderscoreTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnderscoreTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ColonTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ColonTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(17) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(17)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ColonTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => ":".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| ":".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| ":".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ColonTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ColonTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ColonTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ColonTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct BangTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BangTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(18)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BangTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(18) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BangTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(18)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for BangTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BangTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "!".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "!".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BangTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "!".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BangTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BangTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BangTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BangTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BangTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct PoundTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PoundTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PoundTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(19) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PoundTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(19)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PoundTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PoundTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "#".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "#".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PoundTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "#".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PoundTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PoundTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PoundTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PoundTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PoundTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DotTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DotTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DotTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(20) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DotTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(20)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DotTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DotTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => ".".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| ".".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| ".".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DotTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DotTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DotTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DotTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct SlashTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub source_gap: Option<::sittir_core::slot::SourceGap>,
    pub source_flank: Option<::sittir_core::slot::SourceFlank>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for SlashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for SlashTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(23) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for SlashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(token self, w, Some(::sittir_core::types::KindId(23)), w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for SlashTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.transport_trivia_data.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.source_gap.as_ref()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.edges.get_or_insert_with(Default::default))
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for SlashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __transport_trivia_data: Option<TransportTrivia> = None;
        let mut __source_gap: Option<::sittir_core::slot::SourceGap> = None;
        let mut __source_flank: Option<::sittir_core::slot::SourceFlank> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => "/".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __transport_trivia_data = obj.get("$_trivia")?;
                __source_gap = obj.get("$_gap")?;
                __source_flank = obj.get("$_flank")?;
                obj.get("$text")?.unwrap_or_else(|| "/".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __transport_trivia_data,
            edges: None,
            source_gap: __source_gap,
            source_flank: __source_flank,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| "/".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        let source_gap = obj.get("$_gap")?;
        let source_flank = obj.get("$_flank")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            source_gap,
            source_flank,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<SlashTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        SlashTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<SlashTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        SlashTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::prepare::SeatTarget for CaptureTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(38)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for StringTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(39)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for ListTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(43)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(44)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for MissingNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(45)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for AnonymousNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(46)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for FieldDefinitionTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(49)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NegatedFieldTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(50)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for PredicateTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(51)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(55)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingGroupTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(56)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodePlainTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(59)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeSupertypedTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(60)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for DefinitionTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNode(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for ListElementTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for ParametersElementsTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
            Self::String(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for MissingNodeNameTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::String(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for AnonymousNodeNameTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::String(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupExpressionArmLeftTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupExpressionArmRightTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmLeftTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmRightTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingGroupGroupExpressionTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for AnyTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
            Self::String(t) => t.seat_target(table),
            Self::List(t) => t.seat_target(table),
            Self::Grouping(t) => t.seat_target(table),
            Self::MissingNode(t) => t.seat_target(table),
            Self::AnonymousNode(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            Self::GroupingGroup(t) => t.seat_target(table),
            Self::NamedNodePlain(t) => t.seat_target(table),
            Self::NamedNodeSupertyped(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}



fn render_program(node: &ProgramTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let definitions = ListView {
        items: node.definitions.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.definitions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_PROGRAM_DEFINITIONS_START),
        tail: Some(options::SITE_PROGRAM_DEFINITIONS_END),
    };
    w.edge(::sittir_core::types::KindId(32), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    ::sittir_core::trivia::render_inner(&node.transport_trivia_data, "definitions", w)?;
    definitions.render(w)?;
    w.edge(::sittir_core::types::KindId(32), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_escape_sequence(node: &EscapeSequenceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    w.text("\\")?;
    w.adjacent();
    content.render(w)?;
    Ok(())
}

fn render_quantifier(t: &QuantifierEnum, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    t.render(w)
}

fn render_identifier(t: &IdentifierTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_immediate_identifier(t: &ImmediateIdentifierTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.adjacent();
    w.text(&t.text)
}

fn render_capture(node: &CaptureTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(38), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("@")?;
    w.adjacent();
    name.render(w)?;
    w.edge(::sittir_core::types::KindId(38), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_string(node: &StringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_immediate_string(node: &ImmediateStringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(40), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_string_content(node: &StringContentTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = ListView {
        items: node.content.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: 0,
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    content.render(w)?;
    Ok(())
}

fn render_parameters(node: &ParametersTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: &node.elements,
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_PARAMETERS_ELEMENTS_START),
        tail: Some(options::SITE_PARAMETERS_ELEMENTS_END),
    };
    w.edge(::sittir_core::types::KindId(42), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(42), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_comment(node: &CommentTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    w.text(";")?;
    w.adjacent();
    content.render(w)?;
    Ok(())
}

fn render_list(node: &ListTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let definitions = ListView {
        items: &node.definitions,
        template: "{}",
        token: "",
        before: 0,
        after: node.definitions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    w.edge(::sittir_core::types::KindId(43), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("[")?;
    w.site_at(options::SITE_LIST_LBRACK_AFTER);
    definitions.render(w)?;
    w.site_at(options::SITE_LIST_RBRACK_BEFORE);
    w.text("]")?;
    w.site_at(options::SITE_LIST_RBRACK_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(43), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_grouping(node: &GroupingTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let grouping_group = ListView {
        items: &node.grouping_group,
        template: "{}",
        token: "",
        before: 0,
        after: node.grouping_group_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_GROUPING_LPAREN_AFTER);
    grouping_group.render(w)?;
    w.site_at(options::SITE_GROUPING_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_GROUPING_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_missing_node(node: &MissingNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_MISSING_NODE_ELEMENTS_START),
        tail: Some(options::SITE_MISSING_NODE_ELEMENTS_END),
    };
    let name = View::new(&node.name, "{}");
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_MISSING_NODE_LPAREN_AFTER);
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_BEFORE);
    w.text("MISSING")?;
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_AFTER);
    ::sittir_core::trivia::render_inner(&node.transport_trivia_data, "name", w)?;
    name.render(w)?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_anonymous_node(node: &AnonymousNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_ANONYMOUS_NODE_ELEMENTS_START),
        tail: Some(options::SITE_ANONYMOUS_NODE_ELEMENTS_END),
    };
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    name.render(w)?;
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_field_definition(node: &FieldDefinitionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let definition = &node.definition;
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(49), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    name.render(w)?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_BEFORE);
    w.text(":")?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_AFTER);
    definition.render(w)?;
    w.edge(::sittir_core::types::KindId(49), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_negated_field(node: &NegatedFieldTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let identifier = &node.identifier;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("!")?;
    w.adjacent();
    w.site_at(options::SITE_NEGATED_FIELD_BANG_AFTER);
    identifier.render(w)?;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_predicate(node: &PredicateTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let name = &node.name;
    let parameters = View::new(&node.parameters, "{}");
    let prefix = &node.prefix;
    let type_ = &node.type_;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_PREDICATE_LPAREN_AFTER);
    w.site_at(options::SITE_PREDICATE_PREFIX_BEFORE);
    prefix.render(w)?;
    name.render(w)?;
    w.adjacent();
    type_.render(w)?;
    parameters.render(w)?;
    w.site_at(options::SITE_PREDICATE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_predicate_type(t: &PredicateTypeEnum, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.adjacent();
    t.render(w)
}

fn render_list_element_quantifier(node: &ListElementQuantifierTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let quantifier = &node.quantifier;
    quantifier.render(w)?;
    Ok(())
}

fn render_group_expression_arm(node: &GroupExpressionArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let left = &node.left;
    let right = &node.right;
    w.edge(::sittir_core::types::KindId(54), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    left.render(w)?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(54), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_expression_arm(node: &NamedNodeExpressionArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let left = &node.left;
    let right = &node.right;
    w.edge(::sittir_core::types::KindId(55), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    left.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(55), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_grouping_group(node: &GroupingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(&node.anchor, "{}");
    let group_expression = &node.group_expression;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    group_expression.render(w)?;
    if anchor.is_present() {
        w.site_at(options::SITE_GROUPING_GROUP_DOT_BEFORE);
        anchor.render(w)?;
    }
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_string_content_text(t: &StringContentTextTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.adjacent();
    w.text(&t.text)
}

fn render_anchor(t: &AnchorTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_named_node_plain(node: &NamedNodePlainTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_NAMED_NODE_PLAIN_ELEMENTS_START),
        tail: Some(options::SITE_NAMED_NODE_PLAIN_ELEMENTS_END),
    };
    let name = &node.name;
    let named_node_group = View::new(&node.named_node_group, "{}");
    w.edge(::sittir_core::types::KindId(59), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.adjacent();
    w.site_at(options::SITE_NAMED_NODE_PLAIN_LPAREN_AFTER);
    name.render(w)?;
    named_node_group.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_PLAIN_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_NAMED_NODE_PLAIN_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(59), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_supertyped(node: &NamedNodeSupertypedTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let elements = ListView {
        items: node.elements.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.elements_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_START),
        tail: Some(options::SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_END),
    };
    let name = &node.name;
    let named_node_group = View::new(&node.named_node_group, "{}");
    let supertype = &node.supertype;
    w.edge(::sittir_core::types::KindId(60), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.adjacent();
    w.site_at(options::SITE_NAMED_NODE_SUPERTYPED_LPAREN_AFTER);
    supertype.render(w)?;
    w.text("/")?;
    w.adjacent();
    name.render(w)?;
    named_node_group.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_SUPERTYPED_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_NAMED_NODE_SUPERTYPED_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(60), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_group_children(node: &NamedNodeGroupChildrenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(&node.anchor, "{}");
    let named_node_expressions = ListView {
        items: &node.named_node_expressions,
        template: "{}",
        token: "",
        before: 0,
        after: node.named_node_expressions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_START),
        tail: Some(options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_END),
    };
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    if anchor.is_present() {
        anchor.render(w)?;
        w.site_at(options::SITE_NAMED_NODE_GROUP_CHILDREN_DOT_AFTER);
    }
    named_node_expressions.render(w)?;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_group_anchored_last(node: &NamedNodeGroupAnchoredLastTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(&node.anchor, "{}");
    let last = &node.last;
    let named_node_expressions = ListView {
        items: node.named_node_expressions.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.named_node_expressions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: Some(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_START),
        tail: Some(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_END),
    };
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    if anchor.is_present() {
        anchor.render(w)?;
        w.site_at(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_AFTER);
    }
    named_node_expressions.render(w)?;
    last.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_BEFORE);
    w.text(".")?;
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_tight(t: &TightTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_space(t: &SpaceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_tab(t: &TabTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_newline(t: &NewlineTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_blankline(t: &BlanklineTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_double_blankline(t: &DoubleBlanklineTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_indent(t: &IndentTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.indent(); w.seam("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_dedent(t: &DedentTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.dedent("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_star(t: &StarTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_plus(t: &PlusTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_qmark(t: &QmarkTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_at(t: &AtTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_dquote(t: &DquoteTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lbrack(t: &LbrackTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_rbrack(t: &RbrackTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen(t: &LparenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_rparen(t: &RparenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_missing_keyword(t: &MissingKeywordTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_underscore(t: &UnderscoreTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_colon(t: &ColonTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_bang(t: &BangTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_pound(t: &PoundTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_dot(t: &DotTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_slash(t: &SlashTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_definition(t: &DefinitionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        DefinitionTransport::NamedNode(inner) => inner.render(w),
        DefinitionTransport::AnonymousNode(inner) => inner.render(w),
        DefinitionTransport::MissingNode(inner) => inner.render(w),
        DefinitionTransport::Grouping(inner) => inner.render(w),
        DefinitionTransport::Predicate(inner) => inner.render(w),
        DefinitionTransport::List(inner) => inner.render(w),
        DefinitionTransport::FieldDefinition(inner) => inner.render(w),
    }
}

fn render_named_node(t: &NamedNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        NamedNodeTransport::NamedNodePlain(inner) => inner.render(w),
        NamedNodeTransport::NamedNodeSupertyped(inner) => inner.render(w),
    }
}

fn render_list_element(t: &ListElementTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        ListElementTransport::Capture(inner) => inner.render(w),
        ListElementTransport::ListElementQuantifier(inner) => inner.render(w),
    }
}

fn render_named_node_group(t: &NamedNodeGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        NamedNodeGroupTransport::NamedNodeGroupChildren(inner) => inner.render(w),
        NamedNodeGroupTransport::NamedNodeGroupAnchoredLast(inner) => inner.render(w),
    }
}

/// Word-class table derived from this grammar's Link-pinned word pattern.
static GRAMMAR_WORD_MATCHER: ::sittir_core::spacing::WordMatcher = ::sittir_core::spacing::WordMatcher::new(
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    char::is_alphanumeric,
)
.with_literal_merge_pairs(&[]); // no multi-char punctuation transitions in this grammar

/// Render a transport tree to text. Takes the trait rather than
/// `&AnyTransport` so the root's own `SlotValue` carrier renders through
/// the SAME single SpacingWriter wrap — a second entry point would be a
/// second place the root seam policy could drift.
pub fn render_transport_dispatch(transport: &dyn ::sittir_core::render::Render, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<String, ::sittir_core::render::RenderError> {
    let mut s = String::new();
    let mut w = ::sittir_core::spacing::SpacingWriter::new(&mut s, &GRAMMAR_WORD_MATCHER).with_table(&options::WHITESPACE).with_indent(&ctx.options.indent).with_sources(ctx.sources).with_options(ctx.options);
    transport.render(&mut w)?;
    w.finish()?;
    Ok(s)
}

impl ::sittir_core::view::KindOf for AnyTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Program(inner) => inner.kind_in(kinds),
            Self::EscapeSequence(inner) => inner.kind_in(kinds),
            Self::Quantifier(inner) => inner.kind_in(kinds),
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::ImmediateIdentifier(inner) => inner.kind_in(kinds),
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::String(inner) => inner.kind_in(kinds),
            Self::ImmediateString(inner) => inner.kind_in(kinds),
            Self::StringContent(inner) => inner.kind_in(kinds),
            Self::Parameters(inner) => inner.kind_in(kinds),
            Self::Comment(inner) => inner.kind_in(kinds),
            Self::List(inner) => inner.kind_in(kinds),
            Self::Grouping(inner) => inner.kind_in(kinds),
            Self::MissingNode(inner) => inner.kind_in(kinds),
            Self::AnonymousNode(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::PredicateType(inner) => inner.kind_in(kinds),
            Self::ListElementQuantifier(inner) => inner.kind_in(kinds),
            Self::GroupExpressionArm(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
            Self::GroupingGroup(inner) => inner.kind_in(kinds),
            Self::StringContentText(inner) => inner.kind_in(kinds),
            Self::Anchor(inner) => inner.kind_in(kinds),
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupChildren(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupAnchoredLast(inner) => inner.kind_in(kinds),
            Self::Tight(inner) => inner.kind_in(kinds),
            Self::Space(inner) => inner.kind_in(kinds),
            Self::Tab(inner) => inner.kind_in(kinds),
            Self::Newline(inner) => inner.kind_in(kinds),
            Self::Blankline(inner) => inner.kind_in(kinds),
            Self::DoubleBlankline(inner) => inner.kind_in(kinds),
            Self::Indent(inner) => inner.kind_in(kinds),
            Self::Dedent(inner) => inner.kind_in(kinds),
            Self::Star(inner) => inner.kind_in(kinds),
            Self::Plus(inner) => inner.kind_in(kinds),
            Self::Qmark(inner) => inner.kind_in(kinds),
            Self::At(inner) => inner.kind_in(kinds),
            Self::Dquote(inner) => inner.kind_in(kinds),
            Self::Lbrack(inner) => inner.kind_in(kinds),
            Self::Rbrack(inner) => inner.kind_in(kinds),
            Self::Lparen(inner) => inner.kind_in(kinds),
            Self::Rparen(inner) => inner.kind_in(kinds),
            Self::MissingKeyword(inner) => inner.kind_in(kinds),
            Self::Underscore(inner) => inner.kind_in(kinds),
            Self::Colon(inner) => inner.kind_in(kinds),
            Self::Bang(inner) => inner.kind_in(kinds),
            Self::Pound(inner) => inner.kind_in(kinds),
            Self::Dot(inner) => inner.kind_in(kinds),
            Self::Slash(inner) => inner.kind_in(kinds),
            _ => false,
        }
    }
}

impl ::sittir_core::render::Render for AnyTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnyTransport::Program(t) => t.render(w),
            AnyTransport::EscapeSequence(t) => t.render(w),
            AnyTransport::Quantifier(t) => t.render(w),
            AnyTransport::Identifier(t) => t.render(w),
            AnyTransport::ImmediateIdentifier(t) => t.render(w),
            AnyTransport::Capture(t) => t.render(w),
            AnyTransport::String(t) => t.render(w),
            AnyTransport::ImmediateString(t) => t.render(w),
            AnyTransport::StringContent(t) => t.render(w),
            AnyTransport::Parameters(t) => t.render(w),
            AnyTransport::Comment(t) => t.render(w),
            AnyTransport::List(t) => t.render(w),
            AnyTransport::Grouping(t) => t.render(w),
            AnyTransport::MissingNode(t) => t.render(w),
            AnyTransport::AnonymousNode(t) => t.render(w),
            AnyTransport::FieldDefinition(t) => t.render(w),
            AnyTransport::NegatedField(t) => t.render(w),
            AnyTransport::Predicate(t) => t.render(w),
            AnyTransport::PredicateType(t) => t.render(w),
            AnyTransport::ListElementQuantifier(t) => t.render(w),
            AnyTransport::GroupExpressionArm(t) => t.render(w),
            AnyTransport::NamedNodeExpressionArm(t) => t.render(w),
            AnyTransport::GroupingGroup(t) => t.render(w),
            AnyTransport::StringContentText(t) => t.render(w),
            AnyTransport::Anchor(t) => t.render(w),
            AnyTransport::NamedNodePlain(t) => t.render(w),
            AnyTransport::NamedNodeSupertyped(t) => t.render(w),
            AnyTransport::NamedNodeGroupChildren(t) => t.render(w),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.render(w),
            AnyTransport::Tight(t) => t.render(w),
            AnyTransport::Space(t) => t.render(w),
            AnyTransport::Tab(t) => t.render(w),
            AnyTransport::Newline(t) => t.render(w),
            AnyTransport::Blankline(t) => t.render(w),
            AnyTransport::DoubleBlankline(t) => t.render(w),
            AnyTransport::Indent(t) => t.render(w),
            AnyTransport::Dedent(t) => t.render(w),
            AnyTransport::Star(t) => t.render(w),
            AnyTransport::Plus(t) => t.render(w),
            AnyTransport::Qmark(t) => t.render(w),
            AnyTransport::At(t) => t.render(w),
            AnyTransport::Dquote(t) => t.render(w),
            AnyTransport::Lbrack(t) => t.render(w),
            AnyTransport::Rbrack(t) => t.render(w),
            AnyTransport::Lparen(t) => t.render(w),
            AnyTransport::Rparen(t) => t.render(w),
            AnyTransport::MissingKeyword(t) => t.render(w),
            AnyTransport::Underscore(t) => t.render(w),
            AnyTransport::Colon(t) => t.render(w),
            AnyTransport::Bang(t) => t.render(w),
            AnyTransport::Pound(t) => t.render(w),
            AnyTransport::Dot(t) => t.render(w),
            AnyTransport::Slash(t) => t.render(w),
            AnyTransport::Literal0_75_6e_64_65_72_73_63_6f_72_65 => w.text("_"),
            AnyTransport::Literal1_70_6f_75_6e_64 => w.text("#"),
            AnyTransport::Literal2_64_6f_74 => w.text("."),
            AnyTransport::Literal3_71_6d_61_72_6b => w.text("?"),
            AnyTransport::Literal4_62_61_6e_67 => w.text("!"),
            AnyTransport::Literal5_73_74_61_72 => w.text("*"),
            AnyTransport::Literal6_70_6c_75_73 => w.text("+"),
            AnyTransport::Literal7_61_6e_63_68_6f_72 => w.text("."),
            AnyTransport::Verbatim(t) => t.render(w),
        }
    }
}

use ::sittir_core::types::Source as TransportSource;

/// The render entry point. The root arrives in the same `SlotValue`
/// carrier every slot position uses, so a root that is itself an
/// unexpanded read stub reproduces its source instead of failing to
/// deserialize as its own kind.
pub type RenderRoot = ::sittir_core::SlotValue<AnyTransport>;

pub fn render_transport_parts(
    mut transport: RenderRoot,
    ctx: &::sittir_core::prepare::RenderContext<'_>,
) -> Result<(TransportSource, String), ::sittir_core::render::RenderError> {
    ::sittir_core::prepare::Prepare::prepare(&mut transport, ctx)?;
    let rendered = render_transport_dispatch(&transport, ctx)?;
    Ok((TransportSource::Factory, rendered))
}

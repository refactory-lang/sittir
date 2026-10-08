// @generated from packages/scm/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar scm --all --output packages/scm/src
//
// Per-kind view structs and render bodies, AnyTransport enum + per-kind
// transport structs + typed dispatch (render_transport_dispatch) + transport
// bridge helpers.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]

use ::sittir_core::view::{KindOf, KindTest, View, ListView, NO_ITEMS};
use ::sittir_core::render::Render;
use ::sittir_core::types::{
    FieldValue, OneOrMany, Source, Span, NodeTrivia,
};

use ::sittir_core::layout::Layout as _;
use ::sittir_core::options::Edged as _;
use super::options;
use super::{field_ids as field, kind_ids as kind};
use ::sittir_core::VerbatimTransport;

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum AnyTransport {
    #[kind(kind::PROGRAM)]
    Program(ProgramTransport),
    #[kind(kind::ESCAPE_SEQUENCE)]
    EscapeSequence(EscapeSequenceTransport),
    #[kind(kind::QUANTIFIER)]
    Quantifier(QuantifierEnum),
    #[kind(kind::IDENTIFIER)]
    Identifier(IdentifierTransport),
    #[kind(kind::_IMMEDIATE_IDENTIFIER)]
    ImmediateIdentifier(ImmediateIdentifierTransport),
    #[kind(kind::CAPTURE)]
    Capture(Box<CaptureTransport>),
    #[kind(kind::STRING)]
    String(Box<StringTransport>),
    #[kind(kind::_IMMEDIATE_STRING)]
    ImmediateString(Box<ImmediateStringTransport>),
    #[kind(kind::STRING_CONTENT)]
    StringContent(StringContentTransport),
    #[kind(kind::PARAMETERS)]
    Parameters(ParametersTransport),
    #[kind(kind::COMMENT)]
    Comment(CommentTransport),
    #[kind(kind::LIST)]
    List(ListTransport),
    #[kind(kind::GROUPING)]
    Grouping(GroupingTransport),
    #[kind(kind::MISSING_NODE)]
    MissingNode(Box<MissingNodeTransport>),
    #[kind(kind::ANONYMOUS_NODE)]
    AnonymousNode(AnonymousNodeTransport),
    #[kind(kind::FIELD_DEFINITION)]
    FieldDefinition(Box<FieldDefinitionTransport>),
    #[kind(kind::NEGATED_FIELD)]
    NegatedField(Box<NegatedFieldTransport>),
    #[kind(kind::PREDICATE)]
    Predicate(Box<PredicateTransport>),
    #[kind(kind::PREDICATE_TYPE)]
    PredicateType(PredicateTypeEnum),
    #[kind(kind::LIST_ELEMENT_QUANTIFIER)]
    ListElementQuantifier(ListElementQuantifierTransport),
    #[kind(kind::GROUP_EXPRESSION_ARM)]
    GroupExpressionArm(Box<GroupExpressionArmTransport>),
    #[kind(kind::NAMED_NODE_EXPRESSION_ARM)]
    NamedNodeExpressionArm(Box<NamedNodeExpressionArmTransport>),
    #[kind(kind::GROUPING_GROUP)]
    GroupingGroup(Box<GroupingGroupTransport>),
    #[kind(kind::STRING_CONTENT_TEXT)]
    StringContentText(StringContentTextTransport),
    #[kind(kind::NAMED_NODE_PLAIN)]
    NamedNodePlain(Box<NamedNodePlainTransport>),
    #[kind(kind::NAMED_NODE_SUPERTYPED)]
    NamedNodeSupertyped(Box<NamedNodeSupertypedTransport>),
    #[kind(kind::NAMED_NODE_GROUP_CHILDREN)]
    NamedNodeGroupChildren(NamedNodeGroupChildrenTransport),
    #[kind(kind::NAMED_NODE_GROUP_ANCHORED_LAST)]
    NamedNodeGroupAnchoredLast(NamedNodeGroupAnchoredLastTransport),
    #[kind(kind::_ANCHOR)]
    Anchor,
    #[kind(kind::_TIGHT)]
    Tight,
    #[kind(kind::_SPACE)]
    Space,
    #[kind(kind::_TAB)]
    Tab,
    #[kind(kind::_NEWLINE)]
    Newline,
    #[kind(kind::_BLANKLINE)]
    Blankline,
    #[kind(kind::_DOUBLE_BLANKLINE)]
    DoubleBlankline,
    #[kind(kind::_INDENT)]
    Indent,
    #[kind(kind::_DEDENT)]
    Dedent,
    #[kind(kind::STAR)]
    Star,
    #[kind(kind::PLUS)]
    Plus,
    #[kind(display(kind::QMARK))]
    Qmark,
    #[kind(kind::AT)]
    At,
    #[kind(display(kind::DQUOTE))]
    Dquote,
    #[kind(kind::LBRACK)]
    Lbrack,
    #[kind(kind::RBRACK)]
    Rbrack,
    #[kind(kind::LPAREN)]
    Lparen,
    #[kind(kind::RPAREN)]
    Rparen,
    #[kind(kind::MISSING_KEYWORD)]
    MissingKeyword,
    #[kind(kind::UNDERSCORE)]
    Underscore,
    #[kind(kind::COLON)]
    Colon,
    #[kind(display(kind::BANG))]
    Bang,
    #[kind(kind::POUND)]
    Pound,
    #[kind(kind::DOT)]
    Dot,
    #[kind(kind::SLASH)]
    Slash,
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
            AnyTransport::NamedNodePlain(t) => t.prepare(ctx),
            AnyTransport::NamedNodeSupertyped(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupChildren(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.prepare(ctx),
            AnyTransport::Anchor => Ok(()),
            AnyTransport::Tight => Ok(()),
            AnyTransport::Space => Ok(()),
            AnyTransport::Tab => Ok(()),
            AnyTransport::Newline => Ok(()),
            AnyTransport::Blankline => Ok(()),
            AnyTransport::DoubleBlankline => Ok(()),
            AnyTransport::Indent => Ok(()),
            AnyTransport::Dedent => Ok(()),
            AnyTransport::Star => Ok(()),
            AnyTransport::Plus => Ok(()),
            AnyTransport::Qmark => Ok(()),
            AnyTransport::At => Ok(()),
            AnyTransport::Dquote => Ok(()),
            AnyTransport::Lbrack => Ok(()),
            AnyTransport::Rbrack => Ok(()),
            AnyTransport::Lparen => Ok(()),
            AnyTransport::Rparen => Ok(()),
            AnyTransport::MissingKeyword => Ok(()),
            AnyTransport::Underscore => Ok(()),
            AnyTransport::Colon => Ok(()),
            AnyTransport::Bang => Ok(()),
            AnyTransport::Pound => Ok(()),
            AnyTransport::Dot => Ok(()),
            AnyTransport::Slash => Ok(()),
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
            AnyTransport::NamedNodePlain(t) => t.source_gap(),
            AnyTransport::NamedNodeSupertyped(t) => t.source_gap(),
            AnyTransport::NamedNodeGroupChildren(t) => t.source_gap(),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.source_gap(),
            AnyTransport::Anchor => None,
            AnyTransport::Tight => None,
            AnyTransport::Space => None,
            AnyTransport::Tab => None,
            AnyTransport::Newline => None,
            AnyTransport::Blankline => None,
            AnyTransport::DoubleBlankline => None,
            AnyTransport::Indent => None,
            AnyTransport::Dedent => None,
            AnyTransport::Star => None,
            AnyTransport::Plus => None,
            AnyTransport::Qmark => None,
            AnyTransport::At => None,
            AnyTransport::Dquote => None,
            AnyTransport::Lbrack => None,
            AnyTransport::Rbrack => None,
            AnyTransport::Lparen => None,
            AnyTransport::Rparen => None,
            AnyTransport::MissingKeyword => None,
            AnyTransport::Underscore => None,
            AnyTransport::Colon => None,
            AnyTransport::Bang => None,
            AnyTransport::Pound => None,
            AnyTransport::Dot => None,
            AnyTransport::Slash => None,
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
            AnyTransport::NamedNodePlain(t) => t.gap_edges(),
            AnyTransport::NamedNodeSupertyped(t) => t.gap_edges(),
            AnyTransport::NamedNodeGroupChildren(t) => t.gap_edges(),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.gap_edges(),
            AnyTransport::Anchor => None,
            AnyTransport::Tight => None,
            AnyTransport::Space => None,
            AnyTransport::Tab => None,
            AnyTransport::Newline => None,
            AnyTransport::Blankline => None,
            AnyTransport::DoubleBlankline => None,
            AnyTransport::Indent => None,
            AnyTransport::Dedent => None,
            AnyTransport::Star => None,
            AnyTransport::Plus => None,
            AnyTransport::Qmark => None,
            AnyTransport::At => None,
            AnyTransport::Dquote => None,
            AnyTransport::Lbrack => None,
            AnyTransport::Rbrack => None,
            AnyTransport::Lparen => None,
            AnyTransport::Rparen => None,
            AnyTransport::MissingKeyword => None,
            AnyTransport::Underscore => None,
            AnyTransport::Colon => None,
            AnyTransport::Bang => None,
            AnyTransport::Pound => None,
            AnyTransport::Dot => None,
            AnyTransport::Slash => None,
            AnyTransport::Verbatim(t) => t.gap_edges(),
        }
    }
}


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice, codec_only)]
pub enum TriviaTransport {
    #[kind(kind::COMMENT)]
    Comment(CommentTransport),
    #[kind(kind::_SPACE)]
    Space,
    #[kind(kind::_TAB)]
    Tab,
    #[kind(kind::_NEWLINE)]
    Newline,
    #[kind(kind::_BLANKLINE)]
    Blankline,
    #[kind(kind::_DOUBLE_BLANKLINE)]
    DoubleBlankline,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
    #[transport(text)]
    #[kind(kind::COMMENT)]
    Text(::sittir_core::trivia::TriviaText),
}

impl ::sittir_core::prepare::Prepare for TriviaTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TriviaTransport::Comment(t) => t.prepare(ctx),
            TriviaTransport::Space => Ok(()),
            TriviaTransport::Tab => Ok(()),
            TriviaTransport::Newline => Ok(()),
            TriviaTransport::Blankline => Ok(()),
            TriviaTransport::DoubleBlankline => Ok(()),
            TriviaTransport::Verbatim(t) => t.prepare(ctx),
            TriviaTransport::Text(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            TriviaTransport::Comment(t) => t.source_gap(),
            TriviaTransport::Space => None,
            TriviaTransport::Tab => None,
            TriviaTransport::Newline => None,
            TriviaTransport::Blankline => None,
            TriviaTransport::DoubleBlankline => None,
            TriviaTransport::Verbatim(t) => t.source_gap(),
            TriviaTransport::Text(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            TriviaTransport::Comment(t) => t.gap_edges(),
            TriviaTransport::Space => None,
            TriviaTransport::Tab => None,
            TriviaTransport::Newline => None,
            TriviaTransport::Blankline => None,
            TriviaTransport::DoubleBlankline => None,
            TriviaTransport::Verbatim(t) => t.gap_edges(),
            TriviaTransport::Text(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::render::Render for TriviaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TriviaTransport::Comment(t) => t.render(w),
            TriviaTransport::Space => render_space(w),
            TriviaTransport::Tab => render_tab(w),
            TriviaTransport::Newline => render_newline(w),
            TriviaTransport::Blankline => render_blankline(w),
            TriviaTransport::DoubleBlankline => render_double_blankline(w),
            TriviaTransport::Verbatim(t) => t.render(w),
            TriviaTransport::Text(t) => t.render(w),
        }
    }
}

impl ::sittir_core::trivia::TriviaSeam for TriviaTransport {
    fn seam_text(&self) -> Option<&str> {
        match self {
            TriviaTransport::Space => Some(" "),
            TriviaTransport::Tab => Some("\t"),
            TriviaTransport::Newline => Some("\n"),
            TriviaTransport::Blankline => Some("\n\n"),
            TriviaTransport::DoubleBlankline => Some("\n\n\n"),
            _ => None,
        }
    }
}

pub type TransportLayout = ::sittir_core::layout::TransportLayout<TriviaTransport>;


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum DefinitionTransport {
    #[kind(kind::NAMED_NODE_PLAIN, kind::NAMED_NODE_SUPERTYPED, kind::NAMED_NODE)]
    NamedNode(NamedNodeTransport),
    #[kind(kind::ANONYMOUS_NODE)]
    AnonymousNode(AnonymousNodeTransport),
    #[kind(kind::MISSING_NODE)]
    MissingNode(Box<MissingNodeTransport>),
    #[kind(kind::GROUPING)]
    Grouping(GroupingTransport),
    #[kind(kind::PREDICATE)]
    Predicate(Box<PredicateTransport>),
    #[kind(kind::LIST)]
    List(ListTransport),
    #[kind(kind::FIELD_DEFINITION)]
    FieldDefinition(Box<FieldDefinitionTransport>),
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedNodeTransport {
    #[kind(kind::NAMED_NODE_PLAIN)]
    NamedNodePlain(Box<NamedNodePlainTransport>),
    #[kind(kind::NAMED_NODE_SUPERTYPED)]
    NamedNodeSupertyped(Box<NamedNodeSupertypedTransport>),
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum ListElementTransport {
    #[kind(kind::CAPTURE)]
    Capture(Box<CaptureTransport>),
    #[kind(kind::LIST_ELEMENT_QUANTIFIER)]
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedNodeGroupTransport {
    #[kind(kind::NAMED_NODE_GROUP_CHILDREN)]
    NamedNodeGroupChildren(NamedNodeGroupChildrenTransport),
    #[kind(kind::NAMED_NODE_GROUP_ANCHORED_LAST)]
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


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum StringContentContentTransportSlot {
    #[kind(kind::STRING_CONTENT_TEXT)]
    StringContentText(StringContentTextTransport),
    #[kind(kind::ESCAPE_SEQUENCE)]
    EscapeSequence(EscapeSequenceTransport),
    #[transport(verbatim)]
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
            Self::Verbatim(_) => [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k)),
        }
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum ParametersElementsTransportSlot {
    #[kind(kind::CAPTURE)]
    Capture(Box<CaptureTransport>),
    #[kind(kind::STRING)]
    String(Box<StringTransport>),
    #[kind(kind::IDENTIFIER)]
    Identifier(IdentifierTransport),
    #[transport(verbatim)]
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

impl ::sittir_core::render::Render for ParametersElementsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ParametersElementsTransportSlot::Capture(inner) => inner.as_ref().render(w),
            ParametersElementsTransportSlot::String(inner) => inner.as_ref().render(w),
            ParametersElementsTransportSlot::Identifier(inner) => inner.render(w),
            ParametersElementsTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum MissingNodeNameTransportSlot {
    #[kind(kind::IDENTIFIER)]
    Identifier(IdentifierTransport),
    #[kind(kind::STRING)]
    String(Box<StringTransport>),
    #[transport(verbatim)]
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

impl ::sittir_core::render::Render for MissingNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            MissingNodeNameTransportSlot::Identifier(inner) => inner.render(w),
            MissingNodeNameTransportSlot::String(inner) => inner.as_ref().render(w),
            MissingNodeNameTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum AnonymousNodeNameTransportSlot {
    #[kind(kind::STRING)]
    String(Box<StringTransport>),
    #[kind(kind::UNDERSCORE)]
    Underscore,
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.prepare(ctx),
            AnonymousNodeNameTransportSlot::Underscore => Ok(()),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.source_gap(),
            AnonymousNodeNameTransportSlot::Underscore => None,
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.gap_edges(),
            AnonymousNodeNameTransportSlot::Underscore => None,
        }
    }
}

impl ::sittir_core::view::KindOf for AnonymousNodeNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::String(inner) => inner.kind_in(kinds),
            Self::Underscore => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for AnonymousNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnonymousNodeNameTransportSlot::String(inner) => inner.as_ref().render(w),
            AnonymousNodeNameTransportSlot::Underscore => {
                let written = render_underscore(w);
                written?;
                w.site_at(options::SITE_ANONYMOUS_NODE_UNDERSCORE_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum PredicatePrefixTransportSlot {
    #[kind(kind::POUND)]
    Pound,
    #[kind(kind::DOT)]
    Dot,
}

impl ::sittir_core::prepare::Prepare for PredicatePrefixTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            PredicatePrefixTransportSlot::Pound => Ok(()),
            PredicatePrefixTransportSlot::Dot => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for PredicatePrefixTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Pound => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Dot => [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for PredicatePrefixTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            PredicatePrefixTransportSlot::Pound => render_pound(w),
            PredicatePrefixTransportSlot::Dot => render_dot(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum GroupExpressionArmLeftTransportSlot {
    #[kind(kind::NAMED_NODE_PLAIN)]
    NamedNodePlain(Box<NamedNodePlainTransport>),
    #[kind(kind::NAMED_NODE_SUPERTYPED)]
    NamedNodeSupertyped(Box<NamedNodeSupertypedTransport>),
    #[kind(kind::ANONYMOUS_NODE)]
    AnonymousNode(AnonymousNodeTransport),
    #[kind(kind::MISSING_NODE)]
    MissingNode(Box<MissingNodeTransport>),
    #[kind(kind::GROUPING)]
    Grouping(GroupingTransport),
    #[kind(kind::PREDICATE)]
    Predicate(Box<PredicateTransport>),
    #[kind(kind::LIST)]
    List(ListTransport),
    #[kind(kind::FIELD_DEFINITION)]
    FieldDefinition(Box<FieldDefinitionTransport>),
    #[kind(kind::GROUP_EXPRESSION_ARM)]
    GroupExpressionArm(Box<GroupExpressionArmTransport>),
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

impl ::sittir_core::render::Render for GroupExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNodePlain(inner) => inner.as_ref().render(w),
            GroupExpressionArmLeftTransportSlot::NamedNodeSupertyped(inner) => inner.as_ref().render(w),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::MissingNode(inner) => inner.as_ref().render(w),
            GroupExpressionArmLeftTransportSlot::Grouping(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::Predicate(inner) => inner.as_ref().render(w),
            GroupExpressionArmLeftTransportSlot::List(inner) => inner.render(w),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(inner) => inner.as_ref().render(w),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(inner) => inner.as_ref().render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedNodeExpressionArmLeftTransportSlot {
    #[kind(kind::NAMED_NODE_PLAIN)]
    NamedNodePlain(Box<NamedNodePlainTransport>),
    #[kind(kind::NAMED_NODE_SUPERTYPED)]
    NamedNodeSupertyped(Box<NamedNodeSupertypedTransport>),
    #[kind(kind::ANONYMOUS_NODE)]
    AnonymousNode(AnonymousNodeTransport),
    #[kind(kind::MISSING_NODE)]
    MissingNode(Box<MissingNodeTransport>),
    #[kind(kind::GROUPING)]
    Grouping(GroupingTransport),
    #[kind(kind::PREDICATE)]
    Predicate(Box<PredicateTransport>),
    #[kind(kind::LIST)]
    List(ListTransport),
    #[kind(kind::FIELD_DEFINITION)]
    FieldDefinition(Box<FieldDefinitionTransport>),
    #[kind(kind::NEGATED_FIELD)]
    NegatedField(Box<NegatedFieldTransport>),
    #[kind(kind::NAMED_NODE_EXPRESSION_ARM)]
    NamedNodeExpressionArm(Box<NamedNodeExpressionArmTransport>),
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

impl ::sittir_core::render::Render for NamedNodeExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNodePlain(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeSupertyped(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::MissingNode(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::Grouping(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::Predicate(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::List(inner) => inner.render(w),
            NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::NegatedField(inner) => inner.as_ref().render(w),
            NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(inner) => inner.as_ref().render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedNodePlainNameTransportSlot {
    #[kind(kind::IDENTIFIER)]
    Identifier(IdentifierTransport),
    #[kind(kind::UNDERSCORE)]
    Underscore,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodePlainNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.prepare(ctx),
            NamedNodePlainNameTransportSlot::Underscore => Ok(()),
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.source_gap(),
            NamedNodePlainNameTransportSlot::Underscore => None,
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(t) => t.gap_edges(),
            NamedNodePlainNameTransportSlot::Underscore => None,
            NamedNodePlainNameTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodePlainNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::Underscore => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for NamedNodePlainNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodePlainNameTransportSlot::Identifier(inner) => inner.render(w),
            NamedNodePlainNameTransportSlot::Underscore => {
                w.site_at(options::SITE_NAMED_NODE_PLAIN_UNDERSCORE_BEFORE);
                let written = render_underscore(w);
                written?;
                w.site_at(options::SITE_NAMED_NODE_PLAIN_UNDERSCORE_AFTER);
                Ok(())
            }
            NamedNodePlainNameTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedNodeSupertypedNameTransportSlot {
    #[kind(kind::_IMMEDIATE_IDENTIFIER, kind::IDENTIFIER)]
    ImmediateIdentifier(ImmediateIdentifierTransport),
    #[kind(kind::_IMMEDIATE_STRING)]
    ImmediateString(Box<ImmediateStringTransport>),
    #[transport(verbatim)]
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

impl ::sittir_core::render::Render for NamedNodeSupertypedNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeSupertypedNameTransportSlot::ImmediateIdentifier(inner) => inner.render(w),
            NamedNodeSupertypedNameTransportSlot::ImmediateString(inner) => { w.adjacent(); inner.as_ref().render(w) },
            NamedNodeSupertypedNameTransportSlot::Verbatim(inner) => { w.adjacent(); inner.render(w) },
        }
    }
}


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::PROGRAM, gap(0) = definitions)]
pub struct ProgramTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_definitions")]
    #[slot(field = field::DEFINITIONS)]
    pub definitions: Option<Vec<::sittir_core::SlotValue<DefinitionTransport>>>,
    #[wire(key = "_definitions_separator_space")]
    pub definitions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ProgramTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(33)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ProgramTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(33) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ProgramTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(33)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_program(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ProgramTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let first = [::sittir_core::prepare::EdgeItems::first_item(&self.definitions)].into_iter().flatten().next();
        let last = [::sittir_core::prepare::EdgeItems::last_item(&self.definitions)].into_iter().flatten().next();
        let flanks = ::sittir_core::prepare::root_flanks(first, last, options::allowed(options::SITE_PROGRAM_PROGRAM_BEFORE), options::allowed(options::SITE_PROGRAM_PROGRAM_AFTER), &options::WHITESPACE, ctx);
        ::sittir_core::prepare::fill_edges(self, flanks);
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        if let Some(gap_items) = self.definitions.as_mut() { ::sittir_core::prepare::fill_list_gaps(gap_items.iter_mut().map(Some), "", options::allowed(options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx); }
        self.definitions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.definitions.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_PROGRAM_DEFINITIONS, ctx); }
        self.definitions.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::ESCAPE_SEQUENCE, interior = "^\\\\(?<content>(?:.))$")]
pub struct EscapeSequenceTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot(capture = "content")]
    pub content: String,
}

impl ::sittir_core::view::KindOf for EscapeSequenceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(1)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for EscapeSequenceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(1) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for EscapeSequenceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(1)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_escape_sequence(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for EscapeSequenceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ::sittir_core::Transport)]
#[transport(kind = kind::QUANTIFIER, spelled)]
pub enum QuantifierEnum {
    #[kind(kind::STAR)]
    Star,
    #[kind(kind::PLUS)]
    Plus,
    #[kind(display(kind::QMARK))]
    Question,
}

impl ::sittir_core::prepare::Prepare for QuantifierEnum {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::IDENTIFIER, text)]
pub struct IdentifierTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for IdentifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for IdentifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(5) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for IdentifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(5)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for IdentifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::_IMMEDIATE_IDENTIFIER, text)]
pub struct ImmediateIdentifierTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for ImmediateIdentifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ImmediateIdentifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(5) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ImmediateIdentifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(6)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.adjacent(); w.text(&self.text) })
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateIdentifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::CAPTURE, layout = [kind::AT])]
pub struct CaptureTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
}

impl ::sittir_core::view::KindOf for CaptureTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(39)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CaptureTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(39) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CaptureTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(39)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_capture(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CaptureTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::STRING, layout = [kind::DQUOTE])]
pub struct StringTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_string_content")]
    #[slot(field = field::STRING_CONTENT)]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for StringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(40)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(40) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for StringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(40)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::_IMMEDIATE_STRING, layout = [kind::DQUOTE])]
pub struct ImmediateStringTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_string_content")]
    #[slot]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for ImmediateStringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(41)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ImmediateStringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(41) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ImmediateStringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(41)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_immediate_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateStringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::STRING_CONTENT)]
pub struct StringContentTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: Vec<::sittir_core::SlotValue<StringContentContentTransportSlot, true>>,
}

impl ::sittir_core::view::KindOf for StringContentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(42)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringContentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(42) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for StringContentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(42)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_string_content(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringContentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::PARAMETERS)]
pub struct ParametersTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Vec<::sittir_core::SlotValue<ParametersElementsTransportSlot>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ParametersTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(43)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ParametersTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(43) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ParametersTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(43)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_parameters(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ParametersTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        ::sittir_core::prepare::fill_list_gaps(self.elements.iter_mut().map(Some), "", options::allowed(options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.elements.iter_mut().map(Some), options::SEATS_PARAMETERS_ELEMENTS, ctx);
        self.elements.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::COMMENT, interior = "^;(?<content>(?:.*))$")]
pub struct CommentTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot(capture = "content")]
    pub content: String,
}

impl ::sittir_core::view::KindOf for CommentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CommentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(11) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CommentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(11)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_comment(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CommentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::LIST, layout = [kind::LBRACK, kind::RBRACK])]
pub struct ListTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_definitions")]
    #[slot(field = field::DEFINITIONS)]
    pub definitions: Vec<::sittir_core::SlotValue<DefinitionTransport>>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_definitions_separator_space")]
    pub definitions_separator_space: Option<u16>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ListTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(44)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ListTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(44) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ListTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(44)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_list(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ListTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::GROUPING, layout = [kind::LPAREN, kind::RPAREN])]
pub struct GroupingTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_grouping_group")]
    #[slot]
    pub grouping_group: Vec<::sittir_core::SlotValue<GroupingGroupTransport>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
    #[wire(key = "_grouping_group_separator_space")]
    pub grouping_group_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for GroupingTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(45)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(45) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for GroupingTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(45)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_grouping(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::MISSING_NODE, layout = [kind::LPAREN, kind::MISSING_KEYWORD, kind::RPAREN], gap(2) = name)]
pub struct MissingNodeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: Option<::sittir_core::SlotValue<MissingNodeNameTransportSlot>>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for MissingNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(46)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for MissingNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(46) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for MissingNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(46)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_missing_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for MissingNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::ANONYMOUS_NODE)]
pub struct AnonymousNodeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: ::sittir_core::SlotValue<AnonymousNodeNameTransportSlot>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for AnonymousNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(47)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnonymousNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(47) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for AnonymousNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(47)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_anonymous_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::FIELD_DEFINITION)]
pub struct FieldDefinitionTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME, separator = kind::COLON)]
    pub name: ::sittir_core::SlotValue<IdentifierTransport>,
    #[wire(key = "_definition")]
    #[slot(field = field::DEFINITION)]
    pub definition: ::sittir_core::SlotValue<Box<DefinitionTransport>>,
}

impl ::sittir_core::view::KindOf for FieldDefinitionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for FieldDefinitionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(50) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for FieldDefinitionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(50)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_field_definition(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for FieldDefinitionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        self.definition.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NEGATED_FIELD, layout = [kind::BANG])]
pub struct NegatedFieldTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_identifier")]
    #[slot(field = field::IDENTIFIER)]
    pub identifier: ::sittir_core::SlotValue<IdentifierTransport>,
}

impl ::sittir_core::view::KindOf for NegatedFieldTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(51)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NegatedFieldTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(51) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NegatedFieldTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(51)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_negated_field(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NegatedFieldTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.identifier.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::PREDICATE, layout = [kind::LPAREN, kind::RPAREN])]
pub struct PredicateTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_prefix")]
    #[slot(field = field::PREFIX)]
    pub prefix: ::sittir_core::SlotValue<PredicatePrefixTransportSlot>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
    #[wire(key = "_type")]
    #[slot(field = field::TYPE)]
    pub type_: ::sittir_core::SlotValue<PredicateTypeEnum, true>,
    #[wire(key = "_parameters")]
    #[slot(field = field::PARAMETERS)]
    pub parameters: Option<::sittir_core::SlotValue<ParametersTransport>>,
}

impl ::sittir_core::view::KindOf for PredicateTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(52)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PredicateTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(52) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for PredicateTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(52)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_predicate(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PredicateTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.prefix.prepare(ctx)?;
        self.name.prepare(ctx)?;
        self.type_.prepare(ctx)?;
        self.parameters.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ::sittir_core::Transport)]
#[transport(kind = kind::PREDICATE_TYPE, spelled)]
pub enum PredicateTypeEnum {
    #[kind(display(kind::QMARK))]
    Question,
    #[kind(display(kind::BANG))]
    Bang,
}

impl ::sittir_core::prepare::Prepare for PredicateTypeEnum {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::LIST_ELEMENT_QUANTIFIER)]
pub struct ListElementQuantifierTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_quantifier")]
    #[slot(field = field::QUANTIFIER)]
    pub quantifier: ::sittir_core::SlotValue<QuantifierEnum>,
}

impl ::sittir_core::view::KindOf for ListElementQuantifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ListElementQuantifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(54) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ListElementQuantifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(54)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_list_element_quantifier(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ListElementQuantifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        self.quantifier.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::GROUP_EXPRESSION_ARM, layout = [kind::DOT])]
pub struct GroupExpressionArmTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_left")]
    #[slot(field = field::LEFT)]
    pub left: ::sittir_core::SlotValue<Box<GroupExpressionArmLeftTransportSlot>>,
    #[wire(key = "_right")]
    #[slot(field = field::RIGHT)]
    pub right: ::sittir_core::SlotValue<Box<GroupExpressionArmLeftTransportSlot>>,
}

impl ::sittir_core::view::KindOf for GroupExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(56)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(56) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for GroupExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(56)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_group_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NAMED_NODE_EXPRESSION_ARM, layout = [kind::DOT])]
pub struct NamedNodeExpressionArmTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_left")]
    #[slot(field = field::LEFT)]
    pub left: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmLeftTransportSlot>>,
    #[wire(key = "_right")]
    #[slot(field = field::RIGHT)]
    pub right: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmLeftTransportSlot>>,
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(57)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(57) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(57)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_node_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::GROUPING_GROUP)]
pub struct GroupingGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_group_expression")]
    #[slot]
    pub group_expression: ::sittir_core::SlotValue<GroupExpressionArmLeftTransportSlot>,
    #[wire(key = "_anchor")]
    #[slot(presence = kind::_ANCHOR)]
    pub anchor: Option<bool>,
}

impl ::sittir_core::view::KindOf for GroupingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(58)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(58) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for GroupingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(58)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_grouping_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_expression.prepare(ctx)?;
        self.anchor.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::STRING_CONTENT_TEXT, text)]
pub struct StringContentTextTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for StringContentTextTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringContentTextTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(23) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for StringContentTextTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(23)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.adjacent(); w.text(&self.text) })
    }
}

impl ::sittir_core::prepare::Prepare for StringContentTextTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        Ok(())
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum AnchorTransport {
    #[kind(kind::_ANCHOR)]
    Anchor,
}

impl ::sittir_core::view::KindOf for AnchorTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(60)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for AnchorTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for AnchorTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_anchor(w)
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NAMED_NODE_PLAIN, layout = [kind::LPAREN, kind::RPAREN])]
pub struct NamedNodePlainTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: ::sittir_core::SlotValue<NamedNodePlainNameTransportSlot>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_named_node_group")]
    #[slot]
    pub named_node_group: Option<::sittir_core::SlotValue<Box<NamedNodeGroupTransport>>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodePlainTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(61)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodePlainTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(61) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedNodePlainTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(61)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_node_plain(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodePlainTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NAMED_NODE_SUPERTYPED, layout = [kind::LPAREN, kind::SLASH, kind::RPAREN])]
pub struct NamedNodeSupertypedTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_supertype")]
    #[slot(field = field::SUPERTYPE)]
    pub supertype: ::sittir_core::SlotValue<IdentifierTransport>,
    #[wire(key = "_name")]
    #[slot(field = field::NAME)]
    pub name: ::sittir_core::SlotValue<NamedNodeSupertypedNameTransportSlot, true>,
    #[wire(key = "_elements")]
    #[slot(field = field::ELEMENTS)]
    pub elements: Option<Vec<::sittir_core::SlotValue<ListElementTransport>>>,
    #[wire(key = "_named_node_group")]
    #[slot]
    pub named_node_group: Option<::sittir_core::SlotValue<Box<NamedNodeGroupTransport>>>,
    #[wire(key = "_elements_separator_space")]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeSupertypedTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(62)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeSupertypedTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(62) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedNodeSupertypedTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(62)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_node_supertyped(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeSupertypedTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NAMED_NODE_GROUP_CHILDREN)]
pub struct NamedNodeGroupChildrenTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_named_node_expressions")]
    #[slot(field = field::NAMED_NODE_EXPRESSIONS)]
    pub named_node_expressions: Vec<::sittir_core::SlotValue<NamedNodeExpressionArmLeftTransportSlot>>,
    #[wire(key = "_anchor")]
    #[slot(presence = kind::_ANCHOR)]
    pub anchor: Option<bool>,
    #[wire(key = "_named_node_expressions_separator_space")]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupChildrenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(63)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupChildrenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(63) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedNodeGroupChildrenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(63)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_node_group_children(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupChildrenTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::NAMED_NODE_GROUP_ANCHORED_LAST, layout = [kind::DOT])]
pub struct NamedNodeGroupAnchoredLastTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_named_node_expressions")]
    #[slot(field = field::NAMED_NODE_EXPRESSIONS)]
    pub named_node_expressions: Option<Vec<::sittir_core::SlotValue<NamedNodeExpressionArmLeftTransportSlot>>>,
    #[wire(key = "_last")]
    #[slot(field = field::LAST)]
    pub last: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmLeftTransportSlot>>,
    #[wire(key = "_anchor")]
    #[slot(presence = kind::_ANCHOR)]
    pub anchor: Option<bool>,
    #[wire(key = "_named_node_expressions_separator_space")]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(64)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupAnchoredLastTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(64) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(64)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_node_group_anchored_last(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupAnchoredLastTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
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
        self.layout.gap()
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        Some(self.layout.edges_mut())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum TightTransport {
    #[kind(kind::_TIGHT)]
    Tight,
}

impl ::sittir_core::view::KindOf for TightTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for TightTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for TightTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_tight(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum SpaceTransport {
    #[kind(kind::_SPACE)]
    Space,
}

impl ::sittir_core::view::KindOf for SpaceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for SpaceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for SpaceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_space(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum TabTransport {
    #[kind(kind::_TAB)]
    Tab,
}

impl ::sittir_core::view::KindOf for TabTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for TabTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for TabTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_tab(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NewlineTransport {
    #[kind(kind::_NEWLINE)]
    Newline,
}

impl ::sittir_core::view::KindOf for NewlineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for NewlineTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for NewlineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_newline(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BlanklineTransport {
    #[kind(kind::_BLANKLINE)]
    Blankline,
}

impl ::sittir_core::view::KindOf for BlanklineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for BlanklineTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for BlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_blankline(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum DoubleBlanklineTransport {
    #[kind(kind::_DOUBLE_BLANKLINE)]
    DoubleBlankline,
}

impl ::sittir_core::view::KindOf for DoubleBlanklineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for DoubleBlanklineTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for DoubleBlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_double_blankline(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum IndentTransport {
    #[kind(kind::_INDENT)]
    Indent,
}

impl ::sittir_core::view::KindOf for IndentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for IndentTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for IndentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_indent(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum DedentTransport {
    #[kind(kind::_DEDENT)]
    Dedent,
}

impl ::sittir_core::view::KindOf for DedentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for DedentTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for DedentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_dedent(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum StarTransport {
    #[kind(kind::STAR)]
    Star,
}

impl ::sittir_core::view::KindOf for StarTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for StarTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for StarTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_star(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum PlusTransport {
    #[kind(kind::PLUS)]
    Plus,
}

impl ::sittir_core::view::KindOf for PlusTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for PlusTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for PlusTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_plus(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum QmarkTransport {
    #[kind(display(kind::QMARK))]
    Qmark,
}

impl ::sittir_core::view::KindOf for QmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for QmarkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for QmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_qmark(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum AtTransport {
    #[kind(kind::AT)]
    At,
}

impl ::sittir_core::view::KindOf for AtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for AtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for AtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_at(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum DquoteTransport {
    #[kind(display(kind::DQUOTE))]
    Dquote,
}

impl ::sittir_core::view::KindOf for DquoteTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for DquoteTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for DquoteTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_dquote(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LbrackTransport {
    #[kind(kind::LBRACK)]
    Lbrack,
}

impl ::sittir_core::view::KindOf for LbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrack(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum RbrackTransport {
    #[kind(kind::RBRACK)]
    Rbrack,
}

impl ::sittir_core::view::KindOf for RbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for RbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for RbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rbrack(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LparenTransport {
    #[kind(kind::LPAREN)]
    Lparen,
}

impl ::sittir_core::view::KindOf for LparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum RparenTransport {
    #[kind(kind::RPAREN)]
    Rparen,
}

impl ::sittir_core::view::KindOf for RparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for RparenTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for RparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rparen(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum MissingKeywordTransport {
    #[kind(kind::MISSING_KEYWORD)]
    MissingKeyword,
}

impl ::sittir_core::view::KindOf for MissingKeywordTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for MissingKeywordTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for MissingKeywordTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_missing_keyword(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum UnderscoreTransport {
    #[kind(kind::UNDERSCORE)]
    Underscore,
}

impl ::sittir_core::view::KindOf for UnderscoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for UnderscoreTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for UnderscoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_underscore(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum ColonTransport {
    #[kind(kind::COLON)]
    Colon,
}

impl ::sittir_core::view::KindOf for ColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for ColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for ColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_colon(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BangTransport {
    #[kind(display(kind::BANG))]
    Bang,
}

impl ::sittir_core::view::KindOf for BangTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(18)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for BangTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for BangTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bang(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum PoundTransport {
    #[kind(kind::POUND)]
    Pound,
}

impl ::sittir_core::view::KindOf for PoundTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for PoundTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for PoundTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_pound(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum DotTransport {
    #[kind(kind::DOT)]
    Dot,
}

impl ::sittir_core::view::KindOf for DotTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for DotTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for DotTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_dot(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum SlashTransport {
    #[kind(kind::SLASH)]
    Slash,
}

impl ::sittir_core::view::KindOf for SlashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for SlashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for SlashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_slash(w)
    }
}

impl ::sittir_core::prepare::SeatTarget for CaptureTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(39)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for StringTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(40)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for ListTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(44)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(45)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for MissingNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(46)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for AnonymousNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(47)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for FieldDefinitionTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(50)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NegatedFieldTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(51)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for PredicateTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(52)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(57)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingGroupTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(58)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodePlainTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(61)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeSupertypedTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(62)) {
            return Some((self.layout.edges_mut(), site));
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
    w.edge(::sittir_core::types::KindId(33), ::sittir_core::options::Side::Before, node.layout.edges().before);
    ::sittir_core::trivia::render_inner(node.layout.trivia(), "definitions", w)?;
    definitions.render(w)?;
    w.edge(::sittir_core::types::KindId(33), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("@")?;
    w.adjacent();
    name.render(w)?;
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_string(node: &StringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.edge(::sittir_core::types::KindId(40), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(40), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_immediate_string(node: &ImmediateStringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(41), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_string_content(node: &StringContentTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = ListView {
        items: &node.content,
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
    w.edge(::sittir_core::types::KindId(43), ::sittir_core::options::Side::Before, node.layout.edges().before);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(43), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("[")?;
    w.site_at(options::SITE_LIST_LBRACK_AFTER);
    definitions.render(w)?;
    w.site_at(options::SITE_LIST_RBRACK_BEFORE);
    w.text("]")?;
    w.site_at(options::SITE_LIST_RBRACK_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(")?;
    w.site_at(options::SITE_GROUPING_LPAREN_AFTER);
    grouping_group.render(w)?;
    w.site_at(options::SITE_GROUPING_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_GROUPING_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(")?;
    w.site_at(options::SITE_MISSING_NODE_LPAREN_AFTER);
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_BEFORE);
    w.text("MISSING")?;
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_AFTER);
    ::sittir_core::trivia::render_inner(node.layout.trivia(), "name", w)?;
    name.render(w)?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(47), ::sittir_core::options::Side::Before, node.layout.edges().before);
    name.render(w)?;
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(47), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_field_definition(node: &FieldDefinitionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let definition = &node.definition;
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::Before, node.layout.edges().before);
    name.render(w)?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_BEFORE);
    w.text(":")?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_AFTER);
    definition.render(w)?;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_negated_field(node: &NegatedFieldTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let identifier = &node.identifier;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("!")?;
    w.adjacent();
    w.site_at(options::SITE_NEGATED_FIELD_BANG_AFTER);
    identifier.render(w)?;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_predicate(node: &PredicateTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let name = &node.name;
    let parameters = View::new(&node.parameters, "{}");
    let prefix = &node.prefix;
    let type_ = &node.type_;
    w.edge(::sittir_core::types::KindId(52), ::sittir_core::options::Side::Before, node.layout.edges().before);
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
    w.edge(::sittir_core::types::KindId(52), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::Before, node.layout.edges().before);
    left.render(w)?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_named_node_expression_arm(node: &NamedNodeExpressionArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let left = &node.left;
    let right = &node.right;
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::Before, node.layout.edges().before);
    left.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_grouping_group(node: &GroupingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(::sittir_core::view::Presence::new(node.anchor, AnchorTransport::Anchor), "{}");
    let group_expression = &node.group_expression;
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::Before, node.layout.edges().before);
    group_expression.render(w)?;
    if anchor.is_present() {
        w.site_at(options::SITE_GROUPING_GROUP_DOT_BEFORE);
        anchor.render(w)?;
    }
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_string_content_text(t: &StringContentTextTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.adjacent();
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
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(")?;
    w.adjacent();
    w.site_at(options::SITE_NAMED_NODE_PLAIN_LPAREN_AFTER);
    name.render(w)?;
    named_node_group.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_PLAIN_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_NAMED_NODE_PLAIN_RPAREN_AFTER);
    elements.render(w)?;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::After, node.layout.edges().after);
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
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::Before, node.layout.edges().before);
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
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_named_node_group_children(node: &NamedNodeGroupChildrenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(::sittir_core::view::Presence::new(node.anchor, AnchorTransport::Anchor), "{}");
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
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::Before, node.layout.edges().before);
    if anchor.is_present() {
        anchor.render(w)?;
        w.site_at(options::SITE_NAMED_NODE_GROUP_CHILDREN_DOT_AFTER);
    }
    named_node_expressions.render(w)?;
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_named_node_group_anchored_last(node: &NamedNodeGroupAnchoredLastTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let anchor = View::new(::sittir_core::view::Presence::new(node.anchor, AnchorTransport::Anchor), "{}");
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
    w.edge(::sittir_core::types::KindId(64), ::sittir_core::options::Side::Before, node.layout.edges().before);
    if anchor.is_present() {
        anchor.render(w)?;
        w.site_at(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_AFTER);
    }
    named_node_expressions.render(w)?;
    last.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_BEFORE);
    w.text(".")?;
    w.edge(::sittir_core::types::KindId(64), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_anchor(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(60)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("."))
}

fn render_tight(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(25)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam(""); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_space(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(26)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam(" "); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_tab(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(27)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\t"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_newline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(28)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_blankline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(29)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_double_blankline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(30)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n\n\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_indent(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(31)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.indent(); w.seam("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_dedent(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(32)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.dedent("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_star(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(2)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("*"))
}

fn render_plus(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(3)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("+"))
}

fn render_qmark(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(4)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("?"))
}

fn render_at(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(8)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("@"))
}

fn render_dquote(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(9)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("\""))
}

fn render_lbrack(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(12)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("["))
}

fn render_rbrack(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(13)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("]"))
}

fn render_lparen(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(14)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("("))
}

fn render_rparen(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(15)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(")"))
}

fn render_missing_keyword(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(16)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("MISSING"))
}

fn render_underscore(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(7)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("_"))
}

fn render_colon(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(17)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(":"))
}

fn render_bang(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(18)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("!"))
}

fn render_pound(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(19)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("#"))
}

fn render_dot(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(20)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("."))
}

fn render_slash(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(24)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("/"))
}

fn render_definition(t: &DefinitionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        DefinitionTransport::NamedNode(inner) => inner.render(w),
        DefinitionTransport::AnonymousNode(inner) => inner.render(w),
        DefinitionTransport::MissingNode(inner) => inner.as_ref().render(w),
        DefinitionTransport::Grouping(inner) => inner.render(w),
        DefinitionTransport::Predicate(inner) => inner.as_ref().render(w),
        DefinitionTransport::List(inner) => inner.render(w),
        DefinitionTransport::FieldDefinition(inner) => inner.as_ref().render(w),
    }
}

fn render_named_node(t: &NamedNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        NamedNodeTransport::NamedNodePlain(inner) => inner.as_ref().render(w),
        NamedNodeTransport::NamedNodeSupertyped(inner) => inner.as_ref().render(w),
    }
}

fn render_list_element(t: &ListElementTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    match t {
        ListElementTransport::Capture(inner) => inner.as_ref().render(w),
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
            Self::NamedNodePlain(inner) => inner.kind_in(kinds),
            Self::NamedNodeSupertyped(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupChildren(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupAnchoredLast(inner) => inner.kind_in(kinds),
            Self::Anchor => [::sittir_core::types::KindId(60)].iter().any(|k| kinds.contains(k)),
            Self::Tight => [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k)),
            Self::Space => [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k)),
            Self::Tab => [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k)),
            Self::Newline => [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k)),
            Self::Blankline => [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k)),
            Self::DoubleBlankline => [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k)),
            Self::Indent => [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k)),
            Self::Dedent => [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k)),
            Self::Star => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Plus => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Qmark => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::At => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Dquote => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
            Self::Lbrack => [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k)),
            Self::Rbrack => [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k)),
            Self::Lparen => [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k)),
            Self::Rparen => [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k)),
            Self::MissingKeyword => [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k)),
            Self::Underscore => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
            Self::Colon => [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k)),
            Self::Bang => [::sittir_core::types::KindId(18)].iter().any(|k| kinds.contains(k)),
            Self::Pound => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Dot => [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k)),
            Self::Slash => [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k)),
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
            AnyTransport::NamedNodePlain(t) => t.render(w),
            AnyTransport::NamedNodeSupertyped(t) => t.render(w),
            AnyTransport::NamedNodeGroupChildren(t) => t.render(w),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.render(w),
            AnyTransport::Anchor => render_anchor(w),
            AnyTransport::Tight => render_tight(w),
            AnyTransport::Space => render_space(w),
            AnyTransport::Tab => render_tab(w),
            AnyTransport::Newline => render_newline(w),
            AnyTransport::Blankline => render_blankline(w),
            AnyTransport::DoubleBlankline => render_double_blankline(w),
            AnyTransport::Indent => render_indent(w),
            AnyTransport::Dedent => render_dedent(w),
            AnyTransport::Star => render_star(w),
            AnyTransport::Plus => render_plus(w),
            AnyTransport::Qmark => render_qmark(w),
            AnyTransport::At => render_at(w),
            AnyTransport::Dquote => render_dquote(w),
            AnyTransport::Lbrack => render_lbrack(w),
            AnyTransport::Rbrack => render_rbrack(w),
            AnyTransport::Lparen => render_lparen(w),
            AnyTransport::Rparen => render_rparen(w),
            AnyTransport::MissingKeyword => render_missing_keyword(w),
            AnyTransport::Underscore => render_underscore(w),
            AnyTransport::Colon => render_colon(w),
            AnyTransport::Bang => render_bang(w),
            AnyTransport::Pound => render_pound(w),
            AnyTransport::Dot => render_dot(w),
            AnyTransport::Slash => render_slash(w),
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

const _: () = assert!(::core::mem::size_of::<AnonymousNodeTransport>() <= 256, "AnonymousNodeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CaptureTransport>() > 256, "CaptureTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CommentTransport>() <= 256, "CommentTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<EscapeSequenceTransport>() <= 256, "EscapeSequenceTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<FieldDefinitionTransport>() > 256, "FieldDefinitionTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<GroupExpressionArmTransport>() > 256, "GroupExpressionArmTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<GroupingGroupTransport>() > 256, "GroupingGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<GroupingTransport>() <= 256, "GroupingTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<IdentifierTransport>() <= 256, "IdentifierTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ImmediateIdentifierTransport>() <= 256, "ImmediateIdentifierTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ImmediateStringTransport>() > 256, "ImmediateStringTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ListElementQuantifierTransport>() <= 256, "ListElementQuantifierTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ListTransport>() <= 256, "ListTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<MissingNodeTransport>() > 256, "MissingNodeTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodeExpressionArmTransport>() > 256, "NamedNodeExpressionArmTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodeGroupAnchoredLastTransport>() <= 256, "NamedNodeGroupAnchoredLastTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodeGroupChildrenTransport>() <= 256, "NamedNodeGroupChildrenTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodePlainTransport>() > 256, "NamedNodePlainTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodeSupertypedTransport>() > 256, "NamedNodeSupertypedTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedNodeTransport>() <= 256, "NamedNodeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NegatedFieldTransport>() > 256, "NegatedFieldTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ParametersTransport>() <= 256, "ParametersTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PredicateTransport>() > 256, "PredicateTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PredicateTypeEnum>() <= 256, "PredicateTypeEnum is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ProgramTransport>() <= 256, "ProgramTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<QuantifierEnum>() <= 256, "QuantifierEnum is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<StringContentTextTransport>() <= 256, "StringContentTextTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<StringContentTransport>() <= 256, "StringContentTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<StringTransport>() > 256, "StringTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");

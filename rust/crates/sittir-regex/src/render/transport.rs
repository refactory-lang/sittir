// @generated from packages/regex/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
//
// Per-kind view structs and render bodies, AnyTransport enum + per-kind
// transport structs + typed dispatch (render_transport_dispatch) + transport
// bridge helpers.

#![allow(dead_code, unused_imports, non_snake_case, non_camel_case_types, unused_mut, unused_variables)]
#![allow(clippy::large_enum_variant, reason = "Choice payload sizes are checked by the generated pinned ceiling assertions")]

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
    #[kind(kind::PATTERN)]
    Pattern(Box<PatternTransport>),
    #[kind(kind::ALTERNATION)]
    Alternation(AlternationTransport),
    #[kind(kind::TERM)]
    Term(TermTransport),
    #[kind(kind::LOOKAROUND_ASSERTION)]
    LookaroundAssertion(LookaroundAssertionTransport),
    #[kind(kind::_LOOKAHEAD_ASSERTION)]
    LookaheadAssertion(Box<LookaheadAssertionTransport>),
    #[kind(kind::_LOOKBEHIND_ASSERTION)]
    LookbehindAssertion(Box<LookbehindAssertionTransport>),
    #[kind(kind::PATTERN_CHARACTER)]
    PatternCharacter(PatternCharacterTransport),
    #[kind(kind::CHARACTER_CLASS)]
    CharacterClass(CharacterClassTransport),
    #[kind(kind::POSIX_CHARACTER_CLASS)]
    PosixCharacterClass(Box<PosixCharacterClassTransport>),
    #[kind(kind::POSIX_CLASS_NAME)]
    PosixClassName(PosixClassNameTransport),
    #[kind(kind::CLASS_RANGE)]
    ClassRange(Box<ClassRangeTransport>),
    #[kind(kind::CLASS_CHARACTER)]
    ClassCharacter(ClassCharacterTransport),
    #[kind(kind::ANONYMOUS_CAPTURING_GROUP)]
    AnonymousCapturingGroup(Box<AnonymousCapturingGroupTransport>),
    #[kind(kind::NAMED_CAPTURING_GROUP)]
    NamedCapturingGroup(Box<NamedCapturingGroupTransport>),
    #[kind(kind::NON_CAPTURING_GROUP)]
    NonCapturingGroup(Box<NonCapturingGroupTransport>),
    #[kind(kind::FLAGS)]
    Flags(FlagsTransport),
    #[kind(kind::ZERO_OR_MORE)]
    ZeroOrMore(ZeroOrMoreTransport),
    #[kind(kind::ONE_OR_MORE)]
    OneOrMore(OneOrMoreTransport),
    #[kind(kind::OPTIONAL)]
    Optional(OptionalTransport),
    #[kind(kind::COUNT_QUANTIFIER)]
    CountQuantifier(Box<CountQuantifierTransport>),
    #[kind(kind::BACKREFERENCE_ESCAPE)]
    BackreferenceEscape(Box<BackreferenceEscapeTransport>),
    #[kind(kind::NAMED_GROUP_BACKREFERENCE)]
    NamedGroupBackreference(Box<NamedGroupBackreferenceTransport>),
    #[kind(kind::DECIMAL_ESCAPE)]
    DecimalEscape(DecimalEscapeTransport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE)]
    CharacterClassEscape(Box<CharacterClassEscapeTransport>),
    #[kind(kind::UNICODE_CHARACTER_ESCAPE)]
    UnicodeCharacterEscape(UnicodeCharacterEscapeTransport),
    #[kind(kind::UNICODE_PROPERTY_VALUE_EXPRESSION)]
    UnicodePropertyValueExpression(Box<UnicodePropertyValueExpressionTransport>),
    #[kind(kind::UNICODE_PROPERTY_VALUE)]
    UnicodePropertyValue(UnicodePropertyValueTransport),
    #[kind(kind::CONTROL_ESCAPE)]
    ControlEscape(ControlEscapeTransport),
    #[kind(kind::CONTROL_LETTER_ESCAPE)]
    ControlLetterEscape(ControlLetterEscapeTransport),
    #[kind(kind::IDENTITY_ESCAPE, folded(kind::BSLASH_DASH))]
    IdentityEscape(IdentityEscapeTransport),
    #[kind(kind::GROUP_NAME)]
    GroupName(GroupNameTransport),
    #[kind(kind::DECIMAL_DIGITS)]
    DecimalDigits(DecimalDigitsTransport),
    #[kind(kind::TERM_GROUP)]
    TermGroup(Box<TermGroupTransport>),
    #[kind(kind::COUNT_QUANTIFIER_GROUP)]
    CountQuantifierGroup(Box<CountQuantifierGroupTransport>),
    #[kind(kind::COUNT_QUANTIFIER_ARM)]
    CountQuantifierArm(Box<CountQuantifierArmTransport>),
    #[kind(kind::CHARACTER_CLASS_ESCAPE_ARM)]
    CharacterClassEscapeArm(Box<CharacterClassEscapeArmTransport>),
    #[kind(kind::UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP)]
    UnicodePropertyValueExpressionGroup(Box<UnicodePropertyValueExpressionGroupTransport>),
    #[kind(kind::CHARACTER_CLASS_ESCAPE_TEXT1)]
    CharacterClassEscapeText1(CharacterClassEscapeText1Transport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE_TEXT2)]
    CharacterClassEscapeText2(CharacterClassEscapeText2Transport),
    #[kind(kind::INLINE_FLAGS_GROUP_ENABLE)]
    InlineFlagsGroupEnable(Box<InlineFlagsGroupEnableTransport>),
    #[kind(kind::INLINE_FLAGS_GROUP_TOGGLE)]
    InlineFlagsGroupToggle(Box<InlineFlagsGroupToggleTransport>),
    #[kind(kind::INLINE_FLAGS_GROUP_DISABLE)]
    InlineFlagsGroupDisable(Box<InlineFlagsGroupDisableTransport>),
    #[kind(kind::_LAZY, display)]
    Lazy(LazyTransport),
    #[kind(kind::_UNICODE_PROPERTY_NAME, display)]
    UnicodePropertyName(Box<UnicodePropertyNameTransport>),
    #[kind(kind::ANY_CHARACTER)]
    AnyCharacter,
    #[kind(kind::START_ASSERTION)]
    StartAssertion,
    #[kind(kind::END_ASSERTION)]
    EndAssertion,
    #[kind(kind::BOUNDARY_ASSERTION)]
    BoundaryAssertion,
    #[kind(kind::NON_BOUNDARY_ASSERTION)]
    NonBoundaryAssertion,
    #[kind(kind::_NEGATION)]
    Negation,
    #[kind(kind::_TIGHT)]
    Tight,
    #[kind(kind::_NEWLINE)]
    Newline,
    #[kind(kind::_BLANKLINE)]
    Blankline,
    #[kind(kind::_DOUBLE_BLANKLINE)]
    DoubleBlankline,
    #[kind(kind::CARET)]
    Caret,
    #[kind(kind::LPAREN_QMARK)]
    LparenQmark,
    #[kind(kind::EQ)]
    Eq,
    #[kind(kind::BANG)]
    Bang,
    #[kind(kind::RPAREN)]
    Rparen,
    #[kind(kind::LPAREN_QMARK_LT)]
    LparenQmarkLt,
    #[kind(kind::LBRACK)]
    Lbrack,
    #[kind(kind::DASH)]
    Dash,
    #[kind(kind::BSLASH_DASH)]
    BslashDash,
    #[kind(kind::RBRACK)]
    Rbrack,
    #[kind(kind::LBRACK_COLON)]
    LbrackColon,
    #[kind(kind::COLON_RBRACK)]
    ColonRbrack,
    #[kind(kind::LPAREN)]
    Lparen,
    #[kind(kind::LPAREN_QMARK_P_LT)]
    LparenQmarkPLt,
    #[kind(kind::GT)]
    Gt,
    #[kind(kind::LPAREN_QMARK_COLON)]
    LparenQmarkColon,
    #[kind(kind::STAR)]
    Star,
    #[kind(kind::QMARK)]
    Qmark,
    #[kind(kind::PLUS)]
    Plus,
    #[kind(kind::LBRACE)]
    Lbrace,
    #[kind(kind::RBRACE)]
    Rbrace,
    #[kind(kind::BSLASHK)]
    Bslashk,
    #[kind(kind::LT)]
    Lt,
    #[kind(kind::LPAREN_QMARK_P_EQ)]
    LparenQmarkPEq,
    #[kind(kind::COMMA)]
    Comma,
    #[kind(kind::COLON)]
    Colon,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for AnyTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnyTransport::Pattern(t) => t.prepare(ctx),
            AnyTransport::Alternation(t) => t.prepare(ctx),
            AnyTransport::Term(t) => t.prepare(ctx),
            AnyTransport::LookaroundAssertion(t) => t.prepare(ctx),
            AnyTransport::LookaheadAssertion(t) => t.prepare(ctx),
            AnyTransport::LookbehindAssertion(t) => t.prepare(ctx),
            AnyTransport::PatternCharacter(t) => t.prepare(ctx),
            AnyTransport::CharacterClass(t) => t.prepare(ctx),
            AnyTransport::PosixCharacterClass(t) => t.prepare(ctx),
            AnyTransport::PosixClassName(t) => t.prepare(ctx),
            AnyTransport::ClassRange(t) => t.prepare(ctx),
            AnyTransport::ClassCharacter(t) => t.prepare(ctx),
            AnyTransport::AnonymousCapturingGroup(t) => t.prepare(ctx),
            AnyTransport::NamedCapturingGroup(t) => t.prepare(ctx),
            AnyTransport::NonCapturingGroup(t) => t.prepare(ctx),
            AnyTransport::Flags(t) => t.prepare(ctx),
            AnyTransport::ZeroOrMore(t) => t.prepare(ctx),
            AnyTransport::OneOrMore(t) => t.prepare(ctx),
            AnyTransport::Optional(t) => t.prepare(ctx),
            AnyTransport::CountQuantifier(t) => t.prepare(ctx),
            AnyTransport::BackreferenceEscape(t) => t.prepare(ctx),
            AnyTransport::NamedGroupBackreference(t) => t.prepare(ctx),
            AnyTransport::DecimalEscape(t) => t.prepare(ctx),
            AnyTransport::CharacterClassEscape(t) => t.prepare(ctx),
            AnyTransport::UnicodeCharacterEscape(t) => t.prepare(ctx),
            AnyTransport::UnicodePropertyValueExpression(t) => t.prepare(ctx),
            AnyTransport::UnicodePropertyValue(t) => t.prepare(ctx),
            AnyTransport::ControlEscape(t) => t.prepare(ctx),
            AnyTransport::ControlLetterEscape(t) => t.prepare(ctx),
            AnyTransport::IdentityEscape(t) => t.prepare(ctx),
            AnyTransport::GroupName(t) => t.prepare(ctx),
            AnyTransport::DecimalDigits(t) => t.prepare(ctx),
            AnyTransport::TermGroup(t) => t.prepare(ctx),
            AnyTransport::CountQuantifierGroup(t) => t.prepare(ctx),
            AnyTransport::CountQuantifierArm(t) => t.prepare(ctx),
            AnyTransport::CharacterClassEscapeArm(t) => t.prepare(ctx),
            AnyTransport::UnicodePropertyValueExpressionGroup(t) => t.prepare(ctx),
            AnyTransport::CharacterClassEscapeText1(t) => t.prepare(ctx),
            AnyTransport::CharacterClassEscapeText2(t) => t.prepare(ctx),
            AnyTransport::InlineFlagsGroupEnable(t) => t.prepare(ctx),
            AnyTransport::InlineFlagsGroupToggle(t) => t.prepare(ctx),
            AnyTransport::InlineFlagsGroupDisable(t) => t.prepare(ctx),
            AnyTransport::Lazy(t) => t.prepare(ctx),
            AnyTransport::UnicodePropertyName(t) => t.prepare(ctx),
            AnyTransport::AnyCharacter => Ok(()),
            AnyTransport::StartAssertion => Ok(()),
            AnyTransport::EndAssertion => Ok(()),
            AnyTransport::BoundaryAssertion => Ok(()),
            AnyTransport::NonBoundaryAssertion => Ok(()),
            AnyTransport::Negation => Ok(()),
            AnyTransport::Tight => Ok(()),
            AnyTransport::Newline => Ok(()),
            AnyTransport::Blankline => Ok(()),
            AnyTransport::DoubleBlankline => Ok(()),
            AnyTransport::Caret => Ok(()),
            AnyTransport::LparenQmark => Ok(()),
            AnyTransport::Eq => Ok(()),
            AnyTransport::Bang => Ok(()),
            AnyTransport::Rparen => Ok(()),
            AnyTransport::LparenQmarkLt => Ok(()),
            AnyTransport::Lbrack => Ok(()),
            AnyTransport::Dash => Ok(()),
            AnyTransport::BslashDash => Ok(()),
            AnyTransport::Rbrack => Ok(()),
            AnyTransport::LbrackColon => Ok(()),
            AnyTransport::ColonRbrack => Ok(()),
            AnyTransport::Lparen => Ok(()),
            AnyTransport::LparenQmarkPLt => Ok(()),
            AnyTransport::Gt => Ok(()),
            AnyTransport::LparenQmarkColon => Ok(()),
            AnyTransport::Star => Ok(()),
            AnyTransport::Qmark => Ok(()),
            AnyTransport::Plus => Ok(()),
            AnyTransport::Lbrace => Ok(()),
            AnyTransport::Rbrace => Ok(()),
            AnyTransport::Bslashk => Ok(()),
            AnyTransport::Lt => Ok(()),
            AnyTransport::LparenQmarkPEq => Ok(()),
            AnyTransport::Comma => Ok(()),
            AnyTransport::Colon => Ok(()),
            AnyTransport::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            AnyTransport::Pattern(t) => t.source_gap(),
            AnyTransport::Alternation(t) => t.source_gap(),
            AnyTransport::Term(t) => t.source_gap(),
            AnyTransport::LookaroundAssertion(t) => t.source_gap(),
            AnyTransport::LookaheadAssertion(t) => t.source_gap(),
            AnyTransport::LookbehindAssertion(t) => t.source_gap(),
            AnyTransport::PatternCharacter(t) => t.source_gap(),
            AnyTransport::CharacterClass(t) => t.source_gap(),
            AnyTransport::PosixCharacterClass(t) => t.source_gap(),
            AnyTransport::PosixClassName(t) => t.source_gap(),
            AnyTransport::ClassRange(t) => t.source_gap(),
            AnyTransport::ClassCharacter(t) => t.source_gap(),
            AnyTransport::AnonymousCapturingGroup(t) => t.source_gap(),
            AnyTransport::NamedCapturingGroup(t) => t.source_gap(),
            AnyTransport::NonCapturingGroup(t) => t.source_gap(),
            AnyTransport::Flags(t) => t.source_gap(),
            AnyTransport::ZeroOrMore(t) => t.source_gap(),
            AnyTransport::OneOrMore(t) => t.source_gap(),
            AnyTransport::Optional(t) => t.source_gap(),
            AnyTransport::CountQuantifier(t) => t.source_gap(),
            AnyTransport::BackreferenceEscape(t) => t.source_gap(),
            AnyTransport::NamedGroupBackreference(t) => t.source_gap(),
            AnyTransport::DecimalEscape(t) => t.source_gap(),
            AnyTransport::CharacterClassEscape(t) => t.source_gap(),
            AnyTransport::UnicodeCharacterEscape(t) => t.source_gap(),
            AnyTransport::UnicodePropertyValueExpression(t) => t.source_gap(),
            AnyTransport::UnicodePropertyValue(t) => t.source_gap(),
            AnyTransport::ControlEscape(t) => t.source_gap(),
            AnyTransport::ControlLetterEscape(t) => t.source_gap(),
            AnyTransport::IdentityEscape(t) => t.source_gap(),
            AnyTransport::GroupName(t) => t.source_gap(),
            AnyTransport::DecimalDigits(t) => t.source_gap(),
            AnyTransport::TermGroup(t) => t.source_gap(),
            AnyTransport::CountQuantifierGroup(t) => t.source_gap(),
            AnyTransport::CountQuantifierArm(t) => t.source_gap(),
            AnyTransport::CharacterClassEscapeArm(t) => t.source_gap(),
            AnyTransport::UnicodePropertyValueExpressionGroup(t) => t.source_gap(),
            AnyTransport::CharacterClassEscapeText1(t) => t.source_gap(),
            AnyTransport::CharacterClassEscapeText2(t) => t.source_gap(),
            AnyTransport::InlineFlagsGroupEnable(t) => t.source_gap(),
            AnyTransport::InlineFlagsGroupToggle(t) => t.source_gap(),
            AnyTransport::InlineFlagsGroupDisable(t) => t.source_gap(),
            AnyTransport::Lazy(t) => t.source_gap(),
            AnyTransport::UnicodePropertyName(t) => t.source_gap(),
            AnyTransport::AnyCharacter => None,
            AnyTransport::StartAssertion => None,
            AnyTransport::EndAssertion => None,
            AnyTransport::BoundaryAssertion => None,
            AnyTransport::NonBoundaryAssertion => None,
            AnyTransport::Negation => None,
            AnyTransport::Tight => None,
            AnyTransport::Newline => None,
            AnyTransport::Blankline => None,
            AnyTransport::DoubleBlankline => None,
            AnyTransport::Caret => None,
            AnyTransport::LparenQmark => None,
            AnyTransport::Eq => None,
            AnyTransport::Bang => None,
            AnyTransport::Rparen => None,
            AnyTransport::LparenQmarkLt => None,
            AnyTransport::Lbrack => None,
            AnyTransport::Dash => None,
            AnyTransport::BslashDash => None,
            AnyTransport::Rbrack => None,
            AnyTransport::LbrackColon => None,
            AnyTransport::ColonRbrack => None,
            AnyTransport::Lparen => None,
            AnyTransport::LparenQmarkPLt => None,
            AnyTransport::Gt => None,
            AnyTransport::LparenQmarkColon => None,
            AnyTransport::Star => None,
            AnyTransport::Qmark => None,
            AnyTransport::Plus => None,
            AnyTransport::Lbrace => None,
            AnyTransport::Rbrace => None,
            AnyTransport::Bslashk => None,
            AnyTransport::Lt => None,
            AnyTransport::LparenQmarkPEq => None,
            AnyTransport::Comma => None,
            AnyTransport::Colon => None,
            AnyTransport::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            AnyTransport::Pattern(t) => t.gap_edges(),
            AnyTransport::Alternation(t) => t.gap_edges(),
            AnyTransport::Term(t) => t.gap_edges(),
            AnyTransport::LookaroundAssertion(t) => t.gap_edges(),
            AnyTransport::LookaheadAssertion(t) => t.gap_edges(),
            AnyTransport::LookbehindAssertion(t) => t.gap_edges(),
            AnyTransport::PatternCharacter(t) => t.gap_edges(),
            AnyTransport::CharacterClass(t) => t.gap_edges(),
            AnyTransport::PosixCharacterClass(t) => t.gap_edges(),
            AnyTransport::PosixClassName(t) => t.gap_edges(),
            AnyTransport::ClassRange(t) => t.gap_edges(),
            AnyTransport::ClassCharacter(t) => t.gap_edges(),
            AnyTransport::AnonymousCapturingGroup(t) => t.gap_edges(),
            AnyTransport::NamedCapturingGroup(t) => t.gap_edges(),
            AnyTransport::NonCapturingGroup(t) => t.gap_edges(),
            AnyTransport::Flags(t) => t.gap_edges(),
            AnyTransport::ZeroOrMore(t) => t.gap_edges(),
            AnyTransport::OneOrMore(t) => t.gap_edges(),
            AnyTransport::Optional(t) => t.gap_edges(),
            AnyTransport::CountQuantifier(t) => t.gap_edges(),
            AnyTransport::BackreferenceEscape(t) => t.gap_edges(),
            AnyTransport::NamedGroupBackreference(t) => t.gap_edges(),
            AnyTransport::DecimalEscape(t) => t.gap_edges(),
            AnyTransport::CharacterClassEscape(t) => t.gap_edges(),
            AnyTransport::UnicodeCharacterEscape(t) => t.gap_edges(),
            AnyTransport::UnicodePropertyValueExpression(t) => t.gap_edges(),
            AnyTransport::UnicodePropertyValue(t) => t.gap_edges(),
            AnyTransport::ControlEscape(t) => t.gap_edges(),
            AnyTransport::ControlLetterEscape(t) => t.gap_edges(),
            AnyTransport::IdentityEscape(t) => t.gap_edges(),
            AnyTransport::GroupName(t) => t.gap_edges(),
            AnyTransport::DecimalDigits(t) => t.gap_edges(),
            AnyTransport::TermGroup(t) => t.gap_edges(),
            AnyTransport::CountQuantifierGroup(t) => t.gap_edges(),
            AnyTransport::CountQuantifierArm(t) => t.gap_edges(),
            AnyTransport::CharacterClassEscapeArm(t) => t.gap_edges(),
            AnyTransport::UnicodePropertyValueExpressionGroup(t) => t.gap_edges(),
            AnyTransport::CharacterClassEscapeText1(t) => t.gap_edges(),
            AnyTransport::CharacterClassEscapeText2(t) => t.gap_edges(),
            AnyTransport::InlineFlagsGroupEnable(t) => t.gap_edges(),
            AnyTransport::InlineFlagsGroupToggle(t) => t.gap_edges(),
            AnyTransport::InlineFlagsGroupDisable(t) => t.gap_edges(),
            AnyTransport::Lazy(t) => t.gap_edges(),
            AnyTransport::UnicodePropertyName(t) => t.gap_edges(),
            AnyTransport::AnyCharacter => None,
            AnyTransport::StartAssertion => None,
            AnyTransport::EndAssertion => None,
            AnyTransport::BoundaryAssertion => None,
            AnyTransport::NonBoundaryAssertion => None,
            AnyTransport::Negation => None,
            AnyTransport::Tight => None,
            AnyTransport::Newline => None,
            AnyTransport::Blankline => None,
            AnyTransport::DoubleBlankline => None,
            AnyTransport::Caret => None,
            AnyTransport::LparenQmark => None,
            AnyTransport::Eq => None,
            AnyTransport::Bang => None,
            AnyTransport::Rparen => None,
            AnyTransport::LparenQmarkLt => None,
            AnyTransport::Lbrack => None,
            AnyTransport::Dash => None,
            AnyTransport::BslashDash => None,
            AnyTransport::Rbrack => None,
            AnyTransport::LbrackColon => None,
            AnyTransport::ColonRbrack => None,
            AnyTransport::Lparen => None,
            AnyTransport::LparenQmarkPLt => None,
            AnyTransport::Gt => None,
            AnyTransport::LparenQmarkColon => None,
            AnyTransport::Star => None,
            AnyTransport::Qmark => None,
            AnyTransport::Plus => None,
            AnyTransport::Lbrace => None,
            AnyTransport::Rbrace => None,
            AnyTransport::Bslashk => None,
            AnyTransport::Lt => None,
            AnyTransport::LparenQmarkPEq => None,
            AnyTransport::Comma => None,
            AnyTransport::Colon => None,
            AnyTransport::Verbatim(t) => t.gap_edges(),
        }
    }
}


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice, codec_only)]
pub enum TriviaTransport {
    #[kind(kind::_NEWLINE)]
    Newline,
    #[kind(kind::_BLANKLINE)]
    Blankline,
    #[kind(kind::_DOUBLE_BLANKLINE)]
    DoubleBlankline,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
    Text(::sittir_core::trivia::TriviaText),
}

impl ::sittir_core::prepare::Prepare for TriviaTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TriviaTransport::Newline => Ok(()),
            TriviaTransport::Blankline => Ok(()),
            TriviaTransport::DoubleBlankline => Ok(()),
            TriviaTransport::Verbatim(t) => t.prepare(ctx),
            TriviaTransport::Text(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            TriviaTransport::Newline => None,
            TriviaTransport::Blankline => None,
            TriviaTransport::DoubleBlankline => None,
            TriviaTransport::Verbatim(t) => t.source_gap(),
            TriviaTransport::Text(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
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
pub enum PatternContentTransportSlot {
    #[kind(kind::ALTERNATION)]
    Alternation(AlternationTransport),
    #[kind(kind::TERM)]
    Term(TermTransport),
}

impl ::sittir_core::prepare::Prepare for PatternContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            PatternContentTransportSlot::Alternation(t) => t.prepare(ctx),
            PatternContentTransportSlot::Term(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            PatternContentTransportSlot::Alternation(t) => t.source_gap(),
            PatternContentTransportSlot::Term(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            PatternContentTransportSlot::Alternation(t) => t.gap_edges(),
            PatternContentTransportSlot::Term(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for PatternContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Alternation(inner) => inner.kind_in(kinds),
            Self::Term(inner) => inner.kind_in(kinds),
        }
    }
}

impl ::sittir_core::render::Render for PatternContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            PatternContentTransportSlot::Alternation(inner) => inner.render(w),
            PatternContentTransportSlot::Term(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LookaroundAssertionContentTransportSlot {
    #[kind(kind::_LOOKAHEAD_ASSERTION)]
    LookaheadAssertion(Box<LookaheadAssertionTransport>),
    #[kind(kind::_LOOKBEHIND_ASSERTION)]
    LookbehindAssertion(Box<LookbehindAssertionTransport>),
}

impl ::sittir_core::prepare::Prepare for LookaroundAssertionContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LookaroundAssertionContentTransportSlot::LookaheadAssertion(t) => t.prepare(ctx),
            LookaroundAssertionContentTransportSlot::LookbehindAssertion(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            LookaroundAssertionContentTransportSlot::LookaheadAssertion(t) => t.source_gap(),
            LookaroundAssertionContentTransportSlot::LookbehindAssertion(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            LookaroundAssertionContentTransportSlot::LookaheadAssertion(t) => t.gap_edges(),
            LookaroundAssertionContentTransportSlot::LookbehindAssertion(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for LookaroundAssertionContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::LookaheadAssertion(inner) => inner.kind_in(kinds),
            Self::LookbehindAssertion(inner) => inner.kind_in(kinds),
        }
    }
}

impl ::sittir_core::render::Render for LookaroundAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookaroundAssertionContentTransportSlot::LookaheadAssertion(inner) => inner.as_ref().render(w),
            LookaroundAssertionContentTransportSlot::LookbehindAssertion(inner) => inner.as_ref().render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LookaheadAssertionContentTransportSlot {
    #[kind(kind::EQ)]
    Eq,
    #[kind(kind::BANG)]
    Bang,
}

impl ::sittir_core::prepare::Prepare for LookaheadAssertionContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LookaheadAssertionContentTransportSlot::Eq => Ok(()),
            LookaheadAssertionContentTransportSlot::Bang => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LookaheadAssertionContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Eq => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Bang => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for LookaheadAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookaheadAssertionContentTransportSlot::Eq => {
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_EQ_BEFORE);
                let written = render_eq(w);
                written?;
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_EQ_AFTER);
                Ok(())
            }
            LookaheadAssertionContentTransportSlot::Bang => {
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_BANG_BEFORE);
                let written = render_bang(w);
                written?;
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_BANG_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LookbehindAssertionContentTransportSlot {
    #[kind(kind::EQ)]
    Eq,
    #[kind(kind::BANG)]
    Bang,
}

impl ::sittir_core::prepare::Prepare for LookbehindAssertionContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LookbehindAssertionContentTransportSlot::Eq => Ok(()),
            LookbehindAssertionContentTransportSlot::Bang => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LookbehindAssertionContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Eq => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Bang => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for LookbehindAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookbehindAssertionContentTransportSlot::Eq => {
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE);
                let written = render_eq(w);
                written?;
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_EQ_AFTER);
                Ok(())
            }
            LookbehindAssertionContentTransportSlot::Bang => {
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE);
                let written = render_bang(w);
                written?;
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_BANG_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum CharacterClassClassAtomsTransportSlot {
    #[kind(kind::CLASS_CHARACTER, kind::DASH)]
    ClassCharacter(ClassCharacterTransport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE)]
    CharacterClassEscape(Box<CharacterClassEscapeTransport>),
    #[kind(kind::CONTROL_ESCAPE)]
    ControlEscape(ControlEscapeTransport),
    #[kind(kind::CONTROL_LETTER_ESCAPE)]
    ControlLetterEscape(ControlLetterEscapeTransport),
    #[kind(kind::IDENTITY_ESCAPE, folded(kind::BSLASH_DASH))]
    IdentityEscape(IdentityEscapeTransport),
    #[kind(kind::POSIX_CHARACTER_CLASS)]
    PosixCharacterClass(Box<PosixCharacterClassTransport>),
    #[kind(kind::CLASS_RANGE)]
    ClassRange(Box<ClassRangeTransport>),
    #[kind(kind::BSLASH_DASH)]
    BslashDash,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for CharacterClassClassAtomsTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            CharacterClassClassAtomsTransportSlot::ClassCharacter(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::CharacterClassEscape(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::ControlEscape(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::ControlLetterEscape(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::IdentityEscape(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::PosixCharacterClass(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::ClassRange(t) => t.prepare(ctx),
            CharacterClassClassAtomsTransportSlot::BslashDash => Ok(()),
            CharacterClassClassAtomsTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            CharacterClassClassAtomsTransportSlot::ClassCharacter(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::CharacterClassEscape(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::ControlEscape(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::ControlLetterEscape(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::IdentityEscape(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::PosixCharacterClass(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::ClassRange(t) => t.source_gap(),
            CharacterClassClassAtomsTransportSlot::BslashDash => None,
            CharacterClassClassAtomsTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            CharacterClassClassAtomsTransportSlot::ClassCharacter(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::CharacterClassEscape(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::ControlEscape(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::ControlLetterEscape(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::IdentityEscape(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::PosixCharacterClass(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::ClassRange(t) => t.gap_edges(),
            CharacterClassClassAtomsTransportSlot::BslashDash => None,
            CharacterClassClassAtomsTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for CharacterClassClassAtomsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ClassCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::ControlLetterEscape(inner) => inner.kind_in(kinds),
            Self::IdentityEscape(inner) => inner.kind_in(kinds),
            Self::PosixCharacterClass(inner) => inner.kind_in(kinds),
            Self::ClassRange(inner) => inner.kind_in(kinds),
            Self::BslashDash => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(20), ::sittir_core::types::KindId(36), ::sittir_core::types::KindId(76)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for CharacterClassClassAtomsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassClassAtomsTransportSlot::ClassCharacter(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::CharacterClassEscape(inner) => inner.as_ref().render(w),
            CharacterClassClassAtomsTransportSlot::ControlEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::ControlLetterEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::IdentityEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::PosixCharacterClass(inner) => inner.as_ref().render(w),
            CharacterClassClassAtomsTransportSlot::ClassRange(inner) => inner.as_ref().render(w),
            CharacterClassClassAtomsTransportSlot::BslashDash => render_bslash_dash(w),
            CharacterClassClassAtomsTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum ClassRangeStartTransportSlot {
    #[kind(kind::CLASS_CHARACTER)]
    ClassCharacter(ClassCharacterTransport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE)]
    CharacterClassEscape(Box<CharacterClassEscapeTransport>),
    #[kind(kind::CONTROL_ESCAPE)]
    ControlEscape(ControlEscapeTransport),
    #[kind(kind::DASH)]
    Dash,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for ClassRangeStartTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::CharacterClassEscape(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::ControlEscape(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::Dash => Ok(()),
            ClassRangeStartTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(t) => t.source_gap(),
            ClassRangeStartTransportSlot::CharacterClassEscape(t) => t.source_gap(),
            ClassRangeStartTransportSlot::ControlEscape(t) => t.source_gap(),
            ClassRangeStartTransportSlot::Dash => None,
            ClassRangeStartTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(t) => t.gap_edges(),
            ClassRangeStartTransportSlot::CharacterClassEscape(t) => t.gap_edges(),
            ClassRangeStartTransportSlot::ControlEscape(t) => t.gap_edges(),
            ClassRangeStartTransportSlot::Dash => None,
            ClassRangeStartTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for ClassRangeStartTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ClassCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::Dash => [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(20), ::sittir_core::types::KindId(76)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for ClassRangeStartTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(inner) => inner.render(w),
            ClassRangeStartTransportSlot::CharacterClassEscape(inner) => inner.as_ref().render(w),
            ClassRangeStartTransportSlot::ControlEscape(inner) => inner.render(w),
            ClassRangeStartTransportSlot::Dash => {
                w.site_at(options::SITE_CLASS_RANGE_DASH_BEFORE);
                let written = render_dash(w);
                written?;
                w.site_at(options::SITE_CLASS_RANGE_DASH_AFTER);
                Ok(())
            }
            ClassRangeStartTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NamedCapturingGroupContentTransportSlot {
    #[kind(kind::LPAREN_QMARK_LT)]
    LparenQmarkLt,
    #[kind(kind::LPAREN_QMARK_P_LT)]
    LparenQmarkPLt,
}

impl ::sittir_core::prepare::Prepare for NamedCapturingGroupContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedCapturingGroupContentTransportSlot::LparenQmarkLt => Ok(()),
            NamedCapturingGroupContentTransportSlot::LparenQmarkPLt => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedCapturingGroupContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::LparenQmarkLt => [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmarkPLt => [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for NamedCapturingGroupContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedCapturingGroupContentTransportSlot::LparenQmarkLt => {
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_BEFORE);
                let written = render_lparen_qmark_lt(w);
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER);
                Ok(())
            }
            NamedCapturingGroupContentTransportSlot::LparenQmarkPLt => {
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_BEFORE);
                let written = render_lparen_qmark_plt(w);
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum CountQuantifierContentTransportSlot {
    #[kind(kind::COUNT_QUANTIFIER_ARM)]
    CountQuantifierArm(Box<CountQuantifierArmTransport>),
    #[kind(kind::DECIMAL_DIGITS)]
    DecimalDigits(DecimalDigitsTransport),
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for CountQuantifierContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            CountQuantifierContentTransportSlot::CountQuantifierArm(t) => t.prepare(ctx),
            CountQuantifierContentTransportSlot::DecimalDigits(t) => t.prepare(ctx),
            CountQuantifierContentTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            CountQuantifierContentTransportSlot::CountQuantifierArm(t) => t.source_gap(),
            CountQuantifierContentTransportSlot::DecimalDigits(t) => t.source_gap(),
            CountQuantifierContentTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            CountQuantifierContentTransportSlot::CountQuantifierArm(t) => t.gap_edges(),
            CountQuantifierContentTransportSlot::DecimalDigits(t) => t.gap_edges(),
            CountQuantifierContentTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for CountQuantifierContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::CountQuantifierArm(inner) => inner.kind_in(kinds),
            Self::DecimalDigits(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(39)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for CountQuantifierContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CountQuantifierContentTransportSlot::CountQuantifierArm(inner) => inner.as_ref().render(w),
            CountQuantifierContentTransportSlot::DecimalDigits(inner) => inner.render(w),
            CountQuantifierContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum CharacterClassEscapeContentTransportSlot {
    #[kind(kind::CHARACTER_CLASS_ESCAPE_TEXT1)]
    CharacterClassEscapeText1(CharacterClassEscapeText1Transport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE_ARM)]
    CharacterClassEscapeArm(Box<CharacterClassEscapeArmTransport>),
    #[kind(kind::UNICODE_CHARACTER_ESCAPE)]
    UnicodeCharacterEscape(UnicodeCharacterEscapeTransport),
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeText1(t) => t.prepare(ctx),
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(t) => t.prepare(ctx),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(t) => t.prepare(ctx),
            CharacterClassEscapeContentTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeText1(t) => t.source_gap(),
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(t) => t.source_gap(),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(t) => t.source_gap(),
            CharacterClassEscapeContentTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeText1(t) => t.gap_edges(),
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(t) => t.gap_edges(),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(t) => t.gap_edges(),
            CharacterClassEscapeContentTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::CharacterClassEscapeText1(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscapeArm(inner) => inner.kind_in(kinds),
            Self::UnicodeCharacterEscape(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(41), ::sittir_core::types::KindId(74)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for CharacterClassEscapeContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeText1(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(inner) => inner.as_ref().render(w),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum TermGroupQuantifierTransportSlot {
    #[kind(kind::ZERO_OR_MORE)]
    ZeroOrMore(ZeroOrMoreTransport),
    #[kind(kind::ONE_OR_MORE)]
    OneOrMore(OneOrMoreTransport),
    #[kind(kind::OPTIONAL)]
    Optional(OptionalTransport),
    #[kind(kind::COUNT_QUANTIFIER)]
    CountQuantifier(Box<CountQuantifierTransport>),
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for TermGroupQuantifierTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TermGroupQuantifierTransportSlot::ZeroOrMore(t) => t.prepare(ctx),
            TermGroupQuantifierTransportSlot::OneOrMore(t) => t.prepare(ctx),
            TermGroupQuantifierTransportSlot::Optional(t) => t.prepare(ctx),
            TermGroupQuantifierTransportSlot::CountQuantifier(t) => t.prepare(ctx),
            TermGroupQuantifierTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            TermGroupQuantifierTransportSlot::ZeroOrMore(t) => t.source_gap(),
            TermGroupQuantifierTransportSlot::OneOrMore(t) => t.source_gap(),
            TermGroupQuantifierTransportSlot::Optional(t) => t.source_gap(),
            TermGroupQuantifierTransportSlot::CountQuantifier(t) => t.source_gap(),
            TermGroupQuantifierTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            TermGroupQuantifierTransportSlot::ZeroOrMore(t) => t.gap_edges(),
            TermGroupQuantifierTransportSlot::OneOrMore(t) => t.gap_edges(),
            TermGroupQuantifierTransportSlot::Optional(t) => t.gap_edges(),
            TermGroupQuantifierTransportSlot::CountQuantifier(t) => t.gap_edges(),
            TermGroupQuantifierTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for TermGroupQuantifierTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ZeroOrMore(inner) => inner.kind_in(kinds),
            Self::OneOrMore(inner) => inner.kind_in(kinds),
            Self::Optional(inner) => inner.kind_in(kinds),
            Self::CountQuantifier(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(67), ::sittir_core::types::KindId(68), ::sittir_core::types::KindId(69)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for TermGroupQuantifierTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TermGroupQuantifierTransportSlot::ZeroOrMore(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::OneOrMore(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::Optional(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::CountQuantifier(inner) => inner.as_ref().render(w),
            TermGroupQuantifierTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum TermGroupContentTransportSlot {
    #[kind(kind::LOOKAROUND_ASSERTION)]
    LookaroundAssertion(LookaroundAssertionTransport),
    #[kind(kind::PATTERN_CHARACTER)]
    PatternCharacter(PatternCharacterTransport),
    #[kind(kind::CHARACTER_CLASS)]
    CharacterClass(CharacterClassTransport),
    #[kind(kind::POSIX_CHARACTER_CLASS)]
    PosixCharacterClass(Box<PosixCharacterClassTransport>),
    #[kind(kind::DECIMAL_ESCAPE)]
    DecimalEscape(DecimalEscapeTransport),
    #[kind(kind::CHARACTER_CLASS_ESCAPE)]
    CharacterClassEscape(Box<CharacterClassEscapeTransport>),
    #[kind(kind::CONTROL_ESCAPE)]
    ControlEscape(ControlEscapeTransport),
    #[kind(kind::CONTROL_LETTER_ESCAPE)]
    ControlLetterEscape(ControlLetterEscapeTransport),
    #[kind(kind::IDENTITY_ESCAPE, kind::BSLASH_DASH, folded(kind::BSLASH_DASH))]
    IdentityEscape(IdentityEscapeTransport),
    #[kind(kind::BACKREFERENCE_ESCAPE)]
    BackreferenceEscape(Box<BackreferenceEscapeTransport>),
    #[kind(kind::NAMED_GROUP_BACKREFERENCE)]
    NamedGroupBackreference(Box<NamedGroupBackreferenceTransport>),
    #[kind(kind::ANONYMOUS_CAPTURING_GROUP)]
    AnonymousCapturingGroup(Box<AnonymousCapturingGroupTransport>),
    #[kind(kind::NAMED_CAPTURING_GROUP)]
    NamedCapturingGroup(Box<NamedCapturingGroupTransport>),
    #[kind(kind::NON_CAPTURING_GROUP)]
    NonCapturingGroup(Box<NonCapturingGroupTransport>),
    #[kind(kind::INLINE_FLAGS_GROUP_ENABLE)]
    InlineFlagsGroupEnable(Box<InlineFlagsGroupEnableTransport>),
    #[kind(kind::INLINE_FLAGS_GROUP_TOGGLE)]
    InlineFlagsGroupToggle(Box<InlineFlagsGroupToggleTransport>),
    #[kind(kind::INLINE_FLAGS_GROUP_DISABLE)]
    InlineFlagsGroupDisable(Box<InlineFlagsGroupDisableTransport>),
    #[kind(kind::START_ASSERTION, kind::CARET)]
    StartAssertion,
    #[kind(kind::END_ASSERTION)]
    EndAssertion,
    #[kind(kind::BOUNDARY_ASSERTION)]
    BoundaryAssertion,
    #[kind(kind::NON_BOUNDARY_ASSERTION)]
    NonBoundaryAssertion,
    #[kind(kind::ANY_CHARACTER)]
    AnyCharacter,
    #[transport(verbatim)]
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for TermGroupContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TermGroupContentTransportSlot::LookaroundAssertion(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::PatternCharacter(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::CharacterClass(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::PosixCharacterClass(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::DecimalEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::CharacterClassEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::ControlEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::ControlLetterEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::IdentityEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::BackreferenceEscape(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::NamedGroupBackreference(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::AnonymousCapturingGroup(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::NamedCapturingGroup(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::NonCapturingGroup(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::InlineFlagsGroupEnable(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::InlineFlagsGroupToggle(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::InlineFlagsGroupDisable(t) => t.prepare(ctx),
            TermGroupContentTransportSlot::StartAssertion => Ok(()),
            TermGroupContentTransportSlot::EndAssertion => Ok(()),
            TermGroupContentTransportSlot::BoundaryAssertion => Ok(()),
            TermGroupContentTransportSlot::NonBoundaryAssertion => Ok(()),
            TermGroupContentTransportSlot::AnyCharacter => Ok(()),
            TermGroupContentTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
    fn source_gap(&self) -> Option<&::sittir_core::slot::SourceGap> {
        match self {
            TermGroupContentTransportSlot::LookaroundAssertion(t) => t.source_gap(),
            TermGroupContentTransportSlot::PatternCharacter(t) => t.source_gap(),
            TermGroupContentTransportSlot::CharacterClass(t) => t.source_gap(),
            TermGroupContentTransportSlot::PosixCharacterClass(t) => t.source_gap(),
            TermGroupContentTransportSlot::DecimalEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::CharacterClassEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::ControlEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::ControlLetterEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::IdentityEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::BackreferenceEscape(t) => t.source_gap(),
            TermGroupContentTransportSlot::NamedGroupBackreference(t) => t.source_gap(),
            TermGroupContentTransportSlot::AnonymousCapturingGroup(t) => t.source_gap(),
            TermGroupContentTransportSlot::NamedCapturingGroup(t) => t.source_gap(),
            TermGroupContentTransportSlot::NonCapturingGroup(t) => t.source_gap(),
            TermGroupContentTransportSlot::InlineFlagsGroupEnable(t) => t.source_gap(),
            TermGroupContentTransportSlot::InlineFlagsGroupToggle(t) => t.source_gap(),
            TermGroupContentTransportSlot::InlineFlagsGroupDisable(t) => t.source_gap(),
            TermGroupContentTransportSlot::StartAssertion => None,
            TermGroupContentTransportSlot::EndAssertion => None,
            TermGroupContentTransportSlot::BoundaryAssertion => None,
            TermGroupContentTransportSlot::NonBoundaryAssertion => None,
            TermGroupContentTransportSlot::AnyCharacter => None,
            TermGroupContentTransportSlot::Verbatim(t) => t.source_gap(),
        }
    }
    fn gap_edges(&mut self) -> Option<&mut ::sittir_core::options::Edges> {
        match self {
            TermGroupContentTransportSlot::LookaroundAssertion(t) => t.gap_edges(),
            TermGroupContentTransportSlot::PatternCharacter(t) => t.gap_edges(),
            TermGroupContentTransportSlot::CharacterClass(t) => t.gap_edges(),
            TermGroupContentTransportSlot::PosixCharacterClass(t) => t.gap_edges(),
            TermGroupContentTransportSlot::DecimalEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::CharacterClassEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::ControlEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::ControlLetterEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::IdentityEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::BackreferenceEscape(t) => t.gap_edges(),
            TermGroupContentTransportSlot::NamedGroupBackreference(t) => t.gap_edges(),
            TermGroupContentTransportSlot::AnonymousCapturingGroup(t) => t.gap_edges(),
            TermGroupContentTransportSlot::NamedCapturingGroup(t) => t.gap_edges(),
            TermGroupContentTransportSlot::NonCapturingGroup(t) => t.gap_edges(),
            TermGroupContentTransportSlot::InlineFlagsGroupEnable(t) => t.gap_edges(),
            TermGroupContentTransportSlot::InlineFlagsGroupToggle(t) => t.gap_edges(),
            TermGroupContentTransportSlot::InlineFlagsGroupDisable(t) => t.gap_edges(),
            TermGroupContentTransportSlot::StartAssertion => None,
            TermGroupContentTransportSlot::EndAssertion => None,
            TermGroupContentTransportSlot::BoundaryAssertion => None,
            TermGroupContentTransportSlot::NonBoundaryAssertion => None,
            TermGroupContentTransportSlot::AnyCharacter => None,
            TermGroupContentTransportSlot::Verbatim(t) => t.gap_edges(),
        }
    }
}

impl ::sittir_core::view::KindOf for TermGroupContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::LookaroundAssertion(inner) => inner.kind_in(kinds),
            Self::PatternCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClass(inner) => inner.kind_in(kinds),
            Self::PosixCharacterClass(inner) => inner.kind_in(kinds),
            Self::DecimalEscape(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::ControlLetterEscape(inner) => inner.kind_in(kinds),
            Self::IdentityEscape(inner) => inner.kind_in(kinds),
            Self::BackreferenceEscape(inner) => inner.kind_in(kinds),
            Self::NamedGroupBackreference(inner) => inner.kind_in(kinds),
            Self::AnonymousCapturingGroup(inner) => inner.kind_in(kinds),
            Self::NamedCapturingGroup(inner) => inner.kind_in(kinds),
            Self::NonCapturingGroup(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupEnable(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupToggle(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupDisable(inner) => inner.kind_in(kinds),
            Self::StartAssertion => [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k)),
            Self::EndAssertion => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::BoundaryAssertion => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
            Self::NonBoundaryAssertion => [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k)),
            Self::AnyCharacter => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(12), ::sittir_core::types::KindId(34), ::sittir_core::types::KindId(36), ::sittir_core::types::KindId(76)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for TermGroupContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TermGroupContentTransportSlot::LookaroundAssertion(inner) => inner.render(w),
            TermGroupContentTransportSlot::PatternCharacter(inner) => inner.render(w),
            TermGroupContentTransportSlot::CharacterClass(inner) => inner.render(w),
            TermGroupContentTransportSlot::PosixCharacterClass(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::DecimalEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::CharacterClassEscape(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::ControlEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::ControlLetterEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::IdentityEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::BackreferenceEscape(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::NamedGroupBackreference(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::AnonymousCapturingGroup(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::NamedCapturingGroup(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::NonCapturingGroup(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupEnable(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupToggle(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupDisable(inner) => inner.as_ref().render(w),
            TermGroupContentTransportSlot::StartAssertion => {
                let written = render_start_assertion(w);
                written?;
                w.site_at(options::SITE_TERM_GROUP_CARET_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::EndAssertion => {
                let written = render_end_assertion(w);
                written?;
                w.site_at(options::SITE_TERM_GROUP_END_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::BoundaryAssertion => {
                let written = render_boundary_assertion(w);
                written?;
                w.site_at(options::SITE_TERM_GROUP_BOUNDARY_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::NonBoundaryAssertion => {
                let written = render_non_boundary_assertion(w);
                written?;
                w.site_at(options::SITE_TERM_GROUP_NON_BOUNDARY_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::AnyCharacter => {
                let written = render_any_character(w);
                written?;
                w.site_at(options::SITE_TERM_GROUP_ANY_CHARACTER_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LazyContentTransportSlot {
    #[kind(kind::QMARK)]
    Qmark,
}

impl ::sittir_core::prepare::Prepare for LazyContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LazyContentTransportSlot::Qmark => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LazyContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Qmark => [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for LazyContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LazyContentTransportSlot::Qmark => render_qmark(w),
        }
    }
}


#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::PATTERN)]
pub struct PatternTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<PatternContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for PatternTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(51)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PatternTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(51) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for PatternTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(51)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_pattern(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PatternTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let first = [::sittir_core::prepare::EdgeItems::first_item(&self.content)].into_iter().flatten().next();
        let last = [::sittir_core::prepare::EdgeItems::last_item(&self.content)].into_iter().flatten().next();
        let flanks = ::sittir_core::prepare::root_flanks(first, last, options::allowed(options::SITE_PATTERN_PATTERN_BEFORE), options::allowed(options::SITE_PATTERN_PATTERN_AFTER), &options::WHITESPACE, ctx);
        ::sittir_core::prepare::fill_edges(self, flanks);
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
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
#[transport(kind = kind::ALTERNATION)]
pub struct AlternationTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_terms")]
    #[slot(field = field::TERMS, separator = kind::PIPE)]
    pub terms: Vec<Option<::sittir_core::SlotValue<TermTransport>>>,
    #[wire(key = "_terms_separator_space_before")]
    pub terms_separator_space_before: Option<u16>,
    #[wire(key = "_terms_separator_space_after")]
    pub terms_separator_space_after: Option<u16>,
}

impl ::sittir_core::view::KindOf for AlternationTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(52)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AlternationTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(52) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for AlternationTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(52)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_alternation(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AlternationTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        ::sittir_core::prepare::fill_list_gaps(self.terms.iter_mut().map(Option::as_mut), "|", options::allowed(options::SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_BEFORE), options::allowed(options::SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_AFTER), &options::WHITESPACE, ctx);
        self.terms_separator_space_before.get_or_insert(ctx.options.spacing[options::SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_BEFORE].arm);
        self.terms_separator_space_after.get_or_insert(ctx.options.spacing[options::SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_AFTER].arm);
        self.terms.prepare(ctx)?;
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
#[transport(kind = kind::TERM)]
pub struct TermTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_term_group")]
    #[slot]
    pub term_group: Vec<::sittir_core::SlotValue<TermGroupTransport>>,
    #[wire(key = "_term_group_separator_space")]
    pub term_group_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for TermTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(53)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TermTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(53) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for TermTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(53)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_term(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for TermTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        ::sittir_core::prepare::fill_list_gaps(self.term_group.iter_mut().map(Some), "", options::allowed(options::SITE_TERM_TERM_GROUP_SEPARATOR_SPACE), &[], &options::WHITESPACE, ctx);
        self.term_group_separator_space.get_or_insert(ctx.options.spacing[options::SITE_TERM_TERM_GROUP_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.term_group.iter_mut().map(Some), options::SEATS_TERM_TERM_GROUP, ctx);
        self.term_group.prepare(ctx)?;
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
pub enum AnyCharacterTransport {
    #[kind(kind::ANY_CHARACTER)]
    AnyCharacter,
}

impl ::sittir_core::view::KindOf for AnyCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for AnyCharacterTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for AnyCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_any_character(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum StartAssertionTransport {
    #[kind(kind::START_ASSERTION)]
    StartAssertion,
}

impl ::sittir_core::view::KindOf for StartAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for StartAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for StartAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_start_assertion(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum EndAssertionTransport {
    #[kind(kind::END_ASSERTION)]
    EndAssertion,
}

impl ::sittir_core::view::KindOf for EndAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for EndAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for EndAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_end_assertion(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BoundaryAssertionTransport {
    #[kind(kind::BOUNDARY_ASSERTION)]
    BoundaryAssertion,
}

impl ::sittir_core::view::KindOf for BoundaryAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for BoundaryAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for BoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_boundary_assertion(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum NonBoundaryAssertionTransport {
    #[kind(kind::NON_BOUNDARY_ASSERTION)]
    NonBoundaryAssertion,
}

impl ::sittir_core::view::KindOf for NonBoundaryAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for NonBoundaryAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for NonBoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_non_boundary_assertion(w)
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::LOOKAROUND_ASSERTION)]
pub struct LookaroundAssertionTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<LookaroundAssertionContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for LookaroundAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(55)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookaroundAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(55) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for LookaroundAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(55)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_lookaround_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookaroundAssertionTransport {
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
#[transport(kind = kind::_LOOKAHEAD_ASSERTION, layout = [kind::LPAREN_QMARK, kind::EQ, kind::BANG, kind::RPAREN])]
pub struct LookaheadAssertionTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<LookaheadAssertionContentTransportSlot>,
    #[wire(key = "_pattern")]
    #[slot]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for LookaheadAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(56)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookaheadAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(56) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for LookaheadAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(56)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_lookahead_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookaheadAssertionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::_LOOKBEHIND_ASSERTION, layout = [kind::LPAREN_QMARK_LT, kind::EQ, kind::BANG, kind::RPAREN])]
pub struct LookbehindAssertionTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<LookbehindAssertionContentTransportSlot>,
    #[wire(key = "_pattern")]
    #[slot]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for LookbehindAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(57)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookbehindAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(57) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for LookbehindAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(57)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_lookbehind_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookbehindAssertionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::PATTERN_CHARACTER, text)]
pub struct PatternCharacterTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for PatternCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PatternCharacterTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(12) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for PatternCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(12)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PatternCharacterTransport {
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
#[transport(kind = kind::CHARACTER_CLASS, layout = [kind::LBRACK, kind::RBRACK], gap(1) = negation)]
pub struct CharacterClassTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_leading")]
    #[slot(field = field::LEADING, presence = kind::CLASS_CHARACTER)]
    pub leading: Option<bool>,
    #[wire(key = "_class_atoms")]
    #[slot(field = field::CLASS_ATOMS)]
    pub class_atoms: Option<Vec<::sittir_core::SlotValue<CharacterClassClassAtomsTransportSlot>>>,
    #[wire(key = "_trailing")]
    #[slot(field = field::TRAILING, presence = kind::CLASS_CHARACTER)]
    pub trailing: Option<bool>,
    #[wire(key = "_negation")]
    #[slot(presence = kind::_NEGATION)]
    pub negation: Option<bool>,
}

impl ::sittir_core::view::KindOf for CharacterClassTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(58)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(58) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CharacterClassTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(58)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_character_class(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.leading.prepare(ctx)?;
        self.class_atoms.prepare(ctx)?;
        self.trailing.prepare(ctx)?;
        self.negation.prepare(ctx)?;
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
#[transport(kind = kind::POSIX_CHARACTER_CLASS, layout = [kind::LBRACK_COLON, kind::COLON_RBRACK])]
pub struct PosixCharacterClassTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_posix_class_name")]
    #[slot(field = field::POSIX_CLASS_NAME)]
    pub posix_class_name: ::sittir_core::SlotValue<PosixClassNameTransport>,
}

impl ::sittir_core::view::KindOf for PosixCharacterClassTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(59)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PosixCharacterClassTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(59) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for PosixCharacterClassTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(59)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_posix_character_class(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PosixCharacterClassTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.posix_class_name.prepare(ctx)?;
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
#[transport(kind = kind::POSIX_CLASS_NAME, text)]
pub struct PosixClassNameTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for PosixClassNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(60)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PosixClassNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(60) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for PosixClassNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(60)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PosixClassNameTransport {
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
#[transport(kind = kind::CLASS_RANGE, layout = [kind::DASH])]
pub struct ClassRangeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_start")]
    #[slot(field = field::START)]
    pub start: ::sittir_core::SlotValue<ClassRangeStartTransportSlot>,
    #[wire(key = "_end")]
    #[slot(field = field::END)]
    pub end: ::sittir_core::SlotValue<ClassRangeStartTransportSlot>,
}

impl ::sittir_core::view::KindOf for ClassRangeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(61)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ClassRangeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(61) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ClassRangeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(61)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_class_range(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ClassRangeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.start.prepare(ctx)?;
        self.end.prepare(ctx)?;
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
#[transport(kind = kind::CLASS_CHARACTER, text)]
pub struct ClassCharacterTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for ClassCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ClassCharacterTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(20) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ClassCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(20)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ClassCharacterTransport {
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
#[transport(kind = kind::ANONYMOUS_CAPTURING_GROUP, layout = [kind::LPAREN, kind::RPAREN])]
pub struct AnonymousCapturingGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for AnonymousCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(62)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnonymousCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(62) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for AnonymousCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(62)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_anonymous_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AnonymousCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::NAMED_CAPTURING_GROUP, layout = [kind::LPAREN_QMARK_LT, kind::LPAREN_QMARK_P_LT, kind::GT, kind::RPAREN])]
pub struct NamedCapturingGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_group_name")]
    #[slot(field = field::GROUP_NAME)]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<NamedCapturingGroupContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for NamedCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(63)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(63) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
    fn edge_arm_kinds(&self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> (Option<::sittir_core::types::KindId>, Option<::sittir_core::types::KindId>) {
        use ::sittir_core::prepare::ArmOf;
        (self.content.arm_among(ctx, ctx.options.edge_arm_sites(::sittir_core::types::KindId(63), ::sittir_core::options::Side::Before)), None)
    }
}

impl ::sittir_core::render::Render for NamedCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(63)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::NON_CAPTURING_GROUP, layout = [kind::LPAREN_QMARK_COLON, kind::RPAREN])]
pub struct NonCapturingGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for NonCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(64)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NonCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(64) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NonCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(64)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_non_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NonCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::FLAGS, text)]
pub struct FlagsTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for FlagsTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(66)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for FlagsTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(66) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for FlagsTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(66)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for FlagsTransport {
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
#[transport(kind = kind::ZERO_OR_MORE, text)]
pub struct ZeroOrMoreTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for ZeroOrMoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(67)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ZeroOrMoreTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(67) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ZeroOrMoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(67)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ZeroOrMoreTransport {
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
#[transport(kind = kind::ONE_OR_MORE, text)]
pub struct OneOrMoreTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for OneOrMoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(68)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for OneOrMoreTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(68) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for OneOrMoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(68)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for OneOrMoreTransport {
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
#[transport(kind = kind::OPTIONAL, text)]
pub struct OptionalTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for OptionalTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(69)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for OptionalTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(69) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for OptionalTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(69)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for OptionalTransport {
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
#[transport(kind = kind::COUNT_QUANTIFIER, layout = [kind::LBRACE, kind::RBRACE, kind::_LAZY])]
pub struct CountQuantifierTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<CountQuantifierContentTransportSlot>,
    #[wire(key = "_lazy")]
    #[slot(presence = kind::_LAZY)]
    pub lazy: Option<bool>,
}

impl ::sittir_core::view::KindOf for CountQuantifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(70)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(70) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CountQuantifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(70)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_count_quantifier(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        self.lazy.prepare(ctx)?;
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
#[transport(kind = kind::BACKREFERENCE_ESCAPE, layout = [kind::BSLASHK, kind::LT, kind::GT])]
pub struct BackreferenceEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_group_name")]
    #[slot(field = field::GROUP_NAME)]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
}

impl ::sittir_core::view::KindOf for BackreferenceEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(71)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BackreferenceEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(71) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for BackreferenceEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(71)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_backreference_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for BackreferenceEscapeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
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
#[transport(kind = kind::NAMED_GROUP_BACKREFERENCE, layout = [kind::LPAREN_QMARK_P_EQ, kind::RPAREN])]
pub struct NamedGroupBackreferenceTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_group_name")]
    #[slot(field = field::GROUP_NAME)]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
}

impl ::sittir_core::view::KindOf for NamedGroupBackreferenceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(72)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedGroupBackreferenceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(72) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for NamedGroupBackreferenceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(72)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_named_group_backreference(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedGroupBackreferenceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
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
#[transport(kind = kind::DECIMAL_ESCAPE, text)]
pub struct DecimalEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for DecimalEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(34)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DecimalEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(34) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for DecimalEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(34)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DecimalEscapeTransport {
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
#[transport(kind = kind::CHARACTER_CLASS_ESCAPE)]
pub struct CharacterClassEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<CharacterClassEscapeContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(73)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(73) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CharacterClassEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(73)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_character_class_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeTransport {
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
#[transport(kind = kind::UNICODE_CHARACTER_ESCAPE, text)]
pub struct UnicodeCharacterEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for UnicodeCharacterEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(74)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodeCharacterEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(74) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for UnicodeCharacterEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(74)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodeCharacterEscapeTransport {
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
#[transport(kind = kind::UNICODE_PROPERTY_VALUE_EXPRESSION)]
pub struct UnicodePropertyValueExpressionTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_unicode_property_value_expression_group")]
    #[slot]
    pub unicode_property_value_expression_group: Option<::sittir_core::SlotValue<UnicodePropertyValueExpressionGroupTransport>>,
    #[wire(key = "_unicode_property_value")]
    #[slot]
    pub unicode_property_value: ::sittir_core::SlotValue<UnicodePropertyValueTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyValueExpressionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyValueExpressionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(75) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for UnicodePropertyValueExpressionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(75)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_unicode_property_value_expression(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyValueExpressionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_value_expression_group.prepare(ctx)?;
        self.unicode_property_value.prepare(ctx)?;
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
#[transport(kind = kind::UNICODE_PROPERTY_VALUE, text)]
pub struct UnicodePropertyValueTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for UnicodePropertyValueTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(35)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyValueTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(35) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for UnicodePropertyValueTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(35)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyValueTransport {
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
#[transport(kind = kind::CONTROL_ESCAPE, text)]
pub struct ControlEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for ControlEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(76)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ControlEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(76) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ControlEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(76)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ControlEscapeTransport {
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
#[transport(kind = kind::CONTROL_LETTER_ESCAPE, text)]
pub struct ControlLetterEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for ControlLetterEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(36)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ControlLetterEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(36) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for ControlLetterEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(36)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ControlLetterEscapeTransport {
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
#[transport(kind = kind::IDENTITY_ESCAPE, folded = [kind::BSLASH_DASH], interior = "^\\\\(?<content>(?:[^kdDsSpPwWbfnrtv0-9]))$")]
pub struct IdentityEscapeTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    #[slot(capture = "content")]
    pub content: String,
}

impl ::sittir_core::view::KindOf for IdentityEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(37)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for IdentityEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(37) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for IdentityEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(37)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_identity_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for IdentityEscapeTransport {
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
#[transport(kind = kind::GROUP_NAME, text)]
pub struct GroupNameTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for GroupNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(38)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(38) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for GroupNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(38)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for GroupNameTransport {
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
#[transport(kind = kind::DECIMAL_DIGITS, text)]
pub struct DecimalDigitsTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for DecimalDigitsTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(39)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DecimalDigitsTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(39) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for DecimalDigitsTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(39)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DecimalDigitsTransport {
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
#[transport(kind = kind::TERM_GROUP)]
pub struct TermGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_quantifier")]
    #[slot(field = field::QUANTIFIER)]
    pub quantifier: Option<::sittir_core::SlotValue<TermGroupQuantifierTransportSlot>>,
    #[wire(key = "_content")]
    #[slot]
    pub content: ::sittir_core::SlotValue<TermGroupContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for TermGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(77)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TermGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(77) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for TermGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(77)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_term_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for TermGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.quantifier.prepare(ctx)?;
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
#[transport(kind = kind::COUNT_QUANTIFIER_GROUP, layout = [kind::COMMA])]
pub struct CountQuantifierGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_decimal_digits")]
    #[slot]
    pub decimal_digits: Option<::sittir_core::SlotValue<DecimalDigitsTransport>>,
}

impl ::sittir_core::view::KindOf for CountQuantifierGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(78)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(78) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CountQuantifierGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(78)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_count_quantifier_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.decimal_digits.prepare(ctx)?;
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
#[transport(kind = kind::COUNT_QUANTIFIER_ARM)]
pub struct CountQuantifierArmTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_decimal_digits")]
    #[slot]
    pub decimal_digits: ::sittir_core::SlotValue<DecimalDigitsTransport>,
    #[wire(key = "_count_quantifier_group")]
    #[slot]
    pub count_quantifier_group: Option<::sittir_core::SlotValue<CountQuantifierGroupTransport>>,
}

impl ::sittir_core::view::KindOf for CountQuantifierArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(79)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(79) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CountQuantifierArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(79)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_count_quantifier_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.decimal_digits.prepare(ctx)?;
        self.count_quantifier_group.prepare(ctx)?;
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
#[transport(kind = kind::CHARACTER_CLASS_ESCAPE_ARM, layout = [kind::LBRACE, kind::RBRACE])]
pub struct CharacterClassEscapeArmTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_unicode_property_value_expression")]
    #[slot(field = field::UNICODE_PROPERTY_VALUE_EXPRESSION)]
    pub unicode_property_value_expression: ::sittir_core::SlotValue<UnicodePropertyValueExpressionTransport>,
    #[wire(key = "_character_class_escape_text2")]
    #[slot]
    pub character_class_escape_text2: ::sittir_core::SlotValue<CharacterClassEscapeText2Transport>,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(80)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(80) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CharacterClassEscapeArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(80)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_character_class_escape_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_value_expression.prepare(ctx)?;
        self.character_class_escape_text2.prepare(ctx)?;
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
#[transport(kind = kind::UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP, layout = [kind::EQ])]
pub struct UnicodePropertyValueExpressionGroupTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_unicode_property_name")]
    #[slot]
    pub unicode_property_name: ::sittir_core::SlotValue<UnicodePropertyNameTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyValueExpressionGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(81)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyValueExpressionGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(81) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for UnicodePropertyValueExpressionGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(81)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_unicode_property_value_expression_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyValueExpressionGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_name.prepare(ctx)?;
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
#[transport(kind = kind::CHARACTER_CLASS_ESCAPE_TEXT1, text)]
pub struct CharacterClassEscapeText1Transport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeText1Transport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(41)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeText1Transport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(41) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CharacterClassEscapeText1Transport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(41)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeText1Transport {
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
#[transport(kind = kind::CHARACTER_CLASS_ESCAPE_TEXT2, text)]
pub struct CharacterClassEscapeText2Transport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "$text")]
    pub text: String,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeText2Transport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(42)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeText2Transport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(42) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for CharacterClassEscapeText2Transport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(42)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeText2Transport {
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
pub enum NegationTransport {
    #[kind(kind::_NEGATION)]
    Negation,
}

impl ::sittir_core::view::KindOf for NegationTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(82)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for NegationTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for NegationTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_negation(w)
    }
}

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::INLINE_FLAGS_GROUP_ENABLE, layout = [kind::LPAREN_QMARK, kind::COLON, kind::RPAREN])]
pub struct InlineFlagsGroupEnableTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_enabled")]
    #[slot(field = field::ENABLED)]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupEnableTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(83)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupEnableTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(83) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for InlineFlagsGroupEnableTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(83)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_inline_flags_group_enable(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupEnableTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.enabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::INLINE_FLAGS_GROUP_TOGGLE, layout = [kind::LPAREN_QMARK, kind::DASH, kind::COLON, kind::RPAREN])]
pub struct InlineFlagsGroupToggleTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_enabled")]
    #[slot(field = field::ENABLED)]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[wire(key = "_disabled")]
    #[slot(field = field::DISABLED)]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupToggleTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(84)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupToggleTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(84) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for InlineFlagsGroupToggleTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(84)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_inline_flags_group_toggle(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupToggleTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.enabled.prepare(ctx)?;
        self.disabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
#[transport(kind = kind::INLINE_FLAGS_GROUP_DISABLE, layout = [kind::LPAREN_QMARK, kind::DASH, kind::COLON, kind::RPAREN])]
pub struct InlineFlagsGroupDisableTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_disabled")]
    #[slot(field = field::DISABLED)]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[wire(key = "_pattern")]
    #[slot(field = field::PATTERN)]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupDisableTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(85)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupDisableTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(85) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for InlineFlagsGroupDisableTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(85)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_inline_flags_group_disable(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupDisableTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.layout.prepare(ctx)?;
        let flank = self.layout.take_flank();
        ::sittir_core::prepare::fill_source_flanks(self, flank.as_ref(), options::allowed, &options::WHITESPACE, ctx);
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.disabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
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
        [::sittir_core::types::KindId(47)].iter().any(|k| kinds.contains(k))
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
pub enum NewlineTransport {
    #[kind(kind::_NEWLINE)]
    Newline,
}

impl ::sittir_core::view::KindOf for NewlineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(48)].iter().any(|k| kinds.contains(k))
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
        [::sittir_core::types::KindId(49)].iter().any(|k| kinds.contains(k))
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
        [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k))
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

#[derive(Debug, Clone, PartialEq, ::sittir_core::Transport)]
#[transport(kind = kind::_LAZY, display, envelope, content = content)]
pub struct LazyTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    pub content: ::sittir_core::SlotValue<LazyContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for LazyTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(89)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LazyTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(89) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for LazyTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(89)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_lazy(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LazyTransport {
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
#[transport(kind = kind::_UNICODE_PROPERTY_NAME, display, envelope, content = content)]
pub struct UnicodePropertyNameTransport {
    #[wire(key = "$_layout")]
    pub layout: Option<TransportLayout>,
    #[wire(key = "_content")]
    pub content: ::sittir_core::SlotValue<UnicodePropertyValueTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(90)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(90) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.layout.edges() }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.layout.edges_mut() }
}

impl ::sittir_core::render::Render for UnicodePropertyNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        TransportLayout::render(self.layout.as_ref(), Some(::sittir_core::types::KindId(90)), ::sittir_core::layout::TriviaRole::Owner, w, |w| render_unicode_property_name(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyNameTransport {
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

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum CaretTransport {
    #[kind(kind::CARET)]
    Caret,
}

impl ::sittir_core::view::KindOf for CaretTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for CaretTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for CaretTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_caret(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LparenQmarkTransport {
    #[kind(kind::LPAREN_QMARK)]
    LparenQmark,
}

impl ::sittir_core::view::KindOf for LparenQmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenQmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum EqTransport {
    #[kind(kind::EQ)]
    Eq,
}

impl ::sittir_core::view::KindOf for EqTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for EqTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for EqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_eq(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BangTransport {
    #[kind(kind::BANG)]
    Bang,
}

impl ::sittir_core::view::KindOf for BangTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k))
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
pub enum RparenTransport {
    #[kind(kind::RPAREN)]
    Rparen,
}

impl ::sittir_core::view::KindOf for RparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(10)].iter().any(|k| kinds.contains(k))
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
pub enum LparenQmarkLtTransport {
    #[kind(kind::LPAREN_QMARK_LT)]
    LparenQmarkLt,
}

impl ::sittir_core::view::KindOf for LparenQmarkLtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkLtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenQmarkLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_lt(w)
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
        [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k))
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
pub enum DashTransport {
    #[kind(kind::DASH)]
    Dash,
}

impl ::sittir_core::view::KindOf for DashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for DashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for DashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_dash(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BslashDashTransport {
    #[kind(kind::BSLASH_DASH)]
    BslashDash,
}

impl ::sittir_core::view::KindOf for BslashDashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for BslashDashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for BslashDashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bslash_dash(w)
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
        [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k))
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
pub enum LbrackColonTransport {
    #[kind(kind::LBRACK_COLON)]
    LbrackColon,
}

impl ::sittir_core::view::KindOf for LbrackColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LbrackColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LbrackColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrack_colon(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum ColonRbrackTransport {
    #[kind(kind::COLON_RBRACK)]
    ColonRbrack,
}

impl ::sittir_core::view::KindOf for ColonRbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for ColonRbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for ColonRbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_colon_rbrack(w)
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
        [::sittir_core::types::KindId(21)].iter().any(|k| kinds.contains(k))
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
pub enum LparenQmarkPLtTransport {
    #[kind(kind::LPAREN_QMARK_P_LT)]
    LparenQmarkPLt,
}

impl ::sittir_core::view::KindOf for LparenQmarkPLtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkPLtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenQmarkPLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_plt(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum GtTransport {
    #[kind(kind::GT)]
    Gt,
}

impl ::sittir_core::view::KindOf for GtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for GtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for GtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_gt(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LparenQmarkColonTransport {
    #[kind(kind::LPAREN_QMARK_COLON)]
    LparenQmarkColon,
}

impl ::sittir_core::view::KindOf for LparenQmarkColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenQmarkColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_colon(w)
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
        [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k))
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
pub enum QmarkTransport {
    #[kind(kind::QMARK)]
    Qmark,
}

impl ::sittir_core::view::KindOf for QmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k))
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
pub enum PlusTransport {
    #[kind(kind::PLUS)]
    Plus,
}

impl ::sittir_core::view::KindOf for PlusTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k))
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
pub enum LbraceTransport {
    #[kind(kind::LBRACE)]
    Lbrace,
}

impl ::sittir_core::view::KindOf for LbraceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LbraceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrace(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum RbraceTransport {
    #[kind(kind::RBRACE)]
    Rbrace,
}

impl ::sittir_core::view::KindOf for RbraceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for RbraceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for RbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rbrace(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum BslashkTransport {
    #[kind(kind::BSLASHK)]
    Bslashk,
}

impl ::sittir_core::view::KindOf for BslashkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for BslashkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for BslashkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bslashk(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LtTransport {
    #[kind(kind::LT)]
    Lt,
}

impl ::sittir_core::view::KindOf for LtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lt(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum LparenQmarkPEqTransport {
    #[kind(kind::LPAREN_QMARK_P_EQ)]
    LparenQmarkPEq,
}

impl ::sittir_core::view::KindOf for LparenQmarkPEqTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(33)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkPEqTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for LparenQmarkPEqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_peq(w)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, ::sittir_core::Transport)]
#[transport(choice)]
pub enum CommaTransport {
    #[kind(kind::COMMA)]
    Comma,
}

impl ::sittir_core::view::KindOf for CommaTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::prepare::Prepare for CommaTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

impl ::sittir_core::render::Render for CommaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_comma(w)
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
        [::sittir_core::types::KindId(40)].iter().any(|k| kinds.contains(k))
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

impl ::sittir_core::prepare::SeatTarget for TermGroupTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(77)) {
            return Some((self.layout.edges_mut(), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for AnyTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::TermGroup(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}



fn render_pattern(node: &PatternTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::Before, node.layout.edges().before);
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(51), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_alternation(node: &AlternationTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let terms = ListView {
        items: &node.terms,
        template: "{}",
        token: "|",
        before: node.terms_separator_space_before.unwrap_or(0),
        after: node.terms_separator_space_after.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    terms.render(w)?;
    Ok(())
}

fn render_term(node: &TermTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let term_group = ListView {
        items: &node.term_group,
        template: "{}",
        token: "",
        before: 0,
        after: node.term_group_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    term_group.render(w)?;
    Ok(())
}

fn render_lookaround_assertion(node: &LookaroundAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    content.render(w)?;
    Ok(())
}

fn render_lookahead_assertion(node: &LookaheadAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?")?;
    w.adjacent();
    w.site_at(options::SITE_LOOKAHEAD_ASSERTION_LPAREN_QMARK_AFTER);
    content.render(w)?;
    pattern.render(w)?;
    w.site_at(options::SITE_LOOKAHEAD_ASSERTION_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_lookbehind_assertion(node: &LookbehindAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?<")?;
    w.adjacent();
    w.site_at(options::SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER);
    content.render(w)?;
    pattern.render(w)?;
    w.site_at(options::SITE_LOOKBEHIND_ASSERTION_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_pattern_character(t: &PatternCharacterTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_character_class(node: &CharacterClassTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let class_atoms = ListView {
        items: node.class_atoms.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: 0,
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let leading = View::new(&node.leading, "-");
    let negation = View::new(::sittir_core::view::Presence::new(node.negation, NegationTransport::Negation), "{}");
    let trailing = View::new(&node.trailing, "-");
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("[")?;
    w.site_at(options::SITE_CHARACTER_CLASS_LBRACK_AFTER);
    ::sittir_core::trivia::render_inner(node.layout.trivia(), "negation", w)?;
    if negation.is_present() {
        w.site_at(options::SITE_CHARACTER_CLASS_CARET_BEFORE);
        negation.render(w)?;
        w.site_at(options::SITE_CHARACTER_CLASS_CARET_AFTER);
    }
    if leading.is_present() {
        w.site_at(options::SITE_CHARACTER_CLASS_LEADING_BEFORE);
        leading.render(w)?;
        w.site_at(options::SITE_CHARACTER_CLASS_LEADING_AFTER);
    }
    class_atoms.render(w)?;
    if trailing.is_present() {
        w.site_at(options::SITE_CHARACTER_CLASS_TRAILING_BEFORE);
        trailing.render(w)?;
        w.site_at(options::SITE_CHARACTER_CLASS_TRAILING_AFTER);
    }
    w.site_at(options::SITE_CHARACTER_CLASS_RBRACK_BEFORE);
    w.text("]")?;
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_posix_character_class(node: &PosixCharacterClassTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let posix_class_name = &node.posix_class_name;
    w.edge(::sittir_core::types::KindId(59), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("[:")?;
    w.adjacent();
    w.site_at(options::SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER);
    posix_class_name.render(w)?;
    w.site_at(options::SITE_POSIX_CHARACTER_CLASS_COLON_RBRACK_BEFORE);
    w.text(":]")?;
    w.edge(::sittir_core::types::KindId(59), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_posix_class_name(t: &PosixClassNameTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_class_range(node: &ClassRangeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let end = &node.end;
    let start = &node.start;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::Before, node.layout.edges().before);
    start.render(w)?;
    w.site_at(options::SITE_CLASS_RANGE_DASH_BEFORE);
    w.text("-")?;
    w.site_at(options::SITE_CLASS_RANGE_DASH_AFTER);
    end.render(w)?;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_class_character(t: &ClassCharacterTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_anonymous_capturing_group(node: &AnonymousCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(")?;
    w.site_at(options::SITE_ANONYMOUS_CAPTURING_GROUP_LPAREN_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_ANONYMOUS_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_named_capturing_group(node: &NamedCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let group_name = &node.group_name;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::Before, node.layout.edges().before);
    content.render(w)?;
    w.adjacent();
    group_name.render(w)?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_GT_BEFORE);
    w.text(">")?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_GT_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_non_capturing_group(node: &NonCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(64), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?:")?;
    w.site_at(options::SITE_NON_CAPTURING_GROUP_LPAREN_QMARK_COLON_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_NON_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(64), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_flags(t: &FlagsTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_zero_or_more(t: &ZeroOrMoreTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_one_or_more(t: &OneOrMoreTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_optional(t: &OptionalTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_count_quantifier(node: &CountQuantifierTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let lazy = View::new(&node.lazy, "?");
    w.edge(::sittir_core::types::KindId(70), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("{")?;
    w.site_at(options::SITE_COUNT_QUANTIFIER_LBRACE_AFTER);
    content.render(w)?;
    w.site_at(options::SITE_COUNT_QUANTIFIER_RBRACE_BEFORE);
    w.text("}")?;
    w.site_at(options::SITE_COUNT_QUANTIFIER_RBRACE_AFTER);
    lazy.render(w)?;
    w.edge(::sittir_core::types::KindId(70), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_backreference_escape(node: &BackreferenceEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let group_name = &node.group_name;
    w.edge(::sittir_core::types::KindId(71), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("\\k")?;
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER);
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_LT_BEFORE);
    w.text("<")?;
    w.adjacent();
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_LT_AFTER);
    group_name.render(w)?;
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_GT_BEFORE);
    w.text(">")?;
    w.edge(::sittir_core::types::KindId(71), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_named_group_backreference(node: &NamedGroupBackreferenceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let group_name = &node.group_name;
    w.edge(::sittir_core::types::KindId(72), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?P=")?;
    w.adjacent();
    w.site_at(options::SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARK_P_EQ_AFTER);
    group_name.render(w)?;
    w.site_at(options::SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(72), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_decimal_escape(t: &DecimalEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_character_class_escape(node: &CharacterClassEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    content.render(w)?;
    Ok(())
}

fn render_unicode_character_escape(t: &UnicodeCharacterEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_unicode_property_value_expression(node: &UnicodePropertyValueExpressionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let unicode_property_value = &node.unicode_property_value;
    let unicode_property_value_expression_group = View::new(&node.unicode_property_value_expression_group, "{}");
    w.edge(::sittir_core::types::KindId(75), ::sittir_core::options::Side::Before, node.layout.edges().before);
    unicode_property_value_expression_group.render(w)?;
    unicode_property_value.render(w)?;
    w.edge(::sittir_core::types::KindId(75), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_unicode_property_value(t: &UnicodePropertyValueTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_control_escape(t: &ControlEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_control_letter_escape(t: &ControlLetterEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_identity_escape(node: &IdentityEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    w.text("\\")?;
    w.adjacent();
    content.render(w)?;
    Ok(())
}

fn render_group_name(t: &GroupNameTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_decimal_digits(t: &DecimalDigitsTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_term_group(node: &TermGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let quantifier = View::new(&node.quantifier, "{}");
    w.edge(::sittir_core::types::KindId(77), ::sittir_core::options::Side::Before, node.layout.edges().before);
    content.render(w)?;
    quantifier.render(w)?;
    w.edge(::sittir_core::types::KindId(77), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_count_quantifier_group(node: &CountQuantifierGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let decimal_digits = View::new(&node.decimal_digits, "{}");
    w.edge(::sittir_core::types::KindId(78), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text(",")?;
    w.site_at(options::SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER);
    decimal_digits.render(w)?;
    w.edge(::sittir_core::types::KindId(78), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_count_quantifier_arm(node: &CountQuantifierArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let count_quantifier_group = View::new(&node.count_quantifier_group, "{}");
    let decimal_digits = &node.decimal_digits;
    w.edge(::sittir_core::types::KindId(79), ::sittir_core::options::Side::Before, node.layout.edges().before);
    decimal_digits.render(w)?;
    count_quantifier_group.render(w)?;
    w.edge(::sittir_core::types::KindId(79), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_character_class_escape_arm(node: &CharacterClassEscapeArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let character_class_escape_text2 = &node.character_class_escape_text2;
    let unicode_property_value_expression = &node.unicode_property_value_expression;
    w.edge(::sittir_core::types::KindId(80), ::sittir_core::options::Side::Before, node.layout.edges().before);
    character_class_escape_text2.render(w)?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE);
    w.text("{")?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER);
    unicode_property_value_expression.render(w)?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE);
    w.text("}")?;
    w.edge(::sittir_core::types::KindId(80), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_unicode_property_value_expression_group(node: &UnicodePropertyValueExpressionGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let unicode_property_name = &node.unicode_property_name;
    w.edge(::sittir_core::types::KindId(81), ::sittir_core::options::Side::Before, node.layout.edges().before);
    unicode_property_name.render(w)?;
    w.site_at(options::SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE);
    w.text("=")?;
    w.edge(::sittir_core::types::KindId(81), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_character_class_escape_text1(t: &CharacterClassEscapeText1Transport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_character_class_escape_text2(t: &CharacterClassEscapeText2Transport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_inline_flags_group_enable(node: &InlineFlagsGroupEnableTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let enabled = &node.enabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(83), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?")?;
    w.adjacent();
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER);
    enabled.render(w)?;
    if pattern.is_present() {
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_BEFORE);
        w.text(":")?;
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_AFTER);
        pattern.render(w)?;
    }
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_ENABLE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(83), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_inline_flags_group_toggle(node: &InlineFlagsGroupToggleTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let disabled = &node.disabled;
    let enabled = &node.enabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(84), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?")?;
    w.adjacent();
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER);
    enabled.render(w)?;
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_BEFORE);
    w.text("-")?;
    w.adjacent();
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER);
    disabled.render(w)?;
    if pattern.is_present() {
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_BEFORE);
        w.text(":")?;
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_AFTER);
        pattern.render(w)?;
    }
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(84), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_inline_flags_group_disable(node: &InlineFlagsGroupDisableTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let disabled = &node.disabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(85), ::sittir_core::options::Side::Before, node.layout.edges().before);
    w.text("(?")?;
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_LPAREN_QMARK_AFTER);
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_BEFORE);
    w.text("-")?;
    w.adjacent();
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER);
    disabled.render(w)?;
    if pattern.is_present() {
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_BEFORE);
        w.text(":")?;
        w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_AFTER);
        pattern.render(w)?;
    }
    w.site_at(options::SITE_INLINE_FLAGS_GROUP_DISABLE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(85), ::sittir_core::options::Side::After, node.layout.edges().after);
    Ok(())
}

fn render_lazy(node: &LazyTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    w.text("?")?;
    Ok(())
}

fn render_unicode_property_name(node: &UnicodePropertyNameTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    content.render(w)?;
    Ok(())
}

fn render_any_character(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(2)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("."))
}

fn render_start_assertion(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(54)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("^"))
}

fn render_end_assertion(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(4)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("$"))
}

fn render_boundary_assertion(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(5)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("\\b"))
}

fn render_non_boundary_assertion(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(6)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("\\B"))
}

fn render_negation(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(82)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("^"))
}

fn render_tight(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(47)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam(""); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_newline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(48)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_blankline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(49)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_double_blankline(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(50)), ::sittir_core::layout::TriviaRole::Owner, w, |w| { w.token_seam("\n\n\n"); Ok::<(), ::sittir_core::render::RenderError>(()) })
}

fn render_caret(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(3)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("^"))
}

fn render_lparen_qmark(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(7)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("(?"))
}

fn render_eq(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(8)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("="))
}

fn render_bang(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(9)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("!"))
}

fn render_rparen(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(10)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(")"))
}

fn render_lparen_qmark_lt(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(11)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("(?<"))
}

fn render_lbrack(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(13)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("["))
}

fn render_dash(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(14)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("-"))
}

fn render_bslash_dash(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(19)), ::sittir_core::layout::TriviaRole::Owner, w, |w| w.text("\\-"))
}

fn render_rbrack(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(15)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("]"))
}

fn render_lbrack_colon(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(16)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("[:"))
}

fn render_colon_rbrack(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(17)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(":]"))
}

fn render_lparen(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(21)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("("))
}

fn render_lparen_qmark_plt(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(22)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("(?P<"))
}

fn render_gt(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(23)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(">"))
}

fn render_lparen_qmark_colon(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(24)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("(?:"))
}

fn render_star(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(25)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("*"))
}

fn render_qmark(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(26)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("?"))
}

fn render_plus(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(27)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("+"))
}

fn render_lbrace(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(28)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("{"))
}

fn render_rbrace(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(30)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("}"))
}

fn render_bslashk(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(31)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("\\k"))
}

fn render_lt(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(32)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("<"))
}

fn render_lparen_qmark_peq(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(33)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text("(?P="))
}

fn render_comma(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(29)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(","))
}

fn render_colon(w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    TransportLayout::render(None, Some(::sittir_core::types::KindId(40)), ::sittir_core::layout::TriviaRole::Token, w, |w| w.text(":"))
}

/// Word-class table derived from this grammar's Link-pinned word pattern.
static GRAMMAR_WORD_MATCHER: ::sittir_core::spacing::WordMatcher = ::sittir_core::spacing::WordMatcher::new(
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    char::is_alphanumeric,
)
.with_literal_merge_pairs(&[(40, 63), (63, 60)]); // "(?" "?<"

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
            Self::Pattern(inner) => inner.kind_in(kinds),
            Self::Alternation(inner) => inner.kind_in(kinds),
            Self::Term(inner) => inner.kind_in(kinds),
            Self::LookaroundAssertion(inner) => inner.kind_in(kinds),
            Self::LookaheadAssertion(inner) => inner.kind_in(kinds),
            Self::LookbehindAssertion(inner) => inner.kind_in(kinds),
            Self::PatternCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClass(inner) => inner.kind_in(kinds),
            Self::PosixCharacterClass(inner) => inner.kind_in(kinds),
            Self::PosixClassName(inner) => inner.kind_in(kinds),
            Self::ClassRange(inner) => inner.kind_in(kinds),
            Self::ClassCharacter(inner) => inner.kind_in(kinds),
            Self::AnonymousCapturingGroup(inner) => inner.kind_in(kinds),
            Self::NamedCapturingGroup(inner) => inner.kind_in(kinds),
            Self::NonCapturingGroup(inner) => inner.kind_in(kinds),
            Self::Flags(inner) => inner.kind_in(kinds),
            Self::ZeroOrMore(inner) => inner.kind_in(kinds),
            Self::OneOrMore(inner) => inner.kind_in(kinds),
            Self::Optional(inner) => inner.kind_in(kinds),
            Self::CountQuantifier(inner) => inner.kind_in(kinds),
            Self::BackreferenceEscape(inner) => inner.kind_in(kinds),
            Self::NamedGroupBackreference(inner) => inner.kind_in(kinds),
            Self::DecimalEscape(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::UnicodeCharacterEscape(inner) => inner.kind_in(kinds),
            Self::UnicodePropertyValueExpression(inner) => inner.kind_in(kinds),
            Self::UnicodePropertyValue(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::ControlLetterEscape(inner) => inner.kind_in(kinds),
            Self::IdentityEscape(inner) => inner.kind_in(kinds),
            Self::GroupName(inner) => inner.kind_in(kinds),
            Self::DecimalDigits(inner) => inner.kind_in(kinds),
            Self::TermGroup(inner) => inner.kind_in(kinds),
            Self::CountQuantifierGroup(inner) => inner.kind_in(kinds),
            Self::CountQuantifierArm(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscapeArm(inner) => inner.kind_in(kinds),
            Self::UnicodePropertyValueExpressionGroup(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscapeText1(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscapeText2(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupEnable(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupToggle(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupDisable(inner) => inner.kind_in(kinds),
            Self::Lazy(inner) => inner.kind_in(kinds),
            Self::UnicodePropertyName(inner) => inner.kind_in(kinds),
            Self::AnyCharacter => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::StartAssertion => [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k)),
            Self::EndAssertion => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::BoundaryAssertion => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
            Self::NonBoundaryAssertion => [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k)),
            Self::Negation => [::sittir_core::types::KindId(82)].iter().any(|k| kinds.contains(k)),
            Self::Tight => [::sittir_core::types::KindId(47)].iter().any(|k| kinds.contains(k)),
            Self::Newline => [::sittir_core::types::KindId(48)].iter().any(|k| kinds.contains(k)),
            Self::Blankline => [::sittir_core::types::KindId(49)].iter().any(|k| kinds.contains(k)),
            Self::DoubleBlankline => [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k)),
            Self::Caret => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmark => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
            Self::Eq => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Bang => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
            Self::Rparen => [::sittir_core::types::KindId(10)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmarkLt => [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k)),
            Self::Lbrack => [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k)),
            Self::Dash => [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k)),
            Self::BslashDash => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Rbrack => [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k)),
            Self::LbrackColon => [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k)),
            Self::ColonRbrack => [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k)),
            Self::Lparen => [::sittir_core::types::KindId(21)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmarkPLt => [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k)),
            Self::Gt => [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmarkColon => [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k)),
            Self::Star => [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k)),
            Self::Qmark => [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k)),
            Self::Plus => [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k)),
            Self::Lbrace => [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k)),
            Self::Rbrace => [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k)),
            Self::Bslashk => [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k)),
            Self::Lt => [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k)),
            Self::LparenQmarkPEq => [::sittir_core::types::KindId(33)].iter().any(|k| kinds.contains(k)),
            Self::Comma => [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k)),
            Self::Colon => [::sittir_core::types::KindId(40)].iter().any(|k| kinds.contains(k)),
            _ => false,
        }
    }
}

impl ::sittir_core::render::Render for AnyTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnyTransport::Pattern(t) => t.render(w),
            AnyTransport::Alternation(t) => t.render(w),
            AnyTransport::Term(t) => t.render(w),
            AnyTransport::LookaroundAssertion(t) => t.render(w),
            AnyTransport::LookaheadAssertion(t) => t.render(w),
            AnyTransport::LookbehindAssertion(t) => t.render(w),
            AnyTransport::PatternCharacter(t) => t.render(w),
            AnyTransport::CharacterClass(t) => t.render(w),
            AnyTransport::PosixCharacterClass(t) => t.render(w),
            AnyTransport::PosixClassName(t) => t.render(w),
            AnyTransport::ClassRange(t) => t.render(w),
            AnyTransport::ClassCharacter(t) => t.render(w),
            AnyTransport::AnonymousCapturingGroup(t) => t.render(w),
            AnyTransport::NamedCapturingGroup(t) => t.render(w),
            AnyTransport::NonCapturingGroup(t) => t.render(w),
            AnyTransport::Flags(t) => t.render(w),
            AnyTransport::ZeroOrMore(t) => t.render(w),
            AnyTransport::OneOrMore(t) => t.render(w),
            AnyTransport::Optional(t) => t.render(w),
            AnyTransport::CountQuantifier(t) => t.render(w),
            AnyTransport::BackreferenceEscape(t) => t.render(w),
            AnyTransport::NamedGroupBackreference(t) => t.render(w),
            AnyTransport::DecimalEscape(t) => t.render(w),
            AnyTransport::CharacterClassEscape(t) => t.render(w),
            AnyTransport::UnicodeCharacterEscape(t) => t.render(w),
            AnyTransport::UnicodePropertyValueExpression(t) => t.render(w),
            AnyTransport::UnicodePropertyValue(t) => t.render(w),
            AnyTransport::ControlEscape(t) => t.render(w),
            AnyTransport::ControlLetterEscape(t) => t.render(w),
            AnyTransport::IdentityEscape(t) => t.render(w),
            AnyTransport::GroupName(t) => t.render(w),
            AnyTransport::DecimalDigits(t) => t.render(w),
            AnyTransport::TermGroup(t) => t.render(w),
            AnyTransport::CountQuantifierGroup(t) => t.render(w),
            AnyTransport::CountQuantifierArm(t) => t.render(w),
            AnyTransport::CharacterClassEscapeArm(t) => t.render(w),
            AnyTransport::UnicodePropertyValueExpressionGroup(t) => t.render(w),
            AnyTransport::CharacterClassEscapeText1(t) => t.render(w),
            AnyTransport::CharacterClassEscapeText2(t) => t.render(w),
            AnyTransport::InlineFlagsGroupEnable(t) => t.render(w),
            AnyTransport::InlineFlagsGroupToggle(t) => t.render(w),
            AnyTransport::InlineFlagsGroupDisable(t) => t.render(w),
            AnyTransport::Lazy(t) => t.render(w),
            AnyTransport::UnicodePropertyName(t) => t.render(w),
            AnyTransport::AnyCharacter => render_any_character(w),
            AnyTransport::StartAssertion => render_start_assertion(w),
            AnyTransport::EndAssertion => render_end_assertion(w),
            AnyTransport::BoundaryAssertion => render_boundary_assertion(w),
            AnyTransport::NonBoundaryAssertion => render_non_boundary_assertion(w),
            AnyTransport::Negation => render_negation(w),
            AnyTransport::Tight => render_tight(w),
            AnyTransport::Newline => render_newline(w),
            AnyTransport::Blankline => render_blankline(w),
            AnyTransport::DoubleBlankline => render_double_blankline(w),
            AnyTransport::Caret => render_caret(w),
            AnyTransport::LparenQmark => render_lparen_qmark(w),
            AnyTransport::Eq => render_eq(w),
            AnyTransport::Bang => render_bang(w),
            AnyTransport::Rparen => render_rparen(w),
            AnyTransport::LparenQmarkLt => render_lparen_qmark_lt(w),
            AnyTransport::Lbrack => render_lbrack(w),
            AnyTransport::Dash => render_dash(w),
            AnyTransport::BslashDash => render_bslash_dash(w),
            AnyTransport::Rbrack => render_rbrack(w),
            AnyTransport::LbrackColon => render_lbrack_colon(w),
            AnyTransport::ColonRbrack => render_colon_rbrack(w),
            AnyTransport::Lparen => render_lparen(w),
            AnyTransport::LparenQmarkPLt => render_lparen_qmark_plt(w),
            AnyTransport::Gt => render_gt(w),
            AnyTransport::LparenQmarkColon => render_lparen_qmark_colon(w),
            AnyTransport::Star => render_star(w),
            AnyTransport::Qmark => render_qmark(w),
            AnyTransport::Plus => render_plus(w),
            AnyTransport::Lbrace => render_lbrace(w),
            AnyTransport::Rbrace => render_rbrace(w),
            AnyTransport::Bslashk => render_bslashk(w),
            AnyTransport::Lt => render_lt(w),
            AnyTransport::LparenQmarkPEq => render_lparen_qmark_peq(w),
            AnyTransport::Comma => render_comma(w),
            AnyTransport::Colon => render_colon(w),
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

const _: () = assert!(::core::mem::size_of::<AlternationTransport>() <= 256, "AlternationTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<AnonymousCapturingGroupTransport>() > 256, "AnonymousCapturingGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<BackreferenceEscapeTransport>() > 256, "BackreferenceEscapeTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CharacterClassEscapeArmTransport>() > 256, "CharacterClassEscapeArmTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CharacterClassEscapeText1Transport>() <= 256, "CharacterClassEscapeText1Transport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CharacterClassEscapeText2Transport>() <= 256, "CharacterClassEscapeText2Transport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CharacterClassEscapeTransport>() > 256, "CharacterClassEscapeTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CharacterClassTransport>() <= 256, "CharacterClassTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ClassCharacterTransport>() <= 256, "ClassCharacterTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ClassRangeTransport>() > 256, "ClassRangeTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ControlEscapeTransport>() <= 256, "ControlEscapeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ControlLetterEscapeTransport>() <= 256, "ControlLetterEscapeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CountQuantifierArmTransport>() > 256, "CountQuantifierArmTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CountQuantifierGroupTransport>() > 256, "CountQuantifierGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<CountQuantifierTransport>() > 256, "CountQuantifierTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<DecimalDigitsTransport>() <= 256, "DecimalDigitsTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<DecimalEscapeTransport>() <= 256, "DecimalEscapeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<FlagsTransport>() <= 256, "FlagsTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<GroupNameTransport>() <= 256, "GroupNameTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<IdentityEscapeTransport>() <= 256, "IdentityEscapeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<InlineFlagsGroupDisableTransport>() > 256, "InlineFlagsGroupDisableTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<InlineFlagsGroupEnableTransport>() > 256, "InlineFlagsGroupEnableTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<InlineFlagsGroupToggleTransport>() > 256, "InlineFlagsGroupToggleTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<LazyTransport>() <= 256, "LazyTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<LookaheadAssertionTransport>() > 256, "LookaheadAssertionTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<LookaroundAssertionTransport>() <= 256, "LookaroundAssertionTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<LookbehindAssertionTransport>() > 256, "LookbehindAssertionTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedCapturingGroupTransport>() > 256, "NamedCapturingGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NamedGroupBackreferenceTransport>() > 256, "NamedGroupBackreferenceTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<NonCapturingGroupTransport>() > 256, "NonCapturingGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<OneOrMoreTransport>() <= 256, "OneOrMoreTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<OptionalTransport>() <= 256, "OptionalTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PatternCharacterTransport>() <= 256, "PatternCharacterTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PatternTransport>() > 256, "PatternTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PosixCharacterClassTransport>() > 256, "PosixCharacterClassTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<PosixClassNameTransport>() <= 256, "PosixClassNameTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<TermGroupTransport>() > 256, "TermGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<TermTransport>() <= 256, "TermTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<UnicodeCharacterEscapeTransport>() <= 256, "UnicodeCharacterEscapeTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<UnicodePropertyNameTransport>() > 256, "UnicodePropertyNameTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<UnicodePropertyValueExpressionGroupTransport>() > 256, "UnicodePropertyValueExpressionGroupTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<UnicodePropertyValueExpressionTransport>() > 256, "UnicodePropertyValueExpressionTransport is within the 256-byte payload ceiling: unpin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<UnicodePropertyValueTransport>() <= 256, "UnicodePropertyValueTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");
const _: () = assert!(::core::mem::size_of::<ZeroOrMoreTransport>() <= 256, "ZeroOrMoreTransport is over the 256-byte payload ceiling: pin it in boxed-payloads.ts");

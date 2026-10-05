// @generated from packages/regex/node-model.json5 — do not hand-edit.
// Regenerate via: pnpm exec tsx packages/cli/src/cli.ts gen --grammar regex --all --output packages/regex/src
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

use ::sittir_core::layout::Layout as _;
use ::sittir_core::options::Edged as _;
use super::options;

#[derive(Debug, Clone)]
pub enum AnyTransport {
    Pattern(PatternTransport),
    Alternation(AlternationTransport),
    Term(TermTransport),
    LookaroundAssertion(LookaroundAssertionTransport),
    LookaheadAssertion(LookaheadAssertionTransport),
    LookbehindAssertion(LookbehindAssertionTransport),
    PatternCharacter(PatternCharacterTransport),
    CharacterClass(CharacterClassTransport),
    PosixCharacterClass(PosixCharacterClassTransport),
    PosixClassName(PosixClassNameTransport),
    ClassRange(ClassRangeTransport),
    ClassCharacter(ClassCharacterTransport),
    AnonymousCapturingGroup(AnonymousCapturingGroupTransport),
    NamedCapturingGroup(NamedCapturingGroupTransport),
    NonCapturingGroup(NonCapturingGroupTransport),
    Flags(FlagsTransport),
    ZeroOrMore(ZeroOrMoreTransport),
    OneOrMore(OneOrMoreTransport),
    Optional(OptionalTransport),
    CountQuantifier(CountQuantifierTransport),
    BackreferenceEscape(BackreferenceEscapeTransport),
    NamedGroupBackreference(NamedGroupBackreferenceTransport),
    DecimalEscape(DecimalEscapeTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    UnicodeCharacterEscape(UnicodeCharacterEscapeTransport),
    UnicodePropertyValueExpression(UnicodePropertyValueExpressionTransport),
    UnicodePropertyValue(UnicodePropertyValueTransport),
    ControlEscape(ControlEscapeTransport),
    ControlLetterEscape(ControlLetterEscapeTransport),
    IdentityEscape(IdentityEscapeTransport),
    GroupName(GroupNameTransport),
    DecimalDigits(DecimalDigitsTransport),
    TermGroup(TermGroupTransport),
    CountQuantifierGroup(CountQuantifierGroupTransport),
    CountQuantifierArm(CountQuantifierArmTransport),
    CharacterClassEscapeArm(CharacterClassEscapeArmTransport),
    UnicodePropertyValueExpressionGroup(UnicodePropertyValueExpressionGroupTransport),
    CharacterClassEscapeText1(CharacterClassEscapeText1Transport),
    CharacterClassEscapeText2(CharacterClassEscapeText2Transport),
    InlineFlagsGroupEnable(InlineFlagsGroupEnableTransport),
    InlineFlagsGroupToggle(InlineFlagsGroupToggleTransport),
    InlineFlagsGroupDisable(InlineFlagsGroupDisableTransport),
    Lazy(LazyTransport),
    UnicodePropertyName(UnicodePropertyNameTransport),
    AnyCharacter,
    StartAssertion,
    EndAssertion,
    BoundaryAssertion,
    NonBoundaryAssertion,
    Negation,
    Tight,
    Newline,
    Blankline,
    DoubleBlankline,
    Caret,
    LparenQmark,
    Eq,
    Bang,
    Rparen,
    LparenQmarkLt,
    Lbrack,
    Dash,
    BslashDash,
    Rbrack,
    LbrackColon,
    ColonRbrack,
    Lparen,
    LparenQmarkPLt,
    Gt,
    LparenQmarkColon,
    Star,
    Qmark,
    Plus,
    Lbrace,
    Rbrace,
    Bslashk,
    Lt,
    LparenQmarkPEq,
    Comma,
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
                // kind: pattern (PATTERN)
                51 => Ok(AnyTransport::Pattern(
                    PatternTransport::from_napi_value(env, napi_val)?
                )),
                // kind: alternation (ALTERNATION)
                52 => Ok(AnyTransport::Alternation(
                    AlternationTransport::from_napi_value(env, napi_val)?
                )),
                // kind: term (TERM)
                53 => Ok(AnyTransport::Term(
                    TermTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lookaround_assertion (LOOKAROUND_ASSERTION)
                55 => Ok(AnyTransport::LookaroundAssertion(
                    LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lookahead_assertion (LOOKAHEAD_ASSERTION)
                56 => Ok(AnyTransport::LookaheadAssertion(
                    LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lookbehind_assertion (LOOKBEHIND_ASSERTION)
                57 => Ok(AnyTransport::LookbehindAssertion(
                    LookbehindAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: pattern_character (PATTERN_CHARACTER)
                12 => Ok(AnyTransport::PatternCharacter(
                    PatternCharacterTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class (CHARACTER_CLASS)
                58 => Ok(AnyTransport::CharacterClass(
                    CharacterClassTransport::from_napi_value(env, napi_val)?
                )),
                // kind: posix_character_class (POSIX_CHARACTER_CLASS)
                59 => Ok(AnyTransport::PosixCharacterClass(
                    PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                )),
                // kind: posix_class_name (POSIX_CLASS_NAME)
                60 => Ok(AnyTransport::PosixClassName(
                    PosixClassNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: class_range (CLASS_RANGE)
                61 => Ok(AnyTransport::ClassRange(
                    ClassRangeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: class_character (CLASS_CHARACTER)
                20 => Ok(AnyTransport::ClassCharacter(
                    ClassCharacterTransport::from_napi_value(env, napi_val)?
                )),
                // kind: anonymous_capturing_group (ANONYMOUS_CAPTURING_GROUP)
                62 => Ok(AnyTransport::AnonymousCapturingGroup(
                    AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_capturing_group (NAMED_CAPTURING_GROUP)
                63 => Ok(AnyTransport::NamedCapturingGroup(
                    NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: non_capturing_group (NON_CAPTURING_GROUP)
                64 => Ok(AnyTransport::NonCapturingGroup(
                    NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: flags (FLAGS)
                66 => Ok(AnyTransport::Flags(
                    FlagsTransport::from_napi_value(env, napi_val)?
                )),
                // kind: zero_or_more (ZERO_OR_MORE)
                67 => Ok(AnyTransport::ZeroOrMore(
                    ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: one_or_more (ONE_OR_MORE)
                68 => Ok(AnyTransport::OneOrMore(
                    OneOrMoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: optional (OPTIONAL)
                69 => Ok(AnyTransport::Optional(
                    OptionalTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier (COUNT_QUANTIFIER)
                70 => Ok(AnyTransport::CountQuantifier(
                    CountQuantifierTransport::from_napi_value(env, napi_val)?
                )),
                // kind: backreference_escape (BACKREFERENCE_ESCAPE)
                71 => Ok(AnyTransport::BackreferenceEscape(
                    BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_group_backreference (NAMED_GROUP_BACKREFERENCE)
                72 => Ok(AnyTransport::NamedGroupBackreference(
                    NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: decimal_escape (DECIMAL_ESCAPE)
                34 => Ok(AnyTransport::DecimalEscape(
                    DecimalEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape (CHARACTER_CLASS_ESCAPE)
                73 => Ok(AnyTransport::CharacterClassEscape(
                    CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_character_escape (UNICODE_CHARACTER_ESCAPE)
                74 => Ok(AnyTransport::UnicodeCharacterEscape(
                    UnicodeCharacterEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_value_expression (UNICODE_PROPERTY_VALUE_EXPRESSION)
                75 => Ok(AnyTransport::UnicodePropertyValueExpression(
                    UnicodePropertyValueExpressionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_value (UNICODE_PROPERTY_VALUE)
                35 => Ok(AnyTransport::UnicodePropertyValue(
                    UnicodePropertyValueTransport::from_napi_value(env, napi_val)?
                )),
                // kind: control_escape (CONTROL_ESCAPE)
                76 => Ok(AnyTransport::ControlEscape(
                    ControlEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: control_letter_escape (CONTROL_LETTER_ESCAPE)
                36 => Ok(AnyTransport::ControlLetterEscape(
                    ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: identity_escape (IDENTITY_ESCAPE)
                37 => Ok(AnyTransport::IdentityEscape(
                    IdentityEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: group_name (GROUP_NAME)
                38 => Ok(AnyTransport::GroupName(
                    GroupNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: decimal_digits (DECIMAL_DIGITS)
                39 => Ok(AnyTransport::DecimalDigits(
                    DecimalDigitsTransport::from_napi_value(env, napi_val)?
                )),
                // kind: term_group (TERM_GROUP)
                77 => Ok(AnyTransport::TermGroup(
                    TermGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier_group (COUNT_QUANTIFIER_GROUP)
                78 => Ok(AnyTransport::CountQuantifierGroup(
                    CountQuantifierGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier_arm (COUNT_QUANTIFIER_ARM)
                79 => Ok(AnyTransport::CountQuantifierArm(
                    CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape_arm (CHARACTER_CLASS_ESCAPE_ARM)
                80 => Ok(AnyTransport::CharacterClassEscapeArm(
                    CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_value_expression_group (UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP)
                81 => Ok(AnyTransport::UnicodePropertyValueExpressionGroup(
                    UnicodePropertyValueExpressionGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape_text1 (CHARACTER_CLASS_ESCAPE_TEXT1)
                41 => Ok(AnyTransport::CharacterClassEscapeText1(
                    CharacterClassEscapeText1Transport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape_text2 (CHARACTER_CLASS_ESCAPE_TEXT2)
                42 => Ok(AnyTransport::CharacterClassEscapeText2(
                    CharacterClassEscapeText2Transport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_enable (INLINE_FLAGS_GROUP_ENABLE)
                83 => Ok(AnyTransport::InlineFlagsGroupEnable(
                    InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_toggle (INLINE_FLAGS_GROUP_TOGGLE)
                84 => Ok(AnyTransport::InlineFlagsGroupToggle(
                    InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_disable (INLINE_FLAGS_GROUP_DISABLE)
                85 => Ok(AnyTransport::InlineFlagsGroupDisable(
                    InlineFlagsGroupDisableTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lazy (LAZY)
                89 => Ok(AnyTransport::Lazy(
                    LazyTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_name (UNICODE_PROPERTY_NAME)
                90 => Ok(AnyTransport::UnicodePropertyName(
                    UnicodePropertyNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: any_character
                2 => Ok(AnyTransport::AnyCharacter),
                // kind: start_assertion
                54 => Ok(AnyTransport::StartAssertion),
                // kind: end_assertion
                4 => Ok(AnyTransport::EndAssertion),
                // kind: boundary_assertion
                5 => Ok(AnyTransport::BoundaryAssertion),
                // kind: non_boundary_assertion
                6 => Ok(AnyTransport::NonBoundaryAssertion),
                // kind: negation
                82 => Ok(AnyTransport::Negation),
                // kind: _tight
                47 => Ok(AnyTransport::Tight),
                // kind: _newline
                48 => Ok(AnyTransport::Newline),
                // kind: _blankline
                49 => Ok(AnyTransport::Blankline),
                // kind: _double_blankline
                50 => Ok(AnyTransport::DoubleBlankline),
                // kind: caret
                3 => Ok(AnyTransport::Caret),
                // kind: lparen_qmark
                7 => Ok(AnyTransport::LparenQmark),
                // kind: eq
                8 => Ok(AnyTransport::Eq),
                // kind: bang
                9 => Ok(AnyTransport::Bang),
                // kind: rparen
                10 => Ok(AnyTransport::Rparen),
                // kind: lparen_qmark_lt
                11 => Ok(AnyTransport::LparenQmarkLt),
                // kind: lbrack
                13 => Ok(AnyTransport::Lbrack),
                // kind: dash
                14 => Ok(AnyTransport::Dash),
                // kind: bslash_dash
                19 => Ok(AnyTransport::BslashDash),
                // kind: rbrack
                15 => Ok(AnyTransport::Rbrack),
                // kind: lbrack_colon
                16 => Ok(AnyTransport::LbrackColon),
                // kind: colon_rbrack
                17 => Ok(AnyTransport::ColonRbrack),
                // kind: lparen
                21 => Ok(AnyTransport::Lparen),
                // kind: lparen_qmarkP_lt
                22 => Ok(AnyTransport::LparenQmarkPLt),
                // kind: gt
                23 => Ok(AnyTransport::Gt),
                // kind: lparen_qmark_colon
                24 => Ok(AnyTransport::LparenQmarkColon),
                // kind: star
                25 => Ok(AnyTransport::Star),
                // kind: qmark
                26 => Ok(AnyTransport::Qmark),
                // kind: plus
                27 => Ok(AnyTransport::Plus),
                // kind: lbrace
                28 => Ok(AnyTransport::Lbrace),
                // kind: rbrace
                30 => Ok(AnyTransport::Rbrace),
                // kind: bslashk
                31 => Ok(AnyTransport::Bslashk),
                // kind: lt
                32 => Ok(AnyTransport::Lt),
                // kind: lparen_qmarkP_eq
                33 => Ok(AnyTransport::LparenQmarkPEq),
                // kind: comma
                29 => Ok(AnyTransport::Comma),
                // kind: colon
                40 => Ok(AnyTransport::Colon),
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
    Newline,
    Blankline,
    DoubleBlankline,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TriviaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    48 => Ok(Self::Newline),
                    49 => Ok(Self::Blankline),
                    50 => Ok(Self::DoubleBlankline),
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
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in TriviaTransport"))?,
                    })),
                    48 => Ok(Self::Newline),
                    49 => Ok(Self::Blankline),
                    50 => Ok(Self::DoubleBlankline),
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

pub type TransportLayout = ::sittir_core::layout::TransportLayout<TriviaTransport>;


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
pub enum PatternContentTransportSlot {
    Alternation(AlternationTransport),
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PatternContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    52 => Ok(Self::Alternation(
                        AlternationTransport::from_napi_value(env, napi_val)?
                    )),
                    53 => Ok(Self::Term(
                        TermTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PatternContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in PatternContentTransportSlot")
                )?;
                match kind_id {
                    52 => Ok(Self::Alternation(
                        AlternationTransport::from_napi_value(env, napi_val)?
                    )),
                    53 => Ok(Self::Term(
                        TermTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PatternContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("PatternContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PatternContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PatternContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PatternContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PatternContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PatternContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PatternContentTransportSlot::to_napi_value(env, *val)
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

#[derive(Debug, Clone)]
pub enum LookaroundAssertionContentTransportSlot {
    LookaheadAssertion(LookaheadAssertionTransport),
    LookbehindAssertion(LookbehindAssertionTransport),
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LookaroundAssertionContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    56 => Ok(Self::LookaheadAssertion(
                        LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    57 => Ok(Self::LookbehindAssertion(
                        LookbehindAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookaroundAssertionContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in LookaroundAssertionContentTransportSlot")
                )?;
                match kind_id {
                    56 => Ok(Self::LookaheadAssertion(
                        LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    57 => Ok(Self::LookbehindAssertion(
                        LookbehindAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookaroundAssertionContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("LookaroundAssertionContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LookaroundAssertionContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LookaroundAssertionContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookaroundAssertionContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookaroundAssertionContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookaroundAssertionContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookaroundAssertionContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LookaroundAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookaroundAssertionContentTransportSlot::LookaheadAssertion(inner) => inner.render(w),
            LookaroundAssertionContentTransportSlot::LookbehindAssertion(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum LookaheadAssertionContentTransportSlot {
    Eq,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LookaheadAssertionContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    8 => Ok(Self::Eq),
                    9 => Ok(Self::Bang),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookaheadAssertionContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in LookaheadAssertionContentTransportSlot")
                )?;
                match kind_id {
                    8 => Ok(Self::Eq),
                    9 => Ok(Self::Bang),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookaheadAssertionContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("LookaheadAssertionContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LookaheadAssertionContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LookaheadAssertionContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookaheadAssertionContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookaheadAssertionContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookaheadAssertionContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookaheadAssertionContentTransportSlot::to_napi_value(env, *val)
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

#[derive(Debug, Clone)]
pub enum LookbehindAssertionContentTransportSlot {
    Eq,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LookbehindAssertionContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    8 => Ok(Self::Eq),
                    9 => Ok(Self::Bang),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookbehindAssertionContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in LookbehindAssertionContentTransportSlot")
                )?;
                match kind_id {
                    8 => Ok(Self::Eq),
                    9 => Ok(Self::Bang),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LookbehindAssertionContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("LookbehindAssertionContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LookbehindAssertionContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LookbehindAssertionContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookbehindAssertionContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookbehindAssertionContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookbehindAssertionContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookbehindAssertionContentTransportSlot::to_napi_value(env, *val)
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

#[derive(Debug, Clone)]
pub enum CharacterClassClassAtomsTransportSlot {
    ClassCharacter(ClassCharacterTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    ControlEscape(ControlEscapeTransport),
    ControlLetterEscape(ControlLetterEscapeTransport),
    IdentityEscape(IdentityEscapeTransport),
    PosixCharacterClass(PosixCharacterClassTransport),
    ClassRange(ClassRangeTransport),
    BslashDash,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassClassAtomsTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    19 => Ok(Self::BslashDash),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    14 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    36 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    37 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    59 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    61 => Ok(Self::ClassRange(
                        ClassRangeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassClassAtomsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in CharacterClassClassAtomsTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in CharacterClassClassAtomsTransportSlot"))?,
                    })),
                    19 => Ok(Self::BslashDash),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    14 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    36 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    37 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    59 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    61 => Ok(Self::ClassRange(
                        ClassRangeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassClassAtomsTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("CharacterClassClassAtomsTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CharacterClassClassAtomsTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CharacterClassClassAtomsTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassClassAtomsTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassClassAtomsTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassClassAtomsTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassClassAtomsTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for CharacterClassClassAtomsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassClassAtomsTransportSlot::ClassCharacter(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::CharacterClassEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::ControlEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::ControlLetterEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::IdentityEscape(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::PosixCharacterClass(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::ClassRange(inner) => inner.render(w),
            CharacterClassClassAtomsTransportSlot::BslashDash => render_bslash_dash(w),
            CharacterClassClassAtomsTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ClassRangeStartTransportSlot {
    ClassCharacter(ClassCharacterTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    ControlEscape(ControlEscapeTransport),
    Dash,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ClassRangeStartTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    14 => Ok(Self::Dash),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ClassRangeStartTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in ClassRangeStartTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in ClassRangeStartTransportSlot"))?,
                    })),
                    14 => Ok(Self::Dash),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ClassRangeStartTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("ClassRangeStartTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ClassRangeStartTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ClassRangeStartTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ClassRangeStartTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ClassRangeStartTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ClassRangeStartTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ClassRangeStartTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for ClassRangeStartTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(inner) => inner.render(w),
            ClassRangeStartTransportSlot::CharacterClassEscape(inner) => inner.render(w),
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

#[derive(Debug, Clone)]
pub enum NamedCapturingGroupContentTransportSlot {
    LparenQmarkLt,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedCapturingGroupContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    11 => Ok(Self::LparenQmarkLt),
                    22 => Ok(Self::LparenQmarkPLt),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedCapturingGroupContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedCapturingGroupContentTransportSlot")
                )?;
                match kind_id {
                    11 => Ok(Self::LparenQmarkLt),
                    22 => Ok(Self::LparenQmarkPLt),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedCapturingGroupContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedCapturingGroupContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedCapturingGroupContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedCapturingGroupContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedCapturingGroupContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedCapturingGroupContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedCapturingGroupContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedCapturingGroupContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NamedCapturingGroupContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedCapturingGroupContentTransportSlot::LparenQmarkLt => {
                let written = render_lparen_qmark_lt(w);
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER);
                Ok(())
            }
            NamedCapturingGroupContentTransportSlot::LparenQmarkPLt => {
                let written = render_lparen_qmark_plt(w);
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum CountQuantifierContentTransportSlot {
    CountQuantifierArm(CountQuantifierArmTransport),
    DecimalDigits(DecimalDigitsTransport),
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CountQuantifierContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    79 => Ok(Self::CountQuantifierArm(
                        CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::DecimalDigits(
                        DecimalDigitsTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CountQuantifierContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in CountQuantifierContentTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in CountQuantifierContentTransportSlot"))?,
                    })),
                    79 => Ok(Self::CountQuantifierArm(
                        CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::DecimalDigits(
                        DecimalDigitsTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CountQuantifierContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("CountQuantifierContentTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CountQuantifierContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CountQuantifierContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CountQuantifierContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CountQuantifierContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CountQuantifierContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CountQuantifierContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for CountQuantifierContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CountQuantifierContentTransportSlot::CountQuantifierArm(inner) => inner.render(w),
            CountQuantifierContentTransportSlot::DecimalDigits(inner) => inner.render(w),
            CountQuantifierContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum CharacterClassEscapeContentTransportSlot {
    CharacterClassEscapeText1(CharacterClassEscapeText1Transport),
    CharacterClassEscapeArm(CharacterClassEscapeArmTransport),
    UnicodeCharacterEscape(UnicodeCharacterEscapeTransport),
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    41 => Ok(Self::CharacterClassEscapeText1(
                        CharacterClassEscapeText1Transport::from_napi_value(env, napi_val)?
                    )),
                    80 => Ok(Self::CharacterClassEscapeArm(
                        CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                    )),
                    74 => Ok(Self::UnicodeCharacterEscape(
                        UnicodeCharacterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassEscapeContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in CharacterClassEscapeContentTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in CharacterClassEscapeContentTransportSlot"))?,
                    })),
                    41 => Ok(Self::CharacterClassEscapeText1(
                        CharacterClassEscapeText1Transport::from_napi_value(env, napi_val)?
                    )),
                    80 => Ok(Self::CharacterClassEscapeArm(
                        CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                    )),
                    74 => Ok(Self::UnicodeCharacterEscape(
                        UnicodeCharacterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassEscapeContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("CharacterClassEscapeContentTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CharacterClassEscapeContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CharacterClassEscapeContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for CharacterClassEscapeContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeText1(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum TermGroupQuantifierTransportSlot {
    ZeroOrMore(ZeroOrMoreTransport),
    OneOrMore(OneOrMoreTransport),
    Optional(OptionalTransport),
    CountQuantifier(CountQuantifierTransport),
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TermGroupQuantifierTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    67 => Ok(Self::ZeroOrMore(
                        ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    68 => Ok(Self::OneOrMore(
                        OneOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    69 => Ok(Self::Optional(
                        OptionalTransport::from_napi_value(env, napi_val)?
                    )),
                    70 => Ok(Self::CountQuantifier(
                        CountQuantifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TermGroupQuantifierTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in TermGroupQuantifierTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in TermGroupQuantifierTransportSlot"))?,
                    })),
                    67 => Ok(Self::ZeroOrMore(
                        ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    68 => Ok(Self::OneOrMore(
                        OneOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    69 => Ok(Self::Optional(
                        OptionalTransport::from_napi_value(env, napi_val)?
                    )),
                    70 => Ok(Self::CountQuantifier(
                        CountQuantifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TermGroupQuantifierTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("TermGroupQuantifierTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TermGroupQuantifierTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("TermGroupQuantifierTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TermGroupQuantifierTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TermGroupQuantifierTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TermGroupQuantifierTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TermGroupQuantifierTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for TermGroupQuantifierTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TermGroupQuantifierTransportSlot::ZeroOrMore(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::OneOrMore(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::Optional(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::CountQuantifier(inner) => inner.render(w),
            TermGroupQuantifierTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum TermGroupContentTransportSlot {
    LookaroundAssertion(LookaroundAssertionTransport),
    PatternCharacter(PatternCharacterTransport),
    CharacterClass(CharacterClassTransport),
    PosixCharacterClass(PosixCharacterClassTransport),
    DecimalEscape(DecimalEscapeTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    ControlEscape(ControlEscapeTransport),
    ControlLetterEscape(ControlLetterEscapeTransport),
    IdentityEscape(IdentityEscapeTransport),
    BackreferenceEscape(BackreferenceEscapeTransport),
    NamedGroupBackreference(NamedGroupBackreferenceTransport),
    AnonymousCapturingGroup(AnonymousCapturingGroupTransport),
    NamedCapturingGroup(NamedCapturingGroupTransport),
    NonCapturingGroup(NonCapturingGroupTransport),
    InlineFlagsGroupEnable(InlineFlagsGroupEnableTransport),
    InlineFlagsGroupToggle(InlineFlagsGroupToggleTransport),
    InlineFlagsGroupDisable(InlineFlagsGroupDisableTransport),
    StartAssertion,
    EndAssertion,
    BoundaryAssertion,
    NonBoundaryAssertion,
    AnyCharacter,
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TermGroupContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    54 => Ok(Self::StartAssertion),
                    4 => Ok(Self::EndAssertion),
                    5 => Ok(Self::BoundaryAssertion),
                    6 => Ok(Self::NonBoundaryAssertion),
                    2 => Ok(Self::AnyCharacter),
                    55 => Ok(Self::LookaroundAssertion(
                        LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    12 => Ok(Self::PatternCharacter(
                        PatternCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::CharacterClass(
                        CharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    59 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::DecimalEscape(
                        DecimalEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    36 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    37 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    19 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    71 => Ok(Self::BackreferenceEscape(
                        BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::NamedGroupBackreference(
                        NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::AnonymousCapturingGroup(
                        AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    63 => Ok(Self::NamedCapturingGroup(
                        NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    64 => Ok(Self::NonCapturingGroup(
                        NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    83 => Ok(Self::InlineFlagsGroupEnable(
                        InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                    )),
                    84 => Ok(Self::InlineFlagsGroupToggle(
                        InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                    )),
                    85 => Ok(Self::InlineFlagsGroupDisable(
                        InlineFlagsGroupDisableTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TermGroupContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in TermGroupContentTransportSlot")
                )?;
                match kind_id {
                    id if id == ::sittir_core::types::KindId::ERROR.0 => Ok(Self::Verbatim(VerbatimTransport {
                        text: obj.get("$text")?.ok_or_else(|| ::napi::Error::from_reason("ERROR node without $text in TermGroupContentTransportSlot"))?,
                    })),
                    54 => Ok(Self::StartAssertion),
                    4 => Ok(Self::EndAssertion),
                    5 => Ok(Self::BoundaryAssertion),
                    6 => Ok(Self::NonBoundaryAssertion),
                    2 => Ok(Self::AnyCharacter),
                    55 => Ok(Self::LookaroundAssertion(
                        LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    12 => Ok(Self::PatternCharacter(
                        PatternCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::CharacterClass(
                        CharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    59 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::DecimalEscape(
                        DecimalEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    76 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    36 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    37 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    19 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    71 => Ok(Self::BackreferenceEscape(
                        BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::NamedGroupBackreference(
                        NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::AnonymousCapturingGroup(
                        AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    63 => Ok(Self::NamedCapturingGroup(
                        NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    64 => Ok(Self::NonCapturingGroup(
                        NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    83 => Ok(Self::InlineFlagsGroupEnable(
                        InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                    )),
                    84 => Ok(Self::InlineFlagsGroupToggle(
                        InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                    )),
                    85 => Ok(Self::InlineFlagsGroupDisable(
                        InlineFlagsGroupDisableTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in TermGroupContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("TermGroupContentTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TermGroupContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("TermGroupContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TermGroupContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TermGroupContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TermGroupContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TermGroupContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for TermGroupContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TermGroupContentTransportSlot::LookaroundAssertion(inner) => inner.render(w),
            TermGroupContentTransportSlot::PatternCharacter(inner) => inner.render(w),
            TermGroupContentTransportSlot::CharacterClass(inner) => inner.render(w),
            TermGroupContentTransportSlot::PosixCharacterClass(inner) => inner.render(w),
            TermGroupContentTransportSlot::DecimalEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::CharacterClassEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::ControlEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::ControlLetterEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::IdentityEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::BackreferenceEscape(inner) => inner.render(w),
            TermGroupContentTransportSlot::NamedGroupBackreference(inner) => inner.render(w),
            TermGroupContentTransportSlot::AnonymousCapturingGroup(inner) => inner.render(w),
            TermGroupContentTransportSlot::NamedCapturingGroup(inner) => inner.render(w),
            TermGroupContentTransportSlot::NonCapturingGroup(inner) => inner.render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupEnable(inner) => inner.render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupToggle(inner) => inner.render(w),
            TermGroupContentTransportSlot::InlineFlagsGroupDisable(inner) => inner.render(w),
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

#[derive(Debug, Clone)]
pub enum LazyContentTransportSlot {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LazyContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    26 => Ok(Self::Qmark),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LazyContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in LazyContentTransportSlot")
                )?;
                match kind_id {
                    26 => Ok(Self::Qmark),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in LazyContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("LazyContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LazyContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LazyContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LazyContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LazyContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LazyContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LazyContentTransportSlot::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LazyContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LazyContentTransportSlot::Qmark => render_qmark(w),
        }
    }
}


#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PatternTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PatternTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PatternTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PatternTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AlternationTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_terms"))]
    pub terms: Vec<Option<::sittir_core::SlotValue<TermTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_terms_separator_space_before"))]
    pub terms_separator_space_before: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_terms_separator_space_after"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AlternationTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AlternationTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AlternationTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AlternationTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TermTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_group"))]
    pub term_group: Vec<::sittir_core::SlotValue<TermGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_group_separator_space"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TermTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TermTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TermTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TermTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum AnyCharacterTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AnyCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            2 => Ok(Self::AnyCharacter),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind AnyCharacterTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnyCharacterTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("AnyCharacterTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnyCharacterTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnyCharacterTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnyCharacterTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnyCharacterTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for AnyCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_any_character(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum StartAssertionTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for StartAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            54 => Ok(Self::StartAssertion),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind StartAssertionTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StartAssertionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("StartAssertionTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<StartAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        StartAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<StartAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        StartAssertionTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for StartAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_start_assertion(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum EndAssertionTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for EndAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            4 => Ok(Self::EndAssertion),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind EndAssertionTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EndAssertionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("EndAssertionTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<EndAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        EndAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<EndAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        EndAssertionTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for EndAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_end_assertion(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum BoundaryAssertionTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for BoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            5 => Ok(Self::BoundaryAssertion),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind BoundaryAssertionTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BoundaryAssertionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("BoundaryAssertionTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BoundaryAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BoundaryAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BoundaryAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BoundaryAssertionTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for BoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_boundary_assertion(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NonBoundaryAssertionTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NonBoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            6 => Ok(Self::NonBoundaryAssertion),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind NonBoundaryAssertionTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NonBoundaryAssertionTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NonBoundaryAssertionTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NonBoundaryAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NonBoundaryAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NonBoundaryAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NonBoundaryAssertionTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NonBoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_non_boundary_assertion(w)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LookaroundAssertionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookaroundAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookaroundAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookaroundAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookaroundAssertionTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LookaheadAssertionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<LookaheadAssertionContentTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookaheadAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookaheadAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookaheadAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookaheadAssertionTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LookbehindAssertionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<LookbehindAssertionContentTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LookbehindAssertionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LookbehindAssertionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LookbehindAssertionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LookbehindAssertionTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct PatternCharacterTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PatternCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: PatternCharacterTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PatternCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PatternCharacterTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PatternCharacterTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PatternCharacterTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PatternCharacterTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PatternCharacterTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CharacterClassTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_leading"))]
    pub leading: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_class_atoms"))]
    pub class_atoms: Option<Vec<::sittir_core::SlotValue<CharacterClassClassAtomsTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_trailing"))]
    pub trailing: Option<bool>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_negation"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PosixCharacterClassTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_posix_class_name"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PosixCharacterClassTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PosixCharacterClassTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PosixCharacterClassTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PosixCharacterClassTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct PosixClassNameTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PosixClassNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: PosixClassNameTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for PosixClassNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PosixClassNameTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PosixClassNameTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PosixClassNameTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PosixClassNameTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PosixClassNameTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct ClassRangeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_start"))]
    pub start: ::sittir_core::SlotValue<ClassRangeStartTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_end"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ClassRangeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ClassRangeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ClassRangeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ClassRangeTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ClassCharacterTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ClassCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: ClassCharacterTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ClassCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ClassCharacterTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ClassCharacterTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ClassCharacterTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ClassCharacterTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ClassCharacterTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct AnonymousCapturingGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnonymousCapturingGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnonymousCapturingGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnonymousCapturingGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnonymousCapturingGroupTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedCapturingGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedCapturingGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedCapturingGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedCapturingGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedCapturingGroupTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NonCapturingGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NonCapturingGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NonCapturingGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NonCapturingGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NonCapturingGroupTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct FlagsTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FlagsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: FlagsTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for FlagsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for FlagsTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<FlagsTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        FlagsTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<FlagsTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        FlagsTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ZeroOrMoreTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ZeroOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: ZeroOrMoreTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ZeroOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ZeroOrMoreTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ZeroOrMoreTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ZeroOrMoreTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ZeroOrMoreTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ZeroOrMoreTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct OneOrMoreTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for OneOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: OneOrMoreTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for OneOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for OneOrMoreTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<OneOrMoreTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        OneOrMoreTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<OneOrMoreTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        OneOrMoreTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct OptionalTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for OptionalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: OptionalTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for OptionalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for OptionalTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<OptionalTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        OptionalTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<OptionalTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        OptionalTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CountQuantifierTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<CountQuantifierContentTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_lazy"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CountQuantifierTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CountQuantifierTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CountQuantifierTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CountQuantifierTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct BackreferenceEscapeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BackreferenceEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BackreferenceEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BackreferenceEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BackreferenceEscapeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedGroupBackreferenceTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedGroupBackreferenceTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedGroupBackreferenceTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedGroupBackreferenceTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedGroupBackreferenceTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DecimalEscapeTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: DecimalEscapeTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DecimalEscapeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DecimalEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DecimalEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DecimalEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DecimalEscapeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CharacterClassEscapeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct UnicodeCharacterEscapeTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodeCharacterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: UnicodeCharacterEscapeTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodeCharacterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for UnicodeCharacterEscapeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodeCharacterEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodeCharacterEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodeCharacterEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodeCharacterEscapeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnicodePropertyValueExpressionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_value_expression_group"))]
    pub unicode_property_value_expression_group: Option<::sittir_core::SlotValue<UnicodePropertyValueExpressionGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_value"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodePropertyValueExpressionTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodePropertyValueExpressionTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodePropertyValueExpressionTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodePropertyValueExpressionTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct UnicodePropertyValueTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodePropertyValueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: UnicodePropertyValueTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodePropertyValueTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for UnicodePropertyValueTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodePropertyValueTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodePropertyValueTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodePropertyValueTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodePropertyValueTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ControlEscapeTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: ControlEscapeTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ControlEscapeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ControlEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ControlEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ControlEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ControlEscapeTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ControlLetterEscapeTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlLetterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: ControlLetterEscapeTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlLetterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ControlLetterEscapeTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ControlLetterEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ControlLetterEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ControlLetterEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ControlLetterEscapeTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct IdentityEscapeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<IdentityEscapeTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        IdentityEscapeTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<IdentityEscapeTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        IdentityEscapeTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct GroupNameTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for GroupNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: GroupNameTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for GroupNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GroupNameTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupNameTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupNameTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupNameTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupNameTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct DecimalDigitsTransport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalDigitsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: DecimalDigitsTransport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalDigitsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DecimalDigitsTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DecimalDigitsTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DecimalDigitsTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DecimalDigitsTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DecimalDigitsTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct TermGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_quantifier"))]
    pub quantifier: Option<::sittir_core::SlotValue<TermGroupQuantifierTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<TermGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        TermGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<TermGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        TermGroupTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CountQuantifierGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_decimal_digits"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CountQuantifierGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CountQuantifierGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CountQuantifierGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CountQuantifierGroupTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CountQuantifierArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_decimal_digits"))]
    pub decimal_digits: ::sittir_core::SlotValue<DecimalDigitsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_count_quantifier_group"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CountQuantifierArmTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CountQuantifierArmTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CountQuantifierArmTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CountQuantifierArmTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct CharacterClassEscapeArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_value_expression"))]
    pub unicode_property_value_expression: ::sittir_core::SlotValue<UnicodePropertyValueExpressionTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_character_class_escape_text2"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeArmTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeArmTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeArmTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeArmTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnicodePropertyValueExpressionGroupTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_name"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodePropertyValueExpressionGroupTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodePropertyValueExpressionGroupTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodePropertyValueExpressionGroupTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodePropertyValueExpressionGroupTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct CharacterClassEscapeText1Transport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeText1Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: CharacterClassEscapeText1Transport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeText1Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CharacterClassEscapeText1Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeText1Transport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeText1Transport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeText1Transport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeText1Transport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct CharacterClassEscapeText2Transport {
    pub layout: Option<TransportLayout>,
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

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeText2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut layout: Option<TransportLayout> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            ::napi::ValueType::Number => {
                let id = u32::from_napi_value(env, napi_val)?;
                return Err(::napi::Error::from_reason(format!(
                    "kind id {} ({:?}) has no fixed text: CharacterClassEscapeText2Transport renders from a node, not a kind id",
                    id,
                    u16::try_from(id).map_or("<unknown>", |id| super::kind_ids::kind_name_from_id(::sittir_core::types::KindId(id)))
                )));
            }
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                layout = obj.get("$_layout")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeText2Transport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let layout = obj.get("$_layout")?;
        Ok(Self {
            layout,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CharacterClassEscapeText2Transport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeText2Transport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeText2Transport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeText2Transport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeText2Transport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NegationTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NegationTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            82 => Ok(Self::Negation),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind NegationTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NegationTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NegationTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NegationTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NegationTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NegationTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NegationTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for NegationTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_negation(w)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InlineFlagsGroupEnableTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_enabled"))]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<InlineFlagsGroupEnableTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<InlineFlagsGroupEnableTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        InlineFlagsGroupEnableTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InlineFlagsGroupToggleTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_enabled"))]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_disabled"))]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<InlineFlagsGroupToggleTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<InlineFlagsGroupToggleTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        InlineFlagsGroupToggleTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InlineFlagsGroupDisableTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_disabled"))]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<InlineFlagsGroupDisableTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        InlineFlagsGroupDisableTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<InlineFlagsGroupDisableTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        InlineFlagsGroupDisableTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum TightTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TightTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            47 => Ok(Self::Tight),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind TightTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TightTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("TightTransport is receive-only"))
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

impl ::sittir_core::render::Render for TightTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_tight(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NewlineTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NewlineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            48 => Ok(Self::Newline),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind NewlineTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NewlineTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NewlineTransport is receive-only"))
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

impl ::sittir_core::render::Render for NewlineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_newline(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum BlanklineTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for BlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            49 => Ok(Self::Blankline),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind BlanklineTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BlanklineTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("BlanklineTransport is receive-only"))
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

impl ::sittir_core::render::Render for BlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_blankline(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum DoubleBlanklineTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for DoubleBlanklineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            50 => Ok(Self::DoubleBlankline),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind DoubleBlanklineTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DoubleBlanklineTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("DoubleBlanklineTransport is receive-only"))
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

impl ::sittir_core::render::Render for DoubleBlanklineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_double_blankline(w)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LazyTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LazyTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LazyTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LazyTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LazyTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct UnicodePropertyNameTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_layout"))]
    pub layout: Option<TransportLayout>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodePropertyNameTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodePropertyNameTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodePropertyNameTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodePropertyNameTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum CaretTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CaretTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            3 => Ok(Self::Caret),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind CaretTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CaretTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CaretTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CaretTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CaretTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CaretTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CaretTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for CaretTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_caret(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenQmarkTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            7 => Ok(Self::LparenQmark),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenQmarkTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenQmarkTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LparenQmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum EqTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for EqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            8 => Ok(Self::Eq),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind EqTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EqTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("EqTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<EqTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        EqTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<EqTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        EqTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for EqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_eq(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum BangTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for BangTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            9 => Ok(Self::Bang),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind BangTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BangTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("BangTransport is receive-only"))
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

impl ::sittir_core::render::Render for BangTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bang(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum RparenTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for RparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            10 => Ok(Self::Rparen),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind RparenTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RparenTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("RparenTransport is receive-only"))
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

impl ::sittir_core::render::Render for RparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rparen(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenQmarkLtTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            11 => Ok(Self::LparenQmarkLt),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenQmarkLtTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkLtTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenQmarkLtTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkLtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkLtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkLtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkLtTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LparenQmarkLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_lt(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LbrackTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            13 => Ok(Self::Lbrack),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LbrackTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbrackTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LbrackTransport is receive-only"))
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

impl ::sittir_core::render::Render for LbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrack(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum DashTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for DashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            14 => Ok(Self::Dash),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind DashTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DashTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("DashTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<DashTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        DashTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<DashTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        DashTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for DashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_dash(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum BslashDashTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for BslashDashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            19 => Ok(Self::BslashDash),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind BslashDashTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BslashDashTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("BslashDashTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BslashDashTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BslashDashTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BslashDashTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BslashDashTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for BslashDashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bslash_dash(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum RbrackTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for RbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            15 => Ok(Self::Rbrack),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind RbrackTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RbrackTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("RbrackTransport is receive-only"))
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

impl ::sittir_core::render::Render for RbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rbrack(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LbrackColonTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            16 => Ok(Self::LbrackColon),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LbrackColonTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbrackColonTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LbrackColonTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LbrackColonTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LbrackColonTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LbrackColonTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LbrackColonTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LbrackColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrack_colon(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum ColonRbrackTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ColonRbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            17 => Ok(Self::ColonRbrack),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind ColonRbrackTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ColonRbrackTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ColonRbrackTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ColonRbrackTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ColonRbrackTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ColonRbrackTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ColonRbrackTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for ColonRbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_colon_rbrack(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            21 => Ok(Self::Lparen),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenTransport is receive-only"))
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

impl ::sittir_core::render::Render for LparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenQmarkPLtTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkPLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            22 => Ok(Self::LparenQmarkPLt),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenQmarkPLtTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkPLtTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenQmarkPLtTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkPLtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkPLtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkPLtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkPLtTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LparenQmarkPLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_plt(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum GtTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for GtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            23 => Ok(Self::Gt),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind GtTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GtTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("GtTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GtTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for GtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_gt(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenQmarkColonTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            24 => Ok(Self::LparenQmarkColon),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenQmarkColonTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkColonTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenQmarkColonTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkColonTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkColonTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkColonTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkColonTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LparenQmarkColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_colon(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum StarTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for StarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            25 => Ok(Self::Star),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind StarTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StarTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("StarTransport is receive-only"))
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

impl ::sittir_core::render::Render for StarTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_star(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum QmarkTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for QmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            26 => Ok(Self::Qmark),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind QmarkTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for QmarkTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("QmarkTransport is receive-only"))
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

impl ::sittir_core::render::Render for QmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_qmark(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum PlusTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PlusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            27 => Ok(Self::Plus),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind PlusTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PlusTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PlusTransport is receive-only"))
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

impl ::sittir_core::render::Render for PlusTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_plus(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LbraceTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            28 => Ok(Self::Lbrace),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LbraceTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbraceTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LbraceTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LbraceTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LbraceTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LbraceTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LbraceTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lbrace(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum RbraceTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for RbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            30 => Ok(Self::Rbrace),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind RbraceTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RbraceTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("RbraceTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<RbraceTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        RbraceTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<RbraceTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        RbraceTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for RbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_rbrace(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum BslashkTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for BslashkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            31 => Ok(Self::Bslashk),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind BslashkTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BslashkTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("BslashkTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<BslashkTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        BslashkTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<BslashkTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        BslashkTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for BslashkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_bslashk(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LtTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            32 => Ok(Self::Lt),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LtTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LtTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LtTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LtTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lt(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum LparenQmarkPEqTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkPEqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            33 => Ok(Self::LparenQmarkPEq),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind LparenQmarkPEqTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkPEqTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("LparenQmarkPEqTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkPEqTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkPEqTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkPEqTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkPEqTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for LparenQmarkPEqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_lparen_qmark_peq(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum CommaTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CommaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            29 => Ok(Self::Comma),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind CommaTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CommaTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CommaTransport is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CommaTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CommaTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CommaTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CommaTransport::to_napi_value(env, *val)
    }
}

impl ::sittir_core::render::Render for CommaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_comma(w)
    }
}

#[derive(Debug, Clone, Copy)]
pub enum ColonTransport {
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

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match u16::from_napi_value(env, napi_val)? {
            40 => Ok(Self::Colon),
            other => Err(::napi::Error::from_reason(format!(
                "kind id {other} is not a kind ColonTransport takes",
            ))),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ColonTransport {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ColonTransport is receive-only"))
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

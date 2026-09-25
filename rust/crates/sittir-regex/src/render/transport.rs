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

use ::sittir_core::render_with_trivia;
use ::sittir_core::options::Edged as _;
use super::options;

#[derive(Debug, Clone)]
pub enum AnyTransport {
    Pattern(PatternTransport),
    Alternation(AlternationTransport),
    Term(TermTransport),
    AnyCharacter(AnyCharacterTransport),
    StartAssertion(StartAssertionTransport),
    EndAssertion(EndAssertionTransport),
    BoundaryAssertion(BoundaryAssertionTransport),
    NonBoundaryAssertion(NonBoundaryAssertionTransport),
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
    UnicodeProperty(UnicodePropertyTransport),
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
    InlineFlagsGroupEnable(InlineFlagsGroupEnableTransport),
    InlineFlagsGroupToggle(InlineFlagsGroupToggleTransport),
    InlineFlagsGroupDisable(InlineFlagsGroupDisableTransport),
    Tight(TightTransport),
    Space(SpaceTransport),
    Newline(NewlineTransport),
    Lazy(LazyTransport),
    UnicodePropertyName(UnicodePropertyNameTransport),
    Caret(CaretTransport),
    LparenQmark(LparenQmarkTransport),
    Eq(EqTransport),
    Bang(BangTransport),
    Rparen(RparenTransport),
    LparenQmarkLt(LparenQmarkLtTransport),
    Lbrack(LbrackTransport),
    Dash(DashTransport),
    BslashDash(BslashDashTransport),
    Rbrack(RbrackTransport),
    LbrackColon(LbrackColonTransport),
    ColonRbrack(ColonRbrackTransport),
    Lparen(LparenTransport),
    LparenQmarkpLt(LparenQmarkpLtTransport),
    Gt(GtTransport),
    LparenQmarkColon(LparenQmarkColonTransport),
    Star(StarTransport),
    Qmark(QmarkTransport),
    Plus(PlusTransport),
    Lbrace(LbraceTransport),
    Rbrace(RbraceTransport),
    Comma(CommaTransport),
    Bslashk(BslashkTransport),
    Lt(LtTransport),
    LparenQmarkpEq(LparenQmarkpEqTransport),
    Colon(ColonTransport),
    Literal0_65_71,
    Literal1_62_61_6e_67,
    Literal2_62_73_6c_61_73_68_5f_64_61_73_68,
    Literal3_64_61_73_68,
    Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74,
    Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74,
    Literal6_5c_5c_5b_64_44_73_53_77_57_5d,
    Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e,
    Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e,
    Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
    Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
    Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72,
    Literal12_5c_5c_5b_70_50_5d,
    Literal13_71_6d_61_72_6b,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for AnyTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnyTransport::Pattern(t) => t.prepare(ctx),
            AnyTransport::Alternation(t) => t.prepare(ctx),
            AnyTransport::Term(t) => t.prepare(ctx),
            AnyTransport::AnyCharacter(t) => t.prepare(ctx),
            AnyTransport::StartAssertion(t) => t.prepare(ctx),
            AnyTransport::EndAssertion(t) => t.prepare(ctx),
            AnyTransport::BoundaryAssertion(t) => t.prepare(ctx),
            AnyTransport::NonBoundaryAssertion(t) => t.prepare(ctx),
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
            AnyTransport::UnicodeProperty(t) => t.prepare(ctx),
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
            AnyTransport::InlineFlagsGroupEnable(t) => t.prepare(ctx),
            AnyTransport::InlineFlagsGroupToggle(t) => t.prepare(ctx),
            AnyTransport::InlineFlagsGroupDisable(t) => t.prepare(ctx),
            AnyTransport::Tight(t) => t.prepare(ctx),
            AnyTransport::Space(t) => t.prepare(ctx),
            AnyTransport::Newline(t) => t.prepare(ctx),
            AnyTransport::Lazy(t) => t.prepare(ctx),
            AnyTransport::UnicodePropertyName(t) => t.prepare(ctx),
            AnyTransport::Caret(t) => t.prepare(ctx),
            AnyTransport::LparenQmark(t) => t.prepare(ctx),
            AnyTransport::Eq(t) => t.prepare(ctx),
            AnyTransport::Bang(t) => t.prepare(ctx),
            AnyTransport::Rparen(t) => t.prepare(ctx),
            AnyTransport::LparenQmarkLt(t) => t.prepare(ctx),
            AnyTransport::Lbrack(t) => t.prepare(ctx),
            AnyTransport::Dash(t) => t.prepare(ctx),
            AnyTransport::BslashDash(t) => t.prepare(ctx),
            AnyTransport::Rbrack(t) => t.prepare(ctx),
            AnyTransport::LbrackColon(t) => t.prepare(ctx),
            AnyTransport::ColonRbrack(t) => t.prepare(ctx),
            AnyTransport::Lparen(t) => t.prepare(ctx),
            AnyTransport::LparenQmarkpLt(t) => t.prepare(ctx),
            AnyTransport::Gt(t) => t.prepare(ctx),
            AnyTransport::LparenQmarkColon(t) => t.prepare(ctx),
            AnyTransport::Star(t) => t.prepare(ctx),
            AnyTransport::Qmark(t) => t.prepare(ctx),
            AnyTransport::Plus(t) => t.prepare(ctx),
            AnyTransport::Lbrace(t) => t.prepare(ctx),
            AnyTransport::Rbrace(t) => t.prepare(ctx),
            AnyTransport::Comma(t) => t.prepare(ctx),
            AnyTransport::Bslashk(t) => t.prepare(ctx),
            AnyTransport::Lt(t) => t.prepare(ctx),
            AnyTransport::LparenQmarkpEq(t) => t.prepare(ctx),
            AnyTransport::Colon(t) => t.prepare(ctx),
            AnyTransport::Literal0_65_71 => Ok(()),
            AnyTransport::Literal1_62_61_6e_67 => Ok(()),
            AnyTransport::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => Ok(()),
            AnyTransport::Literal3_64_61_73_68 => Ok(()),
            AnyTransport::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => Ok(()),
            AnyTransport::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => Ok(()),
            AnyTransport::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => Ok(()),
            AnyTransport::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            AnyTransport::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            AnyTransport::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            AnyTransport::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            AnyTransport::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => Ok(()),
            AnyTransport::Literal12_5c_5c_5b_70_50_5d => Ok(()),
            AnyTransport::Literal13_71_6d_61_72_6b => Ok(()),
            AnyTransport::Verbatim(t) => t.prepare(ctx),
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
                50 => Ok(AnyTransport::Pattern(
                    PatternTransport::from_napi_value(env, napi_val)?
                )),
                // kind: alternation (ALTERNATION)
                51 => Ok(AnyTransport::Alternation(
                    AlternationTransport::from_napi_value(env, napi_val)?
                )),
                // kind: term (TERM)
                52 => Ok(AnyTransport::Term(
                    TermTransport::from_napi_value(env, napi_val)?
                )),
                // kind: any_character (ANY_CHARACTER)
                2 => Ok(AnyTransport::AnyCharacter(
                    AnyCharacterTransport::from_napi_value(env, napi_val)?
                )),
                // kind: start_assertion (START_ASSERTION)
                53 => Ok(AnyTransport::StartAssertion(
                    StartAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: end_assertion (END_ASSERTION)
                4 => Ok(AnyTransport::EndAssertion(
                    EndAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: boundary_assertion (BOUNDARY_ASSERTION)
                5 => Ok(AnyTransport::BoundaryAssertion(
                    BoundaryAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: non_boundary_assertion (NON_BOUNDARY_ASSERTION)
                6 => Ok(AnyTransport::NonBoundaryAssertion(
                    NonBoundaryAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lookaround_assertion (LOOKAROUND_ASSERTION)
                54 => Ok(AnyTransport::LookaroundAssertion(
                    LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _lookahead_assertion (_LOOKAHEAD_ASSERTION)
                55 => Ok(AnyTransport::LookaheadAssertion(
                    LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _lookbehind_assertion (_LOOKBEHIND_ASSERTION)
                56 => Ok(AnyTransport::LookbehindAssertion(
                    LookbehindAssertionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: pattern_character (PATTERN_CHARACTER)
                12 => Ok(AnyTransport::PatternCharacter(
                    PatternCharacterTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class (CHARACTER_CLASS)
                57 => Ok(AnyTransport::CharacterClass(
                    CharacterClassTransport::from_napi_value(env, napi_val)?
                )),
                // kind: posix_character_class (POSIX_CHARACTER_CLASS)
                58 => Ok(AnyTransport::PosixCharacterClass(
                    PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                )),
                // kind: posix_class_name (POSIX_CLASS_NAME)
                59 => Ok(AnyTransport::PosixClassName(
                    PosixClassNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: class_range (CLASS_RANGE)
                60 => Ok(AnyTransport::ClassRange(
                    ClassRangeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: class_character (CLASS_CHARACTER)
                20 => Ok(AnyTransport::ClassCharacter(
                    ClassCharacterTransport::from_napi_value(env, napi_val)?
                )),
                // kind: anonymous_capturing_group (ANONYMOUS_CAPTURING_GROUP)
                61 => Ok(AnyTransport::AnonymousCapturingGroup(
                    AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_capturing_group (NAMED_CAPTURING_GROUP)
                62 => Ok(AnyTransport::NamedCapturingGroup(
                    NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: non_capturing_group (NON_CAPTURING_GROUP)
                63 => Ok(AnyTransport::NonCapturingGroup(
                    NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: flags (FLAGS)
                65 => Ok(AnyTransport::Flags(
                    FlagsTransport::from_napi_value(env, napi_val)?
                )),
                // kind: zero_or_more (ZERO_OR_MORE)
                66 => Ok(AnyTransport::ZeroOrMore(
                    ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: one_or_more (ONE_OR_MORE)
                67 => Ok(AnyTransport::OneOrMore(
                    OneOrMoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: optional (OPTIONAL)
                68 => Ok(AnyTransport::Optional(
                    OptionalTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier (COUNT_QUANTIFIER)
                69 => Ok(AnyTransport::CountQuantifier(
                    CountQuantifierTransport::from_napi_value(env, napi_val)?
                )),
                // kind: backreference_escape (BACKREFERENCE_ESCAPE)
                70 => Ok(AnyTransport::BackreferenceEscape(
                    BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_group_backreference (NAMED_GROUP_BACKREFERENCE)
                71 => Ok(AnyTransport::NamedGroupBackreference(
                    NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: decimal_escape (DECIMAL_ESCAPE)
                34 => Ok(AnyTransport::DecimalEscape(
                    DecimalEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape (CHARACTER_CLASS_ESCAPE)
                72 => Ok(AnyTransport::CharacterClassEscape(
                    CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_character_escape (UNICODE_CHARACTER_ESCAPE)
                73 => Ok(AnyTransport::UnicodeCharacterEscape(
                    UnicodeCharacterEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_value_expression (UNICODE_PROPERTY_VALUE_EXPRESSION)
                74 => Ok(AnyTransport::UnicodePropertyValueExpression(
                    UnicodePropertyValueExpressionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property (UNICODE_PROPERTY)
                38 => Ok(AnyTransport::UnicodeProperty(
                    UnicodePropertyTransport::from_napi_value(env, napi_val)?
                )),
                // kind: control_escape (CONTROL_ESCAPE)
                75 => Ok(AnyTransport::ControlEscape(
                    ControlEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: control_letter_escape (CONTROL_LETTER_ESCAPE)
                41 => Ok(AnyTransport::ControlLetterEscape(
                    ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: identity_escape (IDENTITY_ESCAPE)
                42 => Ok(AnyTransport::IdentityEscape(
                    IdentityEscapeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: group_name (GROUP_NAME)
                43 => Ok(AnyTransport::GroupName(
                    GroupNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: decimal_digits (DECIMAL_DIGITS)
                44 => Ok(AnyTransport::DecimalDigits(
                    DecimalDigitsTransport::from_napi_value(env, napi_val)?
                )),
                // kind: term_group (TERM_GROUP)
                76 => Ok(AnyTransport::TermGroup(
                    TermGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier_group (COUNT_QUANTIFIER_GROUP)
                77 => Ok(AnyTransport::CountQuantifierGroup(
                    CountQuantifierGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: count_quantifier_arm (COUNT_QUANTIFIER_ARM)
                78 => Ok(AnyTransport::CountQuantifierArm(
                    CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: character_class_escape_arm (CHARACTER_CLASS_ESCAPE_ARM)
                79 => Ok(AnyTransport::CharacterClassEscapeArm(
                    CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_value_expression_group (UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP)
                80 => Ok(AnyTransport::UnicodePropertyValueExpressionGroup(
                    UnicodePropertyValueExpressionGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_enable (INLINE_FLAGS_GROUP_ENABLE)
                81 => Ok(AnyTransport::InlineFlagsGroupEnable(
                    InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_toggle (INLINE_FLAGS_GROUP_TOGGLE)
                82 => Ok(AnyTransport::InlineFlagsGroupToggle(
                    InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                )),
                // kind: inline_flags_group_disable (INLINE_FLAGS_GROUP_DISABLE)
                83 => Ok(AnyTransport::InlineFlagsGroupDisable(
                    InlineFlagsGroupDisableTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _tight (_TIGHT)
                47 => Ok(AnyTransport::Tight(
                    TightTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _space (_SPACE)
                48 => Ok(AnyTransport::Space(
                    SpaceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: _newline (_NEWLINE)
                49 => Ok(AnyTransport::Newline(
                    NewlineTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lazy (LAZY)
                87 => Ok(AnyTransport::Lazy(
                    LazyTransport::from_napi_value(env, napi_val)?
                )),
                // kind: unicode_property_name (UNICODE_PROPERTY_NAME)
                88 => Ok(AnyTransport::UnicodePropertyName(
                    UnicodePropertyNameTransport::from_napi_value(env, napi_val)?
                )),
                // kind: caret (CARET)
                3 => Ok(AnyTransport::Caret(
                    CaretTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen_qmark (LPAREN_QMARK)
                7 => Ok(AnyTransport::LparenQmark(
                    LparenQmarkTransport::from_napi_value(env, napi_val)?
                )),
                // kind: eq (EQ)
                8 => Ok(AnyTransport::Eq(
                    EqTransport::from_napi_value(env, napi_val)?
                )),
                // kind: bang (BANG)
                9 => Ok(AnyTransport::Bang(
                    BangTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rparen (RPAREN)
                10 => Ok(AnyTransport::Rparen(
                    RparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen_qmark_lt (LPAREN_QMARK_LT)
                11 => Ok(AnyTransport::LparenQmarkLt(
                    LparenQmarkLtTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lbrack (LBRACK)
                13 => Ok(AnyTransport::Lbrack(
                    LbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: dash (DASH)
                14 => Ok(AnyTransport::Dash(
                    DashTransport::from_napi_value(env, napi_val)?
                )),
                // kind: bslash_dash (BSLASH_DASH)
                19 => Ok(AnyTransport::BslashDash(
                    BslashDashTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rbrack (RBRACK)
                15 => Ok(AnyTransport::Rbrack(
                    RbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lbrack_colon (LBRACK_COLON)
                16 => Ok(AnyTransport::LbrackColon(
                    LbrackColonTransport::from_napi_value(env, napi_val)?
                )),
                // kind: colon_rbrack (COLON_RBRACK)
                17 => Ok(AnyTransport::ColonRbrack(
                    ColonRbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen (LPAREN)
                21 => Ok(AnyTransport::Lparen(
                    LparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen_qmarkp_lt (LPAREN_QMARKP_LT)
                22 => Ok(AnyTransport::LparenQmarkpLt(
                    LparenQmarkpLtTransport::from_napi_value(env, napi_val)?
                )),
                // kind: gt (GT)
                23 => Ok(AnyTransport::Gt(
                    GtTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen_qmark_colon (LPAREN_QMARK_COLON)
                24 => Ok(AnyTransport::LparenQmarkColon(
                    LparenQmarkColonTransport::from_napi_value(env, napi_val)?
                )),
                // kind: star (STAR)
                25 => Ok(AnyTransport::Star(
                    StarTransport::from_napi_value(env, napi_val)?
                )),
                // kind: qmark (QMARK)
                26 => Ok(AnyTransport::Qmark(
                    QmarkTransport::from_napi_value(env, napi_val)?
                )),
                // kind: plus (PLUS)
                27 => Ok(AnyTransport::Plus(
                    PlusTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lbrace (LBRACE)
                28 => Ok(AnyTransport::Lbrace(
                    LbraceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rbrace (RBRACE)
                30 => Ok(AnyTransport::Rbrace(
                    RbraceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: comma (COMMA)
                29 => Ok(AnyTransport::Comma(
                    CommaTransport::from_napi_value(env, napi_val)?
                )),
                // kind: bslashk (BSLASHK)
                31 => Ok(AnyTransport::Bslashk(
                    BslashkTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lt (LT)
                32 => Ok(AnyTransport::Lt(
                    LtTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen_qmarkp_eq (LPAREN_QMARKP_EQ)
                33 => Ok(AnyTransport::LparenQmarkpEq(
                    LparenQmarkpEqTransport::from_napi_value(env, napi_val)?
                )),
                // kind: colon (COLON)
                45 => Ok(AnyTransport::Colon(
                    ColonTransport::from_napi_value(env, napi_val)?
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
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for TriviaTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TriviaTransport::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::render::Render for TriviaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TriviaTransport::Verbatim(t) => t.render(w),
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

#[derive(Debug, Clone, Default)]
pub struct TransportTrivia {
    pub leading: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>>,
    pub trailing: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>>,
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for TransportTrivia {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let leading: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>> = obj.get("leading")?;
        let trailing: Option<Vec<::sittir_core::SlotValue<TriviaTransport>>> = obj.get("trailing")?;
        Ok(TransportTrivia { leading, trailing })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for TransportTrivia {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ValidateNapiValue for TransportTrivia {}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::TypeName for TransportTrivia {
    fn type_name() -> &'static str {
        "TransportTrivia"
    }
    fn value_type() -> ::napi::ValueType {
        ::napi::ValueType::Object
    }
}


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
                    51 => Ok(Self::Alternation(
                        AlternationTransport::from_napi_value(env, napi_val)?
                    )),
                    52 => Ok(Self::Term(
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
                    51 => Ok(Self::Alternation(
                        AlternationTransport::from_napi_value(env, napi_val)?
                    )),
                    52 => Ok(Self::Term(
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

fn pattern_content_transport_slot_to_any(t: PatternContentTransportSlot) -> AnyTransport {
    match t {
        PatternContentTransportSlot::Alternation(inner) => AnyTransport::Alternation(inner),
        PatternContentTransportSlot::Term(inner) => AnyTransport::Term(inner),
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
                    55 => Ok(Self::LookaheadAssertion(
                        LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    56 => Ok(Self::LookbehindAssertion(
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
                    55 => Ok(Self::LookaheadAssertion(
                        LookaheadAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    56 => Ok(Self::LookbehindAssertion(
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

fn lookaround_assertion_content_transport_slot_to_any(t: LookaroundAssertionContentTransportSlot) -> AnyTransport {
    match t {
        LookaroundAssertionContentTransportSlot::LookaheadAssertion(inner) => AnyTransport::LookaheadAssertion(inner),
        LookaroundAssertionContentTransportSlot::LookbehindAssertion(inner) => AnyTransport::LookbehindAssertion(inner),
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
    Literal0_65_71,
    Literal1_62_61_6e_67,
}

impl ::sittir_core::prepare::Prepare for LookaheadAssertionContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LookaheadAssertionContentTransportSlot::Literal0_65_71 => Ok(()),
            LookaheadAssertionContentTransportSlot::Literal1_62_61_6e_67 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LookaheadAssertionContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal0_65_71 => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Literal1_62_61_6e_67 => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
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
                    8 => Ok(Self::Literal0_65_71),
                    9 => Ok(Self::Literal1_62_61_6e_67),
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
                    8 => Ok(Self::Literal0_65_71),
                    9 => Ok(Self::Literal1_62_61_6e_67),
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

fn lookahead_assertion_content_transport_slot_to_any(t: LookaheadAssertionContentTransportSlot) -> AnyTransport {
    match t {
        LookaheadAssertionContentTransportSlot::Literal0_65_71 => AnyTransport::Literal0_65_71,
        LookaheadAssertionContentTransportSlot::Literal1_62_61_6e_67 => AnyTransport::Literal1_62_61_6e_67,
    }
}

impl ::sittir_core::render::Render for LookaheadAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookaheadAssertionContentTransportSlot::Literal0_65_71 => {
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_EQ_BEFORE);
                let written = w.text("=");
                written?;
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_EQ_AFTER);
                Ok(())
            }
            LookaheadAssertionContentTransportSlot::Literal1_62_61_6e_67 => {
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_BANG_BEFORE);
                let written = w.text("!");
                written?;
                w.site_at(options::SITE_LOOKAHEAD_ASSERTION_BANG_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum LookbehindAssertionContentTransportSlot {
    Literal0_65_71,
    Literal1_62_61_6e_67,
}

impl ::sittir_core::prepare::Prepare for LookbehindAssertionContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LookbehindAssertionContentTransportSlot::Literal0_65_71 => Ok(()),
            LookbehindAssertionContentTransportSlot::Literal1_62_61_6e_67 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LookbehindAssertionContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal0_65_71 => [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k)),
            Self::Literal1_62_61_6e_67 => [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k)),
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
                    8 => Ok(Self::Literal0_65_71),
                    9 => Ok(Self::Literal1_62_61_6e_67),
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
                    8 => Ok(Self::Literal0_65_71),
                    9 => Ok(Self::Literal1_62_61_6e_67),
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

fn lookbehind_assertion_content_transport_slot_to_any(t: LookbehindAssertionContentTransportSlot) -> AnyTransport {
    match t {
        LookbehindAssertionContentTransportSlot::Literal0_65_71 => AnyTransport::Literal0_65_71,
        LookbehindAssertionContentTransportSlot::Literal1_62_61_6e_67 => AnyTransport::Literal1_62_61_6e_67,
    }
}

impl ::sittir_core::render::Render for LookbehindAssertionContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LookbehindAssertionContentTransportSlot::Literal0_65_71 => {
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE);
                let written = w.text("=");
                written?;
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_EQ_AFTER);
                Ok(())
            }
            LookbehindAssertionContentTransportSlot::Literal1_62_61_6e_67 => {
                w.site_at(options::SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE);
                let written = w.text("!");
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
    Literal2_62_73_6c_61_73_68_5f_64_61_73_68,
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
            CharacterClassClassAtomsTransportSlot::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => Ok(()),
            CharacterClassClassAtomsTransportSlot::Verbatim(t) => t.prepare(ctx),
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
            Self::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(20), ::sittir_core::types::KindId(41), ::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k)),
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
                    19 => Ok(Self::Literal2_62_73_6c_61_73_68_5f_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    14 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    42 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::ClassRange(
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
                    19 => Ok(Self::Literal2_62_73_6c_61_73_68_5f_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    14 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    42 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    60 => Ok(Self::ClassRange(
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

fn character_class_class_atoms_transport_slot_to_any(t: CharacterClassClassAtomsTransportSlot) -> AnyTransport {
    match t {
        CharacterClassClassAtomsTransportSlot::ClassCharacter(inner) => AnyTransport::ClassCharacter(inner),
        CharacterClassClassAtomsTransportSlot::CharacterClassEscape(inner) => AnyTransport::CharacterClassEscape(inner),
        CharacterClassClassAtomsTransportSlot::ControlEscape(inner) => AnyTransport::ControlEscape(inner),
        CharacterClassClassAtomsTransportSlot::ControlLetterEscape(inner) => AnyTransport::ControlLetterEscape(inner),
        CharacterClassClassAtomsTransportSlot::IdentityEscape(inner) => AnyTransport::IdentityEscape(inner),
        CharacterClassClassAtomsTransportSlot::PosixCharacterClass(inner) => AnyTransport::PosixCharacterClass(inner),
        CharacterClassClassAtomsTransportSlot::ClassRange(inner) => AnyTransport::ClassRange(inner),
        CharacterClassClassAtomsTransportSlot::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => AnyTransport::Literal2_62_73_6c_61_73_68_5f_64_61_73_68,
        CharacterClassClassAtomsTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
            CharacterClassClassAtomsTransportSlot::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => w.text("\\-"),
            CharacterClassClassAtomsTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ClassRangeStartTransportSlot {
    ClassCharacter(ClassCharacterTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    ControlEscape(ControlEscapeTransport),
    Literal3_64_61_73_68,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for ClassRangeStartTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::CharacterClassEscape(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::ControlEscape(t) => t.prepare(ctx),
            ClassRangeStartTransportSlot::Literal3_64_61_73_68 => Ok(()),
            ClassRangeStartTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for ClassRangeStartTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ClassCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::Literal3_64_61_73_68 => [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(20), ::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k)),
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
                    14 => Ok(Self::Literal3_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
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
                    14 => Ok(Self::Literal3_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
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

fn class_range_start_transport_slot_to_any(t: ClassRangeStartTransportSlot) -> AnyTransport {
    match t {
        ClassRangeStartTransportSlot::ClassCharacter(inner) => AnyTransport::ClassCharacter(inner),
        ClassRangeStartTransportSlot::CharacterClassEscape(inner) => AnyTransport::CharacterClassEscape(inner),
        ClassRangeStartTransportSlot::ControlEscape(inner) => AnyTransport::ControlEscape(inner),
        ClassRangeStartTransportSlot::Literal3_64_61_73_68 => AnyTransport::Literal3_64_61_73_68,
        ClassRangeStartTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
    }
}

impl ::sittir_core::render::Render for ClassRangeStartTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ClassRangeStartTransportSlot::ClassCharacter(inner) => inner.render(w),
            ClassRangeStartTransportSlot::CharacterClassEscape(inner) => inner.render(w),
            ClassRangeStartTransportSlot::ControlEscape(inner) => inner.render(w),
            ClassRangeStartTransportSlot::Literal3_64_61_73_68 => {
                w.site_at(options::SITE_CLASS_RANGE_DASH_BEFORE);
                let written = w.text("-");
                written?;
                w.site_at(options::SITE_CLASS_RANGE_DASH_AFTER);
                Ok(())
            }
            ClassRangeStartTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum ClassRangeEndTransportSlot {
    ClassCharacter(ClassCharacterTransport),
    CharacterClassEscape(CharacterClassEscapeTransport),
    ControlEscape(ControlEscapeTransport),
    Literal3_64_61_73_68,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for ClassRangeEndTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ClassRangeEndTransportSlot::ClassCharacter(t) => t.prepare(ctx),
            ClassRangeEndTransportSlot::CharacterClassEscape(t) => t.prepare(ctx),
            ClassRangeEndTransportSlot::ControlEscape(t) => t.prepare(ctx),
            ClassRangeEndTransportSlot::Literal3_64_61_73_68 => Ok(()),
            ClassRangeEndTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for ClassRangeEndTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ClassCharacter(inner) => inner.kind_in(kinds),
            Self::CharacterClassEscape(inner) => inner.kind_in(kinds),
            Self::ControlEscape(inner) => inner.kind_in(kinds),
            Self::Literal3_64_61_73_68 => [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(20), ::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ClassRangeEndTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    14 => Ok(Self::Literal3_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ClassRangeEndTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in ClassRangeEndTransportSlot")
                )?;
                match kind_id {
                    14 => Ok(Self::Literal3_64_61_73_68),
                    20 => Ok(Self::ClassCharacter(
                        ClassCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ClassRangeEndTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("ClassRangeEndTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ClassRangeEndTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ClassRangeEndTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ClassRangeEndTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ClassRangeEndTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ClassRangeEndTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ClassRangeEndTransportSlot::to_napi_value(env, *val)
    }
}

fn class_range_end_transport_slot_to_any(t: ClassRangeEndTransportSlot) -> AnyTransport {
    match t {
        ClassRangeEndTransportSlot::ClassCharacter(inner) => AnyTransport::ClassCharacter(inner),
        ClassRangeEndTransportSlot::CharacterClassEscape(inner) => AnyTransport::CharacterClassEscape(inner),
        ClassRangeEndTransportSlot::ControlEscape(inner) => AnyTransport::ControlEscape(inner),
        ClassRangeEndTransportSlot::Literal3_64_61_73_68 => AnyTransport::Literal3_64_61_73_68,
        ClassRangeEndTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
    }
}

impl ::sittir_core::render::Render for ClassRangeEndTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ClassRangeEndTransportSlot::ClassCharacter(inner) => inner.render(w),
            ClassRangeEndTransportSlot::CharacterClassEscape(inner) => inner.render(w),
            ClassRangeEndTransportSlot::ControlEscape(inner) => inner.render(w),
            ClassRangeEndTransportSlot::Literal3_64_61_73_68 => {
                w.site_at(options::SITE_CLASS_RANGE_DASH_BEFORE);
                let written = w.text("-");
                written?;
                w.site_at(options::SITE_CLASS_RANGE_DASH_AFTER);
                Ok(())
            }
            ClassRangeEndTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedCapturingGroupContentTransportSlot {
    Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74,
    Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74,
}

impl ::sittir_core::prepare::Prepare for NamedCapturingGroupContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedCapturingGroupContentTransportSlot::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => Ok(()),
            NamedCapturingGroupContentTransportSlot::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedCapturingGroupContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k)),
            Self::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k)),
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
                    11 => Ok(Self::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74),
                    22 => Ok(Self::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74),
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
                    11 => Ok(Self::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74),
                    22 => Ok(Self::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74),
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

fn named_capturing_group_content_transport_slot_to_any(t: NamedCapturingGroupContentTransportSlot) -> AnyTransport {
    match t {
        NamedCapturingGroupContentTransportSlot::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => AnyTransport::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74,
        NamedCapturingGroupContentTransportSlot::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => AnyTransport::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74,
    }
}

impl ::sittir_core::render::Render for NamedCapturingGroupContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedCapturingGroupContentTransportSlot::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => {
                let written = w.text("(?<");
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER);
                Ok(())
            }
            NamedCapturingGroupContentTransportSlot::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => {
                let written = w.text("(?P<");
                written?;
                w.site_at(options::SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARKP_LT_AFTER);
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
}

impl ::sittir_core::view::KindOf for CountQuantifierContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::CountQuantifierArm(inner) => inner.kind_in(kinds),
            Self::DecimalDigits(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(44)].iter().any(|k| kinds.contains(k)),
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
                    78 => Ok(Self::CountQuantifierArm(
                        CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::DecimalDigits(
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
                    78 => Ok(Self::CountQuantifierArm(
                        CountQuantifierArmTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::DecimalDigits(
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

fn count_quantifier_content_transport_slot_to_any(t: CountQuantifierContentTransportSlot) -> AnyTransport {
    match t {
        CountQuantifierContentTransportSlot::CountQuantifierArm(inner) => AnyTransport::CountQuantifierArm(inner),
        CountQuantifierContentTransportSlot::DecimalDigits(inner) => AnyTransport::DecimalDigits(inner),
        CountQuantifierContentTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
    CharacterClassEscapeArm(CharacterClassEscapeArmTransport),
    UnicodeCharacterEscape(UnicodeCharacterEscapeTransport),
    Literal6_5c_5c_5b_64_44_73_53_77_57_5d,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(t) => t.prepare(ctx),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(t) => t.prepare(ctx),
            CharacterClassEscapeContentTransportSlot::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => Ok(()),
            CharacterClassEscapeContentTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::CharacterClassEscapeArm(inner) => inner.kind_in(kinds),
            Self::UnicodeCharacterEscape(inner) => inner.kind_in(kinds),
            Self::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => false,
            Self::Verbatim(_) => [::sittir_core::types::KindId(73)].iter().any(|k| kinds.contains(k)),
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
                    79 => Ok(Self::CharacterClassEscapeArm(
                        CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::UnicodeCharacterEscape(
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
                    79 => Ok(Self::CharacterClassEscapeArm(
                        CharacterClassEscapeArmTransport::from_napi_value(env, napi_val)?
                    )),
                    73 => Ok(Self::UnicodeCharacterEscape(
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

fn character_class_escape_content_transport_slot_to_any(t: CharacterClassEscapeContentTransportSlot) -> AnyTransport {
    match t {
        CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(inner) => AnyTransport::CharacterClassEscapeArm(inner),
        CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(inner) => AnyTransport::UnicodeCharacterEscape(inner),
        CharacterClassEscapeContentTransportSlot::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => AnyTransport::Literal6_5c_5c_5b_64_44_73_53_77_57_5d,
        CharacterClassEscapeContentTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
    }
}

impl ::sittir_core::render::Render for CharacterClassEscapeContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassEscapeContentTransportSlot::CharacterClassEscapeArm(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::UnicodeCharacterEscape(inner) => inner.render(w),
            CharacterClassEscapeContentTransportSlot::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => w.text("\\\\[dDsSwW]"),
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
}

impl ::sittir_core::view::KindOf for TermGroupQuantifierTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ZeroOrMore(inner) => inner.kind_in(kinds),
            Self::OneOrMore(inner) => inner.kind_in(kinds),
            Self::Optional(inner) => inner.kind_in(kinds),
            Self::CountQuantifier(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(66), ::sittir_core::types::KindId(67), ::sittir_core::types::KindId(68)].iter().any(|k| kinds.contains(k)),
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
                    66 => Ok(Self::ZeroOrMore(
                        ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    67 => Ok(Self::OneOrMore(
                        OneOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    68 => Ok(Self::Optional(
                        OptionalTransport::from_napi_value(env, napi_val)?
                    )),
                    69 => Ok(Self::CountQuantifier(
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
                    66 => Ok(Self::ZeroOrMore(
                        ZeroOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    67 => Ok(Self::OneOrMore(
                        OneOrMoreTransport::from_napi_value(env, napi_val)?
                    )),
                    68 => Ok(Self::Optional(
                        OptionalTransport::from_napi_value(env, napi_val)?
                    )),
                    69 => Ok(Self::CountQuantifier(
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

fn term_group_quantifier_transport_slot_to_any(t: TermGroupQuantifierTransportSlot) -> AnyTransport {
    match t {
        TermGroupQuantifierTransportSlot::ZeroOrMore(inner) => AnyTransport::ZeroOrMore(inner),
        TermGroupQuantifierTransportSlot::OneOrMore(inner) => AnyTransport::OneOrMore(inner),
        TermGroupQuantifierTransportSlot::Optional(inner) => AnyTransport::Optional(inner),
        TermGroupQuantifierTransportSlot::CountQuantifier(inner) => AnyTransport::CountQuantifier(inner),
        TermGroupQuantifierTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
    Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e,
    Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e,
    Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
    Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
    Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72,
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
            TermGroupContentTransportSlot::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            TermGroupContentTransportSlot::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            TermGroupContentTransportSlot::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            TermGroupContentTransportSlot::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => Ok(()),
            TermGroupContentTransportSlot::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => Ok(()),
            TermGroupContentTransportSlot::Verbatim(t) => t.prepare(ctx),
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
            Self::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => [::sittir_core::types::KindId(53)].iter().any(|k| kinds.contains(k)),
            Self::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
            Self::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k)),
            Self::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(12), ::sittir_core::types::KindId(34), ::sittir_core::types::KindId(41), ::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k)),
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
                    53 => Ok(Self::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e),
                    4 => Ok(Self::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e),
                    5 => Ok(Self::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e),
                    6 => Ok(Self::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e),
                    2 => Ok(Self::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72),
                    54 => Ok(Self::LookaroundAssertion(
                        LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    12 => Ok(Self::PatternCharacter(
                        PatternCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    57 => Ok(Self::CharacterClass(
                        CharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::DecimalEscape(
                        DecimalEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    42 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    19 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    70 => Ok(Self::BackreferenceEscape(
                        BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    71 => Ok(Self::NamedGroupBackreference(
                        NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                    )),
                    61 => Ok(Self::AnonymousCapturingGroup(
                        AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::NamedCapturingGroup(
                        NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    63 => Ok(Self::NonCapturingGroup(
                        NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    81 => Ok(Self::InlineFlagsGroupEnable(
                        InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                    )),
                    82 => Ok(Self::InlineFlagsGroupToggle(
                        InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                    )),
                    83 => Ok(Self::InlineFlagsGroupDisable(
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
                    53 => Ok(Self::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e),
                    4 => Ok(Self::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e),
                    5 => Ok(Self::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e),
                    6 => Ok(Self::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e),
                    2 => Ok(Self::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72),
                    54 => Ok(Self::LookaroundAssertion(
                        LookaroundAssertionTransport::from_napi_value(env, napi_val)?
                    )),
                    12 => Ok(Self::PatternCharacter(
                        PatternCharacterTransport::from_napi_value(env, napi_val)?
                    )),
                    57 => Ok(Self::CharacterClass(
                        CharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    58 => Ok(Self::PosixCharacterClass(
                        PosixCharacterClassTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::DecimalEscape(
                        DecimalEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    72 => Ok(Self::CharacterClassEscape(
                        CharacterClassEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    75 => Ok(Self::ControlEscape(
                        ControlEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::ControlLetterEscape(
                        ControlLetterEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    42 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    19 => Ok(Self::IdentityEscape(
                        IdentityEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    70 => Ok(Self::BackreferenceEscape(
                        BackreferenceEscapeTransport::from_napi_value(env, napi_val)?
                    )),
                    71 => Ok(Self::NamedGroupBackreference(
                        NamedGroupBackreferenceTransport::from_napi_value(env, napi_val)?
                    )),
                    61 => Ok(Self::AnonymousCapturingGroup(
                        AnonymousCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    62 => Ok(Self::NamedCapturingGroup(
                        NamedCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    63 => Ok(Self::NonCapturingGroup(
                        NonCapturingGroupTransport::from_napi_value(env, napi_val)?
                    )),
                    81 => Ok(Self::InlineFlagsGroupEnable(
                        InlineFlagsGroupEnableTransport::from_napi_value(env, napi_val)?
                    )),
                    82 => Ok(Self::InlineFlagsGroupToggle(
                        InlineFlagsGroupToggleTransport::from_napi_value(env, napi_val)?
                    )),
                    83 => Ok(Self::InlineFlagsGroupDisable(
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

fn term_group_content_transport_slot_to_any(t: TermGroupContentTransportSlot) -> AnyTransport {
    match t {
        TermGroupContentTransportSlot::LookaroundAssertion(inner) => AnyTransport::LookaroundAssertion(inner),
        TermGroupContentTransportSlot::PatternCharacter(inner) => AnyTransport::PatternCharacter(inner),
        TermGroupContentTransportSlot::CharacterClass(inner) => AnyTransport::CharacterClass(inner),
        TermGroupContentTransportSlot::PosixCharacterClass(inner) => AnyTransport::PosixCharacterClass(inner),
        TermGroupContentTransportSlot::DecimalEscape(inner) => AnyTransport::DecimalEscape(inner),
        TermGroupContentTransportSlot::CharacterClassEscape(inner) => AnyTransport::CharacterClassEscape(inner),
        TermGroupContentTransportSlot::ControlEscape(inner) => AnyTransport::ControlEscape(inner),
        TermGroupContentTransportSlot::ControlLetterEscape(inner) => AnyTransport::ControlLetterEscape(inner),
        TermGroupContentTransportSlot::IdentityEscape(inner) => AnyTransport::IdentityEscape(inner),
        TermGroupContentTransportSlot::BackreferenceEscape(inner) => AnyTransport::BackreferenceEscape(inner),
        TermGroupContentTransportSlot::NamedGroupBackreference(inner) => AnyTransport::NamedGroupBackreference(inner),
        TermGroupContentTransportSlot::AnonymousCapturingGroup(inner) => AnyTransport::AnonymousCapturingGroup(inner),
        TermGroupContentTransportSlot::NamedCapturingGroup(inner) => AnyTransport::NamedCapturingGroup(inner),
        TermGroupContentTransportSlot::NonCapturingGroup(inner) => AnyTransport::NonCapturingGroup(inner),
        TermGroupContentTransportSlot::InlineFlagsGroupEnable(inner) => AnyTransport::InlineFlagsGroupEnable(inner),
        TermGroupContentTransportSlot::InlineFlagsGroupToggle(inner) => AnyTransport::InlineFlagsGroupToggle(inner),
        TermGroupContentTransportSlot::InlineFlagsGroupDisable(inner) => AnyTransport::InlineFlagsGroupDisable(inner),
        TermGroupContentTransportSlot::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => AnyTransport::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e,
        TermGroupContentTransportSlot::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => AnyTransport::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e,
        TermGroupContentTransportSlot::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => AnyTransport::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
        TermGroupContentTransportSlot::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => AnyTransport::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e,
        TermGroupContentTransportSlot::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => AnyTransport::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72,
        TermGroupContentTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
            TermGroupContentTransportSlot::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => {
                let written = w.text("^");
                written?;
                w.site_at(options::SITE_TERM_GROUP_CARET_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => {
                let written = w.text("$");
                written?;
                w.site_at(options::SITE_TERM_GROUP_END_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => {
                let written = w.text("\\b");
                written?;
                w.site_at(options::SITE_TERM_GROUP_BOUNDARY_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => {
                let written = w.text("\\B");
                written?;
                w.site_at(options::SITE_TERM_GROUP_NON_BOUNDARY_ASSERTION_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => {
                let written = w.text(".");
                written?;
                w.site_at(options::SITE_TERM_GROUP_ANY_CHARACTER_AFTER);
                Ok(())
            }
            TermGroupContentTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum CharacterClassEscapeArmContentTransportSlot {
    Literal12_5c_5c_5b_70_50_5d,
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeArmContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            CharacterClassEscapeArmContentTransportSlot::Literal12_5c_5c_5b_70_50_5d => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeArmContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal12_5c_5c_5b_70_50_5d => false,
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for CharacterClassEscapeArmContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassEscapeArmContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in CharacterClassEscapeArmContentTransportSlot")
                )?;
                match kind_id {
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in CharacterClassEscapeArmContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("CharacterClassEscapeArmContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CharacterClassEscapeArmContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("CharacterClassEscapeArmContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<CharacterClassEscapeArmContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        CharacterClassEscapeArmContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<CharacterClassEscapeArmContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        CharacterClassEscapeArmContentTransportSlot::to_napi_value(env, *val)
    }
}

fn character_class_escape_arm_content_transport_slot_to_any(t: CharacterClassEscapeArmContentTransportSlot) -> AnyTransport {
    match t {
        CharacterClassEscapeArmContentTransportSlot::Literal12_5c_5c_5b_70_50_5d => AnyTransport::Literal12_5c_5c_5b_70_50_5d,
    }
}

impl ::sittir_core::render::Render for CharacterClassEscapeArmContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            CharacterClassEscapeArmContentTransportSlot::Literal12_5c_5c_5b_70_50_5d => w.text("\\\\[pP]"),
        }
    }
}

#[derive(Debug, Clone)]
pub enum LazyContentTransportSlot {
    Literal13_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for LazyContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            LazyContentTransportSlot::Literal13_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for LazyContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal13_71_6d_61_72_6b => [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k)),
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
                    26 => Ok(Self::Literal13_71_6d_61_72_6b),
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
                    26 => Ok(Self::Literal13_71_6d_61_72_6b),
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

fn lazy_content_transport_slot_to_any(t: LazyContentTransportSlot) -> AnyTransport {
    match t {
        LazyContentTransportSlot::Literal13_71_6d_61_72_6b => AnyTransport::Literal13_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for LazyContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            LazyContentTransportSlot::Literal13_71_6d_61_72_6b => w.text("?"),
        }
    }
}


#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct PatternTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<PatternContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for PatternTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PatternTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(50) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PatternTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_pattern(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PatternTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term"))]
    pub term: Vec<Option<::sittir_core::SlotValue<TermTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_separator_space_before"))]
    pub term_separator_space_before: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_separator_space_after"))]
    pub term_separator_space_after: Option<u16>,
}

impl ::sittir_core::view::KindOf for AlternationTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(51)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AlternationTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(51) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AlternationTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_alternation(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AlternationTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.term.iter().map(|item| item.as_ref().and_then(|i| i.coord())).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "|", options::allowed(options::SITE_ALTERNATION_TERM_SEPARATOR_SPACE_BEFORE), options::allowed(options::SITE_ALTERNATION_TERM_SEPARATOR_SPACE_AFTER), &options::WHITESPACE);
            if self.term_separator_space_before.is_none() { self.term_separator_space_before = before; }
            if self.term_separator_space_after.is_none() { self.term_separator_space_after = after; }
        }
        self.term_separator_space_before.get_or_insert(ctx.options.spacing[options::SITE_ALTERNATION_TERM_SEPARATOR_SPACE_BEFORE].arm);
        self.term_separator_space_after.get_or_insert(ctx.options.spacing[options::SITE_ALTERNATION_TERM_SEPARATOR_SPACE_AFTER].arm);
        self.term.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_group"))]
    pub term_group: Vec<::sittir_core::SlotValue<TermGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_term_group_separator_space"))]
    pub term_group_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for TermTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(52)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TermTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(52) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for TermTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_term(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for TermTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.term_group.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_TERM_TERM_GROUP_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.term_group_separator_space.is_none() { self.term_group_separator_space = before; }
            let _ = after;
        }
        self.term_group_separator_space.get_or_insert(ctx.options.spacing[options::SITE_TERM_TERM_GROUP_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.term_group.iter_mut().map(Some), options::SEATS_TERM_TERM_GROUP, ctx);
        self.term_group.prepare(ctx)?;
        Ok(())
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

#[derive(Debug, Clone)]
pub struct AnyCharacterTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for AnyCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnyCharacterTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(2) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AnyCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for AnyCharacterTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AnyCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ".".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ".".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for AnyCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| ".".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnyCharacterTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct StartAssertionTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for StartAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(53)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StartAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(53) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StartAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for StartAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StartAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "^".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "^".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for StartAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "^".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StartAssertionTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct EndAssertionTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for EndAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for EndAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(4) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for EndAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for EndAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EndAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "$".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "$".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for EndAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "$".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for EndAssertionTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct BoundaryAssertionTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BoundaryAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BoundaryAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(5) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for BoundaryAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\\b".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\\b".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\\b".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BoundaryAssertionTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct NonBoundaryAssertionTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for NonBoundaryAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NonBoundaryAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(6) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NonBoundaryAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for NonBoundaryAssertionTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NonBoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\\B".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\\B".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for NonBoundaryAssertionTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\\B".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NonBoundaryAssertionTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LookaroundAssertionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<LookaroundAssertionContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for LookaroundAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(54)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookaroundAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(54) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LookaroundAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_lookaround_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookaroundAssertionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for LookaheadAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(55)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookaheadAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(55) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LookaheadAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_lookahead_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookaheadAssertionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for LookbehindAssertionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(56)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LookbehindAssertionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(56) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LookbehindAssertionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_lookbehind_assertion(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LookbehindAssertionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PatternCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PatternCharacterTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(12) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PatternCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PatternCharacterTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PatternCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_class_atoms"))]
    pub class_atoms: Option<Vec<::sittir_core::SlotValue<CharacterClassClassAtomsTransportSlot>>>,
}

impl ::sittir_core::view::KindOf for CharacterClassTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(57)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(57) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CharacterClassTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_character_class(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.class_atoms.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_posix_class_name"))]
    pub posix_class_name: ::sittir_core::SlotValue<PosixClassNameTransport>,
}

impl ::sittir_core::view::KindOf for PosixCharacterClassTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(58)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PosixCharacterClassTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(58) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PosixCharacterClassTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_posix_character_class(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PosixCharacterClassTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.posix_class_name.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PosixClassNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(59)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PosixClassNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(59) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PosixClassNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PosixClassNameTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PosixClassNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_start"))]
    pub start: ::sittir_core::SlotValue<ClassRangeStartTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_end"))]
    pub end: ::sittir_core::SlotValue<ClassRangeEndTransportSlot>,
}

impl ::sittir_core::view::KindOf for ClassRangeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(60)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ClassRangeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(60) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ClassRangeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_class_range(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ClassRangeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.start.prepare(ctx)?;
        self.end.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ClassCharacterTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ClassCharacterTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(20) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ClassCharacterTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ClassCharacterTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ClassCharacterTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for AnonymousCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(61)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnonymousCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(61) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AnonymousCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_anonymous_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AnonymousCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.pattern.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<Box<AnyTransport>>,
}

impl ::sittir_core::view::KindOf for NamedCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(62)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(62) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: ::sittir_core::SlotValue<PatternTransport>,
}

impl ::sittir_core::view::KindOf for NonCapturingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(63)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NonCapturingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(63) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NonCapturingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_non_capturing_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NonCapturingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.pattern.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for FlagsTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(65)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for FlagsTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(65) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for FlagsTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for FlagsTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for FlagsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ZeroOrMoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(66)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ZeroOrMoreTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(66) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ZeroOrMoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ZeroOrMoreTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ZeroOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for OneOrMoreTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(67)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for OneOrMoreTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(67) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for OneOrMoreTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for OneOrMoreTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for OneOrMoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for OptionalTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(68)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for OptionalTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(68) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for OptionalTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for OptionalTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for OptionalTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<CountQuantifierContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for CountQuantifierTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(69)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(69) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CountQuantifierTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_count_quantifier(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
}

impl ::sittir_core::view::KindOf for BackreferenceEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(70)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BackreferenceEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(70) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BackreferenceEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_backreference_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for BackreferenceEscapeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_name"))]
    pub group_name: ::sittir_core::SlotValue<GroupNameTransport>,
}

impl ::sittir_core::view::KindOf for NamedGroupBackreferenceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(71)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedGroupBackreferenceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(71) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedGroupBackreferenceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_group_backreference(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedGroupBackreferenceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_name.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DecimalEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(34)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DecimalEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(34) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DecimalEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DecimalEscapeTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<CharacterClassEscapeContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(72)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(72) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CharacterClassEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_character_class_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for UnicodeCharacterEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(73)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodeCharacterEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(73) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnicodeCharacterEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodeCharacterEscapeTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodeCharacterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_value_expression_group"))]
    pub unicode_property_value_expression_group: Option<::sittir_core::SlotValue<UnicodePropertyValueExpressionGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property"))]
    pub unicode_property: ::sittir_core::SlotValue<UnicodePropertyTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyValueExpressionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(74)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyValueExpressionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(74) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnicodePropertyValueExpressionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_unicode_property_value_expression(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyValueExpressionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_value_expression_group.prepare(ctx)?;
        self.unicode_property.prepare(ctx)?;
        Ok(())
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
pub struct UnicodePropertyTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for UnicodePropertyTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(38)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(38) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnicodePropertyTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodePropertyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for UnicodePropertyTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_default();
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for UnicodePropertyTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<UnicodePropertyTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        UnicodePropertyTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<UnicodePropertyTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        UnicodePropertyTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ControlEscapeTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ControlEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(75)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ControlEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(75) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ControlEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ControlEscapeTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ControlLetterEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(41)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ControlLetterEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(41) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ControlLetterEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ControlLetterEscapeTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ControlLetterEscapeTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: String,
}

impl ::sittir_core::view::KindOf for IdentityEscapeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(42)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for IdentityEscapeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(42) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for IdentityEscapeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_identity_escape(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for IdentityEscapeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for GroupNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(43)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(43) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for GroupNameTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for GroupNameTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DecimalDigitsTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(44)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DecimalDigitsTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(44) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DecimalDigitsTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DecimalDigitsTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DecimalDigitsTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_quantifier"))]
    pub quantifier: Option<::sittir_core::SlotValue<TermGroupQuantifierTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<TermGroupContentTransportSlot>,
}

impl ::sittir_core::view::KindOf for TermGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(76)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TermGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(76) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for TermGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_term_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for TermGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.quantifier.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_decimal_digits"))]
    pub decimal_digits: Option<::sittir_core::SlotValue<DecimalDigitsTransport>>,
}

impl ::sittir_core::view::KindOf for CountQuantifierGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(77)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(77) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CountQuantifierGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_count_quantifier_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.decimal_digits.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_decimal_digits"))]
    pub decimal_digits: ::sittir_core::SlotValue<DecimalDigitsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_count_quantifier_group"))]
    pub count_quantifier_group: Option<::sittir_core::SlotValue<CountQuantifierGroupTransport>>,
}

impl ::sittir_core::view::KindOf for CountQuantifierArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(78)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CountQuantifierArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(78) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CountQuantifierArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_count_quantifier_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CountQuantifierArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.decimal_digits.prepare(ctx)?;
        self.count_quantifier_group.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_value_expression"))]
    pub unicode_property_value_expression: ::sittir_core::SlotValue<UnicodePropertyValueExpressionTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: String,
}

impl ::sittir_core::view::KindOf for CharacterClassEscapeArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(79)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CharacterClassEscapeArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(79) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CharacterClassEscapeArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_character_class_escape_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CharacterClassEscapeArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_value_expression.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_unicode_property_name"))]
    pub unicode_property_name: ::sittir_core::SlotValue<UnicodePropertyNameTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyValueExpressionGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(80)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyValueExpressionGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(80) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnicodePropertyValueExpressionGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_unicode_property_value_expression_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyValueExpressionGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.unicode_property_name.prepare(ctx)?;
        Ok(())
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

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct InlineFlagsGroupEnableTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_enabled"))]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupEnableTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(81)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupEnableTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(81) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for InlineFlagsGroupEnableTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_inline_flags_group_enable(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupEnableTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.enabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_enabled"))]
    pub enabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_disabled"))]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupToggleTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(82)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupToggleTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(82) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for InlineFlagsGroupToggleTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_inline_flags_group_toggle(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupToggleTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.enabled.prepare(ctx)?;
        self.disabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_disabled"))]
    pub disabled: ::sittir_core::SlotValue<FlagsTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_pattern"))]
    pub pattern: Option<::sittir_core::SlotValue<PatternTransport>>,
}

impl ::sittir_core::view::KindOf for InlineFlagsGroupDisableTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(83)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for InlineFlagsGroupDisableTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(83) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for InlineFlagsGroupDisableTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_inline_flags_group_disable(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for InlineFlagsGroupDisableTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.disabled.prepare(ctx)?;
        self.pattern.prepare(ctx)?;
        Ok(())
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

#[derive(Debug, Clone)]
pub struct TightTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for TightTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(47)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for TightTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(47) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for TightTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for TightTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for TightTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_default()
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
    pub text: String,
}

impl ::sittir_core::view::KindOf for SpaceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(48)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for SpaceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(48) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for SpaceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for SpaceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for SpaceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => " ".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| " ".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct NewlineTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for NewlineTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(49)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NewlineTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(49) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NewlineTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, { w.token_seam(&self.text); Ok::<(), ::sittir_core::render::RenderError>(()) })
    }
}

impl ::sittir_core::prepare::Prepare for NewlineTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for NewlineTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\n".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\n".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct LazyTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<Box<AnyTransport>>,
}

impl ::sittir_core::view::KindOf for LazyTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(87)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LazyTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(87) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LazyTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_lazy(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for LazyTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<UnicodePropertyTransport>,
}

impl ::sittir_core::view::KindOf for UnicodePropertyNameTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(88)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for UnicodePropertyNameTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(88) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for UnicodePropertyNameTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_unicode_property_name(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for UnicodePropertyNameTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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

#[derive(Debug, Clone)]
pub struct CaretTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for CaretTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CaretTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(3) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CaretTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for CaretTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CaretTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "^".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "^".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for CaretTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "^".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for CaretTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LparenQmarkTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenQmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenQmarkTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(7) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenQmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(?".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(?".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(?".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct EqTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for EqTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(8)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for EqTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(8) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for EqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for EqTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for EqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "=".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "=".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| "=".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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

#[derive(Debug, Clone)]
pub struct BangTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BangTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(9)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BangTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(9) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BangTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for BangTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BangTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "!".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "!".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct RparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(10)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(10) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for RparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for RparenTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ")".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ")".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct LparenQmarkLtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenQmarkLtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(11)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenQmarkLtTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(11) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenQmarkLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkLtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(?<".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(?<".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(?<".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkLtTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(13)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(13) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "[".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "[".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct DashTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for DashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DashTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(14) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "-".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "-".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for DashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "-".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for DashTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct BslashDashTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BslashDashTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BslashDashTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(19) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BslashDashTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for BslashDashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BslashDashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\\-".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\\-".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BslashDashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\\-".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BslashDashTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct RbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(15) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for RbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for RbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "]".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "]".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct LbrackColonTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LbrackColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LbrackColonTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(16) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LbrackColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LbrackColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "[:".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "[:".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LbrackColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "[:".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbrackColonTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct ColonRbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ColonRbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ColonRbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(17) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ColonRbrackTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ColonRbrackTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonRbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ":]".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ":]".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonRbrackTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| ":]".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ColonRbrackTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(21)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(21) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct LparenQmarkpLtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenQmarkpLtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(22)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenQmarkpLtTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(22) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenQmarkpLtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkpLtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkpLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(?P<".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(?P<".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkpLtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(?P<".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkpLtTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkpLtTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkpLtTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkpLtTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkpLtTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct GtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for GtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(23)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GtTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(23) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for GtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for GtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ">".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ">".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for GtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| ">".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GtTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LparenQmarkColonTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenQmarkColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(24)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenQmarkColonTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(24) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenQmarkColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(?:".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(?:".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(?:".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkColonTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct StarTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for StarTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(25)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StarTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(25) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StarTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for StarTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for StarTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "*".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "*".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct QmarkTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for QmarkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for QmarkTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(26) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for QmarkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for QmarkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for QmarkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "?".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "?".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct PlusTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PlusTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PlusTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(27) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PlusTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PlusTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PlusTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "+".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "+".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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
pub struct LbraceTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LbraceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(28)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LbraceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(28) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LbraceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "{".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "{".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "{".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LbraceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct RbraceTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RbraceTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(30)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RbraceTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(30) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for RbraceTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for RbraceTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for RbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "}".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "}".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for RbraceTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "}".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for RbraceTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct CommaTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for CommaTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(29)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CommaTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(29) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CommaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for CommaTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for CommaTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ",".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ",".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        let text: String = obj.get("$text")?.unwrap_or_else(|| ",".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
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

#[derive(Debug, Clone)]
pub struct BslashkTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BslashkTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(31)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BslashkTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(31) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for BslashkTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for BslashkTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for BslashkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\\k".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\\k".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for BslashkTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\\k".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BslashkTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LtTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(32)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LtTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(32) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LtTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "<".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "<".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "<".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LtTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
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

#[derive(Debug, Clone)]
pub struct LparenQmarkpEqTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenQmarkpEqTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(33)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenQmarkpEqTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(33) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for LparenQmarkpEqTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for LparenQmarkpEqTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkpEqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "(?P=".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "(?P=".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
            text,
        })
    }
}

#[cfg(all(feature = "napi-bindings", feature = "debug-transport"))]
impl ::napi::bindgen_prelude::FromNapiValue for LparenQmarkpEqTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "(?P=".to_string());
        let transport_trivia_data = obj.get("$_trivia")?;
        let edges = obj.get("$_edges")?;
        Ok(Self {
            transport_trivia_data,
            edges,
            text,
        })
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LparenQmarkpEqTransport {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ::napi::bindgen_prelude::ToNapiValue::to_napi_value(env, ())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<LparenQmarkpEqTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        LparenQmarkpEqTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<LparenQmarkpEqTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        LparenQmarkpEqTransport::to_napi_value(env, *val)
    }
}

#[derive(Debug, Clone)]
pub struct ColonTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for ColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(45)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ColonTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(45) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ColonTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for ColonTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ColonTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => ":".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| ":".to_string())
            }
        };
        Ok(Self {
            transport_trivia_data: __trivia,
            edges: None,
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
        Ok(Self {
            transport_trivia_data,
            edges,
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

impl ::sittir_core::prepare::SeatTarget for TermGroupTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(76)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
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
    content.render(w)?;
    Ok(())
}

fn render_alternation(node: &AlternationTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let term = ListView {
        items: &node.term,
        template: "{}",
        token: "|",
        before: node.term_separator_space_before.unwrap_or(0),
        after: node.term_separator_space_after.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    term.render(w)?;
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

fn render_any_character(t: &AnyCharacterTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_start_assertion(t: &StartAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_end_assertion(t: &EndAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_boundary_assertion(t: &BoundaryAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_non_boundary_assertion(t: &NonBoundaryAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lookaround_assertion(node: &LookaroundAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    content.render(w)?;
    Ok(())
}

fn render_lookahead_assertion(node: &LookaheadAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(55), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(?")?;
    w.adjacent();
    w.site_at(options::SITE_LOOKAHEAD_ASSERTION_LPAREN_QMARK_AFTER);
    content.render(w)?;
    pattern.render(w)?;
    w.site_at(options::SITE_LOOKAHEAD_ASSERTION_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(55), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_lookbehind_assertion(node: &LookbehindAssertionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(?<")?;
    w.adjacent();
    w.site_at(options::SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER);
    content.render(w)?;
    pattern.render(w)?;
    w.site_at(options::SITE_LOOKBEHIND_ASSERTION_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(56), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
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
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("[")?;
    w.site_at(options::SITE_CHARACTER_CLASS_LBRACK_AFTER);
    class_atoms.render(w)?;
    w.site_at(options::SITE_CHARACTER_CLASS_RBRACK_BEFORE);
    w.text("]")?;
    w.edge(::sittir_core::types::KindId(57), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_posix_character_class(node: &PosixCharacterClassTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let posix_class_name = &node.posix_class_name;
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("[:")?;
    w.adjacent();
    w.site_at(options::SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER);
    posix_class_name.render(w)?;
    w.site_at(options::SITE_POSIX_CHARACTER_CLASS_COLON_RBRACK_BEFORE);
    w.text(":]")?;
    w.edge(::sittir_core::types::KindId(58), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_posix_class_name(t: &PosixClassNameTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_class_range(node: &ClassRangeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let end = &node.end;
    let start = &node.start;
    w.edge(::sittir_core::types::KindId(60), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    start.render(w)?;
    w.site_at(options::SITE_CLASS_RANGE_DASH_BEFORE);
    w.text("-")?;
    w.site_at(options::SITE_CLASS_RANGE_DASH_AFTER);
    end.render(w)?;
    w.edge(::sittir_core::types::KindId(60), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_class_character(t: &ClassCharacterTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_anonymous_capturing_group(node: &AnonymousCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_ANONYMOUS_CAPTURING_GROUP_LPAREN_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_ANONYMOUS_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(61), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_capturing_group(node: &NamedCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let group_name = &node.group_name;
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    content.render(w)?;
    w.adjacent();
    group_name.render(w)?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_GT_BEFORE);
    w.text(">")?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_GT_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(62), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_non_capturing_group(node: &NonCapturingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let pattern = &node.pattern;
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(?:")?;
    w.site_at(options::SITE_NON_CAPTURING_GROUP_LPAREN_QMARK_COLON_AFTER);
    pattern.render(w)?;
    w.site_at(options::SITE_NON_CAPTURING_GROUP_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(63), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
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
    w.edge(::sittir_core::types::KindId(69), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(69), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_backreference_escape(node: &BackreferenceEscapeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let group_name = &node.group_name;
    w.edge(::sittir_core::types::KindId(70), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("\\k")?;
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER);
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_LT_BEFORE);
    w.text("<")?;
    w.adjacent();
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_LT_AFTER);
    group_name.render(w)?;
    w.site_at(options::SITE_BACKREFERENCE_ESCAPE_GT_BEFORE);
    w.text(">")?;
    w.edge(::sittir_core::types::KindId(70), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_group_backreference(node: &NamedGroupBackreferenceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let group_name = &node.group_name;
    w.edge(::sittir_core::types::KindId(71), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(?P=")?;
    w.adjacent();
    w.site_at(options::SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARKP_EQ_AFTER);
    group_name.render(w)?;
    w.site_at(options::SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(71), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
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
    let unicode_property = &node.unicode_property;
    let unicode_property_value_expression_group = View::new(&node.unicode_property_value_expression_group, "{}");
    w.edge(::sittir_core::types::KindId(74), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    unicode_property_value_expression_group.render(w)?;
    unicode_property.render(w)?;
    w.edge(::sittir_core::types::KindId(74), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_unicode_property(t: &UnicodePropertyTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
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
    w.edge(::sittir_core::types::KindId(76), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    content.render(w)?;
    quantifier.render(w)?;
    w.edge(::sittir_core::types::KindId(76), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_count_quantifier_group(node: &CountQuantifierGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let decimal_digits = View::new(&node.decimal_digits, "{}");
    w.edge(::sittir_core::types::KindId(77), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text(",")?;
    w.site_at(options::SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER);
    decimal_digits.render(w)?;
    w.edge(::sittir_core::types::KindId(77), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_count_quantifier_arm(node: &CountQuantifierArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let count_quantifier_group = View::new(&node.count_quantifier_group, "{}");
    let decimal_digits = &node.decimal_digits;
    w.edge(::sittir_core::types::KindId(78), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    decimal_digits.render(w)?;
    count_quantifier_group.render(w)?;
    w.edge(::sittir_core::types::KindId(78), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_character_class_escape_arm(node: &CharacterClassEscapeArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let unicode_property_value_expression = &node.unicode_property_value_expression;
    w.edge(::sittir_core::types::KindId(79), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    content.render(w)?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE);
    w.text("{")?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER);
    unicode_property_value_expression.render(w)?;
    w.site_at(options::SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE);
    w.text("}")?;
    w.edge(::sittir_core::types::KindId(79), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_unicode_property_value_expression_group(node: &UnicodePropertyValueExpressionGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let unicode_property_name = &node.unicode_property_name;
    w.edge(::sittir_core::types::KindId(80), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    unicode_property_name.render(w)?;
    w.site_at(options::SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE);
    w.text("=")?;
    w.edge(::sittir_core::types::KindId(80), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_inline_flags_group_enable(node: &InlineFlagsGroupEnableTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let enabled = &node.enabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(81), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
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
    w.edge(::sittir_core::types::KindId(81), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_inline_flags_group_toggle(node: &InlineFlagsGroupToggleTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let disabled = &node.disabled;
    let enabled = &node.enabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(82), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
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
    w.edge(::sittir_core::types::KindId(82), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_inline_flags_group_disable(node: &InlineFlagsGroupDisableTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let disabled = &node.disabled;
    let pattern = View::new(&node.pattern, "{}");
    w.edge(::sittir_core::types::KindId(83), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
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
    w.edge(::sittir_core::types::KindId(83), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_tight(t: &TightTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_space(t: &SpaceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
}

fn render_newline(t: &NewlineTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    { w.token_seam(&t.text); Ok::<(), ::sittir_core::render::RenderError>(()) }
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

fn render_caret(t: &CaretTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen_qmark(t: &LparenQmarkTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_eq(t: &EqTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_bang(t: &BangTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_rparen(t: &RparenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen_qmark_lt(t: &LparenQmarkLtTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lbrack(t: &LbrackTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_dash(t: &DashTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_bslash_dash(t: &BslashDashTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_rbrack(t: &RbrackTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lbrack_colon(t: &LbrackColonTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_colon_rbrack(t: &ColonRbrackTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen(t: &LparenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen_qmarkp_lt(t: &LparenQmarkpLtTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_gt(t: &GtTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen_qmark_colon(t: &LparenQmarkColonTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_star(t: &StarTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_qmark(t: &QmarkTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_plus(t: &PlusTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lbrace(t: &LbraceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_rbrace(t: &RbraceTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_comma(t: &CommaTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_bslashk(t: &BslashkTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lt(t: &LtTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_lparen_qmarkp_eq(t: &LparenQmarkpEqTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

fn render_colon(t: &ColonTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.text(&t.text)
}

/// Word-class table derived from this grammar's Link-pinned word pattern.
static GRAMMAR_WORD_MATCHER: ::sittir_core::spacing::WordMatcher = ::sittir_core::spacing::WordMatcher::new(
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    char::is_alphanumeric,
)
.with_literal_merge_pairs(&[(40, 63), (63, 60), (92, 45)]); // "(?" "?<" "\\-"

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
            Self::AnyCharacter(inner) => inner.kind_in(kinds),
            Self::StartAssertion(inner) => inner.kind_in(kinds),
            Self::EndAssertion(inner) => inner.kind_in(kinds),
            Self::BoundaryAssertion(inner) => inner.kind_in(kinds),
            Self::NonBoundaryAssertion(inner) => inner.kind_in(kinds),
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
            Self::UnicodeProperty(inner) => inner.kind_in(kinds),
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
            Self::InlineFlagsGroupEnable(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupToggle(inner) => inner.kind_in(kinds),
            Self::InlineFlagsGroupDisable(inner) => inner.kind_in(kinds),
            Self::Tight(inner) => inner.kind_in(kinds),
            Self::Space(inner) => inner.kind_in(kinds),
            Self::Newline(inner) => inner.kind_in(kinds),
            Self::Lazy(inner) => inner.kind_in(kinds),
            Self::UnicodePropertyName(inner) => inner.kind_in(kinds),
            Self::Caret(inner) => inner.kind_in(kinds),
            Self::LparenQmark(inner) => inner.kind_in(kinds),
            Self::Eq(inner) => inner.kind_in(kinds),
            Self::Bang(inner) => inner.kind_in(kinds),
            Self::Rparen(inner) => inner.kind_in(kinds),
            Self::LparenQmarkLt(inner) => inner.kind_in(kinds),
            Self::Lbrack(inner) => inner.kind_in(kinds),
            Self::Dash(inner) => inner.kind_in(kinds),
            Self::BslashDash(inner) => inner.kind_in(kinds),
            Self::Rbrack(inner) => inner.kind_in(kinds),
            Self::LbrackColon(inner) => inner.kind_in(kinds),
            Self::ColonRbrack(inner) => inner.kind_in(kinds),
            Self::Lparen(inner) => inner.kind_in(kinds),
            Self::LparenQmarkpLt(inner) => inner.kind_in(kinds),
            Self::Gt(inner) => inner.kind_in(kinds),
            Self::LparenQmarkColon(inner) => inner.kind_in(kinds),
            Self::Star(inner) => inner.kind_in(kinds),
            Self::Qmark(inner) => inner.kind_in(kinds),
            Self::Plus(inner) => inner.kind_in(kinds),
            Self::Lbrace(inner) => inner.kind_in(kinds),
            Self::Rbrace(inner) => inner.kind_in(kinds),
            Self::Comma(inner) => inner.kind_in(kinds),
            Self::Bslashk(inner) => inner.kind_in(kinds),
            Self::Lt(inner) => inner.kind_in(kinds),
            Self::LparenQmarkpEq(inner) => inner.kind_in(kinds),
            Self::Colon(inner) => inner.kind_in(kinds),
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
            AnyTransport::AnyCharacter(t) => t.render(w),
            AnyTransport::StartAssertion(t) => t.render(w),
            AnyTransport::EndAssertion(t) => t.render(w),
            AnyTransport::BoundaryAssertion(t) => t.render(w),
            AnyTransport::NonBoundaryAssertion(t) => t.render(w),
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
            AnyTransport::UnicodeProperty(t) => t.render(w),
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
            AnyTransport::InlineFlagsGroupEnable(t) => t.render(w),
            AnyTransport::InlineFlagsGroupToggle(t) => t.render(w),
            AnyTransport::InlineFlagsGroupDisable(t) => t.render(w),
            AnyTransport::Tight(t) => t.render(w),
            AnyTransport::Space(t) => t.render(w),
            AnyTransport::Newline(t) => t.render(w),
            AnyTransport::Lazy(t) => t.render(w),
            AnyTransport::UnicodePropertyName(t) => t.render(w),
            AnyTransport::Caret(t) => t.render(w),
            AnyTransport::LparenQmark(t) => t.render(w),
            AnyTransport::Eq(t) => t.render(w),
            AnyTransport::Bang(t) => t.render(w),
            AnyTransport::Rparen(t) => t.render(w),
            AnyTransport::LparenQmarkLt(t) => t.render(w),
            AnyTransport::Lbrack(t) => t.render(w),
            AnyTransport::Dash(t) => t.render(w),
            AnyTransport::BslashDash(t) => t.render(w),
            AnyTransport::Rbrack(t) => t.render(w),
            AnyTransport::LbrackColon(t) => t.render(w),
            AnyTransport::ColonRbrack(t) => t.render(w),
            AnyTransport::Lparen(t) => t.render(w),
            AnyTransport::LparenQmarkpLt(t) => t.render(w),
            AnyTransport::Gt(t) => t.render(w),
            AnyTransport::LparenQmarkColon(t) => t.render(w),
            AnyTransport::Star(t) => t.render(w),
            AnyTransport::Qmark(t) => t.render(w),
            AnyTransport::Plus(t) => t.render(w),
            AnyTransport::Lbrace(t) => t.render(w),
            AnyTransport::Rbrace(t) => t.render(w),
            AnyTransport::Comma(t) => t.render(w),
            AnyTransport::Bslashk(t) => t.render(w),
            AnyTransport::Lt(t) => t.render(w),
            AnyTransport::LparenQmarkpEq(t) => t.render(w),
            AnyTransport::Colon(t) => t.render(w),
            AnyTransport::Literal0_65_71 => w.text("="),
            AnyTransport::Literal1_62_61_6e_67 => w.text("!"),
            AnyTransport::Literal2_62_73_6c_61_73_68_5f_64_61_73_68 => w.text("\\-"),
            AnyTransport::Literal3_64_61_73_68 => w.text("-"),
            AnyTransport::Literal4_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_5f_6c_74 => w.text("(?<"),
            AnyTransport::Literal5_6c_70_61_72_65_6e_5f_71_6d_61_72_6b_70_5f_6c_74 => w.text("(?P<"),
            AnyTransport::Literal6_5c_5c_5b_64_44_73_53_77_57_5d => w.text("\\\\[dDsSwW]"),
            AnyTransport::Literal7_73_74_61_72_74_5f_61_73_73_65_72_74_69_6f_6e => w.text("^"),
            AnyTransport::Literal8_65_6e_64_5f_61_73_73_65_72_74_69_6f_6e => w.text("$"),
            AnyTransport::Literal9_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => w.text("\\b"),
            AnyTransport::Literal10_6e_6f_6e_5f_62_6f_75_6e_64_61_72_79_5f_61_73_73_65_72_74_69_6f_6e => w.text("\\B"),
            AnyTransport::Literal11_61_6e_79_5f_63_68_61_72_61_63_74_65_72 => w.text("."),
            AnyTransport::Literal12_5c_5c_5b_70_50_5d => w.text("\\\\[pP]"),
            AnyTransport::Literal13_71_6d_61_72_6b => w.text("?"),
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

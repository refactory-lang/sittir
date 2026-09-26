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
    NamedNode(NamedNodeTransport),
    FieldDefinition(FieldDefinitionTransport),
    NegatedField(NegatedFieldTransport),
    Predicate(PredicateTransport),
    PredicateType(PredicateTypeEnum),
    GroupExpressionArm(GroupExpressionArmTransport),
    NamedNodeExpressionArm(NamedNodeExpressionArmTransport),
    GroupingGroup(GroupingGroupTransport),
    NamedNodeArm(NamedNodeArmTransport),
    NamedNodeGroupChildren(NamedNodeGroupChildrenTransport),
    NamedNodeGroupAnchoredLast(NamedNodeGroupAnchoredLastTransport),
    Tight(TightTransport),
    Space(SpaceTransport),
    Newline(NewlineTransport),
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
    Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b,
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
    Literal4_75_6e_64_65_72_73_63_6f_72_65,
    Literal5_70_6f_75_6e_64,
    Literal6_64_6f_74,
    Literal7_62_61_6e_67,
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
            AnyTransport::NamedNode(t) => t.prepare(ctx),
            AnyTransport::FieldDefinition(t) => t.prepare(ctx),
            AnyTransport::NegatedField(t) => t.prepare(ctx),
            AnyTransport::Predicate(t) => t.prepare(ctx),
            AnyTransport::PredicateType(t) => t.prepare(ctx),
            AnyTransport::GroupExpressionArm(t) => t.prepare(ctx),
            AnyTransport::NamedNodeExpressionArm(t) => t.prepare(ctx),
            AnyTransport::GroupingGroup(t) => t.prepare(ctx),
            AnyTransport::NamedNodeArm(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupChildren(t) => t.prepare(ctx),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.prepare(ctx),
            AnyTransport::Tight(t) => t.prepare(ctx),
            AnyTransport::Space(t) => t.prepare(ctx),
            AnyTransport::Newline(t) => t.prepare(ctx),
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
            AnyTransport::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => Ok(()),
            AnyTransport::Literal1_73_74_61_72 => Ok(()),
            AnyTransport::Literal2_70_6c_75_73 => Ok(()),
            AnyTransport::Literal3_71_6d_61_72_6b => Ok(()),
            AnyTransport::Literal4_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
            AnyTransport::Literal5_70_6f_75_6e_64 => Ok(()),
            AnyTransport::Literal6_64_6f_74 => Ok(()),
            AnyTransport::Literal7_62_61_6e_67 => Ok(()),
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
                // kind: program (PROGRAM)
                27 => Ok(AnyTransport::Program(
                    ProgramTransport::from_napi_value(env, napi_val)?
                )),
                // kind: escape_sequence (ESCAPE_SEQUENCE)
                1 => Ok(AnyTransport::EscapeSequence(
                    EscapeSequenceTransport::from_napi_value(env, napi_val)?
                )),
                // kind: quantifier (QUANTIFIER)
                31 => Ok(AnyTransport::Quantifier(
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
                33 => Ok(AnyTransport::Capture(
                    CaptureTransport::from_napi_value(env, napi_val)?
                )),
                // kind: string (STRING)
                34 => Ok(AnyTransport::String(
                    StringTransport::from_napi_value(env, napi_val)?
                )),
                // kind: immediate_string (IMMEDIATE_STRING)
                35 => Ok(AnyTransport::ImmediateString(
                    ImmediateStringTransport::from_napi_value(env, napi_val)?
                )),
                // kind: string_content (STRING_CONTENT)
                36 => Ok(AnyTransport::StringContent(
                    StringContentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: parameters (PARAMETERS)
                37 => Ok(AnyTransport::Parameters(
                    ParametersTransport::from_napi_value(env, napi_val)?
                )),
                // kind: comment (COMMENT)
                12 => Ok(AnyTransport::Comment(
                    CommentTransport::from_napi_value(env, napi_val)?
                )),
                // kind: list (LIST)
                38 => Ok(AnyTransport::List(
                    ListTransport::from_napi_value(env, napi_val)?
                )),
                // kind: grouping (GROUPING)
                39 => Ok(AnyTransport::Grouping(
                    GroupingTransport::from_napi_value(env, napi_val)?
                )),
                // kind: missing_node (MISSING_NODE)
                40 => Ok(AnyTransport::MissingNode(
                    MissingNodeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: anonymous_node (ANONYMOUS_NODE)
                41 => Ok(AnyTransport::AnonymousNode(
                    AnonymousNodeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node (NAMED_NODE)
                42 => Ok(AnyTransport::NamedNode(
                    NamedNodeTransport::from_napi_value(env, napi_val)?
                )),
                // kind: field_definition (FIELD_DEFINITION)
                44 => Ok(AnyTransport::FieldDefinition(
                    FieldDefinitionTransport::from_napi_value(env, napi_val)?
                )),
                // kind: negated_field (NEGATED_FIELD)
                45 => Ok(AnyTransport::NegatedField(
                    NegatedFieldTransport::from_napi_value(env, napi_val)?
                )),
                // kind: predicate (PREDICATE)
                46 => Ok(AnyTransport::Predicate(
                    PredicateTransport::from_napi_value(env, napi_val)?
                )),
                // kind: predicate_type (PREDICATE_TYPE)
                22 => Ok(AnyTransport::PredicateType(
                    PredicateTypeEnum::from_napi_value(env, napi_val)?
                )),
                // kind: group_expression_arm (GROUP_EXPRESSION_ARM)
                47 => Ok(AnyTransport::GroupExpressionArm(
                    GroupExpressionArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_expression_arm (NAMED_NODE_EXPRESSION_ARM)
                48 => Ok(AnyTransport::NamedNodeExpressionArm(
                    NamedNodeExpressionArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: grouping_group (GROUPING_GROUP)
                49 => Ok(AnyTransport::GroupingGroup(
                    GroupingGroupTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_arm (NAMED_NODE_ARM)
                50 => Ok(AnyTransport::NamedNodeArm(
                    NamedNodeArmTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_group_children (NAMED_NODE_GROUP_CHILDREN)
                52 => Ok(AnyTransport::NamedNodeGroupChildren(
                    NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: named_node_group_anchored_last (NAMED_NODE_GROUP_ANCHORED_LAST)
                53 => Ok(AnyTransport::NamedNodeGroupAnchoredLast(
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
                // kind: _newline (_NEWLINE)
                26 => Ok(AnyTransport::Newline(
                    NewlineTransport::from_napi_value(env, napi_val)?
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
                13 => Ok(AnyTransport::Lbrack(
                    LbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rbrack (RBRACK)
                14 => Ok(AnyTransport::Rbrack(
                    RbrackTransport::from_napi_value(env, napi_val)?
                )),
                // kind: lparen (LPAREN)
                15 => Ok(AnyTransport::Lparen(
                    LparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: rparen (RPAREN)
                16 => Ok(AnyTransport::Rparen(
                    RparenTransport::from_napi_value(env, napi_val)?
                )),
                // kind: missing_keyword (MISSING_KEYWORD)
                17 => Ok(AnyTransport::MissingKeyword(
                    MissingKeywordTransport::from_napi_value(env, napi_val)?
                )),
                // kind: underscore (UNDERSCORE)
                7 => Ok(AnyTransport::Underscore(
                    UnderscoreTransport::from_napi_value(env, napi_val)?
                )),
                // kind: colon (COLON)
                18 => Ok(AnyTransport::Colon(
                    ColonTransport::from_napi_value(env, napi_val)?
                )),
                // kind: bang (BANG)
                19 => Ok(AnyTransport::Bang(
                    BangTransport::from_napi_value(env, napi_val)?
                )),
                // kind: pound (POUND)
                20 => Ok(AnyTransport::Pound(
                    PoundTransport::from_napi_value(env, napi_val)?
                )),
                // kind: dot (DOT)
                21 => Ok(AnyTransport::Dot(
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
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for TriviaTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            TriviaTransport::Comment(t) => t.prepare(ctx),
            TriviaTransport::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::render::Render for TriviaTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            TriviaTransport::Comment(t) => t.render(w),
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
                    12 => Ok(Self::Comment(CommentTransport::from_napi_value(env, napi_val)?)),
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
                    12 => Ok(Self::Comment(CommentTransport::from_napi_value(env, napi_val)?)),
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
                    28 => {
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
                        Err(::napi::Error::from_reason("aliased kind id 28 in DefinitionTransport decodes as none of its members"))
                    },
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
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
                    28 => {
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
                        Err(::napi::Error::from_reason("aliased kind id 28 in DefinitionTransport decodes as none of its members"))
                    },
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
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
                    51 => {
                        if let Ok(value) = NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupChildren(value));
                        }
                        if let Ok(value) = NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupAnchoredLast(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 51 in NamedNodeGroupTransport decodes as none of its members"))
                    },
                    52 => Ok(Self::NamedNodeGroupChildren(
                        NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                    )),
                    53 => Ok(Self::NamedNodeGroupAnchoredLast(
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
                    51 => {
                        if let Ok(value) = NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupChildren(value));
                        }
                        if let Ok(value) = NamedNodeGroupAnchoredLastTransport::from_napi_value(env, napi_val) {
                            return Ok(Self::NamedNodeGroupAnchoredLast(value));
                        }
                        Err(::napi::Error::from_reason("aliased kind id 51 in NamedNodeGroupTransport decodes as none of its members"))
                    },
                    52 => Ok(Self::NamedNodeGroupChildren(
                        NamedNodeGroupChildrenTransport::from_napi_value(env, napi_val)?
                    )),
                    53 => Ok(Self::NamedNodeGroupAnchoredLast(
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
    EscapeSequence(EscapeSequenceTransport),
    Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b,
}

impl ::sittir_core::prepare::Prepare for StringContentContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            StringContentContentTransportSlot::EscapeSequence(t) => t.prepare(ctx),
            StringContentContentTransportSlot::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for StringContentContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::EscapeSequence(inner) => inner.kind_in(kinds),
            Self::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => false,
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
                    1 => Ok(Self::EscapeSequence(
                        EscapeSequenceTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in StringContentContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("StringContentContentTransportSlot: expected u16 kind_id or object with $type")),
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

fn string_content_content_transport_slot_to_any(t: StringContentContentTransportSlot) -> AnyTransport {
    match t {
        StringContentContentTransportSlot::EscapeSequence(inner) => AnyTransport::EscapeSequence(inner),
        StringContentContentTransportSlot::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => AnyTransport::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b,
    }
}

impl ::sittir_core::render::Render for StringContentContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            StringContentContentTransportSlot::EscapeSequence(inner) => { w.adjacent(); inner.render(w) },
            StringContentContentTransportSlot::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => w.text("[^\"\\\\\\n]+"),
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
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::String(
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
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::String(
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

fn parameters_elements_transport_slot_to_any(t: ParametersElementsTransportSlot) -> AnyTransport {
    match t {
        ParametersElementsTransportSlot::Capture(inner) => AnyTransport::Capture(inner),
        ParametersElementsTransportSlot::String(inner) => AnyTransport::String(inner),
        ParametersElementsTransportSlot::Identifier(inner) => AnyTransport::Identifier(inner),
        ParametersElementsTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
pub enum ListContentTransportSlot {
    Capture(CaptureTransport),
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for ListContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            ListContentTransportSlot::Capture(t) => t.prepare(ctx),
            ListContentTransportSlot::Literal1_73_74_61_72 => Ok(()),
            ListContentTransportSlot::Literal2_70_6c_75_73 => Ok(()),
            ListContentTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for ListContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::Literal1_73_74_61_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_70_6c_75_73 => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for ListContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ListContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in ListContentTransportSlot")
                )?;
                match kind_id {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in ListContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("ListContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for ListContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("ListContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<ListContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        ListContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<ListContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        ListContentTransportSlot::to_napi_value(env, *val)
    }
}

fn list_content_transport_slot_to_any(t: ListContentTransportSlot) -> AnyTransport {
    match t {
        ListContentTransportSlot::Capture(inner) => AnyTransport::Capture(inner),
        ListContentTransportSlot::Literal1_73_74_61_72 => AnyTransport::Literal1_73_74_61_72,
        ListContentTransportSlot::Literal2_70_6c_75_73 => AnyTransport::Literal2_70_6c_75_73,
        ListContentTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for ListContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            ListContentTransportSlot::Capture(inner) => inner.render(w),
            ListContentTransportSlot::Literal1_73_74_61_72 => {
                w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE);
                let written = w.text("*");
                written?;
                w.site_at(options::SITE_QUANTIFIER_STAR_AFTER);
                Ok(())
            }
            ListContentTransportSlot::Literal2_70_6c_75_73 => {
                w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE);
                let written = w.text("+");
                written?;
                w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER);
                Ok(())
            }
            ListContentTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum GroupingContentTransportSlot {
    Capture(CaptureTransport),
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for GroupingContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            GroupingContentTransportSlot::Capture(t) => t.prepare(ctx),
            GroupingContentTransportSlot::Literal1_73_74_61_72 => Ok(()),
            GroupingContentTransportSlot::Literal2_70_6c_75_73 => Ok(()),
            GroupingContentTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupingContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::Literal1_73_74_61_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_70_6c_75_73 => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for GroupingContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupingContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in GroupingContentTransportSlot")
                )?;
                match kind_id {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in GroupingContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("GroupingContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for GroupingContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("GroupingContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<GroupingContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        GroupingContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<GroupingContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        GroupingContentTransportSlot::to_napi_value(env, *val)
    }
}

fn grouping_content_transport_slot_to_any(t: GroupingContentTransportSlot) -> AnyTransport {
    match t {
        GroupingContentTransportSlot::Capture(inner) => AnyTransport::Capture(inner),
        GroupingContentTransportSlot::Literal1_73_74_61_72 => AnyTransport::Literal1_73_74_61_72,
        GroupingContentTransportSlot::Literal2_70_6c_75_73 => AnyTransport::Literal2_70_6c_75_73,
        GroupingContentTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for GroupingContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupingContentTransportSlot::Capture(inner) => inner.render(w),
            GroupingContentTransportSlot::Literal1_73_74_61_72 => {
                w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE);
                let written = w.text("*");
                written?;
                w.site_at(options::SITE_QUANTIFIER_STAR_AFTER);
                Ok(())
            }
            GroupingContentTransportSlot::Literal2_70_6c_75_73 => {
                w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE);
                let written = w.text("+");
                written?;
                w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER);
                Ok(())
            }
            GroupingContentTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER);
                Ok(())
            }
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
                    34 => Ok(Self::String(
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
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    34 => Ok(Self::String(
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

fn missing_node_name_transport_slot_to_any(t: MissingNodeNameTransportSlot) -> AnyTransport {
    match t {
        MissingNodeNameTransportSlot::Identifier(inner) => AnyTransport::Identifier(inner),
        MissingNodeNameTransportSlot::String(inner) => AnyTransport::String(inner),
        MissingNodeNameTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
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
pub enum MissingNodeContentTransportSlot {
    Capture(CaptureTransport),
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for MissingNodeContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            MissingNodeContentTransportSlot::Capture(t) => t.prepare(ctx),
            MissingNodeContentTransportSlot::Literal1_73_74_61_72 => Ok(()),
            MissingNodeContentTransportSlot::Literal2_70_6c_75_73 => Ok(()),
            MissingNodeContentTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for MissingNodeContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::Literal1_73_74_61_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_70_6c_75_73 => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for MissingNodeContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in MissingNodeContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in MissingNodeContentTransportSlot")
                )?;
                match kind_id {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in MissingNodeContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("MissingNodeContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for MissingNodeContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("MissingNodeContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<MissingNodeContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        MissingNodeContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<MissingNodeContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        MissingNodeContentTransportSlot::to_napi_value(env, *val)
    }
}

fn missing_node_content_transport_slot_to_any(t: MissingNodeContentTransportSlot) -> AnyTransport {
    match t {
        MissingNodeContentTransportSlot::Capture(inner) => AnyTransport::Capture(inner),
        MissingNodeContentTransportSlot::Literal1_73_74_61_72 => AnyTransport::Literal1_73_74_61_72,
        MissingNodeContentTransportSlot::Literal2_70_6c_75_73 => AnyTransport::Literal2_70_6c_75_73,
        MissingNodeContentTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for MissingNodeContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            MissingNodeContentTransportSlot::Capture(inner) => inner.render(w),
            MissingNodeContentTransportSlot::Literal1_73_74_61_72 => {
                w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE);
                let written = w.text("*");
                written?;
                w.site_at(options::SITE_QUANTIFIER_STAR_AFTER);
                Ok(())
            }
            MissingNodeContentTransportSlot::Literal2_70_6c_75_73 => {
                w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE);
                let written = w.text("+");
                written?;
                w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER);
                Ok(())
            }
            MissingNodeContentTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum AnonymousNodeNameTransportSlot {
    String(StringTransport),
    Literal4_75_6e_64_65_72_73_63_6f_72_65,
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnonymousNodeNameTransportSlot::String(t) => t.prepare(ctx),
            AnonymousNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for AnonymousNodeNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::String(inner) => inner.kind_in(kinds),
            Self::Literal4_75_6e_64_65_72_73_63_6f_72_65 => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
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
                    7 => Ok(Self::Literal4_75_6e_64_65_72_73_63_6f_72_65),
                    34 => Ok(Self::String(
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
                    7 => Ok(Self::Literal4_75_6e_64_65_72_73_63_6f_72_65),
                    34 => Ok(Self::String(
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

fn anonymous_node_name_transport_slot_to_any(t: AnonymousNodeNameTransportSlot) -> AnyTransport {
    match t {
        AnonymousNodeNameTransportSlot::String(inner) => AnyTransport::String(inner),
        AnonymousNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => AnyTransport::Literal4_75_6e_64_65_72_73_63_6f_72_65,
    }
}

impl ::sittir_core::render::Render for AnonymousNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnonymousNodeNameTransportSlot::String(inner) => inner.render(w),
            AnonymousNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => {
                let written = w.text("_");
                written?;
                w.site_at(options::SITE_ANONYMOUS_NODE_UNDERSCORE_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum AnonymousNodeContentTransportSlot {
    Capture(CaptureTransport),
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeContentTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            AnonymousNodeContentTransportSlot::Capture(t) => t.prepare(ctx),
            AnonymousNodeContentTransportSlot::Literal1_73_74_61_72 => Ok(()),
            AnonymousNodeContentTransportSlot::Literal2_70_6c_75_73 => Ok(()),
            AnonymousNodeContentTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for AnonymousNodeContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Capture(inner) => inner.kind_in(kinds),
            Self::Literal1_73_74_61_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_70_6c_75_73 => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for AnonymousNodeContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in AnonymousNodeContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in AnonymousNodeContentTransportSlot")
                )?;
                match kind_id {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    33 => Ok(Self::Capture(
                        CaptureTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in AnonymousNodeContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("AnonymousNodeContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for AnonymousNodeContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("AnonymousNodeContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<AnonymousNodeContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        AnonymousNodeContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<AnonymousNodeContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        AnonymousNodeContentTransportSlot::to_napi_value(env, *val)
    }
}

fn anonymous_node_content_transport_slot_to_any(t: AnonymousNodeContentTransportSlot) -> AnyTransport {
    match t {
        AnonymousNodeContentTransportSlot::Capture(inner) => AnyTransport::Capture(inner),
        AnonymousNodeContentTransportSlot::Literal1_73_74_61_72 => AnyTransport::Literal1_73_74_61_72,
        AnonymousNodeContentTransportSlot::Literal2_70_6c_75_73 => AnyTransport::Literal2_70_6c_75_73,
        AnonymousNodeContentTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for AnonymousNodeContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            AnonymousNodeContentTransportSlot::Capture(inner) => inner.render(w),
            AnonymousNodeContentTransportSlot::Literal1_73_74_61_72 => {
                w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE);
                let written = w.text("*");
                written?;
                w.site_at(options::SITE_QUANTIFIER_STAR_AFTER);
                Ok(())
            }
            AnonymousNodeContentTransportSlot::Literal2_70_6c_75_73 => {
                w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE);
                let written = w.text("+");
                written?;
                w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER);
                Ok(())
            }
            AnonymousNodeContentTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeNameTransportSlot {
    Identifier(IdentifierTransport),
    Literal4_75_6e_64_65_72_73_63_6f_72_65,
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeNameTransportSlot::Identifier(t) => t.prepare(ctx),
            NamedNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => Ok(()),
            NamedNodeNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Identifier(inner) => inner.kind_in(kinds),
            Self::Literal4_75_6e_64_65_72_73_63_6f_72_65 => [::sittir_core::types::KindId(7)].iter().any(|k| kinds.contains(k)),
            Self::Verbatim(_) => [::sittir_core::types::KindId(5)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeNameTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    7 => Ok(Self::Literal4_75_6e_64_65_72_73_63_6f_72_65),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeNameTransportSlot")
                )?;
                match kind_id {
                    7 => Ok(Self::Literal4_75_6e_64_65_72_73_63_6f_72_65),
                    5 => Ok(Self::Identifier(
                        IdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("NamedNodeNameTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeNameTransportSlot::to_napi_value(env, *val)
    }
}

fn named_node_name_transport_slot_to_any(t: NamedNodeNameTransportSlot) -> AnyTransport {
    match t {
        NamedNodeNameTransportSlot::Identifier(inner) => AnyTransport::Identifier(inner),
        NamedNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => AnyTransport::Literal4_75_6e_64_65_72_73_63_6f_72_65,
        NamedNodeNameTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeNameTransportSlot::Identifier(inner) => inner.render(w),
            NamedNodeNameTransportSlot::Literal4_75_6e_64_65_72_73_63_6f_72_65 => w.text("_"),
            NamedNodeNameTransportSlot::Verbatim(inner) => inner.render(w),
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeQuantifierTransportSlot {
    Literal1_73_74_61_72,
    Literal2_70_6c_75_73,
    Literal3_71_6d_61_72_6b,
}

impl ::sittir_core::prepare::Prepare for NamedNodeQuantifierTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeQuantifierTransportSlot::Literal1_73_74_61_72 => Ok(()),
            NamedNodeQuantifierTransportSlot::Literal2_70_6c_75_73 => Ok(()),
            NamedNodeQuantifierTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeQuantifierTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal1_73_74_61_72 => [::sittir_core::types::KindId(2)].iter().any(|k| kinds.contains(k)),
            Self::Literal2_70_6c_75_73 => [::sittir_core::types::KindId(3)].iter().any(|k| kinds.contains(k)),
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeQuantifierTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeQuantifierTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeQuantifierTransportSlot")
                )?;
                match kind_id {
                    2 => Ok(Self::Literal1_73_74_61_72),
                    3 => Ok(Self::Literal2_70_6c_75_73),
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeQuantifierTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("NamedNodeQuantifierTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeQuantifierTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeQuantifierTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeQuantifierTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeQuantifierTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeQuantifierTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeQuantifierTransportSlot::to_napi_value(env, *val)
    }
}

fn named_node_quantifier_transport_slot_to_any(t: NamedNodeQuantifierTransportSlot) -> AnyTransport {
    match t {
        NamedNodeQuantifierTransportSlot::Literal1_73_74_61_72 => AnyTransport::Literal1_73_74_61_72,
        NamedNodeQuantifierTransportSlot::Literal2_70_6c_75_73 => AnyTransport::Literal2_70_6c_75_73,
        NamedNodeQuantifierTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
    }
}

impl ::sittir_core::render::Render for NamedNodeQuantifierTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeQuantifierTransportSlot::Literal1_73_74_61_72 => {
                w.site_at(options::SITE_QUANTIFIER_STAR_BEFORE);
                let written = w.text("*");
                written?;
                w.site_at(options::SITE_QUANTIFIER_STAR_AFTER);
                Ok(())
            }
            NamedNodeQuantifierTransportSlot::Literal2_70_6c_75_73 => {
                w.site_at(options::SITE_QUANTIFIER_PLUS_BEFORE);
                let written = w.text("+");
                written?;
                w.site_at(options::SITE_QUANTIFIER_PLUS_AFTER);
                Ok(())
            }
            NamedNodeQuantifierTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_QUANTIFIER_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_QUANTIFIER_QMARK_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum PredicateTypeTransportSlot {
    Literal3_71_6d_61_72_6b,
    Literal7_62_61_6e_67,
}

impl ::sittir_core::prepare::Prepare for PredicateTypeTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            PredicateTypeTransportSlot::Literal3_71_6d_61_72_6b => Ok(()),
            PredicateTypeTransportSlot::Literal7_62_61_6e_67 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for PredicateTypeTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal3_71_6d_61_72_6b => [::sittir_core::types::KindId(4)].iter().any(|k| kinds.contains(k)),
            Self::Literal7_62_61_6e_67 => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PredicateTypeTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    19 => Ok(Self::Literal7_62_61_6e_67),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicateTypeTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in PredicateTypeTransportSlot")
                )?;
                match kind_id {
                    4 => Ok(Self::Literal3_71_6d_61_72_6b),
                    19 => Ok(Self::Literal7_62_61_6e_67),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicateTypeTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("PredicateTypeTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PredicateTypeTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PredicateTypeTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PredicateTypeTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PredicateTypeTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PredicateTypeTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PredicateTypeTransportSlot::to_napi_value(env, *val)
    }
}

fn predicate_type_transport_slot_to_any(t: PredicateTypeTransportSlot) -> AnyTransport {
    match t {
        PredicateTypeTransportSlot::Literal3_71_6d_61_72_6b => AnyTransport::Literal3_71_6d_61_72_6b,
        PredicateTypeTransportSlot::Literal7_62_61_6e_67 => AnyTransport::Literal7_62_61_6e_67,
    }
}

impl ::sittir_core::render::Render for PredicateTypeTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            PredicateTypeTransportSlot::Literal3_71_6d_61_72_6b => {
                w.site_at(options::SITE_PREDICATE_TYPE_QMARK_BEFORE);
                let written = w.text("?");
                written?;
                w.site_at(options::SITE_PREDICATE_TYPE_QMARK_AFTER);
                Ok(())
            }
            PredicateTypeTransportSlot::Literal7_62_61_6e_67 => {
                w.site_at(options::SITE_PREDICATE_TYPE_BANG_BEFORE);
                let written = w.text("!");
                written?;
                w.site_at(options::SITE_PREDICATE_TYPE_BANG_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum PredicateContentTransportSlot {
    Literal5_70_6f_75_6e_64,
    Literal6_64_6f_74,
}

impl ::sittir_core::prepare::Prepare for PredicateContentTransportSlot {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            PredicateContentTransportSlot::Literal5_70_6f_75_6e_64 => Ok(()),
            PredicateContentTransportSlot::Literal6_64_6f_74 => Ok(()),
        }
    }
}

impl ::sittir_core::view::KindOf for PredicateContentTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::Literal5_70_6f_75_6e_64 => [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k)),
            Self::Literal6_64_6f_74 => [::sittir_core::types::KindId(21)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for PredicateContentTransportSlot {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::Number => {
                match u16::from_napi_value(env, napi_val)? {
                    20 => Ok(Self::Literal5_70_6f_75_6e_64),
                    21 => Ok(Self::Literal6_64_6f_74),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicateContentTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in PredicateContentTransportSlot")
                )?;
                match kind_id {
                    20 => Ok(Self::Literal5_70_6f_75_6e_64),
                    21 => Ok(Self::Literal6_64_6f_74),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in PredicateContentTransportSlot",
                    ))),
                }
            }
            _ => Err(::napi::Error::from_reason("PredicateContentTransportSlot: expected u16 kind_id or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for PredicateContentTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("PredicateContentTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<PredicateContentTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        PredicateContentTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<PredicateContentTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        PredicateContentTransportSlot::to_napi_value(env, *val)
    }
}

fn predicate_content_transport_slot_to_any(t: PredicateContentTransportSlot) -> AnyTransport {
    match t {
        PredicateContentTransportSlot::Literal5_70_6f_75_6e_64 => AnyTransport::Literal5_70_6f_75_6e_64,
        PredicateContentTransportSlot::Literal6_64_6f_74 => AnyTransport::Literal6_64_6f_74,
    }
}

impl ::sittir_core::render::Render for PredicateContentTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            PredicateContentTransportSlot::Literal5_70_6f_75_6e_64 => {
                let written = w.text("#");
                written?;
                w.site_at(options::SITE_PREDICATE_POUND_AFTER);
                Ok(())
            }
            PredicateContentTransportSlot::Literal6_64_6f_74 => {
                let written = w.text(".");
                written?;
                w.site_at(options::SITE_PREDICATE_DOT_AFTER);
                Ok(())
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum GroupExpressionArmLeftTransportSlot {
    NamedNode(NamedNodeTransport),
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
            GroupExpressionArmLeftTransportSlot::NamedNode(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::List(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupExpressionArmLeftTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupExpressionArmLeftTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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

fn group_expression_arm_left_transport_slot_to_any(t: GroupExpressionArmLeftTransportSlot) -> AnyTransport {
    match t {
        GroupExpressionArmLeftTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        GroupExpressionArmLeftTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        GroupExpressionArmLeftTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        GroupExpressionArmLeftTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        GroupExpressionArmLeftTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        GroupExpressionArmLeftTransportSlot::List(inner) => AnyTransport::List(inner),
        GroupExpressionArmLeftTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        GroupExpressionArmLeftTransportSlot::GroupExpressionArm(inner) => AnyTransport::GroupExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for GroupExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupExpressionArmLeftTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            GroupExpressionArmRightTransportSlot::NamedNode(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::List(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupExpressionArmRightTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupExpressionArmRightTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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

fn group_expression_arm_right_transport_slot_to_any(t: GroupExpressionArmRightTransportSlot) -> AnyTransport {
    match t {
        GroupExpressionArmRightTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        GroupExpressionArmRightTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        GroupExpressionArmRightTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        GroupExpressionArmRightTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        GroupExpressionArmRightTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        GroupExpressionArmRightTransportSlot::List(inner) => AnyTransport::List(inner),
        GroupExpressionArmRightTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        GroupExpressionArmRightTransportSlot::GroupExpressionArm(inner) => AnyTransport::GroupExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for GroupExpressionArmRightTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupExpressionArmRightTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            NamedNodeExpressionArmLeftTransportSlot::NamedNode(t) => t.prepare(ctx),
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
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmLeftTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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

fn named_node_expression_arm_left_transport_slot_to_any(t: NamedNodeExpressionArmLeftTransportSlot) -> AnyTransport {
    match t {
        NamedNodeExpressionArmLeftTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        NamedNodeExpressionArmLeftTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        NamedNodeExpressionArmLeftTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        NamedNodeExpressionArmLeftTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        NamedNodeExpressionArmLeftTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        NamedNodeExpressionArmLeftTransportSlot::List(inner) => AnyTransport::List(inner),
        NamedNodeExpressionArmLeftTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        NamedNodeExpressionArmLeftTransportSlot::NegatedField(inner) => AnyTransport::NegatedField(inner),
        NamedNodeExpressionArmLeftTransportSlot::NamedNodeExpressionArm(inner) => AnyTransport::NamedNodeExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmLeftTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeExpressionArmLeftTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            NamedNodeExpressionArmRightTransportSlot::NamedNode(t) => t.prepare(ctx),
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
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmRightTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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

fn named_node_expression_arm_right_transport_slot_to_any(t: NamedNodeExpressionArmRightTransportSlot) -> AnyTransport {
    match t {
        NamedNodeExpressionArmRightTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        NamedNodeExpressionArmRightTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        NamedNodeExpressionArmRightTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        NamedNodeExpressionArmRightTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        NamedNodeExpressionArmRightTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        NamedNodeExpressionArmRightTransportSlot::List(inner) => AnyTransport::List(inner),
        NamedNodeExpressionArmRightTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        NamedNodeExpressionArmRightTransportSlot::NegatedField(inner) => AnyTransport::NegatedField(inner),
        NamedNodeExpressionArmRightTransportSlot::NamedNodeExpressionArm(inner) => AnyTransport::NamedNodeExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmRightTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeExpressionArmRightTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            GroupingGroupGroupExpressionTransportSlot::NamedNode(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::AnonymousNode(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::MissingNode(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::Grouping(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::Predicate(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::List(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::FieldDefinition(t) => t.prepare(ctx),
            GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for GroupingGroupGroupExpressionTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    47 => Ok(Self::GroupExpressionArm(
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

fn grouping_group_group_expression_transport_slot_to_any(t: GroupingGroupGroupExpressionTransportSlot) -> AnyTransport {
    match t {
        GroupingGroupGroupExpressionTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        GroupingGroupGroupExpressionTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        GroupingGroupGroupExpressionTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        GroupingGroupGroupExpressionTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        GroupingGroupGroupExpressionTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        GroupingGroupGroupExpressionTransportSlot::List(inner) => AnyTransport::List(inner),
        GroupingGroupGroupExpressionTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        GroupingGroupGroupExpressionTransportSlot::GroupExpressionArm(inner) => AnyTransport::GroupExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for GroupingGroupGroupExpressionTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            GroupingGroupGroupExpressionTransportSlot::NamedNode(inner) => inner.render(w),
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
pub enum NamedNodeArmNameTransportSlot {
    ImmediateIdentifier(ImmediateIdentifierTransport),
    ImmediateString(ImmediateStringTransport),
    Verbatim(VerbatimTransport),
}

impl ::sittir_core::prepare::Prepare for NamedNodeArmNameTransportSlot {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        match self {
            NamedNodeArmNameTransportSlot::ImmediateIdentifier(t) => t.prepare(ctx),
            NamedNodeArmNameTransportSlot::ImmediateString(t) => t.prepare(ctx),
            NamedNodeArmNameTransportSlot::Verbatim(t) => t.prepare(ctx),
        }
    }
}

impl ::sittir_core::view::KindOf for NamedNodeArmNameTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::ImmediateIdentifier(inner) => inner.kind_in(kinds),
            Self::ImmediateString(inner) => inner.kind_in(kinds),
            Self::Verbatim(_) => [::sittir_core::types::KindId(6)].iter().any(|k| kinds.contains(k)),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for NamedNodeArmNameTransportSlot {
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
                    35 => Ok(Self::ImmediateString(
                        ImmediateStringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeArmNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::Object => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                let kind_id: u16 = obj.get("$type")?.ok_or_else(||
                    ::napi::Error::from_reason("$type property missing in NamedNodeArmNameTransportSlot")
                )?;
                match kind_id {
                    6 => Ok(Self::ImmediateIdentifier(
                        ImmediateIdentifierTransport::from_napi_value(env, napi_val)?
                    )),
                    35 => Ok(Self::ImmediateString(
                        ImmediateStringTransport::from_napi_value(env, napi_val)?
                    )),
                    other => Err(::napi::Error::from_reason(format!(
                        "unknown kind id {other} in NamedNodeArmNameTransportSlot",
                    ))),
                }
            }
            ::napi::ValueType::String => Ok(Self::Verbatim(VerbatimTransport { text: String::from_napi_value(env, napi_val)? })),
            _ => Err(::napi::Error::from_reason("NamedNodeArmNameTransportSlot: expected u16 kind_id, string, or object with $type")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for NamedNodeArmNameTransportSlot {
    unsafe fn to_napi_value(
        _env: ::napi::sys::napi_env,
        _val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        Err(::napi::Error::from_reason("NamedNodeArmNameTransportSlot is receive-only"))
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeArmNameTransportSlot> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeArmNameTransportSlot::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeArmNameTransportSlot> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeArmNameTransportSlot::to_napi_value(env, *val)
    }
}

fn named_node_arm_name_transport_slot_to_any(t: NamedNodeArmNameTransportSlot) -> AnyTransport {
    match t {
        NamedNodeArmNameTransportSlot::ImmediateIdentifier(inner) => AnyTransport::ImmediateIdentifier(inner),
        NamedNodeArmNameTransportSlot::ImmediateString(inner) => AnyTransport::ImmediateString(inner),
        NamedNodeArmNameTransportSlot::Verbatim(inner) => AnyTransport::Verbatim(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeArmNameTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeArmNameTransportSlot::ImmediateIdentifier(inner) => inner.render(w),
            NamedNodeArmNameTransportSlot::ImmediateString(inner) => { w.adjacent(); inner.render(w) },
            NamedNodeArmNameTransportSlot::Verbatim(inner) => { w.adjacent(); inner.render(w) },
        }
    }
}

#[derive(Debug, Clone)]
pub enum NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    NamedNode(NamedNodeTransport),
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
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNode(t) => t.prepare(ctx),
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
}

impl ::sittir_core::view::KindOf for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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

fn named_node_group_children_named_node_expressions_transport_slot_to_any(t: NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot) -> AnyTransport {
    match t {
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::List(inner) => AnyTransport::List(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NegatedField(inner) => AnyTransport::NegatedField(inner),
        NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(inner) => AnyTransport::NamedNodeExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNode(t) => t.prepare(ctx),
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
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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

fn named_node_group_anchored_last_named_node_expressions_transport_slot_to_any(t: NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot) -> AnyTransport {
    match t {
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::List(inner) => AnyTransport::List(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NegatedField(inner) => AnyTransport::NegatedField(inner),
        NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNodeExpressionArm(inner) => AnyTransport::NamedNodeExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot::NamedNode(inner) => inner.render(w),
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
    NamedNode(NamedNodeTransport),
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
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNode(t) => t.prepare(ctx),
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
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        match self {
            Self::NamedNode(inner) => inner.kind_in(kinds),
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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
                    42 => Ok(Self::NamedNode(
                        NamedNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    41 => Ok(Self::AnonymousNode(
                        AnonymousNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    40 => Ok(Self::MissingNode(
                        MissingNodeTransport::from_napi_value(env, napi_val)?
                    )),
                    39 => Ok(Self::Grouping(
                        GroupingTransport::from_napi_value(env, napi_val)?
                    )),
                    46 => Ok(Self::Predicate(
                        PredicateTransport::from_napi_value(env, napi_val)?
                    )),
                    38 => Ok(Self::List(
                        ListTransport::from_napi_value(env, napi_val)?
                    )),
                    44 => Ok(Self::FieldDefinition(
                        FieldDefinitionTransport::from_napi_value(env, napi_val)?
                    )),
                    45 => Ok(Self::NegatedField(
                        NegatedFieldTransport::from_napi_value(env, napi_val)?
                    )),
                    48 => Ok(Self::NamedNodeExpressionArm(
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

fn named_node_group_anchored_last_last_transport_slot_to_any(t: NamedNodeGroupAnchoredLastLastTransportSlot) -> AnyTransport {
    match t {
        NamedNodeGroupAnchoredLastLastTransportSlot::NamedNode(inner) => AnyTransport::NamedNode(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::AnonymousNode(inner) => AnyTransport::AnonymousNode(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::MissingNode(inner) => AnyTransport::MissingNode(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::Grouping(inner) => AnyTransport::Grouping(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::Predicate(inner) => AnyTransport::Predicate(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::List(inner) => AnyTransport::List(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::FieldDefinition(inner) => AnyTransport::FieldDefinition(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::NegatedField(inner) => AnyTransport::NegatedField(inner),
        NamedNodeGroupAnchoredLastLastTransportSlot::NamedNodeExpressionArm(inner) => AnyTransport::NamedNodeExpressionArm(inner),
    }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastLastTransportSlot {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            NamedNodeGroupAnchoredLastLastTransportSlot::NamedNode(inner) => inner.render(w),
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions"))]
    pub definitions: Option<Vec<::sittir_core::SlotValue<DefinitionTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions_separator_space"))]
    pub definitions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ProgramTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(27)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ProgramTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(27) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ProgramTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_program(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ProgramTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.definitions.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.definitions_separator_space.is_none() { self.definitions_separator_space = before; }
            let _ = after;
        }
        self.definitions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.definitions.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_PROGRAM_DEFINITIONS, ctx); }
        self.definitions.prepare(ctx)?;
        Ok(())
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
        render_with_trivia!(self, w, render_escape_sequence(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for EscapeSequenceTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for IdentifierTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for IdentifierTransport {
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
impl ::napi::bindgen_prelude::FromNapiValue for IdentifierTransport {
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
        render_with_trivia!(self, w, { w.adjacent(); w.text(&self.text) })
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateIdentifierTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for ImmediateIdentifierTransport {
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
impl ::napi::bindgen_prelude::FromNapiValue for ImmediateIdentifierTransport {
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
}

impl ::sittir_core::view::KindOf for CaptureTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(33)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CaptureTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(33) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CaptureTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_capture(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CaptureTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_string_content"))]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for StringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(34)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(34) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_string_content"))]
    pub string_content: Option<::sittir_core::SlotValue<StringContentTransport>>,
}

impl ::sittir_core::view::KindOf for ImmediateStringTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(35)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ImmediateStringTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(35) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ImmediateStringTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_immediate_string(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ImmediateStringTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.string_content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<StringContentContentTransportSlot>>>,
}

impl ::sittir_core::view::KindOf for StringContentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(36)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for StringContentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(36) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for StringContentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_string_content(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for StringContentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements"))]
    pub elements: Vec<::sittir_core::SlotValue<ParametersElementsTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_elements_separator_space"))]
    pub elements_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ParametersTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(37)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ParametersTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(37) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ParametersTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_parameters(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ParametersTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.elements.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.elements_separator_space.is_none() { self.elements_separator_space = before; }
            let _ = after;
        }
        self.elements_separator_space.get_or_insert(ctx.options.spacing[options::SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.elements.iter_mut().map(Some), options::SEATS_PARAMETERS_ELEMENTS, ctx);
        self.elements.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: String,
}

impl ::sittir_core::view::KindOf for CommentTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(12)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for CommentTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(12) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for CommentTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_comment(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for CommentTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions"))]
    pub definitions: Vec<::sittir_core::SlotValue<DefinitionTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<ListContentTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content_separator_space"))]
    pub content_separator_space: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definitions_separator_space"))]
    pub definitions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for ListTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(38)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ListTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(38) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for ListTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_list(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for ListTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.definitions.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_LIST_DEFINITIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.definitions_separator_space.is_none() { self.definitions_separator_space = before; }
            let _ = after;
        }
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.content.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_LIST_CONTENT_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.content_separator_space.is_none() { self.content_separator_space = before; }
            let _ = after;
        }
        self.content_separator_space.get_or_insert(ctx.options.spacing[options::SITE_LIST_CONTENT_SEPARATOR_SPACE].arm);
        self.definitions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_LIST_DEFINITIONS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.definitions.iter_mut().map(Some), options::SEATS_LIST_DEFINITIONS, ctx);
        if let Some(seated_items) = self.content.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_LIST_CONTENT, ctx); }
        self.definitions.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_grouping_group"))]
    pub grouping_group: Vec<::sittir_core::SlotValue<GroupingGroupTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<GroupingContentTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content_separator_space"))]
    pub content_separator_space: Option<u16>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_grouping_group_separator_space"))]
    pub grouping_group_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for GroupingTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(39)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(39) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupingTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_grouping(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.grouping_group.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.grouping_group_separator_space.is_none() { self.grouping_group_separator_space = before; }
            let _ = after;
        }
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.content.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_GROUPING_CONTENT_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.content_separator_space.is_none() { self.content_separator_space = before; }
            let _ = after;
        }
        self.content_separator_space.get_or_insert(ctx.options.spacing[options::SITE_GROUPING_CONTENT_SEPARATOR_SPACE].arm);
        self.grouping_group_separator_space.get_or_insert(ctx.options.spacing[options::SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.grouping_group.iter_mut().map(Some), options::SEATS_GROUPING_GROUPING_GROUP, ctx);
        if let Some(seated_items) = self.content.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_GROUPING_CONTENT, ctx); }
        self.grouping_group.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: Option<::sittir_core::SlotValue<MissingNodeNameTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<MissingNodeContentTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content_separator_space"))]
    pub content_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for MissingNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(40)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for MissingNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(40) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for MissingNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_missing_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for MissingNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.content.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_MISSING_NODE_CONTENT_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.content_separator_space.is_none() { self.content_separator_space = before; }
            let _ = after;
        }
        self.content_separator_space.get_or_insert(ctx.options.spacing[options::SITE_MISSING_NODE_CONTENT_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.content.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_MISSING_NODE_CONTENT, ctx); }
        self.name.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<AnonymousNodeNameTransportSlot>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: Option<Vec<::sittir_core::SlotValue<AnonymousNodeContentTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content_separator_space"))]
    pub content_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for AnonymousNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(41)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for AnonymousNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(41) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for AnonymousNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_anonymous_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for AnonymousNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.content.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_ANONYMOUS_NODE_CONTENT_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.content_separator_space.is_none() { self.content_separator_space = before; }
            let _ = after;
        }
        self.content_separator_space.get_or_insert(ctx.options.spacing[options::SITE_ANONYMOUS_NODE_CONTENT_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.content.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_ANONYMOUS_NODE_CONTENT, ctx); }
        self.name.prepare(ctx)?;
        self.content.prepare(ctx)?;
        Ok(())
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
pub struct NamedNodeTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: Option<::sittir_core::SlotValue<NamedNodeNameTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_quantifier"))]
    pub quantifier: Option<Vec<::sittir_core::SlotValue<QuantifierEnum>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_arm"))]
    pub named_node_arm: Option<::sittir_core::SlotValue<NamedNodeArmTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_group"))]
    pub named_node_group: Option<::sittir_core::SlotValue<Box<NamedNodeGroupTransport>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_capture"))]
    pub capture: Option<Vec<::sittir_core::SlotValue<CaptureTransport>>>,
}

impl ::sittir_core::view::KindOf for NamedNodeTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(42)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(42) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_node(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        self.quantifier.prepare(ctx)?;
        self.named_node_arm.prepare(ctx)?;
        self.named_node_group.prepare(ctx)?;
        self.capture.prepare(ctx)?;
        Ok(())
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

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct FieldDefinitionTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<IdentifierTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_definition"))]
    pub definition: ::sittir_core::SlotValue<Box<DefinitionTransport>>,
}

impl ::sittir_core::view::KindOf for FieldDefinitionTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(44)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for FieldDefinitionTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(44) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for FieldDefinitionTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_field_definition(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for FieldDefinitionTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.name.prepare(ctx)?;
        self.definition.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_identifier"))]
    pub identifier: ::sittir_core::SlotValue<IdentifierTransport>,
}

impl ::sittir_core::view::KindOf for NegatedFieldTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(45)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NegatedFieldTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(45) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NegatedFieldTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_negated_field(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NegatedFieldTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.identifier.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_type"))]
    pub type_: ::sittir_core::SlotValue<PredicateTypeEnum, true>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_parameters"))]
    pub parameters: Option<::sittir_core::SlotValue<ParametersTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_content"))]
    pub content: ::sittir_core::SlotValue<Box<AnyTransport>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_immediate_identifier"))]
    pub immediate_identifier: ::sittir_core::SlotValue<ImmediateIdentifierTransport, true>,
}

impl ::sittir_core::view::KindOf for PredicateTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(46)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PredicateTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(46) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PredicateTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_predicate(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for PredicateTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.type_.prepare(ctx)?;
        self.parameters.prepare(ctx)?;
        self.content.prepare(ctx)?;
        self.immediate_identifier.prepare(ctx)?;
        Ok(())
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
                        19 => return Ok(Self::Bang), // "!"
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
                        19 => return Ok(Self::Bang), // "!"
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
            Self::Bang => [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k)),
        }
    }
}

impl ::sittir_core::render::Render for PredicateTypeEnum {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        match self {
            Self::Question => { w.site_at(options::SITE_PREDICATE_TYPE_QMARK_BEFORE); w.text("?")?; w.site_at(options::SITE_PREDICATE_TYPE_QMARK_AFTER); Ok(()) }
            Self::Bang => { w.site_at(options::SITE_PREDICATE_TYPE_BANG_BEFORE); w.text("!")?; w.site_at(options::SITE_PREDICATE_TYPE_BANG_AFTER); Ok(()) }
        }
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct GroupExpressionArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_left"))]
    pub left: ::sittir_core::SlotValue<Box<GroupExpressionArmLeftTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_right"))]
    pub right: ::sittir_core::SlotValue<Box<GroupExpressionArmRightTransportSlot>>,
}

impl ::sittir_core::view::KindOf for GroupExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(47)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(47) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_group_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_left"))]
    pub left: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmLeftTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_right"))]
    pub right: ::sittir_core::SlotValue<Box<NamedNodeExpressionArmRightTransportSlot>>,
}

impl ::sittir_core::view::KindOf for NamedNodeExpressionArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(48)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeExpressionArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(48) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeExpressionArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_node_expression_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeExpressionArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.left.prepare(ctx)?;
        self.right.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_group_expression"))]
    pub group_expression: ::sittir_core::SlotValue<GroupingGroupGroupExpressionTransportSlot>,
}

impl ::sittir_core::view::KindOf for GroupingGroupTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(49)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for GroupingGroupTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(49) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for GroupingGroupTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_grouping_group(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for GroupingGroupTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.group_expression.prepare(ctx)?;
        Ok(())
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

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeArmTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_supertype"))]
    pub supertype: ::sittir_core::SlotValue<IdentifierTransport>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_name"))]
    pub name: ::sittir_core::SlotValue<NamedNodeArmNameTransportSlot, true>,
}

impl ::sittir_core::view::KindOf for NamedNodeArmTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(50)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeArmTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(50) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeArmTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_node_arm(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeArmTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        self.supertype.prepare(ctx)?;
        self.name.prepare(ctx)?;
        Ok(())
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for Box<NamedNodeArmTransport> {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        NamedNodeArmTransport::from_napi_value(env, napi_val).map(Box::new)
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for Box<NamedNodeArmTransport> {
    unsafe fn to_napi_value(
        env: ::napi::sys::napi_env,
        val: Self,
    ) -> ::napi::Result<::napi::sys::napi_value> {
        NamedNodeArmTransport::to_napi_value(env, *val)
    }
}

#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone)]
pub struct NamedNodeGroupChildrenTransport {
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_trivia"))]
    pub transport_trivia_data: Option<TransportTrivia>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "$_edges"))]
    pub edges: Option<::sittir_core::options::Edges>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions"))]
    pub named_node_expressions: Vec<::sittir_core::SlotValue<NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions_separator_space"))]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupChildrenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(52)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupChildrenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(52) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeGroupChildrenTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_node_group_children(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupChildrenTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.named_node_expressions.iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.named_node_expressions_separator_space.is_none() { self.named_node_expressions_separator_space = before; }
            let _ = after;
        }
        self.named_node_expressions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE].arm);
        ::sittir_core::prepare::fill_seated_gaps(self.named_node_expressions.iter_mut().map(Some), options::SEATS_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS, ctx);
        self.named_node_expressions.prepare(ctx)?;
        Ok(())
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
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions"))]
    pub named_node_expressions: Option<Vec<::sittir_core::SlotValue<NamedNodeGroupAnchoredLastNamedNodeExpressionsTransportSlot>>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_last"))]
    pub last: ::sittir_core::SlotValue<Box<NamedNodeGroupAnchoredLastLastTransportSlot>>,
    #[cfg_attr(feature = "napi-bindings", napi(js_name = "_named_node_expressions_separator_space"))]
    pub named_node_expressions_separator_space: Option<u16>,
}

impl ::sittir_core::view::KindOf for NamedNodeGroupAnchoredLastTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(53)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NamedNodeGroupAnchoredLastTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(53) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for NamedNodeGroupAnchoredLastTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, render_named_node_group_anchored_last(self, w))
    }
}

impl ::sittir_core::prepare::Prepare for NamedNodeGroupAnchoredLastTransport {
    fn prepare(&mut self, ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        ::sittir_core::prepare::prepare_edges(self, ctx);
        {
            let coords: Vec<Option<&::sittir_core::NodeCoordinate>> = self.named_node_expressions.as_deref().unwrap_or(&[]).iter().map(|item| item.coord()).collect();
            let (before, after) = ::sittir_core::classify::classify_list_gaps(&coords, ctx.sources, "", options::allowed(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE), &[], &options::WHITESPACE);
            if self.named_node_expressions_separator_space.is_none() { self.named_node_expressions_separator_space = before; }
            let _ = after;
        }
        self.named_node_expressions_separator_space.get_or_insert(ctx.options.spacing[options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE].arm);
        if let Some(seated_items) = self.named_node_expressions.as_mut() { ::sittir_core::prepare::fill_seated_gaps(seated_items.iter_mut().map(Some), options::SEATS_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS, ctx); }
        self.named_node_expressions.prepare(ctx)?;
        self.last.prepare(ctx)?;
        Ok(())
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
        [::sittir_core::types::KindId(26)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for NewlineTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(26) }
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

#[derive(Debug, Clone)]
pub struct StarTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
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
pub struct PlusTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
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
pub struct QmarkTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
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
pub struct AtTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
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
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for AtTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for AtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "@".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "@".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for AtTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "@".to_string());
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
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DquoteTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DquoteTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "\"".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "\"".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for DquoteTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "\"".to_string());
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
pub struct RbrackTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RbrackTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(14)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RbrackTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(14) }
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
pub struct LparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for LparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(15)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for LparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(15) }
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
pub struct RparenTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for RparenTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(16)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for RparenTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(16) }
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
pub struct MissingKeywordTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for MissingKeywordTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(17)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for MissingKeywordTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(17) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for MissingKeywordTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for MissingKeywordTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for MissingKeywordTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "MISSING".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "MISSING".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for MissingKeywordTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "MISSING".to_string());
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
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for UnderscoreTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for UnderscoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "_".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "_".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for UnderscoreTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "_".to_string());
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
    pub text: String,
}

impl ::sittir_core::view::KindOf for ColonTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(18)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for ColonTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(18) }
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

#[derive(Debug, Clone)]
pub struct BangTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for BangTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(19)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for BangTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(19) }
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
pub struct PoundTransport {
    pub transport_trivia_data: Option<TransportTrivia>,
    pub edges: Option<::sittir_core::options::Edges>,
    pub text: String,
}

impl ::sittir_core::view::KindOf for PoundTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(20)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for PoundTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(20) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for PoundTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for PoundTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for PoundTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "#".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "#".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for PoundTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "#".to_string());
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
    pub text: String,
}

impl ::sittir_core::view::KindOf for DotTransport {
    fn kind_in(&self, kinds: &[::sittir_core::types::KindId]) -> bool {
        [::sittir_core::types::KindId(21)].iter().any(|k| kinds.contains(k))
    }
}

impl ::sittir_core::options::Edged for DotTransport {
    fn kind_id(&self) -> ::sittir_core::types::KindId { ::sittir_core::types::KindId(21) }
    fn edges(&self) -> &::sittir_core::options::Edges { self.edges.as_ref().unwrap_or(&::sittir_core::options::Edges::NONE) }
    fn edges_mut(&mut self) -> &mut ::sittir_core::options::Edges { self.edges.get_or_insert_with(Default::default) }
}

impl ::sittir_core::render::Render for DotTransport {
    fn render(&self, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for DotTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for DotTransport {
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
impl ::napi::bindgen_prelude::FromNapiValue for DotTransport {
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
        render_with_trivia!(self, w, w.text(&self.text))
    }
}

impl ::sittir_core::prepare::Prepare for SlashTransport {
    fn prepare(&mut self, _ctx: &::sittir_core::prepare::RenderContext<'_>) -> Result<(), ::sittir_core::render::CoordinateError> {
        Ok(())
    }
}

#[cfg(all(feature = "napi-bindings", not(feature = "debug-transport")))]
impl ::napi::bindgen_prelude::FromNapiValue for SlashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let mut __trivia: Option<TransportTrivia> = None;
        let text = match ::sittir_core::slot::transport_value_type(env, napi_val)? {
            ::napi::ValueType::String => String::from_napi_value(env, napi_val)?,
            // Raw kind_id: value-less leaf sent as its numeric kind tag.
            ::napi::ValueType::Number => "/".to_string(),
            _ => {
                let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
                __trivia = obj.get("$_trivia")?;
                obj.get("$text")?.unwrap_or_else(|| "/".to_string())
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
impl ::napi::bindgen_prelude::FromNapiValue for SlashTransport {
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        let obj = ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)?;
        let text: String = obj.get("$text")?.unwrap_or_else(|| "/".to_string());
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
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(33)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for StringTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(34)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for ListTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(38)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(39)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for MissingNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(40)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for AnonymousNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(41)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(42)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for FieldDefinitionTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(44)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NegatedFieldTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(45)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for PredicateTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(46)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(48)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        None
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingGroupTransport {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        if let Some(site) = ::sittir_core::prepare::seat_site(table, ::sittir_core::types::KindId(49)) {
            return Some((self.edges.get_or_insert_with(Default::default), site));
        }
        if let ::sittir_core::SlotValue::Transport(inner) = &mut self.group_expression {
            return inner.seat_target(table);
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

impl ::sittir_core::prepare::SeatTarget for ListContentTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupingContentTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
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

impl ::sittir_core::prepare::SeatTarget for MissingNodeContentTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
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

impl ::sittir_core::prepare::SeatTarget for AnonymousNodeContentTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::Capture(t) => t.seat_target(table),
            #[allow(unreachable_patterns)]
            _ => None,
        }
    }
}

impl ::sittir_core::prepare::SeatTarget for GroupExpressionArmLeftTransportSlot {
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

impl ::sittir_core::prepare::SeatTarget for GroupExpressionArmRightTransportSlot {
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

impl ::sittir_core::prepare::SeatTarget for NamedNodeExpressionArmLeftTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNode(t) => t.seat_target(table),
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
            Self::NamedNode(t) => t.seat_target(table),
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

impl ::sittir_core::prepare::SeatTarget for NamedNodeGroupChildrenNamedNodeExpressionsTransportSlot {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut ::sittir_core::options::Edges, usize)> {
        match self {
            Self::NamedNode(t) => t.seat_target(table),
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
            Self::NamedNode(t) => t.seat_target(table),
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
            Self::NamedNode(t) => t.seat_target(table),
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
            Self::NamedNode(t) => t.seat_target(table),
            Self::FieldDefinition(t) => t.seat_target(table),
            Self::NegatedField(t) => t.seat_target(table),
            Self::Predicate(t) => t.seat_target(table),
            Self::NamedNodeExpressionArm(t) => t.seat_target(table),
            Self::GroupingGroup(t) => t.seat_target(table),
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
        head: None,
        tail: None,
    };
    definitions.render(w)?;
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
    w.edge(::sittir_core::types::KindId(33), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("@")?;
    w.adjacent();
    name.render(w)?;
    w.edge(::sittir_core::types::KindId(33), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_string(node: &StringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.edge(::sittir_core::types::KindId(34), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(34), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_immediate_string(node: &ImmediateStringTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let string_content = View::new(&node.string_content, "{}");
    w.text("\"")?;
    string_content.render(w)?;
    w.text("\"")?;
    w.edge(::sittir_core::types::KindId(35), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
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
        head: None,
        tail: None,
    };
    elements.render(w)?;
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
    let content = ListView {
        items: node.content.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.content_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
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
    w.edge(::sittir_core::types::KindId(38), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("[")?;
    w.site_at(options::SITE_LIST_LBRACK_AFTER);
    definitions.render(w)?;
    w.site_at(options::SITE_LIST_RBRACK_BEFORE);
    w.text("]")?;
    w.site_at(options::SITE_LIST_RBRACK_AFTER);
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(38), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_grouping(node: &GroupingTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = ListView {
        items: node.content.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.content_separator_space.unwrap_or(0),
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
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_GROUPING_LPAREN_AFTER);
    grouping_group.render(w)?;
    w.site_at(options::SITE_GROUPING_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_GROUPING_RPAREN_AFTER);
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(39), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_missing_node(node: &MissingNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = ListView {
        items: node.content.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.content_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let name = View::new(&node.name, "{}");
    w.edge(::sittir_core::types::KindId(40), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_MISSING_NODE_LPAREN_AFTER);
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_BEFORE);
    w.text("MISSING")?;
    w.site_at(options::SITE_MISSING_NODE_MISSING_KEYWORD_AFTER);
    name.render(w)?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_MISSING_NODE_RPAREN_AFTER);
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(40), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_anonymous_node(node: &AnonymousNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = ListView {
        items: node.content.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.content_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(41), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    name.render(w)?;
    content.render(w)?;
    w.edge(::sittir_core::types::KindId(41), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node(node: &NamedNodeTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let capture = ListView {
        items: node.capture.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: 0,
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    let name = View::new(&node.name, "{}");
    let named_node_arm = View::new(&node.named_node_arm, "{}");
    let named_node_group = View::new(&node.named_node_group, "{}");
    let quantifier = ListView {
        items: node.quantifier.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: 0,
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    w.edge(::sittir_core::types::KindId(42), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.site_at(options::SITE_NAMED_NODE_LPAREN_AFTER);
    name.render(w)?;
    named_node_arm.render(w)?;
    named_node_group.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_RPAREN_BEFORE);
    w.text(")")?;
    w.site_at(options::SITE_NAMED_NODE_RPAREN_AFTER);
    capture.render(w)?;
    quantifier.render(w)?;
    w.edge(::sittir_core::types::KindId(42), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_field_definition(node: &FieldDefinitionTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let definition = &node.definition;
    let name = &node.name;
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    name.render(w)?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_BEFORE);
    w.text(":")?;
    w.site_at(options::SITE_FIELD_DEFINITION_COLON_AFTER);
    definition.render(w)?;
    w.edge(::sittir_core::types::KindId(44), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_negated_field(node: &NegatedFieldTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let identifier = &node.identifier;
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("!")?;
    w.adjacent();
    w.site_at(options::SITE_NEGATED_FIELD_BANG_AFTER);
    identifier.render(w)?;
    w.edge(::sittir_core::types::KindId(45), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_predicate(node: &PredicateTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let content = &node.content;
    let immediate_identifier = &node.immediate_identifier;
    let parameters = View::new(&node.parameters, "{}");
    let type_ = &node.type_;
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    w.text("(")?;
    w.adjacent();
    w.site_at(options::SITE_PREDICATE_LPAREN_AFTER);
    content.render(w)?;
    w.adjacent();
    immediate_identifier.render(w)?;
    w.adjacent();
    type_.render(w)?;
    parameters.render(w)?;
    w.site_at(options::SITE_PREDICATE_RPAREN_BEFORE);
    w.text(")")?;
    w.edge(::sittir_core::types::KindId(46), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_predicate_type(t: &PredicateTypeEnum, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    w.adjacent();
    t.render(w)
}

fn render_group_expression_arm(node: &GroupExpressionArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let left = &node.left;
    let right = &node.right;
    w.edge(::sittir_core::types::KindId(47), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    left.render(w)?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_GROUP_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(47), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_expression_arm(node: &NamedNodeExpressionArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let left = &node.left;
    let right = &node.right;
    w.edge(::sittir_core::types::KindId(48), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    left.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_BEFORE);
    w.text(".")?;
    w.site_at(options::SITE_NAMED_NODE_EXPRESSION_ARM_DOT_AFTER);
    right.render(w)?;
    w.edge(::sittir_core::types::KindId(48), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_grouping_group(node: &GroupingGroupTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let group_expression = &node.group_expression;
    w.edge(::sittir_core::types::KindId(49), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    group_expression.render(w)?;
    w.edge(::sittir_core::types::KindId(49), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_arm(node: &NamedNodeArmTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let name = &node.name;
    let supertype = &node.supertype;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    supertype.render(w)?;
    w.text("/")?;
    w.adjacent();
    name.render(w)?;
    w.edge(::sittir_core::types::KindId(50), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_group_children(node: &NamedNodeGroupChildrenTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let named_node_expressions = ListView {
        items: &node.named_node_expressions,
        template: "{}",
        token: "",
        before: 0,
        after: node.named_node_expressions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    w.edge(::sittir_core::types::KindId(52), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    named_node_expressions.render(w)?;
    w.edge(::sittir_core::types::KindId(52), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
    Ok(())
}

fn render_named_node_group_anchored_last(node: &NamedNodeGroupAnchoredLastTransport, w: &mut dyn ::sittir_core::render::RenderSink) -> ::sittir_core::render::RenderResult {
    let last = &node.last;
    let named_node_expressions = ListView {
        items: node.named_node_expressions.as_deref().unwrap_or(&[]),
        template: "{}",
        token: "",
        before: 0,
        after: node.named_node_expressions_separator_space.unwrap_or(0),
        leading: false,
        trailing: false,
        head: None,
        tail: None,
    };
    w.edge(::sittir_core::types::KindId(53), ::sittir_core::options::Side::Before, node.edges.and_then(|e| e.before));
    named_node_expressions.render(w)?;
    last.render(w)?;
    w.site_at(options::SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_BEFORE);
    w.text(".")?;
    w.edge(::sittir_core::types::KindId(53), ::sittir_core::options::Side::After, node.edges.and_then(|e| e.after));
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
            Self::NamedNode(inner) => inner.kind_in(kinds),
            Self::FieldDefinition(inner) => inner.kind_in(kinds),
            Self::NegatedField(inner) => inner.kind_in(kinds),
            Self::Predicate(inner) => inner.kind_in(kinds),
            Self::PredicateType(inner) => inner.kind_in(kinds),
            Self::GroupExpressionArm(inner) => inner.kind_in(kinds),
            Self::NamedNodeExpressionArm(inner) => inner.kind_in(kinds),
            Self::GroupingGroup(inner) => inner.kind_in(kinds),
            Self::NamedNodeArm(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupChildren(inner) => inner.kind_in(kinds),
            Self::NamedNodeGroupAnchoredLast(inner) => inner.kind_in(kinds),
            Self::Tight(inner) => inner.kind_in(kinds),
            Self::Space(inner) => inner.kind_in(kinds),
            Self::Newline(inner) => inner.kind_in(kinds),
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
            AnyTransport::NamedNode(t) => t.render(w),
            AnyTransport::FieldDefinition(t) => t.render(w),
            AnyTransport::NegatedField(t) => t.render(w),
            AnyTransport::Predicate(t) => t.render(w),
            AnyTransport::PredicateType(t) => t.render(w),
            AnyTransport::GroupExpressionArm(t) => t.render(w),
            AnyTransport::NamedNodeExpressionArm(t) => t.render(w),
            AnyTransport::GroupingGroup(t) => t.render(w),
            AnyTransport::NamedNodeArm(t) => t.render(w),
            AnyTransport::NamedNodeGroupChildren(t) => t.render(w),
            AnyTransport::NamedNodeGroupAnchoredLast(t) => t.render(w),
            AnyTransport::Tight(t) => t.render(w),
            AnyTransport::Space(t) => t.render(w),
            AnyTransport::Newline(t) => t.render(w),
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
            AnyTransport::Literal0_5b_5e_22_5c_5c_5c_6e_5d_2b => w.text("[^\"\\\\\\n]+"),
            AnyTransport::Literal1_73_74_61_72 => w.text("*"),
            AnyTransport::Literal2_70_6c_75_73 => w.text("+"),
            AnyTransport::Literal3_71_6d_61_72_6b => w.text("?"),
            AnyTransport::Literal4_75_6e_64_65_72_73_63_6f_72_65 => w.text("_"),
            AnyTransport::Literal5_70_6f_75_6e_64 => w.text("#"),
            AnyTransport::Literal6_64_6f_74 => w.text("."),
            AnyTransport::Literal7_62_61_6e_67 => w.text("!"),
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

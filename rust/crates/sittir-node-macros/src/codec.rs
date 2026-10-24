//! The wire codec a node declaration expands to, in today's napi object
//! form: `FromNapiValue` and `ToNapiValue` for the type and for `Box` of it.
//! Every item sits inside `::sittir_core::napi_codec!`, which keeps it only
//! when `sittir-core` is built with napi bindings, and names napi as
//! `::sittir_core::__napi`.

use proc_macro2::TokenStream;
use quote::quote;
use syn::{Ident, LitStr, Path, Type};

/// A struct field as the wire sees it.
pub struct WireField<'a> {
    pub ident: &'a Ident,
    pub ty: &'a Type,
    pub key: &'a LitStr,
}

/// A choice variant as the wire sees it.
pub struct WireVariant<'a> {
    pub name: &'a Ident,
    /// The written payload type; `None` for a unit variant.
    pub payload: Option<&'a Type>,
    /// The index the reader's `__variant` gives the variant, when it matches one.
    pub index: Option<u16>,
    /// The id a unit variant writes: the first it claims.
    pub first: Option<Path>,
    /// Ids the codec also decodes as this variant.
    pub decodes: Vec<Path>,
    pub blank: bool,
    pub verbatim: bool,
    pub error: bool,
    /// For a `text` variant, the kinds whose objects carrying `$text` it takes.
    pub text: Option<Vec<Path>>,
    /// A unit that holds its kind's edges: decoded with none set.
    pub edged: bool,
}

fn napi() -> TokenStream {
    quote!(::sittir_core::__napi)
}

fn c_key(key: &LitStr) -> syn::Result<syn::LitCStr> {
    let value = ::std::ffi::CString::new(key.value()).map_err(|_| syn::Error::new_spanned(key, "a wire key holds no NUL byte"))?;
    Ok(syn::LitCStr::new(&value, key.span()))
}

fn is_option(ty: &Type) -> bool {
    crate::expand::last_segment(ty).as_deref() == Some("Option")
}

/// A list whose items may each be absent: `Vec<Option<_>>` or
/// `NonEmptyVec<Option<_>>`, encoded through `boundary::holes`.
fn holds_absent_items(ty: &Type) -> bool {
    let Type::Path(path) = ty else { return false };
    let Some(list) = path.path.segments.last() else { return false };
    if list.ident != "Vec" && list.ident != "NonEmptyVec" {
        return false;
    }
    let syn::PathArguments::AngleBracketed(args) = &list.arguments else { return false };
    matches!(args.args.first(), Some(syn::GenericArgument::Type(item)) if is_option(item))
}

fn is_flag(ty: &Type) -> bool {
    crate::expand::last_segment(ty).as_deref() == Some("bool")
}

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::napi_codec! { #items })
}

fn boxed(ident: &Ident) -> TokenStream {
    let napi = napi();
    quote! {
        impl #napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                unsafe { <#ident as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val) }.map(::std::boxed::Box::new)
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { <#ident as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, *val) }
            }
        }
    }
}

/// The initializers that read `fields` from `obj`, each by its key.
fn field_reads(owner: &str, fields: &[&WireField<'_>]) -> syn::Result<Vec<TokenStream>> {
    fields
        .iter()
        .map(|field| {
            let (ident, key) = (field.ident, c_key(field.key)?);
            let read = if is_option(field.ty) {
                quote!(optional)
            } else if is_flag(field.ty) {
                quote!(flag)
            } else {
                quote!(required)
            };
            Ok(quote!(#ident: unsafe { ::sittir_core::boundary::#read(env, obj, #key, #owner)? },))
        })
        .collect()
}

/// `{ $type, …fields }` in declaration order, defined in one call: an optional
/// field only when present.
fn struct_encode(ident: &Ident, fields: &[WireField<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let names = fields.iter().map(|field| field.ident);
    let mut entries = Vec::new();
    for field in fields {
        let (name, key) = (field.ident, c_key(field.key)?);
        entries.push(if is_option(field.ty) {
            quote!(::sittir_core::boundary::present(env, #key, #name)?,)
        } else if holds_absent_items(field.ty) {
            quote!(::core::option::Option::Some((#key, ::sittir_core::boundary::holes(env, ::std::vec::Vec::from(#name))?)),)
        } else {
            quote!(::core::option::Option::Some((#key, #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, #name)?)),)
        });
    }
    Ok(quote! {
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                let Self { #(#names),* } = val;
                unsafe {
                    ::sittir_core::boundary::object_with_present(env, &[
                        ::core::option::Option::Some((c"$type", #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?)),
                        #(#entries)*
                    ])
                }
            }
        }
    })
}

/// A struct: decoded from an object field by field, encoded as one.
pub fn structure(ident: &Ident, fields: &[WireField<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let reads = field_reads(&ident.to_string(), &fields.iter().collect::<Vec<_>>())?;
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    Ok(gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                ::core::result::Result::Ok(Self { #(#reads)* })
            }
        }
        #encode
        #boxed
    }))
}

/// The module a kind constant lives in: the declared `kind` path less its
/// last segment, where the grammar's `kind_name_from_id` sits beside it.
fn kind_module(ident: &Ident, kind: Option<&Path>) -> syn::Result<Path> {
    let mut module = kind.cloned().ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf declares its kind: `#[node(kind = …)]`"))?;
    if module.segments.len() < 2 {
        return Err(syn::Error::new_spanned(
            &module,
            format!("{ident}'s kind names no module to find `kind_name_from_id` in: write it as `<kind_ids module>::<CONST>`"),
        ));
    }
    module.segments.pop();
    module.segments.pop_punct();
    Ok(module)
}

/// A text leaf: decoded from its text, from a bare kind id (its fixed text) or
/// from an object; encoded as a struct, so a leaf in a choice keeps its `$type`.
/// A leaf with no fixed text refuses a bare kind id, naming that id's kind
/// through `kind_name_from_id` in the module its `kind` constant lives in.
pub fn text_leaf(ident: &Ident, fields: &[WireField<'_>], fixed: Option<&LitStr>, kind: Option<&Path>) -> syn::Result<TokenStream> {
    let napi = napi();
    let owner = ident.to_string();
    let text_key = fields
        .iter()
        .find(|field| field.ident == "text")
        .map(|field| c_key(field.key))
        .transpose()?
        .ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `text` field"))?;
    let others: Vec<&WireField<'_>> = fields.iter().filter(|field| field.ident != "text").collect();
    let defaults: Vec<TokenStream> = others
        .iter()
        .map(|field| {
            let name = field.ident;
            quote!(#name: ::core::default::Default::default(),)
        })
        .collect();
    let reads = field_reads(&owner, &others)?;
    let text_of_object = if let Some(text) = fixed { quote!(.unwrap_or_else(|| ::std::string::ToString::to_string(#text))) } else { quote! {
        .ok_or_else(|| #napi::Error::from_reason(::std::format!("{}: an object carries no `{}`, and the kind has no fixed text", #owner, #text_key.to_string_lossy())))?
    } };
    let number = if let Some(text) = fixed { quote! {
        #napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string(#text), #(#defaults)* }),
    } } else {
        let names = kind_module(ident, kind)?;
        quote! {
            #napi::ValueType::Number => {
                let id = unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                ::core::result::Result::Err(#napi::Error::from_reason(::std::format!(
                    "kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id",
                    #names::kind_name_from_id(id),
                    #owner
                )))
            }
        }
    };
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    Ok(gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                match unsafe { ::sittir_core::slot::node_value_type(env, napi_val)? } {
                    #napi::ValueType::String => ::core::result::Result::Ok(Self {
                        text: unsafe { <::std::string::String as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? },
                        #(#defaults)*
                    }),
                    #number
                    #napi::ValueType::Object => {
                        let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                        ::core::result::Result::Ok(Self {
                            text: unsafe { ::sittir_core::boundary::optional::<::std::string::String>(env, obj, #text_key, #owner)? }
                                #text_of_object,
                            #(#reads)*
                        })
                    }
                    _ => ::core::result::Result::Err(#napi::Error::from_reason(::std::format!(
                        "{}: expected a string, a kind id or an object, not a {}",
                        #owner,
                        unsafe { ::sittir_core::slot::js_type_name(env, napi_val)? }
                    ))),
                }
            }
        }
        #encode
        #boxed
    }))
}

/// A choice: an id resolves through the reader's `__variant`, then the
/// `decodes` ids, then the blank arm; any other id is refused.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let owner = ident.to_string();
    let decoded = |name: &Ident, ty: &Type| {
        quote!(#ident::#name(unsafe { <#ty as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? }))
    };
    let (mut by_index, mut by_decodes, mut encodes) = (Vec::new(), Vec::new(), Vec::new());
    let (mut blank, mut error_arm, mut string_arm, mut text_arm) = (quote!(), quote!(), quote!(), quote!());
    for variant in variants {
        let name = variant.name;
        let value = match variant.payload {
            Some(ty) => decoded(name, ty),
            None if variant.edged => quote!(#ident::#name(::core::default::Default::default())),
            None => quote!(#ident::#name),
        };
        if let Some(i) = variant.index {
            by_index.push(quote!(::core::option::Option::Some(#i) => return ::core::result::Result::Ok(#value),));
        }
        if !variant.decodes.is_empty() {
            let ids = &variant.decodes;
            by_decodes.push(quote!(if [#(#ids),*].contains(&id) { return ::core::result::Result::Ok(#value); }));
        }
        if variant.blank {
            blank = quote!(if id == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(#ident::#name); });
        }
        if variant.verbatim || variant.error {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a verbatim variant holds its text"))?;
            let value = decoded(name, ty);
            error_arm = quote!(if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(#value); });
            if variant.verbatim {
                string_arm = quote!(#napi::ValueType::String => ::core::result::Result::Ok(#value),);
            }
        }
        if let Some(ids) = &variant.text {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a text variant holds its text"))?;
            let value = decoded(name, ty);
            text_arm = quote! {
                if [#(#ids),*].contains(&id)
                    && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()
                {
                    return ::core::result::Result::Ok(#value);
                }
            };
        }
        encodes.push(match (variant.payload, variant.blank, &variant.first) {
            (Some(ty), _, _) => quote!(Self::#name(payload) => unsafe { <#ty as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, payload) },),
            (None, true, _) => quote!(Self::#name => unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, ::sittir_core::types::KindId::BLANK) },),
            (None, false, Some(first)) if variant.edged => quote!(Self::#name(_) => unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, #first) },),
            (None, false, Some(first)) => quote!(Self::#name => unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, #first) },),
            (None, false, None) => return Err(syn::Error::new_spanned(name, "a unit variant names the kind it writes: `#[kind(…)]`")),
        });
    }
    let expected = if string_arm.is_empty() {
        format!("{owner}: expected u16 kind_id or object with $type")
    } else {
        format!("{owner}: expected u16 kind_id, string, or object with $type")
    };
    let missing = format!("$type property missing in {owner}");
    let boxed = boxed(ident);
    Ok(gated(&quote! {
        unsafe fn __decode_id(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value, id: __Kind) -> #napi::Result<#ident> {
            match __variant(id, id) {
                #(#by_index)*
                _ => {}
            }
            #(#by_decodes)*
            #blank
            ::core::result::Result::Err(#napi::Error::from_reason(::std::format!("unknown kind id {id} in {}", #owner)))
        }
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                match unsafe { ::sittir_core::slot::node_value_type(env, napi_val)? } {
                    #napi::ValueType::Number => {
                        let id = unsafe { <__Kind as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                        unsafe { __decode_id(env, napi_val, id) }
                    }
                    #napi::ValueType::Object => {
                        let id: __Kind = unsafe { ::sittir_core::boundary::property(env, napi_val, c"$type")? }
                            .ok_or_else(|| #napi::Error::from_reason(#missing))?;
                        #text_arm
                        #error_arm
                        unsafe { __decode_id(env, napi_val, id) }
                    }
                    #string_arm
                    _ => ::core::result::Result::Err(#napi::Error::from_reason(#expected)),
                }
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                match val {
                    #(#encodes)*
                }
            }
        }
        #boxed
    }))
}

/// An enum kind: a member decodes from an id it claims and writes its first.
pub fn members(ident: &Ident) -> TokenStream {
    let napi = napi();
    let owner = ident.to_string();
    let boxed = boxed(ident);
    gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let id = unsafe { <__Kind as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                __member(id, id).ok_or_else(|| #napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", #owner)))
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { <__Kind as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, __id(&val)) }
            }
        }
        #boxed
    })
}

#[cfg(test)]
mod tests {
    use syn::parse_quote;

    fn expand(input: &syn::DeriveInput) -> String {
        crate::expand::derive(input).expect("expands").to_string().split_whitespace().collect()
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn a_struct_reads_and_writes_each_field_by_its_key() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::LET_DECLARATION)]
            pub struct LetDeclarationNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_pattern")]
                #[slot(field = field::PATTERN)]
                pub pattern: SlotValue<PatternNode>,
                #[wire(key = "_value")]
                #[slot(field = field::VALUE)]
                pub value: Option<SlotValue<ExpressionNode>>,
            }
        });
        assert!(has(&out, "::sittir_core::napi_codec! {"));
        assert!(has(&out, "let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };"));
        assert!(has(&out, r#"pattern: unsafe { ::sittir_core::boundary::required(env, obj, c"_pattern", "LetDeclarationNode")? },"#));
        assert!(has(&out, r#"value: unsafe { ::sittir_core::boundary::optional(env, obj, c"_value", "LetDeclarationNode")? },"#));
        assert!(has(&out, r#"::sittir_core::boundary::object_with_present(env, &[ ::core::option::Option::Some((c"$type", ::sittir_core::__napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?)), ::sittir_core::boundary::present(env, c"$_layout", layout)?,"#));
        let order = ["c\"$type\"", "c\"$_layout\"", "c\"_pattern\"", "c\"_value\""].map(|key| out.rfind(key).expect("every key is written"));
        assert!(order.windows(2).all(|pair| pair[0] < pair[1]), "keys are written in declaration order: {order:?}");
        assert!(!has(&out, "::sittir_core::boundary::set(env, obj,"));
        assert!(has(&out, "impl ::sittir_core::__napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<LetDeclarationNode>"));
    }

    #[test]
    fn a_text_leaf_decodes_its_text_a_bare_kind_id_or_an_object() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::SELF, text = "self")]
            pub struct SelfNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        });
        assert!(has(&out, r#"::sittir_core::__napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string("self"), layout: ::core::default::Default::default(), }),"#));
        assert!(has(&out, r#"::sittir_core::boundary::optional::<::std::string::String>(env, obj, c"$text", "SelfNode")"#));
        assert!(has(&out, r#".unwrap_or_else(|| ::std::string::ToString::to_string("self"))"#));
    }

    #[test]
    fn a_text_leaf_with_no_fixed_text_refuses_a_bare_kind_id() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text)]
            pub struct IdentifierNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        });
        assert!(has(
            &out,
            r#"::std::format!("kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id", kind::kind_name_from_id(id), "IdentifierNode")"#
        ));
        assert!(has(&out, r#""{}: expected a string, a kind id or an object, not a {}", "IdentifierNode", unsafe { ::sittir_core::slot::js_type_name(env, napi_val)? }"#));
        assert!(has(&out, r"an object carries no `{}`, and the kind has no fixed text"));
    }

    #[test]
    fn a_text_leaf_whose_kind_names_no_module_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[node(kind = IDENTIFIER, text)]
            pub struct IdentifierNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a kind with no module");
        assert!(error.to_string().contains("IdentifierNode"));
        assert!(error.to_string().contains("kind_name_from_id"));
    }

    #[test]
    fn a_choice_decodes_the_ids_its_variants_claim_and_refuses_the_rest() {
        let out = expand(&parse_quote! {
            #[node(choice)]
            pub enum PropertyNodeSlot {
                #[kind(kind::_PROPERTY_IDENTIFIER, display, decodes(kind::GET_KEYWORD, kind::SET_KEYWORD))]
                PropertyIdentifier(PropertyIdentifierNode),
                #[kind(kind::PRIVATE_PROPERTY_IDENTIFIER)]
                PrivatePropertyIdentifier(PrivatePropertyIdentifierNode),
                #[node(blank)]
                Blank,
            }
        });
        assert!(has(&out, "match __variant(id, id) { ::core::option::Option::Some(0u16) => return"));
        assert!(has(&out, "if [kind::GET_KEYWORD, kind::SET_KEYWORD].contains(&id)"));
        assert!(has(&out, "if id == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(PropertyNodeSlot::Blank); }"));
        assert!(has(&out, r#"::std::format!("unknown kind id {id} in {}", "PropertyNodeSlot")"#));
        assert!(!has(&out, "if let ::core::result::Result::Ok("));
    }

    #[test]
    fn a_unit_variant_writes_its_first_claimed_id_and_the_blank_arm_writes_zero() {
        let out = expand(&parse_quote! {
            #[node(choice)]
            pub enum StatementBlockTerminatorNodeSlot {
                #[kind(kind::_AUTOMATIC_SEMICOLON, kind::SEMI)]
                AutomaticSemicolon,
                #[node(blank)]
                Blank,
            }
        });
        assert!(has(&out, "Self::AutomaticSemicolon => unsafe { <::sittir_core::types::KindId as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, kind::_AUTOMATIC_SEMICOLON) },"));
        assert!(has(&out, "Self::Blank => unsafe { <::sittir_core::types::KindId as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, ::sittir_core::types::KindId::BLANK) },"));
    }

    #[test]
    fn an_error_variant_decodes_an_error_object_and_no_bare_text() {
        let out = expand(&parse_quote! {
            #[node(choice, codec_only)]
            pub enum AnyNode {
                #[kind(kind::LINE_COMMENT)]
                LineComment(LineCommentNode),
                #[node(error)]
                Verbatim(VerbatimNode),
            }
        });
        assert!(has(&out, "if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(AnyNode::Verbatim("));
        assert!(!has(&out, "ValueType::String =>"));
    }

    #[test]
    fn verbatim_and_text_variants_take_their_wire_forms_and_a_codec_only_choice_has_no_reader() {
        let out = expand(&parse_quote! {
            #[node(choice, codec_only)]
            pub enum TriviaNode {
                #[kind(kind::LINE_COMMENT)]
                LineComment(LineCommentNode),
                #[node(verbatim)]
                Verbatim(VerbatimNode),
                #[node(text)]
                #[kind(kind::LINE_COMMENT)]
                Text(::sittir_core::trivia::TriviaText),
            }
        });
        assert!(has(&out, "if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(TriviaNode::Verbatim("));
        assert!(has(&out, "::sittir_core::__napi::ValueType::String => ::core::result::Result::Ok(TriviaNode::Verbatim("));
        assert!(has(&out, r#"if [kind::LINE_COMMENT].contains(&id) && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()"#));
        assert!(!has(&out, "::core::option::Option::Some(2u16)"));
        assert!(!out.contains("ReadNode"));
    }

    #[test]
    fn an_enum_kind_decodes_a_member_id_and_writes_its_first() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::_PRIMITIVE_TYPE, spelled)]
            pub enum PrimitiveTypeEnum {
                #[kind(kind::U8_KEYWORD)]
                U8,
                #[kind(kind::BOOL_KEYWORD)]
                Bool,
            }
        });
        assert!(has(&out, r#"__member(id, id).ok_or_else(|| ::sittir_core::__napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", "PrimitiveTypeEnum")))"#));
        assert!(has(&out, "PrimitiveTypeEnum::U8 => kind::U8_KEYWORD,"));
        assert!(has(&out, "to_napi_value(env, __id(&val))"));
    }

    #[test]
    fn a_field_without_a_key_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[node(kind = kind::X)]
            pub struct XNode {
                #[slot(field = field::NAME)]
                pub name: SlotValue<IdentifierNode>,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a field without a key");
        assert!(error.to_string().contains("crosses the wire under a key"));
    }
}

//! A node type's record writer, `sittir_core::arena::WriteCell`: the cell
//! that names the node in its holder's record, after the node's own record
//! and its children's. Every item sits inside `::sittir_core::records_codec!`,
//! which keeps it only when `sittir-core` is built with the arena.
//!
//! A struct writes its built record from its stamps alone: a presence sets
//! its bit, a slot writes its one-word cell at its built place, a list its
//! run, a capture its text, and a print setting goes to the side record. A
//! text leaf writes a leaf cell and no record of cells. A choice writes the
//! cell of the variant it holds, and a unit arm its kind.

use crate::attrs::{KindAttrs, SlotAttrs};
use crate::codec::WireVariant;
use crate::expand::{capture_fields, inner_of, Field, Role};
use proc_macro2::TokenStream;
use quote::quote;
use syn::Ident;

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::records_codec! { #items })
}

/// The statement writing `field`'s cell, by its stamp. `capture` says the
/// field is a capture slot.
fn slot_write(field: &Field<'_>, slot: &SlotAttrs, capture: bool) -> syn::Result<TokenStream> {
    let name = field.ident;
    let word = slot.cell.word.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its record cell (`word = …`)")))?;
    let at = word as usize;
    if let Some(bit) = slot.cell.bit {
        return Ok(quote!(__words[#at] |= u32::from(self.#name) << #bit;));
    }
    let built = slot.cell.built.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its built cell (`built = …`)")))? as usize;
    let key = field.key.as_ref().ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its wire key")))?;
    if slot.cell.run.is_some() {
        return Ok(quote!(__words[#built] = ::sittir_core::arena::write_list(__sink, self.#name.iter(), #key)?.0;));
    }
    if !capture {
        return Ok(quote!(__words[#built] = ::sittir_core::arena::write_slot(__sink, &self.#name, #key)?.0;));
    }
    let cell = if inner_of(field.ty, "Option").is_some() {
        quote! {
            match &self.#name {
                ::core::option::Option::Some(text) => ::sittir_core::arena::captured_cell(__sink, text)?,
                ::core::option::Option::None => ::sittir_core::arena::CellWord(0),
            }
        }
    } else {
        quote!(::sittir_core::arena::captured_cell(__sink, &self.#name)?)
    };
    Ok(quote!(__words[#built] = (#cell).0;))
}

/// A struct's record writer; none for a struct with no stamped record.
pub fn structure(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    if attrs.words.is_none() {
        return Ok(TokenStream::new());
    }
    let words = attrs.built_words.ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}` has a record, so it states its built width: `#[node(built_words = …)]`")))?;
    let layout = fields
        .iter()
        .find(|field| matches!(field.role, Role::Layout))
        .ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}` has a record, so it has a `#[layout]` field")))?;
    let (layout_name, layout_ty) = (layout.ident, layout.ty);
    let trivia = quote!(<#layout_ty as ::sittir_core::arena::LayoutField>::Trivia);
    let writer = |body: TokenStream| {
        gated(&quote! {
            impl ::sittir_core::arena::WriteCell<#trivia> for #ident {
                fn write_cell(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, #trivia>) -> ::core::result::Result<::sittir_core::arena::CellWord, ::sittir_core::arena::ArenaError> {
                    #body
                }
            }
        })
    };
    let layout_of = quote!(::sittir_core::arena::LayoutField::layout(&self.#layout_name));
    let kind = fields.iter().find(|field| matches!(field.role, Role::Kind)).map_or_else(|| quote!(__KIND), |field| {
        let name = field.ident;
        quote!(self.#name)
    });
    if attrs.text.is_some() {
        let text = fields
            .iter()
            .find(|field| matches!(field.role, Role::Text))
            .ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `#[text]` field"))?
            .ident;
        return Ok(writer(quote!(::sittir_core::arena::leaf_cell(__sink, #kind, &self.#text, #layout_of))));
    }
    let captures: Vec<&Ident> = if attrs.interior.is_some() { capture_fields(fields)?.into_iter().map(|(field, _)| field.ident).collect() } else { Vec::new() };
    let mut writes = Vec::new();
    let mut settings = Vec::new();
    let mut slot_words = Vec::new();
    for field in fields {
        let name = field.ident;
        match &field.role {
            Role::Slot(slot) => {
                writes.push(slot_write(field, slot, captures.contains(&name))?);
                if let (Some(key), Some(word)) = (&field.key, slot.cell.word) {
                    slot_words.push(quote!(#key => ::core::option::Option::Some(#word),));
                }
            }
            Role::Flank(_) => settings.push(quote!(__side.delimiter = self.#name;)),
            Role::SeparatorKind(_) => settings.push(quote!(__side.separator_kind = self.#name;)),
            Role::Space(space) => {
                let (slot, side) = (space.slot, if space.before { quote!(space_before) } else { quote!(space_after) });
                settings.push(quote! {
                    if let ::core::option::Option::Some(space) = self.#name {
                        __side.slot_mut(#slot).#side = ::core::option::Option::Some(space);
                    }
                });
            }
            Role::Layout | Role::Text | Role::Kind => {}
        }
    }
    let bind = |used: bool, name: TokenStream| if used { name } else { quote!(_) };
    let sink = bind(!writes.is_empty(), quote!(__sink));
    let cells = bind(!writes.is_empty(), quote!(__words));
    let side = bind(!settings.is_empty(), quote!(__side));
    Ok(writer(quote! {
            ::sittir_core::arena::write_record(
                __sink,
                #kind,
                #words,
                #layout_of,
                |key: &str| match key {
                    #(#slot_words)*
                    _ => ::core::option::Option::None,
                },
                |#sink, #cells, #side| {
                    #(#writes)*
                    #(#settings)*
                    ::core::result::Result::Ok(())
                },
            )
    }))
}

/// A choice's record writer: the cell of the variant it holds. A variant
/// with a payload writes the payload's cell; a unit arm, edged or not, its
/// first kind; a blank arm the blank kind.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    let mut arms = Vec::new();
    let mut bounds = Vec::new();
    for variant in variants {
        let name = variant.name;
        let unit = |kind: TokenStream| quote!(::sittir_core::arena::CellWord::unit(#kind));
        let write = match (variant.payload, &variant.first) {
            _ if variant.blank => {
                let cell = unit(quote!(::sittir_core::types::KindId::BLANK));
                quote!(Self::#name => #cell,)
            }
            (Some(payload), _) => {
                bounds.push(quote!(#payload: ::sittir_core::arena::WriteCell<__T>,));
                quote!(Self::#name(payload) => ::sittir_core::arena::WriteCell::<__T>::write_cell(payload, __sink),)
            }
            (None, Some(first)) => {
                let cell = unit(quote!(#first));
                let pattern = if variant.edged {
                    quote!(Self::#name(_))
                } else {
                    quote!(Self::#name)
                };
                quote!(#pattern => #cell,)
            }
            (None, None) => return Err(syn::Error::new_spanned(name, format!("`{name}` is a unit arm that names no kind to write: `#[kind(…)]`"))),
        };
        arms.push(write);
    }
    Ok(gated(&quote! {
        impl<__T: ::core::clone::Clone> ::sittir_core::arena::WriteCell<__T> for #ident
        where
            #(#bounds)*
        {
            fn write_cell(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, __T>) -> ::core::result::Result<::sittir_core::arena::CellWord, ::sittir_core::arena::ArenaError> {
                match self {
                    #(#arms)*
                }
            }
        }
    }))
}

/// An enum kind's record writer: a member is a unit, written as its kind.
pub fn members(ident: &Ident) -> TokenStream {
    gated(&quote! {
        impl<__T: ::core::clone::Clone> ::sittir_core::arena::WriteCell<__T> for #ident {
            fn write_cell(&self, _: &mut ::sittir_core::arena::RecordSink<'_, __T>) -> ::core::result::Result<::sittir_core::arena::CellWord, ::sittir_core::arena::ArenaError> {
                ::sittir_core::arena::CellWord::unit(__id(self))
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use syn::parse_quote;

    fn expand(input: &syn::DeriveInput) -> syn::Result<String> {
        crate::expand::derive(input).map(|out| out.to_string().split_whitespace().collect())
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn a_struct_writes_each_stamped_slot_at_its_word_and_its_settings_to_its_side_record() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::BLOCK, item = statements, words = 7, built_words = 5)]
            pub struct BlockNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_async")]
                #[slot(presence = kind::ASYNC, word = 2, bit = 3)]
                pub r#async: bool,
                #[wire(key = "_label")]
                #[slot(field = field::LABEL, word = 3, width = 3, forms = 1, built = 3)]
                pub label: Option<SlotValue<LabelNode>>,
                #[wire(key = "_statements")]
                #[slot(field = field::STATEMENTS, word = 6, width = 1, run = 3, forms = 1, built = 4)]
                pub statements: Vec<SlotValue<StatementNode>>,
                #[wire(key = "_delimiter")]
                #[flank(trailing = 0)]
                pub delimiter: Option<Delimiter>,
                #[wire(key = "_statements_separator_space")]
                #[space(slot = 6, side = after, site = options::SITE_X)]
                pub statements_separator_space: Option<KindId>,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::records_codec! { impl ::sittir_core::arena::WriteCell<<Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia> for BlockNode"));
        assert!(has(&out, "__words[2usize] |= u32::from(self.r#async) << 3u32;"));
        assert!(has(&out, r#"__words[3usize] = ::sittir_core::arena::write_slot(__sink, &self.label, "_label")?.0;"#));
        assert!(has(&out, r#"__words[4usize] = ::sittir_core::arena::write_list(__sink, self.statements.iter(), "_statements")?.0;"#));
        assert!(has(&out, "__side.delimiter = self.delimiter;"));
        assert!(has(&out, "__side.slot_mut(6u32).space_after = ::core::option::Option::Some(space);"));
        assert!(has(&out, r#""_label" => ::core::option::Option::Some(3u32), "_statements" => ::core::option::Option::Some(6u32),"#));
        assert!(has(&out, "::sittir_core::arena::write_record(__sink, __KIND, 5u32,"));
    }

    #[test]
    fn a_text_leaf_writes_a_leaf_cell() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text, words = 2, built_words = 2)]
            pub struct IdentifierNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::arena::leaf_cell(__sink, __KIND, &self.text, ::sittir_core::arena::LayoutField::layout(&self.layout))"));
        assert!(!has(&out, "write_record"));
    }

    #[test]
    fn a_token_interior_writes_each_capture_as_a_captured_string_at_its_built_word() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::DECIMAL, interior = "(?<whole>[0-9]+)(?<suffix>[a-z]+)?", words = 6, built_words = 4)]
            pub struct DecimalNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_whole")]
                #[slot(capture = "whole", word = 2, width = 2, forms = 4, built = 2)]
                pub whole: String,
                #[wire(key = "_suffix")]
                #[slot(capture = "suffix", word = 4, width = 2, forms = 4, built = 3)]
                pub suffix: Option<String>,
            }
        })
        .expect("expands");
        assert!(has(&out, "__words[2usize] = (::sittir_core::arena::captured_cell(__sink, &self.whole)?).0;"));
        assert!(has(&out, "::core::option::Option::Some(text) => ::sittir_core::arena::captured_cell(__sink, text)?,"));
        assert!(has(&out, "::core::option::Option::None => ::sittir_core::arena::CellWord(0),"));
    }

    #[test]
    fn a_struct_with_no_record_writes_none() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::PAIR)]
            pub struct PairNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_key")]
                #[slot(field = field::KEY)]
                pub key: SlotValue<KeyNode>,
            }
        })
        .expect("expands");
        assert!(!has(&out, "WriteCell"));
    }

    #[test]
    fn a_choice_writes_its_payload_s_cell_or_its_unit_arm_s_kind() {
        let out = expand(&parse_quote! {
            #[node(choice)]
            pub enum PatternNode {
                #[kind(kind::IDENTIFIER)]
                Identifier(IdentifierNode),
                #[kind(kind::TUPLE_PATTERN)]
                TuplePattern(Box<TuplePatternNode>),
                #[kind(kind::WILDCARD, kind::OTHER)]
                #[node(edged)]
                Wildcard(::sittir_core::options::Edges),
                #[kind(kind::SELF)]
                SelfArm,
                #[node(blank)]
                Blank,
                #[node(verbatim)]
                Verbatim(VerbatimNode),
            }
        })
        .expect("expands");
        assert!(has(&out, "impl<__T: ::core::clone::Clone> ::sittir_core::arena::WriteCell<__T> for PatternNode where IdentifierNode: ::sittir_core::arena::WriteCell<__T>, Box<TuplePatternNode>: ::sittir_core::arena::WriteCell<__T>, VerbatimNode: ::sittir_core::arena::WriteCell<__T>,"));
        assert!(has(&out, "Self::Identifier(payload) => ::sittir_core::arena::WriteCell::<__T>::write_cell(payload, __sink),"));
        assert!(has(&out, "Self::Wildcard(_) => ::sittir_core::arena::CellWord::unit(kind::WILDCARD),"));
        assert!(has(&out, "Self::SelfArm => ::sittir_core::arena::CellWord::unit(kind::SELF),"));
        assert!(has(&out, "Self::Blank => ::sittir_core::arena::CellWord::unit(::sittir_core::types::KindId::BLANK),"));
    }

    #[test]
    fn an_enum_kind_writes_its_member_as_a_unit() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::OPERATOR)]
            pub enum OperatorNode {
                #[kind(kind::PLUS)]
                Plus,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::arena::CellWord::unit(__id(self))"));
    }
}

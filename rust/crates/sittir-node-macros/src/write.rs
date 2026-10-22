//! A node type's record writer, `sittir_core::arena::WriteCell`: the cell
//! that names the node in its holder's record, after the node's own record
//! and its children's. Every item sits inside `::sittir_core::records_codec!`,
//! which keeps it only when `sittir-core` is built with the arena.
//!
//! A struct writes its record from its stamps alone: a presence sets its bit,
//! a slot writes its cell at its word, a list its run of `run`-word cells, a
//! capture its span or its text, and a print setting goes to the side record.
//! A text leaf writes a leaf cell and no record of cells. A choice writes the
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

/// The statement writing `field`'s cell, by its stamp. `capture` is the
/// field's index among the node's captures, for a capture slot.
fn slot_write(field: &Field<'_>, slot: &SlotAttrs, capture: Option<usize>, layout_of: &TokenStream) -> syn::Result<TokenStream> {
    let name = field.ident;
    let word = slot.cell.word.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its record cell (`word = …`)")))?;
    let at = word as usize;
    if let Some(bit) = slot.cell.bit {
        return Ok(quote!(__words[#at] |= u32::from(self.#name) << #bit;));
    }
    let width = slot.cell.width.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its cell's `width`")))?;
    let end = at + width as usize;
    let key = field.key.as_ref().ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its wire key")))?;
    if let Some(run) = slot.cell.run {
        return Ok(quote!(::sittir_core::arena::write_list(__sink, #run, self.#name.iter(), #layout_of, #key)?.encode(&mut __words[#at..#end])?;));
    }
    let Some(capture) = capture else {
          if slot.cell.inline.is_some() {
              return Ok(quote!(::sittir_core::arena::write_inline_slot(__sink, &self.#name, #layout_of, #key, #word, &mut __words[#at..#end])?;));
          }
        return Ok(quote!(::sittir_core::arena::write_slot(__sink, &self.#name, #layout_of, #key)?.encode(&mut __words[#at..#end])?;));
    };
    let span = quote!(__spans.get(#capture).copied().flatten());
    let cell = if inner_of(field.ty, "Option").is_some() {
        quote! {
            match &self.#name {
                ::core::option::Option::Some(text) => ::sittir_core::arena::captured_cell(__sink, text, #span)?,
                ::core::option::Option::None => ::sittir_core::arena::Cell::Absent,
            }
        }
    } else {
        quote!(::sittir_core::arena::captured_cell(__sink, &self.#name, #span)?)
    };
    Ok(quote!((#cell).encode(&mut __words[#at..#end])?;))
}

/// A struct's record writer; none for a struct with no stamped record.
pub fn structure(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let Some(words) = attrs.words else { return Ok(TokenStream::new()) };
    let layout = fields
        .iter()
        .find(|field| matches!(field.role, Role::Layout))
        .ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}` has a record, so it has a `#[layout]` field")))?;
    let (layout_name, layout_ty) = (layout.ident, layout.ty);
    let trivia = quote!(<#layout_ty as ::sittir_core::arena::LayoutField>::Trivia);
    let writer = |body: TokenStream, hydrate: TokenStream| {
        gated(&quote! {
            impl ::sittir_core::arena::WriteCell<#trivia> for #ident {
                fn write_cell(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, #trivia>) -> ::core::result::Result<::sittir_core::arena::Cell, ::sittir_core::arena::ArenaError> {
                    #body
                }
                #hydrate
            }
        })
    };
    let layout_of = quote!(::sittir_core::arena::LayoutField::layout(&self.#layout_name));
    if attrs.text.is_some() {
        let text = fields
            .iter()
            .find(|field| matches!(field.role, Role::Text))
            .ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `#[text]` field"))?
            .ident;
        return Ok(writer(
            quote!(::sittir_core::arena::leaf_cell(__sink, __KIND, &self.#text, #layout_of)),
            TokenStream::new(),
        ));
    }
    let captures: Vec<&Ident> = if attrs.interior.is_some() { capture_fields(fields)?.into_iter().map(|(field, _)| field.ident).collect() } else { Vec::new() };
    let mut writes = Vec::new();
    let mut hydrates = Vec::new();
    let mut settings = Vec::new();
    let mut slot_words = Vec::new();
    for field in fields {
        let name = field.ident;
        match &field.role {
            Role::Slot(slot) => {
                let capture = captures.iter().position(|capture| *capture == name);
                writes.push(slot_write(field, slot, capture, &layout_of)?);
                if slot.cell.bit.is_none() && capture.is_none() {
                    let hydrate = |value: TokenStream| quote!(::sittir_core::arena::WriteCell::hydrate_records(#value, __sink)?;);
                    hydrates.push(if slot.cell.run.is_some() {
                        let item = hydrate(quote!(__item));
                        quote!(for __item in self.#name.iter() { #item })
                    } else {
                        hydrate(quote!(&self.#name))
                    });
                }
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
            Role::Layout | Role::Text => {}
        }
    }
    let spans = (!captures.is_empty()).then(|| {
        let count = captures.len();
        quote!(let __spans = ::sittir_core::arena::capture_spans(#layout_of, #count)?;)
    });
    let bind = |used: bool, name: TokenStream| if used { name } else { quote!(_) };
    let sink = bind(!writes.is_empty(), quote!(__sink));
    let cells = bind(!writes.is_empty(), quote!(__words));
    let side = bind(!settings.is_empty(), quote!(__side));
    Ok(writer(quote! {
            #spans
            ::sittir_core::arena::write_record(
                __sink,
                __KIND,
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
    }, quote! {
        fn hydrate_records(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, #trivia>) -> ::core::result::Result<(), ::sittir_core::arena::ArenaError> {
            __sink.hydrate_record(#layout_of, |__sink| ::sittir_core::arena::WriteCell::write_cell(self, __sink), |__sink| {
                #(#hydrates)*
                ::core::result::Result::Ok(())
            })
        }
    }))
}

/// A choice's record writer: the cell of the variant it holds. A variant
/// with a payload writes the payload's cell; a unit arm, edged or not, its
/// first kind; a blank arm the blank kind.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    let mut arms = Vec::new();
    let mut hydrates = Vec::new();
    let mut bounds = Vec::new();
    for variant in variants {
        let name = variant.name;
        let unit = |kind: TokenStream| quote!(::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: #kind, row: ::core::option::Option::None }));
        let (write, hydrate) = match (variant.payload, &variant.first) {
            _ if variant.blank => {
                let cell = unit(quote!(::sittir_core::types::KindId::BLANK));
                (
                    quote!(Self::#name => #cell,),
                    quote!(Self::#name => ::core::result::Result::Ok(()),),
                )
            }
            (Some(payload), _) => {
                bounds.push(quote!(#payload: ::sittir_core::arena::WriteCell<__T>,));
                (
                    quote!(Self::#name(payload) => ::sittir_core::arena::WriteCell::<__T>::write_cell(payload, __sink),),
                    quote!(Self::#name(payload) => ::sittir_core::arena::WriteCell::<__T>::hydrate_records(payload, __sink),),
                )
            }
            (None, Some(first)) => {
                let cell = unit(quote!(#first));
                let pattern = if variant.edged {
                    quote!(Self::#name(_))
                } else {
                    quote!(Self::#name)
                };
                (
                    quote!(#pattern => #cell,),
                    quote!(#pattern => ::core::result::Result::Ok(()),),
                )
            }
            (None, None) => return Err(syn::Error::new_spanned(name, format!("`{name}` is a unit arm that names no kind to write: `#[kind(…)]`"))),
        };
        arms.push(write);
        hydrates.push(hydrate);
    }
    Ok(gated(&quote! {
        impl<__T: ::core::clone::Clone> ::sittir_core::arena::WriteCell<__T> for #ident
        where
            #(#bounds)*
        {
            fn write_cell(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, __T>) -> ::core::result::Result<::sittir_core::arena::Cell, ::sittir_core::arena::ArenaError> {
                match self {
                    #(#arms)*
                }
            }
            fn hydrate_records(&self, __sink: &mut ::sittir_core::arena::RecordSink<'_, __T>) -> ::core::result::Result<(), ::sittir_core::arena::ArenaError> {
                match self { #(#hydrates)* }
            }
        }
    }))
}

/// An enum kind's record writer: a member is a unit, written as its kind.
pub fn members(ident: &Ident) -> TokenStream {
    gated(&quote! {
        impl<__T: ::core::clone::Clone> ::sittir_core::arena::WriteCell<__T> for #ident {
            fn write_cell(&self, _: &mut ::sittir_core::arena::RecordSink<'_, __T>) -> ::core::result::Result<::sittir_core::arena::Cell, ::sittir_core::arena::ArenaError> {
                ::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: __id(self), row: ::core::option::Option::None })
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
            #[node(kind = kind::BLOCK, item = statements, words = 12)]
            pub struct BlockNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_async")]
                #[slot(presence = kind::ASYNC, word = 2, bit = 3)]
                pub r#async: bool,
                #[wire(key = "_label")]
                #[slot(field = field::LABEL, word = 3, width = 5)]
                pub label: Option<SlotValue<LabelNode>>,
                #[wire(key = "_statements")]
                #[slot(field = field::STATEMENTS, word = 8, width = 2, run = 5)]
                pub statements: Vec<SlotValue<StatementNode>>,
                #[wire(key = "_delimiter")]
                #[flank(trailing = 0)]
                pub delimiter: Option<Delimiter>,
                #[wire(key = "_statements_separator_space")]
                #[space(slot = 8, side = after, site = options::SITE_X)]
                pub statements_separator_space: Option<KindId>,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::records_codec! { impl ::sittir_core::arena::WriteCell<<Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia> for BlockNode"));
        assert!(has(&out, "__words[2usize] |= u32::from(self.r#async) << 3u32;"));
        let layout = "::sittir_core::arena::LayoutField::layout(&self.layout)";
        assert!(has(&out, &format!(r#"::sittir_core::arena::write_slot(__sink, &self.label, {layout}, "_label")?.encode(&mut __words[3usize..8usize])?;"#)));
        assert!(has(&out, &format!(r#"::sittir_core::arena::write_list(__sink, 5u32, self.statements.iter(), {layout}, "_statements")?.encode(&mut __words[8usize..10usize])?;"#)));
        assert!(has(&out, "__side.delimiter = self.delimiter;"));
        assert!(has(&out, "__side.slot_mut(8u32).space_after = ::core::option::Option::Some(space);"));
        assert!(has(&out, r#""_label" => ::core::option::Option::Some(3u32), "_statements" => ::core::option::Option::Some(8u32),"#));
        assert!(has(&out, "::sittir_core::arena::write_record(__sink, __KIND, 12u32,"));
    }

    #[test]
    fn a_text_leaf_writes_a_leaf_cell() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text, words = 2)]
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
    fn a_token_interior_writes_each_capture_from_its_span_at_its_capture_index() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::DECIMAL, interior = "(?<whole>[0-9]+)(?<suffix>[a-z]+)?", words = 10)]
            pub struct DecimalNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_whole")]
                #[slot(capture = "whole", word = 2, width = 4)]
                pub whole: String,
                #[wire(key = "_suffix")]
                #[slot(capture = "suffix", word = 6, width = 4)]
                pub suffix: Option<String>,
            }
        })
        .expect("expands");
        assert!(has(&out, "let __spans = ::sittir_core::arena::capture_spans(::sittir_core::arena::LayoutField::layout(&self.layout), 2usize)?;"));
        assert!(has(&out, "(::sittir_core::arena::captured_cell(__sink, &self.whole, __spans.get(0usize).copied().flatten())?).encode(&mut __words[2usize..6usize])?;"));
        assert!(has(&out, "::core::option::Option::Some(text) => ::sittir_core::arena::captured_cell(__sink, text, __spans.get(1usize).copied().flatten())?,"));
        assert!(has(&out, "::core::option::Option::None => ::sittir_core::arena::Cell::Absent,"));
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
        assert!(has(&out, "Self::Wildcard(_) => ::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: kind::WILDCARD, row: ::core::option::Option::None }),"));
        assert!(has(&out, "Self::SelfArm => ::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: kind::SELF, row: ::core::option::Option::None }),"));
        assert!(has(&out, "Self::Blank => ::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: ::sittir_core::types::KindId::BLANK, row: ::core::option::Option::None }),"));
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
        assert!(has(&out, "::core::result::Result::Ok(::sittir_core::arena::Cell::Unit { kind: __id(self), row: ::core::option::Option::None })"));
    }
}

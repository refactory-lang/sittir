//! `#[record(…)]`: the record layout codegen stamps on a transport struct and
//! its fields. The derive checks it and computes none of it: the stamped cells
//! stay inside the record's words and never overlap, and each field's type
//! fits its cell (`sittir_core::record`), asserted at compile time.

use proc_macro2::TokenStream;
use quote::quote;
use syn::{Attribute, DataStruct, Fields, Ident, LitInt};

/// A field's stamp: a cell of `width` words at `word`, with `run` words an
/// item for a list, or one presence `bit` in the presence word `word`.
#[derive(Default)]
struct Stamp {
    words: Option<u32>,
    word: Option<u32>,
    width: Option<u32>,
    run: Option<u32>,
    bit: Option<u32>,
}

fn stamp(attrs: &[Attribute]) -> syn::Result<Option<(Stamp, &Attribute)>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("record")) else { return Ok(None) };
    let mut out = Stamp::default();
    attr.parse_nested_meta(|meta| {
        let value: u32 = meta.value()?.parse::<LitInt>()?.base10_parse()?;
        let slot = match meta.path.get_ident().map(Ident::to_string).as_deref() {
            Some("words") => &mut out.words,
            Some("word") => &mut out.word,
            Some("width") => &mut out.width,
            Some("run") => &mut out.run,
            Some("bit") => &mut out.bit,
            _ => return Err(meta.error("`record` takes `words`, `word`, `width`, `run` or `bit`")),
        };
        *slot = Some(value);
        Ok(())
    })?;
    Ok(Some((out, attr)))
}

/// What a checked field occupies: words `[start, end)`, or one bit of a word.
enum Place {
    Cell { start: u32, end: u32 },
    Bit { word: u32, bit: u32 },
}

impl Place {
    fn meets(&self, other: &Place) -> bool {
        match (self, other) {
            (Place::Cell { start, end }, Place::Cell { start: s, end: e }) => start < e && s < end,
            (Place::Cell { start, end }, Place::Bit { word, .. }) | (Place::Bit { word, .. }, Place::Cell { start, end }) => start <= word && word < end,
            (Place::Bit { word, bit }, Place::Bit { word: w, bit: b }) => word == w && bit == b,
        }
    }
}

pub fn checks(owner: &Ident, attrs: &[Attribute], data: &DataStruct) -> syn::Result<TokenStream> {
    let Fields::Named(named) = &data.fields else { return Ok(TokenStream::new()) };
    let words = stamp(attrs)?.and_then(|(stamp, _)| stamp.words);
    let mut placed: Vec<(&Ident, Place)> = Vec::new();
    let mut asserts = Vec::new();
    for field in &named.named {
        let Some((stamp, attr)) = stamp(&field.attrs)? else { continue };
        let ident = field.ident.as_ref().expect("a named field");
        let ty = &field.ty;
        let Some(words) = words else {
            return Err(syn::Error::new_spanned(attr, format!("`{ident}` has a record cell, so `{owner}` states its words: `#[record(words = …)]`")));
        };
        let word = stamp.word.ok_or_else(|| syn::Error::new_spanned(attr, format!("`{ident}`'s record cell states its `word`")))?;
        let place = match (stamp.bit, stamp.width) {
            (Some(bit), None) if bit < 32 => {
                let message = format!("{owner}.{ident}: a stamped bit holds only a presence");
                asserts.push(quote!(const _: () = assert!(::sittir_core::record::fits_bit::<#ty>(), #message);));
                Place::Bit { word, bit }
            }
            (None, Some(width)) => {
                let run = stamp.run.unwrap_or(0);
                let message = format!("{owner}.{ident}: its type needs more than its stamped record cell");
                asserts.push(quote!(const _: () = assert!(::sittir_core::record::fits_cell::<#ty>(#width, #run), #message);));
                Place::Cell { start: word, end: word + width }
            }
            _ => return Err(syn::Error::new_spanned(attr, format!("`{ident}` is stamped a `width` or a `bit` below 32, not both"))),
        };
        let last = match place {
            Place::Cell { end, .. } => end,
            Place::Bit { word, .. } => word + 1,
        };
        if last > words {
            return Err(syn::Error::new_spanned(attr, format!("`{ident}` ends at word {last}, past `{owner}`'s {words} words")));
        }
        if let Some((other, _)) = placed.iter().find(|(_, earlier)| earlier.meets(&place)) {
            return Err(syn::Error::new_spanned(attr, format!("`{ident}`'s record cell overlaps `{other}`'s")));
        }
        placed.push((ident, place));
    }
    Ok(quote!(#(#asserts)*))
}

#[cfg(test)]
mod tests {
    use syn::{parse_quote, Data, DeriveInput};

    fn checks(input: DeriveInput) -> syn::Result<String> {
        let Data::Struct(data) = &input.data else { panic!("a struct") };
        super::checks(&input.ident, &input.attrs, data).map(|out| out.to_string().split_whitespace().collect())
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn each_stamped_field_asserts_its_type_fits_its_cell() {
        let out = checks(parse_quote! {
            #[record(words = 10)]
            pub struct LetDeclarationTransport {
                pub layout: Option<Box<TransportLayout>>,
                #[record(word = 2, bit = 0)]
                pub mutable: bool,
                #[record(word = 3, width = 5)]
                pub pattern: SlotValue<PatternTransport>,
                #[record(word = 8, width = 2, run = 5)]
                pub items: Vec<SlotValue<ItemTransport>>,
            }
        })
        .expect("checks");
        assert!(has(&out, r#"assert!(::sittir_core::record::fits_bit::<bool>(), "LetDeclarationTransport.mutable: a stamped bit holds only a presence")"#));
        assert!(has(&out, r#"assert!(::sittir_core::record::fits_cell::<SlotValue<PatternTransport>>(5u32, 0u32), "LetDeclarationTransport.pattern: its type needs more than its stamped record cell")"#));
        assert!(has(&out, r#"::sittir_core::record::fits_cell::<Vec<SlotValue<ItemTransport>>>(2u32, 5u32)"#));
    }

    #[test]
    fn a_struct_with_no_record_attribute_checks_nothing() {
        let out = checks(parse_quote! {
            pub struct IdentifierTransport {
                pub text: String,
            }
        })
        .expect("checks");
        assert!(out.is_empty());
    }

    fn refusal(input: DeriveInput) -> String {
        checks(input).expect_err("refused").to_string()
    }

    #[test]
    fn two_cells_sharing_a_word_are_refused_naming_the_later_field() {
        let message = refusal(parse_quote! {
            #[record(words = 10)]
            pub struct S {
                #[record(word = 2, width = 5)]
                pub a: SlotValue<A>,
                #[record(word = 6, width = 4)]
                pub b: String,
            }
        });
        assert!(message.contains("`b`") && message.contains("`a`"), "{message}");
    }

    #[test]
    fn a_cell_past_the_record_s_words_is_refused() {
        let message = refusal(parse_quote! {
            #[record(words = 6)]
            pub struct S {
                #[record(word = 2, width = 5)]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("`a`") && message.contains("6"), "{message}");
    }

    #[test]
    fn a_bit_shared_or_inside_a_cell_is_refused() {
        let shared = refusal(parse_quote! {
            #[record(words = 4)]
            pub struct S {
                #[record(word = 2, bit = 3)]
                pub a: bool,
                #[record(word = 2, bit = 3)]
                pub b: bool,
            }
        });
        assert!(shared.contains("`b`"), "{shared}");
        let inside = refusal(parse_quote! {
            #[record(words = 8)]
            pub struct S {
                #[record(word = 2, width = 5)]
                pub a: SlotValue<A>,
                #[record(word = 3, bit = 0)]
                pub b: bool,
            }
        });
        assert!(inside.contains("`b`"), "{inside}");
    }

    #[test]
    fn a_stamped_field_needs_the_struct_s_words() {
        let message = refusal(parse_quote! {
            pub struct S {
                #[record(word = 2, width = 5)]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("words"), "{message}");
    }
}

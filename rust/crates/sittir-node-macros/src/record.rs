//! The record layout codegen stamps on a node: `words` on
//! `#[node(…)]`, and `word` with `width` (and `run`) or `bit` on each
//! slot's `#[slot(…)]`, beside the slot's read facts. The derive checks it and
//! computes none of it: the stamped cells stay inside the record's words and
//! never overlap, and each slot's type fits its cell (`sittir_core::record`),
//! asserted at compile time.

use crate::attrs::CellStamp;
use proc_macro2::TokenStream;
use quote::quote;
use syn::{Ident, Type};

/// What a checked slot occupies: words `[start, end)`, or one bit of a word.
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

/// The checks for `owner`'s stamped slots: each slot with a stamp, its type
/// and the stamp, against the struct's `words`.
pub fn checks(owner: &Ident, words: Option<u32>, slots: &[(&Ident, &Type, &CellStamp)]) -> syn::Result<TokenStream> {
    let mut placed: Vec<(&Ident, Place)> = Vec::new();
    let mut asserts = Vec::new();
    if let Some(words) = words {
        let message = format!("{owner}: its record must hold its header");
        asserts.push(quote!(const _: () = assert!(#words >= ::sittir_core::record::HEADER_WORDS, #message);));
    }
    for &(ident, ty, stamp) in slots {
        let Some(word) = stamp.word else {
            if words.is_some() || stamp.width.is_some() || stamp.run.is_some() || stamp.bit.is_some() {
                return Err(syn::Error::new_spanned(ident, format!("`{ident}`'s record cell states its `word`")));
            }
            continue;
        };
        let Some(words) = words else {
            return Err(syn::Error::new_spanned(ident, format!("`{ident}` has a record cell, so `{owner}` states its words: `#[node(words = …)]`")));
        };
        let message = format!("{owner}.{ident}: its record cell overlaps the header");
        asserts.push(quote!(const _: () = assert!(#word >= ::sittir_core::record::HEADER_WORDS, #message);));
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
                Place::Cell { start: word, end: end_word(ident, word, width)? }
            }
            _ => return Err(syn::Error::new_spanned(ident, format!("`{ident}` is stamped a `width` or a `bit` below 32, not both"))),
        };
        let last = match place {
            Place::Cell { end, .. } => end,
            Place::Bit { word, .. } => end_word(ident, word, 1)?,
        };
        if last > words {
            return Err(syn::Error::new_spanned(ident, format!("`{ident}` ends at word {last}, past `{owner}`'s {words} words")));
        }
        if let Some((other, _)) = placed.iter().find(|(_, earlier)| earlier.meets(&place)) {
            return Err(syn::Error::new_spanned(ident, format!("`{ident}`'s record cell overlaps `{other}`'s")));
        }
        placed.push((ident, place));
    }
    Ok(quote!(#(#asserts)*))
}

fn end_word(ident: &Ident, word: u32, width: u32) -> syn::Result<u32> {
    word.checked_add(width).ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}`'s record cell end overflows its word index")))
}

#[cfg(test)]
mod tests {
    use syn::{parse_quote, Data, DeriveInput, Fields};

    fn checks(input: DeriveInput) -> syn::Result<String> {
        let Data::Struct(data) = &input.data else { panic!("a struct") };
        let Fields::Named(named) = &data.fields else { panic!("named fields") };
        let words = crate::attrs::kind_attrs(&input.attrs)?.words;
        let slots = named
            .named
            .iter()
            .map(|field| Ok(crate::attrs::slot_attrs(&field.attrs)?.map(|slot| (field.ident.clone().expect("named"), field.ty.clone(), slot.cell))))
            .collect::<syn::Result<Vec<_>>>()?;
        let stamped: Vec<_> = slots.iter().flatten().map(|(ident, ty, cell)| (ident, ty, cell)).collect();
        super::checks(&input.ident, words, &stamped).map(|out| out.to_string().split_whitespace().collect())
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn each_stamped_field_asserts_its_type_fits_its_cell() {
        let out = checks(parse_quote! {
            #[node(words = 10)]
            pub struct LetDeclarationNode {
                pub layout: Option<Box<NodeLayout>>,
                #[slot(word = 2, bit = 0)]
                pub mutable: bool,
                #[slot(word = 3, width = 5)]
                pub pattern: SlotValue<PatternNode>,
                #[slot(word = 8, width = 2, run = 5)]
                pub items: Vec<SlotValue<ItemNode>>,
            }
        })
        .expect("checks");
        assert!(has(&out, r#"assert!(::sittir_core::record::fits_bit::<bool>(), "LetDeclarationNode.mutable: a stamped bit holds only a presence")"#));
        assert!(has(&out, r#"assert!(::sittir_core::record::fits_cell::<SlotValue<PatternNode>>(5u32, 0u32), "LetDeclarationNode.pattern: its type needs more than its stamped record cell")"#));
        assert!(has(&out, r#"::sittir_core::record::fits_cell::<Vec<SlotValue<ItemNode>>>(2u32, 5u32)"#));
    }

    #[test]
    fn a_struct_with_no_record_attribute_checks_nothing() {
        let out = checks(parse_quote! {
            pub struct IdentifierNode {
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
            #[node(words = 10)]
            pub struct S {
                #[slot(word = 2, width = 5)]
                pub a: SlotValue<A>,
                #[slot(word = 6, width = 4)]
                pub b: String,
            }
        });
        assert!(message.contains("`b`") && message.contains("`a`"), "{message}");
    }

    #[test]
    fn a_cell_past_the_record_s_words_is_refused() {
        let message = refusal(parse_quote! {
            #[node(words = 6)]
            pub struct S {
                #[slot(word = 2, width = 5)]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("`a`") && message.contains("6"), "{message}");
    }

    #[test]
    fn a_bit_shared_or_inside_a_cell_is_refused() {
        let shared = refusal(parse_quote! {
            #[node(words = 4)]
            pub struct S {
                #[slot(word = 2, bit = 3)]
                pub a: bool,
                #[slot(word = 2, bit = 3)]
                pub b: bool,
            }
        });
        assert!(shared.contains("`b`"), "{shared}");
        let inside = refusal(parse_quote! {
            #[node(words = 8)]
            pub struct S {
                #[slot(word = 2, width = 5)]
                pub a: SlotValue<A>,
                #[slot(word = 3, bit = 0)]
                pub b: bool,
            }
        });
        assert!(inside.contains("`b`"), "{inside}");
    }

    #[test]
    fn a_stamped_field_needs_the_struct_s_words() {
        let message = refusal(parse_quote! {
            pub struct S {
                #[slot(word = 2, width = 5)]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("words"), "{message}");
    }

    #[test]
    fn cell_end_overflow_is_refused_naming_the_field() {
        let message = refusal(parse_quote! {
            #[node(words = 10)]
            pub struct S {
                #[slot(word = 4294967295, width = 5)]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("`a`") && message.contains("overflow"), "{message}");
    }

    #[test]
    fn presence_end_overflow_is_refused_naming_the_field() {
        let message = refusal(parse_quote! {
            #[node(words = 10)]
            pub struct S {
                #[slot(word = 4294967295, bit = 0)]
                pub a: bool,
            }
        });
        assert!(message.contains("`a`") && message.contains("overflow"), "{message}");
    }

    #[test]
    fn a_record_slot_cannot_omit_its_stamp() {
        let message = refusal(parse_quote! {
            #[node(words = 7)]
            pub struct S {
                #[slot]
                pub a: SlotValue<A>,
            }
        });
        assert!(message.contains("`a`") && message.contains("word"), "{message}");
    }

    #[test]
    fn legacy_slots_without_record_attributes_remain_valid() {
        let out = checks(parse_quote! {
            pub struct S {
                #[slot]
                pub a: SlotValue<A>,
            }
        })
        .expect("legacy slot");
        assert!(out.is_empty());
    }
}

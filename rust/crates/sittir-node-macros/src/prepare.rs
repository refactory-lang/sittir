//! A struct's prepare trait: a handle for each place its prepare body writes,
//! known by the place's stamp, and the parts struct that hands every handle
//! out at once, so a body borrows each place apart from the others. One
//! body prepares the struct, whose handles borrow its fields, and a record,
//! whose handles write the render's prepared overlay.

use crate::attrs::SlotAttrs;
use crate::expand::{inner_of, Field, Role};
use crate::fields::camel;
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::Ident;

/// The bound a slot's handle meets: every slot is prepared and has its gaps
/// filled; a single slot also names the arm an edge beside it reads and, when
/// stamped `defaulted`, takes its option site's unit; a slot stamped `seated`
/// has its gaps filled from its seat table. Presence and capture slots are no
/// place.
fn slot_bound(field: &Field<'_>, slot: &SlotAttrs) -> syn::Result<Option<TokenStream>> {
    let ident = field.ident;
    if slot.cell.bit.is_some() || slot.capture.is_some() {
        if slot.seated || slot.defaulted {
            return Err(syn::Error::new_spanned(ident, format!("`{ident}` is a presence or a capture, which prepare neither seats nor defaults")));
        }
        return Ok(None);
    }
    if slot.cell.word.is_none() {
        return Err(syn::Error::new_spanned(ident, format!("`{ident}` is a prepared slot without its record cell (`word = …`)")));
    }
    let list = slot.cell.run.is_some();
    if list && slot.defaulted {
        return Err(syn::Error::new_spanned(ident, format!("`{ident}` is a list, which no option site defaults")));
    }
    let mut bound = quote!(::sittir_core::prepare::SlotTarget<Self::Overlay>);
    if !list {
        bound.extend(quote!(+ ::sittir_core::prepare::ArmOf<Self::Overlay>));
    }
    if slot.defaulted {
        bound.extend(quote!(+ ::sittir_core::prepare::UnitSlot<Self::Overlay>));
    }
    if slot.seated {
        bound.extend(quote!(+ ::sittir_core::prepare::SeatSlot<Self::Overlay>));
    }
    Ok(Some(bound))
}

/// The bound of a print setting's handle: `Setting` of the value it holds.
fn setting_bound(field: &Field<'_>) -> syn::Result<TokenStream> {
    let value = inner_of(field.ty, "Option").ok_or_else(|| syn::Error::new_spanned(field.ty, "a print setting is an `Option<…>`"))?;
    Ok(quote!(::sittir_core::prepare::Setting<#value, Self::Overlay>))
}

/// The type of a place's handle on a record, and the expression that hands
/// it out from the record (`RecordAt`).
fn record_handle(field: &Field<'_>, trivia: &TokenStream) -> syn::Result<(TokenStream, TokenStream)> {
    let arena = quote!(::sittir_core::arena);
    let setting = |of: TokenStream| -> syn::Result<(TokenStream, TokenStream)> {
        let value = inner_of(field.ty, "Option").ok_or_else(|| syn::Error::new_spanned(field.ty, "a print setting is an `Option<…>`"))?;
        Ok((quote!(#arena::SettingAt<'r, #trivia, #value>), quote!(self.setting(#arena::SettingOf::#of))))
    };
    match &field.role {
        Role::Layout => Ok((quote!(#arena::LayoutAt<'r, #trivia>), quote!(self.layout()))),
        Role::Slot(slot) => {
            let node = crate::views::held(field.ty).map(|(node, _)| node).ok_or_else(|| syn::Error::new_spanned(field.ty, "a prepared slot holds a `SlotValue<…>`"))?;
            let (Some(word), Some(width)) = (slot.cell.word, slot.cell.width) else {
                let ident = field.ident;
                return Err(syn::Error::new_spanned(ident, format!("`{ident}` is a prepared slot of a record, so it has its cell's word and width")));
            };
            let run = slot.cell.run.map_or_else(|| quote!(::core::option::Option::None), |run| quote!(::core::option::Option::Some(#run)));
            Ok((quote!(#arena::SlotAt<'r, #trivia, #node>), quote!(self.slot::<#node>(#word, #width, #run))))
        }
        Role::Flank(_) => setting(quote!(Delimiter)),
        Role::SeparatorKind(_) => setting(quote!(SeparatorKind)),
        Role::Space(space) => {
            let (word, before) = (space.slot, space.before);
            setting(quote!(Space { word: #word, before: #before }))
        }
        Role::Text => Err(syn::Error::new_spanned(field.ident, "text is no place a prepare writes")),
    }
}

/// A struct's prepare trait and its impl for the struct, and, for a struct
/// with a record (`record`, of that trivia type), its impl for the record's
/// handles.
pub fn prepare_trait(owner: &Ident, name: &Ident, fields: &[Field<'_>], record: Option<&TokenStream>) -> syn::Result<TokenStream> {
    let parts = format_ident!("{}Parts", name);
    let list_words: Vec<u32> = fields
        .iter()
        .filter_map(|field| match &field.role {
            Role::Slot(slot) if slot.cell.run.is_some() => slot.cell.word,
            _ => None,
        })
        .collect();
    let mut declared = Vec::new();
    let mut implemented = Vec::new();
    let mut members = Vec::new();
    let mut handles = Vec::new();
    let mut record_types = Vec::new();
    let mut record_handles = Vec::new();
    let mut sites = Vec::new();
    for field in fields {
        let bound = match &field.role {
            Role::Layout => Some(quote!(::sittir_core::prepare::LayoutTarget<Self::Overlay>)),
            Role::Text => None,
            Role::Slot(slot) => slot_bound(field, slot)?,
            Role::Flank(_) | Role::SeparatorKind(_) => Some(setting_bound(field)?),
            Role::Space(space) => {
                if !list_words.contains(&space.slot) {
                    let ident = field.ident;
                    return Err(syn::Error::new_spanned(ident, format!("`{ident}` spaces the slot at word {}, which is none of the struct's list slots", space.slot)));
                }
                let site = &space.site;
                sites.push(quote!(const _: ::sittir_core::types::SiteId = #site;));
                Some(setting_bound(field)?)
            }
        };
        let Some(bound) = bound else { continue };
        let (ident, ty) = (field.ident, field.ty);
        let assoc = camel(ident);
        declared.push(quote! { type #assoc<'a>: #bound where Self: 'a; });
        implemented.push(quote! { type #assoc<'a> = &'a mut #ty where Self: 'a; });
        members.push(quote! { pub #ident: N::#assoc<'a>, });
        handles.push(quote! { #ident: &mut self.#ident, });
        if let Some(trivia) = record {
            let (handle, built) = record_handle(field, trivia)?;
            record_types.push(quote! { type #assoc<'a> = #handle where Self: 'a; });
            record_handles.push(quote! { #ident: #built, });
        }
    }
    if members.is_empty() {
        return Err(syn::Error::new_spanned(owner, "a prepare trait is over at least one place"));
    }
    let trait_doc = format!("The places of `{owner}` a prepare body writes, for the struct and a record alike.");
    let parts_doc = format!("Every place of a `{name}`, each borrowed apart from the others.");
    let on_record = record.map(|trivia| {
        quote! {
            ::sittir_core::records_codec! {
                impl<'r> #name for ::sittir_core::arena::RecordAt<'r, #trivia> {
                    type Overlay = ::sittir_core::arena::RecordPrep<'r, #trivia>;
                    #(#record_types)*
                    fn prepare_parts(&mut self) -> #parts<'_, Self> {
                        #parts { #(#record_handles)* }
                    }
                }
            }
        }
    });
    Ok(quote! {
        #(#sites)*
        #[doc = #parts_doc]
        pub struct #parts<'a, N: #name + ?Sized + 'a> {
            #(#members)*
        }
        #[doc = #trait_doc]
        pub trait #name {
            /// What a prepare writes besides the node: `()` for the struct,
            /// which it writes in place; the render's prepared overlay for a
            /// record.
            type Overlay;
            #(#declared)*
            fn prepare_parts(&mut self) -> #parts<'_, Self>;
        }
        impl #name for #owner {
            type Overlay = ();
            #(#implemented)*
            fn prepare_parts(&mut self) -> #parts<'_, Self> {
                #parts { #(#handles)* }
            }
        }
        #on_record
    })
}

#[cfg(test)]
mod tests {
    use syn::{parse_quote, DeriveInput};

    fn expand(input: &DeriveInput) -> syn::Result<String> {
        crate::expand::derive(input).map(|out| out.to_string().split_whitespace().collect())
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    fn refusal(input: &DeriveInput) -> String {
        expand(input).expect_err("refused").to_string()
    }

    #[test]
    fn each_place_is_bounded_by_what_its_stamp_lets_prepare_write() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::LIST, item = items, words = 13, prepare = ListPrepare)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_items")]
                #[slot(field = field::ITEMS, word = 2, width = 2, run = 5, seated)]
                pub items: Vec<SlotValue<ItemNode>>,
                #[wire(key = "_terminator")]
                #[slot(field = field::TERMINATOR, word = 4, width = 5, defaulted)]
                pub terminator: Option<SlotValue<Terminator>>,
                #[wire(key = "_open")]
                #[slot(word = 9, bit = 0)]
                pub open: bool,
                #[wire(key = "_delimiter")]
                #[flank(trailing = 0)]
                pub delimiter: Option<::sittir_core::types::Delimiter>,
                #[wire(key = "_items_separator_space")]
                #[space(slot = 2, side = after, site = options::SITE_LIST_ITEMS_SEPARATOR_SPACE)]
                pub items_separator_space: Option<KindId>,
            }
        })
        .expect("expands");
        assert!(has(&out, "type Overlay; type Layout<'a>: ::sittir_core::prepare::LayoutTarget<Self::Overlay> where Self: 'a;"));
        assert!(has(&out, "type Items<'a>: ::sittir_core::prepare::SlotTarget<Self::Overlay> + ::sittir_core::prepare::SeatSlot<Self::Overlay> where Self: 'a;"));
        assert!(has(&out, "type Terminator<'a>: ::sittir_core::prepare::SlotTarget<Self::Overlay> + ::sittir_core::prepare::ArmOf<Self::Overlay> + ::sittir_core::prepare::UnitSlot<Self::Overlay> where Self: 'a;"));
        assert!(has(&out, "type Delimiter<'a>: ::sittir_core::prepare::Setting<::sittir_core::types::Delimiter, Self::Overlay> where Self: 'a;"));
        assert!(has(&out, "type ItemsSeparatorSpace<'a>: ::sittir_core::prepare::Setting<KindId, Self::Overlay> where Self: 'a;"));
        assert!(!has(&out, "type Open<'a>"), "a presence is no place");
        assert!(has(&out, "const _: ::sittir_core::types::SiteId = options::SITE_LIST_ITEMS_SEPARATOR_SPACE;"));
        assert!(has(&out, "type Overlay = (); type Layout<'a> = &'a mut Option<Box<NodeLayout>> where Self: 'a;"));
        assert!(has(&out, "type Items<'a> = &'a mut Vec<SlotValue<ItemNode>> where Self: 'a;"));
        assert!(has(&out, "pub struct ListPrepareParts<'a, N: ListPrepare + ?Sized + 'a> { pub layout: N::Layout<'a>, pub items: N::Items<'a>,"));
        assert!(has(&out, "ListPrepareParts { layout: &mut self.layout, items: &mut self.items, terminator: &mut self.terminator, delimiter: &mut self.delimiter, items_separator_space: &mut self.items_separator_space, }"));
    }

    #[test]
    fn a_text_leaf_prepares_its_layout_alone() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text, words = 2, prepare = IdentifierPrepare)]
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
        assert!(has(&out, "IdentifierPrepareParts { layout: &mut self.layout, }"));
    }

    #[test]
    fn a_field_with_no_role_stamp_is_refused_naming_it() {
        let error = refusal(&parse_quote! {
            #[node(kind = kind::LIST)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_items_separator_space")]
                pub items_separator_space: Option<KindId>,
            }
        });
        assert!(error.contains("`items_separator_space` has no stamp naming its role"), "{error}");
    }

    #[test]
    fn a_field_with_two_role_stamps_is_refused_naming_it() {
        let error = refusal(&parse_quote! {
            #[node(kind = kind::LIST)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                #[text]
                pub layout: Option<Box<NodeLayout>>,
            }
        });
        assert!(error.contains("`layout` has more than one role stamp"), "{error}");
    }

    #[test]
    fn a_spacing_setting_names_a_list_slot_of_its_struct() {
        let error = refusal(&parse_quote! {
            #[node(kind = kind::LIST, words = 7, prepare = ListPrepare)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_name")]
                #[slot(word = 2, width = 5)]
                pub name: SlotValue<NameNode>,
                #[wire(key = "_name_separator_space")]
                #[space(slot = 2, side = after, site = options::SITE_X)]
                pub name_separator_space: Option<KindId>,
            }
        });
        assert!(error.contains("`name_separator_space` spaces the slot at word 2, which is none of the struct's list slots"), "{error}");
    }

    #[test]
    fn a_list_is_never_defaulted_and_a_prepared_slot_has_its_cell() {
        let defaulted = refusal(&parse_quote! {
            #[node(kind = kind::LIST, words = 4, prepare = ListPrepare)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_items")]
                #[slot(word = 2, width = 2, run = 5, defaulted)]
                pub items: Vec<SlotValue<ItemNode>>,
            }
        });
        assert!(defaulted.contains("`items` is a list, which no option site defaults"), "{defaulted}");
        let uncelled = refusal(&parse_quote! {
            #[node(kind = kind::LIST, prepare = ListPrepare)]
            pub struct ListNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_items")]
                #[slot(field = field::ITEMS)]
                pub items: Vec<SlotValue<ItemNode>>,
            }
        });
        assert!(uncelled.contains("`items` is a prepared slot without its record cell"), "{uncelled}");
    }
}

//! A node type's direct hydration, `sittir_core::arena::HydrateNode`, and
//! what its values are stored as, `sittir_core::record::Stored`. The walk
//! routes each child by the type's own router (`__route`), the one its typed
//! read routes by, and writes each slot's cell from its stamps: a struct's
//! record its slots fill, a text leaf held whole, a choice its variant's
//! value, an enum kind's member a unit. Every `HydrateNode` sits inside
//! `::sittir_core::records_codec!`, beside the read it mirrors.

use crate::attrs::{KindAttrs, SlotAttrs};
use crate::codec::WireVariant;
use crate::expand::{capture_fields, inner_of, Field, Role};
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Ident, LitStr, Type};

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::records_codec! { #items })
}

fn stored_impl(ident: &Ident, stored: &TokenStream) -> TokenStream {
    quote! {
        impl ::sittir_core::record::Stored for #ident {
            const STORED: u8 = #stored;
        }
    }
}

/// The impl's head and the admission and own-row prelude of a struct's walk:
/// `__held` is what its holder holds of it, by coordinate or, for a text
/// leaf, whole.
fn struct_impl(ident: &Ident, leaf: bool, body: &TokenStream) -> TokenStream {
    gated(&quote! {
        impl ::sittir_core::arena::HydrateNode for #ident {
            #[allow(unused_mut, unused_variables)]
            fn hydrate(
                cursor: &mut ::tree_sitter::TreeCursor<'_>,
                ctx: &mut __rt::ReadCtx<'_>,
                depth: ::core::option::Option<__rt::Depth>,
                records: &mut ::sittir_core::arena::Hydration<'_>,
                inline: bool,
            ) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError> {
                let __node = cursor.node();
                if !<Self as __rt::ReadNode>::admits(::sittir_core::read::grammar_id(&__node), __rt::display_id(&__node)) {
                    return ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: ::sittir_core::read::grammar_id(&__node), index: __rt::index_of(cursor) }.into());
                }
                let index = __rt::index_of(cursor);
                let __held = ::sittir_core::arena::Hydrated::Node { kind: __stored_kind(&__node), row: index, span: ::sittir_core::types::Span::of(&__node), leaf: #leaf };
                #body
            }
        }
    })
}

/// The start of the walk of a struct with a record: none past the read's
/// depth unless embedded, and its draft.
fn record_start(words: u32) -> TokenStream {
    quote! {
        if records.walk(depth, inline) == ::sittir_core::arena::Walk::Skip {
            return ::core::result::Result::Ok(__held);
        }
        let __row = ::sittir_core::arena::hydrated_row(cursor, ctx);
        let mut __draft = records.draft(__stored_kind(&__node), #words)?;
    }
}

fn record_end(delimiter: &TokenStream) -> TokenStream {
    quote!(records.finish(__draft, ::sittir_core::arena::parsed_side(__row, #delimiter), __stored_kind(&__node), inline))
}

fn words_of(ident: &Ident, attrs: &KindAttrs) -> syn::Result<u32> {
    attrs.words.ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}` has a record, so it states its words: `#[node(words = …)]`")))
}

/// A struct's `Stored`, and its walk as its body kind reads it.
pub fn structure(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let leaf = attrs.text.is_some();
    let stored = stored_impl(ident, &if leaf { quote!(::sittir_core::record::stored::LEAF) } else { quote!(::sittir_core::record::stored::RECORD) });
    if !leaf && attrs.words.is_none() {
        return Ok(stored);
    }
    let hydrate = if leaf {
        struct_impl(ident, true, &quote!(::core::result::Result::Ok(__held)))
    } else if let Some(pattern) = &attrs.interior {
        struct_impl(ident, false, &interior(ident, attrs, fields, pattern)?)
    } else if attrs.content.is_some() {
        struct_impl(ident, false, &envelope(ident, attrs, fields)?)
    } else {
        struct_impl(ident, false, &routed(ident, attrs, fields)?)
    };
    Ok(quote!(#stored #hydrate))
}

fn site(label: &LitStr) -> TokenStream {
    quote!(__rt::SlotSite { kind: __KIND, slot: #label, index })
}

fn routed(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let words = words_of(ident, attrs)?;
    let slots: Vec<(u16, &Field<'_>, &SlotAttrs)> = (0..=u16::MAX)
        .zip(fields.iter().filter_map(|field| match &field.role {
            Role::Slot(slot) => Some((field, slot)),
            _ => None,
        }))
        .map(|(i, (field, slot))| (i, field, slot))
        .collect();
    let min_depth = attrs.min_depth.unwrap_or(0);
    let mut starts = Vec::new();
    let mut takes = Vec::new();
    let mut separators = Vec::new();
    let mut finishes = Vec::new();
    for &(i, field, slot) in &slots {
        let id = quote!(::sittir_core::types::SlotId(#i));
        let acc = format_ident!("__held{}", i);
        let ty = field.ty;
        let label = LitStr::new(&field.ident.to_string(), field.ident.span());
        let site = site(&label);
        let word = slot.cell.word.ok_or_else(|| syn::Error::new_spanned(field.ident, format!("`{}` is a record slot without its record cell (`word = …`)", field.ident)))?;
        if let Some(bit) = slot.cell.bit {
            starts.push(quote!(let mut #acc = false;));
            takes.push(quote!(__rt::Route::Slot { slot: #id, .. } => <bool as __rt::ReadSlot>::take(&mut #acc, cursor, ctx, __rt::Depth::ONE, #site)?,));
            finishes.push(quote!(__draft.flag(#word, #bit, #acc);));
            continue;
        }
        let shape = crate::views::cell_shape(field.ident, &slot.cell)?;
        starts.push(quote!(let mut #acc = <#ty as ::sittir_core::arena::HydrateSlot>::held();));
        takes.push(quote!(__rt::Route::Slot { slot: #id, .. } => <#ty as ::sittir_core::arena::HydrateSlot>::take_held(&mut #acc, cursor, ctx, depth, #site, records, #shape)?,));
        separators.push(quote!(__rt::Route::Separator { slot: #id, tagged } => <#ty as ::sittir_core::arena::HydrateSlot>::separator_held(&mut #acc, tagged),));
        finishes.push(quote!(<#ty as ::sittir_core::arena::HydrateSlot>::finish_held(#acc, #site, #shape, &mut __draft)?;));
    }
    let flank = fields.iter().find_map(|field| match &field.role {
        Role::Flank(flank) => Some(flank),
        _ => None,
    });
    let delimiter = if let Some(flank) = flank {
        let item = attrs.item.as_ref().ok_or_else(|| syn::Error::new_spanned(ident, "a list's flank needs `#[node(item = …)]`"))?;
        let position = slots.iter().find(|(_, field, _)| field.ident == item).map(|&(i, ..)| i).ok_or_else(|| syn::Error::new_spanned(item, "`item` names one of the list's slots"))?;
        let option = |value: Option<u16>| value.map_or_else(|| quote!(::core::option::Option::None), |value| quote!(::core::option::Option::Some(#value)));
        let (leading, trailing) = (option(flank.leading), option(flank.trailing));
        quote!(::core::option::Option::Some(__rt::delimiter(&__node, &children, &routes, ::sittir_core::types::SlotId(#position), #leading, #trailing)))
    } else {
        quote!(::core::option::Option::None)
    };
    let start = record_start(words);
    let end = record_end(&delimiter);
    Ok(quote! {
        #start
        let depth = depth.map(|depth| depth.at_least(#min_depth));
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        #(#starts)*
        if cursor.goto_first_child() {
            let mut i = 0usize;
            loop {
                match routes[i] {
                    #(#takes)*
                    #(#separators)*
                    _ => {}
                }
                i += 1;
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
        }
        #(#finishes)*
        #end
    })
}

fn interior(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>], _pattern: &LitStr) -> syn::Result<TokenStream> {
    let words = words_of(ident, attrs)?;
    let mut cells = Vec::new();
    for (field, capture) in capture_fields(fields)? {
        let Role::Slot(slot) = &field.role else { continue };
        if let Some(bit) = slot.cell.bit {
            let word = slot.cell.word.ok_or_else(|| syn::Error::new_spanned(field.ident, "a capture's bit states its `word`"))?;
            cells.push(quote!(__draft.flag(#word, #bit, captures.name(#capture).is_some());));
            continue;
        }
        let shape = crate::views::cell_shape(field.ident, &slot.cell)?;
        let span = quote!(__rt::capture_span(&captures, #capture, base).map(|span| ::sittir_core::arena::Hydrated::Text { span }));
        cells.push(if inner_of(field.ty, "Option").is_some() {
            quote!(__draft.cell(#shape, #span)?;)
        } else {
            quote! {
                let __text = #span.ok_or(__rt::ReadError::Missing { kind: __KIND, slot: #capture, index })?;
                __draft.cell(#shape, ::core::option::Option::Some(__text))?;
            }
        });
    }
    let start = record_start(words);
    let end = record_end(&quote!(::core::option::Option::None));
    Ok(quote! {
        #start
        let captures = __INTERIOR
            .captures(ctx.text(&__node))
            .ok_or(__rt::ReadError::Interior { kind: __KIND, index })?;
        let base = ::sittir_core::types::Span::of(&__node).start;
        #(#cells)*
        #end
    })
}

fn envelope(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let words = words_of(ident, attrs)?;
    let content = attrs.content.as_ref().ok_or_else(|| syn::Error::new_spanned(ident, "an envelope names its content field: `content = …`"))?;
    let field = fields.iter().find(|f| f.ident == content).ok_or_else(|| syn::Error::new_spanned(content, "`content` names one of the envelope's fields"))?;
    let Role::Slot(slot) = &field.role else { return Err(syn::Error::new_spanned(content, "an envelope's content is a slot")) };
    let inner: &Type = inner_of(field.ty, "SlotValue").ok_or_else(|| syn::Error::new_spanned(field.ty, "an envelope's content is a `SlotValue<…>`"))?;
    let shape = crate::views::cell_shape(field.ident, &slot.cell)?;
    let wraps_hidden = attrs.wraps_hidden;
    let message = format!("{ident}: an envelope's content read from its own row is no node with a record, since a tree holds one record per row");
    let (hidden, restore) = if wraps_hidden {
        (
            quote! {
                let own = __rt::index_of(cursor);
                let wrapped = __rt::survey(cursor).into_iter().find(|child| !child.trivia).ok_or(
                    __rt::ReadError::Unadmitted { kind: ::sittir_core::read::grammar_id(&__node), index: own },
                )?;
                __rt::goto(cursor, wrapped.index);
            },
            quote!(__rt::goto(cursor, own);),
        )
    } else {
        (quote!(), quote!())
    };
    let start = record_start(words);
    let end = record_end(&quote!(::core::option::Option::None));
    Ok(quote! {
        const _: () = assert!(#wraps_hidden || <#inner as ::sittir_core::record::Stored>::STORED & ::sittir_core::record::stored::RECORD == 0, #message);
        #start
        #hidden
        let __content = <#inner as ::sittir_core::arena::HydrateNode>::hydrate(cursor, ctx, depth, records, #shape.forms & ::sittir_core::record::form::INLINE != 0);
        #restore
        __draft.cell(#shape, ::core::option::Option::Some(__content?))?;
        #end
    })
}

/// A choice's `Stored`, the union of its arms', and its walk: the walk of
/// the variant its node takes, a unit arm a unit at the node's row. A
/// codec-only choice holds trivia, which no parsed record holds, so it has
/// neither.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>], codec_only: bool) -> TokenStream {
    if codec_only {
        return TokenStream::new();
    }
    let arms = variants.iter().map(|variant| match (variant.payload, &variant.first) {
        _ if variant.blank => quote!(::sittir_core::record::stored::BLANK),
        _ if variant.verbatim || variant.error => quote!(0),
        _ if variant.text.is_some() => quote!(::sittir_core::record::stored::TEXT),
        (Some(payload), _) if variant.index.is_some() => quote!(<#payload as ::sittir_core::record::Stored>::STORED),
        (None, Some(_)) => quote!(::sittir_core::record::stored::UNIT),
        _ => quote!(0),
    });
    let stored = stored_impl(ident, &quote!(0 #(| #arms)*));
    let mut fns = Vec::new();
    let mut table = Vec::new();
    for variant in variants {
        let Some(at) = variant.index else { continue };
        let slot = usize::from(at);
        if table.len() <= slot {
            table.resize(slot + 1, quote!(__unhydrated));
        }
        let name = format_ident!("__hydrate_{}", at);
        let value = match (variant.payload, &variant.first) {
            (Some(payload), _) => quote!(<#payload as ::sittir_core::arena::HydrateNode>::hydrate(cursor, ctx, depth, records, inline)),
            (None, Some(first)) => quote!(::core::result::Result::Ok(::sittir_core::arena::Hydrated::Unit { kind: #first, row: ::core::option::Option::Some(__rt::index_of(cursor)) })),
            (None, None) => continue,
        };
        fns.push(quote! {
            #[inline(never)]
            #[allow(unused_variables)]
            fn #name(
                cursor: &mut ::tree_sitter::TreeCursor<'_>,
                ctx: &mut __rt::ReadCtx<'_>,
                depth: ::core::option::Option<__rt::Depth>,
                records: &mut ::sittir_core::arena::Hydration<'_>,
                inline: bool,
            ) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError> {
                #value
            }
        });
        table[slot] = quote!(#name);
    }
    let hydrate = gated(&quote! {
        const _: () = {
            type __Hydrate = fn(&mut ::tree_sitter::TreeCursor<'_>, &mut __rt::ReadCtx<'_>, ::core::option::Option<__rt::Depth>, &mut ::sittir_core::arena::Hydration<'_>, bool) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError>;
            fn __unhydrated(
                cursor: &mut ::tree_sitter::TreeCursor<'_>,
                _ctx: &mut __rt::ReadCtx<'_>,
                _depth: ::core::option::Option<__rt::Depth>,
                _records: &mut ::sittir_core::arena::Hydration<'_>,
                _inline: bool,
            ) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError> {
                ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: ::sittir_core::read::grammar_id(&cursor.node()), index: __rt::index_of(cursor) }.into())
            }
            #(#fns)*
            const __HYDRATES: &[__Hydrate] = &[#(#table),*];
            impl ::sittir_core::arena::HydrateNode for #ident {
                fn hydrate(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &mut __rt::ReadCtx<'_>,
                    depth: ::core::option::Option<__rt::Depth>,
                    records: &mut ::sittir_core::arena::Hydration<'_>,
                    inline: bool,
                ) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError> {
                    let node = cursor.node();
                    let (grammar, display) = (::sittir_core::read::grammar_id(&node), __rt::display_id(&node));
                    match __variant(grammar, display).and_then(|i| __HYDRATES.get(i as usize)) {
                        ::core::option::Option::Some(hydrate) => hydrate(cursor, ctx, depth, records, inline),
                        ::core::option::Option::None => ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: grammar, index: __rt::index_of(cursor) }.into()),
                    }
                }
            }
        };
    });
    quote!(#stored #hydrate)
}

/// An enum kind's `Stored`, a unit, and its walk: the member its node
/// spells, at the node's row.
pub fn members(ident: &Ident) -> TokenStream {
    let stored = stored_impl(ident, &quote!(::sittir_core::record::stored::UNIT));
    let hydrate = gated(&quote! {
        impl ::sittir_core::arena::HydrateNode for #ident {
            fn hydrate(
                cursor: &mut ::tree_sitter::TreeCursor<'_>,
                _ctx: &mut __rt::ReadCtx<'_>,
                _depth: ::core::option::Option<__rt::Depth>,
                _records: &mut ::sittir_core::arena::Hydration<'_>,
                _inline: bool,
            ) -> ::core::result::Result<::sittir_core::arena::Hydrated, ::sittir_core::arena::HydrateError> {
                let member = __resolve(cursor).ok_or_else(|| __rt::ReadError::Unspelled { kind: ::sittir_core::read::grammar_id(&cursor.node()), index: __rt::index_of(cursor) })?;
                ::core::result::Result::Ok(::sittir_core::arena::Hydrated::Unit { kind: __id(&member), row: ::core::option::Option::Some(__rt::index_of(cursor)) })
            }
        }
    });
    quote!(#stored #hydrate)
}

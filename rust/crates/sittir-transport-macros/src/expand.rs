//! The expansions. Each wraps its items in `const _: () = { … };` so the
//! helper items it defines never meet the transport's own names.

use crate::attrs::{self, FlankAttrs, KindAttrs, SeparatorKindAttrs, SlotAttrs};
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DataStruct, DeriveInput, Fields, GenericArgument, Ident, LitStr, Path, PathArguments, Type};

pub fn derive(input: &DeriveInput) -> syn::Result<TokenStream> {
    let attrs = attrs::kind_attrs(&input.attrs)?;
    match &input.data {
        Data::Struct(data) => structure(&input.ident, &attrs, data),
        Data::Enum(_) => Err(syn::Error::new_spanned(&input.ident, "a choice or an enum kind is not supported yet")),
        Data::Union(_) => Err(syn::Error::new_spanned(&input.ident, "a transport is a struct or an enum")),
    }
}

enum Role {
    Layout,
    Slot(SlotAttrs),
    #[allow(dead_code)]
    Flank(FlankAttrs),
    #[allow(dead_code)]
    SeparatorKind(SeparatorKindAttrs),
    Other,
}

struct Field<'a> {
    ident: &'a Ident,
    ty: &'a Type,
    role: Role,
}

fn fields_of<'a>(owner: &Ident, data: &'a DataStruct) -> syn::Result<Vec<Field<'a>>> {
    let Fields::Named(named) = &data.fields else {
        return Err(syn::Error::new_spanned(owner, "a transport struct has named fields"));
    };
    named
        .named
        .iter()
        .map(|field| {
            let ident = field.ident.as_ref().expect("a named field");
            let role = if let Some(slot) = attrs::slot_attrs(&field.attrs)? {
                Role::Slot(slot)
            } else if let Some(flank) = attrs::flank_attrs(&field.attrs)? {
                Role::Flank(flank)
            } else if let Some(separator) = attrs::separator_kind_attrs(&field.attrs)? {
                Role::SeparatorKind(separator)
            } else if is_layout(&field.ty) {
                Role::Layout
            } else {
                Role::Other
            };
            Ok(Field { ident, ty: &field.ty, role })
        })
        .collect()
}

fn last_segment(ty: &Type) -> Option<String> {
    match ty {
        Type::Path(path) => path.path.segments.last().map(|segment| segment.ident.to_string()),
        _ => None,
    }
}

/// The first type argument of `wrapper<…>`, when `ty` is one.
fn inner_of<'t>(ty: &'t Type, wrapper: &str) -> Option<&'t Type> {
    let Type::Path(path) = ty else { return None };
    let segment = path.path.segments.last()?;
    if segment.ident != wrapper {
        return None;
    }
    let PathArguments::AngleBracketed(args) = &segment.arguments else { return None };
    args.args.iter().find_map(|arg| match arg {
        GenericArgument::Type(ty) => Some(ty),
        _ => None,
    })
}

/// `Option<…TransportLayout…>`: the layout field, known by its type.
fn is_layout(ty: &Type) -> bool {
    inner_of(ty, "Option").and_then(last_segment).as_deref() == Some("TransportLayout")
}

fn is_text(ty: &Type) -> bool {
    last_segment(ty).as_deref() == Some("String") || inner_of(ty, "Option").and_then(last_segment).as_deref() == Some("String")
}

struct Body {
    items: TokenStream,
    read: TokenStream,
    sides_of: TokenStream,
}

fn structure(ident: &Ident, attrs: &KindAttrs, data: &DataStruct) -> syn::Result<TokenStream> {
    let kind = attrs
        .kind
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "`#[transport(kind = …)]` names the struct's kind"))?;
    let fields = fields_of(ident, data)?;
    let admits = if attrs.display { quote!(display == #kind) } else { quote!(grammar == #kind || display == #kind) };
    let layout = &attrs.layout;
    let gap_arms = attrs.gaps.iter().map(|(preceding, slot)| quote!(#preceding => ::core::option::Option::Some(#slot),));
    let Body { items, read, sides_of } = if let Some(fixed) = &attrs.text {
        text_body(ident, &fields, fixed.as_ref())?
    } else {
        routed_body(attrs, &fields)?
    };
    let has_layout = fields.iter().find(|f| matches!(f.role, Role::Layout)).map(|field| {
        let (name, ty) = (field.ident, field.ty);
        quote! {
            impl __rt::HasLayout for #ident {
                type Layout = #ty;
                fn take_layout(&mut self) -> #ty {
                    ::core::mem::take(&mut self.#name)
                }
            }
        }
    });
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            #[allow(dead_code)]
            const __KIND: __Kind = #kind;
            #[allow(dead_code)]
            const __LAYOUT: &[__Kind] = &[#(#layout),*];
            #[allow(dead_code)]
            fn __gap(preceding: u16) -> ::core::option::Option<&'static str> {
                match preceding {
                    #(#gap_arms)*
                    _ => ::core::option::Option::None,
                }
            }
            #items
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    #admits
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, named: bool) -> bool {
                    named || <Self as __rt::ReadTransport>::admits(grammar, display)
                }
                #[allow(unused_mut, unused_variables)]
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    depth: __rt::Depth,
                    sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    #read
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    #sides_of
                }
            }
            #has_layout
        };
    })
}

/// The survey, routes and placement every node's own pass starts with.
fn pass(min_depth: u32) -> TokenStream {
    quote! {
        let depth = depth.at_least(#min_depth);
        let row = __rt::row_of(cursor);
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, sides.owner, __gap);
    }
}

/// The sides the placement gives the child at `row`, the node's own pass run
/// up to its placement.
fn sides_of_body() -> TokenStream {
    quote! {
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, false, __gap);
        ::core::result::Result::Ok(placement.take_row(row).unwrap_or_default())
    }
}

/// A router that places trivia and skips every other child: a node whose
/// children are its spelling.
fn spelling_router() -> TokenStream {
    quote! {
        fn __route(child: &__rt::Child) -> ::core::result::Result<__rt::Route, __rt::ReadError> {
            ::core::result::Result::Ok(if child.trivia { __rt::Route::Trivia } else { __rt::Route::Layout })
        }
    }
}

/// The fields every mode fills the same way: the layout from the placement,
/// and a field with no helper attribute from its `Default`.
fn common_inits(fields: &[Field<'_>], skip: &str) -> Vec<TokenStream> {
    fields
        .iter()
        .filter(|field| field.ident != skip)
        .filter_map(|field| {
            let name = field.ident;
            match field.role {
                Role::Layout => Some(quote!(#name: placement.into_layout(sides),)),
                Role::Other => Some(quote!(#name: ::core::default::Default::default(),)),
                _ => None,
            }
        })
        .collect()
}

fn text_body(ident: &Ident, fields: &[Field<'_>], fixed: Option<&LitStr>) -> syn::Result<Body> {
    if !fields.iter().any(|f| f.ident == "text" && is_text(f.ty) && matches!(f.role, Role::Other)) {
        return Err(syn::Error::new_spanned(ident, "a text leaf has a `text: String` field"));
    }
    let fixed = fixed.map_or_else(|| quote!(""), |text| quote!(#text));
    let inits = common_inits(fields, "text");
    let pass = pass(0);
    Ok(Body {
        items: spelling_router(),
        read: quote! {
            #pass
            let node = cursor.node();
            let spanned = if __rt::tiles(&children, node.start_byte() as u32, node.end_byte() as u32) {
                ctx.text(&node)
            } else {
                ""
            };
            let text = if spanned.is_empty() { #fixed } else { spanned };
            ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string(text), #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

enum SlotKind<'a> {
    Presence(&'a Path),
    Text,
    Node,
}

fn slot_kind<'a>(field: &Field<'a>, slot: &'a SlotAttrs) -> SlotKind<'a> {
    match &slot.presence {
        Some(keyword) => SlotKind::Presence(keyword),
        None if is_text(field.ty) => SlotKind::Text,
        None => SlotKind::Node,
    }
}

fn routed_body(attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<Body> {
    let slots: Vec<(u16, &Field<'_>, &SlotAttrs)> = fields
        .iter()
        .filter_map(|field| match &field.role {
            Role::Slot(slot) => Some((field, slot)),
            _ => None,
        })
        .enumerate()
        .map(|(i, (field, slot))| (i as u16, field, slot))
        .collect();

    let mut tagged = Vec::new();
    let mut untagged = Vec::new();
    let mut separators = Vec::new();
    for &(i, field, slot) in &slots {
        let ty = field.ty;
        let kind = slot_kind(field, slot);
        let scalar = match kind {
            SlotKind::Presence(_) => quote!(false),
            SlotKind::Text => {
                let scalar = slot.scalar;
                quote!(#scalar)
            }
            SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::scalar(child.grammar, child.display)),
        };
        let own_separators = &slot.separators;
        let field_paths = &slot.fields;
        if !field_paths.is_empty() {
            let takes = match kind {
                SlotKind::Presence(keyword) => quote!(child.grammar == #keyword),
                SlotKind::Text => quote!(!__LAYOUT.contains(&child.grammar) && ![#(#own_separators),*].contains(&child.grammar)),
                SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::takes_tagged(child.grammar, child.display, child.named)),
            };
            tagged.push(quote! {
                ::core::option::Option::Some(__field) if #(__field == #field_paths)||* => {
                    if #takes {
                        return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
                    }
                }
            });
        }
        if field_paths.is_empty() || slot.untagged {
            let admits = match kind {
                SlotKind::Presence(keyword) => quote!(child.grammar == #keyword),
                SlotKind::Text => return Err(syn::Error::new_spanned(field.ident, "a text slot routes by its field")),
                SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::admits(child.grammar, child.display)),
            };
            untagged.push(quote! {
                if #admits {
                    return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
                }
            });
        }
        if !own_separators.is_empty() {
            let own_field = if field_paths.is_empty() {
                quote!(false)
            } else {
                quote!(child.field.is_some_and(|__field| #(__field == #field_paths)||*))
            };
            separators.push(quote! {
                if [#(#own_separators),*].contains(&child.grammar) {
                    return ::core::result::Result::Ok(__rt::Route::Separator { slot: #i, tagged: #own_field });
                }
            });
        }
    }

    let accs: Vec<Ident> = slots.iter().map(|(i, ..)| format_ident!("__acc{}", i)).collect();
    let tys: Vec<&Type> = slots.iter().map(|(_, field, _)| field.ty).collect();
    let idxs: Vec<u16> = slots.iter().map(|(i, ..)| *i).collect();
    let names: Vec<&Ident> = slots.iter().map(|(_, field, _)| field.ident).collect();
    let labels: Vec<LitStr> = names.iter().map(|name| LitStr::new(&name.to_string(), name.span())).collect();
    let mut inits = common_inits(fields, "");
    for (((name, ty), acc), label) in names.iter().zip(&tys).zip(&accs).zip(&labels) {
        inits.push(quote!(#name: <#ty as __rt::ReadSlot>::finish(#acc, __rt::SlotSite { kind: __KIND, slot: #label, row })?,));
    }
    inits.extend(list_inits(attrs, fields, &slots)?);
    let pass = pass(attrs.min_depth.unwrap_or(0));

    Ok(Body {
        items: quote! {
            fn __route(child: &__rt::Child) -> ::core::result::Result<__rt::Route, __rt::ReadError> {
                if child.trivia {
                    return ::core::result::Result::Ok(__rt::Route::Trivia);
                }
                match child.field {
                    #(#tagged)*
                    ::core::option::Option::None => { #(#untagged)* }
                    _ => {}
                }
                #(#separators)*
                if __LAYOUT.contains(&child.grammar) {
                    return ::core::result::Result::Ok(__rt::Route::Layout);
                }
                ::core::result::Result::Err(__rt::ReadError::Unrouted { kind: __KIND, child: child.grammar, row: child.row })
            }
        },
        read: quote! {
            #pass
            #(let mut #accs = <#tys as __rt::ReadSlot>::start();)*
            if cursor.goto_first_child() {
                let mut i = 0usize;
                loop {
                    match routes[i] {
                        #(__rt::Route::Slot { slot: #idxs, .. } => <#tys as __rt::ReadSlot>::take(
                            &mut #accs,
                            cursor,
                            ctx,
                            depth,
                            placement.take(i),
                            __rt::SlotSite { kind: __KIND, slot: #labels, row },
                        )?,)*
                        #(__rt::Route::Separator { slot: #idxs, tagged } => <#tys as __rt::ReadSlot>::separator(&mut #accs, tagged),)*
                        _ => {}
                    }
                    i += 1;
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

/// A list's flank and separator-kind fields. Neither is read yet, so a struct
/// with either is an expansion error.
fn list_inits(_attrs: &KindAttrs, fields: &[Field<'_>], _slots: &[(u16, &Field<'_>, &SlotAttrs)]) -> syn::Result<Vec<TokenStream>> {
    match fields.iter().find(|f| matches!(f.role, Role::Flank(_) | Role::SeparatorKind(_))) {
        Some(field) => Err(syn::Error::new_spanned(field.ident, "a list's flank and separator kind are not supported yet")),
        None => Ok(Vec::new()),
    }
}

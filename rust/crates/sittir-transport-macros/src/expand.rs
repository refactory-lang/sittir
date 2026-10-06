//! The expansions. Each wraps its items in `const _: () = { … };` so the
//! helper items it defines never meet the transport's own names.

use crate::attrs::{self, FlankAttrs, KindAttrs, SeparatorKindAttrs, SlotAttrs};
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DataEnum, DataStruct, DeriveInput, Fields, GenericArgument, Ident, LitStr, Path, PathArguments, Type};

pub fn derive(input: &DeriveInput) -> syn::Result<TokenStream> {
    let attrs = attrs::kind_attrs(&input.attrs)?;
    match &input.data {
        Data::Struct(data) => structure(&input.ident, &attrs, data),
        Data::Enum(data) if attrs.choice => choice(&input.ident, data),
        Data::Enum(data) => members(&input.ident, &attrs, data),
        Data::Union(_) => Err(syn::Error::new_spanned(&input.ident, "a transport is a struct or an enum")),
    }
}

fn choice(ident: &Ident, data: &DataEnum) -> syn::Result<TokenStream> {
    let mut by_display = Vec::new();
    let mut by_grammar = Vec::new();
    let mut by_folded = Vec::new();
    let mut scalars = Vec::new();
    let mut reads = Vec::new();
    let mut sides = Vec::new();
    let mut blank = None;
    let mut payloads: Vec<(&Ident, &Type)> = Vec::new();
    for (i, variant) in data.variants.iter().enumerate() {
        let name = &variant.ident;
        if attrs::kind_attrs(&variant.attrs)?.blank {
            if !matches!(variant.fields, Fields::Unit) {
                return Err(syn::Error::new_spanned(variant, "a blank variant is a unit"));
            }
            blank = Some(quote! {
                fn blank() -> ::core::option::Option<Self> {
                    ::core::option::Option::Some(Self::#name)
                }
            });
            continue;
        }
        let Some(kinds) = attrs::variant_kinds(&variant.attrs)? else { continue };
        let i = i as u16;
        let ids = &kinds.kinds;
        let shown = &kinds.shown;
        if !shown.is_empty() {
            by_display.push(quote!(if [#(#shown),*].contains(&display) { return ::core::option::Option::Some(#i); }));
        }
        if !ids.is_empty() && kinds.display {
            by_display.push(quote!(if [#(#ids),*].contains(&display) { return ::core::option::Option::Some(#i); }));
        } else if !ids.is_empty() {
            by_grammar.push(quote!(if [#(#ids),*].contains(&grammar) { return ::core::option::Option::Some(#i); }));
        }
        let folded = &kinds.folded;
        if !folded.is_empty() {
            by_folded.push(quote!(if [#(#folded),*].contains(&grammar) { return ::core::option::Option::Some(#i); }));
        }
        match &variant.fields {
            Fields::Unit => {
                scalars.push(quote!(::core::option::Option::Some(#i) => true,));
                reads.push(quote!(::core::option::Option::Some(#i) => ::core::result::Result::Ok(Self::#name),));
            }
            Fields::Unnamed(payload) if payload.unnamed.len() == 1 => {
                let ty = &payload.unnamed[0].ty;
                payloads.push((name, ty));
                scalars.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::scalar(grammar, display),));
                reads.push(quote! {
                    ::core::option::Option::Some(#i) => ::core::result::Result::Ok(Self::#name(
                        <#ty as __rt::ReadTransport>::read(cursor, ctx, depth, sides)?,
                    )),
                });
                sides.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::sides_of(cursor, ctx, row),));
            }
            _ => return Err(syn::Error::new_spanned(variant, "a choice's variant is a unit or holds one transport")),
        }
    }
    let layout_names = payloads.iter().map(|(name, _)| name);
    let layout_bounds = payloads.iter().map(|(_, ty)| ty);
    let has_layout = if payloads.is_empty() {
        quote! {
            impl<__L: ::core::default::Default> __rt::HasLayout<__L> for #ident {
                fn take_layout(&mut self) -> __L {
                    ::core::default::Default::default()
                }
            }
        }
    } else {
        quote! {
            impl<__L: ::core::default::Default> __rt::HasLayout<__L> for #ident
            where
                #(#layout_bounds: __rt::HasLayout<__L>,)*
            {
                fn take_layout(&mut self) -> __L {
                    match self {
                        #(Self::#layout_names(inner) => __rt::HasLayout::take_layout(inner),)*
                        #[allow(unreachable_patterns)]
                        _ => ::core::default::Default::default(),
                    }
                }
            }
        }
    };
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            fn __variant(grammar: __Kind, display: __Kind) -> ::core::option::Option<u16> {
                #(#by_display)*
                #(#by_grammar)*
                #(#by_folded)*
                ::core::option::Option::None
            }
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    __variant(grammar, display).is_some()
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, _named: bool) -> bool {
                    __variant(grammar, display).is_some()
                }
                fn scalar(grammar: __Kind, display: __Kind) -> bool {
                    match __variant(grammar, display) {
                        #(#scalars)*
                        _ => false,
                    }
                }
                #blank
                #[allow(unused_variables)]
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    depth: __rt::Depth,
                    sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    let node = cursor.node();
                    let (grammar, display) = (__Kind(node.grammar_id()), __Kind(node.kind_id()));
                    match __variant(grammar, display) {
                        #(#reads)*
                        _ => ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: grammar, row: __rt::row_of(cursor) }),
                    }
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    let node = cursor.node();
                    match __variant(__Kind(node.grammar_id()), __Kind(node.kind_id())) {
                        #(#sides)*
                        _ => ::core::result::Result::Ok(__rt::Sides::default()),
                    }
                }
            }
            #has_layout
        };
    })
}

fn members(ident: &Ident, attrs: &KindAttrs, data: &DataEnum) -> syn::Result<TokenStream> {
    let kind = attrs
        .kind
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "an enum kind names its kind: `#[transport(kind = …)]`"))?;
    let mut by_kind = Vec::new();
    for variant in &data.variants {
        if !matches!(variant.fields, Fields::Unit) {
            return Err(syn::Error::new_spanned(variant, "an enum kind's members are units"));
        }
        let kinds = attrs::variant_kinds(&variant.attrs)?
            .ok_or_else(|| syn::Error::new_spanned(variant, "an enum kind's member names its token: `#[kind(…)]`"))?;
        let (name, ids, shown, folded) = (&variant.ident, &kinds.kinds, &kinds.shown, &kinds.folded);
        by_kind.push(quote!(if [#(#ids),*].contains(&grammar) || [#(#folded),*].contains(&grammar) || [#(#shown),*].contains(&display) { return ::core::option::Option::Some(#ident::#name); }));
    }
    let spelled = attrs.spelled.then(|| {
        quote! {
            if let ::core::option::Option::Some(member) = __rt::spelled_id(&__rt::survey(cursor)).and_then(|id| __member(id, id)) {
                return ::core::result::Result::Ok(member);
            }
        }
    });
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            fn __member(grammar: __Kind, display: __Kind) -> ::core::option::Option<#ident> {
                #(#by_kind)*
                ::core::option::Option::None
            }
            impl __rt::ReadTransport for #ident {
                fn admits(grammar: __Kind, display: __Kind) -> bool {
                    grammar == #kind || __member(grammar, display).is_some()
                }
                fn takes_tagged(grammar: __Kind, display: __Kind, _named: bool) -> bool {
                    <Self as __rt::ReadTransport>::admits(grammar, display)
                }
                fn scalar(grammar: __Kind, display: __Kind) -> bool {
                    __member(grammar, display).is_some()
                }
                fn read(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    _ctx: &__rt::ReadCtx<'_>,
                    _depth: __rt::Depth,
                    _sides: __rt::Sides,
                ) -> ::core::result::Result<Self, __rt::ReadError> {
                    let node = cursor.node();
                    if let ::core::option::Option::Some(member) = __member(__Kind(node.grammar_id()), __Kind(node.kind_id())) {
                        return ::core::result::Result::Ok(member);
                    }
                    #spelled
                    ::core::result::Result::Err(__rt::ReadError::Unspelled { kind: __Kind(node.grammar_id()), row: __rt::row_of(cursor) })
                }
                fn sides_of(
                    _cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    _ctx: &__rt::ReadCtx<'_>,
                    _row: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    ::core::result::Result::Ok(__rt::Sides::default())
                }
            }
            impl<__L: ::core::default::Default> __rt::HasLayout<__L> for #ident {
                fn take_layout(&mut self) -> __L {
                    ::core::default::Default::default()
                }
            }
        };
    })
}

enum Role {
    Layout,
    Slot(SlotAttrs),
    Flank(FlankAttrs),
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
    let folded = &attrs.folded;
    let admits = if attrs.display { quote!(display == #kind) } else { quote!(grammar == #kind #(|| grammar == #folded)*) };
    let layout = &attrs.layout;
    let gap_arms = attrs.gaps.iter().map(|(preceding, slot)| quote!(#preceding => ::core::option::Option::Some(#slot),));
    let Body { items, read, sides_of } = if let Some(fixed) = &attrs.text {
        text_body(ident, &fields, fixed.as_ref())?
    } else if let Some(pattern) = &attrs.interior {
        interior_body(ident, &fields, pattern)?
    } else if attrs.envelope {
        envelope_body(ident, attrs, &fields)?
    } else {
        routed_body(attrs, &fields)?
    };
    let has_layout = fields.iter().find(|f| matches!(f.role, Role::Layout)).map(|field| {
        let (name, ty) = (field.ident, field.ty);
        quote! {
            impl __rt::HasLayout<#ty> for #ident {
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

fn interior_body(ident: &Ident, fields: &[Field<'_>], pattern: &LitStr) -> syn::Result<Body> {
    let flagged = format!("(?s){}", pattern.value());
    regex::Regex::new(&flagged)
        .map_err(|e| syn::Error::new_spanned(pattern, format!("`{ident}`'s token interior does not compile as a Rust regex: {e}")))?;
    let flagged = LitStr::new(&flagged, pattern.span());
    let mut inits = common_inits(fields, "");
    for field in fields {
        if let Role::Slot(slot) = &field.role {
            let capture = slot
                .capture
                .as_ref()
                .ok_or_else(|| syn::Error::new_spanned(field.ident, "a token interior's slot names its capture"))?;
            let (name, ty) = (field.ident, field.ty);
            inits.push(quote!(#name: __rt::capture::<#ty>(&captures, #capture, __rt::SlotSite { kind: __KIND, slot: #capture, row })?,));
        }
    }
    let pass = pass(0);
    let router = spelling_router();
    Ok(Body {
        items: quote! {
            static __INTERIOR: __rt::Interior = __rt::Interior::new(#flagged);
            #router
        },
        read: quote! {
            #pass
            let captures = __INTERIOR
                .captures(ctx.text(&cursor.node()))
                .ok_or(__rt::ReadError::Interior { kind: __KIND, row })?;
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: sides_of_body(),
    })
}

fn envelope_body(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<Body> {
    let content = attrs
        .content
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "an envelope names its content field: `content = …`"))?;
    let field = fields
        .iter()
        .find(|f| f.ident == content)
        .ok_or_else(|| syn::Error::new_spanned(content, "`content` names one of the envelope's fields"))?;
    let inner = inner_of(field.ty, "SlotValue")
        .ok_or_else(|| syn::Error::new_spanned(field.ty, "an envelope's content is a `SlotValue<…>`"))?;
    let layout_ty = fields
        .iter()
        .find(|f| matches!(f.role, Role::Layout))
        .map(|f| f.ty)
        .ok_or_else(|| syn::Error::new_spanned(ident, "an envelope has a layout field"))?;
    let inits = fields.iter().map(|other| {
        let name = other.ident;
        match other.role {
            Role::Layout => quote!(#name: layout,),
            _ if other.ident == content => quote!(#name: ::sittir_core::SlotValue::Transport(content),),
            _ => quote!(#name: ::core::default::Default::default(),),
        }
    });
    let (hidden, restore) = if attrs.wraps_hidden {
        (
            quote! {
                let own = __rt::row_of(cursor);
                let wrapped = __rt::survey(cursor).into_iter().find(|child| !child.trivia).ok_or(
                    __rt::ReadError::Unadmitted { kind: __Kind(cursor.node().grammar_id()), row: own },
                )?;
                cursor.goto_descendant(wrapped.row as usize);
            },
            quote!(cursor.goto_descendant(own as usize);),
        )
    } else {
        (quote!(), quote!())
    };
    Ok(Body {
        items: quote!(),
        read: quote! {
            #hidden
            let mut content = <#inner as __rt::ReadTransport>::read(cursor, ctx, depth, sides.clone());
            #restore
            let mut content = content?;
            let layout: #layout_ty = <#inner as __rt::HasLayout<#layout_ty>>::take_layout(&mut content)
                .or_else(|| sides.into_layout());
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: quote!(<#inner as __rt::ReadTransport>::sides_of(cursor, ctx, row)),
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

    let mut tagged_separators = Vec::new();
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
                SlotKind::Presence(keyword) => quote!(child.display == #keyword),
                SlotKind::Text => quote!(!__LAYOUT.contains(&child.display) && ![#(#own_separators),*].contains(&child.display)),
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
                SlotKind::Presence(keyword) => quote!(child.display == #keyword),
                SlotKind::Text => return Err(syn::Error::new_spanned(field.ident, "a text slot routes by its field")),
                SlotKind::Node => quote!(<#ty as __rt::ReadSlot>::admits(child.grammar, child.display)),
            };
            untagged.push(quote! {
                if #admits {
                    return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
                }
            });
        }
        if !own_separators.is_empty() && !field_paths.is_empty() && !attrs.list {
            tagged_separators.push(quote! {
                ::core::option::Option::Some(__field) if (#(__field == #field_paths)||*) && [#(#own_separators),*].contains(&child.display) => {
                    return ::core::result::Result::Ok(__rt::Route::Separator { slot: #i, tagged: true });
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
                if [#(#own_separators),*].contains(&child.display) {
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
                    #(#tagged_separators)*
                    #(#tagged)*
                    ::core::option::Option::None => { #(#untagged)* }
                    _ => {}
                }
                #(#separators)*
                if __LAYOUT.contains(&child.display) {
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

fn list_inits(attrs: &KindAttrs, fields: &[Field<'_>], slots: &[(u16, &Field<'_>, &SlotAttrs)]) -> syn::Result<Vec<TokenStream>> {
    let mut inits = Vec::new();
    for field in fields {
        let name = field.ident;
        match &field.role {
            Role::Flank(flank) => {
                let item = attrs
                    .item
                    .as_ref()
                    .filter(|_| attrs.list)
                    .ok_or_else(|| syn::Error::new_spanned(name, "a list's flank needs `#[transport(list, item = …)]`"))?;
                let slot = slots
                    .iter()
                    .find(|(_, f, _)| f.ident == item)
                    .map(|(i, ..)| *i)
                    .ok_or_else(|| syn::Error::new_spanned(item, "`item` names one of the list's slots"))?;
                let (leading, trailing) = (option(flank.leading), option(flank.trailing));
                inits.push(quote! {
                    #name: ::core::option::Option::Some(__rt::delimiter(&cursor.node(), &children, &routes, #slot, #leading, #trailing)),
                });
            }
            Role::SeparatorKind(separator) => {
                let candidates = &separator.candidates;
                let read = quote!(__rt::separator_kind(&children, &routes, &[#(#candidates),*]));
                inits.push(match &separator.default {
                    Some(default) => quote!(#name: ::core::option::Option::Some(#read.unwrap_or(#default.0)),),
                    None => quote!(#name: #read,),
                });
            }
            _ => {}
        }
    }
    Ok(inits)
}

fn option(value: Option<u16>) -> TokenStream {
    match value {
        Some(value) => quote!(::core::option::Option::Some(#value)),
        None => quote!(::core::option::Option::None),
    }
}

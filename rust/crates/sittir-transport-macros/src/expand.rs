//! The expansions. Each wraps its items in `const _: () = { … };` so the
//! helper items it defines never meet the transport's own names.

use crate::attrs::{self, FlankAttrs, KindAttrs, SeparatorKindAttrs, SlotAttrs};
use crate::codec;
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DataEnum, DataStruct, DeriveInput, Fields, GenericArgument, Ident, LitStr, Path, PathArguments, Type};

pub fn derive(input: &DeriveInput) -> syn::Result<TokenStream> {
    let attrs = attrs::kind_attrs(&input.attrs)?;
    match &input.data {
        Data::Struct(data) => structure(&input.ident, &attrs, data),
        Data::Enum(data) if attrs.choice => choice(&input.ident, &attrs, data),
        Data::Enum(data) => members(&input.ident, &attrs, data),
        Data::Union(_) => Err(syn::Error::new_spanned(&input.ident, "a transport is a struct or an enum")),
    }
}

fn choice(ident: &Ident, attrs: &KindAttrs, data: &DataEnum) -> syn::Result<TokenStream> {
    if data.variants.len() > usize::from(u16::MAX) {
        return Err(syn::Error::new_spanned(ident, "a choice indexes its variants by u16: at most 65535"));
    }
    let mut by_display = Vec::new();
    let mut by_grammar = Vec::new();
    let mut by_folded = Vec::new();
    let mut scalars = Vec::new();
    let mut read_table: Vec<TokenStream> = vec![quote!(__unadmitted); data.variants.len()];
    let mut boxed_table: Vec<TokenStream> = vec![quote!(__unadmitted); data.variants.len()];
    let mut variant_fns = Vec::new();
    let mut sides = Vec::new();
    let mut blank = None;
    let mut payloads: Vec<(&Ident, &Type)> = Vec::new();
    let mut wire: Vec<codec::WireVariant<'_>> = Vec::new();
    let mut builds = Vec::new();
    let mut all_units = true;
    for (at, variant) in data.variants.iter().enumerate() {
        let name = &variant.ident;
        let payload = match &variant.fields {
            Fields::Unnamed(fields) if fields.unnamed.len() == 1 => Some(&fields.unnamed[0].ty),
            _ => None,
        };
        let unread = |payload| codec::WireVariant {
            name,
            payload,
            index: None,
            first: None,
            decodes: Vec::new(),
            blank: false,
            verbatim: false,
            text: None,
        };
        let form = attrs::kind_attrs(&variant.attrs)?;
        if form.blank {
            if !matches!(variant.fields, Fields::Unit) {
                return Err(syn::Error::new_spanned(variant, "a blank variant is a unit"));
            }
            blank = Some(quote! {
                fn blank() -> ::core::option::Option<Self> {
                    ::core::option::Option::Some(Self::#name)
                }
            });
            builds.push(quote!(if id == 0 { return ::core::option::Option::Some(Self::#name); }));
            wire.push(codec::WireVariant { blank: true, ..unread(None) });
            continue;
        }
        all_units &= payload.is_none() && !form.verbatim && form.text.is_none();
        if form.verbatim {
            wire.push(codec::WireVariant { verbatim: true, ..unread(payload) });
            continue;
        }
        if form.text.is_some() {
            let kinds = attrs::variant_kinds(&variant.attrs)?
                .ok_or_else(|| syn::Error::new_spanned(variant, "a text variant names the kinds whose text it takes: `#[kind(…)]`"))?;
            wire.push(codec::WireVariant { text: Some(kinds.kinds), ..unread(payload) });
            continue;
        }
        let Some(kinds) = attrs::variant_kinds(&variant.attrs)? else {
            wire.push(unread(payload));
            continue;
        };
        if payload.is_none() {
            let claims = kinds.kinds.iter().chain(&kinds.shown);
            builds.push(quote!(if [#(#claims),*].iter().any(|k| k.0 == id) { return ::core::option::Option::Some(Self::#name); }));
        }
        let i = at as u16;
        wire.push(codec::WireVariant {
            index: Some(i),
            first: kinds.kinds.first().or(kinds.shown.first()).or(kinds.folded.first()).cloned(),
            decodes: kinds.decodes.clone(),
            ..unread(payload)
        });
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
                let (read_fn, boxed_fn) = (format_ident!("__read_{}", i), format_ident!("__read_boxed_{}", i));
                variant_fns.push(quote! {
                    #[inline(never)]
                    fn #read_fn(
                        _cursor: &mut ::tree_sitter::TreeCursor<'_>,
                        _ctx: &__rt::ReadCtx<'_>,
                        _depth: __rt::Depth,
                        _sides: __rt::Sides,
                    ) -> ::core::result::Result<#ident, __rt::ReadError> {
                        ::core::result::Result::Ok(#ident::#name)
                    }
                    #[inline(never)]
                    fn #boxed_fn(
                        _cursor: &mut ::tree_sitter::TreeCursor<'_>,
                        _ctx: &__rt::ReadCtx<'_>,
                        _depth: __rt::Depth,
                        _sides: __rt::Sides,
                    ) -> ::core::result::Result<::std::boxed::Box<#ident>, __rt::ReadError> {
                        ::core::result::Result::Ok(::std::boxed::Box::new(#ident::#name))
                    }
                });
                read_table[at] = quote!(#read_fn);
                boxed_table[at] = quote!(#boxed_fn);
            }
            Fields::Unnamed(payload) if payload.unnamed.len() == 1 => {
                let ty = &payload.unnamed[0].ty;
                payloads.push((name, ty));
                scalars.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::scalar(grammar, display),));
                let (read_fn, boxed_fn, box_fn) = (format_ident!("__read_{}", i), format_ident!("__read_boxed_{}", i), format_ident!("__box_{}", i));
                variant_fns.push(quote! {
                    #[inline(never)]
                    fn #read_fn(
                        cursor: &mut ::tree_sitter::TreeCursor<'_>,
                        ctx: &__rt::ReadCtx<'_>,
                        depth: __rt::Depth,
                        sides: __rt::Sides,
                    ) -> ::core::result::Result<#ident, __rt::ReadError> {
                        ::core::result::Result::Ok(#ident::#name(<#ty as __rt::ReadTransport>::read(cursor, ctx, depth, sides)?))
                    }
                    #[inline(never)]
                    fn #boxed_fn(
                        cursor: &mut ::tree_sitter::TreeCursor<'_>,
                        ctx: &__rt::ReadCtx<'_>,
                        depth: __rt::Depth,
                        sides: __rt::Sides,
                    ) -> ::core::result::Result<::std::boxed::Box<#ident>, __rt::ReadError> {
                        let payload = <#ty as __rt::ReadTransport>::read(cursor, ctx, depth, sides)?;
                        ::core::result::Result::Ok(#box_fn(payload))
                    }
                    #[inline(never)]
                    fn #box_fn(payload: #ty) -> ::std::boxed::Box<#ident> {
                        ::std::boxed::Box::new(#ident::#name(payload))
                    }
                });
                read_table[at] = quote!(#read_fn);
                boxed_table[at] = quote!(#boxed_fn);
                sides.push(quote!(::core::option::Option::Some(#i) => <#ty as __rt::ReadTransport>::sides_of(cursor, ctx, index),));
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
    let codec = codec::choice(ident, &wire)?;
    let from_kind_id = all_units.then(|| {
        quote! {
            impl #ident {
                pub fn from_kind_id(id: u16) -> ::core::option::Option<Self> {
                    #(#builds)*
                    ::core::option::Option::None
                }
            }
        }
    });
    if attrs.codec_only {
        return Ok(quote! {
            const _: () = {
                use ::sittir_core::types::KindId as __Kind;
                #[allow(dead_code)]
                fn __variant(grammar: __Kind, display: __Kind) -> ::core::option::Option<u16> {
                    #(#by_display)*
                    #(#by_grammar)*
                    #(#by_folded)*
                    ::core::option::Option::None
                }
                #codec
            };
            #from_kind_id
        });
    }
    Ok(quote! {
        const _: () = {
            use ::sittir_core::read as __rt;
            use ::sittir_core::types::KindId as __Kind;
            type __Read<T> = fn(&mut ::tree_sitter::TreeCursor<'_>, &__rt::ReadCtx<'_>, __rt::Depth, __rt::Sides) -> ::core::result::Result<T, __rt::ReadError>;
            fn __unadmitted<T>(
                cursor: &mut ::tree_sitter::TreeCursor<'_>,
                _ctx: &__rt::ReadCtx<'_>,
                _depth: __rt::Depth,
                _sides: __rt::Sides,
            ) -> ::core::result::Result<T, __rt::ReadError> {
                ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: __Kind(cursor.node().grammar_id()), index: __rt::index_of(cursor) })
            }
            #(#variant_fns)*
            const __READS: &[__Read<#ident>] = &[#(#read_table),*];
            const __READS_BOXED: &[__Read<::std::boxed::Box<#ident>>] = &[#(#boxed_table),*];
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
                        ::core::option::Option::Some(i) => __READS[i as usize](cursor, ctx, depth, sides),
                        ::core::option::Option::None => ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: grammar, index: __rt::index_of(cursor) }),
                    }
                }
                #[allow(unused_variables)]
                fn read_boxed(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    depth: __rt::Depth,
                    sides: __rt::Sides,
                ) -> ::core::result::Result<::std::boxed::Box<Self>, __rt::ReadError> {
                    let node = cursor.node();
                    let (grammar, display) = (__Kind(node.grammar_id()), __Kind(node.kind_id()));
                    match __variant(grammar, display) {
                        ::core::option::Option::Some(i) => __READS_BOXED[i as usize](cursor, ctx, depth, sides),
                        ::core::option::Option::None => ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: grammar, index: __rt::index_of(cursor) }),
                    }
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    index: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    let node = cursor.node();
                    match __variant(__Kind(node.grammar_id()), __Kind(node.kind_id())) {
                        #(#sides)*
                        _ => ::core::result::Result::Ok(__rt::Sides::default()),
                    }
                }
            }
            #has_layout
            #codec
        };
        #from_kind_id
    })
}

fn members(ident: &Ident, attrs: &KindAttrs, data: &DataEnum) -> syn::Result<TokenStream> {
    let kind = attrs
        .kind
        .as_ref()
        .ok_or_else(|| syn::Error::new_spanned(ident, "an enum kind names its kind: `#[transport(kind = …)]`"))?;
    let mut by_kind = Vec::new();
    let mut firsts: Vec<(&Ident, Path)> = Vec::new();
    for variant in &data.variants {
        if !matches!(variant.fields, Fields::Unit) {
            return Err(syn::Error::new_spanned(variant, "an enum kind's members are units"));
        }
        let kinds = attrs::variant_kinds(&variant.attrs)?
            .ok_or_else(|| syn::Error::new_spanned(variant, "an enum kind's member names its token: `#[kind(…)]`"))?;
        let (name, ids, shown, folded) = (&variant.ident, &kinds.kinds, &kinds.shown, &kinds.folded);
        let first = ids.first().or(shown.first()).or(folded.first()).cloned().expect("`kind` names at least one kind");
        firsts.push((name, first));
        by_kind.push(quote!(if [#(#ids),*].contains(&grammar) || [#(#folded),*].contains(&grammar) || [#(#shown),*].contains(&display) { return ::core::option::Option::Some(#ident::#name); }));
    }
    let spelled = attrs.spelled.then(|| {
        quote! {
            if let ::core::option::Option::Some(member) = __rt::spelled_id(&__rt::survey(cursor)).and_then(|id| __member(id, id)) {
                return ::core::result::Result::Ok(member);
            }
        }
    });
    let codec = codec::members(ident, &firsts);
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
                    ::core::result::Result::Err(__rt::ReadError::Unspelled { kind: __Kind(node.grammar_id()), index: __rt::index_of(cursor) })
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
            #codec
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
    key: Option<LitStr>,
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
            Ok(Field { ident, ty: &field.ty, role, key: attrs::wire_key(&field.attrs)? })
        })
        .collect()
}

pub(crate) fn last_segment(ty: &Type) -> Option<String> {
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

/// `Option<Box<…TransportLayout…>>`: the layout field, known by its type.
fn is_layout(ty: &Type) -> bool {
    inner_of(ty, "Option").and_then(|boxed| inner_of(boxed, "Box")).and_then(last_segment).as_deref() == Some("TransportLayout")
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
    let wire = fields
        .iter()
        .map(|field| match &field.key {
            Some(key) => Ok(codec::WireField { ident: field.ident, ty: field.ty, key }),
            None => Err(syn::Error::new_spanned(field.ident, "a transport field crosses the wire under a key: `#[wire(key = \"…\")]`")),
        })
        .collect::<syn::Result<Vec<_>>>()?;
    let codec = match &attrs.text {
        Some(fixed) => codec::text_leaf(ident, &wire, fixed.as_ref(), attrs.kind.as_ref())?,
        None => codec::structure(ident, &wire)?,
    };
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
                    let __node = cursor.node();
                    if !<Self as __rt::ReadTransport>::admits(__Kind(__node.grammar_id()), __Kind(__node.kind_id())) {
                        return ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: __Kind(__node.grammar_id()), index: __rt::index_of(cursor) });
                    }
                    #read
                }
                #[allow(unused_variables)]
                fn sides_of(
                    cursor: &mut ::tree_sitter::TreeCursor<'_>,
                    ctx: &__rt::ReadCtx<'_>,
                    index: u32,
                ) -> ::core::result::Result<__rt::Sides, __rt::ReadError> {
                    #sides_of
                }
            }
            #has_layout
            #codec
        };
    })
}

/// The survey, routes and placement every node's own pass starts with.
fn pass(min_depth: u32) -> TokenStream {
    quote! {
        let depth = depth.at_least(#min_depth);
        let index = __rt::index_of(cursor);
        let __at = ctx.at_of(cursor);
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, sides.owner, __gap);
    }
}

/// The sides the placement gives the child at `index`, the node's own pass run
/// up to its placement.
fn sides_of_body() -> TokenStream {
    quote! {
        let children = __rt::survey(cursor);
        let routes = children
            .iter()
            .map(__route)
            .collect::<::core::result::Result<::std::vec::Vec<__rt::Route>, __rt::ReadError>>()?;
        let mut placement = __rt::place(ctx, &children, &routes, false, __gap);
        ::core::result::Result::Ok(placement.take_index(index).unwrap_or_default())
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
                Role::Layout => Some(quote!(#name: placement.into_layout(sides, __at),)),
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
            inits.push(quote!(#name: __rt::capture::<#ty>(&captures, #capture, __rt::SlotSite { kind: __KIND, slot: #capture, index })?,));
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
                .ok_or(__rt::ReadError::Interior { kind: __KIND, index })?;
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
                let own = __rt::index_of(cursor);
                let wrapped = __rt::survey(cursor).into_iter().find(|child| !child.trivia).ok_or(
                    __rt::ReadError::Unadmitted { kind: __Kind(cursor.node().grammar_id()), index: own },
                )?;
                cursor.goto_descendant(wrapped.index as usize);
            },
            quote!(cursor.goto_descendant(own as usize);),
        )
    } else {
        (quote!(), quote!())
    };
    Ok(Body {
        items: quote!(),
        read: quote! {
            let __at = ctx.at_of(cursor);
            #hidden
            let mut content = <#inner as __rt::ReadTransport>::read(cursor, ctx, depth, sides.clone());
            #restore
            let mut content = content?;
            let layout: #layout_ty = __rt::envelope_layout(<#inner as __rt::HasLayout<#layout_ty>>::take_layout(&mut content), sides, __at);
            ::core::result::Result::Ok(Self { #(#inits)* })
        },
        sides_of: quote!(<#inner as __rt::ReadTransport>::sides_of(cursor, ctx, index)),
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

    if slots.len() > usize::from(u16::MAX) {
        return Err(syn::Error::new_spanned(attrs.kind.as_ref(), "a kind indexes its slots by u16: at most 65535"));
    }
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
                ::core::option::Option::Some(__field) if (#(__field == #field_paths)||*) && #takes => {
                    return ::core::result::Result::Ok(__rt::Route::Slot { slot: #i, scalar: #scalar });
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
        inits.push(quote!(#name: <#ty as __rt::ReadSlot>::finish(#acc, __rt::SlotSite { kind: __KIND, slot: #label, index })?,));
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
                ::core::result::Result::Err(__rt::ReadError::Unrouted { kind: __KIND, child: child.grammar, index: child.index })
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
                            __rt::SlotSite { kind: __KIND, slot: #labels, index },
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

#[cfg(test)]
mod tests {
    use syn::parse_quote;

    fn expand(input: syn::DeriveInput) -> String {
        super::derive(&input).expect("expands").to_string().split_whitespace().collect()
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn a_child_one_slot_does_not_take_is_tried_on_the_next_slot_of_its_field() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::PAIR)]
            pub struct PairTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<Box<TransportLayout>>,
                #[wire(key = "_key")]
                #[slot(field = field::KEY)]
                pub key: SlotValue<KeyTransport>,
                #[wire(key = "_value")]
                #[slot(field = field::KEY)]
                pub value: SlotValue<ValueTransport>,
            }
        });
        assert!(has(
            &out,
            "::core::option::Option::Some(__field) if (__field == field::KEY) && <SlotValue<KeyTransport> as __rt::ReadSlot>::takes_tagged(child.grammar, child.display, child.named) => {
                return ::core::result::Result::Ok(__rt::Route::Slot { slot: 0u16, scalar: <SlotValue<KeyTransport> as __rt::ReadSlot>::scalar(child.grammar, child.display) });
            }"
        ));
        assert!(has(
            &out,
            "::core::option::Option::Some(__field) if (__field == field::KEY) && <SlotValue<ValueTransport> as __rt::ReadSlot>::takes_tagged(child.grammar, child.display, child.named) => {"
        ));
    }

    #[test]
    fn a_struct_refuses_a_node_its_kind_does_not_admit_before_it_reads() {
        let out = expand(parse_quote! {
            #[transport(kind = kind::PAIR)]
            pub struct PairTransport {
                #[wire(key = "$_layout")]
                pub layout: Option<Box<TransportLayout>>,
            }
        });
        assert!(has(
            &out,
            "if !<Self as __rt::ReadTransport>::admits(__Kind(__node.grammar_id()), __Kind(__node.kind_id())) {
                return ::core::result::Result::Err(__rt::ReadError::Unadmitted { kind: __Kind(__node.grammar_id()), index: __rt::index_of(cursor) });
            }"
        ));
    }

    #[test]
    fn a_choice_of_units_builds_each_arm_from_a_kind_id_it_claims() {
        let out = expand(parse_quote! {
            #[transport(choice)]
            pub enum Terminator {
                #[kind(kind::_AUTOMATIC_SEMICOLON)]
                AutomaticSemicolon,
                #[kind(kind::SEMI, display(kind::SEMI_ALIAS))]
                Semi,
                #[transport(blank)]
                Blank,
            }
        });
        assert!(has(
            &out,
            "impl Terminator {
                pub fn from_kind_id(id: u16) -> ::core::option::Option<Self> {
                    if [kind::_AUTOMATIC_SEMICOLON].iter().any(|k| k.0 == id) { return ::core::option::Option::Some(Self::AutomaticSemicolon); }
                    if [kind::SEMI, kind::SEMI_ALIAS].iter().any(|k| k.0 == id) { return ::core::option::Option::Some(Self::Semi); }
                    if id == 0 { return ::core::option::Option::Some(Self::Blank); }
                    ::core::option::Option::None
                }
            }"
        ));
    }

    #[test]
    fn a_choice_with_a_payload_arm_has_no_kind_id_constructor() {
        let out = expand(parse_quote! {
            #[transport(choice)]
            pub enum Content {
                #[kind(kind::SEMI)]
                Semi,
                #[kind(kind::BLOCK)]
                Block(BlockTransport),
            }
        });
        assert!(!has(&out, "pub fn from_kind_id"));
    }

    #[test]
    fn a_choice_of_units_with_an_arm_no_kind_id_builds_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[transport(choice)]
            pub enum Terminator {
                #[kind(kind::SEMI)]
                Semi,
                Unclaimed,
            }
        };
        let error = super::derive(&input).unwrap_err().to_string();
        assert_eq!(error, "a unit variant names the kind it writes: `#[kind(…)]`");
    }
}

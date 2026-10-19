//! A node type's record view, the type its `view = …` stamp names: the
//! node's record read in place, implementing the node's fields trait so the
//! node's one render body renders the record. Codegen stamps the view on each
//! type it writes the view's `KindOf` and `Render` for, from the functions
//! that write the native type's. Every item sits inside
//! `::sittir_core::records_codec!`.
//!
//! A struct's view checks its own words when it is built: its header, its
//! side record, its lists' runs and its text cells, whose text it keeps; it
//! keeps its presences and its print settings, stored or prepared. A child is
//! decoded when it is read. A choice's view is the view of the variant its
//! cell's kind names, with the same variants as the choice. An enum kind and
//! a choice of units are their own views.

use crate::attrs::KindAttrs;
use crate::codec::WireVariant;
use crate::expand::{inner_of, Field, Role};
use crate::fields::{camel, shape, Shape};
use proc_macro2::TokenStream;
use quote::quote;
use syn::{GenericArgument, Ident, PathArguments, Type};

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::records_codec! { #items })
}

fn malformed(what: &str) -> TokenStream {
    quote!(::sittir_core::arena::ArenaError::Malformed { what: #what, word: 0 })
}

/// A slot value's node type and its `ADJACENT` flag: `SlotValue<X>` or
/// `SlotValue<X, true>`.
fn slot_parts(ty: &Type) -> Option<(&Type, TokenStream)> {
    let Type::Path(path) = ty else { return None };
    let segment = path.path.segments.last()?;
    if segment.ident != "SlotValue" {
        return None;
    }
    let PathArguments::AngleBracketed(args) = &segment.arguments else { return None };
    let mut args = args.args.iter();
    let Some(GenericArgument::Type(node)) = args.next() else { return None };
    let adjacent = match args.next() {
        Some(GenericArgument::Const(value)) => quote!(#value),
        Some(GenericArgument::Type(value)) => quote!(#value),
        _ => quote!(false),
    };
    Some((node, adjacent))
}

/// The slot value a field holds, through `Option` and a list's item.
fn held(ty: &Type) -> Option<(&Type, TokenStream)> {
    let item = inner_of(ty, "Vec").or_else(|| inner_of(ty, "NonEmptyVec")).unwrap_or(ty);
    slot_parts(inner_of(item, "Option").unwrap_or(item))
}

fn view_of(node: &Type) -> TokenStream {
    quote!(<#node as ::sittir_core::arena::HasRecord>::Record<'a>)
}

/// What one field adds to a struct's view: a member it keeps, the member's
/// value when the view is built, and its accessor in the fields trait.
#[derive(Default)]
struct ViewField {
    member: TokenStream,
    init: TokenStream,
    accessor: TokenStream,
}

fn view_field(field: &Field<'_>, trivia: &TokenStream) -> syn::Result<ViewField> {
    let (name, ty) = (field.ident, field.ty);
    let assoc = camel(name);
    let cell_at = |slot: &crate::attrs::SlotAttrs| -> syn::Result<(u32, usize, usize)> {
        let word = slot.cell.word.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a record slot without its record cell (`word = …`)")))?;
        let width = slot.cell.width.unwrap_or(1);
        Ok((word, word as usize, (word + width) as usize))
    };
    let shape = shape(field)?;
    Ok(match (&field.role, shape) {
        (Role::Layout, Shape::Layout(_)) => ViewField {
            accessor: quote! {
                type #assoc<'b> = ::sittir_core::arena::RecordLayout<'b, #trivia> where Self: 'b;
                fn #name(&self) -> Self::#assoc<'_> {
                    ::sittir_core::arena::RecordLayout::new(self.__ctx.prepared(), self.__place, self.__site, self.__edges, self.__changed)
                }
            },
            ..ViewField::default()
        },
        (Role::Slot(slot), Shape::Child | Shape::OptionalChild) => {
            let (word, start, end) = cell_at(slot)?;
            let (node, adjacent) = held(ty).ok_or_else(|| syn::Error::new_spanned(ty, "a child slot holds a `SlotValue<…>`"))?;
            let view = view_of(node);
            ViewField {
                accessor: quote! {
                    type #assoc<'b> = ::sittir_core::arena::RecordSlot<'a, #trivia, #view, #adjacent> where Self: 'b;
                    fn #name(&self) -> Self::#assoc<'_> {
                        let site = ::sittir_core::trivia_store::Site { holder: self.__place, word: #word, item: ::sittir_core::types::ItemIndex(0) };
                        ::sittir_core::arena::RecordSlot::of(self.__ctx, site, &self.__words[#start..#end])
                    }
                },
                ..ViewField::default()
            }
        }
        (Role::Slot(slot), Shape::Items) => {
            let (word, start, end) = cell_at(slot)?;
            let run = slot.cell.run.ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a list without its run (`run = …`)")))?;
            let (node, adjacent) = held(ty).ok_or_else(|| syn::Error::new_spanned(ty, "a list slot holds `SlotValue<…>` items"))?;
            let view = view_of(node);
            let items = quote!(::sittir_core::arena::RecordItems<'a, #trivia, #view, #adjacent>);
            ViewField {
                member: quote!(#name: #items,),
                init: quote!(#name: ::sittir_core::arena::RecordItems::of(ctx, place, #word, #run, &words[#start..#end])?,),
                accessor: quote! {
                    type #assoc<'b> = #items where Self: 'b;
                    fn #name(&self) -> Self::#assoc<'_> {
                        self.#name
                    }
                },
            }
        }
        (Role::Slot(slot), Shape::Text) => {
            let (_, start, end) = cell_at(slot)?;
            ViewField {
                member: quote!(#name: &'a str,),
                init: quote!(#name: ctx.cell_text(::sittir_core::arena::Cell::decode(&words[#start..#end])?)?,),
                accessor: quote!(fn #name(&self) -> &str { self.#name }),
            }
        }
        (Role::Slot(slot), Shape::OptionalText) => {
            let (_, start, end) = cell_at(slot)?;
            ViewField {
                member: quote!(#name: ::core::option::Option<&'a str>,),
                init: quote! {
                    #name: match ::sittir_core::arena::Cell::decode(&words[#start..#end])? {
                        ::sittir_core::arena::Cell::Absent => ::core::option::Option::None,
                        cell => ::core::option::Option::Some(ctx.cell_text(cell)?),
                    },
                },
                accessor: quote!(fn #name(&self) -> ::core::option::Option<&str> { self.#name }),
            }
        }
        (Role::Slot(slot), Shape::Value) if slot.cell.bit.is_some() => {
            let (_, at, _) = cell_at(slot)?;
            let bit = slot.cell.bit.unwrap_or(0);
            ViewField {
                member: quote!(#name: bool,),
                init: quote!(#name: (words[#at] >> #bit) & 1 != 0,),
                accessor: quote!(fn #name(&self) -> bool { self.#name }),
            }
        }
        (Role::Flank(_), Shape::Value) => ViewField {
            member: quote!(#name: #ty,),
            init: quote!(#name: ctx.prepared().delimiter(place, side.delimiter),),
            accessor: quote!(fn #name(&self) -> #ty { self.#name }),
        },
        (Role::SeparatorKind(_), Shape::Value) => ViewField {
            member: quote!(#name: #ty,),
            init: quote!(#name: ctx.prepared().separator_kind(place, side.separator_kind),),
            accessor: quote!(fn #name(&self) -> #ty { self.#name }),
        },
        (Role::Space(space), Shape::Value) => {
            let (word, before) = (space.slot, space.before);
            let stored = if before { quote!(space_before) } else { quote!(space_after) };
            ViewField {
                member: quote!(#name: #ty,),
                init: quote!(#name: ctx.prepared().space(place, #word, #before, side.slots.iter().find(|slot| slot.word == #word).and_then(|slot| slot.#stored)),),
                accessor: quote!(fn #name(&self) -> #ty { self.#name }),
            }
        }
        _ => return Err(syn::Error::new_spanned(name, format!("`{name}` has no record view for its stamp and type"))),
    })
}

/// A struct's view, its `HasRecord` and `RecordView`, and its fields trait
/// over it; none for a struct with no stamped record or no fields trait.
pub fn structure(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let Some(view) = &attrs.view else { return Ok(TokenStream::new()) };
    let (Some(words), Some(fields_trait), Some(kind)) = (attrs.words, &attrs.fields, &attrs.kind) else {
        return Err(syn::Error::new_spanned(view, format!("`{ident}` names a record view, so it has a record, a kind and a fields trait")));
    };
    let layout_ty = fields
        .iter()
        .find(|field| matches!(field.role, Role::Layout))
        .ok_or_else(|| syn::Error::new_spanned(ident, format!("`{ident}` has a record, so it has a `#[layout]` field")))?
        .ty;
    let trivia = quote!(<#layout_ty as ::sittir_core::arena::LayoutField>::Trivia);
    let text_leaf = attrs.text.is_some();
    let mut parts = Vec::new();
    for field in fields {
        if text_leaf && matches!(field.role, Role::Text) {
            let name = field.ident;
            parts.push(ViewField { member: quote!(#name: &'a str,), init: TokenStream::new(), accessor: quote!(fn #name(&self) -> &str { self.#name }) });
            continue;
        }
        parts.push(view_field(field, &trivia)?);
    }
    let reads_words = fields.iter().any(|field| matches!(field.role, Role::Slot(_)) && matches!(shape(field), Ok(Shape::Child | Shape::OptionalChild)));
    let members = parts.iter().map(|part| &part.member);
    let inits = parts.iter().map(|part| &part.init);
    let accessors = parts.iter().map(|part| &part.accessor);
    let doc = format!("A record of `{ident}`, read in place.");
    let common = quote! {
        __ctx: ::sittir_core::arena::RecordCtx<'a, #trivia>,
        __place: ::sittir_core::trivia_store::Place,
        __site: ::core::option::Option<::sittir_core::trivia_store::Site<::sittir_core::trivia_store::Place>>,
        __edges: ::sittir_core::options::Edges,
        __changed: ::sittir_core::slot::ChangedEdges,
    };
    let (members_decl, from_cell) = if text_leaf {
        let text = fields.iter().find(|field| matches!(field.role, Role::Text)).map(|field| field.ident).ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `#[text]` field"))?;
        let refused = malformed("leaf cell");
        (
            quote!(#common #(#members)*),
            quote! {
                match cell {
                    ::sittir_core::arena::Cell::ParsedLeaf { kind, span, row } if kind == #kind => {
                        let tree = ctx.tree().ok_or(#refused)?;
                        ::core::result::Result::Ok(Self {
                            __ctx: ctx,
                            __place: ::sittir_core::trivia_store::Place::Row { tree, row },
                            __site: site,
                            __edges: ::sittir_core::options::Edges::default(),
                            __changed: ::sittir_core::slot::ChangedEdges::default(),
                            #text: ctx.source_text(span)?,
                        })
                    }
                    ::sittir_core::arena::Cell::BuiltLeaf { kind, text, record } if kind == #kind => {
                        let (_, side) = ::sittir_core::arena::record_of(ctx, record, ::sittir_core::record::HEADER_WORDS, #kind)?;
                        ::core::result::Result::Ok(Self {
                            __ctx: ctx,
                            __place: ::sittir_core::arena::place_of(ctx, record, &side)?,
                            __site: site,
                            __edges: side.edges.unwrap_or_default(),
                            __changed: side.changed,
                            #text: ctx.string(text)?,
                        })
                    }
                    _ => ::core::result::Result::Err(#refused),
                }
            },
        )
    } else {
        let refused = malformed("child cell");
        let (words_member, words_init) = if reads_words { (quote!(__words: &'a [u32],), quote!(__words: words,)) } else { (TokenStream::new(), TokenStream::new()) };
        (
            quote!(#common #words_member #(#members)*),
            quote! {
                let (ctx, at, link) = match cell {
                    ::sittir_core::arena::Cell::Child { kind, at, link } if kind == #kind => match link {
                        ::core::option::Option::Some(link) => (ctx.linked(link.tree)?, at, ::core::option::Option::Some(link.changed)),
                        ::core::option::Option::None => (ctx, at, ::core::option::Option::None),
                    },
                    _ => return ::core::result::Result::Err(#refused),
                };
                let (words, side) = ::sittir_core::arena::record_of(ctx, at, #words, #kind)?;
                let place = ::sittir_core::arena::place_of(ctx, at, &side)?;
                ::core::result::Result::Ok(Self {
                    __ctx: ctx,
                    __place: place,
                    __site: site,
                    __edges: side.edges.unwrap_or_default(),
                    __changed: link.unwrap_or(side.changed),
                    #words_init
                    #(#inits)*
                })
            },
        )
    };
    Ok(gated(&quote! {
        #[doc = #doc]
        #[derive(Clone, Copy)]
        pub struct #view<'a> {
            #members_decl
        }
        impl ::sittir_core::arena::HasRecord for #ident {
            type Record<'a> = #view<'a>;
        }
        impl<'a> ::sittir_core::arena::RecordView<'a, #trivia> for #view<'a> {
            fn claims(kind: ::sittir_core::types::KindId) -> bool {
                kind == #kind
            }
            #[allow(unused_variables, reason = "a record with no settings reads no side record past its header")]
            fn from_cell(
                ctx: ::sittir_core::arena::RecordCtx<'a, #trivia>,
                cell: ::sittir_core::arena::Cell,
                site: ::core::option::Option<::sittir_core::trivia_store::Site<::sittir_core::trivia_store::Place>>,
            ) -> ::core::result::Result<Self, ::sittir_core::arena::ArenaError> {
                #from_cell
            }
        }
        impl<'a> #fields_trait for #view<'a> {
            #(#accessors)*
        }
    }))
}

/// A choice's view: for a choice with a payload, the enum its stamp names,
/// with the choice's variants, a payload's holding the payload's view and an
/// edged unit's its edges; a choice of units is its own view, as an enum kind
/// is. None for an unstamped choice with a payload or a text arm.
pub fn choice(ident: &Ident, attrs: &KindAttrs, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    if attrs.view.is_none() && variants.iter().any(|variant| variant.payload.is_some() || variant.text.is_some()) {
        return Ok(TokenStream::new());
    }
    let payloads: Vec<(&Ident, &Type)> = variants.iter().filter_map(|variant| variant.payload.map(|ty| (variant.name, ty))).collect();
    let mut units = Vec::new();
    let mut claims = Vec::new();
    for variant in variants.iter().filter(|variant| variant.payload.is_none()) {
        let name = variant.name;
        if variant.text.is_some() {
            return Err(syn::Error::new_spanned(name, format!("`{name}` is text, which no record holds, so its choice has no view")));
        }
        if variant.blank {
            units.push(quote!(if kind == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(Self::#name); }));
            claims.push(quote!(kind == ::sittir_core::types::KindId::BLANK));
            continue;
        }
        let first = variant.first.as_ref().ok_or_else(|| syn::Error::new_spanned(name, format!("`{name}` is a unit arm that names no kind to read")))?;
        let value = if variant.edged { quote!(Self::#name(ctx.prepared().unit_edges(site))) } else { quote!(Self::#name) };
        units.push(quote!(if kind == #first { return ::core::result::Result::Ok(#value); }));
        claims.push(quote!(kind == #first));
    }
    let (declaration, view) = match (&attrs.view, payloads.is_empty()) {
        (Some(view), false) => {
            let arms = variants.iter().map(|variant| {
                let name = variant.name;
                match variant.payload {
                    Some(ty) => {
                        let inner = view_of(ty);
                        quote!(#name(#inner),)
                    }
                    None if variant.edged => quote!(#name(::sittir_core::options::Edges),),
                    None => quote!(#name,),
                }
            });
            let doc = format!("A record of `{ident}`, read in place: the view of the variant its cell names.");
            let declaration = quote! {
                #[doc = #doc]
                #[derive(Clone)]
                pub enum #view<'a> {
                    #(#arms)*
                }
            };
            (declaration, quote!(#view<'a>))
        }
        (None, _) => (TokenStream::new(), quote!(#ident)),
        (Some(view), true) => return Err(syn::Error::new_spanned(view, format!("`{ident}` is a choice of units, which is its own view"))),
    };
    let payload_claims = payloads.iter().map(|(_, ty)| {
        let inner = view_of(ty);
        quote!(<#inner as ::sittir_core::arena::RecordView<'a, __T>>::claims(kind))
    });
    let dispatch = payloads.iter().map(|(name, ty)| {
        let inner = view_of(ty);
        quote! {
            if <#inner as ::sittir_core::arena::RecordView<'a, __T>>::claims(kind) {
                return <#inner as ::sittir_core::arena::RecordView<'a, __T>>::from_cell(ctx, cell, site).map(Self::#name);
            }
        }
    });
    let bounds = payloads.iter().map(|(_, ty)| {
        let inner = view_of(ty);
        quote!(#inner: ::sittir_core::arena::RecordView<'a, __T>,)
    });
    let refused = malformed("choice cell");
    Ok(gated(&quote! {
        #declaration
        impl ::sittir_core::arena::HasRecord for #ident {
            type Record<'a> = #view;
        }
        impl<'a, __T> ::sittir_core::arena::RecordView<'a, __T> for #view
        where
            #(#bounds)*
        {
            fn claims(kind: ::sittir_core::types::KindId) -> bool {
                false #(|| #claims)* #(|| #payload_claims)*
            }
            #[allow(unused_variables, reason = "a choice of payloads alone reads no overlay for a unit")]
            fn from_cell(
                ctx: ::sittir_core::arena::RecordCtx<'a, __T>,
                cell: ::sittir_core::arena::Cell,
                site: ::core::option::Option<::sittir_core::trivia_store::Site<::sittir_core::trivia_store::Place>>,
            ) -> ::core::result::Result<Self, ::sittir_core::arena::ArenaError> {
                let kind = cell.kind().ok_or(#refused)?;
                if let ::sittir_core::arena::Cell::Unit { .. } = cell {
                    #(#units)*
                }
                #(#dispatch)*
                ::core::result::Result::Err(#refused)
            }
        }
    }))
}

/// An enum kind is its own view: a member is read from its unit cell.
pub fn members(ident: &Ident) -> TokenStream {
    let refused = malformed("member cell");
    gated(&quote! {
        impl ::sittir_core::arena::HasRecord for #ident {
            type Record<'a> = #ident;
        }
        impl<'a, __T> ::sittir_core::arena::RecordView<'a, __T> for #ident {
            fn claims(kind: ::sittir_core::types::KindId) -> bool {
                __member(kind, kind).is_some()
            }
            fn from_cell(
                _: ::sittir_core::arena::RecordCtx<'a, __T>,
                cell: ::sittir_core::arena::Cell,
                _: ::core::option::Option<::sittir_core::trivia_store::Site<::sittir_core::trivia_store::Place>>,
            ) -> ::core::result::Result<Self, ::sittir_core::arena::ArenaError> {
                match cell {
                    ::sittir_core::arena::Cell::Unit { kind } => __member(kind, kind).ok_or(#refused),
                    _ => ::core::result::Result::Err(#refused),
                }
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

    fn refusal(input: &syn::DeriveInput) -> String {
        crate::expand::derive(input).expect_err("refused").to_string()
    }

    #[test]
    fn a_struct_s_view_reads_its_record_its_presences_lists_and_settings_when_built_and_a_child_when_read() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::BLOCK, item = statements, words = 12, fields = BlockFields, view = BlockNodeRecord)]
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
                pub statements: Vec<SlotValue<StatementNode, true>>,
                #[wire(key = "_delimiter")]
                #[flank(trailing = 0)]
                pub delimiter: Option<Delimiter>,
                #[wire(key = "_statements_separator_space")]
                #[space(slot = 8, side = after, site = options::SITE_X)]
                pub statements_separator_space: Option<KindId>,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::records_codec! { #[doc = \"A record of `BlockNode`, read in place.\"] #[derive(Clone, Copy)] pub struct BlockNodeRecord<'a> {"));
        assert!(has(&out, "impl ::sittir_core::arena::HasRecord for BlockNode { type Record<'a> = BlockNodeRecord<'a>; }"));
        assert!(has(&out, "fn claims(kind: ::sittir_core::types::KindId) -> bool { kind == kind::BLOCK }"));
        assert!(has(&out, "let (words, side) = ::sittir_core::arena::record_of(ctx, at, 12u32, kind::BLOCK)?;"));
        assert!(has(&out, "::core::option::Option::Some(link) => (ctx.linked(link.tree)?, at, ::core::option::Option::Some(link.changed)),"));
        assert!(has(&out, "__changed: link.unwrap_or(side.changed), __words: words,"));
        assert!(has(&out, "r#async: (words[2usize] >> 3u32) & 1 != 0,"));
        assert!(has(&out, "statements: ::sittir_core::arena::RecordItems::of(ctx, place, 8u32, 5u32, &words[8usize..10usize])?,"));
        assert!(has(&out, "delimiter: ctx.prepared().delimiter(place, side.delimiter),"));
        assert!(has(&out, "statements_separator_space: ctx.prepared().space(place, 8u32, false, side.slots.iter().find(|slot| slot.word == 8u32).and_then(|slot| slot.space_after)),"));
        assert!(has(&out, "impl<'a> BlockFields for BlockNodeRecord<'a> {"));
        assert!(has(&out, "::sittir_core::arena::RecordLayout::new(self.__ctx.prepared(), self.__place, self.__site, self.__edges, self.__changed)"));
        assert!(has(&out, "type Label<'b> = ::sittir_core::arena::RecordSlot<'a, <Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia, <LabelNode as ::sittir_core::arena::HasRecord>::Record<'a>, false> where Self: 'b;"));
        assert!(has(&out, "let site = ::sittir_core::trivia_store::Site { holder: self.__place, word: 3u32, item: ::sittir_core::types::ItemIndex(0) }; ::sittir_core::arena::RecordSlot::of(self.__ctx, site, &self.__words[3usize..8usize])"));
        assert!(has(&out, "::sittir_core::arena::RecordItems<'a, <Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia, <StatementNode as ::sittir_core::arena::HasRecord>::Record<'a>, true>"));
    }

    #[test]
    fn a_view_with_no_child_keeps_no_words() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::DECIMAL, interior = "(?<whole>[0-9]+)(?<suffix>[a-z]+)?", words = 10, fields = DecimalFields, view = DecimalNodeRecord)]
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
        assert!(has(&out, "whole: ctx.cell_text(::sittir_core::arena::Cell::decode(&words[2usize..6usize])?)?,"));
        assert!(has(&out, "::sittir_core::arena::Cell::Absent => ::core::option::Option::None, cell => ::core::option::Option::Some(ctx.cell_text(cell)?),"));
        assert!(!has(&out, "__words: &'a [u32]"));
    }

    #[test]
    fn a_text_leaf_s_view_reads_a_parsed_leaf_from_its_source_and_a_built_one_from_its_string() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text, words = 2, fields = IdentifierFields, view = IdentifierNodeRecord)]
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
        assert!(has(&out, "::sittir_core::arena::Cell::ParsedLeaf { kind, span, row } if kind == kind::IDENTIFIER =>"));
        assert!(has(&out, "__place: ::sittir_core::trivia_store::Place::Row { tree, row },"));
        assert!(has(&out, "text: ctx.source_text(span)?,"));
        assert!(has(&out, "let (_, side) = ::sittir_core::arena::record_of(ctx, record, ::sittir_core::record::HEADER_WORDS, kind::IDENTIFIER)?;"));
        assert!(has(&out, "text: ctx.string(text)?,"));
        assert!(has(&out, "fn text(&self) -> &str { self.text }"));
    }

    #[test]
    fn a_choice_s_view_has_its_variants_and_reads_the_one_its_cell_names() {
        let out = expand(&parse_quote! {
            #[node(choice, view = PatternNodeRecord)]
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
        assert!(has(&out, "pub enum PatternNodeRecord<'a> { Identifier(<IdentifierNode as ::sittir_core::arena::HasRecord>::Record<'a>), TuplePattern(<Box<TuplePatternNode> as ::sittir_core::arena::HasRecord>::Record<'a>), Wildcard(::sittir_core::options::Edges), SelfArm, Blank, Verbatim(<VerbatimNode as ::sittir_core::arena::HasRecord>::Record<'a>), }"));
        assert!(has(&out, "impl ::sittir_core::arena::HasRecord for PatternNode { type Record<'a> = PatternNodeRecord<'a>; }"));
        assert!(has(&out, "if kind == kind::WILDCARD { return ::core::result::Result::Ok(Self::Wildcard(ctx.prepared().unit_edges(site))); }"));
        assert!(has(&out, "if kind == kind::SELF { return ::core::result::Result::Ok(Self::SelfArm); }"));
        assert!(has(&out, "if kind == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(Self::Blank); }"));
        assert!(has(&out, "if <<Box<TuplePatternNode> as ::sittir_core::arena::HasRecord>::Record<'a> as ::sittir_core::arena::RecordView<'a, __T>>::claims(kind) { return <<Box<TuplePatternNode> as ::sittir_core::arena::HasRecord>::Record<'a> as ::sittir_core::arena::RecordView<'a, __T>>::from_cell(ctx, cell, site).map(Self::TuplePattern); }"));
    }

    #[test]
    fn a_choice_of_units_and_an_enum_kind_are_their_own_views() {
        let units = expand(&parse_quote! {
            #[node(choice)]
            pub enum SignNode {
                #[kind(kind::PLUS)]
                Plus,
                #[kind(kind::MINUS)]
                #[node(edged)]
                Minus(::sittir_core::options::Edges),
            }
        })
        .expect("expands");
        assert!(has(&units, "impl ::sittir_core::arena::HasRecord for SignNode { type Record<'a> = SignNode; }"));
        assert!(has(&units, "impl<'a, __T> ::sittir_core::arena::RecordView<'a, __T> for SignNode"));
        let members = expand(&parse_quote! {
            #[node(kind = kind::OPERATOR)]
            pub enum OperatorNode {
                #[kind(kind::PLUS)]
                Plus,
            }
        })
        .expect("expands");
        assert!(has(&members, "impl ::sittir_core::arena::HasRecord for OperatorNode { type Record<'a> = OperatorNode; }"));
        assert!(has(&members, "::sittir_core::arena::Cell::Unit { kind } => __member(kind, kind).ok_or("));
    }

    #[test]
    fn a_view_stamp_names_a_choice_with_a_payload_never_a_choice_of_units() {
        let unstamped = expand(&parse_quote! {
            #[node(choice)]
            pub enum PatternNode {
                #[kind(kind::IDENTIFIER)]
                Identifier(IdentifierNode),
            }
        })
        .expect("expands");
        assert!(!has(&unstamped, "HasRecord"));
        let stamped_units = refusal(&parse_quote! {
            #[node(choice, view = SignNodeRecord)]
            pub enum SignNode {
                #[kind(kind::PLUS)]
                Plus,
            }
        });
        assert!(stamped_units.contains("its own view"), "{stamped_units}");
    }

    #[test]
    fn a_struct_with_no_view_stamp_has_no_view_and_a_stamped_one_needs_its_record() {
        let unstamped = expand(&parse_quote! {
            #[node(kind = kind::PAIR, words = 7, fields = PairFields)]
            pub struct PairNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_key")]
                #[slot(field = field::KEY, word = 2, width = 5)]
                pub key: SlotValue<KeyNode>,
            }
        })
        .expect("expands");
        assert!(!has(&unstamped, "HasRecord"));
        let unrecorded = refusal(&parse_quote! {
            #[node(kind = kind::PAIR, view = PairNodeRecord)]
            pub struct PairNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
            }
        });
        assert!(unrecorded.contains("has a record, a kind and a fields trait"), "{unrecorded}");
    }
}

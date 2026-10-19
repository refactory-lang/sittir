//! A node type's prepare over its records, `sittir_core::arena::PrepareRecord`:
//! what native prepare asks of a value, asked of the cell that names it. A
//! type has it where it has a record view. Every item sits inside
//! `::sittir_core::records_codec!`.
//!
//! A struct prepares its record through the prepare body codegen stamps
//! (`prepare_fn`), over its record's handles; it is seated by its own kind,
//! then, for a wrapper, through the content slot codegen stamps
//! (`seat_through`). A choice answers as the variant its cell's kind names.
//! An enum kind is a unit, which prepare leaves as it is. Each answers a
//! kind test through its view's `KindOf`.

use crate::attrs::KindAttrs;
use crate::codec::WireVariant;
use crate::expand::{Field, Role};
use proc_macro2::TokenStream;
use quote::quote;
use syn::{Ident, Type};

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::records_codec! { #items })
}

fn refused(what: &str) -> TokenStream {
    quote!(::sittir_core::render::CoordinateError::Record(::sittir_core::arena::ArenaError::Malformed { what: #what, word: 0 }))
}

/// Each method's body of a `PrepareRecord` impl.
struct Methods {
    claims: TokenStream,
    prepare: TokenStream,
    takes_gaps: TokenStream,
    seat: TokenStream,
    separator: TokenStream,
    snapshot: TokenStream,
    kind_in: TokenStream,
}

/// The impl of `PrepareRecord<trivia>` for `ty`, under `generics` and the
/// where clause `bounds`.
fn implementation(ty: &Ident, trivia: &TokenStream, generics: &TokenStream, bounds: &TokenStream, methods: &Methods) -> TokenStream {
    let Methods { claims, prepare, takes_gaps, seat, separator, snapshot, kind_in } = methods;
    let prep = quote!(::sittir_core::arena::RecordPrep<'_, #trivia>);
    let at = quote!(::sittir_core::arena::CellAt);
    let ctx = quote!(&::sittir_core::prepare::RenderContext<'_>);
    gated(&quote! {
        impl #generics ::sittir_core::arena::PrepareRecord<#trivia> for #ty #bounds {
            fn claims(kind: ::sittir_core::types::KindId) -> bool {
                #claims
            }
            #[allow(unused_variables, reason = "a choice of units prepares nothing")]
            fn prepare_record(prep: &mut #prep, at: #at, ctx: #ctx) -> ::core::result::Result<(), ::sittir_core::render::CoordinateError> {
                #prepare
            }
            #[allow(unused_variables, reason = "a struct takes a gap whatever its cell")]
            fn takes_gaps(cell: ::sittir_core::arena::Cell) -> bool {
                #takes_gaps
            }
            #[allow(unused_variables, reason = "a type seated by no slot answers no seat")]
            fn seat_record(
                prep: &#prep,
                at: #at,
                table: &[::core::option::Option<::sittir_core::types::SiteId>],
                ctx: #ctx,
            ) -> ::core::option::Option<(::sittir_core::trivia_store::Site<::sittir_core::arena::PrepPlace>, ::sittir_core::options::Edges, ::sittir_core::types::SiteId)> {
                #seat
            }
            #[allow(unused_variables, reason = "a unit has no separator of its own")]
            fn source_separator(prep: &#prep, at: #at, ctx: #ctx) -> ::core::option::Option<::sittir_core::types::KindId> {
                #separator
            }
            #[allow(unused_variables, reason = "a unit has no geometry")]
            fn snapshot_edge(prep: &#prep, at: #at) -> ::core::option::Option<::sittir_core::prepare::SnapshotEdge> {
                #snapshot
            }
            fn kind_in(prep: &#prep, at: #at, kinds: &[::sittir_core::types::KindId]) -> bool {
                #kind_in
            }
        }
    })
}

/// A struct's: none for a struct with no record view; a struct with one
/// names its prepare body.
pub fn structure(ident: &Ident, attrs: &KindAttrs, fields: &[Field<'_>], trivia: &TokenStream) -> syn::Result<TokenStream> {
    let Some(view) = &attrs.view else { return Ok(TokenStream::new()) };
    let (Some(prepare_fn), Some(kind)) = (&attrs.prepare_fn, &attrs.kind) else {
        return Err(syn::Error::new_spanned(view, format!("`{ident}` has a record view, so it names its kind and its prepare body (`prepare_fn = …`)")));
    };
    let keys = fields.iter().filter_map(|field| match (&field.role, &field.key) {
        (Role::Slot(slot), Some(key)) => slot.cell.word.map(|word| quote!(#word => ::core::option::Option::Some(#key),)),
        _ => None,
    });
    let through = match &attrs.seat_through {
        Some(content) => {
            let field = fields.iter().find(|field| field.ident == content).ok_or_else(|| syn::Error::new_spanned(content, format!("`{ident}` seats through `{content}`, which is none of its fields")))?;
            let Role::Slot(slot) = &field.role else { return Err(syn::Error::new_spanned(content, format!("`{content}` seats `{ident}`, so it is a slot"))) };
            let (Some(word), Some(width), None) = (slot.cell.word, slot.cell.width, slot.cell.run) else {
                return Err(syn::Error::new_spanned(content, format!("`{content}` seats `{ident}`, so it is a single slot with its record cell")));
            };
            let node = crate::views::held(field.ty).map(|(node, _)| node).ok_or_else(|| syn::Error::new_spanned(field.ty, "a wrapper's content holds a `SlotValue<…>`"))?;
            quote!(.or_else(|| ::sittir_core::arena::seat_through::<#trivia, #node>(prep, at, #kind, #word, #width, table, ctx)))
        }
        None => TokenStream::new(),
    };
    let methods = Methods {
        claims: quote!(kind == #kind),
        prepare: quote! {
            let mut record = ::sittir_core::arena::RecordAt::of(prep, at, #kind, |word| match word {
                #(#keys)*
                _ => ::core::option::Option::None,
            })?;
            #prepare_fn(&mut record, prep, ctx)
        },
        takes_gaps: quote!(true),
        seat: quote!(::sittir_core::arena::own_seat(prep, at, #kind, table) #through),
        separator: quote!(::sittir_core::arena::record_source_separator(prep, at, #kind, ctx)),
        snapshot: quote!(::sittir_core::arena::record_snapshot_edge(prep, at, #kind)),
        kind_in: quote!(::sittir_core::arena::view_kind_in::<#trivia, #view<'_>>(prep, at, kinds)),
    };
    Ok(implementation(ident, trivia, &TokenStream::new(), &TokenStream::new(), &methods))
}

/// A choice's, beside its view: none where it has no view.
pub fn choice(ident: &Ident, attrs: &KindAttrs, variants: &[WireVariant<'_>]) -> TokenStream {
    if variants.iter().any(|variant| variant.text.is_some()) || (attrs.view.is_none() && variants.iter().any(|variant| variant.payload.is_some())) {
        return TokenStream::new();
    }
    let payloads: Vec<&Type> = variants.iter().filter_map(|variant| variant.payload).collect();
    let trait_of = |ty: &Type| quote!(<#ty as ::sittir_core::arena::PrepareRecord<__T>>);
    let mut unit_claims = Vec::new();
    let mut gaps = Vec::new();
    let mut seats = Vec::new();
    for variant in variants.iter().filter(|variant| variant.payload.is_none()) {
        let (claim, kind) = if variant.blank {
            (quote!(kind == ::sittir_core::types::KindId::BLANK), None)
        } else {
            let Some(first) = &variant.first else { continue };
            (quote!(kind == #first), Some(first))
        };
        let edged = variant.edged;
        gaps.push(quote!(if #claim { return #edged; }));
        seats.push(kind.filter(|_| edged).map_or_else(
            || quote!(if #claim { return ::core::option::Option::None; }),
            |first| quote!(if #claim { return ::sittir_core::prepare::seat_site(table, #first).and_then(|seat| ::core::option::Option::Some((at.site?, ::sittir_core::options::Edges::default(), seat))); }),
        ));
        unit_claims.push(claim);
    }
    let dispatch = |call: TokenStream| {
        payloads.iter().map(move |ty| {
            let of = trait_of(ty);
            quote!(if #of::claims(kind) { return #of::#call; })
        })
    };
    let payload_claims = payloads.iter().map(|ty| {
        let of = trait_of(ty);
        quote!(#of::claims(kind))
    });
    let prepares = dispatch(quote!(prepare_record(prep, at, ctx)));
    let payload_gaps = dispatch(quote!(takes_gaps(cell)));
    let payload_seats = dispatch(quote!(seat_record(prep, at, table, ctx)));
    let separators = dispatch(quote!(source_separator(prep, at, ctx)));
    let snapshots = dispatch(quote!(snapshot_edge(prep, at)));
    let refused = refused("choice cell");
    let unit = quote!(::sittir_core::arena::Cell::Unit { .. });
    let unit_claim = quote!(false #(|| #unit_claims)*);
    let bounds = payloads.iter().map(|ty| quote!(#ty: ::sittir_core::arena::PrepareRecord<__T>,));
    let methods = Methods {
        claims: quote!(#unit_claim #(|| #payload_claims)*),
        prepare: quote! {
            let kind = at.cell.kind().ok_or(#refused)?;
            if matches!(at.cell, #unit) && (#unit_claim) {
                return ::core::result::Result::Ok(());
            }
            #(#prepares)*
            ::core::result::Result::Err(#refused)
        },
        takes_gaps: quote! {
            let ::core::option::Option::Some(kind) = cell.kind() else { return false };
            if matches!(cell, #unit) {
                #(#gaps)*
            }
            #(#payload_gaps)*
            false
        },
        seat: quote! {
            let kind = at.cell.kind()?;
            if matches!(at.cell, #unit) {
                #(#seats)*
            }
            #(#payload_seats)*
            ::core::option::Option::None
        },
        separator: quote! {
            let kind = at.cell.kind()?;
            if matches!(at.cell, #unit) {
                return ::core::option::Option::None;
            }
            #(#separators)*
            ::core::option::Option::None
        },
        snapshot: quote! {
            let kind = at.cell.kind()?;
            if matches!(at.cell, #unit) {
                return ::core::option::Option::None;
            }
            #(#snapshots)*
            ::core::option::Option::None
        },
        kind_in: quote!(::sittir_core::arena::view_kind_in::<__T, <Self as ::sittir_core::arena::HasRecord>::Record<'_>>(prep, at, kinds)),
    };
    let view_bound = quote!(for<'__a> <Self as ::sittir_core::arena::HasRecord>::Record<'__a>: ::sittir_core::arena::RecordView<'__a, __T> + ::sittir_core::view::KindOf,);
    implementation(ident, &quote!(__T), &quote!(<__T>), &quote!(where #(#bounds)* #view_bound), &methods)
}

/// An enum kind's: a member is a unit, which prepare leaves as it is.
pub fn members(ident: &Ident) -> TokenStream {
    let methods = Methods {
        claims: quote!(<Self as ::sittir_core::arena::RecordView<'_, __T>>::claims(kind)),
        prepare: quote!(::core::result::Result::Ok(())),
        takes_gaps: quote!(false),
        seat: quote!(::core::option::Option::None),
        separator: quote!(::core::option::Option::None),
        snapshot: quote!(::core::option::Option::None),
        kind_in: quote!(::sittir_core::arena::view_kind_in::<__T, Self>(prep, at, kinds)),
    };
    implementation(ident, &quote!(__T), &quote!(<__T>), &TokenStream::new(), &methods)
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
    fn a_struct_prepares_its_record_through_its_body_and_seats_by_its_kind_then_its_content() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::EXPRESSION_STATEMENT, words = 7, fields = StatementFields, prepare = StatementPrepare, view = StatementNodeRecord, prepare_fn = prepare_statement, seat_through = content)]
            pub struct StatementNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_content")]
                #[slot(field = field::CONTENT, word = 2, width = 5)]
                pub content: SlotValue<ExpressionNode>,
            }
        })
        .expect("expands");
        assert!(has(&out, "::sittir_core::arena::PrepareRecord<<Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia> for StatementNode"));
        assert!(has(&out, "::sittir_core::arena::RecordAt::of(prep, at, kind::EXPRESSION_STATEMENT, |word| match word { 2u32 => ::core::option::Option::Some(\"_content\"), _ => ::core::option::Option::None, })?; prepare_statement(&mut record, prep, ctx)"));
        assert!(has(&out, "::sittir_core::arena::own_seat(prep, at, kind::EXPRESSION_STATEMENT, table).or_else(|| ::sittir_core::arena::seat_through::<<Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia, ExpressionNode>(prep, at, kind::EXPRESSION_STATEMENT, 2u32, 5u32, table, ctx))"));
        assert!(has(&out, "::sittir_core::arena::view_kind_in::<<Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia, StatementNodeRecord<'_>>(prep, at, kinds)"));
        assert!(has(&out, "impl<'r> StatementPrepare for ::sittir_core::arena::RecordAt<'r, <Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia>"));
        assert!(has(&out, "type Content<'a> = ::sittir_core::arena::SlotAt<'r, <Option<Box<NodeLayout>> as ::sittir_core::arena::LayoutField>::Trivia, ExpressionNode> where Self: 'a;"));
        assert!(has(&out, "StatementPrepareParts { layout: self.layout(), content: self.slot::<ExpressionNode>(2u32, 5u32, ::core::option::Option::None), }"));
    }

    #[test]
    fn a_struct_with_a_view_names_its_prepare_body_and_its_seat_slot_is_a_single_slot_of_it() {
        let struct_with = |stamps: proc_macro2::TokenStream| -> syn::DeriveInput {
            parse_quote! {
                #[node(kind = kind::LIST, words = 4, fields = ListFields, prepare = ListPrepare, view = ListNodeRecord, #stamps)]
                pub struct ListNode {
                    #[wire(key = "$_layout")]
                    #[layout]
                    pub layout: Option<Box<NodeLayout>>,
                    #[wire(key = "_items")]
                    #[slot(field = field::ITEMS, word = 2, width = 2, run = 5)]
                    pub items: Vec<SlotValue<ItemNode>>,
                }
            }
        };
        let unnamed = expand(&struct_with(quote::quote!(words = 4))).expect_err("refused").to_string();
        assert!(unnamed.contains("`ListNode` has a record view, so it names its kind and its prepare body"), "{unnamed}");
        let listed = expand(&struct_with(quote::quote!(prepare_fn = prepare_list, seat_through = items))).expect_err("refused").to_string();
        assert!(listed.contains("`items` seats `ListNode`, so it is a single slot with its record cell"), "{listed}");
        let missing = expand(&struct_with(quote::quote!(prepare_fn = prepare_list, seat_through = body))).expect_err("refused").to_string();
        assert!(missing.contains("`ListNode` seats through `body`, which is none of its fields"), "{missing}");
        let out = expand(&struct_with(quote::quote!(prepare_fn = prepare_list))).expect("expands");
        assert!(has(&out, "self.slot::<ItemNode>(2u32, 2u32, ::core::option::Option::Some(5u32))"));
        assert!(has(&out, "::sittir_core::arena::own_seat(prep, at, kind::LIST, table) }"), "no content to seat through");
    }

    #[test]
    fn a_choice_answers_as_the_variant_its_cell_names_and_an_edged_unit_seats_by_its_kind() {
        let out = expand(&parse_quote! {
            #[node(choice, view = StatementNodeRecord)]
            pub enum StatementNode {
                #[kind(kind::EXPRESSION_STATEMENT)]
                Expression(ExpressionStatementNode),
                #[kind(kind::EMPTY_STATEMENT)]
                #[node(edged)]
                Empty(::sittir_core::options::Edges),
            }
        })
        .expect("expands");
        assert!(has(&out, "impl<__T> ::sittir_core::arena::PrepareRecord<__T> for StatementNode where ExpressionStatementNode: ::sittir_core::arena::PrepareRecord<__T>,"));
        assert!(has(&out, "if <ExpressionStatementNode as ::sittir_core::arena::PrepareRecord<__T>>::claims(kind) { return <ExpressionStatementNode as ::sittir_core::arena::PrepareRecord<__T>>::prepare_record(prep, at, ctx); }"));
        assert!(has(&out, "if kind == kind::EMPTY_STATEMENT { return true; }"), "an edged unit takes a gap");
        assert!(has(&out, "if kind == kind::EMPTY_STATEMENT { return ::sittir_core::prepare::seat_site(table, kind::EMPTY_STATEMENT)"));
        assert!(has(&out, "::sittir_core::arena::view_kind_in::<__T, <Self as ::sittir_core::arena::HasRecord>::Record<'_>>(prep, at, kinds)"));
    }

    #[test]
    fn an_enum_kind_is_a_unit_prepare_leaves_as_it_is() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::_PRIMITIVE_TYPE)]
            pub enum Primitive {
                #[kind(kind::U8_KEYWORD)]
                U8,
            }
        })
        .expect("expands");
        assert!(has(&out, "impl<__T> ::sittir_core::arena::PrepareRecord<__T> for Primitive {"));
        assert!(has(&out, "fn takes_gaps(cell: ::sittir_core::arena::Cell) -> bool { false }"));
        assert!(has(&out, "::sittir_core::arena::view_kind_in::<__T, Self>(prep, at, kinds)"));
    }
}

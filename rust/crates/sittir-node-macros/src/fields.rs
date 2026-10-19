//! A struct's fields trait: one accessor per field, which its render body is
//! generic over, so one body renders the struct and a record's view of it.
//! The struct's impl hands out its fields; each accessor's bound is what a
//! render body asks of a field of that shape.

use crate::expand::{inner_of, last_segment, Field, Role};
use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Ident, Type};

/// What a render body asks of a field: the layout by its stamp, any other
/// field by its type.
pub(crate) enum Shape<'t> {
    /// `#[layout]`, an `Option<Box<NodeLayout>>`: read through `BodyLayout`.
    Layout(&'t Type),
    /// `SlotValue<…>`: a child the body renders and tests the kind of.
    Child,
    /// `Option<SlotValue<…>>`: a child the body may find absent.
    OptionalChild,
    /// `Vec<…>` or `NonEmptyVec<…>`: the items of a list slot.
    Items,
    /// `String`: text, handed out as `&str`.
    Text,
    /// `Option<String>`: optional text, handed out as `Option<&str>`.
    OptionalText,
    /// Anything else: a `Copy` value handed out by value.
    Value,
}

pub(crate) fn shape<'t>(field: &Field<'t>) -> syn::Result<Shape<'t>> {
    let ty = field.ty;
    if matches!(field.role, Role::Layout) {
        let boxed = inner_of(ty, "Option")
            .and_then(|boxed| inner_of(boxed, "Box"))
            .ok_or_else(|| syn::Error::new_spanned(ty, "a `#[layout]` field is an `Option<Box<NodeLayout>>`"))?;
        return Ok(Shape::Layout(boxed));
    }
    let segment = last_segment(ty);
    Ok(match segment.as_deref() {
        Some("SlotValue") => Shape::Child,
        Some("Vec" | "NonEmptyVec") => Shape::Items,
        Some("String") => Shape::Text,
        Some("Option") => match inner_of(ty, "Option").and_then(last_segment).as_deref() {
            Some("SlotValue") => Shape::OptionalChild,
            Some("String") => Shape::OptionalText,
            _ => Shape::Value,
        },
        _ => Shape::Value,
    })
}

/// `type_` → `Type`, `return_type` → `ReturnType`.
pub(crate) fn camel(field: &Ident) -> Ident {
    let name = field.to_string();
    let camel: String = name
        .trim_start_matches("r#")
        .split('_')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            chars.next().map(|first| first.to_ascii_uppercase().to_string() + chars.as_str()).unwrap_or_default()
        })
        .collect();
    format_ident!("{}", camel, span = field.span())
}

pub fn fields_trait(owner: &Ident, name: &Ident, fields: &[Field<'_>]) -> syn::Result<TokenStream> {
    let mut declared = Vec::new();
    let mut implemented = Vec::new();
    for field in fields {
        let ident = field.ident;
        let ty = field.ty;
        let assoc = camel(ident);
        let gat = |bound: TokenStream, value: TokenStream, read: TokenStream| {
            (
                quote! {
                    type #assoc<'a>: #bound where Self: 'a;
                    fn #ident(&self) -> Self::#assoc<'_>;
                },
                quote! {
                    type #assoc<'a> = #value where Self: 'a;
                    fn #ident(&self) -> Self::#assoc<'_> { #read }
                },
            )
        };
        let plain = |out: TokenStream, read: TokenStream| {
            (quote! { fn #ident(&self) -> #out; }, quote! { fn #ident(&self) -> #out { #read } })
        };
        let (decl, imp) = match shape(field)? {
            Shape::Layout(inner) => gat(
                quote!(::sittir_core::layout::BodyLayout<'a>),
                quote!(::core::option::Option<&'a #inner>),
                quote!(self.#ident.as_deref()),
            ),
            Shape::Child => gat(
                quote!(::sittir_core::view::Slot + ::sittir_core::view::KindTest + ::sittir_core::render::Render),
                quote!(&'a #ty),
                quote!(&self.#ident),
            ),
            Shape::OptionalChild => gat(
                quote!(::sittir_core::view::Slot + ::sittir_core::view::KindTest),
                quote!(&'a #ty),
                quote!(&self.#ident),
            ),
            Shape::Items => gat(quote!(::sittir_core::view::SlotItems), quote!(&'a #ty), quote!(&self.#ident)),
            Shape::Text => plain(quote!(&str), quote!(&self.#ident)),
            Shape::OptionalText => plain(quote!(::core::option::Option<&str>), quote!(self.#ident.as_deref())),
            Shape::Value => plain(quote!(#ty), quote!(self.#ident)),
        };
        declared.push(decl);
        implemented.push(imp);
    }
    let doc = format!("The fields of `{owner}` a render body reads, for the struct and a record's view of it alike.");
    Ok(quote! {
        #[doc = #doc]
        pub trait #name {
            #(#declared)*
        }
        impl #name for #owner {
            #(#implemented)*
        }
    })
}

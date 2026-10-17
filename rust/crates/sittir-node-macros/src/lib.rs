//! `#[derive(Node)]`: expands a sittir node declaration (a kind's
//! struct, a choice over kinds, or an enum kind's members) into its typed
//! reader, `sittir_core::read::ReadNode`, and its wire codec, napi's
//! `FromNapiValue` and `ToNapiValue`. Every decision comes from the
//! helper attributes codegen stamps and from the field types; the expansion
//! looks nothing up.

mod attrs;
mod codec;
mod expand;
mod fields;
mod record;

#[proc_macro_derive(Node, attributes(node, slot, kind, flank, separator_kind, wire))]
pub fn derive_node(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = syn::parse_macro_input!(input as syn::DeriveInput);
    expand::derive(&input).unwrap_or_else(syn::Error::into_compile_error).into()
}

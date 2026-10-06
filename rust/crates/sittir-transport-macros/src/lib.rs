//! `#[derive(Transport)]`: expands a sittir transport declaration (a kind's
//! struct, a choice over kinds, or an enum kind's members) into its typed
//! reader, `sittir_core::read::ReadTransport`, and its wire codec, napi's
//! `FromNapiValue` and `ToNapiValue`. Every decision comes from the
//! helper attributes codegen stamps and from the field types; the expansion
//! looks nothing up.

mod attrs;
mod codec;
mod expand;

#[proc_macro_derive(Transport, attributes(transport, slot, kind, flank, separator_kind, wire))]
pub fn derive_transport(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = syn::parse_macro_input!(input as syn::DeriveInput);
    expand::derive(&input).unwrap_or_else(syn::Error::into_compile_error).into()
}

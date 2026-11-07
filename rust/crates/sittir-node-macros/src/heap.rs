//! A node's `sittir_core::heap::HeapBytes`: the sum of its fields' heap,
//! every field named, so the count is complete for every node the derive
//! expands.

use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use syn::{Data, DeriveInput, Fields, Ident};

pub fn heap_bytes(input: &DeriveInput) -> TokenStream {
    let ident = &input.ident;
    let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();
    let body = match &input.data {
        Data::Struct(data) => {
            let (pattern, sum) = destructure(&quote!(Self), &data.fields);
            quote! {
                let #pattern = self;
                #sum
            }
        }
        Data::Enum(data) => {
            let arms = data.variants.iter().map(|variant| {
                let name = &variant.ident;
                let (pattern, sum) = destructure(&quote!(Self::#name), &variant.fields);
                quote!(#pattern => #sum,)
            });
            quote! {
                match self {
                    #(#arms)*
                }
            }
        }
        Data::Union(_) => quote!(0),
    };
    quote! {
        impl #impl_generics ::sittir_core::heap::HeapBytes for #ident #ty_generics #where_clause {
            fn heap_bytes(&self) -> usize {
                #body
            }
        }
    }
}

fn destructure(path: &TokenStream, fields: &Fields) -> (TokenStream, TokenStream) {
    let bound: Vec<Ident> = match fields {
        Fields::Named(named) => named.named.iter().filter_map(|field| field.ident.clone()).collect(),
        Fields::Unnamed(unnamed) => (0..unnamed.unnamed.len()).map(|n| format_ident!("__field{}", n)).collect(),
        Fields::Unit => Vec::new(),
    };
    let pattern = match fields {
        Fields::Named(_) => quote!(#path { #(#bound),* }),
        Fields::Unnamed(_) => quote!(#path(#(#bound),*)),
        Fields::Unit => quote!(#path),
    };
    let sum = quote!(0usize #(+ ::sittir_core::heap::HeapBytes::heap_bytes(#bound))*);
    (pattern, sum)
}

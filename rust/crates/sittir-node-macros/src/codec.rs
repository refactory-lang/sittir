//! The wire codec a node declaration expands to: its place in the codec's
//! loop (`sittir_core::codec::Codec`), in today's napi object form, and how
//! it is taken apart (`codec::Dismantle`, `codec::Parts`). A struct with a
//! child slot decodes and encodes in a frame of its own, field by field in
//! declaration order; every other node is decoded and encoded whole where it
//! is held, by its napi codec. `FromNapiValue` and `ToNapiValue` of a node a
//! frame can hold are entries into the loop. The napi items sit inside
//! `::sittir_core::napi_codec!`, which keeps them only when `sittir-core` is
//! built with napi bindings, and name napi as `::sittir_core::__napi`.

use proc_macro2::{Literal, TokenStream};
use quote::quote;
use syn::{Ident, LitStr, Path, Type};

/// A struct field as the wire sees it.
pub struct WireField<'a> {
    pub ident: &'a Ident,
    pub ty: &'a Type,
    pub key: &'a LitStr,
    /// A slot: the field holds the node's children.
    pub slot: bool,
}

impl WireField<'_> {
    /// Whether the field holds nodes the loop reads and writes: a slot that
    /// is neither a presence flag nor captured text.
    fn holds_nodes(&self) -> bool {
        self.slot && !is_flag(self.ty) && !crate::expand::is_text(self.ty)
    }
}

/// A choice variant as the wire sees it.
pub struct WireVariant<'a> {
    pub name: &'a Ident,
    /// The written payload type; `None` for a unit variant.
    pub payload: Option<&'a Type>,
    /// The index the reader's `__variant` gives the variant, when it matches one.
    pub index: Option<u16>,
    /// The id a unit variant writes: the first it claims.
    pub first: Option<Path>,
    /// Every id a unit variant is built from: its kinds and the kinds it
    /// matches by display id.
    pub claims: Vec<Path>,
    /// Ids the codec also decodes as this variant.
    pub decodes: Vec<Path>,
    pub blank: bool,
    pub verbatim: bool,
    pub error: bool,
    /// For a `text` variant, the kinds whose objects carrying `$text` it takes.
    pub text: Option<Vec<Path>>,
    /// A unit that holds its kind's edges: decoded with none set.
    pub edged: bool,
}

fn napi() -> TokenStream {
    quote!(::sittir_core::__napi)
}

/// The grammar a node belongs to: the codec's frames are its trivia type's.
fn grammar(ident: &Ident) -> TokenStream {
    quote!(<#ident as ::sittir_core::trivia::HasTrivia>::Trivia)
}

fn c_key(key: &LitStr) -> syn::Result<syn::LitCStr> {
    let value = ::std::ffi::CString::new(key.value()).map_err(|_| syn::Error::new_spanned(key, "a wire key holds no NUL byte"))?;
    Ok(syn::LitCStr::new(&value, key.span()))
}

fn is_option(ty: &Type) -> bool {
    crate::expand::last_segment(ty).as_deref() == Some("Option")
}

pub(crate) fn is_kind_key(key: &LitStr) -> bool {
    key.value() == "$type"
}

fn is_flag(ty: &Type) -> bool {
    crate::expand::last_segment(ty).as_deref() == Some("bool")
}

fn gated(items: &TokenStream) -> TokenStream {
    quote!(::sittir_core::napi_codec! { #items })
}

fn boxed(ident: &Ident) -> TokenStream {
    let napi = napi();
    quote! {
        impl #napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                unsafe { <#ident as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val) }.map(::std::boxed::Box::new)
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for ::std::boxed::Box<#ident> {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { <#ident as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, *val) }
            }
        }
    }
}

/// `FromNapiValue` and `ToNapiValue` of a node a frame can hold: entries
/// into the loop.
fn loop_entries(ident: &Ident) -> TokenStream {
    let (napi, w) = (napi(), grammar(ident));
    let boxed = boxed(ident);
    quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                unsafe { ::sittir_core::codec::decode::<#w, Self>(env, napi_val) }
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { ::sittir_core::codec::encode::<#w, Self>(env, val) }
            }
        }
        #boxed
    }
}

/// A node no frame is needed for: decoded and encoded whole by its napi
/// codec, dropped in place, with no steps of its own, and height 0.
fn nodeless(ident: &Ident) -> TokenStream {
    let w = grammar(ident);
    let height = leaf_height(ident);
    quote! {
        #height
        ::sittir_core::nodeless_codec!(#ident);
        ::sittir_core::napi_codec! {
            ::sittir_core::nodeless_steps!(#ident; #w);
        }
    }
}

/// The height of a node with no child slot: 0, by its kind.
fn leaf_height(ident: &Ident) -> TokenStream {
    quote! {
        impl ::sittir_core::codec::Height for #ident {
            fn tallest(&self) -> ::core::option::Option<u16> {
                ::core::option::Option::Some(0)
            }
        }
    }
}

/// A node with no child slot keeps no height: it is 0 by its kind.
fn no_height(height: Option<&Ident>) -> syn::Result<()> {
    match height {
        Some(height) => Err(syn::Error::new_spanned(height, "a node with no child slot is height 0 by its kind, so it keeps no `#[height]`")),
        None => Ok(()),
    }
}

/// The read of field `field` from `obj`, by its key.
fn field_read(owner: &str, field: &WireField<'_>) -> syn::Result<TokenStream> {
    let key = c_key(field.key)?;
    if is_kind_key(field.key) {
        return Ok(quote!({
            let __shown: ::sittir_core::types::KindId = unsafe { ::sittir_core::boundary::optional(env, obj, #key, #owner)? }.unwrap_or(__KIND);
            if __shown != __KIND && !__DISPLAYS.contains(&__shown) {
                return ::core::result::Result::Err(::sittir_core::__napi::Error::from_reason(::std::format!(
                    "{}: $type {} is neither its kind nor one it is shown as", #owner, __shown.0
                )));
            }
            __shown
        }));
    }
    let read = if is_option(field.ty) {
        quote!(optional)
    } else if is_flag(field.ty) {
        quote!(flag)
    } else {
        quote!(required)
    };
    Ok(quote!(unsafe { ::sittir_core::boundary::#read(env, obj, #key, #owner)? }))
}

/// The initializers that read `fields` from `obj`, each by its key.
fn field_reads(owner: &str, fields: &[&WireField<'_>]) -> syn::Result<Vec<TokenStream>> {
    fields
        .iter()
        .map(|field| {
            let (ident, read) = (field.ident, field_read(owner, field)?);
            Ok(quote!(#ident: #read,))
        })
        .collect()
}

/// The entry `field` writes, its value `value`: present only when an
/// optional field is.
fn field_entry(field: &WireField<'_>, value: &TokenStream) -> syn::Result<TokenStream> {
    let (napi, key) = (napi(), c_key(field.key)?);
    Ok(if is_option(field.ty) {
        quote!(::sittir_core::boundary::present(env, #key, #value)?)
    } else {
        quote!(::core::option::Option::Some((#key, #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, #value)?)))
    })
}

/// `$type`'s entry, first, when no field holds it.
fn kind_entry(fields: &[WireField<'_>]) -> Option<TokenStream> {
    let napi = napi();
    (!fields.iter().any(|field| is_kind_key(field.key)))
        .then(|| quote!(::core::option::Option::Some((c"$type", #napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?))))
}

/// `{ $type, …fields }` in declaration order, defined in one call: an optional
/// field only when present.
fn struct_encode(ident: &Ident, fields: &[WireField<'_>]) -> syn::Result<TokenStream> {
    let napi = napi();
    let names = fields.iter().map(|field| field.ident);
    let entries = fields
        .iter()
        .map(|field| {
            let name = field.ident;
            let entry = field_entry(field, &quote!(#name))?;
            Ok(quote!(#entry,))
        })
        .collect::<syn::Result<Vec<_>>>()?;
    let kind = kind_entry(fields).map(|entry| quote!(#entry,));
    Ok(quote! {
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                let Self { #(#names),* } = val;
                unsafe {
                    ::sittir_core::boundary::object_with_present(env, &[
                        #kind
                        #(#entries)*
                    ])
                }
            }
        }
    })
}

/// A struct: decoded from an object field by field, encoded as one. One
/// with a child slot does both in a frame of its own; one without, whole.
pub fn structure(ident: &Ident, fields: &[WireField<'_>], height: Option<&Ident>) -> syn::Result<TokenStream> {
    if fields.iter().any(WireField::holds_nodes) {
        let height = height.ok_or_else(|| syn::Error::new_spanned(ident, "a node with a child slot keeps its height: `#[height] height: u16`"))?;
        return framed(ident, fields, height);
    }
    no_height(height)?;
    let napi = napi();
    let reads = field_reads(&ident.to_string(), &fields.iter().collect::<Vec<_>>())?;
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    let nodeless = nodeless(ident);
    let codec = gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                ::core::result::Result::Ok(Self { #(#reads)* })
            }
        }
        #encode
        #boxed
    });
    Ok(quote!(#codec #nodeless))
}

fn usize_lit(n: usize) -> Literal {
    Literal::usize_unsuffixed(n)
}

/// A struct with a child slot: its frames, which read and write it field by
/// field in declaration order, a child slot by the loop. A child's refusal is
/// decorated with the field that holds it, as napi's object derive does.
fn framed(ident: &Ident, fields: &[WireField<'_>], height: &Ident) -> syn::Result<TokenStream> {
    let (napi, w) = (napi(), grammar(ident));
    let owner = ident.to_string();
    let codec = quote!(::sittir_core::codec);
    let begun = quote!(::sittir_core::codec::Begun);
    let kind = kind_entry(fields);
    let offset = usize::from(kind.is_some());
    let entry_count = usize_lit(fields.len() + offset);
    let kind_first = kind.map(|entry| quote!(entries[0] = #entry;));
    let names: Vec<&Ident> = fields.iter().map(|field| field.ident).collect();
    let tys: Vec<&Type> = fields.iter().map(|field| field.ty).collect();
    let (mut decode_waits, mut encode_waits) = (Vec::new(), Vec::new());
    let (mut reads, mut resumes, mut refusals) = (Vec::new(), Vec::new(), Vec::new());
    let (mut writes, mut rewrites, mut parts) = (Vec::new(), Vec::new(), Vec::new());
    let (mut decode_releases, mut encode_releases) = (Vec::new(), Vec::new());
    let (mut decode_drops, mut encode_drops) = (Vec::new(), Vec::new());
    let (mut whole_writes, mut held) = (Vec::new(), Vec::new());
    for (index, field) in fields.iter().enumerate() {
        let (name, ty) = (field.ident, field.ty);
        let (at, slot) = (usize_lit(index), usize_lit(index + offset));
        let key = c_key(field.key)?;
        // SAFETY: a decoding frame writes its node's fields once each, in declaration order, and
        // `written` counts those written, so this one is still uninitialized.
        let write = |value: TokenStream| quote!(unsafe { ::core::ptr::addr_of_mut!((*frame.node.as_mut_ptr()).#name).write(#value) });
        // SAFETY: an encoding frame reads its node's fields once each, in declaration order, and
        // sets `read` past this one before anything can fail, so its release never drops it again.
        let take = quote!(unsafe { ::core::ptr::read(&frame.node.#name) });
        // SAFETY: a field below `written` was written, and only this release moves it out.
        let written_field = quote!(unsafe { ::core::ptr::read(::core::ptr::addr_of!((*self.node.as_ptr()).#name)) });
        // SAFETY: a field at or past `read` was never read, so it is still the frame's to drop.
        let unread_field = quote!(unsafe { ::core::ptr::read(&self.node.#name) });
        if !field.holds_nodes() {
            let read = field_read(&owner, field)?;
            let stored = write(quote!(value));
            reads.push(quote!(#at => {
                let value = #read;
                #stored;
                frame.written = #at + 1;
            }));
            let entry = field_entry(field, &quote!(value))?;
            writes.push(quote!(#at => {
                let value = #take;
                frame.read = #at + 1;
                frame.entries[#slot] = #entry;
            }));
            whole_writes.push(quote!({
                let value = #name;
                entries[#slot] = #entry;
            }));
            decode_drops.push(quote!(if #at < self.written {
                ::core::mem::drop(#written_field);
            }));
            encode_drops.push(quote!(if self.read <= #at {
                ::core::mem::drop(#unread_field);
            }));
            continue;
        }
        parts.push(quote!(#codec::Dismantle::<#w>::dismantle(self.#name, out);));
        held.push(quote!(#codec::Height::tallest(&self.#name)));
        decode_drops.push(quote!(if #at < self.written {
            #codec::Dismantle::<#w>::dismantle(#written_field, out);
        }));
        encode_drops.push(quote!(if self.read <= #at {
            #codec::Dismantle::<#w>::dismantle(#unread_field, out);
        }));
        let optional = is_option(ty);
        let inner = if optional { crate::expand::inner_of(ty, "Option").unwrap_or(ty) } else { ty };
        decode_waits.push(quote!(#name(<#inner as #codec::Codec<#w>>::DecodeWait)));
        decode_releases.push(quote!(__DecodeWait::#name(wait) => #codec::Dismantle::<#w>::dismantle(wait, out),));
        refusals.push(quote!(__DecodeWait::#name(_) => ::sittir_core::boundary::field_refusal(err, #owner, #key),));
        let stored = write(if optional { quote!(::core::option::Option::Some(value)) } else { quote!(value) });
        let read_on = quote! {
            match __begun.map_err(|err| ::sittir_core::boundary::field_refusal(err, #owner, #key))? {
                #begun::Whole(value) => {
                    #stored;
                    frame.written = #at + 1;
                }
                #begun::Waits(wait) => {
                    frame.wait = __DecodeWait::#name(wait);
                    return ::core::result::Result::Ok(#begun::Waits(()));
                }
            }
        };
        let absent = write(quote!(::core::option::Option::None));
        let read = if optional {
            quote!(#at => match unsafe { ::sittir_core::boundary::optional_raw(env, obj, #key)? } {
                ::core::option::Option::None => {
                    #absent;
                    frame.written = #at + 1;
                }
                ::core::option::Option::Some(raw) => {
                    let __begun = unsafe { <#inner as #codec::Codec<#w>>::decode(env, raw, above) };
                    #read_on
                }
            },)
        } else {
            quote!(#at => {
                let raw = unsafe { ::sittir_core::boundary::required_raw(env, obj, #key)? };
                let __begun = unsafe { <#inner as #codec::Codec<#w>>::decode(env, raw, above) };
                #read_on
            })
        };
        reads.push(read);
        resumes.push(quote!(__DecodeWait::#name(wait) => {
            let __begun = unsafe { <#inner as #codec::Codec<#w>>::decoded(env, wait, child, above) };
            #read_on
            frame.at = #at + 1;
        }));
        encode_waits.push(quote!(#name(<#inner as #codec::Codec<#w>>::EncodeWait)));
        encode_releases.push(quote!(__EncodeWait::#name(wait) => #codec::Dismantle::<#w>::dismantle(wait, out),));
        let write_on = quote! {
            match __begun? {
                #begun::Whole(value) => frame.entries[#slot] = ::core::option::Option::Some((#key, value)),
                #begun::Waits(wait) => {
                    frame.wait = __EncodeWait::#name(wait);
                    return ::core::result::Result::Ok(#begun::Waits(()));
                }
            }
        };
        let whole = quote!(entries[#slot] = ::core::option::Option::Some((#key, unsafe { <#inner as #codec::Codec<#w>>::encode_whole(value, env)? })));
        writes.push(if optional {
            quote!(#at => {
                let value = #take;
                frame.read = #at + 1;
                if let ::core::option::Option::Some(value) = value {
                    let __begun = unsafe { <#inner as #codec::Codec<#w>>::encode(value, env, above) };
                    #write_on
                }
            })
        } else {
            quote!(#at => {
                let value = #take;
                frame.read = #at + 1;
                let __begun = unsafe { <#inner as #codec::Codec<#w>>::encode(value, env, above) };
                #write_on
            })
        });
        whole_writes.push(if optional {
            quote!(if let ::core::option::Option::Some(value) = #name {
                #whole;
            })
        } else {
            quote!({
                let value = #name;
                #whole;
            })
        });
        rewrites.push(quote!(__EncodeWait::#name(wait) => {
            let __begun = unsafe { <#inner as #codec::Codec<#w>>::encoded(env, wait, child, above) };
            #write_on
            frame.at = #at + 1;
        }));
    }
    let whole = quote!(<#w as #codec::Nodes>::Whole);
    let decode_frame = quote!(<#w as #codec::Frames>::DecodeFrame);
    let encode_frame = quote!(<#w as #codec::Frames>::EncodeFrame);
    let take_apart = quote! {
        impl #codec::Dismantle<#w> for #ident {
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                out.push(<Self as #codec::Listed<#w>>::whole(self));
            }
        }
        impl #codec::Parts<#w> for #ident {
            fn parts(self, out: &mut ::std::vec::Vec<#whole>) {
                #(#parts)*
            }
        }
        impl #codec::Height for #ident {
            fn tallest(&self) -> ::core::option::Option<u16> {
                ::core::option::Option::Some(self.#height)
            }
        }
        impl #ident {
            /// The node of these fields, its height stamped from the nodes
            /// they hold.
            #[must_use]
            #[inline]
            #[allow(clippy::too_many_arguments, reason = "one argument per field of the node")]
            pub fn new(#(#names: #tys),*) -> Self {
                Self { #(#names,)* #height: 0 }.__stamped()
            }
            /// The node with its height stamped from the nodes it holds,
            /// as every build of it ends.
            fn __stamped(mut self) -> Self {
                self.#height = #codec::height_over([#(#held),*].into_iter().flatten().max());
                self
            }
        }
    };
    let steps = gated(&quote! {
        #[doc(hidden)]
        pub struct __Decoding {
            obj: #napi::sys::napi_value,
            at: usize,
            written: usize,
            wait: __DecodeWait,
            node: ::core::mem::MaybeUninit<#ident>,
        }
        #[doc(hidden)]
        #[allow(non_camel_case_types, reason = "a wait is named for the field it is read into")]
        pub enum __DecodeWait {
            None,
            #(#decode_waits,)*
        }
        #[doc(hidden)]
        pub struct __Encoding {
            at: usize,
            read: usize,
            wait: __EncodeWait,
            entries: [::core::option::Option<(&'static ::std::ffi::CStr, #napi::sys::napi_value)>; #entry_count],
            node: ::core::mem::ManuallyDrop<#ident>,
        }
        #[doc(hidden)]
        #[allow(non_camel_case_types, reason = "a wait is named for the field it is written from")]
        pub enum __EncodeWait {
            None,
            #(#encode_waits,)*
        }
        impl #codec::Dismantle<#w> for __Decoding {
            fn dismantle(mut self, out: &mut ::std::vec::Vec<#whole>) {
                #codec::Dismantle::<#w>::dismantle(::core::mem::replace(&mut self.wait, __DecodeWait::None), out);
                #(#decode_drops)*
            }
        }
        impl #codec::Dismantle<#w> for __DecodeWait {
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                match self {
                    #(#decode_releases)*
                    __DecodeWait::None => {}
                }
            }
        }
        impl #codec::Dismantle<#w> for __Encoding {
            fn dismantle(mut self, out: &mut ::std::vec::Vec<#whole>) {
                #codec::Dismantle::<#w>::dismantle(::core::mem::replace(&mut self.wait, __EncodeWait::None), out);
                #(#encode_drops)*
            }
        }
        impl #codec::Dismantle<#w> for __EncodeWait {
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                match self {
                    #(#encode_releases)*
                    __EncodeWait::None => {}
                }
            }
        }
        impl #codec::Steps<#w> for #ident {
            type Decoding = __Decoding;
            type Encoding = __Encoding;
            unsafe fn decode_step(
                frame: &mut __Decoding,
                env: #napi::sys::napi_env,
                child: ::core::option::Option<#whole>,
                above: &mut ::core::option::Option<#decode_frame>,
            ) -> #napi::Result<#begun<#whole, ()>> {
                if let ::core::option::Option::Some(child) = child {
                    match ::core::mem::replace(&mut frame.wait, __DecodeWait::None) {
                        #(#resumes)*
                        __DecodeWait::None => ::core::unreachable!("a frame is handed a child only while it waits on one"),
                    }
                }
                let obj = frame.obj;
                loop {
                    match frame.at {
                        #(#reads)*
                        _ => {
                            // SAFETY: the height is no wire field, so no step writes it: it is
                            // written here, once, before the node is read whole and stamped.
                            unsafe { ::core::ptr::addr_of_mut!((*frame.node.as_mut_ptr()).#height).write(0) };
                            frame.written = 0;
                            // SAFETY: the loop is past the last field and the height is written, so
                            // every field is, and `written` is zero, so a release of this frame drops
                            // none of them again.
                            let node = unsafe { frame.node.assume_init_read() };
                            return ::core::result::Result::Ok(#begun::Whole(<Self as #codec::Listed<#w>>::whole(node.__stamped())));
                        }
                    }
                    frame.at += 1;
                }
            }
            fn decode_refusal(frame: &__Decoding, err: #napi::Error) -> #napi::Error {
                match frame.wait {
                    #(#refusals)*
                    __DecodeWait::None => err,
                }
            }
            unsafe fn encode_step(
                frame: &mut __Encoding,
                env: #napi::sys::napi_env,
                child: ::core::option::Option<#napi::sys::napi_value>,
                above: &mut ::core::option::Option<#encode_frame>,
            ) -> #napi::Result<#begun<#napi::sys::napi_value, ()>> {
                if let ::core::option::Option::Some(child) = child {
                    match ::core::mem::replace(&mut frame.wait, __EncodeWait::None) {
                        #(#rewrites)*
                        __EncodeWait::None => ::core::unreachable!("a frame is handed a child only while it waits on one"),
                    }
                }
                loop {
                    match frame.at {
                        #(#writes)*
                        _ => return unsafe { ::sittir_core::boundary::object_with_present(env, &frame.entries) }.map(#begun::Whole),
                    }
                    frame.at += 1;
                }
            }
        }
        impl #codec::Codec<#w> for #ident {
            type DecodeWait = ();
            type EncodeWait = ();
            unsafe fn decode(env: #napi::sys::napi_env, value: #napi::sys::napi_value, above: &mut ::core::option::Option<#decode_frame>) -> #napi::Result<#begun<Self, ()>> {
                let obj = unsafe { ::sittir_core::boundary::object(env, value)? };
                *above = ::core::option::Option::Some(<Self as #codec::Framed<#w>>::decoding(__Decoding {
                    obj,
                    at: 0,
                    written: 0,
                    wait: __DecodeWait::None,
                    node: ::core::mem::MaybeUninit::uninit(),
                }));
                ::core::result::Result::Ok(#begun::Waits(()))
            }
            unsafe fn decoded(_: #napi::sys::napi_env, (): (), child: #whole, _: &mut ::core::option::Option<#decode_frame>) -> #napi::Result<#begun<Self, ()>> {
                ::core::result::Result::Ok(#begun::Whole(<Self as #codec::Listed<#w>>::of(child)))
            }
            unsafe fn encode(self, env: #napi::sys::napi_env, above: &mut ::core::option::Option<#encode_frame>) -> #napi::Result<#begun<#napi::sys::napi_value, ()>> {
                if self.#height < #codec::RECURSION_LIMIT {
                    return unsafe { <Self as #codec::Codec<#w>>::encode_whole(self, env) }.map(#begun::Whole);
                }
                let mut entries = [::core::option::Option::None; #entry_count];
                #kind_first
                *above = ::core::option::Option::Some(<Self as #codec::Framed<#w>>::encoding(__Encoding {
                    at: 0,
                    read: 0,
                    wait: __EncodeWait::None,
                    entries,
                    node: ::core::mem::ManuallyDrop::new(self),
                }));
                ::core::result::Result::Ok(#begun::Waits(()))
            }
            unsafe fn encoded(_: #napi::sys::napi_env, (): (), child: #napi::sys::napi_value, _: &mut ::core::option::Option<#encode_frame>) -> #napi::Result<#begun<#napi::sys::napi_value, ()>> {
                ::core::result::Result::Ok(#begun::Whole(child))
            }
            unsafe fn encode_whole(self, env: #napi::sys::napi_env) -> #napi::Result<#napi::sys::napi_value> {
                let Self { #(#names,)* .. } = self;
                let mut entries = [::core::option::Option::None; #entry_count];
                #kind_first
                #(#whole_writes)*
                unsafe { ::sittir_core::boundary::object_with_present(env, &entries) }
            }
        }
    });
    let entries = gated(&loop_entries(ident));
    Ok(quote!(#take_apart #steps #entries))
}

/// The module a kind constant lives in: the declared `kind` path less its
/// last segment, where the grammar's `kind_name_from_id` sits beside it.
fn kind_module(ident: &Ident, kind: Option<&Path>) -> syn::Result<Path> {
    let mut module = kind.cloned().ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf declares its kind: `#[node(kind = …)]`"))?;
    if module.segments.len() < 2 {
        return Err(syn::Error::new_spanned(
            &module,
            format!("{ident}'s kind names no module to find `kind_name_from_id` in: write it as `<kind_ids module>::<CONST>`"),
        ));
    }
    module.segments.pop();
    module.segments.pop_punct();
    Ok(module)
}

/// A text leaf: decoded from its text, from a bare kind id (its fixed text) or
/// from an object; encoded as a struct, so a leaf in a choice keeps its `$type`.
/// A leaf with no fixed text refuses a bare kind id, naming that id's kind
/// through `kind_name_from_id` in the module its `kind` constant lives in.
pub fn text_leaf(ident: &Ident, fields: &[WireField<'_>], fixed: Option<&LitStr>, kind: Option<&Path>, height: Option<&Ident>) -> syn::Result<TokenStream> {
    no_height(height)?;
    let napi = napi();
    let owner = ident.to_string();
    let text_key = fields
        .iter()
        .find(|field| field.ident == "text")
        .map(|field| c_key(field.key))
        .transpose()?
        .ok_or_else(|| syn::Error::new_spanned(ident, "a text leaf has a `text` field"))?;
    let others: Vec<&WireField<'_>> = fields.iter().filter(|field| field.ident != "text").collect();
    let defaults: Vec<TokenStream> = others
        .iter()
        .map(|field| {
            let name = field.ident;
            if is_kind_key(field.key) { quote!(#name: __KIND,) } else { quote!(#name: ::core::default::Default::default(),) }
        })
        .collect();
    let reads = field_reads(&owner, &others)?;
    let text_of_object = if let Some(text) = fixed { quote!(.unwrap_or_else(|| ::std::string::ToString::to_string(#text))) } else { quote! {
        .ok_or_else(|| #napi::Error::from_reason(::std::format!("{}: an object carries no `{}`, and the kind has no fixed text", #owner, #text_key.to_string_lossy())))?
    } };
    let number = if let Some(text) = fixed { quote! {
        #napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string(#text), #(#defaults)* }),
    } } else {
        let names = kind_module(ident, kind)?;
        quote! {
            #napi::ValueType::Number => {
                let id = unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                ::core::result::Result::Err(#napi::Error::from_reason(::std::format!(
                    "kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id",
                    #names::kind_name_from_id(id),
                    #owner
                )))
            }
        }
    };
    let encode = struct_encode(ident, fields)?;
    let boxed = boxed(ident);
    let nodeless = nodeless(ident);
    let codec = gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                match unsafe { ::sittir_core::slot::node_value_type(env, napi_val)? } {
                    #napi::ValueType::String => ::core::result::Result::Ok(Self {
                        text: unsafe { <::std::string::String as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? },
                        #(#defaults)*
                    }),
                    #number
                    #napi::ValueType::Object => {
                        let obj = unsafe { ::sittir_core::boundary::object(env, napi_val)? };
                        ::core::result::Result::Ok(Self {
                            text: unsafe { ::sittir_core::boundary::optional::<::std::string::String>(env, obj, #text_key, #owner)? }
                                #text_of_object,
                            #(#reads)*
                        })
                    }
                    _ => ::core::result::Result::Err(#napi::Error::from_reason(::std::format!(
                        "{}: expected a string, a kind id or an object, not a {}",
                        #owner,
                        unsafe { ::sittir_core::slot::js_type_name(env, napi_val)? }
                    ))),
                }
            }
        }
        #encode
        #boxed
    });
    Ok(quote!(#codec #nodeless))
}

/// A choice: an id resolves through the reader's `__variant`, then the
/// `decodes` ids, then the blank arm; any other id is refused. A payload is
/// read and written by its own codec, in the frame that holds the choice.
pub fn choice(ident: &Ident, variants: &[WireVariant<'_>]) -> syn::Result<TokenStream> {
    let (napi, w) = (napi(), grammar(ident));
    let codec = quote!(::sittir_core::codec);
    let begun = quote!(::sittir_core::codec::Begun);
    let owner = ident.to_string();
    let decoded = |name: &Ident, ty: &Type| {
        quote!(match unsafe { <#ty as #codec::Codec<#w>>::decode(env, napi_val, above)? } {
            #begun::Whole(value) => #begun::Whole(#ident::#name(value)),
            #begun::Waits(wait) => #begun::Waits(__DecodeWait::#name(wait)),
        })
    };
    let (mut by_index, mut by_decodes, mut encodes) = (Vec::new(), Vec::new(), Vec::new());
    let (mut whole_encodes, mut heights) = (Vec::new(), Vec::new());
    let (mut indices, mut claimed) = (Vec::new(), Vec::new());
    let (mut blank, mut error_arm, mut string_arm, mut text_arm) = (quote!(), quote!(), quote!(), quote!());
    let (mut decode_waits, mut encode_waits, mut resumes, mut rewrites, mut dismantles) = (Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new());
    let (mut decode_releases, mut encode_releases) = (Vec::new(), Vec::new());
    for variant in variants {
        let name = variant.name;
        let value = match variant.payload {
            Some(ty) => decoded(name, ty),
            None if variant.edged => quote!(#begun::Whole(#ident::#name(::core::default::Default::default()))),
            None => quote!(#begun::Whole(#ident::#name)),
        };
        if let Some(i) = variant.index {
            by_index.push(quote!(::core::option::Option::Some(#i) => return ::core::result::Result::Ok(#value),));
            indices.push(i);
        }
        if !variant.decodes.is_empty() {
            let ids = &variant.decodes;
            by_decodes.push(quote!(if [#(#ids),*].contains(&id) { return ::core::result::Result::Ok(#value); }));
            claimed.extend(ids.iter());
        }
        if variant.blank {
            blank = quote!(if id == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(#begun::Whole(#ident::#name)); });
        }
        if variant.verbatim || variant.error {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a verbatim variant holds its text"))?;
            let value = decoded(name, ty);
            error_arm = quote!(if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(#value); });
            if variant.verbatim {
                string_arm = quote!(#napi::ValueType::String => ::core::result::Result::Ok(#value),);
            }
        }
        if let Some(ids) = &variant.text {
            let ty = variant.payload.ok_or_else(|| syn::Error::new_spanned(name, "a text variant holds its text"))?;
            let value = decoded(name, ty);
            text_arm = quote! {
                if [#(#ids),*].contains(&id)
                    && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()
                {
                    return ::core::result::Result::Ok(#value);
                }
            };
        }
        if let Some(ty) = variant.payload {
            decode_waits.push(quote!(#name(<#ty as #codec::Codec<#w>>::DecodeWait)));
            encode_waits.push(quote!(#name(<#ty as #codec::Codec<#w>>::EncodeWait)));
            decode_releases.push(quote!(__DecodeWait::#name(wait) => #codec::Dismantle::<#w>::dismantle(wait, out),));
            encode_releases.push(quote!(__EncodeWait::#name(wait) => #codec::Dismantle::<#w>::dismantle(wait, out),));
            resumes.push(quote!(__DecodeWait::#name(wait) => ::core::result::Result::Ok(match unsafe { <#ty as #codec::Codec<#w>>::decoded(env, wait, child, above)? } {
                #begun::Whole(value) => #begun::Whole(#ident::#name(value)),
                #begun::Waits(wait) => #begun::Waits(__DecodeWait::#name(wait)),
            }),));
            rewrites.push(quote!(__EncodeWait::#name(wait) => ::core::result::Result::Ok(match unsafe { <#ty as #codec::Codec<#w>>::encoded(env, wait, child, above)? } {
                #begun::Whole(value) => #begun::Whole(value),
                #begun::Waits(wait) => #begun::Waits(__EncodeWait::#name(wait)),
            }),));
            dismantles.push(quote!(Self::#name(payload) => #codec::Dismantle::<#w>::dismantle(payload, out),));
        } else if variant.edged {
            dismantles.push(quote!(Self::#name(_) => {}));
        } else {
            dismantles.push(quote!(Self::#name => {}));
        }
        let unit = |id: TokenStream| quote!(unsafe { <::sittir_core::types::KindId as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, #id) });
        if let Some(ty) = variant.payload {
            encodes.push(quote!(Self::#name(payload) => ::core::result::Result::Ok(match unsafe { <#ty as #codec::Codec<#w>>::encode(payload, env, above)? } {
                #begun::Whole(value) => #begun::Whole(value),
                #begun::Waits(wait) => #begun::Waits(__EncodeWait::#name(wait)),
            }),));
            whole_encodes.push(quote!(Self::#name(payload) => unsafe { <#ty as #codec::Codec<#w>>::encode_whole(payload, env) },));
            heights.push(quote!(Self::#name(payload) => #codec::Height::tallest(payload),));
            continue;
        }
        let (arm, id) = match (variant.blank, &variant.first) {
            (true, _) => (quote!(Self::#name), unit(quote!(::sittir_core::types::KindId::BLANK))),
            (false, Some(first)) if variant.edged => (quote!(Self::#name(_)), unit(quote!(#first))),
            (false, Some(first)) => (quote!(Self::#name), unit(quote!(#first))),
            (false, None) => return Err(syn::Error::new_spanned(name, "a unit variant names the kind it writes: `#[kind(…)]`")),
        };
        encodes.push(quote!(#arm => #id.map(#begun::Whole),));
        whole_encodes.push(quote!(#arm => #id,));
        heights.push(quote!(#arm => ::core::option::Option::Some(0),));
    }
    let expected = if string_arm.is_empty() {
        format!("{owner}: expected u16 kind_id or object with $type")
    } else {
        format!("{owner}: expected u16 kind_id, string, or object with $type")
    };
    let missing = format!("$type property missing in {owner}");
    let mut decodes = Vec::new();
    if !indices.is_empty() {
        decodes.push(quote!(::core::matches!(__variant(id, id), ::core::option::Option::Some(#(#indices)|*))));
    }
    if !claimed.is_empty() {
        decodes.push(quote!([#(#claimed),*].contains(&id)));
    }
    if variants.iter().any(|variant| variant.blank) {
        decodes.push(quote!(id == ::sittir_core::types::KindId::BLANK));
    }
    let decodes = if decodes.is_empty() { quote!(false) } else { quote!(#(#decodes)||*) };
    let whole = quote!(<#w as #codec::Nodes>::Whole);
    let decode_frame = quote!(<#w as #codec::Frames>::DecodeFrame);
    let encode_frame = quote!(<#w as #codec::Frames>::EncodeFrame);
    let take_apart = quote! {
        impl #codec::Dismantle<#w> for #ident {
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                match self {
                    #(#dismantles)*
                }
            }
        }
        impl #codec::Parts<#w> for #ident {
            fn parts(self, out: &mut ::std::vec::Vec<#whole>) {
                #codec::Dismantle::<#w>::dismantle(self, out);
            }
        }
        impl #codec::Height for #ident {
            fn tallest(&self) -> ::core::option::Option<u16> {
                match self {
                    #(#heights)*
                }
            }
        }
    };
    let entries = loop_entries(ident);
    let items = gated(&quote! {
        impl ::sittir_core::boundary::DecodesKind for #ident {
            const OWNER: &'static str = #owner;
            fn decodes(id: __Kind) -> bool {
                #decodes
            }
        }
        #[doc(hidden)]
        pub enum __DecodeWait {
            #(#decode_waits,)*
        }
        #[doc(hidden)]
        pub enum __EncodeWait {
            #(#encode_waits,)*
        }
        impl #codec::Dismantle<#w> for __DecodeWait {
            #[allow(unused_variables, reason = "a choice with no node payload waits on nothing")]
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                match self {
                    #(#decode_releases)*
                }
            }
        }
        impl #codec::Dismantle<#w> for __EncodeWait {
            #[allow(unused_variables, reason = "a choice with no node payload waits on nothing")]
            fn dismantle(self, out: &mut ::std::vec::Vec<#whole>) {
                match self {
                    #(#encode_releases)*
                }
            }
        }
        unsafe fn __decode_id(
            env: #napi::sys::napi_env,
            napi_val: #napi::sys::napi_value,
            id: __Kind,
            above: &mut ::core::option::Option<#decode_frame>,
        ) -> #napi::Result<#begun<#ident, __DecodeWait>> {
            match __variant(id, id) {
                #(#by_index)*
                _ => {}
            }
            #(#by_decodes)*
            #blank
            ::core::result::Result::Err(#napi::Error::from_reason(::sittir_core::boundary::unknown_kind(id, #owner)))
        }
        ::sittir_core::nodeless_steps!(#ident; #w);
        impl #codec::Codec<#w> for #ident {
            type DecodeWait = __DecodeWait;
            type EncodeWait = __EncodeWait;
            unsafe fn decode(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value, above: &mut ::core::option::Option<#decode_frame>) -> #napi::Result<#begun<Self, __DecodeWait>> {
                match unsafe { ::sittir_core::slot::node_value_type(env, napi_val)? } {
                    #napi::ValueType::Number => {
                        let id = unsafe { <__Kind as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                        unsafe { __decode_id(env, napi_val, id, above) }
                    }
                    #napi::ValueType::Object => {
                        let id: __Kind = unsafe { ::sittir_core::boundary::property(env, napi_val, c"$type")? }
                            .ok_or_else(|| #napi::Error::from_reason(#missing))?;
                        #text_arm
                        #error_arm
                        unsafe { __decode_id(env, napi_val, id, above) }
                    }
                    #string_arm
                    _ => ::core::result::Result::Err(#napi::Error::from_reason(#expected)),
                }
            }
            #[allow(unused_variables, reason = "a choice of units waits on nothing")]
            unsafe fn decoded(env: #napi::sys::napi_env, wait: __DecodeWait, child: #whole, above: &mut ::core::option::Option<#decode_frame>) -> #napi::Result<#begun<Self, __DecodeWait>> {
                match wait {
                    #(#resumes)*
                }
            }
            unsafe fn encode(self, env: #napi::sys::napi_env, above: &mut ::core::option::Option<#encode_frame>) -> #napi::Result<#begun<#napi::sys::napi_value, __EncodeWait>> {
                match self {
                    #(#encodes)*
                }
            }
            #[allow(unused_variables, reason = "a choice of units waits on nothing")]
            unsafe fn encoded(env: #napi::sys::napi_env, wait: __EncodeWait, child: #napi::sys::napi_value, above: &mut ::core::option::Option<#encode_frame>) -> #napi::Result<#begun<#napi::sys::napi_value, __EncodeWait>> {
                match wait {
                    #(#rewrites)*
                }
            }
            unsafe fn encode_whole(self, env: #napi::sys::napi_env) -> #napi::Result<#napi::sys::napi_value> {
                match self {
                    #(#whole_encodes)*
                }
            }
        }
        #entries
    });
    Ok(quote!(#take_apart #items))
}

/// An enum kind: a member decodes from an id it claims and writes its first.
pub fn members(ident: &Ident) -> TokenStream {
    let napi = napi();
    let owner = ident.to_string();
    let boxed = boxed(ident);
    let nodeless = nodeless(ident);
    let codec = gated(&quote! {
        impl #napi::bindgen_prelude::FromNapiValue for #ident {
            unsafe fn from_napi_value(env: #napi::sys::napi_env, napi_val: #napi::sys::napi_value) -> #napi::Result<Self> {
                let id = unsafe { <__Kind as #napi::bindgen_prelude::FromNapiValue>::from_napi_value(env, napi_val)? };
                __member(id, id).ok_or_else(|| #napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", #owner)))
            }
        }
        impl #napi::bindgen_prelude::ToNapiValue for #ident {
            unsafe fn to_napi_value(env: #napi::sys::napi_env, val: Self) -> #napi::Result<#napi::sys::napi_value> {
                unsafe { <__Kind as #napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, __id(&val)) }
            }
        }
        #boxed
    });
    quote!(#codec #nodeless)
}

#[cfg(test)]
mod tests {
    use syn::parse_quote;

    fn expand(input: &syn::DeriveInput) -> String {
        crate::expand::derive(input).expect("expands").to_string().split_whitespace().collect()
    }

    fn has(out: &str, part: &str) -> bool {
        out.contains(&part.split_whitespace().collect::<String>())
    }

    #[test]
    fn a_struct_reads_and_writes_each_field_by_its_key() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::LET_DECLARATION)]
            pub struct LetDeclarationNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[height]
                height: u16,
                #[wire(key = "_pattern")]
                #[slot(field = field::PATTERN)]
                pub pattern: SlotValue<PatternNode>,
                #[wire(key = "_value")]
                #[slot(field = field::VALUE)]
                pub value: Option<SlotValue<ExpressionNode>>,
            }
        });
        assert!(has(&out, "::sittir_core::napi_codec! {"));
        assert!(has(&out, "let obj = unsafe { ::sittir_core::boundary::object(env, value)? };"));
        assert!(has(
            &out,
            r#"0 => { let value = unsafe { ::sittir_core::boundary::optional(env, obj, c"$_layout", "LetDeclarationNode")? };
                unsafe { ::core::ptr::addr_of_mut!((*frame.node.as_mut_ptr()).layout).write(value) }; frame.written = 0 + 1; }"#
        ));
        assert!(has(&out, "let value = unsafe { ::core::ptr::read(&frame.node.layout) }; frame.read = 0 + 1;"));
        assert!(has(&out, "if 1 < self.written {"));
        assert!(has(&out, "if self.read <= 1 {"));
        assert!(has(&out, r#"1 => { let raw = unsafe { ::sittir_core::boundary::required_raw(env, obj, c"_pattern")? };"#));
        assert!(has(&out, r#"2 => match unsafe { ::sittir_core::boundary::optional_raw(env, obj, c"_value")? }"#));
        assert!(has(&out, r#"__DecodeWait::pattern(_) => ::sittir_core::boundary::field_refusal(err, "LetDeclarationNode", c"_pattern"),"#));
        assert!(has(&out, r#"__DecodeWait::value(_) => ::sittir_core::boundary::field_refusal(err, "LetDeclarationNode", c"_value"),"#));
        assert!(has(&out, r#"entries[0] = ::core::option::Option::Some((c"$type", ::sittir_core::__napi::bindgen_prelude::ToNapiValue::to_napi_value(env, __KIND.0)?));"#));
        assert!(has(&out, r#"frame.entries[1] = ::sittir_core::boundary::present(env, c"$_layout", value)?;"#));
        assert!(has(&out, r#"frame.entries[2] = ::core::option::Option::Some((c"_pattern", value))"#));
        assert!(has(&out, r#"frame.entries[3] = ::core::option::Option::Some((c"_value", value))"#));
        assert!(has(&out, "::sittir_core::codec::decode::<<LetDeclarationNode as ::sittir_core::trivia::HasTrivia>::Trivia, Self>(env, napi_val)"));
        assert!(has(&out, "out.push(<Self as ::sittir_core::codec::Listed<<LetDeclarationNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::whole(self));"));
        assert!(has(&out, "impl ::sittir_core::__napi::bindgen_prelude::FromNapiValue for ::std::boxed::Box<LetDeclarationNode>"));
        assert!(has(
            &out,
            "self.height = ::sittir_core::codec::height_over([::sittir_core::codec::Height::tallest(&self.pattern), ::sittir_core::codec::Height::tallest(&self.value)].into_iter().flatten().max());"
        ));
        assert!(has(&out, "unsafe { ::core::ptr::addr_of_mut!((*frame.node.as_mut_ptr()).height).write(0) };"));
        assert!(has(&out, "whole(node.__stamped())"));
        assert!(has(
            &out,
            "if self.height < ::sittir_core::codec::RECURSION_LIMIT { return unsafe { <Self as ::sittir_core::codec::Codec<<LetDeclarationNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::encode_whole(self, env) }.map(::sittir_core::codec::Begun::Whole); }"
        ));
        assert!(has(&out, "let Self { layout, pattern, value, .. } = self;"));
        assert!(has(&out, r#"{ let value = layout; entries[1] = ::sittir_core::boundary::present(env, c"$_layout", value)?; }"#));
        assert!(has(
            &out,
            r#"if let ::core::option::Option::Some(value) = value { entries[3] = ::core::option::Option::Some((c"_value", unsafe { <SlotValue<ExpressionNode> as ::sittir_core::codec::Codec<<LetDeclarationNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::encode_whole(value, env)? })); }"#
        ));
    }

    #[test]
    fn a_node_keeps_a_height_exactly_when_it_has_a_child_slot() {
        let refusal = |input: &syn::DeriveInput| crate::expand::derive(input).expect_err("refused").to_string();
        let unstamped = refusal(&parse_quote! {
            #[node(kind = kind::LET_DECLARATION)]
            pub struct LetDeclarationNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_pattern")]
                #[slot(field = field::PATTERN)]
                pub pattern: SlotValue<PatternNode>,
            }
        });
        assert!(unstamped.contains("a node with a child slot keeps its height"), "{unstamped}");
        let leaf = refusal(&parse_quote! {
            #[node(kind = kind::COMMENT, interior = "^#(?<content>(?:.*))$")]
            pub struct CommentNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[height]
                height: u16,
                #[wire(key = "_content")]
                #[slot(capture = "content")]
                pub content: String,
                #[wire(key = "$verbatim")]
                #[slot]
                pub verbatim: Option<String>,
            }
        });
        assert!(leaf.contains("a node with no child slot is height 0 by its kind"), "{leaf}");
    }

    #[test]
    fn a_text_leaf_decodes_its_text_a_bare_kind_id_or_an_object() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::SELF, text = "self")]
            pub struct SelfNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        });
        assert!(has(&out, r#"::sittir_core::__napi::ValueType::Number => ::core::result::Result::Ok(Self { text: ::std::string::ToString::to_string("self"), layout: ::core::default::Default::default(), }),"#));
        assert!(has(&out, r#"::sittir_core::boundary::optional::<::std::string::String>(env, obj, c"$text", "SelfNode")"#));
        assert!(has(&out, r#".unwrap_or_else(|| ::std::string::ToString::to_string("self"))"#));
    }

    #[test]
    fn a_text_leaf_with_no_fixed_text_refuses_a_bare_kind_id() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::IDENTIFIER, text)]
            pub struct IdentifierNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        });
        assert!(has(
            &out,
            r#"::std::format!("kind id {id} ({:?}) has no fixed text: {} renders from a node, not a kind id", kind::kind_name_from_id(id), "IdentifierNode")"#
        ));
        assert!(has(&out, r#""{}: expected a string, a kind id or an object, not a {}", "IdentifierNode", unsafe { ::sittir_core::slot::js_type_name(env, napi_val)? }"#));
        assert!(has(&out, r"an object carries no `{}`, and the kind has no fixed text"));
    }

    #[test]
    fn a_text_leaf_whose_kind_names_no_module_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[node(kind = IDENTIFIER, text)]
            pub struct IdentifierNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "$text")]
                #[text]
                pub text: String,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a kind with no module");
        assert!(error.to_string().contains("IdentifierNode"));
        assert!(error.to_string().contains("kind_name_from_id"));
    }

    #[test]
    fn a_choice_decodes_the_ids_its_variants_claim_and_refuses_the_rest() {
        let out = expand(&parse_quote! {
            #[node(choice)]
            pub enum PropertyNodeSlot {
                #[kind(kind::_PROPERTY_IDENTIFIER, display, decodes(kind::GET_KEYWORD, kind::SET_KEYWORD))]
                PropertyIdentifier(PropertyIdentifierNode),
                #[kind(kind::PRIVATE_PROPERTY_IDENTIFIER)]
                PrivatePropertyIdentifier(PrivatePropertyIdentifierNode),
                #[node(blank)]
                Blank,
            }
        });
        assert!(has(&out, "match __variant(id, id) { ::core::option::Option::Some(0u16) => return"));
        assert!(has(&out, "if [kind::GET_KEYWORD, kind::SET_KEYWORD].contains(&id)"));
        assert!(has(&out, "if id == ::sittir_core::types::KindId::BLANK { return ::core::result::Result::Ok(::sittir_core::codec::Begun::Whole(PropertyNodeSlot::Blank)); }"));
        assert!(has(&out, "::sittir_core::codec::Begun::Waits(wait) => ::sittir_core::codec::Begun::Waits(__DecodeWait::PropertyIdentifier(wait)),"));
        assert!(has(&out, r#"::sittir_core::boundary::unknown_kind(id, "PropertyNodeSlot")"#));
        assert!(has(&out, "::core::matches!(__variant(id, id), ::core::option::Option::Some(0u16 | 1u16)) || [kind::GET_KEYWORD, kind::SET_KEYWORD].contains(&id) || id == ::sittir_core::types::KindId::BLANK"));
        assert!(!has(&out, "if let ::core::result::Result::Ok("));
    }

    #[test]
    fn a_unit_variant_writes_its_first_claimed_id_and_the_blank_arm_writes_zero() {
        let out = expand(&parse_quote! {
            #[node(choice)]
            pub enum StatementBlockTerminatorNodeSlot {
                #[kind(kind::_AUTOMATIC_SEMICOLON, kind::SEMI)]
                AutomaticSemicolon,
                #[node(blank)]
                Blank,
            }
        });
        assert!(has(&out, "Self::AutomaticSemicolon => unsafe { <::sittir_core::types::KindId as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, kind::_AUTOMATIC_SEMICOLON) }.map(::sittir_core::codec::Begun::Whole),"));
        assert!(has(&out, "Self::Blank => unsafe { <::sittir_core::types::KindId as ::sittir_core::__napi::bindgen_prelude::ToNapiValue>::to_napi_value(env, ::sittir_core::types::KindId::BLANK) }.map(::sittir_core::codec::Begun::Whole),"));
    }

    #[test]
    fn an_error_variant_decodes_an_error_object_and_no_bare_text() {
        let out = expand(&parse_quote! {
            #[node(choice, codec_only)]
            pub enum AnyNode {
                #[kind(kind::LINE_COMMENT)]
                LineComment(LineCommentNode),
                #[node(error)]
                Verbatim(VerbatimNode),
            }
        });
        assert!(has(&out, "if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(match unsafe { <VerbatimNode as ::sittir_core::codec::Codec<<AnyNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::decode(env, napi_val, above)? }"));
        assert!(has(&out, "::sittir_core::codec::Begun::Whole(value) => ::sittir_core::codec::Begun::Whole(AnyNode::Verbatim(value)),"));
        assert!(!has(&out, "ValueType::String =>"));
    }

    #[test]
    fn verbatim_and_text_variants_take_their_wire_forms_and_a_codec_only_choice_has_no_reader() {
        let out = expand(&parse_quote! {
            #[node(choice, codec_only)]
            pub enum TriviaNode {
                #[kind(kind::LINE_COMMENT)]
                LineComment(LineCommentNode),
                #[node(verbatim)]
                Verbatim(VerbatimNode),
                #[node(text)]
                #[kind(kind::LINE_COMMENT)]
                Text(::sittir_core::trivia::TriviaText),
            }
        });
        assert!(has(&out, "if id == ::sittir_core::types::KindId::ERROR { return ::core::result::Result::Ok(match unsafe { <VerbatimNode as ::sittir_core::codec::Codec<<TriviaNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::decode(env, napi_val, above)? }"));
        assert!(has(&out, "::sittir_core::__napi::ValueType::String => ::core::result::Result::Ok(match unsafe { <VerbatimNode as ::sittir_core::codec::Codec<<TriviaNode as ::sittir_core::trivia::HasTrivia>::Trivia>>::decode(env, napi_val, above)? }"));
        assert!(has(&out, r#"if [kind::LINE_COMMENT].contains(&id) && unsafe { ::sittir_core::boundary::property::<::std::string::String>(env, napi_val, c"$text")? }.is_some()"#));
        assert!(!has(&out, "::core::option::Option::Some(2u16)"));
        assert!(!out.contains("ReadNode"));
    }

    #[test]
    fn an_enum_kind_decodes_a_member_id_and_writes_its_first() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::_PRIMITIVE_TYPE, spelled)]
            pub enum PrimitiveTypeEnum {
                #[kind(kind::U8_KEYWORD)]
                U8,
                #[kind(kind::BOOL_KEYWORD)]
                Bool,
            }
        });
        assert!(has(&out, r#"__member(id, id).ok_or_else(|| ::sittir_core::__napi::Error::from_reason(::std::format!("kind id {id} is not a kind {} takes", "PrimitiveTypeEnum")))"#));
        assert!(has(&out, "PrimitiveTypeEnum::U8 => kind::U8_KEYWORD,"));
        assert!(has(&out, "to_napi_value(env, __id(&val))"));
    }

    #[test]
    fn a_struct_with_no_child_slot_is_decoded_whole_and_has_no_frame() {
        let out = expand(&parse_quote! {
            #[node(kind = kind::COMMENT, interior = "^#(?<content>(?:.*))$")]
            pub struct CommentNode {
                #[wire(key = "$_layout")]
                #[layout]
                pub layout: Option<Box<NodeLayout>>,
                #[wire(key = "_content")]
                #[slot(capture = "content")]
                pub content: String,
                #[wire(key = "$verbatim")]
                #[slot]
                pub verbatim: Option<String>,
            }
        });
        assert!(has(&out, r#"content: unsafe { ::sittir_core::boundary::required(env, obj, c"_content", "CommentNode")? },"#));
        assert!(has(&out, "::sittir_core::nodeless_codec!(CommentNode);"));
        assert!(has(&out, "::sittir_core::nodeless_steps!(CommentNode; <CommentNode as ::sittir_core::trivia::HasTrivia>::Trivia);"));
        assert!(has(&out, "impl ::sittir_core::codec::Height for CommentNode { fn tallest(&self) -> ::core::option::Option<u16> { ::core::option::Option::Some(0) } }"));
        assert!(!has(&out, "pub struct __Decoding"));
    }

    #[test]
    fn a_field_without_a_key_is_refused() {
        let input: syn::DeriveInput = parse_quote! {
            #[node(kind = kind::X)]
            pub struct XNode {
                #[slot(field = field::NAME)]
                pub name: SlotValue<IdentifierNode>,
            }
        };
        let error = crate::expand::derive(&input).expect_err("a field without a key");
        assert!(error.to_string().contains("crosses the wire under a key"));
    }
}

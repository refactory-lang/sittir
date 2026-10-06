//! Probe: what a transport attribute macro expands to. Not sittir code.
//!
//! `#[transport(kind = "function_item", layout = ["fn", "->"])]` on a struct whose fields carry
//! `#[slot(field = "name")]`, `#[slot(kinds = ["where_clause"], tokens = ["async"])]` or `#[trivia]`.
//! The expansion is mechanical: every decision (route, storage key, arity, word offset) is read
//! off the attributes and the field's declared type, in declaration order. It emits:
//!
//! - the struct again, with a `kind_id` field (`$type`), napi object and serde attributes whose
//!   storage keys are `_<field>` (`$trivia` for the trivia field);
//! - `ReadNode`: a one-level cursor reader, tree -> transport, with children as coordinates. A
//!   layout token is skipped; any other child no route takes refuses the read, naming the node's
//!   kind, the child's kind and its row;
//! - `Words`: the arena record writer and reader, fixed width per kind.
//!
//! In production the attributes would carry the parser's numeric field and kind ids, emitted by
//! codegen; the probe names them and resolves the names once per process.
use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{parse_macro_input, Expr, ExprArray, ExprLit, Fields, ItemStruct, Lit, LitStr, Type};

enum Shape {
    One,
    Opt,
    Many,
    Trivia,
}

struct Spec {
    ident: syn::Ident,
    key: String,
    shape: Shape,
    field: Option<String>,
    kinds: Vec<String>,
    tokens: Vec<String>,
}

fn strings(expr: Expr) -> syn::Result<Vec<String>> {
    match expr {
        Expr::Array(ExprArray { elems, .. }) => elems
            .into_iter()
            .map(|e| match e {
                Expr::Lit(ExprLit { lit: Lit::Str(s), .. }) => Ok(s.value()),
                other => Err(syn::Error::new_spanned(other, "expected a string")),
            })
            .collect(),
        other => Err(syn::Error::new_spanned(other, "expected an array of strings")),
    }
}

fn shape_of(ty: &Type, trivia: bool) -> Shape {
    if trivia {
        return Shape::Trivia;
    }
    if let Type::Path(p) = ty {
        if let Some(seg) = p.path.segments.last() {
            if seg.ident == "Option" {
                return Shape::Opt;
            }
            if seg.ident == "Vec" {
                return Shape::Many;
            }
        }
    }
    Shape::One
}

#[proc_macro_attribute]
pub fn transport(attr: TokenStream, item: TokenStream) -> TokenStream {
    let mut kind: Option<LitStr> = None;
    let mut layout: Vec<String> = Vec::new();
    let mut wire = String::from("all");
    let parser = syn::meta::parser(|meta| {
        if meta.path.is_ident("kind") {
            kind = Some(meta.value()?.parse()?);
            Ok(())
        } else if meta.path.is_ident("layout") {
            layout = strings(meta.value()?.parse()?)?;
            Ok(())
        } else if meta.path.is_ident("wire") {
            wire = meta.value()?.parse::<LitStr>()?.value();
            Ok(())
        } else {
            Err(meta.error("expected `kind = \"...\"`, `layout = [\"...\"]` or `wire = \"words|napi|json|all\"`"))
        }
    });
    parse_macro_input!(attr with parser);
    let kind = match kind {
        Some(k) => k,
        None => return syn::Error::new(proc_macro2::Span::call_site(), "missing kind").to_compile_error().into(),
    };
    let napi_on = wire == "all" || wire == "napi";
    let serde_on = wire == "all" || wire == "json";
    let mut s = parse_macro_input!(item as ItemStruct);
    let ident = s.ident.clone();
    let mut specs = Vec::new();
    let Fields::Named(named) = &mut s.fields else {
        return syn::Error::new_spanned(&s, "named fields only").to_compile_error().into();
    };
    for f in named.named.iter_mut() {
        let fid = f.ident.clone().expect("named");
        let mut field = None;
        let mut kinds = Vec::new();
        let mut tokens = Vec::new();
        let mut trivia = false;
        let mut err = None;
        f.attrs.retain(|a| {
            if a.path().is_ident("trivia") {
                trivia = true;
                return false;
            }
            if a.path().is_ident("slot") {
                let r = a.parse_nested_meta(|meta| {
                    if meta.path.is_ident("field") {
                        field = Some(meta.value()?.parse::<LitStr>()?.value());
                    } else if meta.path.is_ident("kinds") {
                        kinds = strings(meta.value()?.parse()?)?;
                    } else if meta.path.is_ident("tokens") {
                        tokens = strings(meta.value()?.parse()?)?;
                    } else {
                        return Err(meta.error("expected field, kinds or tokens"));
                    }
                    Ok(())
                });
                if let Err(e) = r {
                    err = Some(e);
                }
                return false;
            }
            true
        });
        if let Some(e) = err {
            return e.to_compile_error().into();
        }
        let key = if trivia { "$trivia".to_string() } else { format!("_{}", fid.to_string().trim_end_matches('_')) };
        let key_lit = LitStr::new(&key, proc_macro2::Span::call_site());
        if napi_on {
            f.attrs.push(syn::parse_quote!(#[napi(js_name = #key_lit)]));
        }
        if serde_on {
            f.attrs.push(syn::parse_quote!(#[serde(rename = #key_lit)]));
        }
        specs.push(Spec { ident: fid, key, shape: shape_of(&f.ty, trivia), field, kinds, tokens });
    }
    let kind_field: syn::Field = match (napi_on, serde_on) {
        (true, true) => syn::parse_quote!(#[napi(js_name = "$type")] #[serde(rename = "$type")] pub kind_id: u16),
        (true, false) => syn::parse_quote!(#[napi(js_name = "$type")] pub kind_id: u16),
        (false, true) => syn::parse_quote!(#[serde(rename = "$type")] pub kind_id: u16),
        (false, false) => syn::parse_quote!(pub kind_id: u16),
    };
    named.named.insert(0, kind_field);
    let napi_attr = if napi_on { quote!(#[::napi_derive::napi(object)]) } else { quote!() };
    let serde_derive = if serde_on { quote!(, ::serde::Serialize, ::serde::Deserialize) } else { quote!() };

    let vars: Vec<_> = specs.iter().map(|sp| format_ident!("v_{}", sp.ident)).collect();
    let idents: Vec<_> = specs.iter().map(|sp| sp.ident.clone()).collect();
    let inits: Vec<_> = specs
        .iter()
        .map(|sp| match sp.shape {
            Shape::One => quote!(crate::rt::Slot::Absent),
            Shape::Opt => quote!(None),
            Shape::Many | Shape::Trivia => quote!(Vec::new()),
        })
        .collect();
    let routed: Vec<_> = specs.iter().enumerate().filter(|(_, sp)| !matches!(sp.shape, Shape::Trivia)).collect();
    let arms: Vec<_> = routed
        .iter()
        .map(|(i, sp)| {
            let v = format_ident!("v_{}", sp.ident);
            let set = match sp.shape {
                Shape::One => quote!(#v = crate::rt::slot_at(cur, src)),
                Shape::Opt => quote!(#v = Some(crate::rt::slot_at(cur, src))),
                _ => quote!(#v.push(crate::rt::slot_at(cur, src))),
            };
            quote!(Some(#i) => { #set; })
        })
        .collect();
    let trivia_push = specs
        .iter()
        .find(|sp| matches!(sp.shape, Shape::Trivia))
        .map(|sp| {
            let v = format_ident!("v_{}", sp.ident);
            quote!(#v.push(crate::rt::coord_at(cur));)
        })
        .unwrap_or_default();
    let route_specs: Vec<_> = specs
        .iter()
        .map(|sp| {
            let field = match &sp.field {
                Some(f) => quote!(Some(#f)),
                None => quote!(None),
            };
            let kinds = &sp.kinds;
            let tokens = &sp.tokens;
            quote!(crate::rt::RouteSpec { field: #field, kinds: &[#(#kinds),*], tokens: &[#(#tokens),*] })
        })
        .collect();
    let width: u32 = 1 + specs.iter().map(|sp| match sp.shape {
        Shape::One | Shape::Opt => 5u32,
        Shape::Many | Shape::Trivia => 2,
    }).sum::<u32>();
    let writes: Vec<_> = specs
        .iter()
        .map(|sp| {
            let f = &sp.ident;
            match sp.shape {
                Shape::One => quote!(a.put_slot(at, &self.#f); at += 5;),
                Shape::Opt => quote!(a.put_opt(at, self.#f.as_ref()); at += 5;),
                Shape::Many => quote!(a.put_list(at, &self.#f); at += 2;),
                Shape::Trivia => quote!(a.put_coords(at, &self.#f); at += 2;),
            }
        })
        .collect();
    let reads: Vec<_> = specs
        .iter()
        .map(|sp| {
            let f = &sp.ident;
            match sp.shape {
                Shape::One => quote!(#f: { let v = a.slot(at); at += 5; v }),
                Shape::Opt => quote!(#f: { let v = a.opt(at); at += 5; v }),
                Shape::Many => quote!(#f: { let v = a.list(at); at += 2; v }),
                Shape::Trivia => quote!(#f: { let v = a.coords(at); at += 2; v }),
            }
        })
        .collect();
    let keys: Vec<_> = specs.iter().map(|sp| sp.key.clone()).collect();

    quote! {
        #napi_attr
        #[derive(Debug, Clone #serde_derive)]
        #s

        impl crate::rt::ReadNode for #ident {
            const KIND: &'static str = #kind;
            const LAYOUT: &'static [&'static str] = &[#(#layout),*];
            const KEYS: &'static [&'static str] = &[#(#keys),*];
            fn route_specs() -> &'static [crate::rt::RouteSpec] {
                const SPECS: &[crate::rt::RouteSpec] = &[#(#route_specs),*];
                SPECS
            }
            #[allow(unused_mut, unused_variables)]
            fn read(cur: &mut ::tree_sitter::TreeCursor<'_>, src: &[u8], routes: &crate::rt::Routes) -> Result<Self, crate::rt::Refusal> {
                let kind_id = cur.node().kind_id();
                #(let mut #vars = #inits;)*
                if cur.goto_first_child() {
                    loop {
                        let node = cur.node();
                        if node.is_extra() {
                            #trivia_push
                        } else if !routes.is_layout(node.kind_id()) {
                            match routes.slot_of(cur.field_id().map(|f| f.get()), node.kind_id()) {
                                #(#arms)*
                                _ => {
                                    return Err(crate::rt::Refusal {
                                        parent: kind_id,
                                        child: node.kind_id(),
                                        row: cur.descendant_index() as u32,
                                    })
                                }
                            }
                        }
                        if !cur.goto_next_sibling() {
                            break;
                        }
                    }
                    cur.goto_parent();
                }
                Ok(Self { kind_id, #(#idents: #vars),* })
            }
        }

        impl crate::rt::Words for #ident {
            const WIDTH: u32 = #width;
            #[allow(unused_assignments)]
            fn write_words(&self, a: &mut crate::rt::Arena) -> u32 {
                let off = a.words.len();
                a.words.resize(off + #width as usize, 0);
                a.words[off] = self.kind_id as u32;
                let mut at = off + 1;
                #(#writes)*
                off as u32
            }
            #[allow(unused_assignments)]
            fn read_words(a: &crate::rt::ArenaRef<'_>, off: u32) -> Self {
                let mut at = off as usize + 1;
                Self { kind_id: a.words[off as usize] as u16, #(#reads),* }
            }
        }
    }
    .into()
}

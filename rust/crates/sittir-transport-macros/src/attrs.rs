//! The helper attributes, parsed into plain values.

use syn::ext::IdentExt;
use syn::parse::ParseStream;
use syn::punctuated::Punctuated;
use syn::{Attribute, Ident, LitInt, LitStr, Path, Token};

/// `#[transport(…)]` on a struct, an enum or a variant.
#[derive(Default)]
pub struct KindAttrs {
    pub kind: Option<Path>,
    pub display: bool,
    pub choice: bool,
    pub spelled: bool,
    pub blank: bool,
    pub min_depth: Option<u32>,
    pub layout: Vec<Path>,
    pub gaps: Vec<(u16, String)>,
    /// `text`, or `text = "…"`: a leaf read as its text, with the fixed text
    /// it reads as when its span is empty or its tokens do not tile it.
    pub text: Option<Option<LitStr>>,
    pub interior: Option<LitStr>,
    pub envelope: bool,
    pub content: Option<Ident>,
    pub list: bool,
    pub item: Option<Ident>,
}

/// `#[slot]` or `#[slot(…)]` on a field.
#[derive(Default)]
pub struct SlotAttrs {
    pub fields: Vec<Path>,
    pub untagged: bool,
    pub presence: Option<Path>,
    pub separators: Vec<Path>,
    pub capture: Option<LitStr>,
    pub scalar: bool,
}

/// `#[kind(…)]` on a variant: the ids it claims, display ids when marked.
#[allow(dead_code)]
pub struct VariantKinds {
    pub kinds: Vec<Path>,
    pub display: bool,
}

/// `#[flank(leading = N, trailing = N)]`: the flanks a list's delimiter
/// flags check, each with the mandatory flank tokens on the other side.
#[derive(Default)]
pub struct FlankAttrs {
    pub leading: Option<u16>,
    pub trailing: Option<u16>,
}

/// `#[separator_kind(candidates = […], default = …)]`.
pub struct SeparatorKindAttrs {
    pub candidates: Vec<Path>,
    pub default: Option<Path>,
}

fn key(path: &Path) -> String {
    path.get_ident().map(Ident::to_string).unwrap_or_default()
}

/// `[PATH, …]`, or one `PATH`.
fn paths(input: ParseStream) -> syn::Result<Vec<Path>> {
    if input.peek(syn::token::Bracket) {
        let content;
        syn::bracketed!(content in input);
        Ok(Punctuated::<Path, Token![,]>::parse_terminated(&content)?.into_iter().collect())
    } else {
        Ok(vec![input.parse()?])
    }
}

pub fn kind_attrs(attrs: &[Attribute]) -> syn::Result<KindAttrs> {
    let mut out = KindAttrs::default();
    for attr in attrs.iter().filter(|a| a.path().is_ident("transport")) {
        attr.parse_nested_meta(|meta| {
            match key(&meta.path).as_str() {
                "kind" => out.kind = Some(meta.value()?.parse()?),
                "display" => out.display = true,
                "choice" => out.choice = true,
                "spelled" => out.spelled = true,
                "blank" => out.blank = true,
                "min_depth" => out.min_depth = Some(meta.value()?.parse::<LitInt>()?.base10_parse()?),
                "layout" => out.layout = paths(meta.value()?)?,
                "gap" => {
                    let content;
                    syn::parenthesized!(content in meta.input);
                    let preceding: u16 = content.parse::<LitInt>()?.base10_parse()?;
                    let slot = meta.value()?.call(Ident::parse_any)?;
                    out.gaps.push((preceding, slot.unraw().to_string()));
                }
                "text" => out.text = Some(if meta.input.peek(Token![=]) { Some(meta.value()?.parse()?) } else { None }),
                "interior" => out.interior = Some(meta.value()?.parse()?),
                "envelope" => out.envelope = true,
                "content" => out.content = Some(meta.value()?.parse()?),
                "list" => out.list = true,
                "item" => out.item = Some(meta.value()?.parse()?),
                _ => return Err(meta.error("unknown `transport` attribute")),
            }
            Ok(())
        })?;
    }
    Ok(out)
}

pub fn slot_attrs(attrs: &[Attribute]) -> syn::Result<Option<SlotAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("slot")) else { return Ok(None) };
    let mut out = SlotAttrs::default();
    if matches!(attr.meta, syn::Meta::Path(_)) {
        return Ok(Some(out));
    }
    attr.parse_nested_meta(|meta| {
        match key(&meta.path).as_str() {
            "field" => out.fields.extend(paths(meta.value()?)?),
            "untagged" => out.untagged = true,
            "presence" => out.presence = Some(meta.value()?.parse()?),
            "separator" => out.separators.extend(paths(meta.value()?)?),
            "capture" => out.capture = Some(meta.value()?.parse()?),
            "scalar" => out.scalar = true,
            _ => return Err(meta.error("unknown `slot` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

#[allow(dead_code)]
pub fn variant_kinds(attrs: &[Attribute]) -> syn::Result<Option<VariantKinds>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("kind")) else { return Ok(None) };
    let mut out = VariantKinds { kinds: Vec::new(), display: false };
    for path in attr.parse_args_with(Punctuated::<Path, Token![,]>::parse_terminated)? {
        if path.is_ident("display") {
            out.display = true;
        } else {
            out.kinds.push(path);
        }
    }
    if out.kinds.is_empty() {
        return Err(syn::Error::new_spanned(attr, "`kind` names at least one kind"));
    }
    Ok(Some(out))
}

pub fn flank_attrs(attrs: &[Attribute]) -> syn::Result<Option<FlankAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("flank")) else { return Ok(None) };
    let mut out = FlankAttrs::default();
    attr.parse_nested_meta(|meta| {
        let mandatory: u16 = meta.value()?.parse::<LitInt>()?.base10_parse()?;
        match key(&meta.path).as_str() {
            "leading" => out.leading = Some(mandatory),
            "trailing" => out.trailing = Some(mandatory),
            _ => return Err(meta.error("unknown `flank` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

pub fn separator_kind_attrs(attrs: &[Attribute]) -> syn::Result<Option<SeparatorKindAttrs>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("separator_kind")) else { return Ok(None) };
    let mut out = SeparatorKindAttrs { candidates: Vec::new(), default: None };
    attr.parse_nested_meta(|meta| {
        match key(&meta.path).as_str() {
            "candidates" => out.candidates = paths(meta.value()?)?,
            "default" => out.default = Some(meta.value()?.parse()?),
            _ => return Err(meta.error("unknown `separator_kind` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

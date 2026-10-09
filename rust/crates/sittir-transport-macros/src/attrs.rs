//! The helper attributes, parsed into plain values.

use syn::ext::IdentExt;
use syn::parse::ParseStream;
use syn::punctuated::Punctuated;
use syn::{Attribute, Ident, LitInt, LitStr, Meta, Path, Token};

/// `#[transport(…)]` on a struct, an enum or a variant.
#[derive(Default)]
pub struct KindAttrs {
    pub kind: Option<Path>,
    pub display: bool,
    pub choice: bool,
    pub spelled: bool,
    pub blank: bool,
    pub min_depth: Option<u32>,
    pub layout: Vec<TokenGroup>,
    pub folded: Vec<Path>,
    pub wraps_hidden: bool,
    pub gaps: Vec<(u16, String)>,
    /// `text`, or `text = "…"`: a leaf read as its text, with the fixed text
    /// it reads as when its span is empty or its tokens do not tile it.
    pub text: Option<Option<LitStr>>,
    pub interior: Option<LitStr>,
    pub envelope: bool,
    pub content: Option<Ident>,
    pub list: bool,
    pub item: Option<Ident>,
    /// On a variant: the arm bare text and an `ERROR` object decode as.
    pub verbatim: bool,
    /// On a choice: the wire codec alone, with no typed reader.
    pub codec_only: bool,
}

/// `#[slot]` or `#[slot(…)]` on a field.
#[derive(Default)]
pub struct SlotAttrs {
    pub fields: Vec<Path>,
    pub untagged: bool,
    pub presence: Option<Presence>,
    pub separators: Vec<TokenGroup>,
    pub capture: Option<LitStr>,
    pub scalar: bool,
}

/// `#[kind(…)]` on a variant: the ids it claims, display ids when marked.
pub struct VariantKinds {
    pub kinds: Vec<Path>,
    /// Kinds this variant matches by display id alone, written `display(PATH)`.
    pub shown: Vec<Path>,
    /// Raw symbols the grammar folds into a claimed kind, written
    /// `folded(PATH)`; matched by grammar id after every exact claim.
    pub folded: Vec<Path>,
    pub display: bool,
    /// Ids the codec also decodes as this variant, written `decodes(PATH, …)`;
    /// the reader ignores them.
    pub decodes: Vec<Path>,
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
    pub candidates: Vec<TokenGroup>,
    pub default: Option<Path>,
}

fn key(path: &Path) -> String {
    path.get_ident().map(Ident::to_string).unwrap_or_default()
}

/// One token a table names, written `KIND | RAW | …`: its kind, then each raw
/// symbol the grammar folds into that kind. A child is this token when its
/// grammar id is any of them; the kind is the id stored for it.
pub type TokenGroup = Vec<Path>;

fn token_group(input: ParseStream) -> syn::Result<TokenGroup> {
    Ok(Punctuated::<Path, Token![|]>::parse_separated_nonempty(input)?.into_iter().collect())
}

/// The keyword a presence slot reads: a token, matched by grammar id like any
/// table entry, or `display(KIND)`, an alias the site wraps the keyword in,
/// matched by the display id it shows.
pub enum Presence {
    Token(TokenGroup),
    Display(Path),
}

fn presence(input: ParseStream) -> syn::Result<Presence> {
    let fork = input.fork();
    if fork.call(Ident::parse_any).is_ok_and(|ident| ident == "display") && fork.peek(syn::token::Paren) {
        input.call(Ident::parse_any)?;
        let content;
        syn::parenthesized!(content in input);
        return Ok(Presence::Display(content.parse()?));
    }
    Ok(Presence::Token(token_group(input)?))
}

/// `[GROUP, …]`, or one `GROUP`.
fn token_groups(input: ParseStream) -> syn::Result<Vec<TokenGroup>> {
    if input.peek(syn::token::Bracket) {
        let content;
        syn::bracketed!(content in input);
        Ok(Punctuated::<TokenGroup, Token![,]>::parse_terminated_with(&content, token_group)?.into_iter().collect())
    } else {
        Ok(vec![token_group(input)?])
    }
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
                "layout" => out.layout = token_groups(meta.value()?)?,
                "folded" => out.folded = paths(meta.value()?)?,
                "wraps_hidden" => out.wraps_hidden = true,
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
                "verbatim" => out.verbatim = true,
                "codec_only" => out.codec_only = true,
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
            "presence" => out.presence = Some(presence(meta.value()?)?),
            "separator" => out.separators.extend(token_groups(meta.value()?)?),
            "capture" => out.capture = Some(meta.value()?.parse()?),
            "scalar" => out.scalar = true,
            _ => return Err(meta.error("unknown `slot` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

pub fn variant_kinds(attrs: &[Attribute]) -> syn::Result<Option<VariantKinds>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("kind")) else { return Ok(None) };
    let mut out = VariantKinds { kinds: Vec::new(), shown: Vec::new(), folded: Vec::new(), display: false, decodes: Vec::new() };
    for meta in attr.parse_args_with(Punctuated::<Meta, Token![,]>::parse_terminated)? {
        match meta {
            Meta::Path(path) if path.is_ident("display") => out.display = true,
            Meta::Path(path) => out.kinds.push(path),
            Meta::List(list) if list.path.is_ident("display") => out.shown.push(list.parse_args()?),
            Meta::List(list) if list.path.is_ident("folded") => out.folded.push(list.parse_args()?),
            Meta::List(list) if list.path.is_ident("decodes") => {
                out.decodes.extend(list.parse_args_with(Punctuated::<Path, Token![,]>::parse_terminated)?)
            }
            other => {
                return Err(syn::Error::new_spanned(
                    other,
                    "`kind` takes kinds, `display`, `display(kind)`, `folded(kind)` or `decodes(kind, …)`",
                ))
            }
        }
    }
    if out.kinds.is_empty() && out.shown.is_empty() {
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
            "candidates" => out.candidates = token_groups(meta.value()?)?,
            "default" => out.default = Some(meta.value()?.parse()?),
            _ => return Err(meta.error("unknown `separator_kind` attribute")),
        }
        Ok(())
    })?;
    Ok(Some(out))
}

/// `#[wire(key = "…")]` on a field: the key it crosses the wire under.
pub fn wire_key(attrs: &[Attribute]) -> syn::Result<Option<LitStr>> {
    let Some(attr) = attrs.iter().find(|a| a.path().is_ident("wire")) else { return Ok(None) };
    let mut key = None;
    attr.parse_nested_meta(|meta| {
        if meta.path.is_ident("key") {
            key = Some(meta.value()?.parse::<LitStr>()?);
            Ok(())
        } else {
            Err(meta.error("`wire` takes `key = \"…\"`"))
        }
    })?;
    key.map(Some).ok_or_else(|| syn::Error::new_spanned(attr, "`wire` names its key: `#[wire(key = \"…\")]`"))
}

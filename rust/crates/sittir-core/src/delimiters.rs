//! A composite's derived delimiters: the facets of its opening and closing
//! tokens that no caller spells (a string's quote, a raw string's `#` run),
//! filled or checked against the content they bound before the render.

use crate::prepare::{Prepare, RenderContext};
use crate::render::{Render, RenderError, RenderResult, RenderSink};
use crate::slot::SlotValue;
use crate::spacing::{LeafProbe, SpacingWriter, WordMatcher};
use crate::types::KindId;

/// One opening arm a derived delimiter may take, in preference order.
#[derive(Debug)]
pub struct DelimiterArm {
    pub text: &'static str,
    /// The arm cannot enclose a line break.
    pub single_line: bool,
}

/// How one composite derives its delimiters.
#[derive(Debug)]
pub struct DelimiterSpec {
    /// The composite's kind, named in a refusal.
    pub kind: &'static str,
    /// The arms of an enumerated delimiter, the preferred first; read-only
    /// members are not among them. Empty for a run.
    pub arms: &'static [DelimiterArm],
    /// The character a run delimiter repeats; `None` for an enumerated one.
    pub run: Option<char>,
    /// The closer's fixed text before its derived facet.
    pub close_lead: &'static str,
    /// The character that pairs with the one after it inside the content.
    pub escape: Option<char>,
    /// The leaves whose built text is free: each may hold none of `excluded`,
    /// the characters that open the composite's other content arms.
    pub free_text: &'static [FreeTextLeaf],
    pub excluded: &'static [(u32, u32)],
    /// The opener's spellings under which the free text is checked; `None`
    /// checks it under every opener. An opaque opener is always checked.
    pub gate: Option<&'static [&'static str]>,
}

/// A leaf of a composite's content whose built text is free.
#[derive(Debug)]
pub struct FreeTextLeaf {
    pub kind: KindId,
    pub name: &'static str,
}

/// A token that carries a derived delimiter facet.
pub trait DelimiterToken: Prepare {
    /// The facet's text, when the token holds one.
    fn facet(&self) -> Option<&str>;
    fn set_facet(&mut self, text: String);
    /// Content the token holds ahead of its facet (a closer's escape pairs).
    fn content(&self) -> Option<&str> {
        None
    }
    /// The token read as opaque text: its delimiters are its source's.
    fn opaque(&self) -> bool;
    /// The text of the facet that decides whether the content's free text is
    /// checked (a python string's prefix), when the token holds one.
    fn gate(&self) -> Option<&str> {
        None
    }
}

/// Why no delimiter fits a composite's content.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DelimiterRefusal {
    pub kind: &'static str,
    pub reason: String,
}

impl std::fmt::Display for DelimiterRefusal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.kind, self.reason)
    }
}

fn closes_early(content: &str, closer: &str, escape: Option<char>) -> bool {
    let text = format!("{content}{closer}");
    let mut chars = text.char_indices();
    while let Some((at, char)) = chars.next() {
        if at >= content.len() {
            return false;
        }
        if Some(char) == escape {
            match chars.next() {
                Some((next, _)) if next >= content.len() => return true,
                Some(_) => continue,
                None => return true,
            }
        }
        if text[at..].starts_with(closer) {
            return true;
        }
    }
    false
}

fn breaks_line(content: &str, escape: Option<char>) -> bool {
    let mut chars = content.chars().peekable();
    while let Some(char) = chars.next() {
        if Some(char) == escape {
            if chars.next() == Some('\r') {
                chars.next_if_eq(&'\n');
            }
        } else if char == '\n' || char == '\r' {
            return true;
        }
    }
    false
}

fn fits(spec: &DelimiterSpec, content: &str, facet: &str) -> bool {
    let breaks = breaks_line(content, spec.escape);
    if spec.arms.iter().any(|arm| arm.text == facet && arm.single_line && breaks) {
        return false;
    }
    !closes_early(content, &format!("{}{facet}", spec.close_lead), spec.escape)
}

/// The delimiter facet the content takes: the carried one while it still
/// fits, else the first arm that fits, or the shortest run.
pub fn choose(spec: &DelimiterSpec, content: &str, carried: Option<&str>) -> Result<String, DelimiterRefusal> {
    if let Some(carried) = carried.filter(|carried| fits(spec, content, carried)) {
        return Ok(carried.to_owned());
    }
    if let Some(run) = spec.run {
        return (0..=content.chars().count() + 1)
            .map(|n| run.to_string().repeat(n))
            .find(|facet| fits(spec, content, facet))
            .ok_or_else(|| DelimiterRefusal { kind: spec.kind, reason: format!("no delimiter fits its content: every run of `{run}` closes inside it") });
    }
    spec.arms
        .iter()
        .find(|arm| fits(spec, content, arm.text))
        .map(|arm| arm.text.to_owned())
        .ok_or_else(|| DelimiterRefusal { kind: spec.kind, reason: refusal_reason(spec, content) })
}

fn ends_unpaired(content: &str, escape: Option<char>) -> bool {
    escape.is_some_and(|escape| content.chars().rev().take_while(|&char| char == escape).count() % 2 == 1)
}

fn refusal_reason(spec: &DelimiterSpec, content: &str) -> String {
    if ends_unpaired(content, spec.escape) {
        return format!("no delimiter fits its content: it ends in an unpaired `{}`, which would escape any closer", spec.escape.unwrap_or_default());
    }
    format!(
        "no delimiter fits its content: each of {} occurs in it outside an escape pair, or cannot enclose its line break",
        spec.arms.iter().map(|arm| format!("`{}`", arm.text)).collect::<Vec<_>>().join(", ")
    )
}

fn read_token<T: Prepare, const ADJACENT: bool>(slot: &SlotValue<T, ADJACENT>, ctx: &RenderContext<'_>) -> Option<T> {
    let coord = slot.coord()?;
    let (tree, read) = ctx.sources.read_ctx(coord.tree)?;
    T::read_coordinate(tree, &read, coord.index)?.ok()
}

enum Held<T> {
    Built,
    Read(T),
    Unreadable,
}

fn held<T: DelimiterToken, const ADJACENT: bool>(slot: &SlotValue<T, ADJACENT>, ctx: &RenderContext<'_>) -> Held<T> {
    match slot {
        SlotValue::Node(_) => Held::Built,
        SlotValue::Coord(_) => read_token(slot, ctx).map_or(Held::Unreadable, Held::Read),
    }
}

fn token<'a, T: DelimiterToken, const ADJACENT: bool>(slot: &'a SlotValue<T, ADJACENT>, held: &'a Held<T>) -> Option<&'a T> {
    match held {
        Held::Built => slot.node(),
        Held::Read(node) => Some(node),
        Held::Unreadable => None,
    }
}

fn set<T: DelimiterToken, const ADJACENT: bool>(
    slot: &mut SlotValue<T, ADJACENT>,
    held: Held<T>,
    facet: &str,
    ctx: &RenderContext<'_>,
) -> Result<(), RenderError> {
    match (slot, held) {
        (SlotValue::Node(node), _) => {
            if node.facet() != Some(facet) {
                node.set_facet(facet.to_owned());
            }
            Ok(())
        }
        (slot, Held::Read(mut node)) if node.facet() != Some(facet) => {
            node.set_facet(facet.to_owned());
            node.prepare(ctx)?;
            *slot = SlotValue::Node(node);
            Ok(())
        }
        _ => Ok(()),
    }
}

struct Content<F>(F);

impl<F: Fn(&mut dyn RenderSink) -> RenderResult> Render for Content<F> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        (self.0)(w)
    }
}

fn checks_free_text<T: DelimiterToken>(spec: &DelimiterSpec, opener: &T) -> bool {
    !spec.free_text.is_empty()
        && spec.gate.is_none_or(|spellings| opener.opaque() || opener.gate().is_some_and(|gate| spellings.contains(&gate)))
}

fn rendered(content: &dyn Render, spec: &DelimiterSpec, checked: bool, ctx: &RenderContext<'_>) -> Result<String, RenderError> {
    let mut out = String::new();
    let probe = LeafProbe { leaves: if checked { spec.free_text } else { &[] }, excluded: spec.excluded };
    let mut w = SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_options(ctx.options).with_sources(ctx.sources).with_leaf_probe(probe);
    content.render(&mut w)?;
    w.finish()?;
    if let Some((leaf, char)) = w.leaf_probe_hit() {
        return Err(RenderError::Delimiter(DelimiterRefusal {
            kind: spec.kind,
            reason: format!("its built {} text holds `{char}`, which would open another part of it", leaf.name),
        }));
    }
    drop(w);
    Ok(out)
}

/// Fill or check a composite's derived delimiters against its content:
/// `content` renders what the delimiters bound, the closer's own content
/// following it.
pub fn fill<O: DelimiterToken, C: DelimiterToken, const OA: bool, const CA: bool>(
    open: &mut SlotValue<O, OA>,
    close: &mut SlotValue<C, CA>,
    spec: &DelimiterSpec,
    ctx: &RenderContext<'_>,
    content: impl Fn(&mut dyn RenderSink) -> RenderResult,
) -> Result<(), RenderError> {
    let open_held = held(open, ctx);
    let close_held = held(close, ctx);
    let (Some(opener), Some(closer)) = (token(open, &open_held), token(close, &close_held)) else { return Ok(()) };
    let rendered = rendered(&Content(content), spec, checks_free_text(spec, opener), ctx)?;
    if opener.opaque() || closer.opaque() {
        return Ok(());
    }
    let text = format!("{rendered}{}", closer.content().unwrap_or(""));
    let facet = choose(spec, &text, opener.facet()).map_err(RenderError::Delimiter)?;
    set(open, open_held, &facet, ctx)?;
    set(close, close_held, &facet, ctx)
}

#[cfg(test)]
mod tests {
    use super::*;

    const PYTHON: DelimiterSpec = DelimiterSpec {
        kind: "string",
        arms: &[
            DelimiterArm { text: "\"", single_line: true },
            DelimiterArm { text: "'", single_line: true },
            DelimiterArm { text: "\"\"\"", single_line: false },
            DelimiterArm { text: "'''", single_line: false },
        ],
        run: None,
        close_lead: "",
        escape: Some('\\'),
        free_text: &[],
        excluded: &[],
        gate: None,
    };

    const RAW: DelimiterSpec =
        DelimiterSpec { kind: "raw_string_literal", arms: &[], run: Some('#'), close_lead: "\"", escape: None, free_text: &[], excluded: &[], gate: None };

    #[test]
    fn the_preferred_arm_takes_content_it_fits() {
        assert_eq!(choose(&PYTHON, "abc", None).unwrap(), "\"");
    }

    #[test]
    fn a_quote_in_the_content_moves_to_the_next_arm() {
        assert_eq!(choose(&PYTHON, "a\"b", None).unwrap(), "'");
    }

    #[test]
    fn an_escaped_quote_does_not_occur() {
        assert_eq!(choose(&PYTHON, "a\\\"b", None).unwrap(), "\"");
    }

    #[test]
    fn a_line_break_takes_a_multiline_arm() {
        assert_eq!(choose(&PYTHON, "a\nb", None).unwrap(), "\"\"\"");
    }

    #[test]
    fn an_escaped_line_break_stays_on_one_line() {
        assert_eq!(choose(&PYTHON, "multiline \\\nstring", Some("\"")).unwrap(), "\"");
        assert_eq!(choose(&PYTHON, "a\\\r\nb", None).unwrap(), "\"");
        assert_eq!(choose(&PYTHON, "a\\\\\nb", None).unwrap(), "\"\"\"");
    }

    #[test]
    fn an_odd_trailing_escape_pairs_with_the_closer() {
        assert!(choose(&PYTHON, "a\\", None).is_err());
        assert_eq!(choose(&PYTHON, "a\\\\", None).unwrap(), "\"");
    }

    #[test]
    fn a_carried_arm_stays_while_it_fits() {
        assert_eq!(choose(&PYTHON, "abc", Some("'")).unwrap(), "'");
    }

    #[test]
    fn a_carried_arm_the_content_invalidates_falls_back() {
        assert_eq!(choose(&PYTHON, "it's", Some("'")).unwrap(), "\"");
    }

    #[test]
    fn a_quote_that_closes_against_the_closer_occurs() {
        assert_eq!(choose(&PYTHON, "a\"", Some("\"\"\"")).unwrap(), "'");
    }

    #[test]
    fn a_run_is_the_shortest_that_fits() {
        assert_eq!(choose(&RAW, "abc", None).unwrap(), "");
        assert_eq!(choose(&RAW, "a\"b", None).unwrap(), "#");
        assert_eq!(choose(&RAW, "a\"#b", None).unwrap(), "##");
    }

    #[test]
    fn a_carried_run_the_content_invalidates_grows() {
        assert_eq!(choose(&RAW, "x\"#y", Some("#")).unwrap(), "##");
        assert_eq!(choose(&RAW, "x", Some("##")).unwrap(), "##");
    }

    #[test]
    fn content_every_arm_closes_inside_is_refused_naming_the_kind() {
        let refusal = choose(&PYTHON, "a\\", None).unwrap_err();
        assert_eq!(refusal.kind, "string");
        assert!(refusal.reason.contains("unpaired `\\`"), "{}", refusal.reason);
    }
}

//! Resolved render options: one whitespace kind id per spacing site, one
//! bitflag per flank site, and the indentation unit.

/// One side of a kind's edge seam: the spacing site it occupies, the arm the
/// site's table holds by default, and the strength that default carries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeSlot {
    pub site: u16,
    pub default_arm: u16,
    pub strength: u8,
}

impl EdgeSlot {
    pub const NONE: Self = Self {
        site: u16::MAX,
        default_arm: 0,
        strength: 0,
    };
}

/// The seams a kind wraps around itself, from the generated site table: one
/// row per kind that owns edge seams, sorted by `kind`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeSite {
    pub kind: u16,
    pub before: EdgeSlot,
    pub after: EdgeSlot,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedOptions {
    /// Whitespace kind id per spacing site, in generated site order.
    pub spacing: Vec<u16>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
    /// The indentation unit the writer repeats once per depth after a newline.
    pub indent: String,
    /// The kinds that own edge seams, so a coordinate can meet the same edges a rendered node writes.
    pub edges: &'static [EdgeSite],
}

impl ResolvedOptions {
    /// The edge seams the resolved options give a node of `kind`, or none when the kind owns no edge site.
    pub fn edge_arms(&self, kind: crate::types::KindId) -> Option<crate::slot::CoordinateEdges> {
        let index = self.edges.binary_search_by_key(&kind.0, |e| e.kind).ok()?;
        let row = &self.edges[index];
        let arm_of = |slot: &EdgeSlot| {
            (slot.site != u16::MAX).then(|| {
                let arm = self.spacing[slot.site as usize];
                let strength = if arm == slot.default_arm {
                    slot.strength
                } else {
                    crate::spacing::SEAM_DECLARED
                };
                crate::slot::SeamArm { arm, strength }
            })
        };
        Some(crate::slot::CoordinateEdges {
            before: arm_of(&row.before),
            after: arm_of(&row.after),
        })
    }
}

impl Default for ResolvedOptions {
    fn default() -> Self {
        Self {
            spacing: Vec::new(),
            delimiter: Vec::new(),
            indent: crate::spacing::DEFAULT_INDENT.to_string(),
            edges: &[],
        }
    }
}

/// Refuse a napi object whose keys are not all in `allowed`: an address-keyed
/// deserializer's only defense against a typo, since napi otherwise drops an
/// unknown property silently.
#[cfg(feature = "napi-bindings")]
pub fn reject_unknown_keys(
    obj: &::napi::bindgen_prelude::Object,
    allowed: &[&str],
    at: &str,
) -> ::napi::Result<()> {
    for key in ::napi::bindgen_prelude::Object::keys(obj)? {
        if !allowed.contains(&key.as_str()) {
            let message = if at.is_empty() {
                format!("options: unknown key {key}")
            } else {
                format!("options: {at}/{key} names no site")
            };
            return Err(::napi::Error::from_reason(message));
        }
    }
    Ok(())
}

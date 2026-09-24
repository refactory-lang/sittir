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
    /// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
    pub sites: &'static [SiteSpec],
}

/// One spacing site's default arm and the strength a default carries into the writer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteSpec {
    pub default_arm: u16,
    pub strength: u8,
}

/// The two edges every transport carries in its base: arms only, since the
/// strength comes from the kind's edge row when the edge is written.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Edges {
    pub before: Option<u16>,
    pub after: Option<u16>,
}

/// A transport that carries its kind's edges in its base.
pub trait Edged {
    fn kind_id(&self) -> crate::types::KindId;
    fn edges(&self) -> &Edges;
    fn edges_mut(&mut self) -> &mut Edges;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Before,
    After,
}

impl ResolvedOptions {
    /// The edge seams the resolved options give a node of `kind`, or none when the kind owns no edge site.
    pub fn edge_arms(&self, kind: crate::types::KindId) -> Option<crate::slot::CoordinateEdges> {
        self.edge_row(kind)?;
        Some(crate::slot::CoordinateEdges {
            before: self.edge_arm(kind, Side::Before, None),
            after: self.edge_arm(kind, Side::After, None),
        })
    }

    /// A site's resolved arm, with the site's default strength when the arm is its default and declared strength otherwise.
    pub fn site_arm(&self, site: usize) -> crate::slot::SeamArm {
        let arm = self.spacing[site];
        let spec = &self.sites[site];
        crate::slot::SeamArm { arm, strength: Self::strength_of(arm, spec.default_arm, spec.strength) }
    }

    /// The arm one side of a kind's edge writes: the stamped arm when one is set, else the edge row's resolved arm.
    /// None when the kind owns no edge row or the row has no site on that side.
    pub fn edge_arm(
        &self,
        kind: crate::types::KindId,
        side: Side,
        stamped: Option<u16>,
    ) -> Option<crate::slot::SeamArm> {
        let row = self.edge_row(kind)?;
        let slot = match side {
            Side::Before => &row.before,
            Side::After => &row.after,
        };
        if slot.site == u16::MAX {
            return None;
        }
        let arm = stamped.unwrap_or(self.spacing[slot.site as usize]);
        Some(crate::slot::SeamArm { arm, strength: Self::strength_of(arm, slot.default_arm, slot.strength) })
    }

    fn edge_row(&self, kind: crate::types::KindId) -> Option<&EdgeSite> {
        let index = self.edges.binary_search_by_key(&kind.0, |e| e.kind).ok()?;
        Some(&self.edges[index])
    }

    fn strength_of(arm: u16, default_arm: u16, default_strength: u8) -> u8 {
        if arm == default_arm {
            default_strength
        } else {
            crate::spacing::SEAM_DECLARED
        }
    }
}

impl Default for ResolvedOptions {
    fn default() -> Self {
        Self {
            spacing: Vec::new(),
            delimiter: Vec::new(),
            indent: crate::spacing::DEFAULT_INDENT.to_string(),
            edges: &[],
            sites: &[],
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

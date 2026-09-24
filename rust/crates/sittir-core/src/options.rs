//! Resolved render options: one whitespace kind id per spacing site, one
//! bitflag per flank site, and the indentation unit.

#[cfg(feature = "napi-bindings")]
use napi_derive::napi;

/// The seams a kind wraps around itself: the spacing site on each side, or
/// `NO_SITE` when the kind owns no seam there.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeSite {
    pub before: u16,
    pub after: u16,
}

/// The cell of a kind-indexed site table for a kind that owns no site there.
pub const NO_SITE: u16 = u16::MAX;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedOptions {
    /// Per spacing site, in generated site order: the resolved arm and the strength it writes at.
    pub spacing: Vec<crate::slot::SeamArm>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
    /// The indentation unit the writer repeats once per depth after a newline.
    pub indent: String,
    /// The edge rows of the kinds that own edge seams.
    pub edges: &'static [EdgeSite],
    /// Per kind id, the index of its row in `edges`, or `NO_SITE`.
    pub edge_rows: &'static [u16],
    /// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
    pub sites: &'static [SiteSpec],
}

/// One spacing site's default arm and the strength a default carries into the writer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteSpec {
    pub default_arm: u16,
    pub strength: u8,
}

impl SiteSpec {
    /// `arm` at this site: the default's strength when it is the default, declared otherwise.
    pub fn seam(&self, arm: u16) -> crate::slot::SeamArm {
        let strength = if arm == self.default_arm { self.strength } else { crate::spacing::SEAM_DECLARED };
        crate::slot::SeamArm { arm, strength }
    }
}

/// The two edges every transport carries in its base: arms only, since the
/// strength comes from the kind's edge row when the edge is written.
#[cfg_attr(feature = "napi-bindings", napi(object))]
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Edges {
    pub before: Option<u16>,
    pub after: Option<u16>,
}

impl Edges {
    /// No edge set on either side: what a transport whose base carries no edges answers.
    pub const NONE: Edges = Edges { before: None, after: None };
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
    /// Every site at its default arm.
    pub fn default_spacing(sites: &[SiteSpec]) -> Vec<crate::slot::SeamArm> {
        sites.iter().map(|spec| spec.seam(spec.default_arm)).collect()
    }

    /// The edge seams the resolved options give a node of `kind`, or none when the kind owns no edge site.
    pub fn edge_arms(&self, kind: crate::types::KindId) -> Option<crate::slot::CoordinateEdges> {
        let row = self.edge_row(kind)?;
        Some(crate::slot::CoordinateEdges { before: self.edge_seam(row.before, None), after: self.edge_seam(row.after, None) })
    }

    pub fn site_arm(&self, site: usize) -> crate::slot::SeamArm {
        self.spacing[site]
    }

    /// Resolve `site` to `arm`, at the strength its spec gives that arm.
    pub fn set_arm(&mut self, site: usize, arm: u16) {
        self.spacing[site] = self.sites[site].seam(arm);
    }

    /// The arm one side of a kind's edge writes: the stamped arm when one is set, else the site's resolved arm.
    /// None when the kind owns no edge row or the row has no site on that side.
    pub fn edge_arm(
        &self,
        kind: crate::types::KindId,
        side: Side,
        stamped: Option<u16>,
    ) -> Option<crate::slot::SeamArm> {
        let row = self.edge_row(kind)?;
        self.edge_seam(match side { Side::Before => row.before, Side::After => row.after }, stamped)
    }

    fn edge_seam(&self, site: u16, stamped: Option<u16>) -> Option<crate::slot::SeamArm> {
        if site == NO_SITE {
            return None;
        }
        let site = site as usize;
        Some(match stamped {
            Some(arm) => self.sites[site].seam(arm),
            None => self.spacing[site],
        })
    }

    fn edge_row(&self, kind: crate::types::KindId) -> Option<&EdgeSite> {
        match self.edge_rows.get(kind.0 as usize) {
            Some(&row) if row != NO_SITE => Some(&self.edges[row as usize]),
            _ => None,
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
            edge_rows: &[],
            sites: &[],
        }
    }
}

/// One site an address leaf sets, with the site's canonical path for errors.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteRef {
    pub site: usize,
    pub path: &'static str,
}

/// One node of a grammar's address trie: a branch names the keys beneath it,
/// a leaf the sites its value sets.
#[derive(Debug)]
pub enum AddressNode {
    Branch { key: &'static str, path: &'static str, children: &'static [AddressNode] },
    Spacing { key: &'static str, sites: &'static [SiteRef] },
    Delimiter { key: &'static str, sites: &'static [SiteRef] },
}

impl AddressNode {
    fn key(&self) -> &'static str {
        match self {
            AddressNode::Branch { key, .. } | AddressNode::Spacing { key, .. } | AddressNode::Delimiter { key, .. } => key,
        }
    }
}

/// The generated facts an options object is read and resolved against.
pub struct OptionTables {
    pub addresses: &'static [AddressNode],
    pub allowed: fn(usize) -> &'static [u16],
    pub delimiter_allowed: fn(usize) -> u8,
    pub depth_sites: &'static [(&'static str, &'static [usize])],
    pub indent: u16,
    pub dedent: u16,
}

/// A grammar's option tables, named by a marker type.
pub trait OptionSites {
    const TABLES: OptionTables;
}

/// The view of a JS-shaped object the trie walk reads.
pub trait OptionObject: Sized {
    fn keys(&self) -> Result<Vec<String>, String>;
    fn object(&self, key: &str) -> Result<Option<Self>, String>;
    fn number(&self, key: &str) -> Result<Option<u32>, String>;
    fn string(&self, key: &str) -> Result<Option<String>, String>;
}

/// The settings an options object names, read through a grammar's address
/// trie and applied over a base table by `resolve`.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Options<S> {
    pub indent: Option<String>,
    pub spacing: Vec<(SiteRef, u32)>,
    pub delimiter: Vec<(SiteRef, u32)>,
    sites: ::std::marker::PhantomData<S>,
}

impl<S: OptionSites> Options<S> {
    pub fn read<O: OptionObject>(obj: &O) -> Result<Self, String> {
        let mut options = Self {
            indent: obj.string("indent")?,
            spacing: Vec::new(),
            delimiter: Vec::new(),
            sites: ::std::marker::PhantomData,
        };
        options.read_level(obj, S::TABLES.addresses, "")?;
        Ok(options)
    }

    fn read_level<O: OptionObject>(&mut self, obj: &O, nodes: &'static [AddressNode], at: &str) -> Result<(), String> {
        for key in obj.keys()? {
            if at.is_empty() && key == "indent" {
                continue;
            }
            let Some(node) = nodes.iter().find(|n| n.key() == key) else {
                return Err(if at.is_empty() {
                    format!("options: unknown key {key}")
                } else {
                    format!("options: {at}/{key} names no site")
                });
            };
            match node {
                AddressNode::Branch { path, children, .. } => {
                    if let Some(inner) = obj.object(&key)? {
                        self.read_level(&inner, children, path)?;
                    }
                }
                AddressNode::Spacing { sites, .. } => {
                    if let Some(value) = obj.number(&key)? {
                        self.spacing.extend(sites.iter().map(|site| (*site, value)));
                    }
                }
                AddressNode::Delimiter { sites, .. } => {
                    if let Some(value) = obj.number(&key)? {
                        self.delimiter.extend(sites.iter().map(|site| (*site, value)));
                    }
                }
            }
        }
        Ok(())
    }

    /// Apply the settings over `base`. A value a site does not admit, or an
    /// indent a kind's sites leave unbalanced, is an error naming it.
    pub fn resolve(&self, base: &ResolvedOptions) -> Result<ResolvedOptions, String> {
        let tables = S::TABLES;
        let mut table = base.clone();
        if let Some(indent) = &self.indent {
            table.indent = indent.clone();
        }
        for (site, value) in &self.spacing {
            let allowed = (tables.allowed)(site.site);
            match u16::try_from(*value) {
                Ok(id) if allowed.contains(&id) => table.set_arm(site.site, id),
                _ => return Err(format!("options: {} does not admit kind id {value} (allowed: {allowed:?})", site.path)),
            }
        }
        for (site, value) in &self.delimiter {
            let allowed = (tables.delimiter_allowed)(site.site);
            match u8::try_from(*value) {
                Ok(bits) if bits & !allowed == 0 => table.delimiter[site.site] = bits,
                _ => return Err(format!("options: {} does not admit delimiter {value} (allowed bits: {allowed})", site.path)),
            }
        }
        for (kind, sites) in tables.depth_sites {
            let mut depth = 0usize;
            for site in sites.iter() {
                let value = table.spacing[*site].arm;
                if tables.indent != 0 && value == tables.indent {
                    depth += 1;
                } else if tables.dedent != 0 && value == tables.dedent {
                    if depth == 0 {
                        return Err(format!("options: {kind} dedents an indent it never opened"));
                    }
                    depth -= 1;
                }
            }
            if depth != 0 {
                return Err(format!("options: {kind} opens an indent it never dedents"));
            }
        }
        Ok(table)
    }
}

impl OptionObject for ::serde_json::Map<String, ::serde_json::Value> {
    fn keys(&self) -> Result<Vec<String>, String> {
        Ok(self.keys().cloned().collect())
    }

    fn object(&self, key: &str) -> Result<Option<Self>, String> {
        match self.get(key) {
            None | Some(::serde_json::Value::Null) => Ok(None),
            Some(::serde_json::Value::Object(map)) => Ok(Some(map.clone())),
            Some(other) => Err(format!("options: {key} must be an object, not {other}")),
        }
    }

    fn number(&self, key: &str) -> Result<Option<u32>, String> {
        match self.get(key) {
            None | Some(::serde_json::Value::Null) => Ok(None),
            Some(value) => value
                .as_u64()
                .and_then(|v| u32::try_from(v).ok())
                .map(Some)
                .ok_or_else(|| format!("options: {key} must be a kind id, not {value}")),
        }
    }

    fn string(&self, key: &str) -> Result<Option<String>, String> {
        match self.get(key) {
            None | Some(::serde_json::Value::Null) => Ok(None),
            Some(::serde_json::Value::String(s)) => Ok(Some(s.clone())),
            Some(other) => Err(format!("options: {key} must be a string, not {other}")),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl OptionObject for ::napi::bindgen_prelude::Object<'_> {
    fn keys(&self) -> Result<Vec<String>, String> {
        ::napi::bindgen_prelude::Object::keys(self).map_err(|e| e.reason.clone())
    }

    fn object(&self, key: &str) -> Result<Option<Self>, String> {
        self.get::<Self>(key).map_err(|e| e.reason.clone())
    }

    fn number(&self, key: &str) -> Result<Option<u32>, String> {
        self.get::<u32>(key).map_err(|e| e.reason.clone())
    }

    fn string(&self, key: &str) -> Result<Option<String>, String> {
        self.get::<String>(key).map_err(|e| e.reason.clone())
    }
}

#[cfg(feature = "napi-bindings")]
impl<S: OptionSites> ::napi::bindgen_prelude::FromNapiValue for Options<S> {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
        Self::read(&obj).map_err(::napi::Error::from_reason)
    }
}

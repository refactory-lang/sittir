//! Resolved render options: one whitespace kind id per spacing site, one
//! bitflag per flank site, and the indentation unit.

use crate::types::{EdgeRow, FlankId, KindId, SiteId};

/// The seams a kind wraps around itself: the spacing site on each side, or
/// none when the kind owns no seam there.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeSite {
    pub before: Option<SiteId>,
    pub after: Option<SiteId>,
    /// Per arm token kind, the site its edge uses on the side before, when the
    /// kind's edge is a choice of tokens that resolve one by one.
    pub before_arms: &'static [ArmSite],
    /// As `before_arms`, for the side after.
    pub after_arms: &'static [ArmSite],
}

/// One arm of a token-set edge: the arm token's kind id and the spacing site
/// that arm's edge uses.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ArmSite {
    pub arm: KindId,
    pub site: SiteId,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedOptions {
    /// Per spacing site, in generated site order: the resolved arm and the strength it writes at.
    pub spacing: Vec<crate::slot::SeamArm>,
    /// `Delimiter` bitflag per flank site, in generated site order; 0 leaves the field unset.
    pub delimiter: Vec<u8>,
    /// The indentation unit the writer repeats once per depth after a newline.
    pub indent: String,
    /// The spelling every line break of a render takes.
    pub newline: String,
    /// The edge rows of the kinds that own edge seams.
    pub edges: &'static [EdgeSite],
    /// Per kind id, its row in `edges`, if it owns one.
    pub edge_rows: &'static [Option<EdgeRow>],
    /// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
    pub sites: &'static [SiteSpec],
    /// Per kind id, the kind's flags (`KIND_ANON`, `KIND_LINE_TERMINATED`, `KIND_LINE_BREAK_TERMINATED`, `KIND_ROOT`).
    pub kind_flags: &'static [u8],
    /// Per kind id of a wrapper, the way its seat passes through to the node
    /// it holds; none for any other kind (`prepare::fill_seated_gaps`).
    pub seat_wrappers: &'static [Option<SeatPath>],
}

/// How a wrapper's seat reaches the node it holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeatPath {
    /// Its first named child that is not an extra: the wrapper's unfielded content.
    Content,
    /// Its child tagged with the field.
    Field(crate::types::FieldId),
}

/// The parser's anonymous kind: a token, never an owner of trivia.
pub const KIND_ANON: u8 = 1;
/// A kind whose text ends only at a line break, and is not the end of an
/// enclosing kind that does: the node written after it starts a new line.
pub const KIND_LINE_TERMINATED: u8 = 2;
/// A kind whose rule ends in the grammar's declared newline token, which its
/// span leaves out, and is not the end of an enclosing kind that does: the
/// node written after it starts a new line.
pub const KIND_LINE_BREAK_TERMINATED: u8 = 4;
/// The grammar's root kind: its edges are the render's own flanks, written
/// at the start and the end of a render instead of dropped there.
pub const KIND_ROOT: u8 = 8;

/// One spacing site's default arm and the strength a default carries into the writer.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteSpec {
    pub default_arm: KindId,
    pub strength: u8,
}

impl SiteSpec {
    /// `arm` at this site: the default's strength when it is the default, declared otherwise.
    pub fn seam(&self, arm: KindId) -> crate::slot::SeamArm {
        let strength = if arm == self.default_arm { self.strength } else { crate::spacing::SEAM_DECLARED };
        crate::slot::SeamArm { arm, strength, dedent: false }
    }
}

/// One edge a transport carries: the arm, and the strength it writes at when
/// the stamp knows it. The render side stamps both, from the site that set the
/// edge (the kind's own edge site, or the seat of the list that holds the
/// node), so a seated gap writes at its own site's strength. A stamp without a
/// strength writes at the strength the kind's edge site gives that arm, which
/// is why the strength is optional.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EdgeArm {
    pub arm: KindId,
    pub strength: Option<u8>,
    /// Close a depth before the arm (`SeamArm::dedent`). The wire never
    /// sends it.
    pub dedent: Option<bool>,
}

impl From<crate::slot::SeamArm> for EdgeArm {
    fn from(seam: crate::slot::SeamArm) -> Self {
        EdgeArm { arm: seam.arm, strength: Some(seam.strength), dedent: seam.dedent.then_some(true) }
    }
}

/// The two edges every transport carries in its base. An unset side is
/// filled by `prepare_edges` from the kind's edge row, or by a seat.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Edges {
    pub before: Option<EdgeArm>,
    pub after: Option<EdgeArm>,
}

impl Edges {
    /// No edge set on either side: what a transport whose base carries no edges answers.
    pub const NONE: Edges = Edges { before: None, after: None };
}

/// A transport that carries its kind's edges in its base.
pub trait Edged {
    fn kind_id(&self) -> KindId;
    fn edges(&self) -> &Edges;
    fn edges_mut(&mut self) -> &mut Edges;

    /// The arm token each side's edge holds, for a kind whose edge is a
    /// choice of tokens; `None` on a side without one.
    fn edge_arm_kinds(
        &self,
        _ctx: &crate::prepare::RenderContext<'_>,
    ) -> (Option<KindId>, Option<KindId>) {
        (None, None)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Before,
    After,
}

impl Default for ResolvedOptions {
    fn default() -> Self {
        Self {
            spacing: Vec::new(),
            delimiter: Vec::new(),
            indent: String::new(),
            newline: "\n".to_string(),
            edges: &[],
            edge_rows: &[],
            sites: &[],
            kind_flags: &[],
            seat_wrappers: &[],
        }
    }
}

impl ResolvedOptions {
    /// Every site at its default arm.
    pub fn default_spacing(sites: &[SiteSpec]) -> Vec<crate::slot::SeamArm> {
        sites.iter().map(|spec| spec.seam(spec.default_arm)).collect()
    }

    /// The edge seams the resolved options give a node of `kind`, or none when the kind owns no edge site.
    pub fn edge_arms(&self, kind: KindId) -> Option<crate::slot::CoordinateEdges> {
        let row = self.edge_row(kind)?;
        Some(crate::slot::CoordinateEdges {
            before: row.before.and_then(|site| self.edge_seam(site, None)),
            after: row.after.and_then(|site| self.edge_seam(site, None)),
        })
    }

    pub fn site_arm(&self, site: SiteId) -> crate::slot::SeamArm {
        self.spacing[site.index()]
    }

    /// The `Delimiter` bitflag resolved for a flank site.
    pub fn delimiter_at(&self, site: FlankId) -> u8 {
        self.delimiter[site.index()]
    }

    /// Resolve `site` to an arm an options object names. A named arm writes at
    /// declared strength even when it is the site's default: the caller chose
    /// it, so it must win a seam merge the default would lose.
    pub fn set_arm(&mut self, site: SiteId, arm: KindId) {
        self.spacing[site.index()] = crate::slot::SeamArm { arm, strength: crate::spacing::SEAM_DECLARED, dedent: false };
    }

    /// What one side of a kind's edge writes: the stamp when one is set (at its
    /// own strength, or the site's spec strength for that arm when it carries
    /// none), else the site's resolved arm. None when the kind owns no edge row
    /// or the row has no site on that side.
    pub fn edge_arm(
        &self,
        kind: KindId,
        side: Side,
        stamped: Option<EdgeArm>,
        arm: Option<KindId>,
    ) -> Option<crate::slot::SeamArm> {
        let row = self.edge_row(kind)?;
        let (shared, arms) = match side {
            Side::Before => (row.before, row.before_arms),
            Side::After => (row.after, row.after_arms),
        };
        let site = arm.and_then(|arm| arms.iter().find(|a| a.arm == arm)).map_or(shared, |a| Some(a.site));
        self.edge_seam(site?, stamped)
    }

    /// The arms a kind's edge on `side` resolves one by one: empty when the
    /// edge has one site for every token.
    pub fn edge_arm_sites(&self, kind: KindId, side: Side) -> &'static [ArmSite] {
        match (self.edge_row(kind), side) {
            (Some(row), Side::Before) => row.before_arms,
            (Some(row), Side::After) => row.after_arms,
            (None, _) => &[],
        }
    }

    fn edge_seam(&self, site: SiteId, stamped: Option<EdgeArm>) -> Option<crate::slot::SeamArm> {
        let site = site.index();
        Some(match stamped {
            Some(EdgeArm { arm, strength: Some(strength), dedent }) => crate::slot::SeamArm { arm, strength, dedent: dedent == Some(true) },
            Some(EdgeArm { arm, strength: None, dedent }) => crate::slot::SeamArm { dedent: dedent == Some(true), ..self.sites[site].seam(arm) },
            None => self.spacing[site],
        })
    }

    /// Whether `kind` carries `flag` in the kind flag table.
    pub fn kind_has(&self, kind: KindId, flag: u8) -> bool {
        self.kind_flags.get(kind.index()).is_some_and(|flags| flags & flag != 0)
    }

    /// The spacing sites of `kind`'s edge row, before and after it: `None` on a
    /// side the row has no site, or when the kind owns no edge row.
    pub fn edge_sites(&self, kind: KindId) -> (Option<SiteId>, Option<SiteId>) {
        self.edge_row(kind).map_or((None, None), |row| (row.before, row.after))
    }

    fn edge_row(&self, kind: KindId) -> Option<&EdgeSite> {
        let row = (*self.edge_rows.get(kind.index())?)?;
        Some(&self.edges[row.index()])
    }
}

/// One site an address leaf sets, with the site's canonical path for errors:
/// a `SiteId` under a spacing leaf, a `FlankId` under a delimiter leaf.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiteRef<I> {
    pub site: I,
    pub path: &'static str,
}

/// One node of a grammar's address trie: a branch names the keys beneath it,
/// a leaf the sites its value sets.
#[derive(Debug)]
pub enum AddressNode {
    Branch { key: &'static str, path: &'static str, children: &'static [AddressNode] },
    Spacing { key: &'static str, sites: &'static [SiteRef<SiteId>] },
    Delimiter { key: &'static str, sites: &'static [SiteRef<FlankId>] },
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
    pub allowed: fn(SiteId) -> &'static [KindId],
    pub delimiter_allowed: fn(FlankId) -> u8,
    pub depth_sites: &'static [(&'static str, &'static [SiteId])],
    pub indent: KindId,
    pub dedent: KindId,
    /// The characters an `indent` unit may be made of: the texts of the
    /// admitted `_space` and `_tab` whitespace members. Empty when the
    /// grammar admits neither, and then `indent` is not an option.
    pub indent_chars: &'static str,
    /// The spellings of one line break a render may take: the arms of the
    /// `_newline` whitespace member. Empty when the grammar admits no
    /// `_newline`, and then `newline` is not an option.
    pub newline_arms: &'static [&'static str],
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
    /// Whether `key` is present and set to `null`, which names a site's blank arm.
    fn is_null(&self, key: &str) -> Result<bool, String>;
}

/// The key of the group holding the whole-render settings.
pub const LAYOUT_KEY: &str = "layout";

/// The settings an options object names, read through a grammar's address
/// trie and applied over a base table by `resolve`.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Options<S> {
    pub indent: Option<String>,
    pub newline: Option<String>,
    pub spacing: Vec<(SiteRef<SiteId>, u32)>,
    pub delimiter: Vec<(SiteRef<FlankId>, u32)>,
    sites: ::std::marker::PhantomData<S>,
}

impl<S: OptionSites> Options<S> {
    pub fn read<O: OptionObject>(obj: &O) -> Result<Self, String> {
        let mut options = Self {
            indent: None,
            newline: None,
            spacing: Vec::new(),
            delimiter: Vec::new(),
            sites: ::std::marker::PhantomData,
        };
        options.read_layout(obj)?;
        options.read_level(obj, S::TABLES.addresses, "")?;
        Ok(options)
    }

    /// The `layout` group: the settings of the whole render, `indent` and
    /// `newline`, each only where the grammar admits it.
    fn read_layout<O: OptionObject>(&mut self, obj: &O) -> Result<(), String> {
        let tables = S::TABLES;
        if !self.has_layout() {
            return Ok(());
        }
        let Some(layout) = obj.object(LAYOUT_KEY)? else { return Ok(()) };
        for key in layout.keys()? {
            match key.as_str() {
                "indent" if !tables.indent_chars.is_empty() => self.indent = layout.string(&key)?,
                "newline" if !tables.newline_arms.is_empty() => self.newline = layout.string(&key)?,
                _ => return Err(format!("options: unknown key {LAYOUT_KEY}/{key}")),
            }
        }
        Ok(())
    }

    fn has_layout(&self) -> bool {
        !S::TABLES.indent_chars.is_empty() || !S::TABLES.newline_arms.is_empty()
    }

    fn read_level<O: OptionObject>(&mut self, obj: &O, nodes: &'static [AddressNode], at: &str) -> Result<(), String> {
        for key in obj.keys()? {
            if at.is_empty() && key == LAYOUT_KEY && self.has_layout() {
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
                    let value = if obj.is_null(&key)? { Some(u32::from(KindId::BLANK.get())) } else { obj.number(&key)? };
                    if let Some(value) = value {
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
            if indent.is_empty() || !indent.chars().all(|c| tables.indent_chars.contains(c)) {
                return Err(format!(
                    "options: indent {indent:?} is not a unit of {:?} (one or more of them)",
                    tables.indent_chars.chars().collect::<Vec<_>>()
                ));
            }
            table.indent = indent.clone();
        }
        if let Some(newline) = &self.newline {
            if !tables.newline_arms.contains(&newline.as_str()) {
                let arms = tables.newline_arms.iter().map(|arm| format!("'{}'", arm.escape_default())).collect::<Vec<_>>().join(", ");
                return Err(format!("options: newline {newline:?} is not one of [{arms}]"));
            }
            table.newline = newline.clone();
        }
        for (site, value) in &self.spacing {
            let allowed = (tables.allowed)(site.site);
            match u16::try_from(*value).map(KindId) {
                Ok(id) if allowed.contains(&id) => table.set_arm(site.site, id),
                _ => {
                    let allowed = allowed.iter().map(ToString::to_string).collect::<Vec<_>>().join(", ");
                    return Err(format!("options: {} does not admit kind id {value} (allowed: [{allowed}])", site.path));
                }
            }
        }
        for (site, value) in &self.delimiter {
            let allowed = (tables.delimiter_allowed)(site.site);
            match u8::try_from(*value) {
                Ok(bits) if bits & !allowed == 0 => table.delimiter[site.site.index()] = bits,
                _ => return Err(format!("options: {} does not admit delimiter {value} (allowed bits: {allowed})", site.path)),
            }
        }
        for (kind, sites) in tables.depth_sites {
            let mut depth = 0usize;
            for site in sites.iter() {
                let value = table.spacing[site.index()].arm;
                if tables.indent != KindId::BLANK && value == tables.indent {
                    depth += 1;
                } else if tables.dedent != KindId::BLANK && value == tables.dedent {
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
                .as_f64()
                .ok_or_else(|| format!("options: {key} must be a kind id, not {value}"))
                .and_then(|v| option_number(key, v))
                .map(Some),
        }
    }

    fn string(&self, key: &str) -> Result<Option<String>, String> {
        match self.get(key) {
            None | Some(::serde_json::Value::Null) => Ok(None),
            Some(::serde_json::Value::String(s)) => Ok(Some(s.clone())),
            Some(other) => Err(format!("options: {key} must be a string, not {other}")),
        }
    }

    fn is_null(&self, key: &str) -> Result<bool, String> {
        Ok(matches!(self.get(key), Some(::serde_json::Value::Null)))
    }
}

/// Whether a JSON-shaped number is a kind id or bitflag: a whole number that fits a `u32`.
pub fn option_number(key: &str, value: f64) -> Result<u32, String> {
    if value.fract() == 0.0 && (0.0..=u32::MAX as f64).contains(&value) {
        Ok(value as u32)
    } else {
        Err(format!("options: {key} must be a kind id, not {value}"))
    }
}

#[cfg(feature = "napi-bindings")]
impl OptionObject for ::napi::bindgen_prelude::Object<'_> {
    fn keys(&self) -> Result<Vec<String>, String> {
        ::napi::bindgen_prelude::Object::keys(self).map_err(|e| e.reason.clone())
    }

    fn object(&self, key: &str) -> Result<Option<Self>, String> {
        self.get::<Option<Self>>(key).map(Option::flatten).map_err(|e| e.reason.clone())
    }

    fn number(&self, key: &str) -> Result<Option<u32>, String> {
        let value = self.get::<Option<f64>>(key).map(Option::flatten).map_err(|e| e.reason.clone())?;
        value.map(|v| option_number(key, v)).transpose()
    }

    fn string(&self, key: &str) -> Result<Option<String>, String> {
        self.get::<Option<String>>(key).map(Option::flatten).map_err(|e| e.reason.clone())
    }

    fn is_null(&self, key: &str) -> Result<bool, String> {
        let value = self.get::<::napi::Unknown>(key).map_err(|e| e.reason.clone())?;
        match value {
            None => Ok(false),
            Some(value) => value.get_type().map(|t| t == ::napi::ValueType::Null).map_err(|e| e.reason.clone()),
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<S: OptionSites> ::napi::bindgen_prelude::FromNapiValue for Options<S> {
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        let obj = unsafe { ::napi::bindgen_prelude::Object::from_napi_value(env, napi_val)? };
        Self::read(&obj).map_err(::napi::Error::from_reason)
    }
}

/// The indentation unit of `source`, from its indent steps.
///
/// A step is the leading whitespace a non-blank line adds on top of the
/// previous non-blank line's (when it extends it). The most frequent step is
/// the unit, so nesting depth never votes: a two-space file nested four deep
/// still steps by two spaces. `None` when the source never indents or when
/// two steps tie; otherwise the unit, whatever whitespace it is made of.
pub fn indent_unit(source: &str) -> Option<String> {
    let mut steps: Vec<(&str, usize)> = Vec::new();
    let mut previous = "";
    for line in source.lines() {
        let body = line.trim_start_matches([' ', '\t']);
        if body.is_empty() {
            continue;
        }
        let leading = &line[..line.len() - body.len()];
        if leading.len() > previous.len() && leading.starts_with(previous) {
            let step = &leading[previous.len()..];
            match steps.iter_mut().find(|(s, _)| *s == step) {
                Some((_, count)) => *count += 1,
                None => steps.push((step, 1)),
            }
        }
        previous = leading;
    }
    let top = steps.iter().map(|(_, count)| *count).max()?;
    let mut leaders = steps.iter().filter(|(_, count)| *count == top);
    let (unit, _) = leaders.next()?;
    if leaders.next().is_some() {
        return None;
    }
    Some(unit.to_string())
}

/// What a parse reads off its source's layout, as render options: the
/// tree's layer of the precedence, which a render of the tree resolves over
/// the engine's options and under the call's own. Each entry is one the
/// source sets apart from the options it was read against: the indentation
/// unit (`indent_unit`), and the arm of each of the root's edges
/// that the source's whitespace at the file's start and end classifies to.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct InferredOptions {
    pub indent: Option<String>,
    pub edges: Vec<(SiteId, KindId)>,
}

impl InferredOptions {
    /// The layer `source`, whose root is of `root`, sets apart from `base`.
    pub fn infer(source: &str, root: KindId, base: &ResolvedOptions, tables: &OptionTables, whitespace: &crate::render::WhitespaceTable) -> Self {
        let indent = indent_unit(source).filter(|unit| *unit != base.indent);
        let (before, after) = base.edge_sites(root);
        let leading = &source[..source.len() - source.trim_start().len()];
        let trailing = &source[source.trim_end().len()..];
        let edges = [(before, leading), (after, trailing)]
            .into_iter()
            .filter_map(|(site, ws)| {
                let site = site?;
                let arm = crate::classify::classify_whitespace(ws, (tables.allowed)(site), whitespace)?;
                (arm != base.spacing[site.index()].arm).then_some((site, arm))
            })
            .collect();
        InferredOptions { indent, edges }
    }

    /// `base` with this layer's entries resolved over it.
    pub fn over(&self, base: &ResolvedOptions) -> ResolvedOptions {
        let mut table = base.clone();
        if let Some(indent) = &self.indent {
            table.indent = indent.clone();
        }
        for &(site, arm) in &self.edges {
            table.set_arm(site, arm);
        }
        table
    }

    /// The layer as the options object a render takes: `layout.indent`, and
    /// each edge under its site's address.
    pub fn to_json(&self, tables: &OptionTables) -> serde_json::Value {
        let mut root = serde_json::Map::new();
        if let Some(indent) = &self.indent {
            root.insert(LAYOUT_KEY.to_owned(), serde_json::json!({ "indent": indent }));
        }
        for &(site, arm) in &self.edges {
            let Some(path) = address_of(tables.addresses, site) else { continue };
            let mut level = &mut root;
            for key in &path[..path.len() - 1] {
                level = level
                    .entry((*key).to_owned())
                    .or_insert_with(|| serde_json::Value::Object(serde_json::Map::new()))
                    .as_object_mut()
                    .expect("an address branch is an object");
            }
            level.insert(path[path.len() - 1].to_owned(), serde_json::json!(arm));
        }
        serde_json::Value::Object(root)
    }
}

/// The keys that address `site` alone, from the root of `nodes`.
fn address_of(nodes: &'static [AddressNode], site: SiteId) -> Option<Vec<&'static str>> {
    nodes.iter().find_map(|node| match node {
        AddressNode::Spacing { key, sites: [only] } if only.site == site => Some(vec![*key]),
        AddressNode::Branch { key, children, .. } => address_of(children, site).map(|mut path| {
            path.insert(0, *key);
            path
        }),
        _ => None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_unit_is_the_step_a_line_adds_whatever_whitespace_it_is() {
        assert_eq!(indent_unit("fn main() {\n\tprintln!(\"hello\");\n}\n").as_deref(), Some("\t"));
        assert_eq!(indent_unit("fn main() {\n  println!(\"hello\");\n}\n").as_deref(), Some("  "));
        assert_eq!(indent_unit("fn main() {\n    println!(\"hello\");\n    let x = 1;\n}\n").as_deref(), Some("    "));
        assert_eq!(indent_unit("fn a() {\n   b();\n   c();\n}\n").as_deref(), Some("   "));
    }

    #[test]
    fn nesting_depth_never_votes_for_a_wider_unit() {
        assert_eq!(indent_unit("fn a() {\n  if x {\n    b();\n    c();\n    d();\n  }\n}\n").as_deref(), Some("  "));
        assert_eq!(indent_unit("fn a() {\n    if x {\n        b();\n        c();\n    }\n}\n").as_deref(), Some("    "));
    }

    #[test]
    fn an_unindented_source_has_no_unit() {
        assert_eq!(indent_unit("fn a() {}\nfn b() {}\n"), None);
    }
}

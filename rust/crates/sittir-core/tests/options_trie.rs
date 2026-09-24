use sittir_core::options::{AddressNode, OptionSites, OptionTables, Options, ResolvedOptions, SiteRef, SiteSpec};
use sittir_core::slot::SeamArm;
use sittir_core::spacing::SEAM_DECLARED;

static ADDRESSES: &[AddressNode] = &[AddressNode::Branch {
    key: "a",
    path: "(a)",
    children: &[
        AddressNode::Spacing { key: "x", sites: &[SiteRef { site: 0, path: "(a)/x" }, SiteRef { site: 1, path: "(a)/y:/x" }] },
        AddressNode::Delimiter { key: "d", sites: &[SiteRef { site: 0, path: "(a)/d" }] },
    ],
}];

fn allowed(site: usize) -> &'static [u16] {
    if site == 0 { &[1, 7, 9, 20, 21] } else { &[1, 7, 20, 21] }
}

fn delimiter_allowed(_site: usize) -> u8 {
    2
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
struct Sites;

impl OptionSites for Sites {
    const TABLES: OptionTables = OptionTables {
        addresses: ADDRESSES,
        allowed,
        delimiter_allowed,
        depth_sites: &[("a", &[0, 1])],
        indent: 20,
        dedent: 21,
    };
}

static SITES: &[SiteSpec] = &[SiteSpec { default_arm: 1, strength: 0 }, SiteSpec { default_arm: 1, strength: 0 }];

fn base() -> ResolvedOptions {
    ResolvedOptions { spacing: ResolvedOptions::default_spacing(SITES), delimiter: vec![0], sites: SITES, ..ResolvedOptions::default() }
}

fn resolve(json: &str) -> Result<ResolvedOptions, String> {
    let serde_json::Value::Object(obj) = serde_json::from_str(json).unwrap() else { panic!("not an object") };
    Options::<Sites>::read(&obj)?.resolve(&base())
}

#[test]
fn a_leaf_sets_every_site_it_names() {
    let table = resolve(r#"{ "a": { "x": 7 } }"#).unwrap();
    assert_eq!(table.spacing, vec![SeamArm { arm: 7, strength: SEAM_DECLARED }; 2]);
    assert_eq!(table.delimiter, vec![0]);
}

#[test]
fn a_value_set_to_the_default_arm_still_writes_at_declared_strength() {
    let table = resolve(r#"{ "a": { "x": 1 } }"#).unwrap();
    assert_eq!(table.spacing, vec![SeamArm { arm: 1, strength: SEAM_DECLARED }; 2]);
    assert_eq!(resolve("{}").unwrap().spacing, vec![SeamArm { arm: 1, strength: 0 }; 2]);
}

#[test]
fn indent_and_delimiter_resolve_beside_spacing() {
    let table = resolve(r#"{ "indent": "\t", "a": { "d": 2 } }"#).unwrap();
    assert_eq!(table.indent, "\t");
    assert_eq!(table.delimiter, vec![2]);
}

#[test]
fn an_unknown_key_is_refused_with_its_branch_path() {
    assert_eq!(resolve(r#"{ "a": { "y": 1 } }"#), Err("options: (a)/y names no site".to_string()));
    assert_eq!(resolve(r#"{ "b": 1 }"#), Err("options: unknown key b".to_string()));
}

#[test]
fn a_value_a_site_does_not_admit_is_refused_with_its_path() {
    assert_eq!(resolve(r#"{ "a": { "x": 4 } }"#), Err("options: (a)/x does not admit kind id 4 (allowed: [1, 7, 9, 20, 21])".to_string()));
    assert_eq!(resolve(r#"{ "a": { "d": 1 } }"#), Err("options: (a)/d does not admit delimiter 1 (allowed bits: 2)".to_string()));
}

#[test]
fn each_site_a_leaf_names_checks_its_own_arms() {
    assert_eq!(resolve(r#"{ "a": { "x": 9 } }"#), Err("options: (a)/y:/x does not admit kind id 9 (allowed: [1, 7, 20, 21])".to_string()));
}

#[test]
fn a_value_that_is_not_a_whole_kind_id_is_refused() {
    assert_eq!(resolve(r#"{ "a": { "x": 1.5 } }"#), Err("options: x must be a kind id, not 1.5".to_string()));
}

#[test]
fn a_dedent_with_no_open_indent_is_refused() {
    assert_eq!(resolve(r#"{ "a": { "x": 21 } }"#), Err("options: a dedents an indent it never opened".to_string()));
}

#[test]
fn an_unbalanced_indent_is_refused() {
    assert_eq!(resolve(r#"{ "a": { "x": 20 } }"#), Err("options: a opens an indent it never dedents".to_string()));
}

#[test]
fn no_options_leaves_the_base() {
    assert_eq!(resolve("{}"), Ok(base()));
}

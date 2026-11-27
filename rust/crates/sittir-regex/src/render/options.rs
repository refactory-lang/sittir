// @generated — render options: site table and resolver. Do not hand-edit.

use ::sittir_core::options::{KindFlags, ResolvedOptions, SeatPath};
use ::sittir_core::types::{Delimiter, EdgeRow, FlankId, KindId, SiteId};

pub const SPACING_SITE_COUNT: usize = 43;
pub const DELIMITER_SITE_COUNT: usize = 0;

pub const SITE_BACKREFERENCE_ESCAPE_LT_BEFORE: SiteId = SiteId(0);
pub const SITE_BACKREFERENCE_ESCAPE_LT_AFTER: SiteId = SiteId(1);
pub const SITE_BACKREFERENCE_ESCAPE_GT_BEFORE: SiteId = SiteId(2);
pub const SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER: SiteId = SiteId(3);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE: SiteId = SiteId(4);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER: SiteId = SiteId(5);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE: SiteId = SiteId(6);
pub const SITE_COUNT_QUANTIFIER_COMMA_BEFORE: SiteId = SiteId(7);
pub const SITE_COUNT_QUANTIFIER_COMMA_AFTER: SiteId = SiteId(8);
pub const SITE_COUNT_QUANTIFIER_LBRACE_AFTER: SiteId = SiteId(9);
pub const SITE_COUNT_QUANTIFIER_RBRACE_BEFORE: SiteId = SiteId(10);
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_BEFORE: SiteId = SiteId(11);
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_AFTER: SiteId = SiteId(12);
pub const SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER: SiteId = SiteId(13);
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_BEFORE: SiteId = SiteId(14);
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_AFTER: SiteId = SiteId(15);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER: SiteId = SiteId(16);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_BEFORE: SiteId = SiteId(17);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_AFTER: SiteId = SiteId(18);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER: SiteId = SiteId(19);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_BEFORE: SiteId = SiteId(20);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_AFTER: SiteId = SiteId(21);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER: SiteId = SiteId(22);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE: SiteId = SiteId(23);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER: SiteId = SiteId(24);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_BEFORE: SiteId = SiteId(25);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_AFTER: SiteId = SiteId(26);
pub const SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE: SiteId = SiteId(27);
pub const SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER: SiteId = SiteId(28);
pub const SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE: SiteId = SiteId(29);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER: SiteId = SiteId(30);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER: SiteId = SiteId(31);
pub const SITE_NAMED_CAPTURING_GROUP_GT_BEFORE: SiteId = SiteId(32);
pub const SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARK_P_EQ_AFTER: SiteId = SiteId(33);
pub const SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE: SiteId = SiteId(34);
pub const SITE_PATTERN_PATTERN_BEFORE: SiteId = SiteId(35);
pub const SITE_PATTERN_PATTERN_AFTER: SiteId = SiteId(36);
pub const SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER: SiteId = SiteId(37);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_BEFORE: SiteId = SiteId(38);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_AFTER: SiteId = SiteId(39);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE: SiteId = SiteId(40);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_BEFORE: SiteId = SiteId(41);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_AFTER: SiteId = SiteId(42);

/// (kind, address, label, allowed kind ids), in canonical path order.
pub static SPACING_SITES: &[(&str, &str, &str, &[KindId])] = &[
    ("backreference_escape", "lt_before", "lt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "lt_after", "lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "gt_before", "gt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "bslashk_after", "bslashk_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "lbrace_before", "lbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "lbrace_after", "lbrace_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "rbrace_before", "rbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "comma_before", "comma_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "comma_after", "comma_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "lbrace_after", "lbrace_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "rbrace_before", "rbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_arm", "count_quantifier_arm_before", "count_quantifier_arm_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_arm", "count_quantifier_arm_after", "count_quantifier_arm_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "comma_after", "comma_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "count_quantifier_group_before", "count_quantifier_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "count_quantifier_group_after", "count_quantifier_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "dash_after", "dash_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "inline_flags_group_disable_before", "inline_flags_group_disable_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "inline_flags_group_disable_after", "inline_flags_group_disable_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "inline_flags_group_enable_before", "inline_flags_group_enable_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "inline_flags_group_enable_after", "inline_flags_group_enable_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "dash_after", "dash_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_before", "inline_flags_group_toggle_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_after", "inline_flags_group_toggle_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "bang_before", "bang_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "eq_before", "eq_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmarkP_lt_after", "lparen_qmarkP_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "gt_before", "gt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "lparen_qmarkP_eq_after", "lparen_qmarkP_eq_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("pattern", "pattern_before", "pattern_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("pattern", "pattern_after", "pattern_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("posix_character_class", "lbrack_colon_after", "lbrack_colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression", "unicode_property_value_expression_before", "unicode_property_value_expression_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression", "unicode_property_value_expression_after", "unicode_property_value_expression_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "eq_before", "eq_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_before", "unicode_property_value_expression_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_after", "unicode_property_value_expression_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
];

/// The edge seams and boundary arms of every kind that owns either, in kind id order.
pub static EDGE_SITES: &[::sittir_core::options::EdgeSite] = &[
    ::sittir_core::options::EdgeSite { before: Some(SiteId(35)), after: Some(SiteId(36)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(38)), after: Some(SiteId(39)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(14)), after: Some(SiteId(15)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[::sittir_core::options::BoundaryArm { next: KindId(29), field: None, marks: &[::sittir_core::options::BoundaryMark::Site(SiteId(13))] }] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(11)), after: Some(SiteId(12)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(41)), after: Some(SiteId(42)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(20)), after: Some(SiteId(21)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(25)), after: Some(SiteId(26)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(17)), after: Some(SiteId(18)), before_arms: &[], after_arms: &[], before_bounds: &[], after_bounds: &[] },
];

/// Per kind id, its row in `EDGE_SITES`.
pub static EDGE_ROWS: &[Option<EdgeRow>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, Some(EdgeRow(0)), None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, Some(EdgeRow(1)), None, None, None, Some(EdgeRow(2)),
    Some(EdgeRow(3)), None, Some(EdgeRow(4)), None, Some(EdgeRow(5)), Some(EdgeRow(6)), Some(EdgeRow(7)),
];

/// Per kind id, its `KindFlags`: `ANON` (the parser's anonymous token), `LINE_TERMINATED`, `LINE_BREAK_TERMINATED`, `ROOT`, `JOINS_NEXT`.
pub static KIND_FLAGS: &[KindFlags] = &[
    KindFlags(0), KindFlags(1), KindFlags(0), KindFlags(1), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(0), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(0), KindFlags(0), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1), KindFlags(1),
    KindFlags(1), KindFlags(1), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(1), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(200), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0),
    KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(0), KindFlags(1), KindFlags(1), KindFlags(1),
];

/// Per kind id, the layout kinds its leaf pattern takes before it (low byte) and after it (high byte); 0 where the kind has no stamp.
pub const LEAF_EDGES: &[u16] = &[
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 257,
];

/// (kind, `<slot>_delimiter` key, allowed delimiters, default delimiters), in site order.
pub static DELIMITER_SITES: &[(&str, &str, Delimiter, Delimiter)] = &[
];

pub const INDENT_KIND: KindId = KindId(0);
pub const DEDENT_KIND: KindId = KindId(0);

/// (kind, its indent-capable sites in rule order): an indent opened at one site is dedented at a later one of the same kind.
pub static DEPTH_SITES: &[(&str, &[SiteId])] = &[
];

#[must_use]
pub fn spacing_text(kind: KindId) -> &'static str {
    match kind {
        KindId(47) => "",
        KindId(48) => "\n",
        KindId(49) => "\n\n",
        KindId(50) => "\n\n\n",
        _ => "",
    }
}

#[must_use]
pub fn allowed(site: SiteId) -> &'static [KindId] {
    SPACING_SITES[site.index()].3
}

/// Every layout kind (each `_layout` member, the depth movers among them where the grammar has them), the domain of `spacing_text`.
pub const LAYOUT_KINDS: &[KindId] = &[KindId(47), KindId(48), KindId(49), KindId(50)];

/// The kind id the grammar gives each gap kind, by `LayoutKinds` bit.
pub const GAPS: &[(u8, KindId)] = &[(1, KindId(47)), (8, KindId(48)), (16, KindId(49)), (32, KindId(50))];

pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND, leaf_edges: LEAF_EDGES, gaps: GAPS };

/// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
    ::sittir_core::options::SiteSpec { default_arm: KindId(47), strength: ::sittir_core::spacing::SeamStrength::Fallback },
];

/// Per kind id of a wrapper, the way its seat passes through to the node it holds.
pub static SEAT_WRAPPERS: &[Option<SeatPath>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, Some(SeatPath::Content), None, None, None, Some(SeatPath::Content), None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, Some(SeatPath::Content),
];

/// Per kind id of a list, the site its items' separator reads.
pub static SEPARATOR_SITES: &[Option<SiteId>] = &[
];

/// Per kind id of a token whose render writes no text, the seam it writes in its place.
pub static TOKEN_SEAMS: &[Option<::sittir_core::layout_kinds::LayoutKinds>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, Some(::sittir_core::layout_kinds::LayoutKinds::TIGHT),
    Some(::sittir_core::layout_kinds::LayoutKinds::NEWLINE), Some(::sittir_core::layout_kinds::LayoutKinds::BLANKLINE), Some(::sittir_core::layout_kinds::LayoutKinds::DOUBLE_BLANKLINE),
];

#[must_use]
pub fn defaults() -> ResolvedOptions {
    ResolvedOptions {
        spacing: ResolvedOptions::default_spacing(SITE_SPECS),
        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),
        edges: EDGE_SITES,
        edge_rows: EDGE_ROWS,
        kind_flags: KIND_FLAGS,
        seat_wrappers: SEAT_WRAPPERS,
        separator_sites: SEPARATOR_SITES,
        token_seams: TOKEN_SEAMS,
        sites: SITE_SPECS,
        newline: "\n".to_string(),
        ..ResolvedOptions::default()
    }
}

#[must_use]
pub fn delimiter_allowed(site: FlankId) -> Delimiter {
    DELIMITER_SITES[site.index()].2
}

pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[
    ::sittir_core::options::AddressNode::Branch { key: "backreferenceEscape", path: "(backreference_escape)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "bslashk", path: "(backreference_escape)/\"\\k\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER, path: "(backreference_escape)/\"\\k\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "gt", path: "(backreference_escape)/\">\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_GT_BEFORE, path: "(backreference_escape)/\">\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lt", path: "(backreference_escape)/\"<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_LT_AFTER, path: "(backreference_escape)/\"<\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_LT_BEFORE, path: "(backreference_escape)/\"<\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "characterClassEscapeArm", path: "(character_class_escape_arm)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "lbrace", path: "(character_class_escape_arm)/\"{\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER, path: "(character_class_escape_arm)/\"{\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE, path: "(character_class_escape_arm)/\"{\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrace", path: "(character_class_escape_arm)/\"}\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE, path: "(character_class_escape_arm)/\"}\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "countQuantifier", path: "(count_quantifier)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "comma", path: "(count_quantifier)/\",\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COMMA_AFTER, path: "(count_quantifier)/\",\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COMMA_BEFORE, path: "(count_quantifier)/\",\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrace", path: "(count_quantifier)/\"{\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_LBRACE_AFTER, path: "(count_quantifier)/\"{\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrace", path: "(count_quantifier)/\"}\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_RBRACE_BEFORE, path: "(count_quantifier)/\"}\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "countQuantifierArm", path: "(count_quantifier_arm)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_AFTER, path: "(count_quantifier_arm)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_BEFORE, path: "(count_quantifier_arm)/before" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "countQuantifierGroup", path: "(count_quantifier_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_AFTER, path: "(count_quantifier_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_BEFORE, path: "(count_quantifier_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "comma", path: "(count_quantifier_group)/\",\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER, path: "(count_quantifier_group)/\",\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "inlineFlagsGroupDisable", path: "(inline_flags_group_disable)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_AFTER, path: "(inline_flags_group_disable)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_BEFORE, path: "(inline_flags_group_disable)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dash", path: "(inline_flags_group_disable)/\"-\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER, path: "(inline_flags_group_disable)/\"-\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "inlineFlagsGroupEnable", path: "(inline_flags_group_enable)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_AFTER, path: "(inline_flags_group_enable)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_BEFORE, path: "(inline_flags_group_enable)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(inline_flags_group_enable)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER, path: "(inline_flags_group_enable)/\"(?\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "inlineFlagsGroupToggle", path: "(inline_flags_group_toggle)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_AFTER, path: "(inline_flags_group_toggle)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_BEFORE, path: "(inline_flags_group_toggle)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dash", path: "(inline_flags_group_toggle)/\"-\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER, path: "(inline_flags_group_toggle)/\"-\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(inline_flags_group_toggle)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER, path: "(inline_flags_group_toggle)/\"(?\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(inline_flags_group_toggle)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE, path: "(inline_flags_group_toggle)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "lookbehindAssertion", path: "(lookbehind_assertion)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "bang", path: "(lookbehind_assertion)/\"!\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE, path: "(lookbehind_assertion)/\"!\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "eq", path: "(lookbehind_assertion)/\"=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE, path: "(lookbehind_assertion)/\"=\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkLt", path: "(lookbehind_assertion)/\"(?<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER, path: "(lookbehind_assertion)/\"(?<\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedCapturingGroup", path: "(named_capturing_group)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "gt", path: "(named_capturing_group)/\">\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_GT_BEFORE, path: "(named_capturing_group)/\">\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkPLt", path: "(named_capturing_group)/\"(?P<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER, path: "(named_capturing_group)/\"(?P<\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkLt", path: "(named_capturing_group)/\"(?<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER, path: "(named_capturing_group)/\"(?<\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedGroupBackreference", path: "(named_group_backreference)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkPEq", path: "(named_group_backreference)/\"(?P=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARK_P_EQ_AFTER, path: "(named_group_backreference)/\"(?P=\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_group_backreference)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE, path: "(named_group_backreference)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "pattern", path: "(pattern)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PATTERN_PATTERN_AFTER, path: "(pattern)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PATTERN_PATTERN_BEFORE, path: "(pattern)/before" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "posixCharacterClass", path: "(posix_character_class)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "lbrackColon", path: "(posix_character_class)/\"[:\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER, path: "(posix_character_class)/\"[:\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "unicodePropertyValueExpression", path: "(unicode_property_value_expression)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_AFTER, path: "(unicode_property_value_expression)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_BEFORE, path: "(unicode_property_value_expression)/before" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "unicodePropertyValueExpressionGroup", path: "(unicode_property_value_expression_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_AFTER, path: "(unicode_property_value_expression_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_BEFORE, path: "(unicode_property_value_expression_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "eq", path: "(unicode_property_value_expression_group)/\"=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE, path: "(unicode_property_value_expression_group)/\"=\"/before" }] },
        ] },
    ] },
];

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Sites;

impl ::sittir_core::options::OptionSites for Sites {
    const TABLES: ::sittir_core::options::OptionTables = ::sittir_core::options::OptionTables {
        addresses: ADDRESSES,
        allowed,
        delimiter_allowed,
        depth_sites: DEPTH_SITES,
        indent: INDENT_KIND,
        dedent: DEDENT_KIND,
        indent_chars: "",
        newline_arms: &["\n", "\r\n"],
    };
}

pub type Options = ::sittir_core::options::Options<Sites>;

#[cfg(test)]
mod resolve_tests {
    use super::*;

    fn resolve(json: &str) -> Result<ResolvedOptions, String> {
        let ::serde_json::Value::Object(obj) = ::serde_json::from_str(json).unwrap() else { unreachable!() };
        Options::read(&obj)?.resolve(&defaults())
    }

    #[test]
    fn no_options_leaves_the_defaults() {
        assert_eq!(resolve("{}"), Ok(defaults()));
    }

    #[test]
    fn an_unknown_key_is_refused() {
        assert_eq!(resolve(r#"{"no_such_address":1}"#), Err("options: unknown key no_such_address".to_string()));
    }

    #[test]
    fn an_unknown_key_beneath_a_branch_names_the_branch() {
        assert_eq!(resolve("{\"backreferenceEscape\":{\"no_such_address\":1}}"), Err("options: (backreference_escape)/no_such_address names no site".to_string()));
    }

    #[test]
    fn a_differing_admitted_value_changes_only_its_own_sites() {
        let table = resolve("{\"backreferenceEscape\":{\"bslashk\":{\"after\":48}}}").unwrap();
        let expected = defaults();
        let named = [SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER];
        for i in 0..table.spacing.len() {
            assert_eq!(table.spacing[i].arm, if named.iter().any(|site| site.index() == i) { KindId(48) } else { expected.spacing[i].arm });
        }
        assert_eq!(table.delimiter, expected.delimiter);
        assert_eq!(table.indent, expected.indent);
    }

    #[test]
    fn a_value_the_site_does_not_admit_is_refused_with_its_path() {
        assert_eq!(resolve("{\"backreferenceEscape\":{\"bslashk\":{\"after\":65534}}}"), Err("options: (backreference_escape)/\"\\k\"/after does not admit kind id 65534 (allowed: [47, 48, 49, 50])".to_string()));
    }
}

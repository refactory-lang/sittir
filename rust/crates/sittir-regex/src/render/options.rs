// @generated — render options: site table and resolver. Do not hand-edit.

use ::sittir_core::options::{ResolvedOptions, NO_SITE};

pub const SPACING_SITE_COUNT: usize = 111;
pub const DELIMITER_SITE_COUNT: usize = 0;

pub const SITE_ALTERNATION_TERM_SEPARATOR_SPACE_BEFORE: usize = 0;
pub const SITE_ALTERNATION_TERM_SEPARATOR_SPACE_AFTER: usize = 1;
pub const SITE_ANONYMOUS_CAPTURING_GROUP_LPAREN_AFTER: usize = 2;
pub const SITE_ANONYMOUS_CAPTURING_GROUP_RPAREN_BEFORE: usize = 3;
pub const SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_BEFORE: usize = 4;
pub const SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_AFTER: usize = 5;
pub const SITE_BACKREFERENCE_ESCAPE_LT_BEFORE: usize = 6;
pub const SITE_BACKREFERENCE_ESCAPE_LT_AFTER: usize = 7;
pub const SITE_BACKREFERENCE_ESCAPE_GT_BEFORE: usize = 8;
pub const SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER: usize = 9;
pub const SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_BEFORE: usize = 10;
pub const SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_AFTER: usize = 11;
pub const SITE_CHARACTER_CLASS_LBRACK_AFTER: usize = 12;
pub const SITE_CHARACTER_CLASS_RBRACK_BEFORE: usize = 13;
pub const SITE_CHARACTER_CLASS_CHARACTER_CLASS_BEFORE: usize = 14;
pub const SITE_CHARACTER_CLASS_CHARACTER_CLASS_AFTER: usize = 15;
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE: usize = 16;
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER: usize = 17;
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE: usize = 18;
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_BEFORE: usize = 19;
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_AFTER: usize = 20;
pub const SITE_CLASS_RANGE_DASH_BEFORE: usize = 21;
pub const SITE_CLASS_RANGE_DASH_AFTER: usize = 22;
pub const SITE_CLASS_RANGE_CLASS_RANGE_BEFORE: usize = 23;
pub const SITE_CLASS_RANGE_CLASS_RANGE_AFTER: usize = 24;
pub const SITE_COUNT_QUANTIFIER_COMMA_BEFORE: usize = 25;
pub const SITE_COUNT_QUANTIFIER_COMMA_AFTER: usize = 26;
pub const SITE_COUNT_QUANTIFIER_LBRACE_AFTER: usize = 27;
pub const SITE_COUNT_QUANTIFIER_RBRACE_BEFORE: usize = 28;
pub const SITE_COUNT_QUANTIFIER_RBRACE_AFTER: usize = 29;
pub const SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_BEFORE: usize = 30;
pub const SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_AFTER: usize = 31;
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_BEFORE: usize = 32;
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_AFTER: usize = 33;
pub const SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER: usize = 34;
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_BEFORE: usize = 35;
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_AFTER: usize = 36;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_LPAREN_QMARK_AFTER: usize = 37;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_RPAREN_BEFORE: usize = 38;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_BEFORE: usize = 39;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER: usize = 40;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_BEFORE: usize = 41;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_AFTER: usize = 42;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_BEFORE: usize = 43;
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_AFTER: usize = 44;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER: usize = 45;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_RPAREN_BEFORE: usize = 46;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_BEFORE: usize = 47;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_AFTER: usize = 48;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_BEFORE: usize = 49;
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_AFTER: usize = 50;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER: usize = 51;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE: usize = 52;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_BEFORE: usize = 53;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER: usize = 54;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_BEFORE: usize = 55;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_AFTER: usize = 56;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_BEFORE: usize = 57;
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_AFTER: usize = 58;
pub const SITE_LOOKAHEAD_ASSERTION_BANG_BEFORE: usize = 59;
pub const SITE_LOOKAHEAD_ASSERTION_BANG_AFTER: usize = 60;
pub const SITE_LOOKAHEAD_ASSERTION_LPAREN_QMARK_AFTER: usize = 61;
pub const SITE_LOOKAHEAD_ASSERTION_RPAREN_BEFORE: usize = 62;
pub const SITE_LOOKAHEAD_ASSERTION_EQ_BEFORE: usize = 63;
pub const SITE_LOOKAHEAD_ASSERTION_EQ_AFTER: usize = 64;
pub const SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_BEFORE: usize = 65;
pub const SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_AFTER: usize = 66;
pub const SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE: usize = 67;
pub const SITE_LOOKBEHIND_ASSERTION_BANG_AFTER: usize = 68;
pub const SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER: usize = 69;
pub const SITE_LOOKBEHIND_ASSERTION_RPAREN_BEFORE: usize = 70;
pub const SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE: usize = 71;
pub const SITE_LOOKBEHIND_ASSERTION_EQ_AFTER: usize = 72;
pub const SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_BEFORE: usize = 73;
pub const SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_AFTER: usize = 74;
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER: usize = 75;
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARKP_LT_AFTER: usize = 76;
pub const SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE: usize = 77;
pub const SITE_NAMED_CAPTURING_GROUP_GT_BEFORE: usize = 78;
pub const SITE_NAMED_CAPTURING_GROUP_GT_AFTER: usize = 79;
pub const SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_BEFORE: usize = 80;
pub const SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_AFTER: usize = 81;
pub const SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARKP_EQ_AFTER: usize = 82;
pub const SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE: usize = 83;
pub const SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_BEFORE: usize = 84;
pub const SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_AFTER: usize = 85;
pub const SITE_NON_CAPTURING_GROUP_LPAREN_QMARK_COLON_AFTER: usize = 86;
pub const SITE_NON_CAPTURING_GROUP_RPAREN_BEFORE: usize = 87;
pub const SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_BEFORE: usize = 88;
pub const SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_AFTER: usize = 89;
pub const SITE_ONE_OR_MORE_PLUS_AFTER: usize = 90;
pub const SITE_OPTIONAL_QMARK_AFTER: usize = 91;
pub const SITE_POSIX_CHARACTER_CLASS_COLON_RBRACK_BEFORE: usize = 92;
pub const SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER: usize = 93;
pub const SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_BEFORE: usize = 94;
pub const SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_AFTER: usize = 95;
pub const SITE_TERM_TERM_GROUP_TERM_GROUP_AFTER: usize = 96;
pub const SITE_TERM_TERM_GROUP_SEPARATOR_SPACE: usize = 97;
pub const SITE_TERM_GROUP_ANY_CHARACTER_AFTER: usize = 98;
pub const SITE_TERM_GROUP_BOUNDARY_ASSERTION_AFTER: usize = 99;
pub const SITE_TERM_GROUP_END_ASSERTION_AFTER: usize = 100;
pub const SITE_TERM_GROUP_NON_BOUNDARY_ASSERTION_AFTER: usize = 101;
pub const SITE_TERM_GROUP_CARET_AFTER: usize = 102;
pub const SITE_TERM_GROUP_TERM_GROUP_BEFORE: usize = 103;
pub const SITE_TERM_GROUP_TERM_GROUP_AFTER: usize = 104;
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_BEFORE: usize = 105;
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_AFTER: usize = 106;
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE: usize = 107;
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_BEFORE: usize = 108;
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_AFTER: usize = 109;
pub const SITE_ZERO_OR_MORE_STAR_AFTER: usize = 110;

/// (kind, address, label, allowed kind ids), in canonical path order.
pub static SPACING_SITES: &[(&str, &str, &str, &[u16])] = &[
    ("alternation", "term_separator_space_before", "pipe_separator_space_before", &[47, 48, 49]),
    ("alternation", "term_separator_space_after", "pipe_separator_space_after", &[47, 48, 49]),
    ("anonymous_capturing_group", "lparen_after", "lparen_after", &[47, 48, 49]),
    ("anonymous_capturing_group", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("anonymous_capturing_group", "anonymous_capturing_group_before", "anonymous_capturing_group_before", &[47, 48, 49]),
    ("anonymous_capturing_group", "anonymous_capturing_group_after", "anonymous_capturing_group_after", &[47, 48, 49]),
    ("backreference_escape", "lt_before", "lt_before", &[47, 48, 49]),
    ("backreference_escape", "lt_after", "lt_after", &[47, 48, 49]),
    ("backreference_escape", "gt_before", "gt_before", &[47, 48, 49]),
    ("backreference_escape", "bslashk_after", "bslashk_after", &[47, 48, 49]),
    ("backreference_escape", "backreference_escape_before", "backreference_escape_before", &[47, 48, 49]),
    ("backreference_escape", "backreference_escape_after", "backreference_escape_after", &[47, 48, 49]),
    ("character_class", "lbrack_after", "lbrack_after", &[47, 48, 49]),
    ("character_class", "rbrack_before", "rbrack_before", &[47, 48, 49]),
    ("character_class", "character_class_before", "character_class_before", &[47, 48, 49]),
    ("character_class", "character_class_after", "character_class_after", &[47, 48, 49]),
    ("character_class_escape_arm", "lbrace_before", "lbrace_before", &[47, 48, 49]),
    ("character_class_escape_arm", "lbrace_after", "lbrace_after", &[47, 48, 49]),
    ("character_class_escape_arm", "rbrace_before", "rbrace_before", &[47, 48, 49]),
    ("character_class_escape_arm", "character_class_escape_arm_before", "character_class_escape_arm_before", &[47, 48, 49]),
    ("character_class_escape_arm", "character_class_escape_arm_after", "character_class_escape_arm_after", &[47, 48, 49]),
    ("class_range", "dash_before", "dash_before", &[47, 48, 49]),
    ("class_range", "dash_after", "dash_after", &[47, 48, 49]),
    ("class_range", "class_range_before", "class_range_before", &[47, 48, 49]),
    ("class_range", "class_range_after", "class_range_after", &[47, 48, 49]),
    ("count_quantifier", "comma_before", "comma_before", &[47, 48, 49]),
    ("count_quantifier", "comma_after", "comma_after", &[47, 48, 49]),
    ("count_quantifier", "lbrace_after", "lbrace_after", &[47, 48, 49]),
    ("count_quantifier", "rbrace_before", "rbrace_before", &[47, 48, 49]),
    ("count_quantifier", "rbrace_after", "rbrace_after", &[47, 48, 49]),
    ("count_quantifier", "count_quantifier_before", "count_quantifier_before", &[47, 48, 49]),
    ("count_quantifier", "count_quantifier_after", "count_quantifier_after", &[47, 48, 49]),
    ("count_quantifier_arm", "count_quantifier_arm_before", "count_quantifier_arm_before", &[47, 48, 49]),
    ("count_quantifier_arm", "count_quantifier_arm_after", "count_quantifier_arm_after", &[47, 48, 49]),
    ("count_quantifier_group", "comma_after", "comma_after", &[47, 48, 49]),
    ("count_quantifier_group", "count_quantifier_group_before", "count_quantifier_group_before", &[47, 48, 49]),
    ("count_quantifier_group", "count_quantifier_group_after", "count_quantifier_group_after", &[47, 48, 49]),
    ("inline_flags_group_disable", "lparen_qmark_after", "lparen_qmark_after", &[47, 48, 49]),
    ("inline_flags_group_disable", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("inline_flags_group_disable", "dash_before", "dash_before", &[47, 48, 49]),
    ("inline_flags_group_disable", "dash_after", "dash_after", &[47, 48, 49]),
    ("inline_flags_group_disable", "colon_before", "colon_before", &[47, 48, 49]),
    ("inline_flags_group_disable", "colon_after", "colon_after", &[47, 48, 49]),
    ("inline_flags_group_disable", "inline_flags_group_disable_before", "inline_flags_group_disable_before", &[47, 48, 49]),
    ("inline_flags_group_disable", "inline_flags_group_disable_after", "inline_flags_group_disable_after", &[47, 48, 49]),
    ("inline_flags_group_enable", "lparen_qmark_after", "lparen_qmark_after", &[47, 48, 49]),
    ("inline_flags_group_enable", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("inline_flags_group_enable", "colon_before", "colon_before", &[47, 48, 49]),
    ("inline_flags_group_enable", "colon_after", "colon_after", &[47, 48, 49]),
    ("inline_flags_group_enable", "inline_flags_group_enable_before", "inline_flags_group_enable_before", &[47, 48, 49]),
    ("inline_flags_group_enable", "inline_flags_group_enable_after", "inline_flags_group_enable_after", &[47, 48, 49]),
    ("inline_flags_group_toggle", "lparen_qmark_after", "lparen_qmark_after", &[47, 48, 49]),
    ("inline_flags_group_toggle", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("inline_flags_group_toggle", "dash_before", "dash_before", &[47, 48, 49]),
    ("inline_flags_group_toggle", "dash_after", "dash_after", &[47, 48, 49]),
    ("inline_flags_group_toggle", "colon_before", "colon_before", &[47, 48, 49]),
    ("inline_flags_group_toggle", "colon_after", "colon_after", &[47, 48, 49]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_before", "inline_flags_group_toggle_before", &[47, 48, 49]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_after", "inline_flags_group_toggle_after", &[47, 48, 49]),
    ("lookahead_assertion", "bang_before", "bang_before", &[47, 48, 49]),
    ("lookahead_assertion", "bang_after", "bang_after", &[47, 48, 49]),
    ("lookahead_assertion", "lparen_qmark_after", "lparen_qmark_after", &[47, 48, 49]),
    ("lookahead_assertion", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("lookahead_assertion", "eq_before", "eq_before", &[47, 48, 49]),
    ("lookahead_assertion", "eq_after", "eq_after", &[47, 48, 49]),
    ("lookahead_assertion", "lookahead_assertion_before", "lookahead_assertion_before", &[47, 48, 49]),
    ("lookahead_assertion", "lookahead_assertion_after", "lookahead_assertion_after", &[47, 48, 49]),
    ("lookbehind_assertion", "bang_before", "bang_before", &[47, 48, 49]),
    ("lookbehind_assertion", "bang_after", "bang_after", &[47, 48, 49]),
    ("lookbehind_assertion", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[47, 48, 49]),
    ("lookbehind_assertion", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("lookbehind_assertion", "eq_before", "eq_before", &[47, 48, 49]),
    ("lookbehind_assertion", "eq_after", "eq_after", &[47, 48, 49]),
    ("lookbehind_assertion", "lookbehind_assertion_before", "lookbehind_assertion_before", &[47, 48, 49]),
    ("lookbehind_assertion", "lookbehind_assertion_after", "lookbehind_assertion_after", &[47, 48, 49]),
    ("named_capturing_group", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[47, 48, 49]),
    ("named_capturing_group", "lparen_qmarkp_lt_after", "lparen_qmarkp_lt_after", &[47, 48, 49]),
    ("named_capturing_group", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("named_capturing_group", "gt_before", "gt_before", &[47, 48, 49]),
    ("named_capturing_group", "gt_after", "gt_after", &[47, 48, 49]),
    ("named_capturing_group", "named_capturing_group_before", "named_capturing_group_before", &[47, 48, 49]),
    ("named_capturing_group", "named_capturing_group_after", "named_capturing_group_after", &[47, 48, 49]),
    ("named_group_backreference", "lparen_qmarkp_eq_after", "lparen_qmarkp_eq_after", &[47, 48, 49]),
    ("named_group_backreference", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("named_group_backreference", "named_group_backreference_before", "named_group_backreference_before", &[47, 48, 49]),
    ("named_group_backreference", "named_group_backreference_after", "named_group_backreference_after", &[47, 48, 49]),
    ("non_capturing_group", "lparen_qmark_colon_after", "lparen_qmark_colon_after", &[47, 48, 49]),
    ("non_capturing_group", "rparen_before", "rparen_before", &[47, 48, 49]),
    ("non_capturing_group", "non_capturing_group_before", "non_capturing_group_before", &[47, 48, 49]),
    ("non_capturing_group", "non_capturing_group_after", "non_capturing_group_after", &[47, 48, 49]),
    ("one_or_more", "plus_after", "plus_after", &[47, 48, 49]),
    ("optional", "qmark_after", "qmark_after", &[47, 48, 49]),
    ("posix_character_class", "colon_rbrack_before", "colon_rbrack_before", &[47, 48, 49]),
    ("posix_character_class", "lbrack_colon_after", "lbrack_colon_after", &[47, 48, 49]),
    ("posix_character_class", "posix_character_class_before", "posix_character_class_before", &[47, 48, 49]),
    ("posix_character_class", "posix_character_class_after", "posix_character_class_after", &[47, 48, 49]),
    ("term", "term_group_term_group_after", "term_group_after", &[47, 48, 49]),
    ("term", "term_group_separator_space", "empty_separator_space", &[47, 48, 49]),
    ("term_group", "any_character_after", "any_character_after", &[47, 48, 49]),
    ("term_group", "boundary_assertion_after", "boundary_assertion_after", &[47, 48, 49]),
    ("term_group", "end_assertion_after", "end_assertion_after", &[47, 48, 49]),
    ("term_group", "non_boundary_assertion_after", "non_boundary_assertion_after", &[47, 48, 49]),
    ("term_group", "caret_after", "caret_after", &[47, 48, 49]),
    ("term_group", "term_group_before", "term_group_before", &[47, 48, 49]),
    ("term_group", "term_group_after", "term_group_after", &[47, 48, 49]),
    ("unicode_property_value_expression", "unicode_property_value_expression_before", "unicode_property_value_expression_before", &[47, 48, 49]),
    ("unicode_property_value_expression", "unicode_property_value_expression_after", "unicode_property_value_expression_after", &[47, 48, 49]),
    ("unicode_property_value_expression_group", "eq_before", "eq_before", &[47, 48, 49]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_before", "unicode_property_value_expression_group_before", &[47, 48, 49]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_after", "unicode_property_value_expression_group_after", &[47, 48, 49]),
    ("zero_or_more", "star_after", "star_after", &[47, 48, 49]),
];

/// The before and after site of every kind that owns edge seams, in kind id order.
pub static EDGE_SITES: &[::sittir_core::options::EdgeSite] = &[
    ::sittir_core::options::EdgeSite { before: 65, after: 66 },
    ::sittir_core::options::EdgeSite { before: 73, after: 74 },
    ::sittir_core::options::EdgeSite { before: 14, after: 15 },
    ::sittir_core::options::EdgeSite { before: 94, after: 95 },
    ::sittir_core::options::EdgeSite { before: 23, after: 24 },
    ::sittir_core::options::EdgeSite { before: 4, after: 5 },
    ::sittir_core::options::EdgeSite { before: 80, after: 81 },
    ::sittir_core::options::EdgeSite { before: 88, after: 89 },
    ::sittir_core::options::EdgeSite { before: 30, after: 31 },
    ::sittir_core::options::EdgeSite { before: 10, after: 11 },
    ::sittir_core::options::EdgeSite { before: 84, after: 85 },
    ::sittir_core::options::EdgeSite { before: 105, after: 106 },
    ::sittir_core::options::EdgeSite { before: 103, after: 104 },
    ::sittir_core::options::EdgeSite { before: 35, after: 36 },
    ::sittir_core::options::EdgeSite { before: 32, after: 33 },
    ::sittir_core::options::EdgeSite { before: 19, after: 20 },
    ::sittir_core::options::EdgeSite { before: 108, after: 109 },
    ::sittir_core::options::EdgeSite { before: 49, after: 50 },
    ::sittir_core::options::EdgeSite { before: 57, after: 58 },
    ::sittir_core::options::EdgeSite { before: 43, after: 44 },
];

/// Per kind id, its row in EDGE_SITES.
pub static EDGE_ROWS: &[u16] = &[
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, 0, 1, 2, 3, NO_SITE, 4, 5, 6, 7,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, 8, 9, 10, NO_SITE, NO_SITE, 11, NO_SITE, 12, 13, 14, 15,
    16, 17, 18, 19,
];

/// (kind, `<slot>_delimiter` key, allowed bitflag union, default bitflag), in site order.
pub static DELIMITER_SITES: &[(&str, &str, u8, u8)] = &[
];

pub const INDENT_KIND: u16 = 0;
pub const DEDENT_KIND: u16 = 0;

/// (kind, its indent-capable sites in rule order): an indent opened at one site is dedented at a later one of the same kind.
pub static DEPTH_SITES: &[(&str, &[usize])] = &[
];

pub fn spacing_text(kind: u16) -> &'static str {
    match kind {
        47 => "",
        48 => " ",
        49 => "\n",
        _ => "",
    }
}

pub fn allowed(site: usize) -> &'static [u16] {
    SPACING_SITES[site].3
}

pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND };

/// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: 48, strength: 0 },
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_TERM_TERM_GROUP: &[u16] = &[
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE,
    NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, NO_SITE, 96,
];

pub fn defaults() -> ResolvedOptions {
    ResolvedOptions {
        spacing: ResolvedOptions::default_spacing(SITE_SPECS),
        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),
        edges: EDGE_SITES,
        edge_rows: EDGE_ROWS,
        sites: SITE_SPECS,
        ..ResolvedOptions::default()
    }
}

pub fn delimiter_allowed(site: usize) -> u8 {
    DELIMITER_SITES[site].2
}

pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[
    ::sittir_core::options::AddressNode::Branch { key: "alternation", path: "(alternation)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "term", path: "(alternation)/term:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "separator", path: "(alternation)/term:/separator", children: &[
                ::sittir_core::options::AddressNode::Branch { key: "pipe", path: "(alternation)/term:/separator/\"|\"", children: &[
                    ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ALTERNATION_TERM_SEPARATOR_SPACE_AFTER, path: "(alternation)/term:/separator/\"|\"/after" }] },
                    ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ALTERNATION_TERM_SEPARATOR_SPACE_BEFORE, path: "(alternation)/term:/separator/\"|\"/before" }] },
                ] },
            ] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "anonymousCapturingGroup", path: "(anonymous_capturing_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_AFTER, path: "(anonymous_capturing_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_BEFORE, path: "(anonymous_capturing_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(anonymous_capturing_group)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_CAPTURING_GROUP_LPAREN_AFTER, path: "(anonymous_capturing_group)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(anonymous_capturing_group)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_CAPTURING_GROUP_RPAREN_BEFORE, path: "(anonymous_capturing_group)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "backreferenceEscape", path: "(backreference_escape)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_AFTER, path: "(backreference_escape)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_BEFORE, path: "(backreference_escape)/before" }] },
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
    ::sittir_core::options::AddressNode::Branch { key: "characterClass", path: "(character_class)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_CHARACTER_CLASS_AFTER, path: "(character_class)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_CHARACTER_CLASS_BEFORE, path: "(character_class)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrack", path: "(character_class)/\"[\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_LBRACK_AFTER, path: "(character_class)/\"[\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrack", path: "(character_class)/\"]\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_RBRACK_BEFORE, path: "(character_class)/\"]\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "characterClassEscapeArm", path: "(character_class_escape_arm)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_AFTER, path: "(character_class_escape_arm)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_BEFORE, path: "(character_class_escape_arm)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrace", path: "(character_class_escape_arm)/\"{\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER, path: "(character_class_escape_arm)/\"{\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE, path: "(character_class_escape_arm)/\"{\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrace", path: "(character_class_escape_arm)/\"}\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE, path: "(character_class_escape_arm)/\"}\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "classRange", path: "(class_range)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CLASS_RANGE_CLASS_RANGE_AFTER, path: "(class_range)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CLASS_RANGE_CLASS_RANGE_BEFORE, path: "(class_range)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dash", path: "(class_range)/\"-\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CLASS_RANGE_DASH_AFTER, path: "(class_range)/\"-\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CLASS_RANGE_DASH_BEFORE, path: "(class_range)/\"-\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "countQuantifier", path: "(count_quantifier)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_AFTER, path: "(count_quantifier)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_BEFORE, path: "(count_quantifier)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "comma", path: "(count_quantifier)/\",\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COMMA_AFTER, path: "(count_quantifier)/\",\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_COMMA_BEFORE, path: "(count_quantifier)/\",\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrace", path: "(count_quantifier)/\"{\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_LBRACE_AFTER, path: "(count_quantifier)/\"{\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrace", path: "(count_quantifier)/\"}\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_COUNT_QUANTIFIER_RBRACE_AFTER, path: "(count_quantifier)/\"}\"/after" }] },
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
        ::sittir_core::options::AddressNode::Branch { key: "colon", path: "(inline_flags_group_disable)/\":\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_AFTER, path: "(inline_flags_group_disable)/\":\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_BEFORE, path: "(inline_flags_group_disable)/\":\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "dash", path: "(inline_flags_group_disable)/\"-\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER, path: "(inline_flags_group_disable)/\"-\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_BEFORE, path: "(inline_flags_group_disable)/\"-\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(inline_flags_group_disable)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_LPAREN_QMARK_AFTER, path: "(inline_flags_group_disable)/\"(?\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(inline_flags_group_disable)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_DISABLE_RPAREN_BEFORE, path: "(inline_flags_group_disable)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "inlineFlagsGroupEnable", path: "(inline_flags_group_enable)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_AFTER, path: "(inline_flags_group_enable)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_BEFORE, path: "(inline_flags_group_enable)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "colon", path: "(inline_flags_group_enable)/\":\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_AFTER, path: "(inline_flags_group_enable)/\":\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_BEFORE, path: "(inline_flags_group_enable)/\":\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(inline_flags_group_enable)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER, path: "(inline_flags_group_enable)/\"(?\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(inline_flags_group_enable)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_ENABLE_RPAREN_BEFORE, path: "(inline_flags_group_enable)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "inlineFlagsGroupToggle", path: "(inline_flags_group_toggle)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_AFTER, path: "(inline_flags_group_toggle)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_BEFORE, path: "(inline_flags_group_toggle)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "colon", path: "(inline_flags_group_toggle)/\":\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_AFTER, path: "(inline_flags_group_toggle)/\":\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_BEFORE, path: "(inline_flags_group_toggle)/\":\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "dash", path: "(inline_flags_group_toggle)/\"-\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER, path: "(inline_flags_group_toggle)/\"-\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_BEFORE, path: "(inline_flags_group_toggle)/\"-\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(inline_flags_group_toggle)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER, path: "(inline_flags_group_toggle)/\"(?\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(inline_flags_group_toggle)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE, path: "(inline_flags_group_toggle)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "lookaheadAssertion", path: "(lookahead_assertion)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_AFTER, path: "(lookahead_assertion)/after" }] },
        ::sittir_core::options::AddressNode::Branch { key: "bang", path: "(lookahead_assertion)/\"!\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_BANG_AFTER, path: "(lookahead_assertion)/\"!\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_BANG_BEFORE, path: "(lookahead_assertion)/\"!\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_BEFORE, path: "(lookahead_assertion)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "eq", path: "(lookahead_assertion)/\"=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_EQ_AFTER, path: "(lookahead_assertion)/\"=\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_EQ_BEFORE, path: "(lookahead_assertion)/\"=\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmark", path: "(lookahead_assertion)/\"(?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_LPAREN_QMARK_AFTER, path: "(lookahead_assertion)/\"(?\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(lookahead_assertion)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKAHEAD_ASSERTION_RPAREN_BEFORE, path: "(lookahead_assertion)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "lookbehindAssertion", path: "(lookbehind_assertion)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_AFTER, path: "(lookbehind_assertion)/after" }] },
        ::sittir_core::options::AddressNode::Branch { key: "bang", path: "(lookbehind_assertion)/\"!\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_BANG_AFTER, path: "(lookbehind_assertion)/\"!\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE, path: "(lookbehind_assertion)/\"!\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_BEFORE, path: "(lookbehind_assertion)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "eq", path: "(lookbehind_assertion)/\"=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_EQ_AFTER, path: "(lookbehind_assertion)/\"=\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE, path: "(lookbehind_assertion)/\"=\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkLt", path: "(lookbehind_assertion)/\"(?<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER, path: "(lookbehind_assertion)/\"(?<\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(lookbehind_assertion)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LOOKBEHIND_ASSERTION_RPAREN_BEFORE, path: "(lookbehind_assertion)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedCapturingGroup", path: "(named_capturing_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_AFTER, path: "(named_capturing_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_BEFORE, path: "(named_capturing_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "gt", path: "(named_capturing_group)/\">\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_GT_AFTER, path: "(named_capturing_group)/\">\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_GT_BEFORE, path: "(named_capturing_group)/\">\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkLt", path: "(named_capturing_group)/\"(?<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER, path: "(named_capturing_group)/\"(?<\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkpLt", path: "(named_capturing_group)/\"(?P<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARKP_LT_AFTER, path: "(named_capturing_group)/\"(?P<\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_capturing_group)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE, path: "(named_capturing_group)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedGroupBackreference", path: "(named_group_backreference)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_AFTER, path: "(named_group_backreference)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_BEFORE, path: "(named_group_backreference)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkpEq", path: "(named_group_backreference)/\"(?P=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARKP_EQ_AFTER, path: "(named_group_backreference)/\"(?P=\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_group_backreference)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE, path: "(named_group_backreference)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "nonCapturingGroup", path: "(non_capturing_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_AFTER, path: "(non_capturing_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_BEFORE, path: "(non_capturing_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkColon", path: "(non_capturing_group)/\"(?:\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NON_CAPTURING_GROUP_LPAREN_QMARK_COLON_AFTER, path: "(non_capturing_group)/\"(?:\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(non_capturing_group)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NON_CAPTURING_GROUP_RPAREN_BEFORE, path: "(non_capturing_group)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "oneOrMore", path: "(one_or_more)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "plus", path: "(one_or_more)/\"+\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ONE_OR_MORE_PLUS_AFTER, path: "(one_or_more)/\"+\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "optional", path: "(optional)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "qmark", path: "(optional)/\"?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_OPTIONAL_QMARK_AFTER, path: "(optional)/\"?\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "posixCharacterClass", path: "(posix_character_class)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_AFTER, path: "(posix_character_class)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_BEFORE, path: "(posix_character_class)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "colonRbrack", path: "(posix_character_class)/\":]\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_POSIX_CHARACTER_CLASS_COLON_RBRACK_BEFORE, path: "(posix_character_class)/\":]\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrackColon", path: "(posix_character_class)/\"[:\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER, path: "(posix_character_class)/\"[:\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "term", path: "(term)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "termGroup", path: "(term)/term_group:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_TERM_GROUP_SEPARATOR_SPACE, path: "(term)/term_group:/separator" }] },
            ::sittir_core::options::AddressNode::Branch { key: "termGroup", path: "(term)/term_group:/(term_group)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_TERM_GROUP_TERM_GROUP_AFTER, path: "(term)/term_group:/(term_group)/after" }] },
            ] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "termGroup", path: "(term_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_TERM_GROUP_AFTER, path: "(term_group)/after" }] },
        ::sittir_core::options::AddressNode::Branch { key: "anyCharacter", path: "(term_group)/any_character:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_ANY_CHARACTER_AFTER, path: "(term_group)/any_character:/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_TERM_GROUP_BEFORE, path: "(term_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "boundaryAssertion", path: "(term_group)/boundary_assertion:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_BOUNDARY_ASSERTION_AFTER, path: "(term_group)/boundary_assertion:/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "caret", path: "(term_group)/\"^\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_CARET_AFTER, path: "(term_group)/\"^\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "endAssertion", path: "(term_group)/end_assertion:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_END_ASSERTION_AFTER, path: "(term_group)/end_assertion:/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "nonBoundaryAssertion", path: "(term_group)/non_boundary_assertion:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_TERM_GROUP_NON_BOUNDARY_ASSERTION_AFTER, path: "(term_group)/non_boundary_assertion:/after" }] },
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
    ::sittir_core::options::AddressNode::Branch { key: "zeroOrMore", path: "(zero_or_more)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "star", path: "(zero_or_more)/\"*\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ZERO_OR_MORE_STAR_AFTER, path: "(zero_or_more)/\"*\"/after" }] },
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
        assert_eq!(resolve("{\"alternation\":{\"no_such_address\":1}}"), Err("options: (alternation)/no_such_address names no site".to_string()));
    }

    #[test]
    fn a_differing_admitted_value_changes_only_its_own_sites() {
        let table = resolve("{\"alternation\":{\"term\":{\"separator\":{\"pipe\":{\"after\":47}}}}}").unwrap();
        let expected = defaults();
        let named = [SITE_ALTERNATION_TERM_SEPARATOR_SPACE_AFTER];
        for i in 0..table.spacing.len() {
            assert_eq!(table.spacing[i].arm, if named.contains(&i) { 47 } else { expected.spacing[i].arm });
        }
        assert_eq!(table.delimiter, expected.delimiter);
        assert_eq!(table.indent, expected.indent);
    }

    #[test]
    fn a_value_the_site_does_not_admit_is_refused_with_its_path() {
        assert_eq!(resolve("{\"alternation\":{\"term\":{\"separator\":{\"pipe\":{\"after\":65535}}}}}"), Err("options: (alternation)/term:/separator/\"|\"/after does not admit kind id 65535 (allowed: [47, 48, 49])".to_string()));
    }
}

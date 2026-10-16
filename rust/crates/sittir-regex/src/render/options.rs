// @generated — render options: site table and resolver. Do not hand-edit.

use ::sittir_core::options::{ResolvedOptions, SeatPath};
use ::sittir_core::types::{EdgeRow, FlankId, KindId, SiteId};

pub const SPACING_SITE_COUNT: usize = 125;
pub const DELIMITER_SITE_COUNT: usize = 0;

pub const SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_BEFORE: SiteId = SiteId(0);
pub const SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_AFTER: SiteId = SiteId(1);
pub const SITE_ANONYMOUS_CAPTURING_GROUP_LPAREN_AFTER: SiteId = SiteId(2);
pub const SITE_ANONYMOUS_CAPTURING_GROUP_RPAREN_BEFORE: SiteId = SiteId(3);
pub const SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_BEFORE: SiteId = SiteId(4);
pub const SITE_ANONYMOUS_CAPTURING_GROUP_ANONYMOUS_CAPTURING_GROUP_AFTER: SiteId = SiteId(5);
pub const SITE_BACKREFERENCE_ESCAPE_LT_BEFORE: SiteId = SiteId(6);
pub const SITE_BACKREFERENCE_ESCAPE_LT_AFTER: SiteId = SiteId(7);
pub const SITE_BACKREFERENCE_ESCAPE_GT_BEFORE: SiteId = SiteId(8);
pub const SITE_BACKREFERENCE_ESCAPE_BSLASHK_AFTER: SiteId = SiteId(9);
pub const SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_BEFORE: SiteId = SiteId(10);
pub const SITE_BACKREFERENCE_ESCAPE_BACKREFERENCE_ESCAPE_AFTER: SiteId = SiteId(11);
pub const SITE_CHARACTER_CLASS_LEADING_BEFORE: SiteId = SiteId(12);
pub const SITE_CHARACTER_CLASS_LEADING_AFTER: SiteId = SiteId(13);
pub const SITE_CHARACTER_CLASS_TRAILING_BEFORE: SiteId = SiteId(14);
pub const SITE_CHARACTER_CLASS_TRAILING_AFTER: SiteId = SiteId(15);
pub const SITE_CHARACTER_CLASS_LBRACK_AFTER: SiteId = SiteId(16);
pub const SITE_CHARACTER_CLASS_RBRACK_BEFORE: SiteId = SiteId(17);
pub const SITE_CHARACTER_CLASS_CARET_BEFORE: SiteId = SiteId(18);
pub const SITE_CHARACTER_CLASS_CARET_AFTER: SiteId = SiteId(19);
pub const SITE_CHARACTER_CLASS_CHARACTER_CLASS_BEFORE: SiteId = SiteId(20);
pub const SITE_CHARACTER_CLASS_CHARACTER_CLASS_AFTER: SiteId = SiteId(21);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_BEFORE: SiteId = SiteId(22);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_LBRACE_AFTER: SiteId = SiteId(23);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_RBRACE_BEFORE: SiteId = SiteId(24);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_BEFORE: SiteId = SiteId(25);
pub const SITE_CHARACTER_CLASS_ESCAPE_ARM_CHARACTER_CLASS_ESCAPE_ARM_AFTER: SiteId = SiteId(26);
pub const SITE_CLASS_RANGE_DASH_BEFORE: SiteId = SiteId(27);
pub const SITE_CLASS_RANGE_DASH_AFTER: SiteId = SiteId(28);
pub const SITE_CLASS_RANGE_CLASS_RANGE_BEFORE: SiteId = SiteId(29);
pub const SITE_CLASS_RANGE_CLASS_RANGE_AFTER: SiteId = SiteId(30);
pub const SITE_COUNT_QUANTIFIER_LBRACE_AFTER: SiteId = SiteId(31);
pub const SITE_COUNT_QUANTIFIER_RBRACE_BEFORE: SiteId = SiteId(32);
pub const SITE_COUNT_QUANTIFIER_RBRACE_AFTER: SiteId = SiteId(33);
pub const SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_BEFORE: SiteId = SiteId(34);
pub const SITE_COUNT_QUANTIFIER_COUNT_QUANTIFIER_AFTER: SiteId = SiteId(35);
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_BEFORE: SiteId = SiteId(36);
pub const SITE_COUNT_QUANTIFIER_ARM_COUNT_QUANTIFIER_ARM_AFTER: SiteId = SiteId(37);
pub const SITE_COUNT_QUANTIFIER_GROUP_COMMA_AFTER: SiteId = SiteId(38);
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_BEFORE: SiteId = SiteId(39);
pub const SITE_COUNT_QUANTIFIER_GROUP_COUNT_QUANTIFIER_GROUP_AFTER: SiteId = SiteId(40);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_LPAREN_QMARK_AFTER: SiteId = SiteId(41);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_RPAREN_BEFORE: SiteId = SiteId(42);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_BEFORE: SiteId = SiteId(43);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_DASH_AFTER: SiteId = SiteId(44);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_BEFORE: SiteId = SiteId(45);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_COLON_AFTER: SiteId = SiteId(46);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_BEFORE: SiteId = SiteId(47);
pub const SITE_INLINE_FLAGS_GROUP_DISABLE_INLINE_FLAGS_GROUP_DISABLE_AFTER: SiteId = SiteId(48);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_LPAREN_QMARK_AFTER: SiteId = SiteId(49);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_RPAREN_BEFORE: SiteId = SiteId(50);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_BEFORE: SiteId = SiteId(51);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_COLON_AFTER: SiteId = SiteId(52);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_BEFORE: SiteId = SiteId(53);
pub const SITE_INLINE_FLAGS_GROUP_ENABLE_INLINE_FLAGS_GROUP_ENABLE_AFTER: SiteId = SiteId(54);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_LPAREN_QMARK_AFTER: SiteId = SiteId(55);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_RPAREN_BEFORE: SiteId = SiteId(56);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_BEFORE: SiteId = SiteId(57);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_DASH_AFTER: SiteId = SiteId(58);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_BEFORE: SiteId = SiteId(59);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_COLON_AFTER: SiteId = SiteId(60);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_BEFORE: SiteId = SiteId(61);
pub const SITE_INLINE_FLAGS_GROUP_TOGGLE_INLINE_FLAGS_GROUP_TOGGLE_AFTER: SiteId = SiteId(62);
pub const SITE_LOOKAHEAD_ASSERTION_BANG_BEFORE: SiteId = SiteId(63);
pub const SITE_LOOKAHEAD_ASSERTION_BANG_AFTER: SiteId = SiteId(64);
pub const SITE_LOOKAHEAD_ASSERTION_LPAREN_QMARK_AFTER: SiteId = SiteId(65);
pub const SITE_LOOKAHEAD_ASSERTION_RPAREN_BEFORE: SiteId = SiteId(66);
pub const SITE_LOOKAHEAD_ASSERTION_EQ_BEFORE: SiteId = SiteId(67);
pub const SITE_LOOKAHEAD_ASSERTION_EQ_AFTER: SiteId = SiteId(68);
pub const SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_BEFORE: SiteId = SiteId(69);
pub const SITE_LOOKAHEAD_ASSERTION_LOOKAHEAD_ASSERTION_AFTER: SiteId = SiteId(70);
pub const SITE_LOOKBEHIND_ASSERTION_BANG_BEFORE: SiteId = SiteId(71);
pub const SITE_LOOKBEHIND_ASSERTION_BANG_AFTER: SiteId = SiteId(72);
pub const SITE_LOOKBEHIND_ASSERTION_LPAREN_QMARK_LT_AFTER: SiteId = SiteId(73);
pub const SITE_LOOKBEHIND_ASSERTION_RPAREN_BEFORE: SiteId = SiteId(74);
pub const SITE_LOOKBEHIND_ASSERTION_EQ_BEFORE: SiteId = SiteId(75);
pub const SITE_LOOKBEHIND_ASSERTION_EQ_AFTER: SiteId = SiteId(76);
pub const SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_BEFORE: SiteId = SiteId(77);
pub const SITE_LOOKBEHIND_ASSERTION_LOOKBEHIND_ASSERTION_AFTER: SiteId = SiteId(78);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_BEFORE: SiteId = SiteId(79);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER: SiteId = SiteId(80);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_BEFORE: SiteId = SiteId(81);
pub const SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER: SiteId = SiteId(82);
pub const SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE: SiteId = SiteId(83);
pub const SITE_NAMED_CAPTURING_GROUP_GT_BEFORE: SiteId = SiteId(84);
pub const SITE_NAMED_CAPTURING_GROUP_GT_AFTER: SiteId = SiteId(85);
pub const SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_BEFORE: SiteId = SiteId(86);
pub const SITE_NAMED_CAPTURING_GROUP_NAMED_CAPTURING_GROUP_AFTER: SiteId = SiteId(87);
pub const SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARK_P_EQ_AFTER: SiteId = SiteId(88);
pub const SITE_NAMED_GROUP_BACKREFERENCE_RPAREN_BEFORE: SiteId = SiteId(89);
pub const SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_BEFORE: SiteId = SiteId(90);
pub const SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_AFTER: SiteId = SiteId(91);
pub const SITE_NON_CAPTURING_GROUP_LPAREN_QMARK_COLON_AFTER: SiteId = SiteId(92);
pub const SITE_NON_CAPTURING_GROUP_RPAREN_BEFORE: SiteId = SiteId(93);
pub const SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_BEFORE: SiteId = SiteId(94);
pub const SITE_NON_CAPTURING_GROUP_NON_CAPTURING_GROUP_AFTER: SiteId = SiteId(95);
pub const SITE_ONE_OR_MORE_PLUS_AFTER: SiteId = SiteId(96);
pub const SITE_ONE_OR_MORE_ONE_OR_MORE_BEFORE: SiteId = SiteId(97);
pub const SITE_ONE_OR_MORE_ONE_OR_MORE_AFTER: SiteId = SiteId(98);
pub const SITE_OPTIONAL_QMARK_AFTER: SiteId = SiteId(99);
pub const SITE_OPTIONAL_OPTIONAL_BEFORE: SiteId = SiteId(100);
pub const SITE_OPTIONAL_OPTIONAL_AFTER: SiteId = SiteId(101);
pub const SITE_PATTERN_PATTERN_BEFORE: SiteId = SiteId(102);
pub const SITE_PATTERN_PATTERN_AFTER: SiteId = SiteId(103);
pub const SITE_POSIX_CHARACTER_CLASS_COLON_RBRACK_BEFORE: SiteId = SiteId(104);
pub const SITE_POSIX_CHARACTER_CLASS_LBRACK_COLON_AFTER: SiteId = SiteId(105);
pub const SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_BEFORE: SiteId = SiteId(106);
pub const SITE_POSIX_CHARACTER_CLASS_POSIX_CHARACTER_CLASS_AFTER: SiteId = SiteId(107);
pub const SITE_TERM_TERM_GROUP_TERM_GROUP_AFTER: SiteId = SiteId(108);
pub const SITE_TERM_TERM_GROUP_SEPARATOR_SPACE: SiteId = SiteId(109);
pub const SITE_TERM_GROUP_ANY_CHARACTER_AFTER: SiteId = SiteId(110);
pub const SITE_TERM_GROUP_BOUNDARY_ASSERTION_AFTER: SiteId = SiteId(111);
pub const SITE_TERM_GROUP_END_ASSERTION_AFTER: SiteId = SiteId(112);
pub const SITE_TERM_GROUP_NON_BOUNDARY_ASSERTION_AFTER: SiteId = SiteId(113);
pub const SITE_TERM_GROUP_CARET_AFTER: SiteId = SiteId(114);
pub const SITE_TERM_GROUP_TERM_GROUP_BEFORE: SiteId = SiteId(115);
pub const SITE_TERM_GROUP_TERM_GROUP_AFTER: SiteId = SiteId(116);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_BEFORE: SiteId = SiteId(117);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_UNICODE_PROPERTY_VALUE_EXPRESSION_AFTER: SiteId = SiteId(118);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_EQ_BEFORE: SiteId = SiteId(119);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_BEFORE: SiteId = SiteId(120);
pub const SITE_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP_AFTER: SiteId = SiteId(121);
pub const SITE_ZERO_OR_MORE_STAR_AFTER: SiteId = SiteId(122);
pub const SITE_ZERO_OR_MORE_ZERO_OR_MORE_BEFORE: SiteId = SiteId(123);
pub const SITE_ZERO_OR_MORE_ZERO_OR_MORE_AFTER: SiteId = SiteId(124);

/// (kind, address, label, allowed kind ids), in canonical path order.
pub static SPACING_SITES: &[(&str, &str, &str, &[KindId])] = &[
    ("alternation", "terms_separator_space_before", "pipe_separator_space_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("alternation", "terms_separator_space_after", "pipe_separator_space_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("anonymous_capturing_group", "lparen_after", "lparen_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("anonymous_capturing_group", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("anonymous_capturing_group", "anonymous_capturing_group_before", "anonymous_capturing_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("anonymous_capturing_group", "anonymous_capturing_group_after", "anonymous_capturing_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "lt_before", "lt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "lt_after", "lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "gt_before", "gt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "bslashk_after", "bslashk_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "backreference_escape_before", "backreference_escape_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("backreference_escape", "backreference_escape_after", "backreference_escape_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "leading_before", "leading_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "leading_after", "leading_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "trailing_before", "trailing_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "trailing_after", "trailing_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "lbrack_after", "lbrack_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "rbrack_before", "rbrack_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "caret_before", "caret_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "caret_after", "caret_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "character_class_before", "character_class_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class", "character_class_after", "character_class_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "lbrace_before", "lbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "lbrace_after", "lbrace_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "rbrace_before", "rbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "character_class_escape_arm_before", "character_class_escape_arm_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("character_class_escape_arm", "character_class_escape_arm_after", "character_class_escape_arm_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("class_range", "dash_before", "dash_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("class_range", "dash_after", "dash_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("class_range", "class_range_before", "class_range_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("class_range", "class_range_after", "class_range_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "lbrace_after", "lbrace_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "rbrace_before", "rbrace_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "rbrace_after", "rbrace_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "count_quantifier_before", "count_quantifier_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier", "count_quantifier_after", "count_quantifier_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_arm", "count_quantifier_arm_before", "count_quantifier_arm_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_arm", "count_quantifier_arm_after", "count_quantifier_arm_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "comma_after", "comma_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "count_quantifier_group_before", "count_quantifier_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("count_quantifier_group", "count_quantifier_group_after", "count_quantifier_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "dash_before", "dash_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "dash_after", "dash_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "colon_before", "colon_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "colon_after", "colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "inline_flags_group_disable_before", "inline_flags_group_disable_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_disable", "inline_flags_group_disable_after", "inline_flags_group_disable_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "colon_before", "colon_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "colon_after", "colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "inline_flags_group_enable_before", "inline_flags_group_enable_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_enable", "inline_flags_group_enable_after", "inline_flags_group_enable_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "dash_before", "dash_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "dash_after", "dash_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "colon_before", "colon_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "colon_after", "colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_before", "inline_flags_group_toggle_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("inline_flags_group_toggle", "inline_flags_group_toggle_after", "inline_flags_group_toggle_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "bang_before", "bang_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "bang_after", "bang_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "lparen_qmark_after", "lparen_qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "eq_before", "eq_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "eq_after", "eq_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "lookahead_assertion_before", "lookahead_assertion_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookahead_assertion", "lookahead_assertion_after", "lookahead_assertion_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "bang_before", "bang_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "bang_after", "bang_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "eq_before", "eq_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "eq_after", "eq_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "lookbehind_assertion_before", "lookbehind_assertion_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("lookbehind_assertion", "lookbehind_assertion_after", "lookbehind_assertion_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmark_lt_before", "lparen_qmark_lt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmark_lt_after", "lparen_qmark_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmarkP_lt_before", "lparen_qmarkP_lt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "lparen_qmarkP_lt_after", "lparen_qmarkP_lt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "gt_before", "gt_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "gt_after", "gt_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "named_capturing_group_before", "named_capturing_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_capturing_group", "named_capturing_group_after", "named_capturing_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "lparen_qmarkP_eq_after", "lparen_qmarkP_eq_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "named_group_backreference_before", "named_group_backreference_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("named_group_backreference", "named_group_backreference_after", "named_group_backreference_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("non_capturing_group", "lparen_qmark_colon_after", "lparen_qmark_colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("non_capturing_group", "rparen_before", "rparen_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("non_capturing_group", "non_capturing_group_before", "non_capturing_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("non_capturing_group", "non_capturing_group_after", "non_capturing_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("one_or_more", "plus_after", "plus_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("one_or_more", "one_or_more_before", "one_or_more_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("one_or_more", "one_or_more_after", "one_or_more_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("optional", "qmark_after", "qmark_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("optional", "optional_before", "optional_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("optional", "optional_after", "optional_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("pattern", "pattern_before", "pattern_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("pattern", "pattern_after", "pattern_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("posix_character_class", "colon_rbrack_before", "colon_rbrack_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("posix_character_class", "lbrack_colon_after", "lbrack_colon_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("posix_character_class", "posix_character_class_before", "posix_character_class_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("posix_character_class", "posix_character_class_after", "posix_character_class_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term", "term_group_term_group_after", "term_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term", "term_group_separator_space", "empty_separator_space", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "any_character_after", "any_character_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "boundary_assertion_after", "boundary_assertion_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "end_assertion_after", "end_assertion_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "non_boundary_assertion_after", "non_boundary_assertion_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "caret_after", "caret_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "term_group_before", "term_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("term_group", "term_group_after", "term_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression", "unicode_property_value_expression_before", "unicode_property_value_expression_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression", "unicode_property_value_expression_after", "unicode_property_value_expression_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "eq_before", "eq_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_before", "unicode_property_value_expression_group_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("unicode_property_value_expression_group", "unicode_property_value_expression_group_after", "unicode_property_value_expression_group_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("zero_or_more", "star_after", "star_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("zero_or_more", "zero_or_more_before", "zero_or_more_before", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
    ("zero_or_more", "zero_or_more_after", "zero_or_more_after", &[KindId(47), KindId(48), KindId(49), KindId(50)]),
];

/// The before and after site of every kind that owns edge seams, in kind id order.
pub static EDGE_SITES: &[::sittir_core::options::EdgeSite] = &[
    ::sittir_core::options::EdgeSite { before: Some(SiteId(102)), after: Some(SiteId(103)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(69)), after: Some(SiteId(70)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(77)), after: Some(SiteId(78)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(20)), after: Some(SiteId(21)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(106)), after: Some(SiteId(107)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(29)), after: Some(SiteId(30)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(4)), after: Some(SiteId(5)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(86)), after: Some(SiteId(87)), before_arms: &[::sittir_core::options::ArmSite { arm: KindId(11), site: SiteId(79) }, ::sittir_core::options::ArmSite { arm: KindId(22), site: SiteId(81) }], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(94)), after: Some(SiteId(95)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(123)), after: Some(SiteId(124)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(97)), after: Some(SiteId(98)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(100)), after: Some(SiteId(101)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(34)), after: Some(SiteId(35)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(10)), after: Some(SiteId(11)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(90)), after: Some(SiteId(91)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(117)), after: Some(SiteId(118)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(115)), after: Some(SiteId(116)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(39)), after: Some(SiteId(40)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(36)), after: Some(SiteId(37)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(25)), after: Some(SiteId(26)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(120)), after: Some(SiteId(121)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(53)), after: Some(SiteId(54)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(61)), after: Some(SiteId(62)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(47)), after: Some(SiteId(48)), before_arms: &[], after_arms: &[] },
];

/// Per kind id, its row in EDGE_SITES.
pub static EDGE_ROWS: &[Option<EdgeRow>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, Some(EdgeRow(0)), None, None, None, None, Some(EdgeRow(1)), Some(EdgeRow(2)), Some(EdgeRow(3)), Some(EdgeRow(4)), None, Some(EdgeRow(5)), Some(EdgeRow(6)), Some(EdgeRow(7)),
    Some(EdgeRow(8)), None, None, Some(EdgeRow(9)), Some(EdgeRow(10)), Some(EdgeRow(11)), Some(EdgeRow(12)), Some(EdgeRow(13)), Some(EdgeRow(14)), None, None, Some(EdgeRow(15)), None, Some(EdgeRow(16)), Some(EdgeRow(17)), Some(EdgeRow(18)),
    Some(EdgeRow(19)), Some(EdgeRow(20)), None, Some(EdgeRow(21)), Some(EdgeRow(22)), Some(EdgeRow(23)),
];

/// Per kind id, its flags: KIND_ANON (the parser's anonymous token), KIND_LINE_TERMINATED, KIND_LINE_BREAK_TERMINATED, KIND_ROOT.
pub static KIND_FLAGS: &[u8] = &[
    0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
];

/// Per kind id, the layout kinds its leaf pattern takes before it (low byte) and after it (high byte); 0 where the kind has no stamp.
pub const LEAF_EDGES: &[u16] = &[
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 257,
];

/// (kind, `<slot>_delimiter` key, allowed bitflag union, default bitflag), in site order.
pub static DELIMITER_SITES: &[(&str, &str, u8, u8)] = &[
];

pub const INDENT_KIND: KindId = KindId(0);
pub const DEDENT_KIND: KindId = KindId(0);

/// (kind, its indent-capable sites in rule order): an indent opened at one site is dedented at a later one of the same kind.
pub static DEPTH_SITES: &[(&str, &[SiteId])] = &[
];

/// Per kind id, the stretches of its children its template indents one level, by their anchors.
pub static DEPTH_REGIONS: &[::sittir_core::trivia_table::DepthRegion] = &[
];

pub fn spacing_text(kind: KindId) -> &'static str {
    match kind {
        KindId(47) => "",
        KindId(48) => "\n",
        KindId(49) => "\n\n",
        KindId(50) => "\n\n\n",
        _ => "",
    }
}

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

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_TERM_TERM_GROUP: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, Some(SiteId(108)),
];

/// Per kind id of a wrapper, the way its seat passes through to the node it holds.
pub static SEAT_WRAPPERS: &[Option<SeatPath>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, Some(SeatPath::Content), None, None, None, Some(SeatPath::Content), None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, Some(SeatPath::Content),
];

pub fn defaults() -> ResolvedOptions {
    ResolvedOptions {
        spacing: ResolvedOptions::default_spacing(SITE_SPECS),
        delimiter: DELIMITER_SITES.iter().map(|s| s.3).collect(),
        edges: EDGE_SITES,
        edge_rows: EDGE_ROWS,
        kind_flags: KIND_FLAGS,
        seat_wrappers: SEAT_WRAPPERS,
        sites: SITE_SPECS,
        newline: "\n".to_string(),
        ..ResolvedOptions::default()
    }
}

pub fn delimiter_allowed(site: FlankId) -> u8 {
    DELIMITER_SITES[site.index()].2
}

pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[
    ::sittir_core::options::AddressNode::Branch { key: "alternation", path: "(alternation)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "terms", path: "(alternation)/terms:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "separator", path: "(alternation)/terms:/separator", children: &[
                ::sittir_core::options::AddressNode::Branch { key: "pipe", path: "(alternation)/terms:/separator/\"|\"", children: &[
                    ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_AFTER, path: "(alternation)/terms:/separator/\"|\"/after" }] },
                    ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_BEFORE, path: "(alternation)/terms:/separator/\"|\"/before" }] },
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
        ::sittir_core::options::AddressNode::Branch { key: "caret", path: "(character_class)/\"^\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_CARET_AFTER, path: "(character_class)/\"^\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_CARET_BEFORE, path: "(character_class)/\"^\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrack", path: "(character_class)/\"[\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_LBRACK_AFTER, path: "(character_class)/\"[\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "leading", path: "(character_class)/leading:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_LEADING_AFTER, path: "(character_class)/leading:/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_LEADING_BEFORE, path: "(character_class)/leading:/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrack", path: "(character_class)/\"]\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_RBRACK_BEFORE, path: "(character_class)/\"]\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "trailing", path: "(character_class)/trailing:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_TRAILING_AFTER, path: "(character_class)/trailing:/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CHARACTER_CLASS_TRAILING_BEFORE, path: "(character_class)/trailing:/before" }] },
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
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkPLt", path: "(named_capturing_group)/\"(?P<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_AFTER, path: "(named_capturing_group)/\"(?P<\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_P_LT_BEFORE, path: "(named_capturing_group)/\"(?P<\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkLt", path: "(named_capturing_group)/\"(?<\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_AFTER, path: "(named_capturing_group)/\"(?<\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_LPAREN_QMARK_LT_BEFORE, path: "(named_capturing_group)/\"(?<\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_capturing_group)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_CAPTURING_GROUP_RPAREN_BEFORE, path: "(named_capturing_group)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedGroupBackreference", path: "(named_group_backreference)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_AFTER, path: "(named_group_backreference)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_NAMED_GROUP_BACKREFERENCE_BEFORE, path: "(named_group_backreference)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparenQmarkPEq", path: "(named_group_backreference)/\"(?P=\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_GROUP_BACKREFERENCE_LPAREN_QMARK_P_EQ_AFTER, path: "(named_group_backreference)/\"(?P=\"/after" }] },
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
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ONE_OR_MORE_ONE_OR_MORE_AFTER, path: "(one_or_more)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ONE_OR_MORE_ONE_OR_MORE_BEFORE, path: "(one_or_more)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "plus", path: "(one_or_more)/\"+\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ONE_OR_MORE_PLUS_AFTER, path: "(one_or_more)/\"+\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "optional", path: "(optional)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_OPTIONAL_OPTIONAL_AFTER, path: "(optional)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_OPTIONAL_OPTIONAL_BEFORE, path: "(optional)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "qmark", path: "(optional)/\"?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_OPTIONAL_QMARK_AFTER, path: "(optional)/\"?\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "pattern", path: "(pattern)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PATTERN_PATTERN_AFTER, path: "(pattern)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PATTERN_PATTERN_BEFORE, path: "(pattern)/before" }] },
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
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ZERO_OR_MORE_ZERO_OR_MORE_AFTER, path: "(zero_or_more)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ZERO_OR_MORE_ZERO_OR_MORE_BEFORE, path: "(zero_or_more)/before" }] },
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
        indent_chars: "",
        newline_arms: &["\n", "\r\n", "\r"],
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
        let table = resolve("{\"alternation\":{\"terms\":{\"separator\":{\"pipe\":{\"after\":48}}}}}").unwrap();
        let expected = defaults();
        let named = [SITE_ALTERNATION_TERMS_SEPARATOR_SPACE_AFTER];
        for i in 0..table.spacing.len() {
            assert_eq!(table.spacing[i].arm, if named.iter().any(|site| site.index() == i) { KindId(48) } else { expected.spacing[i].arm });
        }
        assert_eq!(table.delimiter, expected.delimiter);
        assert_eq!(table.indent, expected.indent);
    }

    #[test]
    fn a_value_the_site_does_not_admit_is_refused_with_its_path() {
        assert_eq!(resolve("{\"alternation\":{\"terms\":{\"separator\":{\"pipe\":{\"after\":65534}}}}}"), Err("options: (alternation)/terms:/separator/\"|\"/after does not admit kind id 65534 (allowed: [47, 48, 49, 50])".to_string()));
    }
}

// @generated — render options: site table and resolver. Do not hand-edit.

use ::sittir_core::options::{ResolvedOptions, SeatPath};
use ::sittir_core::types::{EdgeRow, FlankId, KindId, SiteId};

pub const SPACING_SITE_COUNT: usize = 152;
pub const DELIMITER_SITE_COUNT: usize = 0;

pub const SITE_ANONYMOUS_NODE_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(0);
pub const SITE_ANONYMOUS_NODE_ELEMENTS_END: SiteId = SiteId(1);
pub const SITE_ANONYMOUS_NODE_ELEMENTS_START: SiteId = SiteId(2);
pub const SITE_ANONYMOUS_NODE_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(3);
pub const SITE_ANONYMOUS_NODE_UNDERSCORE_AFTER: SiteId = SiteId(4);
pub const SITE_ANONYMOUS_NODE_ANONYMOUS_NODE_BEFORE: SiteId = SiteId(5);
pub const SITE_ANONYMOUS_NODE_ANONYMOUS_NODE_AFTER: SiteId = SiteId(6);
pub const SITE_CAPTURE_CAPTURE_BEFORE: SiteId = SiteId(7);
pub const SITE_CAPTURE_CAPTURE_AFTER: SiteId = SiteId(8);
pub const SITE_FIELD_DEFINITION_COLON_BEFORE: SiteId = SiteId(9);
pub const SITE_FIELD_DEFINITION_COLON_AFTER: SiteId = SiteId(10);
pub const SITE_FIELD_DEFINITION_FIELD_DEFINITION_BEFORE: SiteId = SiteId(11);
pub const SITE_FIELD_DEFINITION_FIELD_DEFINITION_AFTER: SiteId = SiteId(12);
pub const SITE_GROUP_EXPRESSION_ARM_DOT_BEFORE: SiteId = SiteId(13);
pub const SITE_GROUP_EXPRESSION_ARM_DOT_AFTER: SiteId = SiteId(14);
pub const SITE_GROUP_EXPRESSION_ARM_GROUP_EXPRESSION_ARM_BEFORE: SiteId = SiteId(15);
pub const SITE_GROUP_EXPRESSION_ARM_GROUP_EXPRESSION_ARM_AFTER: SiteId = SiteId(16);
pub const SITE_GROUPING_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(17);
pub const SITE_GROUPING_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(18);
pub const SITE_GROUPING_GROUPING_GROUP_GROUPING_GROUP_AFTER: SiteId = SiteId(19);
pub const SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE: SiteId = SiteId(20);
pub const SITE_GROUPING_LPAREN_AFTER: SiteId = SiteId(21);
pub const SITE_GROUPING_RPAREN_BEFORE: SiteId = SiteId(22);
pub const SITE_GROUPING_RPAREN_AFTER: SiteId = SiteId(23);
pub const SITE_GROUPING_GROUPING_BEFORE: SiteId = SiteId(24);
pub const SITE_GROUPING_GROUPING_AFTER: SiteId = SiteId(25);
pub const SITE_GROUPING_GROUP_DOT_BEFORE: SiteId = SiteId(26);
pub const SITE_GROUPING_GROUP_GROUPING_GROUP_BEFORE: SiteId = SiteId(27);
pub const SITE_GROUPING_GROUP_GROUPING_GROUP_AFTER: SiteId = SiteId(28);
pub const SITE_IMMEDIATE_STRING_IMMEDIATE_STRING_AFTER: SiteId = SiteId(29);
pub const SITE_LIST_DEFINITIONS_ANONYMOUS_NODE_AFTER: SiteId = SiteId(30);
pub const SITE_LIST_DEFINITIONS_FIELD_DEFINITION_AFTER: SiteId = SiteId(31);
pub const SITE_LIST_DEFINITIONS_GROUPING_AFTER: SiteId = SiteId(32);
pub const SITE_LIST_DEFINITIONS_LIST_AFTER: SiteId = SiteId(33);
pub const SITE_LIST_DEFINITIONS_MISSING_NODE_AFTER: SiteId = SiteId(34);
pub const SITE_LIST_DEFINITIONS_NAMED_NODE_PLAIN_AFTER: SiteId = SiteId(35);
pub const SITE_LIST_DEFINITIONS_NAMED_NODE_SUPERTYPED_AFTER: SiteId = SiteId(36);
pub const SITE_LIST_DEFINITIONS_PREDICATE_AFTER: SiteId = SiteId(37);
pub const SITE_LIST_DEFINITIONS_SEPARATOR_SPACE: SiteId = SiteId(38);
pub const SITE_LIST_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(39);
pub const SITE_LIST_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(40);
pub const SITE_LIST_LBRACK_AFTER: SiteId = SiteId(41);
pub const SITE_LIST_RBRACK_BEFORE: SiteId = SiteId(42);
pub const SITE_LIST_RBRACK_AFTER: SiteId = SiteId(43);
pub const SITE_LIST_LIST_BEFORE: SiteId = SiteId(44);
pub const SITE_LIST_LIST_AFTER: SiteId = SiteId(45);
pub const SITE_MISSING_NODE_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(46);
pub const SITE_MISSING_NODE_ELEMENTS_END: SiteId = SiteId(47);
pub const SITE_MISSING_NODE_ELEMENTS_START: SiteId = SiteId(48);
pub const SITE_MISSING_NODE_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(49);
pub const SITE_MISSING_NODE_LPAREN_AFTER: SiteId = SiteId(50);
pub const SITE_MISSING_NODE_RPAREN_BEFORE: SiteId = SiteId(51);
pub const SITE_MISSING_NODE_RPAREN_AFTER: SiteId = SiteId(52);
pub const SITE_MISSING_NODE_MISSING_KEYWORD_BEFORE: SiteId = SiteId(53);
pub const SITE_MISSING_NODE_MISSING_KEYWORD_AFTER: SiteId = SiteId(54);
pub const SITE_MISSING_NODE_MISSING_NODE_BEFORE: SiteId = SiteId(55);
pub const SITE_MISSING_NODE_MISSING_NODE_AFTER: SiteId = SiteId(56);
pub const SITE_NAMED_NODE_EXPRESSION_ARM_DOT_BEFORE: SiteId = SiteId(57);
pub const SITE_NAMED_NODE_EXPRESSION_ARM_DOT_AFTER: SiteId = SiteId(58);
pub const SITE_NAMED_NODE_EXPRESSION_ARM_NAMED_NODE_EXPRESSION_ARM_BEFORE: SiteId = SiteId(59);
pub const SITE_NAMED_NODE_EXPRESSION_ARM_NAMED_NODE_EXPRESSION_ARM_AFTER: SiteId = SiteId(60);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_ANONYMOUS_NODE_AFTER: SiteId = SiteId(61);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_FIELD_DEFINITION_AFTER: SiteId = SiteId(62);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_GROUPING_AFTER: SiteId = SiteId(63);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_LIST_AFTER: SiteId = SiteId(64);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_MISSING_NODE_AFTER: SiteId = SiteId(65);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_EXPRESSION_ARM_AFTER: SiteId = SiteId(66);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_PLAIN_AFTER: SiteId = SiteId(67);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_SUPERTYPED_AFTER: SiteId = SiteId(68);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NEGATED_FIELD_AFTER: SiteId = SiteId(69);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_PREDICATE_AFTER: SiteId = SiteId(70);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_END: SiteId = SiteId(71);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_START: SiteId = SiteId(72);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE: SiteId = SiteId(73);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_BEFORE: SiteId = SiteId(74);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_AFTER: SiteId = SiteId(75);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_GROUP_ANCHORED_LAST_BEFORE: SiteId = SiteId(76);
pub const SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_GROUP_ANCHORED_LAST_AFTER: SiteId = SiteId(77);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_ANONYMOUS_NODE_AFTER: SiteId = SiteId(78);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_FIELD_DEFINITION_AFTER: SiteId = SiteId(79);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_GROUPING_AFTER: SiteId = SiteId(80);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_LIST_AFTER: SiteId = SiteId(81);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_MISSING_NODE_AFTER: SiteId = SiteId(82);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_EXPRESSION_ARM_AFTER: SiteId = SiteId(83);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_PLAIN_AFTER: SiteId = SiteId(84);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_SUPERTYPED_AFTER: SiteId = SiteId(85);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NEGATED_FIELD_AFTER: SiteId = SiteId(86);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_PREDICATE_AFTER: SiteId = SiteId(87);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_END: SiteId = SiteId(88);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_START: SiteId = SiteId(89);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE: SiteId = SiteId(90);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_DOT_AFTER: SiteId = SiteId(91);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_GROUP_CHILDREN_BEFORE: SiteId = SiteId(92);
pub const SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_GROUP_CHILDREN_AFTER: SiteId = SiteId(93);
pub const SITE_NAMED_NODE_PLAIN_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(94);
pub const SITE_NAMED_NODE_PLAIN_ELEMENTS_END: SiteId = SiteId(95);
pub const SITE_NAMED_NODE_PLAIN_ELEMENTS_START: SiteId = SiteId(96);
pub const SITE_NAMED_NODE_PLAIN_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(97);
pub const SITE_NAMED_NODE_PLAIN_LPAREN_AFTER: SiteId = SiteId(98);
pub const SITE_NAMED_NODE_PLAIN_RPAREN_BEFORE: SiteId = SiteId(99);
pub const SITE_NAMED_NODE_PLAIN_RPAREN_AFTER: SiteId = SiteId(100);
pub const SITE_NAMED_NODE_PLAIN_UNDERSCORE_BEFORE: SiteId = SiteId(101);
pub const SITE_NAMED_NODE_PLAIN_UNDERSCORE_AFTER: SiteId = SiteId(102);
pub const SITE_NAMED_NODE_PLAIN_NAMED_NODE_PLAIN_BEFORE: SiteId = SiteId(103);
pub const SITE_NAMED_NODE_PLAIN_NAMED_NODE_PLAIN_AFTER: SiteId = SiteId(104);
pub const SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(105);
pub const SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_END: SiteId = SiteId(106);
pub const SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_START: SiteId = SiteId(107);
pub const SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(108);
pub const SITE_NAMED_NODE_SUPERTYPED_LPAREN_AFTER: SiteId = SiteId(109);
pub const SITE_NAMED_NODE_SUPERTYPED_RPAREN_BEFORE: SiteId = SiteId(110);
pub const SITE_NAMED_NODE_SUPERTYPED_RPAREN_AFTER: SiteId = SiteId(111);
pub const SITE_NAMED_NODE_SUPERTYPED_NAMED_NODE_SUPERTYPED_BEFORE: SiteId = SiteId(112);
pub const SITE_NAMED_NODE_SUPERTYPED_NAMED_NODE_SUPERTYPED_AFTER: SiteId = SiteId(113);
pub const SITE_NEGATED_FIELD_BANG_AFTER: SiteId = SiteId(114);
pub const SITE_NEGATED_FIELD_NEGATED_FIELD_BEFORE: SiteId = SiteId(115);
pub const SITE_NEGATED_FIELD_NEGATED_FIELD_AFTER: SiteId = SiteId(116);
pub const SITE_PARAMETERS_ELEMENTS_CAPTURE_AFTER: SiteId = SiteId(117);
pub const SITE_PARAMETERS_ELEMENTS_STRING_AFTER: SiteId = SiteId(118);
pub const SITE_PARAMETERS_ELEMENTS_END: SiteId = SiteId(119);
pub const SITE_PARAMETERS_ELEMENTS_START: SiteId = SiteId(120);
pub const SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE: SiteId = SiteId(121);
pub const SITE_PARAMETERS_PARAMETERS_BEFORE: SiteId = SiteId(122);
pub const SITE_PARAMETERS_PARAMETERS_AFTER: SiteId = SiteId(123);
pub const SITE_PREDICATE_PREFIX_BEFORE: SiteId = SiteId(124);
pub const SITE_PREDICATE_LPAREN_AFTER: SiteId = SiteId(125);
pub const SITE_PREDICATE_RPAREN_BEFORE: SiteId = SiteId(126);
pub const SITE_PREDICATE_PREDICATE_BEFORE: SiteId = SiteId(127);
pub const SITE_PREDICATE_PREDICATE_AFTER: SiteId = SiteId(128);
pub const SITE_PREDICATE_TYPE_BANG_AFTER: SiteId = SiteId(129);
pub const SITE_PREDICATE_TYPE_QMARK_AFTER: SiteId = SiteId(130);
pub const SITE_PROGRAM_DEFINITIONS_ANONYMOUS_NODE_AFTER: SiteId = SiteId(131);
pub const SITE_PROGRAM_DEFINITIONS_FIELD_DEFINITION_AFTER: SiteId = SiteId(132);
pub const SITE_PROGRAM_DEFINITIONS_GROUPING_AFTER: SiteId = SiteId(133);
pub const SITE_PROGRAM_DEFINITIONS_LIST_AFTER: SiteId = SiteId(134);
pub const SITE_PROGRAM_DEFINITIONS_MISSING_NODE_AFTER: SiteId = SiteId(135);
pub const SITE_PROGRAM_DEFINITIONS_NAMED_NODE_PLAIN_AFTER: SiteId = SiteId(136);
pub const SITE_PROGRAM_DEFINITIONS_NAMED_NODE_SUPERTYPED_AFTER: SiteId = SiteId(137);
pub const SITE_PROGRAM_DEFINITIONS_PREDICATE_AFTER: SiteId = SiteId(138);
pub const SITE_PROGRAM_DEFINITIONS_END: SiteId = SiteId(139);
pub const SITE_PROGRAM_DEFINITIONS_START: SiteId = SiteId(140);
pub const SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE: SiteId = SiteId(141);
pub const SITE_PROGRAM_PROGRAM_BEFORE: SiteId = SiteId(142);
pub const SITE_PROGRAM_PROGRAM_AFTER: SiteId = SiteId(143);
pub const SITE_QUANTIFIER_STAR_BEFORE: SiteId = SiteId(144);
pub const SITE_QUANTIFIER_STAR_AFTER: SiteId = SiteId(145);
pub const SITE_QUANTIFIER_PLUS_BEFORE: SiteId = SiteId(146);
pub const SITE_QUANTIFIER_PLUS_AFTER: SiteId = SiteId(147);
pub const SITE_QUANTIFIER_QMARK_BEFORE: SiteId = SiteId(148);
pub const SITE_QUANTIFIER_QMARK_AFTER: SiteId = SiteId(149);
pub const SITE_STRING_STRING_BEFORE: SiteId = SiteId(150);
pub const SITE_STRING_STRING_AFTER: SiteId = SiteId(151);

/// (kind, address, label, allowed kind ids), in canonical path order.
pub static SPACING_SITES: &[(&str, &str, &str, &[KindId])] = &[
    ("anonymous_node", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("anonymous_node", "anonymous_node_end", "anonymous_node_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("anonymous_node", "anonymous_node_start", "anonymous_node_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("anonymous_node", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("anonymous_node", "underscore_after", "underscore_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("anonymous_node", "anonymous_node_before", "anonymous_node_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("anonymous_node", "anonymous_node_after", "anonymous_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("capture", "capture_before", "capture_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("capture", "capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("field_definition", "colon_before", "colon_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("field_definition", "colon_after", "colon_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("field_definition", "field_definition_before", "field_definition_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("field_definition", "field_definition_after", "field_definition_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("group_expression_arm", "dot_before", "dot_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("group_expression_arm", "dot_after", "dot_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("group_expression_arm", "group_expression_arm_before", "group_expression_arm_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("group_expression_arm", "group_expression_arm_after", "group_expression_arm_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("grouping", "grouping_group_grouping_group_after", "grouping_group_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "grouping_group_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("grouping", "lparen_after", "lparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "rparen_before", "rparen_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "rparen_after", "rparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "grouping_before", "grouping_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping", "grouping_after", "grouping_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping_group", "dot_before", "dot_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping_group", "grouping_group_before", "grouping_group_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("grouping_group", "grouping_group_after", "grouping_group_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("immediate_string", "immediate_string_after", "immediate_string_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_anonymous_node_after", "anonymous_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_field_definition_after", "field_definition_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_grouping_after", "grouping_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_list_after", "list_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_missing_node_after", "missing_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_named_node_plain_after", "named_node_plain_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_named_node_supertyped_after", "named_node_supertyped_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_predicate_after", "predicate_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "definitions_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("list", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("list", "lbrack_after", "lbrack_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "rbrack_before", "rbrack_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "rbrack_after", "rbrack_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "list_before", "list_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("list", "list_after", "list_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "missing_node_end", "missing_node_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "missing_node_start", "missing_node_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("missing_node", "lparen_after", "lparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "rparen_before", "rparen_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "rparen_after", "rparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "MISSING_keyword_before", "MISSING_keyword_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "MISSING_keyword_after", "MISSING_keyword_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "missing_node_before", "missing_node_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("missing_node", "missing_node_after", "missing_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_expression_arm", "dot_before", "dot_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_expression_arm", "dot_after", "dot_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_expression_arm", "named_node_expression_arm_before", "named_node_expression_arm_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_expression_arm", "named_node_expression_arm_after", "named_node_expression_arm_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_anonymous_node_after", "anonymous_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_field_definition_after", "field_definition_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_grouping_after", "grouping_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_list_after", "list_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_missing_node_after", "missing_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_named_node_expression_arm_after", "named_node_expression_arm_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_named_node_plain_after", "named_node_plain_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_named_node_supertyped_after", "named_node_supertyped_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_negated_field_after", "negated_field_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_predicate_after", "predicate_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_group_anchored_last_end", "named_node_group_anchored_last_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_group_anchored_last_start", "named_node_group_anchored_last_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_expressions_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("named_node_group_anchored_last", "dot_before", "dot_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "dot_after", "dot_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_group_anchored_last_before", "named_node_group_anchored_last_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_anchored_last", "named_node_group_anchored_last_after", "named_node_group_anchored_last_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_anonymous_node_after", "anonymous_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_field_definition_after", "field_definition_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_grouping_after", "grouping_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_list_after", "list_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_missing_node_after", "missing_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_named_node_expression_arm_after", "named_node_expression_arm_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_named_node_plain_after", "named_node_plain_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_named_node_supertyped_after", "named_node_supertyped_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_negated_field_after", "negated_field_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_predicate_after", "predicate_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_group_children_end", "named_node_group_children_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_group_children_start", "named_node_group_children_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_expressions_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("named_node_group_children", "dot_after", "dot_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_group_children_before", "named_node_group_children_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_group_children", "named_node_group_children_after", "named_node_group_children_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "named_node_plain_end", "named_node_plain_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "named_node_plain_start", "named_node_plain_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("named_node_plain", "lparen_after", "lparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "rparen_before", "rparen_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "rparen_after", "rparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "underscore_before", "underscore_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "underscore_after", "underscore_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "named_node_plain_before", "named_node_plain_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_plain", "named_node_plain_after", "named_node_plain_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "named_node_supertyped_end", "named_node_supertyped_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "named_node_supertyped_start", "named_node_supertyped_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("named_node_supertyped", "lparen_after", "lparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "rparen_before", "rparen_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "rparen_after", "rparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "named_node_supertyped_before", "named_node_supertyped_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("named_node_supertyped", "named_node_supertyped_after", "named_node_supertyped_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("negated_field", "bang_after", "bang_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("negated_field", "negated_field_before", "negated_field_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("negated_field", "negated_field_after", "negated_field_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "elements_capture_after", "capture_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "elements_string_after", "string_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "parameters_end", "parameters_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "parameters_start", "parameters_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "elements_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("parameters", "parameters_before", "parameters_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("parameters", "parameters_after", "parameters_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate", "prefix_before", "prefix_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate", "lparen_after", "lparen_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate", "rparen_before", "rparen_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate", "predicate_before", "predicate_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate", "predicate_after", "predicate_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate_type", "bang_after", "bang_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("predicate_type", "qmark_after", "qmark_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_anonymous_node_after", "anonymous_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_field_definition_after", "field_definition_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_grouping_after", "grouping_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_list_after", "list_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_missing_node_after", "missing_node_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_named_node_plain_after", "named_node_plain_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_named_node_supertyped_after", "named_node_supertyped_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_predicate_after", "predicate_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "program_end", "program_end", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "program_start", "program_start", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "definitions_separator_space", "empty_separator_space", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30)]),
    ("program", "program_before", "program_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("program", "program_after", "program_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "star_before", "star_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "star_after", "star_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "plus_before", "plus_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "plus_after", "plus_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "qmark_before", "qmark_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("quantifier", "qmark_after", "qmark_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("string", "string_before", "string_before", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
    ("string", "string_after", "string_after", &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)]),
];

/// The before and after site of every kind that owns edge seams, in kind id order.
pub static EDGE_SITES: &[::sittir_core::options::EdgeSite] = &[
    ::sittir_core::options::EdgeSite { before: Some(SiteId(142)), after: Some(SiteId(143)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(7)), after: Some(SiteId(8)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(150)), after: Some(SiteId(151)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: None, after: Some(SiteId(29)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(122)), after: Some(SiteId(123)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(44)), after: Some(SiteId(45)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(24)), after: Some(SiteId(25)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(55)), after: Some(SiteId(56)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(5)), after: Some(SiteId(6)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(11)), after: Some(SiteId(12)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(115)), after: Some(SiteId(116)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(127)), after: Some(SiteId(128)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(15)), after: Some(SiteId(16)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(59)), after: Some(SiteId(60)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(27)), after: Some(SiteId(28)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(103)), after: Some(SiteId(104)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(112)), after: Some(SiteId(113)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(92)), after: Some(SiteId(93)), before_arms: &[], after_arms: &[] },
    ::sittir_core::options::EdgeSite { before: Some(SiteId(76)), after: Some(SiteId(77)), before_arms: &[], after_arms: &[] },
];

/// Per kind id, its row in EDGE_SITES.
pub static EDGE_ROWS: &[Option<EdgeRow>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, Some(EdgeRow(0)), None, None, None, None, None, Some(EdgeRow(1)), Some(EdgeRow(2)), Some(EdgeRow(3)), None, Some(EdgeRow(4)), Some(EdgeRow(5)), Some(EdgeRow(6)), Some(EdgeRow(7)), Some(EdgeRow(8)),
    None, None, Some(EdgeRow(9)), Some(EdgeRow(10)), Some(EdgeRow(11)), None, None, None, Some(EdgeRow(12)), Some(EdgeRow(13)), Some(EdgeRow(14)), None, None, Some(EdgeRow(15)), Some(EdgeRow(16)), Some(EdgeRow(17)),
    Some(EdgeRow(18)),
];

/// Per kind id, its flags: KIND_ANON (the parser's anonymous token), KIND_LINE_TERMINATED, KIND_LINE_BREAK_TERMINATED, KIND_ROOT.
pub static KIND_FLAGS: &[u8] = &[
    0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 1, 1,
];

/// Per kind id, the layout kinds its leaf pattern takes before it (low byte) and after it (high byte); 0 where the kind has no stamp.
pub const LEAF_EDGES: &[u16] = &[
    0, 0, 0, 0, 0, 0, 16129, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14593, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16129,
];

/// (kind, `<slot>_delimiter` key, allowed bitflag union, default bitflag), in site order.
pub static DELIMITER_SITES: &[(&str, &str, u8, u8)] = &[
];

pub const INDENT_KIND: KindId = KindId(31);
pub const DEDENT_KIND: KindId = KindId(32);

/// (kind, its indent-capable sites in rule order): an indent opened at one site is dedented at a later one of the same kind.
pub static DEPTH_SITES: &[(&str, &[SiteId])] = &[
    ("anonymous_node", &[SiteId(5), SiteId(4), SiteId(2), SiteId(1), SiteId(6), SiteId(0)]),
    ("capture", &[SiteId(7), SiteId(8)]),
    ("field_definition", &[SiteId(11), SiteId(9), SiteId(10), SiteId(12)]),
    ("group_expression_arm", &[SiteId(15), SiteId(13), SiteId(14), SiteId(16)]),
    ("grouping", &[SiteId(24), SiteId(21), SiteId(22), SiteId(23), SiteId(25), SiteId(19), SiteId(17)]),
    ("grouping_group", &[SiteId(27), SiteId(26), SiteId(28)]),
    ("immediate_string", &[SiteId(29)]),
    ("list", &[SiteId(44), SiteId(41), SiteId(42), SiteId(43), SiteId(45), SiteId(30), SiteId(31), SiteId(32), SiteId(33), SiteId(34), SiteId(35), SiteId(36), SiteId(37), SiteId(39)]),
    ("missing_node", &[SiteId(55), SiteId(50), SiteId(53), SiteId(54), SiteId(51), SiteId(52), SiteId(48), SiteId(47), SiteId(56), SiteId(46)]),
    ("named_node_expression_arm", &[SiteId(59), SiteId(57), SiteId(58), SiteId(60)]),
    ("named_node_group_anchored_last", &[SiteId(76), SiteId(75), SiteId(72), SiteId(71), SiteId(74), SiteId(77), SiteId(61), SiteId(62), SiteId(63), SiteId(64), SiteId(65), SiteId(66), SiteId(67), SiteId(68), SiteId(69), SiteId(70)]),
    ("named_node_group_children", &[SiteId(92), SiteId(91), SiteId(89), SiteId(88), SiteId(93), SiteId(78), SiteId(79), SiteId(80), SiteId(81), SiteId(82), SiteId(83), SiteId(84), SiteId(85), SiteId(86), SiteId(87)]),
    ("named_node_plain", &[SiteId(103), SiteId(98), SiteId(101), SiteId(102), SiteId(99), SiteId(100), SiteId(96), SiteId(95), SiteId(104), SiteId(94)]),
    ("named_node_supertyped", &[SiteId(112), SiteId(109), SiteId(110), SiteId(111), SiteId(107), SiteId(106), SiteId(113), SiteId(105)]),
    ("negated_field", &[SiteId(115), SiteId(114), SiteId(116)]),
    ("parameters", &[SiteId(122), SiteId(120), SiteId(119), SiteId(123), SiteId(117), SiteId(118)]),
    ("predicate", &[SiteId(127), SiteId(125), SiteId(124), SiteId(126), SiteId(128)]),
    ("predicate_type", &[SiteId(130), SiteId(129)]),
    ("program", &[SiteId(142), SiteId(140), SiteId(139), SiteId(143), SiteId(131), SiteId(132), SiteId(133), SiteId(134), SiteId(135), SiteId(136), SiteId(137), SiteId(138)]),
    ("quantifier", &[SiteId(144), SiteId(145), SiteId(146), SiteId(147), SiteId(148), SiteId(149)]),
    ("string", &[SiteId(150), SiteId(151)]),
];

/// Per kind id, the stretches of its children its template indents one level, by their anchors.
pub static DEPTH_REGIONS: &[::sittir_core::trivia_table::DepthRegion] = &[
];

pub fn spacing_text(kind: KindId) -> &'static str {
    match kind {
        KindId(25) => "",
        KindId(26) => " ",
        KindId(27) => "\t",
        KindId(28) => "\n",
        KindId(29) => "\n\n",
        KindId(30) => "\n\n\n",
        KindId(31) => "\n",
        KindId(32) => "\n",
        _ => "",
    }
}

pub fn allowed(site: SiteId) -> &'static [KindId] {
    SPACING_SITES[site.index()].3
}

/// Every layout kind (each `_layout` member, the depth movers among them where the grammar has them), the domain of `spacing_text`.
pub const LAYOUT_KINDS: &[KindId] = &[KindId(25), KindId(26), KindId(27), KindId(28), KindId(29), KindId(30), KindId(31), KindId(32)];

/// The kind id the grammar gives each gap kind, by `LayoutKinds` bit.
pub const GAPS: &[(u8, KindId)] = &[(1, KindId(25)), (2, KindId(26)), (4, KindId(27)), (8, KindId(28)), (16, KindId(29)), (32, KindId(30))];

pub const WHITESPACE: ::sittir_core::render::WhitespaceTable = ::sittir_core::render::WhitespaceTable { text_of: spacing_text, indent: INDENT_KIND, dedent: DEDENT_KIND, leaf_edges: LEAF_EDGES, gaps: GAPS };

/// Per spacing site, in vector order: the arm its table holds by default and the strength that default carries.
pub static SITE_SPECS: &[::sittir_core::options::SiteSpec] = &[
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(28), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(28), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(25), strength: 2 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
    ::sittir_core::options::SiteSpec { default_arm: KindId(26), strength: 0 },
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_ANONYMOUS_NODE_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(0)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_GROUPING_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(17)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_GROUPING_GROUPING_GROUP: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, Some(SiteId(19)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_LIST_DEFINITIONS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, Some(SiteId(33)), Some(SiteId(32)), Some(SiteId(34)), Some(SiteId(30)),
    None, None, Some(SiteId(31)), None, Some(SiteId(37)), None, None, None, None, None, None, None, None, Some(SiteId(35)), Some(SiteId(36)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_LIST_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(39)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_MISSING_NODE_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(46)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, Some(SiteId(64)), Some(SiteId(63)), Some(SiteId(65)), Some(SiteId(61)),
    None, None, Some(SiteId(62)), Some(SiteId(69)), Some(SiteId(70)), None, None, None, None, Some(SiteId(66)), None, None, None, Some(SiteId(67)), Some(SiteId(68)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, Some(SiteId(81)), Some(SiteId(80)), Some(SiteId(82)), Some(SiteId(78)),
    None, None, Some(SiteId(79)), Some(SiteId(86)), Some(SiteId(87)), None, None, None, None, Some(SiteId(83)), None, None, None, Some(SiteId(84)), Some(SiteId(85)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_NAMED_NODE_PLAIN_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(94)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_NAMED_NODE_SUPERTYPED_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(105)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_PARAMETERS_ELEMENTS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, Some(SiteId(117)), Some(SiteId(118)),
];

/// Per kind id, the site a seated element's after gap reads.
pub static SEATS_PROGRAM_DEFINITIONS: &[Option<SiteId>] = &[
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, None, None, None, None,
    None, None, None, None, None, None, None, None, None, None, None, None, Some(SiteId(134)), Some(SiteId(133)), Some(SiteId(135)), Some(SiteId(131)),
    None, None, Some(SiteId(132)), None, Some(SiteId(138)), None, None, None, None, None, None, None, None, Some(SiteId(136)), Some(SiteId(137)),
];

/// Per kind id of a wrapper, the way its seat passes through to the node it holds.
pub static SEAT_WRAPPERS: &[Option<SeatPath>] = &[
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
        indent: "    ".to_string(),
    }
}

pub fn delimiter_allowed(site: FlankId) -> u8 {
    DELIMITER_SITES[site.index()].2
}

pub static ADDRESSES: &[::sittir_core::options::AddressNode] = &[
    ::sittir_core::options::AddressNode::Branch { key: "anonymousNode", path: "(anonymous_node)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ANONYMOUS_NODE_AFTER, path: "(anonymous_node)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ANONYMOUS_NODE_BEFORE, path: "(anonymous_node)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(anonymous_node)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(anonymous_node)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ELEMENTS_CAPTURE_AFTER, path: "(anonymous_node)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ELEMENTS_END, path: "(anonymous_node)/elements:/end" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ELEMENTS_SEPARATOR_SPACE, path: "(anonymous_node)/elements:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_ELEMENTS_START, path: "(anonymous_node)/elements:/start" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "underscore", path: "(anonymous_node)/\"_\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_ANONYMOUS_NODE_UNDERSCORE_AFTER, path: "(anonymous_node)/\"_\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(capture)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_CAPTURE_CAPTURE_AFTER, path: "(capture)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_CAPTURE_CAPTURE_BEFORE, path: "(capture)/before" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "fieldDefinition", path: "(field_definition)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_FIELD_DEFINITION_FIELD_DEFINITION_AFTER, path: "(field_definition)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_FIELD_DEFINITION_FIELD_DEFINITION_BEFORE, path: "(field_definition)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "colon", path: "(field_definition)/\":\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_FIELD_DEFINITION_COLON_AFTER, path: "(field_definition)/\":\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_FIELD_DEFINITION_COLON_BEFORE, path: "(field_definition)/\":\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "groupExpressionArm", path: "(group_expression_arm)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUP_EXPRESSION_ARM_GROUP_EXPRESSION_ARM_AFTER, path: "(group_expression_arm)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUP_EXPRESSION_ARM_GROUP_EXPRESSION_ARM_BEFORE, path: "(group_expression_arm)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dot", path: "(group_expression_arm)/\".\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUP_EXPRESSION_ARM_DOT_AFTER, path: "(group_expression_arm)/\".\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUP_EXPRESSION_ARM_DOT_BEFORE, path: "(group_expression_arm)/\".\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "grouping", path: "(grouping)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUPING_AFTER, path: "(grouping)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUPING_BEFORE, path: "(grouping)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(grouping)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(grouping)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_ELEMENTS_CAPTURE_AFTER, path: "(grouping)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_ELEMENTS_SEPARATOR_SPACE, path: "(grouping)/elements:/separator" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "groupingGroup", path: "(grouping)/grouping_group:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "groupingGroup", path: "(grouping)/grouping_group:/(grouping_group)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUPING_GROUP_GROUPING_GROUP_AFTER, path: "(grouping)/grouping_group:/(grouping_group)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUPING_GROUP_SEPARATOR_SPACE, path: "(grouping)/grouping_group:/separator" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(grouping)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_LPAREN_AFTER, path: "(grouping)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(grouping)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_RPAREN_AFTER, path: "(grouping)/\")\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_RPAREN_BEFORE, path: "(grouping)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "groupingGroup", path: "(grouping_group)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUP_GROUPING_GROUP_AFTER, path: "(grouping_group)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUP_GROUPING_GROUP_BEFORE, path: "(grouping_group)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dot", path: "(grouping_group)/\".\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_GROUPING_GROUP_DOT_BEFORE, path: "(grouping_group)/\".\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "immediateString", path: "(immediate_string)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_IMMEDIATE_STRING_IMMEDIATE_STRING_AFTER, path: "(immediate_string)/after" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "list", path: "(list)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_LIST_AFTER, path: "(list)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_LIST_BEFORE, path: "(list)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "definitions", path: "(list)/definitions:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "anonymousNode", path: "(list)/definitions:/(anonymous_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_ANONYMOUS_NODE_AFTER, path: "(list)/definitions:/(anonymous_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "fieldDefinition", path: "(list)/definitions:/(field_definition)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_FIELD_DEFINITION_AFTER, path: "(list)/definitions:/(field_definition)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "grouping", path: "(list)/definitions:/(grouping)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_GROUPING_AFTER, path: "(list)/definitions:/(grouping)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "list", path: "(list)/definitions:/(list)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_LIST_AFTER, path: "(list)/definitions:/(list)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "missingNode", path: "(list)/definitions:/(missing_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_MISSING_NODE_AFTER, path: "(list)/definitions:/(missing_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodePlain", path: "(list)/definitions:/(named_node_plain)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_NAMED_NODE_PLAIN_AFTER, path: "(list)/definitions:/(named_node_plain)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeSupertyped", path: "(list)/definitions:/(named_node_supertyped)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_NAMED_NODE_SUPERTYPED_AFTER, path: "(list)/definitions:/(named_node_supertyped)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "predicate", path: "(list)/definitions:/(predicate)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_PREDICATE_AFTER, path: "(list)/definitions:/(predicate)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_DEFINITIONS_SEPARATOR_SPACE, path: "(list)/definitions:/separator" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(list)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(list)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_ELEMENTS_CAPTURE_AFTER, path: "(list)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_ELEMENTS_SEPARATOR_SPACE, path: "(list)/elements:/separator" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lbrack", path: "(list)/\"[\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_LBRACK_AFTER, path: "(list)/\"[\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rbrack", path: "(list)/\"]\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_RBRACK_AFTER, path: "(list)/\"]\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_LIST_RBRACK_BEFORE, path: "(list)/\"]\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "missingNode", path: "(missing_node)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "MISSINGKeyword", path: "(missing_node)/\"MISSING\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_MISSING_KEYWORD_AFTER, path: "(missing_node)/\"MISSING\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_MISSING_KEYWORD_BEFORE, path: "(missing_node)/\"MISSING\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_MISSING_NODE_AFTER, path: "(missing_node)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_MISSING_NODE_BEFORE, path: "(missing_node)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(missing_node)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(missing_node)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_ELEMENTS_CAPTURE_AFTER, path: "(missing_node)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_ELEMENTS_END, path: "(missing_node)/elements:/end" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_ELEMENTS_SEPARATOR_SPACE, path: "(missing_node)/elements:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_ELEMENTS_START, path: "(missing_node)/elements:/start" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(missing_node)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_LPAREN_AFTER, path: "(missing_node)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(missing_node)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_RPAREN_AFTER, path: "(missing_node)/\")\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_MISSING_NODE_RPAREN_BEFORE, path: "(missing_node)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedNodeExpressionArm", path: "(named_node_expression_arm)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_EXPRESSION_ARM_NAMED_NODE_EXPRESSION_ARM_AFTER, path: "(named_node_expression_arm)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_EXPRESSION_ARM_NAMED_NODE_EXPRESSION_ARM_BEFORE, path: "(named_node_expression_arm)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dot", path: "(named_node_expression_arm)/\".\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_EXPRESSION_ARM_DOT_AFTER, path: "(named_node_expression_arm)/\".\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_EXPRESSION_ARM_DOT_BEFORE, path: "(named_node_expression_arm)/\".\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedNodeGroupAnchoredLast", path: "(named_node_group_anchored_last)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_GROUP_ANCHORED_LAST_AFTER, path: "(named_node_group_anchored_last)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_GROUP_ANCHORED_LAST_BEFORE, path: "(named_node_group_anchored_last)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dot", path: "(named_node_group_anchored_last)/\".\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_AFTER, path: "(named_node_group_anchored_last)/\".\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_DOT_BEFORE, path: "(named_node_group_anchored_last)/\".\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "namedNodeExpressions", path: "(named_node_group_anchored_last)/named_node_expressions:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "anonymousNode", path: "(named_node_group_anchored_last)/named_node_expressions:/(anonymous_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_ANONYMOUS_NODE_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(anonymous_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_END, path: "(named_node_group_anchored_last)/named_node_expressions:/end" }] },
            ::sittir_core::options::AddressNode::Branch { key: "fieldDefinition", path: "(named_node_group_anchored_last)/named_node_expressions:/(field_definition)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_FIELD_DEFINITION_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(field_definition)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "grouping", path: "(named_node_group_anchored_last)/named_node_expressions:/(grouping)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_GROUPING_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(grouping)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "list", path: "(named_node_group_anchored_last)/named_node_expressions:/(list)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_LIST_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(list)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "missingNode", path: "(named_node_group_anchored_last)/named_node_expressions:/(missing_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_MISSING_NODE_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(missing_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeExpressionArm", path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_expression_arm)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_EXPRESSION_ARM_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_expression_arm)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodePlain", path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_plain)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_PLAIN_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_plain)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeSupertyped", path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_supertyped)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NAMED_NODE_SUPERTYPED_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(named_node_supertyped)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "negatedField", path: "(named_node_group_anchored_last)/named_node_expressions:/(negated_field)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_NEGATED_FIELD_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(negated_field)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "predicate", path: "(named_node_group_anchored_last)/named_node_expressions:/(predicate)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_PREDICATE_AFTER, path: "(named_node_group_anchored_last)/named_node_expressions:/(predicate)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE, path: "(named_node_group_anchored_last)/named_node_expressions:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_ANCHORED_LAST_NAMED_NODE_EXPRESSIONS_START, path: "(named_node_group_anchored_last)/named_node_expressions:/start" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedNodeGroupChildren", path: "(named_node_group_children)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_GROUP_CHILDREN_AFTER, path: "(named_node_group_children)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_GROUP_CHILDREN_BEFORE, path: "(named_node_group_children)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "dot", path: "(named_node_group_children)/\".\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_DOT_AFTER, path: "(named_node_group_children)/\".\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "namedNodeExpressions", path: "(named_node_group_children)/named_node_expressions:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "anonymousNode", path: "(named_node_group_children)/named_node_expressions:/(anonymous_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_ANONYMOUS_NODE_AFTER, path: "(named_node_group_children)/named_node_expressions:/(anonymous_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_END, path: "(named_node_group_children)/named_node_expressions:/end" }] },
            ::sittir_core::options::AddressNode::Branch { key: "fieldDefinition", path: "(named_node_group_children)/named_node_expressions:/(field_definition)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_FIELD_DEFINITION_AFTER, path: "(named_node_group_children)/named_node_expressions:/(field_definition)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "grouping", path: "(named_node_group_children)/named_node_expressions:/(grouping)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_GROUPING_AFTER, path: "(named_node_group_children)/named_node_expressions:/(grouping)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "list", path: "(named_node_group_children)/named_node_expressions:/(list)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_LIST_AFTER, path: "(named_node_group_children)/named_node_expressions:/(list)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "missingNode", path: "(named_node_group_children)/named_node_expressions:/(missing_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_MISSING_NODE_AFTER, path: "(named_node_group_children)/named_node_expressions:/(missing_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeExpressionArm", path: "(named_node_group_children)/named_node_expressions:/(named_node_expression_arm)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_EXPRESSION_ARM_AFTER, path: "(named_node_group_children)/named_node_expressions:/(named_node_expression_arm)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodePlain", path: "(named_node_group_children)/named_node_expressions:/(named_node_plain)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_PLAIN_AFTER, path: "(named_node_group_children)/named_node_expressions:/(named_node_plain)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeSupertyped", path: "(named_node_group_children)/named_node_expressions:/(named_node_supertyped)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NAMED_NODE_SUPERTYPED_AFTER, path: "(named_node_group_children)/named_node_expressions:/(named_node_supertyped)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "negatedField", path: "(named_node_group_children)/named_node_expressions:/(negated_field)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_NEGATED_FIELD_AFTER, path: "(named_node_group_children)/named_node_expressions:/(negated_field)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "predicate", path: "(named_node_group_children)/named_node_expressions:/(predicate)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_PREDICATE_AFTER, path: "(named_node_group_children)/named_node_expressions:/(predicate)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_SEPARATOR_SPACE, path: "(named_node_group_children)/named_node_expressions:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_GROUP_CHILDREN_NAMED_NODE_EXPRESSIONS_START, path: "(named_node_group_children)/named_node_expressions:/start" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedNodePlain", path: "(named_node_plain)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_NAMED_NODE_PLAIN_AFTER, path: "(named_node_plain)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_NAMED_NODE_PLAIN_BEFORE, path: "(named_node_plain)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(named_node_plain)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(named_node_plain)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_ELEMENTS_CAPTURE_AFTER, path: "(named_node_plain)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_ELEMENTS_END, path: "(named_node_plain)/elements:/end" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_ELEMENTS_SEPARATOR_SPACE, path: "(named_node_plain)/elements:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_ELEMENTS_START, path: "(named_node_plain)/elements:/start" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(named_node_plain)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_LPAREN_AFTER, path: "(named_node_plain)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_node_plain)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_RPAREN_AFTER, path: "(named_node_plain)/\")\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_RPAREN_BEFORE, path: "(named_node_plain)/\")\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "underscore", path: "(named_node_plain)/\"_\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_UNDERSCORE_AFTER, path: "(named_node_plain)/\"_\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_PLAIN_UNDERSCORE_BEFORE, path: "(named_node_plain)/\"_\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "namedNodeSupertyped", path: "(named_node_supertyped)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_NAMED_NODE_SUPERTYPED_AFTER, path: "(named_node_supertyped)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_NAMED_NODE_SUPERTYPED_BEFORE, path: "(named_node_supertyped)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(named_node_supertyped)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(named_node_supertyped)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_CAPTURE_AFTER, path: "(named_node_supertyped)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_END, path: "(named_node_supertyped)/elements:/end" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_SEPARATOR_SPACE, path: "(named_node_supertyped)/elements:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_ELEMENTS_START, path: "(named_node_supertyped)/elements:/start" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(named_node_supertyped)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_LPAREN_AFTER, path: "(named_node_supertyped)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(named_node_supertyped)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_RPAREN_AFTER, path: "(named_node_supertyped)/\")\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NAMED_NODE_SUPERTYPED_RPAREN_BEFORE, path: "(named_node_supertyped)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "negatedField", path: "(negated_field)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NEGATED_FIELD_NEGATED_FIELD_AFTER, path: "(negated_field)/after" }] },
        ::sittir_core::options::AddressNode::Branch { key: "bang", path: "(negated_field)/\"!\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_NEGATED_FIELD_BANG_AFTER, path: "(negated_field)/\"!\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_NEGATED_FIELD_NEGATED_FIELD_BEFORE, path: "(negated_field)/before" }] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "parameters", path: "(parameters)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_PARAMETERS_AFTER, path: "(parameters)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_PARAMETERS_BEFORE, path: "(parameters)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "elements", path: "(parameters)/elements:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "capture", path: "(parameters)/elements:/(capture)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_ELEMENTS_CAPTURE_AFTER, path: "(parameters)/elements:/(capture)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_ELEMENTS_END, path: "(parameters)/elements:/end" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_ELEMENTS_SEPARATOR_SPACE, path: "(parameters)/elements:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_ELEMENTS_START, path: "(parameters)/elements:/start" }] },
            ::sittir_core::options::AddressNode::Branch { key: "string", path: "(parameters)/elements:/(string)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PARAMETERS_ELEMENTS_STRING_AFTER, path: "(parameters)/elements:/(string)/after" }] },
            ] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "predicate", path: "(predicate)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_PREDICATE_AFTER, path: "(predicate)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_PREDICATE_BEFORE, path: "(predicate)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "lparen", path: "(predicate)/\"(\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_LPAREN_AFTER, path: "(predicate)/\"(\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "prefix", path: "(predicate)/prefix:", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_PREFIX_BEFORE, path: "(predicate)/prefix:/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "rparen", path: "(predicate)/\")\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_RPAREN_BEFORE, path: "(predicate)/\")\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "predicateType", path: "(predicate_type)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "bang", path: "(predicate_type)/\"!\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_TYPE_BANG_AFTER, path: "(predicate_type)/\"!\"/after" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "qmark", path: "(predicate_type)/\"?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PREDICATE_TYPE_QMARK_AFTER, path: "(predicate_type)/\"?\"/after" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "program", path: "(program)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_PROGRAM_AFTER, path: "(program)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_PROGRAM_BEFORE, path: "(program)/before" }] },
        ::sittir_core::options::AddressNode::Branch { key: "definitions", path: "(program)/definitions:", children: &[
            ::sittir_core::options::AddressNode::Branch { key: "anonymousNode", path: "(program)/definitions:/(anonymous_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_ANONYMOUS_NODE_AFTER, path: "(program)/definitions:/(anonymous_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "end", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_END, path: "(program)/definitions:/end" }] },
            ::sittir_core::options::AddressNode::Branch { key: "fieldDefinition", path: "(program)/definitions:/(field_definition)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_FIELD_DEFINITION_AFTER, path: "(program)/definitions:/(field_definition)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "grouping", path: "(program)/definitions:/(grouping)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_GROUPING_AFTER, path: "(program)/definitions:/(grouping)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "list", path: "(program)/definitions:/(list)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_LIST_AFTER, path: "(program)/definitions:/(list)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "missingNode", path: "(program)/definitions:/(missing_node)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_MISSING_NODE_AFTER, path: "(program)/definitions:/(missing_node)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodePlain", path: "(program)/definitions:/(named_node_plain)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_NAMED_NODE_PLAIN_AFTER, path: "(program)/definitions:/(named_node_plain)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "namedNodeSupertyped", path: "(program)/definitions:/(named_node_supertyped)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_NAMED_NODE_SUPERTYPED_AFTER, path: "(program)/definitions:/(named_node_supertyped)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Branch { key: "predicate", path: "(program)/definitions:/(predicate)", children: &[
                ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_PREDICATE_AFTER, path: "(program)/definitions:/(predicate)/after" }] },
            ] },
            ::sittir_core::options::AddressNode::Spacing { key: "separator", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_SEPARATOR_SPACE, path: "(program)/definitions:/separator" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "start", sites: &[::sittir_core::options::SiteRef { site: SITE_PROGRAM_DEFINITIONS_START, path: "(program)/definitions:/start" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "quantifier", path: "(quantifier)", children: &[
        ::sittir_core::options::AddressNode::Branch { key: "plus", path: "(quantifier)/\"+\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_PLUS_AFTER, path: "(quantifier)/\"+\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_PLUS_BEFORE, path: "(quantifier)/\"+\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "qmark", path: "(quantifier)/\"?\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_QMARK_AFTER, path: "(quantifier)/\"?\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_QMARK_BEFORE, path: "(quantifier)/\"?\"/before" }] },
        ] },
        ::sittir_core::options::AddressNode::Branch { key: "star", path: "(quantifier)/\"*\"", children: &[
            ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_STAR_AFTER, path: "(quantifier)/\"*\"/after" }] },
            ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_QUANTIFIER_STAR_BEFORE, path: "(quantifier)/\"*\"/before" }] },
        ] },
    ] },
    ::sittir_core::options::AddressNode::Branch { key: "string", path: "(string)", children: &[
        ::sittir_core::options::AddressNode::Spacing { key: "after", sites: &[::sittir_core::options::SiteRef { site: SITE_STRING_STRING_AFTER, path: "(string)/after" }] },
        ::sittir_core::options::AddressNode::Spacing { key: "before", sites: &[::sittir_core::options::SiteRef { site: SITE_STRING_STRING_BEFORE, path: "(string)/before" }] },
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
        indent_chars: " \t",
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
        assert_eq!(resolve("{\"anonymousNode\":{\"no_such_address\":1}}"), Err("options: (anonymous_node)/no_such_address names no site".to_string()));
    }

    #[test]
    fn a_differing_admitted_value_changes_only_its_own_sites() {
        let table = resolve("{\"anonymousNode\":{\"after\":25}}").unwrap();
        let expected = defaults();
        let named = [SITE_ANONYMOUS_NODE_ANONYMOUS_NODE_AFTER];
        for i in 0..table.spacing.len() {
            assert_eq!(table.spacing[i].arm, if named.iter().any(|site| site.index() == i) { KindId(25) } else { expected.spacing[i].arm });
        }
        assert_eq!(table.delimiter, expected.delimiter);
        assert_eq!(table.indent, expected.indent);
    }

    #[test]
    fn a_value_the_site_does_not_admit_is_refused_with_its_path() {
        assert_eq!(resolve("{\"anonymousNode\":{\"after\":65534}}"), Err("options: (anonymous_node)/after does not admit kind id 65534 (allowed: [25, 26, 27, 28, 29, 30, 31, 32])".to_string()));
    }

    #[test]
    fn an_unbalanced_indent_is_refused() {
        assert_eq!(resolve("{\"anonymousNode\":{\"after\":31}}"), Err("options: anonymous_node opens an indent it never dedents".to_string()));
    }
}

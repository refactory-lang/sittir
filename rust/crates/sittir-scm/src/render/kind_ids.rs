// @generated from packages/scm/.sittir/src/parser.c — do not hand-edit.
// Per-kind numeric ID constants matching the TS-side `TSKindId` enum.
//
// IDs come from `enum ts_symbol_identifiers` in parser.c (KindID
// runtime migration design, 2026-04-30). Use these constants when
// matching on `KindId` values; the inner u16 is the parser.c-derived
// symbol id.

use ::sittir_core::types::KindId;

pub const ESCAPE_SEQUENCE: KindId = KindId(1);
pub const STAR: KindId = KindId(2);
pub const PLUS: KindId = KindId(3);
pub const QMARK: KindId = KindId(4);
pub const IDENTIFIER: KindId = KindId(5);
pub const _IMMEDIATE_IDENTIFIER: KindId = KindId(6);
pub const UNDERSCORE: KindId = KindId(7);
pub const AT: KindId = KindId(8);
pub const DQUOTE: KindId = KindId(9);
pub const DQUOTE2: KindId = KindId(10);
pub const COMMENT: KindId = KindId(11);
pub const LBRACK: KindId = KindId(12);
pub const RBRACK: KindId = KindId(13);
pub const LPAREN: KindId = KindId(14);
pub const RPAREN: KindId = KindId(15);
pub const MISSING_KEYWORD: KindId = KindId(16);
pub const COLON: KindId = KindId(17);
pub const BANG: KindId = KindId(18);
pub const POUND: KindId = KindId(19);
pub const DOT: KindId = KindId(20);
pub const QMARK2: KindId = KindId(21);
pub const BANG2: KindId = KindId(22);
pub const STRING_CONTENT_TEXT: KindId = KindId(23);
pub const SLASH: KindId = KindId(24);
pub const _TIGHT: KindId = KindId(25);
pub const _SPACE: KindId = KindId(26);
pub const _TAB: KindId = KindId(27);
pub const _NEWLINE: KindId = KindId(28);
pub const _BLANKLINE: KindId = KindId(29);
pub const _DOUBLE_BLANKLINE: KindId = KindId(30);
pub const _INDENT: KindId = KindId(31);
pub const _DEDENT: KindId = KindId(32);
pub const PROGRAM: KindId = KindId(33);
pub const DEFINITION: KindId = KindId(34);
pub const _GROUP_EXPRESSION: KindId = KindId(35);
pub const _NAMED_NODE_EXPRESSION: KindId = KindId(36);
pub const QUANTIFIER: KindId = KindId(37);
pub const _NODE_IDENTIFIER: KindId = KindId(38);
pub const CAPTURE: KindId = KindId(39);
pub const STRING: KindId = KindId(40);
pub const _IMMEDIATE_STRING: KindId = KindId(41);
pub const STRING_CONTENT: KindId = KindId(42);
pub const PARAMETERS: KindId = KindId(43);
pub const LIST: KindId = KindId(44);
pub const GROUPING: KindId = KindId(45);
pub const MISSING_NODE: KindId = KindId(46);
pub const ANONYMOUS_NODE: KindId = KindId(47);
pub const NAMED_NODE: KindId = KindId(48);
pub const _FIELD_NAME: KindId = KindId(49);
pub const FIELD_DEFINITION: KindId = KindId(50);
pub const NEGATED_FIELD: KindId = KindId(51);
pub const PREDICATE: KindId = KindId(52);
pub const PREDICATE_TYPE: KindId = KindId(53);
pub const LIST_ELEMENT_QUANTIFIER: KindId = KindId(54);
pub const _LIST_ELEMENT: KindId = KindId(55);
pub const GROUP_EXPRESSION_ARM: KindId = KindId(56);
pub const NAMED_NODE_EXPRESSION_ARM: KindId = KindId(57);
pub const GROUPING_GROUP: KindId = KindId(58);
pub const NAMED_NODE_GROUP: KindId = KindId(59);
pub const _ANCHOR: KindId = KindId(60);
pub const NAMED_NODE_PLAIN: KindId = KindId(61);
pub const NAMED_NODE_SUPERTYPED: KindId = KindId(62);
pub const NAMED_NODE_GROUP_CHILDREN: KindId = KindId(63);
pub const NAMED_NODE_GROUP_ANCHORED_LAST: KindId = KindId(64);
pub const PROGRAM_REPEAT1: KindId = KindId(65);
pub const STRING_CONTENT_REPEAT1: KindId = KindId(66);
pub const PARAMETERS_REPEAT1: KindId = KindId(67);
pub const LIST_REPEAT1: KindId = KindId(68);
pub const GROUPING_REPEAT1: KindId = KindId(69);
pub const NAMED_NODE_GROUP_CHILDREN_REPEAT1: KindId = KindId(70);
pub const ERROR: KindId = KindId(65535);
const _: () = assert!(ERROR.0 == KindId::ERROR.0);

/// Map a `KindId` back to its grammar kind string for diagnostics.
/// Returns `"<unknown>"` for ids not in this grammar's symbol table.
pub fn kind_name_from_id(id: KindId) -> &'static str {
    match id.0 {
        1 => "escape_sequence", // "escape_sequence"
        2 => "*", // "star"
        3 => "+", // "plus"
        4 => "?", // "qmark"
        5 => "identifier", // "identifier"
        6 => "identifier", // "_immediate_identifier"
        7 => "_", // "underscore"
        8 => "@", // "at"
        9 => "\"", // "dquote"
        10 => "\"", // "dquote2"
        11 => "comment", // "comment"
        12 => "[", // "lbrack"
        13 => "]", // "rbrack"
        14 => "(", // "lparen"
        15 => ")", // "rparen"
        16 => "MISSING", // "MISSING_keyword"
        17 => ":", // "colon"
        18 => "!", // "bang"
        19 => "#", // "pound"
        20 => ".", // "dot"
        21 => "?", // "qmark2"
        22 => "!", // "bang2"
        23 => "string_content_text", // "string_content_text"
        24 => "/", // "slash"
        25 => "_tight", // "_tight"
        26 => "_space", // "_space"
        27 => "_tab", // "_tab"
        28 => "_newline", // "_newline"
        29 => "_blankline", // "_blankline"
        30 => "_double_blankline", // "_double_blankline"
        31 => "_indent", // "_indent"
        32 => "_dedent", // "_dedent"
        33 => "program", // "program"
        34 => "definition", // "definition"
        35 => "_group_expression", // "_group_expression"
        36 => "_named_node_expression", // "_named_node_expression"
        37 => "quantifier", // "quantifier"
        38 => "_node_identifier", // "_node_identifier"
        39 => "capture", // "capture"
        40 => "string", // "string"
        41 => "immediate_string", // "_immediate_string"
        42 => "string_content", // "string_content"
        43 => "parameters", // "parameters"
        44 => "list", // "list"
        45 => "grouping", // "grouping"
        46 => "missing_node", // "missing_node"
        47 => "anonymous_node", // "anonymous_node"
        48 => "named_node", // "named_node"
        49 => "_field_name", // "_field_name"
        50 => "field_definition", // "field_definition"
        51 => "negated_field", // "negated_field"
        52 => "predicate", // "predicate"
        53 => "predicate_type", // "predicate_type"
        54 => "list_element_quantifier", // "list_element_quantifier"
        55 => "_list_element", // "_list_element"
        56 => "group_expression_arm", // "group_expression_arm"
        57 => "named_node_expression_arm", // "named_node_expression_arm"
        58 => "grouping_group", // "grouping_group"
        59 => "named_node_group", // "named_node_group"
        60 => "anchor", // "_anchor"
        61 => "named_node_plain", // "named_node_plain"
        62 => "named_node_supertyped", // "named_node_supertyped"
        63 => "named_node_group_children", // "named_node_group_children"
        64 => "named_node_group_anchored_last", // "named_node_group_anchored_last"
        65 => "program_repeat1", // "program_repeat1"
        66 => "string_content_repeat1", // "string_content_repeat1"
        67 => "parameters_repeat1", // "parameters_repeat1"
        68 => "list_repeat1", // "list_repeat1"
        69 => "grouping_repeat1", // "grouping_repeat1"
        70 => "named_node_group_children_repeat1", // "named_node_group_children_repeat1"
        65535 => "ERROR", // "ERROR"
        _ => "<unknown>",
    }
}

/// The gap an extra occupies inside a node with no named child to own it,
/// by (kind id, anonymous tokens before the extra): the model slot whose
/// position the gap holds. `None` when the model has no slot there.
pub fn inner_gap_key(kind: KindId, preceding_tokens: u16) -> Option<&'static str> {
    match (kind.0, preceding_tokens) {
        (33, 0) => Some("definitions"),
        (46, 2) => Some("name"),
        _ => None,
    }
}
/// Whether the model stores a `child` of a `parent` node, reached under the
/// parser field `field` (`None` for an untagged child), as a scalar: a
/// presence flag or a kind id rather than a node. Such a child keeps no
/// trivia, so the reader never makes it an owner.
pub fn stores_scalar(parent: KindId, field: Option<&str>, child: KindId) -> bool {
    match (parent.0, field) {
        (47, Some("name")) => matches!(child.0, 7),
        (52, Some("prefix")) => matches!(child.0, 19 | 20),
        (52, Some("type")) => matches!(child.0, 4 | 18),
        (54, Some("quantifier")) => matches!(child.0, 2..=4),
        (61, Some("name")) => matches!(child.0, 7),
        _ => false,
    }
}

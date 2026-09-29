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
pub const STRING_CONTENT_TOKEN1: KindId = KindId(11);
pub const COMMENT: KindId = KindId(12);
pub const LBRACK: KindId = KindId(13);
pub const RBRACK: KindId = KindId(14);
pub const LPAREN: KindId = KindId(15);
pub const RPAREN: KindId = KindId(16);
pub const MISSING_KEYWORD: KindId = KindId(17);
pub const COLON: KindId = KindId(18);
pub const BANG: KindId = KindId(19);
pub const POUND: KindId = KindId(20);
pub const DOT: KindId = KindId(21);
pub const PREDICATE_TYPE: KindId = KindId(22);
pub const SLASH: KindId = KindId(23);
pub const _TIGHT: KindId = KindId(24);
pub const _SPACE: KindId = KindId(25);
pub const _TAB: KindId = KindId(26);
pub const _NEWLINE: KindId = KindId(27);
pub const _BLANKLINE: KindId = KindId(28);
pub const _DOUBLE_BLANKLINE: KindId = KindId(29);
pub const _INDENT: KindId = KindId(30);
pub const _DEDENT: KindId = KindId(31);
pub const PROGRAM: KindId = KindId(32);
pub const DEFINITION: KindId = KindId(33);
pub const _GROUP_EXPRESSION: KindId = KindId(34);
pub const _NAMED_NODE_EXPRESSION: KindId = KindId(35);
pub const QUANTIFIER: KindId = KindId(36);
pub const _NODE_IDENTIFIER: KindId = KindId(37);
pub const CAPTURE: KindId = KindId(38);
pub const STRING: KindId = KindId(39);
pub const _IMMEDIATE_STRING: KindId = KindId(40);
pub const STRING_CONTENT: KindId = KindId(41);
pub const PARAMETERS: KindId = KindId(42);
pub const LIST: KindId = KindId(43);
pub const GROUPING: KindId = KindId(44);
pub const MISSING_NODE: KindId = KindId(45);
pub const ANONYMOUS_NODE: KindId = KindId(46);
pub const NAMED_NODE: KindId = KindId(47);
pub const _FIELD_NAME: KindId = KindId(48);
pub const FIELD_DEFINITION: KindId = KindId(49);
pub const NEGATED_FIELD: KindId = KindId(50);
pub const PREDICATE: KindId = KindId(51);
pub const GROUP_EXPRESSION_ARM: KindId = KindId(52);
pub const NAMED_NODE_EXPRESSION_ARM: KindId = KindId(53);
pub const GROUPING_GROUP: KindId = KindId(54);
pub const NAMED_NODE_GROUP: KindId = KindId(55);
pub const NAMED_NODE_PLAIN: KindId = KindId(56);
pub const NAMED_NODE_SUPERTYPED: KindId = KindId(57);
pub const NAMED_NODE_GROUP_CHILDREN: KindId = KindId(58);
pub const NAMED_NODE_GROUP_ANCHORED_LAST: KindId = KindId(59);
pub const PROGRAM_REPEAT1: KindId = KindId(60);
pub const STRING_CONTENT_REPEAT1: KindId = KindId(61);
pub const PARAMETERS_REPEAT1: KindId = KindId(62);
pub const LIST_REPEAT1: KindId = KindId(63);
pub const GROUPING_REPEAT1: KindId = KindId(64);
pub const NAMED_NODE_GROUP_CHILDREN_REPEAT1: KindId = KindId(65);
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
        11 => "string_content_token1", // "string_content_token1"
        12 => "comment", // "comment"
        13 => "[", // "lbrack"
        14 => "]", // "rbrack"
        15 => "(", // "lparen"
        16 => ")", // "rparen"
        17 => "MISSING", // "MISSING_keyword"
        18 => ":", // "colon"
        19 => "!", // "bang"
        20 => "#", // "pound"
        21 => ".", // "dot"
        22 => "predicate_type", // "predicate_type"
        23 => "/", // "slash"
        24 => "_tight", // "_tight"
        25 => "_space", // "_space"
        26 => "_tab", // "_tab"
        27 => "_newline", // "_newline"
        28 => "_blankline", // "_blankline"
        29 => "_double_blankline", // "_double_blankline"
        30 => "_indent", // "_indent"
        31 => "_dedent", // "_dedent"
        32 => "program", // "program"
        33 => "definition", // "definition"
        34 => "_group_expression", // "_group_expression"
        35 => "_named_node_expression", // "_named_node_expression"
        36 => "quantifier", // "quantifier"
        37 => "_node_identifier", // "_node_identifier"
        38 => "capture", // "capture"
        39 => "string", // "string"
        40 => "immediate_string", // "_immediate_string"
        41 => "string_content", // "string_content"
        42 => "parameters", // "parameters"
        43 => "list", // "list"
        44 => "grouping", // "grouping"
        45 => "missing_node", // "missing_node"
        46 => "anonymous_node", // "anonymous_node"
        47 => "named_node", // "named_node"
        48 => "_field_name", // "_field_name"
        49 => "field_definition", // "field_definition"
        50 => "negated_field", // "negated_field"
        51 => "predicate", // "predicate"
        52 => "group_expression_arm", // "group_expression_arm"
        53 => "named_node_expression_arm", // "named_node_expression_arm"
        54 => "grouping_group", // "grouping_group"
        55 => "named_node_group", // "named_node_group"
        56 => "named_node_plain", // "named_node_plain"
        57 => "named_node_supertyped", // "named_node_supertyped"
        58 => "named_node_group_children", // "named_node_group_children"
        59 => "named_node_group_anchored_last", // "named_node_group_anchored_last"
        60 => "program_repeat1", // "program_repeat1"
        61 => "string_content_repeat1", // "string_content_repeat1"
        62 => "parameters_repeat1", // "parameters_repeat1"
        63 => "list_repeat1", // "list_repeat1"
        64 => "grouping_repeat1", // "grouping_repeat1"
        65 => "named_node_group_children_repeat1", // "named_node_group_children_repeat1"
        65535 => "ERROR", // "ERROR"
        _ => "<unknown>",
    }
}

/// Whether the reader captures a named node of this kind as text: its
/// template renders from that text, so the text is the node's content —
/// free text for a pattern kind, the literal it holds for an enum kind.
pub fn is_text_kind(kind: KindId) -> bool {
    matches!(kind.0, 1 | 5 | 6 | 12 | 22 | 36)
}

/// Whether this parse kind id is an alias envelope: the reader stamps the
/// grammar symbol beside it when the node is the storage node shown under
/// the alias, so the wrap layer can seat it as the envelope's content.
pub fn is_alias_envelope(kind: KindId) -> bool {
    matches!(kind.0, u16::MAX if false)
}

/// Whether a node of this kind keeps its anonymous children as `$other`
/// when it has no named child: an unnamed slot of the kind stores terminal
/// kinds, and the wrap layer reclaims that slot's value from `$other`.
pub fn keeps_anonymous_children(kind: KindId) -> bool {
    matches!(kind.0, 43 | 44 | 45 | 46 | 51 | 56 | 57)
}

/// The model slot a child is stored under where its name differs from the
/// parser's key: a field-tagged child by (parent kind id, field), a named
/// child without a field by (parent kind id, the child's kind name).
/// `None` keeps the parser's key.
pub fn wire_slot(parent: KindId, field: Option<&str>, child: &str) -> Option<&'static str> {
    match (parent.0, field, child) {
        (41, None, "escape_sequence") => Some("content"),
        (43, None, "capture") => Some("content"),
        (43, Some("quantifier"), _) => Some("content"),
        (44, None, "capture") => Some("content"),
        (44, Some("quantifier"), _) => Some("content"),
        (45, None, "capture") => Some("content"),
        (45, Some("quantifier"), _) => Some("content"),
        (46, None, "capture") => Some("content"),
        (46, Some("quantifier"), _) => Some("content"),
        (51, None, "dot") => Some("content"),
        (51, None, "pound") => Some("content"),
        (54, None, "anonymous_node") => Some("group_expression"),
        (54, None, "field_definition") => Some("group_expression"),
        (54, None, "group_expression_arm") => Some("group_expression"),
        (54, None, "grouping") => Some("group_expression"),
        (54, None, "list") => Some("group_expression"),
        (54, None, "missing_node") => Some("group_expression"),
        (54, None, "named_node_plain") => Some("group_expression"),
        (54, None, "named_node_supertyped") => Some("group_expression"),
        (54, None, "predicate") => Some("group_expression"),
        (56, None, "capture") => Some("content"),
        (56, None, "named_node_group_anchored_last") => Some("named_node_group"),
        (56, None, "named_node_group_children") => Some("named_node_group"),
        (56, Some("quantifier"), _) => Some("content"),
        (57, None, "capture") => Some("content"),
        (57, None, "named_node_group_anchored_last") => Some("named_node_group"),
        (57, None, "named_node_group_children") => Some("named_node_group"),
        (57, Some("quantifier"), _) => Some("content"),
        _ => None,
    }
}

/// The gap an extra occupies inside a node with no named child to own it,
/// by (kind id, anonymous tokens before the extra): the model slot whose
/// position the gap holds. `None` when the model has no slot there.
pub fn inner_gap_key(kind: KindId, preceding_tokens: u16) -> Option<&'static str> {
    match (kind.0, preceding_tokens) {
        (32, 0) => Some("definitions"),
        (45, 2) => Some("name"),
        _ => None,
    }
}

/// (parent kind id, tree-sitter field name, punctuation kind ids) for every
/// slot the parser field-tags a literal into: the separator of a repeated
/// slot, or a literal a rule puts beside a singular slot under the same
/// field. The template prints such a token itself, so the reader drops the
/// child instead of seating it, and a native read and a wrapped read hand
/// back the same slot contents.
static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[
    (49, "name", &[18]),
    (51, "name", &[20, 21]),
];

pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {
    SLOT_SEPARATORS
        .iter()
        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))
}

/// Whether the model stores a `child` of a `parent` node, reached under the
/// parser field `field` (`None` for an untagged child), as a scalar: a
/// presence flag or a kind id rather than a node. Such a child keeps no
/// trivia, so the reader never makes it an owner.
pub fn stores_scalar(parent: KindId, field: Option<&str>, child: KindId) -> bool {
    match (parent.0, field) {
        (43, None) => matches!(child.0, 2 | 3 | 4),
        (44, None) => matches!(child.0, 2 | 3 | 4),
        (45, None) => matches!(child.0, 2 | 3 | 4),
        (46, None) => matches!(child.0, 2 | 3 | 4),
        (46, Some("name")) => matches!(child.0, 7),
        (51, None) => matches!(child.0, 20 | 21),
        (51, Some("type")) => matches!(child.0, 4 | 19),
        (56, None) => matches!(child.0, 2 | 3 | 4),
        (56, Some("name")) => matches!(child.0, 7),
        (57, None) => matches!(child.0, 2 | 3 | 4),
        _ => false,
    }
}

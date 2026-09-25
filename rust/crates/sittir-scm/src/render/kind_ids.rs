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
pub const _NEWLINE: KindId = KindId(26);
pub const PROGRAM: KindId = KindId(27);
pub const DEFINITION: KindId = KindId(28);
pub const _GROUP_EXPRESSION: KindId = KindId(29);
pub const _NAMED_NODE_EXPRESSION: KindId = KindId(30);
pub const QUANTIFIER: KindId = KindId(31);
pub const _NODE_IDENTIFIER: KindId = KindId(32);
pub const CAPTURE: KindId = KindId(33);
pub const STRING: KindId = KindId(34);
pub const _IMMEDIATE_STRING: KindId = KindId(35);
pub const STRING_CONTENT: KindId = KindId(36);
pub const PARAMETERS: KindId = KindId(37);
pub const LIST: KindId = KindId(38);
pub const GROUPING: KindId = KindId(39);
pub const MISSING_NODE: KindId = KindId(40);
pub const ANONYMOUS_NODE: KindId = KindId(41);
pub const NAMED_NODE: KindId = KindId(42);
pub const _FIELD_NAME: KindId = KindId(43);
pub const FIELD_DEFINITION: KindId = KindId(44);
pub const NEGATED_FIELD: KindId = KindId(45);
pub const PREDICATE: KindId = KindId(46);
pub const GROUP_EXPRESSION_ARM: KindId = KindId(47);
pub const NAMED_NODE_EXPRESSION_ARM: KindId = KindId(48);
pub const GROUPING_GROUP: KindId = KindId(49);
pub const NAMED_NODE_ARM: KindId = KindId(50);
pub const NAMED_NODE_GROUP: KindId = KindId(51);
pub const NAMED_NODE_GROUP_CHILDREN: KindId = KindId(52);
pub const NAMED_NODE_GROUP_ANCHORED_LAST: KindId = KindId(53);
pub const PROGRAM_REPEAT1: KindId = KindId(54);
pub const STRING_CONTENT_REPEAT1: KindId = KindId(55);
pub const PARAMETERS_REPEAT1: KindId = KindId(56);
pub const LIST_REPEAT1: KindId = KindId(57);
pub const GROUPING_REPEAT1: KindId = KindId(58);
pub const NAMED_NODE_GROUP_CHILDREN_REPEAT1: KindId = KindId(59);

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
        17 => "MISSING", // "missing_keyword"
        18 => ":", // "colon"
        19 => "!", // "bang"
        20 => "#", // "pound"
        21 => ".", // "dot"
        22 => "predicate_type", // "predicate_type"
        23 => "/", // "slash"
        24 => "_tight", // "_tight"
        25 => "_space", // "_space"
        26 => "_newline", // "_newline"
        27 => "program", // "program"
        28 => "definition", // "definition"
        29 => "_group_expression", // "_group_expression"
        30 => "_named_node_expression", // "_named_node_expression"
        31 => "quantifier", // "quantifier"
        32 => "_node_identifier", // "_node_identifier"
        33 => "capture", // "capture"
        34 => "string", // "string"
        35 => "immediate_string", // "_immediate_string"
        36 => "string_content", // "string_content"
        37 => "parameters", // "parameters"
        38 => "list", // "list"
        39 => "grouping", // "grouping"
        40 => "missing_node", // "missing_node"
        41 => "anonymous_node", // "anonymous_node"
        42 => "named_node", // "named_node"
        43 => "_field_name", // "_field_name"
        44 => "field_definition", // "field_definition"
        45 => "negated_field", // "negated_field"
        46 => "predicate", // "predicate"
        47 => "group_expression_arm", // "group_expression_arm"
        48 => "named_node_expression_arm", // "named_node_expression_arm"
        49 => "grouping_group", // "grouping_group"
        50 => "named_node_arm", // "named_node_arm"
        51 => "named_node_group", // "named_node_group"
        52 => "named_node_group_children", // "named_node_group_children"
        53 => "named_node_group_anchored_last", // "named_node_group_anchored_last"
        54 => "program_repeat1", // "program_repeat1"
        55 => "string_content_repeat1", // "string_content_repeat1"
        56 => "parameters_repeat1", // "parameters_repeat1"
        57 => "list_repeat1", // "list_repeat1"
        58 => "grouping_repeat1", // "grouping_repeat1"
        59 => "named_node_group_children_repeat1", // "named_node_group_children_repeat1"
        _ => "<unknown>",
    }
}

/// Whether the reader captures a named node of this kind as text: its
/// template renders from that text, so the text is the node's content —
/// free text for a pattern kind, the literal it holds for an enum kind.
pub fn is_text_kind(kind: KindId) -> bool {
    matches!(kind.0, 1 | 5 | 6 | 12 | 22 | 31)
}

/// Whether this parse kind id is an alias envelope: the reader stamps the
/// grammar symbol beside it when the node is the storage node shown under
/// the alias, so the wrap layer can seat it as the envelope's content.
pub fn is_alias_envelope(kind: KindId) -> bool {
    matches!(kind.0, u16::MAX if false)
}

/// (parent kind id, tree-sitter field name, punctuation kind ids) for every
/// slot the parser field-tags a literal into: the separator of a repeated
/// slot, or a literal a rule puts beside a singular slot under the same
/// field. The template prints such a token itself, so the reader drops the
/// child instead of seating it, and a native read and a wrapped read hand
/// back the same slot contents.
static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[
    (44, "name", &[18]),
];

pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {
    SLOT_SEPARATORS
        .iter()
        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))
}

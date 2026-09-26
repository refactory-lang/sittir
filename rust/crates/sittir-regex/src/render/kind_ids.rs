// @generated from packages/regex/.sittir/src/parser.c — do not hand-edit.
// Per-kind numeric ID constants matching the TS-side `TSKindId` enum.
//
// IDs come from `enum ts_symbol_identifiers` in parser.c (KindID
// runtime migration design, 2026-04-30). Use these constants when
// matching on `KindId` values; the inner u16 is the parser.c-derived
// symbol id.

use ::sittir_core::types::KindId;

pub const PIPE: KindId = KindId(1);
pub const ANY_CHARACTER: KindId = KindId(2);
pub const CARET: KindId = KindId(3);
pub const END_ASSERTION: KindId = KindId(4);
pub const BOUNDARY_ASSERTION: KindId = KindId(5);
pub const NON_BOUNDARY_ASSERTION: KindId = KindId(6);
pub const LPAREN_QMARK: KindId = KindId(7);
pub const EQ: KindId = KindId(8);
pub const BANG: KindId = KindId(9);
pub const RPAREN: KindId = KindId(10);
pub const LPAREN_QMARK_LT: KindId = KindId(11);
pub const PATTERN_CHARACTER: KindId = KindId(12);
pub const LBRACK: KindId = KindId(13);
pub const DASH: KindId = KindId(14);
pub const RBRACK: KindId = KindId(15);
pub const LBRACK_COLON: KindId = KindId(16);
pub const COLON_RBRACK: KindId = KindId(17);
pub const POSIX_CLASS_NAME_TOKEN1: KindId = KindId(18);
pub const BSLASH_DASH: KindId = KindId(19);
pub const CLASS_CHARACTER: KindId = KindId(20);
pub const LPAREN: KindId = KindId(21);
pub const LPAREN_QMARKP_LT: KindId = KindId(22);
pub const GT: KindId = KindId(23);
pub const LPAREN_QMARK_COLON: KindId = KindId(24);
pub const STAR: KindId = KindId(25);
pub const QMARK: KindId = KindId(26);
pub const PLUS: KindId = KindId(27);
pub const LBRACE: KindId = KindId(28);
pub const COMMA: KindId = KindId(29);
pub const RBRACE: KindId = KindId(30);
pub const BSLASHK: KindId = KindId(31);
pub const LT: KindId = KindId(32);
pub const LPAREN_QMARKP_EQ: KindId = KindId(33);
pub const DECIMAL_ESCAPE: KindId = KindId(34);
pub const CHARACTER_CLASS_ESCAPE_TOKEN1: KindId = KindId(35);
pub const UNICODE_CHARACTER_ESCAPE_TOKEN1: KindId = KindId(36);
pub const UNICODE_CHARACTER_ESCAPE_TOKEN2: KindId = KindId(37);
pub const UNICODE_PROPERTY_VALUE: KindId = KindId(38);
pub const CONTROL_ESCAPE_TOKEN1: KindId = KindId(39);
pub const CONTROL_ESCAPE_TOKEN2: KindId = KindId(40);
pub const CONTROL_LETTER_ESCAPE: KindId = KindId(41);
pub const IDENTITY_ESCAPE: KindId = KindId(42);
pub const GROUP_NAME: KindId = KindId(43);
pub const DECIMAL_DIGITS: KindId = KindId(44);
pub const COLON: KindId = KindId(45);
pub const CHARACTER_CLASS_ESCAPE_ARM_TOKEN1: KindId = KindId(46);
pub const _TIGHT: KindId = KindId(47);
pub const _SPACE: KindId = KindId(48);
pub const _NEWLINE: KindId = KindId(49);
pub const PATTERN: KindId = KindId(50);
pub const ALTERNATION: KindId = KindId(51);
pub const TERM: KindId = KindId(52);
pub const START_ASSERTION: KindId = KindId(53);
pub const LOOKAROUND_ASSERTION: KindId = KindId(54);
pub const _LOOKAHEAD_ASSERTION: KindId = KindId(55);
pub const _LOOKBEHIND_ASSERTION: KindId = KindId(56);
pub const CHARACTER_CLASS: KindId = KindId(57);
pub const POSIX_CHARACTER_CLASS: KindId = KindId(58);
pub const POSIX_CLASS_NAME: KindId = KindId(59);
pub const CLASS_RANGE: KindId = KindId(60);
pub const ANONYMOUS_CAPTURING_GROUP: KindId = KindId(61);
pub const NAMED_CAPTURING_GROUP: KindId = KindId(62);
pub const NON_CAPTURING_GROUP: KindId = KindId(63);
pub const INLINE_FLAGS_GROUP: KindId = KindId(64);
pub const FLAGS: KindId = KindId(65);
pub const ZERO_OR_MORE: KindId = KindId(66);
pub const ONE_OR_MORE: KindId = KindId(67);
pub const OPTIONAL: KindId = KindId(68);
pub const COUNT_QUANTIFIER: KindId = KindId(69);
pub const BACKREFERENCE_ESCAPE: KindId = KindId(70);
pub const NAMED_GROUP_BACKREFERENCE: KindId = KindId(71);
pub const CHARACTER_CLASS_ESCAPE: KindId = KindId(72);
pub const UNICODE_CHARACTER_ESCAPE: KindId = KindId(73);
pub const UNICODE_PROPERTY_VALUE_EXPRESSION: KindId = KindId(74);
pub const CONTROL_ESCAPE: KindId = KindId(75);
pub const TERM_GROUP: KindId = KindId(76);
pub const COUNT_QUANTIFIER_GROUP: KindId = KindId(77);
pub const COUNT_QUANTIFIER_ARM: KindId = KindId(78);
pub const CHARACTER_CLASS_ESCAPE_ARM: KindId = KindId(79);
pub const UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP: KindId = KindId(80);
pub const INLINE_FLAGS_GROUP_ENABLE: KindId = KindId(81);
pub const INLINE_FLAGS_GROUP_TOGGLE: KindId = KindId(82);
pub const INLINE_FLAGS_GROUP_DISABLE: KindId = KindId(83);
pub const ALTERNATION_REPEAT1: KindId = KindId(84);
pub const TERM_REPEAT1: KindId = KindId(85);
pub const CHARACTER_CLASS_REPEAT1: KindId = KindId(86);
pub const _LAZY: KindId = KindId(87);
pub const _UNICODE_PROPERTY_NAME: KindId = KindId(88);

/// Map a `KindId` back to its grammar kind string for diagnostics.
/// Returns `"<unknown>"` for ids not in this grammar's symbol table.
pub fn kind_name_from_id(id: KindId) -> &'static str {
    match id.0 {
        1 => "|", // "pipe"
        2 => "any_character", // "any_character"
        3 => "^", // "caret"
        4 => "end_assertion", // "end_assertion"
        5 => "boundary_assertion", // "boundary_assertion"
        6 => "non_boundary_assertion", // "non_boundary_assertion"
        7 => "(?", // "lparen_qmark"
        8 => "=", // "eq"
        9 => "!", // "bang"
        10 => ")", // "rparen"
        11 => "(?<", // "lparen_qmark_lt"
        12 => "pattern_character", // "pattern_character"
        13 => "[", // "lbrack"
        14 => "-", // "dash"
        15 => "]", // "rbrack"
        16 => "[:", // "lbrack_colon"
        17 => ":]", // "colon_rbrack"
        18 => "posix_class_name_token1", // "posix_class_name_token1"
        19 => "identity_escape", // "bslash_dash"
        20 => "class_character", // "class_character"
        21 => "(", // "lparen"
        22 => "(?P<", // "lparen_qmarkp_lt"
        23 => ">", // "gt"
        24 => "(?:", // "lparen_qmark_colon"
        25 => "*", // "star"
        26 => "?", // "qmark"
        27 => "+", // "plus"
        28 => "{", // "lbrace"
        29 => ",", // "comma"
        30 => "}", // "rbrace"
        31 => "\\k", // "bslashk"
        32 => "<", // "lt"
        33 => "(?P=", // "lparen_qmarkp_eq"
        34 => "decimal_escape", // "decimal_escape"
        35 => "character_class_escape_token1", // "character_class_escape_token1"
        36 => "unicode_character_escape_token1", // "unicode_character_escape_token1"
        37 => "unicode_character_escape_token2", // "unicode_character_escape_token2"
        38 => "unicode_property_value", // "unicode_property"
        39 => "control_escape_token1", // "control_escape_token1"
        40 => "control_escape_token2", // "control_escape_token2"
        41 => "control_letter_escape", // "control_letter_escape"
        42 => "identity_escape", // "identity_escape"
        43 => "group_name", // "group_name"
        44 => "decimal_digits", // "decimal_digits"
        45 => ":", // "colon"
        46 => "character_class_escape_arm_token1", // "character_class_escape_arm_token1"
        47 => "_tight", // "_tight"
        48 => "_space", // "_space"
        49 => "_newline", // "_newline"
        50 => "pattern", // "pattern"
        51 => "alternation", // "alternation"
        52 => "term", // "term"
        53 => "start_assertion", // "start_assertion"
        54 => "lookaround_assertion", // "lookaround_assertion"
        55 => "lookahead_assertion", // "_lookahead_assertion"
        56 => "lookbehind_assertion", // "_lookbehind_assertion"
        57 => "character_class", // "character_class"
        58 => "posix_character_class", // "posix_character_class"
        59 => "posix_class_name", // "posix_class_name"
        60 => "class_range", // "class_range"
        61 => "anonymous_capturing_group", // "anonymous_capturing_group"
        62 => "named_capturing_group", // "named_capturing_group"
        63 => "non_capturing_group", // "non_capturing_group"
        64 => "inline_flags_group", // "inline_flags_group"
        65 => "flags", // "flags"
        66 => "zero_or_more", // "zero_or_more"
        67 => "one_or_more", // "one_or_more"
        68 => "optional", // "optional"
        69 => "count_quantifier", // "count_quantifier"
        70 => "backreference_escape", // "backreference_escape"
        71 => "named_group_backreference", // "named_group_backreference"
        72 => "character_class_escape", // "character_class_escape"
        73 => "unicode_character_escape", // "unicode_character_escape"
        74 => "unicode_property_value_expression", // "unicode_property_value_expression"
        75 => "control_escape", // "control_escape"
        76 => "term_group", // "term_group"
        77 => "count_quantifier_group", // "count_quantifier_group"
        78 => "count_quantifier_arm", // "count_quantifier_arm"
        79 => "character_class_escape_arm", // "character_class_escape_arm"
        80 => "unicode_property_value_expression_group", // "unicode_property_value_expression_group"
        81 => "inline_flags_group_enable", // "inline_flags_group_enable"
        82 => "inline_flags_group_toggle", // "inline_flags_group_toggle"
        83 => "inline_flags_group_disable", // "inline_flags_group_disable"
        84 => "alternation_repeat1", // "alternation_repeat1"
        85 => "term_repeat1", // "term_repeat1"
        86 => "character_class_repeat1", // "character_class_repeat1"
        87 => "lazy", // "_lazy"
        88 => "unicode_property_name", // "_unicode_property_name"
        _ => "<unknown>",
    }
}

/// Whether the reader captures a named node of this kind as text: its
/// template renders from that text, so the text is the node's content —
/// free text for a pattern kind, the literal it holds for an enum kind.
pub fn is_text_kind(kind: KindId) -> bool {
    matches!(kind.0, 12 | 20 | 34 | 38 | 41 | 42 | 43 | 44 | 59 | 65 | 66 | 67 | 68 | 73 | 75)
}

/// Whether this parse kind id is an alias envelope: the reader stamps the
/// grammar symbol beside it when the node is the storage node shown under
/// the alias, so the wrap layer can seat it as the envelope's content.
pub fn is_alias_envelope(kind: KindId) -> bool {
    matches!(kind.0, 87 | 88)
}

/// Whether a node of this kind keeps its anonymous children as `$other`
/// when it has no named child: an unnamed slot of the kind stores terminal
/// kinds, and the wrap layer reclaims that slot's value from `$other`.
pub fn keeps_anonymous_children(kind: KindId) -> bool {
    matches!(kind.0, 55 | 56 | 62 | 76)
}

/// (parent kind id, tree-sitter field name, punctuation kind ids) for every
/// slot the parser field-tags a literal into: the separator of a repeated
/// slot, or a literal a rule puts beside a singular slot under the same
/// field. The template prints such a token itself, so the reader drops the
/// child instead of seating it, and a native read and a wrapped read hand
/// back the same slot contents.
static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[
];

pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {
    SLOT_SEPARATORS
        .iter()
        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))
}

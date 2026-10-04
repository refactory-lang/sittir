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
pub const LPAREN_QMARK_P_LT: KindId = KindId(22);
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
pub const LPAREN_QMARK_P_EQ: KindId = KindId(33);
pub const DECIMAL_ESCAPE: KindId = KindId(34);
pub const UNICODE_PROPERTY_VALUE: KindId = KindId(35);
pub const CONTROL_LETTER_ESCAPE: KindId = KindId(36);
pub const IDENTITY_ESCAPE: KindId = KindId(37);
pub const GROUP_NAME: KindId = KindId(38);
pub const DECIMAL_DIGITS: KindId = KindId(39);
pub const COLON: KindId = KindId(40);
pub const CHARACTER_CLASS_ESCAPE_TEXT1: KindId = KindId(41);
pub const CHARACTER_CLASS_ESCAPE_TEXT2: KindId = KindId(42);
pub const UNICODE_CHARACTER_ESCAPE_TEXT1: KindId = KindId(43);
pub const UNICODE_CHARACTER_ESCAPE_TEXT2: KindId = KindId(44);
pub const CONTROL_ESCAPE_TEXT1: KindId = KindId(45);
pub const CONTROL_ESCAPE_TEXT2: KindId = KindId(46);
pub const _TIGHT: KindId = KindId(47);
pub const _NEWLINE: KindId = KindId(48);
pub const _BLANKLINE: KindId = KindId(49);
pub const _DOUBLE_BLANKLINE: KindId = KindId(50);
pub const PATTERN: KindId = KindId(51);
pub const ALTERNATION: KindId = KindId(52);
pub const TERM: KindId = KindId(53);
pub const START_ASSERTION: KindId = KindId(54);
pub const LOOKAROUND_ASSERTION: KindId = KindId(55);
pub const _LOOKAHEAD_ASSERTION: KindId = KindId(56);
pub const _LOOKBEHIND_ASSERTION: KindId = KindId(57);
pub const CHARACTER_CLASS: KindId = KindId(58);
pub const POSIX_CHARACTER_CLASS: KindId = KindId(59);
pub const POSIX_CLASS_NAME: KindId = KindId(60);
pub const CLASS_RANGE: KindId = KindId(61);
pub const ANONYMOUS_CAPTURING_GROUP: KindId = KindId(62);
pub const NAMED_CAPTURING_GROUP: KindId = KindId(63);
pub const NON_CAPTURING_GROUP: KindId = KindId(64);
pub const INLINE_FLAGS_GROUP: KindId = KindId(65);
pub const FLAGS: KindId = KindId(66);
pub const ZERO_OR_MORE: KindId = KindId(67);
pub const ONE_OR_MORE: KindId = KindId(68);
pub const OPTIONAL: KindId = KindId(69);
pub const COUNT_QUANTIFIER: KindId = KindId(70);
pub const BACKREFERENCE_ESCAPE: KindId = KindId(71);
pub const NAMED_GROUP_BACKREFERENCE: KindId = KindId(72);
pub const CHARACTER_CLASS_ESCAPE: KindId = KindId(73);
pub const UNICODE_CHARACTER_ESCAPE: KindId = KindId(74);
pub const UNICODE_PROPERTY_VALUE_EXPRESSION: KindId = KindId(75);
pub const CONTROL_ESCAPE: KindId = KindId(76);
pub const TERM_GROUP: KindId = KindId(77);
pub const COUNT_QUANTIFIER_GROUP: KindId = KindId(78);
pub const COUNT_QUANTIFIER_ARM: KindId = KindId(79);
pub const CHARACTER_CLASS_ESCAPE_ARM: KindId = KindId(80);
pub const UNICODE_PROPERTY_VALUE_EXPRESSION_GROUP: KindId = KindId(81);
pub const _NEGATION: KindId = KindId(82);
pub const INLINE_FLAGS_GROUP_ENABLE: KindId = KindId(83);
pub const INLINE_FLAGS_GROUP_TOGGLE: KindId = KindId(84);
pub const INLINE_FLAGS_GROUP_DISABLE: KindId = KindId(85);
pub const ALTERNATION_REPEAT1: KindId = KindId(86);
pub const TERM_REPEAT1: KindId = KindId(87);
pub const CHARACTER_CLASS_REPEAT1: KindId = KindId(88);
pub const _LAZY: KindId = KindId(89);
pub const _UNICODE_PROPERTY_NAME: KindId = KindId(90);
pub const ERROR: KindId = KindId(65535);
const _: () = assert!(ERROR.0 == KindId::ERROR.0);

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
        22 => "(?P<", // "lparen_qmarkP_lt"
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
        33 => "(?P=", // "lparen_qmarkP_eq"
        34 => "decimal_escape", // "decimal_escape"
        35 => "unicode_property_value", // "unicode_property"
        36 => "control_letter_escape", // "control_letter_escape"
        37 => "identity_escape", // "identity_escape"
        38 => "group_name", // "group_name"
        39 => "decimal_digits", // "decimal_digits"
        40 => ":", // "colon"
        41 => "character_class_escape_text1", // "character_class_escape_text1"
        42 => "character_class_escape_text2", // "character_class_escape_text2"
        43 => "unicode_character_escape_text1", // "unicode_character_escape_text1"
        44 => "unicode_character_escape_text2", // "unicode_character_escape_text2"
        45 => "control_escape_text1", // "control_escape_text1"
        46 => "control_escape_text2", // "control_escape_text2"
        47 => "_tight", // "_tight"
        48 => "_newline", // "_newline"
        49 => "_blankline", // "_blankline"
        50 => "_double_blankline", // "_double_blankline"
        51 => "pattern", // "pattern"
        52 => "alternation", // "alternation"
        53 => "term", // "term"
        54 => "start_assertion", // "start_assertion"
        55 => "lookaround_assertion", // "lookaround_assertion"
        56 => "lookahead_assertion", // "_lookahead_assertion"
        57 => "lookbehind_assertion", // "_lookbehind_assertion"
        58 => "character_class", // "character_class"
        59 => "posix_character_class", // "posix_character_class"
        60 => "posix_class_name", // "posix_class_name"
        61 => "class_range", // "class_range"
        62 => "anonymous_capturing_group", // "anonymous_capturing_group"
        63 => "named_capturing_group", // "named_capturing_group"
        64 => "non_capturing_group", // "non_capturing_group"
        65 => "inline_flags_group", // "inline_flags_group"
        66 => "flags", // "flags"
        67 => "zero_or_more", // "zero_or_more"
        68 => "one_or_more", // "one_or_more"
        69 => "optional", // "optional"
        70 => "count_quantifier", // "count_quantifier"
        71 => "backreference_escape", // "backreference_escape"
        72 => "named_group_backreference", // "named_group_backreference"
        73 => "character_class_escape", // "character_class_escape"
        74 => "unicode_character_escape", // "unicode_character_escape"
        75 => "unicode_property_value_expression", // "unicode_property_value_expression"
        76 => "control_escape", // "control_escape"
        77 => "term_group", // "term_group"
        78 => "count_quantifier_group", // "count_quantifier_group"
        79 => "count_quantifier_arm", // "count_quantifier_arm"
        80 => "character_class_escape_arm", // "character_class_escape_arm"
        81 => "unicode_property_value_expression_group", // "unicode_property_value_expression_group"
        82 => "negation", // "_negation"
        83 => "inline_flags_group_enable", // "inline_flags_group_enable"
        84 => "inline_flags_group_toggle", // "inline_flags_group_toggle"
        85 => "inline_flags_group_disable", // "inline_flags_group_disable"
        86 => "alternation_repeat1", // "alternation_repeat1"
        87 => "term_repeat1", // "term_repeat1"
        88 => "character_class_repeat1", // "character_class_repeat1"
        89 => "lazy", // "_lazy"
        90 => "unicode_property_name", // "_unicode_property_name"
        65535 => "ERROR", // "ERROR"
        _ => "<unknown>",
    }
}

/// The gap an extra occupies inside a node with no named child to own it,
/// by (kind id, anonymous tokens before the extra): the model slot whose
/// position the gap holds. `None` when the model has no slot there.
pub fn inner_gap_key(kind: KindId, preceding_tokens: u16) -> Option<&'static str> {
    match (kind.0, preceding_tokens) {
        (58, 1) => Some("negation"),
        _ => None,
    }
}
/// Whether the model stores a `child` of a `parent` node, reached under the
/// parser field `field` (`None` for an untagged child), as a scalar: a
/// presence flag or a kind id rather than a node. Such a child keeps no
/// trivia, so the reader never makes it an owner.
pub fn stores_scalar(parent: KindId, field: Option<&str>, child: KindId) -> bool {
    match (parent.0, field) {
        (56, None) => matches!(child.0, 8 | 9),
        (57, None) => matches!(child.0, 8 | 9),
        (58, Some("class_atoms")) => matches!(child.0, 19),
        (61, Some("end")) => matches!(child.0, 14),
        (61, Some("start")) => matches!(child.0, 14),
        (63, None) => matches!(child.0, 11 | 22),
        (77, None) => matches!(child.0, 2 | 4 | 5 | 6 | 54),
        (89, Some("content")) => matches!(child.0, 26),
        _ => false,
    }
}

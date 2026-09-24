// @generated from packages/python/.sittir/src/parser.c — do not hand-edit.
// Per-kind numeric ID constants matching the TS-side `TSKindId` enum.
//
// IDs come from `enum ts_symbol_identifiers` in parser.c (KindID
// runtime migration design, 2026-04-30). Use these constants when
// matching on `KindId` values; the inner u16 is the parser.c-derived
// symbol id.

use ::sittir_core::types::KindId;

pub const IDENTIFIER: KindId = KindId(1);
pub const IMPORT_KEYWORD: KindId = KindId(2);
pub const DOT: KindId = KindId(3);
pub const FROM_KEYWORD: KindId = KindId(4);
pub const __FUTURE_U_KEYWORD: KindId = KindId(5);
pub const COMMA: KindId = KindId(6);
pub const AS_KEYWORD: KindId = KindId(7);
pub const STAR: KindId = KindId(8);
pub const GT_GT: KindId = KindId(9);
pub const ASSERT_KEYWORD: KindId = KindId(10);
pub const COLON_EQ: KindId = KindId(11);
pub const RETURN_KEYWORD: KindId = KindId(12);
pub const DEL_KEYWORD: KindId = KindId(13);
pub const RAISE_KEYWORD: KindId = KindId(14);
pub const PASS_KEYWORD: KindId = KindId(15);
pub const BREAK_KEYWORD: KindId = KindId(16);
pub const CONTINUE_KEYWORD: KindId = KindId(17);
pub const IF_KEYWORD: KindId = KindId(18);
pub const COLON: KindId = KindId(19);
pub const ELIF_KEYWORD: KindId = KindId(20);
pub const ELSE_KEYWORD: KindId = KindId(21);
pub const MATCH_KEYWORD: KindId = KindId(22);
pub const CASE_KEYWORD: KindId = KindId(23);
pub const FOR_KEYWORD: KindId = KindId(24);
pub const IN_KEYWORD: KindId = KindId(25);
pub const WHILE_KEYWORD: KindId = KindId(26);
pub const TRY_KEYWORD: KindId = KindId(27);
pub const EXCEPT_KEYWORD: KindId = KindId(28);
pub const STAR2: KindId = KindId(29);
pub const FINALLY_KEYWORD: KindId = KindId(30);
pub const WITH_KEYWORD: KindId = KindId(31);
pub const DEF_KEYWORD: KindId = KindId(32);
pub const LPAREN: KindId = KindId(33);
pub const RPAREN: KindId = KindId(34);
pub const STAR_STAR: KindId = KindId(35);
pub const GLOBAL_KEYWORD: KindId = KindId(36);
pub const NONLOCAL_KEYWORD: KindId = KindId(37);
pub const EXEC_KEYWORD: KindId = KindId(38);
pub const TYPE_KEYWORD: KindId = KindId(39);
pub const EQ: KindId = KindId(40);
pub const CLASS_KEYWORD: KindId = KindId(41);
pub const LBRACK: KindId = KindId(42);
pub const RBRACK: KindId = KindId(43);
pub const AT: KindId = KindId(44);
pub const PIPE: KindId = KindId(45);
pub const LBRACE: KindId = KindId(46);
pub const RBRACE: KindId = KindId(47);
pub const UNDERSCORE: KindId = KindId(48);
pub const PLUS: KindId = KindId(49);
pub const DASH: KindId = KindId(50);
pub const NOT_KEYWORD: KindId = KindId(51);
pub const AND_KEYWORD: KindId = KindId(52);
pub const OR_KEYWORD: KindId = KindId(53);
pub const SLASH: KindId = KindId(54);
pub const PERCENT: KindId = KindId(55);
pub const SLASH_SLASH: KindId = KindId(56);
pub const AMP: KindId = KindId(57);
pub const CARET: KindId = KindId(58);
pub const LT_LT: KindId = KindId(59);
pub const TILDE: KindId = KindId(60);
pub const IS_KEYWORD: KindId = KindId(61);
pub const LAMBDA_KEYWORD: KindId = KindId(62);
pub const YIELD_KEYWORD: KindId = KindId(63);
pub const ELLIPSIS: KindId = KindId(64);
pub const BSLASH: KindId = KindId(65);
pub const FORMAT_SPECIFIER_TOKEN1: KindId = KindId(66);
pub const TYPE_CONVERSION: KindId = KindId(67);
pub const PRINT_KEYWORD: KindId = KindId(68);
pub const ASYNC_KEYWORD: KindId = KindId(69);
pub const AWAIT_KEYWORD: KindId = KindId(70);
pub const TRUE: KindId = KindId(71);
pub const FALSE: KindId = KindId(72);
pub const NONE: KindId = KindId(73);
pub const COMMENT: KindId = KindId(74);
pub const SEMI: KindId = KindId(75);
pub const DASH_GT: KindId = KindId(76);
pub const PLUS_EQ: KindId = KindId(77);
pub const DASH_EQ: KindId = KindId(78);
pub const STAR_EQ: KindId = KindId(79);
pub const SLASH_EQ: KindId = KindId(80);
pub const AT_EQ: KindId = KindId(81);
pub const SLASH_SLASH_EQ: KindId = KindId(82);
pub const PERCENT_EQ: KindId = KindId(83);
pub const STAR_STAR_EQ: KindId = KindId(84);
pub const GT_GT_EQ: KindId = KindId(85);
pub const LT_LT_EQ: KindId = KindId(86);
pub const AMP_EQ: KindId = KindId(87);
pub const CARET_EQ: KindId = KindId(88);
pub const PIPE_EQ: KindId = KindId(89);
pub const INTEGER_HEX: KindId = KindId(90);
pub const INTEGER_OCTAL: KindId = KindId(91);
pub const INTEGER_BINARY: KindId = KindId(92);
pub const INTEGER_DECIMAL: KindId = KindId(93);
pub const FLOAT_POINT: KindId = KindId(94);
pub const FLOAT_LEADING_POINT: KindId = KindId(95);
pub const FLOAT_SCIENTIFIC: KindId = KindId(96);
pub const ESCAPE_SEQUENCE_UNICODE_FIXED: KindId = KindId(97);
pub const ESCAPE_SEQUENCE_UNICODE_WIDE: KindId = KindId(98);
pub const ESCAPE_SEQUENCE_HEX: KindId = KindId(99);
pub const ESCAPE_SEQUENCE_OCTAL: KindId = KindId(100);
pub const ESCAPE_SEQUENCE_LINE_BREAK: KindId = KindId(101);
pub const ESCAPE_SEQUENCE_SIMPLE: KindId = KindId(102);
pub const ESCAPE_SEQUENCE_NAMED: KindId = KindId(103);
pub const LINE_CONTINUATION_NEWLINE: KindId = KindId(104);
pub const LINE_CONTINUATION_NUL: KindId = KindId(105);
pub const LT: KindId = KindId(106);
pub const LT_EQ: KindId = KindId(107);
pub const EQ_EQ: KindId = KindId(108);
pub const BANG_EQ: KindId = KindId(109);
pub const GT_EQ: KindId = KindId(110);
pub const GT: KindId = KindId(111);
pub const LT_GT: KindId = KindId(112);
pub const _NEWLINE: KindId = KindId(113);
pub const _INDENT: KindId = KindId(114);
pub const _DEDENT: KindId = KindId(115);
pub const STRING_START: KindId = KindId(116);
pub const _STRING_CONTENT: KindId = KindId(117);
pub const ESCAPE_INTERPOLATION: KindId = KindId(118);
pub const STRING_END: KindId = KindId(119);
pub const _TIGHT: KindId = KindId(120);
pub const _SPACE: KindId = KindId(121);
pub const _BLANKLINE: KindId = KindId(122);
pub const _DOUBLE_NEWLINE: KindId = KindId(123);
pub const MODULE: KindId = KindId(124);
pub const _STATEMENT: KindId = KindId(125);
pub const _SIMPLE_STATEMENTS: KindId = KindId(126);
pub const IMPORT_STATEMENT: KindId = KindId(127);
pub const IMPORT_PREFIX: KindId = KindId(128);
pub const RELATIVE_IMPORT: KindId = KindId(129);
pub const FUTURE_IMPORT_STATEMENT: KindId = KindId(130);
pub const IMPORT_FROM_STATEMENT: KindId = KindId(131);
pub const _IMPORT_LIST: KindId = KindId(132);
pub const ALIASED_IMPORT: KindId = KindId(133);
pub const WILDCARD_IMPORT: KindId = KindId(134);
pub const PRINT_STATEMENT: KindId = KindId(135);
pub const CHEVRON: KindId = KindId(136);
pub const ASSERT_STATEMENT: KindId = KindId(137);
pub const EXPRESSION_STATEMENT: KindId = KindId(138);
pub const NAMED_EXPRESSION: KindId = KindId(139);
pub const _NAMED_EXPRESSION_LHS: KindId = KindId(140);
pub const RETURN_STATEMENT: KindId = KindId(141);
pub const DELETE_STATEMENT: KindId = KindId(142);
pub const RAISE_STATEMENT: KindId = KindId(143);
pub const PASS_STATEMENT: KindId = KindId(144);
pub const BREAK_STATEMENT: KindId = KindId(145);
pub const CONTINUE_STATEMENT: KindId = KindId(146);
pub const IF_STATEMENT: KindId = KindId(147);
pub const ELIF_CLAUSE: KindId = KindId(148);
pub const ELSE_CLAUSE: KindId = KindId(149);
pub const MATCH_STATEMENT: KindId = KindId(150);
pub const _MATCH_BLOCK: KindId = KindId(151);
pub const CASE_CLAUSE: KindId = KindId(152);
pub const FOR_STATEMENT: KindId = KindId(153);
pub const WHILE_STATEMENT: KindId = KindId(154);
pub const TRY_STATEMENT: KindId = KindId(155);
pub const EXCEPT_CLAUSE: KindId = KindId(156);
pub const FINALLY_CLAUSE: KindId = KindId(157);
pub const WITH_STATEMENT: KindId = KindId(158);
pub const WITH_CLAUSE: KindId = KindId(159);
pub const WITH_ITEM: KindId = KindId(160);
pub const FUNCTION_DEFINITION: KindId = KindId(161);
pub const PARAMETERS: KindId = KindId(162);
pub const LAMBDA_PARAMETERS: KindId = KindId(163);
pub const LIST_SPLAT: KindId = KindId(164);
pub const DICTIONARY_SPLAT: KindId = KindId(165);
pub const GLOBAL_STATEMENT: KindId = KindId(166);
pub const NONLOCAL_STATEMENT: KindId = KindId(167);
pub const EXEC_STATEMENT: KindId = KindId(168);
pub const TYPE_ALIAS_STATEMENT: KindId = KindId(169);
pub const CLASS_DEFINITION: KindId = KindId(170);
pub const TYPE_PARAMETER: KindId = KindId(171);
pub const PARENTHESIZED_LIST_SPLAT: KindId = KindId(172);
pub const ARGUMENT_LIST: KindId = KindId(173);
pub const DECORATED_DEFINITION: KindId = KindId(174);
pub const DECORATOR: KindId = KindId(175);
pub const BLOCK: KindId = KindId(176);
pub const EXPRESSION_LIST: KindId = KindId(177);
pub const DOTTED_NAME: KindId = KindId(178);
pub const CASE_PATTERN: KindId = KindId(179);
pub const _SIMPLE_PATTERN: KindId = KindId(180);
pub const _AS_PATTERN: KindId = KindId(181);
pub const UNION_PATTERN: KindId = KindId(182);
pub const DICT_PATTERN: KindId = KindId(183);
pub const _KEY_VALUE_PATTERN: KindId = KindId(184);
pub const KEYWORD_PATTERN: KindId = KindId(185);
pub const SPLAT_PATTERN: KindId = KindId(186);
pub const CLASS_PATTERN: KindId = KindId(187);
pub const COMPLEX_PATTERN: KindId = KindId(188);
pub const _PARAMETERS: KindId = KindId(189);
pub const _PATTERNS: KindId = KindId(190);
pub const PARAMETER: KindId = KindId(191);
pub const PATTERN: KindId = KindId(192);
pub const TUPLE_PATTERN: KindId = KindId(193);
pub const LIST_PATTERN: KindId = KindId(194);
pub const DEFAULT_PARAMETER: KindId = KindId(195);
pub const TYPED_DEFAULT_PARAMETER: KindId = KindId(196);
pub const LIST_SPLAT_PATTERN: KindId = KindId(197);
pub const DICTIONARY_SPLAT_PATTERN: KindId = KindId(198);
pub const AS_PATTERN: KindId = KindId(199);
pub const _EXPRESSION_WITHIN_FOR_IN_CLAUSE: KindId = KindId(200);
pub const EXPRESSION: KindId = KindId(201);
pub const PRIMARY_EXPRESSION: KindId = KindId(202);
pub const NOT_OPERATOR: KindId = KindId(203);
pub const BOOLEAN_OPERATOR: KindId = KindId(204);
pub const BINARY_OPERATOR: KindId = KindId(205);
pub const UNARY_OPERATOR: KindId = KindId(206);
pub const _NOT_IN: KindId = KindId(207);
pub const _IS_NOT: KindId = KindId(208);
pub const COMPARISON_OPERATOR: KindId = KindId(209);
pub const LAMBDA: KindId = KindId(210);
pub const LAMBDA_WITHIN_FOR_IN_CLAUSE: KindId = KindId(211);
pub const ASSIGNMENT: KindId = KindId(212);
pub const AUGMENTED_ASSIGNMENT: KindId = KindId(213);
pub const PATTERN_LIST: KindId = KindId(214);
pub const _RIGHT_HAND_SIDE: KindId = KindId(215);
pub const YIELD: KindId = KindId(216);
pub const ATTRIBUTE: KindId = KindId(217);
pub const SUBSCRIPT: KindId = KindId(218);
pub const SLICE: KindId = KindId(219);
pub const CALL: KindId = KindId(220);
pub const TYPED_PARAMETER: KindId = KindId(221);
pub const TYPE: KindId = KindId(222);
pub const SPLAT_TYPE: KindId = KindId(223);
pub const GENERIC_TYPE: KindId = KindId(224);
pub const UNION_TYPE: KindId = KindId(225);
pub const CONSTRAINED_TYPE: KindId = KindId(226);
pub const MEMBER_TYPE: KindId = KindId(227);
pub const KEYWORD_ARGUMENT: KindId = KindId(228);
pub const LIST: KindId = KindId(229);
pub const SET: KindId = KindId(230);
pub const TUPLE: KindId = KindId(231);
pub const DICTIONARY: KindId = KindId(232);
pub const PAIR: KindId = KindId(233);
pub const LIST_COMPREHENSION: KindId = KindId(234);
pub const DICTIONARY_COMPREHENSION: KindId = KindId(235);
pub const SET_COMPREHENSION: KindId = KindId(236);
pub const GENERATOR_EXPRESSION: KindId = KindId(237);
pub const PARENTHESIZED_EXPRESSION: KindId = KindId(238);
pub const _COLLECTION_ELEMENTS: KindId = KindId(239);
pub const FOR_IN_CLAUSE: KindId = KindId(240);
pub const IF_CLAUSE: KindId = KindId(241);
pub const CONDITIONAL_EXPRESSION: KindId = KindId(242);
pub const CONCATENATED_STRING: KindId = KindId(243);
pub const STRING: KindId = KindId(244);
pub const STRING_CONTENT: KindId = KindId(245);
pub const INTERPOLATION: KindId = KindId(246);
pub const _F_EXPRESSION: KindId = KindId(247);
pub const ESCAPE_SEQUENCE: KindId = KindId(248);
pub const _NOT_ESCAPE_SEQUENCE: KindId = KindId(249);
pub const FORMAT_SPECIFIER: KindId = KindId(250);
pub const INTEGER: KindId = KindId(251);
pub const FLOAT: KindId = KindId(252);
pub const AWAIT: KindId = KindId(253);
pub const POSITIONAL_SEPARATOR: KindId = KindId(254);
pub const KEYWORD_SEPARATOR: KindId = KindId(255);
pub const _KW_ASYNC_MARKER: KindId = KindId(256);
pub const SIMPLE_STATEMENTS_ELEMENTS: KindId = KindId(257);
pub const SUBJECTS: KindId = KindId(258);
pub const CASE_PATTERNS: KindId = KindId(259);
pub const WITH_CLAUSE_WITH_ITEMS: KindId = KindId(260);
pub const TYPES: KindId = KindId(261);
pub const ARGUMENT_LIST_ELEMENTS: KindId = KindId(262);
pub const EXPRESSION_LIST_EXPRESSIONS: KindId = KindId(263);
pub const LIST_PATTERN_CASE_PATTERNS: KindId = KindId(264);
pub const DICT_PATTERN_ELEMENTS: KindId = KindId(265);
pub const PATTERN_LIST_PATTERNS: KindId = KindId(266);
pub const SUBSCRIPTS: KindId = KindId(267);
pub const DICTIONARY_ELEMENTS: KindId = KindId(268);
pub const SLICE_GROUP: KindId = KindId(269);
pub const _AUGMENTED_ASSIGNMENT_OPERATOR: KindId = KindId(270);
pub const EXCEPT_CLAUSE_EXCEPTION_AS: KindId = KindId(271);
pub const CASE_TUPLE_PATTERN: KindId = KindId(272);
pub const CASE_LIST_PATTERN: KindId = KindId(273);
pub const _PRINT_ARGUMENTS: KindId = KindId(274);
pub const _PRINT_CHEVRON_ARGUMENTS: KindId = KindId(275);
pub const PRINT_STATEMENT_CHEVRON: KindId = KindId(276);
pub const PRINT_STATEMENT_PLAIN: KindId = KindId(277);
pub const _WILDCARD_PATTERN: KindId = KindId(278);
pub const _PARENTHESIZED_IMPORT_LIST: KindId = KindId(279);
pub const COMPREHENSION_CLAUSES: KindId = KindId(280);
pub const SIMPLE_PATTERN_NEGATIVE: KindId = KindId(281);
pub const EXCEPT_CLAUSE_EXCEPTION_LIST: KindId = KindId(282);
pub const EXCEPT_CLAUSE_EXCEPTION: KindId = KindId(283);
pub const ASSIGNMENT_EQ: KindId = KindId(284);
pub const ASSIGNMENT_TYPE: KindId = KindId(285);
pub const ASSIGNMENT_TYPED: KindId = KindId(286);
pub const EXPRESSION_STATEMENT_TUPLE: KindId = KindId(287);
pub const WITH_CLAUSE_BARE: KindId = KindId(288);
pub const WITH_CLAUSE_PAREN: KindId = KindId(289);
pub const MATCH_BLOCK_BLOCK: KindId = KindId(290);
pub const SUITE_INLINE: KindId = KindId(291);
pub const SUITE_BLOCK: KindId = KindId(292);
pub const SUITE_EMPTY: KindId = KindId(293);
pub const _COMPARISON_OPERATOR_COMPARATOR: KindId = KindId(294);
pub const _YIELD_FROM_CLAUSE: KindId = KindId(295);
pub const MODULE_REPEAT1: KindId = KindId(296);
pub const IMPORT_PREFIX_REPEAT1: KindId = KindId(297);
pub const _IMPORT_LIST_REPEAT1: KindId = KindId(298);
pub const ASSERT_STATEMENT_REPEAT1: KindId = KindId(299);
pub const IF_STATEMENT_REPEAT1: KindId = KindId(300);
pub const TRY_STATEMENT_REPEAT1: KindId = KindId(301);
pub const GLOBAL_STATEMENT_REPEAT1: KindId = KindId(302);
pub const DECORATED_DEFINITION_REPEAT1: KindId = KindId(303);
pub const DOTTED_NAME_REPEAT1: KindId = KindId(304);
pub const UNION_PATTERN_REPEAT1: KindId = KindId(305);
pub const _PARAMETERS_REPEAT1: KindId = KindId(306);
pub const _PATTERNS_REPEAT1: KindId = KindId(307);
pub const COMPARISON_OPERATOR_REPEAT1: KindId = KindId(308);
pub const _COLLECTION_ELEMENTS_REPEAT1: KindId = KindId(309);
pub const FOR_IN_CLAUSE_REPEAT1: KindId = KindId(310);
pub const CONCATENATED_STRING_REPEAT1: KindId = KindId(311);
pub const STRING_REPEAT1: KindId = KindId(312);
pub const STRING_CONTENT_REPEAT1: KindId = KindId(313);
pub const FORMAT_SPECIFIER_REPEAT1: KindId = KindId(314);
pub const SIMPLE_STATEMENTS_ELEMENTS_REPEAT1: KindId = KindId(315);
pub const SUBJECTS_REPEAT1: KindId = KindId(316);
pub const CASE_PATTERNS_REPEAT1: KindId = KindId(317);
pub const WITH_CLAUSE_WITH_ITEMS_REPEAT1: KindId = KindId(318);
pub const _EXEC_STATEMENT_OPTIONAL1_REPEAT1: KindId = KindId(319);
pub const TYPES_REPEAT1: KindId = KindId(320);
pub const ARGUMENT_LIST_ELEMENTS_REPEAT1: KindId = KindId(321);
pub const EXPRESSION_LIST_EXPRESSIONS_REPEAT1: KindId = KindId(322);
pub const DICT_PATTERN_ELEMENTS_REPEAT1: KindId = KindId(323);
pub const PATTERN_LIST_PATTERNS_REPEAT1: KindId = KindId(324);
pub const SUBSCRIPTS_REPEAT1: KindId = KindId(325);
pub const DICTIONARY_ELEMENTS_REPEAT1: KindId = KindId(326);
pub const _PRINT_ARGUMENTS_REPEAT1: KindId = KindId(327);
pub const COMPREHENSION_CLAUSES_REPEAT1: KindId = KindId(328);
pub const EXCEPT_CLAUSE_EXCEPTION_LIST_REPEAT1: KindId = KindId(329);
pub const MATCH_BLOCK_BLOCK_REPEAT1: KindId = KindId(330);
pub const _AS_PATTERN_TARGET: KindId = KindId(331);
pub const _FORMAT_EXPRESSION: KindId = KindId(332);
pub const _NAMES: KindId = KindId(333);

/// Map a `KindId` back to its grammar kind string for diagnostics.
/// Returns `"<unknown>"` for ids not in this grammar's symbol table.
pub fn kind_name_from_id(id: KindId) -> &'static str {
    match id.0 {
        1 => "identifier", // "identifier"
        2 => "import", // "import_keyword"
        3 => ".", // "dot"
        4 => "from", // "from_keyword"
        5 => "__future__", // "__future___keyword"
        6 => ",", // "comma"
        7 => "as", // "as_keyword"
        8 => "*", // "star"
        9 => ">>", // "gt_gt"
        10 => "assert", // "assert_keyword"
        11 => ":=", // "colon_eq"
        12 => "return", // "return_keyword"
        13 => "del", // "del_keyword"
        14 => "raise", // "raise_keyword"
        15 => "pass", // "pass_keyword"
        16 => "break", // "break_keyword"
        17 => "continue", // "continue_keyword"
        18 => "if", // "if_keyword"
        19 => ":", // "colon"
        20 => "elif", // "elif_keyword"
        21 => "else", // "else_keyword"
        22 => "match", // "match_keyword"
        23 => "case", // "case_keyword"
        24 => "for", // "for_keyword"
        25 => "in", // "in_keyword"
        26 => "while", // "while_keyword"
        27 => "try", // "try_keyword"
        28 => "except", // "except_keyword"
        29 => "*", // "star2"
        30 => "finally", // "finally_keyword"
        31 => "with", // "with_keyword"
        32 => "def", // "def_keyword"
        33 => "(", // "lparen"
        34 => ")", // "rparen"
        35 => "**", // "star_star"
        36 => "global", // "global_keyword"
        37 => "nonlocal", // "nonlocal_keyword"
        38 => "exec", // "exec_keyword"
        39 => "type", // "type_keyword"
        40 => "=", // "eq"
        41 => "class", // "class_keyword"
        42 => "[", // "lbrack"
        43 => "]", // "rbrack"
        44 => "@", // "at"
        45 => "|", // "pipe"
        46 => "{", // "lbrace"
        47 => "}", // "rbrace"
        48 => "_", // "underscore"
        49 => "+", // "plus"
        50 => "-", // "dash"
        51 => "not", // "not_keyword"
        52 => "and", // "and_keyword"
        53 => "or", // "or_keyword"
        54 => "/", // "slash"
        55 => "%", // "percent"
        56 => "//", // "slash_slash"
        57 => "&", // "amp"
        58 => "^", // "caret"
        59 => "<<", // "lt_lt"
        60 => "~", // "tilde"
        61 => "is", // "is_keyword"
        62 => "lambda", // "lambda_keyword"
        63 => "yield", // "yield_keyword"
        64 => "ellipsis", // "ellipsis"
        65 => "\\", // "bslash"
        66 => "format_specifier_token1", // "format_specifier_token1"
        67 => "type_conversion", // "type_conversion"
        68 => "print", // "print_keyword"
        69 => "async", // "async_keyword"
        70 => "await", // "await_keyword"
        71 => "true", // "true"
        72 => "false", // "false"
        73 => "none", // "none"
        74 => "comment", // "comment"
        75 => ";", // "semi"
        76 => "->", // "dash_gt"
        77 => "+=", // "plus_eq"
        78 => "-=", // "dash_eq"
        79 => "*=", // "star_eq"
        80 => "/=", // "slash_eq"
        81 => "@=", // "at_eq"
        82 => "//=", // "slash_slash_eq"
        83 => "%=", // "percent_eq"
        84 => "**=", // "star_star_eq"
        85 => ">>=", // "gt_gt_eq"
        86 => "<<=", // "lt_lt_eq"
        87 => "&=", // "amp_eq"
        88 => "^=", // "caret_eq"
        89 => "|=", // "pipe_eq"
        90 => "integer_hex", // "integer_hex"
        91 => "integer_octal", // "integer_octal"
        92 => "integer_binary", // "integer_binary"
        93 => "integer_decimal", // "integer_decimal"
        94 => "float_point", // "float_point"
        95 => "float_leading_point", // "float_leading_point"
        96 => "float_scientific", // "float_scientific"
        97 => "escape_sequence_unicode_fixed", // "escape_sequence_unicode_fixed"
        98 => "escape_sequence_unicode_wide", // "escape_sequence_unicode_wide"
        99 => "escape_sequence_hex", // "escape_sequence_hex"
        100 => "escape_sequence_octal", // "escape_sequence_octal"
        101 => "escape_sequence_line_break", // "escape_sequence_line_break"
        102 => "escape_sequence_simple", // "escape_sequence_simple"
        103 => "escape_sequence_named", // "escape_sequence_named"
        104 => "line_continuation_newline", // "line_continuation_newline"
        105 => "line_continuation_nul", // "line_continuation_nul"
        106 => "<", // "lt"
        107 => "<=", // "lt_eq"
        108 => "==", // "eq_eq"
        109 => "!=", // "bang_eq"
        110 => ">=", // "gt_eq"
        111 => ">", // "gt"
        112 => "<>", // "lt_gt"
        113 => "newline", // "_newline"
        114 => "_indent", // "_indent"
        115 => "_dedent", // "_dedent"
        116 => "string_start", // "string_start"
        117 => "string_fragment", // "_string_content"
        118 => "escape_interpolation", // "escape_interpolation"
        119 => "string_end", // "string_end"
        120 => "_tight", // "_tight"
        121 => "_space", // "_space"
        122 => "_blankline", // "_blankline"
        123 => "_double_newline", // "_double_newline"
        124 => "module", // "module"
        125 => "_statement", // "_statement"
        126 => "simple_statements", // "_simple_statements"
        127 => "import_statement", // "import_statement"
        128 => "import_prefix", // "import_prefix"
        129 => "relative_import", // "relative_import"
        130 => "future_import_statement", // "future_import_statement"
        131 => "import_from_statement", // "import_from_statement"
        132 => "import_list", // "_import_list"
        133 => "aliased_import", // "aliased_import"
        134 => "wildcard_import", // "wildcard_import"
        135 => "print_statement", // "print_statement"
        136 => "chevron", // "chevron"
        137 => "assert_statement", // "assert_statement"
        138 => "expression_statement", // "expression_statement"
        139 => "named_expression", // "named_expression"
        140 => "_named_expression_lhs", // "_named_expression_lhs"
        141 => "return_statement", // "return_statement"
        142 => "delete_statement", // "delete_statement"
        143 => "raise_statement", // "raise_statement"
        144 => "pass_statement", // "pass_statement"
        145 => "break_statement", // "break_statement"
        146 => "continue_statement", // "continue_statement"
        147 => "if_statement", // "if_statement"
        148 => "elif_clause", // "elif_clause"
        149 => "else_clause", // "else_clause"
        150 => "match_statement", // "match_statement"
        151 => "match_block", // "_match_block"
        152 => "case_clause", // "case_clause"
        153 => "for_statement", // "for_statement"
        154 => "while_statement", // "while_statement"
        155 => "try_statement", // "try_statement"
        156 => "except_clause", // "except_clause"
        157 => "finally_clause", // "finally_clause"
        158 => "with_statement", // "with_statement"
        159 => "with_clause", // "with_clause"
        160 => "with_item", // "with_item"
        161 => "function_definition", // "function_definition"
        162 => "parameters", // "parameters"
        163 => "lambda_parameters", // "lambda_parameters"
        164 => "list_splat", // "list_splat"
        165 => "dictionary_splat", // "dictionary_splat"
        166 => "global_statement", // "global_statement"
        167 => "nonlocal_statement", // "nonlocal_statement"
        168 => "exec_statement", // "exec_statement"
        169 => "type_alias_statement", // "type_alias_statement"
        170 => "class_definition", // "class_definition"
        171 => "type_parameter", // "type_parameter"
        172 => "parenthesized_list_splat", // "parenthesized_list_splat"
        173 => "argument_list", // "argument_list"
        174 => "decorated_definition", // "decorated_definition"
        175 => "decorator", // "decorator"
        176 => "block", // "block"
        177 => "expression_list", // "expression_list"
        178 => "dotted_name", // "dotted_name"
        179 => "case_pattern", // "case_pattern"
        180 => "simple_pattern", // "_simple_pattern"
        181 => "case_as_pattern", // "_as_pattern"
        182 => "union_pattern", // "union_pattern"
        183 => "dict_pattern", // "dict_pattern"
        184 => "key_value_pattern", // "_key_value_pattern"
        185 => "keyword_pattern", // "keyword_pattern"
        186 => "splat_pattern", // "splat_pattern"
        187 => "class_pattern", // "class_pattern"
        188 => "complex_pattern", // "complex_pattern"
        189 => "parameters_elements", // "_parameters"
        190 => "patterns", // "_patterns"
        191 => "parameter", // "parameter"
        192 => "pattern", // "pattern"
        193 => "tuple_pattern", // "tuple_pattern"
        194 => "list_pattern", // "list_pattern"
        195 => "default_parameter", // "default_parameter"
        196 => "typed_default_parameter", // "typed_default_parameter"
        197 => "list_splat_pattern", // "list_splat_pattern"
        198 => "dictionary_splat_pattern", // "dictionary_splat_pattern"
        199 => "as_pattern", // "as_pattern"
        200 => "_expression_within_for_in_clause", // "_expression_within_for_in_clause"
        201 => "expression", // "expression"
        202 => "primary_expression", // "primary_expression"
        203 => "not_operator", // "not_operator"
        204 => "boolean_operator", // "boolean_operator"
        205 => "binary_operator", // "binary_operator"
        206 => "unary_operator", // "unary_operator"
        207 => "not in", // "_not_in"
        208 => "is not", // "_is_not"
        209 => "comparison_operator", // "comparison_operator"
        210 => "lambda", // "lambda"
        211 => "lambda_within_for_in_clause", // "lambda_within_for_in_clause"
        212 => "assignment", // "assignment"
        213 => "augmented_assignment", // "augmented_assignment"
        214 => "pattern_list", // "pattern_list"
        215 => "_right_hand_side", // "_right_hand_side"
        216 => "yield", // "yield"
        217 => "attribute", // "attribute"
        218 => "subscript", // "subscript"
        219 => "slice", // "slice"
        220 => "call", // "call"
        221 => "typed_parameter", // "typed_parameter"
        222 => "type", // "type"
        223 => "splat_type", // "splat_type"
        224 => "generic_type", // "generic_type"
        225 => "union_type", // "union_type"
        226 => "constrained_type", // "constrained_type"
        227 => "member_type", // "member_type"
        228 => "keyword_argument", // "keyword_argument"
        229 => "list", // "list"
        230 => "set", // "set"
        231 => "tuple", // "tuple"
        232 => "dictionary", // "dictionary"
        233 => "pair", // "pair"
        234 => "list_comprehension", // "list_comprehension"
        235 => "dictionary_comprehension", // "dictionary_comprehension"
        236 => "set_comprehension", // "set_comprehension"
        237 => "generator_expression", // "generator_expression"
        238 => "parenthesized_expression", // "parenthesized_expression"
        239 => "collection_elements", // "_collection_elements"
        240 => "for_in_clause", // "for_in_clause"
        241 => "if_clause", // "if_clause"
        242 => "conditional_expression", // "conditional_expression"
        243 => "concatenated_string", // "concatenated_string"
        244 => "string", // "string"
        245 => "string_content", // "string_content"
        246 => "interpolation", // "interpolation"
        247 => "_f_expression", // "_f_expression"
        248 => "escape_sequence", // "escape_sequence"
        249 => "not_escape_sequence", // "_not_escape_sequence"
        250 => "format_specifier", // "format_specifier"
        251 => "integer", // "integer"
        252 => "float", // "float"
        253 => "await", // "await"
        254 => "positional_separator", // "positional_separator"
        255 => "keyword_separator", // "keyword_separator"
        256 => "_kw_async_marker", // "_kw_async_marker"
        257 => "simple_statements_elements", // "simple_statements_elements"
        258 => "subjects", // "subjects"
        259 => "case_patterns", // "case_patterns"
        260 => "with_clause_with_items", // "with_clause_with_items"
        261 => "types", // "types"
        262 => "argument_list_elements", // "argument_list_elements"
        263 => "expression_list_expressions", // "expression_list_expressions"
        264 => "list_pattern_case_patterns", // "list_pattern_case_patterns"
        265 => "dict_pattern_elements", // "dict_pattern_elements"
        266 => "pattern_list_patterns", // "pattern_list_patterns"
        267 => "subscripts", // "subscripts"
        268 => "dictionary_elements", // "dictionary_elements"
        269 => "slice_group", // "slice_group"
        270 => "_augmented_assignment_operator", // "_augmented_assignment_operator"
        271 => "except_clause_exception_as", // "except_clause_exception_as"
        272 => "case_tuple_pattern", // "case_tuple_pattern"
        273 => "case_list_pattern", // "case_list_pattern"
        274 => "print_arguments", // "_print_arguments"
        275 => "print_chevron_arguments", // "_print_chevron_arguments"
        276 => "print_statement_chevron", // "print_statement_chevron"
        277 => "print_statement_plain", // "print_statement_plain"
        278 => "wildcard_pattern", // "_wildcard_pattern"
        279 => "parenthesized_import_list", // "_parenthesized_import_list"
        280 => "comprehension_clauses", // "comprehension_clauses"
        281 => "simple_pattern_negative", // "simple_pattern_negative"
        282 => "except_clause_exception_list", // "except_clause_exception_list"
        283 => "except_clause_exception", // "except_clause_exception"
        284 => "assignment_eq", // "assignment_eq"
        285 => "assignment_type", // "assignment_type"
        286 => "assignment_typed", // "assignment_typed"
        287 => "expression_statement_tuple", // "expression_statement_tuple"
        288 => "with_clause_bare", // "with_clause_bare"
        289 => "with_clause_paren", // "with_clause_paren"
        290 => "match_block_block", // "match_block_block"
        291 => "suite_inline", // "suite_inline"
        292 => "suite_block", // "suite_block"
        293 => "suite_empty", // "suite_empty"
        294 => "comparison_operator_comparator", // "_comparison_operator_comparator"
        295 => "yield_from_clause", // "_yield_from_clause"
        296 => "module_repeat1", // "module_repeat1"
        297 => "import_prefix_repeat1", // "import_prefix_repeat1"
        298 => "_import_list_repeat1", // "_import_list_repeat1"
        299 => "assert_statement_repeat1", // "assert_statement_repeat1"
        300 => "if_statement_repeat1", // "if_statement_repeat1"
        301 => "try_statement_repeat1", // "try_statement_repeat1"
        302 => "global_statement_repeat1", // "global_statement_repeat1"
        303 => "decorated_definition_repeat1", // "decorated_definition_repeat1"
        304 => "dotted_name_repeat1", // "dotted_name_repeat1"
        305 => "union_pattern_repeat1", // "union_pattern_repeat1"
        306 => "_parameters_repeat1", // "_parameters_repeat1"
        307 => "_patterns_repeat1", // "_patterns_repeat1"
        308 => "comparison_operator_repeat1", // "comparison_operator_repeat1"
        309 => "_collection_elements_repeat1", // "_collection_elements_repeat1"
        310 => "for_in_clause_repeat1", // "for_in_clause_repeat1"
        311 => "concatenated_string_repeat1", // "concatenated_string_repeat1"
        312 => "string_repeat1", // "string_repeat1"
        313 => "string_content_repeat1", // "string_content_repeat1"
        314 => "format_specifier_repeat1", // "format_specifier_repeat1"
        315 => "simple_statements_elements_repeat1", // "simple_statements_elements_repeat1"
        316 => "subjects_repeat1", // "subjects_repeat1"
        317 => "case_patterns_repeat1", // "case_patterns_repeat1"
        318 => "with_clause_with_items_repeat1", // "with_clause_with_items_repeat1"
        319 => "_exec_statement_optional1_repeat1", // "_exec_statement_optional1_repeat1"
        320 => "types_repeat1", // "types_repeat1"
        321 => "argument_list_elements_repeat1", // "argument_list_elements_repeat1"
        322 => "expression_list_expressions_repeat1", // "expression_list_expressions_repeat1"
        323 => "dict_pattern_elements_repeat1", // "dict_pattern_elements_repeat1"
        324 => "pattern_list_patterns_repeat1", // "pattern_list_patterns_repeat1"
        325 => "subscripts_repeat1", // "subscripts_repeat1"
        326 => "dictionary_elements_repeat1", // "dictionary_elements_repeat1"
        327 => "_print_arguments_repeat1", // "_print_arguments_repeat1"
        328 => "comprehension_clauses_repeat1", // "comprehension_clauses_repeat1"
        329 => "except_clause_exception_list_repeat1", // "except_clause_exception_list_repeat1"
        330 => "match_block_block_repeat1", // "match_block_block_repeat1"
        331 => "as_pattern_target", // "_as_pattern_target"
        332 => "format_expression", // "_format_expression"
        333 => "names", // "_names"
        _ => "<unknown>",
    }
}

/// Whether the reader captures a named node of this kind as text: its
/// template renders from that text, so the text is the node's content —
/// free text for a pattern kind, the literal it holds for an enum kind.
pub fn is_text_kind(kind: KindId) -> bool {
    matches!(kind.0, 1 | 67 | 74 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 | 114 | 115 | 116 | 117 | 118 | 119 | 128 | 270)
}

/// Whether this parse kind id is an alias envelope: the reader stamps the
/// grammar symbol beside it when the node is the storage node shown under
/// the alias, so the wrap layer can seat it as the envelope's content.
pub fn is_alias_envelope(kind: KindId) -> bool {
    matches!(kind.0, 331 | 332)
}

/// (parent kind id, tree-sitter field name, punctuation kind ids) for every
/// slot the parser field-tags a literal into: the separator of a repeated
/// slot, or a literal a rule puts beside a singular slot under the same
/// field. The template prints such a token itself, so the reader drops the
/// child instead of seating it, and a native read and a wrapped read hand
/// back the same slot contents.
static SLOT_SEPARATORS: &[(u16, &str, &[u16])] = &[
    (132, "name", &[6]),
    (137, "expression", &[6]),
    (166, "names", &[6]),
    (167, "names", &[6]),
    (168, "in_clause", &[6]),
    (178, "names", &[3]),
    (182, "patterns", &[45]),
    (189, "parameter", &[6]),
    (190, "pattern", &[6]),
    (239, "element", &[6]),
    (240, "right", &[6]),
    (257, "simple_statement", &[75]),
    (258, "subject", &[6]),
    (259, "case_pattern", &[6]),
    (260, "with_item", &[6]),
    (261, "type", &[6]),
    (262, "element", &[6]),
    (264, "case_pattern", &[6]),
    (265, "element", &[6]),
    (267, "subscript", &[6]),
    (268, "element", &[6]),
    (274, "argument", &[6]),
    (275, "argument", &[6]),
    (282, "value", &[6]),
    (287, "expression", &[6]),
    (288, "with_item", &[6]),
];

pub fn is_slot_separator(parent: KindId, field: &str, child: KindId) -> bool {
    SLOT_SEPARATORS
        .iter()
        .any(|(p, f, seps)| *p == parent.0 && *f == field && seps.contains(&child.0))
}

/** All branch (non-leaf) node kind strings. */
export declare const NODE_KINDS: readonly ['_as_pattern', '_comprehension_clauses', '_except_clause_list', '_expression_statement_tuple', '_list_pattern', '_match_block', '_simple_pattern_negative', '_simple_statements', '_slice_group1', '_suite', '_tuple_pattern', '_with_clause_bare', '_with_clause_paren', 'aliased_import', 'argument_list', 'as_pattern', 'assert_statement', 'assignment', 'attribute', 'augmented_assignment', 'await', 'binary_operator', 'block', 'boolean_operator', 'call', 'case_clause', 'case_pattern', 'chevron', 'class_definition', 'class_pattern', 'comparison_operator', 'complex_pattern', 'concatenated_string', 'conditional_expression', 'constrained_type', 'decorated_definition', 'decorator', 'default_parameter', 'delete_statement', 'dict_pattern', 'dictionary', 'dictionary_comprehension', 'dictionary_splat', 'dictionary_splat_pattern', 'dotted_name', 'elif_clause', 'else_clause', 'except_clause', 'exec_statement', 'expression_list', 'expression_statement', 'finally_clause', 'for_in_clause', 'for_statement', 'format_specifier', 'function_definition', 'future_import_statement', 'generator_expression', 'generic_type', 'global_statement', 'if_clause', 'if_statement', 'import_from_statement', 'import_statement', 'interpolation', 'keyword_argument', 'keyword_identifier', 'keyword_pattern', 'lambda', 'lambda_parameters', 'lambda_within_for_in_clause', 'list', 'list_comprehension', 'list_pattern', 'list_splat', 'list_splat_pattern', 'match_statement', 'member_type', 'module', 'named_expression', 'nonlocal_statement', 'not_operator', 'pair', 'parameters', 'parenthesized_expression', 'parenthesized_list_splat', 'pattern_list', 'print_statement', 'raise_statement', 'relative_import', 'return_statement', 'set', 'set_comprehension', 'slice', 'slice_group1', 'splat_pattern', 'splat_type', 'string', 'string_content', 'subscript', 'try_statement', 'tuple', 'tuple_pattern', 'type', 'type_alias_statement', 'type_parameter', 'typed_default_parameter', 'typed_parameter', 'unary_operator', 'union_pattern', 'union_type', 'while_statement', 'with_clause', 'with_item', 'with_statement', 'yield'];
/** All leaf/terminal node kind strings. */
export declare const LEAF_KINDS: readonly [')', 'False', 'None', 'True', ']', '_', '__future__', '_async_marker', '_augmented_assignment_operator', '_complex_pattern_operator', '_dedent', '_indent', '_is_not', '_kw_async_marker', '_kw_identifier', '_kw_type', '_newline', '_not_in', '_splat_pattern_operator', '_string_content', '_unary_operator_operator', 'and', 'as', 'assert', 'async', 'break', 'break_statement', 'case', 'class', 'comment', 'continue', 'continue_statement', 'def', 'del', 'elif', 'else', 'escape_interpolation', 'escape_sequence', 'except', 'exec', 'false', 'finally', 'float', 'for', 'from', 'global', 'identifier', 'if', 'import', 'import_prefix', 'in', 'integer', 'line_continuation', 'match', 'none', 'nonlocal', 'not', 'or', 'pass', 'pass_statement', 'print', 'raise', 'return', 'string_end', 'string_start', 'true', 'try', 'type_conversion', 'while', 'with', '}'];
/** All node kind strings (branch + leaf). */
export declare const ALL_KINDS: readonly ["_as_pattern", "_comprehension_clauses", "_except_clause_list", "_expression_statement_tuple", "_list_pattern", "_match_block", "_simple_pattern_negative", "_simple_statements", "_slice_group1", "_suite", "_tuple_pattern", "_with_clause_bare", "_with_clause_paren", "aliased_import", "argument_list", "as_pattern", "assert_statement", "assignment", "attribute", "augmented_assignment", "await", "binary_operator", "block", "boolean_operator", "call", "case_clause", "case_pattern", "chevron", "class_definition", "class_pattern", "comparison_operator", "complex_pattern", "concatenated_string", "conditional_expression", "constrained_type", "decorated_definition", "decorator", "default_parameter", "delete_statement", "dict_pattern", "dictionary", "dictionary_comprehension", "dictionary_splat", "dictionary_splat_pattern", "dotted_name", "elif_clause", "else_clause", "except_clause", "exec_statement", "expression_list", "expression_statement", "finally_clause", "for_in_clause", "for_statement", "format_specifier", "function_definition", "future_import_statement", "generator_expression", "generic_type", "global_statement", "if_clause", "if_statement", "import_from_statement", "import_statement", "interpolation", "keyword_argument", "keyword_identifier", "keyword_pattern", "lambda", "lambda_parameters", "lambda_within_for_in_clause", "list", "list_comprehension", "list_pattern", "list_splat", "list_splat_pattern", "match_statement", "member_type", "module", "named_expression", "nonlocal_statement", "not_operator", "pair", "parameters", "parenthesized_expression", "parenthesized_list_splat", "pattern_list", "print_statement", "raise_statement", "relative_import", "return_statement", "set", "set_comprehension", "slice", "slice_group1", "splat_pattern", "splat_type", "string", "string_content", "subscript", "try_statement", "tuple", "tuple_pattern", "type", "type_alias_statement", "type_parameter", "typed_default_parameter", "typed_parameter", "unary_operator", "union_pattern", "union_type", "while_statement", "with_clause", "with_item", "with_statement", "yield", ")", "False", "None", "True", "]", "_", "__future__", "_async_marker", "_augmented_assignment_operator", "_complex_pattern_operator", "_dedent", "_indent", "_is_not", "_kw_async_marker", "_kw_identifier", "_kw_type", "_newline", "_not_in", "_splat_pattern_operator", "_string_content", "_unary_operator_operator", "and", "as", "assert", "async", "break", "break_statement", "case", "class", "comment", "continue", "continue_statement", "def", "del", "elif", "else", "escape_interpolation", "escape_sequence", "except", "exec", "false", "finally", "float", "for", "from", "global", "identifier", "if", "import", "import_prefix", "in", "integer", "line_continuation", "match", "none", "nonlocal", "not", "or", "pass", "pass_statement", "print", "raise", "return", "string_end", "string_start", "true", "try", "type_conversion", "while", "with", "}"];
/** Language keywords (alphabetic anonymous tokens). */
export declare const KEYWORDS: readonly ['False', 'None', 'True', '_', '__future__', '_async_marker', '_kw_async_marker', '_kw_identifier', '_kw_type', '_not_escape_sequence', 'amp', 'and', 'as', 'assert', 'async', 'at', 'break', 'break_statement', 'caret', 'case', 'class', 'continue', 'continue_statement', 'dash', 'def', 'del', 'elif', 'ellipsis', 'else', 'exec', 'false', 'finally', 'for', 'from', 'global', 'gt_gt', 'if', 'import', 'in', 'keyword_separator', 'lt_lt', 'match', 'none', 'nonlocal', 'not', 'or', 'pass', 'pass_statement', 'percent', 'pipe', 'plus', 'positional_separator', 'print', 'raise', 'return', 'slash', 'slash_slash', 'star', 'star_star', 'true', 'try', 'while', 'wildcard_import', 'with'];
/** Operator/punctuation tokens. */
export declare const OPERATORS: readonly ["(", "*", "**", ",", "-", "->", ".", "...", "/", ":", ":=", "=", ">>", "@", "[", "\\", "{", "|"];
export type NodeKind = (typeof NODE_KINDS)[number];
export type LeafKind = (typeof LEAF_KINDS)[number];
export type AnyKind = (typeof ALL_KINDS)[number];
export type Keyword = (typeof KEYWORDS)[number];
export type AnyOperator = (typeof OPERATORS)[number];
/** Tree-sitter numeric IDs from the generated parser artifact. */
export declare const TREE_SITTER_ID_SOURCE = "packages/python/.sittir/src/parser.c";
export declare const TREE_SITTER_KIND_ID_BY_KIND: {
    readonly identifier: 1;
    readonly import: 3;
    readonly from: 5;
    readonly __future__: 6;
    readonly as: 10;
    readonly star: 11;
    readonly print: 12;
    readonly gt_gt: 13;
    readonly assert: 14;
    readonly return: 16;
    readonly del: 17;
    readonly raise: 18;
    readonly pass: 19;
    readonly break: 20;
    readonly continue: 21;
    readonly if: 22;
    readonly elif: 24;
    readonly else: 25;
    readonly match: 26;
    readonly case: 27;
    readonly async: 28;
    readonly for: 29;
    readonly in: 30;
    readonly while: 31;
    readonly try: 32;
    readonly except: 33;
    readonly finally: 35;
    readonly with: 36;
    readonly def: 37;
    readonly star_star: 38;
    readonly global: 39;
    readonly nonlocal: 40;
    readonly exec: 41;
    readonly class: 43;
    readonly at: 46;
    readonly _: 47;
    readonly pipe: 48;
    readonly plus: 51;
    readonly dash: 52;
    readonly not: 53;
    readonly and: 54;
    readonly or: 55;
    readonly slash: 56;
    readonly percent: 57;
    readonly slash_slash: 58;
    readonly amp: 59;
    readonly caret: 60;
    readonly lt_lt: 61;
    readonly ellipsis: 79;
    readonly escape_sequence: 81;
    readonly type_conversion: 84;
    readonly integer: 85;
    readonly float: 86;
    readonly true: 88;
    readonly false: 89;
    readonly none: 90;
    readonly comment: 91;
    readonly line_continuation: 92;
    readonly _newline: 101;
    readonly _indent: 102;
    readonly _dedent: 103;
    readonly string_start: 104;
    readonly _string_content: 105;
    readonly escape_interpolation: 106;
    readonly string_end: 107;
    readonly module: 108;
    readonly _simple_statements: 110;
    readonly import_statement: 111;
    readonly import_prefix: 112;
    readonly relative_import: 113;
    readonly future_import_statement: 114;
    readonly import_from_statement: 115;
    readonly aliased_import: 117;
    readonly wildcard_import: 118;
    readonly print_statement: 119;
    readonly chevron: 120;
    readonly assert_statement: 121;
    readonly expression_statement: 122;
    readonly named_expression: 123;
    readonly return_statement: 125;
    readonly delete_statement: 126;
    readonly raise_statement: 127;
    readonly pass_statement: 128;
    readonly break_statement: 129;
    readonly continue_statement: 130;
    readonly if_statement: 131;
    readonly elif_clause: 132;
    readonly else_clause: 133;
    readonly match_statement: 134;
    readonly _match_block: 135;
    readonly case_clause: 136;
    readonly for_statement: 137;
    readonly while_statement: 138;
    readonly try_statement: 139;
    readonly except_clause: 140;
    readonly finally_clause: 141;
    readonly with_statement: 142;
    readonly with_clause: 143;
    readonly with_item: 144;
    readonly function_definition: 145;
    readonly parameters: 146;
    readonly lambda_parameters: 147;
    readonly list_splat: 148;
    readonly dictionary_splat: 149;
    readonly global_statement: 150;
    readonly nonlocal_statement: 151;
    readonly exec_statement: 152;
    readonly type_alias_statement: 153;
    readonly class_definition: 154;
    readonly type_parameter: 155;
    readonly parenthesized_list_splat: 156;
    readonly argument_list: 157;
    readonly decorated_definition: 158;
    readonly decorator: 159;
    readonly block: 160;
    readonly expression_list: 161;
    readonly dotted_name: 162;
    readonly case_pattern: 163;
    readonly _as_pattern: 165;
    readonly union_pattern: 166;
    readonly _list_pattern: 167;
    readonly _tuple_pattern: 168;
    readonly dict_pattern: 169;
    readonly keyword_pattern: 171;
    readonly splat_pattern: 172;
    readonly class_pattern: 173;
    readonly complex_pattern: 174;
    readonly tuple_pattern: 179;
    readonly list_pattern: 180;
    readonly default_parameter: 181;
    readonly typed_default_parameter: 182;
    readonly list_splat_pattern: 183;
    readonly dictionary_splat_pattern: 184;
    readonly as_pattern: 185;
    readonly not_operator: 189;
    readonly boolean_operator: 190;
    readonly binary_operator: 191;
    readonly unary_operator: 192;
    readonly _not_in: 193;
    readonly _is_not: 194;
    readonly comparison_operator: 195;
    readonly lambda: 196;
    readonly lambda_within_for_in_clause: 197;
    readonly assignment: 198;
    readonly augmented_assignment: 199;
    readonly pattern_list: 200;
    readonly yield: 202;
    readonly attribute: 203;
    readonly subscript: 204;
    readonly slice: 205;
    readonly call: 206;
    readonly typed_parameter: 207;
    readonly type: 208;
    readonly splat_type: 209;
    readonly generic_type: 210;
    readonly union_type: 211;
    readonly constrained_type: 212;
    readonly member_type: 213;
    readonly keyword_argument: 214;
    readonly list: 215;
    readonly set: 216;
    readonly tuple: 217;
    readonly dictionary: 218;
    readonly pair: 219;
    readonly list_comprehension: 220;
    readonly dictionary_comprehension: 221;
    readonly set_comprehension: 222;
    readonly generator_expression: 223;
    readonly _comprehension_clauses: 224;
    readonly parenthesized_expression: 225;
    readonly for_in_clause: 227;
    readonly if_clause: 228;
    readonly conditional_expression: 229;
    readonly concatenated_string: 230;
    readonly string: 231;
    readonly string_content: 232;
    readonly interpolation: 233;
    readonly _not_escape_sequence: 235;
    readonly format_specifier: 236;
    readonly await: 237;
    readonly positional_separator: 238;
    readonly keyword_separator: 239;
    readonly _slice_group1: 240;
    readonly _expression_statement_tuple: 245;
    readonly _with_clause_bare: 246;
    readonly _with_clause_paren: 247;
    readonly _simple_pattern_negative: 250;
    readonly _except_clause_list: 251;
};
export declare const TREE_SITTER_KIND_BY_KIND_ID: {
    readonly [1]: "identifier";
    readonly [3]: "import";
    readonly [5]: "from";
    readonly [6]: "__future__";
    readonly [10]: "as";
    readonly [11]: "star";
    readonly [12]: "print";
    readonly [13]: "gt_gt";
    readonly [14]: "assert";
    readonly [16]: "return";
    readonly [17]: "del";
    readonly [18]: "raise";
    readonly [19]: "pass";
    readonly [20]: "break";
    readonly [21]: "continue";
    readonly [22]: "if";
    readonly [24]: "elif";
    readonly [25]: "else";
    readonly [26]: "match";
    readonly [27]: "case";
    readonly [28]: "async";
    readonly [29]: "for";
    readonly [30]: "in";
    readonly [31]: "while";
    readonly [32]: "try";
    readonly [33]: "except";
    readonly [35]: "finally";
    readonly [36]: "with";
    readonly [37]: "def";
    readonly [38]: "star_star";
    readonly [39]: "global";
    readonly [40]: "nonlocal";
    readonly [41]: "exec";
    readonly [43]: "class";
    readonly [46]: "at";
    readonly [47]: "_";
    readonly [48]: "pipe";
    readonly [51]: "plus";
    readonly [52]: "dash";
    readonly [53]: "not";
    readonly [54]: "and";
    readonly [55]: "or";
    readonly [56]: "slash";
    readonly [57]: "percent";
    readonly [58]: "slash_slash";
    readonly [59]: "amp";
    readonly [60]: "caret";
    readonly [61]: "lt_lt";
    readonly [79]: "ellipsis";
    readonly [81]: "escape_sequence";
    readonly [84]: "type_conversion";
    readonly [85]: "integer";
    readonly [86]: "float";
    readonly [88]: "true";
    readonly [89]: "false";
    readonly [90]: "none";
    readonly [91]: "comment";
    readonly [92]: "line_continuation";
    readonly [101]: "_newline";
    readonly [102]: "_indent";
    readonly [103]: "_dedent";
    readonly [104]: "string_start";
    readonly [105]: "_string_content";
    readonly [106]: "escape_interpolation";
    readonly [107]: "string_end";
    readonly [108]: "module";
    readonly [110]: "_simple_statements";
    readonly [111]: "import_statement";
    readonly [112]: "import_prefix";
    readonly [113]: "relative_import";
    readonly [114]: "future_import_statement";
    readonly [115]: "import_from_statement";
    readonly [117]: "aliased_import";
    readonly [118]: "wildcard_import";
    readonly [119]: "print_statement";
    readonly [120]: "chevron";
    readonly [121]: "assert_statement";
    readonly [122]: "expression_statement";
    readonly [123]: "named_expression";
    readonly [125]: "return_statement";
    readonly [126]: "delete_statement";
    readonly [127]: "raise_statement";
    readonly [128]: "pass_statement";
    readonly [129]: "break_statement";
    readonly [130]: "continue_statement";
    readonly [131]: "if_statement";
    readonly [132]: "elif_clause";
    readonly [133]: "else_clause";
    readonly [134]: "match_statement";
    readonly [135]: "_match_block";
    readonly [136]: "case_clause";
    readonly [137]: "for_statement";
    readonly [138]: "while_statement";
    readonly [139]: "try_statement";
    readonly [140]: "except_clause";
    readonly [141]: "finally_clause";
    readonly [142]: "with_statement";
    readonly [143]: "with_clause";
    readonly [144]: "with_item";
    readonly [145]: "function_definition";
    readonly [146]: "parameters";
    readonly [147]: "lambda_parameters";
    readonly [148]: "list_splat";
    readonly [149]: "dictionary_splat";
    readonly [150]: "global_statement";
    readonly [151]: "nonlocal_statement";
    readonly [152]: "exec_statement";
    readonly [153]: "type_alias_statement";
    readonly [154]: "class_definition";
    readonly [155]: "type_parameter";
    readonly [156]: "parenthesized_list_splat";
    readonly [157]: "argument_list";
    readonly [158]: "decorated_definition";
    readonly [159]: "decorator";
    readonly [160]: "block";
    readonly [161]: "expression_list";
    readonly [162]: "dotted_name";
    readonly [163]: "case_pattern";
    readonly [165]: "_as_pattern";
    readonly [166]: "union_pattern";
    readonly [167]: "_list_pattern";
    readonly [168]: "_tuple_pattern";
    readonly [169]: "dict_pattern";
    readonly [171]: "keyword_pattern";
    readonly [172]: "splat_pattern";
    readonly [173]: "class_pattern";
    readonly [174]: "complex_pattern";
    readonly [179]: "tuple_pattern";
    readonly [180]: "list_pattern";
    readonly [181]: "default_parameter";
    readonly [182]: "typed_default_parameter";
    readonly [183]: "list_splat_pattern";
    readonly [184]: "dictionary_splat_pattern";
    readonly [185]: "as_pattern";
    readonly [189]: "not_operator";
    readonly [190]: "boolean_operator";
    readonly [191]: "binary_operator";
    readonly [192]: "unary_operator";
    readonly [193]: "_not_in";
    readonly [194]: "_is_not";
    readonly [195]: "comparison_operator";
    readonly [196]: "lambda";
    readonly [197]: "lambda_within_for_in_clause";
    readonly [198]: "assignment";
    readonly [199]: "augmented_assignment";
    readonly [200]: "pattern_list";
    readonly [202]: "yield";
    readonly [203]: "attribute";
    readonly [204]: "subscript";
    readonly [205]: "slice";
    readonly [206]: "call";
    readonly [207]: "typed_parameter";
    readonly [208]: "type";
    readonly [209]: "splat_type";
    readonly [210]: "generic_type";
    readonly [211]: "union_type";
    readonly [212]: "constrained_type";
    readonly [213]: "member_type";
    readonly [214]: "keyword_argument";
    readonly [215]: "list";
    readonly [216]: "set";
    readonly [217]: "tuple";
    readonly [218]: "dictionary";
    readonly [219]: "pair";
    readonly [220]: "list_comprehension";
    readonly [221]: "dictionary_comprehension";
    readonly [222]: "set_comprehension";
    readonly [223]: "generator_expression";
    readonly [224]: "_comprehension_clauses";
    readonly [225]: "parenthesized_expression";
    readonly [227]: "for_in_clause";
    readonly [228]: "if_clause";
    readonly [229]: "conditional_expression";
    readonly [230]: "concatenated_string";
    readonly [231]: "string";
    readonly [232]: "string_content";
    readonly [233]: "interpolation";
    readonly [235]: "_not_escape_sequence";
    readonly [236]: "format_specifier";
    readonly [237]: "await";
    readonly [238]: "positional_separator";
    readonly [239]: "keyword_separator";
    readonly [240]: "_slice_group1";
    readonly [245]: "_expression_statement_tuple";
    readonly [246]: "_with_clause_bare";
    readonly [247]: "_with_clause_paren";
    readonly [250]: "_simple_pattern_negative";
    readonly [251]: "_except_clause_list";
};
export declare const TREE_SITTER_KIND_ID_JSON: readonly [{
    readonly name: "identifier";
    readonly id: 1;
    readonly enumName: "Identifier";
    readonly cName: "sym_identifier";
}, {
    readonly name: "import";
    readonly id: 3;
    readonly enumName: "AnonImport";
    readonly cName: "anon_sym_import";
}, {
    readonly name: "from";
    readonly id: 5;
    readonly enumName: "AnonFrom";
    readonly cName: "anon_sym_from";
}, {
    readonly name: "__future__";
    readonly id: 6;
    readonly enumName: "AnonFuture";
    readonly cName: "anon_sym___future__";
}, {
    readonly name: "as";
    readonly id: 10;
    readonly enumName: "AnonAs";
    readonly cName: "anon_sym_as";
}, {
    readonly name: "star";
    readonly id: 11;
    readonly enumName: "AnonStar";
    readonly cName: "anon_sym_STAR";
}, {
    readonly name: "print";
    readonly id: 12;
    readonly enumName: "AnonPrint";
    readonly cName: "anon_sym_print";
}, {
    readonly name: "gt_gt";
    readonly id: 13;
    readonly enumName: "AnonGtGt";
    readonly cName: "anon_sym_GT_GT";
}, {
    readonly name: "assert";
    readonly id: 14;
    readonly enumName: "AnonAssert";
    readonly cName: "anon_sym_assert";
}, {
    readonly name: "return";
    readonly id: 16;
    readonly enumName: "AnonReturn";
    readonly cName: "anon_sym_return";
}, {
    readonly name: "del";
    readonly id: 17;
    readonly enumName: "AnonDel";
    readonly cName: "anon_sym_del";
}, {
    readonly name: "raise";
    readonly id: 18;
    readonly enumName: "AnonRaise";
    readonly cName: "anon_sym_raise";
}, {
    readonly name: "pass";
    readonly id: 19;
    readonly enumName: "AnonPass";
    readonly cName: "anon_sym_pass";
}, {
    readonly name: "break";
    readonly id: 20;
    readonly enumName: "AnonBreak";
    readonly cName: "anon_sym_break";
}, {
    readonly name: "continue";
    readonly id: 21;
    readonly enumName: "AnonContinue";
    readonly cName: "anon_sym_continue";
}, {
    readonly name: "if";
    readonly id: 22;
    readonly enumName: "AnonIf";
    readonly cName: "anon_sym_if";
}, {
    readonly name: "elif";
    readonly id: 24;
    readonly enumName: "AnonElif";
    readonly cName: "anon_sym_elif";
}, {
    readonly name: "else";
    readonly id: 25;
    readonly enumName: "AnonElse";
    readonly cName: "anon_sym_else";
}, {
    readonly name: "match";
    readonly id: 26;
    readonly enumName: "AnonMatch";
    readonly cName: "anon_sym_match";
}, {
    readonly name: "case";
    readonly id: 27;
    readonly enumName: "AnonCase";
    readonly cName: "anon_sym_case";
}, {
    readonly name: "async";
    readonly id: 28;
    readonly enumName: "AnonAsync";
    readonly cName: "anon_sym_async";
}, {
    readonly name: "for";
    readonly id: 29;
    readonly enumName: "AnonFor";
    readonly cName: "anon_sym_for";
}, {
    readonly name: "in";
    readonly id: 30;
    readonly enumName: "AnonIn";
    readonly cName: "anon_sym_in";
}, {
    readonly name: "while";
    readonly id: 31;
    readonly enumName: "AnonWhile";
    readonly cName: "anon_sym_while";
}, {
    readonly name: "try";
    readonly id: 32;
    readonly enumName: "AnonTry";
    readonly cName: "anon_sym_try";
}, {
    readonly name: "except";
    readonly id: 33;
    readonly enumName: "AnonExcept";
    readonly cName: "anon_sym_except";
}, {
    readonly name: "finally";
    readonly id: 35;
    readonly enumName: "AnonFinally";
    readonly cName: "anon_sym_finally";
}, {
    readonly name: "with";
    readonly id: 36;
    readonly enumName: "AnonWith";
    readonly cName: "anon_sym_with";
}, {
    readonly name: "def";
    readonly id: 37;
    readonly enumName: "AnonDef";
    readonly cName: "anon_sym_def";
}, {
    readonly name: "star_star";
    readonly id: 38;
    readonly enumName: "AnonStarStar";
    readonly cName: "anon_sym_STAR_STAR";
}, {
    readonly name: "global";
    readonly id: 39;
    readonly enumName: "AnonGlobal";
    readonly cName: "anon_sym_global";
}, {
    readonly name: "nonlocal";
    readonly id: 40;
    readonly enumName: "AnonNonlocal";
    readonly cName: "anon_sym_nonlocal";
}, {
    readonly name: "exec";
    readonly id: 41;
    readonly enumName: "AnonExec";
    readonly cName: "anon_sym_exec";
}, {
    readonly name: "class";
    readonly id: 43;
    readonly enumName: "AnonClass";
    readonly cName: "anon_sym_class";
}, {
    readonly name: "at";
    readonly id: 46;
    readonly enumName: "AnonAt";
    readonly cName: "anon_sym_AT";
}, {
    readonly name: "_";
    readonly id: 47;
    readonly enumName: "Anon";
    readonly cName: "anon_sym__";
}, {
    readonly name: "pipe";
    readonly id: 48;
    readonly enumName: "AnonPipe";
    readonly cName: "anon_sym_PIPE";
}, {
    readonly name: "plus";
    readonly id: 51;
    readonly enumName: "AnonPlus";
    readonly cName: "anon_sym_PLUS";
}, {
    readonly name: "dash";
    readonly id: 52;
    readonly enumName: "AnonDash";
    readonly cName: "anon_sym_DASH";
}, {
    readonly name: "not";
    readonly id: 53;
    readonly enumName: "AnonNot";
    readonly cName: "anon_sym_not";
}, {
    readonly name: "and";
    readonly id: 54;
    readonly enumName: "AnonAnd";
    readonly cName: "anon_sym_and";
}, {
    readonly name: "or";
    readonly id: 55;
    readonly enumName: "AnonOr";
    readonly cName: "anon_sym_or";
}, {
    readonly name: "slash";
    readonly id: 56;
    readonly enumName: "AnonSlash";
    readonly cName: "anon_sym_SLASH";
}, {
    readonly name: "percent";
    readonly id: 57;
    readonly enumName: "AnonPercent";
    readonly cName: "anon_sym_PERCENT";
}, {
    readonly name: "slash_slash";
    readonly id: 58;
    readonly enumName: "AnonSlashSlash";
    readonly cName: "anon_sym_SLASH_SLASH";
}, {
    readonly name: "amp";
    readonly id: 59;
    readonly enumName: "AnonAmp";
    readonly cName: "anon_sym_AMP";
}, {
    readonly name: "caret";
    readonly id: 60;
    readonly enumName: "AnonCaret";
    readonly cName: "anon_sym_CARET";
}, {
    readonly name: "lt_lt";
    readonly id: 61;
    readonly enumName: "AnonLtLt";
    readonly cName: "anon_sym_LT_LT";
}, {
    readonly name: "ellipsis";
    readonly id: 79;
    readonly enumName: "Ellipsis";
    readonly cName: "sym_ellipsis";
}, {
    readonly name: "escape_sequence";
    readonly id: 81;
    readonly enumName: "EscapeSequence";
    readonly cName: "sym_escape_sequence";
}, {
    readonly name: "type_conversion";
    readonly id: 84;
    readonly enumName: "TypeConversion";
    readonly cName: "sym_type_conversion";
}, {
    readonly name: "integer";
    readonly id: 85;
    readonly enumName: "Integer";
    readonly cName: "sym_integer";
}, {
    readonly name: "float";
    readonly id: 86;
    readonly enumName: "Float";
    readonly cName: "sym_float";
}, {
    readonly name: "true";
    readonly id: 88;
    readonly enumName: "True";
    readonly cName: "sym_true";
}, {
    readonly name: "false";
    readonly id: 89;
    readonly enumName: "False";
    readonly cName: "sym_false";
}, {
    readonly name: "none";
    readonly id: 90;
    readonly enumName: "None";
    readonly cName: "sym_none";
}, {
    readonly name: "comment";
    readonly id: 91;
    readonly enumName: "Comment";
    readonly cName: "sym_comment";
}, {
    readonly name: "line_continuation";
    readonly id: 92;
    readonly enumName: "LineContinuation";
    readonly cName: "sym_line_continuation";
}, {
    readonly name: "_newline";
    readonly id: 101;
    readonly enumName: "Newline";
    readonly cName: "sym__newline";
}, {
    readonly name: "_indent";
    readonly id: 102;
    readonly enumName: "Indent";
    readonly cName: "sym__indent";
}, {
    readonly name: "_dedent";
    readonly id: 103;
    readonly enumName: "Dedent";
    readonly cName: "sym__dedent";
}, {
    readonly name: "string_start";
    readonly id: 104;
    readonly enumName: "StringStart";
    readonly cName: "sym_string_start";
}, {
    readonly name: "_string_content";
    readonly id: 105;
    readonly enumName: "StringContent";
    readonly cName: "sym__string_content";
}, {
    readonly name: "escape_interpolation";
    readonly id: 106;
    readonly enumName: "EscapeInterpolation";
    readonly cName: "sym_escape_interpolation";
}, {
    readonly name: "string_end";
    readonly id: 107;
    readonly enumName: "StringEnd";
    readonly cName: "sym_string_end";
}, {
    readonly name: "module";
    readonly id: 108;
    readonly enumName: "Module";
    readonly cName: "sym_module";
}, {
    readonly name: "_simple_statements";
    readonly id: 110;
    readonly enumName: "SimpleStatements";
    readonly cName: "sym__simple_statements";
}, {
    readonly name: "import_statement";
    readonly id: 111;
    readonly enumName: "ImportStatement";
    readonly cName: "sym_import_statement";
}, {
    readonly name: "import_prefix";
    readonly id: 112;
    readonly enumName: "ImportPrefix";
    readonly cName: "sym_import_prefix";
}, {
    readonly name: "relative_import";
    readonly id: 113;
    readonly enumName: "RelativeImport";
    readonly cName: "sym_relative_import";
}, {
    readonly name: "future_import_statement";
    readonly id: 114;
    readonly enumName: "FutureImportStatement";
    readonly cName: "sym_future_import_statement";
}, {
    readonly name: "import_from_statement";
    readonly id: 115;
    readonly enumName: "ImportFromStatement";
    readonly cName: "sym_import_from_statement";
}, {
    readonly name: "aliased_import";
    readonly id: 117;
    readonly enumName: "AliasedImport";
    readonly cName: "sym_aliased_import";
}, {
    readonly name: "wildcard_import";
    readonly id: 118;
    readonly enumName: "WildcardImport";
    readonly cName: "sym_wildcard_import";
}, {
    readonly name: "print_statement";
    readonly id: 119;
    readonly enumName: "PrintStatement";
    readonly cName: "sym_print_statement";
}, {
    readonly name: "chevron";
    readonly id: 120;
    readonly enumName: "Chevron";
    readonly cName: "sym_chevron";
}, {
    readonly name: "assert_statement";
    readonly id: 121;
    readonly enumName: "AssertStatement";
    readonly cName: "sym_assert_statement";
}, {
    readonly name: "expression_statement";
    readonly id: 122;
    readonly enumName: "ExpressionStatement";
    readonly cName: "sym_expression_statement";
}, {
    readonly name: "named_expression";
    readonly id: 123;
    readonly enumName: "NamedExpression";
    readonly cName: "sym_named_expression";
}, {
    readonly name: "return_statement";
    readonly id: 125;
    readonly enumName: "ReturnStatement";
    readonly cName: "sym_return_statement";
}, {
    readonly name: "delete_statement";
    readonly id: 126;
    readonly enumName: "DeleteStatement";
    readonly cName: "sym_delete_statement";
}, {
    readonly name: "raise_statement";
    readonly id: 127;
    readonly enumName: "RaiseStatement";
    readonly cName: "sym_raise_statement";
}, {
    readonly name: "pass_statement";
    readonly id: 128;
    readonly enumName: "PassStatement";
    readonly cName: "sym_pass_statement";
}, {
    readonly name: "break_statement";
    readonly id: 129;
    readonly enumName: "BreakStatement";
    readonly cName: "sym_break_statement";
}, {
    readonly name: "continue_statement";
    readonly id: 130;
    readonly enumName: "ContinueStatement";
    readonly cName: "sym_continue_statement";
}, {
    readonly name: "if_statement";
    readonly id: 131;
    readonly enumName: "IfStatement";
    readonly cName: "sym_if_statement";
}, {
    readonly name: "elif_clause";
    readonly id: 132;
    readonly enumName: "ElifClause";
    readonly cName: "sym_elif_clause";
}, {
    readonly name: "else_clause";
    readonly id: 133;
    readonly enumName: "ElseClause";
    readonly cName: "sym_else_clause";
}, {
    readonly name: "match_statement";
    readonly id: 134;
    readonly enumName: "MatchStatement";
    readonly cName: "sym_match_statement";
}, {
    readonly name: "_match_block";
    readonly id: 135;
    readonly enumName: "MatchBlock";
    readonly cName: "sym__match_block";
}, {
    readonly name: "case_clause";
    readonly id: 136;
    readonly enumName: "CaseClause";
    readonly cName: "sym_case_clause";
}, {
    readonly name: "for_statement";
    readonly id: 137;
    readonly enumName: "ForStatement";
    readonly cName: "sym_for_statement";
}, {
    readonly name: "while_statement";
    readonly id: 138;
    readonly enumName: "WhileStatement";
    readonly cName: "sym_while_statement";
}, {
    readonly name: "try_statement";
    readonly id: 139;
    readonly enumName: "TryStatement";
    readonly cName: "sym_try_statement";
}, {
    readonly name: "except_clause";
    readonly id: 140;
    readonly enumName: "ExceptClause";
    readonly cName: "sym_except_clause";
}, {
    readonly name: "finally_clause";
    readonly id: 141;
    readonly enumName: "FinallyClause";
    readonly cName: "sym_finally_clause";
}, {
    readonly name: "with_statement";
    readonly id: 142;
    readonly enumName: "WithStatement";
    readonly cName: "sym_with_statement";
}, {
    readonly name: "with_clause";
    readonly id: 143;
    readonly enumName: "WithClause";
    readonly cName: "sym_with_clause";
}, {
    readonly name: "with_item";
    readonly id: 144;
    readonly enumName: "WithItem";
    readonly cName: "sym_with_item";
}, {
    readonly name: "function_definition";
    readonly id: 145;
    readonly enumName: "FunctionDefinition";
    readonly cName: "sym_function_definition";
}, {
    readonly name: "parameters";
    readonly id: 146;
    readonly enumName: "Parameters";
    readonly cName: "sym_parameters";
}, {
    readonly name: "lambda_parameters";
    readonly id: 147;
    readonly enumName: "LambdaParameters";
    readonly cName: "sym_lambda_parameters";
}, {
    readonly name: "list_splat";
    readonly id: 148;
    readonly enumName: "ListSplat";
    readonly cName: "sym_list_splat";
}, {
    readonly name: "dictionary_splat";
    readonly id: 149;
    readonly enumName: "DictionarySplat";
    readonly cName: "sym_dictionary_splat";
}, {
    readonly name: "global_statement";
    readonly id: 150;
    readonly enumName: "GlobalStatement";
    readonly cName: "sym_global_statement";
}, {
    readonly name: "nonlocal_statement";
    readonly id: 151;
    readonly enumName: "NonlocalStatement";
    readonly cName: "sym_nonlocal_statement";
}, {
    readonly name: "exec_statement";
    readonly id: 152;
    readonly enumName: "ExecStatement";
    readonly cName: "sym_exec_statement";
}, {
    readonly name: "type_alias_statement";
    readonly id: 153;
    readonly enumName: "TypeAliasStatement";
    readonly cName: "sym_type_alias_statement";
}, {
    readonly name: "class_definition";
    readonly id: 154;
    readonly enumName: "ClassDefinition";
    readonly cName: "sym_class_definition";
}, {
    readonly name: "type_parameter";
    readonly id: 155;
    readonly enumName: "TypeParameter";
    readonly cName: "sym_type_parameter";
}, {
    readonly name: "parenthesized_list_splat";
    readonly id: 156;
    readonly enumName: "ParenthesizedListSplat";
    readonly cName: "sym_parenthesized_list_splat";
}, {
    readonly name: "argument_list";
    readonly id: 157;
    readonly enumName: "ArgumentList";
    readonly cName: "sym_argument_list";
}, {
    readonly name: "decorated_definition";
    readonly id: 158;
    readonly enumName: "DecoratedDefinition";
    readonly cName: "sym_decorated_definition";
}, {
    readonly name: "decorator";
    readonly id: 159;
    readonly enumName: "Decorator";
    readonly cName: "sym_decorator";
}, {
    readonly name: "block";
    readonly id: 160;
    readonly enumName: "Block";
    readonly cName: "sym_block";
}, {
    readonly name: "expression_list";
    readonly id: 161;
    readonly enumName: "ExpressionList";
    readonly cName: "sym_expression_list";
}, {
    readonly name: "dotted_name";
    readonly id: 162;
    readonly enumName: "DottedName";
    readonly cName: "sym_dotted_name";
}, {
    readonly name: "case_pattern";
    readonly id: 163;
    readonly enumName: "CasePattern";
    readonly cName: "sym_case_pattern";
}, {
    readonly name: "_as_pattern";
    readonly id: 165;
    readonly enumName: "AsPattern";
    readonly cName: "sym__as_pattern";
}, {
    readonly name: "union_pattern";
    readonly id: 166;
    readonly enumName: "UnionPattern";
    readonly cName: "sym_union_pattern";
}, {
    readonly name: "_list_pattern";
    readonly id: 167;
    readonly enumName: "ListPattern";
    readonly cName: "sym__list_pattern";
}, {
    readonly name: "_tuple_pattern";
    readonly id: 168;
    readonly enumName: "TuplePattern";
    readonly cName: "sym__tuple_pattern";
}, {
    readonly name: "dict_pattern";
    readonly id: 169;
    readonly enumName: "DictPattern";
    readonly cName: "sym_dict_pattern";
}, {
    readonly name: "keyword_pattern";
    readonly id: 171;
    readonly enumName: "KeywordPattern";
    readonly cName: "sym_keyword_pattern";
}, {
    readonly name: "splat_pattern";
    readonly id: 172;
    readonly enumName: "SplatPattern";
    readonly cName: "sym_splat_pattern";
}, {
    readonly name: "class_pattern";
    readonly id: 173;
    readonly enumName: "ClassPattern";
    readonly cName: "sym_class_pattern";
}, {
    readonly name: "complex_pattern";
    readonly id: 174;
    readonly enumName: "ComplexPattern";
    readonly cName: "sym_complex_pattern";
}, {
    readonly name: "tuple_pattern";
    readonly id: 179;
    readonly enumName: "TuplePattern_179";
    readonly cName: "sym_tuple_pattern";
}, {
    readonly name: "list_pattern";
    readonly id: 180;
    readonly enumName: "ListPattern_180";
    readonly cName: "sym_list_pattern";
}, {
    readonly name: "default_parameter";
    readonly id: 181;
    readonly enumName: "DefaultParameter";
    readonly cName: "sym_default_parameter";
}, {
    readonly name: "typed_default_parameter";
    readonly id: 182;
    readonly enumName: "TypedDefaultParameter";
    readonly cName: "sym_typed_default_parameter";
}, {
    readonly name: "list_splat_pattern";
    readonly id: 183;
    readonly enumName: "ListSplatPattern";
    readonly cName: "sym_list_splat_pattern";
}, {
    readonly name: "dictionary_splat_pattern";
    readonly id: 184;
    readonly enumName: "DictionarySplatPattern";
    readonly cName: "sym_dictionary_splat_pattern";
}, {
    readonly name: "as_pattern";
    readonly id: 185;
    readonly enumName: "AsPattern_185";
    readonly cName: "sym_as_pattern";
}, {
    readonly name: "not_operator";
    readonly id: 189;
    readonly enumName: "NotOperator";
    readonly cName: "sym_not_operator";
}, {
    readonly name: "boolean_operator";
    readonly id: 190;
    readonly enumName: "BooleanOperator";
    readonly cName: "sym_boolean_operator";
}, {
    readonly name: "binary_operator";
    readonly id: 191;
    readonly enumName: "BinaryOperator";
    readonly cName: "sym_binary_operator";
}, {
    readonly name: "unary_operator";
    readonly id: 192;
    readonly enumName: "UnaryOperator";
    readonly cName: "sym_unary_operator";
}, {
    readonly name: "_not_in";
    readonly id: 193;
    readonly enumName: "NotIn";
    readonly cName: "sym__not_in";
}, {
    readonly name: "_is_not";
    readonly id: 194;
    readonly enumName: "IsNot";
    readonly cName: "sym__is_not";
}, {
    readonly name: "comparison_operator";
    readonly id: 195;
    readonly enumName: "ComparisonOperator";
    readonly cName: "sym_comparison_operator";
}, {
    readonly name: "lambda";
    readonly id: 196;
    readonly enumName: "Lambda";
    readonly cName: "sym_lambda";
}, {
    readonly name: "lambda_within_for_in_clause";
    readonly id: 197;
    readonly enumName: "LambdaWithinForInClause";
    readonly cName: "sym_lambda_within_for_in_clause";
}, {
    readonly name: "assignment";
    readonly id: 198;
    readonly enumName: "Assignment";
    readonly cName: "sym_assignment";
}, {
    readonly name: "augmented_assignment";
    readonly id: 199;
    readonly enumName: "AugmentedAssignment";
    readonly cName: "sym_augmented_assignment";
}, {
    readonly name: "pattern_list";
    readonly id: 200;
    readonly enumName: "PatternList";
    readonly cName: "sym_pattern_list";
}, {
    readonly name: "yield";
    readonly id: 202;
    readonly enumName: "Yield";
    readonly cName: "sym_yield";
}, {
    readonly name: "attribute";
    readonly id: 203;
    readonly enumName: "Attribute";
    readonly cName: "sym_attribute";
}, {
    readonly name: "subscript";
    readonly id: 204;
    readonly enumName: "Subscript";
    readonly cName: "sym_subscript";
}, {
    readonly name: "slice";
    readonly id: 205;
    readonly enumName: "Slice";
    readonly cName: "sym_slice";
}, {
    readonly name: "call";
    readonly id: 206;
    readonly enumName: "Call";
    readonly cName: "sym_call";
}, {
    readonly name: "typed_parameter";
    readonly id: 207;
    readonly enumName: "TypedParameter";
    readonly cName: "sym_typed_parameter";
}, {
    readonly name: "type";
    readonly id: 208;
    readonly enumName: "Type";
    readonly cName: "sym_type";
}, {
    readonly name: "splat_type";
    readonly id: 209;
    readonly enumName: "SplatType";
    readonly cName: "sym_splat_type";
}, {
    readonly name: "generic_type";
    readonly id: 210;
    readonly enumName: "GenericType";
    readonly cName: "sym_generic_type";
}, {
    readonly name: "union_type";
    readonly id: 211;
    readonly enumName: "UnionType";
    readonly cName: "sym_union_type";
}, {
    readonly name: "constrained_type";
    readonly id: 212;
    readonly enumName: "ConstrainedType";
    readonly cName: "sym_constrained_type";
}, {
    readonly name: "member_type";
    readonly id: 213;
    readonly enumName: "MemberType";
    readonly cName: "sym_member_type";
}, {
    readonly name: "keyword_argument";
    readonly id: 214;
    readonly enumName: "KeywordArgument";
    readonly cName: "sym_keyword_argument";
}, {
    readonly name: "list";
    readonly id: 215;
    readonly enumName: "List";
    readonly cName: "sym_list";
}, {
    readonly name: "set";
    readonly id: 216;
    readonly enumName: "Set";
    readonly cName: "sym_set";
}, {
    readonly name: "tuple";
    readonly id: 217;
    readonly enumName: "Tuple";
    readonly cName: "sym_tuple";
}, {
    readonly name: "dictionary";
    readonly id: 218;
    readonly enumName: "Dictionary";
    readonly cName: "sym_dictionary";
}, {
    readonly name: "pair";
    readonly id: 219;
    readonly enumName: "Pair";
    readonly cName: "sym_pair";
}, {
    readonly name: "list_comprehension";
    readonly id: 220;
    readonly enumName: "ListComprehension";
    readonly cName: "sym_list_comprehension";
}, {
    readonly name: "dictionary_comprehension";
    readonly id: 221;
    readonly enumName: "DictionaryComprehension";
    readonly cName: "sym_dictionary_comprehension";
}, {
    readonly name: "set_comprehension";
    readonly id: 222;
    readonly enumName: "SetComprehension";
    readonly cName: "sym_set_comprehension";
}, {
    readonly name: "generator_expression";
    readonly id: 223;
    readonly enumName: "GeneratorExpression";
    readonly cName: "sym_generator_expression";
}, {
    readonly name: "_comprehension_clauses";
    readonly id: 224;
    readonly enumName: "ComprehensionClauses";
    readonly cName: "sym__comprehension_clauses";
}, {
    readonly name: "parenthesized_expression";
    readonly id: 225;
    readonly enumName: "ParenthesizedExpression";
    readonly cName: "sym_parenthesized_expression";
}, {
    readonly name: "for_in_clause";
    readonly id: 227;
    readonly enumName: "ForInClause";
    readonly cName: "sym_for_in_clause";
}, {
    readonly name: "if_clause";
    readonly id: 228;
    readonly enumName: "IfClause";
    readonly cName: "sym_if_clause";
}, {
    readonly name: "conditional_expression";
    readonly id: 229;
    readonly enumName: "ConditionalExpression";
    readonly cName: "sym_conditional_expression";
}, {
    readonly name: "concatenated_string";
    readonly id: 230;
    readonly enumName: "ConcatenatedString";
    readonly cName: "sym_concatenated_string";
}, {
    readonly name: "string";
    readonly id: 231;
    readonly enumName: "String";
    readonly cName: "sym_string";
}, {
    readonly name: "string_content";
    readonly id: 232;
    readonly enumName: "StringContent_232";
    readonly cName: "sym_string_content";
}, {
    readonly name: "interpolation";
    readonly id: 233;
    readonly enumName: "Interpolation";
    readonly cName: "sym_interpolation";
}, {
    readonly name: "_not_escape_sequence";
    readonly id: 235;
    readonly enumName: "NotEscapeSequence";
    readonly cName: "sym__not_escape_sequence";
}, {
    readonly name: "format_specifier";
    readonly id: 236;
    readonly enumName: "FormatSpecifier";
    readonly cName: "sym_format_specifier";
}, {
    readonly name: "await";
    readonly id: 237;
    readonly enumName: "Await";
    readonly cName: "sym_await";
}, {
    readonly name: "positional_separator";
    readonly id: 238;
    readonly enumName: "PositionalSeparator";
    readonly cName: "sym_positional_separator";
}, {
    readonly name: "keyword_separator";
    readonly id: 239;
    readonly enumName: "KeywordSeparator";
    readonly cName: "sym_keyword_separator";
}, {
    readonly name: "_slice_group1";
    readonly id: 240;
    readonly enumName: "SliceGroup1";
    readonly cName: "sym__slice_group1";
}, {
    readonly name: "_expression_statement_tuple";
    readonly id: 245;
    readonly enumName: "ExpressionStatementTuple";
    readonly cName: "sym__expression_statement_tuple";
}, {
    readonly name: "_with_clause_bare";
    readonly id: 246;
    readonly enumName: "WithClauseBare";
    readonly cName: "sym__with_clause_bare";
}, {
    readonly name: "_with_clause_paren";
    readonly id: 247;
    readonly enumName: "WithClauseParen";
    readonly cName: "sym__with_clause_paren";
}, {
    readonly name: "_simple_pattern_negative";
    readonly id: 250;
    readonly enumName: "SimplePatternNegative";
    readonly cName: "sym__simple_pattern_negative";
}, {
    readonly name: "_except_clause_list";
    readonly id: 251;
    readonly enumName: "ExceptClauseList";
    readonly cName: "sym__except_clause_list";
}];
export declare const enum TSFieldId {
    FieldAlias = 1,
    FieldAlternative = 2,
    FieldArgument = 3,
    FieldArguments = 4,
    FieldAsyncMarker = 5,
    FieldAttribute = 6,
    FieldBaseType = 7,
    FieldBlock = 8,
    FieldBody = 9,
    FieldCause = 10,
    FieldCode = 11,
    FieldComparators = 12,
    FieldCondition = 13,
    FieldConsequence = 14,
    FieldConstraint = 15,
    FieldContent = 16,
    FieldDefinition = 17,
    FieldDottedName = 18,
    FieldElseClause = 19,
    FieldEntries = 20,
    FieldExceptClauses = 21,
    FieldExpression = 22,
    FieldFinallyClause = 23,
    FieldFormatSpecifier = 24,
    FieldFunction = 25,
    FieldGuard = 26,
    FieldIdentifier = 27,
    FieldImaginary = 28,
    FieldImportPrefix = 29,
    FieldInClause = 30,
    FieldKey = 31,
    FieldLeft = 32,
    FieldModuleName = 33,
    FieldName = 34,
    FieldNewline = 35,
    FieldObject = 36,
    FieldOperator = 37,
    FieldOperators = 38,
    FieldParameters = 39,
    FieldPrimaryExpression = 40,
    FieldReal = 41,
    FieldReturnType = 42,
    FieldRight = 43,
    FieldSimplePattern = 44,
    FieldStart = 45,
    FieldStep = 46,
    FieldStop = 47,
    FieldStringEnd = 48,
    FieldStringStart = 49,
    FieldSubject = 50,
    FieldSubscript = 51,
    FieldSuperclasses = 52,
    FieldType = 53,
    FieldTypeConversion = 54,
    FieldTypeParameter = 55,
    FieldTypeParameters = 56,
    FieldValue = 57,
    FieldWildcardImport = 58,
    FieldWithClause = 59
}
export declare const TREE_SITTER_FIELD_ID_BY_NAME: {
    readonly alias: TSFieldId.FieldAlias;
    readonly alternative: TSFieldId.FieldAlternative;
    readonly argument: TSFieldId.FieldArgument;
    readonly arguments: TSFieldId.FieldArguments;
    readonly async_marker: TSFieldId.FieldAsyncMarker;
    readonly attribute: TSFieldId.FieldAttribute;
    readonly base_type: TSFieldId.FieldBaseType;
    readonly block: TSFieldId.FieldBlock;
    readonly body: TSFieldId.FieldBody;
    readonly cause: TSFieldId.FieldCause;
    readonly code: TSFieldId.FieldCode;
    readonly comparators: TSFieldId.FieldComparators;
    readonly condition: TSFieldId.FieldCondition;
    readonly consequence: TSFieldId.FieldConsequence;
    readonly constraint: TSFieldId.FieldConstraint;
    readonly content: TSFieldId.FieldContent;
    readonly definition: TSFieldId.FieldDefinition;
    readonly dotted_name: TSFieldId.FieldDottedName;
    readonly else_clause: TSFieldId.FieldElseClause;
    readonly entries: TSFieldId.FieldEntries;
    readonly except_clauses: TSFieldId.FieldExceptClauses;
    readonly expression: TSFieldId.FieldExpression;
    readonly finally_clause: TSFieldId.FieldFinallyClause;
    readonly format_specifier: TSFieldId.FieldFormatSpecifier;
    readonly function: TSFieldId.FieldFunction;
    readonly guard: TSFieldId.FieldGuard;
    readonly identifier: TSFieldId.FieldIdentifier;
    readonly imaginary: TSFieldId.FieldImaginary;
    readonly import_prefix: TSFieldId.FieldImportPrefix;
    readonly in_clause: TSFieldId.FieldInClause;
    readonly key: TSFieldId.FieldKey;
    readonly left: TSFieldId.FieldLeft;
    readonly module_name: TSFieldId.FieldModuleName;
    readonly name: TSFieldId.FieldName;
    readonly newline: TSFieldId.FieldNewline;
    readonly object: TSFieldId.FieldObject;
    readonly operator: TSFieldId.FieldOperator;
    readonly operators: TSFieldId.FieldOperators;
    readonly parameters: TSFieldId.FieldParameters;
    readonly primary_expression: TSFieldId.FieldPrimaryExpression;
    readonly real: TSFieldId.FieldReal;
    readonly return_type: TSFieldId.FieldReturnType;
    readonly right: TSFieldId.FieldRight;
    readonly simple_pattern: TSFieldId.FieldSimplePattern;
    readonly start: TSFieldId.FieldStart;
    readonly step: TSFieldId.FieldStep;
    readonly stop: TSFieldId.FieldStop;
    readonly string_end: TSFieldId.FieldStringEnd;
    readonly string_start: TSFieldId.FieldStringStart;
    readonly subject: TSFieldId.FieldSubject;
    readonly subscript: TSFieldId.FieldSubscript;
    readonly superclasses: TSFieldId.FieldSuperclasses;
    readonly type: TSFieldId.FieldType;
    readonly type_conversion: TSFieldId.FieldTypeConversion;
    readonly type_parameter: TSFieldId.FieldTypeParameter;
    readonly type_parameters: TSFieldId.FieldTypeParameters;
    readonly value: TSFieldId.FieldValue;
    readonly wildcard_import: TSFieldId.FieldWildcardImport;
    readonly with_clause: TSFieldId.FieldWithClause;
};
export declare const TREE_SITTER_FIELD_NAME_BY_ID: {
    readonly 1: "alias";
    readonly 2: "alternative";
    readonly 3: "argument";
    readonly 4: "arguments";
    readonly 5: "async_marker";
    readonly 6: "attribute";
    readonly 7: "base_type";
    readonly 8: "block";
    readonly 9: "body";
    readonly 10: "cause";
    readonly 11: "code";
    readonly 12: "comparators";
    readonly 13: "condition";
    readonly 14: "consequence";
    readonly 15: "constraint";
    readonly 16: "content";
    readonly 17: "definition";
    readonly 18: "dotted_name";
    readonly 19: "else_clause";
    readonly 20: "entries";
    readonly 21: "except_clauses";
    readonly 22: "expression";
    readonly 23: "finally_clause";
    readonly 24: "format_specifier";
    readonly 25: "function";
    readonly 26: "guard";
    readonly 27: "identifier";
    readonly 28: "imaginary";
    readonly 29: "import_prefix";
    readonly 30: "in_clause";
    readonly 31: "key";
    readonly 32: "left";
    readonly 33: "module_name";
    readonly 34: "name";
    readonly 35: "newline";
    readonly 36: "object";
    readonly 37: "operator";
    readonly 38: "operators";
    readonly 39: "parameters";
    readonly 40: "primary_expression";
    readonly 41: "real";
    readonly 42: "return_type";
    readonly 43: "right";
    readonly 44: "simple_pattern";
    readonly 45: "start";
    readonly 46: "step";
    readonly 47: "stop";
    readonly 48: "string_end";
    readonly 49: "string_start";
    readonly 50: "subject";
    readonly 51: "subscript";
    readonly 52: "superclasses";
    readonly 53: "type";
    readonly 54: "type_conversion";
    readonly 55: "type_parameter";
    readonly 56: "type_parameters";
    readonly 57: "value";
    readonly 58: "wildcard_import";
    readonly 59: "with_clause";
};
export declare const TREE_SITTER_FIELD_ID_JSON: readonly [{
    readonly name: "alias";
    readonly id: 1;
    readonly enumName: "FieldAlias";
    readonly cName: "field_alias";
}, {
    readonly name: "alternative";
    readonly id: 2;
    readonly enumName: "FieldAlternative";
    readonly cName: "field_alternative";
}, {
    readonly name: "argument";
    readonly id: 3;
    readonly enumName: "FieldArgument";
    readonly cName: "field_argument";
}, {
    readonly name: "arguments";
    readonly id: 4;
    readonly enumName: "FieldArguments";
    readonly cName: "field_arguments";
}, {
    readonly name: "async_marker";
    readonly id: 5;
    readonly enumName: "FieldAsyncMarker";
    readonly cName: "field_async_marker";
}, {
    readonly name: "attribute";
    readonly id: 6;
    readonly enumName: "FieldAttribute";
    readonly cName: "field_attribute";
}, {
    readonly name: "base_type";
    readonly id: 7;
    readonly enumName: "FieldBaseType";
    readonly cName: "field_base_type";
}, {
    readonly name: "block";
    readonly id: 8;
    readonly enumName: "FieldBlock";
    readonly cName: "field_block";
}, {
    readonly name: "body";
    readonly id: 9;
    readonly enumName: "FieldBody";
    readonly cName: "field_body";
}, {
    readonly name: "cause";
    readonly id: 10;
    readonly enumName: "FieldCause";
    readonly cName: "field_cause";
}, {
    readonly name: "code";
    readonly id: 11;
    readonly enumName: "FieldCode";
    readonly cName: "field_code";
}, {
    readonly name: "comparators";
    readonly id: 12;
    readonly enumName: "FieldComparators";
    readonly cName: "field_comparators";
}, {
    readonly name: "condition";
    readonly id: 13;
    readonly enumName: "FieldCondition";
    readonly cName: "field_condition";
}, {
    readonly name: "consequence";
    readonly id: 14;
    readonly enumName: "FieldConsequence";
    readonly cName: "field_consequence";
}, {
    readonly name: "constraint";
    readonly id: 15;
    readonly enumName: "FieldConstraint";
    readonly cName: "field_constraint";
}, {
    readonly name: "content";
    readonly id: 16;
    readonly enumName: "FieldContent";
    readonly cName: "field_content";
}, {
    readonly name: "definition";
    readonly id: 17;
    readonly enumName: "FieldDefinition";
    readonly cName: "field_definition";
}, {
    readonly name: "dotted_name";
    readonly id: 18;
    readonly enumName: "FieldDottedName";
    readonly cName: "field_dotted_name";
}, {
    readonly name: "else_clause";
    readonly id: 19;
    readonly enumName: "FieldElseClause";
    readonly cName: "field_else_clause";
}, {
    readonly name: "entries";
    readonly id: 20;
    readonly enumName: "FieldEntries";
    readonly cName: "field_entries";
}, {
    readonly name: "except_clauses";
    readonly id: 21;
    readonly enumName: "FieldExceptClauses";
    readonly cName: "field_except_clauses";
}, {
    readonly name: "expression";
    readonly id: 22;
    readonly enumName: "FieldExpression";
    readonly cName: "field_expression";
}, {
    readonly name: "finally_clause";
    readonly id: 23;
    readonly enumName: "FieldFinallyClause";
    readonly cName: "field_finally_clause";
}, {
    readonly name: "format_specifier";
    readonly id: 24;
    readonly enumName: "FieldFormatSpecifier";
    readonly cName: "field_format_specifier";
}, {
    readonly name: "function";
    readonly id: 25;
    readonly enumName: "FieldFunction";
    readonly cName: "field_function";
}, {
    readonly name: "guard";
    readonly id: 26;
    readonly enumName: "FieldGuard";
    readonly cName: "field_guard";
}, {
    readonly name: "identifier";
    readonly id: 27;
    readonly enumName: "FieldIdentifier";
    readonly cName: "field_identifier";
}, {
    readonly name: "imaginary";
    readonly id: 28;
    readonly enumName: "FieldImaginary";
    readonly cName: "field_imaginary";
}, {
    readonly name: "import_prefix";
    readonly id: 29;
    readonly enumName: "FieldImportPrefix";
    readonly cName: "field_import_prefix";
}, {
    readonly name: "in_clause";
    readonly id: 30;
    readonly enumName: "FieldInClause";
    readonly cName: "field_in_clause";
}, {
    readonly name: "key";
    readonly id: 31;
    readonly enumName: "FieldKey";
    readonly cName: "field_key";
}, {
    readonly name: "left";
    readonly id: 32;
    readonly enumName: "FieldLeft";
    readonly cName: "field_left";
}, {
    readonly name: "module_name";
    readonly id: 33;
    readonly enumName: "FieldModuleName";
    readonly cName: "field_module_name";
}, {
    readonly name: "name";
    readonly id: 34;
    readonly enumName: "FieldName";
    readonly cName: "field_name";
}, {
    readonly name: "newline";
    readonly id: 35;
    readonly enumName: "FieldNewline";
    readonly cName: "field_newline";
}, {
    readonly name: "object";
    readonly id: 36;
    readonly enumName: "FieldObject";
    readonly cName: "field_object";
}, {
    readonly name: "operator";
    readonly id: 37;
    readonly enumName: "FieldOperator";
    readonly cName: "field_operator";
}, {
    readonly name: "operators";
    readonly id: 38;
    readonly enumName: "FieldOperators";
    readonly cName: "field_operators";
}, {
    readonly name: "parameters";
    readonly id: 39;
    readonly enumName: "FieldParameters";
    readonly cName: "field_parameters";
}, {
    readonly name: "primary_expression";
    readonly id: 40;
    readonly enumName: "FieldPrimaryExpression";
    readonly cName: "field_primary_expression";
}, {
    readonly name: "real";
    readonly id: 41;
    readonly enumName: "FieldReal";
    readonly cName: "field_real";
}, {
    readonly name: "return_type";
    readonly id: 42;
    readonly enumName: "FieldReturnType";
    readonly cName: "field_return_type";
}, {
    readonly name: "right";
    readonly id: 43;
    readonly enumName: "FieldRight";
    readonly cName: "field_right";
}, {
    readonly name: "simple_pattern";
    readonly id: 44;
    readonly enumName: "FieldSimplePattern";
    readonly cName: "field_simple_pattern";
}, {
    readonly name: "start";
    readonly id: 45;
    readonly enumName: "FieldStart";
    readonly cName: "field_start";
}, {
    readonly name: "step";
    readonly id: 46;
    readonly enumName: "FieldStep";
    readonly cName: "field_step";
}, {
    readonly name: "stop";
    readonly id: 47;
    readonly enumName: "FieldStop";
    readonly cName: "field_stop";
}, {
    readonly name: "string_end";
    readonly id: 48;
    readonly enumName: "FieldStringEnd";
    readonly cName: "field_string_end";
}, {
    readonly name: "string_start";
    readonly id: 49;
    readonly enumName: "FieldStringStart";
    readonly cName: "field_string_start";
}, {
    readonly name: "subject";
    readonly id: 50;
    readonly enumName: "FieldSubject";
    readonly cName: "field_subject";
}, {
    readonly name: "subscript";
    readonly id: 51;
    readonly enumName: "FieldSubscript";
    readonly cName: "field_subscript";
}, {
    readonly name: "superclasses";
    readonly id: 52;
    readonly enumName: "FieldSuperclasses";
    readonly cName: "field_superclasses";
}, {
    readonly name: "type";
    readonly id: 53;
    readonly enumName: "FieldType";
    readonly cName: "field_type";
}, {
    readonly name: "type_conversion";
    readonly id: 54;
    readonly enumName: "FieldTypeConversion";
    readonly cName: "field_type_conversion";
}, {
    readonly name: "type_parameter";
    readonly id: 55;
    readonly enumName: "FieldTypeParameter";
    readonly cName: "field_type_parameter";
}, {
    readonly name: "type_parameters";
    readonly id: 56;
    readonly enumName: "FieldTypeParameters";
    readonly cName: "field_type_parameters";
}, {
    readonly name: "value";
    readonly id: 57;
    readonly enumName: "FieldValue";
    readonly cName: "field_value";
}, {
    readonly name: "wildcard_import";
    readonly id: 58;
    readonly enumName: "FieldWildcardImport";
    readonly cName: "field_wildcard_import";
}, {
    readonly name: "with_clause";
    readonly id: 59;
    readonly enumName: "FieldWithClause";
    readonly cName: "field_with_clause";
}];
/** Per-node-kind field metadata. */
export declare const FIELD_MAP: Record<NodeKind, ReadonlyArray<{
    name: string;
    required: boolean;
    multiple: boolean;
}>>;
/** Valid values for `_augmented_assignment_operator` nodes. */
export declare const _AUGMENTED_ASSIGNMENT_OPERATORS: readonly ['+=', '-=', '*=', '/=', '@=', '//=', '%=', '**=', '>>=', '<<=', '&=', '^=', '|='];
export type AugmentedAssignmentOperatorValue = (typeof _AUGMENTED_ASSIGNMENT_OPERATORS)[number];
/** Valid values for `_complex_pattern_operator` nodes. */
export declare const _COMPLEX_PATTERN_OPERATORS: readonly ['+', '-'];
export type ComplexPatternOperatorValue = (typeof _COMPLEX_PATTERN_OPERATORS)[number];
/** Valid values for `_splat_pattern_operator` nodes. */
export declare const _SPLAT_PATTERN_OPERATORS: readonly ['*', '**'];
export type SplatPatternOperatorValue = (typeof _SPLAT_PATTERN_OPERATORS)[number];
/** Valid values for `_unary_operator_operator` nodes. */
export declare const _UNARY_OPERATOR_OPERATORS: readonly ['+', '-', '~'];
export type UnaryOperatorOperatorValue = (typeof _UNARY_OPERATOR_OPERATORS)[number];
//# sourceMappingURL=consts.d.ts.map
/** All branch (non-leaf) node kind strings. */
export declare const NODE_KINDS: readonly ['_attributed_enum_variant', '_attributed_field_declaration', '_attributed_parameter', '_attributed_type_parameter', '_closure_expression_expr', '_delim_token_tree_brace', '_delim_token_tree_bracket', '_delim_token_tree_paren', '_expression_statement_block_ending', '_expression_statement_with_semi', '_field_pattern_shorthand', '_foreign_mod_item_body', '_function_type_fn_form', '_function_type_trait_form', '_impl_item_body', '_let_chain', '_macro_definition_brace', '_macro_definition_bracket', '_macro_definition_paren', '_match_arm_block_ending', '_mod_item_inline', '_non_special_token', '_pointer_type_mut', '_range_expression_bare', '_reference_expression_raw_mut', '_token_tree_brace', '_token_tree_bracket', '_token_tree_paren', '_token_tree_pattern_brace', '_token_tree_pattern_bracket', '_token_tree_pattern_paren', '_visibility_modifier_crate', 'abstract_type', 'arguments', 'array_expression', 'array_type', 'assignment_expression', 'associated_type', 'async_block', 'attribute', 'attribute_item', 'await_expression', 'base_field_initializer', 'binary_expression', 'block', 'block_comment', 'bounded_type', 'bracketed_type', 'break_expression', 'call_expression', 'captured_pattern', 'closure_expression', 'closure_expression_expr', 'closure_parameters', 'comment', 'compound_assignment_expr', 'const_block', 'const_item', 'const_parameter', 'continue_expression', 'declaration_list', 'delim_token_tree', 'delim_token_tree_brace', 'delim_token_tree_bracket', 'delim_token_tree_paren', 'dynamic_type', 'else_clause', 'enum_item', 'enum_variant', 'enum_variant_list', 'expression_statement', 'expression_statement_block_ending', 'expression_statement_with_semi', 'extern_crate_declaration', 'extern_modifier', 'field_declaration', 'field_declaration_list', 'field_expression', 'field_initializer', 'field_initializer_list', 'field_pattern', 'field_pattern_shorthand', 'for_expression', 'for_lifetimes', 'foreign_mod_item', 'foreign_mod_item_body', 'function_item', 'function_modifiers', 'function_signature_item', 'function_type', 'gen_block', 'generic_function', 'generic_pattern', 'generic_type', 'generic_type_with_turbofish', 'higher_ranked_trait_bound', 'if_expression', 'impl_item', 'impl_item_body', 'index_expression', 'inner_attribute_item', 'label', 'last_match_arm', 'let_condition', 'let_declaration', 'lifetime', 'lifetime_parameter', 'line_comment', 'loop_expression', 'macro_definition', 'macro_definition_brace', 'macro_definition_bracket', 'macro_definition_paren', 'macro_invocation', 'macro_rule', 'match_arm', 'match_arm_block_ending', 'match_block', 'match_expression', 'match_pattern', 'mod_item', 'mod_item_inline', 'mut_pattern', 'negative_literal', 'or_pattern', 'ordered_field_declaration_list', 'parameter', 'parameters', 'parenthesized_expression', 'pointer_type', 'pointer_type_mut', 'qualified_type', 'range_expression', 'range_expression_bare', 'range_pattern', 'raw_string_literal', 'ref_pattern', 'reference_expression', 'reference_pattern', 'reference_type', 'removed_trait_bound', 'return_expression', 'scoped_identifier', 'scoped_type_identifier', 'scoped_type_identifier_in_expression_position', 'scoped_use_list', 'self_parameter', 'shorthand_field_initializer', 'slice_pattern', 'source_file', 'static_item', 'string_literal', 'struct_expression', 'struct_item', 'struct_pattern', 'token_binding_pattern', 'token_repetition', 'token_repetition_pattern', 'token_tree', 'token_tree_brace', 'token_tree_bracket', 'token_tree_paren', 'token_tree_pattern', 'token_tree_pattern_brace', 'token_tree_pattern_bracket', 'token_tree_pattern_paren', 'trait_bounds', 'trait_item', 'try_block', 'try_expression', 'tuple_expression', 'tuple_pattern', 'tuple_struct_pattern', 'tuple_type', 'type_arguments', 'type_binding', 'type_cast_expression', 'type_item', 'type_parameter', 'type_parameters', 'unary_expression', 'union_item', 'unsafe_block', 'use_as_clause', 'use_bounds', 'use_declaration', 'use_list', 'use_wildcard', 'variadic_parameter', 'visibility_modifier', 'visibility_modifier_crate', 'where_clause', 'where_predicate', 'while_expression', 'yield_expression'];
/** All leaf/terminal node kind strings. */
export declare const LEAF_KINDS: readonly ['_', '__range_expression_binary_operator', '_closure_expression_async_marker', '_closure_expression_static_marker', '_compound_assignment_expr_operator', '_error_sentinel', '_field_identifier', '_kw_async_marker', '_kw_in', '_kw_move_marker', '_kw_pub', '_kw_ref_marker', '_kw_static_marker', '_kw_unsafe_marker', '_line_comment_content', '_line_comment_regular_dslash', '_line_doc_content', '_move_marker', '_mutable_specifier', '_pointer_type_const', '_primitive_type', '_ref_marker', '_reference_expression_raw_const', '_reserved_identifier', '_token_binding_pattern_type', '_type_identifier', '_unary_expression_operator', '_unsafe_marker', '_wildcard_pattern', 'as', 'async', 'await', 'boolean_literal', 'break', 'char_literal', 'const', 'continue', 'crate', 'default', 'dyn', 'else', 'enum', 'escape_sequence', 'extern', 'float_literal', 'fn', 'for', 'fragment_specifier', 'gen', 'identifier', 'if', 'impl', 'in', 'integer_literal', 'let', 'loop', 'match', 'metavariable', 'mod', 'move', 'mut', 'mutable_specifier', 'pub', 'raw', 'raw_string_literal_content', 'ref', 'return', 'self', 'shebang', 'static', 'string_content', 'struct', 'super', 'trait', 'try', 'type', 'union', 'unit_expression', 'unit_type', 'unsafe', 'use', 'where', 'while', 'yield'];
/** All node kind strings (branch + leaf). */
export declare const ALL_KINDS: readonly ["_attributed_enum_variant", "_attributed_field_declaration", "_attributed_parameter", "_attributed_type_parameter", "_closure_expression_expr", "_delim_token_tree_brace", "_delim_token_tree_bracket", "_delim_token_tree_paren", "_expression_statement_block_ending", "_expression_statement_with_semi", "_field_pattern_shorthand", "_foreign_mod_item_body", "_function_type_fn_form", "_function_type_trait_form", "_impl_item_body", "_let_chain", "_macro_definition_brace", "_macro_definition_bracket", "_macro_definition_paren", "_match_arm_block_ending", "_mod_item_inline", "_non_special_token", "_pointer_type_mut", "_range_expression_bare", "_reference_expression_raw_mut", "_token_tree_brace", "_token_tree_bracket", "_token_tree_paren", "_token_tree_pattern_brace", "_token_tree_pattern_bracket", "_token_tree_pattern_paren", "_visibility_modifier_crate", "abstract_type", "arguments", "array_expression", "array_type", "assignment_expression", "associated_type", "async_block", "attribute", "attribute_item", "await_expression", "base_field_initializer", "binary_expression", "block", "block_comment", "bounded_type", "bracketed_type", "break_expression", "call_expression", "captured_pattern", "closure_expression", "closure_expression_expr", "closure_parameters", "comment", "compound_assignment_expr", "const_block", "const_item", "const_parameter", "continue_expression", "declaration_list", "delim_token_tree", "delim_token_tree_brace", "delim_token_tree_bracket", "delim_token_tree_paren", "dynamic_type", "else_clause", "enum_item", "enum_variant", "enum_variant_list", "expression_statement", "expression_statement_block_ending", "expression_statement_with_semi", "extern_crate_declaration", "extern_modifier", "field_declaration", "field_declaration_list", "field_expression", "field_initializer", "field_initializer_list", "field_pattern", "field_pattern_shorthand", "for_expression", "for_lifetimes", "foreign_mod_item", "foreign_mod_item_body", "function_item", "function_modifiers", "function_signature_item", "function_type", "gen_block", "generic_function", "generic_pattern", "generic_type", "generic_type_with_turbofish", "higher_ranked_trait_bound", "if_expression", "impl_item", "impl_item_body", "index_expression", "inner_attribute_item", "label", "last_match_arm", "let_condition", "let_declaration", "lifetime", "lifetime_parameter", "line_comment", "loop_expression", "macro_definition", "macro_definition_brace", "macro_definition_bracket", "macro_definition_paren", "macro_invocation", "macro_rule", "match_arm", "match_arm_block_ending", "match_block", "match_expression", "match_pattern", "mod_item", "mod_item_inline", "mut_pattern", "negative_literal", "or_pattern", "ordered_field_declaration_list", "parameter", "parameters", "parenthesized_expression", "pointer_type", "pointer_type_mut", "qualified_type", "range_expression", "range_expression_bare", "range_pattern", "raw_string_literal", "ref_pattern", "reference_expression", "reference_pattern", "reference_type", "removed_trait_bound", "return_expression", "scoped_identifier", "scoped_type_identifier", "scoped_type_identifier_in_expression_position", "scoped_use_list", "self_parameter", "shorthand_field_initializer", "slice_pattern", "source_file", "static_item", "string_literal", "struct_expression", "struct_item", "struct_pattern", "token_binding_pattern", "token_repetition", "token_repetition_pattern", "token_tree", "token_tree_brace", "token_tree_bracket", "token_tree_paren", "token_tree_pattern", "token_tree_pattern_brace", "token_tree_pattern_bracket", "token_tree_pattern_paren", "trait_bounds", "trait_item", "try_block", "try_expression", "tuple_expression", "tuple_pattern", "tuple_struct_pattern", "tuple_type", "type_arguments", "type_binding", "type_cast_expression", "type_item", "type_parameter", "type_parameters", "unary_expression", "union_item", "unsafe_block", "use_as_clause", "use_bounds", "use_declaration", "use_list", "use_wildcard", "variadic_parameter", "visibility_modifier", "visibility_modifier_crate", "where_clause", "where_predicate", "while_expression", "yield_expression", "_", "__range_expression_binary_operator", "_closure_expression_async_marker", "_closure_expression_static_marker", "_compound_assignment_expr_operator", "_error_sentinel", "_field_identifier", "_kw_async_marker", "_kw_in", "_kw_move_marker", "_kw_pub", "_kw_ref_marker", "_kw_static_marker", "_kw_unsafe_marker", "_line_comment_content", "_line_comment_regular_dslash", "_line_doc_content", "_move_marker", "_mutable_specifier", "_pointer_type_const", "_primitive_type", "_ref_marker", "_reference_expression_raw_const", "_reserved_identifier", "_token_binding_pattern_type", "_type_identifier", "_unary_expression_operator", "_unsafe_marker", "_wildcard_pattern", "as", "async", "await", "boolean_literal", "break", "char_literal", "const", "continue", "crate", "default", "dyn", "else", "enum", "escape_sequence", "extern", "float_literal", "fn", "for", "fragment_specifier", "gen", "identifier", "if", "impl", "in", "integer_literal", "let", "loop", "match", "metavariable", "mod", "move", "mut", "mutable_specifier", "pub", "raw", "raw_string_literal_content", "ref", "return", "self", "shebang", "static", "string_content", "struct", "super", "trait", "try", "type", "union", "unit_expression", "unit_type", "unsafe", "use", "where", "while", "yield"];
/** Language keywords (alphabetic anonymous tokens). */
export declare const KEYWORDS: readonly ['_', '_closure_expression_async_marker', '_closure_expression_static_marker', '_foreign_mod_item_semi', '_impl_item_negative', '_impl_item_semi', '_inner_block_doc_comment_marker', '_inner_line_doc_comment_marker', '_kw_async_marker', '_kw_in', '_kw_move_marker', '_kw_negative', '_kw_operator', '_kw_pub', '_kw_ref_marker', '_kw_static_marker', '_kw_turbofish', '_kw_unsafe_marker', '_mod_item_external', '_move_marker', '_mutable_specifier', '_operator', '_outer_block_doc_comment_marker', '_outer_line_doc_comment_marker', '_pointer_type_const', '_range_pattern_left_bare', '_raw_string_literal_end', '_raw_string_literal_raw_string_literal_end', '_raw_string_literal_raw_string_literal_start', '_raw_string_literal_start', '_ref_marker', '_struct_item_unit', '_unsafe_marker', '_wildcard_pattern', 'amp', 'amp_amp', 'as', 'async', 'await', 'break', 'caret', 'const', 'continue', 'crate', 'default', 'dyn', 'else', 'empty_statement', 'enum', 'extern', 'fn', 'for', 'gen', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'mutable_specifier', 'never_type', 'pipe', 'pipe_pipe', 'pub', 'raw', 'ref', 'remaining_field_pattern', 'return', 'self', 'static', 'struct', 'super', 'trait', 'try', 'type', 'union', 'unsafe', 'use', 'where', 'while', 'yield'];
/** Operator/punctuation tokens. */
export declare const OPERATORS: readonly ["!", "\"", "\"#", "#", "$", "&", "&&", "'", "(", ")", "*", "*/", "+", ",", "-", "->", ".", "..", "...", "/", "/*", ":", "::", ";", "<", "=", "=>", ">", "?", "@", "[", "]", "r#\"", "{", "|", "}"];
export type NodeKind = (typeof NODE_KINDS)[number];
export type LeafKind = (typeof LEAF_KINDS)[number];
export type AnyKind = (typeof ALL_KINDS)[number];
export type Keyword = (typeof KEYWORDS)[number];
export type AnyOperator = (typeof OPERATORS)[number];
/** Tree-sitter numeric IDs from the generated parser artifact. */
export declare const TREE_SITTER_ID_SOURCE = "packages/rust/.sittir/src/parser.c";
export declare const TREE_SITTER_KIND_ID_BY_KIND: {
    readonly identifier: 1;
    readonly caret: 48;
    readonly amp: 50;
    readonly pipe: 51;
    readonly amp_amp: 52;
    readonly pipe_pipe: 53;
    readonly _: 74;
    readonly as: 84;
    readonly async: 85;
    readonly await: 86;
    readonly break: 87;
    readonly const: 88;
    readonly continue: 89;
    readonly default: 90;
    readonly enum: 91;
    readonly fn: 92;
    readonly for: 93;
    readonly gen: 94;
    readonly if: 95;
    readonly impl: 96;
    readonly let: 97;
    readonly loop: 98;
    readonly match: 99;
    readonly mod: 100;
    readonly pub: 101;
    readonly return: 102;
    readonly static: 103;
    readonly struct: 104;
    readonly trait: 105;
    readonly type: 106;
    readonly union: 107;
    readonly unsafe: 108;
    readonly use: 109;
    readonly where: 110;
    readonly while: 111;
    readonly extern: 116;
    readonly else: 117;
    readonly dyn: 119;
    readonly mutable_specifier: 120;
    readonly raw: 121;
    readonly yield: 122;
    readonly in: 123;
    readonly try: 124;
    readonly ref: 125;
    readonly integer_literal: 126;
    readonly char_literal: 129;
    readonly escape_sequence: 130;
    readonly shebang: 138;
    readonly self: 139;
    readonly super: 140;
    readonly crate: 141;
    readonly metavariable: 142;
    readonly move: 143;
    readonly _line_comment_content: 146;
    readonly string_content: 147;
    readonly _raw_string_literal_start: 148;
    readonly raw_string_literal_content: 149;
    readonly _raw_string_literal_end: 150;
    readonly float_literal: 151;
    readonly _outer_block_doc_comment_marker: 152;
    readonly _inner_block_doc_comment_marker: 153;
    readonly _line_doc_content: 155;
    readonly _error_sentinel: 156;
    readonly source_file: 157;
    readonly empty_statement: 159;
    readonly expression_statement: 160;
    readonly macro_definition: 161;
    readonly macro_rule: 162;
    readonly token_tree_pattern: 164;
    readonly token_binding_pattern: 165;
    readonly token_repetition_pattern: 166;
    readonly fragment_specifier: 167;
    readonly token_tree: 168;
    readonly token_repetition: 169;
    readonly attribute_item: 170;
    readonly inner_attribute_item: 171;
    readonly attribute: 172;
    readonly mod_item: 173;
    readonly foreign_mod_item: 174;
    readonly declaration_list: 175;
    readonly struct_item: 176;
    readonly union_item: 177;
    readonly enum_item: 178;
    readonly enum_variant_list: 179;
    readonly enum_variant: 180;
    readonly field_declaration_list: 181;
    readonly field_declaration: 182;
    readonly ordered_field_declaration_list: 183;
    readonly extern_crate_declaration: 184;
    readonly const_item: 185;
    readonly static_item: 186;
    readonly type_item: 187;
    readonly function_item: 188;
    readonly function_signature_item: 189;
    readonly function_modifiers: 190;
    readonly where_clause: 191;
    readonly where_predicate: 192;
    readonly impl_item: 193;
    readonly trait_item: 194;
    readonly associated_type: 195;
    readonly trait_bounds: 196;
    readonly higher_ranked_trait_bound: 197;
    readonly removed_trait_bound: 198;
    readonly type_parameters: 199;
    readonly const_parameter: 200;
    readonly type_parameter: 201;
    readonly lifetime_parameter: 202;
    readonly let_declaration: 203;
    readonly use_declaration: 204;
    readonly scoped_use_list: 206;
    readonly use_list: 207;
    readonly use_as_clause: 208;
    readonly use_wildcard: 209;
    readonly parameters: 210;
    readonly self_parameter: 211;
    readonly variadic_parameter: 212;
    readonly parameter: 213;
    readonly extern_modifier: 214;
    readonly visibility_modifier: 215;
    readonly bracketed_type: 217;
    readonly qualified_type: 218;
    readonly lifetime: 219;
    readonly array_type: 220;
    readonly for_lifetimes: 221;
    readonly function_type: 222;
    readonly tuple_type: 223;
    readonly unit_type: 224;
    readonly generic_function: 225;
    readonly generic_type: 226;
    readonly generic_type_with_turbofish: 227;
    readonly bounded_type: 228;
    readonly use_bounds: 229;
    readonly type_arguments: 230;
    readonly type_binding: 231;
    readonly reference_type: 232;
    readonly pointer_type: 233;
    readonly never_type: 234;
    readonly abstract_type: 235;
    readonly dynamic_type: 236;
    readonly macro_invocation: 239;
    readonly delim_token_tree: 240;
    readonly scoped_identifier: 243;
    readonly scoped_type_identifier_in_expression_position: 244;
    readonly scoped_type_identifier: 245;
    readonly range_expression: 246;
    readonly unary_expression: 247;
    readonly try_expression: 248;
    readonly reference_expression: 249;
    readonly binary_expression: 250;
    readonly assignment_expression: 251;
    readonly compound_assignment_expr: 252;
    readonly type_cast_expression: 253;
    readonly return_expression: 254;
    readonly yield_expression: 255;
    readonly call_expression: 256;
    readonly arguments: 257;
    readonly array_expression: 258;
    readonly parenthesized_expression: 259;
    readonly tuple_expression: 260;
    readonly unit_expression: 261;
    readonly struct_expression: 262;
    readonly field_initializer_list: 263;
    readonly shorthand_field_initializer: 264;
    readonly field_initializer: 265;
    readonly base_field_initializer: 266;
    readonly if_expression: 267;
    readonly let_condition: 268;
    readonly _let_chain: 269;
    readonly else_clause: 271;
    readonly match_expression: 272;
    readonly match_block: 273;
    readonly match_arm: 274;
    readonly last_match_arm: 275;
    readonly match_pattern: 276;
    readonly while_expression: 277;
    readonly loop_expression: 278;
    readonly for_expression: 279;
    readonly const_block: 280;
    readonly closure_expression: 281;
    readonly closure_parameters: 282;
    readonly label: 283;
    readonly break_expression: 284;
    readonly continue_expression: 285;
    readonly index_expression: 286;
    readonly await_expression: 287;
    readonly field_expression: 288;
    readonly unsafe_block: 289;
    readonly async_block: 290;
    readonly gen_block: 291;
    readonly try_block: 292;
    readonly block: 293;
    readonly generic_pattern: 295;
    readonly tuple_pattern: 296;
    readonly slice_pattern: 297;
    readonly tuple_struct_pattern: 298;
    readonly struct_pattern: 299;
    readonly field_pattern: 300;
    readonly remaining_field_pattern: 301;
    readonly mut_pattern: 302;
    readonly range_pattern: 303;
    readonly ref_pattern: 304;
    readonly captured_pattern: 305;
    readonly reference_pattern: 306;
    readonly or_pattern: 307;
    readonly negative_literal: 310;
    readonly string_literal: 311;
    readonly raw_string_literal: 312;
    readonly boolean_literal: 313;
    readonly line_comment: 314;
    readonly _inner_line_doc_comment_marker: 316;
    readonly _outer_line_doc_comment_marker: 317;
    readonly block_comment: 318;
    readonly _wildcard_pattern: 320;
    readonly _closure_expression_expr: 324;
    readonly _field_pattern_shorthand: 325;
    readonly _function_type_trait_form: 327;
    readonly _function_type_fn_form: 328;
    readonly _impl_item_body: 329;
    readonly _impl_item_semi: 330;
    readonly _macro_definition_paren: 331;
    readonly _macro_definition_bracket: 332;
    readonly _macro_definition_brace: 333;
    readonly _mod_item_external: 334;
    readonly _mod_item_inline: 335;
    readonly _range_expression_bare: 341;
    readonly _range_pattern_left_bare: 344;
    readonly _struct_item_unit: 347;
    readonly _visibility_modifier_crate: 348;
    readonly _pointer_type_const: 351;
    readonly _pointer_type_mut: 352;
    readonly _reference_expression_raw_const: 353;
    readonly _reference_expression_raw_mut: 354;
    readonly _expression_statement_with_semi: 355;
    readonly _expression_statement_block_ending: 356;
    readonly _foreign_mod_item_semi: 357;
    readonly _foreign_mod_item_body: 358;
    readonly _match_arm_block_ending: 360;
    readonly _line_comment_regular_dslash: 361;
    readonly _token_tree_pattern_paren: 363;
    readonly _token_tree_pattern_bracket: 364;
    readonly _token_tree_pattern_brace: 365;
    readonly _token_tree_paren: 366;
    readonly _token_tree_bracket: 367;
    readonly _token_tree_brace: 368;
    readonly _delim_token_tree_paren: 369;
    readonly _delim_token_tree_bracket: 370;
    readonly _delim_token_tree_brace: 371;
    readonly _field_identifier: 404;
    readonly _type_identifier: 407;
};
export declare const TREE_SITTER_KIND_BY_KIND_ID: {
    readonly [1]: "identifier";
    readonly [48]: "caret";
    readonly [50]: "amp";
    readonly [51]: "pipe";
    readonly [52]: "amp_amp";
    readonly [53]: "pipe_pipe";
    readonly [74]: "_";
    readonly [84]: "as";
    readonly [85]: "async";
    readonly [86]: "await";
    readonly [87]: "break";
    readonly [88]: "const";
    readonly [89]: "continue";
    readonly [90]: "default";
    readonly [91]: "enum";
    readonly [92]: "fn";
    readonly [93]: "for";
    readonly [94]: "gen";
    readonly [95]: "if";
    readonly [96]: "impl";
    readonly [97]: "let";
    readonly [98]: "loop";
    readonly [99]: "match";
    readonly [100]: "mod";
    readonly [101]: "pub";
    readonly [102]: "return";
    readonly [103]: "static";
    readonly [104]: "struct";
    readonly [105]: "trait";
    readonly [106]: "type";
    readonly [107]: "union";
    readonly [108]: "unsafe";
    readonly [109]: "use";
    readonly [110]: "where";
    readonly [111]: "while";
    readonly [116]: "extern";
    readonly [117]: "else";
    readonly [119]: "dyn";
    readonly [120]: "mutable_specifier";
    readonly [121]: "raw";
    readonly [122]: "yield";
    readonly [123]: "in";
    readonly [124]: "try";
    readonly [125]: "ref";
    readonly [126]: "integer_literal";
    readonly [129]: "char_literal";
    readonly [130]: "escape_sequence";
    readonly [138]: "shebang";
    readonly [139]: "self";
    readonly [140]: "super";
    readonly [141]: "crate";
    readonly [142]: "metavariable";
    readonly [143]: "move";
    readonly [146]: "_line_comment_content";
    readonly [147]: "string_content";
    readonly [148]: "_raw_string_literal_start";
    readonly [149]: "raw_string_literal_content";
    readonly [150]: "_raw_string_literal_end";
    readonly [151]: "float_literal";
    readonly [152]: "_outer_block_doc_comment_marker";
    readonly [153]: "_inner_block_doc_comment_marker";
    readonly [155]: "_line_doc_content";
    readonly [156]: "_error_sentinel";
    readonly [157]: "source_file";
    readonly [159]: "empty_statement";
    readonly [160]: "expression_statement";
    readonly [161]: "macro_definition";
    readonly [162]: "macro_rule";
    readonly [164]: "token_tree_pattern";
    readonly [165]: "token_binding_pattern";
    readonly [166]: "token_repetition_pattern";
    readonly [167]: "fragment_specifier";
    readonly [168]: "token_tree";
    readonly [169]: "token_repetition";
    readonly [170]: "attribute_item";
    readonly [171]: "inner_attribute_item";
    readonly [172]: "attribute";
    readonly [173]: "mod_item";
    readonly [174]: "foreign_mod_item";
    readonly [175]: "declaration_list";
    readonly [176]: "struct_item";
    readonly [177]: "union_item";
    readonly [178]: "enum_item";
    readonly [179]: "enum_variant_list";
    readonly [180]: "enum_variant";
    readonly [181]: "field_declaration_list";
    readonly [182]: "field_declaration";
    readonly [183]: "ordered_field_declaration_list";
    readonly [184]: "extern_crate_declaration";
    readonly [185]: "const_item";
    readonly [186]: "static_item";
    readonly [187]: "type_item";
    readonly [188]: "function_item";
    readonly [189]: "function_signature_item";
    readonly [190]: "function_modifiers";
    readonly [191]: "where_clause";
    readonly [192]: "where_predicate";
    readonly [193]: "impl_item";
    readonly [194]: "trait_item";
    readonly [195]: "associated_type";
    readonly [196]: "trait_bounds";
    readonly [197]: "higher_ranked_trait_bound";
    readonly [198]: "removed_trait_bound";
    readonly [199]: "type_parameters";
    readonly [200]: "const_parameter";
    readonly [201]: "type_parameter";
    readonly [202]: "lifetime_parameter";
    readonly [203]: "let_declaration";
    readonly [204]: "use_declaration";
    readonly [206]: "scoped_use_list";
    readonly [207]: "use_list";
    readonly [208]: "use_as_clause";
    readonly [209]: "use_wildcard";
    readonly [210]: "parameters";
    readonly [211]: "self_parameter";
    readonly [212]: "variadic_parameter";
    readonly [213]: "parameter";
    readonly [214]: "extern_modifier";
    readonly [215]: "visibility_modifier";
    readonly [217]: "bracketed_type";
    readonly [218]: "qualified_type";
    readonly [219]: "lifetime";
    readonly [220]: "array_type";
    readonly [221]: "for_lifetimes";
    readonly [222]: "function_type";
    readonly [223]: "tuple_type";
    readonly [224]: "unit_type";
    readonly [225]: "generic_function";
    readonly [226]: "generic_type";
    readonly [227]: "generic_type_with_turbofish";
    readonly [228]: "bounded_type";
    readonly [229]: "use_bounds";
    readonly [230]: "type_arguments";
    readonly [231]: "type_binding";
    readonly [232]: "reference_type";
    readonly [233]: "pointer_type";
    readonly [234]: "never_type";
    readonly [235]: "abstract_type";
    readonly [236]: "dynamic_type";
    readonly [239]: "macro_invocation";
    readonly [240]: "delim_token_tree";
    readonly [243]: "scoped_identifier";
    readonly [244]: "scoped_type_identifier_in_expression_position";
    readonly [245]: "scoped_type_identifier";
    readonly [246]: "range_expression";
    readonly [247]: "unary_expression";
    readonly [248]: "try_expression";
    readonly [249]: "reference_expression";
    readonly [250]: "binary_expression";
    readonly [251]: "assignment_expression";
    readonly [252]: "compound_assignment_expr";
    readonly [253]: "type_cast_expression";
    readonly [254]: "return_expression";
    readonly [255]: "yield_expression";
    readonly [256]: "call_expression";
    readonly [257]: "arguments";
    readonly [258]: "array_expression";
    readonly [259]: "parenthesized_expression";
    readonly [260]: "tuple_expression";
    readonly [261]: "unit_expression";
    readonly [262]: "struct_expression";
    readonly [263]: "field_initializer_list";
    readonly [264]: "shorthand_field_initializer";
    readonly [265]: "field_initializer";
    readonly [266]: "base_field_initializer";
    readonly [267]: "if_expression";
    readonly [268]: "let_condition";
    readonly [269]: "_let_chain";
    readonly [271]: "else_clause";
    readonly [272]: "match_expression";
    readonly [273]: "match_block";
    readonly [274]: "match_arm";
    readonly [275]: "last_match_arm";
    readonly [276]: "match_pattern";
    readonly [277]: "while_expression";
    readonly [278]: "loop_expression";
    readonly [279]: "for_expression";
    readonly [280]: "const_block";
    readonly [281]: "closure_expression";
    readonly [282]: "closure_parameters";
    readonly [283]: "label";
    readonly [284]: "break_expression";
    readonly [285]: "continue_expression";
    readonly [286]: "index_expression";
    readonly [287]: "await_expression";
    readonly [288]: "field_expression";
    readonly [289]: "unsafe_block";
    readonly [290]: "async_block";
    readonly [291]: "gen_block";
    readonly [292]: "try_block";
    readonly [293]: "block";
    readonly [295]: "generic_pattern";
    readonly [296]: "tuple_pattern";
    readonly [297]: "slice_pattern";
    readonly [298]: "tuple_struct_pattern";
    readonly [299]: "struct_pattern";
    readonly [300]: "field_pattern";
    readonly [301]: "remaining_field_pattern";
    readonly [302]: "mut_pattern";
    readonly [303]: "range_pattern";
    readonly [304]: "ref_pattern";
    readonly [305]: "captured_pattern";
    readonly [306]: "reference_pattern";
    readonly [307]: "or_pattern";
    readonly [310]: "negative_literal";
    readonly [311]: "string_literal";
    readonly [312]: "raw_string_literal";
    readonly [313]: "boolean_literal";
    readonly [314]: "line_comment";
    readonly [316]: "_inner_line_doc_comment_marker";
    readonly [317]: "_outer_line_doc_comment_marker";
    readonly [318]: "block_comment";
    readonly [320]: "_wildcard_pattern";
    readonly [324]: "_closure_expression_expr";
    readonly [325]: "_field_pattern_shorthand";
    readonly [327]: "_function_type_trait_form";
    readonly [328]: "_function_type_fn_form";
    readonly [329]: "_impl_item_body";
    readonly [330]: "_impl_item_semi";
    readonly [331]: "_macro_definition_paren";
    readonly [332]: "_macro_definition_bracket";
    readonly [333]: "_macro_definition_brace";
    readonly [334]: "_mod_item_external";
    readonly [335]: "_mod_item_inline";
    readonly [341]: "_range_expression_bare";
    readonly [344]: "_range_pattern_left_bare";
    readonly [347]: "_struct_item_unit";
    readonly [348]: "_visibility_modifier_crate";
    readonly [351]: "_pointer_type_const";
    readonly [352]: "_pointer_type_mut";
    readonly [353]: "_reference_expression_raw_const";
    readonly [354]: "_reference_expression_raw_mut";
    readonly [355]: "_expression_statement_with_semi";
    readonly [356]: "_expression_statement_block_ending";
    readonly [357]: "_foreign_mod_item_semi";
    readonly [358]: "_foreign_mod_item_body";
    readonly [360]: "_match_arm_block_ending";
    readonly [361]: "_line_comment_regular_dslash";
    readonly [363]: "_token_tree_pattern_paren";
    readonly [364]: "_token_tree_pattern_bracket";
    readonly [365]: "_token_tree_pattern_brace";
    readonly [366]: "_token_tree_paren";
    readonly [367]: "_token_tree_bracket";
    readonly [368]: "_token_tree_brace";
    readonly [369]: "_delim_token_tree_paren";
    readonly [370]: "_delim_token_tree_bracket";
    readonly [371]: "_delim_token_tree_brace";
    readonly [404]: "_field_identifier";
    readonly [407]: "_type_identifier";
};
export declare const TREE_SITTER_KIND_ID_JSON: readonly [{
    readonly name: "identifier";
    readonly id: 1;
    readonly enumName: "Identifier";
    readonly cName: "sym_identifier";
}, {
    readonly name: "caret";
    readonly id: 48;
    readonly enumName: "AnonCaret";
    readonly cName: "anon_sym_CARET";
}, {
    readonly name: "amp";
    readonly id: 50;
    readonly enumName: "AnonAmp";
    readonly cName: "anon_sym_AMP";
}, {
    readonly name: "pipe";
    readonly id: 51;
    readonly enumName: "AnonPipe";
    readonly cName: "anon_sym_PIPE";
}, {
    readonly name: "amp_amp";
    readonly id: 52;
    readonly enumName: "AnonAmpAmp";
    readonly cName: "anon_sym_AMP_AMP";
}, {
    readonly name: "pipe_pipe";
    readonly id: 53;
    readonly enumName: "AnonPipePipe";
    readonly cName: "anon_sym_PIPE_PIPE";
}, {
    readonly name: "_";
    readonly id: 74;
    readonly enumName: "Anon";
    readonly cName: "anon_sym__";
}, {
    readonly name: "as";
    readonly id: 84;
    readonly enumName: "AnonAs";
    readonly cName: "anon_sym_as";
}, {
    readonly name: "async";
    readonly id: 85;
    readonly enumName: "AnonAsync";
    readonly cName: "anon_sym_async";
}, {
    readonly name: "await";
    readonly id: 86;
    readonly enumName: "AnonAwait";
    readonly cName: "anon_sym_await";
}, {
    readonly name: "break";
    readonly id: 87;
    readonly enumName: "AnonBreak";
    readonly cName: "anon_sym_break";
}, {
    readonly name: "const";
    readonly id: 88;
    readonly enumName: "AnonConst";
    readonly cName: "anon_sym_const";
}, {
    readonly name: "continue";
    readonly id: 89;
    readonly enumName: "AnonContinue";
    readonly cName: "anon_sym_continue";
}, {
    readonly name: "default";
    readonly id: 90;
    readonly enumName: "AnonDefault";
    readonly cName: "anon_sym_default";
}, {
    readonly name: "enum";
    readonly id: 91;
    readonly enumName: "AnonEnum";
    readonly cName: "anon_sym_enum";
}, {
    readonly name: "fn";
    readonly id: 92;
    readonly enumName: "AnonFn";
    readonly cName: "anon_sym_fn";
}, {
    readonly name: "for";
    readonly id: 93;
    readonly enumName: "AnonFor";
    readonly cName: "anon_sym_for";
}, {
    readonly name: "gen";
    readonly id: 94;
    readonly enumName: "AnonGen";
    readonly cName: "anon_sym_gen";
}, {
    readonly name: "if";
    readonly id: 95;
    readonly enumName: "AnonIf";
    readonly cName: "anon_sym_if";
}, {
    readonly name: "impl";
    readonly id: 96;
    readonly enumName: "AnonImpl";
    readonly cName: "anon_sym_impl";
}, {
    readonly name: "let";
    readonly id: 97;
    readonly enumName: "AnonLet";
    readonly cName: "anon_sym_let";
}, {
    readonly name: "loop";
    readonly id: 98;
    readonly enumName: "AnonLoop";
    readonly cName: "anon_sym_loop";
}, {
    readonly name: "match";
    readonly id: 99;
    readonly enumName: "AnonMatch";
    readonly cName: "anon_sym_match";
}, {
    readonly name: "mod";
    readonly id: 100;
    readonly enumName: "AnonMod";
    readonly cName: "anon_sym_mod";
}, {
    readonly name: "pub";
    readonly id: 101;
    readonly enumName: "AnonPub";
    readonly cName: "anon_sym_pub";
}, {
    readonly name: "return";
    readonly id: 102;
    readonly enumName: "AnonReturn";
    readonly cName: "anon_sym_return";
}, {
    readonly name: "static";
    readonly id: 103;
    readonly enumName: "AnonStatic";
    readonly cName: "anon_sym_static";
}, {
    readonly name: "struct";
    readonly id: 104;
    readonly enumName: "AnonStruct";
    readonly cName: "anon_sym_struct";
}, {
    readonly name: "trait";
    readonly id: 105;
    readonly enumName: "AnonTrait";
    readonly cName: "anon_sym_trait";
}, {
    readonly name: "type";
    readonly id: 106;
    readonly enumName: "AnonType";
    readonly cName: "anon_sym_type";
}, {
    readonly name: "union";
    readonly id: 107;
    readonly enumName: "AnonUnion";
    readonly cName: "anon_sym_union";
}, {
    readonly name: "unsafe";
    readonly id: 108;
    readonly enumName: "AnonUnsafe";
    readonly cName: "anon_sym_unsafe";
}, {
    readonly name: "use";
    readonly id: 109;
    readonly enumName: "AnonUse";
    readonly cName: "anon_sym_use";
}, {
    readonly name: "where";
    readonly id: 110;
    readonly enumName: "AnonWhere";
    readonly cName: "anon_sym_where";
}, {
    readonly name: "while";
    readonly id: 111;
    readonly enumName: "AnonWhile";
    readonly cName: "anon_sym_while";
}, {
    readonly name: "extern";
    readonly id: 116;
    readonly enumName: "AnonExtern";
    readonly cName: "anon_sym_extern";
}, {
    readonly name: "else";
    readonly id: 117;
    readonly enumName: "AnonElse";
    readonly cName: "anon_sym_else";
}, {
    readonly name: "dyn";
    readonly id: 119;
    readonly enumName: "AnonDyn";
    readonly cName: "anon_sym_dyn";
}, {
    readonly name: "mutable_specifier";
    readonly id: 120;
    readonly enumName: "MutableSpecifier";
    readonly cName: "sym_mutable_specifier";
}, {
    readonly name: "raw";
    readonly id: 121;
    readonly enumName: "AnonRaw";
    readonly cName: "anon_sym_raw";
}, {
    readonly name: "yield";
    readonly id: 122;
    readonly enumName: "AnonYield";
    readonly cName: "anon_sym_yield";
}, {
    readonly name: "in";
    readonly id: 123;
    readonly enumName: "AnonIn";
    readonly cName: "anon_sym_in";
}, {
    readonly name: "try";
    readonly id: 124;
    readonly enumName: "AnonTry";
    readonly cName: "anon_sym_try";
}, {
    readonly name: "ref";
    readonly id: 125;
    readonly enumName: "AnonRef";
    readonly cName: "anon_sym_ref";
}, {
    readonly name: "integer_literal";
    readonly id: 126;
    readonly enumName: "IntegerLiteral";
    readonly cName: "sym_integer_literal";
}, {
    readonly name: "char_literal";
    readonly id: 129;
    readonly enumName: "CharLiteral";
    readonly cName: "sym_char_literal";
}, {
    readonly name: "escape_sequence";
    readonly id: 130;
    readonly enumName: "EscapeSequence";
    readonly cName: "sym_escape_sequence";
}, {
    readonly name: "shebang";
    readonly id: 138;
    readonly enumName: "Shebang";
    readonly cName: "sym_shebang";
}, {
    readonly name: "self";
    readonly id: 139;
    readonly enumName: "Self";
    readonly cName: "sym_self";
}, {
    readonly name: "super";
    readonly id: 140;
    readonly enumName: "Super";
    readonly cName: "sym_super";
}, {
    readonly name: "crate";
    readonly id: 141;
    readonly enumName: "Crate";
    readonly cName: "sym_crate";
}, {
    readonly name: "metavariable";
    readonly id: 142;
    readonly enumName: "Metavariable";
    readonly cName: "sym_metavariable";
}, {
    readonly name: "move";
    readonly id: 143;
    readonly enumName: "AnonMove";
    readonly cName: "anon_sym_move";
}, {
    readonly name: "_line_comment_content";
    readonly id: 146;
    readonly enumName: "LineCommentContent";
    readonly cName: "sym__line_comment_content";
}, {
    readonly name: "string_content";
    readonly id: 147;
    readonly enumName: "StringContent";
    readonly cName: "sym_string_content";
}, {
    readonly name: "_raw_string_literal_start";
    readonly id: 148;
    readonly enumName: "RawStringLiteralStart";
    readonly cName: "sym__raw_string_literal_start";
}, {
    readonly name: "raw_string_literal_content";
    readonly id: 149;
    readonly enumName: "RawStringLiteralContent";
    readonly cName: "sym_raw_string_literal_content";
}, {
    readonly name: "_raw_string_literal_end";
    readonly id: 150;
    readonly enumName: "RawStringLiteralEnd";
    readonly cName: "sym__raw_string_literal_end";
}, {
    readonly name: "float_literal";
    readonly id: 151;
    readonly enumName: "FloatLiteral";
    readonly cName: "sym_float_literal";
}, {
    readonly name: "_outer_block_doc_comment_marker";
    readonly id: 152;
    readonly enumName: "OuterBlockDocCommentMarker";
    readonly cName: "sym__outer_block_doc_comment_marker";
}, {
    readonly name: "_inner_block_doc_comment_marker";
    readonly id: 153;
    readonly enumName: "InnerBlockDocCommentMarker";
    readonly cName: "sym__inner_block_doc_comment_marker";
}, {
    readonly name: "_line_doc_content";
    readonly id: 155;
    readonly enumName: "LineDocContent";
    readonly cName: "sym__line_doc_content";
}, {
    readonly name: "_error_sentinel";
    readonly id: 156;
    readonly enumName: "ErrorSentinel";
    readonly cName: "sym__error_sentinel";
}, {
    readonly name: "source_file";
    readonly id: 157;
    readonly enumName: "SourceFile";
    readonly cName: "sym_source_file";
}, {
    readonly name: "empty_statement";
    readonly id: 159;
    readonly enumName: "EmptyStatement";
    readonly cName: "sym_empty_statement";
}, {
    readonly name: "expression_statement";
    readonly id: 160;
    readonly enumName: "ExpressionStatement";
    readonly cName: "sym_expression_statement";
}, {
    readonly name: "macro_definition";
    readonly id: 161;
    readonly enumName: "MacroDefinition";
    readonly cName: "sym_macro_definition";
}, {
    readonly name: "macro_rule";
    readonly id: 162;
    readonly enumName: "MacroRule";
    readonly cName: "sym_macro_rule";
}, {
    readonly name: "token_tree_pattern";
    readonly id: 164;
    readonly enumName: "TokenTreePattern";
    readonly cName: "sym_token_tree_pattern";
}, {
    readonly name: "token_binding_pattern";
    readonly id: 165;
    readonly enumName: "TokenBindingPattern";
    readonly cName: "sym_token_binding_pattern";
}, {
    readonly name: "token_repetition_pattern";
    readonly id: 166;
    readonly enumName: "TokenRepetitionPattern";
    readonly cName: "sym_token_repetition_pattern";
}, {
    readonly name: "fragment_specifier";
    readonly id: 167;
    readonly enumName: "FragmentSpecifier";
    readonly cName: "sym_fragment_specifier";
}, {
    readonly name: "token_tree";
    readonly id: 168;
    readonly enumName: "TokenTree";
    readonly cName: "sym_token_tree";
}, {
    readonly name: "token_repetition";
    readonly id: 169;
    readonly enumName: "TokenRepetition";
    readonly cName: "sym_token_repetition";
}, {
    readonly name: "attribute_item";
    readonly id: 170;
    readonly enumName: "AttributeItem";
    readonly cName: "sym_attribute_item";
}, {
    readonly name: "inner_attribute_item";
    readonly id: 171;
    readonly enumName: "InnerAttributeItem";
    readonly cName: "sym_inner_attribute_item";
}, {
    readonly name: "attribute";
    readonly id: 172;
    readonly enumName: "Attribute";
    readonly cName: "sym_attribute";
}, {
    readonly name: "mod_item";
    readonly id: 173;
    readonly enumName: "ModItem";
    readonly cName: "sym_mod_item";
}, {
    readonly name: "foreign_mod_item";
    readonly id: 174;
    readonly enumName: "ForeignModItem";
    readonly cName: "sym_foreign_mod_item";
}, {
    readonly name: "declaration_list";
    readonly id: 175;
    readonly enumName: "DeclarationList";
    readonly cName: "sym_declaration_list";
}, {
    readonly name: "struct_item";
    readonly id: 176;
    readonly enumName: "StructItem";
    readonly cName: "sym_struct_item";
}, {
    readonly name: "union_item";
    readonly id: 177;
    readonly enumName: "UnionItem";
    readonly cName: "sym_union_item";
}, {
    readonly name: "enum_item";
    readonly id: 178;
    readonly enumName: "EnumItem";
    readonly cName: "sym_enum_item";
}, {
    readonly name: "enum_variant_list";
    readonly id: 179;
    readonly enumName: "EnumVariantList";
    readonly cName: "sym_enum_variant_list";
}, {
    readonly name: "enum_variant";
    readonly id: 180;
    readonly enumName: "EnumVariant";
    readonly cName: "sym_enum_variant";
}, {
    readonly name: "field_declaration_list";
    readonly id: 181;
    readonly enumName: "FieldDeclarationList";
    readonly cName: "sym_field_declaration_list";
}, {
    readonly name: "field_declaration";
    readonly id: 182;
    readonly enumName: "FieldDeclaration";
    readonly cName: "sym_field_declaration";
}, {
    readonly name: "ordered_field_declaration_list";
    readonly id: 183;
    readonly enumName: "OrderedFieldDeclarationList";
    readonly cName: "sym_ordered_field_declaration_list";
}, {
    readonly name: "extern_crate_declaration";
    readonly id: 184;
    readonly enumName: "ExternCrateDeclaration";
    readonly cName: "sym_extern_crate_declaration";
}, {
    readonly name: "const_item";
    readonly id: 185;
    readonly enumName: "ConstItem";
    readonly cName: "sym_const_item";
}, {
    readonly name: "static_item";
    readonly id: 186;
    readonly enumName: "StaticItem";
    readonly cName: "sym_static_item";
}, {
    readonly name: "type_item";
    readonly id: 187;
    readonly enumName: "TypeItem";
    readonly cName: "sym_type_item";
}, {
    readonly name: "function_item";
    readonly id: 188;
    readonly enumName: "FunctionItem";
    readonly cName: "sym_function_item";
}, {
    readonly name: "function_signature_item";
    readonly id: 189;
    readonly enumName: "FunctionSignatureItem";
    readonly cName: "sym_function_signature_item";
}, {
    readonly name: "function_modifiers";
    readonly id: 190;
    readonly enumName: "FunctionModifiers";
    readonly cName: "sym_function_modifiers";
}, {
    readonly name: "where_clause";
    readonly id: 191;
    readonly enumName: "WhereClause";
    readonly cName: "sym_where_clause";
}, {
    readonly name: "where_predicate";
    readonly id: 192;
    readonly enumName: "WherePredicate";
    readonly cName: "sym_where_predicate";
}, {
    readonly name: "impl_item";
    readonly id: 193;
    readonly enumName: "ImplItem";
    readonly cName: "sym_impl_item";
}, {
    readonly name: "trait_item";
    readonly id: 194;
    readonly enumName: "TraitItem";
    readonly cName: "sym_trait_item";
}, {
    readonly name: "associated_type";
    readonly id: 195;
    readonly enumName: "AssociatedType";
    readonly cName: "sym_associated_type";
}, {
    readonly name: "trait_bounds";
    readonly id: 196;
    readonly enumName: "TraitBounds";
    readonly cName: "sym_trait_bounds";
}, {
    readonly name: "higher_ranked_trait_bound";
    readonly id: 197;
    readonly enumName: "HigherRankedTraitBound";
    readonly cName: "sym_higher_ranked_trait_bound";
}, {
    readonly name: "removed_trait_bound";
    readonly id: 198;
    readonly enumName: "RemovedTraitBound";
    readonly cName: "sym_removed_trait_bound";
}, {
    readonly name: "type_parameters";
    readonly id: 199;
    readonly enumName: "TypeParameters";
    readonly cName: "sym_type_parameters";
}, {
    readonly name: "const_parameter";
    readonly id: 200;
    readonly enumName: "ConstParameter";
    readonly cName: "sym_const_parameter";
}, {
    readonly name: "type_parameter";
    readonly id: 201;
    readonly enumName: "TypeParameter";
    readonly cName: "sym_type_parameter";
}, {
    readonly name: "lifetime_parameter";
    readonly id: 202;
    readonly enumName: "LifetimeParameter";
    readonly cName: "sym_lifetime_parameter";
}, {
    readonly name: "let_declaration";
    readonly id: 203;
    readonly enumName: "LetDeclaration";
    readonly cName: "sym_let_declaration";
}, {
    readonly name: "use_declaration";
    readonly id: 204;
    readonly enumName: "UseDeclaration";
    readonly cName: "sym_use_declaration";
}, {
    readonly name: "scoped_use_list";
    readonly id: 206;
    readonly enumName: "ScopedUseList";
    readonly cName: "sym_scoped_use_list";
}, {
    readonly name: "use_list";
    readonly id: 207;
    readonly enumName: "UseList";
    readonly cName: "sym_use_list";
}, {
    readonly name: "use_as_clause";
    readonly id: 208;
    readonly enumName: "UseAsClause";
    readonly cName: "sym_use_as_clause";
}, {
    readonly name: "use_wildcard";
    readonly id: 209;
    readonly enumName: "UseWildcard";
    readonly cName: "sym_use_wildcard";
}, {
    readonly name: "parameters";
    readonly id: 210;
    readonly enumName: "Parameters";
    readonly cName: "sym_parameters";
}, {
    readonly name: "self_parameter";
    readonly id: 211;
    readonly enumName: "SelfParameter";
    readonly cName: "sym_self_parameter";
}, {
    readonly name: "variadic_parameter";
    readonly id: 212;
    readonly enumName: "VariadicParameter";
    readonly cName: "sym_variadic_parameter";
}, {
    readonly name: "parameter";
    readonly id: 213;
    readonly enumName: "Parameter";
    readonly cName: "sym_parameter";
}, {
    readonly name: "extern_modifier";
    readonly id: 214;
    readonly enumName: "ExternModifier";
    readonly cName: "sym_extern_modifier";
}, {
    readonly name: "visibility_modifier";
    readonly id: 215;
    readonly enumName: "VisibilityModifier";
    readonly cName: "sym_visibility_modifier";
}, {
    readonly name: "bracketed_type";
    readonly id: 217;
    readonly enumName: "BracketedType";
    readonly cName: "sym_bracketed_type";
}, {
    readonly name: "qualified_type";
    readonly id: 218;
    readonly enumName: "QualifiedType";
    readonly cName: "sym_qualified_type";
}, {
    readonly name: "lifetime";
    readonly id: 219;
    readonly enumName: "Lifetime";
    readonly cName: "sym_lifetime";
}, {
    readonly name: "array_type";
    readonly id: 220;
    readonly enumName: "ArrayType";
    readonly cName: "sym_array_type";
}, {
    readonly name: "for_lifetimes";
    readonly id: 221;
    readonly enumName: "ForLifetimes";
    readonly cName: "sym_for_lifetimes";
}, {
    readonly name: "function_type";
    readonly id: 222;
    readonly enumName: "FunctionType";
    readonly cName: "sym_function_type";
}, {
    readonly name: "tuple_type";
    readonly id: 223;
    readonly enumName: "TupleType";
    readonly cName: "sym_tuple_type";
}, {
    readonly name: "unit_type";
    readonly id: 224;
    readonly enumName: "UnitType";
    readonly cName: "sym_unit_type";
}, {
    readonly name: "generic_function";
    readonly id: 225;
    readonly enumName: "GenericFunction";
    readonly cName: "sym_generic_function";
}, {
    readonly name: "generic_type";
    readonly id: 226;
    readonly enumName: "GenericType";
    readonly cName: "sym_generic_type";
}, {
    readonly name: "generic_type_with_turbofish";
    readonly id: 227;
    readonly enumName: "GenericTypeWithTurbofish";
    readonly cName: "sym_generic_type_with_turbofish";
}, {
    readonly name: "bounded_type";
    readonly id: 228;
    readonly enumName: "BoundedType";
    readonly cName: "sym_bounded_type";
}, {
    readonly name: "use_bounds";
    readonly id: 229;
    readonly enumName: "UseBounds";
    readonly cName: "sym_use_bounds";
}, {
    readonly name: "type_arguments";
    readonly id: 230;
    readonly enumName: "TypeArguments";
    readonly cName: "sym_type_arguments";
}, {
    readonly name: "type_binding";
    readonly id: 231;
    readonly enumName: "TypeBinding";
    readonly cName: "sym_type_binding";
}, {
    readonly name: "reference_type";
    readonly id: 232;
    readonly enumName: "ReferenceType";
    readonly cName: "sym_reference_type";
}, {
    readonly name: "pointer_type";
    readonly id: 233;
    readonly enumName: "PointerType";
    readonly cName: "sym_pointer_type";
}, {
    readonly name: "never_type";
    readonly id: 234;
    readonly enumName: "NeverType";
    readonly cName: "sym_never_type";
}, {
    readonly name: "abstract_type";
    readonly id: 235;
    readonly enumName: "AbstractType";
    readonly cName: "sym_abstract_type";
}, {
    readonly name: "dynamic_type";
    readonly id: 236;
    readonly enumName: "DynamicType";
    readonly cName: "sym_dynamic_type";
}, {
    readonly name: "macro_invocation";
    readonly id: 239;
    readonly enumName: "MacroInvocation";
    readonly cName: "sym_macro_invocation";
}, {
    readonly name: "delim_token_tree";
    readonly id: 240;
    readonly enumName: "DelimTokenTree";
    readonly cName: "sym_delim_token_tree";
}, {
    readonly name: "scoped_identifier";
    readonly id: 243;
    readonly enumName: "ScopedIdentifier";
    readonly cName: "sym_scoped_identifier";
}, {
    readonly name: "scoped_type_identifier_in_expression_position";
    readonly id: 244;
    readonly enumName: "ScopedTypeIdentifierInExpressionPosition";
    readonly cName: "sym_scoped_type_identifier_in_expression_position";
}, {
    readonly name: "scoped_type_identifier";
    readonly id: 245;
    readonly enumName: "ScopedTypeIdentifier";
    readonly cName: "sym_scoped_type_identifier";
}, {
    readonly name: "range_expression";
    readonly id: 246;
    readonly enumName: "RangeExpression";
    readonly cName: "sym_range_expression";
}, {
    readonly name: "unary_expression";
    readonly id: 247;
    readonly enumName: "UnaryExpression";
    readonly cName: "sym_unary_expression";
}, {
    readonly name: "try_expression";
    readonly id: 248;
    readonly enumName: "TryExpression";
    readonly cName: "sym_try_expression";
}, {
    readonly name: "reference_expression";
    readonly id: 249;
    readonly enumName: "ReferenceExpression";
    readonly cName: "sym_reference_expression";
}, {
    readonly name: "binary_expression";
    readonly id: 250;
    readonly enumName: "BinaryExpression";
    readonly cName: "sym_binary_expression";
}, {
    readonly name: "assignment_expression";
    readonly id: 251;
    readonly enumName: "AssignmentExpression";
    readonly cName: "sym_assignment_expression";
}, {
    readonly name: "compound_assignment_expr";
    readonly id: 252;
    readonly enumName: "CompoundAssignmentExpr";
    readonly cName: "sym_compound_assignment_expr";
}, {
    readonly name: "type_cast_expression";
    readonly id: 253;
    readonly enumName: "TypeCastExpression";
    readonly cName: "sym_type_cast_expression";
}, {
    readonly name: "return_expression";
    readonly id: 254;
    readonly enumName: "ReturnExpression";
    readonly cName: "sym_return_expression";
}, {
    readonly name: "yield_expression";
    readonly id: 255;
    readonly enumName: "YieldExpression";
    readonly cName: "sym_yield_expression";
}, {
    readonly name: "call_expression";
    readonly id: 256;
    readonly enumName: "CallExpression";
    readonly cName: "sym_call_expression";
}, {
    readonly name: "arguments";
    readonly id: 257;
    readonly enumName: "Arguments";
    readonly cName: "sym_arguments";
}, {
    readonly name: "array_expression";
    readonly id: 258;
    readonly enumName: "ArrayExpression";
    readonly cName: "sym_array_expression";
}, {
    readonly name: "parenthesized_expression";
    readonly id: 259;
    readonly enumName: "ParenthesizedExpression";
    readonly cName: "sym_parenthesized_expression";
}, {
    readonly name: "tuple_expression";
    readonly id: 260;
    readonly enumName: "TupleExpression";
    readonly cName: "sym_tuple_expression";
}, {
    readonly name: "unit_expression";
    readonly id: 261;
    readonly enumName: "UnitExpression";
    readonly cName: "sym_unit_expression";
}, {
    readonly name: "struct_expression";
    readonly id: 262;
    readonly enumName: "StructExpression";
    readonly cName: "sym_struct_expression";
}, {
    readonly name: "field_initializer_list";
    readonly id: 263;
    readonly enumName: "FieldInitializerList";
    readonly cName: "sym_field_initializer_list";
}, {
    readonly name: "shorthand_field_initializer";
    readonly id: 264;
    readonly enumName: "ShorthandFieldInitializer";
    readonly cName: "sym_shorthand_field_initializer";
}, {
    readonly name: "field_initializer";
    readonly id: 265;
    readonly enumName: "FieldInitializer";
    readonly cName: "sym_field_initializer";
}, {
    readonly name: "base_field_initializer";
    readonly id: 266;
    readonly enumName: "BaseFieldInitializer";
    readonly cName: "sym_base_field_initializer";
}, {
    readonly name: "if_expression";
    readonly id: 267;
    readonly enumName: "IfExpression";
    readonly cName: "sym_if_expression";
}, {
    readonly name: "let_condition";
    readonly id: 268;
    readonly enumName: "LetCondition";
    readonly cName: "sym_let_condition";
}, {
    readonly name: "_let_chain";
    readonly id: 269;
    readonly enumName: "LetChain";
    readonly cName: "sym__let_chain";
}, {
    readonly name: "else_clause";
    readonly id: 271;
    readonly enumName: "ElseClause";
    readonly cName: "sym_else_clause";
}, {
    readonly name: "match_expression";
    readonly id: 272;
    readonly enumName: "MatchExpression";
    readonly cName: "sym_match_expression";
}, {
    readonly name: "match_block";
    readonly id: 273;
    readonly enumName: "MatchBlock";
    readonly cName: "sym_match_block";
}, {
    readonly name: "match_arm";
    readonly id: 274;
    readonly enumName: "MatchArm";
    readonly cName: "sym_match_arm";
}, {
    readonly name: "last_match_arm";
    readonly id: 275;
    readonly enumName: "LastMatchArm";
    readonly cName: "sym_last_match_arm";
}, {
    readonly name: "match_pattern";
    readonly id: 276;
    readonly enumName: "MatchPattern";
    readonly cName: "sym_match_pattern";
}, {
    readonly name: "while_expression";
    readonly id: 277;
    readonly enumName: "WhileExpression";
    readonly cName: "sym_while_expression";
}, {
    readonly name: "loop_expression";
    readonly id: 278;
    readonly enumName: "LoopExpression";
    readonly cName: "sym_loop_expression";
}, {
    readonly name: "for_expression";
    readonly id: 279;
    readonly enumName: "ForExpression";
    readonly cName: "sym_for_expression";
}, {
    readonly name: "const_block";
    readonly id: 280;
    readonly enumName: "ConstBlock";
    readonly cName: "sym_const_block";
}, {
    readonly name: "closure_expression";
    readonly id: 281;
    readonly enumName: "ClosureExpression";
    readonly cName: "sym_closure_expression";
}, {
    readonly name: "closure_parameters";
    readonly id: 282;
    readonly enumName: "ClosureParameters";
    readonly cName: "sym_closure_parameters";
}, {
    readonly name: "label";
    readonly id: 283;
    readonly enumName: "Label";
    readonly cName: "sym_label";
}, {
    readonly name: "break_expression";
    readonly id: 284;
    readonly enumName: "BreakExpression";
    readonly cName: "sym_break_expression";
}, {
    readonly name: "continue_expression";
    readonly id: 285;
    readonly enumName: "ContinueExpression";
    readonly cName: "sym_continue_expression";
}, {
    readonly name: "index_expression";
    readonly id: 286;
    readonly enumName: "IndexExpression";
    readonly cName: "sym_index_expression";
}, {
    readonly name: "await_expression";
    readonly id: 287;
    readonly enumName: "AwaitExpression";
    readonly cName: "sym_await_expression";
}, {
    readonly name: "field_expression";
    readonly id: 288;
    readonly enumName: "FieldExpression";
    readonly cName: "sym_field_expression";
}, {
    readonly name: "unsafe_block";
    readonly id: 289;
    readonly enumName: "UnsafeBlock";
    readonly cName: "sym_unsafe_block";
}, {
    readonly name: "async_block";
    readonly id: 290;
    readonly enumName: "AsyncBlock";
    readonly cName: "sym_async_block";
}, {
    readonly name: "gen_block";
    readonly id: 291;
    readonly enumName: "GenBlock";
    readonly cName: "sym_gen_block";
}, {
    readonly name: "try_block";
    readonly id: 292;
    readonly enumName: "TryBlock";
    readonly cName: "sym_try_block";
}, {
    readonly name: "block";
    readonly id: 293;
    readonly enumName: "Block";
    readonly cName: "sym_block";
}, {
    readonly name: "generic_pattern";
    readonly id: 295;
    readonly enumName: "GenericPattern";
    readonly cName: "sym_generic_pattern";
}, {
    readonly name: "tuple_pattern";
    readonly id: 296;
    readonly enumName: "TuplePattern";
    readonly cName: "sym_tuple_pattern";
}, {
    readonly name: "slice_pattern";
    readonly id: 297;
    readonly enumName: "SlicePattern";
    readonly cName: "sym_slice_pattern";
}, {
    readonly name: "tuple_struct_pattern";
    readonly id: 298;
    readonly enumName: "TupleStructPattern";
    readonly cName: "sym_tuple_struct_pattern";
}, {
    readonly name: "struct_pattern";
    readonly id: 299;
    readonly enumName: "StructPattern";
    readonly cName: "sym_struct_pattern";
}, {
    readonly name: "field_pattern";
    readonly id: 300;
    readonly enumName: "FieldPattern";
    readonly cName: "sym_field_pattern";
}, {
    readonly name: "remaining_field_pattern";
    readonly id: 301;
    readonly enumName: "RemainingFieldPattern";
    readonly cName: "sym_remaining_field_pattern";
}, {
    readonly name: "mut_pattern";
    readonly id: 302;
    readonly enumName: "MutPattern";
    readonly cName: "sym_mut_pattern";
}, {
    readonly name: "range_pattern";
    readonly id: 303;
    readonly enumName: "RangePattern";
    readonly cName: "sym_range_pattern";
}, {
    readonly name: "ref_pattern";
    readonly id: 304;
    readonly enumName: "RefPattern";
    readonly cName: "sym_ref_pattern";
}, {
    readonly name: "captured_pattern";
    readonly id: 305;
    readonly enumName: "CapturedPattern";
    readonly cName: "sym_captured_pattern";
}, {
    readonly name: "reference_pattern";
    readonly id: 306;
    readonly enumName: "ReferencePattern";
    readonly cName: "sym_reference_pattern";
}, {
    readonly name: "or_pattern";
    readonly id: 307;
    readonly enumName: "OrPattern";
    readonly cName: "sym_or_pattern";
}, {
    readonly name: "negative_literal";
    readonly id: 310;
    readonly enumName: "NegativeLiteral";
    readonly cName: "sym_negative_literal";
}, {
    readonly name: "string_literal";
    readonly id: 311;
    readonly enumName: "StringLiteral";
    readonly cName: "sym_string_literal";
}, {
    readonly name: "raw_string_literal";
    readonly id: 312;
    readonly enumName: "RawStringLiteral";
    readonly cName: "sym_raw_string_literal";
}, {
    readonly name: "boolean_literal";
    readonly id: 313;
    readonly enumName: "BooleanLiteral";
    readonly cName: "sym_boolean_literal";
}, {
    readonly name: "line_comment";
    readonly id: 314;
    readonly enumName: "LineComment";
    readonly cName: "sym_line_comment";
}, {
    readonly name: "_inner_line_doc_comment_marker";
    readonly id: 316;
    readonly enumName: "InnerLineDocCommentMarker";
    readonly cName: "sym__inner_line_doc_comment_marker";
}, {
    readonly name: "_outer_line_doc_comment_marker";
    readonly id: 317;
    readonly enumName: "OuterLineDocCommentMarker";
    readonly cName: "sym__outer_line_doc_comment_marker";
}, {
    readonly name: "block_comment";
    readonly id: 318;
    readonly enumName: "BlockComment";
    readonly cName: "sym_block_comment";
}, {
    readonly name: "_wildcard_pattern";
    readonly id: 320;
    readonly enumName: "WildcardPattern";
    readonly cName: "sym__wildcard_pattern";
}, {
    readonly name: "_closure_expression_expr";
    readonly id: 324;
    readonly enumName: "ClosureExpressionExpr";
    readonly cName: "sym__closure_expression_expr";
}, {
    readonly name: "_field_pattern_shorthand";
    readonly id: 325;
    readonly enumName: "FieldPatternShorthand";
    readonly cName: "sym__field_pattern_shorthand";
}, {
    readonly name: "_function_type_trait_form";
    readonly id: 327;
    readonly enumName: "FunctionTypeTraitForm";
    readonly cName: "sym__function_type_trait_form";
}, {
    readonly name: "_function_type_fn_form";
    readonly id: 328;
    readonly enumName: "FunctionTypeFnForm";
    readonly cName: "sym__function_type_fn_form";
}, {
    readonly name: "_impl_item_body";
    readonly id: 329;
    readonly enumName: "ImplItemBody";
    readonly cName: "sym__impl_item_body";
}, {
    readonly name: "_impl_item_semi";
    readonly id: 330;
    readonly enumName: "ImplItemSemi";
    readonly cName: "sym__impl_item_semi";
}, {
    readonly name: "_macro_definition_paren";
    readonly id: 331;
    readonly enumName: "MacroDefinitionParen";
    readonly cName: "sym__macro_definition_paren";
}, {
    readonly name: "_macro_definition_bracket";
    readonly id: 332;
    readonly enumName: "MacroDefinitionBracket";
    readonly cName: "sym__macro_definition_bracket";
}, {
    readonly name: "_macro_definition_brace";
    readonly id: 333;
    readonly enumName: "MacroDefinitionBrace";
    readonly cName: "sym__macro_definition_brace";
}, {
    readonly name: "_mod_item_external";
    readonly id: 334;
    readonly enumName: "ModItemExternal";
    readonly cName: "sym__mod_item_external";
}, {
    readonly name: "_mod_item_inline";
    readonly id: 335;
    readonly enumName: "ModItemInline";
    readonly cName: "sym__mod_item_inline";
}, {
    readonly name: "_range_expression_bare";
    readonly id: 341;
    readonly enumName: "RangeExpressionBare";
    readonly cName: "sym__range_expression_bare";
}, {
    readonly name: "_range_pattern_left_bare";
    readonly id: 344;
    readonly enumName: "RangePatternLeftBare";
    readonly cName: "sym__range_pattern_left_bare";
}, {
    readonly name: "_struct_item_unit";
    readonly id: 347;
    readonly enumName: "StructItemUnit";
    readonly cName: "sym__struct_item_unit";
}, {
    readonly name: "_visibility_modifier_crate";
    readonly id: 348;
    readonly enumName: "VisibilityModifierCrate";
    readonly cName: "sym__visibility_modifier_crate";
}, {
    readonly name: "_pointer_type_const";
    readonly id: 351;
    readonly enumName: "PointerTypeConst";
    readonly cName: "sym__pointer_type_const";
}, {
    readonly name: "_pointer_type_mut";
    readonly id: 352;
    readonly enumName: "PointerTypeMut";
    readonly cName: "sym__pointer_type_mut";
}, {
    readonly name: "_reference_expression_raw_const";
    readonly id: 353;
    readonly enumName: "ReferenceExpressionRawConst";
    readonly cName: "sym__reference_expression_raw_const";
}, {
    readonly name: "_reference_expression_raw_mut";
    readonly id: 354;
    readonly enumName: "ReferenceExpressionRawMut";
    readonly cName: "sym__reference_expression_raw_mut";
}, {
    readonly name: "_expression_statement_with_semi";
    readonly id: 355;
    readonly enumName: "ExpressionStatementWithSemi";
    readonly cName: "sym__expression_statement_with_semi";
}, {
    readonly name: "_expression_statement_block_ending";
    readonly id: 356;
    readonly enumName: "ExpressionStatementBlockEnding";
    readonly cName: "sym__expression_statement_block_ending";
}, {
    readonly name: "_foreign_mod_item_semi";
    readonly id: 357;
    readonly enumName: "ForeignModItemSemi";
    readonly cName: "sym__foreign_mod_item_semi";
}, {
    readonly name: "_foreign_mod_item_body";
    readonly id: 358;
    readonly enumName: "ForeignModItemBody";
    readonly cName: "sym__foreign_mod_item_body";
}, {
    readonly name: "_match_arm_block_ending";
    readonly id: 360;
    readonly enumName: "MatchArmBlockEnding";
    readonly cName: "sym__match_arm_block_ending";
}, {
    readonly name: "_line_comment_regular_dslash";
    readonly id: 361;
    readonly enumName: "LineCommentRegularDslash";
    readonly cName: "sym__line_comment_regular_dslash";
}, {
    readonly name: "_token_tree_pattern_paren";
    readonly id: 363;
    readonly enumName: "TokenTreePatternParen";
    readonly cName: "sym__token_tree_pattern_paren";
}, {
    readonly name: "_token_tree_pattern_bracket";
    readonly id: 364;
    readonly enumName: "TokenTreePatternBracket";
    readonly cName: "sym__token_tree_pattern_bracket";
}, {
    readonly name: "_token_tree_pattern_brace";
    readonly id: 365;
    readonly enumName: "TokenTreePatternBrace";
    readonly cName: "sym__token_tree_pattern_brace";
}, {
    readonly name: "_token_tree_paren";
    readonly id: 366;
    readonly enumName: "TokenTreeParen";
    readonly cName: "sym__token_tree_paren";
}, {
    readonly name: "_token_tree_bracket";
    readonly id: 367;
    readonly enumName: "TokenTreeBracket";
    readonly cName: "sym__token_tree_bracket";
}, {
    readonly name: "_token_tree_brace";
    readonly id: 368;
    readonly enumName: "TokenTreeBrace";
    readonly cName: "sym__token_tree_brace";
}, {
    readonly name: "_delim_token_tree_paren";
    readonly id: 369;
    readonly enumName: "DelimTokenTreeParen";
    readonly cName: "sym__delim_token_tree_paren";
}, {
    readonly name: "_delim_token_tree_bracket";
    readonly id: 370;
    readonly enumName: "DelimTokenTreeBracket";
    readonly cName: "sym__delim_token_tree_bracket";
}, {
    readonly name: "_delim_token_tree_brace";
    readonly id: 371;
    readonly enumName: "DelimTokenTreeBrace";
    readonly cName: "sym__delim_token_tree_brace";
}, {
    readonly name: "_field_identifier";
    readonly id: 404;
    readonly enumName: "AliasFieldIdentifier";
    readonly cName: "alias_sym_field_identifier";
}, {
    readonly name: "_type_identifier";
    readonly id: 407;
    readonly enumName: "AliasTypeIdentifier";
    readonly cName: "alias_sym_type_identifier";
}];
export declare const enum TSFieldId {
    FieldAlias = 1,
    FieldAlternative = 2,
    FieldArgument = 3,
    FieldArguments = 4,
    FieldAsyncMarker = 5,
    FieldAttribute = 6,
    FieldAttributes = 7,
    FieldBlock = 8,
    FieldBody = 9,
    FieldBounds = 10,
    FieldCondition = 11,
    FieldConsequence = 12,
    FieldCrate = 13,
    FieldDefaultType = 14,
    FieldDoc = 15,
    FieldElement = 16,
    FieldElements = 17,
    FieldEnd = 18,
    FieldExpression = 19,
    FieldExternModifier = 20,
    FieldField = 21,
    FieldForLifetimes = 22,
    FieldFunction = 23,
    FieldFunctionModifiers = 24,
    FieldIdentifier = 25,
    FieldIn = 26,
    FieldIndex = 27,
    FieldInner = 28,
    FieldLabel = 29,
    FieldLeft = 30,
    FieldLength = 31,
    FieldLifetime = 32,
    FieldList = 33,
    FieldMacro = 34,
    FieldModifier = 35,
    FieldMoveMarker = 36,
    FieldMutableSpecifier = 37,
    FieldName = 38,
    FieldNegative = 39,
    FieldObject = 40,
    FieldOperand = 41,
    FieldOperator = 42,
    FieldOuter = 43,
    FieldParameters = 44,
    FieldPath = 45,
    FieldPattern = 46,
    FieldPub = 47,
    FieldReference = 50,
    FieldReturnType = 51,
    FieldRight = 52,
    FieldSelf = 53,
    FieldShebang = 54,
    FieldStart = 55,
    FieldStatements = 56,
    FieldStaticMarker = 57,
    FieldStringContent = 58,
    FieldStringLiteral = 59,
    FieldTokenTree = 60,
    FieldTrailingExpression = 61,
    FieldTrait = 62,
    FieldTurbofish = 63,
    FieldType = 64,
    FieldTypeArguments = 65,
    FieldTypeParameters = 66,
    FieldUnsafeMarker = 67,
    FieldValue = 68,
    FieldVisibilityModifier = 69,
    FieldWhereClause = 70
}
export declare const TREE_SITTER_FIELD_ID_BY_NAME: {
    readonly alias: TSFieldId.FieldAlias;
    readonly alternative: TSFieldId.FieldAlternative;
    readonly argument: TSFieldId.FieldArgument;
    readonly arguments: TSFieldId.FieldArguments;
    readonly async_marker: TSFieldId.FieldAsyncMarker;
    readonly attribute: TSFieldId.FieldAttribute;
    readonly attributes: TSFieldId.FieldAttributes;
    readonly block: TSFieldId.FieldBlock;
    readonly body: TSFieldId.FieldBody;
    readonly bounds: TSFieldId.FieldBounds;
    readonly condition: TSFieldId.FieldCondition;
    readonly consequence: TSFieldId.FieldConsequence;
    readonly crate: TSFieldId.FieldCrate;
    readonly default_type: TSFieldId.FieldDefaultType;
    readonly doc: TSFieldId.FieldDoc;
    readonly element: TSFieldId.FieldElement;
    readonly elements: TSFieldId.FieldElements;
    readonly end: TSFieldId.FieldEnd;
    readonly expression: TSFieldId.FieldExpression;
    readonly extern_modifier: TSFieldId.FieldExternModifier;
    readonly field: TSFieldId.FieldField;
    readonly for_lifetimes: TSFieldId.FieldForLifetimes;
    readonly function: TSFieldId.FieldFunction;
    readonly function_modifiers: TSFieldId.FieldFunctionModifiers;
    readonly identifier: TSFieldId.FieldIdentifier;
    readonly in: TSFieldId.FieldIn;
    readonly index: TSFieldId.FieldIndex;
    readonly inner: TSFieldId.FieldInner;
    readonly label: TSFieldId.FieldLabel;
    readonly left: TSFieldId.FieldLeft;
    readonly length: TSFieldId.FieldLength;
    readonly lifetime: TSFieldId.FieldLifetime;
    readonly list: TSFieldId.FieldList;
    readonly macro: TSFieldId.FieldMacro;
    readonly modifier: TSFieldId.FieldModifier;
    readonly move_marker: TSFieldId.FieldMoveMarker;
    readonly mutable_specifier: TSFieldId.FieldMutableSpecifier;
    readonly name: TSFieldId.FieldName;
    readonly negative: TSFieldId.FieldNegative;
    readonly object: TSFieldId.FieldObject;
    readonly operand: TSFieldId.FieldOperand;
    readonly operator: TSFieldId.FieldOperator;
    readonly outer: TSFieldId.FieldOuter;
    readonly parameters: TSFieldId.FieldParameters;
    readonly path: TSFieldId.FieldPath;
    readonly pattern: TSFieldId.FieldPattern;
    readonly pub: TSFieldId.FieldPub;
    readonly reference: TSFieldId.FieldReference;
    readonly return_type: TSFieldId.FieldReturnType;
    readonly right: TSFieldId.FieldRight;
    readonly self: TSFieldId.FieldSelf;
    readonly shebang: TSFieldId.FieldShebang;
    readonly start: TSFieldId.FieldStart;
    readonly statements: TSFieldId.FieldStatements;
    readonly static_marker: TSFieldId.FieldStaticMarker;
    readonly string_content: TSFieldId.FieldStringContent;
    readonly string_literal: TSFieldId.FieldStringLiteral;
    readonly token_tree: TSFieldId.FieldTokenTree;
    readonly trailing_expression: TSFieldId.FieldTrailingExpression;
    readonly trait: TSFieldId.FieldTrait;
    readonly turbofish: TSFieldId.FieldTurbofish;
    readonly type: TSFieldId.FieldType;
    readonly type_arguments: TSFieldId.FieldTypeArguments;
    readonly type_parameters: TSFieldId.FieldTypeParameters;
    readonly unsafe_marker: TSFieldId.FieldUnsafeMarker;
    readonly value: TSFieldId.FieldValue;
    readonly visibility_modifier: TSFieldId.FieldVisibilityModifier;
    readonly where_clause: TSFieldId.FieldWhereClause;
};
export declare const TREE_SITTER_FIELD_NAME_BY_ID: {
    readonly 1: "alias";
    readonly 2: "alternative";
    readonly 3: "argument";
    readonly 4: "arguments";
    readonly 5: "async_marker";
    readonly 6: "attribute";
    readonly 7: "attributes";
    readonly 8: "block";
    readonly 9: "body";
    readonly 10: "bounds";
    readonly 11: "condition";
    readonly 12: "consequence";
    readonly 13: "crate";
    readonly 14: "default_type";
    readonly 15: "doc";
    readonly 16: "element";
    readonly 17: "elements";
    readonly 18: "end";
    readonly 19: "expression";
    readonly 20: "extern_modifier";
    readonly 21: "field";
    readonly 22: "for_lifetimes";
    readonly 23: "function";
    readonly 24: "function_modifiers";
    readonly 25: "identifier";
    readonly 26: "in";
    readonly 27: "index";
    readonly 28: "inner";
    readonly 29: "label";
    readonly 30: "left";
    readonly 31: "length";
    readonly 32: "lifetime";
    readonly 33: "list";
    readonly 34: "macro";
    readonly 35: "modifier";
    readonly 36: "move_marker";
    readonly 37: "mutable_specifier";
    readonly 38: "name";
    readonly 39: "negative";
    readonly 40: "object";
    readonly 41: "operand";
    readonly 42: "operator";
    readonly 43: "outer";
    readonly 44: "parameters";
    readonly 45: "path";
    readonly 46: "pattern";
    readonly 47: "pub";
    readonly 50: "reference";
    readonly 51: "return_type";
    readonly 52: "right";
    readonly 53: "self";
    readonly 54: "shebang";
    readonly 55: "start";
    readonly 56: "statements";
    readonly 57: "static_marker";
    readonly 58: "string_content";
    readonly 59: "string_literal";
    readonly 60: "token_tree";
    readonly 61: "trailing_expression";
    readonly 62: "trait";
    readonly 63: "turbofish";
    readonly 64: "type";
    readonly 65: "type_arguments";
    readonly 66: "type_parameters";
    readonly 67: "unsafe_marker";
    readonly 68: "value";
    readonly 69: "visibility_modifier";
    readonly 70: "where_clause";
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
    readonly name: "attributes";
    readonly id: 7;
    readonly enumName: "FieldAttributes";
    readonly cName: "field_attributes";
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
    readonly name: "bounds";
    readonly id: 10;
    readonly enumName: "FieldBounds";
    readonly cName: "field_bounds";
}, {
    readonly name: "condition";
    readonly id: 11;
    readonly enumName: "FieldCondition";
    readonly cName: "field_condition";
}, {
    readonly name: "consequence";
    readonly id: 12;
    readonly enumName: "FieldConsequence";
    readonly cName: "field_consequence";
}, {
    readonly name: "crate";
    readonly id: 13;
    readonly enumName: "FieldCrate";
    readonly cName: "field_crate";
}, {
    readonly name: "default_type";
    readonly id: 14;
    readonly enumName: "FieldDefaultType";
    readonly cName: "field_default_type";
}, {
    readonly name: "doc";
    readonly id: 15;
    readonly enumName: "FieldDoc";
    readonly cName: "field_doc";
}, {
    readonly name: "element";
    readonly id: 16;
    readonly enumName: "FieldElement";
    readonly cName: "field_element";
}, {
    readonly name: "elements";
    readonly id: 17;
    readonly enumName: "FieldElements";
    readonly cName: "field_elements";
}, {
    readonly name: "end";
    readonly id: 18;
    readonly enumName: "FieldEnd";
    readonly cName: "field_end";
}, {
    readonly name: "expression";
    readonly id: 19;
    readonly enumName: "FieldExpression";
    readonly cName: "field_expression";
}, {
    readonly name: "extern_modifier";
    readonly id: 20;
    readonly enumName: "FieldExternModifier";
    readonly cName: "field_extern_modifier";
}, {
    readonly name: "field";
    readonly id: 21;
    readonly enumName: "FieldField";
    readonly cName: "field_field";
}, {
    readonly name: "for_lifetimes";
    readonly id: 22;
    readonly enumName: "FieldForLifetimes";
    readonly cName: "field_for_lifetimes";
}, {
    readonly name: "function";
    readonly id: 23;
    readonly enumName: "FieldFunction";
    readonly cName: "field_function";
}, {
    readonly name: "function_modifiers";
    readonly id: 24;
    readonly enumName: "FieldFunctionModifiers";
    readonly cName: "field_function_modifiers";
}, {
    readonly name: "identifier";
    readonly id: 25;
    readonly enumName: "FieldIdentifier";
    readonly cName: "field_identifier";
}, {
    readonly name: "in";
    readonly id: 26;
    readonly enumName: "FieldIn";
    readonly cName: "field_in";
}, {
    readonly name: "index";
    readonly id: 27;
    readonly enumName: "FieldIndex";
    readonly cName: "field_index";
}, {
    readonly name: "inner";
    readonly id: 28;
    readonly enumName: "FieldInner";
    readonly cName: "field_inner";
}, {
    readonly name: "label";
    readonly id: 29;
    readonly enumName: "FieldLabel";
    readonly cName: "field_label";
}, {
    readonly name: "left";
    readonly id: 30;
    readonly enumName: "FieldLeft";
    readonly cName: "field_left";
}, {
    readonly name: "length";
    readonly id: 31;
    readonly enumName: "FieldLength";
    readonly cName: "field_length";
}, {
    readonly name: "lifetime";
    readonly id: 32;
    readonly enumName: "FieldLifetime";
    readonly cName: "field_lifetime";
}, {
    readonly name: "list";
    readonly id: 33;
    readonly enumName: "FieldList";
    readonly cName: "field_list";
}, {
    readonly name: "macro";
    readonly id: 34;
    readonly enumName: "FieldMacro";
    readonly cName: "field_macro";
}, {
    readonly name: "modifier";
    readonly id: 35;
    readonly enumName: "FieldModifier";
    readonly cName: "field_modifier";
}, {
    readonly name: "move_marker";
    readonly id: 36;
    readonly enumName: "FieldMoveMarker";
    readonly cName: "field_move_marker";
}, {
    readonly name: "mutable_specifier";
    readonly id: 37;
    readonly enumName: "FieldMutableSpecifier";
    readonly cName: "field_mutable_specifier";
}, {
    readonly name: "name";
    readonly id: 38;
    readonly enumName: "FieldName";
    readonly cName: "field_name";
}, {
    readonly name: "negative";
    readonly id: 39;
    readonly enumName: "FieldNegative";
    readonly cName: "field_negative";
}, {
    readonly name: "object";
    readonly id: 40;
    readonly enumName: "FieldObject";
    readonly cName: "field_object";
}, {
    readonly name: "operand";
    readonly id: 41;
    readonly enumName: "FieldOperand";
    readonly cName: "field_operand";
}, {
    readonly name: "operator";
    readonly id: 42;
    readonly enumName: "FieldOperator";
    readonly cName: "field_operator";
}, {
    readonly name: "outer";
    readonly id: 43;
    readonly enumName: "FieldOuter";
    readonly cName: "field_outer";
}, {
    readonly name: "parameters";
    readonly id: 44;
    readonly enumName: "FieldParameters";
    readonly cName: "field_parameters";
}, {
    readonly name: "path";
    readonly id: 45;
    readonly enumName: "FieldPath";
    readonly cName: "field_path";
}, {
    readonly name: "pattern";
    readonly id: 46;
    readonly enumName: "FieldPattern";
    readonly cName: "field_pattern";
}, {
    readonly name: "pub";
    readonly id: 47;
    readonly enumName: "FieldPub";
    readonly cName: "field_pub";
}, {
    readonly name: "reference";
    readonly id: 50;
    readonly enumName: "FieldReference";
    readonly cName: "field_reference";
}, {
    readonly name: "return_type";
    readonly id: 51;
    readonly enumName: "FieldReturnType";
    readonly cName: "field_return_type";
}, {
    readonly name: "right";
    readonly id: 52;
    readonly enumName: "FieldRight";
    readonly cName: "field_right";
}, {
    readonly name: "self";
    readonly id: 53;
    readonly enumName: "FieldSelf";
    readonly cName: "field_self";
}, {
    readonly name: "shebang";
    readonly id: 54;
    readonly enumName: "FieldShebang";
    readonly cName: "field_shebang";
}, {
    readonly name: "start";
    readonly id: 55;
    readonly enumName: "FieldStart";
    readonly cName: "field_start";
}, {
    readonly name: "statements";
    readonly id: 56;
    readonly enumName: "FieldStatements";
    readonly cName: "field_statements";
}, {
    readonly name: "static_marker";
    readonly id: 57;
    readonly enumName: "FieldStaticMarker";
    readonly cName: "field_static_marker";
}, {
    readonly name: "string_content";
    readonly id: 58;
    readonly enumName: "FieldStringContent";
    readonly cName: "field_string_content";
}, {
    readonly name: "string_literal";
    readonly id: 59;
    readonly enumName: "FieldStringLiteral";
    readonly cName: "field_string_literal";
}, {
    readonly name: "token_tree";
    readonly id: 60;
    readonly enumName: "FieldTokenTree";
    readonly cName: "field_token_tree";
}, {
    readonly name: "trailing_expression";
    readonly id: 61;
    readonly enumName: "FieldTrailingExpression";
    readonly cName: "field_trailing_expression";
}, {
    readonly name: "trait";
    readonly id: 62;
    readonly enumName: "FieldTrait";
    readonly cName: "field_trait";
}, {
    readonly name: "turbofish";
    readonly id: 63;
    readonly enumName: "FieldTurbofish";
    readonly cName: "field_turbofish";
}, {
    readonly name: "type";
    readonly id: 64;
    readonly enumName: "FieldType";
    readonly cName: "field_type";
}, {
    readonly name: "type_arguments";
    readonly id: 65;
    readonly enumName: "FieldTypeArguments";
    readonly cName: "field_type_arguments";
}, {
    readonly name: "type_parameters";
    readonly id: 66;
    readonly enumName: "FieldTypeParameters";
    readonly cName: "field_type_parameters";
}, {
    readonly name: "unsafe_marker";
    readonly id: 67;
    readonly enumName: "FieldUnsafeMarker";
    readonly cName: "field_unsafe_marker";
}, {
    readonly name: "value";
    readonly id: 68;
    readonly enumName: "FieldValue";
    readonly cName: "field_value";
}, {
    readonly name: "visibility_modifier";
    readonly id: 69;
    readonly enumName: "FieldVisibilityModifier";
    readonly cName: "field_visibility_modifier";
}, {
    readonly name: "where_clause";
    readonly id: 70;
    readonly enumName: "FieldWhereClause";
    readonly cName: "field_where_clause";
}];
/** Per-node-kind field metadata. */
export declare const FIELD_MAP: Record<NodeKind, ReadonlyArray<{
    name: string;
    required: boolean;
    multiple: boolean;
}>>;
/** Valid values for `__range_expression_binary_operator` nodes. */
export declare const __RANGE_EXPRESSION_BINARY_OPERATORS: readonly ['..', '...', '..='];
export type RangeExpressionBinaryOperatorValue = (typeof __RANGE_EXPRESSION_BINARY_OPERATORS)[number];
/** Valid values for `_compound_assignment_expr_operator` nodes. */
export declare const _COMPOUND_ASSIGNMENT_EXPR_OPERATORS: readonly ['+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='];
export type CompoundAssignmentExprOperatorValue = (typeof _COMPOUND_ASSIGNMENT_EXPR_OPERATORS)[number];
/** Valid values for `_primitive_type` nodes. */
export declare const _PRIMITIVE_TYPES: readonly ['u8', 'i8', 'u16', 'i16', 'u32', 'i32', 'u64', 'i64', 'u128', 'i128', 'isize', 'usize', 'f32', 'f64', 'bool', 'str', 'char'];
export type PrimitiveTypeValue = (typeof _PRIMITIVE_TYPES)[number];
/** Valid values for `_reserved_identifier` nodes. */
export declare const _RESERVED_IDENTIFIERS: readonly ['default', 'union', 'gen'];
export type ReservedIdentifierValue = (typeof _RESERVED_IDENTIFIERS)[number];
/** Valid values for `_token_binding_pattern_type` nodes. */
export declare const _TOKEN_BINDING_PATTERN_TYPES: readonly ['block', 'expr', 'expr_2021', 'ident', 'item', 'lifetime', 'literal', 'meta', 'pat', 'pat_param', 'path', 'stmt', 'tt', 'ty', 'vis'];
export type TokenBindingPatternTypeValue = (typeof _TOKEN_BINDING_PATTERN_TYPES)[number];
/** Valid values for `_unary_expression_operator` nodes. */
export declare const _UNARY_EXPRESSION_OPERATORS: readonly ['-', '*', '!'];
export type UnaryExpressionOperatorValue = (typeof _UNARY_EXPRESSION_OPERATORS)[number];
/** Valid values for `boolean_literal` nodes. */
export declare const BOOLEAN_LITERALS: readonly ['true', 'false'];
export type BooleanLiteralValue = (typeof BOOLEAN_LITERALS)[number];
/** Valid values for `fragment_specifier` nodes. */
export declare const FRAGMENT_SPECIFIERS: readonly ['block', 'expr', 'expr_2021', 'ident', 'item', 'lifetime', 'literal', 'meta', 'pat', 'pat_param', 'path', 'stmt', 'tt', 'ty', 'vis'];
export type FragmentSpecifierValue = (typeof FRAGMENT_SPECIFIERS)[number];
//# sourceMappingURL=consts.d.ts.map
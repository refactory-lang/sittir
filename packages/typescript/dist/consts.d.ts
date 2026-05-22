/** All branch (non-leaf) node kind strings. */
export declare const NODE_KINDS: readonly ['_ambient_declaration_declaration', '_arrow_function__call_signature', '_arrow_function_parameter', '_class_body_member', '_class_body_method_sig', '_class_heritage_extends_clause', '_class_heritage_implements_clause', '_export_statement_default_from_arm', '_export_statement_default_from_arm_clause_from', '_export_statement_default_from_arm_ns_from', '_export_statement_default_from_arm_star_from', '_export_statement_equals_export', '_export_statement_namespace_export', '_export_statement_type_export', '_for_header_lhs', '_import_clause_default_import', '_import_clause_named_imports', '_import_clause_namespace_import', '_import_specifier_name', '_index_signature_mapped_type_clause', '_jsx_string', '_lhs_expression', '_parenthesized_expression_sequence', '_public_field_definition_accessor_opt', '_public_field_definition_declare_first', 'abstract_class_declaration', 'abstract_method_signature', 'adding_type_annotation', 'ambient_declaration', 'ambient_declaration_declaration', 'arguments', 'array', 'array_pattern', 'array_type', 'arrow_function', 'arrow_function__call_signature', 'arrow_function_parameter', 'as_expression', 'asserts', 'asserts_annotation', 'assignment_expression', 'assignment_pattern', 'augmented_assignment_expression', 'await_expression', 'binary_expression', 'break_statement', 'call_expression', 'call_signature', 'catch_clause', 'class', 'class_body', 'class_declaration', 'class_heritage', 'class_heritage_extends_clause', 'class_heritage_implements_clause', 'class_static_block', 'computed_property_name', 'conditional_type', 'constraint', 'construct_signature', 'constructor_type', 'continue_statement', 'debugger_statement', 'decorator', 'decorator_call_expression', 'decorator_member_expression', 'decorator_parenthesized_expression', 'default_type', 'do_statement', 'else_clause', 'enum_assignment', 'enum_body', 'enum_declaration', 'export_clause', 'export_specifier', 'export_statement', 'export_statement_equals_export', 'export_statement_namespace_export', 'export_statement_type_export', 'expression_statement', 'extends_clause', 'extends_type_clause', 'field_definition', 'finally_clause', 'flow_maybe_type', 'for_in_statement', 'for_statement', 'formal_parameters', 'function_declaration', 'function_expression', 'function_signature', 'function_type', 'generator_function', 'generator_function_declaration', 'generic_type', 'if_statement', 'implements_clause', 'import_alias', 'import_attribute', 'import_clause', 'import_clause_default_import', 'import_clause_named_imports', 'import_clause_namespace_import', 'import_require_clause', 'import_specifier', 'import_specifier_name', 'import_statement', 'index_signature', 'index_signature_mapped_type_clause', 'index_type_query', 'infer_type', 'instantiation_expression', 'interface_declaration', 'internal_module', 'intersection_type', 'jsx_attribute', 'jsx_closing_element', 'jsx_element', 'jsx_expression', 'jsx_namespace_name', 'jsx_opening_element', 'jsx_self_closing_element', 'labeled_statement', 'lexical_declaration', 'literal_type', 'lookup_type', 'mapped_type_clause', 'member_expression', 'method_definition', 'method_signature', 'module', 'named_imports', 'namespace_export', 'namespace_import', 'nested_identifier', 'nested_type_identifier', 'new_expression', 'non_null_expression', 'object', 'object_assignment_pattern', 'object_pattern', 'object_type', 'omitting_type_annotation', 'opting_type_annotation', 'optional_parameter', 'optional_tuple_parameter', 'optional_type', 'pair', 'pair_pattern', 'parenthesized_expression', 'parenthesized_expression_sequence', 'parenthesized_type', 'program', 'property_signature', 'public_field_definition', 'readonly_type', 'regex', 'required_parameter', 'rest_pattern', 'rest_type', 'return_statement', 'satisfies_expression', 'sequence_expression', 'spread_element', 'statement_block', 'string', 'subscript_expression', 'switch_body', 'switch_case', 'switch_default', 'switch_statement', 'template_literal_type', 'template_string', 'template_substitution', 'template_type', 'ternary_expression', 'throw_statement', 'try_statement', 'tuple_parameter', 'tuple_type', 'type_alias_declaration', 'type_annotation', 'type_arguments', 'type_assertion', 'type_parameter', 'type_parameters', 'type_predicate', 'type_predicate_annotation', 'type_query', 'unary_expression', 'union_type', 'update_expression', 'variable_declaration', 'variable_declarator', 'while_statement', 'with_statement', 'yield_expression'];
/** All leaf/terminal node kind strings. */
export declare const LEAF_KINDS: readonly ['__error_recovery', '__for_header_operator', '__number_operator', '_abstract_marker', '_accessibility_modifier', '_accessor_kind', '_async_marker', '_augmented_assignment_expression_operator', '_automatic_semicolon', '_const_marker', '_export_specifier_export_kind', '_function_signature_automatic_semicolon', '_import_attribute_object', '_kind', '_kw_abstract_marker', '_kw_accessor_marker', '_kw_async_marker', '_kw_await_marker', '_kw_const_marker', '_kw_declare_marker', '_kw_readonly_marker', '_kw_static_marker', '_kw_using_marker', '_object_type_closing', '_object_type_opening', '_operator', '_override_modifier', '_public_field_definition_optionality_marker', '_readonly_marker', '_reserved_identifier', '_static_marker', '_string_opening', '_template_chars', '_ternary_qmark', '_type_identifier', '_unary_expression_operator', 'abstract', 'accessibility_modifier', 'accessor', 'as', 'async', 'await', 'break', 'case', 'catch', 'comment', 'const', 'continue', 'debugger', 'declare', 'default', 'do', 'else', 'enum', 'escape_sequence', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'global', 'hash_bang_line', 'html_character_reference', 'html_comment', 'identifier', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is', 'jsx_identifier', 'jsx_text', 'keyof', 'meta_property', 'namespace', 'new', 'null', 'number', 'override', 'override_modifier', 'predefined_type', 'private_property_identifier', 'readonly', 'regex_flags', 'regex_pattern', 'require', 'return', 'satisfies', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'unescaped_double_jsx_string_fragment', 'unescaped_double_string_fragment', 'unescaped_single_jsx_string_fragment', 'unescaped_single_string_fragment', 'using', 'var', 'while', 'with', 'yield', '||'];
/** All node kind strings (branch + leaf). */
export declare const ALL_KINDS: readonly ["_ambient_declaration_declaration", "_arrow_function__call_signature", "_arrow_function_parameter", "_class_body_member", "_class_body_method_sig", "_class_heritage_extends_clause", "_class_heritage_implements_clause", "_export_statement_default_from_arm", "_export_statement_default_from_arm_clause_from", "_export_statement_default_from_arm_ns_from", "_export_statement_default_from_arm_star_from", "_export_statement_equals_export", "_export_statement_namespace_export", "_export_statement_type_export", "_for_header_lhs", "_import_clause_default_import", "_import_clause_named_imports", "_import_clause_namespace_import", "_import_specifier_name", "_index_signature_mapped_type_clause", "_jsx_string", "_lhs_expression", "_parenthesized_expression_sequence", "_public_field_definition_accessor_opt", "_public_field_definition_declare_first", "abstract_class_declaration", "abstract_method_signature", "adding_type_annotation", "ambient_declaration", "ambient_declaration_declaration", "arguments", "array", "array_pattern", "array_type", "arrow_function", "arrow_function__call_signature", "arrow_function_parameter", "as_expression", "asserts", "asserts_annotation", "assignment_expression", "assignment_pattern", "augmented_assignment_expression", "await_expression", "binary_expression", "break_statement", "call_expression", "call_signature", "catch_clause", "class", "class_body", "class_declaration", "class_heritage", "class_heritage_extends_clause", "class_heritage_implements_clause", "class_static_block", "computed_property_name", "conditional_type", "constraint", "construct_signature", "constructor_type", "continue_statement", "debugger_statement", "decorator", "decorator_call_expression", "decorator_member_expression", "decorator_parenthesized_expression", "default_type", "do_statement", "else_clause", "enum_assignment", "enum_body", "enum_declaration", "export_clause", "export_specifier", "export_statement", "export_statement_equals_export", "export_statement_namespace_export", "export_statement_type_export", "expression_statement", "extends_clause", "extends_type_clause", "field_definition", "finally_clause", "flow_maybe_type", "for_in_statement", "for_statement", "formal_parameters", "function_declaration", "function_expression", "function_signature", "function_type", "generator_function", "generator_function_declaration", "generic_type", "if_statement", "implements_clause", "import_alias", "import_attribute", "import_clause", "import_clause_default_import", "import_clause_named_imports", "import_clause_namespace_import", "import_require_clause", "import_specifier", "import_specifier_name", "import_statement", "index_signature", "index_signature_mapped_type_clause", "index_type_query", "infer_type", "instantiation_expression", "interface_declaration", "internal_module", "intersection_type", "jsx_attribute", "jsx_closing_element", "jsx_element", "jsx_expression", "jsx_namespace_name", "jsx_opening_element", "jsx_self_closing_element", "labeled_statement", "lexical_declaration", "literal_type", "lookup_type", "mapped_type_clause", "member_expression", "method_definition", "method_signature", "module", "named_imports", "namespace_export", "namespace_import", "nested_identifier", "nested_type_identifier", "new_expression", "non_null_expression", "object", "object_assignment_pattern", "object_pattern", "object_type", "omitting_type_annotation", "opting_type_annotation", "optional_parameter", "optional_tuple_parameter", "optional_type", "pair", "pair_pattern", "parenthesized_expression", "parenthesized_expression_sequence", "parenthesized_type", "program", "property_signature", "public_field_definition", "readonly_type", "regex", "required_parameter", "rest_pattern", "rest_type", "return_statement", "satisfies_expression", "sequence_expression", "spread_element", "statement_block", "string", "subscript_expression", "switch_body", "switch_case", "switch_default", "switch_statement", "template_literal_type", "template_string", "template_substitution", "template_type", "ternary_expression", "throw_statement", "try_statement", "tuple_parameter", "tuple_type", "type_alias_declaration", "type_annotation", "type_arguments", "type_assertion", "type_parameter", "type_parameters", "type_predicate", "type_predicate_annotation", "type_query", "unary_expression", "union_type", "update_expression", "variable_declaration", "variable_declarator", "while_statement", "with_statement", "yield_expression", "__error_recovery", "__for_header_operator", "__number_operator", "_abstract_marker", "_accessibility_modifier", "_accessor_kind", "_async_marker", "_augmented_assignment_expression_operator", "_automatic_semicolon", "_const_marker", "_export_specifier_export_kind", "_function_signature_automatic_semicolon", "_import_attribute_object", "_kind", "_kw_abstract_marker", "_kw_accessor_marker", "_kw_async_marker", "_kw_await_marker", "_kw_const_marker", "_kw_declare_marker", "_kw_readonly_marker", "_kw_static_marker", "_kw_using_marker", "_object_type_closing", "_object_type_opening", "_operator", "_override_modifier", "_public_field_definition_optionality_marker", "_readonly_marker", "_reserved_identifier", "_static_marker", "_string_opening", "_template_chars", "_ternary_qmark", "_type_identifier", "_unary_expression_operator", "abstract", "accessibility_modifier", "accessor", "as", "async", "await", "break", "case", "catch", "comment", "const", "continue", "debugger", "declare", "default", "do", "else", "enum", "escape_sequence", "export", "extends", "false", "finally", "for", "from", "function", "global", "hash_bang_line", "html_character_reference", "html_comment", "identifier", "if", "implements", "import", "in", "infer", "instanceof", "interface", "is", "jsx_identifier", "jsx_text", "keyof", "meta_property", "namespace", "new", "null", "number", "override", "override_modifier", "predefined_type", "private_property_identifier", "readonly", "regex_flags", "regex_pattern", "require", "return", "satisfies", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "unescaped_double_jsx_string_fragment", "unescaped_double_string_fragment", "unescaped_single_jsx_string_fragment", "unescaped_single_string_fragment", "using", "var", "while", "with", "yield", "||"];
/** Language keywords (alphabetic anonymous tokens). */
export declare const KEYWORDS: readonly ['_abstract_marker', '_asserts_annotation_asserts', '_async_marker', '_const_marker', '_kw_abstract_marker', '_kw_accessor_marker', '_kw_asserts', '_kw_async_marker', '_kw_await_marker', '_kw_const_marker', '_kw_declare_marker', '_kw_optional_marker', '_kw_readonly_marker', '_kw_static_marker', '_kw_type_predicate', '_kw_using_marker', '_optional_chain', '_optional_marker', '_override_modifier', '_readonly_marker', '_static_marker', 'abstract', 'accessor', 'amp', 'amp_amp', 'as', 'async', 'await', 'bang_eq', 'bang_eq_eq', 'break', 'caret', 'case', 'catch', 'const', 'continue', 'dash', 'debugger', 'declare', 'default', 'do', 'else', 'empty_statement', 'enum', 'eq_eq', 'eq_eq_eq', 'existential_type', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'global', 'gt', 'gt_eq', 'gt_gt', 'gt_gt_gt', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is', 'keyof', 'lt', 'lt_eq', 'lt_lt', 'namespace', 'new', 'null', 'optional_chain', 'override', 'override_modifier', 'percent', 'pipe', 'pipe_pipe', 'plus', 'qmark_qmark', 'readonly', 'require', 'return', 'satisfies', 'slash', 'star', 'star_star', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'using', 'var', 'while', 'with', 'yield'];
/** Operator/punctuation tokens. */
export declare const OPERATORS: readonly ["!", "\"", "${", "&", "'", "(", ")", "*", "+?:", ",", "-?:", ".", "...", "/", "/>", ":", ";", "<", "</", "=", "=>", ">", "?", "?.", "?:", "@", "[", "]", "`", "{", "|", "}"];
export type NodeKind = (typeof NODE_KINDS)[number];
export type LeafKind = (typeof LEAF_KINDS)[number];
export type AnyKind = (typeof ALL_KINDS)[number];
export type Keyword = (typeof KEYWORDS)[number];
export type AnyOperator = (typeof OPERATORS)[number];
/** Tree-sitter numeric IDs from the generated parser artifact. */
export declare const TREE_SITTER_ID_SOURCE = "packages/typescript/.sittir/src/parser.c";
export declare const TREE_SITTER_KIND_ID_BY_KIND: {
    readonly identifier: 1;
    readonly hash_bang_line: 2;
    readonly star: 3;
    readonly as: 4;
    readonly typeof: 9;
    readonly from: 11;
    readonly with: 12;
    readonly var: 14;
    readonly const: 16;
    readonly else: 18;
    readonly if: 19;
    readonly switch: 20;
    readonly for: 21;
    readonly await: 25;
    readonly in: 26;
    readonly while: 28;
    readonly do: 29;
    readonly try: 30;
    readonly break: 31;
    readonly continue: 32;
    readonly debugger: 33;
    readonly return: 34;
    readonly throw: 35;
    readonly case: 37;
    readonly default: 38;
    readonly catch: 39;
    readonly finally: 40;
    readonly yield: 41;
    readonly function: 47;
    readonly async: 48;
    readonly new: 51;
    readonly amp_amp: 68;
    readonly pipe_pipe: 69;
    readonly gt_gt: 70;
    readonly gt_gt_gt: 71;
    readonly lt_lt: 72;
    readonly amp: 73;
    readonly caret: 74;
    readonly pipe: 75;
    readonly plus: 76;
    readonly dash: 77;
    readonly slash: 78;
    readonly percent: 79;
    readonly star_star: 80;
    readonly lt: 81;
    readonly lt_eq: 82;
    readonly eq_eq: 83;
    readonly eq_eq_eq: 84;
    readonly bang_eq: 85;
    readonly bang_eq_eq: 86;
    readonly gt_eq: 87;
    readonly gt: 88;
    readonly qmark_qmark: 89;
    readonly instanceof: 90;
    readonly unescaped_double_string_fragment: 96;
    readonly unescaped_single_string_fragment: 97;
    readonly escape_sequence: 98;
    readonly comment: 99;
    readonly regex_pattern: 103;
    readonly regex_flags: 104;
    readonly number: 105;
    readonly private_property_identifier: 106;
    readonly this: 109;
    readonly super: 110;
    readonly true: 111;
    readonly false: 112;
    readonly null: 113;
    readonly undefined: 114;
    readonly static: 116;
    readonly declare: 119;
    readonly namespace: 120;
    readonly override: 124;
    readonly readonly: 125;
    readonly export: 132;
    readonly abstract: 135;
    readonly satisfies: 136;
    readonly require: 137;
    readonly extends: 138;
    readonly implements: 139;
    readonly interface: 140;
    readonly enum: 141;
    readonly infer: 146;
    readonly is: 147;
    readonly keyof: 148;
    readonly global: 154;
    readonly accessor: 155;
    readonly using: 156;
    readonly _automatic_semicolon: 159;
    readonly _template_chars: 160;
    readonly _ternary_qmark: 161;
    readonly html_comment: 162;
    readonly jsx_text: 163;
    readonly _function_signature_automatic_semicolon: 164;
    readonly __error_recovery: 165;
    readonly program: 166;
    readonly export_statement: 167;
    readonly namespace_export: 168;
    readonly export_clause: 169;
    readonly export_specifier: 170;
    readonly import: 173;
    readonly import_statement: 174;
    readonly import_clause: 175;
    readonly namespace_import: 177;
    readonly named_imports: 178;
    readonly import_specifier: 179;
    readonly import_attribute: 180;
    readonly expression_statement: 182;
    readonly variable_declaration: 183;
    readonly lexical_declaration: 184;
    readonly variable_declarator: 185;
    readonly statement_block: 186;
    readonly else_clause: 187;
    readonly if_statement: 188;
    readonly switch_statement: 189;
    readonly for_statement: 190;
    readonly for_in_statement: 191;
    readonly while_statement: 193;
    readonly do_statement: 194;
    readonly try_statement: 195;
    readonly with_statement: 196;
    readonly break_statement: 197;
    readonly continue_statement: 198;
    readonly debugger_statement: 199;
    readonly return_statement: 200;
    readonly throw_statement: 201;
    readonly empty_statement: 202;
    readonly labeled_statement: 203;
    readonly switch_body: 204;
    readonly switch_case: 205;
    readonly switch_default: 206;
    readonly catch_clause: 207;
    readonly finally_clause: 208;
    readonly parenthesized_expression: 209;
    readonly yield_expression: 212;
    readonly object: 213;
    readonly object_pattern: 214;
    readonly assignment_pattern: 215;
    readonly object_assignment_pattern: 216;
    readonly array: 217;
    readonly array_pattern: 218;
    readonly nested_identifier: 219;
    readonly class: 220;
    readonly class_declaration: 221;
    readonly class_heritage: 222;
    readonly function_expression: 223;
    readonly function_declaration: 224;
    readonly generator_function: 225;
    readonly generator_function_declaration: 226;
    readonly arrow_function: 227;
    readonly optional_chain: 230;
    readonly call_expression: 231;
    readonly new_expression: 232;
    readonly await_expression: 233;
    readonly member_expression: 234;
    readonly subscript_expression: 235;
    readonly assignment_expression: 236;
    readonly augmented_assignment_expression: 238;
    readonly spread_element: 241;
    readonly ternary_expression: 242;
    readonly binary_expression: 243;
    readonly unary_expression: 244;
    readonly update_expression: 245;
    readonly sequence_expression: 246;
    readonly string: 247;
    readonly template_string: 248;
    readonly template_substitution: 249;
    readonly regex: 250;
    readonly meta_property: 251;
    readonly arguments: 252;
    readonly decorator: 253;
    readonly decorator_member_expression: 254;
    readonly decorator_call_expression: 255;
    readonly class_body: 256;
    readonly formal_parameters: 257;
    readonly class_static_block: 258;
    readonly rest_pattern: 260;
    readonly method_definition: 261;
    readonly pair: 262;
    readonly pair_pattern: 263;
    readonly computed_property_name: 265;
    readonly public_field_definition: 266;
    readonly non_null_expression: 268;
    readonly method_signature: 269;
    readonly abstract_method_signature: 270;
    readonly function_signature: 271;
    readonly decorator_parenthesized_expression: 272;
    readonly type_assertion: 273;
    readonly as_expression: 274;
    readonly satisfies_expression: 275;
    readonly instantiation_expression: 276;
    readonly import_require_clause: 277;
    readonly extends_clause: 278;
    readonly implements_clause: 280;
    readonly ambient_declaration: 281;
    readonly abstract_class_declaration: 282;
    readonly module: 283;
    readonly internal_module: 284;
    readonly import_alias: 286;
    readonly nested_type_identifier: 287;
    readonly interface_declaration: 288;
    readonly extends_type_clause: 289;
    readonly enum_declaration: 290;
    readonly enum_body: 291;
    readonly enum_assignment: 292;
    readonly type_alias_declaration: 293;
    readonly accessibility_modifier: 294;
    readonly override_modifier: 295;
    readonly required_parameter: 296;
    readonly optional_parameter: 297;
    readonly omitting_type_annotation: 299;
    readonly adding_type_annotation: 300;
    readonly opting_type_annotation: 301;
    readonly type_annotation: 302;
    readonly asserts: 305;
    readonly asserts_annotation: 306;
    readonly tuple_parameter: 308;
    readonly optional_tuple_parameter: 309;
    readonly optional_type: 310;
    readonly rest_type: 311;
    readonly constructor_type: 313;
    readonly template_type: 315;
    readonly template_literal_type: 316;
    readonly infer_type: 317;
    readonly conditional_type: 318;
    readonly generic_type: 319;
    readonly type_predicate: 320;
    readonly type_predicate_annotation: 321;
    readonly type_query: 326;
    readonly index_type_query: 327;
    readonly lookup_type: 328;
    readonly mapped_type_clause: 329;
    readonly literal_type: 330;
    readonly existential_type: 332;
    readonly flow_maybe_type: 333;
    readonly parenthesized_type: 334;
    readonly predefined_type: 335;
    readonly type_arguments: 336;
    readonly object_type: 337;
    readonly call_signature: 338;
    readonly property_signature: 339;
    readonly type_parameters: 340;
    readonly type_parameter: 341;
    readonly default_type: 342;
    readonly constraint: 343;
    readonly construct_signature: 344;
    readonly index_signature: 345;
    readonly array_type: 346;
    readonly tuple_type: 347;
    readonly readonly_type: 348;
    readonly union_type: 349;
    readonly intersection_type: 350;
    readonly function_type: 351;
    readonly _export_statement_default_from_arm: 355;
    readonly _arrow_function_parameter: 358;
    readonly _arrow_function__call_signature: 359;
    readonly _class_heritage_extends_clause: 360;
    readonly _class_heritage_implements_clause: 361;
    readonly _import_clause_namespace_import: 362;
    readonly _import_clause_named_imports: 363;
    readonly _import_clause_default_import: 364;
    readonly _import_specifier_name: 365;
    readonly _index_signature_mapped_type_clause: 368;
    readonly _ambient_declaration_declaration: 369;
    readonly _export_statement_default_from_arm_star_from: 370;
    readonly _export_statement_default_from_arm_ns_from: 371;
    readonly _export_statement_default_from_arm_clause_from: 372;
    readonly _class_body_method_sig: 375;
    readonly _class_body_member: 376;
    readonly _for_header_lhs: 377;
    readonly _parenthesized_expression_sequence: 381;
    readonly _export_statement_type_export: 382;
    readonly _export_statement_equals_export: 383;
    readonly _export_statement_namespace_export: 384;
    readonly _public_field_definition_accessor_opt: 418;
    readonly _public_field_definition_declare_first: 419;
    readonly _type_identifier: 426;
};
export declare const TREE_SITTER_KIND_BY_KIND_ID: {
    readonly [1]: "identifier";
    readonly [2]: "hash_bang_line";
    readonly [3]: "star";
    readonly [4]: "as";
    readonly [9]: "typeof";
    readonly [11]: "from";
    readonly [12]: "with";
    readonly [14]: "var";
    readonly [16]: "const";
    readonly [18]: "else";
    readonly [19]: "if";
    readonly [20]: "switch";
    readonly [21]: "for";
    readonly [25]: "await";
    readonly [26]: "in";
    readonly [28]: "while";
    readonly [29]: "do";
    readonly [30]: "try";
    readonly [31]: "break";
    readonly [32]: "continue";
    readonly [33]: "debugger";
    readonly [34]: "return";
    readonly [35]: "throw";
    readonly [37]: "case";
    readonly [38]: "default";
    readonly [39]: "catch";
    readonly [40]: "finally";
    readonly [41]: "yield";
    readonly [47]: "function";
    readonly [48]: "async";
    readonly [51]: "new";
    readonly [68]: "amp_amp";
    readonly [69]: "pipe_pipe";
    readonly [70]: "gt_gt";
    readonly [71]: "gt_gt_gt";
    readonly [72]: "lt_lt";
    readonly [73]: "amp";
    readonly [74]: "caret";
    readonly [75]: "pipe";
    readonly [76]: "plus";
    readonly [77]: "dash";
    readonly [78]: "slash";
    readonly [79]: "percent";
    readonly [80]: "star_star";
    readonly [81]: "lt";
    readonly [82]: "lt_eq";
    readonly [83]: "eq_eq";
    readonly [84]: "eq_eq_eq";
    readonly [85]: "bang_eq";
    readonly [86]: "bang_eq_eq";
    readonly [87]: "gt_eq";
    readonly [88]: "gt";
    readonly [89]: "qmark_qmark";
    readonly [90]: "instanceof";
    readonly [96]: "unescaped_double_string_fragment";
    readonly [97]: "unescaped_single_string_fragment";
    readonly [98]: "escape_sequence";
    readonly [99]: "comment";
    readonly [103]: "regex_pattern";
    readonly [104]: "regex_flags";
    readonly [105]: "number";
    readonly [106]: "private_property_identifier";
    readonly [109]: "this";
    readonly [110]: "super";
    readonly [111]: "true";
    readonly [112]: "false";
    readonly [113]: "null";
    readonly [114]: "undefined";
    readonly [116]: "static";
    readonly [119]: "declare";
    readonly [120]: "namespace";
    readonly [124]: "override";
    readonly [125]: "readonly";
    readonly [132]: "export";
    readonly [135]: "abstract";
    readonly [136]: "satisfies";
    readonly [137]: "require";
    readonly [138]: "extends";
    readonly [139]: "implements";
    readonly [140]: "interface";
    readonly [141]: "enum";
    readonly [146]: "infer";
    readonly [147]: "is";
    readonly [148]: "keyof";
    readonly [154]: "global";
    readonly [155]: "accessor";
    readonly [156]: "using";
    readonly [159]: "_automatic_semicolon";
    readonly [160]: "_template_chars";
    readonly [161]: "_ternary_qmark";
    readonly [162]: "html_comment";
    readonly [163]: "jsx_text";
    readonly [164]: "_function_signature_automatic_semicolon";
    readonly [165]: "__error_recovery";
    readonly [166]: "program";
    readonly [167]: "export_statement";
    readonly [168]: "namespace_export";
    readonly [169]: "export_clause";
    readonly [170]: "export_specifier";
    readonly [173]: "import";
    readonly [174]: "import_statement";
    readonly [175]: "import_clause";
    readonly [177]: "namespace_import";
    readonly [178]: "named_imports";
    readonly [179]: "import_specifier";
    readonly [180]: "import_attribute";
    readonly [182]: "expression_statement";
    readonly [183]: "variable_declaration";
    readonly [184]: "lexical_declaration";
    readonly [185]: "variable_declarator";
    readonly [186]: "statement_block";
    readonly [187]: "else_clause";
    readonly [188]: "if_statement";
    readonly [189]: "switch_statement";
    readonly [190]: "for_statement";
    readonly [191]: "for_in_statement";
    readonly [193]: "while_statement";
    readonly [194]: "do_statement";
    readonly [195]: "try_statement";
    readonly [196]: "with_statement";
    readonly [197]: "break_statement";
    readonly [198]: "continue_statement";
    readonly [199]: "debugger_statement";
    readonly [200]: "return_statement";
    readonly [201]: "throw_statement";
    readonly [202]: "empty_statement";
    readonly [203]: "labeled_statement";
    readonly [204]: "switch_body";
    readonly [205]: "switch_case";
    readonly [206]: "switch_default";
    readonly [207]: "catch_clause";
    readonly [208]: "finally_clause";
    readonly [209]: "parenthesized_expression";
    readonly [212]: "yield_expression";
    readonly [213]: "object";
    readonly [214]: "object_pattern";
    readonly [215]: "assignment_pattern";
    readonly [216]: "object_assignment_pattern";
    readonly [217]: "array";
    readonly [218]: "array_pattern";
    readonly [219]: "nested_identifier";
    readonly [220]: "class";
    readonly [221]: "class_declaration";
    readonly [222]: "class_heritage";
    readonly [223]: "function_expression";
    readonly [224]: "function_declaration";
    readonly [225]: "generator_function";
    readonly [226]: "generator_function_declaration";
    readonly [227]: "arrow_function";
    readonly [230]: "optional_chain";
    readonly [231]: "call_expression";
    readonly [232]: "new_expression";
    readonly [233]: "await_expression";
    readonly [234]: "member_expression";
    readonly [235]: "subscript_expression";
    readonly [236]: "assignment_expression";
    readonly [238]: "augmented_assignment_expression";
    readonly [241]: "spread_element";
    readonly [242]: "ternary_expression";
    readonly [243]: "binary_expression";
    readonly [244]: "unary_expression";
    readonly [245]: "update_expression";
    readonly [246]: "sequence_expression";
    readonly [247]: "string";
    readonly [248]: "template_string";
    readonly [249]: "template_substitution";
    readonly [250]: "regex";
    readonly [251]: "meta_property";
    readonly [252]: "arguments";
    readonly [253]: "decorator";
    readonly [254]: "decorator_member_expression";
    readonly [255]: "decorator_call_expression";
    readonly [256]: "class_body";
    readonly [257]: "formal_parameters";
    readonly [258]: "class_static_block";
    readonly [260]: "rest_pattern";
    readonly [261]: "method_definition";
    readonly [262]: "pair";
    readonly [263]: "pair_pattern";
    readonly [265]: "computed_property_name";
    readonly [266]: "public_field_definition";
    readonly [268]: "non_null_expression";
    readonly [269]: "method_signature";
    readonly [270]: "abstract_method_signature";
    readonly [271]: "function_signature";
    readonly [272]: "decorator_parenthesized_expression";
    readonly [273]: "type_assertion";
    readonly [274]: "as_expression";
    readonly [275]: "satisfies_expression";
    readonly [276]: "instantiation_expression";
    readonly [277]: "import_require_clause";
    readonly [278]: "extends_clause";
    readonly [280]: "implements_clause";
    readonly [281]: "ambient_declaration";
    readonly [282]: "abstract_class_declaration";
    readonly [283]: "module";
    readonly [284]: "internal_module";
    readonly [286]: "import_alias";
    readonly [287]: "nested_type_identifier";
    readonly [288]: "interface_declaration";
    readonly [289]: "extends_type_clause";
    readonly [290]: "enum_declaration";
    readonly [291]: "enum_body";
    readonly [292]: "enum_assignment";
    readonly [293]: "type_alias_declaration";
    readonly [294]: "accessibility_modifier";
    readonly [295]: "override_modifier";
    readonly [296]: "required_parameter";
    readonly [297]: "optional_parameter";
    readonly [299]: "omitting_type_annotation";
    readonly [300]: "adding_type_annotation";
    readonly [301]: "opting_type_annotation";
    readonly [302]: "type_annotation";
    readonly [305]: "asserts";
    readonly [306]: "asserts_annotation";
    readonly [308]: "tuple_parameter";
    readonly [309]: "optional_tuple_parameter";
    readonly [310]: "optional_type";
    readonly [311]: "rest_type";
    readonly [313]: "constructor_type";
    readonly [315]: "template_type";
    readonly [316]: "template_literal_type";
    readonly [317]: "infer_type";
    readonly [318]: "conditional_type";
    readonly [319]: "generic_type";
    readonly [320]: "type_predicate";
    readonly [321]: "type_predicate_annotation";
    readonly [326]: "type_query";
    readonly [327]: "index_type_query";
    readonly [328]: "lookup_type";
    readonly [329]: "mapped_type_clause";
    readonly [330]: "literal_type";
    readonly [332]: "existential_type";
    readonly [333]: "flow_maybe_type";
    readonly [334]: "parenthesized_type";
    readonly [335]: "predefined_type";
    readonly [336]: "type_arguments";
    readonly [337]: "object_type";
    readonly [338]: "call_signature";
    readonly [339]: "property_signature";
    readonly [340]: "type_parameters";
    readonly [341]: "type_parameter";
    readonly [342]: "default_type";
    readonly [343]: "constraint";
    readonly [344]: "construct_signature";
    readonly [345]: "index_signature";
    readonly [346]: "array_type";
    readonly [347]: "tuple_type";
    readonly [348]: "readonly_type";
    readonly [349]: "union_type";
    readonly [350]: "intersection_type";
    readonly [351]: "function_type";
    readonly [355]: "_export_statement_default_from_arm";
    readonly [358]: "_arrow_function_parameter";
    readonly [359]: "_arrow_function__call_signature";
    readonly [360]: "_class_heritage_extends_clause";
    readonly [361]: "_class_heritage_implements_clause";
    readonly [362]: "_import_clause_namespace_import";
    readonly [363]: "_import_clause_named_imports";
    readonly [364]: "_import_clause_default_import";
    readonly [365]: "_import_specifier_name";
    readonly [368]: "_index_signature_mapped_type_clause";
    readonly [369]: "_ambient_declaration_declaration";
    readonly [370]: "_export_statement_default_from_arm_star_from";
    readonly [371]: "_export_statement_default_from_arm_ns_from";
    readonly [372]: "_export_statement_default_from_arm_clause_from";
    readonly [375]: "_class_body_method_sig";
    readonly [376]: "_class_body_member";
    readonly [377]: "_for_header_lhs";
    readonly [381]: "_parenthesized_expression_sequence";
    readonly [382]: "_export_statement_type_export";
    readonly [383]: "_export_statement_equals_export";
    readonly [384]: "_export_statement_namespace_export";
    readonly [418]: "_public_field_definition_accessor_opt";
    readonly [419]: "_public_field_definition_declare_first";
    readonly [426]: "_type_identifier";
};
export declare const TREE_SITTER_KIND_ID_JSON: readonly [{
    readonly name: "identifier";
    readonly id: 1;
    readonly enumName: "Identifier";
    readonly cName: "sym_identifier";
}, {
    readonly name: "hash_bang_line";
    readonly id: 2;
    readonly enumName: "HashBangLine";
    readonly cName: "sym_hash_bang_line";
}, {
    readonly name: "star";
    readonly id: 3;
    readonly enumName: "AnonStar";
    readonly cName: "anon_sym_STAR";
}, {
    readonly name: "as";
    readonly id: 4;
    readonly enumName: "AnonAs";
    readonly cName: "anon_sym_as";
}, {
    readonly name: "typeof";
    readonly id: 9;
    readonly enumName: "AnonTypeof";
    readonly cName: "anon_sym_typeof";
}, {
    readonly name: "from";
    readonly id: 11;
    readonly enumName: "AnonFrom";
    readonly cName: "anon_sym_from";
}, {
    readonly name: "with";
    readonly id: 12;
    readonly enumName: "AnonWith";
    readonly cName: "anon_sym_with";
}, {
    readonly name: "var";
    readonly id: 14;
    readonly enumName: "AnonVar";
    readonly cName: "anon_sym_var";
}, {
    readonly name: "const";
    readonly id: 16;
    readonly enumName: "AnonConst";
    readonly cName: "anon_sym_const";
}, {
    readonly name: "else";
    readonly id: 18;
    readonly enumName: "AnonElse";
    readonly cName: "anon_sym_else";
}, {
    readonly name: "if";
    readonly id: 19;
    readonly enumName: "AnonIf";
    readonly cName: "anon_sym_if";
}, {
    readonly name: "switch";
    readonly id: 20;
    readonly enumName: "AnonSwitch";
    readonly cName: "anon_sym_switch";
}, {
    readonly name: "for";
    readonly id: 21;
    readonly enumName: "AnonFor";
    readonly cName: "anon_sym_for";
}, {
    readonly name: "await";
    readonly id: 25;
    readonly enumName: "AnonAwait";
    readonly cName: "anon_sym_await";
}, {
    readonly name: "in";
    readonly id: 26;
    readonly enumName: "AnonIn";
    readonly cName: "anon_sym_in";
}, {
    readonly name: "while";
    readonly id: 28;
    readonly enumName: "AnonWhile";
    readonly cName: "anon_sym_while";
}, {
    readonly name: "do";
    readonly id: 29;
    readonly enumName: "AnonDo";
    readonly cName: "anon_sym_do";
}, {
    readonly name: "try";
    readonly id: 30;
    readonly enumName: "AnonTry";
    readonly cName: "anon_sym_try";
}, {
    readonly name: "break";
    readonly id: 31;
    readonly enumName: "AnonBreak";
    readonly cName: "anon_sym_break";
}, {
    readonly name: "continue";
    readonly id: 32;
    readonly enumName: "AnonContinue";
    readonly cName: "anon_sym_continue";
}, {
    readonly name: "debugger";
    readonly id: 33;
    readonly enumName: "AnonDebugger";
    readonly cName: "anon_sym_debugger";
}, {
    readonly name: "return";
    readonly id: 34;
    readonly enumName: "AnonReturn";
    readonly cName: "anon_sym_return";
}, {
    readonly name: "throw";
    readonly id: 35;
    readonly enumName: "AnonThrow";
    readonly cName: "anon_sym_throw";
}, {
    readonly name: "case";
    readonly id: 37;
    readonly enumName: "AnonCase";
    readonly cName: "anon_sym_case";
}, {
    readonly name: "default";
    readonly id: 38;
    readonly enumName: "AnonDefault";
    readonly cName: "anon_sym_default";
}, {
    readonly name: "catch";
    readonly id: 39;
    readonly enumName: "AnonCatch";
    readonly cName: "anon_sym_catch";
}, {
    readonly name: "finally";
    readonly id: 40;
    readonly enumName: "AnonFinally";
    readonly cName: "anon_sym_finally";
}, {
    readonly name: "yield";
    readonly id: 41;
    readonly enumName: "AnonYield";
    readonly cName: "anon_sym_yield";
}, {
    readonly name: "function";
    readonly id: 47;
    readonly enumName: "AnonFunction";
    readonly cName: "anon_sym_function";
}, {
    readonly name: "async";
    readonly id: 48;
    readonly enumName: "AnonAsync";
    readonly cName: "anon_sym_async";
}, {
    readonly name: "new";
    readonly id: 51;
    readonly enumName: "AnonNew";
    readonly cName: "anon_sym_new";
}, {
    readonly name: "amp_amp";
    readonly id: 68;
    readonly enumName: "AnonAmpAmp";
    readonly cName: "anon_sym_AMP_AMP";
}, {
    readonly name: "pipe_pipe";
    readonly id: 69;
    readonly enumName: "AnonPipePipe";
    readonly cName: "anon_sym_PIPE_PIPE";
}, {
    readonly name: "gt_gt";
    readonly id: 70;
    readonly enumName: "AnonGtGt";
    readonly cName: "anon_sym_GT_GT";
}, {
    readonly name: "gt_gt_gt";
    readonly id: 71;
    readonly enumName: "AnonGtGtGt";
    readonly cName: "anon_sym_GT_GT_GT";
}, {
    readonly name: "lt_lt";
    readonly id: 72;
    readonly enumName: "AnonLtLt";
    readonly cName: "anon_sym_LT_LT";
}, {
    readonly name: "amp";
    readonly id: 73;
    readonly enumName: "AnonAmp";
    readonly cName: "anon_sym_AMP";
}, {
    readonly name: "caret";
    readonly id: 74;
    readonly enumName: "AnonCaret";
    readonly cName: "anon_sym_CARET";
}, {
    readonly name: "pipe";
    readonly id: 75;
    readonly enumName: "AnonPipe";
    readonly cName: "anon_sym_PIPE";
}, {
    readonly name: "plus";
    readonly id: 76;
    readonly enumName: "AnonPlus";
    readonly cName: "anon_sym_PLUS";
}, {
    readonly name: "dash";
    readonly id: 77;
    readonly enumName: "AnonDash";
    readonly cName: "anon_sym_DASH";
}, {
    readonly name: "slash";
    readonly id: 78;
    readonly enumName: "AnonSlash";
    readonly cName: "anon_sym_SLASH";
}, {
    readonly name: "percent";
    readonly id: 79;
    readonly enumName: "AnonPercent";
    readonly cName: "anon_sym_PERCENT";
}, {
    readonly name: "star_star";
    readonly id: 80;
    readonly enumName: "AnonStarStar";
    readonly cName: "anon_sym_STAR_STAR";
}, {
    readonly name: "lt";
    readonly id: 81;
    readonly enumName: "AnonLt";
    readonly cName: "anon_sym_LT";
}, {
    readonly name: "lt_eq";
    readonly id: 82;
    readonly enumName: "AnonLtEq";
    readonly cName: "anon_sym_LT_EQ";
}, {
    readonly name: "eq_eq";
    readonly id: 83;
    readonly enumName: "AnonEqEq";
    readonly cName: "anon_sym_EQ_EQ";
}, {
    readonly name: "eq_eq_eq";
    readonly id: 84;
    readonly enumName: "AnonEqEqEq";
    readonly cName: "anon_sym_EQ_EQ_EQ";
}, {
    readonly name: "bang_eq";
    readonly id: 85;
    readonly enumName: "AnonBangEq";
    readonly cName: "anon_sym_BANG_EQ";
}, {
    readonly name: "bang_eq_eq";
    readonly id: 86;
    readonly enumName: "AnonBangEqEq";
    readonly cName: "anon_sym_BANG_EQ_EQ";
}, {
    readonly name: "gt_eq";
    readonly id: 87;
    readonly enumName: "AnonGtEq";
    readonly cName: "anon_sym_GT_EQ";
}, {
    readonly name: "gt";
    readonly id: 88;
    readonly enumName: "AnonGt";
    readonly cName: "anon_sym_GT";
}, {
    readonly name: "qmark_qmark";
    readonly id: 89;
    readonly enumName: "AnonQmarkQmark";
    readonly cName: "anon_sym_QMARK_QMARK";
}, {
    readonly name: "instanceof";
    readonly id: 90;
    readonly enumName: "AnonInstanceof";
    readonly cName: "anon_sym_instanceof";
}, {
    readonly name: "unescaped_double_string_fragment";
    readonly id: 96;
    readonly enumName: "UnescapedDoubleStringFragment";
    readonly cName: "sym_unescaped_double_string_fragment";
}, {
    readonly name: "unescaped_single_string_fragment";
    readonly id: 97;
    readonly enumName: "UnescapedSingleStringFragment";
    readonly cName: "sym_unescaped_single_string_fragment";
}, {
    readonly name: "escape_sequence";
    readonly id: 98;
    readonly enumName: "EscapeSequence";
    readonly cName: "sym_escape_sequence";
}, {
    readonly name: "comment";
    readonly id: 99;
    readonly enumName: "Comment";
    readonly cName: "sym_comment";
}, {
    readonly name: "regex_pattern";
    readonly id: 103;
    readonly enumName: "RegexPattern";
    readonly cName: "sym_regex_pattern";
}, {
    readonly name: "regex_flags";
    readonly id: 104;
    readonly enumName: "RegexFlags";
    readonly cName: "sym_regex_flags";
}, {
    readonly name: "number";
    readonly id: 105;
    readonly enumName: "Number";
    readonly cName: "sym_number";
}, {
    readonly name: "private_property_identifier";
    readonly id: 106;
    readonly enumName: "PrivatePropertyIdentifier";
    readonly cName: "sym_private_property_identifier";
}, {
    readonly name: "this";
    readonly id: 109;
    readonly enumName: "This";
    readonly cName: "sym_this";
}, {
    readonly name: "super";
    readonly id: 110;
    readonly enumName: "Super";
    readonly cName: "sym_super";
}, {
    readonly name: "true";
    readonly id: 111;
    readonly enumName: "True";
    readonly cName: "sym_true";
}, {
    readonly name: "false";
    readonly id: 112;
    readonly enumName: "False";
    readonly cName: "sym_false";
}, {
    readonly name: "null";
    readonly id: 113;
    readonly enumName: "Null";
    readonly cName: "sym_null";
}, {
    readonly name: "undefined";
    readonly id: 114;
    readonly enumName: "Undefined";
    readonly cName: "sym_undefined";
}, {
    readonly name: "static";
    readonly id: 116;
    readonly enumName: "AnonStatic";
    readonly cName: "anon_sym_static";
}, {
    readonly name: "declare";
    readonly id: 119;
    readonly enumName: "AnonDeclare";
    readonly cName: "anon_sym_declare";
}, {
    readonly name: "namespace";
    readonly id: 120;
    readonly enumName: "AnonNamespace";
    readonly cName: "anon_sym_namespace";
}, {
    readonly name: "override";
    readonly id: 124;
    readonly enumName: "AnonOverride";
    readonly cName: "anon_sym_override";
}, {
    readonly name: "readonly";
    readonly id: 125;
    readonly enumName: "AnonReadonly";
    readonly cName: "anon_sym_readonly";
}, {
    readonly name: "export";
    readonly id: 132;
    readonly enumName: "AnonExport";
    readonly cName: "anon_sym_export";
}, {
    readonly name: "abstract";
    readonly id: 135;
    readonly enumName: "AnonAbstract";
    readonly cName: "anon_sym_abstract";
}, {
    readonly name: "satisfies";
    readonly id: 136;
    readonly enumName: "AnonSatisfies";
    readonly cName: "anon_sym_satisfies";
}, {
    readonly name: "require";
    readonly id: 137;
    readonly enumName: "AnonRequire";
    readonly cName: "anon_sym_require";
}, {
    readonly name: "extends";
    readonly id: 138;
    readonly enumName: "AnonExtends";
    readonly cName: "anon_sym_extends";
}, {
    readonly name: "implements";
    readonly id: 139;
    readonly enumName: "AnonImplements";
    readonly cName: "anon_sym_implements";
}, {
    readonly name: "interface";
    readonly id: 140;
    readonly enumName: "AnonInterface";
    readonly cName: "anon_sym_interface";
}, {
    readonly name: "enum";
    readonly id: 141;
    readonly enumName: "AnonEnum";
    readonly cName: "anon_sym_enum";
}, {
    readonly name: "infer";
    readonly id: 146;
    readonly enumName: "AnonInfer";
    readonly cName: "anon_sym_infer";
}, {
    readonly name: "is";
    readonly id: 147;
    readonly enumName: "AnonIs";
    readonly cName: "anon_sym_is";
}, {
    readonly name: "keyof";
    readonly id: 148;
    readonly enumName: "AnonKeyof";
    readonly cName: "anon_sym_keyof";
}, {
    readonly name: "global";
    readonly id: 154;
    readonly enumName: "AnonGlobal";
    readonly cName: "anon_sym_global";
}, {
    readonly name: "accessor";
    readonly id: 155;
    readonly enumName: "AnonAccessor";
    readonly cName: "anon_sym_accessor";
}, {
    readonly name: "using";
    readonly id: 156;
    readonly enumName: "AnonUsing";
    readonly cName: "anon_sym_using";
}, {
    readonly name: "_automatic_semicolon";
    readonly id: 159;
    readonly enumName: "AutomaticSemicolon";
    readonly cName: "sym__automatic_semicolon";
}, {
    readonly name: "_template_chars";
    readonly id: 160;
    readonly enumName: "TemplateChars";
    readonly cName: "sym__template_chars";
}, {
    readonly name: "_ternary_qmark";
    readonly id: 161;
    readonly enumName: "TernaryQmark";
    readonly cName: "sym__ternary_qmark";
}, {
    readonly name: "html_comment";
    readonly id: 162;
    readonly enumName: "HtmlComment";
    readonly cName: "sym_html_comment";
}, {
    readonly name: "jsx_text";
    readonly id: 163;
    readonly enumName: "JsxText";
    readonly cName: "sym_jsx_text";
}, {
    readonly name: "_function_signature_automatic_semicolon";
    readonly id: 164;
    readonly enumName: "FunctionSignatureAutomaticSemicolon";
    readonly cName: "sym__function_signature_automatic_semicolon";
}, {
    readonly name: "__error_recovery";
    readonly id: 165;
    readonly enumName: "ErrorRecovery";
    readonly cName: "sym___error_recovery";
}, {
    readonly name: "program";
    readonly id: 166;
    readonly enumName: "Program";
    readonly cName: "sym_program";
}, {
    readonly name: "export_statement";
    readonly id: 167;
    readonly enumName: "ExportStatement";
    readonly cName: "sym_export_statement";
}, {
    readonly name: "namespace_export";
    readonly id: 168;
    readonly enumName: "NamespaceExport";
    readonly cName: "sym_namespace_export";
}, {
    readonly name: "export_clause";
    readonly id: 169;
    readonly enumName: "ExportClause";
    readonly cName: "sym_export_clause";
}, {
    readonly name: "export_specifier";
    readonly id: 170;
    readonly enumName: "ExportSpecifier";
    readonly cName: "sym_export_specifier";
}, {
    readonly name: "import";
    readonly id: 173;
    readonly enumName: "Import";
    readonly cName: "sym_import";
}, {
    readonly name: "import_statement";
    readonly id: 174;
    readonly enumName: "ImportStatement";
    readonly cName: "sym_import_statement";
}, {
    readonly name: "import_clause";
    readonly id: 175;
    readonly enumName: "ImportClause";
    readonly cName: "sym_import_clause";
}, {
    readonly name: "namespace_import";
    readonly id: 177;
    readonly enumName: "NamespaceImport";
    readonly cName: "sym_namespace_import";
}, {
    readonly name: "named_imports";
    readonly id: 178;
    readonly enumName: "NamedImports";
    readonly cName: "sym_named_imports";
}, {
    readonly name: "import_specifier";
    readonly id: 179;
    readonly enumName: "ImportSpecifier";
    readonly cName: "sym_import_specifier";
}, {
    readonly name: "import_attribute";
    readonly id: 180;
    readonly enumName: "ImportAttribute";
    readonly cName: "sym_import_attribute";
}, {
    readonly name: "expression_statement";
    readonly id: 182;
    readonly enumName: "ExpressionStatement";
    readonly cName: "sym_expression_statement";
}, {
    readonly name: "variable_declaration";
    readonly id: 183;
    readonly enumName: "VariableDeclaration";
    readonly cName: "sym_variable_declaration";
}, {
    readonly name: "lexical_declaration";
    readonly id: 184;
    readonly enumName: "LexicalDeclaration";
    readonly cName: "sym_lexical_declaration";
}, {
    readonly name: "variable_declarator";
    readonly id: 185;
    readonly enumName: "VariableDeclarator";
    readonly cName: "sym_variable_declarator";
}, {
    readonly name: "statement_block";
    readonly id: 186;
    readonly enumName: "StatementBlock";
    readonly cName: "sym_statement_block";
}, {
    readonly name: "else_clause";
    readonly id: 187;
    readonly enumName: "ElseClause";
    readonly cName: "sym_else_clause";
}, {
    readonly name: "if_statement";
    readonly id: 188;
    readonly enumName: "IfStatement";
    readonly cName: "sym_if_statement";
}, {
    readonly name: "switch_statement";
    readonly id: 189;
    readonly enumName: "SwitchStatement";
    readonly cName: "sym_switch_statement";
}, {
    readonly name: "for_statement";
    readonly id: 190;
    readonly enumName: "ForStatement";
    readonly cName: "sym_for_statement";
}, {
    readonly name: "for_in_statement";
    readonly id: 191;
    readonly enumName: "ForInStatement";
    readonly cName: "sym_for_in_statement";
}, {
    readonly name: "while_statement";
    readonly id: 193;
    readonly enumName: "WhileStatement";
    readonly cName: "sym_while_statement";
}, {
    readonly name: "do_statement";
    readonly id: 194;
    readonly enumName: "DoStatement";
    readonly cName: "sym_do_statement";
}, {
    readonly name: "try_statement";
    readonly id: 195;
    readonly enumName: "TryStatement";
    readonly cName: "sym_try_statement";
}, {
    readonly name: "with_statement";
    readonly id: 196;
    readonly enumName: "WithStatement";
    readonly cName: "sym_with_statement";
}, {
    readonly name: "break_statement";
    readonly id: 197;
    readonly enumName: "BreakStatement";
    readonly cName: "sym_break_statement";
}, {
    readonly name: "continue_statement";
    readonly id: 198;
    readonly enumName: "ContinueStatement";
    readonly cName: "sym_continue_statement";
}, {
    readonly name: "debugger_statement";
    readonly id: 199;
    readonly enumName: "DebuggerStatement";
    readonly cName: "sym_debugger_statement";
}, {
    readonly name: "return_statement";
    readonly id: 200;
    readonly enumName: "ReturnStatement";
    readonly cName: "sym_return_statement";
}, {
    readonly name: "throw_statement";
    readonly id: 201;
    readonly enumName: "ThrowStatement";
    readonly cName: "sym_throw_statement";
}, {
    readonly name: "empty_statement";
    readonly id: 202;
    readonly enumName: "EmptyStatement";
    readonly cName: "sym_empty_statement";
}, {
    readonly name: "labeled_statement";
    readonly id: 203;
    readonly enumName: "LabeledStatement";
    readonly cName: "sym_labeled_statement";
}, {
    readonly name: "switch_body";
    readonly id: 204;
    readonly enumName: "SwitchBody";
    readonly cName: "sym_switch_body";
}, {
    readonly name: "switch_case";
    readonly id: 205;
    readonly enumName: "SwitchCase";
    readonly cName: "sym_switch_case";
}, {
    readonly name: "switch_default";
    readonly id: 206;
    readonly enumName: "SwitchDefault";
    readonly cName: "sym_switch_default";
}, {
    readonly name: "catch_clause";
    readonly id: 207;
    readonly enumName: "CatchClause";
    readonly cName: "sym_catch_clause";
}, {
    readonly name: "finally_clause";
    readonly id: 208;
    readonly enumName: "FinallyClause";
    readonly cName: "sym_finally_clause";
}, {
    readonly name: "parenthesized_expression";
    readonly id: 209;
    readonly enumName: "ParenthesizedExpression";
    readonly cName: "sym_parenthesized_expression";
}, {
    readonly name: "yield_expression";
    readonly id: 212;
    readonly enumName: "YieldExpression";
    readonly cName: "sym_yield_expression";
}, {
    readonly name: "object";
    readonly id: 213;
    readonly enumName: "Object";
    readonly cName: "sym_object";
}, {
    readonly name: "object_pattern";
    readonly id: 214;
    readonly enumName: "ObjectPattern";
    readonly cName: "sym_object_pattern";
}, {
    readonly name: "assignment_pattern";
    readonly id: 215;
    readonly enumName: "AssignmentPattern";
    readonly cName: "sym_assignment_pattern";
}, {
    readonly name: "object_assignment_pattern";
    readonly id: 216;
    readonly enumName: "ObjectAssignmentPattern";
    readonly cName: "sym_object_assignment_pattern";
}, {
    readonly name: "array";
    readonly id: 217;
    readonly enumName: "Array";
    readonly cName: "sym_array";
}, {
    readonly name: "array_pattern";
    readonly id: 218;
    readonly enumName: "ArrayPattern";
    readonly cName: "sym_array_pattern";
}, {
    readonly name: "nested_identifier";
    readonly id: 219;
    readonly enumName: "NestedIdentifier";
    readonly cName: "sym_nested_identifier";
}, {
    readonly name: "class";
    readonly id: 220;
    readonly enumName: "Class";
    readonly cName: "sym_class";
}, {
    readonly name: "class_declaration";
    readonly id: 221;
    readonly enumName: "ClassDeclaration";
    readonly cName: "sym_class_declaration";
}, {
    readonly name: "class_heritage";
    readonly id: 222;
    readonly enumName: "ClassHeritage";
    readonly cName: "sym_class_heritage";
}, {
    readonly name: "function_expression";
    readonly id: 223;
    readonly enumName: "FunctionExpression";
    readonly cName: "sym_function_expression";
}, {
    readonly name: "function_declaration";
    readonly id: 224;
    readonly enumName: "FunctionDeclaration";
    readonly cName: "sym_function_declaration";
}, {
    readonly name: "generator_function";
    readonly id: 225;
    readonly enumName: "GeneratorFunction";
    readonly cName: "sym_generator_function";
}, {
    readonly name: "generator_function_declaration";
    readonly id: 226;
    readonly enumName: "GeneratorFunctionDeclaration";
    readonly cName: "sym_generator_function_declaration";
}, {
    readonly name: "arrow_function";
    readonly id: 227;
    readonly enumName: "ArrowFunction";
    readonly cName: "sym_arrow_function";
}, {
    readonly name: "optional_chain";
    readonly id: 230;
    readonly enumName: "OptionalChain";
    readonly cName: "sym_optional_chain";
}, {
    readonly name: "call_expression";
    readonly id: 231;
    readonly enumName: "CallExpression";
    readonly cName: "sym_call_expression";
}, {
    readonly name: "new_expression";
    readonly id: 232;
    readonly enumName: "NewExpression";
    readonly cName: "sym_new_expression";
}, {
    readonly name: "await_expression";
    readonly id: 233;
    readonly enumName: "AwaitExpression";
    readonly cName: "sym_await_expression";
}, {
    readonly name: "member_expression";
    readonly id: 234;
    readonly enumName: "MemberExpression";
    readonly cName: "sym_member_expression";
}, {
    readonly name: "subscript_expression";
    readonly id: 235;
    readonly enumName: "SubscriptExpression";
    readonly cName: "sym_subscript_expression";
}, {
    readonly name: "assignment_expression";
    readonly id: 236;
    readonly enumName: "AssignmentExpression";
    readonly cName: "sym_assignment_expression";
}, {
    readonly name: "augmented_assignment_expression";
    readonly id: 238;
    readonly enumName: "AugmentedAssignmentExpression";
    readonly cName: "sym_augmented_assignment_expression";
}, {
    readonly name: "spread_element";
    readonly id: 241;
    readonly enumName: "SpreadElement";
    readonly cName: "sym_spread_element";
}, {
    readonly name: "ternary_expression";
    readonly id: 242;
    readonly enumName: "TernaryExpression";
    readonly cName: "sym_ternary_expression";
}, {
    readonly name: "binary_expression";
    readonly id: 243;
    readonly enumName: "BinaryExpression";
    readonly cName: "sym_binary_expression";
}, {
    readonly name: "unary_expression";
    readonly id: 244;
    readonly enumName: "UnaryExpression";
    readonly cName: "sym_unary_expression";
}, {
    readonly name: "update_expression";
    readonly id: 245;
    readonly enumName: "UpdateExpression";
    readonly cName: "sym_update_expression";
}, {
    readonly name: "sequence_expression";
    readonly id: 246;
    readonly enumName: "SequenceExpression";
    readonly cName: "sym_sequence_expression";
}, {
    readonly name: "string";
    readonly id: 247;
    readonly enumName: "String";
    readonly cName: "sym_string";
}, {
    readonly name: "template_string";
    readonly id: 248;
    readonly enumName: "TemplateString";
    readonly cName: "sym_template_string";
}, {
    readonly name: "template_substitution";
    readonly id: 249;
    readonly enumName: "TemplateSubstitution";
    readonly cName: "sym_template_substitution";
}, {
    readonly name: "regex";
    readonly id: 250;
    readonly enumName: "Regex";
    readonly cName: "sym_regex";
}, {
    readonly name: "meta_property";
    readonly id: 251;
    readonly enumName: "MetaProperty";
    readonly cName: "sym_meta_property";
}, {
    readonly name: "arguments";
    readonly id: 252;
    readonly enumName: "Arguments";
    readonly cName: "sym_arguments";
}, {
    readonly name: "decorator";
    readonly id: 253;
    readonly enumName: "Decorator";
    readonly cName: "sym_decorator";
}, {
    readonly name: "decorator_member_expression";
    readonly id: 254;
    readonly enumName: "DecoratorMemberExpression";
    readonly cName: "sym_decorator_member_expression";
}, {
    readonly name: "decorator_call_expression";
    readonly id: 255;
    readonly enumName: "DecoratorCallExpression";
    readonly cName: "sym_decorator_call_expression";
}, {
    readonly name: "class_body";
    readonly id: 256;
    readonly enumName: "ClassBody";
    readonly cName: "sym_class_body";
}, {
    readonly name: "formal_parameters";
    readonly id: 257;
    readonly enumName: "FormalParameters";
    readonly cName: "sym_formal_parameters";
}, {
    readonly name: "class_static_block";
    readonly id: 258;
    readonly enumName: "ClassStaticBlock";
    readonly cName: "sym_class_static_block";
}, {
    readonly name: "rest_pattern";
    readonly id: 260;
    readonly enumName: "RestPattern";
    readonly cName: "sym_rest_pattern";
}, {
    readonly name: "method_definition";
    readonly id: 261;
    readonly enumName: "MethodDefinition";
    readonly cName: "sym_method_definition";
}, {
    readonly name: "pair";
    readonly id: 262;
    readonly enumName: "Pair";
    readonly cName: "sym_pair";
}, {
    readonly name: "pair_pattern";
    readonly id: 263;
    readonly enumName: "PairPattern";
    readonly cName: "sym_pair_pattern";
}, {
    readonly name: "computed_property_name";
    readonly id: 265;
    readonly enumName: "ComputedPropertyName";
    readonly cName: "sym_computed_property_name";
}, {
    readonly name: "public_field_definition";
    readonly id: 266;
    readonly enumName: "PublicFieldDefinition";
    readonly cName: "sym_public_field_definition";
}, {
    readonly name: "non_null_expression";
    readonly id: 268;
    readonly enumName: "NonNullExpression";
    readonly cName: "sym_non_null_expression";
}, {
    readonly name: "method_signature";
    readonly id: 269;
    readonly enumName: "MethodSignature";
    readonly cName: "sym_method_signature";
}, {
    readonly name: "abstract_method_signature";
    readonly id: 270;
    readonly enumName: "AbstractMethodSignature";
    readonly cName: "sym_abstract_method_signature";
}, {
    readonly name: "function_signature";
    readonly id: 271;
    readonly enumName: "FunctionSignature";
    readonly cName: "sym_function_signature";
}, {
    readonly name: "decorator_parenthesized_expression";
    readonly id: 272;
    readonly enumName: "DecoratorParenthesizedExpression";
    readonly cName: "sym_decorator_parenthesized_expression";
}, {
    readonly name: "type_assertion";
    readonly id: 273;
    readonly enumName: "TypeAssertion";
    readonly cName: "sym_type_assertion";
}, {
    readonly name: "as_expression";
    readonly id: 274;
    readonly enumName: "AsExpression";
    readonly cName: "sym_as_expression";
}, {
    readonly name: "satisfies_expression";
    readonly id: 275;
    readonly enumName: "SatisfiesExpression";
    readonly cName: "sym_satisfies_expression";
}, {
    readonly name: "instantiation_expression";
    readonly id: 276;
    readonly enumName: "InstantiationExpression";
    readonly cName: "sym_instantiation_expression";
}, {
    readonly name: "import_require_clause";
    readonly id: 277;
    readonly enumName: "ImportRequireClause";
    readonly cName: "sym_import_require_clause";
}, {
    readonly name: "extends_clause";
    readonly id: 278;
    readonly enumName: "ExtendsClause";
    readonly cName: "sym_extends_clause";
}, {
    readonly name: "implements_clause";
    readonly id: 280;
    readonly enumName: "ImplementsClause";
    readonly cName: "sym_implements_clause";
}, {
    readonly name: "ambient_declaration";
    readonly id: 281;
    readonly enumName: "AmbientDeclaration";
    readonly cName: "sym_ambient_declaration";
}, {
    readonly name: "abstract_class_declaration";
    readonly id: 282;
    readonly enumName: "AbstractClassDeclaration";
    readonly cName: "sym_abstract_class_declaration";
}, {
    readonly name: "module";
    readonly id: 283;
    readonly enumName: "Module";
    readonly cName: "sym_module";
}, {
    readonly name: "internal_module";
    readonly id: 284;
    readonly enumName: "InternalModule";
    readonly cName: "sym_internal_module";
}, {
    readonly name: "import_alias";
    readonly id: 286;
    readonly enumName: "ImportAlias";
    readonly cName: "sym_import_alias";
}, {
    readonly name: "nested_type_identifier";
    readonly id: 287;
    readonly enumName: "NestedTypeIdentifier";
    readonly cName: "sym_nested_type_identifier";
}, {
    readonly name: "interface_declaration";
    readonly id: 288;
    readonly enumName: "InterfaceDeclaration";
    readonly cName: "sym_interface_declaration";
}, {
    readonly name: "extends_type_clause";
    readonly id: 289;
    readonly enumName: "ExtendsTypeClause";
    readonly cName: "sym_extends_type_clause";
}, {
    readonly name: "enum_declaration";
    readonly id: 290;
    readonly enumName: "EnumDeclaration";
    readonly cName: "sym_enum_declaration";
}, {
    readonly name: "enum_body";
    readonly id: 291;
    readonly enumName: "EnumBody";
    readonly cName: "sym_enum_body";
}, {
    readonly name: "enum_assignment";
    readonly id: 292;
    readonly enumName: "EnumAssignment";
    readonly cName: "sym_enum_assignment";
}, {
    readonly name: "type_alias_declaration";
    readonly id: 293;
    readonly enumName: "TypeAliasDeclaration";
    readonly cName: "sym_type_alias_declaration";
}, {
    readonly name: "accessibility_modifier";
    readonly id: 294;
    readonly enumName: "AccessibilityModifier";
    readonly cName: "sym_accessibility_modifier";
}, {
    readonly name: "override_modifier";
    readonly id: 295;
    readonly enumName: "OverrideModifier";
    readonly cName: "sym_override_modifier";
}, {
    readonly name: "required_parameter";
    readonly id: 296;
    readonly enumName: "RequiredParameter";
    readonly cName: "sym_required_parameter";
}, {
    readonly name: "optional_parameter";
    readonly id: 297;
    readonly enumName: "OptionalParameter";
    readonly cName: "sym_optional_parameter";
}, {
    readonly name: "omitting_type_annotation";
    readonly id: 299;
    readonly enumName: "OmittingTypeAnnotation";
    readonly cName: "sym_omitting_type_annotation";
}, {
    readonly name: "adding_type_annotation";
    readonly id: 300;
    readonly enumName: "AddingTypeAnnotation";
    readonly cName: "sym_adding_type_annotation";
}, {
    readonly name: "opting_type_annotation";
    readonly id: 301;
    readonly enumName: "OptingTypeAnnotation";
    readonly cName: "sym_opting_type_annotation";
}, {
    readonly name: "type_annotation";
    readonly id: 302;
    readonly enumName: "TypeAnnotation";
    readonly cName: "sym_type_annotation";
}, {
    readonly name: "asserts";
    readonly id: 305;
    readonly enumName: "Asserts";
    readonly cName: "sym_asserts";
}, {
    readonly name: "asserts_annotation";
    readonly id: 306;
    readonly enumName: "AssertsAnnotation";
    readonly cName: "sym_asserts_annotation";
}, {
    readonly name: "tuple_parameter";
    readonly id: 308;
    readonly enumName: "TupleParameter";
    readonly cName: "sym_tuple_parameter";
}, {
    readonly name: "optional_tuple_parameter";
    readonly id: 309;
    readonly enumName: "OptionalTupleParameter";
    readonly cName: "sym_optional_tuple_parameter";
}, {
    readonly name: "optional_type";
    readonly id: 310;
    readonly enumName: "OptionalType";
    readonly cName: "sym_optional_type";
}, {
    readonly name: "rest_type";
    readonly id: 311;
    readonly enumName: "RestType";
    readonly cName: "sym_rest_type";
}, {
    readonly name: "constructor_type";
    readonly id: 313;
    readonly enumName: "ConstructorType";
    readonly cName: "sym_constructor_type";
}, {
    readonly name: "template_type";
    readonly id: 315;
    readonly enumName: "TemplateType";
    readonly cName: "sym_template_type";
}, {
    readonly name: "template_literal_type";
    readonly id: 316;
    readonly enumName: "TemplateLiteralType";
    readonly cName: "sym_template_literal_type";
}, {
    readonly name: "infer_type";
    readonly id: 317;
    readonly enumName: "InferType";
    readonly cName: "sym_infer_type";
}, {
    readonly name: "conditional_type";
    readonly id: 318;
    readonly enumName: "ConditionalType";
    readonly cName: "sym_conditional_type";
}, {
    readonly name: "generic_type";
    readonly id: 319;
    readonly enumName: "GenericType";
    readonly cName: "sym_generic_type";
}, {
    readonly name: "type_predicate";
    readonly id: 320;
    readonly enumName: "TypePredicate";
    readonly cName: "sym_type_predicate";
}, {
    readonly name: "type_predicate_annotation";
    readonly id: 321;
    readonly enumName: "TypePredicateAnnotation";
    readonly cName: "sym_type_predicate_annotation";
}, {
    readonly name: "type_query";
    readonly id: 326;
    readonly enumName: "TypeQuery";
    readonly cName: "sym_type_query";
}, {
    readonly name: "index_type_query";
    readonly id: 327;
    readonly enumName: "IndexTypeQuery";
    readonly cName: "sym_index_type_query";
}, {
    readonly name: "lookup_type";
    readonly id: 328;
    readonly enumName: "LookupType";
    readonly cName: "sym_lookup_type";
}, {
    readonly name: "mapped_type_clause";
    readonly id: 329;
    readonly enumName: "MappedTypeClause";
    readonly cName: "sym_mapped_type_clause";
}, {
    readonly name: "literal_type";
    readonly id: 330;
    readonly enumName: "LiteralType";
    readonly cName: "sym_literal_type";
}, {
    readonly name: "existential_type";
    readonly id: 332;
    readonly enumName: "ExistentialType";
    readonly cName: "sym_existential_type";
}, {
    readonly name: "flow_maybe_type";
    readonly id: 333;
    readonly enumName: "FlowMaybeType";
    readonly cName: "sym_flow_maybe_type";
}, {
    readonly name: "parenthesized_type";
    readonly id: 334;
    readonly enumName: "ParenthesizedType";
    readonly cName: "sym_parenthesized_type";
}, {
    readonly name: "predefined_type";
    readonly id: 335;
    readonly enumName: "PredefinedType";
    readonly cName: "sym_predefined_type";
}, {
    readonly name: "type_arguments";
    readonly id: 336;
    readonly enumName: "TypeArguments";
    readonly cName: "sym_type_arguments";
}, {
    readonly name: "object_type";
    readonly id: 337;
    readonly enumName: "ObjectType";
    readonly cName: "sym_object_type";
}, {
    readonly name: "call_signature";
    readonly id: 338;
    readonly enumName: "CallSignature";
    readonly cName: "sym_call_signature";
}, {
    readonly name: "property_signature";
    readonly id: 339;
    readonly enumName: "PropertySignature";
    readonly cName: "sym_property_signature";
}, {
    readonly name: "type_parameters";
    readonly id: 340;
    readonly enumName: "TypeParameters";
    readonly cName: "sym_type_parameters";
}, {
    readonly name: "type_parameter";
    readonly id: 341;
    readonly enumName: "TypeParameter";
    readonly cName: "sym_type_parameter";
}, {
    readonly name: "default_type";
    readonly id: 342;
    readonly enumName: "DefaultType";
    readonly cName: "sym_default_type";
}, {
    readonly name: "constraint";
    readonly id: 343;
    readonly enumName: "Constraint";
    readonly cName: "sym_constraint";
}, {
    readonly name: "construct_signature";
    readonly id: 344;
    readonly enumName: "ConstructSignature";
    readonly cName: "sym_construct_signature";
}, {
    readonly name: "index_signature";
    readonly id: 345;
    readonly enumName: "IndexSignature";
    readonly cName: "sym_index_signature";
}, {
    readonly name: "array_type";
    readonly id: 346;
    readonly enumName: "ArrayType";
    readonly cName: "sym_array_type";
}, {
    readonly name: "tuple_type";
    readonly id: 347;
    readonly enumName: "TupleType";
    readonly cName: "sym_tuple_type";
}, {
    readonly name: "readonly_type";
    readonly id: 348;
    readonly enumName: "ReadonlyType";
    readonly cName: "sym_readonly_type";
}, {
    readonly name: "union_type";
    readonly id: 349;
    readonly enumName: "UnionType";
    readonly cName: "sym_union_type";
}, {
    readonly name: "intersection_type";
    readonly id: 350;
    readonly enumName: "IntersectionType";
    readonly cName: "sym_intersection_type";
}, {
    readonly name: "function_type";
    readonly id: 351;
    readonly enumName: "FunctionType";
    readonly cName: "sym_function_type";
}, {
    readonly name: "_export_statement_default_from_arm";
    readonly id: 355;
    readonly enumName: "ExportStatementDefaultFromArm";
    readonly cName: "sym__export_statement_default_from_arm";
}, {
    readonly name: "_arrow_function_parameter";
    readonly id: 358;
    readonly enumName: "ArrowFunctionParameter";
    readonly cName: "sym__arrow_function_parameter";
}, {
    readonly name: "_arrow_function__call_signature";
    readonly id: 359;
    readonly enumName: "ArrowFunctionCallSignature";
    readonly cName: "sym__arrow_function__call_signature";
}, {
    readonly name: "_class_heritage_extends_clause";
    readonly id: 360;
    readonly enumName: "ClassHeritageExtendsClause";
    readonly cName: "sym__class_heritage_extends_clause";
}, {
    readonly name: "_class_heritage_implements_clause";
    readonly id: 361;
    readonly enumName: "ClassHeritageImplementsClause";
    readonly cName: "sym__class_heritage_implements_clause";
}, {
    readonly name: "_import_clause_namespace_import";
    readonly id: 362;
    readonly enumName: "ImportClauseNamespaceImport";
    readonly cName: "sym__import_clause_namespace_import";
}, {
    readonly name: "_import_clause_named_imports";
    readonly id: 363;
    readonly enumName: "ImportClauseNamedImports";
    readonly cName: "sym__import_clause_named_imports";
}, {
    readonly name: "_import_clause_default_import";
    readonly id: 364;
    readonly enumName: "ImportClauseDefaultImport";
    readonly cName: "sym__import_clause_default_import";
}, {
    readonly name: "_import_specifier_name";
    readonly id: 365;
    readonly enumName: "ImportSpecifierName";
    readonly cName: "sym__import_specifier_name";
}, {
    readonly name: "_index_signature_mapped_type_clause";
    readonly id: 368;
    readonly enumName: "IndexSignatureMappedTypeClause";
    readonly cName: "sym__index_signature_mapped_type_clause";
}, {
    readonly name: "_ambient_declaration_declaration";
    readonly id: 369;
    readonly enumName: "AmbientDeclarationDeclaration";
    readonly cName: "sym__ambient_declaration_declaration";
}, {
    readonly name: "_export_statement_default_from_arm_star_from";
    readonly id: 370;
    readonly enumName: "ExportStatementDefaultFromArmStarFrom";
    readonly cName: "sym__export_statement_default_from_arm_star_from";
}, {
    readonly name: "_export_statement_default_from_arm_ns_from";
    readonly id: 371;
    readonly enumName: "ExportStatementDefaultFromArmNsFrom";
    readonly cName: "sym__export_statement_default_from_arm_ns_from";
}, {
    readonly name: "_export_statement_default_from_arm_clause_from";
    readonly id: 372;
    readonly enumName: "ExportStatementDefaultFromArmClauseFrom";
    readonly cName: "sym__export_statement_default_from_arm_clause_from";
}, {
    readonly name: "_class_body_method_sig";
    readonly id: 375;
    readonly enumName: "ClassBodyMethodSig";
    readonly cName: "sym__class_body_method_sig";
}, {
    readonly name: "_class_body_member";
    readonly id: 376;
    readonly enumName: "ClassBodyMember";
    readonly cName: "sym__class_body_member";
}, {
    readonly name: "_for_header_lhs";
    readonly id: 377;
    readonly enumName: "ForHeaderLhs";
    readonly cName: "sym__for_header_lhs";
}, {
    readonly name: "_parenthesized_expression_sequence";
    readonly id: 381;
    readonly enumName: "ParenthesizedExpressionSequence";
    readonly cName: "sym__parenthesized_expression_sequence";
}, {
    readonly name: "_export_statement_type_export";
    readonly id: 382;
    readonly enumName: "ExportStatementTypeExport";
    readonly cName: "sym__export_statement_type_export";
}, {
    readonly name: "_export_statement_equals_export";
    readonly id: 383;
    readonly enumName: "ExportStatementEqualsExport";
    readonly cName: "sym__export_statement_equals_export";
}, {
    readonly name: "_export_statement_namespace_export";
    readonly id: 384;
    readonly enumName: "ExportStatementNamespaceExport";
    readonly cName: "sym__export_statement_namespace_export";
}, {
    readonly name: "_public_field_definition_accessor_opt";
    readonly id: 418;
    readonly enumName: "AliasPublicFieldDefinitionAccessorOpt";
    readonly cName: "alias_sym_public_field_definition_accessor_opt";
}, {
    readonly name: "_public_field_definition_declare_first";
    readonly id: 419;
    readonly enumName: "AliasPublicFieldDefinitionDeclareFirst";
    readonly cName: "alias_sym_public_field_definition_declare_first";
}, {
    readonly name: "_type_identifier";
    readonly id: 426;
    readonly enumName: "AliasTypeIdentifier";
    readonly cName: "alias_sym_type_identifier";
}];
export declare const enum TSFieldId {
    FieldAbstractMarker = 1,
    FieldAccessibilityModifier = 2,
    FieldAccessorKind = 3,
    FieldAlias = 4,
    FieldAlternative = 5,
    FieldArgument = 6,
    FieldArguments = 7,
    FieldAsserts = 8,
    FieldAsyncMarker = 9,
    FieldAutomaticSemicolon = 10,
    FieldBody = 11,
    FieldClassHeritage = 12,
    FieldClosing = 13,
    FieldCondition = 14,
    FieldConsequence = 15,
    FieldConstMarker = 16,
    FieldConstraint = 17,
    FieldConstructor = 18,
    FieldContents = 19,
    FieldDeclaration = 20,
    FieldDeclarators = 21,
    FieldDecorator = 22,
    FieldExportKind = 23,
    FieldExpression = 24,
    FieldExtendsTypeClause = 25,
    FieldFinalizer = 26,
    FieldFlags = 27,
    FieldFromClause = 28,
    FieldFunction = 29,
    FieldHandler = 30,
    FieldHashBangLine = 31,
    FieldIdentifier = 32,
    FieldImportAttribute = 33,
    FieldImportClause = 34,
    FieldImportKind = 35,
    FieldIncrement = 36,
    FieldIndex = 37,
    FieldIndexType = 38,
    FieldInitializer = 39,
    FieldKey = 40,
    FieldKind = 41,
    FieldLabel = 42,
    FieldLeft = 43,
    FieldMembers = 44,
    FieldModule = 45,
    FieldName = 46,
    FieldObject = 47,
    FieldOpening = 48,
    FieldOperator = 49,
    FieldOptionalChain = 50,
    FieldOptionalMarker = 51,
    FieldOptionalityMarker = 52,
    FieldOverrideModifier = 53,
    FieldParameter = 54,
    FieldParameters = 55,
    FieldPattern = 56,
    FieldPrimaryType = 57,
    FieldProperty = 58,
    FieldReadonlyMarker = 59,
    FieldReturnType = 60,
    FieldRight = 61,
    FieldSemicolon = 62,
    FieldSign = 63,
    FieldSource = 64,
    FieldStatement = 65,
    FieldStatements = 66,
    FieldStaticMarker = 67,
    FieldType = 68,
    FieldTypeAnnotation = 70,
    FieldTypeArguments = 71,
    FieldTypeIdentifier = 72,
    FieldTypeParameters = 73,
    FieldTypePredicate = 74,
    FieldUsingMarker = 75,
    FieldValue = 76
}
export declare const TREE_SITTER_FIELD_ID_BY_NAME: {
    readonly abstract_marker: TSFieldId.FieldAbstractMarker;
    readonly accessibility_modifier: TSFieldId.FieldAccessibilityModifier;
    readonly accessor_kind: TSFieldId.FieldAccessorKind;
    readonly alias: TSFieldId.FieldAlias;
    readonly alternative: TSFieldId.FieldAlternative;
    readonly argument: TSFieldId.FieldArgument;
    readonly arguments: TSFieldId.FieldArguments;
    readonly asserts: TSFieldId.FieldAsserts;
    readonly async_marker: TSFieldId.FieldAsyncMarker;
    readonly automatic_semicolon: TSFieldId.FieldAutomaticSemicolon;
    readonly body: TSFieldId.FieldBody;
    readonly class_heritage: TSFieldId.FieldClassHeritage;
    readonly closing: TSFieldId.FieldClosing;
    readonly condition: TSFieldId.FieldCondition;
    readonly consequence: TSFieldId.FieldConsequence;
    readonly const_marker: TSFieldId.FieldConstMarker;
    readonly constraint: TSFieldId.FieldConstraint;
    readonly constructor: TSFieldId.FieldConstructor;
    readonly contents: TSFieldId.FieldContents;
    readonly declaration: TSFieldId.FieldDeclaration;
    readonly declarators: TSFieldId.FieldDeclarators;
    readonly decorator: TSFieldId.FieldDecorator;
    readonly export_kind: TSFieldId.FieldExportKind;
    readonly expression: TSFieldId.FieldExpression;
    readonly extends_type_clause: TSFieldId.FieldExtendsTypeClause;
    readonly finalizer: TSFieldId.FieldFinalizer;
    readonly flags: TSFieldId.FieldFlags;
    readonly from_clause: TSFieldId.FieldFromClause;
    readonly function: TSFieldId.FieldFunction;
    readonly handler: TSFieldId.FieldHandler;
    readonly hash_bang_line: TSFieldId.FieldHashBangLine;
    readonly identifier: TSFieldId.FieldIdentifier;
    readonly import_attribute: TSFieldId.FieldImportAttribute;
    readonly import_clause: TSFieldId.FieldImportClause;
    readonly import_kind: TSFieldId.FieldImportKind;
    readonly increment: TSFieldId.FieldIncrement;
    readonly index: TSFieldId.FieldIndex;
    readonly index_type: TSFieldId.FieldIndexType;
    readonly initializer: TSFieldId.FieldInitializer;
    readonly key: TSFieldId.FieldKey;
    readonly kind: TSFieldId.FieldKind;
    readonly label: TSFieldId.FieldLabel;
    readonly left: TSFieldId.FieldLeft;
    readonly members: TSFieldId.FieldMembers;
    readonly module: TSFieldId.FieldModule;
    readonly name: TSFieldId.FieldName;
    readonly object: TSFieldId.FieldObject;
    readonly opening: TSFieldId.FieldOpening;
    readonly operator: TSFieldId.FieldOperator;
    readonly optional_chain: TSFieldId.FieldOptionalChain;
    readonly optional_marker: TSFieldId.FieldOptionalMarker;
    readonly optionality_marker: TSFieldId.FieldOptionalityMarker;
    readonly override_modifier: TSFieldId.FieldOverrideModifier;
    readonly parameter: TSFieldId.FieldParameter;
    readonly parameters: TSFieldId.FieldParameters;
    readonly pattern: TSFieldId.FieldPattern;
    readonly primary_type: TSFieldId.FieldPrimaryType;
    readonly property: TSFieldId.FieldProperty;
    readonly readonly_marker: TSFieldId.FieldReadonlyMarker;
    readonly return_type: TSFieldId.FieldReturnType;
    readonly right: TSFieldId.FieldRight;
    readonly semicolon: TSFieldId.FieldSemicolon;
    readonly sign: TSFieldId.FieldSign;
    readonly source: TSFieldId.FieldSource;
    readonly statement: TSFieldId.FieldStatement;
    readonly statements: TSFieldId.FieldStatements;
    readonly static_marker: TSFieldId.FieldStaticMarker;
    readonly type: TSFieldId.FieldType;
    readonly type_annotation: TSFieldId.FieldTypeAnnotation;
    readonly type_arguments: TSFieldId.FieldTypeArguments;
    readonly type_identifier: TSFieldId.FieldTypeIdentifier;
    readonly type_parameters: TSFieldId.FieldTypeParameters;
    readonly type_predicate: TSFieldId.FieldTypePredicate;
    readonly using_marker: TSFieldId.FieldUsingMarker;
    readonly value: TSFieldId.FieldValue;
};
export declare const TREE_SITTER_FIELD_NAME_BY_ID: {
    readonly 1: "abstract_marker";
    readonly 2: "accessibility_modifier";
    readonly 3: "accessor_kind";
    readonly 4: "alias";
    readonly 5: "alternative";
    readonly 6: "argument";
    readonly 7: "arguments";
    readonly 8: "asserts";
    readonly 9: "async_marker";
    readonly 10: "automatic_semicolon";
    readonly 11: "body";
    readonly 12: "class_heritage";
    readonly 13: "closing";
    readonly 14: "condition";
    readonly 15: "consequence";
    readonly 16: "const_marker";
    readonly 17: "constraint";
    readonly 18: "constructor";
    readonly 19: "contents";
    readonly 20: "declaration";
    readonly 21: "declarators";
    readonly 22: "decorator";
    readonly 23: "export_kind";
    readonly 24: "expression";
    readonly 25: "extends_type_clause";
    readonly 26: "finalizer";
    readonly 27: "flags";
    readonly 28: "from_clause";
    readonly 29: "function";
    readonly 30: "handler";
    readonly 31: "hash_bang_line";
    readonly 32: "identifier";
    readonly 33: "import_attribute";
    readonly 34: "import_clause";
    readonly 35: "import_kind";
    readonly 36: "increment";
    readonly 37: "index";
    readonly 38: "index_type";
    readonly 39: "initializer";
    readonly 40: "key";
    readonly 41: "kind";
    readonly 42: "label";
    readonly 43: "left";
    readonly 44: "members";
    readonly 45: "module";
    readonly 46: "name";
    readonly 47: "object";
    readonly 48: "opening";
    readonly 49: "operator";
    readonly 50: "optional_chain";
    readonly 51: "optional_marker";
    readonly 52: "optionality_marker";
    readonly 53: "override_modifier";
    readonly 54: "parameter";
    readonly 55: "parameters";
    readonly 56: "pattern";
    readonly 57: "primary_type";
    readonly 58: "property";
    readonly 59: "readonly_marker";
    readonly 60: "return_type";
    readonly 61: "right";
    readonly 62: "semicolon";
    readonly 63: "sign";
    readonly 64: "source";
    readonly 65: "statement";
    readonly 66: "statements";
    readonly 67: "static_marker";
    readonly 68: "type";
    readonly 70: "type_annotation";
    readonly 71: "type_arguments";
    readonly 72: "type_identifier";
    readonly 73: "type_parameters";
    readonly 74: "type_predicate";
    readonly 75: "using_marker";
    readonly 76: "value";
};
export declare const TREE_SITTER_FIELD_ID_JSON: readonly [{
    readonly name: "abstract_marker";
    readonly id: 1;
    readonly enumName: "FieldAbstractMarker";
    readonly cName: "field_abstract_marker";
}, {
    readonly name: "accessibility_modifier";
    readonly id: 2;
    readonly enumName: "FieldAccessibilityModifier";
    readonly cName: "field_accessibility_modifier";
}, {
    readonly name: "accessor_kind";
    readonly id: 3;
    readonly enumName: "FieldAccessorKind";
    readonly cName: "field_accessor_kind";
}, {
    readonly name: "alias";
    readonly id: 4;
    readonly enumName: "FieldAlias";
    readonly cName: "field_alias";
}, {
    readonly name: "alternative";
    readonly id: 5;
    readonly enumName: "FieldAlternative";
    readonly cName: "field_alternative";
}, {
    readonly name: "argument";
    readonly id: 6;
    readonly enumName: "FieldArgument";
    readonly cName: "field_argument";
}, {
    readonly name: "arguments";
    readonly id: 7;
    readonly enumName: "FieldArguments";
    readonly cName: "field_arguments";
}, {
    readonly name: "asserts";
    readonly id: 8;
    readonly enumName: "FieldAsserts";
    readonly cName: "field_asserts";
}, {
    readonly name: "async_marker";
    readonly id: 9;
    readonly enumName: "FieldAsyncMarker";
    readonly cName: "field_async_marker";
}, {
    readonly name: "automatic_semicolon";
    readonly id: 10;
    readonly enumName: "FieldAutomaticSemicolon";
    readonly cName: "field_automatic_semicolon";
}, {
    readonly name: "body";
    readonly id: 11;
    readonly enumName: "FieldBody";
    readonly cName: "field_body";
}, {
    readonly name: "class_heritage";
    readonly id: 12;
    readonly enumName: "FieldClassHeritage";
    readonly cName: "field_class_heritage";
}, {
    readonly name: "closing";
    readonly id: 13;
    readonly enumName: "FieldClosing";
    readonly cName: "field_closing";
}, {
    readonly name: "condition";
    readonly id: 14;
    readonly enumName: "FieldCondition";
    readonly cName: "field_condition";
}, {
    readonly name: "consequence";
    readonly id: 15;
    readonly enumName: "FieldConsequence";
    readonly cName: "field_consequence";
}, {
    readonly name: "const_marker";
    readonly id: 16;
    readonly enumName: "FieldConstMarker";
    readonly cName: "field_const_marker";
}, {
    readonly name: "constraint";
    readonly id: 17;
    readonly enumName: "FieldConstraint";
    readonly cName: "field_constraint";
}, {
    readonly name: "constructor";
    readonly id: 18;
    readonly enumName: "FieldConstructor";
    readonly cName: "field_constructor";
}, {
    readonly name: "contents";
    readonly id: 19;
    readonly enumName: "FieldContents";
    readonly cName: "field_contents";
}, {
    readonly name: "declaration";
    readonly id: 20;
    readonly enumName: "FieldDeclaration";
    readonly cName: "field_declaration";
}, {
    readonly name: "declarators";
    readonly id: 21;
    readonly enumName: "FieldDeclarators";
    readonly cName: "field_declarators";
}, {
    readonly name: "decorator";
    readonly id: 22;
    readonly enumName: "FieldDecorator";
    readonly cName: "field_decorator";
}, {
    readonly name: "export_kind";
    readonly id: 23;
    readonly enumName: "FieldExportKind";
    readonly cName: "field_export_kind";
}, {
    readonly name: "expression";
    readonly id: 24;
    readonly enumName: "FieldExpression";
    readonly cName: "field_expression";
}, {
    readonly name: "extends_type_clause";
    readonly id: 25;
    readonly enumName: "FieldExtendsTypeClause";
    readonly cName: "field_extends_type_clause";
}, {
    readonly name: "finalizer";
    readonly id: 26;
    readonly enumName: "FieldFinalizer";
    readonly cName: "field_finalizer";
}, {
    readonly name: "flags";
    readonly id: 27;
    readonly enumName: "FieldFlags";
    readonly cName: "field_flags";
}, {
    readonly name: "from_clause";
    readonly id: 28;
    readonly enumName: "FieldFromClause";
    readonly cName: "field_from_clause";
}, {
    readonly name: "function";
    readonly id: 29;
    readonly enumName: "FieldFunction";
    readonly cName: "field_function";
}, {
    readonly name: "handler";
    readonly id: 30;
    readonly enumName: "FieldHandler";
    readonly cName: "field_handler";
}, {
    readonly name: "hash_bang_line";
    readonly id: 31;
    readonly enumName: "FieldHashBangLine";
    readonly cName: "field_hash_bang_line";
}, {
    readonly name: "identifier";
    readonly id: 32;
    readonly enumName: "FieldIdentifier";
    readonly cName: "field_identifier";
}, {
    readonly name: "import_attribute";
    readonly id: 33;
    readonly enumName: "FieldImportAttribute";
    readonly cName: "field_import_attribute";
}, {
    readonly name: "import_clause";
    readonly id: 34;
    readonly enumName: "FieldImportClause";
    readonly cName: "field_import_clause";
}, {
    readonly name: "import_kind";
    readonly id: 35;
    readonly enumName: "FieldImportKind";
    readonly cName: "field_import_kind";
}, {
    readonly name: "increment";
    readonly id: 36;
    readonly enumName: "FieldIncrement";
    readonly cName: "field_increment";
}, {
    readonly name: "index";
    readonly id: 37;
    readonly enumName: "FieldIndex";
    readonly cName: "field_index";
}, {
    readonly name: "index_type";
    readonly id: 38;
    readonly enumName: "FieldIndexType";
    readonly cName: "field_index_type";
}, {
    readonly name: "initializer";
    readonly id: 39;
    readonly enumName: "FieldInitializer";
    readonly cName: "field_initializer";
}, {
    readonly name: "key";
    readonly id: 40;
    readonly enumName: "FieldKey";
    readonly cName: "field_key";
}, {
    readonly name: "kind";
    readonly id: 41;
    readonly enumName: "FieldKind";
    readonly cName: "field_kind";
}, {
    readonly name: "label";
    readonly id: 42;
    readonly enumName: "FieldLabel";
    readonly cName: "field_label";
}, {
    readonly name: "left";
    readonly id: 43;
    readonly enumName: "FieldLeft";
    readonly cName: "field_left";
}, {
    readonly name: "members";
    readonly id: 44;
    readonly enumName: "FieldMembers";
    readonly cName: "field_members";
}, {
    readonly name: "module";
    readonly id: 45;
    readonly enumName: "FieldModule";
    readonly cName: "field_module";
}, {
    readonly name: "name";
    readonly id: 46;
    readonly enumName: "FieldName";
    readonly cName: "field_name";
}, {
    readonly name: "object";
    readonly id: 47;
    readonly enumName: "FieldObject";
    readonly cName: "field_object";
}, {
    readonly name: "opening";
    readonly id: 48;
    readonly enumName: "FieldOpening";
    readonly cName: "field_opening";
}, {
    readonly name: "operator";
    readonly id: 49;
    readonly enumName: "FieldOperator";
    readonly cName: "field_operator";
}, {
    readonly name: "optional_chain";
    readonly id: 50;
    readonly enumName: "FieldOptionalChain";
    readonly cName: "field_optional_chain";
}, {
    readonly name: "optional_marker";
    readonly id: 51;
    readonly enumName: "FieldOptionalMarker";
    readonly cName: "field_optional_marker";
}, {
    readonly name: "optionality_marker";
    readonly id: 52;
    readonly enumName: "FieldOptionalityMarker";
    readonly cName: "field_optionality_marker";
}, {
    readonly name: "override_modifier";
    readonly id: 53;
    readonly enumName: "FieldOverrideModifier";
    readonly cName: "field_override_modifier";
}, {
    readonly name: "parameter";
    readonly id: 54;
    readonly enumName: "FieldParameter";
    readonly cName: "field_parameter";
}, {
    readonly name: "parameters";
    readonly id: 55;
    readonly enumName: "FieldParameters";
    readonly cName: "field_parameters";
}, {
    readonly name: "pattern";
    readonly id: 56;
    readonly enumName: "FieldPattern";
    readonly cName: "field_pattern";
}, {
    readonly name: "primary_type";
    readonly id: 57;
    readonly enumName: "FieldPrimaryType";
    readonly cName: "field_primary_type";
}, {
    readonly name: "property";
    readonly id: 58;
    readonly enumName: "FieldProperty";
    readonly cName: "field_property";
}, {
    readonly name: "readonly_marker";
    readonly id: 59;
    readonly enumName: "FieldReadonlyMarker";
    readonly cName: "field_readonly_marker";
}, {
    readonly name: "return_type";
    readonly id: 60;
    readonly enumName: "FieldReturnType";
    readonly cName: "field_return_type";
}, {
    readonly name: "right";
    readonly id: 61;
    readonly enumName: "FieldRight";
    readonly cName: "field_right";
}, {
    readonly name: "semicolon";
    readonly id: 62;
    readonly enumName: "FieldSemicolon";
    readonly cName: "field_semicolon";
}, {
    readonly name: "sign";
    readonly id: 63;
    readonly enumName: "FieldSign";
    readonly cName: "field_sign";
}, {
    readonly name: "source";
    readonly id: 64;
    readonly enumName: "FieldSource";
    readonly cName: "field_source";
}, {
    readonly name: "statement";
    readonly id: 65;
    readonly enumName: "FieldStatement";
    readonly cName: "field_statement";
}, {
    readonly name: "statements";
    readonly id: 66;
    readonly enumName: "FieldStatements";
    readonly cName: "field_statements";
}, {
    readonly name: "static_marker";
    readonly id: 67;
    readonly enumName: "FieldStaticMarker";
    readonly cName: "field_static_marker";
}, {
    readonly name: "type";
    readonly id: 68;
    readonly enumName: "FieldType";
    readonly cName: "field_type";
}, {
    readonly name: "type_annotation";
    readonly id: 70;
    readonly enumName: "FieldTypeAnnotation";
    readonly cName: "field_type_annotation";
}, {
    readonly name: "type_arguments";
    readonly id: 71;
    readonly enumName: "FieldTypeArguments";
    readonly cName: "field_type_arguments";
}, {
    readonly name: "type_identifier";
    readonly id: 72;
    readonly enumName: "FieldTypeIdentifier";
    readonly cName: "field_type_identifier";
}, {
    readonly name: "type_parameters";
    readonly id: 73;
    readonly enumName: "FieldTypeParameters";
    readonly cName: "field_type_parameters";
}, {
    readonly name: "type_predicate";
    readonly id: 74;
    readonly enumName: "FieldTypePredicate";
    readonly cName: "field_type_predicate";
}, {
    readonly name: "using_marker";
    readonly id: 75;
    readonly enumName: "FieldUsingMarker";
    readonly cName: "field_using_marker";
}, {
    readonly name: "value";
    readonly id: 76;
    readonly enumName: "FieldValue";
    readonly cName: "field_value";
}];
/** Per-node-kind field metadata. */
export declare const FIELD_MAP: Record<NodeKind, ReadonlyArray<{
    name: string;
    required: boolean;
    multiple: boolean;
}>>;
/** Valid values for `__for_header_operator` nodes. */
export declare const __FOR_HEADER_OPERATORS: readonly ['in', 'of'];
export type ForHeaderOperatorValue = (typeof __FOR_HEADER_OPERATORS)[number];
/** Valid values for `__number_operator` nodes. */
export declare const __NUMBER_OPERATORS: readonly ['-', '+'];
export type NumberOperatorValue = (typeof __NUMBER_OPERATORS)[number];
/** Valid values for `_accessibility_modifier` nodes. */
export declare const _ACCESSIBILITY_MODIFIERS: readonly ['public', 'private', 'protected'];
export type AccessibilityModifierValue = (typeof _ACCESSIBILITY_MODIFIERS)[number];
/** Valid values for `_accessor_kind` nodes. */
export declare const _ACCESSOR_KINDS: readonly ['get', 'set', '*'];
export type AccessorKindValue = (typeof _ACCESSOR_KINDS)[number];
/** Valid values for `_augmented_assignment_expression_operator` nodes. */
export declare const _AUGMENTED_ASSIGNMENT_EXPRESSION_OPERATORS: readonly ['+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '>>=', '>>>=', '<<=', '**=', '&&=', '||=', '??='];
export type AugmentedAssignmentExpressionOperatorValue = (typeof _AUGMENTED_ASSIGNMENT_EXPRESSION_OPERATORS)[number];
/** Valid values for `_export_specifier_export_kind` nodes. */
export declare const _EXPORT_SPECIFIER_EXPORT_KINDS: readonly ['type', 'typeof'];
export type ExportSpecifierExportKindValue = (typeof _EXPORT_SPECIFIER_EXPORT_KINDS)[number];
/** Valid values for `_import_attribute_object` nodes. */
export declare const _IMPORT_ATTRIBUTE_OBJECTS: readonly ['with', 'assert'];
export type ImportAttributeObjectValue = (typeof _IMPORT_ATTRIBUTE_OBJECTS)[number];
/** Valid values for `_kind` nodes. */
export declare const _KINDS: readonly ['let', 'const'];
export type KindValue = (typeof _KINDS)[number];
/** Valid values for `_object_type_closing` nodes. */
export declare const _OBJECT_TYPE_CLOSINGS: readonly ['}', '|}'];
export type ObjectTypeClosingValue = (typeof _OBJECT_TYPE_CLOSINGS)[number];
/** Valid values for `_object_type_opening` nodes. */
export declare const _OBJECT_TYPE_OPENINGS: readonly ['{', '{|'];
export type ObjectTypeOpeningValue = (typeof _OBJECT_TYPE_OPENINGS)[number];
/** Valid values for `_operator` nodes. */
export declare const _OPERATORS: readonly ['++', '--'];
export type OperatorValue = (typeof _OPERATORS)[number];
/** Valid values for `_public_field_definition_optionality_marker` nodes. */
export declare const _PUBLIC_FIELD_DEFINITION_OPTIONALITY_MARKERS: readonly ['?', '!'];
export type PublicFieldDefinitionOptionalityMarkerValue = (typeof _PUBLIC_FIELD_DEFINITION_OPTIONALITY_MARKERS)[number];
/** Valid values for `_string_opening` nodes. */
export declare const _STRING_OPENINGS: readonly ['"', '\''];
export type StringOpeningValue = (typeof _STRING_OPENINGS)[number];
/** Valid values for `_unary_expression_operator` nodes. */
export declare const _UNARY_EXPRESSION_OPERATORS: readonly ['!', '~', '-', '+', 'typeof', 'void', 'delete'];
export type UnaryExpressionOperatorValue = (typeof _UNARY_EXPRESSION_OPERATORS)[number];
/** Valid values for `accessibility_modifier` nodes. */
export declare const ACCESSIBILITY_MODIFIERS: readonly ['public', 'private', 'protected'];
//# sourceMappingURL=consts.d.ts.map
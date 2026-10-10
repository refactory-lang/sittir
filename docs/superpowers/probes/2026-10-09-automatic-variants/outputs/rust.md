# rust

rust: labels 306; group 1 (supertype members) 91, live 91, member has its own flat key 82; group 2 (non-supertype arms) 215, live 195, unnamed 101, names a kind 21, has an arm route 5 (value arms 4), buildable only through the label 4, owner is an upstream rule 126; flattened routes 134, definedBy ≠ minted 4; automatically named parser kinds 1, named by a bindings claim 0

## Group 2: labels on arms of non-supertype choices

| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |
| --- | --- | --- | --- | --- | --- | --- | --- |
| expression_statement | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | expression_ending_with_block | symbol _expression_ending_with_block | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| macro_definition | arm1 | symbol macro_definition_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| macro_definition | arm2 | symbol macro_definition_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| macro_definition | arm3 | symbol macro_definition_arm3 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_tree_pattern | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition_pattern | (none) | literal "+" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition_pattern | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition_pattern | (none) | literal "?" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| fragment_specifier | (none) | literal "block" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "expr" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "expr_2021" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "ident" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "item" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "lifetime" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "literal" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "meta" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "pat" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "pat_param" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "path" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "stmt" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "tt" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "ty" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| fragment_specifier | (none) | literal "vis" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _tokens | token_tree | symbol token_tree | no | no arm route | tokenTree | no | upstream rule (needs a patches: entry) |
| _tokens | token_repetition | symbol token_repetition | no | no arm route | tokenRepetition | no | upstream rule (needs a patches: entry) |
| _tokens | metavariable | symbol metavariable | no | no arm route | metavariable | no | upstream rule (needs a patches: entry) |
| _tokens | non_special_token | alias non_special_token | no | no arm route | nonSpecialToken | no | upstream rule (needs a patches: entry) |
| token_tree | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition | (none) | literal "+" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| token_repetition | (none) | literal "?" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| non_special_token | literal | symbol _literal | no | no arm route | literal | no | upstream rule (needs a patches: entry) |
| non_special_token | identifier | symbol identifier | no | node arm | identifier | no | upstream rule (needs a patches: entry) |
| non_special_token | mutable_specifier | symbol mutable_specifier | no | value arm | mutableSpecifier | yes | upstream rule (needs a patches: entry) |
| non_special_token | self | symbol self | no | value arm | self | yes | upstream rule (needs a patches: entry) |
| non_special_token | super | symbol super | no | value arm | super | yes | upstream rule (needs a patches: entry) |
| non_special_token | crate | symbol crate | no | value arm | crate | yes | upstream rule (needs a patches: entry) |
| non_special_token | primitive_type | alias primitive_type | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "'" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "as" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "async" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "await" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "break" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "const" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "continue" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "default" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "enum" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "fn" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "for" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "gen" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "if" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "impl" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "let" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "loop" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "match" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "mod" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "pub" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "return" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "static" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "struct" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "trait" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "type" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "union" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "unsafe" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "use" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "where" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| non_special_token | (none) | literal "while" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| attribute | arm | symbol attribute_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| mod_item | (none) | literal ";" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| mod_item | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| foreign_mod_item | (none) | literal ";" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| foreign_mod_item | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| struct_item | arm1 | symbol struct_item_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| struct_item | arm2 | symbol struct_item_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| struct_item | (none) | literal ";" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| impl_item | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| impl_item | (none) | literal ";" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| visibility_modifier | arm | symbol visibility_modifier_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| bracketed_type | type | symbol _type | no | no arm route | type | no | grammar.sittir.ts (rule has an entry) |
| bracketed_type | qualified_type | symbol qualified_type | no | no arm route | qualifiedType | no | grammar.sittir.ts (rule has an entry) |
| function_type | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| function_type | arm | symbol function_type_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| bounded_type | lifetime | symbol lifetime | no | no arm route | lifetime | no | grammar.sittir.ts (rule has an entry) |
| bounded_type | type | symbol _type | no | no arm route | type | no | grammar.sittir.ts (rule has an entry) |
| bounded_type | use_bounds | symbol use_bounds | no | no arm route | useBounds | no | grammar.sittir.ts (rule has an entry) |
| pointer_type | (none) | literal "const" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| pointer_type | mutable_specifier | symbol mutable_specifier | no | no arm route | mutableSpecifier | no | grammar.sittir.ts (rule has an entry) |
| _expression_except_range | unary_expression | symbol unary_expression | no | no arm route | unaryExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | reference_expression | symbol reference_expression | no | no arm route | referenceExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | try_expression | symbol try_expression | no | no arm route | tryExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | binary_expression | symbol binary_expression | no | no arm route | binaryExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | assignment_expression | symbol assignment_expression | no | no arm route | assignmentExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | compound_assignment_expr | symbol compound_assignment_expr | no | no arm route | compoundAssignmentExpr | no | upstream rule (needs a patches: entry) |
| _expression_except_range | type_cast_expression | symbol type_cast_expression | no | no arm route | typeCastExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | call_expression | symbol call_expression | no | no arm route | callExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | return_expression | symbol return_expression | no | no arm route | returnExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | yield_expression | symbol yield_expression | no | no arm route | yieldExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | literal | symbol _literal | no | no arm route | literal | no | upstream rule (needs a patches: entry) |
| _expression_except_range | identifier | symbol identifier | no | no arm route | identifier | no | upstream rule (needs a patches: entry) |
| _expression_except_range | self | symbol self | no | no arm route | self | no | upstream rule (needs a patches: entry) |
| _expression_except_range | scoped_identifier | symbol scoped_identifier | no | no arm route | scopedIdentifier | no | upstream rule (needs a patches: entry) |
| _expression_except_range | generic_function | symbol generic_function | no | no arm route | genericFunction | no | upstream rule (needs a patches: entry) |
| _expression_except_range | await_expression | symbol await_expression | no | no arm route | awaitExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | field_expression | symbol field_expression | no | no arm route | fieldExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | array_expression | symbol array_expression | no | no arm route | arrayExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | tuple_expression | symbol tuple_expression | no | no arm route | tupleExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | macro_invocation | symbol macro_invocation | no | no arm route | macroInvocation | no | upstream rule (needs a patches: entry) |
| _expression_except_range | unit_expression | symbol unit_expression | no | no arm route | unitExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | break_expression | symbol break_expression | no | no arm route | breakExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | continue_expression | symbol continue_expression | no | no arm route | continueExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | index_expression | symbol index_expression | no | no arm route | indexExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | metavariable | symbol metavariable | no | no arm route | metavariable | no | upstream rule (needs a patches: entry) |
| _expression_except_range | closure_expression | symbol closure_expression | no | no arm route | closureExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | parenthesized_expression | symbol parenthesized_expression | no | no arm route | parenthesizedExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | struct_expression | symbol struct_expression | no | no arm route | structExpression | no | upstream rule (needs a patches: entry) |
| _expression_except_range | expression_ending_with_block | symbol _expression_ending_with_block | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | unsafe_block | symbol unsafe_block | no | no arm route | unsafeBlock | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | async_block | symbol async_block | no | no arm route | asyncBlock | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | gen_block | symbol gen_block | no | no arm route | genBlock | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | try_block | symbol try_block | no | no arm route | tryBlock | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | block | symbol block | no | no arm route | block | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | if_expression | symbol if_expression | no | no arm route | ifExpression | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | match_expression | symbol match_expression | no | no arm route | matchExpression | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | while_expression | symbol while_expression | no | no arm route | whileExpression | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | loop_expression | symbol loop_expression | no | no arm route | loopExpression | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | for_expression | symbol for_expression | no | no arm route | forExpression | no | upstream rule (needs a patches: entry) |
| _expression_ending_with_block | const_block | symbol const_block | no | no arm route | constBlock | no | upstream rule (needs a patches: entry) |
| delim_token_tree | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| range_expression | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| range_expression | (none) | literal ".." | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| unary_expression | (none) | literal "-" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| unary_expression | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| unary_expression | (none) | literal "!" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| reference_expression | arm | symbol reference_expression_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| reference_expression | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| binary_expression | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| return_expression | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| return_expression | (none) | literal "return" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| yield_expression | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| yield_expression | (none) | literal "yield" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| array_expression | arm | symbol array_expression_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| array_expression | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _let_chain | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| else_clause | block | symbol block | no | no arm route | block | no | grammar.sittir.ts (rule has an entry) |
| else_clause | if_expression | symbol if_expression | no | no arm route | ifExpression | no | grammar.sittir.ts (rule has an entry) |
| match_arm | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| closure_expression | arm | symbol closure_expression_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| closure_expression | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| generic_pattern | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| generic_pattern | scoped_identifier | symbol scoped_identifier | no | no arm route | scopedIdentifier | no | grammar.sittir.ts (rule has an entry) |
| field_pattern | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| field_pattern | arm | symbol field_pattern_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| range_pattern | arm2 | symbol range_pattern_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| range_pattern | arm3 | symbol range_pattern_arm3 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| or_pattern | arm | symbol or_pattern_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| or_pattern | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| negative_literal | integer_literal | symbol integer_literal | no | no arm route | integerLiteral | no | grammar.sittir.ts (rule has an entry) |
| negative_literal | float_literal | symbol float_literal | no | no arm route | floatLiteral | no | grammar.sittir.ts (rule has an entry) |
| boolean_literal | (none) | literal "true" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| boolean_literal | (none) | literal "false" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| comment | line_comment | symbol line_comment | no | no arm route | lineComment | no | grammar.sittir.ts (rule has an entry) |
| comment | block_comment | symbol block_comment | no | no arm route | blockComment | no | grammar.sittir.ts (rule has an entry) |
| line_comment | arm1 | symbol line_comment_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| line_comment | arm2 | symbol line_comment_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| line_comment | arm3 | symbol line_comment_arm3 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| line_comment | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| block_comment | arm1 | symbol block_comment_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| block_comment | arm2 | symbol block_comment_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| block_comment | content | symbol _block_comment_content | no | no arm route | blockCommentContent | no | grammar.sittir.ts (rule has an entry) |
| _path | self | symbol self | no | no arm route | self | no | upstream rule (needs a patches: entry) |
| _path | metavariable | symbol metavariable | no | no arm route | metavariable | no | upstream rule (needs a patches: entry) |
| _path | super | symbol super | no | no arm route | super | no | upstream rule (needs a patches: entry) |
| _path | crate | symbol crate | no | no arm route | crate | no | upstream rule (needs a patches: entry) |
| _path | identifier | symbol identifier | no | no arm route | identifier | no | upstream rule (needs a patches: entry) |
| _path | scoped_identifier | symbol scoped_identifier | no | no arm route | scopedIdentifier | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "u8" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "i8" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "u16" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "i16" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "u32" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "i32" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "u64" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "i64" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "u128" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "i128" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "isize" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "usize" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "f32" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "f64" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "bool" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "str" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| primitive_type | (none) | literal "char" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| range_expression | bare | alias range_expression_bare | yes | no arm route | rangeExpressionBare | no | grammar.sittir.ts (rule has an entry) |

## Flattened routes: link provenance (definedBy) vs the minted split

| parent | child | label | minted | definedBy |
| --- | --- | --- | --- | --- |
| _token_pattern | non_special_token | non_special | no | override |
| _tokens | non_special_token | non_special_token | no | override |
| _type | primitive_type | primitive | no | override |
| _condition | _let_chain | let_chain | no | override |

## Automatically named parser kinds: range_expression_bare

Named by a bindings claim: (none)

## Group 1: labels on supertype members

| supertype | label | member | own flat key |
| --- | --- | --- | --- |
| _statement | expression | expression_statement | expressionStatement |
| _statement | declaration | _declaration_statement | declarationStatement |
| _declaration_statement | const | const_item | constItem |
| _declaration_statement | macro_invocation | macro_invocation | macroInvocation |
| _declaration_statement | macro | macro_definition | macroDefinition |
| _declaration_statement | empty | empty_statement | emptyStatement |
| _declaration_statement | attribute | attribute_item | attributeItem |
| _declaration_statement | inner_attribute | inner_attribute_item | innerAttributeItem |
| _declaration_statement | mod | mod_item | modItem |
| _declaration_statement | foreign_mod | foreign_mod_item | foreignModItem |
| _declaration_statement | struct | struct_item | structItem |
| _declaration_statement | union | union_item | unionItem |
| _declaration_statement | enum | enum_item | enumItem |
| _declaration_statement | type | type_item | typeItem |
| _declaration_statement | function | function_item | functionItem |
| _declaration_statement | function_signature | function_signature_item | functionSignatureItem |
| _declaration_statement | impl | impl_item | implItem |
| _declaration_statement | trait | trait_item | traitItem |
| _declaration_statement | associated | associated_type | associatedType |
| _declaration_statement | let | let_declaration | letDeclaration |
| _declaration_statement | use | use_declaration | useDeclaration |
| _declaration_statement | extern_crate | extern_crate_declaration | externCrateDeclaration |
| _declaration_statement | static | static_item | staticItem |
| _token_pattern | tree | token_tree_pattern | tokenTreePattern |
| _token_pattern | repetition | token_repetition_pattern | tokenRepetitionPattern |
| _token_pattern | binding | token_binding_pattern | tokenBindingPattern |
| _token_pattern | metavariable | metavariable | metavariable |
| _token_pattern | non_special | non_special_token | nonSpecialToken |
| _use_clause | path | _path | — |
| _use_clause | as | use_as_clause | useAsClause |
| _use_clause | list | use_list | useList |
| _use_clause | scoped_list | scoped_use_list | scopedUseList |
| _use_clause | wildcard | use_wildcard | useWildcard |
| _type | abstract | abstract_type | abstractType |
| _type | reference | reference_type | referenceType |
| _type | metavariable | metavariable | metavariable |
| _type | pointer | pointer_type | pointerType |
| _type | generic | generic_type | genericType |
| _type | scoped_identifier | scoped_type_identifier | scopedTypeIdentifier |
| _type | tuple | tuple_type | tupleType |
| _type | unit | unit_type | unitType |
| _type | array | array_type | arrayType |
| _type | function | function_type | functionType |
| _type | identifier | _type_identifier | — |
| _type | macro_invocation | macro_invocation | macroInvocation |
| _type | never | never_type | neverType |
| _type | dynamic | dynamic_type | dynamicType |
| _type | bounded | bounded_type | boundedType |
| _type | removed_trait_bound | removed_trait_bound | removedTraitBound |
| _type | primitive | primitive_type | — |
| _expression | except_range | _expression_except_range | — |
| _expression | range | range_expression | rangeExpression |
| _delim_tokens | non_token | _non_delim_token | — |
| _delim_tokens | token_tree | delim_token_tree | delimTokenTree |
| _non_delim_token | special | non_special_token | nonSpecialToken |
| _non_delim_token | (none) | "$" | — |
| _condition | expression | _expression | expression |
| _condition | let | let_condition | letCondition |
| _condition | let_chain | let_chain | letChain |
| _pattern | literal | _literal_pattern | literalPattern |
| _pattern | identifier | identifier | identifier |
| _pattern | scoped_identifier | scoped_identifier | scopedIdentifier |
| _pattern | generic | generic_pattern | genericPattern |
| _pattern | tuple | tuple_pattern | tuplePattern |
| _pattern | tuple_struct | tuple_struct_pattern | tupleStructPattern |
| _pattern | struct | struct_pattern | structPattern |
| _pattern | ref | ref_pattern | refPattern |
| _pattern | slice | slice_pattern | slicePattern |
| _pattern | captured | captured_pattern | capturedPattern |
| _pattern | reference | reference_pattern | referencePattern |
| _pattern | remaining_field | remaining_field_pattern | remainingFieldPattern |
| _pattern | mut | mut_pattern | mutPattern |
| _pattern | range | range_pattern | rangePattern |
| _pattern | or | or_pattern | orPattern |
| _pattern | const_block | const_block | constBlock |
| _pattern | macro_invocation | macro_invocation | macroInvocation |
| _pattern | (none) | "_" | — |
| _literal | string | string_literal | stringLiteral |
| _literal | raw_string | raw_string_literal | rawStringLiteral |
| _literal | char | char_literal | charLiteral |
| _literal | boolean | boolean_literal | — |
| _literal | integer | integer_literal | integerLiteral |
| _literal | float | float_literal | floatLiteral |
| _literal_pattern | string | string_literal | stringLiteral |
| _literal_pattern | raw_string | raw_string_literal | rawStringLiteral |
| _literal_pattern | char | char_literal | charLiteral |
| _literal_pattern | boolean | boolean_literal | — |
| _literal_pattern | integer | integer_literal | integerLiteral |
| _literal_pattern | float | float_literal | floatLiteral |
| _literal_pattern | negative | negative_literal | negativeLiteral |
| _pattern | wildcard | wildcard_pattern | wildcardPattern |

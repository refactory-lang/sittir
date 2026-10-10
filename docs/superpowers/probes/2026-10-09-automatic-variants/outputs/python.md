# python

python: labels 192; group 1 (supertype members) 91, live 91, member has its own flat key 88; group 2 (non-supertype arms) 101, live 85, unnamed 16, names a kind 8, has an arm route 16 (value arms 1), buildable only through the label 4, owner is an upstream rule 10; flattened routes 85, definedBy ≠ minted 0; automatically named parser kinds 0, named by a bindings claim 0

## Group 2: labels on arms of non-supertype choices

| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |
| --- | --- | --- | --- | --- | --- | --- | --- |
| future_import_statement | import_list | alias import_list | no | node arm | importList | no | grammar.sittir.ts (rule has an entry) |
| future_import_statement | arm | symbol future_import_statement_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_from_statement | wildcard_import | symbol wildcard_import | no | value arm | wildcardImport | yes | grammar.sittir.ts (rule has an entry) |
| import_from_statement | import_list | alias import_list | no | node arm | importList | no | grammar.sittir.ts (rule has an entry) |
| import_from_statement | future_import_statement_arm | symbol future_import_statement_arm | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| print_statement | arm1 | symbol print_statement_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| print_statement | arm2 | symbol print_statement_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | expression | symbol expression | no | no arm route | expression | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | assignment | symbol assignment | no | no arm route | assignment | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | augmented_assignment | symbol augmented_assignment | no | node arm | augmentedAssignment | no | grammar.sittir.ts (rule has an entry) |
| expression_statement | yield | symbol yield | no | node arm | yield | no | grammar.sittir.ts (rule has an entry) |
| _expressions | expression | symbol expression | no | no arm route | expression | no | upstream rule (needs a patches: entry) |
| _expressions | expression_list | symbol expression_list | no | no arm route | expressionList | no | upstream rule (needs a patches: entry) |
| match_block | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| match_block | newline | symbol _newline | no | no arm route | newline | no | upstream rule (needs a patches: entry) |
| except_clause | arm | symbol except_clause_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| with_clause | with_items | symbol with_items | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| with_clause | arm | symbol with_clause_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_list_splat | parenthesized_list_splat | symbol parenthesized_list_splat | no | no arm route | parenthesizedListSplat | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_list_splat | list_splat | symbol list_splat | no | no arm route | listSplat | no | grammar.sittir.ts (rule has an entry) |
| _suite | simple_statements | alias simple_statements | no | no arm route | simpleStatements | no | grammar.sittir.ts (rule has an entry) |
| _suite | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _suite | newline | alias newline | no | no arm route | newline | no | grammar.sittir.ts (rule has an entry) |
| case_pattern | as_pattern_as_pattern | alias as_pattern_as_pattern | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| case_pattern | keyword_pattern | symbol keyword_pattern | no | node arm | keywordPattern | no | grammar.sittir.ts (rule has an entry) |
| case_pattern | simple_pattern | alias simple_pattern | no | node arm | simplePattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | class_pattern | symbol class_pattern | no | no arm route | classPattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | splat_pattern | symbol splat_pattern | no | no arm route | splatPattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | union_pattern | symbol union_pattern | no | no arm route | unionPattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | list_pattern_list_pattern | alias list_pattern_list_pattern | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | tuple_pattern_tuple_pattern | alias tuple_pattern_tuple_pattern | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | dict_pattern | symbol dict_pattern | no | no arm route | dictPattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | string | symbol string | no | no arm route | string | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | concatenated_string | symbol concatenated_string | no | no arm route | concatenatedString | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | true | symbol true | no | no arm route | true | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | false | symbol false | no | no arm route | false | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | none | symbol none | no | no arm route | none | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | arm | symbol simple_pattern_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | complex_pattern | symbol complex_pattern | no | no arm route | complexPattern | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | dotted_name | symbol dotted_name | no | no arm route | dottedName | no | grammar.sittir.ts (rule has an entry) |
| _simple_pattern | (none) | literal "_" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| splat_pattern | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| splat_pattern | (none) | literal "**" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| splat_pattern | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| splat_pattern | (none) | literal "_" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| complex_pattern | integer | symbol integer | no | no arm route | integer | no | grammar.sittir.ts (rule has an entry) |
| complex_pattern | float | symbol float | no | no arm route | float | no | grammar.sittir.ts (rule has an entry) |
| complex_pattern | (none) | literal "+" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| complex_pattern | (none) | literal "-" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| list_splat_pattern | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| list_splat_pattern | keyword_identifier | symbol keyword_identifier | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| list_splat_pattern | subscript | symbol subscript | no | no arm route | subscript | no | grammar.sittir.ts (rule has an entry) |
| list_splat_pattern | attribute | symbol attribute | no | no arm route | attribute | no | grammar.sittir.ts (rule has an entry) |
| dictionary_splat_pattern | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| dictionary_splat_pattern | keyword_identifier | symbol keyword_identifier | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| dictionary_splat_pattern | subscript | symbol subscript | no | no arm route | subscript | no | grammar.sittir.ts (rule has an entry) |
| dictionary_splat_pattern | attribute | symbol attribute | no | no arm route | attribute | no | grammar.sittir.ts (rule has an entry) |
| boolean_operator | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| binary_operator | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| assignment | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| assignment | arm | symbol assignment_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _left_hand_side | pattern | symbol pattern | no | no arm route | pattern | no | upstream rule (needs a patches: entry) |
| _left_hand_side | pattern_list | symbol pattern_list | no | no arm route | patternList | no | upstream rule (needs a patches: entry) |
| yield | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| typed_parameter | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| typed_parameter | list_splat_pattern | symbol list_splat_pattern | no | no arm route | listSplatPattern | no | grammar.sittir.ts (rule has an entry) |
| typed_parameter | dictionary_splat_pattern | symbol dictionary_splat_pattern | no | no arm route | dictionarySplatPattern | no | grammar.sittir.ts (rule has an entry) |
| type | expression | symbol expression | no | no arm route | expression | no | grammar.sittir.ts (rule has an entry) |
| type | splat_type | symbol splat_type | no | node arm | splatType | no | grammar.sittir.ts (rule has an entry) |
| type | generic_type | symbol generic_type | no | node arm | genericType | no | grammar.sittir.ts (rule has an entry) |
| type | union_type | symbol union_type | no | node arm | unionType | no | grammar.sittir.ts (rule has an entry) |
| type | constrained_type | symbol constrained_type | no | node arm | constrainedType | no | grammar.sittir.ts (rule has an entry) |
| type | member_type | symbol member_type | no | node arm | memberType | no | grammar.sittir.ts (rule has an entry) |
| splat_type | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| splat_type | (none) | literal "**" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| generic_type | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_expression | expression | symbol expression | no | no arm route | expression | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_expression | yield | symbol yield | no | no arm route | yield | no | grammar.sittir.ts (rule has an entry) |
| format_specifier | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| format_specifier | format_expression | alias format_expression | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| case_pattern | case_as_pattern | alias case_as_pattern | no | node arm | caseAsPattern | no | grammar.sittir.ts (rule has an entry) |
| import_from_statement | parenthesized_import_list | alias parenthesized_import_list | no | node arm | — | yes | grammar.sittir.ts (rule has an entry) |
| future_import_statement | parenthesized_import_list | alias parenthesized_import_list | no | node arm | — | yes | grammar.sittir.ts (rule has an entry) |
| yield | from_clause | alias yield_from_clause | yes | node arm | — | yes | upstream rule (needs a patches: entry) |

## Flattened routes: link provenance (definedBy) vs the minted split

| parent | child | label | minted | definedBy |
| --- | --- | --- | --- | --- |

## Automatically named parser kinds: (none)

Named by a bindings claim: (none)

## Group 1: labels on supertype members

| supertype | label | member | own flat key |
| --- | --- | --- | --- |
| _statement | simple_statements | simple_statements | simpleStatements |
| _statement | compound | _compound_statement | compoundStatement |
| _simple_statement | future_import | future_import_statement | futureImportStatement |
| _simple_statement | import | import_statement | importStatement |
| _simple_statement | import_from | import_from_statement | importFromStatement |
| _simple_statement | print | print_statement | printStatement |
| _simple_statement | assert | assert_statement | assertStatement |
| _simple_statement | expression | expression_statement | expressionStatement |
| _simple_statement | return | return_statement | returnStatement |
| _simple_statement | delete | delete_statement | deleteStatement |
| _simple_statement | raise | raise_statement | raiseStatement |
| _simple_statement | pass | pass_statement | passStatement |
| _simple_statement | break | break_statement | breakStatement |
| _simple_statement | continue | continue_statement | continueStatement |
| _simple_statement | global | global_statement | globalStatement |
| _simple_statement | nonlocal | nonlocal_statement | nonlocalStatement |
| _simple_statement | exec | exec_statement | execStatement |
| _simple_statement | type_alias | type_alias_statement | typeAliasStatement |
| _named_expression_lhs | identifier | identifier | identifier |
| _named_expression_lhs | keyword_identifier | keyword_identifier | — |
| _compound_statement | if | if_statement | ifStatement |
| _compound_statement | for | for_statement | forStatement |
| _compound_statement | while | while_statement | whileStatement |
| _compound_statement | try | try_statement | tryStatement |
| _compound_statement | with | with_statement | withStatement |
| _compound_statement | function | function_definition | functionDefinition |
| _compound_statement | class | class_definition | classDefinition |
| _compound_statement | decorated | decorated_definition | decoratedDefinition |
| _compound_statement | match | match_statement | matchStatement |
| parameter | identifier | identifier | identifier |
| parameter | typed | typed_parameter | typedParameter |
| parameter | default | default_parameter | defaultParameter |
| parameter | typed_default | typed_default_parameter | typedDefaultParameter |
| parameter | list_splat | list_splat_pattern | listSplatPattern |
| parameter | tuple | tuple_pattern | tuplePattern |
| parameter | keyword_separator | keyword_separator | keywordSeparator |
| parameter | positional_separator | positional_separator | positionalSeparator |
| parameter | dictionary_splat | dictionary_splat_pattern | dictionarySplatPattern |
| pattern | identifier | identifier | identifier |
| pattern | keyword_identifier | keyword_identifier | — |
| pattern | subscript | subscript | subscript |
| pattern | attribute | attribute | attribute |
| pattern | list_splat | list_splat_pattern | listSplatPattern |
| pattern | tuple | tuple_pattern | tuplePattern |
| pattern | list | list_pattern | listPattern |
| _expression_within_for_in_clause | expression | expression | expression |
| _expression_within_for_in_clause | lambda | lambda_within_for_in_clause | lambdaWithinForInClause |
| expression | comparison | comparison_operator | comparisonOperator |
| expression | not | not_operator | notOperator |
| expression | boolean | boolean_operator | booleanOperator |
| expression | lambda | lambda | lambda |
| expression | primary | primary_expression | primaryExpression |
| expression | conditional | conditional_expression | conditionalExpression |
| expression | named | named_expression | namedExpression |
| expression | as | as_pattern | asPattern |
| primary_expression | await | await | await |
| primary_expression | binary | binary_operator | binaryOperator |
| primary_expression | identifier | identifier | identifier |
| primary_expression | keyword_identifier | keyword_identifier | — |
| primary_expression | string | string | string |
| primary_expression | concatenated_string | concatenated_string | concatenatedString |
| primary_expression | integer | integer | integer |
| primary_expression | float | float | float |
| primary_expression | true | true | true |
| primary_expression | false | false | false |
| primary_expression | none | none | none |
| primary_expression | unary | unary_operator | unaryOperator |
| primary_expression | attribute | attribute | attribute |
| primary_expression | subscript | subscript | subscript |
| primary_expression | call | call | call |
| primary_expression | list | list | list |
| primary_expression | list_comprehension | list_comprehension | listComprehension |
| primary_expression | dictionary | dictionary | dictionary |
| primary_expression | dictionary_comprehension | dictionary_comprehension | dictionaryComprehension |
| primary_expression | set | set | set |
| primary_expression | set_comprehension | set_comprehension | setComprehension |
| primary_expression | tuple | tuple | tuple |
| primary_expression | parenthesized | parenthesized_expression | parenthesizedExpression |
| primary_expression | generator | generator_expression | generatorExpression |
| primary_expression | ellipsis | ellipsis | ellipsis |
| primary_expression | list_splat | list_splat_pattern | listSplatPattern |
| _right_hand_side | expression | expression | expression |
| _right_hand_side | expression_list | expression_list | expressionList |
| _right_hand_side | assignment | assignment | assignment |
| _right_hand_side | augmented_assignment | augmented_assignment | augmentedAssignment |
| _right_hand_side | pattern_list | pattern_list | patternList |
| _right_hand_side | yield | yield | yield |
| _f_expression | expression | expression | expression |
| _f_expression | list | expression_list | expressionList |
| _f_expression | pattern_list | pattern_list | patternList |
| _f_expression | yield | yield | yield |

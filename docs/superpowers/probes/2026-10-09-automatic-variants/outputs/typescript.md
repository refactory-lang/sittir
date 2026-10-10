# typescript

typescript: labels 324; group 1 (supertype members) 130, live 130, member has its own flat key 122; group 2 (non-supertype arms) 194, live 121, unnamed 53, names a kind 31, has an arm route 9 (value arms 4), buildable only through the label 4, owner is an upstream rule 28; flattened routes 144, definedBy ≠ minted 6; automatically named parser kinds 3, named by a bindings claim 3 [decorator_member_expression, decorator_call_expression, decorator_parenthesized_expression]

## Group 2: labels on arms of non-supertype choices

| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |
| --- | --- | --- | --- | --- | --- | --- | --- |
| export_statement | arm5 | symbol export_statement_arm5 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| export_statement | arm6 | symbol export_statement_arm6 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| export_statement | arm7 | symbol export_statement_arm7 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| export_statement | arm8 | symbol export_statement_arm8 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| export_specifier | (none) | literal "type" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| export_specifier | (none) | literal "typeof" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_statement | (none) | literal "type" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_statement | (none) | literal "typeof" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_statement | arm | symbol import_statement_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_statement | import_require_clause | symbol import_require_clause | no | no arm route | importRequireClause | no | grammar.sittir.ts (rule has an entry) |
| import_statement | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| import_clause | arm | symbol import_clause_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_specifier | (none) | literal "type" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_specifier | (none) | literal "typeof" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_specifier | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| import_specifier | arm | symbol import_specifier_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_attribute | (none) | literal "with" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_attribute | (none) | literal "assert" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| variable_declarator | arm1 | symbol variable_declarator_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| variable_declarator | arm2 | symbol variable_declarator_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| for_statement | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| _for_header | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| _for_header | arm1 | symbol for_header_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| _for_header | arm2 | symbol for_header_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_expression | arm | symbol parenthesized_expression_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| parenthesized_expression | sequence_expression | symbol sequence_expression | no | no arm route | sequenceExpression | no | grammar.sittir.ts (rule has an entry) |
| _expressions | expression | symbol expression | no | no arm route | expression | no | upstream rule (needs a patches: entry) |
| _expressions | sequence_expression | symbol sequence_expression | no | no arm route | sequenceExpression | no | upstream rule (needs a patches: entry) |
| yield_expression | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| class_heritage | arm | symbol class_heritage_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| arrow_function | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| arrow_function | arm1 | alias arrow_function_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| call_expression | arm1 | symbol call_expression_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| call_expression | arm2 | symbol call_expression_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| call_expression | arm3 | symbol call_expression_arm3 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| member_expression | (none) | literal "." | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| member_expression | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| _lhs_expression | member_expression | symbol member_expression | no | node arm | memberExpression | no | upstream rule (needs a patches: entry) |
| _lhs_expression | subscript_expression | symbol subscript_expression | no | node arm | subscriptExpression | no | upstream rule (needs a patches: entry) |
| _lhs_expression | identifier | symbol _identifier | no | no arm route | identifier | no | upstream rule (needs a patches: entry) |
| _lhs_expression | destructuring_pattern | symbol _destructuring_pattern | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _lhs_expression | non_null_expression | symbol non_null_expression | no | node arm | nonNullExpression | no | upstream rule (needs a patches: entry) |
| binary_expression | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| binary_expression | arm | symbol binary_expression_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| update_expression | arm1 | symbol update_expression_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| update_expression | arm2 | symbol update_expression_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| string | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| _identifier | undefined | symbol undefined | no | no arm route | undefined | no | upstream rule (needs a patches: entry) |
| _identifier | identifier | symbol identifier | no | no arm route | identifier | no | upstream rule (needs a patches: entry) |
| meta_property | arm1 | symbol meta_property_arm1 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| meta_property | arm2 | symbol meta_property_arm2 | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| decorator | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| decorator | member_expression | symbol decorator_member_expression | yes | no arm route | decoratorMemberExpression | no | grammar.sittir.ts (rule has an entry) |
| decorator | call_expression | symbol decorator_call_expression | yes | no arm route | decoratorCallExpression | no | grammar.sittir.ts (rule has an entry) |
| decorator | parenthesized_expression | symbol decorator_parenthesized_expression | yes | no arm route | decoratorParenthesizedExpression | no | grammar.sittir.ts (rule has an entry) |
| method_definition | (none) | literal "get" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| method_definition | (none) | literal "set" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| method_definition | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| public_field_definition | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| public_field_definition | (none) | literal "?" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| public_field_definition | (none) | literal "!" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| method_signature | (none) | literal "get" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| method_signature | (none) | literal "set" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| method_signature | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| abstract_method_signature | (none) | literal "get" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| abstract_method_signature | (none) | literal "set" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| abstract_method_signature | (none) | literal "*" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| function_signature | semicolon | symbol _semicolon | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| function_signature | automatic_semicolon | symbol _function_signature_automatic_semicolon | no | no arm route | functionSignatureAutomaticSemicolon | no | grammar.sittir.ts (rule has an entry) |
| decorator_parenthesized_expression | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| decorator_parenthesized_expression | decorator_member_expression | symbol decorator_member_expression | no | no arm route | decoratorMemberExpression | no | grammar.sittir.ts (rule has an entry) |
| decorator_parenthesized_expression | decorator_call_expression | symbol decorator_call_expression | no | no arm route | decoratorCallExpression | no | grammar.sittir.ts (rule has an entry) |
| as_expression | (none) | literal "const" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| as_expression | type | symbol type | no | no arm route | type | no | grammar.sittir.ts (rule has an entry) |
| ambient_declaration | (none) | symbol undefined | no | no arm route | undefined | no | grammar.sittir.ts (rule has an entry) |
| ambient_declaration | arm | symbol ambient_declaration_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| import_alias | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| import_alias | nested_identifier | symbol nested_identifier | no | no arm route | nestedIdentifier | no | grammar.sittir.ts (rule has an entry) |
| accessibility_modifier | (none) | literal "public" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| accessibility_modifier | (none) | literal "private" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| accessibility_modifier | (none) | literal "protected" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| asserts | type_predicate | symbol type_predicate | no | no arm route | typePredicate | no | grammar.sittir.ts (rule has an entry) |
| asserts | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| asserts | this | symbol this | no | no arm route | this | no | grammar.sittir.ts (rule has an entry) |
| template_type | primary_type | symbol primary_type | no | no arm route | primaryType | no | grammar.sittir.ts (rule has an entry) |
| template_type | infer_type | symbol infer_type | no | no arm route | inferType | no | grammar.sittir.ts (rule has an entry) |
| type_query_member_expression | (none) | literal "." | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| type_query_member_expression | (none) | literal "?." | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| type_query | subscript_expression | alias type_query_subscript_expression | yes | no arm route | typeQuerySubscriptExpression | no | grammar.sittir.ts (rule has an entry) |
| type_query | member_expression | alias type_query_member_expression | yes | no arm route | typeQueryMemberExpression | no | grammar.sittir.ts (rule has an entry) |
| type_query | call_expression | alias type_query_call_expression | yes | no arm route | typeQueryCallExpression | no | grammar.sittir.ts (rule has an entry) |
| type_query | instantiation_expression | alias type_query_instantiation_expression | yes | no arm route | typeQueryInstantiationExpression | no | grammar.sittir.ts (rule has an entry) |
| type_query | identifier | symbol identifier | no | no arm route | identifier | no | grammar.sittir.ts (rule has an entry) |
| type_query | this | symbol this | no | no arm route | this | no | grammar.sittir.ts (rule has an entry) |
| literal_type | unary_expression_number | alias unary_expression_number | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| literal_type | number | symbol number | no | no arm route | number | no | grammar.sittir.ts (rule has an entry) |
| literal_type | string | symbol string | no | no arm route | string | no | grammar.sittir.ts (rule has an entry) |
| literal_type | true | symbol true | no | value arm | true | yes | grammar.sittir.ts (rule has an entry) |
| literal_type | false | symbol false | no | value arm | false | yes | grammar.sittir.ts (rule has an entry) |
| literal_type | null | symbol null | no | value arm | null | yes | grammar.sittir.ts (rule has an entry) |
| literal_type | undefined | symbol undefined | no | value arm | undefined | yes | grammar.sittir.ts (rule has an entry) |
| predefined_type | (none) | literal "any" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "number" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "boolean" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "string" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "symbol" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | alias unique symbol | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "void" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "unknown" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "never" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| predefined_type | (none) | literal "object" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| object_type | (none) | literal "{" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| object_type | (none) | literal "{|" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| object_type | (none) | literal "}" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| object_type | (none) | literal "|}" | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| constraint | (none) | literal "extends" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| constraint | (none) | literal ":" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| index_signature | arm | symbol index_signature_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| index_signature | mapped_type_clause | symbol mapped_type_clause | no | no arm route | mappedTypeClause | no | grammar.sittir.ts (rule has an entry) |
| import_clause_group | namespace_import | symbol namespace_import | no | node arm | namespaceImport | no | upstream rule (needs a patches: entry) |
| import_clause_group | named_imports | symbol named_imports | no | node arm | namedImports | no | upstream rule (needs a patches: entry) |

## Flattened routes: link provenance (definedBy) vs the minted split

| parent | child | label | minted | definedBy |
| --- | --- | --- | --- | --- |
| pattern | _lhs_expression | lhs | no | override |
| type | type_query_member_expression_in_type_annotation | query_member_expression_in_annotation | no | override |
| type | type_query_call_expression_in_type_annotation | query_call_expression_in_annotation | no | override |
| primary_type | this | this | no | override |
| _class_body_member | empty_member | empty | no | override |
| _class_body_member (mixed: 3 minted, 4 authored, of 5) | | | | |
| _enum_body_element | enum_body_element_name | name | yes | enrich |
| _enum_body_element (mixed: 1 minted, 0 authored, of 2) | | | | |

## Automatically named parser kinds: decorator_member_expression, decorator_call_expression, decorator_parenthesized_expression

Named by a bindings claim: decorator_member_expression, decorator_call_expression, decorator_parenthesized_expression

## Group 1: labels on supertype members

| supertype | label | member | own flat key |
| --- | --- | --- | --- |
| _module_export_name | identifier | identifier | identifier |
| _module_export_name | string | string | string |
| declaration | function | function_declaration | functionDeclaration |
| declaration | generator_function | generator_function_declaration | generatorFunctionDeclaration |
| declaration | class | class_declaration | classDeclaration |
| declaration | lexical | lexical_declaration | lexicalDeclaration |
| declaration | variable | variable_declaration | variableDeclaration |
| declaration | function_signature | function_signature | functionSignature |
| declaration | abstract_class | abstract_class_declaration | abstractClassDeclaration |
| declaration | module | module | module |
| declaration | internal_module | internal_module | internalModule |
| declaration | type_alias | type_alias_declaration | typeAliasDeclaration |
| declaration | enum | enum_declaration | enumDeclaration |
| declaration | interface | interface_declaration | interfaceDeclaration |
| declaration | import_alias | import_alias | importAlias |
| declaration | ambient | ambient_declaration | ambientDeclaration |
| statement | export | export_statement | exportStatement |
| statement | import | import_statement | importStatement |
| statement | debugger | debugger_statement | debuggerStatement |
| statement | expression | expression_statement | expressionStatement |
| statement | declaration | declaration | declaration |
| statement | block | statement_block | statementBlock |
| statement | if | if_statement | ifStatement |
| statement | switch | switch_statement | switchStatement |
| statement | for | for_statement | forStatement |
| statement | for_in | for_in_statement | forInStatement |
| statement | while | while_statement | whileStatement |
| statement | do | do_statement | doStatement |
| statement | try | try_statement | tryStatement |
| statement | with | with_statement | withStatement |
| statement | break | break_statement | breakStatement |
| statement | continue | continue_statement | continueStatement |
| statement | return | return_statement | returnStatement |
| statement | throw | throw_statement | throwStatement |
| statement | empty | empty_statement | emptyStatement |
| statement | labeled | labeled_statement | labeledStatement |
| expression | as | as_expression | asExpression |
| expression | satisfies | satisfies_expression | satisfiesExpression |
| expression | instantiation | instantiation_expression | instantiationExpression |
| expression | internal_module | internal_module | internalModule |
| expression | type_assertion | type_assertion | typeAssertion |
| expression | primary | primary_expression | primaryExpression |
| expression | assignment | assignment_expression | assignmentExpression |
| expression | augmented_assignment | augmented_assignment_expression | augmentedAssignmentExpression |
| expression | await | await_expression | awaitExpression |
| expression | unary | unary_expression | unaryExpression |
| expression | binary | binary_expression | binaryExpression |
| expression | ternary | ternary_expression | ternaryExpression |
| expression | update | update_expression | updateExpression |
| expression | new | new_expression | newExpression |
| expression | yield | yield_expression | yieldExpression |
| primary_expression | subscript | subscript_expression | subscriptExpression |
| primary_expression | member | member_expression | memberExpression |
| primary_expression | parenthesized | parenthesized_expression | parenthesizedExpression |
| primary_expression | identifier | _identifier | identifier |
| primary_expression | this | this | this |
| primary_expression | super | super | super |
| primary_expression | number | number | number |
| primary_expression | string | string | string |
| primary_expression | template_string | template_string | templateString |
| primary_expression | regex | regex | regex |
| primary_expression | true | true | true |
| primary_expression | false | false | false |
| primary_expression | null | null | null |
| primary_expression | object | object | object |
| primary_expression | array | array | array |
| primary_expression | function | function_expression | functionExpression |
| primary_expression | arrow_function | arrow_function | arrowFunction |
| primary_expression | generator_function | generator_function | generatorFunction |
| primary_expression | class | class | class |
| primary_expression | meta_property | meta_property | metaProperty |
| primary_expression | call | call_expression | callExpression |
| primary_expression | non_null | non_null_expression | nonNullExpression |
| _formal_parameter | required | required_parameter | requiredParameter |
| _formal_parameter | optional | optional_parameter | optionalParameter |
| _augmented_assignment_lhs | member | member_expression | memberExpression |
| _augmented_assignment_lhs | subscript | subscript_expression | subscriptExpression |
| _augmented_assignment_lhs | identifier | identifier | identifier |
| _augmented_assignment_lhs | parenthesized | parenthesized_expression | parenthesizedExpression |
| _augmented_assignment_lhs | non_null | non_null_expression | nonNullExpression |
| _destructuring_pattern | object | object_pattern | objectPattern |
| _destructuring_pattern | array | array_pattern | arrayPattern |
| pattern | lhs | lhs_expression | lhsExpression |
| pattern | rest | rest_pattern | restPattern |
| _property_name | identifier | property_identifier | — |
| _property_name | private_identifier | private_property_identifier | privatePropertyIdentifier |
| _property_name | string | string | string |
| _property_name | number | number | number |
| _property_name | computed | computed_property_name | computedPropertyName |
| _import_identifier | identifier | identifier | identifier |
| type | primary | primary_type | primaryType |
| type | function | function_type | functionType |
| type | readonly | readonly_type | readonlyType |
| type | constructor | constructor_type | constructorType |
| type | infer | infer_type | inferType |
| type | query_member_expression_in_annotation | type_query_member_expression_in_type_annotation | typeQueryMemberExpressionInTypeAnnotation |
| type | query_call_expression_in_annotation | type_query_call_expression_in_type_annotation | typeQueryCallExpressionInTypeAnnotation |
| _tuple_type_member | parameter | tuple_parameter | tupleParameter |
| _tuple_type_member | optional_parameter | optional_tuple_parameter | optionalTupleParameter |
| _tuple_type_member | optional | optional_type | optionalType |
| _tuple_type_member | rest | rest_type | restType |
| _tuple_type_member | type | type | type |
| primary_type | parenthesized | parenthesized_type | parenthesizedType |
| primary_type | predefined | predefined_type | — |
| primary_type | identifier | _type_identifier | — |
| primary_type | nested_identifier | nested_type_identifier | nestedTypeIdentifier |
| primary_type | generic | generic_type | genericType |
| primary_type | object | object_type | objectType |
| primary_type | array | array_type | arrayType |
| primary_type | tuple | tuple_type | tupleType |
| primary_type | flow_maybe | flow_maybe_type | flowMaybeType |
| primary_type | query | type_query | typeQuery |
| primary_type | index_query | index_type_query | indexTypeQuery |
| primary_type | this | this_type | — |
| primary_type | existential | existential_type | existentialType |
| primary_type | literal | literal_type | literalType |
| primary_type | lookup | lookup_type | lookupType |
| primary_type | conditional | conditional_type | conditionalType |
| primary_type | template_literal | template_literal_type | templateLiteralType |
| primary_type | intersection | intersection_type | intersectionType |
| primary_type | union | union_type | unionType |
| primary_type | (none) | "const" | — |
| _class_body_member | (none) | undefined | undefined |
| _class_body_member | arm1 | class_body_member_arm1 | — |
| _class_body_member | static_block | class_static_block | classStaticBlock |
| _class_body_member | arm2 | class_body_member_arm2 | — |
| _class_body_member | (none) | ";" | — |
| _enum_body_element | name | enum_body_element_name | enumBodyElementName |
| _enum_body_element | assignment | enum_assignment | enumAssignment |
| _class_body_member | empty | empty_member | emptyMember |

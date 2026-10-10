# scm

scm: labels 26; group 1 (supertype members) 9, live 9, member has its own flat key 9; group 2 (non-supertype arms) 17, live 17, unnamed 8, names a kind 4, has an arm route 0 (value arms 0), buildable only through the label 0, owner is an upstream rule 8; flattened routes 18, definedBy ≠ minted 1; automatically named parser kinds 3, named by a bindings claim 0

## Group 2: labels on arms of non-supertype choices

| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _group_expression | definition | symbol definition | no | no arm route | definition | no | grammar.sittir.ts (rule has an entry) |
| _group_expression | arm | symbol group_expression_arm | yes | no arm route | groupExpressionArm | no | grammar.sittir.ts (rule has an entry) |
| _named_node_expression | definition | symbol definition | no | no arm route | definition | no | grammar.sittir.ts (rule has an entry) |
| _named_node_expression | negated_field | symbol negated_field | no | no arm route | negatedField | no | grammar.sittir.ts (rule has an entry) |
| _named_node_expression | arm | symbol named_node_expression_arm | yes | no arm route | namedNodeExpressionArm | no | grammar.sittir.ts (rule has an entry) |
| quantifier | (none) | literal "*" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| quantifier | (none) | literal "+" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| quantifier | (none) | literal "?" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _node_identifier | identifier | symbol identifier | no | no arm route | identifier | no | upstream rule (needs a patches: entry) |
| _node_identifier | (none) | literal "_" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| string_content | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| string_content | escape_sequence | symbol escape_sequence | no | no arm route | escapeSequence | no | upstream rule (needs a patches: entry) |
| named_node | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| named_node | arm | symbol named_node_arm | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| named_node | group | symbol named_node_group | yes | no arm route | namedNodeGroup | no | grammar.sittir.ts (rule has an entry) |
| predicate_type | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| named_node_group | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |

## Flattened routes: link provenance (definedBy) vs the minted split

| parent | child | label | minted | definedBy |
| --- | --- | --- | --- | --- |
| _list_element | list_element_quantifier | quantifier | yes | enrich |
| _list_element (mixed: 1 minted, 0 authored, of 2) | | | | |

## Automatically named parser kinds: group_expression_arm, named_node_expression_arm, named_node_group

Named by a bindings claim: (none)

## Group 1: labels on supertype members

| supertype | label | member | own flat key |
| --- | --- | --- | --- |
| definition | named_node | named_node | namedNode |
| definition | anonymous_node | anonymous_node | anonymousNode |
| definition | missing_node | missing_node | missingNode |
| definition | grouping | grouping | grouping |
| definition | predicate | predicate | predicate |
| definition | list | list | list |
| definition | field | field_definition | fieldDefinition |
| _list_element | capture | capture | capture |
| _list_element | quantifier | list_element_quantifier | listElementQuantifier |

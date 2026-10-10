# regex

regex: labels 55; group 1 (supertype members) 0, live 0, member has its own flat key 0; group 2 (non-supertype arms) 55, live 55, unnamed 13, names a kind 3, has an arm route 23 (value arms 5), buildable only through the label 7, owner is an upstream rule 49; flattened routes 6, definedBy ≠ minted 0; automatically named parser kinds 3, named by a bindings claim 0

## Group 2: labels on arms of non-supertype choices

| owner | label | arm | names a kind | route | own flat key | only through the label | where a `variant()` would go |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pattern | alternation | symbol alternation | no | node arm | alternation | no | upstream rule (needs a patches: entry) |
| pattern | term | symbol term | no | node arm | term | no | upstream rule (needs a patches: entry) |
| term | group | symbol term_group | yes | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| lookaround_assertion | lookahead_assertion | alias lookahead_assertion | no | node arm | lookaheadAssertion | no | upstream rule (needs a patches: entry) |
| lookaround_assertion | lookbehind_assertion | alias lookbehind_assertion | no | node arm | lookbehindAssertion | no | upstream rule (needs a patches: entry) |
| lookahead_assertion | (none) | literal "=" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| lookahead_assertion | (none) | literal "!" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| lookbehind_assertion | (none) | literal "=" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| lookbehind_assertion | (none) | literal "!" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| class_range | class_character | symbol class_character | no | no arm route | classCharacter | no | grammar.sittir.ts (rule has an entry) |
| class_range | character_class_escape | symbol character_class_escape | no | no arm route | characterClassEscape | no | grammar.sittir.ts (rule has an entry) |
| class_range | control_escape | symbol control_escape | no | no arm route | controlEscape | no | grammar.sittir.ts (rule has an entry) |
| _class_atom | class_character | symbol class_character | no | no arm route | classCharacter | no | upstream rule (needs a patches: entry) |
| _class_atom | character_class_escape | symbol character_class_escape | no | no arm route | characterClassEscape | no | upstream rule (needs a patches: entry) |
| _class_atom | character_escape | symbol _character_escape | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _class_atom | posix_character_class | symbol posix_character_class | no | no arm route | posixCharacterClass | no | upstream rule (needs a patches: entry) |
| _class_atom | class_range | symbol class_range | no | no arm route | classRange | no | upstream rule (needs a patches: entry) |
| named_capturing_group | (none) | literal "(?<" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| named_capturing_group | (none) | literal "(?P<" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| inline_flags_group | flags | symbol flags | no | no arm route | flags | no | grammar.sittir.ts (rule has an entry) |
| inline_flags_group | (none) | symbol undefined | no | no arm route | — | no | grammar.sittir.ts (rule has an entry) |
| count_quantifier | arm | symbol count_quantifier_arm | yes | node arm | — | yes | upstream rule (needs a patches: entry) |
| count_quantifier | (none) | symbol undefined | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| character_class_escape | (none) | literal "\\\\[dDsSwW]" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| character_class_escape | arm | symbol character_class_escape_arm | yes | node arm | — | yes | upstream rule (needs a patches: entry) |
| character_class_escape | unicode_character_escape | symbol unicode_character_escape | no | node arm | unicodeCharacterEscape | no | upstream rule (needs a patches: entry) |
| unicode_character_escape | (none) | literal "\\\\u[0-9a-fA-F]{4}" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| unicode_character_escape | (none) | literal "\\\\u\\{[0-9a-fA-F]{1,6}\\}" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| _character_escape | control_escape | symbol control_escape | no | no arm route | controlEscape | no | upstream rule (needs a patches: entry) |
| _character_escape | control_letter_escape | symbol control_letter_escape | no | no arm route | controlLetterEscape | no | upstream rule (needs a patches: entry) |
| _character_escape | identity_escape | symbol identity_escape | no | no arm route | identityEscape | no | upstream rule (needs a patches: entry) |
| control_escape | (none) | literal "\\\\[bfnrtv0]" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| control_escape | (none) | literal "\\\\x[0-9a-fA-F]{2}" | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| term_group | start_assertion | symbol start_assertion | no | value arm | startAssertion | yes | upstream rule (needs a patches: entry) |
| term_group | end_assertion | symbol end_assertion | no | value arm | endAssertion | yes | upstream rule (needs a patches: entry) |
| term_group | boundary_assertion | symbol boundary_assertion | no | value arm | boundaryAssertion | yes | upstream rule (needs a patches: entry) |
| term_group | non_boundary_assertion | symbol non_boundary_assertion | no | value arm | nonBoundaryAssertion | yes | upstream rule (needs a patches: entry) |
| term_group | lookaround_assertion | symbol lookaround_assertion | no | node arm | lookaroundAssertion | no | upstream rule (needs a patches: entry) |
| term_group | pattern_character | symbol pattern_character | no | node arm | patternCharacter | no | upstream rule (needs a patches: entry) |
| term_group | character_class | symbol character_class | no | node arm | characterClass | no | upstream rule (needs a patches: entry) |
| term_group | posix_character_class | symbol posix_character_class | no | node arm | posixCharacterClass | no | upstream rule (needs a patches: entry) |
| term_group | any_character | symbol any_character | no | value arm | anyCharacter | yes | upstream rule (needs a patches: entry) |
| term_group | decimal_escape | symbol decimal_escape | no | node arm | decimalEscape | no | upstream rule (needs a patches: entry) |
| term_group | character_class_escape | symbol character_class_escape | no | node arm | characterClassEscape | no | upstream rule (needs a patches: entry) |
| term_group | character_escape | symbol _character_escape | no | no arm route | — | no | upstream rule (needs a patches: entry) |
| term_group | backreference_escape | symbol backreference_escape | no | node arm | backreferenceEscape | no | upstream rule (needs a patches: entry) |
| term_group | named_group_backreference | symbol named_group_backreference | no | node arm | namedGroupBackreference | no | upstream rule (needs a patches: entry) |
| term_group | anonymous_capturing_group | symbol anonymous_capturing_group | no | node arm | anonymousCapturingGroup | no | upstream rule (needs a patches: entry) |
| term_group | named_capturing_group | symbol named_capturing_group | no | node arm | namedCapturingGroup | no | upstream rule (needs a patches: entry) |
| term_group | non_capturing_group | symbol non_capturing_group | no | node arm | nonCapturingGroup | no | upstream rule (needs a patches: entry) |
| term_group | inline_flags_group | symbol inline_flags_group | no | no arm route | inlineFlagsGroup | no | upstream rule (needs a patches: entry) |
| term_group | zero_or_more | symbol zero_or_more | no | no arm route | zeroOrMore | no | upstream rule (needs a patches: entry) |
| term_group | one_or_more | symbol one_or_more | no | no arm route | oneOrMore | no | upstream rule (needs a patches: entry) |
| term_group | optional | symbol optional | no | no arm route | optional | no | upstream rule (needs a patches: entry) |
| term_group | count_quantifier | symbol count_quantifier | no | no arm route | countQuantifier | no | upstream rule (needs a patches: entry) |

## Flattened routes: link provenance (definedBy) vs the minted split

| parent | child | label | minted | definedBy |
| --- | --- | --- | --- | --- |

## Automatically named parser kinds: term_group, count_quantifier_arm, character_class_escape_arm

Named by a bindings claim: (none)

## Group 1: labels on supertype members

| supertype | label | member | own flat key |
| --- | --- | --- | --- |

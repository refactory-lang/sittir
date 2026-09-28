# `packages/types/src` — Type Glossary

### `packages/types/src/full-form.ts::MatchedAlternative`

The alternatives among `Alts` that the text `I` starts with. It distributes over `Alts`, because an `infer` inside a template literal captures a single character, not a whole alternative.

### `packages/types/src/full-form.ts::SpelledAffix`

The spelling a full-form coercer takes from its text: the alternative the text starts with, `Default` when it starts with none (bare content), and every alternative when the text is a plain `string`, since only the runtime knows it then.

### `packages/types/src/full-form.ts::WithSpelling`

A built node whose spelling slot `K` is narrowed to `P`, on both its stored field (`_<K>`) and its accessor. The narrowing comes first in the intersection, so the accessor call resolves to `P`.

### `packages/types/src/full-form.ts::Interior`

The text between a full form's delimiters, or the text itself when it does not carry both: the type mirror of `spelledInterior`.

### `packages/types/src/full-form.ts::LeadCheck`

Walks a polymorph's sibling leads in the runtime's order and, for the first lead the interior starts with, gives an object type whose one key reads `starts the way <builder> does; build it with <builder>`. An argument intersected with it fails to compile with that key in the message. `unknown` when no lead matches.

### `packages/types/src/full-form.ts::SiblingLeadRefusal`

The compile-time form of `refuseSiblingLead`: a full-form coercer's input is `I & SiblingLeadRefusal<I, …>`, so a literal whose interior starts the way a sibling arm does is refused while it is being typed. A plain `string` and a config object pass unchanged and are checked at runtime.

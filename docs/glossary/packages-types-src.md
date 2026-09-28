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

### `packages/types/src/full-form.ts::AllOf`

Whether every character of `S` is one of `C`, walking `S` one leading character at a time: `true` for the empty rest, `false` at the first character outside `C`.

### `packages/types/src/full-form.ts::OnlyOf`

`I` when it is a non-empty string made only of characters in `C`, else `never`. A plain `string` passes unchanged, left to the runtime. Intersected with its own input (`I & OnlyOf<I, C>`), a literal outside the set fails to compile where it is written.

### `packages/types/src/options.ts::IndentOption`

The `indent` key a render's options carry: `I & OnlyOf<I, IndentChar>`, the unit as the caller spelled it and checked whole, for a grammar that admits an indent character. `unknown` (no key) when `IndentChar` is `never`. `DerivedOptions` includes it at `I = string`, so a standalone `Options` value types `indent` as `string`; `createEngine`, `createRenderEngine` and `render` include it at their inferred `I`.

# Choice separators: a declared token, spaced like any separator

> **Status:** Realized (2026-09-07) on `feat/punctuation-seams`. The declaration
> is `preference('separator', <kind>)` under the list slot; the read side
> stamps the same declared default on a parsed list that carries no
> separator token, so a read reference and a rebuilt node agree.
> Builds on the separated-list options
> struct (`_separator` / `_delimiter` on every separated-list kind) and the
> punctuation seam spacing design. Typescript's `object_type_content` is the
> one shipped instance; the mechanism is general.

## Problem

A separated list whose separator is a choice of literal tokens
(`choice(',', ';')`) already captures which token a parsed instance used:
the list kind's transport carries `_separator` as a kind id, the factory
takes an options bag before its spread elements
(`ir.objectTypeContent.strict({ separator, delimiter }, a, b)`), and the
generated render matches the kind id back to its text. Four things are
still missing, and together they mean an interface body cannot be laid
out one member per line:

- **A built node has no separator.** The render's fallback arm is the
  list's static separator string, which a choice has none of, so
  `_ => ""`: `ir.objectTypeContent.strict(a, b)` renders `a: string b:
  string`, the space being the lexical rule's. The captured value exists
  only for parsed nodes.
- **The option is spelled by text, not by kind id.** `separator?: ',' |
  ';'` is the one option value in the surface that is not a kind id;
  `{ separator: TSKindId.Semi }` type-checks against nothing and is
  silently dropped by the builder's text-keyed table. Every other
  preference, the delimiter included, is enumerated by kind id.
- **The separator has no spacing sites.** `gapOf` accepts only a `STRING`
  separator, so `spaceRenderRules` injects no `<slot>_separator_space_before`
  / `_after` choices, the list view gets `before: ""` / `after: ""`, and no
  option or grammar default can put a newline after the token.
- **The shape is reported as unsupported.** Link warns
  `non-literal-separator` for it, and a test pins that the typescript
  grammar emits exactly one such warning.

Every brace body except `object_type` now indents from its braces; this is
what keeps `interface A { a: string; b: number }` on one line.

## Decision

A choice separator is two facts, each with a home that already exists.

### Which token: a declared preference, stamped at construction

The grammar declares the token a built node uses, under the list's slot key
in `patches:`, in the array form beside the slot's other preferences:

```ts
object_type_content: [
  { content: preference('separator', 'semi') },
  { content: preference('delimiter', 'Delimiter.Trailing') }
],
```

The label is the fixed word `separator`, the twin of `delimiter`, so the
wire needs no catalog to recognise the entry; the arm is the catalog kind
name of one of the separator rule's literal arms (`comma` / `semi`),
resolving to `TSKindId.Semi` the way a spacing arm `'newline'` resolves to
`TSKindId.Newline`. The site collector checks the arm against the choice's
literal kinds and fails the build for a foreign one, for a list whose
separator is a choice and declares no default (a built node must render
some token, and guessing one is what the fallback arm does today), and for
a declaration naming no such list.

The factory option moves to the same tier: `separator?: TSKindId.Comma |
TSKindId.Semi` in the strict and coerce options bags and in
`$with.separator`, stored as is, with no text-keyed table. The validators'
`separatedListFactoryOptions` passes the read kind id through instead of
mapping it to text.

The declared default flows exactly as the delimiter default does:

- `collectSitePreferences` emits a site with `source: 'separator'`, slot
  `content`, address `content_separator`, label `separator`, arms = the
  choice's literal kinds (typed by kind id like every other preference),
  default = the declared arm.
- The site rides `SPACING_SITES` the way a declared preference such as
  `statement_terminator` does: one row `("object_type_content",
  "content_separator", "separator", <default id>, &[<arm ids>])`, its
  transport field `separator_kind`, no top-level label. `defaults()` and
  `resolve()` need no new table: `<kind>.<slot>_separator` resolves per
  kind or supertype through the existing site lookup, the value a kind id
  the site admits.
- `fill_options` does `self.separator_kind.get_or_insert(table.spacing[SITE])`,
  so a parsed node keeps its token and a built one takes the resolved
  default. The render match keeps its literal arms and its fallback becomes
  unreachable in practice; it stays as the declared default's text so a
  transport built without filling still renders.
- The factory stamps the declared default at construction
  (`declaredSeparatorDefault`, the twin of `declaredDelimiterDefault`), so
  `_separator` is never absent on a built node: `options.separator ??
  TSKindId.Semi`. `from()` and the validators already pass a read
  `_separator` through.
- The `Options` type gets `<slot>_separator` under the kind, grouped with
  the other declared preferences (`KindOther`), and no top-level key, as
  the delimiter has none.

### The whitespace around it: the ordinary separator sites, named by the list kind

Once the token is a stamped fact, the gap is an ordinary separator gap.
`gapOf` accepts a separator that is a choice of literals and names the gap
by the list kind instead of a token kind, since no single token names it.
`labelsOf` then yields `object_type_content_separator_space_before` /
`_after`, the site addresses are the usual `content_separator_space_before`
/ `_after`, and the choices are injected by `withSpacedSeparator` around
the choice rule, unchanged. The list view reads `before` / `after` from
those seam locals as it does for a literal separator; only `token` comes
from the kind-id match. `separatorToString` keeps returning undefined for
the nonterminal token, which is what routes the list to the kind-id match
today.

One value for every arm, as the operator seams do:
`object_type_content_separator_space_after` governs the gap whichever
token an instance carries.

### The typescript defaults

```ts
object_type_content_separator_space_after: preference('object_type_content_separator_space_after', 'newline'),
object_type: {
  opening_after: preference('block_body_before', 'indent'),
  closing_before: preference('block_body_after', 'dedent')
},
object_type_content: [
  { content: preference('separator', 'semi') },
  { content: preference('delimiter', 'Delimiter.Trailing') }
],
```

That renders an interface the way prettier does, one member per line each
ending in `;`. Every type literal shares `object_type`, so an inline
`{ a: string }` takes the same layout; a user who wants it inline sets
`object_type.opening_after` and the spacing key back to `space` on that
kind. Width-aware layout is not a thing this renderer does.

### The warning goes

The shape is supported, so link's `non-literal-separator` warning is
removed with the test that pins its count. A separator rule that is
neither a literal nor a choice of literals (a symbol, a pattern) stays
unsupported and keeps a diagnostic of its own.

## Out of scope

- Per-gap mixing (`a, b; c`) in one list. The options struct decided a
  list's separator is uniform; a parsed mixed list re-renders with its
  first token, as it does today.
- Inline versus multi-line by width.
- Grammars other than typescript have no choice separator today; the
  mechanism is exercised by the one shipped case and unit tests.

## Verification

- Unit: `gapOf` names a choice gap by the list kind; wire lifts the
  separator preference; the site collector refuses a foreign arm, an
  undeclared choice and a declaration naming no list; `planRenderOptions`
  numbers a separator site in the spacing table with field
  `separator_kind` and no label; the fill and the render fallback read it;
  the factory stamps the default.
- Probe: an interface and a type literal built through the factories
  render with `;` and one member per line; a parsed `{ a: string, b }`
  keeps its comma.
- Gates: the six dogfood renders byte-identical (none holds an object
  type); `validate counts` identical; typescript's generate run emits no
  `non-literal-separator` warning; suites, cargo, type-check, scope script.

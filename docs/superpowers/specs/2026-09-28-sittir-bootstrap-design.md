# sittir bootstrap: the generator on a pinned sittir

**Status:** Design. Implementation on hold with the regex work, until the user lifts it.

## Problem

The generator reads two languages sittir already models, with hand-written code:

- **Regex:** grammar `PATTERN`s go through text patching and a hand-written parser (see
  the pattern-semantics spec).
- **Tree-sitter queries:** `scm/parse.ts` tokenises and parses `highlights.scm` and
  `tags.scm` by hand (`parseSCMQuery`), and `parseInheritsDirective` finds the
  `; inherits:` comment with a regex. `scm/extract-roles.ts` builds the grammar roles
  from them.

sittir generates `@sittir/regex` and `@sittir/scm`, which parse, read and render exactly
these languages. The generator should use them. But it generates them too, so it must
not depend on whatever the workspace copy happens to be: a generator change that breaks
`@sittir/scm` would then break the generator's own ability to regenerate the fix.

## Goal

The generator uses sittir's own grammar packages through a build of one pinned commit.
Nothing is published, and no binary is committed. The first users are `@sittir/regex`
and `@sittir/scm`.

## Readiness

Both packages round-trip their real inputs through the native engine, with no error node,
and render byte-identical to the source:

- `@sittir/regex`: all 77 distinct `PATTERN`s in the five grammars;
- `@sittir/scm`: all 31 query files in the installed tree-sitter grammar packages.

## Design

### The pin

One committed file, `bootstrap.json`, records one commit: `{ "sha": "<sha>" }`. It is
the only statement of which sittir the generator runs. There is one SHA for every
bootstrap package, not one per package: the packages share `@sittir/common`,
`@sittir/types` and `sittir-core`, and only builds of the same commit are known to work
together.

### The bootstrap build

A bootstrap command makes the pinned build:

1. It checks the pinned commit out as a detached `git worktree` in a cache directory
   outside the repository, keyed by the SHA.
2. In that checkout it installs dependencies, builds the TypeScript packages, and builds
   the native binding of each bootstrap package (`sittir-regex`, `sittir-scm`).
3. It records that the build is complete for that SHA. A cache hit skips steps 1 and 2.

The list of bootstrap packages is one constant, read by the command and by the loaders.
CI caches the directory by SHA.

### One loader per package

Each bootstrap package has exactly one importer in the generator:

- `@sittir/regex`: the pattern module (`packages/codegen/src/pattern/`);
- `@sittir/scm`: the query module (`packages/codegen/src/scm/`).

The loader resolves the package from the pinned build, types included. When the pinned
build is missing, it fails with a message naming the bootstrap command. It never falls
back to the workspace copy.

### Moving the pin

A pin move is its own commit. It changes only `bootstrap.json`, and it passes:

- **Round trip:** every real input of every bootstrap package (the grammar patterns, the
  query files) parses with no error node and renders byte-identical with the new pin.
  This is a permanent test.
- **Fixed point:** all five grammars regenerated with the new pin are byte-identical to
  their output with the old one. A difference is a real change in behaviour. It is
  reviewed on its own and never lands inside a pin move.

A regeneration of `packages/regex` or `packages/scm` therefore cannot change the
generator's behaviour until the pin is moved on purpose.

## First users

### `@sittir/regex`

Specified in the pattern-semantics spec: one parse of each `PATTERN`, one rewrite to
tree-sitter's meaning, and every guard, joined regex, automaton and type derived from
the rewritten tree.

### `@sittir/scm`

The query module reads each query file with `@sittir/scm` into its typed tree and
takes the captures from it: for each capture, the node kind it annotates and the capture
name, the same `SCMCapture` records `parseSCMQuery` returns today. The `; inherits:`
directive is read from the file's comment trivia, not by a regex over the text.
`scm/parse.ts` (the tokeniser, the cursor, `parseSCMQuery`, `parseInheritsDirective`)
is deleted. `extract-roles.ts` is unchanged apart from its input.

**Gate:** the extracted roles are identical on all five grammars, so the generated
output is byte-identical. This is a refactor.

## Later users

Each of these is its own spec, gated on byte-identical generated output:

- `@sittir/typescript`: emitting the generated TypeScript as typed trees rendered by
  sittir in place of string templates. The spec must settle how the output relates to
  the `oxfmt` pass.
- `@sittir/rust`: the same for the generated Rust.

## Testing

- The round trip over every real input (above), for each bootstrap package.
- The fixed-point check on a pin move (above).
- With the pinned build removed from the cache, the generator stops with the message
  naming the bootstrap command, and does not load the workspace package.
- The query module's captures and inherits directive equal `parseSCMQuery`'s and
  `parseInheritsDirective`'s on all 31 query files, checked before `parse.ts` is
  deleted.

## Out of scope

- Publishing `@sittir/*` packages. The pin does not depend on it.
- Downloading prebuilt bootstrap builds. Each machine builds the pinned commit once.

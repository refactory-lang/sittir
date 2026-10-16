# sittir

Take a [tree-sitter](https://tree-sitter.github.io/) grammar and get a typed
API for its language: builders that only accept trees the grammar allows, a
reader that turns a parse into typed nodes, a query surface that runs in the
native parse tree, and a renderer that writes a tree back to source, keeping
the original bytes of everything an edit didn't touch. Nothing per kind is
written by hand: every part of it is generated from the grammar.

> **Alpha.** The public API, generated package shapes and render fidelity are
> still moving. Pin versions and review generated edits before applying them
> at scale.

## Install

Each language is one package. Install the one you need with any package
manager:

```sh
npm install @sittir/rust
```

| Package              | Language                                   |
| -------------------- | ------------------------------------------ |
| `@sittir/rust`       | Rust                                       |
| `@sittir/typescript` | TypeScript                                 |
| `@sittir/python`     | Python                                     |
| `@sittir/regex`      | Regular expressions                        |
| `@sittir/scm`        | tree-sitter queries (`.scm`)               |

Each package's own README covers its full surface:
[rust](packages/rust/README.md), [typescript](packages/typescript/README.md),
[python](packages/python/README.md), [regex](packages/regex/README.md) and
[scm](packages/scm/README.md).

## Examples

### Build and render

A language package's default export creates an engine. `engine.build` has a
builder for every kind. The strict form takes every slot as a node; the
default form also takes strings, arrays and plain objects, and resolves each
to the one kind the slot admits.

```ts
import rust from '@sittir/rust';

const engine = await rust.createEngine();

const strict = engine.build.statement.function.strict({
  visibilityModifier: engine.build.visibilityModifier.pub(),
  name: engine.build.identifier('main'),
  parameters: engine.build.parameters.strict(),
  body: engine.build.block.strict()
});
strict.$render(); // "pub fn main() {}"

const loose = engine.build.statement.function({
  visibilityModifier: 'pub',
  name: 'greet',
  parameters: engine.build.parameters(engine.build.parameter({ name: 'name', type: 'String' })),
  body: engine.build.block.strict()
});
loose.$render(); // "pub fn greet(name: String) {}"
```

A slot's type is derived from the grammar rule, so a tree that type-checks is
a tree the parser accepts. Leaf text (an identifier, a literal) is checked
against the grammar's own token pattern when the leaf is built.

### Parse, read and edit

`engine.parse` returns the root of a typed tree. Each accessor reads one
level, and `engine.is` narrows a node to its kind. `$with` returns an edited
copy. Rendering it writes the edit, and every child the edit didn't touch
renders the bytes it was read from, comments and spacing included.

```ts
import rust from '@sittir/rust';

const engine = await rust.createEngine();

const source = 'fn process( x: u8 ) {\n    // keep me\n    run(x);\n}\n';
const file = engine.parse(source);
file.$render() === source; // true

const fn = file.statements().find((statement) => engine.is.functionItem(statement));
if (fn === undefined) throw new Error('expected a function');
engine.render(fn.name()).toString(); // "process"

const renamed = fn.$with.name(engine.build.identifier('handle'));
renamed.$render(); // "fn handle( x: u8 ) {\n    // keep me\n    run(x);\n}"
```

### Query

`$query()` walks a parsed tree. `$children` takes one level and
`$descendants` every level. `ofType` and `where` run in the native tree, so
only the nodes that match are read into typed nodes.

```ts
import rust from '@sittir/rust';

const engine = await rust.createEngine();

const source = 'fn main() {\n    log("a");\n    run();\n    log("b");\n}\n';
const logged = Array.from(
  engine
    .parse(source)
    .$query()
    .$descendants.ofType(engine.kinds.CallExpression)
    .where((call) => call.function.eq('log'))
);
logged.length; // 2
```

Conditions combine with `and`, `or` and `not`, `match` tests a slot's text
against a pattern, and `find` stops at the first match.

## Why

Cross-language source manipulation is split across three kinds of tooling
that don't compose:

- **Parsers and CST libraries** (tree-sitter and the per-language parser
  crates) give you a syntax tree that's untyped where you use it. You compare
  `node.type` against string constants and reach into anonymous children by
  index. There's no way to construct a node, and no canonical way back to
  source.
- **Pattern engines** (ast-grep, semgrep, comby) find and rewrite by
  syntactic pattern. They're excellent at matching, but a rewrite is a
  template string with metavariables, not typed tree manipulation. Composing
  fragments, or building one from scratch, is outside the model.
- **Typed AST libraries** (Babel, libcst, syn/quote, Roslyn) have
  construction and rendering, but each is hand-written for one language,
  with its own conventions. A tool that touches several languages glues
  several of them together.

tree-sitter is the one parsing layer with grammars for essentially every
mainstream language, error-recovering parses (a codemod meets broken source),
and a uniform tree with field labels. Building on it inherits that grammar
ecosystem instead of rewriting it per language. sittir complements ast-grep
rather than replacing it: a pattern engine finds the nodes, and sittir gives
them types, builds their replacements and renders the result.

Validity holds by construction. A built tree type-checks only if every
required slot is filled with a kind the rule admits, in the multiplicity the
rule allows, and its leaves were checked when they were built. So the
renderer never re-parses its output to know it's well formed.

## Architecture

sittir has two halves. The **compiler** reads a grammar and generates a
language package. The **runtime** is the engine those packages run on.

### The compiler

#### Authoring

A language starts from its upstream tree-sitter grammar. Everything
sittir-specific about it lives in one authored overlay,
`packages/<lang>/grammar.sittir.ts`:

<!-- snippet: illustrative -->
```ts
export default grammar(enrich(base), wire({ /* rules, edits, conflicts, … */ }));
```

`enrich(base)` makes mechanical passes over the upstream grammar: it promotes
bare symbols to fields, gives optional keywords their own rules, and hoists
optional groups into named helper rules. `wire({ … })` folds in the
language's explicit overrides. A second overlay, `grammar.bindings.ts`, maps
the language's kinds onto a cross-language vocabulary for the portable
surface.

The overlay runs twice. tree-sitter's CLI runs it to generate the parser
(`grammar.json`, `node-types.json`, `parser.c`, the wasm), and sittir's own
implementation of the tree-sitter DSL runs it to build its rule model. Both
runs go through the same enrich and wire code, so the parser and the
generated API see the same grammar. The parser's `grammar.json` is the
ground truth for what tree-sitter saw.

#### Phases

| Phase         | Responsibility                                                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enrich**    | Mechanical passes over the upstream grammar, run inside the overlay so both runs see them.                                                                                             |
| **Evaluate**  | Runs the overlay with sittir's DSL and wire's overrides, producing the raw rule tree.                                                                                                  |
| **Link**      | Resolves what each rule is: classifies hidden rules (enum, supertype, group), lifts separated lists, infers field names, and stamps each name with the parser's kind id. A name the parser never issued is a diagnostic. |
| **Normalize** | Lossless structural cleanup, then pushes `optional`, `field` and `repeat` wrappers down to the leaves, giving the wrapper-free rule that render bodies are generated from.             |
| **Simplify**  | A derivation-only view that drops anonymous delimiters, used to derive each kind's slots.                                                                                              |
| **Assemble**  | Classifies each kind into a model type (branch, polymorph, supertype, enum, pattern, keyword, token) and fixes its slots.                                                              |
| **Emit**      | Writes the TypeScript package and the Rust crate.                                                                                                                                      |

Each phase consumes the one before it and never revisits its decisions. The
narrative of each phase lives in
[`docs/compiler-phase-glossary.md`](docs/compiler-phase-glossary.md).

#### Output

- **`packages/<lang>/src`**: the TypeScript package. It holds the language
  descriptor (`index.ts`), the node types, builders with their coercion,
  typed node wrappers, kind guards, kind constants, the render options and
  the portable vocabulary surface.
- **`rust/crates/sittir-<lang>`**: the Rust crate. It holds one transport
  struct per kind (what a node is across the native boundary, with its typed
  reader), one render body per kind, kind and field ids, and the language's
  layout options. With `sittir-core` it builds the N-API addon each package
  ships in `native/`.
- **`.sittir/grammar-diagnostics.json`**: everything the compiler couldn't
  resolve, per grammar.

Three properties hold throughout:

- **One source per fact.** The rule tree is canonical. Types, builders,
  readers and render bodies are all derived from it, and no sidecar restates
  a fact. Generated files are never edited by hand: a fix goes into the
  overlay or the compiler.
- **Mechanical only.** No phase decides by threshold or frequency. Anything
  that needs judgment is written explicitly in the overlay.
- **One pipeline for every grammar.** Each language package comes from the
  same compiler. A new language is a workspace package and an overlay, not a
  fork.

### The runtime

```
your code
   │  rust.createEngine()
   ▼
@sittir/<lang>      descriptor, node types, builders, guards, kind constants
   │
   ▼
@sittir/common      the engine: build, parse, query, render, edit
   │  N-API, no JSON round-trip
   ▼
native addon        sittir-core + the generated sittir-<lang> crate:
                    tree-sitter parse, typed reads, query walk,
                    trivia assignment, render
```

The engine is native only. `createEngine()` throws when the language's native
addon can't load or was built from a different generation of the package.
There's no JavaScript renderer to fall back to.

#### Nodes

A node is frozen data. `$type` is its numeric kind id, a branch holds its
slots, and a leaf holds `$text`. Its accessors (`fn.name()`) are typed by
kind. A node built with `engine.build`, read from a parse, or edited with
`$with` has the same shape, so the same guards and accessors serve all three.
`$trivia` reads and attaches the comments around a node.

#### Reading

A parsed tree stays in native memory. A node read from it holds a coordinate
into that tree, and its children are read only when an accessor asks for
them, through the generated typed reader. The root's `$errors` lists every
region of the source that didn't parse. A parse with errors still reads, and
its `ERROR` regions render as their source.

#### Querying

`$query()` builds a lazy view over a parsed node. Kind filters and slot
conditions run in the native walk, so a query over a large file hydrates
only its matches.

#### Rendering and editing

Render runs the generated per-kind render bodies in the native engine. An
edited node writes its own children through those bodies and renders every
untouched child from the bytes it was read from. Layout that the language
leaves open (indentation, spacing, line breaks) comes from render options.
A parsed tree's own preferences are inferred from its source, so edits match
the file around them.

#### Portable preview

`rust.createEngine({ api: 'portable' })` returns an engine over the
cross-language vocabulary. It provides vocabulary kinds and guards over the
same parsed nodes, mapped through each grammar's bindings overlay. Portable
reading and building are planned.

## Development

Contributor setup, regeneration, validation, native builds and the
diagnostic tools are in [DEVELOPMENT.md](DEVELOPMENT.md). The `sittir`
command reference is [docs/cli-command-glossary.md](docs/cli-command-glossary.md).

## License

MIT

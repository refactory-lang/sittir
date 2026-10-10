# `packages/tools/src/vocabulary` — Function Glossary

The vocabulary feature tool, `sittir tool vocabulary-features`. The vocabulary under `packages/types/src/vocabulary/` has two authored parts:

- **The base:** the namespace files.
- **The feature folders:** `features/<name>/`, nested where one feature extends another. Each folder has a marker interface in its `index.ts` and stub files that mirror the base's namespace files.

The tool reads both and plans which feature owns which kind and member. It then generates the two files the folders imply:

- `augment.ts` merges each feature's kinds and gated members into the base namespaces and declares every level's `Any`.
- `features/index.ts` exports every marker.

`--write` writes them. `--check` reports a planning issue or a generated file that differs from what the folders generate; the tool's test holds the same check at a ceiling of none. The bindings inventory reads the vocabulary through the same reader.

---

### `packages/tools/src/vocabulary/read.ts::VOCABULARY_DIR`

The vocabulary, `packages/types/src/vocabulary/`, located from the repository root. The bindings inventory's `--check` reads it from here too.

### `packages/tools/src/vocabulary/read.ts::readVocabularySource`

Reads the vocabulary's declarations with the TypeScript parser, never by matching lines.

- **Base kinds:** the namespace files (every top-level `.ts` except the augmentation) give the base kinds, each an interface with a `$kind` literal. An interface there without one (the context's typemap, `Unmapped`) is not a kind.
- **`modules`:** maps each top-level namespace to the file that declares it. That file is the module the augmentation's `declare module` block for the namespace names.
- **Feature folders:** read whenever `features/` exists.

### `packages/tools/src/vocabulary/read.ts::Declared`

One interface as declared:
- its qualified name, the namespace path plus the interface name;
- its `$kind` literal, if it has one;
- its parent, the qualified name its `extends` clause names through `V.`;
- its own property members.

A declaration with a `$kind` is a kind (`DeclaredKind`, `isKind`). In a feature folder, a declaration without one adds members to the kind with the same qualified name.

### `packages/tools/src/vocabulary/read.ts::Member`

A property member: its name, whether it is optional, and its type printed without comments. Two declarations of a member have the same type when the printed types are equal. The planner's restatement check compares them this way.

### `packages/tools/src/vocabulary/read.ts::byCodepoint`

The order every generated list follows: plain string comparison (`<`, by UTF-16 code unit), independent of locale, so the output is the same on every machine.

### `packages/tools/src/vocabulary/read.ts::Feature`

One feature folder:
- the marker interface's name;
- its key, the marker's one member, typed `true`, which a language context declares to compose the feature;
- the features its marker extends;
- its folder, relative to `features/`;
- the declarations in its stub files;
- the stub files its `index.ts` does not re-export with `export type * from './x.ts'`.

### `packages/tools/src/vocabulary/read.ts::readFeatures`

Every folder under `features/`, depth first and in codepoint order, each one a feature. A folder nested in another holds a feature that must extend the outer folder's feature; `plan` checks this.

### `packages/tools/src/vocabulary/read.ts::readFeature`

Reads one feature folder. The marker is the first interface in `index.ts` that `markerKey` accepts; a folder without one is refused. The stub files are every other `.ts` file in the folder. Nested folders are read separately, as features of their own.

### `packages/tools/src/vocabulary/read.ts::markerKey`

An interface's marker key: its one property member, typed `true`, named by an identifier or a string. An interface with any other shape is not a marker.

### `packages/tools/src/vocabulary/read.ts::parentOf`

An interface's parent: the first `V.`-qualified type reference in its heritage clauses, at any depth (`vocabularyReference`). For example, `SubKindOf<V.Declaration<G>>` names `Declaration`.

### `packages/tools/src/vocabulary/plan.ts::plan`

The planner. It works in four parts.

**Kinds.** Every base kind and every kind a feature declares, keyed by path. These are issues:
- a path declared twice;
- a parent that is not a kind;
- a parent that is not a level above the kind (a prefix of its path);
- a base kind under a kind a feature adds.

A feature kind under another feature's kind is only a note, when its own feature does not extend that feature.

**Members.** Each member-only stub declares its members at the kind with the same qualified name, gated by its feature. A stub for a kind the vocabulary does not declare is an issue.

**Ownership and inheritance lines.** `ownership` decides who owns each member at each kind. Then, along each inheritance line, nothing but the owning feature may declare an owned member at a kind above or below. Otherwise the gated and the ungated declarations would disagree in every context that lacks the feature. A line whose declarations are all gated and unowned has no owner, and `ownership` has already reported it.

A member that some kinds gate while base kinds leave it ungated is a note naming those kinds; it is probably one feature's member left in the base.

**Levels.** Computed by `levels`.

### `packages/tools/src/vocabulary/plan.ts::ownership`

At each kind, collects each member's declarations: the kind's own (from the base, or from the feature that adds the kind) and the gated ones from member-only stubs. The owner is the first that applies:
1. the kind's own declaration;
2. otherwise, the one optional gated declaration;
3. otherwise, a gated declaration that is the only one.

These are issues:
- two optional gated declarations, meaning two features own the member;
- several required declarations and no optional one.

Every other declaration must restate the owner: required, gated, with the same printed type as the owner's optional declaration, and from a feature that extends the owner's feature. This is how a feature that needs a member requires it.

A gated owner is recorded in `owned`. A kind's own declaration is not, since the kind already carries it.

### `packages/tools/src/vocabulary/plan.ts::levels`

The levels are every proper prefix of each kind's qualified name, plus each top-level namespace, so a namespace whose only kind is its root still has a level.

A level's path is the path of the kind with its name. When no kind has that name, it is the parent level's path plus the last segment in snake case.

A level's arms are every kind at or under its path, ordered by qualified name in codepoint order. Abstract kinds and the kinds features add are included.

### `packages/tools/src/vocabulary/plan.ts::checkedFeatures`

The feature-level checks. Each of these is an issue:
- a feature name declared by two folders;
- a parent that is not a feature;
- a folder nested in another feature's folder whose marker does not extend that feature;
- two markers with the same key;
- a key every context already has (a top-level namespace, or `slots`);
- two folders whose names give the same stub alias, or an alias the augmentation reserves (`RESERVED_ALIASES`);
- a stub file the folder's `index.ts` does not re-export.

### `packages/tools/src/vocabulary/plan.ts::RESERVED_ALIASES`

The aliases the augmentation imports for itself: `features` (the markers), `gate` (`In`) and `V` (the vocabulary).

### `packages/tools/src/vocabulary/plan.ts::stubAlias`

The alias under which the augmentation imports a feature's stubs: its folder's base name in camel case (`async-await` becomes `asyncAwait`).

### `packages/tools/src/vocabulary/plan.ts::closure`

A feature together with every feature it extends, transitively.

### `packages/tools/src/vocabulary/plan.ts::under`

Whether a path is at or below another, compared by whole dotted segments.

### `packages/tools/src/vocabulary/write.ts::GENERATED_FILES`

The files the tool writes, relative to the vocabulary directory. Everything else in the vocabulary is authored, and the inventory's test checks that no other file says it is generated.

### `packages/tools/src/vocabulary/write.ts::augmentation`

The augmentation.
- **Feature kinds:** each kind a feature adds is declared again in its namespace's module, extending the feature's stub (`interface X<G> extends alias.Q<G> {}`), so the base namespace exports it.
- **Owned members:** each member a feature owns at a kind is merged into that kind as `readonly m?: gate.In<G, features.F, alias.Q<G>['m']>`. Its type is the stub's, and it is present only in a context that composes the feature.
- **Levels:** every level gets `type Any<G>`, the union of its arms.

Entries are grouped by the module of their top-level namespace and nested into namespace blocks by `nest`. The imports name only what the file uses.

### `packages/tools/src/vocabulary/write.ts::nest`

Nests entries into namespace blocks by qualified name. Children are sorted in codepoint order with `Any` last. An interface comes before the namespace of the same name, which holds its refinements and its level.

### `packages/tools/src/vocabulary/write.ts::featuresIndex`

`features/index.ts`: every marker exported by name, sorted, so a language composition imports all of them from one place.

### `packages/tools/src/vocabulary/index.ts::generate`

Plans the vocabulary and renders both generated files, formatted the way codegen formats its output (`formatSource`), so the check compares them byte for byte.

### `packages/tools/src/vocabulary/index.ts::drift`

Each generated file that is missing, or that differs from what the folders generate.

### `packages/tools/src/vocabulary/index.ts::vocabularyFeatureIssues`

The gate: the plan's issues, or the drift when there are none. Empty means the vocabulary is consistent and its generated files are current.

### `packages/tools/src/vocabulary/index.ts::run`

`sittir tool vocabulary-features`. It prints:
- the counts: features, the kinds they add, the members they own, kinds and levels;
- the notes;
- the issues, exiting 1 if there are any.

`--write` writes the generated files. `--check` reports drift, exiting 1 if there is any.

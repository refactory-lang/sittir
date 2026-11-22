# `packages/tools/src/vocabulary` — Function Glossary

The vocabulary feature tool, `sittir tool vocabulary-features`. The vocabulary under `packages/types/src/vocabulary/` has two authored parts:

- **The base:** the namespace files.
- **The feature folders:** `features/<name>/`, nested where one feature extends another. Each folder has a marker interface in its `index.ts` and stub files that mirror the base's namespace files.

The tool reads both and plans which feature owns which kind and member. It then generates the two files the folders imply:

- `augment.ts` merges each feature's kinds and gated members into the base namespaces and declares every level's `Any`.
- `features/index.ts` exports every marker.

`--write` writes them. `--check` reports a planning issue or a generated file that differs from what the folders generate; the tool's test holds the same check at a ceiling of none. The tool, the bindings inventory and codegen read the vocabulary through one reader, `codegen/src/bindings/vocabulary.ts::readVocabularySource`.

---

### `packages/tools/src/vocabulary/plan.ts::plan`

The planner. It works in five parts.

**Kinds.** Every base kind and every kind a feature declares, keyed by path. These are issues:
- a path declared twice;
- a qualified name two declarations give different paths (the later declaration is left out);
- a kind a feature declares in a namespace no base file declares, since only the base adds a namespace and its key in the context;
- a parent that is not a kind;
- a parent that is not a level above the kind (a prefix of its path);
- a value the kind is refined by that is not a kind, such as a level's `Any`, which would leave the value's members off the kind;
- a path segment that the path before it declares as a flag (`flagSegments`);
- a base kind under a kind a feature adds.

A feature kind under another feature's kind is only a note, when its own feature does not extend that feature.

**Members.** Each member-only stub declares its members at the kind with the same qualified name, gated by its feature. A stub for a kind the vocabulary does not declare is an issue.

**Ownership and inheritance lines.** `ownership` decides who owns each member at each kind. Then, along each inheritance line, nothing but the owning feature may declare an owned member at a kind above or below. Otherwise the gated and the ungated declarations would disagree in every context that lacks the feature. A line whose declarations are all gated and unowned has no owner, and `ownership` has already reported it.

A member that some kinds gate while base kinds leave it ungated is a note naming those kinds; it is probably one feature's member left in the base.

**Restated members.** Each kind's `restated` is `restatedAt`, computed once every member-only stub has declared its members. A kind may redeclare any member it inherits: the list is derived, not checked against what its heritage names, and `--write` puts it there.

**Levels.** Computed by `levels`, over the kinds.

**Direct references.** `directReferences` reports, as issues, the members that reach a restated kind without the slot table.

### `packages/tools/src/vocabulary/plan.ts::ownership`

At each kind, collects each member's declarations: the kind's own (from the base, or from the feature that adds the kind) and the gated ones from member-only stubs. The owner is the first that applies:
1. the kind's own declaration;
2. otherwise, the one optional gated declaration;
3. otherwise, a gated declaration that is the only one.

These are issues:
- two optional gated declarations, meaning two features own the member;
- several required declarations and no optional one.

Every other declaration must restate the owner: required, gated, with the same printed type as the owner's optional declaration, and from a feature that extends the owner's feature. This is how a feature that needs a member requires it. Each restating feature is recorded against the kind in `restated`.

A gated owner is recorded in `owned`. A kind's own declaration is not, since the kind already carries it.

### `packages/tools/src/vocabulary/plan.ts::flagSegments`

The path segments that name a flag of the path before them. The flags of a prefix are the ones declared along the inheritance line of its nearest kind. A claim resolves each segment of its path to a kind or to a flag of the kind before it, so a segment that could be both has no single reading: `declaration.member.method.static` cannot be a kind while `static` is a flag of `declaration.member.method`. Each segment is reported once, at the path it ends (`declaration.member.method.static: static is a flag of declaration.member.method`), however many kinds lie below it.

### `packages/tools/src/vocabulary/plan.ts::levels`

The levels are every proper prefix of each kind's qualified name, plus each top-level namespace, so a namespace whose only kind is its root still has a level.

A level's path is the path of the kind with its name. When no kind has that name, it is the parent level's path plus the last segment in snake case.

A level's arms are every kind at or under its path, ordered by qualified name in codepoint order. Abstract kinds and the kinds features add are included, so `Declaration.Function.Any` holds `declaration.function.public`, which `visibility` adds, and `Declaration.Function.Public.Any` holds each public level's refinement.

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

The files the tool generates whole, relative to the vocabulary directory. It also rewrites the restated keys of authored `SubKindOf` heritages and writes each grammar's restated-member test, which lives outside the directory. Everything else in the vocabulary is authored, and the inventory's test checks that no other file says it is generated.

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

### `packages/tools/src/vocabulary/write.ts::restatedHeritage`

Rewrites the restated keys of each `SubKindOf` heritage in one vocabulary file to the list `restatedOf` gives for the declaration's path (the default of its `$path` type parameter). A heritage that already names that list, in that order, is left exactly as it is laid out; any other is written on one line, the parent type first and then the keys as a union of string literals, or the parent alone when the list is empty. A `SubKindOf` that does not directly follow `extends`, such as its own declaration or the one inside `RefinedBy`, is left alone. It returns the text and the paths whose heritage it found, and throws on a heritage whose declaration has no path default.

### `packages/tools/src/vocabulary/write.ts::UnfitRestated`

The restated members known not to fit their parent's member, read from `unfit-restated.json` in the vocabulary folder: per kind path, per member, the reason it does not fit. Each becomes a `@ts-expect-error` carrying its reason above that member's check in every grammar's restated-member test, so the test fails when a member not listed stops fitting and when a listed one starts to fit. Generation refuses an entry that names no restated member, or that no grammar's test checks, so the list only shrinks.

### `packages/tools/src/vocabulary/write.ts::RestatedTestInput`

What `restatedTest` needs beyond the plan: the type name of the grammar's map, the module specifiers of the vocabulary's index and of the map as the test file imports them, the features the grammar's composition holds, and the expected failures (`UnfitRestated`).

### `packages/tools/src/vocabulary/write.ts::restatedChecks`

The restated members one grammar checks, per kind path in codepoint order: each kind's `restated`, where the composition holds the kind (a base kind, or one whose feature it holds), keeping the members whose owner at that kind it holds too (a member no feature owns there is always kept). A kind left with no member is dropped.

### `packages/tools/src/vocabulary/write.ts::restatedTest`

One grammar's restated-member test. For each kind `restatedChecks` keeps, a namespace named by the kind's qualified name holds the kind (`Child`) and its parent instantiated at the kind's path (`Parent`), both at the grammar's map, and one `Fit<Child[m], Parent[m]>` per member, which fails when the member's type is not assignable to the parent's. An expected failure's reason sits above its member's check as a `@ts-expect-error`. Every check stays on its own short line, so formatting never moves a check away from its directive.

### `packages/tools/src/vocabulary/write.ts::UNFIT_RESTATED`

The file in the vocabulary folder that lists the restated members known not to fit (`UnfitRestated`). It is authored; a vocabulary without it has no expected failures.

### `packages/tools/src/vocabulary/write.ts::RESTATED_TEST`

The name of each grammar's restated-member test in its package's `tests` folder. It ends in `.test-d.ts` without `.portable`, so the package's own type-check covers it rather than the portable conformance run.

### `packages/tools/src/vocabulary/index.ts::generate`

Plans the vocabulary. When the plan has no issues, it renders both generated files, every authored file holding a `SubKindOf` heritage with its restated keys rewritten (`restatedSources`), and each binding grammar's restated-member test (`restatedTests`). The generated files and the tests are formatted the way codegen formats its output (`formatSource`), so the check compares them byte for byte; an authored file changes only where a heritage's list does. When the plan has issues, it renders nothing, so a broken tree is reported rather than thrown by the writer.

### `packages/tools/src/vocabulary/index.ts::drift`

Each file the tool writes that is missing, or that differs from what `generate` renders: a generated file, an authored file whose restated keys are out of date, or a grammar's restated-member test.

### `packages/tools/src/vocabulary/index.ts::vocabularyFeatureIssues`

The gate: the plan's issues, or the drift when there are none. Empty means the vocabulary is consistent and its generated files are current.

### `packages/tools/src/vocabulary/index.ts::run`

`sittir tool vocabulary-features`. It prints:
- the counts: features, the kinds they add, the members they own, kinds and levels, and the members kinds restate;
- the notes;
- the issues, exiting 1 if there are any.

`--write` writes each file that drifts, and only those. `--check` reports drift, exiting 1 if there is any.

### `packages/tools/src/vocabulary/index.ts::restatedSources`

Every vocabulary file that holds a `SubKindOf` heritage, with the restated keys `restatedHeritage` writes from the plan. Returning each one lets `--check` report an authored heritage whose list is out of date and `--write` fix it. It throws when a kind restates members and no `SubKindOf` heritage declares it, as for a kind declared with `RefinedBy`, which has no list to write them into.

### `packages/tools/src/vocabulary/index.ts::restatedTests`

The restated-member test (`restatedTest`) of each binding grammar whose composition the vocabulary declares, written to `tests/vocabulary-restated.test-d.ts` in the grammar's package, which the package's own type-check covers. Its key is relative to the vocabulary folder, like every other file the tool writes. It reads the expected failures (`UnfitRestated`) and refuses an entry that names no restated member, or that no grammar's test checks.

### `packages/tools/src/vocabulary/plan.ts::Kind::refines`

The kind a vocabulary kind refines.

### `packages/tools/src/vocabulary/plan.ts::Owned`

A vocabulary entry owned by a kind.

### `packages/tools/src/vocabulary/plan.ts::Plan`

The plan that builds a vocabulary.

### `packages/tools/src/vocabulary/plan.ts::restatedAt`

The members a kind restates, which become its `Kind::restated`: those declared at the kind (its own, and those member-only stubs add there) that a kind above it on its inheritance line also declares, its refined-by value's line included, in codepoint order. They are exactly the keys of its parent type that it redeclares, base and augmentations together, so they are the keys its `SubKindOf` heritage names. Naming them stops TypeScript relating each one to the parent's member at the declaration, a check over deferred `Slot` types whose cost grows with everything else the checker has related; each grammar's restated-member test makes that check instead, at the grammar's concrete map.

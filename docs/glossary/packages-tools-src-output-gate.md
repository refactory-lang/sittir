# `packages/tools/src/output-gate` — Function Glossary

### `packages/tools/src/output-gate/index.ts::module`

The byte-identical gate for a change that must not move generated output. A manifest records every generated file as its git blob id at one revision. A later tree is checked against it: every file keeps its blob, except the files the change names. Snapshots do the same for each layer's evaluated grammar, which `grammar.json` does not show: options, records and provenance.

### `packages/tools/src/output-gate/index.ts::GateManifest`

Generated files keyed by repository-relative path, each mapped to its git blob id, sorted by path. Its text form is one `<blob> <path>` line per file, after `#` comment lines.

### `packages/tools/src/output-gate/index.ts::GateException`

A generated file that a gate allows to differ. With no keys, the file may change freely, be missing, or be added. With `dropJsonKeys`, the file is JSON and may differ only in those top-level keys: both sides are compared with the keys removed, so key order, every other value and the layout still count. Such a file is still reported when it is missing, or when it is added with no baseline to compare.

### `packages/tools/src/output-gate/index.ts::GateRevision`

The tree a gate reads: a git revision, or `'worktree'` for the checkout's files as they are on disk, tracked or not.

### `packages/tools/src/output-gate/index.ts::GateDifference`

One file that breaks a gate: `changed` when its blob differs, `missing` when the manifest lists it and the tree lacks it, `added` when the tree has a generated file the manifest does not list.

### `packages/tools/src/output-gate/index.ts::readGateManifest`

Parses a manifest's text form. Blank lines and `#` lines are skipped.

### `packages/tools/src/output-gate/index.ts::printGateManifest`

The text form of a manifest, headed by one `#` comment.

### `packages/tools/src/output-gate/index.ts::generatedOutputRoots`

The paths a gate covers: each grammar's generated roots, as `generatedRootsFor` lists them, and each grammar's generated bindings layer. The list has no second copy here, so a new generated root is gated as soon as the generator lists it.

### `packages/tools/src/output-gate/index.ts::gateBlobs`

The blob of every file under the roots in one tree. At a revision it reads `git ls-tree`. In the worktree it hashes the bytes on disk with `git hash-object --no-filters`, so a change of line endings alone shows.

In the worktree it covers every tracked file, and every untracked one the repository's own `.gitignore` files allow, so a generated file nobody has staged is still seen. A file that only `.git/info/exclude` or a global excludes file hides is seen as well. A file the repository's `.gitignore` ignores is not: it can never be committed, so it never ships. A new artifact ships once the `.gitignore` allows it, and from then on the gate sees it.

### `packages/tools/src/output-gate/index.ts::recordGateManifest`

The manifest of the roots at a revision.

### `packages/tools/src/output-gate/index.ts::checkGate`

The files of a tree that break a manifest, sorted by path. A file with a whole-file exception is never reported. A file with dropped keys is compared as JSON without those keys, and is reported missing if it is gone. A generated file the manifest does not list is reported as added unless a whole-file exception names it.

### `packages/tools/src/output-gate/index.ts::printedWithoutKeys`

A JSON file's text with the named top-level keys removed, printed as `JSON.stringify` prints it with two-space indentation, keeping the file's final newline if it has one. It is undefined when the text is not in that printed form, since comparing re-printed text would then hide a change of layout. It throws when the JSON is not an object.

### `packages/tools/src/output-gate/index.ts::sameWithoutKeys`

Whether two texts of one JSON file differ only in the named top-level keys. Both texts must be in printed form and print alike without those keys. Outside the keys the comparison is therefore exact, and a file that is not in printed form must match byte for byte.

### `packages/tools/src/output-gate/index.ts::parseGateException`

Reads a command-line exception: `path` for a whole file, or `path:key,key` for the top-level JSON keys that may differ.

### `packages/tools/src/output-gate/index.ts::evaluatedGrammarOf`

A grammar's evaluated grammar at one layer, as sittir's `evaluateDsl` returns it for the layer's file (`@sittir/codegen/grammars`' `layerPath`). For a grammar with no generated layer, both layers are its `grammar.sittir.ts`.

### `packages/tools/src/output-gate/index.ts::snapshotOf`

The canonical JSON of an evaluated grammar. It uses the conflict driver's own `canonical()`: keys sorted, and maps and sets as sorted entry lists. Two evaluations that differ only in key order or insertion order therefore snapshot alike, and any other difference shows.

### `packages/tools/src/output-gate/index.ts::evaluatedSnapshot`

The snapshot of one grammar at one layer.

### `packages/tools/src/output-gate/index.ts::writeSnapshots`

Writes `<grammar>.<layer>.json` for every grammar and both layers (`GRAMMAR_LAYERS`) into a directory.

### `packages/tools/src/output-gate/index.ts::checkSnapshots`

The snapshot files in a directory that the current evaluation no longer matches, including any that are missing.

### `packages/tools/src/output-gate/index.ts::OutputGateOptions`

The command's flags. Each of `record`, `check`, `snapshot` and `checkSnapshot` is one action; `rev` is the revision to record or check, and `except` lists the exceptions in their command-line form.

### `packages/tools/src/output-gate/index.ts::run`

The `tool output-gate` command. `--record` writes a manifest at a revision, and `--check` prints every difference and exits 1 if there is any. `--snapshot` and `--check-snapshot` do the same for the evaluated grammars.

### `packages/tools/src/output-gate/index.ts::git`

Runs `git` with the given arguments in the root and returns its stdout as text. The output buffer allows 1 GiB, because a manifest lists every generated file.

### `packages/tools/src/output-gate/index.ts::blobsAtRevision`

Maps each blob under the roots at a revision to its path. It reads the tree with `ls-tree -z`, which keeps paths with unusual characters intact, and skips entries that are not blobs.

### `packages/tools/src/output-gate/index.ts::blobsInWorktree`

Maps each existing file under the roots, tracked or untracked, to its blob id as it is on disk. Hashing uses `hash-object --no-filters`, so a change of line endings alone shows. Untracked files are listed against the repository's own `.gitignore` files only, so a local or global exclude cannot hide a generated file. Why: the gate must compare the bytes on disk, not the normalized text.

### `packages/tools/src/output-gate/index.ts::textAt`

The text of a file in the worktree, read from disk, or in a revision, read as its blob. It is how the gate compares a file's content at either end of a check.

# `packages/codegen/src/bootstrap` — Function Glossary

The pinned build: the one commit `bootstrap.json` names, checked out and built apart from the workspace. Every sittir package codegen runs on its own inputs runs from it, never from the workspace, so a change to the workspace's own packages, generated output included, cannot move how codegen reads `bindings.scm` or the vocabulary. Bumping the pin is its own change, gated by a rebuilt bootstrap, a byte-identical regen of every grammar and every grammar's `bindings.scm` reading to the same facts, patterns and round trip (`bindings/read.ts::roundTripBindings`).

### `packages/codegen/src/bootstrap/bootstrap.ts::module`

Codegen reads the pin through one child process per run (`bindings/read.ts::module`). Its cost, measured on an M-series laptop: starting the child and loading the pinned build takes about 180–200 ms, once per process; after that a whole grammar's `bindings.scm` reads in 35–50 ms (python, rust, typescript), and a read of a few patterns is under a millisecond. Building the pin, once per pinned commit, is the bootstrap itself: an install, the TypeScript builds and each bootstrap package's native crate.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_PACKAGES`

The grammar packages the pinned build holds, each built from its TypeScript package and its native crate: `scm` reads `bindings.scm`, `typescript` reads the vocabulary.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_COMMAND`

The command that builds the pin (`sittir bootstrap`). The loader's refusal of a missing build names it.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_DIR_ENV`

The environment variable that moves the pinned builds out of the main checkout's `scratchpad/bootstrap`; CI leaves it unset and caches the default directory, keyed by the pinned commit.

### `packages/codegen/src/bootstrap/bootstrap.ts::readPin`

The pinned commit, read from the checkout's `bootstrap.json`; anything but a full 40-digit hash is refused.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrapDir`

Where the pin is built: `<main checkout>/scratchpad/bootstrap/<sha>` (`mainCheckout`), or `<SITTIR_BOOTSTRAP_DIR>/<sha>`. It is the one resolver for that path: `bootstrap` builds there and the pinned loader reads there, so every worktree of the repository shares one build. Keyed by the commit, so builds of different pins sit side by side and a bumped pin never reuses a stale build.

### `packages/codegen/src/bootstrap/bootstrap.ts::mainCheckout`

The repository's main checkout, from any of its worktrees: the parent of git's common directory (`git rev-parse --git-common-dir`).

### `packages/codegen/src/bootstrap/bootstrap.ts::isBootstrapped`

Whether a build finished with every bootstrap package in it: `bootstrap` writes its marker only after every step succeeded, and a marker that lists fewer packages than `BOOTSTRAP_PACKAGES` names is a build to finish, not a finished one.

### `packages/codegen/src/bootstrap/bootstrap.ts::markBootstrapped`

Writes a finished build's marker: the pinned commit and the packages built into it.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrapSteps`

The build, in order: a detached worktree of the pinned commit, added with the repository's hooks off (`core.hooksPath=/dev/null`) so the post-checkout hook's setup does not run there whatever the installed hook's version, an install, then `@sittir/types`, `@sittir/common`, each bootstrap package and last each package's native crate. Every step after the checkout runs in the build directory.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrap`

Builds the pin unless it is already built, and returns its directory. A directory left by an interrupted build is kept and the steps after the checkout run again; the marker is written last.
### `packages/codegen/src/bootstrap/bootstrap.ts::BootstrapPackage`

A workspace package the bootstrap builds at the pinned commit.

### `packages/codegen/src/bootstrap/bootstrap.ts::COMPLETE`

The marker file a finished bootstrap writes into its directory, holding the pinned commit and the packages it built. A directory without it is a bootstrap that did not finish.

### `packages/codegen/src/bootstrap/bootstrap.ts::PIN_FILE`

The file at the repository root that pins the bootstrap commit (`{ "sha": … }`). The manifest check reads the same name as a source input of every grammar with bindings.

### `packages/codegen/src/bootstrap/bootstrap.ts::BootstrapStep`

One command of a bootstrap: the program, its arguments and the directory it runs in.

### `packages/codegen/src/bootstrap/pinned.ts::PinnedBuild`

The pinned build's `@sittir/scm`, `@sittir/typescript`, `@sittir/common` and `@sittir/common/utils`, loaded from its compiled output. They come from one build, so each engine, its kinds and the span helpers agree.

### `packages/codegen/src/bootstrap/pinned.ts::loadPinnedBuild`

Imports the pinned build once (`bootstrap.ts::bootstrapDir`) and shares it; a missing build is refused with `BOOTSTRAP_COMMAND`, and a failed load is forgotten so the next call tries again. It must run in a process whose module resolution maps no workspace paths (`bindings/read.ts::module`).

### `packages/codegen/src/bootstrap/pinned.ts::loaded`

The pinned build's modules, imported once and shared.

### `packages/codegen/src/bootstrap/pinned.ts::importPinned`

Imports the pinned build's packages (`PinnedBuild`) from the bootstrap directory. A directory the bootstrap did not finish is an error that names the command to build it.

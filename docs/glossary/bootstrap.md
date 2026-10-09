# `packages/codegen/src/bootstrap` — Function Glossary

The pinned build: the one commit `bootstrap.json` names, checked out and built apart from the workspace, so codegen reads `bindings.scm` with a reader that a change to the workspace's own packages cannot move. Bumping the pin is its own change, gated by the pinned round trip over every grammar's `bindings.scm` (`bindings/pinned-reader.ts::roundTripBindings`).

### `packages/codegen/src/bootstrap/bootstrap.ts::module`

Codegen reads the pin through one child process per run (`bindings/read.ts::module`). Its cost, measured on an M-series laptop: starting the child and loading the pinned build takes about 180–200 ms, once per process; after that a whole grammar's `bindings.scm` reads in 35–50 ms (python, rust, typescript), and a read of a few patterns is under a millisecond. Building the pin, once per pinned commit, is the bootstrap itself: an install, the TypeScript builds and the native `sittir-scm` crate.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_PACKAGES`

The grammar packages the pinned build holds, each built from its TypeScript package and its native crate. Codegen needs only `scm`.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_COMMAND`

The command that builds the pin (`sittir bootstrap`). The loader's refusal of a missing build names it.

### `packages/codegen/src/bootstrap/bootstrap.ts::BOOTSTRAP_DIR_ENV`

The environment variable that moves the pinned builds out of the checkout's `scratchpad/bootstrap`; CI leaves it unset and caches the default directory, keyed by the pinned commit.

### `packages/codegen/src/bootstrap/bootstrap.ts::readPin`

The pinned commit, read from the checkout's `bootstrap.json`; anything but a full 40-digit hash is refused.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrapDir`

Where the pin is built: `<checkout>/scratchpad/bootstrap/<sha>`, or `<SITTIR_BOOTSTRAP_DIR>/<sha>`. Keyed by the commit, so builds of different pins sit side by side and a bumped pin never reuses a stale build.

### `packages/codegen/src/bootstrap/bootstrap.ts::isBootstrapped`

Whether a build finished: `bootstrap` writes its marker only after every step succeeded.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrapSteps`

The build, in order: a detached worktree of the pinned commit, added with the repository's hooks off (`core.hooksPath=/dev/null`) so the post-checkout hook's setup does not run there whatever the installed hook's version, an install, then `@sittir/types`, `@sittir/common`, each bootstrap package and last each package's native crate. Every step after the checkout runs in the build directory.

### `packages/codegen/src/bootstrap/bootstrap.ts::bootstrap`

Builds the pin unless it is already built, and returns its directory. A directory left by an interrupted build is kept and the steps after the checkout run again; the marker is written last.

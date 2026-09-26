# `packages/tools/src/corpus/` glossary

The pinned upstream test corpus each grammar's validators read.

---

### `packages/tools/src/corpus/layout.ts::CORPUS_ROOT`

`packages/codegen/fixtures/`. Each grammar owns `<grammar>/upstream/` (the
upstream `test/corpus/*.txt` files, verbatim, plus `SOURCE.json`) and
`<grammar>/local.txt` (entries sittir authored, in the same format). Nothing
under `upstream/` is edited by hand; a fix to an upstream entry is a
`local.txt` entry or a refetch.

### `packages/tools/src/corpus/fetch.ts::githubRepoOf`

The GitHub owner and repo named by a package.json `repository` field, as a
string or a `{ url }` object: `github:owner/repo` shorthand, or any URL on
github.com, with a trailing `.git` dropped. Anything else throws: the corpus
is fetched from GitHub's archive endpoint.

### `packages/tools/src/corpus/fetch.ts::candidateRefs`

The refs to try, in order, for the installed upstream version. An npm
dependency tries the tag `v<version>`, then `<version>`. A git dependency
(a `#ref` in the grammar package's dependency spec) uses the commit
`pnpm-lock.yaml` resolved for that repo, so the corpus matches the parser
actually installed, falling back to the spec's ref when the lockfile names
none.

### `packages/tools/src/corpus/fetch.ts::archiveCommit`

The commit a GitHub archive was built from, read from the tarball's pax
global header (`comment=<sha>`), which `git archive` writes as the first
entry. `SOURCE.json` records it so the pin names a commit even when the
fetch went through a tag.

### `packages/tools/src/corpus/fetch.ts::fetchUpstreamCorpus`

Downloads the upstream repo archive at the pinned ref and writes its
`test/corpus/**/*.txt` into `<grammar>/upstream/`, with nested paths joined
by `-`, replacing what was there, plus `SOURCE.json` (repository, version,
ref, commit, files). If a `SOURCE.json` exists and records a different
version from the one installed, it refuses unless `update` is set: moving the
pin is a deliberate act. An archive with no corpus files throws.
Called by `bootstrapGrammar` after install and by
`sittir tool fetch-corpus`; no validation gate touches the network.

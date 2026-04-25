# Feature Specification: Parity & Regressions

**Feature Branch**: `016-parity-regressions`
**Created**: 2026-04-25
**Status**: Implementing
**Input**: User description: "parity-and-regressions — lift the TS-mode and native-mode corpus floors above the current baseline measured at the head of branch 012-rust-core-port (commit b4ccc6cc). Phase 0 cleanup (build/lint/jinja-check green) already shipped on 012; this feature targets the 16 pre-existing TS-mode parity-baseline failures and the broader native-mode template gaps."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish a measurable starting baseline (Priority: P1)

A maintainer working on render-template parity needs a single source of truth for "where things stand right now" — per-grammar pass/fail counts for both backends, captured as structured data so every subsequent commit can prove it moved the needle (and didn't drag anything else down).

**Why this priority**: Without a committed baseline, every subsequent fix is judged by ad-hoc test runs that are easy to misread (e.g. "16 failures" hides which 16, and which kinds got better while others got worse). The baseline is the lever that turns this work from "fix things until tests pass" into "each commit moves N counts up and zero down."

**Independent Test**: Run a baseline-collection step against `SITTIR_BACKEND=typescript` and `SITTIR_BACKEND=native`. Verify the output is a structured JSON file (one per backend) with per-grammar entries: `fromPass/Total`, `covPass/Total`, `rtPass/Total/AstMatch`, `factoryPass/Total`, plus the parity fixture pass/fail breakdown by kind. The file checks into `specs/016-parity-regressions/baselines/` and is human-diffable (sorted keys, one entry per line).

**Acceptance Scenarios**:

1. **Given** a fresh checkout of branch `016-parity-regressions`, **When** the maintainer runs the baseline-collection command, **Then** two JSON files appear under `baselines/` (`ts.json`, `native.json`), each containing per-grammar counts that reproduce the 16 known TS-mode failures and the native-mode 0-floor pattern documented in the input.
2. **Given** a committed baseline JSON, **When** a maintainer makes a render-template fix and re-runs collection, **Then** a `git diff` of the JSON shows only counts that improved or stayed equal — no kind drops below its committed baseline without an explicit override.

---

### User Story 2 - Lift the TS-mode corpus floor above 16-failure baseline (Priority: P1)

A maintainer needs the TS-mode (`SITTIR_BACKEND=typescript`) test suite to go from 16 known parity failures to zero — without resorting to skip-marks or floor downgrades. Each cluster of failures has a shared root cause; the maintainer fixes the cause once at the emitter or template, regenerates, and watches multiple parity tests flip green together.

**Why this priority**: TS-mode is the day-to-day developer experience — every pull request touching codegen runs against it. While native-mode parity matters for production performance, TS-mode failing means "can't tell if my change broke anything" for every contributor. Fixing TS-mode first restores the basic feedback loop.

**Independent Test**: From the baseline `ts.json`, identify each failure cluster (python comprehensions × 6, rust mut_pattern/captured_pattern × 5, factory-rt × 1, ts template-coverage × 1, dsl tests × 3). For each cluster, demonstrate that one targeted emitter or override fix moves the cluster's count to zero without dragging any other count down. Stack the cluster fixes; the final TS-mode test run shows zero failures.

**Acceptance Scenarios**:

1. **Given** the python-comprehension cluster (6 failures across `generator_expression`, `list_comprehension`, `dictionary_comprehension`, `set_comprehension`), **When** the maintainer fixes the shared template machinery once, **Then** all 6 fixtures pass and the python parity test file reports zero failures.
2. **Given** the rust pattern cluster (5 failures across `mut_pattern` × 3 and `captured_pattern` × 2), **When** the maintainer applies one root-cause fix at the emitter or override level, **Then** all 5 fixtures pass.
3. **Given** the typescript template-coverage failure (138 below floor 140), **When** the maintainer fixes the missing/broken templates, **Then** coverage reaches at least 140 without any regression in the rust or python coverage numbers.
4. **Given** the 3 dsl test failures (refine-emit, enrich kind-to-name, transform-path), **When** the maintainer fixes each underlying behaviour, **Then** all 3 pass without disabling assertions.
5. **Given** all cluster fixes have landed on this branch, **When** the maintainer runs the full TS-mode suite, **Then** zero failures are reported and the committed `ts.json` baseline reflects the new pass counts.

---

### User Story 3 - Lift the native-mode corpus floor above zero (Priority: P2)

A maintainer needs the native-mode (`SITTIR_BACKEND=native`) test suite to produce non-zero pass counts for at least the same kinds that pass under TS mode. Many native render templates are missing or incorrect (`source_file` renders as a single space; `function_item`, `let_declaration` known to differ from TS). Fixing the native render path is what makes "run validators in both" deliver real signal.

**Why this priority**: Lower than US2 because native-mode is downstream — the JS/TS path is what most contributors interact with daily. But it's still P2 (not P3) because the feature's whole premise (per-handle dispatch shipped on 012) is that native is a peer backend, not a research toy. Until native passes the same parity bar as TS, the dual-backend infrastructure carries weight without delivering value.

**Independent Test**: Pick three high-traffic kinds (`source_file`, `function_item`, `let_declaration`) that currently render as empty/space under native. For each, prove that diff'ing the TS template against the Rust template surfaces the gap, that fixing the Rust template at the emitter level produces byte-identical output across both backends on a probe-kind both-engine compare, and that the native baseline JSON's relevant counts move up.

**Acceptance Scenarios**:

1. **Given** `source_file` rendering as `" "` under native, **When** the maintainer fixes the Rust render template (via the codegen path that produces it), **Then** `probe-kind --grammar rust --source 'fn main() {}' --engine both` reports `engines disagree (TS - native = +0 chars)` is replaced by `TS and native engines agree on render output`.
2. **Given** the native-mode baseline `native.json` shows zeros for rust full-roundtrip and AST-match floors, **When** the maintainer ships fixes for the top-N (≥ 5) most-common kinds, **Then** the same floors move above zero by at least the count those kinds contribute.
3. **Given** an iteration of native parity fixes, **When** TS-mode tests are re-run, **Then** zero TS-mode regressions appear (no count drops in `ts.json`).

---

### Edge Cases

- **Per-cluster scope drift**: A "single root cause" fix turns out to affect a kind not in the cluster. Behaviour: the regression detector against the committed baseline catches it; the maintainer either expands the fix to cover the affected kind cleanly OR splits the work into a smaller patch that doesn't touch the broader path.
- **Native render gap with no clear TS counterpart**: Some native templates may be missing because the Rust render dispatcher has no entry for that kind. Behaviour: treat as a generator gap (Rust render emitter must produce one entry per kind that has a template); fix at the dispatcher emit level, not by hand-authoring a single template.
- **Floor downgrades**: Tempting shortcut when a cluster fix is too invasive. Forbidden by this feature's contract — every floor in the committed baselines may only move up. If a cluster genuinely cannot be fixed within reasonable scope, document the deferral in the spec, do NOT lower the floor.
- **Cluster fix breaks lint or strict-build**: Phase-0 invariants (zero lint warnings, strict-build green) must hold across every cluster commit. Behaviour: if a fix introduces lint/build regressions, the fix must be expanded to address them at the emitter (per fix-the-generator) before the commit lands.
- **probe-kind both-engine compare flips on unrelated kinds**: A native fix might inadvertently change TS render output too if the same template intent is shared. Behaviour: the baseline regression check covers this — both `ts.json` and `native.json` must be re-collected per cluster commit, and any TS regression is treated as a hard blocker.
- **Format-attributable failures vs template-shape failures**: When a cluster fix surfaces a fixture diff that is format-only (the divergence is between two source variants the grammar parses to the same AST — whitespace, quote style, numeric literal style, trailing commas, comment placement, etc.), the fixture is moved from `failingKinds` / `failingByKind` to the new `formatDeferredKinds` / `formatDeferredByKind` field on the same validator/parity entry, NOT silently kept as failing. Format-attributable failures don't gate SC-001. Triage rule: the cluster commit's Before/After table records both moves separately (e.g. "+5 template-shape passes; +3 format-deferred"). The regression-checker's verdict treats `formatDeferredKinds` like `failingKinds` (counts may shrink or stay equal across commits within feature 016; only feature 017 may grow them). **Concrete triage signal**: run `parse(source)` and `parse(rendered_output)`; if both produce the same AST shape (recursively comparing kinds, fields, and named-child ordering — ignoring `$text` / `$span` / anonymous-token text), the failure is format. If AST shapes diverge (kind missing/extra/reordered, named field absent, child slot empty), the failure is template-shape. The triage probe is mechanical: `probe-kind --grammar X --kind Y --reparse` already emits both ASTs; compare them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST contain a script (or documented command sequence) that produces a structured `baselines/<backend>.json` file capturing per-grammar pass/fail counts for both backends. The JSON MUST be deterministic (stable key ordering, no embedded timestamps) so `git diff` against a prior commit's baseline shows only behaviour-driven changes.
- **FR-002**: Each cluster fix MUST land as a single commit whose message includes a "Before/After" table: per-grammar `fromPass`, `covPass`, `rtPass`, `rtAstMatch`, `factoryPass` for both backends. The committed baseline JSON in the same commit must match the "After" numbers exactly. **Waterfall handling**: when a cluster fix incidentally improves counts for kinds outside the declared cluster (e.g. fixing python comprehensions also unlocks dict-builder fixtures), the same commit captures all incidental wins in its Before/After table — the JSON is ground truth, and the commit message notes "+N incidental waterfalls (kinds X, Y, Z…)" so the broader effect is visible without splitting the commit or renaming the cluster.
- **FR-003**: All emitter changes MUST be made under `packages/codegen/src/*` or `packages/{rust,typescript,python}/overrides.ts`. Hand-edits to `packages/{lang}/src/*` (generated TS) or `packages/{lang}/templates/*.jinja` (generated templates) are forbidden — these are codegen output.
- **FR-004**: TS-mode (`SITTIR_BACKEND=typescript`) test suite MUST end with zero **template-shape** failures by the close of this feature. The 16 baseline failures (python comprehensions × 6, rust patterns × 5, factory-rt × 1, ts coverage × 1, dsl × 3) must each be triaged: those attributable to template content (missing/extra/reordered tokens) addressed at the root cause; those attributable to source-format loss recorded in `formatDeferredKinds` and deferred to feature 017-format-inference. Skip-marks or test deletions are NOT acceptable substitutes for either category. **Triage signal**: if render → reparse produces an AST that matches the original parse byte-exactly on tokens but the render output differs from source by whitespace alone, the failure is format. Otherwise it's template-shape.

- **FR-004a**: A failure may NOT be classified as format-deferred without first running the triage probe (`probe-kind --grammar X --kind Y --reparse`) and confirming AST shapes match. Hand-waving "this looks like whitespace" is not allowed; every format-deferred entry has a recorded probe in the cluster commit message.
- **FR-005**: Native-mode (`SITTIR_BACKEND=native`) corpus floors MUST move above zero for at least full-roundtrip and AST-match across all three grammars. Exact target counts depend on cluster sizes; specifics determined during measurement.
- **FR-006**: Every cluster commit MUST regenerate all three grammar packages (`pnpm tsx packages/codegen/src/cli.ts --grammar {rust,typescript,python} --all`) and check in the regenerated output. Generated-output drift between commits and a clean regen is a CI-blocking offense.
- **FR-007**: Phase-0 invariants (strict-build green, oxlint --deny-warnings clean on `packages/{lang}/src`, jinja-template header check passing on all 509 generated `.jinja` files, API-surface snapshots match) MUST hold at every commit on this branch. Any regression to these invariants must be fixed in the same commit.
- **FR-008**: Pre-existing memory notes that flag clusters as "investigated, blocked on X" MUST be updated when their cluster lands. The corresponding memory file under `~/.claude/projects/-Users-pmouli-GitHub-nosync-refactory-lang-sittir/memory/` is either deleted (cluster fully resolved) or updated to reflect what changed and what's still open.

### Key Entities *(include if feature involves data)*

- **Backend Baseline JSON**: Per-backend (`ts.json`, `native.json`) snapshot of corpus validator counts. Keys: `grammar` (`rust` | `typescript` | `python`), `validator` (`from` | `coverage` | `roundtrip` | `factoryRoundtrip`), counts (`pass`, `total`, `astMatchPass` where applicable), `failingKinds` (sorted list of kinds whose fixtures failed). Stored under `specs/016-parity-regressions/baselines/`. Updated atomically per cluster commit.
- **Failure Cluster**: A group of test failures that share a single root cause. Identified by inspection of error messages plus memory notes; documented in the spec or commit message. A cluster is "closed" when all its tests pass AND no other tests regressed.
- **Render Template**: A `.jinja` file emitted by the codegen pipeline, one per kind per grammar. The render output of `render(NodeData)` reads the template indirectly through the rendering engine (Nunjucks for TS, Askama for Rust). Templates are treated as generated artifacts in this feature — fixes go through the codegen pipeline, not the file directly.
- **Override File**: `packages/{rust,typescript,python}/overrides.ts` — the hand-authored DSL layer that customizes how the codegen pipeline interprets a grammar. Fixes for kind-specific shape mismatches typically land here (e.g. forcing a particular field name, declaring a polymorph variant, adopting variant() for a kind whose base template can't render correctly).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: TS-mode (`SITTIR_BACKEND=typescript`) full test suite reports zero **template-shape** failures across all 6 packages — confirmed by a green CI run on this branch with all `failingKinds` arrays empty in `baselines/ts.json` for failures attributable to grammar template content (missing/extra/reordered tokens). Failures attributable to **source-format loss** are catalogued in the per-validator / per-parity-fixture `formatDeferredKinds` field of the baseline JSON and counted separately. Format-deferred items are addressed by feature 017-format-inference, NOT by this feature.

**Definition of format** (operational): format encompasses *any source-text variation that produces the same AST after parse* — i.e. any choice the grammar treats as equivalent. Concrete categories:
- Whitespace placement (tab vs space indent, space around operators, blank-line distribution)
- Quote style (`'` vs `"` in Python/JS; raw `r"…"` vs `"…"` in Rust; template literals vs string literals)
- Numeric literal style (`1_000` vs `1000`; `0x10` vs `0X10` vs `16`; `1.` vs `1.0`; hex casing)
- Optional tokens (trailing commas, redundant parentheses, optional semicolons, line-continuation backslashes)
- String escape style (`"\n"` vs raw-string with literal newline)
- Comment placement (`//` vs `/* */`; leading vs trailing relative to node)
- Block-vs-inline equivalents (Python `if x: y` vs newline-indented; single-vs-multi-line function signatures)

Anything the grammar's `parse(source)` accepts as the same AST falls under format. This is a softening from the original "zero failures" criterion: `/speckit.superb.review` and subsequent triage during US1 surfaced that the parity target cannot be "render output exactly matches source" without a separate format-inference layer (the grammar template defines shape; format is the residual the source carries that the grammar treats as semantically equivalent).
- **SC-002**: Native-mode (`SITTIR_BACKEND=native`) corpus full-roundtrip and AST-match floors are above zero for all three grammars (rust, typescript, python). Specific target percentages set during measurement; lower bound is "at least 50% of the TS-mode pass rate per grammar."
- **SC-003**: Every commit on this branch carries before/after counts in its message, and the committed `baselines/<backend>.json` matches the "After" numbers byte-for-byte. Verifiable post-merge by replaying the regen + collection command on each commit and diff'ing.
- **SC-004**: Zero TS-mode regressions across the lifetime of this feature — every count in `baselines/ts.json` either stays equal or moves up across commits. Verified by a regression-checker script that diffs successive baseline commits.
- **SC-005**: Phase-0 invariants (build green, lint clean, jinja-check green, API-surface snapshots match) hold at every commit. Verified by a green CI run on every push.
- **SC-006**: Generated-output drift between consecutive commits and a clean regen is zero. Verified by `git diff --quiet` after running `pnpm tsx packages/codegen/src/cli.ts --grammar <each> --all` on the post-cluster checkout.

> **Note on cadence**: an earlier draft of this spec carried a "≤4 hours of focused work per cluster" metric as SC-007. It was removed during `/speckit.superb.review` because cadence is process advice, not a measurable feature outcome — clusters that exceed it are split or deferred per the spec's existing scope-drift edge case, not failed against a contract. The pacing guidance lives in `quickstart.md` instead.

## Out of Scope

- **Source format inference**: capturing per-node format intent at parse time and applying it at render time. "Format" here means *any source-text variation that produces the same AST after parse* — encompassing whitespace, quote style, numeric literal style, trailing commas / optional tokens, comment placement, and any other choice the grammar treats as semantically equivalent. This is a separate, deeper architectural change deferred to feature 017-format-inference. Format-attributable parity failures surfaced during 016's cluster work are catalogued under `formatDeferredKinds` in the baseline JSON and become 017's input corpus. **Why deferred**: the thesis is `format = source_text − grammar_template_output`. The grammar template defines the shape (tokens, ordering, mandatory separators); format is the residual the source carries that the grammar treats as equivalent. Fixing the residual requires changes to NodeData shape (`$format` field), `readNode` (extraction), `render` (application), per-grammar regen, and the native render path — substantial architectural surface that doesn't belong in 016's cluster-fix arc.
- **Style normalisation / pretty-printing**: 016 does not impose canonical formatting; nor does 017 once it lands. Both features preserve whatever format the source had.
- **New grammar features**: 016 fixes existing template/walker bugs; it does not add support for grammar constructs that aren't already represented.
- **Per-handle dispatch refactoring**: shipped on branch `012-rust-core-port`; 016 builds on that machinery, doesn't modify it.
- **Public API surface changes** beyond the minimum needed for cluster fixes (and `formatDeferredKinds` schema additions) and the regression-checker.

## Assumptions

- The per-handle read dispatch (`TreeHandle.read?(id)`), `nativeTreeHandle` factory, and `SITTIR_BACKEND`-controlled validator backend selection have already shipped on branch `012-rust-core-port` (commit `b4ccc6cc`) and PR #12. This feature builds on top of that machinery; no further changes to the dispatch layer are required.
- The 30 pre-existing emitter-level lint warnings cleared by the phase-0 work on `012-rust-core-port` will not reappear during this feature's cluster fixes. Any reappearance is treated as a regression and fixed in the same commit.
- Memory notes (`project_recursive_factory_cluster.md`, `project_template_quality_gap.md`, `project_multi_separator_templates.md`, `project_choice_with_literals_cluster.md`) accurately describe the cluster groupings to within ~80% — they are starting points, not contracts. Each cluster is re-inspected before the fix lands.
- Both backends (TS Nunjucks, Rust Askama) consume the same per-rule template intent, even though the on-disk template files are separate. A render-template fix that requires touching both is acceptable and counts as one cluster commit, provided the before/after counts cover both backends.
- The vitest test suite, oxlint, tsgo, and the jinja-check script remain the authoritative quality gates. New tests may be added to lock in cluster fixes; existing ones may not be skipped or downgraded.

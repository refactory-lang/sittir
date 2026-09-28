# Conflict Predetermination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every grammar's `conflicts` list (hand-written, inherited from upstream, and auto-registered) with a set derived by looping `tree-sitter generate --json-summary` until no conflict is reported.

**Architecture:** A driver in the transpile layer runs `tree-sitter generate` on the bundled grammar, parses the conflict report from stderr, chooses one resolution by the spec's policy, records it in `packages/<g>/.sittir/resolutions.json`, and repeats. `sittirGrammar` applies the recorded resolutions as the final `conflicts` array in both runtimes: the CLI's bundled `grammar.js` and sittir's `evaluate`. The auto-registered conflict producers are retired, because the loop owns the whole set. Those producers are enrich's subsequence-owner records (wire relabels them into owner/self pairs) and transform's hoisted-variant registration.

**Tech Stack:** TypeScript (ESM, `.ts` imports), tree-sitter CLI 0.26.9, esbuild bundle (`transpile-overrides.ts`), vitest.

**Spec:** `docs/superpowers/specs/2026-09-28-conflict-predetermination-design.md`

## Global Constraints

- The loop reads only tree-sitter's `--json-summary` report. It never re-derives LR states.
- `resolutions.json` is generated, never hand-edited, and regenerated whenever the grammar is regenerated.
- The final `conflicts` array does not include `previous`.
- `conflict-unresolvable` and `conflict-authored` are blocking and not floorable.
- The iteration cap is the number of rules in the grammar.
- Precedences upstream wrote outside `conflicts` (its `precedences` list, `prec` on rules) are kept as written.
- Repo rules:
  - no source comments in `packages/codegen/src`; document in `docs/glossary/*.md`;
  - never hand-edit generated outputs;
  - after any `codegen/src` edit, regenerate all five grammars (python, rust, typescript, scm, regex);
  - commit by pathspec only.

## Measured before planning (probe, no source change)

I appended `module.exports.grammar.conflicts = [...]` to scratch copies of each `.sittir/grammar.js`, starting from an empty list. I then iterated `tree-sitter generate --json-summary`, adding each report's `AddConflict`. Results:

| grammar | iterations | derived | final conflicts on master | parser.c vs master |
|---|---|---|---|---|
| python | 11 | 11 | 108 | byte-identical |
| rust | 8 | 8 | 160 | byte-identical |
| typescript | 61 | 61 | 301 | byte-identical |
| regex | 1 | 1 | 19 | byte-identical |
| scm | 0 | 0 | 0 | byte-identical |

- Each iteration takes about 0.3 s for python and 1.5–3 s for typescript.
- The report is written to **stderr**, after any console output from grammar evaluation, and the exit code is 1.
- `--no-parser` skips table building, so it reports no conflicts. The loop must run the full `generate`.
- Python's derived 11 are upstream's 9 minus `[print_statement, primary_expression]`, plus 3 of the 4 hand-written entries. `[_expressions, expression_list]` is never reported.
- Keeping `previous` and the auto groups, and deleting only the 4 hand entries, also converges (3 iterations, byte-identical parser.c). Tree-sitter then warns about roughly 80 of python's 108 conflicts as unnecessary.
- Every derivation used `AddConflict` only, and every parser.c matches master. So master's parsers are exactly the `AddConflict` resolution of each conflict. Policy step 2 (copy an upstream prec/assoc) would change a parser relative to master wherever it fires. That question is with the user (see Rulings).

## Rulings

- **Where the resolutions live (both runtimes):** each `grammar.sittir.ts` does `import resolutions from './.sittir/resolutions.json'` and passes it in `sittirGrammar`'s config. `sittirGrammar` takes the resolutions as config and never looks for the file.
  - Why not an import inside shared codegen code: sittir's `evaluate` runs `grammar.sittir.ts` under tsx, not the bundle (`compileGrammar` → `evaluate(packageEntryPath(pkg))`). A JSON import in shared codegen code therefore has no per-grammar path there.
  - Why this works: tsx and esbuild both resolve a relative JSON import natively, so one input feeds both runtimes, and it is explicit at the grammar.
  - `resolutions.json` is a committed generated output, so the import always resolves.
  - The loop writes the file before anything evaluates it, and re-bundles each iteration.
  - Evaluating the bundle in both runtimes instead, which would close the dual-pipeline divergence class, is filed as its own issue.
- **Module cache:** Node caches ESM modules, JSON included, by URL for the life of a process, and `evaluate` uses a plain `import(entryPath)`. A cache-busting query on the entry would not reload the JSON it imports. If the loop imports `grammar.sittir.ts` in-process, the later `compileGrammar` in the same regen process would read the stale resolutions.
  - Chosen: the loop's `evaluate` runs in a fresh child process (`evaluateForDerivation`, Task 5), and the regen process never imports `grammar.sittir.ts` before the loop has written the final file.
  - Task 4 pins it: after a derivation writes new resolutions, `compileGrammar` in the same process sees them.
- **Auto conflict producers:** retired in Task 3. These are enrich's subsequence-owner pairs and self entries, their relabel in wire, transform's `registerHoistedVariantConflicts`, and wire's `conflictGroups` drain, together with their glossary entries.
- **Grammar hash:** sha256 of canonical JSON of the `evaluate` result with its `conflicts` removed. While every resolution is an `AddConflict`, `conflicts` is the only field the resolutions touch. `grammar.json` would need a generate run to produce, and the bundle bytes carry non-grammar reorder churn. The evaluate runs in the fresh child process above.
- **Reshaping records:** a non-enumerable sidecar on the `sittirGrammar` result, the same pattern as the dead-mint sidecar. The driver reads it once per derivation from the one child-process `evaluate` that also yields the hash and the rule count, with no name matching.
- **Open, with the user:** how a Precedence or Associativity resolution is applied, and whether policy step 2 fires at all, given that `AddConflict` alone reproduces every master parser. Task 7 waits on this.

---

### Task 0: Branch set-up

**Files:** none

- [ ] **Step 1:** In `~/GitHub.nosync/refactory-lang/sittir-worktrees/conflict-predet` (branch `feat/conflict-predetermination`, stacked on `spec/conflict-predetermination`), run `git merge origin/master`. The spec branch predates the merge of the dead-enrich-mints pass into `sittirGrammar`.
- [ ] **Step 2:** Generate all five grammars so native bindings exist:

  ```bash
  for g in scm regex python rust typescript; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
  ```

- [ ] **Step 3:** Record the baselines in the scratchpad:
  - `sha256sum packages/*/.sittir/src/parser.c`
  - the last row of `validation-history.jsonl`
  - `pnpm exec tsx packages/cli/src/cli.ts tool propose-14`

### Task 1: Parse the conflict report

**Files:**
- Create: `packages/codegen/src/transpile/conflict-summary.ts`
- Test: `packages/codegen/src/transpile/__tests__/conflict-summary.test.ts`
- Glossary: `docs/glossary/transpile.md` (one `###` per export)

**Interfaces:**
- Produces:

```ts
export interface ConflictInterpretation {
	readonly preceding_symbols: readonly string[];
	readonly variable_name: string;
	readonly production_step_symbols: readonly string[];
	readonly step_index: number;
	readonly done: boolean;
	readonly conflicting_lookahead: string;
	readonly precedence: unknown;
	readonly associativity: unknown;
}
export type ConflictOffer =
	| { readonly Precedence: { readonly symbols: readonly string[] } }
	| { readonly Associativity: { readonly symbols: readonly string[] } }
	| { readonly AddConflict: { readonly symbols: readonly string[] } };
export interface ConflictReport {
	readonly symbol_sequence: readonly string[];
	readonly conflicting_lookahead: string;
	readonly possible_interpretations: readonly ConflictInterpretation[];
	readonly possible_resolutions: readonly ConflictOffer[];
}
export type GenerateOutcome =
	| { readonly kind: 'clean' }
	| { readonly kind: 'conflict'; readonly report: ConflictReport }
	| { readonly kind: 'error'; readonly summary: unknown };
export function parseGenerateOutcome(status: number | null, stderr: string): GenerateOutcome;
export function conflictKey(report: ConflictReport): string;
```

- [ ] **Step 1:** Call `mcp__infigraph__generate_test_context` for `packages/codegen/src/transpile/`. Then write the failing test. It uses the stderr captured from python with its four conflicts removed, including the leading console line `transform: override field('async_marker') …`:

```ts
import { describe, expect, it } from 'vitest';
import { conflictKey, parseGenerateOutcome } from '../conflict-summary.ts';

const report = {
	symbol_sequence: ['expression'],
	conflicting_lookahead: "';'",
	possible_interpretations: [
		{ preceding_symbols: [], variable_name: 'expression_statement', production_step_symbols: ['expression'], step_index: 1, done: true, conflicting_lookahead: "';'", precedence: null, associativity: null },
		{ preceding_symbols: [], variable_name: 'expression_statement_tuple', production_step_symbols: ['expression'], step_index: 1, done: true, conflicting_lookahead: "';'", precedence: null, associativity: null }
	],
	possible_resolutions: [
		{ Precedence: { symbols: ['expression_statement'] } },
		{ Precedence: { symbols: ['expression_statement_tuple'] } },
		{ AddConflict: { symbols: ['expression_statement', 'expression_statement_tuple'] } }
	]
};
const stderr = `transform: override field('async_marker') on 'for_in_clause' wraps an enrich-labeled FIELD\n${JSON.stringify({ BuildTables: { Conflict: report } }, null, 2)}\n`;

describe('parseGenerateOutcome', () => {
	it('reads the conflict report after console noise on stderr', () => {
		expect(parseGenerateOutcome(1, stderr)).toEqual({ kind: 'conflict', report });
	});
	it('treats exit 0 as clean', () => {
		expect(parseGenerateOutcome(0, 'Warning: unnecessary conflicts: ...')).toEqual({ kind: 'clean' });
	});
	it('surfaces a non-conflict summary as an error', () => {
		const summary = { LoadGrammarFile: { LoadJSGrammarFile: { JSRuntimeExit: { runtime: 'node', code: 1 } } } };
		expect(parseGenerateOutcome(1, `boom\n${JSON.stringify(summary, null, 2)}`)).toEqual({ kind: 'error', summary });
	});
	it('keys a conflict by sequence, lookahead and interpretations, ignoring offers', () => {
		const reordered = { ...report, possible_resolutions: [...report.possible_resolutions].reverse() };
		expect(conflictKey(reordered)).toBe(conflictKey(report));
		expect(conflictKey({ ...report, conflicting_lookahead: "','" })).not.toBe(conflictKey(report));
	});
});
```

- [ ] **Step 2:** `pnpm exec vitest run packages/codegen/src/transpile/__tests__/conflict-summary.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement. The summary JSON is the last top-level object on stderr: find the last line that is exactly `{`, then `JSON.parse` from there to the end. The status and the `BuildTables.Conflict` key pick the variant. `conflictKey` is `JSON.stringify` of `[symbol_sequence, conflicting_lookahead, interpretations mapped to [variable_name, production_step_symbols, step_index]]`.
- [ ] **Step 4:** Run again. Expected: PASS. Mutation check: make `conflictKey` include `possible_resolutions` and confirm the reorder case fails; then restore it.
- [ ] **Step 5:** Add a glossary entry for each export in `docs/glossary/transpile.md`, then commit:
  `git commit -F msg -- packages/codegen/src/transpile/conflict-summary.ts packages/codegen/src/transpile/__tests__/conflict-summary.test.ts docs/glossary/transpile.md`

### Task 2: Policy and the derivation loop

**Files:**
- Create: `packages/codegen/src/transpile/derive-conflicts.ts`
- Test: `packages/codegen/src/transpile/__tests__/derive-conflicts.test.ts`
- Glossary: `docs/glossary/transpile.md`

**Interfaces:**
- Consumes: Task 1's `parseGenerateOutcome`, `conflictKey` and `ConflictReport`.
- Produces:

```ts
export type PolicyStep = 'upstream-declared' | 'upstream-precedence' | 'default';
export interface DerivedResolution {
	readonly resolution: { readonly kind: 'AddConflict'; readonly symbols: readonly string[] };
	readonly step: PolicyStep;
	readonly conflict: { readonly symbolSequence: readonly string[]; readonly lookahead: string; readonly interpretations: readonly string[] };
}
export interface ConflictResolutionsFile {
	readonly grammarHash: string;
	readonly resolutions: readonly DerivedResolution[];
}
export interface UpstreamContext {
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly upstreamSourceOf: (finalName: string) => string;
}
export type PolicyChoice = { readonly kind: 'chosen'; readonly resolution: DerivedResolution } | { readonly kind: 'unusable' };
export function chooseResolution(report: ConflictReport, upstream: UpstreamContext): PolicyChoice;
export type DerivationResult =
	| { readonly kind: 'converged'; readonly resolutions: readonly DerivedResolution[]; readonly iterations: number }
	| { readonly kind: 'unresolvable'; readonly reason: 'repeated' | 'no-usable-offer' | 'cap'; readonly report: ConflictReport; readonly resolutions: readonly DerivedResolution[] };
export function deriveConflictResolutions(input: {
	readonly ruleCount: number;
	readonly upstream: UpstreamContext;
	readonly generate: (resolutions: readonly DerivedResolution[]) => GenerateOutcome;
}): DerivationResult;
```

`resolution.kind` is only `'AddConflict'` until Task 7 widens it under the user's ruling on step 2. Until then, step 2 cannot fire, and `chooseResolution` returns step `'upstream-declared'` or `'default'`. `generate` is injected, so the loop can be tested without the CLI.

- [ ] **Step 1:** Write the failing tests:

```ts
import { describe, expect, it } from 'vitest';
import { chooseResolution, deriveConflictResolutions } from '../derive-conflicts.ts';
import type { ConflictReport, GenerateOutcome } from '../conflict-summary.ts';

const reportFor = (a: string, b: string, la = "';'"): ConflictReport => ({
	symbol_sequence: ['expression'],
	conflicting_lookahead: la,
	possible_interpretations: [a, b].map((variable_name) => ({ preceding_symbols: [], variable_name, production_step_symbols: ['expression'], step_index: 1, done: true, conflicting_lookahead: la, precedence: null, associativity: null })),
	possible_resolutions: [{ Precedence: { symbols: [a] } }, { AddConflict: { symbols: [a, b] } }]
});
const identity = { upstreamConflicts: [['pattern', 'primary_expression']], upstreamSourceOf: (n: string) => n };

describe('chooseResolution', () => {
	it('applies AddConflict for a set upstream declared, and says so', () => {
		const choice = chooseResolution(reportFor('primary_expression', 'pattern'), identity);
		expect(choice).toMatchObject({ kind: 'chosen', resolution: { step: 'upstream-declared', resolution: { kind: 'AddConflict', symbols: ['primary_expression', 'pattern'] } } });
	});
	it('maps reshaped names back to upstream before the declared test', () => {
		const upstream = { upstreamConflicts: [['a', 'b']], upstreamSourceOf: (n: string) => (n === 'a_tuple' ? 'a' : n) };
		expect(chooseResolution(reportFor('a_tuple', 'b'), upstream)).toMatchObject({ resolution: { step: 'upstream-declared' } });
	});
	it('falls to default AddConflict otherwise', () => {
		expect(chooseResolution(reportFor('expression_statement', 'expression_statement_tuple'), identity)).toMatchObject({ resolution: { step: 'default' } });
	});
	it('is unusable when no AddConflict is offered', () => {
		const report = { ...reportFor('x', 'y'), possible_resolutions: [{ Precedence: { symbols: ['x'] } }] };
		expect(chooseResolution(report, identity)).toEqual({ kind: 'unusable' });
	});
});

describe('deriveConflictResolutions', () => {
	it('adds one resolution per reported conflict until clean', () => {
		const queue = [reportFor('a', 'b'), reportFor('c', 'd')];
		const result = deriveConflictResolutions({ ruleCount: 10, upstream: identity, generate: (r) => (r.length < queue.length ? { kind: 'conflict', report: queue[r.length]! } : { kind: 'clean' }) });
		expect(result).toMatchObject({ kind: 'converged', iterations: 3 });
		expect(result.resolutions.map((r) => r.resolution.symbols)).toEqual([['a', 'b'], ['c', 'd']]);
	});
	it('stops on a conflict reported twice', () => {
		const result = deriveConflictResolutions({ ruleCount: 10, upstream: identity, generate: () => ({ kind: 'conflict', report: reportFor('a', 'b') }) });
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'repeated' });
	});
	it('stops at the rule-count cap', () => {
		let n = 0;
		const result = deriveConflictResolutions({ ruleCount: 2, upstream: identity, generate: (): GenerateOutcome => ({ kind: 'conflict', report: reportFor(`r${n}`, `s${n++}`) }) });
		expect(result).toMatchObject({ kind: 'unresolvable', reason: 'cap' });
	});
	it('throws on a non-conflict generate error', () => {
		expect(() => deriveConflictResolutions({ ruleCount: 2, upstream: identity, generate: () => ({ kind: 'error', summary: {} }) })).toThrow();
	});
});
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - **`chooseResolution`:**
    - Take the offered `AddConflict` symbols. If none are offered, return `unusable`.
    - Map each symbol through `upstreamSourceOf`. The upstream-declared test is set equality against any `upstreamConflicts` entry.
  - **`deriveConflictResolutions`:**
    - Loop while `iterations <= ruleCount`, keeping a `Set` of `conflictKey`s.
    - A repeated key returns `repeated`.
    - An `error` outcome throws an `Error` carrying the summary. A load or table error other than a conflict is a broken grammar, not a conflict outcome.
- [ ] **Step 4:** Run it. Expected: PASS. Mutation check: drop the `upstreamSourceOf` mapping and confirm the reshaped-name case fails.
- [ ] **Step 5:** Add the glossary entries, then commit by pathspec.

### Task 2b: Evaluate for a derivation, in a fresh process

Lands before Task 3, because the driver needs it for the hash, the rule count and the reshaping records.

**Files:**
- Create: `packages/codegen/src/transpile/evaluate-for-derivation.ts` and its child entry `packages/codegen/src/transpile/evaluate-for-derivation.child.ts`
- Modify: `packages/codegen/src/dsl/sittir-grammar.ts`. Attach the reshaping-records sidecar (non-enumerable, like `DEAD_ENRICH_MINTS_KEY`), built from enrich's rule-origin map and wire's lift and rename records.
- Test: `packages/codegen/src/transpile/__tests__/evaluate-for-derivation.test.ts`
- Glossary: `docs/glossary/transpile.md`, `docs/glossary/dsl.md`

**Interfaces:**
- Produces:

```ts
export interface DerivationInputs {
	readonly grammarHash: string;
	readonly ruleCount: number;
	readonly upstreamConflicts: readonly (readonly string[])[];
	readonly upstreamSources: Readonly<Record<string, string>>;
}
export function evaluateForDerivation(pkg: GrammarPackage): DerivationInputs;
export function grammarHash(evaluated: { readonly conflicts?: unknown }): string;
```

- `evaluateForDerivation` runs the child entry with `tsx` in a fresh process. The child evaluates `packageEntryPath(pkg)` and prints `DerivationInputs` as JSON, and the parent reads it from stdout.
- `grammarHash` is sha256 of canonical JSON (keys sorted recursively) of the evaluated grammar with `conflicts` removed.
- `upstreamSources` maps only names that differ from their upstream source. `UpstreamContext.upstreamSourceOf` is `(n) => upstreamSources[n] ?? n`.
- `upstreamConflicts` is upstream's own declared list, which reaches `sittirGrammar` as the conflicts callback's `previous` argument.

- [ ] **Step 1:** Write the failing tests:
  - `grammarHash` ignores `conflicts` and key order, and changes when a rule changes;
  - `evaluateForDerivation(grammarPackage('python'))` returns a `ruleCount` equal to the rule count of the evaluated grammar, and `upstreamConflicts` equal to tree-sitter-python's 9 declared sets;
  - the parent process has not imported `packages/python/grammar.sittir.ts` after the call: no loaded module URL (read via the child's return, or the `node:module` registry) ends with that path.
- [ ] **Step 2:** Run, implement, run. Mutation check: drop the `conflicts` removal and confirm the hash-ignores-conflicts case fails.
- [ ] **Step 3:** Regenerate all five grammars (manifests only), run the gates, and commit by pathspec.

### Task 3: `sittirGrammar` applies the resolutions; auto producers retire

**Files:**
- Create: `packages/codegen/src/dsl/conflict-resolutions.ts` (`applyConflictResolutions`)
- Modify: `packages/codegen/src/dsl/sittir-grammar.ts`. The config gains `resolutions: ConflictResolutionsFile`.
- Modify: each `packages/<g>/grammar.sittir.ts` (python, rust, typescript, scm, regex). Add `import resolutions from './.sittir/resolutions.json';` and pass `resolutions` in the config.
- Generated seed: `packages/<g>/.sittir/resolutions.json` for all five, written by the Task 4 driver on the same regen; see Step 5.
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. Remove:
  - the `conflictGroups` field and its initialisers;
  - `wireRegisterConflict`;
  - the owner/self pair push in the subsequence-owner loop;
  - `wrapConflictsCallback` and `buildWiredConflictsFn`'s drain.

  `conflicts` passes the user callback through `renamingCallback` unchanged, until Task 6 turns an authored callback into a diagnostic.
- Modify: `packages/codegen/src/dsl/transform/transform.ts`. Remove `registerHoistedVariantConflicts` and its call.
- Test: `packages/codegen/src/dsl/__tests__/conflict-resolutions.test.ts`; update `packages/codegen/src/dsl/__tests__/wire.test.ts` (its `conflicts:` case at line ~409 pins the drain).
- Glossary: `docs/glossary/dsl.md`, `docs/glossary/dsl-wire.md`, `docs/glossary/dsl-transform.md`. Delete the entries for removed declarations.

**Interfaces:**
- Consumes: Task 2's `ConflictResolutionsFile`.
- Produces:

```ts
export function applyConflictResolutions(grammar: { conflicts?: unknown }, file: ConflictResolutionsFile): void;
```

`applyConflictResolutions` sets `grammar.conflicts` to `file.resolutions.map((r) => [...r.resolution.symbols])`. It runs in `sittirGrammar` right after `blankDeadEnrichMints`. `previous` never reaches the final array.

- [ ] **Step 1:** Write the failing tests:
  - `applyConflictResolutions` replaces a pre-existing `[['x','y']]` with the file's sets;
  - it yields `[]` for an empty resolution set;
  - it ignores `previous`: a grammar evaluated with an upstream conflict list and no resolutions ends with `conflicts: []`;
  - sittir's `evaluate` of a fixture grammar that imports a `resolutions.json` beside it returns `conflicts` equal to the file's sets. This is the runtime-agreement pin; the CLI side is pinned by Task 4's byte-identical parser.c.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement, and remove the producers listed above.
  - Before removing each, use `find_all_references` so no dangling caller is left.
  - `symbolRenames` stays if other consumers remain; check with `find_all_references` and remove it if the drain was its only reader.
- [ ] **Step 4:** Run the targeted tests, `rtk proxy pnpm run type-check` and `rtk proxy pnpm run lint`.
- [ ] **Step 5:** Do not commit or regenerate yet. The grammar imports need `resolutions.json`, and an empty set fails `generate` for python, rust, typescript and regex. Tasks 3 and 4 land as one commit, after Task 4's regen writes the derived files. Until then, seed each grammar's file by hand-running the driver from Task 4 Step 3, never by writing JSON.

### Task 4: The driver in regen, and the python proof

**Files:**
- Modify: `packages/codegen/src/run-codegen.ts`. `runTreeSitterGenerate(grammar)` becomes: derive (or reuse, after Task 5), write `.sittir/resolutions.json`, run the final `generate`, then `pruneOrphanedPlaceholderRules`.
- Modify: `packages/python/grammar.sittir.ts`. Delete the four entries and the `conflicts:` key.
- Modify: `docs/python-grammar-sittir-glossary.md`. Remove the entries explaining those four conflicts.
- Test: `packages/codegen/src/transpile/__tests__/derive-conflicts-cli.test.ts`, a CLI fixture.
- Generated: `packages/python/.sittir/resolutions.json` and the regenerated outputs.

**Interfaces:**
- Consumes: `deriveConflictResolutions` (Task 2), `evaluateForDerivation` (Task 2b) and `applyConflictResolutions` (Task 3).
- Produces: `export function runTreeSitterGenerate(pkg: GrammarPackage): void`, with its signature unchanged. It writes `packages/<g>/.sittir/resolutions.json` as `JSON.stringify(file, null, '\t') + '\n'`.

Before anything evaluates the grammar, the driver writes `{ grammarHash: '', resolutions: [] }` if `resolutions.json` is absent, so the grammar's import resolves. It then calls `evaluateForDerivation` once, which gives the hash, `ruleCount` and `UpstreamContext`.

The driver's `generate` callback:
1. writes the candidate resolutions file;
2. re-runs `transpileOverrides`, so the bundle picks up the new JSON;
3. runs `tree-sitter generate --json-summary` through `tree-sitter-cli.ts`, extended with `runTreeSitterCliCapturing(args, cwd): { status: number | null; stderr: string }` beside `runTreeSitterCli`, with one path to the CLI;
4. returns `parseGenerateOutcome(status, stderr)`.

The final file is written with `grammarHash` set to the hash from `evaluateForDerivation`.

- [ ] **Step 1:** Write the CLI fixture test.
  - Create a temp dir with a `grammar.js`: `grammar({ name: 'fx', rules: { source: $ => repeat($._expr), _expr: $ => choice($.binary, $.num), binary: $ => seq($._expr, '+', $._expr), num: _ => /\d+/ } })` and no conflicts.
  - Run `deriveConflictResolutions` with a `generate` callback that splices the resolutions into `module.exports.grammar.conflicts`.
  - Assert it converges with `[['binary']]`, step `default`.
  - Add a second fixture whose upstream `conflicts: $ => [[$.binary]]` is passed as `upstreamConflicts`, and assert step `upstream-declared`.

  The spec's precedence-copy case is added in Task 7.
- [ ] **Step 2:** Run it. Expected: FAIL until `runTreeSitterCliCapturing` exists. Implement it, then run again. Expected: PASS.
- [ ] **Step 2b: module-cache pin.** In one process, run the driver for a fixture package so it writes resolutions `R1`, then call `compileGrammar` for that package. Its evaluated `conflicts` must equal `R1`. Then re-derive to `R2` and compile again in a fresh process; it must see `R2`. The test fails if anything in the regen process imports `grammar.sittir.ts` before the final write.
- [ ] **Step 3:** Wire `runTreeSitterGenerate` to the loop, which also seeds each grammar's `resolutions.json` for Task 3's imports. Delete python's four entries and its `conflicts:` key.
- [ ] **Step 4:** Regenerate all five grammars (Task 0's command).
- [ ] **Step 5: The python proof.**
  - `node -e "console.log(require('./packages/python/.sittir/resolutions.json').resolutions.map(r=>r.resolution.symbols.join(',')))"` lists 11 sets. They are exactly the 8 upstream sets other than `print_statement,primary_expression`, plus `expression_statement,expression_statement_tuple`, `except_clause_exception_as,except_clause_exception_list` and `as_pattern,except_clause_exception_as`.
  - `sha256sum packages/python/.sittir/src/parser.c` equals the Task 0 baseline.
  - Any difference is preserved and reported to brainstorm, not reverted.
- [ ] **Step 6:** The other four grammars must also match their parser.c baselines. rust and typescript still carry authored `conflicts:` callbacks, which the resolutions now override; Task 8 deletes them.
- [ ] **Step 7:** Full gates:
  - `rtk proxy pnpm run validate:native` (rows compared with master's last row);
  - type-check, lint, `cargo check --workspace`, propose-14, parity (7 OK);
  - the full vitest suite as its own Bash call.
- [ ] **Step 8:** Commit Task 3's and Task 4's sources, tests, glossaries, the five grammar imports, the python grammar edit, the five `resolutions.json` files and the regenerated outputs, by pathspec, as one commit.

### Task 5: Reuse when the grammar is unchanged

**Files:**
- Modify: `packages/codegen/src/run-codegen.ts`
- Test: `packages/codegen/src/transpile/__tests__/derive-conflicts.test.ts`

**Interfaces:**
- Consumes: `evaluateForDerivation(pkg).grammarHash` (Task 2b).
- The driver reads the existing `resolutions.json`:
  - if `grammarHash` matches, it runs a single `generate`;
  - otherwise it re-derives from `[]`.

- [ ] **Step 1:** Write failing tests with an injected `DerivationInputs` and a `generate` counter:
  - unchanged hash → exactly 1 `generate` call, with the resolutions unchanged;
  - changed hash → derivation starts from an empty list, so a stale entry is dropped. Seed the file with `[['stale','x']]` and assert it is absent afterwards.
- [ ] **Step 2:** Run, implement, run.
- [ ] **Step 3:** Regenerate python twice. Instrument the second run and assert one `generate` call: the driver logs `resolutions reused` / `resolutions re-derived (N iterations)`.
- [ ] **Step 4:** Commit by pathspec.

### Task 6: Diagnostics

**Files:**
- Modify: `packages/codegen/src/compiler/diagnostics/grammar-diagnostics.ts`. Add `fromConflictResolution`, `fromConflictUnresolvable`, `fromConflictAuthored` and `fromUnnecessaryUpstreamConflict`, and register the two blocking codes in `BLOCKING_SHAPE_CODES` (not floorable).
- Modify: `packages/codegen/src/dsl/wire/wire.ts`. A present `config.conflicts` is recorded for the `conflict-authored` diagnostic, not applied.
- Modify: `packages/codegen/src/run-codegen.ts`. When the loop is unresolvable, emit `conflict-unresolvable` and stop the regen.
- Test: `packages/codegen/src/compiler/__tests__/conflict-diagnostics.test.ts`
- Glossary: `docs/glossary/compiler-diagnostics.md`

**Interfaces:**
- Produces:
  - informational records, `severity: 'info'`, `code: 'conflict-resolution'`, `details: { resolution, step, conflict }`, one per `DerivedResolution`;
  - `code: 'conflict-unnecessary-upstream'`, `details: { symbols }`, for each upstream conflict set that no derived resolution matches after `upstreamSourceOf` mapping (for python, `[print_statement, primary_expression]`);
  - `conflict-unresolvable`, `severity: 'fail'`, `details: { reason, report }`;
  - `conflict-authored`, `severity: 'fail'`, `details: { grammar }`.
- All of them land in `grammar-diagnostics.json` through the existing collector.

- [ ] **Step 1:** Write the failing tests:
  - python's resolutions yield 11 `conflict-resolution` records and one `conflict-unnecessary-upstream` record for `print_statement,primary_expression`;
  - a config with `conflicts:` yields a blocking `conflict-authored`;
  - a derivation result with `reason: 'no-usable-offer'` yields a blocking `conflict-unresolvable`.
- [ ] **Step 2:** Run, implement, run. Mutation check: register `conflict-authored` as floorable and confirm the blocking test fails.
- [ ] **Step 3:** Regenerate all five grammars. rust and typescript now block on `conflict-authored`, which is expected until Task 8; run Task 8 before the gates. Commit Tasks 6 and 8 together if the executor prefers a green commit.

### Task 7: Policy step 2, copying upstream precedence (waits on the user's ruling)

**Files:**
- Modify: `derive-conflicts.ts` (widen `DerivedResolution.resolution`); `dsl/conflict-resolutions.ts` (apply a Precedence/Associativity resolution per the user's ruling)
- Test: the CLI fixture from Task 4, extended with the spec's case

**Interfaces:**
- `DerivedResolution.resolution` gains `{ kind: 'Precedence' | 'Associativity'; symbols; direction: 'left' | 'right' | number }`.
- `UpstreamContext` gains `upstreamPrecedenceOf(finalName): { kind: 'left' | 'right' | 'plain'; value: number } | undefined`, read from the reshaping-records sidecar.

- [ ] **Step 1:** Write the failing fixture test.
  - Upstream `binary: $ => prec.left(seq($._expr, '+', $._expr))`, and a reshaped copy without the prec, converges to `Associativity` with direction `left`, step `upstream-precedence`.
  - Without the upstream prec, it converges to `AddConflict`.
- [ ] **Step 2:** Implement per the user's ruling.
- [ ] **Step 3:** Regenerate all five grammars. Every parser.c that changes is a place step 2 fired where master used `AddConflict`. Report each one to brainstorm before committing.
- [ ] **Step 4:** Commit by pathspec after brainstorm's review.

### Task 8: Retire the remaining hand-written conflicts

**Files:**
- Modify: `packages/rust/grammar.sittir.ts` and `packages/typescript/grammar.sittir.ts`. Delete `conflicts:`.
- Modify: `docs/rust-grammar-sittir-glossary.md` and `docs/typescript-grammar-sittir-glossary.md`. Delete the conflict entries, and rewrite prose that cites a `conflicts:` entry so it states the constraint without it.
- Generated: `packages/{rust,typescript,regex,scm}/.sittir/resolutions.json` and the regenerated outputs.

- [ ] **Step 1:** Delete the two `conflicts:` blocks and regenerate all five grammars.
- [ ] **Step 2:** Expected counts:
  - rust: 8 resolutions;
  - typescript: 61;
  - regex: 1 (`character_class,class_range`);
  - scm: 0.

  Every parser.c must equal its Task 0 baseline. Any other outcome is preserved and reported.
- [ ] **Step 3:** No `grammar-diagnostics.json` contains `conflict-authored`.
- [ ] **Step 4:** Full gates, as in Task 4 Step 7.
- [ ] **Step 5:** Commit by pathspec.

### Task 9: Generated-output hygiene

**Files:**
- Modify: whatever lists `.sittir/` generated files for the manifest and hygiene checks. Find it with `search "generated.manifest"` and `search "grammar-diagnostics.json" regex=true`, and add `resolutions.json` there.
- Test: the existing hygiene test for the manifest. Add a case that a hand edit to `resolutions.json` is detected, the same way the manifest detects `grammar.json` edits.

- [ ] **Step 1:** Write the failing hygiene case, then implement, and run it.
- [ ] **Step 2:** Regenerate all five grammars; confirm the manifests list `resolutions.json`.
- [ ] **Step 3:** Commit by pathspec.

## Review Focus

1. **A grammar whose load fails:** a syntax error, or a JS runtime exit during evaluation. The driver must fail loudly with tree-sitter's summary, not loop or record a resolution. Pinned in Task 1 (`error` outcome) and Task 2 (the loop throws).
2. **Console output before the JSON summary**, such as python's `transform: override field(...)` line. Parsing must take the last top-level object. Pinned in Task 1.
3. **A stale `resolutions.json` after a grammar edit that removes the need for an entry.** Re-derivation from empty must drop it. Pinned in Task 5.
4. **Reshaped names in an upstream-declared conflict,** such as a variant renamed from its upstream rule. The declared test must map through the records, not compare names. Pinned in Task 2's mapping test.
5. **Two runtimes disagreeing:** the CLI bundle applies resolutions but `evaluate` does not, or the reverse. Pinned by Task 3's `evaluate` test (conflicts equal to the file's sets) together with Task 4's byte-identical parser.c.

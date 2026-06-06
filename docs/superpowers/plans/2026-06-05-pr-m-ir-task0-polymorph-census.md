# PR-M-ir Task 0 — Polymorph-Form Census Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only `polymorph-census` diagnostic that classifies every polymorph-kind form across the three grammars into the three form-classes the PR-M-ir scope amendment defines (single-slot / fused / discriminating-literal), and produce the committed census artifact that unblocks the elevation (C) and literal-carrying-invariant (E) work.

**Architecture:** A pure classifier `censusPolymorphForms(grammar, NodeMap): FormCensusRow[]` plus a runner that builds each grammar's `NodeMap` (the existing `evaluate→link→optimize→assemble` path — pure TS, no native binary) and prints a table + JSON. The mechanical `fieldCount` split (single-slot vs fused) is a unit-tested tool; the deeper discriminating-literal classification (which forms carry an arm-distinguishing literal that leaks to `$other`) is a `sittir-research` diagnosis pass that annotates the same rows. Both outputs are committed under `docs/superpowers/plans/` as the census artifact.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), `pnpm`, `vitest`, the codegen pipeline in `packages/codegen/src/compiler/`, the `@sittir/tools` + `@sittir/cli` command framework.

**Source of truth:** spec `docs/superpowers/specs/2026-06-05-pr-m-ir-scope-amendment-design.md` (Component A — the three-class census). Reads `AssembledPolymorph` (`packages/codegen/src/compiler/node-map.ts:3276`, `.forms: AssembledGroup[]`, each form `.fields`).

---

## Pre-flight (read before any task)

- **Gate is unchanged but this work is read-only** — it adds a diagnostic, touches no codegen/generated output, so the RELEASE deep-AST gate (rust 111 / ts 69 / py 74) cannot move. Run `pnpm exec vitest run <test>` for tool tests; you do NOT need `validate:native` here.
- **`buildNodeMap` does not load the native `.node`** (it is `evaluate→link→optimize→assemble`, pure TS), so the cross-branch staleness guard that blocks `probe-kind` does NOT affect this work.
- **Filter polymorphs by `instanceof AssembledPolymorph`, NOT `modelType`** — node-map.ts:3265-3277 documents that `AssembledPolymorph` inherits `modelType === 'branch'`; a `modelType === 'polymorph'` filter matches nothing.
- **Line numbers drift with regen** — anchor on symbol names and `rg` to re-locate before editing.
- Commit discipline: explicit pathspec; options before `--`; never `git add -A`; never stage `rust/crates/sittir-*/test-fixtures.json` or `packages/validator/validation-history.jsonl`; messages end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

- **Create** `packages/tools/src/discover/polymorph-census.ts` — the pure classifier `censusPolymorphForms` + the `runPolymorphCensus` runner. Lives in `discover/` alongside the existing `list-kinds.ts`/`classify.ts` census-like tools.
- **Create** `packages/tools/src/discover/__tests__/polymorph-census.test.ts` — integration tests over real grammar NodeMaps.
- **Modify** `packages/tools/src/index.ts` — export `runPolymorphCensus`.
- **Create** `packages/cli/src/commands/tool/polymorph-census.ts` — the `CommandModule` wrapper (mirror `list-kinds.ts`).
- **Modify** `packages/cli/src/commands/tool/index.ts` — register the command.
- **Create** `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md` — the committed census output (Tasks 3 + 4).

---

## Task 1: Census core classifier (fieldCount split)

**Files:**
- Create: `packages/tools/src/discover/polymorph-census.ts`
- Test: `packages/tools/src/discover/__tests__/polymorph-census.test.ts`

- [ ] **Step 1: Confirm the `buildNodeMap` idiom + `AssembledPolymorph` shape**

Run: `rg -n "async function buildNodeMap|n instanceof AssembledPolymorph|get forms\(\)|get fields\(\)" packages/tools/src/discover/list-kinds.ts packages/codegen/src/compiler/node-map.ts`
Expected: `list-kinds.ts` has a private `buildNodeMap(grammar, mods)`; `node-map.ts` exports `class AssembledPolymorph` with `get forms(): AssembledGroup[]`, and `AssembledGroup` has `get fields(): readonly AssembledNonterminal[]`.

- [ ] **Step 2: Write the failing test**

```typescript
// packages/tools/src/discover/__tests__/polymorph-census.test.ts
import { describe, it, expect } from 'vitest';
import { censusPolymorphForms } from '../polymorph-census.ts';
import { buildNodeMapForGrammar } from '../polymorph-census.ts';

describe('censusPolymorphForms', () => {
	it('classifies python dict_pattern as fused (a >1-field form exists)', async () => {
		const nm = await buildNodeMapForGrammar('python');
		const rows = censusPolymorphForms('python', nm);
		const dictRows = rows.filter((r) => r.kind === 'dict_pattern');
		expect(dictRows.length).toBeGreaterThan(0);
		expect(dictRows.some((r) => r.formClass === 'fused')).toBe(true);
		expect(dictRows.some((r) => r.fieldCount > 1)).toBe(true);
	});

	it('emits one row per (kind, formIndex) and never negative fieldCount', async () => {
		const nm = await buildNodeMapForGrammar('python');
		const rows = censusPolymorphForms('python', nm);
		expect(rows.length).toBeGreaterThan(0);
		for (const r of rows) {
			expect(r.fieldCount).toBeGreaterThanOrEqual(0);
			expect(r.formClass).toBe(r.fieldCount > 1 ? 'fused' : 'single-slot');
		}
	});
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/tools/src/discover/__tests__/polymorph-census.test.ts`
Expected: FAIL — `Cannot find module '../polymorph-census.ts'`.

- [ ] **Step 4: Implement the classifier**

```typescript
// packages/tools/src/discover/polymorph-census.ts
import { AssembledPolymorph } from '@sittir/codegen/compiler/node-map.ts';
import type { NodeMap } from '@sittir/codegen/compiler/node-map.ts';
import * as codegen from '@sittir/codegen';

/** A form is `fused` when it carries more than one field (the byte-neutral
 *  forms-getter seam would drop the extra fields); otherwise `single-slot`.
 *  The third class — `discriminating-literal` — is layered on by Task 4
 *  (it requires rule-tree literal-leak analysis, not just a field count). */
export type FormClass = 'single-slot' | 'fused';

export interface FormCensusRow {
	readonly grammar: string;
	readonly kind: string;
	readonly formIndex: number;
	readonly fieldCount: number;
	readonly formClass: FormClass;
}

/** Pure: classify every polymorph-kind form in a built NodeMap. */
export function censusPolymorphForms(grammar: string, nm: NodeMap): FormCensusRow[] {
	const rows: FormCensusRow[] = [];
	for (const [kind, node] of nm.nodes) {
		if (!(node instanceof AssembledPolymorph)) continue;
		node.forms.forEach((form, formIndex) => {
			const fieldCount = form.fields.length;
			rows.push({
				grammar,
				kind,
				formIndex,
				fieldCount,
				formClass: fieldCount > 1 ? 'fused' : 'single-slot',
			});
		});
	}
	return rows;
}

/** Build a grammar's NodeMap via the pure evaluate→link→optimize→assemble
 *  pipeline (no native binary, no manifest guard). Mirrors the private
 *  buildNodeMap in list-kinds.ts; uses the @sittir/codegen barrel directly. */
export async function buildNodeMapForGrammar(grammar: string): Promise<NodeMap> {
	const entryPath = codegen.resolveOverridesOrGrammarPath(grammar);
	const raw = await codegen.evaluate(entryPath);
	const linked = codegen.link(raw);
	const optimized = codegen.optimize(linked);
	return codegen.assemble(optimized);
}
```

> **NOTE before writing Step 4:** verify the exact `@sittir/codegen` barrel exports with `rg -n "export .*(evaluate|link|optimize|assemble|resolveOverrides|resolveGrammarJsPath)" packages/codegen/src/index.ts`. If `resolveOverridesOrGrammarPath` is not exported, inline the `existsSync(resolveOverridesPath(g)) ? … : resolveGrammarJsPath(g)` idiom from `list-kinds.ts:resolveEntryPath` and import those two resolvers instead. Adjust the import to whatever the barrel actually exposes (the existing tools import a `CodegenModules` object — match that pattern if the barrel is not directly importable).

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run packages/tools/src/discover/__tests__/polymorph-census.test.ts`
Expected: PASS (2 tests). If `dict_pattern` is NOT classified `fused`, STOP — that contradicts the spec's premise; re-probe `dict_pattern`'s forms (`rg -n "dict_pattern" packages/python/.sittir/grammar.js`) and report before continuing.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(tools): polymorph-form census classifier (fieldCount split)

Pure censusPolymorphForms(grammar, NodeMap) classifying every
AssembledPolymorph form as single-slot vs fused (>1 field). Component A
(mechanical half) of the PR-M-ir scope amendment.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- \
  packages/tools/src/discover/polymorph-census.ts \
  packages/tools/src/discover/__tests__/polymorph-census.test.ts
```

---

## Task 2: CLI wiring (`sittir tool polymorph-census`)

**Files:**
- Modify: `packages/tools/src/index.ts`
- Create: `packages/cli/src/commands/tool/polymorph-census.ts`
- Modify: `packages/cli/src/commands/tool/index.ts`

- [ ] **Step 1: Add the runner to the census module**

Append to `packages/tools/src/discover/polymorph-census.ts`:

```typescript
/** Runner: census all (or the given) grammars, print a table + a JSON blob. */
export async function runPolymorphCensus(grammars: readonly string[] = ['rust', 'typescript', 'python']): Promise<void> {
	const all: FormCensusRow[] = [];
	for (const g of grammars) {
		const nm = await buildNodeMapForGrammar(g);
		all.push(...censusPolymorphForms(g, nm));
	}
	const fused = all.filter((r) => r.formClass === 'fused');
	process.stdout.write(`# polymorph-form census — ${all.length} forms across ${grammars.length} grammars\n`);
	process.stdout.write(`# fused (fieldCount>1): ${fused.length}\n\n`);
	for (const r of all) {
		process.stdout.write(`${r.grammar}\t${r.kind}\t#${r.formIndex}\tfields=${r.fieldCount}\t${r.formClass}\n`);
	}
	process.stdout.write(`\n${JSON.stringify(all, null, 2)}\n`);
}
```

- [ ] **Step 2: Export it from the tools barrel**

Run: `rg -n "export .* from './discover" packages/tools/src/index.ts`
Then add the export line matching the file's existing style, e.g.:

```typescript
export { runPolymorphCensus, censusPolymorphForms } from './discover/polymorph-census.ts';
```

- [ ] **Step 3: Create the CLI command module (mirror list-kinds)**

First read the reference: `cat packages/cli/src/commands/tool/list-kinds.ts`. Then create `packages/cli/src/commands/tool/polymorph-census.ts` with the SAME structure, e.g.:

```typescript
import type { CommandModule } from '../../command-module.ts';
import { defineCommand, withGrammar } from '../../options.ts';
import { runPolymorphCensus } from '@sittir/tools';

export const polymorphCensus: CommandModule = {
	name: 'polymorph-census',
	describe: 'Classify every polymorph-kind form (single-slot vs fused) across grammars',
	register(program) {
		withGrammar(defineCommand(program, polymorphCensus)).action(async (opts: { grammar?: string }) => {
			const grammars = opts.grammar ? [opts.grammar] : ['rust', 'typescript', 'python'];
			await runPolymorphCensus(grammars);
		});
	},
};
```

> **NOTE:** the exact `CommandModule` shape, the import paths (`command-module.ts`/`options.ts`), and the `withGrammar`/`defineCommand`/`.action` wiring MUST be copied from `list-kinds.ts` — do not invent. If `list-kinds.ts` makes `--grammar` required via `withGrammar`, make it optional here (census defaults to all three) by reading `list-kinds.ts`'s actual option helper and using the optional variant, or omit `withGrammar` and add `.option('--grammar <name>', ...)` directly.

- [ ] **Step 4: Register the command**

In `packages/cli/src/commands/tool/index.ts`, mirror the two `listKinds` references (the import line ~`:19` and the registration array ~`:45`):

```typescript
import { polymorphCensus } from './polymorph-census.ts';
// …and add `polymorphCensus,` to the same array that contains `listKinds,`
```

- [ ] **Step 5: Verify the command runs end-to-end**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool polymorph-census --grammar python 2>&1 | head -20`
Expected: a `# polymorph-form census` header, tab-separated rows including a `python dict_pattern … fused` line, then a JSON blob. No native/manifest error (buildNodeMap is pure TS).

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(cli): sittir tool polymorph-census command

Wires runPolymorphCensus into the unified CLI (mirrors list-kinds).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- \
  packages/tools/src/discover/polymorph-census.ts \
  packages/tools/src/index.ts \
  packages/cli/src/commands/tool/polymorph-census.ts \
  packages/cli/src/commands/tool/index.ts
```

---

## Task 3: Emit + commit the three-grammar fieldCount census artifact

**Files:**
- Create: `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md`

- [ ] **Step 1: Run the census across all three grammars**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool polymorph-census 2>&1 | tee /tmp/polymorph-census.txt | head -60`
Expected: rows for rust + typescript + python; a `# fused (fieldCount>1): N` summary line.

- [ ] **Step 2: Write the artifact doc**

Create `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md` with:
- A header: date, the command that produced it, the gate state at capture (`pr-m-phi2` HEAD sha from `git rev-parse --short HEAD`).
- The full tab table (paste from `/tmp/polymorph-census.txt`).
- A **fused set** section: the explicit list of `(grammar, kind)` with any `fieldCount>1` form — these are the **elevation targets (Component C)**.
- A line stating the discriminating-literal set is filled by Task 4.

- [ ] **Step 3: Cross-check the spec's named instances**

Confirm the fused set CONTAINS `python dict_pattern` and `rust match_block` (the spec's named fused instances). If `match_block` is NOT present as a polymorph, note it explicitly in the artifact — it may already be modeled as a group/branch rather than a polymorph (the handoff mentions a partial `match_arm last_arm` landing); that is a finding the elevation plan needs.

- [ ] **Step 4: Commit**

```bash
git commit -m "docs(plan): polymorph-form census artifact — fused set for Component C

Captured fieldCount census across rust/ts/python. Fused (fieldCount>1)
forms are the elevation targets for the PR-M-ir scope amendment.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- \
  docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md
```

---

## Task 4: Discriminating-literal census (sittir-research) — annotate the artifact

**Files:**
- Modify: `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md`

This is a **diagnosis** pass, not a mechanical count — it requires walking each form's rule tree for literals that distinguish an arm but are not captured in a slot (they leak to `$other` and no template renders them). Per the repo's agent roles, this is a `sittir-research` job.

- [ ] **Step 1: Dispatch `sittir-research` with this exact scope**

Prompt the agent:
> Read-only. For each polymorph kind in `/tmp/polymorph-census.txt` (and any single-slot form), determine whether any **form/arm is distinguished by a string literal that is NOT carried in a slot** — i.e. the literal would land in `$other` and no template renders it. Confirm the three known cases empirically with `probe-kind`: `python yield` (`yield from x` → does `from` leak to `$other`?), `rust visibility_modifier` (`pub(in path)` — is `in` ungated/dropped?), `python except_clause` (`except E as x` — is `as` carried?). Then sweep the rest of the polymorph set for the same shape. Output a table `(grammar, kind, formIndex, distinguishing-literal, leaks-to-$other?)`. Do NOT edit code. Pin the mechanism location (which walker/slot-collection step drops the literal) for the eventual PR-I fix.

- [ ] **Step 2: Fold the research output into the artifact**

Add a **discriminating-literal set** section to `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md`: the `(grammar, kind)` list with their distinguishing literals and whether each leaks. These are the **literal-carrying-invariant targets (Component E)** and the inputs to the E diagnostic.

- [ ] **Step 3: Produce the final three-class roll-up**

At the top of the artifact, add a summary table: each polymorph kind → its class (single-slot / fused / discriminating-literal), with fused → C and discriminating-literal → E. This is the census deliverable that the follow-up elevation/invariant plan is written against.

- [ ] **Step 4: Commit**

```bash
git commit -m "docs(plan): discriminating-literal census + 3-class roll-up

sittir-research diagnosis of arm-distinguishing literals that leak to
\$other (yield 'from', visibility_modifier 'in', except_clause 'as', + sweep).
Completes the Component-A census: fused→C, discriminating-literal→E.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" -- \
  docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md
```

---

## Done criterion + handoff

The census is complete when `docs/superpowers/plans/2026-06-05-polymorph-census-artifact.md` carries the three-class roll-up (every polymorph kind labelled single-slot / fused / discriminating-literal) with the fused set (→ Component C elevation) and discriminating-literal set (→ Component E invariant) explicitly enumerated.

**Next plan (separate, authored against this artifact):** Component C (fused-form elevation to wire group kinds) + Component E (literal-carrying invariant + diagnostic), then the existing `2026-05-31-pr-m-rule-ir-cut.md` Task 2+ (the polymorph→AssembledBranch collapse) now that every form is single-slot or single-slot+carried-literal. Do NOT start C/E until this artifact lands — their concrete scope IS its output.

## Self-review notes
- **Spec coverage:** Component A (three-class census) — Tasks 1-4. Components B/C/D/E/G are explicitly out (B already planned; C/D/E/G are the next plan, gated on this artifact). `M ≺ I` preserved (this plan is read-only/diagnostic; zero codegen output).
- **Type consistency:** `FormCensusRow`/`censusPolymorphForms`/`buildNodeMapForGrammar`/`runPolymorphCensus` used consistently across Tasks 1-3.
- **Known soft spot:** the `@sittir/codegen` barrel export names (Task 1 Step 4) and the `CommandModule` wiring (Task 2 Step 3) are flagged with explicit "verify before writing / copy from list-kinds.ts" notes rather than assumed — the implementer confirms against the real files.

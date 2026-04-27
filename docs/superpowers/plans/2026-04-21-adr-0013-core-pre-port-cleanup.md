# ADR-0013 Core Pre-Port Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute ADR-0013's three must-do tasks — split loader, collapse identical variant blocks + align `$variant` names, and pre-partition consumption — so `@sittir/core` is browser-safe and ready for the Rust port + askama migration.

**Architecture:** Task 1 splits `loadTemplates` + I/O into a separate module so `render.ts` has no `node:*` imports. Task 2 updates the codegen template emitter to detect identical-across-forms variants and emit a single template; aligns factory `$variant` stamping with template keys by stripping the `_form_` prefix. Task 3 extracts the consumption tracking from `resolveSlot` into a `prepare(node, rule)` step that returns a pre-materialized bag, while keeping render output byte-identical.

**Tech Stack:** TypeScript ESM, vitest, `@sittir/core`, codegen pipeline (`packages/codegen/src/`), per-grammar generated packages.

Scope note: Tasks 4 and 5 from ADR-0013 are nice-to-haves and are NOT in this plan — they land as separate follow-ups.

---

## Task 1: Split template loading from render engine

**Files:**

- Create: `packages/core/src/loader.ts`
- Modify: `packages/core/src/render.ts` (remove I/O)
- Modify: `packages/core/src/index.ts` (re-export from loader)

- [ ] **Step 1.1: Create `loader.ts` with `loadTemplates` + `createRenderer`**

The loader owns all I/O. `createRenderer`'s string overload lives here
(delegating to the RulesConfig form exported by `render.ts`). The
RulesConfig overload also re-exports through the loader so consumers get
one entry point.

```ts
// packages/core/src/loader.ts
import * as fs from "node:fs";
import { parse as parseYaml } from "yaml";
import type { RulesConfig } from "./types.ts";
import { createRendererFromConfig, type BoundRenderer } from "./render.ts";

export function loadTemplates(yamlPath: string): RulesConfig {
	const content = fs.readFileSync(yamlPath, "utf-8");
	return parseYaml(content) as RulesConfig;
}

export function createRenderer(yamlPath: string): BoundRenderer;
export function createRenderer(config: RulesConfig): BoundRenderer;
export function createRenderer(pathOrConfig: string | RulesConfig): BoundRenderer {
	const config = typeof pathOrConfig === "string" ? loadTemplates(pathOrConfig) : pathOrConfig;
	return createRendererFromConfig(config);
}
```

- [ ] **Step 1.2: Strip I/O + rename `createRenderer` in `render.ts`**

Remove the `fs` / `yaml` imports. Remove `loadTemplates` and the string
overload. Rename the body-holding function to `createRendererFromConfig`
and export it + the `BoundRenderer` type. `render.ts` now has zero
`node:*` imports.

Delete:

- `import * as fs from 'node:fs';`
- `import { parse as parseYaml } from 'yaml';`
- The `loadTemplates` function.
- The string overload on `createRenderer`.

Export the config-form:

```ts
export function createRendererFromConfig(config: RulesConfig): BoundRenderer {
	const ctx = buildRenderContext(config);
	// ... existing body, just without the path-or-config conditional
}
```

- [ ] **Step 1.3: Update `index.ts` to re-export from `loader.ts`**

```ts
// packages/core/src/index.ts
export { createRenderer, loadTemplates } from "./loader.ts";
// + keep existing type exports from render.ts unchanged
```

- [ ] **Step 1.4: Run tests + verify no `node:*` in `render.ts`**

Run: `grep -c 'node:' packages/core/src/render.ts`
Expected: `0`

Run: `pnpm test`
Expected: all tests pass (4 grammars × roundtrip; no regressions).

- [ ] **Step 1.5: Commit**

```bash
git add packages/core/src/loader.ts packages/core/src/render.ts packages/core/src/index.ts
git commit -m "core: split template loading from render engine (ADR-0013 Task 1)

render.ts has zero node:* imports. loadTemplates + createRenderer(yamlPath)
move to loader.ts. Consumers continue importing from @sittir/core unchanged."
```

---

## Task 2: Collapse identical variant blocks; align `$variant` names

**Files:**

- Modify: codegen template emitter (identify the walker that emits
  `variants:` blocks — likely in `packages/codegen/src/emitters/` or
  `packages/codegen/src/compiler/`)
- Modify: factory emitter's `$variant` stamping (strip `_form_` prefix
  at stamp time; likely `packages/codegen/src/emitters/factories.ts`)
- Regenerate: `packages/rust/templates.yaml`,
  `packages/typescript/templates.yaml`,
  `packages/python/templates.yaml`
- Regenerate: `packages/{rust,typescript,python}/src/factories.ts`

- [ ] **Step 2.1: Locate the template emitter that writes `variants:`**

Run:

```bash
grep -rn "variants:" packages/codegen/src/ | head -20
```

The emitter that writes `variants:` into YAML is the one to change. It
already walks polymorph forms and emits one entry per form. The change:
after building the variant map, if all values are structurally equal,
emit as a single `template:` string instead.

- [ ] **Step 2.2: Add identical-variant collapse to the template emitter**

Pseudocode for the change (exact code depends on the emitter's current
structure — apply the concept):

```ts
// Before emitting `variants: { form1: T1, form2: T2, ... }`:
const entries = Object.values(variants).map(normalizeTrailingNewline);
const allEqual = entries.every((e) => e === entries[0]);
if (allEqual) {
	// Emit as a single template string
	return entries[0];
}
// Otherwise emit variants: block as before
return { variants };

function normalizeTrailingNewline(s: string): string {
	return s.endsWith("\n") ? s.slice(0, -1) : s;
}
```

- [ ] **Step 2.3: Strip `_form_` prefix when stamping `$variant` in factories**

Locate the factory emitter's `$variant` stamping. It currently emits
something like `$variant: '_form_external'`. Change to strip the
`_form_` prefix at stamp time:

```ts
// Before: $variant: '_form_' + formName
// After:  $variant: formName   (no prefix)
```

The internal form identifier can keep the `_form_` prefix in codegen
data structures — only the stamped output value changes.

- [ ] **Step 2.4: Regenerate all three grammar packages**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 2.5: Verify only three rules retain `variants:` blocks**

Run:

```bash
grep -B 1 "^    variants:" packages/rust/templates.yaml packages/typescript/templates.yaml packages/python/templates.yaml
```

Expected output: exactly three matches:

- `rust/visibility_modifier`
- `typescript/export_statement`
- `typescript/call_expression`

If additional rules retain variants, inspect them — they may genuinely
differ (update the table in ADR-0013 Context if so), or the collapse
logic may have a bug.

- [ ] **Step 2.6: Add assertion in test harness that `$variant` primary dispatch succeeds**

For the three variant-retaining rules, factory-produced nodes must
dispatch via `obj.variants[node.$variant]`, not via the field-presence
fallback. Add a minimal assertion test:

```ts
// packages/core/tests/variant-dispatch.test.ts
import { describe, it, expect } from "vitest";
import type { RulesConfig } from "../src/types.ts";
import { createRenderer } from "../src/loader.ts";
// Pull in the three-grammar templates to check $variant-keyed rules.

describe("variant dispatch uses primary $variant key", () => {
	// Minimal inline test: a rule with variants, a factory-produced
	// node stamping $variant, render must match the variant-keyed
	// template exactly, not fall through to pickTemplate.
	it("matches template by $variant key", () => {
		const config: RulesConfig = {
			rules: {
				widget: {
					variants: {
						alpha: "A:$NAME",
						beta: "B:$NAME",
					},
				},
			},
		};
		const { render } = createRenderer(config);
		const node = {
			$type: "widget",
			$source: "factory" as const,
			$variant: "beta",
			$fields: { name: { $type: "id", $source: "factory" as const, $text: "x", $named: true } },
		};
		expect(render(node as any)).toBe("B:x");
	});
});
```

- [ ] **Step 2.7: Run full test suite — verify round-trip ceilings unchanged**

```bash
pnpm test
```

Expected: same pass/fail counts as baseline before Task 2. Any new
failure indicates the collapse changed render behavior for a corpus
case — investigate before committing.

- [ ] **Step 2.8: Commit**

```bash
git add packages/codegen/src/ \
    packages/rust/templates.yaml packages/typescript/templates.yaml packages/python/templates.yaml \
    packages/rust/src/factories.ts packages/typescript/src/factories.ts packages/python/src/factories.ts \
    packages/core/tests/variant-dispatch.test.ts
git commit -m "codegen: collapse identical variant templates; strip _form_ from \$variant (ADR-0013 Task 2)

Template emitter detects all-equal variant entries and emits as a single
template. Factory stamps \$variant without the _form_ prefix so primary
dispatch (obj.variants[node.\$variant]) succeeds for the three rules that
genuinely branch on variant: rust/visibility_modifier,
typescript/export_statement, typescript/call_expression."
```

---

## Task 3: Pre-partition consumed vs. unconsumed children

**Files:**

- Modify: `packages/core/src/render.ts` (extract `prepare()`)
- Add (optional): `packages/core/src/prepare.ts` if the logic is
  large enough to split

- [ ] **Step 3.1: Document the current consumption ordering contract**

Before extracting, annotate the existing `render()` function with the
ordering it relies on (as a comment, for reviewability):

```ts
// Consumption order (must be preserved across any refactor):
// 1. Clauses — resolve before $$$CHILDREN; may consume children by kind.
// 2. Field slots — read from $fields only; do not consume children.
// 3. $$$CHILDREN — emits unconsumed named children; consumes them.
// 4. Field-to-child promotion (step 4a) — only when template has no
//    $$$CHILDREN slot and the named child count is exactly 1.
```

- [ ] **Step 3.2: Write failing test that prepare() exists + returns expected shape**

Create `packages/core/tests/prepare.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { prepare } from "../src/render.ts";

describe("prepare()", () => {
	it("materializes a PreparedRender bag", () => {
		const config = {
			rules: {
				greet: "$NAME!",
			},
		};
		const node = {
			$type: "greet",
			$source: "factory" as const,
			$fields: { name: { $type: "id", $source: "factory" as const, $text: "world", $named: true } },
		};
		const prepared = prepare(node as any, config);
		expect(prepared.fields.name).toBe("world");
		expect(prepared.children).toEqual([]);
	});
});
```

- [ ] **Step 3.3: Run test to confirm it fails**

```bash
pnpm --filter @sittir/core test prepare.test.ts
```

Expected: FAIL (prepare is not exported).

- [ ] **Step 3.4: Extract prepare() from render.ts**

The extraction strategy: `prepare()` walks the node and template once,
producing the finished bag. The existing `render()` implementation
becomes: call `prepare(node, rule, ctx)`, then substitute `$VAR` in the
template text against the bag.

The tricky parts:

- `$$$CHILDREN` needs to know which children were consumed by clauses.
- Clauses can recursively reference other clauses (nested clause refs).
- Field-to-child promotion depends on whether template contains
  `$$$CHILDREN`.

Approach: do one pass over the template to identify slot references,
compute consumption eagerly based on those references, then build the
bag.

Keep the body of `render()` in `render.ts`, just restructured:

```ts
export interface PreparedRender {
	readonly fields: Record<string, string>;
	readonly children: readonly string[];
	readonly variant: string;
	readonly text: string;
	readonly trailingSep: boolean;
	readonly leadingSep: boolean;
}

export function prepare(
	node: AnyNodeData,
	rule: TemplateRule,
	ctx: InternalRenderContext,
): PreparedRender {
	// ... walk rule's template (and variants/clauses), collect consumed
	// indices, resolve each slot to its string form, return the bag.
}

function render(node: AnyNodeData, ctx: InternalRenderContext): string {
	// ... existing, but calls prepare() internally and substitutes against it.
}
```

- [ ] **Step 3.5: Run test to confirm it passes**

```bash
pnpm --filter @sittir/core test prepare.test.ts
```

Expected: PASS.

- [ ] **Step 3.6: Add unit tests for the three tricky cases**

In `prepare.test.ts`, add:

```ts
it("clause consumes a child that $$$CHILDREN would emit", () => {
	// Template: $CLAUSE_FOO $$$CHILDREN
	// Node has a child matching clause-kind + additional named children.
	// Expect: clause child is in fields[...] output; $$$CHILDREN emits
	// only the remainder.
});

it("flankSep detects adjacent anon separator after consumption", () => {
	// Template: $$$CHILDREN with joinByTrailing: true
	// Node children: [a, b, c, ',']
	// Expect: trailingSep=true in the bag.
});

it("field-to-child promotion only when no $$$CHILDREN + single named child", () => {
	// Template: $FOO
	// Node children: [singleChild], no $fields.foo
	// Expect: prepared.fields.foo === render(singleChild)
});
```

- [ ] **Step 3.7: Run full round-trip corpus — byte-identical output**

```bash
pnpm test
```

Expected: ALL tests pass with zero diff vs. pre-refactor baseline.
Any diff indicates the extraction lost ordering or consumption state.

- [ ] **Step 3.8: Commit**

```bash
git add packages/core/src/render.ts packages/core/tests/prepare.test.ts
git commit -m "core: extract prepare() — pre-partition render input (ADR-0013 Task 3)

render() now calls prepare(node, rule, ctx) to materialize a finished
PreparedRender bag, then substitutes \$VAR placeholders against the bag.
Consumption tracking, clause resolution, and field-to-child promotion
all happen in prepare(); render() becomes a pure regex substitutor.

Output is byte-identical on the full round-trip corpus across rust,
typescript, and python. This unblocks migration to a declarative
template engine (askama / Nunjucks) which expects a pre-computed
context map."
```

---

## Follow-ups (not in this plan)

- Task 4 (extract `placeChildren` from `readNode`) — nice-to-have pre-port.
- Task 5 (keyword-promotion allowlist audit) — investigation only.
- Askama / Nunjucks engine migration — separate ADR/plan.
- `$variant` stamping on `readNode` output for type discrimination —
  separate follow-up.

# Codegen Dogfooding — Architectural Design

**Status:** Draft, 2026-05-11
**Companion to:** `docs/adr/0024-codegen-dogfooding-construction-templates.md`
**Related:** ADR-0018 (NodeData surface + generated-output hygiene rules), ADR-0022 (construction templates — the infrastructure being dogfooded), `docs/superpowers/specs/2026-05-10-construction-templates-design.md`

ADR-0024 captured the architectural decision: migrate sittir's ~14K lines of generated TypeScript and ~1.5K lines of generated Rust from string-concatenation emitters to construction templates. This design fills in what the ADR deferred — the per-tier migration strategy (especially Tier 3's variable-structure cases), bootstrap staging mechanism, hygiene-rule violation capture, scope inclusion of new emitters added by ADR-0022 / 0023, and the validation contract that keeps the migration shape-preserving.

## 1. Scope

In scope:

- Migration of the 12 emitters listed in ADR-0024 §Decision (Tier 1–4 + Rust render-module track).
- **Tier 1.5** — the 5 new emitters added by ADR-0022 / 0023 (`snippets.ts`, `template-wrapper.ts`, `query-entry.ts`, `cursor-types.ts`, `pattern-bindings.ts`), born-as-templates rather than migrated.
- Bootstrap staging via a snapshot-diff workflow (`dogfood-promote.ts`).
- Hygiene-rule violation capture as an automated lint pass over generated output.
- Per-tier byte-identical regen as the validation contract.

Out of scope (explicit non-goals):

- Adding new public surface to construction templates. The point of dogfooding is to use ADR-0022's existing surface, not extend it.
- Changing the *contents* of generated output. Byte-identical regen is the contract; any output change is a separate, named refactor.
- Migrating tests. Existing test suites continue to validate behavior; the dogfooding migration is shape-preserving.
- An AST-based transpiler harness. Manual migration preserves the template-authoring ergonomics signal (a transpiler would silence what's painful about authoring templates).
- Conditional-fill template features (`{% if %}`, etc.) inside construction templates. Hard cases decompose into multiple templates and compose at the emitter level.

## 2. Architecture

Dogfooding is a **migration**, not a feature. Each emitter currently produces source text via string concatenation; the migration replaces that with `template('...').fill({slots}).render()` (using ADR-0022's existing construction-template surface) and validates via byte-identical regen of the generated output.

```
codegen-side
   ┌────────────────────────────────────┐
   │  emitters/<name>.ts                 │  (modified — calls fill() not concat)
   │    │                                │
   │    └──▶ templates/*.template        │  (NEW — adjacent files in templates/ dir)
   └────────────────────────────────────┘
                  │
                  ▼
       construction-templates fill (ADR 0022)
                  │
                  ▼
   generated source (TS / Rust)  ◀──── byte-identical regen check ────▶ pre-migration baseline
```

Two architectural commitments:

- **Zero new public surface.** No new template features. No new emitter framework. The migration uses precisely the construction-templates surface user codemods use.
- **Byte-identical generated output is the validation.** Any diff in regenerated output is a regression. The migration succeeds when all consumers' tests pass against unchanged generated code.

## 3. Component breakdown

| Layer                                                    | Where                                                            | ~LoC delta | Owner             |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ---------: | ----------------- |
| TS-fallback fill (sync, after warmup)                    | (reused from construction-templates plan Task 5.4)               |          0 | (existing)        |
| Bootstrap snapshot/promote tooling                       | `scripts/dogfood-promote.ts`                                     |       ~80 | repo root         |
| Hygiene-rule lint pass                                   | `packages/codegen/src/lint/hygiene.ts`                           |      ~120 | `@sittir/codegen` |
| Hygiene lint tests                                       | `packages/codegen/__tests__/lint/hygiene.test.ts`                |       ~60 | `@sittir/codegen` |
| Tier 1 templates                                         | `packages/codegen/src/emitters/templates/{config,index-file,grammar,template-hash}.template` |      ~50 | `@sittir/codegen` |
| Tier 1.5 templates (new emitters)                        | `packages/codegen/src/emitters/templates/{snippets,template-wrapper,query-entry,cursor-types,pattern-bindings}.template` |     ~200 | `@sittir/codegen` |
| Tier 2 templates                                         | `packages/codegen/src/emitters/templates/{is-kind,ir-kind,consts-*}.template` |      ~150 | `@sittir/codegen` |
| Tier 3 templates (decomposed; ~5 sub-templates per emitter) | `packages/codegen/src/emitters/templates/{wrap,types,factories,client-utils}-*.template` |     ~600 | `@sittir/codegen` |
| Rewritten emitters (Tier 1)                              | `emitters/{config,index-file,grammar,template-hash}.ts`          |  −100 net | `@sittir/codegen` |
| Rewritten emitters (Tier 1.5)                            | `emitters/{snippets,template-wrapper,query-entry,cursor-types,pattern-bindings}.ts` | −200 net | `@sittir/codegen` |
| Rewritten emitters (Tier 2)                              | `emitters/{is,ir,consts}.ts`                                     |   −600 net | `@sittir/codegen` |
| Rewritten emitters (Tier 3)                              | `emitters/{wrap,types,factories,client-utils}.ts`                |  −2,000 net | `@sittir/codegen` |
| Per-emitter byte-identical baselines                     | `packages/codegen/__tests__/dogfood-baseline/`                   |      ~100 | `@sittir/codegen` |
| Rust render-module rewrite                               | `emitters/render-module.ts`                                      |  −600 net | `@sittir/codegen` |

**Net code delta:** approximately **−3,500 lines** in emitters, **+1,300 lines** in templates + tooling. Generated output is unchanged byte-for-byte (the entire validation contract).

## 4. Tier strategy

### 4.1 Tier 1 — structural boilerplate

| Emitter            | Lines | Pattern                |
| ------------------ | ----: | ---------------------- |
| `config.ts`        |    22 | One template, one fill |
| `index-file.ts`    |    59 | One template, one fill |
| `grammar.ts`       |    62 | One template, one fill |
| `template-hash.ts` |    80 | One template, one fill |

Trivial. Each emitter becomes ~10 lines that read its template and fill once with a small slot map.

### 4.2 Tier 1.5 — new emitters from ADR 0022/0023 (born-as-templates)

These didn't exist when ADR-0024 was written. All are simple enough to land as templates from day one:

| Emitter                 | ~LoC | Disposition                                            |
| ----------------------- | ---: | ------------------------------------------------------ |
| `snippets.ts`           | ~100 | One template per snippet entry, filled per snippet     |
| `template-wrapper.ts`   |  ~30 | Single template, single fill                           |
| `query-entry.ts`        |  ~30 | Single template, single fill                           |
| `cursor-types.ts`       | ~220 | Per-kind template; filled per branch kind              |
| `pattern-bindings.ts`   |  ~50 | Single template, single fill                           |

Tier 1.5 lands in parallel with Tier 1 since neither blocks the other.

### 4.3 Tier 2 — repetitive per-kind

| Emitter      | Lines | Pattern                                  |
| ------------ | ----: | ---------------------------------------- |
| `is.ts`      |   364 | One pattern, filled per kind             |
| `ir.ts`      |   325 | One pattern, filled per kind             |
| `consts.ts`  |   709 | A small set of patterns, filled per kind |

Each output file is a concatenation of N filled templates. Validates the "fill in a loop" pattern that most user codemods will take.

### 4.4 Tier 3 — variable structure (decompose-and-compose)

| Emitter           | Lines | Decomposition strategy                                            |
| ----------------- | ----: | ----------------------------------------------------------------- |
| `wrap.ts`         |   503 | Per-kind accessor + outer interface template; ~4 sub-templates    |
| `types.ts`        | 1,912 | Per-shape sub-templates (config, tree, from, namespace); ~5 sub-templates |
| `factories.ts`    | 2,099 | Per-variant factory body (strict, from); ~6 sub-templates         |
| `client-utils.ts` |   942 | Mixed structural + per-kind; ~4 sub-templates                     |

**Decompose-and-compose:** split each emitter into multiple smaller templates per shape variant. Compose at the emitter level by filling outer templates with the *rendered output* of inner templates (the snippet-to-snippet composition pattern from ADR-0022 §6 / `docs/superpowers/specs/2026-05-10-construction-templates-design.md` §10).

No new template features. The emitter's TS code chooses which variant to apply per kind and composes via `inner.read()` → outer `.fill({...inner})`.

**Example — factories.ts decomposition:**

```
templates/factories.ts.template               (top-level — N factories joined)
├── templates/factories.strict.template       (one factory's .strict variant)
│   ├── templates/factories.strict-signature.template   (config type signature)
│   ├── templates/factories.strict-body.template        (body construction)
│   └── templates/factories.shared-methods.template     (the 4 $-prefixed methods)
└── templates/factories.from.template         (one factory's .from variant)
    └── templates/factories.shared-methods.template     (reused)
```

Each sub-template is ~30 lines. The emitter walks each kind, picks the variant (container / leaf / polymorph / supertype), composes the sub-templates, then joins all factories into the top-level template.

**Cap:** ≤5 sub-templates per Tier 3 emitter. If a 6th is needed, the pattern doesn't decompose cleanly — escalate to Tier 4.

### 4.5 Tier 4 — `from.ts` (attempt-then-skip)

`from.ts` (1,861 lines) is a closed-form resolver with data-driven branching. Two outcomes possible:

1. **Decomposes cleanly** — branches split into per-shape sub-templates the same way Tier 3 does. Migrate.
2. **Doesn't decompose** — branches depend on runtime data (slot-shape inference, polymorph form selection) that templates can't express without conditional-fill features. Leave on legacy.

Decision is made *during* the migration attempt, not pre-committed. Either outcome is documented (migration commit OR a "Tier 4 deferred — rationale" note in the design doc).

**Partial migration is allowed:** if 50% of branches map cleanly and 50% don't, migrate the cleanly-mapping ones and leave the rest on legacy. Document the split.

### 4.6 Rust render-module track

`render-module.ts` (1,558 lines) generates Rust source from a TypeScript caller. Uses `@sittir/rust`'s construction templates from `@sittir/codegen` — cross-target dogfooding. Validates that templates work end-to-end across grammar boundaries.

Independent of the TS-emitter tiers; runs in parallel.

## 5. Bootstrap staging

**The risk:** sittir regenerates packages that include the snippets emitter that uses templates that use `@sittir/core`'s fill, which is itself partly generated. A breaking change to a template can leave a regen cycle with a non-compiling package.

**The mechanism — snapshot/diff workflow via `scripts/dogfood-promote.ts`:**

```
1. Before changing emitter T's template:
     pnpm run dogfood:snapshot --tier <T>
   captures current generated output of all consuming packages
   into packages/codegen/__tests__/dogfood-baseline/<T>/.

2. Apply template change.

3. Regenerate the affected grammars:
     pnpm run dogfood:regen --tier <T>
   then diff:
     pnpm run dogfood:diff --tier <T>
   Expected: zero changes. Any diff is a regression.

4. Promote (only if diff is clean):
     pnpm run dogfood:promote --tier <T>
   updates the baseline; the tier is now the new normal.

5. If regen produces a non-compiling package mid-cycle:
   - Revert the offending template change.
   - The pinned prior-generation packages from step 1 remain valid until step 4.
```

`scripts/dogfood-promote.ts` orchestrates this:

```ts
// scripts/dogfood-promote.ts (sketch)
type Cmd = 'snapshot' | 'regen' | 'diff' | 'promote';

async function main(cmd: Cmd, tier: string): Promise<void> {
  const baselineDir = `packages/codegen/__tests__/dogfood-baseline/${tier}`;
  const consumers = consumersForTier(tier);   // e.g., ['rust', 'typescript', 'python']
  switch (cmd) {
    case 'snapshot': await snapshotConsumers(consumers, baselineDir); return;
    case 'regen':    await regenerateGrammars(consumers); return;
    case 'diff':     await diffAgainstBaseline(consumers, baselineDir); return;
    case 'promote':  await snapshotConsumers(consumers, baselineDir); return;  // overwrite baseline
  }
}
```

CI extension: the existing parity-suite gate (covering construction-templates + typed-query) extends to also fire on `packages/codegen/src/emitters/**` changes. PRs touching emitters MUST include passing `pnpm run dogfood:diff --tier <T>` before merge.

## 6. Hygiene-rule violation capture

The hygiene rules from ADR-0018 (per auto-memory `feedback_generated_output_hygiene.md`) currently rely on code-review enforcement:

1. No `Object.defineProperty` in generated output
2. No `Record<string, unknown>` casts
3. Shared boilerplate in per-grammar `utils.ts`, not `@sittir/core`
4. Shared functions preserve type info via generics
5. Avoid `AnyNodeData` in factory/from code
6. Don't `...spread` shared-methods objects into factory literals

**The mechanism — automated lint pass on generated output:**

```ts
// packages/codegen/src/lint/hygiene.ts
export interface HygieneViolation {
  rule: 'no-defineProperty' | 'no-record-unknown-cast' | 'no-spread-shared-methods'
      | 'no-anynode-in-factory' | 'no-core-grammar-specific-helpers' | 'preserve-generics';
  file: string;
  line: number;
  context: string;
}

export function lintGeneratedOutput(grammar: string): HygieneViolation[] {
  const violations: HygieneViolation[] = [];
  for (const rule of RULES) {
    violations.push(...rule.check(grammar));
  }
  return violations;
}

const RULES = [
  {
    name: 'no-defineProperty',
    check: (g: string) => grepGenerated(g, /Object\.defineProperty/),
  },
  {
    name: 'no-record-unknown-cast',
    check: (g: string) => grepGenerated(g, /as Record<string,\s*unknown>/),
  },
  // ... one per hygiene rule
];

function grepGenerated(grammar: string, pattern: RegExp): HygieneViolation[] {
  // Walk packages/<grammar>/src/*.ts, return file:line + matching context
  // for every line matching `pattern`.
}
```

CI wiring: `pnpm run lint:hygiene` runs after each regen; any violation is a hard error. Each violation surfaces with `file:line` + the violating snippet, so fixes are template-level (find the template that emitted it, fix once).

This converts the hygiene rules from "remember during code review" to "rg-based check fires on every PR".

**Escape hatch:** a `// hygiene-ok: <reason>` comment on the line exempts that line from the lint pass. Used sparingly; reviewed at PR time. The reason field is required so exemptions don't accumulate unexplained.

## 7. Validation contract

| Validation                                          | Mechanism                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| Byte-identical regen per tier                       | `scripts/dogfood-promote.ts` snapshot/diff workflow                    |
| Hygiene rules                                       | `pnpm run lint:hygiene` automated pass after each regen                |
| Existing test suites                                | `pnpm test` across all packages — no new tests added for the migration |
| Validator baseline                                  | `pnpm run validate:all` — round-trip render/parse unchanged           |
| Construction-templates parity suite                 | Already in place from ADR-0022's design                                |

**Order-insensitive positions:** for places where byte-identity is impossible (object-literal member ordering where TS spec is order-insensitive, etc.), fall back to the validator's `counts` + `probe-factory` tools as the validation signal.

## 8. Phased delivery

| Phase | Scope                                                                  | Days |
| ----- | ---------------------------------------------------------------------- | ---: |
| 1     | Bootstrap tooling (`dogfood-promote.ts`) + hygiene lint scaffolding    |  1.5 |
| 2     | Tier 1 (4 small emitters)                                              |  1.5 |
| 3     | Tier 1.5 (5 new emitters, born-as-templates)                           |  1   |
| 4     | Tier 2 (3 per-kind emitters)                                           |  2   |
| 5     | Tier 3 (4 emitters via decompose-and-compose)                          |  5   |
| 6     | Tier 4 (`from.ts`) attempt — migrate cleanly-mapping branches; document residue | 3   |
| 7     | Rust render-module track                                               |  2   |
| 8     | Hygiene lint pass + CI gate                                            |  1   |

**Total:** ~17 days. MVP cut at Phase 4 (~6 days) validates the dogfooding approach end-to-end and ships Tiers 1, 1.5, and 2 — covering ~1,800 LoC of emitters and exercising every architectural seam (decompose-and-compose is exercised in Tier 1.5's `cursor-types.ts` even before Tier 3 attempts harder cases).

## 9. Resolutions

### 9.1 Resolutions for ADR open questions

| ADR-0024 open question                                                            | Resolution                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tier 3 helper combinators                                                         | **No new combinators.** Decompose-and-compose using existing template surface. Cap at ≤5 sub-templates per emitter; if more, escalate to Tier 4. |
| Tier 4 (`from.ts`) migrate-or-skip                                                | **Attempt decomposition; partial migration allowed; document residue.** Decision is made during the attempt, not pre-committed. |
| Hygiene-rule violation capture                                                    | **Automated `lint:hygiene` pass** on generated output. CI-gated. Replaces code-review enforcement.      |

### 9.2 Additional resolutions surfaced during brainstorming

| Question                                                                          | Resolution                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| AST transpiler harness for automated migration                                    | **No.** Manual migration preserves the template-authoring ergonomics signal. A transpiler would silence what's painful about authoring templates — and we want that signal. |
| Bootstrap staging mechanism                                                       | Snapshot/diff workflow via `scripts/dogfood-promote.ts`. Hard pin per tier; parity gate before promotion. |
| Scope of new emitters from ADR-0022 / 0023                                        | Include as **Tier 1.5** — born-as-templates rather than migrated. Lands in parallel with Tier 1.        |
| Where templates live                                                              | `packages/codegen/src/emitters/templates/` — adjacent to consuming emitters for findability.            |
| Conditional-fill features in construction templates                               | **Not added.** Decomposition handles variability without new template surface.                          |

## 10. Non-goals (explicit)

- Adding new construction-template surface features. The whole point is dogfooding *what already exists*.
- Touching the contents of generated output. Byte-identical regen is the contract.
- Migrating tests. Existing test suites continue to validate behavior.
- Refactoring emitter logic beyond the template substitution. Where an emitter has a bug, fix it in a separate, named refactor.
- Building an AST transpiler harness.
- Conditional-fill / loop constructs inside templates.

## 11. Risks and mitigations

| Risk                                                                              | Mitigation                                                                                              |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tier 3 decomposition produces unmanageable sub-template counts                    | Cap at ≤5 per emitter. If a 6th is needed, escalate to Tier 4 (legacy).                                |
| `from.ts` decomposition partially succeeds (50/50 split)                          | Partial migration is allowed by design; the residue stays on legacy with a documented rationale.       |
| Bootstrap regen breaks mid-cycle                                                  | Hard pin in `pnpm-lock.yaml` until promote step. Backout = revert the template; pinned packages remain valid. |
| Hygiene lint catches an intentional "violation"                                   | `// hygiene-ok: <reason>` comment exempts a single line. Reason field is required; reviewed at PR time. |
| Generated output ordering non-deterministic (object-literal key order, Map iteration) | Falls outside byte-identical contract. Validator's `counts` + `probe-factory` are the fallback signal.  |
| Tier 3's many small templates make ownership unclear                              | Templates live adjacent to their consuming emitter; one-to-many ownership inferred from filename prefix (`factories.*.template` owned by `factories.ts`). |
| Dogfooding ergonomics signal lost if templates feel awkward but we ship anyway    | Each Tier 3 sub-template gets a brief authoring-friction note in its commit message; trends inform follow-up ADR if construction-templates surface needs revisiting. |

## 12. Open follow-ups (tracked, not blocking)

- Decide whether `packages/codegen/src/emitters/templates/` should be flat or organized by tier / emitter. Default to flat with filename prefixes; reconsider if directory grows past ~40 templates.
- Decide if the hygiene lint pass should also fire on hand-authored TypeScript (currently scoped to generated output only).
- Decide if `from.ts`'s residue (if Tier 4 partial-migrates) deserves a follow-up ADR for "construction-templates conditional-fill features", or stays in dialogue as a long-running open issue.

---

## Appendix — `factories.ts` decompose-and-compose worked example

This appendix walks through Tier 3 decomposition concretely for the biggest emitter, so the strategy is grounded.

### Before (current shape, sketched)

```ts
// packages/codegen/src/emitters/factories.ts (current, ~2,099 lines)
export function emitFactoriesModule(nodeMap: NodeMap): string {
  const factories = [...nodeMap.nodes].map(([kind, node]) => {
    if (node.modelType === 'branch') {
      const config = emitConfigSig(node);
      const body   = emitBranchBody(node);
      const methods = emitSharedMethods(node);
      return `
export const ${factoryName(kind)} = {
  strict(config: ${config}): ${typeName(kind)} {
    ${body}
    return withMethods({ ${methods} });
  },
  from(input: ${configLoose(kind)}): ${typeName(kind)} {
    return ${factoryName(kind)}.strict(resolveSlots(input));
  },
};`;
    }
    if (node.modelType === 'keyword') { /* ... */ }
    if (node.modelType === 'token')   { /* ... */ }
    // ... 6 more variants
  });
  return [imports, ...factories].join('\n');
}
```

### After (decomposed + composed, sketched)

```
templates/factories.module.template           (outer: imports + N joined factories)
templates/factories.branch.template           (one branch-kind factory)
  └─ uses slots: NAME, TYPE, CONFIG_SIG, BODY, METHODS, LOOSE_CONFIG, RESOLVE_SLOTS
templates/factories.keyword.template          (one keyword-kind factory)
templates/factories.token.template            (one token-kind factory)
templates/factories.shared-methods.template   (the 4 $-prefixed methods; reused across variants)
templates/factories.branch-body.template      (branch body construction)
```

```ts
// packages/codegen/src/emitters/factories.ts (after, ~100 lines)
import factoriesModuleTpl from './templates/factories.module.template?raw';
import factoriesBranchTpl from './templates/factories.branch.template?raw';
// ... (one import per sub-template)
import { template } from '@sittir/core';

export function emitFactoriesModule(nodeMap: NodeMap): string {
  const factories: string[] = [];
  for (const [kind, node] of nodeMap.nodes) {
    if (node.modelType === 'branch') {
      factories.push(
        template(factoriesBranchTpl).fill({
          NAME:        factoryName(kind),
          TYPE:        typeName(kind),
          CONFIG_SIG:  emitConfigSig(node),
          BODY:        template(factoriesBranchBodyTpl).fill({...}).render(),
          METHODS:     template(factoriesSharedMethodsTpl).fill({...}).render(),
          LOOSE_CONFIG: configLoose(kind),
          RESOLVE_SLOTS: 'resolveSlots(input)',
        }).render(),
      );
    } else if (node.modelType === 'keyword') {
      factories.push(template(factoriesKeywordTpl).fill({...}).render());
    } else if (node.modelType === 'token') {
      factories.push(template(factoriesTokenTpl).fill({...}).render());
    }
    // ... 6 more variants
  }
  return template(factoriesModuleTpl).fill({
    IMPORTS: imports.join('\n'),
    FACTORIES: factories.join('\n\n'),
  }).render();
}
```

### `templates/factories.branch.template`

```rust
// (template-mode parser handles $METAVAR; the surrounding text is verbatim TS)
export const $NAME = {
  strict(config: $CONFIG_SIG): $TYPE {
    $BODY
    return withMethods({ $METHODS });
  },
  from(input: $LOOSE_CONFIG): $TYPE {
    return $NAME.strict($RESOLVE_SLOTS);
  },
};
```

Six sub-templates fill ~80% of `factories.ts`'s emission patterns. The remaining 20% (polymorph variants, supertype namespaces) get their own sub-templates following the same shape. Total Tier 3 sub-template count for `factories.ts`: ~6, within the cap.

Per-kind dispatch (which variant to render) stays in the emitter's TS code — no conditional-fill needed inside templates.

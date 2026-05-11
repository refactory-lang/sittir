# Construction Templates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build construction templates — typed, structurally-validated `source-with-slots → NodeData/source` — across both fill backends (Rust via napi, TS-side via tree-sitter JS binding) with a parity contract enforced from day one.

**Architecture:** A four-layer subsystem (template authoring → template-mode parser → slot extraction → fill backend). The template-mode parser is produced per grammar by extending the existing `overrides.ts → transpile → tree-sitter generate` chain with a `templateMode` block. Both fills are independently written; parity is enforced by a fixture corpus run on every PR. See `docs/superpowers/specs/2026-05-10-construction-templates-design.md` for full design.

**Tech Stack:** TypeScript (vitest), Rust (cargo test, napi-rs), tree-sitter (JS binding for TS-side, ast-grep-core for Rust-side), Nunjucks/Askama (existing render path, unchanged).

---

## File Structure

Files this plan will create or modify, by package:

```
packages/codegen/src/
├── transpile/
│   ├── transpile-overrides.ts          [MODIFY] add template-mode branch
│   └── template-mode.ts                [NEW]    helper for template-mode emit
├── templates/                          [NEW DIR]
│   ├── extract-slots.ts                [NEW]    walk template tree → SlotMap
│   └── slot-types.ts                   [NEW]    derivation rules per §5
├── emitters/
│   ├── snippets.ts                     [NEW]    emit packages/<lang>/src/snippets.ts
│   └── template-wrapper.ts             [NEW]    emit packages/<lang>/src/template.ts
├── cli.ts                              [MODIFY] wire template-mode into --all
└── __tests__/
    ├── transpile-template-mode.test.ts [NEW]
    ├── templates/
    │   ├── extract-slots.test.ts       [NEW]
    │   └── slot-types.test.ts          [NEW]
    ├── emitters/snippets.test.ts       [NEW]
    └── template-parity/                [NEW DIR]
        ├── harness.ts                  [NEW]    runs both backends per fixture
        ├── parity.test.ts              [NEW]    drives the harness
        └── fixtures/                   [NEW DIR — 10 categories, see Phase 5]

packages/core/src/
├── template/                           [NEW DIR]
│   ├── fill-handle.ts                  [NEW]    lazy capture: source + slots
│   ├── ts-fill.ts                      [NEW]    TS-side fill (mirror of Rust)
│   ├── cache.ts                        [NEW]    LRU per engine, capacity 256
│   └── errors.ts                       [NEW]    structured error classes
└── index.ts                            [MODIFY] re-export template surface

packages/types/src/
└── template-slots.ts                   [NEW]    TS template-literal-type slot extraction

packages/rust/
├── overrides.ts                        [MODIFY] add templateMode block
├── snippets/                           [NEW DIR]
│   └── greet.rs.template               [NEW]    canary snippet (Phase 2)
├── src/
│   ├── snippets.ts                     [GENERATED]
│   ├── template.ts                     [GENERATED]
│   └── engine.ts                       [MODIFY] expose template_read/render
└── tests/
    ├── snippets.test.ts                [NEW]
    └── template-inline.test.ts         [NEW]

packages/typescript/  [Phase 7 — mirrors packages/rust/]
packages/python/       [Phase 7 — mirrors packages/rust/]

rust/crates/sittir-core/src/
├── template/                           [NEW DIR]
│   ├── mod.rs                          [NEW]
│   ├── compiled.rs                     [NEW]    CompiledTemplate
│   ├── builder.rs                      [NEW]    TemplateBuilder (slot splice)
│   ├── cache.rs                        [NEW]    LRU per engine
│   └── errors.rs                       [NEW]
└── lib.rs                              [MODIFY] re-export template module

rust/crates/sittir-rust/src/
├── template_napi.rs                    [NEW]
└── lib.rs                              [MODIFY] expose template_read/render

rust/crates/sittir-typescript/  [Phase 7 mirror]
rust/crates/sittir-python/       [Phase 7 mirror]
```

**Phase plan (per design §12):**

| Phase | Scope                                                        | Tasks |
| ----- | ------------------------------------------------------------ | ----- |
| 1     | Template-mode override + transpile chain (Rust grammar)      | 6     |
| 2     | Slot extractor + snippets emitter (codegen-side)             | 8     |
| 3     | Rust fill — `CompiledTemplate`, `TemplateBuilder`, LRU       | 10    |
| 4     | `FillHandle` + napi `template_read` / `template_render`      | 6     |
| 5     | TS-side fill + parity fixture corpus + parity harness        | 10    |
| 6     | Inline `template('...')` + per-grammar wrapper + slot-name extraction at TS type level | 6     |
| 7     | Roll out to TypeScript + Python grammars (override + napi + engine + canary + fixtures, per grammar) | 10    |

**Total:** 56 tasks across 4 chunks. Estimated ~17 days end-to-end (per design §12); reduced MVP at Phase 6 is ~13 days. Phase 7's 10 tasks split as 5 per grammar (TypeScript and Python progress independently).

---

## Chunk 1: Phases 1–2 — codegen-side foundations

This chunk establishes the template-mode parser and the slot extractor / snippets emitter. After Chunk 1, the `snippets.ts` for one canary snippet exists and is type-checked, but no fill runs yet — that's Chunk 2's Phase 3.

### Phase 1 — Template-mode override + transpile chain

#### Task 1.1: Add `templateMode` block to `packages/rust/overrides.ts`

**Files:**
- Modify: `packages/rust/overrides.ts`
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/transpile-template-mode.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

describe('templateMode override block (Phase 1)', () => {
  it('packages/rust/overrides.ts exports templateMode', async () => {
    const path = resolveOverridesPath('rust');
    expect(existsSync(path)).toBe(true);
    const mod = await import(path);
    expect(mod.templateMode).toBeDefined();
    expect(typeof mod.templateMode._sittir_metavar).toBe('function');
  });

  it('templateMode includes the default minimum supertype set', async () => {
    const path = resolveOverridesPath('rust');
    const mod = await import(path);
    // Minimum useful set per design §8
    expect(mod.templateMode.identifier).toBeDefined();
    expect(mod.templateMode._expression).toBeDefined();
    expect(mod.templateMode._statement).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: FAIL with `mod.templateMode is undefined`.

- [ ] **Step 3: Write minimal implementation**

Add to `packages/rust/overrides.ts` (top-level export, alongside the existing `default` export):

```ts
// packages/rust/overrides.ts
// ... existing imports ...

export const templateMode = {
  // The metavariable token itself.
  _sittir_metavar: ($: any) => token(prec(10, /\$(\.\.\.)?[A-Z][A-Z0-9_]*/)),

  // Default minimum useful set (design §8). identifier covers all
  // alias-of-identifier kinds (type_identifier, field_identifier, ...)
  // for free via tree-sitter's alias mechanism.
  identifier:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _expression: ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _statement:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rust/overrides.ts packages/codegen/src/__tests__/transpile-template-mode.test.ts
git commit -m "feat(rust): add templateMode override block (Phase 1.1)"
```

#### Task 1.2: Create `template-mode.ts` helper

**Files:**
- Create: `packages/codegen/src/transpile/template-mode.ts`
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `packages/codegen/src/__tests__/transpile-template-mode.test.ts`:

```ts
import { mergeTemplateModeOverrides, hasTemplateModeBlock } from '../transpile/template-mode.ts';

describe('mergeTemplateModeOverrides', () => {
  it('returns the original rules merged with templateMode overrides', () => {
    const baseRules = { _expression: () => 'x' };
    const templateMode = {
      _sittir_metavar: () => 'metavar',
      _expression: (_$: any, original: any) => `choice(metavar, ${original()})`,
    };
    const merged = mergeTemplateModeOverrides(baseRules, templateMode);
    expect(merged._sittir_metavar).toBeDefined();
    expect(merged._expression).toBeDefined();
    // Original rule survives as the second arg passed in
    expect((merged._expression as any)(null, baseRules._expression)).toContain('x');
  });

  it('hasTemplateModeBlock detects an exported templateMode', async () => {
    const mod = await import('../../../rust/overrides.ts');
    expect(hasTemplateModeBlock(mod)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: FAIL — `template-mode.ts` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/transpile/template-mode.ts
/**
 * Helpers for the template-mode transpile branch.
 *
 * The production transpile produces .sittir/grammar.js from overrides.ts.
 * The template-mode branch produces .sittir/grammar.template.js by also
 * folding in the optional `templateMode` export (see design §3.1, §3.2).
 */

export type TemplateModeRules = Record<string, (...args: any[]) => any>;

/**
 * Returns true if the imported overrides module exports a templateMode block.
 * Module is expected to be the default-exported grammar plus an optional
 * named export `templateMode`.
 */
export function hasTemplateModeBlock(mod: unknown): boolean {
  return Boolean(mod && typeof mod === 'object' && 'templateMode' in mod);
}

/**
 * Merge templateMode overrides on top of the base rules map. Each templateMode
 * entry is invoked with `($, original)`, where `original` is the base rule
 * (or undefined if templateMode is introducing a new rule like _sittir_metavar).
 *
 * The merged map is what tree-sitter's grammar() consumes for the template-mode
 * parser. Production transpile uses the base rules unmodified.
 */
export function mergeTemplateModeOverrides(
  baseRules: Record<string, (...args: any[]) => any>,
  templateMode: TemplateModeRules
): Record<string, (...args: any[]) => any> {
  const merged = { ...baseRules };
  for (const [name, rule] of Object.entries(templateMode)) {
    const original = baseRules[name];
    merged[name] = original ? ($: any) => rule($, () => original($)) : rule;
  }
  return merged;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/transpile/template-mode.ts packages/codegen/src/__tests__/transpile-template-mode.test.ts
git commit -m "feat(codegen): add template-mode merge helper (Phase 1.2)"
```

#### Task 1.3: Extend `transpile-overrides.ts` to emit a template-mode grammar.js

**Files:**
- Modify: `packages/codegen/src/transpile/transpile-overrides.ts`
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `packages/codegen/src/__tests__/transpile-template-mode.test.ts`:

```ts
import { transpileOverrides } from '../transpile/transpile-overrides.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('transpileOverrides — template-mode branch', () => {
  it('produces .sittir/grammar.template.js when templateMode is exported', async () => {
    const result = await transpileOverrides({ grammar: 'rust', templateMode: true });
    expect(result.outputPath).toMatch(/grammar\.template\.js$/);
    expect(existsSync(result.outputPath)).toBe(true);
  });

  it('production transpile is unaffected (sibling artifact, not a replacement)', async () => {
    await transpileOverrides({ grammar: 'rust' });
    const productionPath = join('packages', 'rust', '.sittir', 'grammar.js');
    expect(existsSync(productionPath)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: FAIL — `templateMode` parameter not recognized.

- [ ] **Step 3: Write minimal implementation**

In `packages/codegen/src/transpile/transpile-overrides.ts`, extend the `transpileOverrides` function:

```ts
// packages/codegen/src/transpile/transpile-overrides.ts
import { hasTemplateModeBlock, mergeTemplateModeOverrides } from './template-mode.ts';

export interface TranspileOptions {
  grammar: string;
  templateMode?: boolean;     // NEW: emit grammar.template.js if true
}

export interface TranspileResult {
  outputPath: string;         // grammar.js OR grammar.template.js
  templateMode: boolean;
}

export async function transpileOverrides(opts: TranspileOptions): Promise<TranspileResult> {
  const overridesPath = resolveOverridesPath(opts.grammar);
  const mod = await import(overridesPath);

  const baseGrammar = mod.default;       // standard grammar() result
  let rulesToEmit = baseGrammar.rules;

  if (opts.templateMode) {
    if (!hasTemplateModeBlock(mod)) {
      throw new Error(
        `Grammar '${opts.grammar}' has no templateMode export; cannot emit template-mode parser`
      );
    }
    rulesToEmit = mergeTemplateModeOverrides(baseGrammar.rules, mod.templateMode);
  }

  // Existing emission logic, parameterized by the rules map and output filename:
  const outFilename = opts.templateMode ? 'grammar.template.js' : 'grammar.js';
  const outputPath = join(grammarDir(opts.grammar), '.sittir', outFilename);
  await writeGrammarJs(outputPath, { ...baseGrammar, rules: rulesToEmit });

  return { outputPath, templateMode: !!opts.templateMode };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/transpile/transpile-overrides.ts packages/codegen/src/__tests__/transpile-template-mode.test.ts
git commit -m "feat(codegen): emit template-mode grammar.js (Phase 1.3)"
```

#### Task 1.4: Wire `tree-sitter generate` for template-mode

**Files:**
- Modify: `packages/codegen/src/cli.ts`
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append:

```ts
import { join } from 'node:path';

describe('CLI auto-chain produces template-parser.wasm', () => {
  it('--all generates packages/rust/.sittir/src/grammar.template.json', async () => {
    // CLI test — assumes a fresh `--all` was run as part of CI fixture setup.
    // For this unit test we shell out via the CLI module's exported runChain.
    const { runChain } = await import('../cli.ts');
    await runChain({ grammar: 'rust', all: true, templateMode: true });
    expect(existsSync(join('packages', 'rust', '.sittir', 'src', 'grammar.template.json'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: FAIL — `runChain` doesn't accept `templateMode`, or doesn't run `tree-sitter generate` for the template grammar.

- [ ] **Step 3: Write minimal implementation**

In `packages/codegen/src/cli.ts`, locate the `--all` auto-chain (around the existing `transpile + tree-sitter generate + compile-parser` block) and add a parallel template-mode branch:

```ts
// packages/codegen/src/cli.ts (auto-chain block)
if (cliArgs.all && !cliArgs.skipTsChain) {
  // Existing production chain ...
  const tr = await transpileOverrides({ grammar: cliArgs.grammar });
  runTreeSitterGenerate(grammarDir, /* outputDir */ '.sittir/src');
  await compileParser(grammarDir);

  // NEW: template-mode chain (only if grammar exports templateMode)
  const overridesPath = resolveOverridesPath(cliArgs.grammar);
  const mod = await import(overridesPath);
  if (hasTemplateModeBlock(mod)) {
    const trt = await transpileOverrides({ grammar: cliArgs.grammar, templateMode: true });
    runTreeSitterGenerate(grammarDir, '.sittir/src', { srcOverride: trt.outputPath, outName: 'grammar.template' });
    // Note: template-parser.wasm is bundled as a sibling to parser.wasm
    await compileParser(grammarDir, { outName: 'template-parser' });
  }
}

// Export for tests:
export async function runChain(args: CliArgs): Promise<void> {
  const grammarDirPath = grammarDir(args.grammar);
  const trProd = await transpileOverrides({ grammar: args.grammar });
  if (args.all && !args.skipTsChain) {
    runTreeSitterGenerate(grammarDirPath, '.sittir/src');
    await compileParser(grammarDirPath);
  }
  if (args.templateMode) {
    const overridesPath = resolveOverridesPath(args.grammar);
    const mod = await import(overridesPath);
    if (!hasTemplateModeBlock(mod)) {
      throw new Error(`runChain: --template-mode requested but grammar '${args.grammar}' has no templateMode export`);
    }
    const trTemplate = await transpileOverrides({ grammar: args.grammar, templateMode: true });
    runTreeSitterGenerate(grammarDirPath, '.sittir/src', {
      srcOverride: trTemplate.outputPath,
      outName: 'grammar.template',
    });
    await compileParser(grammarDirPath, { outName: 'template-parser' });
  }
}
```

`runTreeSitterGenerate` and `compileParser` need small extensions to accept output-name overrides — keep them minimal (default to existing behavior).

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS. May take ~30s (real tree-sitter generate).

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/cli.ts packages/codegen/src/transpile/transpile-overrides.ts packages/codegen/src/__tests__/transpile-template-mode.test.ts
git commit -m "feat(codegen): auto-chain template-mode parser into --all (Phase 1.4)"
```

#### Task 1.5: Verify a canary template parses cleanly

**Files:**
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('template-mode parser produces ERROR-free trees for canary templates', () => {
  it('parses "fn $NAME() {}" cleanly (no ERROR nodes)', async () => {
    const Parser = (await import('web-tree-sitter')).default;
    await Parser.init();
    const parser = new Parser();
    const lang = await Parser.Language.load(
      join('packages', 'rust', '.sittir', 'src', 'template-parser.wasm')
    );
    parser.setLanguage(lang);
    const tree = parser.parse('fn $NAME() {}');
    function findError(node: any): any | null {
      if (node.type === 'ERROR') return node;
      for (let i = 0; i < node.childCount; i++) {
        const found = findError(node.child(i));
        if (found) return found;
      }
      return null;
    }
    expect(findError(tree.rootNode)).toBeNull();
  });

  it('parses "let $X: $T = $Y;" cleanly', async () => {
    // similar
  });

  it('parses "fn foo($...PARAMS) {}" cleanly', async () => {
    // similar
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS *or* FAIL revealing parser-precedence issues. If FAIL: the templateMode block needs adjustment (e.g., higher prec, different supertype scope).

- [ ] **Step 3: If failures, adjust `packages/rust/overrides.ts` `templateMode` block**

Common fixes:
- Bump `prec(10, ...)` higher.
- Add another supertype to the templateMode set.
- Verify `_sittir_metavar` regex matches the template's metavar form.

- [ ] **Step 4: Re-run until green**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/__tests__/transpile-template-mode.test.ts packages/rust/overrides.ts
git commit -m "test(rust): canary templates parse cleanly in template-mode (Phase 1.5)"
```

#### Task 1.6: Confirm no production-parser regression

**Files:**
- Run: validator suite
- Optionally extend: `packages/codegen/src/__tests__/transpile-template-mode.test.ts`

- [ ] **Step 1: Run baseline validator**

```bash
pnpm run validate:js
```

Expected: PASS at the same baseline as the pre-Phase-1 run. If it changes, the production parser was affected — investigate.

- [ ] **Step 2: Document the canary in test**

Add a comment-only test that documents the production parser invariant:

```ts
describe('Phase 1 invariant: production parser unaffected', () => {
  it('this is a documentation marker — verified externally via `pnpm run validate:js`', () => {
    // The template-mode chain emits a sibling artifact (template-parser.wasm)
    // and never touches parser.wasm or grammar.json. If `pnpm run validate:js`
    // ever regresses after a Phase 1 change, the templateMode block has leaked
    // into production transpile — investigate transpile-overrides.ts immediately.
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/__tests__/transpile-template-mode.test.ts
git commit -m "test(codegen): document production-parser invariant for Phase 1 (Phase 1.6)"
```

---

### Phase 2 — Slot extractor + snippets emitter

#### Task 2.1: `SlotMap` type definition

**Files:**
- Create: `packages/codegen/src/templates/extract-slots.ts`
- Test: `packages/codegen/src/__tests__/templates/extract-slots.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/templates/extract-slots.test.ts
import { describe, expect, it } from 'vitest';
import type { SlotMap, SlotEntry } from '../../templates/extract-slots.ts';

describe('SlotMap shape', () => {
  it('has the expected fields per design §3.3', () => {
    const entry: SlotEntry = {
      name: 'NAME',
      multi: false,
      parentKind: 'function_item',
      fieldName: 'name',
      positionPath: [0],
    };
    const map: SlotMap = [entry];
    expect(map[0].name).toBe('NAME');
    expect(map[0].multi).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/templates/extract-slots.ts
/**
 * Slot extraction for construction templates.
 *
 * Walks a template parse tree and produces a SlotMap describing every
 * _sittir_metavar position. Used at codegen time for snippets and at
 * runtime for inline templates. See design §3.3 and §5.
 */

export interface SlotEntry {
  /** Identifier portion of the metavar — `NAME` for `$NAME`. */
  name: string;
  /** True for `$...NAME` (sequence slot), false for `$NAME` (single slot). */
  multi: boolean;
  /** Grammar kind of the immediate parent of the metavar position. */
  parentKind: string;
  /**
   * Field name the metavar occupies at parentKind. Null for unnamed
   * positions ($child / $children).
   */
  fieldName: string | null;
  /**
   * Positional path from the parent down to the metavar. Used by the
   * fill backends to splice slot values into the parsed template tree.
   */
  positionPath: number[];
}

export type SlotMap = readonly SlotEntry[];
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/templates/extract-slots.ts packages/codegen/src/__tests__/templates/extract-slots.test.ts
git commit -m "feat(codegen): SlotMap type definition (Phase 2.1)"
```

#### Task 2.2: `extractSlots` function — single-kind field

**Files:**
- Modify: `packages/codegen/src/templates/extract-slots.ts`
- Test: `packages/codegen/src/__tests__/templates/extract-slots.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { extractSlots } from '../../templates/extract-slots.ts';

describe('extractSlots — single-kind field', () => {
  it('extracts $NAME from "fn $NAME() {}"', async () => {
    const slots = await extractSlots('fn $NAME() {}', 'rust');
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({
      name: 'NAME',
      multi: false,
      parentKind: 'function_item',
      fieldName: 'name',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: FAIL — `extractSlots` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/templates/extract-slots.ts (append)
import { Parser, Language } from 'web-tree-sitter';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

let parserInitPromise: Promise<void> | null = null;
const langCache = new Map<string, Language>();

async function getTemplateParser(grammar: string): Promise<Parser> {
  if (!parserInitPromise) parserInitPromise = Parser.init();
  await parserInitPromise;
  if (!langCache.has(grammar)) {
    const wasmPath = join(__dirname, '..', '..', '..', grammar, '.sittir', 'src', 'template-parser.wasm');
    langCache.set(grammar, await Language.load(wasmPath));
  }
  const parser = new Parser();
  parser.setLanguage(langCache.get(grammar)!);
  return parser;
}

export async function extractSlots(source: string, grammar: string): Promise<SlotMap> {
  const parser = await getTemplateParser(grammar);
  const tree = parser.parse(source);
  const slots: SlotEntry[] = [];

  function walk(node: any, parent: any | null, fieldName: string | null, path: number[]): void {
    if (node.type === '_sittir_metavar') {
      const text = node.text;
      const multi = text.startsWith('$...');
      const name = text.replace(/^\$(\.\.\.)?/, '');
      slots.push({
        name,
        multi,
        parentKind: parent?.type ?? '<root>',
        fieldName,
        positionPath: path,
      });
      return;
    }
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i);
      const childField = node.fieldNameForChild(i);
      walk(child, node, childField ?? null, [...path, i]);
    }
  }

  walk(tree.rootNode, null, null, []);
  return slots;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/templates/extract-slots.ts packages/codegen/src/__tests__/templates/extract-slots.test.ts
git commit -m "feat(codegen): extractSlots for single-kind fields (Phase 2.2)"
```

#### Task 2.3: `extractSlots` — multi-slot (`$...PARAMS`)

**Files:**
- Test: `packages/codegen/src/__tests__/templates/extract-slots.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('extractSlots — multi-slot', () => {
  it('marks $...PARAMS as multi=true', async () => {
    const slots = await extractSlots('fn foo($...PARAMS) {}', 'rust');
    const params = slots.find(s => s.name === 'PARAMS');
    expect(params).toBeDefined();
    expect(params!.multi).toBe(true);
    expect(params!.parentKind).toBe('parameters');
  });

  it('extracts both single and multi slots from one template', async () => {
    const slots = await extractSlots('fn $NAME($...PARAMS) {}', 'rust');
    expect(slots).toHaveLength(2);
    expect(slots.find(s => s.name === 'NAME')!.multi).toBe(false);
    expect(slots.find(s => s.name === 'PARAMS')!.multi).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: PASS (already covered by Task 2.2's implementation; this test is a regression catch).

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/__tests__/templates/extract-slots.test.ts
git commit -m "test(codegen): multi-slot extraction (Phase 2.3)"
```

#### Task 2.4: `extractSlots` — supertype-position metavars

**Files:**
- Test: `packages/codegen/src/__tests__/templates/extract-slots.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('extractSlots — supertype positions', () => {
  it('records $EXPR landing in an _expression position', async () => {
    const slots = await extractSlots('let x = $EXPR;', 'rust');
    const expr = slots.find(s => s.name === 'EXPR');
    expect(expr).toBeDefined();
    // Parent is the let_declaration; the field is `value` per tree-sitter-rust
    expect(expr!.parentKind).toBe('let_declaration');
    expect(expr!.fieldName).toBe('value');
  });

  it('records $STMT landing in a _statement position inside a block', async () => {
    const slots = await extractSlots('fn f() { $STMT }', 'rust');
    const stmt = slots.find(s => s.name === 'STMT');
    expect(stmt).toBeDefined();
    expect(stmt!.parentKind).toBe('block');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test extract-slots
```

Expected: PASS (extractor doesn't care about supertype vs concrete kind — it records what the parser produced).

- [ ] **Step 3: Commit**

```bash
git add packages/codegen/src/__tests__/templates/extract-slots.test.ts
git commit -m "test(codegen): supertype-position slot extraction (Phase 2.4)"
```

#### Task 2.5: `deriveSlotType` — single-kind field

**Files:**
- Create: `packages/codegen/src/templates/slot-types.ts`
- Test: `packages/codegen/src/__tests__/templates/slot-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/templates/slot-types.test.ts
import { describe, expect, it } from 'vitest';
import { deriveSlotType } from '../../templates/slot-types.ts';
import { assemble } from '../../compiler/assemble.ts';
// ... existing test fixture for getting a NodeMap (reuse pattern from other tests)

describe('deriveSlotType — single-concrete-kind field', () => {
  it('returns ParentInterface[_field] for $NAME in fn $NAME()', async () => {
    const nodeMap = await getRustNodeMapFixture();
    const ts = deriveSlotType(nodeMap, {
      name: 'NAME',
      multi: false,
      parentKind: 'function_item',
      fieldName: 'name',
      positionPath: [0],
    });
    expect(ts).toBe(`FunctionItem['_name']`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test slot-types
```

Expected: FAIL — `slot-types.ts` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/templates/slot-types.ts
/**
 * Derive the TS slot type for a single SlotEntry. See design §5 for the
 * full rule table; this module implements one row at a time.
 *
 * Returns a TypeScript type expression as a string, suitable for emission
 * into snippets.ts.
 */
import type { NodeMap } from '../compiler/types.ts';
import type { SlotEntry } from './extract-slots.ts';
import { nameNode } from '../compiler/node-map.ts';

export function deriveSlotType(nodeMap: NodeMap, slot: SlotEntry): string {
  const parent = nodeMap.nodes.get(slot.parentKind);
  if (!parent) throw new Error(`unknown parentKind: ${slot.parentKind}`);
  const parentTypeName = nameNode(slot.parentKind).typeName;

  // Phase 2.5: single-concrete-kind field. Other rows added in Tasks 2.6, 2.7.
  if (!slot.multi && slot.fieldName) {
    return `${parentTypeName}['_${slot.fieldName}']`;
  }
  throw new Error(`deriveSlotType: case not yet implemented for ${JSON.stringify(slot)}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test slot-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/templates/slot-types.ts packages/codegen/src/__tests__/templates/slot-types.test.ts
git commit -m "feat(codegen): deriveSlotType for single-concrete-kind fields (Phase 2.5)"
```

#### Task 2.6: `deriveSlotType` — optional, repeat, multi-slot, unnamed

**Files:**
- Modify: `packages/codegen/src/templates/slot-types.ts`
- Test: `packages/codegen/src/__tests__/templates/slot-types.test.ts` (extend)

- [ ] **Step 1: Write the failing tests** (one per design §5 row not yet covered)

```ts
describe('deriveSlotType — optional field', () => {
  it('strips undefined for $RET in -> $RET (return_type is optional)', async () => {
    const nodeMap = await getRustNodeMapFixture();
    const ts = deriveSlotType(nodeMap, {
      name: 'RET', multi: false, parentKind: 'function_item',
      fieldName: 'return_type', positionPath: [0],
    });
    expect(ts).toBe(`NonNullable<FunctionItem['_return_type']>`);
  });
});

describe('deriveSlotType — multi-slot ($...PARAMS)', () => {
  it('returns NonNullable<...>[number][] for $...PARAMS in parameters', async () => {
    const nodeMap = await getRustNodeMapFixture();
    const ts = deriveSlotType(nodeMap, {
      name: 'PARAMS', multi: true, parentKind: 'parameters',
      fieldName: null,  // unnamed $children slot
      positionPath: [0],
    });
    expect(ts).toBe(`NonNullable<Parameters['$children']>`);
  });
});

describe('deriveSlotType — single-slot inside repeat ($STMT in block)', () => {
  it('returns the element type', async () => {
    const nodeMap = await getRustNodeMapFixture();
    const ts = deriveSlotType(nodeMap, {
      name: 'STMT', multi: false, parentKind: 'block',
      fieldName: null, positionPath: [0],
    });
    expect(ts).toBe(`NonNullable<Block['$children']>[number]`);
  });
});

describe('deriveSlotType — multi-slot in non-list rejected', () => {
  it('throws when $...X lands in a non-list position', async () => {
    const nodeMap = await getRustNodeMapFixture();
    expect(() => deriveSlotType(nodeMap, {
      name: 'X', multi: true, parentKind: 'function_item',
      fieldName: 'name',  // single-slot field, not a list
      positionPath: [0],
    })).toThrow(/multi-slot.*non-list/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test slot-types
```

Expected: FAIL — Phase 2.5 only handles the single-concrete row.

- [ ] **Step 3: Implement remaining rows**

```ts
// packages/codegen/src/templates/slot-types.ts (replace the body)
export function deriveSlotType(nodeMap: NodeMap, slot: SlotEntry): string {
  const parent = nodeMap.nodes.get(slot.parentKind);
  if (!parent) throw new Error(`unknown parentKind: ${slot.parentKind}`);
  const parentTypeName = nameNode(slot.parentKind).typeName;
  const isFieldOptional = slot.fieldName ? isOptionalField(parent, slot.fieldName) : false;
  const isFieldRepeat   = slot.fieldName ? isRepeatField(parent, slot.fieldName)   : false;

  // ---- Multi-slot ($...NAME) ----
  if (slot.multi) {
    if (slot.fieldName) {
      if (!isFieldRepeat) {
        throw new Error(
          `multi-slot $...${slot.name} in non-list field ${slot.parentKind}.${slot.fieldName}`
        );
      }
      return `NonNullable<${parentTypeName}['_${slot.fieldName}']>`;
    }
    // Unnamed $children
    return `NonNullable<${parentTypeName}['$children']>`;
  }

  // ---- Single-slot ($NAME) ----
  if (slot.fieldName) {
    const base = `${parentTypeName}['_${slot.fieldName}']`;
    if (isFieldRepeat) return `NonNullable<${base}>[number]`;
    if (isFieldOptional) return `NonNullable<${base}>`;
    return base;
  }
  // Unnamed slot — single child
  return `NonNullable<${parentTypeName}['$children']>[number]`;
}

function isOptionalField(parent: any, fieldName: string): boolean {
  const slot = parent.slots?.find((s: any) => s.edgeName === fieldName);
  return slot ? !slot.values.some((v: any) => v.multiplicity === 'required') : false;
}

function isRepeatField(parent: any, fieldName: string): boolean {
  const slot = parent.slots?.find((s: any) => s.edgeName === fieldName);
  return slot ? slot.values.some((v: any) => v.multiplicity === 'array' || v.multiplicity === 'nonEmpty') : false;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test slot-types
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/templates/slot-types.ts packages/codegen/src/__tests__/templates/slot-types.test.ts
git commit -m "feat(codegen): deriveSlotType for optional/repeat/multi/unnamed (Phase 2.6)"
```

#### Task 2.7: Author canary snippet `greet.rs.template`

**Files:**
- Create: `packages/rust/snippets/greet.rs.template`

- [ ] **Step 1: Author the snippet**

```rust
// packages/rust/snippets/greet.rs.template
pub fn $NAME($...PARAMS) -> $RET {
    $BODY
}
```

- [ ] **Step 2: Verify it parses cleanly via Phase 1's harness**

Quick sanity check — run the Phase 1.5 test against this template content. (Optional: add a snippet-specific test.)

- [ ] **Step 3: Commit**

```bash
git add packages/rust/snippets/greet.rs.template
git commit -m "feat(rust): canary snippet greet.rs.template (Phase 2.7)"
```

#### Task 2.8: Snippets emitter — generate `packages/rust/src/snippets.ts`

**Files:**
- Create: `packages/codegen/src/emitters/snippets.ts`
- Test: `packages/codegen/src/__tests__/emitters/snippets.test.ts`
- Modify: `packages/codegen/src/cli.ts` (wire emitter into `--all`)

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/emitters/snippets.test.ts
import { describe, expect, it } from 'vitest';
import { emitSnippetsModule } from '../../emitters/snippets.ts';

describe('emitSnippetsModule', () => {
  it('emits a snippets.ts with one entry per .template file (rust)', async () => {
    const out = await emitSnippetsModule('rust');
    expect(out).toContain(`const GREET = `);
    expect(out).toContain(`export const snippets = {`);
    expect(out).toContain(`greet: {`);
    expect(out).toContain(`fill(slots: {`);
    expect(out).toContain(`NAME: FunctionItem['_name']`);
    expect(out).toContain(`PARAMS: NonNullable<Parameters['$children']>`);
    expect(out).toContain(`RET: NonNullable<FunctionItem['_return_type']>`);
    expect(out).toContain(`from(slots: {`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test emitters/snippets
```

Expected: FAIL — emitter doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/emitters/snippets.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { extractSlots } from '../templates/extract-slots.ts';
import { deriveSlotType } from '../templates/slot-types.ts';
import { loadGrammarNodeMap } from '../compiler/load.ts';

function snippetEntryName(filename: string): string {
  // greet.rs.template → greet
  return basename(filename).replace(/\.[^.]+\.template$/, '').replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}

export async function emitSnippetsModule(grammar: string): Promise<string> {
  const dir = join('packages', grammar, 'snippets');
  const files = readdirSync(dir).filter(f => f.endsWith('.template'));
  if (files.length === 0) return '';
  const nodeMap = await loadGrammarNodeMap(grammar);

  const lines: string[] = [
    `// Auto-generated by @sittir/codegen — do not edit`,
    `import type { ${importsFromNodeMap(nodeMap)} } from './types.ts';`,
    `import { FillHandle } from '@sittir/core';`,
    ``,
  ];

  const constNames: string[] = [];
  const entries: string[] = [];
  for (const file of files) {
    const source = readFileSync(join(dir, file), 'utf8');
    const slots = await extractSlots(source, grammar);
    const entryName = snippetEntryName(file);
    const constName = entryName.toUpperCase();
    constNames.push(`const ${constName} = ${JSON.stringify(source)};`);

    const strictSlotLines = slots.map(s => `${s.name}: ${deriveSlotType(nodeMap, s)};`);
    const looseSlotLines  = slots.map(s => `${s.name}: string | ${deriveSlotType(nodeMap, s)};`);

    entries.push(`  ${entryName}: {
    fill(slots: {
${strictSlotLines.map(l => `      ${l}`).join('\n')}
    }): FillHandle {
      return new FillHandle(${constName}, slots);
    },
    from(slots: {
${looseSlotLines.map(l => `      ${l}`).join('\n')}
    }): FillHandle {
      return new FillHandle(${constName}, resolveSlots(slots));
    },
  },`);
  }

  lines.push(...constNames, '');
  lines.push(`export const snippets = {`);
  lines.push(...entries);
  lines.push(`} as const;`);
  return lines.join('\n');
}
```

(`importsFromNodeMap` collects type-name imports referenced by slot derivations.)

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/codegen test emitters/snippets
```

Expected: PASS.

- [ ] **Step 5: Wire into CLI `--all` chain**

In `packages/codegen/src/cli.ts`, after the existing emitter calls:

```ts
const snippetsTs = await emitSnippetsModule(cliArgs.grammar);
if (snippetsTs) {
  writeFileSync(join(outputDir, 'snippets.ts'), snippetsTs);
}
```

- [ ] **Step 6: Run end-to-end + type-check**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/rust run type-check
```

Expected: `packages/rust/src/snippets.ts` exists and type-checks.

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/snippets.ts packages/codegen/src/__tests__/emitters/snippets.test.ts packages/codegen/src/cli.ts packages/rust/src/snippets.ts
git commit -m "feat(codegen): snippets.ts emitter, generated for rust (Phase 2.8)"
```

---

**End of Chunk 1.** At this point: template-mode parser ships with `@sittir/rust`, slot extraction works, `snippets.ts` is generated and type-checks. No fill backend yet — that's Chunk 2.

---

## Chunk 2: Phases 3–4 — Rust fill end-to-end + JS-side wrapper + napi

This chunk lights up the first end-to-end path: a `snippets.greet.fill({...}).render()` call goes through the napi boundary into the Rust fill, returns rendered text. After Chunk 2, native-only construction templates work.

### Phase 3 — Rust fill: `CompiledTemplate`, `TemplateBuilder`, LRU

#### Task 3.1: `template/mod.rs` + module skeleton + errors

**Files:**
- Create: `rust/crates/sittir-core/src/template/mod.rs`
- Create: `rust/crates/sittir-core/src/template/errors.rs`
- Modify: `rust/crates/sittir-core/src/lib.rs`
- Test: `rust/crates/sittir-core/src/template/tests.rs`

- [ ] **Step 1: Write the failing test**

```rust
// rust/crates/sittir-core/src/template/tests.rs
use super::errors::{CompileError, FillError};

#[test]
fn error_types_exist_with_expected_variants() {
    let _ = CompileError::ParseError {
        line: 1, column: 5, fragment: "$X".into(),
    };
    let _ = CompileError::HasErrorNodes { line: 1, column: 5 };
    let _ = FillError::MissingSlot("NAME".into());
    let _ = FillError::ExtraSlots(vec!["EXTRA".into()]);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test template::tests
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/template/mod.rs
pub mod errors;
pub mod compiled;
pub mod builder;
pub mod cache;

#[cfg(test)]
mod tests;

pub use compiled::CompiledTemplate;
pub use builder::TemplateBuilder;
pub use cache::TemplateCache;
pub use errors::{CompileError, FillError};
```

```rust
// rust/crates/sittir-core/src/template/errors.rs
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CompileError {
    #[error("template parse error at {line}:{column}: {fragment}")]
    ParseError { line: usize, column: usize, fragment: String },
    #[error("template contains ERROR nodes at {line}:{column}")]
    HasErrorNodes { line: usize, column: usize },
    #[error("template-mode parser unavailable for grammar")]
    NoTemplateLanguage,
}

#[derive(Debug, Error)]
pub enum FillError {
    #[error("missing slot: ${0}")]
    MissingSlot(String),
    #[error("extra slots ignored: {0:?}")]
    ExtraSlots(Vec<String>),
    #[error("compile error: {0}")]
    Compile(#[from] CompileError),
}
```

Add `pub mod template;` to `lib.rs`.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test template::tests
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/template/ rust/crates/sittir-core/src/lib.rs
git commit -m "feat(sittir-core): template module skeleton + errors (Phase 3.1)"
```

#### Task 3.2: `CompiledTemplate::compile` — happy path

**Files:**
- Create: `rust/crates/sittir-core/src/template/compiled.rs`
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn compile_simple_template() {
    let lang = test_template_language("rust");
    let compiled = CompiledTemplate::compile("fn $NAME() {}", &lang).unwrap();
    assert_eq!(compiled.slots.len(), 1);
    assert_eq!(compiled.slots[0].name, "NAME");
    assert!(!compiled.slots[0].multi);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test compile_simple_template
```

Expected: FAIL — `CompiledTemplate::compile` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/template/compiled.rs
use std::sync::Arc;
use ast_grep_core::{AstGrep, Language};
use crate::node_data::NodeData;
use super::errors::CompileError;

pub struct SlotEntry {
    pub name: String,
    pub multi: bool,
    pub parent_kind: String,
    pub field_name: Option<String>,
    pub position_path: Vec<usize>,
}

pub struct CompiledTemplate {
    pub source_hash: u64,
    pub parsed: NodeData,
    pub slots: Vec<SlotEntry>,
}

impl CompiledTemplate {
    pub fn compile<L: Language>(source: &str, lang: &L) -> Result<Self, CompileError> {
        let parsed = AstGrep::new(source, lang.clone());
        let root = parsed.root();
        if let Some(err) = find_error_node(&root) {
            return Err(CompileError::HasErrorNodes {
                line: err.start_pos().line(),
                column: err.start_pos().column(),
            });
        }
        let slots = walk_slots(&root, None, &mut Vec::new());
        let node_data = read_into_node_data(&root);
        Ok(CompiledTemplate {
            source_hash: hash_source(source),
            parsed: node_data,
            slots,
        })
    }
}

fn hash_source(source: &str) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut h = std::collections::hash_map::DefaultHasher::new();
    source.hash(&mut h);
    h.finish()
}

// walk_slots / find_error_node / read_into_node_data: implementation details,
// mirror the JS-side extractSlots algorithm from Phase 2.2.
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test compile_simple_template
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/template/compiled.rs rust/crates/sittir-core/src/template/tests.rs
git commit -m "feat(sittir-core): CompiledTemplate::compile happy path (Phase 3.2)"
```

#### Task 3.3: `CompiledTemplate::compile` — error reporting

**Files:**
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn compile_template_with_syntax_error_returns_compile_error() {
    let lang = test_template_language("rust");
    let result = CompiledTemplate::compile("fn $NAME(", &lang);
    assert!(matches!(result, Err(CompileError::HasErrorNodes { .. })));
}
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test compile_template_with_syntax_error
```

Expected: PASS (Task 3.2's `find_error_node` covers this).

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/src/template/tests.rs
git commit -m "test(sittir-core): syntax-error templates rejected at compile (Phase 3.3)"
```

#### Task 3.4: `TemplateBuilder::build` — splice single slot

**Files:**
- Create: `rust/crates/sittir-core/src/template/builder.rs`
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn build_substitutes_single_slot() {
    let lang = test_template_language("rust");
    let compiled = CompiledTemplate::compile("fn $NAME() {}", &lang).unwrap();
    let mut slots = std::collections::HashMap::new();
    slots.insert("NAME".to_string(), node_data_identifier("greet"));
    let result = TemplateBuilder::new(&compiled).build(&slots).unwrap();
    // Walk result: function_item.name should be "greet"
    let name = result.field("name").unwrap();
    assert_eq!(name.text().unwrap(), "greet");
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test build_substitutes_single_slot
```

Expected: FAIL — `TemplateBuilder` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/template/builder.rs
use std::collections::HashMap;
use crate::node_data::NodeData;
use super::compiled::CompiledTemplate;
use super::errors::FillError;

pub struct TemplateBuilder<'a> {
    compiled: &'a CompiledTemplate,
}

impl<'a> TemplateBuilder<'a> {
    pub fn new(compiled: &'a CompiledTemplate) -> Self {
        Self { compiled }
    }

    pub fn build(&self, slots: &HashMap<String, NodeData>) -> Result<NodeData, FillError> {
        // Validate slot keys (missing only — extras silently ignored per design §9.3)
        for slot in &self.compiled.slots {
            if !slots.contains_key(&slot.name) {
                return Err(FillError::MissingSlot(slot.name.clone()));
            }
        }
        // Walk the parsed template; each _sittir_metavar position takes the
        // corresponding slot value. Non-metavar nodes copied through.
        let mut result = self.compiled.parsed.clone();
        for slot in &self.compiled.slots {
            let value = slots.get(&slot.name).expect("validated above");
            splice_at_path(&mut result, &slot.position_path, value.clone());
        }
        Ok(result)
    }
}

/// Walk to a metavar position and substitute it with `value`.
///
/// `path` is the sequence of *named-child indices* the slot extractor recorded
/// while walking the template parse tree (design §3.3). Each step descends one
/// named child of the current node. The final position is replaced.
///
/// Single-slot semantics here; multi-slot splatting (`$...PARAMS`) is layered
/// on top in Task 3.5 by branching on `slot.multi` before calling this.
fn splice_at_path(node: &mut NodeData, path: &[usize], value: NodeData) {
    if path.is_empty() {
        *node = value;
        return;
    }
    let (head, rest) = path.split_first().expect("non-empty checked above");

    // NodeData layout (design §NodeData shape):
    //   - branch: { $type, $source, $named, _<field>..., $children }
    //   - leaf:   { $type, $source, $named, $text }
    // Named children are interleaved across `_<field>` storage (single + array)
    // and `$children`. The slot extractor records *named-child index* — i.e.,
    // the position in tree-sitter's namedChild iteration — so we mirror that
    // walk by visiting fields in declared order, then `$children`.
    let target = nth_named_child_mut(node, *head)
        .unwrap_or_else(|| panic!("splice_at_path: index {} out of bounds for {}", head, node.kind()));
    splice_at_path(target, rest, value);
}

/// Returns a mutable reference to the nth named child of `node` in declared
/// field order, then $children. Mirrors tree-sitter's namedChild iteration.
fn nth_named_child_mut(node: &mut NodeData, n: usize) -> Option<&mut NodeData> {
    let mut remaining = n;
    // Fields are walked in their declared order (the AssembledNode preserves
    // this; sittir-core has the per-kind field list available via `kind_meta`).
    for field_name in node.kind_meta().named_field_order() {
        match node.field_mut(field_name) {
            FieldStorage::Single(Some(child)) => {
                if remaining == 0 { return Some(child); }
                remaining -= 1;
            }
            FieldStorage::Single(None) => { /* absent optional — skip */ }
            FieldStorage::Many(children) => {
                if remaining < children.len() { return Some(&mut children[remaining]); }
                remaining -= children.len();
            }
        }
    }
    let unnamed = node.children_mut();
    if remaining < unnamed.len() {
        Some(&mut unnamed[remaining])
    } else {
        None
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test build_substitutes_single_slot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/template/builder.rs rust/crates/sittir-core/src/template/tests.rs
git commit -m "feat(sittir-core): TemplateBuilder splices single slots (Phase 3.4)"
```

#### Task 3.5: `TemplateBuilder` — multi-slot ($...PARAMS)

**Files:**
- Modify: `rust/crates/sittir-core/src/template/builder.rs`
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn build_substitutes_multi_slot() {
    let lang = test_template_language("rust");
    let compiled = CompiledTemplate::compile("fn foo($...PARAMS) {}", &lang).unwrap();
    let mut slots = std::collections::HashMap::new();
    slots.insert("PARAMS".to_string(), node_data_array(vec![
        node_data_parameter("x", "i32"),
        node_data_parameter("y", "i32"),
    ]));
    let result = TemplateBuilder::new(&compiled).build(&slots).unwrap();
    let params = result.field("parameters").unwrap();
    let children = params.children();
    assert_eq!(children.len(), 2);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test build_substitutes_multi_slot
```

Expected: FAIL — `splice_at_path` doesn't handle multi-slot (single replacement vs array splat).

- [ ] **Step 3: Implement multi-slot splatting**

`splice_at_path` from Task 3.4 is single-slot only. Multi-slot (`$...NAME`) requires *splatting* the slot value's children into the parent's children list at the metavar position, not replacing one node. Implement at the `TemplateBuilder::build` level by branching on `slot.multi`:

```rust
// rust/crates/sittir-core/src/template/builder.rs (replace build())
pub fn build(&self, slots: &HashMap<String, NodeData>) -> Result<NodeData, FillError> {
    for slot in &self.compiled.slots {
        if !slots.contains_key(&slot.name) {
            return Err(FillError::MissingSlot(slot.name.clone()));
        }
    }
    let mut result = self.compiled.parsed.clone();
    // Splice in REVERSE position-order so earlier multi-splats don't shift the
    // indices of later positions in the same parent's named-child list.
    let mut ordered = self.compiled.slots.iter().collect::<Vec<_>>();
    ordered.sort_by(|a, b| b.position_path.cmp(&a.position_path));
    for slot in ordered {
        let value = slots.get(&slot.name).expect("validated above").clone();
        if slot.multi {
            splat_at_path(&mut result, &slot.position_path, value)?;
        } else {
            splice_at_path(&mut result, &slot.position_path, value);
        }
    }
    Ok(result)
}

/// Multi-slot splat: walks to the parent of the metavar position, then replaces
/// the metavar entry with the (named) children of `value`. `value` is expected
/// to be a NodeData whose own children form the splat (e.g., a Parameters node
/// whose $children become the parent's parameter list).
fn splat_at_path(node: &mut NodeData, path: &[usize], value: NodeData) -> Result<(), FillError> {
    let (parent_path, position) = path.split_last()
        .ok_or_else(|| FillError::Compile(CompileError::HasErrorNodes { line: 0, column: 0 }))?;
    let parent = walk_to_mut(node, parent_path);
    let splat_children: Vec<NodeData> = value.into_children();
    replace_named_at_with_many(parent, *position, splat_children);
    Ok(())
}

fn walk_to_mut<'a>(node: &'a mut NodeData, path: &[usize]) -> &'a mut NodeData {
    let mut current = node;
    for &idx in path {
        current = nth_named_child_mut(current, idx).expect("walk_to_mut path invalid");
    }
    current
}

/// Find the named-child slot at `position` in `parent` (using the same field-then-children
/// walk as `nth_named_child_mut`) and replace it with `replacements`. The replacement
/// always lands in `$children` — the multi-slot grammar position is always a $children
/// position by design (`$...NAME` is rejected at codegen time for non-list positions
/// per Task 2.6).
fn replace_named_at_with_many(parent: &mut NodeData, position: usize, replacements: Vec<NodeData>) {
    let children = parent.children_mut();
    // The metavar is at `position - <count of named field children>`; the
    // codegen guarantees multi-slot positions correspond to $children entries.
    let field_count = parent.kind_meta().count_named_field_children(parent);
    let in_children = position
        .checked_sub(field_count)
        .expect("multi-slot in non-$children position; should be rejected at codegen");
    children.splice(in_children..=in_children, replacements);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test build_substitutes_multi_slot
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/template/builder.rs rust/crates/sittir-core/src/template/tests.rs
git commit -m "feat(sittir-core): TemplateBuilder handles multi-slot splatting (Phase 3.5)"
```

#### Task 3.6: `TemplateBuilder` — missing slot error

**Files:**
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn build_missing_slot_returns_fill_error() {
    let lang = test_template_language("rust");
    let compiled = CompiledTemplate::compile("fn $NAME() {}", &lang).unwrap();
    let slots = std::collections::HashMap::new();  // empty — NAME missing
    let result = TemplateBuilder::new(&compiled).build(&slots);
    assert!(matches!(result, Err(FillError::MissingSlot(name)) if name == "NAME"));
}
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test build_missing_slot
```

Expected: PASS (Task 3.4 already added the missing-slot validation).

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/src/template/tests.rs
git commit -m "test(sittir-core): missing slot returns FillError (Phase 3.6)"
```

#### Task 3.7: `TemplateBuilder` — extras silently ignored

**Files:**
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn build_extra_slots_ignored() {
    let lang = test_template_language("rust");
    let compiled = CompiledTemplate::compile("fn $NAME() {}", &lang).unwrap();
    let mut slots = std::collections::HashMap::new();
    slots.insert("NAME".to_string(), node_data_identifier("greet"));
    slots.insert("EXTRA".to_string(), node_data_identifier("ignored"));
    let result = TemplateBuilder::new(&compiled).build(&slots);
    assert!(result.is_ok(), "extras should be silently ignored per design §9.3");
}
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test build_extra_slots
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/src/template/tests.rs
git commit -m "test(sittir-core): extra slots silently ignored (Phase 3.7)"
```

#### Task 3.8: LRU cache — `TemplateCache`

**Files:**
- Create: `rust/crates/sittir-core/src/template/cache.rs`
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn template_cache_lru_evicts_at_capacity() {
    let lang = test_template_language("rust");
    let mut cache = TemplateCache::with_capacity(2);
    let _ = cache.get_or_compile("fn $A() {}", &lang).unwrap();
    let _ = cache.get_or_compile("fn $B() {}", &lang).unwrap();
    let _ = cache.get_or_compile("fn $C() {}", &lang).unwrap();
    assert_eq!(cache.len(), 2);
    assert!(!cache.contains("fn $A() {}"), "LRU should evict A");
    assert!(cache.contains("fn $B() {}"));
    assert!(cache.contains("fn $C() {}"));
}

#[test]
fn template_cache_default_capacity_256() {
    let cache = TemplateCache::default();
    assert_eq!(cache.capacity(), 256);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test template_cache
```

Expected: FAIL — `TemplateCache` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```rust
// rust/crates/sittir-core/src/template/cache.rs
use std::sync::Arc;
use lru::LruCache;
use ast_grep_core::Language;
use super::compiled::CompiledTemplate;
use super::errors::CompileError;

pub struct TemplateCache {
    inner: LruCache<u64, Arc<CompiledTemplate>>,
}

impl Default for TemplateCache {
    fn default() -> Self {
        Self::with_capacity(256)
    }
}

impl TemplateCache {
    pub fn with_capacity(cap: usize) -> Self {
        Self { inner: LruCache::new(cap.try_into().unwrap()) }
    }

    pub fn capacity(&self) -> usize {
        self.inner.cap().get()
    }

    pub fn len(&self) -> usize {
        self.inner.len()
    }

    pub fn contains(&self, source: &str) -> bool {
        self.inner.contains(&hash_source(source))
    }

    pub fn get_or_compile<L: Language>(
        &mut self,
        source: &str,
        lang: &L,
    ) -> Result<Arc<CompiledTemplate>, CompileError> {
        let key = hash_source(source);
        if let Some(c) = self.inner.get(&key) {
            return Ok(c.clone());
        }
        let compiled = Arc::new(CompiledTemplate::compile(source, lang)?);
        self.inner.put(key, compiled.clone());
        Ok(compiled)
    }
}
```

Add `lru = "0.12"` to `rust/crates/sittir-core/Cargo.toml`.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test template_cache
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/template/cache.rs rust/crates/sittir-core/src/template/tests.rs rust/crates/sittir-core/Cargo.toml
git commit -m "feat(sittir-core): TemplateCache LRU, default capacity 256 (Phase 3.8)"
```

#### Task 3.9: Integrate cache into `Engine` — `template_cache` field

**Files:**
- Modify: `rust/crates/sittir-core/src/engine.rs` (or wherever `Engine` lives)
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn engine_has_template_cache() {
    let engine = test_engine("rust");
    assert!(engine.template_cache().capacity() == 256);
}

#[test]
fn engine_template_cache_persists_across_calls() {
    let mut engine = test_engine("rust");
    let _ = engine.template_cache().get_or_compile("fn $X() {}", engine.template_language());
    assert_eq!(engine.template_cache().len(), 1);
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd rust/crates/sittir-core && cargo test engine_has_template_cache
```

Expected: FAIL — `Engine::template_cache()` doesn't exist.

- [ ] **Step 3: Add field + accessor + template-language slot to `Engine`**

```rust
// rust/crates/sittir-core/src/engine.rs (modifications)
pub struct Engine<G: EngineGrammar> {
    // ... existing fields
    pub(crate) template_cache: super::template::TemplateCache,
    pub(crate) template_language: Option<G::Language>,
}

impl<G: EngineGrammar> Engine<G> {
    pub fn template_cache(&mut self) -> &mut super::template::TemplateCache {
        &mut self.template_cache
    }
    pub fn template_language(&self) -> Option<&G::Language> {
        self.template_language.as_ref()
    }
}
```

`EngineGrammar::Language` and the language slot are populated when the per-grammar engine factory loads `template-parser.wasm`.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test engine_has_template_cache
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-core/src/engine.rs rust/crates/sittir-core/src/template/tests.rs
git commit -m "feat(sittir-core): Engine carries template_cache + template_language (Phase 3.9)"
```

#### Task 3.10: End-to-end Rust fill smoke test

**Files:**
- Test: `rust/crates/sittir-core/src/template/tests.rs` (extend)

- [ ] **Step 1: Write the failing test**

```rust
#[test]
fn end_to_end_compile_fill_render() {
    let mut engine = test_engine("rust");
    let compiled = engine.template_cache().get_or_compile(
        "fn $NAME() {}",
        engine.template_language().unwrap(),
    ).unwrap();
    let mut slots = std::collections::HashMap::new();
    slots.insert("NAME".to_string(), node_data_identifier("hello"));
    let node_data = TemplateBuilder::new(&compiled).build(&slots).unwrap();
    let rendered = engine.render_node_data(&node_data);
    assert!(rendered.contains("hello"));
    assert!(rendered.starts_with("fn"));
}
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd rust/crates/sittir-core && cargo test end_to_end_compile_fill_render
```

Expected: PASS — all components from Phase 3 wired together.

- [ ] **Step 3: Commit**

```bash
git add rust/crates/sittir-core/src/template/tests.rs
git commit -m "test(sittir-core): end-to-end compile → fill → render smoke (Phase 3.10)"
```

---

### Phase 4 — `FillHandle` + napi `template_read` / `template_render`

#### Task 4.1: `FillHandle` class in `@sittir/core`

**Files:**
- Create: `packages/core/src/template/fill-handle.ts`
- Create: `packages/core/src/template/errors.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/template/fill-handle.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/template/fill-handle.test.ts
import { describe, expect, it } from 'vitest';
import { FillHandle } from '../../template/fill-handle.ts';

describe('FillHandle', () => {
  it('captures source and slots without invoking a backend', () => {
    const h = new FillHandle('fn $X() {}', { X: { $type: 1 } });
    expect(h.source).toBe('fn $X() {}');
    expect(h.slots).toEqual({ X: { $type: 1 } });
  });

  it('exposes .read / .render and $-prefixed aliases', () => {
    const h = new FillHandle('fn $X() {}', { X: {} });
    expect(typeof h.read).toBe('function');
    expect(typeof h.render).toBe('function');
    expect(typeof h.$read).toBe('function');
    expect(typeof h.$render).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test fill-handle
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/template/fill-handle.ts
import type { AnyNodeData } from '@sittir/types';
import { getActiveTemplateBackend } from './backend.ts';

export class FillHandle<Slots = Record<string, AnyNodeData | string | number>> {
  constructor(public readonly source: string, public readonly slots: Slots) {}
  read(): AnyNodeData     { return getActiveTemplateBackend().fillRead(this.source, this.slots); }
  render(): string        { return getActiveTemplateBackend().fillRender(this.source, this.slots); }
  $read(): AnyNodeData    { return this.read(); }
  $render(): string       { return this.render(); }
}
```

```ts
// packages/core/src/template/errors.ts
export class TemplateParseError extends Error {
  constructor(public template: string, public line: number, public column: number, public fragment: string) {
    super(`template parse error at ${line}:${column}: ${fragment}`);
    this.name = 'TemplateParseError';
  }
}
export class MissingSlotError extends Error {
  constructor(public template: string, public slotName: string) {
    super(`missing slot: $${slotName}`);
    this.name = 'MissingSlotError';
  }
}
export class TemplateBackendError extends Error {
  constructor(public backend: 'native' | 'js', public override cause: unknown) {
    super(`template backend error (${backend})`);
    this.name = 'TemplateBackendError';
  }
}
```

Stub `getActiveTemplateBackend` to throw 'not yet wired' — Task 4.2 will plumb it.

```ts
// packages/core/src/template/backend.ts
export interface TemplateBackend {
  fillRead(source: string, slots: unknown): AnyNodeData;
  fillRender(source: string, slots: unknown): string;
}
let active: TemplateBackend | null = null;
export function setActiveTemplateBackend(backend: TemplateBackend): void { active = backend; }
export function getActiveTemplateBackend(): TemplateBackend {
  if (!active) throw new Error('no template backend registered');
  return active;
}
```

Re-export from `@sittir/core/index.ts`:

```ts
export { FillHandle } from './template/fill-handle.ts';
export { TemplateParseError, MissingSlotError, TemplateBackendError } from './template/errors.ts';
export { setActiveTemplateBackend } from './template/backend.ts';
export type { TemplateBackend } from './template/backend.ts';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test fill-handle
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template/ packages/core/src/index.ts packages/core/src/__tests__/template/
git commit -m "feat(@sittir/core): FillHandle + template backend interface (Phase 4.1)"
```

#### Task 4.2: napi `template_read` + `template_render` on Rust engine

**Files:**
- Create: `rust/crates/sittir-rust/src/template_napi.rs`
- Modify: `rust/crates/sittir-rust/src/lib.rs`
- Test: extends `packages/rust/tests/` (TS-side smoke test)

- [ ] **Step 1: Write the failing test (TS-side)**

```ts
// packages/rust/tests/template-napi.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/rust';

describe('template_read / template_render via napi', () => {
  it('renders fn $NAME() {} with NAME=hello', () => {
    const engine = createEngine();
    if (!('templateRender' in engine)) {
      throw new Error('engine missing templateRender — build native binding');
    }
    const out = (engine as any).templateRender('fn $NAME() {}', {
      NAME: ir.identifier('hello'),
    });
    expect(out).toContain('hello');
    expect(out).toMatch(/fn\s+hello/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/rust test template-napi
```

Expected: FAIL — `templateRender` not on engine.

- [ ] **Step 3: Write minimal Rust implementation**

```rust
// rust/crates/sittir-rust/src/template_napi.rs
use napi::{Env, JsObject, JsString, JsUnknown, Result};
use napi_derive::napi;
use sittir_core::node_data::NodeData;
use sittir_core::template::{TemplateBuilder, FillError};

#[napi]
impl crate::SittirRustEngine {
    #[napi]
    pub fn template_read(&mut self, env: Env, source: String, slots: JsObject) -> Result<JsObject> {
        let lang = self.engine.template_language()
            .ok_or_else(|| napi::Error::from_reason("template language unavailable"))?
            .clone();
        let compiled = self.engine.template_cache().get_or_compile(&source, &lang)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        let slot_map = decode_slots_napi(env, slots)?;
        let node_data = TemplateBuilder::new(&compiled).build(&slot_map)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        node_data.to_napi_object(env)
    }

    #[napi]
    pub fn template_render(&mut self, env: Env, source: String, slots: JsObject) -> Result<String> {
        let lang = self.engine.template_language()
            .ok_or_else(|| napi::Error::from_reason("template language unavailable"))?
            .clone();
        let compiled = self.engine.template_cache().get_or_compile(&source, &lang)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        let slot_map = decode_slots_napi(env, slots)?;
        let node_data = TemplateBuilder::new(&compiled).build(&slot_map)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        Ok(self.engine.render_node_data(&node_data))
    }
}

/// Walks the JsObject's enumerable own properties and decodes each value as a NodeData.
/// Mirrors how `Engine::read` reads slot inputs — `NodeData` already implements
/// `FromNapiValue` for napi-direct ingress (ADR-0018), so this is just the iteration
/// shell around it.
fn decode_slots_napi(env: Env, obj: JsObject) -> Result<std::collections::HashMap<String, NodeData>> {
    use napi::bindgen_prelude::FromNapiValue;
    let mut out = std::collections::HashMap::new();
    let prop_names = obj.get_property_names()?;
    let len: u32 = prop_names.get_array_length()?;
    for i in 0..len {
        let key_js: napi::JsString = prop_names.get_element(i)?;
        let key = key_js.into_utf8()?.into_owned()?;
        let value_js: napi::JsUnknown = obj.get_property(&key_js)?;
        // SAFETY: `value_js.raw()` is a valid napi_value owned by the JsUnknown
        // (lifetime tied to `env`). `NodeData::from_napi_value` reads it directly
        // without taking ownership of the JsObject.
        let node_data = unsafe { NodeData::from_napi_value(env.raw(), value_js.raw())? };
        out.insert(key, node_data);
    }
    Ok(out)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust run regenerate  # rebuilds native binding
pnpm --filter @sittir/rust test template-napi
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add rust/crates/sittir-rust/src/template_napi.rs rust/crates/sittir-rust/src/lib.rs packages/rust/tests/template-napi.test.ts
git commit -m "feat(sittir-rust): napi template_read + template_render (Phase 4.2)"
```

#### Task 4.3: Wire native backend into `setActiveTemplateBackend`

**Files:**
- Modify: `packages/rust/src/engine.ts`
- Test: `packages/core/src/__tests__/template/fill-handle.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('FillHandle delegates to active backend', () => {
  it('FillHandle.render() returns rendered text via the registered backend', async () => {
    const { createEngine, ir } = await import('@sittir/rust');
    const engine = createEngine();  // registers native backend on construction
    const { FillHandle } = await import('@sittir/core');
    const out = new FillHandle('fn $NAME() {}', { NAME: ir.identifier('hello') }).render();
    expect(out).toContain('hello');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test fill-handle
```

Expected: FAIL — `createEngine()` doesn't register a template backend.

- [ ] **Step 3: Write minimal implementation**

In `packages/rust/src/engine.ts`, after engine construction, register the template backend:

```ts
// packages/rust/src/engine.ts (modification)
import { setActiveTemplateBackend } from '@sittir/core';

export function createEngine(options?: EngineOptions): SittirEngineLike {
  const engine = createNativeEngine(...) ?? createJsEngine(...);
  // Register template backend (native if available, JS-side otherwise — JS-side
  // implementation lands in Phase 5)
  setActiveTemplateBackend({
    fillRead:   (source, slots) => (engine as any).templateRead(source, slots),
    fillRender: (source, slots) => (engine as any).templateRender(source, slots),
  });
  return engine;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test fill-handle
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rust/src/engine.ts packages/core/src/__tests__/template/fill-handle.test.ts
git commit -m "feat(rust): register native template backend on engine init (Phase 4.3)"
```

#### Task 4.4: End-to-end snippet test (canary)

**Files:**
- Test: `packages/rust/tests/snippets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/rust/tests/snippets.test.ts
import { describe, expect, it } from 'vitest';
import { snippets, ir, createEngine } from '@sittir/rust';

describe('snippets.greet (Phase 2.7 canary)', () => {
  it('renders pub fn hello() -> String { ... }', () => {
    createEngine();  // registers backend
    const handle = snippets.greet.fill({
      NAME: ir.identifier('hello'),
      PARAMS: [],
      RET: ir.typeIdentifier('String'),
      BODY: ir.expressionStatement({ expression: ir.stringLiteral('"hi"') }),
    });
    const out = handle.render();
    expect(out).toContain('hello');
    expect(out).toContain('String');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust test snippets
```

Expected: PASS — full Phase 1–4 stack working end-to-end.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/snippets.test.ts
git commit -m "test(rust): end-to-end snippet render via native backend (Phase 4.4)"
```

#### Task 4.5: Round-trip equivalence: snippet → render → parse → render

**Files:**
- Test: `packages/rust/tests/snippets.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('snippet round-trip equivalence', () => {
  it('rendered snippet output parses cleanly and re-renders byte-identically', () => {
    const engine = createEngine();
    const original = snippets.greet.fill({
      NAME: ir.identifier('hello'),
      PARAMS: [],
      RET: ir.typeIdentifier('String'),
      BODY: ir.expressionStatement({ expression: ir.stringLiteral('"hi"') }),
    }).render();

    const { root, tree } = engine.reader!.parseAndRead(original);
    const reRendered = (root as any).$render?.() ?? engine.render(root).text();
    expect(reRendered).toBe(original);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust test snippets
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/snippets.test.ts
git commit -m "test(rust): snippet output round-trips cleanly (Phase 4.5)"
```

#### Task 4.6: `MissingSlotError` propagates from Rust through napi

**Files:**
- Test: `packages/rust/tests/template-napi.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('napi error propagation', () => {
  it('missing slot throws a recognizable error', () => {
    const engine = createEngine();
    expect(() =>
      (engine as any).templateRender('fn $NAME() {}', {})
    ).toThrow(/missing slot.*NAME/i);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust test template-napi
```

Expected: PASS — Task 4.2 already maps `FillError::MissingSlot` to a napi error.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/template-napi.test.ts
git commit -m "test(rust): missing slot napi error propagation (Phase 4.6)"
```

---

**End of Chunk 2.** At this point: native backend serves end-to-end snippet construction. TS-side fill, parity suite, inline templates, and rollout to other grammars are Chunks 3–4.

---

## Chunk 3: Phases 5–6 — TS-side fill, parity suite, inline templates

### Phase 5 — TS-side fill + parity fixture corpus + harness

#### Task 5.1: TS-side fill skeleton — `TsCompiledTemplate`

**Files:**
- Create: `packages/core/src/template/ts-fill.ts`
- Test: `packages/core/src/__tests__/template/ts-fill.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/template/ts-fill.test.ts
import { describe, expect, it } from 'vitest';
import { TsCompiledTemplate } from '../../template/ts-fill.ts';

describe('TsCompiledTemplate.compile', () => {
  it('parses a template and extracts slots', async () => {
    const compiled = await TsCompiledTemplate.compile('fn $NAME() {}', 'rust');
    expect(compiled.slots).toHaveLength(1);
    expect(compiled.slots[0].name).toBe('NAME');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test ts-fill
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/template/ts-fill.ts
import type { AnyNodeData } from '@sittir/types';
import { extractSlots, type SlotMap } from '@sittir/codegen/templates/extract-slots';
import { CompileError } from './errors.ts';

export class TsCompiledTemplate {
  constructor(
    public readonly sourceHash: string,
    public readonly parsed: AnyNodeData,
    public readonly slots: SlotMap,
  ) {}

  static async compile(source: string, grammar: string): Promise<TsCompiledTemplate> {
    const slots = await extractSlots(source, grammar);
    // parse the template via tree-sitter JS binding, read into NodeData
    const parsed = await readTemplateAsNodeData(source, grammar);
    const sourceHash = await hashSource(source);
    return new TsCompiledTemplate(sourceHash, parsed, slots);
  }
}

async function hashSource(source: string): Promise<string> {
  const enc = new TextEncoder().encode(source);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sync helper: parse a pre-loaded template-mode tree into a NodeData.
 *
 * Both halves are sync because:
 *   - the Language is already loaded (warmup contract from Task 5.4)
 *   - `Parser` construction and `parser.parse()` are sync once the language is set
 *   - `readNode()` from @sittir/common is sync over a tree-sitter tree
 *
 * Used by both `TsCompiledTemplate.compileSync` and the type-level test fixtures.
 */
function readTemplateAsNodeData(tree: any, grammar: string): AnyNodeData {
  // Adapt the template-mode tree to the same TreeHandle shape readNode expects.
  // _sittir_metavar leaves are produced by the template-mode parser as named
  // nodes; readNode treats them like any other named leaf — they survive the
  // walk as NodeData stubs that the fill backend later substitutes.
  const treeHandle = wrapTreeForReadNode(tree, grammar);
  return readNode(treeHandle);
}
```

The `wrapTreeForReadNode` helper is a one-screen adapter. Add it inline:

```ts
import { readNode, type TreeHandle } from '@sittir/common';

function wrapTreeForReadNode(tree: any, grammar: string): TreeHandle {
  return {
    rootNode: tree.rootNode,
    text: tree.rootNode.text,
    format: undefined,
    read: () => readNode({ rootNode: tree.rootNode } as any),
    render: () => { throw new Error('templates do not render directly; use FillHandle'); },
  } as unknown as TreeHandle;
}
```
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test ts-fill
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template/ts-fill.ts packages/core/src/__tests__/template/ts-fill.test.ts
git commit -m "feat(@sittir/core): TsCompiledTemplate.compile (Phase 5.1)"
```

#### Task 5.2: TS-side `fill()` — splice algorithm

**Files:**
- Modify: `packages/core/src/template/ts-fill.ts`
- Test: `packages/core/src/__tests__/template/ts-fill.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
describe('TsCompiledTemplate.fill', () => {
  it('substitutes a single slot', async () => {
    const compiled = await TsCompiledTemplate.compile('fn $NAME() {}', 'rust');
    const result = compiled.fill({ NAME: { $type: /* identifier kind id */ 1, $text: 'hello' } });
    // result.field('name').$text === 'hello'
    expect(getField(result, 'name')?.$text).toBe('hello');
  });

  it('throws on missing slot', async () => {
    const compiled = await TsCompiledTemplate.compile('fn $NAME() {}', 'rust');
    expect(() => compiled.fill({})).toThrow(/missing slot.*NAME/i);
  });

  it('ignores extras silently', async () => {
    const compiled = await TsCompiledTemplate.compile('fn $NAME() {}', 'rust');
    expect(() => compiled.fill({
      NAME: { $type: 1, $text: 'x' },
      EXTRA: { $type: 1, $text: 'y' },
    })).not.toThrow();
  });

  it('handles multi-slot ($...PARAMS)', async () => {
    const compiled = await TsCompiledTemplate.compile('fn foo($...PARAMS) {}', 'rust');
    const params = [/* parameter NodeData */];
    const result = compiled.fill({ PARAMS: params });
    expect(getField(result, 'parameters')?.$children).toHaveLength(params.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test ts-fill
```

Expected: FAIL — `fill()` doesn't exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/template/ts-fill.ts (extend)
import { MissingSlotError } from './errors.ts';

export class TsCompiledTemplate {
  // ... constructor / static compile from Task 5.1 ...

  fill(slots: Record<string, AnyNodeData | string | number>): AnyNodeData {
    // Validate missing
    for (const slot of this.slots) {
      if (!(slot.name in slots)) {
        throw new MissingSlotError(/* template ref */ '', slot.name);
      }
    }
    // Clone parsed tree, splice slot values at each metavar position.
    let result = structuredClone(this.parsed);
    for (const slot of this.slots) {
      result = spliceAtPath(result, slot.positionPath, slots[slot.name], slot.multi);
    }
    return result;
  }
}

/**
 * TS-side mirror of Rust's splice_at_path + splat_at_path.
 *
 * Walks the cloned template tree following `path` (each step = nth named-child
 * index in the namedField-then-$children walk order). Single-slot replaces
 * one position; multi-slot splats `value`'s children into the parent's
 * $children list.
 *
 * NodeData layout invariant (design §NodeData shape):
 *   branch: { $type, $source, $named, _<field>..., $children }
 *   leaf:   { $type, $source, $named, $text }
 */
function spliceAtPath(node: AnyNodeData, path: number[], value: any, multi: boolean): AnyNodeData {
  if (path.length === 0) return value as AnyNodeData;
  if (path.length === 1) {
    if (multi) return splatAt(node, path[0], value as AnyNodeData);
    return replaceNamedAt(node, path[0], value as AnyNodeData);
  }
  const [head, ...rest] = path;
  const child = nthNamedChild(node, head);
  if (!child) throw new Error(`spliceAtPath: index ${head} out of bounds for ${node.$type}`);
  const replaced = spliceAtPath(child, rest, value, multi);
  return replaceNamedAt(node, head, replaced);
}

/** Walk this node's named children in declared field order, then $children. */
function nthNamedChild(node: AnyNodeData, n: usize): AnyNodeData | null {
  let remaining = n;
  for (const fieldName of namedFieldOrderOf(node.$type)) {
    const stored = (node as any)[`_${fieldName}`];
    if (Array.isArray(stored)) {
      if (remaining < stored.length) return stored[remaining];
      remaining -= stored.length;
    } else if (stored != null) {
      if (remaining === 0) return stored;
      remaining -= 1;
    }
  }
  const children = (node as any).$children ?? [];
  return remaining < children.length ? children[remaining] : null;
}

/** Replace the nth named child with `value`, returning a new frozen NodeData. */
function replaceNamedAt(node: AnyNodeData, n: number, value: AnyNodeData): AnyNodeData {
  // Walk the same order, copy-on-write at the matched slot.
  let remaining = n;
  const replaced: any = { ...node };
  for (const fieldName of namedFieldOrderOf(node.$type)) {
    const stored = (node as any)[`_${fieldName}`];
    if (Array.isArray(stored)) {
      if (remaining < stored.length) {
        const next = stored.slice();
        next[remaining] = value;
        replaced[`_${fieldName}`] = Object.freeze(next);
        return Object.freeze(replaced);
      }
      remaining -= stored.length;
    } else if (stored != null) {
      if (remaining === 0) {
        replaced[`_${fieldName}`] = value;
        return Object.freeze(replaced);
      }
      remaining -= 1;
    }
  }
  const children = ((node as any).$children ?? []) as AnyNodeData[];
  if (remaining < children.length) {
    const next = children.slice();
    next[remaining] = value;
    replaced.$children = Object.freeze(next);
    return Object.freeze(replaced);
  }
  throw new Error(`replaceNamedAt: index ${n} out of bounds for ${node.$type}`);
}

/** Splat `value`'s children into the parent's $children at position `n`. */
function splatAt(parent: AnyNodeData, n: number, value: AnyNodeData): AnyNodeData {
  const children = ((parent as any).$children ?? []) as AnyNodeData[];
  const fieldCount = countNamedFieldChildren(parent);
  const inChildren = n - fieldCount;
  if (inChildren < 0) throw new Error('splatAt: multi-slot must land in $children');
  const splatChildren = ((value as any).$children ?? []) as AnyNodeData[];
  const next = [...children.slice(0, inChildren), ...splatChildren, ...children.slice(inChildren + 1)];
  return Object.freeze({ ...parent, $children: Object.freeze(next) });
}

// `namedFieldOrderOf(kindId)` and `countNamedFieldChildren(node)` come from the
// generated KIND_META — same source the wrap.ts accessors use. Add a tiny
// adapter in @sittir/core that takes a kindId and returns the field name list.
```
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test ts-fill
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template/ts-fill.ts packages/core/src/__tests__/template/ts-fill.test.ts
git commit -m "feat(@sittir/core): TS-side fill — single + multi slot, missing/extra (Phase 5.2)"
```

#### Task 5.3: TS-side LRU cache

**Files:**
- Create: `packages/core/src/template/cache.ts`
- Test: `packages/core/src/__tests__/template/cache.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/__tests__/template/cache.test.ts
import { describe, expect, it } from 'vitest';
import { TsTemplateCache } from '../../template/cache.ts';

describe('TsTemplateCache LRU', () => {
  it('default capacity is 256', () => {
    const cache = new TsTemplateCache();
    expect(cache.capacity).toBe(256);
  });

  it('evicts least-recently-used at capacity', async () => {
    const cache = new TsTemplateCache({ capacity: 2, grammar: 'rust' });
    await cache.getOrCompile('fn $A() {}');
    await cache.getOrCompile('fn $B() {}');
    await cache.getOrCompile('fn $C() {}');
    expect(cache.size).toBe(2);
    expect(cache.has('fn $A() {}')).toBe(false);
    expect(cache.has('fn $B() {}')).toBe(true);
    expect(cache.has('fn $C() {}')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/core test cache
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/core/src/template/cache.ts
import { TsCompiledTemplate } from './ts-fill.ts';

export interface TsTemplateCacheOptions {
  capacity?: number;
  grammar: string;
}

export class TsTemplateCache {
  readonly capacity: number;
  readonly grammar: string;
  // Map preserves insertion order — sufficient for LRU with delete+set on access.
  private readonly entries = new Map<string, TsCompiledTemplate>();

  constructor(opts?: Partial<TsTemplateCacheOptions>) {
    this.capacity = opts?.capacity ?? 256;
    this.grammar = opts?.grammar ?? 'rust';  // tests usually override
  }

  get size(): number { return this.entries.size; }
  has(source: string): boolean { return this.entries.has(source); }

  async getOrCompile(source: string): Promise<TsCompiledTemplate> {
    const existing = this.entries.get(source);
    if (existing) {
      // LRU touch: re-insert
      this.entries.delete(source);
      this.entries.set(source, existing);
      return existing;
    }
    const compiled = await TsCompiledTemplate.compile(source, this.grammar);
    this.entries.set(source, compiled);
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value!;
      this.entries.delete(oldest);
    }
    return compiled;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/core test cache
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template/cache.ts packages/core/src/__tests__/template/cache.test.ts
git commit -m "feat(@sittir/core): TsTemplateCache LRU (Phase 5.3)"
```

#### Task 5.4: TS-side backend implementing the `TemplateBackend` interface (sync at boundary)

**Files:**
- Create: `packages/core/src/template/ts-backend.ts`
- Test: `packages/core/src/__tests__/template/ts-backend.test.ts`

**Design constraint (sync at boundary):** `TemplateBackend.fillRead` / `fillRender` are sync per Task 4.1. The TS-side path requires loading `template-parser.wasm` via `web-tree-sitter`, which is async. Resolution: an explicit async **warmup** (`prepareTsTemplateBackend`) loads the parser language once and stashes it in a module-level cache; subsequent calls are sync. If `fillRead`/`fillRender` are invoked before warmup, they throw a clear error pointing the caller at `prepareTsTemplateBackend`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { createTsTemplateBackend, prepareTsTemplateBackend, _resetTsTemplateState } from '../../template/ts-backend.ts';

describe('createTsTemplateBackend (sync)', () => {
  it('fillRender returns rendered text after warmup', async () => {
    _resetTsTemplateState();
    await prepareTsTemplateBackend({ grammar: 'rust' });
    const backend = createTsTemplateBackend({ grammar: 'rust', renderNode: () => '<rendered>' });
    const out = backend.fillRender('fn $NAME() {}', {
      NAME: { $type: 1, $text: 'hello', $source: 2, $named: true },
    });
    expect(out).toBe('<rendered>');
  });

  it('fillRead/fillRender throw a clear error if warmup was skipped', () => {
    _resetTsTemplateState();
    const backend = createTsTemplateBackend({ grammar: 'rust', renderNode: () => '<x>' });
    expect(() => backend.fillRead('fn $X() {}', { X: { $type: 1, $text: 'a' } }))
      .toThrow(/prepareTsTemplateBackend.*not called/i);
  });
});
```

- [ ] **Step 2: Write minimal implementation**

```ts
// packages/core/src/template/ts-backend.ts
import type { AnyNodeData } from '@sittir/types';
import { Parser, Language } from 'web-tree-sitter';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TsTemplateCache } from './cache.ts';
import { TsCompiledTemplate, _setTemplateLanguage, _getTemplateLanguage } from './ts-fill.ts';
import type { TemplateBackend } from './backend.ts';

export interface TsTemplateBackendDeps {
  grammar: string;
  renderNode: (node: AnyNodeData) => string;
}

const parserInitState = { initialized: false, promise: null as Promise<void> | null };

/**
 * Eager async warmup. Loads template-parser.wasm and stashes the Language
 * for subsequent sync compile/fill calls. Idempotent per grammar.
 *
 * Must be awaited once before any FillHandle.read() / .render() invocation
 * routed through the TS-side backend.
 */
export async function prepareTsTemplateBackend(opts: { grammar: string }): Promise<void> {
  if (!parserInitState.initialized) {
    parserInitState.promise ??= Parser.init();
    await parserInitState.promise;
    parserInitState.initialized = true;
  }
  if (_getTemplateLanguage(opts.grammar)) return;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const wasmPath = join(__dirname, '..', '..', '..', '..', opts.grammar, '.sittir', 'src', 'template-parser.wasm');
  const lang = await Language.load(wasmPath);
  _setTemplateLanguage(opts.grammar, lang);
}

/** Test-only: reset the module-level state so each test runs in isolation. */
export function _resetTsTemplateState(): void {
  parserInitState.initialized = false;
  parserInitState.promise = null;
  // ts-fill.ts owns the language map; clear it there
  _setTemplateLanguage('rust', null as any);
  _setTemplateLanguage('typescript', null as any);
  _setTemplateLanguage('python', null as any);
}

export function createTsTemplateBackend(deps: TsTemplateBackendDeps): TemplateBackend {
  const cache = new TsTemplateCache({ grammar: deps.grammar });
  function ensureWarm(): void {
    if (!_getTemplateLanguage(deps.grammar)) {
      throw new Error(
        `TS-side template backend not initialized for grammar '${deps.grammar}'. ` +
        `Call \`await prepareTsTemplateBackend({ grammar: '${deps.grammar}' })\` once at startup.`
      );
    }
  }
  return {
    fillRead(source, slots) {
      ensureWarm();
      const compiled = cache.getOrCompileSync(source);
      return compiled.fill(slots as Record<string, AnyNodeData | string | number>);
    },
    fillRender(source, slots) {
      ensureWarm();
      const compiled = cache.getOrCompileSync(source);
      return deps.renderNode(compiled.fill(slots as Record<string, AnyNodeData | string | number>));
    },
  };
}
```

This change cascades into `TsTemplateCache` (must add `getOrCompileSync`) and `TsCompiledTemplate` (must add sync `compile`, plus `_setTemplateLanguage` / `_getTemplateLanguage` accessors). Apply those follow-on changes in the same commit:

```ts
// packages/core/src/template/cache.ts — add a sync method alongside getOrCompile
getOrCompileSync(source: string): TsCompiledTemplate {
  const existing = this.entries.get(source);
  if (existing) {
    this.entries.delete(source);
    this.entries.set(source, existing);
    this.hits++;
    return existing;
  }
  this.misses++;
  const compiled = TsCompiledTemplate.compileSync(source, this.grammar);
  this.entries.set(source, compiled);
  if (this.entries.size > this.capacity) {
    const oldest = this.entries.keys().next().value!;
    this.entries.delete(oldest);
  }
  return compiled;
}

// packages/core/src/template/ts-fill.ts — add language registry + sync compile
const languages = new Map<string, Language>();
export function _setTemplateLanguage(grammar: string, lang: Language | null): void {
  if (lang === null) languages.delete(grammar); else languages.set(grammar, lang);
}
export function _getTemplateLanguage(grammar: string): Language | undefined {
  return languages.get(grammar);
}

// in TsCompiledTemplate:
static compileSync(source: string, grammar: string): TsCompiledTemplate {
  const lang = _getTemplateLanguage(grammar);
  if (!lang) throw new Error(`template language not loaded for grammar '${grammar}'`);
  const parser = new Parser();
  parser.setLanguage(lang);
  const tree = parser.parse(source);
  if (hasErrorNode(tree.rootNode)) {
    throw new TemplateParseError(source, /* line */ 0, /* col */ 0, '<see template-mode parser>');
  }
  const slots = extractSlotsFromTree(tree);   // sync walker, mirrors Phase 2.2 algorithm
  const parsed = readTemplateAsNodeData(tree, grammar); // sync — see Task 5.1 revision
  const sourceHash = hashSourceSync(source);
  return new TsCompiledTemplate(sourceHash, parsed, slots);
}
```

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/core test ts-backend
git add packages/core/src/template/ts-backend.ts packages/core/src/template/ts-fill.ts packages/core/src/template/cache.ts packages/core/src/__tests__/template/ts-backend.test.ts
git commit -m "feat(@sittir/core): sync TS-side template backend with explicit warmup (Phase 5.4)"
```

#### Task 5.5: Per-grammar engine wires TS-backend as fallback

**Files:**
- Modify: `packages/rust/src/engine.ts`

- [ ] **Step 1: Write the failing test (in `fill-handle.test.ts`)**

```ts
describe('TS fallback when native templateRender unavailable', () => {
  it('FillHandle.render() works even if native binding is absent', async () => {
    process.env.SITTIR_BACKEND = 'js';
    delete require.cache[require.resolve('@sittir/rust')];
    const { createEngine, snippets, ir } = await import('@sittir/rust');
    createEngine();
    const out = snippets.greet.fill({
      NAME: ir.identifier('hello'),
      PARAMS: [],
      RET: ir.typeIdentifier('String'),
      BODY: ir.expressionStatement({ expression: ir.stringLiteral('"hi"') }),
    }).render();
    expect(out).toContain('hello');
    delete process.env.SITTIR_BACKEND;
  });
});
```

- [ ] **Step 2: Modify `createEngine` to register TS backend lazily**

The TS-side path requires async warmup; `createEngine()` stays sync. When the native binding is unavailable (or `SITTIR_BACKEND=js`), `createEngine()` registers the TS backend's *interface* — calls before warmup throw the clear error from Task 5.4.

```ts
// packages/rust/src/engine.ts (extend Task 4.3)
import { createTsTemplateBackend, setActiveTemplateBackend } from '@sittir/core';

export function createEngine(options?: EngineOptions): SittirEngineLike {
  const engine = createNativeEngine(...) ?? createJsEngine(...);
  if ('templateRender' in engine && process.env.SITTIR_BACKEND !== 'js') {
    // Native path: fully sync, no warmup needed.
    setActiveTemplateBackend({
      fillRead:   (s, slots) => (engine as any).templateRead(s, slots),
      fillRender: (s, slots) => (engine as any).templateRender(s, slots),
    });
  } else {
    // TS-side path: registered now, but consumer must
    //   await prepareTsTemplateBackend({ grammar: 'rust' })
    // before the first FillHandle.read() / .render() invocation.
    setActiveTemplateBackend(createTsTemplateBackend({
      grammar: 'rust',
      renderNode: (node) => engine.render(node).text(),
    }));
  }
  return engine;
}
```

- [ ] **Step 3: Update the test to await warmup before sync use**

```ts
// packages/core/src/__tests__/template/fill-handle.test.ts (the SITTIR_BACKEND=js test)
import { prepareTsTemplateBackend } from '@sittir/core';

describe('TS fallback when native templateRender unavailable', () => {
  it('FillHandle.render() works after async warmup', async () => {
    process.env.SITTIR_BACKEND = 'js';
    delete require.cache[require.resolve('@sittir/rust')];
    const { createEngine, snippets, ir } = await import('@sittir/rust');
    createEngine();
    await prepareTsTemplateBackend({ grammar: 'rust' });   // explicit warmup
    const out = snippets.greet.fill({
      NAME: ir.identifier('hello'),
      PARAMS: [],
      RET: ir.typeIdentifier('String'),
      BODY: ir.expressionStatement({ expression: ir.stringLiteral('"hi"') }),
    }).render();    // sync from here on
    expect(out).toContain('hello');
    delete process.env.SITTIR_BACKEND;
  });

  it('throws a clear error if warmup is skipped', async () => {
    process.env.SITTIR_BACKEND = 'js';
    delete require.cache[require.resolve('@sittir/rust')];
    const { createEngine, template, ir } = await import('@sittir/rust');
    createEngine();
    expect(() =>
      template('fn $X() {}').fill({ X: ir.identifier('a') }).render()
    ).toThrow(/prepareTsTemplateBackend.*not called/i);
    delete process.env.SITTIR_BACKEND;
  });
});
```

- [ ] **Step 4: Test passes; commit**

```bash
pnpm test fill-handle
git add packages/rust/src/engine.ts packages/core/src/__tests__/template/fill-handle.test.ts
git commit -m "feat(rust): TS-side template backend with explicit warmup (Phase 5.5)"
```

#### Task 5.6: Parity fixture corpus — 10 categories

**Files:**
- Create: `packages/codegen/__tests__/template-parity/fixtures/001-trivial-let-binding/template.rs.template`
- Create: `packages/codegen/__tests__/template-parity/fixtures/001-trivial-let-binding/slots.json`
- Create: `packages/codegen/__tests__/template-parity/fixtures/001-trivial-let-binding/expected.nodedata.json`
- ... 9 more fixture directories (002–010 per design §6.2)

- [ ] **Step 1: Author each fixture's `template.<lang>.template`**

For each of the 10 categories from design §6.2, write the template source. Example for 001:

```rust
// fixtures/001-trivial-let-binding/template.rs.template
let $X = $Y;
```

- [ ] **Step 2: Author each `slots.json`** — slot values encoded as NodeData JSON

```json
// fixtures/001-trivial-let-binding/slots.json
{
  "X": { "$type": 1, "$text": "x", "$source": 2, "$named": true },
  "Y": { "$type": 2, "$text": "1", "$source": 2, "$named": true }
}
```

- [ ] **Step 3: Hand-author the expected NodeData for fixture 001** (anchors the snapshot)

Snapshotting from one of the systems-under-test is tautological. To anchor truth, fixture 001 (the trivial let binding) gets a hand-authored `expected.nodedata.json`:

```json
// fixtures/001-trivial-let-binding/expected.nodedata.json
{
  "$type": "<TSKindId for let_declaration>",
  "$source": 2,
  "$named": true,
  "_pattern": {
    "$type": "<TSKindId for identifier>",
    "$source": 2,
    "$named": true,
    "$text": "x"
  },
  "_value": {
    "$type": "<TSKindId for integer_literal>",
    "$source": 2,
    "$named": true,
    "$text": "1"
  }
}
```

Replace `<TSKindId for ...>` with the actual numeric ids from `packages/rust/src/types.ts` `TSKindId` const enum.

- [ ] **Step 4: For fixtures 002–010, leave `expected.nodedata.json` empty** — Task 5.8 populates them by snapshotting the Rust backend's output, but the harness *also* asserts `rustOutput === tsOutput` independently of `expected`. So:
  - Fixture 001: hand-authored expected anchors absolute correctness.
  - Fixtures 002–010: snapshotted; parity check is "both backends agree", which catches divergence even when the snapshot itself is wrong.
  - Periodically (every PR touching template/), spot-check 2–3 snapshotted fixtures by hand-author against the design's slot-derivation rules.

- [ ] **Step 5: Commit fixtures**

```bash
git add packages/codegen/__tests__/template-parity/fixtures/
git commit -m "test(codegen): parity fixture corpus, 10 categories (Phase 5.6)"
```

#### Task 5.7: Parity harness + parity test

**Files:**
- Create: `packages/codegen/__tests__/template-parity/harness.ts`
- Create: `packages/codegen/__tests__/template-parity/parity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/__tests__/template-parity/parity.test.ts
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFixture } from './harness.ts';

const fixtures = readdirSync(join(__dirname, 'fixtures'));

describe('template parity (Rust vs TS-side)', () => {
  for (const name of fixtures) {
    it(`fixture ${name}`, async () => {
      const result = await runFixture(name);
      expect(result.rustOutput).toEqual(result.tsOutput);
      if (result.expected) {
        expect(result.rustOutput).toEqual(result.expected);
      }
    });
  }
});
```

- [ ] **Step 2: Write the harness**

```ts
// packages/codegen/__tests__/template-parity/harness.ts
//
// Multi-grammar harness. Each fixture directory contains a `metadata.json`
// declaring its grammar; the harness loads the matching @sittir/<grammar>
// engine dynamically and the matching template extension.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TsCompiledTemplate } from '@sittir/core/template/ts-fill';
import { prepareTsTemplateBackend } from '@sittir/core';

export interface FixtureMeta {
  grammar: 'rust' | 'typescript' | 'python';
}

export interface FixtureResult {
  rustOutput: unknown;       // named historically; actually "native backend output"
  tsOutput:   unknown;
  expected:   unknown | null;
}

const engineCache = new Map<string, any>();
async function getEngine(grammar: string): Promise<any> {
  if (engineCache.has(grammar)) return engineCache.get(grammar);
  const mod = await import(`@sittir/${grammar}`);
  const engine = mod.createEngine();
  await prepareTsTemplateBackend({ grammar });  // also needed for TS fallback
  engineCache.set(grammar, engine);
  return engine;
}

function templateFilename(dir: string): string {
  // any file matching template.<ext>.template — there's exactly one per fixture
  const f = readdirSync(dir).find((x) => /^template\.[^.]+\.template$/.test(x));
  if (!f) throw new Error(`fixture ${dir} has no template.<ext>.template file`);
  return f;
}

export async function runFixture(name: string): Promise<FixtureResult> {
  const dir = join(__dirname, 'fixtures', name);
  const meta: FixtureMeta = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
  const template = readFileSync(join(dir, templateFilename(dir)), 'utf8');
  const slots = JSON.parse(readFileSync(join(dir, 'slots.json'), 'utf8'));
  const expectedPath = join(dir, 'expected.nodedata.json');
  const expected = existsSync(expectedPath) && readFileSync(expectedPath, 'utf8').trim() !== ''
    ? JSON.parse(readFileSync(expectedPath, 'utf8'))
    : null;

  const engine = await getEngine(meta.grammar);
  const nativeOutput = (engine as any).templateRead(template, slots);

  const tsCompiled = TsCompiledTemplate.compileSync(template, meta.grammar);
  const tsOutput = tsCompiled.fill(slots);

  return { rustOutput: nativeOutput, tsOutput, expected };
}
```

Each fixture directory must include a `metadata.json`:

```json
// fixtures/001-trivial-let-binding/metadata.json
{ "grammar": "rust" }
```

- [ ] **Step 3: Run test to verify it fails or reveals discrepancies**

```bash
pnpm --filter @sittir/codegen test parity
```

Expected: PASS for fixture 001 (trivial); FAIL for some categories where the algorithms diverge — fix as they surface.

- [ ] **Step 4: Iterate fix → re-test until all green**

For each failing fixture, diff the two outputs, fix the divergent backend, re-run. Document each divergence found in commit messages.

- [ ] **Step 5: Commit harness + initial parity green**

```bash
git add packages/codegen/__tests__/template-parity/harness.ts packages/codegen/__tests__/template-parity/parity.test.ts
git commit -m "test(codegen): parity harness, all 10 fixtures green (Phase 5.7)"
```

#### Task 5.8: Snapshot expected NodeData from green Rust output

**Files:**
- Modify: each `expected.nodedata.json`

- [ ] **Step 1: Write a script that snapshots the Rust backend's output for each fixture**

```ts
// scripts/snapshot-template-parity-expected.ts
import { writeFileSync } from 'node:fs';
import { runFixture } from '../packages/codegen/__tests__/template-parity/harness.ts';
// ... loop fixtures, write each rustOutput to expected.nodedata.json
```

- [ ] **Step 2: Run script**

```bash
npx tsx scripts/snapshot-template-parity-expected.ts
```

- [ ] **Step 3: Re-run parity tests with `expected` populated**

```bash
pnpm --filter @sittir/codegen test parity
```

Expected: PASS — both backends and the snapshot agree.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/__tests__/template-parity/fixtures/*/expected.nodedata.json scripts/snapshot-template-parity-expected.ts
git commit -m "test(codegen): snapshot expected NodeData for parity fixtures (Phase 5.8)"
```

#### Task 5.9: Wire parity test into CI

**Files:**
- Modify: existing CI workflow / `package.json` scripts

- [ ] **Step 1: Add parity script to root `package.json`**

```json
"scripts": {
  "test:parity": "vitest run packages/codegen/__tests__/template-parity/"
}
```

- [ ] **Step 2: Add the parity job to the CI workflow**

Edit `.github/workflows/test.yml` (or create one if absent — the project's CI entry point). Add a parity job that runs on PRs touching `template/`, `templates/`, or `template-parity/`:

```yaml
# .github/workflows/test.yml (add or extend)
jobs:
  template-parity:
    if: |
      contains(github.event.pull_request.title, 'template') ||
      contains(toJSON(github.event.pull_request.changed_files), 'template')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @sittir/rust run regenerate
      - run: pnpm --filter @sittir/typescript run regenerate
      - run: pnpm --filter @sittir/python run regenerate
      - run: pnpm run test:parity
```

If the project already has a `test.yml` workflow (likely — check `ls .github/workflows/`), add the `template-parity` job alongside the existing `test` job. Trigger condition: any change in a path matching `**/template/**` or `**/templates/**` or `**/template-parity/**`.

- [ ] **Step 3: Commit**

```bash
git add package.json .github/workflows/test.yml
git commit -m "ci: parity suite gates PRs touching template/ (Phase 5.9)"
```

#### Task 5.10: Document parity contract in design

**Files:**
- Modify: `docs/superpowers/specs/2026-05-10-construction-templates-design.md`

- [ ] **Step 1: Update §6 Parity contract** to reference the actual fixture paths and CI gate

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-10-construction-templates-design.md
git commit -m "docs(design): update parity contract with concrete CI wiring (Phase 5.10)"
```

---

### Phase 6 — Inline `template('...')` + per-grammar wrapper + LRU + TS slot extraction

#### Task 6.1: TS template-literal-type slot-name extraction

**Files:**
- Create: `packages/types/src/template-slots.ts`
- Test: `packages/types/src/__tests__/template-slots.test-d.ts`

- [ ] **Step 1: Write the failing type-level test**

```ts
// packages/types/src/__tests__/template-slots.test-d.ts
import { expectTypeOf } from 'vitest';
import type { SlotNamesOf } from '../template-slots.ts';

expectTypeOf<SlotNamesOf<'fn $NAME() {}'>>().toEqualTypeOf<'NAME'>();
expectTypeOf<SlotNamesOf<'let $X = $Y;'>>().toEqualTypeOf<'X' | 'Y'>();
expectTypeOf<SlotNamesOf<'fn foo($...PARAMS) {}'>>().toEqualTypeOf<'PARAMS'>();
expectTypeOf<SlotNamesOf<'no slots here'>>().toEqualTypeOf<never>();
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/types test template-slots
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/types/src/template-slots.ts
//
// Extracts slot names from a template literal at the type level so missing/extra
// keys to .fill() are caught by tsc.
//
// Recursion depth: TypeScript's default instantiation limit is ~1000. Each $X
// occurrence consumes ~3 conditional steps + per-character ExtractName depth.
// In practice this comfortably handles templates up to ~200 chars / ~30 slots.
// For longer templates, consumers should use the explicit type parameter form
// (`template<{X: ..., Y: ...}>('...')`) which bypasses inference entirely.

type StripDots<S extends string> = S extends `...${infer R}` ? R : S;

type Stop = ' ' | '\t' | '\n' | '(' | ')' | '{' | '}' | '[' | ']'
          | ',' | ';' | ':' | '.' | '?' | '!' | '<' | '>' | '+' | '-'
          | '*' | '/' | '%' | '=' | '&' | '|' | '^' | '~' | '"' | "'";

// Tail-recursive accumulator pattern: TS optimizes simple-tail recursions.
// `Acc` is built up character-by-character and surfaced when we hit a Stop.
type ExtractName<S extends string, Acc extends string = ''> =
  S extends `${infer C}${infer Rest}`
    ? C extends Stop
      ? Acc
      : ExtractName<Rest, `${Acc}${C}`>
    : Acc;

// Tail-recursive over the template body: peels one `$<name>` at a time and
// accumulates names into a union via a phantom parameter.
type SlotNamesAcc<S extends string, Acc extends string> =
  S extends `${string}$${infer After}`
    ? StripDots<ExtractName<After>> extends ''
      ? SlotNamesAcc<After, Acc>
      : SlotNamesAcc<After, Acc | StripDots<ExtractName<After>>>
    : Acc;

export type SlotNamesOf<S extends string> = SlotNamesAcc<S, never>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @sittir/types test template-slots
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/types/src/template-slots.ts packages/types/src/__tests__/template-slots.test-d.ts
git commit -m "feat(@sittir/types): SlotNamesOf<S> template-literal-type extraction (Phase 6.1)"
```

#### Task 6.2: Per-grammar `template()` wrapper emitter

**Files:**
- Create: `packages/codegen/src/emitters/template-wrapper.ts`
- Test: `packages/codegen/src/__tests__/emitters/template-wrapper.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { emitTemplateWrapper } from '../../emitters/template-wrapper.ts';

describe('emitTemplateWrapper', () => {
  it('emits a typed template() function for the grammar', async () => {
    const out = await emitTemplateWrapper('rust');
    expect(out).toContain(`export function template<`);
    expect(out).toContain(`SlotNamesOf<S>`);
    expect(out).toContain(`FillHandle<`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @sittir/codegen test template-wrapper
```

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```ts
// packages/codegen/src/emitters/template-wrapper.ts
//
// The emitted template() wrapper enforces slot-name exhaustiveness via a
// CLOSED mapped type (not Record<>). This is what makes Task 6.4's
// @ts-expect-error checks for missing/extra slots actually fire.
//
// Closed:  { [K in SlotNamesOf<S>]: AnyNodeData | string | number }
// Open:    Record<string, AnyNodeData | string | number>      // ❌ extras allowed
//
// Loose-default (no explicit slot types) still allows any AnyNodeData /
// string / number per slot — slot *kinds* aren't narrowed without the
// explicit second type parameter.

export async function emitTemplateWrapper(grammar: string): Promise<string> {
  return `// Auto-generated by @sittir/codegen — do not edit
import { FillHandle } from '@sittir/core';
import type { AnyNodeData } from '@sittir/types';
import type { SlotNamesOf } from '@sittir/types/template-slots';

type DefaultSlotMap<Names extends string> = { [K in Names]: AnyNodeData | string | number };

// Closed mapped-type signature: extras are TS errors, missing keys are TS errors.
//
// The optional tight-typing parameter lives on `.fill<TightSlots>(...)` rather
// than on `template<...>(...)`. Two reasons:
//   1. Callers don't have to supply the source string twice (S is always
//      inferred from the argument; passing it explicitly is redundant).
//   2. Default loose typing on `template()` stays untouched — only callers
//      who want narrowing pay the type-parameter cost.
//
// Usage:
//   template('fn $X() {}').fill({ X: ir.identifier('a') })                  // loose
//   template('fn $X() {}').fill<{ X: Identifier }>({ X: ir.identifier('a') })  // strict
export function template<S extends string>(
  source: S
): {
  fill<Slots extends DefaultSlotMap<SlotNamesOf<S>> = DefaultSlotMap<SlotNamesOf<S>>>(
    slots: Slots
  ): FillHandle<Slots>;
} {
  return {
    fill<Slots extends DefaultSlotMap<SlotNamesOf<S>> = DefaultSlotMap<SlotNamesOf<S>>>(
      slots: Slots
    ): FillHandle<Slots> {
      return new FillHandle<Slots>(source, slots);
    },
  };
}
`;
}
```

- [ ] **Step 4: Wire into CLI `--all` chain (modify `packages/codegen/src/cli.ts`)**

```ts
const wrapperTs = await emitTemplateWrapper(cliArgs.grammar);
writeFileSync(join(outputDir, 'template.ts'), wrapperTs);
```

- [ ] **Step 5: Test passes; commit**

```bash
pnpm --filter @sittir/rust run regenerate
pnpm --filter @sittir/codegen test template-wrapper
git add packages/codegen/src/emitters/template-wrapper.ts packages/codegen/src/__tests__/emitters/template-wrapper.test.ts packages/codegen/src/cli.ts packages/rust/src/template.ts
git commit -m "feat(codegen): per-grammar template() wrapper emitter (Phase 6.2)"
```

#### Task 6.3: Inline template end-to-end test

**Files:**
- Test: `packages/rust/tests/template-inline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { template, ir, createEngine } from '@sittir/rust';

describe('inline template()', () => {
  it('renders fn $NAME() {} with slot values', () => {
    createEngine();
    const out = template('fn $NAME() {}').fill({ NAME: ir.identifier('hello') }).render();
    expect(out).toContain('hello');
  });

  it('caches by source: second call same source uses cache', () => {
    createEngine();
    const t = template('fn $NAME() {}');
    const a = t.fill({ NAME: ir.identifier('a') }).render();
    const b = t.fill({ NAME: ir.identifier('b') }).render();
    expect(a).not.toBe(b);
  });

  it('caller can supply explicit slot types via .fill<...>()', () => {
    createEngine();
    const out = template('fn $NAME() {}')
      .fill<{ NAME: ReturnType<typeof ir.identifier> }>({ NAME: ir.identifier('typed') })
      .render();
    expect(out).toContain('typed');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust test template-inline
```

Expected: PASS — Phases 5 and 6.2 wire everything end-to-end.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/template-inline.test.ts
git commit -m "test(rust): inline template() end-to-end (Phase 6.3)"
```

#### Task 6.4: Type-level test — missing slot is a TS error

**Files:**
- Test: `packages/rust/tests/template-types.test-d.ts`

- [ ] **Step 1: Write the failing type test**

```ts
import { expectTypeOf } from 'vitest';
import { template } from '@sittir/rust';
import { ir } from '@sittir/rust';

// Missing slot — should be a type error
// @ts-expect-error: slot NAME missing
template('fn $NAME() {}').fill({});

// Extra slot — should be a type error
// @ts-expect-error: slot EXTRA not in template
template('fn $NAME() {}').fill({ NAME: ir.identifier('a'), EXTRA: ir.identifier('b') });

// Correct shape — should compile
template('fn $NAME() {}').fill({ NAME: ir.identifier('ok') });
```

- [ ] **Step 2: Run test to verify it passes**

```bash
pnpm --filter @sittir/rust test template-types
```

Expected: PASS — `@ts-expect-error` directives confirm the TS layer catches misuse.

- [ ] **Step 3: Commit**

```bash
git add packages/rust/tests/template-types.test-d.ts
git commit -m "test(rust): type-level checks for inline template misuse (Phase 6.4)"
```

#### Task 6.5: LRU cache hit-rate metric (optional but design §15 risk)

**Files:**
- Modify: `packages/core/src/template/cache.ts`
- Test: `packages/core/src/__tests__/template/cache.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

```ts
it('exposes hit / miss counters for observability', async () => {
  const cache = new TsTemplateCache({ capacity: 4, grammar: 'rust' });
  await cache.getOrCompile('fn $A() {}');
  await cache.getOrCompile('fn $A() {}');  // hit
  await cache.getOrCompile('fn $B() {}');
  expect(cache.stats).toEqual({ hits: 1, misses: 2 });
});
```

- [ ] **Step 2: Implement `stats` accessor**

Add `private hits = 0; private misses = 0;` and increment in `getOrCompile`. Expose via `get stats()`.

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/core test cache
git add packages/core/src/template/cache.ts packages/core/src/__tests__/template/cache.test.ts
git commit -m "feat(@sittir/core): TsTemplateCache hit/miss stats (Phase 6.5)"
```

#### Task 6.6: Re-run validator suite — confirm no regression

**Files:**
- Run: validator

- [ ] **Step 1: Run baseline validator across both backends**

```bash
pnpm run validate:all
```

Expected: PASS at the same baseline as before Chunk 3 started. Render fidelity untouched by template work.

- [ ] **Step 2: Commit (no code change; documentation marker)**

```bash
git commit --allow-empty -m "checkpoint: Phase 6 complete; validator baseline preserved (Phase 6.6)"
```

---

**End of Chunk 3.** At this point: native + TS-side fills both work; parity enforced by fixture corpus + CI; inline `template()` ergonomics shipping; one grammar (Rust) fully covered.

---

## Chunk 4: Phase 7 — Roll out to TypeScript and Python grammars

This chunk applies the proven Phase 1–6 patterns to the other two production grammars. Each grammar follows the same six-step pattern; tasks below are templated.

### Phase 7 — Roll out to TypeScript

#### Task 7.1: Add `templateMode` to `packages/typescript/overrides.ts`

**Files:**
- Modify: `packages/typescript/overrides.ts`
- Test: `packages/codegen/src/__tests__/transpile-template-mode.test.ts` (extend with `'typescript'` cases)

- [ ] **Step 1: Add templateMode block per design §8**

```ts
// packages/typescript/overrides.ts
export const templateMode = {
  _sittir_metavar: ($: any) => token(prec(10, /\$(\.\.\.)?[A-Z][A-Z0-9_]*/)),
  identifier:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _expression: ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _statement:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  // _type may be added in a follow-up if needed
};
```

- [ ] **Step 2: Regenerate**

```bash
pnpm --filter @sittir/typescript run regenerate
```

- [ ] **Step 3: Verify canary parses cleanly + production parser unaffected**

```bash
pnpm --filter @sittir/codegen test transpile-template-mode
pnpm run validate:js
```

- [ ] **Step 4: Commit**

```bash
git add packages/typescript/overrides.ts packages/typescript/.sittir/
git commit -m "feat(typescript): templateMode override block (Phase 7.1)"
```

#### Task 7.2: Author canary snippet + regenerate snippets.ts

**Files:**
- Create: `packages/typescript/snippets/greet.ts.template`

- [ ] **Step 1: Author**

```typescript
// packages/typescript/snippets/greet.ts.template
function $NAME($...PARAMS): $RET {
  $BODY
}
```

- [ ] **Step 2: Regenerate**

```bash
pnpm --filter @sittir/typescript run regenerate
```

- [ ] **Step 3: Verify `packages/typescript/src/snippets.ts` exists, type-checks, and shipping snippet renders**

```bash
pnpm --filter @sittir/typescript test snippets
```

- [ ] **Step 4: Commit**

```bash
git add packages/typescript/snippets/ packages/typescript/src/snippets.ts packages/typescript/src/template.ts
git commit -m "feat(typescript): canary snippet + regenerated snippets.ts (Phase 7.2)"
```

#### Task 7.3: Add TypeScript fixtures to parity corpus

**Files:**
- Create: `packages/codegen/__tests__/template-parity/fixtures/ts-001-trivial-let-binding/...` (mirror Rust's 10 fixtures)
- Modify: `packages/codegen/__tests__/template-parity/harness.ts` (multi-grammar)

- [ ] **Step 1: Author 5 representative TS fixtures** (smaller set for the new grammar; cover trivial / supertype / multi / optional / polymorph categories)

- [ ] **Step 2: Update `harness.ts` to read the grammar from each fixture's metadata**

```ts
// fixture metadata.json
{ "grammar": "typescript" }
```

- [ ] **Step 3: Run parity suite**

```bash
pnpm --filter @sittir/codegen test parity
```

Expected: PASS for all fixtures.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/__tests__/template-parity/fixtures/ts-* packages/codegen/__tests__/template-parity/harness.ts
git commit -m "test(codegen): TypeScript parity fixtures (Phase 7.3)"
```

### Phase 7 — Roll out to Python (mirror tasks)

#### Task 7.4: Add `templateMode` to `packages/python/overrides.ts`

**Files:**
- Modify: `packages/python/overrides.ts`

- [ ] **Step 1: Add templateMode block**

```ts
// packages/python/overrides.ts
export const templateMode = {
  _sittir_metavar: ($: any) => token(prec(10, /\$(\.\.\.)?[A-Z][A-Z0-9_]*/)),
  identifier:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _expression: ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
  _statement:  ($: any, original: any) => choice(prec(10, $._sittir_metavar), original),
};
```

- [ ] **Step 2: Regenerate, verify, commit**

```bash
pnpm --filter @sittir/python run regenerate
pnpm --filter @sittir/codegen test transpile-template-mode
pnpm run validate:js
git add packages/python/overrides.ts packages/python/.sittir/
git commit -m "feat(python): templateMode override block (Phase 7.4)"
```

#### Task 7.5: Author Python canary snippet

**Files:**
- Create: `packages/python/snippets/greet.py.template`

```python
# packages/python/snippets/greet.py.template
def $NAME($...PARAMS):
    $BODY
```

- [ ] **Step 1: Author + regenerate + test**

```bash
pnpm --filter @sittir/python run regenerate
pnpm --filter @sittir/python test snippets
```

- [ ] **Step 2: Commit**

```bash
git add packages/python/snippets/ packages/python/src/snippets.ts packages/python/src/template.ts
git commit -m "feat(python): canary snippet + regenerated snippets.ts (Phase 7.5)"
```

#### Task 7.6: Add Python fixtures + final parity suite green

**Files:**
- Create: `packages/codegen/__tests__/template-parity/fixtures/py-*` (5 fixtures)

- [ ] **Step 1: Author Python fixtures (mirror representative subset)**

- [ ] **Step 2: Run full parity suite across all three grammars**

```bash
pnpm run test:parity
```

Expected: PASS — all categories, all grammars.

- [ ] **Step 3: Final validator pass**

```bash
pnpm run validate:all
```

Expected: PASS at baseline.

- [ ] **Step 4: Commit**

```bash
git add packages/codegen/__tests__/template-parity/fixtures/py-*
git commit -m "test(codegen): Python parity fixtures; full suite green (Phase 7.6)"
```

### Phase 7 — per-grammar Rust crates and engine registration

The four tasks below are required per grammar to make `templateRender` available on the per-grammar engine. **Ordering:** Task 7.7 must complete before Task 7.2 (TS canary requires `templateRender` to render); Task 7.8 must complete before any TS-side code calls `template()` for TypeScript. Same dependency for Python (7.9 before 7.5; 7.10 before any Python template use).

#### Task 7.7: `template_napi.rs` for `sittir-typescript` crate

**Files:**
- Create: `rust/crates/sittir-typescript/src/template_napi.rs`
- Modify: `rust/crates/sittir-typescript/src/lib.rs`
- Test: `packages/typescript/tests/template-napi.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/typescript/tests/template-napi.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/typescript';

describe('TypeScript template_napi', () => {
  it('renders function $NAME() {} via native templateRender', () => {
    const engine = createEngine();
    if (!('templateRender' in engine)) throw new Error('native templateRender missing');
    const out = (engine as any).templateRender('function $NAME() {}', {
      NAME: ir.identifier('hello'),
    });
    expect(out).toContain('hello');
  });
});
```

- [ ] **Step 2: Mirror the Rust grammar's napi entry from Task 4.2**

```rust
// rust/crates/sittir-typescript/src/template_napi.rs
// Identical structure to rust/crates/sittir-rust/src/template_napi.rs (Task 4.2).
// The only differences are:
//   - impl block targets `crate::SittirTypescriptEngine`
//   - the engine's template_language is loaded from the typescript template-parser.wasm

use napi::{Env, JsObject, Result};
use napi_derive::napi;
use sittir_core::node_data::NodeData;
use sittir_core::template::TemplateBuilder;

#[napi]
impl crate::SittirTypescriptEngine {
    #[napi]
    pub fn template_read(&mut self, env: Env, source: String, slots: JsObject) -> Result<JsObject> {
        let lang = self.engine.template_language()
            .ok_or_else(|| napi::Error::from_reason("template language unavailable"))?
            .clone();
        let compiled = self.engine.template_cache().get_or_compile(&source, &lang)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        let slot_map = decode_slots_napi(env, slots)?;
        let node_data = TemplateBuilder::new(&compiled).build(&slot_map)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        node_data.to_napi_object(env)
    }

    #[napi]
    pub fn template_render(&mut self, env: Env, source: String, slots: JsObject) -> Result<String> {
        let lang = self.engine.template_language()
            .ok_or_else(|| napi::Error::from_reason("template language unavailable"))?
            .clone();
        let compiled = self.engine.template_cache().get_or_compile(&source, &lang)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        let slot_map = decode_slots_napi(env, slots)?;
        let node_data = TemplateBuilder::new(&compiled).build(&slot_map)
            .map_err(|e| napi::Error::from_reason(format!("{}", e)))?;
        Ok(self.engine.render_node_data(&node_data))
    }
}

// `decode_slots_napi` is the same body as Task 4.2 — extract to sittir-core if
// the duplication is annoying, but it's tiny and self-contained per crate.
```

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/typescript run regenerate
pnpm --filter @sittir/typescript test template-napi
git add rust/crates/sittir-typescript/src/template_napi.rs rust/crates/sittir-typescript/src/lib.rs packages/typescript/tests/template-napi.test.ts
git commit -m "feat(sittir-typescript): napi template_read/render (Phase 7.7)"
```

#### Task 7.8: TypeScript engine registers template backend

**Files:**
- Modify: `packages/typescript/src/engine.ts`
- Test: `packages/typescript/tests/template-inline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/typescript/tests/template-inline.test.ts
import { describe, expect, it } from 'vitest';
import { template, ir, createEngine } from '@sittir/typescript';

describe('TypeScript inline template()', () => {
  it('renders function $NAME() {} via the registered native backend', () => {
    createEngine();
    const out = template('function $NAME() {}').fill({ NAME: ir.identifier('hi') }).render();
    expect(out).toContain('hi');
  });
});
```

- [ ] **Step 2: Mirror Task 4.3 + 5.5 in the TypeScript engine**

```ts
// packages/typescript/src/engine.ts (extend per Tasks 4.3 + 5.5)
import { createTsTemplateBackend, setActiveTemplateBackend } from '@sittir/core';

export function createEngine(options?: EngineOptions): SittirEngineLike {
  const engine = createNativeEngine(...) ?? createJsEngine(...);
  if ('templateRender' in engine && process.env.SITTIR_BACKEND !== 'js') {
    setActiveTemplateBackend({
      fillRead:   (s, slots) => (engine as any).templateRead(s, slots),
      fillRender: (s, slots) => (engine as any).templateRender(s, slots),
    });
  } else {
    setActiveTemplateBackend(createTsTemplateBackend({
      grammar: 'typescript',
      renderNode: (node) => engine.render(node).text(),
    }));
  }
  return engine;
}
```

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/typescript test template-inline
git add packages/typescript/src/engine.ts packages/typescript/tests/template-inline.test.ts
git commit -m "feat(typescript): register native template backend on engine init (Phase 7.8)"
```

#### Task 7.9: `template_napi.rs` for `sittir-python` crate

**Files:**
- Create: `rust/crates/sittir-python/src/template_napi.rs`
- Modify: `rust/crates/sittir-python/src/lib.rs`
- Test: `packages/python/tests/template-napi.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/python/tests/template-napi.test.ts
import { describe, expect, it } from 'vitest';
import { createEngine, ir } from '@sittir/python';

describe('Python template_napi', () => {
  it('renders def $NAME(): pass via native templateRender', () => {
    const engine = createEngine();
    if (!('templateRender' in engine)) throw new Error('native templateRender missing');
    const out = (engine as any).templateRender('def $NAME():\n    pass\n', {
      NAME: ir.identifier('hello'),
    });
    expect(out).toContain('hello');
  });
});
```

- [ ] **Step 2: Mirror Task 7.7's pattern for `SittirPythonEngine`**

```rust
// rust/crates/sittir-python/src/template_napi.rs
// Same structure as Tasks 4.2 / 7.7; impl block targets crate::SittirPythonEngine.
// (Body identical — copy from Task 7.7 and rename the engine type.)
```

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/python run regenerate
pnpm --filter @sittir/python test template-napi
git add rust/crates/sittir-python/src/template_napi.rs rust/crates/sittir-python/src/lib.rs packages/python/tests/template-napi.test.ts
git commit -m "feat(sittir-python): napi template_read/render (Phase 7.9)"
```

#### Task 7.10: Python engine registers template backend

**Files:**
- Modify: `packages/python/src/engine.ts`
- Test: `packages/python/tests/template-inline.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/python/tests/template-inline.test.ts
import { describe, expect, it } from 'vitest';
import { template, ir, createEngine } from '@sittir/python';

describe('Python inline template()', () => {
  it('renders def $NAME(): pass via the registered native backend', () => {
    createEngine();
    const out = template('def $NAME():\n    pass\n').fill({ NAME: ir.identifier('hi') }).render();
    expect(out).toContain('hi');
  });
});
```

- [ ] **Step 2: Mirror Task 7.8's engine wiring in the Python engine**

```ts
// packages/python/src/engine.ts — same shape as Task 7.8, with grammar: 'python'.
```

- [ ] **Step 3: Test passes; commit**

```bash
pnpm --filter @sittir/python test template-inline
git add packages/python/src/engine.ts packages/python/tests/template-inline.test.ts
git commit -m "feat(python): register native template backend on engine init (Phase 7.10)"
```

### Updated Phase 7 task ordering

With 7.7–7.10 added, Phase 7 task order is:

```
Phase 7 — TypeScript:
  7.1 (TS override)  →  7.7 (TS napi crate)  →  7.8 (TS engine register)  →  7.2 (TS canary)  →  7.3 (TS fixtures)

Phase 7 — Python:
  7.4 (Python override)  →  7.9 (Python napi)  →  7.10 (Python engine register)  →  7.5 (Python canary)  →  7.6 (Python fixtures)
```

Tasks within each grammar can run sequentially; the two grammars are independent of each other and can interleave.

---

## Completion checklist

When all 7 phases land:

- [ ] `pnpm test` green across all packages
- [ ] `pnpm -r run type-check` green
- [ ] `pnpm run test:parity` green for Rust + TypeScript + Python
- [ ] `pnpm run validate:all` at baseline (no render-fidelity regression)
- [ ] One canary snippet per grammar renders byte-identical
- [ ] One inline `template('...')` per grammar renders correctly
- [ ] CI gates the parity suite on PRs touching `template/`

## Out of scope reminders (per design §1)

This plan does not include:

- Pattern matching / `template.match()` (lives in ADR-0023's typed query API).
- Build-time inline-template extraction (loose-default + opt-in type parameter is the API).
- In-template slot kind narrowing (`$NAME<Identifier>`).
- Fill-time slot value validation (TS is the validation layer).
- Render-pipeline changes (FillHandle.render() calls existing render path).

If pressure mounts to add any of the above mid-implementation, treat it as a new spec, not a scope expansion of this plan.

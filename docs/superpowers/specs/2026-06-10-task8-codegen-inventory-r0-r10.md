# Task #8 — `packages/codegen/src` work inventory vs R0–R10 (read-only)

> **Status: INVENTORY — review input for the R-rows, not a green-light.**
> Companion to the proposal `2026-06-10-principle14-sweep-and-module-reorg-proposal.md`
> (PR #75 @ 391fc44c). Measured against `origin/master` (339e1709; code identical
> to the proposal branch's base 2297d242 — the delta is docs-only). All numbers
> are reproducible: the inventory script is in Appendix A.

---

## 0. Methodology + caveats

- **Function inventory** — a TypeScript-compiler-API walk over every non-test
  `.ts` in `packages/codegen/src` (excludes `__tests__/`, `*.d.ts`; `*.test.ts`
  excluded from aggregates). It records `function` declarations, exported
  arrow-consts, and **class methods/getters** — so per-module totals are HIGHER
  than the proposal §1 numbers, which counted `function` declarations only
  (e.g. node-map 158 here vs 93 there; the extra 65 are mostly `NodeMap`-family
  methods/getters, most of which are already conforming-by-getter). This script
  is effectively the **R0 classifier prototype**.
- **#14 buckets** — `conforming` = 2nd param's type name ends in `Ctx`;
  `getter-candidate` = exactly 1 param; `zero-param`; `non-conforming` = rest.
- **Dead-code first pass** — whole-repo identifier tokenization (every
  `packages/**` non-dist `.ts`): a symbol is a candidate when it has zero
  occurrences outside its defining file. Catches dynamic/string-adjacent uses
  that import-graph analysis misses; same-name collisions across files make it
  CONSERVATIVE (under-reports dead). Split into truly-dead / dead-with-tests /
  un-export by also counting in-file uses.
- **⚠ LSP verification attempted, POSITIVE CONTROL FAILED.** `lsproxy
  textDocument references` was run for all 27 dead-function candidates
  (`--no-proxy` one-shot; proxy daemon would not start, 5s socket timeout) and
  returned 0 cross-file refs for every one — but the control symbol
  `validateReadRenderParse` (known importer: `emitters/parity-fixtures.ts`)
  ALSO returned only its own declaration. One-shot sessions are returning
  same-file results only. **The dead list below therefore rests on the
  tokenization pass; the lsproxy re-verification demanded by gate item 5 is
  still owed at R8 execution time** (with a properly indexed daemon session).
- **Importer map** — static `from '…'` imports; dynamic `await import(…)`
  found separately (3 sites, all listed in §5 — they matter for R9).

Corpus: **116 non-test files, ~68.5k LOC** — compiler/35, emitters/32, dsl/14,
validate/11, scripts/12, grammar-shapes/5, scm/2, transpile/2, top-level/3.

---

## 1. #14 conformance (per pipeline module)

| module | total fns | conforming | getter-candidate | zero-param | non-conforming |
|---|---|---|---|---|---|
| `compiler/normalize.ts` | 29 | 6 | 8 | 0 | **15** |
| `compiler/simplify.ts` | 38 | 2 | 24 | 2 | **10** |
| `compiler/evaluate.ts` | 70 | 0 | 33 | 1 | **36** |
| `compiler/link.ts` | 70 | 1 | 34 | 0 | **35** |
| `compiler/assemble.ts` | 36 | 1 | 14 | 0 | **21** |
| `compiler/node-map.ts` | 158 | 0 | 129 | 7 | **22** |
| `compiler/transforms.ts` | 7 | 0 | 4 | 0 | **3** |
| compiler/* other (27 files) | 182 | 0 | 106 | 7 | **69** |
| **compiler/ total** | **590** | **10** | **352** | **17** | **211** |

**Key correction to the proposal's sizing fears:** node-map is NOT the
highest-conversion row. 129 of its 158 fns are single-param/getters already in
(or one step from) the getter shape #14 wants; the `(target, ctx)` conversion
surface is **22**, not 93. The real sweep mass is evaluate (36) + link (35) +
assemble (21) + the 69 spread across the 27 satellite compiler files.

**Loose-arg recurrence in non-conforming compiler fns (top):** `rule` ×77,
`rules` ×55, `kindEntries` ×11, `name`/`kind`/`provenanceByKind`/`supertypes`
×10 each, `opts`/`ownerKind` ×8, `externals`/`refs` ×7. **95** compiler fns
have 3+ params and no ctx (the proposal's "~41" was function-declarations
only). `rule` as lead param is fine (it IS the target); `rules`,
`kindEntries`, `provenanceByKind`, `supertypes`, `externals` are exactly what
the phase ctxs absorb.

---

## 2. Module-org map (file → destination under the per-phase axis)

### compiler/ — pipeline modules (stay, absorb their satellites)

| file | LOC | destination / rationale |
|---|---|---|
| normalize / simplify / evaluate / link / assemble / node-map | 1046/1292/2475/2311/1476/3938 | the six phase modules; node-map = model container per §2.0 |
| `transforms.ts` | 322 | → `dsl/` per R3 — **but see §5: its only imports are compiler/rule-types + rule + diagnostics; the type layer must move first or with it** |

### compiler/ — satellites (27 files; destination from the reverse-import map)

| file | LOC | imported by | destination |
|---|---|---|---|
| `collect-slots.ts` | 514 | node-map, generate | node-map orbit → model-build (tension 2) |
| `template-walker.ts` | 90 | collect-slots only | fold into collect-slots (R7) |
| `field-shape.ts` | 60 | node-map only | fold into node-map (R7) |
| `opaque-facts.ts` | 36 | node-map, validate/common | model layer; validate edge dissolves with R9 split |
| `group-synthesis.ts` | 489 | link only | fold into link (R7; regrowth tension 1) |
| `lift-separators.ts` | 172 | link only | fold into link (R7) |
| `link-refine.ts` | 354 | link + **emitters/refine-emit** | link orbit — a live tension-3 case (phase+emitter consumer) |
| `list-fusion.ts` | 159 | simplify, wrapper-deletion | fold into simplify (R7) |
| `rule-catalog.ts` | 313 | evaluate + 4 others | evaluate orbit |
| `rule-attrs.ts` | 112 | normalize, simplify + 2 | cross-phase → R3 destination (confirmed: the lead's tension-4 example IS cross-phase) |
| `wrapper-deletion.ts` | 299 | normalize, simplify, assemble, node-map + **emitters/templates** | cross-phase shared op — same family as transforms.ts; moves WITH the R3 decision; also tension-3 (emitter consumer) |
| `rule.ts` | 542 | **all 6 phases** + 28 others | THE type layer (see §5 — R3's linchpin) |
| `rule-types.ts` | 38 | all 6 phases + 19 others | type layer, moves with rule.ts |
| `diagnostics.ts` | 120 | assemble + 11 others incl. dsl | cross-phase sink — moves with type layer or stays; R3 decision |
| `types.ts` | 573 | 4 phases + 39 others | cross-phase type bag — candidate to SPLIT: phase-owned types into phase modules, core into the type layer |
| `generated-metadata.ts` | 558 | assemble, link, node-map + 18 (emitters, validate) | model/shared; NOTE it imports `validate/common` (`loadWebTreeSitter`) — R9 split dependency |
| `diagnose-slot-grouping.ts` | 353 | simplify, generate, grammar-diagnostics | diagnostics cluster (propose-* family) — stays |
| `diagnose-derive-shapes.ts` / `diagnose-parsekind-collisions.ts` / `diagnose-content-alias-injectivity.ts` | 130/111/54 | grammar-diagnostics (+assemble/node-map) | diagnostics cluster — stays |
| `grammar-diagnostics.ts` | 168 | run-codegen | diagnostics cluster aggregator — stays |
| `slot-count.ts` | 132 | diagnose-slot-grouping | diagnostics cluster — stays |
| `scc.ts` | 295 | generate, types + emitters/transport-common | shared util |
| `common.ts` | 111 | assemble + **emitters/templates** | tension-3 case — cross-axis |
| `generate.ts` | 412 | index, run-codegen | pipeline driver — stays |
| `emit-gate.ts` | 32 | generate only | fold into generate (R7) |
| `resolve-grammar.ts` | 45 | generate, run-codegen, scripts | top-level infra — stays |
| `trace.ts` | 75 | generate only | infra — stays (or folds into generate) |

### emitters/ (32 files, 21.5k LOC) — emitter axis, unchanged by the phase principle

R5 splits render-module (4846) along transport/dispatch seams as proposed.
Boundary notes: `render-module-runner.ts` (64) — its ONLY importer is
`scripts/regen-templates-rs.ts` (an R9 boundary case);
`parity-fixtures.ts` (147) has **zero static importers** — it is
dynamically imported by `run-codegen.ts:479` (R9 must not classify it dead or
tool-side; it runs at codegen time). Everything else stays per
emitter-pattern-consistency. `kind-discriminant.ts` (253, 12 importers) and
`shared.ts` (1288) are the legitimate emitter-shared layer.

### dsl/ (14 files, 6.5k LOC) — destination layer, stays

Whales for context: enrich 1784, wire/wire 1462, transform/transform 1124,
transform/transform-path 985. NOTE: R3's "name vs existing `dsl/transform/`"
collision flagged in the proposal is real — `dsl/transform/` is the
override-transform module family, unrelated to `compiler/transforms.ts`.

### grammar-shapes/ (5 files, 10.5k LOC) — type layer adjacent to dsl, stays

`grammar-shape.rust.ts` is 9658 LOC of pure types (0 fns, 3% comments) — a
typed grammar twin, not code to sweep. Excluded from R10 sizing.

### validate/ (11 files, 6.5k LOC) — R9, per-file

| file | LOC | R9 disposition |
|---|---|---|
| `common.ts` | 2570 | **SPLIT**: engine/parser loading (`loadWebTreeSitter`, `loadNativeEngineForGrammar`, freshness guard) is codegen infrastructure consumed by compiler/generated-metadata + transpile/compile-parser — STAYS; nodeToConfig/validation half MOVES |
| `node-types-loader.ts` | 62 | STAYS (imported by emitters/types + emitters/grammar) |
| `renderable.ts` | 229 | STAYS or splits (run-codegen calls `validateRenderableFromNodeMap` at emit time) |
| `read-render-parse.ts` | 808 | MOVES, in-row: parity-fixtures dynamic import + its own dynamic import of `scripts/collect-baseline` must be cut first |
| factory-render-parse 998 · from 434 · read-projection 409 · template-coverage 677 · node-types 171 · rule-lookup 91 · templates-path 86 | | MOVE |

### scripts/ (12 files, 2.3k LOC) — R9, partitioned

**STAY (codegen-run infrastructure):** `generated-manifest.ts` 413 (the
manifest stamp IS the codegen run; imported by run-codegen + validate/common),
`emit-diff.ts` 232 (run-codegen), `native-binary-freshness.ts` 93
(validate/common), `regen-templates-rs.ts` 89 (imports emitters — a regen
entry point).
**MOVE (dev tools):** check-baseline-regression 636, collect-baseline 501
(⚠ `read-render-parse.ts` dynamic-imports `loadBoundaryRender` from it —
split that symbol out first), reconcile-naming 215, probe-factory-rt 47,
probe-rule 29, rt-breakdown 24, verify-manifests-cli 16 (**pre-commit hook
references this path**), list-pattern-kinds 13.
**Path re-pointing owed:** `.github/workflows/ci.yml` invokes
`codegen/src/scripts/…` at lines 112/116/190/194/247; pre-commit references
verify-manifests-cli. Also §3 of the proposal births `propose-14.ts` in
`codegen/src/scripts/` — R9 relocates that directory; birth it tools-side or
note the move.

### scm/ · transpile/ · top-level — stay

scm/ (935) is alive (generate, ir, emit import it) but carries 2 dead exports
(§3). transpile/ (358) is alive via run-codegen; `loadOverrideParser` is dead;
`compile-parser.ts` imports `validate/common`'s loader half (R9 split). Top
level: run-codegen 755, index 18, polymorph-variant 34 — stays.

---

## 3. Dead-code inventory (tokenization-verified; lsproxy re-verification owed — §0)

**Truly dead functions — zero refs anywhere, including own file (16):**

| file | symbols |
|---|---|
| `compiler/rule.ts` | `isDedent` `isIndent` `isNewline` `isPattern` `isSupertype` `isToken` — a closed family of 6 unused type guards |
| `compiler/diagnose-slot-grouping.ts` | `buildPolymorphSkipSetFromRules` |
| `compiler/node-map.ts` | `deriveMergedSlotCardinality` |
| `emitters/from.ts` | `emitFrom` |
| `emitters/transport-projection.ts` | `resolveTransportReferenceKind` |
| `scm/extract-roles.ts` | `printRoleDiagnostic` |
| `transpile/compile-parser.ts` | `loadOverrideParser` |
| `validate/common.ts` | `loadWrapNode` |
| `grammar-shapes/` | `PatternNode` `StringNode` (grammar-json), `_ResolveDecr` (grammar-twin) — type-only |

**Dead-with-tests — no production refs, kept alive only by their own tests (17):**
`assemble.ts::nameField` (7 test refs), `generated-metadata.ts::deriveGeneratedMetadata` (4),
`node-map.ts::applySelfDelimitedJoinOverrides` (2), `normalize.ts::needsSpace` (5),
`rule-catalog.ts::createEmptyRuleCatalog` (6), `wire.ts::getCurrentWireContext` (6) +
`withWireContext` (14), `render-module.ts::hasSingularNativeChildrenTransport` (3),
`templates.ts::emitPolymorphTemplate` (7), **`wrap.ts::emitWrap` (20)**,
`extract-roles.ts::extractTriviaRoles` (7), `node-types.ts::formatNodeTypesValidationReport` (2)
+ `validateAgainstNodeTypes` (2), `renderable.ts::validateRenderable` (2),
`diagnostics.ts::AnyDiagnostic` (2), `path-type.ts::IsValidPath` (13) + `PreciseKeys` (5).
Deleting these deletes their test blocks too.

**Closed subgraph (the #71 pattern):** `emit.ts` drives emission through the
`FromEmitter` / `WrapEmitter` / `FactoryEmitter` **classes**; the standalone
`emitFrom` (truly dead) and `emitWrap` (20 test refs and nothing else) are the
superseded pre-class entry points. `emitWrap`'s 20 test references are tests
of a dead code path.

**Type-only zero-ref exports (~70)** — interfaces/type aliases never imported
(EmitXxxConfig family ×16, grammar-json node types, etc.): deletion or
un-export, near-zero risk.

**Un-export candidates (180)** — exported but referenced only inside their own
file. Not dead; hygiene (`export` keyword removal). Counted so R8 doesn't
mistake them for deletable.

---

## 4. Comment hotspots (R10)

Per-subdir density (comment lines / LOC): **compiler 7394/19.1k (38%) ·
dsl 2914/6.5k (44%) · emitters 6560/21.5k (30%) · validate 1809/6.5k (27%) ·
top-level 307/810 (37%)** — ~20.3k comment lines total (grammar-shapes' 3%
excluded as type-twin).

Top files: node-map 1698 (43%) · render-module 1382 (28%) · evaluate 1052
(42%) · templates 831 (44%) · **wire/wire 800 (54%)** · factories 774 (37%) ·
link 762 (32%) · from 744 (32%) · enrich 672 (37%) · simplify 624 (48%) ·
validate/common 608 (23%) · assemble 566 (38%) · emitters/types 547 (34%) ·
emitters/shared 484 (37%) · dsl/transform/transform 474 (42%).

Top functions (lead+body comment lines): `runCodegen` 153 ·
`buildTypedTemplateBody` 110 · `emitSymbol` 106 · `emitRule` 99 ·
`generate` 93 · `wire` 90 · `emitIs` 90 · `validateReadRenderParse` 84 ·
`emitHoistedPolymorphFormFactory` 86 · `inlineRefs` 75.

**R10 caveat confirmed in the data:** the four biggest emitter hotspots
(render-module, templates, factories, from) interleave TS-side comments with
template-literal content — comments INSIDE the emitted strings are generated
bytes. Emitter-touching prunes need the regen byte-identical gate (R5's).

---

## 5. Dependency-direction risks (exact edges)

**(a) `dsl → compiler` — ALREADY 9 edges across 7 files today** (tension 4 is
not hypothetical):

| dsl file | imports from compiler/ |
|---|---|
| `runtime-shapes.ts:56` | type {ChoiceRule, FieldRule, OptionalRule, Rule, SeqRule, StringRule, SymbolRule} ← rule.ts |
| `enrich.ts:62` | type {Rule} ← rule.ts |
| **`enrich.ts:63`** | **VALUE import: `{ sym }` ← evaluate.ts** — a runtime dependency on a PHASE module, the worst edge of the set |
| `primitives/field.ts:26` | type {Rule} ← rule.ts |
| `primitives/alias.ts:25` | type {Rule} ← rule.ts |
| `primitives/role.ts:32-33` | type {Rule} ← rule.ts; type {ExternalRole} ← types.ts |
| `wire/wire.ts:36,45` | type {PolymorphVariant} ← types.ts; type {Rule} ← rule.ts |

Pattern: **everything except `sym` is a type-import of the Rule layer.** The
R3 move is implementable iff `rule.ts` + `rule-types.ts` (+ a Rule-level
diagnostics seam) relocate to dsl/ — which simultaneously erases 8 of the 9
existing inversions and makes the proposal's "DSL defines the Rule types"
rationale true. The `sym` value-import needs its own fix (move `sym` to the
Rule layer or invert).

`transforms.ts` own imports: `rule-types.ts`, `rule.ts`, `diagnostics.ts` —
nothing else. `TransformCtx` is declared in-file and moves free.

**(b) `codegen-core → validate/ | scripts/` — 7 static + 3 dynamic edges** (R9):

static — run-codegen → validate/renderable, scripts/generated-manifest,
scripts/emit-diff; emitters/parity-fixtures → validate/read-render-parse;
compiler/generated-metadata → validate/common (loadWebTreeSitter);
transpile/compile-parser → validate/common (loadWebTreeSitter);
emitters/types + emitters/grammar → validate/node-types-loader.
dynamic — run-codegen:479 → emitters/parity-fixtures;
validate/read-render-parse:408 → scripts/collect-baseline
(`loadBoundaryRender`); validate/common:1303 → scripts/generated-manifest.

**(c) `tools → codegen` today:** 1 static edge (`tools/src/discover/pipeline.ts`)
— the existing direction R9 must not close into a cycle.

**(d) Infra path couplings:** ci.yml ×5 sites + pre-commit
(verify-manifests-cli) reference `codegen/src/scripts/…` paths.

---

## 6. Prioritized work-list (rows → concrete work, rough size)

| row | concrete work from this inventory | size |
|---|---|---|
| **R0** | Productionize the §0 inventory script as `propose-14.ts` (buckets already implemented: conforming/getter/zero-param/non-conforming + the dead pass); add the committed baseline + ratchet wiring. Decide its home re: R9 (§2 scripts note) | **S** — prototype exists |
| **R2** | evaluate: 36 non-conforming, the `rules`×55 plumbing epicenter | **M** |
| **R4** | link 35 + assemble 21 | **M** |
| **R1** | node-map: only 22 conversions (+7 zero-param to leave); declare the 129 getters conforming in the baseline | **S–M** (downgraded from the proposal's fear) |
| **R3** | simplify 10 + normalize 15 + transforms 3, **gated on the type-layer decision**: move rule.ts+rule-types.ts(+diagnostics seam) to dsl/ WITH transforms (erases 8/9 existing inversions, §5a) or keep transforms compiler-side; fix the `sym` value-import either way; rule-attrs + wrapper-deletion accompany the decision | **M** + 1 user decision |
| **R5** | render-module split as proposed; transport seam ≈ the VerbatimTransport/enum/leaf-impl block, dispatch seam ≈ buildTypedTemplateBody+per-kind fns | **M** |
| **R6** | node-map 3938 → container; orbit files collect-slots/field-shape/opaque-facts per §2 | **M** |
| **R7** | fold list (single-phase satellites): emit-gate→generate, list-fusion→simplify, lift-separators+group-synthesis+link-refine→link (link grows 2311→~3.4k: tension 1 made concrete), template-walker→collect-slots, field-shape→node-map; tension-3 cases (common.ts, wrapper-deletion, link-refine) held for the user | **M** |
| **R8** | 16 truly-dead fns + 17 dead-with-tests (incl. the emitFrom/emitWrap closed subgraph and rule.ts's 6-guard family) + ~70 dead types + 180 un-exports; **lsproxy re-verification REQUIRED first** (§0 control failure) | **S–M** |
| **R9** | validate+scripts partition per §2 tables; resolve the 10 §5b edges (common.ts split is the keystone — it serves generated-metadata + compile-parser from the loader half); repoint ci.yml ×5 + pre-commit | **L** — riskiest row |
| **R10** | ~20.3k comment lines; top-15 files carry ~11.5k; emitter-hotspot prunes need the byte-identical gate (§4) | **M**, amortized into R1–R4 |

Suggested order refinement from the data: R0 → R2 (biggest plumbing win) →
R1/R4 → R3 (decision-gated) → R5–R7 → R9 → R8 → R10 throughout.

---

## Appendix A — the inventory script (R0 classifier prototype)

Run from the repo root: `pnpm exec tsx <script> > inventory.json`

```ts
// task8: read-only inventory of packages/codegen/src for the R0-R10 work-inventory report.
// Emits JSON: per-function classification (#14), per-file comment metrics, exported-symbol table.
import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd(), 'packages/codegen/src');

function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e === '__tests__' || e === 'node_modules') continue;
      out.push(...listTs(p));
    } else if (e.endsWith('.ts') && !e.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

interface FnRec {
  file: string;
  name: string;
  kind: 'function' | 'method' | 'getter' | 'arrow-const';
  exported: boolean;
  params: { name: string; type: string }[];
  loc: number;
  leadingCommentLines: number;
  bodyCommentLines: number;
  bucket: 'conforming' | 'getter-candidate' | 'zero-param' | 'non-conforming';
}

interface FileRec {
  file: string;
  loc: number;
  commentLines: number;
  fnCount: number;
}

const fns: FnRec[] = [];
const files: FileRec[] = [];
const exportedSymbols: { file: string; name: string }[] = [];

function classify(params: { name: string; type: string }[]): FnRec['bucket'] {
  if (params.length === 0) return 'zero-param';
  if (params.length === 1) return 'getter-candidate';
  if (params.length >= 2 && /Ctx$/.test(params[1].type)) return 'conforming';
  return 'non-conforming';
}

function countCommentLines(text: string): number {
  let n = 0;
  let inBlock = false;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (inBlock) {
      n++;
      if (t.includes('*/')) inBlock = false;
    } else if (t.startsWith('//')) {
      n++;
    } else if (t.startsWith('/*')) {
      n++;
      if (!t.includes('*/')) inBlock = true;
    }
  }
  return n;
}

for (const path of listTs(ROOT)) {
  const rel = relative(ROOT, path);
  const text = readFileSync(path, 'utf8');
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const fileLoc = text.split('\n').length;
  files.push({ file: rel, loc: fileLoc, commentLines: countCommentLines(text), fnCount: 0 });
  const fileRec = files[files.length - 1];

  const record = (
    name: string,
    kind: FnRec['kind'],
    node: ts.SignatureDeclaration,
    exported: boolean,
  ) => {
    const params = node.parameters.map((p) => ({
      name: p.name.getText(sf),
      type: p.type ? p.type.getText(sf).split('<')[0] : '',
    }));
    const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
    const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line;
    const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
    const leading = ranges.reduce(
      (a, r) => a + text.slice(r.pos, r.end).split('\n').length,
      0,
    );
    const bodyText = node.getText(sf);
    fns.push({
      file: rel,
      name,
      kind,
      exported,
      params,
      loc: end - start + 1,
      leadingCommentLines: leading,
      bodyCommentLines: countCommentLines(bodyText),
      bucket: kind === 'getter' ? 'getter-candidate' : classify(params),
    });
    fileRec.fnCount++;
  };

  const hasExport = (node: ts.Node): boolean =>
    !!(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      record(node.name.text, 'function', node, hasExport(node));
    } else if (ts.isVariableStatement(node)) {
      const exported = hasExport(node);
      for (const d of node.declarationList.declarations) {
        if (
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)) &&
          ts.isIdentifier(d.name)
        ) {
          record(d.name.text, 'arrow-const', d.initializer, exported);
        }
      }
    } else if (ts.isClassDeclaration(node) && node.name) {
      const cls = node.name.text;
      for (const m of node.members) {
        if (ts.isMethodDeclaration(m) && m.body && ts.isIdentifier(m.name)) {
          record(`${cls}.${m.name.text}`, 'method', m, false);
        } else if (ts.isGetAccessorDeclaration(m) && ts.isIdentifier(m.name)) {
          record(`${cls}.${m.name.text}`, 'getter', m, false);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // exported symbol table for dead-code first pass
  const collectExports = (node: ts.Node) => {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      hasExport(node)
    ) {
      exportedSymbols.push({ file: rel, name: node.name.text });
    } else if (ts.isVariableStatement(node) && hasExport(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) exportedSymbols.push({ file: rel, name: d.name.text });
      }
    }
    ts.forEachChild(node, collectExports);
  };
  collectExports(sf);
}

console.log(JSON.stringify({ fns, files, exportedSymbols }, null, 1));
```

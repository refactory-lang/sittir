# Lingering-Debt Inventory — Research Report

**Date:** 2026-07-02 · **Tree:** master @ `a20889c0` · **Author:** read-only research agent

**Scope:** tech debt of one specific kind — code whose *enabling* removal change already
landed but whose removal never happened. For each item: who still reads it (file:line),
whether any read drives behavior, and a verdict:

- **REMOVE-NOW** — zero readers, or every reader is itself dead / trivially migratable
  inside the same PR.
- **REMOVE-AFTER-\<prereq\>** — a named prerequisite must land first.
- **KEEP** — a live reader exists; cited.

Method: `rg` reference counts cross-checked by reading each ambiguous consumer.
Counts exclude generated output (`packages/{rust,python,typescript}/src/**`).

---

## 1. REMOVE-NOW

### 1.1 `RuleIdentity` deprecated alias (seed 3)

`packages/codegen/src/types/rule.ts:174` — `export type RuleIdentity = RuleBase;`
marked `@deprecated … remove when callers migrate` (rule.ts:170-172). **Callers did
migrate**: zero references outside rule.ts anywhere in the repo (the only other hit is
the prose mention "RuleIdentity history" in the RuleBase doc, rule.ts:91). Delete the
alias and reword that comment.

### 1.2 `SymbolRule.supertype` field (seed 10, part)

`packages/codegen/src/types/rule.ts:460` — `readonly supertype?: boolean;`
**Zero writers, zero readers.** No `supertype: true`/`supertype =` construction site
exists in `packages/codegen/src` (verified: the only `\.supertype` hit,
`emitters/wrap.ts:971`, is the unrelated `wrap.supertype(...)` emitter method).
Supertype-ness is carried by `SupertypeRule` / node-level classification, which
superseded this per-ref flag. Delete the field.

### 1.3 `FieldRule.nameFrom` (seed 1, part)

`packages/codegen/src/types/rule.ts:307` — `readonly nameFrom?: 'grammar' | 'kind' |
'override' | 'usage';` **Zero writers, zero behavioral readers.** The only other
occurrence in the repo is `compiler/evaluate.ts:1313`, which copies `rule.nameFrom`
forward when rebuilding a field — dead propagation of a value nothing ever sets.
Delete the field and the propagation line.

### 1.4 `ENUM` + `TERMINAL` rule-type constants (extension of seed 4)

`packages/codegen/src/types/rule-types.ts:26` (`ENUM = 'enum'`) and `:29`
(`TERMINAL = 'terminal'`). PR-P retired both discriminants; the tokenizer count is
misleading (11 referencing files each) because **every reference except one is a
comment** ("PR-P: ENUM type retired — …"). The one code reference is the `ENUM` token
in `compiler/evaluate.ts:9`'s import list, which is itself unused in that file's code.
`TERMINAL` has zero imports at all (test files carry comments *documenting its
removal from imports*: `compiler/__tests__/assemble.test.ts:2`, `link.test.ts:2`).
Delete both constants and drop `ENUM` from the evaluate.ts import.

### 1.5 `_armNamesFor` + local `PolymorphCandidateLocation` (seed 9)

`packages/codegen/src/emitters/suggested.ts:109` (`_armNamesFor`) and `:34` (the local
interface). Self-documented dead: the doc block at suggested.ts:27-33 says
"`_armNamesFor` has no callers (dead per the leading-underscore convention)" and notes
the original type was already deleted from link.ts (the enabling change). Verified:
zero call sites; the interface's only consumer is `_armNamesFor` itself. Remove both
together — a closed dead subgraph.

### 1.6 `isEnum` guard (seed 4, part)

`packages/codegen/src/types/rule.ts:510` — a one-line delegate to `isEnumChoiceRule`
(same file, rule.ts:376) whose guard type *lacks* the `__enumShaped` phantom brand that
makes `isEnumChoiceRule`'s narrowing correct (see the remark at rule.ts:364-374).
**Exactly one caller**: `compiler/link.ts:3117` (`if (isEnum(cur)) return cur;`,
imported at link.ts:29). Migrate that one call to `isEnumChoiceRule` and delete the
weaker duplicate in the same PR. (`EnumRule` the *type alias* is a different story —
see KEEP §3.3.)

### 1.7 `rule-attrs.ts` re-export shim (seed 8)

`packages/codegen/src/dsl/rule-attrs.ts:18` re-exports `combineMultiplicity` +
`LeafMultiplicity` from `rule-transforms.ts` "so existing importers keep resolving"
(PR-O M1 de-scatter). **The importers never migrated** — all three still import
through the shim: `compiler/simplify.ts:18`, `compiler/normalize.ts:23`,
`compiler/wrapper-deletion.ts:29`. Nobody imports these two names from
`rule-transforms.ts` directly. Redirect the three import lines and delete the
re-export (plus the two explanatory comments at rule-attrs.ts:10-11, 16-17) in one PR.

### 1.8 `isNativeNodeData` / `assertNativeNodeData` deprecated aliases

`packages/common/src/native-boundary.ts:176-180`, re-exported through
`packages/common/src/index.ts:12-13`. Kept "so grammar packages compiled against the
old names continue to link without regeneration" (native-boundary.ts:171-173). **That
rationale is now false**: zero references to either name under
`packages/{rust,python,typescript}/src` — regeneration long since moved generated code
to the new names. The only remaining consumer is
`packages/core/tests/native-boundary.test.ts:4-50`, which tests the aliases *as*
aliases. Rename the test's imports to `isRenderableNodeData` /
`assertRenderableNodeData`, drop the aliases and the index re-exports.

### 1.9 MIDWAY-STATE unreachable branches (extension, from the marker sweep)

Three deliberately-parked dead branches from the kind-named-slots refactor, each
self-documenting its own unreachability:

- `packages/codegen/src/emitters/transport-common.ts:116-126` and `:135-141` — both
  guarded by `node.children.length > 0`, which is never true because
  `AssembledBranch.children` was retired to `return []`
  (`compiler/model/node-map.ts:2861`).
- `packages/codegen/src/emitters/factory-map.ts:102-110` — same pattern via
  `structuralChildrenOf(node)` (always `[]`).

The comments say "leaving the code structure intact so the dead-code pattern is
visible to the cleanup pass" pending Tasks E2.1/E5.1. These branches are unreachable
*regardless* of whether those tasks land, so deleting them is safe now — but since
they were parked intentionally, coordinate with (or fold into) the E5.1 cleanup task
rather than sniping them ad hoc. Byte-neutral by construction.

### 1.10 Zero-external-reference type exports (seed 12, fresh census)

Fresh census (2026-07-02) over `packages/codegen/src/types/{diagnostics,ir,rule-types,
rule,runtime-shapes}.ts` + `compiler/types.ts`: count of *other* files referencing each
exported symbol, whole repo minus generated output. Zero-reference exports:

| Symbol | File | Disposition |
|---|---|---|
| `SuggestedOverride` | compiler/types.ts:217 | **delete** — only other mention is its own file's doc `@link` (types.ts:13) |
| `DerivedRuleSource` | compiler/types.ts:401 | **un-export** — used internally at types.ts:406 |
| `DerivedFieldSource` | compiler/types.ts:402 | **un-export** — used internally at types.ts:408 |
| `KindUseFlag` (const + type) | compiler/types.ts:87,96 | **un-export** — used internally at types.ts:121 |
| `SymbolLike` | types/runtime-shapes.ts:60 | **un-export** — internal use at :69 |
| `extractSymbolName` | types/runtime-shapes.ts:81 | **un-export** — internal use at :73,:88 |
| `IsRuntimeRule` | types/runtime-shapes.ts:159 | **un-export** — internal use at :163,:166,:169 |
| `RuleIdentity` | types/rule.ts:174 | delete (item 1.1) |
| `ENUM` / `TERMINAL` | types/rule-types.ts:26,29 | delete (item 1.4) |

Near-dead (exactly one external referencing file — reviewed, all are genuine single
consumers, *not* debt): `isEnum` (link.ts — item 1.6), `literalTextOf`,
`replaceAtPath`, `isAlias`/`isGroup`/`isRepeat`/`isRepeat1`,
`IndentRule`/`DedentRule`/`NewlineRule`, and compiler/types.ts's
`GeneratedMetadata*`/`KindParserMetadata`/`SignaturePool` family. One nuance:
`Severity`, `CompilerDiagnostic`, `RuntimeDiagnostic` (types/diagnostics.ts:21,43,51)
have **only a test** as their external consumer
(`compiler/__tests__/diagnostics.test.ts`) — they are the declared diagnostic
vocabulary, so keep-or-un-export is a taste call, not correctness.

Comparison with the stale R8 inventory
(`docs/superpowers/specs/2026-06-10-principle14-sweep-and-module-reorg-proposal.md:156`,
"~70 dead type exports, 180 un-export candidates"): that count was tokenization-based,
never LSP-confirmed, and covered all of codegen; on the type-modules slice scoped
here, the *current* number is 9 symbols (1 deletable interface, 6 un-exports, plus
the two items handled above). The R8 headline number should not be quoted for this
slice going forward.

---

## 2. REMOVE-AFTER-\<prereq\>

### 2.1 `isParameterless` deprecated getter — after a 5-site caller rename

`packages/codegen/src/compiler/model/node-map.ts:1593-1596` — `@deprecated Use
`parameterless` getter instead. Kept for emitter back-compat.` The back-compat is
still *load-bearing*: live readers are `emitters/shared.ts:333,399,1069`
(`ref?.isParameterless` where `ref` is `nodeMap.nodes.get(...)` — an AssembledNode)
and `emitters/node-model.ts:282` (`node.isParameterless` feeding the emitted
node-model). Migration is a same-PR rename of those four reads to `.parameterless`.
One decision rider: the **emitted** node-model key `isParameterless`
(node-model.ts:88,282; read back by `packages/tools/src/probe/stages.ts:158,173`) is a
persisted-format surface — keep the JSON key as-is to stay byte-neutral, or rename it
and its probe reader together.

### 2.2 `emitWrap` shim — after porting its 4 test files to the class protocol (seed 7)

`packages/codegen/src/emitters/wrap.ts:91-97` — a faithful 5-line driver of
`WrapEmitter` (`new WrapEmitter(config)` → `dispatchNode` loop → `finalize()`),
documented as "preserved for backwards compatibility (tests, CLI callers)"
(wrap.ts:87-90). Re-verified: **the "CLI callers" claim is stale** — production goes
through `new WrapEmitter(...)` at `emitters/emit.ts:125`; zero CLI references. The
only consumers are tests: `emitters/__tests__/utils-engine-emit.test.ts:5`,
`__tests__/wrap-slot-arity.test.ts:11`, `__tests__/wrap-variant-emit.test.ts:4`, and
`packages/tools/src/__tests__/wrapped-tree-materialization.test.ts:8`. Because the
shim drives the real class, those ~20 tests DO cover live code *through* it (the
prior R8 "dead path" classification was wrong). Retirement path: port the four test
files to the class protocol (or move the 5-line driver into a shared test helper),
then delete the export and fix the comment. Low urgency — the shim is cheap — but the
stale comment should be fixed regardless.

### 2.3 `recurseChildren` — after visitor rewrites of its 2 callers (seed 6)

`packages/codegen/src/dsl/rule-transforms.ts:457-490`, `@deprecated Superseded by
RuleWalker.map` with an explicit warning that the two are **not drop-in equivalents**
(rule-transforms.ts:438-455: recurseChildren maps direct children with the visitor
driving deep recursion; RuleWalker.map recurses internally — a blind swap recurses
twice). Remaining callers, both transform-family self-recursive visitors exactly as
the doc predicts:

- `dsl/rule-transforms.ts:581` — `fuseHeadRepeatLists` passes itself as visitor.
- `compiler/simplify.ts:104` — `canonicalizeSeqOfLeaves` passes itself as visitor
  (imported at simplify.ts:44).

Sizing: 2 call sites, each needing its visitor rewritten to stop self-recursing +
render-output validation (both run in the hot simplify path). Also fix the stale doc
at rule-transforms.ts:431: it says "Mirrors `dsl/enrich.ts:recurseChildren`" but
enrich.ts no longer contains any `recurseChildren` — the mirror was already deleted.

### 2.4 `packages/common/src/readNode.ts` JS tree-walk — after js-backend sunset (seed 11)

`@deprecated` at readNode.ts:137 ("the JS/TS-side read path is being phased out;
production uses `--backend native`"). Still structurally live in three ways:

1. **Every generated wrap.ts imports it** — the wrap emitter unconditionally emits
   `import { readNode as readNodeJs } from '@sittir/common'`
   (`emitters/wrap.ts:1044`), so all three grammar packages carry the dependency.
2. Validator js-backend path: `packages/tools/src/validate/common.ts:20`,
   `validate/read-render-parse.ts:12`, `profile/bench.ts:46`.
3. The deprecated JS engine: `packages/core/src/engine.ts:6` (via the
   `packages/common/src/index.ts:1` re-export).

Prereq chain: sunset the js render backend → make the wrap emitter stop emitting the
`readNodeJs` import (regen all three grammars) → drop the validator js-backend arms →
delete the module. Consistent with `feedback_ts_readnode_deprecated`: don't fix gaps
in this path meanwhile.

### 2.5 Top-level `source: 'group-lift'` on SymbolRule — after marker migration

The retirement is *announced* in two places — `dsl/enrich.ts:1593` ("`source:
'group-lift'` — LEGACY marker (sunset target)") and `dsl/transform/transform-path.ts:302`
("the legacy top-level `source: 'group-lift'` field is being retired") — but neither
the writers nor the readers moved:

- Writers: `dsl/enrich.ts:1618` and `compiler/link.ts:2744`.
- Behavior-driving readers: `emitters/suggested.ts:752` (skip group-lift symbols) and
  `emitters/templates.ts:1742` (skip `slot.source === 'group-lift'` — via the typed
  escape hatch documented at templates.ts:1739-1741).

Per the RuleBase doc the successor marker is `metadata.source: 'group-lift'`
(rule.ts:127) and/or the structural `inline` flag (rule.ts:119 explicitly says
`inline` *replaces* the `source==='group-lift'` re-derivation). Prereq: move writers
to the successor marker, migrate the two readers, regen, then drop `'group-lift'`
from the `SymbolRule.source` union (rule.ts:456). Needs validate:native, not
byte-gated — the readers gate real emission behavior.

### 2.6 `'inferred'` arm of `FieldRule.source` — after a confirming probe

`rule.ts:306` includes `'inferred'` in the FieldRule union, and
`dsl/transform/transform.ts:754,785,823,848` checks `inner.source === 'inferred'`
alongside `'enriched'`. But **no rule-level writer of `source: 'inferred'` exists**:
the comment at transform.ts:854 attributes it to "compiler/link.ts", which no longer
writes it; the only `'inferred'` writers are `compiler/collect-slots.ts:334,339,369,381`,
which stamp the *slot-level* `AssembledNonterminal.source` (a different, live field —
node-map.ts:1763,2497). Prereq: one instrumented run per grammar confirming the
`'inferred'` arms never fire, then drop the value from the FieldRule union and the
four checks, and fix the stale attribution comment. (The `'enriched'` arm stays —
live writer at `dsl/enrich.ts:418`.)

---

## 3. KEEP (verified live)

### 3.1 `FieldRule.source` (seed 1) — VERDICT REVISED (user, 2026-07-02): FIX-READERS-THEN-REMOVE

Original verdict was KEEP-because-read; the user's correction: a behavior-driving
reader of a provenance field is itself the cleanup. Each reader below gets a
structural replacement, after which the field becomes diagnostics-only or removable:

- transform.ts patch-transparency reads (754/785/823/848): structural signatures
  exist — enrich pass 1 emits `field(name, SYMBOL(name))` (fieldName === symbol
  name); keyword passes emit `field(…, SYMBOL(_kw_*))` (reserved prefix). DESIGN
  QUESTION — RESOLVED (user, 2026-07-02): YES, structural semantics win —
  a user-authored wrapper shape-identical to enrich output IS patch-transparent.
  Provenance is not needed for transparency; the transform.ts reads convert to the
  structural signatures unconditionally.
- collect-slots → node-model → generated `if (desc.source === "override")`
  (emitters/wrap.ts:1386): the CLEAR violation — generated RUNTIME code branching on
  provenance; needs slot-level structural derivation. Highest priority of the set.

Original KEEP evidence (reader inventory), retained for the fix work:

- `dsl/transform/transform.ts:754,785,823,848` — patch resolution treats
  enriched/inferred fields as transparent wrappers when applying user overrides.
- Writers: the transform DSL stamps `source: 'override'` throughout
  (transform.ts:655,676,890,906,958; `dsl/primitives/field.ts:248,251`); enrich stamps
  `'enriched'` (enrich.ts:418).
- `compiler/collect-slots.ts:369,381` — slot `source` derivation reads the rule-level
  value (`(rule as { source?: RuleSource }).source ?? 'inferred'`).
- Flows into generated code: the wrap emitter emits `if (desc.source === "override")`
  (emitters/wrap.ts:1386) and node-model emission carries it
  (emitters/node-model.ts:380).

Only the `'inferred'` *value* is vestigial at rule level (§2.6) and `nameFrom` is dead
(§1.3).

### 3.2 `RuleBase.metadata` (seed 2) — KEEP, with one contract violation to flag

The "inert provenance bag" contract (rule.ts:124-131: "NEVER drives compiler behavior
beyond path-descent lookup keying") is **mostly** honored:

- `metadata.source === 'enrich'` reads at `dsl/transform/transform-path.ts:313,386`
  are exactly the permitted path-descent keying.
- `compiler/link.ts:484` reads `metadata.source` as a fallback for rule-level
  classification provenance feeding the promoted-rules derivation log — provenance
  recording, acceptable.

**Violation:** `metadata.inlinedFrom` — documented at rule.ts:129 as "for diagnostics
only" — is *branched on* by the template emitter at `emitters/templates.ts:434` and
`:492` (`if (rule.type === SEQ && rule.metadata?.inlinedFrom !== undefined) return
SLOT_END;`), the self-described "§D-2a spacing stopgap". A third read at
templates.ts:1562 is genuinely diagnostic. Per `feedback_metadata_not_behavior` the
spacing decision should derive from a structural fact (or the doc must stop claiming
diagnostics-only). Not removable — but it is exactly the pattern this inventory
exists to catch, in the making.

### 3.3 `EnumRule` type alias (seed 4) — KEEP

`rule.ts:356` (`EnumRule<T> = ChoiceRule<T>`). Unlike the `isEnum` guard, the alias
has broad live use as intent-documentation typing: `compiler/link.ts:19,2968,3112,
3171,3243`, `compiler/model/node-map.ts:50`, `compiler/assemble.ts:21,246`,
`compiler/evaluate.ts:24` (+ doc references and two test files). Dissolving it into
bare `ChoiceRule` would lose signal for zero simplification gain.

### 3.4 `RenderRule` / `SimplifiedRule` brands (seed 5) — KEEP names; brands are inert

The type *names* are heavily used (RenderRule: 17 files; SimplifiedRule: 7 — e.g.
simplify.ts, templates.ts, assemble.ts, wrapper-deletion.ts). But the phantom
properties (`__renderRule?: never` rule.ts:235,251; `__simplifiedRule?: never`
rule.ts:252) provide **zero assignability protection**: they are optional, nothing in
the repo ever writes them, and `Rule<'optimize'>` / `Rule<'simplify'>` are
structurally identical (both `OptimizedPhase`, rule.ts:77,132) — so RenderRule and
SimplifiedRule are mutually assignable despite the claims "typed as a brand so
mismatches … surface at compile time" (rule.ts:230-232) and "Branded so
SimplifiedRule consumers can't be silently called with a pre-canonicalize RenderRule"
(rule.ts:248-249). Options: (a) delete the phantom props and correct both doc claims
(zero behavioral change), or (b) make the brands real (required distinct markers
stamped at `applyWrapperDeletion` / `computeSimplifiedRules`) — a design change, out
of scope here. Related doc-rot in the same file: `RuleBase.inline`'s doc (rule.ts:117)
says "Read via `isInlineRef()`" — **no such function exists** anywhere in the repo;
actual readers are direct (`compiler/link.ts:539-540`, `dsl/rule-transforms.ts:334`).

### 3.5 `SymbolRule.literal` and `SymbolRule.hidden` (seed 10) — KEEP

- `literal`: read by `literalTextOf` (rule.ts:518-519), `emitters/templates.ts:1400`,
  `compiler/assemble.ts:1199-1212`, `compiler/model/node-map.ts:1242-1245`. Live.
- `hidden`: written at `compiler/evaluate.ts:315,1397,1969` and `rule.ts:627`
  (`sym()`); read behaviorally at `compiler/model/node-map.ts:2700`. Live —
  though `isHiddenKind` (evaluate.ts:335) is documented as the authoritative oracle
  (rule-transforms.ts:322), so the per-ref flag is a candidate for a *future*
  consolidation, not a current vestige.

### 3.6 `readNode` (seed 11) — KEEP for now

Covered in §2.4: deprecated but load-bearing until the js backend sunsets; listed in
both sections deliberately so the KEEP verdict is explicit.

---

## 4. Noted in the marker sweep, not fully adjudicated

- `compiler/model/node-map.ts:1864` — "for backwards-compat with emitters that …"
  around node-ref value handling; needs its own consumer trace.
- `emitters/client-utils.ts:126` — generated client-utils carries a `@deprecated`
  no-op native-transport projection; removal changes generated-output bytes, so it
  belongs to an emitted-code-shrink pass (see `project_post_024_pipeline_optimization_specs`).
- `emitters/test.ts:282` — comment cross-reference to `wrap.polymorph /
  WrapEmitter.emitPolymorph`; verify it still points at real symbols when touching
  §2.2.

---

## 5. Suggested removal batching

**PR-A — pure-dead surface, byte-neutral gate (no generated-output change possible):**
items 1.1 `RuleIdentity`, 1.2 `SymbolRule.supertype`, 1.3 `nameFrom`, 1.4
`ENUM`/`TERMINAL`, 1.5 `_armNamesFor`+interface, 1.6 `isEnum` (with its one-caller
migration), 1.10 zero-ref type exports (1 delete + 6 un-exports), plus the doc-rot
fixes riding along: `isInlineRef()` phantom reference (rule.ts:117), stale
recurseChildren mirror note (rule-transforms.ts:431), stale `emitWrap` "CLI callers"
comment (wrap.ts:88), and the inert-brand doc claims (rule.ts:230-232, 248-249) if
option (a) of §3.4 is taken. Gate: tsgo + unit tests + `git diff --stat` on generated
dirs = empty.

**PR-B — trivial migrations, still byte-neutral:** 1.7 rule-attrs re-export (3 import
lines), 1.8 native-boundary aliases (1 test file rename), 2.1 `isParameterless`
(4 reads → `.parameterless`; keep the emitted JSON key), 2.2 `emitWrap` test port
(4 test files). Gate: same as PR-A plus the four wrap test suites.

**PR-C — behavior-adjacent, validate:native gated:** 2.5 group-lift marker migration,
2.6 `'inferred'` arm removal (after its probe), 1.9 MIDWAY-STATE branches
(coordinate with kind-named-slots E5.1). Gate: `pnpm validate:native` counts hold on
all three grammars.

**Deferred / tracked elsewhere:** 2.3 `recurseChildren` (2 visitor rewrites — fold
into the RuleWalker adoption line, see `2026-07-01-r12-rulewalker-design.md`), 2.4
`readNode` (gated on js-backend sunset), §3.2's `inlinedFrom` spacing-stopgap
violation (needs a structural-fact replacement + render validation), §4 items.

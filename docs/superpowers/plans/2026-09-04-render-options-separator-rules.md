# Separator Spacing In The Render Rule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separator spacing is a choice written into the separator rule of every eligible repeat on the render side, with grammar-declared defaults in the shape of the `Options` type; no annotation carries it and no owner fills a shared list.

**Architecture:** One pass over the normalized rules, consumed only by the options and render emitters, rewrites each multiplicity-bearing rule's `separator.value` into `seq(choice(_tight, _space, _newline), token, choice(...))`, or into the whitespace choice alone for an unseparated repeat. The arms carry the preference label and the resolved default exactly like a declared choice. Sites, transport fields, the native fill and the list view are all reads of that rule; the site lives on the kind whose rule holds the multiplicity, so a list kind owns its own spacing and flank and every transport fills its own fields.

**Tech Stack:** TypeScript codegen (`packages/codegen`), generated Rust render crates, vitest, cargo.

**Spec:** `docs/superpowers/specs/2026-09-04-render-options-design.md` ("Preferences", "Render side", "Precedence").

## Global Constraints

- Rendered dogfood output is byte-identical to the baseline captured before the change: rust strict 724, rust loose 2194, typescript strict 549, typescript loose 473, python strict 203, python loose 196 characters.
- Validator metrics identical on all three grammars; codegen vitest at its baseline of 13 known failures; package suites green; `cargo test --workspace --exclude sittir-parity-tests` green.
- Render rules are read by the render and template emitters only; assemble and the factory surface never see the injected choice.
- No source comments; declarations are documented in `docs/glossary/`.

---

### Task 1: DSL surface — `defaults` replaces phantom patches and repeat-level preferences

**Files:**
- Modify: `packages/codegen/src/dsl/primitives/spacing.ts` (drop the phantom-kind parser; add `spacingLabel`, `RenderDefaults`)
- Modify: `packages/codegen/src/dsl/primitives/preference.ts` (drop `PreferenceDeclaration`)
- Modify: `packages/codegen/src/dsl/wire/wire.ts` (`WireConfig.defaults`, `WireContext.defaults`; no phantom interception)
- Modify: `packages/codegen/src/dsl/transform/transform.ts` (`applyPreference` has no repeat branch)
- Modify: `packages/codegen/src/types/rule.ts` (`RuleAnnotations` loses `spacing`)
- Modify: `packages/codegen/src/compiler/evaluate.ts`, `compiler/types.ts`, `compiler/generate.ts`, `emitters/emit.ts` (`renderDefaults` sidecar threads to the emitters)
- Modify: `packages/codegen/src/compiler/flatten.ts` (no repeat annotation carry), `compiler/model/node-map.ts` (no `spacing` on arms or values)
- Test: `packages/codegen/src/dsl/__tests__/render-defaults.test.ts`, `preference.test.ts`, `compiler/__tests__/flatten.test.ts`, `post-evaluate-invariant.test.ts`

**Interfaces:**
- Produces: `RenderDefaults = Readonly<Record<string, string | Readonly<Record<string, string>>>>`; `RawGrammar.renderDefaults?: RenderDefaults`; `EmitAllConfig.renderDefaults?`.

- [x] Write `render-defaults.test.ts`: `wire({ rules, defaults: { empty_separator_space: 'newline', block: { statements_empty_separator_space: 'tight' } } })` exposes the same object on `__wireContext__.defaults`; a `patches` key that matches the old phantom pattern is an ordinary patch on an unknown kind and fails as such.
- [x] Replace the repeat cases in `preference.test.ts` with one asserting `applyPreference` on a repeat throws "the rule is not a choice"; delete the repeat-annotation case in `flatten.test.ts`; rename the sidecar in `post-evaluate-invariant.test.ts`.
- [x] Implement the source changes; run the four test files.

### Task 2: The render-rule pass

**Files:**
- Create: `packages/codegen/src/compiler/model/render-rules.ts`
- Test: `packages/codegen/src/compiler/model/__tests__/render-rules.test.ts`

**Interfaces:**
- Produces: `spaceRenderRules({ nodeMap, kindEntries, defaults }) → RenderRules { rules }`; `spacedSeparatorOf(rule) → { before?, token?, after? }` with `SpacingPart { fieldName, label, side, defaultArm }`; `spacingSitesOf(renderRules, nodeMap)`; `publicKindName`.

- [x] Tests over a hand-built node map: a comma repeat becomes a three-part seq whose choices carry the label and the default; an unseparated repeat gets the gap choice; a tokenized repeat, an immediate element and an external element are left alone; a kind × slot default beats a supertype default beats the label default beats `space`; a default naming no site or no arm fails naming the key; a grammar without whitespace kinds returns its rules unchanged.
- [x] Implement: pass one finds every multiplicity-bearing slot rule (slot named through `nodeMap.slotByRuleId`) that admits extras; defaults are validated against those sites; pass two rewrites separators with `RuleWalker.map`.

### Task 3: Sites from the rule

**Files:**
- Rewrite: `packages/codegen/src/compiler/model/site-preferences.ts`
- Delete: `packages/codegen/src/compiler/model/render-spacing.ts`
- Modify: `packages/codegen/src/emitters/options.ts` (`EmitOptionsConfig.renderRules`)

- [x] `collectSitePreferences({ nodeMap, kindEntries, renderRules })`: declared sites from model slots, spacing sites from `spacingSitesOf`, delimiter sites from every `AssembledList` with an optional flank on the list kind itself.
- [x] Existing `emitter-options` and `render-options-rs` tests stay green on the unchanged `SitePreference` shape.

### Task 4: Render module reads the sites

**Files:**
- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `rust/crates/sittir-core/src/options.rs` (delete `ListSpacing`)
- Test: `packages/codegen/src/emitters/__tests__/render-module-emit.test.ts`

- [x] Transport struct: one `Option<u16>` field per synthesized site of the kind, named by the site key; `renderTransportField` has no spacing branch.
- [x] Fill: every struct fills its own spacing fields with `get_or_insert`, a list fills its own `delimiter` when the table value is non-zero, then recurses; no `ListSpacing`.
- [x] View: `before`/`after` read the node's own fields for the slot.
- [x] Update the four render-module-emit cases to the list kind owning its fields.

### Task 5: Grammars, regeneration and gates

**Files:**
- Modify: `packages/{rust,typescript,python}/grammar.sittir.ts` (`defaults:` block; phantom patches and token-tree path preferences removed)
- Regenerate: all three grammar packages and crates
- Test: `packages/{rust,typescript,python}/tests/options.test.ts` (snapshots, the moved kind × slot key)

- [x] Dry-run the site list to name the token-tree kinds; write rust `defaults` so every token-tree gap is tight.
- [x] Regenerate; `cargo build`; byte-diff the six dogfood renders against the baseline; validator history identical; codegen, package and cargo suites.

### Task 6: Spec, glossary, memory

- [x] Spec: the synthesized-preference paragraph, the render-side section and the verification list describe the rule rewrite and `defaults`.
- [x] Glossary: every added, changed and removed declaration in `compiler-model.md`, `dsl-primitives.md`, `dsl-wire.md`, `dsl-transform.md`, `compiler.md`, `emitters.md`.

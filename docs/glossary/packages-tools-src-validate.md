# `packages/codegen/src/packages/tools/src/validate` — Function Glossary

Per-function reference for `packages/codegen/src/packages/tools/src/validate/`, mechanically relocated from source
comments by `scripts/relocate-comments-to-glossary.mts` (mechanical pass —
unedited, unverified). A later pass reformats/verifies these entries and decides
what merges into docs/compiler-phase-glossary.md's phase narrative.

See [AGENTS.md § Wave-style decomposition before commits](../../AGENTS.md).

---

### `packages/tools/src/validate/render-bodies.ts::module`

```text
/**
 * The generated render bodies of a grammar — `packages/<grammar>/.sittir/render-bodies.json`,
 * one body IR per emitted kind — are the validators' catalog of renderable
 * kinds and the source the coverage checker reads a kind's body from.
 */
```

### `packages/tools/src/validate/render-bodies.ts::renderBodiesPath`

#### body

```text
// packages/tools/src/validate/ → ../../.. → packages/
```

### `packages/tools/src/validate/render-bodies.ts::loadRenderBodies`

```text
/** Every emitted kind's body; an absent file (a grammar never generated) is an empty catalog. */
```

### `packages/tools/src/validate/render-bodies.ts::deriveRuleKinds`

```text
/** The kinds the renderer can handle: those with an emitted body. */
```

### `packages/tools/src/validate/render-bodies.ts::bodyToLegacyRule`

```text
/**
 * A body in the coverage checker's placeholder shape: a slot reference is
 * `$NAME`, a gated arm is a `$TEST_CLAUSE` placeholder whose clause body is
 * the arm, and literal text is itself. The fallback of a gate chain inlines
 * into the surrounding template; an adjacency mark and a seam contribute
 * nothing. `indent`/`dedent` contribute the depth arms' stamped text
 * (`INDENT_TEXT`/`DEDENT_TEXT`) and a token seam contributes its own text —
 * exactly what the retired `whitespace` node contributed.
 */
```

# Quickstart: Jinja Template Migration

**Feature**: 011-jinja-template-migration
**Audience**: Implementer walking into Phase A or Phase B cold.

---

## The one-minute mental model

Before this migration:

```text
packages/rust/templates.yaml  ──→  resolveTemplate + resolveSlot + renderClause + pickTemplate
                                   (hand-rolled regex substitutor, 650 lines)
```

After Phase A:

```text
packages/rust/templates/
├── function_item.jinja       ──→  Nunjucks (TS) ── renders from TemplateContext ──→ string
├── struct_item.jinja
└── ... (~160 files)
```

After Phase B:

```text
packages/rust/templates/
├── function_item.jinja       ──→  askama (Rust, compile-time) ── renders from per-rule struct ──→ String
└── ...                       ──→  Nunjucks (TS, precompiled)  ── renders from TemplateContext ──→ string
```

One set of `.jinja` files; two engines; identical output.

---

## Prerequisites (all landed)

Confirm before starting:

```bash
git log --oneline origin/master | grep "ADR-0013"
# expect:
#   a047294 core: extract prepare() — pre-partition render input (ADR-0013 Task 3)
#   17d4749 codegen: collapse identical variant templates (ADR-0013 Task 2)
#   7db681d core: split template loading from render engine (ADR-0013 Task 1)
```

All three must be on `origin/master`. Confirmed as of 2026-04-21.

---

## Phase A walkthrough

### Step 1: Translator + emitter skeleton

Create `packages/codegen/src/emitters/jinja-translator.ts` with the mapping rules from `contracts/translator-mapping.md`. Start with the simplest case (Rule 1: single-template branch):

```ts
export function translateToJinja(
	node: AssembledNode,
	rules: Record<string, Rule>,
	wordMatcher: RegExp
): string {
	if (node.modelType === 'branch' || node.modelType === 'container') {
		return translateSingleTemplate(node, rules, wordMatcher);
	}
	// ... other modelType cases added incrementally
	throw new Error(
		`translateToJinja: unsupported modelType '${node.modelType}' for rule '${node.kind}'`
	);
}
```

Write a focused unit test (`__tests__/jinja-translator.test.ts`) that constructs a fixture `AssembledBranch` and asserts the emitted `.jinja` body.

### Step 2: Drive the emitter

Modify `packages/codegen/src/emitters/templates.ts` (the existing YAML emitter). Replace the YAML serialization with per-file `.jinja` emission. Drop in placeholder deletion of stale files.

### Step 3: First grammar bring-up

Regenerate **rust only** first. Inspect the emitted files under `packages/rust/templates/`. Compare a handful by hand against the old `templates.yaml`.

Flip the renderer to load `.jinja` files (behind an env flag first) and run the rust round-trip corpus. Iterate on translator bugs until byte-identical.

### Step 4: Repeat for typescript, python

Same drill, one grammar at a time. Variant rules (`visibility_modifier`, `export_statement`, `variable_declarator`, `call_expression`, `_match_block`) are the highest-risk cases; inspect their emitted `.jinja` files by eye.

### Step 5: Flip default + delete YAML

Once all three grammars are byte-identical, flip the renderer default to load `.jinja` (remove the env flag), delete `packages/{rust,typescript,python}/templates.yaml`, run full test suite.

### Step 6: Nunjucks precompile (optional optimization)

If `pnpm test` wall-clock regresses by more than a few percent, wire up `nunjucks.precompile` at codegen time. Emits JS modules consumers can import directly, bypassing runtime parsing.

---

## Phase B walkthrough

### Step 1: New crate skeleton

Create `crates/sittir-render/` with `Cargo.toml` depending on `askama` (latest 0.x). Set up `build.rs` if needed for grammar-specific asset copying.

### Step 2: Codegen emits Rust source

Extend `packages/codegen/src/emitters/` with a Rust source emitter. For each rule with a `.jinja` file, emit:

```rust
#[derive(askama::Template)]
#[template(path = "rust/function_item.jinja")]
pub struct FunctionItemContext<'a> {
    pub children: &'a str,
    pub children_list: &'a [String],
    pub variant: &'a str,
    pub text: &'a str,
    pub trailing_sep: bool,
    pub leading_sep: bool,
    // Per-rule named fields here
    pub name: Option<&'a str>,
    pub parameters: Option<&'a str>,
    // ...
}
```

`cargo build` validates all templates at compile time.

### Step 3: Cross-render parity test

`crates/sittir-render/tests/parity.rs`: reads the same corpus the TS tests use, renders each node through the Rust implementation, compares against a TS-produced reference snapshot. Byte-identical required.

### Step 4: Filter aliases

`crates/sittir-render/src/filters.rs`: register Nunjucks-compatible aliases for divergent askama filters (`upper` → askama's `uppercase`, etc.).

---

## Smoke test checklist (per phase)

Phase A:

- [ ] `pnpm test` passes at pre-migration pass/fail baseline
- [ ] `ls packages/rust/templates/ | wc -l` returns ≈160
- [ ] `test -f packages/rust/templates.yaml && echo MISSING || echo OK` prints `OK`
- [ ] `git diff` shows only expected-file changes (no `.yaml` noise)
- [ ] `grep -r '\$[A-Z]' packages/rust/templates/` returns zero matches (all placeholders translated)

Phase B:

- [ ] `cargo build` succeeds across the sittir-render crate
- [ ] `cargo test -p sittir-render` passes (parity corpus green)
- [ ] Intentional template-variable typo → `cargo build` fails with clear file + variable error
- [ ] Per-node wall-clock render time at least 2× faster than TS baseline (bench included)

---

## Troubleshooting

**Symptom**: Round-trip corpus produces a non-identical node post-Phase-A.
**Most likely cause**: Whitespace control applied differently than YAML-era implicit absorption. Inspect the `.jinja` file for that rule; compare to the regex substitutor's behavior in `packages/core/src/render.ts` at the pre-migration revision.

**Symptom**: `cargo build` fails with "unknown variable" during Phase B.
**Most likely cause**: Rust struct's field set doesn't include a variable the `.jinja` references. Update the codegen emitter to add the field to the per-rule struct.

**Symptom**: Cross-render parity fails on a specific filter (e.g., `upper`).
**Most likely cause**: Missing alias registration. Add to `src/filters.rs`.

**Symptom**: Translator throws on a specific rule.
**Most likely cause**: That rule's metadata implies a construct outside the authoring subset. Either (a) simplify the rule's shape via an override, (b) add to the subset (rare — requires cross-render parity proof), or (c) fix the translator if the throw is spurious.

---

## Handoff artifacts

Phase A delivers:

- `packages/codegen/src/emitters/jinja-translator.ts` + tests
- `packages/codegen/src/emitters/templates.ts` rewritten for per-file emission
- `packages/<grammar>/templates/*.jinja` (generated, committed)
- `packages/core/src/render.ts` Nunjucks bridge
- Deleted `packages/<grammar>/templates.yaml`

Phase B delivers:

- `crates/sittir-render/` crate
- `packages/codegen/src/emitters/rust-source.ts` (new) — emits per-rule askama structs
- Cross-render parity test green across 3 grammars

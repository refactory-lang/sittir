# Quickstart: Rule IDs and Rule Classification

This quickstart validates the implementation slice for spec 021.

## 1. Confirm the active feature

```bash
git branch --show-current
```

Expected branch:

```text
021-rule-ids-at-evaluate
```

## 2. Run the focused compiler tests

```bash
pnpm vitest run packages/codegen/src/__tests__/evaluate.test.ts
```

Minimum expected coverage:

- every evaluated rule occurrence has an inline `RuleId`
- every inline `RuleId` joins to exactly one catalog entry
- catalog root entries exist for representative kinds
- child IDs match direct rule children
- unchanged evaluation is deterministic

## 3. Run post-Evaluate invariant coverage

```bash
pnpm vitest run packages/codegen/src/__tests__/post-evaluate-invariant.test.ts
```

Minimum expected coverage:

- Rust, TypeScript, and Python representative grammars produce complete catalogs
- all-terminal, all-nonterminal, and mixed-descendant wrappers classify correctly
- field and named-alias forcing does not flood descendants
- grammar-authored, override-authored/replaced, and evaluate-synthesized provenance roots are distinguishable
- affected paths may change IDs after a structural grammar edit while unchanged re-evaluation remains deterministic

## 4. Run type checking

```bash
pnpm -r run type-check
```

Expected result: all packages type-check successfully.

## 5. Run broader tests before implementation completion

```bash
pnpm test
```

Expected result: existing test expectations remain intact. If unrelated parity tests are already known to be divergent, document that separately and keep the 021-focused compiler tests green.

## 6. Audit generated-output boundaries

Do not hand-edit generated grammar package output. This feature updates `consts.ts` through the codegen CLI so generated grammar packages expose `TreeSitterKindId` and `TreeSitterFieldId` enums derived from each compiled `parser.wasm` artifact.

## Validation Record

Last implementation run: 2026-04-29.

- `pnpm vitest run packages/codegen/src/__tests__/generated-metadata.test.ts packages/codegen/src/__tests__/emitter-consts.test.ts` — PASS, 13 tests passed.
- `npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src --skip-ts-chain --no-build-native` — PASS.
- `npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src --skip-ts-chain --no-build-native` — PASS.
- `npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src --skip-ts-chain --no-build-native` — PASS.
- `pnpm vitest run packages/codegen/src/__tests__/generated-metadata.test.ts packages/codegen/src/__tests__/emitter-consts.test.ts packages/codegen/src/__tests__/evaluate.test.ts packages/codegen/src/__tests__/post-evaluate-invariant.test.ts` — PASS, 84 tests passed.
- `pnpm -r run type-check` — PASS.
- `pnpm test` — PASS, 101 test files passed; 4609 tests passed, 12 expected-fail, 3 todo.
- Generated-output boundary audit — PASS, generated diffs under `packages/{rust,python,typescript}/src` and native render artifacts were produced by the codegen CLI, not hand-edited.

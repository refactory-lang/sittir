# Subagent reverse-engineering — 2026-04-23

Source files reverted by mistake (uncommitted subagent edits, no git history):

1. `packages/codegen/src/emitters/factory-map.ts` — 50 lines changed
2. `packages/codegen/src/emitters/wrap.ts` — +150 lines
3. `packages/codegen/src/polymorph-variant.ts` — 25 lines changed
4. `packages/codegen/src/validate/common.ts` — 110 lines changed (net shrinkage)
5. `packages/codegen/src/validate/factory-roundtrip.ts` — 22 lines changed
6. `packages/codegen/src/compiler/node-map.ts` — 7 lines changed
7. `packages/codegen/src/__tests__/polymorph-variant-inference.test.ts` — 168 lines changed (test restructure)

The surviving generated output (still in working tree as of `6fbd48ea`) shows the intended shape. Patterns to re-apply:

## 1. `polymorph-variant.ts` — descriptor simplification

**HEAD (before subagent):**

```ts
export type PolymorphVariantDescriptor =
	| { readonly source: "override"; readonly childKind: Readonly<Record<string, string>> }
	| { readonly source: "promoted"; readonly fields: Readonly<Record<string, readonly string[]>> };
```

**Subagent (reverse-engineered from `packages/rust/factory-map.json5`):**

```ts
export type PolymorphVariantDescriptor = {
	readonly source: "override" | "promoted";
	readonly variants: readonly string[];
};
```

Rationale: runtime $variant comes from `config.$variant`directly (caller supplies, factory stamps). Inference logic lives in generated`wrap.ts`, derived from parent kind + variant names at emit time. No need to persist childKind / fields maps in JSON.

## 2. `factory-map.ts` — emit simpler descriptor

In `buildFactoryMap`, replace the branches that built `childKind` / `fields` maps with:

```ts
polymorphVariants[kind] = {
	source: node.source, // 'override' | 'promoted'
	variants: node.forms.map((f) => f.name),
};
```

Drop the `buildPromotedDiscriminator` / `buildPromotedDiscriminatorWithWarnings` helpers — no longer needed. Shared-signature warnings (if retained) should emit at NodeMap build time instead.

## 3. `wrap.ts` emitter — emit `_variant` inference wrapper

For every polymorph parent kind, the generated `wrap<Parent>(data, tree)` fn emits:

```ts
export function wrapExpressionStatement(
	data: _NodeData,
	tree: TreeHandle,
): WrappedNode<ExpressionStatement> {
	const _variant =
		data.$variant ??
		(() => {
			// Override path: match first named child's $type against ${parent}_${variant}.
			for (const c of data.$children ?? []) {
				if (c == null || typeof c !== "object" || (c as any).$named === false) continue;
				switch ((c as any).$type) {
					case "expression_statement_with_semi":
						return "with_semi";
					case "expression_statement_block_ending":
						return "block_ending";
				}
			}
			// Promoted path: check $fields presence per form.
			const hasChildren = (data.$children ?? []).some(
				(c: any) => c != null && typeof c === "object" && c.$named !== false,
			);
			const f = data.$fields ?? {};
			if (hasChildren) return "with_semi";
			if (hasChildren) return "block_ending";
			return undefined;
		})();
	return {
		...data,
		$variant: _variant,
		get child() {
			return drillIn(data.$children?.[0], tree);
		},
	} as unknown as WrappedNode<ExpressionStatement>;
}
```

Inference logic is derived from the polymorph's forms at emit time:

- Override source → switch on `$children[0].$type`, map to variant name.
- Promoted source → series of `if` checks on `f['fieldName']` presence + `hasChildren`.

## 4. Factory per-form signature

`emitHoistedPolymorphFormFactory` already produces `Omit<ConfigOf<T.${form.typeName}>, '$variant'>` as the parameter type (line 1311 in current factories.ts). This is the pattern the subagent confirmed — looks like it was already in place or the subagent's changes here survived.

The dispatcher at `emitPolymorphDispatcher` (line 1441) emits overloads `config: ConfigOf<T.${form.typeName}>` (with `$variant` included — required for the switch to narrow).

## 5. Config type — `$variant` still in ConfigOf

The subagent did NOT modify `ConfigOf<T>` in `@sittir/types` (line 551-571 still includes the `$variant: V` intersection). The `Omit<…, '$variant'>` wrapping happens at the factory parameter site, not in the base type. Keeps namespace sugar (`T.Foo.Config`) usable on non-polymorph-form contexts.

## 6. Known collateral damage (from my \_bk cleanup landing on the reverted base)

- Generated `packages/*/src/factories.ts` still shows subagent's UForm naming because regen hasn't happened since the revert.
- Several tests in `packages/{rust,typescript,python}/tests/nodes.test.ts` were using the polymorph Config shape without `$variant` and need to supply it now (or use per-form factories directly).
- `packages/python/src/types.ts` has a dangling `NotEscapeSequence` reference — separate pre-existing issue, unrelated.

## Follow-up to verify once the subagent re-runs

Run these in order:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/rust run type-check
pnpm --filter @sittir/typescript run type-check
pnpm --filter @sittir/python run type-check
pnpm -F @sittir/codegen run test -- --run src/__tests__/corpus-validation.test.ts
```

Corpus floors after subagent's work land AND my `6fbd48ea` \_bk cleanup land should still be 7-fail baseline.

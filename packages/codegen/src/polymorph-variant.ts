/**
 * Descriptor telling validators how to stamp `$variant` on a derived
 * polymorph config when the caller didn't supply it (readNode-derived
 * shapes, `.from()` Loose wrappers). Serialized into node-model.json5's
 * `polymorphVariants` section (PR-K); consumed by `nodeToConfig` via
 * `validate/common.ts`.
 *
 * Lives in codegen — not `@sittir/types` — because the descriptor is
 * codegen/validator-internal. Consumers of `@sittir/types` should never
 * see it.
 */

/**
 * (debt: source-homonym resolution, decision 6 — W4, STOP, NOT removed)
 * Decision 6 asks node-model's `polymorphVariants.<kind>.source` to be
 * dropped from the schema unless a consumer reads it for more than
 * diagnostics. Verified: `packages/tools/src/validate/common.ts`'s
 * `inferOverrideHelperVariant`/`inferPolymorphVariant` (`switch (desc.source)`)
 * and `read-render-parse.ts`'s `if (desc.source !== 'override') continue`
 * both branch runtime behavior on this field. It is NOT the authorship/
 * provenance homonym decision 6 targets — `source` here is this type's OWN
 * discriminant tag (structurally identical in role to `rule.type`), not a
 * "who authored this" fact; its two values name which of the two shapes
 * below is present, exactly like any other discriminated union. Removing it
 * would break `nodeToConfig`'s runtime variant dispatch (the JSON is this
 * union's wire format — there is no compile-time narrowing once round-
 * tripped through node-model.json5). Left untouched.
 */
export type PolymorphVariantDescriptor =
	| {
			readonly source: 'override';
			readonly childKind: Readonly<Record<string, string>>;
			readonly helperKind?: Readonly<Record<string, string>>;
			readonly helperChildKind?: Readonly<Record<string, readonly string[]>>;
	  }
	| {
			readonly source: 'promoted';
			readonly fields: Readonly<Record<string, readonly string[]>>;
	  };

export type PolymorphVariantMap = Readonly<Record<string, PolymorphVariantDescriptor>>;

/**
 * Exhaustiveness helper. Place at the end of every switch on a
 * discriminated union so adding a new variant becomes a compile error
 * here instead of a silent wrong-answer at runtime.
 */
export function assertNever(x: never): never {
	throw new Error(`assertNever: unexpected variant ${JSON.stringify(x)}`);
}

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
 * (source-homonym resolution, decision 6 outcome revision — renamed, not
 * removed.) This field is the descriptor's OWN discriminated-union tag
 * (structurally identical in role to `rule.type`), not the authorship/
 * provenance homonym decision 6 targets: its two values name which of the
 * two shapes below is present. It drives live variant dispatch —
 * `packages/tools/src/validate/common.ts`'s `inferOverrideHelperVariant` /
 * `inferPolymorphVariant` (`switch (desc.definedBy)`) and
 * `read-render-parse.ts`'s `if (desc.definedBy !== 'override') continue` —
 * and the JSON serialized into node-model.json5 is this union's wire
 * format, so there is no compile-time narrowing once round-tripped.
 * Renamed from `source` → `definedBy` (decision 7 small cleanup b) so the
 * stem no longer collides with the provenance vocabulary.
 */
export type PolymorphVariantDescriptor =
	| {
			readonly definedBy: 'override';
			readonly childKind: Readonly<Record<string, string>>;
			readonly helperKind?: Readonly<Record<string, string>>;
			readonly helperChildKind?: Readonly<Record<string, readonly string[]>>;
	  }
	| {
			readonly definedBy: 'promoted';
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

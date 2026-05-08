/**
 * Descriptor telling validators how to stamp `$variant` on a derived
 * polymorph config when the caller didn't supply it (readNode-derived
 * shapes, `.from()` Loose wrappers). Emitted in factory-map.json5;
 * consumed by `nodeToConfig` via `validate/common.ts`.
 *
 * Lives in codegen — not `@sittir/types` — because the descriptor is
 * codegen/validator-internal. Consumers of `@sittir/types` should never
 * see it.
 */

export type PolymorphVariantDescriptor =
	| {
			readonly source: 'override';
			readonly childKind: Readonly<Record<string, string>>;
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

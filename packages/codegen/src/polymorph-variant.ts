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

export function assertNever(x: never): never {
	throw new Error(`assertNever: unexpected variant ${JSON.stringify(x)}`);
}

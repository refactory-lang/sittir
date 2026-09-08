export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
	/** The enclosing variants' names, outermost first, when this one is minted
	 * inside another variant's subtree. The minted rule composes through them
	 * (`_except_clause_exception_as`); the arm keeps its own short name. */
	readonly nestedUnder?: readonly string[];
}

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export function variant(name: string): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name };
}

/** The name the minted rule takes: the enclosing variants' names then its own. */
export function variantMintName(v: VariantPlaceholder): string {
	return [...(v.nestedUnder ?? []), v.name].join('_');
}

export function nestVariant(v: VariantPlaceholder, nestedUnder: readonly string[]): VariantPlaceholder {
	return nestedUnder.length === 0 ? v : { ...v, nestedUnder };
}

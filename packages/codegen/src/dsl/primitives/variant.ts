export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
	readonly nestedUnder?: readonly string[];
}

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export function variant(name: string): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name };
}

export function variantMintName(v: VariantPlaceholder): string {
	return [...(v.nestedUnder ?? []), v.name].join('_');
}

export function nestVariant(v: VariantPlaceholder, nestedUnder: readonly string[]): VariantPlaceholder {
	return nestedUnder.length === 0 ? v : { ...v, nestedUnder };
}

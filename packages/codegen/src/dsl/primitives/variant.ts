export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
}

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export function variant(name: string): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name };
}

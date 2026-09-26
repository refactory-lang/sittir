export interface VariantPlaceholder {
	readonly __sittirPlaceholder: 'variant';
	readonly name: string;
	readonly nestedUnder?: readonly string[];
	readonly absent?: true;
	readonly default?: true;
}

export interface VariantOptions {
	readonly absent?: true;
	readonly default?: true;
}

export const ABSENT_VARIANT_NAME = 'bare';

export function isVariantPlaceholder(v: unknown): v is VariantPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'variant';
}

export function variant(name: string, options?: VariantOptions): VariantPlaceholder {
	return { __sittirPlaceholder: 'variant' as const, name, ...(options?.absent === true ? { absent: true as const } : {}), ...(options?.default === true ? { default: true as const } : {}) };
}

export function variantMintName(v: VariantPlaceholder): string {
	return [...(v.nestedUnder ?? []), v.name].join('_');
}

export function nestVariant(v: VariantPlaceholder, nestedUnder: readonly string[]): VariantPlaceholder {
	return nestedUnder.length === 0 ? v : { ...v, nestedUnder };
}

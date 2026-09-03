export interface ArmDefaultPlaceholder {
	readonly __sittirPlaceholder: 'default';
}

export function isArmDefault(v: unknown): v is ArmDefaultPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'default';
}

export const arm: { readonly default: ArmDefaultPlaceholder } = {
	default: { __sittirPlaceholder: 'default' }
};

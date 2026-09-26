export interface FlattenPlaceholder {
	readonly __sittirPlaceholder: 'flatten';
}

export function isFlattenPlaceholder(v: unknown): v is FlattenPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'flatten';
}

export function flatten(): FlattenPlaceholder {
	return { __sittirPlaceholder: 'flatten' as const };
}

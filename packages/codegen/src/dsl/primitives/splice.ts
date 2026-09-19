export interface SplicePlaceholder {
	readonly __sittirPlaceholder: 'splice';
}

export function isSplicePlaceholder(v: unknown): v is SplicePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'splice';
}

export function splice(): SplicePlaceholder {
	return { __sittirPlaceholder: 'splice' as const };
}

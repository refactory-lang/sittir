export interface GroupPlaceholder {
	readonly __sittirPlaceholder: 'group';
}

export function isGroupPlaceholder(v: unknown): v is GroupPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'group';
}

export function group(): GroupPlaceholder {
	return { __sittirPlaceholder: 'group' as const };
}

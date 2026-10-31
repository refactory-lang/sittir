export interface RequiredPlaceholder {
	readonly __sittirPlaceholder: 'required';
}

export function isRequiredPlaceholder(v: unknown): v is RequiredPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'required';
}

export function required(): RequiredPlaceholder {
	return { __sittirPlaceholder: 'required' };
}

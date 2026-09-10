export interface PreferencePlaceholder {
	readonly __sittirPlaceholder: 'preference';
	readonly default: string;
}

export function isPreference(v: unknown): v is PreferencePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'preference';
}

export function preference(arm: string): PreferencePlaceholder {
	return { __sittirPlaceholder: 'preference', default: arm };
}

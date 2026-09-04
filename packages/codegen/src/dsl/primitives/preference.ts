export interface PreferencePlaceholder {
	readonly __sittirPlaceholder: 'preference';
	readonly label: string;
	readonly default: string;
}

export function isPreference(v: unknown): v is PreferencePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'preference';
}

export function preference(label: string, defaultArm: string): PreferencePlaceholder {
	return { __sittirPlaceholder: 'preference', label, default: defaultArm };
}

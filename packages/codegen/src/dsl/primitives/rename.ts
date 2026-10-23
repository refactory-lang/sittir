export interface RenamePlaceholder {
	readonly __sittirPlaceholder: 'rename';
	readonly to: string;
}

export function isRenamePlaceholder(v: unknown): v is RenamePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'rename';
}

export function rename(to: string): RenamePlaceholder {
	return { __sittirPlaceholder: 'rename' as const, to };
}

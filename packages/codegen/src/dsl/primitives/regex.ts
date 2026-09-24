export interface RegexPlaceholder {
	readonly __sittirPlaceholder: 'regex';
	readonly source: string;
}

export function isRegexPlaceholder(v: unknown): v is RegexPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'regex';
}

export function regex(pattern: RegExp): RegexPlaceholder {
	return { __sittirPlaceholder: 'regex' as const, source: pattern.source };
}

export function baseRulesOf<R>(base: unknown): Record<string, R> | undefined {
	if (!base || typeof base !== 'object') return undefined;
	const grammar = 'grammar' in base ? (base as { grammar?: unknown }).grammar : base;
	if (!grammar || typeof grammar !== 'object') return undefined;
	return (grammar as { rules?: Record<string, R> }).rules;
}

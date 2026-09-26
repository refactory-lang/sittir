import type { RuntimeRule } from '../../types/runtime-shapes.ts';

export interface RulePlaceholder {
	readonly __sittirPlaceholder: 'rule';
	readonly name: string;
	readonly body: ($: Record<string, RuntimeRule>) => RuntimeRule;
}

export function isRulePlaceholder(v: unknown): v is RulePlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'rule';
}

export function rule(name: string, body: RulePlaceholder['body']): RulePlaceholder {
	return { __sittirPlaceholder: 'rule' as const, name, body };
}

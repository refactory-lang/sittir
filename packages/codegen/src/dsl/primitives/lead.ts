import type { LeadMatch } from '../verbs/effects.ts';

export interface LeadPlaceholder {
	readonly __sittirPlaceholder: 'lead';
	readonly item: string;
	readonly field: string;
	readonly admits: readonly LeadMatch[];
}

export function isLeadPlaceholder(v: unknown): v is LeadPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'lead';
}

export function lead(item: string, field: string, ...admits: LeadMatch[]): LeadPlaceholder {
	return { __sittirPlaceholder: 'lead' as const, item, field, admits };
}

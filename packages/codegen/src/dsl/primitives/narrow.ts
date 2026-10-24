import type { LeadMatch, LeadWithin } from '../verbs/effects.ts';
import type { NarrowDirection } from '../verbs/narrow.ts';

export interface NarrowPlaceholder {
	readonly __sittirPlaceholder: 'narrow';
	readonly direction: NarrowDirection;
	readonly admits: readonly LeadMatch[];
}

export function isNarrowPlaceholder(v: unknown): v is NarrowPlaceholder {
	return !!v && typeof v === 'object' && (v as { __sittirPlaceholder?: unknown }).__sittirPlaceholder === 'narrow';
}

function narrowing(direction: NarrowDirection): (...admits: LeadMatch[]) => NarrowPlaceholder {
	return (...admits) => ({ __sittirPlaceholder: 'narrow' as const, direction, admits });
}

export const narrow: ((...admits: LeadMatch[]) => NarrowPlaceholder) & { readonly except: (...admits: LeadMatch[]) => NarrowPlaceholder } = Object.assign(
	narrowing('keep'),
	{ except: narrowing('except') }
);

function withinOf(kind: string, within: readonly LeadMatch[] | Readonly<Record<string, readonly LeadMatch[]>>): LeadWithin {
	if (Array.isArray(within)) return { field: null, admits: within };
	const entries = Object.entries(within as Readonly<Record<string, readonly LeadMatch[]>>);
	const [entry] = entries;
	if (entry === undefined || entries.length > 1) throw new Error(`match: '${kind}' restricts one field, not ${entries.length}`);
	return { field: entry[0], admits: entry[1] };
}

export function match(kind: string, within?: readonly LeadMatch[] | Readonly<Record<string, readonly LeadMatch[]>>, as?: string): LeadMatch {
	return { kind, ...(within === undefined ? {} : { within: withinOf(kind, within) }), ...(as === undefined ? {} : { as }) };
}

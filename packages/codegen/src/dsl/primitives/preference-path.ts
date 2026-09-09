import { splitSegments, type PathSegment } from '../transform/transform-path.ts';

export type PreferenceSegment = PathSegment | { readonly kind: 'name'; readonly name: string };

export const SIDE_SEGMENTS = ['before', 'after', 'separator'] as const;
export type SideSegment = (typeof SIDE_SEGMENTS)[number];

export function isSideSegment(segment: PreferenceSegment): boolean {
	return segment.kind === 'name' && (SIDE_SEGMENTS as readonly string[]).includes(segment.name);
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parsePreferencePath(text: string): PreferenceSegment[] {
	if (text.length === 0) throw new Error('preference path: must not be empty');
	return splitSegments(text).map((part) => parseSegment(part, text));
}

function parseSegment(part: string, text: string): PreferenceSegment {
	if (part.length >= 2 && part.startsWith('"') && part.endsWith('"')) {
		return { kind: 'literal', text: part.slice(1, -1) };
	}
	if (part === '_') return { kind: 'wildcard' };
	if (part === '(_)') return { kind: 'kind-match', name: '_' };
	if (/^-?\d+$/.test(part)) return { kind: 'index', value: Number(part) };
	if (part.startsWith('(') && part.endsWith(')') && IDENTIFIER.test(part.slice(1, -1))) {
		return { kind: 'kind-match', name: part.slice(1, -1) };
	}
	if (part.endsWith(':') && IDENTIFIER.test(part.slice(0, -1))) {
		return { kind: 'fieldName', name: part.slice(0, -1) };
	}
	if (IDENTIFIER.test(part)) return { kind: 'name', name: part };
	throw new Error(
		`preference path: invalid segment '${part}' in '${text}' — must be an index, '_', '(kind)', 'field:', '"literal"' or a bare name`
	);
}

export function formatPreferencePath(segments: readonly PreferenceSegment[]): string {
	return segments.map(formatSegment).join('/');
}

function formatSegment(segment: PreferenceSegment): string {
	switch (segment.kind) {
		case 'index':
			return String(segment.value);
		case 'wildcard':
			return '_';
		case 'literal':
			return `"${segment.text}"`;
		case 'kind-match':
			return `(${segment.name})`;
		case 'fieldName':
			return `${segment.name}:`;
		case 'name':
			return segment.name;
	}
}

const SEGMENT_ORDER: Record<PreferenceSegment['kind'], number> = {
	wildcard: 0,
	index: 1,
	fieldName: 2,
	'kind-match': 3,
	literal: 4,
	name: 5
};

function sideRank(segment: PreferenceSegment): number {
	return segment.kind === 'name' ? (SIDE_SEGMENTS as readonly string[]).indexOf(segment.name) : -1;
}

export function comparePreferencePaths(
	a: readonly PreferenceSegment[],
	b: readonly PreferenceSegment[]
): number {
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		const cmp = compareSegment(a[i]!, b[i]!);
		if (cmp !== 0) return cmp;
	}
	return a.length - b.length;
}

function compareSegment(a: PreferenceSegment, b: PreferenceSegment): number {
	const sideA = sideRank(a);
	const sideB = sideRank(b);
	if (sideA >= 0 || sideB >= 0) {
		if (sideA >= 0 && sideB >= 0) return sideA - sideB;
		return sideA >= 0 ? 1 : -1;
	}
	if (a.kind !== b.kind) return SEGMENT_ORDER[a.kind] - SEGMENT_ORDER[b.kind];
	switch (a.kind) {
		case 'index':
			return a.value - (b as { value: number }).value;
		case 'wildcard':
			return 0;
		case 'literal':
			return compareText(a.text, (b as { text: string }).text);
		default:
			return compareText(a.name, (b as { name: string }).name);
	}
}

function compareText(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0;
}

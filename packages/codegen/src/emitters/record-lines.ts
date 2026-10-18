import { compareOrdinal } from './shared.ts';

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

export function printRecordLines(value: unknown): string {
	return `${printBlock(value as Json, 0)}\n`;
}

function printBlock(value: Json, depth: number): string {
	if (Array.isArray(value)) return printLines('[', ']', (value as readonly Json[]).map((item) => JSON.stringify(item)), depth);
	if (!isObject(value)) return JSON.stringify(value);
	const entries = Object.entries(value);
	if (depth === 0 || entries.some(([, item]) => Array.isArray(item))) {
		return printLines('{', '}', entries.map(([key, item]) => `${JSON.stringify(key)}: ${printBlock(item, depth + 1)}`), depth);
	}
	return printLines(
		'{',
		'}',
		entries.sort(([a], [b]) => compareOrdinal(a, b)).map(([key, item]) => `${JSON.stringify(key)}: ${JSON.stringify(item)}`),
		depth
	);
}

function printLines(open: string, close: string, lines: readonly string[], depth: number): string {
	if (lines.length === 0) return `${open}${close}`;
	const indent = '\t'.repeat(depth + 1);
	return `${open}\n${lines.map((line) => indent + line).join(',\n')}\n${'\t'.repeat(depth)}${close}`;
}

function isObject(value: Json): value is { readonly [key: string]: Json } {
	return typeof value === 'object' && value !== null;
}

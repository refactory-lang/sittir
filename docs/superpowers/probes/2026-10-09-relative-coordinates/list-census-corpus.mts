// The list census over every corpus entry: each list storage key a grammar's types mark optional,
// counted on every node a full-depth read returns, as absent, empty or holding items.
// Run from a checkout root: pnpm exec tsx docs/superpowers/probes/2026-10-09-relative-coordinates/list-census-corpus.mts
import { readdirSync, readFileSync } from 'node:fs';
import { createEngine } from '@sittir/common';
import python from '@sittir/python';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';
import { loadCorpusEntries } from '../../../../packages/tools/src/validate/common.ts';

function optionalListKeys(grammar: string): Map<number, readonly string[]> {
	const types = readFileSync(`packages/${grammar}/src/types.ts`, 'utf-8');
	const ids = new Map<string, number>();
	for (const name of readdirSync(`packages/${grammar}/src`)) {
		if (!name.endsWith('.ts')) continue;
		for (const [, kind, value] of readFileSync(`packages/${grammar}/src/${name}`, 'utf-8').matchAll(/\b(\w+) = (\d+)/g)) {
			if (!ids.has(kind!)) ids.set(kind!, Number(value));
		}
	}
	const out = new Map<number, readonly string[]>();
	for (const [, , kind, body] of types.matchAll(/export interface (\w+) \{\n\s+readonly \$type: TSKindId\.(\w+);([\s\S]*?)\n\}/g)) {
		const keys = [...body!.matchAll(/readonly (_\w+)\?: (?:readonly|NonEmptyArray)/g)].map((match) => match[1]!);
		const id = ids.get(kind!);
		if (keys.length > 0 && id !== undefined) out.set(id, keys);
	}
	return out;
}

for (const [grammar, descriptor] of [['python', python], ['rust', rust], ['typescript', typescript]] as const) {
	const engine = await createEngine(descriptor);
	const wanted = optionalListKeys(grammar);
	const counts = { absent: 0, empty: 0, items: 0 };
	const absentAt = new Map<string, number>();
	const seen = new WeakSet<object>();
	const walk = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const child of value) walk(child);
			return;
		}
		if (value === null || typeof value !== 'object' || seen.has(value)) return;
		seen.add(value);
		const record = value as { readonly $type?: unknown } & Record<string, unknown>;
		for (const key of typeof record.$type === 'number' ? (wanted.get(record.$type) ?? []) : []) {
			const stored = record[key];
			if (stored === undefined) {
				counts.absent++;
				const label = `${record.$type}.${key}`;
				absentAt.set(label, (absentAt.get(label) ?? 0) + 1);
			} else if (Array.isArray(stored) && stored.length === 0) counts.empty++;
			else counts.items++;
		}
		for (const key of Object.keys(record)) if (key.startsWith('_')) walk(record[key]);
	};
	let entries = 0;
	for (const entry of loadCorpusEntries(grammar)) {
		entries++;
		walk(engine.parse(entry.source, { depth: Infinity }));
	}
	console.log(grammar, 'entries:', entries, 'optional list keys:', [...wanted.values()].reduce((n, keys) => n + keys.length, 0), counts, Object.fromEntries(absentAt));
}

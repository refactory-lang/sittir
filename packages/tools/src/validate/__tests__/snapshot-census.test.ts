import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEngine, snapshotOf } from '@sittir/common';
import { languageByName } from '../../languages.ts';
import { loadCorpusEntries } from '../common.ts';

/**
 * Where a snapshot render still differs from the live render of the same untouched read, per
 * corpus entry. Each entry's first differing line is recorded with its class: `edge` when the two
 * renders differ only in their leading or trailing whitespace, `whitespace` when they differ only in
 * whitespace, `text` otherwise, and `error` when the snapshot or its render throws. A grammar may
 * not differ on an entry the committed census does not name, and no entry may throw;
 * `SNAPSHOT_CENSUS_WRITE=1` rewrites the census.
 */
const REPO = join(import.meta.dirname, '../../../../..');
const CENSUS = join(REPO, 'docs/superpowers/probes/2026-10-09-relative-coordinates/snapshot-census.json');
const GRAMMARS = ['rust', 'typescript', 'python', 'scm', 'regex'] as const;
const WHOLE = { deep: true, depth: Infinity };

interface Difference {
	readonly entry: string;
	readonly line: number;
	readonly class: 'edge' | 'whitespace' | 'text' | 'error';
	readonly live: string;
	readonly snapshot: string;
}

function firstDifference(entry: string, live: string, snapshot: string): Difference | undefined {
	if (live === snapshot) return undefined;
	const a = live.split('\n');
	const b = snapshot.split('\n');
	let line = 0;
	while (line < a.length && line < b.length && a[line] === b[line]) line++;
	const bare = (text: string): string => text.replace(/\s+/g, '');
	const kind = live.trim() === snapshot.trim() ? 'edge' : bare(live) === bare(snapshot) ? 'whitespace' : 'text';
	return { entry, line, class: kind, live: a[line] ?? '<end>', snapshot: b[line] ?? '<end>' };
}

async function census(grammar: string): Promise<Difference[]> {
	const engine = await createEngine(await languageByName(grammar));
	const out: Difference[] = [];
	for (const { name, source } of loadCorpusEntries(grammar)) {
		try {
			const root = engine.parse(source, WHOLE);
			const found = firstDifference(name, engine.render(root).toString(), engine.render(snapshotOf(root)).toString());
			if (found !== undefined) out.push(found);
		} catch (error) {
			out.push({ entry: name, line: -1, class: 'error', live: '', snapshot: String((error as Error).message).split('\n')[0]! });
		}
	}
	return out;
}

describe('snapshot census', () => {
	it.each(GRAMMARS)('%s: a snapshot render differs on no more entries than the census names', async (grammar) => {
		const differences = await census(grammar);
		const committed = existsSync(CENSUS) ? (JSON.parse(readFileSync(CENSUS, 'utf8')) as Record<string, Difference[]>) : {};
		if (process.env.SNAPSHOT_CENSUS_WRITE === '1') {
			const next = existsSync(CENSUS) ? (JSON.parse(readFileSync(CENSUS, 'utf8')) as Record<string, Difference[]>) : {};
			next[grammar] = differences;
			writeFileSync(CENSUS, `${JSON.stringify(next, null, '\t')}\n`);
			return;
		}
		const named = new Set((committed[grammar] ?? []).map((d) => d.entry));
		expect(differences.filter((d) => !named.has(d.entry))).toEqual([]);
		expect(differences.filter((d) => d.class === 'error')).toEqual([]);
	}, 600_000);
});

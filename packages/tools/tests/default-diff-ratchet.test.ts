import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultDiff } from '../src/exercise/default-diff.ts';

const PACKAGE = fileURLToPath(new URL('..', import.meta.url));
const CEILINGS: Readonly<Record<string, number>> = JSON.parse(readFileSync(join(PACKAGE, 'default-diff-ceilings.json'), 'utf8'));

async function differingGaps(grammar: string): Promise<number> {
	const dir = join(PACKAGE, 'tests', 'idiomatic', grammar);
	let differing = 0;
	for (const file of readdirSync(dir).sort()) {
		const report = await defaultDiff(grammar, readFileSync(join(dir, file), 'utf8'), { attribute: false });
		differing += report.differing;
	}
	return differing;
}

describe.each(Object.entries(CEILINGS))('the %s defaults rebuild its idiomatic corpus with at most %i differing gaps', (grammar, ceiling) => {
	it('stays at or below the committed ceiling, which only shrinks', async () => {
		const differing = await differingGaps(grammar);
		expect(
			differing,
			`${grammar}: ${differing} differing gaps against a ceiling of ${ceiling}; fix the defaults, never raise the ceiling`
		).toBeLessThanOrEqual(ceiling);
	}, 120_000);
});

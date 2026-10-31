import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const fixture = fileURLToPath(new URL('../../common/tests/fixtures/nested-tuple-read.mts', import.meta.url));
const LEVELS = 10_000;

describe.each(['objects', 'records'])('a type nesting tuple types %s', (construction) => {
	it(`reads ${LEVELS} levels deep at the default depth, each read bounded below where it starts`, () => {
		const out = execFileSync(process.execPath, ['--import', 'tsx', fixture, construction, String(LEVELS)], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({ walked: LEVELS, innermost: 'u8' });
	}, 120_000);
});

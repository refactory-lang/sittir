import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const fixture = fileURLToPath(new URL('../../common/tests/fixtures/chunk-reuse.mts', import.meta.url));

describe('a record chunk the pool hands to another tree', () => {
	it('is never read through a view of the tree that released it', () => {
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native', SITTIR_CHUNK_POOL: '1' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({
			reused: true,
			bufferWords: true,
			bufferEmpty: true,
			staleRead: expect.stringMatching(/^throws: .*tree \d+ is not live/),
			secondName: 'b0'
		});
	}, 60_000);
});

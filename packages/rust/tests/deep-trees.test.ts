import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const fixture = fileURLToPath(new URL('../../common/tests/fixtures/deep-tree.mts', import.meta.url));
const LEVELS = [2_000, 4_000, 10_000];

interface Exit {
	status: number | null;
	signal: NodeJS.Signals | null;
	outcome: unknown;
}

function runCase(...args: string[]): Promise<Exit> {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ['--import', 'tsx', fixture, ...args], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			env: { ...process.env, SITTIR_BACKEND: 'native' },
			stdio: ['ignore', 'pipe', 'inherit']
		});
		let out = '';
		child.stdout.setEncoding('utf8').on('data', (chunk: string) => (out += chunk));
		child.once('error', reject);
		child.once('close', (status, signal) => {
			const last = out.trim().split('\n').at(-1);
			resolve({ status, signal, outcome: last ? JSON.parse(last) : undefined });
		});
	});
}

const cells = (['object', 'arena'] as const).flatMap((storage) =>
	(['render', 'read'] as const).flatMap((side) =>
		(['main', 'worker'] as const).flatMap((thread) => LEVELS.map((levels) => ({ storage, side, thread, levels })))
	)
);

describe('a tree nested thousands of levels deep', () => {
	it.concurrent.each(cells)(
		'$side on $storage storage, $levels levels on the $thread thread, succeeds',
		async ({ storage, side, thread, levels }) => {
			const { status, signal, outcome } = await runCase(storage, side, String(levels), thread);
			expect({ status, signal }).toEqual({ status: 0, signal: null });
			expect(outcome).toEqual({ ok: true });
		},
		120_000
	);

	it('decodes and releases a wire value 100000 levels deep on a Worker', async () => {
		expect(await runCase('object', 'decode', '100000', 'worker')).toEqual({
			status: 0,
			signal: null,
			outcome: { ok: true }
		});
	}, 120_000);

	it('refuses a malformed item after one 400000 levels deep on a Worker, and releases what it decoded', async () => {
		const { status, signal, outcome } = await runCase('object', 'refuse', '400000', 'worker');
		expect({ status, signal }).toEqual({ status: 0, signal: null });
		expect(outcome).toEqual({
			ok: false,
			refusal: expect.stringMatching(/^Error: Failed to convert napi value String into rust type `f64` on ExpressionsNode\._item on TupleExpressionNode\._elements on /)
		});
	}, 120_000);
});

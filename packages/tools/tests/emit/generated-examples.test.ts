import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { DOGFOOD_REBUILDS } from '../../src/emit/dogfood-targets.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
describe('generated dogfood rebuilds', () => {
	for (const { grammar, source, exportName, file, surface } of DOGFOOD_REBUILDS) {
		it(`${file} is a fresh ${surface} emit of ${source} (modulo formatting)`, async () => {
			const fresh = await emitFactorySourceText(grammar, readFileSync(ROOT + source, 'utf8'), exportName, { surface });
			const checkedIn = readFileSync(ROOT + file, 'utf8');
			const norm = (s: string) => s.replace(/\s+/g, '').replace(/,([)\]}])/g, '$1');
			expect(norm(checkedIn)).toBe(norm(fresh));
		});
	}
	it('type errors do not exceed the recorded ceiling', () => {
		const ceiling = JSON.parse(readFileSync(ROOT + 'examples/generated-typecheck-ceiling.json', 'utf8')) as Record<
			string,
			number
		>;
		let out = '';
		try {
			out = execFileSync('pnpm', ['run', 'type-check:generated-examples'], { cwd: ROOT, encoding: 'utf8' });
		} catch (e) {
			const failure = e as { status?: number | null; stdout?: string };
			out = String(failure.stdout ?? '');
			if (failure.status !== 1 || !out.includes('error TS')) throw e;
		}
		const errorLines = out.split('\n').filter((l) => l.includes('error TS'));
		for (const line of errorLines) {
			expect(
				Object.keys(ceiling).some((file) => line.includes(file)),
				line
			).toBe(true);
		}
		for (const [file, max] of Object.entries(ceiling)) {
			const count = errorLines.filter((l) => l.includes(file)).length;
			expect(count, file).toBeLessThanOrEqual(max);
		}
	}, 120_000);
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const CASES = [
	['rust', 'rust/crates/sittir-core/src/splice.rs', 'rebuildSpliceGenerated', 'examples/17-dogfood-rust.generated.ts'],
	['typescript', 'packages/common/src/format.ts', 'rebuildFormatGenerated', 'examples/18-dogfood-typescript.generated.ts'],
	[
		'python',
		'tests/format-roundtrip/fixtures/python-4space.py',
		'rebuildPython4spaceGenerated',
		'examples/19-dogfood-python.generated.ts'
	]
] as const;

describe('generated dogfood rebuilds', () => {
	for (const [grammar, target, exportName, generated] of CASES) {
		it(`${generated} is a fresh emit of ${target} (modulo formatting)`, async () => {
			const fresh = await emitFactorySourceText(grammar, readFileSync(ROOT + target, 'utf8'), exportName);
			const checkedIn = readFileSync(ROOT + generated, 'utf8');
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
			expect(Object.keys(ceiling).some((file) => line.includes(file)), line).toBe(true);
		}
		for (const [file, max] of Object.entries(ceiling)) {
			const count = errorLines.filter((l) => l.includes(file)).length;
			expect(count, file).toBeLessThanOrEqual(max);
		}
	}, 120_000);
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { DOGFOOD_REBUILDS } from '../../src/emit/dogfood-targets.ts';
import { expectWithinTypecheckCeiling, typeCheckErrorLines } from '../../../codegen/src/__tests__/helpers/typecheck-ceiling.ts';

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
		expectWithinTypecheckCeiling(
			typeCheckErrorLines(['run', 'type-check:generated-examples'], ROOT),
			ROOT + 'examples/generated-typecheck-ceiling.json'
		);
	}, 120_000);
});

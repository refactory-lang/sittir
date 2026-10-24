import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { GENERATED_REBUILDS, REBUILD_SETS } from '../../src/emit/dogfood-targets.ts';
import { expectWithinTypecheckCeiling, typeCheckErrorLines } from '../../../codegen/src/__tests__/helpers/typecheck-ceiling.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
describe('generated rebuilds', () => {
	for (const { grammar, source, exportName, file, surface } of GENERATED_REBUILDS) {
		it(`${file} is a fresh ${surface} emit of ${source} (modulo formatting)`, async () => {
			const fresh = await emitFactorySourceText(grammar, readFileSync(ROOT + source, 'utf8'), exportName, { surface });
			const checkedIn = readFileSync(ROOT + file, 'utf8');
			const norm = (s: string) => s.replace(/\s+/g, '').replace(/,([)\]}])/g, '$1');
			expect(norm(checkedIn)).toBe(norm(fresh));
		});
	}
	for (const set of REBUILD_SETS) {
		it(`${set.dir} holds exactly its own rebuilds, each under its type-check ceiling`, () => {
			const generated = readdirSync(ROOT + set.dir).filter((name) => name.endsWith('.generated.ts'));
			const own = GENERATED_REBUILDS.filter((rebuild) => rebuild.file.startsWith(`${set.dir}/`)).map((rebuild) => rebuild.file.slice(set.dir.length + 1));
			expect(generated.sort()).toEqual(own.sort());
			const ceiling = JSON.parse(readFileSync(ROOT + set.ceiling, 'utf8')) as Record<string, unknown>;
			expect(Object.keys(ceiling).sort()).toEqual(own.sort());
			expectWithinTypecheckCeiling(typeCheckErrorLines(['run', set.typeCheckScript], ROOT), ROOT + set.ceiling);
		}, 120_000);
	}
});

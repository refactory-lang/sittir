import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const extractParityFixtures = vi.fn();

vi.mock('../validate/parity-fixtures.ts', () => ({
	extractParityFixtures: (...args: unknown[]) => extractParityFixtures(...args),
	serializeFixtures: (fixtures: unknown[]) => JSON.stringify(fixtures, null, 2) + '\n',
	fixturesOutputPath: () => fxPath
}));

import { emitParityFixtures } from '../post-generate.ts';

function makeTmp(): string {
	return mkdtempSync(join(tmpdir(), 'sittir-post-generate-'));
}

let tmp: string;
let fxPath: string;

describe('emitParityFixtures', () => {
	beforeEach(() => {
		tmp = makeTmp();
		fxPath = join(tmp, 'test-fixtures.json');
		extractParityFixtures.mockReset();
	});

	afterEach(() => {
		rmSync(tmp, { recursive: true, force: true });
	});

	it('refuses to overwrite a non-trivial committed fixture set with a zero-candidate extraction', async () => {
		const existing = [{ kind: 'render' }, { kind: 'roundtrip' }];
		writeFileSync(fxPath, JSON.stringify(existing, null, 2) + '\n');
		extractParityFixtures.mockResolvedValue({
			grammar: 'rust',
			fixtures: [],
			renderCount: 0,
			roundTripCount: 0,
			coveredKinds: new Set(),
			warnings: []
		});

		await expect(emitParityFixtures('rust', tmp)).rejects.toThrow(/refusing to overwrite/);

		// The committed file must be untouched — not clobbered with `[]`.
		expect(JSON.parse(readFileSync(fxPath, 'utf8'))).toEqual(existing);
	});

	it('writes a fresh extraction over an existing fixture set when candidates are found', async () => {
		writeFileSync(fxPath, JSON.stringify([{ kind: 'render' }], null, 2) + '\n');
		const fresh = [{ kind: 'render' }, { kind: 'roundtrip' }];
		extractParityFixtures.mockResolvedValue({
			grammar: 'rust',
			fixtures: fresh,
			renderCount: 1,
			roundTripCount: 1,
			coveredKinds: new Set(),
			warnings: []
		});

		await emitParityFixtures('rust', tmp);

		expect(JSON.parse(readFileSync(fxPath, 'utf8'))).toEqual(fresh);
	});

	it('allows an empty extraction when no fixture file exists yet (new grammar)', async () => {
		extractParityFixtures.mockResolvedValue({
			grammar: 'rust',
			fixtures: [],
			renderCount: 0,
			roundTripCount: 0,
			coveredKinds: new Set(),
			warnings: []
		});

		await expect(emitParityFixtures('rust', tmp)).resolves.toBeUndefined();
		expect(JSON.parse(readFileSync(fxPath, 'utf8'))).toEqual([]);
	});
});

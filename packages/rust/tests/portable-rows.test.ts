import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { engineOf } from '../../common/src/engine-scope.ts';
import rust from '../src/index.ts';

describe('a rust engine carries its portable rows', () => {
	it('reaches the rows from a node it read', async () => {
		const engine = await createEngine(rust);
		const item = engine.parse('fn f() {}').statements()[0];
		const rows = engineOf(item)?.portable;
		expect(rows?.table.paths['declaration.function']).toBeDefined();
		expect(rows?.querySlots).toBeDefined();
	});

	it('carries the same rows on the portable engine', async () => {
		const engine = await createEngine(rust);
		const portableEngine = await createEngine(rust, { api: 'portable' });
		expect(engine.portable).toBeDefined();
		expect(portableEngine.portable).toBe(engine.portable);
	});
});

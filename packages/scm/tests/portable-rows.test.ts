import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { engineOf } from '../../common/src/engine-scope.ts';
import scm from '../src/index.ts';

describe('an scm engine has no portable rows', () => {
	it('reaches no rows from a node it read, since its grammar has no bindings', async () => {
		const engine = await createEngine(scm);
		const root = engine.parse('(a)\n');
		expect(engineOf(root)).toBeDefined();
		expect(engineOf(root)?.portable).toBeUndefined();
	});
});

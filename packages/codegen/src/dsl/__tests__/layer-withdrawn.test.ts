import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateDsl } from '../../compiler/evaluate.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const chain = (name: string): string => resolve(here, 'fixtures/layer-chain', name);

describe('layerConflicts with a withdrawn bound set', () => {
	it('leaves a set the bound section withdrew out of the top layer conflicts', async () => {
		const evaluated = await evaluateDsl(chain('withdrawing-layer2.ts'));
		expect(evaluated.conflicts).toEqual([]);
	});

	it('keeps the inherited set in the top layer conflicts when the bound section withdrew nothing', async () => {
		const evaluated = await evaluateDsl(chain('plain-layer2.ts'));
		expect(evaluated.conflicts).toEqual([['call_expression', 'binary_expression']]);
	});

	it('does not apply a withdrawal at the first layer, which keeps its own set', async () => {
		const evaluated = await evaluateDsl(chain('withdrawing-layer1.ts'));
		expect(evaluated.conflicts).toEqual([['call_expression', 'binary_expression']]);
	});
});

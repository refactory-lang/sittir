import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../../compiler/evaluate.ts';
import { NO_FILE_TYPES } from '../../compiler/upstream-file-types.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('patch sites are recorded', () => {
	it('records every patches: entry once, by owner kind, path and placeholder form', async () => {
		const raw = await evaluate(resolve(__dirname, '../../__tests__/fixtures/patch-sites-grammar.ts'), NO_FILE_TYPES);
		expect(raw.patchSites).toEqual([
			{ ownerKind: 'host', path: '0', form: 'field', name: 'first' },
			{ ownerKind: 'host', path: '1', form: 'rule', name: 'helper' },
			{ ownerKind: 'pick', path: '1/0', form: 'variant', name: 'left' },
			{ ownerKind: 'pick', path: '1/1', form: 'variant', name: 'right' }
		]);
	});
});

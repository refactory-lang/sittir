import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate } from '../evaluate.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('evaluate carries rule-cause declarations', () => {
	it('drains declared causes and lists bare bodies as undeclared', async () => {
		const raw = await evaluate(resolve(__dirname, '../../__tests__/fixtures/rule-cause-grammar.ts'), NO_FILE_TYPES);
		expect(raw.ruleCauses).toEqual({
			a: { kind: 'reauthored', cause: 'ambiguity' },
			_helper: { kind: 'vocabulary' }
		});
		expect(raw.undeclaredRules).toEqual(['c']);
	});
});

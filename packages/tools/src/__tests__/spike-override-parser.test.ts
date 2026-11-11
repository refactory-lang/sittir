import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { languageAt, treeParser } from '../validate/common.ts';

const pythonSittirDir = join(__dirname, '../../../python/.sittir');
const wasmPath = join(pythonSittirDir, 'parser.wasm');

describe('spike: override-compiled parser', () => {
	it.skipIf(!existsSync(wasmPath))('loads override WASM and parses python', async () => {
		using parser = treeParser(await languageAt(wasmPath));
		using tree = parser.parse('a if b else c');
		const root = tree.root;

		expect(root.type).toBe('module');
		const expr = root.descendantsOfType('expression_statement')[0];
		expect(expr?.type).toBe('expression_statement');
		if (expr === undefined) throw new Error('no expression statement');

		const cond = expr.firstNamedChild;
		if (cond === null) throw new Error('no conditional expression');
		expect(cond.type).toBe('conditional_expression');

		const consequenceField = cond.childForFieldName('consequence');
		const conditionField = cond.childForFieldName('condition');
		const alternativeField = cond.childForFieldName('alternative');

		expect(consequenceField).not.toBeNull();
		expect(conditionField).not.toBeNull();
		expect(alternativeField).not.toBeNull();
		expect(consequenceField!.text).toBe('a');
		expect(conditionField!.text).toBe('b');
		expect(alternativeField!.text).toBe('c');
	});
});

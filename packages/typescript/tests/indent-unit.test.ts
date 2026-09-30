import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('typescript render indent unit', () => {
	it('indents a nested block by the grammar-declared two spaces', () => {
		const inner = ts.build.statementBlock({ statements: [ts.build.expressionStatement(ts.build.identifier('a'))] });
		const outer = ts.build.statementBlock({ statements: [inner] });
		expect(outer.$render()).toBe('{\n  {\n    a;\n  }\n}');
	});
});

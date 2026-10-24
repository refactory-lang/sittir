import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe('a runtime engine holds an options slot to what its storage takes', () => {
	it('refuses a statement passed where the static block takes its options, naming the slot', async () => {
		const ts = await createEngine(typescript, { verifyStructure: 'runtime' });
		const statement = ts.build.expressionStatement.strict(ts.build.identifier('x'));
		const misordered = ts.build.classStaticBlock.strict as (...args: unknown[]) => unknown;
		expect(() => misordered({ terminator: ts.kinds.AutomaticSemicolon }, statement)).toThrow('ClassStaticBlock.terminator: takes a kind id of');
		expect(ts.render(ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(statement))).toString().replace(/\s+/g, ' ')).toContain('static { x; }');
	});
});

import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { scopeBuilders } from '@sittir/common/engine';
import * as raw from '../src/factories/raw.ts';
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

describe('a runtime engine holds a separated list\'s elements to what their storage takes', () => {
	it('refuses a boolean or a function element, through the list builder and through its forwarding owner', async () => {
		const ts = await createEngine(typescript, { verifyStructure: 'runtime' });
		const loose = (builder: unknown) => builder as (...args: unknown[]) => unknown;
		for (const builder of [ts.build.types.strict, ts.build.typeArguments.strict]) {
			expect(() => loose(builder)(false)).toThrow('a strict factory takes a built node, not a boolean');
			expect(() => loose(builder)(() => 1)).toThrow('a strict factory takes a built node, not a function');
		}
	});
});

describe('a runtime engine holds an alias envelope\'s content to what its storage takes', () => {
	it('refuses a boolean, a function or a string where an alias holds a built node', async () => {
		const ts = await createEngine(typescript, { verifyStructure: 'runtime' });
		const { buildTypeIdentifier } = scopeBuilders(ts, raw);
		const loose = buildTypeIdentifier as unknown as (...args: unknown[]) => unknown;
		expect(() => loose(false)).toThrow('TypeIdentifier.content: a strict factory takes a built node, not a boolean');
		expect(() => loose(() => 1)).toThrow('TypeIdentifier.content: a strict factory takes a built node, not a function');
		expect(ts.render(buildTypeIdentifier(ts.build.identifier('T'))).toString()).toBe('T');
	});
});

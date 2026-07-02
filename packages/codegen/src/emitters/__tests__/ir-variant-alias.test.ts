import { describe, expect, it } from 'vitest';
import type { NodeMap } from '../../compiler/types.ts';
import { emitIr } from '../ir.ts';

describe('ir emitter — polymorph variant alias casing', () => {
	it('emits camelCase aliases for snake_case polymorph forms', () => {
		const nodeMap = {
			nodes: new Map([
				[
					'expression_statement',
					{
						kind: 'expression_statement',
						modelType: 'polymorph',
						irKey: 'expressionStatement',
						rawFactoryName: 'expressionStatement',
						fromFunctionName: 'expressionStatementFrom',
						forms: [
							{
								name: 'with_semi',
								rawFactoryName: 'expressionStatementWithSemi',
								fromFunctionName: 'expressionStatementWithSemiFrom',
							},
							{
								name: 'block_ending',
								rawFactoryName: 'expressionStatementBlockEnding',
								fromFunctionName: 'expressionStatementBlockEndingFrom',
							},
						],
					},
				],
			]),
		} as unknown as NodeMap;

		const irSrc = emitIr({ grammar: 'synth', nodeMap });

		expect(irSrc).toContain('"withSemi": _attach(F.expressionStatementWithSemi, { from: FR.expressionStatementWithSemiFrom })');
		expect(irSrc).toContain('"blockEnding": _attach(F.expressionStatementBlockEnding, { from: FR.expressionStatementBlockEndingFrom })');
		expect(irSrc).not.toContain('"with_semi":');
		expect(irSrc).not.toContain('"block_ending":');
	});
});

import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { emitTypes } from '../types.ts';

describe('list storage in the emitted types', () => {
	let types: string;

	beforeAll(async () => {
		const generatedIdTables = await loadGeneratedIdTables('python');
		const { nodeMap } = await compileGrammar({ package: grammarPackage('python'), generatedIdTables });
		types = emitTypes({ grammar: 'python', nodeMap, generatedIdTables });
	}, FULL_PIPELINE_TIMEOUT);

	it('types a list storage key as an array, never optional', () => {
		expect(types).toContain('readonly _handlers: readonly (ExceptClause)[];');
		expect(types).toContain('readonly _decorator: NonEmptyArray<Decorator>;');
		expect(types).not.toMatch(/readonly _\w+\?: (readonly|NonEmptyArray)/);
	});

	it('proves a non-empty list refuses the empty list on its strict, loose and $with surfaces', () => {
		expect(types).toContain(
			'  type NonEmptySlots = Proven<[KeyRefusesEmpty<Config, "decorators">, KeyRefusesEmpty<LooseConfig, "decorators">, SetterRefusesEmpty<Bound, "decorators">]>;'
		);
	});
});

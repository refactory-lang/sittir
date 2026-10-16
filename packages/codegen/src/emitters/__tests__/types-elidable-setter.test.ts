import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { emitTypes } from '../types.ts';

describe('the $with setter of an elidable list slot', () => {
	let types: string;

	beforeAll(async () => {
		const generatedIdTables = await loadGeneratedIdTables('typescript');
		const { nodeMap } = await compileGrammar({ package: grammarPackage('typescript'), generatedIdTables });
		types = emitTypes({ grammar: 'typescript', nodeMap, generatedIdTables });
	}, FULL_PIPELINE_TIMEOUT);

	it('takes a hole where the reader returns one', () => {
		expect(types).toContain('readonly elements: SlotHint<((T.Expression | T.SpreadElement) | undefined)[], false, true>;');
	});

	it('leaves a list whose positions cannot be blank without undefined', () => {
		expect(types).toContain('readonly statements: SlotHint<T.Statement[], false, true>;');
		expect(types).not.toMatch(/readonly \w+: SlotHint<T\.Statement[^;]*undefined/);
	});
});

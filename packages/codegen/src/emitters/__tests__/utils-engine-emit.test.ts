import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../client-utils.ts';
import { grammarTypeMapName } from '../engine.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('utils runtime binding emission', () => {
	it('emits the trivia facts and binds the runtime to the grammar type map', () => {
		const contents = emitClientUtils({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain("import { bindRuntime } from '@sittir/common/utils';");
		expect(contents).toContain('export const triviaFacts = Object.freeze({');
		expect(contents).toContain('} satisfies TriviaFacts);');
		expect(contents).toContain(
			`export const { isNode, withMethods } = bindRuntime<${grammarTypeMapName('synth')}>();`
		);
		expect(contents).not.toContain('methodsEngine');
	});

	it('emits no grammar-free helper body and no type re-export', () => {
		const contents = emitClientUtils({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

		expect(contents).not.toMatch(
			/export function (bundle|hoist|hoistRoutes|rejectBareText|rejectKeywordText|admitAliasContent|coerceMixedEnumStorage|coerceKindEnumStorage|isNodeOfKind|hasKindOf|isTreeNode)\b/
		);
		expect(contents).not.toContain('export type {');
		expect(contents).not.toContain('attachProps');
	});

	it('emits factory and wrap call sites that take no engine argument', () => {
		const nodeMap = makeMinimalNodeMap();
		const factoriesSrc = emitFactories({ grammar: 'synth', nodeMap });
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap });

		expect(factoriesSrc).toContain("import { withMethods } from '../utils.js';");
		expect(factoriesSrc).toMatch(/import \{ withAccessors[^}]*\} from '@sittir\/common\/utils';/);
		expect(factoriesSrc).not.toContain('methodsEngine');
		expect(wrapSrc).toContain("import { withMethods } from './utils.js';");
		expect(wrapSrc).not.toContain('_treeEngine');
		expect(wrapSrc).toContain('inTreeEngine(tree, ');
	});
});

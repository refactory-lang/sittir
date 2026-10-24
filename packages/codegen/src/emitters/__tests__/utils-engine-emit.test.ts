import { collectKindEntries } from '../kind-discriminant.ts';
import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../client-utils.ts';
import { grammarTypeMapName } from '../engine.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { makeMinimalNodeMap, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('utils runtime binding emission', () => {
	it('emits the trivia facts and binds the runtime to the grammar type map', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap);
		const contents = emitClientUtils({ grammar: 'synth', nodeMap, kindEntries: collectKindEntries(nodeMap, generatedIdTables) });

		expect(contents).toContain("import { bindRuntime } from '@sittir/common/utils';");
		expect(contents).toContain('export const triviaFacts = Object.freeze({');
		expect(contents).toContain('} satisfies TriviaFacts<TSKindId>);');
		expect(contents).toContain("import type { TSKindId } from './kinds.js';");
		expect(contents).toContain(
			`export const { isNode } = bindRuntime<${grammarTypeMapName('synth')}>();`
		);
		expect(contents).not.toContain('methodsEngine');
	});

	it('emits no grammar-free helper body and no type re-export', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeMinimalNodeMap);
		const contents = emitClientUtils({ grammar: 'synth', nodeMap, kindEntries: collectKindEntries(nodeMap, generatedIdTables) });

		expect(contents).not.toMatch(
			/export function (bundle|hoist|hoistRoutes|rejectBareText|rejectKeywordText|admitAliasContent|coerceMixedEnumStorage|coerceKindEnumStorage|isNodeOfKind|hasKindOf|isTreeNode)\b/
		);
		expect(contents).not.toContain('export type {');
		expect(contents).not.toContain('attachProps');
	});

	it('emits factory and wrap call sites that take no engine argument', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables((kindEntries) => makeMinimalNodeMap(kindEntries));
		const factoriesSrc = emitFactories({ generatedIdTables, grammar: 'synth', nodeMap });
		const wrapSrc = emitWrap({ generatedIdTables, grammar: 'synth', nodeMap });

		expect(factoriesSrc).not.toContain('withMethods');
		expect(factoriesSrc).toMatch(/import \{ currentHandle[^}]*\} from '@sittir\/common\/utils';/);
		expect(factoriesSrc).not.toContain('methodsEngine');
		expect(wrapSrc).not.toContain('withMethods');
		expect(wrapSrc).toContain('currentHandle');
		expect(wrapSrc).not.toContain('_treeEngine');
		expect(wrapSrc).toContain('inTreeEngine(tree, ');
	});
});

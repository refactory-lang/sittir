import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../client-utils.ts';
import { grammarTypeMapName } from '../engine.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('utils runtime binding emission', () => {
	it('emits the grammar facts and binds the runtime to the grammar type map', () => {
		const contents = emitClientUtils({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain("import { bindRuntime } from '@sittir/common/utils';");
		expect(contents).toContain('export const methodsEngine = {');
		expect(contents).toContain('} satisfies GrammarFacts;');
		expect(contents).toContain(
			`export const { isNode, isEmpty, withMethods } = bindRuntime<${grammarTypeMapName('synth')}>(methodsEngine);`
		);
	});

	it('emits no grammar-free helper body and no type re-export', () => {
		const contents = emitClientUtils({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

		expect(contents).not.toMatch(
			/export function (bundle|hoist|hoistRoutes|rejectBareText|rejectKeywordText|admitAliasContent|coerceMixedEnumStorage|coerceKindEnumStorage|isNodeOfKind|hasKindOf|isTreeNode)\b/
		);
		expect(contents).not.toContain('export type {');
		expect(contents).not.toContain('attachProps');
	});

	it('emits factory and wrap call sites with an explicit engine argument', () => {
		const nodeMap = makeMinimalNodeMap();
		const factoriesSrc = emitFactories({ grammar: 'synth', nodeMap });
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap });

		expect(factoriesSrc).toContain("import { withMethods, methodsEngine } from '../utils.js';");
		expect(factoriesSrc).toMatch(/import \{ withAccessors[^}]*\} from '@sittir\/common\/utils';/);
		expect(factoriesSrc).toContain('}, methodsEngine);');
		expect(wrapSrc).toContain("import { withMethods, methodsEngine } from './utils.js';");
		expect(wrapSrc).toContain('}, _treeEngine(tree));');
	});
});

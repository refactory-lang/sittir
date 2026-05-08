import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../emitters/client-utils.ts';
import { emitFactories } from '../emitters/factories.ts';
import { emitWrap } from '../emitters/wrap.ts';
import { makeMinimalNodeMap } from './helpers/node-map-fixtures.ts';

describe('utils engine facade emission', () => {
	it('emits a grammar-local methodsEngine plus explicit withMethods(node, engine)', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain("import { withMethods as withCommonMethods");
		expect(contents).toContain("from '@sittir/common/utils'");
		expect(contents).toContain('export const methodsEngine = {');
		expect(contents).toContain('export function withMethods<T extends AnyNodeData>(');
		expect(contents).toContain('engine: typeof methodsEngine');
		expect(contents).toContain('return withCommonMethods(node, engine);');
		expect(contents).not.toContain('$render(this: AnyNodeData): string { return render(this); }');
	});

	it('emits factory and wrap call sites with the explicit methodsEngine argument', () => {
		const nodeMap = makeMinimalNodeMap();
		const factoriesSrc = emitFactories({ grammar: 'synth', nodeMap });
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap });

		expect(factoriesSrc).toContain('import { withMethods, methodsEngine');
		expect(factoriesSrc).toContain('}, methodsEngine);');
		expect(wrapSrc).toContain('import { withMethods, methodsEngine');
		expect(wrapSrc).toContain('}, methodsEngine);');
	});
});

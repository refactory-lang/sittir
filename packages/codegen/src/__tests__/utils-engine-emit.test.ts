import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../emitters/client-utils.ts';
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
});

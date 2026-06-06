import { PATTERN, SEQ, SYMBOL } from '../compiler/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../emitters/client-utils.ts';
import { emitFactories } from '../emitters/factories.ts';
import { emitWrap } from '../emitters/wrap.ts';
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { AssembledNode } from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { makeMinimalNodeMap, makeNodeMapWith } from './helpers/node-map-fixtures.ts';

describe('utils engine facade emission', () => {
	it('emits a grammar-local methodsEngine plus explicit withMethods(node, engine)', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain("import { withMethods as withCommonMethods");
		expect(contents).toContain("from '@sittir/common/utils'");
		expect(contents).toContain('export const methodsEngine = {');
		expect(contents).toContain('export function withMethods<T extends object>(');
		expect(contents).toContain('engine: typeof methodsEngine');
		expect(contents).toContain('return withCommonMethods(node as unknown as T & AnyNodeData, engine)');
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

	it('emits a deprecated no-op native transport seam', () => {
		const wrapperRule: SeqRule = {
			type: SEQ,
			members: [{ type: SYMBOL, name: 'identifier' }]
		};
		const nodes = new Map<string, AssembledNode>();
		nodes.set('wrapper', new AssembledBranch('wrapper', wrapperRule, wrapperRule));
		nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
		const contents = emitClientUtils({ nodeMap: makeNodeMapWith(nodes) });

		expect(contents).toContain('* @deprecated Native transport projection is a no-op.');
		expect(contents).toContain('Wrap already projects');
		expect(contents).toContain('read nodes into transport shape, and factories already store transport-shaped');
		expect(contents).toContain('export function toNativeRenderTransport(node: unknown): unknown {');
		expect(contents).toContain('  return node;');
		expect(contents).not.toContain('projectNativeRenderTransport');
		expect(contents).not.toContain('resolveTransportStorageValue');
		expect(contents).not.toContain('_SINGULAR_NATIVE_CHILDREN_KIND_IDS');
	});
});

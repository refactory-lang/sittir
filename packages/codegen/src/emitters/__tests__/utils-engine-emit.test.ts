import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../client-utils.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('utils engine facade emission', () => {
	it('emits a grammar-local methodsEngine plus explicit withMethods(node, engine)', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain('import { withMethods as withCommonMethods');
		expect(contents).toContain("from '@sittir/common/utils'");
		expect(contents).toContain('export const methodsEngine = {');
		expect(contents).toContain('export function withMethods<T extends object>(');
		expect(contents).toContain('engine: typeof methodsEngine');
		expect(contents).toContain('return withCommonMethods(node as unknown as T & AnyNodeData, engine)');
		expect(contents).not.toContain('$render(this: AnyNodeData): string { return render(this); }');
	});

	it('emits factory and wrap call sites with an explicit engine argument', () => {
		const nodeMap = makeMinimalNodeMap();
		const factoriesSrc = emitFactories({ grammar: 'synth', nodeMap });
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap });

		// Factory-built nodes own their storage outright — the shared engine renders them as-is.
		expect(factoriesSrc).toContain('import { withMethods, withAccessors, methodsEngine');
		expect(factoriesSrc).toContain('}, methodsEngine);');
		// Wrapped nodes carry accessor methods over reader-shaped storage, so they
		// bind the tree-scoped engine that projects to plain data before the boundary.
		expect(wrapSrc).toContain('import { withMethods, methodsEngine');
		expect(wrapSrc).toContain('}, _treeEngine(tree));');
	});

	it("ArgsOf is the union of every declared overload's parameter tuple, not the last one alone", () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain(
			[
				'export type ArgsOf<F> = F extends {',
				'  (...a: infer A): unknown;',
				'  (...b: infer B): unknown;',
				'  (...c: infer C): unknown;',
				'  (...d: infer D): unknown;',
				'}',
				'  ? A | B | C | D'
			].join('\n')
		);
	});

	it('emits bundle() and hoist() beside attachProps()', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain('export function bundle<S, C>(strict: S, coerce: C): FlavorPair<S, C> {');
		expect(contents).toContain(
			'export function hoist<B extends { strict: unknown; coerce?: unknown }>(b: B): Hoisted<B> {'
		);
		expect(contents).toContain('value: hoistRoutes(value),');
		expect(contents).toContain('export function hoistRoutes<B>(b: B): Hoisted<B> {');
		expect(contents).toContain('B extends { strict: infer S }');
	});
});

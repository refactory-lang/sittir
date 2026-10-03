/**
 * Type-level pins for a parsed tree: a statement read from a parse and
 * narrowed by its guard has the tree-bound surface (children are `.Parsed`,
 * `$with` and the node methods exist), and a replaced slot reads as `.Bound`.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}
type ItemOf<I> = I extends Iterable<infer E> ? E : never;

const engine = await createEngine(python);

export function parsedSurface(): string {
	const item = engine.parse('def f():\n    pass\n').statements()[0]!;
	if (!engine.is.functionDefinition(item)) return '';
	expectTrue<Equals<typeof item, T.FunctionDefinition.Parsed>>();
	expectTrue<Equals<ReturnType<typeof item.parameters>, T.Parameters.Parsed>>();
	const edited = item.$with.parameters(engine.build.parameters());
	expectTrue<Equals<ReturnType<typeof edited.$trivia.trailing>, T.FunctionDefinition.Bound>>();
	expectTrue<Equals<ReturnType<typeof edited.parameters>, T.Parameters.Bound>>();
	expectTrue<Equals<ReturnType<typeof edited.body>, T.Suite.Parsed>>();
	return edited.$render();
}

export function renderTakesEveryNodeAUserCanHold(): string {
	const root = engine.parse('def f():\n    pass\n');
	const item = root.statements()[0]!;
	if (!engine.is.functionDefinition(item)) return '';
	const draft = item.$with.parameters(engine.build.parameters());
	return [engine.render(root), engine.render(item), engine.render(draft)].map(String).join('');
}

export function listsReadAsReadonlyArrays(): string {
	const item = engine.parse('def f(a):\n    pass\n').statements()[0]!;
	if (!engine.is.functionDefinition(item)) return '';
	const params = item.parameters();
	type Item = ItemOf<typeof params>;
	const owner: ReadonlyArray<Item> = params;
	const list: ReadonlyArray<Item> | undefined = params.elements();
	const rendered = params.map((param) => (typeof param === 'number' ? '' : param.$render()));
	const first: Item | undefined = params[0];
	return [owner.length, list?.length, rendered.join(','), String(first)].join('');
}

export function aListSlotTakesItsBuilderArguments(): string {
	const item = engine.parse('def f(a):\n    pass\n').statements()[0]!;
	if (!engine.is.functionDefinition(item)) return '';
	const params = item.parameters();
	const fromItems = item.$with.parameters(...params);
	const fromNode = item.$with.parameters(params);
	const inner = params.$with.elements(...params);
	return fromItems.$render() + fromNode.$render() + inner.$render();
}

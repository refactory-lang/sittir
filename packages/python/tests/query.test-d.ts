/**
 * Type-level pins for the query facet: the recorder of a narrowed view has
 * exactly the kind's slots, a union's recorder only the slots every member
 * has, a condition is neither callable nor a predicate, `where` keeps the
 * narrowed type, slot views carry the accessor's item type, and a built node
 * or a draft has no `$query`.
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
const root = engine.parse('def f():\n    pass\n');
const descendants = root.$query().$descendants;
const defs = descendants.ofType(engine.kinds.FunctionDefinition);

export function recorder(): unknown[] {
	return [
		[...defs.where((c) => c.name.eq('main'))],
		[...defs.where((c) => c.returnType.match(/^int$/).and(c.name.eq('f').not()).or(c.parameters.match(/self/)))],
		// @ts-expect-error a slot the kind does not have
		defs.where((c) => c.function.eq('print')),
		// @ts-expect-error over every kind, `name` is not a slot they all share
		descendants.where((c) => c.name.eq('main')),
		// @ts-expect-error a slot is not callable on the recorder
		defs.where((c) => c.name() === 'main'),
		// @ts-expect-error a plain predicate returns a boolean, not a recorded condition
		defs.where((node) => node !== undefined),
		// @ts-expect-error `eq` exists only on the recorder: filter is handed real nodes
		defs.filter((node) => node.name.eq('main')),
		defs.filter((node) => node.name() !== undefined)
	];
}

export function narrowing(): void {
	const found = defs.where((c) => c.name.eq('main')).find();
	expectTrue<Equals<typeof found, T.FunctionDefinition.Parsed | undefined>>();
	// @ts-expect-error `where` keeps the narrowed kind
	const wrong: T.Call.Parsed | undefined = defs.where((c) => c.name.eq('main')).find();
	void wrong;
	const fn = found!;
	expectTrue<Equals<ItemOf<ReturnType<typeof fn.$query>['parameters']>, T.Parameters.Parsed>>();
	expectTrue<
		Equals<ItemOf<ReturnType<typeof engine.query<typeof fn>>['name']>, ItemOf<ReturnType<typeof fn.$query>['name']>>
	>();
	const guarded = descendants.filter((node): node is T.Call.Parsed => node.$type === engine.kinds.Call).find();
	expectTrue<Equals<typeof guarded, T.Call.Parsed | undefined>>();
	const leaf = descendants.ofType(engine.kinds.Identifier).find()!;
	// @ts-expect-error a parsed leaf has no $query member
	leaf.$query();
	expectTrue<Equals<ItemOf<ReturnType<typeof engine.query<typeof leaf>>['$descendants']>, never>>();
}

export function onlyParsedNodesQuery(): void {
	const built = engine.build.parameters();
	// @ts-expect-error a built node has no query facet
	built.$query();
	const fn = defs.find()!;
	const draft = fn.$with.name(engine.build.identifier('z'));
	// @ts-expect-error a draft has no query facet
	draft.$query();
}

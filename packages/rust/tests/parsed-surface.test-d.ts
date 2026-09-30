/**
 * Type-level pins for a parsed tree: a statement read from a parse and
 * narrowed by its guard has the tree-bound surface (children are `.Parsed`,
 * `$with` and the node methods exist), and a replaced slot reads as `.Bound`.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}
type ItemOf<I> = I extends Iterable<infer E> ? E : never;

const rs = await createEngine(rust);

export function parsedSurface(): string {
	const item = rs.parse('fn f() {}\n').statements()[0]!;
	if (!rs.is.functionItem(item)) return '';
	expectTrue<Equals<typeof item, T.FunctionItem.Parsed>>();
	expectTrue<Equals<ReturnType<typeof item.parameters>, T.Parameters.Parsed>>();
	const edited = item.$with.parameters(rs.build.parameters());
	expectTrue<Equals<ReturnType<typeof edited.parameters>, T.Parameters.Bound>>();
	expectTrue<Equals<ReturnType<typeof edited.body>, T.Block.Parsed>>();
	return edited.$render();
}

export function supertypeGuardKeepsParsed(): string {
	for (const stmt of rs.parse('struct S;\n').statements()) {
		if (rs.is.functionItem(stmt)) continue;
		if (!rs.is.structItem(stmt)) continue;
		expectTrue<Equals<typeof stmt, T.StructItem.Parsed>>();
		return stmt.$render();
	}
	return '';
}

export function supertypeGuardKeepsStorage(stmt: T.Statement): boolean {
	if (!rs.is.structItem(stmt)) return false;
	expectTrue<Equals<typeof stmt, T.StructItem>>();
	return true;
}

export function supertypeGuardNarrowsNumericIds(id: T.TSKindId.StructItemBrace | T.TSKindId.FunctionItem): boolean {
	if (!rs.is.structItem(id)) return false;
	expectTrue<Equals<typeof id, T.TSKindId.StructItemBrace>>();
	return true;
}

export function supertypeGuardNarrowsBroadNodes(node: { readonly $type: number }): boolean {
	if (!rs.is.structItem(node)) return false;
	expectTrue<
		Equals<(typeof node)['$type'], T.TSKindId.StructItemBrace | T.TSKindId.StructItemTuple | T.TSKindId.StructItemUnit>
	>();
	return true;
}

export function renderTakesEveryNodeAUserCanHold(): string {
	const root = rs.parse('fn f() {}\n');
	const item = root.statements()[0]!;
	if (!rs.is.functionItem(item)) return '';
	const draft = item.$with.parameters(rs.build.parameters());
	return [rs.render(root), rs.render(item), rs.render(draft)].map(String).join('');
}

export function listOwnerReadsItems(): string {
	const item = rs.parse('fn f(a: i32) {}\n').statements()[0]!;
	if (!rs.is.functionItem(item)) return '';
	const params = item.parameters();
	const items = params.parametersElements();
	expectTrue<Equals<NonNullable<typeof items>[number], ItemOf<typeof params>>>();
	return params.$with.parametersElements(...items!).$render();
}

export function hoistedListSlotReadsItems(): string {
	const item = rs.parse('fn f() { let Some(a) = x; }\n').statements()[0]!;
	if (!rs.is.functionItem(item)) return '';
	const statement = item.body().statements()[0]!;
	if (!rs.is.letDeclaration(statement)) return '';
	const pattern = statement.pattern();
	if (!rs.is.tupleStructPattern(pattern)) return '';
	const items = pattern.patterns();
	const rebuilt = pattern.$with.patterns(items!);
	return rebuilt.$render();
}

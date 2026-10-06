/**
 * Type-level pins for what a builder admits where a slot names a node: a
 * node of the slot's kinds, built, parsed or a draft, checked by kind; never
 * a node of another kind, and never the storage shape.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { HoldsTree } from '@sittir/types';
import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

export function draftsIntoBuilders(): string[] {
	const fn = rs.parse('fn f(a: u8) { a; }\n').statements()[0]!;
	if (!rs.is.functionItem(fn)) return [];
	const body = fn.body();
	const draftBody = body.$with.statements(...body.statements());
	const params = fn.parameters();
	const draftParams = params.$with.elements(...params);
	return [
		rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: draftBody }).$render(),
		rs.build.functionItem({ name: 'g', parameters: draftParams, body: rs.build.block() }).$render(),
		rs.build.functionItem.strict({ name: rs.build.identifier('g'), parameters: draftParams, body: draftBody }).$render(),
		rs.build.block({ statements: [body.statements()[0]!] }).$render()
	];
}

export function wrongKindRefused(): void {
	// @ts-expect-error a Parameters node is not a Block
	rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: rs.build.parameters() });
	// @ts-expect-error a Parameters node is not a Block
	rs.build.functionItem.strict({ name: rs.build.identifier('g'), parameters: rs.build.parameters(), body: rs.build.parameters() });
}

export function listNodeIsNotOptions(): void {
	const fn = rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: rs.build.block() });
	const args = rs.build.arguments(rs.build.identifier('a'));
	// @ts-expect-error an Arguments list is not Parameters, and a node is never the options bag
	fn.$with.parameters(args);
}

export function listBuilderOptionsRefuseNodes(): void {
	const params = rs.parse('fn f(a: u8) {}\n').statements()[0]!;
	if (!rs.is.functionItem(params)) return;
	// @ts-expect-error a Parameters list is not the options bag of arguments
	rs.build.arguments(params.parameters(), rs.build.identifier('a'));
}

export function storageShapeRefused(storage: T.Block): void {
	const fn = rs.build.functionItem({ name: 'g', parameters: rs.build.parameters(), body: rs.build.block() });
	// @ts-expect-error the storage interface is not a node
	rs.build.functionItem.strict({ name: rs.build.identifier('g'), parameters: rs.build.parameters(), body: storage });
	// @ts-expect-error a storage-shaped literal is not a node
	rs.build.functionItem.strict({ name: rs.build.identifier('g'), parameters: rs.build.parameters(), body: { $type: rs.kinds.Block } });
	// @ts-expect-error the storage interface is not a node
	fn.$with.body(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	fn.$with.body({ $type: rs.kinds.Block });
}

export function parsedLeafAdmittedByItsTree(storage: T.Identifier): string {
	const fn = rs.parse('fn f() {}\n').statements()[0]!;
	if (!rs.is.functionItem(fn)) return '';
	const name = fn.name();
	// @ts-expect-error a parsed leaf is data: it holds its tree, not a $render
	name.$render();
	// @ts-expect-error the leaf storage interface is not a node
	rs.build.functionItem.strict({ name: storage, parameters: rs.build.parameters(), body: rs.build.block() });
	// @ts-expect-error a storage-shaped leaf literal is not a node
	rs.build.functionItem.strict({ name: { $type: rs.kinds.Identifier, $text: 'g' }, parameters: rs.build.parameters(), body: rs.build.block() });
	return rs.build.functionItem.strict({ name, parameters: rs.build.parameters(), body: rs.build.block() }).$render() + rs.render(name).toString();
}

export function parsedNodesHoldTheirTree(): readonly HoldsTree[] {
	const root = rs.parse('fn f() { 1; }\n');
	const fn = root.statements()[0]!;
	if (!rs.is.functionItem(fn)) return [];
	return [root, fn, fn.body(), fn.name()];
}

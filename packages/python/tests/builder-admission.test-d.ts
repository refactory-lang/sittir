/**
 * Type-level pins for what a builder admits where a slot names a node: a
 * node of the slot's kinds, built, parsed or a draft, checked by kind; never
 * a node of another kind, and never the storage shape.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import type * as T from '../src/types.ts';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

export function draftsIntoBuilders(): string[] {
	const fn = py.parse('def f(a):\n    a\n').statements()[0]!;
	if (!py.is.functionDefinition(fn)) return [];
	const body = fn.body();
	if (body.$type !== py.kinds.SuiteBlock) return [];
	const block = body.block();
	const draftBody = body.$with.block(block.$with.statements(...block.statements()));
	const params = fn.parameters();
	const draftParams = params.$with.elements(...params);
	return [
		py.build.functionDefinition({ name: 'g', parameters: py.build.parameters(), body: draftBody }).$render(),
		py.build.functionDefinition({ name: 'g', parameters: draftParams, body: py.build.block(py.build.passStatement) }).$render(),
		py.build.functionDefinition.strict({ name: py.build.identifier('g'), parameters: draftParams, body: draftBody }).$render(),
		py.build.block(block.statements()[0]!).$render()
	];
}

export function wrongKindRefused(): void {
	// @ts-expect-error a Parameters node is not a Suite
	py.build.functionDefinition({ name: 'g', parameters: py.build.parameters(), body: py.build.parameters() });
	// @ts-expect-error a Parameters node is not a Suite
	py.build.functionDefinition.strict({ name: py.build.identifier('g'), parameters: py.build.parameters(), body: py.build.parameters() });
}

export function listBuilderOptionsRefuseNodes(): void {
	const fn = py.parse('def f(a):\n    a\n').statements()[0]!;
	if (!py.is.functionDefinition(fn)) return;
	// @ts-expect-error a Parameters list is not the options bag of an import list
	py.build.importList(fn.parameters(), py.build.dottedName(py.build.identifier('m')));
}

export function storageShapeRefused(storage: T.SuiteBlock): void {
	const fn = py.build.functionDefinition({ name: 'g', parameters: py.build.parameters(), body: py.build.block(py.build.passStatement) });
	// @ts-expect-error the storage interface is not a node
	py.build.functionDefinition.strict({ name: py.build.identifier('g'), parameters: py.build.parameters(), body: storage });
	// @ts-expect-error a storage-shaped literal is not a node
	py.build.functionDefinition.strict({ name: py.build.identifier('g'), parameters: py.build.parameters(), body: { $type: py.kinds.SuiteBlock } });
	// @ts-expect-error the storage interface is not a node
	fn.$with.body(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	fn.$with.body({ $type: py.kinds.SuiteBlock });
}

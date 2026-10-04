/**
 * Type-level pins for what a builder admits where a slot names a node: a
 * node of the slot's kinds, built, parsed or a draft, checked by kind; never
 * a node of another kind, and never the storage shape.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import type * as T from '../src/types.ts';
import scm from '../src/index.ts';
import { createEngine } from '@sittir/common';

const q = await createEngine(scm);

export function draftsIntoBuilders(): string[] {
	const list = q.parse('[(a) (b)]\n').definitions()[0]!;
	if (!q.is.list(list)) return [];
	const draft = list.$with.definitions(...list.definitions());
	return [
		q.build.fieldDefinition({ name: 'f', definition: draft }).$render(),
		q.build.fieldDefinition.strict({ name: q.build.identifier('f'), definition: draft }).$render(),
		q.build.fieldDefinition({ name: 'f', definition: list.definitions()[0]! }).$render()
	];
}

export function wrongKindRefused(): void {
	// @ts-expect-error a Capture is not a Definition
	q.build.fieldDefinition({ name: 'f', definition: q.build.capture('c') });
	// @ts-expect-error a Capture is not a Definition
	q.build.fieldDefinition.strict({ name: q.build.identifier('f'), definition: q.build.capture('c') });
}

export function storageShapeRefused(storage: T.List): void {
	const field = q.build.fieldDefinition({ name: 'f', definition: q.parse('(a)\n').definitions()[0]! });
	// @ts-expect-error the storage interface is not a node
	q.build.fieldDefinition.strict({ name: q.build.identifier('f'), definition: storage });
	// @ts-expect-error a storage-shaped literal is not a node
	q.build.fieldDefinition.strict({ name: q.build.identifier('f'), definition: { $type: q.kinds.List } });
	// @ts-expect-error the storage interface is not a node
	field.$with.definition(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	field.$with.definition({ $type: q.kinds.List });
}

/**
 * Type-level pins for what a builder admits where a slot names a node: a
 * node of the slot's kinds, built, parsed or a draft, checked by kind; never
 * a node of another kind, and never the storage shape.
 *
 * Compile-time only: `pnpm --filter @sittir/regex type-check`.
 */

import type * as T from '../src/types.ts';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);

export function draftsIntoBuilders(): string[] {
	const pattern = re.parse('a|b');
	const draft = pattern.$with.content(pattern.content());
	return [
		re.build.nonCapturingGroup({ pattern: draft }).$render(),
		re.build.nonCapturingGroup.strict(draft).$render(),
		re.build.nonCapturingGroup({ pattern }).$render()
	];
}

export function wrongKindRefused(): void {
	// @ts-expect-error a GroupName is not a Pattern
	re.build.nonCapturingGroup({ pattern: re.build.groupName('g') });
	// @ts-expect-error a GroupName is not a Pattern
	re.build.nonCapturingGroup.strict(re.build.groupName('g'));
}

export function storageShapeRefused(storage: T.Pattern): void {
	const group = re.build.nonCapturingGroup({ pattern: re.parse('a') });
	// @ts-expect-error the storage interface is not a node
	re.build.nonCapturingGroup.strict(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	re.build.nonCapturingGroup.strict({ $type: re.kinds.Pattern });
	// @ts-expect-error the storage interface is not a node
	group.$with.pattern(storage);
	// @ts-expect-error a storage-shaped literal is not a node
	group.$with.pattern({ $type: re.kinds.Pattern });
}

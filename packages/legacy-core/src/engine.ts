// @generated-header: false (hand-written core — preserved across regeneration)
//
// JS backend implementation only.

import type { FormatRecord } from '@sittir/types';

export type {
	EngineOptions,
	ParseAndReadResult,
	RenderHandle,
	SittirEngineLike,
	SittirEngineReader
} from '@sittir/common/engine';

export function resolveEngineFormat(
	engineFormat: FormatRecord | undefined,
	treeFormat: FormatRecord | undefined,
	detached: boolean
): FormatRecord | undefined {
	if (engineFormat) return engineFormat;
	if (!detached) return treeFormat;
	return undefined;
}

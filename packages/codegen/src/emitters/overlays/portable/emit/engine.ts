import type * as Common from '@sittir/common';
import type * as TypeScript from '@sittir/typescript';

export function pinnedEngine(common: typeof Common, typescript: typeof TypeScript) {
	return common.createEngine(typescript.default);
}

export type PinnedBuilders = Awaited<ReturnType<typeof pinnedEngine>>['build'];

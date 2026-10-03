/**
 * Type-level pin: a parsed node's position is internal, so `$span` is not on
 * the public node type.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import { createEngine } from '@sittir/common';
import scm from '../src/index.ts';

const scmEngine = await createEngine(scm);

export function aParsedNodeHasNoPublicSpan(): void {
	const [definition] = scmEngine.parse('(foo)').definitions();
	// @ts-expect-error a node's position is internal; tools read it through `spanOf`
	void definition!.$span;
}

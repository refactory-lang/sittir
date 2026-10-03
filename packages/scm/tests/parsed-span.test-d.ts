/**
 * Type-level pin: a parsed node declares its `$span`, required; a built node
 * does not.
 *
 * Compile-time only: `pnpm --filter @sittir/scm type-check`.
 */

import { createEngine } from '@sittir/common';
import type { ByteSpan } from '@sittir/common';
import scm from '../src/index.ts';

const scmEngine = await createEngine(scm);

export function aParsedNodeDeclaresItsSpan(): ByteSpan {
	const [definition] = scmEngine.parse('(foo)').definitions();
	return definition!.$span;
}

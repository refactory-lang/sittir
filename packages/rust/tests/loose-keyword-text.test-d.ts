/**
 * Type-level pins: a loose builder whose children are keyword tokens admits
 * the keyword's text, in the spread form and the array form.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

export function keywordTextAdmitted(): string[] {
	return [
		rs.build.functionModifiers('async', 'const').$render(),
		rs.build.functionModifiers(['unsafe', 'default']).$render(),
		rs.build.delimTokenTreeParen('$').$render(),
		rs.build.delimTokenTreeBracket(['$']).$render()
	];
}

export function otherTextRefused(): void {
	// @ts-expect-error 'pub' is not a function modifier
	rs.build.functionModifiers('pub');
}

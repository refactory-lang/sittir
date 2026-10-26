/**
 * Type-level pin: a leaf that is its own text takes its content, or its text
 * spelled in full with the affix toggle off. The spelled form is typed by
 * the kind's affixes, a built node is not text, and the strict table holds
 * the same builder.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function ownTextLeafEntries(text: string): void {
	const variable = ir.metavariable('x');

	ir.metavariable(text);
	ir.metavariable('$x', false);
	ir.shebang('#!/bin/x\n', false);
	ir.escapeSequence.hex('\\x41', false);

	// @ts-expect-error text spelled in full starts with the kind's opening affix
	ir.metavariable('x', false);
	// @ts-expect-error text spelled in full ends with the kind's closing affix
	ir.shebang('#!/bin/x', false);
	// @ts-expect-error a plain string is not known to carry the affixes
	ir.metavariable(text, false);
	// @ts-expect-error a built metavariable is not text
	ir.metavariable(variable);

	expectTrue<Equals<typeof strictIr.shebang, typeof ir.shebang>>();
	expectTrue<Equals<typeof strictIr.escapeSequence.hex, typeof ir.escapeSequence.hex>>();
}

/**
 * Type-level pin: a leaf that is its own text takes its content, or its text
 * spelled in full with the affix toggle off. The spelled form is typed by
 * the kind's affixes, a built node is not text, and there is no strict or
 * coerce form.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';

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
	// @ts-expect-error a leaf has one builder, no strict form
	void ir.shebang.strict;
	// @ts-expect-error a leaf has one builder, no coerce form
	void ir.escapeSequence.hex.coerce;
}

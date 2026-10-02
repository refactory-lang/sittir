/**
 * Type-level pin: a leaf that is its own text takes its content, or its text
 * spelled in full with the affix toggle off. The spelled form is typed by
 * the kind's affixes, a built node is not text, and there is no strict or
 * coerce form.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';

export function ownTextLeafEntries(text: string): void {
	const comment = ir.comment(' x');

	ir.comment(text);
	ir.comment('# x', false);
	ir.escapeSequence.hex('\\x41', false);

	// @ts-expect-error text spelled in full starts with the kind's opening affix
	ir.comment(' x', false);
	// @ts-expect-error a plain string is not known to carry the affixes
	ir.comment(text, false);
	// @ts-expect-error a built comment is not text
	ir.comment(comment);
	// @ts-expect-error a leaf has one builder, no strict form
	void ir.comment.strict;
	// @ts-expect-error a leaf has one builder, no coerce form
	void ir.escapeSequence.octal.coerce;
	// @ts-expect-error a leaf takes no config object
	ir.comment({ content: ' x' });
}

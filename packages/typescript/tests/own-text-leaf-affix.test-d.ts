/**
 * Type-level pin: a leaf that is its own text takes its content, or its text
 * spelled in full with the affix toggle off. The spelled form is typed by
 * the kind's affixes, a built node is not text, and the strict table holds
 * the same builder.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';
import { ir as strictIr } from '../src/ir-strict.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

export function ownTextLeafEntries(text: string): void {
	const comment = ir.comment.line(' a');

	ir.comment.line(text);
	ir.comment.line(text, true);
	ir.comment.line('// a', false);
	ir.comment.block('/* a */', false);
	ir.hashBangLine('#!/usr/bin/env node', false);
	ir.number.bigint(1n);
	ir.number.bigint('1n', false);
	ir.literalType.bigint('1n', false);

	// @ts-expect-error text spelled in full starts with the kind's opening affix
	ir.comment.line(' a', false);
	// @ts-expect-error text spelled in full ends with the kind's closing affix
	ir.comment.block('/* a', false);
	// @ts-expect-error a plain string is not known to carry the affixes
	ir.comment.line(text, false);
	// @ts-expect-error a number is not a text spelled in full
	ir.number.bigint(1, false);

	// @ts-expect-error a built comment is not text
	ir.comment.line(comment);
	// @ts-expect-error a leaf takes no config object
	ir.hashBangLine({ content: '/usr/bin/env node' });

	expectTrue<Equals<typeof strictIr.comment.line, typeof ir.comment.line>>();
	expectTrue<Equals<typeof strictIr.comment.block, typeof ir.comment.block>>();
}

/**
 * Type-level pins: only an empty form of a kind that has an inner gap offers `inner`; every other
 * node's `$trivia` is `leading` and `trailing`.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '../src/index.ts';
import type * as T from '../src/types.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(typescript);

// @ts-expect-error a kind with no inner gap has no inner position
engine.build.identifier('a').$trivia.inner();

engine.build.identifier('a').$trivia.leading();

declare const parsedArgs: T.Arguments.Parsed;
// @ts-expect-error an edited node is never typed as an empty form, so it has no inner position
parsedArgs.$with.elements().$trivia.inner();
parsedArgs.$with.elements().$trivia.leading();

declare const plainNarrowed: T.StatementBlock & { readonly $type: T.StatementBlock['$type'] };
if (engine.isEmptyNode(plainNarrowed)) plainNarrowed.$trivia.inner(engine.build.commentLine(' TODO')) satisfies T.EmptyStatementBlock;

declare const boundNarrowed: T.StatementBlock.Bound & { readonly $type: T.StatementBlock['$type'] };
if (engine.isEmptyNode(boundNarrowed)) boundNarrowed.$trivia.inner(engine.build.commentLine(' TODO')) satisfies T.EmptyStatementBlock;

declare const parsedNarrowed: T.StatementBlock.Parsed & { readonly $type: T.StatementBlock['$type'] };
if (engine.isEmptyNode(parsedNarrowed)) parsedNarrowed.$trivia.inner(engine.build.commentLine(' TODO')) satisfies T.EmptyStatementBlock.Parsed;

declare const tagged: T.StatementBlock.Bound & { readonly reviewTag: 'tracked' };
if (engine.isEmptyNode(tagged)) {
	tagged.reviewTag satisfies 'tracked';
	tagged.$trivia.inner(engine.build.commentLine(' TODO')) satisfies T.EmptyStatementBlock;
}

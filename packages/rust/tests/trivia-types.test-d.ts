/**
 * Type-level pins for inner trivia: only a node that realizes empty takes
 * inner entries, and `isEmpty` narrows a node to that form.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir, isEmpty, type Block, type EmptyBlock, type EmptyMatchBlock } from '@sittir/rust';

const block: EmptyBlock = ir.block().$trivia.inner(ir.lineComment(' TODO'));
block.$trivia.inner() satisfies readonly unknown[];

const matchBlock: EmptyMatchBlock = ir.matchBlock();
matchBlock.$trivia.inner(ir.lineComment(' TODO')) satisfies EmptyMatchBlock;

// A factory with arguments may build children, so it gives the plain form.
// @ts-expect-error a block with an expression has no inner gap
ir.block({ trailingExpression: ir.integerLiteral('1') }).$trivia.inner();

declare const parsed: Block;
// @ts-expect-error a block read from source is not known to be empty
parsed.$trivia.inner(ir.lineComment(' TODO'));
if (isEmpty(parsed)) parsed.$trivia.inner(ir.lineComment(' TODO')) satisfies EmptyBlock;

// @ts-expect-error a kind that never realizes empty has no isEmpty overload
isEmpty(ir.functionItem({ name: 'f', parameters: ir.parameters(), body: ir.block() }));

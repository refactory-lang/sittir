/**
 * Type-level pins for inner trivia: only a node that realizes empty takes
 * inner entries, and the engine's `isEmptyNode` narrows a node to that form.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { type Block, type EmptyBlock, type EmptyMatchBlock } from '@sittir/rust';
import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

const block: EmptyBlock = rs.build.block().$trivia.inner(rs.build.lineComment(' TODO'));
block.$trivia.inner() satisfies readonly unknown[];

const matchBlock: EmptyMatchBlock = rs.build.matchBlock();
matchBlock.$trivia.inner(rs.build.lineComment(' TODO')) satisfies EmptyMatchBlock;

// A factory with arguments may build children, so it gives the plain form.
// @ts-expect-error a block with an expression has no inner gap
rs.build.block({ trailingExpression: rs.build.integerLiteral('1') }).$trivia.inner();

declare const parsed: Block;
// @ts-expect-error a block read from source is not known to be empty
parsed.$trivia.inner(rs.build.lineComment(' TODO'));
if (rs.isEmptyNode(parsed)) parsed.$trivia.inner(rs.build.lineComment(' TODO')) satisfies EmptyBlock;

// @ts-expect-error a kind that never realizes empty has no isEmptyNode overload
rs.isEmptyNode(rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: rs.build.block() }));

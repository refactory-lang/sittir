/**
 * The refusal reads a value to a fixed depth, twenty opened lists and configs,
 * and refuses by name what lies deeper rather than admitting it unread: a deep
 * literal, a user-declared recursive type, and a type that expands as it
 * recurses. Each chain is pinned at both edges: the deepest value read whole
 * is admitted, and one level more is refused.
 *
 * Compile-time only: `pnpm run type-check:cross-language`.
 */

import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';

declare const rs: Engine<RustAPI>;

// A block config nested in its trailing expression, nineteen levels below the input: read whole.
export const deepestConfigChain = rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: 'a' } } } } } } } } } } } } } } } } } } } });
// @ts-expect-error twenty levels below the input is past the depth the check reads
rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: 'a' } } } } } } } } } } } } } } } } } } } } });

// A statement list holding a statement whose block holds the next list, six levels below the input: read whole.
export const deepestStatementChain = rs.build.block({ statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [] } }] } }] } }] } }] } }] } }] });
// @ts-expect-error seven levels below the input is past the depth the check reads
rs.build.block({ statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [{ $type: rs.kinds.ExpressionStatement, content: { $type: rs.kinds.Block, statements: [] } }] } }] } }] } }] } }] } }] } }] });

interface Loop {
	readonly label?: string;
	readonly body: Loop;
}
declare const loop: Loop;
// @ts-expect-error a recursive declared input nests past the depth the check reads
rs.build.loopExpression(loop);

interface Expanding<Label extends string> {
	readonly $type: typeof rs.kinds.Block;
	readonly label?: Label;
	readonly trailingExpression?: Expanding<`${Label}x`>;
}
declare const expanding: Expanding<'l'>;
// @ts-expect-error a type that expands as it recurses is refused by name, not by the checker's own depth limit
rs.build.block(expanding);

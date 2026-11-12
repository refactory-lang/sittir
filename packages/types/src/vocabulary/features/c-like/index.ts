import type { CountedLoops } from '../counted-loops/index.ts';
import type { PostTestLoops } from '../post-test-loops/index.ts';
import type { MultiwayBranch } from '../multiway-branch/index.ts';
import type { ConditionalExpressions } from '../conditional-expressions/index.ts';
import type { BlockComments } from '../block-comments/index.ts';
import type { CFamilyUnaryOperators } from '../c-family-unary-operators/index.ts';

/** The C-like core: counted and post-test loops, multiway branch, conditional expressions, block comments and the C-family unary operators. */
export interface CLike extends CountedLoops, PostTestLoops, MultiwayBranch, ConditionalExpressions, BlockComments, CFamilyUnaryOperators {
	readonly 'c-like': true;
}

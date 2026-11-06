export type * from './literal.ts';

import type { ArbitraryPrecisionIntegers } from '../index.ts';

/** Big integer radixes: arbitrary-precision integers written in binary, octal or hex. */
export interface BigIntegerRadixes extends ArbitraryPrecisionIntegers {
	readonly 'big-integer-radixes': true;
}

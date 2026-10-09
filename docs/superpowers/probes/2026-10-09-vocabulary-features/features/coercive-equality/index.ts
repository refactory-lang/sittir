export type * from './expression.ts';

/** Coercive equality: `==` and `!=` convert their operands' types before comparing. */
export interface CoerciveEquality {
	readonly 'coercive-equality': true;
}

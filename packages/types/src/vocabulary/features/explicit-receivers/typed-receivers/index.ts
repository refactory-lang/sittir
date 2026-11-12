export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './type.ts';

import type { ExplicitReceivers } from '../index.ts';

/** Typed receivers: a receiver whose type a function or signature declares. */
export interface TypedReceivers extends ExplicitReceivers {
	readonly 'typed-receivers': true;
}

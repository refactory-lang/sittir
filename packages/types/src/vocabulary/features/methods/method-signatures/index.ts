export type * from './declaration.ts';
export type * from './identifier.ts';

import type { Methods } from '../index.ts';

/** Method signatures: a method declared without a body. */
export interface MethodSignatures extends Methods {
	readonly 'method-signatures': true;
}

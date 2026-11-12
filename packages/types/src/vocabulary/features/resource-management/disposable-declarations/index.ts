export type * from './expression.ts';

import type { ResourceManagement } from '../index.ts';

/** Disposable declarations: a binding disposed of when its scope exits. */
export interface DisposableDeclarations extends ResourceManagement {
	readonly 'disposable-declarations': true;
}

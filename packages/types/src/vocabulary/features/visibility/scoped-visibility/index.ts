export * from './modifier.ts';

import type { Visibility } from '../index.ts';

/** Scoped visibility: a level restricted to a module the declaration names, `pub(in path)`. */
export interface ScopedVisibility extends Visibility {
	readonly 'scoped-visibility': true;
}

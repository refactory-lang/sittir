export type * from './declaration.ts';

import type { Classes } from '../index.ts';

/** Explicit overrides: a member marked as overriding the one it replaces. */
export interface ExplicitOverrides extends Classes {
	readonly 'explicit-overrides': true;
}

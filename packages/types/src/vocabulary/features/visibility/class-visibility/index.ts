export type * from './declaration.ts';
export type * from './modifier.ts';

import type { Visibility } from '../index.ts';
import type { Classes } from '../../methods/classes/index.ts';
import type { Accessors } from '../../methods/accessors/index.ts';
import type { AbstractClasses } from '../../methods/classes/abstract-classes/index.ts';

/** Class visibility: an access level on a class member. */
export interface ClassVisibility extends Visibility, Classes, Accessors, AbstractClasses {
	readonly 'class-visibility': true;
}

export type * from './declaration.ts';

import type { Accessors } from '../index.ts';
import type { Interfaces } from '../../../interfaces/index.ts';
import type { AbstractClasses } from '../../classes/abstract-classes/index.ts';

/** Accessor signatures: a getter or setter declared on an interface or abstract class, without a body. */
export interface AccessorSignatures extends Accessors, Interfaces, AbstractClasses {
	readonly 'accessor-signatures': true;
}

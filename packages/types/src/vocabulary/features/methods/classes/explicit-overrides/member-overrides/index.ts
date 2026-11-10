export type * from './declaration.ts';

import type { ExplicitOverrides } from '../index.ts';
import type { FieldsAndModifiers } from '../../../../fields-and-modifiers/index.ts';
import type { Interfaces } from '../../../../interfaces/index.ts';
import type { AbstractClasses } from '../../abstract-classes/index.ts';

/** Member overrides: a field, parameter property or signature marked as overriding the one it replaces. */
export interface MemberOverrides extends ExplicitOverrides, FieldsAndModifiers, Interfaces, AbstractClasses {
	readonly 'member-overrides': true;
}

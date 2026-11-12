export type * from './attribute.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

import type { Decorators } from '../index.ts';
import type { JavaScriptClasses } from '../../methods/classes/javascript-classes/index.ts';

/** Member decorators: a decorator on a field, a parameter or a class expression. */
export interface MemberDecorators extends Decorators, JavaScriptClasses {
	readonly 'member-decorators': true;
}

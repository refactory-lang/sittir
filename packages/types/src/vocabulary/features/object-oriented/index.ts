import type { Methods } from '../methods/index.ts';
import type { Classes } from '../methods/classes/index.ts';

/** Object-oriented programming: classes and their methods. */
export interface ObjectOriented extends Methods, Classes {
	readonly 'object-oriented': true;
}

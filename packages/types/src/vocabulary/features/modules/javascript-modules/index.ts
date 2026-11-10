export type * from './clause.ts';
export type * from './expression.ts';
export type * from './statement.ts';
export type * from './type.ts';

import type { Modules } from '../index.ts';

/** JavaScript modules: exports, import specifiers, attributes and dynamic `import()`. */
export interface JavaScriptModules extends Modules {
	readonly 'javascript-modules': true;
}

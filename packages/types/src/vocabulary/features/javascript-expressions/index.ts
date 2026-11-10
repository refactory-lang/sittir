export type * from './expression.ts';
export type * from './identifier.ts';

/** JavaScript expressions: object literals, function expressions, sequences, `super`, `new.target` and `import.meta`. */
export interface JavaScriptExpressions {
	readonly 'javascript-expressions': true;
}

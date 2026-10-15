export type * from './statement.ts';

/** Scope declarations: a name bound in an enclosing scope, `global` and `nonlocal`. */
export interface ScopeDeclarations {
	readonly 'scope-declarations': true;
}

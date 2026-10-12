// The vocabulary's shape, cut down to what the gate probes need: the namespace map with the identifier role's
// permissive fill, two features, and two languages that differ by one of them.
export declare const flag: unique symbol;
export type Flag = typeof flag;
export interface Ident {
	readonly $kind: 'identifier';
}
export interface PrivateIdent {
	readonly $kind: 'identifier.private';
}
export interface Decorator {
	readonly $kind: 'decorator';
}
export interface GrammarContext<G extends GrammarContext<G>> {
	readonly identifier: Ident | PrivateIdent;
	readonly self?: G;
}
export interface AsyncAwait {
	readonly asyncAwait: true;
}
export interface Decorators {
	readonly decorators: true;
}
export interface RustContext extends GrammarContext<RustContext>, AsyncAwait {
	readonly identifier: Ident;
}
export interface PythonContext extends GrammarContext<PythonContext>, AsyncAwait, Decorators {
	readonly identifier: Ident;
}

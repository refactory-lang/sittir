// The refusals that an Absent<F> branch adds and never removes.
import type { AsyncAwait, Decorator, Decorators, Flag, GrammarContext, Ident, PythonContext, RustContext } from './base.ts';

interface Absent<F> {
	readonly absent: F;
}
type In<G, F, T> = G extends F ? T : Absent<F>;
interface Fn<G extends GrammarContext<G>> {
	readonly $kind: 'declaration.function';
	readonly name: G['identifier'];
	readonly async?: In<G, AsyncAwait, Flag>;
	readonly decorators?: In<G, Decorators, readonly Decorator[]>;
}
interface RustFn extends Fn<RustContext> {
	readonly $kind: 'declaration.function';
	readonly name: Ident;
	readonly async?: Flag;
}
interface PythonFn extends Fn<PythonContext> {
	readonly $kind: 'declaration.function';
	readonly name: Ident;
	readonly async?: Flag;
	readonly decorators?: readonly Decorator[];
}
declare function buildPython(fn: PythonFn): void;
declare const parsedRust: RustFn;
// @ts-expect-error rust's decorators is Absent<Decorators>, which python's decorators refuses
buildPython(parsedRust);
// @ts-expect-error unbounded, the member reads as Absent<Decorators>
export const readAny = <G extends GrammarContext<G>>(f: Fn<G>): readonly Decorator[] | undefined => f.decorators;

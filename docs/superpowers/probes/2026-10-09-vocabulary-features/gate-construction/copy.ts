// Copying a node to another language. Conformance is structural over the node's static type: a parsed node's is its
// kind's whole interface in its language, a built node's can be exactly what was built.
import type { PythonContext, RustContext } from './base.ts';
import { type Fn, type PythonFn, type RustFn, buildPython, buildRust } from './model.ts';

declare const parsedPython: PythonFn;
declare const parsedRust: RustFn;
// Both conform to one shared type, the vocabulary over the union of their contexts.
export const both: readonly Fn<PythonContext | RustContext>[] = [parsedPython, parsedRust];
// A node from the language without the feature conforms to the one with it.
buildPython(parsedRust);
// The reverse is a narrowing: a parsed python function may have decorators.
// @ts-expect-error decorators: readonly Decorator[] is not assignable to never
buildRust(parsedPython);

declare function buildPythonExact<const S extends PythonFn>(structure: S): S;
buildRust(buildPythonExact({ $kind: 'declaration.function', name: { $kind: 'identifier' } }));
// @ts-expect-error built with decorators, which rust has none of
buildRust(buildPythonExact({ $kind: 'declaration.function', name: { $kind: 'identifier' }, decorators: [{ $kind: 'decorator' }] }));

// A check at run time, written as a guard, narrows a parsed node into the target's interface.
declare function fitsRust<N extends object>(node: N): node is N & RustFn;
if (fitsRust(parsedPython)) buildRust(parsedPython);

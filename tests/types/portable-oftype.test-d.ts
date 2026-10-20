/**
 * `ofType` narrows by a portable kind to the kinds the view's language reads at or under its path, as the portable
 * guards narrow: a path the language does not read narrows to nothing, and a value that names no vocabulary path is
 * refused. A kind id still narrows to its kind.
 *
 * Compile-time only: `pnpm run type-check:cross-language`.
 */

import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';
import type { PythonAPI } from '@sittir/python';
import { portable } from '@sittir/common/portable';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
type Expect<_T extends true> = true;
type Item<V> = V extends Iterable<infer T> ? T : never;

declare const rs: Engine<RustAPI>;
declare const py: Engine<PythonAPI>;

const rustNodes = rs.parse('').$query().$descendants;
const pythonNodes = py.parse('').$query().$descendants;

const rustFunctions = rustNodes.ofType(portable.kinds.declaration.function);
export type RustFunctions = Expect<Equals<Item<typeof rustFunctions>['$type'], typeof rs.kinds.FunctionItem | typeof rs.kinds.FunctionSignatureItem>>;

const pythonFunctions = pythonNodes.ofType(portable.kinds.declaration.function);
export type PythonFunctions = Expect<Equals<Item<typeof pythonFunctions>['$type'], typeof py.kinds.FunctionDefinition>>;

const pythonPublicImports = pythonNodes.ofType(portable.kinds.statement.import.public);
export type PythonPublicImports = Expect<Equals<Item<typeof pythonPublicImports>, never>>;

const rustBlocks = rustNodes.ofType(rs.kinds.Block);
export type RustBlocks = Expect<Equals<Item<typeof rustBlocks>['$type'], typeof rs.kinds.Block>>;

const rustItems = rustNodes.ofType(portable.kinds.declaration.function).ofType(rs.kinds.FunctionItem);
export type RustItems = Expect<Equals<Item<typeof rustItems>['$type'], typeof rs.kinds.FunctionItem>>;

// @ts-expect-error a value that names no vocabulary path
rustNodes.ofType({ $path: 'nope' });

/**
 * `ofType` narrows by a portable kind to the kinds the view's language reads at or under its path, as the portable
 * guards narrow: a path the language does not read narrows to nothing, and a value that names no vocabulary path is
 * refused. A kind id still narrows to its kind. A keyword leaf is its kind id, in a walk and in a slot, and narrows
 * by that id.
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

const rustTrue = rustNodes.ofType(rs.kinds.TrueKeyword);
export type RustTrue = Expect<Equals<Item<typeof rustTrue>, typeof rs.kinds.TrueKeyword>>;

const rustBooleans = rustNodes.ofType(portable.kinds.literal.boolean);
export type RustBooleans = Expect<Equals<Item<typeof rustBooleans>, typeof rs.kinds.TrueKeyword | typeof rs.kinds.FalseKeyword>>;

const constItems = rustNodes.ofType(rs.kinds.ConstItem);
declare const constItem: Item<typeof constItems>;
const constBool = constItem.$query().type.ofType(rs.kinds.BoolKeyword);
export type ConstBool = Expect<Equals<Item<typeof constBool>, typeof rs.kinds.BoolKeyword>>;
const constPrimitive = constItem.$query().type.ofType(portable.kinds.type.primitive.boolean);
export type ConstPrimitive = Expect<Equals<Item<typeof constPrimitive>, typeof rs.kinds.BoolKeyword>>;

// @ts-expect-error a value that names no vocabulary path
rustNodes.ofType({ $path: 'nope' });

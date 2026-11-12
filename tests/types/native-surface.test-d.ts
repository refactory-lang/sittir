import { expectTypeOf } from 'vitest';
import type { ByteSpan, NodeTrivia, SlotLayoutWire, UnitSidesWire, WireNode } from '../../packages/types/src/core-types.ts';
import type { EngineDiagnostics } from '../../packages/types/src/engine-api.ts';
import type { BackerParity, BaselineRun, LayoutWork, NativeEngineInstance, NativeEngineLike, NativeModuleLike, StoredLayout } from '../../packages/common/src/engine.ts';
import type { ReadOutput } from '../../packages/common/src/node-data.ts';
import type { ChunkWords, TriviaSideName } from '../../packages/common/src/read.ts';
import type { TriviaSides } from '../../packages/common/src/trivia.ts';
import type * as Python from '../../packages/python/native/index.js';
import type * as Regex from '../../packages/regex/native/index.js';
import type * as Rust from '../../packages/rust/native/index.js';
import type * as Scm from '../../packages/scm/native/index.js';
import type * as TypeScript from '../../packages/typescript/native/index.js';

type Declared = NativeModuleLike<object>;
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Unbranded<R> = R extends readonly (infer E)[]
	? UnbrandedItem<E>[]
	: [R] extends [ReadOutput]
		? object
		: Exact<R, ChunkWords> extends true
			? Uint32Array
			: R extends { readonly side: TriviaSideName }
				? { readonly [K in keyof R]: K extends 'side' ? string : R[K] }
				: R;
type UnbrandedItem<E> = E extends ReadOutput ? object : E extends UnitSidesWire<ReadOutput> ? UnitSidesWire : Unbranded<E>;
type Taking<F> = F extends (...args: infer A) => unknown ? (...args: A) => unknown : F;
type ReadonlyArg<T> = T extends (infer E)[] ? readonly E[] : T;
type Accepting<F> = F extends (...args: infer A) => unknown ? (...args: { [I in keyof A]: ReadonlyArg<A[I]> }) => unknown : F;
type Admits<Generated, Declaration> = Accepting<Generated> extends Taking<Declaration> ? true : false;
type ReturnsExactly<Generated, Declaration> = Exact<Ret<Generated>, Unbranded<Ret<Declaration>>>;
type Member<M> = keyof Declared & keyof M;
type Arity<F> = F extends (...args: infer A) => unknown ? A['length'] : never;

type Drift<M> = {
	readonly missing: Exclude<keyof Declared, keyof M>;
	readonly parameters: { [K in Member<M>]-?: Admits<M[K], Declared[K]> extends true ? never : K }[Member<M>];
	readonly returns: { [K in Member<M>]-?: ReturnsExactly<M[K], Declared[K]> extends true ? never : K }[Member<M>];
	readonly arity: { [K in Member<M>]-?: [Arity<M[K]>] extends [Arity<Declared[K]>] ? ([Arity<Declared[K]>] extends [Arity<M[K]>] ? never : K) : K }[Member<M>];
	readonly engine: M extends { SittirEngine: abstract new (...args: never) => infer E } ? (E extends NativeEngineInstance ? never : 'SittirEngine') : 'SittirEngine';
};
type NoDrift = { readonly missing: never; readonly parameters: never; readonly returns: never; readonly arity: never; readonly engine: never };

type Sided<T> = { readonly [K in keyof T]: K extends 'side' ? TriviaSideName : T[K] };
type Ret<F> = F extends (...args: never) => infer R ? R : never;
type SpanOf<F> = F extends (treeId: never, span: infer S) => unknown ? S : never;
type ProfileOf<C> = C extends abstract new (...args: never) => { readonly buildProfile: infer P } ? P : never;
type Shaped = Record<'SittirEngine' | 'readMany' | 'layoutWork' | 'layoutBaseline' | 'storedLayout' | 'backerParity' | 'treeMemory' | 'engineStamp' | 'builtWords' | 'builtBytes' | 'builtMemory' | 'text', unknown>;
type Shapes<M extends Shaped> = {
	readonly layoutWork: Readonly<Ret<M['layoutWork']>>;
	readonly baselineRun: Sided<Ret<M['layoutBaseline']> extends readonly (infer E)[] ? E : never>;
	readonly storedLayout: Readonly<Ret<M['storedLayout']>>;
	readonly backerParity: Readonly<Ret<M['backerParity']>>;
	readonly treeMemory: Readonly<Ret<M['treeMemory']>>;
	readonly engineStamp: Readonly<Ret<M['engineStamp']>>;
	readonly builtWords: Ret<M['builtWords']>;
	readonly builtBytes: Ret<M['builtBytes']>;
	readonly builtMemory: Ret<M['builtMemory']>;
	readonly span: Readonly<SpanOf<M['text']>>;
	readonly buildProfile: ProfileOf<M['SittirEngine']>;
	readonly readMany: Ret<M['readMany']>;
};
type DeclaredShapes = {
	readonly layoutWork: LayoutWork;
	readonly baselineRun: BaselineRun;
	readonly storedLayout: StoredLayout;
	readonly backerParity: BackerParity;
	readonly treeMemory: ReturnType<Declared['treeMemory']>;
	readonly engineStamp: ReturnType<Declared['engineStamp']>;
	readonly builtWords: ReturnType<NonNullable<NativeEngineLike['builtWords']>>;
	readonly builtBytes: ReturnType<NonNullable<NativeEngineLike['builtBytes']>>;
	readonly builtMemory: ReturnType<NonNullable<NativeEngineLike['builtMemory']>>;
	readonly span: ByteSpan;
	readonly buildProfile: EngineDiagnostics['buildProfile'];
	readonly readMany: WireNode[] | Uint32Array;
};
type Wire = 'read' | 'snapshot' | 'triviaSide' | 'unitSides' | 'slotLayouts' | 'builtTriviaSide' | 'builtLeafSide' | 'builtUnitSides';
type DeclaredWire = { readonly [K in Wire]: Unbranded<Ret<Declared[K]>> };
type ObjectOnlyUnit = Omit<UnitSidesWire, keyof NodeTrivia> & TriviaSides<object>;

expectTypeOf<Admits<(profile: 'release') => void, (profile: string) => void>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => object, () => WireNode>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => ObjectOnlyUnit[], () => UnitSidesWire[]>>().toEqualTypeOf<false>();

expectTypeOf<DeclaredWire>().toEqualTypeOf<{
	readonly read: WireNode;
	readonly snapshot: WireNode;
	readonly triviaSide: WireNode[];
	readonly unitSides: UnitSidesWire[];
	readonly slotLayouts: SlotLayoutWire[];
	readonly builtTriviaSide: WireNode[] | null;
	readonly builtLeafSide: WireNode[] | null;
	readonly builtUnitSides: UnitSidesWire[];
}>();

expectTypeOf<Drift<typeof Python>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Regex>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Rust>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Scm>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof TypeScript>>().toEqualTypeOf<NoDrift>();

expectTypeOf<Shapes<typeof Python>>().toEqualTypeOf<DeclaredShapes>();
expectTypeOf<Shapes<typeof Regex>>().toEqualTypeOf<DeclaredShapes>();
expectTypeOf<Shapes<typeof Rust>>().toEqualTypeOf<DeclaredShapes>();
expectTypeOf<Shapes<typeof Scm>>().toEqualTypeOf<DeclaredShapes>();
expectTypeOf<Shapes<typeof TypeScript>>().toEqualTypeOf<DeclaredShapes>();

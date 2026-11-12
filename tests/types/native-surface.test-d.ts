import { expectTypeOf } from 'vitest';
import type { ByteSpan } from '../../packages/types/src/core-types.ts';
import type { EngineDiagnostics } from '../../packages/types/src/engine-api.ts';
import type { BackerParity, BaselineRun, LayoutWork, NativeEngineInstance, NativeEngineLike, NativeModuleLike, StoredLayout } from '../../packages/common/src/engine.ts';
import type { ReadOutput } from '../../packages/common/src/node-data.ts';
import type { TriviaSideName } from '../../packages/common/src/read.ts';
import type * as Python from '../../packages/python/native/index.js';
import type * as Regex from '../../packages/regex/native/index.js';
import type * as Rust from '../../packages/rust/native/index.js';
import type * as Scm from '../../packages/scm/native/index.js';
import type * as TypeScript from '../../packages/typescript/native/index.js';

type Declared = NativeModuleLike;
type Unbranded<R> = R extends readonly (infer E)[]
	? Unbranded<E>[]
	: [R] extends [ReadOutput]
		? object
		: R extends { readonly side: TriviaSideName }
			? { readonly [K in keyof R]: K extends 'side' ? string : R[K] }
			: R;
type Admitting<F> = F extends (...args: infer A) => infer R ? { call(...args: A): Unbranded<R> }['call'] : F;
type Member<M> = keyof Declared & keyof M;
type Arity<F> = F extends (...args: infer A) => unknown ? A['length'] : never;

type Drift<M> = {
	readonly missing: Exclude<keyof Declared, keyof M>;
	readonly mistyped: { [K in Member<M>]-?: M[K] extends Admitting<Declared[K]> ? never : K }[Member<M>];
	readonly arity: { [K in Member<M>]-?: [Arity<M[K]>] extends [Arity<Declared[K]>] ? ([Arity<Declared[K]>] extends [Arity<M[K]>] ? never : K) : K }[Member<M>];
	readonly engine: M extends { SittirEngine: abstract new (...args: never) => infer E } ? (E extends NativeEngineInstance ? never : 'SittirEngine') : 'SittirEngine';
};
type NoDrift = { readonly missing: never; readonly mistyped: never; readonly arity: never; readonly engine: never };

type Sided<T> = { readonly [K in keyof T]: K extends 'side' ? TriviaSideName : T[K] };
type Ret<F> = F extends (...args: never) => infer R ? R : never;
type SpanOf<F> = F extends (treeId: never, span: infer S) => unknown ? S : never;
type ProfileOf<C> = C extends abstract new (...args: never) => { readonly buildProfile: infer P } ? P : never;
type Shaped = Record<'SittirEngine' | 'layoutWork' | 'layoutBaseline' | 'storedLayout' | 'backerParity' | 'treeMemory' | 'engineStamp' | 'builtWords' | 'builtBytes' | 'builtMemory' | 'text', unknown>;
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
};

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

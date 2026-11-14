import { expectTypeOf } from 'vitest';
import type { ByteSpan, NodeTrivia, SlotLayoutWire, UnitSidesWire, WireNode } from '../../packages/types/src/core-types.ts';
import type { EngineDiagnostics } from '../../packages/types/src/engine-api.ts';
import type { BackerParity, BaselineRun, LayoutWork, NativeEngineInstance, NativeEngineLike, NativeModuleLike, StoredLayout } from '../../packages/common/src/engine.ts';
import type { ReadOutput } from '../../packages/common/src/node-data.ts';
import type { ChunkWords, TriviaSideName } from '../../packages/common/src/read.ts';
import type { TriviaSides } from '../../packages/common/src/trivia.ts';
import type { TSKindId as PythonKindId } from '../../packages/python/src/kinds.ts';
import type { TSKindId as RegexKindId } from '../../packages/regex/src/kinds.ts';
import type { TSKindId as RustKindId } from '../../packages/rust/src/kinds.ts';
import type { TSKindId as ScmKindId } from '../../packages/scm/src/kinds.ts';
import type { TSKindId as TypeScriptKindId } from '../../packages/typescript/src/kinds.ts';
import type * as Python from '../../packages/python/native/index.js';
import type * as Regex from '../../packages/regex/native/index.js';
import type * as Rust from '../../packages/rust/native/index.js';
import type * as Scm from '../../packages/scm/native/index.js';
import type * as TypeScript from '../../packages/typescript/native/index.js';

type Declared = NativeModuleLike<object>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type KindIdAsNumber<R, Kind> = [Kind] extends [never] ? R : Equal<Extract<R, number>, Kind> extends true ? Exclude<R, number> | number : R;
type Wire<R> = R extends readonly unknown[]
	? { -readonly [I in keyof R]: Wire<R[I]> }
	: Equal<R, ReadOutput> extends true
		? object
		: Equal<R, ChunkWords> extends true
			? Uint32Array
			: R extends ArrayBufferView
				? R
				: object extends R
					? R
					: R extends object
						? { -readonly [K in keyof R]: K extends 'side' ? (Equal<R[K], TriviaSideName> extends true ? string : Wire<R[K]>) : Wire<R[K]> }
						: R;
type Same<A, B> = Equal<Wire<A>, Wire<B>>;
type Taking<F> = F extends (...args: infer A) => unknown ? (...args: A) => unknown : F;
type ReadonlyArg<T> = T extends unknown[] ? Readonly<T> : T;
type Accepting<F> = F extends (...args: infer A) => unknown ? (...args: { [I in keyof A]: ReadonlyArg<A[I]> }) => unknown : F;
type Admits<Generated, Declaration> = Accepting<Generated> extends Taking<Declaration> ? true : false;
type ReturnsExactly<Generated, Declaration, Kind = never> = Same<KindIdAsNumber<Ret<Generated>, Kind>, Ret<Declaration>>;
type KindIdReturns = 'slotSeparator' | 'separatorBefore' | 'readSlotSeparator' | 'readSeparatorBefore';
type Member<M> = keyof Declared & keyof M;
type Arity<F> = F extends (...args: infer A) => unknown ? A['length'] : never;

type Drift<M, Kind> = {
	readonly missing: Exclude<keyof Declared, keyof M>;
	readonly parameters: { [K in Member<M>]-?: Admits<M[K], Declared[K]> extends true ? never : K }[Member<M>];
	readonly returns: { [K in Member<M>]-?: ReturnsExactly<M[K], Declared[K], K extends KindIdReturns ? Kind : never> extends true ? never : K }[Member<M>];
	readonly arity: { [K in Member<M>]-?: [Arity<M[K]>] extends [Arity<Declared[K]>] ? ([Arity<Declared[K]>] extends [Arity<M[K]>] ? never : K) : K }[Member<M>];
	readonly engine: M extends { SittirEngine: abstract new (...args: never) => infer E } ? (E extends NativeEngineInstance ? never : 'SittirEngine') : 'SittirEngine';
};
type NoDrift = { readonly missing: never; readonly parameters: never; readonly returns: never; readonly arity: never; readonly engine: never };

type Ret<F> = F extends (...args: never) => infer R ? R : never;
type NodeOf<F> = F extends (...args: infer A) => unknown ? A[1] : never;
type ItemOf<T> = T extends readonly (infer E)[] ? E : never;
type SpanOf<F> = F extends (treeId: never, span: infer S) => unknown ? S : never;
type ProfileOf<C> = C extends abstract new (...args: never) => { readonly buildProfile: infer P } ? P : never;
type Renders<Read, Render, RenderToFile> = [Read] extends [NodeOf<Render> & NodeOf<RenderToFile>] ? true : false;
type Shaped = Record<
	| 'SittirEngine'
	| 'read'
	| 'render'
	| 'renderToFile'
	| 'layoutWork'
	| 'layoutBaseline'
	| 'storedLayout'
	| 'backerParity'
	| 'treeMemory'
	| 'engineStamp'
	| 'builtWords'
	| 'builtBytes'
	| 'builtMemory'
	| 'text',
	unknown
>;
type Shapes<M extends Shaped> = {
	readonly layoutWork: Ret<M['layoutWork']>;
	readonly baselineRuns: Ret<M['layoutBaseline']>;
	readonly storedLayout: Ret<M['storedLayout']>;
	readonly backerParity: Ret<M['backerParity']>;
	readonly treeMemory: Ret<M['treeMemory']>;
	readonly engineStamp: Ret<M['engineStamp']>;
	readonly builtWords: Ret<M['builtWords']>;
	readonly builtBytes: Ret<M['builtBytes']>;
	readonly builtMemory: Ret<M['builtMemory']>;
	readonly span: SpanOf<M['text']>;
	readonly buildProfile: ProfileOf<M['SittirEngine']>;
	readonly readsRender: Renders<Ret<M['read']>, M['render'], M['renderToFile']>;
};
type DeclaredShapes = {
	readonly layoutWork: LayoutWork;
	readonly baselineRuns: readonly BaselineRun[];
	readonly storedLayout: StoredLayout;
	readonly backerParity: BackerParity;
	readonly treeMemory: ReturnType<Declared['treeMemory']>;
	readonly engineStamp: ReturnType<Declared['engineStamp']>;
	readonly builtWords: ReturnType<NonNullable<NativeEngineLike['builtWords']>>;
	readonly builtBytes: ReturnType<NonNullable<NativeEngineLike['builtBytes']>>;
	readonly builtMemory: ReturnType<NonNullable<NativeEngineLike['builtMemory']>>;
	readonly span: ByteSpan;
	readonly buildProfile: EngineDiagnostics['buildProfile'];
	readonly readsRender: true;
};
type Misshaped<M extends Shaped> = { [K in keyof DeclaredShapes]-?: Same<Shapes<M>[K], DeclaredShapes[K]> extends true ? never : K }[keyof DeclaredShapes];
type WireTypes = {
	readonly read: WireNode;
	readonly triviaSide: WireNode[];
	readonly unitSides: UnitSidesWire[];
	readonly slotLayouts: SlotLayoutWire[];
	readonly builtTriviaSide: WireNode[] | null;
	readonly builtLeafSide: WireNode[] | null;
	readonly builtUnitSides: UnitSidesWire[];
};
type Misdeclared = { [K in keyof WireTypes]-?: Same<Ret<Declared[K]>, WireTypes[K]> extends true ? never : K }[keyof WireTypes];
type ObjectOnlyUnit<Node extends object> = Omit<UnitSidesWire<Node>, keyof NodeTrivia> & TriviaSides<Node>;
type GeneratedRun = ItemOf<Ret<typeof Rust.layoutBaseline>>;
type LeadingOnly<Run> = Omit<Run, 'side'> & { readonly side: 'leading' };
type NoBreaks<Run> = Omit<Run, 'breaks'> & { readonly breaks?: 0 };
type CounterAsKindId = Omit<typeof Rust, 'treeMemory'> & { treeMemory(): { trees: number; counted: RustKindId; reported: number } };
type MixedKindIds<K extends KindIdReturns> = Omit<typeof Rust, K> & { readonly [P in K]: (...args: Parameters<(typeof Rust)[P]>) => RustKindId | PythonKindId | null };

expectTypeOf<Admits<(profile: 'release') => void, (profile: string) => void>>().toEqualTypeOf<false>();
expectTypeOf<Admits<(indexes: [number, number]) => void, (indexes: readonly number[]) => void>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => UnitSidesWire[], () => UnitSidesWire<ReadOutput>[]>>().toEqualTypeOf<true>();
expectTypeOf<ReturnsExactly<() => object, () => ReadOutput>>().toEqualTypeOf<true>();
expectTypeOf<ReturnsExactly<() => object, () => ReadOutput & { readonly extra: string }>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => ReadOutput & { readonly extra: string }, () => object>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => object, () => WireNode>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => ObjectOnlyUnit<object>[], () => UnitSidesWire[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => UnitSidesWire[], () => ObjectOnlyUnit<ReadOutput>[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => { slot: string; item: number }[], () => UnitSidesWire[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => { slot: string }[], () => SlotLayoutWire[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => GeneratedRun[], () => BaselineRun[]>>().toEqualTypeOf<true>();
expectTypeOf<ReturnsExactly<() => LeadingOnly<GeneratedRun>[], () => BaselineRun[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => GeneratedRun[], () => LeadingOnly<BaselineRun>[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => NoBreaks<GeneratedRun>[], () => BaselineRun[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => GeneratedRun[], () => NoBreaks<BaselineRun>[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => RustKindId | null, () => number | null, RustKindId>>().toEqualTypeOf<true>();
expectTypeOf<ReturnsExactly<() => RustKindId.Semi | null, () => number | null, RustKindId>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => RustKindId | null, () => 0 | null, RustKindId>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => PythonKindId | null, () => number | null, RustKindId>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => RustKindId | null, () => RustKindId | null, RustKindId>>().toEqualTypeOf<false>();
expectTypeOf<Drift<CounterAsKindId, RustKindId>['returns']>().toEqualTypeOf<'treeMemory'>();
expectTypeOf<Drift<MixedKindIds<'slotSeparator'>, RustKindId>['returns']>().toEqualTypeOf<'slotSeparator'>();
expectTypeOf<Drift<MixedKindIds<'separatorBefore'>, RustKindId>['returns']>().toEqualTypeOf<'separatorBefore'>();
expectTypeOf<ReturnsExactly<() => [number, object][], () => readonly (readonly [number, object])[]>>().toEqualTypeOf<true>();
expectTypeOf<ReturnsExactly<() => [number, object][], () => readonly (readonly [object, number])[]>>().toEqualTypeOf<false>();
expectTypeOf<ReturnsExactly<() => [...number[], object], () => WireNode[]>>().toEqualTypeOf<false>();

expectTypeOf<[Uint32Array] extends [ChunkWords] ? true : false>().toEqualTypeOf<true>();
expectTypeOf<TriviaSideName>().toEqualTypeOf<'leading' | 'trailing' | 'inner'>();
expectTypeOf<Misdeclared>().toEqualTypeOf<never>();
expectTypeOf<Renders<Ret<Declared['read']>, NonNullable<Declared['render']>, NonNullable<Declared['renderToFile']>>>().toEqualTypeOf<true>();

expectTypeOf<Drift<typeof Python, PythonKindId>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Regex, RegexKindId>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Rust, RustKindId>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof Scm, ScmKindId>>().toEqualTypeOf<NoDrift>();
expectTypeOf<Drift<typeof TypeScript, TypeScriptKindId>>().toEqualTypeOf<NoDrift>();

expectTypeOf<Misshaped<typeof Python>>().toEqualTypeOf<never>();
expectTypeOf<Misshaped<typeof Regex>>().toEqualTypeOf<never>();
expectTypeOf<Misshaped<typeof Rust>>().toEqualTypeOf<never>();
expectTypeOf<Misshaped<typeof Scm>>().toEqualTypeOf<never>();
expectTypeOf<Misshaped<typeof TypeScript>>().toEqualTypeOf<never>();

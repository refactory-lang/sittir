import type { LooseConfigOf, Terminal } from '@sittir/types';
import type { LeafScalarMap } from '../../packages/rust/src/types.ts';
import { TSKindId } from '../../packages/rust/src/types.ts';

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Identifier = Terminal<TSKindId.Identifier, string>;

interface MixedSlots {
	readonly $type: 999_999;
	readonly _true_or_identifier: TSKindId.TrueKeyword | Identifier;
	readonly _false_or_identifier: TSKindId.FalseKeyword | Identifier;
	readonly _boolean_or_identifier: TSKindId.TrueKeyword | TSKindId.FalseKeyword | Identifier;
	readonly _optional_true?: TSKindId.TrueKeyword;
	readonly _true_list: readonly (TSKindId.TrueKeyword | Identifier)[];
	readonly _boolean_list: readonly (TSKindId.TrueKeyword | TSKindId.FalseKeyword | Identifier)[];
	readonly _numeric: TSKindId.IntegerLiteralDecimal;
	readonly __slotNames__?: {
		readonly _true_or_identifier: 'trueOrIdentifier';
		readonly _false_or_identifier: 'falseOrIdentifier';
		readonly _boolean_or_identifier: 'booleanOrIdentifier';
		readonly _optional_true: 'optionalTrue';
		readonly _true_list: 'trueList';
		readonly _boolean_list: 'booleanList';
		readonly _numeric: 'numeric';
	};
}

type Loose = LooseConfigOf<MixedSlots, LeafScalarMap>;
type TrueOnly = Expect<Equal<Extract<Loose['trueOrIdentifier'], boolean>, true>>;
type FalseOnly = Expect<Equal<Extract<Loose['falseOrIdentifier'], boolean>, false>>;
type Both = Expect<Equal<Extract<Loose['booleanOrIdentifier'], boolean>, boolean>>;
type OptionalTrue = Expect<Equal<Extract<Loose['optionalTrue'], boolean>, true>>;
type TrueList = Expect<Equal<Extract<Extract<Loose['trueList'], readonly unknown[]>[number], boolean>, true>>;
type BooleanList = Expect<Equal<Extract<Extract<Loose['booleanList'], readonly unknown[]>[number], boolean>, boolean>>;
type Numeric = Expect<Equal<Extract<Loose['numeric'], number | bigint>, number | bigint>>;

export type { TrueOnly, FalseOnly, Both, OptionalTrue, TrueList, BooleanList, Numeric };

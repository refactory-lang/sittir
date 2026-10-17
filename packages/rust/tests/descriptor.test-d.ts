import type { Engine } from '@sittir/types';
import rust, { type FunctionItem, type RustAPI } from '../src/index.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

expectTrue<Equals<rust.FunctionItem, FunctionItem>>();
expectTrue<Equals<rust.FunctionItem.Parsed, FunctionItem.Parsed>>();
expectTrue<Equals<rust.Engine, Engine<RustAPI>>>();

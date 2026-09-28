import type { Engine, Types } from '@sittir/types';
import type { FunctionItem, RustAPI } from '@sittir/rust';
import type { SourceFileTree } from '../src/wrap.ts';

declare const rs: Engine<RustAPI>;

export const functionItem: Types<typeof rs>['functionItem'] = null as unknown as FunctionItem;
export const sameType: FunctionItem = null as unknown as Types<typeof rs>['functionItem'];

// @ts-expect-error a kind the grammar does not have
export type Missing = Types<typeof rs>['notAKind'];

export const parsed: SourceFileTree = rs.parse('fn f() {}\n');

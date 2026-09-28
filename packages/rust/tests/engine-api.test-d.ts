import type { Engine, Types } from '@sittir/types';
import type { FunctionItem, RustAPI } from '@sittir/rust';
import type { SourceFileTree } from '../src/wrap.ts';

declare const rs: Engine<RustAPI>;

export const functionItem: Types<typeof rs>['functionItem'] = null as unknown as FunctionItem;
export const sameType: FunctionItem = null as unknown as Types<typeof rs>['functionItem'];

// @ts-expect-error a kind the grammar does not have
export type Missing = Types<typeof rs>['notAKind'];

export const parsed: SourceFileTree = rs.parse('fn f() {}\n');

import { createEngine } from '@sittir/common';
import rust, { type RustNode } from '@sittir/rust';

declare const node: RustNode;
const wide: string = 'x';

void createEngine(rust, { render: { indent: '\t' } });
void createEngine(rust, { render: { indent: '    ' } });
void createEngine(rust, { render: { indent: wide } });
// @ts-expect-error 'x' is not an indent character
void createEngine(rust, { render: { indent: 'x' } });
// @ts-expect-error a line break is not an indent character
void createEngine(rust, { render: { indent: ' \n' } });
// @ts-expect-error an empty unit indents nothing
void createEngine(rust, { render: { indent: '' } });

rs.render(node, { indent: '\t' });
rs.render(node, { indent: wide });
// @ts-expect-error per-call units are checked the same way
rs.render(node, { indent: 'x' });
// @ts-expect-error a key the grammar's render options do not have
void createEngine(rust, { render: { indent: '\t', indnet: '\t' } });
// @ts-expect-error per-call options take no unknown key either
rs.render(node, { indent: '\t', indnet: '\t' });
rs.render(node, { indent: '\t', ignoreFormat: false });

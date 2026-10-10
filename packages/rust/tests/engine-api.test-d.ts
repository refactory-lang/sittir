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

void createEngine(rust, { render: { layout: { indent: '\t' } } });
void createEngine(rust, { render: { layout: { indent: '    ' } } });
void createEngine(rust, { render: { layout: { indent: wide } } });
// @ts-expect-error 'x' is not an indent character
void createEngine(rust, { render: { layout: { indent: 'x' } } });
// @ts-expect-error a line break is not an indent character
void createEngine(rust, { render: { layout: { indent: ' \n' } } });
// @ts-expect-error an empty unit indents nothing
void createEngine(rust, { render: { layout: { indent: '' } } });

rs.render(node, { layout: { indent: '\t' } });
rs.render(node, { layout: { indent: wide } });
// @ts-expect-error per-call units are checked the same way
rs.render(node, { layout: { indent: 'x' } });
// @ts-expect-error a key the grammar's render options do not have
void createEngine(rust, { render: { layout: { indent: '\t' }, indnet: '\t' } });
// @ts-expect-error per-call options take no unknown key either
rs.render(node, { layout: { indent: '\t' }, indnet: '\t' });
rs.render(node, { layout: { indent: '\t' }, ignoreFormat: false });

// The descriptor's createEngine takes exactly what createEngine(rust, …) takes.
const viaDescriptor: Promise<Engine<RustAPI>> = rust.createEngine({ render: { layout: { indent: '\t' } } });
const viaFunction: Promise<Engine<RustAPI>> = createEngine(rust, { render: { layout: { indent: '\t' } } });
void [viaDescriptor, viaFunction];
void rust.createEngine();
void rust.createEngine({ render: { layout: { indent: '    ' } } });
void rust.createEngine({ render: { layout: { indent: wide } } });
// @ts-expect-error 'x' is not an indent character
void rust.createEngine({ render: { layout: { indent: 'x' } } });
// @ts-expect-error a line break is not an indent character
void rust.createEngine({ render: { layout: { indent: ' \n' } } });
// @ts-expect-error an empty unit indents nothing
void rust.createEngine({ render: { layout: { indent: '' } } });
// @ts-expect-error a key the grammar's render options do not have
void rust.createEngine({ render: { layout: { indent: '\t' }, indnet: '\t' } });
// @ts-expect-error a mistyped value
void rust.createEngine({ render: { layout: { indent: 4 } } });

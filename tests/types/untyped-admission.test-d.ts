/**
 * An untyped node has no language, so no typed slot admits it. A `$type` of
 * plain `number` would pass into any numeric enum, so the setters refuse it by
 * a generic check of the value's inferred type; a node of another language is
 * refused by its own enum, and a node of the slot's language keeps its kind.
 *
 * Compile-time only: `pnpm run type-check:cross-language`.
 */

import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';
import type { PythonAPI } from '@sittir/python';

declare const rs: Engine<RustAPI>;
declare const py: Engine<PythonAPI>;

const untyped = { $type: 7 as number, $render: () => '' };
const block = rs.build.block();
const fn = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: block });

export const typedBody = fn.$with.body(block);
export const typedStatements = block.$with.statements(rs.build.expressionStatement(rs.build.identifier('a')));

// @ts-expect-error an untyped node has no language, so a typed slot refuses it
fn.$with.body(untyped);
// @ts-expect-error an untyped node has no language, so a typed list slot refuses it
block.$with.statements(untyped);
// @ts-expect-error a python node is not a rust block
fn.$with.body(py.build.block());

const kept: typeof rs.kinds.Block = typedBody.body().$type;
void kept;

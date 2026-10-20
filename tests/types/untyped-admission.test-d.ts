/**
 * An untyped node has no language, so no typed slot admits it. A `$type` of
 * plain `number` would pass into any numeric enum, so the setters and every
 * builder parameter that holds a node refuse it by a generic check of the
 * value's inferred type: strict and loose, positional and config, a list's
 * items, and a loose config nested in another. A node of another language is
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

// @ts-expect-error a builder's config field refuses an untyped node
rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: untyped });
// @ts-expect-error a strict builder's config field refuses an untyped node
rs.build.functionItem.strict({ name: rs.build.identifier('f'), parameters: rs.build.parameters(), body: untyped });
// @ts-expect-error a builder's positional child refuses an untyped node
rs.build.expressionStatement(untyped);
// @ts-expect-error a strict builder's positional child refuses an untyped node
rs.build.expressionStatement.strict(untyped);
// @ts-expect-error a builder taking its own kind refuses an untyped node in that place
rs.build.block(untyped);
// @ts-expect-error a list slot's item refuses an untyped node
rs.build.block({ statements: [untyped] });
// @ts-expect-error a strict list slot's item refuses an untyped node
rs.build.block.strict({ statements: [untyped] });
// @ts-expect-error an untyped node inside a nested loose config refuses the call
rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { statements: [untyped] } });
// @ts-expect-error one untyped item among typed ones refuses the call
rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a')), untyped] });

export const builtBody = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: block });
export const builtStatement = rs.build.expressionStatement(rs.build.identifier('a'));
export const builtNested = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { statements: [rs.build.expressionStatement(rs.build.identifier('a'))] } });
export const builtStrict = rs.build.functionItem.strict({ name: rs.build.identifier('f'), parameters: rs.build.parameters(), body: block });
export const builtList = rs.build.block.strict({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] });

const kept: typeof rs.kinds.Block = typedBody.body().$type;
void kept;

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
import type { Block } from '@sittir/rust';

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

declare const flag: boolean;
declare const looseBlock: Block.Loose;
// @ts-expect-error an untyped node beside a whole loose input refuses the call
rs.build.block(flag ? looseBlock : untyped);
// @ts-expect-error an untyped node inside a loose config nested in another refuses the call
rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: untyped } });
// @ts-expect-error an untyped node below loose configs nested past the widening's own depth refuses the call
rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: untyped } } } });

interface RecursiveBlock {
	readonly $type: typeof rs.kinds.Block;
	readonly trailingExpression?: RecursiveBlock;
}
interface RecursiveUntyped {
	readonly $type: typeof rs.kinds.Block;
	readonly trailingExpression?: RecursiveUntyped | typeof untyped;
}
declare const recursive: RecursiveBlock;
declare const recursiveUntyped: RecursiveUntyped;
// @ts-expect-error an untyped node inside a recursive declared type refuses the call
rs.build.block(recursiveUntyped);

// @ts-expect-error a recursive declared input nests past the depth the check reads, so it is refused by name
rs.build.block(recursive);
// @ts-expect-error a polymorph form builder refuses an untyped node
rs.build.expressionStatement.withSemi(untyped);
// @ts-expect-error a strict polymorph form builder refuses an untyped node
rs.build.expressionStatement.withSemi.strict(untyped);
// @ts-expect-error a polymorph form builder's config refuses an untyped node
rs.build.attribute.input({ path: untyped });

export const builtFormValue = rs.build.expressionStatement.withSemi(rs.build.identifier('a'));
export const builtFormConfig = rs.build.attribute.input({ path: 'x', value: 'y' });
export const builtFromLoose = rs.build.block(looseBlock);
export const builtDeep = rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: rs.build.identifier('a') } } } });
export const builtBody = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: block });
export const builtStatement = rs.build.expressionStatement(rs.build.identifier('a'));
export const builtNested = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { statements: [rs.build.expressionStatement(rs.build.identifier('a'))] } });
export const builtStrict = rs.build.functionItem.strict({ name: rs.build.identifier('f'), parameters: rs.build.parameters(), body: block });
export const builtList = rs.build.block.strict({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] });

const kept: typeof rs.kinds.Block = typedBody.body().$type;
void kept;

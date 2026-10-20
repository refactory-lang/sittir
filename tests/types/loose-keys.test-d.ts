/**
 * A builder whose input is generic refuses a key its kind does not declare:
 * a loose builder at every depth (the input's own config, a config nested in a
 * field, a list item's config, a config nested past any fixed depth), and a
 * strict builder whose config is generic, one with numeric text slots.
 * TypeScript's own excess-property check does not reach a generic parameter, so
 * the refusal walks the input beside its declared shape instead.
 *
 * Compile-time only: `pnpm run type-check:cross-language`.
 */

import type { Engine } from '@sittir/types';
import type { RustAPI } from '@sittir/rust';
import type { PythonAPI } from '@sittir/python';

declare const rs: Engine<RustAPI>;
declare const py: Engine<PythonAPI>;

// @ts-expect-error a misspelled key refuses the call
rs.build.block({ statements: [], statments: [] });
// @ts-expect-error a misspelled key in a nested config refuses the call
rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { statments: [] } });
// @ts-expect-error a misspelled key in a tagged nested config refuses the call
rs.build.block({ trailingExpression: { $type: rs.kinds.Block, statments: [] } });
// @ts-expect-error a misspelled key in a list item's config refuses the call
rs.build.block({ statements: [{ $type: rs.kinds.ExpressionStatement, content: 'a', contnt: 'b' }] });
// @ts-expect-error a misspelled key at depth three refuses the call
rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, statments: [] } } } });
// @ts-expect-error a python builder refuses a misspelled key as well
py.build.ifStatement({ condition: 'x', consequence: py.build.block(), altrnative: [] });

// @ts-expect-error a numeric builder refuses a misspelled key
rs.build.integerLiteralDecimal({ content: 1, sufix: 'u8' });
// @ts-expect-error a strict numeric builder, whose config is generic as well, refuses a misspelled key
rs.build.integerLiteralDecimal.strict({ content: 1, sufix: 'u8' });

// @ts-expect-error a polymorph form builder refuses a misspelled key
rs.build.attribute.input({ path: 'x', valu: 'y' });
declare const misspelled: { readonly $type: typeof rs.kinds.Block; readonly statments: readonly [] };
// @ts-expect-error a polymorph form builder refuses a misspelled key inside a declared value
rs.build.expressionStatement.withSemi(misspelled);

export const declaredKeys = rs.build.block({ statements: [], trailingExpression: 'a' });
export const nestedKeys = rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { statements: [] } });
export const listItemKeys = rs.build.block({ statements: [{ $type: rs.kinds.ExpressionStatement, content: 'a' }] });
export const deepKeys = rs.build.block({ trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, trailingExpression: { $type: rs.kinds.Block, statements: [] } } } });
export const numericKeys = rs.build.integerLiteralDecimal({ content: 1 });
export const strictNumericKeys = rs.build.integerLiteralDecimal.strict({ content: 1 });
export const pythonKeys = py.build.ifStatement({ condition: 'x', consequence: py.build.block(), alternative: [] });

// The shapes whose keys stay unchecked, each admitted:
// an untagged config where the place declares several untagged configs (a kind's own and its bare slot's) is checked
// against the keys of all of them together, so `left`, a where predicate's key, passes in a where clause's config;
export const uncheckedSeveralConfigs = rs.build.whereClause({ wherePredicates: [], left: 'T' });
// a type met again on the same path is not walked again, so its keys are checked at its first place only: `body` is a
// loop's key but not a block's, where the loop's own type recurs;
interface Loop {
	readonly label?: string;
	readonly body: Loop;
}
declare const loop: Loop;
export const uncheckedRevisit = rs.build.loopExpression(loop);
// and a value typed `any` proves nothing.
declare const anything: any;
export const uncheckedAny = rs.build.block({ trailingExpression: anything });

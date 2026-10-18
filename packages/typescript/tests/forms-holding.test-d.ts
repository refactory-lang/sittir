import type { FormsHolding } from '@sittir/types';
import { is } from '../src/is.ts';
import type { TSKindId } from '../src/kinds.ts';
import type * as T from '../src/types.ts';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
type Expect<_T extends true> = true;

declare const args: T.Arguments.Parsed;
declare const call: T.CallExpression.Parsed;

// The union's setter is the intersection of its forms' setters: it refuses a value only some forms hold.
// @ts-expect-error the template form takes a template string, so the union refuses an argument list
call.$with.arguments(args);

export type Held = Expect<
	Equals<FormsHolding<T.CallExpression.Parsed, 'arguments', T.Arguments.Parsed>['$type'], TSKindId.CallExpressionCall | TSKindId.CallExpressionMember>
>;
export type HeldTemplate = Expect<
	Equals<FormsHolding<T.CallExpression.Parsed, 'arguments', T.TemplateString.Parsed>['$type'], TSKindId.CallExpressionTemplateCall>
>;
export type HeldNone = Expect<Equals<FormsHolding<T.CallExpression.Parsed, 'arguments', string>, never>>;

if (is.callExpressionCall(call)) call.$with.arguments(args);

declare const breakStatement: T.BreakStatement.Parsed;
declare const label: T.StatementIdentifier.Parsed;

// An optional slot's clearing overload takes no argument, so it admits nothing.
export type OptionalRejects = Expect<Equals<FormsHolding<T.BreakStatement.Parsed, 'label', T.Number.Parsed>, never>>;
export type OptionalAdmits = Expect<Equals<FormsHolding<T.BreakStatement.Parsed, 'label', T.StatementIdentifier.Parsed>, T.BreakStatement.Parsed>>;
// A list slot's setter takes the node as well as items.
export type ListAdmits = Expect<
	Equals<FormsHolding<T.CallExpression.Parsed, 'typeArguments', T.TypeArguments.Parsed>['$type'], TSKindId.CallExpressionCall | TSKindId.CallExpressionMember>
>;
breakStatement.$with.label(label);

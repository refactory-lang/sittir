import type { PinnedBuilders } from './engine.ts';

export type B = PinnedBuilders;
export type Built<F> = F extends (...args: never[]) => infer R ? R : never;
type ConfigOf<F> = F extends (config: infer C, ...rest: never[]) => unknown ? Extract<C, object> : never;
export type SlotOf<F, K extends string> = ConfigOf<F> extends infer C ? (C extends { readonly [P in K]?: infer V } ? Exclude<V, undefined> : never) : never;
export type Expression = SlotOf<B['pair'], 'value'>;
export type Primary = SlotOf<B['memberExpression'], 'object'>;
export type Argument = Expression | Built<B['spreadElement']>;
export type Operand = SlotOf<B['binaryExpression'], 'left'>;
export type Operator = SlotOf<B['binaryExpression'], 'operator'>;
export type Statement =
	| Built<B['returnStatement']>
	| Built<B['lexicalDeclaration']>
	| Built<B['ifStatement']>
	| Built<B['switchStatement']>
	| Built<B['throwStatement']>
	| Built<B['statementBlock']>
	| Built<B['typeAliasDeclaration']>
	| Built<B['expressionStatement']>;
export type TypeNode = string | Built<B['genericType']> | Built<B['literalType']> | Built<B['unionType']> | Built<B['lookupType']> | Built<B['typeQuery']> | Built<B['objectType']> | Built<B['readonlyType']>;
export type Named = string | readonly [string, TypeNode];

export class Unfit extends Error {}

export class PinnedGap extends Unfit {}

export const pinnedGapsOf = <T extends object>(builders: T, pin: string): T => {
	const wrap = (value: object, name: string): object =>
		new Proxy(value, {
			get: (target, key, receiver) => {
				const held: unknown = Reflect.get(target, key, receiver);
				const fixed = Object.getOwnPropertyDescriptor(target, key);
				if (typeof key !== 'string' || typeof held !== 'function' || (fixed !== undefined && !fixed.configurable && !fixed.writable)) return held;
				return wrap(held, `${name}.${key}`);
			},
			apply: (target, self, args) => {
				try {
					return Reflect.apply(target as (...args: unknown[]) => unknown, self, args);
				} catch (error) {
					if (error instanceof Unfit) throw error;
					throw new PinnedGap(`the pinned builders (${pin}) can't express ${name}: ${error instanceof Error ? error.message : String(error)}`);
				}
			}
		});
	return wrap(builders, 'b') as T;
};

const ESCAPES: Readonly<Record<string, string>> = { '\\': '\\', "'": "'", '\n': 'n', '\r': 'r', '\t': 't' };

export function syntaxOf(t: B) {
	const id = (name: string) => t.identifier(name);
	const dot = (object: Primary, property: string) => t.memberExpression({ object, operator: '.', property });
	const call = (callee: Primary, ...args: Argument[]) => t.callExpressionCall({ function: callee, arguments: t.arguments(...args) });
	const str = (text: string) => {
		const parts: (string | Built<B['escapeSequence']>)[] = [];
		for (const part of text.split(/([\\'\n\r\t])/)) if (part !== '') parts.push(Object.hasOwn(ESCAPES, part) ? t.escapeSequence(ESCAPES[part]!) : part);
		return t.stringSingle(...parts);
	};
	const num = (value: number) => t.number.decimal(String(value));
	const key = (name: string) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : str(name));
	const obj = (entries: readonly (readonly [string, Expression] | Built<B['spreadElement']>)[]) =>
		t.object(...entries.map((entry) => (Array.isArray(entry) ? t.pair({ key: key(entry[0]), value: entry[1] }) : (entry as Built<B['spreadElement']>))));
	const binary = (left: Operand, operator: Operator, right: Operand) => t.binaryExpression({ left, operator, right });
	const and = (parts: readonly Operand[]): Operand | undefined => (parts.length === 0 ? undefined : parts.reduce((left, right) => binary(left, '&&', right)));
	const or = (parts: readonly Operand[]): Operand | undefined => (parts.length === 0 ? undefined : parts.reduce((left, right) => binary(left, '||', right)));
	const not = (operand: Operand): Operand => t.unaryExpression({ operator: '!', argument: operand });
	const paren = (value: Expression) => t.parenthesizedExpression.sequence(value);
	const typeIs = (value: Operand, name: string) => binary(t.unaryExpression({ operator: 'typeof', argument: value }), '===', str(name));
	const ternary = (condition: Operand, consequence: Expression, alternative: Expression) => t.ternaryExpression({ condition, consequence, alternative });
	const ret = (value?: Expression) => t.returnStatement(value);
	const block = (...statements: Statement[]) => t.statementBlock(...statements);
	const when = (condition: Expression, consequence: Statement) => t.ifStatement({ condition: paren(condition), consequence });
	const constant = (name: string, value: Expression) => t.lexicalDeclaration({ kind: 'const', declarators: [t.variableDeclaratorPlain({ name, value })] });
	const raise = (message: Expression) => t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(message) }));
	const typeRef = (name: string, first: TypeNode, ...rest: TypeNode[]) => t.genericType({ name, typeArguments: t.typeArguments(first, ...rest) });
	const union = (types: readonly TypeNode[]): TypeNode => types.reduce((left, right) => t.unionType({ left, right }));
	const parameterOf = (name: Named) => (typeof name === 'string' ? t.requiredParameter({ name }) : t.requiredParameter({ name: name[0], type: t.typeAnnotation(name[1]) }));
	const lambda = (body: Expression | Built<B['statementBlock']>, first: Named, ...rest: readonly Named[]) =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.formalParametersElements(parameterOf(first), ...rest.map(parameterOf))), body });
	const arrow = (name: string, type: TypeNode, body: Built<B['statementBlock']>, returns?: TypeNode, more: readonly (readonly [string, TypeNode])[] = []) =>
		t.arrowFunction.callSignature({
			parameters: t.formalParameters(
				t.formalParametersElements(
					t.requiredParameter({ name, type: t.typeAnnotation(type) }),
					...more.map(([parameter, annotated]) => t.requiredParameter({ name: parameter, type: t.typeAnnotation(annotated) }))
				)
			),
			...(returns === undefined ? {} : { returnType: t.typeAnnotation(returns) }),
			body
		});
	return { id, dot, call, str, num, key, obj, binary, and, or, not, paren, typeIs, ternary, ret, block, when, constant, raise, typeRef, union, parameterOf, lambda, arrow };
}

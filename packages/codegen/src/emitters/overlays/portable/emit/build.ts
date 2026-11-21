import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableContainer,
	PortableSlotRoute,
	PortablePickTest,
	PortableSeat,
	PortableSpelledFact
} from '../../../../../../types/src/portable-build.ts';
import type { PinnedBuilders } from './engine.ts';
import type { PortableEmitDiagnostic, PortableEmitInput, PortableEmitOutput, PortableEmitSlot } from '../emit-input.ts';

type B = PinnedBuilders;
type Built<F> = F extends (...args: never[]) => infer R ? R : never;
type ConfigOf<F> = F extends (config: infer C, ...rest: never[]) => unknown ? Extract<C, object> : never;
type SlotOf<F, K extends string> = ConfigOf<F> extends infer C ? (C extends { readonly [P in K]?: infer V } ? Exclude<V, undefined> : never) : never;
type Expression = SlotOf<B['pair'], 'value'>;
type Primary = SlotOf<B['memberExpression'], 'object'>;
type Argument = Expression | Built<B['spreadElement']>;
type Operand = SlotOf<B['binaryExpression'], 'left'>;
type Operator = SlotOf<B['binaryExpression'], 'operator'>;
type Statement =
	| Built<B['returnStatement']>
	| Built<B['lexicalDeclaration']>
	| Built<B['ifStatement']>
	| Built<B['switchStatement']>
	| Built<B['throwStatement']>
	| Built<B['statementBlock']>
	| Built<B['typeAliasDeclaration']>;
type TypeNode = string | Built<B['genericType']> | Built<B['literalType']> | Built<B['unionType']> | Built<B['lookupType']> | Built<B['typeQuery']> | Built<B['objectType']> | Built<B['readonlyType']>;

class Unfit extends Error {}

const identifierOf = (path: string): string => path.replace(/\./g, '_');

const holdsList = (route: PortableSlotRoute): boolean => route.multiple || route.seats.some((seat) => seat.many === true);

const buildsOnlyItem = (arm: Pick<PortableBuildArm, 'slots'>, route: PortableSlotRoute): boolean =>
	route.list === true && !holdsList(route) && arm.slots.some((other) => other.name === route.name && other.list === true && holdsList(other));

const sorted = <T>(items: Iterable<T>, key: (item: T) => string): T[] => [...items].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

interface Fitting {
	readonly arm: PortableBuildArm;
	readonly seats: readonly PortableSeat[];
}

interface Held {
	readonly owner: string;
	readonly arm: PortableBuildArm;
	readonly value: Primary;
}

interface Trie {
	path?: string;
	readonly children: Map<string, Trie>;
}

export function emitPortableModule(t: B, input: PortableEmitInput<PortableBuildTable>): { readonly program: Built<B['program']>; readonly diagnostics: readonly PortableEmitDiagnostic[] } {
	const { table } = input;
	const found: (readonly [diagnostic: PortableEmitDiagnostic, scope: string | undefined])[] = [];
	const fail = (message: string): never => {
		throw new Unfit(message);
	};
	const id = (name: string) => t.identifier(name);
	const dot = (object: Primary, property: string) => t.memberExpression({ object, operator: '.', property });
	const call = (callee: Primary, ...args: Argument[]) => t.callExpressionCall({ function: callee, arguments: t.arguments(...args) });
	const builderRef = (builder: string) => builder.split('.').reduce<Built<B['identifier']> | Built<B['memberExpression']>>((object, property) => dot(object, property), id('b'));
	const ESCAPES: Readonly<Record<string, string>> = { '\\': '\\', "'": "'", '\n': 'n', '\r': 'r', '\t': 't' };
	const str = (text: string) => {
		const parts: (string | Built<B['escapeSequence']>)[] = [];
		for (const part of text.split(/([\\'\n\r\t])/)) if (part !== '') parts.push(Object.hasOwn(ESCAPES, part) ? t.escapeSequence(ESCAPES[part]!) : part);
		return t.stringSingle(...parts);
	};
	const num = (value: number) => t.number.decimal(String(value));
	const key = (name: string) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : str(name));
	const obj = (entries: readonly (readonly [string, Expression])[]) => t.object(...entries.map(([name, value]) => t.pair({ key: key(name), value })));
	const binary = (left: Operand, operator: Operator, right: Operand) => t.binaryExpression({ left, operator, right });
	const and = (parts: readonly Operand[]): Operand | undefined => (parts.length === 0 ? undefined : parts.reduce((left, right) => binary(left, '&&', right)));
	const paren = (value: Expression) => t.parenthesizedExpression.sequence(value);
	const typeIs = (value: Operand, name: string) => binary(t.unaryExpression({ operator: 'typeof', argument: value }), '===', str(name));
	const ternary = (condition: Operand, consequence: Expression, alternative: Expression) => t.ternaryExpression({ condition, consequence, alternative });
	const ret = (value?: Expression) => t.returnStatement(value);
	const block = (...statements: Statement[]) => t.statementBlock(...statements);
	const when = (condition: Expression, consequence: Statement) => t.ifStatement({ condition: paren(condition), consequence });
	const constant = (name: string, value: Expression) => t.lexicalDeclaration({ kind: 'const', declarators: [t.variableDeclaratorPlain({ name, value })] });
	const typeRef = (name: string, first: TypeNode, ...rest: TypeNode[]) => t.genericType({ name, typeArguments: t.typeArguments(first, ...rest) });
	const pathType = (path: string) => typeRef(uses('BuildInput'), input.map, t.literalType(str(path)));
	const pathInputType = (path: string) => typeRef(uses('PathInput'), input.map, t.literalType(str(path)));
	const queried = (segments: readonly string[]): SlotOf<B['typeQueryMemberExpression'], 'object'> =>
		segments.length === 1 ? segments[0]! : t.typeQueryMemberExpression({ object: queried(segments.slice(0, -1)), operator: '.', property: segments.at(-1)! });
	const builtType = (builder: string) => typeRef('ReturnType', t.typeQuery({ expression: queried(['b', ...builder.split('.')]) }));
	const nodesType = (path: string) => t.lookupType({ type: t.lookupType({ type: input.map, indexType: t.literalType(str('nodes')) }), indexType: t.literalType(str(path)) });
	const union = (types: readonly TypeNode[]): TypeNode => types.reduce((left, right) => t.unionType({ left, right }));
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
	const listOf = (value: Operand) => paren(binary(value, '??', t.array()));
	const flagged = (value: Primary, flag: string) => call(dot(listOf(dot(value, '$flags')), 'includes'), str(flag));
	const shaped = (property: string, type: TypeNode, optional = false) =>
		t.objectType({ opening: '{', members: [t.propertySignature({ readonly: true, name: property, ...(optional ? { optional } : {}), type: t.typeAnnotation(type) })], closing: '}' });
	const raise = (message: Expression) => t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(message) }));
	const kindOf = (value: Primary) => ternary(typeIs(value, 'number'), value, dot(value, '$type'));
	const kinded = union(['number', shaped('$type', 'number')]);
	let refs = new Set<string>();
	let deps = new Map<string, ReadonlySet<string>>();
	let scope: string | undefined;
	const uses = (name: string): string => {
		refs.add(name);
		return name;
	};
	const tracked = <T>(owner: string, build: () => T): T => {
		const [outer, outerScope] = [refs, scope];
		refs = new Set();
		scope = owner;
		try {
			return build();
		} finally {
			deps.set(owner, refs);
			refs = outer;
			scope = outerScope;
		}
	};
	const unbuilt = (owner: string, value: Expression) => ret(call(id(uses('unbuilt')), str(owner), value));
	const unbuiltHelper = constant(
		'unbuilt',
		arrow('owner', 'string', block(raise(binary(binary(binary(id('owner'), '+', str(': ')), '+', paren(binary(dot(id('value'), '$path'), '??', id('owner')))), '+', str(' is not generated')))), 'never', [['value', shaped('$path', 'string', true)]])
	);
	const seatKind = t.lookupType({ type: 'T', indexType: 'number' });
	const seatedHelper = constant(
		'seated',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(
				t.typeParametersElements(
					t.typeParameter({ name: 'V', constraint: t.constraint(kinded) }),
					t.typeParameter({ const: true, name: 'T', constraint: t.constraint(t.readonlyType(t.arrayType('number'))) })
				)
			),
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'value', type: t.typeAnnotation('V') }), t.requiredParameter({ name: 'kinds', type: t.typeAnnotation('T') }))),
			returnType: t.typePredicateAnnotation(t.typePredicate({ name: 'value', type: typeRef('Extract', 'V', union([seatKind, shaped('$type', seatKind)])) })),
			body: call(dot(id('kinds'), 'includes'), kindOf(id('value')))
		})
	);
	const lists = () => typeRef('Exclude', typeRef('Extract', 'V', t.readonlyType(t.arrayType('unknown'))), kinded);
	const listedHelper = constant(
		'listed',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(t.typeParametersElements(t.typeParameter({ name: 'V' }))),
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'value', type: t.typeAnnotation('V') }))),
			returnType: t.typePredicateAnnotation(
				t.typePredicate({
					name: 'value',
					type: t.conditionalType({
						left: t.tupleType(lists()),
						right: t.tupleType('never'),
						consequence: t.intersectionType({ left: 'V', right: t.readonlyType(t.arrayType('never')) }),
						alternative: lists()
					})
				})
			),
			body: call(dot(id('Array'), 'isArray'), id('value'))
		})
	);
	const unspelledHelper = constant('unspelled', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' cannot spell ')), '+', id('value')))), 'never', [['value', union(['number', 'bigint'])]]));
	const missingHelper = constant('missing', arrow('owner', 'string', block(raise(binary(id('owner'), '+', str(' is required')))), 'never'));
	const unlistedHelper = constant('unlisted', arrow('owner', 'string', block(raise(binary(id('owner'), '+', str(' holds one value, not a list')))), 'never'));
	const unroutedHelper = constant('unrouted', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' has no slot ')), '+', id('slot')))), 'never', [['slot', 'string']]));
	const unflaggedHelper = constant('unflagged', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' builds no flag ')), '+', id('flag')))), 'never', [['flag', 'string']]));
	const isNodeHelper = constant(
		'isNode',
		t.arrowFunction.callSignature({
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'value', type: t.typeAnnotation('unknown') }))),
			returnType: t.typePredicateAnnotation(t.typePredicate({ name: 'value', type: input.node })),
			body: call(id('isAnyNode'), id('value'))
		})
	);
	const untextedHelper = constant('untexted', arrow('owner', 'string', block(raise(binary(binary(binary(id('owner'), '+', str(' has no route that seats the text "')), '+', id('value')), '+', str('"')))), 'never', [['value', 'string']]));
	const unnumberedHelper = constant('unnumbered', arrow('owner', 'string', block(raise(binary(binary(binary(id('owner'), '+', str(' builds no ')), '+', id('scalar')), '+', str(' number')))), 'never', [['scalar', 'string']]));
	const unseatedHelper = constant('unseated', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' has no seat for kind ')), '+', paren(kindOf(id('value')))))), 'never', [['value', kinded]]));
	const objectTypeOf = (members: readonly (readonly [name: string, type: TypeNode, optional?: true])[]) =>
		t.objectType({ opening: '{', members: members.map(([name, type, optional]) => t.propertySignature({ readonly: true, name, ...(optional === undefined ? {} : { optional }), type: t.typeAnnotation(type) })), closing: '}' });
	const unsetHelper = constant('unset', arrow('owner', 'string', block(raise(binary(binary(binary(id('owner'), '+', str(': $at names ')), '+', id('fact')), '+', str(', which it does not set')))), 'never', [['fact', 'string']]));
	type Named = string | readonly [string, TypeNode];
	const parameterOf = (name: Named) => (typeof name === 'string' ? t.requiredParameter({ name }) : t.requiredParameter({ name: name[0], type: t.typeAnnotation(name[1]) }));
	const lambda = (body: Expression, first: Named, ...rest: readonly Named[]) =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.formalParametersElements(parameterOf(first), ...rest.map(parameterOf))), body });
	const withoutFlagsHelper = constant(
		'withoutFlags',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(t.typeParametersElements(t.typeParameter({ name: 'T', constraint: t.constraint(shaped('$flags', t.readonlyType(t.arrayType('string')), true)) }))),
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'value', type: t.typeAnnotation('T') }), t.requiredParameter({ name: 'flags', type: t.typeAnnotation(typeRef('ReadonlyArray', 'string')) }))),
			returnType: t.typeAnnotation('T'),
			body: paren(
				t.object(
					t.spreadElement(id('value')),
					t.pair({
						key: '$flags',
						value: call(dot(listOf(dot(id('value'), '$flags')), 'filter'), lambda(t.unaryExpression({ operator: '!', argument: call(dot(id('flags'), 'includes'), id('flag')) }), 'flag'))
					})
				)
			)
		})
	);
	const [index, item] = [dot(id('at'), 'index'), dot(id('at'), 'item')];
	const unindexed = binary(index, '===', id('undefined'));
	const spelledItems = typeRef('ReadonlyArray', 'T');
	const withSpelledHelper = constant(
		'withSpelled',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(t.typeParametersElements(t.typeParameter({ name: 'T' }))),
			parameters: t.formalParameters(
				t.formalParametersElements(
					t.requiredParameter({ name: 'held', type: t.typeAnnotation(spelledItems) }),
					t.requiredParameter({ name: 'spelled', type: t.typeAnnotation(typeRef('ReadonlyArray', objectTypeOf([['index', union(['number', 'undefined'])], ['item', 'T']]))) })
				)
			),
			body: t.array(
				t.spreadElement(call(dot(id('spelled'), 'flatMap'), lambda(ternary(unindexed, t.array(item), t.array()), 'at'))),
				t.spreadElement(
					t.callExpressionCall({
						function: dot(
							call(dot(call(dot(id('spelled'), 'flatMap'), lambda(ternary(unindexed, t.array(), t.array(obj([['index', index], ['item', item]]))), 'at')), 'sort'), lambda(binary(dot(id('a'), 'index'), '-', dot(id('b'), 'index')), 'a', 'b')),
							'reduce'
						),
						typeArguments: t.typeArguments(spelledItems),
						arguments: t.arguments(
							lambda(t.array(t.spreadElement(call(dot(id('items'), 'slice'), num(0), index)), item, t.spreadElement(call(dot(id('items'), 'slice'), index))), ['items', spelledItems], 'at'),
							id('held')
						)
					})
				)
			)
		})
	);
	const entryAt = (at: number) => t.subscriptExpression({ object: id('entry'), index: num(at) });
	const unroutedInHelper = constant(
		'unroutedIn',
		t.arrowFunction.callSignature({
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'input', type: t.typeAnnotation('unknown') }), t.requiredParameter({ name: 'routed', type: t.typeAnnotation(typeRef('ReadonlyArray', 'string')) }))),
			returnType: t.typeAnnotation(union(['string', 'undefined'])),
			body: ternary(
				and([typeIs(id('input'), 'object'), binary(id('input'), '!==', t.null)])!,
				t.subscriptExpression({
					object: call(
						dot(call(dot(id('Object'), 'entries'), id('input')), 'find'),
						lambda(
							and([
								binary(entryAt(1), '!==', id('undefined')),
								t.unaryExpression({ operator: '!', argument: call(dot(entryAt(0), 'startsWith'), str('$')) }),
								t.unaryExpression({ operator: '!', argument: call(dot(id('routed'), 'includes'), entryAt(0)) })
							])!,
							'entry'
						)
					),
					optionalChain: '?.',
					index: num(0)
				}),
				id('undefined')
			)
		})
	);
	const nonEmptyHelper = constant(
		'nonEmpty',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(t.typeParametersElements(t.typeParameter({ name: 'T' }))),
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'owner', type: t.typeAnnotation('string') }), t.requiredParameter({ name: 'items', type: t.typeAnnotation(spelledItems) }))),
			returnType: t.typeAnnotation(t.readonlyType(t.tupleType('T', t.restType(t.arrayType('T'))))),
			body: block(
				constant('first', t.subscriptExpression({ object: id('items'), index: num(0) })),
				when(binary(id('first'), '===', id('undefined')), raise(binary(id('owner'), '+', str(' requires at least one element')))),
				ret(t.array(id('first'), t.spreadElement(call(dot(id('items'), 'slice'), num(1)))))
			)
		})
	);
	const noSpellingHelper = constant(
		'noSpelling',
		arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' has no spelling ')), '+', call(dot(id('JSON'), 'stringify'), id('spelling'))))), 'never', [['spelling', union(['string', 'undefined'])]])
	);
	const holes = new Set(input.holes.map(([holder, key]) => `${holder} ${key}`));
	const takesHoles = (slot: PortableSlotRoute): boolean => slot.seats.some((seat) => holes.has(`${seat.at[0]} ${seat.at[1]}`));

	const shapeOf = (builder: string) => table.builders[builder];
	const rowOf = (path: string): PortableBuildPath | undefined => (Object.hasOwn(table.paths, path) ? table.paths[path] : undefined);
	const seatsFor = (arm: PortableBuildArm, seats: readonly PortableSeat[]): readonly PortableSeat[] =>
		seats.filter((seat) => (arm.holders === undefined || arm.holders.some(([holder, slot]) => holder === seat.at[0] && slot === seat.at[1])) && seat.kinds.includes(arm.kind));
	const fittingOf = (path: string, seats: readonly PortableSeat[]): readonly Fitting[] =>
		(rowOf(path)?.arms ?? []).flatMap((arm) => {
			const fitting = seatsFor(arm, seats);
			return fitting.length === 0 ? [] : [{ arm, seats: fitting }];
		});

	const checkContainer = (container: PortableContainer): void => {
		if (container.mounted !== undefined) fail(`a mounted container at ${container.key}`);
		if (container.flatten === true) fail(`a flattened container at ${container.key}`);
	};
	const checkSeat = (seat: PortableSeat): void => {
		if (seat.contents !== undefined) fail(`a seat at ${seat.at[1]} with flag-built contents`);
		if (seat.final === true) fail(`a seat at ${seat.at[1]} holding a list's last element`);
		for (const container of seat.within ?? []) checkContainer(container);
	};
	const placeOne = (container: PortableContainer, inner: Expression, held?: Held): Expression => {
		if (container.builder === undefined) return fail(`a container at ${container.key} with no builder of its own`);
		const shape = shapeOf(container.builder);
		if ((container.slots ?? []).length > 0 && shape !== 'config') return fail(`a container builder ${container.builder} that holds slots of its own taking a ${shape} input`);
		if (shape === 'config') return call(builderRef(container.builder), obj([[container.key, inner], ...(held === undefined ? [] : ownedEntries(container, held))]));
		if (shape === 'forwarded' || shape === 'direct' || shape === 'spread' || shape === 'elements') return call(builderRef(container.builder), inner);
		return fail(`a container builder ${container.builder} taking a ${shape} input`);
	};
	const extending = (seats: readonly PortableSeat[], base: PortableSeat): readonly PortableSeat[] => {
		const prefix = base.within ?? [];
		return seats.filter((seat) => (seat.within ?? []).length >= prefix.length && prefix.every((container, i) => container.builder === seat.within![i]!.builder && container.key === seat.within![i]!.key));
	};
	const wrapOne = (within: readonly PortableContainer[] | undefined, value: Expression, held?: Held): Expression =>
		[...(within ?? [])].reverse().reduce((inner, container) => placeOne(container, inner, held), value);
	const wrapList = (within: readonly PortableContainer[], items: { readonly all: Expression } | { readonly first: Expression; readonly rest: Expression }): Expression => {
		const inner = within.at(-1)!;
		if (inner.builder === undefined) return fail(`a list container at ${inner.key} with no builder of its own`);
		const shape = shapeOf(inner.builder);
		const args: Argument[] = 'all' in items ? [t.spreadElement(items.all)] : [items.first, t.spreadElement(items.rest)];
		const listed =
			shape === 'spread' || shape === 'elements'
				? call(builderRef(inner.builder), ...args)
				: shape === 'config'
					? call(builderRef(inner.builder), obj([[inner.key, 'all' in items ? items.all : t.array(...args)]]))
					: fail(`a list container builder ${inner.builder} taking a ${shape} input`);
		return wrapOne(within.slice(0, -1), listed);
	};
	let prelude: Statement[] = [];
	let preludeNames = new Set<string>();
	const preluded = (build: () => Statement[]): Statement[] => {
		const [outer, outerNames] = [prelude, preludeNames];
		prelude = [];
		preludeNames = new Set();
		try {
			const body = build();
			return [...prelude, ...body];
		} finally {
			prelude = outer;
			preludeNames = outerNames;
		}
	};
	const split = (name: string, list: Expression, item: string): { readonly empty: Operand; readonly items: { readonly first: Expression; readonly rest: Expression } } => {
		const [first, rest] = [`${name}$first`, `${name}$rest`];
		if (!preludeNames.has(first)) prelude.push(constant(first, t.subscriptExpression({ object: list, index: num(0) })), constant(rest, call(dot(list, 'slice'), num(1))));
		preludeNames.add(first);
		return { empty: binary(id(first), '===', id('undefined')), items: { first: call(id(item), id(first)), rest: call(dot(id(rest), 'map'), id(item)) } };
	};

	const builtSlotsOf = (arm: PortableBuildArm): readonly PortableSlotRoute[] => [...arm.slots, ...(arm.content === undefined ? [] : [arm.content])];
	const regexOf = (pattern: NonNullable<PortableSeat['pattern']>) => t.regex({ pattern: pattern.source, ...(pattern.flags === '' ? {} : { flags: pattern.flags }) });
	const spelledFit = (arm: PortableBuildArm, route: PortableSlotRoute, text: Primary): Operand | boolean => {
		const tokens = route === arm.content ? [] : [...new Set(route.seats.flatMap((seat) => Object.keys(seat.tokens ?? {})))].sort();
		const spelling = route === arm.content ? route.seats : route.seats.filter((seat) => seat.leaf !== undefined || seat.text === true);
		if (spelling.some((seat) => seat.pattern === undefined)) return true;
		return or([...(tokens.length === 0 ? [] : [call(dot(t.array(...tokens.map(str)), 'includes'), text)]), ...spelling.flatMap((seat) => (seat.pattern === undefined ? [] : [call(dot(regexOf(seat.pattern), 'test'), text)]))]) ?? false;
	};
	const notText = (value: Operand) => binary(t.unaryExpression({ operator: 'typeof', argument: value }), '!==', str('string'));
	const spelledBy = (path: string, arm: PortableBuildArm, value: Primary): Operand | undefined => {
		const routes = builtSlotsOf(arm).filter((route, i, all) => all.findIndex((other) => other.name === route.name && JSON.stringify(other.steps) === JSON.stringify(route.steps)) === i);
		const names = [...new Set(routes.map((route) => route.name))].filter((name) => statesName(path, name));
		const parts = names.map((name): Operand | true => {
			const fits = routes
				.filter((route) => route.name === name)
				.map((route): Operand | true => {
					const given = dot(value, name);
					if (isListed(route)) {
						const fit = spelledFit(arm, route, id('item'));
						return fit === true ? true : call(dot(listOf(given), 'every'), lambda(fit === false ? notText(id('item')) : binary(notText(id('item')), '||', fit), 'item'));
					}
					if (route.seats.some((seat) => seat.many === true)) return fail(`a pick by the texts ${name} spells, which takes one value or a list`);
					const fit = spelledFit(arm, route, given);
					return fit === true ? true : fit === false ? notText(given) : paren(binary(notText(given), '||', fit));
				});
			const either = fits.filter((fit): fit is Operand => fit !== true);
			return fits.includes(true) ? true : either.length === 1 ? either[0]! : paren(either.reduce((left, right) => binary(left, '||', right)));
		});
		return and(parts.filter((part): part is Operand => part !== true));
	};
	const statesName = (path: string, name: string): boolean => (name === '$value' ? textValues.has(path) || rowOf(path)?.builds !== undefined : input.slots[path]?.[name] !== undefined);
	const testOf = (test: PortablePickTest, path: string, arm: PortableBuildArm, value: Primary): Operand | undefined => {
		const stated = (names: readonly string[]) => names.filter((name) => statesName(path, name));
		if ('absent' in test)
			return and([...stated(test.required).map((name) => binary(dot(value, name), '!==', id('undefined'))), ...stated(test.absent).map((name) => binary(dot(value, name), '===', id('undefined')))]);
		if ('empty' in test) return and(stated(test.empty).map((name) => binary(dot(listOf(dot(value, name)), 'length'), '===', num(0))));
		if ('flag' in test) return test.set ? flagged(value, test.flag) : t.unaryExpression({ operator: '!', argument: flagged(value, test.flag) });
		if ('text' in test) return binary(dot(value, '$value'), '===', str(test.text));
		if ('boolean' in test) return binary(dot(value, '$value'), '===', test.boolean ? 'true' : 'false');
		if ('variant' in test) return spelledBy(path, arm, value);
		if (!statesName(path, test.slot)) return undefined;
		const given = dot(value, test.slot);
		const route = arm.slots.find((candidate) => candidate.name === test.slot);
		if (route === undefined) return binary(given, '===', id('undefined'));
		const kind = kindFunction(path, arm, route);
		const fits = (item: Primary) => call(dot(t.array(...test.kinds.map(num)), 'includes'), binary(call(id(kind), item), '??', t.unaryExpression({ operator: '-', argument: num(1) })));
		const all = (items: Primary) => call(dot(items, 'every'), lambda(fits(id('item')), 'item'));
		if (isListed(route)) return all(listOf(given));
		const single = paren(binary(binary(given, '===', id('undefined')), '||', fits(given)));
		return eitherArity(route) ? paren(ternary(call(id(uses('listed')), given), all(given), single)) : single;
	};
	const pickOf = (path: string, arm: PortableBuildArm, value: Primary): Operand | undefined => and(arm.when.map((test) => testOf(test, path, arm, value)).filter((part): part is Operand => part !== undefined));

	const tableSeats = Object.values(table.paths).flatMap((row) => row.arms.flatMap((arm) => builtSlotsOf(arm).flatMap((slot) => slot.seats)));
	const owning = new Map<number, Map<string, PortableSlotRoute>>();
	for (const seat of tableSeats)
		for (const container of seat.within ?? [])
			for (const route of container.slots ?? [])
				for (const kind of seat.kinds) {
					const routes = owning.get(kind) ?? owning.set(kind, new Map()).get(kind)!;
					if (!routes.has(route.name)) routes.set(route.name, route);
				}
	const factsIn = (arm: PortableBuildArm, name: string): readonly PortableSpelledFact[] => (arm.facts ?? []).filter((fact) => fact.slot === name);
	const ownedNames = (path: string, arm: PortableBuildArm): readonly string[] =>
		[...(owning.get(arm.kind)?.keys() ?? [])].filter((name) => input.slots[path]?.[name] !== undefined || factsIn(arm, name).length > 0).sort();
	const exactOf = (owner: string, arm: PortableBuildArm, name: string): PortableEmitSlot | undefined => {
		const exact = input.slots[owner]?.[name];
		const spelled = factsIn(arm, name).flatMap((fact) => fact.spellings.map((spelling) => spelling.item.$path));
		if (spelled.length === 0) return exact;
		return { paths: [...new Set([...(exact?.paths ?? []), ...spelled])].sort(), texts: exact?.texts ?? [], unmapped: exact?.unmapped ?? [], string: exact?.string ?? false, numbers: exact?.numbers ?? [], optional: true };
	};
	const factChainOf = (arm: PortableBuildArm): readonly (readonly PortableContainer[])[] => {
		const slots = [...new Set((arm.facts ?? []).map((fact) => fact.slot))];
		if (slots.length === 0) return [];
		const chains = new Map<string, readonly PortableContainer[]>();
		for (const seat of tableSeats) {
			if (!seat.kinds.includes(arm.kind)) continue;
			const within = seat.within ?? [];
			const at = within.findIndex((container) => slots.every((name) => (container.slots ?? []).some((route) => route.name === name)));
			if (at >= 0) chains.set(JSON.stringify(within.slice(at)), within.slice(at));
		}
		if (chains.size !== 1) return fail(`arm ${arm.kind} spells its facts in ${chains.size} containers`);
		return [...chains.values()];
	};

	const spelledLiteral = (value: unknown, holes: ReadonlyMap<string, Expression>, keys: readonly string[]): Expression => {
		const hole = holes.get(keys.join('.'));
		if (hole !== undefined) return hole;
		if (typeof value === 'string') return str(value);
		if (typeof value === 'number') return num(value);
		if (typeof value === 'boolean') return value ? t.true : t.false;
		if (Array.isArray(value) || (value !== undefined && (value === null || typeof value !== 'object'))) return fail(`a spelling item holding ${JSON.stringify(value)}`);
		const entries = value === undefined ? [] : Object.entries(value);
		const named = new Set(entries.map(([key]) => key));
		const added = [...holes.keys()].map((at) => at.split('.')).filter((at) => at.length > keys.length && keys.every((key, i) => at[i] === key) && !named.has(at[keys.length]!)).map((at) => at[keys.length]!);
		return obj([...entries, ...[...new Set(added)].map((key) => [key, undefined] as const)].map(([key, held]) => [key, spelledLiteral(held, holes, [...keys, key])] as const));
	};
	const atOf = (value: Primary, fact: string) => t.memberExpression({ object: dot(value, '$at'), operator: '?.', property: fact });
	const placeOf = (value: Primary, fact: string, property: 'index' | 'spelling') => t.memberExpression({ object: atOf(value, fact), operator: '?.', property });
	const length = (operand: Primary) => dot(operand, 'length');
	const spelledAs = (spelling: Primary, text: readonly string[]): Operand => {
		if (text.length === 1) return binary(spelling, '===', str(text[0]!));
		if (text.length !== 2) return fail(`a spelling with ${text.length - 1} holes`);
		const [first, last] = text as readonly [string, string];
		return and([
			...(first === '' ? [] : [call(dot(spelling, 'startsWith'), str(first))]),
			...(last === '' ? [] : [call(dot(spelling, 'endsWith'), str(last))]),
			...(first === '' || last === '' ? [] : [binary(length(spelling), '>=', num(first.length + last.length))])
		]) ?? t.true;
	};
	const spelledItemOf = (owner: string, fact: PortableSpelledFact, value: Primary): Expression => {
		const items = fact.spellings.map((spelling) =>
			spelledLiteral(
				spelling.item,
				new Map(Object.entries(spelling.holes ?? {}).map(([hole, keys]) => [keys.join('.'), ternary(typeIs(dot(value, hole), 'string'), dot(value, hole), call(id(uses('missing')), str(`${owner}.${hole}`)))] as const)),
				[]
			)
		);
		const spelling = placeOf(value, fact.name, 'spelling');
		const named = fact.spellings.reduceRight<Expression>(
			(otherwise, { text }, i) => ternary(spelledAs(spelling, text), items[i]!, otherwise),
			call(id(uses('noSpelling')), str(`${owner}.${fact.name}`), spelling)
		);
		return ternary(binary(spelling, '===', id('undefined')), items[0]!, named);
	};
	const factEntryOf = (owner: string, fact: PortableSpelledFact, value: Primary, built: string): Argument => {
		const entry = obj([
			['index', placeOf(value, fact.name, 'index')],
			['item', call(id(built), spelledItemOf(owner, fact, value))]
		]);
		return fact.flag === undefined ? entry : t.spreadElement(paren(ternary(flagged(value, fact.flag), t.array(entry), t.array())));
	};
	const nonEmptyOf = (owner: string, route: PortableSlotRoute, items: Expression): Expression => call(id(uses('nonEmpty')), str(`${owner}.${route.name}`), items);
	const ownedEntries = (container: PortableContainer, { owner, arm, value }: Held): (readonly [string, Expression])[] =>
		(container.slots ?? []).flatMap((route) => {
			const facts = factsIn(arm, route.name);
			const stated = input.slots[owner]?.[route.name] !== undefined;
			if (!stated && facts.length === 0) return [];
			if (route.steps.length !== 1) return fail(`${route.name} sits ${route.steps.length} steps into ${container.builder}`);
			if (arm.slots.some((slot) => slot.name === route.name)) return fail(`arm ${arm.kind} routes ${route.name} itself and through its container ${container.builder}`);
			if ((facts.length > 0 || route.nonEmpty === true) && !route.multiple) return fail(`${route.name} is spelled with facts or never empty, but holds one item`);
			const held = stated ? slotValue(owner, arm, route, value, true) : t.array();
			const spelled = facts.length === 0 ? held : call(id(uses('withSpelled')), held, t.array(...facts.map((fact) => factEntryOf(owner, fact, value, slotFunction(owner, arm, route, 0)))));
			return [[route.steps[0]!.key, route.nonEmpty === true ? nonEmptyOf(owner, route, spelled) : spelled] as const];
		});
	const fillsWithout = (seat: PortableSeat, skip: number): boolean => !(seat.within ?? []).slice(skip).some((container) => (container.slots ?? []).some((route) => route.nonEmpty === true));
	const or = (parts: readonly Operand[]): Operand | undefined => (parts.length === 0 ? undefined : parts.reduce((left, right) => binary(left, '||', right)));
	const not = (operand: Operand): Operand => t.unaryExpression({ operator: '!', argument: operand });
	const flagsOf = (facts: readonly PortableSpelledFact[]): readonly string[] => facts.flatMap((fact) => (fact.flag === undefined ? [] : [fact.flag]));
	const unstatedOf = (path: string, arm: PortableBuildArm, name: string, value: Primary): Operand | false | undefined => {
		const facts = factsIn(arm, name);
		if (facts.some((fact) => fact.flag === undefined)) return false;
		const route = owning.get(arm.kind)!.get(name)!;
		const empty = isListed(route) ? binary(dot(listOf(dot(value, name)), 'length'), '===', num(0)) : binary(dot(value, name), '===', id('undefined'));
		return and([...(input.slots[path]?.[name] === undefined ? [] : [empty]), ...flagsOf(facts).map((flag) => not(flagged(value, flag)))]);
	};
	const statedOf = (path: string, arm: PortableBuildArm, name: string, value: Primary): Operand | true | undefined => {
		const facts = factsIn(arm, name);
		if (facts.some((fact) => fact.flag === undefined)) return true;
		return or([...(input.slots[path]?.[name] === undefined ? [] : [binary(dot(value, name), '!==', id('undefined'))]), ...flagsOf(facts).map((flag) => flagged(value, flag))]);
	};
	const setFlagsOf = (within: readonly PortableContainer[], kind: number): readonly string[] =>
		[...new Set(within.flatMap((container) => (container.sets === undefined || (container.sets.elements !== undefined && !container.sets.elements.includes(kind)) ? [] : container.sets.flags)))].sort();
	const placement = (path: string, arm: PortableBuildArm, groups: readonly (readonly PortableContainer[])[], value: Primary, build: (given: Primary) => Expression, where: string): Statement[] => {
		const names = ownedNames(path, arm);
		const sets = groups.map((within) => setFlagsOf(within, arm.kind));
		const setting = [...new Set(sets.flat())].sort();
		const flagsFit = (i: number): readonly Operand[] => setting.map((flag) => (sets[i]!.includes(flag) ? flagged(value, flag) : not(flagged(value, flag))));
		const built = (i: number): Expression => build(sets[i]!.length === 0 ? value : call(id(uses('withoutFlags')), value, t.array(...sets[i]!.map(str))));
		if (names.length === 0) {
			if (setting.length === 0) return [ret(wrapOne(groups[0], built(0)))];
			return [...groups.map((within, i) => when(and(flagsFit(i))!, ret(wrapOne(within, built(i))))), raise(str(`${path}: no seat of ${where} sets the flags it states`))];
		}
		const owns = groups.map((within) => new Set(within.flatMap((container) => (container.slots ?? []).map((route) => route.name))));
		const held: Held = { owner: path, arm, value };
		const statements: Statement[] = [];
		for (const name of names) {
			if (owns.some((owned) => owned.has(name))) continue;
			const stated = statedOf(path, arm, name, value);
			if (stated === true) return fail(`arm ${arm.kind} spells ${name} in its container, which no seat of ${where} has`);
			if (stated !== undefined) statements.push(when(stated, ret(call(id(uses('unrouted')), str(path), str(name)))));
		}
		for (const [i, within] of groups.entries()) {
			const parts = names.filter((name) => !owns[i]!.has(name) && owns.some((owned) => owned.has(name))).map((name) => unstatedOf(path, arm, name, value));
			if (parts.includes(false)) continue;
			const wrapped = ret(wrapOne(within, built(i), held));
			const condition = and([...flagsFit(i), ...parts.filter((part): part is Operand => part !== undefined && part !== false)]);
			if (condition === undefined) return [...statements, wrapped];
			statements.push(when(condition, wrapped));
		}
		return [...statements, raise(str(`${path}: no seat of ${where} holds the slots it states together`))];
	};

	const viewed = new Set(input.viewed);
	const textPaths = new Set(input.textPaths);
	const textInputs = new Set(input.textInputs);
	const textValues = new Set(input.textValues);
	const textKinds = new Set(input.textKinds);
	const textTyped = (path: string): boolean => textPaths.has(path) || textInputs.has(path) || textKinds.has(path);
	const failed = new Map<string, string>();
	let slotFunctions = new Map<string, readonly Statement[]>();
	let armFunctions = new Map<string, Statement>();
	let grew = false;

	const wrappedText = (owner: string, holder: PortableBuildArm, exact: PortableEmitSlot, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[]): Statement[] => {
		const takesText = (path: string, name: string): boolean => {
			const set = input.slots[path]?.[name];
			return set !== undefined && (set.string || set.texts.length > 0 || set.paths.some(textTyped));
		};
		const wrappers = exact.paths.flatMap((path) => {
			const fitting = viewed.has(path) ? fittingOf(path, slot.seats) : [];
			if (fitting.length !== 1) return [];
			const required = fitting[0]!.arm.slots.filter((route) => input.slots[path]?.[route.name]?.optional !== true || (!isListed(route) && route.steps[0]?.optional !== true));
			return required.length === 1 && takesText(path, required[0]!.name) ? [[path, required[0]!] as const] : [];
		});
		const outermost = wrappers.filter(([path]) => !wrappers.some(([other]) => path.startsWith(`${other}.`)));
		if (outermost.length !== 1) return [ret(call(id(uses('untexted')), str(`${owner}.${slot.name}`), value))];
		const [path, route] = outermost[0]!;
		return caseOf(owner, holder, path, slot, skip, obj([[route.name, isListed(route) ? t.array(value) : value]]), every, obj([['$path', str(path)]]));
	};

	const textSeatsOf = (slot: PortableSlotRoute, skip: number): readonly PortableSeat[] => slot.seats.filter((seat) => fillsWithout(seat, skip));
	const tokensOf = (seats: readonly PortableSeat[]): readonly (readonly [string, number])[] => [...new Map(seats.flatMap((seat) => Object.entries(seat.tokens ?? {}))).entries()];
	const placesText = (seats: readonly PortableSeat[], texted: boolean): boolean => texted || tokensOf(seats).length > 0 || seats.some((seat) => seat.leaf !== undefined || seat.text === true);
	const leafChoices = (seats: readonly PortableSeat[], value: Primary): readonly { readonly seat: PortableSeat; readonly condition?: Operand }[] => {
		const leaves = seats.filter((seat) => seat.leaf !== undefined);
		const choices: { readonly seat: PortableSeat; readonly condition?: Operand }[] = [];
		for (const seat of leaves) {
			if (seat.pattern === undefined) return [...choices, { seat }];
			choices.push({ seat, condition: call(dot(regexOf(seat.pattern), 'test'), value) });
		}
		return leaves.length === 0 ? choices : [...choices, { seat: leaves[0]! }];
	};

	const stringBranch = (owner: string, holder: PortableBuildArm, exact: PortableEmitSlot, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[], texted: boolean): Statement[] | undefined => {
		const seats = textSeatsOf(slot, skip);
		if (!placesText(seats, texted)) return undefined;
		const tokens = tokensOf(seats);
		const textSeat = seats.find((seat) => seat.text === true);
		const place = (seat: PortableSeat, built: Expression = seat.leaf === undefined ? value : call(builderRef(seat.leaf), value)) => wrapOne((seat.within ?? []).slice(skip), built);
		const tokenSeat = (kind: number): PortableSeat => seats.find((seat) => seat.kinds.includes(kind)) ?? seats[0]!;
		const placed: Statement[] = leafChoices(seats, value).map(({ seat, condition }) => (condition === undefined ? ret(place(seat)) : when(condition, ret(place(seat)))));
		if (placed.length === 0 && textSeat !== undefined) placed.push(ret(place(textSeat)));
		if (placed.length === 0 && (texted || tokens.length > 0)) placed.push(...wrappedText(owner, holder, exact, slot, skip, value, every));
		if (tokens.length === 0) return placed;
		return [
			t.switchStatement({
				value: paren(value),
				body: t.switchBody(...tokens.map(([text, kind]) => t.switchCase({ value: str(text), bodies: [ret(place(tokenSeat(kind), num(kind)))] })), t.switchDefault({ bodies: placed }))
			})
		];
	};


	const placedArm = (path: string, slot: PortableSlotRoute, { arm, seats }: Fitting, skip: number, value: Primary): Statement | undefined => {
		const name = armName(path, arm);
		if (name === undefined) return undefined;
		const groups = [...new Map(seats.map((seat) => [JSON.stringify((seat.within ?? []).slice(skip)), (seat.within ?? []).slice(skip)] as const)).values()];
		const statements = placement(path, arm, groups, value, (given) => call(id(name), given), `${slot.name}'s seats`);
		return statements.length === 1 ? statements[0] : block(...statements);
	};

	const scalarChoice = (path: string, arms: readonly PortableBuildArm[], value: Primary, built: (arm: PortableBuildArm) => Statement, otherwise: Statement): Statement[] | undefined => {
		const builds = rowOf(path)?.builds;
		const scalars = builds === undefined ? [] : arms.filter((arm) => arm.scalar !== undefined && builds[arm.scalar] === arm.kind);
		if (scalars.length === 0) return undefined;
		const armFor = (...wanted: readonly Scalar[]): PortableBuildArm => wanted.map((scalar) => scalars.find((arm) => arm.scalar === scalar)).find((arm) => arm !== undefined) ?? scalars[0]!;
		const given = dot(value, '$value');
		const [big, integer, float] = [armFor('bigint', 'integer'), armFor('integer'), armFor('float')];
		if (big === integer && integer === float) return [built(integer)];
		return [
			when(typeIs(given, 'bigint'), built(big)),
			when(typeIs(given, 'number'), integer === float ? built(integer) : block(when(call(dot(id('Number'), 'isSafeInteger'), given), built(integer)), built(float))),
			otherwise
		];
	};

	const armChoice = (path: string, slot: PortableSlotRoute, value: Primary, built: (fit: Fitting) => Statement | undefined, refused: () => Statement): Statement[] => {
		const fitting = fittingOf(path, slot.seats);
		const scalar = scalarChoice(path, fitting.map(({ arm }) => arm), value, (arm) => built(fitting.find((fit) => fit.arm === arm)!) ?? refused(), refused());
		if (scalar !== undefined) return scalar;
		const statements: Statement[] = [];
		for (const [i, fit] of fitting.entries()) {
			const placed = built(fit);
			if (placed === undefined) return [...statements, refused()];
			const condition =
				i === fitting.length - 1 ? undefined : (pickOf(path, fit.arm, value) ?? fail(`${fitting.length} arms of ${path} fit ${slot.name}'s seats, and nothing picks arm ${fit.arm.kind} among them`));
			if (condition === undefined) return [...statements, placed];
			statements.push(when(condition, placed));
		}
		return [...statements, refused()];
	};

	const caseOf = (owner: string, holder: PortableBuildArm, path: string, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[], shown: Expression = value): Statement[] => {
		if (fittingOf(path, slot.seats).length === 0) {
			if (fittingOf(path, every).length === 0) {
				const others = (rowOf(owner)?.arms ?? []).flatMap((arm) => arm.slots.filter((route) => route.name === slot.name).flatMap((route) => route.seats));
				const kinds = (rowOf(path)?.arms ?? []).map((arm) => arm.kind);
				const picked = holder.when.some((test) => 'kinds' in test && test.slot === slot.name && !kinds.some((kind) => test.kinds.includes(kind)));
				if (fittingOf(path, others).length === 0) found.push([{ code: 'portable-emit-unplaced-path', path: owner, slot: slot.name, message: `${path} has no arm that fits ${slot.name}'s seats` }, scope]);
				else if (!picked)
					found.push([
						{ code: 'portable-emit-unplaced-arm', path: owner, slot: slot.name, message: `${path} is a path the slot's type admits that arm ${holder.kind}'s seats don't place, though another arm of ${owner} does` },
						scope
					]);
			}
			return [unbuilt(`${owner}.${slot.name}`, shown)];
		}
		return armChoice(path, slot, value, (fit) => placedArm(path, slot, fit, skip, value), () => unbuilt(`${owner}.${slot.name}`, shown));
	};

	const choiceKinds = (path: string, slot: PortableSlotRoute, value: Primary): Statement[] =>
		armChoice(path, slot, value, ({ arm }) => ret(num(arm.kind)), () => ret(id('undefined')));

	const placedByKind = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, ids: boolean, refused = (): Statement => ret(call(id(uses('unseated')), str(`${owner}.${slot.name}`), value))): Statement[] => {
		const tokens = new Set(slot.seats.flatMap((seat) => Object.values(seat.tokens ?? {})));
		const groups = new Map<string, { readonly within: readonly PortableContainer[]; readonly kinds: Set<number> }>();
		const seated = new Set<number>();
		for (const seat of slot.seats) {
			if (!fillsWithout(seat, skip)) continue;
			const within = (seat.within ?? []).slice(skip);
			const key = JSON.stringify(within);
			const group = groups.get(key) ?? groups.set(key, { within, kinds: new Set() }).get(key)!;
			for (const kind of seat.kinds)
				if (!seated.has(kind) && (!ids || !tokens.has(kind))) {
					seated.add(kind);
					group.kinds.add(kind);
				}
		}
		const placed = [...groups.values()].filter(({ kinds }) => kinds.size > 0);
		return [
			...placed.map(({ within, kinds }) => when(call(id(uses('seated')), value, t.array(...[...kinds].sort((a, b) => a - b).map(num))), ret(wrapOne(within, value)))),
			refused()
		];
	};

	type Scalar = keyof NonNullable<PortableSlotRoute['takers']>;
	const takerFit = (slot: PortableSlotRoute, scalar: Scalar): { readonly path: string; readonly fit: Fitting } | undefined => {
		const path = slot.takers?.[scalar];
		const kind = path === undefined ? undefined : rowOf(path)?.builds?.[scalar];
		const fit = kind === undefined ? undefined : fittingOf(path!, slot.seats).find(({ arm }) => arm.kind === kind && arm.scalar === scalar);
		return fit === undefined ? undefined : { path: path!, fit };
	};

	const numberCases = (slot: PortableSlotRoute, value: Expression, admitted: readonly string[], taken: (scalar: Scalar) => Statement, plain: { readonly bigint: () => Statement; readonly number: () => readonly Statement[] }): Statement[] => {
		const { takers } = slot;
		if (takers === undefined) return [...(admitted.includes('bigint') ? [when(typeIs(value, 'bigint'), block(plain.bigint()))] : []), when(typeIs(value, 'number'), block(...plain.number()))];
		const [integer, float] = [takerFit(slot, 'integer'), takerFit(slot, 'float')];
		const numbers = integer !== undefined && integer.fit.arm === float?.fit.arm ? [taken('integer')] : [when(call(dot(id('Number'), 'isSafeInteger'), value), block(taken('integer'))), taken('float')];
		return [
			...(takers.bigint === undefined && !admitted.includes('bigint') ? [] : [when(typeIs(value, 'bigint'), block(taken('bigint')))]),
			...(takers.integer === undefined && takers.float === undefined && !admitted.includes('number') ? [] : [when(typeIs(value, 'number'), block(...numbers))])
		];
	};

	const numberBranches = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, admitted: readonly string[]): Statement[] => {
		const refused = (scalar: string): Statement => ret(call(id(uses('unnumbered')), str(`${owner}.${slot.name}`), str(scalar)));
		const taken = (scalar: Scalar): Statement => {
			const path = slot.takers?.[scalar];
			if (path === undefined) return refused(scalar);
			const by = takerFit(slot, scalar);
			return (by === undefined ? undefined : placedArm(path, slot, by.fit, skip, obj([['$path', str(path)], ['$value', value]]))) ?? unbuilt(`${owner}.${slot.name}`, obj([['$path', str(path)]]));
		};
		return numberCases(slot, value, admitted, taken, { bigint: () => refused('bigint'), number: () => placedByKind(owner, slot, skip, value, true) });
	};

	const slotFunction = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute, skip: number, seats = slot.seats): string => {
		const name = `${identifierOf(owner)}$${arm.kind}_${slot.name}${skip === 0 ? '' : '$item'}`;
		return uses(slotFunctions.has(name) ? name : tracked(name, () => slotFunctionOf(name, owner, arm, { ...slot, seats }, skip, slot.seats)));
	};

	const exactSlotOf = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute) => {
		const exact = exactOf(owner, arm, slot.name) ?? fail(`${slot.name} has no exact set`);
		const structures = exact.paths.filter((path) => viewed.has(path) && !textKinds.has(path));
		const pathsOf = (takers: readonly (readonly [string, string | undefined])[]): string[] => [...new Set(takers.flatMap(([, path]) => path ?? []))].filter((path) => !structures.includes(path)).sort();
		const valued = [slot, ...(rowOf(owner)?.arms ?? []).flatMap((other) => other.slots.filter((route) => route.name === slot.name))].flatMap((route) => Object.entries(route.takers ?? {}));
		const free = exact.string || exact.paths.some(textTyped);
		return {
			exact,
			structures,
			decided: input.decided[owner]?.[slot.name],
			takerPaths: pathsOf(Object.entries(slot.takers ?? {})),
			valued,
			valuedPaths: pathsOf(valued),
			free,
			texted: free || exact.texts.length > 0
		};
	};
	type ExactSlot = ReturnType<typeof exactSlotOf>;

	const structureCases = ({ structures, decided, takerPaths, valuedPaths }: ExactSlot, value: Primary, placed: (path: string) => Statement[], taken: (path: string) => Statement[], otherwise: () => Statement, nothing: () => Statement): Statement[] => {
		if (structures.length === 0 && takerPaths.length === 0) return [nothing()];
		if (valuedPaths.length === 0 && decided !== undefined && structures.length === 1 && structures[0] === decided) return placed(decided);
		const cases = [
			...structures.flatMap((path) => [...(path === decided ? [t.switchCase({ value: id('undefined'), bodies: [] })] : []), t.switchCase({ value: str(path), bodies: placed(path) })]),
			...takerPaths.map((path) => t.switchCase({ value: str(path), bodies: taken(path) }))
		];
		return [t.switchStatement({ value: paren(dot(value, '$path')), body: t.switchBody(...cases, t.switchDefault({ bodies: [otherwise()] })) })];
	};

	const itemTypeOf = (name: string, { exact, structures, decided, valued, valuedPaths, free }: ExactSlot, texts: boolean): Statement => {
		const items: TypeNode[] = [
			...(exact.string || (texts && !free && exact.texts.length === 0) ? ['string'] : []),
			...exact.texts.map((literal) => t.literalType(str(literal))),
			...exact.paths.filter(textTyped).map((path) => typeRef(uses('Text'), input.map, t.literalType(str(path)))),
			...exact.numbers,
			...exact.paths
				.filter((path) => viewed.has(path))
				.flatMap((path) => [...(structures.includes(path) ? [path === decided ? pathInputType(path) : pathType(path)] : []), nodesType(path)]),
			...valuedPaths.map((path) =>
				objectTypeOf([
					['$path', t.literalType(str(path))],
					['$value', union([...new Set(valued.flatMap(([scalar, taker]) => (taker === path ? [scalar === 'bigint' ? 'bigint' : 'number'] : [])))])]
				])
			),
			...exact.unmapped.map((unmapped) => typeRef(uses('Unmapped'), t.literalType(str(unmapped))))
		];
		return t.typeAliasDeclaration({ name: `${name}$Item`, value: union(items.length === 0 ? ['never'] : items) });
	};

	const slotFunctionOf = (name: string, owner: string, arm: PortableBuildArm, slot: PortableSlotRoute, skip: number, every: readonly PortableSeat[]): string => {
		for (const seat of slot.seats) checkSeat(seat);
		const at = exactSlotOf(owner, arm, slot);
		const value = id('value');
		const statements: Statement[] = [];
		if (takesHoles(slot) && (slot.multiple || skip > 0)) statements.push(when(binary(value, '===', 'null'), ret('null')));
		const text = stringBranch(owner, arm, at.exact, slot, skip, value, every, at.texted);
		if (text !== undefined) statements.push(when(typeIs(value, 'string'), block(...text)));
		statements.push(...numberBranches(owner, slot, skip, value, at.exact.numbers));
		statements.push(when(call(id(uses('isNode')), value), block(...placedByKind(owner, slot, skip, value, false))));
		const refused = () => unbuilt(`${owner}.${slot.name}`, value);
		statements.push(
			...structureCases(
				at,
				value,
				(path) => caseOf(owner, arm, path, slot, skip, value, every),
				() => [...numberBranches(owner, slot, skip, dot(value, '$value'), at.exact.numbers), refused()],
				refused,
				() => t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(str(`${owner}.${slot.name} takes no structure`)) }))
			)
		);
		slotFunctions.set(name, [itemTypeOf(name, at, text !== undefined), constant(name, arrow('value', `${name}$Item`, block(...statements)))]);
		return name;
	};

	const onlyItemName = (route: PortableSlotRoute): string => `${route.name}$only`;

	const onlyItemFunction = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute): string => {
		const name = `${identifierOf(owner)}$${arm.kind}_${slot.name}$only`;
		return uses(slotFunctions.has(name) ? name : tracked(name, () => onlyItemFunctionOf(name, owner, arm, slot)));
	};

	const onlyItemFunctionOf = (name: string, owner: string, arm: PortableBuildArm, slot: PortableSlotRoute): string => {
		for (const seat of slot.seats) checkSeat(seat);
		const at = exactSlotOf(owner, arm, slot);
		const [value, item] = [id('value'), id('item')];
		const none = (): Statement => ret(id('undefined'));
		const fitting = { ...at, structures: at.structures.filter((path) => fittingOf(path, slot.seats).length > 0), takerPaths: [] };
		const statements: Statement[] = [
			when(binary(dot(listOf(value), 'length'), '!==', num(1)), none()),
			constant('item', t.subscriptExpression({ object: listOf(value), index: num(0) })),
			when(or([binary(item, '===', id('undefined')), binary(t.unaryExpression({ operator: 'typeof', argument: item }), '!==', str('object'))])!, none()),
			when(call(id(uses('isNode')), item), block(...placedByKind(owner, slot, 0, item, false, none))),
			...structureCases(
				fitting,
				item,
				(path) => armChoice(path, slot, item, (fit) => placedArm(path, slot, fit, 0, item) ?? unbuilt(`${owner}.${slot.name}`, item), none),
				() => [none()],
				none,
				none
			)
		];
		slotFunctions.set(name, [constant(name, arrow('value', t.lookupType({ type: pathInputType(owner), indexType: t.literalType(str(slot.name)) }), block(...statements)))]);
		return name;
	};

	const kindFunction = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute): string => {
		const name = `${identifierOf(owner)}$${arm.kind}_${slot.name}$kind`;
		if (slotFunctions.has(name)) return uses(name);
		const known = failed.get(name);
		if (known !== undefined) return fail(known);
		slotFunctions.set(name, []);
		try {
			return uses(tracked(name, () => kindFunctionOf(name, owner, arm, slot)));
		} catch (error) {
			slotFunctions.delete(name);
			if (error instanceof Unfit) {
				failed.set(name, error.message);
				grew = true;
			}
			throw error;
		}
	};

	const kindFunctionOf = (name: string, owner: string, arm: PortableBuildArm, slot: PortableSlotRoute): string => {
		const at = exactSlotOf(owner, arm, slot);
		const value = id('value');
		const none = () => ret(id('undefined'));
		const statements: Statement[] = [];
		if (takesHoles(slot) && slot.multiple) statements.push(when(binary(value, '===', 'null'), none()));
		const seats = textSeatsOf(slot, 0);
		const texts = placesText(seats, at.texted);
		if (texts) {
			const leaves = leafChoices(seats, value).map(({ seat, condition }) => {
				const kind = ret(dot(call(builderRef(seat.leaf!), value), '$type'));
				return condition === undefined ? kind : when(condition, kind);
			});
			const text = leaves.length === 0 ? [none()] : leaves;
			const tokens = tokensOf(seats);
			statements.push(
				when(
					typeIs(value, 'string'),
					block(
						...(tokens.length === 0
							? text
							: [t.switchStatement({ value: paren(value), body: t.switchBody(...tokens.map(([token, kind]) => t.switchCase({ value: str(token), bodies: [ret(num(kind))] })), t.switchDefault({ bodies: text })) })])
					)
				)
			);
		}
		const scalarKinds = (given: Expression): Statement[] =>
			numberCases(slot, given, at.exact.numbers, (scalar) => {
				const kind = takerFit(slot, scalar)?.fit.arm.kind;
				return kind === undefined ? none() : ret(num(kind));
			}, { bigint: none, number: () => [ret(given)] });
		statements.push(...scalarKinds(value));
		statements.push(when(call(id(uses('isNode')), value), ret(dot(value, '$type'))));
		const fitting = { ...at, structures: at.structures.filter((path) => fittingOf(path, slot.seats).length > 0) };
		statements.push(...structureCases(fitting, value, (path) => choiceKinds(path, slot, value), () => [...scalarKinds(dot(value, '$value')), none()], none, none));
		slotFunctions.set(name, [itemTypeOf(name, at, texts), constant(name, arrow('value', `${name}$Item`, block(...statements), union(['number', 'undefined'])))]);
		return name;
	};

	const isListed = (slot: PortableSlotRoute): boolean => slot.multiple || slot.list === true;
	const eitherArity = (slot: PortableSlotRoute): boolean => slot.list !== true && slot.seats.some((seat) => seat.many === true && !(slot.list === false && (seat.within ?? []).length === 0));
	const absent = (slot: PortableSlotRoute, value: Primary): Operand =>
		isListed(slot) ? binary(dot(listOf(dot(value, slot.name)), 'length'), '===', num(0)) : binary(dot(value, slot.name), '===', id('undefined'));

	const throughSteps = (slot: PortableSlotRoute): PortableSlotRoute => {
		const { steps } = slot;
		const links = steps.slice(1).map((step, i): PortableContainer => {
			const parent = steps[i]!;
			if (parent.builder === undefined) return fail(`${slot.name}'s step at ${parent.key} has no builder`);
			if (step.many === true && shapeOf(parent.builder) === 'config') return fail(`${slot.name}'s step at ${step.key} is one item of ${parent.builder}'s list`);
			return { builder: parent.builder, key: step.key, ...(step.optional === true ? { optional: true } : {}) };
		});
		return {
			...slot,
			steps: [steps[0]!],
			multiple: false,
			...(slot.multiple && slot.list === undefined ? { list: true } : {}),
			seats: slot.seats.map((seat) => ({ ...seat, within: [...links, ...(seat.within ?? [])] }))
		};
	};

	const plainRoute = (route: PortableSlotRoute): void => {
		for (const step of route.steps) if (step.mounted !== undefined || step.flatten === true || step.seated !== undefined) fail(`${route.name}'s step at ${step.key} is not a plain slot`);
		const last = route.steps.at(-1)!;
		if (last.many === true) fail(`${route.name}'s step at ${last.key} is not a plain slot`);
	};

	const slotValue = (owner: string, arm: PortableBuildArm, route: PortableSlotRoute, value: Primary, owned = false): Expression => {
		plainRoute(route);
		if (route.requires !== undefined) return fail(`${route.name} requires other slots`);
		if (buildsOnlyItem(arm, route)) return id(onlyItemName(route));
		const guarded = (items: Expression): Expression => (route.nonEmpty === true && !owned ? nonEmptyOf(owner, route, items) : items);
		const slot = route.steps.length === 1 ? route : throughSteps(route);
		const step = slot.steps[0]!;
		const given = dot(value, slot.name);
		if (slot.multiple) return guarded(call(dot(listOf(given), 'map'), id(slotFunction(owner, arm, slot, 0))));
		const either = eitherArity(slot);
		const single = (): Expression => {
			const built = call(id(slotFunction(owner, arm, slot, 0)), given);
			if (step.optional === true) return ternary(binary(given, '===', id('undefined')), id('undefined'), built);
			return input.slots[owner]?.[slot.name]?.optional === true ? ternary(binary(given, '===', id('undefined')), call(id(uses('missing')), str(`${owner}.${slot.name}`)), built) : built;
		};
		const isList = () => call(id(uses('listed')), given);
		if (slot.list !== true && !either) return slot.list === false ? single() : ternary(isList(), call(id(uses('unlisted')), str(`${owner}.${slot.name}`)), single());
		const seat = slot.seats.find((candidate) => candidate.many === true && (candidate.within ?? []).length > 0);
		if (seat === undefined) return fail(`${slot.name} is a list with no list container seat`);
		const inside = new Set(extending(slot.seats, seat));
		const takesText = (candidate: PortableSeat): boolean => candidate.tokens !== undefined || candidate.leaf !== undefined || candidate.text === true;
		if (slot.seats.some((candidate) => candidate.many !== true && !inside.has(candidate) && takesText(candidate))) return fail(`${slot.name} seats a text outside its list container`);
		const item = slotFunction(owner, arm, slot, seat.within!.length, extending(slot.seats, seat));
		const open = seat.within!.findIndex((container) => container.optional === true);
		const outer = seat.within!.slice(0, open + 1);
		const leftOut = step.optional === true || open < 0;
		if (!leftOut && outer.at(-1)!.builder === undefined) return fail(`${slot.name}'s optional list container has no builder`);
		const listed = (): Expression => {
			if (open < 0 && step.optional !== true) return wrapList(seat.within!, { all: guarded(call(dot(either ? given : listOf(given), 'map'), id(item))) });
			const omitted = (): Expression => (leftOut ? id('undefined') : wrapOne(outer.slice(0, -1), call(builderRef(outer.at(-1)!.builder!))));
			if (route.emptyContainer === true)
				return ternary(
					binary(given, '===', id('undefined')),
					leftOut ? id('undefined') : call(id(uses('missing')), str(`${owner}.${slot.name}`)),
					wrapList(seat.within!, { all: call(dot(either ? given : listOf(given), 'map'), id(item)) })
				);
			const { empty, items } = split(slot.name, either ? paren(ternary(isList(), given, t.array())) : listOf(given), item);
			return ternary(empty, omitted(), wrapList(seat.within!, items));
		};
		return either ? ternary(isList(), listed(), single()) : listed();
	};

	const numberBody = (path: string, arm: PortableBuildArm, input: () => Built<B['identifier']>): Statement[] => {
		const callee = builderRef(arm.builder!);
		const numeric = arm.numeric;
		const parts = numeric === undefined || Array.isArray(numeric) ? undefined : numeric;
		const slots: readonly string[] = numeric === undefined ? [] : Array.isArray(numeric) ? numeric : Object.values(numeric);
		const spelled = (slot: PortableSlotRoute): boolean => numeric === undefined || (slot.steps.length === 1 && slots.includes(slot.steps[0]!.key));
		const others = arm.slots.filter((slot) => !spelled(slot));
		const scalar = dot(input(), '$value');
		const bigint = arm.scalar === 'float' ? [when(typeIs(scalar, 'bigint'), ret(call(id(uses('unnumbered')), str(path), str('bigint'))))] : [];
		if (numeric === undefined || shapeOf(arm.builder!) !== 'config') {
			if (others.length > 0) return fail(`${path}'s number arm takes slots beside its value`);
			if (arm.scalar !== 'integer') return [...bigint, ret(call(callee, scalar))];
			return [constant('value', scalar), ret(ternary(typeIs(id('value'), 'bigint'), call(callee, id('value')), call(callee, id('value'))))];
		}
		const entries = slotEntries(path, arm, others, input);
		if (parts === undefined) return [...bigint, ret(call(callee, obj([...entries, [slots.at(-1)!, scalar]])))];
		const options = new Set(table.options?.[arm.builder!] ?? []);
		if (entries.some(([key]) => options.has(key))) return fail(`${path}'s number arm takes a slot through its builder's options`);
		const written = slots.map((slot): [string, Expression] => [slot, dot(id('parts'), slot)]);
		const optioned = written.filter(([slot]) => options.has(slot));
		return [
			...bigint,
			constant('parts', call(id(uses('decimalSpelling')), scalar, obj(Object.entries(parts).map(([part, slot]) => [part, str(slot)])), arm.scientific === true ? t.true : t.false)),
			when(binary(id('parts'), '===', id('undefined')), ret(call(id(uses('unspelled')), str(path), scalar))),
			ret(call(callee, obj([...entries, ...written.filter(([slot]) => !options.has(slot))]), ...(optioned.length === 0 ? [] : [obj(optioned)])))
		];
	};

	const armBody = (path: string, arm: PortableBuildArm, input: () => Built<B['identifier']>): Statement[] => {
		if (arm.builder === undefined) return fail(`arm ${arm.kind} builds through its holder`);
		if (arm.mounted !== undefined) return fail(`arm ${arm.kind} mounts into its holder`);
		if (arm.template !== undefined) return fail(`a template-spelled slot (${arm.template.slot})`);
		if (arm.sole !== undefined) return fail(`a sole-item delimiter on ${arm.sole.slot}`);
		if (arm.content !== undefined) return fail(`arm ${arm.kind} builds its text through a content slot`);
		if (arm.literal !== undefined) return fail(`arm ${arm.kind} is a literal token`);
		if (arm.scalar !== undefined) return numberBody(path, arm, input);
		const shape = shapeOf(arm.builder);
		if (shape === 'text' && textValues.has(path) && arm.slots.length === 0 && arm.presets.length === 0 && Object.keys(arm.flags).length === 0) {
			const given = input();
			return [ret(call(builderRef(arm.builder), ternary(typeIs(given, 'string'), given, dot(given, '$value'))))];
		}
		if (shape === 'text' || shape === 'placed') return fail(`arm ${arm.kind}'s builder takes its text`);
		if (arm.owners === undefined) return [ret(formBuilt(path, arm, arm.builder, arm.slots, input))];
		const onlyItem = (i: number): boolean => buildsOnlyItem(arm, arm.slots[i]!);
		const routes = new Map<string, number>();
		for (const i of arm.owners.flat()) {
			if (onlyItem(i)) continue;
			const name = arm.slots[i]!.name;
			if ((routes.get(name) ?? i) !== i) return fail(`arm ${arm.kind} builds ${name} through more than one form`);
			routes.set(name, i);
		}
		const statements: Statement[] = [];
		for (const owner of [...arm.owners.filter((owner) => owner.some(onlyItem)), ...arm.owners.filter((owner) => !owner.some(onlyItem))]) {
			const held = new Set(owner.map((i) => arm.slots[i]!.name));
			const built = ret(formBuilt(path, arm, arm.builder, owner.map((i) => arm.slots[i]!), input));
			const condition = and(arm.slots.filter((slot, i, slots) => !held.has(slot.name) && slots.findIndex((other) => other.name === slot.name) === i).map((slot) => absent(slot, input())));
			const items = owner.filter(onlyItem).map((i) => arm.slots[i]!);
			const taken =
				items.length === 0
					? built
					: block(
							...items.map((route) => constant(onlyItemName(route), call(id(onlyItemFunction(path, arm, route)), dot(input(), route.name)))),
							when(and(items.map((route) => binary(id(onlyItemName(route)), '!==', id('undefined'))))!, built)
						);
			if (condition === undefined && items.length === 0) return [...statements, built];
			statements.push(condition === undefined ? taken : when(condition, taken));
		}
		return [...statements, raise(str(`${path}: no form of arm ${arm.kind} takes the slots it states together`))];
	};

	const slotEntries = (path: string, arm: PortableBuildArm, slots: readonly PortableSlotRoute[], input: () => Built<B['identifier']>): [string, Expression][] => {
		const groups = new Map<string, PortableSlotRoute[]>();
		for (const slot of slots) {
			const key = slot.steps[0]?.key ?? slot.name;
			groups.set(key, [...(groups.get(key) ?? []), slot]);
		}
		return [...groups].map(([key, routes]): [string, Expression] => {
			if (routes.length === 1) return [key, slotValue(path, arm, routes[0]!, input())];
			routes.forEach(plainRoute);
			const step = routes[0]!.steps[0]!;
			const sharing = routes.map((route) => route.name).join(' and ');
			if (routes.some((route) => route.steps.length === 1)) return fail(`arm ${arm.kind} fills one slot twice`);
			if (routes.some((route) => route.steps[0]!.builder !== step.builder)) return fail(`arm ${arm.kind} builds ${key} through two builders`);
			if (step.builder === undefined) return fail(`${key}, which ${sharing} share, has no builder`);
			if (step.optional === true) return fail(`${key}, which ${sharing} share, may be left out`);
			if (step.many === true) return fail(`${key}, which ${sharing} share, is one item of a list`);
			return [key, builtWith(step.builder, slotEntries(path, arm, routes.map(insideFirstStep), input))];
		});
	};

	const insideFirstStep = (route: PortableSlotRoute): PortableSlotRoute => {
		const steps = route.steps.slice(1);
		return { ...route, steps, multiple: steps.length === 1 && route.seats[0]?.many === true };
	};

	const builtWith = (builder: string, entries: readonly (readonly [string, Expression])[]): Expression => {
		const shape = shapeOf(builder);
		const callee = builderRef(builder);
		if (shape === 'config') return call(callee, obj(entries));
		if (shape === 'constant' || shape === 'nullary') return entries.length === 0 ? call(callee) : fail(`${builder} takes nothing but the arm fills ${entries.length} slots`);
		if (entries.length > 1) return fail(`${builder} (${shape}) takes one slot but the arm has ${entries.length}`);
		const values = entries.map(([, value]) => value);
		if (shape === 'spread' || shape === 'elements') return call(callee, ...values.map((value) => t.spreadElement(value)));
		if (shape === 'forwarded' || shape === 'direct') return call(callee, ...values);
		return fail(`${builder} takes a ${shape} input`);
	};

	const formBuilt = (path: string, arm: PortableBuildArm, builder: string, slots: readonly PortableSlotRoute[], input: () => Built<B['identifier']>): Expression => {
		const shape = shapeOf(builder);
		const seen = new Set<string>();
		const emptied = new Set(arm.when.flatMap((test) => ('empty' in test ? test.empty : [])));
		const filled = slots.filter((slot) => !emptied.has(slot.name));
		for (const slot of filled) {
			if (seen.has(slot.name)) return fail(`${slot.name} has more than one route`);
			seen.add(slot.name);
		}
		const entries = slotEntries(path, arm, filled, input);
		for (const preset of arm.presets) {
			if (preset.steps.length !== 1 || preset.builder !== undefined || preset.among !== undefined || (preset.kind === undefined && preset.text === undefined))
				return fail(`a preset at ${preset.steps.map((step) => step.key).join('.')} that is not one keyword or text`);
			entries.push([preset.steps[0]!.key, preset.kind === undefined ? str(preset.text!) : preset.presence === true ? t.true : num(preset.kind)]);
		}
		const delimiters: (readonly [flag: string, bits: number])[] = [];
		for (const [flag, step] of Object.entries(arm.flags)) {
			if (step.template !== undefined || step.list !== undefined || (step.unset ?? []).length > 0) return fail(`flag ${flag} spells text, a delimiter of a list in a slot or an unset preset`);
			if (step.delimiter !== undefined) delimiters.push([flag, step.delimiter]);
			const keys = new Map<string, { readonly kind: number; readonly presence: boolean }>();
			for (const { steps, kind, presence } of step.presets) {
				if (steps.length !== 1 || kind === undefined) return fail(`flag ${flag}'s preset is not one keyword`);
				const held = keys.get(steps[0]!.key);
				if (held !== undefined && (held.kind !== kind || held.presence !== (presence === true))) return fail(`flag ${flag} sets ${steps[0]!.key} to two keywords`);
				keys.set(steps[0]!.key, { kind, presence: presence === true });
			}
			for (const [slot, { kind, presence }] of keys) entries.push([slot, presence ? flagged(input(), flag) : ternary(flagged(input(), flag), num(kind), id('undefined'))]);
		}
		if (new Set(entries.map(([name]) => name)).size !== entries.length) return fail(`arm ${arm.kind} fills one slot twice`);
		const callee = builderRef(builder);
		if (delimiters.length > 0 && shape !== 'elements') return fail(`${builder} builds no list, so it takes no delimiter`);
		const optionKeys = new Set(table.options?.[builder] ?? []);
		const options = entries.filter(([name]) => optionKeys.has(name));
		if (options.length > 0) {
			const given = entries.filter(([name]) => !optionKeys.has(name));
			if (delimiters.length > 0) return fail(`${builder} takes a delimiter and options`);
			if (shape === 'config') return call(callee, obj(given), obj(options));
			if ((shape === 'forwarded' || shape === 'direct') && given.length === 1) return call(callee, given[0]![1], obj(options));
			return fail(`${builder} takes its input as a ${shape}, so it takes no options`);
		}
		if (delimiters.length === 0) return builtWith(builder, entries);
		if (entries.length > 1) return fail(`${builder} (${shape}) takes one slot but the arm has ${entries.length}`);
		const items = entries.map(([, value]) => t.spreadElement(value));
		const parts: Expression[] = delimiters.map(([flag, bit]) => ternary(flagged(input(), flag), num(bit), num(0)));
		const bits = parts.reduce((left, right) => binary(paren(left), '|', paren(right)));
		return ternary(binary(paren(bits), '===', num(0)), call(callee, ...items), call(callee, obj([['delimiter', paren(bits)]]), ...items));
	};

	const unroutedGuards = (path: string, arm: PortableBuildArm): Statement[] => {
		const routed = new Set([...arm.slots.map((slot) => slot.name), ...arm.when.flatMap((test) => ('empty' in test ? test.empty : [])), ...ownedNames(path, arm)]);
		const placed = new Set([...Object.keys(arm.flags), ...arm.when.flatMap((test) => ('flag' in test && test.set ? [test.flag] : [])), ...(arm.facts ?? []).flatMap((fact) => fact.flag ?? [])]);
		return [
			constant('unroutedSlot', call(id(uses('unroutedIn')), id(uses('input')), t.array(...[...routed].sort().map(str)))),
			when(binary(id('unroutedSlot'), '!==', id('undefined')), ret(call(id(uses('unrouted')), str(path), id('unroutedSlot')))),
			...[...(input.flags[path] ?? [])]
				.filter((flag) => !placed.has(flag))
				.sort()
				.map((flag) => when(flagged(id(uses('input')), flag), ret(call(id(uses('unflagged')), str(path), str(flag))))),
			...[...(input.facts[path] ?? [])].sort().flatMap((name) => {
				const fact = (arm.facts ?? []).find((candidate) => candidate.name === name);
				if (fact !== undefined && fact.flag === undefined) return [];
				const stated = binary(atOf(id(uses('input')), name), '!==', id('undefined'));
				return [when(fact === undefined ? stated : and([stated, not(flagged(id(uses('input')), fact.flag!))])!, ret(call(id(uses('unset')), str(path), str(name))))];
			})
		];
	};

	function armName(path: string, arm: PortableBuildArm): string | undefined {
		const name = `${identifierOf(path)}$${arm.kind}`;
		if (armFunctions.has(name)) return uses(name);
		if (failed.has(name)) return undefined;
		armFunctions.set(name, constant(name, id('undefined')));
		try {
			const [statements, type] = tracked(name, () => [[...unroutedGuards(path, arm), ...preluded(() => armBody(path, arm, () => id(uses('input'))))], pathInputType(path)] as const);
			const parameter = deps.get(name)!.has('input') ? 'input' : '_input';
			armFunctions.set(name, constant(name, arrow(parameter, type, block(...statements), arm.builder === undefined ? undefined : builtType(arm.builder))));
			return uses(name);
		} catch (error) {
			if (!(error instanceof Unfit)) throw error;
			armFunctions.delete(name);
			failed.set(name, error.message);
			grew = true;
			return undefined;
		}
	}

	let pathFunctions: Statement[];
	let roots: string[];
	let root: Trie;
	do {
		grew = false;
		found.length = 0;
		slotFunctions = new Map();
		armFunctions = new Map();
		deps = new Map();
		pathFunctions = [];
		roots = [];
		root = { children: new Map() };
		for (const [path, row] of sorted(Object.entries(table.paths), ([path]) => path)) {
			if (!row.root) continue;
			const arms = row.arms.filter((arm) => arm.holders === undefined);
			const statements: Statement[] = [];
			const value = id('input');
			let generated = arms.length > 0;
			let type: TypeNode = 'never';
			try {
				tracked(identifierOf(path), () => {
					type = pathInputType(path);
					if (row.builds !== undefined) {
						const built = (arm: PortableBuildArm): Statement => {
							const name = armName(path, arm);
							return name === undefined ? unbuilt(path, value) : ret(call(id(name), value));
						};
						statements.push(...(scalarChoice(path, arms, value, built, unbuilt(path, value)) ?? fail('a path that picks its arm by its value builds no scalar')));
						return;
					}
					for (const [i, arm] of arms.entries()) {
						const name = armName(path, arm);
						if (name === undefined) {
							generated = false;
							break;
						}
						const placed = placement(path, arm, [[], ...factChainOf(arm)], value, (given) => call(id(name), given), 'the root');
						const condition = i === arms.length - 1 ? undefined : pickOf(path, arm, value);
						if (condition === undefined) {
							statements.push(...placed);
							break;
						}
						statements.push(when(condition, placed.length === 1 ? placed[0]! : block(...placed)));
					}
				});
			} catch (error) {
				if (!(error instanceof Unfit)) throw error;
				failed.set(path, error.message);
				generated = false;
			}
			if (!generated) {
				const reason = failed.get(path) ?? arms.map((arm) => failed.get(`${identifierOf(path)}$${arm.kind}`)).find((message) => message !== undefined) ?? 'no arm builds it at the root';
				found.push([{ code: 'portable-emit-unfit-slot', path, message: reason }, undefined]);
				continue;
			}
			pathFunctions.push(constant(identifierOf(path), arrow('input', type, block(...statements))));
			roots.push(identifierOf(path));
			let node = root;
			for (const segment of path.split('.')) {
				let next = node.children.get(segment);
				if (next === undefined) node.children.set(segment, (next = { children: new Map() }));
				node = next;
			}
			node.path = path;
		}
	} while (grew);
	const live = new Set<string>();
	const reach = (name: string): void => {
		if (live.has(name)) return;
		live.add(name);
		for (const next of deps.get(name) ?? []) reach(next);
	};
	for (const name of roots) reach(name);
	const kept = (functions: ReadonlyMap<string, Statement | readonly Statement[]>): Statement[] => sorted([...functions].filter(([name]) => live.has(name)), ([name]) => name).flatMap(([, statements]) => statements);
	const helpers: readonly (readonly [string, Statement])[] = [
		['isNode', isNodeHelper],
		['unbuilt', unbuiltHelper],
		['missing', missingHelper],
		['unlisted', unlistedHelper],
		['unrouted', unroutedHelper],
		['unroutedIn', unroutedInHelper],
		['unflagged', unflaggedHelper],
		['unset', unsetHelper],
		['withoutFlags', withoutFlagsHelper],
		['seated', seatedHelper],
		['listed', listedHelper],
		['unseated', unseatedHelper],
		['untexted', untextedHelper],
		['unnumbered', unnumberedHelper],
		['unspelled', unspelledHelper],
		['withSpelled', withSpelledHelper],
		['nonEmpty', nonEmptyHelper],
		['noSpelling', noSpellingHelper]
	];

	const surface = (node: Trie): Expression => {
		const children = obj(sorted(node.children, ([segment]) => segment).map(([segment, child]) => [segment, surface(child)] as const));
		if (node.path === undefined) return children;
		return node.children.size === 0 ? id(identifierOf(node.path)) : call(dot(id('Object'), 'assign'), id(identifierOf(node.path)), children);
	};
	const clauseOf = (names: readonly string[]) => t.importClause(t.namedImports(...names.map((name) => t.importSpecifier.name({ name }))));
	const typeImport = (names: readonly string[], source: string) => t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: clauseOf(names), source: str(source) });
	const valueImport = (names: readonly string[], source: string) => t.importStatement.clauseFrom({ importClause: clauseOf(names), source: str(source) });
	const header = t.comment.line(' Auto-generated by @sittir/codegen — do not edit');
	const exported = t.exportStatementDefaultDeclaration({ content: constant('portableBuild', surface(root)) });
	const program = t.program({
		statements:
			pathFunctions.length === 0
				? [exported.$trivia.leading(header)]
				: [
						t.importStatement.clauseFrom({ importClause: t.importClause(t.namedImports(t.importSpecifier.as({ name: 'ir', alias: 'b' }))), source: str(input.imports.builders) }).$trivia.leading(header),
						typeImport(['BuildInput', 'PathInput', 'Text', 'Unmapped'].filter((name) => live.has(name)), input.imports.vocabulary),
						typeImport([input.map], input.imports.map),
						...(live.has('decimalSpelling') ? [valueImport(['decimalSpelling'], input.imports.utils)] : []),
						...(live.has('isNode')
							? [
									typeImport([input.node], input.imports.types),
									t.importStatement.clauseFrom({ importClause: t.importClause(t.namedImports(t.importSpecifier.as({ name: 'isNode', alias: 'isAnyNode' }))), source: str(input.imports.nodes) })
								]
							: []),
						...helpers.filter(([name]) => live.has(name)).map(([, helper]) => helper),
						...kept(slotFunctions),
						...kept(armFunctions),
						...pathFunctions,
						exported
					]
	});
	return { program, diagnostics: found.filter(([, at]) => at === undefined || live.has(at)).map(([diagnostic]) => diagnostic) };
}

export async function emitPortableBuildInProcess(input: PortableEmitInput<PortableBuildTable>): Promise<PortableEmitOutput> {
	const pinned = await loadPinnedBuild();
	using engine = await pinned.common.createEngine(pinned.typescript.default);
	const { program, diagnostics } = emitPortableModule(engine.build, input);
	return { text: String(engine.render(program)), diagnostics };
}

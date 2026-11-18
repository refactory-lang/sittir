import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableContainer,
	PortableSlotRoute,
	PortablePickTest,
	PortableSeat
} from '../../../../../../types/src/portable-build.ts';
import type { PinnedBuilders } from './engine.ts';
import type { PortableEmitDiagnostic, PortableEmitInput, PortableEmitOutput } from '../emit-input.ts';

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

const sorted = <T>(items: Iterable<T>, key: (item: T) => string): T[] => [...items].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));

interface Fitting {
	readonly arm: PortableBuildArm;
	readonly seats: readonly PortableSeat[];
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
	const listedHelper = constant(
		'listed',
		t.arrowFunction.callSignature({
			typeParameters: t.typeParameters(t.typeParametersElements(t.typeParameter({ name: 'V' }))),
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'value', type: t.typeAnnotation('V') }))),
			returnType: t.typePredicateAnnotation(t.typePredicate({ name: 'value', type: typeRef('Exclude', typeRef('Extract', 'V', t.readonlyType(t.arrayType('unknown'))), kinded) })),
			body: call(dot(id('Array'), 'isArray'), id('value'))
		})
	);
	const unspelledHelper = constant('unspelled', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' cannot spell ')), '+', id('value')))), 'never', [['value', union(['number', 'bigint'])]]));
	const missingHelper = constant('missing', arrow('owner', 'string', block(raise(binary(id('owner'), '+', str(' is required')))), 'never'));
	const unroutedHelper = constant('unrouted', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' has no slot ')), '+', id('slot')))), 'never', [['slot', 'string']]));
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
		if (container.through !== undefined) fail(`a container at ${container.key} standing in for others`);
		if (container.slots !== undefined) fail(`a container at ${container.key} that holds slots of its own`);
		if (container.sets !== undefined) fail(`a container at ${container.key} that sets flags`);
	};
	const checkSeat = (seat: PortableSeat): void => {
		if (seat.refined !== undefined) fail(`a seat at ${seat.at[1]} holding refined kinds`);
		if (seat.contents !== undefined) fail(`a seat at ${seat.at[1]} with flag-built contents`);
		if (seat.final === true) fail(`a seat at ${seat.at[1]} holding a list's last element`);
		for (const container of seat.within ?? []) checkContainer(container);
	};
	const placeOne = (container: PortableContainer, inner: Expression): Expression => {
		if (container.builder === undefined) return fail(`a container at ${container.key} with no builder of its own`);
		const shape = shapeOf(container.builder);
		if (shape === 'config') return call(builderRef(container.builder), obj([[container.key, inner]]));
		if (shape === 'forwarded' || shape === 'direct' || shape === 'spread' || shape === 'elements') return call(builderRef(container.builder), inner);
		return fail(`a container builder ${container.builder} taking a ${shape} input`);
	};
	const extending = (seats: readonly PortableSeat[], base: PortableSeat): readonly PortableSeat[] => {
		const prefix = base.within ?? [];
		return seats.filter((seat) => (seat.within ?? []).length >= prefix.length && prefix.every((container, i) => container.builder === seat.within![i]!.builder && container.key === seat.within![i]!.key));
	};
	const wrapOne = (within: readonly PortableContainer[] | undefined, value: Expression): Expression => [...(within ?? [])].reverse().reduce((inner, container) => placeOne(container, inner), value);
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
	const preluded = (build: () => Statement[]): Statement[] => {
		const outer = prelude;
		prelude = [];
		try {
			const body = build();
			return [...prelude, ...body];
		} finally {
			prelude = outer;
		}
	};
	const split = (name: string, list: Expression, item: string): { readonly empty: Operand; readonly items: { readonly first: Expression; readonly rest: Expression } } => {
		const [first, rest] = [`${name}$first`, `${name}$rest`];
		prelude.push(constant(first, t.subscriptExpression({ object: list, index: num(0) })), constant(rest, call(dot(list, 'slice'), num(1))));
		return { empty: binary(id(first), '===', id('undefined')), items: { first: call(id(item), id(first)), rest: call(dot(id(rest), 'map'), id(item)) } };
	};

	const testOf = (test: PortablePickTest, value: Primary): Operand | undefined => {
		if ('absent' in test)
			return and([...test.required.map((name) => binary(dot(value, name), '!==', id('undefined'))), ...test.absent.map((name) => binary(dot(value, name), '===', id('undefined')))]);
		if ('empty' in test) return and(test.empty.map((name) => binary(dot(listOf(dot(value, name)), 'length'), '===', num(0))));
		if ('flag' in test) return test.set ? flagged(value, test.flag) : t.unaryExpression({ operator: '!', argument: flagged(value, test.flag) });
		if ('text' in test) return binary(dot(value, '$value'), '===', str(test.text));
		if ('boolean' in test) return binary(dot(value, '$value'), '===', test.boolean ? 'true' : 'false');
		if ('variant' in test) return fail(`a pick by the render options' variant ${test.variant}`);
		return fail(`a pick by the kinds ${test.slot} builds`);
	};
	const pickOf = (arm: PortableBuildArm, value: Primary): Operand | undefined => and(arm.when.map((test) => testOf(test, value)).filter((part): part is Operand => part !== undefined));

	const viewed = new Set(input.viewed);
	const textPaths = new Set(input.textPaths);
	const textInputs = new Set(input.textInputs);
	const textValues = new Set(input.textValues);
	const failed = new Map<string, string>();
	let slotFunctions = new Map<string, readonly Statement[]>();
	let armFunctions = new Map<string, Statement>();
	let grew = false;

	const wrappedText = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[]): Statement[] => {
		const exact = input.slots[owner]![slot.name]!;
		const takesText = (path: string, name: string): boolean => {
			const set = input.slots[path]?.[name];
			return set !== undefined && (set.string || set.texts.length > 0 || set.paths.some((at) => textPaths.has(at) || textInputs.has(at)));
		};
		const wrappers = exact.paths.flatMap((path) => {
			const fitting = viewed.has(path) ? fittingOf(path, slot.seats) : [];
			if (fitting.length !== 1) return [];
			const required = fitting[0]!.arm.slots.filter((step) => input.slots[path]?.[step.name]?.optional !== true);
			return required.length === 1 && takesText(path, required[0]!.name) ? [[path, required[0]!.name] as const] : [];
		});
		const outermost = wrappers.filter(([path]) => !wrappers.some(([other]) => path.startsWith(`${other}.`)));
		if (outermost.length !== 1) return [ret(call(id(uses('untexted')), str(`${owner}.${slot.name}`), value))];
		const [path, name] = outermost[0]!;
		return caseOf(owner, path, slot, skip, obj([[name, value]]), every);
	};

	const stringBranch = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[], texted: boolean): Statement[] | undefined => {
		const tokens = [...new Map(slot.seats.flatMap((seat) => Object.entries(seat.tokens ?? {}))).entries()];
		const leafSeats = slot.seats.filter((seat) => seat.leaf !== undefined);
		const textSeat = slot.seats.find((seat) => seat.text === true);
		const place = (seat: PortableSeat, built: Expression = seat.leaf === undefined ? value : call(builderRef(seat.leaf), value)) => wrapOne((seat.within ?? []).slice(skip), built);
		const tokenSeat = (kind: number): PortableSeat => slot.seats.find((seat) => seat.kinds.includes(kind)) ?? slot.seats[0]!;
		const placed: Statement[] = [];
		for (const seat of leafSeats) {
			if (seat.pattern === undefined) {
				placed.push(ret(place(seat)));
				break;
			}
			const regex = t.regex({ pattern: seat.pattern.source, ...(seat.pattern.flags === '' ? {} : { flags: seat.pattern.flags }) });
			placed.push(when(call(dot(regex, 'test'), value), ret(place(seat))));
		}
		if (leafSeats.length > 0 && leafSeats.every((seat) => seat.pattern !== undefined)) placed.push(ret(place(leafSeats[0]!)));
		if (leafSeats.length === 0 && textSeat !== undefined) placed.push(ret(place(textSeat)));
		if (placed.length === 0 && (texted || tokens.length > 0)) placed.push(...wrappedText(owner, slot, skip, value, every));
		if (tokens.length === 0) return placed.length === 0 ? undefined : placed;
		return [
			t.switchStatement({
				value: paren(value),
				body: t.switchBody(...tokens.map(([text, kind]) => t.switchCase({ value: str(text), bodies: [ret(place(tokenSeat(kind), num(kind)))] })), t.switchDefault({ bodies: placed }))
			})
		];
	};


	const placedArm = (path: string, slot: PortableSlotRoute, { arm, seats }: Fitting, skip: number, value: Expression): Statement | undefined => {
		const name = armName(path, arm);
		if (name === undefined) return undefined;
		if (new Set(seats.map((seat) => JSON.stringify((seat.within ?? []).slice(skip)))).size > 1) fail(`arm ${arm.kind} of ${path} fits ${seats.length} of ${slot.name}'s seats, which wrap it differently`);
		return ret(wrapOne((seats[0]!.within ?? []).slice(skip), call(id(name), value)));
	};

	const caseOf = (owner: string, path: string, slot: PortableSlotRoute, skip: number, value: Expression, every: readonly PortableSeat[]): Statement[] => {
		const fitting = fittingOf(path, slot.seats);
		if (fitting.length === 0) {
			if (fittingOf(path, every).length === 0) found.push([{ code: 'portable-emit-unplaced-path', path: owner, slot: slot.name, message: `${path} has no arm that fits ${slot.name}'s seats` }, scope]);
			return [unbuilt(`${owner}.${slot.name}`, value)];
		}
		const statements: Statement[] = [];
		for (const [i, fit] of fitting.entries()) {
			const { arm } = fit;
			const placed = placedArm(path, slot, fit, skip, value);
			if (placed === undefined) {
				statements.push(unbuilt(`${owner}.${slot.name}`, value));
				break;
			}
			const condition = i === fitting.length - 1 ? undefined : pickOf(arm, value);
			if (condition === undefined) {
				if (i < fitting.length - 1) fail(`${fitting.length} arms of ${path} fit ${slot.name}'s seats, and nothing picks arm ${arm.kind} among them`);
				statements.push(placed);
				break;
			}
			statements.push(when(condition, placed));
		}
		return statements;
	};

	const placedByKind = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, ids: boolean): Statement[] => {
		const tokens = new Set(slot.seats.flatMap((seat) => Object.values(seat.tokens ?? {})));
		const groups = new Map<string, { readonly within: readonly PortableContainer[]; readonly kinds: Set<number> }>();
		for (const seat of slot.seats) {
			const within = (seat.within ?? []).slice(skip);
			const key = JSON.stringify(within);
			const group = groups.get(key) ?? groups.set(key, { within, kinds: new Set() }).get(key)!;
			for (const kind of seat.kinds) if (!ids || !tokens.has(kind)) group.kinds.add(kind);
		}
		const placed = [...groups.values()].filter(({ kinds }) => kinds.size > 0);
		return [
			...placed.map(({ within, kinds }) => when(call(id(uses('seated')), value, t.array(...[...kinds].sort((a, b) => a - b).map(num))), ret(wrapOne(within, value)))),
			ret(call(id(uses('unseated')), str(`${owner}.${slot.name}`), value))
		];
	};

	const numberBranches = (owner: string, slot: PortableSlotRoute, skip: number, value: Expression, admitted: readonly string[]): Statement[] => {
		const { takers } = slot;
		const refused = (scalar: string): Statement => ret(call(id(uses('unnumbered')), str(`${owner}.${slot.name}`), str(scalar)));
		if (takers === undefined)
			return [
				...(admitted.includes('bigint') ? [when(typeIs(value, 'bigint'), block(refused('bigint')))] : []),
				when(typeIs(value, 'number'), block(...placedByKind(owner, slot, skip, value, true)))
			];
		const builtBy = (scalar: keyof typeof takers): { readonly path: string; readonly fit: Fitting } | undefined => {
			const path = takers[scalar];
			const kind = path === undefined ? undefined : rowOf(path)?.builds?.[scalar];
			const fit = kind === undefined ? undefined : fittingOf(path!, slot.seats).find(({ arm }) => arm.kind === kind && arm.scalar === scalar);
			return fit === undefined ? undefined : { path: path!, fit };
		};
		const taken = (scalar: keyof typeof takers): Statement => {
			const path = takers[scalar];
			if (path === undefined) return refused(scalar);
			const by = builtBy(scalar);
			return (by === undefined ? undefined : placedArm(path, slot, by.fit, skip, obj([['$path', str(path)], ['$value', value]]))) ?? unbuilt(`${owner}.${slot.name}`, obj([['$path', str(path)]]));
		};
		const [integer, float] = [builtBy('integer'), builtBy('float')];
		const numbers = integer !== undefined && integer.fit.arm === float?.fit.arm ? [taken('integer')] : [when(call(dot(id('Number'), 'isSafeInteger'), value), block(taken('integer'))), taken('float')];
		return [
			...(takers.bigint === undefined && !admitted.includes('bigint') ? [] : [when(typeIs(value, 'bigint'), block(taken('bigint')))]),
			...(takers.integer === undefined && takers.float === undefined && !admitted.includes('number') ? [] : [when(typeIs(value, 'number'), block(...numbers))])
		];
	};

	const slotFunction = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute, skip: number, seats = slot.seats): string => {
		const name = `${identifierOf(owner)}$${arm.kind}_${slot.name}${skip === 0 ? '' : '$item'}`;
		return uses(slotFunctions.has(name) ? name : tracked(name, () => slotFunctionOf(name, owner, arm, { ...slot, seats }, skip, slot.seats)));
	};

	const slotFunctionOf = (name: string, owner: string, arm: PortableBuildArm, slot: PortableSlotRoute, skip: number, every: readonly PortableSeat[]): string => {
		for (const seat of slot.seats) checkSeat(seat);
		const exact = input.slots[owner]?.[slot.name];
		if (exact === undefined) fail(`${slot.name} has no exact set`);
		const value = id('value');
		const statements: Statement[] = [];
		if (takesHoles(slot)) statements.push(when(binary(value, '===', 'null'), ret('null')));
		const structures = exact!.paths.filter((path) => viewed.has(path));
		const decided = input.decided[owner]?.[slot.name];
		const free = exact!.string || exact!.paths.some((path) => textPaths.has(path) || textInputs.has(path));
		const texted = free || exact!.texts.length > 0;
		const text = stringBranch(owner, slot, skip, value, every, texted);
		if (text !== undefined) statements.push(when(typeIs(value, 'string'), block(...text)));
		statements.push(...numberBranches(owner, slot, skip, value, exact!.numbers));
		statements.push(when(call(id(uses('isNode')), value), block(...placedByKind(owner, slot, skip, value, false))));
		if (structures.length === 0) statements.push(t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(str(`${owner}.${slot.name} takes no structure`)) })));
		else if (decided !== undefined && structures.length === 1 && structures[0] === decided) statements.push(...caseOf(owner, decided, slot, skip, value, every));
		else {
			const cases = structures.flatMap((path) => [
				...(path === decided ? [t.switchCase({ value: id('undefined'), bodies: [] })] : []),
				t.switchCase({ value: str(path), bodies: caseOf(owner, path, slot, skip, value, every) })
			]);
			statements.push(t.switchStatement({ value: paren(dot(value, '$path')), body: t.switchBody(...cases, t.switchDefault({ bodies: [unbuilt(`${owner}.${slot.name}`, value)] })) }));
		}
		const items: TypeNode[] = [
			...(exact!.string || (text !== undefined && !free && exact!.texts.length === 0) ? ['string'] : []),
			...exact!.texts.map((literal) => t.literalType(str(literal))),
			...exact!.paths.filter((path) => textPaths.has(path) || textInputs.has(path)).map((path) => typeRef(uses('Text'), input.map, t.literalType(str(path)))),
			...exact!.numbers,
			...structures.flatMap((path) => [path === decided ? pathInputType(path) : pathType(path), nodesType(path)]),
			...exact!.unmapped.map((name) => typeRef(uses('Unmapped'), t.literalType(str(name))))
		];
		const item = `${name}$Item`;
		slotFunctions.set(name, [t.typeAliasDeclaration({ name: item, value: union(items.length === 0 ? ['never'] : items) }), constant(name, arrow('value', item, block(...statements)))]);
		return name;
	};

	const slotValue = (owner: string, arm: PortableBuildArm, slot: PortableSlotRoute, value: Expression): Expression => {
		if (slot.steps.length !== 1) return fail(`${slot.name} reaches its slot in ${slot.steps.length} steps`);
		const [step] = slot.steps;
		if (step!.mounted !== undefined || step!.flatten === true || step!.seated !== undefined || step!.many === true) return fail(`${slot.name}'s step at ${step!.key} is not a plain slot`);
		if (slot.requires !== undefined || slot.reads !== undefined || slot.nonEmpty === true) return fail(`${slot.name} requires other slots or reads only some kinds`);
		const given = dot(value, slot.name);
		if (slot.multiple) return call(dot(listOf(given), 'map'), id(slotFunction(owner, arm, slot, 0)));
		const either = slot.list !== true && slot.seats.some((seat) => seat.many === true && !(slot.list === false && (seat.within ?? []).length === 0));
		const single = (): Expression => {
			const built = call(id(slotFunction(owner, arm, slot, 0)), given);
			if (step!.optional === true) return ternary(binary(given, '===', id('undefined')), id('undefined'), built);
			return input.slots[owner]?.[slot.name]?.optional === true ? ternary(binary(given, '===', id('undefined')), call(id(uses('missing')), str(`${owner}.${slot.name}`)), built) : built;
		};
		if (slot.list !== true && !either) return single();
		const seat = slot.seats.find((candidate) => candidate.many === true && (candidate.within ?? []).length > 0);
		if (seat === undefined) return fail(`${slot.name} is a list with no list container seat`);
		const isList = () => call(id(uses('listed')), given);
		const item = slotFunction(owner, arm, slot, seat.within!.length, extending(slot.seats, seat));
		const open = seat.within!.findIndex((container) => container.optional === true);
		const outer = seat.within!.slice(0, open + 1);
		if (open >= 0 && outer.at(-1)!.builder === undefined) return fail(`${slot.name}'s optional list container has no builder`);
		const listed = (): Expression => {
			if (open < 0 && step!.optional !== true) return wrapList(seat.within!, { all: call(dot(either ? given : listOf(given), 'map'), id(item)) });
			const { empty, items } = split(slot.name, either ? paren(ternary(isList(), given, t.array())) : listOf(given), item);
			return ternary(empty, open < 0 ? id('undefined') : wrapOne(outer.slice(0, -1), call(builderRef(outer.at(-1)!.builder!))), wrapList(seat.within!, items));
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
		if (numeric === undefined || shapeOf(arm.builder!) !== 'config') {
			if (others.length > 0) return fail(`${path}'s number arm takes slots beside its value`);
			if (arm.scalar !== 'integer') return [ret(call(callee, scalar))];
			return [constant('value', scalar), ret(ternary(typeIs(id('value'), 'bigint'), call(callee, id('value')), call(callee, id('value'))))];
		}
		const entries = others.map((slot): [string, Expression] => [slot.steps[0]?.key ?? slot.name, slotValue(path, arm, slot, input())]);
		if (parts === undefined) return [ret(call(callee, obj([...entries, [slots.at(-1)!, scalar]])))];
		const options = new Set(table.options?.[arm.builder!] ?? []);
		if (entries.some(([key]) => options.has(key))) return fail(`${path}'s number arm takes a slot through its builder's options`);
		const written = slots.map((slot): [string, Expression] => [slot, dot(id('parts'), slot)]);
		const optioned = written.filter(([slot]) => options.has(slot));
		return [
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
		if (arm.owners !== undefined) return fail(`arm ${arm.kind} builds through one of several forms`);
		if (arm.content !== undefined) return fail(`arm ${arm.kind} builds its text through a content slot`);
		if (arm.literal !== undefined) return fail(`arm ${arm.kind} is a literal token`);
		if ((arm.facts ?? []).length > 0) return fail(`arm ${arm.kind} spells facts in its container`);
		if (arm.scalar !== undefined) return numberBody(path, arm, input);
		const shape = shapeOf(arm.builder);
		if (shape === 'text' && textValues.has(path) && arm.slots.length === 0 && arm.presets.length === 0 && Object.keys(arm.flags).length === 0) {
			const given = input();
			return [ret(call(builderRef(arm.builder), ternary(typeIs(given, 'string'), given, dot(given, '$value'))))];
		}
		if (shape === 'text' || shape === 'placed') return fail(`arm ${arm.kind}'s builder takes its text`);
		const entries: [string, Expression][] = [];
		const seen = new Set<string>();
		const emptied = new Set(arm.when.flatMap((test) => ('empty' in test ? test.empty : [])));
		for (const slot of arm.slots) {
			if (emptied.has(slot.name)) continue;
			if (seen.has(slot.name)) return fail(`${slot.name} has more than one route`);
			seen.add(slot.name);
			entries.push([slot.steps[0]?.key ?? slot.name, slotValue(path, arm, slot, input())]);
		}
		for (const preset of arm.presets) {
			if (preset.steps.length !== 1 || preset.builder !== undefined || preset.among !== undefined || (preset.kind === undefined && preset.text === undefined))
				return fail(`a preset at ${preset.steps.map((step) => step.key).join('.')} that is not one keyword or text`);
			entries.push([preset.steps[0]!.key, preset.kind === undefined ? str(preset.text!) : num(preset.kind)]);
		}
		for (const [flag, step] of Object.entries(arm.flags)) {
			if (step.template !== undefined || step.delimiter !== undefined || step.list !== undefined || (step.unset ?? []).length > 0) return fail(`flag ${flag} spells text, a delimiter or an unset preset`);
			const keys = new Set<string>();
			for (const preset of step.presets) {
				if (preset.steps.length !== 1 || preset.kind === undefined) return fail(`flag ${flag}'s preset is not one keyword`);
				keys.add(preset.steps[0]!.key);
			}
			for (const slot of keys) entries.push([slot, flagged(input(), flag)]);
		}
		if (new Set(entries.map(([name]) => name)).size !== entries.length) return fail(`arm ${arm.kind} fills one slot twice`);
		if ((table.options?.[arm.builder] ?? []).length > 0) return fail(`${arm.builder} takes options`);
		const callee = builderRef(arm.builder);
		if (shape === 'config') return [ret(call(callee, obj(entries)))];
		if (shape === 'constant' || shape === 'nullary') return entries.length === 0 ? [ret(call(callee))] : fail(`${arm.builder} takes nothing but the arm fills ${entries.length} slots`);
		if (entries.length > 1) return fail(`${arm.builder} (${shape}) takes one slot but the arm has ${entries.length}`);
		if (shape === 'spread' || shape === 'elements') return [ret(entries.length === 0 ? call(callee) : call(callee, t.spreadElement(entries[0]![1])))];
		if (shape === 'forwarded' || shape === 'direct') return [ret(entries.length === 0 ? call(callee) : call(callee, entries[0]![1]))];
		return fail(`${arm.builder} takes a ${shape} input`);
	};

	const unroutedGuards = (path: string, arm: PortableBuildArm): Statement[] => {
		if (textValues.has(path)) return [];
		const routed = new Set([...arm.slots.map((slot) => slot.name), ...arm.when.flatMap((test) => ('empty' in test ? test.empty : []))]);
		return Object.keys(input.slots[path] ?? {})
			.filter((name) => !routed.has(name))
			.sort()
			.map((name) => when(binary(dot(id(uses('input')), name), '!==', id('undefined')), ret(call(id(uses('unrouted')), str(path), str(name)))));
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

	const scalarDispatch = (path: string, builds: NonNullable<PortableBuildPath['builds']>, arms: readonly PortableBuildArm[], value: Built<B['identifier']>): Statement[] => {
		const scalars = arms.filter((arm) => arm.scalar !== undefined && builds[arm.scalar] === arm.kind);
		if (scalars.length === 0) return fail('a path that picks its arm by its value builds no scalar');
		const armFor = (...wanted: readonly string[]): PortableBuildArm => wanted.map((scalar) => scalars.find((arm) => arm.scalar === scalar)).find((arm) => arm !== undefined) ?? scalars[0]!;
		const built = (arm: PortableBuildArm): Expression => {
			const name = armName(path, arm);
			return name === undefined ? call(id(uses('unbuilt')), str(path), value) : call(id(name), value);
		};
		const given = dot(value, '$value');
		const [integer, float] = [armFor('integer'), armFor('float')];
		return [
			when(typeIs(given, 'bigint'), ret(built(armFor('bigint', 'integer')))),
			when(typeIs(given, 'number'), ret(integer === float ? built(integer) : ternary(call(dot(id('Number'), 'isSafeInteger'), given), built(integer), built(float)))),
			ret(call(id(uses('unbuilt')), str(path), value))
		];
	};

	let pathFunctions: Statement[] = [];
	let roots: string[] = [];
	let root: Trie = { children: new Map() };
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
						statements.push(...scalarDispatch(path, row.builds, arms, value));
						return;
					}
					for (const [i, arm] of arms.entries()) {
						const name = armName(path, arm);
						if (name === undefined) {
							generated = false;
							break;
						}
						const condition = i === arms.length - 1 ? undefined : pickOf(arm, value);
						if (condition === undefined) {
							statements.push(ret(call(id(name), value)));
							break;
						}
						statements.push(when(condition, ret(call(id(name), value))));
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
		['unrouted', unroutedHelper],
		['seated', seatedHelper],
		['listed', listedHelper],
		['unseated', unseatedHelper],
		['untexted', untextedHelper],
		['unnumbered', unnumberedHelper],
		['unspelled', unspelledHelper]
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

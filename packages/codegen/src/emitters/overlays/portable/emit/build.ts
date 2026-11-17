import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import type {
	PortableBuildArm,
	PortableBuildPath,
	PortableBuildTable,
	PortableContainer,
	PortableDecimalParts,
	PortableMemberStep,
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
	| Built<B['statementBlock']>;
type TypeNode = string | Built<B['genericType']> | Built<B['literalType']> | Built<B['unionType']> | Built<B['lookupType']> | Built<B['typeQuery']> | Built<B['objectType']>;

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
	const diagnostics: PortableEmitDiagnostic[] = [];
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
	const pathType = (path: string) => typeRef('BuildInput', input.map, t.literalType(str(path)));
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
	const shaped = (property: string, type: TypeNode) => t.objectType({ opening: '{', members: [t.propertySignature({ readonly: true, name: property, type: t.typeAnnotation(type) })], closing: '}' });
	const raise = (message: Expression) => t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(message) }));
	const kindOf = (value: Primary) => ternary(typeIs(value, 'number'), value, dot(value, '$type'));
	const kinded = union(['number', shaped('$type', 'number')]);
	let refs = new Set<string>();
	let deps = new Map<string, ReadonlySet<string>>();
	const uses = (name: string): string => {
		refs.add(name);
		return name;
	};
	const tracked = <T>(owner: string, build: () => T): T => {
		const outer = refs;
		refs = new Set();
		try {
			return build();
		} finally {
			deps.set(owner, refs);
			refs = outer;
		}
	};
	const unbuilt = (owner: string, value: Expression) => ret(call(id(uses('unbuilt')), str(owner), value));
	const unbuiltHelper = constant(
		'unbuilt',
		arrow('owner', 'string', block(raise(binary(binary(binary(id('owner'), '+', str(': ')), '+', dot(id('value'), '$path')), '+', str(' is not generated')))), 'never', [['value', shaped('$path', 'string')]])
	);
	const listed = t.lookupType({ type: 'T', indexType: 'number' });
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
			returnType: t.typePredicateAnnotation(t.typePredicate({ name: 'value', type: typeRef('Extract', 'V', union([listed, shaped('$type', listed)])) })),
			body: call(dot(id('kinds'), 'includes'), kindOf(id('value')))
		})
	);
	const missingHelper = constant('missing', arrow('owner', 'string', block(raise(binary(id('owner'), '+', str(' is required')))), 'never'));
	const unseatedHelper = constant('unseated', arrow('owner', 'string', block(raise(binary(binary(id('owner'), '+', str(' has no seat for kind ')), '+', paren(kindOf(id('value')))))), 'never', [['value', kinded]]));
	const holes = new Set(input.holes.map(([holder, key]) => `${holder} ${key}`));
	const takesHoles = (member: PortableMemberStep): boolean => member.seats.some((seat) => holes.has(`${seat.at[0]} ${seat.at[1]}`));

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
		if (container.members !== undefined) fail(`a container at ${container.key} that holds members of its own`);
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
		if (shape === 'forwarded' || shape === 'direct') return call(builderRef(container.builder), inner);
		return fail(`a container builder ${container.builder} taking a ${shape} input`);
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
		return fail(`a pick by the kinds ${test.member} builds`);
	};
	const pickOf = (arm: PortableBuildArm, value: Primary): Operand | undefined => and(arm.when.map((test) => testOf(test, value)).filter((part): part is Operand => part !== undefined));

	const viewed = new Set(input.viewed);
	const textPaths = new Set(input.textPaths);
	const textInputs = new Set(input.textInputs);
	const failed = new Map<string, string>();
	let memberFunctions = new Map<string, Statement>();
	let armFunctions = new Map<string, Statement>();
	let grew = false;

	const stringBranch = (member: PortableMemberStep, skip: number, value: Expression): Statement[] | undefined => {
		const tokens = [...new Map(member.seats.flatMap((seat) => Object.entries(seat.tokens ?? {}))).entries()];
		const leafSeats = member.seats.filter((seat) => seat.leaf !== undefined);
		const textSeat = member.seats.find((seat) => seat.text === true);
		const place = (seat: PortableSeat) => {
			const built = seat.leaf === undefined ? value : call(builderRef(seat.leaf), value);
			return wrapOne((seat.within ?? []).slice(skip), built);
		};
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
		if (tokens.length === 0) return placed.length === 0 ? undefined : placed;
		return [
			t.switchStatement({
				value: paren(value),
				body: t.switchBody(...tokens.map(([text, kind]) => t.switchCase({ value: str(text), bodies: [ret(num(kind))] })), t.switchDefault({ bodies: placed.length === 0 ? [ret(value)] : placed }))
			})
		];
	};


	const caseOf = (owner: string, path: string, member: PortableMemberStep, skip: number, value: Expression): Statement[] => {
		const fitting = fittingOf(path, member.seats);
		if (fitting.length === 0) {
			diagnostics.push({ code: 'portable-emit-unplaced-path', path: owner, member: member.name, message: `${path} has no arm that fits ${member.name}'s seats` });
			return [unbuilt(`${owner}.${member.name}`, value)];
		}
		const statements: Statement[] = [];
		for (const [i, { arm, seats }] of fitting.entries()) {
			const name = armName(path, arm);
			if (name === undefined) {
				statements.push(unbuilt(`${owner}.${member.name}`, value));
				break;
			}
			if (new Set(seats.map((seat) => JSON.stringify((seat.within ?? []).slice(skip)))).size > 1) fail(`arm ${arm.kind} of ${path} fits ${seats.length} of ${member.name}'s seats, which wrap it differently`);
			const built = call(id(name), value);
			const placed = ret(wrapOne((seats[0]!.within ?? []).slice(skip), built));
			const condition = i === fitting.length - 1 ? undefined : pickOf(arm, value);
			if (condition === undefined) {
				if (i < fitting.length - 1) fail(`${fitting.length} arms of ${path} fit ${member.name}'s seats, and nothing picks arm ${arm.kind} among them`);
				statements.push(placed);
				break;
			}
			statements.push(when(condition, placed));
		}
		return statements;
	};

	const placedByKind = (owner: string, member: PortableMemberStep, skip: number, value: Expression, ids: boolean): Statement[] => {
		const tokens = new Set(member.seats.flatMap((seat) => Object.values(seat.tokens ?? {})));
		const groups = new Map<string, { readonly within: readonly PortableContainer[]; readonly kinds: Set<number> }>();
		for (const seat of member.seats) {
			const within = (seat.within ?? []).slice(skip);
			const key = JSON.stringify(within);
			const group = groups.get(key) ?? groups.set(key, { within, kinds: new Set() }).get(key)!;
			for (const kind of seat.kinds) if (!ids || !tokens.has(kind)) group.kinds.add(kind);
		}
		const placed = [...groups.values()].filter(({ kinds }) => kinds.size > 0);
		return [
			...placed.map(({ within, kinds }) => when(call(id(uses('seated')), value, t.array(...[...kinds].sort((a, b) => a - b).map(num))), ret(wrapOne(within, value)))),
			ret(call(id(uses('unseated')), str(`${owner}.${member.name}`), value))
		];
	};

	const memberFunction = (owner: string, arm: PortableBuildArm, member: PortableMemberStep, skip: number): string => {
		const name = `${identifierOf(owner)}$${arm.kind}_${member.name}${skip === 0 ? '' : '$item'}`;
		return uses(memberFunctions.has(name) ? name : tracked(name, () => memberFunctionOf(name, owner, arm, member, skip)));
	};

	const memberFunctionOf = (name: string, owner: string, arm: PortableBuildArm, member: PortableMemberStep, skip: number): string => {
		for (const seat of member.seats) checkSeat(seat);
		const exact = input.members[owner]?.[member.name];
		if (exact === undefined) fail(`${member.name} has no exact set`);
		const value = id('value');
		const statements: Statement[] = [];
		if (takesHoles(member)) statements.push(when(binary(value, '===', 'null'), ret('null')));
		const structures = exact!.paths.filter((path) => viewed.has(path));
		const free = exact!.string || exact!.paths.some((path) => textPaths.has(path) || textInputs.has(path));
		const texted = free || exact!.texts.length > 0;
		const text = stringBranch(member, skip, value);
		if (text !== undefined) statements.push(when(typeIs(value, 'string'), block(...text)));
		else if (texted) statements.push(when(typeIs(value, 'string'), ret(value)));
		statements.push(when(typeIs(value, 'number'), block(...placedByKind(owner, member, skip, value, true))));
		statements.push(when(call(dot(id('engine'), 'isNode'), value), block(...placedByKind(owner, member, skip, value, false))));
		if (structures.length === 0) statements.push(t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(str(`${owner}.${member.name} takes no structure`)) })));
		else {
			const cases = structures.map((path) => t.switchCase({ value: str(path), bodies: caseOf(owner, path, member, skip, value) }));
			statements.push(t.switchStatement({ value: paren(dot(value, '$path')), body: t.switchBody(...cases, t.switchDefault({ bodies: [unbuilt(`${owner}.${member.name}`, value)] })) }));
		}
		const items: TypeNode[] = [
			...(free || (text !== undefined && exact!.texts.length === 0) ? ['string'] : exact!.texts.map((literal) => t.literalType(str(literal)))),
			...structures.flatMap((path) => [pathType(path), nodesType(path)]),
			...exact!.unmapped.map((name) => typeRef(uses('Unmapped'), t.literalType(str(name))))
		];
		memberFunctions.set(name, constant(name, arrow('value', union(items.length === 0 ? ['never'] : items), block(...statements))));
		return name;
	};

	const memberValue = (owner: string, arm: PortableBuildArm, member: PortableMemberStep, value: Expression): Expression => {
		if (member.steps.length !== 1) return fail(`${member.name} reaches its slot in ${member.steps.length} steps`);
		const [step] = member.steps;
		if (step!.mounted !== undefined || step!.flatten === true || step!.seated !== undefined || step!.many === true) return fail(`${member.name}'s step at ${step!.key} is not a plain slot`);
		if (member.requires !== undefined || member.reads !== undefined || member.nonEmpty === true) return fail(`${member.name} requires other members or reads only some kinds`);
		const given = dot(value, member.name);
		if (member.multiple) return call(dot(listOf(given), 'map'), id(memberFunction(owner, arm, member, 0)));
		if (member.list === true) {
			const seat = member.seats.find((candidate) => candidate.many === true && (candidate.within ?? []).length > 0);
			if (seat === undefined) return fail(`${member.name} is a list with no list container seat`);
			const item = memberFunction(owner, arm, member, seat.within!.length);
			const open = seat.within!.findIndex((container) => container.optional === true);
			if (open < 0 && step!.optional !== true) return wrapList(seat.within!, { all: call(dot(listOf(given), 'map'), id(item)) });
			const outer = seat.within!.slice(0, open + 1);
			if (open >= 0 && outer.at(-1)!.builder === undefined) return fail(`${member.name}'s optional list container has no builder`);
			const { empty, items } = split(member.name, listOf(given), item);
			return ternary(empty, open < 0 ? id('undefined') : wrapOne(outer.slice(0, -1), call(builderRef(outer.at(-1)!.builder!))), wrapList(seat.within!, items));
		}
		const single = call(id(memberFunction(owner, arm, member, 0)), given);
		if (step!.optional === true) return ternary(binary(given, '===', id('undefined')), id('undefined'), single);
		return input.members[owner]?.[member.name]?.optional === true ? ternary(binary(given, '===', id('undefined')), call(id(uses('missing')), str(`${owner}.${member.name}`)), single) : single;
	};

	const numberBody = (path: string, arm: PortableBuildArm, value: Expression): Statement[] => {
		const callee = builderRef(arm.builder!);
		const given = dot(value, '$value');
		if (arm.digits !== undefined) return fail(`${path}'s integer arm reads its number in base ${arm.digits.base}`);
		const numeric = arm.numeric;
		if (numeric === undefined) return [ret(call(callee, call(id('String'), given)))];
		if (Array.isArray(numeric)) return shapeOf(arm.builder!) === 'config' ? [ret(call(callee, obj([[numeric.at(-1)!, call(id('String'), given)]])))] : [ret(call(callee, call(id('String'), given)))];
		const parts = numeric as PortableDecimalParts;
		if (parts.exponent !== undefined || parts.marker !== undefined || parts.exponentSign !== undefined) return fail(`${path}'s number spells an exponent`);
		return fail(`${path}'s number is spelled in decimal parts`);
	};

	const armBody = (path: string, arm: PortableBuildArm, input: () => Built<B['identifier']>): Statement[] => {
		if (arm.builder === undefined) return fail(`arm ${arm.kind} builds through its holder`);
		if (arm.mounted !== undefined) return fail(`arm ${arm.kind} mounts into its holder`);
		if (arm.template !== undefined) return fail(`a template-spelled member (${arm.template.member})`);
		if (arm.sole !== undefined) return fail(`a sole-item delimiter on ${arm.sole.member}`);
		if (arm.owners !== undefined) return fail(`arm ${arm.kind} builds through one of several forms`);
		if (arm.content !== undefined) return fail(`arm ${arm.kind} builds its text through a content slot`);
		if (arm.literal !== undefined) return fail(`arm ${arm.kind} is a literal token`);
		if ((arm.facts ?? []).length > 0) return fail(`arm ${arm.kind} spells facts in its container`);
		if (arm.scalar !== undefined) return numberBody(path, arm, input());
		const shape = shapeOf(arm.builder);
		if (shape === 'text' || shape === 'placed') return fail(`arm ${arm.kind}'s builder takes its text`);
		const entries: [string, Expression][] = [];
		const seen = new Set<string>();
		const emptied = new Set(arm.when.flatMap((test) => ('empty' in test ? test.empty : [])));
		for (const member of arm.members) {
			if (emptied.has(member.name)) continue;
			if (seen.has(member.name)) return fail(`${member.name} has more than one route`);
			seen.add(member.name);
			entries.push([member.steps[0]?.key ?? member.name, memberValue(path, arm, member, input())]);
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
		if (entries.length > 1) return fail(`${arm.builder} (${shape}) takes one member but the arm has ${entries.length}`);
		if (shape === 'spread' || shape === 'elements') return [ret(entries.length === 0 ? call(callee) : call(callee, t.spreadElement(entries[0]![1])))];
		if (shape === 'forwarded' || shape === 'direct') return [ret(entries.length === 0 ? call(callee) : call(callee, entries[0]![1]))];
		return fail(`${arm.builder} takes a ${shape} input`);
	};

	function armName(path: string, arm: PortableBuildArm): string | undefined {
		const name = `${identifierOf(path)}$${arm.kind}`;
		if (armFunctions.has(name)) return uses(name);
		if (failed.has(name)) return undefined;
		armFunctions.set(name, constant(name, id('undefined')));
		try {
			const statements = tracked(name, () => preluded(() => armBody(path, arm, () => id(uses('input')))));
			const parameter = deps.get(name)!.has('input') ? 'input' : '_input';
			armFunctions.set(name, constant(name, arrow(parameter, pathType(path), block(...statements), arm.builder === undefined ? undefined : builtType(arm.builder))));
			return uses(name);
		} catch (error) {
			if (!(error instanceof Unfit)) throw error;
			armFunctions.delete(name);
			failed.set(name, error.message);
			grew = true;
			return undefined;
		}
	}

	let pathFunctions: Statement[] = [];
	let roots: string[] = [];
	let root: Trie = { children: new Map() };
	do {
		grew = false;
		diagnostics.length = 0;
		memberFunctions = new Map();
		armFunctions = new Map();
		deps = new Map();
		pathFunctions = [];
		roots = [];
		root = { children: new Map() };
		for (const [path, row] of sorted(Object.entries(table.paths), ([path]) => path)) {
			if (!row.root || row.builds !== undefined) continue;
			const arms = row.arms.filter((arm) => arm.holders === undefined);
			const statements: Statement[] = [];
			const value = id('input');
			let generated = arms.length > 0;
			try {
				tracked(identifierOf(path), () => {
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
				diagnostics.push({ code: 'portable-emit-unfit-member', path, message: reason });
				continue;
			}
			pathFunctions.push(constant(identifierOf(path), arrow('input', pathType(path), block(...statements))));
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
	for (const [path, row] of Object.entries(table.paths)) if (row.root && row.builds !== undefined) diagnostics.push({ code: 'portable-emit-unfit-member', path, message: 'a path that picks its arm by its value' });
	const live = new Set<string>();
	const reach = (name: string): void => {
		if (live.has(name)) return;
		live.add(name);
		for (const next of deps.get(name) ?? []) reach(next);
	};
	for (const name of roots) reach(name);
	const kept = (functions: ReadonlyMap<string, Statement>): Statement[] => sorted([...functions].filter(([name]) => live.has(name)), ([name]) => name).map(([, statement]) => statement);
	const helpers: readonly (readonly [string, Statement])[] = [
		['unbuilt', unbuiltHelper],
		['missing', missingHelper],
		['seated', seatedHelper],
		['unseated', unseatedHelper]
	];

	const surface = (node: Trie): Expression => {
		const children = obj(sorted(node.children, ([segment]) => segment).map(([segment, child]) => [segment, surface(child)] as const));
		if (node.path === undefined) return children;
		return node.children.size === 0 ? id(identifierOf(node.path)) : call(dot(id('Object'), 'assign'), id(identifierOf(node.path)), children);
	};
	const typeImport = (names: readonly string[], source: string) =>
		t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: t.importClause(t.namedImports(...names.map((name) => t.importSpecifier.name({ name })))), source: str(source) });
	const built = pathFunctions.length > 0;
	const program = t.program({
		statements: [
			typeImport(['Engine'], '@sittir/types'),
			...(built ? [typeImport(['BuildInput', ...(live.has('Unmapped') ? ['Unmapped'] : [])], input.imports.vocabulary)] : []),
			typeImport([input.api], input.imports.api),
			...(built ? [typeImport([input.map], input.imports.map)] : []),
			t.exportStatementDefaultDeclaration({
				content: t.functionDeclaration({
					name: 'portableBuild',
					parameters: t.formalParameters(t.requiredParameter({ name: built ? 'engine' : '_engine', type: t.typeAnnotation(typeRef('Engine', input.api)) })),
					body: block(
						...(built ? [constant('b', dot(id('engine'), 'build'))] : []),
						...helpers.filter(([name]) => live.has(name)).map(([, helper]) => helper),
						...kept(memberFunctions),
						...kept(armFunctions),
						...pathFunctions,
						ret(surface(root))
					)
				})
			})
		]
	});
	return { program, diagnostics };
}

export async function emitPortableBuildInProcess(input: PortableEmitInput<PortableBuildTable>): Promise<PortableEmitOutput> {
	const pinned = await loadPinnedBuild();
	using engine = await pinned.common.createEngine(pinned.typescript.default);
	const { program, diagnostics } = emitPortableModule(engine.build, input);
	return { text: String(engine.render(program)), diagnostics };
}

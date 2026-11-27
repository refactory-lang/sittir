import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import { readPin } from '../../../../bootstrap/bootstrap.ts';
import type { PortableBuildArm, PortableBuildTable, PortableContainer, PortablePreset, PortableSeat, PortableSlotRoute } from '../../../../../../types/src/portable-build.ts';
import type { PortableFact, PortableProjectRows, PortableReadEntry, PortableStep, QueryPlan, QuerySlotEntry, QuerySubject, SlotSubject, StepAnchor } from '../../../../../../types/src/portable-read.ts';
import type { PortableProjectInput, PortableProjectOutput } from '../emit-input.ts';
import { pinnedGapsOf, syntaxOf, type Argument, type B, type Built, type Expression, type Operand, type Primary, type Statement, type TypeNode } from './syntax.ts';

type ProjectInput = PortableProjectInput<PortableBuildTable, PortableProjectRows<PortableSeat>>;

interface Pending {
	readonly seat: PortableSeat;
	readonly containers: readonly PortableContainer[];
}

const routesOf = (arm: PortableBuildArm): readonly PortableSlotRoute[] => (arm.readOnly === undefined ? arm.slots : [...arm.slots, ...arm.readOnly]);

const chainOf = (seat: PortableSeat): readonly PortableContainer[] => (seat.within ?? []).flatMap((container): PortableContainer[] => [...(container.through ?? []).map((key) => ({ key })), container]);

const routePending = (seats: readonly PortableSeat[]): readonly Pending[] =>
	seats.flatMap((seat) => {
		const within = chainOf(seat);
		return within[0]?.builder === undefined ? [{ seat, containers: within }] : [{ seat, containers: within }, { seat, containers: within.slice(1) }];
	});

const unwrapPending = (seats: readonly PortableSeat[]): readonly Pending[] => seats.flatMap((seat) => chainOf(seat).map((_, i, chain) => ({ seat, containers: chain.slice(i) })));

const SEAT_TEXT = ['tokens', 'leaf', 'pattern', 'text', 'texts', 'contents'] as const;

const UTIL_TYPES = ['Closer', 'Found', 'Node', 'Placed', 'Routed', 'Seats', 'Spellings'] as const;

const SITTIR_TYPES = ['PortablePreset', 'QuerySlotEntry'] as const;

const METACHARACTERS = new Set('.*+?()[]{}|^$');

const literalPattern = (pattern: string): { readonly text: string; readonly start: boolean; readonly end: boolean } | undefined => {
	const start = pattern.startsWith('^');
	const end = pattern.endsWith('$') && !pattern.endsWith('\\$');
	if (!start && !end) return undefined;
	const body = pattern.slice(start ? 1 : 0, end ? -1 : undefined);
	let text = '';
	for (let i = 0; i < body.length; i++) {
		const char = body[i]!;
		if (char === '\\') {
			const next = body[++i];
			if (next === undefined || /[\p{L}\p{N}]/u.test(next)) return undefined;
			text += next;
		} else if (METACHARACTERS.has(char)) return undefined;
		else text += char;
	}
	return { text, start, end };
};

const seatText = (seat: PortableSeat): Readonly<Record<string, unknown>> => Object.fromEntries(SEAT_TEXT.flatMap((key) => (seat[key] === undefined ? [] : [[key, seat[key]]])));

const IMPORTS = [
	'atOf',
	'closeFrame',
	'closersInto',
	'closerTexts',
	'contradicted',
	'decimalOf',
	'delimited',
	'enclose',
	'erred',
	'fill',
	'fits',
	'flagsSetOn',
	'floatOf',
	'hasKind',
	'holderOf',
	'holdsKey',
	'integerOf',
	'integerValue',
	'itemsAt',
	'joined',
	'kindIn',
	'kindOf',
	'leafFits',
	'nodeText',
	'one',
	'only',
	'opaque',
	'openFrame',
	'place',
	'placedPath',
	'present',
	'readOnlySpelled',
	'rowItems',
	'sameText',
	'slotOf',
	'slotsText',
	'spelledText',
	'step',
	'storedSlotRead',
	'templated',
	'textOf',
	'texts',
	'tokenText',
	'touch',
	'unclaimedText',
	'unread',
	'untaken'
] as const;

export function emitPortableProjection(builders: B, input: ProjectInput, pin: string): Built<B['program']> {
	const t = pinnedGapsOf(builders, pin);
	const { table } = input;
	const { querySlots, flags, facts, fixedText, textBuilt, unwrap, numbers, readOnlyHolders } = input.rows;
	const syntax = syntaxOf(t);
	const { dot, call, str, num, binary, ret, block, constant, lambda, obj, typeRef } = syntax;
	const used = new Set<string>();
	const id = (name: string) => {
		used.add(name);
		return syntax.id(name);
	};
	const typeName = <T extends string>(name: T): T => {
		used.add(name);
		return name;
	};
	const numberRecord = (value: TypeNode) => typeRef('Readonly', typeRef('Record', 'number', value));
	const known = new WeakMap<object, boolean>();
	const truthOf = (value: Expression): boolean | undefined => (value === t.true ? true : value === t.false ? false : typeof value === 'object' && value !== null ? known.get(value) : undefined);
	const truth = (value: boolean): Operand => (value ? t.true : t.false);
	const paren = (value: Expression) => {
		const node = syntax.paren(value);
		const value_ = truthOf(value);
		if (value_ !== undefined) known.set(node, value_);
		return node;
	};
	const not = (operand: Operand): Operand => {
		const value = truthOf(operand);
		return value === undefined ? syntax.not(operand) : truth(!value);
	};
	const and = (parts: readonly Operand[]): Operand => (parts.some((part) => truthOf(part) === false) ? truth(false) : (syntax.and(parts.filter((part) => truthOf(part) !== true)) ?? truth(true)));
	const or = (parts: readonly Operand[]): Operand => (parts.some((part) => truthOf(part) === true) ? truth(true) : (syntax.or(parts.filter((part) => truthOf(part) !== false)) ?? truth(false)));
	const ternary = (condition: Operand, consequence: Expression, alternative: Expression): Expression => {
		const value = truthOf(condition);
		return value === undefined ? syntax.ternary(condition, consequence, alternative) : value ? consequence : alternative;
	};
	const when = (condition: Expression, consequence: Statement): Statement => {
		if (truthOf(condition) !== undefined) throw new Error('portable projection: a condition that always holds or never holds reached an if; guard it');
		return syntax.when(condition, consequence);
	};
	const guard = (condition: Expression, consequence: Statement): Statement[] => {
		const value = truthOf(condition);
		return value === undefined ? [syntax.when(condition, consequence)] : value ? [consequence] : [];
	};
	type Parameter = readonly [string, string, boolean?];
	const parameterOf = ([name, type, optional]: Parameter) =>
		optional === true ? t.optionalParameter({ name, type: t.typeAnnotation(typeName(type)) }) : t.requiredParameter({ name, type: t.typeAnnotation(typeName(type)) });
	const typed = (body: Built<B['statementBlock']>, returns: TypeNode, first: Parameter, ...parameters: readonly Parameter[]) =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.formalParametersElements(parameterOf(first), ...parameters.map(parameterOf))), returnType: t.typeAnnotation(typeof returns === 'string' ? typeName(returns) : returns), body });
	const declare = (name: string, type: Parameters<typeof t.typeAnnotation>[0] | undefined, value: Expression): Statement =>
		t.lexicalDeclaration({ kind: 'const', declarators: [t.variableDeclaratorPlain(type === undefined ? { name, value } : { name, type: t.typeAnnotation(typeof type === 'string' ? typeName(type) : type), value })] });
	const assign = (left: Primary, right: Expression): Statement => t.expressionStatement(t.assignmentExpression({ left, right }));
	const isArray = (value: Expression) => call(dot(id('Array'), 'isArray'), value);
	const absent = (value: Primary): Operand => binary(binary(value, '===', id('undefined')), '||', binary(value, '===', t.null));
	const at = (object: Primary, index: Expression) => t.subscriptExpression({ object, index });
	const kindRef = (kind: number): Primary => {
		const name = input.kinds[kind];
		if (name === undefined) throw new Error(`no kind name for ${kind}`);
		return dot(id('K'), name);
	};
	const isKind = (value: Primary, kind: number) => binary(dot(value, '$type'), '===', kindRef(kind));
	const literal = (value: unknown): Expression => {
		if (value === undefined) return id('undefined');
		if (value === null) return t.null;
		if (typeof value === 'boolean') return value ? t.true : t.false;
		if (typeof value === 'string') return str(value);
		if (typeof value === 'number') return num(value);
		if (Array.isArray(value)) return t.array(...value.map(literal));
		return obj(Object.entries(value as Readonly<Record<string, unknown>>).flatMap(([key, member]) => (member === undefined ? [] : [[key, literal(member)] as const])));
	};

	const declarations: Statement[] = [];
	const interned = new Map<string, string>();
	const counts = new Map<string, number>();
	const intern = (prefix: string, value: unknown, declaration: (name: string) => Statement): Primary => {
		const key = `${prefix}:${JSON.stringify(value)}`;
		let name = interned.get(key);
		if (name === undefined) {
			const n = counts.get(prefix) ?? 0;
			counts.set(prefix, n + 1);
			name = `${prefix}${n}`;
			interned.set(key, name);
			declarations.push(declaration(name));
		}
		return id(name);
	};
	const kindsOf = (kinds: readonly number[]): Primary => {
		const sorted = [...new Set(kinds)].sort((a, b) => a - b);
		return intern('KINDS', sorted, (name) => declare(name, undefined, t.newExpression({ function: 'Set', arguments: t.arguments(t.array(...sorted.map(num))) })));
	};
	const rowOf = (entry: QuerySlotEntry): Primary => {
		const elements: unknown[] = [...entry];
		while (elements.length > 4 && (elements.at(-1) === undefined || elements.at(-1) === null)) elements.pop();
		const written = elements.map((element) => (element === null ? undefined : element));
		return intern('ROW', written, (name) => declare(name, 'QuerySlotEntry', literal(written)));
	};
	const seatsOf = (seats: readonly PortableSeat[]): Primary => {
		const written = seats.map(seatText);
		return intern('SEATS', written, (name) => declare(name, 'Seats', literal(written)));
	};
	const setsOf = (containers: readonly PortableContainer[]): Expression => {
		const written = [...new Map(containers.flatMap((container) => (container.sets === undefined ? [] : [[JSON.stringify(container.sets), { sets: container.sets }] as const]))).values()];
		return written.length === 0 ? t.array() : intern('SETS', written, (name) => declare(name, undefined, literal(written)));
	};
	const templatesOf = (templates: Readonly<Record<string, unknown>>): Primary => intern('TEMPLATES', templates, (name) => declare(name, undefined, literal(templates)));
	const has = (kinds: readonly number[], value: Expression) => call(id('kindIn'), kindsOf(kinds), value);
	const anchored = (list: Expression, anchor: StepAnchor | undefined): Expression =>
		anchor === undefined ? list : anchor === 'only' ? call(id('only'), list) : call(dot(paren(list), 'slice'), ...(anchor === 'first' ? [num(0), num(1)] : [t.unaryExpression({ operator: '-', argument: num(1) })]));
	const textOfCall = (value: Expression) => call(id('textOf'), value, id('FIXED'));
	const textsCall = (items: Expression) => call(id('texts'), items, id('FIXED'));

	const slotEntry = (kind: number, number: number) => querySlots[kind]?.find(([, n]) => n === number);
	const slotNamed = (kind: number, accessor: string): QuerySlotEntry => {
		const entry = querySlots[kind]?.find(([name]) => name === accessor);
		if (entry === undefined) throw new Error(`portable projection: ${input.kinds[kind]} has no query slot ${accessor}`);
		return entry;
	};
	const slotItemsOf = (value: Primary, subject: SlotSubject): Expression => {
		const arms = Object.entries(subject.slots).flatMap(([kind, number]) => {
			const entry = slotEntry(Number(kind), number);
			return entry === undefined ? [] : [call(id('itemsAt'), value, kindRef(Number(kind)), rowOf(entry))];
		});
		return arms.length === 0 ? t.array() : arms.length === 1 ? arms[0]! : t.array(...arms.map((arm) => t.spreadElement(arm)));
	};
	let hoisted = new Map<number, readonly [string, Expression]>();
	const slotRead = (entry: QuerySlotEntry): Primary => {
		const number = entry[1];
		const known = hoisted.get(number);
		if (known !== undefined) return id(known[0]);
		const name = `slot${number}`;
		hoisted.set(number, [name, call(id('rowItems'), id('node'), rowOf(entry))]);
		return id(name);
	};
	const slotsRead = (entries: readonly QuerySlotEntry[]): Expression => (entries.length === 1 ? slotRead(entries[0]!) : t.array(...entries.map((entry) => t.spreadElement(slotRead(entry)))));
	const nodeSlotItems = (kind: number, subject: SlotSubject): Expression => {
		const number = subject.slots[kind];
		const entry = number === undefined ? undefined : slotEntry(kind, number);
		return entry === undefined ? t.array() : slotRead(entry);
	};
	type Reached = { readonly one: Primary; readonly kind?: number } | { readonly many: Expression };
	const subjectsOf = (reached: Reached, subject: QuerySubject): Expression => {
		if ('one' in reached) return 'self' in subject ? t.array(reached.one) : reached.kind === undefined ? slotItemsOf(reached.one, subject) : nodeSlotItems(reached.kind, subject);
		return 'self' in subject ? reached.many : call(dot(paren(reached.many), 'flatMap'), lambda(slotItemsOf(id('x'), subject), 'x'));
	};
	const compilePlan = (plan: QueryPlan<QuerySubject>, reached: Reached, depth = 0): Operand => {
		const item = `c${depth}`;
		const self = 'one' in reached && 'self' in plan;
		switch (plan.op) {
			case 'eq':
				return self ? binary(textOfCall((reached as { readonly one: Primary }).one), '===', str(plan.text)) : call(dot(textsCall(subjectsOf(reached, plan)), 'includes'), str(plan.text));
			case 'match': {
				const plain = literalPattern(plan.pattern);
				const test =
					plain === undefined
						? call(dot(t.regex({ pattern: plan.pattern.replace(/(?<!\\)((?:\\\\)*)\//g, '$1\\/'), flags: 'u' }), 'test'), id('text'))
						: plain.start && plain.end
							? binary(id('text'), '===', str(plain.text))
							: call(dot(id('text'), plain.start ? 'startsWith' : 'endsWith'), str(plain.text));
				return call(dot(textsCall(subjectsOf(reached, plan)), 'some'), lambda(test, 'text'));
			}
			case 'present':
				return binary(dot(textsCall(subjectsOf(reached, plan)), 'length'), '>', num(0));
			case 'count':
				return binary(dot(paren(subjectsOf(reached, plan)), 'length'), '>=', num(plan.min));
			case 'is':
				return self ? has(plan.types, (reached as { readonly one: Primary }).one) : call(dot(paren(subjectsOf(reached, plan)), 'some'), lambda(has(plan.types, id('x')), 'x'));
			case 'child':
				return call(dot(paren(anchored(call(dot(paren(subjectsOf(reached, plan)), 'filter'), id('hasKind')), plan.anchor)), 'some'), lambda(compilePlan(plan.of, { one: id(item) }, depth + 1), item));
			case 'not':
				return not(paren(compilePlan(plan.of, reached, depth)));
			case 'and':
				return and(plan.of.map((part) => paren(compilePlan(part, reached, depth))));
			case 'or':
				return paren(or(plan.of.map((part) => paren(compilePlan(part, reached, depth)))));
			case 'delimiter':
				return call(id('delimited'), 'one' in reached ? t.array(reached.one) : reached.many, num(plan.delimiter));
		}
	};

	const kindPaths = new Map<number, Set<string>>();
	for (const [path, row] of Object.entries(table.paths)) for (const arm of row.arms) (kindPaths.get(arm.kind) ?? kindPaths.set(arm.kind, new Set()).get(arm.kind)!).add(path);
	const readKinds = [...new Set([...kindPaths.keys(), ...[unwrap, readOnlyHolders, table.tokens ?? {}].flatMap((byKind) => Object.keys(byKind).map(Number))])].sort((a, b) => a - b);
	const fnName = (kind: number) => `read${input.kinds[kind]}`;
	const refinedKinds = new Set<number>();

	const functions: Statement[] = [];
	const resolvers = new Map<string, string>();
	const holdsSeat = (seat: PortableSeat): Operand => {
		const fit = seat.kinds.length > 0 ? call(id('fits'), kindsOf(seat.kinds), id('value')) : seat.leaf !== undefined ? call(id('leafFits'), id('value')) : truth(false);
		if (seat.refined === undefined || seat.refined.length === 0) return fit;
		for (const kind of seat.refined) refinedKinds.add(kind);
		return and([fit, not(paren(and([call(id('hasKind'), id('value')), has(seat.refined, id('value')), binary(call(id('classify'), id('value')), '===', id('undefined'))])))]);
	};
	const resolverOf = (pending: readonly Pending[]): string => {
		const signature = JSON.stringify(
			pending.map(({ seat, containers }) => [[...seat.kinds].sort((a, b) => a - b), seat.leaf !== undefined, seat.many === true, seat.refined ?? [], containers.map((container) => [container.key, container.builder !== undefined, container.sets ?? null])])
		);
		const known = resolvers.get(signature);
		if (known !== undefined) return known;
		const name = `seats${resolvers.size}`;
		resolvers.set(signature, name);
		const statements: Statement[] = [
			when(isArray(id('value')), ret(call(id('joined'), call(dot(id('value'), 'map'), lambda(binary(call(id(name), id('item')), '??', obj([['found', id('item')], ['many', t.false]])), 'item'))))),
			...pending.filter(({ containers }) => containers.length === 0).flatMap(({ seat }) => guard(holdsSeat(seat), ret(obj([['found', id('value')], ['many', seat.many === true ? t.true : t.false]]))))
		];
		const keys = [...new Set(pending.flatMap(({ containers }) => (containers.length === 0 ? [] : [containers[0]!.key])))];
		if (keys.length === 0) {
			statements.push(ret(id('undefined')));
		} else {
			const emptyAt = new Set(keys.filter((k) => pending.some(({ seat, containers }) => seat.many === true && containers[0]?.key === k)));
			statements.push(when(not(call(id('hasKind'), id('value'))), ret(id('undefined'))), t.expressionStatement(call(id('touch'), id('value'))));
			if (emptyAt.size > 0) statements.push(t.lexicalDeclaration({ kind: 'let', declarators: [t.variableDeclaratorPlain({ name: 'empty', value: t.false })] }));
			statements.push(t.lexicalDeclaration({ kind: 'let', declarators: [t.variableDeclaratorPlain({ name: 'vacant', value: t.false })] }));
			keys.forEach((k, i) => {
				const advanced = pending.flatMap(({ seat, containers }) => {
					if (containers[0]?.key !== k) return [];
					const rest = containers.slice(1);
					return rest[0]?.builder !== undefined ? [{ seat, containers: rest }, { seat, containers: rest.slice(1) }] : [{ seat, containers: rest }];
				});
				const single = pending.flatMap(({ seat, containers }) => (containers[0]?.key !== k ? [] : [{ seat, containers: containers.slice(1) }]));
				const sets = setsOf(pending.flatMap(({ containers }) => (containers[0]?.key === k ? [containers[0]] : [])));
				const next = `next${i}`;
				const found = `found${i}`;
				statements.push(
					constant(next, call(id('slotOf'), id('value'), str(k))),
					when(absent(id(next)), block(...(emptyAt.has(k) ? [assign(id('empty'), t.true)] : []), when(call(id('holdsKey'), id('value'), str(k)), assign(id('vacant'), t.true)))),
					when(
						not(paren(absent(id(next)))),
						block(
							constant(found, ternary(isArray(id(next)), call(id(resolverOf(advanced)), id(next)), call(id(resolverOf(single)), id(next)))),
							when(binary(id(found), '!==', id('undefined')), ret(ternary(isArray(id(next)), obj([t.spreadElement(id(found)), ['many', t.true]]), call(id('enclose'), id(found), id('value'), sets))))
						)
					)
				);
			});
			const none = ternary(id('vacant'), obj([['found', id('undefined')], ['many', t.false]]), id('undefined'));
			statements.push(ret(emptyAt.size > 0 ? ternary(id('empty'), obj([['found', t.array()], ['many', t.true]]), none) : none));
		}
		functions.push(constant(name, typed(block(...statements), syntax.union([typeName('Found'), 'undefined']), ['value', 'unknown'])));
		return name;
	};

	const walkOf = (route: PortableSlotRoute): Statement[] => {
		const statements: Statement[] = [];
		let from = 'node';
		let skippable: string | undefined;
		route.steps.forEach((step, i) => {
			const read = step.stored === undefined ? lambda(call(id('slotOf'), id('n'), str(step.key)), 'n') : lambda(call(id('storedSlotRead'), id('n'), str(step.key), str(step.stored)), 'n');
			const next = `s${i}`;
			const reached = call(id('step'), id(from), read, step.kinds === undefined ? id('undefined') : kindsOf(step.kinds));
			statements.push(constant(next, skippable === undefined ? reached : ternary(isArray(id(skippable)), id(skippable), reached)));
			skippable = step.builder === undefined ? undefined : next;
			from = next;
		});
		statements.push(constant('walked', id(from)));
		return statements;
	};

	const routes = new Map<string, string>();
	const routeOf = (route: PortableSlotRoute): string => {
		const resolver = resolverOf(routePending(route.seats));
		const lastKey = route.list === false ? route.steps.at(-1)?.key : undefined;
		const signature = JSON.stringify([resolver, route.steps.map((step) => [step.key, step.stored ?? null, step.kinds ?? null, step.builder !== undefined]), route.reads ?? null, route.list ?? null, route.multiple, route.emptyContainer === true, lastKey ?? null]);
		const known = routes.get(signature);
		if (known !== undefined) return known;
		const name = `route${routes.size}`;
		routes.set(signature, name);
		const listed = route.list ?? route.multiple;
		const reads = route.reads === undefined ? undefined : kindsOf(route.reads);
		const found = dot(id('resolved'), 'found');
		const fitted = binary(dot(id('resolved'), 'fitted'), '!==', t.false);
		const body = block(
			...walkOf(route),
			constant('slotted', reads === undefined ? id('walked') : ternary(isArray(id('walked')), call(dot(id('walked'), 'filter'), lambda(call(id('kindIn'), reads, id('x')), 'x')), ternary(call(id('kindIn'), reads, id('walked')), id('walked'), id('undefined')))),
			...(route.emptyContainer === true ? [when(binary(isArray(id('slotted')), '&&', binary(dot(id('slotted'), 'length'), '===', num(0))), ret(obj([['value', t.array()], ['fitted', t.true]])))] : []),
			when(not(call(id('present'), id('slotted'))), ret(id('undefined'))),
			constant('resolved', binary(call(id(resolver), id('slotted')), '??', obj([['found', id('slotted')], ['many', t.false], ['fitted', t.false]]))),
			when(binary(found, '===', id('undefined')), ret(id('undefined'))),
			...(route.list === false
				? [
						when(
							isArray(found),
							ret(
								ternary(
									binary(dot(found, 'length'), '===', num(0)),
									id('undefined'),
									obj([
										['value', at(found, num(0))],
										['fitted', fitted],
										...(lastKey === undefined ? [] : [t.spreadElement(paren(ternary(binary(dot(found, 'length'), '>', num(1)), obj([['extra', str(lastKey)]]), obj([]))))])
									])
								)
							)
						)
					]
				: []),
			ret(
				obj([
					['value', ternary(not(isArray(found)), listed ? t.array(found) : found, listed ? found : ternary(or([binary(dot(found, 'length'), '===', num(0)), dot(id('resolved'), 'many')]), found, at(found, num(0))))],
					['fitted', fitted]
				])
			)
		);
		functions.push(constant(name, typed(body, syntax.union([typeName('Routed'), 'undefined']), ['node', 'Node'])));
		return name;
	};

	let holderRead = false;
	const holder = (): Primary => {
		holderRead = true;
		return id('container');
	};
	const factCode = (kind: number, held: readonly PortableFact[]): Statement[] => {
		const byContainer = new Map<number, PortableFact[]>();
		for (const fact of held) (byContainer.get(fact.container) ?? byContainer.set(fact.container, []).get(fact.container)!).push(fact);
		const statements: Statement[] = [];
		for (const [container, list] of [...byContainer].sort(([a], [b]) => a - b)) {
			const number = list[0]!.items.slots[container];
			const entry = number === undefined ? undefined : slotEntry(container, number);
			const inner: Statement[] = [
				constant('items', entry === undefined ? t.array() : call(id('rowItems'), holder(), rowOf(entry))),
				declare('taken', typeRef('Set', 'number'), t.newExpression({ function: 'Set', arguments: t.arguments() }))
			];
			for (const fact of list) {
				const same =
					fact.same === undefined
						? []
						: [call(id('sameText'), textsCall(viaOf({ one: id('item') }, fact.same.item) ?? t.array(id('item'))), textsCall(viaOf({ one: id('node'), kind }, fact.same.node) ?? t.array(id('node'))))];
				const test = lambda(and([not(call(dot(id('taken'), 'has'), id('i'))), call(id('hasKind'), id('item')), paren(compilePlan(fact.test, { one: id('item') })), ...same]), 'item', 'i');
				const spelling = fact.spelled === undefined || fact.same !== undefined ? id('undefined') : lambda(call(id('one'), textsCall(slotItemsOf(at(id('items'), id('index')) as Primary, fact.spelled))), 'index');
				const record = t.expressionStatement(call(id('place'), id('placed'), id('taken'), id('items'), str(fact.name), str(fact.slot), test, spelling, fact.path === undefined ? id('undefined') : str(fact.path), fact.flag === undefined ? id('undefined') : str(fact.flag)));
				inner.push(...(fact.own === undefined ? [record] : guard(compilePlan(fact.own, { one: id('node'), kind }), record)));
			}
			statements.push(when(binary(binary(holder(), '!==', id('undefined')), '&&', isKind(holder(), container)), block(...inner)));
		}
		return statements;
	};

	const viaOf = (start: { readonly one: Primary; readonly kind?: number }, steps: readonly PortableStep[]): Expression | undefined =>
		steps.reduce<Expression | undefined>(
			(from, step) =>
				from === undefined
					? anchored(start.kind === undefined ? slotItemsOf(start.one, step) : nodeSlotItems(start.kind, step), step.anchor)
					: call(dot(paren(from), 'flatMap'), lambda(anchored(slotItemsOf(id('x'), step), step.anchor), 'x')),
			undefined
		);
	const entryTest = (kind: number, entry: PortableReadEntry): Operand =>
		and(
			entry.test.map((condition) => {
				const reached = viaOf({ one: id('node'), kind }, condition.via);
				return paren(compilePlan(condition.plan, reached === undefined ? { one: id('node'), kind } : { many: reached }));
			})
		);
	const classification = (kind: number): { readonly tests: Statement[]; readonly path: Expression } => {
		const entries = input.rows.entries[kind] ?? [];
		const compiled = entries.map((entry) => (entry.test.length === 0 ? truth(true) : entryTest(kind, entry)));
		const tests = compiled.flatMap((test, i) => (truthOf(test) === undefined ? [constant(`e${i}`, test)] : []));
		const holding = (i: number): Operand => (truthOf(compiled[i]!) === undefined ? id(`e${i}`) : compiled[i]!);
		const chosen = entries.map((entry, i) => and([...(entry.test.length === 0 ? [] : [holding(i)]), ...entry.refinedBy.map((j) => not(holding(j)))]));
		const path = entries.reduceRight<Expression>((rest, entry, i) => ternary(chosen[i]!, str(entry.path), rest), id('undefined'));
		return { tests, path };
	};

	const integerArm = (arm: PortableBuildArm, text: Expression): Expression => {
		if (arm.scalar === 'float') return call(id('floatOf'), text);
		if (arm.digits === undefined) return id('undefined');
		return call(id('integerOf'), call(id('integerValue'), num(arm.digits.base), str(arm.digits.affix), text), arm.scalar === 'bigint' ? t.true : t.false);
	};

	const heldRoutes = new Map<number, PortableSlotRoute[]>();
	for (const row of Object.values(table.paths))
		for (const arm of row.arms)
			for (const route of routesOf(arm))
				for (const seat of route.seats)
					for (const container of seat.within ?? [])
						for (const slot of container.slots ?? [])
							for (const kind of seat.kinds) {
								const list = heldRoutes.get(kind) ?? heldRoutes.set(kind, []).get(kind)!;
								if (!list.some((known) => known.name === slot.name)) list.push(slot);
							}

	const setSlot = (name: string, value: Expression): Statement => assign(at(id('structure'), str(name)), value);
	const unset = (name: string): Operand => not(call(id('holdsKey'), id('structure'), str(name)));

	const presetsOf = (presets: readonly PortablePreset[]): Primary =>
		intern('PRESETS', presets, (name) => declare(name, typeRef('ReadonlyArray', typeName('PortablePreset')), literal(presets)));
	const spellingsOf = (): Primary =>
		intern('SPELLINGS', null, (name) => declare(name, 'Spellings', literal(Object.fromEntries(Object.entries(table.delimiters ?? {}).flatMap(([kind, token]) => (token.spellings === undefined ? [] : [[kind, token.spellings] as const]))))));
	const builtAt = (path: string | undefined, kind: number): string | undefined => {
		if (path === undefined) return undefined;
		const all = table.paths[path]?.arms ?? [];
		const arms = all.filter((arm) => arm.kind === kind);
		return arms.length > 0 && arms.every((arm) => (textBuilt[path] ?? []).includes(all.indexOf(arm))) ? path : undefined;
	};
	const slotItemsOfKind = (kind: number): Expression => slotsRead(querySlots[kind] ?? []);
	const contentKinds = Object.entries(table.delimiters ?? {}).flatMap(([kind, token]) => (token.content === undefined ? [] : [[Number(kind), token.content] as const]));
	const closersFor = (routes: readonly PortableSlotRoute[]) =>
		Object.fromEntries(
			contentKinds.flatMap(([kind, content]) => {
				const route = routes.find((candidate) => candidate.seats.some((seat) => seat.kinds.includes(content.reads)));
				if (route === undefined) return [];
				const built = builtAt(numbers[content.reads], content.reads);
				return [[kind, { facet: content.facet, name: route.name, reads: content.reads, seats: route.seats.map(seatText), ...(built === undefined ? {} : { built }) }] as const];
			})
		);

	const structureBody = (kind: number, path: string, arms: readonly PortableBuildArm[], value: Expression | undefined): Statement[] => {
		const statements: Statement[] = [];
		const placesFacts = (facts[kind] ?? []).length > 0;
		const readable = [...new Set(arms.flatMap((arm) => arm.readableFlags ?? []))];
		const plans = flags[kind] ?? {};
		const holdsFlag = (flag: string): Operand | undefined => {
			const plan = plans[flag];
			return plan === undefined || plan === null ? undefined : paren(compilePlan(plan, { one: id('node'), kind }));
		};
		const spelledFlag = (flag: string): Operand => (placesFacts ? call(dot(id('placed'), 'some'), lambda(binary(dot(id('p'), 'flag'), '===', str(flag)), 'p')) : truth(false));
		const refused = or([
			...Object.keys(plans)
				.filter((flag) => !readable.includes(flag))
				.sort()
				.flatMap((flag): Operand[] => {
					const test = holdsFlag(flag);
					return test === undefined ? [] : [test];
				}),
			...(placesFacts ? [call(dot(id('placed'), 'some'), lambda(and([binary(dot(id('p'), 'flag'), '!==', id('undefined')), ...(readable.length === 0 ? [] : [not(call(dot(t.array(...readable.map(str)), 'includes'), dot(id('p'), 'flag')))])]), 'p'))] : [])
		]);
		if (truthOf(refused) === true) return [ret(id('node'))];
		statements.push(...guard(refused, ret(id('node'))));
		const flagged = readable.flatMap((flag): Argument[] => {
			const holds = or([...(holdsFlag(flag) === undefined ? [] : [holdsFlag(flag)!]), spelledFlag(flag)]);
			const always = truthOf(holds);
			return always === undefined ? [t.spreadElement(paren(ternary(holds, t.array(str(flag)), t.array())))] : always ? [str(flag)] : [];
		});
		statements.push(
			constant('flags', call(dot(t.array(...flagged, t.spreadElement(call(id('flagsSetOn'), id('node')))), 'filter'), lambda(binary(call(dot(id('self'), 'indexOf'), id('flag')), '===', id('i')), 'flag', 'i', 'self'))),
			declare(
				'structure',
				typeRef('Record', 'string', 'unknown'),
				obj([
					['$path', str(path)],
					t.spreadElement(paren(ternary(binary(dot(id('flags'), 'length'), '===', num(0)), obj([]), obj([['$flags', id('flags')]])))),
					...(placesFacts ? [t.spreadElement(paren(ternary(binary(dot(id('placed'), 'length'), '===', num(0)), obj([]), obj([['$at', call(id('atOf'), id('placed'))]]))))] : []),
					...(value === undefined ? [] : [['$value', value] as const])
				])
			)
		);
		const candidates = arms.flatMap(routesOf).map((route) =>
			obj([
				['name', str(route.name)],
				['found', call(id(routeOf(route)), id('node'))],
				['seats', seatsOf(route.seats)],
				['depth', num(route.steps.length)],
				...((route.requires ?? []).length === 0 ? [] : [['requires', literal(route.requires)] as const])
			])
		);
		if (candidates.length > 0) statements.push(constant('extra', call(id('fill'), id('structure'), t.array(...candidates), id('project'))));
		for (const route of heldRoutes.get(kind) ?? []) {
			const held = dot(id('held'), 'value');
			statements.push(
				when(
					and([binary(holder(), '!==', id('undefined')), unset(route.name)]),
					block(
						constant('held', call(id(routeOf(route)), holder())),
						when(
							and([binary(id('held'), '!==', id('undefined')), binary(held, '!==', t.null)]),
							setSlot(route.name, call(id('project'), placesFacts ? call(id('untaken'), held, id('placed'), str(route.name)) : held, seatsOf(route.seats)))
						)
					)
				)
			);
		}
		const emptied = new Set<string>();
		for (const route of arms.flatMap(routesOf)) if ((route.list ?? route.multiple) && route.emptyContainer !== true && !emptied.has(route.name) && emptied.add(route.name)) statements.push(when(unset(route.name), setSlot(route.name, t.array())));
		for (const test of arms.flatMap((arm) => arm.when)) if ('empty' in test) for (const name of test.empty) if (!emptied.has(name) && emptied.add(name)) statements.push(when(unset(name), setSlot(name, t.array())));
		const closers = closersFor(arms.flatMap(routesOf));
		if (Object.keys(closers).length > 0) statements.push(t.expressionStatement(call(id('closersInto'), id('structure'), slotItemsOfKind(kind), intern('CLOSERS', closers, (name) => declare(name, numberRecord(typeName('Closer')), literal(closers))), id('FIXED'))));
		const templates = Object.fromEntries(
			readable.flatMap((flag) => {
				const template = arms.map((arm) => arm.flags[flag]?.template).find((found) => found !== undefined);
				return template === undefined ? [] : [[flag, template] as const];
			})
		);
		if (Object.keys(templates).length > 0) statements.push(t.expressionStatement(call(id('templated'), id('structure'), str(path), id('flags'), templatesOf(templates))));
		if (candidates.length > 0) statements.push(when(binary(id('extra'), '!==', id('undefined')), ret(id('node'))));
		const lost = value === undefined ? (input.rows.unread[kind]?.[path] ?? []) : [];
		if (lost.length > 0) {
			const meaning = Object.fromEntries(Object.entries(table.delimiters ?? {}).map(([at, token]) => [at, token.meaning] as const));
			const meanings = intern('MEANING', meaning, (name) => declare(name, numberRecord(t.readonlyType(t.arrayType('string'))), literal(meaning)));
			const unreadIn = lost.map(({ accessor, otherTested, flags: reading }) =>
				and([call(id('unread'), slotRead(slotNamed(kind, accessor)), truth(otherTested), meanings, id('FIXED')), ...reading.map((flag) => not(call(dot(id('flags'), 'includes'), str(flag))))])
			);
			statements.push(when(or(unreadIn), ret(id('node'))));
		}
		statements.push(ret(id('structure')));
		return statements;
	};

	const scalarRead = (arm: PortableBuildArm, i: number): Statement[] => {
		const { numeric } = arm;
		if (numeric !== undefined && !Array.isArray(numeric)) return [constant(`value${i}`, call(id('decimalOf'), id('node'), literal(numeric), id('FIXED')))];
		const text = numeric === undefined ? textOfCall(id('node')) : call(id('slotsText'), id('node'), literal(numeric), id('FIXED'));
		return [constant(`text${i}`, text), constant(`value${i}`, ternary(binary(id(`text${i}`), '===', id('undefined')), id('undefined'), integerArm(arm, id(`text${i}`))))];
	};

	const armsBody = (kind: number, path: string, arms: readonly PortableBuildArm[]): Statement[] => {
		const all = table.paths[path]!.arms;
		const literalArm = arms.find((arm) => arm.literal !== undefined)?.literal;
		if (literalArm !== undefined) return [ret(obj([['$path', str(path)], ...(literalArm.value === undefined ? [] : [['$value', literalArm.value ? t.true : t.false] as const])]))];
		if (arms.every((arm) => arm.carriesNode === true)) return [ret(id('node'))];
		const scalars = arms.filter((arm) => arm.scalar !== undefined);
		if (scalars.length > 0)
			return [
				...scalars.flatMap((arm, i) => {
					const scalar = obj([['$path', str(path)], ['$value', id(`value${i}`)]]);
					const beside = arm.slots.map((route) => call(id(routeOf(route)), id('node')));
					const found = arm.slots.length === 0
						? [ret(scalar)]
						: [when(not(call(dot(t.array(...beside), 'some'), lambda(and([binary(id('r'), '!==', id('undefined')), call(id('present'), dot(id('r'), 'value'))]), 'r'))), ret(scalar)), ...structureBody(kind, path, [arm], id(`value${i}`))];
					return [...scalarRead(arm, i), when(binary(id(`value${i}`), '!==', id('undefined')), block(...found))];
				}),
				ret(id('node'))
			];
		if (all.some((arm) => arm.scalar !== undefined)) return [ret(id('node'))];
		const content = arms.find((arm) => arm.content !== undefined)?.content;
		if (content !== undefined) {
			const facets = Object.fromEntries(contentKinds.flatMap(([at, { facet, reads }]) => (content.seats.some((seat) => seat.kinds.includes(reads)) ? [[at, facet] as const] : [])));
			const found = dot(id('found'), 'value');
			const routed = ternary(binary(id('found'), '===', id('undefined')), t.array(), ternary(isArray(found), call(dot(found, 'map'), lambda(textOfCall(id('x')), 'x')), t.array(textOfCall(found))));
			const texts =
				Object.keys(facets).length === 0
					? routed
					: t.array(t.spreadElement(paren(routed)), t.spreadElement(call(id('closerTexts'), slotItemsOfKind(kind), intern('FACETS', facets, (name) => declare(name, undefined, literal(facets))), id('FIXED'))));
			return [
				constant('found', call(id(routeOf(content)), id('node'))),
				constant('texts', texts),
				ret(ternary(call(dot(id('texts'), 'every'), lambda(binary(id('x'), '!==', id('undefined')), 'x')), obj([['$path', str(path)], ['$value', call(dot(id('texts'), 'join'), str(''))]]), id('node')))
			];
		}
		const built = arms.length > 0 && arms.every((arm) => (textBuilt[path] ?? []).includes(all.indexOf(arm))) ? str(path) : id('undefined');
		const spelled = (text: Expression) => binary(call(id('spelledText'), kindRef(kind), text, id('seats'), built), '??', id('node'));
		const statements: Statement[] = [constant('own', call(id('nodeText'), id('node'))), when(binary(id('own'), '!==', id('undefined')), ret(spelled(id('own'))))];
		if (arms.every((arm) => (routesOf(arm).length === 0 && arm.seated !== undefined) || (textBuilt[path] ?? []).includes(all.indexOf(arm)))) {
			statements.push(constant('text', textOfCall(id('node'))), ret(ternary(binary(id('text'), '===', id('undefined')), id('node'), spelled(id('text')))));
			return statements;
		}
		return [...statements, ...structureBody(kind, path, arms, undefined)];
	};

	const pathCase = (kind: number, path: string): Statement[] => {
		const arms = table.paths[path]!.arms.filter((arm) => arm.kind === kind);
		const preset = arms.filter((arm) => arm.presets.length > 0);
		const variant = (i: number, kept: readonly PortableBuildArm[]): Statement[] => {
			if (i === preset.length) {
				const survivors = arms.filter((arm) => arm.presets.length === 0 || kept.includes(arm));
				return survivors.length === 0 ? [ret(id('node'))] : armsBody(kind, path, survivors);
			}
			const arm = preset[i]!;
			return [when(not(call(id('contradicted'), id('node'), presetsOf(arm.presets), spellingsOf(), id('FIXED'))), block(...variant(i + 1, [...kept, arm]))), ...variant(i + 1, kept)];
		};
		return variant(0, []);
	};

	const kindFunctions: Statement[] = [];
	for (const kind of readKinds) {
		hoisted = new Map();
		const statements: Statement[] = [];
		const paths = [...(kindPaths.get(kind) ?? [])].sort();
		const lexed = table.tokens?.[kind] ?? [];
		if (lexed.length > 0) statements.push(when(or(lexed.map((accessor) => call(dot(slotRead(slotNamed(kind, accessor)), 'some'), id('opaque')))), ret(id('node'))));
		const holding = readOnlyHolders[kind] ?? [];
		if (holding.length > 0) {
			const readOnly = Object.fromEntries(Object.entries(table.delimiters ?? {}).flatMap(([at, token]) => (token.readOnly === undefined ? [] : [[at, token.readOnly] as const])));
			const items = slotsRead((querySlots[kind] ?? []).filter(([accessor]) => holding.includes(accessor)));
			statements.push(when(call(id('readOnlySpelled'), items, intern('READONLY', readOnly, (name) => declare(name, undefined, literal(readOnly))), spellingsOf(), id('FIXED')), ret(id('node'))));
		}
		if (paths.length > 0) {
			holderRead = false;
			const placesFacts = (facts[kind] ?? []).length > 0;
			const reading: Statement[] = placesFacts ? [declare('placed', t.arrayType(typeName('Placed')), t.array()), ...factCode(kind, facts[kind] ?? [])] : [];
			const { tests, path } = classification(kind);
			reading.push(...tests, declare('path', syntax.union(['string', 'undefined']), placesFacts ? binary(call(id('placedPath'), id('placed')), '??', paren(path)) : path));
			reading.push(t.switchStatement({ value: paren(id('path')), body: t.switchBody(...paths.map((at) => t.switchCase({ value: str(at), bodies: [block(...pathCase(kind, at))] }))) }));
			statements.push(...(holderRead ? [constant('container', call(id('holderOf'), id('node')))] : []), ...reading);
		}
		const through = unwrap[kind] ?? [];
		if (through.length > 0) {
			const element = dot(id('element'), 'found');
			statements.push(
				when(
					binary(id('seats'), '===', id('undefined')),
					block(
						constant('element', call(id(resolverOf(unwrapPending(through))), id('node'))),
						when(and([binary(id('element'), '!==', id('undefined')), not(dot(id('element'), 'many')), binary(call(id('kindOf'), element), '!==', id('undefined'))]), ret(call(id('project'), element, seatsOf(through))))
					)
				)
			);
		}
		statements.push(ret(binary(call(id('unclaimedText'), id('node'), id('seats'), id('FIXED')), '??', id('node'))));
		kindFunctions.push(constant(fnName(kind), typed(block(...[...hoisted.values()].map(([name, read]) => constant(name, read)), ...statements), 'unknown', ['node', 'Node'], ['seats', 'Seats', true])));
	}

	const classifiers: Statement[] = [];
	for (const kind of [...refinedKinds].sort((a, b) => a - b)) {
		hoisted = new Map();
		const { tests, path } = classification(kind);
		classifiers.push(constant(`classify${input.kinds[kind]}`, typed(block(...[...hoisted.values()].map(([name, read]) => constant(name, read)), ...tests, ret(path)), syntax.union(['string', 'undefined']), ['node', 'Node'])));
	}
	const classify = constant(
		'classify',
		typed(
			block(t.switchStatement({ value: paren(dot(id('node'), '$type')), body: t.switchBody(...[...refinedKinds].sort((a, b) => a - b).map((kind) => t.switchCase({ value: kindRef(kind), bodies: [ret(call(id(`classify${input.kinds[kind]}`), id('node')))] }))) }), ret(id('undefined'))),
			syntax.union(['string', 'undefined']),
			['node', 'Node']
		)
	);

	const tokens = Object.entries(numbers).flatMap(([kind, path]) => {
		const value = table.paths[path]?.arms.find((arm) => arm.kind === Number(kind) && arm.literal !== undefined)?.literal;
		return value === undefined ? [] : [t.switchCase({ value: kindRef(Number(kind)), bodies: [ret(obj([['$path', str(path)], ...(value.value === undefined ? [] : [['$value', value.value ? t.true : t.false] as const])]))] })];
	});
	const projectNode = constant(
		'projectNode',
		typed(
			block(
				t.switchStatement({ value: paren(dot(id('value'), '$type')), body: t.switchBody(...readKinds.map((kind) => t.switchCase({ value: kindRef(kind), bodies: [ret(call(id(fnName(kind)), id('value'), id('seats')))] }))) }),
				ret(binary(call(id('unclaimedText'), id('value'), id('seats'), id('FIXED')), '??', id('value')))
			),
			'unknown',
			['value', 'Node'],
			['seats', 'Seats', true]
		)
	);
	const project = t.exportStatementDefaultDeclaration({ content: constant(
		'project',
		typed(
			block(
				when(isArray(id('value')), ret(call(dot(id('value'), 'map'), lambda(call(id('project'), id('item'), id('seats')), 'item')))),
				when(
					binary(t.unaryExpression({ operator: 'typeof', argument: id('value') }), '===', str('number')),
					block(...(tokens.length === 0 ? [] : [t.switchStatement({ value: paren(id('value')), body: t.switchBody(...tokens) })]), ret(binary(call(id('tokenText'), id('value'), id('seats')), '??', id('value'))))
				),
				when(not(call(id('hasKind'), id('value'))), ret(id('value'))),
				when(or([call(id('erred'), id('value')), call(id('opaque'), id('value'))]), ret(id('value'))),
				constant('outer', call(id('openFrame'))),
				ret(call(id('closeFrame'), id('outer'), id('value'), call(id('projectNode'), id('value'), id('seats'))))
			),
			'unknown',
			['value', 'unknown'],
			['seats', 'Seats', true]
		)
	) });
	const fixed = declare(
		'FIXED',
		numberRecord('string'),
		obj(Object.entries(fixedText).map(([kind, text]) => [kind, str(text)] as const))
	);
	const importedTypes = (names: readonly string[], source: string) => {
		const named = names.filter((name) => used.has(name));
		return named.length === 0 ? [] : [t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: t.importClause(t.namedImports(...named.map((name) => t.importSpecifier.name({ name })))), source: str(source) })];
	};
	const header = t.comment.line(' Auto-generated by @sittir/codegen — do not edit');
	const program = t.program({
		statements: [
			t.importStatement.clauseFrom({ importClause: t.importClause(t.namedImports(t.importSpecifier.as({ name: 'TSKindId', alias: 'K' }))), source: str(input.imports.kinds) }).$trivia.leading(header),
			t.importStatement.clauseFrom({ importClause: t.importClause(t.namedImports(...IMPORTS.filter((name) => used.has(name)).map((name) => t.importSpecifier.name({ name })))), source: str(input.imports.utils) }),
			...importedTypes(UTIL_TYPES, input.imports.utils),
			...importedTypes(SITTIR_TYPES, '@sittir/types'),
			fixed,
			...declarations,
			...functions,
			...kindFunctions,
			...classifiers,
			...(refinedKinds.size === 0 ? [] : [classify]),
			projectNode,
			project
		]
	});
	return program;
}

export async function emitPortableProjectionInProcess(input: ProjectInput): Promise<PortableProjectOutput> {
	const pinned = await loadPinnedBuild();
	using engine = await pinned.common.createEngine(pinned.typescript.default);
	return { text: String(engine.render(emitPortableProjection(engine.build, input, readPin()))) };
}

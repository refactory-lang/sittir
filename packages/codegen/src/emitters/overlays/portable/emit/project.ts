import { loadPinnedBuild } from '../../../../bootstrap/pinned.ts';
import { readPin } from '../../../../bootstrap/bootstrap.ts';
import type { PortableBuildArm, PortableBuildTable, PortableContainer, PortableSeat, PortableSlotRoute } from '../../../../../../types/src/portable-build.ts';
import type { PortableFact, PortableReadEntry, PortableRows, QueryPlan, QuerySubject, SlotSubject, StepAnchor } from '../../../../../../types/src/portable-read.ts';
import { pinnedGapsOf, syntaxOf, type B, type Built, type Expression, type Operand, type Primary, type Statement } from './syntax.ts';

export interface PortableProjectInput {
	readonly grammar: string;
	readonly paths: readonly string[];
	readonly kinds: Readonly<Record<number, string>>;
	readonly table: PortableBuildTable;
	readonly rows: PortableRows;
	readonly entries: Readonly<Record<number, readonly (PortableReadEntry & { readonly refinedBy: readonly number[] })[]>>;
	readonly imports: { readonly kinds: string; readonly utils: string };
}

export interface PortableProjectOutput {
	readonly text: string;
	readonly unsupported: readonly string[];
}

const routesOf = (arm: PortableBuildArm): readonly PortableSlotRoute[] => (arm.readOnly === undefined ? arm.slots : [...arm.slots, ...arm.readOnly]);

const chainOf = (seat: PortableSeat): readonly PortableContainer[] => (seat.within ?? []).flatMap((container): PortableContainer[] => [...(container.through ?? []).map((key) => ({ key })), container]);

export function emitPortableProjection(builders: B, input: PortableProjectInput, pin: string): { readonly program: Built<B['program']>; readonly unsupported: readonly string[] } {
	const t = pinnedGapsOf(builders, pin);
	const { table, rows } = input;
	const unsupported: string[] = [];
	const syntax = syntaxOf(t);
	const { id, dot, call, str, num, binary, paren, not, ternary, ret, block, when, constant, lambda, obj } = syntax;
	const and = (parts: readonly Operand[]): Operand => syntax.and(parts) ?? t.true;
	const or = (parts: readonly Operand[]): Operand => syntax.or(parts) ?? t.false;
	type Parameter = readonly [string, string, boolean?];
	const parameterOf = ([name, type, optional]: Parameter) => (optional === true ? t.optionalParameter({ name, type: t.typeAnnotation(type) }) : t.requiredParameter({ name, type: t.typeAnnotation(type) }));
	const typed = (body: Built<B['statementBlock']> | Expression, first: Parameter, ...parameters: readonly Parameter[]) =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.formalParametersElements(parameterOf(first), ...parameters.map(parameterOf))), body });
	const kindRef = (kind: number): Primary => {
		const name = input.kinds[kind];
		if (name === undefined) throw new Error(`no kind name for ${kind}`);
		return dot(id('K'), name);
	};
	const kindSets = new Map<string, string>();
	const kindsOf = (kinds: readonly number[]) => {
		const sorted = [...new Set(kinds)].sort((a, b) => a - b);
		const signature = sorted.join(',');
		const name = kindSets.get(signature) ?? kindSets.set(signature, `KINDS${kindSets.size}`).get(signature)!;
		return id(name);
	};
	const kindSetDeclarations = () =>
		[...kindSets].map(([signature, name]) => constant(name, t.newExpression({ function: 'Set', arguments: t.arguments(t.array(...signature.split(',').map((kind) => num(Number(kind))))) })));
	const has = (kinds: readonly number[], value: Expression) => call(dot(kindsOf(kinds), 'has'), call(id('kindOf'), value));
	const isKind = (value: Primary, kind: number) => binary(dot(value, '$type'), '===', kindRef(kind));
	const anchored = (list: Expression, anchor: StepAnchor | undefined): Expression =>
		anchor === undefined ? list : anchor === 'only' ? call(id('only'), list) : call(dot(paren(list), 'slice'), ...(anchor === 'first' ? [num(0), num(1)] : [t.unaryExpression({ operator: '-', argument: num(1) })]));

	const slotEntry = (kind: number, number: number) => rows.querySlots[kind]?.find(([, n]) => n === number);
	const slotRead = (kind: number, number: number, value: Primary): Expression | undefined => {
		const entry = slotEntry(kind, number);
		if (entry === undefined) return undefined;
		const [accessor, , keyword, storage] = entry;
		const read = call(id('stored'), value, str(accessor), str(storage));
		return keyword === undefined ? read : ternary(binary(call(id('storedTrue'), value, str(accessor), str(storage)), '===', t.true), t.array(str(keyword)), t.array());
	};
	const slotItemsOf = (value: Primary, subject: SlotSubject): Expression => {
		const arms = Object.entries(subject.slots).flatMap(([kind, number]) => {
			const read = slotRead(Number(kind), number, value);
			return read === undefined ? [] : [[Number(kind), read] as const];
		});
		return arms.reduceRight<Expression>((rest, [kind, read]) => ternary(isKind(value, kind), read, rest), t.array());
	};
	let hoisted = new Map<string, readonly [string, Expression]>();
	const nodeSlotItems = (kind: number, subject: SlotSubject): Expression => {
		const number = subject.slots[kind];
		if (number === undefined) return t.array();
		const known = hoisted.get(`${number}`);
		if (known !== undefined) return id(known[0]);
		const read = slotRead(kind, number, id('node'));
		if (read === undefined) return t.array();
		const name = `slot${number}`;
		hoisted.set(`${number}`, [name, read]);
		return id(name);
	};
	type Reached = { readonly one: Primary; readonly kind?: number } | { readonly many: Expression };
	const subjectsOf = (reached: Reached, subject: QuerySubject): Expression => {
		if ('one' in reached) return 'self' in subject ? t.array(reached.one) : reached.kind === undefined ? slotItemsOf(reached.one, subject) : nodeSlotItems(reached.kind, subject);
		return 'self' in subject ? reached.many : call(dot(paren(reached.many), 'flatMap'), lambda(ternary(call(id('isNode'), id('x')), slotItemsOf(id('x'), subject), t.array()), 'x'));
	};
	const compilePlan = (plan: QueryPlan<QuerySubject>, reached: Reached, depth = 0): Operand => {
		const at = `c${depth}`;
		const self = 'one' in reached && 'self' in plan;
		switch (plan.op) {
			case 'eq':
				return self ? binary(call(id('textOf'), (reached as { readonly one: Primary }).one), '===', str(plan.text)) : call(dot(call(id('texts'), subjectsOf(reached, plan)), 'includes'), str(plan.text));
			case 'match':
				return call(dot(call(id('texts'), subjectsOf(reached, plan)), 'some'), lambda(call(dot(t.regex({ pattern: plan.pattern, flags: 'u' }), 'test'), id('text')), 'text'));
			case 'present':
				return binary(dot(call(id('texts'), subjectsOf(reached, plan)), 'length'), '>', num(0));
			case 'count':
				return binary(dot(paren(subjectsOf(reached, plan)), 'length'), '>=', num(plan.min));
			case 'is':
				return self ? has(plan.types, (reached as { readonly one: Primary }).one) : call(dot(paren(subjectsOf(reached, plan)), 'some'), lambda(has(plan.types, id('x')), 'x'));
			case 'child':
				return call(dot(paren(anchored(call(dot(paren(subjectsOf(reached, plan)), 'filter'), id('isNode')), plan.anchor)), 'some'), lambda(compilePlan(plan.of, { one: id(at) }, depth + 1), at));
			case 'not':
				return not(paren(compilePlan(plan.of, reached, depth)));
			case 'and':
				return and(plan.of.map((part) => paren(compilePlan(part, reached, depth))));
			case 'or':
				return paren(or(plan.of.map((part) => paren(compilePlan(part, reached, depth)))));
			case 'delimiter':
				unsupported.push('a delimiter plan');
				return t.false;
		}
	};

	const kindPaths = new Map<number, Set<string>>();
	for (const path of input.paths) for (const arm of table.paths[path]?.arms ?? []) (kindPaths.get(arm.kind) ?? kindPaths.set(arm.kind, new Set()).get(arm.kind)!).add(path);
	const projectedKinds = [...kindPaths.keys()].sort((a, b) => a - b);
	const fnName = (kind: number) => `read${input.kinds[kind]}`;

	const tokenTexts = (route: PortableSlotRoute): readonly (readonly [number, string])[] =>
		[...new Map(route.seats.flatMap((seat) => Object.entries(seat.tokens ?? {}).map(([text, kind]) => [kind, text] as const))).entries()].sort(([a], [b]) => a - b);
	const itemReaders = new Map<string, readonly [string, Expression]>();
	const itemReader = (route: PortableSlotRoute): Expression => {
		const tokens = tokenTexts(route);
		const leaf = route.seats.some((seat) => seat.leaf !== undefined || seat.text === true);
		if (!leaf && tokens.length === 0 && route.seats.every((seat) => seat.kinds.length === 0)) unsupported.push(`${route.name}: a seat with no kinds and no leaf`);
		if (tokens.length === 0) return id('project');
		const signature = JSON.stringify(tokens);
		const known = itemReaders.get(signature);
		if (known !== undefined) return id(known[0]);
		const name = `items${itemReaders.size}`;
		const number = when(binary(t.unaryExpression({ operator: 'typeof', argument: id('item') }), '===', str('number')), t.switchStatement({ value: paren(id('item')), body: t.switchBody(...tokens.map(([kind, text]) => t.switchCase({ value: kindRef(kind), bodies: [ret(str(text))] }))) }));
		itemReaders.set(signature, [name, typed(block(number, ret(call(id('project'), id('item'), id('container')))), ['item', 'unknown'], ['container', 'Node', true])]);
		return id(name);
	};

	const holds = (seat: PortableSeat, value: Primary): Operand => {
		if (seat.refined !== undefined && seat.refined.length > 0) unsupported.push(`a refined seat (${seat.refined.map((kind) => input.kinds[kind]).join(', ')})`);
		if (seat.kinds.length === 0) return seat.leaf === undefined ? t.false : binary(call(id('textOf'), value), '!==', id('undefined'));
		return has(seat.kinds, value);
	};
	interface Pending {
		readonly seat: number;
		readonly containers: readonly PortableContainer[];
	}
	const resolvers = new Map<string, string>();
	const seatSignature = (seat: PortableSeat) => [[...seat.kinds].sort((a, b) => a - b), seat.leaf !== undefined, seat.many === true, seat.refined ?? []];
	const resolverOf = (route: PortableSlotRoute, functions: Statement[]): string => {
		const named = (pending: readonly Pending[]): string => {
			const signature = JSON.stringify(pending.map(({ seat, containers }) => [seatSignature(route.seats[seat]!), containers.map((container) => [container.key, container.builder !== undefined])]));
			const known = resolvers.get(signature);
			if (known !== undefined) return known;
			const name = `seats${resolvers.size}`;
			resolvers.set(signature, name);
			const direct = pending.filter(({ containers }) => containers.length === 0);
			const statements: Statement[] = [
				when(call(dot(id('Array'), 'isArray'), id('value')), ret(call(id('joined'), call(dot(id('value'), 'map'), lambda(binary(call(id(name), id('item')), '??', obj([['found', id('item')], ['many', t.false]])), 'item'))))),
				...direct.map(({ seat }) => when(holds(route.seats[seat]!, id('value')), ret(call(id('seated'), id('value'), id('holder'), route.seats[seat]!.many === true ? t.true : t.false))))
			];
			const keys = [...new Set(pending.flatMap(({ containers }) => (containers.length === 0 ? [] : [containers[0]!.key])))];
			if (keys.length > 0) statements.push(when(not(call(id('isNode'), id('value'))), ret(id('undefined'))));
			for (const k of keys) {
				const advanced = pending.flatMap(({ seat, containers }) => {
					if (containers[0]?.key !== k) return [];
					const rest = containers.slice(1);
					return rest[0]?.builder !== undefined ? [{ seat, containers: rest }, { seat, containers: rest.slice(1) }] : [{ seat, containers: rest }];
				});
				const single = pending.flatMap(({ seat, containers }) => (containers[0]?.key !== k ? [] : [{ seat, containers: containers.slice(1) }]));
				const next = `next_${k}`;
				statements.push(
					constant(next, call(id('slotOf'), id('value'), str(k))),
					when(
						binary(binary(id(next), '!==', id('undefined')), '&&', binary(id(next), '!==', t.null)),
						block(
							constant(
								`found_${k}`,
								ternary(call(dot(id('Array'), 'isArray'), id(next)), call(id(named(advanced)), id(next), id('value')), call(id(named(single)), id(next), id('value')))
							),
							when(binary(id(`found_${k}`), '!==', id('undefined')), ret(ternary(call(dot(id('Array'), 'isArray'), id(next)), obj([t.spreadElement(id(`found_${k}`)), ['many', t.true]]), id(`found_${k}`))))
						)
					)
				);
			}
			statements.push(ret(id('undefined')));
			functions.push(constant(name, typed(block(...statements), ['value', 'unknown'], ['holder', 'unknown', true])));
			return name;
		};
		return named(route.seats.flatMap((seat, i) => {
			const within = chainOf(seat);
			return within[0]?.builder === undefined ? [{ seat: i, containers: within }] : [{ seat: i, containers: within }, { seat: i, containers: within.slice(1) }];
		}));
	};

	const walkOf = (route: PortableSlotRoute): Statement[] => {
		const statements: Statement[] = [];
		let at = 'node';
		let skippable: string | undefined;
		route.steps.forEach((step, i) => {
			const read = step.stored === undefined ? lambda(call(id('slotOf'), id('n'), str(step.key)), 'n') : lambda(call(id('storedSlotRead'), id('n'), str(step.key), str(step.stored)), 'n');
			const next = `s${i}`;
			const reached = call(id('step'), id(at), read, step.kinds === undefined ? id('undefined') : kindsOf(step.kinds));
			statements.push(constant(next, skippable === undefined ? reached : ternary(call(dot(id('Array'), 'isArray'), id(skippable)), id(skippable), reached)));
			skippable = step.builder === undefined ? undefined : next;
			at = next;
		});
		statements.push(constant('walked', id(at)));
		return statements;
	};

	const routes = new Map<string, string>();
	const routeFunction = (route: PortableSlotRoute, functions: Statement[]): string => {
		const resolver = resolverOf(route, functions);
		const signature = JSON.stringify([resolver, route.steps.map((step) => [step.key, step.stored ?? null, step.kinds ?? null, step.builder !== undefined]), route.reads ?? null, route.list ?? null, route.multiple ?? null, route.emptyContainer === true]);
		const known = routes.get(signature);
		if (known !== undefined) return known;
		const name = `route${routes.size}`;
		routes.set(signature, name);
		const listed = route.list ?? route.multiple;
		const reads = route.reads === undefined ? undefined : kindsOf(route.reads);
		const body = block(
			...walkOf(route),
			constant('slotted', reads === undefined ? id('walked') : ternary(call(dot(id('Array'), 'isArray'), id('walked')), call(dot(id('walked'), 'filter'), lambda(call(dot(reads, 'has'), call(id('kindOf'), id('x'))), 'x')), ternary(call(dot(reads, 'has'), call(id('kindOf'), id('walked'))), id('walked'), id('undefined')))),
			...(route.emptyContainer === true ? [when(binary(call(dot(id('Array'), 'isArray'), id('slotted')), '&&', binary(dot(id('slotted'), 'length'), '===', num(0))), ret(obj([['value', t.array()], ['fitted', t.true]])))] : []),
			when(not(call(id('present'), id('slotted'))), ret(id('undefined'))),
			constant('resolved', binary(call(id(resolver), id('slotted')), '??', obj([['found', id('slotted')], ['many', t.false], ['fitted', t.false]]))),
			when(binary(dot(id('resolved'), 'found'), '===', id('undefined')), ret(id('undefined'))),
			...(route.list === false
				? [
						when(
							call(dot(id('Array'), 'isArray'), dot(id('resolved'), 'found')),
							ret(ternary(binary(dot(dot(id('resolved'), 'found'), 'length'), '===', num(0)), id('undefined'), obj([['value', t.subscriptExpression({ object: dot(id('resolved'), 'found'), index: num(0) })], ['fitted', binary(dot(id('resolved'), 'fitted'), '!==', t.false)]])))
						)
					]
				: []),
			ret(
				obj([
					[
						'value',
						ternary(
							not(call(dot(id('Array'), 'isArray'), dot(id('resolved'), 'found'))),
							listed ? t.array(dot(id('resolved'), 'found')) : dot(id('resolved'), 'found'),
							listed ? dot(id('resolved'), 'found') : ternary(or([binary(dot(dot(id('resolved'), 'found'), 'length'), '===', num(0)), dot(id('resolved'), 'many')]), dot(id('resolved'), 'found'), t.subscriptExpression({ object: dot(id('resolved'), 'found'), index: num(0) }))
						)
					],
					['fitted', binary(dot(id('resolved'), 'fitted'), '!==', t.false)]
				])
			)
		);
		functions.push(constant(name, typed(body, ['node', 'Node'])));
		return name;
	};

	const factCode = (kind: number, facts: readonly PortableFact[]): Statement[] => {
		const byContainer = new Map<number, PortableFact[]>();
		for (const fact of facts) (byContainer.get(fact.container) ?? byContainer.set(fact.container, []).get(fact.container)!).push(fact);
		const statements: Statement[] = [];
		for (const [container, held] of [...byContainer].sort(([a], [b]) => a - b)) {
			const inner: Statement[] = [constant('items', slotRead(container, held[0]!.items.slots[container] ?? -1, id('container')) ?? t.array()), constant('taken', t.newExpression({ function: 'Set', arguments: t.arguments() }))];
			for (const fact of held) {
				if (fact.same !== undefined) {
					unsupported.push(`${input.kinds[kind]}: fact ${fact.name} compares texts (same)`);
					continue;
				}
				const test = lambda(and([not(call(dot(id('taken'), 'has'), id('i'))), call(id('isNode'), id('item')), paren(compilePlan(fact.test, { one: id('item') }))]), 'item', 'i');
				const spelled = fact.spelled === undefined ? id('undefined') : call(id('one'), call(id('texts'), slotItemsOf(t.subscriptExpression({ object: id('items'), index: id('index') }) as Primary, fact.spelled)));
				const record = call(
					id('place'),
					id('placed'),
					id('taken'),
					id('items'),
					str(fact.name),
					str(fact.slot),
					test,
					lambda(spelled, 'index'),
					fact.path === undefined ? id('undefined') : str(fact.path),
					fact.flag === undefined ? id('undefined') : str(fact.flag)
				);
				inner.push(fact.own === undefined ? t.expressionStatement(record) : when(compilePlan(fact.own, { one: id('node'), kind }), t.expressionStatement(record)));
			}
			statements.push(when(binary(binary(id('container'), '!==', id('undefined')), '&&', isKind(id('container'), container)), block(...inner)));
		}
		return statements;
	};

	const entryTest = (kind: number, entry: PortableReadEntry): Operand => {
		if (entry.within.length > 0 || entry.test.some((condition) => condition.up > 0)) unsupported.push(`${entry.path}: a test on an enclosing node`);
		return and(
			entry.test.map((condition) => {
				const reached = condition.via.reduce<Expression | undefined>((at, step) => anchored(at === undefined ? nodeSlotItems(kind, step) : call(dot(paren(at), 'flatMap'), lambda(ternary(call(id('isNode'), id('x')), slotItemsOf(id('x'), step), t.array()), 'x')), step.anchor), undefined);
				return paren(compilePlan(condition.plan, reached === undefined ? { one: id('node'), kind } : { many: reached }));
			})
		);
	};

	const integerArm = (arm: PortableBuildArm): Expression => {
		if (arm.numeric !== undefined) unsupported.push(`${input.kinds[arm.kind]}: a number read from its slots`);
		if (arm.scalar === 'float') return call(id('floatOf'), id('text'));
		if (arm.digits === undefined) return id('undefined');
		return call(id('integerOf'), call(id('integerValue'), num(arm.digits.base), str(arm.digits.affix), id('text')), arm.scalar === 'bigint' ? t.true : t.false);
	};

	const pathCase = (kind: number, path: string, functions: Statement[]): Statement[] => {
		const arms = (table.paths[path]?.arms ?? []).filter((arm) => arm.kind === kind);
		if (arms.some((arm) => arm.presets.length > 0)) unsupported.push(`${path}: presets are not checked`);
		const literal = arms.find((arm) => arm.literal !== undefined)?.literal;
		if (literal !== undefined) return [ret(obj([['$path', str(path)], ...(literal.value === undefined ? [] : [['$value', typeof literal.value === 'string' ? str(literal.value) : literal.value ? t.true : t.false] as const])]))];
		if (arms.every((arm) => arm.carriesNode === true)) return [ret(call(id('other'), id('node'), id('container')))];
		const scalar = arms.find((arm) => arm.scalar !== undefined);
		if (scalar !== undefined) {
			if (scalar.slots.length > 0) unsupported.push(`${path}: a number with slots beside its value`);
			return [constant('text', call(id('textOf'), id('node'))), constant('value', ternary(binary(id('text'), '===', id('undefined')), id('undefined'), integerArm(scalar))), ret(ternary(binary(id('value'), '===', id('undefined')), call(id('other'), id('node'), id('container')), obj([['$path', str(path)], ['$value', id('value')]])))];
		}
		if (arms.some((arm) => arm.content !== undefined)) unsupported.push(`${path}: a content arm`);
		const statements: Statement[] = [];
		const readable = [...new Set(arms.flatMap((arm) => arm.readableFlags ?? []))];
		const plans = rows.flags[kind] ?? {};
		const holdsFlag = (flag: string): Operand | undefined => {
			const plan = plans[flag];
			return plan === undefined || plan === null ? undefined : paren(compilePlan(plan, { one: id('node'), kind }));
		};
		const unreadable = Object.keys(plans).filter((flag) => !readable.includes(flag)).sort();
		const refused: Operand[] = [
			...unreadable.flatMap((flag): Operand[] => {
				const test = holdsFlag(flag);
				return test === undefined ? [] : [test];
			}),
			call(dot(id('placed'), 'some'), lambda(and([binary(dot(id('p'), 'flag'), '!==', id('undefined')), not(call(dot(t.array(...readable.map(str)), 'includes'), dot(id('p'), 'flag')))]), 'p'))
		];
		statements.push(when(or(refused), ret(call(id('other'), id('node'), id('container')))));
		const flagTests = readable.flatMap((flag) => {
			const test = holdsFlag(flag);
			return test === undefined ? [] : [ternary(test, t.array(str(flag)), t.array())];
		});
		statements.push(
			constant(
				'flags',
				call(
					dot(t.array(...flagTests.map((test) => t.spreadElement(test)), t.spreadElement(call(dot(id('placed'), 'flatMap'), lambda(ternary(binary(dot(id('p'), 'flag'), '===', id('undefined')), t.array(), t.array(dot(id('p'), 'flag'))), 'p')))), 'filter'),
					lambda(binary(call(dot(id('self'), 'indexOf'), id('flag')), '===', id('i')), 'flag', 'i', 'self')
				)
			)
		);
		statements.push(
			t.lexicalDeclaration({
				kind: 'const',
				declarators: [
					t.variableDeclaratorPlain({
						name: 'structure',
						type: t.typeAnnotation(t.genericType({ name: 'Record', typeArguments: t.typeArguments('string', 'unknown') })),
						value: obj([
							['$path', str(path)],
							t.spreadElement(paren(ternary(binary(dot(id('flags'), 'length'), '===', num(0)), obj([]), obj([['$flags', id('flags')]])))),
							t.spreadElement(paren(ternary(binary(dot(id('placed'), 'length'), '===', num(0)), obj([]), obj([['$at', call(id('atOf'), id('placed'))]]))))
						])
					})
				]
			})
		);
		const byName = new Map<string, string[]>();
		for (const arm of arms) for (const route of routesOf(arm)) (byName.get(route.name) ?? byName.set(route.name, []).get(route.name)!).push(routeFunction(route, functions));
		for (const [name, routes] of byName) {
			const allRoutes = arms.flatMap(routesOf).filter((route) => route.name === name);
			if (allRoutes.some((route) => (route.requires ?? []).length > 0)) unsupported.push(`${path}.${name}: a route that requires another slot`);
			const reader = itemReader(allRoutes[0]!);
			statements.push(
				constant(`${name}$`, call(id('pick'), t.array(...routes.map((route) => call(id(route), id('node')))))),
				when(binary(id(`${name}$`), '!==', id('undefined')), t.expressionStatement(t.assignmentExpression({ left: t.subscriptExpression({ object: id('structure'), index: str(name) }), right: call(id('readValue'), dot(id(`${name}$`), 'value'), reader) })))
			);
		}
		const held = heldRoutes.get(kind) ?? [];
		for (const route of held) {
			const name = routeFunction(route, functions);
			const fact = (rows.table.facts?.[kind] ?? []).some((candidate) => candidate.slot === route.name);
			statements.push(
				when(
					binary(binary(id('container'), '!==', id('undefined')), '&&', binary(t.subscriptExpression({ object: id('structure'), index: str(route.name) }), '===', id('undefined'))),
					block(
						constant('found', call(id(name), id('container'))),
						when(
							binary(id('found'), '!==', id('undefined')),
							t.expressionStatement(
								t.assignmentExpression({
									left: t.subscriptExpression({ object: id('structure'), index: str(route.name) }),
									right: call(id('readValue'), fact ? call(id('untaken'), dot(id('found'), 'value'), id('placed'), str(route.name)) : dot(id('found'), 'value'), itemReader(route))
								})
							)
						)
					)
				)
			);
		}
		const emptied = new Set<string>();
		for (const route of arms.flatMap(routesOf)) if ((route.list ?? route.multiple) && route.emptyContainer !== true && !emptied.has(route.name) && emptied.add(route.name)) statements.push(when(binary(t.subscriptExpression({ object: id('structure'), index: str(route.name) }), '===', id('undefined')), t.expressionStatement(t.assignmentExpression({ left: t.subscriptExpression({ object: id('structure'), index: str(route.name) }), right: t.array() }))));
		for (const test of arms.flatMap((arm) => arm.when)) if ('empty' in test) for (const name of test.empty) if (!emptied.has(name) && emptied.add(name)) statements.push(when(binary(t.subscriptExpression({ object: id('structure'), index: str(name) }), '===', id('undefined')), t.expressionStatement(t.assignmentExpression({ left: t.subscriptExpression({ object: id('structure'), index: str(name) }), right: t.array() }))));
		statements.push(ret(id('structure')));
		return statements;
	};

	const heldRoutes = new Map<number, PortableSlotRoute[]>();
	for (const path of Object.values(table.paths))
		for (const arm of path.arms)
			for (const route of routesOf(arm))
				for (const seat of route.seats)
					for (const container of seat.within ?? [])
						for (const slot of container.slots ?? [])
							for (const kind of seat.kinds)
								if (kindPaths.has(kind)) {
									const list = heldRoutes.get(kind) ?? heldRoutes.set(kind, []).get(kind)!;
									if (!list.some((known) => known.name === slot.name)) list.push(slot);
								}

	const functions: Statement[] = [];
	const kindFunctions: Statement[] = [];
	for (const kind of projectedKinds) {
		hoisted = new Map();
		const entries = input.entries[kind] ?? [];
		const statements: Statement[] = [constant('placed', t.array()), ...factCode(kind, rows.table.facts?.[kind] ?? [])];
		entries.forEach((entry, i) => {
			if (entry.test.length > 0) statements.push(constant(`e${i}`, entryTest(kind, entry)));
		});
		const holding = (i: number): Operand => (entries[i]!.test.length === 0 ? t.true : id(`e${i}`));
		const chosen = entries.map((entry, i) => and([...(entry.test.length === 0 ? [] : [holding(i)]), ...entry.refinedBy.map((j) => not(holding(j)))]));
		const last = entries.findIndex((entry, i) => entry.test.length === 0 && entry.refinedBy.every((j) => entries[j]!.test.length > 0) && i === entries.length - 1);
		const chain = entries.reduceRight<Expression>((rest, entry, i) => (i === last && entry.refinedBy.length === 0 ? str(entry.path) : ternary(chosen[i]!, str(entry.path), rest)), id('undefined'));
		statements.push(constant('path', binary(call(id('placedPath'), id('placed')), '??', paren(chain))));
		const cases = [...kindPaths.get(kind)!].sort().map((path) => t.switchCase({ value: str(path), bodies: [block(...pathCase(kind, path, functions))] }));
		statements.push(t.switchStatement({ value: paren(id('path')), body: t.switchBody(...cases) }), ret(call(id('other'), id('node'), id('container'))));
		kindFunctions.push(constant(fnName(kind), typed(block(...[...hoisted.values()].map(([name, read]) => constant(name, read)), ...statements), ['node', 'Node'], ['container', 'Node', true])));
	}

	const project = constant(
		'project',
		typed(
			block(
				t.switchStatement({
					value: paren(dot(id('node'), '$type')),
					body: t.switchBody(...projectedKinds.map((kind) => t.switchCase({ value: kindRef(kind), bodies: [ret(call(id(fnName(kind)), id('node'), id('container')))] })), t.switchDefault({ bodies: [ret(call(id('other'), id('node'), id('container')))] }))
				})
			),
			['node', 'Node'],
			['container', 'Node', true]
		)
	);
	const factory = t.exportStatementDefaultDeclaration({
		content: t.functionDeclaration({
			name: 'projection',
			parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'other', type: t.typeAnnotation('Other') }))),
			returnType: t.typeAnnotation(t.functionType({ parameters: t.formalParameters(t.formalParametersElements(t.requiredParameter({ name: 'node', type: t.typeAnnotation('Node') }), t.optionalParameter({ name: 'container', type: t.typeAnnotation('Node') }))), returnType: 'unknown' })),
			body: block(...kindSetDeclarations(), ...[...itemReaders.values()].map(([name, reader]) => constant(name, reader)), ...functions, ...kindFunctions, project, ret(id('project')))
		})
	});
	const header = t.comment.line(' Auto-generated by @sittir/codegen — do not edit');
	const program = t.program({
		statements: [
			t.importStatement.clauseFrom({ importClause: t.importClause(t.namedImports(t.importSpecifier.as({ name: 'TSKindId', alias: 'K' }))), source: str(input.imports.kinds) }).$trivia.leading(header),
			t.importStatement.clauseFrom({
				importClause: t.importClause(
					t.namedImports(...['atOf', 'floatOf', 'integerOf', 'integerValue', 'isNode', 'joined', 'kindOf', 'one', 'only', 'pick', 'place', 'placedPath', 'present', 'readValue', 'seated', 'slotOf', 'step', 'stored', 'storedSlotRead', 'storedTrue', 'textOf', 'texts', 'untaken'].map((name) => t.importSpecifier.name({ name })))
				),
				source: str(input.imports.utils)
			}),
			t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: t.importClause(t.namedImports(t.importSpecifier.name({ name: 'Node' }), t.importSpecifier.name({ name: 'Other' }))), source: str(input.imports.utils) }),
			factory
		]
	});
	return { program, unsupported: [...new Set(unsupported)] };
}

export async function emitPortableProjectionInProcess(input: PortableProjectInput): Promise<PortableProjectOutput> {
	const pinned = await loadPinnedBuild();
	using engine = await pinned.common.createEngine(pinned.typescript.default);
	const { program, unsupported } = emitPortableProjection(engine.build, input, readPin());
	return { text: String(engine.render(program)), unsupported };
}

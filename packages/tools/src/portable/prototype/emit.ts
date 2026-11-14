import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
	PortableBuildArm,
	PortableBuildTable,
	PortableContainer,
	PortableDecimalParts,
	PortableMemberStep,
	PortablePickTest,
	PortableSeat,
	PortableSpelledFact
} from '@sittir/types';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { loadPinnedBuild } from '../../../../codegen/src/bootstrap/pinned.ts';

export interface PrototypeGrammar {
	readonly name: string;
	readonly api: string;
	readonly map: string;
	readonly table: PortableBuildTable;
	readonly paths: readonly string[];
	readonly presets?: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
}

export interface PrototypeResult {
	readonly text: string;
	readonly diagnostics: readonly string[];
	readonly milliseconds: number;
	readonly functions: number;
}

type Node = unknown;

interface Fitting {
	readonly arm: PortableBuildArm;
	readonly seats: readonly PortableSeat[];
}

const identifierOf = (path: string): string => path.replace(/\./g, '_');

export async function emitPrototype(grammar: PrototypeGrammar): Promise<PrototypeResult> {
	const started = performance.now();
	const pinned = await loadPinnedBuild();
	const engine = await pinned.common.createEngine(pinned.typescript.default, { nodeStorage: 'object' } as never);
	const t = engine.build as unknown as Record<string, any>;
	const diagnostics = new Set<string>();
	const gap = (message: string) => diagnostics.add(`${grammar.name}: ${message}`);
	const { table } = grammar;
	const included = new Set(grammar.paths);

	const id = (name: string): Node => t.identifier(name);
	const dot = (object: Node, property: string): Node => t.memberExpression({ object, operator: '.', property });
	const builderRef = (builder: string): Node => builder.split('.').reduce<Node>((object, property) => dot(object, property), id('b'));
	const call = (callee: Node, ...args: Node[]): Node => t.callExpressionCall({ function: callee, arguments: t.arguments(...args) });
	const str = (text: string): Node => t.stringSingle(text);
	const num = (value: number): Node => t.number.decimal(String(value));
	const key = (name: string): Node => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : str(name));
	const obj = (entries: readonly (readonly [string, Node])[]): Node => t.object(...entries.map(([name, value]) => t.pair({ key: key(name), value })));
	const binary = (left: Node, operator: string, right: Node): Node => t.binaryExpression({ left, operator, right });
	const and = (parts: readonly Node[]): Node | undefined => (parts.length === 0 ? undefined : parts.reduce((left, right) => binary(left, '&&', right)));
	const paren = (value: Node): Node => t.parenthesizedExpression.sequence(value);
	const typeIs = (value: Node, name: string): Node => binary(t.unaryExpression({ operator: 'typeof', argument: value }), '===', str(name));
	const ternary = (condition: Node, consequence: Node, alternative: Node): Node => t.ternaryExpression({ condition, consequence, alternative });
	const ret = (value?: Node): Node => t.returnStatement(value);
	const block = (...statements: Node[]): Node => t.statementBlock(...statements);
	const when = (condition: Node, consequence: Node): Node => t.ifStatement({ condition: paren(condition), consequence });
	const fail = (message: Node): Node => t.throwStatement(t.newExpression({ function: 'Error', arguments: t.arguments(message) }));
	const constant = (name: Node, value: Node): Node => t.lexicalDeclaration({ kind: 'const', declarators: [t.variableDeclaratorPlain({ name, value })] });
	const typeRef = (name: string, ...args: Node[]): Node => t.genericType({ name, typeArguments: t.typeArguments(...args) });
	const pathType = (path: string): Node => typeRef('BuildInput', grammar.map, t.literalType(str(path)));
	const itemType = (path: string, member: string): Node => typeRef('BuildItem', grammar.map, t.literalType(str(path)), t.literalType(str(member)));
	const arrow = (name: string, type: Node, body: Node): Node =>
		t.arrowFunction.callSignature({ parameters: t.formalParameters(t.requiredParameter({ name, type: t.typeAnnotation(type) })), body });
	const listOf = (value: Node): Node => paren(binary(value, '??', t.array()));
	const flagged = (input: Node, flag: string): Node => call(dot(listOf(dot(input, '$flags')), 'includes'), str(flag));

	const shapeOf = (builder: string) => table.builders[builder];
	const armsOf = (path: string): readonly PortableBuildArm[] => table.paths[path]?.arms ?? [];
	const armFunctions = new Map<string, Node>();
	const standsAlone = (path: string): boolean => {
		const row = table.paths[path];
		return row !== undefined && row.root && row.arms.length === 1 && (row.arms[0]!.facts ?? []).length === 0;
	};
	const armName = (path: string, arm: PortableBuildArm): string => {
		const name = standsAlone(path) ? identifierOf(path) : `${identifierOf(path)}$${arm.kind}`;
		if (!armFunctions.has(name)) {
			armFunctions.set(name, undefined);
			armFunctions.set(name, constant(name, arrow('input', pathType(path), block(...armBody(path, arm, id('input'))))));
		}
		return name;
	};
	const seatOf = (arm: PortableBuildArm, seats: readonly PortableSeat[]): readonly PortableSeat[] =>
		seats.filter((seat) => (arm.holders === undefined || arm.holders.some(([holder, slot]) => holder === seat.at[0] && slot === seat.at[1])) && seat.kinds.includes(arm.kind));
	const fittingOf = (path: string, seats: readonly PortableSeat[]): readonly Fitting[] =>
		armsOf(path).flatMap((arm) => {
			const fitting = seatOf(arm, seats);
			return fitting.length === 0 ? [] : [{ arm, seats: fitting }];
		});
	const owns = (seat: PortableSeat, member: string): boolean => (seat.within ?? []).some((step) => (step.members ?? []).some((inner) => inner.name === member));

	const placeOne = (step: PortableContainer, inner: Node, facts?: { readonly member: string; readonly items: Node }): Node => {
		if (step.builder === undefined) {
			gap(`a container step at ${step.key} has no builder of its own (a mounted step), which the prototype does not compile`);
			return inner;
		}
		const shape = shapeOf(step.builder);
		const owned = facts !== undefined && (step.members ?? []).some((member) => member.name === facts.member);
		if (shape === 'config') return call(builderRef(step.builder), obj(owned ? [[step.key, inner], [facts!.member, facts!.items]] : [[step.key, inner]]));
		if (owned) gap(`${step.builder} owns ${facts!.member} but takes no config`);
		if (shape === 'forwarded' || shape === 'direct' || shape === 'spread' || shape === 'elements') return call(builderRef(step.builder), inner);
		gap(`${step.builder} has call shape ${shape}, which a container step does not take`);
		return call(builderRef(step.builder), inner);
	};
	const wrapOne = (within: readonly PortableContainer[] | undefined, value: Node, facts?: { readonly member: string; readonly items: Node }): Node =>
		[...(within ?? [])].reverse().reduce((inner, step) => placeOne(step, inner, facts), value);
	const wrapList = (within: readonly PortableContainer[], items: Node | readonly Node[]): Node => {
		const inner = within.at(-1)!;
		const shape = inner.builder === undefined ? undefined : shapeOf(inner.builder);
		const listed = Array.isArray(items);
		let value: Node;
		if (inner.builder === undefined) {
			gap(`a list container at ${inner.key} has no builder of its own, which the prototype does not compile`);
			value = listed ? t.array(...items) : items;
		} else if (shape === 'spread' || shape === 'elements') value = listed ? call(builderRef(inner.builder), ...items) : call(builderRef(inner.builder), t.spreadElement(items));
		else if (shape === 'config') value = call(builderRef(inner.builder), obj([[inner.key, listed ? t.array(...items) : items]]));
		else {
			gap(`list container ${inner.builder} has call shape ${shape}`);
			value = call(builderRef(inner.builder), items);
		}
		return wrapOne(within.slice(0, -1), value);
	};

	const factsItems = (arm: PortableBuildArm, input: Node): { readonly member: string; readonly items: Node } | undefined => {
		const facts: readonly PortableSpelledFact[] = arm.facts ?? [];
		if (facts.length === 0) return undefined;
		const member = facts[0]!.member;
		if (facts.some((fact) => fact.member !== member)) gap(`${identifierOf(String(arm.kind))}: facts spelled in more than one container member`);
		const items = facts.flatMap((fact) => {
			if (fact.spellings.length > 1) gap(`fact ${fact.name} has ${fact.spellings.length} spellings; the prototype writes the first and ignores $at`);
			const { item, holes } = fact.spellings[0]!;
			if (holes !== undefined) gap(`fact ${fact.name}'s spelling has holes, which the prototype does not compile`);
			if (!included.has(item.$path)) {
				gap(`fact ${fact.name} spells a ${item.$path}, which is not a prototype path`);
				return [];
			}
			const built = call(id(identifierOf(item.$path)), obj(Object.entries(item).map(([name, value]) => [name, str(String(value))])));
			return [fact.flag === undefined ? built : t.spreadElement(paren(ternary(flagged(input, fact.flag), t.array(built), t.array())))];
		});
		return { member, items: t.array(...items) };
	};

	const testOf = (test: PortablePickTest, input: Node, preset: ReadonlySet<string>): Node | undefined => {
		if ('absent' in test)
			return and([
				...test.required.filter((name) => !preset.has(name)).map((name) => binary(dot(input, name), '!==', id('undefined'))),
				...test.absent.map((name) => binary(dot(input, name), '===', id('undefined')))
			]);
		if ('empty' in test) return and(test.empty.map((name) => binary(dot(listOf(dot(input, name)), 'length'), '===', num(0))));
		if ('flag' in test) return test.set ? flagged(input, test.flag) : t.unaryExpression({ operator: '!', argument: flagged(input, test.flag) });
		if ('text' in test) return binary(dot(input, '$value'), '===', str(test.text));
		if ('boolean' in test) return binary(dot(input, '$value'), '===', test.boolean ? t.true : t.false);
		if ('variant' in test) return undefined;
		gap(`a pick by the kinds a member builds (${test.member}) is not compiled; the prototype takes the arm`);
		return undefined;
	};
	const pickOf = (path: string, arm: PortableBuildArm, input: Node): Node | undefined =>
		and(arm.when.flatMap((test) => testOf(test, input, new Set(Object.keys(grammar.presets?.[path] ?? {}))) ?? []));

	const coercers: Node[] = [];
	const coercerNames = new Set<string>();

	const stringPlacement = (member: PortableMemberStep, perItem: boolean, value: Node): Node | undefined => {
		const leaves = member.seats.filter((seat) => seat.leaf !== undefined || seat.text === true);
		const tokens = member.seats.flatMap((seat) => Object.entries(seat.tokens ?? {}));
		if (leaves.length === 0 && tokens.length === 0) return undefined;
		const leaf = leaves[0];
		if (new Set(leaves.map((seat) => `${seat.leaf}:${JSON.stringify(seat.within ?? [])}`)).size > 1)
			gap(`${member.name} has ${leaves.length} leaf seats; the prototype writes text into the first`);
		const leafValue = leaf === undefined ? undefined : leaf.leaf === undefined ? value : call(builderRef(leaf.leaf), value);
		const placed = leaf === undefined || leafValue === undefined ? undefined : perItem ? wrapOne(leaf.within, leafValue) : leafValue;
		if (tokens.length === 0) return placed === undefined ? undefined : ret(placed);
		const unique = [...new Map(tokens).entries()];
		return t.switchStatement({
			value: paren(value),
			body: t.switchBody(
				...unique.map(([text, kind]) => t.switchCase({ value: str(text), bodies: [ret(num(kind))] })),
				t.switchDefault({ bodies: [placed === undefined ? fail(binary(str(`${member.name} spells no text `), '+', value)) : ret(placed)] })
			)
		});
	};

	const structurePlacement = (path: string, member: PortableMemberStep, perItem: boolean, value: Node): Node[] => {
		const fitting = fittingOf(path, member.seats);
		const builds = table.paths[path]?.builds;
		if (builds !== undefined && table.paths[path]!.root) {
			const valued = fitting.filter(({ arm }) => arm.scalar !== undefined && builds[arm.scalar] === arm.kind);
			const withins = new Set(valued.map(({ seats }) => JSON.stringify(seats[0]!.within ?? [])));
			if (withins.size > 1) gap(`${path} builds its values in seats of ${member.name} that wrap differently`);
			const built = call(id(identifierOf(path)), value);
			return [ret(perItem && valued.length > 0 ? wrapOne(valued[0]!.seats[0]!.within, built) : built)];
		}
		const statements: Node[] = [];
		let settled = false;
		fitting.forEach(({ arm, seats }, i) => {
			if (settled) return;
			const built = call(id(armName(path, arm)), value);
			const facts = factsItems(arm, value);
			let placed: Node;
			if (!perItem) placed = ret(built);
			else if (facts === undefined) placed = ret(wrapOne(seats.find((seat) => !(arm.facts ?? []).some((fact) => owns(seat, fact.member)))?.within ?? seats[0]!.within, built));
			else {
				const holding = seats.find((seat) => owns(seat, facts.member));
				const bare = seats.find((seat) => !owns(seat, facts.member));
				if (holding === undefined) gap(`${path} sets facts in ${facts.member}, which no seat of ${member.name} holds`);
				const named = { member: facts.member, items: id(facts.member) };
				placed = block(
					constant(facts.member, facts.items),
					ret(
						bare === undefined
							? wrapOne(holding?.within, built, named)
							: holding === undefined
								? wrapOne(bare.within, built)
								: ternary(binary(dot(id(facts.member), 'length'), '===', num(0)), wrapOne(bare.within, built), wrapOne(holding.within, built, named))
					)
				);
			}
			const condition = i === fitting.length - 1 ? undefined : pickOf(path, arm, value);
			settled = condition === undefined;
			statements.push(condition === undefined ? placed : when(condition, placed));
		});
		return statements;
	};

	const coercerOf = (owner: string, arm: PortableBuildArm, member: PortableMemberStep, perItem: boolean): string => {
		const name = `${armName(owner, arm)}_${member.name}`;
		if (coercerNames.has(name)) return name;
		coercerNames.add(name);
		const value = id('value');
		const statements: Node[] = [];
		if (member.list === true || member.multiple) statements.push(when(binary(value, '===', t.null), ret(t.null)));
		const text = stringPlacement(member, perItem, value);
		if (text !== undefined) statements.push(when(typeIs(value, 'string'), text));
		statements.push(when(call(dot(id('engine'), 'isNode'), value), ret(value)));
		const admitted = [...included].filter((path) => fittingOf(path, member.seats).length > 0);
		const cases = admitted.map((path) => t.switchCase({ value: str(path), bodies: structurePlacement(path, member, perItem, value) }));
		cases.push(t.switchDefault({ bodies: [fail(binary(str(`${owner}.${member.name}: no generated builder for `), '+', dot(value, '$path')))] }));
		statements.push(t.switchStatement({ value: paren(dot(value, '$path')), body: t.switchBody(...cases) }));
		coercers.push(constant(name, arrow('value', itemType(owner, member.name), block(...statements))));
		return name;
	};

	const memberValue = (path: string, arm: PortableBuildArm, member: PortableMemberStep, input: Node): Node => {
		const given = dot(input, member.name);
		const optional = member.steps[0]?.optional === true;
		if (member.multiple) return call(dot(listOf(given), 'map'), id(coercerOf(path, arm, member, true)));
		if (member.list === true) {
			const list = member.seats.find((seat) => seat.many === true && (seat.within ?? []).length > 0);
			if (list === undefined) {
				gap(`${path}'s ${member.name} is a list with no list container seat`);
				return call(dot(listOf(given), 'map'), id(coercerOf(path, arm, member, true)));
			}
			const items = call(dot(listOf(given), 'map'), id(coercerOf(path, arm, member, false)));
			const open = list.within!.findIndex((step) => step.optional === true);
			if (open < 0) return wrapList(list.within!, items);
			const outer = list.within!.slice(0, open + 1);
			const empty = wrapOne(outer.slice(0, -1), call(builderRef(outer.at(-1)!.builder!)));
			return ternary(binary(dot(listOf(given), 'length'), '===', num(0)), empty, wrapList(list.within!, items));
		}
		const single = call(id(coercerOf(path, arm, member, true)), given);
		return optional ? ternary(binary(given, '===', id('undefined')), id('undefined'), single) : single;
	};

	const presetValue = (path: string, member: PortableMemberStep, items: readonly string[]): Node => {
		const seat = member.seats.find((candidate) => candidate.leaf !== undefined && candidate.many === true && (candidate.within ?? []).length > 0);
		if (seat === undefined) {
			gap(`${path}'s preset ${member.name} has no list leaf seat`);
			return t.array();
		}
		return wrapList(seat.within!, items.map((item) => call(builderRef(seat.leaf!), str(item))));
	};

	const numberBody = (path: string, arm: PortableBuildArm, input: Node): Node[] => {
		const value = dot(input, '$value');
		const callee = builderRef(arm.builder!);
		const numeric = arm.numeric;
		if (numeric === undefined || (Array.isArray(numeric) && shapeOf(arm.builder!) !== 'config')) return [ret(call(callee, value))];
		if (Array.isArray(numeric)) return [ret(call(callee, obj([[numeric.at(-1)!, value]])))];
		const parts = numeric as PortableDecimalParts;
		if (parts.exponent !== undefined) gap(`${path}: ${arm.builder} spells exponents, which the prototype does not compile (it writes integer and fraction only)`);
		const names = [parts.integer, parts.fraction].filter((part): part is string => part !== undefined);
		return [
			constant(t.arrayPattern(...names.map((name) => (name === parts.fraction ? t.assignmentPattern({ left: name, right: str('0') }) : name))), call(dot(call(id('String'), value), 'split'), str('.'))),
			ret(call(callee, obj(names.map((name) => [name, id(name)]))))
		];
	};

	const armBody = (path: string, arm: PortableBuildArm, input: Node): Node[] => {
		if (arm.builder === undefined) {
			gap(`${path}: arm ${arm.kind} builds through its holder (no builder of its own)`);
			return [fail(str(`${path} builds only in its holder`))];
		}
		if (arm.scalar !== undefined) return numberBody(path, arm, input);
		if (arm.template !== undefined) gap(`${path}: a template-spelled member (${arm.template.member}) is not compiled`);
		if (arm.sole !== undefined) gap(`${path}: a sole-item delimiter on ${arm.sole.member} is not compiled`);
		if (arm.mounted !== undefined) gap(`${path}: arm ${arm.kind} mounts into a holder, which is not compiled`);
		const presets = grammar.presets?.[path] ?? {};
		const entries: [string, Node][] = [];
		const seen = new Set<string>();
		for (const member of arm.members) {
			if (seen.has(member.name)) {
				gap(`${path}: ${member.name} has more than one route; the prototype compiles the first`);
				continue;
			}
			seen.add(member.name);
			if (member.steps.length !== 1) {
				gap(`${path}: ${member.name} reaches a ${member.steps.length}-step route, which is not compiled`);
				continue;
			}
			const preset = presets[member.name];
			entries.push([member.steps[0]!.key, preset === undefined ? memberValue(path, arm, member, input) : presetValue(path, member, preset)]);
		}
		for (const preset of arm.presets) {
			if (preset.steps.length !== 1 || (preset.kind === undefined && preset.text === undefined)) gap(`${path}: a preset that is not one keyword or text is not compiled`);
			else entries.push([preset.steps[0]!.key, preset.kind === undefined ? str(preset.text!) : num(preset.kind)]);
		}
		for (const [flag, step] of Object.entries(arm.flags)) {
			if (step.template !== undefined || step.delimiter !== undefined || (step.unset ?? []).length > 0) {
				gap(`${path}: flag ${flag} spells text, a delimiter or an unset preset, which is not compiled`);
				continue;
			}
			const keywords = new Map<string, number>();
			for (const preset of step.presets) {
				if (preset.steps.length !== 1 || preset.kind === undefined) gap(`${path}: flag ${flag}'s preset is not one keyword, which is not compiled`);
				else if (keywords.has(preset.steps[0]!.key) && keywords.get(preset.steps[0]!.key) !== preset.kind) gap(`${path}: flag ${flag} presets ${preset.steps[0]!.key} twice`);
				else keywords.set(preset.steps[0]!.key, preset.kind);
			}
			for (const slot of keywords.keys()) entries.push([slot, flagged(input, flag)]);
		}
		const shape = shapeOf(arm.builder);
		const callee = builderRef(arm.builder);
		if (shape === 'config') return [ret(call(callee, obj(entries)))];
		if (shape === 'constant' || shape === 'nullary') return [ret(call(callee))];
		if (entries.length > 1) gap(`${path}: ${arm.builder} (${shape}) takes one member but the arm has ${entries.length}`);
		if (shape === 'spread' || shape === 'elements') return [ret(entries.length === 0 ? call(callee) : call(callee, t.spreadElement(entries[0]![1])))];
		if (shape === 'forwarded' || shape === 'direct') return [ret(entries.length === 0 ? call(callee) : call(callee, entries[0]![1]))];
		gap(`${path}: ${arm.builder} has call shape ${shape}, which is not compiled`);
		return [fail(str(`${path} is not compiled`))];
	};

	const functions: Node[] = [];
	for (const path of included) {
		const row = table.paths[path];
		if (row === undefined) {
			gap(`${path} is not a path of this grammar`);
			continue;
		}
		if (!row.root) continue;
		const input = id('input');
		const roots = row.arms.filter((arm) => arm.holders === undefined);
		const placed = (arm: PortableBuildArm): Node[] => {
			const built = call(id(armName(path, arm)), input);
			const facts = factsItems(arm, input);
			if (facts === undefined) return [ret(built)];
			const holder = Object.values(table.paths)
				.flatMap((other) => other.arms.flatMap((candidate) => candidate.members.flatMap((member) => member.seats)))
				.find((seat) => seat.kinds.includes(arm.kind) && owns(seat, facts.member));
			if (holder === undefined) {
				gap(`${path} sets facts in ${facts.member}, which no container holds`);
				return [ret(built)];
			}
			const step = holder.within!.find((candidate) => (candidate.members ?? []).some((member) => member.name === facts.member))!;
			return [
				constant('node', built),
				constant(facts.member, facts.items),
				ret(ternary(binary(dot(id(facts.member), 'length'), '===', num(0)), id('node'), placeOne(step, id('node'), { member: facts.member, items: id(facts.member) })))
			];
		};
		if (standsAlone(path)) {
			armName(path, row.arms[0]!);
			continue;
		}
		const statements: Node[] = [];
		if (row.builds !== undefined) {
			const of = (scalar: 'bigint' | 'integer' | 'float') => roots.find((arm) => arm.scalar === scalar && row.builds![scalar] === arm.kind);
			const [bigint, integer, float] = [of('bigint'), of('integer'), of('float')];
			if (bigint !== undefined) statements.push(when(typeIs(dot(input, '$value'), 'bigint'), ret(call(id(armName(path, bigint)), input))));
			if (integer !== undefined && float !== undefined) statements.push(when(call(dot(id('Number'), 'isInteger'), dot(input, '$value')), ret(call(id(armName(path, integer)), input))));
			const last = float ?? integer ?? bigint;
			if (last !== undefined) statements.push(ret(call(id(armName(path, last)), input)));
		} else
			for (const [i, arm] of roots.entries()) {
				const condition = i === roots.length - 1 ? undefined : pickOf(path, arm, input);
				const body = placed(arm);
				if (condition === undefined) {
					statements.push(...body);
					break;
				}
				statements.push(when(condition, block(...body)));
			}
		functions.push(constant(identifierOf(path), arrow('input', pathType(path), block(...statements))));
	}

	interface Trie {
		path?: string;
		readonly children: Map<string, Trie>;
	}
	const root: Trie = { children: new Map() };
	for (const path of included) {
		if (table.paths[path]?.root !== true) continue;
		let node = root;
		for (const segment of path.split('.')) {
			let next = node.children.get(segment);
			if (next === undefined) node.children.set(segment, (next = { children: new Map() }));
			node = next;
		}
		node.path = path;
	}
	const surface = (node: Trie): Node => {
		const children = obj([...node.children].map(([segment, child]) => [segment, surface(child)]));
		if (node.path === undefined) return children;
		return node.children.size === 0 ? id(identifierOf(node.path)) : call(dot(id('Object'), 'assign'), id(identifierOf(node.path)), children);
	};

	const typeImport = (names: readonly string[], source: string): Node =>
		t.importStatement.clauseFrom({ typeKeyword: 'type', importClause: t.importClause(t.namedImports(...names.map((name) => t.importSpecifier.name({ name })))), source: str(source) });
	gap('the pinned builders attach no comment (a `$trivia` key is ignored), so the module has no generated-file header');
	const program = t.program({
		statements: [
			typeImport(['Engine'], '@sittir/types'),
			typeImport(['BuildInput', 'BuildItem'], '@sittir/types/vocabulary'),
			typeImport([grammar.api], '../api.js'),
			typeImport([grammar.map], './map.js'),
			t.exportStatementDefaultDeclaration({
				content: t.functionDeclaration({
					name: 'portableBuild',
					parameters: t.formalParameters(t.requiredParameter({ name: 'engine', type: t.typeAnnotation(typeRef('Engine', grammar.api)) })),
					body: block(constant('b', dot(id('engine'), 'build')), ...coercers, ...armFunctions.values(), ...functions, ret(surface(root)))
				})
			})
		]
	});
	const text = String(engine.render(program as never));
	return { text, diagnostics: [...diagnostics], milliseconds: performance.now() - started, functions: functions.length + coercers.length + armFunctions.size };
}

export function writePrototype(grammar: string, text: string): string {
	const file = join(REPO_ROOT, 'packages', grammar, 'src', 'portable', 'prototype.ts');
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, text);
	return file;
}

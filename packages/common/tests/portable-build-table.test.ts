import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PortableBuildArm, PortableBuildTable } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { portableBuilder } from '../src/portable/build.ts';
import { Delimiter } from '../src/utils.ts';
import python from '@sittir/python';
import rust from '@sittir/rust';
import typescript from '@sittir/typescript';

const languages = { rust, python, typescript } as const;

const tables = Object.fromEntries(
	await Promise.all(
		Object.entries(languages).map(async ([name, language]) => {
			const hooks = await language.load();
			return [name, { table: await hooks.portableBuild!(), strict: await hooks.tables.strict() }] as const;
		})
	)
) as Record<keyof typeof languages, { readonly table: PortableBuildTable; readonly strict: object }>;

const armsOf = (grammar: keyof typeof languages, path: string): readonly PortableBuildArm[] => tables[grammar].table.paths[path]!.arms;
const armOf = (grammar: keyof typeof languages, path: string, kind: number): PortableBuildArm => armsOf(grammar, path).find((arm) => arm.kind === kind)!;

describe('the portable build table', () => {
	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: every builder an arm, step, preset, seat or container names is a strict builder, with its call shape', (grammar) => {
		const { table, strict } = tables[grammar];
		const named = new Set<string>();
		for (const { arms } of Object.values(table.paths))
			for (const arm of arms) {
				const presets = [...arm.presets, ...Object.values(arm.flags).flatMap((flag) => [...flag.presets, ...(flag.unset ?? [])])];
				const seats = arm.members.flatMap((member) => member.seats);
				const builders = [
					arm.builder,
					...[...arm.members.flatMap((member) => member.steps), ...presets.flatMap((preset) => preset.steps)].map((step) => step.builder),
					...presets.map((preset) => preset.builder),
					...seats.map((seat) => seat.leaf),
					...seats.flatMap((seat) => seat.within ?? []).map((container) => container.builder)
				];
				for (const builder of builders) if (builder !== undefined) named.add(builder);
			}
		for (const key of named) {
			const builder = key.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown> | undefined)?.[segment], strict);
			expect(typeof builder, key).toBe('function');
			expect(table.builders[key], key).toBeDefined();
		}
	});

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: a seat takes text only where its holder spells it, never where its slot holds containers', (grammar) => {
		for (const { arms } of Object.values(tables[grammar].table.paths))
			for (const arm of arms)
				for (const member of arm.members) {
					for (const seat of member.seats) if (seat.text) expect([seat.kinds, seat.leaf], `${arm.builder} ${member.name}`).toEqual([[], undefined]);
					if (member.seats.some((seat) => seat.within !== undefined)) expect(member.seats[0]!.text, `${arm.builder} ${member.name}`).toBeUndefined();
				}
		const seatOf = (path: string, name: string) => armsOf('python', path).flatMap((arm) => arm.members).find((member) => member.name === name)!.seats[0]!;
		expect(seatOf('pattern.as', 'pattern')).toMatchObject({ kinds: [] });
		expect(seatOf('pattern.as', 'pattern').text).toBeUndefined();
		expect(seatOf('literal.number.float', 'marker').text).toBe(true);
		expect(seatOf('literal.string.escape', 'content').text).toBe(true);
	});

	it('tells a struct form apart by the kinds its body holds, through the list that holds them, or by the body missing', () => {
		const brace = armOf('rust', 'declaration.struct', rust.kinds.StructItemBrace);
		const tuple = armOf('rust', 'declaration.struct', rust.kinds.StructItemTuple);
		const unit = armOf('rust', 'declaration.struct', rust.kinds.StructItemUnit);
		expect(brace.builder).toBe('structItemBrace');
		expect(brace.when).toContainEqual({ member: 'body', kinds: [rust.kinds.FieldDeclaration] });
		expect(tuple.when).toContainEqual({ member: 'body', kinds: [rust.kinds.AttributedOrderedField] });
		expect(unit.when).toContainEqual(expect.objectContaining({ absent: expect.arrayContaining(['body']) }));
	});

	it('presets the operator a refinement pins as its kind id', () => {
		expect(armsOf('rust', 'expression.binary.arithmetic.add')[0]!.presets).toEqual([{ steps: [{ key: 'operator' }], kind: rust.kinds.Plus }]);
	});

	it('builds a closure parameter through its holder, which takes its sole value', () => {
		const closure = armOf('rust', 'declaration.parameter', rust.kinds.ClosureParameter);
		expect(closure.builder).toBeUndefined();
		expect(closure.seated).toBe('direct');
	});

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: a qualified identifier has no root entry', (grammar) => {
		expect(tables[grammar].table.paths['identifier.qualified']!.root).toBe(false);
	});

	it('keys a rust qualified type identifier by the type slots that admit it alone', () => {
		const typed = armOf('rust', 'identifier.qualified', rust.kinds.ScopedTypeIdentifier);
		expect(typed.holders).toContainEqual([rust.kinds.ReferenceType, 'type']);
		expect(armOf('rust', 'identifier.qualified', rust.kinds.ScopedIdentifier).holders).not.toContainEqual([rust.kinds.ReferenceType, 'type']);
	});

	it('keys python list patterns by holder, with no hidden kind', () => {
		const arms = armsOf('python', 'pattern.list');
		expect(arms.map((arm) => arm.kind).sort()).toEqual([python.kinds.CaseListPattern, python.kinds.ListPattern].sort());
		for (const arm of arms) expect(arm.holders?.length ?? 0).toBeGreaterThan(0);
	});

	it('sets a presence flag by its token, through the intermediate kind that holds it', () => {
		expect(armsOf('rust', 'declaration.function')[0]!.flags.async).toEqual({
			presets: [{ steps: [{ key: 'functionModifiers', builder: 'functionModifiers', optional: true }, { key: 'modifiers' }], kind: rust.kinds.AsyncKeyword }]
		});
	});

	it('picks a fixed literal by its text, and builds it as its kind id', () => {
		const u8 = armOf('rust', 'type.primitive', rust.kinds.U8Keyword);
		expect(u8.builder).toBeUndefined();
		expect(u8.when).toEqual([{ text: 'u8' }]);
	});

	it('picks a form that implies a flag by the flag', () => {
		expect(armOf('rust', 'expression.reference', rust.kinds.ReferenceExpressionMut).when).toEqual([{ flag: 'exclusive', set: true }, { absent: [], required: ['argument'] }]);
	});

	it('gives the empty-list pick only to a seated envelope that holds nothing but layout: python\'s empty suite', () => {
		const emptied = Object.entries(tables).flatMap(([grammar, { table }]) =>
			Object.entries(table.paths).flatMap(([path, { arms }]) =>
				arms.flatMap((arm) => arm.when.flatMap((test) => ('empty' in test ? [[grammar, path, arm.kind, test.empty] as const] : [])))
			)
		);
		expect(emptied).toEqual([['python', 'statement.block', python.kinds.SuiteEmpty, ['statements']]]);
		const arms = armsOf('python', 'statement.block');
		expect(arms.findIndex((arm) => arm.kind === python.kinds.SuiteEmpty)).toBeLessThan(arms.findIndex((arm) => arm.kind === python.kinds.Block));
	});

	it("orders a match arm by its body's kinds, narrower first, and keys the last arm by the slot that holds it", () => {
		expect(armsOf('rust', 'clause.case.match').map((arm) => arm.kind)).toEqual([rust.kinds.MatchArmBlockEnding, rust.kinds.MatchArmWithComma, rust.kinds.LastMatchArm]);
		expect(armOf('rust', 'clause.case.match', rust.kinds.MatchArmBlockEnding).when).toContainEqual(expect.objectContaining({ member: 'body' }));
		expect(armOf('rust', 'clause.case.match', rust.kinds.LastMatchArm).holders).toEqual([[rust.kinds.MatchBlockArms, 'arms']]);
	});

	it("builds a token tree's paren form by default, and each delimiter by its refinement", () => {
		expect(armsOf('rust', 'element.macro.token_tree')[0]!.kind).toBe(rust.kinds.TokenTreeParen);
		expect(armsOf('rust', 'element.macro.token_tree.bracket').map((arm) => arm.kind)).toEqual([rust.kinds.TokenTreeBracket]);
	});

	it('tells a static item from a let by the static flag', () => {
		expect(armOf('rust', 'declaration.variable', rust.kinds.StaticItem).when).toContainEqual({ flag: 'static', set: true });
		expect(armOf('rust', 'declaration.variable', rust.kinds.LetDeclaration).when).toContainEqual({ flag: 'static', set: false });
	});

	it("takes a tie the derived steps leave from the grammar's default arm", () => {
		expect(armsOf('python', 'clause.resource').map((arm) => arm.kind)).toEqual([python.kinds.WithClauseBare, python.kinds.WithClauseParen]);
		expect(armOf('python', 'clause.resource', python.kinds.WithClauseBare).when).toContainEqual({ variant: 'with_clause', value: python.kinds.WithClauseBare, default: true });
		expect(armOf('rust', 'declaration.macro', rust.kinds.MacroDefinitionParen).when).toContainEqual({ variant: 'macro_definition', value: rust.kinds.MacroDefinitionParen, default: true });
	});

	it('counts an arm that is the whole content of a forwarding variant envelope as that variant, so the declared default leads after the empty-list pick', () => {
		const block = armsOf('python', 'statement.block');
		expect(block.slice(0, 2).map((arm) => arm.kind)).toEqual([python.kinds.SuiteEmpty, python.kinds.Block]);
		expect(block[1]!.when).toContainEqual({ variant: '_suite', value: python.kinds.Block, default: true });
		expect(armOf('python', 'statement.block', python.kinds.SuiteInline).when).toContainEqual({ variant: '_suite', value: python.kinds.SuiteInline });
	});

	it('tells forms apart by the kinds a member holds, where the member reaches them through the containers its slot holds', () => {
		expect(armOf('rust', 'pattern.struct', rust.kinds.StructPattern).when).toEqual([
			{ member: 'type', kinds: [rust.kinds.ScopedTypeIdentifier, rust.kinds.TypeIdentifier] },
			{ absent: [], required: ['type'] }
		]);
		expect(armOf('rust', 'pattern.struct', rust.kinds.TupleStructPattern).when).toEqual([
			{ member: 'type', kinds: [rust.kinds.Identifier, rust.kinds.GenericTypeWithTurbofish, rust.kinds.ScopedIdentifier] },
			{ absent: [], required: ['type'] }
		]);
		expect(armOf('typescript', 'expression.parenthesized', typescript.kinds.ParenthesizedExpressionSequence).when).toContainEqual({
			member: 'expression',
			kinds: [typescript.kinds.SequenceExpression]
		});
	});

	it("builds a form through its holder's mount, the step saying how the mount takes its input", () => {
		const [left] = armOf('typescript', 'expression.binary.membership.in', typescript.kinds.BinaryExpression).members.filter((member) => member.name === 'left' && member.steps.length > 1);
		expect(left!.steps[0]).toEqual({
			key: 'binaryExpressionIn',
			builder: 'binaryExpression.in',
			mounted: { call: 'keyed', key: 'binaryExpressionIn', seats: 'config' }
		});
		expect(tables.typescript.table.builders['binaryExpression.in']).toBe('config');
		const [right] = armOf('rust', 'pattern.range.inclusive', rust.kinds.RangePatternWithLeft).members.filter((member) => member.name === 'right');
		expect(right!.steps[0]).toEqual({ key: 'content', builder: 'rangePatternWithLeft.withRight', mounted: { call: 'merge', key: 'content' } });
	});

	it("states a nested mount's call at the holder its holder is seated in, and registers the nested builder by that call", () => {
		const value = armsOf('typescript', 'statement.export.default')[0]!.members.find((member) => member.name === 'value')!;
		expect(value.steps[1]).toEqual({
			key: 'content',
			builder: 'exportStatementDefaultDeclaration.defaultKw.value',
			mounted: { call: 'child', key: 'content', outer: { call: 'keyedArgs', key: 'content', seats: 'direct' } }
		});
		expect(tables.typescript.table.builders['exportStatementDefaultDeclaration.defaultKw.value']).toBe('config');
		const list = armsOf('python', 'clause.catch')[0]!.members.flatMap((member) => member.seats.flatMap((seat) => seat.within ?? []));
		expect(list).toContainEqual({
			builder: 'exceptClause.exception.list',
			key: 'values',
			mounted: { call: 'child', key: 'content', outer: { call: 'keyedArgs', key: 'exception', seats: 'spread' } }
		});
	});

	it("keys an arm built through its holder's mount by its own kind, and names the holder", () => {
		const pub = armsOf('rust', 'modifier.visibility.public')[0]!;
		expect(pub.kind).toBe(rust.kinds.VisibilityModifierPub);
		expect(pub.builder).toBe('visibilityModifier.pub');
		expect(pub.mounted).toEqual({ call: 'child', key: 'content', holder: rust.kinds.VisibilityModifier });
	});

	it('builds a kind mounted in several holders once per mount a seat reaches, and never at the root', () => {
		const negative = tables.python.table.paths['literal.number.negative']!;
		expect(negative.root).toBe(false);
		expect(negative.arms.map((arm) => [arm.kind, arm.builder, arm.holders])).toEqual([
			[python.kinds.SimplePatternNegative, 'simplePattern.negative', [[python.kinds.SimplePattern, 'content']]],
			[python.kinds.SimplePatternNegative, 'keywordPattern.negative', [[python.kinds.KeywordPattern, 'pattern']]]
		]);
	});

	it("reads a mounted kind at its holder where the holder's claim is its claim's parent", () => {
		const delegate = armsOf('python', 'expression.yield.delegate');
		expect(delegate.map((arm) => [arm.kind, arm.builder, arm.mounted])).toEqual([[python.kinds.Yield, 'yield', undefined]]);
		expect(delegate[0]!.members.map((member) => member.steps.map((step) => step.key))).toEqual([['content', 'expression']]);
		expect(delegate[0]!.members[0]!.steps[0]!.mounted).toEqual({ call: 'child', key: 'content' });
		expect(delegate[0]!.when).toEqual([{ absent: [], required: ['expression'] }]);
	});

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: every seat states the kinds a value there has, so a member with several routes takes one that seats it', (grammar) => {
		for (const { arms } of Object.values(tables[grammar].table.paths))
			for (const arm of arms) for (const member of arm.members) for (const seat of member.seats) expect(Array.isArray(seat.kinds), `${member.name} at ${seat.at.join('.')}`).toBe(true);
		const input = armsOf('rust', 'attribute.content')[0]!.members.filter((member) => member.name === 'input');
		expect(input.find((route) => route.steps.at(-1)!.key === 'arguments')!.seats[0]!.kinds).toEqual([
			rust.kinds.DelimTokenTree,
			rust.kinds.DelimTokenTreeParen,
			rust.kinds.DelimTokenTreeBracket,
			rust.kinds.DelimTokenTreeBrace
		]);
	});

	it("splits a required form slot by the form that builds from nothing: its sibling arm presets the form's mount", () => {
		const [fnForm, traitForm] = armsOf('rust', 'type.function');
		expect([fnForm!.kind, traitForm!.kind]).toEqual([rust.kinds.FunctionType, rust.kinds.FunctionType]);
		expect(fnForm!.presets).toEqual([{ steps: [{ key: 'content', builder: 'functionType.fnForm', mounted: { call: 'keyedArgs', key: 'content', seats: 'forwarded' } }] }]);
		expect(fnForm!.when).toEqual([{ absent: ['trait'], required: [] }]);
		expect(traitForm!.presets).toEqual([]);
		expect(traitForm!.when).toEqual([{ absent: ['extern'], required: ['trait'] }]);
	});

	it('drops an arm with a required slot no member, flag or preset fills, so the bare path builds nothing', () => {
		expect(armsOf('rust', 'pattern.range')).toEqual([]);
		expect(armsOf('rust', 'expression.binary')).toEqual([]);
		expect(armsOf('rust', 'pattern.range.inclusive').length).toBeGreaterThan(0);
	});

	it("requires the members that complete the kind a route enters: an except clause's name, its type", () => {
		const names = armsOf('python', 'clause.catch')[0]!.members.filter((member) => member.name === 'name');
		expect(names.map((route) => route.requires)).toEqual([[['type']]]);
	});

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: a route requires only members and flags of its own arm', (grammar) => {
		for (const { arms } of Object.values(tables[grammar].table.paths))
			for (const arm of arms) {
				const names = new Set([...arm.members.map((member) => member.name), ...Object.keys(arm.flags)]);
				for (const member of arm.members)
					for (const group of member.requires ?? []) for (const name of group) expect(names.has(name), `${member.name} requires ${name}`).toBe(true);
			}
	});

	it('never takes an arm for a structure stating a member the arm lacks', () => {
		const [sequence, typed] = armsOf('typescript', 'expression.parenthesized');
		expect(sequence!.when).toContainEqual({ absent: ['type'], required: ['expression'] });
		expect(typed!.kind).toBe(typescript.kinds.ParenthesizedExpressionTyped);
	});

	it('builds a number by the one arm at its path that takes its scalar type, apart from the structural tests', () => {
		const scalarArm = (scalar: 'integer' | 'float') => armsOf('typescript', 'literal.number').filter((arm) => arm.scalar === scalar);
		expect(scalarArm('integer').map((arm) => arm.kind)).toEqual([typescript.kinds.NumberDecimal]);
		expect(scalarArm('float').map((arm) => arm.kind)).toEqual([typescript.kinds.NumberFloatPoint]);
		for (const { table } of Object.values(tables))
			for (const { arms } of Object.values(table.paths)) for (const arm of arms) for (const test of arm.when) expect(Object.keys(test)).not.toContain('scalar');
	});

	it('takes the float form that spells every float, for a $value and first among the forms a member structure fits', () => {
		const kinds = armsOf('typescript', 'literal.number').map((arm) => arm.kind);
		expect(armOf('typescript', 'literal.number', typescript.kinds.NumberFloatPoint).scalar).toBe('float');
		expect(kinds.indexOf(typescript.kinds.NumberFloatPoint)).toBeLessThan(kinds.indexOf(typescript.kinds.NumberFloatScientific));
	});

	it("writes the text a claim's predicate fixes, and spells a templated member from its holes", () => {
		expect(armOf('python', 'declaration.constructor', python.kinds.MethodDeclaration).presets).toContainEqual({ steps: [{ key: 'name' }], text: '__init__', builder: 'identifier' });
		expect(armOf('python', 'declaration.method.special', python.kinds.MethodDeclaration).template).toEqual({ member: 'name', pattern: '__${string}__', holes: ['stem'], match: '^__(?<stem>.*)__$' });
	});

	it("writes the other token where a flag's slot must hold one of two, when the flag is unset", () => {
		expect(armOf('typescript', 'expression.member', typescript.kinds.MemberExpression).flags.optionalChain).toEqual({
			presets: [{ steps: [{ key: 'operator' }], kind: typescript.kinds.OptionalChain }],
			unset: [{ steps: [{ key: 'operator' }], kind: typescript.kinds.Dot }]
		});
	});

	it('builds a $value at a path with no arms through the nearest descendant that takes its type', () => {
		expect(tables.rust.table.values?.['literal.number']).toEqual({ integer: 'literal.number.integer', float: 'literal.number.float' });
		expect(tables.python.table.values?.['literal.boolean']).toEqual({ true: 'literal.boolean.true', false: 'literal.boolean.false' });
		expect(tables.typescript.table.values?.['literal.number']).toBeUndefined();
	});

	it("tests a boolean arm by the value its binding declares, and names a config builder's numeric slots", () => {
		expect(armsOf('rust', 'literal.boolean').map((arm) => arm.when)).toEqual([[{ boolean: true }], [{ boolean: false }]]);
		expect(armsOf('rust', 'literal.number.integer')[0]!.numeric).toBe('content');
		expect(armsOf('python', 'literal.number.float')[0]!.numeric).toEqual({ integer: 'integer', fraction: 'fraction', exponent: 'exponent', marker: 'marker', exponentSign: 'exponentSign' });
		expect(armsOf('python', 'literal.number.integer.hex')[0]!.numeric).toBeUndefined();
	});

	it("spells a number's decimal parts through its kind's slots, whatever its members are named, and refuses a part it has no slot for", async () => {
		const engine = await createEngine(python, { api: 'strict' });
		const signed = (arm: PortableBuildArm): string | undefined => (typeof arm.numeric === 'object' ? arm.numeric.exponentSign : undefined);
		const renamed = (arm: PortableBuildArm): PortableBuildArm =>
			signed(arm) === undefined ? arm : { ...arm, members: arm.members.map((member) => (member.steps[0]?.key === signed(arm) ? { ...member, name: 'signOfExponent' } : member)) };
		const unsigned = (arm: PortableBuildArm): PortableBuildArm => {
			if (typeof arm.numeric !== 'object' || arm.numeric.exponentSign === undefined) return arm;
			const { exponentSign, ...rest } = arm.numeric;
			return { ...arm, numeric: rest, members: arm.members.filter((member) => member.steps[0]?.key !== exponentSign) };
		};
		const builderWith = (edit: (arm: PortableBuildArm) => PortableBuildArm) =>
			portableBuilder({
				language: 'python',
				table: { ...tables.python.table, paths: Object.fromEntries(Object.entries(tables.python.table.paths).map(([path, at]) => [path, { ...at, arms: at.arms.map(edit) }])) },
				builders: engine.build,
				kindName: () => undefined,
				readsAs: () => true,
				spellingOf: () => undefined
			});
		expect(String(engine.render(builderWith(renamed)({ $path: 'literal.number.float', $value: 1e-7 }) as never))).toBe('1.0e-7');
		expect(() => builderWith(unsigned)({ $path: 'literal.number.float', $value: 1e-7 })).toThrow(/literal\.number\.float builds a kind \d+ in python, which cannot spell 1e-7/);
	});

	it('reaches a kind a flag presets only through the flag', () => {
		expect(armsOf('typescript', 'identifier').map((arm) => arm.kind)).not.toContain(typescript.kinds.PrivatePropertyIdentifier);
		expect(armOf('typescript', 'expression.member', typescript.kinds.MemberExpression).flags.privateName).toEqual({
			presets: [{ steps: [{ key: 'property' }], builder: 'privatePropertyIdentifier' }]
		});
	});

	const expectedDiagnostics: Readonly<Record<keyof typeof languages, readonly string[]>> = {
		python: [
			'portable-integer-partial literal.number.integer.binary',
			'portable-integer-partial literal.number.integer.hex',
			'portable-integer-partial literal.number.integer.octal',
			'portable-value-unshaped literal.number.integer.big',
			'portable-value-unshaped literal.number.integer.imaginary'
		],
		rust: ['portable-integer-partial literal.number.integer.binary', 'portable-integer-partial literal.number.integer.hex', 'portable-integer-partial literal.number.integer.octal'],
		typescript: []
	};

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: the pick leaves no codegen diagnostic but the named integer reads', (grammar) => {
		const diagnostics = JSON.parse(readFileSync(new URL(`../../${grammar}/.sittir/grammar-diagnostics.json`, import.meta.url), 'utf8')) as
			| readonly { readonly code: string; readonly message: string }[]
			| { readonly diagnostics: readonly { readonly code: string; readonly message: string }[] };
		const entries = Array.isArray(diagnostics) ? diagnostics : (diagnostics as { readonly diagnostics: readonly { readonly code: string; readonly message: string }[] }).diagnostics;
		const raised = entries.filter(({ code }) => code.startsWith('portable-') && code !== 'portable-kind-armless').map(({ code, message }) => `${code} ${message.split(':')[0]}`);
		expect(raised.sort()).toEqual(expectedDiagnostics[grammar]);
	});

	it('writes the trailing separator on the one item of a list claimed by its own separator, and on no other list', () => {
		const sole = { member: 'elements', delimiter: Delimiter.Trailing };
		expect(armOf('python', 'expression.collection.tuple.bare', python.kinds.Subscripts).sole).toEqual(sole);
		expect(armOf('python', 'expression.collection.tuple.bare', python.kinds.Subjects).sole).toEqual(sole);
		expect(armOf('python', 'expression.collection.tuple.bare', python.kinds.ExpressionList).sole).toBeUndefined();
		const soles = Object.values(tables).flatMap(({ table }) => Object.values(table.paths).flatMap(({ arms }) => arms.filter((arm) => arm.sole !== undefined)));
		expect(soles.map((arm) => arm.kind).sort()).toEqual([python.kinds.ExpressionStatementTuple, python.kinds.Subjects, python.kinds.Subscripts].sort());
	});

	it('builds the default form of a variant family, and the others by render option', () => {
		const arms = armsOf('python', 'literal.string.escape');
		const defaults = arms.filter((arm) => arm.when.some((test) => 'default' in test));
		expect(defaults.map((arm) => arm.kind)).toEqual([python.kinds.EscapeSequenceSimple]);
		expect(arms.indexOf(defaults[0]!)).toBeLessThan(arms.findIndex((arm) => arm.when.some((test) => 'variant' in test && !('default' in test))));
	});
});

describe('the portable build of a registered option', () => {
	const textSeat = (key: string) => ({ name: key, steps: [{ key }], multiple: false, seats: [{ at: [1, key] as const, kinds: [], text: true as const }] });
	const table = (options?: PortableBuildTable['options']): PortableBuildTable => ({
		builders: { holder: 'direct' },
		...(options === undefined ? {} : { options }),
		paths: { 'statement.held': { root: true, arms: [{ kind: 1, builder: 'holder', members: [textSeat('value'), textSeat('spelling')], presets: [], flags: {}, when: [] }] } }
	});
	const build = (options: PortableBuildTable['options'], structure: Readonly<Record<string, string>>) => {
		const calls: unknown[][] = [];
		const builder = portableBuilder({
			language: 'test',
			table: table(options),
			builders: { holder: (...args: unknown[]) => (calls.push(args), { $type: 1 }) },
			kindName: () => undefined,
			readsAs: () => true,
			spellingOf: () => undefined
		});
		builder({ $path: 'statement.held', ...structure });
		return calls;
	};

	it('passes a member its builder takes as an option in the trailing options, and the rest as its input', () => {
		expect(build({ holder: ['spelling'] }, { value: 'v', spelling: 's' })).toEqual([['v', { spelling: 's' }]]);
	});

	it('passes no options when the structure states none of them', () => {
		expect(build({ holder: ['spelling'] }, { value: 'v' })).toEqual([['v']]);
	});
});

describe("the portable build of a flag that is a member's list's trailing separator", () => {
	const tableOf = (member: PortableBuildTable['paths'][string]['arms'][number]['members'][number], list: readonly { readonly key: string; readonly builder?: string }[]): PortableBuildTable => ({
		builders: { holder: 'config', items: 'elements' },
		paths: {
			'statement.held': {
				root: true,
				arms: [{ kind: 1, builder: 'holder', members: [member], presets: [], flags: { trailingComma: { presets: [], delimiter: Delimiter.Trailing, list } }, when: [] }]
			}
		}
	});
	const framed = tableOf(
		{ name: 'arguments', steps: [{ key: 'arguments', builder: 'items' }, { key: 'item' }], multiple: true, list: true, seats: [{ at: [2, 'item'], kinds: [], text: true, many: true }] },
		[{ key: 'arguments', builder: 'items' }]
	);
	const contained = tableOf(
		{ name: 'arguments', steps: [{ key: 'arguments' }], multiple: false, list: true, seats: [{ at: [2, 'item'], kinds: [], text: true, many: true, within: [{ builder: 'items', key: 'item' }] }] },
		[{ key: 'arguments' }]
	);
	const keyed = tableOf(
		{ name: 'arguments', steps: [{ key: 'arguments' }], multiple: false, list: true, seats: [{ at: [2, 'item'], kinds: [], text: true, many: true, within: [{ key: 'item' }] }] },
		[{ key: 'arguments' }]
	);
	const build = (structure: Readonly<Record<string, unknown>>, table: PortableBuildTable = framed): readonly (readonly [string, readonly unknown[]])[] => {
		const calls: [string, unknown[]][] = [];
		const builder = portableBuilder({
			language: 'test',
			table,
			builders: {
				holder: (...args: unknown[]) => (calls.push(['holder', args]), { $type: 1 }),
				items: (...args: unknown[]) => (calls.push(['items', args]), { $type: 2 })
			},
			kindName: () => undefined,
			readsAs: () => true,
			spellingOf: () => undefined
		});
		builder({ $path: 'statement.held', ...structure } as never);
		return calls;
	};

	it("sets the delimiter on the list the flag's steps reach, not on the arm's own builder", () => {
		expect(build({ arguments: ['a', 'b'], $flags: ['trailingComma'] })).toEqual([
			['items', [{ delimiter: Delimiter.Trailing }, 'a', 'b']],
			['holder', [{ arguments: { $type: 2 } }]]
		]);
		expect(build({ arguments: ['a'] })[0]).toEqual(['items', ['a']]);
	});

	it('refuses the flag where the list it is the separator of holds nothing', () => {
		expect(() => build({ arguments: [], $flags: ['trailingComma'] })).toThrow('statement.held: trailingComma is the trailing separator of the list at arguments, which holds nothing');
	});

	it("sets the delimiter on the list a member's seat builds as its container", () => {
		expect(build({ arguments: ['a', 'b'], $flags: ['trailingComma'] }, contained)).toEqual([
			['items', [{ delimiter: Delimiter.Trailing }, 'a', 'b']],
			['holder', [{ arguments: { $type: 2 } }]]
		]);
		expect(build({ arguments: ['a'] }, contained)[0]).toEqual(['items', ['a']]);
		expect(() => build({ arguments: [], $flags: ['trailingComma'] }, contained)).toThrow('statement.held: trailingComma is the trailing separator of the list at arguments, which holds nothing');
	});

	it('refuses the flag where the list it reaches sits in a container its holder builds, by the path to it', () => {
		expect(() => build({ arguments: ['a', 'b'], $flags: ['trailingComma'] }, keyed)).toThrow('statement.held: trailingComma reaches arguments, which builds no list');
	});
});

describe('the portable build of an arm whose routes run through two forms of one slot', () => {
	const route = (name: string, form: 'formA' | 'formB', pattern?: RegExp) => ({
		name,
		steps: [{ key: 'content', builder: form }, { key: name }],
		multiple: false,
		seats: [{ at: [form === 'formA' ? 2 : 3, name] as const, kinds: [], text: true as const, ...(pattern === undefined ? {} : { pattern: { source: pattern.source, flags: pattern.flags } }) }]
	});
	const table: PortableBuildTable = {
		builders: { outer: 'config', formA: 'config', formB: 'config' },
		paths: {
			'statement.held': {
				root: true,
				arms: [{ kind: 1, builder: 'outer', members: [route('left', 'formA'), route('left', 'formB'), route('right', 'formA', /^z$/), route('right', 'formB')], owners: [[0, 2], [1, 3]], presets: [], flags: {}, when: [] }]
			}
		}
	};
	const build = (structure: Readonly<Record<string, unknown>>): readonly (readonly [string, unknown])[] => {
		const calls: [string, unknown][] = [];
		const builder = portableBuilder({
			language: 'test',
			table,
			builders: {
				outer: (input: unknown) => (calls.push(['outer', input]), { $type: 1 }),
				formA: (input: unknown) => (calls.push(['formA', input]), { $type: 2 }),
				formB: (input: unknown) => (calls.push(['formB', input]), { $type: 3 })
			},
			kindName: () => undefined,
			readsAs: () => true,
			spellingOf: () => undefined
		});
		builder({ $path: 'statement.held', ...structure } as never);
		return calls;
	};

	it('builds every member through the one form that takes them all, whatever order the structure states them in', () => {
		for (const structure of [{ left: 'x', right: 'y' }, { right: 'y', left: 'x' }]) expect(build(structure)[0]).toEqual(['formB', { left: 'x', right: 'y' }]);
	});

	it('refuses members two forms take alike, and a list where every form takes one value', () => {
		expect(() => build({ left: 'x', right: 'z' })).toThrow('takes left, right through more than one test form');
		expect(() => build({ left: ['x'] })).toThrow("statement.held's left holds one value, not a list");
	});
});

describe('the portable build of a list whose last element takes a form of its own', () => {
	const pattern = (holder: number) => ({ name: 'pattern', steps: [{ key: 'pattern' }], multiple: false, seats: [{ at: [holder, 'pattern'] as const, kinds: [], text: true as const }] });
	const arm = (kind: number, builder: string) => ({ kind, builder, holders: [[1, 'arms']] as const, members: [pattern(kind)], presets: [], flags: {}, when: [] });
	const table: PortableBuildTable = {
		builders: { holder: 'config', arm: 'config', last: 'config' },
		paths: {
			'statement.held': {
				root: true,
				arms: [
					{
						kind: 1,
						builder: 'holder',
						members: [
							{
								name: 'body',
								steps: [{ key: 'arms' }],
								multiple: false,
								list: true,
								seats: [
									{ at: [1, 'arms'], kinds: [2], many: true },
									{ at: [1, 'arms'], kinds: [3], many: true, final: true }
								]
							}
						],
						presets: [],
						flags: {},
						when: []
					}
				]
			},
			'clause.case': { root: false, arms: [arm(2, 'arm'), arm(3, 'last')] },
			'clause.rest': { root: false, arms: [arm(2, 'arm')] }
		}
	};
	const build = (body: readonly unknown[]): readonly (readonly [string, unknown])[] => {
		const calls: [string, unknown][] = [];
		const builder = portableBuilder({
			language: 'test',
			table,
			builders: {
				holder: (input: unknown) => (calls.push(['holder', input]), { $type: 1 }),
				arm: (input: unknown) => (calls.push(['arm', input]), { $type: 2 }),
				last: (input: unknown) => (calls.push(['last', input]), { $type: 3 })
			},
			kindName: (kind: number) => ({ 2: 'arm', 3: 'last_arm' })[kind],
			readsAs: () => true,
			spellingOf: () => undefined
		});
		builder({ $path: 'statement.held', body } as never);
		return calls;
	};
	const clause = (path: string, text: string) => ({ $path: path, pattern: text });

	it('builds the last element in the form its last seat takes, and every other in the repeated form', () => {
		expect(build([clause('clause.case', 'a'), clause('clause.case', 'b'), clause('clause.case', 'c')])).toEqual([
			['arm', { pattern: 'a' }],
			['arm', { pattern: 'b' }],
			['last', { pattern: 'c' }],
			['holder', { arms: [{ $type: 2 }, { $type: 2 }, { $type: 3 }] }]
		]);
		expect(build([clause('clause.case', 'a')])).toEqual([
			['last', { pattern: 'a' }],
			['holder', { arms: [{ $type: 3 }] }]
		]);
	});

	it('refuses a last element with no form its last seat takes, by its path', () => {
		expect(() => build([clause('clause.case', 'a'), clause('clause.rest', 'b')])).toThrow(
			"portable build: statement.held's body ends with clause.rest, which builds in none of the forms its last element takes"
		);
	});
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PortableBuildArm, PortableBuildTable } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { portableBuilder } from '../src/portable/build.ts';
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
		expect(armOf('rust', 'expression.reference', rust.kinds.ReferenceExpressionMut).when).toEqual([{ flag: 'exclusive', set: true }]);
	});

	it("orders a match arm by its body's kinds, narrower first, and keys the last arm by the slot that holds it", () => {
		expect(armsOf('rust', 'clause.case.match').map((arm) => arm.kind)).toEqual([rust.kinds.MatchArmBlockEnding, rust.kinds.MatchArmWithComma, rust.kinds.LastMatchArm]);
		expect(armOf('rust', 'clause.case.match', rust.kinds.MatchArmBlockEnding).when).toContainEqual(expect.objectContaining({ member: 'body' }));
		expect(armOf('rust', 'clause.case.match', rust.kinds.LastMatchArm).holders).toEqual([[rust.kinds.MatchBlockArms, 'lastArm']]);
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

	it('tells forms apart by the kinds a member holds, where the member reaches them through the containers its slot holds', () => {
		expect(armOf('rust', 'pattern.struct', rust.kinds.StructPattern).when).toEqual([{ member: 'type', kinds: [rust.kinds.ScopedTypeIdentifier, rust.kinds.TypeIdentifier] }]);
		expect(armOf('rust', 'pattern.struct', rust.kinds.TupleStructPattern).when).toEqual([
			{ member: 'type', kinds: [rust.kinds.Identifier, rust.kinds.GenericTypeWithTurbofish, rust.kinds.ScopedIdentifier] }
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
			optional: true,
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

	it("marks an arm built through its holder's mount", () => {
		const pub = armsOf('rust', 'modifier.visibility.public')[0]!;
		expect(pub.kind).toBe(rust.kinds.VisibilityModifier);
		expect(pub.builder).toBe('visibilityModifier.pub');
		expect(pub.mounted).toEqual({ call: 'child', key: 'content' });
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
		expect(sequence!.when).toContainEqual({ absent: ['type'], required: [] });
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
		expect(armOf('python', 'declaration.constructor', python.kinds.MethodDeclaration).presets).toContainEqual({ steps: [{ key: 'name' }], text: '__init__' });
		expect(armOf('python', 'declaration.method.special', python.kinds.MethodDeclaration).template).toEqual({ member: 'name', pattern: '__${string}__', holes: ['stem'] });
	});

	it("writes the other token where a flag's slot must hold one of two, when the flag is unset", () => {
		expect(armOf('typescript', 'expression.member', typescript.kinds.MemberExpression).flags.optionalChain).toEqual({
			presets: [{ steps: [{ key: 'optionalChain' }], kind: typescript.kinds.OptionalChain }],
			unset: [{ steps: [{ key: 'optionalChain' }], kind: typescript.kinds.Dot }]
		});
	});

	it('builds a $value at a path with no arms through the nearest descendant that takes its type', () => {
		expect(tables.rust.table.values?.['literal.number']).toEqual({ integer: 'literal.number.integer', float: 'literal.number.float' });
		expect(tables.python.table.values?.['literal.boolean']).toEqual({ true: 'literal.boolean.true', false: 'literal.boolean.false' });
		expect(tables.typescript.table.values?.['literal.number']).toBeUndefined();
	});

	it("tests a boolean arm by the value its binding declares, and names a config builder's numeric members", () => {
		expect(armsOf('rust', 'literal.boolean').map((arm) => arm.when)).toEqual([[{ boolean: true }], [{ boolean: false }]]);
		expect(armsOf('rust', 'literal.number.integer')[0]!.numeric).toBe('content');
		expect(armsOf('python', 'literal.number.float')[0]!.numeric).toEqual({ integer: 'integer', fraction: 'fraction', exponent: 'exponent', marker: 'marker', sign: 'sign' });
		expect(armsOf('python', 'literal.number.integer.hex')[0]!.numeric).toBeUndefined();
	});

	it("spells a number's decimal parts through the members its arm maps them to, whatever their names, and refuses a part it has no member for", async () => {
		const engine = await createEngine(python, { api: 'strict' });
		const withSign = (sign: string | undefined) => (arm: PortableBuildArm): PortableBuildArm => {
			const parts = typeof arm.numeric === 'object' ? arm.numeric : undefined;
			if (parts?.sign === undefined) return arm;
			const { sign: old, ...rest } = parts;
			return {
				...arm,
				members: arm.members.flatMap((member) => (member.name !== old ? [member] : sign === undefined ? [] : [{ ...member, name: sign }])),
				numeric: sign === undefined ? rest : { ...rest, sign }
			};
		};
		const builderWith = (sign: string | undefined) =>
			portableBuilder({
				language: 'python',
				table: { ...tables.python.table, paths: Object.fromEntries(Object.entries(tables.python.table.paths).map(([path, at]) => [path, { ...at, arms: at.arms.map(withSign(sign)) }])) },
				builders: engine.build,
				kindName: () => undefined,
				readsAs: () => true
			});
		expect(String(engine.render(builderWith('exponentSign')({ $path: 'literal.number.float', $value: 1e-7 }) as never))).toBe('1.0e-7');
		expect(() => builderWith(undefined)({ $path: 'literal.number.float', $value: 1e-7 })).toThrow(/literal\.number\.float builds a kind \d+ in python, which cannot spell 1e-7/);
	});

	it('reaches a kind a flag presets only through the flag', () => {
		expect(armsOf('typescript', 'identifier').map((arm) => arm.kind)).not.toContain(typescript.kinds.PrivatePropertyIdentifier);
		expect(armOf('typescript', 'expression.member', typescript.kinds.MemberExpression).flags.privateName).toEqual({
			presets: [{ steps: [{ key: 'property' }], builder: 'privatePropertyIdentifier' }]
		});
	});

	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: the pick leaves no codegen diagnostic', (grammar) => {
		const diagnostics = JSON.parse(readFileSync(new URL(`../../${grammar}/.sittir/grammar-diagnostics.json`, import.meta.url), 'utf8')) as
			| readonly { readonly code: string }[]
			| { readonly diagnostics: readonly { readonly code: string }[] };
		const codes = (Array.isArray(diagnostics) ? diagnostics : (diagnostics as { readonly diagnostics: readonly { readonly code: string }[] }).diagnostics).map((d) => d.code);
		expect(codes.filter((code) => code.startsWith('portable-'))).toEqual([]);
	});

	it('builds the default form of a variant family, and the others by render option', () => {
		const arms = armsOf('python', 'literal.string.escape');
		const defaults = arms.filter((arm) => arm.when.some((test) => 'default' in test));
		expect(defaults.map((arm) => arm.kind)).toEqual([python.kinds.EscapeSequenceSimple]);
		expect(arms.indexOf(defaults[0]!)).toBeLessThan(arms.findIndex((arm) => arm.when.some((test) => 'variant' in test && !('default' in test))));
	});
});

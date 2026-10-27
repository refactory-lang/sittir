import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PortableBuildArm, PortableBuildTable } from '@sittir/types';
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
	it.each(Object.keys(languages) as (keyof typeof languages)[])('%s: every builder an arm or a step names is a strict builder, with its call shape', (grammar) => {
		const { table, strict } = tables[grammar];
		const named = new Set<string>();
		for (const { arms } of Object.values(table.paths))
			for (const arm of arms) {
				if (arm.builder !== undefined) named.add(arm.builder);
				for (const step of [...arm.members.flatMap((m) => m.steps), ...arm.presets.flatMap((p) => p.steps)]) if (step.builder !== undefined) named.add(step.builder);
				for (const member of arm.members) if (member.leaf !== undefined) named.add(member.leaf);
			}
		for (const key of named) {
			const builder = key.split('.').reduce<unknown>((at, segment) => (at as Record<string, unknown> | undefined)?.[segment], strict);
			expect(typeof builder, key).toBe('function');
			expect(table.builders[key], key).toBeDefined();
		}
	});

	it('tells a struct form apart by its body kind or by the body missing', () => {
		const brace = armOf('rust', 'declaration.struct', rust.kinds.StructItemBrace);
		const tuple = armOf('rust', 'declaration.struct', rust.kinds.StructItemTuple);
		const unit = armOf('rust', 'declaration.struct', rust.kinds.StructItemUnit);
		expect(brace.builder).toBe('structItemBrace');
		expect(brace.when).toContainEqual({ member: 'body', kinds: [rust.kinds.FieldDeclarationList] });
		expect(tuple.when).toContainEqual({ member: 'body', kinds: [rust.kinds.OrderedFieldDeclarationList] });
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
			presets: [{ steps: [{ key: 'functionModifiers', builder: 'functionModifiers' }, { key: 'modifiers' }], kind: rust.kinds.AsyncKeyword }]
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

	it("takes a tie the derived steps leave from the default the bindings declare, on the form's own claim or its supertype's", () => {
		expect(armsOf('rust', 'pattern.struct').map((arm) => arm.kind)).toEqual([rust.kinds.StructPattern, rust.kinds.TupleStructPattern]);
		expect(armsOf('python', 'clause.resource')[0]!.kind).toBe(python.kinds.WithClauseBare);
		expect(armsOf('typescript', 'expression.parenthesized')[0]!.kind).toBe(typescript.kinds.ParenthesizedExpressionSequence);
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

	it("writes the text a claim's predicate fixes, and spells a templated member from its holes", () => {
		expect(armOf('python', 'declaration.constructor', python.kinds.MethodDeclaration).presets).toContainEqual({ steps: [{ key: 'name' }], text: '__init__' });
		expect(armOf('python', 'declaration.method.special', python.kinds.MethodDeclaration).template).toEqual({ member: 'name', pattern: '__${string}__', holes: ['stem'] });
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

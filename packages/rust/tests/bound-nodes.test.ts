import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const SOURCE = 'use x;\n\nfn process(input: &str) {\n    // keep me\n    println!("{}",   input);\n}\n';

const stampOf = (node: unknown): unknown => (node as { $engine?: () => unknown }).$engine?.();

describe('a node built over parsed children', () => {
	it('renders through $render() exactly as through engine.render', async () => {
		const engine = await createEngine(rust);
		const root = engine.parse(SOURCE);
		const fn = root.statements()[1] as any;
		const existing = fn.parameters().parametersElements() ?? [];
		const params = engine.build.parameters(...existing);
		expect(engine.render(params).toString()).toBe('(input: &str)');
		expect(params.$render()).toBe('(input: &str)');
	});

	it('is rendered by the calling engine, with its options, whichever engine parsed its children', async () => {
		const tabs = await createEngine(rust, { render: { indent: '\t' } });
		const spaces = await createEngine(rust, { render: { indent: '  ' } });
		const fn = spaces.parse(SOURCE).statements()[1] as any;
		const block = tabs.build.block({
			statements: [tabs.build.expressionStatement(tabs.build.identifier('a')), ...fn.body().statements()]
		});
		const expected = '{\n\ta;\n\t// keep me\n\tprintln!("{}",   input);\n}';
		expect(tabs.render(block).toString()).toBe(expected);
		expect(block.$render()).toBe(expected);
	});

	it('renders when its parsed children come from several engines', async () => {
		const first = await createEngine(rust);
		const second = await createEngine(rust);
		const third = await createEngine(rust);
		const one = (first.parse(SOURCE).statements()[1] as any).body().statements();
		const two = (second.parse('fn g() {\n    b;\n}\n').statements()[0] as any).body().statements();
		const block = third.build.block({ statements: [...one, ...two] });
		const expected = '{\n    // keep me\n    println!("{}",   input);\n    b;\n}';
		expect(third.render(block).toString()).toBe(expected);
		expect(block.$render()).toBe(expected);
	});
});

describe('the engine a node belongs to', () => {
	it('applies its render options to $render()', async () => {
		const tabs = await createEngine(rust, { render: { indent: '\t' } });
		const spaces = await createEngine(rust, { render: { indent: '  ' } });
		const shape = (rs: typeof tabs) =>
			rs.build.block({ statements: [rs.build.expressionStatement(rs.build.identifier('a'))] });
		expect(shape(tabs).$render()).toBe('{\n\ta;\n}');
		expect(shape(spaces).$render()).toBe('{\n  a;\n}');
	});

	it('is the stamp of a node from every origin', async () => {
		const engine = await createEngine(rust);
		const other = await createEngine(rust);
		const root = engine.parse(SOURCE);
		const fn = root.statements()[1] as any;
		const built = engine.build.functionItem({
			name: 'f',
			parameters: engine.build.parameters(),
			body: engine.build.block({ statements: [] })
		}) as any;
		expect(stampOf(engine.build.identifier('a'))).toBe(engine);
		expect(stampOf(built.name())).toBe(engine);
		expect(stampOf(root)).toBe(engine);
		expect(stampOf(root)).not.toBe(other);
		expect(stampOf(fn)).toBe(engine);
		expect(stampOf(fn.parameters())).toBe(engine);
		expect(stampOf(other.build.identifier('a'))).toBe(other);
	});

	it('is the stamp of a child coerced from a string, a strict build, and a trivia entry made outside any build', async () => {
		const engine = await createEngine(rust);
		const param = engine.build.parameter({ name: 'a', type: 'String' }) as any;
		expect(stampOf(param.type())).toBe(engine);
		expect(stampOf(engine.build.parameters.strict())).toBe(engine);
		const fn = engine.build.functionItem({
			name: 'f',
			parameters: engine.build.parameters(),
			body: engine.build.block()
		});
		fn.$trivia('// x');
		expect(stampOf((fn.$trivia.leading() as unknown[])[0])).toBe(engine);
	});

	it('is kept by a $with rebuild called from another engine scope', async () => {
		const engine = await createEngine(rust);
		const other = await createEngine(rust);
		const fn = engine.parse(SOURCE).statements()[1] as any;
		let rebuilt: unknown;
		other.render((build) => {
			rebuilt = fn.$with.name('renamed');
			return build.identifier('a');
		});
		expect(stampOf(rebuilt)).toBe(engine);
	});

	it('detaches its nodes on dispose and leaves another engine alone', async () => {
		const engine = await createEngine(rust);
		const other = await createEngine(rust);
		const built = engine.build.identifier('a');
		const parsed = engine.parse(SOURCE);
		engine.dispose();
		expect(() => built.$render()).toThrow(/engine disposed/);
		expect(() => parsed.$render()).toThrow(/engine disposed/);
		expect(other.build.identifier('z').$render()).toBe('z');
	});
});

describe('the language facts an engine shares', () => {
	it('are frozen, so no engine can change them for another', async () => {
		const first = await createEngine(rust);
		const second = await createEngine(rust);
		const write = (fn: () => void) => expect(fn).toThrow(TypeError);
		write(() => {
			(first.trivia as { comment?: unknown }).comment = () => undefined;
		});
		write(() => {
			(first as { render: unknown }).render = () => undefined;
		});
		write(() => {
			(first.is as unknown as Record<string, unknown>).functionItem = () => true;
		});
		write(() => {
			(first.kinds as unknown as Record<string, unknown>).SourceFile = 0;
		});
		write(() => {
			(first.trivia.innerGaps as Record<string, unknown>).block = [];
		});
		expect(() => {
			(first.build as Record<string, unknown>).identifier = () => undefined;
		}).toThrow(/read-only/);
		expect(second.trivia.comment).toBe(first.trivia.comment);
		expect(second.parse('fn f() {}\n').statements()).toHaveLength(1);
	});

	it('leave the ir table of the package frozen at its source', async () => {
		const { ir } = await import('../src/ir.ts');
		expect(Object.isFrozen(ir)).toBe(true);
		expect(Object.isFrozen(ir.functionItem)).toBe(true);
		expect(Object.isFrozen(ir.functionItem.strict)).toBe(false);
	});
});

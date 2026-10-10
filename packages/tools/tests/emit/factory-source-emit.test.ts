import { describe, expect, it } from 'vitest';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';

describe('emitFactorySourceText (real rust grammar)', () => {
	it('prints a strict module for a one-function file', async () => {
		const source = await emitFactorySourceText('rust', 'fn main() {}\n', 'rebuildMain');
		expect(source).toContain("import rust from '@sittir/rust';");
		expect(source).toContain('export function rebuildMain() {');
		expect(source).toContain('rs.build.sourceFile.strict(');
		expect(source).toContain('name: rs.build.identifier("main")');
		expect(source).toContain('parameters: rs.build.parameters.strict()');
		expect(source).not.toContain('.coerce(');
	});
	// A comment rides the FOLLOWING node's trivia; construction carries it onto
	// the built node, as the `$with` setters do, since trivia is not config.
	it('builds through an engine over the grammar descriptor, importing Delimiter only when used', async () => {
		const source = await emitFactorySourceText('rust', '#[derive(Debug, Clone)]\nstruct S;\n', 'rebuildDerive');
		expect(source).not.toContain('createEngine(rust)');
		expect(source).toContain("import rust from '@sittir/rust';");
		expect(source).toContain('const rs = await rust.createEngine();');
		expect(source).not.toContain('Delimiter');
		expect(source).not.toContain('engine.');
	});

	it('prints a regular block comment from its text, leading, trailing and inner, on the strict surface', async () => {
		const source = await emitFactorySourceText('rust', '/* a */\nfn f() {} /* t */\n\nfn g() {\n    h(/* i */);\n}\n', 'rebuild');
		for (const text of [' a ', ' t ', ' i ']) {
			expect(source).toContain(`rs.build.blockComment.strict(rs.build.blockCommentRegular(${JSON.stringify(text)}))`);
		}
		expect(source).toContain('rs.build.arguments.strict().$trivia.inner(');
		expect(source).not.toContain('innerAt(');
		expect(source).not.toContain('.coerce(');
	});

	it('prints an empty owner of inner trivia through its no-argument form', async () => {
		const source = await emitFactorySourceText('rust', 'fn f() { // TODO\n}\n', 'rebuild');
		expect(source).toContain('rs.build.block.strict().$trivia.inner(rs.build.lineComment.strict(rs.build.lineCommentRegular(" TODO")))');
	});

	it('prints a leading comment through its kind builder', async () => {
		const source = await emitFactorySourceText('rust', '// hello\nfn main() {}\n', 'rebuildMain');
		expect(source).toContain('$trivia.leading(rs.build.lineComment.strict(rs.build.lineCommentRegular(" hello")))');
		expect(source).not.toMatch(/\$trivia\.leading\("/);
	});
	it('prints a token tree through its form with kind-id punctuation', async () => {
		const source = await emitFactorySourceText('rust', '#[derive(Debug, Clone)]\nstruct S;\n', 'rebuildDerive');
		expect(source).toContain('rs.build.delimTokenTreeParen.strict(');
		expect(source).toContain('rs.kinds.Comma');
		expect(source).not.toContain('tokenTreePunctuation');
	});
});

describe('emitFactorySourceText (real python grammar)', () => {
	it('resolves an identifier by text, never by name coincidence with a kind', async () => {
		const source = await emitFactorySourceText(
			'python',
			'def f(x: list) -> None:\n    return None\n',
			'rebuildF'
		);
		expect(source).toContain('py.build.identifier("list")');
		expect(source).toContain('py.kinds.None');
		expect(source).not.toContain('py.kinds.List');
	});
});

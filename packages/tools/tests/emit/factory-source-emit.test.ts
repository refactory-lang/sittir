import { describe, expect, it } from 'vitest';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';

describe('emitFactorySourceText (real rust grammar)', () => {
	it('prints a strict module for a one-function file', async () => {
		const source = await emitFactorySourceText('rust', 'fn main() {}\n', 'rebuildMain');
		expect(source).toContain("import { ir, TSKindId, Delimiter } from '@sittir/rust';");
		expect(source).toContain('export function rebuildMain() {');
		expect(source).toContain('ir.sourceFile.strict(');
		expect(source).toContain('name: ir.identifier("main")');
		expect(source).toContain('parameters: ir.parameters.strict()');
		expect(source).not.toContain('.coerce(');
	});
	// A comment rides the FOLLOWING node's `$_trivia` in the read data, and
	// A comment rides the FOLLOWING node's trivia; construction carries it onto
	// the built node, as the `$with` setters do, since trivia is not config.
	it('prints a leading comment as verbatim trivia', async () => {
		const source = await emitFactorySourceText('rust', '// hello\nfn main() {}\n', 'rebuildMain');
		expect(source).toContain('$trivia({ leading: ["// hello"] })');
	});
	it('prints a token tree through its form with kind-id punctuation', async () => {
		const source = await emitFactorySourceText('rust', '#[derive(Debug, Clone)]\nstruct S;\n', 'rebuildDerive');
		expect(source).toContain('ir.delimTokenTree.paren.strict(');
		expect(source).toContain('TSKindId.Comma');
		expect(source).not.toContain('tokenTreePunctuation');
	});
});

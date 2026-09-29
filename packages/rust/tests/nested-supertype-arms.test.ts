// A supertype nested under another supertype's arm surfaces the way a nested
// polymorph does: calling the parent resolves through each level's default
// arm, and every nested arm is reachable by name under each mount path.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';
import { ir } from '../src/ir.js';
import { TSKindId } from '../src/types.js';

function kindsOf(kind: number, value: unknown, out: string[] = []): string[] {
	if (Array.isArray(value)) for (const item of value) kindsOf(kind, item, out);
	else if (value !== null && typeof value === 'object') {
		const node = value as { $type?: unknown; $text?: unknown };
		if (node.$type === kind && typeof node.$text === 'string') out.push(node.$text);
		for (const child of Object.values(value)) kindsOf(kind, child, out);
	}
	return out;
}

describe('the nested escaped char literal supertype', () => {
	it('keeps the unnamed char literal call on its plain default', () => {
		expect(ir.charLiteral('a').$render()).toBe("'a'");
		expect(ir.charLiteral.plain('a').$render()).toBe("'a'");
	});

	it('resolves an unnamed escaped call through its simple default', () => {
		expect(ir.charLiteral.escaped('\\n').$render()).toBe("'\\n'");
		expect(ir.charLiteralEscaped('\\t').$render()).toBe("'\\t'");
	});

	it('reaches each nested arm by name, under every mount path', () => {
		expect(ir.charLiteral.escaped.simple('\\n').$render()).toBe("'\\n'");
		expect(ir.charLiteral.escaped.unicodeFixed('\\u0041').$render()).toBe("'\\u0041'");
		expect(ir.charLiteral.escaped.unicodeBraced('\\u{41}').$render()).toBe("'\\u{41}'");
		expect(ir.charLiteral.escaped.hex('\\x41').$render()).toBe("'\\x41'");
		expect(ir.literal.char.escaped('\\n').$render()).toBe("'\\n'");
		expect(ir.literalPattern.char.escaped.hex('\\x41').$render()).toBe("'\\x41'");
	});

	it('reads each arm back as its own kind', () => {
		const engine = createEngine();
		const root = engine.diagnostics.parseAndRead("const A: char = '\\n';\nconst B: char = '\\x41';\n", { deep: true }).root;
		expect(kindsOf(TSKindId.CharLiteralEscapedSimple, root)).toEqual(["'\\n'"]);
		expect(kindsOf(TSKindId.CharLiteralEscapedHex, root)).toEqual(["'\\x41'"]);
	});
});

describe('a supertype arm that already existed', () => {
	it('is reachable as a sub-factory arm with its own nested arms', () => {
		expect(ir.nonSpecialToken.integer.hex(255).$render()).toBe('0xff');
		expect(ir.nonSpecialToken.char.plain('a').$render()).toBe("'a'");
	});
});

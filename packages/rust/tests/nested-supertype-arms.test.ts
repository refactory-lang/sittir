// A supertype nested under another supertype's arm surfaces the way a nested
// polymorph does: calling the parent resolves through each level's default
// arm, and every nested arm is reachable by name under each mount path.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const rsNative = (await rust.load()).createNative();

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
		expect(rs.build.charLiteral('a').$render()).toBe("'a'");
		expect(rs.build.charLiteral.plain('a').$render()).toBe("'a'");
	});

	it('resolves an unnamed escaped call through its simple default', () => {
		expect(rs.build.charLiteral.escaped('\\n').$render()).toBe("'\\n'");
		expect(rs.build.charLiteralEscaped('\\t').$render()).toBe("'\\t'");
	});

	it('reaches each nested arm by name, under every mount path', () => {
		expect(rs.build.charLiteral.escaped.simple('\\n').$render()).toBe("'\\n'");
		expect(rs.build.charLiteral.escaped.unicodeFixed('\\u0041').$render()).toBe("'\\u0041'");
		expect(rs.build.charLiteral.escaped.unicodeBraced('\\u{41}').$render()).toBe("'\\u{41}'");
		expect(rs.build.charLiteral.escaped.hex('\\x41').$render()).toBe("'\\x41'");
		expect(rs.build.literal.char.escaped('\\n').$render()).toBe("'\\n'");
		expect(rs.build.literalPattern.char.escaped.hex('\\x41').$render()).toBe("'\\x41'");
	});

	it('reads each arm back as its own kind', () => {
		const root = rsNative.parseAndRead("const A: char = '\\n';\nconst B: char = '\\x41';\n", { deep: true }).root;
		expect(kindsOf(rs.kinds.CharLiteralEscapedSimple, root)).toEqual(["'\\n'"]);
		expect(kindsOf(rs.kinds.CharLiteralEscapedHex, root)).toEqual(["'\\x41'"]);
	});
});

describe('a supertype arm that already existed', () => {
	it('is reachable as a sub-factory arm with its own nested arms', () => {
		expect(rs.build.nonSpecialToken.integer.hex(255).$render()).toBe('0xff');
		expect(rs.build.nonSpecialToken.char.plain('a').$render()).toBe("'a'");
	});
});

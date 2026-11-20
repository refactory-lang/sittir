export const stringLiteral = (text: string): string => JSON.stringify(text);

const RUST_ESCAPES: Readonly<Record<string, string>> = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' };

export const rustStringLiteral = (text: string): string =>
	`"${text.replace(/[\\"\p{Cc}\u{FDD0}-\u{10FFFF}]/gu, (c) => RUST_ESCAPES[c] ?? `\\u{${c.codePointAt(0)!.toString(16).toUpperCase()}}`)}"`;

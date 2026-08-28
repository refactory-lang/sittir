const ASCII_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isAsciiIdentifier(value: string): boolean {
	return ASCII_IDENTIFIER_RE.test(value);
}

export const LAYOUT_SUPERTYPE = '_layout';
export const DEPTH_KINDS = ['indent', 'dedent'] as const;
export const INDENT_TEXT = '\u{FDD0}\n';
export const DEDENT_TEXT = '\u{FDD1}\n';
export const DEPTH_BREAK = '\n';
export function isDepthText(text: string): boolean {
	return text === INDENT_TEXT || text === DEDENT_TEXT;
}
export function depthBreakOf(text: string): string {
	return isDepthText(text) ? DEPTH_BREAK : text;
}
export type Whitespace = string;
export type Layout = string;
export const EMPTY_SEPARATOR_TOKEN = 'empty';
export const DELIMITER_LABEL = 'delimiter';
export const DELIMITER_ARMS = ['Delimiter.None', 'Delimiter.Leading', 'Delimiter.Trailing', 'Delimiter.Both'] as const;

export function isDelimiterArm(value: string): boolean {
	return (DELIMITER_ARMS as readonly string[]).includes(value);
}

export function isDelimiterAddress(address: string): boolean {
	return address.endsWith(`_${DELIMITER_LABEL}`);
}

export const SEPARATOR_LABEL = 'separator';
export const VARIANT_LABEL = 'variant';

export function isSeparatorAddress(address: string): boolean {
	return address.endsWith(`_${SEPARATOR_LABEL}`);
}

export type SeparatorSide = 'before' | 'after';
export type FlankSide = 'start' | 'end';

export function spacingLabel(token: string, side?: SeparatorSide): string {
	return side === undefined ? `${token}_separator_space` : `${token}_separator_space_${side}`;
}

const LABEL_TOKEN = '[A-Za-z][A-Za-z0-9_]*?';

const SPACING_LABEL = new RegExp(`^(${LABEL_TOKEN})_separator_space(?:_(before|after))?$`);

export function parseSpacingLabel(name: string): { readonly token: string; readonly side?: SeparatorSide } | undefined {
	const m = SPACING_LABEL.exec(name);
	if (!m) return undefined;
	const token = m[1]!;
	const side = m[2] as SeparatorSide | undefined;
	if (token === EMPTY_SEPARATOR_TOKEN) return side === undefined ? { token } : undefined;
	return side === undefined ? undefined : { token, side };
}

export function seamLabel(token: string, side: SeparatorSide): string {
	return `${token}_${side}`;
}

const SEAM_LABEL = new RegExp(`^(${LABEL_TOKEN})_(before|after)$`);

export function parseSeamLabel(name: string): { readonly token: string; readonly side: SeparatorSide } | undefined {
	if (parseSpacingLabel(name) !== undefined) return undefined;
	const m = SEAM_LABEL.exec(name);
	return m ? { token: m[1]!, side: m[2] as SeparatorSide } : undefined;
}

export function siteKey(slot: string, label: string): string {
	const spacing = parseSpacingLabel(label);
	if (spacing === undefined) return `${slot}_${label}`;
	return spacing.side === undefined ? `${slot}_separator_space` : `${slot}_separator_space_${spacing.side}`;
}

export function flankAddress(publicKind: string, side: FlankSide): string {
	return `${publicKind}_${side}`;
}

const FLANK_ADDRESS = new RegExp(`^(_*${LABEL_TOKEN})_(start|end)$`);

export function parseFlankAddress(key: string): { readonly kind: string; readonly side: FlankSide } | undefined {
	const m = FLANK_ADDRESS.exec(key);
	return m ? { kind: m[1]!, side: m[2] as FlankSide } : undefined;
}


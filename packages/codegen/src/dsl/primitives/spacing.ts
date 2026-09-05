export const SPACING_ARMS = ['tight', 'space', 'newline'] as const;
export type SpacingArm = (typeof SPACING_ARMS)[number];
export const SPACING_DEFAULT: SpacingArm = 'space';
export const FLANK_START_ARMS = ['tight', 'space', 'newline', 'indent'] as const;
export const FLANK_END_ARMS = ['tight', 'space', 'newline', 'dedent'] as const;
export const WHITESPACE_ARMS = ['tight', 'space', 'newline', 'indent', 'dedent'] as const;
export type WhitespaceArm = (typeof WHITESPACE_ARMS)[number];
export const FLANK_DEFAULT: WhitespaceArm = 'tight';
export const EMPTY_SEPARATOR_TOKEN = 'empty';
export const DELIMITER_LABEL = 'delimiter';

export type SeparatorSide = 'before' | 'after';
export type FlankSide = 'start' | 'end';

export function spacingLabel(token: string, side?: SeparatorSide): string {
	return side === undefined ? `${token}_separator_space` : `${token}_separator_space_${side}`;
}

const SPACING_LABEL = /^([a-z][a-z0-9_]*?)_separator_space(?:_(before|after))?$/;

export function parseSpacingLabel(name: string): { readonly token: string; readonly side?: SeparatorSide } | undefined {
	const m = SPACING_LABEL.exec(name);
	if (!m) return undefined;
	const token = m[1]!;
	const side = m[2] as SeparatorSide | undefined;
	if (token === EMPTY_SEPARATOR_TOKEN) return side === undefined ? { token } : undefined;
	return side === undefined ? undefined : { token, side };
}

export function siteKey(slot: string, label: string): string {
	const spacing = parseSpacingLabel(label);
	if (spacing === undefined) return `${slot}_${label}`;
	return spacing.side === undefined ? `${slot}_separator_space` : `${slot}_separator_space_${spacing.side}`;
}

export function flankAddress(publicKind: string, side: FlankSide): string {
	return `${publicKind}_${side}`;
}

const FLANK_ADDRESS = /^(_*[a-z][a-z0-9_]*?)_(start|end)$/;

export function parseFlankAddress(key: string): { readonly kind: string; readonly side: FlankSide } | undefined {
	const m = FLANK_ADDRESS.exec(key);
	return m ? { kind: m[1]!, side: m[2] as FlankSide } : undefined;
}

export function isSpacingArm(value: string): value is SpacingArm {
	return (SPACING_ARMS as readonly string[]).includes(value);
}

export function isWhitespaceArm(value: string): value is WhitespaceArm {
	return (WHITESPACE_ARMS as readonly string[]).includes(value);
}

export interface SiteDefault {
	readonly label?: string;
	readonly arm: string;
}

export interface RenderDefaults {
	readonly labels: Readonly<Record<string, string>>;
	readonly sites: Readonly<Record<string, Readonly<Record<string, SiteDefault>>>>;
}

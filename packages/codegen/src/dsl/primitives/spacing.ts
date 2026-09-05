export const SPACING_ARMS = ['tight', 'space', 'newline'] as const;
export type SpacingArm = (typeof SPACING_ARMS)[number];
export const SPACING_DEFAULT: SpacingArm = 'space';
export const EMPTY_SEPARATOR_TOKEN = 'empty';
export const DELIMITER_LABEL = 'delimiter';

export type SeparatorSide = 'before' | 'after';

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

export function isSpacingArm(value: string): value is SpacingArm {
	return (SPACING_ARMS as readonly string[]).includes(value);
}

export type RenderDefaults = Readonly<Record<string, string | Readonly<Record<string, string>>>>;

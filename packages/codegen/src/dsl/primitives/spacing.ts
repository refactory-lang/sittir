export const SPACING_ARMS = ['tight', 'space', 'newline'] as const;
export type SpacingArm = (typeof SPACING_ARMS)[number];
export const SPACING_DEFAULT: SpacingArm = 'space';
export const EMPTY_SEPARATOR_TOKEN = 'empty';
export const DELIMITER_LABEL = 'delimiter';

export type SeparatorSide = 'before' | 'after';

export function spacingLabel(token: string, side?: SeparatorSide): string {
	return side === undefined ? `${token}_separator_space` : `${token}_separator_space_${side}`;
}

export function isSpacingArm(value: string): value is SpacingArm {
	return (SPACING_ARMS as readonly string[]).includes(value);
}

export type RenderDefaults = Readonly<Record<string, string | Readonly<Record<string, string>>>>;

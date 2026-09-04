export const SPACING_ARMS = ['tight', 'space', 'newline'] as const;
export type SpacingArm = (typeof SPACING_ARMS)[number];
export const SPACING_DEFAULT: SpacingArm = 'space';
export const EMPTY_SEPARATOR_TOKEN = 'empty';
export const DELIMITER_LABEL = 'delimiter';

export type SeparatorSide = 'before' | 'after';

export interface SpacingPhantom {
	readonly token: string;
	readonly side?: SeparatorSide;
}

export function spacingPhantomKind(phantom: SpacingPhantom): string {
	return phantom.side === undefined
		? `${phantom.token}_separator_space`
		: `${phantom.token}_separator_space_${phantom.side}`;
}

const PHANTOM_KIND = /^_?([a-z][a-z0-9_]*?)_separator_space(?:_(before|after))?$/;

export function parseSpacingPhantomKind(name: string): SpacingPhantom | undefined {
	const m = PHANTOM_KIND.exec(name);
	if (!m) return undefined;
	const token = m[1]!;
	const side = m[2] as SeparatorSide | undefined;
	if (token === EMPTY_SEPARATOR_TOKEN) return side === undefined ? { token } : undefined;
	return side === undefined ? undefined : { token, side };
}

export function isSpacingArm(value: string): value is SpacingArm {
	return (SPACING_ARMS as readonly string[]).includes(value);
}

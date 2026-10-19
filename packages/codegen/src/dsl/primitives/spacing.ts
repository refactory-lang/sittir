import type { FlankSide, SeparatorSide, SpacingAddress } from '../../types/spacing.ts';

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

export function spacingLabelOf(address: SpacingAddress): string {
	switch (address.at) {
		case 'separator':
			return address.side === undefined ? `${address.token}_separator_space` : `${address.token}_separator_space_${address.side}`;
		case 'seam':
			return `${address.token}_${address.side}`;
		case 'flank':
			return `${address.kind}_${address.side}`;
	}
}

export function siteKey(slot: string, address: SpacingAddress): string {
	return address.at === 'separator' ? spacingLabelOf({ ...address, token: slot }) : `${slot}_${spacingLabelOf(address)}`;
}

const LABEL_TOKEN = '[A-Za-z][A-Za-z0-9_]*?';

const SPACING_LABEL = new RegExp(`^(${LABEL_TOKEN})_separator_space(?:_(before|after))?$`);

const SEAM_LABEL = new RegExp(`^(${LABEL_TOKEN})_(before|after)$`);

const FLANK_ADDRESS = new RegExp(`^(_*${LABEL_TOKEN})_(start|end)$`);

export function parseSpacingAddress(key: string): SpacingAddress | undefined {
	const separator = SPACING_LABEL.exec(key);
	if (separator) {
		const token = separator[1]!;
		const side = separator[2] as SeparatorSide | undefined;
		if ((token === EMPTY_SEPARATOR_TOKEN) === (side === undefined)) {
			return side === undefined ? { at: 'separator', token } : { at: 'separator', token, side };
		}
	}
	const seam = SEAM_LABEL.exec(key);
	if (seam) return { at: 'seam', token: seam[1]!, side: seam[2] as SeparatorSide };
	const flank = FLANK_ADDRESS.exec(key);
	return flank ? { at: 'flank', kind: flank[1]!, side: flank[2] as FlankSide } : undefined;
}


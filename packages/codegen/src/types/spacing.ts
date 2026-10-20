export type SeparatorSide = 'before' | 'after';

export type FlankSide = 'start' | 'end';

export type SpacingAddress =
	| { readonly at: 'separator'; readonly token: string; readonly side?: SeparatorSide }
	| { readonly at: 'seam'; readonly token: string; readonly side: SeparatorSide }
	| { readonly at: 'flank'; readonly kind: string; readonly side: FlankSide };

export type SeamAddress = Extract<SpacingAddress, { readonly at: 'seam' }>;

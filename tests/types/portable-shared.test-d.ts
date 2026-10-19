import { portable } from '@sittir/common/portable';

declare const value: unknown;

if (portable.is.declaration.function(value)) {
	const kind: number = value.$type;
	void kind;
}

if (portable.is.declaration(value)) void value.$type;

export const path: 'declaration.function' = portable.kinds.declaration.function.$path;
export const root: 'declaration' = portable.kinds.declaration.$path;

// @ts-expect-error the vocabulary has no `declaration.nothing`
void portable.is.declaration.nothing;
// @ts-expect-error the vocabulary has no `declaration.nothing`
void portable.kinds.declaration.nothing;

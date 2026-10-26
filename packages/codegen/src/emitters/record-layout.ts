import type { NodeSlotShape } from './render-module.ts';

export const RECORD_HEADER_WORDS = 2;

export const INLINE_HEADER_WORDS = 2;

export const PRESENCE_BITS_PER_WORD = 32;

export const CELL_WORDS = { node: 5, text: 4, list: 2 } as const;

export type RecordForm =
	| { readonly tag: 'bit' }
	| { readonly tag: 'cell'; readonly width: number; readonly run?: number; readonly inline?: number };

export interface RecordField {
	readonly field: string;
	readonly form: RecordForm;
}

export type RecordPlace =
	| { readonly field: string; readonly word: number; readonly bit: number }
	| {
			readonly field: string;
			readonly word: number;
			readonly width: number;
			readonly run?: number;
			readonly inline?: number;
	  };

export interface RecordLayout {
	readonly words: number;
	readonly places: readonly RecordPlace[];
}

export function slotRecordForm(shape: NodeSlotShape, multiple: boolean, inline = 0): RecordForm {
	if (shape.tag === 'presence') return { tag: 'bit' };
	const item = shape.tag === 'text' ? CELL_WORDS.text : CELL_WORDS.node;
	if (multiple) return { tag: 'cell', width: CELL_WORDS.list, run: item };
	return inline === 0
		? { tag: 'cell', width: item }
		: { tag: 'cell', width: Math.max(item, INLINE_HEADER_WORDS + inline), inline };
}

export function recordLayoutOf(fields: readonly RecordField[]): RecordLayout {
	const bits = fields.filter(({ form }) => form.tag === 'bit').length;
	let nextBit = 0;
	let nextWord = RECORD_HEADER_WORDS + Math.ceil(bits / PRESENCE_BITS_PER_WORD);
	const places = fields.map(({ field, form }): RecordPlace => {
		if (form.tag === 'bit') {
			const at = nextBit++;
			return {
				field,
				word: RECORD_HEADER_WORDS + Math.floor(at / PRESENCE_BITS_PER_WORD),
				bit: at % PRESENCE_BITS_PER_WORD
			};
		}
		const word = nextWord;
		nextWord += form.width;
		return {
			field,
			word,
			width: form.width,
			...(form.run === undefined ? {} : { run: form.run }),
			...(form.inline === undefined ? {} : { inline: form.inline })
		};
	});
	return { words: nextWord, places };
}

export function recordArgs(place: RecordPlace): string {
	if ('bit' in place) return `word = ${place.word}, bit = ${place.bit}`;
	const run = place.run === undefined ? '' : `, run = ${place.run}`;
	const inline = place.inline === undefined ? '' : `, inline = ${place.inline}`;
	return `word = ${place.word}, width = ${place.width}${run}${inline}`;
}

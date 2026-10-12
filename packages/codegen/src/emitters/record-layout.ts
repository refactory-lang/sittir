import type { TransportSlotShape } from './render-module.ts';

export const RECORD_HEADER_WORDS = 2;

export const PRESENCE_BITS_PER_WORD = 32;

export const CELL_WORDS = { node: 5, text: 4, list: 2, scalar: 1 } as const;

export type RecordForm = { readonly tag: 'bit' } | { readonly tag: 'cell'; readonly width: number; readonly run?: number };

export interface RecordField {
	readonly field: string;
	readonly form: RecordForm;
}

export type RecordPlace =
	| { readonly field: string; readonly word: number; readonly bit: number }
	| { readonly field: string; readonly word: number; readonly width: number; readonly run?: number };

export interface RecordLayout {
	readonly words: number;
	readonly places: readonly RecordPlace[];
}

export function slotRecordForm(shape: TransportSlotShape, multiple: boolean): RecordForm {
	if (shape.tag === 'presence') return { tag: 'bit' };
	const item = shape.tag === 'text' ? CELL_WORDS.text : CELL_WORDS.node;
	return multiple ? { tag: 'cell', width: CELL_WORDS.list, run: item } : { tag: 'cell', width: item };
}

export function recordLayoutOf(fields: readonly RecordField[]): RecordLayout {
	const bits = fields.filter(({ form }) => form.tag === 'bit').length;
	let nextBit = 0;
	let nextWord = RECORD_HEADER_WORDS + Math.ceil(bits / PRESENCE_BITS_PER_WORD);
	const places = fields.map(({ field, form }): RecordPlace => {
		if (form.tag === 'bit') {
			const at = nextBit++;
			return { field, word: RECORD_HEADER_WORDS + Math.floor(at / PRESENCE_BITS_PER_WORD), bit: at % PRESENCE_BITS_PER_WORD };
		}
		const word = nextWord;
		nextWord += form.width;
		return form.run === undefined ? { field, word, width: form.width } : { field, word, width: form.width, run: form.run };
	});
	return { words: nextWord, places };
}

export function recordAttr(place: RecordPlace): string {
	if ('bit' in place) return `#[record(word = ${place.word}, bit = ${place.bit})]`;
	const run = place.run === undefined ? '' : `, run = ${place.run}`;
	return `#[record(word = ${place.word}, width = ${place.width}${run})]`;
}

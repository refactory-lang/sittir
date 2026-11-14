export const RECORD_HEADER_WORDS = 2;

export const PRESENCE_BITS_PER_WORD = 32;

export const STORED = { record: 1, leaf: 2, unit: 4, text: 8, blank: 16 } as const;

export const FORM = { node: 1, unit: 2, text: 4, blank: 16 } as const;

const NAMED_FORMS = FORM.node | FORM.unit | FORM.text;

const FORM_WORDS = { node: 3, unit: 1, text: 2 } as const;

export function formsOf(stored: number): number {
	let forms = 0;
	if ((stored & (STORED.record | STORED.leaf)) !== 0) forms |= FORM.node;
	if ((stored & STORED.unit) !== 0) forms |= FORM.unit;
	if ((stored & STORED.text) !== 0) forms |= FORM.text;
	if ((stored & STORED.blank) !== 0) forms |= FORM.unit | FORM.blank;
	return forms;
}

export function isTagged(forms: number): boolean {
	const named = forms & NAMED_FORMS;
	return (named & (named - 1)) !== 0;
}

export function parsedWidth(forms: number): number {
	const widest = Math.max(
		(forms & FORM.node) !== 0 ? FORM_WORDS.node : 0,
		(forms & FORM.unit) !== 0 ? FORM_WORDS.unit : 0,
		(forms & FORM.text) !== 0 ? FORM_WORDS.text : 0
	);
	return isTagged(forms) ? widest + 1 : widest;
}

export type RecordForm =
	| { readonly tag: 'bit' }
	| { readonly tag: 'cell'; readonly forms: number; readonly width: number; readonly run?: number };

export interface RecordField {
	readonly field: string;
	readonly form: RecordForm;
}

export type RecordPlace =
	| { readonly field: string; readonly word: number; readonly bit: number }
	| {
			readonly field: string;
			readonly word: number;
			readonly forms: number;
			readonly width: number;
			readonly run?: number;
			readonly built: number;
	  };

export interface RecordLayout {
	readonly words: number;
	readonly builtWords: number;
	readonly places: readonly RecordPlace[];
}

export function slotRecordForm(presence: boolean, stored: number, multiple: boolean): RecordForm {
	if (presence) return { tag: 'bit' };
	const forms = formsOf(stored);
	return multiple ? { tag: 'cell', forms, width: 1, run: parsedWidth(forms) } : { tag: 'cell', forms, width: parsedWidth(forms) };
}

export function firstBuiltCell(layout: RecordLayout): number {
	return layout.places.reduce((first, place) => ('built' in place ? Math.min(first, place.built) : first), layout.builtWords);
}

export function recordLayoutOf(fields: readonly RecordField[]): RecordLayout {
	const bits = fields.filter(({ form }) => form.tag === 'bit').length;
	let nextBit = 0;
	let nextWord = RECORD_HEADER_WORDS + Math.ceil(bits / PRESENCE_BITS_PER_WORD);
	let nextBuilt = nextWord;
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
			forms: form.forms,
			width: form.width,
			...(form.run === undefined ? {} : { run: form.run }),
			built: nextBuilt++
		};
	});
	return { words: nextWord, builtWords: nextBuilt, places };
}

export function recordArgs(place: RecordPlace): string {
	if ('bit' in place) return `word = ${place.word}, bit = ${place.bit}`;
	const run = place.run === undefined ? '' : `, run = ${place.run}`;
	return `word = ${place.word}, width = ${place.width}${run}, forms = ${place.forms}, built = ${place.built}`;
}

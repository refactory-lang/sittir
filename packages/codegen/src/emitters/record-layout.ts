export const RECORD_HEADER_WORDS = 2;

export const PRESENCE_BITS_PER_WORD = 32;

export const STORED = { record: 1, leaf: 2, unit: 4, text: 8, blank: 16 } as const;

export const FORM = { node: 1, unit: 2, text: 4, inline: 8, blank: 16 } as const;

const NAMED_FORMS = FORM.node | FORM.unit | FORM.text | FORM.inline;

const FORM_WORDS = { node: 3, unit: 1, text: 2 } as const;

export function formsOf(stored: number, inline: boolean): number {
	let forms = 0;
	if ((stored & STORED.record) !== 0) forms |= inline ? FORM.inline : FORM.node;
	if ((stored & STORED.leaf) !== 0) forms |= FORM.node;
	if ((stored & STORED.unit) !== 0) forms |= FORM.unit;
	if ((stored & STORED.text) !== 0) forms |= FORM.text;
	if ((stored & STORED.blank) !== 0) forms |= FORM.unit | FORM.blank;
	return forms;
}

export function isTagged(forms: number): boolean {
	const named = forms & NAMED_FORMS;
	return (named & (named - 1)) !== 0;
}

export function parsedWidth(forms: number, inline: number): number {
	const widest = Math.max(
		(forms & FORM.node) !== 0 ? FORM_WORDS.node : 0,
		(forms & FORM.unit) !== 0 ? FORM_WORDS.unit : 0,
		(forms & FORM.text) !== 0 ? FORM_WORDS.text : 0,
		(forms & FORM.inline) !== 0 ? inline : 0
	);
	return isTagged(forms) ? widest + 1 : widest;
}

export type RecordForm =
	| { readonly tag: 'bit' }
	| { readonly tag: 'cell'; readonly forms: number; readonly width: number; readonly run?: number; readonly inline?: number };

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
			readonly inline?: number;
			readonly built: number;
	  };

export interface RecordLayout {
	readonly words: number;
	readonly builtWords: number;
	readonly places: readonly RecordPlace[];
}

export function slotRecordForm(presence: boolean, stored: number, multiple: boolean, inline = 0): RecordForm {
	if (presence) return { tag: 'bit' };
	if (multiple) {
		const forms = formsOf(stored, false);
		return { tag: 'cell', forms, width: 1, run: parsedWidth(forms, 0) };
	}
	const forms = formsOf(stored, inline > 0);
	return (forms & FORM.inline) === 0
		? { tag: 'cell', forms, width: parsedWidth(forms, 0) }
		: { tag: 'cell', forms, width: parsedWidth(forms, inline), inline };
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
			...(form.inline === undefined ? {} : { inline: form.inline }),
			built: nextBuilt++
		};
	});
	return { words: nextWord, builtWords: nextBuilt, places };
}

export function recordArgs(place: RecordPlace): string {
	if ('bit' in place) return `word = ${place.word}, bit = ${place.bit}`;
	const run = place.run === undefined ? '' : `, run = ${place.run}`;
	const inline = place.inline === undefined ? '' : `, inline = ${place.inline}`;
	return `word = ${place.word}, width = ${place.width}${run}${inline}, forms = ${place.forms}, built = ${place.built}`;
}

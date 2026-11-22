import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import regex from '../src/index.ts';

const rx = await sharedEngine(() => createEngine(regex));
const b = rx.build;

type Quantifier = { readonly $type: number; readonly $with: { lazy(value: boolean): { $render(): { toString(): string } } } };

function countQuantifierOf(source: string): Quantifier {
	const nodes = [...(rx.parse(source) as unknown as { $query(): { $descendants: Iterable<Quantifier> } }).$query().$descendants];
	return nodes.find((node) => node.$type === rx.kinds.CountQuantifier)!;
}

const FORMS = ['{2}', '{2,}', '{2,5}', '{,5}'] as const;

const digits = (text: string) => b.decimalDigits(text);
const BUILT = [
	['{2}', (lazy: boolean) => b.countQuantifier.arm({ decimalDigits: digits('2'), lazy })],
	['{2,}', (lazy: boolean) => b.countQuantifier.arm({ decimalDigits: digits('2'), countQuantifierGroup: {}, lazy })],
	['{2,5}', (lazy: boolean) => b.countQuantifier.arm({ decimalDigits: digits('2'), countQuantifierGroup: { decimalDigits: digits('5') }, lazy })],
	['{,5}', (lazy: boolean) => b.countQuantifier({ content: digits('5'), lazy })]
] as const;

describe('a count quantifier keeps each form through a parse, an edit and a build', () => {
	it.each(FORMS.flatMap((form) => [form, `${form}?`]))('a%s renders back unchanged', (form) => {
		expect(rx.render(rx.parse(`a${form}`)).toString()).toBe(`a${form}`);
	});

	it.each(FORMS)('a%s made lazy by an edit renders its lazy form', (form) => {
		expect(countQuantifierOf(`a${form}`).$with.lazy(true).$render().toString()).toBe(`${form}?`);
	});

	it.each(FORMS)('a%s? made eager by an edit renders without the ?', (form) => {
		expect(countQuantifierOf(`a${form}?`).$with.lazy(false).$render().toString()).toBe(form);
	});

	it.each(BUILT)('builds %s, and its lazy form', (form, build) => {
		expect(build(false).$render().toString()).toBe(form);
		expect(build(true).$render().toString()).toBe(`${form}?`);
	});
});

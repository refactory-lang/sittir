import { describe, expect, it } from 'vitest';
import { assertEnvelopeExtrasPinned, type EnvelopeClaims, type EnvelopePin } from '../envelope-claims.ts';

const kinds = [
	{ kind: 'property_name', id: 10 },
	{ kind: 'a_keyword', id: 11 },
	{ kind: 'b_keyword', id: 12 }
];
const VARIANT = 'MemberPropertyTransportSlot.PropertyName';
const pins: Readonly<Record<string, EnvelopePin>> = { [VARIANT]: { display: 'property_name', extras: ['a_keyword', 'b_keyword'] } };
const claims = (display: number, extras: number[]): ReadonlyMap<string, EnvelopeClaims> => new Map([[VARIANT, { display, extras }]]);
const printed = new Set(['MemberPropertyTransportSlot']);
const check = (given: Readonly<Record<string, EnvelopePin>> | undefined, actual = claims(10, [11, 12]), enums = printed, entries = kinds) =>
	assertEnvelopeExtrasPinned('typescript', given, actual, enums, entries);

describe('assertEnvelopeExtrasPinned', () => {
	it('checks nothing without a pin table', () => {
		expect(() => check(undefined, claims(10, [11, 12, 99]), new Set())).not.toThrow();
	});

	it('accepts claims that match the pin by kind name, whatever their ids are', () => {
		expect(() => check(pins)).not.toThrow();
		const renumbered = [
			{ kind: 'property_name', id: 300 },
			{ kind: 'a_keyword', id: 301 },
			{ kind: 'b_keyword', id: 302 }
		];
		expect(() => check(pins, claims(300, [301, 302]), printed, renumbered)).not.toThrow();
	});

	it('refuses a pin whose enum the generation did not print, naming the entry', () => {
		expect(() => check(pins, claims(10, [11, 12]), new Set())).toThrow(`typescript ${VARIANT} pins an enum codegen does not print`);
	});

	it('refuses a pin that names a kind the grammar does not have', () => {
		const lost = { [VARIANT]: { display: 'property_name', extras: ['a_keyword', 'gone_keyword'] } };
		expect(() => check(lost)).toThrow("pins kind 'gone_keyword'");
	});

	it('refuses a claimed kind no pin allows, a changed display, and a dropped claim', () => {
		expect(() => check(pins, claims(10, [11, 12, 10]))).toThrow('claims kinds property_name beyond its display kind');
		expect(() => check(pins, claims(11, [11, 12]))).toThrow('displays as kind a_keyword, not its pinned property_name');
		expect(() => check(pins, claims(10, [11]))).toThrow('no longer claims kinds b_keyword');
	});

	it('refuses a pinned variant that is no longer an envelope, and a claim with no pin', () => {
		expect(() => check(pins, new Map())).toThrow('is no longer an envelope variant');
		expect(() => check({}, claims(10, [11]))).toThrow('claims kinds a_keyword beyond its display kind');
	});
});

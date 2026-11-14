import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExternalRole } from '../../../types/ir.ts';
import {
	JOIN_SEAMS_FILE,
	joinSeamsFileOf,
	printJoinSeams,
	readJoinSeams,
	settleJoinSeams,
	unprovenArms,
	type JoinSeamsFile,
	type JoinStamp
} from '../join-seams/file.ts';
import { joinInputsHash } from '../join-seams/index.ts';
import { CharSet } from '../pattern-automaton.ts';

const stamp: JoinStamp = { parser: { source: 's1', wasm: 'w1' }, inputs: 'i1' };

const file = joinSeamsFileOf(stamp, {
	seams: [
		{ seam: 'b:members.1', next: 'unproven' },
		{ seam: 'a:members.0', previous: 'proven', next: 'proven' }
	],
	pairs: [
		{ pair: '<<', proof: 'unproven' },
		{ pair: '!=', proof: 'proven' }
	],
	joinsNextKinds: ['<', '!'],
	blocked: [{ seam: 'b:members.1', state: 7, previous: '<', next: '<', reason: 'no sighting' }]
});

describe('the join seams file', () => {
	it('prints its stamp, then one sorted record per line', () => {
		expect(printJoinSeams(file)).toBe(
			[
				'{',
				'\t"parser": {',
				'\t\t"source": "s1",',
				'\t\t"wasm": "w1"',
				'\t},',
				'\t"inputs": "i1",',
				'\t"seams": [',
				'\t\t{"seam":"a:members.0","previous":"proven","next":"proven"},',
				'\t\t{"seam":"b:members.1","next":"unproven"}',
				'\t],',
				'\t"pairs": [',
				'\t\t{"pair":"!=","proof":"proven"},',
				'\t\t{"pair":"<<","proof":"unproven"}',
				'\t],',
				'\t"joinsNextKinds": [',
				'\t\t"!",',
				'\t\t"<"',
				'\t],',
				'\t"blocked": [',
				'\t\t{"seam":"b:members.1","state":7,"previous":"<","next":"<","reason":"no sighting"}',
				'\t]',
				'}',
				''
			].join('\n')
		);
	});

	it('reads back what it prints, and nothing where there is no file', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-join-seams-'));
		expect(readJoinSeams(dir)).toBeUndefined();
		writeFileSync(join(dir, JOIN_SEAMS_FILE), printJoinSeams(file));
		expect(readJoinSeams(dir)).toEqual(file);
	});

	it('lists the arms and pairs no parse proved', () => {
		expect(unprovenArms(file)).toEqual({ previous: [], next: ['b:members.1'], pairs: ['<<'] });
	});
});

describe('settleJoinSeams', () => {
	const current: JoinStamp = { parser: { source: 's1', wasm: 'w2' }, inputs: 'i2' };
	const derived = joinSeamsFileOf(current, { seams: [], pairs: [], joinsNextKinds: [], blocked: [] });
	const derive = (): JoinSeamsFile => derived;
	const refuse = (): JoinSeamsFile => {
		throw new Error('derived');
	};

	it('reuses a saved file whose stamp matches, without deriving', () => {
		expect(settleJoinSeams(file, stamp, false, refuse)).toEqual({ file, derived: false });
	});

	it('names each part of the stamp that moved when the caller may not re-derive', () => {
		expect(settleJoinSeams(file, current, false, refuse)).toEqual({ stale: ['parser.wasm', 'join inputs'] });
	});

	it('re-derives a stale file when the caller may', () => {
		expect(settleJoinSeams(file, current, true, derive)).toEqual({ file: derived, derived: true });
	});

	it('derives when there is no saved file', () => {
		expect(settleJoinSeams(undefined, current, false, derive)).toEqual({ file: derived, derived: true });
	});
});

describe('joinInputsHash', () => {
	const externalRoles: ReadonlyMap<string, ExternalRole['role']> = new Map([
		['_newline', 'newline'],
		['_indent', 'indent']
	]);
	const inputs = {
		externalRoles,
		externalBodies: new Map(),
		wordMatcher: /[a-z_]+/,
		whitespace: CharSet.EMPTY,
		lineEnds: new Set(['a', 'b'])
	};

	it('does not depend on the order its maps and sets were filled in', () => {
		expect(
			joinInputsHash({ ...inputs, externalRoles: new Map([...externalRoles].reverse()), lineEnds: new Set(['b', 'a']) })
		).toBe(joinInputsHash(inputs));
	});

	it('moves with an external role the grammar declares', () => {
		expect(joinInputsHash({ ...inputs, externalRoles: new Map([['_newline', 'newline']]) })).not.toBe(
			joinInputsHash(inputs)
		);
	});

	it('moves with the word pattern and the kinds that end a line', () => {
		expect(joinInputsHash({ ...inputs, wordMatcher: /[a-z]+/ })).not.toBe(joinInputsHash(inputs));
		expect(joinInputsHash({ ...inputs, lineEnds: new Set(['a']) })).not.toBe(joinInputsHash(inputs));
	});
});

import { describe, expect, it } from 'vitest';
import { EMPTY_CONFLICT_RESOLUTIONS } from '../conflict-resolutions.ts';
import { enrichSidecarsOf } from '../enrich.ts';
import { layerRecordOf, withLayerRecord, type LayerRecord } from '../layer-record.ts';

const SENTINEL = 'layer-record-sentinel';

const record = (depth: number): LayerRecord => ({
	depth,
	upstream: { name: SENTINEL, rules: {} },
	sidecars: enrichSidecarsOf({}),
	resolutions: EMPTY_CONFLICT_RESOLUTIONS,
	deadMints: new Set([SENTINEL]),
	textTokens: [SENTINEL],
	liftNames: new Map(),
	effects: [{ kind: 'alias', from: SENTINEL, to: `${SENTINEL}_to` }],
	records: { options: { [SENTINEL]: {} } }
});

describe('the layer record', () => {
	it("rides on a fresh copy of the start rule's body, out of its enumerable keys", () => {
		const start = { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'item' }] };
		const body = withLayerRecord(start, record(2));
		expect(body).not.toBe(start);
		expect(body).toEqual(start);
		expect(Object.keys(body)).toEqual(Object.keys(start));
		expect(layerRecordOf({ grammar: { rules: { start } } })).toBeUndefined();
	});

	it("is read from a result's first rule, and from no other", () => {
		const first = record(2);
		const result = {
			grammar: {
				name: 'layer',
				rules: { start: withLayerRecord({ type: 'SYMBOL', name: 'item' }, first), item: withLayerRecord({ type: 'BLANK' }, record(3)) }
			}
		};
		expect(layerRecordOf(result)).toBe(first);
		expect(layerRecordOf({ grammar: { rules: { item: { type: 'BLANK' }, start: result.grammar.rules.start } } })).toBeUndefined();
		expect(layerRecordOf({ grammar: { rules: {} } })).toBeUndefined();
		expect(layerRecordOf(undefined)).toBeUndefined();
	});

	it("stays out of the result's JSON, and out of a spread copy of the body", () => {
		const body = withLayerRecord({ type: 'BLANK' }, record(2));
		const result = { grammar: { name: 'layer', rules: { start: body } } };
		expect(JSON.stringify(result)).not.toContain(SENTINEL);
		expect(layerRecordOf({ grammar: { rules: { start: { ...body } } } })).toBeUndefined();
	});
});

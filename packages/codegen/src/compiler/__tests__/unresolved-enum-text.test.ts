import { describe, expect, it } from 'vitest';
import { diagnosePredicted, predictedRawGrammarOf } from '../../__tests__/helpers/linked.ts';
import { unresolvedEnumTexts } from '../model/node-map.ts';

const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });
const sym = (name: string) => ({ type: 'SYMBOL', name });

const channel = (...prefixes: unknown[][]) =>
	predictedRawGrammarOf({
		program: sym('channel'),
		channel: choice(...prefixes.map((prefix) => seq(...prefix, field('value', sym('item'))))),
		item: { type: 'PATTERN', value: '[a-z]+' }
	});

describe('an enum slot value spelled by several tokens', () => {
	it('is a blocking grammar diagnostic naming the kind, the slot and the text', () => {
		const result = diagnosePredicted(channel([str('chan')], [str('chan'), str('<-')], [str('<-'), str('chan')]));
		const record = result.diagnostics.find((d) => d.code === 'unresolved-enum-text');
		expect(record).toMatchObject({ ownerKind: 'channel', canProceed: false, severity: 'error' });
		expect(record?.message).toContain('channel');
		expect(record?.message).toContain('operator');
		expect(record?.message).toContain('chan<-');
		expect(record?.proposal).toContain('variant(');
	});

	it('is classified a text slot, not a kind-id enum, so floored it never reaches the kind-id emitters', () => {
		const result = diagnosePredicted(channel([str('chan')], [str('chan'), str('<-')], [str('<-'), str('chan')]));
		const slot = result.nodeMap.nodes.get('channel')?.slots.find((s) => s.name === 'operator');
		expect(slot?.storageInfo?.kind).toBe('verbatim');
	});

	it('does not fire when every alternative is one token', () => {
		const result = diagnosePredicted(channel([str('+')], [str('-')], [str('*')]));
		expect(result.diagnostics.filter((d) => d.code === 'unresolved-enum-text')).toEqual([]);
		expect(result.nodeMap.nodes.get('channel')?.slots.find((s) => s.name === 'operator')?.storageInfo?.kind).toBe('kindEnum');
	});
});

describe('unresolvedEnumTexts', () => {
	it('is the texts no arm carries', () => {
		expect(unresolvedEnumTexts(['chan', 'chan<-', '<-chan'], { arms: [{ text: 'chan' }] })).toEqual(['chan<-', '<-chan']);
		expect(unresolvedEnumTexts(['+', '-'], { arms: [{ text: '+' }, { text: '-' }] })).toEqual([]);
	});
});

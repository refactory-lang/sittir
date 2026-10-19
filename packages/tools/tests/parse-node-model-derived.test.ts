import { describe, expect, it } from 'vitest';
import { parseNodeModel } from '../src/validate/common.ts';

const MODEL = JSON.stringify({
	name: 'g',
	root: 'program',
	nodes: [
		{
			kind: 'call',
			modelType: 'branch',
			typeName: 'Call',
			factoryShape: 'config',
			slots: [
				{
					name: 'function',
					required: true,
					multiple: false,
					nonEmpty: false,
					storage: 'verbatim',
					values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'identifier' }]
				},
				{
					name: 'argument',
					required: false,
					multiple: true,
					nonEmpty: false,
					storage: 'verbatim',
					registered: true,
					optionDefault: 'comma',
					values: [
						{ kind: 'node-ref', multiplicity: 'array', name: '_expression', parseKind: 'expression' },
						{ kind: 'node-ref', multiplicity: 'array', parseKind: 'spread', default: true }
					]
				}
			]
		},
		{
			kind: '_hidden_envelope',
			modelType: 'envelope',
			typeName: 'HiddenEnvelope',
			slots: [{ name: 'identifier', required: true, multiple: false, nonEmpty: false, storage: 'verbatim', values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'identifier' }] }]
		}
	]
});

describe('parseNodeModel derives what the node model leaves out', () => {
	it('reads a slot\'s kinds as its values\' names, where a name the record omits is the parse kind', () => {
		expect(parseNodeModel(MODEL).slotKinds.call).toEqual({ function: ['identifier'], argument: ['_expression', 'spread'] });
	});

	it('reads a default value\'s name the same way', () => {
		expect(parseNodeModel(MODEL).slotDefaults.call).toEqual({ argument: 'spread' });
	});

	it('gives every kind with a factory its slots\' factory metadata, the option default included', () => {
		expect(parseNodeModel(MODEL).factorySlots).toEqual({
			call: {
				function: { required: true, multiple: false, nonEmpty: false },
				argument: { required: false, multiple: true, nonEmpty: false, registered: true, optionDefault: 'comma' }
			}
		});
	});
});

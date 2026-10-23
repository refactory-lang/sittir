import { describe, expect, it, vi } from 'vitest';
import {
	buildFactoryNodeFromReference,
	nodeToConfig,
	type FactoryDispatchArtifacts,
	type IrSurface,
	type SeatTable
} from '../validate/common.ts';

const KINDS = [
	'clause',
	'_clause_group',
	'comparison',
	'_comparison_comparator',
	'header',
	'_header_kind',
	'tree',
	'_tree_paren',
	'block',
	'_block_arms',
	'tok',
	'other',
	'_kind_left',
	'arm'
];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];

const slot = (propertyName: string, multiple = false) => ({ propertyName, unnamed: false, slotCount: 1, required: false, multiple, nonEmpty: false });

const factorySlots = {
	clause: { clause_group: slot('clauseGroup'), body: slot('body') },
	_clause_group: { parameter: slot('parameter'), type: slot('type') },
	comparison: { left: slot('left'), comparators: slot('comparators', true) },
	_comparison_comparator: { operators: slot('operators'), right: slot('right') },
	header: { content: slot('content'), name: slot('name') },
	_header_kind: { kind: slot('kind'), left: slot('left') },
	tree: { content: slot('content') },
	_tree_paren: { tokens: slot('tokens', true) },
	block: { arms: slot('arms') },
	_block_arms: { arm: slot('arm', true), last: slot('last') }
};

const factoryFields = { _tree_paren: ['tokens'] };

const factoryShapes = {
	clause: 'config',
	_clause_group: 'config',
	comparison: 'config',
	_comparison_comparator: 'config',
	header: 'config',
	_header_kind: 'config',
	tree: 'direct',
	_tree_paren: 'spread',
	block: 'forwarded',
	_block_arms: 'config',
	tok: 'text'
} as const;

const seats: SeatTable = {
	clause: { clause_group: { _clause_group: { kind: '_clause_group', shape: 'flatten' } } },
	comparison: { comparators: { _comparison_comparator: { kind: '_comparison_comparator', shape: 'elements' } } },
	header: {
		content: {
			_header_kind: { kind: '_header_kind', shape: 'arm', mount: 'kind' },
			tok: { kind: 'tok', shape: 'arm', mount: 'tok' }
		}
	},
	tree: { content: { _tree_paren: { kind: '_tree_paren', shape: 'arm', mount: 'paren' } } },
	block: { arms: { _block_arms: { kind: '_block_arms', shape: 'flatten' } } }
};

function surfaceWith(entries: IrSurface['entries']): IrSurface {
	return { entries, seats, modelTypes: { tok: 'keyword' } };
}

const opts = { factorySlots, factoryShapes, factoryFields, surface: surfaceWith({}), kindNameFromId };

describe('nodeToConfig projects a hoisted child by its seat on the ir surface', () => {
	it('flattens a flattened seat child into the parent config', () => {
		const data = {
			$type: id('clause'),
			_clause_group: { $type: id('_clause_group'), _parameter: 'e', _type: 'E' },
			_body: 'x'
		};
		expect(nodeToConfig(data as never, opts)).toEqual({ parameter: 'e', type: 'E', body: 'x' });
	});

	it('keeps an elements seat child as a config object', () => {
		const data = {
			$type: id('comparison'),
			_left: 'x',
			_comparators: [{ $type: id('_comparison_comparator'), _operators: 7, _right: 'y' }]
		};
		expect(nodeToConfig(data as never, opts)).toEqual({ left: 'x', comparators: [{ operators: 7, right: 'y' }] });
	});

	it('flattens a config-shaped arm child into a config parent', () => {
		const data = { $type: id('header'), _content: { $type: id('_header_kind'), _kind: 3, _left: 'i' }, _name: 'n' };
		expect(nodeToConfig(data as never, opts)).toEqual({ kind: 3, left: 'i', name: 'n' });
	});

	it('stores a non-config arm child as the mount route arguments under the slot', () => {
		const data = { $type: id('tree'), _content: { $type: id('_tree_paren'), _tokens: ['a', 'b'] } };
		expect(nodeToConfig(data as never, opts)).toEqual({ content: ['a', 'b'] });
	});

	it('leaves a slot without a seat to the ordinary path', () => {
		const data = { $type: id('header'), _content: { $type: id('other'), _x: 1 }, _name: 'n' };
		expect(nodeToConfig(data as never, opts)).toMatchObject({ content: { $type: id('other') }, name: 'n' });
	});

	it('does nothing without a surface', () => {
		const data = { $type: id('clause'), _clause_group: { $type: id('_clause_group'), _parameter: 'e' }, _body: 'x' };
		expect(nodeToConfig(data as never, { factorySlots, factoryShapes, kindNameFromId })).toMatchObject({
			clauseGroup: { $type: id('_clause_group') },
			body: 'x'
		});
	});
});

describe('buildFactoryNodeFromReference on the ir surface', () => {
	function artifacts(entries: IrSurface['entries'], factoryMap: FactoryDispatchArtifacts['factoryMap']) {
		return {
			factoryMap,
			factoryShapes,
			fieldAliasMap: {},
			factoryFields,
			factorySlots,
			surface: surfaceWith(entries)
		};
	}

	it('calls the mount route with the projected config on a config parent', () => {
		const kind = vi.fn(() => 'built');
		const raw = vi.fn();
		const data = { $type: id('header'), _content: { $type: id('_header_kind'), _kind: 3, _left: 'i' }, _name: 'n' };
		const built = buildFactoryNodeFromReference(
			data as never,
			'header',
			artifacts({ header: { strict: raw, kind: { strict: kind } } }, { header: raw }),
			{ kindNameFromId }
		);
		expect(built).toBe('built');
		expect(kind).toHaveBeenCalledWith({ kind: 3, left: 'i', name: 'n' });
		expect(raw).not.toHaveBeenCalled();
	});

	it('extends the route with a nested arm and flattens through it', () => {
		const inner = vi.fn(() => 'built');
		const data = {
			$type: id('header'),
			_content: { $type: id('_header_kind'), _kind: 3, _left: { $type: id('_kind_left'), _x: 'v' } },
			_name: 'n'
		};
		const nestedSeats: SeatTable = {
			...seats,
			_header_kind: { left: { _kind_left: { kind: '_kind_left', shape: 'arm', mount: 'leftX' } } }
		};
		buildFactoryNodeFromReference(data as never, 'header', {
			factoryMap: { header: vi.fn() },
			factoryShapes: { ...factoryShapes, _kind_left: 'config' },
			fieldAliasMap: {},
			factoryFields,
			factorySlots: { ...factorySlots, _kind_left: { x: slot('x') } },
			surface: {
				entries: { header: { strict: vi.fn(), kind: { leftX: { strict: inner } } } },
				seats: nestedSeats,
				modelTypes: {}
			}
		}, { kindNameFromId });
		expect(inner).toHaveBeenCalledWith({ kind: 3, x: 'v', name: 'n' });
	});

	it('treats a token leaf that reads as a node as a value arm', () => {
		const tok = vi.fn(() => 'built');
		const data = { $type: id('header'), _content: { $type: id('tok'), $text: 'tok' }, _name: 'n' };
		buildFactoryNodeFromReference(
			data as never,
			'header',
			artifacts({ header: { strict: vi.fn(), tok: { strict: tok } } }, { header: vi.fn() }),
			{ kindNameFromId }
		);
		expect(tok).toHaveBeenCalledWith({ name: 'n' });
	});

	it('calls the mount route with the child arguments on a direct parent', () => {
		const paren = vi.fn(() => 'built');
		const data = { $type: id('tree'), _content: { $type: id('_tree_paren'), _tokens: ['a', 'b'] } };
		buildFactoryNodeFromReference(
			data as never,
			'tree',
			artifacts({ tree: { strict: vi.fn(), paren: { strict: paren } } }, { tree: vi.fn() }),
			{ kindNameFromId }
		);
		expect(paren).toHaveBeenCalledWith('a', 'b');
	});

	it('calls a value arm mount route with the config minus the slot', () => {
		const tok = vi.fn(() => 'built');
		const data = { $type: id('header'), _content: id('tok'), _name: 'n' };
		buildFactoryNodeFromReference(
			data as never,
			'header',
			artifacts({ header: { strict: vi.fn(), tok: { strict: tok } } }, { header: vi.fn() }),
			{ kindNameFromId }
		);
		expect(tok).toHaveBeenCalledWith({ name: 'n' });
	});

	it('calls the entry strict with the flattened config', () => {
		const strict = vi.fn(() => 'built');
		const data = { $type: id('clause'), _clause_group: { $type: id('_clause_group'), _parameter: 'e' }, _body: 'x' };
		buildFactoryNodeFromReference(data as never, 'clause', artifacts({ clause: { strict } }, { clause: vi.fn() }), { kindNameFromId });
		expect(strict).toHaveBeenCalledWith({ parameter: 'e', body: 'x' });
	});

	it('hands a forwarded parent the flattened group config as its one value', () => {
		const strict = vi.fn(() => 'built');
		const data = { $type: id('block'), _arms: { $type: id('_block_arms'), _arm: [{ $type: id('arm') }], _last: 'z' } };
		buildFactoryNodeFromReference(data as never, 'block', artifacts({ block: { strict } }, { block: vi.fn() }), { kindNameFromId });
		expect(strict).toHaveBeenCalledWith({ arm: [{ $type: id('arm') }], last: 'z' });
	});

	it('builds a kind without an ir entry through its raw factory', () => {
		const raw = vi.fn(() => 'raw-built');
		const data = { $type: id('clause'), _body: 'x' };
		expect(buildFactoryNodeFromReference(data as never, 'clause', artifacts({}, { clause: raw }), { kindNameFromId })).toBe('raw-built');
		expect(raw).toHaveBeenCalledWith({ body: 'x' });
	});

	it('throws when the seat names a route the entry does not have', () => {
		const data = { $type: id('header'), _content: { $type: id('_header_kind'), _kind: 3 } };
		expect(() =>
			buildFactoryNodeFromReference(
				data as never,
				'header',
				artifacts({ header: { strict: vi.fn() } }, { header: vi.fn() }),
				{ kindNameFromId }
			)
		).toThrow('ir surface: header.kind.strict is not a function');
	});
});

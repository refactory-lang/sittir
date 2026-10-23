import { describe, expect, it } from 'vitest';
import { nodeToConfig } from '../validate/common.ts';

const slot = (propertyName: string) => ({ propertyName, unnamed: false, slotCount: 1, required: false, multiple: false, nonEmpty: false });
const KINDS = ['owner', 'clause', 'word', 'pair'];
const id = (kind: string): number => KINDS.indexOf(kind) + 1;
const kindNameFromId = (kindId: number): string | undefined => KINDS[kindId - 1];
const word = (text: string) => ({ $type: id('word'), $named: true, $text: text });

const opts = {
	kindNameFromId,
	tree: { source: 'x' } as never,
	factoryMap: {
		owner: (config: unknown) => ({ $type: id('owner'), config }),
		clause: (config: unknown) => ({ $type: id('clause'), config }),
		word: (text: string) => ({ $type: id('word'), $text: text })
	} as never,
	factoryShapes: { owner: 'config', clause: 'config', word: 'text', pair: 'config' } as const,
	factorySlots: {
		owner: { body: slot('body') },
		clause: { value: slot('value') },
		pair: { left: slot('left'), right: slot('right') }
	}
};

describe('nodeToConfig never hands a builder a node it could not build', () => {
	it('refuses a kind with no factory and no single wrapped child, naming its path', () => {
		const pair = { $type: id('pair'), _left: word('a'), _right: word('b') };
		expect(() => nodeToConfig({ $type: id('owner'), _body: pair } as never, opts)).toThrow(
			'nodeToConfig: pair has no factory and no single wrapped child, at owner.body'
		);
	});

	it('refuses a node nested more than 64 deep', () => {
		let inner: object = word('x');
		for (let i = 0; i < 70; i++) inner = { $type: id('clause'), _value: inner };
		expect(() => nodeToConfig({ $type: id('owner'), _body: inner } as never, opts)).toThrow(/is nested more than 64 deep, at owner\.body > clause\.value/);
	});

	it('refuses an anonymous token object as a builder input when it builds from a tree', () => {
		const token = { $type: id('word'), $named: false, $text: ';' };
		expect(() => nodeToConfig({ $type: id('owner'), _body: token } as never, opts)).toThrow(
			`nodeToConfig: an anonymous token (${id('word')}) reached a builder input at owner.body`
		);
	});

	it('passes a read node through unbuilt when it is given no tree', () => {
		const read = { $type: id('pair'), _left: word('a'), _right: word('b') };
		const config = nodeToConfig({ $type: id('owner'), _body: read } as never, { ...opts, tree: undefined });
		expect(config).toMatchObject({ body: read });
	});
});

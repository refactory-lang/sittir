import { describe, expect, it } from 'vitest';
import { PinnedGap, pinnedGapsOf } from '../syntax.ts';

const PIN = '0123456789abcdef0123456789abcdef01234567';

describe('the pinned builders, as the emitter calls them', () => {
	const refusing = () => {
		throw new Error('content must be a string');
	};
	const builders = Object.assign((text: string) => text, { arrowFunction: Object.assign(refusing, { callSignature: (body: string) => `() => ${body}` }) });

	it('turns a builder that refuses its input into a pinned gap naming the construct and the pin', () => {
		const t = pinnedGapsOf({ identifier: (name: string) => name, arrowFunction: builders.arrowFunction }, PIN);
		expect(t.identifier('x')).toBe('x');
		expect(t.arrowFunction.callSignature('x')).toBe('() => x');
		const refused = (() => {
			try {
				t.arrowFunction();
			} catch (error) {
				return error;
			}
		})();
		expect(refused).toBeInstanceOf(PinnedGap);
		expect((refused as Error).message).toBe(`the pinned builders (${PIN}) can't express b.arrowFunction: content must be a string`);
	});
});

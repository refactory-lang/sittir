import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { readTrivia } from '@sittir/common/utils';
import type { AnyUntypedNode } from '@sittir/types';
import typescript from '../../typescript/src/index.ts';
import { loadNativeEngine, materializeDetached } from '../src/validate/common.ts';
import { leadingTriviaRenderedWidth } from '../src/validate/read-render-parse.ts';

/**
 * The width the read-render-parse lookup skips is the leading trivia the
 * render printed. A type argument is an alias envelope around its content, and
 * both name one parser node: the line gap before it is the envelope's, which a
 * root render leaves out, so the width is the owned comment and nothing else.
 */
const ts = await createEngine(typescript);
const native = await loadNativeEngine('typescript');
const render = (node: AnyUntypedNode): string => native.render(node).toString();
const triviaOf = (node: object) => readTrivia(node, native.diagnostics.lineGapsOf);

function secondTypeArgument(source: string): AnyUntypedNode {
	const declaration = ts.parse(source).statements()[0];
	if (declaration === undefined || !ts.is.typeAliasDeclaration(declaration)) throw new Error('expected a type alias');
	const value = declaration.value();
	if (!ts.is.genericType(value)) throw new Error('expected a generic type');
	const second = value.typeArguments().types().items()[1];
	if (second === undefined) throw new Error('expected a second type argument');
	return materializeDetached(second);
}

describe('leadingTriviaRenderedWidth on a detached alias envelope', () => {
	it('is zero when only a line gap comes before it', () => {
		const data = secondTypeArgument('type T = A<\n  X,\n  Y,\n>;\n');
		expect(render(data)).toBe('Y');
		expect(leadingTriviaRenderedWidth(data, render, triviaOf)).toBe(0);
	});

	it('is the owned comment and its line break', () => {
		const data = secondTypeArgument('type T = A<\n  X,\n  // c\n  Y,\n>;\n');
		expect(render(data)).toBe('// c\nY');
		expect(leadingTriviaRenderedWidth(data, render, triviaOf)).toBe('// c\n'.length);
	});
});

import { compileAnchoredPattern } from '../../types/runtime-shapes.ts';
import { pieces } from '../../util/pattern-pieces.ts';

const LITERAL_IN_CLASS = '+.*?(){}|$/';

export function stripUselessEscapes(pattern: string): string {
	let out = '';
	for (const piece of pieces(pattern)) out += piece.kind === 'class' ? classWithoutUselessEscapes(piece.text) : piece.text;
	try {
		new RegExp(out, 'u');
	} catch {
		return pattern;
	}
	return out;
}

function classWithoutUselessEscapes(text: string): string {
	let out = '[';
	for (let i = 1; i < text.length; i++) {
		const c = text[i]!;
		const next = text[i + 1];
		if (c !== '\\' || next === undefined) {
			out += c;
			continue;
		}
		i += 1;
		if (next === '[') out += '[';
		else if (next === '^' && out.length > 1) out += '^';
		else if (LITERAL_IN_CLASS.includes(next)) out += next;
		else if (next === '-' && text[i + 1] === ']') out += '-';
		else out += c + next;
	}
	return out;
}

export function anchoredLeafRegex(kind: string, textPattern: string | undefined): RegExp | undefined {
	if (!textPattern) return undefined;
	return compiledLeafRegex(kind, textPattern, 'whole');
}

export function leadingRegex(kind: string, textPattern: string): RegExp {
	return compiledLeafRegex(kind, textPattern, 'start');
}

function compiledLeafRegex(kind: string, textPattern: string, anchor: 'whole' | 'start'): RegExp {
	const compiled = compileAnchoredPattern(stripUselessEscapes(textPattern), anchor);
	if ('error' in compiled) {
		throw new Error(
			`emitter: leaf '${kind}' pattern does not compile as a JavaScript RegExp ` +
				`(tried 'u' flag and no-flag). Pattern: ${JSON.stringify(anchor === 'whole' ? `^(?:${stripUselessEscapes(textPattern)})$` : `^(?:${stripUselessEscapes(textPattern)})`)}. ` +
				`Cause: ${compiled.error.message}. ` +
				`Either fix the grammar or add the kind to an emitter exception list.`
		);
	}
	return compiled.regex;
}

export function regexLiteral(regex: RegExp): string {
	return `/${regex.source}/${regex.flags}`;
}

export function anchoredLeafRegexLiteral(kind: string, textPattern: string | undefined): string | undefined {
	const regex = anchoredLeafRegex(kind, textPattern);
	return regex === undefined ? undefined : regexLiteral(regex);
}

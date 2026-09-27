import { compileAnchoredPattern } from '../../types/runtime-shapes.ts';

const LITERAL_IN_CLASS = '+.*?(){}|$/';

export function stripUselessEscapes(pattern: string): string {
	let out = '';
	let i = 0;
	let inClass = false;
	let classStart = 0;
	while (i < pattern.length) {
		const c = pattern[i];
		if (!inClass) {
			if (c === '\\' && i + 1 < pattern.length) {
				out += c + pattern[i + 1];
				i += 2;
				continue;
			}
			out += c;
			i++;
			if (c === '[') {
				inClass = true;
				classStart = out.length;
			}
			continue;
		}
		if (c === ']') {
			inClass = false;
			out += c;
			i++;
			continue;
		}
		if (c === '\\' && i + 1 < pattern.length) {
			const next = pattern[i + 1];
			if (next === '[') {
				out += '[';
				i += 2;
				continue;
			}
			if (next === '^' && out.length > classStart) {
				out += '^';
				i += 2;
				continue;
			}
			if (next !== undefined && LITERAL_IN_CLASS.includes(next)) {
				out += next;
				i += 2;
				continue;
			}
			if (next === '-' && pattern[i + 2] === ']') {
				out += '-';
				i += 2;
				continue;
			}
			out += c + next;
			i += 2;
			continue;
		}
		out += c;
		i++;
	}
	try {
		new RegExp(out, 'u');
	} catch {
		return pattern;
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

export function anchoredLeafRegexLiteral(kind: string, textPattern: string | undefined): string | undefined {
	const regex = anchoredLeafRegex(kind, textPattern);
	return regex === undefined ? undefined : `/${regex.source}/${regex.flags}`;
}

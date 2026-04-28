import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNunjucksEnvironment } from '../src/templates/nunjucks-env.ts';

// Unit coverage for sittir's Nunjucks filter overrides & additions
// registered by `registerSittirFilters`:
//   - `join`               (override — tolerates non-array shapes)
//   - `joinWithTrailing`   (array + `_trailing_anon` flank)
//   - `joinWithLeading`    (array + `_leading_anon` flank)
//   - `joinWithFlanks`     (both)
//
// Filters are exercised through a real `createNunjucksEnvironment()`
// invocation so that `registerSittirFilters` wiring is covered too.

function withEnv<T>(
	template: string,
	fn: (render: (ctx: unknown) => string) => T
): T {
	const tmp = mkdtempSync(join(tmpdir(), 'sittir-nunjucks-filters-'));
	try {
		writeFileSync(join(tmp, 't.jinja'), template);
		const env = createNunjucksEnvironment(tmp);
		const render = (ctx: unknown) =>
			env.render('t.jinja', ctx as Record<string, unknown>);
		return fn(render);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

describe('join filter override', () => {
	it('joins a string[] with the given separator', () => {
		withEnv('{{ xs | join(", ") }}', (render) => {
			expect(render({ xs: ['a', 'b', 'c'] })).toBe('a, b, c');
		});
	});

	it('returns a string value unwrapped (legacy single-slot-as-$$$ path)', () => {
		withEnv('{{ x | join(",") }}', (render) => {
			expect(render({ x: 'solo' })).toBe('solo');
		});
	});

	it('stringifies a number', () => {
		withEnv('{{ x | join(",") }}', (render) => {
			expect(render({ x: 42 })).toBe('42');
		});
	});

	it('stringifies a boolean', () => {
		withEnv('{{ x | join(",") }}', (render) => {
			expect(render({ x: true })).toBe('true');
		});
	});

	it('emits empty string for undefined / null', () => {
		withEnv('[{{ x | join(",") }}]', (render) => {
			expect(render({ x: undefined })).toBe('[]');
			expect(render({ x: null })).toBe('[]');
			// Key fully absent (throwOnUndefined is false): same behavior.
			expect(render({})).toBe('[]');
		});
	});

	it('throws when handed an object value (Nunjucks wraps the TypeError)', () => {
		withEnv('{{ x | join(",") }}', (render) => {
			// Nunjucks re-wraps filter exceptions as `Template render error`
			// but preserves the original message text — match on it so the
			// assertion locks the filter's guard rail regardless of the
			// outer wrapping.
			expect(() => render({ x: { foo: 'bar' } })).toThrow(
				/TypeError: join: unsupported value type object/
			);
		});
	});

	it('empty separator collapses the array', () => {
		withEnv('{{ xs | join("") }}', (render) => {
			expect(render({ xs: ['a', 'b', 'c'] })).toBe('abc');
		});
	});
});

describe('joinWithTrailing', () => {
	it('joins + appends separator when _trailing_anon matches it', () => {
		withEnv('{{ xs | joinWithTrailing(",") }}', (render) => {
			const xs = ['a', 'b', 'c'] as string[] & { _trailing_anon?: string };
			xs._trailing_anon = ',';
			expect(render({ xs })).toBe('a,b,c,');
		});
	});

	it('joins without flank when _trailing_anon does not match sep (e.g. closing paren)', () => {
		withEnv('{{ xs | joinWithTrailing(",") }}', (render) => {
			const xs = ['a', 'b'] as string[] & { _trailing_anon?: string };
			xs._trailing_anon = ')';
			expect(render({ xs })).toBe('a,b');
		});
	});

	it('does not prepend leading even when _leading_anon is present', () => {
		withEnv('{{ xs | joinWithTrailing(",") }}', (render) => {
			const xs = ['a', 'b'] as string[] & {
				_leading_anon?: string;
				_trailing_anon?: string;
			};
			xs._leading_anon = ',';
			xs._trailing_anon = ',';
			expect(render({ xs })).toBe('a,b,');
		});
	});

	it('coerces non-array values via scalarJoin just like join', () => {
		withEnv('[{{ x | joinWithTrailing(",") }}]', (render) => {
			expect(render({ x: 'lone' })).toBe('[lone]');
			expect(render({ x: undefined })).toBe('[]');
		});
	});
});

describe('joinWithLeading', () => {
	it('joins + prepends separator when _leading_anon matches it', () => {
		withEnv('{{ xs | joinWithLeading("|") }}', (render) => {
			const xs = ['a', 'b'] as string[] & { _leading_anon?: string };
			xs._leading_anon = '|';
			expect(render({ xs })).toBe('|a|b');
		});
	});

	it('joins without flank when _leading_anon does not match sep', () => {
		withEnv('{{ xs | joinWithLeading("|") }}', (render) => {
			const xs = ['a', 'b'] as string[] & { _leading_anon?: string };
			xs._leading_anon = '(';
			expect(render({ xs })).toBe('a|b');
		});
	});

	it('ignores a trailing flank', () => {
		withEnv('{{ xs | joinWithLeading("|") }}', (render) => {
			const xs = ['a', 'b'] as string[] & {
				_leading_anon?: string;
				_trailing_anon?: string;
			};
			xs._trailing_anon = '|';
			expect(render({ xs })).toBe('a|b');
		});
	});
});

describe('joinWithFlanks', () => {
	it('applies both leading and trailing flanks when they match', () => {
		withEnv('{{ xs | joinWithFlanks(",") }}', (render) => {
			const xs = ['a', 'b', 'c'] as string[] & {
				_leading_anon?: string;
				_trailing_anon?: string;
			};
			xs._leading_anon = ',';
			xs._trailing_anon = ',';
			expect(render({ xs })).toBe(',a,b,c,');
		});
	});

	it('applies only the side that matches sep', () => {
		withEnv('{{ xs | joinWithFlanks(",") }}', (render) => {
			const xs = ['a', 'b'] as string[] & {
				_leading_anon?: string;
				_trailing_anon?: string;
			};
			xs._leading_anon = '(';
			xs._trailing_anon = ',';
			expect(render({ xs })).toBe('a,b,');
		});
	});

	it('empty array returns empty string', () => {
		withEnv('[{{ xs | joinWithFlanks(",") }}]', (render) => {
			expect(render({ xs: [] })).toBe('[]');
		});
	});
});

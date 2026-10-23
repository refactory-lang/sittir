import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { projection, withoutIds } from './_parse-projection.ts';

// Every layer that is not meant to fail must leave no layer diagnostic.
async function evaluateClean(...args: Parameters<typeof evaluateTempGrammar>): ReturnType<typeof evaluateTempGrammar> {
	const raw = await evaluateTempGrammar(...args);
	expect(raw.layerDiagnostics ?? []).toEqual([]);
	return raw;
}

// The splitGrammar outputs for the touched kinds of each base, computed from
// splitGrammar on the base evaluated without bindings.
const PIN_S1 = {
  "rules": {
    "owner": {
      "type": "SYMBOL",
      "name": "context_body",
      "inline": false
    },
    "context_body": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "{"
        },
        {
          "type": "REPEAT",
          "content": {
            "type": "SYMBOL",
            "name": "item",
            "inline": false
          }
        },
        {
          "type": "STRING",
          "value": "}"
        }
      ]
    }
  },
  "splitFrom": {
    "context_body": "body"
  },
  "options": {
    "body": {
      "before": {
        "__sittirPlaceholder": "preference",
        "default": "space"
      },
      "items:/end": {
        "__sittirPlaceholder": "preference",
        "default": "newline"
      }
    },
    "_labels": {
      "context_body/\"{\"/after": "body/before",
      "body/\"{\"/after": "body/before"
    },
    "context_body": {
      "before": {
        "__sittirPlaceholder": "preference",
        "default": "space"
      },
      "items:/end": {
        "__sittirPlaceholder": "preference",
        "default": "newline"
      }
    }
  }
} as const;
const PIN_S2 = {
  "rules": {
    "owner": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "("
        },
        {
          "type": "SYMBOL",
          "name": "_items_owner",
          "inline": true
        },
        {
          "type": "STRING",
          "value": ")"
        }
      ]
    },
    "_items_owner": {
      "type": "FIELD",
      "name": "elements",
      "content": {
        "type": "REPEAT1",
        "content": {
          "type": "CHOICE",
          "members": [
            {
              "type": "SYMBOL",
              "name": "owner_a",
              "inline": false
            },
            {
              "type": "SYMBOL",
              "name": "word",
              "inline": false
            }
          ]
        }
      },
      "metadata": {
        "fieldSource": "enriched"
      }
    },
    "owner_a": {
      "type": "STRING",
      "value": "a"
    }
  },
  "splitFrom": {
    "owner_a": "a",
    "_items_owner": "_items"
  }
} as const;
const PIN_S2_CHOICE = {
  "rules": {
    "owner": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "("
        },
        {
          "type": "SYMBOL",
          "name": "_items_owner",
          "inline": true
        },
        {
          "type": "STRING",
          "value": ")"
        }
      ]
    },
    "_items_owner": {
      "type": "CHOICE",
      "members": [
        {
          "type": "SYMBOL",
          "name": "owner_a",
          "inline": false,
          "annotations": {
            "variant": "a",
            "variantOf": "_items"
          }
        },
        {
          "type": "SYMBOL",
          "name": "word",
          "inline": false,
          "annotations": {
            "variant": "word",
            "variantOf": "_items"
          }
        }
      ]
    },
    "owner_a": {
      "type": "STRING",
      "value": "a"
    }
  },
  "splitFrom": {
    "owner_a": "a",
    "_items_owner": "_items"
  }
} as const;
const PIN_S3 = {
  "rules": {
    "outer": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "impl"
        },
        {
          "type": "FIELD",
          "name": "body",
          "content": {
            "type": "SYMBOL",
            "name": "outer_list",
            "inline": false
          }
        }
      ]
    },
    "outer_list": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "{"
        },
        {
          "type": "FIELD",
          "name": "stmts",
          "content": {
            "type": "REPEAT",
            "content": {
              "type": "SYMBOL",
              "name": "_stmt_outer",
              "inline": true
            }
          },
          "metadata": {
            "fieldSource": "enriched"
          }
        },
        {
          "type": "STRING",
          "value": "}"
        }
      ]
    },
    "_stmt_outer": {
      "type": "CHOICE",
      "members": [
        {
          "type": "SYMBOL",
          "name": "method",
          "inline": false,
          "annotations": {
            "variant": "fn",
            "variantOf": "_stmt"
          }
        },
        {
          "type": "SYMBOL",
          "name": "konst",
          "inline": false,
          "annotations": {
            "variant": "konst",
            "variantOf": "_stmt"
          }
        }
      ]
    },
    "method": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "fn"
        },
        {
          "type": "FIELD",
          "name": "word",
          "content": {
            "type": "SYMBOL",
            "name": "word",
            "inline": false
          },
          "metadata": {
            "fieldSource": "enriched"
          }
        }
      ]
    }
  },
  "splitFrom": {
    "method": "fn",
    "outer_list": "list",
    "_stmt_outer": "_stmt"
  }
} as const;
const PIN_S4 = {
  "rules": {
    "outer": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "impl"
        },
        {
          "type": "FIELD",
          "name": "body",
          "content": {
            "type": "SYMBOL",
            "name": "outer_list",
            "inline": false
          }
        }
      ]
    },
    "outer_list": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "{"
        },
        {
          "type": "FIELD",
          "name": "stmts",
          "content": {
            "type": "REPEAT",
            "content": {
              "type": "SYMBOL",
              "name": "_stmt_outer",
              "inline": true
            }
          },
          "metadata": {
            "fieldSource": "enriched"
          }
        },
        {
          "type": "STRING",
          "value": "}"
        }
      ]
    },
    "_stmt_outer": {
      "type": "CHOICE",
      "members": [
        {
          "type": "SYMBOL",
          "name": "method",
          "inline": false,
          "annotations": {
            "variant": "fn",
            "variantOf": "_stmt"
          }
        },
        {
          "type": "SYMBOL",
          "name": "assoc",
          "inline": false,
          "annotations": {
            "variant": "konst",
            "variantOf": "_stmt"
          }
        }
      ]
    },
    "method": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "fn"
        },
        {
          "type": "FIELD",
          "name": "word",
          "content": {
            "type": "SYMBOL",
            "name": "word",
            "inline": false
          },
          "metadata": {
            "fieldSource": "enriched"
          }
        }
      ]
    },
    "assoc": {
      "type": "SEQ",
      "members": [
        {
          "type": "STRING",
          "value": "const"
        },
        {
          "type": "FIELD",
          "name": "word",
          "content": {
            "type": "SYMBOL",
            "name": "word",
            "inline": false
          },
          "metadata": {
            "fieldSource": "enriched"
          }
        }
      ]
    }
  },
  "splitFrom": {
    "method": "fn",
    "outer_list": "list",
    "_stmt_outer": "_stmt",
    "assoc": "konst"
  }
} as const;

const S1_RULES = 'owner: ($) => $.body, body: ($) => seq(\'{\', repeat($.item), \'}\'), item: () => /x/';
const S1_OPTIONS = `options: { body: { before: preference('space'), 'items:/end': preference('newline') }, _labels: { 'body/"{"/after': 'body/before' } }`;
const S2_RULES = "owner: ($) => seq('(', $._items, ')'), _items: ($) => repeat1(choice($.a, $.word)), a: () => 'a'";
const S2_CHOICE_RULES = "owner: ($) => seq('(', $._items, ')'), _items: ($) => choice($.a, $.word), a: () => 'a'";
const S3_RULES = "outer: ($) => seq('impl', field('body', $.list)), list: ($) => seq('{', repeat($._stmt), '}'), _stmt: ($) => choice($.fn, $.konst), fn: ($) => seq('fn', $.word), konst: ($) => seq('const', $.word)";

const pick = (rules: Record<string, unknown>, names: readonly string[]): Record<string, unknown> => Object.fromEntries(names.map((name) => [name, rules[name]]));

describe('a copy path matches the split it spells', () => {
	it('S1: a direct copy of a body with its options matches the split of the body', async () => {
		const path = await evaluateClean({ extras: '', rules: S1_RULES }, S1_OPTIONS, {
			bindings: "edits: { owner: { '(body)': ($) => alias(copy('body'), $.context_body) } }"
		});
		const projected = projection(path);
		expect(
			withoutIds({ rules: pick(projected.rules, ['owner', 'context_body']), splitFrom: projected.splitFrom, options: projected.options })
		).toEqual(PIN_S1);
	}, 60_000);

	it('S2: a copy through a hidden rule matches the split of the arm', async () => {
		const path = await evaluateClean({ extras: '', rules: S2_RULES }, '', {
			bindings: "edits: { owner: { '(a)': ($) => alias(copy('a'), $.owner_a) } }"
		});
		const projected = projection(path);
		expect(withoutIds({ rules: pick(projected.rules, ['owner', '_items_owner', 'owner_a']), splitFrom: projected.splitFrom })).toEqual({
			rules: PIN_S2.rules,
			splitFrom: PIN_S2.splitFrom
		});
	}, 60_000);

	it('S2b: a copy through a hidden choice matches the split of the arm', async () => {
		const path = await evaluateClean({ extras: '', rules: S2_CHOICE_RULES }, '', {
			bindings: "edits: { owner: { '(a)': ($) => alias(copy('a'), $.owner_a) } }"
		});
		const projected = projection(path);
		expect(withoutIds({ rules: pick(projected.rules, ['owner', '_items_owner', 'owner_a']), splitFrom: projected.splitFrom })).toEqual({
			rules: PIN_S2_CHOICE.rules,
			splitFrom: PIN_S2_CHOICE.splitFrom
		});
	}, 60_000);

	it('S3: a copy through a hidden rule and a container matches the split of the rust shape', async () => {
		const path = await evaluateClean({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)': ($) => alias(copy('fn'), $.method) } }"
		});
		const projected = projection(path);
		expect(withoutIds({ rules: pick(projected.rules, ['outer', 'outer_list', '_stmt_outer', 'method']), splitFrom: projected.splitFrom })).toEqual(
			{ rules: PIN_S3.rules, splitFrom: PIN_S3.splitFrom }
		);
	}, 60_000);

	it('S4: a second copy in the same context reuses the container and the hidden copy', async () => {
		const path = await evaluateClean({ extras: '', rules: S3_RULES }, '', {
			bindings:
				"edits: { outer: { 'body:/(list as outer_list)/(fn)': ($) => alias(copy('fn'), $.method), 'body:/(list as outer_list)/(konst)': ($) => alias(copy('konst'), $.assoc) } }"
		});
		const projected = projection(path);
		expect(
			withoutIds({ rules: pick(projected.rules, ['outer', 'outer_list', '_stmt_outer', 'method', 'assoc']), splitFrom: projected.splitFrom })
		).toEqual({ rules: PIN_S4.rules, splitFrom: PIN_S4.splitFrom });
	}, 60_000);
});

describe('a copy path names its copies by the spelling of the path', () => {
	it('C1: an unnamed container segment references the copy back to its source name', async () => {
		const raw = await evaluateClean({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list)/(fn)': ($) => alias(copy('fn'), $.method) } }"
		});
		expect(raw.rules.outer).toMatchObject({
			type: 'SEQ',
			members: [{ type: 'STRING', value: 'impl' }, { type: 'FIELD', name: 'body', content: { type: 'ALIAS', named: true, value: 'list', content: { type: 'SYMBOL', name: '_list_outer' } } }]
		});
	}, 60_000);

	it('C2: a part copy names the arm by its path and is referenced bare', async () => {
		const raw = await evaluateClean({ extras: '', rules: "owner: ($) => $._decl, _decl: ($) => choice(seq('a', $.word), seq('b', $.word))" }, '', {
			bindings: "rules: { owner: ($) => seq('(', copy('_decl', '1'), ')') }"
		});
		expect(raw.rules._decl_1_owner).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: 'b' }, { type: 'SYMBOL', name: 'word' }] });
		expect(raw.rules.owner).toMatchObject({ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, { type: 'SYMBOL', name: '_decl_1_owner' }, { type: 'STRING', value: ')' }] });
	}, 60_000);

	it('C3: a copy whose name the grammar already has is a rule-name-taken diagnostic of the layer', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: `${S3_RULES}, _stmt_outer: ($) => $.word` }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)': ($) => alias(copy('fn'), $.method) } }"
		});
		expect(raw.layerDiagnostics ?? []).toContainEqual(expect.objectContaining({ code: 'rule-name-taken', ownerKind: 'outer' }));
	}, 60_000);

	it('C4: an alias on a symbol inside a copied context relabels the reference and mints no copy of the symbol', async () => {
		const raw = await evaluateClean({ extras: '', rules: S3_RULES }, '', {
			bindings: "edits: { outer: { 'body:/(list as outer_list)/(fn)': alias('method') } }"
		});
		expect(raw.rules._stmt_outer).toMatchObject({
			type: 'CHOICE',
			members: [{ type: 'ALIAS', named: true, value: 'method', content: { type: 'SYMBOL', name: 'fn' } }, { type: 'SYMBOL', name: 'konst' }]
		});
		expect(raw.rules).not.toHaveProperty('_fn_outer');
	}, 60_000);

	it('C5: a literal split names the copy of a member whose name field is replaced in the copy', async () => {
		const raw = await evaluateClean(
			{ extras: '', rules: "cls: ($) => seq('{', repeat(choice($.meth, $.field_def)), '}'), meth: ($) => seq(field('name', $.prop), '(', ')'), field_def: ($) => seq('let', $.prop), prop: () => /[a-z]+/" },
			'',
			{
				bindings: "edits: { cls: { '(meth)': ($, member) => choice(member, alias(replace(copy('meth'), 'name:', alias('constructor', $.prop)), $.ctor)) } }"
			}
		);
		expect(raw.rules._meth_cls).toMatchObject({
			type: 'SEQ',
			members: [
				{ type: 'FIELD', name: 'name', content: { type: 'ALIAS', named: true, value: 'prop', content: { type: 'STRING', value: 'constructor' } } },
				{ type: 'STRING', value: '(' },
				{ type: 'STRING', value: ')' }
			]
		});
		expect(raw.rules.cls).toMatchObject({
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: '{' },
				{ type: 'FIELD', name: 'elements', metadata: { fieldSource: 'enriched' }, content: { type: 'REPEAT', content: { type: 'CHOICE' } } },
				{ type: 'STRING', value: '}' }
			]
		});
		const arms = JSON.stringify((raw.rules.cls as { members: { content: { content: unknown } }[] }).members[1]!.content.content);
		expect(arms).toContain('"name":"meth"');
		expect(arms).toContain('"value":"ctor"');
		expect(arms).toContain('"name":"_meth_cls"');
		expect(arms).toContain('"name":"field_def"');
	}, 60_000);

	it('C5 refusal: a repeated single kind that an edit turns into a choice is a layer-not-enrich-fixpoint naming the field it would add', async () => {
		const raw = await evaluateTempGrammar(
			{ extras: '', rules: "cls: ($) => seq('{', repeat($.meth), '}'), meth: ($) => seq('(', ')'), prop: () => /[a-z]+/" },
			'',
			{ bindings: "edits: { cls: { '(meth)': ($, member) => choice(member, $.prop) } }" }
		);
		expect(raw.layerDiagnostics).toContainEqual(
			expect.objectContaining({
				code: 'layer-not-enrich-fixpoint',
				details: expect.objectContaining({ rules: ['cls'], addedFields: [{ rule: 'cls', field: 'elements' }] }),
				proposal: expect.stringContaining("field('elements', \u2026)")
			})
		);
	}, 60_000);
});

describe('the source keeps its labels after a copy is named', () => {
	it('keeps the source labels and inherits the copy label under the copy name, without projection', async () => {
		const base = await evaluateClean({ extras: '', rules: S1_RULES }, S1_OPTIONS, { bindings: '' });
		const raw = await evaluateClean({ extras: '', rules: S1_RULES }, S1_OPTIONS, {
			bindings: "edits: { owner: { '(body)': ($) => alias(copy('body'), $.context_body) } }"
		});
		const options = raw.options as Record<string, unknown>;
		expect(options._labels).toMatchObject({ 'body/"{"/after': 'body/before', '_body_owner/"{"/after': 'body/before' });
		expect(options.body).toEqual((base.options as Record<string, unknown>).body);
	}, 60_000);
});

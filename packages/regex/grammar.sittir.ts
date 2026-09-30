/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import {
	field,
	variant,
	sittirGrammar
} from '../codegen/src/dsl/dsl-authoring.ts';

export default sittirGrammar(base, {
	resolutions,
	name: 'regex',
	patches: {
		class_range: { 0: field('start'), 2: field('end') },
		term: { '0/1': field('quantifier') },
		inline_flags_group: [
			{
				'1/0': field('enabled'),
				'1/1/0': field('enabled'),
				'1/1/2': field('disabled'),
				'1/2/1': field('disabled')
			},
			{ '1/0': variant('enable'), '1/1': variant('toggle'), '1/2': variant('disable') }
		]
	}
});

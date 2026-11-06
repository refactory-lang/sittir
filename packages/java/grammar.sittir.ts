/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'java',
	options: { indent: preference('    ') },
	edits: {
		formal_parameters: { '1/0': variant('receiver'), '1/1': variant('list') },
		try_statement: { '2/0': variant('catches'), '2/1': variant('finally') }
	}
}));

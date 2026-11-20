/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, variant, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'go',
	options: { indent: preference('    ') },
	edits: {
		channel_type: { 0: variant('bidirectional'), 1: variant('send_only'), 2: variant('receive_only') }
	}
}));

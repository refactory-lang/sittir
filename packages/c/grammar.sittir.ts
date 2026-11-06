/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './base.ts';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
	resolutions,
	name: 'c',
	options: { indent: preference('    ') }
}));

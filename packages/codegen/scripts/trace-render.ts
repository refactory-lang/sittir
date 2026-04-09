#!/usr/bin/env npx tsx
import { createRenderer } from '../../core/src/render.ts';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import type { AnyNodeData, RulesConfig } from '@sittir/types';

const config = parseYaml(readFileSync('packages/rust/templates.yaml', 'utf-8')) as RulesConfig;
const { render } = createRenderer(config);

// Empty parameters
const empty: AnyNodeData = { type: 'parameters', children: [], named: true };
console.log('empty params:', JSON.stringify(render(empty)));

// Parameters with one identifier child
const one: AnyNodeData = {
	type: 'parameters',
	children: [
		{ type: 'parameter', named: true, fields: {
			pattern: { type: 'identifier', text: 'x', named: true },
			type: { type: 'primitive_type', text: 'i32', named: true },
		}},
	],
	named: true,
};
console.log('one param:', JSON.stringify(render(one)));

// Parameters with two children
const two: AnyNodeData = {
	type: 'parameters',
	children: [
		{ type: 'parameter', named: true, fields: {
			pattern: { type: 'identifier', text: 'a', named: true },
			type: { type: 'primitive_type', text: 'i32', named: true },
		}},
		{ type: 'parameter', named: true, fields: {
			pattern: { type: 'identifier', text: 'b', named: true },
			type: { type: 'primitive_type', text: 'i32', named: true },
		}},
	],
	named: true,
};
console.log('two params:', JSON.stringify(render(two)));

// Type parameters
const tparams: AnyNodeData = {
	type: 'type_parameters',
	children: [
		{ type: 'type_parameter', named: true, fields: { name: { type: 'type_identifier', text: 'T', named: true } } },
	],
	named: true,
};
console.log('type params:', JSON.stringify(render(tparams)));

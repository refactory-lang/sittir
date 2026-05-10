import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	'packages/core',
	'packages/codegen',
	'packages/tools',
	'packages/validator',
	'packages/rust',
	'packages/typescript',
	'packages/python'
]);

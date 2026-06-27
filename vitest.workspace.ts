import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	'packages/core',
	'packages/codegen',
	'packages/tools',
	'packages/rust',
	'packages/typescript',
	'packages/python'
]);

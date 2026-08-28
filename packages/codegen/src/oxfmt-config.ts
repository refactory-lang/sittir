import type { FormatConfig } from 'oxfmt';

export const OXFMT_CONFIG: FormatConfig = {
	semi: true,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	arrowParens: 'always',
	printWidth: 120,
	sortPackageJson: false,
	ignorePatterns: [
		'**/*.md',
		'**/*.mdx',
		'.github/**',
		'.agents/**',
		'.claude/**',
		'.zed/**',
		'.specify/**',
		'.changeset/**',
		'specs/**',
		'examples/**',
		'scratch/**',
		'packages/tools/baselines/**'
	]
};

export const OXFMT_EFFECTIVE_CONFIG: FormatConfig = { ...OXFMT_CONFIG, useTabs: true };

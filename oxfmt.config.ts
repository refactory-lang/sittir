import { defineConfig } from 'oxfmt';

export default defineConfig({
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
		'.specify/**',
		'.changeset/**',
		'specs/**',
		'examples/**'
	]
});

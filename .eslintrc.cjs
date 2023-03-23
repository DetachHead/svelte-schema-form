/**
 * overrides for files executed by nodejs rather than in the brower (ie. config files)
 * @type {Omit<import('eslint').Linter.ConfigOverride, 'files'>}
 */
const nodeOverrides = {
    excludedFiles: ['src/**/*.ts'],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
        ecmaVersion: 'latest',
        extraFileExtensions: ['.svelte'],
    },
    rules: { 'import/no-extraneous-dependencies': 'off' },
}

/** @type {import('eslint').Linter.ParserOptions} */
const browserParserOptions = {
    ...nodeOverrides.parserOptions,
    project: ['./src/tsconfig.json'],
}

/* eslint-disable jsdoc/valid-types -- https://github.com/gajus/eslint-plugin-jsdoc/issues/145 */
/**
 * hacky workaround for these 2 issues:
 * - https://github.com/typescript-eslint/typescript-eslint/issues/4803
 * - https://github.com/typescript-eslint/typescript-eslint/issues/1682
 * @type {import('eslint').Linter.Config['rules']}
 */
/* eslint-enable jsdoc/valid-types -- see above */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- see doc
const typescriptEslintRecommended =
    // @ts-expect-error see doc
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- see doc
    require('@typescript-eslint/eslint-plugin/dist/configs/eslint-recommended').overrides?.[0]
        ?.rules

/** @type {import('eslint').Linter.Config} */
const config = {
    extends: ['@detachhead/eslint-config'],
    parserOptions: browserParserOptions,
    rules: {
        // typescript-eslint enables this for typescript files only, but the js config files can benefit from it too because we aren't targeting an ancient node version
        'no-var': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx', '.cts', '.mts'],
            espree: ['.js', 'jsx', '.cjs', '.mjs'],
        },
    },
    overrides: [
        {
            extends: ['plugin:svelte/all', 'plugin:svelte/prettier'],
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: { ...browserParserOptions, parser: '@typescript-eslint/parser' },
            rules: {
                ...typescriptEslintRecommended,
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                        args: 'all',
                        caughtErrors: 'all',
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^(_|\\$\\$(Slots|Events))',
                    },
                ],
                'svelte/valid-compile': 'off', // umm, we have the compiler for that
                'svelte/comment-directive': [
                    'error',
                    {
                        reportUnusedDisableDirectives: true,
                    },
                ],
                'svelte/block-lang': ['error', { enforceScriptPresent: true, script: 'ts' }],
            },
        },
        { ...nodeOverrides, files: ['*.js', '*.ts'] },
        {
            ...nodeOverrides,
            files: ['tests/**/*.ts'],
            parserOptions: { ...nodeOverrides.parserOptions, project: './tests/tsconfig.json' },
        },
        {
            ...nodeOverrides,
            files: ['*.cjs'],
            rules: {
                ...nodeOverrides.rules,
                // commonjs cant use esm imports, duh
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
    ],
}
module.exports = config

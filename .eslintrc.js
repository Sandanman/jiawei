/**
 * ESLint 配置 - uni-app + Vue 3 + TypeScript
 * 基于 CODE_STYLE_PERSONAL.md 个人习惯配置
 *
 * 安装依赖：
 * npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
 * npm install -D eslint-plugin-vue vue-eslint-parser
 */

module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-recommended',
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        // === 个人习惯 ===
        semi: ['error', 'never'],        // 不使用分号
        quotes: ['error', 'single'],      // TS/JS 用单引号

        // === Vue3 规范 ===
        'vue/component-tags-order': ['error', {
            order: ['script', 'template', 'style'],
        }],
        'vue/html-self-closing': ['error', {
            html: { void: 'always', normal: 'never', component: 'always' },
        }],
        'vue/multi-word-component-names': 'off', // uni-app 页面组件允许单字命名

        // === TypeScript 规范 ===
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/ban-ts-comment': ['error', {
            'ts-expect-error': 'allow-with-description',
        }],
    },
    overrides: [
        {
            files: ['*.vue'],
            rules: {
                // Vue 文件中允许 max-len 稍宽松
                'max-len': 'off',
            },
        },
        {
            files: ['pages.json', 'manifest.json'],
            rules: {
                quotes: ['error', 'double'], // JSON 文件必须双引号
                semi: ['error', 'always'],   // JSON 文件必须有分号（风格统一）
            },
        },
    ],
}
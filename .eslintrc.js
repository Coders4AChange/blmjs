module.exports = {
    env: {
        node: true,
        browser: true,
        commonjs: true,
        es2020: true,
        jest: true,
    },
    extends: ["eslint:recommended", "google"],
    parserOptions: {
        ecmaVersion: 11,
    },
    rules: {
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["off", "double"],
        "semi": ["error", "always"],
        "no-mixed-spaces-and-tabs": ["error"],
        "no-useless-escape": ["warn"],
        "no-console": ["off"],
        "no-unused-vars": ["error"],
        "no-redeclare": ["error"],
        "no-octal": ["error"],
        "no-array-constructor": ["error"],
        "no-new-object": ["error"],
        "arrow-spacing": ["error"],
        "constructor-super": ["error"],
        "no-new-require": ["error"],
        "no-shadow-restricted-names": ["error"],
        "no-useless-catch": ["error"],
        "no-useless-call": ["error"],
        "no-mixed-operators": [
            "error",
            {
                groups: [
                    ["&", "|", "^", "~", "<<", ">>", ">>>"],
                    ["&&", "||"],
                ],
            },
        ],
        "no-return-await": ["error"],
        "no-return-assign": ["error", "except-parens"],
        "no-empty": ["warn"],
        "no-trailing-spaces": ["error"],
        "no-new-wrappers": ["error"],
        "no-lone-blocks": ["error"],
        "no-async-promise-executor": ["error"],
        "no-self-compare": ["error"],
        "no-sequences": ["error"],
        "no-useless-rename": ["error"],
        "no-useless-concat": ["error"],
        "no-useless-computed-key": ["error"],
        "callback-return": [
            "error",
            ["callback", "cb", "next", "done", "reject", "resolve"],
        ],
        "no-use-before-define": [
            "error",
            { functions: false, classes: true, variables: true },
        ],
        "no-restricted-modules": ["error", "crypto"],
        'object-curly-spacing': ['error', 'always'],

    },
};

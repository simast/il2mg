module.exports = {
	root: true,
	parser: "babel-eslint",
	parserOptions: {
		ecmaVersion: 2017,
		sourceType: "module"
	},
	env: {
		node: true,
		es6: true
	},
	extends: "eslint:recommended",
	rules: {
		"no-empty": ["error", {allowEmptyCatch: true}],
		"no-var": "error",
		"no-lonely-if": "error",
		"no-multiple-empty-lines": "error",
		"no-trailing-spaces": "error",
		"no-whitespace-before-property": "error",
		"no-nested-ternary": "error",
		"no-new-object": "error",
		"no-unneeded-ternary": "error",
		"for-direction": "error",
		"brace-style": ["error", "stroustrup", {allowSingleLine: true}],
		"curly": "error",
		"comma-dangle": ["error", "never"],
		"eqeqeq": "error",
		"indent": ["error", "tab", {SwitchCase: 1}],
		"key-spacing": "error",
		"object-curly-spacing": ["error", "never"],
		"operator-linebreak": ["error", "after"],
		"semi": ["error", "never"],
		"semi-spacing": ["error", {before: false, after: true}],
		"semi-style": ["error", "first"],
		"quote-props": ["error", "as-needed"],
		"quotes": ["error", "double", {avoidEscape: true, allowTemplateLiterals: true}],
		"radix": "error",
		"keyword-spacing": "error",
		"space-before-blocks": ["error", "always"],
		"space-before-function-paren": ["error", {anonymous: "never", named: "never", asyncArrow: "always"}],
		"space-in-parens": ["error", "never"],
		"space-infix-ops": "error",
		"space-unary-ops": ["error", {words: true, nonwords: false}],
		"spaced-comment": ["error", "always"],
		"strict": ["error", "global"],
		"switch-colon-spacing": ["error", {after: true, before: false}],
		"wrap-iife": ["error", "inside"],
		"array-bracket-spacing": ["error", "never"],
		"comma-spacing": ["error", {before: false, after: true}],
		"comma-style": ["error", "last"],
		"computed-property-spacing": ["error", "never"],
		"new-parens": "error",
		"arrow-body-style": ["error", "as-needed"],
		"arrow-parens": ["error", "as-needed"],
		"arrow-spacing": "error",
		"generator-star-spacing": ["error", "before"],
		"yield-star-spacing": ["error", "after"],
		"prefer-arrow-callback": "error",
		"prefer-const": "error",
		"require-yield": "error",
		"eol-last": ["error", "never"],
		"getter-return": "error",
		"no-await-in-loop": "error",
		"no-extra-parens": ["error", "functions"],
		"array-callback-return": "error",
		"dot-location": ["error", "property"],
		"dot-notation": "error",
		"no-alert": "error",
		"no-caller": "error",
		"no-div-regex": "error",
		"no-else-return": ["error", {allowElseIf: false}],
		"no-empty-function": "error",
		"no-eq-null": "error",
		"no-eval": "error",
		"no-extend-native": "error",
		"no-extra-bind": "error",
		"no-extra-label": "error",
		"no-floating-decimal": "error",
		"no-implicit-coercion": "error",
		"no-implicit-globals": "error",
		"no-implied-eval": "error",
		"no-iterator": "error",
		"no-labels": "error",
		"no-lone-blocks": "error",
		"no-multi-spaces": "error",
		"no-multi-str": "error",
		"no-new": "error",
		"no-new-func": "error",
		"no-proto": "error",
		"no-return-assign": "error",
		"no-return-await": "error",
		"no-script-url": "error",
		"no-self-compare": "error",
		"no-sequences": "error",
		"no-unused-expressions": ["error", {allowTernary: true}],
		"no-useless-call": "error",
		"no-useless-concat": "error",
		"no-useless-return": "error",
		"no-void": "error",
		"no-with": "error",
		"prefer-promise-reject-errors": "error",
		"require-await": "error",
		"yoda": "error",
		"strict": "error",
		"no-label-var": "error",
		"no-shadow-restricted-names": "error",
		"no-undef-init": "error",
		"no-buffer-constructor": "error",
		"no-new-require": "error",
		"no-path-concat": "error",
		"array-bracket-newline": ["error", {multiline: true}],
		"block-spacing": ["error", "never"],
		"capitalized-comments": ["error", "always", {ignoreConsecutiveComments: true}],
		"func-call-spacing": "error",
		"implicit-arrow-linebreak": "error",
		"jsx-quotes": ["error", "prefer-double"],
		"lines-between-class-members": ["error", "always", {exceptAfterSingleLine: true}],
		"multiline-comment-style": ["error", "separate-lines"],
		"multiline-ternary": ["error", "always-multiline"],
		"newline-per-chained-call": "error",
		"no-array-constructor": "error",
		"no-mixed-operators": "error"
	}
}
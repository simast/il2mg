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
		"no-console": "off",
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
		"eol-last": ["error", "always"]
	}
}

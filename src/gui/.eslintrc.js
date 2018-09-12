module.exports = {
	parserOptions: {
		ecmaFeatures: {
			jsx: true
		}
	},
	env: {
		browser: true
	},
	plugins: [
		"react"
	],
	extends: "plugin:react/recommended",
	rules: {
		"strict": "off",
		"react/display-name": "off",
		"react/prop-types": "off",
		"react/no-danger": "off",
		"react/jsx-tag-spacing": ["error", {
			closingSlash: "never",
			beforeSelfClosing: "always",
			afterOpening: "never"
		}],
		"react/jsx-boolean-value": "error",
		"react/jsx-indent": ["error", "tab"],
		"react/jsx-curly-spacing": ["error", {
			when: "never",
			children: true
		}],
		"react/jsx-closing-tag-location": "error",
		"react/jsx-closing-bracket-location": "error",
		"react/jsx-equals-spacing": "error",
		"react/jsx-filename-extension": "error",
		"react/jsx-first-prop-new-line": "error",
		"react/jsx-handler-names": ["error", {
			eventHandlerPrefix: "on",
			eventHandlerPropPrefix: "on"
		}],
		"react/jsx-indent-props": ["error", "tab"],
		"react/jsx-no-bind": ["error", {
			allowArrowFunctions: true
		}],
		"react/jsx-curly-brace-presence": "error",
		"react/jsx-pascal-case": "error",
		"react/jsx-wrap-multilines": "error"
	}
}

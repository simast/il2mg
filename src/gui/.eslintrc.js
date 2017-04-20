module.exports = {
	parser: "babel-eslint",
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
		"no-console": "error",
		"strict": "off",
		"react/display-name": "off",
		"react/prop-types": "off",
		"react/no-danger": "off"
	}
}
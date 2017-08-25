/** @copyright Simas Toleikis, 2015 */

// Enable Babel require() hook
require("babel-register")

module.exports = function(grunt) {

	// All source files
	const sourceFiles = [
		"gruntfile.js",
		"src/**/*.js*",
		"build/tasks/**/*.js"
	]

	grunt.initConfig({

		pkg: grunt.file.readJSON("package.json"),

		// ESLint JavaScript linter
		eslint: {
			all: {
				src: sourceFiles
			}
		},

		// Source code report task
		sloc: sourceFiles,

		// Clean task
		clean: {
			release: [
				"build/temp",
				"build/il2mg*"
			],
			data: [
				"data/**/*.json",
				"data/**/*.eng",
				"data/**/*.ger",
				"data/**/*.pol",
				"data/**/*.rus",
				"data/**/*.spa",
				"data/**/*.fra"
			]
		}
	})

	// Load all required NPM Grunt tasks
	grunt.loadNpmTasks("grunt-eslint")
	grunt.loadNpmTasks("grunt-contrib-clean")

	// Load custom build Grunt tasks
	grunt.loadTasks("build/tasks")

	// Default task used for building the project
	grunt.registerTask("default", [
		"clean:data",
		"eslint",
		"build:sloc",
		"build:blocks",
		"build:locations",
		"build:airfields",
		"build:fronts",
		"build:index"
	])

	// Task to build a release package for the project
	grunt.registerTask("release", [
		"clean:release",
		"default",
		"build:release"
	])
}
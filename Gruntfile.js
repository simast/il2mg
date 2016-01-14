/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// All source files	used with JSCS and JSHint tasks
	const sourceFiles = [
		"Gruntfile.js",
		"src/**/*.js",
		"build/**/*.js"
	];

	grunt.initConfig({

		pkg: grunt.file.readJSON("package.json"),

		// JavaScript code style checker task
		jscs: {
			all: {
				src: grunt.file.match("**/*.js", sourceFiles),
				options: {
					config: "build/.jscsrc",
					esnext: true
				}
			}
		},

		// JSHint validator task
		jshint: {
			all: {
				src: grunt.file.match("**/*.js", sourceFiles),
				options: {
					jshintrc: "build/.jshintrc"
				}
			}
		},

		// Source code report task
		sloc: sourceFiles,

		// Clean task
		clean: {
			compile: [
				"build/temp",
				"build/il2mg",
				"build/il2mg.exe"
			],
			data: [
				"data/**/*.eng",
				"data/**/*.ger",
				"data/**/*.pol",
				"data/**/*.rus",
				"data/**/*.spa",
				"data/**/*.fra"
			]
		}
	});

	// Load all required NPM Grunt tasks
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-clean");

	// Load custom build Grunt tasks
	grunt.loadTasks("build/tasks");

	// Task to run static code analysis using JSHint and JSCS
	grunt.registerTask("check", [
		"jscs",
		"jshint"
	]);
	
	// Default task used for building the project
	grunt.registerTask("default", [
		"clean:data",
		"check",
		"build:sloc",
		"build:blocks",
		"build:airfields",
		"build:fronts"
	]);
	
	// Task to build and compile the project
	grunt.registerTask("compile", [
		"clean:compile",
		"default",
		"build:compile"
	]);
};
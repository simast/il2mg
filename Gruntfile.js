/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// All source files	used with JSCS and JSHint tasks
	var sourceFiles = [
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
					node: true,
					esnext: true,
					validthis: true,
					globals: {
						log: true,
						DATA: true
					},
					"-W053": true, // Do not use {a} as a constructor
					"-W055": true, // A constructor name should start with an uppercase letter
					"-W083": true // Don't make functions within a loop
				}
			}
		},

		// Source code report task
		sloc: sourceFiles,

		// Clean task
		clean: {
			build: [
				"build/il2mg",
				"build/il2mg.exe",
				"build/il2mg.upx"
			],
			data: [
				"data/**/*.eng",
				"data/**/*.ger",
				"data/**/*.pol",
				"data/**/*.rus"
			]
		}
	});

	// Load all required NPM Grunt tasks
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-clean");

	// Load custom build Grunt tasks
	grunt.loadTasks("build/tasks");

	// Register Grunt tasks
	grunt.registerTask("check", ["jscs", "jshint"]);
	grunt.registerTask("default", [
		"clean",
		"check",
		"build:sloc",
		"build:blocks",
		"build:airfields",
		"build:fronts",
		"build:compile"
	]);
};
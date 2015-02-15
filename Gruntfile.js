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
					config: "jscs.json"
				}
			}
		},

		// JSHint validator task
		jshint: {
			all: {
				src: grunt.file.match("**/*.js", sourceFiles),
				options: {
					node: true,
					"-W053": true, // Do not use {a} as a constructor
					"-W083": true // Don't make functions within a loop
				}
			}
		}
	});

	// Load required Grunt tasks
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadTasks("build/tasks");

	// Register Grunt tasks
	grunt.registerTask("check", ["jscs", "jshint"]);
	grunt.registerTask("default", [
		"check",
		"build:blocks",
		"build:compile"
	]);
};
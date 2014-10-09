/** @copyright Simas Toleikis, 2014 */
"use strict";

module.exports = function(grunt) {

	// All source files	used with JSCS and JSHint tasks
	var sourceFiles = [
		"gruntfile.js",
		"src/**/*.js"
	];
	
	grunt.initConfig({
	
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

	// Load required NPM grunt task modules
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-contrib-jshint");

	// Grunt tasks
	grunt.registerTask("check", ["jscs", "jshint"]);
	grunt.registerTask("default", ["check"]);
};
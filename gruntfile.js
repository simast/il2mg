/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// All source files	used with JSCS and JSHint tasks
	var sourceFiles = [
		"gruntfile.js",
		"src/**/*.js",
		"tools/**/*.js"
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

	// Grunt compile task
	grunt.task.registerTask("compile", "Compile a binary executable file.", function() {

		var done = this.async();
		var encloseExec = require("enclose").exec;
		var encloseOptions = [];
		var extension = (process.platform === "win32") ? ".exe" : "";

		if (process.arch === "x64") {
			encloseOptions.push("--x64");
		}
		
		encloseOptions.push("--output=./" + grunt.config("pkg.name") + extension);
		encloseOptions.push(grunt.config("pkg.main"));

		var enclose = encloseExec(encloseOptions);

		enclose.on("error", done);
		enclose.on("exit", done);
	});

	// Load required NPM grunt task modules
	grunt.loadNpmTasks("grunt-jscs");
	grunt.loadNpmTasks("grunt-contrib-jshint");

	// Grunt tasks
	grunt.registerTask("check", ["jscs", "jshint"]);
	grunt.registerTask("default", ["check", "compile"]);
};
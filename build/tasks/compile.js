/** @copyright Simas Toleikis, 2015 */
"use strict";

var stripJSONComments = require("strip-json-comments");
var enclose = require("enclose");

module.exports = function(grunt) {

	// Grunt task used to compile to a single binary executable file
	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		var done = this.async();
		var buildName = grunt.config("pkg.name");
		var buildDir = "build/" + buildName + "/";

		// Prepare data JSON files for binary executable use
		grunt.file.expand("data/**/*.json").forEach(function(dataFile) {

			var jsonData = JSON.parse(stripJSONComments(grunt.file.read(dataFile)));

			grunt.file.write(buildDir + dataFile, JSON.stringify(jsonData));
		});

		// Copy over app source files
		// TODO: Minify/combine into a single file?
		grunt.file.expand("src/**/*.js").forEach(function(sourceFile) {
			grunt.file.copy(sourceFile, buildDir + sourceFile);
		});

		var options = [];
		var extension = (process.platform === "win32") ? ".exe" : "";

		if (process.arch === "x64") {
			options.push("--x64");
		}

		options.push("--version=v2.2.1"); // io.js
		options.push("--config=../enclose.js");
		options.push("--loglevel=error");
		options.push("--output=../" + buildName + extension);
		options.push(grunt.config("pkg.main"));

		grunt.file.setBase(buildDir);

		var compileTask = enclose.exec(options);

		function onDone(error) {

			grunt.file.setBase("../../");

			if (!error) {
				grunt.log.ok();
			}

			// Clean up temporary build directory
			grunt.file.delete(buildDir);

			done(error);
		}

		compileTask.on("error", onDone);
		compileTask.on("exit", onDone);
	});
};
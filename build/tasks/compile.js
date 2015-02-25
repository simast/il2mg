/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to compile to a single binary executable file
	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		var done = this.async();
		var stripJSONComments = require("strip-json-comments");
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

		var encloseExec = require("enclose").exec;
		var encloseOptions = [];
		var extension = (process.platform === "win32") ? ".exe" : "";

		if (process.arch === "x64") {
			encloseOptions.push("--x64");
		}

		encloseOptions.push("--config=../enclose.js");
		encloseOptions.push("--loglevel=error");
		encloseOptions.push("--output=../" + buildName + extension);
		encloseOptions.push(grunt.config("pkg.main"));

		grunt.file.setBase(buildDir);

		var enclose = encloseExec(encloseOptions);

		function onDone(error) {

			grunt.file.setBase("../../");

			if (!error) {
				grunt.log.ok();
			}

			// Clean up temporary build directory
			grunt.file.delete(buildDir);

			done(error);
		}

		enclose.on("error", onDone);
		enclose.on("exit", onDone);
	});
};
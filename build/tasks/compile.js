/** @copyright Simas Toleikis, 2015 */
"use strict";

const JSON5 = require("json5");
const enclose = require("enclose");

module.exports = function(grunt) {

	// Grunt task used to compile to a single binary executable file
	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		const done = this.async();
		const buildName = grunt.config("pkg.name");
		const buildDir = "build/" + buildName + "/";

		// Copy over plain JSON data and app source files
		grunt.file.expand([
			"data/**/*.json",
			"src/**/*.js"
		]).forEach((file) => {
			grunt.file.copy(file, buildDir + file);
		});
		
		// Convert JSON5 data files to plain JSON format for binary executable use
		grunt.file.expand("data/**/*.json5").forEach((dataFile) => {
			
			grunt.file.write(buildDir + dataFile.slice(0, -1), JSON.stringify(
				JSON5.parse(grunt.file.read(dataFile))
			));
		});

		const options = [];
		const extension = (process.platform === "win32") ? ".exe" : "";
		const binaryFilePath = "../" + buildName + extension;

		options.push("--version", "5.4.0");
		options.push("--features", "no"); // Support all CPUs (don't use SSE3/AVX/etc)
		options.push("--config", "../enclose.js");
		options.push("--loglevel", "error");
		options.push("--output", binaryFilePath);
		options.push(grunt.config("pkg.main"));

		grunt.file.setBase(buildDir);

		enclose.exec(options, (error) => {

			if (!error) {

				// TODO: Set executable file resource info

				// Clean up temporary build directory
				grunt.file.setBase("../../");
				grunt.file.delete(buildDir);

				grunt.log.ok();
			}

			done(error);
		});
	});
};
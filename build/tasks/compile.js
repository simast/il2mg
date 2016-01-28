/** @copyright Simas Toleikis, 2015 */
"use strict";

const path = require("path");
const JSON5 = require("json5");
const enclose = require("enclose");

module.exports = function(grunt) {

	// Grunt task used to compile to a single binary executable file
	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		const done = this.async();
		const buildName = grunt.config("pkg.name");
		const buildDir = "build/temp/";
		
		// Convert JSON5 data files to PSON format for binary executable use
		grunt.file.expand("@(data|src)/**/*.@(js|json|json5)").forEach((file) => {
			
			const fileExt = path.extname(file);
			
			// Copy over app JavaScript source code files
			// TODO: Use UglifyJS to uglify the code?
			if (fileExt === ".js") {
				grunt.file.copy(file, buildDir + file);
			}
			// Convert JSON5 data files to JSON format
			else {
				
				let jsonParse = JSON.parse;
				
				if (fileExt === ".json5") {
					jsonParse = JSON5.parse;
				}
				
				// Rename file path to always use .json extension
				const fileJSON = path.join(
					path.dirname(file),
					path.basename(file, path.extname(file)) + ".json"
				);
				
				grunt.file.write(buildDir + fileJSON, JSON.stringify(
					jsonParse(grunt.file.read(file))
				));
			}
		});

		const options = [];
		const extension = (process.platform === "win32") ? ".exe" : "";
		const binaryFilePath = "../" + buildName + extension;

		options.push("--version", "5.5.0");
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
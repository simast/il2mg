/** @copyright Simas Toleikis, 2015 */
"use strict";

var JSON5 = require("json5");
var enclose = require("enclose");

module.exports = function(grunt) {

	// Grunt task used to compile to a single binary executable file
	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		var done = this.async();
		var buildName = grunt.config("pkg.name");
		var buildDir = "build/" + buildName + "/";

		// Convert data JSON5 files to JSON format for binary executable use
		grunt.file.expand("data/**/*.json").forEach(function(dataFile) {

			var jsonData = JSON5.parse(grunt.file.read(dataFile));

			grunt.file.write(buildDir + dataFile, JSON.stringify(jsonData));
		});

		// Copy over app source files
		grunt.file.expand("src/**/*.js").forEach(function(sourceFile) {
			grunt.file.copy(sourceFile, buildDir + sourceFile);
		});

		var options = [];
		var extension = (process.platform === "win32") ? ".exe" : "";
		var binaryFilePath = "../" + buildName + extension;

		options.push("--version", "5.1.1");
		options.push("--config", "../enclose.js");
		options.push("--loglevel", "error");
		options.push("--output", binaryFilePath);
		options.push(grunt.config("pkg.main"));

		grunt.file.setBase(buildDir);

		enclose.exec(options, function(error) {
			
			if (error) {
				return done(error);
			}
			
			// TODO: Set executable file resource info

			// Compress binary file with UPX executable packer
			grunt.util.spawn({
				cmd: "../tools/upx.exe",
				args: ["-qqq", "--best", binaryFilePath]
			}, function(error, result, code) {
				
				grunt.file.setBase("../../");
	
				// Clean up temporary build directory
				grunt.file.delete(buildDir);
				
				if (!error) {
					grunt.log.ok();
				}
				
				done(error);
			});
		});
	});
};
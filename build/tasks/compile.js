/** @copyright Simas Toleikis, 2015 */
"use strict";

// Grunt task used to compile to a single binary executable file
module.exports = function(grunt) {

	grunt.registerTask("build:compile", "Compile a binary executable file.", function() {

		var done = this.async();
		var encloseExec = require("enclose").exec;
		var encloseOptions = [];
		var extension = (process.platform === "win32") ? ".exe" : "";

		if (process.arch === "x64") {
			encloseOptions.push("--x64");
		}

		encloseOptions.push("--config=./build/enclose.js");
		encloseOptions.push("--output=./build/" + grunt.config("pkg.name") + extension);
		encloseOptions.push(grunt.config("pkg.main"));

		var enclose = encloseExec(encloseOptions);

		enclose.on("error", done);

		enclose.on("exit", function() {

			grunt.log.ok();
			done();
		});
	});
};
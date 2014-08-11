/** @copyright Simas Toleikis, 2014 */
"use strict";

module.exports = function(grunt) {

	// Build task
	grunt.registerTask("build", "Build a binary file.", function() {

		var nexe = require("nexe");

		nexe.compile({
			input: "src/main.js",
			output: "il2mg",
			runtime: "0.10.30",
			flags: true
		}, function(error) {
			grunt.log.writeln(error);
		});
	});

	// Default grunt task
	grunt.registerTask("default", ["build"]);

};
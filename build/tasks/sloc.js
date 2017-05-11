/** @copyright Simas Toleikis, 2015 */
"use strict";

module.exports = function(grunt) {

	// Grunt task used to analyze source code lines and comments
	grunt.registerTask("build:sloc", "Analyze source code.", () => {

		const sloc = require("sloc");
		const path = require("path");
		const numeral = require("numeral");

		const sourceFiles = grunt.file.expand(grunt.config("sloc"));
		let totalSource = 0;
		let totalComments = 0;
		let totalFiles = 0;

		sourceFiles.forEach(sourceFile => {

			const sourceType = path.extname(sourceFile).split(".")[1];
			const sourceReport = sloc(grunt.file.read(sourceFile), sourceType);

			totalSource += sourceReport.source + sourceReport.comment;
			totalComments += sourceReport.comment;
			totalFiles++;
		});

		let message = "";

		message += numeral(totalFiles).format("0,0") + " ";
		message += grunt.util.pluralize(totalFiles, "file/files") + " with ";
		message += numeral(totalSource).format("0,0") + " ";
		message += grunt.util.pluralize(totalSource, "line/lines") + " of source code";
		message += " (" + Math.round(totalComments / totalSource * 100) + "% comments)";

		grunt.log.ok(message);
	});
};
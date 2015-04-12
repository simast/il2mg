/** @copyright Simas Toleikis, 2015 */
"use strict";

var sloc = require("sloc");
var path = require("path");
var numeral = require("numeral");

module.exports = function(grunt) {

	// Grunt task used to analyze source code lines and comments
	grunt.registerTask("build:sloc", "Analyze source code.", function() {

		var sourceFiles = grunt.file.expand(grunt.config("sloc"));
		var totalSource = 0;
		var totalComments = 0;

		sourceFiles.forEach(function(sourceFile) {

			var sourceType = path.extname(sourceFile).split(".")[1];
			var sourceReport = sloc(grunt.file.read(sourceFile), sourceType);

			totalSource += sourceReport.source + sourceReport.comment;
			totalComments += sourceReport.comment;
		});

		var message = "";

		message += numeral(totalSource).format("0,0") + " ";
		message += grunt.util.pluralize(totalSource, "line/lines") + " of source code";
		message += " (" + Math.round(totalComments / totalSource * 100) + "% comments)";

		grunt.log.ok(message);
	});
};
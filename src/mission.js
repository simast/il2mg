/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var Random = require("random-js");
var data = require("./data");

// Mission file extensions
var FILE_EXT_TEXT = "Mission";
var FILE_EXT_BINARY = "msnbin";
var FILE_EXT_LIST = "list";

/**
 * Mission constructor.
 *
 * @param {object} params Desired mission parameters (command-line arguments).
 */
function Mission(params) {

	this.blocks = []; // Blocks list
	this.lang = []; // Language data
	this.params = params; // Desired mission parameters

	// Initialize random number generator
	this.rand = new Random(Random.engines.browserCrypto);

	// Make mission parts
	require("./make/battle")(this, data);
	require("./make/date")(this, data);
	require("./make/time")(this, data);
	require("./make/map")(this, data);
	require("./make/weather")(this, data);
	require("./make/blocks")(this, data);
	require("./make/airfields")(this, data);
	require("./make/flights")(this, data);
	require("./make/name")(this, data);
	require("./make/briefing")(this, data);
}

/**
 * Get localized mission language code for a given string.
 *
 * @param {string} text Text string.
 * @returns {number} Localized mission language code.
 */
Mission.prototype.getLC = function(text) {

	if (typeof text !== "string" || !text.length) {
		throw new TypeError("Invalid mission language string.");
	}

	var languageCode = this.lang.indexOf(text);

	if (languageCode < 0) {
		languageCode = this.lang.push(text) - 1;
	}

	return languageCode;
};

/**
 * Save mission files.
 *
 * @param {string} fileName Mission file name.
 */
Mission.prototype.save = function(fileName) {

	// Use specified mission file path and name
	if (fileName && fileName.length) {

		// Make a path without an extension
		var fileDir = path.dirname(fileName);
		var fileBase = path.basename(fileName).replace(/\.[^/.]+$/, "");

		fileName = path.join(fileDir, fileBase);
	}

	// TODO: Generate mission file path and name if not specified

	this.saveText(fileName);
	this.saveBinary(fileName);
	this.saveLang(fileName);
};

/**
 * Save main .mission file.
 *
 * @param {string} fileName Mission file name (without extension).
 */
Mission.prototype.saveText = function(fileName) {

	var fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_TEXT);
	var mission = this;

	fileStream.once("open", function(fd) {

		// Required mission file header
		fileStream.write("# Mission File Version = 1.0;" + os.EOL);

		// Write mission blocks
		mission.blocks.forEach(function(block) {
			fileStream.write(os.EOL + block.toString() + os.EOL);
		});

		// Required mission file footer
		fileStream.write(os.EOL + "# end of file");

		fileStream.end();
	});
};

/**
 * Save binary .msnbin file.
 *
 * @param {string} fileName Mission file name (without extension).
 */
Mission.prototype.saveBinary = function(fileName) {

};

/**
 * Save .eng and other localisation files.
 *
 * @param {string} fileName Mission file name (without extension).
 */
Mission.prototype.saveLang = function(fileName) {

	var mission = this;

	data.languages.forEach(function(lang) {

		var fileStream = fs.createWriteStream(fileName + "." + lang);

		fileStream.once("open", function(fd) {

			// Write UCS2 little-endian BOM
			fileStream.write("FFFE", "hex");

			// Write language data
			mission.lang.forEach(function(value, index) {
				fileStream.write(index + ":" + value + os.EOL, "ucs2");
			});

			fileStream.end();
		});
	});
};

module.exports = Mission;
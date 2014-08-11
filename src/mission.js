/** @copyright Simas Toleikis, 2014 */
"use strict";

var fs = require("fs");
var os = require("os");

// Load required data
var DATA = {
	languages: require("./data/languages")
};

/**
 * Mission constructor.
 *
 * @param {object} params Desired mission parameters (command-line arguments).
 */
function Mission(params) {

	this.blocks = Object.create(null); // Active blocks list
	this._lang = []; // Language data
	this.params = params; // Desired mission parameters

	// Make mission parts
	require("./make/battle")(this);
	require("./make/date")(this);
	require("./make/time")(this);
	require("./make/weather")(this);
	require("./make/name")(this);
	require("./make/briefing")(this);
	require("./make/map")(this);
}

/**
 * Get localized mission language string index.
 *
 * @param {string} text Text string.
 * @returns {number} Localized mission language string index.
 */
Mission.prototype.lang = function(text) {

	if (typeof text !== "string" || !text.length) {
		throw TypeError("Invalid mission language string.");
	}

	var index = this._lang.indexOf(text);

	if (index < 0) {
		index = this._lang.push(text) - 1;
	}

	return index;
}

/**
 * Save main .Mission file.
 *
 * @param {string} fileName Mission file name (without extension).
 */
Mission.prototype.saveText = function(fileName) {

	var fileStream = fs.createWriteStream(fileName + ".Mission");
	var mission = this;

	fileStream.once("open", function(fd) {

		// Required mission file header
		fileStream.write("# Mission File Version = 1.0;" + os.EOL);

		// Write mission blocks
		for (var group in mission.blocks) {

			var blocks = mission.blocks[group];

			if (!Array.isArray(blocks)) {
				blocks = [blocks];
			}

			blocks.forEach(function(block) {
				fileStream.write(os.EOL + block.toString() + os.EOL);
			});
		}

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

	DATA.languages.forEach(function(lang) {

		var fileStream = fs.createWriteStream(fileName + "." + lang);

		fileStream.once("open", function(fd) {

			// Write UCS2 little-endian BOM
			fileStream.write("FFFE", "hex");

			// Write language data
			mission._lang.forEach(function(value, index) {
				fileStream.write(index + ":" + value + os.EOL, "ucs2");
			});

			fileStream.end();
		});
	});
};

module.exports = Mission;
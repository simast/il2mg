/** @copyright Simas Toleikis, 2014 */
"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var Module = require("module");
var stripJSONComments = require("strip-json-comments");

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

	this.entities = Object.create(null); // Active entities list
	this._lang = []; // Language data
	this.params = params; // Desired mission parameters

	// Make mission parts
	require("./make/battle")(this);
	require("./make/date")(this);
	require("./make/time")(this);
	require("./make/weather")(this);
	require("./make/flights")(this);
	require("./make/name")(this);
	require("./make/briefing")(this);
}

// Get/load all static data
Mission.DATA = (function() {

	var origJSONLoader = Module._extensions[".json"];

	// Temporary override Node JSON loader to support comments in JSON data files
	Module._extensions[".json"] = function(module, filename) {

		var json = stripJSONComments(fs.readFileSync(filename, "utf8"));
		var js = "module.exports = " + json;

		module._compile(js, filename);
	};

	var DATA = Object.create(null);

	DATA.airplanes = require("../data/airplanes");
	DATA.clouds = require("../data/clouds");
	DATA.coalitions = require("../data/coalitions");
	DATA.languages = require("../data/languages");
	DATA.missions = require("../data/missions");
	DATA.time = require("../data/time");
	DATA.version = require("../data/version");

	// Load country info
	DATA.countries = require("../data/countries");

	for (var countryID in DATA.countries) {

		var country = DATA.countries[countryID];
		var countryPath = "../data/countries/" + countryID + "/";

		country.ranks = require(countryPath + "ranks");
		country.names = require(countryPath + "names");
	}

	// Load battle info
	DATA.battles = require("../data/battles");

	for (var battleID in DATA.battles) {

		var battle = DATA.battles[battleID];
		var battlePath = "../data/battles/" + battleID + "/";

		battle.airfields = require(battlePath + "airfields");
		battle.fronts = require(battlePath + "fronts");
		battle.map = require(battlePath + "map");
		battle.places = require(battlePath + "places");
		battle.sun = require(battlePath + "sun");
		battle.weather = require(battlePath + "weather");

		// Load country-specific battle info
		battle.countries = Object.create(null);

		require(battlePath + "countries").forEach(function(countryID) {

			var country = battle.countries[countryID] = Object.create(null);
			var countryPath = battlePath + countryID + "/";

			country.pilots = require(countryPath + "pilots");
			country.units = require(countryPath + "units");
		});
	}

	// Restore original Node JSON loader
	Module._extensions[".json"] = origJSONLoader;

	return DATA;
}());

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
	// TODO: Generate mission file path and name
	else {

	}

	this.saveText(fileName);
	this.saveBinary(fileName);
	this.saveLang(fileName);
};

/**
 * Save main .Mission file.
 *
 * @param {string} fileName Mission file name (without extension).
 */
Mission.prototype.saveText = function(fileName) {

	var fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_TEXT);
	var mission = this;

	fileStream.once("open", function(fd) {

		// Required mission file header
		fileStream.write("# Mission File Version = 1.0;" + os.EOL);

		// Write mission entities
		for (var group in mission.entities) {

			var entities = mission.entities[group];

			if (!Array.isArray(entities)) {
				entities = [entities];
			}

			entities.forEach(function(entity) {
				fileStream.write(os.EOL + entity.toString() + os.EOL);
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

	Mission.DATA.languages.forEach(function(lang) {

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
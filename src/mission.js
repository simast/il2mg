/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var Random = require("random-js");

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
	require("./make/battle")(this);
	require("./make/date")(this);
	require("./make/time")(this);
	require("./make/map")(this);
	require("./make/weather")(this);
	require("./make/blocks")(this);
	require("./make/airfields")(this);
	require("./make/flights")(this);
	require("./make/name")(this);
	require("./make/briefing")(this);
}

// Get/load all static data
Mission.DATA = (function() {

	var stripJSONComments = require("strip-json-comments");
	var Module = require("module");
	var origJSONLoader = Module._extensions[".json"];

	// Temporary override Node JSON loader to support comments in JSON data files
	Module._extensions[".json"] = function(module, filename) {

		var json = stripJSONComments(fs.readFileSync(filename, "utf8"));
		var js = "module.exports = " + json;

		module._compile(js, filename);
	};

	var DATA = Object.create(null);

	DATA.name = require("../data/name");
	DATA.version = require("../data/version");
	DATA.airplanes = require("../data/airplanes");
	DATA.clouds = require("../data/clouds");
	DATA.coalitions = require("../data/coalitions");
	DATA.languages = require("../data/languages");
	DATA.missions = require("../data/missions");
	DATA.time = require("../data/time");

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

		battle.countries = require(battlePath + "countries");
		battle.blocks = require(battlePath + "blocks");
		battle.fronts = require(battlePath + "fronts");
		battle.map = require(battlePath + "map");
		battle.sun = require(battlePath + "sun");
		battle.weather = require(battlePath + "weather");
		battle.airfields = Object.create(null);
		battle.units = Object.create(null);

		// Load airfields
		require(battlePath + "airfields").forEach(function(airfieldID) {
			battle.airfields[airfieldID] = require(battlePath + "airfields/" + airfieldID);
		});

		// Load country-specific battle units
		battle.countries.forEach(function(countryID) {

			var countryUnits = battle.units[countryID] = Object.create(null);
			var countryUnitsPath = battlePath + "units/" + countryID;

			require(countryUnitsPath).forEach(function(unitFile) {

				var fileUnits = require(countryUnitsPath + "/" + unitFile);

				for (var unitID in fileUnits) {
					countryUnits[unitID] = fileUnits[unitID];
				}
			});
		});
	}

	// Restore original Node JSON loader
	Module._extensions[".json"] = origJSONLoader;

	return DATA;
}());

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

	Mission.DATA.languages.forEach(function(lang) {

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
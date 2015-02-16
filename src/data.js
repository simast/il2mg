/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");

// Get/load all static data
var data = (function() {

	var stripJSONComments = require("strip-json-comments");
	var Module = require("module");
	var origJSONLoader = Module._extensions[".json"];

	// Temporary override Node JSON loader to support comments in JSON data files
	Module._extensions[".json"] = function(module, filename) {

		var json = stripJSONComments(fs.readFileSync(filename, "utf8"));
		var js = "module.exports = " + json;

		module._compile(js, filename);
	};

	var data = Object.create(null);

	data.name = require("../data/name");
	data.version = require("../data/version");
	data.airplanes = require("../data/airplanes");
	data.clouds = require("../data/clouds");
	data.coalitions = require("../data/coalitions");
	data.languages = require("../data/languages");
	data.missions = require("../data/missions");
	data.time = require("../data/time");
	data.blocks = require("../data/blocks");
	data.countries = require("../data/countries");
	data.battles = require("../data/battles");

	// Load country info
	for (var countryID in data.countries) {

		var country = data.countries[countryID];
		var countryPath = "../data/countries/" + countryID + "/";

		country.ranks = require(countryPath + "ranks");
		country.names = require(countryPath + "names");
	}

	// Load battle info
	for (var battleID in data.battles) {

		var battle = data.battles[battleID];
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

	return data;
}());

/**
 * Register a new or update existing block (world object) type.
 *
 * @param {object} block Block data.
 * @returns {number} Block type ID.
 */
data.registerBlock = function(block) {

	if (typeof block !== "object" || !block.type || !block.script || !block.model) {
		throw new TypeError("Invalid block data.");
	}

	// Initialize blocks data
	if (typeof this.blocks !== "object") {

		this.blocks = {
			blocks: [],
			index: {}
		};
	}

	var blocks = this.blocks.blocks;
	var index = this.blocks.index;

	// Try to find existing block type by script index
	var blockType = index[block.script] || null;

	// Update existing block type data
	if (blockType !== null) {

		blocks[blockType].type = block.type;
		blocks[blockType].script = block.script;
		blocks[blockType].model = block.model;
	}
	// Add new block type
	else {

		blockType = blocks.push(block) - 1;

		// Create script index
		index[block.script] = blockType;
	}

	return blockType;
};

/**
 * Get block (world object) type data.
 *
 * @param {number|string} blockID Block ID or script name.
 * @returns {object} Block type data.
 */
data.getBlock = function(blockID) {

	// Look up block ID by script name
	if (typeof blockID === "string") {
		blockID = this.blocks.index[blockID];
	}

	var blockType = this.blocks.blocks[blockID];

	if (typeof blockType !== "object") {
		throw new TypeError("Invalid block ID.");
	}

	return blockType;
};

module.exports = data;
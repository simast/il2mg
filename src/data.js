/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var requireDir = require("require-directory");
var stripJSONComments = require("strip-json-comments");

// Get/load all static data
var data = (function() {

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
	data.vehicles = require("../data/vehicles");
	data.clouds = require("../data/clouds");
	data.coalitions = require("../data/coalitions");
	data.languages = require("../data/languages");
	data.missions = require("../data/missions");
	data.time = require("../data/time");
	data.items = require("../data/items");
	data.effects = require("../data/effects");
	data.grounds = require("../data/grounds");
	data.callsigns = require("../data/callsigns");
	data.countries = require("../data/countries");
	data.battles = require("../data/battles");

	// Load country info
	for (var countryID in data.countries) {

		var country = data.countries[countryID];
		var countryPath = "../data/countries/" + countryID + "/";

		country.ranks = require(countryPath + "ranks");
		country.names = require(countryPath + "names");
	}
	
	// Load plane data
	var planeData = requireDir(module, "../data/planes");
	data.planes = Object.create(null);
	
	for (var planeGroup in planeData) {
		for (var planeID in planeData[planeGroup]) {
			data.planes[planeID] = planeData[planeGroup][planeID];
		}
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

			var countryUnitsPath = battlePath + "units/" + countryID;

			require(countryUnitsPath).forEach(function(unitFile) {

				var fileUnits = require(countryUnitsPath + "/" + unitFile);

				for (var unitID in fileUnits) {

					battle.units[unitID] = fileUnits[unitID];
					battle.units[unitID].country = countryID;
				}
			});
		});
	}

	// Restore original Node JSON loader
	Module._extensions[".json"] = origJSONLoader;

	return data;
}());

/**
 * Register a new or update existing item (world object) type.
 *
 * @param {object} item Item data.
 * @returns {number} Item type ID.
 */
data.registerItemType = function(item) {

	if (typeof item !== "object" || !item.type || !item.script || !item.model) {
		throw new TypeError("Invalid item data.");
	}

	// Initialize items data
	if (typeof this.items !== "object") {

		this.items = {
			items: [],
			index: {}
		};
	}

	var items = this.items.items;
	var index = this.items.index;

	// Lowercase and trim script/model paths
	item.script = item.script.trim().toLowerCase();
	item.model = item.model.trim().toLowerCase();

	// Try to find existing item type ID by script index
	var itemTypeID = index[item.script];

	// Update existing item type data
	if (itemTypeID !== undefined) {

		items[itemTypeID].type = item.type;
		items[itemTypeID].script = item.script;
		items[itemTypeID].model = item.model;
	}
	// Add new item type
	else {

		itemTypeID = items.push(item) - 1;

		// Create script index
		index[item.script] = itemTypeID;
	}

	return itemTypeID;
};

/**
 * Get item (world object) type data.
 *
 * @param {number|string} itemTypeID Item type ID or script name.
 * @returns {object} Item type data.
 */
data.getItemType = function(itemTypeID) {

	// Look up item type ID by script name
	if (typeof itemTypeID === "string") {
		itemTypeID = this.items.index[itemTypeID.trim().toLowerCase()];
	}

	var itemType = this.items.items[itemTypeID];

	if (typeof itemType !== "object") {
		throw new TypeError("Invalid item type ID.");
	}

	return itemType;
};

module.exports = data;
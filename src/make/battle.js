/** @copyright Simas Toleikis, 2014 */
"use strict";

// Load required data
var DATA = {
	battles: require("../../data/battles"),
	countries: require("../../data/countries"),
	version: require("../../data/version"),
	name: require("../../data/name")
};

var Block = require("../block");

// Generate mission battle info
module.exports = function(mission) {

	var params = mission.params;
	var battleID = params.battle;

	// Select random battle
	if (!battleID) {

		var battleIDs = Object.keys(DATA.battles);
		battleID = battleIDs[Math.floor(Math.random() * battleIDs.length)];
	}

	mission.battleID = battleID;
	var battle = mission.battle = DATA.battles[battleID];

	// Create main mission Options block
	var options = new Block("Options");

	options.set("LCAuthor", mission.lang(DATA.name + " " + DATA.version));
	options.set("PlayerConfig", ""); // TODO: ?
	options.set("MissionType", 0); // Single-player mission

	// Map data
	options.set("HMap", battle.heightmap);
	options.set("Textures", battle.textures);
	options.set("Forests", battle.forests);
	options.set("Layers", "");
	options.set("GuiMap", battle.gui);
	options.set("SeasonPrefix", battle.seasonPrefix);

	// Set country:coalition list
	options.set("Countries", (function() {

		var countries = [];
		battle.countries.forEach(function(countryID) {
			countries.push(countryID + ":" + DATA.countries[countryID].coalition);
		});

		return countries;
	})());

	// Add "Options" mission block
	mission.blocks.Options = options;
};
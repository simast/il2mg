/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;
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

	options.LCAuthor = mission.getLC("il2mg " + DATA.version);
	options.MissionType = 0; // Single-player mission
	options.PlayerConfig = ""; // TODO: ?
	options.AqmId = 0; // TODO: ?

	// Map data
	options.HMap = battle.map.heightmap;
	options.Textures = battle.map.textures;
	options.Forests = battle.map.forests;
	options.Layers = "";
	options.GuiMap = battle.map.gui;
	options.SeasonPrefix = battle.map.seasonPrefix;

	// Set country:coalition list
	options.Countries = (function() {

		var countries = Object.keys(battle.units).map(Number);
		var value = [];

		value.push("0:0"); // Unknown country/coalition
		
		countries.forEach(function(countryID) {
			value.push(countryID + ":" + DATA.countries[countryID].coalition);
		});

		return value;
	})();

	// Add "Options" mission block
	mission.blocks.push(options);
	mission.blocks.Options = options;
};
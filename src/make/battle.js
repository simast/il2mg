/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;
var Entity = require("../Entity");

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

	// Create main mission Options entity
	var options = new Entity("Options");

	options.set("LCAuthor", mission.lang("il2mg " + DATA.version));
	options.set("PlayerConfig", ""); // TODO: ?
	options.set("MissionType", 0); // Single-player mission

	// Map data
	options.set("HMap", battle.map.heightmap);
	options.set("Textures", battle.map.textures);
	options.set("Forests", battle.map.forests);
	options.set("Layers", "");
	options.set("GuiMap", battle.map.gui);
	options.set("SeasonPrefix", battle.map.seasonPrefix);

	// Set country:coalition list
	options.set("Countries", (function() {

		var countries = [];

		countries.push("0:0"); // Unknown country/coalition

		for (var countryID in battle.countries) {
			countries.push(countryID + ":" + DATA.countries[countryID].coalition);
		}

		return countries;
	})());

	// Add "Options" mission entity
	mission.entities.Options = options;
};
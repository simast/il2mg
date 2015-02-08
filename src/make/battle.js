/** @copyright Simas Toleikis, 2015 */
"use strict";

var DATA = require("../mission").DATA;
var Block = require("../block");

// Generate mission battle info
module.exports = function(mission) {

	var params = mission.params;
	var battleID = params.battle;

	// Select random battle
	if (!battleID) {
		battleID = mission.rand.pick(Object.keys(DATA.battles));
	}

	mission.battleID = battleID;
	var battle = mission.battle = DATA.battles[battleID];

	// Create main mission Options block
	var options = new Block("Options");

	options.LCAuthor = mission.getLC("il2mg " + DATA.version);
	options.MissionType = 0; // Single-player mission
	options.PlayerConfig = ""; // TODO: ?
	options.AqmId = 0; // TODO: ?

	// Set country:coalition list
	options.Countries = (function() {

		var countries = [];

		countries.push("50:0"); // Unknown country/coalition

		battle.countries.forEach(function(countryID) {
			countries.push(countryID + ":" + DATA.countries[countryID].coalition);
		});

		return countries;
	})();

	// Add "Options" mission block
	mission.blocks.push(options);
	mission.blocks.Options = options;
};
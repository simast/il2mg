/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Generate mission battle info
module.exports = function(mission, data) {

	var params = mission.params;
	var battleID = params.battle;

	// Select random battle
	if (!battleID) {
		battleID = mission.rand.pick(Object.keys(data.battles));
	}

	mission.battleID = battleID;
	var battle = mission.battle = data.battles[battleID];

	// Create main mission Options block
	var options = new Block.Options();

	options.LCAuthor = mission.getLC(data.name + " " + data.version);
	options.MissionType = 0; // Single-player mission
	options.PlayerConfig = ""; // TODO: ?
	options.AqmId = 0; // TODO: ?

	// Set country:coalition list
	options.Countries = (function() {

		var countries = [];

		countries.push("50:0"); // Unknown country/coalition

		battle.countries.forEach(function(countryID) {
			countries.push(countryID + ":" + data.countries[countryID].coalition);
		});

		return countries;
	})();

	// Add "Options" mission block
	mission.addBlock(options);
	mission.blocks.Options = options;
};
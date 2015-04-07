/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission battle info
module.exports = function makeBattle() {

	var mission = this;
	var data = mission.data;
	var params = mission.params;
	var battleID = params.battle;

	// Select random battle
	if (!battleID) {
		battleID = mission.rand.pick(Object.keys(data.battles));
	}

	mission.battleID = battleID;
	var battle = mission.battle = data.battles[battleID];

	// Create main mission Options item
	var options = mission.createItem("Options");

	options.LCAuthor = mission.getLC(data.name + " " + data.version);
	options.MissionType = 0; // Single-player mission
	options.PlayerConfig = ""; // TODO: ?
	options.AqmId = 0; // TODO: ?

	// Set country:coalition list
	options.Countries = (function() {

		var countries = [];

		// Unknown (neutral) country/coalition
		countries.push([Item.DEFAULT_COUNTRY, Item.DEFAULT_COALITION]);

		battle.countries.forEach(function(countryID) {
			countries.push([countryID, data.countries[countryID].coalition]);
		});

		return countries;
	})();

	// Save "Options" mission item reference
	mission.items.Options = options;

	// Log mission battle
	log.I("Battle:", battle.name);
};
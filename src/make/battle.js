/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission battle info
module.exports = function makeBattle() {

	var params = this.params;
	var battleID = params.battle;

	// Select random battle
	if (!battleID) {
		battleID = this.rand.pick(Object.keys(DATA.battles));
	}

	this.battleID = battleID;
	var battle = this.battle = DATA.battles[battleID];
	var coalitions = this.coalitions = [];

	// Create main mission Options item
	var options = this.createItem("Options");

	options.LCAuthor = this.getLC(DATA.name + " " + DATA.version + " " + DATA.copyright);
	options.MissionType = 0; // Single-player mission
	options.PlayerConfig = ""; // TODO: ?
	options.AqmId = 0; // TODO: ?

	// Set country:coalition list
	options.Countries = (function() {

		var countries = [];

		// Unknown (neutral) country and coalition
		coalitions.push(Item.DEFAULT_COALITION);
		countries.push([Item.DEFAULT_COUNTRY, Item.DEFAULT_COALITION]);

		battle.countries.forEach(function(countryID) {
			
			var coalition = DATA.countries[countryID].coalition;
			
			coalitions.push(coalition);
			countries.push([countryID, coalition]);
		});

		return countries;
	})();

	// Save "Options" mission item reference
	this.items.Options = options;

	// Log mission battle
	log.I("Battle:", battle.name);
};
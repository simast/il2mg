/** @copyright Simas Toleikis, 2015 */
"use strict";

var DATA = require("../mission").DATA;
var Block = require("../block");

// Generate mission airfields
module.exports = function(mission) {

	var params = mission.params;
	var battle = mission.battle;

	// Draw airfield icons on the map in debug mode
	if (params.debug) {

		// Make a list of active battle coalitions
		var activeCoalitions = [];

		// Unknown coalition
		activeCoalitions.push(0);

		// Coalitions from active countries
		battle.countries.forEach(function(countryID) {
			activeCoalitions.push(DATA.countries[countryID].coalition);
		});

		for (var airfieldID in battle.airfields) {

			var airfield = battle.airfields[airfieldID];

			var airfieldIcon = new Block(Block.ICON);

			airfieldIcon.IconId = 903;
			airfieldIcon.setPosition(airfield.position);
			airfieldIcon.setCoalitions(activeCoalitions);
			airfieldIcon.setName(mission.getLC(airfield.name));

			mission.blocks.push(airfieldIcon);
		}
	}
};
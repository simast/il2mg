/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission fronts
module.exports = function makeFronts() {
	
	// Resolve required fronts file based on mission date
	var frontsFile = this.battle.fronts[this.date.format("YYYY-MM-DD")];

	if (!frontsFile) {
		return;
	}

	// Load fronts data file
	var frontsPath = "../../data/battles/" + this.battleID + "/fronts/";
	var frontsData = require(frontsPath + frontsFile);

	// Front icons group
	var frontsGroup = this.createItem("Group");
	frontsGroup.setName("FRONT");

	// Build coalitions list used with front icons
	var coalitions = [Item.DEFAULT_COALITION];

	for (var countryID of this.battle.countries) {

		var coalitionID = DATA.countries[countryID].coalition;

		if (coalitions.indexOf(coalitionID) === -1) {
			coalitions.push(coalitionID);
		}
	}

	for (var section of frontsData.fronts) {

		// Ignore single point front lines
		if (section.length <= 1) {
			continue;
		}

		var prevPointItem = null;

		for (var point of section) {

			// Create front line point icon item
			var pointItem = frontsGroup.createItem("MCU_Icon");

			pointItem.setPosition(point[0], point[1]);
			pointItem.LineType = 13;
			pointItem.Coalitions = coalitions;

			// Connect point items with target links
			if (prevPointItem) {
				prevPointItem.addTarget(pointItem);
			}

			prevPointItem = pointItem;
		}
	}
};
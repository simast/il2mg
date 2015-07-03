/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU_Icon = Item.MCU_Icon;
var frontLine = DATA.frontLine;

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
	
	if (!frontsData || !frontsData.length) {
		return;
	}

	// Front icons group
	var frontsGroup = this.createItem("Group");
	frontsGroup.setName("FRONT");

	// Coalitions list used for front icons
	var coalitions = [Item.DEFAULT_COALITION];

	// All coalitions can see front lines
	for (var countryID of this.battle.countries) {

		var coalitionID = DATA.countries[countryID].coalition;

		if (coalitions.indexOf(coalitionID) === -1) {
			coalitions.push(coalitionID);
		}
	}

	// Process front line segments
	for (var segment of frontsData) {

		var prevPointItem = null;
		var firstPointItem = null;

		// Process front line points
		for (var point of segment) {
			
			var pointItem;

			// Flag for a looping front line segment
			if (point === true) {
				pointItem = firstPointItem;
			}
			else {

				var pointType = point[0];

				// Create front line point icon item
				pointItem = frontsGroup.createItem("MCU_Icon");

				pointItem.setPosition(point[1], point[2]);
				pointItem.Coalitions = coalitions;

				// Border line
				if (pointType === frontLine.BORDER) {
					pointItem.LineType = MCU_Icon.LINE_POSITION_0;
				}
				// Attack arrow
				else if (pointType === frontLine.ATTACK) {
					pointItem.LineType = MCU_Icon.LINE_ATTACK;
				}
				// Defensive line
				else if (pointType === frontLine.DEFEND) {
					pointItem.LineType = MCU_Icon.LINE_DEFEND;
				}
			}

			// Connect point items with target links
			if (prevPointItem) {
				prevPointItem.addTarget(pointItem);
			}

			prevPointItem = pointItem;

			if (!firstPointItem) {
				firstPointItem = pointItem;
			}
		}
	}
};
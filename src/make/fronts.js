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
	// TODO: Move to data.js?
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

	// All coalitions can see front icon items
	for (var countryID of this.battle.countries) {

		var coalitionID = DATA.countries[countryID].coalition;

		if (coalitions.indexOf(coalitionID) === -1) {
			coalitions.push(coalitionID);
		}
	}

	// Indexed list of created point icons
	var pointItems = Object.create(null);

	// Process front points
	for (var pointID = 0; pointID < frontsData.length; pointID++) {
		makeFrontPoint(pointID);
	}

	// Make front point icon item
	function makeFrontPoint(pointID) {

		// Point item is already created
		if (pointItems[pointID]) {
			return;
		}

		var point = frontsData[pointID];
		var pointType = point[0];
		var pointTargets = point[3];
		var pointItem = frontsGroup.createItem("MCU_Icon");

		pointItem.setPosition(point[1], point[2]);
		pointItem.Coalitions = coalitions;

		// Border line
		if (pointType === frontLine.BORDER) {
			pointItem.LineType = MCU_Icon.LINE_POSITION_0;
		}
		// Attack arrow
		else if (pointType === frontLine.ATTACK) {

			pointItem.LineType = MCU_Icon.LINE_ATTACK;
			pointItem.RColor = 165;
			pointItem.GColor = 165;
			pointItem.BColor = 165;
		}
		// Defensive line
		else if (pointType === frontLine.DEFEND) {
			pointItem.LineType = MCU_Icon.LINE_DEFEND;
		}

		// Index point icon item
		pointItems[pointID] = pointItem;

		// Connect point items with target links
		if (pointTargets) {
			
			for (var targetID of pointTargets) {
				
				// Target item is not yet created
				if (!pointItems[targetID]) {
					makeFrontPoint(targetID);
				}
				
				pointItem.addTarget(pointItems[targetID]);
			}
		}
	}
};
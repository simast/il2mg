/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU_Icon = Item.MCU_Icon;
var frontLine = DATA.frontLine;
var mapColor = DATA.mapColor;

// Generate mission fronts
module.exports = function makeFronts() {
	
	var mission = this;
	
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
		pointItem.Coalitions = mission.coalitions;

		// Border line
		if (pointType === frontLine.BORDER) {
			pointItem.LineType = MCU_Icon.LINE_POSITION_0;
		}
		// Attack arrow
		else if (pointType === frontLine.ATTACK) {

			pointItem.LineType = MCU_Icon.LINE_ATTACK;
			pointItem.setColor(mapColor.ATTACK);
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
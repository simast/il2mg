/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");
const Location = require("./locations").Location;
const MCU_Icon = Item.MCU_Icon;
const frontLine = DATA.frontLine;
const mapColor = DATA.mapColor;

// Generate mission fronts
module.exports = function makeFronts() {
	
	const mission = this;
	
	// Initialize locations index for front points
	const locations = this.locations.fronts = new Location.Index();
	
	// Resolve required fronts file based on mission date
	const frontsFile = this.battle.fronts[this.date.format("YYYY-MM-DD")];

	if (!frontsFile) {
		return;
	}

	// Load fronts data file
	// TODO: Move to data.js?
	const frontsPath = "../../data/battles/" + this.battleID + "/fronts/";
	const frontsData = require(frontsPath + frontsFile);
	
	if (!frontsData || !frontsData.length) {
		return;
	}

	// Front icons group
	const frontsGroup = this.createItem("Group");
	frontsGroup.setName("FRONT");

	// Indexed list of created point icons
	const pointItems = Object.create(null);

	// Process front points
	for (let pointID = 0; pointID < frontsData.length; pointID++) {
		makeFrontPoint(pointID);
	}

	// Make front point icon item
	function makeFrontPoint(pointID) {

		// Point item is already created
		if (pointItems[pointID]) {
			return;
		}

		const point = frontsData[pointID];
		const pointType = point[0];
		const pointTargets = point[3];
		const pointItem = frontsGroup.createItem("MCU_Icon");

		pointItem.setPosition(point[1], point[2]);
		pointItem.Coalitions = mission.coalitions;
		
		// TODO: Follow bezier curves and generate more front line points
		locations.add(new Location(point[1], point[2]));

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
			
			for (const targetID of pointTargets) {
				
				// Target item is not yet created
				if (!pointItems[targetID]) {
					makeFrontPoint(targetID);
				}
				
				pointItem.addTarget(pointItems[targetID]);
			}
		}
	}
};
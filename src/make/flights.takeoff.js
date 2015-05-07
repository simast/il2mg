/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Make mission flight take off logic
module.exports = function makeFlightTakeoff(flight) {

	// No takeoff command for player-only taxi route (or flight from air start)
	if (!flight.taxi) {
		return;
	}

	var airfield = this.airfieldsByID[flight.airfield];

	flight.elements.forEach(function(element) {

		var missionBegin = flight.group.createItem("MCU_TR_MissionBegin");
		var takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");
	
		missionBegin.setPositionNear(element[0].item);
		missionBegin.addTarget(takeoffCommand);

		takeoffCommand.setPositionNear(missionBegin);
		takeoffCommand.setPosition(
			takeoffCommand.XPos,
			takeoffCommand.YPos + 500,
			takeoffCommand.ZPos
		);

		takeoffCommand.addObject(element[0].item);
	});
};
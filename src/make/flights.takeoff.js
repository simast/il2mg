/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Make mission flight take off logic
module.exports = function makeFlightTakeoff(flight) {

	var airfield = this.airfieldsByID[flight.airfield];
	var planes = flight.planes;

	var missionBegin = flight.group.createItem("MCU_TR_MissionBegin");
	var takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

	missionBegin.setPositionNear(planes.leader.item);
	missionBegin.addTarget(takeoffCommand);

	takeoffCommand.setPositionNear(missionBegin);
	takeoffCommand.setPosition(
		takeoffCommand.XPos,
		takeoffCommand.YPos + 250,
		takeoffCommand.ZPos
	);
	
	takeoffCommand.addObject(planes.leader.item);
};
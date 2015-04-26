/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");

// Make mission flight take off logic
module.exports = function makeFlightTakeoff(flight) {

	var airfield = this.airfieldsByID[flight.airfield];
	var leaderPlane = flight.planes[0];

	var missionBegin = flight.group.createItem("MCU_TR_MissionBegin");
	var takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");

	missionBegin.setPositionNear(leaderPlane.item);
	missionBegin.addTarget(takeoffCommand);

	takeoffCommand.setPositionNear(missionBegin);
	takeoffCommand.addObject(leaderPlane.item);
};
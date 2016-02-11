/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU_CMD_Formation = require("../item").MCU_CMD_Formation;

// Make plan form up action
module.exports = function makePlanForm(action, element, flight, input) {
	
	const leaderPlaneItem = element[0].item;
	const isLeadingElement = (element === flight.elements[0]);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);
	
	// Set cover command for non-leading elements
	if (!isLeadingElement) {
		
		const coverCommand = flight.group.createItem("MCU_CMD_Cover");
		
		coverCommand.setPositionNear(leaderPlaneItem);
		coverCommand.addObject(leaderPlaneItem);
		coverCommand.addTarget(flight.elements[0][0].item.entity);
		
		input(coverCommand);
	}
	
	// Set element plane formation command
	if (element.length > 1) {
		
		const formationCommand = flight.group.createItem("MCU_CMD_Formation");
	
		formationCommand.FormationType = MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT;
		formationCommand.FormationDensity = MCU_CMD_Formation.DENSITY_LOOSE;
		formationCommand.addObject(leaderPlaneItem);
		formationCommand.setPositionNear(leaderPlaneItem);

		input(formationCommand);
	}
	
	// NOTE: No more commands should be generated when player is a flight leader!
	if (isPlayerFlightLeader && !debugFlights) {
		return;
	}

	// Connect form up to next action
	return input;
};
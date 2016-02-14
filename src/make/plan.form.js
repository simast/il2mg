/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU_CMD_Formation = require("../item").MCU_CMD_Formation;

// Make plan form up action
module.exports = function makePlanForm(action, element, flight, input) {
	
	const rand = this.rand;
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
		let formationType = MCU_CMD_Formation.TYPE_PLANE_V;
		
		// Use edge formation for two plane elements
		if (element.length === 2) {
			
			const edgeFormations = [
				MCU_CMD_Formation.TYPE_PLANE_EDGE_LEFT,
				MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT
			];
			
			// Pick left/right edge formation direction based on element index
			if (flight.elements.length > 1) {
				formationType = edgeFormations[flight.elements.indexOf(element) % 2];
			}
			// Pick a random edge formation direction
			else {
				formationType = rand.pick(edgeFormations);
			}
		}
		
		formationCommand.FormationType = formationType;
		formationCommand.FormationDensity = MCU_CMD_Formation.DENSITY_SAFE;
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
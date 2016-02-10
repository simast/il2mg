/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan wait action
module.exports = function makePlanWait(action, element, flight, input) {

	const leaderElement = flight.elements[0];

	// Proccess wait action only for leading element
	if (element !== leaderElement) {
		return;
	}

	const leaderPlaneItem = element[0].item;
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);
	
	// NOTE: Wait command will not be generated when player is a flight leader!
	if (isPlayerFlightLeader && !debugFlights) {
		return input;
	}
	
	// Wait using timer command
	const waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = action.time;
	waitTimer.setPositionNear(leaderPlaneItem);

	// Connect timer command to previous action
	input(waitTimer);

	// Connect timer command to next action
	return function(input) {
		waitTimer.addTarget(input);
	};
};
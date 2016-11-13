/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan wait action
module.exports = function makePlanWaitAction(flight, element, action, input) {

	if (!input) {
		return;
	}

	const leaderElement = flight.elements[0];

	// Proccess wait action only for leading element
	if (element !== leaderElement) {
		return;
	}

	const leaderPlaneItem = element[0].item;

	// Wait using timer command
	const waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = action.time;
	waitTimer.setPositionNear(leaderPlaneItem);

	// Connect timer command to previous action
	input(waitTimer);

	// Connect timer command to next action
	return (input) => {
		waitTimer.addTarget(input);
	};
};
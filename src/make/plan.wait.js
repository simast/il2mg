/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan wait action
module.exports = function makePlanWait(action, element, flight, input) {

	var leaderElement = flight.elements[0];

	// Proccess wait action only for leading element
	if (element !== leaderElement) {
		return;
	}

	var leaderPlaneItem = element[0].item;
	var waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = action.time;
	waitTimer.setPositionNear(leaderPlaneItem);

	// Connect timer command to previous action
	input(waitTimer);

	return function(input) {
		waitTimer.addTarget(input);
	};
};
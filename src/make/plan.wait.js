/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan wait action
module.exports = function makePlanWait(flight, action, input) {

	var waitTimer = flight.group.createItem("MCU_Timer");

	waitTimer.Time = action.time;
	waitTimer.setPositionNear(flight.leader.item);

	input(waitTimer);

	return function(input) {
		waitTimer.addTarget(input);
	};
};
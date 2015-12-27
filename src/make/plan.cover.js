/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU_CMD_Cover = require("../item").MCU_CMD_Cover;

// Make plan cover action
module.exports = function makePlanCover(action, element, flight, input) {

	const leaderElement = flight.elements[0];

	// Proccess cover action only for leading element
	if (element !== leaderElement) {
		return;
	}
	
	const leaderPlaneItem = element[0].item;
	const target = action.target;
	
	// Add cover command for specified target
	if (target) {
		
		const coverCommand = flight.group.createItem("MCU_CMD_Cover");
		
		coverCommand.setPositionNear(target);
		coverCommand.addObject(leaderPlaneItem);
		coverCommand.addTarget(target.entity);
		
		coverCommand.Priority = MCU_CMD_Cover.PRIORITY_LOW;
		coverCommand.CoverGroup = 0;
		
		input(coverCommand);
	}
	
	// No cover timer required
	if (!action.time) {
		return input;
	}
	
	const coverTimer = flight.group.createItem("MCU_Timer");

	coverTimer.Time = action.time;
	coverTimer.setPositionNear(target);

	// Connect cover timer to previous action
	input(coverTimer);
	
	// Connect cover timer to next action
	return function(input) {
		coverTimer.addTarget(input);
	};
};
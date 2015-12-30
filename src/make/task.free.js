/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
const planAction = DATA.planAction;

// Make mission free flight task
module.exports = function makeTaskFree(flight) {
	
	const rand = this.rand;
	const plan = flight.plan;
	
	// FIXME: Random wait action
	plan.push({
		type: planAction.WAIT,
		time: rand.integer(60, 90)
	});
};
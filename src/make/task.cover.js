/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
const planAction = DATA.planAction;

// Make mission airfield cover task
module.exports = function makeTaskCover(flight) {
	
	const rand = this.rand;
	const plan = flight.plan;
	
	// FIXME: Random wait action
	plan.push({
		type: planAction.WAIT,
		time: rand.integer(60, 90),
		briefing: function() {
			return "···";
		}
	});
};
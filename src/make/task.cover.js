/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
const planAction = DATA.planAction;

// Make mission airfield cover task
module.exports = function makeTaskCover(flight) {
	
	const rand = this.rand;
	const plan = flight.plan;
	const airfield = this.airfields[flight.airfield];
	
	// Airfield cover plan action needs a valid beacon item
	if (!airfield.beacon) {
		return;
	}
	
	// Add cover plan action
	plan.push({
		type: planAction.COVER,
		target: airfield.beacon,
		time: rand.integer(90, 180),
		briefing: function() {
			return "···";
		}
	});
};